import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  SimResultSchema,
  type GeneratedSystem,
  type Lead,
  type SimResult,
} from "./schemas";

export const LOOP_MODEL = "gpt-4o-mini";

const GROUNDING_RULE = `Grounding rule: fill {placeholders} in emails using only \
data present in the lead. If a placeholder has no value in the lead, leave the \
placeholder token as-is. Never invent contact details, prices, or facts not in the \
system or lead.`;

const SIMULATE_SYSTEM = `You are simulating a speed-to-lead system processing a \
single inbound lead.

Given a GeneratedSystem and a Lead, produce a SimResult:

1. qualificationScore (0–100): Apply the system's scoringApproach to this specific \
   lead. 80–100 = hot (in-area, insurance/storm, owner, urgent). 50–79 = warm (some \
   signals present, gaps remain). 20–49 = cold (low-value, vague, or wrong job type). \
   0–19 = disqualify (out-of-area, renter, deductible-waiver request, spam).

2. routingAction: Select and state the single most applicable routing rule from \
   routingLogic, verbatim, adapted to this lead's specifics.

3. firstEmailSent: Classify this lead into exactly one bucket key based on their \
   message and routingAction:
   - "emergency"       — active leak, water intrusion, roof damage actively causing harm
   - "insurance_storm" — storm/hail damage, insurance claim, adjuster involved
   - "high_value"      — full replacement, large project, high spend signals
   - "out_of_area"     — location outside the service area
   - "price_shopper"   — primary concern is cost, asking for quote/price comparison
   - "vague"           — unclear intent, minimal information provided

   Look up system.firstTouchEmails[selectedBucket] to get {subject, body}. Fill every \
   {placeholder} from lead data where available, leave the token as-is if absent. \
   Output as: "Subject: <subject>\\n\\n<body with placeholders filled>".

${GROUNDING_RULE}`;

export async function simulateLead(
  system: GeneratedSystem,
  lead: Lead
): Promise<SimResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in the environment.");

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.parse({
    model: LOOP_MODEL,
    messages: [
      { role: "system", content: SIMULATE_SYSTEM },
      {
        role: "user",
        content: `GENERATED SYSTEM:\n${JSON.stringify(system, null, 2)}\n\nLEAD:\n${JSON.stringify(lead, null, 2)}`,
      },
    ],
    response_format: zodResponseFormat(SimResultSchema, "sim_result"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error(
      completion.choices[0]?.message.refusal ?? "simulateLead returned no result."
    );
  }

  return SimResultSchema.parse({ ...parsed, leadId: lead.id });
}
