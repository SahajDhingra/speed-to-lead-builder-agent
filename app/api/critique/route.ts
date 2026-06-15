import { NextResponse, NextRequest } from "next/server";
import { critiqueRun } from "@/lib/critique";
import { GeneratedSystemSchema, LeadSchema, SimResultSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const system = GeneratedSystemSchema.parse(body.system);
    const leads = (body.leads as unknown[]).map((l) => LeadSchema.parse(l));
    const simResults = (body.simResults as unknown[]).map((s) => SimResultSchema.parse(s));

    const critiques = await Promise.all(
      leads.map((lead, i) => critiqueRun(system, lead, simResults[i]))
    );

    return NextResponse.json({ critiques });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
