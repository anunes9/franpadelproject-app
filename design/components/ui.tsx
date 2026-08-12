"use client";

import { useState } from "react";
import type { Exercise, Module } from "@/lib/data";
import Link from "next/link";

export function ProgressBar({
  value,
  tone = "light",
}: {
  value: number;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={
        "h-1 w-full overflow-hidden rounded-full " +
        (tone === "dark" ? "bg-paper/15" : "bg-[#E9EDE9]")
      }
    >
      <div
        className={
          "h-full " + (tone === "dark" ? "bg-teal" : "bg-teal-deep")
        }
        style={{ width: value + "%" }}
      />
    </div>
  );
}

export function StatusBadge({ status }: { status: Module["status"] }) {
  const map = {
    done: "bg-teal-deep text-paper border-teal-deep",
    current: "text-teal-deep border-[#B9D9CB]",
    locked: "text-[#A3B0B7] border-line",
  } as const;
  const label = { done: "Done", current: "Active", locked: "Locked" }[status];
  return (
    <span
      className={
        "whitespace-nowrap rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] " +
        map[status]
      }
    >
      {label}
    </span>
  );
}

export function Topic({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-mist px-2 py-1 text-xs text-ink">
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
      {children}
    </span>
  );
}

/** Striped placeholder standing in for exercise media. Swap for <Image /> once assets exist. */
export function MediaPlaceholder({
  label,
  reference,
  className = "",
  tone = "light",
}: {
  label: string;
  reference?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  const stripes =
    tone === "dark"
      ? "repeating-linear-gradient(135deg, rgba(247,248,246,0.07) 0 8px, transparent 8px 16px)"
      : "repeating-linear-gradient(135deg, rgba(18,40,63,0.07) 0 6px, transparent 6px 12px)";
  return (
    <div
      className={
        "flex items-end justify-between p-2.5 " +
        (tone === "dark" ? "bg-ink" : "bg-[#E7EBE7]") +
        " " +
        className
      }
      style={{ backgroundImage: stripes }}
    >
      <span
        className={
          "font-mono text-[10px] tracking-[0.08em] " +
          (tone === "dark" ? "text-ink-mute" : "text-muted")
        }
      >
        {label}
      </span>
      {reference ? (
        <span
          className={
            "font-mono text-[10px] " +
            (tone === "dark" ? "text-ink-mute" : "text-muted")
          }
        >
          {reference}
        </span>
      ) : null}
    </div>
  );
}

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      href={"/exercises/" + exercise.ref}
      className="overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-teal"
    >
      <MediaPlaceholder
        label={exercise.media}
        reference={exercise.ref}
        className="h-24 lg:h-[140px]"
      />
      <div className="flex flex-col gap-1 px-3 pb-3 pt-2.5 lg:px-4 lg:pb-4">
        <div className="text-sm font-semibold leading-tight text-ink lg:text-[15px]">
          {exercise.title}
        </div>
        <div className="text-[11px] text-muted lg:text-xs">
          {exercise.category}
        </div>
      </div>
    </Link>
  );
}

export function CategoryFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {["All", "Technical", "Tactical"].map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={
            "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors " +
            (value === c
              ? "border-ink bg-ink text-paper"
              : "border-line bg-white text-[#56666F] hover:border-teal")
          }
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function LanguageToggle() {
  const [lang, setLang] = useState<"EN" | "PT">("EN");
  return (
    <div className="flex gap-2 font-mono text-[11px]">
      {(["EN", "PT"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={
            "rounded-full border border-line px-3 py-1.5 " +
            (lang === l ? "bg-ink text-paper" : "text-[#A3B0B7]")
          }
        >
          {l}
        </button>
      ))}
    </div>
  );
}
