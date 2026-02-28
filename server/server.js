// ===== 基础依赖 =====
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");

// ===== 创建应用 =====
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ===== 端口（Render 必须用这个）=====
const PORT = process.env.PORT || 3000;

// ===== Redis 连接（⭐唯一正确姿势）=====
let redis;

if (process.env.REDIS_URL) {
  console.log("✅ Using REDIS_URL");
  redis = new Redis(process.env.REDIS_URL);
} else {
  console.log("⚠️ REDIS_URL not found, using local fallback");
  redis = new Redis({
    host: "127.0.0.1",
    port: 6379,
  });
}

// ===== Redis 连接日志 =====
redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

// ===== 静态资源 =====
app.use(express.static("public"));

// ===== 健康检查（Render 用）=====
app.get("/health", (req, res) => {
  res.send("OK");
});

// ===== WebSocket =====
io.on("connection", (socket) => {
  console.log("👤 Student connected:", socket.id);

  socket.on("answer", async (data) => {
    try {
      await redis.incr("answer_count");
      io.emit("stats_update");
    } catch (e) {
      console.error("Redis write error:", e.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("👋 Student disconnected:", socket.id);
  });
});

// ===== 启动服务器 =====
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});