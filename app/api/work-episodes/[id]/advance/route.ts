import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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

  const episode = await db.workEpisode.findUnique({ where: { id } });
  if (!episode) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const next = getWorkEpisodeNextStatus(episode.status);
  if (!next) {
    return NextResponse.json({ error: "No next status available" }, { status: 400 });
  }

  const update: Record<string, unknown> = { status: next };
  if (next === "in_progress") update.startedAt = new Date();
  if (next === "delivered") update.deliveredAt = new Date();
  if (next === "verified") update.verifiedAt = new Date();

  await db.workEpisode.update({ where: { id }, data: update });

  // Auto-trigger fraud detection when episode moves to proof_uploaded or merchant_confirmed
  if (next === "merchant_confirmed" || next === "proof_uploaded") {
    detectFraud(id).catch(console.error);
  }

  // Create income ledger entry when paid
  if (next === "paid" || next === "verified") {
    const existing = await db.incomeLedger.findUnique({ where: { workEpisodeId: id } });
    if (!existing) {
      const now = new Date();
      await db.incomeLedger.create({
        data: {
          agentId: episode.agentId,
          workEpisodeId: id,
          amount: episode.amount,
          verificationLevel: next === "verified" ? "program_verified" : "merchant_confirmed",
          periodMonth: now.getMonth() + 1,
          periodYear: now.getFullYear(),
        },
      });
    }
  }

  return NextResponse.json({ ok: true, status: next });
}
