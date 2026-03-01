const AudioContext =
  window.AudioContext || window.webkitAudioContext
const ctx = new AudioContext()

function playNote(freq) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.frequency.value = freq
  osc.type = "sine"

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start()

  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + 1
  )

  osc.stop(ctx.currentTime + 1)
}

window.playNote = playNote