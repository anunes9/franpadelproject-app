export function Pill({
  text,
  tone = 'light',
  className,
}: {
  text: string
  className?: string
  tone?: 'light' | 'dark'
}) {
  const variant = tone === 'dark' ? 'bg-paper/15' : 'bg-[#E9EDE9]'
  return (
    <span
      className={`whitespace-nowrap rounded-full border border-[#B9D9CB] px-2 py-1 font-dash-mono text-[10px] uppercase tracking-[0.08em] text-teal-deep w-fit ${className}`}
    >
      {text}
    </span>
  )
}
