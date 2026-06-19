"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, Upload, MessageSquare, BarChart3, Zap, Copy, Check } from "lucide-react";

interface Props {
  merchantId: string;
  agentId: string;
  merchantName: string;
  merchantType: string;
}

type ActiveTool = "outreach" | "extract" | "summary" | null;

export function ServiceWorkspaceClient({ merchantId, agentId, merchantName }: Props) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("receipt");
  const [context, setContext] = useState("");
  const [copied, setCopied] = useState(false);

  async function runTool(tool: ActiveTool) {
    setActiveTool(tool);
    setLoading(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      let res: Response;

      if (tool === "outreach") {
        res = await fetch("/api/ai/outreach-pack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, merchantId }),
        });
      } else if (tool === "extract") {
        if (!fileUrl) {
          setError("Please enter a file URL to extract.");
          setLoading(false);
          return;
        }
        res = await fetch("/api/ai/extract-artifact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId, merchantId, fileUrl, fileType, context }),
        });
      } else if (tool === "summary") {
        res = await fetch("/api/ai/merchant-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantId }),
        });
      } else {
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "AI request failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-indigo-600" />
          <CardTitle>AI Service Tools</CardTitle>
        </div>
        <p className="text-xs text-gray-400 mt-1">Run AI workflows for {merchantName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tool buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runTool("outreach")}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {loading && activeTool === "outreach" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            Generate Outreach Scripts
          </button>
          <button
            onClick={() => runTool("summary")}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            {loading && activeTool === "summary" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            Generate Business Summary
          </button>
        </div>

        {/* Extract artifact panel */}
        <div className="rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Upload className="h-4 w-4 text-orange-500" /> Extract from Receipt / Ledger / Notes
          </p>
          <div className="grid md:grid-cols-3 gap-2">
            <Input
              placeholder="File URL (or path)"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="receipt">Receipt</option>
              <option value="ledger">Ledger</option>
              <option value="invoice">Invoice</option>
              <option value="notes">Notes / Transcript</option>
              <option value="product_list">Product List</option>
            </select>
            <Input
              placeholder="Additional context (optional)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          <button
            onClick={() => runTool("extract")}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50"
          >
            {loading && activeTool === "extract" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Extract Data with AI
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Bot className="h-4 w-4 text-indigo-600" /> AI Output
              </p>
              <div className="flex items-center gap-2">
                {activeTool === "outreach" && result.outreachPack?.introScript && (
                  <button
                    onClick={() => copyToClipboard(result.outreachPack.introScript)}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy intro"}
                  </button>
                )}
                {activeTool === "summary" && result.summary?.whatsappMessage && (
                  <button
                    onClick={() => copyToClipboard(result.summary.whatsappMessage)}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy WhatsApp message"}
                  </button>
                )}
              </div>
            </div>

            {/* Outreach pack result */}
            {activeTool === "outreach" && result.outreachPack && (
              <div className="space-y-3">
                {result.outreachPack.introScript && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Intro Script</p>
                    <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap">
                      {result.outreachPack.introScript}
                    </p>
                  </div>
                )}
                {result.outreachPack.followUpScript && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Follow-Up Script</p>
                    <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap">
                      {result.outreachPack.followUpScript}
                    </p>
                  </div>
                )}
                {(result.outreachPack.objectionResponses || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Handling Objections</p>
                    <div className="space-y-2">
                      {result.outreachPack.objectionResponses.map((obj: any, i: number) => (
                        <div key={i} className="rounded-lg bg-white border border-gray-200 p-3">
                          <p className="text-xs font-medium text-red-600 mb-1">&ldquo;{obj.objection}&rdquo;</p>
                          <p className="text-sm text-gray-700">{obj.response}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Summary result */}
            {activeTool === "summary" && result.summary && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {result.summary.totalRevenue > 0 && (
                    <div className="rounded-lg bg-white border border-green-200 p-3">
                      <p className="text-xs text-gray-500">Total Revenue</p>
                      <p className="text-lg font-bold text-green-700">
                        {result.summary.currency} {result.summary.totalRevenue?.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {result.summary.period && (
                    <div className="rounded-lg bg-white border border-gray-200 p-3">
                      <p className="text-xs text-gray-500">Period</p>
                      <p className="text-sm font-semibold text-gray-900">{result.summary.period}</p>
                    </div>
                  )}
                </div>
                {result.summary.keyInsight && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Key Insight</p>
                    <p className="text-sm text-blue-800">{result.summary.keyInsight}</p>
                  </div>
                )}
                {result.summary.whatsappMessage && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">WhatsApp Message (ready to send)</p>
                    <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap font-mono text-xs">
                      {result.summary.whatsappMessage}
                    </p>
                  </div>
                )}
                {(result.summary.nextActions || []).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Recommended Next Actions</p>
                    <ul className="space-y-1">
                      {result.summary.nextActions.map((action: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-indigo-500 mt-0.5">→</span> {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Extraction result */}
            {activeTool === "extract" && result.extraction && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-gray-500">Confidence:</p>
                  <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-indigo-500"
                      style={{ width: `${(result.extraction.confidence || 0) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium text-gray-700">
                    {Math.round((result.extraction.confidence || 0) * 100)}%
                  </p>
                </div>
                {result.extraction.extractedData && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Extracted Data</p>
                    <pre className="text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-3 overflow-auto">
                      {JSON.stringify(result.extraction.extractedData, null, 2)}
                    </pre>
                  </div>
                )}
                {(result.extraction.warnings || []).length > 0 && (
                  <div>
                    {result.extraction.warnings.map((w: string, i: number) => (
                      <p key={i} className="text-xs text-orange-600">{w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
