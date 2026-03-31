# @kyalabs/badge-sdk

Badge identity primitive for AI agents. Framework-agnostic — no MCP dependency.

## Install

```bash
npm install @kyalabs/badge-sdk
```

Requires Node.js >= 20.

## Quick Start

```typescript
import { Badge } from '@kyalabs/badge-sdk'

const badge = await Badge.init()

// Inject identity into outgoing requests
const headers = badge.headers()
// { "Kya-Token": "gp_v1_..." }

// Check identity state
badge.identityType  // "guest" | "verified" | "offline"
badge.isGuest       // true for guest/offline
badge.installId     // persistent UUID (stored in ~/.kya/)

// Clean up
badge.destroy()
```

## How It Works

On first run, `Badge.init()` issues a guest pass from the kya API ("SSN on birth"). The token and install ID are cached to `~/.kya/` so they persist across process restarts.

Agents carry their guest pass in the `Kya-Token` HTTP header. Merchants verify tokens via the [VerifAi API](https://www.kyalabs.io/docs). Guest passes can upgrade to verified badges through device auth or merchant enrollment.

### Identity Lifecycle

```
Badge.init()  →  guest pass (gp_v1_*)  →  enroll at merchant  →  badge token (kya_*)
                      ↑                         ↑
                 cached in ~/.kya/       requires consent key (pk_*)
```

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `KYA_API_URL` | API base URL | `https://www.kyalabs.io` |
| `KYA_API_KEY` | Consent key for enrollment (`pk_live_*` / `pk_test_*`) | — |
| `KYA_EXTENDED_AUTH` | Enable device auth flow (`true` / `1`) | `false` |

Legacy `PAYCLAW_*` prefixes are supported with a deprecation warning.

## API

### `Badge.init(opts?)`

Create a Badge instance. Issues a guest pass on first run, reuses cache on subsequent runs.

```typescript
const badge = await Badge.init({
  installId: 'custom-uuid',    // override auto-generated ID (for Docker/CI)
  platform: 'node/v20.0.0',   // platform string for telemetry
  agentClient: 'my-agent',    // agent identifier
})
```

### `badge.headers()`

Returns HTTP headers for identity injection:

```typescript
badge.headers()
// { "Kya-Token": "gp_v1_abc..." }
```

### `badge.identityType`

Current identity tier: `"guest"` (API-issued guest pass), `"verified"` (device auth completed), or `"offline"` (API unreachable, local-only).

### `badge.shouldNudge()`

Whether the agent should be prompted to upgrade identity. Returns `false` in v1.

### `enrollAndCacheBadgeToken(merchant)`

Enroll at a merchant and receive a `kya_*` badge token. Requires `KYA_API_KEY`.

```typescript
import { enrollAndCacheBadgeToken } from '@kyalabs/badge-sdk'

const token = await enrollAndCacheBadgeToken('store.example.com')
// "kya_abc123..."
```

**Important:** The badge token is only returned on the first enrollment per merchant per day. Re-enrollment on the same day returns `null` (the token hash is one-way). Persist the token from the first call.

### `issueGuestPass(installId, platform?, agentClient?, badgeVersion?)`

Low-level guest pass issuance. Returns `null` on failure (caller falls back to offline).

### `getCachedBadgeToken(merchant?)`

Retrieve a cached badge token. If no merchant specified, returns the most recently enrolled token.

## Credential Storage

Tokens are stored in `~/.kya/`:

```
~/.kya/
  install_id      # persistent UUID
  guest_token     # cached guest pass { token, expiresAt }
```

## License

MIT
