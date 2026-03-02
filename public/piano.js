// public/piano.js — Real 2-octave layout (C4–B5)
// Fix: position black keys using actual white key DOM positions (no drift on landscape)

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

  function positionBlackKeys() {
    if (!currentRoot) return;

    const whiteRow = currentRoot.querySelector(".piano-white-row");
    const blackLayer = currentRoot.querySelector(".piano-black-layer");
    if (!whiteRow || !blackLayer) return;

    const whites = Array.from(whiteRow.querySelectorAll(".white-key"));
    if (whites.length < 2) return;

    const rootRect = currentRoot.getBoundingClientRect();

    blackLayer.querySelectorAll(".black-key").forEach((k) => {
      const afterWhite = Number(k.dataset.afterWhite);
      const leftWhite = whites[afterWhite];
      const rightWhite = whites[afterWhite + 1];
      if (!leftWhite || !rightWhite) return;

      const lw = leftWhite.getBoundingClientRect();
      const rw = rightWhite.getBoundingClientRect();
      const kw = k.getBoundingClientRect();

      const center = (lw.right + rw.left) / 2;      // 两白键之间的中点（屏幕坐标）
      const left = center - rootRect.left - kw.width / 2; // 转为相对 piano 的坐标

      k.style.left = `${left}px`;
    });
  }

  function schedulePosition() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      positionBlackKeys();
      // 某些手机横屏地址栏收起会二次变化，再补一次
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

    // whites
    WHITE_NOTES.forEach((note) => {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "white-key";
      k.dataset.note = note;
      k.title = note;

      k.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("notePlayed", { detail: note }));
      });

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
        document.dispatchEvent(new CustomEvent("notePlayed", { detail: note }));
      });

      blackLayer.appendChild(k);
    });

    schedulePosition();

    // 监听各种会改变布局的事件
    window.addEventListener("resize", schedulePosition);
    window.addEventListener("orientationchange", schedulePosition);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", schedulePosition);
      window.visualViewport.addEventListener("scroll", schedulePosition);
    }
  }

  window.buildPiano = buildPiano;
})();