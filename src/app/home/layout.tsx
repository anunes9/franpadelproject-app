import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
