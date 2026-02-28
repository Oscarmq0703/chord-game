const express = require("express")
const http = require("http")
const WebSocket = require("ws")
const Redis = require("ioredis")
const path = require("path")

const app = express()
const server = http.createServer(app)

// ⭐ Redis（生产级）

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

redis.on("connect", () => {
  console.log("✅ Redis connected")
})

redis.on("error", (err) => {
  console.error("❌ Redis error:", err)
})

// ⭐ 静态资源

app.use(express.static(path.join(__dirname, "../public")))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"))
})

// ⭐ WebSocket

const wss = new WebSocket.Server({ server })

let teacherSocket = null
let students = {}

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    const data = JSON.parse(message)

    // 学生加入
    if (data.type === "join") {
      students[data.id] = ws
      broadcastStats()
    }

    // 学生答题
    if (data.type === "answer") {
      if (teacherSocket) {
        teacherSocket.send(JSON.stringify({
          type: "update",
          studentId: data.id,
          correct: data.correct,
        }))
      }
    }

    // 教师上线
    if (data.type === "teacher") {
      teacherSocket = ws
      broadcastStats()
    }
  })

  ws.on("close", () => {
    broadcastStats()
  })
})

// ⭐ 广播统计

function broadcastStats() {
  const count = Object.keys(students).length

  if (teacherSocket) {
    teacherSocket.send(JSON.stringify({
      type: "stats",
      count,
    }))
  }
}

// ⭐ Render 端口

const PORT = process.env.PORT || 10000

server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT)
})