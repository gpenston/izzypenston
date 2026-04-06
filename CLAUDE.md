# Izzy Penston Memorial Site

## Project
Static memorial website at izzypenston.com. Pure HTML/CSS/vanilla JS — no frameworks, no build tools.

## Conventions
- **Pronouns:** Izzy uses they/them pronouns throughout all content.
- **Fonts:** Fraunces (headings), Albert Sans (body) via Google Fonts.
- **Colors:** "Sunset Warmth" palette — orange primary (#C75D24), blue secondary (#3B7CB8), warm linen backgrounds.
- **Layout:** max-width 720px container, 24px side padding.
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
