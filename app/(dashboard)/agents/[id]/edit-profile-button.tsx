"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, MapPin, Sparkles, FileText, Edit3 } from "lucide-react";

interface AgentUpdateProps {
  agent: {
    id: string;
    location: string | null;
    district: string | null;
    bio: string | null;
    skills: string[];
  };
}

export function EditProfileButton({ agent }: AgentUpdateProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    district: agent.district || "",
    location: agent.location || "",
    bio: agent.bio || "",
    skills: agent.skills.join(", "),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }
      setIsOpen(false);
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
        type="button"
        variant="outline"
        className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        onClick={() => setIsOpen(true)}
      >
        <Edit3 className="h-4 w-4" /> Edit Profile
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-200">
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] scale-100 transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Edit Profile</h3>
                  <p className="text-xs text-gray-500">Update your district, location, skills, and bio</p>
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

            {/* Content Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5 flex-1">
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

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    Skills (comma-separated)
                  </label>
                  <textarea
                    rows={2}
                    value={form.skills}
                    onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                    placeholder="e.g. sales, photography, marketing, data_entry"
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell us about your background, strengths, and experience..."
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
