import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";

// POST — flag as disputed
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const episodeDoc = await db.collection("work_episodes").doc(id).get();
  if (!episodeDoc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const episode = episodeDoc.data();

  const disputableStatuses = ["in_progress", "delivered", "proof_uploaded", "merchant_confirmed", "paid"];
  if (!disputableStatuses.includes(episode.status)) {
    return NextResponse.json({ error: "Cannot dispute this episode" }, { status: 400 });
  }

  await db.collection("work_episodes").doc(id).update({
    status: "disputed",
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

// PATCH — resolve dispute
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resolution } = await req.json();
  const episodeDoc = await db.collection("work_episodes").doc(id).get();
  if (!episodeDoc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const episode = episodeDoc.data();

  if (episode.status !== "disputed") {
    return NextResponse.json({ error: "Episode not in disputed state" }, { status: 400 });
  }

  // Resolve back to merchant_confirmed (the last confirmed-good state)
  await db.collection("work_episodes").doc(id).update({
    status: "merchant_confirmed",
    notes: episode.notes
      ? `${episode.notes}\n[RESOLVED] ${resolution}`
      : `[RESOLVED] ${resolution}`,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
