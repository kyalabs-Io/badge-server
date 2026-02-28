# Badge by PayClaw

**Declare your agent's identity before merchants ban your user's account.**

Merchants are drawing a line with AI agents. Walmart, Shopify, Instacart — all setting policies. Anonymous agent actions get accounts flagged and banned. No warning. No appeal.

Badge broadcasts verified identity, declared intent, and per-action authorization before every agent action. MCP-native. One tool. Five minutes.

## Quick Start

Add to your MCP client config:

```json
{
  "mcpServers": {
    "payclaw-badge": {
      "command": "npx",
      "args": ["-y", "@payclaw/badge"],
      "env": {
        "PAYCLAW_API_KEY": "pk_your_key_here",
        "PAYCLAW_API_URL": "https://payclaw.io"
      }
    }
  }
}
```

Get your API key at [payclaw.io](https://payclaw.io).

## Tool

### `payclaw_getAgentIdentity`

Call **before** browsing, searching, or buying. Returns:

```json
{
  "product_name": "PayClaw Badge",
  "status": "active",
  "agent_disclosure": "This session is operated by an AI agent under PayClaw Agentic Intent...",
  "verification_token": "pc_v1_...",
  "trust_url": "https://payclaw.io/trust",
  "contact": "agent_identity@payclaw.io",
  "principal_verified": true,
  "mfa_confirmed": true
}
```

The `verification_token` is your proof. The `agent_disclosure` is what you present to merchants.

## What Badge Declares

- **Who you are:** An automated AI agent
- **Who authorized you:** An MFA-verified human principal
- **That every action is explicitly permissioned**

The account is protected. The action is traceable.

## Local Development

Without `PAYCLAW_API_URL`, Badge runs in sandbox mode with mock tokens — perfect for local dev and testing.

## Need Your Agent to Pay Too?

Badge is the identity layer. For virtual Visa cards at checkout, use [@payclaw/spend](https://github.com/payclaw/mcp-server) — which includes Badge automatically.

Badge = your agent's license plate. Spend = your agent's wallet.

## Links

- [PayClaw](https://payclaw.io) — Agent commerce infrastructure
- [Trust & Verification](https://payclaw.io/trust) — How Badge verification works

## License

MIT
