import { CourseCard } from "@/components/CourseCard"
import { IconCertificate } from "@tabler/icons-react"

const BEGINNER = {
  slug: 'beginner',
  title: 'Beginner',
  level: 1,
  hero: {
    url: 'https://images.ctfassets.net/rqt5vjnpqy42/4YNCPWg8W8sMCeArZTzteM/a6fb70d48bb223d56a85545cbf731eaa/methodology-white.png'
  }
}

export default async function Page() {
  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <IconCertificate width={32} height={32} stroke={1.5} />
        <h1 className="text-4xl font-bold underline">Certificações</h1>
      </div>

      <span className="block text-gray-500 text-justify lg:max-w-[80%] mb-6">
        O Fran Methodology é uma metodologia de ensino diferenciado e
        especializado para melhorar as competências técnicas e tácticas de
        padel.
      </span>

      <div className="grid md:grid-cols-2 items-start gap-8 pt-6">
        <CourseCard
          title={BEGINNER.title}
          href={`/certifications/${BEGINNER.slug}`}
          image={BEGINNER.hero.url}
        />
      </div>
    </>
  )
}
