/**
 * ============================================================
 * page1.js — Dragon Cursor (SVG-based with Skull Mechanic)
 * ============================================================
 * PURPOSE:
 *  1. A snake-like dragon made of 40 reusable SVG segments that
 *     follows the mouse/pointer cursor.
 *  2. When idle (pointer hasn't moved), the dragon's head wanders
 *     in a Lissajous-like curve, creating breathing/idle motion.
 *  3. Clicking anywhere spawns a skull at that location.
 *  4. Once a skull exists, the dragon slows to 20% speed and
 *     chases the nearest skull, eating it on contact.
 *  5. A 90-second timer runs silently in the background (no
 *     on-screen display), advancing to the next page when time expires.
 *
 * ORIGINAL LOGIC: Pure vanilla JS + SVG, no external libraries.
 * The dragon uses a classic "follow the leader" chain physics
 * technique where each segment follows the one before it.
 *
 * IMPROVEMENT IDEAS:
 *  - Add sound effect when eating a skull
 *  - Add particle effects on skull spawn
 * ============================================================
 */

"use strict";

const screen = document.getElementById("screen");
const xmlns = "http://www.w3.org/2000/svg";
const xlinkns = "http://www.w3.org/1999/xlink";

// ─── VIEWPORT & DRAGON SETUP ───────────────────────────────

window.addEventListener(
  "pointermove",
  (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    rad = 0; // reset idle wander when pointer moves
  },
  false
);

const resize = () => {
  width = window.innerWidth;
  height = window.innerHeight;
};

let width, height;
window.addEventListener("resize", () => resize(), false);
resize();

/**
 * prepend(use, i)
 * Creates a <use> element referencing a shape by id, adds it to
 * the screen group, and stores a reference in elems[i].
 */
const prepend = (use, i) => {
  const elem = document.createElementNS(xmlns, "use");
  elems[i].use = elem;
  elem.setAttributeNS(xlinkns, "xlink:href", "#" + use);
  screen.prepend(elem);
};

const N = 40; // dragon body segment count

const elems = [];
for (let i = 0; i < N; i++) elems[i] = { use: null, x: width / 2, y: 0 };

const pointer = { x: width / 2, y: height / 2 };
const radm = Math.min(pointer.x, pointer.y) - 20;
let frm = Math.random();
let rad = 0;

// Segment shape assignment: head, fins, body
for (let i = 1; i < N; i++) {
  if (i === 1) prepend("Cabeza", i);
  else if (i === 8 || i === 14) prepend("Aletas", i);
  else prepend("Espina", i);
}

// ─── SKULL MECHANIC ────────────────────────────────────────

let skulls = []; // array of skull positions {x, y, eaten}
let baseSpeed = 0.25; // normal dragon speed
let currentSpeed = 0.2; // speed multiplier (affected by skull presence)

/**
 * getNearestSkull()
 * Returns the closest uneaten skull to the dragon's head.
 */
function getNearestSkull() {
  if (skulls.length === 0) return null;
  const head = elems[1];
  let nearest = null;
  let nearestDist = Infinity;
  for (const skull of skulls) {
    if (skull.eaten) continue;
    const dx = skull.x - head.x;
    const dy = skull.y - head.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = skull;
    }
  }
  return nearest;
}

/**
 * Skull click handler: spawns a skull at click location.
 * Sets dragon speed to 20% (0.02).
 */
window.addEventListener("click", (e) => {
  skulls.push({
    x: e.clientX,
    y: e.clientY,
    eaten: false,
  });
  currentSpeed = 0.02; // 20% of normal speed
});

// ─── TIMER (silent, background) ────────────────────────────

const ACTIVE_DURATION_MS = 90 * 1000; // 1.5 minutes
const pageStartTime = Date.now();

/**
 * Timer checks silently in the background.
 * When 90 seconds elapse, auto-advance to the next page.
 */
setInterval(() => {
  const elapsed = Date.now() - pageStartTime;
  if (elapsed >= ACTIVE_DURATION_MS) {
    window.location.href = "page2.html";
  }
}, 1000);

// ─── ANIMATION LOOP ────────────────────────────────────────

const run = () => {
  requestAnimationFrame(run);

  // Compute idle wander offset (Lissajous-style motion)
  let e = elems[0];
  const ax = (Math.cos(3 * frm) * rad * width) / height;
  const ay = (Math.sin(4 * frm) * rad * height) / width;

  // Decide chase target: nearest skull if one exists, else pointer
  const chaseTarget = getNearestSkull() || pointer;

  // Head eases toward target with current speed
  e.x += (ax + chaseTarget.x - e.x) / (10 / currentSpeed);
  e.y += (ay + chaseTarget.y - e.y) / (10 / currentSpeed);

  // Check if head reaches a skull (eating it)
  for (const skull of skulls) {
    if (!skull.eaten) {
      const dx = skull.x - e.x;
      const dy = skull.y - e.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30) {
        skull.eaten = true;
      }
    }
  }

  // Remove eaten skulls
  skulls = skulls.filter((s) => !s.eaten);

  // If no skulls remain, reset to normal speed
  if (skulls.length === 0) {
    currentSpeed = baseSpeed;
  }

  // Body segments follow the head (chain physics)
  for (let i = 1; i < N; i++) {
    let e = elems[i];
    let ep = elems[i - 1];
    const a = Math.atan2(e.y - ep.y, e.x - ep.x);
    e.x += (ep.x - e.x + (Math.cos(a) * (100 - i)) / 5) / 4;
    e.y += (ep.y - e.y + (Math.sin(a) * (100 - i)) / 5) / 4;

    // Scale shrinks toward the tail
    const s = (162 + 4 * (1 - i)) / 50;
    e.use.setAttributeNS(
      null,
      "transform",
      `translate(${(ep.x + e.x) / 2},${(ep.y + e.y) / 2}) rotate(${
        (180 / Math.PI) * a
      }) translate(${0},${0}) scale(${s},${s})`
    );
  }

  // Idle wander grows while pointer is still
  if (rad < radm) rad++;
  frm += 0.003;

  // If idle for a long time, gently drift pointer back to center
  if (rad > 60) {
    pointer.x += (width / 2 - pointer.x) * 0.05;
    pointer.y += (height / 2 - pointer.y) * 0.05;
  }
};

run();

