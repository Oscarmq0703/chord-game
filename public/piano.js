// 🎹 Classroom Pro v3.5 Piano Engine（两八度真键盘）

const AudioContext =
  window.AudioContext || window.webkitAudioContext
const ctx = new AudioContext()

// ⭐ 钢琴采样（真实音色）

const sampler = new Tone.Sampler({
  urls: {
    C4: "C4.mp3",
    D#4: "Ds4.mp3",
    F#4: "Fs4.mp3",
    A4: "A4.mp3",
  },
  baseUrl: "https://tonejs.github.io/audio/salamander/",
}).toDestination()

// ======================
// 🎹 两八度音符表
// ======================

const NOTE_MAP = [
  "C4","C#4","D4","D#4","E4","F4",
  "F#4","G4","G#4","A4","A#4","B4",
  "C5","C#5","D5","D#5","E5","F5",
  "F#5","G5","G#5","A5","A#5","B5"
]

// ======================
// 🎹 构建键盘
// ======================

function buildPiano(containerId) {
  const piano = document.getElementById(containerId)
  piano.innerHTML = ""
  piano.className = "piano"

  NOTE_MAP.forEach((note, index) => {
    const isBlack = note.includes("#")

    const key = document.createElement("div")
    key.className = isBlack ? "black-key" : "white-key"
    key.dataset.note = note

    key.onclick = async () => {
      await Tone.start()
      sampler.triggerAttackRelease(note, "8n")

      document.dispatchEvent(
        new CustomEvent("notePlayed", { detail: note })
      )
    }

    piano.appendChild(key)
  })
}

window.buildPiano = buildPiano