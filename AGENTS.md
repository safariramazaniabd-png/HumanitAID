# AGENTS.md — HumanitAID

## Project overview

Single-page fundraising site for HumanitAID Foundation (DRC humanitarian crisis). All markup, styles, and scripts live in one file: `humanitaid.html`. No build system, no framework, no dependencies.

## Key conventions

- **Language**: French (`lang="fr"`). All user-facing text is in French. Keep new content in French.
- **Fonts**: Google Fonts loaded externally — Playfair Display (headings), Crimson Pro (body), Space Mono (labels/monospace). Do not introduce new font families without replacing existing ones.
- **Color system**: CSS custom properties in `:root` (e.g. `--rouge`, `--or`, `--noir`). Use these variables, not hardcoded hex values.
- **Layout**: Vanilla CSS Grid + Flexbox. No CSS framework. Responsive breakpoint at 900px.
- **JS**: Inline `<script>` at end of body. No bundler. Uses IntersectionObserver for scroll animations (fade-up, progress bars, counters). Keep vanilla — no frameworks or libraries.

## Architecture notes

- `humanitaid.html` is the **entire app** — HTML (~1170 lines), CSS (~1160 lines in `<style>`), JS (~190 lines in `<script>`).
- Sections (top to bottom): ticker bar → nav → hero slideshow → stats strip → progress bars (fundraising) → causes grid → testimonials → quotes carousel → news → donation form → footer → confirmation modal.
- The hero slideshow auto-rotates every 5.5s via `setInterval`. Data is in the `heroData` JS array (line ~1749).
- Donation form is UI-only — `submitDon()` opens a confirmation modal. No backend integration.
- Payment tabs: Card / Mobile Money / Wire transfer. Each is a separate panel toggled by `switchTab()`.

## Gotchas

- The ticker bar HTML is **duplicated** (items 1–7 repeated) for seamless CSS animation loop. If you edit ticker items, edit both copies.
- Progress bar animation uses `data-target` attribute on `.bar-fill` elements — width is set via JS on scroll intersection, not CSS.
- Animated stat counters use `data-count` and optional `data-prefix` attributes.
- No test suite, no linter, no formatter configured. Verify changes by opening `humanitaid.html` in a browser.
- No `package.json`, no lockfiles, no CI. This is a zero-tooling project.

## How to preview

Open `humanitaid.html` directly in a browser. No server needed (all assets are inline or from Google Fonts CDN).
