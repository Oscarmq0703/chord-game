// ⭐ Classroom Pro v2 — Teacher

const socket = new WebSocket(
  location.origin.replace(/^http/, "ws")
)

let totalStudents = 0
let correctTotal = 0
let answerTotal = 0

socket.onopen = () => {
  console.log("👨‍🏫 teacher connected")

  socket.send(
    JSON.stringify({
      type: "teacher",
    })
  )
}

socket.onmessage = function(event) {
   const data = JSON.parse(event.data)
   updateStats(data)
}

  // 👥 人数更新

  if (data.type === "stats") {
    totalStudents = data.count
    updateBoard()
  }

  // 📊 答题更新

  if (data.type === "update") {
    answerTotal++
    if (data.correct) correctTotal++
    updateBoard()
  }
}

// 🖥 更新大屏

function updateBoard() {
  const el1 = document.getElementById("studentCount")
  const el2 = document.getElementById("accuracy")

  if (el1) el1.innerText = totalStudents

  if (el2 && answerTotal > 0) {
    const rate = Math.round(
      (correctTotal / answerTotal) * 100
    )
    el2.innerText = rate + "%"
  }
}