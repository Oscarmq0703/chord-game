const socket = new WebSocket(
  location.origin.replace(/^http/, "ws")
);

socket.onopen = () => {
  socket.send(JSON.stringify({
    type: "teacher"
  }));
};

socket.onmessage = (msg) => {
  const data = JSON.parse(msg.data);

  if (data.type === "stats") {
    document.getElementById("students").innerText =
      data.students;

    document.getElementById("accuracy").innerText =
      data.accuracy;
  }
};