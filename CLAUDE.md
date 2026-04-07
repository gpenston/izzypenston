# Izzy Penston Memorial Site

## Project
Static memorial website at izzypenston.com. Pure HTML/CSS/vanilla JS — no frameworks, no build tools. Hosted on GitHub Pages with Cloudflare DNS (proxied).

## Conventions
- **Pronouns:** Izzy uses they/them pronouns throughout all content.
- **Fonts:** Fraunces (headings), Albert Sans (body) via Google Fonts.
- **Colors:** "Sunset Warmth" palette — orange primary (#B34D18), blue secondary (#2D6494), warm linen backgrounds. Dark mode uses lighter variants. Tokens in `assets/style.css` `:root`. Pull-quote accent bars use blue (`--blue`).
- **Layout:** `clamp(720px, 75vw, 900px)` container, 24px side padding. Prose (paragraphs, h2, pull quotes) capped at `68ch` for readability; cards and grids use full width.
- **Nav:** Sticky, full-width, adds `.is-scrolled` shadow on scroll.
- **Footer:** Full-width, `--bg-secondary` background, outside the container div.
- **Links:** Inline links in `.section p` have underline, `font-weight: 500`, thicker underline on hover.
- **JS:** No build tools, no transpiler, no bundler. Vanilla JS that runs directly in modern browsers. IIFE pattern preferred for module encapsulation.
- **Animation:** Intersection Observer scroll-reveal with `data-reveal` / `data-stagger` attributes. JS-driven parallax on `.parallax-img` elements. Always respect `prefers-reduced-motion`.

## Local Dev
```
python3 -m http.server 3456
```

## Data Files
- `assets/photos/manifest.json` — photo gallery data (filename, caption, wide, order)
- `assets/memories.json` — curated guest memories (name, relation, text)
- Adding a photo: put file in `assets/photos/`, add entry to manifest.json
- Adding a memory: memories are submitted via the form and approved through the admin page

## Memory Moderation Pipeline
Visitor submits form → Cloudflare Worker creates GitHub Issue (labels: `memory`, `pending`) → Admin approves/dismisses at `izzypenston.com/admin` (PIN-protected) → GitHub Action publishes approved memory to `memories.json` → GitHub Pages rebuilds.

- **Worker code:** `worker/memory-submit.js` (deployed via `wrangler deploy` from `worker/`)
- **Worker config:** `worker/wrangler.toml`
- **Worker secrets:** `GITHUB_TOKEN` (fine-grained PAT, Issues write), `ADMIN_PIN`
- **Admin page:** `admin/index.html` — PIN: shared between George and Zoe
- **GitHub Actions:** `.github/workflows/approve-memory.yml`, `.github/workflows/reject-memory.yml`
- **API endpoints:**
  - `POST /api/submit` — public form submission
  - `GET /api/admin/pending` — list pending memories (PIN required)
  - `POST /api/admin/approve/:id` — approve memory (PIN required)
  - `POST /api/admin/reject/:id` — dismiss memory (PIN required)

## CSS Tokens
- `--bg-primary` does NOT exist — use `--bg` (primary background) and `--bg-secondary`
- Full token list is in `:root` at the top of `assets/style.css`

## Press / Links Section
- `<section id="press">` between milestones and photos — no nav item, part of story flow
- Inline HTML (not JSON) — ~10 static links, rarely changing
- Each `<li class="press-item">` wraps an `<a>` containing `.press-title` (Fraunces) + `.press-source`
- To add a link: copy an existing `<li>` in the `<ul class="press-list">`, update href/title/source

## Photo Uploads (Memory Submissions)
- Client-side resize in `assets/modal.js` — always re-encodes through canvas (even under 1000px) to enforce <1MB GitHub API limit
- `selectedFiles[]` array maintained manually (FileList is read-only); file input has `display:none`, triggered via `<label for>`
- Worker base64 encoding uses 8KB chunked approach to avoid CPU timeout on Cloudflare Workers
- Photos committed to `assets/submissions/` via GitHub Contents API; failures are non-fatal (memory still submits)
- Photo URLs stored in GitHub Issue body as `![Photo N](url)` lines after `---`; extracted by regex in both Worker and approve workflow
- Approved memories with photos get a `photos` array in `memories.json`

## Memory Cards (Public Display)
- `assets/memories.js` — IIFE; `createPhotoPile()` and `buildMemoryLightbox()` are internal, not on window
- Cards with photos get `has-photos` class; pile is `position: absolute; top: 20px; right: 20px` within the card
- Memory lightbox is separate from gallery lightbox — built inline in memories.js, not reusable with lightbox.js

## Gallery Captions
- Captions stored in `assets/photos/manifest.json` — `"caption": ""` for uncaptioned photos
- Grid: hover overlay (`.gallery-caption-text`), opacity 0 → 1 on hover
- Lightbox: caption sits below image in `.lightbox-frame` flex column (img + caption as siblings)

## Script Caching
- Python's http.server does not set cache headers, but the browser may cache JS files across reloads
- To force fresh JS: add/bump `?v=N` query string on the `<script src>` tag in index.html

## Wrangler / Worker Deploys
- Always run `wrangler deploy` from `worker/` subdirectory, NOT the project root (root has no wrangler.toml)
- Running wrangler from root creates an unwanted `wrangler.jsonc` — delete it if that happens

## Parallax Story Photos
Three full-bleed parallax image breaks in the "Their Story" section:
- `assets/photos/story-childhood.jpg` — after early years paragraphs
- `assets/photos/story-creative.jpg` — after school/theater/GMG paragraphs
- `assets/photos/story-maeve.jpg` — before final pull quote
Recommend landscape/wide images, ~2400×800px. JS parallax in `assets/animations.js`.
