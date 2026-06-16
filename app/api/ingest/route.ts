import { NextResponse, NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingestClient } from "@/lib/ingest";

export async function POST(req: NextRequest) {
  try {
    let rawText: string;
    try {
      const body = await req.json();
      rawText = body.rawText ?? readFileSync(resolve(process.cwd(), "data/roofing-client.md"), "utf8");
    } catch {
      rawText = readFileSync(resolve(process.cwd(), "data/roofing-client.md"), "utf8");
    }
    const profile = await ingestClient(rawText);
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
