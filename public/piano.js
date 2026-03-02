// public/piano.js — Real 2-octave keyboard layout (C4–B5)
// Fix: re-position black keys on resize/orientationchange (mobile landscape)

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
  let resizeTimer = null;

  function positionBlackKeys() {
    if (!currentRoot) return;

    const whiteRow = currentRoot.querySelector(".piano-white-row");
    const blackLayer = currentRoot.querySelector(".piano-black-layer");
    if (!whiteRow || !blackLayer) return;

    const firstWhite = whiteRow.querySelector(".white-key");
    if (!firstWhite) return;

    const whiteW = firstWhite.getBoundingClientRect().width;

    // 取实际黑键宽度（从CSS），避免写死
    let blackW = 36;
    const anyBlack = blackLayer.querySelector(".black-key");
    if (anyBlack) blackW = anyBlack.getBoundingClientRect().width;

    blackLayer.querySelectorAll(".black-key").forEach((k) => {
      const afterWhite = Number(k.dataset.afterWhite);
      const left = (afterWhite + 1) * whiteW - blackW / 2;
      k.style.left = `${left}px`;
    });
  }

  function debounceReposition() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(positionBlackKeys, 60);
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

    // Whites
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
        document.dispatchEvent(new CustomEvent("notePlayed", { detail: note }));
      });

      blackLayer.appendChild(k);
    });

    // ⭐关键：等浏览器完成布局后再定位一次
    requestAnimationFrame(() => {
      positionBlackKeys();
      // 某些手机横屏时需要再来一次
      setTimeout(positionBlackKeys, 120);
    });

    // 监听横竖屏/窗口变化，重新定位黑键
    window.removeEventListener("resize", debounceReposition);
    window.removeEventListener("orientationchange", debounceReposition);
    window.addEventListener("resize", debounceReposition);
    window.addEventListener("orientationchange", debounceReposition);
  }

  window.buildPiano = buildPiano;
})();