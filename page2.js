/**
 * ============================================================
 * page2.js — Cosmic Galaxy: Spiral Particle System
 * ============================================================
 * PURPOSE: Renders a realistic swirling spiral galaxy using
 * 6000+ canvas particles arranged along logarithmic spiral arms,
 * plus generates the twinkling star layer and zooming starfield
 * layer dynamically (so we don't hardcode hundreds of <div> tags
 * in the HTML).
 *
 * HOW THE SPIRAL MATH WORKS:
 * A logarithmic spiral is defined by the polar equation:
 *    r = a * e^(b * theta)
 * where r = distance from center, theta = angle, a/b = shape constants.
 * Real spiral galaxies (like the Milky Way) approximate this shape.
 * We generate several "arms" by offsetting theta by fixed amounts
 * (e.g. 0°, 120°, 240° for a 3-arm galaxy).
 *
 * IMPROVEMENT IDEAS:
 * - Add slight z-depth (parallax) so particles nearer "camera" are bigger
 * - Vary arm count via a config slider for experimentation
 * - Add occasional bright "supernova" particles that flash
 * ============================================================
 */

(function () {
  "use strict";

  // ─── CANVAS SETUP ──────────────────────────────────────────
  const canvas = document.getElementById("galaxyCanvas");
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // ─── GALAXY CONFIGURATION ──────────────────────────────────
  const PARTICLE_COUNT = 12000; // Increased from 6500 for full-page coverage
  const ARM_COUNT = 4; // Number of spiral arms
  const SPIRAL_TIGHTNESS = 0.28; // 'b' constant in the log spiral formula — higher = looser spiral
  const MAX_RADIUS = 0.65; // Increased to cover entire page with particles
  const ROTATION_SPEED = 0.00004; // Radians per millisecond — controls overall swirl speed

  /**
   * COLOR_PALETTE: The realistic light colors requested —
   * white, gold, blue, plum, peach, pink, cyan — weighted so
   * white/gold appear most often (like real star populations).
   */
  const COLOR_PALETTE = [
    "#ffffff", "#ffffff", "#ffffff", // white (most common — young hot stars)
    "#fff4d6", "#ffe9b3", // gold/warm tones
    "#bcd9ff", // blue
    "#d9b3ff", // plum
    "#ffd1b3", // peach
    "#ffb3d9", // pink
    "#b3f0ff", // cyan
  ];

  // ─── PARTICLE GENERATION ───────────────────────────────────

  /**
   * particles: Array of star objects, each placed along a spiral arm.
   * Each particle stores its polar coordinates (baseRadius, baseAngle)
   * rather than x/y directly — this lets us rotate the entire galaxy
   * each frame just by adding a rotation offset to baseAngle.
   */
  const particles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Pick which spiral arm this particle belongs to
    const armIndex = i % ARM_COUNT;
    const armOffset = (armIndex / ARM_COUNT) * Math.PI * 2;

    // Random progress along the arm's length (0 = center, 1 = outer edge)
    // WHY sqrt: Using sqrt(random) clusters more particles toward the
    // center, matching real galaxy density (denser core, sparser edges)
    const t = Math.sqrt(Math.random());

    // Logarithmic spiral angle grows with t
    const theta = t * Math.PI * 4 + armOffset; // 4*PI = 2 full rotations per arm

    // Radius grows exponentially with theta (the defining spiral trait)
    const radius = t * MAX_RADIUS;

    // Add random scatter so particles aren't perfectly on a thin line —
    // real galaxy arms have visible thickness/fuzziness
    const scatter = (Math.random() - 0.5) * 0.04 * (1 - t * 0.5);

    particles.push({
      baseAngle: theta,
      baseRadius: radius + scatter,
      // Slight per-particle vertical offset simulates galaxy disk thickness
      heightOffset: (Math.random() - 0.5) * 0.015 * (1 - t),
      size: Math.random() * 1.8 + 0.4, // Star point size in pixels
      color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
      twinklePhase: Math.random() * Math.PI * 2, // Offset so stars don't all twinkle in sync
      twinkleSpeed: 0.5 + Math.random() * 1.5,
    });
  }

  // ─── RENDER LOOP ───────────────────────────────────────────

  /**
   * drawGalaxy(timestamp)
   * Clears the canvas and redraws every particle at its current
   * rotated position. Uses an additive-style glow effect for the
   * "bright core, soft falloff" look real galaxy photos have.
   */
  function drawGalaxy(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Scale the spiral to the smaller screen dimension so it always fits
    const scale = Math.min(canvas.width, canvas.height);

    // Global rotation angle — increases over time for the swirling effect
    const rotation = timestamp * ROTATION_SPEED;

    particles.forEach((p) => {
      // Current angle = base angle + global rotation (this creates the swirl-over-time motion)
      const angle = p.baseAngle + rotation;

      // Convert polar (radius, angle) back to cartesian (x, y)
      const x = centerX + Math.cos(angle) * p.baseRadius * scale;
      const y = centerY + Math.sin(angle) * p.baseRadius * scale * 0.6 + p.heightOffset * scale;
      // NOTE: the *0.6 on the y-component flattens the spiral into an ellipse,
      // simulating viewing the galaxy disk from a tilted angle (not straight-on)

      // Twinkle effect: brightness oscillates slightly per particle
      const twinkle = 0.7 + 0.3 * Math.sin(timestamp * 0.001 * p.twinkleSpeed + p.twinklePhase);

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = twinkle;
      ctx.fill();
    });

    ctx.globalAlpha = 1; // reset for safety

    requestAnimationFrame(drawGalaxy);
  }

  requestAnimationFrame(drawGalaxy);

  // ─── STAR LAYER GENERATION (background twinkling dots) ─────

  /**
   * generateStarLayer()
   * Creates ~150 small fixed twinkling stars as absolutely-positioned
   * <div> elements with random positions, sizes, and animation delays.
   *
   * WHY DOM ELEMENTS (not canvas) for this layer: These stars sit
   * BEHIND the galaxy canvas and rarely change — using simple CSS
   * animations is cheaper than redrawing them every frame.
   */
  function generateStarLayer() {
    const starLayer = document.getElementById("starLayer");
    const STAR_COUNT = 150;

    // Build all star divs in a document fragment first, then append once
    // WHY: Appending to the DOM one at a time triggers repeated reflows;
    // a single fragment append is much faster for 150 elements.
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < STAR_COUNT; i++) {
      const star = document.createElement("div");
      star.className = "star-dot";

      const size = Math.random() * 2 + 0.5;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.animationDelay = Math.random() * 3 + "s";
      star.style.animationDuration = 2 + Math.random() * 3 + "s";

      fragment.appendChild(star);
    }

    starLayer.appendChild(fragment);
  }

  generateStarLayer();

  // ─── ZOOMING STARFIELD GENERATION ───────────────────────────

  /**
   * generateStarfieldLayer()
   * Creates small dots that animate via CSS 'zoomStar' keyframes
   * (defined in page2.css) to simulate flying through a starfield.
   */
  function generateStarfieldLayer() {
    const starfieldLayer = document.getElementById("starfieldLayer");
    const ZOOM_STAR_COUNT = 60;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < ZOOM_STAR_COUNT; i++) {
      const star = document.createElement("div");
      star.className = "zoom-star";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      star.style.animationDuration = 3 + Math.random() * 4 + "s";
      star.style.animationDelay = Math.random() * 4 + "s";
      fragment.appendChild(star);
    }

    starfieldLayer.appendChild(fragment);
  }

  generateStarfieldLayer();
})();
