/**
 * kya_getHeaders — returns identity headers for browser automation.
 *
 * Agents using Playwright, Puppeteer, or Chrome extensions call this once
 * per session and attach the returned headers to their HTTP requests.
 */

import { getStoredConsentKey } from "../lib/storage.js";

export interface GetHeadersSuccess {
  headers: { "Kya-Token": string };
}

export interface GetHeadersError {
  error: string;
  code: string;
}

export type GetHeadersResult = GetHeadersSuccess | GetHeadersError;

/**
 * Return the identity headers for the current session.
 * Returns an error object (not throwing) if no identity is established.
 */
export function getHeaders(): GetHeadersResult {
  const token = getStoredConsentKey();
  if (!token) {
    return {
      error: "Call kya_getAgentIdentity first to establish identity",
      code: "NO_IDENTITY",
    };
  }

  return {
    headers: { "Kya-Token": token },
  };
}
