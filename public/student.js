(function () {
  const wsUrl = location.origin.replace(/^http/, "ws");
  const socket = new WebSocket(wsUrl);

  // ===== 设备级唯一ID（你说重复计数已修好，这里继续沿用）=====
  let studentId = localStorage.getItem("studentId");
  if (!studentId) {
    studentId = "stu_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("studentId", studentId);
  }

  // UI
  const elNameInput = document.getElementById("nameInput");
  const elNameBtn = document.getElementById("nameBtn");
  const elQ = document.getElementById("questionText");
  const elProg = document.getElementById("progressText");
  const elCorrect = document.getElementById("correctNum");
  const elTotal = document.getElementById("totalNum");
  const elAI = document.getElementById("aiHint");

  function setText(el, text) {
    if (!el) return;
    el.textContent = String(text);
  }

  // 恢复姓名
  const savedName = localStorage.getItem("studentName") || "";
  if (elNameInput) elNameInput.value = savedName;

  // ========= WebSocket 消息队列（关键修复点）=========
  const pending = [];
  function sendOrQueue(obj) {
    const payload = JSON.stringify(obj);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    } else {
      pending.push(payload);
    }
  }
  function flushQueue() {
    while (pending.length && socket.readyState === WebSocket.OPEN) {
      socket.send(pending.shift());
    }
  }

  function getName() {
    return (elNameInput?.value || "").trim().slice(0, 20);
  }

  function joinWithName() {
    const name = getName();
    // 允许空名 join，但会显示“未命名”
    sendOrQueue({ type: "join", id: studentId, name });
  }

  function updateNameToServer() {
    const name = getName();
    if (!name) {
      alert("请先输入姓名");
      return;
    }
    localStorage.setItem("studentName", name);
    sendOrQueue({ type: "set_name", id: studentId, name });
    if (elAI) elAI.textContent = "✅ 已提交姓名（教师端会显示你的名字）。";
  }

  // 点击“确定”
  elNameBtn?.addEventListener("click", updateNameToServer);
  elNameInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") updateNameToServer();
  });

  // ===== 题库（先保持稳定：目标音符）=====
  const NOTE_POOL = [
    "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
    "C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5"
  ];

  let targetNote = "--";
  let correctCount = 0;
  let totalCount = 0;

  function nextQuestion() {
    targetNote = NOTE_POOL[Math.floor(Math.random() * NOTE_POOL.length)];
    // 展示用 ♯，内部判定仍用 #
    setText(elQ, targetNote.replace("#", "♯"));
  }

  function updateProgress() {
    setText(elCorrect, correctCount);
    setText(elTotal, totalCount);
    if (elProg) elProg.textContent = `完成 ${totalCount} ｜ 正确 ${correctCount}`;
  }

function offlineAIAdvice() {

  const rate = totalCount === 0 ? 0 : correctCount / totalCount;

  if (rate === 1) {
    return "正确率100%。音名定位非常稳定，可以开始加入黑键和跨八度训练，并尝试先在脑中听到音名再找到键位。";
  }

  if (rate >= 0.80) {
    return "正确率较高，键盘定位基本稳定。建议继续加强黑键定位练习，并尝试提高反应速度。";
  }

  if (rate >= 0.60) {
    return "正确率中等，说明音名认识基本正确，但定位仍不稳定。建议加强音名到键位的对应练习。";
  }

  return "正确率较低，建议先巩固钢琴键盘结构。练习白键分组定位，再逐步加入黑键练习。";
}

  // WebSocket 生命周期
  socket.onopen = () => {
    console.log("student ws connected");
    joinWithName();      // ✅ 一定 join
    flushQueue();        // ✅ 补发 queued 消息
    nextQuestion();
    updateProgress();
    if (elAI) elAI.textContent = "已连接课堂。可先输入姓名，再开始作答。";
  };

  socket.onclose = () => {
    console.log("student ws closed");
    if (elAI) elAI.textContent = "连接已断开（可刷新重连）。";
  };

  socket.onerror = (e) => {
    console.error("student ws error", e);
    if (elAI) elAI.textContent = "网络异常（可刷新重连）。";
  };

  // 监听键盘点击事件
  document.addEventListener("notePlayed", (e) => {
    const played = e.detail; // e.g. C#4
    const isCorrect = played === targetNote;

    totalCount++;
    if (isCorrect) correctCount++;

    updateProgress();

    if (elAI) {
      if (totalCount % 10 === 0) elAI.textContent = offlineAIAdvice();
      else elAI.textContent = isCorrect ? "✅ 本题正确！" : "❌ 不对，注意目标音名与键位。";
    }

    // 回传教师端统计（✅ 若 ws 未连上也会排队）
    sendOrQueue({ type: "answer", id: studentId, correct: isCorrect });

    nextQuestion();
  });
})();