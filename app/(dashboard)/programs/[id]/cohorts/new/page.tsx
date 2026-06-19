"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const COHORT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
];

export default function NewCohortPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orgId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    goalAgents: "50",
    goalEpisodes: "500",
    goalIncome: "5000000",
    status: "planning",
    startDate: "",
    endDate: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Cohort name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, orgId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create cohort");
        return;
      }

      router.push(`/programs/${orgId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/programs/${orgId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to Program
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Cohort</h1>
        <p className="text-sm text-gray-500 mt-0.5">Define goals and timelines for a new cohort of field agents</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cohort Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="name"
              label="Cohort Name"
              placeholder="e.g. Cohort 1 - Central Region"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                rows={3}
                placeholder="What is the objective or target area for this cohort?"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                id="goalAgents"
                label="Target Agents"
                type="number"
                value={form.goalAgents}
                onChange={(e) => set("goalAgents", e.target.value)}
                required
              />
              <Input
                id="goalEpisodes"
                label="Target Episodes"
                type="number"
                value={form.goalEpisodes}
                onChange={(e) => set("goalEpisodes", e.target.value)}
                required
              />
              <Input
                id="goalIncome"
                label="Target Income"
                type="number"
                value={form.goalIncome}
                onChange={(e) => set("goalIncome", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Select
                id="status"
                label="Initial Status"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                options={COHORT_STATUSES}
              />
              <Input
                id="startDate"
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
              <Input
                id="endDate"
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading} className="flex-1">
                Create Cohort
              </Button>
              <Link href={`/programs/${orgId}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export const dynamic = "force-dynamic";
