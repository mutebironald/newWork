"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, User, Sparkles, HelpCircle, GraduationCap, ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const EDUCATION_LEVELS = [
  { value: "none", label: "No formal education" },
  { value: "primary", label: "Primary School" },
  { value: "secondary", label: "Secondary School" },
  { value: "tertiary", label: "University / Tertiary" },
];

const PRESET_SKILLS = [
  { value: "sales", label: "Sales & Selling" },
  { value: "photography", label: "Photography & Camera" },
  { value: "marketing", label: "Social Media / Marketing" },
  { value: "data_entry", label: "Data Entry & Ledgers" },
  { value: "customer_support", label: "Customer Support & Messaging" },
  { value: "survey_collection", label: "Survey & Interviewing" },
  { value: "merchant_onboarding", label: "Merchant Outreach" },
  { value: "delivery", label: "Local Delivery / Transport" },
];

export default function AgentOnboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: agentId } = use(params);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    district: "",
    location: "",
    gender: "female",
    age: "22",
    education: "secondary",
    skills: [] as string[],
    bio: "",
  });

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleSkill(skill: string) {
    const active = form.skills.includes(skill);
    if (active) {
      set("skills", form.skills.filter((s) => s !== skill));
    } else {
      set("skills", [...form.skills, skill]);
    }
  }

  async function handleComplete() {
    setLoading(true);
    setError("");

    try {
      // 1. Update the profile data via PATCH
      const patchRes = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: form.district,
          location: form.location,
          bio: form.bio,
          skills: form.skills,
        }),
      });

      if (!patchRes.ok) {
        const patchData = await patchRes.json();
        setError(patchData.error || "Failed to save profile details.");
        setLoading(false);
        return;
      }

      // 2. Trigger AI Career Profile Generation
      const aiRes = await fetch(`/api/ai/career-profile/${agentId}`, {
        method: "POST",
      });

      if (!aiRes.ok) {
        console.warn("AI Career Profile generation returned non-ok status, proceeding to profile page anyway.");
      }

      // 3. Redirect back to Agent Details
      router.push(`/agents/${agentId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/agents/${agentId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Cancel
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guided Onboarding</h1>
        <p className="text-sm text-gray-500 mt-0.5">Let&apos;s set up your profile and let Gemini design your merchant service recommendations</p>
      </div>

      {/* Field Agent Journey diagram */}
      <div className="rounded-xl overflow-hidden border border-gray-200">
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/visuals/02_field_agent_journey.svg`}
          alt="NewWork Field Agent Journey — from skill intake to verified income"
          width={1400}
          height={900}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex flex-col gap-1.5">
            <div className={`h-1.5 rounded-full ${step >= s ? "bg-indigo-600" : "bg-gray-200"}`} />
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Step {s}
            </span>
          </div>
        ))}
      </div>

      <Card>
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-500" />
                Background Details
              </CardTitle>
              <CardDescription>Enter basic location and demographic details to help locate nearby merchants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="district"
                  label="District / Region"
                  placeholder="e.g. Central"
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                  required
                />
                <Input
                  id="location"
                  label="Specific Location / Neighborhood"
                  placeholder="e.g. Main Street"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Select
                  id="gender"
                  label="Gender"
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  options={[
                    { value: "female", label: "Female" },
                    { value: "male", label: "Male" },
                    { value: "other", label: "Other" },
                  ]}
                />
                <Input
                  id="age"
                  label="Age"
                  type="number"
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  required
                />
                <Select
                  id="education"
                  label="Education Level"
                  value={form.education}
                  onChange={(e) => set("education", e.target.value)}
                  options={EDUCATION_LEVELS}
                />
              </div>

              <div className="flex justify-end pt-3">
                <Button onClick={() => setStep(2)} disabled={!form.district || !form.location}>
                  Next step <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                Select Your Skills
              </CardTitle>
              <CardDescription>Choose the skills you currently have or feel confident delivering to merchant shops.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {PRESET_SKILLS.map((skill) => {
                  const active = form.skills.includes(skill.value);
                  return (
                    <button
                      key={skill.value}
                      type="button"
                      onClick={() => toggleSkill(skill.value)}
                      className={`flex items-center justify-between border rounded-xl p-4 text-left transition-all ${
                        active
                          ? "border-indigo-600 bg-indigo-50/50 shadow-sm text-indigo-900 font-semibold"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm">{skill.label}</span>
                      {active && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={form.skills.length === 0}>
                  Next step <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-500" />
                Bio & Background
              </CardTitle>
              <CardDescription>Add a brief intro about yourself. Gemini will scan this to suggest income improvement plans.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Tell us about yourself</label>
                <textarea
                  id="bio"
                  rows={5}
                  placeholder="e.g. I have a smartphone and WhatsApp and love working with people. I am available 20 hours a week to take storefront photographs and help list local shops on Google Maps..."
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex justify-between pt-3">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="mr-1.5 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleComplete} loading={loading} disabled={!form.bio.trim() || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating AI Profile...
                    </>
                  ) : (
                    "Complete & Generate AI Profile"
                  )}
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
export const dynamic = "force-dynamic";
