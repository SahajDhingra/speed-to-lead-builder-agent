import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  GeneratedSystemSchema,
  type GeneratedSystem,
  type Critique,
} from "./schemas";
import { LOOP_MODEL } from "./simulate";

// Schema for the LLM response — same shape as GeneratedSystem but without
// .default() on version (which doesn't translate cleanly to JSON schema).
const AppliedSystemSchema = z.object({
  clientName: z.string(),
  version: z.number(),
  generatedAt: z.string(),
  qualificationStrategy: GeneratedSystemSchema.shape.qualificationStrategy,
  firstTouchEmails: GeneratedSystemSchema.shape.firstTouchEmails,
  emailFlow: GeneratedSystemSchema.shape.emailFlow,
  routingLogic: GeneratedSystemSchema.shape.routingLogic,
  bookingCTA: z.string(),
  humanHandoffRules: z.array(z.string()),
});

const APPLY_SYSTEM = `You are a system-improvement agent for a speed-to-lead \
automation platform.

Given a GeneratedSystem and a list of approved improvements (each with a target \
field, the change to make, and the reason), produce an updated GeneratedSystem with \
every approved improvement applied. Rules:

- Apply each improvement precisely to the field named in "target".
- Do not change anything not covered by an approved improvement.
- Increment version by 1.
- Set generatedAt to the current ISO timestamp.
- Preserve all other fields exactly.
- Never invent facts, prices, contact details, or locations not present in the \
  original system.`;

export type ApprovedImprovement = Critique["improvements"][number];

export async function applyImprovements(
  system: GeneratedSystem,
  approvedImprovements: ApprovedImprovement[]
): Promise<GeneratedSystem> {
  if (approvedImprovements.length === 0) {
    return { ...system, version: system.version + 1, generatedAt: new Date().toISOString() };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in the environment.");

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.parse({
    model: LOOP_MODEL,
    messages: [
      { role: "system", content: APPLY_SYSTEM },
      {
        role: "user",
        content: `CURRENT SYSTEM:\n${JSON.stringify(system, null, 2)}\n\nAPPROVED IMPROVEMENTS:\n${JSON.stringify(approvedImprovements, null, 2)}`,
      },
    ],
    response_format: zodResponseFormat(AppliedSystemSchema, "applied_system"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    throw new Error(
      completion.choices[0]?.message.refusal ?? "applyImprovements returned no result."
    );
  }

  // Validate the assembled result against the canonical schema.
  return GeneratedSystemSchema.parse(parsed);
}
