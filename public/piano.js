// public/piano.js — Real 2-octave keyboard layout (C4–B5)
// Generates white keys in a row + black keys floating above at correct positions.

(function () {
  // Two octaves: C4..B5
  const WHITE_NOTES = [
    "C4","D4","E4","F4","G4","A4","B4",
    "C5","D5","E5","F5","G5","A5","B5"
  ];

  // Black keys mapped to the "gap after which white key" (index in WHITE_NOTES)
  // C# is between C and D -> after C (whiteIndex 0)
  // D# between D and E -> after D (1)
  // no black between E-F
  // F# after F (3)
  // G# after G (4)
  // A# after A (5)
  // no black between B-C
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

  function buildPiano(containerId) {
    const root = document.getElementById(containerId);
    if (!root) return;

    // Clean
    root.innerHTML = "";
    root.classList.add("piano");

    // Create layers
    const whiteRow = document.createElement("div");
    whiteRow.className = "piano-white-row";

    const blackLayer = document.createElement("div");
    blackLayer.className = "piano-black-layer";

    root.appendChild(whiteRow);
    root.appendChild(blackLayer);

    // Render white keys
    WHITE_NOTES.forEach((note) => {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "white-key";
      k.dataset.note = note;
      k.title = note;

      // Click emits notePlayed event (student.js listens to it)
      k.addEventListener("click", () => {
        document.dispatchEvent(new CustomEvent("notePlayed", { detail: note }));
      });

      whiteRow.appendChild(k);
    });

    // Compute sizes from CSS (so layout stays responsive)
    // fallback values if not measurable yet
    const whiteW = whiteRow.querySelector(".white-key")?.getBoundingClientRect().width || 56;
    const blackW = 36;

    // Render black keys (absolute positioning)
    BLACK_KEYS.forEach(({ note, afterWhite }) => {
      const k = document.createElement("button");
      k.type = "button";
      k.className = "black-key";
      k.dataset.note = note;
      k.title = note;

      // Place black key centered between two whites:
      // left = (afterWhite + 1) * whiteW - blackW/2
      const left = (afterWhite + 1) * whiteW - blackW / 2;
      k.style.left = `${left}px`;

      k.addEventListener("click", (ev) => {
        // Prevent white key click "through"
        ev.stopPropagation();
        document.dispatchEvent(new CustomEvent("notePlayed", { detail: note }));
      });

      blackLayer.appendChild(k);
    });
  }

  window.buildPiano = buildPiano;
})();