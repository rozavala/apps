/* ================================================================
   CHESS QUEST — lesson scripts, puzzle chapters, computer levels
   (js/chess-quest-data.js). Pure data; read by js/chess-quest.js.

   Lesson positions are FEN strings. A demo is a list of steps:
     { cap: caption, show: 'e4' }          → show where that piece can go
     { cap: caption, move: 'e2e4' }        → play a move (animated)
     { cap: caption, fen: '…' }            → reset to a new position
   `try` is what the child does afterwards:
     { cap, goal: 'free' }                 → move the white piece freely
     { cap, goal: 'castle' | 'ep' | 'promo' | 'mate', fen }
   ================================================================ */
var CQData = {
  LESSONS: [
    { id: 'P', piece: 'P', name: 'Pawn', value: '1',
      desc: 'Pawns move straight forward one square — or two squares on their very first move. They capture diagonally, one square forward-left or forward-right. They are the foot soldiers of chess!',
      tip: 'Pawns are the only pieces that capture differently from how they move, and they can never move backwards. Get one to the far side and it is promoted!',
      fen: '8/8/8/3p4/8/8/4P3/8 w - - 0 1',
      demo: [
        { cap: 'A pawn on its starting square may move one square or two.', show: 'e2' },
        { cap: 'Two squares forward on its first move!', move: 'e2e4' },
        { cap: 'Now only one square at a time — and the black pawn on d5 can be captured diagonally.', show: 'e4' },
        { cap: 'Capture! Pawns take on the diagonal.', move: 'e4d5' }
      ],
      try: { cap: 'Your turn: tap the pawn and move it.', goal: 'free', fen: '8/8/2p1p3/8/8/8/3P4/8 w - - 0 1' } },
    { id: 'R', piece: 'R', name: 'Rook', value: '5',
      desc: 'Rooks move in straight lines — up, down, left or right — as many squares as they like, as long as nothing is in the way.',
      tip: 'Rooks love open files (columns with no pawns). Put them on open lines and they control the whole board!',
      fen: '3p4/8/8/8/3R3p/8/8/8 w - - 0 1',
      demo: [
        { cap: 'The rook slides along its row and its column.', show: 'd4' },
        { cap: 'All the way across the row in one move — capturing the pawn on h4!', move: 'd4h4' },
        { cap: 'It can go up the h-file too — or turn back along the row.', show: 'h4' },
        { cap: 'Rooks can also travel far down a file.', move: 'h4h8' }
      ],
      try: { cap: 'Your turn: move the rook and capture the black pawns.', goal: 'free', fen: '6p1/8/1p6/8/4R3/8/8/p7 w - - 0 1' } },
    { id: 'N', piece: 'N', name: 'Knight', value: '3',
      desc: 'Knights move in an "L" shape — two squares in one direction, then one square to the side. They are the only pieces that can JUMP over others!',
      tip: 'A knight in the centre reaches up to 8 squares; in a corner, only 2. "Knights on the rim are dim!"',
      fen: '8/8/8/8/8/8/PPPP4/1N6 w - - 0 1',
      demo: [
        { cap: 'Even boxed in by pawns, the knight can jump out.', show: 'b1' },
        { cap: 'Two up, one to the right: an L-shaped jump!', move: 'b1c3' },
        { cap: 'From the centre a knight has many more choices.', move: 'c3d5' },
        { cap: 'Eight squares from d5 — every one an "L".', show: 'd5' }
      ],
      try: { cap: 'Your turn: hop the knight around the board.', goal: 'free', fen: '8/8/3p4/8/8/2p5/8/1N6 w - - 0 1' } },
    { id: 'B', piece: 'B', name: 'Bishop', value: '3',
      desc: 'Bishops move diagonally — any number of squares along a diagonal. Each bishop stays on the same colour of square for the whole game!',
      tip: 'Having both bishops (one on light squares, one on dark) is called the "bishop pair" and is very strong.',
      fen: '8/6p1/8/8/3B4/8/8/8 w - - 0 1',
      demo: [
        { cap: 'The bishop moves along the diagonals.', show: 'd4' },
        { cap: 'Swoop to the edge…', move: 'd4a7' },
        { cap: '…and back across the board. It never leaves the dark squares.', move: 'a7f2' },
        { cap: 'Every square it can reach is the same colour.', show: 'f2' }
      ],
      try: { cap: 'Your turn: capture the pawn with the bishop.', goal: 'free', fen: '8/8/5p2/8/8/8/1B6/8 w - - 0 1' } },
    { id: 'Q', piece: 'Q', name: 'Queen', value: '9',
      desc: 'The Queen is the most powerful piece! She moves like a Rook AND a Bishop combined — any number of squares in any straight line or diagonal.',
      tip: 'The Queen is worth 9 points, almost as much as two Rooks. Do not bring her out too early or she may get chased around.',
      fen: '8/8/5p2/8/3Q2p1/8/8/8 w - - 0 1',
      demo: [
        { cap: 'Straight lines and diagonals: the queen covers a huge area.', show: 'd4' },
        { cap: 'Diagonal capture!', move: 'd4f6' },
        { cap: 'Now a straight-line move down the file.', move: 'f6f1' },
        { cap: 'From one square she can reach almost any part of the board.', show: 'f1' }
      ],
      try: { cap: 'Your turn: move the queen anywhere.', goal: 'free', fen: '1p6/8/8/6p1/8/8/3Q4/8 w - - 0 1' } },
    { id: 'K', piece: 'K', name: 'King', value: '∞',
      desc: 'The King moves one square in any direction. He is the most important piece — if your King is checkmated, you lose! He can capture too, but may never step into check.',
      tip: 'Keep your King safe behind pawns early on. In the endgame, when most pieces are gone, the King becomes a fighter!',
      fen: '8/8/8/8/3K4/8/8/5r2 w - - 0 1',
      demo: [
        { cap: 'One step in any direction…', show: 'd4' },
        { cap: '…but here the black rook guards the 1st rank, so the King may not step onto it.', fen: '8/8/8/8/8/8/3K4/5r2 w - - 0 1' },
        { cap: 'No dots on c1, d1 or e1: those squares are attacked by the rook.', show: 'd2' },
        { cap: 'The King steps safely away.', move: 'd2e3' }
      ],
      try: { cap: 'Your turn: walk the King — notice he cannot step into check.', goal: 'free', fen: '8/8/8/8/3K4/8/8/6r1 w - - 0 1' } }
  ],
  SPECIALS: [
    { id: 'castle', name: 'Castling', icon: 'wK',
      desc: 'Castling moves two pieces at once: the King steps two squares toward a Rook, and that Rook jumps to the square on the King\'s other side. You may castle only if neither the King nor that Rook has moved, nothing stands between them, and the King is not in check, does not pass through an attacked square and does not land on one.',
      tip: 'Castling early tucks your King into safety and brings a Rook toward the centre. Short castling is written O-O, long castling O-O-O.',
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
      demo: [
        { cap: 'Nothing stands between the King and the h1 rook. The King may move two squares.', show: 'e1' },
        { cap: 'Short castling (O-O): the King goes to g1 and the rook hops to f1.', move: 'e1g1' },
        { cap: 'The other side works too — long castling (O-O-O).', fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1' },
        { cap: 'King to c1, rook to d1.', move: 'e1c1' }
      ],
      try: { cap: 'Your turn: castle! Tap the King, then the square two steps toward a rook.', goal: 'castle', fen: 'r3k2r/pppq1ppp/2n1bn2/4p3/4P3/2N1BN2/PPPQ1PPP/R3K2R w KQkq - 0 1' } },
    { id: 'ep', name: 'En Passant', icon: 'wP',
      desc: '"En passant" is French for "in passing". If an enemy pawn moves two squares from its starting square and lands right beside your pawn, your pawn may capture it as if it had moved only one square. You must do it on the very next move, or the chance is gone.',
      tip: 'Your capturing pawn must be on its fifth rank (the 5th row for White). It lands on the square the enemy pawn skipped over.',
      fen: '4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1',
      demo: [
        { cap: 'White\'s pawn is on e5. Black pushes the d-pawn two squares…', move: 'd7d5' },
        { cap: '…landing right beside it. The e5 pawn may capture "in passing" on d6.', show: 'e5' },
        { cap: 'En passant! The pawn moves to d6 and the d5 pawn is removed.', move: 'e5d6' }
      ],
      try: { cap: 'Your turn: Black just played c7–c5. Capture en passant!', goal: 'ep', fen: '4k3/8/8/1Pp5/8/8/8/4K3 w - c6 0 1' } },
    { id: 'promo', name: 'Promotion', icon: 'wQ',
      desc: 'When a pawn reaches the last row, it is promoted: it must become a Queen, Rook, Bishop or Knight of the same colour. Most players choose a Queen, the strongest piece.',
      tip: 'You can promote even if you still have your first Queen — so you could have two or more Queens!',
      fen: '4k3/1P6/8/8/8/8/8/4K3 w - - 0 1',
      demo: [
        { cap: 'The pawn on b7 is one step from the last row.', show: 'b7' },
        { cap: 'b8 — and the pawn becomes a Queen!', move: 'b7b8q' }
      ],
      try: { cap: 'Your turn: march the pawn to the last row and promote it.', goal: 'promo', fen: '2k5/8/6P1/8/8/8/8/4K3 w - - 0 1' } },
    { id: 'mate', name: 'Check & Checkmate', icon: 'bK',
      desc: 'A King that is attacked is "in check" and must escape at once: move the King, block the attack, or capture the attacker. If there is no way out, it is checkmate and the game is over.',
      tip: 'If a side has no legal move but is NOT in check, that is stalemate — the game is a draw.',
      fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
      demo: [
        { cap: 'Black\'s King is hemmed in by its own pawns.', show: 'a1' },
        { cap: 'Ra8+ — check! The King has no square, nothing can block and nothing can capture: checkmate!', move: 'a1a8' }
      ],
      try: { cap: 'Your turn: find the checkmate with the queen.', goal: 'mate', fen: 'k7/8/1K6/8/8/8/8/7Q w - - 0 1' } }
  ],

  // Puzzle ladder chapters, in ladder order (matched by each puzzle's ch).
  CHAPTERS: {
    starter:    { title: 'Starter Tactics', icon: 'wP', desc: 'First checkmates, forks and free pieces.' },
    mate1:      { title: 'Mate-in-1 Academy', icon: 'wQ', desc: 'Famous checkmate patterns, from easy to tricky.' },
    fork:       { title: 'Forks', icon: 'wN', desc: 'One piece attacks two targets at once.' },
    pin:        { title: 'Pins', icon: 'wB', desc: 'A pinned piece cannot move without exposing something bigger behind it.' },
    skewer:     { title: 'Skewers', icon: 'wR', desc: 'Attack a big piece so the piece behind it falls.' },
    discovered: { title: 'Discovered Attacks', icon: 'wB', desc: 'Move one piece out of the way to unleash another.' },
    mate2:      { title: 'Mate in 2', icon: 'wK', desc: 'Two-move checkmates for sharp minds.' }
  },
  THEME_TAG: { mate: 'Mate', mate1: 'Mate', mate2: 'Mate 2', fork: 'Fork', pin: 'Pin', skewer: 'Skewer', discovered: 'Disc.', material: 'Win' },
  THEME_TIP: {
    mate: 'Checkmate always starts with a check. Look at every check you can give.',
    mate2: 'Look for a forcing first move — a check, or a quiet move that leaves no defence.',
    fork: 'Look for one piece that can attack two targets at the same time.',
    pin: 'Find an enemy piece that cannot move because something bigger is behind it.',
    skewer: 'Attack the big piece first; when it moves, the piece behind it is yours.',
    discovered: 'Move a piece out of the way to open a line for a piece behind it.',
    material: 'Look for an enemy piece that is not protected.'
  },

  // Computer opponents. Old saves have no level; the default comes from age.
  LEVELS: [
    { id: 1, name: 'Pawn Pal', icon: 'bP', desc: 'Just learning. Plays mostly random moves and often leaves pieces hanging.', stars: 1 },
    { id: 2, name: 'Knight Rider', icon: 'bN', desc: 'Grabs pieces it can take, but does not look ahead.', stars: 2 },
    { id: 3, name: 'Bishop Thinker', icon: 'bB', desc: 'Looks two moves ahead and protects its pieces.', stars: 3 },
    { id: 4, name: 'Rook Captain', icon: 'bR', desc: 'Looks three moves ahead. Solid and patient.', stars: 4 },
    { id: 5, name: 'Queen Master', icon: 'bQ', desc: 'Thinks four moves deep. The toughest challenge!', stars: 5 }
  ],
  LEVEL_FOR_TIER: { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
};
