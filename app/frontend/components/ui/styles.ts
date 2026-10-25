// Shared class strings for the app's two control shapes. They're plain
// strings (not components) so the same look applies to a <button>, an Inertia
// <Link> or a static status <div>.

const BUTTON_BASE =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-center text-base font-semibold transition-[transform,opacity,background-color] duration-150 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 motion-reduce:active:scale-100'

const BUTTON_VARIANTS = {
  // The page's main action.
  primary: 'bg-ink text-paper shadow-card-dark',
  // Records progress (marking a Module complete).
  accent: 'bg-teal-deep text-paper shadow-card-dark',
  secondary: 'border border-line bg-white text-ink shadow-card',
  danger: 'border border-line bg-white text-danger shadow-card',
  // A finished state shown where the action used to be; render on a <div>.
  done: 'border border-line bg-white text-muted shadow-card',
} as const

export function buttonClass(variant: keyof typeof BUTTON_VARIANTS, className = '') {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`
}

// Filter and selection chips. `active` is the selected one in a group.
export function chipClass(active: boolean, className = '') {
  const state = active
    ? 'border-ink bg-ink text-paper shadow-card-dark'
    : 'border-line bg-white text-muted-strong shadow-card hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:hover:translate-y-0'
  return `shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-meta font-semibold transition-[transform,box-shadow,border-color,background-color,color] duration-150 pointer-coarse:min-h-11 ${state} ${className}`
}

// A form field's <label>, wrapping its caption and its control.
export const LABEL_CLASS = 'flex flex-col gap-1.5 text-sm font-medium text-ink'

// A text input, select or date field in the dashboard's forms.
export const INPUT_CLASS =
  'rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30'
