import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
