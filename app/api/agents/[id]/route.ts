import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agentDoc = await db.collection("agent_profiles").doc(id).get();
    if (!agentDoc.exists) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    const agent = agentDoc.data();

    const isSelf = session.id === agent.userId;
    const isOperator = session.role === "operator";

    if (!isSelf && !isOperator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { district, location, bio, skills } = body;

    let parsedSkills: string[] = [];
    if (Array.isArray(skills)) {
      parsedSkills = skills.map((s: string) => s.trim().toLowerCase()).filter(Boolean);
    } else if (typeof skills === "string") {
      parsedSkills = skills
        .split(",")
        .map((s) => s.trim().toLowerCase().replace(/\s+/g, "_"))
        .filter(Boolean);
    }

    await db.collection("agent_profiles").doc(id).update({
      district: district?.trim() || null,
      location: location?.trim() || null,
      bio: bio?.trim() || null,
      skills: parsedSkills,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Agent update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
