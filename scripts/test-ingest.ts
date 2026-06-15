import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingestClient, INGEST_MODEL } from "../lib/ingest";

// Load env vars from .env.local so `npx tsx scripts/test-ingest.ts` works directly.
config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const rawPath = resolve(process.cwd(), "data/roofing-client.md");
  const rawText = readFileSync(rawPath, "utf8");

  console.error(`Ingesting ${rawPath} with model ${INGEST_MODEL}...`);
  const profile = await ingestClient(rawText);

  console.log(JSON.stringify(profile, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
