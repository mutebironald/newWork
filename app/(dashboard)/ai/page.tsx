import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { formatLocal, timeAgo, calculateAiAutonomyRate } from "@/lib/utils";
import { RunAiButton } from "./run-ai-button";
import { Bot, CheckCircle2, AlertTriangle, Clock, Zap, Brain } from "lucide-react";

export const dynamic = "force-dynamic";

const WORKFLOW_LABELS: Record<string, string> = {
  proof_verification: "Proof Verification",
  opportunity_matching: "Opportunity Matching",
  career_profile: "Career Profile",
  program_monitoring: "Program Monitoring",
  fraud_detection: "Fraud Detection",
  report_generation: "Report Generation",
  agent_recommendation: "Agent Recommendation",
  risk_assessment: "Risk Assessment",
};

export default async function AiEnginePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [logs, fraudFlags, pendingProofs] = await Promise.all([
    db.aiWorkflowLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.fraudFlag.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
    }),
    db.proofItem.findMany({
      where: { aiStatus: "pending" },
      include: { workEpisode: { include: { agent: { include: { user: true } } } } },
    }),
  ]);

  const autonomyRate = calculateAiAutonomyRate(logs);
  const totalLogs = logs.length;
  const successRate = totalLogs > 0 ? logs.filter((l) => l.success).length / totalLogs : 0;
  const avgLatency =
    totalLogs > 0
      ? Math.round(logs.reduce((s, l) => s + (l.latencyMs || 0), 0) / totalLogs)
      : 0;
  const totalTokens = logs.reduce((s, l) => s + (l.tokensUsed || 0), 0);

  const workflowCounts = logs.reduce(
    (acc, l) => ({ ...acc, [l.workflowType]: (acc[l.workflowType] || 0) + 1 }),
    {} as Record<string, number>
  );

  const processMap = [
    { process: "Proof Verification", autonomous: true, description: "AI triages all proof items, assigns confidence scores" },
    { process: "Opportunity Matching", autonomous: true, description: "AI ranks agents by skill/location/performance fit" },
    { process: "Career Profile Generation", autonomous: true, description: "AI builds personalized career profiles for agents" },
    { process: "Cohort Health Monitoring", autonomous: true, description: "AI flags at-risk agents and stalled programs" },
    { process: "Fraud Detection", autonomous: true, description: "AI detects duplicates, suspicious patterns, unusual volume" },
    { process: "Impact Report Generation", autonomous: true, description: "AI writes donor-ready impact reports" },
    { process: "Merchant Work Confirmation", autonomous: false, description: "Merchant confirms via phone/SMS (human step)" },
    { process: "Program Goal Setting", autonomous: false, description: "Organization sets cohort targets (human step)" },
  ];

  const autonomousProcesses = processMap.filter((p) => p.autonomous).length;
  const governanceRate = Math.round((autonomousProcesses / processMap.length) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Engine</h1>
          <p className="text-sm text-gray-500 mt-1">
            Autonomous operations layer — AI executes, not just recommends
          </p>
        </div>
        <RunAiButton />
      </div>

      {/* AI metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total AI Decisions"
          value={totalLogs.toLocaleString()}
          icon={Bot}
          iconColor="text-violet-600"
        />
        <StatCard
          title="Autonomy Rate"
          value={`${Math.round(autonomyRate * 100)}%`}
          subtitle="Fully autonomous decisions"
          icon={Zap}
          iconColor="text-indigo-600"
        />
        <StatCard
          title="Success Rate"
          value={`${Math.round(successRate * 100)}%`}
          icon={CheckCircle2}
          iconColor="text-green-600"
        />
        <StatCard
          title="Avg Latency"
          value={`${avgLatency}ms`}
          subtitle={`${totalTokens.toLocaleString()} tokens used`}
          icon={Clock}
          iconColor="text-blue-600"
        />
      </div>

      {/* Governance Evidence — Gap 5 */}
      <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-600" />
            <h3 className="font-semibold text-violet-900 text-lg">AI Governance Evidence</h3>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-violet-700">{governanceRate}%</div>
            <div className="text-xs text-violet-500">processes AI-governed</div>
          </div>
        </div>
        <div className="h-3 rounded-full bg-violet-100 mb-5">
          <div className="h-3 rounded-full bg-violet-500" style={{ width: `${governanceRate}%` }} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* AI Owns */}
          <div className="rounded-lg border border-violet-300 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <p className="text-sm font-bold text-violet-800">AI Executes Autonomously</p>
            </div>
            <div className="space-y-2">
              {processMap.filter((p) => p.autonomous).map((p) => (
                <div key={p.process} className="flex items-start gap-2 p-2 rounded-lg bg-violet-50">
                  <CheckCircle2 className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-violet-900">{p.process}</p>
                    <p className="text-xs text-violet-600">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Human Owns */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-400">
                <span className="text-white text-xs font-bold">H</span>
              </div>
              <p className="text-sm font-bold text-gray-700">Human In-Loop (By Design)</p>
            </div>
            <div className="space-y-2">
              {processMap.filter((p) => !p.autonomous).map((p) => (
                <div key={p.process} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                  <AlertTriangle className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{p.process}</p>
                    <p className="text-xs text-gray-500">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-2">
              <p className="text-xs text-blue-700 font-medium">Why these are human steps:</p>
              <p className="text-xs text-blue-600 mt-0.5">
                Merchant confirmation and goal-setting involve external parties (merchants, org admins)
                who operate outside the platform. This is intentional — not a gap.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Volume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(workflowCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const max = Math.max(...Object.values(workflowCounts));
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">
                        {WORKFLOW_LABELS[type] || type}
                      </span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-violet-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(workflowCounts).length === 0 && (
              <p className="text-sm text-gray-400">No AI workflows run yet. Trigger from agent profiles, work episodes, or the Run AI button above.</p>
            )}
          </CardContent>
        </Card>

        {/* Fraud flags */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <CardTitle>Fraud Flags ({fraudFlags.length} unresolved)</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fraudFlags.length === 0 ? (
              <div className="px-6 py-6 text-center text-sm text-gray-400">
                No unresolved fraud flags.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {fraudFlags.slice(0, 5).map((flag) => (
                  <div key={flag.id} className="px-6 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={
                          flag.severity === "high"
                            ? "text-red-700 bg-red-50 border-red-200"
                            : flag.severity === "medium"
                            ? "text-yellow-700 bg-yellow-50 border-yellow-200"
                            : "text-gray-600 bg-gray-50 border-gray-200"
                        }
                      >
                        {flag.severity}
                      </Badge>
                      <span className="text-xs font-medium text-gray-700">
                        {flag.flagType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{flag.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(flag.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending proof queue */}
      {pendingProofs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending AI Verification Queue ({pendingProofs.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {pendingProofs.map((proof) => (
                <div key={proof.id} className="flex items-center gap-3 px-6 py-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                    {proof.fileType.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {proof.workEpisode.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {proof.workEpisode.agent.user.name} · {proof.fileType} · {timeAgo(proof.createdAt)}
                    </p>
                  </div>
                  <Badge className="text-yellow-700 bg-yellow-50 border-yellow-200">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent AI Workflow Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {logs.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No AI workflows logged yet.
              </div>
            )}
            {logs.slice(0, 15).map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-6 py-3 hover:bg-gray-50">
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                    log.success ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">
                      {WORKFLOW_LABELS[log.workflowType] || log.workflowType}
                    </p>
                    {log.autonomousDecision && (
                      <Badge className="text-violet-700 bg-violet-50 border-violet-200 text-xs">
                        Autonomous
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {log.outputSummary || "No output"} ·{" "}
                    {log.latencyMs ? `${log.latencyMs}ms` : "latency unknown"} ·{" "}
                    {log.tokensUsed ? `${log.tokensUsed} tokens` : ""} ·{" "}
                    {timeAgo(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
