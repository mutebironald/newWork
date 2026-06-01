import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateImpactReport } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId, cohortId, reportType } = await req.json();
  if (!orgId || !reportType) {
    return NextResponse.json({ error: "orgId and reportType required" }, { status: 400 });
  }

  try {
    const result = await generateImpactReport(orgId, cohortId || null, reportType);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("Report generation error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
