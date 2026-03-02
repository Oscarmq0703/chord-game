(f(function () {
  const wsUrl = location.origin.replace(/^http/, "ws");
  const socket = new WebSocket(wsUrl);

  // ===== 设备级唯一ID（你之前已修复重复计数，这里保留）=====
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

  // ===== 题库（先用目标音符，稳定可用；后续再升级和弦题库）=====
  const NOTE_POOL = [
    "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
    "C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5"
  ];

  let targetNote = "--";
  let correctCount = 0;
  let totalCount = 0;

  function nextQuestion() {
    targetNote = NOTE_POOL[Math.floor(Math.random() * NOTE_POOL.length)];
    setText(elQ, targetNote.replace("#", "♯"));
  }

  function updateProgress() {
    setText(elCorrect, correctCount);
    setText(elTotal, totalCount);
    if (elProg) elProg.textContent = `完成 ${totalCount} ｜ 正确 ${correctCount}`;
  }

  function offlineAIAdvice() {
    const rate = totalCount === 0 ? 0 : correctCount / totalCount;
    if (rate >= 0.85) {
      return "🎖️ 表现优秀：尝试加入“黑键定位”专项训练（先读音名→再找键位）。";
    }
    if (rate >= 0.65) {
      return "👍 进步明显：建议慢练 + 口头报音名，再下键，减少♯音误触。";
    }
    return "📚 建议巩固：先练白键定位，再逐步加入黑键（C#、D#、F#、G#、A#）。";
  }

  function getName() {
    return (elNameInput?.value || "").trim().slice(0, 20);
  }

  function sendJoinOrUpdateName(type) {
    const name = getName();
    if (name) {
      localStorage.setItem("studentName", name);
    }
    if (socket.readyState !== WebSocket.OPEN) return;

    if (type === "join") {
      socket.send(JSON.stringify({ type: "join", id: studentId, name }));
    } else {
      socket.send(JSON.stringify({ type: "set_name", id: studentId, name }));
    }
  }

  // 点击“确定”：更新姓名到老师端
  elNameBtn?.addEventListener("click", () => {
    const name = getName();
    if (!name) {
      alert("请先输入姓名");
      return;
    }
    sendJoinOrUpdateName("set_name");
    if (elAI) elAI.textContent = "✅ 姓名已保存，可以开始作答。";
  });

  // Enter 提交
  elNameInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") elNameBtn?.click();
  });

  socket.onopen = () => {
    console.log("student ws connected");
    // join（带姓名）
    sendJoinOrUpdateName("join");
    nextQuestion();
    updateProgress();
  };

  socket.onerror = (e) => console.error("student ws error", e);

  // 监听键盘点击事件
  document.addEventListener("notePlayed", (e) => {
    const played = e.detail; // e.g. C#4

    const correct = played === targetNote;

    totalCount++;
    if (correct) correctCount++;

    updateProgress();

    // 每题提示 + 每10题总结
    if (elAI) {
      if (totalCount % 10 === 0) {
        elAI.textContent = offlineAIAdvice();
      } else {
        elAI.textContent = correct ? "✅ 本题正确！" : "❌ 不对，注意目标音名与键位。";
      }
    }

    // 回传教师端统计
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "answer",
          id: studentId,
          correct,
        })
      );
    }

    nextQuestion();
  });
})();