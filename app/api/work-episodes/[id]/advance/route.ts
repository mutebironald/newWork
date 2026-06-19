import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { getWorkEpisodeNextStatus } from "@/lib/utils";
import { detectFraud } from "@/lib/ai";

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

  const next = getWorkEpisodeNextStatus(episode.status);
  if (!next) {
    return NextResponse.json({ error: "No next status available" }, { status: 400 });
  }

  const update: Record<string, any> = { status: next, updatedAt: new Date().toISOString() };
  if (next === "in_progress") update.startedAt = new Date().toISOString();
  if (next === "delivered") update.deliveredAt = new Date().toISOString();
  if (next === "verified") update.verifiedAt = new Date().toISOString();

  await db.collection("work_episodes").doc(id).update(update);

  // Auto-trigger fraud detection when episode moves to proof_uploaded or merchant_confirmed
  if (next === "merchant_confirmed" || next === "proof_uploaded") {
    detectFraud(id).catch(console.error);
  }

  // Create income ledger entry when paid
  if (next === "paid" || next === "verified") {
    const ledgerSnapshot = await db
      .collection("income_ledger")
      .where("workEpisodeId", "==", id)
      .limit(1)
      .get();

    if (ledgerSnapshot.empty) {
      const now = new Date();
      const ledgerRef = db.collection("income_ledger").doc();
      await ledgerRef.set({
        id: ledgerRef.id,
        agentId: episode.agentId,
        workEpisodeId: id,
        amount: episode.amount,
        verificationLevel: next === "verified" ? "program_verified" : "merchant_confirmed",
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
        createdAt: now.toISOString(),
      });
    }
  }

  return NextResponse.json({ ok: true, status: next });
}
