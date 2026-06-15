import { NextResponse, NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { simulateLead } from "@/lib/simulate";
import { GeneratedSystemSchema, LeadSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const system = GeneratedSystemSchema.parse(body.system);

    const raw = JSON.parse(
      readFileSync(resolve(process.cwd(), "data/test-leads.json"), "utf8")
    );
    const leads = raw.map((l: unknown) => LeadSchema.parse(l));

    // Run all leads in parallel; each call is short relative to the 60 s limit.
    const simResults = await Promise.all(
      leads.map((lead: ReturnType<typeof LeadSchema.parse>) => simulateLead(system, lead))
    );

    return NextResponse.json({ leads, simResults });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
