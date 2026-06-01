import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateCareerProfile } from "@/lib/ai";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await generateCareerProfile(agentId);
    return NextResponse.json({ ok: true, profile: result });
  } catch (err) {
    console.error("Career profile error:", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
