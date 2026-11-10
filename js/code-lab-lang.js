/* ================================================================
   CODE LAB — the language (js/code-lab-lang.js)

   A tiny Python-like language for kids, with its own tokenizer, parser
   and tree-walking interpreter. Nothing a kid types is ever handed to
   the browser as code: no eval, no new Function, no setTimeout(string).
   The program is turned into a tree of plain objects and walked here.

   What it has: numbers, words (strings), True/False/None, lists,
   variables, + - * / // % **, comparisons, and/or/not, in,
   if/elif/else, repeat N, for ... in, while, break/continue, def with
   parameters and return (recursion works), global, print, a few
   helpers (len, range, str, int, round, ...), list/word methods, and
   a turtle (forward, turn, penup, color, circle, begin_fill, ...).

   Safety: a step limit, a recursion-depth limit, a limit on turtle
   moves and on printed text. The interpreter is a generator, so the
   page can run it in small time slices (Runner.step(ms)) and stay
   responsive. Every error is a CLError with a code, a line number and
   arguments; formatError() turns it into kid-language text (es or en)
   and adds "did you mean" from an edit distance over the words that
   exist.

   Turtle world: x to the right, y up, the turtle starts at (0, 0)
   facing up (heading 0). turn(a) turns right (clockwise) a degrees.
   circle(r) draws a circle of radius r centred on the turtle.
   ================================================================ */

var CodeLabLang = (function() {
  'use strict';

  var LIMITS = {
    steps: 1000000,       // statements run (loop passes count too)
    depth: 150,           // function calls inside each other
    events: 20000,        // turtle moves, turns and fills
    segs: 60000,          // drawn segments (a circle is 72)
    lines: 1000,          // printed lines
    lineChars: 2000,
    listLen: 100000,
    strLen: 100000
  };

  // ---------------------------------------------------------------
  // Errors
  // ---------------------------------------------------------------
  function CLError(code, line, args) {
    this.code = code;
    this.line = line || 0;
    this.args = args || {};
    this.name = 'CLError';
    this.message = code;
  }
  CLError.prototype = Object.create(Error.prototype);
  CLError.prototype.constructor = CLError;

  // [es, en]. *word* marks a word to show in bold. {x} is an argument.
  var MSG = {
    unknownWord: ['No conozco la palabra *{name}*{dym}', "I don't know the word *{name}*{dym}"],
    noValue: ['*{name}* todavía no tiene valor. Dale uno antes, por ejemplo {name} = 5.', "*{name}* doesn't have a value yet. Give it one first, like {name} = 5."],
    needParens: ['Usa paréntesis: *{name}(...)*', 'Use parentheses: *{name}(...)*'],
    missingColon: ['A esta línea le falta un *:* al final.', 'This line needs a *:* at the end.'],
    needIndent: ['Después de los *:* la línea siguiente debe ir más a la derecha (con sangría).', 'After the *:* the next line must be pushed to the right (indented).'],
    unexpectedIndent: ['Esta línea está movida a la derecha sin motivo. Alinéala con la de arriba.', 'This line is pushed to the right for no reason. Line it up with the one above.'],
    badUnindent: ['Esta línea no queda alineada con ningún bloque de arriba.', "This line doesn't line up with any block above it."],
    unclosedString: ['A esta palabra le falta la comilla de cierre.', 'This word is missing its closing quote.'],
    unclosedBracket: ['El *{b}* de aquí nunca se cierra.', 'The *{b}* from here is never closed.'],
    unexpectedClose: ['Hay un *{b}* que no cierra nada.', 'There is a *{b}* with nothing to close.'],
    mismatchBracket: ['Este *{b}* no encaja con el *{o}* que abrió antes.', "This *{b}* doesn't match the *{o}* that was opened before."],
    badChar: ['No entiendo el símbolo *{c}*.', "I don't understand the symbol *{c}*."],
    curly: ['Las llaves no se usan aquí. Las listas usan corchetes [ ].', 'Curly brackets are not used here. Lists use square brackets [ ].'],
    semicolon: ['No hace falta el *;*. Escribe cada instrucción en su propia línea.', "You don't need a *;*. Write each instruction on its own line."],
    badNumber: ['Ese número se ve raro.', 'That number looks odd.'],
    expectedValue: ['Esperaba un valor aquí, pero encontré *{tok}*.', 'I expected a value here, but found *{tok}*.'],
    expectedValueEnd: ['Falta algo al final de esta línea.', 'Something is missing at the end of this line.'],
    expectedName: ['Esperaba un nombre aquí.', 'I expected a name here.'],
    expectedTok: ['Esperaba *{want}* aquí.', 'I expected *{want}* here.'],
    extraStuff: ['No esperaba *{tok}* aquí. ¿Falta algo antes?', "I didn't expect *{tok}* here. Is something missing before it?"],
    assignInCondition: ['Para comparar usa *==*. Un solo *=* guarda un valor.', 'To compare, use *==*. A single *=* stores a value.'],
    elseIf: ['Escribe *elif*, no *else if*.', 'Write *elif*, not *else if*.'],
    strayElse: ['*{word}* necesita un *if* justo antes, alineado igual.', '*{word}* needs an *if* right before it, lined up the same.'],
    notInCodeLab: ['*{name}* todavía no es parte de Code Lab.', '*{name}* is not part of Code Lab yet.'],
    logoEnd: ['Code Lab no usa *end*: el bloque termina cuando la línea vuelve a la izquierda.', 'Code Lab does not use *end*: a block ends when the lines move back to the left.'],
    badTarget: ['Solo puedes guardar un valor en un nombre o en un lugar de una lista, como *x = 5* o *lista[0] = 5*.', 'You can only store a value in a name or a spot in a list, like *x = 5* or *list[0] = 5*.'],
    outsideLoop: ['*{word}* solo funciona dentro de un ciclo (repeat, for o while).', '*{word}* only works inside a loop (repeat, for or while).'],
    outsideFn: ['*return* solo funciona dentro de una función (def).', '*return* only works inside a function (def).'],
    dupParam: ['El nombre *{name}* está dos veces entre los paréntesis.', 'The name *{name}* is used twice in the parentheses.'],
    blank: ['Hay un espacio en blanco *___* aquí. Cámbialo por tu propio código.', 'There is a blank *___* here. Replace it with your own code.'],
    noSlice: ['Cortar listas con *:* no es parte de Code Lab. Usa un solo lugar, como lista[0].', 'Cutting lists with *:* is not part of Code Lab. Use one spot, like list[0].'],
    notAFunction: ['*{name}* no es una función, así que no puedes poner paréntesis después.', '*{name}* is not a function, so you cannot put () after it.'],
    argCount: ['*{name}* necesita {want} entre los paréntesis, pero recibió {got}. Ejemplo: {usage}', '*{name}* needs {want} in the parentheses, but got {got}. Example: {usage}'],
    needNumber: ['*{name}* necesita un número, pero recibió {type}.', '*{name}* needs a number, but got {type}.'],
    needList: ['*{name}* necesita una lista, pero recibió {type}.', '*{name}* needs a list, but got {type}.'],
    badArg: ['*{name}* no puede trabajar con {type}.', '*{name}* cannot work with {type}.'],
    addMismatch: ['No puedes sumar {a} con {b}. Truco: convierte el número en palabra con *str(...)*.', 'You cannot add {a} and {b}. Tip: turn the number into a word with *str(...)*.'],
    opMismatch: ['No puedes usar *{op}* con {a} y {b}.', 'You cannot use *{op}* with {a} and {b}.'],
    cmpMismatch: ['No puedes comparar {a} con {b} usando *{op}*.', 'You cannot compare {a} with {b} using *{op}*.'],
    divZero: ['No se puede dividir por cero.', 'You cannot divide by zero.'],
    indexRange: ['La lista tiene {n} elementos, pero pediste el lugar {i}. Se empieza a contar desde 0: el último es el {last}.', 'The list has {n} items, but you asked for spot {i}. Counting starts at 0, so the last one is {last}.'],
    indexEmpty: ['La lista está vacía, no hay nada en el lugar {i}.', 'The list is empty, so there is nothing at spot {i}.'],
    indexType: ['El lugar en una lista debe ser un número entero.', 'A spot in a list must be a whole number.'],
    notIndexable: ['Solo puedes usar [ ] con una lista o una palabra, no con {type}.', 'You can only use [ ] on a list or a word, not on {type}.'],
    wordImmutable: ['Una palabra no se puede cambiar letra por letra. Arma una nueva.', 'A word cannot be changed letter by letter. Build a new one.'],
    notIterable: ['No puedo recorrer {type} con for. Usa una lista, una palabra o range(...).', 'I cannot go through {type} with for. Use a list, a word or range(...).'],
    needCount: ['*repeat* necesita un número entero, pero recibió {type}.', '*repeat* needs a whole number, but got {type}.'],
    stepLimit: ['¡Uf! Tu programa dio más de {n} pasos. ¿Un ciclo que nunca termina? Revisa la condición de tu *while* o el número de tu *repeat*.', 'Whoa! Your program ran more than {n} steps. Is a loop never ending? Check the condition of your *while* or the number in your *repeat*.'],
    depthLimit: ['Tu función se llamó a sí misma más de {n} veces seguidas. ¿Algo la hace parar? Una función recursiva necesita un caso para detenerse.', 'Your function called itself more than {n} times in a row. Does something make it stop? A function that calls itself needs a case where it stops.'],
    tooManyMoves: ['Tu tortuga se movió más de {n} veces. ¿Hay un ciclo que no termina?', 'Your turtle moved more than {n} times. Is a loop going round forever?'],
    tooMuchOutput: ['Tu programa escribió demasiado texto, así que lo detuve.', 'Your program printed too much text, so I stopped it.'],
    tooBig: ['Ese número o esa lista se hizo demasiado grande para mí.', 'That number or list got too big for me.'],
    badColor: ['No conozco el color *{name}*{dym} Prueba con red, blue, green...', 'I do not know the colour *{name}*{dym} Try red, blue, green...'],
    outerNameChange: ['*{name}* vive fuera de esta función. Para cambiarlo desde adentro, escribe *global {name}* en la primera línea de la función.', '*{name}* lives outside this function. To change it from inside, write *global {name}* on the first line of the function.'],
    stringToNumber: ['No puedo convertir esa palabra en número.', 'I cannot turn that word into a number.'],
    sqrtNeg: ['No se puede sacar la raíz cuadrada de un número negativo.', 'You cannot take the square root of a negative number.'],
    noInput: ['Code Lab todavía no hace preguntas. Guarda la respuesta en una variable.', 'Code Lab cannot ask questions yet. Put the answer in a variable instead.'],
    emptyPop: ['No puedes sacar nada de una lista vacía.', 'You cannot pop from an empty list.'],
    noMethod: ['{type} no tiene *.{name}()*{dym}', '{type} does not have *.{name}()*{dym}'],
    notFound: ['Ese elemento no está en la lista.', 'That item is not in the list.'],
    badRange: ['range necesita números enteros.', 'range needs whole numbers.'],
    zeroStep: ['El paso de range no puede ser 0.', 'The step of range cannot be 0.']
  };

  function plainStr(s) { return String(s).replace(/\*/g, ''); }

  function fillMsg(code, args, lang) {
    var m = MSG[code];
    var idx = lang === 'es' ? 0 : 1;
    var text = m ? m[idx] : code;
    return text.replace(/\{(\w+)\}/g, function(_, k) {
      var v = args && args[k];
      if (k === 'dym') return dymText(v, lang);
      return v === undefined || v === null ? '' : plainStr(v);
    });
  }

  function dymText(sug, lang) {
    if (sug) return lang === 'es' ? ' — ¿quisiste decir *' + sug + '*?' : ' — did you mean *' + sug + '*?';
    return '.';
  }

  // Kid-language text for an error, in 'es' or 'en'. Includes the line.
  function formatBase(err, lang) {
    if (!(err instanceof CLError)) return lang === 'es' ? 'Algo salió mal.' : 'Something went wrong.';
    var body = fillMsg(err.code, err.args, lang === 'es' ? 'es' : 'en');
    var head = err.line ? (lang === 'es' ? 'Línea ' : 'Line ') + err.line + ': ' : '';
    return head + body;
  }

  // ---------------------------------------------------------------
  // Words that exist, and "did you mean"
  // ---------------------------------------------------------------
  var KEYWORDS = ['if', 'elif', 'else', 'repeat', 'for', 'while', 'in', 'def', 'return', 'break', 'continue',
                  'pass', 'global', 'and', 'or', 'not', 'True', 'False', 'None', 'times'];
  var KW = Object.create(null); KEYWORDS.forEach(function(k) { if (k !== 'times') KW[k] = true; });
  var OTHER_PY = ['import', 'from', 'class', 'try', 'except', 'finally', 'lambda', 'with', 'yield', 'del', 'assert', 'raise',
                  'async', 'await', 'nonlocal', 'as', 'is'];
  var OTHER = Object.create(null); OTHER_PY.forEach(function(k) { OTHER[k] = true; });

  // Damerau-Levenshtein (adjacent swap = 1), on lower-case text.
  function editDistance(a, b) {
    a = String(a).toLowerCase(); b = String(b).toLowerCase();
    var n = a.length, m = b.length, i, j, d = [], cost;
    for (i = 0; i <= n; i++) { d[i] = [i]; }
    for (j = 0; j <= m; j++) d[0][j] = j;
    for (i = 1; i <= n; i++) {
      for (j = 1; j <= m; j++) {
        cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[n][m];
  }

  // The closest candidate to `word`, or null. Names under 3 letters only
  // get a suggestion when the difference is just upper/lower case.
  function suggest(word, candidates) {
    word = String(word);
    var best = null, bestD = 99, lw = word.toLowerCase(), i, c, dd, limit;
    for (i = 0; i < candidates.length; i++) {
      c = candidates[i];
      if (c === word) continue;
      if (c.toLowerCase() === lw) return c;
    }
    if (word.length < 3) return null;
    limit = word.length <= 4 ? 1 : word.length <= 8 ? 2 : 3;
    for (i = 0; i < candidates.length; i++) {
      c = candidates[i];
      if (c.length < 3 || c === word) continue;
      if (Math.abs(c.length - word.length) > limit) continue;
      dd = editDistance(word, c);
      if (dd <= limit && (dd < bestD || (dd === bestD && best !== null && c.length < best.length))) { best = c; bestD = dd; }
    }
    return best;
  }

  // ---------------------------------------------------------------
  // Colours
  // ---------------------------------------------------------------
  var COLORS = {
    black: '#1f2430', white: '#ffffff', red: '#d62828', orange: '#f77f00', yellow: '#ffc300', green: '#2a9d3f',
    blue: '#1b4fd1', purple: '#7b2cbf', pink: '#f06292', brown: '#8d5524', gray: '#8a8f98', grey: '#8a8f98',
    cyan: '#17b8d6', navy: '#10246b', gold: '#e0a800', lime: '#7ac943', teal: '#0e8f86', sky: '#5bb8f5'
  };
  var COLOR_NAMES = Object.keys(COLORS);

  function parseHex(s) {
    var m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
    if (!m) return null;
    var h = m[1];
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  // A colour word or #hex to a CSS #rrggbb; null if it is neither.
  function resolveColor(s) {
    if (typeof s !== 'string') return null;
    var k = s.toLowerCase().trim();
    if (Object.prototype.hasOwnProperty.call(COLORS, k)) return COLORS[k];
    var rgb = parseHex(k);
    if (!rgb) return null;
    return '#' + rgb.map(function(n) { return (n < 16 ? '0' : '') + n.toString(16); }).join('');
  }

  // ---------------------------------------------------------------
  // Tokenizer
  // ---------------------------------------------------------------
  var TAB = 4;
  var OPS3 = [];
  var OPS2 = ['**', '//', '==', '!=', '<=', '>=', '+=', '-=', '*=', '/='];
  var OPS1 = '+-*/%<>=()[],:.';
  var OPEN = { '(': ')', '[': ']' };
  var CLOSE = { ')': '(', ']': '[' };
  // opening quote -> the characters that close it (an iPad keyboard can turn " into curly quotes)
  var QUOTE_END = { '"': '"\u201d', '\'': '\'', '\u201c': '\u201d"\u201c', '\u2018': '\u2019\'' };

  function isNameStart(c) { return /[A-Za-z_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]/.test(c); }
  function isNameChar(c) { return /[A-Za-z0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F]/.test(c); }
  function isDigit(c) { return c >= '0' && c <= '9'; }

  // Returns [{t:'NUM'|'STR'|'NAME'|'OP'|'NL'|'INDENT'|'DEDENT'|'EOF', v, line, text}]
  function tokenize(src) {
    src = String(src == null ? '' : src).replace(/\r\n?/g, '\n').replace(/ /g, ' ');
    var toks = [], lines = src.split('\n'), indents = [0], depth = 0, stack = [];
    var ln, line, i, c, n, start, text, endQ, buf, closed, lineNo, ind, two;

    function push(t, v, extra) { var tk = { t: t, v: v, line: lineNo }; if (extra) for (var k in extra) tk[k] = extra[k]; toks.push(tk); return tk; }

    for (ln = 0; ln < lines.length; ln++) {
      line = lines[ln]; lineNo = ln + 1; i = 0; n = line.length;

      if (depth === 0) {
        // indentation of a new statement line
        ind = 0;
        while (i < n && (line.charAt(i) === ' ' || line.charAt(i) === '\t')) { ind += line.charAt(i) === '\t' ? TAB : 1; i++; }
        if (i >= n || line.charAt(i) === '#') continue;               // blank or comment only
        if (ind > indents[indents.length - 1]) {
          indents.push(ind); push('INDENT', ind);
        } else if (ind < indents[indents.length - 1]) {
          while (ind < indents[indents.length - 1]) { indents.pop(); push('DEDENT', ind); }
          if (ind !== indents[indents.length - 1]) throw new CLError('badUnindent', lineNo);
        }
      }

      while (i < n) {
        c = line.charAt(i);
        if (c === ' ' || c === '\t') { i++; continue; }
        if (c === '#') break;
        if (c === '\\' && i === n - 1) { i++; continue; }

        if (isDigit(c)) {
          start = i;
          while (i < n && isDigit(line.charAt(i))) i++;
          if (line.charAt(i) === '.' && isDigit(line.charAt(i + 1) || '')) { i++; while (i < n && isDigit(line.charAt(i))) i++; }
          if (i < n && isNameStart(line.charAt(i))) throw new CLError('badNumber', lineNo);
          text = line.slice(start, i);
          push('NUM', parseFloat(text), { text: text });
          continue;
        }

        if (isNameStart(c)) {
          start = i;
          while (i < n && isNameChar(line.charAt(i))) i++;
          text = line.slice(start, i);
          if (/^_+$/.test(text) && text.length >= 3) throw new CLError('blank', lineNo);
          push('NAME', text);
          continue;
        }

        if (QUOTE_END[c]) {
          endQ = QUOTE_END[c]; i++; buf = ''; closed = false;
          while (i < n) {
            var ch = line.charAt(i);
            if (ch === '\\' && i + 1 < n) {
              var nx = line.charAt(i + 1);
              buf += nx === 'n' ? '\n' : nx === 't' ? '\t' : nx;
              i += 2; continue;
            }
            if (endQ.indexOf(ch) >= 0) { closed = true; i++; break; }
            buf += ch; i++;
          }
          if (!closed) throw new CLError('unclosedString', lineNo);
          push('STR', buf);
          continue;
        }

        two = line.substr(i, 2);
        if (OPS2.indexOf(two) >= 0) { push('OP', two); i += 2; continue; }
        if (c === '−' || c === '–' || c === '—') { push('OP', '-'); i++; continue; }
        if (c === '×') { push('OP', '*'); i++; continue; }
        if (c === '÷') { push('OP', '/'); i++; continue; }
        if (OPS1.indexOf(c) >= 0) {
          if (OPEN[c]) { depth++; stack.push({ b: c, line: lineNo }); }
          else if (CLOSE[c]) {
            if (!stack.length) throw new CLError('unexpectedClose', lineNo, { b: c });
            var top = stack.pop();
            if (top.b !== CLOSE[c]) throw new CLError('mismatchBracket', lineNo, { b: c, o: top.b });
            depth--;
          }
          push('OP', c); i++; continue;
        }
        if (c === '{' || c === '}') throw new CLError('curly', lineNo);
        if (c === ';') throw new CLError('semicolon', lineNo);
        throw new CLError('badChar', lineNo, { c: c });
      }

      if (depth === 0) push('NL', '\n');
    }
    if (stack.length) throw new CLError('unclosedBracket', stack[stack.length - 1].line, { b: stack[stack.length - 1].b });
    lineNo = lines.length;
    if (toks.length && toks[toks.length - 1].t !== 'NL') push('NL', '\n');
    while (indents.length > 1) { indents.pop(); push('DEDENT', 0); }
    push('EOF', null);
    return toks;
  }

  // ---------------------------------------------------------------
  // Builtin table (names, usage text, argument counts)
  // ---------------------------------------------------------------
  var BUILTIN_SPECS = Object.create(null);
  function def(name, min, max, usage, f) { BUILTIN_SPECS[name] = { name: name, min: min, max: max, usage: usage, f: f }; }
  var BUILTIN_NAMES = [];

  // ---------------------------------------------------------------
  // Parser
  // ---------------------------------------------------------------
  function tokText(t) {
    if (!t || t.t === 'NL' || t.t === 'EOF' || t.t === 'INDENT' || t.t === 'DEDENT') return null;
    if (t.t === 'STR') return '"' + t.v + '"';
    if (t.t === 'NUM') return t.text;
    return String(t.v);
  }

  function parse(toks, known) {
    var pos = 0, fnDepth = 0, loopDepth = 0;

    function peek(k) { return toks[pos + (k || 0)] || toks[toks.length - 1]; }
    function next() { return toks[pos++]; }
    function isOp(v, k) { var t = peek(k); return t.t === 'OP' && t.v === v; }
    function isName(v, k) { var t = peek(k); return t.t === 'NAME' && t.v === v; }
    function acceptOp(v) { if (isOp(v)) { pos++; return true; } return false; }
    function expectOp(v, code) {
      if (isOp(v)) return next();
      var t = peek();
      if (code) throw new CLError(code, t.t === 'NL' || t.t === 'EOF' ? lastLine() : t.line);
      if (t.t === 'NL' || t.t === 'EOF') throw new CLError('expectedTok', lastLine(), { want: v });
      throw new CLError('expectedTok', t.line, { want: v });
    }
    function lastLine() { var k = pos - 1; while (k > 0 && (toks[k].t === 'NL' || toks[k].t === 'DEDENT' || toks[k].t === 'INDENT')) k--; return toks[Math.max(k, 0)].line; }
    function skipNL() { while (peek().t === 'NL') pos++; }

    // ----- expressions -----
    function parseExpr() { return parseOr(); }

    function parseOr() {
      var l = parseAnd();
      while (isName('or')) { var t = next(); l = { k: 'logic', op: 'or', l: l, r: parseAnd(), line: t.line }; }
      return l;
    }
    function parseAnd() {
      var l = parseNot();
      while (isName('and')) { var t = next(); l = { k: 'logic', op: 'and', l: l, r: parseNot(), line: t.line }; }
      return l;
    }
    function parseNot() {
      if (isName('not') && !(peek(1).t === 'NAME' && peek(1).v === 'in')) { var t = next(); return { k: 'not', e: parseNot(), line: t.line }; }
      return parseCmp();
    }
    function cmpOpAhead() {
      var t = peek();
      if (t.t === 'OP' && (t.v === '==' || t.v === '!=' || t.v === '<' || t.v === '>' || t.v === '<=' || t.v === '>=')) return t.v;
      if (t.t === 'NAME' && t.v === 'in') return 'in';
      if (t.t === 'NAME' && t.v === 'not' && peek(1).t === 'NAME' && peek(1).v === 'in') return 'not in';
      return null;
    }
    function parseCmp() {
      var l = parseAdd(), op = cmpOpAhead();
      if (!op) return l;
      var node = { k: 'cmp', first: l, ops: [], rest: [], line: peek().line };
      while (op) {
        var t = next(); if (op === 'not in') next();
        node.ops.push(op); node.rest.push(parseAdd()); node.line = t.line;
        op = cmpOpAhead();
      }
      return node;
    }
    function parseAdd() {
      var l = parseMul();
      while (isOp('+') || isOp('-')) { var t = next(); l = { k: 'bin', op: t.v, l: l, r: parseMul(), line: t.line }; }
      return l;
    }
    function parseMul() {
      var l = parseUnary();
      while (isOp('*') || isOp('/') || isOp('//') || isOp('%')) { var t = next(); l = { k: 'bin', op: t.v, l: l, r: parseUnary(), line: t.line }; }
      return l;
    }
    function parseUnary() {
      if (isOp('-')) { var t = next(); return { k: 'neg', e: parseUnary(), line: t.line }; }
      if (isOp('+')) { next(); return parseUnary(); }
      return parsePow();
    }
    function parsePow() {
      var l = parsePostfix();
      if (isOp('**')) { var t = next(); return { k: 'bin', op: '**', l: l, r: parseUnary(), line: t.line }; }
      return l;
    }
    function parseArgs(close) {
      var args = [];
      if (isOp(close)) { next(); return args; }
      for (;;) {
        args.push(parseExpr());
        if (acceptOp(',')) { if (isOp(close)) { next(); return args; } continue; }
        break;
      }
      expectOp(close);
      return args;
    }
    function parsePostfix() {
      var e = parseAtom();
      for (;;) {
        if (isOp('(')) {
          var t = next();
          e = { k: 'call', f: e, args: parseArgs(')'), line: t.line };
        } else if (isOp('[')) {
          var t2 = next();
          var idx = parseExpr();
          if (isOp(':')) throw new CLError('noSlice', peek().line);
          expectOp(']');
          e = { k: 'index', o: e, i: idx, line: t2.line };
        } else if (isOp('.')) {
          var t3 = next(), nm = peek();
          if (nm.t !== 'NAME') throw new CLError('expectedName', t3.line);
          next();
          if (!isOp('(')) throw new CLError('expectedTok', nm.line, { want: '(' });
          next();
          e = { k: 'method', o: e, name: nm.v, args: parseArgs(')'), line: nm.line };
        } else break;
      }
      return e;
    }
    function parseAtom() {
      var t = peek();
      if (t.t === 'NUM') { next(); return { k: 'num', v: t.v, line: t.line }; }
      if (t.t === 'STR') { next(); return { k: 'str', v: t.v, line: t.line }; }
      if (t.t === 'NAME') {
        if (t.v === 'True') { next(); return { k: 'bool', v: true, line: t.line }; }
        if (t.v === 'False') { next(); return { k: 'bool', v: false, line: t.line }; }
        if (t.v === 'None') { next(); return { k: 'none', line: t.line }; }
        if (KW[t.v]) throw new CLError('expectedValue', t.line, { tok: t.v });
        if (OTHER[t.v]) throw new CLError('notInCodeLab', t.line, { name: t.v });
        next();
        return { k: 'name', n: t.v, line: t.line };
      }
      if (t.t === 'OP' && t.v === '(') {
        next(); var e = parseExpr(); expectOp(')'); return e;
      }
      if (t.t === 'OP' && t.v === '[') {
        next(); return { k: 'list', items: parseArgs(']'), line: t.line };
      }
      if (t.t === 'NL' || t.t === 'EOF') throw new CLError('expectedValueEnd', lastLine());
      if (t.t === 'OP' && t.v === '=') throw new CLError('expectedValue', t.line, { tok: '=' });
      throw new CLError('expectedValue', t.line, { tok: tokText(t) || '' });
    }

    // ----- statements -----
    function endStatement() {
      var t = peek();
      if (t.t === 'NL') { next(); return; }
      if (t.t === 'EOF' || t.t === 'DEDENT') return;
      throw new CLError('extraStuff', t.line, { tok: tokText(t) || '' });
    }

    function parseBlock(headLine) {
      if (!isOp(':')) {
        var t = peek();
        // `else if` and friends are caught by the callers; here it is a plain missing colon
        throw new CLError('missingColon', t.t === 'NL' || t.t === 'EOF' ? lastLine() : headLine);
      }
      next();
      var body = [];
      if (peek().t === 'NL') {
        next();
        skipNL();
        if (peek().t !== 'INDENT') throw new CLError('needIndent', headLine);
        next();
        while (peek().t !== 'DEDENT' && peek().t !== 'EOF') {
          skipNL();
          if (peek().t === 'DEDENT' || peek().t === 'EOF') break;
          body.push(parseStatement());
        }
        if (peek().t === 'DEDENT') next();
      } else {
        body.push(parseSimple());
      }
      return body;
    }

    function parseIf() {
      var t = next();                                   // if
      var node = { k: 'if', branches: [], orelse: null, line: t.line };
      var test = parseExpr();
      if (isOp('=')) throw new CLError('assignInCondition', peek().line);
      node.branches.push({ test: test, body: parseBlock(t.line) });
      for (;;) {
        skipNLBeforeElse();
        if (isName('elif')) {
          var te = next();
          var tt = parseExpr();
          if (isOp('=')) throw new CLError('assignInCondition', peek().line);
          node.branches.push({ test: tt, body: parseBlock(te.line) });
        } else if (isName('else')) {
          var tl = next();
          if (isName('if')) throw new CLError('elseIf', tl.line);
          node.orelse = parseBlock(tl.line);
          break;
        } else break;
      }
      return node;
    }
    function skipNLBeforeElse() { /* blocks end with DEDENT, then elif/else follow directly */ }

    function parseSimple() {
      var t = peek();
      if (t.t === 'NAME') {
        switch (t.v) {
          case 'pass': next(); endStatement(); return { k: 'pass', line: t.line };
          case 'break':
            next(); if (loopDepth === 0) throw new CLError('outsideLoop', t.line, { word: 'break' });
            endStatement(); return { k: 'break', line: t.line };
          case 'continue':
            next(); if (loopDepth === 0) throw new CLError('outsideLoop', t.line, { word: 'continue' });
            endStatement(); return { k: 'continue', line: t.line };
          case 'return':
            next(); if (fnDepth === 0) throw new CLError('outsideFn', t.line);
            var v = null;
            if (peek().t !== 'NL' && peek().t !== 'EOF' && peek().t !== 'DEDENT') v = parseExpr();
            endStatement(); return { k: 'return', v: v, line: t.line };
          case 'global':
            next();
            var names = [];
            for (;;) {
              var nt = peek();
              if (nt.t !== 'NAME' || KW[nt.v]) throw new CLError('expectedName', nt.t === 'NL' ? lastLine() : nt.line);
              next(); names.push(nt.v);
              if (!acceptOp(',')) break;
            }
            endStatement(); return { k: 'global', names: names, line: t.line };
          case 'elif': case 'else':
            throw new CLError('strayElse', t.line, { word: t.v });
          case 'end':
            if (peek(1).t === 'NL' || peek(1).t === 'EOF') throw new CLError('logoEnd', t.line);
            break;
          default:
        }
        if (OTHER[t.v]) throw new CLError('notInCodeLab', t.line, { name: t.v });
      }
      // expression or assignment
      var startTok = t;
      // A word followed by something that cannot continue an expression:
      // print "hi", pritn x, fro i in ...
      if (t.t === 'NAME' && !KW[t.v]) {
        var n1 = peek(1);
        if (n1.t === 'STR' || n1.t === 'NUM' || (n1.t === 'NAME' && n1.v !== 'in' && n1.v !== 'and' && n1.v !== 'or' && n1.v !== 'if' && n1.v !== 'else')) {
          var kwSug = suggest(t.v, KEYWORDS.filter(function(k) { return k !== 'times' && k !== 'True' && k !== 'False' && k !== 'None'; }));
          var isFn = known.fns[t.v] || BUILTIN_SPECS[t.v];
          if (isFn) throw new CLError('needParens', t.line, { name: t.v });
          if (kwSug) throw new CLError('unknownWord', t.line, { name: t.v, dym: kwSug });
          var fnSug = suggest(t.v, known.fnNames());
          if (fnSug) throw new CLError('unknownWord', t.line, { name: t.v, dym: fnSug });
          throw new CLError('needParens', t.line, { name: t.v });
        }
      }
      var target = parseExpr();
      var op = peek();
      if (op.t === 'OP' && (op.v === '=' || op.v === '+=' || op.v === '-=' || op.v === '*=' || op.v === '/=')) {
        if (target.k !== 'name' && target.k !== 'index') throw new CLError('badTarget', op.line);
        next();
        var val = parseExpr();
        if (isOp('=')) throw new CLError('badTarget', peek().line);
        endStatement();
        return { k: op.v === '=' ? 'assign' : 'aug', op: op.v.charAt(0), target: target, v: val, line: startTok.line };
      }
      if (op.t === 'NAME' && op.v === 'in' && target.k === 'name') {
        throw new CLError('extraStuff', op.line, { tok: 'in' });
      }
      endStatement();
      return { k: 'expr', e: target, line: startTok.line };
    }

    function parseStatement() {
      var t = peek();
      if (t.t === 'INDENT') throw new CLError('unexpectedIndent', t.line);
      if (t.t === 'NAME') {
        switch (t.v) {
          case 'if': return parseIf();
          case 'repeat':
            next();
            var count = parseExpr();
            if (isName('times')) next();
            loopDepth++;
            var rb = parseBlock(t.line);
            loopDepth--;
            return { k: 'repeat', count: count, body: rb, line: t.line };
          case 'for':
            next();
            var vt = peek();
            if (vt.t !== 'NAME' || KW[vt.v]) throw new CLError('expectedName', vt.line);
            next();
            if (!isName('in')) {
              var ntk = peek();
              throw new CLError('expectedTok', ntk.t === 'NL' ? lastLine() : ntk.line, { want: 'in' });
            }
            next();
            var iter = parseExpr();
            loopDepth++;
            var fb = parseBlock(t.line);
            loopDepth--;
            return { k: 'for', v: vt.v, iter: iter, body: fb, line: t.line };
          case 'while':
            next();
            var test = parseExpr();
            if (isOp('=')) throw new CLError('assignInCondition', peek().line);
            loopDepth++;
            var wb = parseBlock(t.line);
            loopDepth--;
            return { k: 'while', test: test, body: wb, line: t.line };
          case 'def':
            next();
            var nt = peek();
            if (nt.t !== 'NAME' || KW[nt.v]) throw new CLError('expectedName', nt.line);
            next();
            expectOp('(');
            var params = [];
            if (!isOp(')')) {
              for (;;) {
                var pt = peek();
                if (pt.t !== 'NAME' || KW[pt.v]) throw new CLError('expectedName', pt.t === 'NL' ? lastLine() : pt.line);
                if (params.indexOf(pt.v) >= 0) throw new CLError('dupParam', pt.line, { name: pt.v });
                next(); params.push(pt.v);
                if (acceptOp(',')) continue;
                break;
              }
            }
            expectOp(')');
            var savedLoop = loopDepth; loopDepth = 0; fnDepth++;
            var db = parseBlock(t.line);
            fnDepth--; loopDepth = savedLoop;
            return { k: 'def', name: nt.v, params: params, body: db, line: t.line };
          default:
        }
      }
      return parseSimple();
    }

    var body = [];
    skipNL();
    while (peek().t !== 'EOF') {
      body.push(parseStatement());
      skipNL();
      if (peek().t === 'DEDENT') next();
    }
    return { k: 'program', body: body };
  }

  // Names the parser can use to explain a typo: every `def` in the program.
  function scanDefs(toks) {
    var fns = Object.create(null), i;
    for (i = 0; i < toks.length - 1; i++) {
      if (toks[i].t === 'NAME' && toks[i].v === 'def' && toks[i + 1].t === 'NAME') fns[toks[i + 1].v] = true;
    }
    return fns;
  }

  // ---------------------------------------------------------------
  // Analysis: names that exist, features used, line count
  // ---------------------------------------------------------------
  function walk(node, fn) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(function(n) { walk(n, fn); }); return; }
    if (node.k) fn(node);
    var key;
    for (key in node) {
      if (key === 'k' || key === 'line') continue;
      var v = node[key];
      if (v && typeof v === 'object') walk(v, fn);
    }
  }

  function analyze(ast, toks) {
    var defined = Object.create(null), features = Object.create(null), calls = Object.create(null), reads = [];
    walk(ast, function(n) {
      switch (n.k) {
        case 'assign': case 'aug': features.assign = true; if (n.target.k === 'name') defined[n.target.n] = true; else features.index = true; break;
        case 'for': defined[n.v] = true; features['for'] = true; features.loop = true; break;
        case 'repeat': features.repeat = true; features.loop = true; break;
        case 'while': features['while'] = true; features.loop = true; break;
        case 'def': defined[n.name] = true; n.params.forEach(function(p) { defined[p] = true; }); features.def = true; if (n.params.length) features.params = true; break;
        case 'global': n.names.forEach(function(g) { defined[g] = true; }); features.global = true; break;
        case 'if': features['if'] = true; if (n.branches.length > 1) features.elif = true; if (n.orelse) features['else'] = true; break;
        case 'return': features['return'] = true; break;
        case 'list': features.list = true; break;
        case 'index': features.index = true; break;
        case 'str': features.string = true; break;
        case 'cmp': features.compare = true; break;
        case 'bin': features.math = true; break;
        case 'method': features['method:' + n.name] = true; break;
        case 'call': if (n.f.k === 'name') { calls[n.f.n] = true; features['call:' + n.f.n] = true; } break;
        case 'name': reads.push(n); break;
        default:
      }
    });
    // a function that calls itself (directly)
    walk(ast, function(n) {
      if (n.k !== 'def') return;
      walk(n.body, function(m) { if (m.k === 'call' && m.f.k === 'name' && m.f.n === n.name) features.recursion = true; });
    });
    var lineSet = Object.create(null), i;
    for (i = 0; i < toks.length; i++) if (toks[i].t !== 'NL' && toks[i].t !== 'EOF' && toks[i].t !== 'INDENT' && toks[i].t !== 'DEDENT') lineSet[toks[i].line] = true;
    return { defined: defined, features: features, reads: reads, lines: Object.keys(lineSet).length };
  }

  function checkNames(info) {
    var all = Object.keys(info.defined).concat(BUILTIN_NAMES);
    for (var i = 0; i < info.reads.length; i++) {
      var n = info.reads[i];
      if (info.defined[n.n] || BUILTIN_SPECS[n.n]) continue;
      if (n.n === 'input') throw new CLError('noInput', n.line);
      throw new CLError('unknownWord', n.line, { name: n.n, dym: suggest(n.n, all) });
    }
  }

  // Source text to { ast, features, lines }. Throws CLError.
  function compile(src) {
    var toks = tokenize(src);
    var fns = scanDefs(toks);
    var known = { fns: fns, fnNames: function() { return Object.keys(fns).concat(BUILTIN_NAMES); } };
    var ast = parse(toks, known);
    var info = analyze(ast, toks);
    checkNames(info);
    return { ast: ast, features: info.features, lines: info.lines };
  }

  // ---------------------------------------------------------------
  // Values
  // ---------------------------------------------------------------
  function fmtNum(n) {
    if (n === 0) return '0';
    if (Number.isInteger(n)) return String(n);
    if (!isFinite(n)) return n > 0 ? 'inf' : n < 0 ? '-inf' : 'nan';
    return String(parseFloat(n.toPrecision(12)));
  }
  function reprStr(s) { return '\'' + String(s).replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\''; }
  function repr(v, depth) {
    if (typeof v === 'string') return reprStr(v);
    return fmt(v, depth);
  }
  function fmt(v, depth) {
    depth = depth || 0;
    if (v === null || v === undefined) return 'None';
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (typeof v === 'number') return fmtNum(v);
    if (typeof v === 'string') return v;
    if (Array.isArray(v)) {
      if (depth > 6) return '[...]';
      return '[' + v.map(function(x) { return repr(x, depth + 1); }).join(', ') + ']';
    }
    if (v && v.builtin) return '<function ' + v.spec.name + '>';
    if (v && v.params) return '<function ' + v.name + '>';
    return String(v);
  }
  function truthy(v) {
    if (v === null || v === undefined || v === false || v === 0 || v === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }
  function equal(a, b) {
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (!equal(a[i], b[i])) return false;
      return true;
    }
    if (a === undefined) a = null;
    if (b === undefined) b = null;
    return a === b;
  }

  // Language-aware type names are applied when an error is formatted, so
  // an error carries the value's kind and the message picks the words.
  function kindOf(v) {
    if (typeof v === 'number') return 'num';
    if (typeof v === 'string') return 'str';
    if (Array.isArray(v)) return 'list';
    if (typeof v === 'boolean') return 'bool';
    if (v === null || v === undefined) return 'none';
    return 'fn';
  }
  var KIND_NAMES = {
    num: ['un número', 'a number'], str: ['una palabra', 'a word'], list: ['una lista', 'a list'],
    bool: ['un sí/no (True/False)', 'a yes/no (True/False)'], none: ['nada (None)', 'nothing (None)'], fn: ['una función', 'a function']
  };

  // ---------------------------------------------------------------
  // Turtle
  // ---------------------------------------------------------------
  function Turtle() { this.reset(); }
  Turtle.prototype.reset = function() {
    this.x = 0; this.y = 0; this.h = 0; this.pen = true; this.color = COLORS.black; this.width = 3;
    this.filling = false; this.fillPts = null;
    this.events = []; this.segs = []; this.fills = [];
  };
  Turtle.prototype._ev = function(ev) {
    if (this.events.length >= LIMITS.events) throw new CLError('tooManyMoves', 0, { n: LIMITS.events });
    ev.px = this.x; ev.py = this.y; ev.ph = this.h;
    this.events.push(ev);
  };
  Turtle.prototype._to = function(nx, ny) {
    if (!isFinite(nx) || !isFinite(ny)) throw new CLError('tooBig');
    var x1 = this.x, y1 = this.y;
    if (this.pen) {
      if (this.segs.length >= LIMITS.segs) throw new CLError('tooManyMoves', 0, { n: LIMITS.events });
      this.segs.push({ x1: x1, y1: y1, x2: nx, y2: ny, c: this.color, w: this.width });
    }
    this.x = nx; this.y = ny;
    if (this.filling) this.fillPts.push({ x: nx, y: ny });
    this._ev({ t: this.pen ? 'line' : 'move', x1: x1, y1: y1, x2: nx, y2: ny, c: this.color, w: this.width });
  };
  function clean(n) { return Math.abs(n) < 1e-9 ? 0 : Math.round(n * 1e9) / 1e9; }
  Turtle.prototype.forward = function(d) {
    var r = this.h * Math.PI / 180;
    this._to(clean(this.x + d * Math.sin(r)), clean(this.y + d * Math.cos(r)));
  };
  Turtle.prototype.turn = function(a) {
    var h0 = this.h;
    this.h = clean((((this.h + a) % 360) + 360) % 360);
    if (this.h === 360) this.h = 0;
    this._ev({ t: 'turn', h0: h0, h1: this.h });
  };
  Turtle.prototype.goto = function(x, y) { this._to(x, y); };
  Turtle.prototype.setheading = function(a) {
    var h0 = this.h;
    this.h = clean((((a % 360) + 360) % 360));
    this._ev({ t: 'turn', h0: h0, h1: this.h });
  };
  Turtle.prototype.home = function() { this._to(0, 0); this.setheading(0); };
  Turtle.prototype.beginFill = function() { this.filling = true; this.fillPts = [{ x: this.x, y: this.y }]; this.fillAt = this.events.length; };
  Turtle.prototype.endFill = function() {
    if (!this.filling) return;
    this.filling = false;
    if (this.fillPts.length >= 3) this._addFill(this.fillPts, this.color, this.fillAt);
    this.fillPts = null;
  };
  // `at` is where in the event list the shape belongs: a filled shape sits
  // under the lines that were drawn while it was being traced.
  Turtle.prototype._addFill = function(pts, c, at) {
    this.fills.push({ pts: pts, c: c });
    this._ev({ t: 'fill', pts: pts, c: c, at: at });
  };
  Turtle.prototype.circle = function(r) {
    r = Math.abs(r);
    var pts = [], i, a;
    for (i = 0; i < 72; i++) {
      a = i * 5 * Math.PI / 180;
      pts.push({ x: clean(this.x + r * Math.sin(a)), y: clean(this.y + r * Math.cos(a)) });
    }
    if (this.pen) {
      if (this.segs.length + 72 > LIMITS.segs) throw new CLError('tooManyMoves', 0, { n: LIMITS.events });
      for (i = 0; i < 72; i++) {
        var p = pts[i], q = pts[(i + 1) % 72];
        this.segs.push({ x1: p.x, y1: p.y, x2: q.x, y2: q.y, c: this.color, w: this.width });
      }
    }
    if (this.filling) this._addFill(pts, this.color, this.events.length);
    this._ev({ t: 'circle', cx: this.x, cy: this.y, r: r, pts: pts, c: this.color, w: this.width, pen: this.pen });
  };

  // ---------------------------------------------------------------
  // Builtins
  // ---------------------------------------------------------------
  function needNum(m, name, v, line) {
    if (typeof v !== 'number' || !isFinite(v)) throw new CLError('needNumber', line, { name: name, type: { kind: kindOf(v) } });
    return v;
  }
  function needList(name, v, line) {
    if (!Array.isArray(v)) throw new CLError('needList', line, { name: name, type: { kind: kindOf(v) } });
    return v;
  }

  def('print', 0, 99, 'print("hi")', function(m, a) {
    m.printLine(a.map(function(v) { return fmt(v); }).join(' '));
    return null;
  });
  def('forward', 1, 1, 'forward(100)', function(m, a, line) { m.turtle.forward(needNum(m, 'forward', a[0], line)); return null; });
  def('back', 1, 1, 'back(50)', function(m, a, line) { m.turtle.forward(-needNum(m, 'back', a[0], line)); return null; });
  def('turn', 1, 1, 'turn(90)', function(m, a, line) { m.turtle.turn(needNum(m, 'turn', a[0], line)); return null; });
  def('right', 1, 1, 'right(90)', function(m, a, line) { m.turtle.turn(needNum(m, 'right', a[0], line)); return null; });
  def('left', 1, 1, 'left(90)', function(m, a, line) { m.turtle.turn(-needNum(m, 'left', a[0], line)); return null; });
  def('penup', 0, 0, 'penup()', function(m) { m.turtle.pen = false; return null; });
  def('pendown', 0, 0, 'pendown()', function(m) { m.turtle.pen = true; return null; });
  def('color', 1, 1, 'color("red")', function(m, a, line) {
    var c = resolveColor(a[0]);
    if (typeof a[0] !== 'string' || !c) {
      if (typeof a[0] !== 'string') throw new CLError('badArg', line, { name: 'color', type: { kind: kindOf(a[0]) } });
      throw new CLError('badColor', line, { name: String(a[0]).slice(0, 20), dym: suggest(String(a[0]), COLOR_NAMES) });
    }
    m.turtle.color = c;
    return null;
  });
  def('width', 1, 1, 'width(5)', function(m, a, line) {
    var w = needNum(m, 'width', a[0], line);
    m.turtle.width = Math.max(1, Math.min(40, w));
    return null;
  });
  def('goto', 2, 2, 'goto(50, 80)', function(m, a, line) { m.turtle.goto(needNum(m, 'goto', a[0], line), needNum(m, 'goto', a[1], line)); return null; });
  def('setheading', 1, 1, 'setheading(0)', function(m, a, line) { m.turtle.setheading(needNum(m, 'setheading', a[0], line)); return null; });
  def('home', 0, 0, 'home()', function(m) { m.turtle.home(); return null; });
  def('circle', 1, 1, 'circle(50)', function(m, a, line) { m.turtle.circle(needNum(m, 'circle', a[0], line)); return null; });
  def('begin_fill', 0, 0, 'begin_fill()', function(m) { m.turtle.beginFill(); return null; });
  def('end_fill', 0, 0, 'end_fill()', function(m) { m.turtle.endFill(); return null; });
  def('rgb', 3, 3, 'rgb(255, 0, 0)', function(m, a, line) {
    var out = '#';
    for (var i = 0; i < 3; i++) {
      var n = Math.max(0, Math.min(255, Math.round(needNum(m, 'rgb', a[i], line))));
      out += (n < 16 ? '0' : '') + n.toString(16);
    }
    return out;
  });

  def('len', 1, 1, 'len(items)', function(m, a, line) {
    if (typeof a[0] === 'string' || Array.isArray(a[0])) return a[0].length;
    throw new CLError('badArg', line, { name: 'len', type: { kind: kindOf(a[0]) } });
  });
  def('range', 1, 3, 'range(5)', function(m, a, line) {
    var i, s, e, st = 1;
    for (i = 0; i < a.length; i++) if (typeof a[i] !== 'number' || !Number.isInteger(a[i])) throw new CLError('badRange', line);
    if (a.length === 1) { s = 0; e = a[0]; } else { s = a[0]; e = a[1]; if (a.length === 3) st = a[2]; }
    if (st === 0) throw new CLError('zeroStep', line);
    var out = [];
    if (st > 0) { for (i = s; i < e; i += st) { out.push(i); if (out.length > LIMITS.listLen) throw new CLError('tooBig', line); } }
    else { for (i = s; i > e; i += st) { out.push(i); if (out.length > LIMITS.listLen) throw new CLError('tooBig', line); } }
    return out;
  });
  def('str', 1, 1, 'str(5)', function(m, a) { return fmt(a[0]); });
  def('int', 1, 1, 'int("5")', function(m, a, line) {
    var v = a[0];
    if (typeof v === 'number') return v < 0 ? Math.ceil(v) : Math.floor(v);
    if (typeof v === 'string') {
      if (!/^\s*-?\d+(\.\d+)?\s*$/.test(v)) throw new CLError('stringToNumber', line);
      var n = parseFloat(v); return n < 0 ? Math.ceil(n) : Math.floor(n);
    }
    if (typeof v === 'boolean') return v ? 1 : 0;
    throw new CLError('badArg', line, { name: 'int', type: { kind: kindOf(v) } });
  });
  def('float', 1, 1, 'float("2.5")', function(m, a, line) {
    var v = a[0];
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      if (!/^\s*-?\d+(\.\d+)?\s*$/.test(v)) throw new CLError('stringToNumber', line);
      return parseFloat(v);
    }
    throw new CLError('badArg', line, { name: 'float', type: { kind: kindOf(v) } });
  });
  def('round', 1, 2, 'round(3.14159, 2)', function(m, a, line) {
    var x = needNum(m, 'round', a[0], line);
    var d = a.length > 1 ? needNum(m, 'round', a[1], line) : 0;
    var k = Math.pow(10, d);
    return Math.round(x * k) / k;
  });
  def('abs', 1, 1, 'abs(-5)', function(m, a, line) { return Math.abs(needNum(m, 'abs', a[0], line)); });
  def('sqrt', 1, 1, 'sqrt(16)', function(m, a, line) {
    var x = needNum(m, 'sqrt', a[0], line);
    if (x < 0) throw new CLError('sqrtNeg', line);
    return Math.sqrt(x);
  });
  function nums(name, a, line) {
    var items = a.length === 1 && Array.isArray(a[0]) ? a[0] : a;
    if (!items.length) throw new CLError('badArg', line, { name: name, type: { kind: 'list' } });
    items.forEach(function(v) { needNum(null, name, v, line); });
    return items;
  }
  def('min', 1, 99, 'min(3, 8, 5)', function(m, a, line) { return Math.min.apply(null, nums('min', a, line)); });
  def('max', 1, 99, 'max(3, 8, 5)', function(m, a, line) { return Math.max.apply(null, nums('max', a, line)); });
  def('sum', 1, 1, 'sum(numbers)', function(m, a, line) {
    needList('sum', a[0], line);
    var t = 0; a[0].forEach(function(v) { t += needNum(null, 'sum', v, line); });
    return t;
  });
  def('randint', 2, 2, 'randint(1, 6)', function(m, a, line) {
    var lo = Math.ceil(needNum(m, 'randint', a[0], line)), hi = Math.floor(needNum(m, 'randint', a[1], line));
    if (hi < lo) { var t = lo; lo = hi; hi = t; }
    return lo + Math.floor(m.rng() * (hi - lo + 1));
  });
  def('input', 0, 1, 'input()', function(m, a, line) { throw new CLError('noInput', line); });

  BUILTIN_NAMES = Object.keys(BUILTIN_SPECS).filter(function(k) { return k !== 'input'; });

  // Methods on lists and words
  var LIST_METHODS = {
    append: { min: 1, max: 1, f: function(m, o, a) { if (o.length >= LIMITS.listLen) throw new CLError('tooBig'); o.push(a[0]); return null; } },
    pop: { min: 0, max: 1, f: function(m, o, a, line) {
      if (!o.length) throw new CLError('emptyPop', line);
      var i = a.length ? a[0] : o.length - 1;
      if (typeof i !== 'number' || !Number.isInteger(i)) throw new CLError('indexType', line);
      if (i < 0) i += o.length;
      if (i < 0 || i >= o.length) throw new CLError('indexRange', line, { n: o.length, i: a[0], last: o.length - 1 });
      return o.splice(i, 1)[0];
    } },
    insert: { min: 2, max: 2, f: function(m, o, a, line) {
      if (typeof a[0] !== 'number' || !Number.isInteger(a[0])) throw new CLError('indexType', line);
      var i = a[0] < 0 ? Math.max(0, o.length + a[0]) : Math.min(a[0], o.length);
      o.splice(i, 0, a[1]); return null;
    } },
    remove: { min: 1, max: 1, f: function(m, o, a, line) {
      for (var i = 0; i < o.length; i++) if (equal(o[i], a[0])) { o.splice(i, 1); return null; }
      throw new CLError('notFound', line);
    } },
    sort: { min: 0, max: 0, f: function(m, o, a, line) {
      var allNum = o.every(function(v) { return typeof v === 'number'; }), allStr = o.every(function(v) { return typeof v === 'string'; });
      if (!allNum && !allStr) throw new CLError('badArg', line, { name: 'sort', type: { kind: 'list' } });
      o.sort(allNum ? function(x, y) { return x - y; } : function(x, y) { return x < y ? -1 : x > y ? 1 : 0; });
      return null;
    } },
    reverse: { min: 0, max: 0, f: function(m, o) { o.reverse(); return null; } },
    index: { min: 1, max: 1, f: function(m, o, a, line) {
      for (var i = 0; i < o.length; i++) if (equal(o[i], a[0])) return i;
      throw new CLError('notFound', line);
    } }
  };
  var STR_METHODS = {
    upper: { min: 0, max: 0, f: function(m, o) { return o.toUpperCase(); } },
    lower: { min: 0, max: 0, f: function(m, o) { return o.toLowerCase(); } },
    replace: { min: 2, max: 2, f: function(m, o, a, line) {
      if (typeof a[0] !== 'string' || typeof a[1] !== 'string') throw new CLError('badArg', line, { name: 'replace', type: { kind: kindOf(typeof a[0] !== 'string' ? a[0] : a[1]) } });
      return a[0] === '' ? o : o.split(a[0]).join(a[1]);
    } }
  };

  // ---------------------------------------------------------------
  // Interpreter (generator based, so it can run in time slices)
  // ---------------------------------------------------------------
  function Scope(parent, isFn) {
    this.vars = Object.create(null);
    this.parent = parent;
    this.isFn = !!isFn;
    this.globalNames = null;
  }
  Scope.prototype.root = function() { var s = this; while (s.parent) s = s.parent; return s; };
  Scope.prototype.find = function(name) {
    for (var s = this; s; s = s.parent) if (name in s.vars) return s;
    return null;
  };
  Scope.prototype.set = function(name, v) {
    if (this.globalNames && this.globalNames[name]) this.root().vars[name] = v;
    else this.vars[name] = v;
  };

  var BREAK = { k: 'break' }, CONTINUE = { k: 'continue' };

  function Machine(ast, opts) {
    opts = opts || {};
    this.ast = ast;
    this.limits = {};
    for (var k in LIMITS) this.limits[k] = opts.limits && opts.limits[k] !== undefined ? opts.limits[k] : LIMITS[k];
    this.turtle = opts.turtle || new Turtle();
    this.onPrint = opts.onPrint || null;
    this.rng = opts.rng || Math.random;
    this.output = [];
    this.steps = 0;
    this.depth = 0;
    this.globals = new Scope(null, false);
    this.chars = 0;
  }

  Machine.prototype.printLine = function(text) {
    if (this.output.length >= this.limits.lines) throw new CLError('tooMuchOutput');
    if (text.length > this.limits.lineChars) text = text.slice(0, this.limits.lineChars);
    this.chars += text.length;
    if (this.chars > this.limits.lines * 200) throw new CLError('tooMuchOutput');
    this.output.push(text);
    if (this.onPrint) this.onPrint(text);
  };

  Machine.prototype.lookup = function(name, scope, line) {
    var s = scope.find(name);
    if (s) return s.vars[name];
    if (BUILTIN_SPECS[name]) return { builtin: true, spec: BUILTIN_SPECS[name] };
    throw new CLError('noValue', line, { name: name });
  };

  Machine.prototype.bump = function(line) {
    if (++this.steps > this.limits.steps) throw new CLError('stepLimit', line, { n: this.limits.steps });
  };

  function opWords(a, b) { return { a: { kind: kindOf(a) }, b: { kind: kindOf(b) } }; }

  Machine.prototype.binop = function(op, a, b, line) {
    var ta = typeof a, tb = typeof b, r, i, out;
    switch (op) {
      case '+':
        if (ta === 'number' && tb === 'number') return a + b;
        if (ta === 'string' && tb === 'string') {
          if (a.length + b.length > this.limits.strLen) throw new CLError('tooBig', line);
          return a + b;
        }
        if (Array.isArray(a) && Array.isArray(b)) {
          if (a.length + b.length > this.limits.listLen) throw new CLError('tooBig', line);
          return a.concat(b);
        }
        if ((ta === 'string' && tb === 'number') || (ta === 'number' && tb === 'string')) throw new CLError('addMismatch', line, opWords(a, b));
        throw new CLError('opMismatch', line, { op: '+', a: { kind: kindOf(a) }, b: { kind: kindOf(b) } });
      case '-':
        if (ta === 'number' && tb === 'number') return a - b;
        throw new CLError('opMismatch', line, { op: '-', a: { kind: kindOf(a) }, b: { kind: kindOf(b) } });
      case '*':
        if (ta === 'number' && tb === 'number') return a * b;
        if (ta === 'number' && (tb === 'string' || Array.isArray(b))) { r = a; a = b; b = r; ta = typeof a; tb = 'number'; }
        if (tb === 'number' && (ta === 'string' || Array.isArray(a))) {
          if (!Number.isInteger(b) || b < 0) b = Math.max(0, Math.floor(b));
          if (a.length * b > (ta === 'string' ? this.limits.strLen : this.limits.listLen)) throw new CLError('tooBig', line);
          if (ta === 'string') return new Array(b + 1).join(a);
          out = []; for (i = 0; i < b; i++) out = out.concat(a); return out;
        }
        throw new CLError('opMismatch', line, { op: '*', a: { kind: kindOf(a) }, b: { kind: kindOf(b) } });
      case '/':
        if (ta === 'number' && tb === 'number') { if (b === 0) throw new CLError('divZero', line); return a / b; }
        throw new CLError('opMismatch', line, { op: '/', a: { kind: kindOf(a) }, b: { kind: kindOf(b) } });
      case '//':
        if (ta === 'number' && tb === 'number') { if (b === 0) throw new CLError('divZero', line); return Math.floor(a / b); }
        throw new CLError('opMismatch', line, { op: '//', a: { kind: kindOf(a) }, b: { kind: kindOf(b) } });
      case '%':
        if (ta === 'number' && tb === 'number') { if (b === 0) throw new CLError('divZero', line); return ((a % b) + b) % b; }
        throw new CLError('opMismatch', line, { op: '%', a: { kind: kindOf(a) }, b: { kind: kindOf(b) } });
      case '**':
        if (ta === 'number' && tb === 'number') {
          r = Math.pow(a, b);
          if (!isFinite(r) || isNaN(r)) throw new CLError('tooBig', line);
          return r;
        }
        throw new CLError('opMismatch', line, { op: '**', a: { kind: kindOf(a) }, b: { kind: kindOf(b) } });
      default:
        throw new CLError('opMismatch', line, { op: op, a: { kind: kindOf(a) }, b: { kind: kindOf(b) } });
    }
  };

  Machine.prototype.compare = function(op, a, b, line) {
    switch (op) {
      case '==': return equal(a, b);
      case '!=': return !equal(a, b);
      case 'in':
        if (typeof b === 'string' && typeof a === 'string') return b.indexOf(a) >= 0;
        if (Array.isArray(b)) { for (var i = 0; i < b.length; i++) if (equal(b[i], a)) return true; return false; }
        throw new CLError('opMismatch', line, { op: 'in', a: { kind: kindOf(a) }, b: { kind: kindOf(b) } });
      case 'not in': return !this.compare('in', a, b, line);
      default:
        if ((typeof a === 'number' && typeof b === 'number') || (typeof a === 'string' && typeof b === 'string')) {
          return op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b : a >= b;
        }
        throw new CLError('cmpMismatch', line, { op: op, a: { kind: kindOf(a) }, b: { kind: kindOf(b) } });
    }
  };

  Machine.prototype.indexGet = function(o, i, line) {
    if (typeof o !== 'string' && !Array.isArray(o)) throw new CLError('notIndexable', line, { type: { kind: kindOf(o) } });
    if (typeof i !== 'number' || !Number.isInteger(i)) throw new CLError('indexType', line);
    var n = o.length, j = i < 0 ? i + n : i;
    if (j < 0 || j >= n) throw new CLError(n ? 'indexRange' : 'indexEmpty', line, { n: n, i: i, last: n - 1 });
    return o[j];
  };

  Machine.prototype.callBuiltin = function(spec, args, line) {
    if (args.length < spec.min || args.length > spec.max) {
      throw new CLError('argCount', line, { name: spec.name, want: { min: spec.min, max: spec.max }, got: args.length, usage: spec.usage });
    }
    var r;
    try { r = spec.f(this, args, line); }
    catch (e) { if (e instanceof CLError && !e.line) e.line = line; throw e; }
    return r === undefined ? null : r;
  };

  Machine.prototype.callMethod = function(o, name, args, line) {
    var table = Array.isArray(o) ? LIST_METHODS : typeof o === 'string' ? STR_METHODS : null;
    var spec = table && Object.prototype.hasOwnProperty.call(table, name) ? table[name] : null;
    if (!spec) {
      throw new CLError('noMethod', line, { type: { kind: kindOf(o), cap: true }, name: name, dym: table ? suggest(name, Object.keys(table)) : null });
    }
    if (args.length < spec.min || args.length > spec.max) {
      throw new CLError('argCount', line, { name: name, want: { min: spec.min, max: spec.max }, got: args.length, usage: '.' + name + '(...)' });
    }
    var r;
    try { r = spec.f(this, o, args, line); }
    catch (e) { if (e instanceof CLError && !e.line) e.line = line; throw e; }
    return r === undefined ? null : r;
  };

  // plain evaluator for call-free expressions
  Machine.prototype.evs = function(n, scope) {
    var a, b, i, items, out;
    switch (n.k) {
      case 'num': case 'str': case 'bool': return n.v;
      case 'none': return null;
      case 'name': return this.lookup(n.n, scope, n.line);
      case 'list':
        out = []; for (i = 0; i < n.items.length; i++) out.push(this.evs(n.items[i], scope)); return out;
      case 'bin': a = this.evs(n.l, scope); b = this.evs(n.r, scope); return this.binop(n.op, a, b, n.line);
      case 'neg':
        a = this.evs(n.e, scope);
        if (typeof a !== 'number') throw new CLError('opMismatch', n.line, { op: '-', a: { kind: kindOf(a) }, b: { kind: 'num' } });
        return -a;
      case 'not': return !truthy(this.evs(n.e, scope));
      case 'logic':
        a = this.evs(n.l, scope);
        if (n.op === 'and') return truthy(a) ? this.evs(n.r, scope) : a;
        return truthy(a) ? a : this.evs(n.r, scope);
      case 'cmp':
        a = this.evs(n.first, scope);
        for (i = 0; i < n.ops.length; i++) {
          b = this.evs(n.rest[i], scope);
          if (!this.compare(n.ops[i], a, b, n.line)) return false;
          a = b;
        }
        return true;
      case 'index': return this.indexGet(this.evs(n.o, scope), this.evs(n.i, scope), n.line);
      default: throw new CLError('badChar', n.line, { c: '?' });
    }
  };

  function hasCall(n) {
    if (n.hc !== undefined) return n.hc;
    var r = false;
    switch (n.k) {
      case 'call': case 'method': r = true; break;
      case 'list': r = n.items.some(hasCall); break;
      case 'bin': case 'logic': r = hasCall(n.l) || hasCall(n.r); break;
      case 'neg': case 'not': r = hasCall(n.e); break;
      case 'cmp': r = hasCall(n.first) || n.rest.some(hasCall); break;
      case 'index': r = hasCall(n.o) || hasCall(n.i); break;
      default: r = false;
    }
    n.hc = r;
    return r;
  }

  // full evaluator (a generator, because a call may run a whole function)
  Machine.prototype.ev = function*(n, scope) {
    if (!hasCall(n)) return this.evs(n, scope);
    var a, b, i, items, out, args, f;
    switch (n.k) {
      case 'list':
        out = []; for (i = 0; i < n.items.length; i++) out.push(yield* this.ev(n.items[i], scope)); return out;
      case 'bin': a = yield* this.ev(n.l, scope); b = yield* this.ev(n.r, scope); return this.binop(n.op, a, b, n.line);
      case 'neg':
        a = yield* this.ev(n.e, scope);
        if (typeof a !== 'number') throw new CLError('opMismatch', n.line, { op: '-', a: { kind: kindOf(a) }, b: { kind: 'num' } });
        return -a;
      case 'not': return !truthy(yield* this.ev(n.e, scope));
      case 'logic':
        a = yield* this.ev(n.l, scope);
        if (n.op === 'and') return truthy(a) ? yield* this.ev(n.r, scope) : a;
        return truthy(a) ? a : yield* this.ev(n.r, scope);
      case 'cmp':
        a = yield* this.ev(n.first, scope);
        for (i = 0; i < n.ops.length; i++) {
          b = yield* this.ev(n.rest[i], scope);
          if (!this.compare(n.ops[i], a, b, n.line)) return false;
          a = b;
        }
        return true;
      case 'index': a = yield* this.ev(n.o, scope); b = yield* this.ev(n.i, scope); return this.indexGet(a, b, n.line);
      case 'method':
        a = yield* this.ev(n.o, scope);
        args = []; for (i = 0; i < n.args.length; i++) args.push(yield* this.ev(n.args[i], scope));
        return this.callMethod(a, n.name, args, n.line);
      case 'call':
        f = yield* this.ev(n.f, scope);
        args = []; for (i = 0; i < n.args.length; i++) args.push(yield* this.ev(n.args[i], scope));
        return yield* this.callValue(f, args, n);
      default: return this.evs(n, scope);
    }
  };

  Machine.prototype.callValue = function*(f, args, node) {
    var line = node.line;
    if (f && f.builtin) return this.callBuiltin(f.spec, args, line);
    if (f && f.params) {
      if (args.length !== f.params.length) {
        throw new CLError('argCount', line, { name: f.name, want: { min: f.params.length, max: f.params.length }, got: args.length, usage: f.name + '(' + f.params.join(', ') + ')' });
      }
      if (this.depth >= this.limits.depth) throw new CLError('depthLimit', line, { n: this.limits.depth });
      this.depth++;
      var sc = new Scope(f.scope, true), i;
      for (i = 0; i < f.params.length; i++) sc.vars[f.params[i]] = args[i];
      var sig = yield* this.execBlock(f.body, sc);
      this.depth--;
      return sig && sig.k === 'return' ? sig.v : null;
    }
    var nm = node.f && node.f.k === 'name' ? node.f.n : '';
    throw new CLError('notAFunction', line, { name: nm || fmt(f) });
  };

  Machine.prototype.execBlock = function*(stmts, scope) {
    for (var i = 0; i < stmts.length; i++) {
      var sig = yield* this.exec(stmts[i], scope);
      if (sig) return sig;
    }
    return null;
  };

  Machine.prototype.assignTo = function*(target, val, scope) {
    if (target.k === 'name') { scope.set(target.n, val); return; }
    var o = yield* this.ev(target.o, scope), i = yield* this.ev(target.i, scope);
    if (typeof o === 'string') throw new CLError('wordImmutable', target.line);
    if (!Array.isArray(o)) throw new CLError('notIndexable', target.line, { type: { kind: kindOf(o) } });
    if (typeof i !== 'number' || !Number.isInteger(i)) throw new CLError('indexType', target.line);
    var j = i < 0 ? i + o.length : i;
    if (j < 0 || j >= o.length) throw new CLError(o.length ? 'indexRange' : 'indexEmpty', target.line, { n: o.length, i: i, last: o.length - 1 });
    o[j] = val;
  };

  Machine.prototype.exec = function*(s, scope) {
    this.bump(s.line);
    if ((this.steps & 255) === 0) yield 'slice';
    var v, i, items, sig, cnt;
    switch (s.k) {
      case 'expr': yield* this.ev(s.e, scope); return null;
      case 'pass': return null;
      case 'assign': v = yield* this.ev(s.v, scope); yield* this.assignTo(s.target, v, scope); return null;
      case 'aug':
        v = yield* this.ev(s.v, scope);
        if (s.target.k === 'name') {
          var nm = s.target.n, own = scope.find(nm);
          if (scope.isFn && !(scope.globalNames && scope.globalNames[nm]) && own !== scope) {
            if (own) throw new CLError('outerNameChange', s.line, { name: nm });
          }
          if (!own) throw new CLError('noValue', s.line, { name: nm });
          var cur = own.vars[nm];
          scope.set(nm, this.binop(s.op, cur, v, s.line));
        } else {
          var cur2 = yield* this.ev(s.target, scope);
          yield* this.assignTo(s.target, this.binop(s.op, cur2, v, s.line), scope);
        }
        return null;
      case 'if':
        for (i = 0; i < s.branches.length; i++) {
          if (truthy(yield* this.ev(s.branches[i].test, scope))) return yield* this.execBlock(s.branches[i].body, scope);
        }
        if (s.orelse) return yield* this.execBlock(s.orelse, scope);
        return null;
      case 'repeat':
        cnt = yield* this.ev(s.count, scope);
        if (typeof cnt !== 'number' || !Number.isInteger(cnt)) throw new CLError('needCount', s.line, { type: { kind: kindOf(cnt) } });
        for (i = 0; i < cnt; i++) {
          this.bump(s.line);
          sig = yield* this.execBlock(s.body, scope);
          if (sig) { if (sig === BREAK) break; if (sig === CONTINUE) continue; return sig; }
        }
        return null;
      case 'for':
        v = yield* this.ev(s.iter, scope);
        if (typeof v === 'string') items = v.split('');
        else if (Array.isArray(v)) items = v.slice();
        else throw new CLError('notIterable', s.line, { type: { kind: kindOf(v) } });
        for (i = 0; i < items.length; i++) {
          this.bump(s.line);
          scope.set(s.v, items[i]);
          sig = yield* this.execBlock(s.body, scope);
          if (sig) { if (sig === BREAK) break; if (sig === CONTINUE) continue; return sig; }
        }
        return null;
      case 'while':
        while (truthy(yield* this.ev(s.test, scope))) {
          this.bump(s.line);
          if ((this.steps & 255) === 0) yield 'slice';
          sig = yield* this.execBlock(s.body, scope);
          if (sig) { if (sig === BREAK) break; if (sig === CONTINUE) continue; return sig; }
        }
        return null;
      case 'def':
        scope.set(s.name, { params: s.params, body: s.body, name: s.name, scope: scope });
        return null;
      case 'return':
        v = s.v ? yield* this.ev(s.v, scope) : null;
        return { k: 'return', v: v };
      case 'break': return BREAK;
      case 'continue': return CONTINUE;
      case 'global':
        scope.globalNames = scope.globalNames || Object.create(null);
        s.names.forEach(function(g) { scope.globalNames[g] = true; });
        return null;
      default:
        throw new CLError('badChar', s.line, { c: '?' });
    }
  };

  Machine.prototype.run = function*() {
    yield* this.execBlock(this.ast.body, this.globals);
  };

  Machine.prototype.snapshot = function() {
    var out = Object.create(null), k, vars = this.globals.vars;
    for (k in vars) {
      var v = vars[k];
      if (v && (v.params || v.builtin)) continue;
      out[k] = Array.isArray(v) ? JSON.parse(JSON.stringify(v)) : v;
    }
    return out;
  };

  function now() { return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(); }

  // A runner for the page: step(ms) runs for about that long and returns
  // { done: bool, error: CLError|null }. stop() ends it.
  function Runner(src, opts) {
    this.error = null;
    this.compiled = null;
    this.stopped = false;
    this.done = false;
    try {
      this.compiled = compile(src);
    } catch (e) {
      if (e instanceof CLError) { this.error = e; this.done = true; return; }
      throw e;
    }
    this.machine = new Machine(this.compiled.ast, opts);
    this.gen = this.machine.run();
  }
  Runner.prototype.step = function(ms) {
    if (this.done) return { done: true, error: this.error };
    var t0 = now();
    try {
      for (;;) {
        var r = this.gen.next();
        if (r.done) { this.done = true; break; }
        if (ms !== Infinity && now() - t0 >= ms) break;
      }
    } catch (e) {
      this.done = true;
      if (e instanceof CLError) {
        this.error = e;
      } else if (e instanceof RangeError) {
        this.error = new CLError('depthLimit', 0, { n: this.machine.limits.depth });
      } else {
        throw e;
      }
    }
    return { done: this.done, error: this.error };
  };
  Runner.prototype.stop = function() { this.stopped = true; this.done = true; };
  Runner.prototype.result = function() {
    var m = this.machine;
    return {
      ok: !this.error,
      error: this.error,
      output: m ? m.output.slice() : [],
      vars: m ? m.snapshot() : {},
      turtle: m ? m.turtle : null,
      features: this.compiled ? this.compiled.features : {},
      lines: this.compiled ? this.compiled.lines : 0,
      steps: m ? m.steps : 0
    };
  };

  // Run a program to the end (tests, goal checks). Same result shape.
  function run(src, opts) {
    var r = new Runner(src, opts);
    r.step(Infinity);
    return r.result();
  }

  // Error text with kinds, counts and usage worked out for a language.
  function prepareArgs(err, lang) {
    var es = lang === 'es', a = {}, k, v;
    for (k in err.args) {
      v = err.args[k];
      if (v && typeof v === 'object' && v.kind) {
        var s = KIND_NAMES[v.kind][es ? 0 : 1];
        a[k] = v.cap ? s.charAt(0).toUpperCase() + s.slice(1) : s;
      } else if (k === 'want' && v && typeof v === 'object') {
        var lo = v.min, hi = v.max;
        if (lo === hi) a[k] = es ? (lo === 0 ? 'nada' : lo === 1 ? '1 cosa' : lo + ' cosas') : (lo === 0 ? 'nothing' : lo === 1 ? '1 thing' : lo + ' things');
        else a[k] = hi >= 99 ? (es ? 'al menos ' + lo + ' cosa(s)' : 'at least ' + lo + ' thing(s)') : (es ? lo + ' a ' + hi + ' cosas' : lo + ' to ' + hi + ' things');
      } else if (k === 'got' && typeof v === 'number') {
        a[k] = es ? (v === 0 ? 'nada' : v === 1 ? '1' : String(v)) : (v === 0 ? 'nothing' : String(v));
      } else if (k === 'dym') {
        a[k] = v;
      } else {
        a[k] = v;
      }
    }
    return a;
  }

  function formatError(err, lang) {
    if (!(err instanceof CLError)) return formatBase(err, lang);
    return formatBase(new CLError(err.code, err.line, prepareArgs(err, lang)), lang);
  }

  return {
    LIMITS: LIMITS, CLError: CLError, KEYWORDS: KEYWORDS, COLORS: COLORS, COLOR_NAMES: COLOR_NAMES,
    BUILTINS: BUILTIN_SPECS, BUILTIN_NAMES: BUILTIN_NAMES,
    tokenize: tokenize, compile: compile, Runner: Runner, run: run, Turtle: Turtle, Machine: Machine,
    formatError: formatError,
    editDistance: editDistance, suggest: suggest, resolveColor: resolveColor, fmt: fmt
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = CodeLabLang;
