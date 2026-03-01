// public/student.js — UI-adapted (Classroom Pro)

(function () {
  const wsUrl = location.origin.replace(/^http/, "ws");
  const socket = new WebSocket(wsUrl);

  // UI elements
  const elQ = document.getElementById("questionText");
  const elProg = document.getElementById("progressText");
  const elCorrect = document.getElementById("correctNum");
  const elTotal = document.getElementById("totalNum");
  const elAI = document.getElementById("aiHint");

  function setText(el, text) {
    if (!el) return;
    el.textContent = String(text);
  }

  // room：URL 优先，其次 localStorage
  const params = new URLSearchParams(location.search);
  const room =
    params.get("room") || localStorage.getItem("CLASSROOM_ROOM") || null;

  // 学生 ID
  const studentId = "stu_" + Math.random().toString(36).slice(2, 10);

  // ====== v3.5 先实现“稳定可用”的判题：目标音符 ======
  // 真实和弦题库（七和弦/属七/半减七）下一步 v4 我可以继续给你升级
  const NOTE_POOL = [
    "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
    "C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5"
  ];

  let targetNote = null;
  let correctCount = 0;
  let totalCount = 0;

  // 构建两八度键盘（由 piano.js 提供）
  if (typeof window.buildPiano === "function") {
    window.buildPiano("piano");
  } else {
    console.warn("buildPiano not found. Check piano.js loaded.");
  }

  function nextQuestion() {
    targetNote = NOTE_POOL[Math.floor(Math.random() * NOTE_POOL.length)];
    setText(elQ, `请弹奏：${targetNote.replace("#", "♯")}`);
  }

  function offlineAIAdvice() {
    const rate = totalCount === 0 ? 0 : correctCount / totalCount;

    if (rate >= 0.85) {
      return "🎖️ 表现优秀：你能快速定位音高。建议加入“黑键定位”专项训练，并尝试听辨后再下键。";
    }
    if (rate >= 0.65) {
      return "👍 进步明显：注意♯音（黑键）容易误触。建议：先说出目标音名→再找键位，形成稳定流程。";
    }
    return "📚 需要巩固：建议先分组练习 C–D–E、F–G–A、B–C 的白键定位，再加入黑键。慢练比快按更有效。";
  }

  function updateUI() {
    setText(elCorrect, correctCount);
    setText(elTotal, totalCount);
    setText(elProg, `${totalCount} / ${correctCount}`);
    // elProg 显示更直观：完成/正确
    if (elProg) elProg.textContent = `完成 ${totalCount} ｜ 正确 ${correctCount}`;
  }

  // 当学生按键时，piano.js 会派发 notePlayed 事件
  document.addEventListener("notePlayed", (e) => {
    const note = e.detail; // 例如 "C#4"

    // 判题：是否等于目标音符
    const correct = note === targetNote;

    totalCount++;
    if (correct) correctCount++;

    // 回传给后端（教师端实时统计）
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "answer",
          id: studentId,
          room,
          correct,
        })
      );
    }

    // 更新 UI
    updateUI();

    // 每 10 题给一次离线 AI 建议（写在右侧卡片）
    if (totalCount % 10 === 0) {
      setText(elAI, offlineAIAdvice());
    } else {
      // 每题也给一点轻提示
      if (elAI) {
        elAI.textContent = correct ? "✅ 本题正确！继续保持。" : "❌ 本题不对，注意音名与键位对应。";
      }
    }

    // 下一题
    nextQuestion();
  });

  socket.onopen = () => {
    console.log("🎓 student ws connected");

    // 进入房间（后端目前不严格区分 room，也不影响统计）
    socket.send(
      JSON.stringify({
        type: "join",
        id: studentId,
        room,
      })
    );

    // 初始化题目 & UI
    nextQuestion();
    updateUI();
    if (elAI) elAI.textContent = "点击琴键开始作答（若无声音请先点一下页面）。";
  };

  socket.onclose = () => {
    console.log("🎓 student ws closed");
    if (elAI) elAI.textContent = "连接已断开，请刷新页面重连。";
  };

  socket.onerror = (err) => {
    console.error("student ws error", err);
    if (elAI) elAI.textContent = "网络异常，请刷新页面。";
  };
})();