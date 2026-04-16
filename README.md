# Badge by kya labs

Persistent identity for AI agents across merchant sites. Badge gives agents a credential they carry on every request — merchants verify it, trust accumulates across visits, and agents that build history earn better treatment over time.

Framework-agnostic. Transport-agnostic. Zero runtime dependencies.

---

## Badge SDK

The SDK is the primary integration surface. Three methods cover the full lifecycle:

```typescript
import { Badge } from "@kyalabs/badge-sdk";

const badge = await Badge.init();
const runId = badge.startRun();

await badge.declareVisit({
  merchant: "store.example.com",
  runId,
  url: "https://store.example.com/cart",
});

await badge.reportOutcome({
  merchant: "store.example.com",
  runId,
  outcome: "not_denied",
});
```

No signup. No API key. `Badge.init()` issues a guest pass on first run and caches it to disk. Identity survives process restarts.

```bash
npm install @kyalabs/badge-sdk
```

**[Full SDK documentation →](packages/sdk/README.md)**

### What the SDK covers

- **Identity model** — three-tier ladder: guest pass (`gp_v1_*`) → badge token (`kya_*`) → authenticated identity
- **Lifecycle tracking** — declare visits, report outcomes, correlate with run IDs
- **Offline resilience** — never throws on network failure, deterministic fallback on every call
- **UCP integration** — `io.kyalabs.common.identity` Credential Provider, published schemas, ES256-signed JWTs
- **Scoring** — outcomes feed kyaScore (500–850), portable across merchants

[![npm](https://img.shields.io/npm/v/@kyalabs/badge-sdk)](https://www.npmjs.com/package/@kyalabs/badge-sdk)

---

## Badge MCP Server

For MCP client users (Claude Desktop, Cursor, Windsurf), Badge also ships as an MCP tool server. The MCP server wraps the SDK — same identity model, same tokens, same scoring.

```bash
npx @kyalabs/badge
```

The SDK is the canonical integration path for platform builders and agent frameworks. The MCP server is a convenience wrapper for end users working within MCP clients.

[![npm](https://img.shields.io/npm/v/@kyalabs/badge)](https://www.npmjs.com/package/@kyalabs/badge)

---

## Links

- **Website:** [kyalabs.io](https://www.kyalabs.io)
- **Data practices:** [kyalabs.io/trust](https://www.kyalabs.io/trust)
- **UCP extension spec:** [github.com/kyalabs/ucp-agent-badge](https://github.com/kyalabs/ucp-agent-badge)
- **Contact:** agent_identity@kyalabs.io

## License

MIT
