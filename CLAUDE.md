# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Portfolio site for Tayfun Ilker (tyfn.online). Originally a Webflow export; now an **Astro v5** static site with built-in i18n routing. English is served at `/`, German at `/de/` — no build-time cloning, no manual language duplication.

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
- The language switcher in each page uses `getRelativeLocaleUrl()` from `astro:i18n` via the layouts, so a click on `EN | DE` always resolves to the current page's counterpart in the other locale.

### Layouts

Two layouts own `<html>`, `<head>`, `<body>`, canonical, and `hreflang` (en / de / x-default):

- `src/layouts/BaseLayout.astro` — for the homepages. Loads `/style.css` and the Webflow JS stack (jQuery → `webflow.*.js` → GSAP → ScrollTrigger → SplitType → Lenis) in the exact original order required by the IX2 runtime. Preserves `data-wf-domain`, `data-wf-page`, and `data-wf-site` attributes on `<html>` — the Webflow runtime checks for them.
- `src/layouts/PortfolioLayout.astro` — for portfolio listing + project detail pages. Minimal head, no Webflow scripts, no `style.css`; loads Google Fonts and the project's own inline styles via `<slot name="head-extra">`.

Both layouts expose slots: `head-extra` (inline `<style>`/`<link>` per page) and `scripts-after` (inline `<script>` blocks that must run after the library scripts).

### Pages are thin shells over HTML snippets

The original Webflow HTML is **enormous** and brittle — every section is wired to Webflow IX2 via `data-w-id`, `w-node-*` IDs, and inline style attributes. Rather than refactoring the markup into Astro components (which would risk silently breaking animations), each page imports three raw HTML slices from `src/snippets/` via Vite's `?raw` loader and renders them inside the layout with `<Fragment set:html={...}>`:

- `home-head.html` → inline `<style>` blocks from the original `<head>`
- `home-body.html` → the body markup (nav, hero, sections, footer)
- `home-scripts.html` → the trailing inline `<script>` block (must run after the library scripts, so it goes in the `scripts-after` slot)

The same pattern is used for the three portfolio snippets (`portfolio-index-*.html`, `portfolio-zentrik-*.html`, `portfolio-stellar-*.html`).

**If you need to change page content, edit the snippet file, not the `.astro` page.** The page file only sets metadata (title, description, `lang`, `pathname`, `bodyClass`) and wires the slots.

### Path rewrites baked into the snippets

When the snippets were extracted from the original HTML, these substitutions were applied so the content works under the new Astro routing:

| Original | Rewritten to |
|---|---|
| `./style.css`, `./javascript/…`, `./assets/…` | `/style.css`, `/javascript/…`, `/assets/…` |
| `indexde.html` (EN switcher) | `/de/` |
| `index.html` (DE switcher) | `/` |
| `portfolio/portfolio.html` | `/portfolio/` or `/de/portfolio/` (locale-specific) |
| `portfolio/projects/zentrik_detail_page.html` | `/de/portfolio/zentrik/` |
| `portfolio/projects/stellar_horizon_detail.html` | `/de/portfolio/stellar-horizon/` |
| `stellar-horizon.pdf` (relative) | `/portfolio/projects/stellar-horizon.pdf` |

When you extract or re-sync new slices from upstream HTML, re-apply the same sed rewrites.

### Static assets

Everything in `public/` is served at the same URL path:

- `public/style.css` — the Webflow-generated stylesheet (unchanged from the export; contains no relative `url()` references, only data URIs and absolute Cloudinary URLs, so no rewrites were needed)
- `public/javascript/` — jQuery, `webflow.*.js`, GSAP, ScrollTrigger, SplitType, Lenis. Filenames must stay stable because `BaseLayout.astro` references them by exact name, including the integrity hash on jQuery.
- `public/assets/` — images, SVGs, Lottie JSON animations, and the hero video (`screen-record.mp4` + `.webm` fallback)
- `public/portfolio/projects/stellar-horizon.pdf` — downloadable project PDF

External assets (hero video, mockup images, some Lottie JSON) also load from Cloudinary — those URLs are absolute and hardcoded in the snippets.

## Language duplication status

Phase A of the migration left the homepage markup still duplicated between `src/snippets/en/home-*.html` and `src/snippets/de/home-*.html` — each language has its own full HTML copy. The structural duplication (markup ~86 %, translated text ~14 %) hasn't been removed yet. This was a deliberate trade-off to avoid a risky component refactor over ~1,400 lines of Webflow IX2 markup per page.

Phase B (future work): extract shared sections into `.astro` components and move the ~14 % translated text into `src/i18n/{en,de}.json` so markup lives once.

## Open translation work

See `TODO.md`. The English portfolio pages (`src/pages/portfolio/*.astro`) are currently placeholder stubs that link to the German version; the German portfolio pages (`src/pages/de/portfolio/*.astro`) are the real content. Translating those into English and replacing the stubs is tracked there.

## Conventions

- Don't touch `data-wf-*`, `class="w-…"`, `w-node-*` IDs, or `data-w-id` attributes in the snippets — the Webflow IX2 runtime references them and any rename breaks animations silently.
- Don't run a formatter over the snippet files; they are machine-generated exports and must stay byte-identical to what Webflow produced (minus the path rewrites above).
- Script load order in `BaseLayout.astro` must stay exactly: jQuery → webflow → gsap → scroll-trigger → split-type → lenis. Don't add `defer`, `type="module"`, or reorder.
- Keep macOS `._*` and `.DS_Store` files out of commits (already covered by `.gitignore`).
