import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BadgeApiError } from "./api/client.js";
import { postReportOutcome } from "./report-outcome.js";

describe("postReportOutcome", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("always sends sampling_complete over the anonymous report path", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "recorded", event_type: "sampling_complete" }),
    });

    const result = await postReportOutcome("kya_test_123", {
      installId: "550e8400-e29b-41d4-a716-446655440000",
      merchant: "merchant.test",
      runId: "11111111-1111-4111-8111-111111111111",
      outcome: "not_denied",
    });

    expect(result.recordedAs).toBe("reported");
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://www.kyalabs.io/api/badge/report");
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(JSON.parse(init.body as string)).toMatchObject({
      event_type: "sampling_complete",
      install_id: "550e8400-e29b-41d4-a716-446655440000",
      trip_id: "11111111-1111-4111-8111-111111111111",
      outcome: "not_denied",
      outcome_source: "explicit",
    });
  });

  it("passes frictionReason through without validating it", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: "recorded", event_type: "sampling_complete" }),
    });

    await postReportOutcome("kya_test_123", {
      installId: "550e8400-e29b-41d4-a716-446655440000",
      merchant: "merchant.test",
      runId: "11111111-1111-4111-8111-111111111111",
      outcome: "denied",
      frictionReason: "merchant_rejection",
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).friction_reason).toBe("merchant_rejection");
  });

  it("throws when runId is missing", async () => {
    await expect(
      postReportOutcome("kya_test_123", {
        installId: "550e8400-e29b-41d4-a716-446655440000",
        merchant: "merchant.test",
        runId: "",
        outcome: "not_denied",
      }),
    ).rejects.toThrow("runId is required");
  });

  it("returns offline on timeout", async () => {
    const abortError = new Error("timed out");
    abortError.name = "AbortError";
    mockFetch.mockRejectedValue(abortError);

    const result = await postReportOutcome("kya_test_123", {
      installId: "550e8400-e29b-41d4-a716-446655440000",
      merchant: "merchant.test",
      runId: "11111111-1111-4111-8111-111111111111",
      outcome: "not_denied",
    });

    expect(result.recordedAs).toBe("offline");
  });

  it("returns offline on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    const result = await postReportOutcome("kya_test_123", {
      installId: "550e8400-e29b-41d4-a716-446655440000",
      merchant: "merchant.test",
      runId: "11111111-1111-4111-8111-111111111111",
      outcome: "not_denied",
    });

    expect(result.recordedAs).toBe("offline");
  });

  it("surfaces 4xx responses as BadgeApiError", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: "bad request" }),
    });

    await expect(
      postReportOutcome("kya_test_123", {
        installId: "550e8400-e29b-41d4-a716-446655440000",
        merchant: "merchant.test",
        runId: "11111111-1111-4111-8111-111111111111",
        outcome: "not_denied",
      }),
    ).rejects.toBeInstanceOf(BadgeApiError);
  });
});
