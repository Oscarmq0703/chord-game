// public/audio.js (ASCII only)
// Priority:
// 1) Tone.Sampler (Salamander samples)
// 2) Tone.Synth fallback (no external samples)
// 3) Native WebAudio beep fallback (guaranteed)
// Writes status to #audioBar only.

(function(){
  // ---- UI status ----
  function setAudio(msg){
    try{
      var el = document.getElementById("audioBar");
      if(el) el.textContent = msg;
    }catch(e){}
    try{ console.log("[AUDIO]", msg); }catch(e){}
  }

  // ---- Native WebAudio fallback ----
  var ac = null;

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

  function nativeBeep(note){
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
  }

  // ---- Tone.js layer ----
  function hasTone(){
    return typeof window.Tone !== "undefined";
  }

  var sampler = null;
  var synth = null;
  var toneInitPromise = null;
  var toneReady = false;

  function initToneSynth(){
    if(!hasTone()) return;
    if(synth) return;
    try{
      synth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.002, decay: 0.08, sustain: 0.2, release: 0.18 }
      }).toDestination();
    }catch(e){}
  }

  function ensureToneReady(){
    if(!hasTone()){
      setAudio("audio: Tone.js missing -> native beep");
      return Promise.resolve(false);
    }
    if(toneReady) return Promise.resolve(true);
    if(toneInitPromise) return toneInitPromise;

    toneInitPromise = (async function(){
      try{
        // must run after user gesture; playNote calls this from key click
        await Tone.start();

        // Try sampled piano first (external samples)
        sampler = new Tone.Sampler({
          urls: { A4: "A4.mp3", C4: "C4.mp3", D#4: "Ds4.mp3", F#4: "Fs4.mp3" },
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          release: 1
        }).toDestination();

        // Wait until samples loaded (may fail on restricted networks)
        await Tone.loaded();

        toneReady = true;
        setAudio("audio: sampled piano ready");
        return true;
      }catch(e){
        // If samples blocked, use Tone synth (no external loads)
        initToneSynth();
        toneReady = true;
        setAudio("audio: samples blocked -> tone synth");
        return true;
      }
    })();

    return toneInitPromise;
  }

  // ---- public API ----
  window.playNote = function(note){
    // Always show the tap arrived
    setAudio("audio: key " + note);

    // 1) Try Tone layer
    ensureToneReady().then(function(ok){
      if(!ok){
        // Tone missing, native beep
        nativeBeep(note);
        return;
      }

      // Prefer sampler if available
      if(sampler){
        try{
          sampler.triggerAttackRelease(note, "8n");
          setAudio("audio: playing sampled piano");
          return;
        }catch(e){}
      }

      // Tone synth fallback
      if(!synth) initToneSynth();
      if(synth){
        try{
          synth.triggerAttackRelease(note, "8n");
          setAudio("audio: playing tone synth");
          return;
        }catch(e){}
      }

      // Last fallback
      nativeBeep(note);
    }).catch(function(){
      nativeBeep(note);
    });
  };

  setAudio("audio: audio.js loaded (tap a key)");
})();