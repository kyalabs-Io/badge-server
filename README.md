# Badge by kya labs

**Your agent isn't a bot. kya proves it.**

Your AI agent looks like a bot to every merchant on the internet. Badge gives it a way to declare what it is: an authorized actor, shopping on behalf of a real human, with explicit consent.

If you're like 20% of Americans last year - you used an agent to shop. And you probably ran into a ton of login walls, workarounds, bumps? 

So did we. So we created Badge - the first MCP tool that works with the new Universal Commerce Protocol to easily handshake verified agents at supporting merchants (Shopify, Target, Walmart, Etsy... it's a lot)

One MCP tool call. Your agent declares itself. Merchants let it through.

---

## Quick Start

Add to your MCP client config:

```bash
npx @kyalabs/badge
```

OR

```json
{
  "mcpServers": {
    "kyalabs-badge": {
      "command": "npx",
      "args": ["@kyalabs/badge"]
    }
  }
}
```

That's it. No API key. No signup. No network calls on install.

The first time your agent calls `kya_getAgentIdentity`, Badge activates — your agent declares itself to the merchant and gets back a response with instructions for the next step. One anonymous event is recorded: this install visited this merchant at this time.

### Upgrade to enrolled mode

To enroll at merchants and build trust history (kyaScore), add an API key:

```json
"env": {
  "KYA_API_KEY": "pk_live_your_key_here"
}
```

Get your API key at [kyalabs.io/signup](https://kyalabs.io/signup). API keys don't expire.

Without an API key, Badge uses device auth when a merchant requires verified identity — your agent shows a code and URL, you approve on your phone. This only happens when a merchant asks for it. We never ask for it ourselves. Sign up + API key means 1. you don't have to use phone OAuth every time and 2. you can track your agentic shopping (custom avatars included)

### Node version

Badge requires **Node.js 20 or newer**. Node 18 is end-of-life and unsupported.

If you see engine or compatibility errors: `node -v` — install Node 20+ from [nodejs.org](https://nodejs.org/) or `nvm install 20`.

---

## How Badge Works: Identity Tiers

### Guest (default)

First time your agent calls `kya_getAgentIdentity`, Badge generates an anonymous install ID (random UUID stored locally at `~/.kya/install_id`) and issues a guest pass (`gp_v1_*`). No connection to you, your device, or any personal information.

Your agent carries the guest pass in the `Kya-Token` HTTP header on every request. Merchants running VerifAi middleware can see your agent, verify it, and route it. This is the default mode. It's how Badge works out of the box, for every user, forever.

### Enrolled (per merchant)

When your agent visits a merchant, it can enroll for a merchant-specific badge token (`kya_*`). This upgrades the agent from "anonymous guest" to "declared actor at this store." Each merchant enrollment builds trust history that feeds into kyaScore (500-850 behavioral trust score).

### Verified (when merchant requires it)

When a merchant requires verified identity, your agent will ask you to approve a device flow. You visit a URL, enter the code from your agent, and prove you're a real person. No login or PII needed.

---

## Our Data Philosophy

| When | What | Why |
|------|------|-----|
| **On install** | Nothing | We help agents shop. If they're not shopping, we don't need anything |
| **On server start** | Anonymous ping — Badge version and MCP client name. No identifiers stored on your machine | So we know Badge is actively running. If this number ever diverges from active agents, it tells us something is broken in the pipeline — not something about you |
| **On first shopping trip** | install_id (random UUID, stored locally at `~/.kya/install_id`), merchant, agent_type, event_type, timestamp | Minimum viable signal to reduce agent friction at merchants |
| **On verified identity** | + hashed user token, intent scope (checkout, etc.) | Only required where login is traditionally required (i.e. checkout) to prove there's a real person authorizing the agent's next step |

The server start ping contains no persistent identifiers — a new random session ID is generated
each time and never saved to disk. You can disable it entirely:

```json
"env": { "KYA_PING": "false" }
```

The install_id is a file we wrote to your disk. You can delete it (`rm ~/.kya/install_id`) and get a new one.

Full data practices: [kyalabs.io/trust](https://kyalabs.io/trust)

---

## The Universal Commerce Protocol

Badge is a [UCP (Universal Commerce Protocol)](https://ucp.dev) Credential Provider. Merchants who declare the kya identity extension signal to every UCP-compliant agent that authorized agents are preferred at their store.

When your agent encounters a UCP merchant with Badge installed, it presents a cryptographic badge automatically — no extra steps.

We believe the UCP is the future of commerce and are proud to support reduce friction for agents and users. 

- Extension spec + schema: [github.com/kyalabs/ucp-agent-badge](https://github.com/kyalabs/ucp-agent-badge)
- Read more about the UCP: [github.com/universal-commerce-protocol/ucp](https://github.com/universal-commerce-protocol/ucp)

**Without Badge:** Your agent hits a merchant → bot detection fires → blocked. Task fails. Your user is disappointed. The merchant lost a sale and doesn't know it.

**With Badge:** Your agent calls `kya_getAgentIdentity` → declares itself → merchants see an authorized actor. Your agent gets through. Task succeeds.

---

## Tools

| Tool | Description |
|------|-------------|
| `kya_getAgentIdentity` | Get your agent's identity token + `next_step` guidance |
| `kya_web_fetch` | Fetch a URL with Badge identity headers attached automatically |
| `kya_getHeaders` | Get identity headers (`Kya-Token`) for manual HTTP requests |

Every tool call works immediately — no auth required. Events fire in both guest and verified modes.

### Legacy Tools (deprecating)

These tools still work but are no longer needed — Badge 2.0 handles reporting automatically via the `Kya-Token` header.

| Tool | Description |
|------|-------------|
| `kya_reportBadgePresented` | Signal that you presented your Badge to a merchant |
| `kya_reportBadgeOutcome` | Report whether merchant accepted or denied the badge |
| `kya_reportBadgeNotPresented` | Report that the badge was not presented |

### Extended Auth (optional)

When enabled, kya checks back with your agent after each badge presentation to confirm whether the merchant accepted or denied. Results are logged to your dashboard.

```json
"env": {
  "KYA_EXTENDED_AUTH": "true"
}
```

---

## What's New (v2.6)

| Capability | Description |
|---|---|
| Guest pass identity | `Badge.init()` issues a guest pass (`gp_v1_*`) automatically. Your agent has identity from the first call — no signup, no auth. |
| `Kya-Token` header | Your agent carries identity on every HTTP request via `kya_web_fetch` or manual header attachment. Merchants verify server-side. |
| kyaScore (500-850) | Behavioral trust score replacing static tiers. Five bands: Restricted / Provisional / Baseline / Established / Elite. Builds from your agent's declaration and enrollment history. |
| Merchant signal awareness | `kya_getAgentIdentity` detects whether a merchant has active kya infrastructure. Returned as `merchant_signals` in the identity result. |
| `next_step` field | Every `kya_getAgentIdentity` response includes guidance for the agent's next action. |
| `kya_web_fetch` + `kya_getHeaders` | Two new tools for carrying identity outside MCP — fetch with headers attached, or get headers for your own HTTP client. |

---

## Need Payment Too?

Badge is the base layer. For virtual Visa cards, use [@kyalabs/mcp-server](https://www.npmjs.com/package/@kyalabs/mcp-server) — which includes Badge automatically.

```bash
npx @kyalabs/mcp-server
```

## Badge SDK (for platform builders)

Building an agent framework, MCP server, or browser automation tool? Use the SDK directly — no MCP dependency:

```bash
npm install @kyalabs/badge-sdk
```

See [@kyalabs/badge-sdk](https://www.npmjs.com/package/@kyalabs/badge-sdk) for the programmatic API.

## KYA — Know Your Agent

kya is KYA infrastructure. Every declaration creates a verified record of agentic commerce behavior — building the trust signal that merchants need to tell authorized agents from anonymous bots.

## Links

- **Website:** [kyalabs.io](https://kyalabs.io)
- **npm:** [@kyalabs/badge](https://www.npmjs.com/package/@kyalabs/badge)
- **UCP Extension:** [github.com/kyalabs/ucp-agent-badge](https://github.com/kyalabs/ucp-agent-badge)
- **ClawHub:** [kyalabs-badge](https://clawhub.com/skills/kyalabs-badge)
- **Trust:** [kyalabs.io/trust](https://kyalabs.io/trust)
- **Merchants:** [kyalabs.io/merchants](https://kyalabs.io/merchants)
- **Contact:** agent_identity@kyalabs.io

---

*Agents are not bots. kya labs proves it.*
