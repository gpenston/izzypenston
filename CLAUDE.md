# Izzy Penston Memorial Site

## Project
Static memorial website at izzypenston.com. Pure HTML/CSS/vanilla JS — no frameworks, no build tools.

## Conventions
- **Pronouns:** Izzy uses they/them pronouns throughout all content.
- **Fonts:** Fraunces (headings), Albert Sans (body) via Google Fonts.
- **Colors:** "Sunset Warmth" palette — orange primary (#B34D18), blue secondary (#2D6494), warm linen backgrounds. Dark mode uses lighter variants. Tokens in `assets/style.css` `:root`.
- **Layout:** `clamp(720px, 75vw, 900px)` container, 24px side padding. Prose (paragraphs, h2, pull quotes) capped at `68ch` for readability; cards and grids use full width.
- **Nav:** Sticky, full-width, adds `.is-scrolled` shadow on scroll.
- **Footer:** Full-width, `--bg-secondary` background, outside the container div.
- **JS:** No build tools, no transpiler, no bundler. Vanilla JS that runs directly in modern browsers. IIFE pattern preferred for module encapsulation.
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
