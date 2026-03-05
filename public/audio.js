// public/audio.js (ASCII only)
// Primary: Tone.Sampler (Salamander)
// Fallback: Tone.Synth (always works)
// Writes status to #debugBar if exists.

(function(){
  var sampler = null;
  var synth = null;

  var audioReady = false;
  var audioInitPromise = null;

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

  function initFallbackSynth(){
    if(!hasTone()) return;
    if(synth) return;
    try{
      synth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.002, decay: 0.08, sustain: 0.2, release: 0.18 }
      }).toDestination();
      setDebug("debug: audio fallback synth ready (no samples)");
    }catch(e){
      console.log("fallback synth init failed", e);
    }
  }

  function ensureAudioReady(){
    if(!hasTone()){
      setDebug("debug: Tone.js not loaded (no audio)");
      return Promise.resolve(false);
    }
    if(audioReady) return Promise.resolve(true);
    if(audioInitPromise) return audioInitPromise;

    audioInitPromise = (async function(){
      try{
        // Must run after user gesture (we call from click)
        await Tone.start();

        // Try sampler first
        sampler = new Tone.Sampler({
          urls: { A4: "A4.mp3", C4: "C4.mp3", D#4: "Ds4.mp3", F#4: "Fs4.mp3" },
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          release: 1
        }).toDestination();

        // Wait for loads; may fail on restricted networks
        await Tone.loaded();

        audioReady = true;
        setDebug("debug: sampled piano ready");
        return true;
      }catch(e){
        console.log("sampler init failed", e);
        // Fallback synth always works
        initFallbackSynth();
        audioReady = true;
        setDebug("debug: sampled piano blocked, using synth");
        return true;
      }
    })();

    return audioInitPromise;
  }

  function midiToFreq(note){
    // note like C#4, D4
    var m = note.match(/^([A-G])(#?)(\d)$/);
    if(!m) return 440;
    var letter = m[1];
    var sharp = m[2] === "#" ? 1 : 0;
    var oct = parseInt(m[3], 10);
    var base = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 }[letter];
    var midi = (oct + 1) * 12 + base + sharp; // C4=60
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  window.playNote = function(note){
    try{
      ensureAudioReady().then(function(ok){
        if(!ok) return;

        // Prefer sampler if available
        if(sampler){
          sampler.triggerAttackRelease(note, "8n");
          return;
        }

        // Fallback synth
        initFallbackSynth();
        if(synth){
          // Tone.Synth accepts frequency or note names; we pass frequency for safety
          synth.triggerAttackRelease(midiToFreq(note), 0.18);
        }
      });
    }catch(e){}
  };
})();