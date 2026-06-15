import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingestClient } from "../lib/ingest";
import { generateSystem, GEN_MODEL } from "../lib/generate";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const rawPath = resolve(process.cwd(), "data/roofing-client.md");
  const rawText = readFileSync(rawPath, "utf8");

  console.error("Step 1/2: ingesting client profile…");
  const profile = await ingestClient(rawText);
  console.error(`  → profile for: ${profile.businessName}`);

  console.error(`Step 2/2: generating system with model ${GEN_MODEL}…`);
  const system = await generateSystem(profile);

  console.log(JSON.stringify(system, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
