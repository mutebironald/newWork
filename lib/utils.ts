import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: number): string {
  return amount.toLocaleString();
}

export const formatLocal = formatAmount;

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getVerificationBadge(level: string): {
  label: string;
  color: string;
} {
  const map: Record<string, { label: string; color: string }> = {
    self_reported: { label: "Self-Reported", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
    proof_uploaded: { label: "Proof Uploaded", color: "text-blue-700 bg-blue-50 border-blue-200" },
    merchant_confirmed: { label: "Merchant Confirmed", color: "text-green-700 bg-green-50 border-green-200" },
    program_verified: { label: "Program Verified", color: "text-purple-700 bg-purple-50 border-purple-200" },
  };
  return map[level] || { label: level, color: "text-gray-700 bg-gray-50 border-gray-200" };
}

export function getStatusBadge(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    planned: { label: "Planned", color: "text-gray-700 bg-gray-50 border-gray-200" },
    assigned: { label: "Assigned", color: "text-blue-700 bg-blue-50 border-blue-200" },
    accepted: { label: "Accepted", color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
    in_progress: { label: "In Progress", color: "text-orange-700 bg-orange-50 border-orange-200" },
    delivered: { label: "Delivered", color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
    proof_uploaded: { label: "Proof Uploaded", color: "text-blue-700 bg-blue-50 border-blue-200" },
    merchant_confirmed: { label: "Merchant Confirmed", color: "text-teal-700 bg-teal-50 border-teal-200" },
    paid: { label: "Paid", color: "text-green-700 bg-green-50 border-green-200" },
    verified: { label: "Verified", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    cancelled: { label: "Cancelled", color: "text-red-700 bg-red-50 border-red-200" },
    disputed: { label: "Disputed", color: "text-rose-700 bg-rose-50 border-rose-200" },
    active: { label: "Active", color: "text-green-700 bg-green-50 border-green-200" },
    planning: { label: "Planning", color: "text-gray-700 bg-gray-50 border-gray-200" },
    completed: { label: "Completed", color: "text-blue-700 bg-blue-50 border-blue-200" },
    open: { label: "Open", color: "text-green-700 bg-green-50 border-green-200" },
    filled: { label: "Filled", color: "text-gray-700 bg-gray-50 border-gray-200" },
  };
  return map[status] || { label: status, color: "text-gray-700 bg-gray-50 border-gray-200" };
}

export function getWorkEpisodeNextStatus(current: string): string | null {
  const flow: Record<string, string> = {
    planned: "assigned",
    assigned: "accepted",
    accepted: "in_progress",
    in_progress: "delivered",
    delivered: "proof_uploaded",
    proof_uploaded: "merchant_confirmed",
    merchant_confirmed: "paid",
    paid: "verified",
  };
  return flow[current] || null;
}

export function timeAgo(date: Date | string): string {
  if (!date) return "unknown";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "unknown";
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function calculateAiAutonomyRate(logs: Array<{ autonomousDecision: boolean }>): number {
  if (!logs.length) return 0;
  return logs.filter((l) => l.autonomousDecision).length / logs.length;
}
