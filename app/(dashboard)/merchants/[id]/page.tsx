import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { getStatusBadge, formatLocal, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Store, CheckCircle2, Star, Users, Wallet, AlertCircle, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MerchantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const merchantDoc = await db.collection("merchants").doc(id).get();
  if (!merchantDoc.exists) notFound();
  const merchantData = merchantDoc.data();

  // Fetch org
  const orgDoc = await db.collection("organizations").doc(merchantData.orgId).get();
  const org = orgDoc.exists ? orgDoc.data() : { name: "Unknown" };

  // Fetch workEpisodes
  const episodesSnapshot = await db
    .collection("work_episodes")
    .where("merchantId", "==", id)
    .get();

  const workEpisodes: any[] = [];
  for (const epDoc of episodesSnapshot.docs) {
    const ep = epDoc.data();

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

    // Fetch proofItems (select aiStatus, aiConfidence)
    const proofsSnapshot = await db
      .collection("proof_items")
      .where("workEpisodeId", "==", epDoc.id)
      .get();
    const proofItems = proofsSnapshot.docs.map((d: any) => {
      const data = d.data();
      return { aiStatus: data.aiStatus, aiConfidence: data.aiConfidence };
    });

    // Fetch payment (select amount, method, proofStatus)
    const paymentSnapshot = await db
      .collection("payments")
      .where("workEpisodeId", "==", epDoc.id)
      .limit(1)
      .get();
    const payment = !paymentSnapshot.empty ? {
      amount: paymentSnapshot.docs[0].data().amount,
      method: paymentSnapshot.docs[0].data().method,
      proofStatus: paymentSnapshot.docs[0].data().proofStatus,
    } : null;

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
      agent,
      proofItems,
      payment,
      confirmation,
    });
  }

  // Sort workEpisodes by createdAt desc
  workEpisodes.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Fetch confirmations
  const confirmationsSnapshot = await db
    .collection("merchant_confirmations")
    .where("merchantId", "==", id)
    .get();

  const confirmations: any[] = [];
  for (const cDoc of confirmationsSnapshot.docs) {
    const conf = cDoc.data();

    // Find matching workEpisode or fetch it
    let workEpisode = workEpisodes.find((w) => w.id === conf.workEpisodeId);
    if (!workEpisode) {
      const epDoc = await db.collection("work_episodes").doc(conf.workEpisodeId).get();
      if (epDoc.exists) {
        const epData = epDoc.data();
        const agentDoc = await db.collection("agent_profiles").doc(epData.agentId).get();
        let agent = null;
        if (agentDoc.exists) {
          const agentData = agentDoc.data();
          const userDoc = await db.collection("users").doc(agentData.userId).get();
          const user = userDoc.exists ? userDoc.data() : { name: "Unknown" };
          agent = { ...agentData, id: epData.agentId, user };
        }
        workEpisode = { ...epData, id: conf.workEpisodeId, agent };
      }
    }

    if (workEpisode) {
      confirmations.push({
        ...conf,
        id: cDoc.id,
        workEpisode,
      });
    }
  }

  confirmations.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const merchant = {
    ...merchantData,
    id,
    org,
    workEpisodes,
    confirmations,
  };

  const completedEpisodes = merchant.workEpisodes.filter((e: any) =>
    ["verified", "paid", "merchant_confirmed"].includes(e.status)
  );
  const confirmedEpisodes = merchant.confirmations.filter((c: any) => c.confirmed);
  const totalPaid = merchant.workEpisodes.reduce(
    (s: number, e: any) => s + (e.payment ? e.payment.amount : 0),
    0
  );
  const ratings = merchant.confirmations.filter((c: any) => c.rating);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((s: number, c: any) => s + (c.rating || 0), 0) / ratings.length
      : null;

  const uniqueAgents = new Set(merchant.workEpisodes.map((e: any) => e.agentId));
  const agentStats = Array.from(uniqueAgents).map((agentId: any) => {
    const episodes = merchant.workEpisodes.filter((e: any) => e.agentId === agentId);
    const agent = episodes[0]?.agent;
    const confirmed = merchant.confirmations.filter(
      (c: any) => c.workEpisode.agentId === agentId && c.confirmed
    ).length;
    const agentRatings = merchant.confirmations.filter(
      (c: any) => c.workEpisode.agentId === agentId && c.rating
    );
    const agentAvgRating =
      agentRatings.length > 0
        ? agentRatings.reduce((s: number, c: any) => s + (c.rating || 0), 0) / agentRatings.length
        : null;
    return { agent, episodes: episodes.length, confirmed, avgRating: agentAvgRating };
  });

  const categoryColors: Record<string, string> = {
    pharmacy: "text-blue-700 bg-blue-50 border-blue-200",
    restaurant: "text-orange-700 bg-orange-50 border-orange-200",
    salon: "text-pink-700 bg-pink-50 border-pink-200",
    shop: "text-green-700 bg-green-50 border-green-200",
    retail: "text-indigo-700 bg-indigo-50 border-indigo-200",
    market: "text-yellow-700 bg-yellow-50 border-yellow-200",
    other: "text-gray-700 bg-gray-50 border-gray-200",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/merchants" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Merchants
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 text-xl font-bold shrink-0">
          <Store className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
            <Badge className={categoryColors[merchant.category] || categoryColors.other}>
              {merchant.category}
            </Badge>
            <Badge className={getStatusBadge(merchant.status).color}>
              {getStatusBadge(merchant.status).label}
            </Badge>
          </div>
          <p className="text-gray-500 mt-0.5">
            {merchant.phone} · {merchant.district || "District unknown"}
            {merchant.address ? ` · ${merchant.address}` : ""}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Part of <span className="font-medium text-gray-600">{merchant.org.name}</span>
          </p>
        </div>
        <Link
          href={`/merchants/${merchant.id}/service-workspace`}
          className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Wrench className="h-4 w-4" /> Service Workspace
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Work Episodes" value={merchant.workEpisodes.length} icon={Users} iconColor="text-indigo-600" subtitle={`${completedEpisodes.length} completed`} />
        <StatCard title="Confirmed Work" value={confirmedEpisodes.length} icon={CheckCircle2} iconColor="text-green-600" subtitle="Merchant confirmed" />
        <StatCard title="Total Paid to Agents" value={formatLocal(totalPaid)} icon={Wallet} iconColor="text-teal-600" subtitle="Agents paid directly" />
        <StatCard
          title="Avg Rating"
          value={avgRating ? `${avgRating.toFixed(1)} / 5` : "—"}
          icon={Star}
          iconColor="text-yellow-500"
          subtitle={`${ratings.length} ratings given`}
        />
      </div>

      {/* Money flow note */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">Platform money model</p>
          <p className="text-sm text-green-700 mt-0.5">
            This merchant pays agents directly via Mobile Money or cash. NewWork is a SaaS platform — it does not
            intermediate any payments. The platform charges the organization a subscription fee only.
          </p>
        </div>
      </div>

      {/* Agents worked with */}
      {agentStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agents Who Worked Here ({agentStats.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {agentStats.map(({ agent, episodes, confirmed, avgRating: ar }) => (
                <div key={agent?.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shrink-0">
                    {agent?.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{agent?.user.name}</p>
                    <p className="text-xs text-gray-400">{agent?.user.email}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
                    <span>{episodes} episode{episodes !== 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      {confirmed} confirmed
                    </span>
                    {ar && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        {ar.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <Link href={`/agents/${agent?.id}`} className="text-xs text-indigo-600 hover:text-indigo-500">
                    View agent →
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work episode history */}
      <Card>
        <CardHeader>
          <CardTitle>All Work Episodes ({merchant.workEpisodes.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {merchant.workEpisodes.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No work episodes yet.</div>
            )}
            {merchant.workEpisodes.map((ep: any) => {
              const status = getStatusBadge(ep.status);
              const proofAccepted = ep.proofItems.filter((p: any) => p.aiStatus === "accepted").length;
              return (
                <Link key={ep.id} href={`/work-episodes/${ep.id}`}>
                  <div className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 cursor-pointer">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 shrink-0">
                      {ep.agent.user.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ep.title}</p>
                      <p className="text-xs text-gray-400">
                        {ep.agent.user.name} · {ep.serviceType.replace(/_/g, " ")} · {timeAgo(ep.createdAt)}
                        {proofAccepted > 0 ? ` · ${proofAccepted} proof accepted` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ep.confirmation?.confirmed && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm font-medium text-gray-700">{formatLocal(ep.amount)}</span>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation history */}
      {confirmedEpisodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feedback Given ({confirmedEpisodes.length} confirmations)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {confirmedEpisodes.map((conf: any) => (
              <div key={conf.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{conf.workEpisode.agent.user.name}</p>
                    {conf.rating && (
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < conf.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{conf.confirmedAt ? timeAgo(conf.confirmedAt) : ""}</span>
                </div>
                {conf.feedback && (
                  <p className="text-sm text-gray-600 italic">"{conf.feedback}"</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
