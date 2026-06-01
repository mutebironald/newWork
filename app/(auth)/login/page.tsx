"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
            <span className="text-white font-bold text-lg">NW</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome to NewWork</h1>
          <p className="text-gray-500 mt-1 text-sm">AI-native workforce activation platform</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-sm text-gray-500 text-center">
              New to NewWork?{" "}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Create account
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
