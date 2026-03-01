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

// 🎹 构建两八度键盘

buildPiano("piano")

// 🎯 判定逻辑（示例）

let correctCount = 0
let totalCount = 0

document.addEventListener("notePlayed", (e) => {
  const correct = Math.random() > 0.5

  totalCount++
  if (correct) correctCount++

  socket.send(
    JSON.stringify({
      type: "answer",
      id: studentId,
      correct,
    })
  )

  document.getElementById("progress").innerText =
    `完成 ${totalCount} ｜ 正确 ${correctCount}`
})