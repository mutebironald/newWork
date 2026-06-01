"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";

const SERVICE_TYPES = [
  { value: "merchant_outreach", label: "Merchant Outreach" },
  { value: "catalog_creation", label: "Catalog Creation" },
  { value: "business_profiling", label: "Business Profiling" },
  { value: "photography", label: "Photography" },
  { value: "survey", label: "Survey Collection" },
  { value: "digital_presence", label: "Digital Presence Setup" },
  { value: "other", label: "Other" },
];

const SKILL_OPTIONS = [
  "sales", "marketing", "photography", "survey_collection", "data_entry",
  "delivery", "merchant_onboarding", "customer_support",
];

export default function NewOpportunityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [skillInput, setSkillInput] = useState("");

  const [form, setForm] = useState({
    orgId: "",
    title: "",
    description: "",
    serviceType: "merchant_outreach",
    amount: "",
    district: "",
    location: "",
    maxAssignments: "1",
    skillsRequired: [] as string[],
    deadline: "",
  });

  useEffect(() => {
    fetch("/api/organizations").then((r) => r.json()).then((d) => {
      setOrgs(d.orgs || []);
      if (d.orgs?.[0]) setForm((f) => ({ ...f, orgId: d.orgs[0].id }));
    });
  }, []);

  function addSkill(skill: string) {
    const s = skill.trim().toLowerCase().replace(/\s+/g, "_");
    if (s && !form.skillsRequired.includes(s)) {
      setForm((f) => ({ ...f, skillsRequired: [...f.skillsRequired, s] }));
    }
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setForm((f) => ({ ...f, skillsRequired: f.skillsRequired.filter((s) => s !== skill) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.orgId) { setError("Select an organization"); return; }
    if (!form.title) { setError("Title is required"); return; }
    const parsedAmount = parseInt(form.amount, 10);
    if (!parsedAmount || parsedAmount <= 0) { setError("Enter a valid amount"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parsedAmount, maxAssignments: parseInt(form.maxAssignments, 10) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create opportunity"); return; }
      router.push("/opportunities");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/opportunities" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Opportunity</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add a new paid opportunity to the marketplace</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opportunity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              id="orgId"
              label="Organization"
              value={form.orgId}
              onChange={(e) => setForm((f) => ({ ...f, orgId: e.target.value }))}
              options={orgs.map((o) => ({ value: o.id, label: o.name }))}
            />

            <Input
              id="title"
              label="Opportunity Title"
              placeholder="WhatsApp Business Catalog Setup"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Describe exactly what the agent needs to do, what success looks like, and any requirements..."
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

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
                label="Payment Amount"
                type="number"
                placeholder="500"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="district"
                label="District / Region"
                placeholder="e.g. North District"
                value={form.district}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
              />
              <Input
                id="maxAssignments"
                label="Max Agents"
                type="number"
                min="1"
                max="50"
                value={form.maxAssignments}
                onChange={(e) => setForm((f) => ({ ...f, maxAssignments: e.target.value }))}
              />
            </div>

            <Input
              id="location"
              label="Specific Location (optional)"
              placeholder="e.g. Main Street, City Center"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Required Skills</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.skillsRequired.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="text-indigo-500 hover:text-indigo-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select or type a skill...</option>
                  {SKILL_OPTIONS.filter((s) => !form.skillsRequired.includes(s)).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Button type="button" variant="outline" size="sm" onClick={() => addSkill(skillInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading} className="flex-1">
                Create Opportunity
              </Button>
              <Link href="/opportunities">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-4">
        <p className="text-sm font-medium text-indigo-800 mb-1">What happens after you create this?</p>
        <ol className="space-y-1 text-sm text-indigo-700 list-decimal list-inside">
          <li>The opportunity appears on the marketplace immediately</li>
          <li>Click "Run All AI Workflows" on the AI Engine page to auto-match agents</li>
          <li>Matched agents receive assignments and can accept/start work</li>
          <li>Each completed episode flows through the verification ladder automatically</li>
        </ol>
      </div>
    </div>
  );
}
