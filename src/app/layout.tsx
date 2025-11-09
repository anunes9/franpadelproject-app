// This layout should never be reached because middleware redirects to [locale]
// But we need it for Next.js structure
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
