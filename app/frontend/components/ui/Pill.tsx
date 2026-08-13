export function Pill({
  text,
  tone = 'light',
  className,
  variant = 'default',
}: {
  text: string
  className?: string
  tone?: 'light' | 'dark'
  variant?: 'full' | 'default'
}) {
  // const variant = tone === 'dark' ? 'bg-paper/15' : 'bg-[#E9EDE9]'
  const style = variant === 'full' ? 'border-teal-deep bg-teal-deep text-white' : 'border-[#B9D9CB] text-teal-deep'
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-2 py-1 font-dash-mono text-[10px] uppercase tracking-[0.08em] w-fit ${style} ${className}`}
    >
      {text}
    </span>
  )
}
