import re

with open('js/guitar-jam.js', 'r') as f:
    content = f.read()

# CHORDS array currently has 16 items. Limit is 18. Add 1 chord.
chord_search = """  { name: 'E7', fullName: 'E Dominant 7', tier: 'advanced', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], funFact: 'A very bluesy sounding chord.' }
];"""
chord_replace = """  { name: 'E7', fullName: 'E Dominant 7', tier: 'advanced', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], funFact: 'A very bluesy sounding chord.' },
  { name: 'Am7', fullName: 'A Minor 7', tier: 'advanced', frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], funFact: 'A jazzy variation of the standard A Minor chord.' }
];"""
content = content.replace(chord_search, chord_replace)

# SONGS array currently has 10 items. Limit is 12. Add 1 song.
song_search = """  { id: 'valerie', title: 'Valerie', tier: 'intermediate', bpm: 105, progression: [['C', 4], ['Dm', 4], ['C', 4], ['Dm', 4]] }
];"""
song_replace = """  { id: 'valerie', title: 'Valerie', tier: 'intermediate', bpm: 105, progression: [['C', 4], ['Dm', 4], ['C', 4], ['Dm', 4]] },
  { id: 'letitbe', title: 'Let It Be', tier: 'intermediate', bpm: 70, progression: [['C', 4], ['G', 4], ['Am', 4], ['F', 4], ['C', 4], ['G', 4], ['F', 2], ['C', 6]] }
];"""
content = content.replace(song_search, song_replace)

with open('js/guitar-jam.js', 'w') as f:
    f.write(content)
