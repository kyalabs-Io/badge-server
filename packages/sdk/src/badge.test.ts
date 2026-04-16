import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Badge } from "./badge.js";
import * as guestPass from "./guest-pass.js";
import { postDeclareVisit } from "./declare-visit.js";
import { postReportOutcome } from "./report-outcome.js";

vi.mock("./storage.js", () => ({
  getOrCreateInstallId: vi.fn(() => "inst-aaaa-bbbb-cccc-dddddddddddd"),
  getStoredConsentKey: vi.fn(() => null),
  storeConsentKey: vi.fn(),
  getAuthMode: vi.fn(() => "anonymous"),
  _resetInstallIdCache: vi.fn(),
}));

vi.mock("./guest-pass.js", () => ({
  issueGuestPass: vi.fn(async () => ({
    token: "gp_v1_test_token_abc123",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    identityType: "guest" as const,
  })),
  loadCachedGuestPass: vi.fn(() => null),
  cacheGuestPass: vi.fn(),
}));

vi.mock("./declare-visit.js", () => ({
  postDeclareVisit: vi.fn(async () => ({
    recordedAs: "declared" as const,
    source: "sdk" as const,
    merchant: "merchant.test",
    runId: "11111111-1111-4111-8111-111111111111",
  })),
}));

vi.mock("./report-outcome.js", () => ({
  postReportOutcome: vi.fn(async () => ({
    recordedAs: "reported" as const,
    merchant: "merchant.test",
    runId: "11111111-1111-4111-8111-111111111111",
  })),
}));

describe("Badge", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue({ ok: true });
    vi.mocked(guestPass.loadCachedGuestPass).mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Badge.init()", () => {
    it("creates a guest identity on init", async () => {
      const badge = await Badge.init();
      expect(badge.identityType).toBe("guest");
      expect(badge.installId).toBe("inst-aaaa-bbbb-cccc-dddddddddddd");
      expect(badge.token).toBe("gp_v1_test_token_abc123");
      expect(badge.isGuest).toBe(true);
    });

    it("uses provided installId when given", async () => {
      const badge = await Badge.init({ installId: "custom-id-1234" });
      expect(badge.installId).toBe("custom-id-1234");
    });

    it("reuses cached guest pass when available", async () => {
      vi.mocked(guestPass.loadCachedGuestPass).mockReturnValue({
        token: "gp_v1_cached_token",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        identityType: "guest" as const,
      });
      const badge = await Badge.init();
      expect(badge.token).toBe("gp_v1_cached_token");
      expect(guestPass.issueGuestPass).not.toHaveBeenCalled();
    });
  });

  describe("headers()", () => {
    it("returns Kya-Token header", async () => {
      const badge = await Badge.init();
      const headers = badge.headers();
      expect(headers).toEqual({ "Kya-Token": "gp_v1_test_token_abc123" });
    });
  });

  describe("shouldNudge()", () => {
    it("returns false for fresh agent", async () => {
      const badge = await Badge.init();
      expect(badge.shouldNudge()).toBe(false);
    });
  });

  describe("nudgeMessage()", () => {
    it("returns null for fresh agent", async () => {
      const badge = await Badge.init();
      expect(badge.nudgeMessage()).toBeNull();
    });
  });

  describe("destroy()", () => {
    it("does not throw", async () => {
      const badge = await Badge.init();
      expect(() => badge.destroy()).not.toThrow();
    });
  });

  describe("X1 lifecycle methods", () => {
    it("startRun returns a UUID", async () => {
      const badge = await Badge.init();
      expect(badge.startRun()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("declareVisit forwards the badge token and inferred context", async () => {
      const badge = await Badge.init({ existingToken: "kya_test123abc" });

      await badge.declareVisit({
        merchant: "merchant.test",
        runId: "11111111-1111-4111-8111-111111111111",
        url: "https://merchant.test/cart",
      });

      expect(postDeclareVisit).toHaveBeenCalledWith(
        "kya_test123abc",
        expect.objectContaining({
          merchant: "merchant.test",
          runId: "11111111-1111-4111-8111-111111111111",
          context: "addtocart",
        }),
      );
    });

    it("reportOutcome forwards the installId and badge token", async () => {
      const badge = await Badge.init({ existingToken: "kya_test123abc" });

      await badge.reportOutcome({
        merchant: "merchant.test",
        runId: "11111111-1111-4111-8111-111111111111",
        outcome: "not_denied",
      });

      expect(postReportOutcome).toHaveBeenCalledWith(
        "kya_test123abc",
        expect.objectContaining({
          installId: "inst-aaaa-bbbb-cccc-dddddddddddd",
          merchant: "merchant.test",
          runId: "11111111-1111-4111-8111-111111111111",
          outcome: "not_denied",
        }),
      );
    });
  });

  describe("Badge.init with existingToken", () => {
    it("uses existingToken when provided with gp_v1_ prefix", async () => {
      const badge = await Badge.init({ existingToken: "gp_v1_test123abc" });
      expect(badge.token).toBe("gp_v1_test123abc");
      expect(badge.identityType).toBe("guest");
      expect(badge.isGuest).toBe(true);
    });

    it("uses existingToken when provided with kya_ prefix", async () => {
      const badge = await Badge.init({ existingToken: "kya_test123abc" });
      expect(badge.token).toBe("kya_test123abc");
      expect(badge.identityType).toBe("verified");
      expect(badge.isGuest).toBe(false);
    });

    it("ignores existingToken without gp_v1_ prefix", async () => {
      const badge = await Badge.init({ existingToken: "invalid_token_format" });
      expect(badge.token).not.toBe("invalid_token_format");
    });

    it("combines existingToken with custom installId", async () => {
      const badge = await Badge.init({
        existingToken: "gp_v1_xyz789",
        installId: "custom-id-123",
      });
      expect(badge.token).toBe("gp_v1_xyz789");
      expect(badge.installId).toBe("custom-id-123");
    });

    it("does not cache existingToken (unknown TTL)", async () => {
      await Badge.init({ existingToken: "gp_v1_cached_token" });
      expect(guestPass.cacheGuestPass).not.toHaveBeenCalled();
    });

    it("does not call issueGuestPass when existingToken is valid", async () => {
      vi.mocked(guestPass.issueGuestPass).mockClear();
      await Badge.init({ existingToken: "gp_v1_skip_issue" });
      expect(guestPass.issueGuestPass).not.toHaveBeenCalled();
    });

    it("does not call issueGuestPass when existing badge token is valid", async () => {
      vi.mocked(guestPass.issueGuestPass).mockClear();
      await Badge.init({ existingToken: "kya_skip_issue" });
      expect(guestPass.issueGuestPass).not.toHaveBeenCalled();
    });
  });
});
