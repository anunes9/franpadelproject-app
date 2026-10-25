// A field's validation errors, as the server sends them: a list of stable
// codes (such as "blank" or "taken"), each with the server's message.
export interface FormError {
  code: string
  message: string
}

// Our own copy, in the Client's language, for the error codes a field knows.
export type ErrorCopy = Partial<Record<string, string>>

// The text for a field's errors: our copy for the codes we know and the
// server's message for any other, without repeats. Null when it has none.
export function fieldErrorText(errors: Record<string, unknown>, field: string, copy: ErrorCopy): string | null {
  const list = ([] as unknown[]).concat(errors[field] ?? []) as FormError[]
  if (list.length === 0) return null
  return [...new Set(list.map((error) => copy[error.code] ?? error.message))].join(' ')
}

export function FieldError({
  errors,
  field,
  copy,
}: {
  errors: Record<string, unknown>
  field: string
  copy: ErrorCopy
}) {
  const text = fieldErrorText(errors, field, copy)
  if (!text) return null
  return (
    <span role="alert" className="text-meta font-normal text-danger">
      {text}
    </span>
  )
}
