import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout'

export default function CertificationsLayout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>
}
