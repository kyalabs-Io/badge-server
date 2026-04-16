import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("node:os", () => ({
  homedir: vi.fn(() => "/tmp/test-home"),
}));

vi.mock("./storage.js", () => ({
  getStoredConsentKey: vi.fn(),
  getOrCreateInstallId: vi.fn(() => "inst-aaaa-bbbb-cccc-dddddddddddd"),
}));

vi.mock("./env.js", () => ({
  getEnvApiUrl: vi.fn(() => ""),
}));

import {
  enrollAndCacheBadgeToken,
  getCachedBadgeToken,
  _resetBadgeTokenCache,
} from "./badge-token.js";
import { getStoredConsentKey } from "./storage.js";

const mockGetKey = vi.mocked(getStoredConsentKey);
const mockExistsSync = vi.mocked(existsSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  _resetBadgeTokenCache();
  mockGetKey.mockReturnValue("pk_test_abc123");
  mockExistsSync.mockReturnValue(false);
  mockReadFileSync.mockReset();
  mockWriteFileSync.mockReset();
  mockMkdirSync.mockReset();
  mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("enrollAndCacheBadgeToken", () => {
  it("calls /api/badge/enroll and returns kya_* token", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        badge_token: "kya_abc123def456",
        merchant: "etsy.com",
        enrolled: true,
      }),
    });

    const token = await enrollAndCacheBadgeToken("etsy.com");
    expect(token).toBe("kya_abc123def456");

    // Verify the enroll API was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/badge/enroll");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.merchant).toBe("etsy.com");
    expect(body.install_id).toBe("inst-aaaa-bbbb-cccc-dddddddddddd");
  });

  it("caches token per merchant", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ badge_token: "kya_cached" }),
    });

    await enrollAndCacheBadgeToken("etsy.com");
    const cached = getCachedBadgeToken("etsy.com");
    expect(cached).toBe("kya_cached");
  });

  it("returns cached token on second call (no API hit)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        badge_token: "kya_first_call",
        expires_at: "2099-01-01T00:00:00.000Z",
      }),
    });

    await enrollAndCacheBadgeToken("etsy.com");
    const second = await enrollAndCacheBadgeToken("etsy.com");

    expect(second).toBe("kya_first_call");
    expect(mockFetch).toHaveBeenCalledTimes(1); // Only one API call
  });

  it("enrolls separately per merchant", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ badge_token: "kya_etsy" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ badge_token: "kya_walmart" }),
      });

    await enrollAndCacheBadgeToken("etsy.com");
    await enrollAndCacheBadgeToken("walmart.com");

    expect(getCachedBadgeToken("etsy.com")).toBe("kya_etsy");
    expect(getCachedBadgeToken("walmart.com")).toBe("kya_walmart");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("returns null on enroll API failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: "Rate limit exceeded" }),
    });

    const token = await enrollAndCacheBadgeToken("etsy.com");
    expect(token).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    const token = await enrollAndCacheBadgeToken("etsy.com");
    expect(token).toBeNull();
  });

  it("returns null when no consent key", async () => {
    mockGetKey.mockReturnValue(null);

    const token = await enrollAndCacheBadgeToken("etsy.com");
    expect(token).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("persists the badge token to ~/.kya/badge_tokens.json", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        badge_token: "kya_persisted",
        expires_at: "2099-01-01T00:00:00.000Z",
      }),
    });

    await enrollAndCacheBadgeToken("etsy.com");

    expect(mockMkdirSync).toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining(".kya/badge_tokens.json"),
      expect.stringContaining("\"inst-aaaa-bbbb-cccc-dddddddddddd:etsy.com\""),
      expect.objectContaining({ encoding: "utf-8" }),
    );
  });

  it("loads a persisted badge token after process restart without hitting the network", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        "inst-aaaa-bbbb-cccc-dddddddddddd:etsy.com": {
          token: "kya_from_disk",
          expiresAt: "2099-01-01T00:00:00.000Z",
        },
      }),
    );

    const token = await enrollAndCacheBadgeToken("etsy.com");

    expect(token).toBe("kya_from_disk");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("ignores expired persisted tokens and re-enrolls", async () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({
        "inst-aaaa-bbbb-cccc-dddddddddddd:etsy.com": {
          token: "kya_expired",
          expiresAt: "2000-01-01T00:00:00.000Z",
        },
      }),
    );
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        badge_token: "kya_fresh",
        expires_at: "2099-01-01T00:00:00.000Z",
      }),
    });

    const token = await enrollAndCacheBadgeToken("etsy.com");

    expect(token).toBe("kya_fresh");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("getCachedBadgeToken", () => {
  it("returns null for unknown merchant", () => {
    expect(getCachedBadgeToken("unknown.com")).toBeNull();
  });

  it("returns last enrolled merchant token when no merchant specified", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ badge_token: "kya_latest" }),
    });

    await enrollAndCacheBadgeToken("etsy.com");
    expect(getCachedBadgeToken()).toBe("kya_latest");
  });
});
