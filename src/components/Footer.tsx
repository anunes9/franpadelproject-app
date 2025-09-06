import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logos */}
          <div className="flex items-center gap-6">
            <Image src="/an-logo.svg" alt="AN Logo" width={120} height={60} className="h-10 w-auto" />

            <Link href="https://franpadelproject.com" prefetch={false} target="_blank">
              <Image src="/fr-logo.svg" alt="FR Logo" width={60} height={60} className="h-10 w-auto" />
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground">{new Date().getFullYear()} © All rights reserved</div>
        </div>
      </div>
    </footer>
  )
}
