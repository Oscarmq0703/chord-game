const socket = new WebSocket(
  location.origin.replace(/^http/, "ws")
)

const studentId =
  "stu_" + Math.random().toString(36).slice(2)

socket.onopen = () => {
  socket.send(
    JSON.stringify({ type: "join", id: studentId })
  )
}

const notes = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.0,
  A: 440.0,
  B: 493.88,
}

let target = randomChord()
let selected = []

function randomChord() {
  const keys = Object.keys(notes)
  return keys[Math.floor(Math.random() * keys.length)]
}

function buildPiano() {
  const piano = document.getElementById("piano")
  Object.keys(notes).forEach((n) => {
    const key = document.createElement("div")
    key.className = "white-key"
    key.innerText = n
    key.onclick = () => press(n)
    piano.appendChild(key)
  })
}

function press(note) {
  playNote(notes[note])
  selected.push(note)

  if (selected.length === 1) {
    const correct = selected[0] === target

    socket.send(
      JSON.stringify({
        type: "answer",
        id: studentId,
        correct,
      })
    )

    document.getElementById("progress").innerText =
      correct ? "正确！" : "错误"

    selected = []
    target = randomChord()
  }
}

buildPiano()