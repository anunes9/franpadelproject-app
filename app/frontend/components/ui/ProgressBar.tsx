export function ProgressBar({ value, tone = 'light' }: { value: number; tone?: 'light' | 'dark' }) {
  return (
    <div className={'h-1 w-full overflow-hidden rounded-full ' + (tone === 'dark' ? 'bg-paper/15' : 'bg-[#E9EDE9]')}>
      <div className={'h-full ' + (tone === 'dark' ? 'bg-teal' : 'bg-teal-deep')} style={{ width: value + '%' }} />
    </div>
  )
}
