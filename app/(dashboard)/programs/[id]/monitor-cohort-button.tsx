"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export function MonitorCohortButton({ cohortId }: { cohortId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ healthScore?: number; status?: string } | null>(null);
  const router = useRouter();

  async function monitor() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/monitor-cohort/${cohortId}`, { method: "POST" });
      const data = await res.json();
      setResult(data.assessment);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span className="text-sm font-medium text-violet-700">
          Health: {result.healthScore}/100 — {result.status}
        </span>
      )}
      <Button variant="outline" size="sm" onClick={monitor} loading={loading}>
        <Bot className="h-4 w-4 mr-1.5" />
        AI Monitor
      </Button>
    </div>
  );
}
