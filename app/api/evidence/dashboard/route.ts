import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
      agentsSnapshot,
      activeAgentsSnapshot,
      merchantsSnapshot,
      episodesSnapshot,
      verifiedSnapshot,
      ledgerSnapshot,
      subscriptionsSnapshot,
      aiLogsSnapshot,
      proofsSnapshot,
      fraudFlagsSnapshot,
    ] = await Promise.all([
      db.collection("agent_profiles").get(),
      db.collection("agent_profiles").where("status", "==", "active").get(),
      db.collection("merchants").where("status", "==", "active").get(),
      db.collection("work_episodes").get(),
      db.collection("work_episodes").where("status", "==", "verified").get(),
      db.collection("income_ledger").get(),
      db.collection("org_subscriptions").where("status", "==", "active").get(),
      db.collection("ai_workflow_logs").get(),
      db.collection("proof_items").get(),
      db.collection("fraud_flags").where("resolved", "==", false).get(),
    ]);

    let platformRevenue = 0;
    for (const doc of subscriptionsSnapshot.docs) platformRevenue += doc.data().priceUsd || 0;

    let totalIncome = 0;
    let confirmedIncome = 0;
    for (const doc of ledgerSnapshot.docs) {
      const d = doc.data();
      totalIncome += d.amount || 0;
      if (["merchant_confirmed", "program_verified"].includes(d.verificationLevel)) {
        confirmedIncome += d.amount || 0;
      }
    }

    const aiLogs = aiLogsSnapshot.docs.map((d: any) => d.data());
    const autonomousLogs = aiLogs.filter((l: any) => l.autonomousDecision).length;
    const successfulLogs = aiLogs.filter((l: any) => l.success).length;
    const avgLatency = aiLogs.length > 0
      ? aiLogs.reduce((s: number, l: any) => s + (l.latencyMs || 0), 0) / aiLogs.length
      : 0;

    const workflowCounts = aiLogs.reduce((acc: any, l: any) => {
      acc[l.workflowType] = (acc[l.workflowType] || 0) + 1;
      return acc;
    }, {});

    const proofStats = proofsSnapshot.docs.reduce((acc: any, d: any) => {
      const status = d.data().aiStatus || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const merchantConfirmedEpisodes = episodesSnapshot.docs.filter((d: any) =>
      ["merchant_confirmed", "paid", "verified"].includes(d.data().status)
    ).length;

    return NextResponse.json({
      businessViability: {
        totalAgents: agentsSnapshot.size,
        activeAgents: activeAgentsSnapshot.size,
        activeMerchants: merchantsSnapshot.size,
        platformRevenue,
        paidOrganizations: subscriptionsSnapshot.size,
        totalAgentIncome: totalIncome,
        confirmedAgentIncome: confirmedIncome,
      },
      aiNativeOperations: {
        totalWorkflows: aiLogsSnapshot.size,
        autonomousDecisions: autonomousLogs,
        autonomyRate: aiLogsSnapshot.size > 0 ? autonomousLogs / aiLogsSnapshot.size : 0,
        successRate: aiLogsSnapshot.size > 0 ? successfulLogs / aiLogsSnapshot.size : 0,
        avgLatencyMs: Math.round(avgLatency),
        workflowBreakdown: workflowCounts,
      },
      categoryImpact: {
        totalWorkEpisodes: episodesSnapshot.size,
        verifiedEpisodes: verifiedSnapshot.size,
        merchantConfirmedEpisodes,
        totalProofUploads: proofsSnapshot.size,
        proofAccepted: proofStats.accepted || 0,
        proofPending: proofStats.pending || 0,
        proofRejected: proofStats.rejected || 0,
        openFraudFlags: fraudFlagsSnapshot.size,
      },
    });
  } catch (err: any) {
    console.error("Evidence dashboard error:", err);
    return NextResponse.json({ error: err.message || "Failed to load evidence dashboard" }, { status: 500 });
  }
}
