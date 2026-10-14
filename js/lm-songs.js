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
    alwaysUnlocked: false,
    concept: 'Left-hand chords: C (5-3-1) and G7 (5-2-1) under the melody.',
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
    world: 24,
    difficulty: 6,
    alwaysUnlocked: false,
    concept: 'Key of G: every F is F-sharp. Two eighth notes share one beat.',
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
    world: 22,
    difficulty: 4,
    alwaysUnlocked: false,
    concept: '6/8 time: count six eighth notes, felt as two big beats.',
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

  // ── World 20 · Hands Together in C ─────────────────────────────
  // C position: LH C3–G3 (5 on C), RH C4–G4 (1 on C).
  {
    id: 403,
    title: 'Lightly Row',
    composer: 'Traditional German (arr.)',
    world: 20,
    difficulty: 3,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'In Germany this song is called "Hänschen klein" — it tells of little Hans who leaves home to see the world, and comes back all grown up.',
    concept: 'Whole notes in the left hand: hold for 4 beats while the right hand keeps moving.',
    bpm: { turtle: 60, normal: 88, rabbit: 108, rocket: 126 },
    score: {
      time: '4/4', key: 'C',
      rh: 'G4q:5 E4q:3 E4h:3 | F4q:4 D4q:2 D4h:2 | C4q:1 D4q:2 E4q:3 F4q:4 | G4q:5 G4q:5 G4h:5 | ' +
          'G4q:5 E4q:3 E4h:3 | F4q:4 D4q:2 D4h:2 | C4q:1 E4q:3 G4q:5 G4q:5 | C4w:1 | ' +
          'D4q:2 D4q:2 D4q:2 D4q:2 | D4q:2 E4q:3 F4h:4 | E4q:3 E4q:3 E4q:3 E4q:3 | E4q:3 F4q:4 G4h:5 | ' +
          'G4q:5 E4q:3 E4h:3 | F4q:4 D4q:2 D4h:2 | C4q:1 E4q:3 G4q:5 G4q:5 | C4w:1',
      lh: 'C3w:5 | G3w:1 | C3w:5 | E3h:3 C3h:5 | ' +
          'C3w:5 | G3w:1 | C3w:5 | C3w:5 | ' +
          'G3w:1 | G3w:1 | C3w:5 | C3w:5 | ' +
          'C3w:5 | G3w:1 | C3h:5 G3h:1 | C3w:5',
    },
  },
  {
    id: 404,
    title: 'Merrily We Roll Along',
    composer: 'Traditional (arr.)',
    world: 20,
    difficulty: 3,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'This is the same tune as "Mary Had a Little Lamb". In 1877 Thomas Edison recited the words of "Mary" into his new phonograph — one of the first recordings ever made.',
    concept: 'Open fifth: play C and G together with left-hand fingers 5 and 1.',
    bpm: { turtle: 60, normal: 92, rabbit: 112, rocket: 132 },
    score: {
      time: '4/4', key: 'C',
      rh: 'E4q:3 D4q:2 C4q:1 D4q:2 | E4q:3 E4q:3 E4h:3 | D4q:2 D4q:2 D4h:2 | E4q:3 G4q:5 G4h:5 | ' +
          'E4q:3 D4q:2 C4q:1 D4q:2 | E4q:3 E4q:3 E4q:3 E4q:3 | D4q:2 D4q:2 E4q:3 D4q:2 | C4w:1',
      lh: 'C3+G3w:5,1 | C3+G3w:5,1 | B2+F3+G3w:5,2,1 | C3+G3w:5,1 | ' +
          'C3+G3w:5,1 | C3+G3w:5,1 | B2+F3+G3w:5,2,1 | C3+G3w:5,1',
    },
  },
  {
    id: 405,
    title: 'Au Clair de la Lune',
    composer: 'Traditional French (arr.)',
    world: 20,
    difficulty: 3,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'In 1860 a Frenchman recorded himself singing this song as a squiggly line on paper. Scientists turned the line back into sound in 2008 — the oldest recording of a human voice ever found.',
    concept: 'The left hand walks between C and G: watch for the change in the middle of a bar.',
    bpm: { turtle: 56, normal: 84, rabbit: 104, rocket: 120 },
    score: {
      time: '4/4', key: 'C',
      rh: 'C4q:1 C4q:1 C4q:1 D4q:2 | E4h:3 D4h:2 | C4q:1 E4q:3 D4q:2 D4q:2 | C4w:1 | ' +
          'C4q:1 C4q:1 C4q:1 D4q:2 | E4h:3 D4h:2 | C4q:1 E4q:3 D4q:2 D4q:2 | C4w:1',
      lh: 'C3w:5 | C3h:5 G3h:1 | C3h:5 G3h:1 | C3w:5 | ' +
          'C3w:5 | C3h:5 G3h:1 | C3h:5 G3h:1 | C3+E3+G3w:5,3,1',
    },
  },
  {
    id: 406,
    title: 'Jingle Bells',
    composer: 'James Lord Pierpont (arr.)',
    world: 20,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Jingle Bells was published in 1857 and never mentions Christmas. In 1965 two astronauts played it in space on a tiny harmonica and some sleigh bells — the first song ever played in space.',
    concept: 'Three chords: C (5-3-1), F (5-2-1) and G7 (5-2-1). Your left hand barely moves!',
    bpm: { turtle: 60, normal: 96, rabbit: 116, rocket: 136 },
    score: {
      time: '4/4', key: 'C',
      rh: 'E4q:3 E4q:3 E4h:3 | E4q:3 E4q:3 E4h:3 | E4q:3 G4q:5 C4q.:1 D4e:2 | E4w:3 | ' +
          'F4q:4 F4q:4 F4q.:4 F4e:4 | F4q:4 E4q:3 E4q:3 E4e:3 E4e:3 | E4q:3 D4q:2 D4q:2 E4q:3 | D4h:2 G4h:5 | ' +
          'E4q:3 E4q:3 E4h:3 | E4q:3 E4q:3 E4h:3 | E4q:3 G4q:5 C4q.:1 D4e:2 | E4w:3 | ' +
          'F4q:4 F4q:4 F4q.:4 F4e:4 | F4q:4 E4q:3 E4q:3 E4e:3 E4e:3 | G4q:5 G4q:5 F4q:4 D4q:2 | C4w:1',
      lh: 'C3+E3+G3w:5,3,1 | C3+E3+G3w:5,3,1 | C3+E3+G3w:5,3,1 | C3+E3+G3w:5,3,1 | ' +
          'C3+F3+A3w:5,2,1 | C3+E3+G3w:5,3,1 | B2+F3+G3w:5,2,1 | B2+F3+G3w:5,2,1 | ' +
          'C3+E3+G3w:5,3,1 | C3+E3+G3w:5,3,1 | C3+E3+G3w:5,3,1 | C3+E3+G3w:5,3,1 | ' +
          'C3+F3+A3w:5,2,1 | C3+E3+G3w:5,3,1 | B2+F3+G3w:5,2,1 | C3+E3+G3w:5,3,1',
    },
  },
  {
    id: 407,
    title: 'London Bridge',
    composer: 'Traditional English (arr.)',
    world: 20,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'The real London Bridge was rebuilt many times. In 1968 an old one was sold to an American businessman, taken apart stone by stone, and rebuilt in Arizona!',
    concept: 'Dotted quarter + eighth: a "long-short" rhythm. Count "1 – & 2".',
    bpm: { turtle: 60, normal: 92, rabbit: 112, rocket: 132 },
    score: {
      time: '4/4', key: 'C',
      rh: 'G4q.:4 A4e:5 G4q:4 F4q:3 | E4q:2 F4q:3 G4h:4 | D4q:1 E4q:2 F4h:3 | E4q:2 F4q:3 G4h:4 | ' +
          'G4q.:4 A4e:5 G4q:4 F4q:3 | E4q:2 F4q:3 G4h:4 | D4h:1 G4h:4 | E4q:2 C4h.:1',
      lh: 'C3+G3w:5,1 | C3+G3w:5,1 | B2+F3+G3w:5,2,1 | C3+E3+G3w:5,3,1 | ' +
          'C3+G3w:5,1 | C3+G3w:5,1 | B2+F3+G3w:5,2,1 | C3+E3+G3w:5,3,1',
    },
  },
];

if (typeof module === 'object' && module.exports) module.exports = LM_SONGS;
