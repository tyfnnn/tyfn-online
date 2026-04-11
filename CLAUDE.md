# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static portfolio site for Tayfun Ilker (tyfn.online), originally exported from Webflow (`data-wf-site` / `data-wf-page` attributes are still present on the root pages). There is no build system, package manager, or test suite — files are served as-is.

## Running locally

Open any HTML file directly in a browser, or serve the directory statically, e.g.:

```sh
python3 -m http.server 8000
```

## Architecture

- **Top-level pages** are duplicated per language. English pages use `index.html` / `startseite.html` (`lang="en"`); the German variant is `indexde.html` (`lang="de"`). Any content change to one language page must be mirrored in the other — there is no shared template or i18n layer.
- **Portfolio subsection** lives under `portfolio/`:
  - `portfolio.html` — listing page
  - `project_detail_page_template.html` — template used as a starting point for new project pages
  - `projects/*.html` — concrete per-project detail and video-player pages
  - All `portfolio/` pages are currently `lang="de"`.
- **Styling** is split across two large Webflow-generated stylesheets at the repo root: `style.css` and `style2.css`. Inline `<style>` blocks in the HTML pages (e.g. the "CTO Glassmorphism" card in `index.html`) hold page-specific overrides — prefer adding new page-specific CSS inline rather than editing the bulk Webflow CSS, which is hard to diff.
- **JavaScript** dependencies live in `javascript/` (jQuery, GSAP + ScrollTrigger, Lenis, SplitType, plus the Webflow runtime). The two root-level `webflowjs1.js` / `webflowjs2.js` files are the bundled Webflow site script — treat them as generated/vendor code and avoid hand-editing.
- **Assets** (`assets/`) contain Lottie JSON animations (`animation_bupur.json`, `dropdown.json`, `MacBookMockUp.json`), device mockup PNGs at multiple widths (responsive `srcset`), social SVG icons, the profile image (also at multiple widths), and the screen-recording video in both `.mp4` and `.webm` for `<video>` fallbacks.

## Conventions

- When adding a new project, copy `portfolio/project_detail_page_template.html` into `portfolio/projects/` and wire it into `portfolio/portfolio.html`.
- When adding responsive images, follow the existing `*-500w` / `*-700w` / `*-800w` naming used in `assets/` and emit `srcset` accordingly.
- The `._*.html` and `.smbdelete*` files in the repo root are macOS/SMB metadata artifacts, not source — leave them alone.
