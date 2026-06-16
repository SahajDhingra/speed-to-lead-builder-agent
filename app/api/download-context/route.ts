import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { resolve } from "path";

export async function GET() {
  const content = readFileSync(resolve(process.cwd(), "data/roofing-client.md"), "utf8");
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="roofing-client.md"',
    },
  });
}
