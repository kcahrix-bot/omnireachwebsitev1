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
| **Application**: `#apply-form` | There's no backend or Calendly. Submitting opens the visitor's email app with a pre-filled application to hello@omnireachstudios.com. To use Calendly or a form service, replace the form or set its `action`. |
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
- The page also works without JavaScript; the content stays readable.
- Fonts (Instrument Serif, Inter, Montserrat) load from Google Fonts. That's the only external request.
