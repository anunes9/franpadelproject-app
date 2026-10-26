import { Link, router, usePage } from '@inertiajs/react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import { formatDate, formatTimeRange } from '@/lib/classGroups'
import { classExercisePath, classGroupPath, exercisePath } from '@/lib/paths'
import { AppShell, PageHeader } from '../../components/shell'
import { BackLink, Detail, Eyebrow, FieldError, ListCard, ListRow, Pill, Topic } from '../../components/ui'
import type { ClassExercise, ClassGroup, TrainingClassDetail } from '../../types/dashboard-data'

interface Props {
  [key: string]: unknown
  trainingClass: TrainingClassDetail
  classGroup: ClassGroup
  exercises: ClassExercise[]
  availableExercises: ClassExercise[]
  errors: Record<string, unknown>
}

const ROW_ACTION =
  '-my-2 flex min-h-11 shrink-0 items-center text-meta font-semibold disabled:opacity-60 disabled:cursor-default'

// An Exercise's title linking to its library page, with its category and duration.
function ExerciseDetails({ exercise }: { exercise: ClassExercise }) {
  const meta = [exercise.category, exercise.duration].filter(Boolean).join(' · ')
  return (
    <div className="min-w-0">
      <Link
        href={exercisePath(exercise.ref)}
        className="block truncate text-sm font-semibold text-ink underline-offset-2 hover:underline"
      >
        {exercise.title}
      </Link>
      <div className="font-dash-mono text-meta text-muted">
        {exercise.ref}
        {meta && ` · ${meta}`}
      </div>
    </div>
  )
}

// One Class of a Training Plan: what its Module is about, and where its Coach
// (or a Club Manager of its Club) picks its Exercises from that Module.
function Show() {
  const { trainingClass, classGroup, exercises, availableExercises, errors } = usePage<Props>().props
  const { t, locale } = useTranslation()
  const [pending, setPending] = useState<string | null>(null)
  const moduleHasExercises = exercises.length + availableExercises.length > 0

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
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="flex max-w-[760px] flex-col gap-6 lg:mx-auto">
        <BackLink label={t('trainingClasses.show.backToGroup')} href={classGroupPath(classGroup.id)} />
        <div className="flex flex-col gap-1">
          <Eyebrow>
            {t('trainingClasses.show.eyebrow')} · {t(`players.levelOption.${classGroup.level}`)}
          </Eyebrow>
          <div className="flex flex-wrap items-center gap-3">
            <PageHeader title={formatDate(trainingClass.date, locale)} />
            {trainingClass.kind === 'assessment' && <Pill text={t('classGroups.show.assessment')} />}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card">
          <Detail label={t('trainingClasses.show.when')}>
            {formatTimeRange(trainingClass.startTime, classGroup.duration)}
          </Detail>
          <Detail label={t('trainingClasses.show.moduleNumber', { n: trainingClass.module.number })}>
            {trainingClass.module.title}
          </Detail>
          {trainingClass.kind === 'assessment' && (
            <p className="col-span-2 text-meta text-muted-strong">{t('classGroups.show.assessmentNote')}</p>
          )}
        </dl>

        <section className="flex flex-col gap-3" aria-labelledby="class-module-heading">
          <h2 id="class-module-heading" className="text-sm font-bold text-ink">
            {t('trainingClasses.show.aboutModule')}
          </h2>
          <div className="flex flex-col gap-4 rounded-[18px] border border-line bg-white p-5 shadow-card">
            <p className="text-sm text-muted-strong">{trainingClass.module.description}</p>
            {trainingClass.module.topics.length > 0 && (
              <div className="flex flex-col gap-2">
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
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold text-ink">
              {t('trainingClasses.show.exercises')}{' '}
              <span className="font-dash-mono text-meta font-semibold text-muted">{exercises.length}</span>
            </h2>
            <p className="text-meta text-muted">{t('trainingClasses.show.exercisesIntro')}</p>
          </div>
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
          <ListCard count={exercises.length} empty={t('trainingClasses.show.noneChosen')}>
            {exercises.map((exercise) => (
              <ListRow key={exercise.ref}>
                <ExerciseDetails exercise={exercise} />
                <button
                  type="button"
                  onClick={() => change('delete', exercise)}
                  disabled={pending !== null}
                  className={`${ROW_ACTION} text-danger hover:text-ink`}
                  aria-label={`${t('trainingClasses.show.remove')} ${exercise.title}`}
                >
                  {t('trainingClasses.show.remove')}
                </button>
              </ListRow>
            ))}
          </ListCard>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink">
            {t('trainingClasses.show.pick')}{' '}
            <span className="font-dash-mono text-meta font-semibold text-muted">{availableExercises.length}</span>
          </h2>
          <ListCard
            count={availableExercises.length}
            empty={t(moduleHasExercises ? 'trainingClasses.show.allChosen' : 'trainingClasses.show.moduleEmpty')}
          >
            {availableExercises.map((exercise) => (
              <ListRow key={exercise.ref}>
                <ExerciseDetails exercise={exercise} />
                <button
                  type="button"
                  onClick={() => change('post', exercise)}
                  disabled={pending !== null}
                  className={`${ROW_ACTION} text-teal-deep hover:text-ink`}
                  aria-label={`${t('trainingClasses.show.add')} ${exercise.title}`}
                >
                  {t('trainingClasses.show.add')}
                </button>
              </ListRow>
            ))}
          </ListCard>
        </section>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
