import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [
      usersSnapshot,
      agentsSnapshot,
      episodesSnapshot,
      verifiedSnapshot,
      ledgerSnapshot,
      subscriptionsSnapshot,
      aiLogsSnapshot,
      proofsSnapshot,
      merchantsSnapshot,
    ] = await Promise.all([
      db.collection("users").get(),
      db.collection("agent_profiles").get(),
      db.collection("work_episodes").get(),
      db.collection("work_episodes").where("status", "==", "verified").get(),
      db.collection("income_ledger").get(),
      db.collection("org_subscriptions").where("status", "==", "active").get(),
      db.collection("ai_workflow_logs").get(),
      db.collection("proof_items").get(),
      db.collection("merchants").get(),
    ]);

    let platformRevenue = 0;
    for (const doc of subscriptionsSnapshot.docs) {
      platformRevenue += (doc.data().priceUsd || 0);
    }

    let agentIncomeLogged = 0;
    let confirmedIncome = 0;
    for (const doc of ledgerSnapshot.docs) {
      const d = doc.data();
      agentIncomeLogged += d.amount || 0;
      if (["merchant_confirmed", "program_verified"].includes(d.verificationLevel)) {
        confirmedIncome += d.amount || 0;
      }
    }

    const merchantConfirmedEpisodes = episodesSnapshot.docs.filter((d: any) =>
      ["merchant_confirmed", "paid", "verified"].includes(d.data().status)
    ).length;

    const snapshot = {
      snapshotDate: new Date().toISOString(),
      businessViability: {
        users: usersSnapshot.size,
        paidUsers: subscriptionsSnapshot.size,
        platformRevenue,
        paidOrganizations: subscriptionsSnapshot.size,
      },
      aiNativeOperations: {
        aiWorkflowsExecuted: aiLogsSnapshot.size,
        serviceOffersGenerated: aiLogsSnapshot.docs.filter((d: any) =>
          d.data().workflowType === "offer_generation"
        ).length,
        merchantOutputsGenerated: aiLogsSnapshot.docs.filter((d: any) =>
          d.data().workflowType === "report"
        ).length,
      },
      categoryImpact: {
        agentsOnPlatform: agentsSnapshot.size,
        merchantsOnboarded: merchantsSnapshot.size,
        paidWorkEpisodes: episodesSnapshot.size,
        verifiedPaidWorkEpisodes: verifiedSnapshot.size,
        merchantConfirmedEpisodes,
        agentIncomeLoggedLocal: agentIncomeLogged,
        confirmedIncomeLocal: confirmedIncome,
        proofUploads: proofsSnapshot.size,
      },
    };

    return NextResponse.json(snapshot);
  } catch (err: any) {
    console.error("XPRIZE snapshot error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate snapshot" }, { status: 500 });
  }
}
