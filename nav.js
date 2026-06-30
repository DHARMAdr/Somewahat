/**
 * ============================================================
 * nav.js — @iamlazydanger Portal Navigation System
 * ============================================================
 * PURPOSE: Controls page-to-page navigation using the Down/Up
 *          arrow keys. Requires 3 discrete key presses to move
 *          to the next/previous page, with a 1.5-second cooldown
 *          between each press to prevent accidental rapid skipping.
 *
 * HOW IT WORKS:
 *  1. We track which keys are currently held (keysHeld object).
 *  2. On "keydown", we ONLY register a press if the key was NOT
 *     already held — this prevents the browser's auto-repeat
 *     from counting as multiple presses.
 *  3. On "keyup", we release the held state.
 *  4. A 1.5s cooldown (lastKeyPressTime) stops very fast presses.
 *  5. After 3 valid presses, we navigate to the target page.
 *
 * PAGES:
 *  0 = Landing Blog (page0.html)
 *  1 = Dragon Cursor (page1.html)
 *  2 = Cosmic Galaxy (page2.html)
 *  3 = Flowing Strands (page3.html)
 *  4 = Blood Spider Clock (page4.html)
 *  5 = Memory Flip Cards (page5.html)
 *  6 = Analog Radio Player (page6.html)
 *
 * IMPROVEMENT IDEAS:
 *  - Add touch swipe support for mobile (touchstart/touchend)
 *  - Add a visual HUD showing how many presses remain
 *  - Allow gamepad button navigation
 * ============================================================
 */

(function () {
  "use strict";

  // ─── CONFIGURATION ─────────────────────────────────────────
  /** Total number of pages in the portal (0-indexed, so 7 pages = indices 0-6) */
  const TOTAL_PAGES = 7;

  /**
   * PRESSES_REQUIRED: How many discrete key presses needed to navigate.
   * Set to 3 so accidental taps don't switch pages instantly.
   * WHY 3: Feels intentional — a deliberate triple-tap gesture.
   */
  const PRESSES_REQUIRED = 3;

  /**
   * COOLDOWN_MS: Milliseconds to wait between valid key presses.
   * 1500ms (1.5 seconds) is long enough to feel like a true pause
   * but not so long it becomes frustrating.
   */
  const COOLDOWN_MS = 1500;

  // ─── STATE VARIABLES ───────────────────────────────────────

  /** Tracks how many valid ArrowDown presses have happened */
  let downPressCount = 0;

  /** Tracks how many valid ArrowUp presses have happened */
  let upPressCount = 0;

  /**
   * keysHeld: Object that stores whether a key is currently held down.
   * KEY: the key name (e.g. 'ArrowDown')
   * VALUE: boolean — true = currently held, false/undefined = not held
   *
   * WHY THIS EXISTS: Browsers fire repeated 'keydown' events while a key
   * is held. Without this check, holding down the arrow key for 1 second
   * would register many presses. We only count the FIRST keydown per hold.
   */
  const keysHeld = {};

  /**
   * lastKeyPressTime: Timestamp (Date.now()) of the last accepted key press.
   * Used to enforce the COOLDOWN_MS gap between presses.
   */
  let lastKeyPressTime = 0;

  // ─── UTILITY: GET CURRENT PAGE INDEX ───────────────────────

  /**
   * getCurrentPage()
   * Reads the current HTML filename and extracts the page number.
   *
   * EXAMPLE: "page3.html" → returns 3, "index.html" → returns 0
   *
   * WHY: Each page file is named pageN.html (or index.html for page 0),
   * so we can parse the current URL to know where we are.
   *
   * @returns {number} Current page index (0 to TOTAL_PAGES-1)
   */
  function getCurrentPage() {
    const path = window.location.pathname;
    
    // Check if we're on index.html (which is page 0)
    if (path.includes("index.html") || path.endsWith("/")) {
      return 0;
    }
    
    // Otherwise look for pageN.html pattern
    const match = path.match(/page(\d+)\.html/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    return 0; // default to page 0 if filename doesn't match pattern
  }

  // ─── UTILITY: NAVIGATE TO PAGE ─────────────────────────────

  /**
   * goToPage(index)
   * Navigates the browser to a different page file.
   * Wraps around: index < 0 → last page, index >= TOTAL → first page.
   * Page 0 is index.html, other pages are pageN.html
   *
   * @param {number} index - The target page index
   */
  function goToPage(index) {
    // Wrap around using modulo arithmetic
    // WHY: Keeps cycling 0→1→...→6→0 and 0→6→5→...→0 seamlessly
    const safeIndex = ((index % TOTAL_PAGES) + TOTAL_PAGES) % TOTAL_PAGES;
    
    // Page 0 is index.html, all others are pageN.html
    if (safeIndex === 0) {
      window.location.href = "index.html";
    } else {
      window.location.href = "page" + safeIndex + ".html";
    }
  }

  // ─── KEY EVENT HANDLER ─────────────────────────────────────

  /**
   * handleKeyDown(event)
   * Called when the user presses any key.
   * Only processes ArrowDown and ArrowUp keys.
   *
   * LOGIC FLOW:
   * 1. Check if the key is ArrowDown or ArrowUp — exit if not
   * 2. Check if the key is already held — exit if held (prevents repeats)
   * 3. Mark key as held
   * 4. Check cooldown — exit if too soon after last press
   * 5. Update lastKeyPressTime
   * 6. Increment the appropriate counter
   * 7. If counter reached PRESSES_REQUIRED → navigate!
   *
   * @param {KeyboardEvent} event
   */
  function handleKeyDown(event) {
    const key = event.key; // "ArrowDown" or "ArrowUp" etc.

    // ── Step 1: Only handle arrow keys ──
    if (key !== "ArrowDown" && key !== "ArrowUp") return;

    // ── Step 2: Ignore if key is already held (browser auto-repeat) ──
    // WHY: Without this, holding the key fires dozens of keydown events
    if (keysHeld[key]) return;

    // ── Step 3: Mark this key as now held ──
    keysHeld[key] = true;

    // ── Step 4: Enforce cooldown ──
    const now = Date.now();
    if (now - lastKeyPressTime < COOLDOWN_MS) return; // too soon, ignore

    // ── Step 5: Record this press time ──
    lastKeyPressTime = now;

    // ── Step 6 & 7: Count and navigate ──
    if (key === "ArrowDown") {
      downPressCount++;
      upPressCount = 0; // reset opposite direction when switching

      // Show visual indicator on press (optional — pages can override this)
      showNavIndicator("down", downPressCount);

      if (downPressCount >= PRESSES_REQUIRED) {
        downPressCount = 0; // reset counter after navigating
        goToPage(getCurrentPage() + 1); // go to next page
      }
    }

    if (key === "ArrowUp") {
      upPressCount++;
      downPressCount = 0; // reset opposite direction

      showNavIndicator("up", upPressCount);

      if (upPressCount >= PRESSES_REQUIRED) {
        upPressCount = 0;
        goToPage(getCurrentPage() - 1); // go to previous page
      }
    }
  }

  /**
   * handleKeyUp(event)
   * Called when user RELEASES a key.
   * Releases the "held" state so the next keydown is counted fresh.
   *
   * @param {KeyboardEvent} event
   */
  function handleKeyUp(event) {
    // Mark this key as no longer held
    keysHeld[event.key] = false;
  }

  // ─── VISUAL INDICATOR ──────────────────────────────────────

  /**
   * showNavIndicator(direction, count)
   * Shows a small on-screen dot cluster indicating how many presses
   * have been made toward navigation.
   *
   * WHY: Gives the user feedback that their key press was registered.
   * Without this, users may not know how many more presses are needed.
   *
   * IMPROVEMENT: Could be replaced with animated arrows, a progress bar,
   * or sound effects for more engaging feedback.
   *
   * @param {string} direction - "up" or "down"
   * @param {number} count - How many presses so far (1, 2, or 3)
   */
  function showNavIndicator(direction, count) {
    // Find or create the indicator container
    let indicator = document.getElementById("nav-indicator");

    if (!indicator) {
      // Create the indicator element if it doesn't exist yet
      indicator = document.createElement("div");
      indicator.id = "nav-indicator";

      // Inline styles so this works on every page without extra CSS
      Object.assign(indicator.style, {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "8px",
        zIndex: "9999",
        pointerEvents: "none", // don't interfere with mouse clicks
        transition: "opacity 0.3s",
      });

      document.body.appendChild(indicator);
    }

    // Build dots: filled circles for pressed, empty for remaining
    indicator.innerHTML = ""; // clear previous dots

    for (let i = 0; i < PRESSES_REQUIRED; i++) {
      const dot = document.createElement("div");

      Object.assign(dot.style, {
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        // Filled dot = already pressed, outlined = still needed
        background: i < count ? "#ff4444" : "transparent",
        border: "2px solid #ff4444",
        transition: "background 0.15s",
      });

      indicator.appendChild(dot);
    }

    // Arrow symbol to show direction
    const arrow = document.createElement("span");
    arrow.style.color = "#ff4444";
    arrow.style.fontSize = "14px";
    arrow.style.lineHeight = "10px";
    arrow.textContent = direction === "down" ? " ↓" : " ↑";
    indicator.appendChild(arrow);

    // Auto-hide after 2 seconds of no activity
    clearTimeout(indicator._hideTimer);
    indicator._hideTimer = setTimeout(() => {
      indicator.style.opacity = "0";
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }, 2000);

    indicator.style.opacity = "1"; // make visible
  }

  // ─── ATTACH EVENT LISTENERS ────────────────────────────────

  // Listen for key presses globally (window level, not just a specific element)
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  // ─── RESET ON PAGE LOAD ────────────────────────────────────

  // When a new page loads, reset all counters to a clean state
  // WHY: If we navigated from another page, the counters carry over
  // in memory but a real page reload always resets JS state naturally.
  // This is here as extra safety for SPA-style navigation.
  window.addEventListener("load", function () {
    downPressCount = 0;
    upPressCount = 0;
    lastKeyPressTime = 0;
    Object.keys(keysHeld).forEach((k) => (keysHeld[k] = false));
  });

  // ─── EXPOSE FOR DEBUGGING ──────────────────────────────────
  // WHY: During development, you may want to check state in the console
  // USAGE: window._nav.getState() in browser DevTools
  window._nav = {
    getState: () => ({ downPressCount, upPressCount, lastKeyPressTime }),
    getCurrentPage,
    goToPage,
  };
})();
