const socket = io();

// 获取房间号
const params = new URLSearchParams(location.search);
const roomId = params.get("room") || prompt("输入房间号");

socket.emit("joinRoom", roomId);

// ===== 题库 =====
const chords = [
  { name: "C7", notes: ["C","E","G","Bb"] },
  { name: "G7", notes: ["G","B","D","F"] },
  { name: "Cm7b5", notes: ["C","Eb","Gb","Bb"] },
];

let current = null;

function nextQuestion() {
  current = chords[Math.floor(Math.random() * chords.length)];
  document.getElementById("question").innerText =
    "请弹奏：" + current.name;
}

window.checkAnswer = function(note) {
  const correct = current.notes.includes(note);
  socket.emit("answer", { roomId, correct });
  nextQuestion();
};

nextQuestion();