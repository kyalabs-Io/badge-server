import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../lib/storage.js", () => ({
  getStoredConsentKey: vi.fn(),
  getOrCreateInstallId: vi.fn(() => "inst-aaaa-bbbb-cccc-dddddddddddd"),
}));

import { getHeaders } from "./getHeaders.js";
import { getStoredConsentKey } from "../lib/storage.js";

const mockGetKey = vi.mocked(getStoredConsentKey);

describe("getHeaders", () => {
  const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns Kya-Token header when identity is established", () => {
    mockGetKey.mockReturnValue("pk_test_abc123");
    const result = getHeaders();
    expect(result).toEqual({
      headers: { "Kya-Token": "pk_test_abc123" },
    });
  });

  it("returns NO_IDENTITY error when no consent key", () => {
    mockGetKey.mockReturnValue(null);
    const result = getHeaders();
    expect(result).toEqual({
      error: "Call kya_getAgentIdentity first to establish identity",
      code: "NO_IDENTITY",
    });
  });

  it("does not log the token value to stderr", () => {
    mockGetKey.mockReturnValue("pk_test_secret_value");
    getHeaders();
    const stderrOutput = stderrSpy.mock.calls.map((c) => String(c[0])).join("");
    expect(stderrOutput).not.toContain("pk_test_secret_value");
  });
});
