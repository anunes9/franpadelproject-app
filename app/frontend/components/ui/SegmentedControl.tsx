// A labeled single-choice toggle: a short caption next to a track of
// segments, the selected one raised on a white pill. Used for compact
// filters where every option fits on one line.
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
      <fieldset aria-label={label} className="flex rounded-full bg-track p-1">
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={`flex-auto whitespace-nowrap rounded-full px-2 py-1.5 text-meta font-semibold sm:px-3 transition-[background-color,color,box-shadow] duration-150 pointer-coarse:min-h-10 ${
                active ? 'bg-white text-ink shadow-card' : 'text-muted-strong hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </fieldset>
    </div>
  )
}
