import { existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const kyaDir = join(homedir(), ".kya");
const targets = [
  join(kyaDir, "install_id"),
  join(kyaDir, "guest_token"),
  join(kyaDir, "badge_tokens.json"),
];

for (const target of targets) {
  if (!existsSync(target)) continue;
  rmSync(target);
  process.stdout.write(`removed ${target}\n`);
}
