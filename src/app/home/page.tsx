import { Card } from '@/components/Card'
import { IconBook2, IconCertificate, IconShield } from '@tabler/icons-react'

export default async function HomePage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Training Dashboard</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Access your personalized training programs and certifications to advance your padel skills
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Beginner Course */}
        <Card
          title="Beginner Course"
          href="/the-academy/beginner"
          description="Start your padel journey with our comprehensive beginner program. Learn the fundamentals and build a solid foundation."
          icon={<IconShield height={24} width={24} />}
        />

        {/* The Academy */}
        <Card
          title="The Academy"
          href="/the-academy"
          description="Explore our complete methodology with specialized training for all skill levels."
          icon={<IconBook2 height={24} width={24} />}
        />

        {/* Certifications */}
        <Card
          title="Certifications"
          href="/certifications"
          description="Get certified and advance your career as a padel player and coach with recognized qualifications."
          icon={<IconCertificate height={24} width={24} />}
        />
      </div>

      {/* Quick Stats or Progress Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Progress</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Courses Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Certifications Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">Hours of Training</div>
          </div>
        </div>
      </div>
    </div>
  )
}
