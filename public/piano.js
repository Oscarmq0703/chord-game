// piano.js — Classroom Pro v2

let sampler
let audioReady = false

async function initPiano() {
  if (audioReady) return

  await Tone.start()

  sampler = new Tone.Sampler({
    urls: {
      C4: "C4.mp3",
      D#4: "Ds4.mp3",
      F#4: "Fs4.mp3",
      A4: "A4.mp3",
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  }).toDestination()

  audioReady = true
  console.log("🎹 Piano ready")
}

function playNote(note) {
  if (!sampler) return
  sampler.triggerAttackRelease(note, "8n")
}

window.initPiano = initPiano
window.playNote = playNote