/**
 * ============================================================
 * page5.js — The Memory: Pixel Effect + Flip Logic
 * ============================================================
 * PURPOSE:
 *  1. Port the React Bits "PixelCard" pixel-dissolve hover effect
 *     to vanilla JS + canvas (no React, no class components needed
 *     in the framework sense — using a plain JS class is fine here
 *     since it's just an organizational tool, not a UI framework).
 *  2. Handle click-to-flip behavior for each of the 3 memory cards.
 *  3. Handle the header-click profile modal popup.
 *
 * HOW THE PIXEL EFFECT WORKS (ported from the original):
 *  - A grid of small "Pixel" squares covers the card.
 *  - On hover/focus, each pixel grows from size 0 to a random max
 *    size, with a delay proportional to its distance from the
 *    center (so the effect "ripples" outward from the middle).
 *  - On mouse leave, pixels shrink back down to 0.
 *  - Once all pixels are idle (size 0, not animating), we stop the
 *    animation loop entirely to save CPU/battery.
 *
 * IMPROVEMENT IDEAS:
 *  - Make pixel colors match each card's theme (fire vs khaki)
 *  - Add a "settled twinkle" idle state instead of just disappearing
 * ============================================================
 */

(function () {
  "use strict";

  // ─── PIXEL CLASS (ported from the original component) ──────

  /**
   * Pixel
   * Represents a single animated square in the pixel-dissolve grid.
   * Each pixel tracks its own size, growth speed, and delay so the
   * overall effect looks organic rather than mechanically uniform.
   */
  class Pixel {
    constructor(canvasWidth, canvasHeight, ctx, x, y, color, speed, delay) {
      this.width = canvasWidth;
      this.height = canvasHeight;
      this.ctx = ctx;
      this.x = x;
      this.y = y;
      this.color = color;

      // Randomized growth speed within a sensible range, scaled by the
      // global `speed` setting (which itself comes from the variant config)
      this.speed = this.getRandomValue(0.1, 0.9) * speed;

      this.size = 0; // current rendered size, starts invisible
      this.sizeStep = Math.random() * 0.4; // how much size grows per frame while appearing
      this.minSize = 0.5;
      this.maxSizeInteger = 2;
      this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);

      this.delay = delay; // frames to wait before this pixel starts appearing
      this.counter = 0;
      this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;

      this.isIdle = false;   // true once fully shrunk away (animation can stop)
      this.isReverse = false; // direction flag used during the "shimmer" phase
      this.isShimmer = false; // true once pixel has reached max size and starts pulsing
    }

    getRandomValue(min, max) {
      return Math.random() * (max - min) + min;
    }

    /** Draws this pixel as a small filled square, centered within its grid cell */
    draw() {
      const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
      this.ctx.fillStyle = this.color;
      this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
    }

    /** Growth phase — called every frame while the card is hovered/focused */
    appear() {
      this.isIdle = false;

      // Respect this pixel's individual delay before starting to grow
      if (this.counter <= this.delay) {
        this.counter += this.counterStep;
        return;
      }

      if (this.size >= this.maxSize) {
        this.isShimmer = true; // switch to gentle pulsing once fully grown
      }

      if (this.isShimmer) {
        this.shimmer();
      } else {
        this.size += this.sizeStep;
      }

      this.draw();
    }

    /** Shrink phase — called every frame after the mouse/focus leaves */
    disappear() {
      this.isShimmer = false;
      this.counter = 0;

      if (this.size <= 0) {
        this.isIdle = true; // signal that this pixel no longer needs updates
        return;
      }
      this.size -= 0.1;
      this.draw();
    }

    /** Gentle back-and-forth pulsing once a pixel has reached full size */
    shimmer() {
      if (this.size >= this.maxSize) {
        this.isReverse = true;
      } else if (this.size <= this.minSize) {
        this.isReverse = false;
      }
      this.size += this.isReverse ? -this.speed : this.speed;
    }
  }

  /**
   * getEffectiveSpeed(value)
   * Converts a 0-100 "speed" setting into the small decimal multiplier
   * the Pixel class actually uses internally. Mirrors the original
   * component's scaling logic exactly.
   */
  function getEffectiveSpeed(value) {
    const min = 0, max = 100, throttle = 0.001;
    const parsed = parseInt(value, 10);
    if (parsed <= min) return min;
    if (parsed >= max) return max * throttle;
    return parsed * throttle;
  }

  // ─── PIXEL CARD VARIANTS ─────────────────────────────────────
  // Each memory card uses a "fire" or "khaki" toned pixel palette
  // that complements its front-face gradient color.
  const VARIANTS = {
    fire:  { gap: 6, speed: 45, colors: "#ffe3c2,#ffb37a,#ff7a3d" },
    khaki: { gap: 6, speed: 45, colors: "#f7f0d8,#e0d09a,#b8a05f" },
  };

  /**
   * initPixelCard(cardEl, canvasEl, variantName)
   * Wires up the full pixel-dissolve behavior for one card: builds
   * the pixel grid, and attaches mouseenter/mouseleave/focus/blur
   * handlers that trigger the appear/disappear animation loops.
   */
  function initPixelCard(cardEl, canvasEl, variantName) {
    const variant = VARIANTS[variantName] || VARIANTS.fire;
    const ctx = canvasEl.getContext("2d");

    let pixels = [];
    let animationId = null;
    let lastFrameTime = performance.now();

    /**
     * buildPixelGrid()
     * (Re)creates the full grid of Pixel instances based on the
     * card's current rendered size. Called on init and on resize.
     */
    function buildPixelGrid() {
      const rect = cardEl.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      canvasEl.width = width;
      canvasEl.height = height;

      const colorsArray = variant.colors.split(",");
      const newPixels = [];

      for (let x = 0; x < width; x += variant.gap) {
        for (let y = 0; y < height; y += variant.gap) {
          const color = colorsArray[Math.floor(Math.random() * colorsArray.length)];

          // Distance from center determines the appear delay —
          // this creates the "ripple outward from the middle" look
          const dx = x - width / 2;
          const dy = y - height / 2;
          const distance = Math.sqrt(dx * dx + dy * dy);

          newPixels.push(
            new Pixel(width, height, ctx, x, y, color, getEffectiveSpeed(variant.speed), distance)
          );
        }
      }
      pixels = newPixels;
    }

    /**
     * runAnimation(fnName)
     * The shared animation loop driver — calls either 'appear' or
     * 'disappear' on every pixel each frame, throttled to ~60fps,
     * and stops automatically once every pixel reports isIdle.
     */
    function runAnimation(fnName) {
      animationId = requestAnimationFrame(() => runAnimation(fnName));

      const now = performance.now();
      const elapsed = now - lastFrameTime;
      const frameInterval = 1000 / 60; // cap at 60fps
      if (elapsed < frameInterval) return;
      lastFrameTime = now - (elapsed % frameInterval);

      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      let allIdle = true;
      for (let i = 0; i < pixels.length; i++) {
        pixels[i][fnName]();
        if (!pixels[i].isIdle) allIdle = false;
      }

      // Stop the loop once disappearing is fully complete (saves CPU)
      if (allIdle && fnName === "disappear") {
        cancelAnimationFrame(animationId);
      }
    }

    function startAnimation(fnName) {
      cancelAnimationFrame(animationId);
      lastFrameTime = performance.now();
      runAnimation(fnName);
    }

    // ── Event wiring ──
    cardEl.addEventListener("mouseenter", () => startAnimation("appear"));
    cardEl.addEventListener("mouseleave", () => startAnimation("disappear"));
    cardEl.addEventListener("focus", () => startAnimation("appear"));
    cardEl.addEventListener("blur", () => startAnimation("disappear"));

    // Rebuild the grid responsively if the card resizes (e.g. on window resize)
    const resizeObserver = new ResizeObserver(() => buildPixelGrid());
    resizeObserver.observe(cardEl);

    buildPixelGrid(); // initial build
  }

  // ─── INITIALIZE ALL THREE CARDS ──────────────────────────────

  const cardConfigs = [
    { selector: '[data-card="1"]', variant: "fire" },
    { selector: '[data-card="2"]', variant: "khaki" },
    { selector: '[data-card="3"]', variant: "fire" },
  ];

  cardConfigs.forEach((config) => {
    const cardEl = document.querySelector(config.selector);
    const canvasEl = cardEl.querySelector(".pixel-canvas");
    cardEl.setAttribute("tabindex", "0"); // make focusable for keyboard users
    initPixelCard(cardEl, canvasEl, config.variant);
  });

  // ─── FLIP-ON-CLICK LOGIC ──────────────────────────────────────

  /**
   * Each card toggles a 'flipped' class on click, which CSS uses
   * to rotate the .card-inner element 180 degrees (see page5.css).
   */
  document.querySelectorAll(".memory-card").forEach((card) => {
    card.addEventListener("click", function () {
      card.classList.toggle("flipped");
    });

    // Also allow flipping via keyboard (Enter/Space) for accessibility
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.classList.toggle("flipped");
      }
    });
  });

  // ─── PROFILE MODAL (opened by clicking the header) ────────────

  const memoryHeader = document.getElementById("memoryHeader");
  const profileModalOverlay = document.getElementById("profileModalOverlay");
  const modalClose = document.getElementById("modalClose");

  memoryHeader.addEventListener("click", function () {
    profileModalOverlay.classList.add("open");
    profileModalOverlay.setAttribute("aria-hidden", "false");
  });

  modalClose.addEventListener("click", function () {
    profileModalOverlay.classList.remove("open");
    profileModalOverlay.setAttribute("aria-hidden", "true");
  });

  profileModalOverlay.addEventListener("click", function (e) {
    if (e.target === profileModalOverlay) {
      profileModalOverlay.classList.remove("open");
      profileModalOverlay.setAttribute("aria-hidden", "true");
    }
  });
})();
