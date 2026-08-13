"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { USER } from "@/lib/dashboard-data";

const NAV = [
  { href: "/dashboard", label: "Dashboard", tab: "Home" },
  { href: "/dashboard/courses", label: "Courses", tab: "Courses" },
  { href: "/dashboard/exercises", label: "Exercises", tab: "Exercises" },
  { href: "/dashboard/plan", label: "Weekly plan", tab: "Plan" },
  { href: "/dashboard/profile", label: "Profile", tab: "Profile" },
];

const isActive = (pathname: string, href: string) =>
  href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-[248px] shrink-0 flex-col gap-8 bg-ink px-5 py-7">
      <Image
        src="/fran-methodology-logo.png"
        alt="Fran Methodology"
        width={200}
        height={100}
        className="h-10 w-auto brightness-0 invert opacity-95"
        priority
      />
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors " +
              (isActive(pathname, item.href)
                ? "bg-teal/15 text-paper"
                : "text-ink-mute hover:text-paper")
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-paper/10 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[13px] font-bold text-ink">
          {USER.initials}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-paper">{USER.name}</div>
          <div className="text-[11px] text-muted">{USER.club}</div>
        </div>
      </div>
    </aside>
  );
}

function BottomTabs() {
  const pathname = usePathname();
  const tabs = NAV.filter((n) => n.href !== "/dashboard/plan");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white px-5 pb-7 pt-2.5 lg:hidden">
      {tabs.map((item) => {
        const on = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={
                "h-[18px] w-[18px] rounded-[5px] " +
                (on ? "bg-ink" : "bg-[#C9D2CD]")
              }
            />
            <span
              className={
                "text-[11px] font-semibold " + (on ? "text-ink" : "text-[#C9D2CD]")
              }
            >
              {item.tab}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-28 lg:pb-0">{children}</main>
      <BottomTabs />
    </div>
  );
}

/** Page header used on desktop views; hidden copy adapts on mobile. */
export function PageHeader({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        {eyebrow ? (
          <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-1.5 text-[27px] font-bold tracking-[-0.02em] text-ink lg:text-[34px] lg:tracking-[-0.025em]">
          {title}
        </h1>
      </div>
    </div>
  );
}
