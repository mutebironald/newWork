import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { verifyProof, matchAgentsToOpportunity, monitorCohortHealth } from "@/lib/ai";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results: string[] = [];

  // 1. Verify all pending proofs
  const pendingProofsSnapshot = await db
    .collection("proof_items")
    .where("aiStatus", "==", "pending")
    .limit(10)
    .get();

  for (const doc of pendingProofsSnapshot.docs) {
    try {
      await verifyProof(doc.id);
      results.push(`verified:proof:${doc.id}`);
    } catch (err) {
      console.error(`AI run-all: proof verification failed for ${doc.id}`, err);
      results.push(`failed:proof:${doc.id}`);
    }
  }

  // 2. Match agents to open opportunities
  const openOpsSnapshot = await db
    .collection("opportunities")
    .where("status", "==", "open")
    .limit(5)
    .get();

  for (const doc of openOpsSnapshot.docs) {
    try {
      await matchAgentsToOpportunity(doc.id);
      results.push(`matched:opportunity:${doc.id}`);
    } catch (err) {
      console.error(`AI run-all: opportunity matching failed for ${doc.id}`, err);
      results.push(`failed:opportunity:${doc.id}`);
    }
  }

  // 3. Monitor active cohorts
  const activeCohortsSnapshot = await db
    .collection("cohorts")
    .where("status", "==", "active")
    .limit(5)
    .get();

  for (const doc of activeCohortsSnapshot.docs) {
    try {
      await monitorCohortHealth(doc.id);
      results.push(`monitored:cohort:${doc.id}`);
    } catch (err) {
      console.error(`AI run-all: cohort monitoring failed for ${doc.id}`, err);
      results.push(`failed:cohort:${doc.id}`);
    }
  }

  return NextResponse.json({
    ok: true,
    message: `AI ran ${results.length} workflows`,
    details: results,
  });
}
