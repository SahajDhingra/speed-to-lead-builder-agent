import { NextResponse, NextRequest } from "next/server";
import { applyImprovements } from "@/lib/apply";
import { GeneratedSystemSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const system = GeneratedSystemSchema.parse(body.system);
    const updated = await applyImprovements(system, body.approvedImprovements ?? []);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
