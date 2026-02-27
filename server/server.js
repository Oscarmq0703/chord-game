const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const Redis = require("ioredis");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const { checkChord } = require("./chordEngine");
const { generateStudentFeedback } = require("./ai");

const app = express();
app.use(cors());
app.use(express.static("public"));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 🔴 改成你的 Redis
const redis = new Redis({
  host: process.env.REDIS_10.0.0.6,
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_Jxbz123987,
});
let rooms = {};

function generateQuestion() {
  const roots = ["C","D","E","F","G","A","B"];
  const types = ["maj7","m7","7","m7b5"];
  return {
    id: uuidv4(),
    root: roots[Math.floor(Math.random()*roots.length)],
    type: types[Math.floor(Math.random()*types.length)]
  };
}

app.get("/create-room", (req,res)=>{
  const roomId = uuidv4().slice(0,6);
  rooms[roomId] = {
    question: generateQuestion(),
    students:{}
  };
  res.json({roomId});
});

wss.on("connection",(ws)=>{
  ws.on("message",(msg)=>{
    const data = JSON.parse(msg);

    if(data.type==="join"){
      ws.roomId=data.roomId;
      ws.name=data.name;
      rooms[ws.roomId].students[ws.name]={
  	correct:0,
 	total:0,
  	wrong:{ maj7:0, m7:0, "7":0, m7b5:0 }
};
      ws.send(JSON.stringify({
        type:"question",
        question:rooms[ws.roomId].question
      }));
    }

    if(data.type==="answer"){
      const room=rooms[ws.roomId];
      const student=room.students[ws.name];

      student.total++;

      const correct = checkChord(
        data.notes,
        room.question.root,
        room.question.type
      );

      if(correct) student.correct++;
      if (!correct) {
        student.wrong[room.question.type]++;
}

      let feedback=null;
     if(student.total%10===0){
  const accuracy=Math.round(student.correct/student.total*100);

  // ⭐ 找最弱和弦
  const weakChord = Object.entries(student.wrong)
    .sort((a,b)=>b[1]-a[1])[0][0];

  feedback=generateStudentFeedback({
    accuracy,
    weakChord
  });
}

      room.question=generateQuestion();

      ws.send(JSON.stringify({
        type:"result",
        correct,
        stats:student,
        feedback,
        next:room.question
      }));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on", PORT);
});

// ===== Render 防休眠保活 =====
setInterval(() => {
  console.log("keep alive:", new Date().toLocaleTimeString());
}, 5 * 60 * 1000);