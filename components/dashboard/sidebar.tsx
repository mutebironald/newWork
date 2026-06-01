"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Store,
  Briefcase,
  ListChecks,
  Zap,
  BarChart3,
  FileText,
  Trophy,
  Bot,
  Wallet,
  LogOut,
  Building2,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/merchants", label: "Merchants", icon: Store },
  { href: "/programs", label: "Programs", icon: Building2 },
  { href: "/opportunities", label: "Opportunities", icon: Briefcase },
  { href: "/work-episodes", label: "Work Episodes", icon: ListChecks },
  { href: "/income", label: "Income Ledger", icon: Wallet },
  { href: "/ai", label: "AI Engine", icon: Bot },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/xprize", label: "XPRIZE Dashboard", icon: Trophy },
];

interface SidebarProps {
  user: { name: string; email: string; role: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const roleLabel =
    user.role === "agent"
      ? "Agent"
      : user.role === "org_admin"
      ? "Organization Admin"
      : "Platform Operator";

  return (
    <div className="flex h-full w-64 flex-col bg-gray-950 text-white">
      <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shrink-0">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight">NewWork</p>
          <p className="text-xs text-gray-400">AI Workforce Platform</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <div className="space-y-0.5 px-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="h-3 w-3 opacity-60" />}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
