import { Add01Icon, Cancel01Icon, Search01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, usePage } from '@inertiajs/react'
import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import {
  addPlanEntry,
  entryDetail,
  exerciseNumber,
  isInDay,
  type PlanItem,
  removePlanEntry,
  shortTitle,
} from '@/lib/plan'
import { DAY_KEYS, LONG_DAY_KEY, sameDay, titleCase, weekOf } from '@/lib/week'
import { AppShell, PageHeader } from '../../components/shell'
import { buttonClass, ModuleFilter, Tile, TilePill } from '../../components/ui'
import type { Exercise, Module, PlanEntry, PlanWeek } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  days: string[]
  plan: PlanWeek
  exercises: Pick<Exercise, 'ref' | 'title' | 'moduleId'>[]
  modules: Pick<Module, 'id' | 'title' | 'description' | 'topics'>[]
  preselectedExercise: string | null
}

type Tab = 'exercises' | 'modules'

/** One row of the library: a pill, one or two lines of text and an add button. Draggable on desktop. */
function LibraryRow({
  pill,
  title,
  detail,
  inDay,
  onAdd,
  onDragStart,
  onDragEnd,
  addLabel,
  addedLabel,
}: {
  pill: string
  title: string
  detail?: string
  inDay: boolean
  onAdd: () => void
  onDragStart: () => void
  onDragEnd: () => void
  addLabel: string
  addedLabel: string
}) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: desktop drag source; the add button inside is the accessible path
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2 lg:cursor-grab ${
        inDay ? 'border-teal-deep/40 bg-tint-teal' : 'border-line bg-white'
      }`}
    >
      <span className="w-fit shrink-0 rounded-full bg-tint-ink px-2 py-1 font-dash-mono text-[11px] font-medium text-ink">
        {pill}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-2 text-[13px] leading-snug text-ink">{title}</span>
        {detail && <span className="line-clamp-1 text-[11px] text-muted-strong">{detail}</span>}
      </span>
      <button
        type="button"
        onClick={onAdd}
        disabled={inDay}
        aria-label={inDay ? addedLabel : addLabel}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          inDay ? 'bg-teal-deep text-paper' : 'border border-line bg-white text-ink hover:border-teal'
        }`}
      >
        <HugeiconsIcon icon={inDay ? Tick02Icon : Add01Icon} size={16} strokeWidth={1.9} aria-hidden />
      </button>
    </div>
  )
}

function EntryTile({
  entry,
  moduleLabel,
  removeLabel,
  detail,
}: {
  entry: PlanEntry
  moduleLabel: string
  removeLabel: string
  detail: string | null
}) {
  const isModule = entry.kind === 'module'
  return (
    <Tile tone={isModule ? 'ink' : 'teal'} className="flex items-start gap-3 p-3! lg:p-3!">
      <TilePill className="font-dash-mono font-medium">{isModule ? moduleLabel : exerciseNumber(entry.key)}</TilePill>
      <Link href={entry.href} className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-2 text-[13px] font-semibold leading-snug">
          {isModule ? entry.title : shortTitle(entry.title)}
        </span>
        {detail && <span className="line-clamp-1 text-[11px] text-muted-strong">{detail}</span>}
      </Link>
      <button
        type="button"
        onClick={() => removePlanEntry(entry.id)}
        aria-label={removeLabel}
        className="-m-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-strong hover:bg-white hover:text-ink"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.9} aria-hidden />
      </button>
    </Tile>
  )
}

function Index() {
  const { days, plan, exercises, modules, preselectedExercise } = usePage<Props>().props
  const { t, tn } = useTranslation()

  const today = new Date()
  const week = weekOf(today)
  const todayIndex = week.findIndex((d) => sameDay(d, today))

  const [selectedDay, setSelectedDay] = useState<string>(days[todayIndex >= 0 ? todayIndex : 0])
  const [dragging, setDragging] = useState<PlanItem | null>(null)
  const [tab, setTab] = useState<Tab>('exercises')
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('All')

  const preselected = preselectedExercise ? exercises.find((e) => e.ref === preselectedExercise) : undefined
  const preselectedItem: PlanItem | null = preselected ? { kind: 'exercise', key: preselected.ref } : null

  const visibleExercises = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises.filter(
      (e) =>
        (moduleFilter === 'All' || e.moduleId === moduleFilter) &&
        (q === '' || e.title.toLowerCase().includes(q) || exerciseNumber(e.ref).includes(q))
    )
  }, [exercises, moduleFilter, query])

  const visibleModules = useMemo(() => {
    const q = query.trim().toLowerCase()
    return modules.filter(
      (m) => q === '' || m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    )
  }, [modules, query])

  const selectedDayLabel = t(LONG_DAY_KEY[selectedDay])
  const addLabel = t('plan.index.addToDay', { day: selectedDayLabel })
  const selectedEntries = plan[selectedDay] ?? []

  return (
    <div className="px-5 pt-5 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <div className="flex flex-col gap-1">
          <PageHeader title={t('plan.index.title')} />
          <p className="text-meta text-muted-strong">{t('plan.index.hint')}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Week */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-1.5">
              {days.map((day, i) => {
                const selected = day === selectedDay
                const hasItems = (plan[day] ?? []).length > 0
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    aria-pressed={selected}
                    aria-label={t(LONG_DAY_KEY[day])}
                    className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 transition-colors ${
                      selected ? 'bg-ink text-paper' : 'border border-line bg-white text-ink hover:border-teal'
                    }`}
                  >
                    <span aria-hidden className={`text-[11px] ${selected ? 'text-ink-mute' : 'text-muted-strong'}`}>
                      {titleCase(t(`common.days.short.${DAY_KEYS[i]}`))}
                    </span>
                    <span aria-hidden className="text-[15px] font-bold">
                      {week[i].getDate()}
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        hasItems ? (selected ? 'bg-teal' : 'bg-teal-deep') : 'bg-transparent'
                      }`}
                    />
                  </button>
                )
              })}
            </div>

            {days.map((day, i) => {
              const selected = day === selectedDay
              const entries = plan[day] ?? []
              return (
                // biome-ignore lint/a11y/noStaticElementInteractions: drop target for desktop drag-and-drop; the add buttons in the library are the accessible path
                <div
                  key={day}
                  onDragOver={(ev) => ev.preventDefault()}
                  onDrop={(ev) => {
                    ev.preventDefault()
                    if (dragging) addPlanEntry(day, dragging)
                    setDragging(null)
                  }}
                  className={`flex-col gap-3 rounded-[22px] border bg-white p-4 ${
                    selected ? 'flex border-ink' : 'hidden border-line lg:flex'
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-lg font-extrabold tracking-[-0.01em] text-ink">
                      {t(LONG_DAY_KEY[day])}{' '}
                      <span className="font-dash-mono text-xs font-normal text-muted-strong">{week[i].getDate()}</span>
                    </h2>
                    <span className="text-xs text-muted-strong">
                      {t('plan.index.plannedCount', { count: entries.length })}
                    </span>
                  </div>

                  {entries.length === 0 ? (
                    <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-line-strong px-4 py-6 text-center">
                      <span className="text-sm font-semibold text-ink">{t('plan.index.emptyDay')}</span>
                      <span className="text-xs text-muted-strong">{t('plan.index.emptyDayHint')}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {entries.map((entry) => (
                        <EntryTile
                          key={entry.id}
                          entry={entry}
                          moduleLabel={t('plan.index.moduleLabel')}
                          removeLabel={t('plan.index.remove', { title: entry.title })}
                          detail={entryDetail(entry, t)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Library */}
          <aside className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-extrabold tracking-[-0.01em] text-ink">{t('plan.index.exerciseLibrary')}</h2>
              <span className="text-xs text-muted-strong">
                {tab === 'exercises'
                  ? tn('plan.index.exercisesCount', visibleExercises.length)
                  : tn('plan.index.modulesCount', visibleModules.length)}
              </span>
            </div>

            {preselected && preselectedItem && (
              <Tile tone="clay" className="flex flex-col gap-3">
                <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted-strong">
                  {t('plan.index.fromExercisePage')}
                </span>
                <div className="flex items-start gap-3">
                  <TilePill className="font-dash-mono font-medium">{exerciseNumber(preselected.ref)}</TilePill>
                  <span className="line-clamp-2 flex-1 text-[15px] font-extrabold leading-snug">
                    {shortTitle(preselected.title)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => addPlanEntry(selectedDay, preselectedItem)}
                  disabled={isInDay(selectedEntries, preselectedItem)}
                  className={buttonClass('primary')}
                >
                  <HugeiconsIcon
                    icon={isInDay(selectedEntries, preselectedItem) ? Tick02Icon : Add01Icon}
                    size={16}
                    strokeWidth={1.9}
                    aria-hidden
                  />
                  {isInDay(selectedEntries, preselectedItem) ? t('plan.index.added') : addLabel}
                </button>
              </Tile>
            )}

            <div className="flex rounded-full bg-mist p-1">
              {(['exercises', 'modules'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={tab === value}
                  onClick={() => setTab(value)}
                  className={`flex min-h-10 flex-1 items-center justify-center rounded-full text-meta font-semibold transition-colors ${
                    tab === value ? 'bg-ink text-paper' : 'text-muted-strong'
                  }`}
                >
                  {value === 'exercises' ? t('plan.index.tabExercises') : t('plan.index.tabModules')}
                </button>
              ))}
            </div>

            <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-ink focus-within:border-teal">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                strokeWidth={1.7}
                className="shrink-0 text-muted-strong"
                aria-hidden
              />
              <input
                type="search"
                aria-label={t('plan.index.searchPlaceholder')}
                value={query}
                onChange={(ev) => setQuery(ev.target.value)}
                placeholder={t('plan.index.searchPlaceholder')}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-strong"
              />
            </label>

            {tab === 'exercises' && <ModuleFilter modules={modules} value={moduleFilter} onChange={setModuleFilter} />}

            <div className="flex flex-col gap-2 lg:max-h-[640px] lg:overflow-y-auto lg:pr-1">
              {tab === 'exercises'
                ? visibleExercises.map((e) => {
                    const item: PlanItem = { kind: 'exercise', key: e.ref }
                    return (
                      <LibraryRow
                        key={e.ref}
                        pill={exerciseNumber(e.ref)}
                        title={shortTitle(e.title)}
                        inDay={isInDay(selectedEntries, item)}
                        onAdd={() => addPlanEntry(selectedDay, item)}
                        onDragStart={() => setDragging(item)}
                        onDragEnd={() => setDragging(null)}
                        addLabel={addLabel}
                        addedLabel={t('plan.index.added')}
                      />
                    )
                  })
                : visibleModules.map((m) => {
                    const item: PlanItem = { kind: 'module', key: m.id }
                    return (
                      <LibraryRow
                        key={m.id}
                        pill={m.title}
                        title={m.description}
                        detail={m.topics.join(' · ')}
                        inDay={isInDay(selectedEntries, item)}
                        onAdd={() => addPlanEntry(selectedDay, item)}
                        onDragStart={() => setDragging(item)}
                        onDragEnd={() => setDragging(null)}
                        addLabel={addLabel}
                        addedLabel={t('plan.index.added')}
                      />
                    )
                  })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
