import re

with open('js/learning-checks.js', 'r') as f:
    content = f.read()

# Add to banks with < 6 questions. We need to reach 6 or add 1-2. Let's add 2 to each.
# Banks: math (3), music (2), chess (2), history (1), general (2)
# The prompt says: "For any subject with fewer than 6 questions, add 1-2 new questions."
# I will add 2 questions to each to ensure they get new content without exceeding 8.
# Also add 'art' and 'faith' as empty arrays first, then add to them, since they are missing in the code but mentioned in the guidelines/prompt.

banks_search = """  var QUESTIONS = {
    math: [
      { q: 'What is 12 + 15?', options: ['25', '27', '29', '30'], answer: 1 },
      { q: 'What is 8 x 4?', options: ['32', '36', '40', '28'], answer: 0 },
      { q: 'What is 100 - 45?', options: ['45', '55', '65', '75'], answer: 1 }
    ],
    music: [
      { q: 'Which note is higher?', options: ['C4', 'G4', 'E4', 'D4'], answer: 1 },
      { q: 'How many beats is a whole note?', options: ['1', '2', '3', '4'], answer: 3 }
    ],
    chess: [
      { q: 'Which piece moves in an L-shape?', options: ['Bishop', 'Rook', 'Knight', 'Pawn'], answer: 2 },
      { q: 'Can a King move two squares?', options: ['No', 'Only when castling', 'Yes', 'Only on first move'], answer: 1 }
    ],
    history: [
      { q: 'What are the colors of the Chilean flag?', options: ['Red, White, Blue', 'Green, Yellow', 'Blue, White', 'Red, Yellow'], answer: 0 }
    ],
    general: [
      { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
      { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 }
    ]
  };"""

banks_replace = """  var QUESTIONS = {
    math: [
      { q: 'What is 12 + 15?', options: ['25', '27', '29', '30'], answer: 1 },
      { q: 'What is 8 x 4?', options: ['32', '36', '40', '28'], answer: 0 },
      { q: 'What is 100 - 45?', options: ['45', '55', '65', '75'], answer: 1 },
      { q: 'What is 20 / 4?', options: ['4', '5', '6', '10'], answer: 1 },
      { q: 'What is 9 x 9?', options: ['81', '72', '90', '99'], answer: 0 }
    ],
    music: [
      { q: 'Which note is higher?', options: ['C4', 'G4', 'E4', 'D4'], answer: 1 },
      { q: 'How many beats is a whole note?', options: ['1', '2', '3', '4'], answer: 3 },
      { q: 'What is a sharp symbol (#)?', options: ['Lowers note', 'Raises note', 'Silences note', 'Lengthens note'], answer: 1 },
      { q: 'How many strings on a standard guitar?', options: ['4', '5', '6', '7'], answer: 2 }
    ],
    chess: [
      { q: 'Which piece moves in an L-shape?', options: ['Bishop', 'Rook', 'Knight', 'Pawn'], answer: 2 },
      { q: 'Can a King move two squares?', options: ['No', 'Only when castling', 'Yes', 'Only on first move'], answer: 1 },
      { q: 'Which piece can move diagonally?', options: ['Rook', 'Knight', 'Bishop', 'Pawn'], answer: 2 },
      { q: 'What is it called when a pawn reaches the other side?', options: ['Castling', 'Check', 'Promotion', 'En passant'], answer: 2 }
    ],
    history: [
      { q: 'What are the colors of the Chilean flag?', options: ['Red, White, Blue', 'Green, Yellow', 'Blue, White', 'Red, Yellow'], answer: 0 },
      { q: 'Who founded Santiago in 1541?', options: ['Pedro de Valdivia', 'Bernardo O\\'Higgins', 'Arturo Prat', 'Manuel Blanco'], answer: 0 },
      { q: 'In what year did Chile declare independence?', options: ['1818', '1810', '1850', '1900'], answer: 0 }
    ],
    art: [
      { q: 'What are the primary colors?', options: ['Red, Blue, Yellow', 'Green, Orange, Purple', 'Black, White, Gray', 'Red, Green, Blue'], answer: 0 },
      { q: 'What tool is used to paint on a canvas?', options: ['Hammer', 'Brush', 'Wrench', 'Spoon'], answer: 1 }
    ],
    faith: [
      { q: 'Who is the foster father of Jesus?', options: ['Peter', 'Paul', 'Joseph', 'John'], answer: 2 },
      { q: 'What prayer begins with "Our Father"?', options: ['Hail Mary', 'Gloria', 'Lord\\'s Prayer', 'Creed'], answer: 2 }
    ],
    general: [
      { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], answer: 1 },
      { q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
      { q: 'What is the fastest land animal?', options: ['Lion', 'Cheetah', 'Horse', 'Leopard'], answer: 1 },
      { q: 'What do bees make?', options: ['Milk', 'Honey', 'Water', 'Syrup'], answer: 1 }
    ]
  };"""

content = content.replace(banks_search, banks_replace)

with open('js/learning-checks.js', 'w') as f:
    f.write(content)
