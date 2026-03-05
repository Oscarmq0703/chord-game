// public/audio.js (ASCII only)
// Priority:
// 1) Tone.js Sampler (Salamander)
// 2) Tone.js Synth fallback
// 3) Native WebAudio oscillator fallback (works without Tone)
// Writes status to #debugBar.

(function(){
  var sampler = null;
  var synth = null;

  var audioInitPromise = null;
  var audioReady = false;

  // Native WebAudio fallback
  var ac = null;

  function setDebug(msg){
    try{
      var el = document.getElementById("debugBar");
      if(el) el.textContent = msg;
    }catch(e){}
    try{ console.log("[AUDIO]", msg); }catch(e){}
  }

  function hasTone(){
    return typeof window.Tone !== "undefined";
  }

  function ensureNativeAudio(){
    try{
      if(!ac){
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if(!Ctx) return false;
        ac = new Ctx();
      }
      if(ac.state === "suspended"){
        ac.resume();
      }
      return true;
    }catch(e){
      return false;
    }
  }

  function nativeBeep(note){
    // quick oscillator beep, always available after user gesture
    if(!ensureNativeAudio()){
      setDebug("debug: no AudioContext available");
      return;
    }
    try{
      // basic note->freq (C4=261.63)
      var m = note.match(/^([A-G])(#?)(\d)$/);
      var base = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
      var letter = m ? m[1] : "A";
      var sharp = m && m[2] === "#" ? 1 : 0;
      var oct = m ? parseInt(m[3],10) : 4;
      var midi = (oct + 1) * 12 + base[letter] + sharp;
      var freq = 440 * Math.pow(2, (midi - 69) / 12);

      var o = ac.createOscillator();
      var g = ac.createGain();
      o.type = "triangle";
      o.frequency.value = freq;

      var now = ac.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      o.connect(g);
      g.connect(ac.destination);

      o.start(now);
      o.stop(now + 0.20);

      setDebug("debug: native audio ok (tone blocked or not ready)");
    }catch(e){
      setDebug("debug: native beep failed");
    }
  }

  function initToneFallbackSynth(){
    if(!hasTone()) return;
    if(synth) return;
    try{
      synth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.002, decay: 0.08, sustain: 0.2, release: 0.18 }
      }).toDestination();
      setDebug("debug: tone synth fallback ready");
    }catch(e){
      console.log("tone synth init failed", e);
    }
  }

  function ensureToneReady(){
    if(!hasTone()){
      setDebug("debug: Tone.js not loaded -> using native audio");
      return Promise.resolve(false);
    }
    if(audioReady) return Promise.resolve(true);
    if(audioInitPromise) return audioInitPromise;

    audioInitPromise = (async function(){
      try{
        // must be called after user gesture (we call from key click)
        await Tone.start();

        // Try sampled piano first
        sampler = new Tone.Sampler({
          urls: { A4: "A4.mp3", C4: "C4.mp3", D#4: "Ds4.mp3", F#4: "Fs4.mp3" },
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          release: 1
        }).toDestination();

        // Wait for sample loads (may fail on restricted networks)
        await Tone.loaded();

        audioReady = true;
        setDebug("debug: sampled piano ready");
        return true;
      }catch(e){
        console.log("sampler init failed", e);
        // Fallback to tone synth (still needs Tone.js, but no external samples)
        initToneFallbackSynth();
        audioReady = true;
        setDebug("debug: samples blocked -> tone synth fallback");
        return true;
      }
    })();

    return audioInitPromise;
  }

  // Exposed API used by student.html
  window.playNote = function(note){
    setDebug("debug: playNote(" + note + ") called");
    try{
      // Always attempt tone first; if tone missing -> native beep
      ensureToneReady().then(function(ok){
        if(!ok){
          nativeBeep(note);
          return;
        }

        // prefer sampler
        if(sampler){
          sampler.triggerAttackRelease(note, "8n");
          setDebug("debug: playing sampled piano");
          return;
        }

        // tone synth fallback
        initToneFallbackSynth();
        if(synth){
          synth.triggerAttackRelease(note, "8n");
          setDebug("debug: playing tone synth");
          return;
        }

        // last fallback
        nativeBeep(note);
      });
    }catch(e){
      nativeBeep(note);
    }
  };

  setDebug("debug: audio.js loaded, waiting for first key tap");
})();