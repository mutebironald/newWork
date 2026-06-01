"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getStatusBadge } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function EpisodeStatusAdvancer({
  episodeId,
  currentStatus,
  nextStatus,
}: {
  episodeId: string;
  currentStatus: string;
  nextStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const next = getStatusBadge(nextStatus);

  async function advance() {
    setLoading(true);
    try {
      await fetch(`/api/work-episodes/${episodeId}/advance`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-indigo-900">Advance to next stage</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-indigo-600">{getStatusBadge(currentStatus).label}</span>
          <ArrowRight className="h-3 w-3 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-800">{next.label}</span>
        </div>
      </div>
      <Button onClick={advance} loading={loading} size="sm">
        Mark as {next.label}
      </Button>
    </div>
  );
}
