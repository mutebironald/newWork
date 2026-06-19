import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getStatusBadge, formatLocal, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { ListChecks, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { LogEpisodeModal } from "./log-episode-modal";

export const dynamic = "force-dynamic";

const STATUS_ORDER = [
  "planned", "assigned", "accepted", "in_progress", "delivered",
  "proof_uploaded", "merchant_confirmed", "paid", "verified",
  "cancelled", "disputed",
];

export default async function WorkEpisodesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const episodesSnapshot = await db.collection("work_episodes").get();
  const episodes: any[] = [];
  for (const doc of episodesSnapshot.docs) {
    const ep = doc.data();

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

    // Fetch proofItems (select: aiStatus, aiConfidence)
    const proofsSnapshot = await db
      .collection("proof_items")
      .where("workEpisodeId", "==", doc.id)
      .get();
    const proofItems = proofsSnapshot.docs.map((d: any) => {
      const data = d.data();
      return { aiStatus: data.aiStatus, aiConfidence: data.aiConfidence };
    });

    // Fetch confirmation (select: confirmed, rating)
    const confSnapshot = await db
      .collection("merchant_confirmations")
      .where("workEpisodeId", "==", doc.id)
      .limit(1)
      .get();
    const confirmation = !confSnapshot.empty ? {
      confirmed: confSnapshot.docs[0].data().confirmed,
      rating: confSnapshot.docs[0].data().rating,
    } : null;

    // Fetch payment (select: proofStatus, amount)
    const paymentSnapshot = await db
      .collection("payments")
      .where("workEpisodeId", "==", doc.id)
      .limit(1)
      .get();
    const payment = !paymentSnapshot.empty ? {
      proofStatus: paymentSnapshot.docs[0].data().proofStatus,
      amount: paymentSnapshot.docs[0].data().amount,
    } : null;

    episodes.push({
      ...ep,
      id: doc.id,
      agent,
      merchant,
      proofItems,
      confirmation,
      payment,
    });
  }

  // Sort episodes by updatedAt desc
  episodes.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

  const merchantsSnapshot = await db.collection("merchants").get();
  const merchants = merchantsSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return { id: doc.id, name: data.name };
  });
  merchants.sort((a: any, b: any) => a.name.localeCompare(b.name));

  const agentsSnapshot = await db.collection("agent_profiles").get();
  const agents: any[] = [];
  for (const doc of agentsSnapshot.docs) {
    const agentData = doc.data();
    const userDoc = await db.collection("users").doc(agentData.userId).get();
    const user = userDoc.exists ? userDoc.data() : { name: "Unknown" };
    agents.push({
      ...agentData,
      id: doc.id,
      user: { name: user.name },
    });
  }
  agents.sort((a: any, b: any) => a.user.name.localeCompare(b.user.name));

  const formattedAgents = agents.map((a: any) => ({ id: a.id, name: a.user.name }));

  const counts = STATUS_ORDER.reduce(
    (acc: any, s: any) => ({ ...acc, [s]: episodes.filter((e: any) => e.status === s).length }),
    {} as Record<string, number>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Episode Engine</h1>
          <p className="text-sm text-gray-500 mt-1">
            {episodes.length} total · {counts.verified + counts.paid + counts.merchant_confirmed} verified/confirmed
          </p>
        </div>
        <LogEpisodeModal
          agentId={session.agentId}
          role={session.role}
          merchants={merchants}
          agents={formattedAgents}
        />
      </div>

      {/* Status pipeline */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2">
        {["planned","assigned","in_progress","delivered","proof_uploaded","merchant_confirmed","paid","verified","disputed"].map((s) => {
          const st = getStatusBadge(s);
          return (
            <div key={s} className={`rounded-lg border p-2 text-center ${st.color}`}>
              <p className="text-lg font-bold">{counts[s] || 0}</p>
              <p className="text-xs mt-0.5 leading-tight">{st.label}</p>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {episodes.length === 0 && (
              <div className="px-6 py-12 text-center">
                <ListChecks className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No work episodes yet.</p>
              </div>
            )}
            {episodes.map((ep: any) => {
              const status = getStatusBadge(ep.status);
              const bestProof = ep.proofItems.sort((a: any, b: any) =>
                (b.aiConfidence || 0) - (a.aiConfidence || 0)
              )[0];
              const hasIssue = ep.status === "disputed" || ep.status === "cancelled";

              return (
                <Link key={ep.id} href={`/work-episodes/${ep.id}`}>
                  <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shrink-0 ${
                        hasIssue ? "bg-red-500" : "bg-indigo-600"
                      }`}
                    >
                      {hasIssue ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : ep.status === "verified" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 truncate">{ep.title}</p>
                        <Badge className={status.color}>{status.label}</Badge>
                        {bestProof && (
                          <span className="text-xs text-violet-600 font-medium">
                            AI: {bestProof.aiStatus === "accepted" ? "✓" : bestProof.aiStatus === "pending" ? "…" : "✗"}{" "}
                            {bestProof.aiConfidence !== null
                              ? `${Math.round((bestProof.aiConfidence || 0) * 100)}%`
                              : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {ep.agent.user.name}
                        {ep.merchant ? ` → ${ep.merchant.name}` : ""}
                        {" · "}
                        {ep.serviceType.replace(/_/g, " ")}
                        {" · "}
                        {timeAgo(ep.updatedAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatLocal(ep.amount)}</p>
                      {ep.confirmation?.confirmed && (
                        <p className="text-xs text-green-600 flex items-center gap-1 justify-end">
                          <CheckCircle2 className="h-3 w-3" />
                          Merchant confirmed
                          {ep.confirmation.rating ? ` · ${ep.confirmation.rating}★` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
