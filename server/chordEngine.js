const NOTE_MAP = {
  C: 0, "C#": 1, D: 2, "D#": 3,
  E: 4, F: 5, "F#": 6,
  G: 7, "G#": 8,
  A: 9, "A#": 10,
  B: 11
};

const CHORD_TYPES = {
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
  m7b5: [0, 3, 6, 10],
};

function normalize(notes) {
  return [...new Set(notes.map(n => n % 12))].sort((a, b) => a - b);
}

function checkChord(inputNotes, root, type) {
  const rootVal = NOTE_MAP[root];
  const template = CHORD_TYPES[type];
  const expected = normalize(template.map(i => (i + rootVal) % 12));
  const actual = normalize(inputNotes);
  return JSON.stringify(expected) === JSON.stringify(actual);
}

module.exports = { checkChord };