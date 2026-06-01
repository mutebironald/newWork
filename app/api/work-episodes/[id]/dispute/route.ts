import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// POST — flag as disputed
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const episode = await db.workEpisode.findUnique({ where: { id } });
  if (!episode) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const disputableStatuses = ["in_progress", "delivered", "proof_uploaded", "merchant_confirmed", "paid"];
  if (!disputableStatuses.includes(episode.status)) {
    return NextResponse.json({ error: "Cannot dispute this episode" }, { status: 400 });
  }

  await db.workEpisode.update({ where: { id }, data: { status: "disputed" } });
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
  const episode = await db.workEpisode.findUnique({ where: { id } });
  if (!episode || episode.status !== "disputed") {
    return NextResponse.json({ error: "Episode not in disputed state" }, { status: 400 });
  }

  // Resolve back to merchant_confirmed (the last confirmed-good state)
  await db.workEpisode.update({
    where: { id },
    data: {
      status: "merchant_confirmed",
      notes: episode.notes
        ? `${episode.notes}\n[RESOLVED] ${resolution}`
        : `[RESOLVED] ${resolution}`,
    },
  });

  return NextResponse.json({ ok: true });
}
