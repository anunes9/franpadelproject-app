import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { AppShell } from "@/components/dashboard/shell";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Fran Methodology — Learn Padel",
  description:
    "Structured padel education: courses, exercises and weekly planning.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${archivo.variable} ${plexMono.variable} font-dash-sans`}>
      <AppShell>{children}</AppShell>
    </div>
  );
}
