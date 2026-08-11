# Login Page Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Rails Auth/Login page the same visual chrome as the Next.js app's login screen — full-screen video background, dark overlay, centered logo, and a styled card — without touching the working email/password form's functional wiring.

**Architecture:** Pure presentational change to `app/frontend/pages/Auth/Login.tsx` plus one new font addition to the shared layout/CSS entrypoint. No controller, route, or Devise changes — `SessionsController` and its specs are untouched.

**Tech Stack:** Same as the rest of the Rails app (Inertia + React + Tailwind v4).

## Global Constraints

- Functional behavior of login (fields, submit, error display, POST target) stays exactly as it is today — only visuals change.
- Video is the same externally-hosted Contentful URL the Next.js app already uses — no local asset, no re-hosting.
- The Next.js page's dark overlay (`bg-popover`) is actually broken on this branch (the CSS variable is never defined) — implement a real, working overlay instead of copying that broken class.
- Reuse the `ink`/`teal`/`paper` tokens already in the Rails theme (from the dashboard port) for the card/form styling — don't introduce the unused shadcn/Radix component stack.
- Geist Sans/Mono (the Next.js login page's actual font, distinct from the dashboard's Archivo/IBM Plex Mono) becomes the Rails app's site-wide default font; the dashboard's existing `font-dash-sans` class on `AppShell` continues to override it for authenticated pages — mirrors the Next.js app's actual font structure.
- No new automated tests — this is a presentational change with no new logic; the existing `spec/requests/sessions_spec.rb` (unchanged) continues to prove the functional behavior. Verify visually via `bin/dev`.

---

## File Structure

```
rails/
  public/
    fran-padel-project-logo.svg     # NEW: copied from the Next.js app's public/
  app/
    frontend/
      entrypoints/
        application.css             # MODIFIED: + Geist font tokens, site-wide default
      pages/
        Auth/Login.tsx               # MODIFIED: video background, overlay, logo, card, restyled form
    views/layouts/
      application.html.erb          # MODIFIED: + Geist Google Fonts link
```

---

### Task 1: Add video background, logo, card styling, and Geist font to the login page

**Files:**
- Create: `rails/public/fran-padel-project-logo.svg`
- Modify: `rails/app/frontend/entrypoints/application.css`, `rails/app/views/layouts/application.html.erb`, `rails/app/frontend/pages/Auth/Login.tsx`

**Interfaces:**
- Consumes: nothing new — `SessionsController#new`'s existing `render inertia: "Auth/Login", props: { errors: {} }` prop shape is unchanged.
- Produces: nothing new for later tasks — this is the last planned piece of the login page.

- [ ] **Step 1: Copy the logo asset**

```bash
cp "public/fran-padel-project-logo.svg" "rails/public/fran-padel-project-logo.svg"
```

(run from the repo root)

- [ ] **Step 2: Add Geist as the site-wide default font**

Edit `rails/app/frontend/entrypoints/application.css`, adding to the existing `@theme` block (alongside `--font-dash-sans`/`--font-dash-mono`):

```css
  --font-sans: "Geist", system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
```

Tailwind's default `font-sans`/`font-mono` utilities (and the browser default body font) now resolve to Geist; `AppShell`'s `font-dash-sans` class continues to override this for dashboard pages, exactly like the Next.js app's global Geist + dashboard-scoped Archivo/IBM Plex Mono split.

- [ ] **Step 3: Load the Geist fonts**

Edit `rails/app/views/layouts/application.html.erb`, adding a second Google Fonts `<link>` alongside the existing Archivo/IBM Plex Mono one:

```erb
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet">
```

- [ ] **Step 4: Rebuild the login page with the new chrome**

Replace `rails/app/frontend/pages/Auth/Login.tsx`:

```tsx
import { useForm } from '@inertiajs/react'
import { FormEvent } from 'react'

interface Props {
  errors: { base?: string }
}

export default function Login({ errors }: Props) {
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
            alt="Padel Academy"
            width={260}
            height={200}
            className="mx-auto mb-8"
          />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-white p-6">
            {errors.base && (
              <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {errors.base}
              </p>
            )}
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Email
              <input
                type="email"
                value={data.user.email}
                onChange={(e) => setData('user', { ...data.user, email: e.target.value })}
                className="rounded-lg border border-line px-3 py-2.5 text-ink focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Password
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
              {processing ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run the existing sessions spec to confirm functional behavior is unchanged**

```bash
cd rails && bundle exec rspec spec/requests/sessions_spec.rb
```

Expected: PASS, 5 examples (unchanged from before this task).

- [ ] **Step 6: Manually verify visually**

```bash
bin/dev
```

Visit the login page and confirm: the video plays full-screen with a dark overlay, the logo is centered above a white card, the email/password fields and submit button are legibly styled, and logging in with `client@example.com` / `password123` still redirects to the dashboard. Stop `bin/dev`.

- [ ] **Step 7: Commit**

```bash
git add rails/public/fran-padel-project-logo.svg rails/app/frontend/entrypoints/application.css \
  rails/app/views/layouts/application.html.erb rails/app/frontend/pages/Auth/Login.tsx
git commit -m "Port the Next.js login page's video/logo/card chrome"
```
