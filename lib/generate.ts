import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  GeneratedSystemSchema,
  FirstTouchEmailsSchema,
  type ClientProfile,
  type GeneratedSystem,
} from "./schemas";

export const GEN_MODEL = "gpt-4o-mini";

// ---------------------------------------------------------------------------
// Sub-schemas — one per chained call (must be top-level objects for structured
// outputs; arrays are always wrapped in an object).
// ---------------------------------------------------------------------------

const QualificationStrategySchema = GeneratedSystemSchema.shape.qualificationStrategy;

const EmailFlowResponseSchema = z.object({
  firstTouchEmails: FirstTouchEmailsSchema,
  followUpFlow: z.array(
    z.object({
      stepName: z.string(),
      trigger: z.string(),
      subject: z.string(),
      body: z.string(),
      purpose: z.string(),
    })
  ),
});

const RoutingResponseSchema = z.object({
  routingLogic: z.array(
    z.object({
      condition: z.string(),
      action: z.string(),
    })
  ),
  humanHandoffRules: z.array(z.string()),
  bookingCTA: z.string(),
});

// ---------------------------------------------------------------------------
// Shared grounding rule injected into every prompt.
// ---------------------------------------------------------------------------

const GROUNDING_RULE = `Grounding rule (critical): You MAY infer and synthesize \
judgment-based outputs — strategy, tone, email copy, routing decisions. You must \
NEVER fabricate discrete factual data points not present in the profile: do not \
invent prices, contact details, locations, services, or policies not stated. If a \
fact is needed and absent from the profile, omit it or use a generic placeholder \
such as {phone} rather than a made-up value.`;

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const QUAL_SYSTEM = `You are a speed-to-lead strategist for a home-services AI agency.

Design the lead-qualification strategy for this company's speed-to-lead system. \
From the ClientProfile, output: the goal, the questions to ask an inbound lead, \
hard disqualifiers, and a scoring approach. Specific to this business's services, \
pricing, area, and ideal lead. Not generic.

${GROUNDING_RULE}`;

const EMAIL_SYSTEM = `You are a conversion copywriter for a home-services AI agency.

From the ClientProfile and qualification strategy, produce two things:

## Part 1 — firstTouchEmails
Six distinct first-touch email templates, one per routing bucket. Rules for ALL:
- ≤120 words per email body
- Sound like a real person wrote it — concise, warm, direct
- NEVER open with generic empathy filler ("We understand roofing issues can be stressful…")
- At most 2–3 questions total; never a multi-question interrogation
- Use {leadName} and {phone} as placeholders; only reference facts present in the ClientProfile

Bucket requirements:
- emergency: Urgent tone. Acknowledge the active problem (leak/water intrusion). Drive immediately to a phone call for emergency dispatch. Ask at most 1 question.
- insurance_storm: Claims-aware and reassuring. Drive to booking a free inspection. Ask 2–3 high-signal questions only: ZIP code, homeowner (y/n), when damage occurred.
- high_value: Consultative. Position expertise and long-term value. Drive to inspection booking. 1–2 questions.
- out_of_area: Polite and brief. Acknowledge their inquiry, explain you can't serve their area, wish them well. Zero questions. This is the ONLY true decline.
- price_shopper: Warm nurture — NOT a decline. Offer helpful context on value or typical range (from profile if known). Invite a quick 5-min call. 1 question max.
- vague: Friendly and curious. Ask 1–2 questions to understand their situation and whether you can help.

## Part 2 — followUpFlow
Exactly 3 timed follow-up steps (no first-touch here — that's in Part 1):
- Step 1: trigger = "If no reply in 24h"
- Step 2: trigger = "If no reply in 72h"
- Step 3: trigger = "If no reply in 7 days"
Each step: stepName, trigger, subject, body (use {placeholders}), purpose.

${GROUNDING_RULE}`;

const ROUTING_SYSTEM = `You are a lead-routing architect for a home-services AI agency.

Define condition→action routing rules and human-handoff rules. Cover emergencies, \
high-value leads, disqualified/out-of-area leads, and when a human takes over. \
Ground in this business's real operations.

${GROUNDING_RULE}`;

// ---------------------------------------------------------------------------
// Main generation function
// ---------------------------------------------------------------------------

export async function generateSystem(
  profile: ClientProfile
): Promise<GeneratedSystem> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in the environment.");

  const client = new OpenAI({ apiKey });

  const profileJson = JSON.stringify(profile, null, 2);

  // ---- Step 1: Qualification strategy ------------------------------------
  console.error("[generate] Step 1: qualification strategy…");
  const step1 = await client.chat.completions.parse({
    model: GEN_MODEL,
    messages: [
      { role: "system", content: QUAL_SYSTEM },
      { role: "user", content: `CLIENT PROFILE:\n${profileJson}` },
    ],
    response_format: zodResponseFormat(
      QualificationStrategySchema,
      "qualification_strategy"
    ),
  });

  const qualificationStrategy = step1.choices[0]?.message.parsed;
  if (!qualificationStrategy) {
    throw new Error(
      step1.choices[0]?.message.refusal ??
        "Step 1 returned no qualification strategy."
    );
  }

  // ---- Step 2: Email flow ------------------------------------------------
  console.error("[generate] Step 2: email flow…");
  const step2 = await client.chat.completions.parse({
    model: GEN_MODEL,
    messages: [
      { role: "system", content: EMAIL_SYSTEM },
      {
        role: "user",
        content: `CLIENT PROFILE:\n${profileJson}\n\nQUALIFICATION STRATEGY:\n${JSON.stringify(qualificationStrategy, null, 2)}`,
      },
    ],
    response_format: zodResponseFormat(EmailFlowResponseSchema, "email_flow"),
  });

  const emailFlowResult = step2.choices[0]?.message.parsed;
  if (!emailFlowResult) {
    throw new Error(
      step2.choices[0]?.message.refusal ?? "Step 2 returned no email flow."
    );
  }
  console.error(`[generate] Step 2 produced ${Object.keys(emailFlowResult.firstTouchEmails).length} bucket emails + ${emailFlowResult.followUpFlow.length} follow-ups`);

  // ---- Step 3: Routing logic + handoff rules + bookingCTA ----------------
  console.error("[generate] Step 3: routing logic and handoff rules…");
  const step3 = await client.chat.completions.parse({
    model: GEN_MODEL,
    messages: [
      { role: "system", content: ROUTING_SYSTEM },
      {
        role: "user",
        content: `CLIENT PROFILE:\n${profileJson}\n\nQUALIFICATION STRATEGY:\n${JSON.stringify(qualificationStrategy, null, 2)}`,
      },
    ],
    response_format: zodResponseFormat(RoutingResponseSchema, "routing"),
  });

  const routingResult = step3.choices[0]?.message.parsed;
  if (!routingResult) {
    throw new Error(
      step3.choices[0]?.message.refusal ??
        "Step 3 returned no routing logic."
    );
  }

  // ---- Assemble and validate final GeneratedSystem -----------------------
  const system = GeneratedSystemSchema.parse({
    clientName: profile.businessName,
    version: 1,
    generatedAt: new Date().toISOString(),
    qualificationStrategy,
    firstTouchEmails: emailFlowResult.firstTouchEmails,
    emailFlow: emailFlowResult.followUpFlow,
    routingLogic: routingResult.routingLogic,
    humanHandoffRules: routingResult.humanHandoffRules,
    bookingCTA: routingResult.bookingCTA,
  });

  return system;
}
