// public/piano.js — Real 2-octave layout (C4–B5) + Real Piano Sampler (Tone.js Salamander)
// - Black key position uses offsetLeft/offsetWidth (stable in landscape)
// - Audio: Tone.Sampler, unlocked on first user gesture

(function () {
  const WHITE_NOTES = [
    "C4","D4","E4","F4","G4","A4","B4",
    "C5","D5","E5","F5","G5","A5","B5"
  ];

  // black between white[afterWhite] and white[afterWhite+1]
  const BLACK_KEYS = [
    { note: "C#4", afterWhite: 0 },
    { note: "D#4", afterWhite: 1 },
    { note: "F#4", afterWhite: 3 },
    { note: "G#4", afterWhite: 4 },
    { note: "A#4", afterWhite: 5 },

    { note: "C#5", afterWhite: 7 },
    { note: "D#5", afterWhite: 8 },
    { note: "F#5", afterWhite: 10 },
    { note: "G#5", afterWhite: 11 },
    { note: "A#5", afterWhite: 12 },
  ];

  let currentRoot = null;
  let raf = 0;

  // ===== Real piano sampler =====
  let sampler = null;
  let samplerReady = false;
  let loadingPromise = null;

  function ensureToneLoaded() {
    if (!window.Tone) {
      console.error("Tone.js not loaded. Make sure student.html includes Tone.js before piano.js");
      return false;
    }
    return true;
  }

  async function initSampler() {
    if (!ensureToneLoaded()) return;

    if (samplerReady) return;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      // Must be called in/after user gesture
      await Tone.start();

      // Salamander piano (sampled). Using a few base notes; Tone auto-pitches.
      sampler = new Tone.Sampler({
        urls: {
          A4: "A4.mp3",
          C4: "C4.mp3",
          D#4: "Ds4.mp3",
          F#4: "Fs4.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/salamander/",
        release: 1,
      }).toDestination();

      // Wait for sample loading
      await sampler.loaded;

      samplerReady = true;
      console.log("✅ Piano sampler ready");
    })();

    return loadingPromise;
  }

  async function playNote(note) {
    // Avoid hard failure if Tone missing
    if (!ensureToneLoaded()) return;

    try {
      if (!samplerReady) await initSampler();
      if (sampler) sampler.triggerAttackRelease(note, "8n");
    } catch (e) {
      console.error("Sampler play error:", e);
    }
  }

  // ===== Layout =====
  function positionBlackKeys() {
    if (!currentRoot) return;

    const whiteRow = currentRoot.querySelector(".piano-white-row");
    const blackLayer = currentRoot.querySelector(".piano-black-layer");
    if (!whiteRow || !blackLayer) return;

    const whites = Array.from(whiteRow.querySelectorAll(".white-key"));
    if (whites.length < 2) return;

    const blacks = Array.from(blackLayer.querySelectorAll(".black-key"));
    if (blacks.length === 0) return;

    blacks.forEach((k) => {
      const afterWhite = Number(k.dataset.afterWhite);
      const L = whites[afterWhite];
      const R = whites[afterWhite + 1];
      if (!L || !R) return;

      const center = (L.offsetLeft + L.offsetWidth + R.offsetLeft) / 2;
      const left = center - k.offsetWidth / 2;
      k.style.left = `${left}px`;
    });
  }

  function schedulePosition() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      positionBlackKeys();
      setTimeout(positionBlackKeys, 120);
    });
  }

  function buildPiano(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;

    currentRoot = root;
    root.innerHTML = "";
    root.classList.add("piano");

    const whiteRow = document.createElement("div");
    whiteRow.className = "piano-white-row";

    const blackLayer = document.createElement("div");
    blackLayer.className = "piano-black-layer";

    root.appendChild(whiteRow);
    root.appendChild(blackLayer);

    function handlePress(note) {
      // 先触发声音（需要用户手势解锁）
      playNote(note);
      // 再发出事件给 student.js 判题
      document.dispatchEvent(new CustomEvent("notePlayed", { detail: note }));
    }

    // whites
    WHITE_NOTES.forEach((note) => {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "white-key";
      k.dataset.note = note;
      k.title = note;

      k.addEventListener("click", () => handlePress(note));
      whiteRow.appendChild(k);
    });

    // blacks
    BLACK_KEYS.forEach(({ note, afterWhite }) => {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "black-key";
      k.dataset.note = note;
      k.dataset.afterWhite = String(afterWhite);
      k.title = note;

      k.addEventListener("click", (ev) => {
        ev.stopPropagation();
        handlePress(note);
      });

      blackLayer.appendChild(k);
    });

    schedulePosition();

    window.addEventListener("resize", schedulePosition);
    window.addEventListener("orientationchange", schedulePosition);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", schedulePosition);
      window.visualViewport.addEventListener("scroll", schedulePosition);
    }
  }

  window.buildPiano = buildPiano;
})();