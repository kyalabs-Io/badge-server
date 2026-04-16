/**
 * Badge — the identity primitive for AI agents.
 *
 * Stateful wrapper around storage, guest-pass issuance, token management,
 * and telemetry. Framework-agnostic — no MCP dependency.
 *
 * Usage:
 *   const badge = await Badge.init()
 *   badge.headers()       // { "Kya-Token": "gp_v1_..." }
 *   badge.destroy()       // flush telemetry
 *
 * KYA-164
 */

import { randomUUID } from "node:crypto";
import { getOrCreateInstallId } from "./storage.js";
import { issueGuestPass, loadCachedGuestPass } from "./guest-pass.js";
import { inferContextFromUrl } from "./context-inference.js";
import { postDeclareVisit } from "./declare-visit.js";
import { postReportOutcome } from "./report-outcome.js";
import type {
  BadgeEventSource,
  BadgeOutcome,
  BadgeVisitContext,
  DeclareResult,
  FrictionReason,
  OutcomeResult,
} from "./types.js";

export type IdentityType = "guest" | "verified" | "offline";

export interface BadgeInitOptions {
  /** Override the auto-generated install_id (for Docker/CI where filesystem is ephemeral) */
  installId?: string;
  /**
   * Use an existing identity token instead of issuing a new guest pass.
   * Pass a `gp_v1_*` token from a Radar-issued `_kya_gp` cookie to preserve
   * the agent's Radar identity, or a pre-seeded `kya_*` badge token when the
   * caller already has a verified merchant credential.
   */
  existingToken?: string;
  /** Platform string for telemetry */
  platform?: string;
  /** Agent client identifier */
  agentClient?: string;
}

export class Badge {
  readonly identityType: IdentityType;
  readonly installId: string;
  readonly token: string;

  private constructor(
    identityType: IdentityType,
    installId: string,
    token: string,
  ) {
    this.identityType = identityType;
    this.installId = installId;
    this.token = token;
  }

  /** True if this is a guest (non-verified) identity */
  get isGuest(): boolean {
    return this.identityType === "guest" || this.identityType === "offline";
  }

  /**
   * Initialize a Badge instance. Issues a guest pass on first run ("SSN on birth").
   * Reuses cached guest pass when available.
   */
  static async init(opts?: BadgeInitOptions): Promise<Badge> {
    const installId = opts?.installId ?? getOrCreateInstallId();

    // Honor handed-off identity tokens without mutating local caches — the
    // caller already knows which credential should be presented for this run.
    if (opts?.existingToken?.startsWith("gp_v1_")) {
      return new Badge("guest", installId, opts.existingToken);
    }
    if (opts?.existingToken?.startsWith("kya_")) {
      return new Badge("verified", installId, opts.existingToken);
    }

    // Try cached guest pass first
    const cached = loadCachedGuestPass();
    if (cached) {
      return new Badge(cached.identityType, installId, cached.token);
    }

    // Issue fresh guest pass
    const gp = await issueGuestPass(installId, opts?.platform, opts?.agentClient);
    if (gp) {
      return new Badge(gp.identityType, installId, gp.token);
    }

    // Offline fallback — local-only identity
    return new Badge("offline", installId, `offline_${installId}`);
  }

  /** Get HTTP headers for identity injection */
  headers(): Record<string, string> {
    return { "Kya-Token": this.token };
  }

  /** Whether the agent should be nudged to upgrade to verified identity */
  shouldNudge(): boolean {
    // v1: no nudge logic — always false until trip count tracking lands
    return false;
  }

  /** Human-readable nudge message, or null if no nudge */
  nudgeMessage(): string | null {
    return this.shouldNudge() ? "Create an account to preserve your history." : null;
  }

  /** Flush pending telemetry and release resources */
  destroy(): void {
    // v1: no-op — telemetry flush will be wired in when reportEvent lands
  }

  startRun(): string {
    return randomUUID();
  }

  async declareVisit(args: {
    merchant: string;
    runId?: string;
    url?: string;
    context?: BadgeVisitContext;
    source?: BadgeEventSource;
  }): Promise<DeclareResult> {
    const runId = args.runId ?? this.startRun();
    const source = args.source ?? "sdk";
    if (this.identityType === "offline") {
      return {
        recordedAs: "offline",
        source,
        merchant: args.merchant,
        runId,
      };
    }

    const context = args.context ?? (args.url ? inferContextFromUrl(args.url) : undefined);
    return postDeclareVisit(this.token, {
      merchant: args.merchant,
      runId,
      ...(args.url ? { url: args.url } : {}),
      ...(context ? { context } : {}),
      source,
    });
  }

  async reportOutcome(args: {
    merchant: string;
    runId: string;
    outcome: BadgeOutcome;
    frictionReason?: FrictionReason;
    detail?: string;
    source?: BadgeEventSource;
  }): Promise<OutcomeResult> {
    if (this.identityType === "offline") {
      return {
        recordedAs: "offline",
        merchant: args.merchant,
        runId: args.runId,
      };
    }

    return postReportOutcome(this.token, {
      installId: this.installId,
      merchant: args.merchant,
      runId: args.runId,
      outcome: args.outcome,
      ...(args.frictionReason ? { frictionReason: args.frictionReason } : {}),
      ...(args.detail ? { detail: args.detail } : {}),
      ...(args.source ? { source: args.source } : {}),
    });
  }
}
