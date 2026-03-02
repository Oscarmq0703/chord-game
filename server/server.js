const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

let teacher = null;

/**
 * students[id] = {
 *   ws,
 *   name,
 *   correct,
 *   total,
 *   lastSeen
 * }
 */
const students = Object.create(null);

function safeName(x) {
  const s = String(x ?? "").trim();
  // 简单防护：去掉尖括号，避免插入 HTML
  return s.replace(/[<>]/g, "").slice(0, 20);
}

function sendStats() {
  if (!teacher || teacher.readyState !== WebSocket.OPEN) return;

  const ids = Object.keys(students);
  const studentCount = ids.length;

  let totalAnswers = 0;
  let totalCorrect = 0;

  const roster = ids.map((id) => {
    const s = students[id];
    totalAnswers += s.total;
    totalCorrect += s.correct;
    return {
      id,
      name: s.name || "未命名",
      correct: s.correct,
      total: s.total,
    };
  });

  roster.sort((a, b) => (b.total - a.total) || (b.correct - a.correct));

  const accuracy =
    totalAnswers === 0 ? 0 : Math.round((totalCorrect / totalAnswers) * 100);

  teacher.send(
    JSON.stringify({
      type: "stats",
      students: studentCount,
      accuracy,
      roster,
    })
  );
}

function upsertStudent(id, ws) {
  if (!students[id]) {
    students[id] = { ws, name: "", correct: 0, total: 0, lastSeen: Date.now() };
  } else {
    students[id].ws = ws;
    students[id].lastSeen = Date.now();
  }
}

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    // 教师端上线
    if (data.type === "teacher") {
      teacher = ws;
      sendStats();
      return;
    }

    // 学生加入
    if (data.type === "join") {
      const id = String(data.id || "").trim();
      if (!id) return;

      upsertStudent(id, ws);
      if (data.name) students[id].name = safeName(data.name);

      sendStats();
      return;
    }

    // 学生设置/更新姓名
    if (data.type === "set_name") {
      const id = String(data.id || "").trim();
      if (!id || !students[id]) return;

      students[id].name = safeName(data.name);
      sendStats();
      return;
    }

    // 学生答题
    if (data.type === "answer") {
      const id = String(data.id || "").trim();
      if (!id || !students[id]) return;

      students[id].total += 1;
      if (data.correct) students[id].correct += 1;
      students[id].lastSeen = Date.now();

      sendStats();
      return;
    }
  });

  ws.on("close", () => {
    // 关闭时移除对应学生（通过 ws 匹配）
    for (const id of Object.keys(students)) {
      if (students[id].ws === ws) {
        delete students[id];
      }
    }
    if (teacher === ws) teacher = null;
    sendStats();
  });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});