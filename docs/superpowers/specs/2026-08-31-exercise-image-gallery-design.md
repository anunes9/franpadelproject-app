# Exercise show page: image gallery instead of single hero

## Overview

`Exercises/Show.tsx` currently picks the *first* image-typed blob out of
`exercise.media` (`exercise.media.find((file) => file.contentType.startsWith('image/'))`)
and renders it as a full-bleed, cropped (`object-cover`) hero banner with the
back button floating on top of it. Exercises can have multiple images
attached — a diagram and an animation, both SVGs, imported by
`lib/tasks/exercises.rake` under filenames like `diagram.svg` /
`animation.svg` — but only the first one in attachment order is ever shown;
everything else is silently dropped. `ExerciseCard.tsx` has the same
single-image pattern for the list view but is out of scope here — this
spec only covers the exercise show page.

There is no `kind`/type metadata distinguishing a diagram from an animation
from a generic photo — Active Storage blobs live in one flat
`has_many_attached :media` collection, serialized as `CourseDocument[]`
(`{ id, filename, contentType, url }`). This spec does not add any such
metadata: all images are treated uniformly as an unordered gallery, per
user decision during brainstorming.

Additionally, SVG diagrams/animations look wrong `object-cover`-cropped
like a photo — they need to be shown in full (`object-contain`).

## Goals

- All image-typed attachments (`contentType.startsWith('image/')`) on an
  exercise are shown, not just the first.
- Images are never cropped — always shown in full via `object-contain`.
- Header (back link, category/ref eyebrow, title) moves out of the
  hero-image overlay into a normal page header, matching the existing
  dark `bg-ink` band pattern already used by `Courses/Show.tsx` (back
  link → teal eyebrow → title → topic pills), so the two show pages share
  one header idiom instead of two.
- Images render in a responsive grid below the header: 1 column on
  mobile, 2 columns on desktop (`lg:grid-cols-2`).
- Clicking an image opens it larger in a lightbox/modal, reusing the
  existing `DocumentViewerModal` component as-is (it already renders
  `image/*` content types via `object-contain` with focus-trap/Escape
  support) — no new modal component.
- If an exercise has zero images, show one `MediaPlaceholder` inline in
  the gallery area (not a full-bleed dark banner).

## Non-goals

- No backend/data-model changes — no `kind` column, no reordering
  metadata, no distinguishing diagram vs. animation vs. photo in the UI.
  All images are shown as a plain gallery.
- No changes to `ExerciseCard.tsx` / the exercises list view — it keeps
  its current single-thumbnail behavior.
- No changes to non-image media (video/PDF) handling on this page —
  today's code already ignores non-image media on the show page
  (`.find(file => file.contentType.startsWith('image/'))`); this spec
  keeps that filter, just changes `.find` to `.filter`.
- No new `DocumentViewerModal` features (zoom/pan, prev/next navigation
  between images while the modal is open) — out of scope, can be a
  follow-up if needed.

## Components

### `app/frontend/pages/Exercises/Show.tsx`

Restructure into two regions:

**Header** (replaces the current `relative` hero + overlay back-link block,
lines 46–58): a `bg-ink px-5 pb-6 pt-6 text-paper lg:px-10 lg:pb-10 lg:pt-9`
band, mirroring `Courses/Show.tsx` lines 42–66:

```tsx
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
      <Topic>{courseModule?.title ?? t('exercises.show.defaultModuleLabel')}</Topic>
      <Topic>{exercise.duration}</Topic>
    </div>
  </div>
</div>
```

(`Topic` today renders `bg-mist`/`text-ink`, which won't read on the dark
band — either give `Topic` a `tone` prop like `MediaPlaceholder` already
has, or render the pills inline here with `bg-paper/10 text-paper` as
`Courses/Show.tsx` does for its topic pills. Prefer reusing `Topic` with a
new optional `tone="dark"` prop over duplicating markup, for consistency
if a third page ever needs the same pill-on-dark treatment.)

**Gallery** (replaces the single `<img>`/`MediaPlaceholder`, still inside
the existing `px-5 py-5 lg:px-10 lg:py-8` content wrapper, above the
description):

```tsx
const images = exercise.media.filter((file) => file.contentType.startsWith('image/'))
const [viewingImage, setViewingImage] = useState<CourseDocument | null>(null)

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
  <MediaPlaceholder label={t('exercises.show.mediaPlaceholderSuffix')} tone="light" className="aspect-[4/3]" />
)}

{viewingImage && (
  <DocumentViewerModal
    document={viewingImage}
    onClose={() => setViewingImage(null)}
    closeLabel={t('courses.show.closeDocument')}
  />
)}
```

Notes:
- `aspect-[4/3]` keeps the grid visually even regardless of each SVG's
  native dimensions; `object-contain` inside it means nothing is ever
  cropped.
- `closeLabel` reuses the existing `courses.show.closeDocument` i18n key
  rather than adding a duplicate exercises-scoped key, since the modal's
  copy isn't page-specific.
- `MediaPlaceholder`'s `tone` prop today is `'light' | 'dark'`; the old
  hero used `tone="dark"` because it sat on a full-bleed dark area —
  now that the gallery area is on the page's normal light background,
  switch to `tone="light"`.
- Hover treatment (`-translate-y-0.5`, `hover:border-teal`,
  `hover:shadow-card-hover`) is copied verbatim from the materials-list
  buttons in `Courses/Show.tsx` (line 78) — same interactive-card motif,
  reused rather than invented.

### `Topic` component (`app/frontend/components/ui/Topic.tsx`)

Add an optional `tone?: 'light' | 'dark'` prop (default `'light'`,
preserving current callers' behavior unchanged): `'dark'` renders
`bg-paper/10 text-paper` instead of `bg-mist text-ink`, for use on the new
`bg-ink` header band.

### `DocumentViewerModal`, `MediaPlaceholder`

No changes — used as-is.

## Testing

- Component/interaction test (or manual verification, matching this
  project's existing frontend test coverage level) for
  `Exercises/Show.tsx`:
  - An exercise with 2+ image attachments renders all of them in the
    grid, not just the first.
  - Clicking an image opens `DocumentViewerModal` with that image; the
    modal is not rendered before a click.
  - An exercise with zero image attachments renders the `MediaPlaceholder`
    and no gallery grid.
  - Non-image media (if any) attached to an exercise does not appear in
    the gallery.
- Manual check in the browser: confirm SVG diagrams/animations are not
  cropped (`object-contain` visible in full) and the dark header band
  renders the teal eyebrow / paper title / topic pills legibly.
