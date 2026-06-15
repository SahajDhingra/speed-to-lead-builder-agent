import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ingestClient } from "@/lib/ingest";

export async function POST() {
  try {
    const raw = readFileSync(resolve(process.cwd(), "data/roofing-client.md"), "utf8");
    const profile = await ingestClient(raw);
    return NextResponse.json(profile);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
