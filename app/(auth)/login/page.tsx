"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
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
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: "#11263C" }}
    >
      {/* Decorative background blur shapes for visual depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4f46e5] rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#7c3aed] rounded-full blur-3xl opacity-10 pointer-events-none" />

      <div
        className="w-full max-w-md bg-[#F7F3EA] rounded-[32px] border border-[#e5dfd2] px-8 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10"
      >
        {/* Logo mark */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="transition-all duration-300 transform hover:scale-105 hover:rotate-3 drop-shadow-md mb-4">
            <Logo className="h-16 w-16" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#11263C" }}>
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#53616E" }}>
            Sign in to your NewWork account
          </p>
        </div>

        {/* Divider */}
        <div className="mb-6 h-px w-full" style={{ backgroundColor: "#C7BDAF" }} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#11263C" }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-[#11263C] focus:ring-2 focus:ring-[#11263C]/20"
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: "#C7BDAF",
                color: "#11263C",
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#11263C" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-[#11263C] focus:ring-2 focus:ring-[#11263C]/20"
              style={{
                backgroundColor: "#FFFFFF",
                borderColor: "#C7BDAF",
                color: "#11263C",
              }}
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
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-sm text-center" style={{ color: "#53616E" }}>
          New to NewWork?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#496B5B] hover:text-[#385346] hover:underline transition-colors"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
