# @iamlazydanger Portal — Rebuild Notes (v2)

This is a from-scratch rebuild fixing every issue reported on the previous version. All 7 pages are plain HTML/CSS/JS (GSAP is used only on page4 for the spider, exactly as before).

## File map (22 files)
- `nav.js` — shared navigation (now actually fixed, see below)
- `page0.html/css/js` — Landing Blog (now fully styled, was unstyled before)
- `page1.html/css/js` — Bone Dragon Cursor (new skull-eating + collapse mechanic)
- `page2.html/css/js` — Cosmic Galaxy (spiral particle system restored)
- `page3.html/css/js` — Flowing Strands (React Bits shader ported to vanilla WebGL)
- `page4.html/css/js` — Blood Spider Clock (IST time, widened, digital readout removed)
- `page5.html/css/js` — The Memory (pyramid layout + PixelCard-style flip effect)
- `page6.html/css/js` — **NEW** Analog Radio Player

## What was fixed, page by page

**Page 0 (Landing):** Previously rendered with no CSS applied. Rebuilt with a complete dark-gaming design system (Orbitron/Inter fonts, cyan/purple/red accent palette, glassmorphism nav, gradient hero, styled post grid, 3D profile modal, chat widget).

**Navigation (nav.js):** The down-arrow-3x advance wasn't working. Root cause was unreliable key-repeat / counter handling. Rewrote from scratch with a `keysHeld` map (only counts the actual keydown transition, not repeats), a 1.5s cooldown, and a 3-press counter per direction, plus a visual dot indicator so you can see presses register.

**Page 1 (Dragon):** Replaced the old segment-follow-cursor-only behavior with: click anywhere → spawns a skull → dragon head targets nearest skull and eats it (skull shrinks and disappears) → if no skull, head follows the cursor. A 90-second (1.5 min) timer runs from page load; when it hits zero the bones animate falling/scattering to the bottom, then auto-navigates to page2.html.

**Page 2 (Galaxy):** The spiral particle system was missing — only the CSS overlay layers showed. Rebuilt the canvas particle generator using proper logarithmic-spiral placement math (4 arms, 6500 particles, density-weighted toward center) so the swirling galaxy shape is visibly back, with the nebula/star/starfield/core overlay layers sitting behind it.

**Page 3 (Strands):** Ported the exact React Bits `<Strands />` GLSL fragment shader logic into a hand-written vanilla WebGL2 renderer (no React, no `ogl` package) — same shader math, same visual result. Configured per your spec: 4 strands, increased thickness, 50% faster speed, vibrant magenta/lime/cyan/gold palette.

**Page 4 (Clock):** Removed the old static "12 9 6 3" background digit watermark and the digital GMT text line. Now shows only the analog hands plus the newly styled red numerals. Time source switched from GMT to Asia/Kolkata (IST) via `Intl.DateTimeFormat`. Stage widened (max-width 900px vs the old square layout).

**Page 5 (Memory):** Rebuilt as a true pyramid layout via CSS Grid (card 1 top-center, cards 2 & 3 bottom-left/bottom-right). Ported the React Bits `PixelCard` pixel-dissolve hover effect to vanilla canvas/JS, layered under the existing 3D flip animation. Card fronts use light fire/khaki gradients with inset highlight+shadow for a glassy 3D look.

**Page 6 (Radio) — new:** Retro analog radio UI with play/pause/prev/next, a drag-controlled volume knob, a CRT-style screen showing track name + rotating quote, and an animated equalizer. Audio is synthesized in-browser via the Web Audio API (oscillators) so it works immediately with zero external files — comments in `page6.js` explain exactly how to swap in real licensed MP3s later.

## Every file is commented
Every JS file explains, per section: what the code does, why that approach was chosen over alternatives, and a few concrete "improvement ideas" for future iteration — per your original instruction.

## To run
Download the folder, open `page0.html` directly in a browser (no server needed for any feature except page3's WebGL, which works fine from `file://` in modern browsers, and page6's audio, which also works from `file://`).
