import Link from "next/link";
import { MODULES } from "@/lib/dashboard-data";
import { ProgressBar, StatusBadge, Topic } from "@/components/dashboard/ui";
import { PageHeader } from "@/components/dashboard/shell";

const LEVELS = [
  { name: "Beginner", meta: "8 modules · 31% complete", active: true },
  { name: "Intermediate", meta: "Locked · finish Beginner first", active: false },
  { name: "Advanced", meta: "Locked", active: false },
];

export default function CoursesPage() {
  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
        <PageHeader eyebrow="Beginner course · 8 modules" title="Courses" />

        <div className="grid gap-2 lg:grid-cols-3 lg:gap-4">
          {LEVELS.map((l) => (
            <div
              key={l.name}
              className={
                "rounded-[18px] p-4 lg:p-[22px] " +
                (l.active
                  ? "bg-ink text-paper"
                  : "border border-line bg-white text-[#A3B0B7]")
              }
            >
              <div className="text-sm font-bold lg:text-lg">{l.name}</div>
              <div
                className={
                  "mt-1 text-[11px] lg:text-[13px] " +
                  (l.active ? "text-ink-mute" : "")
                }
              >
                {l.meta}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          {MODULES.map((m) => (
            <Link
              key={m.id}
              href={"/dashboard/courses/" + m.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-teal lg:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-ink lg:text-[17px]">
                    {m.title}
                  </div>
                  <div className="mt-1 text-[13px] text-[#56666F] lg:text-sm">
                    {m.description}
                  </div>
                </div>
                <StatusBadge status={m.status} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.topics.map((t) => (
                  <Topic key={t}>{t}</Topic>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <ProgressBar value={m.progress} />
                <span className="whitespace-nowrap font-dash-mono text-[11px] text-muted">
                  {m.duration}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
