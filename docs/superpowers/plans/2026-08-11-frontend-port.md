# Frontend Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the 8 Next.js dashboard pages (home, courses list/detail/quiz, exercises list/detail, weekly plan, profile) into the Rails app at `rails/` as Inertia + React pages, replacing the bare `Dashboard/Home` placeholder from the auth foundation spec.

**Architecture:** Static placeholder data ported as a Ruby `DashboardData` module (plain frozen constants, no ActiveRecord), passed to each page as Inertia props from small per-area controllers (`CoursesController`, `ExercisesController`, `PlanController`, `ProfileController`), all subclassing the existing `DashboardController` for shared `authenticate_user!` and a `dashboardUser` (mock profile) share. Tailwind v4 is added to the Vite pipeline for the first time. Pages use Inertia's persistent-layout convention (`Page.layout = (page) => <AppShell>{page}</AppShell>`) instead of Next's nested `layout.tsx`.

**Tech Stack:** Rails 8.1.3.1 / Ruby 3.3.12 (unchanged from the auth foundation), Tailwind v4 (+ `@tailwindcss/vite`), React 19 + TypeScript, Inertia.

## Global Constraints

- Static placeholder data only — ported as Ruby constants in a `DashboardData` module, no ActiveRecord models for courses/exercises/quiz/plan.
- All 8 routes mirror the current Next.js paths exactly under `/dashboard/*`.
- Profile page mixes real `current_user` (email, role) with mock `DashboardData::USER` fields (name, club, member since, age) — everything else stays fully mocked.
- JSON prop keys sent to the frontend stay **camelCase** (`courseStats`, `moduleId`, `memberSince`, etc.), matching the original TypeScript source exactly, even though Ruby-side local variables use idiomatic snake_case. This keeps the ported TSX nearly identical to its Next.js source.
- No ActiveRecord `RecordNotFound` — unknown `:id`/`:ref` params are handled with a plain `nil` check and `head :not_found`.
- Testing: RSpec request specs only, asserting `200` + the correct Inertia `component` name in the response body (or `:not_found` for the 404 cases). No Vitest/RTL/system specs — interactive pages (quiz, plan, exercise filter) are verified by manual click-through via `bin/dev`.
- Fonts (Archivo, IBM Plex Mono) loaded via a Google Fonts `<link>` tag, not self-hosted.

---

## File Structure

```
rails/
  app/
    models/
      dashboard_data.rb                 # NEW: Ruby port of dashboard-data.ts
    controllers/
      dashboard_controller.rb           # MODIFIED: real index action + dashboardUser share
      courses_controller.rb             # NEW: index, show, quiz
      exercises_controller.rb           # NEW: index, show
      plan_controller.rb                # NEW: index
      profile_controller.rb             # NEW: index
    frontend/
      types/
        dashboard-data.ts               # NEW: shared TS types (Module, Exercise, etc.)
      components/
        shell.tsx                       # NEW: AppShell, Sidebar, BottomTabs, PageHeader
        ui.tsx                          # NEW: ProgressBar, StatusBadge, Topic, Eyebrow, MediaPlaceholder, ExerciseCard, CategoryFilter
      entrypoints/
        application.css                 # NEW: Tailwind v4 + design tokens
        application.ts                  # MODIFIED: import application.css
      pages/
        Dashboard/Home.tsx               # MODIFIED: replaces the auth-foundation placeholder
        Courses/Index.tsx                # NEW
        Courses/Show.tsx                 # NEW
        Courses/Quiz.tsx                 # NEW
        Exercises/Index.tsx              # NEW
        Exercises/Show.tsx               # NEW
        Plan/Index.tsx                   # NEW
        Profile/Show.tsx                 # NEW
    views/layouts/
      application.html.erb              # MODIFIED: Google Fonts link tags
  public/
    fran-methodology-logo.png           # NEW: copied from the Next.js app's public/
  config/
    routes.rb                           # MODIFIED: routes for all 8 pages
  package.json                          # MODIFIED: + tailwindcss, @tailwindcss/vite
  vite.config.ts                        # MODIFIED: + tailwindcss plugin
  spec/
    models/
      dashboard_data_spec.rb            # NEW
    requests/
      dashboard_spec.rb                 # MODIFIED: assert real component name
      courses_spec.rb                   # NEW
      exercises_spec.rb                 # NEW
      plan_spec.rb                      # NEW
      profile_spec.rb                   # NEW
```

`CoursesController`, `ExercisesController`, `PlanController`, and `ProfileController` all subclass `DashboardController` (which itself subclasses `ApplicationController`) purely to inherit `authenticate_user!` and the `dashboardUser` share — `DashboardController` remains a concrete, routed controller (`/dashboard`) as well as this shared base, matching the pattern already established by the auth foundation spec rather than introducing a separate concern module for two lines of behavior.

---

### Task 1: Port DashboardData Ruby module

**Files:**
- Create: `rails/app/models/dashboard_data.rb`
- Test: `rails/spec/models/dashboard_data_spec.rb`

**Interfaces:**
- Consumes: nothing (first task, pure data).
- Produces: `DashboardData::MODULES`, `DashboardData::MODULE_1_SECTIONS`, `DashboardData::EXERCISES`, `DashboardData::QUIZ`, `DashboardData::DAYS`, `DashboardData::SHORT_DAY`, `DashboardData::DEFAULT_PLAN`, `DashboardData::USER`, `DashboardData::COURSE_STATS` (all frozen arrays/hashes with camelCase symbol keys), plus `DashboardData.find_module(id)` and `DashboardData.find_exercise(ref)` (return the matching hash or `nil`). Every later task's controller relies on these.

- [ ] **Step 1: Write the failing spec**

Create `rails/spec/models/dashboard_data_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe DashboardData do
  it "finds a module by id" do
    expect(DashboardData.find_module("module-1")[:title]).to eq("Module 1")
  end

  it "returns nil for an unknown module id" do
    expect(DashboardData.find_module("nope")).to be_nil
  end

  it "finds an exercise by ref" do
    expect(DashboardData.find_exercise("EX-01")[:title]).to eq("Slice serve, elbow above 90º")
  end

  it "returns nil for an unknown exercise ref" do
    expect(DashboardData.find_exercise("nope")).to be_nil
  end

  it "has 8 modules and 8 exercises" do
    expect(DashboardData::MODULES.size).to eq(8)
    expect(DashboardData::EXERCISES.size).to eq(8)
  end
end
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd rails && bundle exec rspec spec/models/dashboard_data_spec.rb
```

Expected: FAIL — `uninitialized constant DashboardData`.

- [ ] **Step 3: Create the DashboardData module**

Create `rails/app/models/dashboard_data.rb`:

```ruby
module DashboardData
  MODULE_1_SECTIONS = [
    {
      heading: "1st Service",
      items: [
        "Mind-Set: the player must assume greater risk in their execution;",
        "Application of slice effect - elevation of the elbow with an angle greater than 90º relative to the shoulder;"
      ]
    },
    {
      heading: "2nd Service",
      items: [
        "Mind-Set: The player must reduce risk in their execution;",
        "Application of flat effect;"
      ]
    },
    {
      heading: "Dynamic Balance",
      items: [
        "Body launch after ball execution;",
        "Avoid launching the body before execution;",
        "Rotation around the body's own axis;"
      ]
    },
    {
      heading: "Trajectories",
      items: [
        "Inside-out: the twisting of the forearm and wrist promotes the racket's entry from inside to outside the ball;",
        "Outside-in: the twisting of the forearm and wrist promotes the racket's entry from outside to inside;"
      ]
    },
    {
      heading: "Launch",
      items: [
        "Static - characterized by launching the ball against the ground to avoid a bounce higher than waist height;",
        "Dynamic - characterized by launching the ball in the air to enhance a descending technical movement pattern;"
      ]
    },
    {
      heading: "Service return",
      items: [
        "Lateral glass placement - enhances greater mobility from the corner to the \"T\" line;",
        "Placement near the \"T\" line - camouflages the lack of mobility from the corner to the \"T\" line;"
      ]
    },
    {
      heading: "1st Volley",
      items: [
        "1st Service - The mindset promotes a more moderate approach (sector 1 or 2) and theoretically, the execution speed should be between 3 to 4 considering the quality of the return, supposedly more defensive.",
        "2nd Service - The mindset promotes a more aggressive approach (sector 2) and theoretically, the execution speed should be between 2 to 3 considering the quality of the return, supposedly more offensive."
      ]
    }
  ].freeze

  MODULES = [
    { id: "module-1", n: 1, title: "Module 1", description: "Game Initiation Model", topics: ["Service", "Return", "1st Volley"], duration: "2 – 4 weeks", level: "Beginner", status: "done", progress: 100, sections: MODULE_1_SECTIONS },
    { id: "module-2", n: 2, title: "Module 2", description: "Five in Line Concept: Posture, Preparation, Mobility, Stability and Impact Point", topics: ["Posture", "Preparation", "Mobility", "Stability", "Execution"], duration: "2 – 4 weeks", level: "Beginner", status: "done", progress: 100 },
    { id: "module-3", n: 3, title: "Module 3", description: "Cross-cutting Concepts for Aerial and Ground Game", topics: ["Forehand", "Backhand", "Volley"], duration: "2 – 4 weeks", level: "Beginner", status: "current", progress: 40 },
    { id: "module-4", n: 4, title: "Module 4", description: "The concept of Defense, Counter-attack and Attack", topics: ["Defense", "Counter-attack", "Attack", "Technical preparation", "Racket handling"], duration: "2 – 4 weeks", level: "Beginner", status: "locked", progress: 0 },
    { id: "module-5", n: 5, title: "Module 5", description: "Positive-positive, Positive, neutral, negative or negative-negative", topics: ["Glass Exit"], duration: "2 – 4 weeks", level: "Beginner", status: "locked", progress: 0 },
    { id: "module-6", n: 6, title: "Module 6", description: "Technical approach to aerial movements: Traditional Smashes and Viper", topics: ["Traditional Smash", "Viper", "Net"], duration: "2 – 4 weeks", level: "Beginner", status: "locked", progress: 0 },
    { id: "module-7", n: 7, title: "Module 7", description: "Conceptual definition underlying the numerology of glasses and net sectors", topics: ["Glasses", "Speedometer"], duration: "2 – 4 weeks", level: "Beginner", status: "locked", progress: 0 },
    { id: "module-8", n: 8, title: "Module 8", description: "Coaching Tools", topics: ["Observation Method", "Types of Feedback", "\"Student\" Model", "Types of Ball Throws"], duration: "2 – 4 weeks", level: "Beginner", status: "locked", progress: 0 }
  ].freeze

  EXERCISES = [
    { ref: "EX-01", title: "Slice serve, elbow above 90º", category: "Technical", media: "VIDEO", moduleId: "module-1", duration: "8 – 10 min", description: "Ten serves per side focusing on elbow elevation above 90º relative to the shoulder, with a static ball launch that keeps the bounce below waist height." },
    { ref: "EX-02", title: "Static vs dynamic ball launch", category: "Technical", media: "GIF", moduleId: "module-1", duration: "6 min", description: "Alternate static and dynamic launches in sets of five, checking that the body is only launched after the ball is struck." },
    { ref: "EX-03", title: "Return from the lateral glass", category: "Tactical", media: "VIDEO", moduleId: "module-1", duration: "12 min", description: "Start in the corner, read the serve, and recover to the \"T\" line after every return." },
    { ref: "EX-04", title: "1st volley to sector 2", category: "Tactical", media: "IMAGE", moduleId: "module-1", duration: "10 min", description: "Approach after serve and place the first volley in sector 2 at execution speed 3." },
    { ref: "EX-05", title: "Pivot step, both sides", category: "Technical", media: "GIF", moduleId: "module-2", duration: "5 min", description: "Shoulder rotation, waist and hip unlocking, five reps each side without hitting a ball." },
    { ref: "EX-06", title: "Traffic light stop drill", category: "Technical", media: "VIDEO", moduleId: "module-2", duration: "8 min", description: "Green, yellow, red stopping cues before contact, run as a shadow drill across the court." },
    { ref: "EX-07", title: "Speedometer 1 to 5 ladder", category: "Tactical", media: "IMAGE", moduleId: "module-3", duration: "12 min", description: "Hit the same shot at each of the five categorised speeds and note where control breaks down." },
    { ref: "EX-08", title: "Glass exit, dominant side", category: "Tactical", media: "VIDEO", moduleId: "module-5", duration: "10 min", description: "Read the parabola, wait for the inflection point, and exit with a rectilinear counter-attack pattern." }
  ].freeze

  QUIZ = [
    { q: "On the 1st service, what mind-set should the player adopt?", options: ["Assume greater risk in the execution", "Reduce the risk in the execution", "Keep the same risk as the 2nd service"], correct: 0 },
    { q: "The slice effect on the serve requires the elbow at…", options: ["An angle greater than 90º relative to the shoulder", "An angle below the shoulder line", "Full extension directly overhead"], correct: 0 },
    { q: "Dynamic balance means the body is launched…", options: ["Before the ball is struck", "After the ball is struck", "Only on the second serve"], correct: 1 },
    { q: "Placing the return near the \"T\" line…", options: ["Enhances mobility from the corner to the \"T\" line", "Camouflages the lack of mobility from the corner to the \"T\" line", "Is reserved for flat serves"], correct: 1 }
  ].freeze

  DAYS = %w[Monday Tuesday Wednesday Thursday Friday Saturday Sunday].freeze

  SHORT_DAY = {
    "Monday" => "MON", "Tuesday" => "TUE", "Wednesday" => "WED",
    "Thursday" => "THU", "Friday" => "FRI", "Saturday" => "SAT", "Sunday" => "SUN"
  }.freeze

  DEFAULT_PLAN = {
    "Monday" => ["EX-01"], "Tuesday" => [], "Wednesday" => ["EX-06"],
    "Thursday" => ["EX-08"], "Friday" => [], "Saturday" => [], "Sunday" => []
  }.freeze

  USER = {
    name: "Miguel Santos", initials: "MS", email: "miguel.santos@email.pt",
    age: 34, level: "Beginner", club: "Padel Clube Lisboa", memberSince: "Mar 2026"
  }.freeze

  COURSE_STATS = {
    progress: 31, modulesDone: 2, modulesTotal: 8, exercisesDone: 14, averageQuiz: 86
  }.freeze

  def self.find_module(id)
    MODULES.find { |m| m[:id] == id }
  end

  def self.find_exercise(ref)
    EXERCISES.find { |e| e[:ref] == ref }
  end
end
```

- [ ] **Step 4: Run the spec to confirm it passes**

```bash
cd rails && bundle exec rspec spec/models/dashboard_data_spec.rb
```

Expected: PASS, 5 examples.

- [ ] **Step 5: Commit**

```bash
git add rails/app/models/dashboard_data.rb rails/spec/models/dashboard_data_spec.rb
git commit -m "Port dashboard-data.ts as a Ruby DashboardData module"
```

---

### Task 2: Add Tailwind v4 and Google Fonts to the Vite pipeline

**Files:**
- Modify: `rails/package.json`, `rails/vite.config.ts`
- Create: `rails/app/frontend/entrypoints/application.css`
- Modify: `rails/app/frontend/entrypoints/application.ts`, `rails/app/views/layouts/application.html.erb`
- Test: `rails/spec/requests/tailwind_spec.rb`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: Tailwind utility classes (`bg-ink`, `text-teal`, `font-dash-sans`, `font-dash-mono`, etc.) and the two Google Fonts (Archivo, IBM Plex Mono) available globally to every later page/component task.

- [ ] **Step 1: Add the Tailwind gems/packages**

```bash
cd rails && npm add -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Register the Vite plugin**

Edit `rails/vite.config.ts`:

```ts
import react from '@vitejs/plugin-react'
import inertia from '@inertiajs/vite'
import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    RubyPlugin(),
    inertia(),
    react(),
    tailwindcss(),
  ],
})
```

- [ ] **Step 3: Create the CSS entrypoint with the ported design tokens**

Create `rails/app/frontend/entrypoints/application.css`:

```css
@import "tailwindcss";

@theme {
  --color-ink: #12283f;
  --color-ink-soft: #1c3a57;
  --color-ink-mute: #9bb3b0;
  --color-teal: #6fb69b;
  --color-teal-deep: #3e8c71;
  --color-paper: #f7f8f6;
  --color-line: #e2e6e2;
  --color-mist: #eef2ef;
  --color-muted: #7a8b93;
  --color-danger: #b4705a;

  --font-dash-sans: "Archivo", system-ui, sans-serif;
  --font-dash-mono: "IBM Plex Mono", ui-monospace, monospace;
}

/*
  Tailwind v4 changed the default border color to `currentcolor`. This
  compatibility layer (ported from src/app/globals.css in the Next.js app)
  keeps unstyled borders looking like Tailwind v3's default gray.
*/
@layer base {
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-gray-200, currentcolor);
  }
}
```

Only the tokens actually used by the dashboard subtree are ported — the source `globals.css` also defines `p-blue`/`p-green`/`background`/`foreground`/`btn-background`/`dimmed` tokens and imports `tw-animate-css`, all for the unused shadcn/Radix components (`src/components/ui/*`), which this port doesn't touch.

- [ ] **Step 4: Import the CSS from the Vite entrypoint**

Edit `rails/app/frontend/entrypoints/application.ts`, adding as the very first line:

```ts
import './application.css'
```

- [ ] **Step 5: Load the fonts in the layout**

Edit `rails/app/views/layouts/application.html.erb`, adding after the `apple-touch-icon` link and before the `stylesheet_link_tag`:

```erb
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 6: Write a request spec proving the Tailwind bundle is served**

Create `rails/spec/requests/tailwind_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Tailwind asset pipeline", type: :request do
  it "serves the Tailwind CSS bundle alongside the login page" do
    get "/"
    expect(response).to have_http_status(200)
    expect(response.body).to match(%r{href="/vite-test/assets/application-[^"]+\.css"})
  end
end
```

- [ ] **Step 7: Run the spec**

```bash
cd rails && bundle exec rspec spec/requests/tailwind_spec.rb
```

Expected: PASS. If the asset path pattern doesn't match (e.g. a different hash/naming scheme), run `bin/dev`, curl `http://localhost:<port>/`, and adjust the regex to match the actual emitted `<link>` tag — the Vite plugin's exact output naming is what's being asserted here, not a guess to leave unverified.

- [ ] **Step 8: Manually verify styling loads**

```bash
bin/dev
```

Visit the login page and confirm Archivo/IBM Plex Mono fonts and Tailwind utility classes apply (the login page itself isn't restyled by this spec, but this proves the pipeline works before building real pages on top of it in later tasks). Stop `bin/dev` (Ctrl-C).

- [ ] **Step 9: Commit**

```bash
git add rails/package.json rails/package-lock.json rails/vite.config.ts \
  rails/app/frontend/entrypoints/application.css rails/app/frontend/entrypoints/application.ts \
  rails/app/views/layouts/application.html.erb rails/spec/requests/tailwind_spec.rb
git commit -m "Add Tailwind v4 and Google Fonts to the Vite pipeline"
```

---

### Task 3: Port shared components and the Dashboard Home page

**Files:**
- Create: `rails/app/frontend/types/dashboard-data.ts`
- Create: `rails/app/frontend/components/ui.tsx`, `rails/app/frontend/components/shell.tsx`
- Create: `rails/public/fran-methodology-logo.png` (copy)
- Modify: `rails/app/controllers/dashboard_controller.rb`
- Modify: `rails/app/frontend/pages/Dashboard/Home.tsx` (replaces the auth-foundation placeholder)
- Modify: `rails/spec/requests/dashboard_spec.rb`

**Interfaces:**
- Consumes: `DashboardData::MODULES`, `DashboardData::COURSE_STATS`, `DashboardData::USER` (Task 1); Tailwind classes and fonts (Task 2).
- Produces: shared TS types (`Module`, `Exercise`, `ModuleStatus`, `ContentSection`, `QuizQuestion`, `DashboardUser`) that every later page task imports instead of redeclaring; `AppShell`, `PageHeader` (from `components/shell`) and `ProgressBar`, `StatusBadge`, `Topic`, `Eyebrow`, `MediaPlaceholder`, `ExerciseCard`, `CategoryFilter` (from `components/ui`) that every later page task imports; the `Page.layout = (page) => <AppShell>{page}</AppShell>` convention every later page follows; `dashboardUser` shared Inertia prop (mock `DashboardData::USER`) available on every `DashboardController`-descended page.

- [ ] **Step 1: Copy the logo asset**

```bash
cp "public/fran-methodology-logo.png" "rails/public/fran-methodology-logo.png"
```

(run from the repo root — Rails serves `public/` files at their root path exactly like Next.js does, so no further config is needed)

- [ ] **Step 2: Create the shared TypeScript types**

Create `rails/app/frontend/types/dashboard-data.ts`:

```ts
export type ModuleStatus = 'done' | 'current' | 'locked'

export interface ContentSection {
  heading: string
  items: string[]
}

export interface Module {
  id: string
  n: number
  title: string
  description: string
  topics: string[]
  duration: string
  level: string
  status: ModuleStatus
  progress: number
  sections?: ContentSection[]
}

export interface Exercise {
  ref: string
  title: string
  category: 'Technical' | 'Tactical'
  media: 'VIDEO' | 'IMAGE' | 'GIF'
  description: string
  moduleId: string
  duration: string
}

export interface QuizQuestion {
  q: string
  options: string[]
  correct: number
}

export interface DashboardUser {
  name: string
  initials: string
  club: string
}
```

- [ ] **Step 3: Port the shared UI primitives**

Create `rails/app/frontend/components/ui.tsx`:

```tsx
import { Link } from '@inertiajs/react'
import type { ReactNode } from 'react'
import type { Exercise, ModuleStatus } from '../types/dashboard-data'

export function ProgressBar({ value, tone = 'light' }: { value: number; tone?: 'light' | 'dark' }) {
  return (
    <div className={'h-1 w-full overflow-hidden rounded-full ' + (tone === 'dark' ? 'bg-paper/15' : 'bg-[#E9EDE9]')}>
      <div className={'h-full ' + (tone === 'dark' ? 'bg-teal' : 'bg-teal-deep')} style={{ width: value + '%' }} />
    </div>
  )
}

export function StatusBadge({ status }: { status: ModuleStatus }) {
  const map = {
    done: 'bg-teal-deep text-paper border-teal-deep',
    current: 'text-teal-deep border-[#B9D9CB]',
    locked: 'text-[#A3B0B7] border-line',
  } as const
  const label = { done: 'Done', current: 'Active', locked: 'Locked' }[status]
  return (
    <span className={'whitespace-nowrap rounded-full border px-2 py-1 font-dash-mono text-[10px] uppercase tracking-[0.08em] ' + map[status]}>
      {label}
    </span>
  )
}

export function Topic({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-mist px-2 py-1 text-xs text-ink">{children}</span>
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">{children}</span>
}

export function MediaPlaceholder({
  label,
  reference,
  className = '',
  tone = 'light',
}: {
  label: string
  reference?: string
  className?: string
  tone?: 'light' | 'dark'
}) {
  const stripes =
    tone === 'dark'
      ? 'repeating-linear-gradient(135deg, rgba(247,248,246,0.07) 0 8px, transparent 8px 16px)'
      : 'repeating-linear-gradient(135deg, rgba(18,40,63,0.07) 0 6px, transparent 6px 12px)'
  return (
    <div
      className={'flex items-end justify-between p-2.5 ' + (tone === 'dark' ? 'bg-ink' : 'bg-[#E7EBE7]') + ' ' + className}
      style={{ backgroundImage: stripes }}
    >
      <span className={'font-dash-mono text-[10px] tracking-[0.08em] ' + (tone === 'dark' ? 'text-ink-mute' : 'text-muted')}>
        {label}
      </span>
      {reference ? (
        <span className={'font-dash-mono text-[10px] ' + (tone === 'dark' ? 'text-ink-mute' : 'text-muted')}>
          {reference}
        </span>
      ) : null}
    </div>
  )
}

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      href={'/dashboard/exercises/' + exercise.ref}
      className="overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-teal"
    >
      <MediaPlaceholder label={exercise.media} reference={exercise.ref} className="h-24 lg:h-[140px]" />
      <div className="flex flex-col gap-1 px-3 pb-3 pt-2.5 lg:px-4 lg:pb-4">
        <div className="text-sm font-semibold leading-tight text-ink lg:text-[15px]">{exercise.title}</div>
        <div className="text-[11px] text-muted lg:text-xs">{exercise.category}</div>
      </div>
    </Link>
  )
}

export function CategoryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {['All', 'Technical', 'Tactical'].map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={
            'rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ' +
            (value === c ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-[#56666F] hover:border-teal')
          }
        >
          {c}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Port the app shell**

Create `rails/app/frontend/components/shell.tsx`:

```tsx
import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import type { DashboardUser } from '../types/dashboard-data'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', tab: 'Home' },
  { href: '/dashboard/courses', label: 'Courses', tab: 'Courses' },
  { href: '/dashboard/exercises', label: 'Exercises', tab: 'Exercises' },
  { href: '/dashboard/plan', label: 'Weekly plan', tab: 'Plan' },
  { href: '/dashboard/profile', label: 'Profile', tab: 'Profile' },
]

const isActive = (pathname: string, href: string) =>
  href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

function Sidebar() {
  const { url, props } = usePage<{ dashboardUser: DashboardUser }>()
  const { dashboardUser } = props

  return (
    <aside className="hidden lg:flex w-[248px] shrink-0 flex-col gap-8 bg-ink px-5 py-7">
      <img
        src="/fran-methodology-logo.png"
        alt="Fran Methodology"
        className="h-10 w-auto brightness-0 invert opacity-95"
      />
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              'rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ' +
              (isActive(url, item.href) ? 'bg-teal/15 text-paper' : 'text-ink-mute hover:text-paper')
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-paper/10 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[13px] font-bold text-ink">
          {dashboardUser.initials}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-paper">{dashboardUser.name}</div>
          <div className="text-[11px] text-muted">{dashboardUser.club}</div>
        </div>
      </div>
    </aside>
  )
}

function BottomTabs() {
  const { url } = usePage()
  const tabs = NAV.filter((n) => n.href !== '/dashboard/plan')
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white px-5 pb-7 pt-2.5 lg:hidden">
      {tabs.map((item) => {
        const on = isActive(url, item.href)
        return (
          <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center gap-1.5">
            <span className={'h-[18px] w-[18px] rounded-[5px] ' + (on ? 'bg-ink' : 'bg-[#C9D2CD]')} />
            <span className={'text-[11px] font-semibold ' + (on ? 'text-ink' : 'text-[#C9D2CD]')}>{item.tab}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper font-dash-sans">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-28 lg:pb-0">{children}</main>
      <BottomTabs />
    </div>
  )
}

export function PageHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        {eyebrow ? (
          <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">{eyebrow}</div>
        ) : null}
        <h1 className="mt-1.5 text-[27px] font-bold tracking-[-0.02em] text-ink lg:text-[34px] lg:tracking-[-0.025em]">
          {title}
        </h1>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add the dashboardUser share and real props to DashboardController**

Edit `rails/app/controllers/dashboard_controller.rb`:

```ruby
class DashboardController < ApplicationController
  before_action :authenticate_user!

  inertia_share do
    { dashboardUser: DashboardData::USER }
  end

  def index
    render inertia: "Dashboard/Home", props: {
      courseStats: DashboardData::COURSE_STATS,
      modules: DashboardData::MODULES
    }
  end
end
```

- [ ] **Step 6: Port the Dashboard Home page**

Replace `rails/app/frontend/pages/Dashboard/Home.tsx`:

```tsx
import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { Eyebrow, ProgressBar, Topic } from '../../components/ui'
import { AppShell, PageHeader } from '../../components/shell'
import type { DashboardUser, Module } from '../../types/dashboard-data'

interface CourseStats {
  progress: number
  modulesDone: number
  modulesTotal: number
  exercisesDone: number
  averageQuiz: number
}

interface Props {
  courseStats: CourseStats
  modules: Module[]
  dashboardUser: DashboardUser
}

const WEEK = [
  { day: 'MON', state: 'done' },
  { day: 'TUE', state: 'empty' },
  { day: 'WED', state: 'today' },
  { day: 'THU', state: 'planned' },
  { day: 'FRI', state: 'empty' },
  { day: 'SAT', state: 'empty' },
] as const

function Home() {
  const { courseStats, modules, dashboardUser } = usePage<Props>().props
  const current = modules.find((m) => m.status === 'current')!

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-7">
        <div className="flex items-center justify-between lg:hidden">
          <img src="/fran-methodology-logo.png" alt="Fran Methodology" className="h-[34px] w-auto" />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper">
            {dashboardUser.initials}
          </div>
        </div>

        <PageHeader eyebrow="Beginner course" title={'Good afternoon, ' + dashboardUser.name.split(' ')[0]} />

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
          <div className="flex flex-col gap-4 rounded-[18px] bg-ink p-5 text-paper lg:p-6">
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute">
              Course progress
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-[38px] font-extrabold tracking-[-0.03em] lg:text-[44px]">
                {courseStats.progress}%
              </span>
              <span className="text-sm text-ink-mute">
                {courseStats.modulesDone} of {courseStats.modulesTotal} modules complete
              </span>
            </div>
            <ProgressBar value={courseStats.progress} tone="dark" />
          </div>
          <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-white p-5 lg:p-6">
            <span className="text-[34px] font-bold text-ink">{courseStats.exercisesDone}</span>
            <span className="text-[13px] text-muted">Exercises completed</span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-white p-5 lg:p-6">
            <span className="text-[34px] font-bold text-ink">{courseStats.averageQuiz}%</span>
            <span className="text-[13px] text-muted">Average quiz score</span>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-3">
            <Eyebrow>Continue where you left off</Eyebrow>
            <Link
              href={'/dashboard/courses/' + current.id}
              className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-white p-[18px] transition-colors hover:border-teal"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-ink">{current.title}</div>
                  <div className="mt-0.5 text-sm text-[#56666F]">{current.description}</div>
                </div>
                <span className="whitespace-nowrap rounded-full border border-[#B9D9CB] px-2 py-1 font-dash-mono text-[10px] uppercase tracking-[0.08em] text-teal-deep">
                  In progress
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {current.topics.map((t) => (
                  <Topic key={t}>{t}</Topic>
                ))}
              </div>
              <ProgressBar value={current.progress} />
            </Link>

            <div className="mt-3 flex flex-col gap-3">
              <Eyebrow>Modules</Eyebrow>
              {modules.slice(0, 5).map((m) => (
                <Link
                  key={m.id}
                  href={'/dashboard/courses/' + m.id}
                  className="flex items-center gap-4 rounded-[14px] border border-line bg-white px-4 py-4 transition-colors hover:border-teal"
                >
                  <span className="hidden min-w-[96px] font-dash-mono text-[11px] uppercase tracking-[0.08em] text-muted lg:inline">
                    {m.title}
                  </span>
                  <span className="flex-1 text-[15px] font-semibold text-ink">{m.description}</span>
                  <span className="hidden w-[120px] lg:block">
                    <ProgressBar value={m.progress} />
                  </span>
                  <span className="hidden w-[84px] text-right font-dash-mono text-[11px] text-muted lg:block">
                    {m.duration}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <Eyebrow>This week</Eyebrow>
              <Link href="/dashboard/plan" className="text-[13px] font-semibold">
                Plan
              </Link>
            </div>
            <div className="flex gap-1.5 lg:hidden">
              {WEEK.map((d) => (
                <div
                  key={d.day}
                  className={
                    'flex-1 rounded-xl border py-2.5 text-center ' +
                    (d.state === 'today' ? 'border-ink bg-ink' : 'border-line bg-white')
                  }
                >
                  <div className={'font-dash-mono text-[10px] ' + (d.state === 'today' ? 'text-ink-mute' : 'text-muted')}>
                    {d.day}
                  </div>
                  <div
                    className={
                      'mx-auto mt-2 h-[7px] w-[7px] rounded-full ' +
                      (d.state === 'empty' ? 'bg-line' : d.state === 'today' ? 'bg-teal' : 'bg-teal-deep')
                    }
                  />
                </div>
              ))}
            </div>
            <div className="hidden flex-col gap-3.5 rounded-[18px] border border-line bg-white p-[18px] lg:flex">
              {[
                ['Monday', 'Slice serve, elbow above 90º · Technical'],
                ['Wednesday', 'Traffic light stop drill · Technical'],
                ['Thursday', 'Glass exit, dominant side · Tactical'],
              ].map(([day, item]) => (
                <div key={day} className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-ink">{day}</span>
                  <div className="rounded-[10px] border border-dashed border-[#C9D2CD] px-3 py-2.5 text-[13px] text-[#3B4B54]">
                    {item}
                  </div>
                </div>
              ))}
              <Link
                href="/dashboard/plan"
                className="rounded-[10px] border border-dashed border-line px-3 py-3.5 text-center text-xs text-[#A3B0B7]"
              >
                Drag an exercise here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

Home.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Home
```

- [ ] **Step 7: Update the dashboard request spec**

Edit `rails/spec/requests/dashboard_spec.rb`, updating the authenticated-user assertion:

```ruby
require "rails_helper"

RSpec.describe "Dashboard", type: :request do
  it "redirects an unauthenticated visitor to the login page" do
    get "/dashboard"
    expect(response).to redirect_to(new_user_session_path)
  end

  it "renders the real dashboard home for an authenticated user" do
    user = create(:user)
    sign_in user
    get "/dashboard"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Dashboard/Home"')
  end
end
```

- [ ] **Step 8: Run the spec**

```bash
cd rails && bundle exec rspec spec/requests/dashboard_spec.rb
```

Expected: PASS, 2 examples.

- [ ] **Step 9: Manually verify visually**

```bash
bin/dev
```

Log in as `client@example.com` / `password123`, confirm the dashboard home renders with the stats banner, "Continue where you left off" module card, module list, and week strip, styled per the design tokens. Stop `bin/dev`.

- [ ] **Step 10: Commit**

```bash
git add rails/app/frontend/types rails/app/frontend/components rails/public/fran-methodology-logo.png \
  rails/app/controllers/dashboard_controller.rb rails/app/frontend/pages/Dashboard/Home.tsx \
  rails/spec/requests/dashboard_spec.rb
git commit -m "Port shared shell/UI components and the real dashboard home page"
```

---

### Task 4: Port Courses Index and Show pages

**Files:**
- Create: `rails/app/controllers/courses_controller.rb`
- Create: `rails/app/frontend/pages/Courses/Index.tsx`, `rails/app/frontend/pages/Courses/Show.tsx`
- Modify: `rails/config/routes.rb`
- Test: `rails/spec/requests/courses_spec.rb`

**Interfaces:**
- Consumes: `DashboardData::MODULES`, `DashboardData::MODULE_1_SECTIONS`, `DashboardData::EXERCISES`, `DashboardData.find_module` (Task 1); `AppShell`, `PageHeader`, `ProgressBar`, `StatusBadge`, `Topic`, `Eyebrow`, shared `Module`/`ContentSection`/`Exercise` types, the `Page.layout` convention (Task 3).
- Produces: `courses_path`-equivalent routes (`/dashboard/courses`, `/dashboard/courses/:id`) that Task 5 (quiz) and Task 6 (exercises) link to.

- [ ] **Step 1: Write the failing request specs**

Create `rails/spec/requests/courses_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Courses", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it "renders the courses index" do
    get "/dashboard/courses"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Courses/Index"')
  end

  it "renders a course detail page" do
    get "/dashboard/courses/module-1"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Courses/Show"')
  end

  it "404s for an unknown module id" do
    get "/dashboard/courses/nope"
    expect(response).to have_http_status(:not_found)
  end
end
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd rails && bundle exec rspec spec/requests/courses_spec.rb
```

Expected: FAIL — no route matches `/dashboard/courses`.

- [ ] **Step 3: Add the CoursesController**

Create `rails/app/controllers/courses_controller.rb`:

```ruby
class CoursesController < DashboardController
  def index
    render inertia: "Courses/Index", props: { modules: DashboardData::MODULES }
  end

  def show
    course_module = DashboardData.find_module(params[:id])
    return head :not_found unless course_module

    sections = course_module[:sections] || DashboardData::MODULE_1_SECTIONS
    exercises = DashboardData::EXERCISES.select { |e| e[:moduleId] == course_module[:id] }

    render inertia: "Courses/Show", props: {
      courseModule: course_module,
      sections: sections,
      exercises: exercises
    }
  end
end
```

- [ ] **Step 4: Port the Courses Index page**

Create `rails/app/frontend/pages/Courses/Index.tsx`:

```tsx
import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { ProgressBar, StatusBadge, Topic } from '../../components/ui'
import { AppShell, PageHeader } from '../../components/shell'
import type { Module } from '../../types/dashboard-data'

interface Props {
  modules: Module[]
}

const LEVELS = [
  { name: 'Beginner', meta: '8 modules · 31% complete', active: true },
  { name: 'Intermediate', meta: 'Locked · finish Beginner first', active: false },
  { name: 'Advanced', meta: 'Locked', active: false },
]

function Index() {
  const { modules } = usePage<Props>().props

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
        <PageHeader eyebrow="Beginner course · 8 modules" title="Courses" />

        <div className="grid gap-2 lg:grid-cols-3 lg:gap-4">
          {LEVELS.map((l) => (
            <div
              key={l.name}
              className={
                'rounded-[18px] p-4 lg:p-[22px] ' +
                (l.active ? 'bg-ink text-paper' : 'border border-line bg-white text-[#A3B0B7]')
              }
            >
              <div className="text-sm font-bold lg:text-lg">{l.name}</div>
              <div className={'mt-1 text-[11px] lg:text-[13px] ' + (l.active ? 'text-ink-mute' : '')}>
                {l.meta}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          {modules.map((m) => (
            <Link
              key={m.id}
              href={'/dashboard/courses/' + m.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-teal lg:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-ink lg:text-[17px]">{m.title}</div>
                  <div className="mt-1 text-[13px] text-[#56666F] lg:text-sm">{m.description}</div>
                </div>
                <StatusBadge status={m.status} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {m.topics.map((t) => (
                  <Topic key={t}>{t}</Topic>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <ProgressBar value={m.progress} />
                <span className="whitespace-nowrap font-dash-mono text-[11px] text-muted">{m.duration}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
```

- [ ] **Step 5: Port the Courses Show page**

Create `rails/app/frontend/pages/Courses/Show.tsx`:

```tsx
import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { Eyebrow } from '../../components/ui'
import { AppShell } from '../../components/shell'
import type { ContentSection, Exercise, Module } from '../../types/dashboard-data'

interface Props {
  courseModule: Module
  sections: ContentSection[]
  exercises: Exercise[]
}

const MATERIALS = [
  { kind: 'PDF', name: 'Game Initiation Model — slides', meta: '4.2 MB' },
  { kind: 'MP4', name: 'Slice serve — court demo', meta: '6:12' },
]

function Show() {
  const { courseModule, sections, exercises } = usePage<Props>().props

  return (
    <div>
      <div className="bg-ink px-5 pb-6 pt-6 text-paper lg:px-10 lg:pb-10 lg:pt-9">
        <div className="mx-auto flex max-w-[880px] flex-col gap-3.5">
          <Link href="/dashboard/courses" className="text-[13px] text-ink-mute hover:text-paper">
            ← Beginner course
          </Link>
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-teal">
              {courseModule.title}
            </div>
            <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.02em] lg:text-[38px]">
              {courseModule.description}
            </h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {courseModule.topics.map((t) => (
              <span key={t} className="rounded-md bg-paper/10 px-2 py-1 text-xs">
                {t}
              </span>
            ))}
          </div>
          <div className="flex gap-5 text-xs text-ink-mute">
            <span>{courseModule.duration}</span>
            <span>{MATERIALS.length} documents</span>
            <span>{exercises.length} exercises</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-[880px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Eyebrow>Materials</Eyebrow>
            {MATERIALS.map((doc) => (
              <div key={doc.name} className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3">
                <span className="font-dash-mono text-[10px] font-semibold text-teal-deep">{doc.kind}</span>
                <span className="flex-1 text-sm text-ink">{doc.name}</span>
                <span className="text-xs text-muted">{doc.meta}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            {sections.map((s) => (
              <section key={s.heading} className="flex flex-col gap-2">
                <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink lg:text-xl">{s.heading}</h2>
                <ul className="flex flex-col gap-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-2 h-[5px] w-[5px] shrink-0 rounded-full bg-teal" />
                      <span className="text-sm leading-relaxed text-[#3B4B54]">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <Link
            href="/dashboard/exercises"
            className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 transition-colors hover:border-teal"
          >
            <span>
              <span className="block text-[15px] font-bold text-ink">Module exercises</span>
              <span className="mt-0.5 block text-[13px] text-muted">{exercises.length} drills · 2 completed</span>
            </span>
            <span className="text-lg text-teal-deep">→</span>
          </Link>

          <div className="flex flex-col gap-3 rounded-2xl bg-mist p-[18px]">
            <div>
              <div className="text-[15px] font-bold text-ink">Knowledge check</div>
              <div className="mt-0.5 text-[13px] text-[#56666F]">4 questions · unlocks module completion</div>
            </div>
            <Link
              href={'/dashboard/courses/' + courseModule.id + '/quiz'}
              className="rounded-full bg-ink py-3.5 text-center text-[15px] font-semibold text-paper"
            >
              Start knowledge check
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

- [ ] **Step 6: Add the routes**

Edit `rails/config/routes.rb`, adding inside `Rails.application.routes.draw do` (alongside the existing `/dashboard` route):

```ruby
  get "/dashboard/courses", to: "courses#index"
  get "/dashboard/courses/:id", to: "courses#show"
```

- [ ] **Step 7: Run the specs to confirm they pass**

```bash
cd rails && bundle exec rspec spec/requests/courses_spec.rb
```

Expected: PASS, 3 examples.

- [ ] **Step 8: Commit**

```bash
git add rails/app/controllers/courses_controller.rb rails/app/frontend/pages/Courses/Index.tsx \
  rails/app/frontend/pages/Courses/Show.tsx rails/config/routes.rb rails/spec/requests/courses_spec.rb
git commit -m "Port Courses Index and Show pages"
```

---

### Task 5: Port the Quiz page

**Files:**
- Modify: `rails/app/controllers/courses_controller.rb`
- Create: `rails/app/frontend/pages/Courses/Quiz.tsx`
- Modify: `rails/config/routes.rb`
- Test: `rails/spec/requests/courses_quiz_spec.rb`

**Interfaces:**
- Consumes: `DashboardData::QUIZ`, `DashboardData.find_module` (Task 1); `AppShell`, shared `QuizQuestion` type, `Page.layout` convention (Task 3); `CoursesController` (Task 4).
- Produces: `/dashboard/courses/:id/quiz` route. No later task depends on this one.

- [ ] **Step 1: Write the failing request spec**

Create `rails/spec/requests/courses_quiz_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Courses::Quiz", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it "renders the quiz page" do
    get "/dashboard/courses/module-1/quiz"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Courses/Quiz"')
  end

  it "404s for an unknown module id" do
    get "/dashboard/courses/nope/quiz"
    expect(response).to have_http_status(:not_found)
  end
end
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd rails && bundle exec rspec spec/requests/courses_quiz_spec.rb
```

Expected: FAIL — no route matches `/dashboard/courses/module-1/quiz`.

- [ ] **Step 3: Add the quiz action**

Edit `rails/app/controllers/courses_controller.rb`, adding after `show`:

```ruby
  def quiz
    course_module = DashboardData.find_module(params[:id])
    return head :not_found unless course_module

    render inertia: "Courses/Quiz", props: {
      id: course_module[:id],
      quiz: DashboardData::QUIZ
    }
  end
```

- [ ] **Step 4: Port the Quiz page**

Create `rails/app/frontend/pages/Courses/Quiz.tsx`:

```tsx
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { AppShell } from '../../components/shell'
import type { QuizQuestion } from '../../types/dashboard-data'

interface Props {
  id: string
  quiz: QuizQuestion[]
}

function Quiz() {
  const { id, quiz } = usePage<Props>().props
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = useMemo(
    () => quiz.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0),
    [answers, quiz],
  )
  const passed = score / quiz.length >= 0.75
  const question = quiz[index]
  const picked = answers[index]

  const reset = () => {
    setAnswers({})
    setIndex(0)
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-[720px] flex-col gap-5">
          <div className="flex flex-col gap-2 rounded-[18px] bg-ink p-6 text-paper">
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute">
              Knowledge check
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-[46px] font-extrabold tracking-[-0.03em]">
                {Math.round((score / quiz.length) * 100)}%
              </span>
              <span className="text-[15px] text-ink-mute">
                {score} / {quiz.length} correct
              </span>
            </div>
            <span className={'text-sm ' + (passed ? 'text-teal' : 'text-[#E2A87A]')}>
              {passed ? 'Passed — module marked complete.' : 'Below 75% — review the material and try again.'}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {quiz.map((q, i) => {
              const right = answers[i] === q.correct
              return (
                <div key={q.q} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-white px-4 py-3.5">
                  <div className="text-sm font-semibold leading-snug text-ink">{q.q}</div>
                  {right ? (
                    <div className="text-[13px] text-teal-deep">✓ {q.options[answers[i]]}</div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="text-[13px] text-danger">✗ {q.options[answers[i]] ?? 'Not answered'}</div>
                      <div className="text-[13px] text-muted">Correct: {q.options[q.correct]}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={reset}
              className="flex-1 rounded-full border border-line bg-white py-3.5 text-[15px] font-semibold text-ink"
            >
              Retake
            </button>
            <Link
              href="/dashboard/courses"
              className="flex-1 rounded-full bg-ink py-3.5 text-center text-[15px] font-semibold text-paper"
            >
              Next module
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 py-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            {index === 0 ? (
              <Link href={'/dashboard/courses/' + id} className="text-[13px] text-muted">
                ← Back
              </Link>
            ) : (
              <button type="button" onClick={() => setIndex(index - 1)} className="text-[13px] text-muted">
                ← Back
              </button>
            )}
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              Question {index + 1} of {quiz.length}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#E9EDE9]">
            <div className="h-full bg-teal-deep transition-all" style={{ width: ((index + 1) / quiz.length) * 100 + '%' }} />
          </div>
        </div>

        <h1 className="text-[23px] font-bold leading-tight tracking-[-0.02em] text-ink lg:text-[28px]">
          {question.q}
        </h1>

        <div className="flex flex-col gap-2.5">
          {question.options.map((option, i) => {
            const on = picked === i
            return (
              <button
                key={option}
                type="button"
                onClick={() => setAnswers({ ...answers, [index]: i })}
                className={
                  'flex items-start gap-3 rounded-[14px] border px-4 py-4 text-left transition-colors ' +
                  (on ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-ink hover:border-teal')
                }
              >
                <span className={'pt-0.5 font-dash-mono text-xs ' + (on ? 'text-teal' : 'text-muted')}>
                  {'ABC'[i]}
                </span>
                <span className="text-[15px] leading-snug">{option}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={picked === undefined}
          onClick={() => (index === quiz.length - 1 ? setSubmitted(true) : setIndex(index + 1))}
          className={
            'rounded-full py-3.5 text-[15px] font-semibold ' +
            (picked === undefined ? 'bg-[#E9EDE9] text-[#A3B0B7]' : 'bg-ink text-paper')
          }
        >
          {picked === undefined ? 'Select an answer' : index === quiz.length - 1 ? 'Submit' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

Quiz.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Quiz
```

- [ ] **Step 5: Add the route**

Edit `rails/config/routes.rb`, adding after the courses routes:

```ruby
  get "/dashboard/courses/:id/quiz", to: "courses#quiz"
```

- [ ] **Step 6: Run the specs**

```bash
cd rails && bundle exec rspec spec/requests/courses_quiz_spec.rb
```

Expected: PASS, 2 examples.

- [ ] **Step 7: Manually verify the quiz flow**

```bash
bin/dev
```

Log in, navigate to a module, start the knowledge check, answer all 4 questions, submit, confirm the score/pass-fail message and per-question review render correctly, then retake. Stop `bin/dev`.

- [ ] **Step 8: Commit**

```bash
git add rails/app/controllers/courses_controller.rb rails/app/frontend/pages/Courses/Quiz.tsx \
  rails/config/routes.rb rails/spec/requests/courses_quiz_spec.rb
git commit -m "Port the knowledge-check quiz page"
```

---

### Task 6: Port Exercises Index and Show pages

**Files:**
- Create: `rails/app/controllers/exercises_controller.rb`
- Create: `rails/app/frontend/pages/Exercises/Index.tsx`, `rails/app/frontend/pages/Exercises/Show.tsx`
- Modify: `rails/config/routes.rb`
- Test: `rails/spec/requests/exercises_spec.rb`

**Interfaces:**
- Consumes: `DashboardData::EXERCISES`, `DashboardData.find_exercise`, `DashboardData.find_module` (Task 1); `AppShell`, `PageHeader`, `CategoryFilter`, `ExerciseCard`, `MediaPlaceholder`, `Topic`, shared `Exercise`/`Module` types (Task 3).
- Produces: `/dashboard/exercises`, `/dashboard/exercises/:ref` routes that `ExerciseCard` (Task 3) and the Plan page (Task 7) implicitly link to via `href`.

- [ ] **Step 1: Write the failing request specs**

Create `rails/spec/requests/exercises_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Exercises", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it "renders the exercises index" do
    get "/dashboard/exercises"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Exercises/Index"')
  end

  it "renders an exercise detail page" do
    get "/dashboard/exercises/EX-01"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Exercises/Show"')
  end

  it "404s for an unknown exercise ref" do
    get "/dashboard/exercises/nope"
    expect(response).to have_http_status(:not_found)
  end
end
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd rails && bundle exec rspec spec/requests/exercises_spec.rb
```

Expected: FAIL — no route matches `/dashboard/exercises`.

- [ ] **Step 3: Add the ExercisesController**

Create `rails/app/controllers/exercises_controller.rb`:

```ruby
class ExercisesController < DashboardController
  def index
    render inertia: "Exercises/Index", props: { exercises: DashboardData::EXERCISES }
  end

  def show
    exercise = DashboardData.find_exercise(params[:ref])
    return head :not_found unless exercise

    course_module = DashboardData.find_module(exercise[:moduleId])

    render inertia: "Exercises/Show", props: {
      exercise: exercise,
      courseModule: course_module
    }
  end
end
```

- [ ] **Step 4: Port the Exercises Index page**

Create `rails/app/frontend/pages/Exercises/Index.tsx`:

```tsx
import { useState } from 'react'
import type { ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { CategoryFilter, ExerciseCard } from '../../components/ui'
import { AppShell, PageHeader } from '../../components/shell'
import type { Exercise } from '../../types/dashboard-data'

interface Props {
  exercises: Exercise[]
}

function Index() {
  const { exercises } = usePage<Props>().props
  const [category, setCategory] = useState('All')
  const list = category === 'All' ? exercises : exercises.filter((e) => e.category === category)

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader eyebrow="Library" title="Exercises" />
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {list.map((e) => (
            <ExerciseCard key={e.ref} exercise={e} />
          ))}
        </div>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
```

- [ ] **Step 5: Port the Exercises Show page**

Create `rails/app/frontend/pages/Exercises/Show.tsx`:

```tsx
import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { MediaPlaceholder, Topic } from '../../components/ui'
import { AppShell } from '../../components/shell'
import type { Exercise, Module } from '../../types/dashboard-data'

interface Props {
  exercise: Exercise
  courseModule: Module | null
}

function Show() {
  const { exercise, courseModule } = usePage<Props>().props

  return (
    <div>
      <div className="relative">
        <MediaPlaceholder
          label={exercise.media + ' · full-screen media placeholder'}
          tone="dark"
          className="h-[300px] lg:h-[460px]"
        />
        <Link
          href="/dashboard/exercises"
          className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1.5 text-[13px] text-paper"
        >
          ← Back
        </Link>
      </div>

      <div className="px-5 py-5 lg:px-10 lg:py-8">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {exercise.category} · {exercise.ref}
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.02em] text-ink lg:text-[32px]">
              {exercise.title}
            </h1>
          </div>
          <p className="text-[15px] leading-relaxed text-[#3B4B54]">{exercise.description}</p>
          <div className="flex gap-2">
            <Topic>{courseModule?.title ?? 'Module'}</Topic>
            <Topic>{exercise.duration}</Topic>
          </div>
          <div className="mt-2 flex gap-2.5">
            <button type="button" className="flex-1 rounded-full bg-ink py-3.5 text-[15px] font-semibold text-paper">
              Mark complete
            </button>
            <Link
              href="/dashboard/plan"
              className="rounded-full border border-line bg-white px-5 py-3.5 text-[15px] font-semibold text-ink"
            >
              Add to plan
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

- [ ] **Step 6: Add the routes**

Edit `rails/config/routes.rb`, adding after the courses routes:

```ruby
  get "/dashboard/exercises", to: "exercises#index"
  get "/dashboard/exercises/:ref", to: "exercises#show"
```

- [ ] **Step 7: Run the specs**

```bash
cd rails && bundle exec rspec spec/requests/exercises_spec.rb
```

Expected: PASS, 3 examples.

- [ ] **Step 8: Commit**

```bash
git add rails/app/controllers/exercises_controller.rb rails/app/frontend/pages/Exercises/Index.tsx \
  rails/app/frontend/pages/Exercises/Show.tsx rails/config/routes.rb rails/spec/requests/exercises_spec.rb
git commit -m "Port Exercises Index and Show pages"
```

---

### Task 7: Port the Weekly Plan page

**Files:**
- Create: `rails/app/controllers/plan_controller.rb`
- Create: `rails/app/frontend/pages/Plan/Index.tsx`
- Modify: `rails/config/routes.rb`
- Test: `rails/spec/requests/plan_spec.rb`

**Interfaces:**
- Consumes: `DashboardData::DAYS`, `DashboardData::SHORT_DAY`, `DashboardData::DEFAULT_PLAN`, `DashboardData::EXERCISES` (Task 1); `AppShell`, `PageHeader`, `Page.layout` convention (Task 3).
- Produces: `/dashboard/plan` route that the exercise detail page's "Add to plan" link (Task 6) points to (already wired — no change needed there since it's a plain path string).

- [ ] **Step 1: Write the failing request spec**

Create `rails/spec/requests/plan_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Plan", type: :request do
  let(:user) { create(:user) }

  before { sign_in user }

  it "renders the weekly plan page" do
    get "/dashboard/plan"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Plan/Index"')
  end
end
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd rails && bundle exec rspec spec/requests/plan_spec.rb
```

Expected: FAIL — no route matches `/dashboard/plan`.

- [ ] **Step 3: Add the PlanController**

Create `rails/app/controllers/plan_controller.rb`:

```ruby
class PlanController < DashboardController
  def index
    render inertia: "Plan/Index", props: {
      days: DashboardData::DAYS,
      shortDay: DashboardData::SHORT_DAY,
      defaultPlan: DashboardData::DEFAULT_PLAN,
      exercises: DashboardData::EXERCISES
    }
  end
end
```

- [ ] **Step 4: Port the Plan page**

Create `rails/app/frontend/pages/Plan/Index.tsx`:

```tsx
import { useState } from 'react'
import type { ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { AppShell, PageHeader } from '../../components/shell'
import type { Exercise } from '../../types/dashboard-data'

interface Props {
  days: string[]
  shortDay: Record<string, string>
  defaultPlan: Record<string, string[]>
  exercises: Exercise[]
}

function Index() {
  const { days, shortDay, defaultPlan, exercises } = usePage<Props>().props
  const [plan, setPlan] = useState<Record<string, string[]>>(defaultPlan)
  const [dragging, setDragging] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)

  const getExercise = (ref: string) => exercises.find((e) => e.ref === ref)

  const add = (day: string, ref: string | null) => {
    if (!ref || plan[day].includes(ref)) return
    setPlan({ ...plan, [day]: [...plan[day], ref] })
  }

  const remove = (day: string, ref: string) => setPlan({ ...plan, [day]: plan[day].filter((r) => r !== ref) })

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <PageHeader eyebrow="Drag exercises into a day" title="Weekly plan" />
        <p className="text-[13px] text-muted lg:hidden">
          {picked ? 'Now tap a day to add it' : 'Tap an exercise, then a day'}
        </p>

        {/* Mobile: tap-to-assign tray */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
          {exercises.map((e) => (
            <button
              key={e.ref}
              type="button"
              onClick={() => setPicked(picked === e.ref ? null : e.ref)}
              className={
                'whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold ' +
                (picked === e.ref ? 'border-teal-deep bg-teal-deep text-paper' : 'border-line bg-white text-[#56666F]')
              }
            >
              {e.title}
            </button>
          ))}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">
          {/* Desktop: draggable library */}
          <div className="hidden flex-col gap-2 rounded-2xl border border-line bg-white p-4 lg:flex">
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              Exercise library
            </span>
            {exercises.map((e) => (
              <div
                key={e.ref}
                draggable
                onDragStart={() => setDragging(e.ref)}
                onDragEnd={() => setDragging(null)}
                className="cursor-grab rounded-[10px] border border-line px-3 py-2.5 text-[13px] text-ink hover:border-teal hover:bg-paper"
              >
                {e.title}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 lg:grid lg:grid-cols-7 lg:gap-2.5">
            {days.map((day) => (
              <div
                key={day}
                onClick={() => {
                  add(day, picked)
                  setPicked(null)
                }}
                onDragOver={(ev) => ev.preventDefault()}
                onDrop={(ev) => {
                  ev.preventDefault()
                  add(day, dragging)
                  setDragging(null)
                }}
                className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-3 lg:min-h-[320px]"
              >
                <span className="font-dash-mono text-[10px] tracking-[0.1em] text-muted">{shortDay[day]}</span>
                {plan[day].map((ref) => {
                  const e = getExercise(ref)
                  return (
                    <button
                      key={ref}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        remove(day, ref)
                      }}
                      className="flex items-center justify-between gap-2 rounded-[10px] bg-mist p-2.5 text-left text-xs leading-snug text-ink"
                    >
                      <span>{e?.title ?? ref}</span>
                      <span className="text-muted">×</span>
                    </button>
                  )
                })}
                {plan[day].length === 0 ? (
                  <div className="rounded-[10px] border border-dashed border-line px-2 py-4 text-center text-[11px] text-[#B7C0BA]">
                    Drop here
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
```

- [ ] **Step 5: Add the route**

Edit `rails/config/routes.rb`, adding after the exercises routes:

```ruby
  get "/dashboard/plan", to: "plan#index"
```

- [ ] **Step 6: Run the spec**

```bash
cd rails && bundle exec rspec spec/requests/plan_spec.rb
```

Expected: PASS, 1 example.

- [ ] **Step 7: Manually verify drag-and-drop and tap-to-assign**

```bash
bin/dev
```

On a desktop-width viewport, drag an exercise from the library onto a day and confirm it's added; click it again to remove it. On a mobile-width viewport, tap an exercise then tap a day, confirm the same. Stop `bin/dev`.

- [ ] **Step 8: Commit**

```bash
git add rails/app/controllers/plan_controller.rb rails/app/frontend/pages/Plan/Index.tsx \
  rails/config/routes.rb rails/spec/requests/plan_spec.rb
git commit -m "Port the weekly plan page"
```

---

### Task 8: Port the Profile page

**Files:**
- Create: `rails/app/controllers/profile_controller.rb`
- Create: `rails/app/frontend/pages/Profile/Show.tsx`
- Modify: `rails/config/routes.rb`
- Test: `rails/spec/requests/profile_spec.rb`

**Interfaces:**
- Consumes: `DashboardData::USER` (Task 1); `AppShell`, `Page.layout` convention (Task 3); `current_user.email`/`current_user.role` and `sessions#destroy` (`/users/sign_out`) from the auth foundation spec.
- Produces: nothing further — this is the last page in the port.

- [ ] **Step 1: Write the failing request spec**

Create `rails/spec/requests/profile_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Profile", type: :request do
  let(:user) { create(:user, email: "test@example.com") }

  before { sign_in user }

  it "renders the profile page with real email and role, mock everything else" do
    get "/dashboard/profile"
    expect(response).to have_http_status(200)
    expect(response.body).to include('"component":"Profile/Show"')
    expect(response.body).to include("test@example.com")
    expect(response.body).to include(user.role)
  end
end
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd rails && bundle exec rspec spec/requests/profile_spec.rb
```

Expected: FAIL — no route matches `/dashboard/profile`.

- [ ] **Step 3: Add the ProfileController**

Create `rails/app/controllers/profile_controller.rb`:

```ruby
class ProfileController < DashboardController
  def index
    render inertia: "Profile/Show", props: {
      profile: DashboardData::USER.merge(
        email: current_user.email,
        role: current_user.role
      )
    }
  end
end
```

- [ ] **Step 4: Port the Profile page**

Create `rails/app/frontend/pages/Profile/Show.tsx`:

```tsx
import { router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AppShell } from '../../components/shell'

interface Profile {
  name: string
  initials: string
  email: string
  role: string
  age: number
  club: string
  memberSince: string
}

interface Props {
  profile: Profile
}

function Show() {
  const { profile } = usePage<Props>().props

  const rows: Array<[string, string]> = [
    ['Email', profile.email],
    ['Role', profile.role],
    ['Age', String(profile.age)],
    ['Club', profile.club],
  ]

  function handleLogout() {
    router.delete('/users/sign_out')
  }

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div className="flex items-center gap-4 lg:gap-[18px]">
          <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-ink text-xl font-bold text-paper lg:h-[76px] lg:w-[76px] lg:text-2xl">
            {profile.initials}
          </div>
          <div>
            <h1 className="text-[21px] font-bold tracking-[-0.02em] text-ink lg:text-[28px]">{profile.name}</h1>
            <div className="mt-0.5 text-[13px] text-muted lg:text-sm">
              {profile.club} · Member since {profile.memberSince}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-white px-5 py-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-[#E9EDE9] py-3.5 last:border-0">
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm text-ink">{value}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-full border border-line py-3.5 text-[15px] font-semibold text-danger"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
```

- [ ] **Step 5: Add the route**

Edit `rails/config/routes.rb`, adding after the plan route:

```ruby
  get "/dashboard/profile", to: "profile#index"
```

- [ ] **Step 6: Run the spec**

```bash
cd rails && bundle exec rspec spec/requests/profile_spec.rb
```

Expected: PASS, 1 example.

- [ ] **Step 7: Run the full suite**

```bash
cd rails && bundle exec rspec
```

Expected: PASS, all examples across every spec file in this plan plus the auth foundation's.

- [ ] **Step 8: Manually verify the full navigation loop**

```bash
bin/dev
```

Log in, click through every sidebar/bottom-tab link (Dashboard, Courses, Exercises, Weekly plan, Profile), confirm each renders correctly styled, then sign out from the profile page and confirm redirect to login. Stop `bin/dev`.

- [ ] **Step 9: Commit**

```bash
git add rails/app/controllers/profile_controller.rb rails/app/frontend/pages/Profile/Show.tsx \
  rails/config/routes.rb rails/spec/requests/profile_spec.rb
git commit -m "Port the profile page, mixing real identity with mock profile fields"
```
