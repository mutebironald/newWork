"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Plus, ListPlus, Loader2 } from "lucide-react";

interface LogEpisodeModalProps {
  agentId?: string;
  role: string;
  merchants: Array<{ id: string; name: string }>;
  agents: Array<{ id: string; name: string }>;
}

const SERVICE_TYPES = [
  { value: "merchant_outreach", label: "Merchant Outreach" },
  { value: "catalog_creation", label: "Catalog Creation" },
  { value: "business_profiling", label: "Business Profiling" },
  { value: "photography", label: "Photography" },
  { value: "survey", label: "Survey Collection" },
  { value: "digital_presence", label: "Digital Presence" },
  { value: "other", label: "Other" },
];

export function LogEpisodeModal({ agentId, role, merchants, agents }: LogEpisodeModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    agentId: agentId || (agents[0]?.id ?? ""),
    merchantId: merchants[0]?.id ?? "",
    serviceType: "catalog_creation",
    amount: "15000",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Episode title is required");
      return;
    }
    if (!form.agentId) {
      setError("Agent is required");
      return;
    }
    if (!form.merchantId) {
      setError("Merchant is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/work-episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to log work episode");
        return;
      }

      setIsOpen(false);
      setForm({
        title: "",
        agentId: agentId || (agents[0]?.id ?? ""),
        merchantId: merchants[0]?.id ?? "",
        serviceType: "catalog_creation",
        amount: "15000",
      });
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Log Episode
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <ListPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Log Work Episode</h3>
                  <p className="text-xs text-gray-500">Record a new work episode completed for a merchant</p>
                </div>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-light p-1"
                onClick={() => setIsOpen(false)}
              >
                &times;
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-4 flex-1">
                <Input
                  id="title"
                  label="Work Episode Title"
                  placeholder="e.g. Catalog Creation at Central Store"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />

                {role !== "agent" && (
                  <Select
                    id="agentId"
                    label="Assigned Agent"
                    value={form.agentId}
                    onChange={(e) => setForm((f) => ({ ...f, agentId: e.target.value }))}
                    options={agents.map((a) => ({ value: a.id, label: a.name }))}
                  />
                )}

                <Select
                  id="merchantId"
                  label="Merchant"
                  value={form.merchantId}
                  onChange={(e) => setForm((f) => ({ ...f, merchantId: e.target.value }))}
                  options={merchants.map((m) => ({ value: m.id, label: m.name }))}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    id="serviceType"
                    label="Service Type"
                    value={form.serviceType}
                    onChange={(e) => setForm((f) => ({ ...f, serviceType: e.target.value }))}
                    options={SERVICE_TYPES}
                  />
                  <Input
                    id="amount"
                    label="Amount (Local Currency)"
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={loading} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    "Create Episode"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
