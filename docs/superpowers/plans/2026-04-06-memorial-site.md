# Izzy Penston Memorial Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static memorial website at izzypenston.com celebrating Izzy Penston's life, with photo gallery, guest memories, FA awareness, and donation links.

**Architecture:** Single-page static HTML/CSS site with vanilla JS for interactions (lightbox, modal, scroll-reveal). No frameworks, no build tools. Data-driven gallery and memories via JSON files. Deployed on GitHub Pages with Cloudflare DNS.

**Tech Stack:** HTML5, CSS3 (custom properties, grid, flexbox), vanilla JavaScript (ES5 for max compat), Google Fonts (Fraunces + Albert Sans).

**Spec:** `docs/superpowers/specs/2026-04-06-memorial-site-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `index.html` | Single page: all sections, `<head>` meta, structured data, inline page-specific styles |
| `assets/style.css` | Design tokens, reset, shared component styles (nav, footer, buttons, forms, cards) |
| `assets/animations.js` | Scroll-reveal + hero stagger via Intersection Observer |
| `assets/gallery.js` | Load photos from manifest.json, render grid, "load more" |
| `assets/lightbox.js` | Full-screen photo viewer with keyboard nav + focus trap |
| `assets/memories.js` | Load memories from JSON, render cards, "load more" |
| `assets/modal.js` | Share a Memory modal dialog, Formspree submission, thank-you state |
| `assets/memories.json` | Curated guest memories data |
| `assets/photos/manifest.json` | Photo metadata: filename, caption, wide flag, sort order |
| `CLAUDE.md` | Project conventions for Claude |
| `CNAME` | GitHub Pages custom domain |
| `robots.txt` | Search engine directives |
| `sitemap.xml` | Sitemap for SEO |

---

## Task 1: Project Foundation — CLAUDE.md, style.css, animations.js

**Files:**
- Create: `CLAUDE.md`
- Create: `assets/style.css`
- Create: `assets/animations.js`

- [ ] **Step 1: Create CLAUDE.md**

```markdown
# Izzy Penston Memorial Site

## Project
Static memorial website at izzypenston.com. Pure HTML/CSS/vanilla JS — no frameworks, no build tools.

## Conventions
- **Pronouns:** Izzy uses they/them pronouns throughout all content.
- **Fonts:** Fraunces (headings), Albert Sans (body) via Google Fonts.
- **Colors:** "Sunset Warmth" palette — orange primary (#C75D24), blue secondary (#3B7CB8), warm linen backgrounds.
- **Layout:** max-width 720px container, 24px side padding.
- **JS:** ES5 compatible (IIFE pattern, var, no arrow functions) for maximum browser support.
- **Animation:** Intersection Observer scroll-reveal with `data-reveal` / `data-stagger` attributes. Always respect `prefers-reduced-motion`.

## Local Dev
```
python3 -m http.server 3456
```

## Data Files
- `assets/photos/manifest.json` — photo gallery data (filename, caption, wide, order)
- `assets/memories.json` — curated guest memories (name, relation, text)
- Adding a photo: put file in `assets/photos/`, add entry to manifest.json
- Adding a memory: add entry to memories.json
```

- [ ] **Step 2: Create assets/style.css**

```css
/* ===== izzypenston.com — Shared Styles ===== */

@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&family=Albert+Sans:wght@400;500;600&display=swap');

/* ===== Design Tokens ===== */
:root {
  --orange: #C75D24;
  --orange-hover: #A84D1E;
  --amber: #E8A44A;
  --blue: #3B7CB8;
  --blue-hover: #2D6494;
  --bg: #FAF7F2;
  --bg-secondary: #F0EBE3;
  --text-primary: #1E1B18;
  --text-secondary: #6B6560;
  --text-tertiary: #8B8580;
  --border: #E0DBD4;
  --border-medium: #C9C3BA;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
}

@media (prefers-color-scheme: dark) {
  :root {
    --orange: #E07A3A;
    --orange-hover: #C75D24;
    --amber: #EDB55A;
    --blue: #5A9BD5;
    --blue-hover: #3B7CB8;
    --bg: #141210;
    --bg-secondary: #1E1B18;
    --text-primary: #F2EDE6;
    --text-secondary: #A39E98;
    --text-tertiary: #7A756F;
    --border: #2A2520;
    --border-medium: #3D3832;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.25);
    --shadow-lg: 0 10px 15px rgba(0,0,0,0.3), 0 4px 6px rgba(0,0,0,0.2);
  }
}

/* ===== Reset & Base ===== */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  scroll-behavior: smooth;
}

body {
  background: var(--bg);
  color: var(--text-primary);
  font-family: 'Albert Sans', system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Fraunces', serif;
  font-weight: 700;
  line-height: 1.2;
}

a {
  color: var(--blue);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover { color: var(--blue-hover); }

::selection {
  background: var(--orange);
  color: white;
}

*:focus-visible {
  outline: 2px solid var(--orange);
  outline-offset: 2px;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* ===== Layout ===== */
.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ===== Skip Link ===== */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--orange);
  color: white;
  padding: 8px 16px;
  z-index: 100;
  font-size: 14px;
}

.skip-link:focus {
  top: 0;
  color: white;
}

/* ===== Nav ===== */
.nav {
  padding: 24px 0;
  border-bottom: 1px solid var(--border);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-wordmark {
  font-family: 'Fraunces', serif;
  font-weight: 700;
  font-size: 16px;
  color: var(--text-primary);
  text-decoration: none;
}

.nav-wordmark span { color: var(--orange); }

.nav-links {
  display: flex;
  gap: 24px;
  list-style: none;
}

.nav-links a {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.nav-links a:hover { color: var(--orange); }

/* ===== Section ===== */
.section {
  padding: 56px 0;
  border-bottom: 1px solid var(--border);
}

.section-label {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin-bottom: 24px;
}

.section h2 {
  font-size: 26px;
  margin-bottom: 20px;
}

.section p {
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 16px;
}

/* ===== Buttons ===== */
.btn-primary {
  display: inline-block;
  background: var(--orange);
  color: white;
  font-family: 'Albert Sans', sans-serif;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  text-decoration: none;
}

.btn-primary:hover {
  background: var(--orange-hover);
  color: white;
}

.btn-secondary {
  display: inline-block;
  border: 1.5px solid var(--blue);
  color: var(--blue);
  font-family: 'Albert Sans', sans-serif;
  font-weight: 600;
  font-size: 15px;
  padding: 11px 24px;
  border-radius: 10px;
  cursor: pointer;
  background: transparent;
  transition: background 0.2s, color 0.2s;
  text-decoration: none;
}

.btn-secondary:hover {
  background: var(--blue);
  color: white;
}

/* ===== Pull Quote ===== */
.pull-quote {
  border-left: 3px solid var(--orange);
  padding: 8px 0 8px 24px;
  margin: 28px 0;
}

.pull-quote p {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 20px;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
}

.pull-quote cite {
  display: block;
  font-family: 'Albert Sans', sans-serif;
  font-style: normal;
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 8px;
}

/* ===== Hero ===== */
.hero {
  padding: 64px 0 56px;
  border-bottom: 1px solid var(--border);
}

.hero-inner {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.hero-photo {
  width: 180px;
  min-width: 180px;
  height: 220px;
  border-radius: 16px;
  object-fit: cover;
}

.hero-photo-placeholder {
  width: 180px;
  min-width: 180px;
  height: 220px;
  border-radius: 16px;
  background: linear-gradient(135deg, #E8D5C0 0%, #C9B8A5 50%, #B8A898 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #8B7D6E;
}

.hero-text { padding-top: 4px; }

.hero-label {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--orange);
  margin-bottom: 12px;
}

.hero h1 {
  font-size: clamp(28px, 5vw, 38px);
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}

.hero-dates {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 15px;
  color: var(--text-tertiary);
  margin-bottom: 16px;
}

.hero-intro {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* ===== Timeline ===== */
.timeline {
  position: relative;
  padding-left: 32px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--border);
}

.timeline-entry {
  position: relative;
  margin-bottom: 28px;
}

.timeline-entry:last-child { margin-bottom: 0; }

.timeline-entry::before {
  content: '';
  position: absolute;
  left: -32px;
  top: 8px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--bg);
  border: 2.5px solid var(--orange);
}

.timeline-entry.highlight::before {
  background: var(--orange);
}

.timeline-year {
  font-family: 'Albert Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--orange);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.timeline-title {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ===== Gallery ===== */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.gallery-item {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
}

.gallery-item:hover { transform: scale(1.02); }

.gallery-item.wide { grid-column: span 2; }

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  aspect-ratio: 1;
}

.gallery-item.wide img { aspect-ratio: 2/1; }

.gallery-caption-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 12px 10px;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  color: white;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
}

.gallery-item:hover .gallery-caption-text { opacity: 1; }

.gallery-footer {
  font-size: 13px;
  color: var(--text-tertiary);
  text-align: center;
  margin-top: 16px;
}

.load-more {
  display: block;
  margin: 24px auto 0;
  padding: 10px 24px;
  background: transparent;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-family: 'Albert Sans', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.load-more:hover {
  border-color: var(--orange);
  color: var(--orange);
}

/* ===== Memory Cards ===== */
.memory-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
}

.memory-name {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary);
}

.memory-relation {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 10px;
}

.memory-text {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0;
}

/* ===== Modal ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}

.modal-backdrop.is-open {
  opacity: 1;
  visibility: visible;
}

.modal {
  background: var(--bg);
  border-radius: 16px;
  max-width: 520px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
  position: relative;
  transform: translateY(16px);
  transition: transform 0.2s;
}

.modal-backdrop.is-open .modal {
  transform: none;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-tertiary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-close:hover { color: var(--text-primary); }

.modal h2 {
  font-size: 22px;
  margin-bottom: 4px;
  padding-right: 32px;
}

.modal .modal-subtitle {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-bottom: 24px;
  line-height: 1.5;
}

/* ===== Form ===== */
.form-group { margin-bottom: 16px; }

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.form-hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  font-family: 'Albert Sans', sans-serif;
  font-size: 15px;
  color: var(--text-primary);
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--orange);
  outline: none;
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-note {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 16px;
  line-height: 1.5;
}

/* ===== Donate ===== */
.donate-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.donate-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 28px 24px;
}

.donate-card h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.donate-card p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.donate-card.primary { border-color: var(--orange); }
.donate-card.secondary { border-color: var(--blue); }

/* ===== FA Section ===== */
.fa-section {
  background: var(--bg-secondary);
  border-radius: 14px;
  padding: 32px;
  margin-bottom: 32px;
}

.fa-section h3 {
  font-size: 20px;
  margin-bottom: 12px;
}

.fa-section p {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 12px;
}

/* ===== Footer ===== */
footer {
  padding: 48px 0;
  text-align: center;
}

.footer-quote {
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.footer-quote-attr {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 24px;
}

.footer-divider {
  height: 1px;
  background: var(--border);
  max-width: 120px;
  margin: 0 auto 24px;
}

.footer-copy {
  font-size: 13px;
  color: var(--text-tertiary);
}

/* ===== Lightbox ===== */
.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
}

.lightbox-backdrop.is-open {
  opacity: 1;
  visibility: visible;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 4px;
}

.lightbox-caption {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 14px;
  text-align: center;
  max-width: 500px;
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  width: 40px;
  height: 40px;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: white;
  font-size: 32px;
  cursor: pointer;
  padding: 16px;
}

.lightbox-prev { left: 12px; }
.lightbox-next { right: 12px; }

/* ===== Scroll-reveal & entrance animations ===== */
[data-reveal],
[data-stagger] {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

[data-stagger] {
  transition-delay: calc(var(--stagger-index, 0) * 0.15s);
}

[data-reveal].is-revealed,
[data-stagger].is-revealed {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal],
  [data-stagger] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/* ===== Responsive ===== */
@media (max-width: 600px) {
  .hero-inner {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .hero-photo,
  .hero-photo-placeholder {
    width: 140px;
    min-width: 140px;
    height: 170px;
  }

  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .gallery-item.wide {
    grid-column: span 2;
  }

  .donate-grid {
    grid-template-columns: 1fr;
  }

  .nav-links { gap: 16px; }
  .nav-links a { font-size: 13px; }
}
```

- [ ] **Step 3: Create assets/animations.js**

Same Intersection Observer pattern as penston.studio:

```javascript
(function () {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '-64px' });

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    observer.observe(el);
  });

  function initStagger() {
    requestAnimationFrame(function () {
      document.querySelectorAll('[data-stagger]').forEach(function (el) {
        el.style.setProperty('--stagger-index', el.dataset.stagger);
        el.classList.add('is-revealed');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStagger);
  } else {
    initStagger();
  }
}());
```

- [ ] **Step 4: Verify files exist**

Run: `ls -la assets/style.css assets/animations.js CLAUDE.md`

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md assets/style.css assets/animations.js
git commit -m "feat: add project foundation — design tokens, shared styles, animations"
```

---

## Task 2: index.html — Head, Nav, Hero, Footer

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create index.html with head, nav, hero, and footer**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Izzy Penston — Celebrating a Life Lived Fully</title>
  <meta name="description" content="A celebration of the life of Isabel Grace 'Izzy' Penston (2000–2026). Learn about Izzy, share a memory, and support Friedreich's Ataxia research.">
  <meta property="og:title" content="Izzy Penston — Celebrating a Life Lived Fully">
  <meta property="og:description" content="A celebration of the life of Isabel Grace 'Izzy' Penston (2000–2026). Learn about Izzy, share a memory, and support Friedreich's Ataxia research.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://izzypenston.com/">
  <meta property="og:image" content="https://izzypenston.com/assets/og-image.jpg">
  <meta property="og:image:alt" content="Izzy Penston — Celebrating a Life Lived Fully">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Izzy Penston — Celebrating a Life Lived Fully">
  <meta name="twitter:description" content="A celebration of the life of Isabel Grace 'Izzy' Penston (2000–2026).">
  <meta name="twitter:image" content="https://izzypenston.com/assets/og-image.jpg">
  <link rel="canonical" href="https://izzypenston.com/">
  <link rel="stylesheet" href="/assets/style.css">
  <script defer src="/assets/animations.js"></script>
  <script defer src="/assets/gallery.js"></script>
  <script defer src="/assets/memories.js"></script>
  <script defer src="/assets/lightbox.js"></script>
  <script defer src="/assets/modal.js"></script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Isabel Grace Penston",
    "alternateName": "Izzy Penston",
    "birthDate": "2000-11-06",
    "deathDate": "2026-03-25",
    "birthPlace": "San Francisco, CA",
    "description": "Brilliant, unique, and endlessly curious — Izzy lived fully and authentically in every chapter of their life.",
    "url": "https://izzypenston.com"
  }
  </script>
</head>
<body>

  <a href="#story" class="skip-link">Skip to content</a>

  <div class="container">

    <nav class="nav">
      <div class="nav-inner">
        <a href="/" class="nav-wordmark">Izzy<span>.</span></a>
        <ul class="nav-links">
          <li><a href="#story">Their Story</a></li>
          <li><a href="#photos">Photos</a></li>
          <li><a href="#memories">Memories</a></li>
          <li><a href="#donate">Donate</a></li>
        </ul>
      </div>
    </nav>

    <main>

      <section class="hero">
        <div class="hero-inner">
          <div class="hero-photo-placeholder" data-stagger="0">Photo</div>
          <div class="hero-text">
            <div class="hero-label" data-stagger="1">Remembering Izzy</div>
            <h1 data-stagger="2">Isabel Grace<br>&ldquo;Izzy&rdquo; Penston</h1>
            <div class="hero-dates" data-stagger="3">November 6, 2000 &ndash; March 25, 2026</div>
            <p class="hero-intro" data-stagger="4">Brilliant, unique, and endlessly curious &mdash; Izzy lived fully and authentically in every chapter of their life, facing each challenge with humor, resilience, and a &ldquo;why not?&rdquo; mindset.</p>
          </div>
        </div>
      </section>

      <!-- Sections will be added in subsequent tasks -->

    </main>

    <footer>
      <div class="footer-quote" data-reveal>&ldquo;Be excellent to each other. Party on, dudes!&rdquo;</div>
      <div class="footer-quote-attr" data-reveal>&mdash; Bill &amp; Ted&rsquo;s Excellent Adventure (Izzy&rsquo;s parting words)</div>
      <div class="footer-divider" data-reveal></div>
      <p class="footer-copy" data-reveal>With love from the Penston family &mdash; George, Zoe, Wendy &amp; Maeve</p>
    </footer>

  </div>

</body>
</html>
```

- [ ] **Step 2: Preview in browser**

Open `http://localhost:3456` and verify:
- Fonts load (Fraunces headings, Albert Sans body)
- Nav shows wordmark + anchor links
- Hero section renders with placeholder photo, stagger animation plays
- Footer renders with quote and family attribution
- Dark mode works (toggle system preference)
- Mobile: hero stacks vertically at 600px

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add index.html with nav, hero, and footer"
```

---

## Task 3: Life Story + Timeline Sections

**Files:**
- Modify: `index.html` (add sections after hero, before footer)

- [ ] **Step 1: Add Life Story section after the hero closing tag**

Insert after `</section>` (hero) and before the `<!-- Sections will be added -->` comment:

```html
      <section class="section" id="story">
        <div class="section-label" data-reveal>Their Story</div>
        <h2 data-reveal>A Life Lived Fully</h2>

        <p data-reveal>Born in San Francisco on a November morning in 2000, Izzy was brilliant and curious from the very start. By age five, they were already reading voraciously and could name every dinosaur that ever walked the earth. After a couple of years in Pittsburg, the Penston family settled in Alameda in 2003 &mdash; the place Izzy would call home for the rest of their life.</p>

        <p data-reveal>While in preschool, a different kind of difference emerged. Coordination challenges, balance issues, and a heart condition were pieces of a puzzle that finally came together around age nine with a diagnosis of Friedreich&rsquo;s Ataxia &mdash; a rare, progressive neurodegenerative disease that would shape Izzy&rsquo;s journey but never define who they were.</p>

        <div class="pull-quote" data-reveal>
          <p>&ldquo;I can&rsquo;t even dance but I&rsquo;m in charge of the dances.&rdquo;</p>
          <cite>&mdash; Izzy, on being appointed dance organizer after losing the class president race</cite>
        </div>

        <p data-reveal>School was where Izzy&rsquo;s personality came alive. They attended Edison, Lincoln, and ACLC, leaving an impression everywhere they went. Theater became a big part of their world &mdash; Izzy brought characters like Maleficent and Jafar to life on stage, always gravitating toward the roles with the most personality. As an animal lover, they found joy in volunteering at the local shelter, caring for cats and bunnies.</p>

        <p data-reveal>Their creative energy extended well beyond performance. Izzy wrote for the audio drama podcast <em>Twelve Chimes It&rsquo;s Midnight</em> and served as writer and creative director for <em>Interfectorem</em>, a video game that won the grand prize at Girls Make Games National Demo Day in 2015. As a GMG alum and ambassador, they were invited to speak at the White House the following year. They also loved playing Dungeons &amp; Dragons, cosplaying at anime conventions, and &mdash; in 2019 &mdash; being matched with Maeve, their Canine Companions service dog and the love of their life.</p>

        <p data-reveal>The transition to adulthood brought obstacles, but Izzy&rsquo;s positive attitude never wavered. When the challenges of living independently with a disability &mdash; compounded by COVID shutdowns &mdash; shifted their plans, they pivoted from film at SJSU to anthropology at College of Alameda, earning their associate&rsquo;s degree in 2025. An avid reader, Izzy loved horror &mdash; especially Stephen King. In later years, they discovered a passion for rockhounding, always chasing the perfect smooth, shiny stone, and embraced the simpler things: a warm bath, candles, chocolate cake, Coca-Cola, and trips to Disneyland.</p>

        <div class="pull-quote" data-reveal>
          <p>&ldquo;Twenty-five years was not enough, but Izzy made the most of every one of them.&rdquo;</p>
        </div>

        <p data-reveal>FA took away their ability to walk, type, talk, and see &mdash; yet they never gave up, facing each new challenge with humor and a &ldquo;why not?&rdquo; mindset. Izzy lives on in memory, and leaves a lasting gift to the FA community through the donation of their brain and heart to research. They always had big dreams, and while they never made it to Harvard, their heart did &mdash; a fact they would have found endlessly amusing.</p>
      </section>
```

- [ ] **Step 2: Add Timeline section after the Life Story section**

```html
      <section class="section">
        <div class="section-label" data-reveal>Milestones</div>
        <h2 data-reveal>A Life in Moments</h2>

        <div class="timeline" data-reveal>
          <div class="timeline-entry highlight">
            <div class="timeline-year">2000</div>
            <div class="timeline-title">Born in San Francisco</div>
            <div class="timeline-desc">Isabel Grace Penston arrives on November 6th.</div>
          </div>
          <div class="timeline-entry">
            <div class="timeline-year">2003</div>
            <div class="timeline-title">Home in Alameda</div>
            <div class="timeline-desc">The Penston family settles in Alameda, CA.</div>
          </div>
          <div class="timeline-entry">
            <div class="timeline-year">~2009</div>
            <div class="timeline-title">FA Diagnosis</div>
            <div class="timeline-desc">Diagnosed with Friedreich&rsquo;s Ataxia at age nine.</div>
          </div>
          <div class="timeline-entry highlight">
            <div class="timeline-year">2015</div>
            <div class="timeline-title">Girls Make Games Grand Prize</div>
            <div class="timeline-desc">Writer and creative director for Interfectorem, winning National Demo Day.</div>
          </div>
          <div class="timeline-entry">
            <div class="timeline-year">2016</div>
            <div class="timeline-title">White House Visit</div>
            <div class="timeline-desc">Invited to speak as a Girls Make Games ambassador.</div>
          </div>
          <div class="timeline-entry highlight">
            <div class="timeline-year">2019</div>
            <div class="timeline-title">Matched with Maeve</div>
            <div class="timeline-desc">Paired with their Canine Companions service dog &mdash; the love of their life.</div>
          </div>
          <div class="timeline-entry">
            <div class="timeline-year">2025</div>
            <div class="timeline-title">Associate&rsquo;s Degree</div>
            <div class="timeline-desc">Earned their degree in anthropology from College of Alameda.</div>
          </div>
          <div class="timeline-entry highlight">
            <div class="timeline-year">2026</div>
            <div class="timeline-title">A Lasting Gift</div>
            <div class="timeline-desc">Izzy&rsquo;s brain and heart donated to FA research. Their heart made it to Harvard.</div>
          </div>
        </div>
      </section>
```

- [ ] **Step 3: Remove the placeholder comment**

Delete the `<!-- Sections will be added in subsequent tasks -->` line.

- [ ] **Step 4: Preview in browser**

Open `http://localhost:3456` and verify:
- Life Story section renders with prose and pull quotes
- Pull quotes have orange left border
- Timeline renders with vertical line, dots (filled for highlights)
- Scroll-reveal animations trigger as sections come into view
- All smart quotes render correctly

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add life story narrative and timeline sections"
```

---

## Task 4: Photo Gallery (gallery.js + manifest.json + lightbox.js)

**Files:**
- Create: `assets/photos/manifest.json`
- Create: `assets/gallery.js`
- Create: `assets/lightbox.js`
- Modify: `index.html` (add gallery section)

- [ ] **Step 1: Create assets/photos/manifest.json with placeholder data**

```json
[
  { "file": "placeholder-1.jpg", "caption": "Izzy and Maeve", "wide": true, "order": 1 },
  { "file": "placeholder-2.jpg", "caption": "Cosplay at anime con", "wide": false, "order": 2 },
  { "file": "placeholder-3.jpg", "caption": "", "wide": false, "order": 3 },
  { "file": "placeholder-4.jpg", "caption": "Girls Make Games Demo Day, 2015", "wide": false, "order": 4 },
  { "file": "placeholder-5.jpg", "caption": "Disneyland", "wide": true, "order": 5 },
  { "file": "placeholder-6.jpg", "caption": "", "wide": false, "order": 6 }
]
```

- [ ] **Step 2: Create assets/gallery.js**

```javascript
(function () {
  var BATCH_SIZE = 18;
  var photos = [];
  var shown = 0;
  var grid = document.getElementById('gallery-grid');
  var btnWrap = document.getElementById('gallery-load-more-wrap');

  function createItem(photo) {
    var div = document.createElement('div');
    div.className = 'gallery-item' + (photo.wide ? ' wide' : '');
    div.setAttribute('data-index', photos.indexOf(photo));
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', photo.caption || 'Photo of Izzy');

    var img = document.createElement('img');
    img.src = '/assets/photos/' + photo.file;
    img.alt = photo.caption || 'Photo of Izzy';
    img.loading = 'lazy';
    div.appendChild(img);

    if (photo.caption) {
      var cap = document.createElement('div');
      cap.className = 'gallery-caption-text';
      cap.textContent = photo.caption;
      div.appendChild(cap);
    }

    div.addEventListener('click', function () {
      if (window.openLightbox) window.openLightbox(photos.indexOf(photo));
    });
    div.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (window.openLightbox) window.openLightbox(photos.indexOf(photo));
      }
    });

    return div;
  }

  function renderBatch() {
    var end = Math.min(shown + BATCH_SIZE, photos.length);
    for (var i = shown; i < end; i++) {
      grid.appendChild(createItem(photos[i]));
    }
    shown = end;
    if (shown >= photos.length && btnWrap) {
      btnWrap.style.display = 'none';
    }
  }

  function init() {
    if (!grid) return;

    fetch('/assets/photos/manifest.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        photos = data.sort(function (a, b) { return a.order - b.order; });
        if (photos.length === 0) {
          grid.innerHTML = '<p style="color:var(--text-tertiary);grid-column:1/-1;text-align:center;">Photos coming soon.</p>';
          if (btnWrap) btnWrap.style.display = 'none';
          return;
        }
        renderBatch();
        if (shown >= photos.length && btnWrap) {
          btnWrap.style.display = 'none';
        }
      })
      .catch(function () {
        grid.innerHTML = '<p style="color:var(--text-tertiary);grid-column:1/-1;text-align:center;">Photos coming soon.</p>';
        if (btnWrap) btnWrap.style.display = 'none';
      });

    var btn = document.getElementById('gallery-load-more');
    if (btn) {
      btn.addEventListener('click', function () { renderBatch(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose photos array for lightbox
  window.getGalleryPhotos = function () { return photos; };
}());
```

- [ ] **Step 3: Create assets/lightbox.js**

```javascript
(function () {
  var backdrop, img, caption, prevBtn, nextBtn, closeBtn;
  var currentIndex = -1;
  var triggerEl = null;

  function build() {
    backdrop = document.createElement('div');
    backdrop.className = 'lightbox-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', 'Photo viewer');

    closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close photo viewer');
    closeBtn.innerHTML = '&times;';

    prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox-nav lightbox-prev';
    prevBtn.setAttribute('aria-label', 'Previous photo');
    prevBtn.innerHTML = '&#8249;';

    nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox-nav lightbox-next';
    nextBtn.setAttribute('aria-label', 'Next photo');
    nextBtn.innerHTML = '&#8250;';

    img = document.createElement('img');
    img.className = 'lightbox-img';
    img.alt = '';

    caption = document.createElement('div');
    caption.className = 'lightbox-caption';

    backdrop.appendChild(closeBtn);
    backdrop.appendChild(prevBtn);
    backdrop.appendChild(img);
    backdrop.appendChild(nextBtn);
    backdrop.appendChild(caption);
    document.body.appendChild(backdrop);

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { navigate(-1); });
    nextBtn.addEventListener('click', function () { navigate(1); });
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
    document.addEventListener('keydown', handleKey);
  }

  function handleKey(e) {
    if (!backdrop || !backdrop.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  }

  function show(index) {
    var photos = window.getGalleryPhotos ? window.getGalleryPhotos() : [];
    if (!photos.length || index < 0 || index >= photos.length) return;
    currentIndex = index;
    var photo = photos[index];
    img.src = '/assets/photos/' + photo.file;
    img.alt = photo.caption || 'Photo of Izzy';
    caption.textContent = photo.caption || '';
    prevBtn.style.display = index > 0 ? '' : 'none';
    nextBtn.style.display = index < photos.length - 1 ? '' : 'none';
  }

  function navigate(dir) {
    show(currentIndex + dir);
  }

  function open(index) {
    if (!backdrop) build();
    triggerEl = document.activeElement;
    show(index);
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function close() {
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    currentIndex = -1;
    if (triggerEl) triggerEl.focus();
  }

  window.openLightbox = open;
}());
```

- [ ] **Step 4: Add gallery section to index.html**

Insert after the Timeline section closing `</section>`:

```html
      <section class="section" id="photos">
        <div class="section-label" data-reveal>Photos</div>
        <h2 data-reveal>Moments &amp; Memories</h2>

        <div class="gallery-grid" id="gallery-grid" data-reveal></div>

        <div id="gallery-load-more-wrap">
          <button class="load-more" id="gallery-load-more">Load More Photos</button>
        </div>

        <p class="gallery-footer" data-reveal>Click any photo to view larger. Have a photo to share? <a href="#memories">Send it with your memory below.</a></p>
      </section>
```

- [ ] **Step 5: Preview in browser**

Open `http://localhost:3456` and verify:
- Gallery section renders (will show "Photos coming soon." since placeholder images don't exist as actual files — that's expected)
- No JS errors in console
- Load more button hides when all photos are shown

- [ ] **Step 6: Commit**

```bash
git add assets/gallery.js assets/lightbox.js assets/photos/manifest.json index.html
git commit -m "feat: add photo gallery with lightbox and JSON manifest"
```

---

## Task 5: Memories Section (memories.js + memories.json)

**Files:**
- Create: `assets/memories.json`
- Create: `assets/memories.js`
- Modify: `index.html` (add memories section)

- [ ] **Step 1: Create assets/memories.json with sample data**

```json
[
  {
    "name": "Sample Memory",
    "relation": "Friend",
    "text": "This is a placeholder memory that will be replaced with real submissions."
  }
]
```

- [ ] **Step 2: Create assets/memories.js**

```javascript
(function () {
  var BATCH_SIZE = 6;
  var memories = [];
  var shown = 0;
  var list = document.getElementById('memories-list');
  var btnWrap = document.getElementById('memories-load-more-wrap');

  function createCard(memory) {
    var div = document.createElement('div');
    div.className = 'memory-card';

    var name = document.createElement('div');
    name.className = 'memory-name';
    name.textContent = memory.name;
    div.appendChild(name);

    if (memory.relation) {
      var rel = document.createElement('div');
      rel.className = 'memory-relation';
      rel.textContent = memory.relation;
      div.appendChild(rel);
    }

    var text = document.createElement('p');
    text.className = 'memory-text';
    text.textContent = memory.text;
    div.appendChild(text);

    return div;
  }

  function renderBatch() {
    var end = Math.min(shown + BATCH_SIZE, memories.length);
    for (var i = shown; i < end; i++) {
      list.appendChild(createCard(memories[i]));
    }
    shown = end;
    if (shown >= memories.length && btnWrap) {
      btnWrap.style.display = 'none';
    }
  }

  function init() {
    if (!list) return;

    fetch('/assets/memories.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        memories = data;
        if (memories.length === 0) return;
        renderBatch();
        if (shown >= memories.length && btnWrap) {
          btnWrap.style.display = 'none';
        }
      })
      .catch(function () {
        // Silently fail — no memories to show yet
      });

    var btn = document.getElementById('memories-load-more');
    if (btn) {
      btn.addEventListener('click', function () { renderBatch(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
```

- [ ] **Step 3: Add memories section to index.html**

Insert after the Gallery section closing `</section>`:

```html
      <section class="section" id="memories">
        <div class="section-label" data-reveal>Memories</div>
        <h2 data-reveal>Words for Izzy</h2>

        <div id="memories-list" data-reveal></div>

        <div id="memories-load-more-wrap">
          <button class="load-more" id="memories-load-more">Load More Memories</button>
        </div>

        <div style="text-align: center; margin-top: 32px;" data-reveal>
          <button class="btn-primary" id="share-memory-btn" type="button">Share Your Memory of Izzy</button>
        </div>
      </section>
```

- [ ] **Step 4: Preview in browser**

Open `http://localhost:3456` and verify:
- Memories section renders with the sample memory card
- "Share Your Memory of Izzy" button visible (doesn't open modal yet — that's Task 6)
- Load more hides when all memories shown

- [ ] **Step 5: Commit**

```bash
git add assets/memories.js assets/memories.json index.html
git commit -m "feat: add memories section with JSON data and load-more"
```

---

## Task 6: Share a Memory Modal (modal.js + Formspree)

**Files:**
- Create: `assets/modal.js`
- Modify: `index.html` (add modal markup)

- [ ] **Step 1: Add modal HTML to index.html**

Insert just before the closing `</body>` tag (outside the `.container`):

```html
  <div class="modal-backdrop" id="memory-modal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" id="modal-close" aria-label="Close">&times;</button>

      <div id="modal-form-state">
        <h2 id="modal-title">Share Your Memory of Izzy</h2>
        <p class="modal-subtitle">Your message may be reviewed before appearing on this page. Your email will not be published.</p>

        <form id="memory-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
          <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">

          <div class="form-group">
            <label for="memory-name">Your Name *</label>
            <input type="text" id="memory-name" name="name" class="form-input" required>
          </div>

          <div class="form-group">
            <label for="memory-email">Email *</label>
            <p class="form-hint">For follow-up only &mdash; will not be displayed.</p>
            <input type="email" id="memory-email" name="email" class="form-input" required>
          </div>

          <div class="form-group">
            <label for="memory-relation">Your Relationship to Izzy</label>
            <input type="text" id="memory-relation" name="relation" class="form-input" placeholder="Friend, classmate, family&hellip;">
          </div>

          <div class="form-group">
            <label for="memory-text">Your Memory *</label>
            <textarea id="memory-text" name="message" class="form-textarea" required placeholder="Share a favorite memory, story, or what Izzy meant to you&hellip;"></textarea>
          </div>

          <button type="submit" class="btn-primary" style="width:100%;">Share Your Memory</button>

          <p class="form-note">Have a photo of Izzy you&rsquo;d like to share? Email it to <strong>memories@izzypenston.com</strong> and we&rsquo;ll add it to the gallery.</p>
        </form>
      </div>

      <div id="modal-thanks-state" style="display:none; text-align:center; padding: 40px 0;">
        <h2 style="margin-bottom: 12px;">Thank You</h2>
        <p style="color: var(--text-secondary); line-height: 1.7;">Your memory of Izzy has been received. We&rsquo;ll review it and add it to the page soon.</p>
      </div>
    </div>
  </div>
```

Note: Replace `YOUR_FORM_ID` with the actual Formspree form ID when George creates the endpoint.

- [ ] **Step 2: Create assets/modal.js**

```javascript
(function () {
  var backdrop = document.getElementById('memory-modal');
  var modal = backdrop ? backdrop.querySelector('.modal') : null;
  var closeBtn = document.getElementById('modal-close');
  var openBtn = document.getElementById('share-memory-btn');
  var form = document.getElementById('memory-form');
  var formState = document.getElementById('modal-form-state');
  var thanksState = document.getElementById('modal-thanks-state');
  var triggerEl = null;

  function open() {
    if (!backdrop) return;
    triggerEl = document.activeElement;
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    // Focus the first input
    var firstInput = modal.querySelector('input:not([type="hidden"]):not([style*="display:none"])');
    if (firstInput) firstInput.focus();
  }

  function close() {
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
    if (triggerEl) triggerEl.focus();
  }

  function handleKeydown(e) {
    if (!backdrop || !backdrop.classList.contains('is-open')) return;

    if (e.key === 'Escape') {
      close();
      return;
    }

    // Focus trap
    if (e.key === 'Tab') {
      var focusable = modal.querySelectorAll('button, [href], input:not([tabindex="-1"]), textarea, [tabindex]:not([tabindex="-1"])');
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    var data = new FormData(form);

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { 'Accept': 'application/json' }
    })
    .then(function (response) {
      if (response.ok) {
        formState.style.display = 'none';
        thanksState.style.display = '';
        setTimeout(function () {
          close();
          // Reset for next use
          setTimeout(function () {
            formState.style.display = '';
            thanksState.style.display = 'none';
            form.reset();
          }, 300);
        }, 3000);
      } else {
        alert('Something went wrong. Please try again or email your memory to memories@izzypenston.com.');
      }
    })
    .catch(function () {
      alert('Something went wrong. Please try again or email your memory to memories@izzypenston.com.');
    });
  }

  // Event listeners
  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
  }
  if (form) form.addEventListener('submit', handleSubmit);
  document.addEventListener('keydown', handleKeydown);

  // Handle #share deep link
  if (window.location.hash === '#share') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', open);
    } else {
      open();
    }
  }
}());
```

- [ ] **Step 3: Preview in browser**

Open `http://localhost:3456` and verify:
- Click "Share Your Memory of Izzy" button → modal opens with animation
- Modal has focus trap (Tab cycles within modal)
- Escape key closes modal
- Clicking backdrop closes modal
- Focus returns to button after close
- Form fields render with proper labels
- Navigate to `http://localhost:3456/#share` → modal opens directly

- [ ] **Step 4: Commit**

```bash
git add assets/modal.js index.html
git commit -m "feat: add share a memory modal with form and focus trap"
```

---

## Task 7: FA Awareness + Donate Section

**Files:**
- Modify: `index.html` (add donate section)

- [ ] **Step 1: Add FA + Donate section to index.html**

Insert after the Memories section closing `</section>`:

```html
      <section class="section" id="donate">
        <div class="section-label" data-reveal>Izzy&rsquo;s Legacy</div>
        <h2 data-reveal>Honor Izzy&rsquo;s Memory</h2>

        <div class="fa-section" data-reveal>
          <h3>About Friedreich&rsquo;s Ataxia</h3>
          <p>Friedreich&rsquo;s Ataxia (FA) is a rare, progressive neurodegenerative disease that Izzy was diagnosed with at age nine. Over the years, FA took away their ability to walk, type, talk, and see &mdash; but it never took their spirit. Izzy faced every challenge with humor and resilience, and left a lasting gift to the FA community through the donation of their brain and heart to research.</p>
          <a href="https://www.curefa.org/what-is-friedreichs-ataxia">Learn more about FA &rarr;</a>
        </div>

        <p style="color: var(--text-secondary); margin-bottom: 24px;" data-reveal>In lieu of flowers, please consider donating to the causes closest to Izzy&rsquo;s heart.</p>

        <div class="donate-grid" data-reveal>
          <div class="donate-card primary">
            <h3 style="color: var(--orange);">FARA</h3>
            <p>Help fund research to slow, stop, and reverse Friedreich&rsquo;s Ataxia &mdash; the disease Izzy lived with and fought against every day.</p>
            <a href="https://www.curefa.org/donate/" class="btn-primary" target="_blank" rel="noopener">Donate to FARA &rarr;</a>
          </div>
          <div class="donate-card secondary">
            <h3 style="color: var(--blue);">Canine Companions</h3>
            <p>Honor the bond between Izzy and Maeve by supporting the organization that brought them together.</p>
            <a href="https://canine.org/donate-now/" class="btn-secondary" target="_blank" rel="noopener">Donate to Canine Companions &rarr;</a>
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Preview in browser**

Open `http://localhost:3456` and verify:
- FA section renders in rounded card
- "Learn more about FA" link points to curefa.org
- Two donate cards side by side (stack on mobile)
- FARA card has orange border, Canine Companions has blue border
- Donate buttons link to correct external URLs with target="_blank"

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add FA awareness and donation section"
```

---

## Task 8: SEO, Deployment Files, Final Polish

**Files:**
- Create: `CNAME`
- Create: `robots.txt`
- Create: `sitemap.xml`
- Create: `assets/photos/.gitkeep`

- [ ] **Step 1: Create CNAME**

```
izzypenston.com
```

- [ ] **Step 2: Create robots.txt**

```
User-agent: *
Allow: /

Sitemap: https://izzypenston.com/sitemap.xml
```

- [ ] **Step 3: Create sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://izzypenston.com/</loc>
    <lastmod>2026-04-06</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

- [ ] **Step 4: Create assets/photos/.gitkeep**

Empty file to preserve the directory in git.

- [ ] **Step 5: Add .gitignore**

```
.DS_Store
.superpowers/
```

- [ ] **Step 6: Preview full site in browser**

Open `http://localhost:3456` and run through the full checklist:
- [ ] Nav links scroll smoothly to each section
- [ ] Hero stagger animation plays on load
- [ ] All sections reveal on scroll
- [ ] Pull quotes render with orange border
- [ ] Timeline dots and line render correctly
- [ ] Gallery shows placeholder state gracefully
- [ ] Memory form modal opens/closes with keyboard
- [ ] Donate buttons link to correct external URLs
- [ ] Dark mode looks correct (toggle system preference)
- [ ] Mobile layout works at 375px width
- [ ] Skip-to-content link works (Tab on page load)
- [ ] No JS errors in console

- [ ] **Step 7: Commit**

```bash
git add CNAME robots.txt sitemap.xml assets/photos/.gitkeep .gitignore
git commit -m "feat: add deployment files — CNAME, robots, sitemap, gitignore"
```

---

## Task 9: Push to GitHub and Enable Pages

**Files:** None (git operations only)

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create gpenston/izzypenston --public --description "Memorial website for Izzy Penston — izzypenston.com" --source . --push
```

- [ ] **Step 2: Enable GitHub Pages**

```bash
gh api repos/gpenston/izzypenston/pages -X POST -f source.branch=main -f source.path=/
```

- [ ] **Step 3: Configure Cloudflare DNS**

This is a manual step for George:
- Add CNAME record: `izzypenston.com` → `gpenston.github.io`
- Or add A records pointing to GitHub Pages IPs:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- Enable "Enforce HTTPS" in GitHub Pages settings after DNS propagates

- [ ] **Step 4: Verify site is live**

Visit `https://izzypenston.com` and confirm:
- Site loads with correct styling
- HTTPS works
- All sections render
- Fonts load from Google Fonts
