"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function ProofUploader({ episodeId }: { episodeId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/work-episodes/${episodeId}/proof`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to upload proof");
        return;
      }

      setSuccess(true);
      setFile(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="border-indigo-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FileUp className="h-4 w-4 text-indigo-500" />
          Upload Proof of Work
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-6 hover:bg-gray-50/50 transition-colors cursor-pointer relative">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <FileUp className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              {file ? file.name : "Select or drag files here"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports photos, PDFs, audio, screenshots up to 10MB
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-start gap-2 text-xs text-green-700">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Proof uploaded successfully! Gemini is executing verification in the background.</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={!file || uploading} loading={uploading} size="sm">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Proof"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
