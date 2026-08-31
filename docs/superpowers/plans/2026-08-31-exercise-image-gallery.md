# Exercise Image Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the exercise show page's single cropped hero image with a
gallery grid that shows every attached image uncropped, opening a lightbox
on click, with a dark header band replacing the old image-overlay header.

**Architecture:** Two small, focused changes to existing React/Inertia
components — no new components, no backend/data changes. `Topic` gets an
optional `tone` prop so its pills can sit on the new dark header band.
`Exercises/Show.tsx` is restructured: the hero `<img>`/overlay block becomes
a `bg-ink` header band (copying the pattern already used by
`Courses/Show.tsx`), and the single-image lookup (`.find`) becomes a
`.filter` rendered as a responsive grid of clickable cards, each opening the
already-existing `DocumentViewerModal` as a lightbox.

**Tech Stack:** React 18, TypeScript, Inertia.js, Tailwind CSS v4 (custom
`@theme` tokens: `ink`, `teal`, `paper`, `mist`, `line`, `muted`,
`shadow-card`, `shadow-card-hover`).

## Global Constraints

- No backend/data-model changes — no `kind` column, no reordering metadata.
  All images render as a plain, unordered gallery.
- No changes to `ExerciseCard.tsx` / the exercises list view.
- No changes to non-image media (video/PDF) handling on this page — keep
  filtering to `contentType.startsWith('image/')`.
- No new `DocumentViewerModal` features (zoom/pan, prev/next nav) — reuse
  it exactly as it exists today.
- This repo has **no JS/TS test runner** (no vitest/jest, no
  `@testing-library/*`, no test script in `package.json` — verified by
  direct inspection). Do not introduce one for this change; that's a
  separate, unrequested piece of scope. Verification here is: TypeScript
  compilation (`npm run check`), lint (`npm run lint`), and manual
  browser verification — matching this project's existing frontend
  coverage level, per the spec's Testing section.
- Spec: `docs/superpowers/specs/2026-08-31-exercise-image-gallery-design.md`

---

### Task 1: Add a `tone` prop to `Topic`

**Files:**
- Modify: `app/frontend/components/ui/Topic.tsx` (currently 5 lines, full
  file below)
- Test: none (no test runner in this repo — verify via `npm run check` /
  `npm run lint` and the grep step below)

**Interfaces:**
- Consumes: nothing new.
- Produces: `Topic({ children, tone }: { children: ReactNode; tone?: 'light' | 'dark' })`
  — `tone` defaults to `'light'` and existing callers (which never pass
  `tone`) render byte-identical output to today. Task 2 consumes
  `tone="dark"`.

Current full content of `app/frontend/components/ui/Topic.tsx`:

```tsx
import type { ReactNode } from 'react'

export function Topic({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-mist px-2 py-1 text-xs text-ink">{children}</span>
}
```

- [ ] **Step 1: Find every existing caller of `Topic`, to confirm none will break**

Run: `grep -rn "<Topic" "app/frontend"`

Expected: matches in `app/frontend/pages/Exercises/Show.tsx` and
`app/frontend/components/ui/ExerciseCard.tsx` (or similar), all of the
form `<Topic>...</Topic>` with no props passed — confirming it's safe to
add an optional prop with a default that preserves current behavior.

- [ ] **Step 2: Update the component**

Replace the full contents of `app/frontend/components/ui/Topic.tsx` with:

```tsx
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  tone?: 'light' | 'dark'
}

export function Topic({ children, tone = 'light' }: Props) {
  const toneClasses = tone === 'dark' ? 'bg-paper/10 text-paper' : 'bg-mist text-ink'
  return <span className={`rounded-md px-2 py-1 text-xs ${toneClasses}`}>{children}</span>
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npm run check && npm run lint`
Expected: both exit 0, no errors. (`npm run check` runs
`tsc -p tsconfig.app.json && tsc -p tsconfig.node.json`; `npm run lint`
runs Biome.)

- [ ] **Step 4: Commit**

```bash
git add app/frontend/components/ui/Topic.tsx
git commit -m "Add tone prop to Topic for dark header bands"
```

---

### Task 2: Restructure `Exercises/Show.tsx` — header band, image gallery, lightbox

**Files:**
- Modify: `app/frontend/pages/Exercises/Show.tsx` (full file below,
  125 lines)
- Test: none (see Global Constraints) — verified in Task 3

**Interfaces:**
- Consumes: `Topic` from Task 1 (`tone?: 'light' | 'dark'` prop);
  `DocumentViewerModal` from `app/frontend/components/ui`
  (`{ document: CourseDocument; onClose: () => void; closeLabel: string }`
  — unchanged, already exists); `CourseDocument` and `Exercise` types from
  `app/frontend/types/dashboard-data.ts` (unchanged: `Exercise.media` is
  `CourseDocument[]`, each item `{ id, filename, contentType, url }`).
- Produces: nothing consumed by later tasks (Task 3 is manual browser
  verification of this page).

Current full content of `app/frontend/pages/Exercises/Show.tsx`:

```tsx
import { Link, router, usePage } from '@inertiajs/react'
import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { AppShell } from '../../components/shell'
import { Eyebrow, MediaPlaceholder, Topic } from '../../components/ui'
import type { Exercise, Module } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'

interface Props {
  [key: string]: unknown
  exercise: Exercise
  courseModule: Module | null
}

function renderBoldText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const key = `${i}-${part}`
    return part.startsWith('**') && part.endsWith('**') ? (
      <strong key={key} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={key}>{part}</Fragment>
    )
  })
}

function Show() {
  const { exercise, courseModule } = usePage<Props>().props
  const { t } = useTranslation()
  const [completing, setCompleting] = useState(false)

  function handleComplete() {
    setCompleting(true)
    router.patch(
      `/dashboard/exercises/${exercise.ref}/complete`,
      {},
      { preserveScroll: true, onFinish: () => setCompleting(false) }
    )
  }

  const image = exercise.media.find((file) => file.contentType.startsWith('image/'))

  return (
    <div>
      <div className="relative">
        {image ? (
          <img src={image.url} alt={exercise.title} className="h-75 w-full object-cover lg:h-115" />
        ) : (
          <MediaPlaceholder label={t('exercises.show.mediaPlaceholderSuffix')} tone="dark" className="h-75 lg:h-115" />
        )}
        <Link
          href="/dashboard/exercises"
          className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1.5 text-[13px] text-paper shadow-[0_2px_8px_rgba(0,0,0,0.25)] backdrop-blur-sm"
        >
          {t('common.back')}
        </Link>
      </div>

      <div className="px-5 py-5 lg:px-10 lg:py-8">
        <div className="mx-auto flex max-w-180 flex-col gap-4">
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {exercise.category} · {exercise.ref}
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.02em] text-ink lg:text-[32px]">{exercise.title}</h1>
          </div>

          <p className="text-[15px] leading-relaxed text-ink-body">{exercise.description}</p>

          <div className="flex gap-2">
            <Topic>{courseModule?.title ?? t('exercises.show.defaultModuleLabel')}</Topic>
            <Topic>{exercise.duration}</Topic>
          </div>

          {exercise.content && (
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('exercises.show.detailsEyebrow')}</Eyebrow>
              <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-4 shadow-card">
                {exercise.content
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <p key={line} className="text-[15px] leading-relaxed text-ink-body">
                      {renderBoldText(line)}
                    </p>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex gap-2.5">
            {exercise.completed ? (
              <div className="flex-1 rounded-full border border-line bg-white py-3.5 text-center text-sm font-semibold text-muted shadow-card lg:text-base">
                {t('exercises.show.completed')}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 rounded-full bg-ink py-3.5 text-sm lg:text-base font-semibold text-paper shadow-card-dark transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-60 motion-reduce:active:scale-100"
              >
                {completing ? t('exercises.show.markingComplete') : t('exercises.show.markComplete')}
              </button>
            )}

            <Link
              href={`/dashboard/plan?exercise=${exercise.ref}`}
              className="rounded-full border border-line bg-white px-5 py-3.5 text-sm lg:text-base font-semibold text-ink shadow-card transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {t('exercises.show.addToPlan')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
```

- [ ] **Step 1: Replace the full file content**

Replace the full contents of `app/frontend/pages/Exercises/Show.tsx` with:

```tsx
import { Link, router, usePage } from '@inertiajs/react'
import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { AppShell } from '../../components/shell'
import { DocumentViewerModal, Eyebrow, MediaPlaceholder, Topic } from '../../components/ui'
import type { CourseDocument, Exercise, Module } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'

interface Props {
  [key: string]: unknown
  exercise: Exercise
  courseModule: Module | null
}

function renderBoldText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const key = `${i}-${part}`
    return part.startsWith('**') && part.endsWith('**') ? (
      <strong key={key} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={key}>{part}</Fragment>
    )
  })
}

function Show() {
  const { exercise, courseModule } = usePage<Props>().props
  const { t } = useTranslation()
  const [completing, setCompleting] = useState(false)
  const [viewingImage, setViewingImage] = useState<CourseDocument | null>(null)

  function handleComplete() {
    setCompleting(true)
    router.patch(
      `/dashboard/exercises/${exercise.ref}/complete`,
      {},
      { preserveScroll: true, onFinish: () => setCompleting(false) }
    )
  }

  const images = exercise.media.filter((file) => file.contentType.startsWith('image/'))

  return (
    <div>
      <div className="bg-ink px-5 pb-6 pt-6 text-paper lg:px-10 lg:pb-10 lg:pt-9">
        <div className="mx-auto flex max-w-180 flex-col gap-3.5">
          <Link href="/dashboard/exercises" className="text-[13px] text-ink-mute hover:text-paper">
            {t('common.back')}
          </Link>
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-teal">
              {exercise.category} · {exercise.ref}
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.02em] lg:text-[32px]">{exercise.title}</h1>
          </div>
          <div className="flex gap-2">
            <Topic tone="dark">{courseModule?.title ?? t('exercises.show.defaultModuleLabel')}</Topic>
            <Topic tone="dark">{exercise.duration}</Topic>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 lg:px-10 lg:py-8">
        <div className="mx-auto flex max-w-180 flex-col gap-4">
          {images.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setViewingImage(image)}
                  className="aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-white p-3 shadow-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-teal hover:shadow-card-hover motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
                >
                  <img src={image.url} alt={exercise.title} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          ) : (
            <MediaPlaceholder label={t('exercises.show.mediaPlaceholderSuffix')} className="aspect-[4/3]" />
          )}

          <p className="text-[15px] leading-relaxed text-ink-body">{exercise.description}</p>

          {exercise.content && (
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('exercises.show.detailsEyebrow')}</Eyebrow>
              <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-4 shadow-card">
                {exercise.content
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <p key={line} className="text-[15px] leading-relaxed text-ink-body">
                      {renderBoldText(line)}
                    </p>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-2 flex gap-2.5">
            {exercise.completed ? (
              <div className="flex-1 rounded-full border border-line bg-white py-3.5 text-center text-sm font-semibold text-muted shadow-card lg:text-base">
                {t('exercises.show.completed')}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 rounded-full bg-ink py-3.5 text-sm lg:text-base font-semibold text-paper shadow-card-dark transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-60 motion-reduce:active:scale-100"
              >
                {completing ? t('exercises.show.markingComplete') : t('exercises.show.markComplete')}
              </button>
            )}

            <Link
              href={`/dashboard/plan?exercise=${exercise.ref}`}
              className="rounded-full border border-line bg-white px-5 py-3.5 text-sm lg:text-base font-semibold text-ink shadow-card transition-transform duration-150 active:scale-[0.98] motion-reduce:active:scale-100"
            >
              {t('exercises.show.addToPlan')}
            </Link>
          </div>
        </div>
      </div>

      {viewingImage && (
        <DocumentViewerModal
          document={viewingImage}
          onClose={() => setViewingImage(null)}
          closeLabel={t('courses.show.closeDocument')}
        />
      )}
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
```

Note what changed vs. the original: the eyebrow (`category · ref`) moved
into the header band and switched from `text-muted` to `text-teal`
(matching `Courses/Show.tsx`'s header eyebrow exactly); the `Eyebrow`
import is still used (for the `detailsEyebrow` block further down) so it
stays imported; the two `Topic` pills moved from the body into the header
band with `tone="dark"`; `image`/`.find` became `images`/`.filter`;
`MediaPlaceholder` dropped `tone="dark"` (now `'light'`, its default,
since it now sits on the light content background, not a full-bleed dark
area) and `h-75 lg:h-115` became `aspect-[4/3]`; `DocumentViewerModal` and
`viewingImage` state are new.

- [ ] **Step 2: Type-check and lint**

Run: `npm run check && npm run lint`
Expected: both exit 0, no errors — in particular no unused-import errors
(confirm `Eyebrow` is still referenced by the details block, and every
newly-imported name — `DocumentViewerModal`, `CourseDocument` — is used).

- [ ] **Step 3: Commit**

```bash
git add app/frontend/pages/Exercises/Show.tsx
git commit -m "Show all exercise images in a gallery with lightbox, drop cropped hero"
```

---

### Task 3: Manual browser verification

**Files:** none modified — this task only verifies Tasks 1–2 in a real
browser, per this project's convention of testing UI changes live (there
is no automated frontend test suite to rely on instead).

**Interfaces:** none.

- [ ] **Step 1: Ensure a local Postgres is running and `DATABASE_URL` is set**

This repo's `config/database.yml` requires Postgres reachable via
`DATABASE_URL` (or local defaults). If not already running, start
Postgres however this machine normally does (e.g. `brew services start
postgresql`, or a local Docker Postgres) and confirm `bin/rails runner
"puts ActiveRecord::Base.connection.active?"` prints `true` before
continuing. If Postgres cannot be reached in this environment, stop here
and report that UI verification could not be performed, rather than
claiming it passed.

- [ ] **Step 2: Prepare the database and import exercise data**

```bash
bin/rails db:prepare
bin/rails db:seed
```

`db:seed` calls the `exercises:import` rake task itself (per
`db/seeds.rb`). If it does not import images, run explicitly:

```bash
bin/rails exercises:import LOCALE=pt IMPORT_IMAGES=1
```

- [ ] **Step 3: Start the dev server**

```bash
bin/dev
```

Wait for both the Rails server and Vite to report ready. The app serves
at `http://localhost:3000` (browse via `localhost`, not `127.0.0.1` — a
routing constraint redirects `127.0.0.1` to `localhost` for Vite dev
cookies to match).

- [ ] **Step 4: Log in**

Navigate to `http://localhost:3000/`, log in with the seeded client user:
`client@example.com` / `password123`.

- [ ] **Step 5: Verify the multi-image case**

Navigate to `http://localhost:3000/dashboard/exercises/exercise-1.0`
(has both a diagram and an animation SVG attached, so 2 images).

Confirm:
- No cropped full-bleed hero image at the top; instead a dark navy header
  band with a "Voltar"/back link, a teal uppercase eyebrow
  (`category · ref`), the title in white, and two pills.
- Below the header, a grid with 2 image cards (stacked on narrow/mobile
  width, side-by-side at desktop width ≥1024px), each image fully visible
  (not cropped) on a white card.
- Hovering a card lifts it slightly and shows a teal border / stronger
  shadow.
- Clicking a card opens a full-screen modal showing that image large
  (`object-contain`, not cropped), with a working close button; pressing
  `Escape` also closes it.

- [ ] **Step 6: Verify the zero-image case**

Navigate to `http://localhost:3000/dashboard/exercises/exercise-2.4` (no
diagram/animation configured, so 0 images).

Confirm: a single placeholder box renders in the gallery area (light
tone, diagonal stripe pattern, label text) instead of a grid or a dark
full-bleed banner, and the rest of the page (description, details,
buttons) still renders normally below it.

- [ ] **Step 7: Report results**

State plainly which of Steps 5–6 passed as described, and call out any
visual discrepancy from the spec (e.g. wrong colors, cropped images,
modal not closing) so it can be fixed before considering this done. If
Step 1 blocked the whole task, say so explicitly instead of claiming the
UI was verified.
