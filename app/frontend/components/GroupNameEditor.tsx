import { PencilEdit02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useForm } from '@inertiajs/react'
import { type FormEvent, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { groupName } from '@/lib/classGroups'
import { classGroupNamePath } from '@/lib/paths'
import type { ClassGroup } from '../types/dashboard-data'
import { PageHeader } from './shell'
import { buttonClass, FieldError, INPUT_CLASS, LABEL_CLASS } from './ui'

// A group's name as its page's title, which its Coach (or a Club Manager of
// its Club) can rename in place. A blank name shows the group by its Level.
export function GroupNameEditor({ group, maxLength }: { group: ClassGroup; maxLength: number }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const form = useForm({ name: group.name ?? '' })
  form.transform((fields) => ({ class_group: fields }))

  function save(event: FormEvent) {
    event.preventDefault()
    form.patch(classGroupNamePath(group.id), { preserveScroll: true, onSuccess: () => setEditing(false) })
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <PageHeader title={groupName(t, group)} />
        <button
          type="button"
          onClick={() => {
            form.setData('name', group.name ?? '')
            form.clearErrors()
            setEditing(true)
          }}
          aria-label={t('classGroups.show.editName')}
          className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-teal"
        >
          <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className={LABEL_CLASS}>
          {t('classGroups.show.nameLabel')}
          <input
            type="text"
            value={form.data.name}
            onChange={(event) => form.setData('name', event.target.value)}
            maxLength={maxLength}
            placeholder={t(`players.levelOption.${group.level}`)}
            // biome-ignore lint/a11y/noAutofocus: the field the Coach just asked to edit
            autoFocus
            className={`${INPUT_CLASS} min-h-11 w-[min(420px,80vw)] border-2 border-teal-deep text-xl font-extrabold`}
          />
        </label>
        <button type="submit" disabled={form.processing} className={buttonClass('primary', 'min-h-11 py-0')}>
          {t('classGroups.show.saveName')}
        </button>
        <button type="button" onClick={() => setEditing(false)} className={buttonClass('secondary', 'min-h-11 py-0')}>
          {t('classGroups.show.cancelName')}
        </button>
      </div>
      <p className="text-meta text-muted">{t('classGroups.show.nameHint')}</p>
      <FieldError
        errors={form.errors as Record<string, unknown>}
        field="name"
        copy={{ too_long: t('classGroups.show.nameTooLong', { max: maxLength }) }}
      />
    </form>
  )
}
