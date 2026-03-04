(function () {
  const WHITE_NOTES = [
    "C4","D4","E4","F4","G4","A4","B4",
    "C5","D5","E5","F5","G5","A5","B5"
  ];

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

  function canUseTone() {
    return typeof window.Tone !== "undefined";
  }

  async function initAudio() {
    if (!canUseTone()) return;
    if (audioReady) return;
    if (audioInitPromise) return audioInitPromise;

    audioInitPromise = (async () => {
      try {
        // must be called after user gesture; we call initAudio inside click handler
        await Tone.start();

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

        // ✅ 最兼容的加载等待方式
        await Tone.loaded();

        audioReady = true;
        console.log("✅ Audio ready");
      } catch (e) {
        console.error("Audio init failed:", e);
        // 音频失败也不影响键盘使用
      }
    })();

    return audioInitPromise;
  }

  async function playNote(note) {
    if (!canUseTone()) return;
    try {
      if (!audioReady) await initAudio();
      if (sampler) sampler.triggerAttackRelease(note, "8n");
    } catch (e) {
      console.error("playNote failed:", e);
    }
  }

  // ===== Layout (black keys stable) =====
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

  function buildPiano(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;

    currentRoot = root;

    // ✅ 渲染必须先完成：任何音频错误都不能影响这里
    root.innerHTML = "";
    root.classList.add("piano");

    const whiteRow = document.createElement("div");
    whiteRow.className = "piano-white-row";

    const blackLayer = document.createElement("div");
    blackLayer.className = "piano-black-layer";

    root.appendChild(whiteRow);
    root.appendChild(blackLayer);

    function handlePress(note) {
      // 先触发事件给判题
      document.dispatchEvent(new CustomEvent("notePlayed", { detail: note }));
      // 再尝试发声（失败不影响）
      playNote(note);
    }

    // Whites
    WHITE_NOTES.forEach((note) => {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "white-key";
      k.dataset.note = note;
      k.title = note;
      k.addEventListener("click", () => handlePress(note));
      whiteRow.appendChild(k);
    });

    // Blacks
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