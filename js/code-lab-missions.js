/* ================================================================
   CODE LAB — the missions (js/code-lab-missions.js)

   40 missions in 7 chapters, from printing a word to a tree that draws
   itself. Every mission has:
     id, ch (chapter id), t (title), g (what to do), h (hints, kindest
     first), x (an "explain your code" question for 12 and up),
     solution (a reference program: the tests run it against the
     mission's own goal), goal (see js/code-lab-check.js), par (lines
     for the third star), starter (code to begin with, optional; a
     string or { es, en }), turtle (true when it draws), bridge (the
     Code Cadet blocks that do the same, for the first turtle missions).
   Text is [es, en]. Code keywords stay in English.

   The Chilean flag follows the official proportions: 3 wide to 2 tall,
   the blue square is as tall as the white stripe (half the height), and
   the white star is centred in it, inside a circle of half the square's
   side across. CHILE_FLAG holds those numbers; tests/unit/code-lab.spec.js
   re-derives them from the rules and checks the goal against them.
   ================================================================ */

var CodeLabMissions = (function() {
  'use strict';

  function L(lines) { return lines.join('\n'); }
  function P(es, en) { return { es: es, en: en }; }

  var CHAPTERS = [
    { id: 'hello', t: ['Hola, código', 'Hello, code'], d: ['Escribe tus primeras líneas.', 'Write your first lines.'], color: '#0e8f86' },
    { id: 'turtle', t: ['La tortuga', 'The turtle'], d: ['Dibuja con palabras: avanza, gira y repite.', 'Draw with words: move, turn and repeat.'], color: '#2a9d3f' },
    { id: 'numbers', t: ['Números y ciclos', 'Numbers and loops'], d: ['Cuentas, ciclos y decisiones.', 'Sums, loops and decisions.'], color: '#1b4fd1' },
    { id: 'color', t: ['Color y relleno', 'Colour and fill'], d: ['Pinta figuras y termina con una bandera.', 'Paint shapes and finish with a flag.'], color: '#d62828' },
    { id: 'lists', t: ['Listas', 'Lists'], d: ['Guarda muchas cosas en una sola variable.', 'Keep many things in one variable.'], color: '#7b2cbf' },
    { id: 'functions', t: ['Funciones', 'Functions'], d: ['Ponle nombre a un trozo de código y úsalo cuando quieras.', 'Name a piece of code and use it whenever you like.'], color: '#f77f00' },
    { id: 'big', t: ['Ideas grandes', 'Big ideas'], d: ['Funciones que se llaman a sí mismas.', 'Functions that call themselves.'], color: '#10246b' }
  ];

  // ---- The Chilean flag, written out from the rules -------------------
  var CHILE_FLAG = {
    width: 240, height: 160,             // 3 : 2
    left: -120, bottom: -80,
    canton: 80,                          // the blue square: half the height
    starRadius: 20,                      // the star's circle is half the canton's side across
    starCx: -80, starCy: 40              // the centre of the canton
  };
  function flagSpec() {
    var F = CHILE_FLAG, i, pts = [], a;
    function rect(x0, y0, x1, y1) { return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }]; }
    var top = F.bottom + F.height / 2, right = F.left + F.width;
    // a five-pointed star: vertices every 72 degrees, joined every second one
    for (i = 0; i < 5; i++) {
      a = (i * 144) * Math.PI / 180;
      pts.push({ x: F.starCx + F.starRadius * Math.sin(a), y: F.starCy + F.starRadius * Math.cos(a) });
    }
    return [
      { pts: rect(F.left, top, right, F.bottom + F.height), c: 'white' },
      { pts: rect(F.left, F.bottom, right, top), c: 'red' },
      { pts: rect(F.left, top, F.left + F.canton, F.bottom + F.height), c: 'blue' },
      { pts: pts, c: 'white' }
    ];
  }

  // Shared by two missions' reference solutions.
  var BOX_FN = L([
    'def box(x, y, w, h, c):',
    '  penup()',
    '  goto(x, y)',
    '  setheading(90)',
    '  pendown()',
    '  color(c)',
    '  begin_fill()',
    '  repeat 2:',
    '    forward(w)',
    '    left(90)',
    '    forward(h)',
    '    left(90)',
    '  end_fill()'
  ]);

  var MISSIONS = [
    // ------------------------------------------------------------ 1
    { id: 'hello', ch: 'hello', t: ['Di hola', 'Say hello'],
      g: ['Haz que tu programa escriba la palabra Hello.', 'Make your program print the word Hello.'],
      solution: 'print("Hello")', par: 1, goal: { out: ['Hello'] },
      h: [['print(...) escribe en la pantalla. Las palabras que quieres escribir van entre comillas.', 'print(...) writes on the screen. Put the words you want inside quotes.'],
          ['Escribe esto: print("Hello")', 'Type this: print("Hello")']],
      x: ['¿Qué hacen los paréntesis y las comillas en tu línea?', 'What do the parentheses and the quotes do in your line?'] },

    { id: 'name', ch: 'hello', t: ['Escribe tu nombre', 'Print your name'],
      g: ['Escribe tu nombre (o cualquier nombre) con print.', 'Print your name (or any name) with print.'],
      solution: 'print("Sol")', par: 1, goal: { outMin: 1, uses: ['call:print', 'string'] },
      h: [['Igual que antes, pero con tu nombre entre comillas.', 'Like before, but with your name inside the quotes.'],
          ['Por ejemplo: print("Sol")', 'For example: print("Sol")']],
      x: ['¿Qué pasaría si quitaras las comillas?', 'What would happen if you took the quotes away?'] },

    { id: 'lines3', ch: 'hello', t: ['Tres líneas', 'Three lines'],
      g: ['Escribe tres líneas: one, two y three, cada una con su print.', 'Print three lines: one, two and three, each with its own print.'],
      solution: L(['print("one")', 'print("two")', 'print("three")']), par: 3, goal: { out: ['one', 'two', 'three'] },
      h: [['Cada print escribe una línea nueva.', 'Each print writes a new line.'],
          ['Necesitas tres print, uno debajo del otro.', 'You need three prints, one under the other.']],
      x: ['¿En qué orden se ejecuta tu programa?', 'In what order does your program run?'] },

    { id: 'variable', ch: 'hello', t: ['Una variable', 'A variable'],
      g: ['Guarda el número 7 en una variable llamada lucky y escríbela con print.', 'Store the number 7 in a variable called lucky, then print it.'],
      solution: L(['lucky = 7', 'print(lucky)']), par: 2, goal: { vars: { lucky: 7 }, out: ['7'], uses: ['assign'] },
      h: [['Una variable es una caja con nombre: nombre = valor.', 'A variable is a named box: name = value.'],
          ['Primero lucky = 7. Después print(lucky) sin comillas.', 'First lucky = 7. Then print(lucky) with no quotes.']],
      x: ['¿Por qué print(lucky) escribe 7 y no la palabra lucky?', 'Why does print(lucky) show 7 and not the word lucky?'] },

    // ------------------------------------------------------------ turtle
    { id: 'line', ch: 'turtle', t: ['Una línea', 'One line'], turtle: true,
      g: ['La tortuga empieza en el centro mirando hacia arriba. Dibuja una línea de 100 pasos.', 'The turtle starts in the middle, facing up. Draw a line 100 steps long.'],
      solution: 'forward(100)', par: 1, goal: { draw: {} },
      bridge: { blocks: [{ t: 'move' }], note: ['En Code Cadet, Move avanza una casilla. Aquí tú eliges cuántos pasos.', 'In Code Cadet, Move goes one square. Here you choose how many steps.'] },
      h: [['forward(...) hace avanzar a la tortuga. El número es cuántos pasos.', 'forward(...) moves the turtle. The number is how many steps.'],
          ['Escribe: forward(100)', 'Type: forward(100)']],
      x: ['¿Qué cambiaría si escribes forward(50)?', 'What would change if you wrote forward(50)?'] },

    { id: 'corner', ch: 'turtle', t: ['Una esquina', 'A corner'], turtle: true,
      g: ['Avanza 100, gira a la derecha 90 grados y avanza 100 más.', 'Go forward 100, turn right 90 degrees, then go forward 100 more.'],
      solution: L(['forward(100)', 'turn(90)', 'forward(100)']), par: 3, goal: { draw: {} },
      bridge: { blocks: [{ t: 'move' }, { t: 'turnRight' }, { t: 'move' }], note: ['Turn right del rover es turn(90).', 'The rover\'s Turn right is turn(90).'] },
      h: [['turn(90) gira a la derecha un cuarto de vuelta.', 'turn(90) turns right a quarter of a full turn.'],
          ['forward(100), luego turn(90), luego forward(100).', 'forward(100), then turn(90), then forward(100).']],
      x: ['¿Por qué 90 grados hacen una esquina?', 'Why do 90 degrees make a corner?'] },

    { id: 'square', ch: 'turtle', t: ['Un cuadrado', 'A square'], turtle: true,
      g: ['Dibuja un cuadrado de lado 100. Puedes escribir cada paso uno por uno.', 'Draw a square with sides of 100. You can write each step one by one.'],
      solution: L(['forward(100)', 'turn(90)', 'forward(100)', 'turn(90)', 'forward(100)', 'turn(90)', 'forward(100)', 'turn(90)']), par: 8, goal: { draw: {} },
      bridge: { blocks: [{ t: 'move' }, { t: 'turnRight' }, { t: 'move' }, { t: 'turnRight' }, { t: 'move' }, { t: 'turnRight' }, { t: 'move' }, { t: 'turnRight' }], note: ['Ocho bloques, ocho líneas. ¿Ves el patrón que se repite?', 'Eight blocks, eight lines. Can you see the pattern that repeats?'] },
      h: [['Un cuadrado tiene 4 lados iguales y 4 esquinas de 90 grados.', 'A square has 4 equal sides and 4 corners of 90 degrees.'],
          ['Repite cuatro veces: forward(100) y turn(90).', 'Do this four times: forward(100) and turn(90).']],
      x: ['¿Qué parte de tu código se repite?', 'Which part of your code repeats?'] },

    { id: 'squareloop', ch: 'turtle', t: ['Cuadrado con repeat', 'A square with repeat'], turtle: true,
      g: ['Dibuja el mismo cuadrado, pero usa repeat para no escribir lo mismo cuatro veces.', 'Draw the same square, but use repeat so you do not write the same thing four times.'],
      solution: L(['repeat 4:', '  forward(100)', '  turn(90)']), par: 3, goal: { draw: {}, uses: ['loop'] },
      bridge: { blocks: [{ t: 'repeat', n: 4, body: [{ t: 'move' }, { t: 'turnRight' }] }], note: ['El bloque Repeat 4 se convierte en repeat 4: y lo de adentro va hacia la derecha (con sangría).', 'The Repeat 4 block becomes repeat 4: and what is inside moves to the right (indented).'] },
      h: [['Después de repeat 4: ponemos dos puntos y las líneas de adentro van con 2 espacios a la izquierda.', 'After repeat 4: comes a colon, and the lines inside start with 2 spaces.'],
          ['repeat 4: y debajo, con sangría, forward(100) y turn(90).', 'repeat 4: and under it, indented, forward(100) and turn(90).']],
      x: ['¿Para qué sirven los espacios antes de forward?', 'What are the spaces before forward for?'] },

    { id: 'triangle', ch: 'turtle', t: ['Un triángulo', 'A triangle'], turtle: true,
      g: ['Dibuja un triángulo con tres lados iguales de 100.', 'Draw a triangle with three equal sides of 100.'],
      solution: L(['repeat 3:', '  forward(100)', '  turn(120)']), par: 3, goal: { draw: {} },
      bridge: { blocks: [{ t: 'repeat', n: 3, body: [{ t: 'move' }, { t: 'turnRight' }] }], note: ['Mismo Repeat, otro número de veces y otro giro.', 'The same Repeat, a different count and a different turn.'] },
      h: [['Son 3 lados, así que repite 3 veces. El giro no es 90.', 'There are 3 sides, so repeat 3 times. The turn is not 90.'],
          ['Una vuelta completa son 360 grados. 360 dividido 3 es 120.', 'A full turn is 360 degrees. 360 divided by 3 is 120.']],
      x: ['¿Por qué el giro es 120 y no 60?', 'Why is the turn 120 and not 60?'] },

    { id: 'hexagon', ch: 'turtle', t: ['Un hexágono con variables', 'A hexagon with variables'], turtle: true,
      g: ['Dibuja un hexágono de lado 60. Usa las variables sides y length, y calcula el giro con 360 / sides.', 'Draw a hexagon with sides of 60. Use the variables sides and length, and work out the turn with 360 / sides.'],
      solution: L(['sides = 6', 'length = 60', 'repeat sides:', '  forward(length)', '  turn(360 / sides)']), par: 5,
      goal: { draw: {}, vars: { sides: 6, length: 60 }, uses: ['loop', 'math'] },
      h: [['Primero sides = 6 y length = 60. Después repeat sides:', 'First sides = 6 and length = 60. Then repeat sides:'],
          ['Dentro: forward(length) y turn(360 / sides).', 'Inside: forward(length) and turn(360 / sides).']],
      x: ['Si cambias sides a 8, ¿qué figura sale y por qué?', 'If you change sides to 8, what shape do you get, and why?'] },

    { id: 'dashes', ch: 'turtle', t: ['Línea de rayas', 'A dashed line'], turtle: true,
      g: ['Dibuja una línea hacia arriba con 5 rayas de 20 pasos y 20 pasos de espacio entre ellas. Levanta el lápiz con penup() y bájalo con pendown().', 'Draw a line going up with 5 dashes of 20 steps and a gap of 20 steps after each. Lift the pen with penup() and put it down with pendown().'],
      solution: L(['repeat 5:', '  forward(20)', '  penup()', '  forward(20)', '  pendown()']), par: 5, goal: { draw: {} },
      h: [['Con el lápiz arriba la tortuga se mueve sin dibujar.', 'With the pen up the turtle moves without drawing.'],
          ['Repite 5 veces: forward(20), penup(), forward(20), pendown().', 'Repeat 5 times: forward(20), penup(), forward(20), pendown().']],
      x: ['¿Qué pasa si te olvidas de pendown()?', 'What happens if you forget pendown()?'] },

    { id: 'circles', ch: 'turtle', t: ['Dos círculos', 'Two circles'], turtle: true,
      g: ['Dibuja dos círculos con el mismo centro: uno de radio 30 y otro de radio 60. circle(r) dibuja un círculo con la tortuga en el centro.', 'Draw two circles with the same centre: one of radius 30 and one of radius 60. circle(r) draws a circle with the turtle at its centre.'],
      solution: L(['circle(30)', 'circle(60)']), par: 2, goal: { draw: {}, uses: ['call:circle'] },
      h: [['El número de circle es el radio: la distancia del centro al borde.', 'The number in circle is the radius: the distance from the centre to the edge.'],
          ['Escribe circle(30) y circle(60) en dos líneas.', 'Write circle(30) and circle(60) on two lines.']],
      x: ['¿Cuál es la diferencia entre el radio 30 y el radio 60?', 'What is the difference between radius 30 and radius 60?'] },

    { id: 'star', ch: 'turtle', t: ['Una estrella', 'A star'], turtle: true,
      g: ['Dibuja una estrella de cinco puntas con líneas de 100. Gira 144 grados en cada punta.', 'Draw a five-pointed star with lines of 100. Turn 144 degrees at each point.'],
      solution: L(['repeat 5:', '  forward(100)', '  turn(144)']), par: 3, goal: { draw: {} },
      h: [['La estrella se dibuja con 5 líneas y un giro grande en cada punta.', 'The star is 5 lines with one big turn at each point.'],
          ['repeat 5: forward(100) y turn(144).', 'repeat 5: forward(100) and turn(144).']],
      x: ['El giro total es 5 por 144. ¿Cuántas vueltas completas son?', 'The total turn is 5 times 144. How many full turns is that?'] },

    { id: 'spiral', ch: 'turtle', t: ['Una espiral', 'A spiral'], turtle: true,
      g: ['Dibuja una espiral cuadrada: cada línea un poco más larga que la anterior. Usa una variable que crezca en cada vuelta del ciclo.', 'Draw a square spiral: each line a little longer than the one before. Use a variable that grows each time round the loop.'],
      solution: L(['size = 5', 'repeat 40:', '  forward(size)', '  turn(90)', '  size += 5']), par: 5,
      goal: { uses: ['loop', 'assign'], custom: function(run) {
        var s = run.turtle ? run.turtle.segs : [], n = s.length, i, up = 0, len = function(q) { return Math.sqrt((q.x2 - q.x1) * (q.x2 - q.x1) + (q.y2 - q.y1) * (q.y2 - q.y1)); };
        if (n < 20) return ['Dibuja al menos 20 líneas.', 'Draw at least 20 lines.'];
        for (i = 1; i < n; i++) if (len(s[i]) >= len(s[i - 1]) - 0.01) up++;
        if (up / (n - 1) < 0.9 || len(s[n - 1]) < 3 * len(s[0])) return ['Cada línea debe ser más larga que la anterior.', 'Each line must be longer than the one before.'];
        return true;
      } },
      h: [['Empieza con size = 5 y haz que size crezca dentro del ciclo.', 'Start with size = 5 and make size grow inside the loop.'],
          ['size += 5 suma 5 a size. Pon forward(size), turn(90) y size += 5 dentro de repeat 40.', 'size += 5 adds 5 to size. Put forward(size), turn(90) and size += 5 inside repeat 40.']],
      x: ['¿Qué valor tiene size en la última vuelta?', 'What is size on the last time round?'] },

    // ------------------------------------------------------------ numbers
    { id: 'math', ch: 'numbers', t: ['Haz la cuenta', 'Do the sum'],
      g: ['Haz que el computador calcule 12 × 5 + 3 y escriba el resultado. En código la multiplicación es *.', 'Make the computer work out 12 × 5 + 3 and print the answer. In code, multiply with *.'],
      solution: 'print(12 * 5 + 3)', par: 1, goal: { out: ['63'], uses: ['math'] },
      h: [['Dentro de print puedes poner una cuenta, sin comillas.', 'You can put a sum inside print, with no quotes.'],
          ['print(12 * 5 + 3)', 'print(12 * 5 + 3)']],
      x: ['¿Qué se calcula primero, la suma o la multiplicación?', 'Which is worked out first, the add or the multiply?'] },

    { id: 'joinstr', ch: 'numbers', t: ['Unir palabras', 'Join words'], starter: 'name = "Sol"\n',
      g: ['Ya existe la variable name. Escribe exactamente: Hello, Sol! usando name y el signo +.', 'The variable name already exists. Print exactly: Hello, Sol! using name and the + sign.'],
      solution: L(['name = "Sol"', 'print("Hello, " + name + "!")']), par: 2, goal: { out: ['Hello, Sol!'], uses: ['call:print'] },
      h: [['Con + puedes pegar palabras: "Hello, " + name', 'With + you can glue words together: "Hello, " + name'],
          ['print("Hello, " + name + "!")', 'print("Hello, " + name + "!")']],
      x: ['¿Por qué hay un espacio después de la coma, dentro de las comillas?', 'Why is there a space after the comma, inside the quotes?'] },

    { id: 'count10', ch: 'numbers', t: ['Contar hasta 10', 'Count to 10'],
      g: ['Escribe los números del 1 al 10, uno por línea, usando un ciclo for.', 'Print the numbers 1 to 10, one per line, using a for loop.'],
      solution: L(['for i in range(1, 11):', '  print(i)']), par: 2, goal: { out: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], uses: ['for'] },
      bridge: { blocks: [{ t: 'forLoop', n: 10, body: [] }], note: ['Count i: 1 → 10 es como for i in range(1, 11): La i va cambiando en cada vuelta.', 'Count i: 1 → 10 is like for i in range(1, 11): The i changes on every turn of the loop.'] },
      h: [['range(1, 11) va del 1 al 10: el final no cuenta.', 'range(1, 11) goes from 1 to 10: the end number is not included.'],
          ['for i in range(1, 11): y debajo, con sangría, print(i)', 'for i in range(1, 11): and under it, indented, print(i)']],
      x: ['¿Por qué range termina en 11 si contamos hasta 10?', 'Why does range end at 11 if we count to 10?'] },

    { id: 'evens', ch: 'numbers', t: ['Solo pares', 'Only even numbers'],
      g: ['Escribe los números pares del 2 al 20, uno por línea. Usa for, if y el resto: n % 2 == 0 significa que n es par.', 'Print the even numbers from 2 to 20, one per line. Use for, if and the remainder: n % 2 == 0 means n is even.'],
      solution: L(['for n in range(1, 21):', '  if n % 2 == 0:', '    print(n)']), par: 3,
      goal: { out: ['2', '4', '6', '8', '10', '12', '14', '16', '18', '20'], uses: ['loop', 'if'] },
      h: [['% da lo que sobra de una división. 7 % 2 es 1, pero 8 % 2 es 0.', '% gives what is left over after a division. 7 % 2 is 1, but 8 % 2 is 0.'],
          ['Recorre del 1 al 20 y escribe n solo si n % 2 == 0. Cuidado: == con dos signos.', 'Go through 1 to 20 and print n only if n % 2 == 0. Careful: == with two signs.']],
      x: ['¿Qué significa == y en qué se diferencia de = ?', 'What does == mean, and how is it different from = ?'] },

    { id: 'table', ch: 'numbers', t: ['La tabla del 7', 'The 7 times table'],
      g: ['Escribe la tabla del 7, de 7 x 1 = 7 hasta 7 x 10 = 70, una línea para cada una.', 'Print the 7 times table, from 7 x 1 = 7 up to 7 x 10 = 70, one line each.'],
      solution: L(['for i in range(1, 11):', '  print("7 x", i, "=", 7 * i)']), par: 2,
      goal: { out: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function(i) { return '7 x ' + i + ' = ' + (7 * i); }), uses: ['loop'] },
      h: [['print puede llevar varias cosas separadas por comas, y las escribe con un espacio.', 'print can take several things separated by commas, and shows them with a space between.'],
          ['print("7 x", i, "=", 7 * i) dentro de un for.', 'print("7 x", i, "=", 7 * i) inside a for loop.']],
      x: ['¿Cómo cambiarías tu código para la tabla del 9?', 'How would you change your code for the 9 times table?'] },

    { id: 'double', ch: 'numbers', t: ['Doblar y doblar', 'Double and double'],
      g: ['Empieza con x = 1. Mientras x sea menor que 100, escribe x y dóblalo. Debe salir 1, 2, 4, 8, 16, 32, 64.', 'Start with x = 1. While x is less than 100, print x and double it. You should see 1, 2, 4, 8, 16, 32, 64.'],
      solution: L(['x = 1', 'while x < 100:', '  print(x)', '  x = x * 2']), par: 4, goal: { out: ['1', '2', '4', '8', '16', '32', '64'], uses: ['while'] },
      h: [['while repite mientras la condición sea verdadera. Algo dentro debe cambiar x o nunca termina.', 'while repeats as long as the condition is true. Something inside must change x or it never ends.'],
          ['Dentro del while: print(x) y x = x * 2', 'Inside the while: print(x) and x = x * 2']],
      x: ['¿Cómo sabe el while cuándo parar?', 'How does the while know when to stop?'] },

    { id: 'fizz', ch: 'numbers', t: ['Fizz y Buzz', 'Fizz and Buzz'],
      g: ['Cuenta del 1 al 15. Si el número es múltiplo de 3 escribe Fizz, si es múltiplo de 5 escribe Buzz, si es de los dos escribe FizzBuzz; si no, el número.', 'Count from 1 to 15. If the number is a multiple of 3 print Fizz, of 5 print Buzz, of both print FizzBuzz; otherwise print the number.'],
      solution: L(['for n in range(1, 16):', '  if n % 15 == 0:', '    print("FizzBuzz")', '  elif n % 3 == 0:', '    print("Fizz")', '  elif n % 5 == 0:', '    print("Buzz")', '  else:', '    print(n)']), par: 9,
      goal: { out: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'], uses: ['loop', 'if'] },
      h: [['Pregunta primero por los dos a la vez (múltiplo de 15), porque si no el Fizz le gana.', 'Ask about both at once first (a multiple of 15), or Fizz will win too early.'],
          ['if n % 15 == 0, después elif n % 3 == 0, después elif n % 5 == 0, y al final else.', 'if n % 15 == 0, then elif n % 3 == 0, then elif n % 5 == 0, and else at the end.']],
      x: ['¿Por qué el orden de los if importa?', 'Why does the order of the ifs matter?'] },

    { id: 'growing', ch: 'numbers', t: ['Cuadrados que crecen', 'Growing squares'], turtle: true,
      g: ['Dibuja 4 cuadrados desde la misma esquina, de lados 30, 60, 90 y 120. Usa un for con i y dentro un repeat 4.', 'Draw 4 squares from the same corner with sides 30, 60, 90 and 120. Use a for with i and a repeat 4 inside it.'],
      solution: L(['for i in range(1, 5):', '  repeat 4:', '    forward(i * 30)', '    turn(90)']), par: 4, goal: { draw: {}, uses: ['for'] },
      h: [['i vale 1, 2, 3 y 4. El lado es i * 30.', 'i is 1, 2, 3 and 4. The side is i * 30.'],
          ['for i in range(1, 5): y dentro un repeat 4 con forward(i * 30) y turn(90).', 'for i in range(1, 5): and inside it a repeat 4 with forward(i * 30) and turn(90).']],
      x: ['¿Cuántas veces se ejecuta forward en total?', 'How many times does forward run in total?'] },

    // ------------------------------------------------------------ colour
    { id: 'redsquare', ch: 'color', t: ['Cuadrado rojo', 'A red square'], turtle: true,
      g: ['Dibuja un cuadrado rojo de lado 100. Cambia el color del lápiz con color("red").', 'Draw a red square with sides of 100. Change the pen colour with color("red").'],
      solution: L(['color("red")', 'repeat 4:', '  forward(100)', '  turn(90)']), par: 4, goal: { draw: { colors: true } },
      h: [['color("red") va antes de dibujar. Los nombres de colores van en inglés y entre comillas.', 'color("red") goes before drawing. Colour names go in quotes.'],
          ['Primero color("red"), después el cuadrado.', 'First color("red"), then the square.']],
      x: ['¿Qué otros colores conoce Code Lab?', 'What other colours does Code Lab know?'] },

    { id: 'fillsquare', ch: 'color', t: ['Cuadrado relleno', 'A filled square'], turtle: true,
      g: ['Pinta un cuadrado azul de lado 100: begin_fill() antes de dibujar y end_fill() al terminar.', 'Paint a blue square with sides of 100: begin_fill() before drawing and end_fill() when you finish.'],
      solution: L(['color("blue")', 'begin_fill()', 'repeat 4:', '  forward(100)', '  turn(90)', 'end_fill()']), par: 6, goal: { fills: {} },
      h: [['begin_fill() empieza a anotar la figura y end_fill() la rellena con el color.', 'begin_fill() starts tracing the shape and end_fill() fills it with the colour.'],
          ['color("blue"), begin_fill(), el cuadrado, end_fill().', 'color("blue"), begin_fill(), the square, end_fill().']],
      x: ['¿Qué pasaría si pones end_fill() antes de dibujar el cuadrado?', 'What would happen if you put end_fill() before drawing the square?'] },

    { id: 'traffic', ch: 'color', t: ['El semáforo', 'The traffic light'], turtle: true,
      g: ['Pinta tres círculos de radio 30, uno encima del otro: rojo en (0, 80), amarillo en (0, 0) y verde en (0, -80). Usa penup(), goto(x, y) y pendown().', 'Paint three circles of radius 30, one above the other: red at (0, 80), yellow at (0, 0) and green at (0, -80). Use penup(), goto(x, y) and pendown().'],
      solution: L(['penup()', 'goto(0, 80)', 'color("red")', 'begin_fill()', 'circle(30)', 'end_fill()', 'goto(0, 0)', 'color("yellow")', 'begin_fill()', 'circle(30)', 'end_fill()', 'goto(0, -80)', 'color("green")', 'begin_fill()', 'circle(30)', 'end_fill()']), par: 16,
      goal: { fills: {} },
      h: [['goto(x, y) lleva a la tortuga a ese punto. El centro de la pantalla es (0, 0).', 'goto(x, y) takes the turtle to that point. The middle of the screen is (0, 0).'],
          ['Para cada luz: goto, color, begin_fill(), circle(30), end_fill().', 'For each light: goto, color, begin_fill(), circle(30), end_fill().']],
      x: ['¿Qué parte se repite en las tres luces? ¿Cómo la acortarías?', 'What repeats in the three lights? How would you make it shorter?'] },

    { id: 'flag', ch: 'color', t: ['La bandera de Chile', 'The flag of Chile'], turtle: true,
      starter: P(L(['# La bandera mide 240 de ancho y 160 de alto (3 a 2).', '# Esquina de abajo a la izquierda: (-120, -80).', BOX_FN, '', '# 1. Franja blanca arriba', '# 2. Franja roja abajo', '# 3. Cuadrado azul arriba a la izquierda', '# 4. Estrella blanca en el centro del cuadrado', '']),
                 L(['# The flag is 240 wide and 160 tall (3 to 2).', '# Bottom-left corner: (-120, -80).', BOX_FN, '', '# 1. White stripe on top', '# 2. Red stripe below', '# 3. Blue square top left', '# 4. White star in the middle of the square', ''])),
      g: ['Dibuja la bandera de Chile: franja blanca arriba, roja abajo, un cuadrado azul arriba a la izquierda (tan alto como la franja blanca) y una estrella blanca de cinco puntas en el centro del cuadrado.', 'Draw the flag of Chile: a white stripe on top, a red stripe below, a blue square at the top left (as tall as the white stripe) and a white five-pointed star in the middle of the square.'],
      solution: L([BOX_FN, 'box(-120, 0, 240, 80, "white")', 'box(-120, -80, 240, 80, "red")', 'box(-120, 0, 80, 80, "blue")',
                   'penup()', 'goto(-91.76, 23.82)', 'setheading(18)', 'pendown()', 'color("white")', 'begin_fill()', 'repeat 5:', '  forward(38.04)', '  turn(144)', 'end_fill()']),
      par: 28, goal: { fills: { spec: flagSpec() } },
      h: [['La bandera mide 240 por 160. Arriba, mitad blanca; abajo, mitad roja. El cuadrado azul mide 80 por 80 y va arriba a la izquierda.', 'The flag is 240 by 160. The top half is white and the bottom half red. The blue square is 80 by 80 at the top left.'],
          ['box(esquina_x, esquina_y, ancho, alto, color): blanca box(-120, 0, 240, 80, "white"), roja box(-120, -80, 240, 80, "red"), azul box(-120, 0, 80, 80, "blue").', 'box(corner_x, corner_y, width, height, colour): white box(-120, 0, 240, 80, "white"), red box(-120, -80, 240, 80, "red"), blue box(-120, 0, 80, 80, "blue").'],
          ['La estrella está centrada en (-80, 40) y cabe en un círculo de radio 20. Empieza en la punta de abajo a la izquierda, (-91.76, 23.82), mirando a 18 grados, y repite 5 veces forward(38.04) con turn(144).', 'The star is centred on (-80, 40) and fits inside a circle of radius 20. Start at its bottom-left point, (-91.76, 23.82), facing 18 degrees, and repeat 5 times forward(38.04) with turn(144).']],
      x: ['¿Por qué importa el orden en que dibujas las cajas?', 'Why does the order in which you draw the boxes matter?'] },

    // ------------------------------------------------------------ lists
    { id: 'names', ch: 'lists', t: ['Saludar a todos', 'Greet everyone'], starter: 'names = ["Ana", "Leo", "Sol"]\n',
      g: ['Ya existe la lista names. Con un ciclo for escribe una línea para cada nombre: Hi, Ana  /  Hi, Leo  /  Hi, Sol', 'The list names already exists. Use a for loop to print a line for each name: Hi, Ana  /  Hi, Leo  /  Hi, Sol'],
      solution: L(['names = ["Ana", "Leo", "Sol"]', 'for name in names:', '  print("Hi, " + name)']), par: 3, goal: { out: ['Hi, Ana', 'Hi, Leo', 'Hi, Sol'], uses: ['for', 'list'] },
      h: [['for name in names: toma un nombre de la lista en cada vuelta.', 'for name in names: takes one name from the list on each turn.'],
          ['Dentro: print("Hi, " + name)', 'Inside: print("Hi, " + name)']],
      x: ['¿Qué pasa si agregas un cuarto nombre a la lista?', 'What happens if you add a fourth name to the list?'] },

    { id: 'total', ch: 'lists', t: ['Sumar la lista', 'Add up the list'], starter: 'numbers = [3, 8, 1, 9, 4]\ntotal = 0\n',
      g: ['Suma todos los números de la lista numbers en la variable total y escribe el resultado.', 'Add all the numbers in the list numbers into the variable total and print the result.'],
      solution: L(['numbers = [3, 8, 1, 9, 4]', 'total = 0', 'for n in numbers:', '  total += n', 'print(total)']), par: 5, goal: { out: ['25'], vars: { total: 25 }, uses: ['loop'] },
      h: [['Recorre la lista con for y ve sumando cada número a total.', 'Go through the list with for and keep adding each number to total.'],
          ['for n in numbers: y dentro total += n. Al final print(total).', 'for n in numbers: and inside it total += n. At the end print(total).']],
      x: ['¿Cuánto vale total después de la segunda vuelta?', 'What is total after the second time round?'] },

    { id: 'biggest', ch: 'lists', t: ['El más grande', 'The biggest one'], starter: 'numbers = [4, 17, 9, 12]\n',
      g: ['Encuentra el número más grande de la lista numbers sin usar max, y escríbelo. Guarda el mejor que has visto en una variable.', 'Find the biggest number in the list numbers without using max, and print it. Keep the best one you have seen so far in a variable.'],
      solution: L(['numbers = [4, 17, 9, 12]', 'biggest = numbers[0]', 'for n in numbers:', '  if n > biggest:', '    biggest = n', 'print(biggest)']), par: 6, goal: { out: ['17'], uses: ['loop', 'if'] },
      h: [['Empieza con biggest = numbers[0] (el primero de la lista tiene lugar 0).', 'Start with biggest = numbers[0] (the first item of a list is spot 0).'],
          ['En el for, si n > biggest entonces biggest = n.', 'In the for loop, if n > biggest then biggest = n.']],
      x: ['¿Funcionaría si la lista tuviera solo números negativos?', 'Would it still work if the list had only negative numbers?'] },

    { id: 'squares', ch: 'lists', t: ['Una lista de cuadrados', 'A list of squares'],
      g: ['Crea una lista vacía squares = [] y agrega con append los cuadrados de 1 a 5 (1×1, 2×2...). Escribe la lista: [1, 4, 9, 16, 25]', 'Make an empty list squares = [] and use append to add the squares of 1 to 5 (1×1, 2×2...). Print the list: [1, 4, 9, 16, 25]'],
      solution: L(['squares = []', 'for n in range(1, 6):', '  squares.append(n * n)', 'print(squares)']), par: 4, goal: { out: ['[1, 4, 9, 16, 25]'], uses: ['method:append'] },
      h: [['lista.append(x) agrega x al final de la lista.', 'list.append(x) adds x to the end of the list.'],
          ['for n in range(1, 6): y dentro squares.append(n * n)', 'for n in range(1, 6): and inside it squares.append(n * n)']],
      x: ['¿Por qué empezamos con una lista vacía?', 'Why do we start with an empty list?'] },

    { id: 'rings', ch: 'lists', t: ['Anillos de colores', 'Colour rings'], turtle: true,
      starter: 'colors = ["red", "orange", "yellow", "green", "blue"]\n',
      g: ['Con la lista colors dibuja 5 círculos con el mismo centro, de radios 20, 40, 60, 80 y 100, cada uno de un color de la lista, en ese orden.', 'Use the list colors to draw 5 circles with the same centre, of radius 20, 40, 60, 80 and 100, each in a colour from the list, in that order.'],
      solution: L(['colors = ["red", "orange", "yellow", "green", "blue"]', 'size = 20', 'for c in colors:', '  color(c)', '  circle(size)', '  size += 20']), par: 6,
      goal: { draw: { colors: true }, uses: ['loop', 'list'] },
      h: [['Recorre la lista: en cada vuelta c es un color. Usa color(c) sin comillas.', 'Go through the list: on each turn c is one colour. Use color(c) with no quotes.'],
          ['Empieza con size = 20, y en cada vuelta circle(size) y size += 20.', 'Start with size = 20, and on each turn circle(size) and size += 20.']],
      x: ['¿Cómo cambiarías el programa para tener 7 anillos?', 'How would you change the program to have 7 rings?'] },

    // ------------------------------------------------------------ functions
    { id: 'greet', ch: 'functions', t: ['Mi primera función', 'My first function'],
      g: ['Escribe una función greet(name) que escriba Hello, y el nombre con un signo de exclamación. Llámala con "Ana" y con "Leo".', 'Write a function greet(name) that prints Hello, and the name with an exclamation mark. Call it with "Ana" and with "Leo".'],
      solution: L(['def greet(name):', '  print("Hello, " + name + "!")', '', 'greet("Ana")', 'greet("Leo")']), par: 4, goal: { out: ['Hello, Ana!', 'Hello, Leo!'], uses: ['def', 'params'] },
      h: [['def nombre(parámetro): crea una función. Lo de adentro va con sangría.', 'def name(parameter): makes a function. What is inside is indented.'],
          ['def greet(name): y dentro print("Hello, " + name + "!"). Después greet("Ana") y greet("Leo") sin sangría.', 'def greet(name): and inside print("Hello, " + name + "!"). Then greet("Ana") and greet("Leo") with no indent.']],
      x: ['¿Qué valor tiene name cada vez que se llama a greet?', 'What value does name have each time greet is called?'] },

    { id: 'squarefn', ch: 'functions', t: ['La función square', 'The square function'], turtle: true,
      g: ['Crea una función square(size) que dibuje un cuadrado de lado size. Llámala con 50 y con 100 para dibujar dos cuadrados desde la misma esquina.', 'Make a function square(size) that draws a square with sides of size. Call it with 50 and with 100 to draw two squares from the same corner.'],
      solution: L(['def square(size):', '  repeat 4:', '    forward(size)', '    turn(90)', '', 'square(50)', 'square(100)']), par: 7, goal: { draw: {}, uses: ['def', 'params'] },
      bridge: { blocks: [{ t: 'callF1' }, { t: 'callF1' }], f1: [{ t: 'repeat', n: 4, body: [{ t: 'move' }, { t: 'turnRight' }] }], note: ['F1 es una función sin nombre propio. Aquí le pones nombre, square, y un número que cambia su tamaño.', 'F1 is a function with no name of its own. Here you give it a name, square, and a number that changes its size.'] },
      h: [['Pon el cuadrado dentro de def square(size): y usa size en vez de 100.', 'Put the square inside def square(size): and use size instead of 100.'],
          ['Después de la función, sin sangría, llama square(50) y square(100).', 'After the function, with no indent, call square(50) and square(100).']],
      x: ['¿Qué ventaja tiene square(size) frente a escribir el cuadrado dos veces?', 'What is the advantage of square(size) over writing the square twice?'] },

    { id: 'doublefn', ch: 'functions', t: ['Devolver un valor', 'Giving a value back'],
      g: ['Escribe una función double(n) que devuelva n por 2 con return. Escribe el resultado de double(21).', 'Write a function double(n) that gives back n times 2 with return. Print the result of double(21).'],
      solution: L(['def double(n):', '  return n * 2', '', 'print(double(21))']), par: 4, goal: { out: ['42'], uses: ['def', 'return'] },
      h: [['return entrega un valor a quien llamó a la función.', 'return hands a value back to whoever called the function.'],
          ['def double(n): return n * 2. Después print(double(21)).', 'def double(n): return n * 2. Then print(double(21)).']],
      x: ['¿Cuál es la diferencia entre return y print dentro de una función?', 'What is the difference between return and print inside a function?'] },

    { id: 'flower', ch: 'functions', t: ['Una flor de cuadrados', 'A flower of squares'], turtle: true,
      g: ['Haz una flor: una función que dibuje un cuadrado y un ciclo que la repita girando un poco cada vez. La flor debe verse igual al girarla 6 veces alrededor del centro.', 'Make a flower: a function that draws a square and a loop that repeats it, turning a little each time. The flower should look the same when turned 6 times round the centre.'],
      solution: L(['def square(size):', '  repeat 4:', '    forward(size)', '    turn(90)', '', 'repeat 12:', '  square(60)', '  turn(30)']), par: 8,
      goal: { sym: { n: 6, min: 20 }, uses: ['def', 'loop'] },
      bridge: { blocks: [{ t: 'repeat', n: 12, body: [{ t: 'callF1' }, { t: 'turnRight' }] }], f1: [{ t: 'repeat', n: 4, body: [{ t: 'move' }, { t: 'turnRight' }] }], note: ['Un Repeat que llama a F1: es el mismo dibujo, pero con nombres.', 'A Repeat that calls F1: the same picture, but with names.'] },
      h: [['Si giras 30 grados después de cada cuadrado, 12 cuadrados dan la vuelta completa.', 'If you turn 30 degrees after each square, 12 squares make a full turn.'],
          ['def square(size): ... y luego repeat 12: con square(60) y turn(30).', 'def square(size): ... then repeat 12: with square(60) and turn(30).']],
      x: ['¿Cuántos grados giras en total y por qué eso cierra la flor?', 'How many degrees do you turn in total, and why does that close the flower?'] },

    { id: 'snowflake', ch: 'functions', t: ['Un copo de nieve', 'A snowflake'], turtle: true,
      g: ['Dibuja un copo de nieve con 6 brazos iguales. Escribe una función para un brazo (con ramitas) que vuelva al centro, y repítela 6 veces girando 60 grados.', 'Draw a snowflake with 6 equal arms. Write a function for one arm (with little twigs) that comes back to the centre, and repeat it 6 times turning 60 degrees.'],
      solution: L(['def twig():', '  turn(45)', '  forward(20)', '  back(20)', '  turn(-90)', '  forward(20)', '  back(20)', '  turn(45)', '', 'def arm():', '  forward(40)', '  twig()', '  forward(30)', '  twig()', '  back(70)', '', 'repeat 6:', '  arm()', '  turn(60)']), par: 19,
      goal: { sym: { n: 6, min: 30 }, uses: ['def', 'loop'] },
      h: [['Si cada brazo vuelve al centro y mira hacia el mismo lado, puedes girar 60 y repetir. 6 por 60 son 360.', 'If every arm comes back to the centre facing the same way, you can turn 60 and repeat. 6 times 60 is 360.'],
          ['back(n) retrocede. Un brazo: avanza, dibuja una ramita, avanza, otra ramita, y retrocede todo.', 'back(n) goes backwards. One arm: go forward, draw a twig, go forward, another twig, then go all the way back.']],
      x: ['¿Por qué es mejor tener una función arm() en vez de escribir todo seis veces?', 'Why is it better to have an arm() function than to write it all six times?'] },

    // ------------------------------------------------------------ big ideas
    { id: 'countdown', ch: 'big', t: ['Cuenta regresiva', 'Countdown'],
      g: ['Escribe una función countdown(n) que se llame a sí misma: escribe n y llama a countdown(n - 1); cuando n llegue a 0 escribe Liftoff! y para. Llama countdown(5).', 'Write a function countdown(n) that calls itself: print n and call countdown(n - 1); when n reaches 0 print Liftoff! and stop. Call countdown(5).'],
      solution: L(['def countdown(n):', '  if n == 0:', '    print("Liftoff!")', '  else:', '    print(n)', '    countdown(n - 1)', '', 'countdown(5)']), par: 8,
      goal: { out: ['5', '4', '3', '2', '1', 'Liftoff!'], uses: ['recursion'] },
      h: [['Una función puede llamarse a sí misma, pero necesita un caso donde se detiene: cuando n == 0.', 'A function can call itself, but it needs a case where it stops: when n == 0.'],
          ['if n == 0: escribe Liftoff!. Si no: escribe n y llama countdown(n - 1).', 'if n == 0: print Liftoff!. Otherwise: print n and call countdown(n - 1).']],
      x: ['¿Qué pasaría si no pusieras el caso n == 0?', 'What would happen if you left out the n == 0 case?'] },

    { id: 'factorial', ch: 'big', t: ['Factorial', 'Factorial'],
      g: ['El factorial de 6 es 6 × 5 × 4 × 3 × 2 × 1. Escribe una función fact(n) que se llame a sí misma y escribe fact(6).', 'The factorial of 6 is 6 × 5 × 4 × 3 × 2 × 1. Write a function fact(n) that calls itself, and print fact(6).'],
      solution: L(['def fact(n):', '  if n <= 1:', '    return 1', '  return n * fact(n - 1)', '', 'print(fact(6))']), par: 6, goal: { out: ['720'], uses: ['recursion', 'return'] },
      h: [['El factorial de n es n por el factorial de n - 1. El factorial de 1 es 1.', 'The factorial of n is n times the factorial of n - 1. The factorial of 1 is 1.'],
          ['if n <= 1: return 1, y si no return n * fact(n - 1).', 'if n <= 1: return 1, and otherwise return n * fact(n - 1).']],
      x: ['Explica con tus palabras qué hace fact(3), paso a paso.', 'Explain in your own words what fact(3) does, step by step.'] },

    { id: 'tree', ch: 'big', t: ['Un árbol fractal', 'A fractal tree'], turtle: true,
      starter: P(L(['# Un árbol que se dibuja a sí mismo.', '# Tronco de 60, cada rama mide 0.7 de la anterior, gira 25 grados, profundidad 5.', 'penup()', 'goto(0, -120)', 'pendown()', '', 'def tree(length, depth):', '  if depth == ___:', '    return', '  forward(length)', '  turn(-___)', '  tree(length * ___, depth - 1)', '  turn(___)', '  tree(length * 0.7, depth - 1)', '  turn(-25)', '  back(length)', '', 'tree(60, 5)', '']),
                 L(['# A tree that draws itself.', '# Trunk 60, each branch is 0.7 of the one before, turn 25 degrees, depth 5.', 'penup()', 'goto(0, -120)', 'pendown()', '', 'def tree(length, depth):', '  if depth == ___:', '    return', '  forward(length)', '  turn(-___)', '  tree(length * ___, depth - 1)', '  turn(___)', '  tree(length * 0.7, depth - 1)', '  turn(-25)', '  back(length)', '', 'tree(60, 5)', ''])),
      g: ['Completa los espacios ___ para dibujar el árbol: el tronco mide 60, cada rama es 0.7 de la anterior, se abre 25 grados a cada lado y el árbol tiene profundidad 5. Empieza en (0, -120).', 'Fill in the blanks ___ to draw the tree: the trunk is 60, each branch is 0.7 of the one before, it opens 25 degrees to each side and the tree is 5 deep. It starts at (0, -120).'],
      solution: L(['penup()', 'goto(0, -120)', 'pendown()', '', 'def tree(length, depth):', '  if depth == 0:', '    return', '  forward(length)', '  turn(-25)', '  tree(length * 0.7, depth - 1)', '  turn(50)', '  tree(length * 0.7, depth - 1)', '  turn(-25)', '  back(length)', '', 'tree(60, 5)']), par: 16,
      goal: { draw: {}, uses: ['recursion'] },
      h: [['La función se detiene cuando depth llega a 0: así el árbol no crece para siempre.', 'The function stops when depth reaches 0, so the tree does not grow forever.'],
          ['Gira -25 (izquierda), dibuja la rama de la izquierda, gira 50 (a la derecha), dibuja la rama de la derecha, y vuelve a girar -25.', 'Turn -25 (left), draw the left branch, turn 50 (to the right), draw the right branch, then turn -25 again.']],
      x: ['¿Cuántas ramas tiene el árbol de profundidad 5? ¿Y el de profundidad 6?', 'How many branches does the tree of depth 5 have? And the one of depth 6?'] },

    { id: 'design', ch: 'big', t: ['Tu propio diseño', 'Your own design'], turtle: true,
      g: ['Crea tu propio dibujo. Debe usar al menos una función, un ciclo y dos colores, y tener 30 líneas o más. ¡Sorpréndenos!', 'Create your own picture. It must use at least one function, one loop and two colours, and have 30 lines or more. Surprise us!'],
      solution: L(['def petal(size):', '  repeat 2:', '    forward(size)', '    turn(60)', '    forward(size)', '    turn(120)', '', 'color("red")', 'repeat 6:', '  petal(80)', '  turn(60)', 'color("blue")', 'repeat 6:', '  petal(40)', '  turn(60)']), par: 15,
      goal: { uses: ['def', 'loop'], custom: function(run) {
        var s = run.turtle ? run.turtle.segs : [], seen = {}, n = 0, i;
        for (i = 0; i < s.length; i++) if (!seen[s[i].c]) { seen[s[i].c] = true; n++; }
        if (s.length < 30) return ['Dibuja al menos 30 líneas.', 'Draw at least 30 lines.'];
        if (n < 2) return ['Usa al menos dos colores con color(...).', 'Use at least two colours with color(...).'];
        return true;
      } },
      h: [['Empieza con una función pequeña, como un pétalo o una casita, y repítela con un ciclo.', 'Start with a small function, like a petal or a little house, and repeat it with a loop.'],
          ['Cambia de color con color(...) entre las partes de tu dibujo.', 'Change colour with color(...) between the parts of your picture.']],
      x: ['Cuéntanos qué dibujaste y qué función o ciclo hace el trabajo más grande.', 'Tell us what you drew and which function or loop does the biggest job.'] }
  ];

  var byId = Object.create(null);
  MISSIONS.forEach(function(m) { byId[m.id] = m; });

  function get(id) { return byId[id] || null; }
  function inChapter(ch) { return MISSIONS.filter(function(m) { return m.ch === ch; }); }
  function starterFor(m, lang) {
    var s = m.starter;
    if (!s) return '';
    if (typeof s === 'string') return s;
    return lang === 'es' ? s.es : s.en;
  }

  var api = {
    CHAPTERS: CHAPTERS, MISSIONS: MISSIONS, CHILE_FLAG: CHILE_FLAG, flagSpec: flagSpec,
    get: get, inChapter: inChapter, starterFor: starterFor
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  return api;
})();
