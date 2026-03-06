// public/audio.js (ASCII only) - guaranteed native beep
(function(){
  var ac = null;

  function setAudio(msg){
    try{
      var el = document.getElementById("audioBar");
      if(el) el.textContent = msg;
    }catch(e){}
    try{ console.log("[AUDIO]", msg); }catch(e){}
  }

  function ensureAC(){
    try{
      if(!ac){
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if(!Ctx) return false;
        ac = new Ctx();
      }
      if(ac.state === "suspended") ac.resume();
      return true;
    }catch(e){
      return false;
    }
  }

  function noteToFreq(note){
    var m = note.match(/^([A-G])(#?)(\d)$/);
    if(!m) return 440;
    var base = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
    var letter = m[1];
    var sharp = m[2] === "#" ? 1 : 0;
    var oct = parseInt(m[3], 10);
    var midi = (oct + 1) * 12 + base[letter] + sharp;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  window.playNote = function(note){
    setAudio("audio: playNote called " + note);

    if(!ensureAC()){
      setAudio("audio: AudioContext not available");
      return;
    }

    try{
      var o = ac.createOscillator();
      var g = ac.createGain();
      o.type = "triangle";
      o.frequency.value = noteToFreq(note);

      var now = ac.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      o.connect(g);
      g.connect(ac.destination);

      o.start(now);
      o.stop(now + 0.20);

      setAudio("audio: native beep OK");
    }catch(e){
      setAudio("audio: native beep FAILED");
    }
  };

  setAudio("audio: audio.js loaded OK, playNote=function");
})();