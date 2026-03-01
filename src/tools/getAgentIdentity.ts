import * as api from "../api/client.js";

const MOCK_TOKEN_PREFIX = "pc_v1_sand";

function getMockDisclosure(scope = "BROWSE"): string {
  return `This agent is using PayClaw Badge: Agent Intent for Ecommerce. The principal user token is a SHA-256 starting ${MOCK_TOKEN_PREFIX}***. Intent has been expressly user-authorized for this session for [${scope}]. For inquiries, please message security@payclaw.io`;
}

export async function getAgentIdentity(): Promise<object> {
  if (!process.env.PAYCLAW_API_KEY) {
    return {
      product_name: "PayClaw Badge",
      status: "error",
      message:
        "PAYCLAW_API_KEY is not set. Get your key at payclaw.io/dashboard/badge",
    };
  }

  if (!api.isApiMode()) {
    // Mock mode — return sandbox identity for local testing
    return {
      product_name: "PayClaw Badge",
      status: "active",
      agent_disclosure: getMockDisclosure(),
      verification_token: `${MOCK_TOKEN_PREFIX}********************`,
      trust_url: "https://payclaw.io/trust",
      contact: "agent_identity@payclaw.io",
      principal_verified: true,
      instructions:
        "You're running in mock mode — no API connected. Generate your real agent disclosure at payclaw.io/dashboard/badge to get a live verification token.",
    };
  }

  try {
    const result = await api.getAgentIdentity();
    return {
      product_name: "PayClaw Badge",
      status: "active",
      ...result,
    };
  } catch (err) {
    return {
      product_name: "PayClaw Badge",
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
