# OmniReach Studios — landing page (v2)

A static, dependency-free dark landing page built around the 1M Views Pilot.
Design metaphor: you watch a founder's expertise turn into distribution as you scroll.

```
claude-version/
├── index.html      all 18 sections, in the approved order
├── styles.css      tokens, layout, animations, reduced-motion rules
├── script.js       scroll scenes, trust-layer diagram, odometer, nav, FAQ, form (vanilla JS)
├── serve.cjs       tiny local preview server (Node, no packages)
├── assets/         transparent logo, favicon
└── _v1/            the previous version, kept for reference
```

## Preview

```bash
node serve.cjs
```

Then open http://localhost:5173.

## Before going live: replace the placeholders

These parts are deliberately marked as placeholders, so nothing unapproved is shown as proof.

| Where | What to do |
|---|---|
| **Hero VSL**: `.vsl__frame` in index.html | Replace the animated `<svg class="vsl__art">` with a `<video>` or embed. Remove the "Video coming soon" tag. |
| **Proof rail**: `.rail__track` | Each `<li class="rail__item proof-slot">` is an empty frame. Swap it for an `<li class="rail__item"><img …></li>` with an approved screenshot, logo or video still. Tai Lopez and Bear Grylls appear as name plates; confirm both are approved for public use. |
| **Case studies**: `.cases` | Three "Approved example slot" frames for Input → Asset → Result examples. |
| **Booking**: `#cal-booking` | Cal.com inline widget for `k-c-gd52m2/30min` (Founder Distribution Audit). It loads only when visitors approach the section. Booking questions (company, stage, notes…) are set in your Cal.com event settings. Links can prefill the form: `?name=Jane%20Doe&email=jane@acme.com`. `utm_*` tags are passed through, and every booking is tagged `metadata[source]=omnireach-landing-page`. |
| **FAQ answers** | Written from the brief without inventing terms. Check them against Lucas's draft, especially the guarantee terms. |

## Motion

- Sticky, scroll-driven scenes:
  - Founder → ideas → platforms → market
  - The 5-step Distribution Engine
  - 1,000,000 breaking into what it builds
- One-time reveals:
  - Strike-through on "Not Another Content Agency"
  - Odometer
  - Line-draw charts
  - Branch lines
- Gentle loops:
  - Trust-layer prospects
  - Orbit
  - Machine grid
- `prefers-reduced-motion` gives a static, complete version of every scene.
- Performance rules (keep these when editing):
  - Scroll scenes measure layout once, then only write `transform` and `opacity`.
  - Looping animations live inside `[data-anim]` regions, which pause while off-screen.
  - Moving dots use the Web Animations API on HTML layered over the SVG, not SVG `<animateMotion>`.
  - Phones drop the nav's backdrop blur.
- After changing CSS or JS, bump the `?v=` query on both references in index.html. GitHub Pages caches assets for 10 minutes.
- The page also works without JavaScript; the content stays readable.
- External requests: fonts (Instrument Serif, Inter, Montserrat) from Google Fonts, and the Cal.com widget, which loads only near the booking section.
