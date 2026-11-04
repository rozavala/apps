/* ================================================================
   LAB EXPLORER — lab-explorer-labs1.js
   Labs: colors, water, plants, physics (lever), magnets.
   Each lab registers on window.LXLabs as
     { challenges, start(api), frame(dt, t), down/move/up(p), stop(),
       onActive(challenge), onPredict(challenge, i) }
   and draws in logical units (api.W × api.H; W is always 600).
   ================================================================ */

window.LXLabs = window.LXLabs || {};

// ── Tiny DOM helpers shared by both lab files ──
window.LXUI = (() => {
  'use strict';
  let n = 0;
  function seg(o) {
    const id = 'lxs' + (++n);
    const wrap = document.createElement('div');
    wrap.className = 'lx-seg-wrap' + (o.cls ? ' ' + o.cls : '');
    wrap.innerHTML = (o.label ? '<div class="lx-seg-label" id="' + id + '">' + escHtml(o.label) + '</div>' : '') +
      '<div class="lx-seg" role="group"' + (o.label ? ' aria-labelledby="' + id + '"' : '') + '>' +
      o.options.map(op => '<button type="button" class="lx-seg-btn' + (op.v === o.value ? ' on' : '') + '" data-v="' + escHtml(String(op.v)) + '"' +
        (op.aria ? ' aria-label="' + escHtml(op.aria) + '"' : '') + ' aria-pressed="' + (op.v === o.value) + '">' +
        (op.icon ? '<span class="lx-seg-ic" aria-hidden="true">' + op.icon + '</span>' : '') + '<span>' + escHtml(op.label) + '</span></button>').join('') +
      '</div>';
    const btns = wrap.querySelectorAll('.lx-seg-btn');
    btns.forEach((b, i) => {
      b.onclick = () => {
        if (b.disabled) return;
        btns.forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
        o.onChange(o.options[i].v);
      };
    });
    wrap.set = v => btns.forEach((b, i) => {
      const on = o.options[i].v === v;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    wrap.disable = d => btns.forEach(b => { b.disabled = !!d; });
    return wrap;
  }
  function slider(o) {
    const id = 'lxr' + (++n);
    const wrap = document.createElement('div');
    wrap.className = 'lx-slider' + (o.cls ? ' ' + o.cls : '');
    wrap.innerHTML = '<div class="lx-slider-top"><label for="' + id + '">' + escHtml(o.label) + '</label><output for="' + id + '"></output></div>' +
      '<input type="range" id="' + id + '" min="' + o.min + '" max="' + o.max + '" step="' + (o.step || 1) + '" value="' + o.value + '">' +
      (o.ends ? '<div class="lx-slider-ends"><span>' + escHtml(o.ends[0]) + '</span><span>' + escHtml(o.ends[1]) + '</span></div>' : '');
    const inp = wrap.querySelector('input'), out = wrap.querySelector('output');
    const show = () => { out.textContent = o.fmt ? o.fmt(+inp.value) : inp.value; };
    inp.oninput = () => { show(); o.onInput(+inp.value); };
    show();
    wrap.set = v => { inp.value = v; show(); };
    wrap.input = inp;
    return wrap;
  }
  function button(label, onClick, cls, aria) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'lx-btn' + (cls ? ' ' + cls : '');
    b.innerHTML = label;
    if (aria) b.setAttribute('aria-label', aria);
    b.onclick = onClick;
    return b;
  }
  function row(children, cls) {
    const d = document.createElement('div');
    d.className = 'lx-row' + (cls ? ' ' + cls : '');
    children.forEach(c => c && d.appendChild(c));
    return d;
  }
  return { seg, slider, button, row };
})();


/* ════════════════════════════════════════════════════════════════
   COLOR MIXING — paint on a palette (subtractive) and light beams
   on a wall (additive), side by side.
   ════════════════════════════════════════════════════════════════ */
LXLabs.colors = (() => {
  'use strict';
  const A = LXArt;
  let api, S;

  // Pigments as rough reflectances (0..1) in R, G, B.
  const PAINTS = [
    { id: 'r', name: 'Red',    hex: '#D21F2C', refl: [0.82, 0.10, 0.14] },
    { id: 'y', name: 'Yellow', hex: '#F7C51E', refl: [0.98, 0.80, 0.06] },
    { id: 'b', name: 'Blue',   hex: '#1D57B8', refl: [0.04, 0.30, 0.72] },
    { id: 'w', name: 'White',  hex: '#F8F7F2', refl: [0.97, 0.97, 0.96] }
  ];
  const LIGHTS = [
    { id: 'R', name: 'Red', rgb: [255, 40, 40] },
    { id: 'G', name: 'Green', rgb: [40, 255, 60] },
    { id: 'B', name: 'Blue', rgb: [50, 80, 255] }
  ];

  const challenges = [
    { id: 'orange', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make orange paint',
      how: 'Tap red paint, then the big mixing well. Then yellow.', journal: 'Red + yellow paint made orange.',
      explain: 'Red and yellow paint make orange.',
      test: e => e.type === 'paint' && e.fam === 'orange' },
    { id: 'green', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make green paint',
      how: 'Which two paints make green? Wash the well first.', journal: 'Yellow + blue paint made green.',
      explain: 'Yellow and blue paint make green.',
      test: e => e.type === 'paint' && e.fam === 'green' },
    { id: 'purple', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make purple paint',
      journal: 'Red + blue paint made purple.', explain: 'Red and blue paint make purple (violet).',
      test: e => e.type === 'paint' && e.fam === 'purple' },
    { id: 'pink', kind: 'goal', tier: [0, 2], stars: 1, title: 'Make pink',
      how: 'Mix red with white.', journal: 'Red + white made pink.', explain: 'Adding white makes a color lighter. Light red is pink.',
      test: e => e.type === 'paint' && e.fam === 'pink' },
    { id: 'white', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make white light',
      how: 'Drag the three colored spots on the wall until they all overlap.', journal: 'Red + green + blue light made white.',
      explain: 'Red, green and blue light together look white to our eyes.',
      test: e => e.type === 'light' && e.combos.RGB },
    { id: 'pred-rg', kind: 'predict', tier: [1, 3], stars: 2, title: 'Red light + green light',
      q: 'Shine a red light and a green light on the same spot. What color will you see?',
      choices: ['Brown', 'Yellow', 'Dark green'], answer: 1,
      how: 'Turn the blue torch off, then overlap red and green.', journal: 'Red + green light made yellow!',
      explain: 'Light adds up: red + green light make yellow. Paint is different, because each paint soaks up (absorbs) some colors.',
      test: e => e.type === 'light' && e.combos.RG },
    { id: 'brown', kind: 'goal', tier: [1, 3], stars: 1, title: 'Make brown paint',
      how: 'Try all three paint colors in one well.', journal: 'Red + yellow + blue paint made brown.',
      explain: 'Mixing all three paint colors absorbs most of the light, so the mix turns brown or nearly black.',
      test: e => e.type === 'paint' && e.fam === 'brown' },
    { id: 'cyan', kind: 'goal', tier: [2, 3], stars: 1, title: 'Make cyan light',
      how: 'Cyan is a light blue-green. Which two torches?', journal: 'Green + blue light made cyan.',
      explain: 'Green + blue light make cyan, red + blue make magenta, red + green make yellow.',
      test: e => e.type === 'light' && e.combos.GB },
    { id: 'pred-three', kind: 'predict', tier: [2, 3], stars: 2, title: 'All three, paint vs light',
      q: 'Mix all three paints in the well, and overlap all three lights. Which one ends up LIGHTER?',
      choices: ['The paint', 'The light', 'Both get darker'], answer: 1,
      how: 'Make brown paint AND white light.', journal: 'All paints → dark brown, all lights → white.',
      explain: 'Paints subtract: each one takes away light, so more paint is darker. Lights add: more light is brighter.',
      test: e => S && S.madeBrown && S.madeWhite },
    { id: 'match', kind: 'goal', tier: [2, 3], stars: 2, title: 'Match the target color',
      how: 'Mix paint until it matches the target swatch next to the well. Count your dabs!',
      journal: 'Matched the target: 1 red + 2 yellow.', explain: 'This golden orange is 1 dab of red to 2 dabs of yellow.',
      target: { r: 1, y: 2, b: 0, w: 0 },
      test: e => e.type === 'paint' && _ratio(e.counts, { r: 1, y: 2, b: 0, w: 0 }) },
    { id: 'match2', kind: 'goal', tier: [3, 3], stars: 2, title: 'Match the mint green',
      how: 'This one needs three colors. Count your dabs!',
      journal: 'Matched mint: 1 yellow + 1 blue + 2 white.', explain: 'Mint is green made lighter: 1 yellow, 1 blue and 2 white.',
      target: { r: 0, y: 1, b: 1, w: 2 },
      test: e => e.type === 'paint' && _ratio(e.counts, { r: 0, y: 1, b: 1, w: 2 }) }
  ];

  function _ratio(c, t) {
    const keys = ['r', 'y', 'b', 'w'];
    let k = 0;
    for (const key of keys) if (t[key]) { k = c[key] / t[key]; break; }
    if (!k || k !== Math.round(k)) return false;
    return keys.every(key => c[key] === t[key] * k);
  }

  function mixPaint(counts) {
    let n = 0;
    const lg = [0, 0, 0], ar = [0, 0, 0];
    PAINTS.forEach(p => {
      const c = counts[p.id] || 0;
      if (!c) return;
      n += c;
      for (let i = 0; i < 3; i++) { lg[i] += Math.log(p.refl[i]) * c; ar[i] += p.refl[i] * c; }
    });
    if (!n) return null;
    // Mostly a geometric mean (subtractive), a little averaging to
    // stand in for the scattering a real paint film has.
    const rgb = lg.map((v, i) => {
      const geo = Math.exp(v / n), avg = ar[i] / n;
      return Math.pow(0.68 * geo + 0.32 * avg, 0.92) * 255;
    });
    return A.toHex(rgb[0], rgb[1], rgb[2]);
  }

  function family(c) {
    const r = c.r, y = c.y, b = c.b, w = c.w, n = r + y + b + w;
    if (!n) return { fam: null, name: '' };
    const light = w > 0 && w >= (r + y + b) * 0.5;
    if (r && y && b) return { fam: 'brown', name: light ? 'Light brown' : 'Brown' };
    if (r && y) return { fam: 'orange', name: (light ? 'Light ' : '') + (y >= r * 2 ? 'golden orange' : r >= y * 2 ? 'red-orange' : 'orange') };
    if (y && b) return { fam: 'green', name: light ? 'Mint green' : (y >= b * 2 ? 'Yellow-green' : b >= y * 2 ? 'Blue-green' : 'Green') };
    if (r && b) return { fam: 'purple', name: light ? 'Lilac' : 'Purple' };
    if (r) return w ? { fam: 'pink', name: 'Pink' } : { fam: 'red', name: 'Red' };
    if (y) return w ? { fam: 'cream', name: 'Cream' } : { fam: 'yellow', name: 'Yellow' };
    if (b) return w ? { fam: 'lightblue', name: 'Light blue' } : { fam: 'blue', name: 'Blue' };
    return { fam: 'white', name: 'White' };
  }

  function layout() {
    const W = api.W, H = api.H;
    if (api.narrow) {
      S.P = { x: 0, y: 0, w: W, h: 300 };
      S.L = { x: 0, y: 300, w: W, h: H - 300 };
    } else {
      S.P = { x: 0, y: 0, w: 290, h: H };
      S.L = { x: 290, y: 0, w: W - 290, h: H };
    }
    const P = S.P;
    const n = PAINTS.length;
    if (api.narrow) {
      const gap = 74;
      S.wells = PAINTS.map((p, i) => ({ p, x: 70, y: 52 + i * gap * 0.92, r: 27 }));
      S.mix = { x: 340, y: 150, r: 112 };
      S.target = { x: 530, y: 64, r: 34 };
    } else {
      const gap = 62;
      S.wells = PAINTS.map((p, i) => ({ p, x: P.x + 52 + i * gap, y: 74, r: 24 }));
      S.mix = { x: P.x + 145, y: 258, r: 104 };
      S.target = { x: P.x + 248, y: 152, r: 28 };
    }
    // Light box
    const L = S.L;
    S.wall = { x: L.x + 16, y: L.y + 16, w: L.w - 32, h: L.h - 106 };
    const sr = api.narrow ? 74 : 58;
    const cx = S.wall.x + S.wall.w / 2, cy = S.wall.y + S.wall.h / 2;
    // start apart, so mixing is something the kid does
    const startPos = api.narrow
      ? [[cx - sr * 1.95, cy + sr * 0.25], [cx, cy - sr * 0.45], [cx + sr * 1.95, cy + sr * 0.25]]
      : [[cx - sr * 1.2, cy - sr * 1.2], [cx + sr * 1.2, cy - sr * 1.2], [cx, cy + sr * 1.25]];
    if (!S.spots) {
      S.spots = LIGHTS.map((l, i) => ({ l, on: true, r: sr, x: startPos[i][0], y: startPos[i][1] }));
    } else {
      S.spots.forEach(s => { s.r = sr; s.x = Math.max(S.wall.x + 10, Math.min(S.wall.x + S.wall.w - 10, s.x)); s.y = Math.max(S.wall.y + 10, Math.min(S.wall.y + S.wall.h - 10, s.y)); });
    }
    S.torches = LIGHTS.map((l, i) => ({ l, x: L.x + L.w * (0.22 + i * 0.28), y: L.y + L.h - 40 }));
  }

  function start(a) {
    api = a;
    S = { counts: { r: 0, y: 0, b: 0, w: 0 }, color: null, prevColor: null, swirl: 0, swirlColor: null,
      loaded: null, brush: { x: 0, y: 0, tx: 0, ty: 0, dip: 0 }, drag: null, madeBrown: false, madeWhite: false, t: 0 };
    layout();
    S.brush.x = S.brush.tx = S.mix.x + S.mix.r * 0.9;
    S.brush.y = S.brush.ty = S.mix.y - S.mix.r * 0.7;
    buildControls();
  }

  function buildControls() {
    const c = api.controls;
    c.innerHTML = '';
    const wash = LXUI.button('🫧 Wash the well', () => {
      S.counts = { r: 0, y: 0, b: 0, w: 0 }; S.color = null; S.swirl = 0; S.loaded = null;
      api.sfx('click'); updateReadout();
    }, 'lx-btn-soft');
    const all = LXUI.button('💡 All torches on', () => {
      S.spots.forEach(s => s.on = true); api.sfx('click'); checkLight();
    }, 'lx-btn-soft');
    c.appendChild(LXUI.row([wash, all]));
    const ro = document.createElement('div');
    ro.className = 'lx-readout'; ro.id = 'lx-col-readout';
    c.appendChild(ro);
    updateReadout();
  }

  function updateReadout() {
    const ro = document.getElementById('lx-col-readout');
    if (!ro) return;
    const c = S.counts, n = c.r + c.y + c.b + c.w;
    if (!n) { ro.innerHTML = '<b>Paint:</b> the well is empty. <b>Light:</b> tap a torch to switch it on or off.'; return; }
    const parts = PAINTS.filter(p => c[p.id]).map(p => c[p.id] + ' ' + p.name.toLowerCase());
    ro.innerHTML = '<span class="lx-swatch" style="background:' + S.color + '"></span><b>' + escHtml(family(c).name) + '</b> = ' + escHtml(parts.join(' + '));
  }

  function addDab(p) {
    S.counts[p.id]++;
    S.prevColor = S.color;
    S.color = mixPaint(S.counts);
    S.swirl = 1; S.swirlColor = p.hex;
    S.brush.tx = S.mix.x + (Math.random() - 0.5) * 30; S.brush.ty = S.mix.y - 6; S.brush.dip = 1;
    api.sfx('click');
    const f = family(S.counts);
    if (f.fam === 'brown') S.madeBrown = true;
    updateReadout();
    api.emit({ type: 'paint', counts: Object.assign({}, S.counts), fam: f.fam, name: f.name });
  }

  // Which light combinations are visible on the wall right now.
  function checkLight() {
    const combos = {};
    const wl = S.wall;
    for (let x = wl.x; x < wl.x + wl.w; x += 8) {
      for (let y = wl.y; y < wl.y + wl.h; y += 8) {
        let k = '';
        S.spots.forEach(s => { if (s.on && Math.hypot(x - s.x, y - s.y) < s.r * 0.86) k += s.l.id; });
        if (k.length >= 2) combos[k] = true;
      }
    }
    if (combos.RGB) S.madeWhite = true;
    api.emit({ type: 'light', combos });
  }

  // ── Input ──
  function hitWell(p) { return S.wells.find(w => Math.hypot(p.x - w.x, p.y - w.y) < w.r + 16); }
  function inMix(p) { return Math.hypot(p.x - S.mix.x, p.y - S.mix.y) < S.mix.r + 6; }

  function down(p) {
    const w = hitWell(p);
    if (w) {
      S.loaded = w.p; S.drag = { kind: 'brush', moved: false };
      S.brush.tx = w.x + 4; S.brush.ty = w.y - 2; S.brush.dip = 1;
      api.sfx('click');
      return;
    }
    if (inMix(p)) {
      if (S.loaded) addDab(S.loaded);
      else api.toast('First tap a paint color, then tap here.');
      return;
    }
    const sp = S.spots.slice().reverse().find(s => s.on && Math.hypot(p.x - s.x, p.y - s.y) < s.r * 0.8);
    if (sp) { S.drag = { kind: 'spot', s: sp, dx: p.x - sp.x, dy: p.y - sp.y }; return; }
    const tc = S.torches.find(t => Math.abs(p.x - t.x) < 44 && Math.abs(p.y - t.y) < 46);
    if (tc) {
      const s = S.spots.find(x => x.l.id === tc.l.id);
      s.on = !s.on; api.sfx('click');
      checkLight();
    }
  }
  function move(p, e, pressed) {
    if (!S.drag || !pressed) return;
    if (S.drag.kind === 'spot') {
      const s = S.drag.s, wl = S.wall;
      s.x = Math.max(wl.x + 6, Math.min(wl.x + wl.w - 6, p.x - S.drag.dx));
      s.y = Math.max(wl.y + 6, Math.min(wl.y + wl.h - 6, p.y - S.drag.dy));
    } else if (S.drag.kind === 'brush') {
      S.drag.moved = true;
      S.brush.tx = p.x; S.brush.ty = p.y;
    }
  }
  function up(p) {
    if (!S.drag) return;
    if (S.drag.kind === 'spot') checkLight();
    else if (S.drag.kind === 'brush' && S.drag.moved && S.loaded && inMix(p)) addDab(S.loaded);
    S.drag = null;
  }

  // ── Drawing ──
  function frame(dt, t) {
    S.t = t;
    const ctx = api.ctx;
    const b = S.brush;
    b.x += (b.tx - b.x) * Math.min(1, dt * 12);
    b.y += (b.ty - b.y) * Math.min(1, dt * 12);
    b.dip = Math.max(0, b.dip - dt * 2.5);
    S.swirl = Math.max(0, S.swirl - dt * 0.7);
    drawPaint(ctx, t);
    drawLight(ctx, t);
  }

  function drawPaint(ctx, t) {
    const P = S.P;
    ctx.save();
    ctx.beginPath(); ctx.rect(P.x, P.y, P.w, P.h); ctx.clip();
    ctx.drawImage(A.wood(Math.round(P.w), Math.round(P.h), '#B98552', 21), P.x, P.y);
    // porcelain palette tray
    const m = 12;
    ctx.save();
    ctx.shadowColor = 'rgba(40,20,5,0.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
    A.rr(ctx, P.x + m, P.y + m, P.w - m * 2, P.h - m * 2, 26);
    const pg = ctx.createLinearGradient(P.x, P.y, P.x + P.w, P.y + P.h);
    pg.addColorStop(0, '#FFFFFF'); pg.addColorStop(1, '#E9E6E0');
    ctx.fillStyle = pg; ctx.fill();
    ctx.restore();
    A.rr(ctx, P.x + m + 3, P.y + m + 3, P.w - m * 2 - 6, P.h - m * 2 - 6, 23);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();

    // small wells with paint
    S.wells.forEach(w => {
      wellHollow(ctx, w.x, w.y, w.r + 6);
      paintBlob(ctx, w.x, w.y, w.r, w.p.hex, w.p.id.charCodeAt(0), t);
      if (S.loaded === w.p) {
        ctx.strokeStyle = '#7C3AED'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r + 10, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#5B5566';
      ctx.font = '800 ' + (api.narrow ? 17 : 13) + 'px Nunito, sans-serif';
      ctx.textAlign = api.narrow ? 'left' : 'center'; ctx.textBaseline = 'middle';
      if (api.narrow) ctx.fillText(w.p.name, w.x + w.r + 14, w.y);
      else ctx.fillText(w.p.name, w.x, w.y + w.r + 18);
    });

    // mixing well
    const mx = S.mix;
    wellHollow(ctx, mx.x, mx.y, mx.r + 10);
    if (S.color) {
      ctx.save();
      ctx.beginPath(); ctx.arc(mx.x, mx.y, mx.r, 0, Math.PI * 2); ctx.clip();
      const base = S.swirl > 0 && S.prevColor ? A.mix(S.color, S.prevColor, S.swirl * 0.6) : S.color;
      const g = ctx.createRadialGradient(mx.x - mx.r * 0.3, mx.y - mx.r * 0.35, mx.r * 0.1, mx.x, mx.y, mx.r);
      g.addColorStop(0, A.shade(base, 0.18)); g.addColorStop(0.7, base); g.addColorStop(1, A.shade(base, -0.25));
      ctx.fillStyle = g; ctx.fillRect(mx.x - mx.r, mx.y - mx.r, mx.r * 2, mx.r * 2);
      if (S.swirl > 0 && S.swirlColor) {
        ctx.strokeStyle = A.rgba(S.swirlColor, 0.85 * S.swirl);
        ctx.lineCap = 'round';
        for (let k = 0; k < 3; k++) {
          ctx.lineWidth = (10 - k * 3) * S.swirl + 2;
          ctx.beginPath();
          const rot = (1 - S.swirl) * 7 + k * 2.1;
          for (let a = 0; a < 4.6; a += 0.12) {
            const rr = 8 + a * mx.r * 0.17;
            const x = mx.x + Math.cos(a + rot) * rr, y = mx.y + Math.sin(a + rot) * rr * 0.9;
            if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      // gloss
      const gl = ctx.createLinearGradient(mx.x - mx.r, mx.y - mx.r, mx.x, mx.y);
      gl.addColorStop(0, 'rgba(255,255,255,0.45)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.ellipse(mx.x - mx.r * 0.35, mx.y - mx.r * 0.45, mx.r * 0.45, mx.r * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      A.label(ctx, family(S.counts).name, mx.x, mx.y + mx.r + (api.narrow ? -8 : 2), { size: api.narrow ? 20 : 15 });
    } else {
      ctx.fillStyle = '#9A94A6';
      ctx.font = '700 ' + (api.narrow ? 20 : 15) + 'px Nunito, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(S.loaded ? 'Tap here to add ' + S.loaded.name.toLowerCase() : 'Mixing well', mx.x, mx.y - 8);
      ctx.font = '600 ' + (api.narrow ? 16 : 12) + 'px Nunito, sans-serif';
      ctx.fillText(S.loaded ? '' : 'pick a paint first', mx.x, mx.y + 16);
    }

    // target swatch for the match challenges
    const act = api.active();
    if (act && act.target && !api.isDone(act.id)) {
      const tg = S.target, col = mixPaint(act.target);
      wellHollow(ctx, tg.x, tg.y, tg.r + 5);
      paintBlob(ctx, tg.x, tg.y, tg.r, col, 5, 0);
      A.label(ctx, 'Target', tg.x, tg.y + tg.r + 16, { size: 13, bg: '#312E81', color: '#fff' });
    }

    drawBrush(ctx);
    ctx.restore();
  }

  function wellHollow(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x, y - r * 0.25, r * 0.4, x, y, r);
    g.addColorStop(0, '#F4F2EE'); g.addColorStop(0.82, '#DDD8D0'); g.addColorStop(1, '#C9C3B9');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }

  function paintBlob(ctx, x, y, r, hex, seed, t) {
    const rnd = A.rng(seed * 31 + 7);
    ctx.save();
    ctx.beginPath();
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2, rr = r * (0.86 + rnd() * 0.18);
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.92;
      if (i === 0) ctx.moveTo(px, py); else ctx.quadraticCurveTo(x + Math.cos(a - 0.26) * rr * 1.05, y + Math.sin(a - 0.26) * rr, px, py);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * 1.05);
    g.addColorStop(0, A.shade(hex, 0.25)); g.addColorStop(0.6, hex); g.addColorStop(1, A.shade(hex, -0.3));
    ctx.fillStyle = g;
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.28, r * 0.13, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawBrush(ctx) {
    const b = S.brush;
    const ang = -0.75;
    ctx.save();
    ctx.translate(b.x, b.y + b.dip * 4);
    ctx.rotate(ang);
    A.shadow(ctx, 30, 26, 70, 10, 0.18);
    // bristles
    const tip = S.loaded ? S.loaded.hex : '#D6C7A6';
    ctx.fillStyle = '#C9B68C';
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.quadraticCurveTo(-22, -6, -30, 0); ctx.quadraticCurveTo(-22, 6, 0, 7); ctx.fill();
    ctx.fillStyle = tip;
    ctx.beginPath(); ctx.moveTo(-10, -6); ctx.quadraticCurveTo(-24, -5, -30, 0); ctx.quadraticCurveTo(-24, 5, -10, 6); ctx.fill();
    // ferrule
    const fg = ctx.createLinearGradient(0, -8, 0, 8);
    fg.addColorStop(0, '#F1F3F6'); fg.addColorStop(0.5, '#9AA3AF'); fg.addColorStop(1, '#5F6773');
    ctx.fillStyle = fg; ctx.fillRect(0, -8, 22, 16);
    // handle
    const hg = ctx.createLinearGradient(0, -6, 0, 6);
    hg.addColorStop(0, '#C0612B'); hg.addColorStop(0.5, '#8E3A12'); hg.addColorStop(1, '#5E230A');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.moveTo(22, -6); ctx.lineTo(118, -3.5); ctx.quadraticCurveTo(126, 0, 118, 3.5); ctx.lineTo(22, 6); ctx.fill();
    ctx.restore();
  }

  function drawLight(ctx, t) {
    const L = S.L, wl = S.wall;
    ctx.save();
    ctx.beginPath(); ctx.rect(L.x, L.y, L.w, L.h); ctx.clip();
    const bg = ctx.createLinearGradient(0, L.y, 0, L.y + L.h);
    bg.addColorStop(0, '#15151F'); bg.addColorStop(1, '#07070C');
    ctx.fillStyle = bg; ctx.fillRect(L.x, L.y, L.w, L.h);
    // the white wall/screen, barely lit
    A.rr(ctx, wl.x, wl.y, wl.w, wl.h, 8);
    ctx.fillStyle = '#1E1E28'; ctx.fill();
    ctx.strokeStyle = '#2E2E3C'; ctx.lineWidth = 2; ctx.stroke();
    // floor
    const fl = ctx.createLinearGradient(0, wl.y + wl.h, 0, L.y + L.h);
    fl.addColorStop(0, '#22202A'); fl.addColorStop(1, '#0C0B10');
    ctx.fillStyle = fl; ctx.fillRect(L.x, wl.y + wl.h + 6, L.w, L.h);

    // beams through the air, then spots on the wall — light adds up
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    S.spots.forEach((s, i) => {
      if (!s.on) return;
      const tc = S.torches[i], c = s.l.rgb;
      const g = ctx.createLinearGradient(tc.x, tc.y, s.x, s.y);
      g.addColorStop(0, 'rgba(' + c + ',0.32)'); g.addColorStop(1, 'rgba(' + c + ',0.05)');
      ctx.fillStyle = g;
      const ax = s.x - tc.x, ay = s.y - tc.y, len = Math.hypot(ax, ay) || 1, nx = -ay / len, ny = ax / len;
      ctx.beginPath();
      ctx.moveTo(tc.x + nx * 9, tc.y - 26 + ny * 9); ctx.lineTo(tc.x - nx * 9, tc.y - 26 - ny * 9);
      ctx.lineTo(s.x - nx * s.r * 0.75, s.y - ny * s.r * 0.75); ctx.lineTo(s.x + nx * s.r * 0.75, s.y + ny * s.r * 0.75);
      ctx.closePath(); ctx.fill();
    });
    ctx.beginPath(); A.rr(ctx, wl.x, wl.y, wl.w, wl.h, 8); ctx.clip();
    S.spots.forEach(s => {
      if (!s.on) return;
      const c = s.l.rgb;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 1.08);
      g.addColorStop(0, 'rgba(' + c + ',1)'); g.addColorStop(0.72, 'rgba(' + c + ',0.95)');
      g.addColorStop(0.9, 'rgba(' + c + ',0.35)'); g.addColorStop(1, 'rgba(' + c + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 1.08, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();

    // torches
    S.torches.forEach((tc, i) => {
      const s = S.spots[i];
      drawTorch(ctx, tc.x, tc.y, Math.atan2(s.y - tc.y, s.x - tc.x) + Math.PI / 2, s.l, s.on);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '700 ' + (api.narrow ? 16 : 12) + 'px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Light · Luz', wl.x + wl.w / 2, wl.y + (api.narrow ? 22 : 18));
    ctx.restore();

    const P = S.P;
    ctx.fillStyle = 'rgba(70,45,20,0.85)';
    ctx.font = '800 ' + (api.narrow ? 16 : 12) + 'px Nunito, sans-serif';
    ctx.textAlign = api.narrow ? 'right' : 'center';
    ctx.fillText('Paint · Pintura', api.narrow ? P.x + P.w - 24 : P.x + P.w / 2, P.y + P.h - (api.narrow ? 20 : 20));
  }

  function drawTorch(ctx, x, y, ang, l, on) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.max(-0.7, Math.min(0.7, ang)));
    const body = ctx.createLinearGradient(-14, 0, 14, 0);
    body.addColorStop(0, '#3A3F48'); body.addColorStop(0.45, '#C9CED6'); body.addColorStop(1, '#2A2E35');
    ctx.fillStyle = body;
    A.rr(ctx, -12, -10, 24, 46, 6); ctx.fill();
    const head = ctx.createLinearGradient(-18, 0, 18, 0);
    head.addColorStop(0, '#2A2E35'); head.addColorStop(0.5, '#AEB5BF'); head.addColorStop(1, '#22262C');
    ctx.fillStyle = head;
    ctx.beginPath(); ctx.moveTo(-12, -10); ctx.lineTo(-18, -26); ctx.lineTo(18, -26); ctx.lineTo(12, -10); ctx.fill();
    ctx.fillStyle = on ? 'rgb(' + l.rgb + ')' : '#3B3B46';
    ctx.beginPath(); ctx.ellipse(0, -26, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (on) {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, -26, 0, 0, -26, 30);
      g.addColorStop(0, 'rgba(' + l.rgb + ',0.8)'); g.addColorStop(1, 'rgba(' + l.rgb + ',0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -26, 30, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    // switch
    ctx.fillStyle = on ? '#22C55E' : '#7F1D1D';
    A.rr(ctx, -4, 6, 8, 12, 3); ctx.fill();
    ctx.restore();
  }

  function onActive() { /* the target swatch draws itself */ }
  function stop() {}
  function resize() { layout(); }

  return { challenges, start, frame, down, move, up, stop, resize, onActive, _S: () => S };
})();


/* ════════════════════════════════════════════════════════════════
   WATER CYCLE — a landscape: sun, sea, a cloud you build and blow,
   rain or snow on the Andes, and a river that runs back to the sea.
   ════════════════════════════════════════════════════════════════ */
LXLabs.water = (() => {
  'use strict';
  const A = LXArt;
  let api, S, ui = {};

  const challenges = [
    { id: 'evap', kind: 'goal', tier: [0, 3], stars: 1, title: 'Warm the sea',
      how: 'Slide the Sun up. Watch water vapor rise from the sea.', journal: 'Evaporation: the sun turned sea water into vapor.',
      explain: 'Sunshine warms the water and some of it turns into an invisible gas, water vapor. That is evaporation.',
      test: e => e.type === 'vapor' },
    { id: 'cloud', kind: 'goal', tier: [0, 3], stars: 1, title: 'Build a cloud',
      how: 'Keep the sun shining until a cloud grows.', journal: 'Condensation: vapor cooled into a cloud.',
      explain: 'High up the air is cold. The vapor cools and turns into tiny droplets: a cloud. That is condensation.',
      test: e => e.type === 'cloud' },
    { id: 'rain', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make it rain',
      how: 'Use the Wind to blow your cloud over the mountains.', journal: 'Precipitation: rain fell from the cloud.',
      explain: 'When the droplets join and get heavy, they fall as rain. That is precipitation.',
      test: e => e.type === 'rain' },
    { id: 'lake', kind: 'goal', tier: [0, 3], stars: 1, title: 'Fill the lake',
      how: 'Rain on the land runs downhill into the lake.', journal: 'Collection: runoff filled the lake.',
      explain: 'Rain runs downhill in streams and rivers and collects in lakes and the sea.',
      test: e => e.type === 'lake' },
    { id: 'pred-sun', kind: 'predict', tier: [1, 3], stars: 2, title: 'No sun?',
      q: 'The sea is steaming. What happens if you turn the sun right down?',
      choices: ['More vapor rises', 'The vapor stops rising', 'The sea gets bigger'], answer: 1,
      how: 'Get vapor rising, then slide the Sun to zero.', journal: 'Without the sun\'s heat, evaporation stopped.',
      explain: 'Evaporation needs energy. Less heat means less water turns into vapor.',
      test: e => e.type === 'nosun' },
    { id: 'pred-mtn', kind: 'predict', tier: [2, 3], stars: 2, title: 'Where does it rain first?',
      q: 'Your cloud is full of water. Where will it start to rain?',
      choices: ['Over the sea', 'Over the mountains', 'It never rains'], answer: 1,
      how: 'Blow the cloud with the wind and watch.', journal: 'Rain started when the cloud reached the mountains.',
      explain: 'Wind pushes the air up the mountain side. Rising air cools, so more vapor condenses and it rains.',
      test: e => e.type === 'rain' && e.where === 'mountain' },
    { id: 'snow', kind: 'goal', tier: [1, 3], stars: 1, title: 'Snow on the Andes',
      how: 'Set the mountain to Cold, then blow a full cloud there.', journal: 'It snowed on the cold mountain tops.',
      explain: 'When the air is below freezing, the water falls as snow instead of rain.',
      test: e => e.type === 'snow' },
    { id: 'melt', kind: 'goal', tier: [2, 3], stars: 1, title: 'Melt the snow into the river',
      how: 'With snow on the peaks, set the mountain to Warm.', journal: 'Melting snow fed the river.',
      explain: 'In Chile, rivers such as the Maipo get much of their water from snow melting in the Andes.',
      test: e => e.type === 'melt' },
    { id: 'cycle', kind: 'goal', tier: [2, 3], stars: 2, title: 'Complete the whole cycle',
      how: 'Sea → vapor → cloud → rain on land → river → back to the sea.', journal: 'A full water cycle: water came back to the sea.',
      explain: 'The same water goes round and round: evaporation, condensation, precipitation and collection.',
      test: e => e.type === 'cycle' }
  ];

  function start(a) {
    api = a;
    S = { sun: 0.15, wind: 0, cold: false, t: 0,
      vapor: [], drops: [], flakes: [],
      cloud: { x: 0, water: 0, puffs: null, seed: 4, rainT: 0 },
      snow: 0, lake: 0.12, flow: 0, toSea: 0, rainedLand: 0, evapOn: false, hadVapor: false,
      emitted: {}, ripples: [] };
    geom();
    S.cloud.x = api.W * 0.22;
    buildControls();
    bg = null;
  }

  let bg = null;
  function geom() {
    const W = api.W, H = api.H;
    S.seaY = H * 0.72;
    S.seaR = W * 0.38;          // sea ends here (beach starts)
    S.cloudY = api.narrow ? H * 0.22 : H * 0.20;
    S.mtnX = W * 0.64;           // rain over x > this is "mountain"
    S.sunX = W * 0.11; S.sunY = api.narrow ? H * 0.09 : H * 0.12;
    S.lakeC = { x: W * 0.53, y: 0, rx: W * 0.06, ry: 9 };
    S.lakeC.y = ground(S.lakeC.x) - 3;
    // the river follows the land: from high on the slope down to the
    // lake, then from the lake to the sea
    S.river1 = []; S.river2 = [];
    for (let x = W * 0.86; x >= S.lakeC.x + S.lakeC.rx * 0.5; x -= W * 0.02) {
      const wig = Math.sin(x * 0.05) * 6;
      S.river1.push([x + wig, ground(x + wig) + 3]);
    }
    S.river1.push([S.lakeC.x + S.lakeC.rx * 0.6, S.lakeC.y]);
    for (let x = S.lakeC.x - S.lakeC.rx * 0.8; x >= S.seaR - 6; x -= W * 0.02) S.river2.push([x, Math.min(ground(x) + 3, S.seaY + 2)]);
    S.river2.push([S.seaR - 8, S.seaY + 2]);
  }

  function ground(x) {
    // y of the land surface at x, right of the sea
    const W = api.W, H = api.H, sy = S.seaY;
    const He = Math.min(H, 440);
    if (x < S.seaR) return sy + 30;
    const u = (x - S.seaR) / (W - S.seaR);
    let y = sy - 2 - Math.min(1, u * 8) * 4 - u * He * 0.04;
    const peaks = [[0.60, 0.52, 0.11], [0.78, 0.70, 0.10], [0.93, 0.60, 0.09], [0.70, 0.40, 0.06]];
    peaks.forEach(p => {
      const d = (u - p[0]) / p[2];
      y -= Math.exp(-d * d) * He * p[1] * 0.62;
    });
    // rocky, jagged ridge
    const m = Math.max(0, Math.min(1, (u - 0.42) * 3));
    y += (Math.sin(u * 61) * 3 + Math.sin(u * 137) * 1.6) * m;
    // the lake hollow
    const dl = (x - W * 0.53) / (W * 0.08);
    y += Math.exp(-dl * dl) * 6;
    return y;
  }

  function buildControls() {
    const c = api.controls;
    c.innerHTML = '';
    ui.sun = LXUI.slider({ label: '☀️ Sun · Sol', min: 0, max: 100, value: Math.round(S.sun * 100), fmt: v => v + '%',
      ends: ['weak', 'strong'], onInput: v => { S.sun = v / 100; } });
    ui.wind = LXUI.slider({ label: '🌬️ Wind · Viento', min: -100, max: 100, value: 0,
      fmt: v => v === 0 ? 'calm' : (v < 0 ? '← ' : '') + Math.abs(v) + '%' + (v > 0 ? ' →' : ''),
      ends: ['← to the sea', 'to the mountains →'], onInput: v => { S.wind = v / 100; } });
    c.appendChild(LXUI.row([ui.sun, ui.wind], 'lx-row-2'));
    const segs = [];
    if (api.tier >= 1) {
      ui.temp = LXUI.seg({ label: '🏔️ Mountain air', value: 'warm',
        options: [{ v: 'warm', label: 'Warm' }, { v: 'cold', label: 'Cold (below 0 °C)' }],
        onChange: v => { S.cold = v === 'cold'; } });
      segs.push(ui.temp);
    }
    segs.push(LXUI.button('↺ Start again', () => { start(api); api.sfx('click'); }, 'lx-btn-soft'));
    c.appendChild(LXUI.row(segs));
  }

  function emitOnce(type, data) {
    if (S.emitted[type]) return;
    S.emitted[type] = true;
    api.emit(Object.assign({ type }, data || {}));
  }

  function frame(dt, t) {
    S.t = t;
    const W = api.W, H = api.H, cl = S.cloud;
    // evaporation
    const evapRate = Math.max(0, S.sun - 0.12) * 1.15;
    S.evapOn = evapRate > 0.04;
    if (S.evapOn) {
      S.hadVapor = true;
      if (Math.random() < evapRate * dt * 26) {
        S.vapor.push({ x: Math.random() * S.seaR * 0.95, y: S.seaY - 2, a: 0, ph: Math.random() * 6, v: 26 + Math.random() * 18 });
      }
      emitOnce('vapor');
    } else if (S.hadVapor && S.sun < 0.05) {
      emitOnce('nosun');
    }
    // vapor rises, drifts with the wind and joins the cloud
    for (let i = S.vapor.length - 1; i >= 0; i--) {
      const v = S.vapor[i];
      v.y -= v.v * dt; v.a = Math.min(1, v.a + dt * 1.5);
      v.x += (S.wind * 40 + (cl.x - v.x) * 0.25 * (1 - (v.y - S.cloudY) / (S.seaY - S.cloudY))) * dt;
      if (v.y < S.cloudY + 18) {
        S.vapor.splice(i, 1);
        if (cl.water < 0.02) cl.x = v.x;
        cl.water = Math.min(1.6, cl.water + 0.012);
      }
    }
    // the cloud
    cl.x += S.wind * 46 * dt;
    cl.x = Math.max(W * 0.08, Math.min(W * 0.93, cl.x));
    if (cl.water > 0.35) emitOnce('cloud');
    const overMtn = cl.x > S.mtnX - 10;
    let raining = false;
    if ((overMtn && cl.water > 0.42) || cl.water > 1.45 || (cl.rainT > 0 && cl.water > 0.12)) {
      raining = true;
      cl.rainT = 0.6;
      const rate = 0.09 * dt * (overMtn ? 1.6 : 1);
      cl.water = Math.max(0, cl.water - rate);
      const snowing = S.cold && overMtn;
      const n = Math.random() < 0.9 ? 2 : 1;
      const cw = cloudW();
      for (let k = 0; k < n; k++) {
        const x = cl.x + (Math.random() - 0.5) * cw * 0.7;
        if (snowing) S.flakes.push({ x, y: S.cloudY + 26, vx: 0, vy: 40 + Math.random() * 20, ph: Math.random() * 6 });
        else S.drops.push({ x, y: S.cloudY + 26, vy: 260 + Math.random() * 80 });
      }
      if (snowing) emitOnce('snow');
      else if (!S.emitted.rain) emitOnce('rain', { where: overMtn ? 'mountain' : 'sea' });
    }
    cl.rainT = Math.max(0, cl.rainT - dt);
    // raindrops land
    for (let i = S.drops.length - 1; i >= 0; i--) {
      const d = S.drops[i];
      d.y += d.vy * dt; d.x += S.wind * 30 * dt;
      const gy = ground(d.x);
      if (d.y >= gy) {
        S.drops.splice(i, 1);
        if (d.x > S.seaR) { S.flow += 0.006; S.rainedLand += 1; }
        else S.ripples.push({ x: d.x, y: S.seaY, r: 1, a: 0.6 });
      }
    }
    for (let i = S.flakes.length - 1; i >= 0; i--) {
      const f = S.flakes[i];
      f.y += f.vy * dt; f.x += (Math.sin(t * 2 + f.ph) * 18 + S.wind * 30) * dt;
      if (f.y >= ground(f.x)) { S.flakes.splice(i, 1); if (f.x > S.mtnX - 40) S.snow = Math.min(1, S.snow + 0.004); }
    }
    // snow melts when warm
    if (!S.cold && S.snow > 0) {
      const m = Math.min(S.snow, dt * (0.02 + S.sun * 0.05));
      S.snow -= m; S.flow += m * 0.9;
      if (m > 0) S.melting = 0.8;
      if (S.snow < 0.75 && S.peakSnow > 0.3) emitOnce('melt');
    }
    S.peakSnow = Math.max(S.peakSnow || 0, S.snow);
    S.melting = Math.max(0, (S.melting || 0) - dt);
    // runoff → lake → sea
    const out = S.flow * dt * 0.6;
    S.flow = Math.max(0, S.flow - out);
    S.flow = Math.min(S.flow, 1.4);
    S.lake = Math.min(1, S.lake + out * 0.8);
    if (S.lake > 0.82) emitOnce('lake');
    if (S.lake > 0.6) { S.toSea += out; S.lake -= out * 0.5; }
    if (S.toSea > 0.12 && S.rainedLand > 20) emitOnce('cycle');
    for (let i = S.ripples.length - 1; i >= 0; i--) { const r = S.ripples[i]; r.r += dt * 18; r.a -= dt * 0.9; if (r.a <= 0) S.ripples.splice(i, 1); }

    draw(api.ctx, t, raining);
  }

  function cloudW() { return api.W * (0.16 + Math.sqrt(S.cloud.water) * 0.16); }

  function drawStatic() {
    const W = api.W, H = api.H;
    ZsCanvas.release(bg); // free the previous backdrop now
    bg = A.offscreen(W * 2, H * 2);
    const x = ZsCanvas.get2d(bg);
    if (!x) { ZsCanvas.release(bg); bg = null; return; } // no canvas memory: no backdrop
    x.scale(2, 2);
    // far range of the Andes, hazy blue with snowy tops
    const He = Math.min(H, 440);
    const ridge = px => { const u = (px - S.seaR) / (W - S.seaR); return S.seaY - 10 - He * (0.16 + 0.22 * Math.pow(Math.abs(Math.sin(u * 5.1 + 0.7)), 1.6) + 0.04 * Math.sin(u * 23)) * Math.min(1, Math.max(0, u * 1.6 + 0.1)); };
    const fg = x.createLinearGradient(0, S.seaY - He * 0.45, 0, S.seaY);
    fg.addColorStop(0, '#A9B8CC'); fg.addColorStop(1, '#C7D3DF');
    x.fillStyle = fg;
    x.beginPath(); x.moveTo(S.seaR - 10, S.seaY);
    for (let px = S.seaR - 10; px <= W; px += 5) x.lineTo(px, ridge(px));
    x.lineTo(W, S.seaY); x.closePath(); x.fill();
    x.save(); x.clip();
    x.fillStyle = 'rgba(255,255,255,0.85)';
    x.beginPath(); x.moveTo(S.seaR, 0);
    for (let px = S.seaR - 10; px <= W; px += 5) x.lineTo(px, Math.min(ridge(px) + 14 + Math.sin(px * 0.3) * 5, S.seaY - He * 0.28));
    x.lineTo(W, 0); x.closePath(); x.fill();
    x.restore();
    // land
    const lg = x.createLinearGradient(0, S.seaY - Math.min(H, 440) * 0.45, 0, H);
    lg.addColorStop(0, '#7E8B76'); lg.addColorStop(0.3, '#6E8F4E'); lg.addColorStop(0.62, '#4A7A33'); lg.addColorStop(0.7, '#6B5032'); lg.addColorStop(1, '#4A3520');
    x.fillStyle = lg;
    x.beginPath(); x.moveTo(S.seaR - 60, H); x.lineTo(S.seaR, S.seaY + 20);
    for (let px = S.seaR; px <= W + 4; px += 3) x.lineTo(px, ground(Math.max(px, S.seaR + 1)));
    x.lineTo(W, H); x.closePath(); x.fill();
    // rock texture on the slopes
    const r = A.rng(17);
    x.strokeStyle = 'rgba(60,55,45,0.25)'; x.lineWidth = 1.2;
    for (let i = 0; i < 70; i++) {
      const px = S.seaR + r() * (W - S.seaR), py = ground(px) + 4 + r() * 40;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + 6 + r() * 8, py - 3 - r() * 6); x.stroke();
    }
    // a few trees in the valley
    for (let i = 0; i < 14; i++) {
      const px = S.seaR + 20 + r() * W * 0.28, py = ground(px) + 2;
      x.fillStyle = '#2F5A26';
      x.beginPath(); x.moveTo(px, py - 16 - r() * 6); x.lineTo(px - 6, py); x.lineTo(px + 6, py); x.fill();
    }
    // beach
    const bg2 = x.createLinearGradient(0, S.seaY, 0, H);
    bg2.addColorStop(0, '#EAD7A8'); bg2.addColorStop(1, '#C9AE78');
    x.fillStyle = bg2;
    const g40 = ground(S.seaR + 40);
    x.beginPath(); x.moveTo(S.seaR - 80, H); x.lineTo(S.seaR - 34, S.seaY + 1); x.lineTo(S.seaR + 6, S.seaY - 4);
    x.quadraticCurveTo(S.seaR + 24, S.seaY - 7, S.seaR + 40, g40 + 1); x.lineTo(S.seaR + 40, g40 + 16);
    x.quadraticCurveTo(S.seaR + 6, S.seaY + 18, S.seaR - 40, H); x.closePath(); x.fill();
  }

  function draw(ctx, t, raining) {
    const W = api.W, H = api.H, cl = S.cloud;
    if (!bg) drawStatic();
    // sky
    const sk = ctx.createLinearGradient(0, 0, 0, S.seaY);
    const b = 0.55 + S.sun * 0.45;
    sk.addColorStop(0, A.mix('#3F5E86', '#3E8EDB', b)); sk.addColorStop(1, A.mix('#A7B4C4', '#D4EEFB', b));
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    A.sun(ctx, S.sunX, S.sunY, 28, S.sun, t);
    if (bg) ctx.drawImage(bg, 0, 0, W, H);
    // snow cap
    if (S.snow > 0.01 || S.cold) drawSnow(ctx);
    // rivers and lake
    drawWater(ctx, t);
    // sea
    const sg = ctx.createLinearGradient(0, S.seaY, 0, H);
    sg.addColorStop(0, '#2C86C4'); sg.addColorStop(1, '#0C3F70');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.moveTo(0, S.seaY);
    for (let x = 0; x <= S.seaR; x += 6) ctx.lineTo(x, S.seaY + Math.sin(x * 0.06 + t * 1.6) * 1.6);
    ctx.lineTo(S.seaR - 34, S.seaY + 1); ctx.lineTo(S.seaR - 60, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(200,235,255,0.5)'; ctx.lineWidth = 1.4;
    for (let k = 0; k < 6; k++) {
      const y = S.seaY + 10 + k * (H - S.seaY) / 6;
      ctx.beginPath();
      for (let x = 6; x < S.seaR - 40 - k * 4; x += 4) ctx.lineTo(x, y + Math.sin(x * 0.08 + t * (1 + k * 0.2) + k) * 1.4);
      ctx.stroke();
    }
    S.ripples.forEach(r => { ctx.strokeStyle = 'rgba(255,255,255,' + r.a + ')'; ctx.beginPath(); ctx.ellipse(r.x, r.y + 2, r.r, r.r * 0.3, 0, 0, Math.PI * 2); ctx.stroke(); });
    // evaporation shimmer
    ctx.lineCap = 'round';
    S.vapor.forEach(v => {
      const life = (S.seaY - v.y) / (S.seaY - S.cloudY);
      const a = v.a * Math.max(0, 0.34 - life * 0.3) * (life < 0.08 ? life / 0.08 : 1);
      if (a <= 0.01) return;
      ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
      ctx.lineWidth = 1.3 + life * 2.5;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const yy = v.y + k * 6;
        const xx = v.x + Math.sin(yy * 0.1 + t * 2.4 + v.ph) * (2 + life * 5);
        if (k === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
    });
    // heat haze above the warm sea
    if (S.evapOn) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.05 + S.sun * 0.06) + ')';
      for (let x = 0; x < S.seaR; x += 18) ctx.fillRect(x + Math.sin(t * 2 + x) * 3, S.seaY - 10 - Math.abs(Math.sin(t + x * 0.3)) * 8, 10, 2);
    }
    // rain & snow
    ctx.strokeStyle = 'rgba(190,220,255,0.85)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    S.drops.forEach(d => { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + S.wind * 2, d.y + 9); });
    ctx.stroke();
    ctx.fillStyle = '#fff';
    S.flakes.forEach(f => { ctx.beginPath(); ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2); ctx.fill(); });
    // cloud
    if (cl.water > 0.01) {
      const cw = cloudW(), ch = cw * 0.42;
      if (!cl.puffs || Math.abs((cl._w || 0) - cw) > 4) { cl.puffs = A.cloudPuffs(cw, ch, cl.seed); cl._w = cw; }
      A.cloud(ctx, cl.x, S.cloudY, cw, ch, { puffs: cl.puffs, dark: Math.max(0, (cl.water - 0.3) / 1.0), alpha: Math.min(1, cl.water * 3) });
    }
    // labels for the steps (younger kids get them big)
    const fs = api.narrow ? 19 : 14;
    if (S.evapOn) A.label(ctx, 'evaporation', S.seaR * 0.45, S.seaY - (S.seaY - S.cloudY) * 0.5, { size: fs, bg: 'rgba(255,255,255,0.75)' });
    if (cl.water > 0.35 && !raining) A.label(ctx, 'condensation', cl.x, S.cloudY - cloudW() * 0.3, { size: fs, bg: 'rgba(255,255,255,0.8)' });
    if (raining) A.label(ctx, S.cold && cl.x > S.mtnX - 10 ? 'snow' : 'precipitation', cl.x, S.cloudY - cloudW() * 0.3, { size: fs, bg: 'rgba(255,255,255,0.8)' });
    if (S.flow > 0.05 || S.melting > 0) A.label(ctx, S.melting > 0 ? 'snowmelt → river' : 'collection', S.lakeC.x + 40, S.lakeC.y + 34, { size: fs, bg: 'rgba(255,255,255,0.8)' });
    // gauges
    gauge(ctx, W - (api.narrow ? 150 : 118), H - (api.narrow ? 58 : 44), 'Lake', S.lake, '#2C86C4');
    if (S.snow > 0.01) gauge(ctx, W - (api.narrow ? 150 : 118), H - (api.narrow ? 106 : 80), 'Snow', S.snow, '#E2E8F0');
  }

  function gauge(ctx, x, y, name, v, col) {
    const w = api.narrow ? 130 : 100, h = api.narrow ? 34 : 26;
    ctx.save();
    A.rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
    A.rr(ctx, x + 4, y + 4, (w - 8) * Math.max(0.02, Math.min(1, v)), h - 8, (h - 8) / 2); ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = '#1c1b29'; ctx.font = '800 ' + (api.narrow ? 16 : 12) + 'px Nunito, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name + ' ' + Math.round(v * 100) + '%', x + w / 2, y + h / 2 + 1);
    ctx.restore();
  }

  function drawSnow(ctx) {
    const W = api.W, H = api.H;
    const level = S.snow;
    const He = Math.min(H, 440);
    const line = S.seaY - He * (0.33 - level * 0.13);  // snow line drops as snow piles up
    ctx.save();
    ctx.beginPath();
    for (let px = S.seaR; px <= W; px += 4) { const y = ground(px); if (px === S.seaR) ctx.moveTo(px, y); else ctx.lineTo(px, y); }
    ctx.lineTo(W, H); ctx.lineTo(S.seaR, H); ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    for (let px = S.seaR; px <= W; px += 4) {
      const y = line + Math.sin(px * 0.13) * 7 + Math.sin(px * 0.41) * 3;
      if (px === S.seaR) ctx.moveTo(px, y); else ctx.lineTo(px, y);
    }
    ctx.lineTo(W, 0); ctx.lineTo(S.seaR, 0); ctx.closePath();
    const g = ctx.createLinearGradient(0, line - He * 0.2, 0, line + 10);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#DDE7F2');
    ctx.fillStyle = S.snow > 0.01 ? g : 'rgba(255,255,255,0.0)';
    ctx.fill();
    ctx.restore();

  }

  function drawWater(ctx, t) {
    const L = S.lakeC;
    const w = 2 + Math.min(1, S.flow * 3) * 5;
    const path = pts => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); } const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const wet1 = S.flow > 0.02 || S.melting > 0;
    ctx.strokeStyle = wet1 ? '#3D9BDB' : 'rgba(90,110,90,0.55)'; ctx.lineWidth = wet1 ? w : 2;
    path(S.river1); ctx.stroke();
    if (wet1) { ctx.setLineDash([5, 11]); ctx.lineDashOffset = -t * 40; ctx.strokeStyle = 'rgba(220,245,255,0.9)'; ctx.lineWidth = 1.4; path(S.river1); ctx.stroke(); ctx.setLineDash([]); }
    const wet2 = S.lake > 0.6;
    ctx.strokeStyle = wet2 ? '#3D9BDB' : 'rgba(90,110,90,0.55)'; ctx.lineWidth = wet2 ? 2 + (S.lake - 0.6) * 12 : 2;
    path(S.river2); ctx.stroke();
    if (wet2) { ctx.setLineDash([5, 11]); ctx.lineDashOffset = -t * 40; ctx.strokeStyle = 'rgba(220,245,255,0.9)'; ctx.lineWidth = 1.4; path(S.river2); ctx.stroke(); ctx.setLineDash([]); }
    // lake
    ctx.fillStyle = '#6B5A3E';
    ctx.beginPath(); ctx.ellipse(L.x, L.y, L.rx, L.ry, 0, 0, Math.PI * 2); ctx.fill();
    const lv = 0.25 + S.lake * 0.75;
    const lg = ctx.createLinearGradient(0, L.y - L.ry, 0, L.y + L.ry);
    lg.addColorStop(0, '#5CB5EC'); lg.addColorStop(1, '#1E6AA8');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.ellipse(L.x, L.y + (1 - lv) * L.ry * 0.3, L.rx * lv, L.ry * lv, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(L.x - L.rx * 0.2, L.y - 2, L.rx * lv * 0.4, 1.5, 0, 0, Math.PI * 2); ctx.stroke();
  }

  function stop() { ZsCanvas.release(bg); bg = null; }
  function resize() { geom(); ZsCanvas.release(bg); bg = null; }
  return { challenges, start, frame, stop, resize, _S: () => S };
})();


/* ════════════════════════════════════════════════════════════════
   PLANT GROWTH — two bean pots on a windowsill, a time-lapse of
   days, and a fair test: change one thing and compare.
   ════════════════════════════════════════════════════════════════ */
LXLabs.plants = (() => {
  'use strict';
  const A = LXArt;
  let api, S, ui = {};

  const LIGHT = { sun: 'Window', shade: 'Shade', dark: 'Dark box' };
  const WATER = { none: 'None', some: 'Some', lots: 'Too much' };

  const challenges = [
    { id: 'sprout', kind: 'goal', tier: [0, 3], stars: 1, title: 'Make a seed sprout',
      how: 'Give a pot some water and press Start.', journal: 'A bean seed sprouted.',
      explain: 'A seed needs water (and warmth) to germinate. Light comes later, for the leaves.',
      test: e => e.type === 'sprout' },
    { id: 'leaves', kind: 'goal', tier: [0, 1], stars: 1, title: 'Grow the first true leaves',
      how: 'Window light and some water.', journal: 'The first pair of true leaves opened.',
      explain: 'The first two round parts are the seed halves (cotyledons). Then come the true leaves.',
      test: e => e.type === 'day' && e.pots.some(p => p.leaves >= 2 && p.health > 0.7) },
    { id: 'tall10', kind: 'goal', tier: [0, 3], stars: 1, title: 'Grow a healthy plant 10 cm tall',
      how: 'Check the ruler next to the pot.', journal: 'A healthy bean plant reached 10 cm.',
      test: e => e.type === 'day' && e.pots.some(p => p.h >= 10 && p.health > 0.75 && p.green > 0.8) },
    { id: 'pred-dry', kind: 'predict', tier: [1, 3], stars: 2, title: 'No water at all',
      q: 'A bean seed in dry soil, with lots of sunshine. What will happen?',
      choices: ['It sprouts fast', 'It does not sprout', 'It grows pale'], answer: 1,
      how: 'Set one pot to Water: None and run 8 days.', journal: 'A seed with no water did not sprout.',
      explain: 'Without water the seed cannot swell and germinate, even in the sun.',
      test: e => e.type === 'day' && e.day >= 8 && e.pots.some(p => p.water === 'none' && !p.sprouted) },
    { id: 'pred-dark', kind: 'predict', tier: [1, 3], stars: 2, title: 'Growing in the dark',
      q: 'A bean grows inside a dark box. What will it look like?',
      choices: ['Short and dark green', 'Tall, thin and pale yellow', 'It cannot grow at all'], answer: 1,
      how: 'Put one pot in the Dark box, give it water and run.', journal: 'In the dark the seedling grew tall, thin and pale.',
      explain: 'In the dark a seedling stretches fast to look for light, using the food stored in the seed. Without light it cannot make the green pigment, chlorophyll.',
      test: e => e.type === 'day' && e.pots.some(p => p.light === 'dark' && p.h > 8) },
    { id: 'bend', kind: 'goal', tier: [1, 3], stars: 1, title: 'See it bend toward the light',
      how: 'Grow a plant by the window for 12 days. Watch the stem.', journal: 'The stem bent toward the window.',
      explain: 'Stems grow toward light. The shaded side grows a little faster, so the stem bends to the window. This is called phototropism.',
      test: e => e.type === 'day' && e.pots.some(p => p.light === 'sun' && p.h > 8 && p.health > 0.6) },
    { id: 'fair', kind: 'goal', tier: [2, 3], stars: 2, title: 'Run a fair test',
      how: 'Make pot A and pot B the same except for ONE thing. Run 14 days and compare.', journal: 'Fair test: only one thing was different between A and B.',
      explain: 'Change one thing at a time. Then any difference between the pots must come from that one change.',
      test: e => e.type === 'day' && e.day >= 14 && e.diff === 1 },
    { id: 'pred-lots', kind: 'predict', tier: [2, 3], stars: 2, title: 'Too much water',
      q: 'Soggy soil, watered too much every day. What happens by day 20?',
      choices: ['It becomes the biggest plant', 'Leaves turn yellow and it grows slowly', 'Nothing changes'], answer: 1,
      how: 'Set Water: Too much and run 20 days.', journal: 'Too much water: yellow leaves and slow growth.',
      explain: 'Roots need air too. In waterlogged soil they cannot breathe, so the plant struggles.',
      test: e => e.type === 'day' && e.day >= 20 && e.pots.some(p => p.water === 'lots' && p.sprouted) },
    { id: 'flower', kind: 'goal', tier: [1, 3], stars: 2, title: 'Grow it until it flowers',
      how: 'Best light, the right water, and patience: about 5 to 7 weeks.', journal: 'The bean plant flowered.',
      explain: 'Bean flowers that get pollinated turn into pods with new seeds inside.',
      test: e => e.type === 'flower' }
  ];

  function newPot(light, water) {
    return { light, water, day0: { light, water }, germ: 0, sprouted: false, h: 0, leaves: 0, health: 1, green: 1, bend: 0,
      root: 0, energy: 1, flowered: false, hist: [], seed: Math.floor(Math.random() * 1e6) };
  }

  function start(a) {
    api = a;
    S = { day: 0, running: false, speed: 1, acc: 0, t: 0,
      pots: [newPot('sun', 'some'), newPot(api.tier >= 1 ? 'shade' : 'sun', 'some')], emitted: {} };
    if (api.tier === 0) S.pots[1] = newPot('sun', 'none');
    buildControls();
  }

  function buildControls() {
    const c = api.controls;
    c.innerHTML = '';
    ui.pots = S.pots.map((p, i) => {
      const box = document.createElement('div');
      box.className = 'lx-pot-ctl';
      box.innerHTML = '<div class="lx-pot-name">Pot ' + 'AB'[i] + '</div>';
      const l = LXUI.seg({ label: 'Light', value: p.light, options: [
        { v: 'sun', label: 'Window', icon: '☀️' }, { v: 'shade', label: 'Shade', icon: '⛅' }, { v: 'dark', label: 'Dark box', icon: '📦' }],
        onChange: v => { p.light = v; p.day0.light = v; } });
      const w = LXUI.seg({ label: 'Water', value: p.water, options: [
        { v: 'none', label: 'None' }, { v: 'some', label: 'Some', icon: '💧' }, { v: 'lots', label: 'Too much', icon: '💧💧' }],
        onChange: v => { p.water = v; p.day0.water = v; } });
      box.appendChild(l); box.appendChild(w);
      return { box, l, w };
    });
    c.appendChild(LXUI.row(ui.pots.map(x => x.box), 'lx-row-2'));
    ui.play = LXUI.button('▶ Start', toggle, 'lx-btn-main');
    ui.speed = LXUI.seg({ value: 1, options: [{ v: 1, label: '1×' }, { v: 3, label: '3×', aria: 'Three times faster' }], onChange: v => { S.speed = v; } });
    ui.reset = LXUI.button('🌱 Plant new seeds', () => { start(api); api.sfx('click'); }, 'lx-btn-soft');
    c.appendChild(LXUI.row([ui.play, ui.speed, ui.reset]));
    ui.chart = document.createElement('div');
    ui.chart.className = 'lx-chart';
    if (api.tier >= 2) c.appendChild(ui.chart);
    lockSettings(false);
  }

  function lockSettings(lock) {
    ui.pots.forEach(u => { u.l.disable(lock); u.w.disable(lock); });
  }

  function toggle() {
    if (S.day >= 42 && !S.running) { start(api); }
    S.running = !S.running;
    ui.play.innerHTML = S.running ? '⏸ Pause' : '▶ Keep going';
    lockSettings(S.day > 0 || S.running);
    api.sfx('click');
  }

  // One simulated day for one pot. Rates are a simple model of a
  // common bush bean in a cup of soil.
  function grow(p) {
    const wet = p.water !== 'none';
    const lightV = p.light === 'sun' ? 1 : p.light === 'shade' ? 0.45 : 0;
    if (!p.sprouted) {
      if (wet) { p.germ += 1; p.root = Math.min(1, p.root + 0.18); }
      if (p.germ >= 5) { p.sprouted = true; p.h = 0.8; }
      return;
    }
    // growth
    let rate;
    if (lightV === 0) {
      rate = p.energy > 0 ? 1.6 : 0;      // stretching on stored food
      p.energy = Math.max(0, p.energy - 0.06);
      p.green = Math.max(0, p.green - 0.25);
      if (p.energy <= 0) p.health = Math.max(0, p.health - 0.08);
    } else {
      const base = 0.35 + lightV * 0.65;
      const age = S.day;
      rate = (age < 25 ? 0.9 : 0.35) * (p.light === 'shade' ? 1.15 : 1) * base / (lightV < 1 ? 0.75 : 1);
      p.green = Math.min(1, p.green + 0.2) * (p.light === 'shade' ? 0.96 : 1);
      p.energy = Math.min(1, p.energy + 0.02 * lightV);
    }
    if (p.water === 'none') { rate *= 0.1; p.health = Math.max(0, p.health - 0.12); }
    if (p.water === 'lots' && S.day > 9) { rate *= 0.4; p.green = Math.max(0.35, p.green - 0.05); p.health = Math.max(0.35, p.health - 0.025); }
    rate *= Math.max(0.15, p.health);
    p.h = Math.min(34, p.h + rate);
    p.root = Math.min(1, p.root + 0.03);
    // leaves: cotyledons on sprouting, then the first true pair, then trifoliates
    const sinceUp = S.day - 5;
    if (lightV > 0) p.leaves = sinceUp >= 3 ? 2 + Math.max(0, Math.floor((sinceUp - 9) / 4)) : 0;
    else p.leaves = sinceUp >= 6 ? 2 : 0;   // small, unopened
    p.leaves = Math.min(p.leaves, 9);
    if (p.light === 'sun') p.bend = Math.min(1, p.bend + 0.06);
    if (p.light === 'shade') p.bend = Math.min(0.5, p.bend + 0.03);
    if (!p.flowered && S.day >= 36 && p.light === 'sun' && p.water === 'some' && p.health > 0.8) {
      p.flowered = true;
    }
  }

  function step() {
    S.day++;
    S.pots.forEach(p => {
      const was = p.sprouted;
      grow(p);
      p.hist.push(p.h);
      if (!was && p.sprouted) {
        api.journal('Day ' + S.day + ': pot ' + 'AB'[S.pots.indexOf(p)] + ' sprouted.');
        api.emit({ type: 'sprout' });
      }
      if (p.flowered && !p._fl) { p._fl = true; api.journal('Day ' + S.day + ': pot ' + 'AB'[S.pots.indexOf(p)] + ' flowered!'); api.emit({ type: 'flower' }); }
    });
    const a = S.pots[0].day0, b = S.pots[1].day0;
    const diff = (a.light !== b.light ? 1 : 0) + (a.water !== b.water ? 1 : 0);
    if (S.day % 7 === 0) api.journal('Day ' + S.day + ': A ' + S.pots[0].h.toFixed(1) + ' cm, B ' + S.pots[1].h.toFixed(1) + ' cm');
    api.emit({ type: 'day', day: S.day, diff,
      pots: S.pots.map(p => ({ light: p.light, water: p.water, h: p.h, leaves: p.leaves, health: p.health, green: p.green, sprouted: p.sprouted })) });
    renderChart();
    if (S.day >= 42) {
      S.running = false;
      ui.play.innerHTML = '🌱 Plant again';
      api.toast('Six weeks done! Compare your two pots.');
    }
  }

  function renderChart() {
    if (!ui.chart || api.tier < 2) return;
    const w = 300, h = 110, maxD = 42, maxH = 35;
    const line = (hist, col) => '<polyline fill="none" stroke="' + col + '" stroke-width="2.5" points="' +
      hist.map((v, i) => (20 + (i + 1) / maxD * (w - 30)).toFixed(1) + ',' + (h - 18 - v / maxH * (h - 28)).toFixed(1)).join(' ') + '"/>';
    let grid = '';
    for (let cm = 0; cm <= 30; cm += 10) { const y = h - 18 - cm / maxH * (h - 28); grid += '<line x1="20" x2="' + (w - 10) + '" y1="' + y + '" y2="' + y + '" stroke="#E5E7EB"/><text x="2" y="' + (y + 4) + '" font-size="9" fill="#6b6878">' + cm + '</text>'; }
    for (let d = 0; d <= 42; d += 7) { const x = 20 + d / maxD * (w - 30); grid += '<text x="' + (x - 4) + '" y="' + (h - 4) + '" font-size="9" fill="#6b6878">' + d + '</text>'; }
    ui.chart.innerHTML = '<div class="lx-chart-t">Height (cm) by day · <span style="color:#16A34A">● A</span> <span style="color:#C2410C">● B</span></div>' +
      '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Chart of plant height by day">' + grid +
      line(S.pots[0].hist, '#16A34A') + line(S.pots[1].hist, '#C2410C') + '</svg>';
  }

  function frame(dt, t) {
    S.t = t;
    if (S.running) {
      S.acc += dt * S.speed;
      const per = 0.9;
      while (S.acc >= per && S.day < 42) { S.acc -= per; step(); }
    }
    draw(api.ctx, t);
  }

  // ── Drawing ──
  function draw(ctx, t) {
    const W = api.W, H = api.H;
    const dayFrac = S.running ? (S.acc / 0.9) : 0.35;
    const sunUp = Math.sin(dayFrac * Math.PI);          // 0 at night, 1 at noon
    // wall
    const wg = ctx.createLinearGradient(0, 0, 0, H);
    wg.addColorStop(0, A.mix('#3B3A4A', '#F4EDE1', 0.35 + sunUp * 0.65)); wg.addColorStop(1, A.mix('#2A2936', '#E7DCC9', 0.35 + sunUp * 0.65));
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
    // window on the left
    const win = api.narrow ? { x: 14, y: 26, w: 150, h: 250 } : { x: 18, y: 22, w: 150, h: 220 };
    const sky = ctx.createLinearGradient(0, win.y, 0, win.y + win.h);
    sky.addColorStop(0, A.mix('#0F1733', '#7EC4F5', sunUp)); sky.addColorStop(1, A.mix('#26305A', '#D7EFFC', sunUp));
    ctx.fillStyle = '#FFFFFF'; A.rr(ctx, win.x - 8, win.y - 8, win.w + 16, win.h + 16, 6); ctx.fill();
    ctx.fillStyle = sky; ctx.fillRect(win.x, win.y, win.w, win.h);
    // sun or moon crossing the window
    const cx = win.x + win.w * (0.15 + dayFrac * 0.7), cy = win.y + win.h * (0.65 - sunUp * 0.45);
    ctx.save(); ctx.beginPath(); ctx.rect(win.x, win.y, win.w, win.h); ctx.clip();
    if (sunUp > 0.15) A.sun(ctx, cx, cy, 13, sunUp, t);
    else { ctx.fillStyle = '#F2F2E6'; ctx.beginPath(); ctx.arc(win.x + win.w * 0.7, win.y + 40, 10, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = A.mix('#1E3A2A', '#8FC46E', sunUp);
    ctx.beginPath(); ctx.moveTo(win.x, win.y + win.h * 0.78);
    ctx.quadraticCurveTo(win.x + win.w * 0.5, win.y + win.h * 0.68, win.x + win.w, win.y + win.h * 0.76);
    ctx.lineTo(win.x + win.w, win.y + win.h); ctx.lineTo(win.x, win.y + win.h); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(win.x + win.w / 2 - 3, win.y, 6, win.h); ctx.fillRect(win.x, win.y + win.h * 0.45, win.w, 6);
    // sunbeam into the room
    const shelfY = api.narrow ? H - 150 : H - 92;
    if (sunUp > 0.1) {
      const g = ctx.createLinearGradient(win.x + win.w, win.y, W, shelfY);
      g.addColorStop(0, 'rgba(255,240,190,' + (0.35 * sunUp) + ')'); g.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(win.x + win.w, win.y); ctx.lineTo(win.x + win.w, win.y + win.h);
      ctx.lineTo(W * 0.92, shelfY); ctx.lineTo(W, shelfY - 40); ctx.lineTo(W, win.y + 60); ctx.closePath(); ctx.fill();
    }
    // shelf / bench
    ctx.drawImage(A.wood(W, H - shelfY, '#B07D4A', 3), 0, shelfY);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, shelfY, W, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, shelfY + 4, W, 3);

    // pots
    const xs = api.narrow ? [W * 0.42, W * 0.78] : [W * 0.47, W * 0.8];
    S.pots.forEach((p, i) => drawPot(ctx, p, xs[i], shelfY + 2, 'AB'[i], sunUp, t));
    // day counter
    A.label(ctx, 'Day ' + S.day + ' / 42', W - 90, 30, { size: api.narrow ? 22 : 16, bg: '#312E81', color: '#fff' });
  }

  function drawPot(ctx, p, x, baseY, name, sunUp, t) {
    const sc = api.narrow ? 1.05 : 0.9;
    const pw = 92 * sc, ph = 74 * sc, soilY = baseY - ph + 8 * sc;
    const pxPerCm = api.narrow ? 7.6 : 6.2;
    // the dark box sits behind and over the pot
    if (p.light === 'dark') {
      const bw = pw + 70, bh = 34 * pxPerCm + ph + 20;
      ctx.fillStyle = '#4A3520'; ctx.fillRect(x - bw / 2, baseY - bh, bw, bh);
      ctx.fillStyle = '#1B130B'; ctx.fillRect(x - bw / 2 + 8, baseY - bh + 8, bw - 16, bh - 8);
    }
    A.shadow(ctx, x, baseY, pw * 0.7, 8, 0.35);
    // clear cup so you can see roots
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - pw / 2, baseY - ph); ctx.lineTo(x + pw / 2, baseY - ph); ctx.lineTo(x + pw * 0.4, baseY); ctx.lineTo(x - pw * 0.4, baseY); ctx.closePath();
    ctx.clip();
    const sg = ctx.createLinearGradient(0, soilY, 0, baseY);
    const wetC = p.water === 'none' ? '#9C7A55' : p.water === 'lots' ? '#3A2616' : '#5A3D24';
    sg.addColorStop(0, A.shade(wetC, 0.1)); sg.addColorStop(1, A.shade(wetC, -0.25));
    ctx.fillStyle = sg; ctx.fillRect(x - pw, soilY, pw * 2, ph);
    const r = A.rng(p.seed);
    for (let k = 0; k < 60; k++) { ctx.fillStyle = 'rgba(255,240,220,' + (r() * 0.12) + ')'; ctx.fillRect(x - pw / 2 + r() * pw, soilY + r() * ph, 2, 2); }
    if (p.water === 'lots') { ctx.fillStyle = 'rgba(80,140,200,0.35)'; ctx.fillRect(x - pw, baseY - 14, pw * 2, 14); }
    // seed and roots
    const seedY = soilY + 20 * sc;
    if (p.root > 0) {
      const rr = A.rng(p.seed + 3);
      ctx.lineCap = 'round';
      const rl = p.root * (baseY - seedY - 6);
      // tap root with a gentle wiggle
      ctx.strokeStyle = 'rgba(245,236,214,0.95)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, seedY);
      const tap = [];
      for (let k = 1; k <= 8; k++) { const yy = seedY + rl * k / 8, xx = x + Math.sin(k * 1.7 + p.seed) * 3; tap.push([xx, yy]); ctx.lineTo(xx, yy); }
      ctx.stroke();
      // side roots, longer near the top, angled down, each a little bent
      ctx.lineWidth = 1.1;
      for (let k = 0; k < 7; k++) {
        const base = tap[k] || tap[tap.length - 1];
        [-1, 1].forEach(side => {
          if (rr() < 0.2) return;
          const len = (1 - k / 9) * (14 + rr() * 16) * p.root;
          const ex = base[0] + side * len, ey = base[1] + len * (0.5 + rr() * 0.5);
          ctx.beginPath(); ctx.moveTo(base[0], base[1]);
          ctx.quadraticCurveTo(base[0] + side * len * 0.5, base[1] + rr() * 4, ex, ey); ctx.stroke();
          ctx.strokeStyle = 'rgba(245,236,214,0.5)'; ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(ex - side * len * 0.4, ey - len * 0.25); ctx.lineTo(ex - side * len * 0.3, ey - len * 0.05); ctx.stroke();
          ctx.strokeStyle = 'rgba(245,236,214,0.95)'; ctx.lineWidth = 1.1;
        });
      }
    }
    if (!p.sprouted) {
      ctx.fillStyle = '#E8DCC0'; ctx.strokeStyle = '#B8A27A'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, seedY, 9 * sc, 6 * sc, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8A6A3A'; ctx.beginPath(); ctx.ellipse(x + 2, seedY - 1, 2.5, 1.2, 0.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // cup walls (glass-like)
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - pw / 2, baseY - ph); ctx.lineTo(x + pw / 2, baseY - ph); ctx.lineTo(x + pw * 0.4, baseY); ctx.lineTo(x - pw * 0.4, baseY); ctx.closePath();
    const cg = ctx.createLinearGradient(x - pw / 2, 0, x + pw / 2, 0);
    cg.addColorStop(0, 'rgba(255,255,255,0.55)'); cg.addColorStop(0.2, 'rgba(255,255,255,0.08)'); cg.addColorStop(0.8, 'rgba(255,255,255,0.04)'); cg.addColorStop(1, 'rgba(255,255,255,0.4)');
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = 'rgba(160,175,190,0.9)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x - pw / 2 - 3, baseY - ph - 3, pw + 6, 5);

    if (p.sprouted) drawPlant(ctx, p, x, soilY, pxPerCm, t);

    // shade cloth in front of a shaded pot
    if (p.light === 'shade') {
      // a sheer curtain between the window and this pot
      const cx0 = x - pw / 2 - 46, cw = 34, top = 18;
      ctx.fillStyle = '#8A8F99'; A.rr(ctx, cx0 - 6, top - 6, cw + 12, 6, 3); ctx.fill();
      const cg = ctx.createLinearGradient(cx0, 0, cx0 + cw, 0);
      for (let k = 0; k <= 6; k++) cg.addColorStop(k / 6, k % 2 ? 'rgba(235,238,245,0.78)' : 'rgba(190,196,210,0.78)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(cx0, top);
      ctx.lineTo(cx0 + cw, top); ctx.lineTo(cx0 + cw + 4, baseY - 4);
      for (let k = 6; k >= 0; k--) ctx.lineTo(cx0 + k * (cw + 4) / 6, baseY - 4 + (k % 2 ? 4 : 0));
      ctx.closePath(); ctx.fill();
      // its shadow over the pot
      const sh = ctx.createLinearGradient(cx0 + cw, 0, x + pw, 0);
      sh.addColorStop(0, 'rgba(30,30,50,0.22)'); sh.addColorStop(1, 'rgba(30,30,50,0)');
      ctx.fillStyle = sh; ctx.fillRect(cx0 + cw, top, x + pw - cx0 - cw, baseY - top);
    }
    if (p.light === 'dark') {
      // the front of the box is cut away; tint everything inside dark
      ctx.fillStyle = 'rgba(10,6,2,0.35)';
      ctx.fillRect(x - pw / 2 - 27, baseY - 34 * pxPerCm - ph - 12, pw + 54, 34 * pxPerCm + ph + 12);
    }
    // ruler
    const rx = x + pw / 2 + 10, top = soilY - 30 * pxPerCm;
    ctx.fillStyle = '#F2D24B'; ctx.fillRect(rx, top, 16, soilY - top);
    ctx.strokeStyle = '#B8941E'; ctx.lineWidth = 1; ctx.strokeRect(rx, top, 16, soilY - top);
    ctx.fillStyle = '#5B4A10'; ctx.font = '700 ' + (api.narrow ? 12 : 10) + 'px Nunito, sans-serif'; ctx.textAlign = 'left';
    for (let cm = 0; cm <= 30; cm++) {
      const y = soilY - cm * pxPerCm;
      ctx.fillRect(rx, y, cm % 5 === 0 ? 9 : 5, 1);
      if (cm % 10 === 0 && cm > 0) ctx.fillText(String(cm), rx + 6, y + 12);
    }
    // labels
    const fs = api.narrow ? 19 : 14;
    A.label(ctx, 'Pot ' + name, x, baseY + (api.narrow ? 28 : 22), { size: fs });
    if (p.sprouted) A.label(ctx, p.h.toFixed(1) + ' cm', x, soilY - p.h * pxPerCm - 24, { size: fs - 2, bg: 'rgba(255,255,255,0.85)' });
  }

  function leafColor(p) {
    const healthy = '#3E9B32';
    const pale = '#E9E2A2';
    const yellow = '#C9B43A';
    let c = A.mix(pale, healthy, p.green);
    if (p.health < 0.7) c = A.mix(c, yellow, (0.7 - p.health) * 1.4);
    if (p.health < 0.25) c = A.mix(c, '#8A6A3A', (0.25 - p.health) * 3);
    return c;
  }

  function drawPlant(ctx, p, x, soilY, k, t) {
    const hpx = p.h * k;
    const dark = p.light === 'dark';
    const thick = dark ? 2.2 : 3 + Math.min(3, p.h * 0.18);
    const wilt = Math.max(0, 0.7 - p.health);
    const lean = -p.bend * hpx * 0.28 + wilt * hpx * 0.4;  // window is to the left
    const tipX = x + lean, tipY = soilY - hpx * (1 - wilt * 0.35);
    const pt = u => {
      const xx = x + lean * u * u, yy = soilY - hpx * u * (1 - wilt * 0.35 * u);
      return [xx + Math.sin(t * 1.3 + u * 2) * 0.6 * u, yy];
    };
    const stemC = A.mix('#E5E0B0', '#4A8F2E', p.green);
    ctx.strokeStyle = stemC; ctx.lineWidth = thick; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let u = 0; u <= 1.0001; u += 0.05) { const q = pt(u); if (u === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); }
    ctx.stroke();
    const lc = leafColor(p);
    // cotyledons (the seed halves, lifted up), low on the stem
    if (p.h > 1.5) {
      const q = pt(Math.min(0.9, 2.2 / p.h));
      const cs = dark ? 7 : 8 + (p.leaves > 2 ? -2 : 0);
      ctx.fillStyle = A.mix('#D8C690', lc, 0.4);
      ctx.beginPath(); ctx.ellipse(q[0] - cs, q[1], cs, cs * 0.6, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(q[0] + cs, q[1], cs, cs * 0.6, -0.3, 0, Math.PI * 2); ctx.fill();
    } else {
      // the hook pushing through the soil
      ctx.strokeStyle = stemC; ctx.lineWidth = thick;
      ctx.beginPath(); ctx.arc(x + 4, soilY - 2, 4, Math.PI, 0); ctx.stroke();
    }
    // true leaves
    const leafSize = dark ? 4 : 10 + Math.min(10, p.h * 0.5);
    for (let i = 0; i < p.leaves; i++) {
      const u = i < 2 ? (p.leaves > 2 ? 0.42 : 0.8) : Math.min(0.97, 0.5 + (i - 2) * (0.47 / Math.max(1, p.leaves - 2)));
      const q = pt(u);
      const side = i % 2 === 0 ? -1 : 1;
      const tri = i >= 2;
      const ang = side * (0.6 + wilt * 1.4) + Math.sin(t + i) * 0.04;
      drawLeaf(ctx, q[0], q[1], leafSize * (tri ? 0.85 : 1), ang, lc, tri, dark);
    }
    // flower buds / flowers
    if (p.flowered) {
      const q = pt(0.78);
      [[-14, -6], [12, -10], [-6, -16]].forEach((o, j) => {
        ctx.fillStyle = j === 1 ? '#F3E8FF' : '#E9D5FF';
        ctx.beginPath(); ctx.ellipse(q[0] + o[0], q[1] + o[1], 5, 4, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#C084FC'; ctx.beginPath(); ctx.ellipse(q[0] + o[0] + 2, q[1] + o[1] + 1, 2.5, 2, 0, 0, Math.PI * 2); ctx.fill();
      });
    }
    // growing tip
    ctx.fillStyle = lc; ctx.beginPath(); ctx.arc(tipX, tipY, dark ? 2.5 : 3.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawLeaf(ctx, x, y, s, ang, col, trifoliate, dark) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    const one = (sx, rot, sc) => {
      ctx.save(); ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s * 0.7, -s * 0.5, -s * 0.6, -s * 1.6, 0, -s * 2);
      ctx.bezierCurveTo(s * 0.6, -s * 1.6, s * 0.7, -s * 0.5, 0, 0);
      const g = ctx.createLinearGradient(-s, 0, s, -s * 2);
      g.addColorStop(0, A.shade(col, -0.15)); g.addColorStop(1, A.shade(col, 0.15));
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = A.shade(col, -0.3); ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 1.85); ctx.stroke();
      ctx.restore();
    };
    ctx.strokeStyle = A.shade(col, -0.2); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.5); ctx.stroke();
    ctx.translate(0, -s * 0.5);
    if (trifoliate && !dark) { one(0, -0.7, 0.75); one(0, 0.7, 0.75); one(0, 0, 0.85); }
    else one(0, 0, dark ? 0.6 : 1);
    ctx.restore();
  }

  function stop() { S && (S.running = false); }
  return { challenges, start, frame, stop, _S: () => S, _step: () => step() };
})();


/* ════════════════════════════════════════════════════════════════
   SIMPLE MACHINES — a wooden seesaw lever with cast-iron weights.
   Turning effect = mass × distance. Equal on both sides → level.
   ════════════════════════════════════════════════════════════════ */
LXLabs.physics = (() => {
  'use strict';
  const A = LXArt;
  let api, S;
  const MAXA = 0.21;     // ~12°, the plank rests on the ground

  const challenges = [
    { id: 'b22', kind: 'goal', tier: [0, 3], stars: 1, title: 'Balance 2 kg with 2 kg',
      how: 'Drag weights onto the pegs. Watch the bubble level.', journal: 'Balanced 2 kg against 2 kg.',
      explain: 'Same weight, same distance from the middle: the plank balances.',
      test: e => e.type === 'lever' && e.balanced && e.lm === 2 && e.rm === 2 },
    { id: 'b31', kind: 'goal', tier: [0, 3], stars: 1, title: 'Balance 3 kg with 1 kg',
      how: 'The light weight must go farther from the middle.', journal: 'Balanced 3 kg with 1 kg, three times farther out.',
      explain: '3 kg one step from the middle balances 1 kg three steps out: 3 × 1 = 1 × 3.',
      test: e => e.type === 'lever' && e.balanced && ((e.lm === 3 && e.rm === 1) || (e.lm === 1 && e.rm === 3)) },
    { id: 'pred-far', kind: 'predict', tier: [1, 3], stars: 2, title: 'Move it farther out',
      q: 'Two equal weights balance at the same distance. You slide one weight farther from the middle. What happens?',
      choices: ['Nothing changes', 'That side goes down', 'That side goes up'], answer: 1,
      how: 'Balance two equal weights, then move one outward.', journal: 'Farther from the middle = more turning effect.',
      explain: 'The same weight has more turning effect the farther it is from the pivot (fulcrum).',
      test: e => e.type === 'lever' && e.farther && !e.balanced },
    { id: 'three', kind: 'goal', tier: [1, 3], stars: 1, title: 'Balance with three weights',
      journal: 'Balanced the lever using three weights.',
      test: e => e.type === 'lever' && e.balanced && e.count === 3 },
    { id: 'pred-calc', kind: 'predict', tier: [2, 3], stars: 2, title: 'Where must 3 kg go?',
      q: '2 kg sits 3 steps left of the middle. Where on the right must the 3 kg go to balance it?',
      choices: ['Step 1', 'Step 2', 'Step 3'], answer: 1,
      how: 'Place the 3 kg weight on the right side.', journal: '2 × 3 = 3 × 2: balanced.',
      explain: 'Left: 2 kg × 3 steps = 6. Right: 3 kg × 2 steps = 6. Equal turning effects balance.',
      setup: 'calc',
      test: e => e.type === 'lever' && e.balanced && e.lm === 2 && e.rm === 3 && e.count === 2 },
    { id: 'b51', kind: 'goal', tier: [2, 3], stars: 2, title: 'Lift 5 kg with only 1 kg',
      how: 'One weight on each side.', journal: 'Balanced 5 kg with 1 kg: 5 × 1 = 1 × 5.',
      explain: 'This is how a lever helps you: a small force far from the pivot can hold a big load close to it.',
      test: e => e.type === 'lever' && e.balanced && ((e.lm === 5 && e.rm === 1) || (e.lm === 1 && e.rm === 5)) && e.count === 2 },
    { id: 'b74', kind: 'goal', tier: [3, 3], stars: 2, title: 'Balance 7 kg with 4 kg',
      how: 'Two weights on each side, at different steps.', journal: 'Balanced 7 kg against 4 kg.',
      explain: 'Add up mass × steps on each side. When the totals match, the plank is level.',
      test: e => e.type === 'lever' && e.balanced && ((e.lm === 7 && e.rm === 4) || (e.lm === 4 && e.rm === 7)) }
  ];

  function layout() {
    const W = api.W, H = api.H;
    S.step = api.narrow ? 44 : 40;
    S.piv = { x: W / 2, y: api.narrow ? H * 0.50 : H * 0.52 };
    S.trayY = api.narrow ? H - 92 : H - 60;
    S.floorY = api.narrow ? H - 150 : H - 112;
    S.piv.y = S.floorY - 90;
  }

  function start(a) {
    api = a;
    S = { angle: 0, vel: 0, drag: null, weights: [], lastEvt: null, t: 0, settle: 0, wasBalanced: false };
    layout();
    const masses = api.tier === 0 ? [1, 1, 2, 2, 3] : [1, 1, 2, 2, 3, 5];
    S.weights = masses.map((m, i) => ({ m, id: i, peg: null, x: 0, y: 0 }));
    trayPositions();
    buildControls();
  }

  function trayPositions() {
    const n = S.weights.length, W = api.W;
    const gap = Math.min(92, (W - 60) / n);
    let k = 0;
    S.weights.forEach(w => {
      if (w.peg !== null) return;
      w.home = { x: W / 2 + (k - (n - 1) / 2) * gap, y: S.trayY };
      k++;
      if (!S.drag || S.drag.w !== w) { w.x = w.home.x; w.y = w.home.y; }
    });
    // keep homes stable: assign by index
    S.weights.forEach((w, i) => { w.home = { x: W / 2 + (i - (n - 1) / 2) * gap, y: S.trayY }; if (w.peg === null && (!S.drag || S.drag.w !== w)) { w.x = w.home.x; w.y = w.home.y; } });
  }

  function buildControls() {
    const c = api.controls;
    c.innerHTML = '';
    const clear = LXUI.button('↺ Take all weights off', () => { S.weights.forEach(w => w.peg = null); trayPositions(); evaluate(null); api.sfx('click'); }, 'lx-btn-soft');
    const ro = document.createElement('div'); ro.className = 'lx-readout'; ro.id = 'lx-lev-ro';
    c.appendChild(LXUI.row([clear]));
    c.appendChild(ro);
    readout();
  }

  function sums() {
    let lt = 0, rt = 0, lm = 0, rm = 0, count = 0;
    const parts = { l: [], r: [] };
    S.weights.forEach(w => {
      if (w.peg === null) return;
      count++;
      if (w.peg < 0) { lt += w.m * -w.peg; lm += w.m; parts.l.push(w.m + '×' + (-w.peg)); }
      else { rt += w.m * w.peg; rm += w.m; parts.r.push(w.m + '×' + w.peg); }
    });
    return { lt, rt, lm, rm, count, parts };
  }

  function readout() {
    const ro = document.getElementById('lx-lev-ro');
    if (!ro) return;
    const s = sums();
    if (!s.count) { ro.innerHTML = 'Drag a weight onto a peg. The numbers under the plank count steps from the middle.'; return; }
    const verdict = s.lt === s.rt ? '<b class="ok">Balanced!</b>' : s.lt > s.rt ? '<b>Left side goes down</b>' : '<b>Right side goes down</b>';
    if (api.tier >= 2) {
      ro.innerHTML = 'Left: ' + (s.parts.l.join(' + ') || '0') + ' = <b>' + s.lt + '</b> · Right: ' + (s.parts.r.join(' + ') || '0') + ' = <b>' + s.rt + '</b> · ' + verdict;
    } else {
      ro.innerHTML = 'Left: <b>' + s.lm + ' kg</b> · Right: <b>' + s.rm + ' kg</b> · ' + verdict;
    }
  }

  function evaluate(move) {
    const s = sums();
    const balanced = s.count > 0 && s.lt === s.rt && s.lm > 0 && s.rm > 0;
    readout();
    if (balanced && !S.wasBalanced) { api.sfx('star'); }
    const farther = !!(move && S.wasBalanced && move.from !== null && move.to !== null && Math.sign(move.from) === Math.sign(move.to) && Math.abs(move.to) > Math.abs(move.from));
    S.wasBalanced = balanced;
    api.emit({ type: 'lever', balanced, lm: s.lm, rm: s.rm, lt: s.lt, rt: s.rt, count: s.count, farther });
  }

  function onActive(c) {
    if (c.setup === 'calc' && !api.isDone(c.id)) {
      S.weights.forEach(w => w.peg = null);
      const two = S.weights.find(w => w.m === 2);
      if (two) two.peg = -3;
      trayPositions();
      readout();
      S.wasBalanced = false;
    }
  }

  // plank-local position of a peg → world
  function pegWorld(peg, lift) {
    const d = peg * S.step, a = S.angle;
    const ux = Math.cos(a), uy = Math.sin(a);
    const nx = Math.sin(a), ny = -Math.cos(a);
    return { x: S.piv.x + ux * d + nx * (lift || 0), y: S.piv.y - 8 + uy * d + ny * (lift || 0), a };
  }

  function stackLift(w) {
    let lift = 8;
    for (const o of S.weights) { if (o === w) break; if (o.peg === w.peg && o.peg !== null) lift += size(o.m).h - 4; }
    return lift;
  }
  function size(m) { const k = Math.cbrt(m); return { w: 30 * k + 6, h: 26 * k + 4 }; }

  function weightAt(p) {
    for (let i = S.weights.length - 1; i >= 0; i--) {
      const w = S.weights[i], sz = size(w.m);
      let cx = w.x, cy = w.y;
      if (w.peg !== null && (!S.drag || S.drag.w !== w)) { const q = pegWorld(w.peg, stackLift(w) + sz.h / 2); cx = q.x; cy = q.y; }
      if (Math.abs(p.x - cx) < sz.w / 2 + 12 && Math.abs(p.y - cy) < sz.h / 2 + 14) return w;
    }
    return null;
  }

  function down(p) {
    const w = weightAt(p);
    if (!w) return;
    if (w.peg !== null) { const q = pegWorld(w.peg, stackLift(w) + size(w.m).h / 2); w.x = q.x; w.y = q.y; }
    S.drag = { w, from: w.peg, dx: p.x - w.x, dy: p.y - w.y };
    w.peg = null;
    api.sfx('click');
  }
  function move(p, e, pressed) {
    if (!S.drag || !pressed) return;
    S.drag.w.x = p.x - S.drag.dx; S.drag.w.y = p.y - S.drag.dy;
  }
  function up() {
    if (!S.drag) return;
    const w = S.drag.w;
    // nearest peg if dropped near the plank
    const rel = w.x - S.piv.x;
    const peg = Math.round(rel / S.step);
    const q = pegWorld(peg, 20);
    if (Math.abs(peg) >= 1 && Math.abs(peg) <= 6 && Math.abs(w.y - q.y) < 90 && Math.abs(rel - peg * S.step) < S.step * 0.7) {
      w.peg = peg;
      api.sfx('click');
    } else {
      w.peg = null;
    }
    const from = S.drag.from;
    S.drag = null;
    trayPositions();
    evaluate({ from, to: w.peg });
  }

  function frame(dt, t) {
    S.t = t;
    const s = sums();
    const target = s.lt === s.rt ? 0 : (s.lt > s.rt ? -MAXA : MAXA);
    // a spring-damper so the plank swings and settles
    const acc = (target - S.angle) * 40 - S.vel * 7;
    S.vel += acc * dt; S.angle += S.vel * dt;
    if (S.angle > MAXA) { S.angle = MAXA; S.vel = -S.vel * 0.25; }
    if (S.angle < -MAXA) { S.angle = -MAXA; S.vel = -S.vel * 0.25; }
    draw(api.ctx, t, s);
  }

  function draw(ctx, t, s) {
    const W = api.W, H = api.H;
    // tiled lab wall
    const wg = ctx.createLinearGradient(0, 0, 0, S.floorY);
    wg.addColorStop(0, '#F7F4EE'); wg.addColorStop(1, '#E9E2D6');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, S.floorY);
    ctx.strokeStyle = 'rgba(180,165,140,0.35)'; ctx.lineWidth = 1;
    for (let y = 30; y < S.floorY; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let y = 30, r = 0; y < S.floorY; y += 40, r++) for (let x = (r % 2) * 30; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 40); ctx.stroke(); }
    // floor
    ctx.drawImage(A.wood(W, H - S.floorY, '#9C6B3C', 9), 0, S.floorY);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, S.floorY, W, 4);
    // tray
    A.rr(ctx, 16, S.trayY - 40, W - 32, 74, 14);
    ctx.fillStyle = 'rgba(60,40,20,0.35)'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '800 ' + (api.narrow ? 15 : 12) + 'px Nunito, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Weights', 28, S.trayY - 24);

    // fulcrum
    const px = S.piv.x, py = S.piv.y;
    A.shadow(ctx, px, S.floorY + 2, 70, 9, 0.35);
    const fg = ctx.createLinearGradient(px - 40, 0, px + 40, 0);
    fg.addColorStop(0, '#4A525E'); fg.addColorStop(0.5, '#B9C2CE'); fg.addColorStop(1, '#3A414B');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(px - 8, py); ctx.lineTo(px + 8, py); ctx.lineTo(px + 48, S.floorY); ctx.lineTo(px - 48, S.floorY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2B313B'; ctx.fillRect(px - 54, S.floorY - 6, 108, 8);

    // plank
    const len = S.step * 13.2;
    ctx.save();
    ctx.translate(px, py - 8); ctx.rotate(S.angle);
    ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
    ctx.drawImage(A.wood(Math.round(len), 18, '#D9A766', 4), -len / 2, -9);
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#7A4A1C'; ctx.lineWidth = 1.5; ctx.strokeRect(-len / 2, -9, len, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-len / 2, -9, len, 3);
    // pegs and numbers
    for (let k = -6; k <= 6; k++) {
      if (k === 0) continue;
      const x = k * S.step;
      ctx.fillStyle = '#B8860B'; ctx.beginPath(); ctx.arc(x, -9, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5A3A14'; ctx.font = '800 ' + (api.narrow ? 15 : 12) + 'px Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(String(Math.abs(k)), x, 24);
    }
    // bubble level at the middle
    ctx.fillStyle = '#2B313B'; A.rr(ctx, -34, -26, 68, 16, 5); ctx.fill();
    const tube = ctx.createLinearGradient(0, -24, 0, -12);
    tube.addColorStop(0, '#E3F59A'); tube.addColorStop(1, '#A7C93A');
    ctx.fillStyle = tube; A.rr(ctx, -28, -23, 56, 10, 5); ctx.fill();
    const bx = Math.max(-20, Math.min(20, -S.angle * 140));
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.ellipse(bx, -18, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2B313B'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-9, -23); ctx.lineTo(-9, -13); ctx.moveTo(9, -23); ctx.lineTo(9, -13); ctx.stroke();
    ctx.restore();
    // pivot bolt
    ctx.fillStyle = '#20252D'; ctx.beginPath(); ctx.arc(px, py - 8, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8A94A2'; ctx.beginPath(); ctx.arc(px - 1, py - 9, 2.4, 0, Math.PI * 2); ctx.fill();

    // weights (stacked on pegs, then tray, then the dragged one on top)
    const order = S.weights.slice().sort((a, b) => (a === (S.drag && S.drag.w) ? 1 : 0) - (b === (S.drag && S.drag.w) ? 1 : 0));
    order.forEach(w => {
      if (w.peg !== null && (!S.drag || S.drag.w !== w)) {
        const sz = size(w.m), q = pegWorld(w.peg, stackLift(w) + sz.h / 2);
        drawWeight(ctx, q.x, q.y, w.m, q.a);
      } else {
        if (!S.drag || S.drag.w !== w) A.shadow(ctx, w.x, w.y + size(w.m).h / 2, size(w.m).w * 0.6, 5, 0.3);
        drawWeight(ctx, w.x, w.y, w.m, 0, S.drag && S.drag.w === w);
      }
    });

    // balance banner
    if (s.count) {
      const bal = s.lt === s.rt && Math.abs(S.angle) < 0.02;
      const txt = bal ? 'Balanced' : (s.lt > s.rt ? 'Left side heavier' : 'Right side heavier');
      A.label(ctx, (bal ? '✓ ' : '') + txt, W / 2, 34, { size: api.narrow ? 22 : 17, bg: bal ? '#15803D' : '#fff', color: bal ? '#fff' : '#1c1b29' });
      if (api.tier >= 1) {
        A.label(ctx, 'L ' + s.lt, W / 2 - 150, 34, { size: api.narrow ? 18 : 14 });
        A.label(ctx, 'R ' + s.rt, W / 2 + 150, 34, { size: api.narrow ? 18 : 14 });
      }
    }
  }

  function drawWeight(ctx, x, y, m, a, lifted) {
    const sz = size(m), w = sz.w, h = sz.h;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(a || 0);
    if (lifted) { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 10; }
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, '#7C8592'); g.addColorStop(0.45, '#434A56'); g.addColorStop(1, '#1E222A');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-w / 2, h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(w * 0.38, -h * 0.25); ctx.lineTo(-w * 0.38, -h * 0.25); ctx.closePath(); ctx.fill();
    ctx.shadowColor = 'transparent';
    // handle
    ctx.strokeStyle = '#3B424D'; ctx.lineWidth = Math.max(4, w * 0.12);
    ctx.beginPath(); ctx.arc(0, -h * 0.25, w * 0.2, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-1, -h * 0.27, w * 0.2, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-w * 0.36, -h * 0.22, w * 0.72, 3);
    ctx.fillStyle = '#E8EAED';
    ctx.font = '900 ' + Math.round(10 + Math.cbrt(m) * 4) + 'px Nunito, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(m + ' kg', 0, h * 0.14);
    ctx.restore();
  }

  function stop() {}
  function resize() { layout(); trayPositions(); }
  return { challenges, start, frame, down, move, up, stop, resize, onActive, _S: () => S, _place: (i, peg) => { S.weights[i].peg = peg; trayPositions(); evaluate(null); } };
})();


/* ════════════════════════════════════════════════════════════════
   MAGNETS — a bar magnet on paper, iron filings that line up with
   the field, compass needles, and things to test.
   ════════════════════════════════════════════════════════════════ */
LXLabs.magnets = (() => {
  'use strict';
  const A = LXArt;
  let api, S, ui = {};

  const OBJECTS = [
    { id: 'nail', name: 'Iron nail', mag: true },
    { id: 'clip', name: 'Paper clip (steel)', mag: true },
    { id: 'copper', name: 'Copper wire', mag: false },
    { id: 'foil', name: 'Aluminium foil', mag: false },
    { id: 'pencil', name: 'Wooden pencil', mag: false },
    { id: 'marble', name: 'Glass marble', mag: false }
  ];

  const challenges = [
    { id: 'two', kind: 'goal', tier: [0, 3], stars: 1, title: 'Find the 2 magnetic things',
      how: 'Drag each object to an end of the magnet.', journal: 'The iron nail and the steel paper clip stuck to the magnet.',
      explain: 'Magnets pull on iron and steel (steel is mostly iron). Most other materials are not pulled.',
      test: e => e.type === 'stick' && e.count >= 2 },
    { id: 'pred-copper', kind: 'predict', tier: [0, 3], stars: 2, title: 'Copper and the magnet',
      q: 'Copper is a metal. Will the copper wire stick to the magnet?',
      choices: ['Yes, all metals stick', 'No, it will not stick'], answer: 1,
      how: 'Drag the copper wire to the magnet.', journal: 'Copper wire did not stick: not all metals are magnetic.',
      explain: 'Only some metals are pulled by magnets, mainly iron, nickel and cobalt. Copper and aluminium are not.',
      test: e => e.type === 'nostick' && e.id === 'copper' },
    { id: 'filings', kind: 'goal', tier: [0, 3], stars: 1, title: 'See the magnetic field',
      how: 'Tap "Sprinkle iron filings".', journal: 'Iron filings showed the field lines around the magnet.',
      explain: 'Each tiny bit of iron turns to line up with the field, so together they draw the field lines from pole to pole.',
      test: e => e.type === 'filings' },
    { id: 'pred-compass', kind: 'predict', tier: [1, 3], stars: 2, title: 'Compass by the N end',
      q: 'You put a compass next to the magnet\'s N (north) end. Where will the red tip of the needle point?',
      choices: ['Toward the N end', 'Away from the N end', 'Straight up, to the north'], answer: 1,
      how: 'Drag the compass close to the red N end.', journal: 'Near the N pole, the red tip pointed away from it.',
      explain: 'Like poles push apart. The red tip of a compass is a north pole, so it is pushed away from N and pulled toward S.',
      test: e => e.type === 'compass' && e.near === 'N' },
    { id: 'repel', kind: 'goal', tier: [1, 3], stars: 1, title: 'Make two magnets push apart',
      how: 'Add the second magnet. Tap a magnet to turn it around.', journal: 'Two like poles pushed each other away.',
      explain: 'N and N (or S and S) repel. N and S attract.',
      test: e => e.type === 'repel' },
    { id: 'attract', kind: 'goal', tier: [1, 3], stars: 1, title: 'Snap two magnets together',
      journal: 'An N end and an S end snapped together.',
      test: e => e.type === 'attract' },
    { id: 'pred-nn', kind: 'predict', tier: [2, 3], stars: 2, title: 'Filings between N and N',
      q: 'Two N ends face each other with a small gap. What will the iron filings in the gap look like?',
      choices: ['Lines joining the two ends', 'Lines bending away, leaving an empty spot', 'No pattern at all'], answer: 1,
      how: 'Face N to N with a gap, then sprinkle (or tap the paper).', journal: 'Between two N poles the field lines bent away from each other.',
      explain: 'Field lines never cross. Between like poles they turn away, leaving a spot where the field is almost zero.',
      test: e => e.type === 'filings' && e.facing === 'same' },
    { id: 'earth', kind: 'goal', tier: [2, 3], stars: 1, title: 'Find Earth\'s north',
      how: 'Move the compass far from the magnets.', journal: 'Far from the magnet, the compass pointed north again.',
      explain: 'Earth is a giant, weak magnet. Close to a bar magnet its field is much stronger, but far away the compass follows Earth.',
      test: e => e.type === 'compass' && e.earth }
  ];

  function start(a) {
    api = a;
    const W = api.W, H = api.H;
    S = { t: 0, drag: null, filings: null, settle: 0, mags: [], compasses: [], objs: [], stuck: {}, emitted: {} };
    S.paper = { x: 14, y: 14, w: W - 28, h: H - (api.narrow ? 120 : 96) };
    S.mags.push({ x: W * (api.narrow ? 0.5 : 0.42), y: S.paper.y + S.paper.h * 0.42, rot: 0, L: api.narrow ? 170 : 150, T: 40 });
    S.compasses.push({ x: W * (api.narrow ? 0.5 : 0.78), y: S.paper.y + S.paper.h * (api.narrow ? 0.78 : 0.28), ang: 0, v: 0 });
    const ty = H - (api.narrow ? 54 : 44);
    const objs = OBJECTS;
    const gap = (W - 60) / objs.length;
    S.objs = objs.map((o, i) => ({ o, x: 30 + gap * (i + 0.5), y: ty, hx: 30 + gap * (i + 0.5), hy: ty, stuck: null, rot: 0 }));
    buildControls();
  }

  function buildControls() {
    const c = api.controls;
    c.innerHTML = '';
    const items = [
      LXUI.button('✨ Sprinkle iron filings', () => { sprinkle(); api.sfx('click'); }, 'lx-btn-main'),
      LXUI.button('👆 Tap the paper', () => { if (S.filings) { S.settle = 1; scheduleFilingsEvt(); } api.sfx('click'); }, 'lx-btn-soft'),
      LXUI.button('🧹 Clear filings', () => { S.filings = null; api.sfx('click'); }, 'lx-btn-soft')
    ];
    c.appendChild(LXUI.row(items));
    const more = [];
    if (api.tier >= 1) {
      ui.add = LXUI.button('🧲 Add a 2nd magnet', () => {
        if (S.mags.length < 2) {
          S.mags.push({ x: api.W * 0.5, y: S.paper.y + S.paper.h * (api.narrow ? 0.2 : 0.78), rot: Math.PI, L: S.mags[0].L, T: S.mags[0].T });
          ui.add.disabled = true; api.sfx('click');
        }
      }, 'lx-btn-soft');
      more.push(ui.add);
    }
    if (api.tier >= 1) more.push(LXUI.button('🧭 Add a compass', () => {
      if (S.compasses.length < 4) S.compasses.push({ x: api.W * (0.2 + S.compasses.length * 0.18), y: S.paper.y + S.paper.h * 0.85, ang: 0, v: 0 });
      api.sfx('click');
    }, 'lx-btn-soft'));
    more.push(LXUI.button('↺ Put things back', () => { S.objs.forEach(o => { o.stuck = null; o.x = o.hx; o.y = o.hy; }); S.stuck = {}; api.sfx('click'); }, 'lx-btn-soft'));
    c.appendChild(LXUI.row(more));
    const tip = document.createElement('div'); tip.className = 'lx-readout';
    tip.textContent = api.tier >= 1 ? 'Drag the magnets, compasses and objects. Tap a magnet to turn it around.' : 'Drag the objects to the magnet. Drag the compass around it.';
    c.appendChild(tip);
  }

  function poles(m) {
    const d = m.L / 2 - 14;
    const cx = Math.cos(m.rot), sy = Math.sin(m.rot);
    return [{ q: 1, x: m.x - cx * d, y: m.y - sy * d, m }, { q: -1, x: m.x + cx * d, y: m.y + sy * d, m }];   // N first
  }
  function allPoles() { return S.mags.reduce((a, m) => a.concat(poles(m)), []); }

  // Field of point poles with a 3D (1/r²) falloff, plus a weak
  // uniform Earth field pointing to the top of the paper (north).
  function field(x, y, P, noEarth) {
    let bx = 0, by = noEarth ? 0 : -0.000007;
    for (const p of P) {
      const dx = x - p.x, dy = y - p.y, r2 = dx * dx + dy * dy + 30;
      const k = p.q / (r2 * Math.sqrt(r2));
      bx += dx * k; by += dy * k;
    }
    return [bx, by];
  }

  function underMagnet(x, y, pad) {
    return S.mags.some(m => {
      const c = Math.cos(-m.rot), s = Math.sin(-m.rot), dx = x - m.x, dy = y - m.y;
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      return Math.abs(lx) < m.L / 2 + (pad || 0) && Math.abs(ly) < m.T / 2 + (pad || 0);
    });
  }

  function sprinkle() {
    const P = allPoles(), pp = S.paper;
    const n = api.narrow ? 2300 : 2000;
    const list = [];
    let guard = 0;
    while (list.length < n && guard++ < n * 10) {
      const x = pp.x + 6 + Math.random() * (pp.w - 12), y = pp.y + 6 + Math.random() * (pp.h - 12);
      if (underMagnet(x, y, 2)) continue;
      const b = field(x, y, P, true), mag = Math.hypot(b[0], b[1]);
      // filings are pulled in and pile up where the field is strong
      const keep = Math.min(1, 0.05 + mag * 2.4e4);
      if (Math.random() > keep) continue;
      list.push({ x, y, a0: Math.random() * Math.PI, a: 0, len: 1.6 + Math.random() * 2.2, s: mag, k: 0.45 + Math.random() * 0.45 });
    }
    // dense tufts right at the poles, where real filings bunch up
    P.forEach(pl => {
      for (let i = 0; i < 260; i++) {
        const a = Math.random() * Math.PI * 2, r = 10 + Math.pow(Math.random(), 1.6) * 60;
        const x = pl.x + Math.cos(a) * r, y = pl.y + Math.sin(a) * r;
        if (x < pp.x + 4 || x > pp.x + pp.w - 4 || y < pp.y + 4 || y > pp.y + pp.h - 4 || underMagnet(x, y, 1)) continue;
        const b = field(x, y, P, true);
        list.push({ x, y, a0: Math.random() * Math.PI, a: 0, len: 2.4 + Math.random() * 3, s: Math.hypot(b[0], b[1]), k: 0.8 });
      }
    });
    S.filings = list;
    S.settle = 1;
    scheduleFilingsEvt();
  }

  let _fT = 0;
  function scheduleFilingsEvt() {
    clearTimeout(_fT);
    _fT = setTimeout(() => {
      if (!S || !S.filings) return;
      api.emit({ type: 'filings', facing: facing() });
    }, 900);
  }

  function facing() {
    if (S.mags.length < 2) return null;
    const a = poles(S.mags[0]), b = poles(S.mags[1]);
    let best = null;
    a.forEach(p => b.forEach(q => { const d = Math.hypot(p.x - q.x, p.y - q.y); if (!best || d < best.d) best = { d, same: p.q === q.q }; }));
    return best && best.d < 200 ? (best.same ? 'same' : 'opposite') : null;
  }

  function realign() {
    if (!S.filings) return;
    const P = allPoles();
    S.filings = S.filings.filter(f => !underMagnet(f.x, f.y, 1));
    S.filings.forEach(f => { f.a0 = f.a; const b = field(f.x, f.y, P, true); f.s = Math.hypot(b[0], b[1]); });
    S.settle = 1;
  }

  // ── input ──
  function hit(p) {
    for (let i = S.objs.length - 1; i >= 0; i--) { const o = S.objs[i]; if (Math.hypot(p.x - o.x, p.y - o.y) < 36) return { kind: 'obj', it: o }; }
    for (let i = S.compasses.length - 1; i >= 0; i--) { const c = S.compasses[i]; if (Math.hypot(p.x - c.x, p.y - c.y) < 42) return { kind: 'compass', it: c }; }
    for (let i = S.mags.length - 1; i >= 0; i--) { const m = S.mags[i]; if (underMagnet.call(null, p.x, p.y, 14) && pointOnMag(m, p, 14)) return { kind: 'mag', it: m }; }
    return null;
  }
  function pointOnMag(m, p, pad) {
    const c = Math.cos(-m.rot), s = Math.sin(-m.rot), dx = p.x - m.x, dy = p.y - m.y;
    return Math.abs(dx * c - dy * s) < m.L / 2 + pad && Math.abs(dx * s + dy * c) < m.T / 2 + pad;
  }

  function down(p) {
    const h = hit(p);
    if (!h) return;
    if (h.kind === 'obj' && h.it.stuck) { h.it.stuck = null; delete S.stuck[h.it.o.id]; }
    S.drag = Object.assign(h, { dx: p.x - h.it.x, dy: p.y - h.it.y, sx: p.x, sy: p.y, moved: false });
  }
  function move(p, e, pressed) {
    if (!S.drag || !pressed) return;
    const d = S.drag;
    if (Math.hypot(p.x - d.sx, p.y - d.sy) > 8) d.moved = true;
    const pp = S.paper;
    let nx = Math.max(pp.x + 10, Math.min(pp.x + pp.w - 10, p.x - d.dx));
    let ny = Math.max(pp.y + 10, Math.min(api.H - 20, p.y - d.dy));
    if (d.kind === 'mag') {
      ny = Math.min(pp.y + pp.h - 24, ny);
      // like poles push back when you get too close
      const other = S.mags.find(m => m !== d.it);
      if (other) {
        const save = { x: d.it.x, y: d.it.y };
        d.it.x = nx; d.it.y = ny;
        const near = closestPoles(d.it, other);
        if (near.same && near.d < 60) { const k = (60 - near.d) / 60; d.it.x = nx + (near.ux) * k * 30; d.it.y = ny + (near.uy) * k * 30; }
        if (!near.same && near.d < 30) { /* snaps on release */ }
        void save;
      } else { d.it.x = nx; d.it.y = ny; }
    } else {
      d.it.x = nx; d.it.y = ny;
    }
  }
  function closestPoles(m1, m2) {
    let best = null;
    poles(m1).forEach(p => poles(m2).forEach(q => {
      const dd = Math.hypot(p.x - q.x, p.y - q.y);
      if (!best || dd < best.d) best = { d: dd, same: p.q === q.q, ux: (p.x - q.x) / (dd || 1), uy: (p.y - q.y) / (dd || 1), p, q };
    }));
    return best;
  }
  function up() {
    if (!S.drag) return;
    const d = S.drag;
    S.drag = null;
    if (d.kind === 'mag') {
      if (!d.moved) { d.it.rot += Math.PI; api.sfx('click'); }
      const other = S.mags.find(m => m !== d.it);
      if (other) {
        const near = closestPoles(d.it, other);
        if (near.same && near.d < 110) { api.emit({ type: 'repel' }); api.toast('They push apart!'); }
        if (!near.same && near.d < 70) {
          // snap: move the dragged magnet so the poles touch
          const dx = near.q.x - near.p.x, dy = near.q.y - near.p.y, dd = Math.hypot(dx, dy) || 1;
          d.it.x += dx * (1 - 26 / dd); d.it.y += dy * (1 - 26 / dd);
          api.sfx('correct'); api.toast('Click! N and S attract.');
          api.emit({ type: 'attract' });
        }
      }
      realign();
      if (S.filings) scheduleFilingsEvt();
      // stuck objects travel with the magnet; re-place them
      S.objs.forEach(o => { if (o.stuck) placeStuck(o); });
    } else if (d.kind === 'obj') {
      const o = d.it, P = allPoles();
      let best = null;
      P.forEach(pl => { const dd = Math.hypot(o.x - pl.x, o.y - pl.y); if (!best || dd < best.d) best = { d: dd, pl }; });
      if (best && best.d < 95) {
        if (o.o.mag) {
          o.stuck = { mag: best.pl.m, end: best.pl.q };
          placeStuck(o);
          S.stuck[o.o.id] = true;
          api.sfx('correct');
          api.journal(o.o.name + ' is attracted to the magnet.');
          api.emit({ type: 'stick', id: o.o.id, count: Object.keys(S.stuck).length });
        } else {
          api.sfx('wrong');
          api.toast(o.o.name + ': not attracted.');
          api.journal(o.o.name + ' is not attracted.');
          o.x = o.hx; o.y = o.hy;
          api.emit({ type: 'nostick', id: o.o.id });
        }
      } else { o.x = o.hx; o.y = o.hy; }
    } else if (d.kind === 'compass') {
      setTimeout(() => compassEvt(d.it), 700);
    }
  }

  function placeStuck(o) {
    const m = o.stuck.mag, ps = poles(m), pl = o.stuck.end === 1 ? ps[0] : ps[1];
    const dir = o.stuck.end === 1 ? -1 : 1;
    const n = Object.keys(S.stuck).filter(k => { const ob = S.objs.find(x => x.o.id === k); return ob && ob !== o && ob.stuck && ob.stuck.mag === m && ob.stuck.end === o.stuck.end; }).length;
    o.x = pl.x + Math.cos(m.rot) * dir * 36 + (n ? -Math.sin(m.rot) * 26 : 0);
    o.y = pl.y + Math.sin(m.rot) * dir * 36 + (n ? Math.cos(m.rot) * 26 : 0);
    o.rot = m.rot;
  }

  function compassEvt(c) {
    if (!S) return;
    const P = allPoles();
    let near = null;
    P.forEach(pl => { const dd = Math.hypot(c.x - pl.x, c.y - pl.y); if (dd < 130 && (!near || dd < near.d)) near = { d: dd, q: pl.q }; });
    const minD = Math.min.apply(null, S.mags.map(m => Math.hypot(c.x - m.x, c.y - m.y)));
    const earth = minD > (api.narrow ? 250 : 220) && Math.abs(Math.sin(c.ang)) < 0.25 && Math.cos(c.ang) > 0.9;
    api.emit({ type: 'compass', near: near ? (near.q === 1 ? 'N' : 'S') : null, earth });
  }

  function frame(dt, t) {
    S.t = t;
    const P = allPoles();
    // compass needles swing toward the field with a little overshoot
    S.compasses.forEach(c => {
      const b = field(c.x, c.y, P);
      const target = Math.atan2(b[0], -b[1]);   // 0 = pointing up the paper
      let diff = target - c.ang;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      c.v += diff * 60 * dt; c.v *= Math.pow(0.02, dt); c.ang += c.v * dt;
    });
    if (S.settle > 0) {
      S.settle = Math.max(0, S.settle - dt * 1.4);
      if (S.filings) {
        const e = 1 - S.settle, ease = e * e * (3 - 2 * e);
        S.filings.forEach(f => {
          if (f.tgt === undefined || S.settle > 0.98) { const b = field(f.x, f.y, P, true); f.tgt = Math.atan2(b[1], b[0]); }
          let d = f.tgt - f.a0;
          while (d > Math.PI / 2) d -= Math.PI;
          while (d < -Math.PI / 2) d += Math.PI;
          // weak field far away: the filings barely turn
          f.a = f.a0 + d * ease * Math.min(1, f.s * 5e4);
        });
        if (S.settle === 0) { S.filings.forEach(f => { f.tgt = undefined; }); ZsCanvas.release(S.fcache); S.fcache = null; }
      }
    }
    draw(api.ctx, t);
  }

  function draw(ctx, t) {
    const W = api.W, H = api.H, pp = S.paper;
    ctx.drawImage(A.wood(W, H, '#B4845A', 12), 0, 0);
    // paper
    ctx.save();
    ctx.shadowColor = 'rgba(40,20,5,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.drawImage(A.paper(Math.round(pp.w), Math.round(pp.h), '#FBF9F3'), pp.x, pp.y);
    ctx.restore();
    // filings
    if (S.filings) {
      if (S.settle > 0 || !S.fcache) {
        let fc = S.settle > 0 ? null : A.offscreen(W * 2, H * 2);
        const fx = fc && ZsCanvas.get2d(fc);
        if (fc && !fx) { ZsCanvas.release(fc); fc = null; } // no memory: draw them directly
        const c2 = fc ? fx : ctx;
        if (fc) c2.scale(2, 2);
        c2.lineCap = 'round';
        c2.lineWidth = 1.05;
        [0.5, 0.72, 0.9].forEach((al, band) => {
          c2.strokeStyle = 'rgba(42,42,50,' + al + ')';
          c2.beginPath();
          S.filings.forEach((f, i) => {
            if (i % 3 !== band) return;
            const L = f.len * (1 + Math.min(1.2, f.s * 6e3));
            const ca = Math.cos(f.a) * L / 2, sa = Math.sin(f.a) * L / 2;
            c2.moveTo(f.x - ca, f.y - sa); c2.lineTo(f.x + ca, f.y + sa);
          });
          c2.stroke();
        });
        if (fc) { ZsCanvas.release(S.fcache); S.fcache = fc; }
      }
      if (S.fcache && S.settle === 0) ctx.drawImage(S.fcache, 0, 0, W, H);
    }
    // objects (stuck ones first so drag is on top)
    S.objs.forEach(o => drawObj(ctx, o, t));
    S.mags.forEach(m => drawMagnet(ctx, m));
    S.objs.forEach(o => { if (o.stuck) drawObj(ctx, o, t); });
    S.compasses.forEach(c => drawCompass(ctx, c));
    if (S.drag && S.drag.kind === 'obj') drawObj(ctx, S.drag.it, t, true);
    // tray label
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '800 ' + (api.narrow ? 15 : 12) + 'px Nunito, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Test these:', 20, pp.y + pp.h + (api.narrow ? 22 : 18));
  }

  function drawMagnet(ctx, m) {
    ctx.save();
    ctx.translate(m.x, m.y); ctx.rotate(m.rot);
    const L = m.L, T = m.T;
    A.shadow(ctx, 4, T / 2 + 2, L * 0.6, 10, 0.35);
    const red = ctx.createLinearGradient(0, -T / 2, 0, T / 2);
    red.addColorStop(0, '#F26060'); red.addColorStop(0.45, '#C81E1E'); red.addColorStop(1, '#7E1010');
    const blu = ctx.createLinearGradient(0, -T / 2, 0, T / 2);
    blu.addColorStop(0, '#8FA3BF'); blu.addColorStop(0.45, '#4A5B78'); blu.addColorStop(1, '#232D40');
    ctx.fillStyle = red; ctx.fillRect(-L / 2, -T / 2, L / 2, T);
    ctx.fillStyle = blu; ctx.fillRect(0, -T / 2, L / 2, T);
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(-L / 2, -T / 2, L, 5);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.strokeRect(-L / 2, -T / 2, L, T);
    ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round(T * 0.6) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.save(); ctx.translate(-L / 4, 1); ctx.rotate(-m.rot); ctx.fillText('N', 0, 0); ctx.restore();
    ctx.save(); ctx.translate(L / 4, 1); ctx.rotate(-m.rot); ctx.fillText('S', 0, 0); ctx.restore();
    ctx.restore();
  }

  function drawCompass(ctx, c) {
    const R = api.narrow ? 36 : 30;
    ctx.save();
    ctx.translate(c.x, c.y);
    A.shadow(ctx, 2, 6, R * 1.1, R * 0.5, 0.35);
    const br = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.2, 0, 0, R);
    br.addColorStop(0, '#F8E3A0'); br.addColorStop(0.7, '#C89B3C'); br.addColorStop(1, '#7E5B14');
    ctx.fillStyle = br; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FBFAF4'; ctx.beginPath(); ctx.arc(0, 0, R * 0.82, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8C6A20'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#5B4A2A'; ctx.font = '800 ' + Math.round(R * 0.3) + 'px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -R * 0.62);
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; ctx.fillRect(Math.cos(a) * R * 0.76 - 0.5, Math.sin(a) * R * 0.76 - 0.5, 1.5, 1.5); }
    ctx.rotate(c.ang);
    ctx.fillStyle = '#D62828';
    ctx.beginPath(); ctx.moveTo(0, -R * 0.7); ctx.lineTo(R * 0.13, 0); ctx.lineTo(-R * 0.13, 0); ctx.fill();
    ctx.fillStyle = '#E5E7EB';
    ctx.beginPath(); ctx.moveTo(0, R * 0.7); ctx.lineTo(R * 0.13, 0); ctx.lineTo(-R * 0.13, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, -R * 0.7); ctx.lineTo(R * 0.13, 0); ctx.lineTo(0, R * 0.7); ctx.lineTo(-R * 0.13, 0); ctx.closePath(); ctx.stroke();
    ctx.rotate(-c.ang);
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    const gl = ctx.createLinearGradient(-R, -R, R, R);
    gl.addColorStop(0, 'rgba(255,255,255,0.55)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, R * 0.82, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawObj(ctx, o, t, lifted) {
    if (!lifted && S.drag && S.drag.it === o) return;
    ctx.save();
    ctx.translate(o.x, o.y);
    if (lifted) { ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 8; }
    ctx.rotate(o.stuck ? o.rot : -0.3);
    const s = api.narrow ? 1.15 : 1;
    ctx.scale(s, s);
    const id = o.o.id;
    if (id === 'nail') {
      const g = ctx.createLinearGradient(0, -3, 0, 3); g.addColorStop(0, '#E5E7EB'); g.addColorStop(0.5, '#8E96A3'); g.addColorStop(1, '#4B5260');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-24, -2.5); ctx.lineTo(18, -2.5); ctx.lineTo(28, 0); ctx.lineTo(18, 2.5); ctx.lineTo(-24, 2.5); ctx.fill();
      ctx.fillRect(-28, -6, 5, 12);
    } else if (id === 'clip') {
      ctx.strokeStyle = '#A8B0BC'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-6, 6); ctx.lineTo(18, 6); ctx.arc(18, 0, 6, Math.PI / 2, -Math.PI / 2, true); ctx.lineTo(-18, -6); ctx.arc(-18, 0, 6, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(12, 6 - 0.01);
      ctx.moveTo(12, 2.5); ctx.lineTo(-12, 2.5); ctx.arc(-12, 0, 2.5, Math.PI / 2, -Math.PI / 2); ctx.lineTo(8, -2.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-14, -7); ctx.lineTo(16, -7); ctx.stroke();
    } else if (id === 'copper') {
      ctx.strokeStyle = '#B4602A'; ctx.lineWidth = 3;
      ctx.beginPath(); for (let a = 0; a < Math.PI * 7; a += 0.2) { const x = -22 + a * 2, y = Math.sin(a) * 8; if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
      ctx.strokeStyle = '#F2A66B'; ctx.lineWidth = 1; ctx.stroke();
    } else if (id === 'foil') {
      const r = A.rng(4);
      ctx.beginPath();
      for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2, rr = 13 + r() * 6; if (k === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath();
      const g = ctx.createLinearGradient(-15, -15, 15, 15); g.addColorStop(0, '#F8FAFC'); g.addColorStop(0.4, '#AEB6C2'); g.addColorStop(0.6, '#E5E9EF'); g.addColorStop(1, '#7B8494');
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(80,90,100,0.4)'; ctx.lineWidth = 0.8;
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo((r() - 0.5) * 20, (r() - 0.5) * 20); ctx.lineTo((r() - 0.5) * 20, (r() - 0.5) * 20); ctx.stroke(); }
    } else if (id === 'pencil') {
      ctx.fillStyle = '#F2C230'; ctx.fillRect(-26, -4.5, 40, 9);
      ctx.fillStyle = '#D9A71C'; ctx.fillRect(-26, 0, 40, 4.5);
      ctx.fillStyle = '#E8C9A0'; ctx.beginPath(); ctx.moveTo(14, -4.5); ctx.lineTo(26, 0); ctx.lineTo(14, 4.5); ctx.fill();
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.moveTo(22, -1.5); ctx.lineTo(26, 0); ctx.lineTo(22, 1.5); ctx.fill();
      ctx.fillStyle = '#F29CB0'; ctx.fillRect(-32, -4.5, 6, 9);
    } else if (id === 'marble') {
      const g = ctx.createRadialGradient(-4, -5, 1, 0, 0, 13); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.3, '#9ED8F0'); g.addColorStop(1, '#2A7BA8');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,60,0.7)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-8, 4); ctx.quadraticCurveTo(0, -6, 8, 3); ctx.stroke();
    }
    ctx.restore();
    if (!o.stuck && !(S.drag && S.drag.it === o)) {
      ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = '700 ' + (api.narrow ? 13 : 10) + 'px Nunito, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(o.o.name.split(' (')[0], o.x, o.y + (api.narrow ? 30 : 24));
    }
  }

  function stop() { clearTimeout(_fT); }
  return { challenges, start, frame, down, move, up, stop, _S: () => S };
})();
