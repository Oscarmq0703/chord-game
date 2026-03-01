// public/piano.js — Stable v3.5 Safe Version

let audioCtx = null;

// =========================
// 真实两八度音符表
// =========================

const NOTES = [
  "C4","C#4","D4","D#4","E4","F4",
  "F#4","G4","G#4","A4","A#4","B4",
  "C5","C#5","D5","D#5","E5","F5",
  "F#5","G5","G#5","A5","A#5","B5"
];

const FREQ = {
  "C4":261.63,"C#4":277.18,"D4":293.66,"D#4":311.13,"E4":329.63,
  "F4":349.23,"F#4":369.99,"G4":392.00,"G#4":415.30,"A4":440.00,
  "A#4":466.16,"B4":493.88,
  "C5":523.25,"C#5":554.37,"D5":587.33,"D#5":622.25,"E5":659.25,
  "F5":698.46,"F#5":739.99,"G5":783.99,"G#5":830.61,"A5":880.00,
  "A#5":932.33,"B5":987.77
};

// =========================
// 初始化 AudioContext（用户点击后激活）
// =========================

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

// =========================
// 播放音符
// =========================

function playNote(note) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.value = FREQ[note];
  osc.type = "sine";

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 1
  );

  osc.start();
  osc.stop(audioCtx.currentTime + 1);
}

// =========================
// 构建两八度键盘
// =========================

function buildPiano(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  NOTES.forEach((note) => {
    const isBlack = note.includes("#");

    const key = document.createElement("div");
    key.className = isBlack ? "black-key" : "white-key";
    key.dataset.note = note;

    key.addEventListener("click", () => {
      initAudio();         // ⭐ 用户手势激活
      playNote(note);

      document.dispatchEvent(
        new CustomEvent("notePlayed", { detail: note })
      );
    });

    container.appendChild(key);
  });
}

// 暴露到全局
window.buildPiano = buildPiano;