"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/plan", label: "Weekly Plan", icon: "🗓️" },
  { href: "/grocery", label: "Grocery", icon: "🛒" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2">
      <ul className="mx-auto flex max-w-2xl justify-around rounded-3xl border border-warm-border bg-surface/90 px-2 py-1.5 shadow-[0_10px_30px_-8px_rgba(43,38,32,0.18)] backdrop-blur">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-medium transition-colors",
                  active ? "bg-gradient-to-br from-orange to-orange-dark text-white" : "text-charcoal-muted hover:text-charcoal"
                )}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
