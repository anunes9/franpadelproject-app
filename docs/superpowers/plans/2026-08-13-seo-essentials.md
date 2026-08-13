# SEO Essentials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the app's one public page (the `/` login screen) correct technical SEO: a `robots.txt` that keeps crawlers out of gated routes, a `sitemap.xml` listing the public URL, and real meta/Open Graph tags plus a social preview image on the login page.

**Architecture:** Two static files served directly from `public/` (`robots.txt`, `sitemap.xml`), a generated `public/og-image.png` social preview asset, and meta tags injected into the login page's real server response via the Rails layout's existing (currently unused) `content_for(:title)` / `content_for(:head)` hooks — not Inertia's `<Head>` component, because Inertia SSR is not actually enabled in this app (verified: `GET /`'s raw body is a ~2KB `data-page` JSON shell with none of the rendered form markup), so anything added via React's `<Head>` would be invisible to non-JS crawlers and social-preview bots.

**Tech Stack:** Rails 8, RSpec request specs, `@inertiajs/react` (untouched by this plan), Chrome browser automation (one-off asset generation only).

## Global Constraints

- Production domain is `https://app.franpadelproject.com` — used verbatim in `robots.txt`, `sitemap.xml`, the canonical link, `og:url`, and `og:image`. (Spec: Overview)
- All public-facing copy is Portuguese-only; anonymous visitors never see an English variant. (Spec: Goals)
- No new marketing/landing page, no `llms.txt`, no JSON-LD structured data, no `sitemap_generator` gem, no hreflang alternates. (Spec: Non-goals)
- No changes to gated pages (no `noindex` meta, no per-page SEO there) — `robots.txt` already excludes them. (Spec: Non-goals)
- The OG image is exactly 1200×630px, composed from `public/fran-methodology-logo.png` centered on `#12283f` (the app's `--color-ink`). (Spec: OG image)
- Meta tags must appear in the raw HTML Rails sends back — not only after client-side JS runs. (Spec: Meta tags correction)

---

### Task 1: `robots.txt` and `sitemap.xml`

**Files:**
- Modify: `public/robots.txt` (exists, currently only default boilerplate comments)
- Create: `public/sitemap.xml`
- Create: `spec/requests/seo_spec.rb`

**Interfaces:**
- Produces: nothing consumed by other tasks — these are static files served directly by Rails' default static-file handling, no route or controller involved.
- Consumes: nothing from other tasks.

- [ ] **Step 1: Write the failing request spec**

Create `spec/requests/seo_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "SEO crawler files", type: :request do
  describe "GET /robots.txt" do
    it "disallows gated routes and points at the sitemap" do
      get "/robots.txt"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("Disallow: /dashboard")
      expect(response.body).to include("Disallow: /admin")
      expect(response.body).to include("Disallow: /users")
      expect(response.body).to include("Sitemap: https://app.franpadelproject.com/sitemap.xml")
    end
  end

  describe "GET /sitemap.xml" do
    it "lists the public root URL" do
      get "/sitemap.xml"

      expect(response).to have_http_status(:ok)
      expect(response.body).to include("<loc>https://app.franpadelproject.com/</loc>")
    end
  end
end
```

- [ ] **Step 2: Run the spec and confirm it fails**

Run: `bundle exec rspec spec/requests/seo_spec.rb`
Expected: FAIL — `GET /robots.txt` returns 404 or a body without the expected lines (the file is currently empty boilerplate); `GET /sitemap.xml` returns 404 (file doesn't exist yet).

- [ ] **Step 3: Write `public/robots.txt`**

Replace the entire contents of `public/robots.txt` with:

```
User-agent: *
Disallow: /dashboard
Disallow: /admin
Disallow: /users

Sitemap: https://app.franpadelproject.com/sitemap.xml
```

- [ ] **Step 4: Write `public/sitemap.xml`**

Create `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://app.franpadelproject.com/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 5: Run the spec and confirm it passes**

Run: `bundle exec rspec spec/requests/seo_spec.rb`
Expected: PASS (2 examples, 0 failures)

- [ ] **Step 6: Commit**

```bash
git add public/robots.txt public/sitemap.xml spec/requests/seo_spec.rb
git commit -m "Add robots.txt disallow rules and a sitemap for the public login page"
```

---

### Task 2: Generate `public/og-image.png`

**Files:**
- Create (temporary, deleted at end of task): `tmp/og_image_source.html`
- Create: `public/og-image.png`

**Interfaces:**
- Produces: `public/og-image.png`, a 1200×630 PNG — Task 3's meta tags reference this file by URL (`https://app.franpadelproject.com/og-image.png`) but do not depend on its byte content, so Task 3 can technically run before or after this task. Doing this task first means the reference is backed by a real file by the time Task 3 ships.
- Consumes: `public/fran-methodology-logo.png` (already exists, 506×286 PNG).

This task requires the `claude-in-chrome` Chrome browser automation tools. If those tools aren't loaded yet, run `ToolSearch` with `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__resize_window,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__tabs_close_mcp,mcp__claude-in-chrome__browser_batch` before Step 1.

**Two things did not work as originally assumed, discovered while executing this task — both are baked into the steps below:**
- The extension refuses to navigate to `file://` URLs at all ("Can't interact with browser-internal or unparseable URLs"). Serve the page over local HTTP instead of opening it directly from disk.
- The logo's second line ("METHODOLOGY") is dark navy — nearly invisible against the `#12283f` ink background originally specified. Use the light `--color-paper` (`#f7f8f6`) background instead so both lines of the logo stay legible.

- [ ] **Step 1: Write the source HTML**

Create `tmp/og_image_source.html`:

```html
<!DOCTYPE html>
<html>
<head>
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    background: #f7f8f6;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  img {
    width: 640px;
    height: auto;
  }
</style>
</head>
<body>
  <img src="/public/fran-methodology-logo.png">
</body>
</html>
```

`html`/`body` are sized to `100vw`/`100vh` (not a fixed pixel box) so the flex centering is relative to whatever the actual browser viewport turns out to be — a fixed size here left extra unaccounted space below the box and pushed the visual center upward.

- [ ] **Step 2: Serve the file over local HTTP**

`file://` navigation is blocked (see above), and a `data:` URL page can't load a local image either, so serve the repo root on a local port instead:

```bash
python3 -m http.server 8765 --directory . > /tmp/og_httpd.log 2>&1 &
sleep 1
curl -sI http://localhost:8765/tmp/og_image_source.html | head -1
```

Expected output: `HTTP/1.0 200 OK`. (`ruby -run -e httpd` is an alternative but requires the `webrick` gem, which isn't installed on this machine — `python3 -m http.server` needs nothing extra.)

- [ ] **Step 3: Open the page and screenshot it**

Call `mcp__claude-in-chrome__tabs_context_mcp` with `{"createIfEmpty": true}` to get a `tabId`, then in one `mcp__claude-in-chrome__browser_batch` call:

```json
[
  {"name": "navigate", "input": {"tabId": <tab id>, "url": "http://localhost:8765/tmp/og_image_source.html"}},
  {"name": "resize_window", "input": {"tabId": <tab id>, "width": 1450, "height": 850}},
  {"name": "computer", "input": {"action": "screenshot", "tabId": <tab id>}}
]
```

Look at the returned screenshot: confirm the logo is legible (dark text visible against the light background) and roughly centered. Note the screenshot's reported pixel dimensions (e.g. `1400x858`) — the actual rendered viewport is usually a bit taller than the `resize_window` height due to browser chrome, and the crop region in the next step must be centered on the *real* dimensions, not the requested ones.

- [ ] **Step 4: Capture a centered crop around the target 1200×630 aspect ratio**

Using the actual screenshot dimensions from Step 3 (`W×H`), compute a centered region: `x0 = (W-1200)/2`, `x1 = x0+1200`, `y0 = (H-630)/2`, `y1 = y0+630`. Call `mcp__claude-in-chrome__computer` with `{"action": "zoom", "tabId": <tab id>, "region": [x0, y0, x1, y1], "save_to_disk": true}`.

The `zoom` action does not necessarily return an image at exactly the requested pixel size — it may scale up uniformly (e.g. requesting a 1200×630 region back returned a 1512×795 PNG, a consistent ~1.26× scale-up that preserves the aspect ratio). Note the saved file path from the tool result; Step 6 corrects the final size regardless of what this returns.

- [ ] **Step 5: Look at the crop before finalizing**

Read the saved image (the path from Step 4's result) and visually confirm the logo is centered and both lines are legible before proceeding — cheaper to redo Step 3's `resize_window`/crop math now than after resizing and committing a bad image.

- [ ] **Step 6: Resize to exactly 1200×630 and verify**

There's no ImageMagick/libvips on this machine, but macOS ships `sips`, which needs no extra install:

```bash
sips -z 630 1200 <path from Step 4> --out public/og-image.png
ruby -e '
  data = File.binread("public/og-image.png")
  width, height = data[16, 8].unpack("N2")
  puts "#{width}x#{height}"
'
```

Expected output: `1200x630` (verified by reading the PNG's `IHDR` chunk directly — the two 4-byte big-endian integers at byte offset 16 — rather than relying on a missing image-inspection binary).

- [ ] **Step 7: Clean up the tab, temp file, and local server**

```bash
lsof -ti:8765 | xargs -r kill
rm tmp/og_image_source.html
```

Call `mcp__claude-in-chrome__tabs_close_mcp` with the tab ID from Step 3.

- [ ] **Step 8: Commit**

```bash
git add public/og-image.png
git commit -m "Add Open Graph social preview image"
```

---

### Task 3: Meta tags on the login page

**Files:**
- Modify: `app/controllers/sessions_controller.rb`
- Modify: `app/views/layouts/application.html.erb`
- Create: `app/views/sessions/_seo_meta.html.erb`
- Modify: `spec/requests/sessions_spec.rb`

**Interfaces:**
- Consumes: `app/views/layouts/application.html.erb`'s existing `content_for(:title)` read (line 4) and `<%= yield :head %>` (line 12) — both already present in the layout and, before this task, unused by any controller.
- Produces: nothing consumed by other tasks (this is the last task).

- [ ] **Step 1: Write the failing request specs**

Append to `spec/requests/sessions_spec.rb` (inside the existing `RSpec.describe "Sessions", type: :request do ... end` block, after the last existing example):

```ruby
  it "includes a meta description, canonical link, and Open Graph tags" do
    get "/"

    expect(response.body).to include('<meta name="description" content="Curso de padel online com módulos de vídeo, exercícios técnicos e táticos, testes de conhecimentos e plano de treino semanal personalizado.">')
    expect(response.body).to include('<link rel="canonical" href="https://app.franpadelproject.com/">')
    expect(response.body).to include('<meta property="og:image" content="https://app.franpadelproject.com/og-image.png">')
  end

  it "sets a descriptive page title" do
    get "/"

    expect(response.body).to include("<title data-inertia>Fran Padel Academy — Curso de Padel Online</title>")
  end
```

- [ ] **Step 2: Run the specs and confirm they fail**

Run: `bundle exec rspec spec/requests/sessions_spec.rb -e "meta description" -e "descriptive page title"`
Expected: FAIL — the response body has none of the new meta tags, and the title is still the layout's static default "Fran Padel Academy".

- [ ] **Step 3: Write the SEO meta partial**

Create `app/views/sessions/_seo_meta.html.erb`:

```erb
<meta name="description" content="Curso de padel online com módulos de vídeo, exercícios técnicos e táticos, testes de conhecimentos e plano de treino semanal personalizado.">
<link rel="canonical" href="https://app.franpadelproject.com/">
<meta property="og:type" content="website">
<meta property="og:title" content="Fran Padel Academy">
<meta property="og:description" content="Curso de padel online com módulos de vídeo, exercícios técnicos e táticos, testes de conhecimentos e plano de treino semanal personalizado.">
<meta property="og:url" content="https://app.franpadelproject.com/">
<meta property="og:image" content="https://app.franpadelproject.com/og-image.png">
<meta property="og:locale" content="pt_PT">
<meta name="twitter:card" content="summary_large_image">
```

- [ ] **Step 4: Wire it up in `SessionsController#new`**

`content_for` is a view-only helper — it's not callable from inside a
controller action. Use instance variables instead; the layout already
reads them from the controller during rendering. In
`app/controllers/sessions_controller.rb`, change:

```ruby
  def new
    render inertia: "Auth/Login", props: { errors: flash[:alert] ? { base: "invalid_credentials" } : {} }
  end
```

to:

```ruby
  def new
    @title = "Fran Padel Academy — Curso de Padel Online"
    @head_partial = "sessions/seo_meta"
    render inertia: "Auth/Login", props: { errors: flash[:alert] ? { base: "invalid_credentials" } : {} }
  end
```

And in `app/views/layouts/application.html.erb`, change line 4 from:

```erb
<title data-inertia><%= content_for(:title) || "Fran Padel Academy" %></title>
```

to:

```erb
<title data-inertia><%= @title || content_for(:title) || "Fran Padel Academy" %></title>
```

and add a line right after `<%= yield :head %>` (line 12):

```erb
<%= render @head_partial if @head_partial %>
```

- [ ] **Step 5: Run the specs and confirm they pass**

Run: `bundle exec rspec spec/requests/sessions_spec.rb`
Expected: PASS (all examples in the file, including the two new ones)

- [ ] **Step 6: Run the full suite**

Run: `bundle exec rspec`
Expected: PASS, 0 failures — confirms nothing else regressed (e.g. the "already-authenticated visitor" redirect example, which never reaches the `content_for` calls, is unaffected).

- [ ] **Step 7: Commit**

```bash
git add app/controllers/sessions_controller.rb app/views/sessions/_seo_meta.html.erb spec/requests/sessions_spec.rb
git commit -m "Serve meta description, canonical link, and Open Graph tags on the login page"
```
