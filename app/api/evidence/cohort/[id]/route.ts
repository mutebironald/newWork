import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: cohortId } = await params;

    const cohortDoc = await db.collection("cohorts").doc(cohortId).get();
    if (!cohortDoc.exists) return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    const cohort = cohortDoc.data();

    const enrollmentsSnapshot = await db
      .collection("cohort_enrollments")
      .where("cohortId", "==", cohortId)
      .get();

    const agentIds = enrollmentsSnapshot.docs.map((d: any) => d.data().agentId);
    const activeEnrollments = enrollmentsSnapshot.docs.filter((d: any) =>
      ["active", "enrolled"].includes(d.data().status)
    ).length;

    // Gather work episodes for this cohort
    const episodesSnapshot = await db
      .collection("work_episodes")
      .where("cohortId", "==", cohortId)
      .get();

    const episodes = episodesSnapshot.docs.map((d: any) => ({ ...d.data(), id: d.id }));

    let totalIncome = 0;
    let verifiedEpisodes = 0;
    let merchantConfirmed = 0;
    let proofUploaded = 0;

    for (const ep of episodes) {
      if (ep.status === "verified") verifiedEpisodes++;
      if (["merchant_confirmed", "paid", "verified"].includes(ep.status)) merchantConfirmed++;
      if (["proof_uploaded", "merchant_confirmed", "paid", "verified"].includes(ep.status)) proofUploaded++;
    }

    // Gather income from ledger
    const ledgerSnapshot = await db
      .collection("income_ledger")
      .where("cohortId", "==", cohortId)
      .get();
    for (const doc of ledgerSnapshot.docs) totalIncome += doc.data().amount || 0;

    // AI logs for agents in this cohort
    let aiWorkflowCount = 0;
    for (const agentId of agentIds) {
      const logsSnapshot = await db
        .collection("ai_workflow_logs")
        .where("entityId", "==", agentId)
        .get();
      aiWorkflowCount += logsSnapshot.size;
    }

    const report = {
      cohortId,
      cohortName: cohort.name,
      organizationId: cohort.organizationId,
      exportedAt: new Date().toISOString(),
      participants: {
        invited: enrollmentsSnapshot.size,
        active: activeEnrollments,
        agentIds,
      },
      workEpisodes: {
        total: episodes.length,
        verified: verifiedEpisodes,
        merchantConfirmed,
        proofUploaded,
      },
      income: {
        totalLocal: totalIncome,
        verificationLevels: {
          selfReported: episodes.length - proofUploaded,
          proofUploaded,
          merchantConfirmed,
          programVerified: verifiedEpisodes,
        },
      },
      aiOperations: {
        workflowsExecuted: aiWorkflowCount,
      },
      status: cohort.status,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
    };

    return NextResponse.json(report);
  } catch (err: any) {
    console.error("Cohort export error:", err);
    return NextResponse.json({ error: err.message || "Failed to export cohort report" }, { status: 500 });
  }
}
