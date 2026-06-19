"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

const ROLES = [
  { value: "agent", label: "Agent (Field Worker)" },
  { value: "org_admin", label: "Organization Administrator" },
  { value: "operator", label: "Platform Operator" },
];

const inputClass =
  "w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-[#11263C] focus:ring-2 focus:ring-[#11263C]/20";
const inputStyle = {
  backgroundColor: "#FFFFFF",
  borderColor: "#C7BDAF",
  color: "#11263C",
};
const labelStyle = { color: "#11263C" };

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

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

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
    <div
      className="min-h-screen flex items-center justify-center p-4 md:p-6 relative overflow-hidden"
      style={{ backgroundColor: "#11263C" }}
    >
      {/* Decorative background blur shapes for visual depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4f46e5] rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7c3aed] rounded-full blur-3xl opacity-10 pointer-events-none" />

      <div
        className="w-full max-w-md bg-[#F7F3EA] rounded-[28px] border border-[#e5dfd2] px-8 py-6 md:py-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10"
      >
        {/* Logo mark */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="transition-all duration-300 transform hover:scale-105 hover:rotate-3 drop-shadow-md mb-2">
            <Logo className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#11263C" }}>
            Join NewWork
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#53616E" }}>
            Start earning and tracking real income
          </p>
        </div>

        {/* Divider */}
        <div className="mb-5 h-px w-full" style={{ backgroundColor: "#C7BDAF" }} />

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              I am a…
            </label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Full name
            </label>
            <input
              type="text"
              placeholder="Alex Johnson"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Phone number
            </label>
            <input
              type="tel"
              placeholder="+256 700 000 000"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Org name — only for org_admin */}
          {form.role === "org_admin" && (
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                Organization name
              </label>
              <input
                type="text"
                placeholder="Youth Employment Fund"
                value={form.orgName}
                onChange={(e) => set("orgName", e.target.value)}
                required
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}

          {/* District / Location — only for agent */}
          {form.role === "agent" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>
                  District
                </label>
                <input
                  type="text"
                  placeholder="e.g. Central"
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={labelStyle}>
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Street"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Password
            </label>
            <input
              type="password"
              placeholder="8+ characters"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={8}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {error && (
            <p
              className="text-sm rounded-xl px-4 py-3 border"
              style={{ color: "#b91c1c", backgroundColor: "#fef2f2", borderColor: "#fecaca" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-[#11263C] hover:bg-[#1a3857] hover:shadow-lg active:scale-[0.98] transition-all duration-200 mt-2"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm text-center" style={{ color: "#53616E" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#496B5B] hover:text-[#385346] hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
