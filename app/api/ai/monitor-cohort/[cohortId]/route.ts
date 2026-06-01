import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { monitorCohortHealth } from "@/lib/ai";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ cohortId: string }> }
) {
  const { cohortId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const assessment = await monitorCohortHealth(cohortId);
    return NextResponse.json({ ok: true, assessment });
  } catch (err) {
    console.error("Cohort monitor error:", err);
    return NextResponse.json({ error: "AI monitoring failed" }, { status: 500 });
  }
}
