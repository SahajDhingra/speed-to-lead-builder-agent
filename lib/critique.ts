import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  CritiqueSchema,
  type GeneratedSystem,
  type Lead,
  type SimResult,
  type Critique,
} from "./schemas";
import { LOOP_MODEL } from "./simulate";

const CRITIQUE_SYSTEM = `You are a critical evaluator of automated speed-to-lead \
systems for home-services companies.

Given a GeneratedSystem, a Lead, and the SimResult (how the system actually handled \
the lead), evaluate the system's performance on this specific lead:

grade (1–10):
  10 = perfect — right score, right routing, email is on-brand, accurate, and would \
       genuinely move this lead forward.
  7–9 = good with minor gaps.
  4–6 = passable but meaningful misses (wrong tone, missed routing signal, generic email).
  1–3 = significant failure (wrong routing, off-brand email, fabricated facts, \
         mishandled emergency).

reasoning: 2–4 sentences explaining the grade, specific to this lead and system — \
not generic observations.

improvements: 2–4 substantive, structural improvements. Rules:
  - For any grade below 8, you MUST propose at least 2 improvements that together \
    would plausibly raise the grade to 8+ if applied.
  - Target STRUCTURAL issues — routing rule gaps, qualification scoring miscalibrations, \
    email strategy mismatches, missing disqualifiers, wrong human-handoff thresholds. \
    Do NOT propose surface-level word tweaks or minor phrasing changes.
  - Each improvement must be complete and self-contained: another agent must be able to \
    apply it by replacing the exact target field with the exact change specified.
  - target: the exact field (e.g. "routingLogic[0].action", \
    "qualificationStrategy.scoringApproach", "firstTouchEmails.price_shopper.body", \
    "qualificationStrategy.questionsToAsk")
  - change: the full, specific replacement text or rule — not a direction like \
    "make it warmer", but the actual updated copy or logic
  - why: one sentence explaining what outcome this fixes for leads like this one

Only propose improvements that would genuinely change the system's behavior for leads \
like this one. Do not pad with generic suggestions.`;

export async function critiqueRun(
  system: GeneratedSystem,
  lead: Lead,
  simResult: SimResult
): Promise<Critique> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in the environment.");

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.parse({
    model: LOOP_MODEL,
    messages: [
      { role: "system", content: CRITIQUE_SYSTEM },
      {
        role: "user",
        content: `GENERATED SYSTEM:\n${JSON.stringify(system, null, 2)}\n\nLEAD:\n${JSON.stringify(lead, null, 2)}\n\nSIM RESULT:\n${JSON.stringify(simResult, null, 2)}`,
      },
    ],
    response_format: zodResponseFormat(CritiqueSchema, "critique"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error(
      completion.choices[0]?.message.refusal ?? "critiqueRun returned no result."
    );
  }

  return CritiqueSchema.parse({ ...parsed, leadId: lead.id });
}
