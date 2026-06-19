import { db } from "@/lib/firebase";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bot, Store, FileText, MessageSquare, BarChart3, Wrench, Clock } from "lucide-react";
import Link from "next/link";
import { ServiceWorkspaceClient } from "./service-workspace-client";

export const dynamic = "force-dynamic";

const SERVICE_TEMPLATES = [
  {
    serviceType: "receipt_digitization",
    label: "Receipt Digitization",
    description: "Photograph merchant receipts and extract structured transaction records",
    icon: "🧾",
    aiSupport: ["Extract transaction amounts and dates", "Categorize expenses", "Generate readable summary"],
    deliverySteps: ["Collect receipts from merchant", "Photograph each receipt clearly", "AI extracts data", "Deliver weekly summary"],
  },
  {
    serviceType: "weekly_sales_summary",
    label: "Weekly Sales Summary",
    description: "Create a plain-language business performance report for the merchant",
    icon: "📊",
    aiSupport: ["Analyze transaction data", "Identify top-selling items", "Generate WhatsApp-ready summary"],
    deliverySteps: ["Gather sales data for the week", "AI generates summary report", "Review with merchant", "Share via WhatsApp"],
  },
  {
    serviceType: "whatsapp_catalog",
    label: "WhatsApp Product Catalog",
    description: "Create a professional product catalog the merchant can share on WhatsApp",
    icon: "📱",
    aiSupport: ["Write product descriptions", "Format catalog message", "Suggest pricing language"],
    deliverySteps: ["Photograph 5–10 products", "AI writes descriptions", "Format catalog", "Send to merchant for approval"],
  },
  {
    serviceType: "customer_followup",
    label: "Customer Follow-Up Pack",
    description: "Draft personalized follow-up messages to re-engage the merchant's customers",
    icon: "💬",
    aiSupport: ["Generate personalized scripts", "Adapt tone for merchant type", "Suggest offer text"],
    deliverySteps: ["Collect customer list from merchant", "AI drafts messages", "Review and customize", "Send on merchant's behalf"],
  },
  {
    serviceType: "renewal_tracker",
    label: "Renewal Reminder Tracker",
    description: "Track and remind merchants about licenses, permits, and supplier renewals",
    icon: "🔔",
    aiSupport: ["Identify renewal dates from documents", "Generate reminder messages", "Create follow-up schedule"],
    deliverySteps: ["Review merchant's documents for dates", "Log renewal items", "AI drafts reminders", "Set up follow-up schedule"],
  },
  {
    serviceType: "proof_profile",
    label: "Proof-of-Business Profile",
    description: "Create a simple proof-of-business record for the merchant",
    icon: "📋",
    aiSupport: ["Summarize business activity", "Format proof document", "List verifiable claims"],
    deliverySteps: ["Gather merchant documents and photos", "AI creates profile", "Review with merchant", "Submit for verification"],
  },
];

export default async function ServiceWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: merchantId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const merchantDoc = await db.collection("merchants").doc(merchantId).get();
  if (!merchantDoc.exists) notFound();
  const merchant = merchantDoc.data();

  // Fetch recent AI outputs (merchant summaries / extractions) from ai_workflow_logs
  const recentAiLogsSnapshot = await db
    .collection("ai_workflow_logs")
    .where("entityId", "==", merchantId)
    .get();
  const recentAiLogs = recentAiLogsSnapshot.docs
    .map((d: any) => ({ ...d.data(), id: d.id }))
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  // Agent context for current session
  const agentId = session.agentId || null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/merchants/${merchantId}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to merchant
        </Link>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-lg shrink-0">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Workspace</h1>
          <p className="text-gray-500 mt-0.5">
            {merchant.businessName} · {merchant.businessType} · {merchant.locationText || "Location unknown"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-medium text-indigo-700">AI Engine Active</span>
        </div>
      </div>

      {/* Service template picker */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-indigo-600" />
            <CardTitle>Select a Service Template</CardTitle>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Choose a service to deliver to this merchant. AI will assist at each step.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICE_TEMPLATES.map((template) => (
              <div
                key={template.serviceType}
                className="rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-900">
                      {template.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">AI assists with:</p>
                  {template.aiSupport.slice(0, 2).map((step, i) => (
                    <p key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <Bot className="h-3 w-3 text-indigo-400 mt-0.5 shrink-0" /> {step}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Service Delivery Panel (client-side interactive) */}
      {agentId && (
        <ServiceWorkspaceClient
          merchantId={merchantId}
          agentId={agentId}
          merchantName={merchant.businessName}
          merchantType={merchant.businessType}
        />
      )}

      {/* Recent AI Activity */}
      {recentAiLogs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <CardTitle>Recent AI Activity for this Merchant</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentAiLogs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 px-6 py-3">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${log.success ? "bg-green-400" : "bg-red-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{log.workflowType?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-400 truncate">{log.outputSummary || log.inputSummary || "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={log.success ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}>
                      {log.success ? "Success" : "Failed"}
                    </Badge>
                    {log.latencyMs && (
                      <p className="text-xs text-gray-400 mt-0.5">{log.latencyMs}ms</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log work episode CTA */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
        <div className="flex items-start gap-4">
          <FileText className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-900">Ready to log a completed service?</p>
            <p className="text-xs text-indigo-700 mt-1">
              Once you have delivered a service and the merchant has paid, log it as a work episode to track your income and build proof.
            </p>
          </div>
          <Link
            href="/work-episodes"
            className="ml-auto shrink-0 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Log Work Episode
          </Link>
        </div>
      </div>
    </div>
  );
}
