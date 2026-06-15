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

improvements: 1–4 targeted, actionable improvement objects. Each must specify:
  - target: the exact field or component to change (e.g. "emailFlow[0].body", \
    "routingLogic", "qualificationStrategy.scoringApproach", \
    "qualificationStrategy.questionsToAsk")
  - change: the specific change to make (concrete enough that another agent could \
    apply it without ambiguity)
  - why: one sentence grounding the improvement in this lead's outcome

Only propose improvements that would genuinely improve handling of leads like this one. \
Do not pad with generic suggestions. If the system handled the lead well, propose \
0–1 minor refinements.`;

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
