# Izzy Penston Memorial Website — Design Spec

## Purpose

A memorial website at **izzypenston.com** to celebrate the life of Isabel Grace "Izzy" Penston (November 6, 2000 – March 25, 2026), raise awareness about Friedreich's Ataxia, and direct donations to FARA and Canine Companions.

Izzy was born female and transitioned to male in their 20s. **They/them pronouns are used throughout.**

## Architecture

**Static HTML/CSS site.** No frameworks, no build tools. Vanilla JavaScript for interactions. Deployed on GitHub Pages with Cloudflare DNS (izzypenston.com). Repo: `izzypenston`.

This ensures longevity, zero maintenance, and instant loading. The site is just files — it can be hosted anywhere forever.

## Site Structure

Single long-scroll page (`index.html`) with anchored sections. HTML structured so sections can be extracted into separate pages in the future if desired.

### Section Order

| # | Section | Anchor | Content |
|---|---------|--------|---------|
| 1 | Nav | — | "Izzy." wordmark + anchor links: Their Story, Photos, Memories, Donate |
| 2 | Hero | (top) | Side-by-side: portrait photo left, name/dates/intro right |
| 3 | Life Story | `#story` | Narrative prose adapted from obituary, with pull quotes |
| 4 | Timeline | — | Vertical timeline of key milestones (2000–2026) |
| 5 | Gallery | `#photos` | Responsive photo grid with lightbox, optional captions |
| 6 | Memories | `#memories` | Curated guest messages + submission form |
| 7 | FA + Donate | `#donate` | Brief FA awareness → dual donate cards |
| 8 | Footer | — | Bill & Ted quote, family attribution |

## Design System

### Typography

- **Headings:** Fraunces (variable serif, 400/600/700) — expressive, quirky character with soft wobbly serifs. Feels handmade and alive.
- **Body:** Albert Sans (400/500/600) — friendly geometric sans-serif.
- **Base size:** 16px, line-height 1.6 body / 1.2 headings.
- **Fluid heading:** `clamp(28px, 5vw, 38px)` for hero h1.

### Color Palette — "Sunset Warmth"

**Light mode:**
| Token | Value | Usage |
|-------|-------|-------|
| `--orange` | `#C75D24` | Primary accent, CTAs, FARA card |
| `--orange-hover` | `#A84D1E` | Hover state |
| `--amber` | `#E8A44A` | Warm midtone, optional highlights |
| `--blue` | `#3B7CB8` | Secondary accent, links, Canine Companions card |
| `--blue-hover` | `#2D6494` | Hover state |
| `--bg` | `#FAF7F2` | Page background |
| `--bg-secondary` | `#F0EBE3` | Cards, form, FA section |
| `--text-primary` | `#1E1B18` | Headings, strong text |
| `--text-secondary` | `#6B6560` | Body text |
| `--text-tertiary` | `#8B8580` | Captions, hints, dates |
| `--border` | `#E0DBD4` | Section dividers, card borders |

**Dark mode:** Inverted equivalents maintaining WCAG AA contrast. Orange and blue lighten for readability on dark backgrounds.

### Layout

- `max-width: 720px` container, `padding: 0 24px`
- Section padding: `56px 0`
- Border-bottom dividers between sections
- Mobile breakpoint: 600px (hero stacks, gallery goes to 2 columns, donate cards stack)

### Animation

- Scroll-reveal via Intersection Observer (`data-reveal` attribute)
- Hero stagger animation on load (`data-stagger`)
- `0.6s ease-out` transitions
- `prefers-reduced-motion: reduce` respected — all animations disabled

## Section Details

### Hero

Side-by-side layout: portrait photo (180×220px, rounded 16px) on left, text on right.
- "Remembering Izzy" label in orange
- "Isabel Grace 'Izzy' Penston" as h1
- Dates in italic Fraunces
- One-line intro summary

Stacks vertically on mobile (photo centered above text).

### Life Story

Narrative prose in 5-6 paragraphs adapted from the obituary. Not a copy-paste — rewritten as a celebratory experience piece that captures Izzy's personality, humor, and spirit.

Pull quotes with orange left border (3px):
- "I can't even dance but I'm in charge of the dances."
- "Twenty-five years was not enough, but Izzy made the most of every one of them."

### Timeline

Vertical CSS timeline with:
- 2px vertical line in border color
- Circular dots (14px) with orange border; key milestones have filled orange dots
- Year, title, short description per entry

Milestones: Born in SF (2000), Alameda (2003), FA diagnosis (~2009), GMG grand prize (2015), White House (2016), Maeve (2019), associate's degree (2025), lasting gift (2026).

### Gallery

- Responsive CSS grid: 3 columns desktop, 2 tablet, 1 mobile
- `loading="lazy"` on all images
- Some images span 2 columns for variety
- Optional captions below images
- Vanilla JS lightbox: click to open full-screen overlay, keyboard navigation (Escape, arrows), accessible
- Caption below grid: "Have a photo to share? Send it with your memory below."
- Designed to handle 25-50+ photos with lazy loading

Photos stored in `assets/photos/` — George provides these. Placeholders during build.

### Memories

**Display:** Curated memory cards in a vertical stack.
- Each card: name, optional relationship, message text
- Styled cards on `--bg-secondary` with border
- Data stored in inline `<script type="application/json" id="memories-data">` block
- `memories.js` renders cards on page load

**Form:**
- Fields: Name (required), Email (required, not published), Relationship (optional), Memory textarea (required)
- Hidden honeypot field for spam protection
- Moderation notice: "Your message may be reviewed before appearing on this page."
- Submission via Formspree (free tier, 50/month) → email to George/Zoe
- Inline thank-you state after submission (JS replaces form)
- Photo nudge: "Have a photo of Izzy you'd like to share? Email it to memories@izzypenston.com"

### FA Awareness + Donate

**FA section:** Rounded card on secondary background. ~100 words explaining FA through Izzy's experience. Ends with "Learn more about FA →" link to curefa.org/what-is-friedreichs-ataxia.

**Donate cards:** Two side-by-side cards (stack on mobile):
- **FARA** (primary, orange border): "Help fund research to slow, stop, and reverse Friedreich's Ataxia." → curefa.org/donate/
- **Canine Companions** (secondary, blue border): "Honor the bond between Izzy and Maeve." → canine.org/donate-now/

### Footer

- Bill & Ted quote in italic Fraunces: "Be excellent to each other. Party on, dudes!"
- Attribution: "— Bill & Ted's Excellent Adventure (Izzy's parting words)"
- Thin divider line
- "With love from the Penston family — George, Zoe, Wendy & Maeve"

## File Structure

```
izzypenston/
├── index.html
├── assets/
│   ├── style.css
│   ├── animations.js
│   ├── lightbox.js
│   ├── memories.js
│   ├── og-image.jpg
│   └── photos/
│       └── .gitkeep
├── docs/
│   ├── izzy_obituary.md
│   └── izzy_fara_blurb.md
├── CNAME                      # izzypenston.com
├── robots.txt
├── sitemap.xml
└── CLAUDE.md
```

## SEO & Social

- `<title>`: "Izzy Penston — Celebrating a Life Lived Fully"
- Open Graph image (1200×630) for social sharing
- `Person` schema (JSON-LD) with name, dates, description
- Canonical URL: https://izzypenston.com
- Twitter Card: summary_large_image

## Deployment

- **Hosting:** GitHub Pages from `main` branch
- **Domain:** izzypenston.com (Cloudflare DNS → GitHub Pages)
- **HTTPS:** GitHub Pages + Cloudflare
- **Local dev:** `python3 -m http.server 3456`

## Accessibility

- Semantic HTML throughout (`<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`)
- Skip-to-content link
- All images with descriptive `alt` text
- Focus-visible outlines (2px solid accent)
- Color contrast: WCAG AA minimum on all text
- Lightbox: keyboard navigable, focus trap, Escape to close
- Form: proper `<label>` associations, required field indicators
- `prefers-reduced-motion` respected

## Future Considerations

- Sections structured to be extractable into separate pages if desired
- Gallery can grow indefinitely with lazy loading
- Memory curation workflow: Formspree → email → add to JSON in HTML → push
