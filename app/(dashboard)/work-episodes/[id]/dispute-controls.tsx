"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function DisputeControls({
  episodeId,
  currentStatus,
}: {
  episodeId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState<"dispute" | "resolve" | null>(null);
  const [resolution, setResolution] = useState("");
  const [showResolveForm, setShowResolveForm] = useState(false);
  const router = useRouter();

  const canDispute = !["cancelled", "disputed", "verified"].includes(currentStatus);
  const canResolve = currentStatus === "disputed";

  async function flagDispute() {
    setLoading("dispute");
    try {
      await fetch(`/api/work-episodes/${episodeId}/dispute`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function resolveDispute() {
    if (!resolution.trim()) return;
    setLoading("resolve");
    try {
      await fetch(`/api/work-episodes/${episodeId}/dispute`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      setShowResolveForm(false);
      setResolution("");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (!canDispute && !canResolve) return null;

  return (
    <div className="space-y-3">
      {canDispute && (
        <button
          onClick={flagDispute}
          disabled={loading === "dispute"}
          className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          <AlertTriangle className="h-4 w-4" />
          {loading === "dispute" ? "Flagging..." : "Flag as Disputed"}
        </button>
      )}

      {canResolve && (
        <div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-3">
            <div className="flex items-center gap-2 text-red-800 font-medium text-sm mb-1">
              <AlertTriangle className="h-4 w-4" />
              This episode is disputed
            </div>
            <p className="text-sm text-red-700">
              Review the proof and merchant confirmation before resolving.
            </p>
          </div>
          {!showResolveForm ? (
            <Button variant="outline" size="sm" onClick={() => setShowResolveForm(true)}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Resolve Dispute
            </Button>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Resolution notes</p>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                placeholder="Describe how this dispute was resolved..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={resolveDispute} loading={loading === "resolve"}>
                  Mark Resolved
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowResolveForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
