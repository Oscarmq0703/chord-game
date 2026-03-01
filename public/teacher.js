// public/teacher.js — UI-adapted (Classroom Pro)

(function () {
  const wsUrl = location.origin.replace(/^http/, "ws");
  const socket = new WebSocket(wsUrl);

  // UI elements (存在就更新，不存在就跳过)
  const elStudents = document.getElementById("students");
  const elAccuracy = document.getElementById("accuracy");
  const elAI = document.getElementById("aiText");

  function setText(el, text) {
    if (!el) return;
    el.textContent = String(text);
  }

  // 尝试读取 room（URL优先，其次localStorage）
  const params = new URLSearchParams(location.search);
  const room =
    params.get("room") || localStorage.getItem("CLASSROOM_ROOM") || null;

  socket.onopen = () => {
    console.log("👨‍🏫 teacher ws connected");

    // 向后端声明：我是教师端
    socket.send(
      JSON.stringify({
        type: "teacher",
        room, // v3.5+ 可用；若后端不识别也无碍
      })
    );

    if (elAI) {
      elAI.textContent = "已连接，等待学生答题中…";
    }
  };

  socket.onmessage = (evt) => {
    let data;
    try {
      data = JSON.parse(evt.data);
    } catch (e) {
      console.warn("Invalid message:", evt.data);
      return;
    }

    // 1) 统计更新（来自你 v3 server.js: type === "stats"）
    if (data.type === "stats") {
      // 兼容字段名：students / count
      if (data.students != null) setText(elStudents, data.students);
      else if (data.count != null) setText(elStudents, data.count);

      // 兼容字段名：accuracy / correctRate
      if (data.accuracy != null) setText(elAccuracy, data.accuracy);
      else if (data.correctRate != null) setText(elAccuracy, data.correctRate);

      return;
    }

    // 2) 单次答题更新（如果你后端发 update，也兼容）
    if (data.type === "update") {
      // update 消息一般不直接包含统计，这里只做提示
      if (elAI) elAI.textContent = "收到学生作答，统计已更新。";
      return;
    }

    // 3) AI 反馈（如果你后端未来推送 type:"ai" 或 type:"evaluation"）
    if (data.type === "ai" || data.type === "evaluation") {
      // 兼容：level/comment/suggestion 或 text
      const parts = [];
      if (data.level) parts.push(data.level);
      if (data.comment) parts.push(data.comment);
      if (data.suggestion) parts.push("练习建议：" + data.suggestion);
      if (data.text) parts.push(data.text);

      setText(elAI, parts.length ? parts.join("  ") : "收到 AI 反馈。");
      return;
    }
  };

  socket.onclose = () => {
    console.log("👨‍🏫 teacher ws closed");
    if (elAI) elAI.textContent = "连接已断开，请刷新页面重连。";
  };

  socket.onerror = (err) => {
    console.error("teacher ws error", err);
    if (elAI) elAI.textContent = "网络异常，尝试刷新页面。";
  };
})();