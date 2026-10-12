// Diagonal stripes in the surface's own ink or paper, so the placeholder reads
// as "no image yet" rather than as a broken one.
const STRIPES = {
  light:
    'repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-ink) 7%, transparent) 0 6px, transparent 6px 12px)',
  dark: 'repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-paper) 7%, transparent) 0 8px, transparent 8px 16px)',
}

export function MediaPlaceholder({
  label,
  className = '',
  tone = 'light',
}: {
  label?: string
  className?: string
  tone?: 'light' | 'dark'
}) {
  return (
    <div
      className={`relative flex items-end p-2.5 shadow-media ${tone === 'dark' ? 'bg-ink' : 'bg-track'} ${className}`}
      style={{ backgroundImage: STRIPES[tone] }}
    >
      {label && (
        <span className={`font-dash-mono text-label ${tone === 'dark' ? 'text-ink-mute' : 'text-muted'}`}>{label}</span>
      )}
    </div>
  )
}
