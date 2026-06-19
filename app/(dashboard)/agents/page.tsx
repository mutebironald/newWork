import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getStatusBadge, formatLocal } from "@/lib/utils";
import Link from "next/link";
import { Users, Star, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const agentsSnapshot = await db.collection("agent_profiles").get();
  const agents: any[] = [];
  for (const doc of agentsSnapshot.docs) {
    const agentData = doc.data();

    // Fetch user
    const userDoc = await db.collection("users").doc(agentData.userId).get();
    const user = userDoc.exists ? userDoc.data() : { name: "Unknown" };

    // Fetch incomeLedger
    const ledgerSnapshot = await db
      .collection("income_ledger")
      .where("agentId", "==", doc.id)
      .get();
    const incomeLedger = ledgerSnapshot.docs.map((d: any) => d.data());

    // Fetch workEpisodes
    const episodesSnapshot = await db
      .collection("work_episodes")
      .where("agentId", "==", doc.id)
      .get();
    const workEpisodes = episodesSnapshot.docs.map((d: any) => ({ status: d.data().status }));

    // Fetch enrollments
    const enrollmentsSnapshot = await db
      .collection("cohort_enrollments")
      .where("agentId", "==", doc.id)
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
      enrollments.push({ ...enrollment, cohort });
    }

    agents.push({
      ...agentData,
      id: doc.id,
      user,
      incomeLedger,
      workEpisodes,
      enrollments,
    });
  }

  // Sort by createdAt desc
  agents.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-sm text-gray-500 mt-1">{agents.length} workers on platform</p>
        </div>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Users className="h-4 w-4" />
          Add Agent
        </Link>
      </div>

      <div className="grid gap-4">
        {agents.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No agents yet. Register agents to get started.</p>
          </div>
        )}
        {agents.map((agent) => {
          const skills: string[] = agent.skills ?? [];
          const totalIncome = agent.incomeLedger.reduce((s: number, l: any) => s + l.amount, 0);
          const completedEpisodes = agent.workEpisodes.filter(
            (e: any) => e.status === "verified" || e.status === "paid"
          ).length;
          const aiProfile = agent.aiProfile as { summary?: string } | null;
          const status = getStatusBadge(agent.status);

          return (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <div className="rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm shrink-0">
                    {agent.user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{agent.user.name}</h3>
                      <Badge className={status.color}>{status.label}</Badge>
                      {aiProfile && (
                        <Badge className="text-violet-700 bg-violet-50 border-violet-200">
                          AI Profiled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {agent.district || "Location unknown"} ·{" "}
                      {agent.user.email}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {s}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span className="text-xs text-gray-400">+{skills.length - 4} more</span>
                      )}
                    </div>
                    {aiProfile?.summary && (
                      <p className="text-xs text-violet-600 mt-2 line-clamp-1">
                        AI: {aiProfile.summary}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-2">
                    <div>
                      <p className="text-xs text-gray-400">Total Income</p>
                      <p className="text-sm font-bold text-green-700">{formatLocal(totalIncome)}</p>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        {completedEpisodes} done
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="h-3.5 w-3.5 text-yellow-500" />
                        {agent.enrollments.length} programs
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
