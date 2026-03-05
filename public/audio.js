// public/audio.js (ASCII only)
// Sampled piano via Tone.js Salamander. Does not block UI.

(function(){
  var sampler = null;
  var audioReady = false;
  var audioInitPromise = null;

  function hasTone(){
    return typeof window.Tone !== "undefined";
  }

  function ensureAudioReady(){
    if(!hasTone()) return Promise.resolve(false);
    if(audioReady) return Promise.resolve(true);
    if(audioInitPromise) return audioInitPromise;

    audioInitPromise = (async function(){
      try{
        await Tone.start();

        sampler = new Tone.Sampler({
          urls: { A4: "A4.mp3", C4: "C4.mp3", D#4: "Ds4.mp3", F#4: "Fs4.mp3" },
          baseUrl: "https://tonejs.github.io/audio/salamander/",
          release: 1
        }).toDestination();

        await Tone.loaded();
        audioReady = true;
        return true;
      }catch(e){
        console.log("audio init failed", e);
        return false;
      }
    })();

    return audioInitPromise;
  }

  window.playNote = function(note){
    try{
      ensureAudioReady().then(function(ok){
        if(!ok || !sampler) return;
        sampler.triggerAttackRelease(note, "8n");
      });
    }catch(e){}
  };
})();