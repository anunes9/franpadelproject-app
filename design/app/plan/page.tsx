"use client";

import { useState } from "react";
import {
  DAYS,
  DEFAULT_PLAN,
  EXERCISES,
  SHORT_DAY,
  type Day,
  getExercise,
} from "@/lib/data";
import { PageHeader } from "@/components/shell";

export default function PlanPage() {
  const [plan, setPlan] = useState<Record<Day, string[]>>(DEFAULT_PLAN);
  const [dragging, setDragging] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const add = (day: Day, ref: string | null) => {
    if (!ref || plan[day].includes(ref)) return;
    setPlan({ ...plan, [day]: [...plan[day], ref] });
  };

  const remove = (day: Day, ref: string) =>
    setPlan({ ...plan, [day]: plan[day].filter((r) => r !== ref) });

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <PageHeader
          eyebrow="Drag exercises into a day"
          title="Weekly plan"
        />
        <p className="text-[13px] text-muted lg:hidden">
          {picked ? "Now tap a day to add it" : "Tap an exercise, then a day"}
        </p>

        {/* Mobile: tap-to-assign tray */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
          {EXERCISES.map((e) => (
            <button
              key={e.ref}
              type="button"
              onClick={() => setPicked(picked === e.ref ? null : e.ref)}
              className={
                "whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold " +
                (picked === e.ref
                  ? "border-teal-deep bg-teal-deep text-paper"
                  : "border-line bg-white text-[#56666F]")
              }
            >
              {e.title}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
          {/* Desktop: draggable library */}
          <div className="hidden flex-col gap-2 rounded-2xl border border-line bg-white p-4 lg:flex">
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              Exercise library
            </span>
            {EXERCISES.map((e) => (
              <div
                key={e.ref}
                draggable
                onDragStart={() => setDragging(e.ref)}
                onDragEnd={() => setDragging(null)}
                className="cursor-grab rounded-[10px] border border-line px-3 py-2.5 text-[13px] text-ink hover:border-teal hover:bg-paper"
              >
                {e.title}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-7 lg:gap-2.5">
            {DAYS.map((day) => (
              <div
                key={day}
                onClick={() => {
                  add(day, picked);
                  setPicked(null);
                }}
                onDragOver={(ev) => ev.preventDefault()}
                onDrop={(ev) => {
                  ev.preventDefault();
                  add(day, dragging);
                  setDragging(null);
                }}
                className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-3 lg:min-h-[320px]"
              >
                <span className="font-mono text-[10px] tracking-[0.1em] text-muted">
                  {SHORT_DAY[day]}
                </span>
                {plan[day].map((ref) => {
                  const e = getExercise(ref);
                  return (
                    <button
                      key={ref}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        remove(day, ref);
                      }}
                      className="flex items-center justify-between gap-2 rounded-[10px] bg-mist p-2.5 text-left text-xs leading-snug text-ink"
                    >
                      <span>{e?.title ?? ref}</span>
                      <span className="text-muted">×</span>
                    </button>
                  );
                })}
                {plan[day].length === 0 ? (
                  <div className="rounded-[10px] border border-dashed border-line px-2 py-4 text-center text-[11px] text-[#B7C0BA]">
                    Drop here
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
