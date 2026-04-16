/** Shared identity response shape — used by both badge-server and mcp-server. */
export interface AgentIdentityResponse {
  agent_disclosure: string;
  verification_token: string;
  trust_url: string;
  contact: string;
  principal_verified: boolean;
  mfa_confirmed?: boolean;
}

export type BadgeVisitContext = "arrival" | "addtocart" | "checkout";

export type BadgeEventSource = "sdk" | "mcp" | "radar" | "inferred";

export type BadgeRecordedAs = "declared" | "reported" | "offline";

export type BadgeOutcome = "not_denied" | "denied" | "unparseable";

export type FrictionReason =
  | "auth_required"
  | "bot_challenge"
  | "merchant_rejection"
  | "other"
  | (string & {});

export interface DeclareResult {
  recordedAs: BadgeRecordedAs;
  source: BadgeEventSource;
  merchant: string;
  runId: string;
  sessionToken?: string;
}

export interface OutcomeResult {
  recordedAs: BadgeRecordedAs;
  merchant: string;
  runId: string;
}
