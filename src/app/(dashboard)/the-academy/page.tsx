import { getAllCourses } from "@/lib/cms"
import { IconCalendarStats } from "@tabler/icons-react"
import { CourseCard } from "@/components/CourseCard"

export default async function Page() {
  const { items } = await getAllCourses()

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <IconCalendarStats width={32} height={32} stroke={1.5} />
        <h1 className="text-4xl font-bold underline">The Academy</h1>
      </div>

      <span className="block text-gray-500 text-justify lg:max-w-[80%] mb-6">
        O Fran Methodology é uma metodologia de ensino diferenciado e
        especializado para melhorar as competências técnicas e tácticas de
        padel.
      </span>

      <div className="grid md:grid-cols-2 items-start gap-8 pt-6">
        {items.map((course) => (
          <CourseCard
            key={course.slug}
            title={course.title}
            href={`/the-academy/${course.slug}`}
            image={course.hero.url}
          />
        ))}
      </div>
    </>
  )
}
