(function () {
  const wsUrl = location.origin.replace(/^http/, "ws");
  const socket = new WebSocket(wsUrl);

  const elStudents = document.getElementById("students");
  const elAccuracy = document.getElementById("accuracy");
  const elRoster = document.getElementById("roster");

  function setText(el, text) {
    if (!el) return;
    el.textContent = String(text);
  }

  function renderRoster(roster) {
    if (!elRoster) return;
    elRoster.innerHTML = "";

    if (!roster || roster.length === 0) {
      elRoster.innerHTML =
        `<div class="kpi"><p class="label">暂无学生</p><p style="margin:0;color:var(--muted)">等待学生扫码进入…</p></div>`;
      return;
    }

    roster.forEach((s) => {
      const row = document.createElement("div");
      row.className = "kpi";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      row.style.gap = "12px";

      const left = document.createElement("div");
      left.innerHTML = `<div style="font-weight:850">${escapeHtml(s.name || "未命名")}</div>
                        <div style="color:var(--muted);font-size:13px;">ID: ${escapeHtml(s.id)}</div>`;

      const right = document.createElement("div");
      right.style.textAlign = "right";
      right.innerHTML = `<div style="font-weight:850;font-size:18px;">${s.total} / ${s.correct}</div>
                         <div style="color:var(--muted);font-size:13px;">完成 / 正确</div>`;

      row.appendChild(left);
      row.appendChild(right);
      elRoster.appendChild(row);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[m]));
  }

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: "teacher" }));
  };

  socket.onmessage = (msg) => {
    let data;
    try {
      data = JSON.parse(msg.data);
    } catch {
      return;
    }

    if (data.type === "stats") {
      if (data.students != null) setText(elStudents, data.students);
      if (data.accuracy != null) setText(elAccuracy, data.accuracy);
      renderRoster(data.roster || []);
    }
  };
})();