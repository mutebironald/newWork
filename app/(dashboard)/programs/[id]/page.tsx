import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { getStatusBadge, formatLocal, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Users, ListChecks, Wallet, Target, TrendingUp, AlertTriangle, CheckCircle2, Bot } from "lucide-react";
import { MonitorCohortButton } from "./monitor-cohort-button";

export const dynamic = "force-dynamic";

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const org = await db.organization.findUnique({
    where: { id },
    include: {
      members: { include: { user: true } },
      subscriptions: { where: { status: "active" }, take: 1 },
      cohorts: {
        include: {
          enrollments: {
            include: { agent: { include: { user: true, incomeLedger: true, workEpisodes: true } } },
          },
          workEpisodes: {
            include: { payment: true, confirmation: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!org) notFound();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/programs" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Programs
        </Link>
      </div>

      {/* Org header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xl shrink-0">
          {org.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
            <Badge className="text-gray-600 bg-gray-100 border-gray-200 capitalize">{org.type}</Badge>
            {org.subscriptions[0] ? (
              <Badge className="text-green-700 bg-green-50 border-green-200">
                {org.subscriptions[0].tier} · ${org.subscriptions[0].priceUsd}/mo
              </Badge>
            ) : (
              <Badge className="text-gray-500 bg-gray-50 border-gray-200">Free tier</Badge>
            )}
          </div>
          <p className="text-gray-500 mt-0.5">{org.email || "No email"} · {org.country}</p>
        </div>
      </div>

      {/* Cohorts */}
      {org.cohorts.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          No cohorts yet for this organization.
        </div>
      )}

      {org.cohorts.map((cohort) => {
        const episodes = cohort.workEpisodes;
        const verifiedEpisodes = episodes.filter((e) =>
          ["verified", "paid", "merchant_confirmed"].includes(e.status)
        );
        const merchantConfirmed = episodes.filter((e) => e.confirmation?.confirmed);
        const totalIncomeAmt = episodes
          .filter((e) => e.payment)
          .reduce((s, e) => s + (e.payment?.amount || 0), 0);
        const merchantConfirmedIncomeAmt = episodes
          .filter((e) => e.payment && e.confirmation?.confirmed)
          .reduce((s, e) => s + (e.payment?.amount || 0), 0);

        const agentProgress = Math.min((cohort.enrollments.length / cohort.goalAgents) * 100, 100);
        const episodeProgress = Math.min((episodes.length / cohort.goalEpisodes) * 100, 100);
        const incomeProgress = Math.min((totalIncomeAmt / cohort.goalIncome) * 100, 100);
        const verificationRate = episodes.length > 0
          ? Math.round((verifiedEpisodes.length / episodes.length) * 100)
          : 0;

        const atRiskAgents = cohort.enrollments.filter((e) => {
          const lastEpisode = e.agent.workEpisodes[0];
          return !lastEpisode ||
            new Date(lastEpisode.createdAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        });

        return (
          <Card key={cohort.id}>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{cohort.name}</CardTitle>
                    <Badge className={getStatusBadge(cohort.status).color}>
                      {getStatusBadge(cohort.status).label}
                    </Badge>
                  </div>
                  {cohort.description && (
                    <p className="text-sm text-gray-500 mt-1">{cohort.description}</p>
                  )}
                  {cohort.startDate && cohort.endDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(cohort.startDate).toLocaleDateString()} — {new Date(cohort.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <MonitorCohortButton cohortId={cohort.id} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="Agents Enrolled" value={`${cohort.enrollments.length}/${cohort.goalAgents}`} icon={Users} iconColor="text-indigo-600" />
                <StatCard title="Work Episodes" value={`${episodes.length}/${cohort.goalEpisodes}`} subtitle={`${verifiedEpisodes.length} verified`} icon={ListChecks} iconColor="text-blue-600" />
                <StatCard title="Income Generated" value={formatLocal(totalIncomeAmt)} subtitle={`Goal: ${formatLocal(cohort.goalIncome)}`} icon={Wallet} iconColor="text-green-600" />
                <StatCard title="Verification Rate" value={`${verificationRate}%`} subtitle={`${merchantConfirmed.length} merchant-confirmed`} icon={CheckCircle2} iconColor="text-teal-600" />
              </div>

              {/* Target vs Actual */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-500" />
                  Target vs Actual Progress
                </p>
                <div className="space-y-3">
                  {[
                    { label: "Agents", actual: cohort.enrollments.length, target: cohort.goalAgents, pct: agentProgress, color: "bg-indigo-500" },
                    { label: "Work Episodes", actual: episodes.length, target: cohort.goalEpisodes, pct: episodeProgress, color: "bg-blue-500" },
                    { label: "Income", actual: totalIncomeAmt, target: cohort.goalIncome, pct: incomeProgress, color: "bg-green-500", format: true },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-gray-700 font-medium">{row.label}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-900 font-semibold">
                            {row.format ? formatLocal(row.actual) : row.actual.toLocaleString()}
                          </span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-500">
                            {row.format ? formatLocal(row.target) : row.target.toLocaleString()} goal
                          </span>
                          <span className={`font-bold ${row.pct >= 80 ? "text-green-600" : row.pct >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                            {Math.round(row.pct)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-gray-100">
                        <div
                          className={`h-3 rounded-full transition-all ${row.color}`}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Self-Reported", count: episodes.length - verifiedEpisodes.length, income: totalIncomeAmt - merchantConfirmedIncomeAmt, color: "border-yellow-300 bg-yellow-50" },
                  { label: "Proof Uploaded", count: episodes.filter((e) => ["proof_uploaded", "merchant_confirmed", "paid", "verified"].includes(e.status)).length, income: 0, color: "border-blue-300 bg-blue-50" },
                  { label: "Merchant Confirmed", count: merchantConfirmed.length, income: merchantConfirmedIncomeAmt, color: "border-green-300 bg-green-50" },
                  { label: "Verified", count: verifiedEpisodes.filter((e) => e.status === "verified").length, income: 0, color: "border-purple-300 bg-purple-50" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-lg border p-3 ${item.color}`}>
                    <p className="text-xl font-bold text-gray-900">{item.count}</p>
                    <p className="text-xs font-medium text-gray-700">{item.label}</p>
                    {item.income > 0 && <p className="text-xs text-gray-500 mt-1">{formatLocal(item.income)}</p>}
                  </div>
                ))}
              </div>

              {/* At-risk agents */}
              {atRiskAgents.length > 0 && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm font-semibold text-yellow-800">
                      {atRiskAgents.length} At-Risk Agent{atRiskAgents.length !== 1 ? "s" : ""} (inactive 7+ days)
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {atRiskAgents.slice(0, 6).map((e) => (
                      <Link key={e.agentId} href={`/agents/${e.agentId}`}>
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-200 border border-yellow-300 px-2.5 py-0.5 text-xs font-medium text-yellow-900 hover:bg-yellow-300 transition-colors">
                          {e.agent.user.name}
                        </span>
                      </Link>
                    ))}
                    {atRiskAgents.length > 6 && (
                      <span className="text-xs text-yellow-600">+{atRiskAgents.length - 6} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Agent roster */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  Agent Roster ({cohort.enrollments.length})
                </p>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                  {cohort.enrollments.length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-400">No agents enrolled.</p>
                  )}
                  {cohort.enrollments.map((enrollment) => {
                    const agentIncome = enrollment.agent.incomeLedger.reduce((s, l) => s + l.amount, 0);
                    const agentEps = enrollment.agent.workEpisodes.length;
                    const isAtRisk = atRiskAgents.some((a) => a.agentId === enrollment.agentId);
                    return (
                      <Link key={enrollment.id} href={`/agents/${enrollment.agentId}`}>
                        <div className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer ${isAtRisk ? "bg-yellow-50" : ""}`}>
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 shrink-0">
                            {enrollment.agent.user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{enrollment.agent.user.name}</p>
                            <p className="text-xs text-gray-400">{enrollment.agent.district || "Unknown district"}</p>
                          </div>
                          {isAtRisk && (
                            <Badge className="text-yellow-700 bg-yellow-50 border-yellow-200 text-xs">At Risk</Badge>
                          )}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-medium text-green-700">{formatLocal(agentIncome)}</p>
                            <p className="text-xs text-gray-400">{agentEps} episodes</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
