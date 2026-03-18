# Code Sync Contract

`@kyalabs/badge` and `@kyalabs/mcp-server` share ~60% of source code. This document defines canonical ownership to prevent divergence.

## Canonical Ownership

### badge-server owns (copy TO mcp-server)

| File | Notes |
|------|-------|
| `src/lib/env.ts` | KYA_*/PAYCLAW_* env var resolution with deprecation warnings |
| `src/lib/device-auth.ts` | fetchWithTimeout, HTTPS validation, interval sanitization |
| `src/lib/storage.ts` | Shared auth storage |
| `src/lib/report-badge.ts` | Badge reporting |
| `src/lib/parse-outcome.ts` | Outcome parsing |
| `src/lib/report-badge-presented-handler.ts` | Badge presentation handler |
| `src/lib/signal-status.ts` | v2.3: SignalStatus + fetchSignalStatus (3s timeout, graceful null) |

### mcp-server owns (copy TO badge-server)

| File | Notes |
|------|-------|
| `src/tools/getAgentIdentity.ts` | Superset — has spend fields + pendingActivation dedup |
| `src/sampling.ts` | Has VITEST guard + test helpers |
| `src/api/client.ts` | Has spend endpoints (structurally different) |

## Sync Process

1. Make changes in the **canonical** repo
2. Copy the file to the other repo
3. Adjust import paths if needed (usually identical)
4. Run `npm run build && npm test` in both repos
5. Update the `Synced:` version in file headers

## Header Format

Shared files carry a header comment:
```typescript
// Canonical: badge-server | Synced: 0.7.3 | Do not edit in mcp-server
```

## Version

Last sync: **2.3.0** (v2.2 assurance_level + v2.3 signal awareness, 2026-03-17)

### v2.3.0 Changes
- `sampling.ts`: Added `assuranceLevelStore`, `registerTripAssuranceLevel()`, `assuranceLevel` field in `ActiveTrip`, `assurance_level` in both report payloads, `assuranceLevelStore.clear()` in `resetSamplingState`
- `signal-status.ts` (NEW): Canonical in badge-server — `SignalStatus` interface + `fetchSignalStatus()` (3s timeout, graceful null). Synced copy in mcp-server.
- `getAgentIdentity.ts`: **Not synced** — divergent in both repos. v2.2: added `introspectBadgeToken` call + `registerTripAssuranceLevel`. v2.3: added `fetchSignalStatus` + `fireSignalContextReceived` + `extractDomain`.

### v2.0.0 Changes
- `storage.ts`: Added `getOrCreateInstallId()`, `_resetInstallIdCache()`
- `report-badge.ts`: Removed `if (!key) return;` silent gates, added enrichment branching (anonymous + authenticated)
- `sampling.ts`: Removed `if (!key) return;` in `reportOutcome()`, added anonymous enrichment branching
- `getAgentIdentity.ts`: **Not synced** — edited independently in both repos. Added `browse_declared` auto-fire, `next_step` field, dedup
