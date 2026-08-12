# Learn Padel — Next.js export

Next.js 14 (App Router) + TypeScript + Tailwind implementation of the approved
mockups (`Learn Padel App.dc.html` — option **1A** mobile, **1D** desktop).
One responsive component set: mobile layout below `lg`, desktop shell above.

## Run

```bash
npm install
npm run dev
```

## Why Next.js rather than loose .tsx files

The design is a multi-screen app with routes (course → module → quiz, exercise
library → detail), so routing, layout nesting and static params come for free.
Every screen is still a plain React component — if you already have an app, copy
`components/` + `lib/data.ts` and the bodies of the `app/**/page.tsx` files into
your own router; nothing depends on Next beyond `next/link`, `next/image` and
`next/font`.

## Routes

| Route | Screen | Rendering |
| --- | --- | --- |
| `/` | Dashboard — progress, continue card, module list, week strip | server |
| `/courses` | Levels + all 8 beginner modules | server |
| `/courses/[id]` | Module detail — materials, content sections, exercises, knowledge check | server |
| `/courses/[id]/quiz` | Knowledge check + results/review | client |
| `/exercises` | Library with Technical/Tactical filter | client |
| `/exercises/[ref]` | Exercise detail with full-bleed media | server |
| `/plan` | Weekly plan — drag-and-drop (desktop), tap-to-assign (mobile) | client |
| `/profile` | Profile fields + EN/PT switcher | server + client toggle |

## Structure

```
app/            routes (see table)
components/
  shell.tsx     AppShell, Sidebar (lg+), BottomTabs (<lg), PageHeader
  ui.tsx        ProgressBar, StatusBadge, Topic, Eyebrow, MediaPlaceholder,
                ExerciseCard, CategoryFilter, LanguageToggle
lib/data.ts     typed content: MODULES, EXERCISES, QUIZ, DAYS, USER, COURSE_STATS
public/         Fran Methodology logos
```

## Design tokens (tailwind.config.ts)

| Token | Hex | Use |
| --- | --- | --- |
| `ink` | `#12283F` | primary surface, text, sidebar |
| `teal` | `#6FB69B` | accent on dark |
| `teal-deep` | `#3E8C71` | accent on light, progress fill |
| `paper` | `#F7F8F6` | app background / text on ink |
| `line` | `#E2E6E2` | hairline borders |
| `mist` | `#EEF2EF` | topic chips, soft panels |
| `muted` | `#7A8B93` | secondary text |
| `danger` | `#B4705A` | destructive / wrong answer |

Type: **Archivo** (400–800) for UI, **IBM Plex Mono** for eyebrows, refs and
metadata. Radii: 10 / 14 / 18px. Cards are 1px `line` borders on white, no
shadows.

## What is real and what is placeholder

- **Real**: all 8 beginner modules with their titles, descriptions, topics and
  durations; Module 1's full content sections (EN); the brand logos.
- **Placeholder**: exercise titles/descriptions and their media (striped
  `MediaPlaceholder` blocks), quiz questions (written from Module 1 content),
  user profile, and all progress/stat numbers.
- **Not built yet**: OTP login and invitations, admin/sales roles, PT content
  (the `LanguageToggle` is UI only — wire it to your i18n layer), real progress
  persistence, module locking rules.

## State

Local `useState` only — quiz answers, exercise filter, weekly plan, language.
Replace with your data layer; `lib/data.ts` is shaped to be swapped for API
responses of the same types.
