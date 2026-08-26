# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Portfolio site for Tayfun Ilker (tyfn.online). Originally a Webflow export; now an **Astro v5** static site with built-in i18n routing and a shared component tree. English is served at `/`, German at `/de/` — markup lives once, translated text lives in `src/i18n/{en,de}.json`.

## Commands

```sh
npm install          # once
npm run dev          # http://localhost:4321 with HMR
npm run build        # -> dist/ (static output)
npm run preview      # serve dist/ locally
```

There is no test suite. Animations/interactions are Webflow-runtime driven, so they should always be verified against `npm run build && npm run preview` rather than the dev server — HMR can cause Webflow IX2 / SplitType to double-initialize and hide real regressions.

## Architecture

### Routing & i18n

Configured in `astro.config.mjs`:

- `defaultLocale: 'en'`, `locales: ['en', 'de']`, `routing: { prefixDefaultLocale: false }`
- English routes live under `src/pages/*.astro` and are served at `/`, `/portfolio/`, `/portfolio/zentrik/`, `/portfolio/stellar-horizon/`.
- German mirrors live under `src/pages/de/*.astro` and serve at `/de/`, `/de/portfolio/`, …
- Cross-locale links are built at render time via `getRelativeLocaleUrl()` from `astro:i18n`. The `EN | DE` switcher in `Navbar.astro` always resolves to the current page's counterpart in the other locale.

### Layouts

Two layouts own `<html>`, `<head>`, `<body>`, canonical, and `hreflang` (en / de / x-default):

- `src/layouts/BaseLayout.astro` — for the homepages. Loads `/style.css` and the Webflow JS stack (jQuery → `webflow.*.js` → GSAP → ScrollTrigger → SplitType → Lenis) in the exact original order required by the IX2 runtime. Preserves `data-wf-domain`, `data-wf-page`, and `data-wf-site` attributes on `<html>` — the Webflow runtime checks for them.
- `src/layouts/PortfolioLayout.astro` — for the portfolio listing and project detail pages. Minimal head, no Webflow scripts, no `style.css`; pages inject their own Google Fonts + inline style block via `<slot name="head-extra">`.

Both layouts expose slots: `head-extra` (inline `<style>`/`<link>` per page) and `scripts-after` (inline `<script>` blocks that must run after the library scripts).

### Homepage: section components

`src/pages/index.astro` and `src/pages/de/index.astro` are thin ~40-line shells that compose the homepage from section components under `src/components/home/`:

| Component | Purpose |
|---|---|
| `Navbar.astro` | Top nav, status line, logo home-link, language switcher |
| `Hero.astro` | H1, pixelate profile image, email line, tagline |
| `About.astro` | About heading + long body paragraphs |
| `Projects.astro` | `<section id="projects">` wrapper with bg-grid, scroll marquee and the MacBook mockup (Lottie + background video + iPhone/iPad/Watch blur stack). Exposes a default `<slot />` where `MacBookDock` is mounted — matching the original nested `<section class="cto-section">` placement |
| `MacBookDock.astro` | The 3D MacBook (three.js + `public/models/macbook-ultra.glb`) with a live macOS desktop projected onto its display. See below. |
| `CtoCard.astro` | The previous iPad mock-up. **No longer mounted** — `MacBookDock.astro` replaced it; kept for reference |
| `Process.astro` | 4-step process grid |
| `Footer.astro` | CTA heading, email link, social icons, copyright, pre-rendered Lottie fallback SVG |

Each component takes a `lang` prop (and `pathname` where cross-locale links are needed) and reads its strings via `useTranslations(lang)` from `src/i18n/t.ts`.

### The MacBook scene (`MacBookDock.astro`)

Mounted into `Projects.astro`'s `<slot />`. It owns the only heading between the
scroll scene and the process section — the scene used to close with its own
eyebrow + heading (`projects.scene.outro.*`), which read as the same sentence
twice, so that block is gone. Don't reintroduce a second centred heading stack
here. It has three parts that are easy to
break independently:

**1. The 3D model.** `macbook-ultra.glb` is loaded with `GLTFLoader` +
`MeshoptDecoder`. The finish follows the page theme — Space Black under the
dark palette, Silver under `html[data-theme="light"]` — retinted in place by a
`MutationObserver` on that attribute, along with the key/rim intensities, since
a near-black chassis on a near-black page needs its edges lit and a silver one
does not. The badge on the lid ships the exact colour of the case in the GLB,
so it always gets its own polished tone or it is invisible. The camera is placed exactly on the display's normal so the
screen is parallel to the viewer (a true rectangle, not a trapezoid);
`solveFraming()` then iterates the camera distance until the whole laptop fits
the framing rect. The GLB's `Lid` node pivots around the panel's own centre, so
the runtime re-parents it under a group on the real hinge line and drives that
— plus a few millimetres of lift as it shuts, or the closed lid ends up inside
the chassis.

**2. The screen overlay.** `.mbd-screen-ui` is ordinary DOM (menu bar,
notification centre, desktop window, dock, seven app windows) that is pinned to
the panel every frame by a projective `matrix3d` solved from the display's four
projected corners. It is a **fixed-size design surface** (800px wide, 540 on
phones) that gets scaled by that matrix — so:

- Layout inside it must never depend on the viewport. Use `cqw`/`cqh` (the
  surface is a `container-type: size` container) or `@container` queries.
  A `@media (max-width: …)` rule in here is almost always a bug.
- `cqw` on `.mbd-screen-ui` *itself* does not work — an element is not its own
  container, so those resolve against the viewport. Anything on the surface
  element (its corner radius, for one) is set from the runtime in px.
- Shrinking `surface.w` does **not** enlarge the UI: everything on the desktop
  is sized in `cqw`, so it scales with the surface and nets out. It only
  enlarges the seven app windows, whose internals are in px. To make the
  desktop read bigger, raise its `cqw` values.
- The inverse of that matrix maps the real cursor into surface coordinates,
  which is what drives the dock magnification and the in-screen cursor.

**3. The flight layer.** At runtime the canvas and the overlay are moved out of
`.mbd-canvas-wrap` into `.mbd-flight_sticky`, which is hoisted to be the first
child of `#projects` and sticks for the whole section. While it cruises the
laptop is shut and turned lid-up so the badge faces the reader, and it tracks
whichever block of copy the scroll scene has faded in (`.ps-story.visible`,
falling back to the marquee and the outro) — so it is always drifting behind
the thing being read. It then flies into place, rolls down and opens as its
in-flow box comes up — and swaps from behind the bg-grid and the scroll scene
to in front of them (`.mbd-flight.is-front`) as the lid opens, since it is the
subject by then. `.mbd-canvas-wrap` stays behind as an invisible
placeholder and is read every frame as the landing target — `camera.setViewOffset()`
renders the framed image into that rect, so nothing about the framing has to move.
`prefers-reduced-motion` pins it landed and skips the journey entirely.

### Portfolio: shared components

`src/components/portfolio/`:

| Component | Purpose |
|---|---|
| `PortfolioIndex.astro` | The two-card listing page, fully driven by `i18n/*.json` keys under `portfolio.{index,zentrik,stellar}` |
| `ZentrikDetail.astro` | Thin wrapper that imports `zentrik-detail-{en,de}.html` via `?raw` and renders the right locale via `<Fragment set:html>` |
| `StellarDetail.astro` | Same pattern for the Stellar Horizon detail page |

The Zentrik and Stellar detail pages contain lots of structural HTML markup per paragraph (`<span class="highlight">`, feature grids, stats, CTA buttons). Rather than exploding into 100+ translation keys with embedded markup, the bodies live as locale-specific snippet files and the component picks one based on `lang`. This matches how the long `About` body is handled (`about-body-{en,de}.html`).

### i18n strings

- `src/i18n/en.json` and `src/i18n/de.json` are the dictionaries. They must stay structurally identical — `useTranslations(lang)` falls back to English for missing keys but any divergence is a silent bug waiting to happen.
- `src/i18n/t.ts` exports `useTranslations(lang)` which returns a typed `t(key)` function with dot-notation lookups (`t('cto.badge')`, `t('portfolio.zentrik.card_title')`, etc.). The `TranslationKey` type is derived from the EN dictionary so mis-spellings fail at build time.
- For translated text that contains HTML (`<br />`, `<strong>`, `<span class="highlight">`), either:
  - put the whole fragment in one JSON value and render it via `<Fragment set:html={t('…')} />` or `<element set:html={t('…')} />`, OR
  - extract the content to a locale-specific `.html` snippet under `src/snippets/` and import it via `?raw` (used for `about-body-{en,de}.html` and the portfolio detail bodies).

### Static assets

Everything in `public/` is served at the same URL path:

- `public/style.css` — the Webflow-generated stylesheet (unchanged from the export; contains no relative `url()` references, only data URIs and absolute Cloudinary URLs, so no rewrites were needed)
- `public/javascript/` — jQuery, `webflow.*.js`, GSAP, ScrollTrigger, SplitType, Lenis. Filenames must stay stable because `BaseLayout.astro` references them by exact name, including the integrity hash on jQuery.
- `public/assets/` — images, SVGs, Lottie JSON animations, and the hero video (`screen-record.mp4` + `.webm` fallback)
- `public/models/macbook-ultra.glb` — the meshopt-compressed MacBook used by `MacBookDock.astro` (the only reason `three` is a runtime dependency)
- `public/portfolio/projects/stellar-horizon.pdf` — downloadable project PDF

External assets (hero video, mockup images, some Lottie JSON) also load from Cloudinary — those URLs are absolute and hardcoded in the components.

### Remaining snippets

Not every piece of the old Webflow export has been componentised. These still live as raw HTML snippets and are loaded via Vite's `?raw` import:

```
src/snippets/
├── en/home-head.html           # CTO glassmorphism + IX2 initial-state CSS, injected
│                                 via BaseLayout head-extra on both locales
├── en/home-scripts.html        # Pixelate + SplitType + GSAP init, injected via
│                                 BaseLayout scripts-after on both locales
├── home/
│   ├── about-body-{en,de}.html   # About paragraph body per locale
│   └── footer-lottie-fallback.html # Pre-rendered Webflow Lottie SVG cache
└── portfolio/
    ├── index-head.html         # Google Fonts + portfolio-index CSS (locale-neutral)
    ├── zentrik-head.html
    ├── zentrik-scripts.html
    ├── zentrik-detail-{en,de}.html
    ├── stellar-head.html
    ├── stellar-scripts.html
    └── stellar-detail-{en,de}.html
```

## Conventions

- Don't touch `data-wf-*`, `class="w-…"`, `w-node-*` IDs, or `data-w-id` attributes in the homepage components or snippets — the Webflow IX2 runtime references them and any rename breaks animations silently.
- Don't run a formatter over the `src/snippets/` files; they are Webflow-exported HTML and need to stay byte-identical to what IX2 expects.
- Script load order in `BaseLayout.astro` must stay exactly: jQuery → webflow → gsap → scroll-trigger → split-type → lenis. Don't add `defer`, `type="module"`, or reorder.
- When you add a new translated string, add it to both `en.json` and `de.json` in the same place. The TS type derived from `en.json` will catch a missing EN key; a missing DE key silently falls back to EN at runtime, so grep both JSON files when adding keys.
- Every page component receives `lang` explicitly — don't read `Astro.currentLocale` from inside a section component, accept it as a prop from the page.
- When adding an internal link to a content file, compute the href with `getRelativeLocaleUrl(lang, '/path/')` rather than hardcoding `/de/...`, so both locales stay in sync.
- Inside `MacBookDock.astro`'s screen overlay, size things with `cqw`/`cqh` and branch with `@container`, never with `@media` — the surface is a fixed-size container, not the viewport.
- Keep macOS `._*` and `.DS_Store` files out of commits (already covered by `.gitignore`).
