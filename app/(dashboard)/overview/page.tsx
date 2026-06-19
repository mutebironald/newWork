import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusBadge, getVerificationBadge, formatLocal, timeAgo } from "@/lib/utils";
import {
  Users,
  Store,
  ListChecks,
  Wallet,
  Bot,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [
    agentsSnapshot,
    merchantsSnapshot,
    episodesSnapshot,
    verifiedSnapshot,
    confirmedSnapshot,
    ledgerSnapshot,
    recentEpisodesSnapshot,
    aiLogsSnapshot,
    openSnapshot,
    flagsSnapshot,
    autonomousSnapshot,
  ] = await Promise.all([
    db.collection("agent_profiles").where("status", "==", "active").get(),
    db.collection("merchants").where("status", "==", "active").get(),
    db.collection("work_episodes").get(),
    db.collection("work_episodes").where("status", "==", "verified").get(),
    db.collection("work_episodes").where("status", "==", "merchant_confirmed").get(),
    db.collection("income_ledger").get(),
    db.collection("work_episodes").get(),
    db.collection("ai_workflow_logs").get(),
    db.collection("opportunities").where("status", "==", "open").get(),
    db.collection("fraud_flags").where("resolved", "==", false).get(),
    db.collection("ai_workflow_logs").where("autonomousDecision", "==", true).get(),
  ]);

  const totalAgents = agentsSnapshot.size;
  const totalMerchants = merchantsSnapshot.size;
  const totalEpisodes = episodesSnapshot.size;
  const verifiedEpisodes = verifiedSnapshot.size;
  const merchantConfirmed = confirmedSnapshot.size;

  let totalIncomeAmt = 0;
  for (const doc of ledgerSnapshot.docs) {
    totalIncomeAmt += doc.data().amount || 0;
  }

  const aiLogs = aiLogsSnapshot.size;
  const openOpportunities = openSnapshot.size;
  const fraudFlags = flagsSnapshot.size;
  const autonomousLogs = autonomousSnapshot.size;
  const aiAutonomyRate = aiLogs > 0 ? Math.round((autonomousLogs / aiLogs) * 100) : 0;

  // Build the recentEpisodes array
  const allEpisodes = recentEpisodesSnapshot.docs.map((doc: any) => ({
    ...doc.data(),
    id: doc.id,
  }));
  // Sort by createdAt desc
  allEpisodes.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  const selectedEpisodes = allEpisodes.slice(0, 8);

  const recentEpisodes: any[] = [];
  for (const ep of selectedEpisodes) {
    // Fetch agent profile
    const agentDoc = await db.collection("agent_profiles").doc(ep.agentId).get();
    let agent = null;
    if (agentDoc.exists) {
      const agentData = agentDoc.data();
      const userDoc = await db.collection("users").doc(agentData.userId).get();
      const user = userDoc.exists ? userDoc.data() : { name: "Unknown" };
      agent = { ...agentData, id: ep.agentId, user };
    } else {
      agent = { user: { name: "Unknown" } };
    }

    // Fetch merchant
    let merchant = null;
    if (ep.merchantId) {
      const merchantDoc = await db.collection("merchants").doc(ep.merchantId).get();
      if (merchantDoc.exists) merchant = merchantDoc.data();
    }

    recentEpisodes.push({
      ...ep,
      agent,
      merchant,
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {session.name}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-medium text-indigo-700">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          AI Engine Active
        </div>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Agents"
          value={totalAgents.toLocaleString()}
          icon={Users}
          iconColor="text-indigo-600"
          subtitle="Workers on platform"
        />
        <StatCard
          title="Active Merchants"
          value={totalMerchants.toLocaleString()}
          icon={Store}
          iconColor="text-purple-600"
          subtitle="Businesses served"
        />
        <StatCard
          title="Work Episodes"
          value={totalEpisodes.toLocaleString()}
          icon={ListChecks}
          iconColor="text-blue-600"
          subtitle={`${verifiedEpisodes} verified`}
        />
        <StatCard
          title="Total Income Generated"
          value={formatLocal(totalIncomeAmt)}
          icon={Wallet}
          iconColor="text-green-600"
          subtitle="Agent-earned income"
        />
      </div>

      {/* AI + verification metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="AI Decisions Made"
          value={aiLogs.toLocaleString()}
          icon={Bot}
          iconColor="text-violet-600"
          subtitle={`${aiAutonomyRate}% autonomous`}
        />
        <StatCard
          title="Merchant Confirmed"
          value={merchantConfirmed.toLocaleString()}
          icon={CheckCircle2}
          iconColor="text-teal-600"
          subtitle="Work confirmed by merchants"
        />
        <StatCard
          title="Open Opportunities"
          value={openOpportunities.toLocaleString()}
          icon={TrendingUp}
          iconColor="text-orange-600"
          subtitle="Awaiting assignment"
        />
        <StatCard
          title="Fraud Flags"
          value={fraudFlags.toLocaleString()}
          icon={AlertTriangle}
          iconColor={fraudFlags > 0 ? "text-red-600" : "text-gray-400"}
          subtitle="Unresolved flags"
        />
      </div>

      {/* AI Autonomy rate callout */}
      <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 shrink-0">
            <Bot className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-violet-900">AI-Native Operations</h3>
            <p className="text-sm text-violet-700 mt-1">
              {aiAutonomyRate}% of operational decisions are made autonomously by AI — proof
              verification, opportunity matching, fraud detection, and cohort health monitoring all
              run without human intervention.
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-violet-700">{aiAutonomyRate}%</div>
            <div className="text-xs text-violet-500">AI autonomy rate</div>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-violet-100">
          <div
            className="h-2 rounded-full bg-violet-500 transition-all"
            style={{ width: `${aiAutonomyRate}%` }}
          />
        </div>
      </div>

      {/* Recent work episodes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Work Episodes</CardTitle>
            <Link href="/work-episodes" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {recentEpisodes.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No work episodes yet. <Link href="/opportunities" className="text-indigo-600">Browse opportunities</Link>
              </div>
            )}
            {recentEpisodes.map((ep) => {
              const status = getStatusBadge(ep.status);
              return (
                <div key={ep.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 shrink-0">
                    {ep.agent.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ep.title}</p>
                    <p className="text-xs text-gray-400">
                      {ep.agent.user.name}
                      {ep.merchant ? ` → ${ep.merchant.name}` : ""}
                      {" · "}
                      {timeAgo(ep.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-gray-700">
                      {formatLocal(ep.amount)}
                    </span>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Verification ladder */}
      <Card>
        <CardHeader>
          <CardTitle>Income Verification Ladder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-stretch gap-2">
            {[
              { level: "self_reported", label: "Self-Reported" },
              { level: "proof_uploaded", label: "Proof Uploaded" },
              { level: "merchant_confirmed", label: "Merchant Confirmed" },
              { level: "program_verified", label: "Program Verified" },
            ].map((rung) => {
              const badge = getVerificationBadge(rung.level);
              return (
                <div
                  key={rung.level}
                  className={`flex-1 rounded-lg border px-3 py-4 text-center ${badge.color}`}
                >
                  <p className="text-xs font-semibold">{badge.label}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {rung.level === "merchant_confirmed"
                      ? "North-star metric"
                      : rung.level === "program_verified"
                      ? "XPRIZE target"
                      : ""}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            North-star count: work episodes reaching <strong>merchant_confirmed</strong> or higher.
            Merchant confirmation is the default rung for verified income.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
