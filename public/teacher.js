(function () {
  const wsUrl = location.origin.replace(/^http/, "ws");
  const socket = new WebSocket(wsUrl);

  const elStudents = document.getElementById("students");
  const elAccuracy = document.getElementById("accuracy");
  const elRoster = document.getElementById("roster"); // 可选

  function setText(el, v) {
    if (!el) return;
    el.textContent = String(v);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  function renderRoster(roster) {
    if (!elRoster) return;
    elRoster.innerHTML = "";

    if (!roster || roster.length === 0) {
      elRoster.innerHTML =
        `<div class="kpi"><p class="label">暂无学生</p><p style="margin:0;color:var(--muted)">等待学生进入…</p></div>`;
      return;
    }

    roster.forEach((s) => {
      const row = document.createElement("div");
      row.className = "kpi";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.gap = "12px";

      row.innerHTML = `
        <div>
          <div style="font-weight:850">${escapeHtml(s.name || "未命名")}</div>
          <div style="color:var(--muted);font-size:13px;">${escapeHtml(s.id || "")}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:850;font-size:18px;">${s.total} / ${s.correct}</div>
          <div style="color:var(--muted);font-size:13px;">完成 / 正确</div>
        </div>
      `;
      elRoster.appendChild(row);
    });
  }

  socket.onopen = () => {
    console.log("teacher ws connected");
    socket.send(JSON.stringify({ type: "teacher" }));
  };

  socket.onmessage = (msg) => {
    let data;
    try { data = JSON.parse(msg.data); } catch { return; }

    if (data.type === "stats") {
      if (data.students != null) setText(elStudents, data.students);
      if (data.accuracy != null) setText(elAccuracy, data.accuracy);
      if (data.roster) renderRoster(data.roster);
    }
  };

  socket.onerror = (e) => console.error("teacher ws error", e);
})();