const ws=new WebSocket("ws://"+location.host);
const pianoDiv=document.getElementById("piano");
let selected=[];
let current;

const synth=new Tone.Synth().toDestination();

createPiano(pianoDiv,(note,index)=>{
selected.push(index);
synth.triggerAttackRelease("C4","8n");
});

ws.onopen=()=>{
const name=prompt("输入姓名");
const room=location.search.replace("?","");
ws.send(JSON.stringify({type:"join",roomId:room,name}));
};

ws.onmessage=(e)=>{
const msg=JSON.parse(e.data);
if(msg.type==="question"){
current=msg.question;
document.getElementById("title").innerText=
current.root+current.type;
}
if(msg.type==="result"){
document.getElementById("feedback").innerText=
msg.feedback||"";
current=msg.next;
selected=[];
document.getElementById("title").innerText=
current.root+current.type;
}
};

function submit(){
ws.send(JSON.stringify({type:"answer",notes:selected}));
}