import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingestClient } from "../lib/ingest";
import { generateSystem } from "../lib/generate";
import { simulateLead, LOOP_MODEL } from "../lib/simulate";
import { critiqueRun } from "../lib/critique";
import { LeadSchema, type Lead } from "../lib/schemas";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  // ---- Ingest ------------------------------------------------------------
  console.error("\n[1/3] Ingesting client profile…");
  const rawText = readFileSync(resolve(process.cwd(), "data/roofing-client.md"), "utf8");
  const profile = await ingestClient(rawText);
  console.error(`  → ${profile.businessName}`);

  // ---- Generate ----------------------------------------------------------
  console.error("\n[2/3] Generating system…");
  const system = await generateSystem(profile);
  console.error(`  → v${system.version}, ${system.emailFlow.length} email steps, ${system.routingLogic.length} routing rules`);

  // ---- Simulate + Critique -----------------------------------------------
  console.error(`\n[3/3] Simulating ${6} leads with model ${LOOP_MODEL}…`);
  const leadsRaw = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/test-leads.json"), "utf8")
  );
  const leads: Lead[] = leadsRaw.map((l: unknown) => LeadSchema.parse(l));

  const results: Array<{ lead: Lead; score: number; routing: string; grade: number; improvements: unknown[] }> = [];

  for (const lead of leads) {
    console.error(`  → ${lead.id} (${lead.name})…`);
    const simResult = await simulateLead(system, lead);
    const critique = await critiqueRun(system, lead, simResult);

    results.push({
      lead,
      score: simResult.qualificationScore,
      routing: simResult.routingAction,
      grade: critique.grade,
      improvements: critique.improvements,
    });

    console.error(
      `     score=${simResult.qualificationScore}  grade=${critique.grade}/10  improvements=${critique.improvements.length}`
    );
  }

  // ---- Summary -----------------------------------------------------------
  console.log("\n=== SIMULATION + CRITIQUE RESULTS ===\n");
  for (const r of results) {
    console.log(`Lead: ${r.lead.id} — ${r.lead.name}`);
    console.log(`  Score : ${r.score}/100`);
    console.log(`  Grade : ${r.grade}/10`);
    console.log(`  Routing: ${r.routing}`);
    if (r.improvements.length > 0) {
      console.log("  Improvements:");
      for (const imp of r.improvements as Array<{ target: string; change: string; why: string }>) {
        console.log(`    [${imp.target}] ${imp.change}`);
        console.log(`      why: ${imp.why}`);
      }
    }
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
