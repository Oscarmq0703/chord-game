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
let students = {};

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "teacher") {
      teacher = ws;
      sendStats();
    }

    if (data.type === "join") {
      students[data.id] = { correct: 0, total: 0 };
      sendStats();
    }

    if (data.type === "answer") {
      const stu = students[data.id];
      if (!stu) return;

      stu.total++;
      if (data.correct) stu.correct++;

      sendStats();
    }
  });

  ws.on("close", () => {
    sendStats();
  });
});

function sendStats() {
  if (!teacher) return;

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

  teacher.send(
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