"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot, Play } from "lucide-react";

export function RunAiButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();

  async function runAll() {
    setLoading(true);
    setStatus("Running AI workflows...");
    try {
      const res = await fetch("/api/ai/run-all", { method: "POST" });
      const data = await res.json();
      setStatus(data.message || "Done");
      router.refresh();
    } catch {
      setStatus("Error running AI workflows");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 4000);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status && <span className="text-sm text-violet-600 font-medium">{status}</span>}
      <Button onClick={runAll} loading={loading} variant="secondary">
        <Play className="h-4 w-4 mr-1.5" />
        Run All AI Workflows
      </Button>
    </div>
  );
}
