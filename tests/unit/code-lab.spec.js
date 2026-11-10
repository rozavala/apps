// @ts-check
// Code Lab, part 1 (no browser): the language (tokenizer, parser,
// interpreter and turtle), the goal checks, and every mission. Each
// mission's reference solution must pass its own goal check, its starter
// code must not, and a handful of near-miss programs must not either.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const L = require('../../js/code-lab-lang.js');
const Check = require('../../js/code-lab-check.js');
const M = require('../../js/code-lab-missions.js');

const ROOT = path.resolve(__dirname, '../..');
const run = (src, opts) => L.run(src, opts);
const out = (src) => run(src).output;
const err = (src) => run(src).error;
const msg = (src, lang = 'en') => L.formatError(run(src).error, lang);
const mission = (id) => M.get(id);
const solves = (id, src) => Check.evaluate(mission(id), run(src)).ok;

test.describe('Tokenizer', () => {
  test('indentation makes INDENT and DEDENT, blank and comment lines are ignored', () => {
    const t = L.tokenize('if x:\n  y = 1\n\n  # note\nz = 2\n').map(k => k.t);
    expect(t).toEqual(['NAME', 'NAME', 'OP', 'NL', 'INDENT', 'NAME', 'OP', 'NUM', 'NL', 'DEDENT', 'NAME', 'OP', 'NUM', 'NL', 'EOF']);
  });
  test('brackets join lines', () => {
    expect(out('a = [1,\n  2,\n  3]\nprint(a)')).toEqual(['[1, 2, 3]']);
  });
  test('curly quotes from a touch keyboard close a string, and an apostrophe inside stays', () => {
    expect(out('print(\u201cit\u2019s ok\u201d)')).toEqual(['it\u2019s ok']);
    expect(out('print("it\'s")')).toEqual(['it\'s']);
  });
  test('escapes in strings', () => {
    expect(out('print("a\\tb\\\\c")')).toEqual(['a\tb\\c']);
  });
  test('a tab counts as an indent step', () => {
    expect(out('repeat 2:\n\tprint(1)')).toEqual(['1', '1']);
  });
  test('typographic minus and times signs work', () => {
    expect(out('print(5 \u2212 2, 3 \u00d7 4)')).toEqual(['3 12']);
  });
  test('error codes and lines', () => {
    expect(err('x = "abc').code).toBe('unclosedString');
    expect(err('x = (1 + 2').code).toBe('unclosedBracket');
    expect(err('x = (1 + 2').line).toBe(1);
    expect(err('print(1))').code).toBe('unexpectedClose');
    expect(err('x = (1]').code).toBe('mismatchBracket');
    expect(err('x = 3abc').code).toBe('badNumber');
    expect(err('x = $5').code).toBe('badChar');
    expect(err('x = {1}').code).toBe('curly');
    expect(err('x = 1;').code).toBe('semicolon');
    expect(err('if True:\n    x = 1\n  y = 2').code).toBe('badUnindent');
    expect(err('x = 1\n  y = 2').code).toBe('unexpectedIndent');
    expect(err('x = ___').code).toBe('blank');
  });
});

test.describe('Parser and kid-language errors', () => {
  test('forwrd: did you mean forward, with the line number', () => {
    expect(msg('x = 1\nforwrd(100)')).toBe('Line 2: I don\'t know the word *forwrd* \u2014 did you mean *forward*?');
    expect(msg('x = 1\nforwrd(100)', 'es')).toBe('L\u00ednea 2: No conozco la palabra *forwrd* \u2014 \u00bfquisiste decir *forward*?');
  });
  test('a wrong-case word, a swapped pair and a typo of a keyword all get a suggestion', () => {
    expect(err('Forward(10)').args.dym).toBe('forward');
    expect(err('pritn("hi")').args.dym).toBe('print');
    expect(err('fro i in range(3):\n  print(i)').args.dym).toBe('for');
    expect(err('whlie True:\n  pass').args.dym).toBe('while');
    expect(err('colr("red")').args.dym).toBe('color');
  });
  test('a name that matches nothing gets no suggestion', () => {
    const e = err('zzzzzz(1)');
    expect(e.code).toBe('unknownWord');
    expect(e.args.dym).toBeFalsy();
  });
  test('names defined by the kid are suggested too', () => {
    expect(err('total = 1\nprint(totl)').args.dym).toBe('total');
    expect(err('def square(n):\n  pass\nsquar(3)').args.dym).toBe('square');
  });
  test('edit distance counts a swap as one', () => {
    expect(L.editDistance('forwrad', 'forward')).toBe(1);
    expect(L.editDistance('kitten', 'sitting')).toBe(3);
    expect(L.suggest('x', ['xy', 'y'])).toBe(null);
  });
  test('the usual slips', () => {
    expect(err('print "hi"').code).toBe('needParens');
    expect(err('x = 3\nif x > 2\n  print(1)').code).toBe('missingColon');
    expect(err('if True:\nprint(1)').code).toBe('needIndent');
    expect(err('x = 1\nif x = 1:\n  pass').code).toBe('assignInCondition');
    expect(err('if True:\n  pass\nelse if True:\n  pass').code).toBe('elseIf');
    expect(err('else:\n  pass').code).toBe('strayElse');
    expect(err('break').code).toBe('outsideLoop');
    expect(err('return 1').code).toBe('outsideFn');
    expect(err('def f(a, a):\n  pass').code).toBe('dupParam');
    expect(err('import os').code).toBe('notInCodeLab');
    expect(err('x = input()').code).toBe('noInput');
    expect(err('a = [1,2,3]\nb = a[1:2]').code).toBe('noSlice');
    expect(err('3 = x').code).toBe('badTarget');
    expect(err('print(1 +)').code).toBe('expectedValue');
    expect(err('x =').code).toBe('expectedValueEnd');
    expect(err('print(1) print(2)').code).toBe('extraStuff');
    expect(err('end').code).toBe('logoEnd');
  });
  test('every error code has a message in both languages', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/code-lab-lang.js'), 'utf8');
    const codes = new Set([...src.matchAll(/new CLError\('(\w+)'/g)].map(m => m[1]));
    const table = src.slice(src.indexOf('var MSG = {'), src.indexOf('function plainStr'));
    for (const c of codes) {
      const m = new RegExp('\\b' + c + ':\\s*\\[\\s*\'([^\']|\\\\\')+\',\\s*(\'|")').exec(table);
      expect(m, c + ' has a message').toBeTruthy();
    }
  });
  test('messages never carry kid text in bold or the asterisks they type', () => {
    const e = new L.CLError('unknownWord', 1, { name: 'a*b' });
    expect(L.formatError(e, 'en')).not.toContain('a*b');
  });
});

test.describe('Interpreter', () => {
  test('arithmetic and precedence', () => {
    expect(out('print(2 + 3 * 4, (2 + 3) * 4, 7 // 2, 7 % 3, -7 % 3, 2 ** 3 ** 2, -2 ** 2, 10 / 4)')).toEqual(['14 20 3 1 2 512 -4 2.5']);
  });
  test('floating point is printed tidily', () => {
    expect(out('print(0.1 + 0.2, 1 / 3)')).toEqual(['0.3 0.333333333333']);
  });
  test('strings, indexes and methods', () => {
    expect(out('s = "Hello"\nprint(s + "!", s * 2, s[0], s[-1], len(s), s.upper(), s.lower(), s.replace("l", "L"), "ell" in s)')).toEqual(['Hello! HelloHello H o 5 HELLO hello HeLLo True']);
  });
  test('comparisons, chains, logic and truthiness', () => {
    expect(out('print(1 < 2 < 3, 3 < 2 < 5, 1 == 1.0, "a" == "a", [1, 2] == [1, 2], not 0, 0 or "x", [] and 1, None == None, 1 != 2, 5 not in [1, 2])'))
      .toEqual(['True False True True True True x [] True True True']);
  });
  test('if, elif, else', () => {
    const src = n => `x = ${n}\nif x < 0:\n  print("neg")\nelif x == 0:\n  print("zero")\nelse:\n  print("pos")`;
    expect([-1, 0, 1].map(n => out(src(n))[0])).toEqual(['neg', 'zero', 'pos']);
  });
  test('loops: repeat, for over lists, words and range, while, break, continue', () => {
    expect(out('repeat 3:\n  print("a")')).toEqual(['a', 'a', 'a']);
    expect(out('repeat 2 times:\n  print("b")')).toEqual(['b', 'b']);
    expect(out('for c in "hi":\n  print(c)')).toEqual(['h', 'i']);
    expect(out('print(range(3), range(2, 5), range(10, 0, -3))')).toEqual(['[0, 1, 2] [2, 3, 4] [10, 7, 4, 1]']);
    expect(out('x = 0\nwhile x < 3:\n  x += 1\nprint(x)')).toEqual(['3']);
    expect(out('for i in range(10):\n  if i == 2:\n    continue\n  if i == 4:\n    break\n  print(i)')).toEqual(['0', '1', '3']);
    expect(out('repeat 0:\n  print(1)\nprint("done")')).toEqual(['done']);
  });
  test('lists: index, assign, append, pop, insert, remove, sort, reverse, +, *', () => {
    expect(out('a = [3, 1, 2]\na.append(0)\na[0] = 9\nprint(len(a), a.pop(), a)')).toEqual(['4 0 [9, 1, 2]']);
    expect(out('a = [3, 1, 2]\na.sort()\nprint(a)\na.reverse()\nprint(a)\na.insert(1, 7)\na.remove(2)\nprint(a, [1] + [2], [0] * 3, sum(a), min(a), max(a))')).toEqual(['[1, 2, 3]', '[3, 2, 1]', '[3, 7, 1] [1, 2] [0, 0, 0] 11 1 7']);
    expect(out('a = [[1, 2], [3]]\na[0][1] = 5\nprint(a, len(a[0]))')).toEqual(['[[1, 5], [3]] 2']);
    expect(out('a = [1, 2]\na[-1] += 10\nprint(a)')).toEqual(['[1, 12]']);
  });
  test('helper functions', () => {
    expect(out('print(str(5) + "x", int("42") + 1, int(3.9), int(-3.9), round(2.567, 1), round(2.5), abs(-4), sqrt(16), float("2.5"))')).toEqual(['5x 43 3 -3 2.6 3 4 4 2.5']);
    expect(out('x = randint(1, 6)\nprint(x >= 1 and x <= 6)')).toEqual(['True']);
  });
  test('functions: parameters, return, recursion, defaults to None', () => {
    expect(out('def add(a, b):\n  return a + b\nprint(add(2, 3))')).toEqual(['5']);
    expect(out('def f():\n  pass\nprint(f())')).toEqual(['None']);
    expect(out('def fact(n):\n  if n <= 1:\n    return 1\n  return n * fact(n - 1)\nprint(fact(10))')).toEqual(['3628800']);
    expect(out('def fib(n):\n  if n < 2:\n    return n\n  return fib(n - 1) + fib(n - 2)\nprint(fib(15))')).toEqual(['610']);
    expect(out('def f(n):\n  for i in range(5):\n    if i == n:\n      return i * 10\n  return -1\nprint(f(3), f(9))')).toEqual(['30 -1']);
  });
  test('scoping: parameters and assignments are local, reading sees outside, global writes out', () => {
    expect(out('x = 1\ndef f():\n  x = 99\nf()\nprint(x)')).toEqual(['1']);
    expect(out('x = 5\ndef f():\n  print(x)\nf()')).toEqual(['5']);
    expect(out('def f(x):\n  x = x + 1\n  return x\nx = 1\nprint(f(x), x)')).toEqual(['2 1']);
    expect(out('n = 0\ndef bump():\n  global n\n  n += 1\nbump()\nbump()\nprint(n)')).toEqual(['2']);
    expect(out('def outer():\n  y = 3\n  def inner():\n    return y * 2\n  return inner()\nprint(outer())')).toEqual(['6']);
    expect(out('def f():\n  return t\nt = 4\nprint(f())')).toEqual(['4']);
    expect(err('x = 1\ndef f():\n  x += 1\nf()').code).toBe('outerNameChange');
    expect(err('def f():\n  y = 1\nf()\nprint(y)').code).toBe('noValue');
  });
  test('a loop variable lives on after the loop, like in Python', () => {
    expect(out('for i in range(3):\n  pass\nprint(i)')).toEqual(['2']);
  });
  test('runtime errors', () => {
    expect(err('print(1 / 0)').code).toBe('divZero');
    expect(err('print(1 // 0)').code).toBe('divZero');
    expect(err('print(5 % 0)').code).toBe('divZero');
    expect(err('a = [1, 2]\nprint(a[5])').code).toBe('indexRange');
    expect(msg('a = [1, 2]\nprint(a[5])')).toContain('The list has 2 items');
    expect(err('a = []\nprint(a[0])').code).toBe('indexEmpty');
    expect(err('print("a" + 5)').code).toBe('addMismatch');
    expect(err('print([1] - 1)').code).toBe('opMismatch');
    expect(err('print("a" < 1)').code).toBe('cmpMismatch');
    expect(err('forward("a")').code).toBe('needNumber');
    expect(err('forward()').code).toBe('argCount');
    expect(msg('forward()')).toBe('Line 1: *forward* needs 1 thing in the parentheses, but got nothing. Example: forward(100)');
    expect(err('x = 3\nx()').code).toBe('notAFunction');
    expect(err('def f(a):\n  pass\nf(1, 2)').code).toBe('argCount');
    expect(err('for i in 5:\n  pass').code).toBe('notIterable');
    expect(err('repeat "a":\n  pass').code).toBe('needCount');
    expect(err('print(sqrt(-1))').code).toBe('sqrtNeg');
    expect(err('print(int("abc"))').code).toBe('stringToNumber');
    expect(err('[].pop()').code).toBe('emptyPop');
    expect(err('a = 5\na.append(1)').code).toBe('noMethod');
    expect(msg('a = [1]\na.apend(1)')).toContain('did you mean *append*');
    expect(err('s = "abc"\ns[0] = "x"').code).toBe('wordImmutable');
    expect(err('print(y)\ny = 1').code).toBe('noValue');
    expect(err('color("blu")').code).toBe('badColor');
    expect(msg('color("blu")')).toContain('did you mean *blue*');
    expect(err('print(10 ** 1000)').code).toBe('tooBig');
    expect(err('x = "a" * 1000000').code).toBe('tooBig');
  });
  test('the line of a runtime error is the line it happened on, even inside a function', () => {
    const e = err('def f(a):\n  return 1 / a\n\nprint(1)\nf(0)');
    expect(e.code).toBe('divZero');
    expect(e.line).toBe(2);
    expect(err('x = 1\ny = 2\nforward("a")').line).toBe(3);
  });
});

test.describe('Safety: nothing runs as JavaScript, and nothing runs forever', () => {
  test('the language files never evaluate text', () => {
    for (const f of ['js/code-lab-lang.js', 'js/code-lab-check.js', 'js/code-lab-missions.js', 'js/code-lab.js']) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(src, f).not.toMatch(/\beval\s*\(/);
      expect(src, f).not.toMatch(/new\s+Function\b/);
      expect(src, f).not.toMatch(/\bFunction\s*\(/);
      expect(src, f).not.toMatch(/setTimeout\s*\(\s*['"`]/);
      expect(src, f).not.toMatch(/setInterval\s*\(\s*['"`]/);
      expect(src, f).not.toMatch(/document\.write/);
    }
  });
  test('JavaScript-looking text is just words the language does not know', () => {
    expect(err('eval("1 + 1")').code).toBe('unknownWord');
    expect(err('alert(1)').code).toBe('unknownWord');
    expect(err('window.location = "x"')).toBeTruthy();           // a dot is only for list and word methods
    expect(err('window.open("x")').code).toBe('unknownWord');
    expect(err('constructor("x")()').code).toBe('unknownWord');
    expect(out('toString = 5\nconstructor = 6\nprint(toString, constructor)')).toEqual(['5 6']);
    expect(err('print(constructor)').code).toBe('unknownWord');
    expect(err('print(hasOwnProperty)').code).toBe('unknownWord');
  });
  test('the page never uses innerHTML on kid text', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/code-lab.js'), 'utf8');
    // innerHTML only appears in h()'s html attribute, fed by Art (static SVG)
    const uses = [...src.matchAll(/innerHTML/g)].length;
    expect(uses).toBeLessThanOrEqual(2);
    expect(src).toMatch(/html: Art\./);
    expect(src).not.toMatch(/html:\s*(m\.|data\.|r\.|f\.name|name|code|text|v\b)/);
  });
  test('a loop that never ends stops at the step limit with a kind message', () => {
    const t0 = Date.now();
    const r = run('while True:\n  pass');
    expect(r.error.code).toBe('stepLimit');
    expect(r.error.line).toBe(2);
    expect(L.formatError(r.error, 'en')).toContain('Is a loop never ending?');
    expect(Date.now() - t0).toBeLessThan(3000);
    expect(r.steps).toBeLessThanOrEqual(L.LIMITS.steps + 1);
  });
  test('infinite recursion stops at the depth limit', () => {
    const r = run('def f(n):\n  return f(n + 1)\nf(0)');
    expect(r.error.code).toBe('depthLimit');
    expect(L.formatError(r.error, 'es')).toContain('se llam\u00f3 a s\u00ed misma');
    // and the limit is generous enough for honest recursion
    expect(out('def s(n):\n  if n == 0:\n    return 0\n  return n + s(n - 1)\nprint(s(140))')).toEqual(['9870']);
  });
  test('a nested call inside expressions cannot blow the JS stack', () => {
    const r = run('def f(n):\n  return [f(n + 1)]\nf(0)');
    expect(r.error.code).toBe('depthLimit');
  });
  test('a turtle that never stops moving is cut off', () => {
    const r = run('while True:\n  forward(1)\n  turn(1)');
    expect(r.error.code).toBe('tooManyMoves');
    expect(r.turtle.events.length).toBeLessThanOrEqual(L.LIMITS.events);
  });
  test('too much printing is cut off', () => {
    const r = run('while True:\n  print("x")');
    expect(r.error.code).toBe('tooMuchOutput');
    expect(r.output.length).toBeLessThanOrEqual(L.LIMITS.lines);
  });
  test('a runner works in slices: it yields, and finishing gives the same answer', () => {
    const r = new L.Runner('x = 0\nrepeat 5000:\n  x += 1\nprint(x)');
    let slices = 0, s;
    do { s = r.step(0); slices++; } while (!s.done && slices < 100000);
    expect(s.done).toBe(true);
    expect(slices).toBeGreaterThan(5);
    expect(r.result().output).toEqual(['5000']);
  });
  test('stopping a runner ends it', () => {
    const r = new L.Runner('while True:\n  pass');
    r.step(2);
    r.stop();
    expect(r.step(5).done).toBe(true);
  });
  test('a limit can be lowered for a run', () => {
    expect(run('repeat 100:\n  pass', { limits: { steps: 50 } }).error.code).toBe('stepLimit');
  });
  test('the page waits for time slices, not for the whole program', () => {
    const r = new L.Runner('repeat 200000:\n  pass');
    const t0 = Date.now(); r.step(5);
    expect(Date.now() - t0).toBeLessThan(250);
  });
});

test.describe('Turtle', () => {
  const T = (src) => run(src).turtle;
  test('starts at the middle facing up, forward goes up, turn goes right', () => {
    const t = T('forward(100)\nturn(90)\nforward(50)');
    expect(t.segs.map(s => [s.x1, s.y1, s.x2, s.y2])).toEqual([[0, 0, 0, 100], [0, 100, 50, 100]]);
    expect(t.h).toBe(90);
    const l = T('left(90)\nforward(10)');
    expect([l.x, l.y]).toEqual([-10, 0]);
    const b = T('back(30)');
    expect([b.x, b.y]).toEqual([0, -30]);
  });
  test('headings wrap and stay tidy', () => {
    expect(T('turn(450)').h).toBe(90);
    expect(T('turn(-90)').h).toBe(270);
    expect(T('repeat 360:\n  turn(1)').h).toBe(0);
    expect(T('setheading(180)\nforward(10)').y).toBe(-10);
  });
  test('a square comes back to where it started', () => {
    const t = T('repeat 4:\n  forward(100)\n  turn(90)');
    expect(Math.abs(t.x) + Math.abs(t.y)).toBeLessThan(1e-6);
    expect(t.segs.length).toBe(4);
  });
  test('penup moves without drawing, pendown draws again', () => {
    const t = T('penup()\nforward(50)\npendown()\nforward(50)');
    expect(t.segs.length).toBe(1);
    expect(t.segs[0].y1).toBe(50);
    expect(t.events.map(e => e.t)).toEqual(['move', 'line']);
  });
  test('goto, home, width and colours', () => {
    const t = T('color("red")\nwidth(7)\ngoto(30, 40)\nhome()');
    expect(t.segs.length).toBe(2);
    expect(t.segs[0]).toMatchObject({ x2: 30, y2: 40, w: 7, c: L.COLORS.red });
    expect([t.x, t.y, t.h]).toEqual([0, 0, 0]);
    expect(T('color("#0f0")').color).toBe('#00ff00');
    expect(run('print(rgb(255, 0, 16))').output).toEqual(['#ff0010']);
  });
  test('circle is centred on the turtle and closed', () => {
    const t = T('goto(10, 20)\ncircle(50)');
    expect(t.segs.length).toBe(1 + 72);
    const pts = t.segs.slice(1);
    for (const s of pts) expect(Math.abs(Math.hypot(s.x1 - 10, s.y1 - 20) - 50)).toBeLessThan(1e-6);
    expect([t.x, t.y]).toEqual([10, 20]);
  });
  test('fills trace the path between begin_fill and end_fill; a circle fills itself', () => {
    const t = T('begin_fill()\nrepeat 4:\n  forward(10)\n  turn(90)\nend_fill()');
    expect(t.fills.length).toBe(1);
    expect(t.fills[0].pts.length).toBe(5);
    const c = T('begin_fill()\ncircle(5)\nend_fill()');
    expect(c.fills.length).toBe(1);
    expect(c.fills[0].pts.length).toBe(72);
    expect(T('end_fill()').fills.length).toBe(0);
  });
  test('a filled shape is placed under the lines drawn while tracing it', () => {
    const t = T('begin_fill()\nforward(10)\nturn(120)\nforward(10)\nturn(120)\nforward(10)\nend_fill()');
    const fill = t.events.find(e => e.t === 'fill');
    expect(fill.at).toBe(0);
  });
});

test.describe('Goal checks', () => {
  test('a drawing matches whichever way it was drawn', () => {
    const ref = run('repeat 4:\n  forward(100)\n  turn(90)').turtle.segs;
    const ccw = run('repeat 4:\n  forward(100)\n  turn(-90)').turtle.segs;       // the other way: different square
    const split = run('repeat 8:\n  forward(50)\n  if True:\n    pass\nturn(90)').turtle.segs;
    expect(Check.compareDrawing(ref, ref).ok).toBe(true);
    expect(Check.compareDrawing(ccw, ref).ok).toBe(false);
    expect(Check.compareDrawing(split, ref).ok).toBe(false);
    const same = run('forward(100)\nturn(90)\nforward(50)\nforward(50)\nturn(90)\nforward(100)\nturn(90)\nforward(100)\nturn(90)').turtle.segs;
    expect(Check.compareDrawing(same, ref).ok).toBe(true);
  });
  test('a small error is allowed, a big one is not', () => {
    const ref = run('repeat 4:\n  forward(100)\n  turn(90)').turtle.segs;
    expect(Check.compareDrawing(run('repeat 4:\n  forward(103)\n  turn(90)').turtle.segs, ref).ok).toBe(true);
    expect(Check.compareDrawing(run('repeat 4:\n  forward(115)\n  turn(90)').turtle.segs, ref).ok).toBe(false);
    expect(Check.compareDrawing([], ref).ok).toBe(false);
  });
  test('extra lines count against a drawing', () => {
    const ref = run('repeat 4:\n  forward(100)\n  turn(90)').turtle.segs;
    const more = run('repeat 4:\n  forward(100)\n  turn(90)\nturn(45)\nforward(60)').turtle.segs;
    const r = Check.compareDrawing(more, ref);
    expect(r.ok).toBe(false);
    expect(r.covered).toBeGreaterThan(0.99);
    expect(r.clean).toBeLessThan(0.97);
  });
  test('colour counts only when asked', () => {
    const red = run('color("red")\nforward(100)').turtle.segs, blue = run('color("blue")\nforward(100)').turtle.segs;
    expect(Check.compareDrawing(blue, red, { colors: false }).ok).toBe(true);
    expect(Check.compareDrawing(blue, red, { colors: true }).ok).toBe(false);
    expect(Check.sameColor('#d62828', '#d92a2a')).toBe(true);
  });
  test('translate and similar-size comparison', () => {
    const ref = run('repeat 4:\n  forward(100)\n  turn(90)').turtle.segs;
    const moved = run('penup()\ngoto(-50, 70)\npendown()\nrepeat 4:\n  forward(100)\n  turn(90)').turtle.segs;
    const small = run('repeat 4:\n  forward(60)\n  turn(90)').turtle.segs;
    expect(Check.compareDrawing(moved, ref).ok).toBe(false);
    expect(Check.compareDrawing(moved, ref, { inv: 'translate' }).ok).toBe(true);
    expect(Check.compareDrawing(small, ref, { inv: 'translate' }).ok).toBe(false);
    expect(Check.compareDrawing(small, ref, { inv: 'similar' }).ok).toBe(true);
  });
  test('turning symmetry', () => {
    const six = run('repeat 6:\n  forward(50)\n  back(50)\n  turn(60)').turtle.segs;
    const lopsided = run('repeat 5:\n  forward(50)\n  back(50)\n  turn(60)').turtle.segs;
    expect(Check.symmetric(six, 6, 6)).toBeGreaterThan(0.95);
    expect(Check.symmetric(lopsided, 6, 6)).toBeLessThan(0.9);
    expect(Check.symmetric(six, 12, 6)).toBeLessThan(0.9);
  });
  test('fills compare as painted, with colours', () => {
    const a = run('color("red")\nbegin_fill()\nrepeat 4:\n  forward(50)\n  turn(90)\nend_fill()').turtle.fills;
    const b = run('color("blue")\nbegin_fill()\nrepeat 4:\n  forward(50)\n  turn(90)\nend_fill()').turtle.fills;
    const c = run('color("red")\nbegin_fill()\nrepeat 4:\n  forward(60)\n  turn(90)\nend_fill()').turtle.fills;
    expect(Check.compareFills(a, a).ok).toBe(true);
    expect(Check.compareFills(b, a).ok).toBe(false);
    expect(Check.compareFills(c, a).ok).toBe(false);
    expect(Check.compareFills([], a).ok).toBe(false);
  });
  test('point in polygon uses the non-zero rule, so a pentagram is full', () => {
    const star = run('begin_fill()\nrepeat 5:\n  forward(100)\n  turn(144)\nend_fill()').turtle.fills;
    const pts = star[0].pts, cx = pts.slice(0, 5).reduce((n, p) => n + p.x, 0) / 5, cy = pts.slice(0, 5).reduce((n, p) => n + p.y, 0) / 5;
    expect(Check.inPoly(cx, cy, pts)).toBe(true);                // the middle of the star
    expect(Check.inPoly(cx + 200, cy, pts)).toBe(false);
  });
  test('feature requirements and messages', () => {
    const m = { id: 'x1', goal: { out: ['1'], uses: ['loop'] }, solution: '' };
    const r = Check.evaluate(m, run('print(1)'));
    expect(r.ok).toBe(false);
    expect(r.notes[0][1]).toContain('a loop');
    expect(Check.evaluate(m, run('repeat 1:\n  print(1)')).ok).toBe(true);
  });
  test('output mismatches say where', () => {
    const m = mission('lines3');
    expect(Check.evaluate(m, run('print("one")\nprint("tow")\nprint("three")')).notes[0][1]).toContain('Line 2 should say "two"');
    expect(Check.evaluate(m, run('print("one")')).notes[0][1]).toContain('missing');
    expect(Check.evaluate(m, run('x = 1')).notes[0][1]).toContain('did not print');
  });
  test('stars: solved, no hints, a short program', () => {
    const m = mission('squareloop');
    const short = run(m.solution), long = run('forward(100)\nturn(90)\nforward(100)\nturn(90)\nforward(100)\nturn(90)\nforward(100)\nturn(90)');
    expect(Check.starsFor(m, short, 0)).toBe(3);
    expect(Check.starsFor(m, short, 1)).toBe(2);
    expect(Check.starsFor(m, long, 0)).toBe(2);
    expect(Check.starsFor(m, long, 2)).toBe(1);
  });
});

test.describe('Missions', () => {
  test('there are at least 30, in chapters, with unique ids, from print to a fractal tree', () => {
    expect(M.MISSIONS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(M.MISSIONS.map(m => m.id)).size).toBe(M.MISSIONS.length);
    const chapters = new Set(M.CHAPTERS.map(c => c.id));
    for (const m of M.MISSIONS) expect(chapters.has(m.ch), m.id).toBe(true);
    for (const c of M.CHAPTERS) expect(M.inChapter(c.id).length, c.id).toBeGreaterThan(0);
    expect(M.MISSIONS[0].solution).toContain('print(');
    expect(M.get('tree').solution).toContain('tree(');
    expect(M.get('tree').goal.uses).toContain('recursion');
  });
  test('every mission has text in both languages, hints, a solution and an explain question', () => {
    for (const m of M.MISSIONS) {
      for (const p of [m.t, m.g, m.x]) { expect(p, m.id).toHaveLength(2); expect(p[0].length, m.id).toBeGreaterThan(3); expect(p[1].length, m.id).toBeGreaterThan(3); }
      expect(m.h.length, m.id + ' hints').toBeGreaterThanOrEqual(2);
      for (const hp of m.h) { expect(hp[0].length).toBeGreaterThan(3); expect(hp[1].length).toBeGreaterThan(3); }
      expect(m.solution.length, m.id).toBeGreaterThan(5);
      expect(m.goal, m.id).toBeTruthy();
    }
  });
  test('every reference solution runs cleanly and passes its own goal check', () => {
    for (const m of M.MISSIONS) {
      const r = run(m.solution);
      expect(r.error && L.formatError(r.error, 'en'), m.id + ' runs').toBeFalsy();
      const ev = Check.evaluate(m, r);
      expect(ev.ok, m.id + ' passes: ' + JSON.stringify(ev.notes)).toBe(true);
      expect(r.lines, m.id + ' is within its par').toBeLessThanOrEqual(m.par);
      expect(Check.starsFor(m, r, 0), m.id + ' earns 3 stars').toBe(3);
    }
  });
  test('no starter already solves its mission, and no empty program does', () => {
    for (const m of M.MISSIONS) {
      for (const lang of ['es', 'en']) {
        const st = M.starterFor(m, lang);
        const r = run(st);
        if (!r.error) expect(Check.evaluate(m, r).ok, m.id + ' starter (' + lang + ')').toBe(false);
      }
      expect(Check.evaluate(m, run('')).ok, m.id + ' empty').toBe(false);
    }
  });
  test('the starters with blanks say so until they are filled in', () => {
    expect(err(M.starterFor(mission('tree'), 'en')).code).toBe('blank');
    expect(err(M.starterFor(mission('tree'), 'es')).code).toBe('blank');
    expect(err(M.starterFor(mission('tree'), 'en')).line).toBe(8);
  });
  test('a drawing mission has a turtle; a printing mission does not draw', () => {
    for (const m of M.MISSIONS) {
      const r = run(m.solution), drew = r.turtle.events.length > 0;
      if (m.goal.draw || m.goal.fills || m.goal.sym) expect(m.turtle, m.id).toBe(true);
      if (m.goal.out) expect(drew, m.id + ' prints, does not draw').toBe(false);
    }
  });
  test('the Code Cadet bridge: the first turtle missions show blocks beside their text', () => {
    const turtle = M.inChapter('turtle');
    expect(turtle.slice(0, 5).every(m => m.bridge)).toBe(true);
    for (const m of M.MISSIONS.filter(x => x.bridge)) {
      expect(m.bridge.blocks.length, m.id).toBeGreaterThan(0);
      expect(m.bridge.note, m.id).toHaveLength(2);
      const known = ['move', 'turnLeft', 'turnRight', 'repeat', 'forLoop', 'callF1'];
      const walk = (list) => list.forEach(b => { expect(known, m.id + ' ' + b.t).toContain(b.t); if (b.body) walk(b.body); });
      walk(m.bridge.blocks); if (m.bridge.f1) walk(m.bridge.f1);
    }
    // the blocks and the text mean the same: a Repeat 4 of Move and Turn right is repeat 4 of forward and turn(90)
    const sq = mission('squareloop');
    expect(sq.bridge.blocks[0]).toMatchObject({ t: 'repeat', n: 4 });
    expect(sq.solution).toContain('repeat 4:');
    // and it names the same blocks that Code Cadet really has
    const cc = fs.readFileSync(path.join(ROOT, 'js/code-cadet.js'), 'utf8');
    for (const k of ['move', 'turnRight', 'repeat', 'forLoop', 'callF1']) expect(cc).toContain(k + ':');
  });
  test('explain prompts are for 12 and up (the page shows them from that age)', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/code-lab.js'), 'utf8');
    expect(src).toMatch(/age >= 12/);
  });

  // ---- near misses: a mission is not solved by something close
  test('near misses do not pass', () => {
    expect(solves('hello', 'print("hello")')).toBe(false);
    expect(solves('hello', 'print("Hello")\nprint("Hello")')).toBe(false);
    expect(solves('variable', 'lucky = 8\nprint(lucky)')).toBe(false);
    expect(solves('variable', 'print(7)')).toBe(false);
    expect(solves('math', 'print(63)')).toBe(false);          // must be a sum
    expect(solves('hexagon', 'repeat 6:\n  forward(60)\n  turn(60)')).toBe(false);   // asks for the variables
    expect(solves('hexagon', 'sides = 6\nlength = 60\nrepeat sides:\n  forward(length)\n  turn(360 / sides)')).toBe(true);
    expect(solves('squareloop', 'forward(100)\nturn(90)\nforward(100)\nturn(90)\nforward(100)\nturn(90)\nforward(100)\nturn(90)')).toBe(false);   // asks for a loop
    expect(solves('square', 'repeat 4:\n  forward(100)\n  turn(-90)')).toBe(false);
    expect(solves('triangle', 'repeat 3:\n  forward(100)\n  turn(60)')).toBe(false);
    expect(solves('star', 'repeat 5:\n  forward(100)\n  turn(72)')).toBe(false);
    expect(solves('dashes', 'repeat 5:\n  forward(20)\n  forward(20)')).toBe(false);
    expect(solves('circles', 'circle(30)\ncircle(50)')).toBe(false);
    expect(solves('evens', 'for n in range(1, 21):\n  if n % 2 == 0:\n    print(n)\nprint(21)')).toBe(false);
    expect(solves('evens', 'for n in range(2, 21, 2):\n  print(n)')).toBe(false);   // asks for if
    expect(solves('count10', 'for i in range(10):\n  print(i)')).toBe(false);
    expect(solves('fizz', 'for n in range(1, 16):\n  if n % 3 == 0:\n    print("Fizz")\n  elif n % 5 == 0:\n    print("Buzz")\n  else:\n    print(n)')).toBe(false);
    expect(solves('redsquare', 'repeat 4:\n  forward(100)\n  turn(90)')).toBe(false);   // not red
    expect(solves('redsquare', 'color("blue")\nrepeat 4:\n  forward(100)\n  turn(90)')).toBe(false);
    expect(solves('fillsquare', 'color("blue")\nrepeat 4:\n  forward(100)\n  turn(90)')).toBe(false);   // no fill
    expect(solves('fillsquare', 'color("red")\nbegin_fill()\nrepeat 4:\n  forward(100)\n  turn(90)\nend_fill()')).toBe(false);
    expect(solves('squares', 'print([1, 4, 9, 16, 25])')).toBe(false);
    expect(solves('greet', 'print("Hello, Ana!")\nprint("Hello, Leo!")')).toBe(false);    // asks for a function
    expect(solves('doublefn', 'def double(n):\n  print(n * 2)\ndouble(21)')).toBe(false);
    expect(solves('countdown', 'for n in range(5, 0, -1):\n  print(n)\nprint("Liftoff!")')).toBe(false);    // asks for recursion
    expect(solves('factorial', 'print(720)')).toBe(false);
    expect(solves('spiral', 'repeat 40:\n  forward(50)\n  turn(90)')).toBe(false);
    expect(solves('spiral', 'size = 200\nrepeat 40:\n  forward(size)\n  turn(90)\n  size -= 5')).toBe(false);
    expect(solves('flower', 'repeat 4:\n  forward(60)\n  turn(90)')).toBe(false);
    expect(solves('design', 'color("red")\nforward(10)')).toBe(false);
  });
  test('other honest solutions pass', () => {
    expect(solves('hello', 'print("Hello")')).toBe(true);
    expect(solves('name', 'print("Ana")')).toBe(true);
    expect(solves('square', 'repeat 4:\n  forward(100)\n  turn(90)')).toBe(true);
    expect(solves('square', 'forward(100)\nturn(90)\nforward(100)\nturn(90)\nforward(100)\nturn(90)\nforward(100)')).toBe(true);
    expect(solves('triangle', 'for i in range(3):\n  forward(100)\n  turn(120)')).toBe(true);
    expect(solves('star', 'i = 0\nwhile i < 5:\n  forward(100)\n  turn(144)\n  i += 1')).toBe(true);
    expect(solves('evens', 'n = 2\nwhile n <= 20:\n  if n % 2 == 0:\n    print(n)\n  n += 1')).toBe(true);
    expect(solves('count10', 'for n in range(1, 11):\n  print(n)')).toBe(true);
    expect(solves('count10', 'n = 1\nwhile n <= 10:\n  print(n)\n  n += 1')).toBe(false);      // asks for a for loop
    expect(solves('table', 'for i in range(1, 11):\n  print("7 x " + str(i) + " = " + str(i * 7))')).toBe(true);
    expect(solves('greet', 'def greet(who):\n  print("Hello, " + who + "!")\ngreet("Ana")\ngreet("Leo")')).toBe(true);
    expect(solves('countdown', 'def countdown(n):\n  print(n)\n  if n > 1:\n    countdown(n - 1)\n  else:\n    print("Liftoff!")\ncountdown(5)')).toBe(true);
    expect(solves('flower', 'def sq(s):\n  repeat 4:\n    forward(s)\n    turn(90)\nfor i in range(6):\n  sq(80)\n  turn(60)')).toBe(true);
    expect(solves('total', 'numbers = [3, 8, 1, 9, 4]\ntotal = 0\nfor n in numbers:\n  total = total + n\nprint(total)')).toBe(true);
    expect(solves('names', 'names = ["Ana", "Leo", "Sol"]\nfor x in names:\n  print("Hi, " + x)')).toBe(true);
    expect(solves('tree', M.get('tree').solution.replace('turn(-25)\n  tree', 'left(25)\n  tree'))).toBe(true);
  });
  test('the tree is not matched by other angles or sizes', () => {
    const base = M.get('tree').solution;
    expect(solves('tree', base.replace(/25/g, '30'))).toBe(false);
    expect(solves('tree', base.replace('0.7', '0.6').replace('0.7', '0.6'))).toBe(false);
    expect(solves('tree', base.replace('tree(60, 5)', 'tree(60, 4)'))).toBe(false);
  });
  test('the tree has 2^5 - 1 branches', () => {
    const r = run(M.get('tree').solution);
    expect(r.turtle.segs.length).toBe(2 * (Math.pow(2, 5) - 1));
  });
});

test.describe('The flag of Chile is geometrically right', () => {
  // The rules, written again here: the flag is 3 wide to 2 tall; the blue
  // square is half the flag's height and sits at the top left; the star is
  // five-pointed, white, centred in the square, in a circle half the square's side across.
  const W = 3 * 80, H = 2 * 80;
  const canton = H / 2, left = -W / 2, bottom = -H / 2;
  const starR = canton / 4, cx = left + canton / 2, cy = bottom + H - canton / 2;
  const poly = (...p) => p.map(([x, y]) => ({ x, y }));
  const rect = (x0, y0, x1, y1) => poly([x0, y0], [x1, y0], [x1, y1], [x0, y1]);
  const star = [0, 1, 2, 3, 4].map(i => ({ x: cx + starR * Math.sin(i * 144 * Math.PI / 180), y: cy + starR * Math.cos(i * 144 * Math.PI / 180) }));
  const own = [
    { pts: rect(left, bottom + H / 2, left + W, bottom + H), c: 'white' },
    { pts: rect(left, bottom, left + W, bottom + H / 2), c: 'red' },
    { pts: rect(left, bottom + H / 2, left + canton, bottom + H), c: 'blue' },
    { pts: star, c: 'white' }
  ];
  test('the numbers in the data follow the rules', () => {
    const F = M.CHILE_FLAG;
    expect(F.width / F.height).toBeCloseTo(3 / 2, 9);
    expect(F.canton).toBe(F.height / 2);
    expect(F.canton).toBe(F.width / 3);
    expect(F.starRadius).toBe(F.canton / 4);
    expect(F.starCx).toBe(F.left + F.canton / 2);
    expect(F.starCy).toBe(F.bottom + F.height - F.canton / 2);
  });
  test('the goal paints the same picture as the rules', () => {
    expect(Check.compareFills(M.flagSpec(), own).match).toBeGreaterThan(0.995);
    expect(Check.compareFills(own, M.flagSpec()).match).toBeGreaterThan(0.995);
  });
  test('the star is a real five-pointed star: points on one circle, 72 degrees apart, the top point straight up', () => {
    const s = M.flagSpec()[3].pts;
    expect(s.length).toBe(5);
    for (const p of s) expect(Math.hypot(p.x - cx, p.y - cy)).toBeCloseTo(starR, 6);
    const angles = s.map(p => ((Math.atan2(p.x - cx, p.y - cy) * 180 / Math.PI) + 360) % 360).sort((a, b) => a - b);
    angles.forEach((a, i) => expect(a).toBeCloseTo(i * 72, 6));
    // the star sits inside the blue square, with room round it
    for (const p of s) { expect(p.x).toBeGreaterThan(left); expect(p.x).toBeLessThan(left + canton); expect(p.y).toBeGreaterThan(bottom + H / 2); expect(p.y).toBeLessThan(bottom + H); }
  });
  test('the reference program draws it', () => {
    const r = run(M.get('flag').solution);
    expect(Check.compareFills(r.turtle.fills, own).match).toBeGreaterThan(0.99);
    // painted colours at points that matter
    const P = (x, y) => Check.paintAt(r.turtle.fills, x, y);
    expect(P(-100, 60)).toBe(L.COLORS.blue);       // inside the square, away from the star
    expect(P(60, 40)).toBe(L.COLORS.white);        // the white stripe
    expect(P(60, -40)).toBe(L.COLORS.red);         // the red stripe
    expect(P(-80, 40)).toBe(L.COLORS.white);       // the middle of the star
    expect(P(-80, 70)).toBe(L.COLORS.blue);        // above the star, in the square
    expect(P(-60, 20)).toBe(L.COLORS.blue);        // low right of the star, in the square
    expect(P(-20, 20)).toBe(L.COLORS.white);       // right of the square, below the stripe's top
  });
  test('a flag with the wrong proportions is not accepted', () => {
    const base = M.get('flag').solution;
    const m = mission('flag');
    expect(solves('flag', base.replace('box(-120, 0, 80, 80, "blue")', 'box(-120, 0, 100, 80, "blue")'))).toBe(false);   // canton too wide
    expect(solves('flag', base.replace('box(-120, 0, 80, 80, "blue")', 'box(-120, 0, 80, 60, "blue")'))).toBe(false);    // canton too short
    expect(solves('flag', base.replace('box(-120, -80, 240, 80, "red")', 'box(-120, -80, 240, 80, "blue")'))).toBe(false);
    expect(solves('flag', base.replace('forward(38.04)', 'forward(55)'))).toBe(false);                                   // star too big
    expect(solves('flag', base.replace('goto(-91.76, 23.82)', 'goto(-61.76, 23.82)'))).toBe(false);                      // star off centre
    expect(solves('flag', base.replace('color("white")\nbegin_fill()\nrepeat 5', 'color("red")\nbegin_fill()\nrepeat 5'))).toBe(false);
    expect(m.goal.fills.spec.length).toBe(4);
  });
});

test.describe('Wiring', () => {
  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  test('the new-app checklist', () => {
    expect(read('index.html')).toContain('href="code-lab.html" class="app-card card-codelab"');
    expect(read('css/index.css')).toContain('.card-codelab');
    expect(read('js/lang.js')).toContain("'code-lab.html':");
    expect(read('js/hub-plan.js')).toMatch(/id: 'codelab',\s+href: 'code-lab.html'.*minAge: 9/);
    expect(read('js/schedule.js')).toContain("id: 'codelab', card: '.card-codelab'");
    expect(read('js/auth.js')).toContain("id: 'codelab', prefix: 'zs_codelab_'");
    expect(read('js/sync.js')).toContain("'zs_codelab_': 'codelab'");
    expect(read('js/trophy-room.js')).toContain("id: 'codelab'");
    expect(read('js/sunday-report.js')).toContain("codelab: 'Code Lab'");
    expect(read('js/progress-admin.js')).toContain("id: 'codelab'");
    expect(read('README.md')).toContain('Code Lab');
  });
  test('the page loads its scripts in the suite order, with read-aloud', () => {
    const html = read('code-lab.html');
    const order = ['js/auth.js', 'js/sync.js', 'js/nav.js', 'js/sounds.js', 'js/timer.js', 'js/activity-log.js', 'js/zs-canvas.js', 'js/code-lab-lang.js', 'js/code-lab-check.js', 'js/code-lab-missions.js', 'js/code-lab.js'];
    const idx = order.map(s => html.indexOf(s));
    expect(idx.every(i => i >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
    expect(html.indexOf('js/tts.js')).toBeLessThan(html.indexOf('js/speak.js'));
    expect(html).not.toMatch(/https?:\/\/(?!fonts\.g)/);
  });
  test('content stays neutral: the restricted words are not in the app', () => {
    const re = /genero|g\u00e9nero|identidad|diversidad|inclusi[o\u00f3]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;
    for (const f of ['js/code-lab-lang.js', 'js/code-lab-check.js', 'js/code-lab-missions.js', 'js/code-lab-art.js', 'js/code-lab.js', 'code-lab.html', 'css/code-lab.css']) {
      expect(re.exec(read(f)), f).toBeNull();
    }
  });
});
