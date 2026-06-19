import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orgId, name, description, goalAgents, goalEpisodes, goalIncome, startDate, endDate, status } = body;

    if (!orgId || !name?.trim()) {
      return NextResponse.json({ error: "orgId and name are required" }, { status: 400 });
    }

    // Role and membership check
    const isOperator = session.role === "operator";
    let orgMembership = null;
    const memberSnapshot = await db
      .collection("org_members")
      .where("orgId", "==", orgId)
      .where("userId", "==", session.id)
      .limit(1)
      .get();

    if (!memberSnapshot.empty) {
      orgMembership = memberSnapshot.docs[0].data();
    }

    if (!isOperator && !orgMembership) {
      return NextResponse.json({ error: "Forbidden: Not a member of this organization" }, { status: 403 });
    }

    const cohortRef = db.collection("cohorts").doc();
    const cohortId = cohortRef.id;
    const cohort = {
      id: cohortId,
      orgId,
      name: name.trim(),
      description: description?.trim() || null,
      goalAgents: goalAgents ? parseInt(goalAgents, 10) : 50,
      goalEpisodes: goalEpisodes ? parseInt(goalEpisodes, 10) : 500,
      goalIncome: goalIncome ? parseInt(goalIncome, 10) : 5000000,
      status: status || "planning",
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await cohortRef.set(cohort);

    return NextResponse.json({ ok: true, cohort }, { status: 201 });
  } catch (err: any) {
    console.error("Create Cohort error:", err);
    return NextResponse.json({ error: err.message || "Failed to create cohort" }, { status: 500 });
  }
}
