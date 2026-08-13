export function getByPath(dict: Record<string, unknown>, key: string): string {
  const value = key.split('.').reduce<unknown>((node, segment) => {
    if (typeof node === 'object' && node !== null && segment in node) {
      return (node as Record<string, unknown>)[segment]
    }
    return undefined
  }, dict)

  if (typeof value !== 'string') {
    throw new Error(`Missing translation for key "${key}"`)
  }

  return value
}

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(vars[name] ?? ''))
}
