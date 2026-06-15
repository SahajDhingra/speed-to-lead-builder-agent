import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ClientProfileSchema, type ClientProfile } from "./schemas";

/** Model used for the ingestion stage. Swap here to change models everywhere. */
export const INGEST_MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `You are an ingestion engine for an AI agency. You receive the raw, messy,
multi-source business context for a single home-services company (website copy,
a services and pricing sheet, scattered operational notes, FAQs) and you turn it
into one clean, structured ClientProfile.

Rules:
- Extract faithfully. Use only what the source supports. Do not invent prices,
  services, locations, or policies that aren't in the data.
- Where information is implicit rather than stated, infer carefully and
  conservatively. Derive the brand voice from how the company actually writes,
  not from generic adjectives.
- The qualification section is the most important and requires real judgment.
  Determine what a genuinely high-value lead looks like for THIS specific business
  versus a low-value or disqualifying one, reasoning from their services, pricing,
  service area, and stated ideal customer. Be concrete to a roofing business: job
  value, insurance vs cash work, urgency, property type, location. No vague
  generalities.
- For high-intent signals, identify the concrete cues in an inbound message that
  mark a serious, valuable lead.
- Keep every field specific to this company. A profile that could describe any
  roofer is a failure.

Grounding rule (critical): There is a difference between synthesizing judgment and
fabricating facts. You MAY infer judgment-based fields — brand voice, ideal-lead
profile, high-intent signals — from the overall text. You must NEVER fabricate a
discrete factual data point — contact details (email, phone, website), specific
prices, service names, or locations — that is not stated in the source. For any such
field not present in the source, return null. Returning null is always correct when
the source is silent; guessing a specific fact is always wrong.

Return only the structured ClientProfile.`;

/**
 * Ingests raw, multi-source client context and returns a schema-validated
 * ClientProfile using OpenAI structured outputs.
 */
export async function ingestClient(rawText: string): Promise<ClientProfile> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in the environment.");
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.parse({
    model: INGEST_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: rawText },
    ],
    response_format: zodResponseFormat(ClientProfileSchema, "client_profile"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) {
    const refusal = completion.choices[0]?.message.refusal;
    throw new Error(
      refusal
        ? `Model refused to produce a ClientProfile: ${refusal}`
        : "Model returned no parsed ClientProfile."
    );
  }

  // Defense-in-depth: re-validate against the Zod schema before returning.
  return ClientProfileSchema.parse(parsed);
}
