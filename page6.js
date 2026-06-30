/**
 * ============================================================
 * page6.js — Analog Radio Player Logic
 * ============================================================
 * PURPOSE:
 *  1. Play/pause/skip through a small "station" playlist.
 *  2. Show the current track name and a rotating quote on the
 *     CRT-style display screen.
 *  3. Animate a small equalizer visualizer while "playing".
 *  4. Let the user drag the volume knob to control audio gain.
 *
 * IMPORTANT NOTE ON AUDIO SOURCE:
 * This is a static, offline-friendly file set with no server and
 * no bundled MP3 assets. Rather than link to external audio URLs
 * (which could break, require CORS, or not be licensed for use),
 * this implementation uses the built-in Web Audio API to
 * SYNTHESIZE simple ambient melody loops directly in the browser.
 * This means the radio works the instant you open page6.html —
 * no internet connection or audio files required.
 *
 * HOW TO USE YOUR OWN REAL AUDIO FILES INSTEAD:
 * 1. Add your .mp3 files to the project folder (e.g. "track1.mp3").
 * 2. Replace the `playlist` array below with objects like:
 *      { name: "My Song", quote: "...", file: "track1.mp3" }
 * 3. Replace the synthesizeTrack()/stopTrack() calls in
 *    playCurrentTrack()/pausePlayback() with a standard
 *    <audio> element: `new Audio(track.file)` and call
 *    .play() / .pause() on it instead.
 *
 * IMPROVEMENT IDEAS:
 *  - Wire up real <audio> elements once licensed tracks are available
 *  - Add a proper Web Audio AnalyserNode for a true frequency visualizer
 *    instead of the randomized bar heights used here
 * ============================================================
 */

(function () {
  "use strict";

  // ─── PLAYLIST DATA ───────────────────────────────────────────
  /**
   * playlist: Each entry has a display name, an inspirational/
   * gaming-flavored quote, and a `notes` array describing the
   * synthesized melody (frequencies in Hz) played for that "track".
   *
   * WHY NOTES INSTEAD OF FILES: No external audio dependency —
   * everything plays instantly using oscillators (see synth section).
   */
  const playlist = [
    {
      name: "Lo-Fi Respawn",
      quote: "\"Every death is just XP toward the win.\"",
      notes: [220, 246.94, 261.63, 293.66, 261.63, 246.94], // A3-ish lo-fi loop
      tempo: 480, // ms per note
    },
    {
      name: "Midnight Grind",
      quote: "\"The grind hits different at 2 AM.\"",
      notes: [196, 220, 246.94, 220, 196, 174.61],
      tempo: 420,
    },
    {
      name: "Victory Lap",
      quote: "\"GG. Now go again.\"",
      notes: [261.63, 329.63, 392.0, 329.63, 392.0, 440.0],
      tempo: 360,
    },
    {
      name: "Static Drift",
      quote: "\"Tune in. Lock in. Level up.\"",
      notes: [174.61, 196, 220, 196, 174.61, 164.81],
      tempo: 500,
    },
  ];

  let currentTrackIndex = 0;
  let isPlaying = false;

  // ─── WEB AUDIO SETUP ─────────────────────────────────────────

  /**
   * audioCtx: A single shared AudioContext for the page.
   * WHY LAZY-CREATE: Browsers block audio from starting before a
   * user gesture (like a click), so we create the context on the
   * first play button press rather than immediately on page load.
   */
  let audioCtx = null;
  let masterGain = null; // controls overall volume (tied to the volume knob)
  let noteIntervalId = null; // setInterval handle for the melody loop
  let noteIndex = 0;

  /**
   * ensureAudioContext()
   * Creates the AudioContext + master gain node on first use.
   */
  function ensureAudioContext() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.15; // start at a gentle, non-jarring volume
    masterGain.connect(audioCtx.destination);
  }

  /**
   * playNote(frequency, duration)
   * Plays a single soft synthesized tone using an oscillator + gain
   * envelope (fade in/out) so notes don't click/pop audibly.
   *
   * WHY A GAIN ENVELOPE: A raw oscillator starting/stopping abruptly
   * causes an audible "click". Ramping gain up then down smooths it.
   */
  function playNote(frequency, duration) {
    const osc = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();

    osc.type = "sine"; // soft, mellow waveform fitting a lo-fi radio vibe
    osc.frequency.value = frequency;

    const now = audioCtx.currentTime;
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(1, now + 0.05); // quick fade in
    noteGain.gain.linearRampToValueAtTime(0, now + duration / 1000); // fade out over note duration

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(now);
    osc.stop(now + duration / 1000);
  }

  /**
   * startTrackPlayback()
   * Begins looping through the current track's note sequence,
   * playing one note every `tempo` milliseconds.
   */
  function startTrackPlayback() {
    ensureAudioContext();
    const track = playlist[currentTrackIndex];
    noteIndex = 0;

    clearInterval(noteIntervalId);
    noteIntervalId = setInterval(() => {
      const freq = track.notes[noteIndex % track.notes.length];
      playNote(freq, track.tempo * 0.9); // slightly shorter than tempo gap, avoids overlap
      noteIndex++;
    }, track.tempo);
  }

  function stopTrackPlayback() {
    clearInterval(noteIntervalId);
  }

  // ─── DOM REFERENCES ────────────────────────────────────────
  const trackNameEl = document.getElementById("trackName");
  const quoteTextEl = document.getElementById("quoteText");
  const playBtn = document.getElementById("playBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const volumeKnob = document.getElementById("volumeKnob");
  const tuneKnob = document.getElementById("tuneKnob");
  const visualizer = document.getElementById("visualizer");
  const speakerGrille = document.getElementById("speakerGrille");

  // ─── DISPLAY UPDATE ────────────────────────────────────────

  /**
   * updateDisplay()
   * Refreshes the screen's track name + quote text to match
   * whichever track is currently selected.
   */
  function updateDisplay() {
    const track = playlist[currentTrackIndex];
    trackNameEl.textContent = track.name;
    quoteTextEl.textContent = track.quote;
  }

  // ─── PLAYBACK CONTROL HANDLERS ───────────────────────────────

  /**
   * playCurrentTrack()
   * Starts audio playback + visual feedback (play button icon,
   * equalizer animation).
   */
  function playCurrentTrack() {
    isPlaying = true;
    playBtn.textContent = "⏸";
    startTrackPlayback();
    startVisualizer();
  }

  function pausePlayback() {
    isPlaying = false;
    playBtn.textContent = "▶";
    stopTrackPlayback();
    stopVisualizer();
  }

  playBtn.addEventListener("click", function () {
    if (isPlaying) {
      pausePlayback();
    } else {
      playCurrentTrack();
    }
  });

  /**
   * goToTrack(index)
   * Switches to a new track (wrapping around the playlist),
   * updates the display, and keeps playing if audio was already active.
   */
  function goToTrack(index) {
    currentTrackIndex = ((index % playlist.length) + playlist.length) % playlist.length;
    updateDisplay();
    if (isPlaying) {
      startTrackPlayback(); // restart the loop with the new track's notes
    }
  }

  prevBtn.addEventListener("click", () => goToTrack(currentTrackIndex - 1));
  nextBtn.addEventListener("click", () => goToTrack(currentTrackIndex + 1));

  // ─── VISUALIZER (equalizer bars) ─────────────────────────────

  const BAR_COUNT = 20;
  let visualizerIntervalId = null;

  /**
   * buildVisualizerBars()
   * Creates the DOM elements for the equalizer once on page load.
   */
  function buildVisualizerBars() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < BAR_COUNT; i++) {
      const bar = document.createElement("div");
      bar.className = "eq-bar";
      fragment.appendChild(bar);
    }
    visualizer.appendChild(fragment);
  }

  /**
   * startVisualizer()
   * Randomizes each bar's height on an interval to simulate audio
   * reacting in real time. NOTE: This is a stylized approximation,
   * not synced to actual frequency data (see file header for how
   * to upgrade this with a real AnalyserNode once real audio files
   * are wired in).
   */
  function startVisualizer() {
    const bars = visualizer.querySelectorAll(".eq-bar");
    clearInterval(visualizerIntervalId);
    visualizerIntervalId = setInterval(() => {
      bars.forEach((bar) => {
        const height = 4 + Math.random() * 16;
        bar.style.height = height + "px";
      });
    }, 120);
  }

  function stopVisualizer() {
    clearInterval(visualizerIntervalId);
    const bars = visualizer.querySelectorAll(".eq-bar");
    bars.forEach((bar) => { bar.style.height = "4px"; });
  }

  // ─── VOLUME KNOB (draggable rotary control) ──────────────────

  /**
   * Volume knob behavior: dragging vertically up/down rotates the
   * knob visually and adjusts masterGain.gain in real time.
   *
   * WHY VERTICAL DRAG (not rotational/angular math): Simpler and
   * more reliable for touch/mouse input than tracking true angle
   * around the knob's center — most real volume-knob UI patterns
   * use vertical or horizontal drag distance as a proxy for rotation.
   */
  let isDraggingVolume = false;
  let volumeRotation = -90; // current visual rotation in degrees
  let dragStartY = 0;
  let dragStartRotation = 0;

  volumeKnob.addEventListener("mousedown", function (e) {
    isDraggingVolume = true;
    dragStartY = e.clientY;
    dragStartRotation = volumeRotation;
  });

  window.addEventListener("mousemove", function (e) {
    if (!isDraggingVolume) return;

    const deltaY = dragStartY - e.clientY; // dragging UP increases volume
    let newRotation = dragStartRotation + deltaY; // 1 degree per pixel dragged
    newRotation = Math.max(-135, Math.min(135, newRotation)); // clamp rotation range

    volumeRotation = newRotation;
    volumeKnob.style.transform = `rotate(${volumeRotation}deg)`;

    // Map rotation range (-135 to 135) to a gain value (0 to 0.4)
    const normalized = (volumeRotation + 135) / 270; // 0 to 1
    ensureAudioContext();
    masterGain.gain.value = normalized * 0.4;
  });

  window.addEventListener("mouseup", function () {
    isDraggingVolume = false;
  });

  // ── Touch support for mobile dragging ──
  volumeKnob.addEventListener("touchstart", function (e) {
    isDraggingVolume = true;
    dragStartY = e.touches[0].clientY;
    dragStartRotation = volumeRotation;
  });

  window.addEventListener("touchmove", function (e) {
    if (!isDraggingVolume) return;
    const deltaY = dragStartY - e.touches[0].clientY;
    let newRotation = dragStartRotation + deltaY;
    newRotation = Math.max(-135, Math.min(135, newRotation));
    volumeRotation = newRotation;
    volumeKnob.style.transform = `rotate(${volumeRotation}deg)`;
    const normalized = (volumeRotation + 135) / 270;
    ensureAudioContext();
    masterGain.gain.value = normalized * 0.4;
  });

  window.addEventListener("touchend", function () {
    isDraggingVolume = false;
  });

  // ── Tune knob is decorative — clicking it skips to the next track ──
  // WHY: Gives it a real function without needing duplicate drag logic.
  tuneKnob.addEventListener("click", function () {
    tuneKnob.style.transform = `rotate(${Math.random() * 360}deg)`;
    goToTrack(currentTrackIndex + 1);
  });

  // ─── SPEAKER GRILLE GENERATION ────────────────────────────────

  /**
   * buildSpeakerGrille()
   * Generates the small dot pattern simulating perforated speaker
   * mesh. Done in JS to avoid hand-writing 80+ repetitive <div> tags.
   */
  function buildSpeakerGrille() {
    const DOT_COUNT = 80;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < DOT_COUNT; i++) {
      const dot = document.createElement("div");
      dot.className = "grille-dot";
      fragment.appendChild(dot);
    }
    speakerGrille.appendChild(fragment);
  }

  // ─── INITIALIZE ────────────────────────────────────────────
  buildSpeakerGrille();
  buildVisualizerBars();
  updateDisplay();
  volumeKnob.style.transform = `rotate(${volumeRotation}deg)`;
})();
