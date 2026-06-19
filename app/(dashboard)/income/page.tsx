import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { getVerificationBadge, formatLocal, timeAgo } from "@/lib/utils";
import { Wallet, TrendingUp, Users, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const ledgerSnapshot = await db.collection("income_ledger").get();
  const ledger: any[] = [];
  for (const doc of ledgerSnapshot.docs) {
    const entry = doc.data();

    // Fetch agent profile
    const agentDoc = await db.collection("agent_profiles").doc(entry.agentId).get();
    let agent = null;
    if (agentDoc.exists) {
      const agentData = agentDoc.data();
      const userDoc = await db.collection("users").doc(agentData.userId).get();
      const user = userDoc.exists ? userDoc.data() : { name: "Unknown" };
      agent = { ...agentData, id: entry.agentId, user };
    } else {
      agent = { user: { name: "Unknown" } };
    }

    // Fetch work episode
    const epDoc = await db.collection("work_episodes").doc(entry.workEpisodeId).get();
    let workEpisode = null;
    if (epDoc.exists) {
      const epData = epDoc.data();
      // Fetch merchant
      let merchant = null;
      if (epData.merchantId) {
        const merchantDoc = await db.collection("merchants").doc(epData.merchantId).get();
        if (merchantDoc.exists) merchant = merchantDoc.data();
      }
      workEpisode = { ...epData, id: entry.workEpisodeId, merchant };
    } else {
      workEpisode = { title: "Unknown Work Episode" };
    }

    ledger.push({
      ...entry,
      id: doc.id,
      agent,
      workEpisode,
    });
  }

  // Sort by createdAt desc
  ledger.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const totalIncome = ledger.reduce((s: number, l: any) => s + l.amount, 0);
  const verifiedIncome = ledger
    .filter((l: any) => l.verificationLevel !== "self_reported")
    .reduce((s: number, l: any) => s + l.amount, 0);
  const merchantConfirmedIncome = ledger
    .filter((l: any) =>
      ["merchant_confirmed", "program_verified"].includes(l.verificationLevel)
    )
    .reduce((s: number, l: any) => s + l.amount, 0);

  const agentIncomes = Object.entries(
    ledger.reduce((acc: any, l: any) => {
      const key = l.agentId;
      if (!acc[key]) acc[key] = { name: l.agent?.user?.name || "Unknown", total: 0, count: 0 };
      acc[key].total += l.amount;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { name: string; total: number; count: number }>)
  )
    .map(([id, v]: any) => ({ id, ...v }))
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 10);

  const uniqueAgents = new Set(ledger.map((l: any) => l.agentId)).size;
  const avgPerAgent = uniqueAgents > 0 ? Math.round(totalIncome / uniqueAgents) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Income Ledger</h1>
        <p className="text-sm text-gray-500 mt-1">
          All income is agent-earned. Platform does not handle agent funds — merchant pays agent directly.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Income Generated" value={formatLocal(totalIncome)} icon={Wallet} iconColor="text-green-600" />
        <StatCard title="Verified Income (proof+)" value={formatLocal(verifiedIncome)} icon={CheckCircle2} iconColor="text-teal-600" />
        <StatCard title="Merchant-Confirmed" value={formatLocal(merchantConfirmedIncome)} subtitle="North-star metric" icon={TrendingUp} iconColor="text-indigo-600" />
        <StatCard title="Avg per Agent" value={formatLocal(avgPerAgent)} icon={Users} iconColor="text-purple-600" subtitle={`${uniqueAgents} active agents`} />
      </div>

      {/* Verification breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Ladder Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["self_reported", "proof_uploaded", "merchant_confirmed", "program_verified"].map((level) => {
              const levelIncome = ledger
                .filter((l) => l.verificationLevel === level)
                .reduce((s, l) => s + l.amount, 0);
              const pct = totalIncome > 0 ? (levelIncome / totalIncome) * 100 : 0;
              const badge = getVerificationBadge(level);
              return (
                <div key={level}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={badge.color}>{badge.label}</Badge>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{formatLocal(levelIncome)}</span>
                      <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full ${
                        level === "program_verified"
                          ? "bg-purple-500"
                          : level === "merchant_confirmed"
                          ? "bg-green-500"
                          : level === "proof_uploaded"
                          ? "bg-blue-500"
                          : "bg-yellow-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top earners */}
      {agentIncomes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Earning Agents</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {agentIncomes.map((a, i) => (
                <div key={a.id} className="flex items-center gap-4 px-6 py-3">
                  <span className="text-sm font-bold text-gray-300 w-5">{i + 1}</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {a.name.charAt(0)}
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900">{a.name}</span>
                  <span className="text-xs text-gray-400">{a.count} episodes</span>
                  <span className="text-sm font-bold text-green-700">{formatLocal(a.total)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Ledger Entries ({ledger.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {ledger.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No income recorded yet.
              </div>
            )}
            {ledger.slice(0, 20).map((entry) => {
              const badge = getVerificationBadge(entry.verificationLevel);
              return (
                <div key={entry.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {entry.workEpisode.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.agent.user.name}
                      {entry.workEpisode.merchant ? ` · ${entry.workEpisode.merchant.name}` : ""}
                      {" · "}
                      {timeAgo(entry.createdAt)}
                    </p>
                  </div>
                  <Badge className={badge.color}>{badge.label}</Badge>
                  <span className="text-sm font-bold text-green-700 shrink-0">
                    {formatLocal(entry.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
