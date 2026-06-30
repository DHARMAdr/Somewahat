/**
 * ============================================================
 * page4.js — Interactive Spider Clockface
 * ============================================================
 * PURPOSE:
 *  1. Display a real-time analog clock showing IST (Asia/Kolkata)
 *  2. Animate the hour, minute, and second hands
 *  3. Animate a spider character that crawls around the clock face
 *  4. The spider position follows the hour hand
 *  5. Add leg twitches and eye blinks for personality
 *
 * WHY SVG: Smooth scaling on any screen size, vector-based
 * graphics scale perfectly, easier to animate individual
 * elements compared to canvas.
 *
 * IMPROVEMENT IDEAS:
 *  - Add sound effect on each hour chime
 *  - Let spider react when second hand passes nearby
 * ============================================================
 */

(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const clockSvg = document.getElementById("clockSvg");

  // ─── CONSTANTS ─────────────────────────────────────────

  const CENTER_X = 200;
  const CENTER_Y = 200;
  const CLOCK_RADIUS = 150;
  const COLOR_BLOOD = "#c8102e";

  // ─── BUILD CLOCK FACE ───────────────────────────────────

  /**
   * buildClockMarkers()
   * Creates the 12-hour markers around the clock face.
   */
  function buildClockMarkers() {
    const markersGroup = document.getElementById("markers");

    for (let hour = 1; hour <= 12; hour++) {
      const angle = (hour / 12) * Math.PI * 2 - Math.PI / 2;

      // Hour label position
      const labelRadius = CLOCK_RADIUS - 30;
      const labelX = CENTER_X + Math.cos(angle) * labelRadius;
      const labelY = CENTER_Y + Math.sin(angle) * labelRadius;

      // Create text element for hour number
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", labelX);
      text.setAttribute("y", labelY);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("font-family", "Georgia, serif");
      text.setAttribute("font-size", "20");
      text.setAttribute("font-weight", "700");
      text.setAttribute("fill", COLOR_BLOOD);
      text.textContent = hour;
      markersGroup.appendChild(text);

      // Hour tick mark
      const outerRadius = CLOCK_RADIUS - 8;
      const innerRadius = CLOCK_RADIUS - 20;
      const x1 = CENTER_X + Math.cos(angle) * outerRadius;
      const y1 = CENTER_Y + Math.sin(angle) * outerRadius;
      const x2 = CENTER_X + Math.cos(angle) * innerRadius;
      const y2 = CENTER_Y + Math.sin(angle) * innerRadius;

      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", COLOR_BLOOD);
      line.setAttribute("stroke-width", "2");
      markersGroup.appendChild(line);
    }

    // Minute tick marks (60 total, every 5th is longer)
    for (let min = 0; min < 60; min++) {
      if (min % 5 === 0) continue; // skip hour positions

      const angle = (min / 60) * Math.PI * 2 - Math.PI / 2;
      const isMajor = min % 5 === 0;
      const outerRadius = CLOCK_RADIUS - 8;
      const innerRadius = CLOCK_RADIUS - 14;

      const x1 = CENTER_X + Math.cos(angle) * outerRadius;
      const y1 = CENTER_Y + Math.sin(angle) * outerRadius;
      const x2 = CENTER_X + Math.cos(angle) * innerRadius;
      const y2 = CENTER_Y + Math.sin(angle) * innerRadius;

      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", COLOR_BLOOD);
      line.setAttribute("stroke-width", "1");
      line.setAttribute("opacity", "0.5");
      markersGroup.appendChild(line);
    }
  }

  buildClockMarkers();

  // ─── GET KOLKATA TIME ───────────────────────────────────

  /**
   * getKolkataTime()
   * Uses Intl.DateTimeFormat to get the current time in
   * Asia/Kolkata timezone, regardless of visitor's local time.
   */
  function getKolkataTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const lookup = {};
    parts.forEach((p) => {
      lookup[p.type] = p.value;
    });

    return {
      hours: parseInt(lookup.hour, 10),
      minutes: parseInt(lookup.minute, 10),
      seconds: parseInt(lookup.second, 10),
    };
  }

  // ─── UPDATE CLOCK HANDS ─────────────────────────────────

  /**
   * updateClockHands()
   * Calculates rotation angles for hour, minute, and second hands
   * based on current IST time.
   */
  function updateClockHands() {
    const { hours, minutes, seconds } = getKolkataTime();

    const secondAngle = (seconds / 60) * 360;
    const minuteAngle = (minutes / 60) * 360 + (seconds / 60) * 6;
    const hourAngle = ((hours % 12) / 12) * 360 + (minutes / 60) * 30;

    const hourHand = document.getElementById("hourHand");
    const minuteHand = document.getElementById("minuteHand");
    const secondHand = document.getElementById("secondHand");

    hourHand.setAttribute("transform", `rotate(${hourAngle} ${CENTER_X} ${CENTER_Y})`);
    minuteHand.setAttribute("transform", `rotate(${minuteAngle} ${CENTER_X} ${CENTER_Y})`);
    secondHand.setAttribute("transform", `rotate(${secondAngle} ${CENTER_X} ${CENTER_Y})`);

    // Return spider position (follows the hour hand)
    return hourAngle;
  }

  // ─── SPIDER ANIMATION ───────────────────────────────────

  /**
   * updateSpider(hourAngle)
   * Positions the spider on the clock face at the position of
   * the hour hand. Adds leg twitches for personality.
   */
  function updateSpider(hourAngle) {
    const spider = document.getElementById("spider");
    const angle = (hourAngle * Math.PI) / 180;

    // Position spider near the hour hand
    const spiderRadius = CLOCK_RADIUS - 50;
    const spiderX = CENTER_X + Math.cos(angle - Math.PI / 2) * spiderRadius;
    const spiderY = CENTER_Y + Math.sin(angle - Math.PI / 2) * spiderRadius;

    // Spider rotation follows the hour hand direction
    spider.setAttribute(
      "transform",
      `translate(${spiderX}, ${spiderY}) rotate(${hourAngle + 90})`
    );

    // Animate legs with subtle twitches
    animateSpiderLegs();
  }

  /**
   * animateSpiderLegs()
   * Creates a subtle leg-twitching animation to make the spider
   * feel alive. Legs twitch at different times for organic motion.
   */
  function animateSpiderLegs() {
    const now = Date.now();
    const legs = document.querySelectorAll("#spider-legs line");

    legs.forEach((leg, i) => {
      // Each leg has its own twitch frequency
      const twitch = Math.sin((now * 0.003 + i * 0.5) * Math.PI) * 2;
      leg.setAttribute("y2", 15 + twitch);
    });
  }

  /**
   * buildSpiderLegs()
   * Creates the 8 legs for the spider (4 on each side).
   * Legs are simple lines that will be animated.
   */
  function buildSpiderLegs() {
    const legsGroup = document.getElementById("spider-legs");

    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1;
      const idx = i % 4;
      const angle = (idx / 3) * 60 - 30; // spread across ~60 degrees

      const leg = document.createElementNS(SVG_NS, "line");
      leg.setAttribute("x1", 0);
      leg.setAttribute("y1", 0);
      leg.setAttribute("x2", Math.cos((angle * Math.PI) / 180) * 12);
      leg.setAttribute("y2", side * 15);
      leg.setAttribute("stroke", COLOR_BLOOD);
      leg.setAttribute("stroke-width", "2");
      leg.setAttribute("stroke-linecap", "round");
      legsGroup.appendChild(leg);
    }
  }

  buildSpiderLegs();

  // ─── MAIN ANIMATION LOOP ────────────────────────────────

  /**
   * animate()
   * Main loop: updates clock hands and spider position every frame.
   */
  function animate() {
    const hourAngle = updateClockHands();
    updateSpider(hourAngle);
    requestAnimationFrame(animate);
  }

  animate();
})();
