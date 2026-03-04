// public/piano.js — 2-octave real keyboard + Tone.js sampled piano
// HARDENED: works even if CSS is missing/changed (sets critical styles inline)

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

  // ===== Audio (Tone Sampler) =====
  let sampler = null;
  let audioReady = false;
  let audioInitPromise = null;

  function hasTone() {
    return typeof window.Tone !== "undefined";
  }

  async function initAudio() {
    if (!hasTone()) return;
    if (audioReady) return;
    if (audioInitPromise) return audioInitPromise;

    audioInitPromise = (async () => {
      try {
        await Tone.start();
        sampler = new Tone.Sampler({
          urls: { A4: "A4.mp3", C4: "C4.mp3", D#4: "Ds4.mp3", F#4: "Fs4.mp3" },
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          release: 1,
        }).toDestination();

        await Tone.loaded();
        audioReady = true;
        console.log("✅ Audio ready");
      } catch (e) {
        console.error("Audio init failed:", e);
      }
    })();

    return audioInitPromise;
  }

  async function playNote(note) {
    if (!hasTone()) return;
    try {
      if (!audioReady) await initAudio();
      if (sampler) sampler.triggerAttackRelease(note, "8n");
    } catch (e) {
      console.error("playNote failed:", e);
    }
  }

  // ===== Layout: position blacks using offset (no drift) =====
  function positionBlackKeys() {
    if (!currentRoot) return;

    const whiteRow = currentRoot.querySelector(".piano-white-row");
    const blackLayer = currentRoot.querySelector(".piano-black-layer");
    if (!whiteRow || !blackLayer) return;

    const whites = Array.from(whiteRow.querySelectorAll(".white-key"));
    const blacks = Array.from(blackLayer.querySelectorAll(".black-key"));
    if (whites.length < 2 || blacks.length === 0) return;

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

  // ===== Hard inline styles so keyboard always visible =====
  function applyRootStyle(root) {
    root.style.position = "relative";
    root.style.width = "100%";
    root.style.height = "190px";          // 扁一些
    root.style.borderRadius = "16px";
    root.style.border = "1px solid rgba(255,255,255,.12)";
    root.style.background = "rgba(0,0,0,.22)";
    root.style.overflow = "visible";
    root.style.transform = "none";        // 防止缩放导致定位漂移
  }

  function applyWhiteRowStyle(row) {
    row.style.position = "absolute";
    row.style.left = "0";
    row.style.top = "0";
    row.style.right = "0";
    row.style.bottom = "0";
    row.style.display = "flex";
  }

  function applyBlackLayerStyle(layer) {
    layer.style.position = "absolute";
    layer.style.left = "0";
    layer.style.top = "0";
    layer.style.width = "100%";
    layer.style.height = "112px";
    layer.style.pointerEvents = "none"; // 黑键自身再开启
  }

  function applyWhiteKeyStyle(btn) {
    btn.style.flex = "1 1 auto";
    btn.style.minWidth = "46px";
    btn.style.height = "190px";
    btn.style.border = "1px solid rgba(0,0,0,.18)";
    btn.style.borderTop = "none";
    btn.style.background = "linear-gradient(180deg,#ffffff,#e9eefc)";
    btn.style.borderBottomLeftRadius = "10px";
    btn.style.borderBottomRightRadius = "10px";
    btn.style.padding = "0";
    btn.style.margin = "0";
    btn.style.cursor = "pointer";
    btn.style.touchAction = "manipulation";
  }

  function applyBlackKeyStyle(btn) {
    btn.style.pointerEvents = "auto";
    btn.style.position = "absolute";
    btn.style.top = "0";
    btn.style.width = "30px";
    btn.style.height = "112px";
    btn.style.border = "1px solid rgba(255,255,255,.10)";
    btn.style.background = "linear-gradient(180deg,#1a1a1a,#000)";
    btn.style.borderBottomLeftRadius = "8px";
    btn.style.borderBottomRightRadius = "8px";
    btn.style.boxShadow = "0 10px 20px rgba(0,0,0,.45)";
    btn.style.cursor = "pointer";
    btn.style.padding = "0";
    btn.style.margin = "0";
    btn.style.touchAction = "manipulation";
  }

  function buildPiano(containerId) {
    const root = document.getElementById(containerId);
    if (!root) {
      console.error("piano container not found:", containerId);
      return;
    }
    currentRoot = root;

    // Clear and apply root style first (so it has height)
    root.innerHTML = "";
    applyRootStyle(root);

    const whiteRow = document.createElement("div");
    whiteRow.className = "piano-white-row";
    applyWhiteRowStyle(whiteRow);

    const blackLayer = document.createElement("div");
    blackLayer.className = "piano-black-layer";
    applyBlackLayerStyle(blackLayer);

    root.appendChild(whiteRow);
    root.appendChild(blackLayer);

    function handlePress(note) {
      // 先判题事件
      document.dispatchEvent(new CustomEvent("notePlayed", { detail: note }));
      // 再尝试播放真钢琴
      playNote(note);
    }

    // whites
    WHITE_NOTES.forEach((note) => {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "white-key";
      k.dataset.note = note;
      k.title = note;
      applyWhiteKeyStyle(k);
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
      applyBlackKeyStyle(k);
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