export function MediaPlaceholder({
  label,
  reference,
  className = '',
  tone = 'light',
}: {
  label: string
  reference?: string
  className?: string
  tone?: 'light' | 'dark'
}) {
  const stripes =
    tone === 'dark'
      ? 'repeating-linear-gradient(135deg, rgba(247,248,246,0.07) 0 8px, transparent 8px 16px)'
      : 'repeating-linear-gradient(135deg, rgba(18,40,63,0.07) 0 6px, transparent 6px 12px)'
  return (
    <div
      className={
        'relative flex items-end justify-between p-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),inset_0_-28px_32px_-24px_rgba(4,10,18,0.3)] ' +
        (tone === 'dark' ? 'bg-ink' : 'bg-[#E7EBE7]') +
        ' ' +
        className
      }
      style={{ backgroundImage: stripes }}
    >
      <span
        className={'font-dash-mono text-[10px] tracking-[0.08em] ' + (tone === 'dark' ? 'text-ink-mute' : 'text-muted')}
      >
        {label}
      </span>
      {reference ? (
        <span className={'font-dash-mono text-[10px] ' + (tone === 'dark' ? 'text-ink-mute' : 'text-muted')}>
          {reference}
        </span>
      ) : null}
    </div>
  )
}
