"use client";

import { useState } from "react";
import { EXERCISES } from "@/lib/data";
import { CategoryFilter, ExerciseCard } from "@/components/ui";
import { PageHeader } from "@/components/shell";

export default function ExercisesPage() {
  const [category, setCategory] = useState("All");
  const list =
    category === "All"
      ? EXERCISES
      : EXERCISES.filter((e) => e.category === category);

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader eyebrow="Library" title="Exercises" />
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {list.map((e) => (
            <ExerciseCard key={e.ref} exercise={e} />
          ))}
        </div>
      </div>
    </div>
  );
}
