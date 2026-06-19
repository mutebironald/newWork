import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";
import { GenerateReportButton } from "./generate-report-button";
import { FileText, Bot, Download } from "lucide-react";

export const dynamic = "force-dynamic";

const reportTypeColors: Record<string, string> = {
  weekly: "text-blue-700 bg-blue-50 border-blue-200",
  monthly: "text-indigo-700 bg-indigo-50 border-indigo-200",
  cohort: "text-purple-700 bg-purple-50 border-purple-200",
  impact: "text-green-700 bg-green-50 border-green-200",
  donor: "text-teal-700 bg-teal-50 border-teal-200",
  board: "text-gray-700 bg-gray-50 border-gray-200",
};

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [reportsSnapshot, orgsSnapshot] = await Promise.all([
    db.collection("impact_reports").get(),
    db.collection("organizations").get(),
  ]);

  const orgs = orgsSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
    };
  });

  const reports: any[] = [];
  for (const doc of reportsSnapshot.docs) {
    const report = doc.data();

    // Fetch org
    const orgDoc = await db.collection("organizations").doc(report.orgId).get();
    const org = orgDoc.exists ? orgDoc.data() : { name: "Unknown" };

    // Fetch cohort
    let cohort = null;
    if (report.cohortId) {
      const cohortDoc = await db.collection("cohorts").doc(report.cohortId).get();
      if (cohortDoc.exists) cohort = cohortDoc.data();
    }

    reports.push({
      ...report,
      id: doc.id,
      org,
      cohort,
    });
  }

  // Sort by generatedAt desc
  reports.sort((a, b) => new Date(b.generatedAt || 0).getTime() - new Date(a.generatedAt || 0).getTime());

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Impact Reports</h1>
          <p className="text-sm text-gray-500 mt-1">AI-generated donor, board, and cohort reports</p>
        </div>
        <GenerateReportButton orgs={orgs} />
      </div>

      {reports.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reports yet. Generate your first AI report above.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const content = (report.content ?? {}) as { executiveSummary?: string; keyMetrics?: Array<{ label: string; value: string; context?: string }>; highlights?: string[]; successStory?: string; recommendation?: string };

          return (
            <Card key={report.id} className="hover:border-indigo-200 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className={reportTypeColors[report.reportType] || "text-gray-700 bg-gray-50 border-gray-200"}>
                        {report.reportType}
                      </Badge>
                      {report.aiGenerated && (
                        <Badge className="text-violet-700 bg-violet-50 border-violet-200">
                          <Bot className="h-3 w-3 mr-1" />
                          AI Generated
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <p className="text-xs text-gray-400 mt-1">
                      {report.org.name}
                      {report.cohort ? ` · ${report.cohort.name}` : ""} ·{" "}
                      {timeAgo(report.generatedAt)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {content.executiveSummary && (
                  <p className="text-sm text-gray-700 line-clamp-3">{content.executiveSummary}</p>
                )}
                {content.keyMetrics && content.keyMetrics.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {content.keyMetrics.slice(0, 4).map((m, i) => (
                      <div key={i} className="rounded-lg bg-gray-50 p-2.5">
                        <p className="text-xs text-gray-500">{m.label}</p>
                        <p className="text-sm font-bold text-gray-900">{m.value}</p>
                        {m.context && <p className="text-xs text-gray-400">{m.context}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {content.successStory && (
                  <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">Success Story</p>
                    <p className="text-sm text-green-800 line-clamp-2">{content.successStory}</p>
                  </div>
                )}
                {content.recommendation && (
                  <p className="text-xs text-indigo-600 font-medium">
                    Recommendation: {content.recommendation}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
