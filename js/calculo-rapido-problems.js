/* ================================================================
   CÁLCULO RÁPIDO — Engineer's problems (calculo-rapido-problems.js)
   Problem generators for ages 10+. No DOM, no storage. Every problem
   comes from a seed, so a test can ask for the same problem again and
   check the answer with its own arithmetic.

   A problem is
     { topic, kind, p, answer, dec, unit, text{es,en}, hint{es,en},
       steps[{es,en}], art{kind,...}, link }
   `p` holds exactly the numbers the statement shows (and nothing else),
   `answer` is exact to `dec` (0 to 2) decimals. `steps` is the worked
   solution shown after an attempt; its last line states the answer.

   Eight topics: area, volume, scale, rates, ratio, percent, speed, ohm.
   ================================================================ */
(function (root) {
  'use strict';
  var E = (typeof module !== 'undefined' && module.exports && typeof require === 'function')
    ? require('./calculo-rapido-engine.js') : root.CalculoEngine;

  var PI = 3.14;

  var TOPICS = [
    { id: 'area',    icon: 'area',    es: 'Área',                    en: 'Area' },
    { id: 'volume',  icon: 'volume',  es: 'Volumen',                 en: 'Volume' },
    { id: 'scale',   icon: 'scale',   es: 'Escala y planos',         en: 'Scale and plans' },
    { id: 'rates',   icon: 'rates',   es: 'Tasas: bombas y estanques', en: 'Rates: pumps and tanks' },
    { id: 'ratio',   icon: 'ratio',   es: 'Razones y mezclas',       en: 'Ratios and mixes' },
    { id: 'percent', icon: 'percent', es: 'Porcentajes',             en: 'Percentages' },
    { id: 'speed',   icon: 'speed',   es: 'Velocidad = distancia ÷ tiempo', en: 'Speed = distance ÷ time' },
    { id: 'ohm',     icon: 'ohm',     es: 'Ley de Ohm',              en: 'Ohm\'s law' }
  ];

  // Where to practise the idea (the app's own lessons are not repeated here).
  var LINKS = {
    area: 'euclid-workshop.html', volume: 'euclid-workshop.html', scale: 'little-engineer.html',
    rates: 'math-galaxy.html', ratio: 'math-galaxy.html', percent: 'math-galaxy.html',
    speed: 'math-galaxy.html', ohm: 'circuit-lab.html'
  };

  function decimalsOf(x) {
    var s = String(E.round(x, 6)), i = s.indexOf('.');
    return i < 0 ? 0 : s.length - i - 1;
  }

  // Builds {es,en} from one function that gets (es?, number-formatter).
  function B(fn) {
    return {
      es: fn(true, function (x) { return E.fmtNum(x, true); }),
      en: fn(false, function (x) { return E.fmtNum(x, false); })
    };
  }

  function make(topic, kind, p, answer, unit, text, hint, steps, art) {
    answer = E.round(answer, 2);
    return { topic: topic, kind: kind, p: p, answer: answer, dec: decimalsOf(answer), unit: unit,
             text: text, hint: hint, steps: steps, art: art, link: LINKS[topic] };
  }

  // ── area ─────────────────────────────────────────────────────
  function genArea(r) {
    var v = r.pick(['rect', 'tiles', 'lshape', 'triangle', 'circle']), w, h, a;
    if (v === 'rect') {
      w = r.int(4, 12); h = r.int(3, 9);
      return make('area', 'rect-area', { w: w, h: h }, w * h, 'm²',
        B(function (es, n) { return es ? 'El piso de una pieza mide ' + n(w) + ' m de largo y ' + n(h) + ' m de ancho. ¿Cuál es su área en m²?'
          : 'A bedroom floor is ' + n(w) + ' m long and ' + n(h) + ' m wide. What is its area in m²?'; }),
        B(function (es) { return es ? 'Área del rectángulo = largo × ancho.' : 'Area of a rectangle = length × width.'; }),
        [B(function (es) { return es ? 'Área = largo × ancho' : 'Area = length × width'; }),
         B(function (es, n) { return 'Área = ' + n(w) + ' × ' + n(h); }),
         B(function (es, n) { return (es ? 'Área = ' : 'Area = ') + n(w * h) + ' m²'; })],
        { kind: 'rect', w: w, h: h, unit: 'm' });
    }
    if (v === 'tiles') {
      w = r.int(3, 8); h = r.int(3, 6); var side = r.pick([25, 50]);
      var perM2 = (100 / side) * (100 / side);              // tiles in one square metre
      return make('area', 'tiles', { w: w, h: h, side: side }, w * h * perM2, es0('baldosas', 'tiles'),
        B(function (es, n) { return es ? 'Un piso de ' + n(w) + ' m por ' + n(h) + ' m se cubre con baldosas cuadradas de ' + n(side) + ' cm de lado. ¿Cuántas baldosas se necesitan?'
          : 'A floor ' + n(w) + ' m by ' + n(h) + ' m is covered with square tiles ' + n(side) + ' cm on a side. How many tiles are needed?'; }),
        B(function (es) { return es ? 'Cuenta cuántas baldosas caben en 1 m² y multiplica por el área.' : 'Find how many tiles fit in 1 m², then multiply by the area.'; }),
        [B(function (es, n) { return es ? 'Área del piso = ' + n(w) + ' × ' + n(h) + ' = ' + n(w * h) + ' m²' : 'Floor area = ' + n(w) + ' × ' + n(h) + ' = ' + n(w * h) + ' m²'; }),
         B(function (es, n) { return es ? 'En 1 m hay ' + n(100 / side) + ' baldosas, así que en 1 m² caben ' + n(100 / side) + ' × ' + n(100 / side) + ' = ' + n(perM2) + '.'
           : 'One metre holds ' + n(100 / side) + ' tiles, so 1 m² holds ' + n(100 / side) + ' × ' + n(100 / side) + ' = ' + n(perM2) + '.'; }),
         B(function (es, n) { return (es ? 'Baldosas = ' : 'Tiles = ') + n(w * h) + ' × ' + n(perM2) + ' = ' + n(w * h * perM2); })],
        { kind: 'rect', w: w, h: h, unit: 'm', grid: side });
    }
    if (v === 'lshape') {
      var W = r.int(8, 14), H = r.int(6, 10), cw = r.int(2, W - 4), ch = r.int(2, H - 3);
      return make('area', 'lshape', { W: W, H: H, cw: cw, ch: ch }, W * H - cw * ch, 'm²',
        B(function (es, n) { return es ? 'Un terreno en forma de L es un rectángulo de ' + n(W) + ' m por ' + n(H) + ' m al que se le quitó una esquina de ' + n(cw) + ' m por ' + n(ch) + ' m. ¿Cuál es su área en m²?'
          : 'An L-shaped plot is a ' + n(W) + ' m by ' + n(H) + ' m rectangle with a ' + n(cw) + ' m by ' + n(ch) + ' m corner removed. What is its area in m²?'; }),
        B(function (es) { return es ? 'Área grande menos el área de la esquina que falta.' : 'Big rectangle minus the corner that is missing.'; }),
        [B(function (es, n) { return es ? 'Rectángulo grande: ' + n(W) + ' × ' + n(H) + ' = ' + n(W * H) + ' m²' : 'Big rectangle: ' + n(W) + ' × ' + n(H) + ' = ' + n(W * H) + ' m²'; }),
         B(function (es, n) { return es ? 'Esquina que falta: ' + n(cw) + ' × ' + n(ch) + ' = ' + n(cw * ch) + ' m²' : 'Missing corner: ' + n(cw) + ' × ' + n(ch) + ' = ' + n(cw * ch) + ' m²'; }),
         B(function (es, n) { return (es ? 'Área = ' : 'Area = ') + n(W * H) + ' − ' + n(cw * ch) + ' = ' + n(W * H - cw * ch) + ' m²'; })],
        { kind: 'lshape', W: W, H: H, cw: cw, ch: ch });
    }
    if (v === 'triangle') {
      do { w = r.int(4, 16); h = r.int(3, 12); } while ((w * h) % 2 !== 0);
      return make('area', 'triangle', { b: w, h: h }, w * h / 2, 'm²',
        B(function (es, n) { return es ? 'Una vela triangular tiene ' + n(w) + ' m de base y ' + n(h) + ' m de altura. ¿Cuál es su área en m²?'
          : 'A triangular sail has a base of ' + n(w) + ' m and a height of ' + n(h) + ' m. What is its area in m²?'; }),
        B(function (es) { return es ? 'Un triángulo es la mitad de un rectángulo: base × altura ÷ 2.' : 'A triangle is half a rectangle: base × height ÷ 2.'; }),
        [B(function (es) { return es ? 'Área = base × altura ÷ 2' : 'Area = base × height ÷ 2'; }),
         B(function (es, n) { return (es ? 'Área = ' : 'Area = ') + n(w) + ' × ' + n(h) + ' ÷ 2 = ' + n(w * h) + ' ÷ 2'; }),
         B(function (es, n) { return (es ? 'Área = ' : 'Area = ') + n(w * h / 2) + ' m²'; })],
        { kind: 'tri', b: w, h: h });
    }
    var rad = r.pick([2, 3, 4, 5, 6, 10]);
    a = PI * rad * rad;
    return make('area', 'circle-area', { r: rad }, a, 'm²',
      B(function (es, n) { return es ? 'Una fuente circular tiene ' + n(rad) + ' m de radio. Usa π = 3,14. ¿Cuál es su área en m²?'
        : 'A round fountain has a radius of ' + n(rad) + ' m. Use π = 3.14. What is its area in m²?'; }),
      B(function (es) { return es ? 'Área del círculo = π × radio × radio.' : 'Area of a circle = π × radius × radius.'; }),
      [B(function (es) { return es ? 'Área = π × r × r' : 'Area = π × r × r'; }),
       B(function (es, n) { return (es ? 'Área = 3,' : 'Area = 3.') + '14 × ' + n(rad) + ' × ' + n(rad) + ' = 3' + (es ? ',' : '.') + '14 × ' + n(rad * rad); }),
       B(function (es, n) { return (es ? 'Área = ' : 'Area = ') + n(E.round(a, 2)) + ' m²'; })],
      { kind: 'circle', r: rad });
  }
  function es0(es, en) { return { es: es, en: en }; }

  // ── volume ───────────────────────────────────────────────────
  function genVolume(r) {
    var v = r.pick(['box', 'tank', 'cyl']), l, w, h;
    if (v === 'box') {
      l = r.int(3, 9); w = r.int(2, 6); h = r.int(2, 5);
      return make('volume', 'box-volume', { l: l, w: w, h: h }, l * w * h, 'm³',
        B(function (es, n) { return es ? 'Una bodega mide ' + n(l) + ' m de largo, ' + n(w) + ' m de ancho y ' + n(h) + ' m de alto. ¿Cuál es su volumen en m³?'
          : 'A storage room is ' + n(l) + ' m long, ' + n(w) + ' m wide and ' + n(h) + ' m high. What is its volume in m³?'; }),
        B(function (es) { return es ? 'Volumen de una caja = largo × ancho × alto.' : 'Volume of a box = length × width × height.'; }),
        [B(function (es) { return es ? 'Volumen = largo × ancho × alto' : 'Volume = length × width × height'; }),
         B(function (es, n) { return (es ? 'Volumen = ' : 'Volume = ') + n(l) + ' × ' + n(w) + ' × ' + n(h) + ' = ' + n(l * w) + ' × ' + n(h); }),
         B(function (es, n) { return (es ? 'Volumen = ' : 'Volume = ') + n(l * w * h) + ' m³'; })],
        { kind: 'box', l: l, w: w, h: h, unit: 'm' });
    }
    if (v === 'tank') {
      l = r.pick([30, 40, 50, 60, 80, 100]); w = r.pick([20, 30, 40, 50]); h = r.pick([20, 30, 40, 50]);
      var cm3 = l * w * h;
      return make('volume', 'tank-litres', { l: l, w: w, h: h }, cm3 / 1000, es0('litros', 'litres'),
        B(function (es, n) { return es ? 'Una pecera mide ' + n(l) + ' cm de largo, ' + n(w) + ' cm de ancho y ' + n(h) + ' cm de alto. ¿Cuántos litros de agua caben, si se llena hasta arriba? (1 litro = 1.000 cm³)'
          : 'A fish tank is ' + n(l) + ' cm long, ' + n(w) + ' cm wide and ' + n(h) + ' cm high. How many litres of water fit if it is filled to the top? (1 litre = 1,000 cm³)'; }),
        B(function (es) { return es ? 'Calcula el volumen en cm³ y divide por 1.000 para tener litros.' : 'Find the volume in cm³, then divide by 1,000 to get litres.'; }),
        [B(function (es, n) { return (es ? 'Volumen = ' : 'Volume = ') + n(l) + ' × ' + n(w) + ' × ' + n(h) + ' = ' + n(cm3) + ' cm³'; }),
         B(function (es, n) { return (es ? 'Litros = ' : 'Litres = ') + n(cm3) + ' ÷ 1' + (es ? '.' : ',') + '000'; }),
         B(function (es, n) { return (es ? 'Cabe ' : 'It holds ') + n(cm3 / 1000) + (es ? ' litros' : ' litres'); })],
        { kind: 'box', l: l, w: w, h: h, unit: 'cm', water: true });
    }
    var rad = r.pick([1, 2, 3]), ht = r.pick([2, 4, 5, 10]);
    return make('volume', 'cyl-litres', { r: rad, h: ht }, PI * rad * rad * ht, es0('litros', 'litres'),
      B(function (es, n) { return es ? 'Un estanque cilíndrico tiene ' + n(rad) + ' dm de radio y ' + n(ht) + ' dm de alto. Usa π = 3,14. ¿Cuántos litros caben? (1 dm³ = 1 litro)'
        : 'A cylindrical tank has a radius of ' + n(rad) + ' dm and a height of ' + n(ht) + ' dm. Use π = 3.14. How many litres fit? (1 dm³ = 1 litre)'; }),
      B(function (es) { return es ? 'Volumen del cilindro = π × radio × radio × altura. En decímetros, el resultado ya está en litros.' : 'Volume of a cylinder = π × radius × radius × height. In decimetres the result is already in litres.'; }),
      [B(function (es) { return es ? 'Volumen = π × r × r × altura' : 'Volume = π × r × r × height'; }),
       B(function (es, n) { return (es ? 'Volumen = ' : 'Volume = ') + '3' + (es ? ',' : '.') + '14 × ' + n(rad) + ' × ' + n(rad) + ' × ' + n(ht) + ' = 3' + (es ? ',' : '.') + '14 × ' + n(rad * rad * ht); }),
       B(function (es, n) { return (es ? 'Caben ' : 'It holds ') + n(E.round(PI * rad * rad * ht, 2)) + (es ? ' litros' : ' litres'); })],
      { kind: 'cyl', r: rad, h: ht });
  }

  // ── scale ────────────────────────────────────────────────────
  function genScale(r) {
    var v = r.pick(['map', 'mapback', 'plan', 'model']), cm, sc, km;
    if (v === 'map') {
      sc = r.pick([25000, 50000, 100000]); cm = r.int(2, 24);
      km = cm * sc / 100000;
      return make('scale', 'map-km', { scale: sc, cm: cm }, km, 'km',
        B(function (es, n) { return es ? 'En un mapa a escala 1 : ' + n(sc) + ', dos pueblos están a ' + n(cm) + ' cm. ¿A cuántos kilómetros están en la realidad?'
          : 'On a map with scale 1 : ' + n(sc) + ', two towns are ' + n(cm) + ' cm apart. How many kilometres apart are they in real life?'; }),
        B(function (es, n) { return es ? '1 cm del mapa son ' + n(sc) + ' cm reales. 100.000 cm son 1 km.' : '1 cm on the map is ' + n(sc) + ' cm in real life. 100,000 cm make 1 km.'; }),
        [B(function (es, n) { return es ? 'Distancia real = ' + n(cm) + ' × ' + n(sc) + ' = ' + n(cm * sc) + ' cm' : 'Real distance = ' + n(cm) + ' × ' + n(sc) + ' = ' + n(cm * sc) + ' cm'; }),
         B(function (es, n) { return es ? '100.000 cm = 1 km, así que ' + n(cm * sc) + ' ÷ 100.000 = ' + n(km) + ' km' : '100,000 cm = 1 km, so ' + n(cm * sc) + ' ÷ 100,000 = ' + n(km) + ' km'; }),
         B(function (es, n) { return (es ? 'Están a ' : 'They are ') + n(km) + ' km' + (es ? '.' : ' apart.'); })],
        { kind: 'scalebar', cm: cm, scale: sc });
    }
    if (v === 'mapback') {
      sc = r.pick([25000, 50000, 100000]); cm = r.int(2, 20); km = cm * sc / 100000;
      return make('scale', 'map-cm', { scale: sc, km: km }, cm, 'cm',
        B(function (es, n) { return es ? 'Un sendero mide ' + n(km) + ' km. ¿Cuántos centímetros mide en un mapa a escala 1 : ' + n(sc) + '?'
          : 'A trail is ' + n(km) + ' km long. How many centimetres long is it on a map with scale 1 : ' + n(sc) + '?'; }),
        B(function (es) { return es ? 'Pasa los km a cm y divide por la escala.' : 'Change km to cm, then divide by the scale.'; }),
        [B(function (es, n) { return es ? n(km) + ' km = ' + n(km * 100000) + ' cm' : n(km) + ' km = ' + n(km * 100000) + ' cm'; }),
         B(function (es, n) { return (es ? 'En el mapa = ' : 'On the map = ') + n(km * 100000) + ' ÷ ' + n(sc); }),
         B(function (es, n) { return (es ? 'Mide ' : 'It is ') + n(cm) + ' cm' + (es ? ' en el mapa.' : ' on the map.'); })],
        { kind: 'scalebar', cm: cm, scale: sc });
    }
    if (v === 'plan') {
      sc = r.pick([20, 50, 100]); cm = r.int(3, 20);
      var m = cm * sc / 100;
      return make('scale', 'plan-m', { scale: sc, cm: cm }, m, 'm',
        B(function (es, n) { return es ? 'En un plano a escala 1 : ' + n(sc) + ', una muralla mide ' + n(cm) + ' cm. ¿Cuántos metros mide en la realidad?'
          : 'On a blueprint with scale 1 : ' + n(sc) + ', a wall is ' + n(cm) + ' cm long. How many metres long is the real wall?'; }),
        B(function (es) { return es ? 'Multiplica por la escala y pasa de cm a m (100 cm = 1 m).' : 'Multiply by the scale, then change cm to m (100 cm = 1 m).'; }),
        [B(function (es, n) { return (es ? 'Real = ' : 'Real = ') + n(cm) + ' × ' + n(sc) + ' = ' + n(cm * sc) + ' cm'; }),
         B(function (es, n) { return n(cm * sc) + ' cm ÷ 100 = ' + n(m) + ' m'; }),
         B(function (es, n) { return (es ? 'La muralla mide ' : 'The wall is ') + n(m) + ' m'; })],
        { kind: 'scalebar', cm: cm, scale: sc, plan: true });
    }
    sc = r.pick([50, 100, 200]); var real = sc === 200 ? r.int(2, 20) : r.int(3, 30);
    var mod = real * 100 / sc;
    return make('scale', 'model-cm', { scale: sc, m: real }, mod, 'cm',
      B(function (es, n) { return es ? 'Un edificio mide ' + n(real) + ' m de alto. ¿Cuántos centímetros mide su maqueta a escala 1 : ' + n(sc) + '?'
        : 'A building is ' + n(real) + ' m tall. How many centimetres tall is its model at scale 1 : ' + n(sc) + '?'; }),
      B(function (es) { return es ? 'Pasa los metros a centímetros y divide por la escala.' : 'Change metres to centimetres, then divide by the scale.'; }),
      [B(function (es, n) { return n(real) + ' m = ' + n(real * 100) + ' cm'; }),
       B(function (es, n) { return (es ? 'Maqueta = ' : 'Model = ') + n(real * 100) + ' ÷ ' + n(sc) + ' = ' + n(mod) + ' cm'; }),
       B(function (es, n) { return (es ? 'La maqueta mide ' : 'The model is ') + n(mod) + ' cm'; })],
      { kind: 'scalebar', cm: mod, scale: sc, model: true });
  }

  // ── rates ────────────────────────────────────────────────────
  function genRates(r) {
    var v = r.pick(['pump', 'two', 'leak', 'find']), q, t, V;
    if (v === 'pump') {
      q = r.pick([10, 12, 15, 20, 25, 30, 40]); t = r.int(6, 40); V = q * t;
      return make('rates', 'pump-time', { V: V, Q: q }, t, es0('minutos', 'minutes'),
        B(function (es, n) { return es ? 'Una bomba llena un estanque de ' + n(V) + ' litros a ' + n(q) + ' litros por minuto. ¿Cuántos minutos tarda en llenarlo?'
          : 'A pump fills a ' + n(V) + ' litre tank at ' + n(q) + ' litres per minute. How many minutes does it take to fill it?'; }),
        B(function (es) { return es ? 'Tiempo = volumen ÷ caudal.' : 'Time = volume ÷ flow rate.'; }),
        [B(function (es) { return es ? 'Tiempo = volumen ÷ caudal' : 'Time = volume ÷ flow rate'; }),
         B(function (es, n) { return (es ? 'Tiempo = ' : 'Time = ') + n(V) + ' ÷ ' + n(q); }),
         B(function (es, n) { return (es ? 'Tiempo = ' : 'Time = ') + n(t) + (es ? ' minutos' : ' minutes'); })],
        { kind: 'pump', V: V, pumps: [q] });
    }
    if (v === 'two') {
      var q1 = r.pick([10, 15, 20, 25]), q2 = r.pick([5, 10, 15, 30]); t = r.int(5, 30); V = (q1 + q2) * t;
      return make('rates', 'two-pumps', { V: V, Q1: q1, Q2: q2 }, t, es0('minutos', 'minutes'),
        B(function (es, n) { return es ? 'Dos bombas llenan a la vez un estanque de ' + n(V) + ' litros: una a ' + n(q1) + ' L/min y otra a ' + n(q2) + ' L/min. ¿Cuántos minutos tardan juntas?'
          : 'Two pumps fill a ' + n(V) + ' litre tank at the same time: one at ' + n(q1) + ' L/min and one at ' + n(q2) + ' L/min. How many minutes do they take together?'; }),
        B(function (es) { return es ? 'Primero suma los caudales; después divide el volumen por la suma.' : 'First add the flow rates; then divide the volume by the total.'; }),
        [B(function (es, n) { return (es ? 'Caudal juntas = ' : 'Flow together = ') + n(q1) + ' + ' + n(q2) + ' = ' + n(q1 + q2) + ' L/min'; }),
         B(function (es, n) { return (es ? 'Tiempo = ' : 'Time = ') + n(V) + ' ÷ ' + n(q1 + q2); }),
         B(function (es, n) { return (es ? 'Tiempo = ' : 'Time = ') + n(t) + (es ? ' minutos' : ' minutes'); })],
        { kind: 'pump', V: V, pumps: [q1, q2] });
    }
    if (v === 'leak') {
      var inn = r.pick([30, 40, 50, 60]), out = r.pick([5, 10, 15]); t = r.int(5, 30); V = (inn - out) * t;
      return make('rates', 'leaky-tank', { V: V, In: inn, Out: out }, t, es0('minutos', 'minutes'),
        B(function (es, n) { return es ? 'Un estanque de ' + n(V) + ' litros se llena a ' + n(inn) + ' L/min, pero pierde ' + n(out) + ' L/min por una grieta. ¿Cuántos minutos tarda en llenarse?'
          : 'A ' + n(V) + ' litre tank fills at ' + n(inn) + ' L/min but loses ' + n(out) + ' L/min through a crack. How many minutes until it is full?'; }),
        B(function (es) { return es ? 'Resta lo que se pierde a lo que entra, y después divide.' : 'Subtract what leaks out from what flows in, then divide.'; }),
        [B(function (es, n) { return (es ? 'Ganancia real = ' : 'Net flow = ') + n(inn) + ' − ' + n(out) + ' = ' + n(inn - out) + ' L/min'; }),
         B(function (es, n) { return (es ? 'Tiempo = ' : 'Time = ') + n(V) + ' ÷ ' + n(inn - out); }),
         B(function (es, n) { return (es ? 'Tiempo = ' : 'Time = ') + n(t) + (es ? ' minutos' : ' minutes'); })],
        { kind: 'pump', V: V, pumps: [inn], leak: out });
    }
    q = r.pick([6, 8, 9, 12, 15, 18, 20, 25]); t = r.pick([3, 4, 5, 6, 8, 10]); V = q * t;
    return make('rates', 'find-rate', { V: V, t: t }, q, 'L/min',
      B(function (es, n) { return es ? 'Una llave llena una tina de ' + n(V) + ' litros en ' + n(t) + ' minutos. ¿Cuántos litros por minuto entrega?'
        : 'A tap fills a ' + n(V) + ' litre tub in ' + n(t) + ' minutes. How many litres per minute does it deliver?'; }),
      B(function (es) { return es ? 'Caudal = volumen ÷ tiempo.' : 'Flow rate = volume ÷ time.'; }),
      [B(function (es) { return es ? 'Caudal = volumen ÷ tiempo' : 'Flow rate = volume ÷ time'; }),
       B(function (es, n) { return (es ? 'Caudal = ' : 'Flow rate = ') + n(V) + ' ÷ ' + n(t); }),
       B(function (es, n) { return (es ? 'Caudal = ' : 'Flow rate = ') + n(q) + ' L/min'; })],
      { kind: 'pump', V: V, pumps: [q], tap: true });
  }

  // ── ratio ────────────────────────────────────────────────────
  var MIXES = [[1, 2, 3], [1, 2, 4], [1, 3, 5], [2, 3, 5], [1, 1, 2]];
  function genRatio(r) {
    var v = r.pick(['concrete', 'paint', 'gears', 'cover']);
    if (v === 'concrete') {
      var mx = r.pick(MIXES), sum = mx[0] + mx[1] + mx[2], k = r.int(2, 8), total = sum * k, which = r.int(0, 2);
      var names = [es0('cemento', 'cement'), es0('arena', 'sand'), es0('gravilla', 'gravel')];
      return make('ratio', 'concrete-mix', { a: mx[0], b: mx[1], c: mx[2], total: total }, mx[which] * k, es0('baldes', 'buckets'),
        B(function (es, n) { return es ? 'Un hormigón se hace con cemento, arena y gravilla en la razón ' + n(mx[0]) + ' : ' + n(mx[1]) + ' : ' + n(mx[2]) + ' (por baldes). Se preparan ' + n(total) + ' baldes en total. ¿Cuántos baldes de ' + names[which].es + ' se usan?'
          : 'Concrete is made from cement, sand and gravel in the ratio ' + n(mx[0]) + ' : ' + n(mx[1]) + ' : ' + n(mx[2]) + ' (by buckets). A batch has ' + n(total) + ' buckets in total. How many buckets of ' + names[which].en + ' are used?'; }),
        B(function (es) { return es ? 'Suma las partes, calcula cuánto vale una parte y multiplica.' : 'Add the parts, find the size of one part, then multiply.'; }),
        [B(function (es, n) { return (es ? 'Partes en total = ' : 'Parts in total = ') + n(mx[0]) + ' + ' + n(mx[1]) + ' + ' + n(mx[2]) + ' = ' + n(sum); }),
         B(function (es, n) { return (es ? 'Una parte = ' : 'One part = ') + n(total) + ' ÷ ' + n(sum) + ' = ' + n(k) + (es ? ' baldes' : ' buckets'); }),
         B(function (es, n) { return (es ? 'Baldes de ' + names[which].es + ' = ' : 'Buckets of ' + names[which].en + ' = ') + n(mx[which]) + ' × ' + n(k) + ' = ' + n(mx[which] * k); })],
        { kind: 'parts', parts: mx, k: k, hi: which });
    }
    if (v === 'paint') {
      var x = r.int(1, 4), y = r.int(x + 1, 6), kk = r.int(2, 6), tot = (x + y) * kk, first = r.pick([true, false]);
      var ask = first ? x : y;
      return make('ratio', 'paint-mix', { x: x, y: y, total: tot }, ask * kk, es0('litros', 'litres'),
        B(function (es, n) { return es ? 'Para un verde se mezclan ' + n(x) + ' partes de pintura azul con ' + n(y) + ' partes de pintura amarilla. Se necesitan ' + n(tot) + ' litros de mezcla. ¿Cuántos litros de pintura ' + (first ? 'azul' : 'amarilla') + ' hacen falta?'
          : 'A green is made by mixing ' + n(x) + ' parts blue paint with ' + n(y) + ' parts yellow paint. You need ' + n(tot) + ' litres of the mix. How many litres of ' + (first ? 'blue' : 'yellow') + ' paint are needed?'; }),
        B(function (es) { return es ? 'Suma las partes, calcula una parte y multiplica.' : 'Add the parts, find one part, then multiply.'; }),
        [B(function (es, n) { return (es ? 'Partes en total = ' : 'Parts in total = ') + n(x) + ' + ' + n(y) + ' = ' + n(x + y); }),
         B(function (es, n) { return (es ? 'Una parte = ' : 'One part = ') + n(tot) + ' ÷ ' + n(x + y) + ' = ' + n(kk) + (es ? ' litros' : ' litres'); }),
         B(function (es, n) { return (es ? (first ? 'Azul' : 'Amarilla') : (first ? 'Blue' : 'Yellow')) + ' = ' + n(ask) + ' × ' + n(kk) + ' = ' + n(ask * kk) + (es ? ' litros' : ' litres'); })],
        { kind: 'parts', parts: [x, y], k: kk, hi: first ? 0 : 1, colors: ['#2563eb', '#eab308'] });
    }
    if (v === 'gears') {
      var small = r.pick([8, 10, 12, 15, 20]), mult = r.int(2, 6), big = small * mult;
      return make('ratio', 'gear-ratio', { big: big, small: small }, mult, es0('vueltas', 'turns'),
        B(function (es, n) { return es ? 'Un engranaje grande de ' + n(big) + ' dientes mueve a uno pequeño de ' + n(small) + ' dientes. Cuando el grande da 1 vuelta, ¿cuántas vueltas da el pequeño?'
          : 'A big gear with ' + n(big) + ' teeth drives a small gear with ' + n(small) + ' teeth. When the big gear turns once, how many turns does the small gear make?'; }),
        B(function (es) { return es ? 'Divide los dientes del grande por los del pequeño.' : 'Divide the big gear\'s teeth by the small gear\'s teeth.'; }),
        [B(function (es, n) { return es ? 'En 1 vuelta del grande pasan ' + n(big) + ' dientes.' : 'In 1 turn of the big gear, ' + n(big) + ' teeth go past.'; }),
         B(function (es, n) { return (es ? 'Vueltas del pequeño = ' : 'Turns of the small gear = ') + n(big) + ' ÷ ' + n(small); }),
         B(function (es, n) { return (es ? 'Da ' : 'It makes ') + n(mult) + (es ? ' vueltas.' : ' turns.'); })],
        { kind: 'gears', big: big, small: small });
    }
    var cover = r.pick([8, 10, 12, 15, 20]), cans = r.int(2, 9), area = cover * cans;
    return make('ratio', 'paint-cover', { cover: cover, area: area }, cans, es0('tarros', 'cans'),
      B(function (es, n) { return es ? 'Un tarro de pintura cubre ' + n(cover) + ' m². ¿Cuántos tarros hacen falta para pintar ' + n(area) + ' m² de muro?'
        : 'One can of paint covers ' + n(cover) + ' m². How many cans are needed to paint ' + n(area) + ' m² of wall?'; }),
      B(function (es) { return es ? 'Divide la superficie por lo que cubre un tarro.' : 'Divide the area by what one can covers.'; }),
      [B(function (es) { return es ? 'Tarros = superficie ÷ cobertura de un tarro' : 'Cans = area ÷ coverage of one can'; }),
       B(function (es, n) { return (es ? 'Tarros = ' : 'Cans = ') + n(area) + ' ÷ ' + n(cover); }),
       B(function (es, n) { return (es ? 'Tarros = ' : 'Cans = ') + n(cans); })],
      { kind: 'cover', cover: cover, area: area, cans: cans });
  }

  // ── percent ──────────────────────────────────────────────────
  function genPercent(r) {
    var v = r.pick(['of', 'off', 'up', 'what']), pct, base;
    if (v === 'of') {
      pct = r.pick([10, 15, 20, 25, 30, 40, 50, 60, 75]); base = r.pick([40, 60, 80, 120, 160, 200, 240, 300, 400, 500]);
      return make('percent', 'pct-of', { pct: pct, base: base }, pct * base / 100, '',
        B(function (es, n) { return es ? '¿Cuánto es el ' + n(pct) + ' % de ' + n(base) + '?' : 'What is ' + n(pct) + '% of ' + n(base) + '?'; }),
        B(function (es) { return es ? 'Porcentaje de un número = número × porcentaje ÷ 100.' : 'Percent of a number = number × percent ÷ 100.'; }),
        [B(function (es, n) { return es ? n(pct) + ' % significa ' + n(pct) + ' de cada 100.' : n(pct) + '% means ' + n(pct) + ' out of every 100.'; }),
         B(function (es, n) { return n(base) + ' × ' + n(pct) + ' ÷ 100 = ' + n(base * pct) + ' ÷ 100'; }),
         B(function (es, n) { return (es ? 'Resultado = ' : 'Answer = ') + n(pct * base / 100); })],
        { kind: 'pct', pct: pct });
    }
    if (v === 'off') {
      pct = r.pick([10, 20, 25, 30, 40, 50]); base = r.pick([8000, 12000, 15000, 20000, 24000, 30000, 40000, 60000]);
      var fin = base * (100 - pct) / 100;
      return make('percent', 'discount', { price: base, pct: pct }, fin, 'CLP',
        B(function (es, n) { return es ? 'Una herramienta cuesta $' + n(base) + ' y tiene un descuento del ' + n(pct) + ' %. ¿Cuánto se paga, en pesos?'
          : 'A tool costs $' + n(base) + ' CLP and is ' + n(pct) + '% off. How much do you pay, in pesos?'; }),
        B(function (es) { return es ? 'Calcula el descuento y réstalo del precio.' : 'Find the discount and take it off the price.'; }),
        [B(function (es, n) { return (es ? 'Descuento = ' : 'Discount = ') + n(base) + ' × ' + n(pct) + ' ÷ 100 = ' + n(base * pct / 100); }),
         B(function (es, n) { return (es ? 'Precio final = ' : 'Final price = ') + n(base) + ' − ' + n(base * pct / 100); }),
         B(function (es, n) { return (es ? 'Se pagan $' : 'You pay $') + n(fin); })],
        { kind: 'pct', pct: 100 - pct, cut: pct });
    }
    if (v === 'up') {
      pct = r.pick([10, 20, 25, 50]); base = r.pick([40, 60, 80, 120, 160, 200, 240, 400]);
      var nw = base * (100 + pct) / 100;
      return make('percent', 'increase', { len: base, pct: pct }, nw, 'm',
        B(function (es, n) { return es ? 'Un cable mide ' + n(base) + ' m. Se necesita uno ' + n(pct) + ' % más largo. ¿Cuántos metros debe medir el nuevo cable?'
          : 'A cable is ' + n(base) + ' m long. You need one that is ' + n(pct) + '% longer. How many metres long must the new cable be?'; }),
        B(function (es) { return es ? 'Calcula el aumento y súmalo al largo original.' : 'Find the extra length and add it to the original.'; }),
        [B(function (es, n) { return (es ? 'Aumento = ' : 'Extra = ') + n(base) + ' × ' + n(pct) + ' ÷ 100 = ' + n(base * pct / 100) + ' m'; }),
         B(function (es, n) { return (es ? 'Largo nuevo = ' : 'New length = ') + n(base) + ' + ' + n(base * pct / 100); }),
         B(function (es, n) { return (es ? 'Debe medir ' : 'It must be ') + n(nw) + ' m'; })],
        { kind: 'pct', pct: 100 + pct, over: pct });
    }
    var whole = r.pick([20, 25, 40, 50, 80, 200]);
    do { pct = r.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90]); } while ((pct * whole) % 100 !== 0);
    var part = pct * whole / 100;
    return make('percent', 'what-pct', { part: part, whole: whole }, pct, '%',
      B(function (es, n) { return es ? 'De ' + n(whole) + ' tornillos, ' + n(part) + ' estaban buenos. ¿Qué porcentaje estaba bueno?' : 'Out of ' + n(whole) + ' bolts, ' + n(part) + ' were good. What percent were good?'; }),
      B(function (es) { return es ? 'Porcentaje = parte ÷ total × 100.' : 'Percent = part ÷ whole × 100.'; }),
      [B(function (es) { return es ? 'Porcentaje = parte ÷ total × 100' : 'Percent = part ÷ whole × 100'; }),
       B(function (es, n) { return n(part) + ' ÷ ' + n(whole) + ' × 100'; }),
       B(function (es, n) { return (es ? 'Resultado = ' : 'Answer = ') + n(pct) + ' %'; })],
      { kind: 'pct', pct: pct });
  }

  // ── speed ────────────────────────────────────────────────────
  function genSpeed(r) {
    var v = r.pick(['v', 'd', 't', 'ms', 'min']), sp, t, d;
    if (v === 'v') {
      sp = r.pick([40, 60, 80, 90, 100, 120]); t = r.pick([2, 2.5, 3, 4, 5]); d = sp * t;
      return make('speed', 'speed', { d: d, t: t }, sp, 'km/h',
        B(function (es, n) { return es ? 'Un bus recorre ' + n(d) + ' km en ' + n(t) + ' horas a velocidad constante. ¿A cuántos km/h va?' : 'A bus travels ' + n(d) + ' km in ' + n(t) + ' hours at a steady speed. How fast is it going, in km/h?'; }),
        B(function (es) { return es ? 'Velocidad = distancia ÷ tiempo.' : 'Speed = distance ÷ time.'; }),
        [B(function (es) { return es ? 'Velocidad = distancia ÷ tiempo' : 'Speed = distance ÷ time'; }),
         B(function (es, n) { return (es ? 'Velocidad = ' : 'Speed = ') + n(d) + ' ÷ ' + n(t); }),
         B(function (es, n) { return (es ? 'Velocidad = ' : 'Speed = ') + n(sp) + ' km/h'; })],
        { kind: 'road', d: d, t: t });
    }
    if (v === 'd') {
      sp = r.pick([50, 60, 80, 90, 100, 110]); t = r.pick([1.5, 2, 2.5, 3, 3.5, 4]); d = sp * t;
      return make('speed', 'distance', { v: sp, t: t }, d, 'km',
        B(function (es, n) { return es ? 'Un auto va a ' + n(sp) + ' km/h durante ' + n(t) + ' horas. ¿Cuántos kilómetros recorre?' : 'A car drives at ' + n(sp) + ' km/h for ' + n(t) + ' hours. How many kilometres does it cover?'; }),
        B(function (es) { return es ? 'Distancia = velocidad × tiempo.' : 'Distance = speed × time.'; }),
        [B(function (es) { return es ? 'Distancia = velocidad × tiempo' : 'Distance = speed × time'; }),
         B(function (es, n) { return (es ? 'Distancia = ' : 'Distance = ') + n(sp) + ' × ' + n(t); }),
         B(function (es, n) { return (es ? 'Distancia = ' : 'Distance = ') + n(d) + ' km'; })],
        { kind: 'road', d: d, t: t });
    }
    if (v === 't') {
      sp = r.pick([30, 40, 50, 60, 80, 90, 100]); t = r.pick([1.5, 2, 2.5, 3, 4]); d = sp * t;
      return make('speed', 'time', { d: d, v: sp }, t, es0('horas', 'hours'),
        B(function (es, n) { return es ? 'Hay que recorrer ' + n(d) + ' km a ' + n(sp) + ' km/h. ¿Cuántas horas toma el viaje?' : 'A trip of ' + n(d) + ' km is driven at ' + n(sp) + ' km/h. How many hours does it take?'; }),
        B(function (es) { return es ? 'Tiempo = distancia ÷ velocidad.' : 'Time = distance ÷ speed.'; }),
        [B(function (es) { return es ? 'Tiempo = distancia ÷ velocidad' : 'Time = distance ÷ speed'; }),
         B(function (es, n) { return (es ? 'Tiempo = ' : 'Time = ') + n(d) + ' ÷ ' + n(sp); }),
         B(function (es, n) { return (es ? 'Tiempo = ' : 'Time = ') + n(t) + (es ? ' horas' : ' hours'); })],
        { kind: 'road', d: d, t: t });
    }
    if (v === 'ms') {
      sp = r.pick([2, 4, 5, 8, 10, 12]); t = r.pick([5, 10, 20, 25]); d = sp * t;
      return make('speed', 'speed-ms', { d: d, t: t }, sp, 'm/s',
        B(function (es, n) { return es ? 'Un ciclista recorre ' + n(d) + ' metros en ' + n(t) + ' segundos. ¿A cuántos metros por segundo va?' : 'A cyclist covers ' + n(d) + ' metres in ' + n(t) + ' seconds. How many metres per second is that?'; }),
        B(function (es) { return es ? 'Velocidad = distancia ÷ tiempo.' : 'Speed = distance ÷ time.'; }),
        [B(function (es) { return es ? 'Velocidad = distancia ÷ tiempo' : 'Speed = distance ÷ time'; }),
         B(function (es, n) { return (es ? 'Velocidad = ' : 'Speed = ') + n(d) + ' ÷ ' + n(t); }),
         B(function (es, n) { return (es ? 'Velocidad = ' : 'Speed = ') + n(sp) + ' m/s'; })],
        { kind: 'road', d: d, t: t, unit: 'm', secs: true });
    }
    sp = r.pick([12, 16, 18, 20, 24, 30]); var mins = r.pick([15, 30, 45, 60]); d = sp * mins / 60;
    return make('speed', 'speed-min', { d: d, m: mins }, sp, 'km/h',
      B(function (es, n) { return es ? 'Un ciclista recorre ' + n(d) + ' km en ' + n(mins) + ' minutos. ¿A cuántos km/h va?' : 'A cyclist rides ' + n(d) + ' km in ' + n(mins) + ' minutes. How fast is that, in km/h?'; }),
      B(function (es) { return es ? 'Pasa los minutos a horas (÷ 60) y luego divide.' : 'Change the minutes to hours (÷ 60), then divide.'; }),
      [B(function (es, n) { return n(mins) + (es ? ' minutos' : ' minutes') + ' = ' + n(mins) + ' ÷ 60 = ' + n(mins / 60) + (es ? ' horas' : ' hours'); }),
       B(function (es, n) { return (es ? 'Velocidad = ' : 'Speed = ') + n(d) + ' ÷ ' + n(mins / 60); }),
       B(function (es, n) { return (es ? 'Velocidad = ' : 'Speed = ') + n(sp) + ' km/h'; })],
      { kind: 'road', d: d, t: mins / 60 });
  }

  // ── Ohm's law ────────────────────────────────────────────────
  function genOhm(r) {
    var v = r.pick(['V', 'I', 'R', 'P', 'series']), i, rr, volt;
    if (v === 'V') {
      i = r.int(1, 5); rr = r.pick([2, 3, 4, 5, 6, 8, 10, 12]); volt = i * rr;
      return make('ohm', 'ohm-v', { I: i, R: rr }, volt, 'V',
        B(function (es, n) { return es ? 'Por una resistencia de ' + n(rr) + ' Ω pasa una corriente de ' + n(i) + ' A. ¿Cuántos volts hay entre sus extremos?' : 'A current of ' + n(i) + ' A flows through a ' + n(rr) + ' Ω resistor. How many volts are across it?'; }),
        B(function (es) { return es ? 'Ley de Ohm: V = I × R.' : 'Ohm\'s law: V = I × R.'; }),
        [B(function (es) { return es ? 'V = I × R' : 'V = I × R'; }),
         B(function (es, n) { return 'V = ' + n(i) + ' × ' + n(rr); }),
         B(function (es, n) { return 'V = ' + n(volt) + ' V'; })],
        { kind: 'circuit', V: null, R: [rr], I: i, ask: 'V' });
    }
    if (v === 'I') {
      i = r.pick([1, 2, 3, 4, 5]); rr = r.pick([2, 3, 4, 6, 8, 10, 12]); volt = i * rr;
      return make('ohm', 'ohm-i', { V: volt, R: rr }, i, 'A',
        B(function (es, n) { return es ? 'Una pila de ' + n(volt) + ' V alimenta una resistencia de ' + n(rr) + ' Ω. ¿Cuántos amperes pasan?' : 'A ' + n(volt) + ' V battery drives a ' + n(rr) + ' Ω resistor. How many amps flow?'; }),
        B(function (es) { return es ? 'Ley de Ohm: I = V ÷ R.' : 'Ohm\'s law: I = V ÷ R.'; }),
        [B(function (es) { return 'I = V ÷ R'; }),
         B(function (es, n) { return 'I = ' + n(volt) + ' ÷ ' + n(rr); }),
         B(function (es, n) { return 'I = ' + n(i) + ' A'; })],
        { kind: 'circuit', V: volt, R: [rr], I: null, ask: 'I' });
    }
    if (v === 'R') {
      i = r.pick([0.5, 1, 2, 3, 4]); rr = r.pick([4, 6, 8, 12, 20]); volt = i * rr;
      return make('ohm', 'ohm-r', { V: volt, I: i }, rr, 'Ω',
        B(function (es, n) { return es ? 'Una ampolleta conectada a ' + n(volt) + ' V deja pasar ' + n(i) + ' A. ¿Cuántos ohms de resistencia tiene?' : 'A bulb connected to ' + n(volt) + ' V lets ' + n(i) + ' A through. How many ohms is its resistance?'; }),
        B(function (es) { return es ? 'Ley de Ohm: R = V ÷ I.' : 'Ohm\'s law: R = V ÷ I.'; }),
        [B(function (es) { return 'R = V ÷ I'; }),
         B(function (es, n) { return 'R = ' + n(volt) + ' ÷ ' + n(i); }),
         B(function (es, n) { return 'R = ' + n(rr) + ' Ω'; })],
        { kind: 'circuit', V: volt, R: null, I: i, ask: 'R' });
    }
    if (v === 'P') {
      volt = r.pick([3, 6, 9, 12]); i = r.pick([0.5, 1, 1.5, 2]);
      return make('ohm', 'power', { V: volt, I: i }, volt * i, 'W',
        B(function (es, n) { return es ? 'Un motor funciona con ' + n(volt) + ' V y ' + n(i) + ' A. ¿Qué potencia usa, en watts?' : 'A motor runs on ' + n(volt) + ' V and ' + n(i) + ' A. How much power does it use, in watts?'; }),
        B(function (es) { return es ? 'Potencia = voltaje × corriente.' : 'Power = voltage × current.'; }),
        [B(function (es) { return 'P = V × I'; }),
         B(function (es, n) { return 'P = ' + n(volt) + ' × ' + n(i); }),
         B(function (es, n) { return 'P = ' + n(volt * i) + ' W'; })],
        { kind: 'circuit', V: volt, R: null, I: i, ask: 'P' });
    }
    var r1 = r.int(1, 8), r2 = r.int(1, 8), cur = r.pick([0.5, 1, 2]);
    if (cur === 0.5 && (r1 + r2) % 2 !== 0) r2 = r2 === 8 ? 7 : r2 + 1;      // keeps the volts a whole number
    var tot = r1 + r2; volt = cur * tot;
    return make('ohm', 'ohm-series', { V: volt, R1: r1, R2: r2 }, cur, 'A',
      B(function (es, n) { return es ? 'Dos resistencias en serie, de ' + n(r1) + ' Ω y ' + n(r2) + ' Ω, se conectan a una pila de ' + n(volt) + ' V. ¿Cuántos amperes pasan por el circuito?'
        : 'Two resistors in series, ' + n(r1) + ' Ω and ' + n(r2) + ' Ω, are connected to a ' + n(volt) + ' V battery. How many amps flow in the circuit?'; }),
      B(function (es) { return es ? 'En serie las resistencias se suman. Después, I = V ÷ R.' : 'In series the resistances add up. Then I = V ÷ R.'; }),
      [B(function (es, n) { return (es ? 'Resistencia total = ' : 'Total resistance = ') + n(r1) + ' + ' + n(r2) + ' = ' + n(tot) + ' Ω'; }),
       B(function (es, n) { return 'I = V ÷ R = ' + n(volt) + ' ÷ ' + n(tot); }),
       B(function (es, n) { return 'I = ' + n(cur) + ' A'; })],
      { kind: 'circuit', V: volt, R: [r1, r2], I: null, ask: 'I' });
  }

  var GEN = { area: genArea, volume: genVolume, scale: genScale, rates: genRates, ratio: genRatio,
              percent: genPercent, speed: genSpeed, ohm: genOhm };

  // A problem for a topic from a seed (a number or a string).
  function problem(topic, seed) {
    var g = GEN[topic];
    if (!g) return null;
    return g(E.rng(seed));
  }

  // Plain, self-contained text for a missed problem (Repaso).
  function reviewItem(pr, es) {
    var lang = es ? 'es' : 'en', suffix = pr.unit ? (typeof pr.unit === 'string' ? pr.unit : pr.unit[lang]) : '';
    var fmt = function (x) { return E.fmtNum(x, es) + (suffix ? ' ' + suffix : ''); };
    return { prompt: pr.text[lang], answer: fmt(pr.answer),
             choices: E.numericChoices(pr.answer, pr.kind + ':' + JSON.stringify(pr.p)).map(fmt) };
  }

  var api = {
    PI: PI, TOPICS: TOPICS, LINKS: LINKS, MIXES: MIXES, problem: problem, reviewItem: reviewItem, decimalsOf: decimalsOf
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CalculoProblems = api;
})(typeof window !== 'undefined' ? window : this);
