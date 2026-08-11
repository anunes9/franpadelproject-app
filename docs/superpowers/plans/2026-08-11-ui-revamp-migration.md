# UI Revamp + Locale-Routing Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every post-login screen/flow with the new design (currently a static reference implementation in `design/`), and flatten the app's routing from `/[locale]/...` to unprefixed, English-only paths.

**Architecture:** Port the reference app's routes, components, tokens, and placeholder data almost verbatim into the existing Next.js app under a new `/dashboard/*` route tree, while independently removing `next-intl` from the whole app (root layout, login, auth, middleware). The two migrations are interleaved by necessity — the locale removal must land first because it changes the file paths (`src/app/[locale]/...` → `src/app/...`) that the new dashboard tree gets built on top of.

**Tech Stack:** Next.js 15.5.7 (App Router, React 19), Tailwind CSS v4 (CSS-first `@theme` config, no `tailwind.config.ts`), Supabase auth (`@supabase/ssr`), TypeScript strict mode.

## Global Constraints

- **No test runner exists in this repo** (no jest/vitest, no `*.test.*` files, no `test` script in `package.json`). Verification per task is: `npx tsc --noEmit` (compiles), `npm run lint`, and — for anything user-facing — manual verification via `npm run dev` in a browser. Do not introduce a new test framework as part of this plan; that's a separate decision outside this migration's scope.
- Next.js 15 dynamic route `params` (and layout `params`) are `Promise`s. Server Components `await params`; Client Components that need `params` use `use(params)` from `react` (a component receiving a `Promise` prop cannot be an `async function` if it's a Client Component).
- Tailwind v4: new design tokens go into the `@theme { ... }` block in `src/app/globals.css`. There is no `tailwind.config.ts` in this app — do not create one.
- Path alias `@/*` resolves to `./src/*` (see `tsconfig.json`).
- Reference source for every ported screen/component is the `design/` folder at the repo root (an untracked, self-contained Next 14 app — not part of this app's build or `tsconfig` `include`). Treat its files as read-only reference; copy and adapt, don't edit in place.
- Confirmed via `grep -rln "from '@/templates/login'\|from '@/components/LoginPage'\|from '@/components/LoginForm'"`: only `src/templates/login.tsx`'s `LoginPage` is imported anywhere (by `src/app/[locale]/page.tsx`). `src/components/LoginPage.tsx`, `src/components/LoginForm.tsx`, and `src/components/LoginPage.withPassword.tsx` are dead code — never imported — and get deleted rather than migrated.
- `src/app/[locale]/auth/confirm/_route.ts`, `forgot-password/_page.tsx`, `invite/_page.tsx`, `reset-password/_page.tsx`, `verify/_page.tsx` are underscore-prefixed, meaning Next.js already excludes them from routing (they're disabled/WIP). Preserve the underscore prefix exactly when moving them — do not accidentally enable them.
- The existing `logout` server action (in `src/app/[locale]/auth/actions.ts`, moving to `src/app/auth/actions.ts`) already calls `supabase.auth.signOut()` then `redirect("/")`. Reuse it for the new profile page's sign-out button; do not write a new one.
- New color tokens (from `design/tailwind.config.ts`): `ink #12283F`, `ink-soft #1C3A57`, `ink-mute #9BB3B0`, `teal #6FB69B`, `teal-deep #3E8C71`, `paper #F7F8F6`, `line #E2E6E2`, `mist #EEF2EF`, `muted #7A8B93`, `danger #B4705A`.
- Archivo + IBM Plex Mono (the new design's typefaces) are scoped to the `/dashboard` subtree only via a dedicated `--font-dash-sans` / `--font-dash-mono` Tailwind theme pair (not the built-in `font-sans`/`font-mono`), so login/auth keep their current Geist font untouched. Every ported file's `font-mono` utility class becomes `font-dash-mono`.
- Every internal route in the ported design used a root-relative path (e.g. `/courses`, `/exercises/[ref]`, `/plan`). This app mounts the new screens under `/dashboard`, so every one of those paths gains a `/dashboard` prefix during porting (e.g. `/courses` → `/dashboard/courses`). This is easy to miss — each task below lists the exact hrefs to change.

---

### Task 1: Flatten route structure, delete the old dashboard subtree, simplify middleware

**Files:**
- Modify → Create: `src/app/layout.tsx` (merge in the real layout from `src/app/[locale]/layout.tsx`)
- Modify → Create: `src/app/page.tsx` (replace redirect stub with the actual login page content from `src/app/[locale]/page.tsx`)
- Create: `src/app/error/page.tsx` (moved from `src/app/[locale]/error/page.tsx`)
- Create: `src/app/auth/actions.ts`, `src/app/auth/callback/route.ts`, `src/app/auth/confirm/_route.ts`, `src/app/auth/forgot-password/_page.tsx`, `src/app/auth/invite/_page.tsx`, `src/app/auth/reset-password/_page.tsx`, `src/app/auth/verify/_page.tsx` (moved from `src/app/[locale]/auth/...`, contents unchanged)
- Modify: `src/middleware.ts`
- Modify: `src/templates/login.tsx` (fix one import path only — see Step 5)
- Delete: `src/app/[locale]/` in its entirety (layout.tsx, page.tsx, error/, auth/, dashboard/ — including `dashboard/actions.ts`, `dashboard/layout.tsx`, `dashboard/page.tsx`, `dashboard/beginner/`, `dashboard/intermediate/`, `dashboard/certification/`, `dashboard/exercises/`, `dashboard/weekly-planning/`, `dashboard/profile/`)
- Delete: `src/components/DashboardHeader.tsx`, `src/components/DashboardSidebar.tsx`, `src/components/ModuleCard.tsx`, `src/components/ModuleDetail.tsx`, `src/components/WeeklyPlanningCalendar.tsx` — confirmed via `grep -rln` that every importer of these is inside `src/app/[locale]/dashboard/` (being deleted in this same task), so nothing outside the deleted subtree references them.

**Interfaces:**
- Produces: `/`, `/error`, `/auth/callback`, `/auth/confirm` (disabled), `/auth/forgot-password` (disabled), `/auth/invite` (disabled), `/auth/reset-password` (disabled), `/auth/verify` (disabled) as live unprefixed routes. `/dashboard` and everything under it now 404 (page tree deleted) until Task 8 onward rebuilds it.
- Consumes: nothing from later tasks.

- [ ] **Step 1: Move the auth, error, and login route files**

```bash
mkdir -p src/app/auth
git mv "src/app/[locale]/auth/actions.ts" src/app/auth/actions.ts
git mv "src/app/[locale]/auth/callback" src/app/auth/callback
git mv "src/app/[locale]/auth/confirm" src/app/auth/confirm
git mv "src/app/[locale]/auth/forgot-password" src/app/auth/forgot-password
git mv "src/app/[locale]/auth/invite" src/app/auth/invite
git mv "src/app/[locale]/auth/reset-password" src/app/auth/reset-password
git mv "src/app/[locale]/auth/verify" src/app/auth/verify
git mv "src/app/[locale]/error" src/app/error
```

- [ ] **Step 2: Replace `src/app/page.tsx` with the login page content**

Delete the current contents of `src/app/page.tsx` (the `redirect(routing.defaultLocale)` stub) and replace with the full contents currently in `src/app/[locale]/page.tsx` (the video-background + `LoginPage` markup) — copy it verbatim, no changes needed to this file's own content.

Then remove the old file:

```bash
git rm "src/app/[locale]/page.tsx"
```

- [ ] **Step 3: Replace `src/app/layout.tsx` with the merged real layout**

Replace the contents of `src/app/layout.tsx` (currently the pass-through stub) with:

```tsx
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Fran Padel Project',
  description: 'Fran Methodology App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

(This drops `NextIntlClientProvider`/`getMessages`/`generateStaticParams` — there's only one locale now, and no messages to provide.)

Then remove the old locale layout:

```bash
git rm "src/app/[locale]/layout.tsx"
```

- [ ] **Step 4: Delete the entire old dashboard subtree and its exclusive components**

```bash
git rm -r "src/app/[locale]/dashboard"
git rm src/components/DashboardHeader.tsx
git rm src/components/DashboardSidebar.tsx
git rm src/components/ModuleCard.tsx
git rm src/components/ModuleDetail.tsx
git rm src/components/WeeklyPlanningCalendar.tsx
```

`src/app/[locale]/` should now be empty; remove the empty directory too:

```bash
rmdir "src/app/[locale]" 2>/dev/null || true
```

- [ ] **Step 5: Fix the one import path in `src/templates/login.tsx`**

This file imports `verifyOTPAndReturn` from the old locale-prefixed actions path. Change only this line (leave the `useTranslations`/`useLocale` calls in this file untouched — that cleanup is Task 2):

```tsx
// before
import { verifyOTPAndReturn } from "@/app/[locale]/auth/actions";
// after
import { verifyOTPAndReturn } from "@/app/auth/actions";
```

- [ ] **Step 6: Simplify `src/middleware.ts`**

Replace the full contents of `src/middleware.ts` with:

```ts
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const publicRoutes = [
  '/',
  '/auth/callback',
  '/auth/confirm',
  '/auth/reset-password',
  '/auth/invite',
  '/auth/forgot-password',
  '/auth/verify',
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (publicRoutes.includes(path)) {
    return response
  }

  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

This drops the `next-intl` middleware wrapping and all locale-extraction/redirect-loop-prevention logic — the Supabase session refresh + auth-gate check is all that's left, matched against plain paths.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`

Expected: Errors only in files not yet touched by this task that still reference `next-intl`/`@/i18n/*` (e.g. `src/components/LoginPage.tsx`, `LoginForm.tsx`, `LoginPage.withPassword.tsx`, `LanguageSwitcher.tsx`, `LocaleLink.tsx`, `src/templates/login.tsx`'s remaining `useTranslations` calls) — these are addressed in Tasks 2–3. There should be **zero** errors related to missing `src/app/[locale]/*` paths or the files this task moved/deleted.

- [ ] **Step 8: Manually verify**

Run `npm run dev`, visit `http://localhost:3000/`. Confirm the login screen renders (video background, logo, OTP form) with no console errors about missing modules. Visiting `http://localhost:3000/dashboard` should 404 (expected — rebuilt starting Task 8).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Flatten locale-prefixed routes to unprefixed paths, delete old dashboard subtree"
```

---

### Task 2: Remove translations from the live login screen, delete dead login variants

**Files:**
- Modify: `src/templates/login.tsx`
- Delete: `src/components/LoginPage.tsx`, `src/components/LoginForm.tsx`, `src/components/LoginPage.withPassword.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `src/templates/login.tsx` with zero `next-intl` imports; rendered text unchanged.

- [ ] **Step 1: Delete the three dead login component files**

Confirmed dead in Global Constraints (never imported outside themselves):

```bash
git rm src/components/LoginPage.tsx
git rm src/components/LoginForm.tsx
git rm src/components/LoginPage.withPassword.tsx
```

- [ ] **Step 2: Replace translation calls in `src/templates/login.tsx`**

Every `t('key') || 'fallback'` call's fallback already matches the current English translation (verified against `src/locales/en.json`'s `auth` namespace), and the calls without a fallback have their English value listed here too. Replace the whole file's contents with:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { verifyOTPAndReturn } from "@/app/auth/actions";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "otp">("email");
  const { signInWithOTP } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await signInWithOTP(email);

      if (error) {
        setError("User not found. Contact our team to create an account.");
        return;
      }

      setSuccess("Check your email for the verification code!");
      setStep("otp");
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("OTP send error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyOTPAndReturn(email, otp);

      if (!result.success) {
        setError(result.error ?? "An unexpected error occurred. Please try again.");
        setIsLoading(false);
        return;
      }

      // Hard redirect — server action already set the session cookies
      window.location.href = "/dashboard";
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("OTP verification error:", err);
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setError(null);
    setSuccess(null);
  };

  return (
    <Card className="border-0 shadow-none bg-white">
      <CardContent className="space-y-4">
        {step === "email" ? (
          <form onSubmit={handleSendOTP} className="space-y-4 mb-8">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-card-foreground font-medium"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input border-border focus:ring-2 focus:ring-accent focus:border-accent !font-normal"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-accent hover:cursor-pointer text-primary-foreground font-semibold py-2.5 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                "Send Code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-card-foreground mb-2">
                Enter Verification Code
              </h2>
              <p className="text-muted-foreground">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
            </div>

            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                {success}
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="otp" className="text-card-foreground font-medium">
                Verification Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="text-center text-lg tracking-widest bg-input border-border focus:ring-2 focus:ring-accent focus:border-accent"
                required
                disabled={isLoading}
                maxLength={6}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToEmail}
                className="flex-1 border-border hover:bg-muted bg-transparent hover:cursor-pointer"
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-accent hover:cursor-pointer text-primary-foreground font-semibold py-2.5 transition-colors"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href="#"
              className="text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Sign up here
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

(`LocaleLink` is replaced with a plain `<a>` here since its only use was a `href="#"` placeholder link — `LocaleLink` itself is deleted in Task 3.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`

Expected: Remaining errors only in `LanguageSwitcher.tsx` and `LocaleLink.tsx` (deleted next in Task 3). No errors in `src/templates/login.tsx` or anywhere else.

- [ ] **Step 4: Manually verify**

`npm run dev`, visit `/`. Confirm the email step and (after requesting a code) the OTP step both render identical text to before this change.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove next-intl from the live login screen, delete dead login variants"
```

---

### Task 3: Delete i18n scaffolding and the `next-intl` dependency

**Files:**
- Delete: `src/i18n/config.ts`, `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/locales/en.json`, `src/locales/pt.json`, `src/components/LanguageSwitcher.tsx`, `src/components/LocaleLink.tsx`
- Modify: `package.json` (remove `next-intl` dependency)

**Interfaces:**
- Consumes: nothing (this task only runs once every other `next-intl`/`@/i18n`/`LocaleLink` consumer has been removed in Tasks 1–2).
- Produces: zero `next-intl` references anywhere in `src/`.

- [ ] **Step 1: Confirm there are no remaining consumers**

Run: `grep -rln "next-intl\|@/i18n\|LocaleLink\|LanguageSwitcher" src`

Expected: only the files being deleted in this task appear (`src/i18n/*`, `src/locales/*`, `src/components/LanguageSwitcher.tsx`, `src/components/LocaleLink.tsx`). If anything else shows up, stop and investigate — it means an earlier task missed a reference.

- [ ] **Step 2: Delete the i18n scaffolding**

```bash
git rm -r src/i18n
git rm -r src/locales
git rm src/components/LanguageSwitcher.tsx
git rm src/components/LocaleLink.tsx
```

- [ ] **Step 3: Remove the `next-intl` dependency**

Remove the `"next-intl": "^4.5.0"` line from `package.json`'s `dependencies`, then:

```bash
npm install
```

(This updates `package-lock.json` to drop `next-intl` and its transitive deps.)

- [ ] **Step 4: Typecheck and build**

Run: `npx tsc --noEmit`
Expected: PASS, zero errors.

Run: `npm run build`
Expected: PASS. (This is the first full build since Task 1 — it will fail here if any route/import was missed during the flattening; treat any failure as a signal to re-check Tasks 1–2, not something to patch around.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove next-intl dependency and i18n scaffolding entirely"
```

---

### Task 4: Add the new design's tokens to `globals.css`

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: Tailwind utility classes `bg-ink`, `text-ink`, `bg-teal`, `text-teal-deep`, `bg-paper`, `border-line`, `bg-mist`, `text-muted`, `text-danger`, etc. (standard Tailwind color-token pattern), plus `font-dash-sans` and `font-dash-mono` for the scoped dashboard typography.

- [ ] **Step 1: Extend the `@theme` block**

In `src/app/globals.css`, add the following inside the existing `@theme { ... }` block (alongside the current `--color-p-*` tokens — don't remove those, nothing else has been repointed away from them):

```css
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

  --font-dash-sans: var(--font-archivo), system-ui, sans-serif;
  --font-dash-mono: var(--font-plex-mono), ui-monospace, monospace;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS (CSS-only change, shouldn't affect TypeScript, but confirms nothing else broke).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "Add new design's color and font tokens to globals.css"
```

---

### Task 5: Static placeholder data module

**Files:**
- Create: `src/lib/dashboard-data.ts`

**Interfaces:**
- Produces: types `Level`, `ModuleStatus`, `ContentSection`, `Module`, `Exercise`, `QuizQuestion`, `Day`; constants `MODULE_1_SECTIONS`, `MODULES`, `EXERCISES`, `QUIZ`, `DAYS`, `SHORT_DAY`, `DEFAULT_PLAN`, `USER`, `COURSE_STATS`; functions `getModule(id: string): Module | undefined`, `getExercise(ref: string): Exercise | undefined`. All of Tasks 8–15 import from this file.

- [ ] **Step 1: Create the data module**

Copy `design/lib/data.ts` verbatim into `src/lib/dashboard-data.ts` — no changes needed, it has no imports to adjust.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/dashboard-data.ts
git commit -m "Add static placeholder data module for the new dashboard"
```

---

### Task 6: Shared UI primitives

**Files:**
- Create: `src/components/dashboard/ui.tsx`

**Interfaces:**
- Consumes: `Module`, `Exercise` types from `@/lib/dashboard-data`.
- Produces: `ProgressBar`, `StatusBadge`, `Topic`, `Eyebrow`, `MediaPlaceholder`, `ExerciseCard`, `CategoryFilter` components, used across Tasks 8–15. `LanguageToggle` is intentionally **not** ported — there's no locale to switch.

- [ ] **Step 1: Create the component file**

Copy `design/components/ui.tsx` into `src/components/dashboard/ui.tsx` with these adjustments:
1. Import path: `import type { Exercise, Module } from "@/lib/data";` → `import type { Exercise, Module } from "@/lib/dashboard-data";`
2. Remove the `LanguageToggle` function entirely (no locale to switch), and remove the now-unused `import { useState } from "react";`. **Keep the `"use client"` directive at the top of the file** even though no remaining export uses a hook — `CategoryFilter`'s `onClick` handlers are safest kept inside an explicit client module rather than relying on inheriting client status from whichever page happens to render it.
3. Every `font-mono` class becomes `font-dash-mono` (three occurrences: `StatusBadge`, `Eyebrow`, and the two spans inside `MediaPlaceholder`).
4. `ExerciseCard`'s link target: `href={"/exercises/" + exercise.ref}` → `href={"/dashboard/exercises/" + exercise.ref}`.

The full resulting file:

```tsx
"use client";

import Link from "next/link";
import type { Exercise, Module } from "@/lib/dashboard-data";

export function ProgressBar({
  value,
  tone = "light",
}: {
  value: number;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={
        "h-1 w-full overflow-hidden rounded-full " +
        (tone === "dark" ? "bg-paper/15" : "bg-[#E9EDE9]")
      }
    >
      <div
        className={
          "h-full " + (tone === "dark" ? "bg-teal" : "bg-teal-deep")
        }
        style={{ width: value + "%" }}
      />
    </div>
  );
}

export function StatusBadge({ status }: { status: Module["status"] }) {
  const map = {
    done: "bg-teal-deep text-paper border-teal-deep",
    current: "text-teal-deep border-[#B9D9CB]",
    locked: "text-[#A3B0B7] border-line",
  } as const;
  const label = { done: "Done", current: "Active", locked: "Locked" }[status];
  return (
    <span
      className={
        "whitespace-nowrap rounded-full border px-2 py-1 font-dash-mono text-[10px] uppercase tracking-[0.08em] " +
        map[status]
      }
    >
      {label}
    </span>
  );
}

export function Topic({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-mist px-2 py-1 text-xs text-ink">
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">
      {children}
    </span>
  );
}

/** Striped placeholder standing in for exercise media. Swap for <Image /> once assets exist. */
export function MediaPlaceholder({
  label,
  reference,
  className = "",
  tone = "light",
}: {
  label: string;
  reference?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  const stripes =
    tone === "dark"
      ? "repeating-linear-gradient(135deg, rgba(247,248,246,0.07) 0 8px, transparent 8px 16px)"
      : "repeating-linear-gradient(135deg, rgba(18,40,63,0.07) 0 6px, transparent 6px 12px)";
  return (
    <div
      className={
        "flex items-end justify-between p-2.5 " +
        (tone === "dark" ? "bg-ink" : "bg-[#E7EBE7]") +
        " " +
        className
      }
      style={{ backgroundImage: stripes }}
    >
      <span
        className={
          "font-dash-mono text-[10px] tracking-[0.08em] " +
          (tone === "dark" ? "text-ink-mute" : "text-muted")
        }
      >
        {label}
      </span>
      {reference ? (
        <span
          className={
            "font-dash-mono text-[10px] " +
            (tone === "dark" ? "text-ink-mute" : "text-muted")
          }
        >
          {reference}
        </span>
      ) : null}
    </div>
  );
}

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      href={"/dashboard/exercises/" + exercise.ref}
      className="overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-teal"
    >
      <MediaPlaceholder
        label={exercise.media}
        reference={exercise.ref}
        className="h-24 lg:h-[140px]"
      />
      <div className="flex flex-col gap-1 px-3 pb-3 pt-2.5 lg:px-4 lg:pb-4">
        <div className="text-sm font-semibold leading-tight text-ink lg:text-[15px]">
          {exercise.title}
        </div>
        <div className="text-[11px] text-muted lg:text-xs">
          {exercise.category}
        </div>
      </div>
    </Link>
  );
}

export function CategoryFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {["All", "Technical", "Tactical"].map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={
            "rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors " +
            (value === c
              ? "border-ink bg-ink text-paper"
              : "border-line bg-white text-[#56666F] hover:border-teal")
          }
        >
          {c}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS (no consumers yet, but the file itself must compile standalone).

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ui.tsx
git commit -m "Port shared UI primitives for the new dashboard design"
```

---

### Task 7: App shell and dashboard layout

**Files:**
- Create: `src/components/dashboard/shell.tsx`
- Create: `src/app/dashboard/layout.tsx`

**Interfaces:**
- Consumes: `USER` from `@/lib/dashboard-data`.
- Produces: `AppShell` (wraps every dashboard page in Sidebar/BottomTabs), `PageHeader` (used by most dashboard pages for their title block). `DashboardLayout` is the Next.js layout that mounts `AppShell` and loads the scoped fonts — every route under `src/app/dashboard/` picks this up automatically.

- [ ] **Step 1: Create the shell component file**

Copy `design/components/shell.tsx` into `src/components/dashboard/shell.tsx` with these adjustments:
1. Import path: `import { USER } from "@/lib/data";` → `import { USER } from "@/lib/dashboard-data";`
2. Drop `import { LanguageToggle } from "@/components/ui";` and the `withLanguage`/`LanguageToggle` branch in `PageHeader` — there's no locale to switch.
3. Every NAV href gains a `/dashboard` prefix, and `isActive`/`BottomTabs` filtering follow suit.
4. `font-mono` → `font-dash-mono` (one occurrence, in `PageHeader`'s eyebrow).

The full resulting file:

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { USER } from "@/lib/dashboard-data";

const NAV = [
  { href: "/dashboard", label: "Dashboard", tab: "Home" },
  { href: "/dashboard/courses", label: "Courses", tab: "Courses" },
  { href: "/dashboard/exercises", label: "Exercises", tab: "Exercises" },
  { href: "/dashboard/plan", label: "Weekly plan", tab: "Plan" },
  { href: "/dashboard/profile", label: "Profile", tab: "Profile" },
];

const isActive = (pathname: string, href: string) =>
  href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-[248px] shrink-0 flex-col gap-8 bg-ink px-5 py-7">
      <Image
        src="/fran-methodology-logo.png"
        alt="Fran Methodology"
        width={200}
        height={100}
        className="h-10 w-auto brightness-0 invert opacity-95"
        priority
      />
      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors " +
              (isActive(pathname, item.href)
                ? "bg-teal/15 text-paper"
                : "text-ink-mute hover:text-paper")
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 border-t border-paper/10 pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal text-[13px] font-bold text-ink">
          {USER.initials}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-paper">{USER.name}</div>
          <div className="text-[11px] text-muted">{USER.club}</div>
        </div>
      </div>
    </aside>
  );
}

function BottomTabs() {
  const pathname = usePathname();
  const tabs = NAV.filter((n) => n.href !== "/dashboard/plan");
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white px-5 pb-7 pt-2.5 lg:hidden">
      {tabs.map((item) => {
        const on = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={
                "h-[18px] w-[18px] rounded-[5px] " +
                (on ? "bg-ink" : "bg-[#C9D2CD]")
              }
            />
            <span
              className={
                "text-[11px] font-semibold " + (on ? "text-ink" : "text-[#C9D2CD]")
              }
            >
              {item.tab}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1 pb-28 lg:pb-0">{children}</main>
      <BottomTabs />
    </div>
  );
}

/** Page header used on desktop views; hidden copy adapts on mobile. */
export function PageHeader({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        {eyebrow ? (
          <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-muted">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="mt-1.5 text-[27px] font-bold tracking-[-0.02em] text-ink lg:text-[34px] lg:tracking-[-0.025em]">
          {title}
        </h1>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the dashboard layout with scoped fonts**

Create `src/app/dashboard/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { AppShell } from "@/components/dashboard/shell";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Fran Methodology — Learn Padel",
  description:
    "Structured padel education: courses, exercises and weekly planning.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${archivo.variable} ${plexMono.variable} font-dash-sans`}>
      <AppShell>{children}</AppShell>
    </div>
  );
}
```

This scopes Archivo/IBM Plex Mono to everything under `/dashboard` without touching the root layout's Geist fonts.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` — expected PASS. (There's still no `src/app/dashboard/page.tsx`, so `/dashboard` itself 404s — that's expected until Task 8.)

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/shell.tsx src/app/dashboard/layout.tsx
git commit -m "Add app shell and font-scoped layout for the new dashboard"
```

---

### Task 8: Dashboard home page

**Files:**
- Create: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `COURSE_STATS`, `MODULES`, `USER` from `@/lib/dashboard-data`; `Eyebrow`, `ProgressBar`, `Topic` from `@/components/dashboard/ui`; `PageHeader` from `@/components/dashboard/shell`.

- [ ] **Step 1: Create the page**

Copy `design/app/page.tsx` into `src/app/dashboard/page.tsx` with these adjustments:
1. Import paths: `@/lib/data` → `@/lib/dashboard-data`; `@/components/ui` → `@/components/dashboard/ui`; `@/components/shell` → `@/components/dashboard/shell`.
2. `PageHeader`'s `withLanguage` prop is removed (Task 7 dropped that prop entirely) — drop `withLanguage` from the call site.
3. Link hrefs: `"/courses/" + current.id` → `"/dashboard/courses/" + current.id`; `"/courses/" + m.id` → `"/dashboard/courses/" + m.id`; `"/plan"` → `"/dashboard/plan"`.

The full resulting file:

```tsx
import Link from "next/link";
import Image from "next/image";
import { COURSE_STATS, MODULES, USER } from "@/lib/dashboard-data";
import { Eyebrow, ProgressBar, Topic } from "@/components/dashboard/ui";
import { PageHeader } from "@/components/dashboard/shell";

const WEEK = [
  { day: "MON", state: "done" },
  { day: "TUE", state: "empty" },
  { day: "WED", state: "today" },
  { day: "THU", state: "planned" },
  { day: "FRI", state: "empty" },
  { day: "SAT", state: "empty" },
] as const;

export default function DashboardPage() {
  const current = MODULES.find((m) => m.status === "current")!;

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-7">
        <div className="flex items-center justify-between lg:hidden">
          <Image
            src="/fran-methodology-logo.png"
            alt="Fran Methodology"
            width={200}
            height={100}
            className="h-[34px] w-auto"
            priority
          />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper">
            {USER.initials}
          </div>
        </div>

        <PageHeader
          eyebrow="Beginner course"
          title={"Good afternoon, " + USER.name.split(" ")[0]}
        />

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
          <div className="flex flex-col gap-4 rounded-[18px] bg-ink p-5 text-paper lg:p-6">
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-ink-mute">
              Course progress
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-[38px] font-extrabold tracking-[-0.03em] lg:text-[44px]">
                {COURSE_STATS.progress}%
              </span>
              <span className="text-sm text-ink-mute">
                {COURSE_STATS.modulesDone} of {COURSE_STATS.modulesTotal} modules
                complete
              </span>
            </div>
            <ProgressBar value={COURSE_STATS.progress} tone="dark" />
          </div>
          <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-white p-5 lg:p-6">
            <span className="text-[34px] font-bold text-ink">
              {COURSE_STATS.exercisesDone}
            </span>
            <span className="text-[13px] text-muted">Exercises completed</span>
          </div>
          <div className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-white p-5 lg:p-6">
            <span className="text-[34px] font-bold text-ink">
              {COURSE_STATS.averageQuiz}%
            </span>
            <span className="text-[13px] text-muted">Average quiz score</span>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-3">
            <Eyebrow>Continue where you left off</Eyebrow>
            <Link
              href={"/dashboard/courses/" + current.id}
              className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-white p-[18px] transition-colors hover:border-teal"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-ink">{current.title}</div>
                  <div className="mt-0.5 text-sm text-[#56666F]">
                    {current.description}
                  </div>
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
              {MODULES.slice(0, 5).map((m) => (
                <Link
                  key={m.id}
                  href={"/dashboard/courses/" + m.id}
                  className="flex items-center gap-4 rounded-[14px] border border-line bg-white px-4 py-4 transition-colors hover:border-teal"
                >
                  <span className="hidden min-w-[96px] font-dash-mono text-[11px] uppercase tracking-[0.08em] text-muted lg:inline">
                    {m.title}
                  </span>
                  <span className="flex-1 text-[15px] font-semibold text-ink">
                    {m.description}
                  </span>
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
                    "flex-1 rounded-xl border py-2.5 text-center " +
                    (d.state === "today"
                      ? "border-ink bg-ink"
                      : "border-line bg-white")
                  }
                >
                  <div
                    className={
                      "font-dash-mono text-[10px] " +
                      (d.state === "today" ? "text-ink-mute" : "text-muted")
                    }
                  >
                    {d.day}
                  </div>
                  <div
                    className={
                      "mx-auto mt-2 h-[7px] w-[7px] rounded-full " +
                      (d.state === "empty"
                        ? "bg-line"
                        : d.state === "today"
                          ? "bg-teal"
                          : "bg-teal-deep")
                    }
                  />
                </div>
              ))}
            </div>
            <div className="hidden flex-col gap-3.5 rounded-[18px] border border-line bg-white p-[18px] lg:flex">
              {[
                ["Monday", "Slice serve, elbow above 90º · Technical"],
                ["Wednesday", "Traffic light stop drill · Technical"],
                ["Thursday", "Glass exit, dominant side · Tactical"],
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
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS.

- [ ] **Step 3: Manually verify**

`npm run dev`, log in, confirm you land on `/dashboard` and it renders the progress card, continue-card, module list, and week strip with placeholder data matching `design/lib/data.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "Add new dashboard home page"
```

---

### Task 9: Courses list page

**Files:**
- Create: `src/app/dashboard/courses/page.tsx`

**Interfaces:**
- Consumes: `MODULES` from `@/lib/dashboard-data`; `ProgressBar`, `StatusBadge`, `Topic` from `@/components/dashboard/ui`; `PageHeader` from `@/components/dashboard/shell`.

- [ ] **Step 1: Create the page**

Copy `design/app/courses/page.tsx` into `src/app/dashboard/courses/page.tsx`, adjusting the import paths and the one internal link:

```tsx
import Link from "next/link";
import { MODULES } from "@/lib/dashboard-data";
import { ProgressBar, StatusBadge, Topic } from "@/components/dashboard/ui";
import { PageHeader } from "@/components/dashboard/shell";

const LEVELS = [
  { name: "Beginner", meta: "8 modules · 31% complete", active: true },
  { name: "Intermediate", meta: "Locked · finish Beginner first", active: false },
  { name: "Advanced", meta: "Locked", active: false },
];

export default function CoursesPage() {
  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
        <PageHeader eyebrow="Beginner course · 8 modules" title="Courses" />

        <div className="grid gap-2 lg:grid-cols-3 lg:gap-4">
          {LEVELS.map((l) => (
            <div
              key={l.name}
              className={
                "rounded-[18px] p-4 lg:p-[22px] " +
                (l.active
                  ? "bg-ink text-paper"
                  : "border border-line bg-white text-[#A3B0B7]")
              }
            >
              <div className="text-sm font-bold lg:text-lg">{l.name}</div>
              <div
                className={
                  "mt-1 text-[11px] lg:text-[13px] " +
                  (l.active ? "text-ink-mute" : "")
                }
              >
                {l.meta}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
          {MODULES.map((m) => (
            <Link
              key={m.id}
              href={"/dashboard/courses/" + m.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-teal lg:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-ink lg:text-[17px]">
                    {m.title}
                  </div>
                  <div className="mt-1 text-[13px] text-[#56666F] lg:text-sm">
                    {m.description}
                  </div>
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
                <span className="whitespace-nowrap font-dash-mono text-[11px] text-muted">
                  {m.duration}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

(Note the `font-mono` → `font-dash-mono` fix on the duration label.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS.

- [ ] **Step 3: Manually verify**

Visit `/dashboard/courses`. Confirm the three-level strip (Beginner active, Intermediate/Advanced locked) and the 8-module list render, and clicking a module navigates to `/dashboard/courses/module-N` (404 until Task 10 lands — expected).

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/courses/page.tsx
git commit -m "Add courses list page"
```

---

### Task 10: Course detail page

**Files:**
- Create: `src/app/dashboard/courses/[id]/page.tsx`

**Interfaces:**
- Consumes: `EXERCISES`, `MODULE_1_SECTIONS`, `MODULES`, `getModule` from `@/lib/dashboard-data`; `Eyebrow` from `@/components/dashboard/ui`.
- Produces: this is a Server Component with a `Promise`-typed `params` (Next 15) — Task 11 (quiz) is the only other task linking to this route shape.

- [ ] **Step 1: Create the page**

Copy `design/app/courses/[id]/page.tsx` into `src/app/dashboard/courses/[id]/page.tsx` with these adjustments:
1. Import path: `@/lib/data` → `@/lib/dashboard-data`; `@/components/ui` → `@/components/dashboard/ui`.
2. Next.js 15 async params: `params: { id: string }` → `params: Promise<{ id: string }>`, component becomes `async`, and `params.id` is replaced by an awaited destructure.
3. Links: `/courses` → `/dashboard/courses`; `/exercises` → `/dashboard/exercises`; `/courses/" + module.id + "/quiz"` → `/dashboard/courses/" + module.id + "/quiz"`.

The full resulting file:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { EXERCISES, MODULE_1_SECTIONS, MODULES, getModule } from "@/lib/dashboard-data";
import { Eyebrow } from "@/components/dashboard/ui";

export function generateStaticParams() {
  return MODULES.map((m) => ({ id: m.id }));
}

const MATERIALS = [
  { kind: "PDF", name: "Game Initiation Model — slides", meta: "4.2 MB" },
  { kind: "MP4", name: "Slice serve — court demo", meta: "6:12" },
];

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const module = getModule(id);
  if (!module) notFound();

  const sections = module.sections ?? MODULE_1_SECTIONS;
  const exercises = EXERCISES.filter((e) => e.moduleId === module.id);

  return (
    <div>
      <div className="bg-ink px-5 pb-6 pt-6 text-paper lg:px-10 lg:pb-10 lg:pt-9">
        <div className="mx-auto flex max-w-[880px] flex-col gap-3.5">
          <Link href="/dashboard/courses" className="text-[13px] text-ink-mute hover:text-paper">
            ← Beginner course
          </Link>
          <div>
            <div className="font-dash-mono text-[11px] uppercase tracking-[0.12em] text-teal">
              {module.title}
            </div>
            <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.02em] lg:text-[38px]">
              {module.description}
            </h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {module.topics.map((t) => (
              <span
                key={t}
                className="rounded-md bg-paper/10 px-2 py-1 text-xs"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex gap-5 text-xs text-ink-mute">
            <span>{module.duration}</span>
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
              <div
                key={doc.name}
                className="flex items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-3"
              >
                <span className="font-dash-mono text-[10px] font-semibold text-teal-deep">
                  {doc.kind}
                </span>
                <span className="flex-1 text-sm text-ink">{doc.name}</span>
                <span className="text-xs text-muted">{doc.meta}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            {sections.map((s) => (
              <section key={s.heading} className="flex flex-col gap-2">
                <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink lg:text-xl">
                  {s.heading}
                </h2>
                <ul className="flex flex-col gap-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span className="mt-2 h-[5px] w-[5px] shrink-0 rounded-full bg-teal" />
                      <span className="text-sm leading-relaxed text-[#3B4B54]">
                        {item}
                      </span>
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
              <span className="block text-[15px] font-bold text-ink">
                Module exercises
              </span>
              <span className="mt-0.5 block text-[13px] text-muted">
                {exercises.length} drills · 2 completed
              </span>
            </span>
            <span className="text-lg text-teal-deep">→</span>
          </Link>

          <div className="flex flex-col gap-3 rounded-2xl bg-mist p-[18px]">
            <div>
              <div className="text-[15px] font-bold text-ink">Knowledge check</div>
              <div className="mt-0.5 text-[13px] text-[#56666F]">
                4 questions · unlocks module completion
              </div>
            </div>
            <Link
              href={"/dashboard/courses/" + module.id + "/quiz"}
              className="rounded-full bg-ink py-3.5 text-center text-[15px] font-semibold text-paper"
            >
              Start knowledge check
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS.

- [ ] **Step 3: Manually verify**

Visit `/dashboard/courses/module-1`. Confirm the hero header, materials list, Module 1's real content sections, and both bottom links render. Visit `/dashboard/courses/module-3` (a module with no `sections` of its own) and confirm it falls back to showing Module 1's sections (this is the reference app's existing placeholder behavior, not a bug to fix).

- [ ] **Step 4: Commit**

```bash
git add "src/app/dashboard/courses/[id]/page.tsx"
git commit -m "Add course detail page"
```

---

### Task 11: Knowledge-check quiz page

**Files:**
- Create: `src/app/dashboard/courses/[id]/quiz/page.tsx`

**Interfaces:**
- Consumes: `QUIZ` from `@/lib/dashboard-data`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Create the page**

Copy `design/app/courses/[id]/quiz/page.tsx` into `src/app/dashboard/courses/[id]/quiz/page.tsx` with these adjustments:
1. Import path: `@/lib/data` → `@/lib/dashboard-data`.
2. This is a Client Component (`"use client"`), so Next 15's `Promise` params must be unwrapped with `use()` from `react`, not `await`: add `use` to the `react` import, change the prop type to `Promise<{ id: string }>`, and destructure via `const { id } = use(params);` instead of using `params.id` directly.
3. Links: `/courses/" + params.id` → `/dashboard/courses/" + id`; `/courses` → `/dashboard/courses`.

The full resulting file:

```tsx
"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { QUIZ } from "@/lib/dashboard-data";

export default function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () => QUIZ.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0),
    [answers],
  );
  const passed = score / QUIZ.length >= 0.75;
  const question = QUIZ[index];
  const picked = answers[index];

  const reset = () => {
    setAnswers({});
    setIndex(0);
    setSubmitted(false);
  };

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
                {Math.round((score / QUIZ.length) * 100)}%
              </span>
              <span className="text-[15px] text-ink-mute">
                {score} / {QUIZ.length} correct
              </span>
            </div>
            <span
              className={"text-sm " + (passed ? "text-teal" : "text-[#E2A87A]")}
            >
              {passed
                ? "Passed — module marked complete."
                : "Below 75% — review the material and try again."}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {QUIZ.map((q, i) => {
              const right = answers[i] === q.correct;
              return (
                <div
                  key={q.q}
                  className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-white px-4 py-3.5"
                >
                  <div className="text-sm font-semibold leading-snug text-ink">
                    {q.q}
                  </div>
                  {right ? (
                    <div className="text-[13px] text-teal-deep">
                      ✓ {q.options[answers[i]]}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="text-[13px] text-danger">
                        ✗ {q.options[answers[i]] ?? "Not answered"}
                      </div>
                      <div className="text-[13px] text-muted">
                        Correct: {q.options[q.correct]}
                      </div>
                    </div>
                  )}
                </div>
              );
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
    );
  }

  return (
    <div className="px-5 py-6 lg:px-10 lg:py-10">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            {index === 0 ? (
              <Link
                href={"/dashboard/courses/" + id}
                className="text-[13px] text-muted"
              >
                ← Back
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className="text-[13px] text-muted"
              >
                ← Back
              </button>
            )}
            <span className="font-dash-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              Question {index + 1} of {QUIZ.length}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#E9EDE9]">
            <div
              className="h-full bg-teal-deep transition-all"
              style={{ width: ((index + 1) / QUIZ.length) * 100 + "%" }}
            />
          </div>
        </div>

        <h1 className="text-[23px] font-bold leading-tight tracking-[-0.02em] text-ink lg:text-[28px]">
          {question.q}
        </h1>

        <div className="flex flex-col gap-2.5">
          {question.options.map((option, i) => {
            const on = picked === i;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setAnswers({ ...answers, [index]: i })}
                className={
                  "flex items-start gap-3 rounded-[14px] border px-4 py-4 text-left transition-colors " +
                  (on
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-white text-ink hover:border-teal")
                }
              >
                <span
                  className={
                    "pt-0.5 font-dash-mono text-xs " +
                    (on ? "text-teal" : "text-muted")
                  }
                >
                  {"ABC"[i]}
                </span>
                <span className="text-[15px] leading-snug">{option}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={picked === undefined}
          onClick={() =>
            index === QUIZ.length - 1 ? setSubmitted(true) : setIndex(index + 1)
          }
          className={
            "rounded-full py-3.5 text-[15px] font-semibold " +
            (picked === undefined
              ? "bg-[#E9EDE9] text-[#A3B0B7]"
              : "bg-ink text-paper")
          }
        >
          {picked === undefined
            ? "Select an answer"
            : index === QUIZ.length - 1
              ? "Submit"
              : "Continue"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS.

- [ ] **Step 3: Manually verify**

Visit `/dashboard/courses/module-1/quiz`. Answer all 4 questions, submit, confirm the score/pass-fail summary renders and "Retake" resets state.

- [ ] **Step 4: Commit**

```bash
git add "src/app/dashboard/courses/[id]/quiz/page.tsx"
git commit -m "Add knowledge-check quiz page"
```

---

### Task 12: Exercises list page

**Files:**
- Create: `src/app/dashboard/exercises/page.tsx`

**Interfaces:**
- Consumes: `EXERCISES` from `@/lib/dashboard-data`; `CategoryFilter`, `ExerciseCard` from `@/components/dashboard/ui`; `PageHeader` from `@/components/dashboard/shell`.

- [ ] **Step 1: Create the page**

Copy `design/app/exercises/page.tsx` into `src/app/dashboard/exercises/page.tsx`, adjusting only the import paths (no hrefs of its own — `ExerciseCard` already points at `/dashboard/exercises/[ref]` per Task 6):

```tsx
"use client";

import { useState } from "react";
import { EXERCISES } from "@/lib/dashboard-data";
import { CategoryFilter, ExerciseCard } from "@/components/dashboard/ui";
import { PageHeader } from "@/components/dashboard/shell";

export default function ExercisesPage() {
  const [category, setCategory] = useState("All");
  const list =
    category === "All"
      ? EXERCISES
      : EXERCISES.filter((e) => e.category === category);

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
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS.

- [ ] **Step 3: Manually verify**

Visit `/dashboard/exercises`. Confirm all 8 placeholder exercises render, and the Technical/Tactical/All filter narrows the grid correctly.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/exercises/page.tsx
git commit -m "Add exercises list page"
```

---

### Task 13: Exercise detail page

**Files:**
- Create: `src/app/dashboard/exercises/[ref]/page.tsx`

**Interfaces:**
- Consumes: `EXERCISES`, `getExercise`, `getModule` from `@/lib/dashboard-data`; `MediaPlaceholder`, `Topic` from `@/components/dashboard/ui`.

- [ ] **Step 1: Create the page**

Copy `design/app/exercises/[ref]/page.tsx` into `src/app/dashboard/exercises/[ref]/page.tsx` with these adjustments:
1. Import paths: `@/lib/data` → `@/lib/dashboard-data`; `@/components/ui` → `@/components/dashboard/ui`.
2. Next.js 15 async params, same pattern as Task 10.
3. Links: `/exercises` → `/dashboard/exercises`; `/plan` → `/dashboard/plan`.

The full resulting file:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { EXERCISES, getExercise, getModule } from "@/lib/dashboard-data";
import { MediaPlaceholder, Topic } from "@/components/dashboard/ui";

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ ref: e.ref }));
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const exercise = getExercise(ref);
  if (!exercise) notFound();
  const module = getModule(exercise.moduleId);

  return (
    <div>
      <div className="relative">
        <MediaPlaceholder
          label={exercise.media + " · full-screen media placeholder"}
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
          <p className="text-[15px] leading-relaxed text-[#3B4B54]">
            {exercise.description}
          </p>
          <div className="flex gap-2">
            <Topic>{module?.title ?? "Module"}</Topic>
            <Topic>{exercise.duration}</Topic>
          </div>
          <div className="mt-2 flex gap-2.5">
            <button
              type="button"
              className="flex-1 rounded-full bg-ink py-3.5 text-[15px] font-semibold text-paper"
            >
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
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS.

- [ ] **Step 3: Manually verify**

Visit `/dashboard/exercises/EX-01`. Confirm the full-bleed media placeholder, title/description, topic chips, and both action buttons render, and "← Back" returns to the exercises list.

- [ ] **Step 4: Commit**

```bash
git add "src/app/dashboard/exercises/[ref]/page.tsx"
git commit -m "Add exercise detail page"
```

---

### Task 14: Weekly plan page

**Files:**
- Create: `src/app/dashboard/plan/page.tsx`

**Interfaces:**
- Consumes: `DAYS`, `DEFAULT_PLAN`, `EXERCISES`, `SHORT_DAY`, `Day`, `getExercise` from `@/lib/dashboard-data`; `PageHeader` from `@/components/dashboard/shell`.

- [ ] **Step 1: Create the page**

Copy `design/app/plan/page.tsx` into `src/app/dashboard/plan/page.tsx`, adjusting the import paths and the two `font-mono` occurrences (no hrefs to change — this page has no cross-page links):

```tsx
"use client";

import { useState } from "react";
import {
  DAYS,
  DEFAULT_PLAN,
  EXERCISES,
  SHORT_DAY,
  type Day,
  getExercise,
} from "@/lib/dashboard-data";
import { PageHeader } from "@/components/dashboard/shell";

export default function PlanPage() {
  const [plan, setPlan] = useState<Record<Day, string[]>>(DEFAULT_PLAN);
  const [dragging, setDragging] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const add = (day: Day, ref: string | null) => {
    if (!ref || plan[day].includes(ref)) return;
    setPlan({ ...plan, [day]: [...plan[day], ref] });
  };

  const remove = (day: Day, ref: string) =>
    setPlan({ ...plan, [day]: plan[day].filter((r) => r !== ref) });

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-5">
        <PageHeader
          eyebrow="Drag exercises into a day"
          title="Weekly plan"
        />
        <p className="text-[13px] text-muted lg:hidden">
          {picked ? "Now tap a day to add it" : "Tap an exercise, then a day"}
        </p>

        {/* Mobile: tap-to-assign tray */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
          {EXERCISES.map((e) => (
            <button
              key={e.ref}
              type="button"
              onClick={() => setPicked(picked === e.ref ? null : e.ref)}
              className={
                "whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold " +
                (picked === e.ref
                  ? "border-teal-deep bg-teal-deep text-paper"
                  : "border-line bg-white text-[#56666F]")
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
            {EXERCISES.map((e) => (
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
            {DAYS.map((day) => (
              <div
                key={day}
                onClick={() => {
                  add(day, picked);
                  setPicked(null);
                }}
                onDragOver={(ev) => ev.preventDefault()}
                onDrop={(ev) => {
                  ev.preventDefault();
                  add(day, dragging);
                  setDragging(null);
                }}
                className="flex flex-col gap-2 rounded-[14px] border border-line bg-white p-3 lg:min-h-[320px]"
              >
                <span className="font-dash-mono text-[10px] tracking-[0.1em] text-muted">
                  {SHORT_DAY[day]}
                </span>
                {plan[day].map((ref) => {
                  const e = getExercise(ref);
                  return (
                    <button
                      key={ref}
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        remove(day, ref);
                      }}
                      className="flex items-center justify-between gap-2 rounded-[10px] bg-mist p-2.5 text-left text-xs leading-snug text-ink"
                    >
                      <span>{e?.title ?? ref}</span>
                      <span className="text-muted">×</span>
                    </button>
                  );
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
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS.

- [ ] **Step 3: Manually verify**

Visit `/dashboard/plan`. On desktop width, drag an exercise from the library into a day column and confirm it appears (and removes on click). On mobile width, tap an exercise chip then tap a day and confirm the same.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/plan/page.tsx
git commit -m "Add weekly plan page"
```

---

### Task 15: Profile page with real sign-out

**Files:**
- Create: `src/app/dashboard/profile/page.tsx`

**Interfaces:**
- Consumes: `USER` from `@/lib/dashboard-data`; `logout` from `@/app/auth/actions`.

- [ ] **Step 1: Create the page**

Copy `design/app/profile/page.tsx` into `src/app/dashboard/profile/page.tsx` with these adjustments:
1. Drop `LanguageToggle` import and its row entirely (Task 6 doesn't export it).
2. Wire the "Sign out" button to the real `logout` server action via a `<form action={logout}>` instead of a bare inert `<button>`.

The full resulting file:

```tsx
import { USER } from "@/lib/dashboard-data";
import { logout } from "@/app/auth/actions";

export default function ProfilePage() {
  const rows = [
    ["Email", USER.email],
    ["Level", USER.level],
    ["Age", String(USER.age)],
    ["Club", USER.club],
  ];

  return (
    <div className="px-5 pt-6 lg:px-10 lg:pt-9">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div className="flex items-center gap-4 lg:gap-[18px]">
          <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-ink text-xl font-bold text-paper lg:h-[76px] lg:w-[76px] lg:text-2xl">
            {USER.initials}
          </div>
          <div>
            <h1 className="text-[21px] font-bold tracking-[-0.02em] text-ink lg:text-[28px]">
              {USER.name}
            </h1>
            <div className="mt-0.5 text-[13px] text-muted lg:text-sm">
              {USER.club} · Member since {USER.memberSince}
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-white px-5 py-2">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex justify-between border-b border-[#E9EDE9] py-3.5 last:border-0"
            >
              <span className="text-sm text-muted">{label}</span>
              <span className="text-sm text-ink">{value}</span>
            </div>
          ))}
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-full border border-line py-3.5 text-[15px] font-semibold text-danger"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit` — expected PASS.

- [ ] **Step 3: Manually verify**

Visit `/dashboard/profile`. Confirm the placeholder user's fields render (no language row). Click "Sign out" and confirm it actually signs out and lands back on `/`.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/profile/page.tsx
git commit -m "Add profile page with real sign-out wiring"
```

---

### Task 16: Final verification and reference-folder cleanup

**Files:**
- Delete: `design/` (the untracked reference implementation — fully ported by this point)

**Interfaces:** none — this is a verification-only task plus removing a now-redundant reference folder.

- [ ] **Step 1: Full build**

Run: `npm run build`

Expected: PASS with no type or route errors. Fix anything that surfaces before proceeding — do not skip past a build failure.

- [ ] **Step 2: Lint**

Run: `npm run lint`

Expected: PASS (or only pre-existing warnings unrelated to this migration).

- [ ] **Step 3: Full manual walkthrough**

Run `npm run dev` and, in a browser, walk through the entire flow end to end:
1. `/` — log in via OTP.
2. `/dashboard` — dashboard home renders.
3. `/dashboard/courses` → click into a module → `/dashboard/courses/module-1`.
4. Start the knowledge check, submit, retake.
5. `/dashboard/exercises` → filter by category → open a detail page → "Add to plan" link → `/dashboard/plan`.
6. On `/dashboard/plan`, assign and remove an exercise from a day.
7. `/dashboard/profile` → sign out → confirm you land back on `/` and `/dashboard` now redirects to `/` (auth gate still enforced).
8. Try a stale locale-prefixed URL like `/en/dashboard` directly — confirm it 404s (expected, per the design spec's "skip redirect, let them 404" decision).

- [ ] **Step 4: Remove the reference folder**

The `design/` folder's own README states its purpose was to be copied into the real app ("if you already have an app, copy `components/` + `lib/data.ts` and the bodies of the `app/**/page.tsx` files into your own router"). That's now done, and it was never committed to git (still untracked per `git status`), so removing it doesn't touch history:

```bash
rm -rf design
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git status
git commit -m "Remove ported design reference folder"
```
