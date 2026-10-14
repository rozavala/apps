/* ================================================================
   LITTLE MAESTRO — Score-format songs (lm-songs.js)

   Songs written as bars for both hands. See js/lm-score.js for the
   notation; `node tools/check-songs.js` checks every bar adds up.

   Melodies are traditional or public domain. Left-hand parts are
   our own arrangements, written for the level of the world they
   sit in. bpm values are quarter-note beats per minute.
   ================================================================ */

var LM_SONGS = [

  // ── Level 1 · World 1 · Hands Together in C ───────────────────────
  {
    id: 400,
    title: 'Ode to Joy (Hands Together)',
    composer: 'Ludwig van Beethoven (arr.)',
    world: 20,
    difficulty: 3,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Beethoven wrote this tune for his Ninth Symphony when he could no longer hear. Today it is the anthem of Europe.',
    concept: 'Left-hand chords: C (5-3-1) and G7 (5-2-1) under the melody.',
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

  // ── Level 1 · World 2 · Middle C, G Position & 3/4 ────────────────
  {
    id: 410,
    title: 'Au Clair de la Lune',
    composer: 'Traditional French (arr.)',
    world: 21,
    difficulty: 3,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'This French song is so old that a recording of it made in 1860 is one of the oldest recordings of a human voice ever found.',
    concept: 'G position — both hands sit on G A B C D, and the right hand moves down to D position in the middle part.',
    bpm: { turtle: 60, normal: 92, rabbit: 112, rocket: 126 },
    score: {
      time: '4/4', key: 'G',
      rh: 'G4q:1 G4q G4q A4q:2 | B4h:3 A4h:2 | G4q:1 B4q:3 A4q:2 A4q | G4w:1 | ' +
          'G4q:1 G4q G4q A4q:2 | B4h:3 A4h:2 | G4q:1 B4q:3 A4q:2 A4q | G4w:1 | ' +
          'A4q:5 A4q A4q A4q | E4h:2 E4h | A4q:5 G4q:4 F#4q:3 E4q:2 | D4w:1 | ' +
          'G4q:1 G4q G4q A4q:2 | B4h:3 A4h:2 | G4q:1 B4q:3 A4q:2 A4q | G4w:1',
      lh: 'G2+D3w:5,1 | G2+B2+D3h:5,3,1 F#2+C3+D3h:5,2,1 | G2+D3h:5,1 F#2+C3+D3h:5,2,1 | G2+B2+D3w:5,3,1 | ' +
          'G2+D3w:5,1 | G2+B2+D3h:5,3,1 F#2+C3+D3h:5,2,1 | G2+D3h:5,1 F#2+C3+D3h:5,2,1 | G2+B2+D3w:5,3,1 | ' +
          'D3w:1 | A2w:4 | D3h:1 A2h:4 | D3w:1 | ' +
          'G2+D3w:5,1 | G2+B2+D3h:5,3,1 F#2+C3+D3h:5,2,1 | G2+D3h:5,1 F#2+C3+D3h:5,2,1 | G2+B2+D3w:5,3,1',
    },
  },
  {
    id: 411,
    title: 'Amazing Grace',
    composer: 'Traditional (arr.)',
    world: 21,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'John Newton wrote these words in 1779. The tune we sing them to, called "New Britain", was joined to the words in 1835.',
    concept: 'A pickup — the song starts on beat 3, before the first full bar of 3/4.',
    bpm: { turtle: 50, normal: 72, rabbit: 92, rocket: 108 },
    score: {
      time: '3/4', key: 'G', pickup: 1,
      rh: 'D4q:1 | G4h:3 B4e:5 G4e:3 | B4h:5 A4q:4 | G4h:3 E4q:2 | ' +
          'D4h:1 D4q:1 | G4h:3 B4e:5 G4e:3 | B4h:5 A4q:4 | D5h.~:5 | ' +
          'D5h B4q:3 | D5h:5 B4e:3 G4e:1 | B4h:3 A4q:2 | G4h:3 E4q:2 | ' +
          'D4h:1 D4q:1 | G4h:3 B4e:5 G4e:3 | B4h:5 A4q:4 | G4h:3',
      lh: 'Rq | G2+D3h.:5,1 | G2+D3h.:5,1 | G2+C3+E3h.:5,2,1 | ' +
          'G2+D3h.:5,1 | G2+D3h.:5,1 | G2+D3h.:5,1 | F#2+C3+D3h.:5,2,1 | ' +
          'F#2+C3+D3h:5,2,1 Rq | G2+D3h.:5,1 | G2+D3h.:5,1 | G2+C3+E3h.:5,2,1 | ' +
          'G2+D3h.:5,1 | G2+D3h.:5,1 | G2+D3h:5,1 F#2+C3+D3q:5,2,1 | G2+B2+D3h:5,3,1',
    },
  },
  {
    id: 412,
    title: 'Alouette',
    composer: 'Traditional French-Canadian (arr.)',
    world: 21,
    difficulty: 3,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: '"Alouette" means skylark. In each verse the singers name another part of the bird — its head, its beak, its eyes — and then sing all the parts again.',
    concept: 'Hands take turns — the left-hand thumb plays the low D notes of the melody. And 2/4 time: two beats in every bar.',
    bpm: { turtle: 70, normal: 96, rabbit: 116, rocket: 132 },
    score: {
      time: '2/4', key: 'G',
      rh: 'G4q.:1 A4e:2 | B4q:3 B4q | A4q:2 G4q:1 | A4q:2 B4q:3 | ' +
          'G4q:1 Rq | G4q.:1 A4e:2 | B4q:3 B4q | A4q:2 G4q:1 | ' +
          'A4q:2 B4q:3 | G4h:1',
      lh: 'G3+D4h:5,1 | G3+D4h:5,1 | A3+C4h:4,2 | G3+B3h:5,3 | ' +
          'Rq D4q:1 | G3+D4h:5,1 | G3+D4h:5,1 | A3+C4h:4,2 | ' +
          'G3+B3h:5,3 | G3+D4h:5,1',
    },
  },
  {
    id: 413,
    title: 'Happy Birthday to You',
    composer: 'Patty & Mildred J. Hill (arr.)',
    world: 21,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'This tune began in 1893 as "Good Morning to All", a song two sisters wrote for the children in their kindergarten class.',
    concept: '"Hap-py" is a dotted eighth and a sixteenth — a long-short pair squeezed into one beat.',
    bpm: { turtle: 66, normal: 96, rabbit: 116, rocket: 132 },
    score: {
      time: '3/4', key: 'G', pickup: 1,
      rh: 'D4e.:1 D4s:1 | E4q:2 D4q:1 G4q:4 | F#4h:3 D4e.:1 D4s:1 | E4q:2 D4q:1 A4q:5 | ' +
          'G4h:4 D4e.:1 D4s:1 | D5q:5 B4q:3 G4q:1 | F#4q:2 E4q:1 C5e.:5 C5s:5 | B4q:4 G4q:2 A4q:3 | ' +
          'G4h:2',
      lh: 'Rq | G2+D3h.:5,1 | F#2+C3+D3h.:5,2,1 | F#2+C3+D3h.:5,2,1 | ' +
          'G2+B2+D3h.:5,3,1 | G2+B2+D3h.:5,3,1 | F#2+C3+D3q:5,2,1 G2+C3+E3h:5,2,1 | G2+B2+D3h:5,3,1 F#2+C3+D3q:5,2,1 | ' +
          'G2+B2+D3h:5,3,1',
    },
  },
  {
    id: 414,
    title: 'Old MacDonald Had a Farm',
    composer: 'Traditional (arr.)',
    world: 21,
    difficulty: 3,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Every verse adds a new animal and a new sound. Singers around the world change the animals — and the sounds — to match their own language.',
    concept: 'Middle C position — both thumbs share middle C, and the low notes of the tune belong to the left hand.',
    bpm: { turtle: 66, normal: 96, rabbit: 116, rocket: 132 },
    score: {
      time: '4/4', key: 'C',
      rh: 'C4q:1 C4q C4q Rq | Rw | E4q:3 E4q D4q:2 D4q | C4h.:1 Rq | ' +
          'C4q:1 C4q C4q Rq | Rw | E4q:3 E4q D4q:2 D4q | C4w:1',
      lh: 'Rh. G3q:4 | A3q:3 A3q G3h:4 | G3w:4 | Rh. G3q:4 | ' +
          'Rh. G3q:4 | A3q:3 A3q G3h:4 | G3w:4 | Rw',
    },
  },
  {
    id: 415,
    title: 'Michael, Row the Boat Ashore',
    composer: 'Traditional Spiritual (arr.)',
    world: 21,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'This song was sung by freed people on the Sea Islands of South Carolina during the 1860s, and was first written down in 1867.',
    concept: 'A tie — the curved line joins two notes of the same pitch. Play once and hold for both.',
    bpm: { turtle: 60, normal: 88, rabbit: 108, rocket: 126 },
    score: {
      time: '4/4', key: 'C', pickup: 2,
      rh: 'C4q:1 E4q:2 | G4q.:4 E4e:2 G4q:4 A4q:5 | G4h:4 E4q:2 G4q:4 | A4w:5 | ' +
          'G4h:4 E4q:3 G4q:5 | G4q.:5 E4e:3 F4q:4 E4q:3 | D4h:2 C4q:1 D4q:2 | E4h:3 D4h:2 | ' +
          'C4w~:1 | C4h',
      lh: 'Rh | C3+G3w:5,1 | C3+E3+G3w:5,3,1 | C3+F3+A3w:5,2,1 | ' +
          'C3+E3+G3w:5,3,1 | C3+E3+G3h:5,3,1 C3+F3+A3h:5,2,1 | B2+F3+G3h:5,2,1 C3+E3+G3h:5,3,1 | C3+E3+G3h:5,3,1 B2+F3+G3h:5,2,1 | ' +
          'C3+E3+G3w~:5,3,1 | C3+E3+G3h',
    },
  },

  {
    id: 421,
    title: 'Position Hop',
    composer: 'Little Maestro original',
    world: 21,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Pianists move their hands all the time. The trick is to move during a long note or a rest, and to look ahead to where the thumb lands next.',
    concept: 'Two right-hand positions: C position, then the thumb hops up to G in bar 5, and back home to C in bar 9.',
    bpm: { turtle: 56, normal: 80, rabbit: 100, rocket: 116 },
    score: {
      time: '4/4', key: 'C',
      rh: 'C4q:1 D4q:2 E4q:3 F4q:4 | G4h:5 E4h:3 | F4q:4 E4q:3 D4q:2 E4q:3 | C4w:1 | ' +
          'G4q:1 A4q:2 B4q:3 C5q:4 | D5h:5 B4h:3 | C5q:4 B4q:3 A4q:2 B4q:3 | G4w:1 | ' +
          'E4q:3 F4q:4 G4h:5 | F4q:4 E4q:3 D4h:2 | E4q:3 D4q:2 C4q:1 D4q:2 | C4w:1',
      lh: 'C3w:5 | C3+G3w:5,1 | B2+F3+G3w:5,2,1 | C3+E3+G3w:5,3,1 | ' +
          'G3w:1 | G3h:1 D3h:4 | E3h:3 D3h:4 | G3w:1 | ' +
          'C3+E3+G3w:5,3,1 | B2+F3+G3w:5,2,1 | C3h:5 G3h:1 | C3+E3+G3w:5,3,1',
    },
  },
  // ── Level 1 · World 3 · Eighth Notes & 6/8 ────────────────────────
  {
    id: 402,
    title: 'Row, Row, Row Your Boat',
    composer: 'Traditional (arr.)',
    world: 22,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'This song is a round: one person starts, and a friend starts again from the beginning when the first one reaches "gently down the stream".',
    concept: '6/8 time: count six eighth notes, felt as two big beats.',
    bpm: { turtle: 60, normal: 84, rabbit: 104, rocket: 120 },
    score: {
      time: '6/8', key: 'C',
      rh: 'C4q.:1 C4q.:1 | C4q:1 D4e:2 E4q.:3 | E4q:3 D4e:2 E4q:3 F4e:4 | G4h.:5 | ' +
          'C5e C5e C5e G4e G4e G4e | E4e E4e E4e C4e:1 C4e C4e | G4q:5 F4e:4 E4q:3 D4e:2 | C4h.:1',
      lh: 'C3+G3h.:5,1 | C3+G3h.:5,1 | C3+G3h.:5,1 | C3+G3h.:5,1 | ' +
          'C3+G3h.:5,1 | C3+G3h.:5,1 | G2+G3q.:5,1 B2+G3q.:4,1 | C3+G3h.:5,1',
    },
  },
  {
    id: 416,
    title: 'Yankee Doodle',
    composer: 'Traditional (arr.)',
    world: 22,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'British soldiers first sang this song to tease the Americans during the Revolutionary War — but the Americans liked it so much they made it their own.',
    concept: 'Eighth notes — two notes for each beat. Count "1-and 2-and".',
    bpm: { turtle: 66, normal: 100, rabbit: 120, rocket: 138 },
    score: {
      time: '2/4', key: 'G',
      rh: 'G4e:3 G4e A4e:4 B4e:5 | G4e:3 B4e:5 A4e:4 D4e:1 | G4e:3 G4e A4e:4 B4e:5 | G4q:3 F#4q:2 | ' +
          'G4e:1 G4e A4e:2 B4e:3 | C5e:4 B4e:3 A4e:2 G4e:1 | F#4e:3 D4e:1 E4e:2 F#4e:3 | G4q:4 G4q',
      lh: 'G2+D3h:5,1 | G2+D3q:5,1 F#2+C3+D3q:5,2,1 | G2+D3h:5,1 | G2+B2+D3q:5,3,1 F#2+C3+D3q:5,2,1 | ' +
          'G2+D3h:5,1 | G2+C3+E3q:5,2,1 G2+B2+D3q:5,3,1 | F#2+C3+D3h:5,2,1 | G2+B2+D3h:5,3,1',
    },
  },
  {
    id: 417,
    title: 'Oh! Susanna',
    composer: 'Stephen Foster (arr.)',
    world: 22,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Stephen Foster wrote this song in 1848. A year later it became the favourite song of the gold miners rushing to California.',
    concept: 'A pickup of two eighth notes — the tune starts on "and" before beat 1.',
    bpm: { turtle: 66, normal: 96, rabbit: 116, rocket: 132 },
    score: {
      time: '2/4', key: 'C', pickup: 1,
      rh: 'C4e:1 D4e:2 | E4e:3 G4e:4 G4e A4e:5 | G4e:4 E4e:3 C4e:1 D4e:2 | E4e:3 E4e D4e:2 C4e:1 | ' +
          'D4q:2 C4e:1 D4e:2 | E4e:3 G4e:4 G4e A4e:5 | G4e:4 E4e:3 C4e:1 D4e:2 | E4e:3 E4e D4e:2 D4e | ' +
          'C4q:1',
      lh: 'Rq | C3+G3h:5,1 | C3+G3h:5,1 | C3+E3+G3h:5,3,1 | ' +
          'B2+F3+G3q:5,2,1 Rq | C3+G3h:5,1 | C3+G3h:5,1 | C3+E3+G3q:5,3,1 B2+F3+G3q:5,2,1 | ' +
          'C3+E3+G3q:5,3,1',
    },
  },
  {
    id: 418,
    title: 'Camptown Races',
    composer: 'Stephen Foster (arr.)',
    world: 22,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Stephen Foster wrote this song in 1850. Camptown is a real little town in Pennsylvania, near where the horse races were held.',
    concept: 'Eighth notes and quarter notes mixed together, while the left hand changes chord in the middle of the bar.',
    bpm: { turtle: 70, normal: 100, rabbit: 120, rocket: 138 },
    score: {
      time: '2/4', key: 'C',
      rh: 'G4e:4 G4e E4e:3 G4e:4 | A4e:5 G4e:4 E4q:3 | E4q:3 D4q:2 | E4q:3 D4q:2 | ' +
          'G4e:4 G4e E4e:3 G4e:4 | A4e:5 G4e:4 E4q:3 | D4e:2 D4e E4e:3 D4e:2 | C4h:1',
      lh: 'C3+G3h:5,1 | C3+G3h:5,1 | C3+E3+G3q:5,3,1 B2+F3+G3q:5,2,1 | C3+E3+G3q:5,3,1 B2+F3+G3q:5,2,1 | ' +
          'C3+G3h:5,1 | C3+G3h:5,1 | B2+F3+G3h:5,2,1 | C3+E3+G3h:5,3,1',
    },
  },
  {
    id: 419,
    title: 'Frère Jacques',
    composer: 'Traditional French (arr.)',
    world: 22,
    difficulty: 4,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Brother John is a monk who has overslept: he is supposed to ring the bells for morning prayers. In Spanish the same song is "Martinillo".',
    concept: 'Eighth notes in groups of two, and the left hand plays the low "ding" of the bells.',
    bpm: { turtle: 66, normal: 100, rabbit: 120, rocket: 138 },
    score: {
      time: '4/4', key: 'C',
      rh: 'C4q:1 D4q:2 E4q:3 C4q:1 | C4q:1 D4q:2 E4q:3 C4q:1 | E4q:3 F4q:4 G4h:5 | E4q:3 F4q:4 G4h:5 | ' +
          'G4e:4 A4e:5 G4e:4 F4e:3 E4q:2 C4q:1 | G4e:4 A4e:5 G4e:4 F4e:3 E4q:2 C4q:1 | C4q:1 Rq C4h:1 | C4q:1 Rq C4h:1',
      lh: 'C3+G3w:5,1 | C3+G3w:5,1 | C3+G3w:5,1 | C3+G3w:5,1 | ' +
          'C3+G3h:5,1 C3+G3h:5,1 | C3+G3h:5,1 C3+G3h:5,1 | C3q:5 G3q:1 C3h:5 | C3q:5 G3q:1 C3h:5',
    },
  },

  // ── Level 2 · World 1 · Minor Keys, Sharps & Flats ────────────────
  {
    id: 430,
    title: 'Greensleeves',
    composer: 'Traditional English (arr.)',
    world: 23,
    difficulty: 5,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Greensleeves is an English tune more than 400 years old. Shakespeare even mentions it in one of his plays!',
    concept: 'A minor with G-sharp, starting on an upbeat, and dotted quarter + eighth in 3/4.',
    bpm: { turtle: 60, normal: 88, rabbit: 108, rocket: 126 },
    score: {
      time: '3/4', key: 'Am', pickup: 1,
      rh: 'A4q:1 | C5h:2 D5q:3 | E5q.:4 F5e:5 E5q:4 | D5h:3 B4q:2 | ' +
          'G4q.:1 A4e:2 B4q:3 | C5h:4 A4q:2 | A4q.:2 G#4e:1 A4q:2 | B4h:3 G#4q:1 | ' +
          'E4h:1 A4q:1 | C5h:2 D5q:3 | E5q.:4 F5e:5 E5q:4 | D5h:3 B4q:2 | ' +
          'G4q.:2 A4e:3 B4q:4 | C5q.:5 B4e:4 A4q:3 | G#4q.:2 F#4e:1 G#4q:2 | A4h:3',
      lh: 'Rq | A2q:5 C3+E3q:3,1 C3+E3q | C3q:5 E3+G3q:3,1 E3+G3q | G2q:5 B2+D3q:3,1 B2+D3q | ' +
          'E2q:5 G2+B2q:3,1 G2+B2q | A2q:5 C3+E3q:3,1 C3+E3q | A2q:5 C3+E3q:3,1 C3+E3q | E2q:5 G#2+B2q:3,1 G#2+B2q | ' +
          'E2q:5 G#2+B2q:3,1 G#2+B2q | A2q:5 C3+E3q:3,1 C3+E3q | C3q:5 E3+G3q:3,1 E3+G3q | G2q:5 B2+D3q:3,1 B2+D3q | ' +
          'E2q:5 G2+B2q:3,1 G2+B2q | A2q:5 C3+E3q:3,1 C3+E3q | E2q:5 G#2+B2q:3,1 G#2+B2q | A2+C3+E3h:5,3,1',
    },
  },
  {
    id: 431,
    title: 'Drunken Sailor',
    composer: 'Traditional sea shanty (arr.)',
    world: 23,
    difficulty: 5,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Sailors sang sea shanties like this one to keep together while they hauled ropes and raised the anchor.',
    concept: 'D minor, and a natural sign that turns B-flat back into B.',
    bpm: { turtle: 70, normal: 108, rabbit: 132, rocket: 150 },
    score: {
      time: '4/4', key: 'Dm',
      rh: 'A4q:5 A4e A4e A4q A4e A4e | A4q:5 D4q:1 F4q:3 A4q:5 | G4q:4 G4e G4e G4q G4e G4e | G4q:5 C4q:1 E4q:3 G4q:5 | ' +
          'A4q:2 A4e A4e A4q A4e A4e | A4q:2 B4q:3 C5q:4 D5q:5 | C5q:4 A4q:2 G4q:1 E4q:3 | D4h:2 D4h:2 | ' +
          'A4h:5 A4h | A4q:5 D4q:1 F4q:3 A4q:5 | G4h:4 G4h | G4q:5 C4q:1 E4q:3 G4q:5 | ' +
          'A4h:2 A4h | A4q:2 B4q:3 C5q:4 D5q:5 | C5q:4 A4q:2 G4q:1 E4q:3 | D4h:2 D4h:2',
      lh: 'D3q:5 F3+A3q:3,1 D3q F3+A3q | D3q:5 F3+A3q:3,1 D3q F3+A3q | C3q:5 E3+G3q:3,1 C3q E3+G3q | C3q:5 E3+G3q:3,1 C3q E3+G3q | ' +
          'D3q:5 F3+A3q:3,1 D3q F3+A3q | D3q:5 F3+A3q:3,1 D3q F3+A3q | C3q:5 E3+G3q:3,1 C3q E3+G3q | D3+F3+A3w:5,3,1 | ' +
          'D3q:5 F3+A3q:3,1 D3q F3+A3q | D3q:5 F3+A3q:3,1 D3q F3+A3q | C3q:5 E3+G3q:3,1 C3q E3+G3q | C3q:5 E3+G3q:3,1 C3q E3+G3q | ' +
          'D3q:5 F3+A3q:3,1 D3q F3+A3q | D3q:5 F3+A3q:3,1 D3q F3+A3q | C3q:5 E3+G3q:3,1 C3q E3+G3q | D3+F3+A3w:5,3,1',
    },
  },
  {
    id: 433,
    title: 'Deck the Halls',
    composer: 'Traditional Welsh (arr.)',
    world: 23,
    difficulty: 5,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'The tune is an old Welsh New Year\'s song called "Nos Galan". The English Christmas words were added in the 1800s.',
    concept: 'Key of F — every B is B-flat, until the natural sign in bar 11 — and thumb-under.',
    bpm: { turtle: 66, normal: 96, rabbit: 116, rocket: 132 },
    score: {
      time: '4/4', key: 'F',
      rh: 'C5q.:5 Bb4e:4 A4q:3 G4q:2 | F4q:1 G4q:2 A4q:3 F4q:1 | G4e:3 A4e:4 Bb4e:5 G4e:3 A4q.:4 G4e:3 | F4q:2 E4q:1 F4h:2 | ' +
          'C5q.:5 Bb4e:4 A4q:3 G4q:2 | F4q:1 G4q:2 A4q:3 F4q:1 | G4e:3 A4e:4 Bb4e:5 G4e:3 A4q.:4 G4e:3 | F4q:2 E4q:1 F4h:2 | ' +
          'G4q.:1 A4e:2 Bb4q:3 G4q:1 | A4q.:2 Bb4e:3 C5q:4 G4q:1 | A4e:1 B4e:2 C5q:3 D5e:1 E5e:2 F5q:3 | E5q:2 D5q:1 C5h:3 | ' +
          'C5q.:5 Bb4e:4 A4q:3 G4q:2 | F4q:1 G4q:2 A4q:3 F4q:1 | D5e:4 D5e D5e D5e C5q.:3 Bb4e:2 | A4q:1 G4q:3 F4h:2',
      lh: 'F2q:5 A2+C3q:3,1 C3q:5 G3+Bb3q:2,1 | F2q:5 A2+C3q:3,1 F2q A2+C3q | C3q:5 G3+Bb3q:2,1 F2q:5 A2+C3q:3,1 | C3q:5 G3+Bb3q:2,1 F2+A2+C3h:5,3,1 | ' +
          'F2q:5 A2+C3q:3,1 C3q:5 G3+Bb3q:2,1 | F2q:5 A2+C3q:3,1 F2q A2+C3q | C3q:5 G3+Bb3q:2,1 F2q:5 A2+C3q:3,1 | C3q:5 G3+Bb3q:2,1 F2+A2+C3h:5,3,1 | ' +
          'C3q:5 G3+Bb3q:2,1 C3q G3+Bb3q | F2q:5 A2+C3q:3,1 C3q:5 G3+Bb3q:2,1 | F2q:5 A2+C3q:3,1 C3q:5 E3+G3q:3,1 | C3q:5 E3+G3q:3,1 C3+E3+G3h:5,3,1 | ' +
          'F2q:5 A2+C3q:3,1 C3q:5 G3+Bb3q:2,1 | F2q:5 A2+C3q:3,1 F2q A2+C3q | Bb2q:5 D3+F3q:3,1 C3q:5 G3+Bb3q:2,1 | F2q:5 A2+C3q:3,1 F2+A2+C3h:5,3,1',
    },
  },
  {
    id: 434,
    title: 'We Three Kings',
    composer: 'John Henry Hopkins Jr. (arr.)',
    world: 23,
    difficulty: 5,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'John Henry Hopkins Jr. wrote both the words and the tune in 1857 for a Christmas pageant in New York.',
    concept: 'E minor — F-sharp in the key signature, and D-sharp in the left hand\'s B chord.',
    bpm: { turtle: 66, normal: 96, rabbit: 116, rocket: 132 },
    score: {
      time: '3/4', key: 'Em',
      rh: 'B4h:5 A4q:4 | G4h:3 E4q:1 | F#4q:2 G4q:3 F#4q:2 | E4h.:1 | ' +
          'B4h:5 A4q:4 | G4h:3 E4q:1 | F#4q:2 G4q:3 F#4q:2 | E4h.:1',
      lh: 'E2q:5 G2+B2q:3,1 G2+B2q | E2q:5 G2+B2q:3,1 G2+B2q | B2q:5 D#3+F#3q:3,1 D#3+F#3q | E2+G2+B2h.:5,3,1 | ' +
          'E2q:5 G2+B2q:3,1 G2+B2q | E2q:5 G2+B2q:3,1 G2+B2q | B2q:5 D#3+F#3q:3,1 D#3+F#3q | E2+G2+B2h.:5,3,1',
    },
  },
  {
    id: 435,
    title: 'God Rest Ye Merry, Gentlemen',
    composer: 'Traditional English (arr.)',
    world: 23,
    difficulty: 5,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'This English carol is so old that "rest ye merry" meant "stay happy". People were singing it in the 1700s, and probably long before.',
    concept: 'E minor with an upbeat, and a small hand shift down to D.',
    bpm: { turtle: 66, normal: 100, rabbit: 120, rocket: 138 },
    score: {
      time: '4/4', key: 'Em', pickup: 1,
      rh: 'E4q:1 | E4q:1 B4q:5 B4q:5 A4q:4 | G4q:4 F#4q:3 E4q:2 D4q:1 | E4q:2 F#4q:3 G4q:4 A4q:5 | ' +
          'B4h.:5 E4q:1 | E4q:1 B4q:5 B4q:5 A4q:4 | G4q:4 F#4q:3 E4q:2 D4q:1 | E4q:2 F#4q:3 G4q:4 A4q:5 | ' +
          'B4h.:5',
      lh: 'Rq | E2q:5 G2+B2q:3,1 E2q G2+B2q | E2q:5 G2+B2q:3,1 D2q:5 F#2+A2q:3,1 | E2q:5 G2+B2q:3,1 A2q:5 C3+E3q:3,1 | ' +
          'B2q:5 D#3+F#3q:3,1 B2q D#3+F#3q | E2q:5 G2+B2q:3,1 E2q G2+B2q | E2q:5 G2+B2q:3,1 D2q:5 F#2+A2q:3,1 | E2q:5 G2+B2q:3,1 A2q:5 C3+E3q:3,1 | ' +
          'E2+G2+B2h.:5,3,1',
    },
  },

  // ── Level 2 · World 2 · Classics ──────────────────────────────────
  {
    id: 401,
    title: 'Minuet in G (Theme)',
    composer: 'Christian Petzold (arr.)',
    world: 24,
    difficulty: 6,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'For years everyone thought Bach wrote this minuet. It was really his friend Christian Petzold — Bach copied it into a music book for his wife, Anna Magdalena.',
    concept: 'Key of G: every F is F-sharp. Two eighth notes share one beat.',
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
    id: 436,
    title: 'Largo (New World Symphony)',
    composer: 'Antonín Dvořák (arr.)',
    world: 24,
    difficulty: 6,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Dvořák wrote this melody in America in 1893 for his "New World" Symphony. Years later it got words and became the song "Goin\' Home".',
    concept: 'Key of D (F-sharp and C-sharp) and broken chords in the left hand.',
    bpm: { turtle: 40, normal: 56, rabbit: 70, rocket: 84 },
    score: {
      time: '4/4', key: 'D',
      rh: 'F#4q.:3 A4e:5 A4h:5 | F#4q.:3 E4e:2 D4h:1 | E4q:2 F#4q:3 A4q:5 F#4q:3 | E4w:2 | ' +
          'F#4q.:3 A4e:5 A4h:5 | F#4q.:3 E4e:2 D4h:1 | E4q:2 F#4q:3 E4q:2 D4q:1 | D4w:1',
      lh: 'D3e:5 A3e:1 F#3e:3 A3e:1 D3e:5 A3e:1 F#3e:3 A3e:1 | D3e:5 A3e:1 F#3e:3 A3e:1 D3e:5 A3e:1 F#3e:3 A3e:1 | A2e:5 E3e:1 C#3e:3 E3e:1 A2e:5 E3e:1 C#3e:3 E3e:1 | A2e:5 E3e:1 C#3e:3 E3e:1 A2e:5 E3e:1 C#3e:3 E3e:1 | ' +
          'D3e:5 A3e:1 F#3e:3 A3e:1 D3e:5 A3e:1 F#3e:3 A3e:1 | D3e:5 A3e:1 F#3e:3 A3e:1 D3e:5 A3e:1 F#3e:3 A3e:1 | A2e:5 E3e:1 C#3e:3 E3e:1 A2e:5 E3e:1 C#3e:3 E3e:1 | D3+F#3+A3w:5,3,1',
    },
  },
  {
    id: 437,
    title: 'Lullaby (Wiegenlied)',
    composer: 'Johannes Brahms (arr.)',
    world: 24,
    difficulty: 6,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Brahms wrote this lullaby in 1868 as a present for a friend who had just had a baby boy.',
    concept: 'Waltz bass in F, upbeats, and big hand shifts.',
    bpm: { turtle: 54, normal: 76, rabbit: 92, rocket: 108 },
    score: {
      time: '3/4', key: 'F', pickup: 1,
      rh: 'A4e:3 A4e:3 | C5h:5 A4e:3 A4e:3 | C5h:5 A4e:3 C5e:5 | F5q:5 E5q.:4 D5e:3 | ' +
          'D5q:3 C5q:2 G4e:1 A4e:2 | Bb4q:3 G4q:1 G4e:1 A4e:2 | Bb4h:3 G4e:1 Bb4e:3 | E5q:3 D5q:2 C5e:1 E5e:3 | ' +
          'F5h:4 F4e:1 F4e:1 | F5h:5 D5e:3 Bb4e:1 | C5h:5 A4e:3 F4e:1 | Bb4q:1 C5q:2 D5q:3 | ' +
          'C5h:2 F4e:1 F4e:1 | F5h:5 D5e:3 Bb4e:1 | C5h:5 A4e:3 F4e:1 | Bb4q:4 A4q:3 G4q:2 | ' +
          'F4h:1',
      lh: 'Rq | F2q:5 A2+C3q:3,1 A2+C3q | F2q:5 A2+C3q:3,1 A2+C3q | C3q:5 G3+Bb3q:2,1 G3+Bb3q | ' +
          'F2q:5 A2+C3q:3,1 A2+C3q | C3q:5 G3+Bb3q:2,1 G3+Bb3q | C3q:5 G3+Bb3q:2,1 G3+Bb3q | C3q:5 G3+Bb3q:2,1 G3+Bb3q | ' +
          'F2q:5 A2+C3q:3,1 A2+C3q | Bb2q:5 D3+F3q:3,1 D3+F3q | F2q:5 A2+C3q:3,1 A2+C3q | Bb2q:5 D3+F3q:3,1 D3+F3q | ' +
          'F2q:5 A2+C3q:3,1 A2+C3q | Bb2q:5 D3+F3q:3,1 D3+F3q | F2q:5 A2+C3q:3,1 A2+C3q | C3q:5 G3+Bb3q:2,1 G3+Bb3q | ' +
          'F2+A2+C3h:5,3,1',
    },
  },
  {
    id: 438,
    title: 'Can-Can',
    composer: 'Jacques Offenbach (arr.)',
    world: 24,
    difficulty: 6,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'This galop comes from Offenbach\'s 1858 comic opera "Orpheus in the Underworld". Dancers in Paris made it famous with their high kicks!',
    concept: 'Fast 2/4 and an octave jump.',
    bpm: { turtle: 72, normal: 104, rabbit: 126, rocket: 144 },
    score: {
      time: '2/4', key: 'C',
      rh: 'C4h:1 | D4e:2 F4e:4 E4e:3 D4e:2 | G4q:5 G4q:5 | G4e:4 A4e:5 E4e:2 F4e:3 | ' +
          'D4q:1 D4q:1 | D4e:1 F4e:3 E4e:2 D4e:1 | C4e:1 C5e:4 B4e:3 A4e:2 | G4e:1 F4e:3 E4e:2 D4e:1 | ' +
          'C4h:1 | D4e:2 F4e:4 E4e:3 D4e:2 | G4q:5 G4q:5 | G4e:4 A4e:5 E4e:2 F4e:3 | ' +
          'D4q:1 D4q:1 | D4e:1 F4e:3 E4e:2 D4e:1 | C4e:1 G4e:5 D4e:2 E4e:3 | C4q:1 Rq',
      lh: 'C3q:5 E3+G3q:3,1 | G2q:5 B2+D3q:3,1 | C3q:5 E3+G3q:3,1 | C3q:5 E3+G3q:3,1 | ' +
          'G2q:5 B2+D3q:3,1 | G2q:5 B2+D3q:3,1 | C3q:5 E3+G3q:3,1 | G2q:5 B2+D3q:3,1 | ' +
          'C3q:5 E3+G3q:3,1 | G2q:5 B2+D3q:3,1 | C3q:5 E3+G3q:3,1 | C3q:5 E3+G3q:3,1 | ' +
          'G2q:5 B2+D3q:3,1 | G2q:5 B2+D3q:3,1 | C3+E3+G3q:5,3,1 G2+B2+D3q:5,3,1 | C3+E3+G3q:5,3,1 Rq',
    },
  },
  {
    id: 439,
    title: 'In the Hall of the Mountain King',
    composer: 'Edvard Grieg (arr.)',
    world: 24,
    difficulty: 6,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Grieg wrote this for the play "Peer Gynt" in 1875. The tune repeats over and over, getting faster and louder as the trolls chase Peer!',
    concept: 'B minor, with accidentals — E-sharp and C-natural sneak in like trolls.',
    bpm: { turtle: 60, normal: 84, rabbit: 108, rocket: 132 },
    score: {
      time: '4/4', key: 'Bm',
      rh: 'B3e:1 C#4e:2 D4e:3 E4e:4 F#4e:5 D4e:3 F#4q:5 | E#4e:4 C#4e:2 E#4q:4 E4e:4 C4e:2 E4q:4 | B3e:1 C#4e:2 D4e:3 E4e:4 F#4e:5 D4e:3 F#4e:2 B4e:5 | A4e:5 F#4e:3 D4e:1 F#4e:3 A4h:5 | ' +
          'B3e:1 C#4e:2 D4e:3 E4e:4 F#4e:5 D4e:3 F#4q:5 | E#4e:4 C#4e:2 E#4q:4 E4e:4 C4e:2 E4q:4 | B3e:1 C#4e:2 D4e:3 E4e:4 F#4e:5 D4e:3 F#4e:2 B4e:5 | A4e:5 F#4e:3 D4e:1 F#4e:3 A4h:5 | ' +
          'B3+D4+F#4w:1,3,5',
      lh: 'B2q:5 F#3q:1 B2q:5 F#3q:1 | B2q:5 F#3q:1 B2q:5 F#3q:1 | B2q:5 F#3q:1 B2q:5 F#3q:1 | B2q:5 F#3q:1 B2q:5 F#3q:1 | ' +
          'B2q:5 F#3q:1 B2q:5 F#3q:1 | B2q:5 F#3q:1 B2q:5 F#3q:1 | B2q:5 F#3q:1 B2q:5 F#3q:1 | B2q:5 F#3q:1 B2q:5 F#3q:1 | ' +
          'B2+F#3w:5,1',
    },
  },
  {
    id: 440,
    title: 'Für Elise (Opening)',
    composer: 'Ludwig van Beethoven (arr.)',
    world: 24,
    difficulty: 6,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Beethoven wrote it around 1810, but it was only published 40 years after he died. Nobody knows for sure who "Elise" was!',
    concept: 'Sixteenth notes in 3/8, D-sharp, and hands taking turns.',
    bpm: { turtle: 40, normal: 56, rabbit: 72, rocket: 88 },
    score: {
      time: '3/8', key: 'Am', pickup: 0.5,
      rh: 'E5s:5 D#5s:4 | E5s:5 D#5s:4 E5s:5 B4s:2 D5s:4 C5s:3 | A4e:1 Rs C4s:1 E4s:2 A4s:3 | B4e:4 Rs E4s:1 G#4s:3 B4s:4 | ' +
          'C5e:5 Rs E4s:1 E5s:5 D#5s:4 | E5s:5 D#5s:4 E5s:5 B4s:2 D5s:4 C5s:3 | A4e:1 Rs C4s:1 E4s:2 A4s:3 | B4e:4 Rs E4s:1 C5s:4 B4s:3 | ' +
          'A4q:2',
      lh: 'Re | Rq. | A2s:5 E3s:2 A3s:1 Rs Re | E2s:5 E3s:2 G#3s:1 Rs Re | ' +
          'A2s:5 E3s:2 A3s:1 Rs Re | Rq. | A2s:5 E3s:2 A3s:1 Rs Re | E2s:5 E3s:2 G#3s:1 Rs Re | ' +
          'A2s:5 E3s:2 A3s:1 Rs',
    },
  },

  // ── Level 2 · World 3 · Around the World ──────────────────────────
  {
    id: 420,
    title: 'Silent Night (Noche de Paz)',
    composer: 'Franz Xaver Gruber (arr.)',
    world: 25,
    difficulty: 5,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'It was first sung on Christmas Eve 1818 in a small Austrian village, with just a guitar. In Spanish it is called "Noche de paz".',
    concept: '3/4 with a reach: the right hand climbs from G up to high F — keep the left-hand chords soft.',
    bpm: { turtle: 54, normal: 72, rabbit: 90, rocket: 108 },
    score: {
      time: '3/4', key: 'C',
      rh: 'G4q.:3 A4e:4 G4q:3 | E4h.:1 | G4q.:3 A4e:4 G4q:3 | E4h.:1 | ' +
          'D5h:5 D5q:5 | B4h.:3 | C5h:4 C5q:4 | G4h.:1 | ' +
          'D5h:5 D5q:5 | F5q.:5 D5e:3 B4q:1 | C5h.:2 | E5h.:4 | ' +
          'C5q:5 G4q:3 E4q:1 | G4q.:5 F4e:4 D4q:2 | C4h.~:1 | C4h.',
      lh: 'C3+G3h.:5,1 | C3+G3h.:5,1 | C3+G3h.:5,1 | C3+G3h.:5,1 | ' +
          'B2+F3+G3h.:5,2,1 | B2+F3+G3h.:5,2,1 | C3+E3+G3h.:5,3,1 | C3+E3+G3h.:5,3,1 | ' +
          'B2+F3+G3h.:5,2,1 | B2+F3+G3h.:5,2,1 | C3+E3+G3h.:5,3,1 | C3+E3+G3h.:5,3,1 | ' +
          'C3+G3h.:5,1 | B2+F3+G3h.:5,2,1 | C3+E3+G3h.:5,3,1 | C3+G3h.:5,1',
    },
  },
  {
    id: 432,
    title: 'Korobeiniki (the "Tetris" song)',
    composer: 'Traditional Russian (arr.)',
    world: 25,
    difficulty: 5,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'This Russian folk song about travelling peddlers comes from an 1861 poem. Millions of people know it as the music of the video game Tetris!',
    concept: 'A minor, with G-sharp in the left hand\'s E chord.',
    bpm: { turtle: 72, normal: 104, rabbit: 128, rocket: 150 },
    score: {
      time: '4/4', key: 'Am',
      rh: 'E5q:5 B4e:2 C5e:3 D5q:4 C5e:3 B4e:2 | A4q:1 A4e:1 C5e:3 E5q:5 D5e:4 C5e:3 | B4q.:2 C5e:3 D5q:4 E5q:5 | C5q:3 A4q:1 A4h:1 | ' +
          'D5q.:1 F5e:3 A5q:5 G5e:4 F5e:3 | E5q.:3 C5e:1 E5q:3 D5e:2 C5e:1 | B4q:1 B4e:1 C5e:2 D5q:3 E5q:4 | C5q:2 A4q:1 A4h:1',
      lh: 'E2q:5 G#2+B2q:3,1 E2q G#2+B2q | A2q:5 C3+E3q:3,1 A2q C3+E3q | E2q:5 G#2+B2q:3,1 E2q G#2+B2q | A2q:5 C3+E3q:3,1 A2q C3+E3q | ' +
          'D3q:5 F3+A3q:3,1 D3q F3+A3q | C3q:5 E3+G3q:3,1 C3q E3+G3q | E2q:5 G#2+B2q:3,1 E2q G#2+B2q | A2q:5 C3+E3q:3,1 A2+C3+E3h:5,3,1',
    },
  },
  {
    id: 441,
    title: 'Sakura Sakura',
    composer: 'Traditional Japan (arr.)',
    world: 25,
    difficulty: 5,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Sakura means cherry blossom. Every spring, families in Japan have picnics under the pink trees — they call it hanami. (Sakura significa flor de cerezo.)',
    concept: 'A Japanese five-note scale (A B C E F) over open fifths in the left hand.',
    bpm: { turtle: 50, normal: 66, rabbit: 80, rocket: 96 },
    score: {
      time: '4/4', key: 'Am',
      rh: 'A4q:2 A4q:2 B4h:3 | A4q:2 A4q B4h | A4q:2 B4q:3 C5q:4 B4q:3 | A4q:2 B4e:3 A4e:2 F4h:1 | ' +
          'E4q:3 C4q:2 E4q:3 F4q:4 | E4q:3 E4e C4e:2 B3h:1 | A4q:2 B4q:3 C5q:4 B4q:3 | A4q:2 B4e:3 A4e:2 F4h:1 | ' +
          'E4q:3 C4q:2 E4q:3 F4q:4 | E4q:3 E4e C4e:2 B3h:1 | A4q:2 A4q B4h:3 | A4q:2 A4q B4h:3 | ' +
          'E4q:1 F4q:2 B4e:4 A4e:3 F4q:2 | E4w:1',
      lh: 'A2+E3w:5,1 | A2+E3w:5,1 | F2+C3h:5,1 E2+B2h:5,1 | A2+E3h:5,1 D3+A3h:5,1 | ' +
          'A2+E3h:5,1 F2+C3h:5,1 | E2+B2w:5,1 | A2+E3h:5,1 F2+C3h:5,1 | A2+E3h:5,1 D3+A3h:5,1 | ' +
          'A2+E3h:5,1 F2+C3h:5,1 | E2+B2w:5,1 | A2+E3w:5,1 | F2+C3w:5,1 | ' +
          'E2+B2w:5,1 | E2+B2w:5,1',
    },
  },
  {
    id: 443,
    title: 'Aura Lee',
    composer: 'George R. Poulton, 1861 (arr.)',
    world: 25,
    difficulty: 5,
    alwaysUnlocked: false,
    isBonus: false,
    funFact: 'Aura Lee was a favourite American song in the 1860s. Almost 100 years later, Elvis Presley sang the very same melody as "Love Me Tender".',
    concept: 'A bass-and-chord left hand with seventh chords (A7, D7, B7, G7).',
    bpm: { turtle: 60, normal: 76, rabbit: 92, rocket: 108 },
    score: {
      time: '4/4', key: 'G',
      rh: 'D4q:1 G4q:4 F#4q:3 G4q:4 | A4q:5 E4q:2 A4h:5 | G4q:4 F#4q:3 E4q:2 F#4q:3 | G4w:4 | ' +
          'D4q:1 G4q:4 F#4q:3 G4q:4 | A4q:5 E4q:2 A4h:5 | G4q:4 F#4q:3 E4q:2 F#4q:3 | G4w:4 | ' +
          'B4q:3 B4q B4h | B4q B4q B4h | B4q:3 A4q:2 G4q:1 A4q:2 | B4w:3 | ' +
          'B4q:3 B4q C5q:4 B4q:3 | A4q:4 E4q:1 A4h:4 | G4q:3 F#4q:2 B4q:5 A4q:4 | G4w:3',
      lh: 'G2h:5 B2+D3h:3,1 | A2h:5 C#3+G3h:3,1 | D2h:5 F#2+C3h:3,1 | G2+B2+D3w:5,3,1 | ' +
          'G2h:5 B2+D3h:3,1 | A2h:5 C#3+G3h:3,1 | D2h:5 F#2+C3h:3,1 | G2+B2+D3w:5,3,1 | ' +
          'G2h:5 B2+D3h:3,1 | B2h:5 D#3+A3h:3,1 | E2h:5 G2+B2h:3,1 | G2h:5 B2+F3h:3,1 | ' +
          'C3h:5 E3+G3h:3,1 | A2h:5 C#3+G3h:3,1 | D2h:5 F#2+C3h:3,1 | G2+B2+D3w:5,3,1',
    },
  },
];

if (typeof module === 'object' && module.exports) module.exports = LM_SONGS;
