import { Link, router, usePage } from '@inertiajs/react'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { addMinutes, formatDate, formatDuration, formatTimeRange, groupName } from '@/lib/classGroups'
import { classExercisePath, classGroupPath, exercisePath } from '@/lib/paths'
import { parseBoard } from '../../board/document'
import { BoardPreview } from '../../board/Preview'
import { ClassActions } from '../../components/PlanEditing'
import { AppShell, PageHeader } from '../../components/shell'
import { BackLink, Detail, Eyebrow, FieldError, MediaPlaceholder, Pagination, Pill, Topic } from '../../components/ui'
import type { ClassExercise, ClassGroup, ClassStructure, TrainingClassDetail } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  // ISO date (YYYY-MM-DD) at the Academy.
  today: string
  trainingClass: TrainingClassDetail
  // How many Classes the group's plan has.
  classCount: number
  classGroup: ClassGroup
  classStructure: ClassStructure
  exercises: ClassExercise[]
  availableExercises: ClassExercise[]
  errors: Record<string, unknown>
}

// How many of the Module's Exercises the picker shows at a time.
const PICK_PAGE_SIZE = 3

type Translate = ReturnType<typeof useTranslation>['t']
type BlockKind = 'warmUp' | 'exercise' | 'conditioning' | 'game'

// One step of the Class's timeline: when it starts (minutes into the Class),
// how long it takes, and for an Exercise slot, its number and pick if any.
interface Block {
  kind: BlockKind
  start: number
  minutes: { min: number; max: number }
  slot?: number
  exercise?: ClassExercise
}

// "terça, 27/10/2026" as "Terça, 27/10/2026".
const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// "5 min" or "10–15 min".
function minutesText(t: Translate, range: { min: number; max: number }) {
  return range.min === range.max
    ? t('trainingClasses.show.minutes', { min: range.min })
    : t('trainingClasses.show.minutesRange', range)
}

// The Class Structure laid out as a timeline: the warm-up, one slot per
// Exercise (filled in the order picked), the game based on the exercises and
// the game. Times count the shorter end of each range, and the game takes
// what is left. A Class with more picks than its structure has gets a slot
// for each.
function timeline(structure: ClassStructure, duration: number, picked: ClassExercise[]): Block[] {
  const slots = Math.max(structure.exercises.count, picked.length)
  const exerciseTotal = slots * structure.exercises.minutes
  const blocks: Block[] = [{ kind: 'warmUp', start: 0, minutes: structure.warmUp }]
  let start = structure.warmUp.min
  for (let slot = 0; slot < slots; slot++) {
    blocks.push({
      kind: 'exercise',
      start,
      minutes: { min: structure.exercises.minutes, max: structure.exercises.minutes },
      slot: slot + 1,
      exercise: picked[slot],
    })
    start += structure.exercises.minutes
  }
  blocks.push({ kind: 'conditioning', start, minutes: structure.conditioning })
  start += structure.conditioning.min
  blocks.push({
    kind: 'game',
    start,
    minutes: {
      min: Math.max(0, duration - structure.warmUp.max - exerciseTotal - structure.conditioning.max),
      max: Math.max(0, duration - start),
    },
  })
  return blocks
}

// Minutes since the Class started, while it is on today; null otherwise.
// Read from this device's clock, as the Coach is at the court.
function useMinutesIn(date: string, today: string, startTime: string, duration: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])
  if (date !== today) return null
  const [hours, minutes] = startTime.split(':').map(Number)
  const elapsed = now.getHours() * 60 + now.getMinutes() - (hours * 60 + minutes)
  return elapsed >= 0 && elapsed < duration ? elapsed : null
}

function blockTitle(t: Translate, block: Block) {
  if (block.kind === 'exercise') return t('trainingClasses.show.exerciseSlot', { n: block.slot ?? 0 })
  if (block.kind === 'warmUp') return t('trainingClasses.show.warmUp')
  if (block.kind === 'conditioning') return t('trainingClasses.show.conditioning')
  return t('trainingClasses.show.game')
}

// One Class of a Training Plan, laid out as a timeline: its Class Structure
// with the picked Exercises and their diagrams in their slots, beside what
// its Module is about and the Module's Exercises still to pick. Its Coach
// (or a Club Manager of its Club) picks and removes Exercises, and marks,
// moves or skips the Class.
function Show() {
  const { today, trainingClass, classCount, classGroup, classStructure, exercises, availableExercises, errors } =
    usePage<Props>().props
  const { t, tn, locale } = useTranslation()
  const [pending, setPending] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [pickPage, setPickPage] = useState(1)
  const duration = classGroup.duration
  const blocks = timeline(classStructure, duration, exercises)
  const slotCount = blocks.filter((block) => block.kind === 'exercise').length
  const full = exercises.length >= slotCount
  const end = addMinutes(trainingClass.startTime, duration)
  const minutesIn = useMinutesIn(trainingClass.date, today, trainingClass.startTime, duration)
  // The step the Class is at: the last one already started.
  const nowIndex = minutesIn === null ? -1 : blocks.filter((block) => minutesIn >= block.start).length - 1
  const moduleHasExercises = exercises.length + availableExercises.length > 0
  const search = query.trim().toLowerCase()
  const shown = availableExercises.filter(
    (exercise) => !search || `${exercise.title} ${exercise.ref}`.toLowerCase().includes(search)
  )
  // Adding an Exercise takes it out of the picker, so the last page can empty.
  const pickPages = Math.max(1, Math.ceil(shown.length / PICK_PAGE_SIZE))
  const currentPickPage = Math.min(pickPage, pickPages)
  const pickShown = shown.slice((currentPickPage - 1) * PICK_PAGE_SIZE, currentPickPage * PICK_PAGE_SIZE)

  function change(method: 'post' | 'delete', exercise: ClassExercise) {
    const url = classExercisePath(trainingClass.id, exercise.ref)
    const options = {
      preserveScroll: true,
      onStart: () => setPending(exercise.ref),
      onFinish: () => setPending(null),
    }
    if (method === 'post') router.post(url, {}, options)
    else router.delete(url, options)
  }

  return (
    <div className="px-5 pt-6 pb-14 lg:px-10 lg:pt-8">
      <div className="flex max-w-[1120px] flex-col gap-6 lg:mx-auto">
        <BackLink label={groupName(t, classGroup)} href={classGroupPath(classGroup.id)} />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <Eyebrow>
              {t('trainingClasses.show.eyebrowLine', {
                level: t(`players.levelOption.${classGroup.level}`),
                module: trainingClass.module.number,
                n: trainingClass.number,
                total: classCount,
              })}
            </Eyebrow>
            <div className="flex flex-wrap items-center gap-3">
              <PageHeader
                title={t('trainingClasses.show.title', {
                  n: trainingClass.number,
                  date: capitalised(formatDate(trainingClass.date, locale)),
                })}
              />
              {trainingClass.date === today && (
                <span className="rounded-full bg-ink px-2.5 py-1 font-dash-mono text-label uppercase text-paper">
                  {t('classGroups.today')}
                </span>
              )}
              {trainingClass.kind === 'assessment' && <Pill text={t('classGroups.show.assessment')} />}
              {trainingClass.skipped && <Pill text={t('classGroups.show.status.skipped')} variant="muted" />}
            </div>
          </div>
          <ClassActions trainingClass={trainingClass} align="end" />
        </div>

        {nowIndex >= 0 && minutesIn !== null && (
          <NowCard blocks={blocks} index={nowIndex} minutesIn={minutesIn} duration={duration} slotCount={slotCount} />
        )}

        <dl className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card">
          <Detail label={t('trainingClasses.show.when')}>
            <span className="font-dash-mono">{formatTimeRange(trainingClass.startTime, duration)}</span>
          </Detail>
          <Detail label={t('trainingClasses.show.duration')}>{formatDuration(duration)}</Detail>
          <Detail label={t('trainingClasses.show.group')}>
            <Link href={classGroupPath(classGroup.id)} className="text-ink underline-offset-2 hover:underline">
              {groupName(t, classGroup)} · {tn('classGroups.playersCount', classGroup.players.length)}
            </Link>
          </Detail>
          <Detail label={t('trainingClasses.show.exercises')}>
            <span className="font-dash-mono">
              {t('trainingClasses.show.exercisesFilled', { count: exercises.length, total: slotCount })}
            </span>
          </Detail>
          {trainingClass.kind === 'assessment' && (
            <p className="col-span-full text-meta text-muted-strong">{t('classGroups.show.assessmentNote')}</p>
          )}
        </dl>

        <div className="flex flex-wrap items-start gap-5">
          <section aria-labelledby="timeline-title" className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="timeline-title" className="text-lg font-extrabold text-ink">
                {t('trainingClasses.show.plan')}
              </h2>
              <p className="text-meta text-muted-strong">
                {t('trainingClasses.show.structureIntro', {
                  duration: formatDuration(duration),
                  warmUp: minutesText(t, classStructure.warmUp),
                  count: classStructure.exercises.count,
                  minutes: classStructure.exercises.minutes,
                  total: classStructure.exercises.count * classStructure.exercises.minutes,
                  conditioning: minutesText(t, classStructure.conditioning),
                })}
              </p>
            </div>

            <TimeBar blocks={blocks} startTime={trainingClass.startTime} end={end} />

            <FieldError
              errors={errors ?? {}}
              field="exercise"
              copy={{ other_module: t('trainingClasses.show.errors.otherModule') }}
            />
            <FieldError
              errors={errors ?? {}}
              field="exercise_id"
              copy={{ taken: t('trainingClasses.show.errors.taken') }}
            />

            <ol className="flex flex-col">
              {blocks.map((block, i) => (
                <TimelineStep
                  key={`${block.kind}-${block.slot ?? 0}`}
                  block={block}
                  time={addMinutes(trainingClass.startTime, block.start)}
                  first={i === 0}
                  last={i === blocks.length - 1}
                  state={nowIndex < 0 ? 'plain' : i < nowIndex ? 'past' : i === nowIndex ? 'now' : 'next'}
                  pending={pending !== null}
                  onRemove={(exercise) => change('delete', exercise)}
                />
              ))}
            </ol>
            <p className="text-xs text-muted sm:pl-[92px]">{t('trainingClasses.show.timesNote', { end })}</p>
          </section>

          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
            <section
              aria-labelledby="module-title"
              className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5 shadow-card"
            >
              <h2 id="module-title" className="text-[15px] font-extrabold text-ink">
                {t('trainingClasses.show.aboutModule')}
              </h2>
              <p className="text-sm text-muted-strong">{trainingClass.module.description}</p>
              {trainingClass.module.topics.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-meta text-muted">{t('trainingClasses.show.topics')}</h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {trainingClass.module.topics.map((topic) => (
                      <li key={topic}>
                        <Topic>{topic}</Topic>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section
              aria-labelledby="pick-title"
              className="flex flex-col gap-3 rounded-[18px] border border-line bg-white p-5 shadow-card"
            >
              <div className="flex flex-col gap-1">
                <h2 id="pick-title" className="text-[15px] font-extrabold text-ink">
                  {t('trainingClasses.show.pickTitle', { n: trainingClass.module.number })}
                </h2>
                <span className="text-meta text-muted-strong">
                  {full
                    ? t('trainingClasses.show.pickFull', { count: slotCount })
                    : tn('trainingClasses.show.pickLeft', slotCount - exercises.length)}
                </span>
              </div>
              {availableExercises.length > 0 && (
                <label className="flex flex-col gap-1 text-meta text-muted">
                  {t('trainingClasses.show.search')}
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setPickPage(1)
                    }}
                    placeholder={t('trainingClasses.show.searchPlaceholder')}
                    className="min-h-11 rounded-xl border border-line bg-paper px-3 text-sm text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                </label>
              )}
              {availableExercises.length === 0 ? (
                <p className="text-meta text-muted">
                  {t(moduleHasExercises ? 'trainingClasses.show.allChosen' : 'trainingClasses.show.moduleEmpty')}
                </p>
              ) : shown.length === 0 ? (
                <p className="text-meta text-muted">{t('trainingClasses.show.noMatch')}</p>
              ) : (
                <ul className="flex flex-col">
                  {pickShown.map((exercise) => (
                    <li
                      key={exercise.ref}
                      className="flex flex-col gap-2.5 border-b border-mist py-3.5 last:border-b-0"
                    >
                      <span className="flex flex-col gap-0.5">
                        <Link
                          href={exercisePath(exercise.ref)}
                          className="text-meta font-semibold text-ink underline-offset-2 hover:underline"
                        >
                          {exercise.title}
                        </Link>
                        <span className="font-dash-mono text-label text-muted">{exercise.ref}</span>
                      </span>
                      <ExerciseImage exercise={exercise} className="rounded-lg" />
                      <button
                        type="button"
                        onClick={() => change('post', exercise)}
                        disabled={full || pending !== null}
                        aria-label={`${t('trainingClasses.show.add')} ${exercise.title}`}
                        className="inline-flex min-h-11 items-center self-start rounded-full border border-line bg-white px-4 text-meta font-semibold text-teal-deep hover:border-teal disabled:cursor-default disabled:bg-paper disabled:text-muted"
                      >
                        {t('trainingClasses.show.add')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Pagination page={currentPickPage} pages={pickPages} onChange={setPickPage} />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

// An Exercise's diagram in a 16:9 frame: its Board's first Step, or else
// its first image, or a placeholder without either.
function ExerciseImage({ exercise, className = '' }: { exercise: ClassExercise; className?: string }) {
  const { t } = useTranslation()
  const board = parseBoard(exercise.board)
  if (board) {
    return (
      <div className={`aspect-video w-full border border-line bg-white p-1 ${className}`}>
        <BoardPreview doc={board} label={t('trainingClasses.show.imageAlt', { title: exercise.title })} />
      </div>
    )
  }
  if (!exercise.image) return <MediaPlaceholder className={`aspect-video w-full ${className}`} />
  return (
    <img
      src={exercise.image}
      alt={t('trainingClasses.show.imageAlt', { title: exercise.title })}
      loading="lazy"
      className={`block aspect-video w-full border border-line bg-white object-contain ${className}`}
    />
  )
}

// The Class's minutes as one bar: each step's share of the time.
function TimeBar({ blocks, startTime, end }: { blocks: Block[]; startTime: string; end: string }) {
  const { t } = useTranslation()
  const slots = blocks.filter((block) => block.kind === 'exercise').length
  const label = (block: Block) => {
    if (block.kind === 'exercise') return t('trainingClasses.show.barExercise', { n: block.slot ?? 0 })
    if (block.kind === 'warmUp') return t('trainingClasses.show.barWarmUp')
    if (block.kind === 'conditioning') return t('trainingClasses.show.barConditioning')
    return t('trainingClasses.show.barGame')
  }
  const tone = (block: Block) => {
    if (block.kind === 'exercise') return block.exercise ? 'bg-ink text-paper' : 'bg-tint-ink text-muted-strong'
    return block.kind === 'game' ? 'bg-teal-line text-ink' : 'bg-mist-strong text-ink'
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        role="img"
        aria-label={t('trainingClasses.show.barLabel', { count: slots, start: startTime, end })}
        className="flex h-10 gap-[3px] overflow-hidden rounded-xl"
      >
        {blocks.map((block) => (
          <span
            key={`${block.kind}-${block.slot ?? 0}`}
            className={`flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap font-dash-mono text-label font-semibold ${tone(block)}`}
            style={{ flex: `${block.kind === 'game' ? block.minutes.max : block.minutes.min} 1 0` }}
          >
            {label(block)}
          </span>
        ))}
      </div>
      <div className="flex justify-between font-dash-mono text-label text-muted">
        <span>{startTime}</span>
        <span>{end}</span>
      </div>
    </div>
  )
}

type StepState = 'plain' | 'past' | 'now' | 'next'

// One step on the timeline: its start time, a dot on the rail, and its card.
// An Exercise slot shows its pick, with its diagram and Remove, or that it is
// still to choose.
function TimelineStep({
  block,
  time,
  first,
  last,
  state,
  pending,
  onRemove,
}: {
  block: Block
  time: string
  first: boolean
  last: boolean
  state: StepState
  pending: boolean
  onRemove: (exercise: ClassExercise) => void
}) {
  const { t } = useTranslation()
  const exercise = block.exercise
  const emptySlot = block.kind === 'exercise' && !exercise
  const dot =
    block.kind === 'exercise'
      ? exercise
        ? 'border-ink bg-ink'
        : 'border-ring-muted bg-white'
      : block.kind === 'game'
        ? 'border-teal-deep bg-teal-deep'
        : 'border-ink-mute bg-ink-mute'
  const card =
    block.kind === 'exercise'
      ? exercise
        ? 'border border-line bg-white shadow-card'
        : 'border-[1.5px] border-dashed border-ring-muted bg-white'
      : block.kind === 'game'
        ? 'border border-teal-line bg-tint-teal'
        : 'border border-line bg-mist'
  const stateRing = state === 'now' ? 'ring-2 ring-ink' : state === 'past' ? 'opacity-70' : ''

  return (
    <li className="grid grid-cols-[44px_20px_minmax(0,1fr)] gap-x-2 sm:grid-cols-[56px_28px_minmax(0,1fr)]">
      <span className="pt-4 text-right font-dash-mono text-xs font-semibold sm:pt-[18px] sm:text-meta">{time}</span>
      <span className="relative flex justify-center">
        <span
          className="absolute left-1/2 -ml-px w-0.5 bg-line"
          style={{ top: first ? 24 : 0, bottom: last ? 'calc(100% - 24px)' : 0 }}
        />
        <span
          className={`relative z-10 mt-[18px] box-border size-3.5 rounded-full border-[3px] shadow-[0_0_0_4px_var(--color-paper)] ${dot}`}
        />
      </span>
      <div className="pb-3">
        <div className={`flex flex-col gap-2.5 rounded-[14px] px-4 py-3.5 ${card} ${stateRing}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2.5">
              {block.kind === 'exercise' && (
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-tint-ink font-dash-mono text-meta font-semibold">
                  {block.slot}
                </span>
              )}
              <span className="text-[15px] font-extrabold">{blockTitle(t, block)}</span>
            </span>
            <span className="font-dash-mono text-xs font-semibold text-muted-strong">
              {minutesText(t, block.minutes)}
            </span>
          </div>
          {exercise && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <span className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
                  <Link
                    href={exercisePath(exercise.ref)}
                    className="text-sm font-semibold text-ink underline-offset-2 hover:underline"
                  >
                    {exercise.title}
                  </Link>
                  <span className="font-dash-mono text-xs text-muted">{exercise.ref}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(exercise)}
                  disabled={pending}
                  aria-label={`${t('trainingClasses.show.remove')} ${exercise.title}`}
                  className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-3.5 text-meta font-semibold text-danger hover:border-teal disabled:opacity-60"
                >
                  {t('trainingClasses.show.remove')}
                </button>
              </div>
              <Link href={exercisePath(exercise.ref)} className="block max-w-[560px] overflow-hidden rounded-[10px]">
                <ExerciseImage exercise={exercise} />
              </Link>
            </div>
          )}
          {emptySlot && <span className="text-meta text-muted-strong">{t('trainingClasses.show.emptySlot')}</span>}
          {block.kind === 'game' && (
            <span className="text-meta text-muted-strong">{t('trainingClasses.show.gameNote')}</span>
          )}
        </div>
      </div>
    </li>
  )
}

// While the Class is on: the step it is at, the minutes left in it and, for
// an Exercise, its diagram.
function NowCard({
  blocks,
  index,
  minutesIn,
  duration,
  slotCount,
}: {
  blocks: Block[]
  index: number
  minutesIn: number
  duration: number
  slotCount: number
}) {
  const { t } = useTranslation()
  const block = blocks[index]
  const ends = index + 1 < blocks.length ? blocks[index + 1].start : duration
  const left = Math.max(0, ends - minutesIn)
  const clock = new Date()
  const time = `${String(clock.getHours()).padStart(2, '0')}:${String(clock.getMinutes()).padStart(2, '0')}`

  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-2.5 rounded-[18px] bg-ink p-4 text-paper shadow-card-dark sm:max-w-[560px]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-dash-mono text-label uppercase text-teal-line">
          {t('trainingClasses.show.now', { time })}
        </span>
        <span className="font-dash-mono text-meta font-semibold">
          {t('trainingClasses.show.minutesLeft', { count: left })}
        </span>
      </div>
      <span className="text-meta text-teal-line">
        {block.kind === 'exercise'
          ? t('trainingClasses.show.nowExercise', { n: block.slot ?? 0, total: slotCount })
          : blockTitle(t, block)}
      </span>
      {block.exercise && (
        <>
          <span className="text-[17px] font-extrabold leading-snug">{block.exercise.title}</span>
          <ExerciseImage exercise={block.exercise} className="rounded-xl" />
          <Link
            href={exercisePath(block.exercise.ref)}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-paper text-sm font-bold text-ink"
          >
            {t('trainingClasses.show.viewExercise')}
          </Link>
        </>
      )}
      <span className="block h-1.5 overflow-hidden rounded-full bg-ink-soft">
        <span className="block h-full bg-teal" style={{ width: `${Math.round((minutesIn / duration) * 100)}%` }} />
      </span>
    </section>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
