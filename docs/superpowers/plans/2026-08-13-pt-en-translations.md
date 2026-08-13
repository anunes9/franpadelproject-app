# PT/EN UI Translations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every hardcoded English UI string in the app's 9 Inertia pages and shared components is sourced from typed PT/EN dictionaries, with a per-user language preference the user can switch from the Profile page.

**Architecture:** A homegrown TypeScript dictionary (`app/frontend/i18n/translations/{en,pt}.ts`) plus a `useTranslation()` hook that reads `locale` off Inertia's globally-shared page props — no context/provider needed since Inertia's `usePage()` already merges shared props into every page. The backend adds a `users.locale` enum column, shares it via `ApplicationController#inertia_share`, and exposes a `PATCH /locale` endpoint that mirrors the existing `CoursesController#complete` PATCH+redirect pattern.

**Tech Stack:** Rails 8.1 + Inertia Rails + React 19 + TypeScript + Vite. No new dependencies. No JS test runner exists in this repo (`package.json` has no `test` script, no jest/vitest) — frontend correctness is verified via `npm run check` (tsc, strict mode with `noUnusedLocals`/`noUnusedParameters`) and manual verification in the browser, not automated unit tests. Backend changes use RSpec (already configured) with real TDD (failing spec → implementation → passing spec).

## Global Constraints

- Design doc: `docs/superpowers/specs/2026-08-13-pt-en-translations-design.md`. Every requirement in it maps to a task below.
- Frontend code style: single quotes, no semicolons, matching every existing file in `app/frontend`. Ruby: double-quoted strings, matching every existing file in `app`.
- **No Rails-side I18n.** No `config/locales/*.yml` additions, no `I18n.locale`. The frontend dictionaries are the only source of UI copy.
- **Do not touch `app/frontend/components/ui/StatusBadge.tsx`.** It's exported from `components/ui/index.ts` but not imported by any page — dead code. Translating unreachable code wastes effort; leave it exactly as-is.
- **Do not translate database-backed content** — `Module`/`Exercise`/`QuizQuestion` field values (titles, descriptions, topics, quiz text) stay as literal prop data, untouched.
- PT copy in this plan is a first-pass European Portuguese translation for the user to review after implementation — not final copy, but still real, complete sentences (never placeholder text).
- To preview PT strings in the browser **before** Task 5 (the language switcher) exists, use `bin/rails runner 'User.first.update!(locale: :en)'` (or `:pt` to revert) and reload the page.
- Every frontend task ends with `npm run check` passing (zero tsc errors) — this is the guardrail against translation-key typos and drift between `en.ts`/`pt.ts`, since `pt.ts` is declared `satisfies typeof en`.
- Run `bundle exec rspec` for backend tasks; run it once more in full at the end (Task 12).

---

## File Structure

New files:
- `app/frontend/i18n/translations/en.ts` — English dictionary
- `app/frontend/i18n/translations/pt.ts` — Portuguese dictionary, `satisfies typeof en`
- `app/frontend/i18n/translations/index.ts` — `translations` map + `TranslationKey` type
- `app/frontend/i18n/utils.ts` — `getByPath`, `interpolate`
- `app/frontend/i18n/useTranslation.ts` — the `t()`/`locale` hook
- `app/controllers/locales_controller.rb`
- `db/migrate/20260813130000_add_locale_to_users.rb`
- `spec/requests/locales_spec.rb`

Modified files (one per task, see below): `app/models/user.rb`, `app/controllers/application_controller.rb`, `app/controllers/sessions_controller.rb`, `app/controllers/plan_controller.rb`, `app/models/dashboard_data.rb`, `config/routes.rb`, `app/frontend/types/index.ts`, `app/frontend/components/shell.tsx`, all 9 page files, `app/frontend/components/ui/CategoryFilter.tsx`, plus `spec/requests/sessions_spec.rb` and `spec/requests/dashboard_spec.rb`.

---

### Task 1: `users.locale` column and enum

**Files:**
- Create: `db/migrate/20260813130000_add_locale_to_users.rb`
- Modify: `app/models/user.rb`
- Test: `spec/models/user_spec.rb`

**Interfaces:**
- Produces: `User#locale` (string, `"pt"` or `"en"`), `User.locales` (Rails enum mapping)

- [ ] **Step 1: Write the failing spec**

Add to `spec/models/user_spec.rb`, after the existing `"defines the expected hand values"` example (around line 30):

```ruby
  it "defines the expected locale values" do
    expect(User.locales.keys).to match_array(%w[pt en])
  end

  it "defaults to pt" do
    expect(create(:user).locale).to eq("pt")
  end
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `bundle exec rspec spec/models/user_spec.rb -e "defines the expected locale values"`
Expected: FAIL — `NoMethodError: undefined method 'locales' for User`

- [ ] **Step 3: Create the migration**

Create `db/migrate/20260813130000_add_locale_to_users.rb`:

```ruby
class AddLocaleToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :locale, :integer, default: 0, null: false
  end
end
```

Run: `bin/rails db:migrate`

- [ ] **Step 4: Add the enum to `User`**

In `app/models/user.rb`, add `locale` alongside the existing enums (line 8):

```ruby
  enum :role, { admin: 0, sales: 1, client: 2 }
  enum :level, { beginner: 0, intermediate: 1, advanced: 2 }
  enum :hand, { left: 0, right: 1 }
  enum :locale, { pt: 0, en: 1 }
```

- [ ] **Step 5: Run the spec to verify it passes**

Run: `bundle exec rspec spec/models/user_spec.rb`
Expected: PASS, all examples

- [ ] **Step 6: Commit**

```bash
git add db/migrate/20260813130000_add_locale_to_users.rb db/schema.rb app/models/user.rb spec/models/user_spec.rb
git commit -m "Add locale enum to User"
```

---

### Task 2: Share `locale` via Inertia + `PATCH /locale` endpoint

**Files:**
- Modify: `app/controllers/application_controller.rb`
- Modify: `app/frontend/types/index.ts`
- Modify: `config/routes.rb`
- Create: `app/controllers/locales_controller.rb`
- Create: `spec/requests/locales_spec.rb`
- Modify: `spec/requests/sessions_spec.rb`
- Modify: `spec/requests/dashboard_spec.rb`

**Interfaces:**
- Consumes: `User#locale` from Task 1
- Produces: `locale` key on every Inertia page's shared props (`"pt"` or `"en"`); `PATCH /locale` route; TypeScript `Locale` type (`'pt' | 'en'`) and `SharedProps.locale`, both exported from `@/types`, consumed by Task 4's `useTranslation` hook

- [ ] **Step 1: Write the failing request specs**

Create `spec/requests/locales_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Locales", type: :request do
  let(:user) { create(:user, locale: :pt) }

  before { sign_in user }

  it "updates the current user's locale and redirects back" do
    patch "/locale", params: { locale: "en" }, headers: { "HTTP_REFERER" => "/dashboard/profile" }

    expect(response).to redirect_to("/dashboard/profile")
    expect(user.reload.locale).to eq("en")
  end

  it "falls back to the dashboard when there's no referer" do
    patch "/locale", params: { locale: "en" }

    expect(response).to redirect_to(dashboard_path)
  end

  it "rejects an invalid locale without changing the user" do
    patch "/locale", params: { locale: "fr" }

    expect(response).to have_http_status(:unprocessable_content)
    expect(user.reload.locale).to eq("pt")
  end

  it "requires authentication" do
    sign_out user
    patch "/locale", params: { locale: "en" }
    expect(response).to redirect_to(new_user_session_path)
  end
end
```

Add to `spec/requests/sessions_spec.rb`, after the `"serves the login page at root"` example (around line 30):

```ruby
  it "shares the pt locale by default for guests" do
    get "/"
    expect(response.body).to include('"locale":"pt"')
  end
```

Add to `spec/requests/dashboard_spec.rb`, after the `"renders the real dashboard home..."` example (around line 20):

```ruby
  it "shares the signed-in user's locale" do
    user = create(:user, name: "Ana Costa", locale: :en)
    sign_in user

    get "/dashboard"

    expect(response.body).to include('"locale":"en"')
  end
```

- [ ] **Step 2: Run the specs to verify they fail**

Run: `bundle exec rspec spec/requests/locales_spec.rb spec/requests/sessions_spec.rb spec/requests/dashboard_spec.rb`
Expected: FAIL — `locales_spec.rb` fails with a routing error (`No route matches [PATCH] "/locale"`); the two locale-sharing examples fail because `response.body` doesn't include a `"locale"` key yet.

- [ ] **Step 3: Share `locale` from `ApplicationController`**

In `app/controllers/application_controller.rb`, change the `inertia_share` block:

```ruby
class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  inertia_share do
    {
      current_user: current_user && {
        email: current_user.email,
        role: current_user.role
      },
      locale: current_user&.locale || "pt"
    }
  end
end
```

- [ ] **Step 4: Add the route**

In `config/routes.rb`, add after `get "/dashboard/profile", to: "profile#index"` (line 17):

```ruby
  patch "/locale", to: "locales#update"
```

- [ ] **Step 5: Create `LocalesController`**

Create `app/controllers/locales_controller.rb`:

```ruby
class LocalesController < ApplicationController
  before_action :authenticate_user!

  AVAILABLE_LOCALES = %w[pt en].freeze

  def update
    return head :unprocessable_content unless AVAILABLE_LOCALES.include?(params[:locale])

    current_user.update!(locale: params[:locale])
    redirect_back fallback_location: dashboard_path
  end
end
```

- [ ] **Step 6: Run the specs to verify they pass**

Run: `bundle exec rspec spec/requests/locales_spec.rb spec/requests/sessions_spec.rb spec/requests/dashboard_spec.rb`
Expected: PASS, all examples

- [ ] **Step 7: Add the frontend `Locale`/`SharedProps` types**

Replace the contents of `app/frontend/types/index.ts`:

```ts
export type FlashData = {
  notice?: string
  alert?: string
}

export type Locale = 'pt' | 'en'

export type SharedProps = {
  locale: Locale
}
```

- [ ] **Step 8: Type-check**

Run: `npm run check`
Expected: PASS, zero errors

- [ ] **Step 9: Commit**

```bash
git add app/controllers/application_controller.rb app/controllers/locales_controller.rb config/routes.rb \
  spec/requests/locales_spec.rb spec/requests/sessions_spec.rb spec/requests/dashboard_spec.rb \
  app/frontend/types/index.ts
git commit -m "Share locale via Inertia and add PATCH /locale"
```

---

### Task 3: Devise login error becomes a stable key

**Files:**
- Modify: `app/controllers/sessions_controller.rb`
- Modify: `spec/requests/sessions_spec.rb`

**Interfaces:**
- Produces: `errors.base` prop on `Auth/Login` is now the literal string `"invalid_credentials"` instead of Devise's English sentence — consumed by Task 7 (`Login.tsx`)

- [ ] **Step 1: Update the failing assertion**

In `spec/requests/sessions_spec.rb`, change the `"rejects invalid credentials..."` example:

```ruby
  it "rejects invalid credentials and re-renders the login page with an error" do
    post user_session_path, params: { user: { email: user.email, password: "wrongpassword" } }
    expect(response).to have_http_status(:unprocessable_content)
    expect(response.body).to include('"base":"invalid_credentials"')
  end
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `bundle exec rspec spec/requests/sessions_spec.rb`
Expected: FAIL — response body still contains Devise's `"Invalid email or password."` sentence, not `"invalid_credentials"`.

- [ ] **Step 3: Change the controller**

In `app/controllers/sessions_controller.rb`, change the `#new` action:

```ruby
  def new
    render inertia: "Auth/Login", props: { errors: flash[:alert] ? { base: "invalid_credentials" } : {} }
  end
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `bundle exec rspec spec/requests/sessions_spec.rb`
Expected: PASS, all examples

- [ ] **Step 5: Commit**

```bash
git add app/controllers/sessions_controller.rb spec/requests/sessions_spec.rb
git commit -m "Send a stable error key from the login action instead of Devise's English text"
```

---

### Task 4: Frontend i18n core — dictionaries, hook, utils

**Files:**
- Create: `app/frontend/i18n/translations/en.ts`
- Create: `app/frontend/i18n/translations/pt.ts`
- Create: `app/frontend/i18n/translations/index.ts`
- Create: `app/frontend/i18n/utils.ts`
- Create: `app/frontend/i18n/useTranslation.ts`

**Interfaces:**
- Consumes: `Locale`, `SharedProps` from `@/types` (Task 2)
- Produces: `useTranslation()` returning `{ t: (key: TranslationKey, vars?: Record<string, string | number>) => string, locale: Locale }`, and `TranslationKey` exported from `@/i18n/translations` — consumed by every page task (5 through 11)

This task creates the **complete** dictionaries up front (every key any page will need), so every later task only touches its own page file.

- [ ] **Step 1: Create the English dictionary**

Create `app/frontend/i18n/translations/en.ts`:

```ts
export const en = {
  common: {
    nav: {
      dashboard: 'Dashboard',
      home: 'Home',
      courses: 'Courses',
      exercises: 'Exercises',
      weeklyPlan: 'Weekly plan',
      plan: 'Plan',
      profile: 'Profile',
    },
    signOut: 'Sign out',
    back: '← Back',
    category: {
      all: 'All',
      technical: 'Technical',
      tactical: 'Tactical',
    },
    status: {
      completed: 'completed',
      inProgress: 'in progress',
      open: 'open',
      locked: 'locked',
    },
    days: {
      short: {
        mon: 'MON',
        tue: 'TUE',
        wed: 'WED',
        thu: 'THU',
        fri: 'FRI',
        sat: 'SAT',
        sun: 'SUN',
      },
      long: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',
      },
    },
    logoAlt: {
      franMethodology: 'Fran Methodology',
    },
  },
  auth: {
    login: {
      logoAlt: 'Padel Academy',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      submit: 'Log in',
      submitting: 'Logging in…',
      invalidCredentials: 'Invalid email or password',
    },
  },
  dashboard: {
    home: {
      greeting: 'Good afternoon, {{name}}',
      stats: {
        courseProgress: 'Course progress',
        modulesCompleteDetail: '{{done}} of {{total}} modules complete',
        exercisesCompleted: 'Exercises completed',
        averageQuizScore: 'Average quiz score',
      },
      continueEyebrow: 'Continue where you left off',
      modulesEyebrow: 'Modules',
      thisWeekEyebrow: 'This week',
      planLink: 'Plan',
      weekPlan: {
        dragExerciseHere: 'Drag an exercise here',
        mondayItem: 'Slice serve, elbow above 90º · Technical',
        wednesdayItem: 'Traffic light stop drill · Technical',
        thursdayItem: 'Glass exit, dominant side · Tactical',
      },
    },
  },
  courses: {
    index: {
      eyebrow: 'Beginner course · 8 modules',
      title: 'Courses',
      level: {
        beginner: 'Beginner',
        beginnerMeta: '8 modules',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        locked: 'Locked',
      },
    },
    show: {
      backLink: '← Beginner course',
      documentKind: {
        pdf: 'PDF',
        image: 'IMAGE',
        video: 'VIDEO',
        file: 'FILE',
      },
      documentsCount: '{{count}} documents',
      exercisesCount: '{{count}} exercises',
      materialsEyebrow: 'Materials',
      viewDocument: 'View',
      moduleExercisesTitle: 'Module exercises',
      moduleExercisesDetail: '{{count}} drills · 2 completed',
      knowledgeCheckTitle: 'Knowledge check',
      knowledgeCheckDetail: '4 questions · unlocks module completion',
      startKnowledgeCheck: 'Start knowledge check',
      moduleCompleted: 'Module completed',
      markComplete: 'Mark module as complete',
      markingComplete: 'Marking as complete…',
    },
    quiz: {
      knowledgeCheckLabel: 'Knowledge check',
      correctCount: '{{score}} / {{total}} correct',
      passedMessage: 'Passed — module marked complete.',
      failedMessage: 'Below 75% — review the material and try again.',
      notAnswered: 'Not answered',
      correctLabel: 'Correct: {{answer}}',
      retake: 'Retake',
      nextModule: 'Next module',
      questionProgress: 'Question {{current}} of {{total}}',
      selectAnAnswer: 'Select an answer',
      submit: 'Submit',
      continue: 'Continue',
    },
  },
  plan: {
    index: {
      eyebrow: 'Drag exercises into a day',
      title: 'Weekly plan',
      mobileHintPicked: 'Now tap a day to add it',
      mobileHintDefault: 'Tap an exercise, then a day',
      exerciseLibrary: 'Exercise library',
      dropHere: 'Drop here',
    },
  },
  profile: {
    show: {
      rowLabel: {
        email: 'Email',
        age: 'Age',
        level: 'Level',
        hand: 'Hand',
        club: 'Club',
      },
      emptyValue: '—',
      memberSince: 'Member since {{date}}',
      language: 'Language',
    },
  },
  exercises: {
    index: {
      eyebrow: 'Library',
      title: 'Exercises',
    },
    show: {
      mediaPlaceholderSuffix: '{{media}} · full-screen media placeholder',
      defaultModuleLabel: 'Module',
      markComplete: 'Mark complete',
      addToPlan: 'Add to plan',
    },
  },
}
```

- [ ] **Step 2: Create the Portuguese dictionary**

Create `app/frontend/i18n/translations/pt.ts`:

```ts
import type { en } from './en'

export const pt = {
  common: {
    nav: {
      dashboard: 'Painel',
      home: 'Início',
      courses: 'Cursos',
      exercises: 'Exercícios',
      weeklyPlan: 'Plano semanal',
      plan: 'Plano',
      profile: 'Perfil',
    },
    signOut: 'Terminar sessão',
    back: '← Voltar',
    category: {
      all: 'Todos',
      technical: 'Técnico',
      tactical: 'Tático',
    },
    status: {
      completed: 'concluído',
      inProgress: 'em curso',
      open: 'aberto',
      locked: 'bloqueado',
    },
    days: {
      short: {
        mon: 'SEG',
        tue: 'TER',
        wed: 'QUA',
        thu: 'QUI',
        fri: 'SEX',
        sat: 'SÁB',
        sun: 'DOM',
      },
      long: {
        monday: 'Segunda-feira',
        tuesday: 'Terça-feira',
        wednesday: 'Quarta-feira',
        thursday: 'Quinta-feira',
        friday: 'Sexta-feira',
        saturday: 'Sábado',
        sunday: 'Domingo',
      },
    },
    logoAlt: {
      franMethodology: 'Fran Methodology',
    },
  },
  auth: {
    login: {
      logoAlt: 'Academia de Padel',
      emailLabel: 'Email',
      passwordLabel: 'Palavra-passe',
      submit: 'Iniciar sessão',
      submitting: 'A iniciar sessão…',
      invalidCredentials: 'Email ou palavra-passe inválidos',
    },
  },
  dashboard: {
    home: {
      greeting: 'Boa tarde, {{name}}',
      stats: {
        courseProgress: 'Progresso do curso',
        modulesCompleteDetail: '{{done}} de {{total}} módulos concluídos',
        exercisesCompleted: 'Exercícios concluídos',
        averageQuizScore: 'Pontuação média nos testes',
      },
      continueEyebrow: 'Continuar onde parou',
      modulesEyebrow: 'Módulos',
      thisWeekEyebrow: 'Esta semana',
      planLink: 'Plano',
      weekPlan: {
        dragExerciseHere: 'Arraste um exercício para aqui',
        mondayItem: 'Serviço cortado, cotovelo acima de 90º · Técnico',
        wednesdayItem: 'Exercício do semáforo · Técnico',
        thursdayItem: 'Saída de vidro, lado dominante · Tático',
      },
    },
  },
  courses: {
    index: {
      eyebrow: 'Curso de iniciação · 8 módulos',
      title: 'Cursos',
      level: {
        beginner: 'Iniciação',
        beginnerMeta: '8 módulos',
        intermediate: 'Intermédio',
        advanced: 'Avançado',
        locked: 'Bloqueado',
      },
    },
    show: {
      backLink: '← Curso de iniciação',
      documentKind: {
        pdf: 'PDF',
        image: 'IMAGEM',
        video: 'VÍDEO',
        file: 'FICHEIRO',
      },
      documentsCount: '{{count}} documentos',
      exercisesCount: '{{count}} exercícios',
      materialsEyebrow: 'Materiais',
      viewDocument: 'Ver',
      moduleExercisesTitle: 'Exercícios do módulo',
      moduleExercisesDetail: '{{count}} exercícios · 2 concluídos',
      knowledgeCheckTitle: 'Teste de conhecimentos',
      knowledgeCheckDetail: '4 perguntas · desbloqueia a conclusão do módulo',
      startKnowledgeCheck: 'Iniciar teste de conhecimentos',
      moduleCompleted: 'Módulo concluído',
      markComplete: 'Marcar módulo como concluído',
      markingComplete: 'A marcar como concluído…',
    },
    quiz: {
      knowledgeCheckLabel: 'Teste de conhecimentos',
      correctCount: '{{score}} / {{total}} corretas',
      passedMessage: 'Aprovado — módulo marcado como concluído.',
      failedMessage: 'Abaixo de 75% — reveja o material e tente novamente.',
      notAnswered: 'Sem resposta',
      correctLabel: 'Correta: {{answer}}',
      retake: 'Repetir',
      nextModule: 'Próximo módulo',
      questionProgress: 'Pergunta {{current}} de {{total}}',
      selectAnAnswer: 'Selecione uma resposta',
      submit: 'Submeter',
      continue: 'Continuar',
    },
  },
  plan: {
    index: {
      eyebrow: 'Arraste exercícios para um dia',
      title: 'Plano semanal',
      mobileHintPicked: 'Agora toque num dia para adicionar',
      mobileHintDefault: 'Toque num exercício e depois num dia',
      exerciseLibrary: 'Biblioteca de exercícios',
      dropHere: 'Largar aqui',
    },
  },
  profile: {
    show: {
      rowLabel: {
        email: 'Email',
        age: 'Idade',
        level: 'Nível',
        hand: 'Mão',
        club: 'Clube',
      },
      emptyValue: '—',
      memberSince: 'Membro desde {{date}}',
      language: 'Idioma',
    },
  },
  exercises: {
    index: {
      eyebrow: 'Biblioteca',
      title: 'Exercícios',
    },
    show: {
      mediaPlaceholderSuffix: '{{media}} · marcador de ecrã inteiro',
      defaultModuleLabel: 'Módulo',
      markComplete: 'Marcar como concluído',
      addToPlan: 'Adicionar ao plano',
    },
  },
} satisfies typeof en
```

- [ ] **Step 3: Create the translations index with the `DotPaths` key type**

Create `app/frontend/i18n/translations/index.ts`:

```ts
import type { Locale } from '@/types'
import { en } from './en'
import { pt } from './pt'

export const translations: Record<Locale, typeof en> = { en, pt }

type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`
}[keyof T & string]

export type TranslationKey = DotPaths<typeof en>
```

- [ ] **Step 4: Create the lookup/interpolation utilities**

Create `app/frontend/i18n/utils.ts`:

```ts
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
```

- [ ] **Step 5: Create the hook**

Create `app/frontend/i18n/useTranslation.ts`:

```ts
import { usePage } from '@inertiajs/react'
import type { TranslationKey } from './translations'
import { translations } from './translations'
import { getByPath, interpolate } from './utils'

export function useTranslation() {
  const { locale } = usePage().props
  const dict = translations[locale]

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    const template = getByPath(dict, key)
    return vars ? interpolate(template, vars) : template
  }

  return { t, locale }
}
```

`usePage()` needs no explicit generic here — the `declare module '@inertiajs/core'` augmentation in `app/frontend/types/globals.d.ts` already merges `SharedProps` (and therefore `locale`) into every `usePage<T>()` call's return type, including a bare `usePage()`.

- [ ] **Step 6: Type-check**

Run: `npm run check`
Expected: PASS, zero errors. If `pt.ts` has a missing/extra/mistyped key relative to `en.ts`, this is where it surfaces — fix any mismatch before moving on.

- [ ] **Step 7: Commit**

```bash
git add app/frontend/i18n
git commit -m "Add PT/EN translation dictionaries and useTranslation hook"
```

---

### Task 5: Profile page — migrate + language switcher

**Files:**
- Modify: `app/frontend/pages/Profile/Show.tsx`

**Interfaces:**
- Consumes: `useTranslation()` (Task 4), `PATCH /locale` (Task 2), `Locale` from `@/types` (Task 2)

This is the first page migrated so that every later task can verify its PT strings through the real UI switcher instead of the `bin/rails runner` workaround.

- [ ] **Step 1: Replace the file**

Replace `app/frontend/pages/Profile/Show.tsx` in full:

```tsx
import { router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AppShell } from '../../components/shell'
import { useTranslation } from '@/i18n/useTranslation'
import type { Locale } from '@/types'

interface Profile {
  name: string
  initials: string
  email: string
  role: string
  age: number | null
  level: string | null
  hand: string | null
  club: string | null
  memberSince: string
}

interface Props {
  profile: Profile
}

function Show() {
  const { profile } = usePage<Props>().props
  const { t, locale } = useTranslation()

  const rows: Array<[string, string]> = [
    [t('profile.show.rowLabel.email'), profile.email],
    [t('profile.show.rowLabel.age'), profile.age ? String(profile.age) : t('profile.show.emptyValue')],
    [t('profile.show.rowLabel.level'), profile.level ?? t('profile.show.emptyValue')],
    [t('profile.show.rowLabel.hand'), profile.hand ?? t('profile.show.emptyValue')],
    [t('profile.show.rowLabel.club'), profile.club ?? t('profile.show.emptyValue')],
  ]

  function handleLogout() {
    router.delete('/users/sign_out')
  }

  function handleLocaleChange(next: Locale) {
    router.patch('/locale', { locale: next }, { preserveScroll: true })
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
              {profile.club ? `${profile.club} · ` : ''}
              {t('profile.show.memberSince', { date: profile.memberSince })}
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
          <div className="flex justify-between border-b border-[#E9EDE9] py-3.5 last:border-0">
            <span className="text-sm text-muted">{t('profile.show.language')}</span>
            <div className="flex gap-1 rounded-full border border-line p-0.5">
              {(['pt', 'en'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleLocaleChange(option)}
                  className={
                    'rounded-full px-3 py-1 text-xs font-semibold uppercase transition-colors ' +
                    (locale === option ? 'bg-ink text-paper' : 'text-muted')
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-full border border-line py-3.5 text-[15px] font-semibold text-danger"
        >
          {t('common.signOut')}
        </button>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
```

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: PASS, zero errors

- [ ] **Step 3: Manually verify in the browser**

Run `bin/dev`, sign in, go to `/dashboard/profile`, click "EN" in the new Language row. The page should reload with the row labels still in English (dictionaries are identical in content structure) but confirm no console errors and the toggle highlights whichever option is active. Click "PT" and confirm the row labels ("Idade", "Nível", "Mão", "Clube", "Email") and "Membro desde …" render correctly.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/pages/Profile/Show.tsx
git commit -m "Translate the Profile page and add a language switcher"
```

---

### Task 6: Shared shell — sidebar nav, mobile tabs, sign-out

**Files:**
- Modify: `app/frontend/components/shell.tsx`

**Interfaces:**
- Consumes: `useTranslation()` (Task 4)

- [ ] **Step 1: Replace the file**

Replace `app/frontend/components/shell.tsx` in full:

```tsx
import {
  Book02Icon,
  Calendar03Icon,
  Dumbbell02Icon,
  Home01Icon,
  Logout03Icon,
  User03Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, router, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useTranslation } from '@/i18n/useTranslation'
import type { DashboardUser } from '../types/dashboard-data'

function useNav() {
  const { t } = useTranslation()
  return [
    { href: '/dashboard', label: t('common.nav.dashboard'), tab: t('common.nav.home'), icon: Home01Icon },
    { href: '/dashboard/courses', label: t('common.nav.courses'), tab: t('common.nav.courses'), icon: Book02Icon },
    {
      href: '/dashboard/exercises',
      label: t('common.nav.exercises'),
      tab: t('common.nav.exercises'),
      icon: Dumbbell02Icon,
    },
    { href: '/dashboard/plan', label: t('common.nav.weeklyPlan'), tab: t('common.nav.plan'), icon: Calendar03Icon },
    { href: '/dashboard/profile', label: t('common.nav.profile'), tab: t('common.nav.profile'), icon: User03Icon },
  ]
}

const isActive = (pathname: string, href: string) =>
  href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

function handleSignOut() {
  router.delete('/users/sign_out')
}

function Sidebar() {
  const { url, props } = usePage<{ dashboardUser: DashboardUser }>()
  const { dashboardUser } = props
  const { t } = useTranslation()
  const nav = useNav()

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-8 bg-ink px-5 py-7">
      <img
        src="/fran-methodology-logo.png"
        alt={t('common.logoAlt.franMethodology')}
        className="h-auto w-auto brightness-0 invert opacity-95"
      />
      <nav className="flex flex-col gap-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ' +
              (isActive(url, item.href) ? 'bg-teal/15 text-paper' : 'text-ink-mute hover:text-paper')
            }
          >
            <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.5} className="shrink-0" />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2.5 rounded-lg bg-danger px-3 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-danger/90"
        >
          <HugeiconsIcon icon={Logout03Icon} size={18} strokeWidth={1.5} className="shrink-0" />
          {t('common.signOut')}
        </button>
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-paper/10 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[13px] font-bold text-ink">
          {dashboardUser.initials}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-paper">{dashboardUser.name}</div>
          {dashboardUser.club && <div className="text-[11px] text-muted">{dashboardUser.club}</div>}
        </div>
      </div>
    </aside>
  )
}

function MobileHeader() {
  const { props } = usePage<{ dashboardUser: DashboardUser }>()
  const { dashboardUser } = props
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between p-2 lg:hidden h-12">
      <img src="/fran-methodology-logo.png" alt={t('common.logoAlt.franMethodology')} className="h-20 w-auto" />
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper">
        {dashboardUser.initials}
      </div>
    </div>
  )
}

function BottomTabs() {
  const { url } = usePage()
  const nav = useNav().filter((n) => n.href !== '/dashboard/plan')
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white px-5 pb-7 pt-2.5 lg:hidden">
      {nav.map((item) => {
        const on = isActive(url, item.href)
        return (
          <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center gap-1.5">
            <HugeiconsIcon
              icon={item.icon}
              size={20}
              strokeWidth={1.5}
              className={on ? 'text-ink' : 'text-[#C9D2CD]'}
            />
            <span className={`text-[11px] font-semibold ${on ? 'text-ink' : 'text-[#C9D2CD]'}`}>{item.tab}</span>
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
      <main className="min-w-0 flex-1 pb-28 lg:pb-0">
        <MobileHeader />
        {children}
      </main>
      <BottomTabs />
    </div>
  )
}

export function PageHeader({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        {eyebrow && <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">{eyebrow}</div>}

        <h1 className="mt-1.5 text-[27px] font-bold tracking-[-0.02em] text-ink lg:text-[34px] lg:tracking-[-0.025em]">
          {title}
        </h1>
      </div>
    </div>
  )
}
```

The module-level `NAV` constant becomes `useNav()`, a hook, because its labels now depend on the current locale (read via `useTranslation()`) and must be recomputed on every render, not fixed once at module load.

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: PASS, zero errors

- [ ] **Step 3: Manually verify in the browser**

With `bin/dev` running, visit any `/dashboard/*` page. Confirm the sidebar (desktop) and bottom tabs (resize to mobile width) show translated labels, and switching language on the Profile page (Task 5) updates the sidebar/nav text immediately after the redirect.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/components/shell.tsx
git commit -m "Translate the app shell's navigation and sign-out button"
```

---

### Task 7: Login page

**Files:**
- Modify: `app/frontend/pages/Auth/Login.tsx`

**Interfaces:**
- Consumes: `useTranslation()` (Task 4), the `"invalid_credentials"` error key (Task 3)

- [ ] **Step 1: Replace the file**

Replace `app/frontend/pages/Auth/Login.tsx` in full:

```tsx
import { useForm } from '@inertiajs/react'
import type { FormEvent } from 'react'
import { useTranslation } from '@/i18n/useTranslation'

interface Props {
  errors: { base?: string }
}

export default function Login({ errors }: Props) {
  const { t } = useTranslation()
  // Nested under `user` because Devise's SessionsController reads
  // credentials from params[:user][:email] / params[:user][:password].
  const { data, setData, post, processing } = useForm({
    user: { email: '', password: '' },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    post('/users/sign_in')
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video autoPlay muted loop playsInline className="h-full w-full object-cover">
          <source
            src="https://videos.ctfassets.net/rqt5vjnpqy42/3ef26Zy6GLC2xqMRKg65N6/ceaff5f51de07147756fdee533f8dfdb/FranPadelProject_teaser.mov"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <img
            src="/fran-padel-project-logo.svg"
            alt={t('auth.login.logoAlt')}
            width={260}
            height={200}
            className="mx-auto mb-8"
          />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-white p-6">
            {errors.base && (
              <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {errors.base === 'invalid_credentials' ? t('auth.login.invalidCredentials') : errors.base}
              </p>
            )}
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              {t('auth.login.emailLabel')}
              <input
                type="email"
                value={data.user.email}
                onChange={(e) => setData('user', { ...data.user, email: e.target.value })}
                className="rounded-lg border border-line px-3 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              {t('auth.login.passwordLabel')}
              <input
                type="password"
                value={data.user.password}
                onChange={(e) => setData('user', { ...data.user, password: e.target.value })}
                className="rounded-lg border border-line px-3 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </label>
            <button
              type="submit"
              disabled={processing}
              className="mt-2 rounded-full bg-ink py-3 text-[15px] font-semibold text-paper disabled:opacity-60"
            >
              {processing ? t('auth.login.submitting') : t('auth.login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

`errors.base === 'invalid_credentials' ? t(...) : errors.base` translates the known key while still rendering any other/unexpected `errors.base` value verbatim rather than crashing.

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: PASS, zero errors

- [ ] **Step 3: Manually verify in the browser**

Sign out (or open an incognito window), visit `/`. Confirm the form shows English copy by default (guests default to `pt` per the backend, so actually confirm it shows **Portuguese** copy by default — "Iniciar sessão", "Palavra-passe" — since guests now default to `pt`). Submit wrong credentials and confirm "Email ou palavra-passe inválidos" renders instead of Devise's raw sentence.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/pages/Auth/Login.tsx
git commit -m "Translate the login page"
```

---

### Task 8: Dashboard home page

**Files:**
- Modify: `app/frontend/pages/Dashboard/Home.tsx`

**Interfaces:**
- Consumes: `useTranslation()` (Task 4)

- [ ] **Step 1: Replace the file**

Replace `app/frontend/pages/Dashboard/Home.tsx` in full:

```tsx
import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AppShell, PageHeader } from '../../components/shell'
import { Card, Eyebrow } from '../../components/ui'
import type { DashboardUser, Module } from '../../types/dashboard-data'
import { ModuleCard } from '@/components/ui/ModuleCard'
import { useTranslation } from '@/i18n/useTranslation'

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
  { day: 'mon', state: 'done' },
  { day: 'tue', state: 'empty' },
  { day: 'wed', state: 'today' },
  { day: 'thu', state: 'planned' },
  { day: 'fri', state: 'empty' },
  { day: 'sat', state: 'empty' },
] as const

const WEEK_PLAN_ROWS = [
  { day: 'monday', item: 'mondayItem' },
  { day: 'wednesday', item: 'wednesdayItem' },
  { day: 'thursday', item: 'thursdayItem' },
] as const

function Home() {
  const { courseStats, modules, dashboardUser } = usePage<Props>().props
  const { t } = useTranslation()
  const current = modules.find((m) => m.status === 'current') ?? modules[0]

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-5xl flex-col gap-7">
        <PageHeader title={t('dashboard.home.greeting', { name: dashboardUser.name.split(' ')[0] })} />

        {/*Hero Cards*/}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          <Card
            title={t('dashboard.home.stats.courseProgress')}
            content={`${courseStats.progress}%`}
            details={t('dashboard.home.stats.modulesCompleteDetail', {
              done: courseStats.modulesDone,
              total: courseStats.modulesTotal,
            })}
            progress={courseStats.progress}
            tone="dark"
          />

          <Card title={t('dashboard.home.stats.exercisesCompleted')} content={courseStats.exercisesDone} />

          <Card title={t('dashboard.home.stats.averageQuizScore')} content={`${courseStats.averageQuiz}%`} />
        </div>

        {/*Modules*/}
        <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
          {/*In Progress Module*/}
          <div className="flex flex-col gap-3">
            <Eyebrow>{t('dashboard.home.continueEyebrow')}</Eyebrow>

            <ModuleCard
              href={'/dashboard/courses/' + current.id}
              title={current.title}
              description={current.description}
              progress={current.progress}
              topics={current.topics}
              pill={t('common.status.inProgress')}
              variant="index"
            />

            {/*All Module*/}
            <div className="mt-3 flex flex-col gap-3">
              <Eyebrow>{t('dashboard.home.modulesEyebrow')}</Eyebrow>

              {modules.slice(0, 5).map((m) => (
                <ModuleCard
                  key={m.id}
                  href={'/dashboard/courses/' + m.id}
                  title={m.title}
                  description={m.description}
                  progress={m.progress}
                  duration={m.duration}
                  pill={m.progress === 100 ? t('common.status.completed') : t('common.status.open')}
                  topics={m.topics}
                  variant="index"
                />
              ))}
            </div>
          </div>

          {/*Plan for this week*/}
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <Eyebrow>{t('dashboard.home.thisWeekEyebrow')}</Eyebrow>

              <Link href="/dashboard/plan" className="text-[13px] font-semibold">
                {t('dashboard.home.planLink')}
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
                  <div
                    className={'font-dash-mono text-[10px] ' + (d.state === 'today' ? 'text-ink-mute' : 'text-muted')}
                  >
                    {t(`common.days.short.${d.day}`)}
                  </div>
                  <div
                    className={
                      'mx-auto mt-2 h-2 w-2 rounded-full ' +
                      (d.state === 'empty' ? 'bg-line' : d.state === 'today' ? 'bg-teal' : 'bg-teal-deep')
                    }
                  />
                </div>
              ))}
            </div>

            <div className="hidden flex-col gap-3.5 rounded-[18px] border border-line bg-white p-[18px] lg:flex">
              {WEEK_PLAN_ROWS.map((row) => (
                <div key={row.day} className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-ink">{t(`common.days.long.${row.day}`)}</span>
                  <div className="rounded-[10px] border border-dashed border-[#C9D2CD] px-3 py-2.5 text-[13px] text-[#3B4B54]">
                    {t(`dashboard.home.weekPlan.${row.item}`)}
                  </div>
                </div>
              ))}
              <Link
                href="/dashboard/plan"
                className="rounded-[10px] border border-dashed border-line px-3 py-3.5 text-center text-xs text-[#A3B0B7]"
              >
                {t('dashboard.home.weekPlan.dragExerciseHere')}
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

`WEEK` and `WEEK_PLAN_ROWS` use `as const` so each element's `day`/`item` field keeps its specific string-literal type; the template-literal calls like `` t(`common.days.short.${d.day}`) `` then resolve to a literal type that's a member of the `TranslationKey` union, so this type-checks without a cast.

- [ ] **Step 2: Type-check**

Run: `npm run check`
Expected: PASS, zero errors

- [ ] **Step 3: Manually verify in the browser**

Visit `/dashboard` in both languages (switch via Profile). Confirm the greeting, hero card labels, "Continue where you left off"/"Módulos" sections, the mobile day strip (MON/SEG etc.), and the desktop weekly-plan preview all show translated text.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/pages/Dashboard/Home.tsx
git commit -m "Translate the dashboard home page"
```

---

### Task 9: Courses pages (Index, Show, Quiz)

**Files:**
- Modify: `app/frontend/pages/Courses/Index.tsx`
- Modify: `app/frontend/pages/Courses/Show.tsx`
- Modify: `app/frontend/pages/Courses/Quiz.tsx`

**Interfaces:**
- Consumes: `useTranslation()`, `TranslationKey` (Task 4)

- [ ] **Step 1: Replace `Courses/Index.tsx`**

```tsx
import type { ReactNode } from 'react'
import { AppShell, PageHeader } from '../../components/shell'
import type { Module } from '../../types/dashboard-data'
import { ModuleCard } from '@/components/ui/ModuleCard'
import { usePage } from '@inertiajs/react'
import { Card } from '@/components/ui'
import { useTranslation } from '@/i18n/useTranslation'

interface Props {
  modules: Module[]
}

function Index() {
  const { modules } = usePage<Props>().props
  const { t } = useTranslation()

  const levels = [
    { name: t('courses.index.level.beginner'), meta: t('courses.index.level.beginnerMeta'), active: true },
    { name: t('courses.index.level.intermediate'), meta: t('courses.index.level.locked'), active: false },
    { name: t('courses.index.level.advanced'), meta: t('courses.index.level.locked'), active: false },
  ]

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <PageHeader eyebrow={t('courses.index.eyebrow')} title={t('courses.index.title')} />

        <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:gap-4">
          {levels.map((l) => (
            <Card title={l.name} key={l.name} details={l.meta} tone={l.active ? 'dark' : 'light'} />
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          {modules.map((m) => (
            <ModuleCard
              key={m.id}
              href={'/dashboard/courses/' + m.id}
              title={m.title}
              description={m.description}
              progress={m.progress}
              duration={m.duration}
              pill={m.progress === 100 ? t('common.status.completed') : t('common.status.open')}
              topics={m.topics}
              variant="index"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

Index.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Index
```

This also drops the long commented-out `<div>` block that used to sit next to the `<Card>` render (dead code showing an old, unused way to render the same level card) — it referenced the same data this edit already touches and added no behavior.

- [ ] **Step 2: Replace `Courses/Show.tsx`**

```tsx
import { Link, router, usePage } from '@inertiajs/react'
import { type ReactNode, useState } from 'react'
import { AppShell } from '../../components/shell'
import { Eyebrow } from '../../components/ui'
import type { ContentSection, CourseDocument, Exercise, Module } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/translations'

interface Props {
  courseModule: Module
  sections: ContentSection[]
  exercises: Exercise[]
  documents: CourseDocument[]
}

function documentKind(contentType: string, t: (key: TranslationKey) => string) {
  if (contentType === 'application/pdf') return t('courses.show.documentKind.pdf')
  if (contentType.startsWith('image/')) return t('courses.show.documentKind.image')
  if (contentType.startsWith('video/')) return t('courses.show.documentKind.video')
  return contentType.split('/')[1]?.toUpperCase() ?? t('courses.show.documentKind.file')
}

function Show() {
  const { courseModule, sections, exercises, documents } = usePage<Props>().props
  const { t } = useTranslation()
  const [completing, setCompleting] = useState(false)

  function handleComplete() {
    setCompleting(true)
    router.patch(
      `/dashboard/courses/${courseModule.id}/complete`,
      {},
      { preserveScroll: true, onFinish: () => setCompleting(false) },
    )
  }

  return (
    <div>
      <div className="bg-ink px-5 pb-6 pt-6 text-paper lg:px-10 lg:pb-10 lg:pt-9">
        <div className="mx-auto flex max-w-[880px] flex-col gap-3.5">
          <Link href="/dashboard/courses" className="text-[13px] text-ink-mute hover:text-paper">
            {t('courses.show.backLink')}
          </Link>
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-teal">{courseModule.title}</div>
            <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.02em] lg:text-[38px]">
              {courseModule.description}
            </h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {courseModule.topics.map((topic) => (
              <span key={topic} className="rounded-md bg-paper/10 px-2 py-1 text-xs">
                {topic}
              </span>
            ))}
          </div>
          <div className="flex gap-5 text-xs text-ink-mute">
            <span>{courseModule.duration}</span>
            <span>{t('courses.show.documentsCount', { count: documents.length })}</span>
            <span>{t('courses.show.exercisesCount', { count: exercises.length })}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-[880px] flex-col gap-6">
          {documents.length > 0 && (
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('courses.show.materialsEyebrow')}</Eyebrow>
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3 transition-colors hover:border-teal"
                >
                  <span className="font-dash-mono text-[10px] font-semibold text-teal-deep">
                    {documentKind(doc.contentType, t)}
                  </span>
                  <span className="flex-1 text-sm text-ink">{doc.filename}</span>
                  <span className="text-xs text-muted">{t('courses.show.viewDocument')}</span>
                </a>
              ))}
            </div>
          )}

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
              <span className="block text-[15px] font-bold text-ink">{t('courses.show.moduleExercisesTitle')}</span>
              <span className="mt-0.5 block text-[13px] text-muted">
                {t('courses.show.moduleExercisesDetail', { count: exercises.length })}
              </span>
            </span>
            <span className="text-lg text-teal-deep">→</span>
          </Link>

          <div className="flex flex-col gap-3 rounded-2xl bg-mist p-[18px]">
            <div>
              <div className="text-[15px] font-bold text-ink">{t('courses.show.knowledgeCheckTitle')}</div>
              <div className="mt-0.5 text-[13px] text-[#56666F]">{t('courses.show.knowledgeCheckDetail')}</div>
            </div>
            <Link
              href={'/dashboard/courses/' + courseModule.id + '/quiz'}
              className="rounded-full bg-ink py-3.5 text-center text-[15px] font-semibold text-paper"
            >
              {t('courses.show.startKnowledgeCheck')}
            </Link>
          </div>

          {courseModule.status === 'done' ? (
            <div className="rounded-full border border-line bg-white py-3.5 text-center text-[15px] font-semibold text-muted">
              {t('courses.show.moduleCompleted')}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              className="rounded-full bg-teal-deep py-3.5 text-center text-[15px] font-semibold text-paper transition-opacity disabled:opacity-60"
            >
              {completing ? t('courses.show.markingComplete') : t('courses.show.markComplete')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

Show.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Show
```

The topic-map loop variable is renamed from `t` to `topic` since `t` now refers to the translation function in this component's scope.

- [ ] **Step 3: Replace `Courses/Quiz.tsx`**

```tsx
import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { AppShell } from '../../components/shell'
import type { QuizQuestion } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'

interface Props {
  id: string
  quiz: QuizQuestion[]
}

function Quiz() {
  const { id, quiz } = usePage<Props>().props
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = useMemo(() => quiz.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0), [answers, quiz])
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
              {t('courses.quiz.knowledgeCheckLabel')}
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-[46px] font-extrabold tracking-[-0.03em]">
                {Math.round((score / quiz.length) * 100)}%
              </span>
              <span className="text-[15px] text-ink-mute">
                {t('courses.quiz.correctCount', { score, total: quiz.length })}
              </span>
            </div>
            <span className={'text-sm ' + (passed ? 'text-teal' : 'text-[#E2A87A]')}>
              {passed ? t('courses.quiz.passedMessage') : t('courses.quiz.failedMessage')}
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
                      <div className="text-[13px] text-danger">
                        ✗ {q.options[answers[i]] ?? t('courses.quiz.notAnswered')}
                      </div>
                      <div className="text-[13px] text-muted">
                        {t('courses.quiz.correctLabel', { answer: q.options[q.correct] })}
                      </div>
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
              {t('courses.quiz.retake')}
            </button>
            <Link
              href="/dashboard/courses"
              className="flex-1 rounded-full bg-ink py-3.5 text-center text-[15px] font-semibold text-paper"
            >
              {t('courses.quiz.nextModule')}
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
                {t('common.back')}
              </Link>
            ) : (
              <button type="button" onClick={() => setIndex(index - 1)} className="text-[13px] text-muted">
                {t('common.back')}
              </button>
            )}
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              {t('courses.quiz.questionProgress', { current: index + 1, total: quiz.length })}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#E9EDE9]">
            <div
              className="h-full bg-teal-deep transition-all"
              style={{ width: ((index + 1) / quiz.length) * 100 + '%' }}
            />
          </div>
        </div>

        <h1 className="text-[23px] font-bold leading-tight tracking-[-0.02em] text-ink lg:text-[28px]">{question.q}</h1>

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
                <span className={'pt-0.5 font-dash-mono text-xs ' + (on ? 'text-teal' : 'text-muted')}>{'ABC'[i]}</span>
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
          {picked === undefined
            ? t('courses.quiz.selectAnAnswer')
            : index === quiz.length - 1
              ? t('courses.quiz.submit')
              : t('courses.quiz.continue')}
        </button>
      </div>
    </div>
  )
}

Quiz.layout = (page: ReactNode) => <AppShell>{page}</AppShell>

export default Quiz
```

- [ ] **Step 4: Type-check**

Run: `npm run check`
Expected: PASS, zero errors

- [ ] **Step 5: Manually verify in the browser**

In both languages: `/dashboard/courses` (level cards, module pills), a module's `/dashboard/courses/module-1` (materials, knowledge-check block, mark-complete button), and its quiz at `/dashboard/courses/module-1/quiz` (question progress, answer states, pass/fail result screen — answer all 4 questions to reach the result screen).

- [ ] **Step 6: Commit**

```bash
git add app/frontend/pages/Courses
git commit -m "Translate the courses index, detail, and quiz pages"
```

---

### Task 10: Weekly plan page + backend day-label cleanup

**Files:**
- Modify: `app/controllers/plan_controller.rb`
- Modify: `app/models/dashboard_data.rb`
- Modify: `app/frontend/pages/Plan/Index.tsx`
- Test: `spec/requests/plan_spec.rb` (no assertion changes needed — verify it still passes)

**Interfaces:**
- Consumes: `useTranslation()`, `TranslationKey` (Task 4)
- Produces: `PlanController#index` no longer sends a `shortDay` prop — the frontend derives the short day label from `common.days.short.*` instead

As established in the design spec, `days` (`"Monday"`, `"Tuesday"`, …) stays exactly as-is — it's only ever used as a React key and an object key into `plan`/`defaultPlan`, never rendered as text (same pattern as the existing `'done' | 'current' | 'locked'` `ModuleStatus` identifiers). Only the display of `shortDay[day]` was actual rendered English text, so that's what moves to the frontend dictionary.

- [ ] **Step 1: Remove `shortDay` from the controller**

In `app/controllers/plan_controller.rb`:

```ruby
class PlanController < DashboardController
  def index
    render inertia: "Plan/Index", props: {
      days: DashboardData::DAYS,
      defaultPlan: DashboardData::DEFAULT_PLAN,
      exercises: DashboardData::EXERCISES
    }
  end
end
```

- [ ] **Step 2: Remove the now-unused `SHORT_DAY` constant**

In `app/models/dashboard_data.rb`, delete the `SHORT_DAY` block (currently lines 86-89):

```ruby
  SHORT_DAY = {
    "Monday" => "MON", "Tuesday" => "TUE", "Wednesday" => "WED",
    "Thursday" => "THU", "Friday" => "FRI", "Saturday" => "SAT", "Sunday" => "SUN"
  }.freeze
```

- [ ] **Step 3: Run the plan request spec to confirm nothing broke**

Run: `bundle exec rspec spec/requests/plan_spec.rb`
Expected: PASS (it only asserts on the component name, not props)

- [ ] **Step 4: Replace `Plan/Index.tsx`**

```tsx
import { usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { AppShell, PageHeader } from '../../components/shell'
import type { Exercise } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/translations'

interface Props {
  days: string[]
  defaultPlan: Record<string, string[]>
  exercises: Exercise[]
}

const SHORT_DAY_KEY: Record<string, TranslationKey> = {
  Monday: 'common.days.short.mon',
  Tuesday: 'common.days.short.tue',
  Wednesday: 'common.days.short.wed',
  Thursday: 'common.days.short.thu',
  Friday: 'common.days.short.fri',
  Saturday: 'common.days.short.sat',
  Sunday: 'common.days.short.sun',
}

function Index() {
  const { days, defaultPlan, exercises } = usePage<Props>().props
  const { t } = useTranslation()
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
        <PageHeader eyebrow={t('plan.index.eyebrow')} title={t('plan.index.title')} />
        <p className="text-[13px] text-muted lg:hidden">
          {picked ? t('plan.index.mobileHintPicked') : t('plan.index.mobileHintDefault')}
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
              {t('plan.index.exerciseLibrary')}
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
                <span className="font-dash-mono text-[10px] tracking-[0.1em] text-muted">{t(SHORT_DAY_KEY[day])}</span>
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
                    {t('plan.index.dropHere')}
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

- [ ] **Step 5: Type-check**

Run: `npm run check`
Expected: PASS, zero errors

- [ ] **Step 6: Manually verify in the browser**

Visit `/dashboard/plan` in both languages. Confirm the 7 day columns show translated short labels (MON…SUN / SEG…DOM) and dragging/tapping an exercise into a day still works exactly as before (the underlying `days` values are unchanged, so this behavior shouldn't regress).

- [ ] **Step 7: Commit**

```bash
git add app/controllers/plan_controller.rb app/models/dashboard_data.rb app/frontend/pages/Plan/Index.tsx
git commit -m "Translate the weekly plan page's day labels"
```

---

### Task 11: Exercises pages + category filter

**Files:**
- Modify: `app/frontend/components/ui/CategoryFilter.tsx`
- Modify: `app/frontend/pages/Exercises/Index.tsx`
- Modify: `app/frontend/pages/Exercises/Show.tsx`

**Interfaces:**
- Consumes: `useTranslation()`, `TranslationKey` (Task 4)

`CategoryFilter`'s `value`/`onChange` contract keeps using the English identifiers `'All'`/`'Technical'`/`'Tactical'` — they're compared against `Exercise.category`, which is real data from `DashboardData::EXERCISES` (out of scope to translate). Only the button labels are translated.

- [ ] **Step 1: Replace `CategoryFilter.tsx`**

```tsx
import { useTranslation } from '@/i18n/useTranslation'
import type { TranslationKey } from '@/i18n/translations'

const CATEGORIES = ['All', 'Technical', 'Tactical'] as const

const CATEGORY_LABEL_KEY: Record<(typeof CATEGORIES)[number], TranslationKey> = {
  All: 'common.category.all',
  Technical: 'common.category.technical',
  Tactical: 'common.category.tactical',
}

export function CategoryFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={
            'rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ' +
            (value === c ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-[#56666F] hover:border-teal')
          }
        >
          {t(CATEGORY_LABEL_KEY[c])}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Replace `Exercises/Index.tsx`**

```tsx
import { usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { AppShell, PageHeader } from '../../components/shell'
import { CategoryFilter, ExerciseCard } from '../../components/ui'
import type { Exercise } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'

interface Props {
  exercises: Exercise[]
}

function Index() {
  const { exercises } = usePage<Props>().props
  const { t } = useTranslation()
  const [category, setCategory] = useState('All')
  const list = category === 'All' ? exercises : exercises.filter((e) => e.category === category)

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader eyebrow={t('exercises.index.eyebrow')} title={t('exercises.index.title')} />
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

- [ ] **Step 3: Replace `Exercises/Show.tsx`**

```tsx
import { Link, usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import { AppShell } from '../../components/shell'
import { MediaPlaceholder, Topic } from '../../components/ui'
import type { Exercise, Module } from '../../types/dashboard-data'
import { useTranslation } from '@/i18n/useTranslation'

interface Props {
  exercise: Exercise
  courseModule: Module | null
}

function Show() {
  const { exercise, courseModule } = usePage<Props>().props
  const { t } = useTranslation()

  return (
    <div>
      <div className="relative">
        <MediaPlaceholder
          label={t('exercises.show.mediaPlaceholderSuffix', { media: exercise.media })}
          tone="dark"
          className="h-[300px] lg:h-[460px]"
        />
        <Link
          href="/dashboard/exercises"
          className="absolute left-4 top-4 rounded-full bg-black/35 px-3 py-1.5 text-[13px] text-paper"
        >
          {t('common.back')}
        </Link>
      </div>

      <div className="px-5 py-5 lg:px-10 lg:py-8">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">
              {exercise.category} · {exercise.ref}
            </div>
            <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.02em] text-ink lg:text-[32px]">{exercise.title}</h1>
          </div>
          <p className="text-[15px] leading-relaxed text-[#3B4B54]">{exercise.description}</p>
          <div className="flex gap-2">
            <Topic>{courseModule?.title ?? t('exercises.show.defaultModuleLabel')}</Topic>
            <Topic>{exercise.duration}</Topic>
          </div>
          <div className="mt-2 flex gap-2.5">
            <button type="button" className="flex-1 rounded-full bg-ink py-3.5 text-[15px] font-semibold text-paper">
              {t('exercises.show.markComplete')}
            </button>
            <Link
              href="/dashboard/plan"
              className="rounded-full border border-line bg-white px-5 py-3.5 text-[15px] font-semibold text-ink"
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

- [ ] **Step 4: Type-check**

Run: `npm run check`
Expected: PASS, zero errors

- [ ] **Step 5: Manually verify in the browser**

Visit `/dashboard/exercises` in both languages: confirm the "Library"/"Biblioteca" eyebrow, "Exercises"/"Exercícios" title, and the All/Technical/Tactical filter buttons show translated labels while still filtering correctly. Open an exercise detail page and confirm "Mark complete"/"Marcar como concluído" and "Add to plan"/"Adicionar ao plano".

- [ ] **Step 6: Commit**

```bash
git add app/frontend/components/ui/CategoryFilter.tsx app/frontend/pages/Exercises
git commit -m "Translate the exercises index and detail pages"
```

---

### Task 12: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full type-check**

Run: `npm run check`
Expected: PASS, zero errors

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS, zero errors (fix with `npm run lint:fix` if formatting-only issues appear)

- [ ] **Step 3: Full backend test suite**

Run: `bundle exec rspec`
Expected: PASS, all examples (including the new/modified specs from Tasks 1-3 and unmodified specs from Tasks 9-11 that were only checked for regressions)

- [ ] **Step 4: Manual end-to-end pass**

With `bin/dev` running, sign in and, starting from Portuguese (the default), click through every page — Dashboard, Courses index/detail/quiz, Weekly plan, Exercises index/detail, Profile — confirming no leftover English chrome text and no layout breakage from longer Portuguese strings (check the sidebar nav column and the pill labels on module cards especially, since Portuguese words like "em curso" and "concluído" run longer than "in progress"/"completed"). Then switch to English from the Profile page and repeat the same click-through.

- [ ] **Step 5: Commit** (only if Steps 1-3 required fixes)

```bash
git add -A
git commit -m "Fix lint/type issues found in final i18n verification pass"
```
