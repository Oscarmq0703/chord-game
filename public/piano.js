let sampler;
let audioStarted = false;

async function initPiano() {
  if (audioStarted) return;

  await Tone.start();

  sampler = new Tone.Sampler({
    urls: {
      A4: "A4.mp3",
      C4: "C4.mp3",
      D#4: "Ds4.mp3",
      F#4: "Fs4.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    release: 1,
  }).toDestination();

  audioStarted = true;
}

const NOTES = [
  "C4","C#4","D4","D#4","E4","F4",
  "F#4","G4","G#4","A4","A#4","B4",
  "C5","C#5","D5","D#5","E5","F5",
  "F#5","G5","G#5","A5","A#5","B5"
];

function buildPiano(containerId) {
  const piano = document.getElementById(containerId);
  piano.innerHTML = "";
  piano.className = "piano";

  let whiteIndex = 0;

  NOTES.forEach((note) => {
    const isBlack = note.includes("#");

    const key = document.createElement("div");
    key.dataset.note = note;

    if (isBlack) {
      key.className = "black-key";
      key.style.left = (whiteIndex * 60 - 20) + "px";
    } else {
      key.className = "white-key";
      whiteIndex++;
    }

    key.addEventListener("click", async () => {
      await initPiano();
      sampler.triggerAttackRelease(note, "8n");

      document.dispatchEvent(
        new CustomEvent("notePlayed", { detail: note })
      );
    });

    piano.appendChild(key);
  });
}

window.buildPiano = buildPiano;