"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

export function GenerateProfileButton({ agentId }: { agentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function generate() {
    setLoading(true);
    try {
      await fetch(`/api/ai/career-profile/${agentId}`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={generate} loading={loading}>
      <Bot className="h-4 w-4 mr-1.5" />
      {loading ? "Generating..." : "AI Profile"}
    </Button>
  );
}
