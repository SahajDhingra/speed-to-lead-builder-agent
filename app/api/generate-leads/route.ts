import { NextResponse, NextRequest } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ClientProfileSchema, LeadSchema } from "@/lib/schemas";
import { GEN_MODEL } from "@/lib/generate";

const LeadsResponseSchema = z.object({
  leads: z.array(LeadSchema),
});

const SYSTEM_PROMPT = `You are generating realistic synthetic test leads for a speed-to-lead AI pipeline.

Given a ClientProfile, produce exactly 6 inbound leads that represent the full realistic spread of inquiries this business receives. Each lead must map to one of these 6 archetypes — one per archetype, in this order:

1. hot_lead — Strong, high-intent, in-area customer. Real urgent need, correct service, clearly qualifies. Best-case inquiry.
2. price_shopper — Leads with cost before committing ("how much?", "what's your per-unit price?", "just getting quotes"). Interested but price-sensitive.
3. emergency — Urgent, time-critical situation. Adapt to the vertical (active problem, something broken/failing right now, needs help today or tonight).
4. out_of_area — Either outside the service area OR clearly outside the target customer profile (commercial when they're residential-only, wrong trade entirely, etc.). Politely disqualifiable.
5. vague — Minimal info, unclear need. Short message. Unclear if they even need this business's services.
6. high_value — Large-scope, high-ticket opportunity. Commercial property, multiple units, large project, or a referral source who can send ongoing business.

Rules:
- Match the business's vertical EXACTLY — if it's carpet cleaning, leads discuss carpet/upholstery; if it's HVAC, leads discuss AC/heating; etc. Zero roofing references unless this IS a roofing company.
- Each lead sounds like a real person wrote it — natural language, varied message lengths, realistic names and emails.
- Sources: vary across "Website form", "Google", "Facebook", "Phone (logged)", "Referral".
- Use receivedAt timestamps from today (provided below). Vary times across the day.
- IDs: lead-01 through lead-06.
- Include phone for the emergency lead only.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = ClientProfileSchema.parse(body.profile);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

    const client = new OpenAI({ apiKey });
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const result = await client.chat.completions.parse({
      model: GEN_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Today's date: ${today}\n\nCLIENT PROFILE:\n${JSON.stringify(profile, null, 2)}`,
        },
      ],
      response_format: zodResponseFormat(LeadsResponseSchema, "leads_response"),
    });

    const parsed = result.choices[0]?.message.parsed;
    if (!parsed) {
      throw new Error(
        result.choices[0]?.message.refusal ?? "No leads returned from model."
      );
    }

    console.error(`[generate-leads] Generated ${parsed.leads.length} leads for ${profile.businessName}`);
    return NextResponse.json({ leads: parsed.leads });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
