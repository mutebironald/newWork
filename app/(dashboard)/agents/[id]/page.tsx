import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { getStatusBadge, getVerificationBadge, formatLocal, timeAgo } from "@/lib/utils";
import { GenerateProfileButton } from "./generate-profile-button";
import { EditProfileButton } from "./edit-profile-button";
import { GenerateOffersButton } from "./generate-offers-button";
import Link from "next/link";
import { Wallet, Star, Bot, TrendingUp, ShieldCheck, BarChart3, Sparkles, Briefcase, DollarSign, Wrench, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const agentDoc = await db.collection("agent_profiles").doc(id).get();
  if (!agentDoc.exists) notFound();
  const agentData = agentDoc.data();

  // Fetch user
  const userDoc = await db.collection("users").doc(agentData.userId).get();
  if (!userDoc.exists) notFound();
  const user = userDoc.data();

  // Fetch workEpisodes
  const episodesSnapshot = await db
    .collection("work_episodes")
    .where("agentId", "==", id)
    .get();

  const workEpisodes: any[] = [];
  for (const epDoc of episodesSnapshot.docs) {
    const ep = epDoc.data();

    // Fetch merchant
    let merchant = null;
    if (ep.merchantId) {
      const merchantDoc = await db.collection("merchants").doc(ep.merchantId).get();
      if (merchantDoc.exists) merchant = merchantDoc.data();
    }

    // Fetch payment
    const paymentSnapshot = await db
      .collection("payments")
      .where("workEpisodeId", "==", epDoc.id)
      .limit(1)
      .get();
    const payment = !paymentSnapshot.empty ? paymentSnapshot.docs[0].data() : null;

    // Fetch confirmation
    const confSnapshot = await db
      .collection("merchant_confirmations")
      .where("workEpisodeId", "==", epDoc.id)
      .limit(1)
      .get();
    const confirmation = !confSnapshot.empty ? confSnapshot.docs[0].data() : null;

    workEpisodes.push({
      ...ep,
      id: epDoc.id,
      merchant,
      payment,
      confirmation,
    });
  }

  // Sort workEpisodes by createdAt desc
  workEpisodes.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Fetch incomeLedger
  const ledgerSnapshot = await db
    .collection("income_ledger")
    .where("agentId", "==", id)
    .get();

  const incomeLedger = ledgerSnapshot.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  incomeLedger.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Fetch enrollments
  const enrollmentsSnapshot = await db
    .collection("cohort_enrollments")
    .where("agentId", "==", id)
    .get();

  const enrollments: any[] = [];
  for (const eDoc of enrollmentsSnapshot.docs) {
    const enrollment = eDoc.data();
    const cohortDoc = await db.collection("cohorts").doc(enrollment.cohortId).get();
    let cohort = null;
    if (cohortDoc.exists) {
      const cohortData = cohortDoc.data();
      const orgDoc = await db.collection("organizations").doc(cohortData.orgId).get();
      const org = orgDoc.exists ? orgDoc.data() : { name: "Unknown" };
      cohort = { ...cohortData, org };
    }
    enrollments.push({
      ...enrollment,
      id: eDoc.id,
      cohort,
    });
  }

  // Fetch AI-generated service offers
  const offersSnapshot = await db
    .collection("service_offers")
    .where("agentId", "==", id)
    .get();
  const serviceOffers = offersSnapshot.docs
    .map((d: any) => ({ ...d.data(), id: d.id }))
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 3);

  // Fetch AI next action
  const nextActionLogsSnapshot = await db
    .collection("ai_workflow_logs")
    .where("entityId", "==", id)
    .where("workflowType", "==", "agent_recommendation")
    .get();
  const nextActionLogs = nextActionLogsSnapshot.docs.map((d: any) => ({ ...d.data(), id: d.id }));
  nextActionLogs.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const agent = {
    ...agentData,
    id,
    user,
    workEpisodes,
    incomeLedger,
    enrollments,
  };

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
  const totalIncome = agent.incomeLedger.reduce((s: number, l: any) => s + l.amount, 0);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const income30d = agent.incomeLedger
    .filter((l: any) => new Date(l.createdAt) >= thirtyDaysAgo)
    .reduce((s: number, l: any) => s + l.amount, 0);
  const income30dPrev = agent.incomeLedger
    .filter((l: any) => new Date(l.createdAt) >= sixtyDaysAgo && new Date(l.createdAt) < thirtyDaysAgo)
    .reduce((s: number, l: any) => s + l.amount, 0);
  const incomeGrowthPct =
    income30dPrev > 0 ? Math.round(((income30d - income30dPrev) / income30dPrev) * 100) : null;

  const verifiedIncome = agent.incomeLedger
    .filter((l: any) => l.verificationLevel !== "self_reported")
    .reduce((s: number, l: any) => s + l.amount, 0);
  const merchantConfirmedIncome = agent.incomeLedger
    .filter((l: any) => ["merchant_confirmed", "program_verified"].includes(l.verificationLevel))
    .reduce((s: number, l: any) => s + l.amount, 0);

  const completedEpisodes = agent.workEpisodes.filter(
    (e: any) => ["verified", "paid", "merchant_confirmed"].includes(e.status)
  );
  const verificationRate =
    agent.workEpisodes.length > 0
      ? Math.round((completedEpisodes.length / agent.workEpisodes.length) * 100)
      : 0;

  const ratings = agent.workEpisodes
    .map((e: any) => e.confirmation?.rating)
    .filter((r: any): r is number => r !== null && r !== undefined);
  const avgRating = ratings.length > 0
    ? (ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length).toFixed(1)
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
          {canEdit && (
            <>
              <Link
                href={`/agents/${agent.id}/onboard`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Sparkles className="h-4 w-4" /> Onboard Wizard
              </Link>
              <EditProfileButton agent={agent} />
            </>
          )}
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
                {agent.enrollments.map((e: any) => (
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

      {/* AI Work Designer — Service Offers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              <CardTitle>AI Work Designer — Service Offers</CardTitle>
            </div>
            {canEdit && <GenerateOffersButton agentId={agent.id} />}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            AI-generated service offers this agent can pitch to informal merchants
          </p>
        </CardHeader>
        <CardContent>
          {serviceOffers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <Sparkles className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">No service offers yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Click &quot;Generate Service Offers&quot; to let AI design practical merchant service offers based on this agent&apos;s skills.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {serviceOffers.map((offer: any) => (
                <div
                  key={offer.id}
                  className={`rounded-xl border p-4 flex flex-col gap-3 ${offer.selected ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-white"}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{offer.title}</p>
                      {offer.selected && (
                        <Badge className="text-emerald-700 bg-emerald-100 border-emerald-200 shrink-0 text-xs">Selected</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{offer.merchantType}</p>
                  </div>
                  <p className="text-xs text-gray-600">{offer.problemSolved}</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-700">
                      ${offer.priceRange?.min}–${offer.priceRange?.max} {offer.priceRange?.currency}
                    </span>
                    <span className={`ml-auto text-xs rounded-full px-2 py-0.5 ${
                      offer.difficulty === "low"
                        ? "bg-green-100 text-green-700"
                        : offer.difficulty === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {offer.difficulty} difficulty
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">First step</p>
                    <p className="text-xs text-gray-600 italic">{offer.firstStep}</p>
                  </div>
                  {(offer.toolsNeeded || []).length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Wrench className="h-3 w-3 text-gray-400" />
                      {(offer.toolsNeeded || []).map((t: string) => (
                        <span key={t} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  )}
                  <Link
                    href={`/merchants`}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500 font-medium mt-auto"
                  >
                    Find a merchant <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            {agent.workEpisodes.map((ep: any) => {
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
