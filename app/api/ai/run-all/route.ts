import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyProof, matchAgentsToOpportunity, monitorCohortHealth } from "@/lib/ai";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results: string[] = [];

  // 1. Verify all pending proofs
  const pendingProofs = await db.proofItem.findMany({
    where: { aiStatus: "pending" },
    take: 10,
  });
  for (const proof of pendingProofs) {
    try {
      await verifyProof(proof.id);
      results.push(`verified:proof:${proof.id}`);
    } catch (err) {
      console.error(`AI run-all: proof verification failed for ${proof.id}`, err);
      results.push(`failed:proof:${proof.id}`);
    }
  }

  // 2. Match agents to open opportunities
  const openOps = await db.opportunity.findMany({
    where: { status: "open" },
    take: 5,
  });
  for (const op of openOps) {
    try {
      await matchAgentsToOpportunity(op.id);
      results.push(`matched:opportunity:${op.id}`);
    } catch (err) {
      console.error(`AI run-all: opportunity matching failed for ${op.id}`, err);
      results.push(`failed:opportunity:${op.id}`);
    }
  }

  // 3. Monitor active cohorts
  const activeCohorts = await db.cohort.findMany({
    where: { status: "active" },
    take: 5,
  });
  for (const cohort of activeCohorts) {
    try {
      await monitorCohortHealth(cohort.id);
      results.push(`monitored:cohort:${cohort.id}`);
    } catch (err) {
      console.error(`AI run-all: cohort monitoring failed for ${cohort.id}`, err);
      results.push(`failed:cohort:${cohort.id}`);
    }
  }

  return NextResponse.json({
    ok: true,
    message: `AI ran ${results.length} workflows`,
    details: results,
  });
}
