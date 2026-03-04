const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();

// 静态资源（public）
app.use(express.static(path.join(__dirname, "../public")));

// 首页（你可以按需改成 index.html）
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Render 健康检查（可选但推荐）
app.get("/health", (req, res) => res.status(200).send("OK"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ====== 下面是你原来的 ws 逻辑（保留即可） ======
let teacher = null;
const students = Object.create(null);

function safeName(x) {
  return String(x ?? "").trim().replace(/[<>]/g, "").slice(0, 20);
}

function sendStats() {
  if (!teacher || teacher.readyState !== WebSocket.OPEN) return;

  const ids = Object.keys(students);
  let totalAnswers = 0, totalCorrect = 0;

  const roster = ids.map((id) => {
    const s = students[id];
    totalAnswers += s.total;
    totalCorrect += s.correct;
    return { id, name: s.name || "未命名", correct: s.correct, total: s.total };
  });

  const accuracy = totalAnswers === 0 ? 0 : Math.round((totalCorrect / totalAnswers) * 100);

  teacher.send(JSON.stringify({
    type: "stats",
    students: ids.length,
    accuracy,
    roster
  }));
}

function upsertStudent(id, ws) {
  if (!students[id]) students[id] = { ws, name: "", correct: 0, total: 0 };
  students[id].ws = ws;
}

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch { return; }

    if (data.type === "teacher") {
      teacher = ws;
      sendStats();
      return;
    }

    if (data.type === "join") {
      const id = String(data.id || "").trim();
      if (!id) return;
      upsertStudent(id, ws);
      if (data.name) students[id].name = safeName(data.name);
      sendStats();
      return;
    }

    if (data.type === "set_name") {
      const id = String(data.id || "").trim();
      if (!id || !students[id]) return;
      students[id].name = safeName(data.name);
      sendStats();
      return;
    }

    if (data.type === "answer") {
      const id = String(data.id || "").trim();
      if (!id || !students[id]) return;
      students[id].total += 1;
      if (data.correct) students[id].correct += 1;
      sendStats();
      return;
    }
  });

  ws.on("close", () => {
    for (const id of Object.keys(students)) {
      if (students[id].ws === ws) delete students[id];
    }
    if (teacher === ws) teacher = null;
    sendStats();
  });
});

// ✅ Render 必须绑定这个 PORT
const PORT = process.env.PORT || 10000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Listening on ${PORT}`);
});