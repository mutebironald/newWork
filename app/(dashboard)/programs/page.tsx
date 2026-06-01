import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStatusBadge, formatLocal } from "@/lib/utils";
import Link from "next/link";
import { Building2, Users, ListChecks, Wallet, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orgs = await db.organization.findMany({
    include: {
      members: { include: { user: true } },
      cohorts: {
        include: {
          enrollments: true,
          workEpisodes: true,
        },
      },
      subscriptions: { where: { status: "active" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations & Programs</h1>
          <p className="text-sm text-gray-500 mt-1">{orgs.length} organizations · Revenue from org subscriptions (not agent fees)</p>
        </div>
        <Link
          href="/programs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Organization
        </Link>
      </div>

      {orgs.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No organizations yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Register as an Organization Admin to create programs.
          </p>
        </div>
      )}

      {orgs.map((org) => {
        const activeSub = org.subscriptions[0];
        return (
          <Card key={org.id}>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm">
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      <Badge className="text-gray-600 bg-gray-100 border-gray-200 capitalize">
                        {org.type}
                      </Badge>
                      {activeSub ? (
                        <Badge className="text-green-700 bg-green-50 border-green-200 capitalize">
                          {activeSub.tier} · ${activeSub.priceUsd}/mo
                        </Badge>
                      ) : (
                        <Badge className="text-gray-500 bg-gray-50 border-gray-200">
                          Free tier
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{org.email || "No email"} · {org.country}</p>
                  </div>
                </div>
                <Link
                  href={`/programs/${org.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View details →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Cohorts ({org.cohorts.length})
                </p>
                {org.cohorts.length === 0 ? (
                  <p className="text-sm text-gray-400">No cohorts yet.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {org.cohorts.map((cohort) => {
                      const totalIncome = 0;
                      const verifiedEps = cohort.workEpisodes.filter((e) =>
                        ["verified", "paid", "merchant_confirmed"].includes(e.status)
                      ).length;
                      const status = getStatusBadge(cohort.status);
                      const agentProgress = Math.min(
                        Math.round((cohort.enrollments.length / cohort.goalAgents) * 100),
                        100
                      );
                      const episodeProgress = Math.min(
                        Math.round((cohort.workEpisodes.length / cohort.goalEpisodes) * 100),
                        100
                      );

                      return (
                        <div
                          key={cohort.id}
                          className="rounded-lg border border-gray-200 p-4 hover:border-indigo-200 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-medium text-sm text-gray-900">{cohort.name}</p>
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center mb-3">
                            <div>
                              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                <Users className="h-3 w-3" />
                                Agents
                              </div>
                              <p className="text-sm font-bold text-gray-900">
                                {cohort.enrollments.length}/{cohort.goalAgents}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                <ListChecks className="h-3 w-3" />
                                Episodes
                              </div>
                              <p className="text-sm font-bold text-gray-900">
                                {cohort.workEpisodes.length}/{cohort.goalEpisodes}
                              </p>
                              <p className="text-xs text-green-600">{verifiedEps} verified</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                                <Wallet className="h-3 w-3" />
                                Income
                              </div>
                              <p className="text-xs font-bold text-gray-900">
                                {formatLocal(totalIncome)}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div>
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Agents</span>
                                <span>{agentProgress}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100">
                                <div
                                  className="h-1.5 rounded-full bg-indigo-500"
                                  style={{ width: `${agentProgress}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Episodes</span>
                                <span>{episodeProgress}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-gray-100">
                                <div
                                  className="h-1.5 rounded-full bg-green-500"
                                  style={{ width: `${episodeProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
