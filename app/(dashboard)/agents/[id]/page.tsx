import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { getStatusBadge, getVerificationBadge, formatLocal, timeAgo } from "@/lib/utils";
import { GenerateProfileButton } from "./generate-profile-button";
import { EditProfileButton } from "./edit-profile-button";
import { Wallet, Star, Bot, TrendingUp, ShieldCheck, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const agent = await db.agent.findUnique({
    where: { id },
    include: {
      user: true,
      workEpisodes: {
        orderBy: { createdAt: "desc" },
        include: {
          merchant: true,
          payment: true,
          confirmation: { select: { confirmed: true, rating: true } },
        },
      },
      incomeLedger: { orderBy: { createdAt: "desc" } },
      enrollments: { include: { cohort: { include: { org: true } } } },
    },
  });

  if (!agent) notFound();

  const canEdit = session.id === agent.userId || session.role === "operator";

  const skills: string[] = agent.skills ?? [];
  const aiProfile = agent.aiProfile as {
    summary?: string;
    strengths?: string[];
    recommendedJobs?: string[];
    riskFactors?: string[];
    growthOpportunities?: string[];
    weaknesses?: string[];
    suggestedTraining?: string[];
    incomeImprovementTips?: string[];
  } | null;

  // ── Economic metrics ──────────────────────────────────────────────────────
  const totalIncome = agent.incomeLedger.reduce((s, l) => s + l.amount, 0);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const income30d = agent.incomeLedger
    .filter((l) => new Date(l.createdAt) >= thirtyDaysAgo)
    .reduce((s, l) => s + l.amount, 0);
  const income30dPrev = agent.incomeLedger
    .filter((l) => new Date(l.createdAt) >= sixtyDaysAgo && new Date(l.createdAt) < thirtyDaysAgo)
    .reduce((s, l) => s + l.amount, 0);
  const incomeGrowthPct =
    income30dPrev > 0 ? Math.round(((income30d - income30dPrev) / income30dPrev) * 100) : null;

  const verifiedIncome = agent.incomeLedger
    .filter((l) => l.verificationLevel !== "self_reported")
    .reduce((s, l) => s + l.amount, 0);
  const merchantConfirmedIncome = agent.incomeLedger
    .filter((l) => ["merchant_confirmed", "program_verified"].includes(l.verificationLevel))
    .reduce((s, l) => s + l.amount, 0);

  const completedEpisodes = agent.workEpisodes.filter(
    (e) => ["verified", "paid", "merchant_confirmed"].includes(e.status)
  );
  const verificationRate =
    agent.workEpisodes.length > 0
      ? Math.round((completedEpisodes.length / agent.workEpisodes.length) * 100)
      : 0;

  const ratings = agent.workEpisodes
    .map((e) => e.confirmation?.rating)
    .filter((r): r is number => r !== null && r !== undefined);
  const avgRating = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
    : null;

  // ── Monthly income breakdown (last 6 months) ─────────────────────────────
  const monthlyBreakdown: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyBreakdown[key] = 0;
  }
  for (const entry of agent.incomeLedger) {
    const key = `${entry.periodYear}-${String(entry.periodMonth).padStart(2, "0")}`;
    if (key in monthlyBreakdown) monthlyBreakdown[key] += entry.amount;
  }

  const maxMonthlyIncome = Math.max(...Object.values(monthlyBreakdown), 1);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xl shrink-0">
          {agent.user.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{agent.user.name}</h1>
            <Badge className={getStatusBadge(agent.status).color}>
              {getStatusBadge(agent.status).label}
            </Badge>
          </div>
          <p className="text-gray-500 mt-0.5">
            {agent.user.email} · {agent.user.phone || "No phone"} ·{" "}
            {agent.district ? (
              <>
                {agent.district}
                {agent.location ? `, ${agent.location}` : ""}
              </>
            ) : (
              "Location unknown"
            )}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skills.map((s) => (
              <span key={s} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {canEdit && <EditProfileButton agent={agent} />}
          <GenerateProfileButton agentId={agent.id} />
        </div>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={formatLocal(totalIncome)} icon={Wallet} iconColor="text-green-600" />
        <StatCard
          title="Last 30 Days"
          value={formatLocal(income30d)}
          icon={TrendingUp}
          iconColor="text-blue-600"
          trend={incomeGrowthPct !== null ? { value: incomeGrowthPct, label: "vs prev 30d" } : undefined}
        />
        <StatCard
          title="Verification Rate"
          value={`${verificationRate}%`}
          subtitle={`${completedEpisodes.length}/${agent.workEpisodes.length} episodes verified`}
          icon={ShieldCheck}
          iconColor="text-teal-600"
        />
        <StatCard
          title="Avg Rating"
          value={avgRating ? `${avgRating}/5` : "No ratings"}
          subtitle={`${ratings.length} merchant ratings`}
          icon={Star}
          iconColor="text-yellow-500"
        />
      </div>

      {/* Economic profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <CardTitle>Economic Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Verification breakdown */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Income by Verification Level</p>
            <div className="space-y-2">
              {[
                { label: "Self-Reported", value: totalIncome - verifiedIncome, color: "bg-yellow-400" },
                { label: "Proof Uploaded", value: verifiedIncome - merchantConfirmedIncome, color: "bg-blue-400" },
                { label: "Merchant Confirmed", value: merchantConfirmedIncome, color: "bg-green-500" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-medium text-gray-900">{formatLocal(Math.max(row.value, 0))}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full ${row.color}`}
                      style={{ width: totalIncome > 0 ? `${Math.max((row.value / totalIncome) * 100, 0)}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly income chart */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Monthly Income (Last 6 Months)</p>
            <div className="flex items-end gap-2 h-24">
              {Object.entries(monthlyBreakdown).map(([month, amount]) => {
                const pct = maxMonthlyIncome > 0 ? (amount / maxMonthlyIncome) * 100 : 0;
                const label = month.split("-")[1];
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                      <div
                        className="w-full rounded-t-sm bg-indigo-500 min-h-[2px] transition-all"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                        title={formatLocal(amount)}
                      />
                    </div>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Program enrollments */}
          {agent.enrollments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Programs Enrolled</p>
              <div className="flex flex-wrap gap-2">
                {agent.enrollments.map((e) => (
                  <div key={e.id} className="rounded-lg bg-indigo-50 border border-indigo-200 px-3 py-1.5">
                    <p className="text-xs font-medium text-indigo-800">{e.cohort.name}</p>
                    <p className="text-xs text-indigo-500">{e.cohort.org.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Career Profile */}
      {aiProfile && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-violet-600" />
              <CardTitle>AI Career Profile</CardTitle>
              {agent.aiProfileAt && (
                <span className="text-xs text-gray-400">Generated {timeAgo(agent.aiProfileAt)}</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiProfile.summary && (
              <p className="text-sm text-gray-700 bg-violet-50 border border-violet-100 rounded-lg p-4">
                {aiProfile.summary}
              </p>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {(aiProfile.strengths ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {(aiProfile.strengths ?? []).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(aiProfile.weaknesses ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Areas to Improve</p>
                  <ul className="space-y-1">
                    {(aiProfile.weaknesses ?? []).map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-orange-500 mt-0.5">△</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(aiProfile.recommendedJobs ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommended Opportunities</p>
                  <ul className="space-y-1">
                    {(aiProfile.recommendedJobs ?? []).map((j, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-indigo-500 mt-0.5">→</span> {j}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(aiProfile.suggestedTraining ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Suggested Training</p>
                  <ul className="space-y-1">
                    {(aiProfile.suggestedTraining ?? []).map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 mt-0.5">📚</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(aiProfile.growthOpportunities ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Growth Opportunities</p>
                  <ul className="space-y-1">
                    {(aiProfile.growthOpportunities ?? []).map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 mt-0.5">↑</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(aiProfile.riskFactors ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Risk Factors</p>
                  <ul className="space-y-1">
                    {(aiProfile.riskFactors ?? []).map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-yellow-500 mt-0.5">⚠</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(aiProfile.incomeImprovementTips ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Income Improvement</p>
                  <ul className="space-y-1">
                    {(aiProfile.incomeImprovementTips ?? []).map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-600 mt-0.5">💡</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work history */}
      <Card>
        <CardHeader>
          <CardTitle>Work History ({agent.workEpisodes.length} episodes)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {agent.workEpisodes.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No work episodes yet.</div>
            )}
            {agent.workEpisodes.map((ep) => {
              const status = getStatusBadge(ep.status);
              const vl = ep.payment ? getVerificationBadge(ep.payment.proofStatus) : null;
              return (
                <div key={ep.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{ep.title}</p>
                    <p className="text-xs text-gray-400">
                      {ep.merchant?.name || "No merchant"} · {ep.serviceType.replace(/_/g, " ")} · {timeAgo(ep.createdAt)}
                      {ep.confirmation?.rating ? ` · ${ep.confirmation.rating}★` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium text-gray-700">{formatLocal(ep.amount)}</span>
                    {vl && <Badge className={vl.color}>{vl.label}</Badge>}
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
