// ===============================
// 🎹 课堂神器 · 生产级服务端
// Render / Upstash / 腾讯云 通用
// ===============================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");

// ===============================
// ✅ 基础服务
// ===============================
const app = express();
const server = http.createServer(app);

// ⭐ Render 必须信任代理
app.set("trust proxy", 1);

// ===============================
// ✅ 静态页面（解决 Cannot GET /）
// ===============================
const path = require("path");

app.use(express.static(path.join(__dirname, "../public")));

// ⭐⭐⭐ 首页兜底（强烈推荐加）
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// 健康检查（Render 很喜欢）
app.get("/health", (req, res) => {
  res.send("OK");
});

// ===============================
// ✅ Redis（🔥生产级配置）
// ===============================
let redis = null;

if (process.env.REDIS_URL) {
  console.log("🔌 Connecting Redis...");

  redis = new Redis(process.env.REDIS_URL, {
    // ⭐⭐⭐ 关键：Upstash 必备
    enableReadyCheck: false,

    // ⭐ Render 防卡死
    maxRetriesPerRequest: null,

    // ⭐ 自动重连（生产级）
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      console.log("🔁 Redis retry in", delay);
      return delay;
    },

    reconnectOnError(err) {
      console.log("🔄 Redis reconnectOnError:", err.message);
      return true;
    },

    lazyConnect: true,
  });

  redis.connect().catch(() => {});

  redis.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redis.on("ready", () => {
    console.log("🚀 Redis ready");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  redis.on("close", () => {
    console.log("⚠️ Redis closed");
  });

  redis.on("reconnecting", () => {
    console.log("🔁 Redis reconnecting...");
  });
} else {
  console.log("⚠️ No REDIS_URL — running in memory mode");
}

// ===============================
// ✅ Socket.io（生产级配置）
// ===============================
const io = new Server(server, {
  cors: {
    origin: "*",
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
});

// ===============================
// 🎮 游戏内存（Redis 不可用时兜底）
// ===============================
const roomStats = new Map();

// ===============================
// 🎯 AI 离线评价函数（增强版）
// ===============================
function generateEvaluation(score, total) {
  const rate = score / total;

  let level, comment, suggestion;

  if (rate >= 0.9) {
    level = "🌟 和声大师";
    comment = "七和弦识别非常熟练，听觉与理论结合很好。";
    suggestion =
      "尝试加入转位七和弦、变化属七和弦（♭9、♯11）训练，提高即兴应用能力。";
  } else if (rate >= 0.75) {
    level = "👍 稳定进阶者";
    comment = "基础较扎实，偶有判断犹豫。";
    suggestion =
      "重点慢练半减七和弦与属七和弦的音程结构，每天进行键盘定位训练。";
  } else if (rate >= 0.6) {
    level = "📈 正在进步";
    comment = "已具备基本概念，但稳定度不足。";
    suggestion =
      "建议先分解练习：根音 → 三音 → 五音 → 七音，建立清晰和声音响。";
  } else {
    level = "🧱 基础巩固阶段";
    comment = "对七和弦结构还不够熟悉。";
    suggestion =
      "先强化三和弦，再过渡到七和弦；可配合慢速听辨训练。";
  }

  return {
    level,
    comment,
    suggestion,
  };
}

// ===============================
// 🔌 WebSocket 逻辑
// ===============================
io.on("connection", (socket) => {
  console.log("👤 Student connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);

    if (!roomStats.has(roomId)) {
      roomStats.set(roomId, {
        total: 0,
        correct: 0,
      });
    }
  });

  socket.on("answer", ({ roomId, correct }) => {
    const stats = roomStats.get(roomId);
    if (!stats) return;

    stats.total++;
    if (correct) stats.correct++;

    io.to(roomId).emit("stats", stats);

    // ⭐ 每 10 题 AI 反馈
    if (stats.total % 10 === 0) {
      const evaluation = generateEvaluation(
        stats.correct,
        stats.total
      );

      io.to(roomId).emit("evaluation", {
        ...evaluation,
        score: stats.correct,
        total: stats.total,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("👋 Student disconnected:", socket.id);
  });
});

// ===============================
// 🚀 启动服务器（Render 必须）
// ===============================
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port", PORT);
});