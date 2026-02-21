# CLAUDE.md — tyfn.online Portfolio

## Project Overview

Static portfolio website for Tayfun Ilker (designer & mobile developer), built with Webflow and exported as static HTML. Live at **www.tyfn.online**.

Two language variants exist as separate files:
- `index.html` + `style.css` — English
- `startseite.html` + `style2.css` — German

## Tech Stack

**No build tools, no package manager, no compilation step.** This is a static site — changes to HTML/CSS/JS files are reflected directly.

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 (Webflow-generated) |
| Styles | Vanilla CSS3 |
| Scripting | Vanilla JavaScript (ES6+) |
| Animations | GSAP 3, ScrollTrigger, SplitType, Lenis |
| Runtime | Webflow JS (webflowjs1.js, webflowjs2.js) |
| Fonts | Adobe Typekit |

## File Structure

```
/
├── index.html              # English homepage
├── startseite.html         # German homepage
├── style.css               # English styles (176KB)
├── style2.css              # German styles (200KB)
├── webflowjs1.js           # Webflow runtime (880KB)
├── webflowjs2.js           # Webflow supplementary runtime
├── javascript/
│   ├── gsap.js             # GreenSock Animation Platform
│   ├── scroll-trigger.min.js
│   ├── split-type.js       # Character/word/line text splitting
│   └── lenis.js            # Smooth scrolling
└── assets/
    ├── *.png / *.jpeg      # Responsive image variants (500w, 700w, 800w)
    ├── screen-record.mp4
    ├── screen-record-transcode.webm
    ├── MacBookMockUp.json  # Large Lottie animation (9.7MB)
    ├── animation_bupur.json
    ├── dropdown.json
    └── *.svg               # Social icons
```

## Development Workflow

This project uses a **Webflow export workflow**:
1. Visual editing happens in the Webflow editor
2. HTML/CSS is exported and committed here
3. Custom animations are written directly in the exported HTML files

When making manual edits:
- Mirrored changes across both `index.html`/`style.css` (EN) and `startseite.html`/`style2.css` (DE) are usually required
- No linting, formatting, or type-checking is configured
- No test suite exists

## Animation Architecture

**GSAP** is the primary animation engine:
- Timeline-based sequences via `.timeline()`
- Scroll-triggered animations via `ScrollTrigger.create()` and a custom `createScrollTrigger()` helper
- Text animations use `SplitType` on elements with the `[text-split]` data attribute
- Lenis provides smooth scroll physics, integrated with GSAP ticker

## Responsive Design

- CSS media queries with breakpoints at `min-width: 992px`
- Multiple image sizes committed as separate files (e.g. `-500w`, `-700w`, `-800w`, `-809w` suffixes)
- CSS `transform: translate3d()` and `scale3d()` used for responsive layout adjustments

## Webflow Metadata

- Webflow site ID: `675f1f0e41c3cbd6e1800581`
- Domain: `www.tyfn.online`

## Git Branches

- `main` — production branch
- `claude/*` — Claude Code working branches (PRs merge into main)

## Key Constraints

- All JS libraries are vendored (committed as files), not managed via npm
- No `.gitignore` at root — be careful not to commit large temporary files
- Avoid modifying `webflowjs1.js` / `webflowjs2.js` — these are Webflow runtime files
- When editing animations, prefer the JS animation files in `javascript/` or inline scripts in the HTML rather than touching Webflow-generated CSS classes
