/* ================================================================
   MI NEGOCIO — the street-stand scene, drawn in <canvas>.
   Layers: sky + sun + clouds → Andes / sea → colonial plaza or beach
   promenade → paved sidewalk → wooden stand with striped awning,
   chalkboard price sign and product → walking customers → weather
   (rain, puddles, glare) → time-of-day light grade → speech bubbles.
   Static layers are cached to offscreen canvases; the rest animates
   at 60fps with requestAnimationFrame. Exposes one global:
   MiNegocioArt.
   World units: the scene is 600 units tall; width follows the
   canvas aspect ratio.
   ================================================================ */

var MiNegocioArt = (function() {
  'use strict';

  var H = 600;
  var GROUND = 432;        // back edge of the sidewalk
  var STAND_BASE = 520;    // ground line of the stand's front panel
  var COUNTER = 420;       // counter top
  var SIM_RATE = 13.5;     // sim minutes per real second at 1×
  var DAY_LEN = 540;       // 10:00 → 19:00
  var WALK = 12;           // world units per sim minute (≈1.2 m/s)

  // ---- small utils -------------------------------------------------
  function rng(seed) {
    var s = seed >>> 0;
    return function() {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function hex(c) {
    var n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(c1, c2, t) {
    var a = hex(c1), b = hex(c2);
    return 'rgb(' + Math.round(lerp(a[0], b[0], t)) + ',' + Math.round(lerp(a[1], b[1], t)) + ',' +
      Math.round(lerp(a[2], b[2], t)) + ')';
  }
  function shade(c, t) { return t < 0 ? mix(c, '#000000', -t) : mix(c, '#ffffff', t); }
  function rgba(c, a) { var x = hex(c); return 'rgba(' + x[0] + ',' + x[1] + ',' + x[2] + ',' + a + ')'; }
  function money(n) {
    n = Math.round(n);
    return (n < 0 ? '-$' : '$') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  function ellipse(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2);
  }
  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  }

  // ---- sky ---------------------------------------------------------
  var SKY = {
    sunny:  { top: '#2F7FD6', mid: '#76B5EE', hor: '#CDE8FB', late: '#FFC98F' },
    hot:    { top: '#2A78D8', mid: '#7FB9EC', hor: '#FFF0C4', late: '#FFB874' },
    cloudy: { top: '#7F8FA4', mid: '#A9B5C4', hor: '#D3D9E1', late: '#D9C3AE' },
    rainy:  { top: '#4C5866', mid: '#6C7886', hor: '#8E98A3', late: '#8F8C88' }
  };

  function sunPos(W, t) {
    var f = clamp(t / DAY_LEN, 0, 1);
    // 10:00 already high-ish (summer); arc peaks near 14:00, low by 19:00
    var x = lerp(W * 0.18, W * 0.92, f);
    var y = 210 - Math.sin(Math.PI * (0.32 + f * 0.62)) * 150;
    return { x: x, y: y, f: f };
  }
  function lateness(t) { return clamp((t - 330) / 210, 0, 1); }   // 15:30 → 19:00

  function drawSky(ctx, W, weather, t) {
    var s = SKY[weather] || SKY.sunny;
    var late = lateness(t);
    var g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, mix(s.top, '#3A4E8C', late * 0.35));
    g.addColorStop(0.55, mix(s.mid, s.late, late * 0.35));
    g.addColorStop(1, mix(s.hor, s.late, late * 0.75));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, GROUND + 2);
  }

  function drawSun(ctx, W, weather, t) {
    var p = sunPos(W, t);
    var late = lateness(t);
    if (weather === 'rainy') return p;
    var strength = weather === 'cloudy' ? 0.35 : 1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var R = weather === 'hot' ? 260 : 190;
    var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
    var core = late > 0.5 ? '#FFD9A0' : '#FFF6DA';
    g.addColorStop(0, rgba(core, 0.85 * strength));
    g.addColorStop(0.12, rgba(core, 0.45 * strength));
    g.addColorStop(0.4, rgba('#FFE7B0', 0.12 * strength));
    g.addColorStop(1, 'rgba(255,230,180,0)');
    ctx.fillStyle = g;
    ctx.fillRect(p.x - R, p.y - R, R * 2, R * 2);
    ctx.restore();
    if (weather !== 'cloudy') {
      var d = ctx.createRadialGradient(p.x - 6, p.y - 6, 2, p.x, p.y, 24);
      d.addColorStop(0, '#FFFFFF');
      d.addColorStop(0.7, late > 0.6 ? '#FFE3B0' : '#FFFBEA');
      d.addColorStop(1, late > 0.6 ? '#FFC870' : '#FFF2C0');
      ctx.fillStyle = d;
      ellipse(ctx, p.x, p.y, 22, 22); ctx.fill();
    }
    return p;
  }

  // Lens glare on hot days — soft discs along the sun → centre line.
  function drawGlare(ctx, W, weather, t) {
    if (weather !== 'hot' && weather !== 'sunny') return;
    var p = sunPos(W, t);
    var cx = W * 0.5, cy = H * 0.55;
    var a = weather === 'hot' ? 1 : 0.55;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var spots = [[0.35, 34, 0.10], [0.55, 16, 0.12], [0.8, 52, 0.06], [1.15, 24, 0.08], [1.4, 70, 0.04]];
    for (var i = 0; i < spots.length; i++) {
      var sx = lerp(p.x, cx, spots[i][0]) + (cx - p.x) * 0, sy = lerp(p.y, cy, spots[i][0]);
      var r = spots[i][1];
      var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      var col = i % 2 ? '170,220,255' : '255,220,160';
      g.addColorStop(0, 'rgba(' + col + ',' + (spots[i][2] * a) + ')');
      g.addColorStop(0.7, 'rgba(' + col + ',' + (spots[i][2] * a * 0.6) + ')');
      g.addColorStop(1, 'rgba(' + col + ',0)');
      ctx.fillStyle = g;
      ellipse(ctx, sx, sy, r, r); ctx.fill();
    }
    ctx.restore();
  }

  // ---- clouds (cached sprites) --------------------------------------
  function makeCloud(w, h, seed, tone, k) {
    var c = makeCanvas(w * k, h * k), x = c.getContext('2d');
    x.scale(k, k);
    var r = rng(seed);
    var n = 16 + Math.floor(r() * 10);
    var light = tone === 'storm' ? '#9AA3AD' : tone === 'grey' ? '#E6EAEE' : '#FFFFFF';
    var dark = tone === 'storm' ? '#4E5661' : tone === 'grey' ? '#9CA6B2' : '#B9C6D6';
    // bottom shadow pass then light puffs
    for (var pass = 0; pass < 2; pass++) {
      var rr = rng(seed);
      for (var i = 0; i < n; i++) {
        var px = w * 0.15 + rr() * w * 0.7;
        var py = h * 0.35 + rr() * h * 0.35;
        var pr = h * (0.18 + rr() * 0.22) * (1 - Math.abs(px / w - 0.5) * 0.9);
        if (pass === 0) { py += pr * 0.25; }
        var g = x.createRadialGradient(px - pr * 0.25, py - pr * 0.35, pr * 0.1, px, py, pr);
        if (pass === 0) {
          g.addColorStop(0, rgba(dark, 0.9)); g.addColorStop(1, rgba(dark, 0));
        } else {
          g.addColorStop(0, rgba(light, 1)); g.addColorStop(0.55, rgba(light, 0.85));
          g.addColorStop(1, rgba(light, 0));
        }
        x.fillStyle = g;
        ellipse(x, px, py, pr, pr * (pass === 0 ? 0.8 : 0.92)); x.fill();
      }
    }
    return c;
  }

  // ---- background: plaza --------------------------------------------
  // Fractal ridge line (midpoint displacement) for believable peaks.
  function ridge(r, W, base, amp, rough) {
    var n = 64, pts = [], i;
    for (i = 0; i <= n; i++) pts.push(0);
    var step = n, a = amp;
    pts[0] = (r() - 0.5) * amp; pts[n] = (r() - 0.5) * amp;
    while (step > 1) {
      var half = step / 2;
      for (i = half; i < n; i += step) pts[i] = (pts[i - half] + pts[i + half]) / 2 + (r() - 0.5) * a;
      a *= rough; step = half;
    }
    var out = [];
    for (i = 0; i <= n; i++) out.push([-20 + (W + 40) * i / n, base + pts[i]]);
    return out;
  }

  function drawAndes(x, W, weather, seed) {
    var r = rng(seed);
    var hazeA = weather === 'rainy' ? 0.18 : weather === 'cloudy' ? 0.5 : 0.92;
    x.save();
    x.globalAlpha = hazeA;
    // far cordillera
    var pts = ridge(r, W, 238, 150, 0.52), i;
    var path = function() {
      x.beginPath(); x.moveTo(-20, GROUND);
      for (i = 0; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
      x.lineTo(W + 20, GROUND); x.closePath();
    };
    var g = x.createLinearGradient(0, 140, 0, 330);
    g.addColorStop(0, '#8C9FBF'); g.addColorStop(1, '#B9C7DA');
    x.fillStyle = g; path(); x.fill();
    x.save(); path(); x.clip();
    // shaded east faces: soft wedges falling from each local peak
    for (i = 2; i < pts.length - 2; i++) {
      if (!(pts[i][1] < pts[i - 1][1] && pts[i][1] < pts[i + 1][1])) continue;
      var pk = pts[i];
      var wg = x.createLinearGradient(pk[0], pk[1], pk[0] + 40, pk[1] + 90);
      wg.addColorStop(0, 'rgba(60,80,115,0.32)'); wg.addColorStop(1, 'rgba(60,80,115,0)');
      x.fillStyle = wg;
      x.beginPath(); x.moveTo(pk[0], pk[1]);
      for (var j = i + 1; j < Math.min(pts.length, i + 5); j++) x.lineTo(pts[j][0], pts[j][1]);
      x.lineTo(pts[Math.min(pts.length - 1, i + 4)][0] - 10, pk[1] + 120);
      x.lineTo(pk[0] + 6, pk[1] + 130);
      x.closePath(); x.fill();
    }
    // snow above a ragged snowline (only the higher peaks)
    var snow = ridge(r, W, 206, 16, 0.7);
    var sg = x.createLinearGradient(0, 130, 0, 240);
    sg.addColorStop(0, 'rgba(255,255,255,0.97)'); sg.addColorStop(1, 'rgba(232,240,250,0.9)');
    x.fillStyle = sg;
    x.beginPath(); x.moveTo(-20, 0);
    for (i = 0; i < snow.length; i++) x.lineTo(snow[i][0], snow[i][1] + ((i % 3) - 1) * 4);
    x.lineTo(W + 20, 0); x.closePath(); x.fill();
    x.restore();
    // atmospheric haze at the foot
    var hz = x.createLinearGradient(0, 250, 0, 330);
    hz.addColorStop(0, 'rgba(210,225,240,0)'); hz.addColorStop(1, 'rgba(210,225,240,0.75)');
    x.fillStyle = hz; x.fillRect(0, 250, W, 90);
    // nearer foothills (cerros), greener
    var hills = ridge(r, W, 318, 40, 0.5);
    var g2 = x.createLinearGradient(0, 280, 0, GROUND);
    g2.addColorStop(0, '#8EA58C'); g2.addColorStop(1, '#A9B99F');
    x.fillStyle = g2;
    x.beginPath(); x.moveTo(-20, GROUND);
    for (i = 0; i < hills.length; i++) x.lineTo(hills[i][0], hills[i][1]);
    x.lineTo(W + 20, GROUND); x.closePath(); x.fill();
    x.restore();
  }

  function tileRoof(x, x0, y0, w, h, base) {
    // terracotta tiles: body gradient + curved tile rows
    var g = x.createLinearGradient(0, y0, 0, y0 + h);
    g.addColorStop(0, shade(base, -0.15)); g.addColorStop(1, shade(base, 0.08));
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(x0 - 8, y0 + h); x.lineTo(x0 + 6, y0); x.lineTo(x0 + w - 6, y0); x.lineTo(x0 + w + 8, y0 + h);
    x.closePath(); x.fill();
    x.save(); x.clip();
    for (var yy = y0 + 4; yy < y0 + h + 4; yy += 6) {
      x.strokeStyle = 'rgba(90,30,10,0.35)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(x0 - 10, yy); x.lineTo(x0 + w + 10, yy); x.stroke();
      for (var xx = x0 - 8 + ((yy / 6) % 2) * 4; xx < x0 + w + 8; xx += 8) {
        x.fillStyle = 'rgba(255,190,150,0.25)';
        x.beginPath(); x.ellipse(xx, yy - 3, 2.6, 2.4, 0, Math.PI, 0); x.fill();
        x.strokeStyle = 'rgba(80,25,10,0.3)';
        x.beginPath(); x.moveTo(xx + 4, yy - 5); x.lineTo(xx + 4, yy); x.stroke();
      }
    }
    x.restore();
    // eave shadow line
    x.fillStyle = 'rgba(60,20,5,0.55)';
    x.fillRect(x0 - 8, y0 + h, w + 16, 3);
  }

  function stuccoWall(x, x0, y0, w, h, base, sunny) {
    var g = x.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, shade(base, sunny ? 0.06 : 0));
    g.addColorStop(1, shade(base, sunny ? -0.08 : -0.04));
    x.fillStyle = g; x.fillRect(x0, y0, w, h);
    // subtle plaster mottling
    var r = rng(Math.floor(x0 * 7 + y0));
    for (var i = 0; i < w * h / 260; i++) {
      x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(80,50,20,0.05)';
      ellipse(x, x0 + r() * w, y0 + r() * h, 3 + r() * 9, 2 + r() * 5); x.fill();
    }
    // weathering at the base
    var gb = x.createLinearGradient(0, y0 + h - 30, 0, y0 + h);
    gb.addColorStop(0, 'rgba(90,70,50,0)'); gb.addColorStop(1, 'rgba(90,70,50,0.22)');
    x.fillStyle = gb; x.fillRect(x0, y0 + h - 30, w, 30);
  }

  function archWindow(x, cx, top, w, h, frame, glass, shutters) {
    // frame
    x.fillStyle = frame;
    x.beginPath();
    x.moveTo(cx - w / 2 - 3, top + h + 3); x.lineTo(cx - w / 2 - 3, top + w / 2);
    x.arc(cx, top + w / 2, w / 2 + 3, Math.PI, 0); x.lineTo(cx + w / 2 + 3, top + h + 3); x.closePath(); x.fill();
    var g = x.createLinearGradient(0, top, 0, top + h);
    g.addColorStop(0, glass[0]); g.addColorStop(1, glass[1]);
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(cx - w / 2, top + h); x.lineTo(cx - w / 2, top + w / 2);
    x.arc(cx, top + w / 2, w / 2, Math.PI, 0); x.lineTo(cx + w / 2, top + h); x.closePath(); x.fill();
    // glazing bars + sky reflection
    x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(cx, top + 2); x.lineTo(cx, top + h); x.moveTo(cx - w / 2, top + h * 0.55); x.lineTo(cx + w / 2, top + h * 0.55); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.18)';
    x.beginPath(); x.moveTo(cx - w / 2, top + h * 0.9); x.lineTo(cx - w / 2, top + w / 2); x.lineTo(cx + w * 0.1, top + 4); x.lineTo(cx - w * 0.1, top + h * 0.6); x.closePath(); x.fill();
    // sill shadow
    x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(cx - w / 2 - 5, top + h + 3, w + 10, 3);
    x.fillStyle = shade(frame, 0.2); x.fillRect(cx - w / 2 - 6, top + h + 1, w + 12, 3);
    if (shutters) {
      x.fillStyle = shutters;
      x.fillRect(cx - w / 2 - 3 - w * 0.42, top + 4, w * 0.4, h - 2);
      x.fillRect(cx + w / 2 + 3 + 2, top + 4, w * 0.4, h - 2);
      x.strokeStyle = 'rgba(0,0,0,0.25)';
      for (var s = 0; s < h - 6; s += 4) {
        x.beginPath();
        x.moveTo(cx - w / 2 - 3 - w * 0.42, top + 6 + s); x.lineTo(cx - w / 2 - 5, top + 6 + s);
        x.moveTo(cx + w / 2 + 5, top + 6 + s); x.lineTo(cx + w / 2 + 5 + w * 0.4, top + 6 + s);
        x.stroke();
      }
    }
  }

  function ironBalcony(x, cx, y, w) {
    x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(cx - w / 2, y + 2, w, 4);
    x.fillStyle = '#C9BBA4'; x.fillRect(cx - w / 2 - 2, y, w + 4, 3);
    x.strokeStyle = '#1E2326'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(cx - w / 2, y - 16); x.lineTo(cx + w / 2, y - 16); x.stroke();
    x.lineWidth = 0.9;
    for (var i = 0; i <= w; i += 4) { x.beginPath(); x.moveTo(cx - w / 2 + i, y - 16); x.lineTo(cx - w / 2 + i, y); x.stroke(); }
    for (var j = 4; j < w; j += 10) { x.beginPath(); x.arc(cx - w / 2 + j + 2, y - 8, 2.5, 0, Math.PI * 2); x.stroke(); }
  }

  function colonialHouse(x, x0, w, h, wall, sunny, rr) {
    var top = GROUND - h;
    stuccoWall(x, x0, top, w, h, wall, sunny);
    // cornice
    x.fillStyle = shade(wall, 0.25); x.fillRect(x0, top, w, 5);
    x.fillStyle = 'rgba(0,0,0,0.15)'; x.fillRect(x0, top + 5, w, 2);
    tileRoof(x, x0, top - 22, w, 22, '#B4532A');
    // ground floor: arcade (portales)
    var arcH = Math.min(70, h * 0.48), n = Math.max(2, Math.round(w / 46)), aw = w / n;
    var floorY = GROUND - arcH;
    x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(x0, floorY - 4, w, 4);
    for (var i = 0; i < n; i++) {
      var ax = x0 + i * aw + aw * 0.14, ww = aw * 0.72;
      var g = x.createLinearGradient(0, floorY, 0, GROUND);
      g.addColorStop(0, '#3A2C22'); g.addColorStop(1, '#5B4636');
      x.fillStyle = g;
      x.beginPath(); x.moveTo(ax, GROUND); x.lineTo(ax, floorY + ww / 2);
      x.arc(ax + ww / 2, floorY + ww / 2, ww / 2, Math.PI, 0); x.lineTo(ax + ww, GROUND); x.closePath(); x.fill();
      // shop glow / door inside arcade
      x.fillStyle = 'rgba(255,214,150,0.22)';
      x.fillRect(ax + ww * 0.25, GROUND - arcH * 0.55, ww * 0.5, arcH * 0.55);
      x.fillStyle = 'rgba(60,40,25,0.6)';
      x.fillRect(ax + ww * 0.3, GROUND - arcH * 0.5, ww * 0.4, arcH * 0.5);
      // arch moulding highlight
      x.strokeStyle = shade(wall, 0.3); x.lineWidth = 2;
      x.beginPath(); x.arc(ax + ww / 2, floorY + ww / 2, ww / 2 + 1.5, Math.PI, 0); x.stroke();
    }
    // upper windows with balconies
    var wn = Math.max(1, Math.round(w / 52));
    for (var j = 0; j < wn; j++) {
      var cx = x0 + (j + 0.5) * (w / wn);
      var wy = top + 16, wh = Math.min(40, (floorY - top) - 30);
      if (wh < 18) break;
      archWindow(x, cx, wy, 16, wh, '#E9DFCB', ['#4B6378', '#26323D'], rr() < 0.6 ? '#2F5D50' : '#6B3E26');
      if (rr() < 0.7) ironBalcony(x, cx, wy + wh + 4, 30);
    }
  }

  function churchFacade(x, cx, sunny) {
    var w = 210, h = 175, x0 = cx - w / 2, top = GROUND - h;
    var wall = '#EFE5CF';
    // roof of the nave behind the gable
    tileRoof(x, x0 + 6, top - 36, w - 12, 18, '#A64B26');
    stuccoWall(x, x0, top, w, h, wall, sunny);
    // gable (pediment)
    var g = x.createLinearGradient(0, top - 52, 0, top);
    g.addColorStop(0, '#F5EEDD'); g.addColorStop(1, '#E7DBC2');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(x0 - 4, top + 2); x.lineTo(cx, top - 54); x.lineTo(x0 + w + 4, top + 2); x.closePath(); x.fill();
    x.strokeStyle = '#D5C6A6'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(x0 - 6, top + 2); x.lineTo(cx, top - 56); x.lineTo(x0 + w + 6, top + 2); x.stroke();
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(x0 - 4, top + 3, w + 8, 4);
    // small cross on the gable
    x.fillStyle = '#6E6A63';
    x.fillRect(cx - 1.5, top - 76, 3, 22); x.fillRect(cx - 7, top - 70, 14, 3);
    // pilasters
    [0.04, 0.3, 0.7, 0.96].forEach(function(f) {
      var px = x0 + w * f - 7;
      var pg = x.createLinearGradient(px, 0, px + 14, 0);
      pg.addColorStop(0, '#F7F1E3'); pg.addColorStop(1, '#D9CCB0');
      x.fillStyle = pg; x.fillRect(px, top + 4, 14, h - 4);
      x.fillStyle = '#E2D5BA'; x.fillRect(px - 2, top + 4, 18, 5); x.fillRect(px - 2, GROUND - 12, 18, 12);
    });
    // oculus
    var oy = top + 40;
    x.fillStyle = '#D7C9AB'; ellipse(x, cx, oy, 19, 19); x.fill();
    var og = x.createRadialGradient(cx - 4, oy - 4, 2, cx, oy, 15);
    og.addColorStop(0, '#8FB3CC'); og.addColorStop(0.6, '#3C5D79'); og.addColorStop(1, '#1F2F3E');
    x.fillStyle = og; ellipse(x, cx, oy, 15, 15); x.fill();
    x.strokeStyle = 'rgba(220,200,160,0.8)'; x.lineWidth = 1.2;
    for (var a = 0; a < 8; a++) {
      x.beginPath(); x.moveTo(cx, oy); x.lineTo(cx + Math.cos(a * Math.PI / 4) * 15, oy + Math.sin(a * Math.PI / 4) * 15); x.stroke();
    }
    // portal: stone frame + carved wooden doors
    var dw = 50, dh = 84, dx = cx - dw / 2, dy = GROUND - dh;
    x.fillStyle = '#D4C5A5';
    x.beginPath(); x.moveTo(dx - 9, GROUND); x.lineTo(dx - 9, dy + dw / 2); x.arc(cx, dy + dw / 2, dw / 2 + 9, Math.PI, 0); x.lineTo(dx + dw + 9, GROUND); x.closePath(); x.fill();
    var dg = x.createLinearGradient(dx, 0, dx + dw, 0);
    dg.addColorStop(0, '#4A2A17'); dg.addColorStop(0.5, '#6A3D22'); dg.addColorStop(1, '#3E2313');
    x.fillStyle = dg;
    x.beginPath(); x.moveTo(dx, GROUND); x.lineTo(dx, dy + dw / 2); x.arc(cx, dy + dw / 2, dw / 2, Math.PI, 0); x.lineTo(dx + dw, GROUND); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.45)'; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(cx, dy + 6); x.lineTo(cx, GROUND); x.stroke();
    x.strokeStyle = 'rgba(255,200,140,0.18)';
    for (var r2 = 0; r2 < 3; r2++) {
      x.strokeRect(dx + 5, dy + 30 + r2 * 17, dw / 2 - 9, 13);
      x.strokeRect(cx + 4, dy + 30 + r2 * 17, dw / 2 - 9, 13);
    }
    x.fillStyle = '#C9A24A';
    for (var st = 0; st < 5; st++) { ellipse(x, dx + 4, dy + 34 + st * 11, 1, 1); x.fill(); ellipse(x, dx + dw - 4, dy + 34 + st * 11, 1, 1); x.fill(); }
    // steps
    x.fillStyle = '#CDBE9F'; x.fillRect(dx - 18, GROUND - 5, dw + 36, 5);
    x.fillStyle = '#BCAD8C'; x.fillRect(dx - 26, GROUND - 2, dw + 52, 2);
    // niche with a statue silhouette
    x.fillStyle = '#D9CBAD';
    x.beginPath(); x.moveTo(cx - 9, top + 92); x.lineTo(cx - 9, top + 74); x.arc(cx, top + 74, 9, Math.PI, 0); x.lineTo(cx + 9, top + 92); x.closePath(); x.fill();
    x.fillStyle = '#A89A7E';
    ellipse(x, cx, top + 72, 3, 3.4); x.fill();
    x.beginPath(); x.moveTo(cx - 4, top + 90); x.quadraticCurveTo(cx, top + 70, cx + 4, top + 90); x.fill();
    return { x0: x0, w: w };
  }

  function bellTower(x, cx, sunny) {
    var w = 62, base = GROUND, h1 = 200, x0 = cx - w / 2;
    var top = base - h1;
    stuccoWall(x, x0, top, w, h1, '#EADCC0', sunny);
    // side shadow (3D) on the right face
    x.fillStyle = 'rgba(70,50,30,0.16)'; x.fillRect(x0 + w - 10, top, 10, h1);
    // string courses
    [0.35, 0.7].forEach(function(f) {
      x.fillStyle = '#D6C6A4'; x.fillRect(x0 - 3, top + h1 * f, w + 6, 5);
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(x0 - 3, top + h1 * f + 5, w + 6, 2);
    });
    archWindow(x, cx, top + h1 * 0.42, 12, 26, '#DCCDAE', ['#4B6378', '#26323D']);
    // belfry stage
    var bw = w + 6, bx = cx - bw / 2, by = top - 70;
    stuccoWall(x, bx, by, bw, 70, '#F1E7D2', sunny);
    x.fillStyle = 'rgba(70,50,30,0.16)'; x.fillRect(bx + bw - 10, by, 10, 70);
    x.fillStyle = '#20262B';
    x.beginPath(); x.moveTo(cx - 14, by + 62); x.lineTo(cx - 14, by + 26); x.arc(cx, by + 26, 14, Math.PI, 0); x.lineTo(cx + 14, by + 62); x.closePath(); x.fill();
    // bronze bell
    var bg = x.createLinearGradient(cx - 10, 0, cx + 10, 0);
    bg.addColorStop(0, '#6B4A1E'); bg.addColorStop(0.4, '#D9A852'); bg.addColorStop(0.7, '#9C6E2C'); bg.addColorStop(1, '#5A3C16');
    x.fillStyle = bg;
    x.beginPath(); x.moveTo(cx - 5, by + 26); x.quadraticCurveTo(cx - 8, by + 40, cx - 12, by + 46); x.lineTo(cx + 12, by + 46);
    x.quadraticCurveTo(cx + 8, by + 40, cx + 5, by + 26); x.closePath(); x.fill();
    x.fillStyle = '#3A2A12'; x.fillRect(cx - 12, by + 22, 24, 3);
    // cornice + clock
    x.fillStyle = '#D6C6A4'; x.fillRect(bx - 4, by - 6, bw + 8, 7);
    var cy2 = top - 2 - 0;
    x.fillStyle = '#F7F2E6'; ellipse(x, cx, top + 30, 15, 15); x.fill();
    x.strokeStyle = '#3A3A3A'; x.lineWidth = 1.5; ellipse(x, cx, top + 30, 15, 15); x.stroke();
    x.lineWidth = 1.8;
    x.beginPath(); x.moveTo(cx, top + 30); x.lineTo(cx, top + 20); x.moveTo(cx, top + 30); x.lineTo(cx + 7, top + 33); x.stroke();
    for (var hh = 0; hh < 12; hh++) {
      var an = hh * Math.PI / 6;
      x.fillStyle = '#3A3A3A'; ellipse(x, cx + Math.cos(an) * 12, top + 30 + Math.sin(an) * 12, 0.9, 0.9); x.fill();
    }
    // spire
    var sg = x.createLinearGradient(cx - 30, 0, cx + 30, 0);
    sg.addColorStop(0, '#7B8790'); sg.addColorStop(0.45, '#A9B4BC'); sg.addColorStop(1, '#4E5860');
    x.fillStyle = sg;
    x.beginPath(); x.moveTo(bx - 2, by - 6); x.lineTo(cx, by - 92); x.lineTo(bx + bw + 2, by - 6); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.15)'; x.lineWidth = 0.8;
    for (var s = 1; s < 8; s++) {
      var yy = by - 6 - s * 11, half = (bw / 2 + 2) * (1 - s * 11 / 86);
      x.beginPath(); x.moveTo(cx - half, yy); x.lineTo(cx + half, yy); x.stroke();
    }
    // iron cross
    x.fillStyle = '#2B2B2B';
    x.fillRect(cx - 1.5, by - 116, 3, 26); x.fillRect(cx - 8, by - 108, 16, 3);
    void cy2;
  }

  function palmTree(x, cx, baseY, h, seed, lean) {
    var r = rng(seed);
    lean = lean || 0;
    var topX = cx + lean, topY = baseY - h;
    // trunk with leaf-scar diamonds
    var segs = Math.floor(h / 7);
    for (var i = 0; i < segs; i++) {
      var f = i / segs, f2 = (i + 1) / segs;
      var x1 = lerp(cx, topX, f * f), y1 = lerp(baseY, topY, f);
      var x2 = lerp(cx, topX, f2 * f2), y2 = lerp(baseY, topY, f2);
      var wdt = lerp(13, 9, f);
      var g = x.createLinearGradient(x1 - wdt, 0, x1 + wdt, 0);
      g.addColorStop(0, '#5A4430'); g.addColorStop(0.35, '#8E6E4C'); g.addColorStop(1, '#3F2F20');
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(x1 - wdt, y1); x.lineTo(x1 + wdt, y1); x.lineTo(x2 + wdt * 0.98, y2 - 1); x.lineTo(x2 - wdt * 0.98, y2 - 1);
      x.closePath(); x.fill();
      x.strokeStyle = 'rgba(30,20,10,0.35)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(x1 - wdt, y1 - 1); x.quadraticCurveTo(x1, y1 - 5, x1 + wdt, y1 - 1); x.stroke();
    }
    // crown: arching fronds with leaflets
    var fronds = 22;
    for (var j = 0; j < fronds; j++) {
      var ang = -Math.PI / 2 + (j / fronds - 0.5) * Math.PI * 1.9 + (r() - 0.5) * 0.25;
      var len = h * (0.36 + r() * 0.12);
      var droop = 0.55 + r() * 0.35;
      var ex = topX + Math.cos(ang) * len, ey = topY + Math.sin(ang) * len * 0.55 + len * droop * 0.5;
      var mx = topX + Math.cos(ang) * len * 0.55, my = topY + Math.sin(ang) * len * 0.5 - len * 0.12;
      var dark = j % 3 === 0;
      x.strokeStyle = dark ? '#2F5A2A' : '#4E7D38'; x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(topX, topY); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
      // leaflets: dense, drooping, lit from the upper left
      var lit = Math.cos(ang) < 0.2 && Math.sin(ang) < 0.3;
      for (var k = 3; k < 26; k++) {
        var tt = k / 26;
        var qx = (1 - tt) * (1 - tt) * topX + 2 * (1 - tt) * tt * mx + tt * tt * ex;
        var qy = (1 - tt) * (1 - tt) * topY + 2 * (1 - tt) * tt * my + tt * tt * ey;
        var dx = 2 * (1 - tt) * (mx - topX) + 2 * tt * (ex - mx), dy = 2 * (1 - tt) * (my - topY) + 2 * tt * (ey - my);
        var dl = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = -dy / dl, ny = dx / dl;
        var ll = Math.max(2, (1 - Math.abs(tt - 0.4) * 1.35) * 16);
        x.strokeStyle = dark ? '#2A4F25' : lit ? (k % 2 ? '#6FA048' : '#5A8D3C') : (k % 2 ? '#3F6E30' : '#335E29');
        x.lineWidth = 1.05;
        x.beginPath(); x.moveTo(qx, qy); x.quadraticCurveTo(qx + nx * ll * 0.6, qy + ny * ll * 0.6, qx + nx * ll + dx / dl * 3, qy + ny * ll + ll * 0.55); x.stroke();
        x.beginPath(); x.moveTo(qx, qy); x.quadraticCurveTo(qx - nx * ll * 0.6, qy - ny * ll * 0.6, qx - nx * ll + dx / dl * 3, qy - ny * ll + ll * 0.55); x.stroke();
      }
    }
    // crown core
    var cg = x.createRadialGradient(topX, topY + 4, 1, topX, topY + 4, 12);
    cg.addColorStop(0, '#6B5A2E'); cg.addColorStop(1, 'rgba(70,60,30,0)');
    x.fillStyle = cg; ellipse(x, topX, topY + 4, 12, 10); x.fill();
  }

  function leafyTree(x, cx, baseY, h, seed, sunny) {
    var r = rng(seed);
    // trunk + limbs
    var tg = x.createLinearGradient(cx - 8, 0, cx + 8, 0);
    tg.addColorStop(0, '#6E5C48'); tg.addColorStop(0.4, '#9C8B74'); tg.addColorStop(1, '#4B3D2F');
    x.fillStyle = tg;
    x.beginPath(); x.moveTo(cx - 8, baseY); x.quadraticCurveTo(cx - 4, baseY - h * 0.3, cx - 5, baseY - h * 0.5);
    x.lineTo(cx + 5, baseY - h * 0.5); x.quadraticCurveTo(cx + 4, baseY - h * 0.3, cx + 9, baseY); x.closePath(); x.fill();
    x.strokeStyle = '#5E4E3C'; x.lineCap = 'round';
    x.lineWidth = 5; x.beginPath(); x.moveTo(cx, baseY - h * 0.45); x.quadraticCurveTo(cx - 20, baseY - h * 0.6, cx - 30, baseY - h * 0.75); x.stroke();
    x.lineWidth = 4; x.beginPath(); x.moveTo(cx, baseY - h * 0.48); x.quadraticCurveTo(cx + 18, baseY - h * 0.62, cx + 26, baseY - h * 0.8); x.stroke();
    // foliage: many clumps, lit from the top-left
    var cy = baseY - h * 0.72, R = h * 0.34;
    var n = 46;
    for (var pass = 0; pass < 3; pass++) {
      for (var i = 0; i < n; i++) {
        var a = r() * Math.PI * 2, d = Math.sqrt(r()) * R;
        var px = cx + Math.cos(a) * d * 1.15, py = cy + Math.sin(a) * d * 0.75;
        var pr = R * (0.22 + r() * 0.18);
        var base = pass === 0 ? '#2F4F25' : pass === 1 ? '#3F6A30' : '#5F8F42';
        if (pass === 2 && (px - cx) + (py - cy) > R * 0.3) continue;
        var g = x.createRadialGradient(px - pr * 0.3, py - pr * 0.4, pr * 0.1, px, py, pr);
        g.addColorStop(0, shade(base, sunny ? 0.22 : 0.1)); g.addColorStop(0.78, base); g.addColorStop(1, rgba(base, 0));
        x.fillStyle = g; ellipse(x, px, py + (pass === 0 ? 6 : 0), pr, pr * 0.85); x.fill();
      }
    }
    // individual leaf glints on the lit side
    for (var lf = 0; lf < 120; lf++) {
      var la = r() * Math.PI * 2, ld = Math.sqrt(r()) * R;
      var lx = cx + Math.cos(la) * ld * 1.1, ly = cy + Math.sin(la) * ld * 0.7;
      var litSide = (lx - cx) + (ly - cy) < 0;
      if (!litSide && r() < 0.7) continue;
      x.fillStyle = litSide ? (sunny ? 'rgba(170,210,110,0.5)' : 'rgba(130,170,90,0.35)') : 'rgba(30,55,25,0.25)';
      ellipse(x, lx, ly, 1.9, 1.1, r() * 3); x.fill();
    }
  }

  function lampPost(x, cx, baseY) {
    x.fillStyle = '#1F2A26';
    x.fillRect(cx - 5, baseY - 8, 10, 8);
    var g = x.createLinearGradient(cx - 3, 0, cx + 3, 0);
    g.addColorStop(0, '#1A2420'); g.addColorStop(0.4, '#4F6158'); g.addColorStop(1, '#141C19');
    x.fillStyle = g; x.fillRect(cx - 2.5, baseY - 140, 5, 132);
    // lantern
    x.fillStyle = '#1F2A26';
    x.beginPath(); x.moveTo(cx - 10, baseY - 150); x.lineTo(cx + 10, baseY - 150); x.lineTo(cx + 6, baseY - 140); x.lineTo(cx - 6, baseY - 140); x.closePath(); x.fill();
    var lg = x.createLinearGradient(0, baseY - 170, 0, baseY - 150);
    lg.addColorStop(0, 'rgba(255,245,215,0.75)'); lg.addColorStop(1, 'rgba(220,210,180,0.75)');
    x.fillStyle = lg;
    x.beginPath(); x.moveTo(cx - 8, baseY - 168); x.lineTo(cx + 8, baseY - 168); x.lineTo(cx + 10, baseY - 150); x.lineTo(cx - 10, baseY - 150); x.closePath(); x.fill();
    x.fillStyle = '#1F2A26';
    x.beginPath(); x.moveTo(cx - 11, baseY - 168); x.lineTo(cx, baseY - 180); x.lineTo(cx + 11, baseY - 168); x.closePath(); x.fill();
    x.fillRect(cx - 0.8, baseY - 168, 1.6, 18);
  }

  function bench(x, cx, baseY) {
    x.fillStyle = 'rgba(0,0,0,0.18)'; ellipse(x, cx, baseY + 1, 34, 3); x.fill();
    x.fillStyle = '#20302A';
    x.fillRect(cx - 28, baseY - 18, 3, 18); x.fillRect(cx + 25, baseY - 18, 3, 18);
    for (var i = 0; i < 3; i++) {
      var g = x.createLinearGradient(0, baseY - 22 - i * 7, 0, baseY - 18 - i * 7);
      g.addColorStop(0, '#9A6B3E'); g.addColorStop(1, '#6B4626');
      x.fillStyle = g; x.fillRect(cx - 32, baseY - 22 - i * 7 - (i ? 4 : 0), 64, 4);
    }
  }

  function plazaStrip(x, W, sunny) {
    // garden bed / low hedge between buildings and sidewalk
    var g = x.createLinearGradient(0, GROUND - 12, 0, GROUND + 4);
    g.addColorStop(0, '#5C8A3F'); g.addColorStop(1, '#3E6A2C');
    x.fillStyle = g; x.fillRect(0, GROUND - 10, W, 14);
    var r = rng(91);
    for (var i = 0; i < W; i += 6) {
      x.fillStyle = r() < 0.5 ? '#6FA04A' : '#4D7B35';
      ellipse(x, i + r() * 4, GROUND - 10 + r() * 3, 5 + r() * 3, 4); x.fill();
    }
    // flower dots
    for (var j = 0; j < W / 14; j++) {
      x.fillStyle = ['#F2C14E', '#E86A5C', '#F7F0E0', '#C54B8C'][j % 4];
      ellipse(x, r() * W, GROUND - 8 + r() * 8, 1.5, 1.5); x.fill();
    }
    void sunny;
  }

  // ---- background: beach promenade ----------------------------------
  function drawSea(x, W, weather) {
    var hor = 318;
    var g = x.createLinearGradient(0, hor, 0, 400);
    var deep = weather === 'rainy' ? '#3E5563' : weather === 'cloudy' ? '#4F6E80' : '#1F6E9C';
    var near = weather === 'rainy' ? '#6A7E87' : weather === 'cloudy' ? '#7C99A6' : '#3E9BBF';
    g.addColorStop(0, deep); g.addColorStop(1, near);
    x.fillStyle = g; x.fillRect(0, hor, W, 90);
    // distant hills with little houses (cerros de Valparaíso style)
    var r = rng(55);
    x.fillStyle = weather === 'rainy' ? '#7D8A86' : '#8FA48A';
    x.beginPath(); x.moveTo(0, hor + 2);
    for (var px = 0; px <= W * 0.42; px += 12) x.lineTo(px, hor - 26 - Math.sin(px / 60) * 14 + (px / (W * 0.42)) * 30 - r() * 3);
    x.lineTo(W * 0.42, hor + 2); x.closePath(); x.fill();
    var cols = ['#E6B84C', '#D9644B', '#6FA3C8', '#F1E6D0', '#9C6FB0', '#7DB87A'];
    for (var i = 0; i < W * 0.12; i++) {
      var hx = r() * W * 0.4, hy = hor - 4 - r() * (26 - hx / (W * 0.42) * 22);
      x.fillStyle = cols[i % cols.length]; x.globalAlpha = 0.75;
      x.fillRect(hx, hy, 3 + r() * 3, 3 + r() * 2);
      x.globalAlpha = 1;
    }
    // horizon haze
    var hz = x.createLinearGradient(0, hor - 8, 0, hor + 10);
    hz.addColorStop(0, 'rgba(255,255,255,0)'); hz.addColorStop(0.5, 'rgba(255,255,255,0.25)'); hz.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = hz; x.fillRect(0, hor - 8, W, 18);
    // sand
    var sg = x.createLinearGradient(0, 398, 0, GROUND);
    sg.addColorStop(0, '#E8D3A6'); sg.addColorStop(1, '#D7BC88');
    x.fillStyle = sg;
    x.beginPath(); x.moveTo(0, 404);
    for (var sx = 0; sx <= W; sx += 20) x.lineTo(sx, 400 + Math.sin(sx / 70) * 3);
    x.lineTo(W, GROUND); x.lineTo(0, GROUND); x.closePath(); x.fill();
    for (var k = 0; k < W / 3; k++) {
      x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(120,90,50,0.12)';
      x.fillRect(r() * W, 402 + r() * 26, 1.2, 1.2);
    }
    // beach umbrellas
    var ucol = [['#E04F3C', '#F6F0E2'], ['#2F7FC0', '#F6F0E2'], ['#F1B83C', '#E04F3C']];
    for (var u = 0; u < Math.floor(W / 220); u++) {
      var ux = 80 + u * 220 + r() * 60, uy = 418;
      x.strokeStyle = '#EEE'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(ux, uy); x.lineTo(ux + 2, uy - 30); x.stroke();
      for (var sgm = 0; sgm < 6; sgm++) {
        x.fillStyle = ucol[u % 3][sgm % 2];
        x.beginPath(); x.moveTo(ux + 2, uy - 34);
        x.arc(ux + 2, uy - 30, 22, Math.PI + sgm * Math.PI / 6, Math.PI + (sgm + 1) * Math.PI / 6);
        x.closePath(); x.fill();
      }
      x.fillStyle = 'rgba(0,0,0,0.12)'; ellipse(x, ux + 6, uy + 2, 20, 3); x.fill();
    }
    return hor;
  }

  function promenadeRail(x, W) {
    var y = GROUND;
    x.fillStyle = '#F2EFE8'; x.fillRect(0, y - 30, W, 5);
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, y - 25, W, 2);
    for (var i = 6; i < W; i += 14) {
      var g = x.createLinearGradient(i - 3, 0, i + 3, 0);
      g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#C9C4B8');
      x.fillStyle = g;
      x.beginPath(); x.moveTo(i - 2, y - 25); x.quadraticCurveTo(i - 5, y - 14, i - 2, y - 4); x.lineTo(i + 2, y - 4);
      x.quadraticCurveTo(i + 5, y - 14, i + 2, y - 25); x.closePath(); x.fill();
    }
    x.fillStyle = '#E6E1D6'; x.fillRect(0, y - 5, W, 6);
    for (var p = 0; p < W; p += 140) {
      x.fillStyle = '#F7F4EE'; x.fillRect(p, y - 36, 10, 36);
      x.fillStyle = 'rgba(0,0,0,0.15)'; x.fillRect(p + 7, y - 36, 3, 36);
    }
  }

  // ---- sidewalk -----------------------------------------------------
  function drawSidewalk(x, W, place, weather) {
    var wet = weather === 'rainy';
    var top = GROUND, bot = H;
    var base1 = place === 'playa' ? '#D9D1C3' : '#CBBFA9';
    var base2 = place === 'playa' ? '#BDB4A4' : '#A99B84';
    var g = x.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, wet ? shade(base1, -0.25) : base1);
    g.addColorStop(1, wet ? shade(base2, -0.3) : base2);
    x.fillStyle = g; x.fillRect(0, top, W, bot - top);
    // tile rows in perspective
    var vpX = W * 0.5, vpY = 150;
    var r = rng(17);
    var y = top, step = 9;
    while (y < bot) {
      var y2 = y + step;
      x.strokeStyle = wet ? 'rgba(30,30,40,0.35)' : 'rgba(80,65,45,0.28)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.18)';
      x.beginPath(); x.moveTo(0, y + 1); x.lineTo(W, y + 1); x.stroke();
      // per-tile tone variation
      var tw = step * 2.6;
      var off = (Math.round((y - top) / step) % 2) * tw * 0.5;
      for (var tx = -tw + off; tx < W + tw; tx += tw) {
        x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(60,40,20,0.05)';
        x.fillRect(tx + 1, y + 1.5, tw - 2, step - 2);
      }
      y = y2;
      step *= 1.11;
    }
    // vertical joints converging toward a vanishing point
    x.strokeStyle = wet ? 'rgba(30,30,40,0.25)' : 'rgba(80,65,45,0.18)';
    for (var vx = -W; vx < W * 2; vx += 34) {
      x.beginPath();
      var fx = lerp(vpX, vx, (top - vpY) / (bot - vpY));
      x.moveTo(fx, top); x.lineTo(vx, bot); x.stroke();
    }
    // curb shadow at the back edge
    var cg = x.createLinearGradient(0, top, 0, top + 10);
    cg.addColorStop(0, 'rgba(0,0,0,0.25)'); cg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = cg; x.fillRect(0, top, W, 10);
    if (wet) {
      // wet sheen: sky reflected in a soft band
      var sh = x.createLinearGradient(0, top, 0, bot);
      sh.addColorStop(0, 'rgba(180,195,210,0.18)'); sh.addColorStop(0.5, 'rgba(180,195,210,0.05)'); sh.addColorStop(1, 'rgba(180,195,210,0.15)');
      x.fillStyle = sh; x.fillRect(0, top, W, bot - top);
    }
  }

  // Build the whole static background into one offscreen canvas.
  function buildBackground(W, k, place, weather, sx) {
    var c = makeCanvas(W * k, H * k), x = c.getContext('2d');
    x.scale(k, k);
    var sunny = weather === 'sunny' || weather === 'hot';
    var rr = rng(2024);
    if (place === 'playa') {
      drawSea(x, W, weather);
      promenadeRail(x, W);
      drawSidewalk(x, W, place, weather);
      for (var p = 0; p < W; p += 260) palmTree(x, p + 60 + rr() * 50, GROUND - 2, 190 + rr() * 50, 300 + p, (rr() - 0.5) * 30);
      lampPost(x, W * 0.25, GROUND); lampPost(x, W * 0.82, GROUND);
    } else {
      drawAndes(x, W, weather, 7);
      // a row of colonial buildings: house | tower+church | house …
      // church beside the stand when there is room, else behind its left side
      var right = sx + STAND_W / 2 + 125;
      var churchX = right + 105 < W ? right : Math.max(150, sx - STAND_W / 2 + 10);
      var cf = churchFacade(x, churchX, sunny);
      bellTower(x, cf.x0 - 26, sunny);
      var walls = ['#E3B66B', '#D9907A', '#A9C3D1', '#E9D7AE', '#C9A27C'];
      var xx = cf.x0 - 58, wi = 0;
      while (xx > -10) {
        var w = 120 + rr() * 60, hgt = 120 + rr() * 30;
        colonialHouse(x, xx - w, w + 1, hgt, walls[wi % walls.length], sunny, rr);
        xx -= w; wi++;
      }
      xx = cf.x0 + cf.w;
      while (xx < W + 10) {
        var w2 = 110 + rr() * 60, h2 = 115 + rr() * 35;
        colonialHouse(x, xx, w2 + 1, h2, walls[(wi + 2) % walls.length], sunny, rr);
        xx += w2; wi++;
      }
      plazaStrip(x, W, sunny);
      drawSidewalk(x, W, place, weather);
      // trees & street furniture on the plaza edge
      leafyTree(x, W * 0.08, GROUND + 2, 210, 11, sunny);
      palmTree(x, W * 0.36, GROUND + 4, 250, 21, 6);
      leafyTree(x, Math.min(W - 40, churchX + 150), GROUND + 2, 200, 31, sunny);
      if (W > 800) palmTree(x, W * 0.92, GROUND + 4, 240, 41, -8);
      lampPost(x, W * 0.22, GROUND + 6);
      lampPost(x, churchX - 150 < W * 0.3 ? W * 0.8 : churchX - 150, GROUND + 6);
      bench(x, W * 0.5 - 170, GROUND + 4);
    }
    // weather tone on the whole background
    if (weather === 'rainy') { x.fillStyle = 'rgba(60,75,95,0.28)'; x.fillRect(0, 0, W, H); }
    else if (weather === 'cloudy') { x.fillStyle = 'rgba(120,130,150,0.12)'; x.fillRect(0, 0, W, H); }
    else if (weather === 'hot') { x.fillStyle = 'rgba(255,220,150,0.06)'; x.fillRect(0, 0, W, H); }
    return c;
  }

  // ---- the stand ----------------------------------------------------
  var STAND_W = 290;
  var STRIPES = {
    empanadas: ['#C8312B', '#F6EEDD'], mote: ['#D9622B', '#F6EEDD'], sopaipillas: ['#2D6A9F', '#F6EEDD'],
    limonada: ['#E6B422', '#F6EEDD'], helados: ['#D2527F', '#F6EEDD']
  };

  function woodPlank(x, x0, y0, w, h, tone, seed) {
    var r = rng(seed);
    var g = x.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, shade(tone, 0.06)); g.addColorStop(0.5, shade(tone, 0.12)); g.addColorStop(1, shade(tone, -0.12));
    x.fillStyle = g; x.fillRect(x0, y0, w, h);
    // grain
    x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip();
    for (var i = 0; i < 6; i++) {
      x.strokeStyle = 'rgba(60,30,10,' + (0.12 + r() * 0.12) + ')'; x.lineWidth = 0.7;
      var gx = x0 + r() * w;
      x.beginPath(); x.moveTo(gx, y0);
      x.bezierCurveTo(gx + (r() - 0.5) * 6, y0 + h * 0.3, gx + (r() - 0.5) * 6, y0 + h * 0.7, gx + (r() - 0.5) * 4, y0 + h);
      x.stroke();
    }
    if (r() < 0.5) {
      var kx = x0 + w * (0.3 + r() * 0.4), ky = y0 + h * (0.2 + r() * 0.6);
      x.fillStyle = 'rgba(70,35,12,0.45)'; ellipse(x, kx, ky, 2.4, 3.6); x.fill();
      x.strokeStyle = 'rgba(70,35,12,0.25)'; ellipse(x, kx, ky, 4, 6.5); x.stroke();
    }
    x.restore();
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(x0 + w - 1, y0, 1, h);
    x.fillStyle = 'rgba(255,230,190,0.25)'; x.fillRect(x0, y0, 1, h);
  }

  function nail(x, cx, cy) {
    x.fillStyle = '#3A3A3A'; ellipse(x, cx, cy, 1.4, 1.4); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.5)'; ellipse(x, cx - 0.4, cy - 0.4, 0.5, 0.5); x.fill();
  }

  // Back part of the stand (drawn before the vendor).
  function drawStandBack(x, sx, product) {
    var L = sx - STAND_W / 2, R = sx + STAND_W / 2;
    // back panel (shaded, under the awning)
    var g = x.createLinearGradient(0, 280, 0, COUNTER);
    g.addColorStop(0, '#5E3E24'); g.addColorStop(1, '#7A5434');
    x.fillStyle = g; x.fillRect(L + 14, 292, STAND_W - 28, COUNTER - 292);
    for (var i = L + 14; i < R - 14; i += 22) {
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(i, 292, 1, COUNTER - 292);
    }
    // a shelf with jars on the back wall
    x.fillStyle = '#8B6440'; x.fillRect(L + 26, 352, STAND_W - 52, 5);
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(L + 26, 357, STAND_W - 52, 3);
    var jars = ['#E8C36A', '#C9562C', '#7FA34E', '#E8E0C8'];
    for (var j = 0; j < 5; j++) {
      var jx = R - 50 - j * 22;
      x.fillStyle = 'rgba(230,240,245,0.55)'; rrect(x, jx, 334, 13, 18, 3); x.fill();
      x.fillStyle = jars[j % 4]; rrect(x, jx + 1.5, 340, 10, 11, 2); x.fill();
      x.fillStyle = '#B7462F'; x.fillRect(jx - 0.5, 331, 14, 4);
      x.fillStyle = 'rgba(255,255,255,0.6)'; x.fillRect(jx + 2.5, 336, 1.5, 12);
    }
    void product;
  }

  // Awning, poles and front panel (drawn after the vendor & product).
  function drawStandFront(x, sx, product, sunny, label) {
    var L = sx - STAND_W / 2, R = sx + STAND_W / 2;
    // poles
    [L + 6, R - 6].forEach(function(px) {
      var pg = x.createLinearGradient(px - 5, 0, px + 5, 0);
      pg.addColorStop(0, '#5B3A20'); pg.addColorStop(0.4, '#A8784A'); pg.addColorStop(1, '#4A2E18');
      x.fillStyle = pg; x.fillRect(px - 5, 284, 10, STAND_BASE - 284);
    });
    // front panel: vertical planks
    var pw = STAND_W / 11;
    for (var i = 0; i < 11; i++) {
      woodPlank(x, L + i * pw, COUNTER + 8, pw + 0.5, STAND_BASE - COUNTER - 8, i % 3 === 1 ? '#9A6B40' : (i % 3 === 2 ? '#8C5F37' : '#A3744A'), 100 + i);
    }
    // cross battens + nails
    [COUNTER + 18, STAND_BASE - 12].forEach(function(by) {
      woodPlank(x, L, by - 5, STAND_W, 10, '#7A522F', by);
      for (var n = 0; n < 11; n++) nail(x, L + n * pw + pw / 2, by);
    });
    // counter top: thick board with lit front edge
    var cg = x.createLinearGradient(0, COUNTER - 4, 0, COUNTER + 9);
    cg.addColorStop(0, '#C89A66'); cg.addColorStop(0.35, '#B58552'); cg.addColorStop(0.4, '#8A5D33'); cg.addColorStop(1, '#6E4826');
    x.fillStyle = cg; x.fillRect(L - 10, COUNTER - 4, STAND_W + 20, 13);
    x.fillStyle = 'rgba(255,240,210,0.35)'; x.fillRect(L - 10, COUNTER - 4, STAND_W + 20, 1.5);
    // painted name board
    var bw = 168, bh = 38, bx = sx - bw / 2 + 20, byy = COUNTER + 34;
    x.fillStyle = 'rgba(0,0,0,0.35)'; rrect(x, bx + 2, byy + 3, bw, bh, 4); x.fill();
    var bg = x.createLinearGradient(0, byy, 0, byy + bh);
    bg.addColorStop(0, '#F7EDD5'); bg.addColorStop(1, '#E6D5B1');
    x.fillStyle = bg; rrect(x, bx, byy, bw, bh, 4); x.fill();
    x.strokeStyle = (STRIPES[product] || STRIPES.empanadas)[0]; x.lineWidth = 2;
    rrect(x, bx + 4, byy + 4, bw - 8, bh - 8, 3); x.stroke();
    x.save();
    x.translate(bx + bw / 2, byy + bh / 2 + 1); x.rotate(-0.02);
    x.font = '800 21px "Baloo 2", "Nunito", sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = (STRIPES[product] || STRIPES.empanadas)[0];
    x.fillText(label, 0, 1);
    x.fillStyle = 'rgba(255,255,255,0.25)';
    x.fillText(label, -0.6, 0.2);
    x.restore();
    nail(x, bx + 8, byy + bh / 2); nail(x, bx + bw - 8, byy + bh / 2);
    // awning
    drawAwning(x, sx, product, sunny);
  }

  function drawAwning(x, sx, product, sunny) {
    var cols = STRIPES[product] || STRIPES.empanadas;
    var backW = STAND_W * 0.94, frontW = STAND_W + 34;
    var yb = 236, yf = 286;
    var n = 12;
    // shadow cast under the awning onto the back panel
    var sg = x.createLinearGradient(0, yf, 0, yf + 60);
    sg.addColorStop(0, 'rgba(20,10,5,' + (sunny ? 0.45 : 0.25) + ')'); sg.addColorStop(1, 'rgba(20,10,5,0)');
    x.fillStyle = sg; x.fillRect(sx - STAND_W / 2 + 10, yf, STAND_W - 20, 60);
    for (var i = 0; i < n; i++) {
      var f1 = i / n, f2 = (i + 1) / n;
      var bx1 = sx - backW / 2 + backW * f1, bx2 = sx - backW / 2 + backW * f2;
      var fx1 = sx - frontW / 2 + frontW * f1, fx2 = sx - frontW / 2 + frontW * f2;
      var col = cols[i % 2];
      var g = x.createLinearGradient(0, yb, 0, yf);
      g.addColorStop(0, shade(col, -0.18)); g.addColorStop(0.6, shade(col, sunny ? 0.06 : 0)); g.addColorStop(1, shade(col, -0.05));
      x.fillStyle = g;
      x.beginPath(); x.moveTo(bx1, yb); x.lineTo(bx2, yb); x.lineTo(fx2, yf); x.lineTo(fx1, yf); x.closePath(); x.fill();
      // fabric fold highlight
      x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 1.2;
      x.beginPath(); x.moveTo((bx1 + bx2) / 2, yb + 2); x.lineTo((fx1 + fx2) / 2, yf - 1); x.stroke();
    }
    // top roll bar
    var tg = x.createLinearGradient(0, yb - 6, 0, yb + 3);
    tg.addColorStop(0, '#8A8F94'); tg.addColorStop(0.5, '#D9DDE0'); tg.addColorStop(1, '#5D6266');
    x.fillStyle = tg; rrect(x, sx - backW / 2 - 4, yb - 5, backW + 8, 7, 3.5); x.fill();
    // scalloped valance
    var vy = yf, vh = 22, sw = frontW / n;
    for (var j = 0; j < n; j++) {
      var vx = sx - frontW / 2 + j * sw;
      var col2 = cols[j % 2];
      var vg = x.createLinearGradient(0, vy, 0, vy + vh + 8);
      vg.addColorStop(0, shade(col2, 0.04)); vg.addColorStop(1, shade(col2, -0.22));
      x.fillStyle = vg;
      x.beginPath(); x.moveTo(vx, vy); x.lineTo(vx + sw, vy); x.lineTo(vx + sw, vy + vh);
      x.quadraticCurveTo(vx + sw / 2, vy + vh + 14, vx, vy + vh); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(vx + sw, vy); x.lineTo(vx + sw, vy + vh); x.stroke();
    }
    // stitched hem line
    x.strokeStyle = 'rgba(255,255,255,0.55)'; x.setLineDash([3, 3]); x.lineWidth = 1;
    x.beginPath(); x.moveTo(sx - frontW / 2 + 2, vy + 4); x.lineTo(sx + frontW / 2 - 2, vy + 4); x.stroke();
    x.setLineDash([]);
    x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(sx - frontW / 2, vy, frontW, 2);
  }

  // Chalkboard A-frame price sign, hand-lettered.
  function drawPriceSign(ctx, cx, baseY, price, shortName, soldOut) {
    var w = 84, h = 106, top = baseY - h - 14;
    // legs
    ctx.strokeStyle = '#5B3A20'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - w / 2 + 6, top + 10); ctx.lineTo(cx - w / 2 - 4, baseY);
    ctx.moveTo(cx + w / 2 - 6, top + 10); ctx.lineTo(cx + w / 2 + 4, baseY); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(ctx, cx, baseY + 2, w * 0.6, 4); ctx.fill();
    // wooden frame
    var fg = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    fg.addColorStop(0, '#8A5C34'); fg.addColorStop(0.5, '#B27F4E'); fg.addColorStop(1, '#6E4626');
    ctx.fillStyle = fg; rrect(ctx, cx - w / 2, top, w, h, 5); ctx.fill();
    // slate
    var sg = ctx.createLinearGradient(0, top, 0, top + h);
    sg.addColorStop(0, '#2E3B36'); sg.addColorStop(1, '#1F2925');
    ctx.fillStyle = sg; rrect(ctx, cx - w / 2 + 6, top + 6, w - 12, h - 12, 3); ctx.fill();
    // chalk smudges
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ellipse(ctx, cx - 10, top + 30, 26, 10, 0.2); ctx.fill();
    ellipse(ctx, cx + 8, top + 76, 22, 8, -0.3); ctx.fill();
    ctx.save();
    ctx.translate(cx, top + 6);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var chalk = function(txt, y, size, col, rot) {
      ctx.save(); ctx.translate(0, y); ctx.rotate(rot || 0);
      ctx.font = '800 ' + size + 'px "Baloo 2", "Nunito", sans-serif';
      var offs = [[0, 0, 0.85], [0.7, 0.4, 0.35], [-0.6, -0.3, 0.3]];
      for (var o = 0; o < offs.length; o++) {
        ctx.fillStyle = rgba(col, offs[o][2]);
        ctx.fillText(txt, offs[o][0], offs[o][1]);
      }
      ctx.restore();
    };
    chalk(shortName, 16, shortName.length > 9 ? 12 : 14, '#F3EFD8', -0.03);
    ctx.strokeStyle = 'rgba(243,239,216,0.6)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-26, 27); ctx.quadraticCurveTo(0, 31, 26, 26); ctx.stroke();
    if (soldOut) {
      chalk('¡AGOTADO!', 52, 15, '#FF8A80', -0.08);
      chalk('mañana más', 74, 11, '#F3EFD8', 0.02);
    } else {
      var p = money(price);
      chalk(p, 55, p.length > 6 ? 20 : 24, '#FFE38A', -0.05);
      chalk('c/u', 78, 11, '#F3EFD8', 0.02);
      // a little chalk star
      ctx.strokeStyle = 'rgba(255,227,138,0.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var s = 0; s < 5; s++) {
        var a = -Math.PI / 2 + s * Math.PI * 4 / 5;
        ctx[s ? 'lineTo' : 'moveTo'](28 + Math.cos(a) * 5, 80 + Math.sin(a) * 5);
      }
      ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
  }

  // ---- products -----------------------------------------------------
  function empanada(x, cx, cy, s, rot, tint) {
    x.save(); x.translate(cx, cy); x.rotate(rot || 0); x.scale(s, s);
    // shadow
    x.fillStyle = 'rgba(60,30,5,0.35)'; ellipse(x, 1, 7, 17, 3.5); x.fill();
    // body: half moon
    var g = x.createLinearGradient(0, -12, 0, 8);
    g.addColorStop(0, shade('#E0A24E', 0.15 + (tint || 0)));
    g.addColorStop(0.6, shade('#C9823A', tint || 0));
    g.addColorStop(1, '#8F5420');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(-17, 6); x.bezierCurveTo(-17, -13, 17, -13, 17, 6); x.closePath(); x.fill();
    // browned spots
    x.fillStyle = 'rgba(120,60,15,0.28)';
    ellipse(x, -6, -4, 4, 2); x.fill(); ellipse(x, 7, -2, 3, 1.6); x.fill();
    // egg-wash shine
    x.fillStyle = 'rgba(255,240,200,0.45)';
    ellipse(x, -3, -6.5, 8, 2.2, -0.15); x.fill();
    // repulgue: braided edge along the bottom
    for (var i = 0; i < 9; i++) {
      var px = -15 + i * 3.75;
      var rg = x.createLinearGradient(0, 3, 0, 9);
      rg.addColorStop(0, '#E7AE5C'); rg.addColorStop(1, '#9C5E24');
      x.fillStyle = rg;
      ellipse(x, px, 6, 2.4, 2.4, 0.6); x.fill();
      x.strokeStyle = 'rgba(110,55,15,0.5)'; x.lineWidth = 0.6;
      x.beginPath(); x.arc(px, 6, 2.2, 0.2, 2.2); x.stroke();
    }
    x.restore();
  }

  function cupMote(x, cx, by, s) {
    x.save(); x.translate(cx, by); x.scale(s, s);
    x.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(x, 0, 0, 10, 2.5); x.fill();
    // liquid
    var lg = x.createLinearGradient(-9, 0, 9, 0);
    lg.addColorStop(0, '#9A4E14'); lg.addColorStop(0.45, '#D88A3C'); lg.addColorStop(1, '#8A420F');
    x.fillStyle = lg;
    x.beginPath(); x.moveTo(-8, -1); x.lineTo(-10, -26); x.lineTo(10, -26); x.lineTo(8, -1); x.closePath(); x.fill();
    // mote grains at the bottom
    x.fillStyle = '#F1E2B8';
    for (var i = 0; i < 16; i++) { ellipse(x, -7 + (i % 8) * 2, -3 - Math.floor(i / 8) * 2.2 - (i % 3) * 0.4, 1, 0.8); x.fill(); }
    // huesillo
    var hg = x.createRadialGradient(-2, -24, 1, 0, -22, 7);
    hg.addColorStop(0, '#F2B266'); hg.addColorStop(1, '#A85A1B');
    x.fillStyle = hg; ellipse(x, 1, -22, 6.5, 5); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.5)'; ellipse(x, -1.5, -24.5, 2, 1); x.fill();
    // clear plastic cup
    x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(-8.5, 0); x.lineTo(-11, -30); x.lineTo(11, -30); x.lineTo(8.5, 0); x.closePath(); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.12)';
    x.beginPath(); x.moveTo(-8.5, 0); x.lineTo(-11, -30); x.lineTo(11, -30); x.lineTo(8.5, 0); x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(-8.5, -28, 1.6, 25);
    ellipse(x, 0, -30, 11, 1.6); x.strokeStyle = 'rgba(255,255,255,0.85)'; x.stroke();
    // spoon
    x.strokeStyle = '#E9E9E9'; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(4, -20); x.lineTo(8, -38); x.stroke();
    x.restore();
  }

  function moteJar(x, cx, by, fill) {
    // big glass bowl dispenser
    var w = 54, h = 62;
    x.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(x, cx, by, w * 0.55, 4); x.fill();
    x.save();
    x.beginPath(); x.moveTo(cx - w / 2 + 6, by); x.bezierCurveTo(cx - w / 2 - 6, by - h * 0.5, cx - w / 2, by - h, cx - w / 2 + 8, by - h);
    x.lineTo(cx + w / 2 - 8, by - h); x.bezierCurveTo(cx + w / 2, by - h, cx + w / 2 + 6, by - h * 0.5, cx + w / 2 - 6, by); x.closePath();
    x.clip();
    var lvl = by - 4 - (h - 12) * clamp(fill, 0, 1);
    var lg = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    lg.addColorStop(0, '#8A3F0C'); lg.addColorStop(0.4, '#D98A3A'); lg.addColorStop(1, '#7A360A');
    x.fillStyle = lg; x.fillRect(cx - w, lvl, w * 2, by - lvl);
    if (fill > 0.05) {
      x.fillStyle = '#F1E2B8';
      x.fillStyle = 'rgba(236,222,180,0.85)';
      for (var i = 0; i < 46; i++) { ellipse(x, cx - 20 + ((i * 37.7) % 40), by - 4 - ((i * 13.1) % 8), 0.9, 0.7, i); x.fill(); }
      var nP = Math.ceil(fill * 6);
      for (var j = 0; j < nP; j++) {
        var hx = cx - 16 + j * 7, hy = lvl + 6 + (j % 2) * 9;
        var hg = x.createRadialGradient(hx - 2, hy - 2, 1, hx, hy, 6);
        hg.addColorStop(0, '#F5B86C'); hg.addColorStop(1, '#A4561A');
        x.fillStyle = hg; ellipse(x, hx, hy, 5.5, 4.5); x.fill();
      }
      x.fillStyle = 'rgba(255,220,160,0.35)'; x.fillRect(cx - w, lvl, w * 2, 2);
    }
    x.restore();
    // glass
    x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(cx - w / 2 + 6, by); x.bezierCurveTo(cx - w / 2 - 6, by - h * 0.5, cx - w / 2, by - h, cx - w / 2 + 8, by - h);
    x.lineTo(cx + w / 2 - 8, by - h); x.bezierCurveTo(cx + w / 2, by - h, cx + w / 2 + 6, by - h * 0.5, cx + w / 2 - 6, by); x.closePath(); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.4)';
    x.beginPath(); x.moveTo(cx - w / 2 + 4, by - 10); x.quadraticCurveTo(cx - w / 2 - 1, by - h * 0.5, cx - w / 2 + 6, by - h + 6); x.lineTo(cx - w / 2 + 9, by - h + 8);
    x.quadraticCurveTo(cx - w / 2 + 3, by - h * 0.5, cx - w / 2 + 8, by - 10); x.closePath(); x.fill();
    // ladle
    x.strokeStyle = '#B9BEC2'; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(cx + 8, by - h * 0.4); x.lineTo(cx + 20, by - h - 12); x.stroke();
  }

  function sopaipilla(x, cx, cy, s) {
    x.save(); x.translate(cx, cy); x.scale(s, s * 0.42);
    var g = x.createRadialGradient(-3, -3, 1, 0, 0, 12);
    g.addColorStop(0, '#F4B451'); g.addColorStop(0.7, '#DC8A2A'); g.addColorStop(1, '#A65A14');
    x.fillStyle = g; ellipse(x, 0, 0, 12, 12); x.fill();
    x.fillStyle = 'rgba(120,60,10,0.55)';
    for (var i = 0; i < 4; i++) { ellipse(x, -4 + (i % 2) * 8, -4 + Math.floor(i / 2) * 8, 1.1, 1.1); x.fill(); }
    x.fillStyle = 'rgba(255,240,200,0.35)'; ellipse(x, -3, -5, 5, 3); x.fill();
    x.restore();
  }

  function pebreBowl(x, cx, by) {
    x.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(x, cx, by, 20, 3.5); x.fill();
    // greda (clay) bowl from Pomaire
    var g = x.createLinearGradient(cx - 18, 0, cx + 18, 0);
    g.addColorStop(0, '#5A2814'); g.addColorStop(0.4, '#9A4B26'); g.addColorStop(1, '#4E2210');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(cx - 18, by - 14); x.quadraticCurveTo(cx - 16, by, cx, by); x.quadraticCurveTo(cx + 16, by, cx + 18, by - 14); x.closePath(); x.fill();
    x.fillStyle = '#B33A22'; ellipse(x, cx, by - 14, 18, 4); x.fill();
    var cols = ['#E1442B', '#3E8E3A', '#F5E9C8', '#C22A18'];
    for (var i = 0; i < 22; i++) { x.fillStyle = cols[i % 4]; ellipse(x, cx - 14 + (i * 5.3) % 28, by - 15 + (i % 3) * 1.2, 1.3, 0.8); x.fill(); }
    x.strokeStyle = '#6E3218'; x.lineWidth = 1; ellipse(x, cx, by - 14, 18, 4); x.stroke();
  }

  function lemonJug(x, cx, by, fill) {
    var w = 48, h = 78;
    x.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(x, cx, by, w * 0.6, 4); x.fill();
    // stand + tap
    x.fillStyle = '#C9CDD0'; x.fillRect(cx - 4, by - 18, 8, 6);
    x.fillStyle = '#9AA0A5'; x.fillRect(cx - 1.5, by - 13, 3, 5);
    var top = by - 20 - h;
    x.save(); rrect(x, cx - w / 2, top, w, h, 8); x.clip();
    var lvl = top + h - (h - 10) * clamp(fill, 0, 1);
    var lg = x.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    lg.addColorStop(0, '#E3C33D'); lg.addColorStop(0.45, '#FFF0A0'); lg.addColorStop(1, '#D4AE25');
    x.fillStyle = lg; x.fillRect(cx - w, lvl, w * 2, top + h - lvl);
    if (fill > 0.04) {
      // ice cubes, lemon slices, mint
      for (var i = 0; i < 4; i++) {
        x.fillStyle = 'rgba(255,255,255,0.45)';
        rrect(x, cx - 16 + i * 8, lvl + 3 + (i % 2) * 4, 8, 7, 2); x.fill();
      }
      for (var j = 0; j < 3; j++) {
        var lx = cx - 12 + j * 12, ly = lvl + 18 + j * 10;
        if (ly > top + h - 6) break;
        x.fillStyle = '#F7E36A'; ellipse(x, lx, ly, 7, 7); x.fill();
        x.strokeStyle = '#FFFBE0'; x.lineWidth = 0.8;
        for (var sg = 0; sg < 6; sg++) { x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx + Math.cos(sg) * 6, ly + Math.sin(sg) * 6); x.stroke(); }
        x.strokeStyle = '#C9A71A'; x.lineWidth = 1.2; ellipse(x, lx, ly, 7, 7); x.stroke();
      }
      x.fillStyle = '#3E8E3A';
      ellipse(x, cx + 10, lvl + 8, 5, 2.2, 0.6); x.fill(); ellipse(x, cx - 8, lvl + 34, 5, 2.2, -0.5); x.fill();
    }
    x.restore();
    // glass body
    x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 1.5; rrect(x, cx - w / 2, top, w, h, 8); x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.32)'; x.fillRect(cx - w / 2 + 4, top + 6, 4, h - 14);
    // condensation droplets
    x.fillStyle = 'rgba(255,255,255,0.6)';
    for (var d = 0; d < 12; d++) { ellipse(x, cx - 18 + (d * 9.7) % 36, top + 14 + (d * 13.3) % (h - 20), 0.9, 1.3); x.fill(); }
    // lid
    x.fillStyle = '#D7DADD'; rrect(x, cx - w / 2 - 2, top - 6, w + 4, 8, 3); x.fill();
  }

  function glassLemon(x, cx, by, s) {
    x.save(); x.translate(cx, by); x.scale(s, s);
    x.fillStyle = 'rgba(0,0,0,0.2)'; ellipse(x, 0, 0, 8, 2); x.fill();
    var lg = x.createLinearGradient(-7, 0, 7, 0);
    lg.addColorStop(0, '#E6C640'); lg.addColorStop(0.5, '#FFF2A8'); lg.addColorStop(1, '#D7B22A');
    x.fillStyle = lg; x.fillRect(-7, -22, 14, 21);
    x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 1; x.strokeRect(-7.5, -26, 15, 26);
    x.fillStyle = '#F7E36A'; ellipse(x, 6, -25, 5, 5); x.fill();
    x.strokeStyle = '#C9A71A'; ellipse(x, 6, -25, 5, 5); x.stroke();
    x.strokeStyle = '#E0473A'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-2, -20); x.lineTo(-4, -36); x.stroke();
    x.restore();
  }

  function paleta(x, cx, by, s, col, rot) {
    x.save(); x.translate(cx, by); x.rotate(rot || 0); x.scale(s, s);
    x.fillStyle = '#E8D3A8'; x.fillRect(-1.5, -6, 3, 12);
    var g = x.createLinearGradient(-6, 0, 6, 0);
    g.addColorStop(0, shade(col, -0.2)); g.addColorStop(0.4, shade(col, 0.2)); g.addColorStop(1, shade(col, -0.25));
    x.fillStyle = g; rrect(x, -6, -30, 12, 25, 5); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(-4, -27, 1.6, 18);
    x.fillStyle = 'rgba(0,0,0,0.25)';
    for (var i = 0; i < 4; i++) { ellipse(x, -2 + (i % 2) * 4, -22 + i * 4, 0.6, 0.6); x.fill(); }
    x.restore();
  }

  function cooler(x, cx, by, n) {
    var w = 96, h = 40;
    x.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(x, cx, by, w * 0.55, 4); x.fill();
    var g = x.createLinearGradient(0, by - h, 0, by);
    g.addColorStop(0, '#3D8FD1'); g.addColorStop(1, '#1F5E96');
    x.fillStyle = g; rrect(x, cx - w / 2, by - h, w, h, 5); x.fill();
    x.fillStyle = '#F4F6F8'; rrect(x, cx - w / 2 - 2, by - h - 4, w + 4, 8, 3); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(cx - w / 2 + 4, by - h + 6, w - 8, 2);
    x.fillStyle = '#FFFFFF'; x.font = '800 10px "Nunito", sans-serif'; x.textAlign = 'center';
    x.fillText('HELADOS', cx, by - 12);
    var cols = ['#E2425A', '#F29A2E', '#C9A27A', '#7BC46B', '#E2425A'];
    var vis = Math.min(n, 14);
    for (var i = 0; i < vis; i++) {
      paleta(x, cx - 38 + (i % 7) * 12.5, by - h - 2 - (i >= 7 ? 4 : 0), 0.85, cols[i % cols.length], (i % 2 ? 0.08 : -0.06));
    }
    // frost mist
    var fg = x.createLinearGradient(0, by - h - 30, 0, by - h);
    fg.addColorStop(0, 'rgba(255,255,255,0)'); fg.addColorStop(1, 'rgba(255,255,255,0.25)');
    x.fillStyle = fg; x.fillRect(cx - w / 2, by - h - 30, w, 30);
  }

  function basket(x, cx, by, w) {
    var h = 18;
    x.fillStyle = 'rgba(0,0,0,0.28)'; ellipse(x, cx, by + 1, w * 0.55, 4); x.fill();
    var g = x.createLinearGradient(0, by - h, 0, by);
    g.addColorStop(0, '#C79A55'); g.addColorStop(1, '#8B6230');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(cx - w / 2, by - h); x.lineTo(cx + w / 2, by - h); x.lineTo(cx + w / 2 - 6, by); x.lineTo(cx - w / 2 + 6, by); x.closePath(); x.fill();
    // weave
    x.strokeStyle = 'rgba(90,55,20,0.6)'; x.lineWidth = 0.8;
    for (var r = 0; r < 3; r++) {
      for (var i = 0; i < w / 6; i++) {
        var px = cx - w / 2 + 4 + i * 6 + (r % 2) * 3;
        x.beginPath(); x.arc(px, by - h + 4 + r * 5.5, 2.6, Math.PI * 0.1, Math.PI * 0.9); x.stroke();
      }
    }
    // checked cloth peeking out
    x.fillStyle = '#F2E8D6';
    x.beginPath(); x.moveTo(cx - w / 2 - 3, by - h); x.lineTo(cx - w / 2 + 10, by - h - 5); x.lineTo(cx - w / 2 + 6, by - h + 9); x.closePath(); x.fill();
    x.fillStyle = '#C8312B';
    x.fillRect(cx - w / 2 + 1, by - h - 2, 3, 3); x.fillRect(cx - w / 2 + 5, by - h + 2, 3, 3);
    x.fillStyle = '#D9B270'; x.fillRect(cx - w / 2, by - h - 2, w, 3);
  }

  function tray(x, cx, by, w) {
    x.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(x, cx, by + 1, w * 0.55, 3.5); x.fill();
    var g = x.createLinearGradient(0, by - 6, 0, by);
    g.addColorStop(0, '#E5E8EA'); g.addColorStop(0.5, '#AEB4B8'); g.addColorStop(1, '#7D8489');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(cx - w / 2, by - 6); x.lineTo(cx + w / 2, by - 6); x.lineTo(cx + w / 2 - 4, by); x.lineTo(cx - w / 2 + 4, by); x.closePath(); x.fill();
    // paper liner
    x.fillStyle = '#F6EFDF'; x.fillRect(cx - w / 2 + 6, by - 7, w - 12, 2);
  }

  function cashTin(x, cx, by, coins) {
    x.fillStyle = 'rgba(0,0,0,0.3)'; ellipse(x, cx, by, 17, 3); x.fill();
    var g = x.createLinearGradient(cx - 15, 0, cx + 15, 0);
    g.addColorStop(0, '#2D5E7C'); g.addColorStop(0.4, '#5FA0C4'); g.addColorStop(1, '#22495F');
    x.fillStyle = g; x.fillRect(cx - 15, by - 16, 30, 16);
    x.fillStyle = '#E4C55A'; x.fillRect(cx - 15, by - 12, 30, 2.5);
    // coins inside (open tin)
    var cg = x.createLinearGradient(0, by - 19, 0, by - 14);
    cg.addColorStop(0, '#F7DE7A'); cg.addColorStop(1, '#B88A22');
    var n = Math.min(10, coins);
    for (var i = 0; i < n; i++) {
      x.fillStyle = i % 3 === 2 ? '#C8CCD0' : cg;
      ellipse(x, cx - 10 + (i * 7) % 20, by - 16 - Math.floor(i / 3) * 1.4, 4, 1.8); x.fill();
    }
    // a folded bill
    if (coins > 3) {
      x.fillStyle = '#B66BA8'; x.fillRect(cx + 3, by - 22, 14, 7);
      x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(cx + 5, by - 21, 4, 5);
    }
  }

  // Product on the counter. stock = fresh units; full = units made; old = day-old
  function drawProduct(x, sx, product, stock, full, old, t) {
    var L = sx - STAND_W / 2;
    var y = COUNTER - 2;
    var frac = full > 0 ? stock / full : 0;
    var i;
    if (product === 'empanadas') {
      var bw = 132;
      basket(x, sx + 50, y, bw);
      var vis = Math.min(stock, 12);
      // pyramid rows (bottom row first)
      var rows = [5, 4, 3];
      var idx = 0;
      for (var r = 0; r < rows.length && idx < vis; r++) {
        for (i = 0; i < rows[r] && idx < vis; i++, idx++) {
          var ex = sx + 50 - (rows[r] - 1) * 12 + i * 24;
          empanada(x, ex, y - 24 - r * 13, 0.86, (i % 2 ? 0.08 : -0.06), (idx % 3) * 0.03);
        }
      }
      if (old > 0) {
        // day-old plate at the left with a ½ tag
        x.fillStyle = 'rgba(0,0,0,0.2)'; ellipse(x, L + 78, y + 1, 26, 3.5); x.fill();
        x.fillStyle = '#F4F1EA'; ellipse(x, L + 78, y - 2, 26, 5); x.fill();
        x.strokeStyle = '#C9C3B5'; ellipse(x, L + 78, y - 2, 20, 3.5); x.stroke();
        for (i = 0; i < Math.min(old, 4); i++) empanada(x, L + 66 + i * 8, y - 8 - (i % 2) * 3, 0.5, 0, -0.12);
        x.fillStyle = '#FFF7D6'; rrect(x, L + 92, y - 30, 22, 14, 3); x.fill();
        x.strokeStyle = '#B45309'; x.lineWidth = 1; rrect(x, L + 92, y - 30, 22, 14, 3); x.stroke();
        x.fillStyle = '#B45309'; x.font = '800 10px "Nunito", sans-serif'; x.textAlign = 'center'; x.fillText('½ $', L + 103, y - 20);
      }
    } else if (product === 'mote') {
      moteJar(x, sx + 92, y, full > 0 ? clamp(frac * 1.05, 0, 1) : 0);
      var cups = Math.min(stock, 6);
      for (i = 0; i < cups; i++) cupMote(x, sx - 26 + i * 15, y, 0.82);
    } else if (product === 'sopaipillas') {
      tray(x, sx + 40, y, 120);
      var vs = Math.min(stock, 24), si = 0;
      for (var col = 0; col < 6 && si < vs; col++) {
        for (var st = 0; st < 4 && si < vs; st++, si++) {
          sopaipilla(x, sx - 4 + col * 18, y - 9 - st * 4.2, 0.85);
        }
      }
      pebreBowl(x, sx + 120, y);
    } else if (product === 'limonada') {
      lemonJug(x, sx + 70, y, full > 0 ? clamp(frac * 1.05, 0, 1) : 0);
      var gl = Math.min(stock, 4);
      for (i = 0; i < gl; i++) glassLemon(x, sx + 4 + i * 17, y, 0.95);
      // lemons in a bowl
      x.fillStyle = '#E8E4DA'; ellipse(x, sx + 124, y - 4, 18, 5); x.fill();
      for (i = 0; i < 4; i++) {
        var lg = x.createRadialGradient(sx + 114 + i * 7 - 2, y - 11 - (i % 2) * 4, 1, sx + 114 + i * 7, y - 9 - (i % 2) * 4, 7);
        lg.addColorStop(0, '#FFF59A'); lg.addColorStop(1, '#D9B514');
        x.fillStyle = lg; ellipse(x, sx + 114 + i * 7, y - 9 - (i % 2) * 4, 6.5, 5); x.fill();
      }
    } else if (product === 'helados') {
      cooler(x, sx + 60, y, stock);
    }
    void t;
  }

  // Front-facing kid vendor behind the counter.
  function drawVendor(x, vx, t, serving) {
    var bob = Math.sin(t * 2.2) * 1.2;
    var cy = 352 + bob;
    // torso + apron
    var tg = x.createLinearGradient(vx - 24, 0, vx + 24, 0);
    tg.addColorStop(0, '#2E6EA6'); tg.addColorStop(0.5, '#3F86C2'); tg.addColorStop(1, '#245A8A');
    x.fillStyle = tg;
    x.beginPath(); x.moveTo(vx - 22, COUNTER); x.lineTo(vx - 22, cy + 30); x.quadraticCurveTo(vx - 22, cy + 18, vx - 10, cy + 16);
    x.lineTo(vx + 10, cy + 16); x.quadraticCurveTo(vx + 22, cy + 18, vx + 22, cy + 30); x.lineTo(vx + 22, COUNTER); x.closePath(); x.fill();
    x.fillStyle = '#F4EEE2';
    x.beginPath(); x.moveTo(vx - 13, COUNTER); x.lineTo(vx - 13, cy + 34); x.lineTo(vx + 13, cy + 34); x.lineTo(vx + 13, COUNTER); x.closePath(); x.fill();
    x.strokeStyle = '#F4EEE2'; x.lineWidth = 2.2;
    x.beginPath(); x.moveTo(vx - 11, cy + 34); x.lineTo(vx - 6, cy + 17); x.moveTo(vx + 11, cy + 34); x.lineTo(vx + 6, cy + 17); x.stroke();
    x.fillStyle = '#C8312B'; x.fillRect(vx - 8, cy + 44, 16, 9);
    // arms
    x.lineCap = 'round';
    x.strokeStyle = '#3577B2'; x.lineWidth = 9;
    var reach = serving ? 1 : 0;
    x.beginPath(); x.moveTo(vx - 20, cy + 24); x.quadraticCurveTo(vx - 34 - reach * 10, cy + 40, vx - 30 - reach * 26, COUNTER - 8 - reach * 6); x.stroke();
    x.beginPath(); x.moveTo(vx + 20, cy + 24); x.quadraticCurveTo(vx + 32, cy + 42, vx + 26, COUNTER - 6); x.stroke();
    x.fillStyle = '#E8B58E';
    ellipse(x, vx - 30 - reach * 26, COUNTER - 8 - reach * 6, 4.5, 4.5); x.fill();
    ellipse(x, vx + 26, COUNTER - 6, 4.5, 4.5); x.fill();
    if (serving) {
      x.fillStyle = '#F7EAD0'; rrect(x, vx - 64, COUNTER - 22, 14, 10, 2); x.fill();
    }
    // neck + head
    x.fillStyle = '#D9A47E'; x.fillRect(vx - 5, cy + 6, 10, 12);
    var hg = x.createRadialGradient(vx - 5, cy - 8, 3, vx, cy - 2, 20);
    hg.addColorStop(0, '#F3C9A4'); hg.addColorStop(1, '#D29C76');
    x.fillStyle = hg; ellipse(x, vx, cy - 2, 16, 18); x.fill();
    // ears
    x.fillStyle = '#E0AC86'; ellipse(x, vx - 16, cy, 3, 4.5); x.fill(); ellipse(x, vx + 16, cy, 3, 4.5); x.fill();
    // hair
    x.fillStyle = '#3B2414';
    x.beginPath(); x.moveTo(vx - 17, cy - 2); x.quadraticCurveTo(vx - 19, cy - 24, vx, cy - 22); x.quadraticCurveTo(vx + 19, cy - 24, vx + 17, cy - 2);
    x.quadraticCurveTo(vx + 12, cy - 14, vx + 2, cy - 13); x.quadraticCurveTo(vx - 10, cy - 15, vx - 17, cy - 2); x.closePath(); x.fill();
    // cap
    x.fillStyle = '#C8312B';
    x.beginPath(); x.moveTo(vx - 17, cy - 10); x.quadraticCurveTo(vx, cy - 32, vx + 17, cy - 10); x.closePath(); x.fill();
    x.fillStyle = '#A32722'; ellipse(x, vx, cy - 10, 20, 3.5); x.fill();
    // face
    var blink = (Math.floor(t * 10) % 37) === 0;
    x.fillStyle = '#2A1A10';
    if (blink) { x.fillRect(vx - 8, cy - 1, 5, 1.2); x.fillRect(vx + 3, cy - 1, 5, 1.2); }
    else { ellipse(x, vx - 5.5, cy - 1, 1.9, 2.3); x.fill(); ellipse(x, vx + 5.5, cy - 1, 1.9, 2.3); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,0.8)'; ellipse(x, vx - 5, cy - 1.8, 0.6, 0.6); x.fill(); ellipse(x, vx + 6, cy - 1.8, 0.6, 0.6); x.fill();
    x.fillStyle = 'rgba(230,110,100,0.35)'; ellipse(x, vx - 9, cy + 5, 3.5, 2); x.fill(); ellipse(x, vx + 9, cy + 5, 3.5, 2); x.fill();
    x.strokeStyle = '#8A3A2A'; x.lineWidth = 1.4;
    x.beginPath(); x.arc(vx, cy + 5, serving ? 5 : 4, 0.2, Math.PI - 0.2); x.stroke();
    x.strokeStyle = 'rgba(150,90,60,0.6)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(vx, cy + 1); x.lineTo(vx + 1, cy + 3); x.stroke();
  }

  // ---- people -------------------------------------------------------
  var SKINS = ['#F2CDB0', '#E5B391', '#D49E78', '#C08562', '#A76E4D', '#F6D9C2', '#8E5C3E'];
  var HAIRS = ['#2B1B10', '#3E2717', '#5C3A20', '#8A5A30', '#C99A5A', '#151515', '#6B4B2E'];
  var TOPS = ['#C0392B', '#2E86C1', '#27AE60', '#F1C40F', '#8E44AD', '#E67E22', '#ECEFF1', '#34495E', '#16A085', '#D35400', '#F28DB2', '#1F3A93', '#7F8C8D', '#A3D9E8'];
  var BOTTOMS = ['#2C3E50', '#34495E', '#566573', '#1B4F72', '#7B5E3B', '#D9C7A5', '#212F3D', '#4A6FA5'];

  function makePerson(r, ctxInfo) {
    var weather = ctxInfo.weather, ev = ctxInfo.event || {};
    var roll = r();
    var kind = roll < 0.2 ? 'child' : roll < 0.32 ? 'elder' : (r() < 0.5 ? 'man' : 'woman');
    var p = {
      kind: kind,
      h: kind === 'child' ? 112 + r() * 24 : kind === 'elder' ? 158 + r() * 14 : (kind === 'man' ? 170 + r() * 16 : 160 + r() * 14),
      skin: SKINS[Math.floor(r() * SKINS.length)],
      hair: kind === 'elder' ? (r() < 0.6 ? '#BDBDBD' : '#8C8C8C') : HAIRS[Math.floor(r() * HAIRS.length)],
      top: TOPS[Math.floor(r() * TOPS.length)],
      bottom: BOTTOMS[Math.floor(r() * BOTTOMS.length)],
      shoe: r() < 0.5 ? '#2A2A2A' : (r() < 0.5 ? '#6B4B2E' : '#F2F2F2'),
      sleeves: weather === 'rainy' || weather === 'cloudy' ? 'long' : (r() < 0.75 ? 'short' : 'long'),
      bottomType: 'pants', hairStyle: 'short', hat: null, acc: null, jersey: false, manta: null
    };
    if (kind === 'woman') {
      p.hairStyle = ['long', 'bun', 'ponytail', 'long', 'bob'][Math.floor(r() * 5)];
      p.bottomType = r() < 0.4 ? 'dress' : (r() < 0.5 ? 'skirt' : 'pants');
    } else if (kind === 'man') {
      p.hairStyle = r() < 0.15 ? 'bald' : 'short';
      p.bottomType = (weather === 'hot' || weather === 'sunny') && r() < 0.35 ? 'shorts' : 'pants';
    } else if (kind === 'child') {
      p.hairStyle = r() < 0.5 ? 'short' : (r() < 0.5 ? 'ponytail' : 'long');
      p.bottomType = r() < 0.5 ? 'shorts' : (p.hairStyle === 'short' ? 'pants' : 'skirt');
    } else {
      p.hairStyle = r() < 0.5 ? 'short' : 'bun';
      p.hat = r() < 0.5 ? 'flat' : null;
      p.acc = r() < 0.45 ? 'cane' : null;
      p.top = ['#7B6B5A', '#556B7D', '#8E7F6A', '#6D4C41', '#9E9E9E'][Math.floor(r() * 5)];
      p.sleeves = 'long';
    }
    if (weather === 'hot' || weather === 'sunny') {
      if (r() < 0.25 && !p.hat) p.hat = r() < 0.5 ? 'cap' : 'sun';
      if (r() < 0.3 && kind !== 'child') p.acc = p.acc || 'shades';
    }
    if (weather === 'rainy') {
      if (r() < 0.65) p.acc = 'umbrella';
      else if (r() < 0.5) { p.top = '#E8C02A'; p.hat = 'hood'; }
      p.umbrella = ['#1F3A93', '#C0392B', '#2C3E50', '#27AE60', '#8E44AD', '#E67E22'][Math.floor(r() * 6)];
    }
    if (ev.fans && r() < 0.55) { p.jersey = true; p.top = '#D52B1E'; p.sleeves = 'short'; if (kind !== 'elder') p.bottom = r() < 0.5 ? '#1F3A93' : p.bottom; }
    if (ev.bunting && r() < 0.3 && kind !== 'child') {
      if (kind === 'man' || kind === 'elder') { p.hat = 'chupalla'; p.manta = ['#7A1E1E', '#1E3A7A', '#5A3A1E'][Math.floor(r() * 3)]; }
      else { p.bottomType = 'dress'; p.top = ['#C0392B', '#2E86C1', '#8E44AD'][Math.floor(r() * 3)]; p.china = true; }
    }
    if (!p.acc && kind !== 'child' && r() < 0.2) p.acc = 'bag';
    p.bagCol = ['#7B4B2A', '#2C3E50', '#B03A2E', '#D9C7A5'][Math.floor(r() * 4)];
    return p;
  }

  // Side view, facing +x. Origin at the feet. Units: 1 = person height.
  function drawPerson(x, p, px, py, s, phase, dir, pose, carry, light) {
    var h = p.h * s;
    x.save();
    x.translate(px, py);
    // ground shadow (direction from the sun)
    var sh = light.shadow;
    if (sh > 0) {
      var sk = light.skew;
      var sg = x.createRadialGradient(sk * h * 0.22, 0, 0, sk * h * 0.22, 0, h * (0.16 + Math.abs(sk) * 0.2));
      sg.addColorStop(0, 'rgba(20,15,10,' + (0.32 * sh) + ')');
      sg.addColorStop(1, 'rgba(20,15,10,0)');
      x.fillStyle = sg;
      ellipse(x, sk * h * 0.22, 0, h * (0.14 + Math.abs(sk) * 0.2), h * 0.035); x.fill();
      x.fillStyle = 'rgba(20,15,10,' + (0.25 * sh) + ')';
      ellipse(x, 0, 0, h * 0.1, h * 0.018); x.fill();
    } else {
      // wet ground reflection hint
      x.fillStyle = 'rgba(30,40,60,0.18)'; ellipse(x, 0, 2, h * 0.1, h * 0.02); x.fill();
    }
    x.scale(dir * h, h);
    var child = p.kind === 'child';
    var hipY = child ? -0.47 : -0.5;
    var shY = child ? -0.765 : -0.805;
    var headR = child ? 0.082 : 0.067;
    var headY = child ? -0.89 : -0.905;
    var walking = pose === 'walk';
    var sw = walking ? Math.sin(phase) : 0;
    var cw = walking ? Math.cos(phase) : 0;
    var bob = walking ? -Math.abs(Math.cos(phase)) * 0.008 + 0.004 : 0;
    var elder = p.kind === 'elder';
    var stride = elder ? 0.24 : 0.33;
    x.translate(elder ? 0.01 : 0, bob);
    var lw = function(v) { return v; };
    var dark = function(c) { return shade(c, -0.28); };
    var limbG = function(c) {
      var g = x.createLinearGradient(-0.045, 0, 0.045, 0);
      g.addColorStop(0, shade(c, -0.22)); g.addColorStop(0.6, shade(c, 0.06)); g.addColorStop(1, shade(c, -0.06));
      return g;
    };
    var L1 = child ? 0.24 : 0.255, L2 = child ? 0.235 : 0.25;

    function leg(sign, far) {
      var A = stride * sw * sign;
      var K = walking ? 0.06 + 0.55 * Math.max(0, cw * sign) : 0.04;
      var kx = Math.sin(A) * L1, ky = hipY + Math.cos(A) * L1;
      var a2 = A - K;
      var ax = kx + Math.sin(a2) * L2, ay = ky + Math.cos(a2) * L2;
      var skin = far ? dark(p.skin) : p.skin;
      var cloth = far ? dark(p.bottom) : p.bottom;
      x.lineCap = 'round'; x.lineJoin = 'round';
      // bare leg
      x.strokeStyle = far ? skin : limbG(skin); x.lineWidth = child ? 0.06 : 0.064;
      x.beginPath(); x.moveTo(0, hipY); x.lineTo(kx, ky); x.lineTo(ax, ay); x.stroke();
      if (p.bottomType === 'pants' || (p.bottomType === 'shorts')) {
        x.strokeStyle = far ? cloth : limbG(cloth); x.lineWidth = child ? 0.078 : 0.086;
        x.beginPath(); x.moveTo(0, hipY);
        if (p.bottomType === 'pants') { x.lineTo(kx, ky); x.lineTo(kx + (ax - kx) * 0.92, ky + (ay - ky) * 0.92); }
        else x.lineTo(kx * 0.85, hipY + (ky - hipY) * 0.85);
        x.stroke();
      }
      // shoe
      x.fillStyle = far ? dark(p.shoe) : p.shoe;
      x.save(); x.translate(ax, ay); x.rotate(walking ? clamp(-a2 * 0.6, -0.5, 0.5) : 0);
      rrect(x, -0.026, -0.024, 0.082, 0.034, 0.014); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(-0.02, -0.022, 0.06, 0.006);
      x.restore();
    }
    function arm(sign, far) {
      var A = (walking ? -0.38 * sw * sign : (pose === 'look' ? 0.08 : 0.05));
      var E = walking ? 0.25 + 0.2 * Math.max(0, -sw * sign) : 0.18;
      var sx0 = 0, sy0 = shY + 0.02;
      var raise = (!far && pose === 'buy') ? 1 : 0;
      if (raise) { A = 1.25; E = 0.1; }
      if (!far && p.acc === 'umbrella') { A = 0.55; E = 1.7; }
      if (far && p.acc === 'cane') { A = 0.3; E = 0.1; }
      var u = child ? 0.15 : 0.165, f = child ? 0.14 : 0.155;
      var ex = sx0 + Math.sin(A) * u, ey = sy0 + Math.cos(A) * u;
      var a2 = A + E;
      var hx = ex + Math.sin(a2) * f, hy = ey + Math.cos(a2) * f;
      var sleeve = far ? dark(p.top) : p.top;
      var skin = far ? dark(p.skin) : p.skin;
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.strokeStyle = far ? skin : limbG(skin); x.lineWidth = 0.046;
      x.beginPath(); x.moveTo(sx0, sy0); x.lineTo(ex, ey); x.lineTo(hx, hy); x.stroke();
      x.strokeStyle = far ? sleeve : limbG(sleeve); x.lineWidth = 0.06;
      x.beginPath(); x.moveTo(sx0, sy0);
      if (p.sleeves === 'long') { x.lineTo(ex, ey); x.lineTo(ex + (hx - ex) * 0.85, ey + (hy - ey) * 0.85); }
      else x.lineTo(sx0 + (ex - sx0) * 0.55, sy0 + (ey - sy0) * 0.55);
      x.stroke();
      x.fillStyle = skin; ellipse(x, hx, hy, 0.022, 0.024); x.fill();
      return { hx: hx, hy: hy };
    }

    // far limbs
    leg(-1, true);
    var farHand = arm(-1, true);
    if (p.acc === 'cane') {
      x.strokeStyle = '#5B3A20'; x.lineWidth = 0.016;
      x.beginPath(); x.moveTo(farHand.hx, farHand.hy); x.lineTo(farHand.hx + 0.05, 0); x.stroke();
    }
    leg(1, false);

    // torso
    var tw = child ? 0.07 : (p.kind === 'woman' ? 0.074 : 0.084);
    var tg = x.createLinearGradient(-tw, 0, tw, 0);
    tg.addColorStop(0, shade(p.top, -0.22)); tg.addColorStop(0.55, shade(p.top, 0.08)); tg.addColorStop(1, shade(p.top, -0.05));
    x.fillStyle = tg;
    x.beginPath();
    x.moveTo(-tw * 0.85, shY);
    x.quadraticCurveTo(0, shY - 0.02, tw * 0.75, shY + 0.005);
    x.quadraticCurveTo(tw * 1.1, shY + 0.07, tw * 0.9, shY + 0.14);
    x.quadraticCurveTo(tw * 0.8, hipY - 0.03, tw * 0.85, hipY + 0.03);
    x.lineTo(-tw * 0.9, hipY + 0.03);
    x.quadraticCurveTo(-tw * 1.05, hipY - 0.08, -tw * 0.95, shY + 0.1);
    x.quadraticCurveTo(-tw * 1.0, shY + 0.03, -tw * 0.85, shY);
    x.closePath(); x.fill();
    if (p.jersey) {
      x.fillStyle = '#FFFFFF';
      x.fillRect(-tw * 0.9, shY + 0.03, tw * 1.75, 0.012);
      x.fillStyle = '#1F3A93'; x.fillRect(-tw * 0.85, shY - 0.004, tw * 1.6, 0.01);
    }
    // collar / neckline
    x.fillStyle = shade(p.top, -0.3);
    x.beginPath(); x.moveTo(-0.02, shY - 0.004); x.quadraticCurveTo(0.01, shY + 0.03, 0.035, shY - 0.002); x.lineTo(0.03, shY - 0.012); x.quadraticCurveTo(0.01, shY + 0.012, -0.015, shY - 0.012); x.closePath(); x.fill();
    // belt line / waist
    if (p.bottomType === 'pants' || p.bottomType === 'shorts') {
      x.fillStyle = p.bottom;
      x.beginPath(); x.moveTo(-tw * 0.92, hipY - 0.02); x.lineTo(tw * 0.86, hipY - 0.02); x.lineTo(tw * 0.9, hipY + 0.04); x.lineTo(-tw * 0.95, hipY + 0.04); x.closePath(); x.fill();
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(-tw * 0.92, hipY - 0.022, tw * 1.78, 0.008);
    } else {
      // skirt / dress: flared shape, sways with the walk
      var swy = sw * 0.02;
      var hem = p.bottomType === 'dress' ? hipY + 0.26 : hipY + 0.22;
      var col = p.bottomType === 'dress' ? p.top : p.bottom;
      var dg = x.createLinearGradient(-0.1, 0, 0.1, 0);
      dg.addColorStop(0, shade(col, -0.22)); dg.addColorStop(0.6, shade(col, 0.06)); dg.addColorStop(1, shade(col, -0.08));
      x.fillStyle = dg;
      x.beginPath();
      x.moveTo(-tw * 0.95, p.bottomType === 'dress' ? shY + 0.12 : hipY - 0.03);
      x.lineTo(tw * 0.88, p.bottomType === 'dress' ? shY + 0.12 : hipY - 0.03);
      x.quadraticCurveTo(tw * 1.3, hipY + 0.1, tw * 1.55 + swy, hem);
      x.quadraticCurveTo(0, hem + 0.012, -tw * 1.6 + swy, hem);
      x.quadraticCurveTo(-tw * 1.35, hipY + 0.1, -tw * 0.95, p.bottomType === 'dress' ? shY + 0.12 : hipY - 0.03);
      x.closePath(); x.fill();
      if (p.china) {
        x.fillStyle = '#FFFFFF';
        x.beginPath(); x.moveTo(tw * 0.2, hipY - 0.04); x.lineTo(tw * 1.1, hipY - 0.04); x.lineTo(tw * 1.35 + swy, hem - 0.03); x.lineTo(tw * 0.1 + swy, hem - 0.03); x.closePath(); x.fill();
        for (var fl = 0; fl < 6; fl++) {
          x.fillStyle = fl % 2 ? '#F1C40F' : '#FFFFFF';
          ellipse(x, -tw * 0.8 + (fl % 3) * 0.03, hipY + 0.05 + Math.floor(fl / 3) * 0.08, 0.008, 0.008); x.fill();
        }
      }
    }
    if (p.manta) {
      // huaso manta: short striped poncho over the shoulders
      x.fillStyle = p.manta;
      x.beginPath(); x.moveTo(-tw * 1.15, shY - 0.005); x.lineTo(tw * 1.05, shY - 0.005); x.lineTo(tw * 1.25, shY + 0.17); x.lineTo(-tw * 1.3, shY + 0.17); x.closePath(); x.fill();
      var mc = ['#F1C40F', '#ECEFF1', '#27AE60'];
      for (var m = 0; m < 3; m++) { x.fillStyle = mc[m]; x.fillRect(-tw * 1.25, shY + 0.11 + m * 0.017, tw * 2.45, 0.008); }
    }
    if (p.acc === 'bag') {
      x.strokeStyle = shade(p.bagCol, -0.3); x.lineWidth = 0.008;
      x.beginPath(); x.moveTo(tw * 0.5, shY); x.lineTo(-tw * 0.9, hipY + 0.02); x.stroke();
      x.fillStyle = p.bagCol; rrect(x, -tw * 1.45, hipY - 0.04, 0.07, 0.07, 0.012); x.fill();
    }

    // neck + head
    x.fillStyle = shade(p.skin, -0.08);
    x.fillRect(-0.016, shY - 0.045, 0.034, 0.05);
    var hg = x.createRadialGradient(headR * 0.3, headY - headR * 0.4, headR * 0.1, 0, headY, headR * 1.1);
    hg.addColorStop(0, shade(p.skin, 0.12)); hg.addColorStop(1, shade(p.skin, -0.1));
    x.fillStyle = hg;
    ellipse(x, 0, headY, headR * 0.95, headR * 1.05); x.fill();
    // nose, ear, eye
    x.beginPath(); x.moveTo(headR * 0.85, headY - headR * 0.12); x.quadraticCurveTo(headR * 1.18, headY + headR * 0.12, headR * 0.86, headY + headR * 0.22); x.fill();
    x.fillStyle = shade(p.skin, -0.15); ellipse(x, -headR * 0.12, headY + headR * 0.05, headR * 0.17, headR * 0.24); x.fill();
    x.fillStyle = '#231710'; ellipse(x, headR * 0.52, headY - headR * 0.12, headR * 0.1, headR * 0.13); x.fill();
    if (pose === 'happy') {
      x.strokeStyle = '#8A3A2A'; x.lineWidth = 0.006;
      x.beginPath(); x.arc(headR * 0.55, headY + headR * 0.3, headR * 0.22, 0.1, Math.PI * 0.6); x.stroke();
    } else {
      x.strokeStyle = 'rgba(120,60,40,0.6)'; x.lineWidth = 0.005;
      x.beginPath(); x.moveTo(headR * 0.5, headY + headR * 0.45); x.lineTo(headR * 0.78, headY + headR * 0.42); x.stroke();
    }
    // hair
    x.fillStyle = p.hair;
    var hs = p.hairStyle;
    if (hs === 'bald') {
      x.beginPath(); x.moveTo(-headR * 0.95, headY - headR * 0.05); x.quadraticCurveTo(-headR * 0.9, headY + headR * 0.5, -headR * 0.35, headY + headR * 0.55);
      x.lineTo(-headR * 0.45, headY + headR * 0.15); x.closePath(); x.fill();
    } else {
      x.beginPath();
      x.moveTo(headR * 0.72, headY - headR * 0.5);
      x.quadraticCurveTo(headR * 0.5, headY - headR * 1.25, -headR * 0.3, headY - headR * 1.08);
      x.quadraticCurveTo(-headR * 1.15, headY - headR * 0.7, -headR * 0.95, headY + headR * 0.35);
      x.quadraticCurveTo(-headR * 0.6, headY + headR * 0.6, -headR * 0.35, headY + headR * 0.5);
      x.quadraticCurveTo(-headR * 0.35, headY - headR * 0.2, headR * 0.15, headY - headR * 0.42);
      x.closePath(); x.fill();
      if (hs === 'long') {
        x.beginPath(); x.moveTo(-headR * 0.95, headY - headR * 0.2);
        x.quadraticCurveTo(-headR * 1.3, headY + headR * 1.6, -headR * 0.6, headY + headR * 2.3 + sw * 0.01);
        x.lineTo(-headR * 0.1, headY + headR * 1.6); x.lineTo(-headR * 0.35, headY + headR * 0.4); x.closePath(); x.fill();
      } else if (hs === 'bob') {
        x.beginPath(); x.moveTo(-headR * 0.95, headY - headR * 0.2);
        x.quadraticCurveTo(-headR * 1.2, headY + headR * 0.9, -headR * 0.5, headY + headR * 1.0);
        x.lineTo(-headR * 0.2, headY + headR * 0.4); x.closePath(); x.fill();
      } else if (hs === 'bun') {
        ellipse(x, -headR * 0.75, headY - headR * 0.75, headR * 0.42, headR * 0.4); x.fill();
      } else if (hs === 'ponytail') {
        x.strokeStyle = p.hair; x.lineWidth = headR * 0.4; x.lineCap = 'round';
        x.beginPath(); x.moveTo(-headR * 0.8, headY - headR * 0.6);
        x.quadraticCurveTo(-headR * 1.7, headY - headR * 0.2 + sw * 0.01, -headR * 1.4, headY + headR * 1.1); x.stroke();
      }
      // hair sheen
      x.fillStyle = 'rgba(255,255,255,0.12)';
      ellipse(x, 0, headY - headR * 0.85, headR * 0.45, headR * 0.15, -0.2); x.fill();
    }
    if (p.acc === 'shades') {
      x.fillStyle = '#111'; rrect(x, headR * 0.32, headY - headR * 0.3, headR * 0.55, headR * 0.3, headR * 0.08); x.fill();
      x.strokeStyle = '#111'; x.lineWidth = 0.004; x.beginPath(); x.moveTo(headR * 0.32, headY - headR * 0.2); x.lineTo(-headR * 0.2, headY - headR * 0.15); x.stroke();
    }
    // hats
    if (p.hat === 'cap') {
      x.fillStyle = shade(p.top, -0.1);
      x.beginPath(); x.moveTo(-headR * 0.9, headY - headR * 0.35); x.quadraticCurveTo(-headR * 0.7, headY - headR * 1.25, headR * 0.5, headY - headR * 1.0);
      x.lineTo(headR * 0.8, headY - headR * 0.5); x.closePath(); x.fill();
      x.fillRect(headR * 0.4, headY - headR * 0.62, headR * 0.95, headR * 0.16);
    } else if (p.hat === 'sun') {
      x.fillStyle = '#E8D9B0';
      ellipse(x, 0, headY - headR * 0.6, headR * 1.7, headR * 0.22); x.fill();
      x.beginPath(); x.ellipse(0, headY - headR * 0.65, headR * 0.85, headR * 0.7, 0, Math.PI, 0); x.fill();
      x.fillStyle = '#C0392B'; x.fillRect(-headR * 0.85, headY - headR * 0.85, headR * 1.7, headR * 0.18);
    } else if (p.hat === 'flat') {
      x.fillStyle = '#5D4E3C';
      ellipse(x, 0, headY - headR * 0.75, headR * 1.25, headR * 0.16); x.fill();
      x.fillRect(-headR * 0.75, headY - headR * 1.25, headR * 1.5, headR * 0.5);
    } else if (p.hat === 'chupalla') {
      // huaso straw hat: wide flat brim, flat crown, dark band
      var cg = x.createLinearGradient(0, headY - headR * 1.4, 0, headY - headR * 0.6);
      cg.addColorStop(0, '#EAD7A2'); cg.addColorStop(1, '#C8AE6E');
      x.fillStyle = cg;
      ellipse(x, 0, headY - headR * 0.7, headR * 2.0, headR * 0.2); x.fill();
      x.fillRect(-headR * 0.8, headY - headR * 1.35, headR * 1.6, headR * 0.65);
      x.fillStyle = '#2B2B2B'; x.fillRect(-headR * 0.8, headY - headR * 0.92, headR * 1.6, headR * 0.16);
    } else if (p.hat === 'hood') {
      x.fillStyle = shade(p.top, -0.05);
      x.beginPath(); x.ellipse(-headR * 0.1, headY - headR * 0.1, headR * 1.12, headR * 1.2, 0, Math.PI * 0.55, Math.PI * 2.15); x.fill();
      x.fillStyle = hg; ellipse(x, headR * 0.25, headY + headR * 0.05, headR * 0.6, headR * 0.75); x.fill();
      x.fillStyle = '#231710'; ellipse(x, headR * 0.52, headY - headR * 0.12, headR * 0.1, headR * 0.13); x.fill();
    }

    // near arm (+ umbrella / carried item)
    var hand = arm(1, false);
    if (p.acc === 'umbrella') {
      x.strokeStyle = '#2B2B2B'; x.lineWidth = 0.012;
      var topY = headY - headR * 2.2;
      x.beginPath(); x.moveTo(hand.hx, hand.hy + 0.04); x.lineTo(hand.hx * 0.6, topY); x.stroke();
      var ug = x.createLinearGradient(-0.3, 0, 0.3, 0);
      ug.addColorStop(0, shade(p.umbrella, -0.25)); ug.addColorStop(0.5, shade(p.umbrella, 0.15)); ug.addColorStop(1, shade(p.umbrella, -0.2));
      x.fillStyle = ug;
      var ucx = hand.hx * 0.6;
      x.beginPath(); x.moveTo(ucx - 0.3, topY + 0.1);
      x.quadraticCurveTo(ucx - 0.28, topY - 0.08, ucx, topY - 0.09);
      x.quadraticCurveTo(ucx + 0.28, topY - 0.08, ucx + 0.3, topY + 0.1);
      for (var sc = 0; sc < 6; sc++) {
        var x1 = ucx + 0.3 - (sc + 1) * 0.1;
        x.quadraticCurveTo(x1 + 0.05, topY + 0.07, x1, topY + 0.1);
      }
      x.closePath(); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 0.004;
      for (var rb = -2; rb <= 2; rb++) { x.beginPath(); x.moveTo(ucx, topY - 0.09); x.lineTo(ucx + rb * 0.1, topY + 0.1); x.stroke(); }
      // water sheen
      x.fillStyle = 'rgba(255,255,255,0.18)';
      x.beginPath(); x.ellipse(ucx - 0.08, topY - 0.03, 0.12, 0.03, -0.2, 0, Math.PI * 2); x.fill();
    }
    if (carry && p.acc !== 'umbrella') drawCarry(x, carry, hand.hx, hand.hy);
    x.restore();
  }

  function drawCarry(x, product, hx, hy) {
    x.save(); x.translate(hx, hy); x.scale(0.0055, 0.0055);
    if (product === 'empanadas') { x.rotate(-0.4); empanada(x, 6, -4, 0.7, 0, 0); }
    else if (product === 'mote') cupMote(x, 2, 8, 0.8);
    else if (product === 'limonada') glassLemon(x, 2, 8, 0.85);
    else if (product === 'helados') paleta(x, 0, -2, 0.9, '#E2425A', -0.3);
    else {
      // sopaipillas in a paper napkin
      x.fillStyle = '#F6F1E6'; x.beginPath(); x.moveTo(-8, -2); x.lineTo(10, -2); x.lineTo(4, 12); x.lineTo(-3, 12); x.closePath(); x.fill();
      sopaipilla(x, 1, -4, 0.7);
    }
    x.restore();
  }

  // ---- speech bubbles & floating texts -------------------------------
  function bubble(x, cx, by, text, col, alpha) {
    x.save();
    x.globalAlpha = alpha;
    x.font = '800 14px "Nunito", sans-serif';
    var w = x.measureText(text).width + 18, h = 24;
    var bx = cx - w / 2, byy = by - h - 10;
    x.fillStyle = 'rgba(0,0,0,0.15)'; rrect(x, bx + 1.5, byy + 2.5, w, h, 12); x.fill();
    x.fillStyle = '#FFFFFF'; rrect(x, bx, byy, w, h, 12); x.fill();
    x.beginPath(); x.moveTo(cx - 5, byy + h - 1); x.lineTo(cx + 1, byy + h + 9); x.lineTo(cx + 6, byy + h - 1); x.closePath(); x.fill();
    x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, cx, byy + h / 2 + 1);
    x.restore();
  }
  function heart(x, cx, cy, s, alpha) {
    x.save(); x.globalAlpha = alpha; x.translate(cx, cy); x.scale(s, s);
    var g = x.createLinearGradient(0, -8, 0, 8);
    g.addColorStop(0, '#FF6B81'); g.addColorStop(1, '#D62845');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(0, 7);
    x.bezierCurveTo(-12, -2, -6, -12, 0, -5);
    x.bezierCurveTo(6, -12, 12, -2, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.5)'; ellipse(x, -4, -4, 2, 1.3, -0.5); x.fill();
    x.restore();
  }
  function coin(x, cx, cy, r) {
    var g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#FFF2A8'); g.addColorStop(0.6, '#E3B23C'); g.addColorStop(1, '#9C7214');
    x.fillStyle = g; ellipse(x, cx, cy, r, r); x.fill();
    x.strokeStyle = 'rgba(120,80,10,0.6)'; x.lineWidth = 0.8; ellipse(x, cx, cy, r * 0.72, r * 0.72); x.stroke();
  }

  // ---- bunting for fiestas -----------------------------------------
  function drawBunting(x, W, t) {
    var cols = ['#D52B1E', '#FFFFFF', '#0039A6'];
    for (var row = 0; row < 2; row++) {
      var y0 = 70 + row * 46, sag = 26;
      x.strokeStyle = 'rgba(60,60,60,0.6)'; x.lineWidth = 1;
      x.beginPath();
      for (var px = -10; px <= W + 10; px += 10) {
        var yy = y0 + Math.sin((px / W) * Math.PI) * sag;
        if (px === -10) x.moveTo(px, yy); else x.lineTo(px, yy);
      }
      x.stroke();
      for (var i = 0; i < W / 24; i++) {
        var fx = 10 + i * 24 + row * 12, fy = y0 + Math.sin((fx / W) * Math.PI) * sag;
        var wav = Math.sin(t * 3 + i) * 1.5;
        x.fillStyle = cols[(i + row) % 3];
        x.beginPath(); x.moveTo(fx - 8, fy); x.lineTo(fx + 8, fy); x.lineTo(fx + wav, fy + 16); x.closePath(); x.fill();
        x.fillStyle = 'rgba(0,0,0,0.1)';
        x.beginPath(); x.moveTo(fx + 2, fy); x.lineTo(fx + 8, fy); x.lineTo(fx + wav, fy + 16); x.closePath(); x.fill();
      }
    }
  }

  // ---- the scene director ------------------------------------------
  function Scene(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cfg = {
      place: 'plaza', weather: 'sunny', event: null, product: 'empanadas',
      price: 2000, label: 'Empanadas', short: 'Empanadas', stock: 12, made: 12, dayOld: 0
    };
    this.time = 60;           // sim minutes after 10:00
    this.mode = 'idle';
    this.speed = 1;
    this.people = [];
    this.fx = [];
    this.clouds = [];
    this.drops = [];
    this.puddles = [];
    this.queue = [];
    this.serving = null;
    this.coins = 0;
    this.r = rng(Date.now() & 0xffffff);
    this.idleNext = 0;
    this.running = false;
    this._last = 0;
    this._loop = this._loop.bind(this);
    this.onSale = null; this.onDone = null; this.onTick = null;
    this.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (opts) this.set(opts);
    this.resize();
  }

  Scene.prototype.set = function(o) {
    var rebuild = false;
    for (var k in o) {
      if (!o.hasOwnProperty(k)) continue;
      if ((k === 'place' || k === 'weather') && this.cfg[k] !== o[k]) rebuild = true;
      this.cfg[k] = o[k];
    }
    if (rebuild) { this.bg = null; this._makeWeather(); }
  };

  Scene.prototype.resize = function() {
    var rect = this.canvas.getBoundingClientRect();
    var cw = Math.max(200, rect.width || this.canvas.clientWidth || 600);
    var ch = Math.max(160, rect.height || this.canvas.clientHeight || 400);
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(cw * dpr);
    this.canvas.height = Math.round(ch * dpr);
    this.k = (ch * dpr) / H;
    this.W = cw / ch * H;
    this.sx = clamp(this.W * 0.52, STAND_W / 2 + 150, this.W - STAND_W / 2 - 110);
    if (this.W < STAND_W + 260) this.sx = this.W - STAND_W / 2 - 100;
    this.bg = null;
    this._makeWeather();
  };

  Scene.prototype._makeWeather = function() {
    var w = this.cfg.weather, W = this.W || 1000, k = this.k || 1;
    var r = rng(77);
    this.clouds = [];
    var n = w === 'rainy' ? 7 : w === 'cloudy' ? 7 : w === 'hot' ? 1 : 3;
    var tone = w === 'rainy' ? 'storm' : w === 'cloudy' ? 'grey' : 'white';
    for (var i = 0; i < n; i++) {
      var cw = (w === 'rainy' || w === 'cloudy') ? 300 + r() * 200 : 180 + r() * 120;
      var chh = cw * 0.42;
      this.clouds.push({
        img: makeCloud(cw, chh, 40 + i * 13, tone, Math.min(k, 1.5)),
        x: r() * (W + cw) - cw * 0.5, y: (w === 'rainy' || w === 'cloudy') ? -30 + r() * 160 : 30 + r() * 120,
        w: cw, h: chh, v: 0.6 + r() * 0.8
      });
    }
    this.drops = [];
    if (w === 'rainy') {
      for (var d = 0; d < 170; d++) this.drops.push({ x: r() * W, y: r() * H, l: 14 + r() * 14, v: 900 + r() * 400 });
      this.puddles = [];
      var px = [0.12, 0.35, 0.68, 0.88];
      for (var p = 0; p < px.length; p++) this.puddles.push({ x: px[p] * W, y: 540 + (p % 2) * 34, rx: 46 + r() * 30, ry: 7 + r() * 4, ripples: [] });
    } else this.puddles = [];
  };

  Scene.prototype.start = function() {
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    requestAnimationFrame(this._loop);
  };
  Scene.prototype.stop = function() { this.running = false; };

  Scene.prototype.idle = function() {
    this.mode = 'idle';
    this.people = []; this.queue = []; this.fx = []; this.serving = null;
    this.time = 140;
    this.start();
  };

  // plan: { customers:[{t, kind:'want'|'bargain'|'price'|'pass', units, dir}] }
  Scene.prototype.play = function(plan, cb) {
    this.mode = 'day';
    this.plan = plan.customers.slice().sort(function(a, b) { return a.t - b.t; });
    this.planIdx = 0;
    this.people = []; this.queue = []; this.fx = []; this.serving = null;
    this.time = 0; this.coins = 0;
    this.onSale = cb.onSale; this.onDone = cb.onDone; this.onTick = cb.onTick;
    this.doneFired = false;
    this.start();
  };
  Scene.prototype.setSpeed = function(s) { this.speed = s; };

  Scene.prototype._light = function() {
    var w = this.cfg.weather;
    var sp = sunPos(this.W, this.time);
    var shadow = w === 'rainy' ? 0 : w === 'cloudy' ? 0.35 : 1;
    return { shadow: shadow, skew: clamp((this.W * 0.5 - sp.x) / 260, -1.6, 1.6) };
  };

  Scene.prototype._spawn = function(c) {
    var r = this.r;
    var p = makePerson(r, { weather: this.cfg.weather, event: this.cfg.event });
    var dir = c.dir || (r() < 0.5 ? 1 : -1);
    var lane = 545 + r() * 45;
    var person = {
      look: p, dir: dir, x: dir > 0 ? -60 : this.W + 60, y: lane, phase: r() * 6,
      kind: c.kind, units: c.units || 1, state: 'walk', speed: WALK * (p.kind === 'elder' ? 0.75 : 0.9 + r() * 0.25),
      wait: 0, carry: null, bubble: null, bubbleT: 0, heart: 0, c: c
    };
    if (c.kind === 'want' || c.kind === 'bargain') person.state = 'toQueue';
    if (c.kind === 'price') { person.lookX = this.sx + STAND_W / 2 + 40 + (r() - 0.5) * 40; person.y = 548 + r() * 20; }
    if (c.kind === 'soldout') { person.lookX = this.sx - STAND_W / 2 + 30 + (r() - 0.5) * 60; }
    this.people.push(person);
    return person;
  };

  Scene.prototype._queuePos = function(i) {
    return { x: this.sx - STAND_W / 2 + 34 - i * 46, y: 552 + (i % 2) * 6 };
  };

  Scene.prototype._update = function(dtReal) {
    var dt = dtReal * SIM_RATE * this.speed;    // sim minutes this frame
    var W = this.W;
    if (this.mode === 'day') {
      if (this.time < DAY_LEN) this.time = Math.min(DAY_LEN, this.time + dt);
      while (this.planIdx < this.plan.length && this.plan[this.planIdx].t <= this.time) {
        this._spawn(this.plan[this.planIdx]); this.planIdx++;
      }
    } else {
      this.time += dt * 0.05;
      if (this.time > 300) this.time = 140;
      this.idleNext -= dt;
      if (this.idleNext <= 0 && this.people.length < 6) {
        this._spawn({ kind: this.r() < 0.3 ? 'want' : 'pass', units: 1 });
        this.idleNext = 10 + this.r() * 24;
      }
    }
    // clouds drift
    for (var c = 0; c < this.clouds.length; c++) {
      var cl = this.clouds[c];
      cl.x += cl.v * dtReal * 6;
      if (cl.x > W + 40) cl.x = -cl.w - 40;
    }
    // rain
    for (var d = 0; d < this.drops.length; d++) {
      var dr = this.drops[d];
      dr.y += dr.v * dtReal; dr.x -= dr.v * dtReal * 0.18;
      if (dr.y > H) { dr.y = -20 - this.r() * 60; dr.x = this.r() * (W + 100); if (this.r() < 0.3) this.fx.push({ type: 'splash', x: this.r() * W, y: 450 + this.r() * 150, t: 0 }); }
    }
    for (var pd = 0; pd < this.puddles.length; pd++) {
      var pu = this.puddles[pd];
      if (this.r() < dtReal * 3) pu.ripples.push({ x: (this.r() - 0.5) * pu.rx * 1.4, y: (this.r() - 0.5) * pu.ry, t: 0 });
      for (var rp = pu.ripples.length - 1; rp >= 0; rp--) { pu.ripples[rp].t += dtReal; if (pu.ripples[rp].t > 1) pu.ripples.splice(rp, 1); }
    }
    // people
    var people = this.people;
    var lengthStep = function(p) { return p.look.h * 0.42; };
    for (var i = people.length - 1; i >= 0; i--) {
      var p = people[i];
      var move = 0;
      // nothing left for them: give up instead of queueing
      if (this.mode === 'day' && (p.state === 'toQueue' || p.state === 'queue') &&
          ((p.kind === 'want' && this.cfg.stock <= 0) || (p.kind === 'bargain' && (this.cfg.dayOld || 0) <= 0))) {
        var qx = this.queue.indexOf(p);
        if (qx >= 0) this.queue.splice(qx, 1);
        p.state = 'leave'; p.bubble = '¡Agotado!'; p.bubbleCol = '#B91C1C'; p.bubbleT = 1.8;
        if (p.dir === 0) p.dir = 1;
      }
      if (p.state === 'walk' || p.state === 'leave') {
        move = p.speed * dt * p.dir;
      } else if (p.state === 'toQueue') {
        var qi = this.queue.indexOf(p);
        if (qi < 0) { this.queue.push(p); qi = this.queue.length - 1; }
        var target = this._queuePos(qi);
        var dx = target.x - p.x;
        p.dir = dx >= 0 ? 1 : -1;
        p.y += (target.y - p.y) * Math.min(1, dt * 0.15);
        if (Math.abs(dx) < 2) { p.x = target.x; p.state = 'queue'; p.dir = 1; }
        else move = Math.sign(dx) * Math.min(Math.abs(dx), p.speed * dt);
      } else if (p.state === 'queue') {
        var qj = this.queue.indexOf(p);
        var tg = this._queuePos(qj);
        if (Math.abs(tg.x - p.x) > 2) { move = Math.sign(tg.x - p.x) * Math.min(Math.abs(tg.x - p.x), p.speed * dt); p.dir = 1; }
        else if (qj === 0 && !this.serving) { this.serving = p; p.state = 'buy'; p.wait = 3.2 + p.units * 0.6; }
      } else if (p.state === 'buy') {
        p.wait -= dt;
        if (p.wait <= 0) {
          var res = this.onSale ? this.onSale(p.c) : { sold: 1, money: this.cfg.price, happy: this.r() < 0.6 };
          this.queue.shift(); this.serving = null;
          if (res && res.sold > 0) {
            p.carry = this.cfg.product; p.state = 'leave'; p.pose = 'happy';
            this.coins += 1;
            var stackN = this.fx.filter(function(f) { return f.type === 'money' && f.t < 0.6; }).length;
            this.fx.push({ type: 'money', x: p.x + 20, y: p.y - p.look.h - 10 - stackN * 22, t: 0, text: '+' + money(res.money) });
            this.fx.push({ type: 'coin', x: p.x + 24, y: p.y - p.look.h * 0.5, tx: this.sx - STAND_W / 2 + 38, ty: COUNTER - 10, t: 0 });
            if (res.happy) p.heart = 1.6;
            if (res.old) { p.bubble = '¡Barato!'; p.bubbleCol = '#B45309'; p.bubbleT = 1.4; }
          } else {
            p.state = 'leave'; p.bubble = '¡Agotado!'; p.bubbleCol = '#B91C1C'; p.bubbleT = 1.8; p.pose = null;
          }
          p.dir = this.r() < 0.6 ? 1 : -1;
        }
      } else if (p.state === 'stop') {
        p.wait -= dt;
        if (p.wait <= 0) { p.state = 'leave'; }
      }
      if (p.state === 'walk' && p.lookX != null && ((p.dir > 0 && p.x >= p.lookX) || (p.dir < 0 && p.x <= p.lookX))) {
        p.state = 'stop'; p.wait = 22; p.lookX = null;
        if (p.kind === 'price') { p.bubble = ['¡Muy caro!', '¿Tanto?', '$$$…'][Math.floor(this.r() * 3)]; p.bubbleCol = '#B91C1C'; p.bubbleT = 2.0; p.dir = 1; }
        else { p.bubble = '¡Agotado!'; p.bubbleCol = '#B91C1C'; p.bubbleT = 2.0; }
      }
      p.x += move;
      if (move !== 0) p.phase += Math.abs(move) / lengthStep(p) * 2.2;
      if (p.bubbleT > 0) p.bubbleT -= dtReal;
      if (p.heart > 0) p.heart -= dtReal;
      if ((p.state === 'walk' || p.state === 'leave') && (p.x < -100 || p.x > W + 100)) people.splice(i, 1);
    }
    // the vendor reaches when serving
    // fx
    for (var f = this.fx.length - 1; f >= 0; f--) {
      this.fx[f].t += dtReal;
      if (this.fx[f].t > (this.fx[f].type === 'splash' ? 0.35 : 1.2)) this.fx.splice(f, 1);
    }
    if (this.mode === 'day') {
      if (this.onTick) this.onTick(this.time);
      if (this.time >= DAY_LEN && this.planIdx >= this.plan.length && !this.queue.length && !this.serving && !this.doneFired) {
        // let the last walkers leave the frame, then finish
        var busy = people.some(function(pp) { return pp.state !== 'walk' && pp.state !== 'leave'; });
        if (!busy) { this.doneFired = true; if (this.onDone) this.onDone(); }
      }
    }
  };

  Scene.prototype._draw = function() {
    var x = this.ctx, W = this.W, k = this.k, cfg = this.cfg, t = this.time;
    var nowS = performance.now() / 1000;
    x.setTransform(k, 0, 0, k, 0, 0);
    drawSky(x, W, cfg.weather, t);
    drawSun(x, W, cfg.weather, t);
    // clouds
    for (var c = 0; c < this.clouds.length; c++) {
      var cl = this.clouds[c];
      x.drawImage(cl.img, cl.x, cl.y, cl.w, cl.h);
    }
    if (!this.bg) this.bg = buildBackground(W, k, cfg.place, cfg.weather, this.sx);
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.drawImage(this.bg, 0, 0);
    x.setTransform(k, 0, 0, k, 0, 0);
    if (cfg.place === 'playa') this._drawWaves(x, W, nowS);
    if (cfg.event && cfg.event.bunting) drawBunting(x, W, nowS);
    var light = this._light();
    var sunny = cfg.weather === 'sunny' || cfg.weather === 'hot';
    // moving cloud shadow over the ground on sunny days
    if (cfg.weather === 'sunny') {
      var csx = ((nowS * 18) % (W + 600)) - 300;
      var cg = x.createRadialGradient(csx, 520, 10, csx, 520, 260);
      cg.addColorStop(0, 'rgba(30,40,60,0.10)'); cg.addColorStop(1, 'rgba(30,40,60,0)');
      x.fillStyle = cg; x.fillRect(csx - 260, GROUND, 520, H - GROUND);
    }
    // puddles
    for (var p = 0; p < this.puddles.length; p++) this._drawPuddle(x, this.puddles[p]);
    // stand shadow on the pavement
    var sx = this.sx;
    x.save();
    x.fillStyle = 'rgba(20,12,5,' + (0.3 * Math.max(0.35, light.shadow)) + ')';
    x.beginPath();
    x.moveTo(sx - STAND_W / 2 - 4, STAND_BASE);
    x.lineTo(sx + STAND_W / 2 + 4, STAND_BASE);
    x.lineTo(sx + STAND_W / 2 + 4 + light.skew * 40, STAND_BASE + 22);
    x.lineTo(sx - STAND_W / 2 - 4 + light.skew * 40, STAND_BASE + 22);
    x.closePath(); x.fill();
    x.restore();
    drawStandBack(x, sx, cfg.product);
    drawVendor(x, sx - 58, nowS, !!this.serving);
    var stock = cfg.stock;
    drawProduct(x, sx, cfg.product, stock, cfg.made, cfg.dayOld, nowS);
    cashTin(x, sx - STAND_W / 2 + 34, COUNTER - 2, this.coins + (this.mode === 'idle' ? 6 : 0));
    drawStandFront(x, sx, cfg.product, sunny, cfg.label);
    // price sign
    var signX = Math.min(W - 52, sx + STAND_W / 2 + 56);
    drawPriceSign(x, signX, 538, cfg.price, cfg.short, stock <= 0 && cfg.made >= 0 && this.mode === 'day' && (cfg.dayOld || 0) <= 0);
    // people, back to front
    var list = this.people.slice().sort(function(a, b) { return a.y - b.y; });
    for (var i = 0; i < list.length; i++) {
      var pp = list[i];
      var s = 0.95 + (pp.y - 540) / 50 * 0.12;
      var pose = (pp.state === 'buy') ? 'buy' : (pp.state === 'stop' ? 'look' : (pp.state === 'queue' ? 'stand' : 'walk'));
      if (pose === 'walk' && pp.pose === 'happy') pose = 'walk';
      if (pp.state === 'toQueue' || (pp.state === 'queue' && false)) pose = 'walk';
      var walkingNow = pp.state === 'walk' || pp.state === 'leave' || pp.state === 'toQueue' || (pp.state === 'queue' && Math.abs(this._queuePos(this.queue.indexOf(pp)).x - pp.x) > 2);
      drawPerson(x, pp.look, pp.x, pp.y, s, pp.phase, pp.dir, walkingNow ? 'walk' : pose, pp.carry, light);
    }
    // bubbles & hearts
    for (var j = 0; j < list.length; j++) {
      var q = list[j];
      var headTop = q.y - q.look.h * (0.95 + (q.y - 540) / 50 * 0.12) - 6;
      if (q.bubbleT > 0 && q.bubble) bubble(x, q.x, headTop, q.bubble, q.bubbleCol || '#333', clamp(q.bubbleT * 2, 0, 1));
      if (q.heart > 0) heart(x, q.x + 10 * q.dir, headTop - 10 - (1.6 - q.heart) * 18, 1.1, clamp(q.heart, 0, 1));
    }
    // fx
    for (var f = 0; f < this.fx.length; f++) {
      var e = this.fx[f];
      if (e.type === 'money') {
        x.save(); x.globalAlpha = clamp(1.2 - e.t, 0, 1);
        x.font = '900 17px "Nunito", sans-serif'; x.textAlign = 'center';
        x.lineWidth = 4; x.strokeStyle = 'rgba(255,255,255,0.9)';
        x.strokeText(e.text, e.x, e.y - e.t * 40); x.fillStyle = '#0F7A3D'; x.fillText(e.text, e.x, e.y - e.t * 40);
        x.restore();
      } else if (e.type === 'coin') {
        var tt = clamp(e.t / 0.6, 0, 1);
        var cx = lerp(e.x, e.tx, tt), cy = lerp(e.y, e.ty, tt) - Math.sin(tt * Math.PI) * 50;
        if (tt < 1) coin(x, cx, cy, 6);
      } else if (e.type === 'splash') {
        x.strokeStyle = 'rgba(220,230,240,' + (0.6 - e.t * 1.6) + ')'; x.lineWidth = 1;
        ellipse(x, e.x, e.y, 3 + e.t * 18, 1 + e.t * 4); x.stroke();
      }
    }
    // rain streaks
    if (this.drops.length) {
      x.strokeStyle = 'rgba(210,225,240,0.42)'; x.lineWidth = 1.1;
      x.beginPath();
      for (var d = 0; d < this.drops.length; d++) {
        var dr = this.drops[d];
        x.moveTo(dr.x, dr.y); x.lineTo(dr.x + dr.l * 0.18, dr.y - dr.l);
      }
      x.stroke();
    }
    // light grade for time of day + weather
    var late = lateness(t);
    if (late > 0 && cfg.weather !== 'rainy') {
      x.fillStyle = 'rgba(255,140,50,' + (late * 0.16) + ')'; x.fillRect(0, 0, W, H);
    }
    if (cfg.weather === 'hot') {
      var hg = x.createLinearGradient(0, 0, 0, H);
      hg.addColorStop(0, 'rgba(255,240,200,0.10)'); hg.addColorStop(1, 'rgba(255,200,120,0.06)');
      x.fillStyle = hg; x.fillRect(0, 0, W, H);
    }
    if (cfg.weather === 'rainy') { x.fillStyle = 'rgba(40,55,80,0.12)'; x.fillRect(0, 0, W, H); }
    drawGlare(x, W, cfg.weather, t);
    // soft vignette
    var vg = x.createRadialGradient(W / 2, H * 0.55, H * 0.45, W / 2, H * 0.55, Math.max(W, H) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.22)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
  };

  Scene.prototype._drawWaves = function(x, W, s) {
    x.save();
    x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 1;
    for (var i = 0; i < 9; i++) {
      var y = 326 + i * 8 + (i * i) * 0.4;
      var off = (s * (8 + i * 3) + i * 70) % 120;
      x.beginPath();
      for (var px = -120 + off; px < W; px += 120) { x.moveTo(px, y); x.quadraticCurveTo(px + 20, y - 1.5, px + 40 + i * 2, y); }
      x.stroke();
    }
    // shore foam
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 2;
    x.beginPath();
    var fy = 400 + Math.sin(s * 0.8) * 2;
    for (var fx = 0; fx <= W; fx += 15) { var yy = fy + Math.sin(fx / 40 + s) * 1.5; if (!fx) x.moveTo(fx, yy); else x.lineTo(fx, yy); }
    x.stroke();
    // sun glitter
    if (this.cfg.weather === 'sunny' || this.cfg.weather === 'hot') {
      var sp = sunPos(W, this.time);
      for (var g = 0; g < 30; g++) {
        var gx = sp.x + Math.sin(g * 12.9 + s * 2) * 60, gy = 330 + (g * 2.3) % 60;
        x.fillStyle = 'rgba(255,250,220,' + (0.3 + 0.3 * Math.sin(s * 6 + g)) + ')';
        x.fillRect(gx, gy, 6, 1.2);
      }
    }
    x.restore();
  };

  Scene.prototype._drawPuddle = function(x, pu) {
    x.save();
    ellipse(x, pu.x, pu.y, pu.rx, pu.ry);
    x.clip();
    var g = x.createLinearGradient(0, pu.y - pu.ry, 0, pu.y + pu.ry);
    g.addColorStop(0, 'rgba(120,135,150,0.75)'); g.addColorStop(0.6, 'rgba(160,172,184,0.65)'); g.addColorStop(1, 'rgba(90,100,115,0.7)');
    x.fillStyle = g; x.fillRect(pu.x - pu.rx, pu.y - pu.ry, pu.rx * 2, pu.ry * 2);
    // reflected stand/lamp hints
    x.fillStyle = 'rgba(60,50,40,0.25)'; x.fillRect(pu.x - pu.rx * 0.2, pu.y - pu.ry, 4, pu.ry * 2);
    for (var i = 0; i < pu.ripples.length; i++) {
      var r = pu.ripples[i];
      x.strokeStyle = 'rgba(230,240,250,' + (0.7 * (1 - r.t)) + ')'; x.lineWidth = 0.9;
      ellipse(x, pu.x + r.x, pu.y + r.y, 2 + r.t * 14, 0.6 + r.t * 3.5); x.stroke();
    }
    x.restore();
    x.strokeStyle = 'rgba(40,45,55,0.35)'; x.lineWidth = 1;
    ellipse(x, pu.x, pu.y, pu.rx, pu.ry); x.stroke();
  };

  Scene.prototype._loop = function(now) {
    if (!this.running) return;
    if (!this.canvas.isConnected) { this.running = false; return; }
    var dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this._update(dt);
    this._draw();
    requestAnimationFrame(this._loop);
  };

  // ---- standalone product thumbnail (for product cards) ---------------
  function drawThumb(canvas, product) {
    var rect = canvas.getBoundingClientRect();
    var cw = rect.width || 120, ch = rect.height || 90;
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    var x = canvas.getContext('2d');
    var k = dpr * ch / 100;
    x.setTransform(k, 0, 0, k, 0, 0);
    var W = cw / ch * 100;
    var g = x.createLinearGradient(0, 0, 0, 100);
    g.addColorStop(0, '#FFF7E8'); g.addColorStop(1, '#F3E2C4');
    x.fillStyle = g; x.fillRect(0, 0, W, 100);
    // wooden counter strip
    var wg = x.createLinearGradient(0, 74, 0, 100);
    wg.addColorStop(0, '#C89A66'); wg.addColorStop(0.2, '#A3744A'); wg.addColorStop(1, '#7A522F');
    x.fillStyle = wg; x.fillRect(0, 76, W, 24);
    x.fillStyle = 'rgba(255,240,210,0.4)'; x.fillRect(0, 76, W, 1.2);
    var cx = W / 2, by = 80;
    var i;
    x.save();
    var zs = { empanadas: 1.3, sopaipillas: 1.25 }[product] || 0.95;
    x.translate(cx, by); x.scale(zs, zs); x.translate(-cx, -by);
    if (product === 'empanadas') {
      basket(x, cx, by, 70);
      empanada(x, cx - 16, by - 22, 0.75, -0.06, 0); empanada(x, cx + 14, by - 22, 0.75, 0.05, 0.03); empanada(x, cx - 1, by - 33, 0.75, 0, 0.05);
    } else if (product === 'mote') {
      moteJar(x, cx + 18, by, 0.85);
      cupMote(x, cx - 20, by, 1.0);
    } else if (product === 'sopaipillas') {
      tray(x, cx - 6, by, 60);
      for (i = 0; i < 9; i++) sopaipilla(x, cx - 24 + (i % 3) * 18, by - 9 - Math.floor(i / 3) * 4.5, 0.85);
      pebreBowl(x, cx + 34, by);
    } else if (product === 'limonada') {
      x.save(); x.translate(cx + 14, by); x.scale(0.72, 0.72); lemonJug(x, 0, 0, 0.85); x.restore();
      glassLemon(x, cx - 22, by, 1.1);
    } else {
      cooler(x, cx, by, 10);
    }
    x.restore();
  }

  return {
    Scene: function(canvas, opts) { return new Scene(canvas, opts); },
    drawThumb: drawThumb,
    DAY_LEN: DAY_LEN, SIM_RATE: SIM_RATE
  };
})();
