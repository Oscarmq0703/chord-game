// ⭐ Classroom Pro v2 — Student

const socket = new WebSocket(
  location.origin.replace(/^http/, "ws")
)

const studentId =
  "stu_" + Math.random().toString(36).slice(2, 8)

let correctCount = 0
let totalCount = 0

socket.onopen = () => {
  console.log("🧑‍🎓 student connected")

  socket.send(
    JSON.stringify({
      type: "join",
      id: studentId,
    })
  )
}

// 🎹 点击琴键

document.addEventListener("click", async (e) => {
  const key = e.target.dataset.note
  if (!key) return

  await initPiano()
  playNote(key)

  // ⭐ 模拟判题（你后面可换成真实逻辑）

  const correct = Math.random() > 0.4

  totalCount++
  if (correct) correctCount++

  // 发给老师

  socket.send(
    JSON.stringify({
      type: "answer",
      id: studentId,
      correct,
    })
  )

  updateProgress()

  // ⭐ 每 10 题 AI 反馈

  if (totalCount % 10 === 0) {
    showAIReport()
  }
})

// 📊 更新进度

function updateProgress() {
  const el = document.getElementById("progress")
  if (!el) return

  el.innerText =
    `已完成 ${totalCount} 题｜正确 ${correctCount}`
}

// 🤖 离线 AI 评价（增强版）

function showAIReport() {
  const rate = correctCount / totalCount

  let level = ""
  let advice = ""

  if (rate > 0.85) {
    level = "🎖️ 和弦大师"
    advice = "尝试加入转位与快速识别训练。"
  } else if (rate > 0.6) {
    level = "👍 良好水平"
    advice = "重点练习属七和弦与半减七。"
  } else {
    level = "📚 需要加强"
    advice = "建议回到三和弦分解练习。"
  }

  alert(
    `AI学习报告\n\n正确率：${Math.round(rate * 100)}%\n等级：${level}\n建议：${advice}`
  )
}