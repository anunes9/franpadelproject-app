import { Card } from "@/components/Card"
import { IconBook2, IconCertificate } from "@tabler/icons-react"
import Image from "next/image"

export default async function Home() {
  return (
    <div>
      <div className="grid gap-12 md:grid-cols-2 items-center mb-12">
        <Image
          className="block md:hidden !relative object-contain"
          src="/fran-methodology-logo.png"
          alt="Fran Logo"
          fill
        />

        <div className="aspect-[9/16] bg-gray-200 rounded-lg overflow-hidden">
          <video
            className="w-full h-full object-cover"
            autoPlay={false}
            loop={false}
            muted
            playsInline
            src="https://videos.ctfassets.net/rqt5vjnpqy42/3ef26Zy6GLC2xqMRKg65N6/ceaff5f51de07147756fdee533f8dfdb/FranPadelProject_teaser.mov"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Image
            className="hidden md:block !relative object-contain"
            src="/fran-methodology-logo.png"
            alt="Fran Logo"
            fill
          />

          <Card
            title="The Academy"
            href="/the-academy"
            description="Um método de ensino diferenciado e especializado para melhorar as competências técnicas e tácticas de padel."
            icon={<IconBook2 height={24} width={24} />}
          />

          <Card
            title="Certificação"
            href="/certifications"
            description="Certificações reconhecidas para avançar na carreira de jogador e treinador de padel."
            icon={<IconCertificate height={24} width={24} />}
          />
        </div>
      </div>
    </div>
  )
}
