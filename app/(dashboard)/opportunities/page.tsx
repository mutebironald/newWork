import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getStatusBadge, formatLocal, timeAgo } from "@/lib/utils";
import { Briefcase, Bot, Users, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const serviceTypeLabels: Record<string, string> = {
  merchant_outreach: "Merchant Outreach",
  catalog_creation: "Catalog Creation",
  business_profiling: "Business Profiling",
  photography: "Photography",
  survey: "Survey Collection",
  digital_presence: "Digital Presence",
  other: "Other",
};

export default async function OpportunitiesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const opportunities = await db.opportunity.findMany({
    include: {
      org: true,
      assignments: { include: { agent: { include: { user: true } } } },
      _count: { select: { workEpisodes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunity Marketplace</h1>
          <p className="text-sm text-gray-500 mt-1">
            {opportunities.filter((o) => o.status === "open").length} open opportunities
          </p>
        </div>
        <Link
          href="/opportunities/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Opportunity
        </Link>
      </div>

      {opportunities.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Briefcase className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No opportunities yet.</p>
          <Link href="/opportunities/new" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-500">
            Create the first one →
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {opportunities.map((opp) => {
          const skills: string[] = opp.skillsRequired ?? [];
          const status = getStatusBadge(opp.status);
          const topMatches = [...opp.assignments]
            .sort((a, b) => b.aiMatchScore - a.aiMatchScore)
            .slice(0, 3);

          return (
            <div
              key={opp.id}
              className="rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {opp.org.name} · {serviceTypeLabels[opp.serviceType] || opp.serviceType} · {opp.district || "Any district"}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-lg font-bold text-green-700">{formatLocal(opp.amount)}</p>
                  <p className="text-xs text-gray-400">per episode</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{opp.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {skills.map((s) => (
                  <span key={s} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="h-3.5 w-3.5" />
                  {opp.assignments.length}/{opp.maxAssignments} assigned · {opp._count.workEpisodes} episodes started
                </div>
                {opp.assignments.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-violet-600">
                    <Bot className="h-3.5 w-3.5" />
                    AI matched · Top: {Math.round((topMatches[0]?.aiMatchScore ?? 0) * 100)}%
                  </div>
                )}
              </div>

              {topMatches.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">AI Top Matches</p>
                  {topMatches.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                        {m.agent.user.name.charAt(0)}
                      </div>
                      <span className="text-xs text-gray-700 flex-1">{m.agent.user.name}</span>
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-16 rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500"
                            style={{ width: `${Math.round(m.aiMatchScore * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{Math.round(m.aiMatchScore * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3 text-right">Added {timeAgo(opp.createdAt)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
