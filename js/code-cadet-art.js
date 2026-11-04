/* ================================================================
   CODE CADET — code-cadet-art.js
   Hand-drawn canvas art for the rover missions: an Atacama-style
   desert test site seen in a gentle 3/4 view (top-down ground, objects
   with real height), boulders, glowing star crystals, green sensor
   pads, the landing pad + beacon, and a six-wheeled rover with a mast
   camera, headlights and turning wheels.

   No images, no network: everything is drawn with canvas paths.

   API (window.CodeCadetArt):
     createBoard(canvas)  -> board
        board.setWorld(world, opts)   world = { tiles, w, h, rover, collected }
        board.fit(maxW, maxH)         pick a tile size and resize
        board.play(event, ms)         animate one step (move/turn/bump)
        board.celebrate() / board.sad()
        board.start() / board.stop()  animation loop on/off
     drawThumb(canvas, puzzle)        tiny map for the puzzle list
     icon(type)                       inline SVG string for a block
   ================================================================ */

const CodeCadetArt = (() => {
  'use strict';

  const SY = 0.78;            // ground depth squash (3/4 view)
  const TAU = Math.PI * 2;

  function reducedMotion() {
    try {
      if (document.documentElement.classList.contains('zs-a11y-reduce-motion')) return true;
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  // ── small math helpers ──
  function rng(seed) {
    let a = seed >>> 0;
    return function() {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function shade(rgb, k) {
    return 'rgb(' + Math.round(clamp(rgb[0] * k, 0, 255)) + ',' +
      Math.round(clamp(rgb[1] * k, 0, 255)) + ',' + Math.round(clamp(rgb[2] * k, 0, 255)) + ')';
  }
  function dirAngle(dir) { return (dir - 1) * Math.PI / 2; }   // 0=N … grid angle

  // Smooth closed path through points (midpoint quadratic curves).
  function smoothPath(ctx, pts) {
    const n = pts.length;
    ctx.beginPath();
    const m0x = (pts[n - 1][0] + pts[0][0]) / 2, m0y = (pts[n - 1][1] + pts[0][1]) / 2;
    ctx.moveTo(m0x, m0y);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    ctx.closePath();
  }
  function polyPath(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  // ── Geometry of one board ──
  function makeGeom(w, h, T) {
    const M = T * 0.62;              // side rim
    const MT = T * 1.0;              // top margin (rocks stick up)
    const MB = T * 0.55 * SY;        // bottom rim
    const CH = T * 0.42;             // cliff face
    return {
      w, h, T, M, MT, MB, CH,
      W: Math.ceil(w * T + 2 * M),
      H: Math.ceil(MT + h * T * SY + MB + CH + T * 0.12),
      cx: x => M + (x + 0.5) * T,
      cy: y => MT + (y + 0.5) * T * SY,
      top: MT - T * 0.42 * SY,                 // mesa top edge (screen y)
      bottom: MT + h * T * SY + MB             // mesa front edge
    };
  }

  // ── Palette ──
  const ROCK = { light: '#C99377', mid: '#93604A', dark: '#4F3026', deep: '#3A2119' };
  const SAND_TOP = '#E7B887', SAND_BOT = '#D49867';

  // ================================================================
  //  BOULDER
  // ================================================================
  function drawBoulder(ctx, x, y, r, hh, rnd) {
    // soft cast shadow (sun from the upper left)
    const sx = x + r * 0.45, sy = y + r * 0.1;
    const sg = ctx.createRadialGradient(sx, sy, r * 0.15, sx, sy, r * 1.35);
    sg.addColorStop(0, 'rgba(80,35,12,0.38)');
    sg.addColorStop(1, 'rgba(80,35,12,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.ellipse(sx, sy, r * 1.35, r * 1.35 * SY * 0.62, 0, 0, TAU); ctx.fill();

    // silhouette: an upper dome + front footprint arc, jittered
    const pts = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const phi = Math.PI * (1 - i / n);
      const j = 0.82 + rnd() * 0.3;
      pts.push([x + Math.cos(phi) * r * (0.9 + rnd() * 0.16),
                y - Math.sin(phi) * hh * j - r * SY * 0.18]);
    }
    for (let i = 1; i < 6; i++) {
      const th = Math.PI * i / 6;
      pts.push([x + Math.cos(th) * r * (0.92 + rnd() * 0.1), y + Math.sin(th) * r * SY * 0.5]);
    }
    const g = ctx.createLinearGradient(x - r * 0.7, y - hh, x + r * 0.8, y + r * 0.4);
    g.addColorStop(0, ROCK.light);
    g.addColorStop(0.45, ROCK.mid);
    g.addColorStop(1, ROCK.dark);
    smoothPath(ctx, pts);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = Math.max(1, r * 0.05);
    ctx.strokeStyle = 'rgba(50,25,15,0.55)';
    ctx.stroke();

    // lit facet on the upper left
    ctx.save();
    smoothPath(ctx, pts);
    ctx.clip();
    const fx = x - r * 0.3, fy = y - hh * 0.62;
    const fg = ctx.createRadialGradient(fx, fy, r * 0.05, fx, fy, r * 0.85);
    fg.addColorStop(0, 'rgba(255,226,196,0.55)');
    fg.addColorStop(1, 'rgba(255,226,196,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(x - r * 1.2, y - hh * 1.4, r * 2.4, hh * 1.6 + r);
    // shadow side
    const dg = ctx.createLinearGradient(x + r * 0.1, 0, x + r, 0);
    dg.addColorStop(0, 'rgba(40,18,10,0)');
    dg.addColorStop(1, 'rgba(40,18,10,0.35)');
    ctx.fillStyle = dg;
    ctx.fillRect(x, y - hh * 1.4, r * 1.2, hh * 1.6 + r);
    // facet edge + cracks
    ctx.strokeStyle = 'rgba(60,28,16,0.45)';
    ctx.lineWidth = Math.max(0.8, r * 0.035);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.75, y - hh * 0.25);
    ctx.quadraticCurveTo(x - r * 0.1, y - hh * 0.35 + rnd() * r * 0.2, x + r * 0.35, y - hh * 0.9);
    ctx.stroke();
    ctx.beginPath();
    const cx0 = x + (rnd() - 0.3) * r * 0.6;
    ctx.moveTo(cx0, y - hh * 0.55);
    ctx.lineTo(cx0 + r * 0.12, y - hh * 0.25);
    ctx.lineTo(cx0 + r * 0.05, y + r * 0.05);
    ctx.stroke();
    // specks
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,235,215,0.35)' : 'rgba(45,20,10,0.3)';
      ctx.beginPath();
      ctx.arc(x + (rnd() - 0.5) * r * 1.4, y - rnd() * hh * 0.9, Math.max(0.6, r * 0.03), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    // rim light along the top-left outline
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 5; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.strokeStyle = 'rgba(255,232,205,0.55)';
    ctx.lineWidth = Math.max(0.8, r * 0.05);
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // A '#' tile: one big boulder + a couple of small ones.
  function makeRockSprite(T, dpr, seed) {
    const c = document.createElement('canvas');
    const SW = T * 1.5, SH = T * 1.55;
    c.width = Math.ceil(SW * dpr); c.height = Math.ceil(SH * dpr);
    const ctx = ZsCanvas.get2d(c);
    if (!ctx) { ZsCanvas.release(c); return null; }
    ctx.scale(dpr, dpr);
    const rnd = rng(seed);
    const ox = SW / 2, oy = SH - T * 0.5;     // tile-centre anchor
    const rocks = [];
    const nSmall = 1 + Math.floor(rnd() * 2);
    for (let i = 0; i < nSmall; i++) {
      const a = rnd() * TAU;
      rocks.push({ x: Math.cos(a) * T * 0.3, y: Math.sin(a) * T * 0.26 * SY, r: T * (0.12 + rnd() * 0.08) });
    }
    rocks.push({ x: (rnd() - 0.5) * T * 0.1, y: T * 0.04 + (rnd() - 0.5) * T * 0.05, r: T * (0.37 + rnd() * 0.06), big: true });
    rocks.sort((a, b) => a.y - b.y);
    rocks.forEach(k => drawBoulder(ctx, ox + k.x, oy + k.y, k.r, k.r * (k.big ? 1.08 : 0.9), rnd));
    return { canvas: c, ox, oy, SW, SH };
  }

  // ================================================================
  //  CRYSTAL (a "star" tile)
  // ================================================================
  const SHARDS = [
    { dx: -0.2, ang: -0.48, len: 0.52, w: 0.17 },
    { dx: 0.19, ang: 0.42, len: 0.58, w: 0.16 },
    { dx: 0.0, ang: -0.06, len: 0.9, w: 0.24 },
    { dx: 0.08, ang: 0.22, len: 0.42, w: 0.14 },
    { dx: -0.09, ang: -0.2, len: 0.36, w: 0.12 }
  ];
  function drawCrystal(ctx, x, y, s, t, seed, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    const pulse = 0.72 + 0.28 * Math.sin(t * 2.3 + seed);
    // glow halo
    const gy = y - s * 0.35;
    const gg = ctx.createRadialGradient(x, gy, s * 0.05, x, gy, s * 1.05);
    gg.addColorStop(0, 'rgba(255,252,225,' + (0.85 * pulse).toFixed(3) + ')');
    gg.addColorStop(0.35, 'rgba(255,214,80,' + (0.45 * pulse).toFixed(3) + ')');
    gg.addColorStop(1, 'rgba(255,190,60,0)');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(x, gy, s * 1.05, 0, TAU); ctx.fill();
    // ground socket + reflected light
    ctx.fillStyle = 'rgba(90,45,10,0.35)';
    ctx.beginPath(); ctx.ellipse(x + s * 0.05, y + s * 0.03, s * 0.42, s * 0.42 * SY * 0.45, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,120,' + (0.35 * pulse).toFixed(3) + ')';
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.02, s * 0.62, s * 0.62 * SY * 0.4, 0, 0, TAU); ctx.fill();

    SHARDS.forEach((sh, i) => {
      const bx = x + sh.dx * s, by = y + (i > 2 ? 0.05 : 0) * s;
      const dx = Math.sin(sh.ang), dy = -Math.cos(sh.ang);
      const px = Math.cos(sh.ang), py = Math.sin(sh.ang);
      const L = sh.len * s, hw = sh.w * s / 2;
      const bl = [bx - px * hw, by - py * hw], br = [bx + px * hw, by + py * hw];
      const bc = [bx + px * hw * 0.18, by + py * hw * 0.18];
      const tl = [bl[0] + dx * L * 0.74, bl[1] + dy * L * 0.74];
      const tr = [br[0] + dx * L * 0.74, br[1] + dy * L * 0.74];
      const tc = [bc[0] + dx * L * 0.8, bc[1] + dy * L * 0.8];
      const tip = [bx + dx * L, by + dy * L];
      // left face
      let g = ctx.createLinearGradient(bl[0], bl[1], tl[0], tl[1]);
      g.addColorStop(0, '#F4B73A'); g.addColorStop(1, '#FFF4BF');
      ctx.fillStyle = g;
      polyPath(ctx, [bl, bc, tc, tl]); ctx.fill();
      // right face
      g = ctx.createLinearGradient(bc[0], bc[1], tr[0], tr[1]);
      g.addColorStop(0, '#9A5B07'); g.addColorStop(1, '#E3A322');
      ctx.fillStyle = g;
      polyPath(ctx, [bc, br, tr, tc]); ctx.fill();
      // tip facets
      ctx.fillStyle = '#FFFBE3'; polyPath(ctx, [tl, tc, tip]); ctx.fill();
      ctx.fillStyle = '#F0B52E'; polyPath(ctx, [tc, tr, tip]); ctx.fill();
      // outline + highlight
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(110,60,0,0.55)';
      ctx.lineWidth = Math.max(0.7, s * 0.025);
      polyPath(ctx, [bl, br, tr, tip, tl]); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(0.6, s * 0.02);
      ctx.beginPath(); ctx.moveTo(bl[0] + px * hw * 0.3, bl[1] + py * hw * 0.3);
      ctx.lineTo(tl[0] + px * hw * 0.3, tl[1] + py * hw * 0.3); ctx.stroke();
    });
    // twinkles
    for (let k = 0; k < 2; k++) {
      const tw = Math.max(0, Math.sin(t * 3.1 + seed * 1.7 + k * 2.4));
      if (tw < 0.2) continue;
      const sx = x + (k ? 0.28 : -0.22) * s, sy = y - (k ? 0.62 : 0.8) * s;
      const r = s * 0.16 * tw;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.95 * tw).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(sx, sy - r); ctx.quadraticCurveTo(sx, sy, sx + r, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy + r); ctx.quadraticCurveTo(sx, sy, sx - r, sy);
      ctx.quadraticCurveTo(sx, sy, sx, sy - r); ctx.fill();
    }
    ctx.restore();
  }

  // ================================================================
  //  GREEN SENSOR PAD ('g')
  // ================================================================
  function drawGreenPadBase(ctx, x, y, T) {
    const rx = T * 0.37, ry = rx * SY;
    // thickness
    ctx.fillStyle = '#3F4650';
    ctx.beginPath(); ctx.ellipse(x, y + T * 0.035, rx, ry, 0, 0, TAU); ctx.fill();
    // steel plate
    let g = ctx.createLinearGradient(x - rx, y - ry, x + rx, y + ry);
    g.addColorStop(0, '#D5DBE2'); g.addColorStop(0.5, '#8F99A5'); g.addColorStop(1, '#5D6672');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    // green glass
    g = ctx.createRadialGradient(x - rx * 0.2, y - ry * 0.3, rx * 0.05, x, y, rx * 0.75);
    g.addColorStop(0, '#BBF7D0'); g.addColorStop(0.35, '#34D399'); g.addColorStop(1, '#047857');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rx * 0.72, ry * 0.72, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(6,78,59,0.8)'; ctx.lineWidth = Math.max(1, T * 0.018);
    ctx.stroke();
    // solar cell grid on the glass
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y, rx * 0.7, ry * 0.7, 0, 0, TAU); ctx.clip();
    ctx.strokeStyle = 'rgba(220,255,235,0.35)'; ctx.lineWidth = Math.max(0.6, T * 0.01);
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(x + i * rx * 0.22, y - ry); ctx.lineTo(x + i * rx * 0.22, y + ry); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - rx, y + i * ry * 0.3); ctx.lineTo(x + rx, y + i * ry * 0.3); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(x - rx * 0.25, y - ry * 0.35, rx * 0.3, ry * 0.14, -0.25, 0, TAU); ctx.fill();
    ctx.restore();
    // bolts
    ctx.fillStyle = '#E5E7EB';
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * Math.PI / 2;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * rx * 0.86, y + Math.sin(a) * ry * 0.86, Math.max(0.8, T * 0.016), 0, TAU); ctx.fill();
    }
  }
  function drawGreenPadGlow(ctx, x, y, T, t) {
    const rx = T * 0.37, ry = rx * SY;
    const pulse = 0.6 + 0.4 * Math.sin(t * 2 + x * 0.05);
    const g = ctx.createRadialGradient(x, y, rx * 0.3, x, y, rx * 1.35);
    g.addColorStop(0, 'rgba(52,211,153,' + (0.35 * pulse).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(52,211,153,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, rx * 1.35, ry * 1.35, 0, 0, TAU); ctx.fill();
    // LEDs chasing round the rim
    const lit = Math.floor(t * 6) % 8;
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      const on = i === lit || i === (lit + 4) % 8;
      ctx.fillStyle = on ? '#ECFDF5' : 'rgba(16,185,129,0.85)';
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * rx * 0.86, y + Math.sin(a) * ry * 0.86, Math.max(0.9, T * (on ? 0.024 : 0.016)), 0, TAU); ctx.fill();
    }
  }

  // ================================================================
  //  LANDING PAD ('G') + beacon
  // ================================================================
  function drawGoalBase(ctx, x, y, T) {
    const r = T * 0.43;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#2B3038';
    ctx.beginPath(); ctx.ellipse(0, T * 0.04, r, r * SY, 0, 0, TAU); ctx.fill();
    ctx.scale(1, SY);
    // hazard ring
    const seg = 16;
    for (let i = 0; i < seg; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r, i * TAU / seg, (i + 1) * TAU / seg);
      ctx.arc(0, 0, r * 0.76, (i + 1) * TAU / seg, i * TAU / seg, true);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? '#1F2937' : '#FACC15';
      ctx.fill();
    }
    // inner pad
    let g = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.05, 0, 0, r * 0.76);
    g.addColorStop(0, '#A5F3FC'); g.addColorStop(0.45, '#22D3EE'); g.addColorStop(1, '#0E7490');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r * 0.74, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(1.2, T * 0.03);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.48, 0, TAU); ctx.stroke();
    // landing cross
    ctx.lineWidth = Math.max(1.5, T * 0.05); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.22, 0); ctx.lineTo(r * 0.22, 0); ctx.moveTo(0, -r * 0.22); ctx.lineTo(0, r * 0.22); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = Math.max(1, T * 0.015);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  function drawGoalPulse(ctx, x, y, T, t, party) {
    const r = T * 0.43;
    const n = party ? 3 : 1;
    for (let k = 0; k < n; k++) {
      const p = ((t * (party ? 1.4 : 0.6)) + k / n) % 1;
      ctx.strokeStyle = 'rgba(34,211,238,' + (0.7 * (1 - p)).toFixed(3) + ')';
      ctx.lineWidth = Math.max(1, T * 0.035 * (1 - p));
      ctx.beginPath(); ctx.ellipse(x, y, r * (0.85 + p * 0.55), r * SY * (0.85 + p * 0.55), 0, 0, TAU); ctx.stroke();
    }
  }
  function drawBeacon(ctx, x, y, T, t, party) {
    const bx = x + T * 0.3, by = y - T * 0.3 * SY;
    const top = by - T * 0.72;
    // pole shadow
    ctx.strokeStyle = 'rgba(70,30,10,0.25)'; ctx.lineWidth = Math.max(1, T * 0.03);
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + T * 0.35, by + T * 0.1); ctx.stroke();
    // foot
    ctx.fillStyle = '#374151';
    ctx.beginPath(); ctx.ellipse(bx, by, T * 0.06, T * 0.06 * SY, 0, 0, TAU); ctx.fill();
    // pole
    const pg = ctx.createLinearGradient(bx - T * 0.02, 0, bx + T * 0.02, 0);
    pg.addColorStop(0, '#F3F4F6'); pg.addColorStop(1, '#9CA3AF');
    ctx.strokeStyle = pg; ctx.lineWidth = Math.max(1.4, T * 0.035); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, top); ctx.stroke();
    // pennant (waves)
    const wave = Math.sin(t * 5) * T * 0.03;
    ctx.fillStyle = '#0891B2';
    ctx.beginPath();
    ctx.moveTo(bx, top + T * 0.08);
    ctx.quadraticCurveTo(bx + T * 0.16, top + T * 0.08 + wave, bx + T * 0.32, top + T * 0.15 + wave * 1.4);
    ctx.quadraticCurveTo(bx + T * 0.16, top + T * 0.2 - wave, bx, top + T * 0.26);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(bx + T * 0.1, top + T * 0.17 + wave * 0.5, T * 0.025, 0, TAU); ctx.fill();
    // lamp
    const blink = party ? (Math.floor(t * 8) % 2 === 0) : (Math.sin(t * 3) > 0);
    const lampC = party ? (Math.floor(t * 4) % 2 ? '#FDE047' : '#4ADE80') : '#22D3EE';
    if (blink) {
      const lg = ctx.createRadialGradient(bx, top, 0, bx, top, T * 0.32);
      lg.addColorStop(0, party ? 'rgba(253,224,71,0.75)' : 'rgba(34,211,238,0.6)');
      lg.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(bx, top, T * 0.32, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = blink ? '#ffffff' : lampC;
    ctx.beginPath(); ctx.arc(bx, top, T * 0.045, 0, TAU); ctx.fill();
    ctx.strokeStyle = lampC; ctx.lineWidth = Math.max(1, T * 0.02); ctx.stroke();
  }

  // ================================================================
  //  ROVER
  // ================================================================
  function rrPts(f0, f1, s0, s1, r) {
    const pts = [];
    const corners = [[f1 - r, s1 - r, 0], [f0 + r, s1 - r, 1], [f0 + r, s0 + r, 2], [f1 - r, s0 + r, 3]];
    corners.forEach(([cf, cs, q]) => {
      for (let i = 0; i <= 3; i++) {
        const a = (q + i / 3) * Math.PI / 2;
        pts.push([cf + Math.cos(a) * r, cs + Math.sin(a) * r]);
      }
    });
    return pts;
  }
  function areaSign(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return a >= 0 ? 1 : -1;
  }

  // Local frame: f = forward, s = to the rover's right, h = height (all in tiles).
  function makeProj(X, Y, T, a, lift) {
    const ca = Math.cos(a), sa = Math.sin(a);
    return {
      ca, sa,
      P(f, s, h) { return [X + T * (f * ca - s * sa), Y + T * (f * sa + s * ca) * SY - T * (h + lift)]; },
      gy(f, s) { return f * sa + s * ca; }
    };
  }
  function prism(ctx, pr, pts, h0, h1, rgb, topFill, band) {
    const o = areaSign(pts);
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      const ef = q[0] - p[0], es = q[1] - p[1];
      const ex = ef * pr.ca - es * pr.sa, ey = ef * pr.sa + es * pr.ca;
      let nx = ey * o, ny = -ex * o;
      if (ny <= 0.001) continue;
      const len = Math.hypot(nx, ny) || 1;
      const k = 0.62 + 0.3 * (-nx / len) + 0.08 * (ny / len);
      const a0 = pr.P(p[0], p[1], h0), a1 = pr.P(q[0], q[1], h0), b1 = pr.P(q[0], q[1], h1), b0 = pr.P(p[0], p[1], h1);
      ctx.fillStyle = shade(rgb, k);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 0.8;
      polyPath(ctx, [a0, a1, b1, b0]); ctx.fill(); ctx.stroke();
      if (band) {
        const c0 = pr.P(p[0], p[1], band[0]), c1 = pr.P(q[0], q[1], band[0]), d1 = pr.P(q[0], q[1], band[1]), d0 = pr.P(p[0], p[1], band[1]);
        ctx.fillStyle = shade(band[2], k * 1.05);
        polyPath(ctx, [c0, c1, d1, d0]); ctx.fill();
      }
    }
    const top = pts.map(p => pr.P(p[0], p[1], h1));
    ctx.fillStyle = topFill || shade(rgb, 1.05);
    polyPath(ctx, top); ctx.fill();
    return top;
  }

  function drawWheel(ctx, pr, T, fc, sc, r, wd, phase) {
    const discs = 5;
    const order = [];
    for (let k = 0; k < discs; k++) order.push(sc - wd / 2 + wd * k / (discs - 1));
    if (pr.ca < 0) order.reverse();                // near disc last
    const seg = 14;
    const side = Math.abs(pr.ca);
    order.forEach((s, k) => {
      const pts = [];
      for (let i = 0; i < seg; i++) {
        const th = i * TAU / seg;
        pts.push(pr.P(fc + Math.cos(th) * r, s, r + Math.sin(th) * r));
      }
      ctx.fillStyle = k === discs - 1 ? '#2A2D33' : '#18191C';
      ctx.strokeStyle = '#18191C';
      ctx.lineWidth = Math.max(1, T * 0.018);
      polyPath(ctx, pts); ctx.fill(); ctx.stroke();
      if (k === discs - 2) {
        // tread grooves that roll with the wheel (visible when heading N/S)
        ctx.strokeStyle = 'rgba(95,98,105,0.9)';
        ctx.lineWidth = Math.max(0.8, T * 0.012);
        for (let g = 0; g < 8; g++) {
          const th = phase + g * TAU / 8;
          if (Math.sin(th) < -0.2) continue;
          const f = fc + Math.cos(th) * r, h = r + Math.sin(th) * r;
          const A = pr.P(f, sc - wd / 2, h), B = pr.P(f, sc + wd / 2, h);
          ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
        }
      }
    });
    if (side > 0.25) {
      // rim, hub and spokes on the visible face
      const s = pr.ca < 0 ? order[order.length - 1] : order[order.length - 1];
      ctx.save();
      ctx.globalAlpha = clamp((side - 0.25) / 0.5, 0, 1);
      const rim = [];
      for (let i = 0; i < seg; i++) { const th = i * TAU / seg; rim.push(pr.P(fc + Math.cos(th) * r * 0.62, s, r + Math.sin(th) * r * 0.62)); }
      ctx.fillStyle = '#A7AFBB'; polyPath(ctx, rim); ctx.fill();
      ctx.strokeStyle = '#59616D'; ctx.lineWidth = Math.max(0.8, T * 0.014);
      for (let k = 0; k < 5; k++) {
        const th = phase + k * TAU / 5;
        const A = pr.P(fc + Math.cos(th) * r * 0.18, s, r + Math.sin(th) * r * 0.18);
        const B = pr.P(fc + Math.cos(th) * r * 0.58, s, r + Math.sin(th) * r * 0.58);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      }
      const hub = pr.P(fc, s, r);
      ctx.fillStyle = '#E5E7EB';
      ctx.beginPath(); ctx.arc(hub[0], hub[1], Math.max(1, T * r * 0.25), 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  function drawBogie(ctx, pr, T, s) {
    const A = pr.P(-0.22, s, 0.085), B = pr.P(0, s, 0.16), C = pr.P(0.22, s, 0.085), D = pr.P(0, s * 0.78, 0.2);
    ctx.strokeStyle = '#4B5563'; ctx.lineWidth = Math.max(1.4, T * 0.028); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(C[0], C[1]); ctx.moveTo(B[0], B[1]); ctx.lineTo(D[0], D[1]); ctx.stroke();
    ctx.fillStyle = '#9CA3AF';
    ctx.beginPath(); ctx.arc(B[0], B[1], Math.max(1, T * 0.02), 0, TAU); ctx.fill();
  }

  const BODY_RGB = [232, 237, 244];
  const CHASSIS_RGB = [64, 72, 86];

  // o: { a, wheel, lift, roll, headYaw, sway, lights, led, t }
  const ROVER_SCALE = 1.24;
  function drawRover(ctx, X, Y, T0, o) {
    const a = o.a;
    const T = T0 * ROVER_SCALE;
    ctx.save();
    if (o.roll) { ctx.translate(X, Y); ctx.rotate(o.roll); ctx.translate(-X, -Y); }
    const pr = makeProj(X, Y, T, a, o.lift || 0);
    const g0 = makeProj(X, Y, T, a, 0);

    // ground shadow (stays on the ground when hopping)
    const shK = 1 - clamp((o.lift || 0) * 2.5, 0, 0.5);
    const sh = ctx.createRadialGradient(X + T * 0.06, Y + T * 0.04, T * 0.05, X + T * 0.06, Y + T * 0.04, T * 0.48);
    sh.addColorStop(0, 'rgba(60,25,8,' + (0.42 * shK).toFixed(3) + ')');
    sh.addColorStop(1, 'rgba(60,25,8,0)');
    ctx.fillStyle = sh;
    ctx.beginPath(); ctx.ellipse(X + T * 0.06, Y + T * 0.04, T * 0.48, T * 0.48 * SY * 0.8, 0, 0, TAU); ctx.fill();

    // headlight beams on the ground
    if (o.lights) {
      const A = g0.P(0.3, -0.12, 0), B = g0.P(0.3, 0.12, 0), C = g0.P(1.0, 0.36, 0), D = g0.P(1.0, -0.36, 0);
      const M0 = g0.P(0.3, 0, 0), M1 = g0.P(1.0, 0, 0);
      const bg = ctx.createLinearGradient(M0[0], M0[1], M1[0], M1[1]);
      bg.addColorStop(0, 'rgba(255,250,215,0.5)');
      bg.addColorStop(1, 'rgba(255,250,215,0)');
      ctx.fillStyle = bg;
      polyPath(ctx, [A, B, C, D]); ctx.fill();
    }

    const farS = pr.ca >= 0 ? -1 : 1;     // the side further from the viewer
    const wheelsF = [-0.22, 0, 0.22];
    const phase = o.wheel || 0;
    // far wheels: draw back-to-front
    const farWheels = wheelsF.slice().sort((p, q) => pr.gy(p, farS * 0.25) - pr.gy(q, farS * 0.25));
    farWheels.forEach(f => drawWheel(ctx, pr, T, f, farS * 0.255, 0.085, 0.075, phase));
    drawBogie(ctx, pr, T, farS * 0.205);

    // chassis + body
    prism(ctx, pr, rrPts(-0.29, 0.29, -0.17, 0.17, 0.04), 0.1, 0.17, CHASSIS_RGB);
    const topG = (() => {
      const A = pr.P(-0.27, 0, 0.3), B = pr.P(0.26, 0, 0.3);
      const g = ctx.createLinearGradient(A[0], A[1] - T * 0.1, B[0], B[1] + T * 0.1);
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#D3DBE6');
      return g;
    })();
    prism(ctx, pr, rrPts(-0.27, 0.26, -0.2, 0.2, 0.06), 0.17, 0.3, BODY_RGB, topG, [0.205, 0.235, [8, 145, 178]]);
    // cyan trim along the deck edge
    ctx.strokeStyle = '#06B6D4'; ctx.lineWidth = Math.max(1.2, T * 0.022); ctx.lineJoin = 'round';
    polyPath(ctx, rrPts(-0.25, 0.24, -0.18, 0.18, 0.05).map(p => pr.P(p[0], p[1], 0.302))); ctx.stroke();
    // solar panel on the rear deck
    const sp = [[-0.24, -0.16], [-0.24, 0.16], [-0.02, 0.16], [-0.02, -0.16]].map(p => pr.P(p[0], p[1], 0.305));
    const spg = ctx.createLinearGradient(sp[0][0], sp[0][1], sp[2][0], sp[2][1]);
    spg.addColorStop(0, '#3B5BDB'); spg.addColorStop(1, '#1E2A78');
    ctx.fillStyle = spg; polyPath(ctx, sp); ctx.fill();
    ctx.strokeStyle = 'rgba(147,197,253,0.65)'; ctx.lineWidth = Math.max(0.6, T * 0.008);
    for (let i = 1; i < 4; i++) {
      const f = -0.24 + i * 0.055; const A = pr.P(f, -0.16, 0.306), B = pr.P(f, 0.16, 0.306);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      const s = -0.16 + i * 0.08; const A = pr.P(-0.24, s, 0.306), B = pr.P(-0.02, s, 0.306);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    }
    // sample box (orange) on the front deck
    prism(ctx, pr, rrPts(0.04, 0.17, 0.03, 0.16, 0.02), 0.3, 0.37, [245, 158, 11]);
    // headlights on the front edge
    [-0.12, 0.12].forEach(s => {
      const L = pr.P(0.255, s, 0.27);
      if (o.lights) {
        const lg = ctx.createRadialGradient(L[0], L[1], 0, L[0], L[1], T * 0.13);
        lg.addColorStop(0, 'rgba(255,248,200,0.95)'); lg.addColorStop(1, 'rgba(255,240,170,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(L[0], L[1], T * 0.13, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = o.lights ? '#FFFDF0' : '#CBD5E1';
      ctx.beginPath(); ctx.arc(L[0], L[1], Math.max(1.2, T * 0.03), 0, TAU); ctx.fill();
      ctx.strokeStyle = '#64748B'; ctx.lineWidth = Math.max(0.6, T * 0.01); ctx.stroke();
    });
    // status LED
    const ledP = pr.P(-0.2, 0.13, 0.31);
    ctx.fillStyle = o.led || '#22D3EE';
    ctx.beginPath(); ctx.arc(ledP[0], ledP[1], Math.max(1, T * 0.02), 0, TAU); ctx.fill();

    // near side
    drawBogie(ctx, pr, T, -farS * 0.205);
    const nearWheels = wheelsF.slice().sort((p, q) => pr.gy(p, -farS * 0.25) - pr.gy(q, -farS * 0.25));
    nearWheels.forEach(f => drawWheel(ctx, pr, T, f, -farS * 0.255, 0.085, 0.075, phase));

    // antenna (sways)
    const AB = pr.P(-0.2, -0.13, 0.3);
    const AT = pr.P(-0.2 - (o.sway || 0), -0.13, 0.66);
    ctx.strokeStyle = '#6B7280'; ctx.lineWidth = Math.max(0.8, T * 0.012);
    ctx.beginPath(); ctx.moveTo(AB[0], AB[1]); ctx.quadraticCurveTo(AB[0], (AB[1] + AT[1]) / 2, AT[0], AT[1]); ctx.stroke();
    ctx.fillStyle = '#EF4444';
    ctx.beginPath(); ctx.arc(AT[0], AT[1], Math.max(1.2, T * 0.025), 0, TAU); ctx.fill();

    // mast + camera head
    const MB = pr.P(0.13, -0.09, 0.3), MTp = pr.P(0.13, -0.09, 0.58);
    const mg = ctx.createLinearGradient(MB[0] - T * 0.03, 0, MB[0] + T * 0.03, 0);
    mg.addColorStop(0, '#F8FAFC'); mg.addColorStop(1, '#94A3B8');
    ctx.strokeStyle = mg; ctx.lineWidth = Math.max(1.6, T * 0.04); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(MB[0], MB[1]); ctx.lineTo(MTp[0], MTp[1]); ctx.stroke();
    ctx.fillStyle = '#64748B';
    ctx.beginPath(); ctx.ellipse(MB[0], MB[1], T * 0.035, T * 0.035 * SY, 0, 0, TAU); ctx.fill();
    // head uses its own yaw, centred on the mast top
    const ha = a + (o.headYaw || 0);
    const hX = MTp[0], hY = MTp[1] + T * (0.58 + (o.lift || 0));
    const hp = makeProj(hX, hY, T, ha, o.lift || 0);
    const headPts = rrPts(-0.07, 0.08, -0.1, 0.1, 0.025);
    prism(ctx, hp, headPts, 0.56, 0.66, [226, 232, 240]);
    // stereo cameras: on the front face when it faces us, plus lens tops
    const frontVisible = hp.sa > 0.15;
    [-0.05, 0.05].forEach(s => {
      if (frontVisible) {
        const c = hp.P(0.08, s, 0.61);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath(); ctx.ellipse(c[0], c[1], T * 0.028, T * 0.028 * clamp(hp.sa, 0.3, 1) + T * 0.01, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#7DD3FC';
        ctx.beginPath(); ctx.arc(c[0] - T * 0.008, c[1] - T * 0.008, Math.max(0.6, T * 0.009), 0, TAU); ctx.fill();
      }
      const c2 = hp.P(0.06, s, 0.662);
      ctx.fillStyle = '#1E293B';
      ctx.beginPath(); ctx.arc(c2[0], c2[1], Math.max(1, T * 0.022), 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(125,211,252,0.9)';
      ctx.beginPath(); ctx.arc(c2[0] - T * 0.006, c2[1] - T * 0.006, Math.max(0.5, T * 0.007), 0, TAU); ctx.fill();
    });
    ctx.restore();
  }

  // ================================================================
  //  GROUND (cached per puzzle + size)
  // ================================================================
  function paintGround(ctx, G, world, seed) {
    const rnd = rng(seed);
    const { T, W, M, MT, h, w } = G;
    const x0 = M * 0.2, x1 = W - M * 0.2;
    const yT = G.top, yB = G.bottom;
    const rad = T * 0.35;

    // floating-mesa shadow
    const shg = ctx.createRadialGradient(W / 2, yB + G.CH, T * 0.5, W / 2, yB + G.CH, W * 0.55);
    shg.addColorStop(0, 'rgba(120,70,30,0.22)'); shg.addColorStop(1, 'rgba(120,70,30,0)');
    ctx.fillStyle = shg;
    ctx.beginPath(); ctx.ellipse(W / 2, yB + G.CH * 0.95, W * 0.52, T * 0.32, 0, 0, TAU); ctx.fill();

    // cliff face with strata
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, yB - rad);
    ctx.lineTo(x0, yB + G.CH - rad * 0.6);
    ctx.quadraticCurveTo(x0, yB + G.CH, x0 + rad, yB + G.CH);
    ctx.lineTo(x1 - rad, yB + G.CH);
    ctx.quadraticCurveTo(x1, yB + G.CH, x1, yB + G.CH - rad * 0.6);
    ctx.lineTo(x1, yB - rad);
    ctx.closePath();
    const cg = ctx.createLinearGradient(0, yB, 0, yB + G.CH);
    cg.addColorStop(0, '#B8754A'); cg.addColorStop(1, '#7E4528');
    ctx.fillStyle = cg; ctx.fill();
    ctx.clip();
    for (let i = 0; i < 5; i++) {
      const yy = yB + G.CH * (0.15 + i * 0.18) + rnd() * 3;
      ctx.strokeStyle = i % 2 ? 'rgba(255,214,170,0.18)' : 'rgba(70,30,12,0.22)';
      ctx.lineWidth = Math.max(1, T * (0.03 + rnd() * 0.04));
      ctx.beginPath(); ctx.moveTo(x0, yy);
      for (let xx = x0; xx <= x1; xx += T * 0.5) ctx.lineTo(xx, yy + Math.sin(xx * 0.07 + i) * T * 0.03);
      ctx.stroke();
    }
    // vertical erosion streaks
    for (let i = 0; i < w * 2; i++) {
      const xx = x0 + rnd() * (x1 - x0);
      ctx.strokeStyle = 'rgba(60,25,10,0.16)'; ctx.lineWidth = Math.max(1, T * 0.02);
      ctx.beginPath(); ctx.moveTo(xx, yB); ctx.lineTo(xx + (rnd() - 0.5) * T * 0.1, yB + G.CH * (0.4 + rnd() * 0.6)); ctx.stroke();
    }
    ctx.restore();

    // mesa top
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0 + rad, yT);
    ctx.lineTo(x1 - rad, yT); ctx.quadraticCurveTo(x1, yT, x1, yT + rad);
    ctx.lineTo(x1, yB); ctx.lineTo(x0, yB); ctx.lineTo(x0, yT + rad);
    ctx.quadraticCurveTo(x0, yT, x0 + rad, yT);
    ctx.closePath();
    const gg = ctx.createLinearGradient(0, yT, 0, yB);
    gg.addColorStop(0, SAND_TOP); gg.addColorStop(1, SAND_BOT);
    ctx.fillStyle = gg; ctx.fill();
    ctx.clip();

    // big soft colour variation
    const blobs = Math.round((w * h) * 1.4 + 20);
    for (let i = 0; i < blobs; i++) {
      const bx = x0 + rnd() * (x1 - x0), by = yT + rnd() * (yB - yT);
      const r = T * (0.5 + rnd() * 1.6);
      const light = rnd() < 0.5;
      const bg = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      bg.addColorStop(0, light ? 'rgba(255,226,190,0.22)' : 'rgba(165,88,48,0.16)');
      bg.addColorStop(1, light ? 'rgba(255,226,190,0)' : 'rgba(165,88,48,0)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.ellipse(bx, by, r, r * SY, 0, 0, TAU); ctx.fill();
    }
    // grain
    const grains = Math.round((x1 - x0) * (yB - yT) / 55);
    for (let i = 0; i < grains; i++) {
      const gx = x0 + rnd() * (x1 - x0), gy = yT + rnd() * (yB - yT);
      ctx.fillStyle = rnd() < 0.55 ? 'rgba(110,50,20,' + (0.06 + rnd() * 0.1).toFixed(3) + ')' : 'rgba(255,240,215,' + (0.1 + rnd() * 0.15).toFixed(3) + ')';
      ctx.fillRect(gx, gy, 1 + rnd() * 1.2, 1 + rnd() * 1.2);
    }
    // wind ripples
    const ripples = Math.round(w * h * 0.6 + 6);
    for (let i = 0; i < ripples; i++) {
      const rx = x0 + rnd() * (x1 - x0), ry = yT + rnd() * (yB - yT);
      const len = T * (0.6 + rnd() * 1.1);
      const lines = 2 + Math.floor(rnd() * 3);
      for (let k = 0; k < lines; k++) {
        const oy = k * T * 0.09;
        ctx.beginPath();
        for (let s = 0; s <= 10; s++) {
          const px = rx + (s / 10 - 0.5) * len, py = ry + oy + Math.sin(s / 10 * Math.PI * 2 + k) * T * 0.025 - (s / 10) * T * 0.1;
          if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(255,236,206,0.38)'; ctx.lineWidth = Math.max(0.8, T * 0.018); ctx.stroke();
        ctx.translate(0, 1.2);
        ctx.strokeStyle = 'rgba(140,70,35,0.2)'; ctx.stroke();
        ctx.translate(0, -1.2);
      }
    }
    // little craters (decor, faint so they never read as obstacles)
    const craters = Math.max(2, Math.round(w * h / 9));
    for (let i = 0; i < craters; i++) {
      const cx = x0 + rnd() * (x1 - x0), cy = yT + rnd() * (yB - yT);
      const r = T * (0.12 + rnd() * 0.16);
      ctx.fillStyle = 'rgba(255,232,200,0.35)';
      ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.12, r * 1.1, r * SY * 1.0, 0, 0, TAU); ctx.fill();
      const crg = ctx.createLinearGradient(0, cy - r * SY, 0, cy + r * SY);
      crg.addColorStop(0, 'rgba(120,58,28,0.32)'); crg.addColorStop(1, 'rgba(120,58,28,0.04)');
      ctx.fillStyle = crg;
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r * SY * 0.85, 0, 0, TAU); ctx.fill();
    }
    // pebbles
    const pebbles = Math.round(w * h * 3 + 20);
    for (let i = 0; i < pebbles; i++) {
      const px = x0 + rnd() * (x1 - x0), py = yT + rnd() * (yB - yT);
      const r = Math.max(0.8, T * (0.012 + rnd() * 0.03));
      ctx.fillStyle = 'rgba(95,48,26,0.55)';
      ctx.beginPath(); ctx.ellipse(px + r * 0.3, py + r * 0.3, r * 1.1, r * 0.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = rnd() < 0.5 ? '#9C6447' : '#7E5040';
      ctx.beginPath(); ctx.ellipse(px, py, r, r * 0.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,225,195,0.5)';
      ctx.beginPath(); ctx.arc(px - r * 0.3, py - r * 0.3, r * 0.35, 0, TAU); ctx.fill();
    }

    // survey grid
    const gx0 = M, gy0 = MT, gw = w * T, gh = h * T * SY;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,240,220,0.08)';
        ctx.fillRect(gx0 + x * T, gy0 + y * T * SY, T, T * SY);
      }
    }
    ctx.strokeStyle = 'rgba(110,52,22,0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([Math.max(2, T * 0.08), Math.max(2, T * 0.06)]);
    ctx.beginPath();
    for (let x = 0; x <= w; x++) { ctx.moveTo(gx0 + x * T + 0.5, gy0); ctx.lineTo(gx0 + x * T + 0.5, gy0 + gh); }
    for (let y = 0; y <= h; y++) { ctx.moveTo(gx0, gy0 + y * T * SY + 0.5); ctx.lineTo(gx0 + gw, gy0 + y * T * SY + 0.5); }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,246,230,0.6)';
    ctx.lineWidth = Math.max(1, T * 0.02);
    for (let y = 0; y <= h; y++) for (let x = 0; x <= w; x++) {
      const px = gx0 + x * T, py = gy0 + y * T * SY, k = T * 0.06;
      ctx.beginPath(); ctx.moveTo(px - k, py); ctx.lineTo(px + k, py); ctx.moveTo(px, py - k * SY); ctx.lineTo(px, py + k * SY); ctx.stroke();
    }

    // pads drawn flat into the ground
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = world.tiles[y][x];
      if (t === 'g') drawGreenPadBase(ctx, G.cx(x), G.cy(y), T);
      else if (t === 'G') drawGoalBase(ctx, G.cx(x), G.cy(y), T);
    }
    // front edge highlight of the mesa
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,230,200,0.7)'; ctx.lineWidth = Math.max(1, T * 0.025);
    ctx.beginPath(); ctx.moveTo(x0 + 2, yB); ctx.lineTo(x1 - 2, yB); ctx.stroke();
  }

  // Boulders on the rim around the grid: back ones go in the ground
  // cache, front ones in an overlay drawn after the rover.
  function paintRim(back, front, G, seed) {
    const rnd = rng(seed ^ 0x9e3779b9);
    const { T, M, MT, w, h } = G;
    const items = [];
    const gx0 = M, gx1 = M + w * T, gy0 = MT, gy1 = MT + h * T * SY;
    const step = T * 0.42;
    for (let x = gx0 - M * 0.4; x <= gx1 + M * 0.4; x += step * (0.7 + rnd() * 0.6)) {
      items.push({ x: x, y: gy0 - T * 0.2 * SY - rnd() * T * 0.12, r: T * (0.1 + rnd() * 0.14), back: true });
      items.push({ x: x + rnd() * 4, y: gy1 + T * 0.24 * SY + rnd() * T * 0.08, r: T * (0.07 + rnd() * 0.09), back: false });
    }
    for (let y = gy0; y <= gy1; y += step * SY * (0.8 + rnd() * 0.6)) {
      items.push({ x: gx0 - M * 0.52 + rnd() * 2, y: y, r: T * (0.08 + rnd() * 0.12), back: true });
      items.push({ x: gx1 + M * 0.52 - rnd() * 2, y: y, r: T * (0.08 + rnd() * 0.12), back: true });
    }
    items.sort((a, b) => a.y - b.y);
    items.forEach(it => drawBoulder(it.back ? back : front, it.x, it.y, it.r, it.r * (0.8 + rnd() * 0.5), rnd));
  }

  // ================================================================
  //  BOARD
  // ================================================================
  function createBoard(canvas) {
    let ctx = ZsCanvas.get2d(canvas);
    const B = {
      world: null, G: null, dpr: 1, seed: 1,
      ground: null, front: null, tracks: null, rocks: {},
      disp: { x: 0, y: 0, a: 0, wheel: 0, lift: 0, roll: 0, fo: 0, headYaw: 0, sway: 0 },
      anim: null, queue: [], parts: [], hidden: {}, party: 0, sadT: 0,
      running: false, raf: 0, last: 0, shake: 0, lights: true, led: '#22D3EE',
      lastStamp: null, idle: true
    };

    function build() {
      if (!B.world || !B.G) return;
      const G = B.G, dpr = B.dpr;
      canvas.width = Math.round(G.W * dpr);
      canvas.height = Math.round(G.H * dpr);
      canvas.style.width = G.W + 'px';
      canvas.style.height = G.H + 'px';
      ctx = ZsCanvas.get2d(canvas);
      // The offscreen layers are reused (resizing clears them) and the old
      // rock sprites are released, so screen after screen does not pile up
      // canvas memory (iPad Safari has one budget for all canvases).
      const mk = (c) => {
        c = c || document.createElement('canvas');
        c.width = canvas.width; c.height = canvas.height;
        const x = ZsCanvas.get2d(c);
        if (x) x.setTransform(dpr, 0, 0, dpr, 0, 0);
        return [c, x];
      };
      Object.keys(B.rocks).forEach(k => { if (B.rocks[k]) ZsCanvas.release(B.rocks[k].canvas); });
      B.rocks = {};
      const [gc, gctx] = mk(B.ground);
      const [fc, fctx] = mk(B.front);
      if (gctx && fctx) {
        paintGround(gctx, G, B.world, B.seed);
        paintRim(gctx, fctx, G, B.seed);
      }
      B.ground = gc; B.front = fc;
      const [tc] = mk(B.tracks);
      B.tracks = tc;
      for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
        if (B.world.tiles[y][x] === '#') B.rocks[x + ',' + y] = makeRockSprite(G.T, dpr, B.seed + x * 131 + y * 977);
      }
      B.lastStamp = null;
      draw(performance.now());
    }

    B.setWorld = function(world, opts) {
      opts = opts || {};
      B.world = world;
      if (opts.seedKey) B.seed = hashStr(String(opts.seedKey));
      B.hidden = {};
      Object.keys(world.collected || {}).forEach(k => { B.hidden[k] = true; });
      const r = world.rover;
      B.disp = { x: r.x, y: r.y, a: dirAngle(r.dir), wheel: 0, lift: 0, roll: 0, fo: 0, headYaw: 0, sway: 0 };
      B.anim = null; B.queue = []; B.parts = []; B.party = 0; B.sadT = 0; B.led = '#22D3EE';
      if (opts.rebuild !== false || !B.G || B.G.w !== world.w || B.G.h !== world.h) {
        B.G = makeGeom(world.w, world.h, B.G ? B.G.T : 48);
        build();
      } else {
        // same terrain: just wipe the tracks
        const tx = B.tracks && ZsCanvas.get2d(B.tracks);
        if (tx) { tx.save(); tx.setTransform(1, 0, 0, 1, 0, 0); tx.clearRect(0, 0, B.tracks.width, B.tracks.height); tx.restore(); }
        B.lastStamp = null;
        draw(performance.now());
      }
    };

    // Reset to a fresh copy of the same puzzle (keeps the terrain cache).
    B.reset = function(world) { B.setWorld(world, { rebuild: false }); };

    B.fit = function(maxW, maxH) {
      if (!B.world) return;
      const w = B.world.w, h = B.world.h;
      const byW = maxW / (w + 1.24);
      const byH = maxH ? maxH / (h * SY + 1.0 + 0.55 * SY + 0.54) : 999;
      const T = Math.floor(clamp(Math.min(byW, byH, 84), 22, 84));
      const dpr = Math.max(1, ZsCanvas.dpr());
      if (B.G && B.G.T === T && B.dpr === dpr && canvas.width) return;
      B.dpr = dpr;
      B.G = makeGeom(w, h, T);
      build();
    };

    // ── animation ──
    function finishAnim() {
      const an = B.anim;
      if (!an) return;
      const d = B.disp;
      if (an.kind === 'move') { d.x = an.to.x; d.y = an.to.y; d.wheel = an.w1; stampTracks(); if (an.collect && !B.hidden[an.collect]) collectFx(an.collect); }
      if (an.kind === 'turn') d.a = an.a1;
      d.fo = 0; d.roll = 0; d.sway = 0;
      if (an.kind !== 'party') d.lift = 0;
      B.anim = null;
    }
    B.play = function(ev, ms) {
      finishAnim();
      const now = performance.now();
      const d = B.disp;
      const dur = reducedMotion() ? Math.min(ms, 90) : ms;
      if (ev.kind === 'move') {
        const dist = Math.hypot(ev.to.x - d.x, ev.to.y - d.y);
        B.anim = { kind: 'move', t0: now, dur, from: { x: d.x, y: d.y }, to: ev.to, w0: d.wheel, w1: d.wheel + dist / 0.085, collect: ev.collect || null };
      } else if (ev.kind === 'turn') {
        const a1 = d.a + (ev.left ? -Math.PI / 2 : Math.PI / 2);
        B.anim = { kind: 'turn', t0: now, dur, a0: d.a, a1, w0: d.wheel };
      } else if (ev.kind === 'bump') {
        B.anim = { kind: 'bump', t0: now, dur: Math.max(dur, 380), hit: false };
      }
      kick();
    };
    B.celebrate = function() {
      finishAnim();
      B.party = performance.now();
      B.anim = { kind: 'party', t0: performance.now(), dur: 1500 };
      B.led = '#4ADE80';
      const G = B.G;
      const X = G.cx(B.disp.x), Y = G.cy(B.disp.y);
      const cols = ['#22D3EE', '#FACC15', '#F97316', '#4ADE80', '#A78BFA', '#F472B6'];
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * TAU, v = G.T * (1.5 + Math.random() * 3.5);
        B.parts.push({ type: 'confetti', x: X, y: Y - G.T * 0.4, vx: Math.cos(a) * v * 0.7, vy: -Math.abs(Math.sin(a)) * v - G.T * 1.5,
          life: 1.6 + Math.random() * 0.8, age: 0, c: cols[i % cols.length], rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, s: G.T * (0.05 + Math.random() * 0.05) });
      }
      kick();
    };
    B.sad = function() {
      finishAnim();
      B.anim = { kind: 'sad', t0: performance.now(), dur: 900 };
      B.led = '#F97316';
      kick();
    };
    B.setRunning = function(on) { B.led = on ? '#4ADE80' : '#22D3EE'; kick(); };

    function collectFx(key) {
      B.hidden[key] = true;
      const [xs, ys] = key.slice(2).split('_');
      const G = B.G, X = G.cx(+xs), Y = G.cy(+ys) - G.T * 0.3;
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * TAU, v = G.T * (0.8 + Math.random() * 1.6);
        B.parts.push({ type: 'spark', x: X, y: Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - G.T * 0.6, life: 0.7 + Math.random() * 0.4, age: 0, s: G.T * (0.03 + Math.random() * 0.03) });
      }
      B.parts.push({ type: 'gem', x: X, y: Y + G.T * 0.3, vx: 0, vy: -G.T * 1.6, life: 0.8, age: 0, s: G.T * 0.5 });
    }
    function dust(X, Y, n) {
      const G = B.G;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        B.parts.push({ type: 'dust', x: X + Math.cos(a) * G.T * 0.1, y: Y + Math.sin(a) * G.T * 0.05, vx: Math.cos(a) * G.T * 0.6, vy: -G.T * (0.2 + Math.random() * 0.4), life: 0.6 + Math.random() * 0.5, age: 0, s: G.T * (0.06 + Math.random() * 0.07) });
      }
    }
    function stampTracks() {
      if (!B.tracks || !B.G) return;
      const d = B.disp, G = B.G, T = G.T;
      const pos = { x: d.x, y: d.y };
      if (B.lastStamp && Math.hypot(pos.x - B.lastStamp.x, pos.y - B.lastStamp.y) < 0.05) return;
      B.lastStamp = pos;
      const tc = ZsCanvas.get2d(B.tracks);
      if (!tc) return;
      tc.save();
      tc.setTransform(B.dpr, 0, 0, B.dpr, 0, 0);
      const pr = makeProj(G.cx(d.x), G.cy(d.y), T * ROVER_SCALE, d.a, 0);
      tc.fillStyle = 'rgba(105,50,22,0.11)';
      [-0.255, 0.255].forEach(s => {
        [0].forEach(f => {
          const A = pr.P(f - 0.045, s - 0.03, 0), Bp = pr.P(f + 0.045, s - 0.03, 0), C = pr.P(f + 0.045, s + 0.03, 0), D = pr.P(f - 0.045, s + 0.03, 0);
          polyPath(tc, [A, Bp, C, D]); tc.fill();
        });
      });
      tc.restore();
    }

    function update(now, dt) {
      const d = B.disp, an = B.anim;
      if (an) {
        const p = clamp((now - an.t0) / an.dur, 0, 1);
        if (an.kind === 'move') {
          const e = ease(p);
          d.x = lerp(an.from.x, an.to.x, e); d.y = lerp(an.from.y, an.to.y, e);
          d.wheel = lerp(an.w0, an.w1, e);
          d.sway = Math.sin(p * Math.PI) * 0.06;
          d.lift = Math.abs(Math.sin(p * Math.PI * 3)) * 0.008;
          stampTracks();
          if (an.collect && p > 0.62 && !B.hidden[an.collect]) collectFx(an.collect);
          if (Math.random() < 0.25 && !reducedMotion()) dust(B.G.cx(d.x) - Math.cos(d.a) * B.G.T * 0.3, B.G.cy(d.y) - Math.sin(d.a) * B.G.T * 0.3 * SY, 1);
        } else if (an.kind === 'turn') {
          const e = ease(p);
          d.a = lerp(an.a0, an.a1, e);
          d.wheel = an.w0 + e * 3;
        } else if (an.kind === 'bump') {
          if (p < 0.32) d.fo = easeOut(p / 0.32) * 0.3;
          else {
            if (!an.hit) {
              an.hit = true; B.shake = 1;
              const G = B.G;
              dust(G.cx(d.x) + Math.cos(d.a) * G.T * 0.45, G.cy(d.y) + Math.sin(d.a) * G.T * 0.45 * SY, 10);
            }
            const q = (p - 0.32) / 0.68;
            d.fo = 0.3 * (1 - easeOut(q));
            d.roll = Math.sin(q * 22) * 0.13 * (1 - q);
            d.headYaw = Math.sin(q * 18) * 0.4 * (1 - q);
          }
          d.sway = Math.sin(p * 20) * 0.08 * (1 - p);
        } else if (an.kind === 'party') {
          d.lift = Math.abs(Math.sin(p * Math.PI * 3)) * 0.24 * (1 - p * 0.4);
          d.headYaw = p * TAU * 2;
          d.sway = Math.sin(p * 30) * 0.08;
        } else if (an.kind === 'sad') {
          d.headYaw = Math.sin(p * TAU * 2) * 0.5 * (1 - p);
          d.lift = 0;
        }
        if (p >= 1) {
          if (an.kind === 'bump' || an.kind === 'party' || an.kind === 'sad') { d.fo = 0; d.roll = 0; d.lift = 0; d.headYaw = 0; d.sway = 0; B.anim = null; }
          else finishAnim();
        }
      } else if (!reducedMotion()) {
        // idle: the camera looks around
        d.headYaw = 0.45 * Math.sin(now / 1400) * Math.sin(now / 3100);
      }
      // particles
      const G = B.G;
      B.parts = B.parts.filter(pt => {
        pt.age += dt;
        if (pt.age >= pt.life) return false;
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        if (pt.type === 'confetti') { pt.vy += G.T * 6 * dt; pt.vx *= 0.985; pt.rot += pt.vr * dt; }
        else if (pt.type === 'spark') { pt.vy += G.T * 2.5 * dt; }
        else if (pt.type === 'dust') { pt.vx *= 0.94; pt.vy *= 0.94; }
        return true;
      });
      if (B.shake > 0) B.shake = Math.max(0, B.shake - dt * 4);
    }

    function drawParticles(t) {
      B.parts.forEach(pt => {
        const k = 1 - pt.age / pt.life;
        if (pt.type === 'dust') {
          ctx.fillStyle = 'rgba(205,150,105,' + (0.5 * k).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.s * (1.6 - k * 0.6), 0, TAU); ctx.fill();
        } else if (pt.type === 'spark') {
          ctx.fillStyle = 'rgba(255,' + Math.round(200 + 55 * k) + ',90,' + k.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.s * (0.5 + k), 0, TAU); ctx.fill();
        } else if (pt.type === 'gem') {
          drawCrystal(ctx, pt.x, pt.y, pt.s * (1 + (1 - k) * 0.3), t, 1, k);
        } else if (pt.type === 'confetti') {
          ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(pt.rot);
          ctx.globalAlpha = Math.min(1, k * 2);
          ctx.fillStyle = pt.c; ctx.fillRect(-pt.s, -pt.s * 0.5, pt.s * 2, pt.s);
          ctx.restore();
        }
      });
    }

    function draw(now) {
      if (!B.G || !B.ground) return;
      if (!ctx && !(ctx = ZsCanvas.get2d(canvas))) return;
      const G = B.G, T = G.T, t = now / 1000;
      const sx = B.shake ? Math.sin(now / 18) * 3 * B.shake : 0;
      ctx.setTransform(B.dpr, 0, 0, B.dpr, sx * B.dpr, 0);
      ctx.clearRect(-10, 0, G.W + 20, G.H);
      ctx.drawImage(B.ground, 0, 0, G.W, G.H);
      ctx.drawImage(B.tracks, 0, 0, G.W, G.H);
      const party = B.party && (now - B.party < 2600);
      const tiles = B.world.tiles;
      // ground-level glows
      for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) {
        const c = tiles[y][x];
        if (c === 'g') drawGreenPadGlow(ctx, G.cx(x), G.cy(y), T, t);
        else if (c === 'G') drawGoalPulse(ctx, G.cx(x), G.cy(y), T, t, party);
      }
      // objects + rover, sorted by row
      const d = B.disp;
      const roverRow = Math.floor(d.y + 1e-6);
      let roverDrawn = false;
      const drawRoverNow = () => {
        roverDrawn = true;
        const X = G.cx(d.x) + Math.cos(d.a) * d.fo * T, Y = G.cy(d.y) + Math.sin(d.a) * d.fo * T * SY;
        drawRover(ctx, X, Y, T, { a: d.a, wheel: d.wheel, lift: d.lift, roll: d.roll, headYaw: d.headYaw, sway: d.sway, lights: B.lights, led: B.led, t });
      };
      for (let y = 0; y < G.h; y++) {
        for (let x = 0; x < G.w; x++) {
          const c = tiles[y][x];
          if (c === '#') {
            const sp = B.rocks[x + ',' + y];
            if (sp) ctx.drawImage(sp.canvas, G.cx(x) - sp.ox, G.cy(y) - sp.oy, sp.SW, sp.SH);
          } else if (c === '*' && !B.hidden['s_' + x + '_' + y]) {
            drawCrystal(ctx, G.cx(x), G.cy(y) + T * 0.12, T * 0.62, t, x * 1.3 + y * 2.1);
          } else if (c === 'G') {
            drawBeacon(ctx, G.cx(x), G.cy(y), T, t, party);
          }
        }
        if (!roverDrawn && y >= roverRow) drawRoverNow();
      }
      if (!roverDrawn) drawRoverNow();
      ctx.drawImage(B.front, 0, 0, G.W, G.H);
      drawParticles(t);
    }

    function frame(now) {
      B.raf = 0;
      if (!B.running) return;
      const dt = Math.min(0.05, (now - (B.last || now)) / 1000);
      B.last = now;
      if (!document.hidden) {
        update(now, dt);
        draw(now);
      }
      const busy = B.anim || B.parts.length || B.shake;
      if (busy || !reducedMotion()) B.raf = requestAnimationFrame(frame);
    }
    function kick() { if (B.running && !B.raf) { B.last = performance.now(); B.raf = requestAnimationFrame(frame); } }
    B.start = function() { B.running = true; kick(); };
    B.stop = function() { B.running = false; if (B.raf) cancelAnimationFrame(B.raf); B.raf = 0; };
    B.busy = function() { return !!B.anim; };
    B.redraw = function() { draw(performance.now()); };
    return B;
  }

  // ================================================================
  //  THUMBNAIL (puzzle list)
  // ================================================================
  function drawThumb(canvas, puzzle) {
    const rows = puzzle.tiles;
    const h = rows.length, w = rows[0].length;
    const s = Math.max(3, Math.floor(Math.min(62 / w, 38 / h)));
    const pad = 3;
    const dpr = Math.max(1, ZsCanvas.dpr());
    const W = w * s + pad * 2, H = h * s + pad * 2;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const ctx = ZsCanvas.get2d(canvas);
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#C98C5C';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 0, W, H, 4) : ctx.rect(0, 0, W, H); ctx.fill();
    ctx.fillStyle = '#E4B283';
    ctx.fillRect(pad, pad, w * s, h * s);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = rows[y][x], cx = pad + x * s + s / 2, cy = pad + y * s + s / 2;
      if ((x + y) % 2) { ctx.fillStyle = 'rgba(150,80,40,0.08)'; ctx.fillRect(pad + x * s, pad + y * s, s, s); }
      if (c === '#') { ctx.fillStyle = '#7A4A36'; ctx.beginPath(); ctx.arc(cx, cy, s * 0.46, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,220,190,0.35)'; ctx.beginPath(); ctx.arc(cx - s * 0.12, cy - s * 0.14, s * 0.18, 0, TAU); ctx.fill(); }
      else if (c === '*') { ctx.fillStyle = '#F59E0B'; ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.42); ctx.lineTo(cx + s * 0.3, cy); ctx.lineTo(cx, cy + s * 0.42); ctx.lineTo(cx - s * 0.3, cy); ctx.closePath(); ctx.fill(); }
      else if (c === 'g') { ctx.fillStyle = '#10B981'; ctx.beginPath(); ctx.arc(cx, cy, s * 0.36, 0, TAU); ctx.fill(); }
      else if (c === 'G') { ctx.strokeStyle = '#0E7490'; ctx.lineWidth = Math.max(1, s * 0.2); ctx.beginPath(); ctx.arc(cx, cy, s * 0.34, 0, TAU); ctx.stroke(); ctx.fillStyle = '#22D3EE'; ctx.beginPath(); ctx.arc(cx, cy, s * 0.16, 0, TAU); ctx.fill(); }
    }
    const r = puzzle.rover;
    const cx = pad + r.x * s + s / 2, cy = pad + r.y * s + s / 2;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(r.dir * Math.PI / 2);
    ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#1E293B'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.45); ctx.lineTo(s * 0.36, s * 0.36); ctx.lineTo(-s * 0.36, s * 0.36); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // ================================================================
  //  BLOCK ICONS (inline SVG, 24×24, white strokes on block colour)
  // ================================================================
  const S = 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
  const ICONS = {
    move: '<path ' + S + ' d="M4 12h14M13 6l6 6-6 6"/>',
    turnLeft: '<path ' + S + ' d="M17 20v-7a5 5 0 0 0-5-5H6M10 4 6 8l4 4"/>',
    turnRight: '<path ' + S + ' d="M7 20v-7a5 5 0 0 1 5-5h6M14 4l4 4-4 4"/>',
    repeat: '<path ' + S + ' d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4"/>',
    forLoop: '<path ' + S + ' d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M20 13v2a3 3 0 0 1-3 3H4"/><text x="9" y="16.5" font-size="9" font-weight="900" fill="currentColor" stroke="none" font-family="Nunito,system-ui,sans-serif">i</text>',
    whileClear: '<path ' + S + ' d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13"/><path ' + S + ' d="M3 17s3-4 7-4 7 4 7 4-3 4-7 4-7-4-7-4z"/><circle cx="10" cy="17" r="1.6" fill="currentColor"/>',
    ifGreen: '<ellipse cx="12" cy="15" rx="9" ry="5" fill="#34D399" stroke="currentColor" stroke-width="2"/><path ' + S + ' d="M12 3v6M9 6l3 3 3-3"/>',
    ifStar: '<path d="M12 2 16 9 12 22 8 9z" fill="#FCD34D" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9h8" stroke="currentColor" stroke-width="1.6"/>',
    ifRock: '<path d="M3 20c0-6 3-10 7-10 2 0 3 1 4 2 1-1 2-1 3-1 3 0 4 4 4 9z" fill="#A16207" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path ' + S + ' d="M2 6s3-3 6-3 6 3 6 3-3 3-6 3-6-3-6-3z" stroke-width="2"/>',
    callF1: '<path d="M4 7h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
    run: '<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
    f1hat: '<path d="M4 7h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H4z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>'
  };
  function icon(type) {
    return '<svg class="cc-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[type] || '') + '</svg>';
  }

  return { createBoard, drawThumb, icon, SY };
})();
