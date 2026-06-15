import { NextResponse, NextRequest } from "next/server";
import { generateSystem } from "@/lib/generate";
import { ClientProfileSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile = ClientProfileSchema.parse(body);
    const system = await generateSystem(profile);
    return NextResponse.json(system);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
