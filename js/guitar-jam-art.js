/* ================================================================
   GUITAR JAM — ART (js/guitar-jam-art.js)

   Hand-built canvas/SVG art, no images:
     GJArt.Guitar   — a steel-string acoustic seen from the player's
                      side: headstock with 3+3 tuners, bone nut,
                      rosewood fretboard with nickel frets and pearl
                      dots (3/5/7/9/12), spruce top with rosette and
                      sound hole, six strings of real relative gauge
                      (.053 → .012, bronze-wound basses). Shows chord
                      shapes, vibrates strings, and turns taps/swipes
                      into frets, plucks and strums.
     GJArt.Lane     — the scrolling chord lane + strum guide (canvas).
     GJArt.chordBox — classic vertical chord diagram (SVG string).
     GJArt.gauge    — analogue needle tuner face (SVG string).
     GJArt.headstock— tuner-tab headstock (SVG string).
     GJArt.icon / stars / pick — small SVG pieces.
   ================================================================ */

const GJArt = (() => {
  'use strict';

  // String gauges in inches, low E (0) → high E (5): a light acoustic set.
  const GAUGE = [0.053, 0.042, 0.032, 0.024, 0.016, 0.012];
  const WOUND = [true, true, true, true, false, false];
  const FINGER_COL = { 1: '#2563EB', 2: '#059669', 3: '#D97706', 4: '#DC2626' };
  const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
  const R12 = Math.pow(2, -1 / 12);

  function rng(seed) {
    let a = seed >>> 0;
    return function() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')';
  }

  // Detect a barre: one finger number on 2+ strings at the same fret.
  function findBarre(chord) {
    if (!chord || !chord.fingers) return null;
    const by = {};
    chord.fingers.forEach((f, s) => {
      const fr = chord.frets[s];
      if (f > 0 && fr > 0) {
        const k = f + ':' + fr;
        (by[k] = by[k] || []).push(s);
      }
    });
    let best = null;
    Object.keys(by).forEach(k => {
      const ss = by[k];
      if (ss.length >= 2) {
        const [finger, fret] = k.split(':').map(Number);
        const from = Math.min.apply(null, ss), to = Math.max.apply(null, ss);
        if (!best || (to - from) > (best.to - best.from)) best = { finger, fret, from, to };
      }
    });
    return best;
  }

  // ════════════════════════════════════════════════════════════════
  //  GUITAR
  // ════════════════════════════════════════════════════════════════
  class Guitar {
    constructor(canvas, opts) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = Object.assign({
        orient: 'auto', minFretPx: 34, vFretPx: 50, maxFret: 12, minFret: 5,
        headstock: true, body: true, tapStrum: false, hHeight: null,
        clock: () => performance.now() / 1000
      }, opts || {});
      this.chord = null;    // {frets, fingers}
      this.ghost = null;    // chord shown as dashed outlines
      this.placed = null;   // [{string, fret, state}] build mode
      this.markers = null;  // override O/X: array of 'o'|'x'|null
      this.showMarkers = true;
      this.highlight = null; // {string, fret} single note highlight
      this.fx = [];          // short-lived rings
      this.vib = [0, 1, 2, 3, 4, 5].map(() => ({ a0: 0, start: 0, ph: Math.random() * 6, tau: 0.7, from: 0 }));
      this.handlers = {};
      this.static = document.createElement('canvas');
      this._raf = 0;
      this._ptr = null;
      this._bind();
      this.resize();
      if (window.ResizeObserver) {
        this._ro = new ResizeObserver(() => this.resize());
        this._ro.observe(canvas.parentElement);
      } else {
        window.addEventListener('resize', () => this.resize());
      }
    }

    on(name, fn) { this.handlers[name] = fn; return this; }
    _emit(name) { const fn = this.handlers[name]; if (fn) fn.apply(null, Array.prototype.slice.call(arguments, 1)); }

    // ── Layout ──────────────────────────────────────────────────
    resize() {
      const parent = this.cv.parentElement;
      if (!parent) return;
      const W = Math.round(parent.clientWidth);
      if (W < 40) return;
      const o = this.o;
      const orient = o.orient === 'auto' ? (W < 620 ? 'v' : 'h') : o.orient;
      const L = {};
      L.orient = orient;
      L.N = o.minFret;

      if (orient === 'h') {
        const H = Math.round(o.hHeight ? o.hHeight(W) : clamp(W * 0.31, 200, 340));
        L.cssW = W; L.cssH = H;
        L.Cc = H; L.Wn = H * 0.6;
        L.head = o.headstock ? Math.min(L.Wn * 1.3, W * 0.17) : 0;
        L.shift = 0;
        L.bodyLen = o.body ? clamp(W * 0.24, 110, 290) : 0;
        L.nutW = clamp(L.Wn * 0.05, 5, 9);
        L.nutU = L.head + L.nutW + (o.headstock ? 0 : 26);
        const R = W - L.nutU - L.bodyLen - (o.body ? 4 : 6);
        let N = o.maxFret, f1 = 0;
        for (; N >= o.minFret; N--) {
          f1 = R * (1 - R12) / (1 - Math.pow(R12, N));
          if (f1 * Math.pow(R12, N - 1) >= o.minFretPx) break;
        }
        if (N < o.minFret) { N = o.minFret; f1 = R * (1 - R12) / (1 - Math.pow(R12, N)); }
        L.N = N; L.f1 = f1;
        L.Lc = W;
      } else {
        L.cssW = W;
        L.Cc = W; L.Wn = Math.min(W * 0.7, 300);
        const N = 5;
        L.N = N;
        L.f1 = o.vFretPx * Math.pow(R12, -(N - 1));
        const fullHead = o.headstock ? L.Wn * 1.05 : 0;
        const visHead = o.headstock ? L.Wn * 0.62 : 0;
        L.head = fullHead;
        L.shift = fullHead - visHead;
        L.bodyLen = o.body ? L.Wn * 0.82 : 0;
        L.nutW = clamp(L.Wn * 0.04, 6, 9);
        L.nutU = L.head + L.nutW + (o.headstock ? 0 : 26);
        const fretSum = L.f1 * (1 - Math.pow(R12, N)) / (1 - R12);
        L.Lc = L.nutU + fretSum + (o.body ? 4 + L.bodyLen : 8);
        L.cssH = Math.round(L.Lc - L.shift);
      }
      L.vc = L.Cc / 2;
      L.pos = [];
      for (let n = 0; n <= L.N; n++) L.pos.push(L.nutU + L.f1 * (1 - Math.pow(R12, n)) / (1 - R12));
      const lastFretLen = L.pos[L.N] - L.pos[L.N - 1];
      L.bodyStart = L.pos[L.N] + (o.body ? lastFretLen * 0.35 : 0);
      if (o.body) {
        L.holeR = Math.min(L.Wn * 0.62, L.bodyLen * 0.34, L.Cc * 0.4);
        L.fbEnd = L.bodyStart + Math.max(6, L.bodyLen * 0.08);
        L.holeCx = L.fbEnd + L.holeR * 1.3 + 3;
      } else {
        L.fbEnd = L.pos[L.N] + lastFretLen * 0.3;
      }
      // Real taper: 43 mm at the nut → ~52 mm at the 12th fret.
      L.wNut = L.Wn * 0.88;
      L.half = L.f1 * (1 - Math.pow(R12, 12)) / (1 - R12);
      L.bridgeU = L.Lc + L.bodyLen * 1.1 + 40;
      this.L = L;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.dpr = dpr;
      this.cv.style.height = L.cssH + 'px';
      this.cv.width = Math.round(L.cssW * dpr);
      this.cv.height = Math.round(L.cssH * dpr);
      this.static.width = this.cv.width;
      this.static.height = this.cv.height;
      this.cv.style.touchAction = (orient === 'v') ? 'pan-y' : 'none';
      this._drawStatic();
      this.render();
    }

    // neck width / string spacing at a position along the neck
    _w(u) {
      const L = this.L;
      return L.wNut * (1 + 0.21 * Math.max(0, u - L.nutU) / L.half);
    }
    _sp(u) { return this._w(Math.max(u, this.L.nutU)) * 0.82 / 5; }
    sv(i, u) { return this.L.vc + (i - 2.5) * this._sp(u); }

    _localTransform(ctx) {
      const d = this.dpr, s = this.L.shift;
      if (this.L.orient === 'h') ctx.setTransform(d, 0, 0, d, -s * d, 0);
      else ctx.setTransform(0, d, d, 0, 0, -s * d);
    }
    _screenTransform(ctx) { ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); }
    toScreen(u, v) { return this.L.orient === 'h' ? [u - this.L.shift, v] : [v, u - this.L.shift]; }
    toLocal(x, y) { return this.L.orient === 'h' ? [x + this.L.shift, y] : [y + this.L.shift, x]; }
    fretMid(f) {
      const p = this.L.pos;
      if (f <= 0) return this.L.nutU - this.L.nutW - 13;
      return p[f] - (p[f] - p[f - 1]) * 0.44;
    }

    // ── Static layer ────────────────────────────────────────────
    _drawStatic() {
      const ctx = this.static.getContext('2d');
      const L = this.L, o = this.o;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.static.width, this.static.height);
      this._localTransform(ctx);
      const R = rng(7);

      if (o.body) this._drawBody(ctx, R);
      this._drawFretboard(ctx, R);
      if (o.headstock) this._drawHeadstock(ctx, R);
      this._drawNut(ctx);
      // fret numbers (screen space, beside the neck)
      this._screenTransform(ctx);
      ctx.fillStyle = 'rgba(60,45,35,0.55)';
      ctx.font = '700 11px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [1, 3, 5, 7, 9, 12].forEach(n => {
        if (n > L.N) return;
        const u = (L.pos[n] + L.pos[n - 1]) / 2;
        const v = L.vc + this._w(u) / 2 + 10;
        if (v > L.Cc - 4) return;
        const [x, y] = this.toScreen(u, v);
        ctx.fillText(String(n), x, y);
      });
    }

    _neckPath(ctx, u0, u1) {
      const L = this.L;
      ctx.beginPath();
      ctx.moveTo(u0, L.vc - this._w(u0) / 2);
      ctx.lineTo(u1, L.vc - this._w(u1) / 2);
      ctx.lineTo(u1, L.vc + this._w(u1) / 2);
      ctx.lineTo(u0, L.vc + this._w(u0) / 2);
      ctx.closePath();
    }

    _drawBody(ctx, R) {
      const L = this.L;
      const Bx = Math.max(L.bodyLen * 1.7, L.Cc * 1.05);
      const By = L.Cc * 0.64;
      const cx = L.bodyStart - 6 + Bx, cy = L.vc;
      // shadow + top
      ctx.save();
      ctx.shadowColor = 'rgba(40,25,10,0.35)'; ctx.shadowBlur = 14 * this.dpr; ctx.shadowOffsetY = 4 * this.dpr;
      ctx.beginPath(); ctx.ellipse(cx, cy, Bx, By, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e3bd7f'; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, cy, Bx - 1, By - 1, 0, 0, Math.PI * 2); ctx.clip();
      // spruce base with warm sunburst edge
      const g = ctx.createRadialGradient(cx - Bx * 0.25, cy, By * 0.2, cx, cy, Math.max(Bx, By));
      g.addColorStop(0, '#f3d9a6'); g.addColorStop(0.55, '#e9c78d'); g.addColorStop(0.85, '#d4a35e'); g.addColorStop(1, '#9a5d26');
      ctx.fillStyle = g;
      ctx.fillRect(L.bodyStart - 10, 0, L.Lc - L.bodyStart + 400, L.Cc);
      // straight spruce grain along the strings
      let v = -2;
      while (v < L.Cc + 2) {
        const gap = 1.6 + R() * 4.2;
        v += gap;
        ctx.strokeStyle = R() < 0.25 ? 'rgba(150,95,40,0.32)' : 'rgba(170,120,60,' + (0.08 + R() * 0.16).toFixed(3) + ')';
        ctx.lineWidth = 0.4 + R() * 0.9;
        ctx.beginPath();
        const ph = R() * 6, amp = R() * 0.8;
        for (let u = L.bodyStart - 10; u < L.Lc + 20; u += 24) {
          const y = v + Math.sin(u * 0.01 + ph) * amp;
          if (u === L.bodyStart - 10) ctx.moveTo(u, y); else ctx.lineTo(u, y);
        }
        ctx.stroke();
      }
      // soft sheen of the lacquer
      const sh = ctx.createLinearGradient(0, L.vc - By * 0.6, 0, L.vc + By * 0.6);
      sh.addColorStop(0, 'rgba(255,255,255,0.0)'); sh.addColorStop(0.35, 'rgba(255,250,235,0.16)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = sh; ctx.fillRect(L.bodyStart - 10, 0, L.Lc + 400, L.Cc);
      ctx.restore();
      // binding (cream) + purfling (dark)
      ctx.beginPath(); ctx.ellipse(cx, cy, Bx - 2, By - 2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#f3e7cd'; ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, Bx - 5, By - 5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(60,30,12,0.75)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, cy, Bx, By, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(70,40,15,0.6)'; ctx.lineWidth = 1; ctx.stroke();

      // pickguard (tortoiseshell) on the treble side, below the hole
      const hx = L.holeCx, hr = L.holeR;
      ctx.save();
      ctx.beginPath(); ctx.ellipse(cx, cy, Bx - 6, By - 6, 0, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath();
      ctx.moveTo(hx - hr * 0.2, L.vc + hr * 1.32);
      ctx.bezierCurveTo(hx + hr * 0.9, L.vc + hr * 1.15, hx + hr * 2.0, L.vc + hr * 1.5, hx + hr * 1.6, L.vc + hr * 2.6);
      ctx.bezierCurveTo(hx + hr * 0.9, L.vc + hr * 3.1, hx - hr * 0.6, L.vc + hr * 2.4, hx - hr * 0.2, L.vc + hr * 1.32);
      const pg = ctx.createLinearGradient(hx - hr, 0, hx + hr * 2, 0);
      pg.addColorStop(0, '#3b1508'); pg.addColorStop(0.5, '#5a230d'); pg.addColorStop(1, '#2c0f05');
      ctx.fillStyle = pg; ctx.fill();
      ctx.clip();
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = 'rgba(' + (150 + R() * 60 | 0) + ',' + (70 + R() * 40 | 0) + ',20,' + (0.15 + R() * 0.25).toFixed(2) + ')';
        ctx.beginPath();
        ctx.ellipse(hx - hr + R() * hr * 3, L.vc + hr + R() * hr * 2.2, 2 + R() * 7, 1 + R() * 3, R() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // rosette rings + sound hole
      const ring = (r, w, col) => { ctx.beginPath(); ctx.arc(hx, L.vc, r, 0, Math.PI * 2); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
      ring(hr * 1.27, hr * 0.035, '#2a160b');
      ring(hr * 1.235, hr * 0.03, '#f1e4c6');
      // mosaic band
      const segs = Math.round(hr * 1.4);
      for (let i = 0; i < segs; i++) {
        const a0 = i / segs * Math.PI * 2, a1 = (i + 0.55) / segs * Math.PI * 2;
        ctx.beginPath(); ctx.arc(hx, L.vc, hr * 1.16, a0, a1);
        ctx.strokeStyle = i % 3 === 0 ? '#1d4d3a' : (i % 3 === 1 ? '#7a3b16' : '#e9d9b4');
        ctx.lineWidth = hr * 0.09; ctx.stroke();
      }
      ring(hr * 1.105, hr * 0.022, '#2a160b');
      ring(hr * 1.07, hr * 0.03, '#f1e4c6');
      ring(hr * 1.04, hr * 0.02, '#2a160b');
      // the hole
      const hg = ctx.createRadialGradient(hx - hr * 0.2, L.vc - hr * 0.1, hr * 0.1, hx, L.vc, hr);
      hg.addColorStop(0, '#2b1a0f'); hg.addColorStop(0.7, '#160c06'); hg.addColorStop(1, '#050302');
      ctx.beginPath(); ctx.arc(hx, L.vc, hr, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill();
      // a hint of the braces inside
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(120,80,40,0.18)'; ctx.lineWidth = hr * 0.12;
      ctx.beginPath(); ctx.moveTo(hx + hr * 0.55, L.vc - hr); ctx.lineTo(hx + hr * 0.75, L.vc + hr); ctx.stroke();
      ctx.restore();
      // cut edge of the top
      ctx.beginPath(); ctx.arc(hx, L.vc, hr - 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(230,200,140,0.65)'; ctx.lineWidth = 1.2; ctx.stroke();
    }

    _drawFretboard(ctx, R) {
      const L = this.L;
      const u0 = L.nutU - 1, u1 = L.fbEnd;
      // neck shadow
      ctx.save();
      ctx.shadowColor = 'rgba(30,15,5,0.45)'; ctx.shadowBlur = 10 * this.dpr; ctx.shadowOffsetY = 4 * this.dpr;
      this._neckPath(ctx, u0, u1); ctx.fillStyle = '#3a2116'; ctx.fill();
      ctx.restore();
      ctx.save();
      this._neckPath(ctx, u0, u1); ctx.clip();
      const base = ctx.createLinearGradient(0, L.vc - L.Wn / 2, 0, L.vc + L.Wn / 2);
      base.addColorStop(0, '#2c180f'); base.addColorStop(0.18, '#4a2a1b'); base.addColorStop(0.5, '#43261a');
      base.addColorStop(0.82, '#4d2c1c'); base.addColorStop(1, '#26140c');
      ctx.fillStyle = base; ctx.fillRect(u0, 0, u1 - u0, L.Cc);
      // grain streaks
      const n = Math.round(L.Wn * 0.9);
      for (let i = 0; i < n; i++) {
        const v = L.vc - L.Wn / 2 + R() * L.Wn;
        const dark = R() < 0.7;
        ctx.strokeStyle = dark ? 'rgba(18,8,4,' + (0.12 + R() * 0.35).toFixed(3) + ')' : 'rgba(120,70,40,' + (0.06 + R() * 0.14).toFixed(3) + ')';
        ctx.lineWidth = 0.3 + R() * 1.5;
        const ph = R() * 6, amp = 0.4 + R() * 1.8, fq = 0.006 + R() * 0.02;
        const start = u0 + R() * (u1 - u0) * 0.3, end = start + (u1 - u0) * (0.4 + R() * 0.8);
        ctx.beginPath();
        for (let u = start; u <= end; u += 14) {
          const y = v + Math.sin(u * fq + ph) * amp;
          if (u === start) ctx.moveTo(u, y); else ctx.lineTo(u, y);
        }
        ctx.stroke();
      }
      // pores
      for (let i = 0; i < n * 3; i++) {
        const u = u0 + R() * (u1 - u0), v = L.vc - L.Wn / 2 + R() * L.Wn;
        ctx.fillStyle = 'rgba(10,4,2,' + (0.25 + R() * 0.35).toFixed(2) + ')';
        ctx.fillRect(u, v, 1.5 + R() * 4, 0.6);
      }
      // edge rounding: darker toward the sides
      const edge = ctx.createLinearGradient(0, L.vc - L.Wn / 2, 0, L.vc + L.Wn / 2);
      edge.addColorStop(0, 'rgba(0,0,0,0.35)'); edge.addColorStop(0.08, 'rgba(0,0,0,0)');
      edge.addColorStop(0.92, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = edge; ctx.fillRect(u0, 0, u1 - u0, L.Cc);

      // pearl inlays
      const pearl = (u, v, r) => {
        const pg = ctx.createRadialGradient(u - r * 0.35, v - r * 0.35, r * 0.1, u, v, r);
        pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.45, '#f1eee8'); pg.addColorStop(0.75, '#dcd6e8'); pg.addColorStop(1, '#b9c4c9');
        ctx.beginPath(); ctx.arc(u, v, r, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill();
        // iridescent flecks
        const ig = ctx.createLinearGradient(u - r, v - r, u + r, v + r);
        ig.addColorStop(0, 'rgba(255,180,220,0.25)'); ig.addColorStop(0.5, 'rgba(160,230,220,0.22)'); ig.addColorStop(1, 'rgba(200,190,255,0.25)');
        ctx.fillStyle = ig; ctx.fill();
        ctx.strokeStyle = 'rgba(20,10,5,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();
      };
      [3, 5, 7, 9, 12, 15].forEach(f => {
        if (f > L.N) return;
        const u = (L.pos[f] + L.pos[f - 1]) / 2;
        const r = Math.min((L.pos[f] - L.pos[f - 1]) * 0.17, this._sp(u) * 0.42);
        if (f === 12) { pearl(u, L.vc - this._sp(u) * 1.5, r); pearl(u, L.vc + this._sp(u) * 1.5, r); }
        else pearl(u, L.vc, r);
      });

      // nickel-silver frets
      for (let f = 1; f <= L.N; f++) {
        const u = L.pos[f];
        const fw = clamp(L.f1 * 0.05, 2.4, 4.6);
        const w = this._w(u);
        // shadow cast on the wood
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(u + fw * 0.4, L.vc - w / 2, fw * 0.9, w);
        const fg = ctx.createLinearGradient(u - fw / 2, 0, u + fw / 2, 0);
        fg.addColorStop(0, '#6c7077'); fg.addColorStop(0.3, '#dfe2e6'); fg.addColorStop(0.45, '#ffffff');
        fg.addColorStop(0.7, '#a8adb4'); fg.addColorStop(1, '#55595f');
        ctx.fillStyle = fg;
        ctx.fillRect(u - fw / 2, L.vc - w / 2 - 0.5, fw, w + 1);
      }
      ctx.restore();
      // binding lines on the fretboard edges
      ctx.strokeStyle = 'rgba(240,228,200,0.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(u0, L.vc - this._w(u0) / 2 + 0.8); ctx.lineTo(u1, L.vc - this._w(u1) / 2 + 0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(u0, L.vc + this._w(u0) / 2 - 0.8); ctx.lineTo(u1, L.vc + this._w(u1) / 2 - 0.8); ctx.stroke();
      if (this.o.body) {
        // fretboard end
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(u1, L.vc - this._w(u1) / 2, 2, this._w(u1));
      }
    }

    _drawNut(ctx) {
      const L = this.L;
      const u1 = L.nutU, u0 = L.nutU - L.nutW;
      const w = L.wNut + 2;
      const g = ctx.createLinearGradient(u0, 0, u1, 0);
      g.addColorStop(0, '#cfc3a4'); g.addColorStop(0.35, '#fbf6e8'); g.addColorStop(0.7, '#efe6cf'); g.addColorStop(1, '#b8aa87');
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 3 * this.dpr; ctx.shadowOffsetY = 1 * this.dpr;
      ctx.fillStyle = g;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(u0, L.vc - w / 2, L.nutW, w, 1.5); else ctx.rect(u0, L.vc - w / 2, L.nutW, w);
      ctx.fill();
      ctx.restore();
      // string slots
      for (let i = 0; i < 6; i++) {
        const v = this.sv(i, L.nutU);
        ctx.fillStyle = 'rgba(90,70,40,0.55)';
        ctx.fillRect(u0 + L.nutW * 0.2, v - 0.8, L.nutW * 0.8, 1.6);
      }
    }

    _postPos() {
      // 3+3: low E/A/D on the top side, G/B/e on the bottom side;
      // the E strings' posts sit nearest the nut.
      const L = this.L;
      const hw = L.wNut * 1.36;
      const res = [];
      for (let i = 0; i < 6; i++) {
        const side = i < 3 ? -1 : 1;
        const k = i < 3 ? i : 5 - i; // 0 = nearest nut
        const u = L.nutU - L.nutW - L.head * (0.25 + k * 0.25);
        const v = L.vc + side * hw * 0.3;
        res.push({ u, v, side });
      }
      return res;
    }

    _drawHeadstock(ctx, R) {
      const L = this.L;
      const u1 = L.nutU - L.nutW + 1, u0 = u1 - L.head;
      const wn = L.wNut + 2, hw = L.wNut * 1.36;
      const path = () => {
        ctx.beginPath();
        ctx.moveTo(u1, L.vc - wn / 2);
        ctx.bezierCurveTo(u1 - L.head * 0.12, L.vc - wn / 2, u1 - L.head * 0.18, L.vc - hw / 2, u1 - L.head * 0.32, L.vc - hw / 2);
        ctx.lineTo(u0 + L.head * 0.1, L.vc - hw / 2 - L.head * 0.02);
        ctx.quadraticCurveTo(u0, L.vc - hw / 2, u0 + L.head * 0.02, L.vc - hw * 0.3);
        ctx.quadraticCurveTo(u0 + L.head * 0.07, L.vc, u0 + L.head * 0.02, L.vc + hw * 0.3);
        ctx.quadraticCurveTo(u0, L.vc + hw / 2, u0 + L.head * 0.1, L.vc + hw / 2 + L.head * 0.02);
        ctx.lineTo(u1 - L.head * 0.32, L.vc + hw / 2);
        ctx.bezierCurveTo(u1 - L.head * 0.18, L.vc + hw / 2, u1 - L.head * 0.12, L.vc + wn / 2, u1, L.vc + wn / 2);
        ctx.closePath();
      };
      const posts = this._postPos();
      // tuner keys: chrome gear housing on the edge, shaft, pearloid button
      posts.forEach(p => {
        const edge = L.vc + p.side * hw / 2;
        const kr = Math.max(5, L.head * 0.075);
        const kv = edge + p.side * (kr * 2.1);
        const sg = ctx.createLinearGradient(p.u - kr, 0, p.u + kr, 0);
        sg.addColorStop(0, '#6d7279'); sg.addColorStop(0.5, '#eef0f2'); sg.addColorStop(1, '#5e636a');
        ctx.fillStyle = sg;
        ctx.fillRect(p.u - kr * 0.22, Math.min(edge, kv), kr * 0.44, Math.abs(kv - edge));
        // housing
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(p.u - kr * 0.75, edge - kr * 0.75, kr * 1.5, kr * 1.5, kr * 0.3); else ctx.rect(p.u - kr * 0.75, edge - kr * 0.75, kr * 1.5, kr * 1.5);
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = 'rgba(40,40,45,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
        const kg = ctx.createRadialGradient(p.u - kr * 0.3, kv - kr * 0.3, kr * 0.1, p.u, kv, kr * 1.2);
        kg.addColorStop(0, '#fbfbf7'); kg.addColorStop(0.5, '#e4ddc9'); kg.addColorStop(1, '#a99f86');
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 3 * this.dpr; ctx.shadowOffsetY = 1.5 * this.dpr;
        ctx.beginPath(); ctx.ellipse(p.u, kv + p.side * kr * 0.4, kr * 0.9, kr * 1.15, 0, 0, Math.PI * 2);
        ctx.fillStyle = kg; ctx.fill();
        ctx.restore();
        ctx.strokeStyle = 'rgba(90,80,60,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();
      });
      ctx.save();
      ctx.shadowColor = 'rgba(30,15,5,0.45)'; ctx.shadowBlur = 10 * this.dpr; ctx.shadowOffsetY = 4 * this.dpr;
      path(); ctx.fillStyle = '#2a170f'; ctx.fill();
      ctx.restore();
      ctx.save();
      path(); ctx.clip();
      const g = ctx.createLinearGradient(0, L.vc - hw / 2, 0, L.vc + hw / 2);
      g.addColorStop(0, '#1e0f08'); g.addColorStop(0.3, '#3d2216'); g.addColorStop(0.55, '#4a2a1b'); g.addColorStop(1, '#1a0c06');
      ctx.fillStyle = g; ctx.fillRect(u0 - 2, 0, L.head + 4, L.Cc);
      for (let i = 0; i < 70; i++) {
        const v = L.vc - hw / 2 + R() * hw;
        ctx.strokeStyle = 'rgba(12,5,2,' + (0.15 + R() * 0.3).toFixed(2) + ')';
        ctx.lineWidth = 0.4 + R() * 1.2;
        ctx.beginPath(); ctx.moveTo(u0, v);
        for (let u = u0; u <= u1; u += 10) ctx.lineTo(u, v + Math.sin(u * 0.05 + i) * 0.8);
        ctx.stroke();
      }
      // gloss
      const gl = ctx.createLinearGradient(0, L.vc - hw / 2, 0, L.vc);
      gl.addColorStop(0, 'rgba(255,255,255,0.0)'); gl.addColorStop(0.6, 'rgba(255,240,220,0.10)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl; ctx.fillRect(u0, L.vc - hw / 2, L.head, hw / 2);
      ctx.restore();
      // truss-rod cover (small bell)
      const tu = u1 - L.head * 0.12;
      ctx.beginPath();
      ctx.moveTo(tu, L.vc - wn * 0.14);
      ctx.quadraticCurveTo(tu - L.head * 0.16, L.vc - wn * 0.12, tu - L.head * 0.2, L.vc);
      ctx.quadraticCurveTo(tu - L.head * 0.16, L.vc + wn * 0.12, tu, L.vc + wn * 0.14);
      ctx.closePath();
      ctx.fillStyle = '#121212'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
      // strings from the nut to the posts, then the posts
      posts.forEach((p, i) => {
        this._stringStroke(ctx, i, [[L.nutU - L.nutW, this.sv(i, L.nutU)], [p.u, p.v]], 0.9);
      });
      posts.forEach(p => {
        const pr = Math.max(3.2, L.head * 0.055);
        const bg = ctx.createRadialGradient(p.u - pr * 0.4, p.v - pr * 0.4, 0.5, p.u, p.v, pr * 1.6);
        bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.4, '#c9cdd3'); bg.addColorStop(1, '#5d6168');
        ctx.beginPath(); ctx.arc(p.u, p.v, pr * 1.55, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.fill();
        ctx.beginPath(); ctx.arc(p.u, p.v, pr * 0.8, 0, Math.PI * 2); ctx.fillStyle = '#8b9098'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.7; ctx.stroke();
      });
    }

    _sw(i) {
      const sp = this._sp(this.L.nutU + (this.L.fbEnd - this.L.nutU) * 0.5);
      return Math.max(1.1, sp * 0.11 * GAUGE[i] / 0.053);
    }

    // Draw one string along a polyline in local coords.
    _stringStroke(ctx, i, pts, alpha) {
      const w = this._sw(i);
      const wound = WOUND[i];
      const trace = (dv) => {
        ctx.beginPath();
        pts.forEach((p, k) => { if (k === 0) ctx.moveTo(p[0], p[1] + dv); else ctx.lineTo(p[0], p[1] + dv); });
      };
      ctx.save();
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // shadow on the wood
      trace(w * 0.9 + 1.2);
      ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = w + 1; ctx.stroke();
      trace(0);
      ctx.strokeStyle = wound ? '#5a3a14' : '#50555c'; ctx.lineWidth = w; ctx.stroke();
      trace(0);
      ctx.strokeStyle = wound ? '#b98a45' : '#b6bac1'; ctx.lineWidth = w * 0.72; ctx.stroke();
      if (wound && w > 1.6) {
        trace(0);
        ctx.setLineDash([0.9, Math.max(0.9, w * 0.35)]);
        ctx.strokeStyle = 'rgba(70,40,10,0.55)'; ctx.lineWidth = w * 0.8; ctx.lineCap = 'butt'; ctx.stroke();
        ctx.setLineDash([]); ctx.lineCap = 'round';
      }
      trace(-w * 0.18);
      ctx.strokeStyle = wound ? 'rgba(255,226,170,0.9)' : 'rgba(255,255,255,0.95)'; ctx.lineWidth = Math.max(0.5, w * 0.26); ctx.stroke();
      ctx.restore();
    }

    // ── State setters ───────────────────────────────────────────
    setChord(chord) { this.chord = chord; this.render(); }
    setGhost(chord) { this.ghost = chord; this.render(); }
    setPlaced(list) { this.placed = list; this.render(); }
    setMarkers(m) { this.markers = m; this.render(); }
    setHighlight(h) { this.highlight = h; this.render(); }
    frets() {
      if (this.placed) {
        const fr = [0, 0, 0, 0, 0, 0];
        if (this.markers) this.markers.forEach((m, i) => { if (m === 'x') fr[i] = -1; });
        this.placed.forEach(p => { fr[p.string] = p.fret; });
        return fr;
      }
      return this.chord ? this.chord.frets.slice() : [0, 0, 0, 0, 0, 0];
    }

    // Start a string vibrating at audio time `when`.
    vibrate(i, vel, when, fret) {
      const v = this.vib[i];
      const fr = fret != null ? fret : this.frets()[i];
      if (fr < 0) return;
      v.a0 = (0.5 + (vel || 0.8)) * 0.2;
      v.start = when != null ? when : this.o.clock();
      v.tau = 0.45 + (5 - i) * 0.09;
      v.from = fr;
      this._kick();
    }
    ring(string, fret, color) {
      this.fx.push({ string, fret, color: color || '#10B981', t0: performance.now() });
      this._kick();
    }
    _kick() { if (!this._raf) this._raf = requestAnimationFrame(() => { this._raf = 0; this.render(); }); }

    // ── Dynamic render ──────────────────────────────────────────
    render() {
      if (!this.L) return;
      const ctx = this.ctx, L = this.L;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.cv.width, this.cv.height);
      ctx.drawImage(this.static, 0, 0);
      this._localTransform(ctx);
      const tNow = this.o.clock();
      let moving = false;
      const u0 = L.nutU - L.nutW;
      const uEnd = L.Lc + 4;
      const fr = this.frets();
      for (let i = 0; i < 6; i++) {
        const v = this.vib[i];
        const dt = tNow - v.start;
        let A = 0;
        if (v.a0 > 0 && dt >= 0) {
          A = v.a0 * Math.exp(-dt / v.tau);
          if (A < 0.004) { v.a0 = 0; A = 0; } else moving = true;
        } else if (v.a0 > 0) moving = true;
        const fUse = A > 0 ? v.from : fr[i];
        const uf = fUse > 0 ? L.pos[Math.min(fUse, L.N)] : L.nutU;
        const sp = this._sp(L.nutU);
        const pts = [];
        const step = 9;
        v.ph += 2.1 + i * 0.13;
        const osc = Math.sin(v.ph);
        for (let u = u0; u <= uEnd; u += step) {
          let dv = 0;
          if (A > 0 && u > uf) dv = A * sp * Math.sin(Math.PI * (u - uf) / (L.bridgeU - uf)) * osc * 2.2;
          pts.push([u, this.sv(i, u) + dv]);
        }
        pts.push([uEnd, this.sv(i, uEnd)]);
        if (A > 0) {
          // motion blur envelope
          const env = [];
          for (let u = uf; u <= uEnd; u += step) env.push([u, this.sv(i, u), A * sp * 2.2 * Math.sin(Math.PI * (u - uf) / (L.bridgeU - uf))]);
          ctx.beginPath();
          env.forEach((p, k) => { if (k === 0) ctx.moveTo(p[0], p[1] - p[2]); else ctx.lineTo(p[0], p[1] - p[2]); });
          for (let k = env.length - 1; k >= 0; k--) ctx.lineTo(env[k][0], env[k][1] + env[k][2]);
          ctx.closePath();
          ctx.fillStyle = WOUND[i] ? 'rgba(230,190,120,0.22)' : 'rgba(235,240,248,0.25)';
          ctx.fill();
        }
        this._stringStroke(ctx, i, pts, fr[i] < 0 && !this.placed ? 0.75 : 1);
      }

      this._drawShapes(ctx);
      // feedback rings
      const nowMs = performance.now();
      this.fx = this.fx.filter(f => nowMs - f.t0 < 700);
      this.fx.forEach(f => {
        const k = (nowMs - f.t0) / 700;
        const [x, y] = this.toScreen(this.fretMid(f.fret), this.sv(f.string, this.fretMid(f.fret)));
        this._screenTransform(ctx);
        ctx.beginPath(); ctx.arc(x, y, 10 + k * 22, 0, Math.PI * 2);
        ctx.strokeStyle = f.color; ctx.globalAlpha = 1 - k; ctx.lineWidth = 3; ctx.stroke();
        ctx.globalAlpha = 1;
        this._localTransform(ctx);
        moving = true;
      });
      if (moving) this._kick();
    }

    _dot(ctx, string, fret, color, label, opts) {
      opts = opts || {};
      const L = this.L;
      const u = this.fretMid(fret);
      const v = this.sv(string, u);
      const fl = fret > 0 ? L.pos[fret] - L.pos[fret - 1] : 30;
      const r = Math.min(this._sp(u) * 0.5, fl * 0.36);
      const [x, y] = this.toScreen(u, v);
      this._screenTransform(ctx);
      ctx.save();
      if (opts.ghost) {
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.shadowColor = 'rgba(251,191,36,0.9)'; ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(251,191,36,0.28)'; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = opts.ghostColor || '#FDE68A'; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
        g.addColorStop(0, shade(color, 0.55)); g.addColorStop(0.45, color); g.addColorStop(1, shade(color, -0.35));
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6; ctx.stroke();
      }
      if (label) {
        ctx.fillStyle = opts.ghost ? '#fff' : '#ffffff';
        ctx.font = '800 ' + Math.round(r * 1.05) + 'px Nunito, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.strokeText(label, x, y + 1);
        ctx.fillText(label, x, y + 1);
      }
      ctx.restore();
      this._localTransform(ctx);
    }

    _barre(ctx, b, color, ghost) {
      const u = this.fretMid(b.fret);
      const fl = this.L.pos[b.fret] - this.L.pos[b.fret - 1];
      const r = Math.min(this._sp(u) * 0.5, fl * 0.36);
      const [x1, y1] = this.toScreen(u, this.sv(b.from, u));
      const [x2, y2] = this.toScreen(u, this.sv(b.to, u));
      this._screenTransform(ctx);
      ctx.save();
      ctx.lineCap = 'round';
      if (ghost) {
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = 'rgba(251,191,36,0.3)'; ctx.lineWidth = r * 1.5;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = '#FDE68A'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
        ctx.strokeStyle = shade(color, -0.3); ctx.lineWidth = r * 1.75;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = color; ctx.lineWidth = r * 1.45;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = r * 0.35;
        const hx = this.L.orient === 'h' ? -r * 0.35 : -r * 0.35;
        ctx.beginPath();
        if (this.L.orient === 'h') { ctx.moveTo(x1 + hx, y1); ctx.lineTo(x2 + hx, y2); }
        else { ctx.moveTo(x1, y1 + hx); ctx.lineTo(x2, y2 + hx); }
        ctx.stroke();
      }
      ctx.restore();
      this._localTransform(ctx);
    }

    _marker(ctx, string, kind) {
      const L = this.L;
      const u = L.nutU - L.nutW - 13;
      const v = this.sv(string, L.nutU);
      const [x, y] = this.toScreen(u, v);
      this._screenTransform(ctx);
      const r = Math.min(7, this._sp(L.nutU) * 0.3);
      ctx.save();
      if (kind === 'o') {
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 4.5; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.2; ctx.stroke();
      } else if (kind === 'x') {
        ctx.lineCap = 'round';
        const d = r * 0.85;
        [[-1, -1, 1, 1], [-1, 1, 1, -1]].forEach(([a, b, c, e]) => {
          ctx.beginPath(); ctx.moveTo(x + a * d, y + b * d); ctx.lineTo(x + c * d, y + e * d);
          ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 5; ctx.stroke();
          ctx.strokeStyle = '#FCA5A5'; ctx.lineWidth = 2.6; ctx.stroke();
        });
      }
      ctx.restore();
      this._localTransform(ctx);
    }

    _drawShapes(ctx) {
      const L = this.L;
      // marker strip
      const marks = this.markers || (this.chord ? this.chord.frets.map(f => f < 0 ? 'x' : (f === 0 ? 'o' : null)) : null);
      if (this.showMarkers && marks) {
        const u = L.nutU - L.nutW - 13;
        const v0 = this.sv(0, L.nutU) - 11, v1 = this.sv(5, L.nutU) + 11;
        ctx.fillStyle = 'rgba(15,8,4,0.55)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(u - 11, v0, 22, v1 - v0, 11); else ctx.rect(u - 11, v0, 22, v1 - v0);
        ctx.fill();
        marks.forEach((m, i) => { if (m) this._marker(ctx, i, m); });
      }
      if (this.ghost) {
        const gb = findBarre(this.ghost);
        if (gb) this._barre(ctx, gb, '#fff', true);
        this.ghost.frets.forEach((f, s) => {
          if (f > 0 && !(gb && f === gb.fret && s >= gb.from && s <= gb.to && this.ghost.fingers[s] === gb.finger)) {
            this._dot(ctx, s, f, '#fff', this.ghost.fingers ? String(this.ghost.fingers[s] || '') : '', { ghost: true });
          }
        });
      }
      if (this.chord && !this.placed) {
        const b = findBarre(this.chord);
        if (b) this._barre(ctx, b, FINGER_COL[b.finger] || '#2563EB', false);
        this.chord.frets.forEach((f, s) => {
          if (f <= 0) return;
          const fin = this.chord.fingers ? this.chord.fingers[s] : 0;
          if (b && f === b.fret && fin === b.finger && s >= b.from && s <= b.to) {
            if (s === b.from || s === b.to) this._dot(ctx, s, f, FINGER_COL[fin] || '#2563EB', String(fin));
            return;
          }
          this._dot(ctx, s, f, FINGER_COL[fin] || '#6D28D9', fin ? String(fin) : '');
        });
      }
      if (this.placed) {
        this.placed.forEach(p => {
          const col = p.state === 'good' ? '#059669' : (p.state === 'bad' ? '#DC2626' : '#6D28D9');
          this._dot(ctx, p.string, p.fret, col, p.label || '');
        });
      }
      if (this.highlight) {
        const h = this.highlight;
        if (h.fret > 0) this._dot(ctx, h.string, h.fret, '#6D28D9', h.label || '');
      }
      // string names at the far end
      this._screenTransform(ctx);
      ctx.font = '800 10px Nunito, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < 6; i++) {
        const u = L.Lc - 11;
        const [x, y] = this.toScreen(u, this.sv(i, u));
        ctx.fillStyle = 'rgba(30,18,8,0.55)';
        ctx.beginPath(); ctx.arc(x, y, 7.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff8e8';
        ctx.fillText(STRING_NAMES[i], x, y + 0.5);
      }
      this._localTransform(ctx);
    }

    // ── Hit testing + gestures ──────────────────────────────────
    hit(x, y) {
      const L = this.L;
      const [u, v] = this.toLocal(x, y);
      const zone = u < L.nutU - L.nutW - 26 ? 'head' :
        (u < L.nutU ? 'nut' : (u <= L.pos[L.N] ? 'fret' : (this.o.body ? 'body' : 'fret')));
      const sp = this._sp(u);
      const k = (v - L.vc) / sp + 2.5;
      let string = Math.round(k);
      if (Math.abs(k - string) > 0.62 || string < 0 || string > 5) string = (k > -0.9 && k < 5.9) ? clamp(Math.round(k), 0, 5) : -1;
      let fret = 0;
      if (zone === 'fret') { for (let n = 1; n <= L.N; n++) { if (u <= L.pos[n]) { fret = n; break; } } }
      return { zone, string, fret, u, v };
    }

    _bind() {
      const cv = this.cv;
      const pt = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener('pointerdown', (e) => {
        const [x, y] = pt(e);
        const h = this.hit(x, y);
        if (this.o.tapStrum) {
          // Game: start the strum where the finger lands.
          const dir = h.v < this.L.vc ? 'down' : 'up';
          this._emit('strum', dir, 0.85, e.timeStamp);
          e.preventDefault();
          return;
        }
        this._ptr = { id: e.pointerId, x, y, h, lastV: h.v, lastT: e.timeStamp, crossed: 0, dir: null, moved: 0 };
        if (h.zone === 'body') { try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
      });
      cv.addEventListener('pointermove', (e) => {
        const p = this._ptr;
        if (!p || p.id !== e.pointerId || p.h.zone !== 'body') return;
        const [x, y] = pt(e);
        const [u, v] = this.toLocal(x, y);
        p.moved = Math.max(p.moved, Math.hypot(x - p.x, y - p.y));
        const a = p.lastV, b = v;
        if (a === b) return;
        const dt = Math.max(1, e.timeStamp - p.lastT);
        const speed = Math.abs(b - a) / dt;
        const vel = clamp(0.45 + speed * 0.22, 0.4, 1);
        const down = b > a;
        const order = down ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
        order.forEach(i => {
          const sv = this.sv(i, u);
          if ((down && sv > a && sv <= b) || (!down && sv < a && sv >= b)) {
            if (p.crossed === 0) p.dir = down ? 'down' : 'up';
            p.crossed++;
            this._emit('strumString', i, vel, down ? 'down' : 'up', p.crossed === 1);
          }
        });
        p.lastV = b; p.lastT = e.timeStamp;
      });
      const end = (e) => {
        const p = this._ptr;
        if (!p || p.id !== e.pointerId) return;
        this._ptr = null;
        if (p.crossed > 0) { this._emit('strumEnd', p.dir, p.crossed); return; }
        if (p.moved > 14) return;
        const h = p.h;
        if (h.string < 0) { if (h.zone === 'body') this._emit('bodyTap'); return; }
        if (h.zone === 'nut') this._emit('nutTap', h.string);
        else if (h.zone === 'fret') this._emit('fretTap', h.string, h.fret);
        else if (h.zone === 'body') this._emit('pluck', h.string);
      };
      cv.addEventListener('pointerup', end);
      cv.addEventListener('pointercancel', (e) => { if (this._ptr && this._ptr.id === e.pointerId) this._ptr = null; });
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  CHORD LANE (scrolling chords + strum guide)
  // ════════════════════════════════════════════════════════════════
  class Lane {
    constructor(canvas) {
      this.cv = canvas; this.ctx = canvas.getContext('2d');
      this.bg = document.createElement('canvas');
      this.resize();
      if (window.ResizeObserver) { this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(canvas.parentElement); }
    }
    resize() {
      const W = Math.round(this.cv.parentElement.clientWidth);
      if (W < 40) return;
      const H = W < 560 ? 124 : 148;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.W = W; this.H = H; this.dpr = dpr;
      this.cv.style.height = H + 'px';
      this.cv.width = W * dpr; this.cv.height = H * dpr;
      this.bg.width = W * dpr; this.bg.height = H * dpr;
      const c = this.bg.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#2a170f'); g.addColorStop(0.5, '#43261a'); g.addColorStop(1, '#22120b');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      const R = rng(11);
      for (let i = 0; i < H * 0.9; i++) {
        const y = R() * H;
        c.strokeStyle = 'rgba(10,4,2,' + (0.1 + R() * 0.3).toFixed(2) + ')';
        c.lineWidth = 0.3 + R() * 1.2;
        c.beginPath(); c.moveTo(0, y);
        for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin(x * 0.01 + i) * 1.2);
        c.stroke();
      }
      // nickel rails
      [[0, 4], [H - 4, 4]].forEach(([y, h]) => {
        const rg = c.createLinearGradient(0, y, 0, y + h);
        rg.addColorStop(0, '#e5e7ea'); rg.addColorStop(0.5, '#9ca1a8'); rg.addColorStop(1, '#5b5f66');
        c.fillStyle = rg; c.fillRect(0, y, W, h);
      });
      this.render(this._last || null);
    }

    // st: {beat, segs:[{name,start,beats}], targets:[{beat,dir,res}], bpb, pxPerBeat, mode}
    render(st) {
      this._last = st;
      const c = this.ctx, W = this.W, H = this.H;
      if (!W) return;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.drawImage(this.bg, 0, 0);
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (!st) return;
      const ppb = st.pxPerBeat || clamp(W / 7, 54, 110);
      const nowX = Math.round(W * 0.24);
      const X = (b) => nowX + (b - st.beat) * ppb;
      // beat + bar lines (like frets)
      const first = Math.floor(st.beat - nowX / ppb) - 1, last = Math.ceil(st.beat + (W - nowX) / ppb) + 1;
      for (let b = first; b <= last; b++) {
        if (b < -st.bpb) continue;
        const x = X(b);
        const bar = ((b % st.bpb) + st.bpb) % st.bpb === 0;
        c.fillStyle = bar ? 'rgba(220,224,230,0.55)' : 'rgba(220,224,230,0.16)';
        c.fillRect(x - (bar ? 1.2 : 0.5), 6, bar ? 2.4 : 1, H - 12);
      }
      // chord tiles
      const tileTop = 12, tileH = H * 0.42;
      st.segs.forEach((s, idx) => {
        const x1 = X(s.start) + 3, x2 = X(s.start + s.beats) - 3;
        if (x2 < -20 || x1 > W + 20) return;
        const active = st.beat >= s.start && st.beat < s.start + s.beats;
        const past = st.beat >= s.start + s.beats;
        c.save();
        c.globalAlpha = past ? 0.45 : 1;
        c.shadowColor = active ? 'rgba(251,191,36,0.85)' : 'rgba(0,0,0,0.4)';
        c.shadowBlur = active ? 14 : 4; c.shadowOffsetY = active ? 0 : 2;
        const g = c.createLinearGradient(0, tileTop, 0, tileTop + tileH);
        g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#eadcbc');
        c.fillStyle = g;
        c.beginPath();
        if (c.roundRect) c.roundRect(x1, tileTop, Math.max(8, x2 - x1), tileH, 9); else c.rect(x1, tileTop, Math.max(8, x2 - x1), tileH);
        c.fill();
        c.shadowColor = 'transparent';
        c.lineWidth = active ? 3 : 1.2;
        c.strokeStyle = active ? '#F59E0B' : 'rgba(120,90,50,0.6)';
        c.stroke();
        c.fillStyle = '#2a1a10';
        c.font = '800 ' + Math.round(tileH * 0.52) + 'px "Baloo 2", Nunito, system-ui, sans-serif';
        c.textBaseline = 'middle'; c.textAlign = 'left';
        const tx = Math.max(x1 + 9, Math.min(nowX + 8, x2 - c.measureText(s.name).width - 9));
        c.fillText(s.name, past ? x1 + 9 : (active ? tx : x1 + 9), tileTop + tileH / 2 + 2);
        c.restore();
      });
      // strum targets
      const ay = tileTop + tileH + (H - tileTop - tileH - 6) / 2;
      st.targets.forEach(t => {
        const x = X(t.beat);
        if (x < -20 || x > W + 20) return;
        const col = t.res === 'perfect' ? '#FBBF24' : t.res === 'good' ? '#34D399' : t.res === 'miss' ? 'rgba(248,113,113,0.8)' : '#f6efe0';
        if (st.mode === 'chord') drawPickMarker(c, x, ay, Math.min(19, H * 0.16), col, t.dir);
        else drawArrow(c, x, ay, Math.min(17, H * 0.14), col, t.dir, t.accent);
      });
      // now line
      const ng = c.createLinearGradient(nowX - 8, 0, nowX + 8, 0);
      ng.addColorStop(0, 'rgba(251,191,36,0)'); ng.addColorStop(0.5, 'rgba(251,191,36,0.45)'); ng.addColorStop(1, 'rgba(251,191,36,0)');
      c.fillStyle = ng; c.fillRect(nowX - 8, 4, 16, H - 8);
      c.fillStyle = '#FBBF24'; c.fillRect(nowX - 1.5, 4, 3, H - 8);
    }
  }

  function drawArrow(c, x, y, s, col, dir, accent) {
    c.save();
    c.translate(x, y);
    if (dir === 'up') c.rotate(Math.PI);
    c.beginPath();
    c.moveTo(-s * 0.28, -s); c.lineTo(s * 0.28, -s); c.lineTo(s * 0.28, 0); c.lineTo(s * 0.7, 0);
    c.lineTo(0, s); c.lineTo(-s * 0.7, 0); c.lineTo(-s * 0.28, 0); c.closePath();
    c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 3; c.shadowOffsetY = 1;
    c.fillStyle = col; c.fill();
    c.shadowColor = 'transparent';
    c.strokeStyle = 'rgba(40,20,8,0.6)'; c.lineWidth = accent ? 2 : 1; c.stroke();
    c.restore();
  }

  function pickPath(c, s) {
    c.beginPath();
    c.moveTo(0, s * 1.05);
    c.bezierCurveTo(-s * 0.55, s * 0.45, -s * 1.05, -s * 0.2, -s * 0.85, -s * 0.72);
    c.bezierCurveTo(-s * 0.6, -s * 1.08, s * 0.6, -s * 1.08, s * 0.85, -s * 0.72);
    c.bezierCurveTo(s * 1.05, -s * 0.2, s * 0.55, s * 0.45, 0, s * 1.05);
    c.closePath();
  }
  function drawPickMarker(c, x, y, s, col, dir) {
    c.save(); c.translate(x, y);
    pickPath(c, s);
    c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 4; c.shadowOffsetY = 2;
    c.fillStyle = col; c.fill();
    c.shadowColor = 'transparent';
    c.strokeStyle = 'rgba(40,20,8,0.6)'; c.lineWidth = 1.2; c.stroke();
    c.restore();
    drawArrow(c, x, y, s * 0.5, 'rgba(60,35,15,0.85)', dir);
  }

  // ════════════════════════════════════════════════════════════════
  //  SVG pieces
  // ════════════════════════════════════════════════════════════════
  let _uid = 0;

  // Classic vertical chord box (nut on top, low E on the left).
  function chordBox(chord, opts) {
    opts = opts || {};
    const id = 'cb' + (++_uid);
    const frets = chord.frets, fingers = chord.fingers || [];
    const pressed = frets.filter(f => f > 0);
    const maxF = pressed.length ? Math.max.apply(null, pressed) : 1;
    const minF = pressed.length ? Math.min.apply(null, pressed) : 1;
    const base = maxF > 5 ? minF : 1;
    const W = 120, top = opts.title === false ? 22 : 40, x0 = 20, x1 = 100, rows = 5, rowH = 21;
    const H = top + rows * rowH + 10;
    const sx = (i) => x0 + i * (x1 - x0) / 5;
    let s = '<svg class="gj-chordbox" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (opts.label || (chord.name + ' chord diagram')) + '">';
    s += '<defs><linearGradient id="' + id + 'p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#f6efdf"/></linearGradient></defs>';
    s += '<rect x="2" y="2" width="' + (W - 4) + '" height="' + (H - 4) + '" rx="12" fill="url(#' + id + 'p)" stroke="#e4dcc8"/>';
    if (opts.title !== false) s += '<text x="' + (W / 2) + '" y="22" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="17" fill="#2a1a10">' + chord.name + '</text>';
    // frets
    for (let r = 0; r <= rows; r++) {
      const y = top + r * rowH;
      if (r === 0 && base === 1) s += '<rect x="' + (x0 - 1.5) + '" y="' + (y - 4.5) + '" width="' + (x1 - x0 + 3) + '" height="5" rx="1.5" fill="#2a1a10"/>';
      else s += '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="#8b8f96" stroke-width="1.4"/>';
    }
    if (base > 1) s += '<text x="' + (x1 + 6) + '" y="' + (top + rowH * 0.62) + '" font-family="Nunito" font-weight="800" font-size="10" fill="#6b6878">' + base + 'fr</text>';
    // strings (thicker bass)
    for (let i = 0; i < 6; i++) {
      const w = (2.3 - i * 0.3).toFixed(2);
      s += '<line x1="' + sx(i) + '" y1="' + top + '" x2="' + sx(i) + '" y2="' + (top + rows * rowH) + '" stroke="' + (i < 4 ? '#8a6a3c' : '#7c8189') + '" stroke-width="' + w + '"/>';
    }
    // O / X
    for (let i = 0; i < 6; i++) {
      const y = top - 11;
      if (frets[i] < 0) s += '<path d="M' + (sx(i) - 4) + ' ' + (y - 4) + 'l8 8m0 -8l-8 8" stroke="#B91C1C" stroke-width="2.2" stroke-linecap="round"/>';
      else if (frets[i] === 0) s += '<circle cx="' + sx(i) + '" cy="' + y + '" r="4.2" fill="none" stroke="#1c1b29" stroke-width="1.8"/>';
    }
    const b = findBarre(chord);
    if (b) {
      const y = top + (b.fret - base + 0.5) * rowH;
      s += '<rect x="' + (sx(b.from) - 8) + '" y="' + (y - 8) + '" width="' + (sx(b.to) - sx(b.from) + 16) + '" height="16" rx="8" fill="#1c1b29"/>';
      s += '<text x="' + ((sx(b.from) + sx(b.to)) / 2) + '" y="' + (y + 4) + '" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="11" fill="#fff">' + b.finger + '</text>';
    }
    for (let i = 0; i < 6; i++) {
      const f = frets[i];
      if (f <= 0) continue;
      if (b && f === b.fret && fingers[i] === b.finger && i >= b.from && i <= b.to) continue;
      const y = top + (f - base + 0.5) * rowH;
      s += '<circle cx="' + sx(i) + '" cy="' + y + '" r="8" fill="#1c1b29"/>';
      if (fingers[i] && opts.fingers !== false) s += '<text x="' + sx(i) + '" y="' + (y + 4) + '" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="11" fill="#fff">' + fingers[i] + '</text>';
    }
    // string names under the box
    if (opts.names !== false) {
      ['E', 'A', 'D', 'G', 'B', 'e'].forEach((n, i) => {
        s += '<text x="' + sx(i) + '" y="' + (top + rows * rowH + 9) + '" text-anchor="middle" font-family="Nunito" font-weight="700" font-size="7.5" fill="#8b8794">' + n + '</text>';
      });
    }
    s += '</svg>';
    return s;
  }

  // Analogue tuner meter. Needle group id: gj-needle (rotate ±45° = ±50 cents).
  function gauge() {
    const cx = 160, cy = 224, R = 148;
    const P = (c, r) => { const a = (c / 50) * 45 * Math.PI / 180; return [cx + r * Math.sin(a), cy - r * Math.cos(a)]; };
    let ticks = '';
    for (let c = -50; c <= 50; c += 2.5) {
      const major = c % 10 === 0, mid = c % 5 === 0;
      const [x1, y1] = P(c, R - (major ? 18 : mid ? 11 : 7));
      const [x2, y2] = P(c, R);
      ticks += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#2a2420" stroke-width="' + (major ? 2.2 : mid ? 1.3 : 0.8) + '" stroke-linecap="round"/>';
      if (c % 25 === 0) {
        const [lx, ly] = P(c, R + 13);
        ticks += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="11.5" fill="#3a332c">' + (c > 0 ? '+' + c : c) + '</text>';
      }
    }
    const arc = (c0, c1, r, col, w) => {
      const [x0, y0] = P(c0, r), [x1, y1] = P(c1, r);
      return '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" stroke="' + col + '" stroke-width="' + w + '" fill="none"/>';
    };
    const [nx, ny] = P(0, R - 8);
    return '' +
      '<svg class="gj-gauge" viewBox="0 0 320 256" role="img" aria-label="Tuner needle">' +
      '<defs>' +
      '<linearGradient id="gjBez" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5f68"/><stop offset="0.45" stop-color="#2a2d33"/><stop offset="1" stop-color="#121417"/></linearGradient>' +
      '<radialGradient id="gjFace" cx="0.5" cy="0.95" r="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="0.65" stop-color="#f6eed9"/><stop offset="1" stop-color="#e0d0aa"/></radialGradient>' +
      '<linearGradient id="gjGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.6"/><stop offset="0.6" stop-color="#fff" stop-opacity="0.06"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="gjCap" cx="0.35" cy="0.35" r="0.8"><stop offset="0" stop-color="#fff3c4"/><stop offset="0.5" stop-color="#c99a2e"/><stop offset="1" stop-color="#6b4a10"/></radialGradient>' +
      '<linearGradient id="gjLcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f1c16"/><stop offset="1" stop-color="#1d3328"/></linearGradient>' +
      '<filter id="gjSh" x="-30%" y="-10%" width="160%" height="120%"><feDropShadow dx="2" dy="3" stdDeviation="1.6" flood-opacity="0.35"/></filter>' +
      '<filter id="gjIn"><feGaussianBlur stdDeviation="3"/></filter>' +
      '</defs>' +
      '<rect x="3" y="3" width="314" height="250" rx="24" fill="url(#gjBez)"/>' +
      '<rect x="6" y="6" width="308" height="244" rx="22" fill="none" stroke="rgba(255,255,255,0.22)"/>' +
      '<rect x="18" y="18" width="284" height="220" rx="14" fill="url(#gjFace)"/>' +
      '<rect x="18" y="18" width="284" height="220" rx="14" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="6" filter="url(#gjIn)"/>' +
      '<rect x="18" y="18" width="284" height="220" rx="14" fill="none" stroke="#0c0d0f" stroke-width="2"/>' +
      arc(-50, -20, R - 3, '#F87171', 6) + arc(20, 50, R - 3, '#F87171', 6) +
      arc(-20, -5, R - 3, '#FBBF24', 6) + arc(5, 20, R - 3, '#FBBF24', 6) + arc(-5, 5, R - 3, '#10B981', 8) +
      ticks +
      '<text x="62" y="168" text-anchor="middle" font-family="Baloo 2, Nunito" font-weight="800" font-size="28" fill="#8a7d6c">♭</text>' +
      '<text x="258" y="168" text-anchor="middle" font-family="Baloo 2, Nunito" font-weight="800" font-size="28" fill="#8a7d6c">♯</text>' +
      '<text x="160" y="118" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="8.5" letter-spacing="1.5" fill="#9a8e7c">CENTS</text>' +
      '<rect x="30" y="184" width="88" height="42" rx="7" fill="url(#gjLcd)" stroke="#060807" stroke-width="2"/>' +
      '<text id="gj-gauge-note" x="74" y="214" text-anchor="middle" font-family="Baloo 2, Nunito" font-weight="800" font-size="26" fill="#86efac">—</text>' +
      '<circle id="gj-gauge-lamp" cx="214" cy="205" r="7" fill="#3f4a44" stroke="#111" stroke-width="1.5"/>' +
      '<text id="gj-gauge-hz" x="262" y="209" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="11.5" fill="#6b5f50"> </text>' +
      '<g id="gj-needle" style="transform-origin:' + cx + 'px ' + cy + 'px" filter="url(#gjSh)">' +
      '<path d="M' + (cx - 1.6) + ' ' + cy + ' L' + (nx - 0.5).toFixed(1) + ' ' + ny.toFixed(1) + ' L' + (nx + 0.5).toFixed(1) + ' ' + ny.toFixed(1) + ' L' + (cx + 1.6) + ' ' + cy + ' Z" fill="#B91C1C"/>' +
      '<path d="M' + (cx - 3) + ' ' + cy + ' L' + (cx + 3) + ' ' + cy + ' L' + (cx + 1.5) + ' ' + (cy + 10) + ' L' + (cx - 1.5) + ' ' + (cy + 10) + ' Z" fill="#1c1b29"/>' +
      '</g>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="12" fill="url(#gjCap)" stroke="#4a3308"/>' +
      '<path d="M22 22 Q160 2 298 22 L298 98 Q160 66 22 98 Z" fill="url(#gjGlass)"/>' +
      [[14, 14], [306, 14], [14, 242], [306, 242]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.2" fill="#9ca0a7" stroke="#2b2e33"/><path d="M' + (p[0] - 2.6) + ' ' + (p[1] + 1.2) + 'l5.2 -2.4" stroke="#2b2e33" stroke-width="1.2"/>').join('') +
      '</svg>';
  }

  // Tuner-tab headstock (front view, 3+3). Buttons are laid over it in HTML.
  function headstock() {
    const R = rng(3);
    let grain = '';
    for (let i = 0; i < 46; i++) {
      const x = 70 + R() * 160;
      grain += '<path d="M' + x.toFixed(1) + ' 20 C ' + (x + R() * 6 - 3).toFixed(1) + ' 120, ' + (x + R() * 6 - 3).toFixed(1) + ' 220, ' + (x + R() * 4 - 2).toFixed(1) + ' 340" stroke="rgba(10,4,2,' + (0.15 + R() * 0.3).toFixed(2) + ')" stroke-width="' + (0.4 + R()).toFixed(2) + '" fill="none"/>';
    }
    const posts = [[112, 250], [112, 170], [112, 90], [188, 90], [188, 170], [188, 250]];
    const nutX = (i) => 128 + i * 8.8;
    let strings = '';
    posts.forEach((p, i) => {
      const w = (2.6 - i * 0.36).toFixed(2);
      strings += '<line x1="' + nutX(i) + '" y1="344" x2="' + p[0] + '" y2="' + p[1] + '" stroke="' + (i < 4 ? '#b98a45' : '#c3c7cd') + '" stroke-width="' + w + '"/>';
    });
    let keys = '';
    posts.forEach((p) => {
      const left = p[0] < 150;
      const kx = left ? 36 : 264;
      keys += '<rect x="' + (left ? 50 : 232) + '" y="' + (p[1] - 4) + '" width="18" height="8" fill="#9aa0a8"/>';
      keys += '<ellipse cx="' + kx + '" cy="' + p[1] + '" rx="20" ry="14" fill="url(#hsKey)" stroke="#8d846c" filter="url(#hsSh)"/>';
    });
    let bush = '';
    posts.forEach(p => {
      bush += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="url(#hsBush)"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.2" fill="#8b9098" stroke="#fff" stroke-opacity="0.6"/>';
    });
    return '' +
      '<svg class="gj-headstock" viewBox="0 0 300 370" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="hsWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c0e07"/><stop offset="0.35" stop-color="#43261a"/><stop offset="0.6" stop-color="#4c2b1c"/><stop offset="1" stop-color="#1a0c06"/></linearGradient>' +
      '<radialGradient id="hsKey" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stop-color="#fffef8"/><stop offset="0.55" stop-color="#e6dfcb"/><stop offset="1" stop-color="#a99f86"/></radialGradient>' +
      '<radialGradient id="hsBush" cx="0.35" cy="0.35" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#c9cdd3"/><stop offset="1" stop-color="#5d6168"/></radialGradient>' +
      '<linearGradient id="hsNut" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6e8"/><stop offset="1" stop-color="#c9bc9a"/></linearGradient>' +
      '<clipPath id="hsClip"><path d="M70 30 Q78 12 104 14 Q132 16 150 30 Q168 16 196 14 Q222 12 230 30 L232 300 Q214 330 186 344 L114 344 Q86 330 68 300 Z"/></clipPath>' +
      '<filter id="hsSh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-opacity="0.35"/></filter>' +
      '</defs>' +
      keys +
      '<g filter="url(#hsSh)"><path d="M70 30 Q78 12 104 14 Q132 16 150 30 Q168 16 196 14 Q222 12 230 30 L232 300 Q214 330 186 344 L114 344 Q86 330 68 300 Z" fill="url(#hsWood)"/></g>' +
      '<g clip-path="url(#hsClip)">' + grain + '<rect x="60" y="10" width="90" height="340" fill="rgba(255,240,220,0.06)"/></g>' +
      '<path d="M140 300 Q150 284 160 300 L156 330 L144 330 Z" fill="#121212" stroke="rgba(255,255,255,0.3)"/>' +
      strings + bush +
      '<rect x="114" y="342" width="72" height="9" rx="2" fill="url(#hsNut)" stroke="#a89a78"/>' +
      '<rect x="112" y="351" width="76" height="16" fill="#3a2116"/>' +
      '</svg>';
  }

  function star(filled, size) {
    size = size || 34;
    return '<svg class="gj-star' + (filled ? ' on' : '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 2.6l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17l-5.6 3 1.1-6.3L2.9 9.3l6.3-.9z" fill="' + (filled ? '#F59E0B' : '#e6e1d6') + '" stroke="' + (filled ? '#B45309' : '#cfc8b8') + '" stroke-width="1.2" stroke-linejoin="round"/>' +
      (filled ? '<path d="M12 5.5l1.8 3.7" stroke="#fff3c4" stroke-width="1.3" stroke-linecap="round"/>' : '') +
      '</svg>';
  }
  function stars(n, of, size) {
    let s = '<span class="gj-stars" role="img" aria-label="' + n + ' of ' + (of || 3) + ' stars">';
    for (let i = 0; i < (of || 3); i++) s += star(i < n, size);
    return s + '</span>';
  }

  function pick(color, size, inner) {
    size = size || 40;
    return '<svg class="gj-pick" width="' + size + '" height="' + size + '" viewBox="-24 -24 48 48" aria-hidden="true">' +
      '<path d="M0 22 C-11 10 -22 -4 -18 -15 C-13 -23 13 -23 18 -15 C22 -4 11 10 0 22Z" fill="' + color + '" stroke="rgba(0,0,0,0.25)" stroke-width="1.5"/>' +
      '<path d="M-12 -14 C-6 -19 6 -19 12 -14" stroke="rgba(255,255,255,0.55)" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      (inner || '') + '</svg>';
  }

  const ICONS = {
    learn: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M5 7h14M9.7 3v18M14.3 3v18"/><circle cx="9.7" cy="11" r="1.6" fill="currentColor"/><circle cx="14.3" cy="14.5" r="1.6" fill="currentColor"/>',
    play: '<path d="M12 21C7 15 3.5 10 4.5 6 5.5 3 18.5 3 19.5 6 20.5 10 17 15 12 21Z"/><path d="M10.5 8.5v5l4-2.5z" fill="currentColor"/>',
    ear: '<path d="M8 9a4 4 0 1 1 8 0c0 2.6-2 3.4-2.8 5.2-.6 1.4-.8 3.8-3.2 3.8a2.5 2.5 0 0 1-2.5-2.5"/><path d="M10.5 9.5a1.5 1.5 0 0 1 3 0"/><path d="M18.5 5.5c1 1 1.6 2.3 1.6 3.7M20.5 3.5c1.5 1.6 2.3 3.6 2.3 5.7" stroke-linecap="round"/>',
    tuner: '<path d="M3.5 16a8.5 8.5 0 0 1 17 0"/><path d="M12 16l4-6" stroke-linecap="round"/><circle cx="12" cy="16" r="1.4" fill="currentColor"/><path d="M5.5 12.5l1.3.8M18.5 12.5l-1.3.8M12 7.5v1.5"/>',
    down: '<path d="M12 4v14M6 12l6 6 6-6"/>',
    up: '<path d="M12 20V6M6 12l6-6 6 6"/>',
    speaker: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" stroke-linecap="round"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V5.5a1.5 1.5 0 0 1 3 0V13c0 4-2.5 7-6 7-2.5 0-4-1.3-5.3-3.6L4 13.2a1.4 1.4 0 0 1 2.4-1.4L8 14"/>',
    arp: '<path d="M4 18l4-4 4 3 4-6 4-5"/><circle cx="4" cy="18" r="1.3" fill="currentColor"/><circle cx="12" cy="17" r="1.3" fill="currentColor"/><circle cx="20" cy="6" r="1.3" fill="currentColor"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" stroke-linecap="round"/>',
    back: '<path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/>',
    metro: '<path d="M8 21h8l-2.5-17h-3z"/><path d="M12 15l5-8" stroke-linecap="round"/><circle cx="17" cy="7" r="1.2" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/>',
    bulb: '<path d="M9 17h6M10 20.5h4M8.5 14.5C7 13.3 6 11.6 6 9.6a6 6 0 0 1 12 0c0 2-1 3.7-2.5 4.9-.6.5-1 1.1-1 1.9V17h-5v-.6c0-.8-.4-1.4-1-1.9z"/>',
    erase: '<path d="M4 16l9-9 7 7-6 6H8zM13 20h7" stroke-linejoin="round"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7L7 17M17 7l1.7-1.7" stroke-linecap="round"/>',
    moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>'
  };
  function icon(name, size) {
    size = size || 22;
    return '<svg class="gj-ico" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  // A small guitar for the header (body + neck + headstock).
  function logo(size) {
    size = size || 34;
    return '<svg class="gj-logo" width="' + size + '" height="' + size + '" viewBox="0 0 48 48" aria-hidden="true">' +
      '<defs><linearGradient id="lgB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2d39a"/><stop offset="0.7" stop-color="#d9a45a"/><stop offset="1" stop-color="#9a5d26"/></linearGradient></defs>' +
      '<g transform="rotate(-38 24 24)">' +
      '<rect x="22" y="2" width="4.5" height="24" rx="1" fill="#43261a"/>' +
      '<path d="M20.5 1.5h7.5l-.6 6h-6.3z" fill="#2a170f"/>' +
      '<path d="M24.2 22c-3.8 0-6.6 2.2-6.6 5.3 0 1.6.9 2.6.9 3.6 0 1.2-2.2 2.2-2.2 5.4 0 4.3 3.6 7.2 7.9 7.2s7.9-2.9 7.9-7.2c0-3.2-2.2-4.2-2.2-5.4 0-1 .9-2 .9-3.6 0-3.1-2.8-5.3-6.6-5.3z" fill="url(#lgB)" stroke="#7a4518" stroke-width="0.8"/>' +
      '<circle cx="24.2" cy="31" r="2.6" fill="#1a0e07" stroke="#f3e7cd" stroke-width="0.8"/>' +
      '<rect x="21" y="38" width="6.5" height="1.8" rx="0.6" fill="#2a170f"/>' +
      '</g></svg>';
  }

  return { Guitar, Lane, chordBox, gauge, headstock, star, stars, pick, icon, logo, findBarre, FINGER_COL, STRING_NAMES };
})();
