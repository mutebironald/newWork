"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const ROLES = [
  { value: "agent", label: "Agent (Worker)" },
  { value: "org_admin", label: "Organization Administrator" },
  { value: "operator", label: "Platform Operator" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "agent",
    orgName: "",
    district: "",
    location: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/overview");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <span className="text-white font-bold text-lg">NW</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join NewWork</h1>
          <p className="text-gray-500 mt-1 text-sm">Start earning and tracking real income</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              id="role"
              label="I am a..."
              options={ROLES}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            />
            <Input
              id="name"
              label="Full name"
              placeholder="Alex Johnson"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              id="email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              id="phone"
              label="Phone number"
              type="tel"
              placeholder="+1 234 567 8900"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            {form.role === "org_admin" && (
              <Input
                id="orgName"
                label="Organization name"
                placeholder="Youth Employment Fund"
                value={form.orgName}
                onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
                required
              />
            )}
            {form.role === "agent" && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="district"
                  label="District / Region"
                  placeholder="e.g. Central"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                />
                <Input
                  id="location"
                  label="Specific Location"
                  placeholder="e.g. Main Street"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            )}
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="8+ characters"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-sm text-gray-500 text-center">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
