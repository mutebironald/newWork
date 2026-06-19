import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await db.collection("opportunities").get();
  const opportunities: any[] = [];

  for (const doc of snapshot.docs) {
    const opp = doc.data();

    // Fetch organization
    const orgDoc = await db.collection("organizations").doc(opp.orgId).get();
    const org = orgDoc.exists ? orgDoc.data() : null;

    // Fetch assignments
    const assignmentsSnapshot = await db
      .collection("opportunity_assignments")
      .where("opportunityId", "==", doc.id)
      .get();
    const assignments = assignmentsSnapshot.docs.map((d: any) => d.data());

    // Fetch count of work episodes
    const episodesSnapshot = await db
      .collection("work_episodes")
      .where("opportunityId", "==", doc.id)
      .get();
    const workEpisodesCount = episodesSnapshot.docs.length;

    opportunities.push({
      ...opp,
      id: doc.id,
      org,
      assignments,
      _count: {
        workEpisodes: workEpisodesCount,
      },
    });
  }

  // Sort by createdAt desc
  opportunities.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return NextResponse.json({ opportunities });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId, title, description, serviceType, amount, skillsRequired, district, location, maxAssignments } = await req.json();

  if (!orgId || !title || !serviceType || !amount) {
    return NextResponse.json({ error: "orgId, title, serviceType, and amount are required" }, { status: 400 });
  }

  const orgDoc = await db.collection("organizations").doc(orgId).get();
  if (!orgDoc.exists) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const oppRef = db.collection("opportunities").doc();
  const opportunity = {
    id: oppRef.id,
    orgId,
    title,
    description: description || "",
    serviceType,
    amount,
    skillsRequired: skillsRequired || [],
    district: district || null,
    location: location || null,
    maxAssignments: maxAssignments || 1,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await oppRef.set(opportunity);

  return NextResponse.json({ ok: true, opportunity });
}
