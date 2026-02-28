const socket = io();

// 🎯 随机房间号
const roomId = Math.random().toString(36).substring(2, 8);

document.getElementById("roomId").innerText = roomId;

// 加入房间
socket.emit("joinRoom", roomId);

// ✅ 生成二维码（学生扫码直接进）
const joinUrl =
  location.origin + "/student.html?room=" + roomId;

QRCode.toCanvas(document.createElement("canvas"), joinUrl, function (err, canvas) {
  document.getElementById("qrcode").appendChild(canvas);
});

// 📊 实时统计
socket.on("stats", (data) => {
  document.getElementById("total").innerText = data.total;
  document.getElementById("correct").innerText = data.correct;
});

// 🧠 AI反馈
socket.on("evaluation", (e) => {
  document.getElementById("evaluation").innerHTML = `
    <h3>${e.level}</h3>
    <p>${e.comment}</p>
    <p><b>练习建议：</b>${e.suggestion}</p>
  `;
});