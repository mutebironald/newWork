"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

interface Org { id: string; name: string }

export function GenerateReportButton({ orgs }: { orgs: Org[] }) {
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState(orgs[0]?.id || "");
  const [reportType, setReportType] = useState("impact");
  const router = useRouter();

  async function generate() {
    if (!orgId) return;
    setLoading(true);
    try {
      await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId, reportType }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={orgId}
        onChange={(e) => setOrgId(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <select
        value={reportType}
        onChange={(e) => setReportType(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      >
        {["impact", "weekly", "monthly", "cohort", "donor", "board"].map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <Button onClick={generate} loading={loading} disabled={!orgId}>
        <Bot className="h-4 w-4 mr-1.5" />
        Generate Report
      </Button>
    </div>
  );
}
