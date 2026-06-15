import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  GeneratedSystemSchema,
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
  emailFlow: z.array(
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

Write the email sequence. From the ClientProfile and qualification strategy, output \
an instant first reply plus timed follow-ups. Each step: name, trigger, subject, \
body (use {placeholders} like {leadName}), purpose. Match the company's real brand \
voice. The first reply must hit the speed-to-lead window, acknowledge the inquiry, \
ask the key qualifying questions naturally, and drive to the booking CTA. Never \
invent facts.

Always produce exactly 4 steps: an instant reply, then follow-ups at 24h, 72h, and \
7 days if the lead hasn't responded.

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
    emailFlow: emailFlowResult.emailFlow,
    routingLogic: routingResult.routingLogic,
    humanHandoffRules: routingResult.humanHandoffRules,
    bookingCTA: routingResult.bookingCTA,
  });

  return system;
}
