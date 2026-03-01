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

let teacherSocket = null;
let students = {};

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    // 教师连接
    if (data.type === "teacher") {
      teacherSocket = ws;
      sendStats();
    }

    // 学生加入
    if (data.type === "join") {
      students[data.id] = {
        correct: 0,
        total: 0,
      };
      sendStats();
    }

    // 学生答题
    if (data.type === "answer") {
      const stu = students[data.id];
      if (!stu) return;

      stu.total++;
      if (data.correct) stu.correct++;

      sendStats();
    }
  });

  ws.on("close", () => {
    for (let id in students) {
      if (students[id].socket === ws) {
        delete students[id];
      }
    }
    if (ws === teacherSocket) teacherSocket = null;
    sendStats();
  });
});

function sendStats() {
  if (!teacherSocket) return;

  const studentCount = Object.keys(students).length;

  let totalAnswers = 0;
  let totalCorrect = 0;

  Object.values(students).forEach((s) => {
    totalAnswers += s.total;
    totalCorrect += s.correct;
  });

  const accuracy =
    totalAnswers === 0
      ? 0
      : Math.round((totalCorrect / totalAnswers) * 100);

  teacherSocket.send(
    JSON.stringify({
      type: "stats",
      students: studentCount,
      accuracy,
    })
  );
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});