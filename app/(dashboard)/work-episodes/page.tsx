import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getStatusBadge, formatLocal, timeAgo } from "@/lib/utils";
import Link from "next/link";
import { ListChecks, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_ORDER = [
  "planned", "assigned", "accepted", "in_progress", "delivered",
  "proof_uploaded", "merchant_confirmed", "paid", "verified",
  "cancelled", "disputed",
];

export default async function WorkEpisodesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const episodes = await db.workEpisode.findMany({
    include: {
      agent: { include: { user: true } },
      merchant: true,
      proofItems: { select: { aiStatus: true, aiConfidence: true } },
      confirmation: { select: { confirmed: true, rating: true } },
      payment: { select: { proofStatus: true, amount: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const counts = STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: episodes.filter((e) => e.status === s).length }),
    {} as Record<string, number>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Work Episode Engine</h1>
        <p className="text-sm text-gray-500 mt-1">
          {episodes.length} total · {counts.verified + counts.paid + counts.merchant_confirmed} verified/confirmed
        </p>
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
            {episodes.map((ep) => {
              const status = getStatusBadge(ep.status);
              const bestProof = ep.proofItems.sort((a, b) =>
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
