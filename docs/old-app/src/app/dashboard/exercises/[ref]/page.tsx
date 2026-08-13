import Link from "next/link";
import { notFound } from "next/navigation";
import { EXERCISES, getExercise, getModule } from "@/lib/dashboard-data";
import { MediaPlaceholder, Topic } from "@/components/dashboard/ui";

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ ref: e.ref }));
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const exercise = getExercise(ref);
  if (!exercise) notFound();
  const courseModule = getModule(exercise.moduleId);

  return (
    <div>
      <div className="relative">
        <MediaPlaceholder
          label={exercise.media + " · full-screen media placeholder"}
          tone="dark"
          className="h-[300px] lg:h-[460px]"
        />
        <Link
          href="/dashboard/exercises"
          className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1.5 text-[13px] text-paper"
        >
          ← Back
        </Link>
      </div>

      <div className="px-5 py-5 lg:px-10 lg:py-8">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {exercise.category} · {exercise.ref}
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.02em] text-ink lg:text-[32px]">
              {exercise.title}
            </h1>
          </div>
          <p className="text-[15px] leading-relaxed text-[#3B4B54]">
            {exercise.description}
          </p>
          <div className="flex gap-2">
            <Topic>{courseModule?.title ?? "Module"}</Topic>
            <Topic>{exercise.duration}</Topic>
          </div>
          <div className="mt-2 flex gap-2.5">
            <button
              type="button"
              className="flex-1 rounded-full bg-ink py-3.5 text-[15px] font-semibold text-paper"
            >
              Mark complete
            </button>
            <Link
              href="/dashboard/plan"
              className="rounded-full border border-line bg-white px-5 py-3.5 text-[15px] font-semibold text-ink"
            >
              Add to plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
