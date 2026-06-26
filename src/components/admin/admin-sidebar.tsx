"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  Inbox,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/polls", label: "Poll Library", icon: BookOpen },
  { href: "/admin/polls/new", label: "Create Poll", icon: Plus },
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/suggestions", label: "Suggestions", icon: Inbox },
];

interface AdminSidebarProps {
  userEmail: string;
}

export function AdminSidebar({ userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-white/[0.055] bg-[#0d0d0d]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.055] px-5 py-5">
        <span className="text-base font-bold tracking-tight text-white/90">
          Split
        </span>
        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-widest text-purple-300/80">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-2.5 py-4" aria-label="Admin navigation">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href) && !(href === "/admin/polls" && pathname === "/admin/polls/new");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8125rem] font-medium transition-colors duration-150 ${
                active
                  ? "bg-white/[0.07] text-white/90"
                  : "text-white/38 hover:bg-white/[0.04] hover:text-white/65"
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="border-t border-white/[0.055] px-2.5 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.75rem] text-white/25 transition-colors hover:text-white/50"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          Back to site
        </Link>
      </div>

      {/* User */}
      <div className="border-t border-white/[0.055] px-4 py-4">
        <p className="mb-2.5 truncate text-[0.75rem] text-white/30" title={userEmail}>
          {userEmail}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-lg py-1.5 text-[0.75rem] text-white/28 transition-colors hover:text-white/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/60"
          aria-label="Sign out"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
