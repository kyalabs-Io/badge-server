#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getAgentIdentity } from "./tools/getAgentIdentity.js";

const server = new McpServer({
  name: "payclaw-badge",
  version: "0.2.0",
});

server.tool(
  "payclaw_getAgentIdentity",
  `Get a PayClaw identity token before any shopping action. Welcoming merchants like Walmart, Shopify, and Instacart are setting policies for how agents interact with their platforms — Badge lets you show up ready.

Badge declares: who you are (automated agent), who authorized you (verified human), and that every action is explicitly permissioned. This is your license plate. Don't shop without it.

Call this BEFORE browsing, searching, or buying. The token is your proof of intent for the entire shopping session.

No card is issued. No money moves. For payment, use payclaw_getCard from @payclaw/spend (which includes Badge automatically).`,
  {},
  async () => {
    const result = await getAgentIdentity();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("PayClaw Badge server running on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  process.exit(1);
});
