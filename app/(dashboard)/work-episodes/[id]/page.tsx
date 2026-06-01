import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  getStatusBadge,
  getVerificationBadge,
  formatLocal,
  timeAgo,
  getWorkEpisodeNextStatus,
} from "@/lib/utils";
import { EpisodeStatusAdvancer } from "./status-advancer";
import { DisputeControls } from "./dispute-controls";
import { Bot, CheckCircle2, Star, FileText, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorkEpisodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const ep = await db.workEpisode.findUnique({
    where: { id },
    include: {
      agent: { include: { user: true } },
      merchant: true,
      opportunity: true,
      cohort: true,
      proofItems: { orderBy: { createdAt: "desc" } },
      confirmation: true,
      payment: true,
    },
  });

  if (!ep) notFound();

  const status = getStatusBadge(ep.status);
  const nextStatus = getWorkEpisodeNextStatus(ep.status);

  const statusFlow = [
    "planned","assigned","accepted","in_progress","delivered",
    "proof_uploaded","merchant_confirmed","paid","verified",
  ];
  const currentIdx = statusFlow.indexOf(ep.status);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{ep.title}</h1>
          <Badge className={status.color + " text-sm px-3 py-1"}>{status.label}</Badge>
        </div>
        <p className="text-sm text-gray-500">
          {ep.agent.user.name}
          {ep.merchant ? ` → ${ep.merchant.name}` : ""} ·{" "}
          {ep.serviceType.replace(/_/g, " ")} · Created {timeAgo(ep.createdAt)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="flex items-center gap-0">
          {statusFlow.map((s, i) => {
            const st = getStatusBadge(s);
            const done = i <= currentIdx;
            const current = i === currentIdx;
            return (
              <div key={s} className="flex-1 relative">
                <div
                  className={`h-1.5 ${i === 0 ? "rounded-l-full" : ""} ${
                    i === statusFlow.length - 1 ? "rounded-r-full" : ""
                  } ${done ? "bg-indigo-500" : "bg-gray-200"}`}
                />
                {current && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 ring-2 ring-white" />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-3">
          {statusFlow.map((s) => {
            const st = getStatusBadge(s);
            return (
              <p key={s} className="text-xs text-gray-400 flex-1 text-center leading-tight">
                {st.label}
              </p>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard title="Episode Amount" value={formatLocal(ep.amount)} />
        <StatCard
          title="Proof Items"
          value={`${ep.proofItems.filter((p) => p.aiStatus === "accepted").length}/${ep.proofItems.length}`}
          subtitle="AI accepted/total"
        />
        <StatCard
          title="Merchant Confirmed"
          value={ep.confirmation?.confirmed ? "Yes" : "No"}
          subtitle={
            ep.confirmation?.rating ? `${ep.confirmation.rating}/5 stars` : "Awaiting confirmation"
          }
        />
      </div>

      {nextStatus && !["cancelled", "disputed"].includes(ep.status) && (
        <EpisodeStatusAdvancer episodeId={ep.id} currentStatus={ep.status} nextStatus={nextStatus} />
      )}

      <DisputeControls episodeId={ep.id} currentStatus={ep.status} />

      {/* Proof items */}
      {ep.proofItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <CardTitle>Proof of Work ({ep.proofItems.length} items)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ep.proofItems.map((proof) => {
              const aiStatusColor =
                proof.aiStatus === "accepted"
                  ? "text-green-700 bg-green-50 border-green-200"
                  : proof.aiStatus === "rejected"
                  ? "text-red-700 bg-red-50 border-red-200"
                  : proof.aiStatus === "needs_more_info"
                  ? "text-yellow-700 bg-yellow-50 border-yellow-200"
                  : "text-gray-700 bg-gray-50 border-gray-200";

              return (
                <div
                  key={proof.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600 shrink-0 uppercase">
                    {proof.fileType.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {proof.fileName || "Unnamed file"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {proof.fileSizeBytes
                        ? `${Math.round(proof.fileSizeBytes / 1024)}KB`
                        : "Size unknown"}{" "}
                      · {timeAgo(proof.createdAt)}
                    </p>
                    {proof.aiNotes && (
                      <p className="text-xs text-violet-600 mt-1 flex items-start gap-1">
                        <Bot className="h-3 w-3 mt-0.5 shrink-0" />
                        {proof.aiNotes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 space-y-1.5 text-right">
                    <Badge className={aiStatusColor}>
                      AI: {proof.aiStatus.replace(/_/g, " ")}
                    </Badge>
                    {proof.aiConfidence !== null && (
                      <p className="text-xs text-gray-500">
                        {Math.round((proof.aiConfidence || 0) * 100)}% confidence
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Merchant confirmation */}
      {ep.confirmation && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <CardTitle>Merchant Confirmation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div>
                <Badge
                  className={
                    ep.confirmation.confirmed
                      ? "text-green-700 bg-green-50 border-green-200"
                      : "text-red-700 bg-red-50 border-red-200"
                  }
                >
                  {ep.confirmation.confirmed ? "Work Confirmed" : "Not Confirmed"}
                </Badge>
                {ep.confirmation.rating && (
                  <div className="flex items-center gap-1 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (ep.confirmation?.rating || 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {ep.confirmation.feedback && (
                <p className="text-sm text-gray-700 italic">"{ep.confirmation.feedback}"</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment */}
      {ep.payment && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-500" />
              <CardTitle>Payment Record</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-700">{formatLocal(ep.payment.amount)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Via {ep.payment.method.replace(/_/g, " ")}
                  {ep.payment.reference ? ` · Ref: ${ep.payment.reference}` : ""}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Merchant paid agent directly — platform does not touch funds
                </p>
              </div>
              <Badge className={getVerificationBadge(ep.payment.proofStatus).color}>
                {getVerificationBadge(ep.payment.proofStatus).label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
