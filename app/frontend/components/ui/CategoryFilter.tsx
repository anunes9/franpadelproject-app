export function CategoryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {['All', 'Technical', 'Tactical'].map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={
            'rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ' +
            (value === c ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-[#56666F] hover:border-teal')
          }
        >
          {c}
        </button>
      ))}
    </div>
  )
}
