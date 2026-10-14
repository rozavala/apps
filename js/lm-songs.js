/* ================================================================
   LITTLE MAESTRO — Score-format songs (lm-songs.js)

   Songs written as bars for both hands. See js/lm-score.js for the
   notation; `node tools/check-songs.js` checks every bar adds up.

   Melodies are traditional or public domain. Left-hand parts are
   our own arrangements, written for the level of the world they
   sit in. bpm values are quarter-note beats per minute.
   ================================================================ */

var LM_SONGS = [
  {
    id: 400,
    title: 'Ode to Joy (Hands Together)',
    composer: 'Ludwig van Beethoven (arr.)',
    world: 20,
    difficulty: 3,
    alwaysUnlocked: true,
    isBonus: false,
    funFact: 'Beethoven wrote this tune for his Ninth Symphony when he could no longer hear. Today it is the anthem of Europe.',
    bpm: { turtle: 56, normal: 80, rabbit: 100, rocket: 120 },
    score: {
      time: '4/4', key: 'C',
      rh: 'E4q:3 E4q:3 F4q:4 G4q:5 | G4q:5 F4q:4 E4q:3 D4q:2 | C4q:1 C4q:1 D4q:2 E4q:3 | E4q.:3 D4e:2 D4h:2 | ' +
          'E4q:3 E4q:3 F4q:4 G4q:5 | G4q:5 F4q:4 E4q:3 D4q:2 | C4q:1 C4q:1 D4q:2 E4q:3 | D4q.:2 C4e:1 C4h:1',
      lh: 'C3+E3+G3w:5,3,1 | B2+F3+G3w:5,2,1 | C3+E3+G3w:5,3,1 | B2+F3+G3w:5,2,1 | ' +
          'C3+E3+G3w:5,3,1 | B2+F3+G3w:5,2,1 | C3+E3+G3w:5,3,1 | B2+F3+G3h:5,2,1 C3+E3+G3h:5,3,1',
    },
  },
  {
    id: 401,
    title: 'Minuet in G (Theme)',
    composer: 'Christian Petzold (arr.)',
    world: 20,
    difficulty: 4,
    alwaysUnlocked: true,
    isBonus: false,
    funFact: 'For years everyone thought Bach wrote this minuet. It was really his friend Christian Petzold — Bach copied it into a music book for his wife, Anna Magdalena.',
    bpm: { turtle: 60, normal: 84, rabbit: 104, rocket: 120 },
    score: {
      time: '3/4', key: 'G',
      rh: 'D5q:5 G4e:1 A4e:2 B4e:3 C5e:4 | D5q:5 G4q:1 G4q:1 | E5q:5 C5e:2 D5e:3 E5e:4 F#5e:5 | G5q:5 G4q:1 G4q:1 | ' +
          'C5q:4 D5e:5 C5e:4 B4e:3 A4e:2 | B4q:3 C5e:4 B4e:3 A4e:2 G4e:1 | F#4q:2 G4e:1 A4e:2 B4e:3 G4e:1 | A4h.:2',
      lh: 'G3+B3h:5,3 A3q:2 | B3h.:1 | C4h.:1 | B3h.:1 | ' +
          'A3h.:2 | G3h.:3 | D4q:1 B3q:3 G3q:5 | D4q:1 D3e:5 C4e:1 B3e:2 A3e:3',
    },
  },
  {
    id: 402,
    title: 'Row, Row, Row Your Boat',
    composer: 'Traditional (arr.)',
    world: 20,
    difficulty: 3,
    alwaysUnlocked: true,
    isBonus: false,
    funFact: 'This song is a round: one person starts, and a friend starts again from the beginning when the first one reaches "gently down the stream".',
    bpm: { turtle: 60, normal: 84, rabbit: 104, rocket: 120 },
    score: {
      time: '6/8', key: 'C',
      rh: 'C4q.:1 C4q.:1 | C4q:1 D4e:2 E4q.:3 | E4q:3 D4e:2 E4q:3 F4e:4 | G4h.:5 | ' +
          'C5e C5e C5e G4e G4e G4e | E4e E4e E4e C4e:1 C4e C4e | G4q:5 F4e:4 E4q:3 D4e:2 | C4h.:1',
      lh: 'C3+G3h.:5,1 | C3+G3h.:5,1 | C3+G3h.:5,1 | C3+G3h.:5,1 | ' +
          'C3+G3h.:5,1 | C3+G3h.:5,1 | G2+G3q.:5,1 B2+G3q.:4,1 | C3+G3h.:5,1',
    },
  },
];

if (typeof module === 'object' && module.exports) module.exports = LM_SONGS;
