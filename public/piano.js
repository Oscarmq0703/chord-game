function createPiano(container,callback){
const notes=["C","D","E","F","G","A","B","C","D","E","F","G","A","B"];
const blackMap={C:"C#",D:"D#",F:"F#",G:"G#",A:"A#"};
notes.forEach((n,i)=>{
let w=document.createElement("div");
w.className="white";
w.onclick=()=>callback(n,i);
container.appendChild(w);
if(blackMap[n]){
let b=document.createElement("div");
b.className="black";
b.style.left=(i*60+40)+"px";
b.onclick=()=>callback(blackMap[n],i);
container.appendChild(b);
}
});
}