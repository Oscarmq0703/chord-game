const notes = [
"C","C#","D","D#","E","F","F#","G","G#","A","A#","B",
"C","C#","D","D#","E","F","F#","G","G#","A","A#","B"
];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playFreq(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1);
}

const freqMap = {
C:261.63,"C#":277.18,D:293.66,"D#":311.13,E:329.63,
F:349.23,"F#":369.99,G:392.0,"G#":415.3,A:440.0,"A#":466.16,B:493.88
};

const kb = document.getElementById("keyboard");

notes.forEach(n=>{
  const key=document.createElement("div");
  key.className="key"+(n.includes("#")?" black":"");
  key.onclick=()=>{
    playFreq(freqMap[n.replace("#","#")]);
    window.checkAnswer(n.replace("#","b"));
  };
  kb.appendChild(key);
});