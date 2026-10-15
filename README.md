# OmniReach Studios — dark landing page

A static, dependency-free dark version of the OmniReach landing page.

```
claude-version/
├── index.html          page markup (semantic sections, all content)
├── styles.css          design tokens, layout, animations, reduced-motion rules
├── script.js           nav, mobile menu, scroll reveals, FAQ, copy-email (vanilla JS)
├── serve.cjs           tiny local preview server (Node, no packages)
└── assets/
    ├── logo-mark.png      transparent, trimmed logo (nav/footer, 1x)
    ├── logo-mark@3x.png   transparent, trimmed logo (retina + illustrations)
    └── favicon.png
```

## Preview locally

From this folder:

```bash
node serve.cjs
```

Then open http://localhost:5173. Use `node serve.cjs 8080` for a different port.
You can also double-click `index.html`. Everything works from `file://` except the
"Copy" button, which may fall back to a manual-copy message.

## Notes

- **Logo:** the supplied PNG had a white background and a lot of padding. It was trimmed
  and converted to true transparency (white removed mathematically, so the anti-aliased
  edges stay smooth on dark backgrounds). The original file in Downloads was not changed.
- **Fonts:** Instrument Serif, Inter and Montserrat (same families as the reference) load
  from Google Fonts. That is the only external request, and good system-font fallbacks
  are defined. To be fully offline, download the `.woff2` files into `assets/fonts/` and
  swap the `<link>` for `@font-face` rules.
- **Booking:** there is no scheduling integration, so the booking section offers a
  `mailto:` link to hello@omnireachstudios.com plus a copy-to-clipboard button. To add a
  scheduler later, replace the `.book__contact` block in `index.html`.
- **About image:** the reference used a stock placeholder ("replace with actual founder
  portrait"). It is now an animated logo emblem. Replace `.about__visual` with a real
  portrait when one is available.
- **No invented facts:** all copy comes from the reference. The hero and "How it works"
  video placeholders are now animated illustrations built only from the reference's own
  content (ideas from meetings and calls → positioning, creative direction, production →
  LinkedIn, X, YouTube, short-form). Each says honestly that a video is coming soon.
