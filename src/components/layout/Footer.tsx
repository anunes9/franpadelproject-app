import Image from "next/image"

export const Footer = () => (
  <footer className="flex flex-col justify-center items-center gap-2">
    <div className="flex justify-center items-center gap-4">
      <a href="https://franpadelproject.com" target="_blank" rel="noreferrer">
        <Image alt="fran-logo" src="/fr-logo.svg" height={36} width={36} />
      </a>

      <a href="https://anunes9.github.io/me/" target="_blank" rel="noreferrer">
        <Image alt="an-logo" src="/an-logo.svg" height={48} width={48} />
      </a>
    </div>

    <span className="text-foreground/50 text-xs">
      &copy; {new Date().getFullYear()} All rights reserved
    </span>
  </footer>
)
