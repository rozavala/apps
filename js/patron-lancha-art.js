/* =====================================================================
   PATRÓN DE LANCHA — diagramas (js/patron-lancha-art.js)

   Todos los diagramas de estudio se dibujan aquí en código (SVG y
   <canvas>), sin imágenes externas. Las lecciones dejan marcadores
   <div class="pl-fig" data-fig="id">; PLArt.mount(raíz) los dibuja
   la primera vez que la lección se abre.

   Reutiliza (solo lectura) el renderizador de cabos y de boyas de
   Marinero (js/marinero-art.js + js/marinero-data.js) para los nudos y
   las marcas IALA, para que ambas apps muestren lo mismo. Si no está
   cargado, esos dos diagramas muestran solo su texto.

   Convenciones de los dibujos:
     • rumbos/marcaciones en grados, 000° = proa / Norte, horario.
     • babor = rojo, estribor = verde (luces y marcas, Región B).
   Expone un global: PLArt.
   ===================================================================== */
var PLArt = (function(){
  'use strict';

  var TAU = Math.PI * 2, D2R = Math.PI / 180;
  var _uid = 0;
  function uid(){ return 'plf' + (++_uid) + '_'; }
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function ease(t){ t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function rng(seed){ var s = seed >>> 0 || 1; return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------- canvas ---------------- */
  function fit(cv, w, h){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (cv.width !== W || cv.height !== H){ cv.width = W; cv.height = H; }
    cv.style.height = h + 'px';
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h, dpr: dpr };
  }
  function rrect(ctx, x, y, w, h, r){
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function label(ctx, txt, x, y, o){
    o = o || {};
    ctx.save();
    ctx.font = (o.weight || 800) + ' ' + (o.size || 12) + 'px Nunito, system-ui, sans-serif';
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = o.halo == null ? 4 : o.halo; ctx.strokeStyle = o.haloColor || 'rgba(255,255,255,0.92)';
    if (ctx.lineWidth) ctx.strokeText(txt, x, y);
    ctx.fillStyle = o.color || '#1c1b29'; ctx.fillText(txt, x, y);
    ctx.restore();
  }
  function pill(ctx, txt, x, y, bg, fg, size){
    size = size || 11;
    ctx.save();
    ctx.font = '900 ' + size + 'px Nunito, system-ui, sans-serif';
    var w = ctx.measureText(txt).width + size * 1.3, h = size * 1.9;
    ctx.shadowColor = 'rgba(0,20,40,0.25)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = fg || '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y + 0.5);
    ctx.restore();
  }
  function arrow(ctx, x0, y0, x1, y1, col, w){
    var a = Math.atan2(y1 - y0, x1 - x0), hw = (w || 2) * 3.2;
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w || 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * hw, y1 - Math.sin(a) * hw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - Math.cos(a - 0.45) * hw * 1.6, y1 - Math.sin(a - 0.45) * hw * 1.6);
    ctx.lineTo(x1 - Math.cos(a + 0.45) * hw * 1.6, y1 - Math.sin(a + 0.45) * hw * 1.6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* ---------------- water texture (cached) ---------------- */
  var _waterCache = {};
  function waterTile(dark){
    var key = dark ? 'd' : 'l';
    if (_waterCache[key]) return _waterCache[key];
    var c = document.createElement('canvas'); c.width = c.height = 256;
    var x = c.getContext('2d'), r = rng(dark ? 7 : 3);
    for (var i = 0; i < 260; i++){
      var px = r() * 256, py = r() * 256, l = 6 + r() * 16;
      x.strokeStyle = dark ? 'rgba(120,170,220,' + (0.04 + r() * 0.06) + ')' : 'rgba(255,255,255,' + (0.08 + r() * 0.16) + ')';
      x.lineWidth = 0.8 + r() * 1.2; x.lineCap = 'round';
      x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + l / 2, py - 1.5 - r() * 2, px + l, py); x.stroke();
      if (!dark && r() < 0.5){
        x.strokeStyle = 'rgba(10,60,90,' + (0.05 + r() * 0.06) + ')';
        x.beginPath(); x.moveTo(px + 2, py + 2.2); x.quadraticCurveTo(px + l / 2, py + 3.6, px + l - 1, py + 2.2); x.stroke();
      }
    }
    return (_waterCache[key] = c);
  }
  function drawWater(ctx, w, h, t, opts){
    opts = opts || {};
    var g = ctx.createLinearGradient(0, 0, w * 0.3, h);
    if (opts.dark){ g.addColorStop(0, '#0a1a2c'); g.addColorStop(1, '#06101c'); }
    else { g.addColorStop(0, '#2f86a8'); g.addColorStop(0.55, '#256f93'); g.addColorStop(1, '#1d5c7e'); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var tile = waterTile(opts.dark), s = opts.scale || 1;
    ctx.save();
    ctx.globalAlpha = 0.9;
    var ox = ((t || 0) * 6) % (256 * s), oy = ((t || 0) * 3) % (256 * s);
    for (var yy = -256 * s; yy < h + 256 * s; yy += 256 * s)
      for (var xx = -256 * s; xx < w + 256 * s; xx += 256 * s)
        ctx.drawImage(tile, xx + ox, yy + oy, 256 * s, 256 * s);
    ctx.restore();
    // light vignette
    var v = ctx.createRadialGradient(w * 0.5, h * 0.45, Math.min(w, h) * 0.2, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(255,255,255,0.06)'); v.addColorStop(1, 'rgba(0,20,40,0.22)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  }

  /* ---------------- boats (top view, bow toward -y) ---------------- */
  function hullPath(ctx, L, B){
    ctx.beginPath();
    ctx.moveTo(0, -L / 2);
    ctx.bezierCurveTo(B * 0.34, -L * 0.40, B * 0.5, -L * 0.16, B * 0.5, L * 0.08);
    ctx.lineTo(B * 0.47, L / 2);
    ctx.lineTo(-B * 0.47, L / 2);
    ctx.lineTo(-B * 0.5, L * 0.08);
    ctx.bezierCurveTo(-B * 0.5, -L * 0.16, -B * 0.34, -L * 0.40, 0, -L / 2);
    ctx.closePath();
  }
  /* Motor lancha. opts: stripe (colour), outboard (bool), lights (bool, night glow) */
  function lanchaTop(ctx, L, opts){
    opts = opts || {};
    var B = L * 0.4;
    ctx.save();
    // shadow on the water
    ctx.save(); ctx.translate(L * 0.03, L * 0.05); hullPath(ctx, L, B);
    ctx.fillStyle = 'rgba(0,25,45,0.30)'; ctx.filter = 'blur(' + Math.max(1, L * 0.035) + 'px)'; ctx.fill(); ctx.restore();
    // hull
    hullPath(ctx, L, B);
    var g = ctx.createLinearGradient(-B / 2, 0, B / 2, 0);
    g.addColorStop(0, '#a9b6c0'); g.addColorStop(0.18, '#eef2f5'); g.addColorStop(0.45, '#ffffff'); g.addColorStop(0.8, '#e2e8ec'); g.addColorStop(1, '#9aa8b2');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(0.8, L * 0.012); ctx.strokeStyle = 'rgba(30,50,70,0.55)'; ctx.stroke();
    // coloured sheer stripe
    if (opts.stripe){
      ctx.save(); hullPath(ctx, L, B); ctx.clip();
      ctx.lineWidth = L * 0.05; ctx.strokeStyle = opts.stripe; hullPath(ctx, L, B); ctx.stroke(); ctx.restore();
    }
    // deck (non-skid)
    ctx.save(); ctx.scale(0.8, 0.86); ctx.translate(0, L * 0.02); hullPath(ctx, L, B);
    var dg = ctx.createLinearGradient(0, -L / 2, 0, L / 2);
    dg.addColorStop(0, '#efe9dc'); dg.addColorStop(1, '#ddd5c3');
    ctx.fillStyle = dg; ctx.fill(); ctx.restore();
    // bow hatch
    rrect(ctx, -B * 0.14, -L * 0.30, B * 0.28, L * 0.11, L * 0.02); ctx.fillStyle = '#f7f5f0'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.8; ctx.stroke();
    // console + windscreen
    ctx.beginPath(); ctx.moveTo(-B * 0.26, -L * 0.04); ctx.lineTo(B * 0.26, -L * 0.04); ctx.lineTo(B * 0.2, -L * 0.12); ctx.lineTo(-B * 0.2, -L * 0.12); ctx.closePath();
    var wg = ctx.createLinearGradient(0, -L * 0.12, 0, -L * 0.04); wg.addColorStop(0, '#5f8aa6'); wg.addColorStop(1, '#1d3a50');
    ctx.fillStyle = wg; ctx.fill();
    rrect(ctx, -B * 0.24, -L * 0.04, B * 0.48, L * 0.13, L * 0.025);
    var cg = ctx.createLinearGradient(-B * 0.24, 0, B * 0.24, 0); cg.addColorStop(0, '#d9dfe3'); cg.addColorStop(0.5, '#ffffff'); cg.addColorStop(1, '#cfd6db');
    ctx.fillStyle = cg; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.stroke();
    // seat
    rrect(ctx, -B * 0.3, L * 0.14, B * 0.6, L * 0.08, L * 0.03); ctx.fillStyle = opts.seat || '#2f4a63'; ctx.fill();
    // cleats
    ctx.fillStyle = '#9aa4ab';
    [[-0.36, 0.40], [0.36, 0.40], [0, -0.42]].forEach(function(p){ rrect(ctx, p[0] * B - L * 0.02, p[1] * L - L * 0.008, L * 0.04, L * 0.016, L * 0.008); ctx.fill(); });
    // outboard
    if (opts.outboard !== false){
      rrect(ctx, -B * 0.15, L * 0.46, B * 0.30, L * 0.13, L * 0.03);
      var og = ctx.createLinearGradient(-B * 0.15, 0, B * 0.15, 0); og.addColorStop(0, '#22262b'); og.addColorStop(0.45, '#4a525a'); og.addColorStop(1, '#1b1e22');
      ctx.fillStyle = og; ctx.fill();
    }
    ctx.restore();
  }
  /* Sailing boat seen from above. boom: angle of boom from centreline (rad, + = toward starboard) */
  function veleroTop(ctx, L, boom, opts){
    opts = opts || {};
    var B = L * 0.32;
    ctx.save();
    function hp(){
      ctx.beginPath(); ctx.moveTo(0, -L / 2);
      ctx.bezierCurveTo(B * 0.45, -L * 0.30, B * 0.52, L * 0.05, B * 0.42, L * 0.46);
      ctx.quadraticCurveTo(0, L * 0.52, -B * 0.42, L * 0.46);
      ctx.bezierCurveTo(-B * 0.52, L * 0.05, -B * 0.45, -L * 0.30, 0, -L / 2); ctx.closePath();
    }
    ctx.save(); ctx.translate(L * 0.03, L * 0.05); hp(); ctx.fillStyle = 'rgba(0,25,45,0.28)'; ctx.filter = 'blur(' + Math.max(1, L * 0.035) + 'px)'; ctx.fill(); ctx.restore();
    hp();
    var g = ctx.createLinearGradient(-B / 2, 0, B / 2, 0);
    g.addColorStop(0, '#a9b6c0'); g.addColorStop(0.3, '#ffffff'); g.addColorStop(0.75, '#e6ebee'); g.addColorStop(1, '#98a6b0');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = Math.max(0.8, L * 0.012); ctx.strokeStyle = 'rgba(30,50,70,0.55)'; ctx.stroke();
    // teak deck
    ctx.save(); ctx.scale(0.8, 0.88); hp(); ctx.fillStyle = '#c99a62'; ctx.fill();
    ctx.clip(); ctx.strokeStyle = 'rgba(70,40,10,0.25)'; ctx.lineWidth = 0.6;
    for (var x = -B; x < B; x += L * 0.03){ ctx.beginPath(); ctx.moveTo(x, -L); ctx.lineTo(x, L); ctx.stroke(); }
    ctx.restore();
    rrect(ctx, -B * 0.24, -L * 0.12, B * 0.48, L * 0.3, L * 0.05); ctx.fillStyle = '#f4f6f7'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.stroke();
    // sails
    var mast = -L * 0.12;
    var bl = L * 0.5, bx = Math.sin(boom) * bl, by = mast + Math.cos(boom) * bl;
    var belly = (boom >= 0 ? 1 : -1) * L * 0.17;
    function sail(x0, y0, x1, y1, bel, col){
      var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, n = Math.sqrt(dx * dx + dy * dy) || 1;
      var cx = mx + (-dy / n) * bel * -1, cy = my + (dx / n) * bel * -1;
      if (Math.abs(boom) < 0.02) { cx = mx; cy = my; }
      // sail cloth seen from above: a thin crescent between the chord (boom) and the curved belly
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.lineTo(x0, y0); ctx.closePath();
      ctx.save(); ctx.shadowColor = 'rgba(0,20,40,0.35)'; ctx.shadowBlur = L * 0.08; ctx.shadowOffsetX = L * 0.03; ctx.shadowOffsetY = L * 0.05;
      ctx.fillStyle = col; ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(30,40,50,0.45)'; ctx.lineWidth = Math.max(0.8, L * 0.014); ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = '#4b5563'; ctx.lineWidth = Math.max(1, L * 0.025); ctx.stroke();
    }
    if (opts.luff){ // flapping sails
      var fl = Math.sin((opts.t || 0) * 18) * L * 0.04;
      sail(0, mast, fl, mast + bl, 0, '#fbfbf6'); sail(0, -L * 0.46, fl * 0.6, mast - L * 0.02, 0, '#f1efe6');
    } else {
      sail(0, mast, bx, by, belly, '#fbfbf6');
      var jl = L * 0.36, jx = Math.sin(boom * 0.9) * jl * 0.95, jy = -L * 0.46 + Math.cos(boom * 0.9) * jl;
      if (opts.wingJib) { jx = -Math.sin(boom) * jl * 0.9; jy = -L * 0.46 + Math.cos(boom) * jl * 0.6; }
      sail(0, -L * 0.46, jx, jy, belly * 0.7 * (opts.wingJib ? -1 : 1), '#f1efe6');
    }
    ctx.fillStyle = '#3a3f45'; ctx.beginPath(); ctx.arc(0, mast, L * 0.025, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* Wake: trail of [x, y, heading] samples (oldest first). */
  function drawWake(ctx, trail, L, speedScale){
    var n = trail.length; if (n < 3) return;
    ctx.save(); ctx.lineCap = 'round';
    for (var i = 1; i < n; i++){
      var p = trail[i], q = trail[i - 1], age = (n - i) / n;
      var a = (1 - age);
      var spread = L * (0.18 + age * 0.9) * (speedScale || 1);
      var h = p[2] * D2R, nx = Math.cos(h), ny = Math.sin(h);
      var hq = q[2] * D2R, qx = Math.cos(hq), qy = Math.sin(hq);
      var spreadQ = L * (0.18 + Math.min(1, age + 1 / n) * 0.9) * (speedScale || 1);
      ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.55).toFixed(3) + ')';
      ctx.lineWidth = Math.max(1, L * 0.05 * (0.6 + a));
      ctx.beginPath(); ctx.moveTo(q[0] + qx * spreadQ, q[1] + qy * spreadQ); ctx.lineTo(p[0] + nx * spread, p[1] + ny * spread); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(q[0] - qx * spreadQ, q[1] - qy * spreadQ); ctx.lineTo(p[0] - nx * spread, p[1] - ny * spread); ctx.stroke();
      ctx.strokeStyle = 'rgba(230,248,255,' + (a * 0.35).toFixed(3) + ')';
      ctx.lineWidth = L * 0.16 * a;
      ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------------- animation loop (only visible figures tick) ---------------- */
  var anims = [], _raf = 0, _last = 0;
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(es){
    es.forEach(function(e){ anims.forEach(function(a){ if (a.el === e.target) a.vis = e.isIntersecting; }); });
    kick();
  }, { rootMargin: '80px' }) : null;
  function addAnim(el, tick){
    var a = { el: el, tick: tick, vis: !io, t: 0 };
    anims.push(a); if (io) io.observe(el);
    kick(); return a;
  }
  function kick(){ if (!_raf) { _last = 0; _raf = requestAnimationFrame(loop); } }
  function loop(ts){
    _raf = 0;
    var dt = _last ? Math.min(0.05, (ts - _last) / 1000) : 0.016; _last = ts;
    var any = false;
    for (var i = anims.length - 1; i >= 0; i--){
      var a = anims[i];
      if (!a.el.isConnected){ anims.splice(i, 1); continue; }
      if (!a.vis || a.el.offsetParent === null || a.paused) continue;
      any = true; a.t += dt;
      try { if (a.tick(a.t, dt) === false) a.paused = true; } catch (err) { a.paused = true; if (window.console) console.warn(err); }
    }
    if (any) _raf = requestAnimationFrame(loop);
  }
  function resume(a){ a.paused = false; kick(); }

  /* ---------------- figure frame ---------------- */
  var FIG = {};
  function frame(el, title, caption, tag){
    el.innerHTML = '<figure class="pl-figure">' +
      '<div class="pl-fig-head"><span class="pl-fig-tag">' + esc(tag || 'Diagrama') + '</span><b>' + esc(title) + '</b></div>' +
      '<div class="pl-fig-stage"></div><div class="pl-fig-ctrl"></div>' +
      (caption ? '<figcaption class="pl-fig-cap">' + caption + '</figcaption>' : '') + '</figure>';
    return { fig: el.firstChild, stage: el.querySelector('.pl-fig-stage'), ctrl: el.querySelector('.pl-fig-ctrl'), cap: el.querySelector('.pl-fig-cap') };
  }
  /* segmented buttons; onPick(i) */
  function segs(ctrl, names, onPick, cur, aria){
    var wrap = document.createElement('div'); wrap.className = 'pl-seg'; wrap.setAttribute('role', 'group');
    if (aria) wrap.setAttribute('aria-label', aria);
    names.forEach(function(n, i){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pl-seg-b' + (i === (cur || 0) ? ' on' : '');
      b.textContent = n; b.setAttribute('aria-pressed', i === (cur || 0) ? 'true' : 'false');
      b.addEventListener('click', function(){
        wrap.querySelectorAll('.pl-seg-b').forEach(function(x, j){ x.classList.toggle('on', j === i); x.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
        onPick(i);
      });
      wrap.appendChild(b);
    });
    ctrl.appendChild(wrap);
    return wrap;
  }
  function btn(ctrl, txt, onClick, cls, aria){
    var b = document.createElement('button'); b.type = 'button'; b.className = 'pl-mini-btn ' + (cls || ''); b.textContent = txt;
    if (aria) b.setAttribute('aria-label', aria);
    b.addEventListener('click', onClick); ctrl.appendChild(b); return b;
  }
  function canvasIn(stage, aspect, maxH){
    var cv = document.createElement('canvas'); cv.className = 'pl-cv';
    stage.appendChild(cv);
    function size(){
      var w = stage.clientWidth || 320, h = Math.round(w * aspect);
      if (maxH && h > maxH){ h = maxH; }
      return fit(cv, w, h);
    }
    return { cv: cv, size: size };
  }
  /* svg label helper (string) */
  function T(x, y, txt, o){
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" class="pl-sl' + (o.cls ? ' ' + o.cls : '') + '"' +
      (o.anchor ? ' text-anchor="' + o.anchor + '"' : ' text-anchor="middle"') +
      (o.size ? ' font-size="' + o.size + '"' : '') + (o.fill ? ' fill="' + o.fill + '"' : '') +
      (o.rot ? ' transform="rotate(' + o.rot + ' ' + x + ' ' + y + ')"' : '') +
      (o.id ? ' data-k="' + o.id + '"' : '') + '>' + esc(txt) + '</text>';
  }
  function leader(x0, y0, x1, y1, col){
    return '<path d="M' + x0 + ',' + y0 + ' L' + x1 + ',' + y1 + '" class="pl-lead"' + (col ? ' stroke="' + col + '"' : '') + '/>' +
      '<circle cx="' + x0 + '" cy="' + y0 + '" r="2.4" class="pl-lead-dot"' + (col ? ' fill="' + col + '"' : '') + '/>';
  }
  function dimV(x, y0, y1, txt, side, col){
    col = col || '#B45309';
    var tx = x + (side || 1) * 8;
    return '<g class="pl-dim" stroke="' + col + '" fill="' + col + '">' +
      '<path d="M' + x + ',' + y0 + ' L' + x + ',' + y1 + '" stroke-width="1.6"/>' +
      '<path d="M' + (x - 4) + ',' + y0 + ' h8 M' + (x - 4) + ',' + y1 + ' h8" stroke-width="1.6"/>' +
      '<path d="M' + x + ',' + y0 + ' l-3.5,7 h7 z M' + x + ',' + y1 + ' l-3.5,-7 h7 z" stroke="none"/></g>' +
      T(tx, (y0 + y1) / 2 + 4, txt, { anchor: side < 0 ? 'end' : 'start', fill: col, cls: 'pl-sl-dim' });
  }
  function dimH(y, x0, x1, txt, col, dy){
    col = col || '#B45309';
    return '<g class="pl-dim" stroke="' + col + '" fill="' + col + '">' +
      '<path d="M' + x0 + ',' + y + ' L' + x1 + ',' + y + '" stroke-width="1.6"/>' +
      '<path d="M' + x0 + ',' + (y - 4) + ' v8 M' + x1 + ',' + (y - 4) + ' v8" stroke-width="1.6"/>' +
      '<path d="M' + x0 + ',' + y + ' l7,-3.5 v7 z M' + x1 + ',' + y + ' l-7,-3.5 v7 z" stroke="none"/></g>' +
      T((x0 + x1) / 2, y + (dy == null ? -6 : dy), txt, { fill: col, cls: 'pl-sl-dim' });
  }

  /* svg pointer → viewBox coords */
  function svgPt(svg, ev){
    var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    return { x: vb.x + (ev.clientX - r.left) * vb.width / r.width, y: vb.y + (ev.clientY - r.top) * vb.height / r.height };
  }

  /* =====================================================================
     1. PARTES DE LA EMBARCACIÓN — planta y perfil, con partes tocables
     ===================================================================== */
  var PARTS = {
    proa: ['Proa', 'Parte delantera de la embarcación.'],
    popa: ['Popa', 'Parte trasera de la embarcación.'],
    babor: ['Babor', 'Costado izquierdo mirando de popa a proa. Color rojo.'],
    estribor: ['Estribor', 'Costado derecho mirando de popa a proa. Color verde.'],
    amura: ['Amura', 'Parte del costado hacia proa (unos 45° desde la proa).'],
    traves: ['Través', 'Dirección perpendicular a la crujía, en el medio del costado (90°).'],
    aleta: ['Aleta', 'Parte del costado hacia popa (unos 45° desde la popa).'],
    eslora: ['Eslora', 'Largo de la embarcación.'],
    manga: ['Manga', 'Ancho máximo de la embarcación.'],
    crujia: ['Crujía', 'Línea central de proa a popa que divide la embarcación en babor y estribor.'],
    calado: ['Calado', 'De la línea de flotación a lo más bajo del casco (quilla u orza): el agua mínima que necesitas.'],
    puntal: ['Puntal', 'Altura de la quilla a la cubierta.'],
    guinda: ['Guinda', 'De la flotación al punto más alto del mástil.'],
    flotacion: ['Línea de flotación', 'Separa la obra viva (sumergida) de la obra muerta (sobre el agua).'],
    obraviva: ['Obra viva', 'Casco sumergido, bajo la línea de flotación.'],
    obramuerta: ['Obra muerta', 'Casco sobre el agua, encima de la línea de flotación.'],
    quilla: ['Quilla', 'Pieza inferior que corre de proa a popa; la "columna" del casco.'],
    roda: ['Roda', 'Pieza afilada de proa, continuación de la quilla hacia arriba.'],
    codaste: ['Codaste', 'Continuación de la quilla por popa; en él va el timón.'],
    timon: ['Timón', 'Pala que, al girar, orienta la popa y así gobierna la embarcación.'],
    helice: ['Hélice', 'Convierte el giro del motor en empuje.'],
    casco: ['Casco', 'Cuerpo de la nave.'],
    cubierta: ['Cubierta', 'Superficie que cierra el casco por arriba.'],
    espejo: ['Espejo de popa', 'Tabla plana de la popa; en una lancha con fueraborda, el motor se trinca a él.']
  };
  FIG.barco = function(el){
    var f = frame(el, 'Partes de la embarcación', 'Toca una parte para ver su definición. En una lancha con <b>fueraborda</b> no hay timón: el propio motor gira para gobernar.', 'Interactivo');
    var p = uid();
    var defs = '<defs>' +
      '<linearGradient id="' + p + 'hull" x1="0" x2="1"><stop offset="0" stop-color="#a7b4be"/><stop offset=".2" stop-color="#eef2f5"/><stop offset=".5" stop-color="#fff"/><stop offset=".82" stop-color="#e1e7eb"/><stop offset="1" stop-color="#97a5b0"/></linearGradient>' +
      '<linearGradient id="' + p + 'deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1ebdf"/><stop offset="1" stop-color="#dcd3c0"/></linearGradient>' +
      '<linearGradient id="' + p + 'side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e9eef1"/><stop offset="1" stop-color="#c7d1d8"/></linearGradient>' +
      '<linearGradient id="' + p + 'af" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e2a22"/><stop offset="1" stop-color="#5a1712"/></linearGradient>' +
      '<linearGradient id="' + p + 'sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc2dc" stop-opacity=".85"/><stop offset="1" stop-color="#1f6f96" stop-opacity=".95"/></linearGradient>' +
      '<linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf5fb"/><stop offset="1" stop-color="#f8fbfd"/></linearGradient>' +
      '<linearGradient id="' + p + 'glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ea7c0"/><stop offset="1" stop-color="#1f3b52"/></linearGradient>' +
      '<linearGradient id="' + p + 'bronze" x1="0" x2="1"><stop offset="0" stop-color="#7a5a1c"/><stop offset=".5" stop-color="#e2c26a"/><stop offset="1" stop-color="#6e4f15"/></linearGradient>' +
      '<filter id="' + p + 'sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="#0b2233" flood-opacity=".28"/></filter>' +
      '</defs>';
    var hull = 'M200,34 C238,60 262,118 262,188 L258,318 L142,318 L138,188 C138,118 162,60 200,34 Z';
    var planta = '<svg viewBox="0 0 400 400" class="pl-svg" role="img" aria-label="Planta de una lancha: proa, popa, babor, estribor, amura, través y aleta">' + defs +
      '<rect x="0" y="0" width="400" height="400" fill="#eef6fa"/>' +
      // sectors / directions
      '<g opacity=".9">' +
      '<path d="M200,190 L200,26" stroke="#94a3b8" stroke-dasharray="5 5" stroke-width="1.4"/>' +
      '<path d="M200,190 L200,368" stroke="#94a3b8" stroke-dasharray="5 5" stroke-width="1.4"/>' +
      '<path d="M200,190 L316,74" class="pl-ray" data-k="amura"/><path d="M200,190 L84,74" class="pl-ray" data-k="amura"/>' +
      '<path d="M200,190 L336,190" class="pl-ray" data-k="traves"/><path d="M200,190 L64,190" class="pl-ray" data-k="traves"/>' +
      '<path d="M200,190 L316,306" class="pl-ray" data-k="aleta"/><path d="M200,190 L84,306" class="pl-ray" data-k="aleta"/>' +
      '</g>' +
      '<g filter="url(#' + p + 'sh)"><path d="' + hull + '" fill="url(#' + p + 'hull)" stroke="#475569" stroke-width="1.6"/></g>' +
      '<path d="M200,54 C230,76 248,124 248,188 L246,306 L154,306 L152,188 C152,124 170,76 200,54 Z" fill="url(#' + p + 'deck)" stroke="#b9ad94" stroke-width="1"/>' +
      '<rect x="184" y="86" width="32" height="26" rx="4" fill="#faf8f3" stroke="#c9bfa8"/>' +
      '<path d="M170,178 L230,178 L224,160 L176,160 Z" fill="url(#' + p + 'glass)"/>' +
      '<rect x="172" y="178" width="56" height="34" rx="6" fill="#fff" stroke="#c3cbd1"/>' +
      '<rect x="166" y="236" width="68" height="16" rx="7" fill="#2f4a63"/>' +
      '<rect x="176" y="284" width="48" height="22" rx="3" fill="#e8e2d4" stroke="#bfb49b"/>' +
      '<path d="M200,190 L200,290" stroke="#64748b" stroke-width="1" stroke-dasharray="3 4" class="pl-hot" data-k="crujia"/>' +
      // sidelights (bow)
      '<circle cx="180" cy="72" r="4.2" fill="#dc2626" stroke="#7f1d1d"/><circle cx="220" cy="72" r="4.2" fill="#16a34a" stroke="#14532d"/>' +
      // cleats
      '<rect x="194" y="60" width="12" height="4" rx="2" fill="#94a3b8"/><rect x="152" y="300" width="12" height="4" rx="2" fill="#94a3b8"/><rect x="236" y="300" width="12" height="4" rx="2" fill="#94a3b8"/>' +
      // labels
      T(200, 20, 'PROA', { id: 'proa', cls: 'pl-hot pl-sl-big' }) + T(200, 388, 'POPA', { id: 'popa', cls: 'pl-hot pl-sl-big' }) +
      T(84, 236, 'BABOR', { id: 'babor', cls: 'pl-hot pl-sl-big', fill: '#B91C1C' }) + T(84, 252, '(izquierda)', { fill: '#B91C1C', size: 10 }) +
      T(318, 236, 'ESTRIBOR', { id: 'estribor', cls: 'pl-hot pl-sl-big', fill: '#047857' }) + T(318, 252, '(derecha)', { fill: '#047857', size: 10 }) +
      T(334, 66, 'amura', { id: 'amura', cls: 'pl-hot' }) + T(66, 66, 'amura', { id: 'amura', cls: 'pl-hot' }) +
      T(356, 182, 'través', { id: 'traves', cls: 'pl-hot' }) + T(64, 182, 'través', { id: 'traves', cls: 'pl-hot' }) +
      T(334, 322, 'aleta', { id: 'aleta', cls: 'pl-hot' }) + T(66, 322, 'aleta', { id: 'aleta', cls: 'pl-hot' }) +
      T(212, 270, 'crujía', { id: 'crujia', cls: 'pl-hot', anchor: 'start', size: 10 }) +
      '<g class="pl-hot" data-k="eslora">' + dimV(22, 34, 318, '', -1) + '</g>' + T(14, 120, 'ESLORA', { id: 'eslora', cls: 'pl-hot pl-sl-dim', rot: -90, fill: '#B45309' }) +
      '<g class="pl-hot" data-k="manga">' + dimH(350, 138, 262, 'MANGA', null, 16) + '</g>' +
      '</svg>';
    var perfil = '<svg viewBox="0 0 400 300" class="pl-svg" role="img" aria-label="Perfil de una lancha: obra viva, obra muerta, calado, puntal, guinda, quilla, roda, codaste, timón y hélice">' + defs +
      '<rect x="0" y="0" width="400" height="300" fill="url(#' + p + 'sky)"/>' +
      '<rect x="0" y="176" width="400" height="124" fill="url(#' + p + 'sea)"/>' +
      // mast (guinda)
      '<path d="M212,96 L212,40" stroke="#475569" stroke-width="3"/><circle cx="212" cy="40" r="4" fill="#fff" stroke="#475569"/>' +
      // cabin/console
      '<path d="M150,128 L250,128 L268,98 L172,98 Z" fill="#f8fafc" stroke="#94a3b8"/><path d="M176,104 L262,104 L252,122 L166,122 Z" fill="url(#' + p + 'glass)"/>' +
      // hull above water (obra muerta) + below (obra viva)
      '<path class="pl-hot" data-k="obramuerta" d="M50,130 L330,130 C350,132 362,136 372,128 L352,176 L60,176 L52,150 Z" fill="url(#' + p + 'side)" stroke="#64748b" stroke-width="1.4"/>' +
      '<path class="pl-hot" data-k="obraviva" d="M60,176 L352,176 C340,196 318,212 270,218 L96,218 C76,214 64,198 60,176 Z" fill="url(#' + p + 'af)" stroke="#3f0d09" stroke-width="1.2"/>' +
      '<path d="M50,130 L330,130 C350,132 362,136 372,128" fill="none" stroke="#1e3a5f" stroke-width="4"/>' +
      // keel
      '<path class="pl-hot" data-k="quilla" d="M96,218 L280,218 L272,226 L104,226 Z" fill="#2b2b2b"/>' +
      // stem (roda) / sternpost (codaste)
      '<path class="pl-hot" data-k="roda" d="M372,128 L352,176 C340,196 318,212 280,218" fill="none" stroke="#B45309" stroke-width="4" stroke-linecap="round"/>' +
      '<path class="pl-hot" data-k="codaste" d="M104,222 L82,224 L74,186" fill="none" stroke="#B45309" stroke-width="4" stroke-linecap="round"/>' +
      // rudder + prop
      '<path class="pl-hot" data-k="timon" d="M72,190 L56,192 L54,232 L72,232 Z" fill="#4b5563" stroke="#1f2937"/>' +
      '<g class="pl-hot" data-k="helice"><path d="M104,222 L88,222" stroke="#57534e" stroke-width="3"/><ellipse cx="88" cy="214" rx="3.4" ry="10" fill="url(#' + p + 'bronze)"/><ellipse cx="88" cy="231" rx="3.4" ry="10" fill="url(#' + p + 'bronze)"/></g>' +
      // waterline
      '<path class="pl-hot" data-k="flotacion" d="M8,176 L392,176" stroke="#0E7490" stroke-width="2" stroke-dasharray="7 5"/>' +
      // waves
      '<path d="M0,180 q12,-5 24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0 t24,0" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/>' +
      // dims
      '<g class="pl-hot" data-k="calado">' + dimV(300, 176, 226, 'calado', 1) + '</g>' +
      '<g class="pl-hot" data-k="puntal">' + dimV(240, 130, 226, 'puntal', 1, '#6D28D9') + '</g>' +
      '<g class="pl-hot" data-k="guinda">' + dimV(30, 36, 176, 'guinda', 1, '#0E7490') + '</g>' +
      '<path d="M30,36 L208,36" stroke="#0E7490" stroke-dasharray="3 3" stroke-width="1"/>' +
      '<g class="pl-hot" data-k="eslora">' + dimH(262, 50, 372, 'ESLORA', null, 16) + '</g>' +
      '<path d="M50,130 L50,262 M372,128 L372,262" stroke="#B45309" stroke-dasharray="3 3" stroke-width="1"/>' +
      // labels
      T(372, 116, 'PROA →', { id: 'proa', cls: 'pl-hot', anchor: 'end' }) + T(52, 118, '← POPA', { id: 'popa', cls: 'pl-hot', anchor: 'start' }) +
      T(150, 156, 'obra muerta', { id: 'obramuerta', cls: 'pl-hot' }) + T(170, 202, 'obra viva', { id: 'obraviva', cls: 'pl-hot pl-sl-inv', fill: '#fff' }) +
      T(392, 170, 'línea de flotación', { id: 'flotacion', cls: 'pl-hot', anchor: 'end', size: 10, fill: '#0E7490' }) +
      T(190, 242, 'quilla', { id: 'quilla', cls: 'pl-hot' }) + T(352, 214, 'roda', { id: 'roda', cls: 'pl-hot', fill: '#B45309', anchor: 'start' }) +
      T(66, 172, 'codaste', { id: 'codaste', cls: 'pl-hot', fill: '#B45309' }) +
      T(46, 250, 'timón', { id: 'timon', cls: 'pl-hot' }) + T(106, 250, 'hélice', { id: 'helice', cls: 'pl-hot' }) +
      T(318, 150, 'casco', { id: 'casco', cls: 'pl-hot', size: 11 }) + T(200, 90, 'cubierta', { id: 'cubierta', cls: 'pl-hot', size: 10 }) +
      '</svg>';
    var info = document.createElement('div'); info.className = 'pl-fig-info'; info.setAttribute('aria-live', 'polite');
    info.innerHTML = '<b>Toca una parte</b> del dibujo o un nombre.';
    function show(view){
      f.stage.innerHTML = view ? perfil : planta;
      f.stage.querySelectorAll('[data-k]').forEach(function(n){
        n.addEventListener('click', function(){ pick(n.getAttribute('data-k')); });
      });
    }
    function pick(k){
      var d = PARTS[k]; if (!d) return;
      info.innerHTML = '<b>' + esc(d[0]) + '</b> — ' + esc(d[1]);
      f.stage.querySelectorAll('[data-k]').forEach(function(n){ n.classList.toggle('pl-hl', n.getAttribute('data-k') === k); });
    }
    segs(f.ctrl, ['Planta (desde arriba)', 'Perfil (costado)'], show, 0, 'Vista');
    f.fig.insertBefore(info, f.cap);
    show(0);
  };

  /* =====================================================================
     2. LUCES DE NAVEGACIÓN — sectores + vista nocturna desde cualquier
        marcación (RIPA Reglas 21–30)
     ===================================================================== */
  // sectores, en marcación relativa desde la proa (horario)
  function secVisible(sec, th){
    th = ((th % 360) + 360) % 360;
    switch (sec){
      case 'tope': return th <= 112.5 || th >= 247.5;
      case 'er': return th <= 112.5;
      case 'br': return th >= 247.5 || th === 0;
      case 'alc': return th >= 112.5 && th <= 247.5;
      default: return true;
    }
  }
  var LCOL = { w: '#fffaf0', r: '#ff3b2f', g: '#2cff6a', y: '#ffc21a' };
  var LNAME = { tope: 'blanca de tope (225°)', er: 'verde de costado (112,5°)', br: 'roja de costado (112,5°)', alc: 'blanca de alcance (135°)',
    alcy: 'amarilla de remolque (135°)', w360: 'blanca todo horizonte', r360: 'roja todo horizonte', g360: 'verde todo horizonte' };
  function Lt(col, sec, a, b, h, key){ return { c: col, s: sec, a: a, b: b || 0, h: h, k: key || (sec === '360' ? col + '360' : sec) }; }
  function sides(a, b, h){ return [Lt('g', 'er', a, b, h), Lt('r', 'br', a, -b, h)]; }
  var VESSELS = [
    { id: 'm12', name: 'A motor, eslora < 12 m', hull: 'lancha', len: 0.62, lights: [Lt('w', '360', -0.75, 0, 0.5)].concat(sides(0.92, 0.04, 0.12)),
      note: 'Con eslora menor de 12 m puede llevar, en vez de tope y alcance, <b>una blanca todo horizonte</b> más las luces de costado (a menudo en un farol bicolor a proa).' },
    { id: 'm50', name: 'A motor, eslora < 50 m', hull: 'motor', len: 0.85, lights: [Lt('w', 'tope', 0.3, 0, 0.72), Lt('w', 'alc', -1, 0, 0.22)].concat(sides(0.1, 0.34, 0.32)),
      note: 'Luz de <b>tope</b> a proa, luces de <b>costado</b> y luz de <b>alcance</b> a popa.' },
    { id: 'm50p', name: 'A motor, eslora ≥ 50 m', hull: 'ship', len: 1, lights: [Lt('w', 'tope', 0.55, 0, 0.55), Lt('w', 'tope', -0.35, 0, 0.85), Lt('w', 'alc', -1, 0, 0.2)].concat(sides(0, 0.3, 0.32)),
      note: '<b>Dos luces de tope</b>: la de popa más alta que la de proa. Más costados y alcance.' },
    { id: 'vela', name: 'Velero navegando a vela', hull: 'velero', len: 0.62, group: 'vela', lights: [Lt('w', 'alc', -1, 0, 0.12)].concat(sides(0.86, 0.12, 0.12)),
      note: 'Solo luces de <b>costado</b> y de <b>alcance</b>: <b>sin luz de tope</b>. Si navega a motor, lleva las luces de un buque a motor.' },
    { id: 'vela20', name: 'Velero < 20 m (farol tricolor)', hull: 'velero', len: 0.62, group: 'vela', lights: [Lt('g', 'er', 0.08, 0.012, 1.32), Lt('r', 'br', 0.08, -0.012, 1.32), Lt('w', 'alc', 0.06, 0, 1.32)],
      note: 'Con eslora menor de 20 m, costados y alcance pueden ir juntos en un <b>farol tricolor</b> en el tope del palo.' },
    { id: 'fondeo', name: 'Fondeado (eslora < 50 m)', hull: 'motor', len: 0.85, lights: [Lt('w', '360', 0.75, 0, 0.42)],
      note: 'Una <b>blanca todo horizonte</b> donde mejor se vea. Sin luces de costado (no navega). De día: <b>1 esfera</b>.' },
    { id: 'nuc', name: 'Sin gobierno, con arrancada', hull: 'motor', len: 0.85, lights: [Lt('r', '360', 0.15, 0, 0.86), Lt('r', '360', 0.15, 0, 0.66), Lt('w', 'alc', -1, 0, 0.22)].concat(sides(0.1, 0.34, 0.32)),
      note: '<b>Dos rojas todo horizonte</b> en línea vertical; con arrancada, además costados y alcance. De día: <b>2 esferas</b>.' },
    { id: 'pesca', name: 'Pescando al arrastre, con arrancada', hull: 'motor', len: 0.85, lights: [Lt('g', '360', 0.2, 0, 0.86), Lt('w', '360', 0.2, 0, 0.66), Lt('w', 'alc', -1, 0, 0.22)].concat(sides(0.1, 0.34, 0.32)),
      note: '<b>Verde sobre blanca</b>, todo horizonte; con arrancada, además costados y alcance. (Otra pesca que no sea de arrastre: <b>roja sobre blanca</b>.)' },
    { id: 'remolque', name: 'Remolcando (remolque < 200 m)', hull: 'motor', len: 0.85, lights: [Lt('w', 'tope', 0.4, 0, 0.84), Lt('w', 'tope', 0.4, 0, 0.64), Lt('w', 'alc', -1, 0, 0.2), Lt('y', 'alc', -1, 0, 0.42, 'alcy')].concat(sides(0.1, 0.34, 0.32)),
      note: '<b>Dos luces de tope</b> en línea vertical, costados, alcance y, sobre la de alcance, la <b>amarilla de remolque</b>.' },
    { id: 'ram', name: 'Maniobra restringida, con arrancada', hull: 'motor', len: 0.85, lights: [Lt('r', '360', -0.15, 0, 0.98), Lt('w', '360', -0.15, 0, 0.8), Lt('r', '360', -0.15, 0, 0.62), Lt('w', 'tope', 0.55, 0, 0.6), Lt('w', 'alc', -1, 0, 0.22)].concat(sides(0.1, 0.34, 0.32)),
      note: '<b>Roja–blanca–roja</b> todo horizonte en línea vertical; con arrancada, además tope, costados y alcance. De día: <b>bola–rombo–bola</b>.' }
  ];
  function bearingName(th){
    th = ((Math.round(th) % 360) + 360) % 360;
    var side = th < 180 ? 'estribor' : 'babor', r = th < 180 ? th : 360 - th;
    if (r <= 11) return 'por la proa';
    if (r >= 169) return 'por la popa';
    if (r < 79) return 'por la amura de ' + side;
    if (r <= 101) return 'por el través de ' + side;
    return 'por la aleta de ' + side;
  }
  function visibleLights(V, th){ return V.lights.filter(function(L){ return secVisible(L.s, th); }); }
  function lightSig(V, th){
    var vis = visibleLights(V, th);
    var cols = vis.map(function(L){ return L.c; }).sort().join('');
    var stacks = {};
    vis.forEach(function(L){ var k = Math.round(L.a * 20) + ':' + Math.round(L.b * 50); (stacks[k] = stacks[k] || []).push(L); });
    var st = Object.keys(stacks).map(function(k){ return stacks[k].length > 1 ? stacks[k].sort(function(p, q){ return q.h - p.h; }).map(function(L){ return L.c; }).join('') : ''; }).filter(Boolean).sort().join(',');
    return cols + '|' + st;
  }
  // Night view of vessel V seen from relative bearing th (observer's bearing from the vessel's bow)
  function drawNight(ctx, w, h, V, th, t){
    var hz = h * 0.6;
    var sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, '#04070f'); sky.addColorStop(1, '#14223a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hz);
    var sea = ctx.createLinearGradient(0, hz, 0, h);
    sea.addColorStop(0, '#0c1828'); sea.addColorStop(1, '#03070d');
    ctx.fillStyle = sea; ctx.fillRect(0, hz, w, h - hz);
    var r = rng(11);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (var i = 0; i < 60; i++){ var sx = r() * w, sy = r() * hz * 0.9, sz = r() * 1.1 + 0.2; ctx.globalAlpha = 0.3 + r() * 0.6; ctx.fillRect(sx, sy, sz, sz); }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(140,170,210,0.18)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, hz); ctx.lineTo(w, hz); ctx.stroke();
    var c = Math.cos(th * D2R), s = Math.sin(th * D2R);
    var S = w * 0.3 * V.len, Hs = h * 0.42, half = V.hull === 'ship' ? 0.17 : V.hull === 'velero' ? 0.2 : 0.26;
    function P(a, b, hh){
      var X = b * half * 2.0, Y = a;
      var sx = w / 2 + S * (X * -c + Y * s);
      var d = X * -s + Y * -c;
      return { x: sx, y: hz + 6 - hh * Hs * (V.len * 0.8 + 0.2) - d * S * 0.05, d: d };
    }
    // hull silhouette (convex hull of deck and waterline outline)
    var pts = [], k, a, bb;
    for (k = 0; k <= 16; k++){
      a = -1 + 2 * k / 16;
      bb = a > 0.2 ? (1 - Math.pow((a - 0.2) / 0.8, 1.6)) : 1;
      [[a, bb], [a, -bb]].forEach(function(q){ pts.push(P(q[0], q[1], 0)); pts.push(P(q[0], q[1], V.hull === 'ship' ? 0.26 : 0.18)); });
    }
    var hullPts = convexHull(pts);
    ctx.beginPath(); hullPts.forEach(function(p0, i){ if (i) ctx.lineTo(p0.x, p0.y); else ctx.moveTo(p0.x, p0.y); }); ctx.closePath();
    var hg = ctx.createLinearGradient(0, hz - S * 0.3, 0, hz + 8); hg.addColorStop(0, '#22344d'); hg.addColorStop(1, '#0e1826');
    ctx.fillStyle = hg; ctx.fill(); ctx.strokeStyle = 'rgba(150,180,220,0.28)'; ctx.lineWidth = 1; ctx.stroke();
    // superstructure / masts (faint)
    ctx.strokeStyle = 'rgba(110,140,180,0.22)'; ctx.lineWidth = 2;
    var tops = {};
    V.lights.forEach(function(L){ if (L.h > 0.3){ var key = Math.round(L.a * 20); if (!tops[key] || tops[key].h < L.h) tops[key] = L; } });
    Object.keys(tops).forEach(function(key){ var L = tops[key], p0 = P(L.a, 0, 0.12), p1 = P(L.a, 0, L.h + 0.04); ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); });
    if (V.hull === 'velero'){ var m0 = P(0.08, 0, 0.1), m1 = P(0.08, 0, 1.3); ctx.beginPath(); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); ctx.stroke(); }
    if (V.hull === 'ship'){
      var q = [P(-0.75, 0.9, 0.22), P(-0.75, -0.9, 0.22), P(-0.45, 0.9, 0.5), P(-0.45, -0.9, 0.5), P(-0.75, 0.9, 0.5), P(-0.75, -0.9, 0.5), P(-0.45, 0.9, 0.22), P(-0.45, -0.9, 0.22)];
      var qh = convexHull(q); ctx.beginPath(); qh.forEach(function(p0, i){ if (i) ctx.lineTo(p0.x, p0.y); else ctx.moveTo(p0.x, p0.y); }); ctx.closePath();
      ctx.fillStyle = 'rgba(18,28,42,0.95)'; ctx.fill();
    }
    // lights
    var vis = visibleLights(V, th).map(function(L){ var p0 = P(L.a, L.b, L.h); return { L: L, p: p0 }; });
    vis.sort(function(p0, q0){ return q0.p.d - p0.p.d; });
    var tw = 0.92 + Math.sin((t || 0) * 3.1) * 0.04;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    vis.forEach(function(o){
      var col = LCOL[o.L.c], x = o.p.x, y = o.p.y;
      // reflection on the water
      var rg = ctx.createLinearGradient(0, hz, 0, h);
      rg.addColorStop(0, hexA(col, 0.35)); rg.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = rg;
      for (var j = 0; j < 7; j++){
        var yy = hz + 4 + j * (h - hz) / 8, ww = 3 + j * 1.6 + Math.sin((t || 0) * 2 + j) * 1.5;
        ctx.fillRect(x - ww / 2 + Math.sin((t || 0) * 1.7 + j * 1.3) * 2, yy, ww, (h - hz) / 14);
      }
      var g = ctx.createRadialGradient(x, y, 0, x, y, 26 * tw);
      g.addColorStop(0, hexA(col, 0.95)); g.addColorStop(0.18, hexA(col, 0.55)); g.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26 * tw, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill();
    });
    ctx.restore();
    return vis;
  }
  function hexA(hex, a){
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function convexHull(P){
    var p = P.slice().sort(function(a, b){ return a.x - b.x || a.y - b.y; });
    function cr(o, a, b){ return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++){ while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
    for (i = p.length - 1; i >= 0; i--){ while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
    up.pop(); lo.pop(); return lo.concat(up);
  }
  function wedge(cx, cy, r, a0, a1){
    var p0 = [cx + r * Math.sin(a0 * D2R), cy - r * Math.cos(a0 * D2R)], p1 = [cx + r * Math.sin(a1 * D2R), cy - r * Math.cos(a1 * D2R)];
    var large = ((a1 - a0 + 360) % 360) > 180 ? 1 : 0;
    return 'M' + cx + ',' + cy + ' L' + p0[0].toFixed(1) + ',' + p0[1].toFixed(1) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + p1[0].toFixed(1) + ',' + p1[1].toFixed(1) + ' Z';
  }
  function vesselTopSVG(V, p){
    // small top view at origin, bow up, length ~ 80
    var L = V.hull === 'ship' ? 96 : V.hull === 'lancha' ? 62 : 76, B = V.hull === 'velero' ? L * 0.3 : L * 0.34;
    var d = 'M0,' + (-L / 2) + ' C' + (B * 0.4) + ',' + (-L * 0.36) + ' ' + (B / 2) + ',' + (-L * 0.12) + ' ' + (B / 2) + ',' + (L * 0.1) + ' L' + (B * 0.46) + ',' + (L / 2) + ' L' + (-B * 0.46) + ',' + (L / 2) + ' L' + (-B / 2) + ',' + (L * 0.1) + ' C' + (-B / 2) + ',' + (-L * 0.12) + ' ' + (-B * 0.4) + ',' + (-L * 0.36) + ' 0,' + (-L / 2) + ' Z';
    var s = '<path d="' + d + '" fill="url(#' + p + 'hull)" stroke="#334155" stroke-width="1.2"/>';
    if (V.hull === 'ship') s += '<rect x="' + (-B * 0.36) + '" y="' + (L * 0.18) + '" width="' + (B * 0.72) + '" height="' + (L * 0.16) + '" rx="2" fill="#f1f5f9" stroke="#94a3b8"/>';
    else if (V.hull === 'velero') s += '<circle cx="0" cy="' + (-L * 0.06) + '" r="2.6" fill="#334155"/><path d="M0,' + (-L * 0.06) + ' L0,' + (L * 0.36) + '" stroke="#334155" stroke-width="2"/>';
    else s += '<rect x="' + (-B * 0.24) + '" y="' + (-L * 0.08) + '" width="' + (B * 0.48) + '" height="' + (L * 0.2) + '" rx="3" fill="#f8fafc" stroke="#94a3b8"/>';
    return s;
  }
  FIG.luces = function(el){
    var f = frame(el, 'Luces de navegación de noche', 'Arrastra el <b>observador</b> alrededor del buque (o usa los botones) y mira qué luces verías. Cada luz solo se ve dentro de su sector.', 'Interactivo');
    var p = uid(), vi = 1, th = 30, quiz = null;
    f.stage.innerHTML =
      '<div class="pl-lights">' +
      '<div class="pl-lights-top"><svg viewBox="0 0 300 300" class="pl-svg pl-lsvg" role="img" aria-label="Sectores de las luces vistos desde arriba"><defs>' +
      '<linearGradient id="' + p + 'hull" x1="0" x2="1"><stop offset="0" stop-color="#a7b4be"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#97a5b0"/></linearGradient></defs>' +
      '<rect width="300" height="300" rx="14" fill="#0f2236"/><g class="pl-lsec"></g>' +
      '<g class="pl-lves" transform="translate(150,150)"></g><g class="pl-lobs"></g></svg></div>' +
      '<div class="pl-lights-night"><canvas class="pl-cv" aria-label="Lo que ve el observador de noche"></canvas><div class="pl-night-tag"></div></div>' +
      '</div>' +
      '<div class="pl-lights-row"><label class="pl-sel-l" for="' + p + 'sel">Buque</label><select id="' + p + 'sel" class="pl-sel">' +
      VESSELS.map(function(V, i){ return '<option value="' + i + '"' + (i === vi ? ' selected' : '') + '>' + esc(V.name) + '</option>'; }).join('') + '</select></div>' +
      '<div class="pl-lights-see" aria-live="polite"></div><div class="pl-lights-note"></div>';
    var svg = f.stage.querySelector('svg'), gSec = svg.querySelector('.pl-lsec'), gVes = svg.querySelector('.pl-lves'), gObs = svg.querySelector('.pl-lobs');
    var cv = f.stage.querySelector('canvas'), tag = f.stage.querySelector('.pl-night-tag');
    var see = f.stage.querySelector('.pl-lights-see'), note = f.stage.querySelector('.pl-lights-note');
    var sel = f.stage.querySelector('select');
    function drawSectors(){
      var V = VESSELS[vi], s = '', had = {};
      var R = { tope: 112, er: 92, br: 92, alc: 92, alcy: 74, w360: 132, r360: 124, g360: 128 };
      V.lights.forEach(function(L){
        if (had[L.k]) return; had[L.k] = 1;
        var col = LCOL[L.c], op = L.c === 'w' ? 0.2 : 0.3;
        if (L.s === '360') s += '<circle cx="150" cy="150" r="' + R[L.k] + '" fill="none" stroke="' + col + '" stroke-opacity=".7" stroke-width="3" stroke-dasharray="' + (L.c === 'w' ? '2 4' : '6 4') + '"/>';
        else if (L.s === 'tope') s += '<path d="' + wedge(150, 150, R.tope, 247.5, 112.5) + '" fill="' + col + '" fill-opacity="' + op + '" stroke="' + col + '" stroke-opacity=".6"/>';
        else if (L.s === 'er') s += '<path d="' + wedge(150, 150, R.er, 0, 112.5) + '" fill="' + col + '" fill-opacity="' + op + '" stroke="' + col + '" stroke-opacity=".7"/>';
        else if (L.s === 'br') s += '<path d="' + wedge(150, 150, R.br, 247.5, 360) + '" fill="' + col + '" fill-opacity="' + op + '" stroke="' + col + '" stroke-opacity=".7"/>';
        else if (L.s === 'alc') s += '<path d="' + wedge(150, 150, L.k === 'alcy' ? R.alcy : R.alc, 112.5, 247.5) + '" fill="' + col + '" fill-opacity="' + op + '" stroke="' + col + '" stroke-opacity=".6"/>';
      });
      s += '<text x="150" y="16" class="pl-sl-n" text-anchor="middle">▲ proa</text>';
      gSec.innerHTML = s;
      var v = vesselTopSVG(V, p);
      V.lights.forEach(function(L){
        var L0 = V.hull === 'ship' ? 96 : V.hull === 'lancha' ? 62 : 76;
        if (L.h > 1) return;
        var x = L.b * (V.hull === 'velero' ? 0.3 : 0.34) * L0, y = -L.a * L0 / 2;
        v += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.2" fill="' + LCOL[L.c] + '" stroke="#0f172a" stroke-width=".8"/>';
      });
      if (V.hull === 'velero' && V.id === 'vela20') v += '<circle cx="0" cy="-4.6" r="3.6" fill="#fff" stroke="#16a34a" stroke-width="2"/>';
      gVes.innerHTML = v;
    }
    function drawObs(){
      var x = 150 + 138 * Math.sin(th * D2R), y = 150 - 138 * Math.cos(th * D2R);
      gObs.innerHTML = '<path d="M150,150 L' + x.toFixed(1) + ',' + y.toFixed(1) + '" stroke="#fde68a" stroke-width="1.2" stroke-dasharray="3 3"/>' +
        '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + (th + 180) + ')"><circle r="12" fill="#fde68a" stroke="#92400e" stroke-width="1.5"/>' +
        '<path d="M0,-8 L5,4 L0,2 L-5,4 Z" fill="#92400e"/></g>';
    }
    function update(){
      var V = VESSELS[vi];
      drawObs();
      var vis = visibleLights(V, th);
      if (!quiz){
        var names = [], seen = {};
        vis.forEach(function(L){ var k = L.k; seen[k] = (seen[k] || 0) + 1; });
        Object.keys(seen).forEach(function(k){ names.push((seen[k] > 1 ? seen[k] + ' × ' : '') + LNAME[k]); });
        see.innerHTML = '<b>Observador ' + bearingName(th) + ' (' + Math.round(((th % 360) + 360) % 360) + '°)</b>: ve ' + (names.length ? names.join(' · ') : 'ninguna luz') + '.';
        note.innerHTML = V.note;
        tag.textContent = bearingName(th);
      }
      paint(0);
    }
    var cvW = 0;
    function paint(t){
      var w = cv.parentNode.clientWidth || 300, h = Math.round(w * 0.62);
      var o = fit(cv, w, h);
      drawNight(o.ctx, w, h, VESSELS[vi], th, t);
    }
    sel.addEventListener('change', function(){ vi = +sel.value; drawSectors(); update(); });
    var drag = false;
    function setFrom(ev){ var pt = svgPt(svg, ev); th = (Math.atan2(pt.x - 150, -(pt.y - 150)) / D2R + 360) % 360; th = Math.round(th / 2.5) * 2.5; update(); }
    svg.addEventListener('pointerdown', function(ev){ if (quiz) return; drag = true; svg.setPointerCapture(ev.pointerId); setFrom(ev); });
    svg.addEventListener('pointermove', function(ev){ if (drag) setFrom(ev); });
    svg.addEventListener('pointerup', function(){ drag = false; });
    svg.addEventListener('pointercancel', function(){ drag = false; });
    var bearBtns = segs(f.ctrl, ['Proa', 'Amura Er.', 'Estribor', 'Popa', 'Babor'], function(i){ th = [0, 45, 90, 180, 270][i]; update(); }, -1, 'Ver desde');
    // quiz: identify the vessel at night
    var qBox = document.createElement('div'); qBox.className = 'pl-lquiz';
    var qBtn = btn(f.ctrl, '🌙 ¿Qué buque es? (prueba)', function(){ quiz ? endQuiz() : startQuiz(); }, 'pl-mini-btn-alt');
    f.fig.insertBefore(qBox, f.cap);
    var qScore = 0, qN = 0;
    function startQuiz(){ quiz = {}; qScore = 0; qN = 0; qBtn.textContent = 'Salir de la prueba'; sel.parentNode.style.display = 'none'; bearBtns.style.display = 'none'; nextQ(); }
    function endQuiz(){ quiz = null; qBox.innerHTML = ''; qBtn.textContent = '🌙 ¿Qué buque es? (prueba)'; sel.parentNode.style.display = ''; bearBtns.style.display = ''; drawSectors(); update(); }
    function nextQ(){
      var bears = [0, 20, 45, 70, 90, 180, 270, 300, 340];
      var tries = 0, V, sig, opts;
      do {
        vi = Math.floor(Math.random() * VESSELS.length); th = bears[Math.floor(Math.random() * bears.length)];
        V = VESSELS[vi]; sig = lightSig(V, th);
        var groupOf = function(X){ return X.group || X.id; };
        var pool = VESSELS.filter(function(X){ return groupOf(X) !== groupOf(V) && lightSig(X, th) !== sig; });
        // dedupe groups
        var gseen = {}; pool = pool.filter(function(X){ var g = groupOf(X); if (gseen[g]) return false; gseen[g] = 1; return true; });
        opts = shuffle(pool).slice(0, 3).concat([V]);
        tries++;
      } while ((opts.length < 4 || visibleLights(V, th).length === 0) && tries < 40);
      quiz.V = V; opts = shuffle(opts); sel.value = String(vi);
      gSec.innerHTML = '<text x="150" y="150" class="pl-sl-n" text-anchor="middle">¿Qué buque es?</text><text x="150" y="168" class="pl-sl-n" text-anchor="middle" font-size="10">Lo ves ' + esc(bearingName(th)) + '</text>';
      gVes.innerHTML = ''; gObs.innerHTML = '';
      tag.textContent = 'Lo ves ' + bearingName(th);
      see.innerHTML = '<b>Prueba</b> · aciertos ' + qScore + ' de ' + qN; note.innerHTML = '';
      paint(0);
      qBox.innerHTML = opts.map(function(X){ return '<button type="button" class="pl-lq-opt" data-v="' + VESSELS.indexOf(X) + '">' + esc(X.name) + '</button>'; }).join('');
      qBox.querySelectorAll('button').forEach(function(b){
        b.addEventListener('click', function(){
          if (quiz.done) return; quiz.done = true;
          var X = VESSELS[+b.getAttribute('data-v')];
          var ok = (X.group || X.id) === (quiz.V.group || quiz.V.id);
          qN++; if (ok) qScore++;
          b.classList.add(ok ? 'ok' : 'bad');
          qBox.querySelectorAll('button').forEach(function(o){ var Y = VESSELS[+o.getAttribute('data-v')]; if ((Y.group || Y.id) === (quiz.V.group || quiz.V.id)) o.classList.add('ok'); o.disabled = true; });
          drawSectors(); drawObs();
          see.innerHTML = (ok ? '✅ <b>¡Correcto!</b> ' : '❌ Era: <b>' + esc(quiz.V.name) + '</b>. ') + 'Aciertos ' + qScore + ' de ' + qN + '.';
          note.innerHTML = quiz.V.note;
          var nx = document.createElement('button'); nx.type = 'button'; nx.className = 'pl-mini-btn'; nx.textContent = 'Siguiente →';
          nx.addEventListener('click', function(){ quiz.done = false; nextQ(); });
          qBox.appendChild(nx);
        });
      });
    }
    drawSectors(); update();
    addAnim(cv, function(t){ paint(t); });
  };
  function shuffle(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  /* =====================================================================
     3. RIPA — escenas animadas de abordaje (Reglas 13, 14, 15 y 18)
     ===================================================================== */
  function ramp(t, t0, d){ return ease((t - t0) / d); }
  var RIPA = [
    { name: 'Cruce', rule: 'Regla 15', dur: 10.5,
      boats: [
        { type: 'motor', stripe: '#B91C1C', x: 430, y: 700, spd: 70, hdg: function(t){ return 55 * ramp(t, 1.9, 1.1) - 55 * ramp(t, 6.4, 1.4); }, role: 'CEDE', col: '#B91C1C', blast: 1.9, blastTxt: '1 corta' },
        { type: 'motor', stripe: '#047857', x: 830, y: 300, spd: 70, hdg: function(){ return 270; }, role: 'SIGUE', col: '#047857' }
      ],
      wedge: { boat: 0, a0: 0, a1: 112.5, col: 'rgba(44,255,106,0.20)', stroke: 'rgba(44,255,106,0.7)', until: 3.2, txt: 'su estribor' },
      risk: { x: 430, y: 300, until: 2.2 },
      steps: [[0, 'El buque rojo tiene al verde por su <b>estribor</b>: hay riesgo de abordaje.'], [1.9, 'El que tiene al otro por su estribor <b>cede</b>: toca <b>1 pitada corta</b> ("caigo a estribor") y cae a estribor.'], [3.6, 'Pasa <b>por la popa</b> del otro. El verde <b>mantiene rumbo y velocidad</b> (Regla 17).'], [6.6, 'Pasado y franco, vuelve a su rumbo.']] },
    { name: 'De vuelta encontrada', rule: 'Regla 14', dur: 10,
      boats: [
        { type: 'motor', stripe: '#1d4ed8', x: 470, y: 720, spd: 70, hdg: function(t){ return 34 * ramp(t, 1.7, 1) - 34 * ramp(t, 6.8, 1.2); }, role: 'CAE A Er.', col: '#1d4ed8', blast: 1.7, blastTxt: '1 corta' },
        { type: 'motor', stripe: '#B45309', x: 530, y: -20, spd: 70, hdg: function(t){ return 180 + 34 * ramp(t, 1.7, 1) - 34 * ramp(t, 6.8, 1.2); }, role: 'CAE A Er.', col: '#B45309', blast: 1.7, blastTxt: '1 corta' }
      ],
      risk: { x: 500, y: 350, until: 2 },
      steps: [[0, 'Dos buques a motor <b>de frente</b>: cada uno ve las dos luces de costado del otro.'], [1.7, '<b>Ambos</b> caen a <b>estribor</b> y tocan 1 pitada corta cada uno.'], [3.8, 'Se cruzan <b>babor con babor</b> (rojo con rojo).'], [6.8, 'Pasados y francos, vuelven a su rumbo.']] },
    { name: 'Alcance', rule: 'Regla 13', dur: 9,
      boats: [
        { type: 'motor', stripe: '#B91C1C', x: 500, y: 790, spd: 92, hdg: function(t){ return 24 * ramp(t, 1.0, 0.8) - 24 * ramp(t, 2.6, 0.8) - 24 * ramp(t, 6.4, 0.8) + 24 * ramp(t, 7.2, 0.8); }, role: 'ALCANZA · CEDE', col: '#B91C1C' },
        { type: 'motor', stripe: '#047857', x: 500, y: 450, spd: 26, hdg: function(){ return 0; }, role: 'SIGUE', col: '#047857' }
      ],
      wedge: { boat: 1, a0: 112.5, a1: 247.5, col: 'rgba(255,250,240,0.18)', stroke: 'rgba(255,250,240,0.7)', until: 4.2, txt: 'sector de alcance' },
      steps: [[0, 'El rojo viene <b>por detrás</b>, desde más de 22,5° a popa del través del verde (ve solo su luz de alcance): es un <b>alcance</b>.'], [1.0, 'El que alcanza <b>se mantiene apartado</b>, cualquiera sea el tipo de buque.'], [4.4, 'El alcanzado <b>mantiene rumbo y velocidad</b>.'], [6.4, 'Solo vuelve a su línea cuando ya pasó y está <b>bien franco</b>.']] },
    { name: 'Motor y vela', rule: 'Regla 18', dur: 10,
      boats: [
        { type: 'motor', stripe: '#B91C1C', x: 520, y: 760, spd: function(t){ return 70 - 55 * ramp(t, 1.8, 1.2) + 55 * ramp(t, 6.8, 1.0); }, hdg: function(){ return 0; }, role: 'MOTOR · CEDE', col: '#B91C1C' },
        { type: 'vela', x: 245, y: 330, spd: 45, hdg: function(){ return 90; }, boom: 0.85, role: 'VELA · SIGUE', col: '#047857' }
      ],
      wind: 180, risk: { x: 520, y: 330, until: 2.2 },
      steps: [[0, 'Una lancha a motor y un velero se acercan. El velero viene por la <b>babor</b> de la lancha.'], [1.8, 'Aun así, el buque a motor <b>se aparta del velero</b>: reduce y lo deja pasar por su proa.'], [4.6, '"Entre un vapor y un velero, gobierna siempre el primero."'], [6.8, 'Con el velero franco, la lancha sigue su rumbo.']] }
  ];
  function simBoat(B, dur){
    var dt = 1 / 60, n = Math.ceil(dur / dt) + 1, xs = new Float32Array(n), ys = new Float32Array(n), hs = new Float32Array(n), vs = new Float32Array(n);
    var x = B.x, y = B.y;
    for (var i = 0; i < n; i++){
      var t = i * dt, h = B.hdg(t), v = typeof B.spd === 'function' ? B.spd(t) : B.spd;
      xs[i] = x; ys[i] = y; hs[i] = h; vs[i] = v;
      x += Math.sin(h * D2R) * v * dt; y -= Math.cos(h * D2R) * v * dt;
    }
    return { x: xs, y: ys, h: hs, v: vs, dt: dt, n: n };
  }
  function sampleAt(P, t){ var i = clamp(Math.floor(t / P.dt), 0, P.n - 1); return i; }
  FIG.ripa = function(el){
    var f = frame(el, 'Reglas de rumbo y gobierno', 'Escenas vistas desde arriba. <b>CEDE</b> = buque que debe maniobrar; <b>SIGUE</b> = mantiene rumbo y velocidad.', 'Animación');
    var cur = 0, sims = [], playing = !REDUCED, tt = REDUCED ? 99 : 0;
    var C = canvasIn(f.stage, 0.7, 470);
    var stepEl = document.createElement('div'); stepEl.className = 'pl-step';
    f.stage.appendChild(stepEl);
    function load(i){ cur = i; tt = REDUCED ? RIPA[i].dur - 0.01 : 0; sims = RIPA[i].boats.map(function(B){ return simBoat(B, RIPA[i].dur); }); playing = !REDUCED; resume(anim); setPB(); }
    segs(f.ctrl, RIPA.map(function(s){ return s.name; }), load, 0, 'Situación');
    var pb = btn(f.ctrl, 'Pausa', function(){ playing = !playing; if (playing && tt >= RIPA[cur].dur) tt = 0; resume(anim); setPB(); }, '', 'Pausa o reproducir');
    btn(f.ctrl, '↺ Repetir', function(){ tt = 0; playing = true; resume(anim); setPB(); }, '', 'Repetir desde el inicio');
    function setPB(){ pb.textContent = playing ? '❚❚ Pausa' : '▶ Ver'; }
    var lastStep = -1, lastCur = -1;
    function draw(t){
      var S = RIPA[cur], o = C.size(), ctx = o.ctx, w = o.w, h = o.h, k = w / 1000;
      drawWater(ctx, w, h, t * 0.6);
      var sc = Math.min(w / 1000, h / 700);
      ctx.save(); ctx.translate((w - 1000 * sc) / 2, (h - 700 * sc) / 2); ctx.scale(sc, sc);
      var L = w < 560 ? 112 : 92, PF = w < 560 ? 26 : 19;
      // risk marker
      if (S.risk && tt < S.risk.until){
        ctx.save(); ctx.globalAlpha = 0.85 * (1 - ramp(tt, S.risk.until - 0.5, 0.5));
        S.boats.forEach(function(B, bi){
          var P = sims[bi], i = sampleAt(P, tt);
          ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(P.x[i], P.y[i]); ctx.lineTo(S.risk.x, S.risk.y); ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(S.risk.x - 16, S.risk.y - 16); ctx.lineTo(S.risk.x + 16, S.risk.y + 16); ctx.moveTo(S.risk.x + 16, S.risk.y - 16); ctx.lineTo(S.risk.x - 16, S.risk.y + 16); ctx.stroke();
        ctx.restore();
      }
      // wedge
      if (S.wedge && tt < S.wedge.until){
        var Pw = sims[S.wedge.boat], iw = sampleAt(Pw, tt);
        ctx.save(); ctx.translate(Pw.x[iw], Pw.y[iw]); ctx.rotate(Pw.h[iw] * D2R);
        ctx.globalAlpha = 1 - ramp(tt, S.wedge.until - 0.6, 0.6);
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.arc(0, 0, 330, (S.wedge.a0 - 90) * D2R, (S.wedge.a1 - 90) * D2R); ctx.closePath();
        ctx.fillStyle = S.wedge.col; ctx.fill(); ctx.strokeStyle = S.wedge.stroke; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      // wind
      if (S.wind != null){
        ctx.save(); ctx.translate(90, 90);
        ctx.fillStyle = 'rgba(255,255,255,0.88)'; rrect(ctx, -62, -62, 124, 124, 18); ctx.fill();
        arrow(ctx, 0, -40, 0, 30, '#1e3a8a', 6);
        label(ctx, 'VIENTO', 0, 48, { size: 18, color: '#1e3a8a', halo: 0 });
        ctx.restore();
      }
      // boats + wakes
      S.boats.forEach(function(B, bi){
        var P = sims[bi], i = sampleAt(P, tt), trail = [];
        var step = 6, i0 = Math.max(0, i - 150);
        for (var j = i0; j <= i; j += step){
          var hj = P.h[j] * D2R;
          trail.push([P.x[j] - Math.sin(hj) * L * 0.5, P.y[j] + Math.cos(hj) * L * 0.5, P.h[j]]);
        }
        drawWake(ctx, trail, L * 0.6, clamp(P.v[i] / 70, 0.25, 1.3));
      });
      S.boats.forEach(function(B, bi){
        var P = sims[bi], i = sampleAt(P, tt);
        ctx.save(); ctx.translate(P.x[i], P.y[i]); ctx.rotate(P.h[i] * D2R);
        if (B.type === 'vela') veleroTop(ctx, L * 1.05, B.boom); else lanchaTop(ctx, L, { stripe: B.stripe });
        ctx.restore();
        // horn
        if (B.blast != null && tt >= B.blast && tt < B.blast + 1.6){
          var q = (tt - B.blast) / 1.6;
          ctx.save(); ctx.strokeStyle = 'rgba(253,224,71,' + (1 - q) + ')'; ctx.lineWidth = 4;
          for (var rr = 0; rr < 2; rr++){ ctx.beginPath(); ctx.arc(P.x[i], P.y[i], 30 + (q + rr * 0.3) * 70, 0, TAU); ctx.stroke(); }
          ctx.restore();
          pill(ctx, '📯 ' + B.blastTxt, P.x[i] + L * 0.95, P.y[i] + 10, '#854d0e', '#fff', PF);
        }
        pill(ctx, B.role, P.x[i], P.y[i] - L * 0.95, B.col, '#fff', PF);
      });
      ctx.restore();
      label(ctx, S.rule, w - 10, 14, { align: 'right', size: 12, color: '#0b2545' });
      var si = 0; S.steps.forEach(function(st, k2){ if (tt >= st[0]) si = k2; });
      if (si !== lastStep || cur !== lastCur){ stepEl.innerHTML = '<span class="pl-step-n">' + (si + 1) + '/' + S.steps.length + '</span> ' + S.steps[si][1]; lastStep = si; lastCur = cur; }
    }
    var anim = addAnim(C.cv, function(t, dt){
      if (playing){ tt += dt; if (tt >= RIPA[cur].dur){ tt = RIPA[cur].dur; playing = false; setPB(); } }
      draw(t);
      return true;
    });
    load(0);
  };

  /* =====================================================================
     4. BALIZAMIENTO IALA — REGIÓN B (Chile)
     ===================================================================== */
  function miniBuoy(type, x, y, s, p){
    // small upright buoy symbol for plan views; y = waterline
    var g = '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' + '<ellipse cx="0" cy="0" rx="9" ry="2.6" fill="rgba(255,255,255,.55)"/>';
    if (type === 'stbd') g += '<path d="M-7,0 L-1.5,-16 L1.5,-16 L7,0 Z" fill="url(#' + p + 'red)"/><path d="M0,-16 L0,-21" stroke="#333" stroke-width="1.2"/><path d="M-3.4,-21 L3.4,-21 L0,-27 Z" fill="url(#' + p + 'red)"/>';
    else if (type === 'port') g += '<rect x="-6" y="-15" width="12" height="15" fill="url(#' + p + 'grn)"/><ellipse cx="0" cy="-15" rx="6" ry="1.6" fill="#3fbf6e"/><path d="M0,-15 L0,-20" stroke="#333" stroke-width="1.2"/><rect x="-3" y="-25" width="6" height="5" fill="url(#' + p + 'grn)"/>';
    else if (type === 'safe') g += '<path d="M-6,0 L-4,-17 L4,-17 L6,0 Z" fill="url(#' + p + 'red)"/><path d="M-2.2,0 L-1.4,-17 L1.4,-17 L2.2,0 Z" fill="#fff"/><path d="M0,-17 L0,-22" stroke="#333" stroke-width="1.2"/><circle cx="0" cy="-25" r="3.2" fill="url(#' + p + 'red)"/>';
    else if (type === 'danger') g += '<path d="M-6,0 L-4,-17 L4,-17 L6,0 Z" fill="#1f2328"/><path d="M-5.3,-6 L-4.7,-11 L4.7,-11 L5.3,-6 Z" fill="#c4221c"/><path d="M0,-17 L0,-29" stroke="#333" stroke-width="1.2"/><circle cx="0" cy="-23" r="2.8" fill="#1f2328"/><circle cx="0" cy="-29.5" r="2.8" fill="#1f2328"/>';
    return g + '</g>';
  }
  var IALA_CARDS = [
    ['stbd', 'Lateral de estribor', 'Roja, cónica, tope cono rojo. Al entrar, a estribor. Luz roja.'],
    ['port', 'Lateral de babor', 'Verde, cilíndrica, tope cilindro verde. Al entrar, a babor. Luz verde.'],
    ['north', 'Cardinal Norte', 'Negra sobre amarilla; conos ▲▲. Pasa por el norte de la marca.'],
    ['east', 'Cardinal Este', 'Negra–amarilla–negra; conos ▲▼. Pasa por el este.'],
    ['south', 'Cardinal Sur', 'Amarilla sobre negra; conos ▼▼. Pasa por el sur.'],
    ['west', 'Cardinal Oeste', 'Amarilla–negra–amarilla; conos ▼▲. Pasa por el oeste.'],
    ['danger', 'Peligro aislado', 'Negra con franja roja; 2 esferas negras. Peligro pequeño con agua navegable alrededor.'],
    ['safe', 'Aguas seguras', 'Franjas verticales rojas y blancas; 1 esfera roja. Agua navegable a su alrededor (recalada, eje del canal).'],
    ['special', 'Marca especial', 'Amarilla; tope en aspa (X) amarilla. Señala una zona o uso especial.']
  ];
  FIG.iala = function(el){
    var f = frame(el, 'Balizamiento IALA — Región B', 'Chile = <b>Región B</b>: al <b>entrar</b> a puerto, deja el <b>ROJO a estribor</b> y el <b>VERDE a babor</b>. Al salir, al revés.', 'Animación');
    var p = uid(), dir = 0;
    var svgHead = '<svg viewBox="0 0 400 300" class="pl-svg" role="img" aria-label="Canal de entrada a puerto con boyas rojas a estribor y verdes a babor al entrar"><defs>' +
      '<linearGradient id="' + p + 'red" x1="0" x2="1"><stop offset="0" stop-color="#7a120e"/><stop offset=".35" stop-color="#e2382f"/><stop offset="1" stop-color="#7a120e"/></linearGradient>' +
      '<linearGradient id="' + p + 'grn" x1="0" x2="1"><stop offset="0" stop-color="#0b4d22"/><stop offset=".35" stop-color="#22a552"/><stop offset="1" stop-color="#0b4d22"/></linearGradient>' +
      '<linearGradient id="' + p + 'sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb3d0"/><stop offset="1" stop-color="#1f6f96"/></linearGradient>' +
      '<linearGradient id="' + p + 'hull" x1="0" x2="1"><stop offset="0" stop-color="#a7b4be"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#97a5b0"/></linearGradient>' +
      '<pattern id="' + p + 'rip" width="40" height="22" patternUnits="userSpaceOnUse"><path d="M2,8 q8,-4 16,0 M22,18 q8,-4 16,0" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.2"/></pattern>' +
      '</defs>' +
      '<rect width="400" height="300" fill="url(#' + p + 'sea)"/><rect width="400" height="300" fill="url(#' + p + 'rip)"/>' +
      // land + harbour
      '<path d="M0,0 L400,0 L400,58 C350,60 320,48 262,56 L262,74 L238,74 L236,54 C200,50 180,58 160,56 L160,74 L136,74 L136,58 C80,62 40,50 0,64 Z" fill="#e8dcb5" stroke="#b9a874"/>' +
      '<path d="M0,0 L400,0 L400,30 C330,36 260,22 200,30 C140,36 70,24 0,34 Z" fill="#9cbf7a"/>' +
      '<g fill="#fff" stroke="#8a7b56" stroke-width=".8"><rect x="60" y="34" width="14" height="10"/><rect x="80" y="38" width="12" height="8"/><rect x="300" y="36" width="14" height="10"/><rect x="322" y="40" width="10" height="8"/></g>' +
      '<g fill="#c2410c"><path d="M58,34 l9,-6 l9,6z"/><path d="M78,38 l8,-5 l8,5z"/><path d="M298,36 l9,-6 l9,6z"/><path d="M320,40 l7,-5 l7,5z"/></g>' +
      '<text x="200" y="48" class="pl-sl" text-anchor="middle" font-size="11">PUERTO</text>' +
      // channel axis
      '<path d="M200,280 L200,70" stroke="#fff" stroke-opacity=".55" stroke-dasharray="6 7" stroke-width="1.5"/>' +
      // rock + isolated danger
      '<path d="M318,210 l8,-6 l10,2 l6,7 l-6,5 l-12,1z" fill="#57534e"/><path d="M310,220 q10,-6 20,0 q10,6 22,0" fill="none" stroke="#fff" stroke-width="1.4" stroke-opacity=".8"/>' +
      miniBuoy('danger', 330, 200, 1, p) + '<text x="352" y="196" class="pl-sl" font-size="9.5" text-anchor="start">peligro</text><text x="352" y="207" class="pl-sl" font-size="9.5" text-anchor="start">aislado</text>' +
      // safe water at the entrance
      miniBuoy('safe', 200, 286, 1, p) + '<text x="212" y="284" class="pl-sl" font-size="9.5" text-anchor="start">aguas seguras (recalada)</text>';
    var buoys = '';
    [[250, 92], [256, 150], [262, 208]].forEach(function(b){ buoys += miniBuoy('stbd', b[0], b[1], 1.15, p); });
    [[150, 92], [144, 150], [138, 208]].forEach(function(b){ buoys += miniBuoy('port', b[0], b[1], 1.15, p); });
    f.stage.innerHTML = svgHead + buoys + '<g class="pl-iala-boat"></g><g class="pl-iala-lbl"></g></svg>';
    var gb = f.stage.querySelector('.pl-iala-boat'), gl = f.stage.querySelector('.pl-iala-lbl');
    function labels(){
      gl.innerHTML = dir === 0
        ? T(310, 132, 'ROJO', { fill: '#B91C1C', cls: 'pl-sl-big' }) + T(310, 146, '= mi ESTRIBOR', { fill: '#B91C1C', size: 10 }) + T(88, 132, 'VERDE', { fill: '#047857', cls: 'pl-sl-big' }) + T(88, 146, '= mi BABOR', { fill: '#047857', size: 10 }) + T(200, 266, 'ENTRANDO ▲', { cls: 'pl-sl-big', fill: '#0b2545' })
        : T(310, 132, 'ROJO', { fill: '#B91C1C', cls: 'pl-sl-big' }) + T(310, 146, '= mi BABOR', { fill: '#B91C1C', size: 10 }) + T(88, 132, 'VERDE', { fill: '#047857', cls: 'pl-sl-big' }) + T(88, 146, '= mi ESTRIBOR', { fill: '#047857', size: 10 }) + T(200, 266, 'SALIENDO ▼', { cls: 'pl-sl-big', fill: '#0b2545' });
    }
    segs(f.ctrl, ['Entrando a puerto', 'Saliendo al mar'], function(i){ dir = i; labels(); }, 0, 'Sentido');
    labels();
    var boatD = 'M0,-17 C5,-13 7,-6 7,2 L6.6,13 L-6.6,13 L-7,2 C-7,-6 -5,-13 0,-17 Z';
    addAnim(f.stage, function(t){
      var k = (t * 0.09) % 1, y = dir === 0 ? lerp(262, 84, k) : lerp(84, 262, k), rot = dir === 0 ? 0 : 180;
      gb.setAttribute('transform', 'translate(200,' + y.toFixed(1) + ') rotate(' + rot + ')');
      gb.innerHTML = '<path d="M-5,13 L-14,40 M5,13 L14,40" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><path d="' + boatD + '" fill="url(#' + p + 'hull)" stroke="#334155"/><rect x="-3.6" y="-3" width="7.2" height="6" rx="1.5" fill="#1e3a5f"/>' +
        '<circle cx="-5.5" cy="-8" r="2" fill="#dc2626"/><circle cx="5.5" cy="-8" r="2" fill="#16a34a"/>';
      return true;
    });
    // buoy cards (MarineroArt renderer)
    var MA = window.MarineroArt;
    var grid = document.createElement('div'); grid.className = 'pl-fig-grid pl-buoys';
    grid.innerHTML = IALA_CARDS.map(function(c){
      return '<div class="pl-card"><canvas class="pl-buoy-cv" data-b="' + c[0] + '" aria-hidden="true"></canvas><div class="pl-card-t">' + esc(c[1]) + '</div><div class="pl-card-s">' + esc(c[2]) + '</div></div>';
    }).join('');
    f.fig.insertBefore(grid, f.cap);
    // cardinal diagram
    var card = document.createElement('div'); card.className = 'pl-cardinal';
    card.innerHTML = cardinalSVG();
    f.fig.insertBefore(card, f.cap);
    if (!MA || !MA.drawBuoy){ grid.querySelectorAll('canvas').forEach(function(c){ c.remove(); }); return; }
    var cvs = [].slice.call(grid.querySelectorAll('canvas')), acc = 0;
    addAnim(grid, function(t, dt){
      acc += dt; if (acc < 1 / 20) return true; acc = 0;
      cvs.forEach(function(c, i){
        var w = c.parentNode.clientWidth || 150, h = Math.round(w * 0.86), o = fit(c, w, h), ctx = o.ctx;
        ctx.drawImage(MA.harbourBackdrop(w, h, o.dpr, 0.4), 0, 0, w, h);
        MA.drawSea(ctx, w, h, t, 0.4);
        MA.drawBuoy(ctx, c.getAttribute('data-b'), w / 2, h * 0.78, h * 0.25, t, { seed: i * 1.3 });
      });
      return true;
    });
  };
  function cardinalSVG(){
    var p = uid();
    function cone(x, y, up, s){ return up ? '<path d="M' + (x - s) + ',' + y + ' L' + x + ',' + (y - s * 1.6) + ' L' + (x + s) + ',' + y + ' Z" fill="#1f2328"/>' : '<path d="M' + (x - s) + ',' + (y - s * 1.6) + ' L' + (x + s) + ',' + (y - s * 1.6) + ' L' + x + ',' + y + ' Z" fill="#1f2328"/>'; }
    function mark(x, y, bands, tops){
      var s = '<g>', H = 30, w0 = 13, w1 = 7, n = bands.length;
      for (var i = 0; i < n; i++){
        var ya = y - H * i / n, yb = y - H * (i + 1) / n, wa = w0 - (w0 - w1) * i / n, wb = w0 - (w0 - w1) * (i + 1) / n;
        s += '<path d="M' + (x - wa / 2) + ',' + ya + ' L' + (x - wb / 2) + ',' + yb + ' L' + (x + wb / 2) + ',' + yb + ' L' + (x + wa / 2) + ',' + ya + ' Z" fill="' + bands[n - 1 - i] + '"/>';
      }
      s += '<path d="M' + x + ',' + (y - H) + ' v-6" stroke="#333" stroke-width="1.4"/>';
      var ty = y - H - 6;
      if (tops === 'N') s += cone(x, ty, true, 5) + cone(x, ty - 9, true, 5);
      if (tops === 'S') s += cone(x, ty, false, 5) + cone(x, ty - 9, false, 5);
      if (tops === 'E') s += cone(x, ty, false, 5) + cone(x, ty - 9, true, 5);
      if (tops === 'W') s += cone(x, ty, true, 5) + cone(x, ty - 9, false, 5);
      return s + '<ellipse cx="' + x + '" cy="' + y + '" rx="10" ry="2.6" fill="rgba(255,255,255,.6)"/></g>';
    }
    var Y = '#f2c414', K = '#1f2328';
    return '<svg viewBox="0 0 400 260" class="pl-svg" role="img" aria-label="Marcas cardinales alrededor de un peligro"><defs><radialGradient id="' + p + 'w" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8fd0e6"/><stop offset="1" stop-color="#3c93b8"/></radialGradient></defs>' +
      '<rect width="400" height="260" fill="#eaf5fa"/>' +
      '<circle cx="200" cy="132" r="108" fill="url(#' + p + 'w)" opacity=".55"/>' +
      '<path d="M200,24 L200,240 M92,132 L308,132" stroke="#0b2545" stroke-opacity=".25" stroke-dasharray="4 4"/>' +
      '<path d="M120,52 L280,212 M280,52 L120,212" stroke="#0b2545" stroke-opacity=".35" stroke-width="1.2"/>' +
      '<path d="M186,126 l8,-9 l12,1 l9,8 l-5,9 l-15,3 z" fill="#57534e"/><path d="M176,140 q12,-7 24,0 q12,7 26,0" fill="none" stroke="#fff" stroke-width="1.6"/>' +
      '<text x="200" y="158" class="pl-sl" text-anchor="middle" font-size="10">PELIGRO</text>' +
      mark(200, 76, [K, Y], 'N') + mark(200, 228, [Y, K], 'S') + mark(286, 150, [K, Y, K], 'E') + mark(114, 150, [Y, K, Y], 'W') +
      T(200, 18, 'N · pasa por el NORTE', { size: 10.5 }) + T(200, 254, 'S · pasa por el SUR', { size: 10.5 }) +
      T(350, 122, 'E · pasa', { size: 10.5 }) + T(350, 134, 'por el ESTE', { size: 10.5 }) + T(50, 122, 'O · pasa', { size: 10.5 }) + T(50, 134, 'por el OESTE', { size: 10.5 }) +
      '</svg>';
  }

  /* =====================================================================
     5. SEÑALES ACÚSTICAS — línea de tiempo + sonido (Reglas 34 y 35)
     ===================================================================== */
  var SOUNDS = [
    { g: 'Maniobra (buques a la vista)', n: '1 corta', p: 'S', m: 'Caigo a estribor' },
    { n: '2 cortas', p: 'SS', m: 'Caigo a babor' },
    { n: '3 cortas', p: 'SSS', m: 'Estoy dando atrás' },
    { n: '5 o más cortas', p: 'SSSSS', m: 'Duda / peligro: no entiendo sus intenciones' },
    { g: 'Visibilidad reducida (niebla) · se repite a intervalos de 2 min como máximo', n: '1 larga', p: 'L', m: 'Motor navegando con arrancada', rep: true },
    { n: '2 largas', p: 'L-L', m: 'Motor navegando sin arrancada (parado)', rep: true },
    { n: '1 larga + 2 cortas', p: 'LSS', m: 'Vela, pesca, sin gobierno o maniobra restringida', rep: true }
  ];
  function blasts(pat){
    var out = [], t = 0;
    for (var i = 0; i < pat.length; i++){
      var c = pat.charAt(i);
      if (c === '-'){ t += 1; continue; }
      var d = c === 'L' ? 5 : 1;
      out.push([t, d]); t += d + 1;
    }
    return { b: out, end: t - 1 };
  }
  var _actx = null;
  function horn(list, onEnd){
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      _actx = _actx || new AC();
      if (_actx.state === 'suspended') _actx.resume();
      var now = _actx.currentTime + 0.05, master = _actx.createGain(); master.gain.value = 0.18;
      var lp = _actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
      lp.connect(master); master.connect(_actx.destination);
      var nodes = [];
      list.forEach(function(b){
        [174, 261].forEach(function(fq, k){
          var o = _actx.createOscillator(), g = _actx.createGain();
          o.type = 'sawtooth'; o.frequency.value = fq; o.connect(g); g.connect(lp);
          var a = now + b[0], e = a + b[1];
          g.gain.setValueAtTime(0, a); g.gain.linearRampToValueAtTime(k ? 0.35 : 0.6, a + 0.06);
          g.gain.setValueAtTime(k ? 0.35 : 0.6, e - 0.08); g.gain.linearRampToValueAtTime(0, e);
          o.start(a); o.stop(e + 0.05); nodes.push(o);
        });
      });
      return { t0: now, stop: function(){ nodes.forEach(function(o){ try { o.stop(); } catch (e) {} }); master.disconnect(); } };
    } catch (e) { return null; }
  }
  FIG.sonido = function(el){
    var f = frame(el, 'Señales acústicas', 'Pitada <b>corta</b> ≈ 1 segundo; <b>larga</b> de 4 a 6 segundos. Toca ▶ para oírla. Entre pitadas de una misma señal hay cerca de 1 segundo (2 s entre las dos largas de niebla).', 'Línea de tiempo');
    var W = 400, X0 = 150, PX = 19, rows = '', y = 0, playing = null;
    SOUNDS.forEach(function(s, i){
      if (s.g){ rows += '<div class="pl-snd-g">' + esc(s.g) + '</div>'; }
      var B = blasts(s.p);
      var bars = B.b.map(function(b){ return '<rect x="' + (b[0] * PX) + '" y="6" width="' + (b[1] * PX - 2) + '" height="16" rx="8" class="pl-snd-bar ' + (b[1] > 1 ? 'l' : 's') + '"/>'; }).join('');
      var ticks = ''; for (var k = 0; k <= 12; k++) ticks += '<path d="M' + (k * PX) + ',25 v3" stroke="#94a3b8"/>';
      rows += '<div class="pl-snd-row"><button type="button" class="pl-snd-play" data-i="' + i + '" aria-label="Escuchar ' + esc(s.n) + ': ' + esc(s.m) + '">▶</button>' +
        '<div class="pl-snd-t"><b>' + esc(s.n) + '</b><span>' + esc(s.m) + '</span></div>' +
        '<svg class="pl-snd-svg" viewBox="-2 0 ' + (12 * PX + 40) + ' 30" aria-hidden="true">' + ticks + bars +
        (s.rep ? '<text x="' + (B.end * PX + 6) + '" y="19" class="pl-snd-rep">↻ ≤ 2 min</text>' : '') +
        '<line class="pl-snd-head" x1="0" x2="0" y1="2" y2="26" style="display:none"/></svg></div>';
    });
    f.stage.innerHTML = '<div class="pl-snd">' + rows + '<div class="pl-snd-axis"><span>0 s</span><span>6 s</span><span>12 s</span></div></div>';
    f.stage.querySelectorAll('.pl-snd-play').forEach(function(b){
      b.addEventListener('click', function(){
        var i = +b.getAttribute('data-i'), s = SOUNDS[i], B = blasts(s.p);
        if (playing){ playing.h && playing.h.stop(); playing.line.style.display = 'none'; playing.btn.textContent = '▶'; var same = playing.i === i; playing = null; if (same) return; }
        var row = b.parentNode, line = row.querySelector('.pl-snd-head');
        var h = horn(B.b);
        playing = { i: i, h: h, line: line, btn: b, start: performance.now(), end: B.end };
        b.textContent = '■'; line.style.display = '';
        resume(anim);
      });
    });
    var anim = addAnim(f.stage, function(){
      if (!playing) return false;
      var el2 = (performance.now() - playing.start) / 1000;
      playing.line.setAttribute('x1', (el2 * PX).toFixed(1)); playing.line.setAttribute('x2', (el2 * PX).toFixed(1));
      var bar = [].slice.call(playing.line.parentNode.querySelectorAll('.pl-snd-bar'));
      var B = blasts(SOUNDS[playing.i].p);
      bar.forEach(function(r, k){ r.classList.toggle('on', el2 >= B.b[k][0] && el2 < B.b[k][0] + B.b[k][1]); });
      if (el2 > playing.end + 0.3){ bar.forEach(function(r){ r.classList.remove('on'); }); playing.line.style.display = 'none'; playing.btn.textContent = '▶'; playing = null; return false; }
      return true;
    });
    anim.paused = true;
  };

  /* =====================================================================
     6. MARCAS DE DÍA y PREFERENCIAS
     ===================================================================== */
  function shapes(kind, x, y, p){
    // y = top of the stack; returns svg
    var s = '', r = 9;
    function ball(cy){ return '<circle cx="' + x + '" cy="' + cy + '" r="' + r + '" fill="url(#' + p + 'ball)"/>'; }
    function coneDown(cy){ return '<path d="M' + (x - 10) + ',' + cy + ' L' + (x + 10) + ',' + cy + ' L' + x + ',' + (cy + 18) + ' Z" fill="url(#' + p + 'shape)"/>'; }
    function coneUp(cy){ return '<path d="M' + (x - 10) + ',' + (cy + 18) + ' L' + (x + 10) + ',' + (cy + 18) + ' L' + x + ',' + cy + ' Z" fill="url(#' + p + 'shape)"/>'; }
    function diamond(cy){ return '<path d="M' + x + ',' + cy + ' L' + (x + 10) + ',' + (cy + 12) + ' L' + x + ',' + (cy + 24) + ' L' + (x - 10) + ',' + (cy + 12) + ' Z" fill="url(#' + p + 'shape)"/>'; }
    if (kind === 1) s = ball(y + r);
    if (kind === 2) s = ball(y + r) + ball(y + r * 3 + 6);
    if (kind === 3) s = ball(y + r) + ball(y + r * 3 + 6) + ball(y + r * 5 + 12);
    if (kind === 'cone') s = coneDown(y);
    if (kind === 'ram') s = ball(y + r) + diamond(y + 2 * r + 5) + ball(y + 2 * r + 5 + 24 + 5 + r);
    if (kind === 'fish') s = coneDown(y) + coneUp(y + 19);
    return s;
  }
  function shapeDefs(p){
    return '<radialGradient id="' + p + 'ball" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#6b7280"/><stop offset=".45" stop-color="#1f2328"/><stop offset="1" stop-color="#050607"/></radialGradient>' +
      '<linearGradient id="' + p + 'shape" x1="0" x2="1"><stop offset="0" stop-color="#050607"/><stop offset=".4" stop-color="#3a3f46"/><stop offset="1" stop-color="#0a0b0d"/></linearGradient>' +
      '<linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe8f7"/><stop offset="1" stop-color="#f4f9fc"/></linearGradient>';
  }
  FIG.marcas = function(el){
    var f = frame(el, 'Marcas de día', 'Se izan donde mejor se vean. El cono con el vértice hacia abajo lo muestra un velero que navega a vela y además usa su motor.', 'Diagrama');
    var p = uid();
    var items = [[1, ['Fondeado'], '1 esfera'], [2, ['Sin', 'gobierno'], '2 esferas'], [3, ['Varado'], '3 esferas'], ['cone', ['Velero a', 'motor y vela'], 'cono ▼'], ['ram', ['Maniobra', 'restringida'], 'bola–rombo–bola']];
    var s = '<svg viewBox="0 0 400 210" class="pl-svg" role="img" aria-label="Marcas de día: una esfera fondeado, dos sin gobierno, tres varado, cono vértice abajo velero a motor, bola rombo bola maniobra restringida"><defs>' + shapeDefs(p) + '</defs>' +
      '<rect width="400" height="210" fill="url(#' + p + 'sky)"/>';
    items.forEach(function(it, i){
      var x = 42 + i * 76;
      s += '<path d="M' + x + ',10 L' + x + ',142" stroke="#8b6b3d" stroke-width="3"/><path d="M' + (x + 3) + ',14 L' + (x + 3) + ',126" stroke="#475569" stroke-width=".8"/>' +
        '<rect x="' + (x - 22) + '" y="142" width="44" height="8" rx="3" fill="#cbd5e1"/>' +
        shapes(it[0], x + 18, 22, p) +
        it[1].map(function(l, j){ return T(x, 164 + j * 13, l, { size: 10.5 }); }).join('') + T(x, 164 + it[1].length * 13 + 2, it[2], { size: 9, fill: '#475569' });
    });
    f.stage.innerHTML = s + '</svg>';
  };
  FIG.preferencias = function(el){
    var f = frame(el, '¿Quién se aparta de quién?', 'Cada buque se mantiene apartado de los que están <b>más arriba</b> en la escala (Regla 18). Las reglas de cruce, vuelta encontrada y alcance se aplican entre buques del mismo tipo; <b>el que alcanza siempre cede</b>.', 'Diagrama');
    var p = uid();
    var rows = [['Sin gobierno', 'no puede maniobrar', 2], ['Maniobra restringida', 'dragando, cableando, etc.', 'ram'], ['Dedicado a la pesca', 'con aparejos que limitan su maniobra', 'fish'], ['A vela', 'navegando solo a vela', 'sail'], ['A motor', 'el más maniobrable: cede a todos los de arriba', 'motor']];
    var s = '<svg viewBox="0 0 400 300" class="pl-svg" role="img" aria-label="Escala de preferencias: sin gobierno, maniobra restringida, pesca, vela y motor"><defs>' + shapeDefs(p) +
      '<linearGradient id="' + p + 'hull" x1="0" x2="1"><stop offset="0" stop-color="#a7b4be"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#97a5b0"/></linearGradient>' +
      '<linearGradient id="' + p + 'rung" x1="0" x2="1"><stop offset="0" stop-color="#0b2545"/><stop offset="1" stop-color="#13406e"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="#f4f8fb"/>';
    rows.forEach(function(r, i){
      var y = 14 + i * 56, wdt = 250 + i * 18;
      s += '<rect x="84" y="' + y + '" width="' + (wdt - 60) + '" height="46" rx="12" fill="url(#' + p + 'rung)" opacity="' + (1 - i * 0.1) + '"/>' +
        '<text x="100" y="' + (y + 21) + '" fill="#fff" font-weight="900" font-size="13" font-family="Nunito,sans-serif">' + (i + 1) + '. ' + esc(r[0]) + '</text>' +
        '<text x="100" y="' + (y + 36) + '" fill="#cfe0ef" font-weight="700" font-size="9.5" font-family="Nunito,sans-serif">' + esc(r[1]) + '</text>' +
        '<circle cx="46" cy="' + (y + 23) + '" r="25" fill="#fff" stroke="#dbe5ec"/>';
      if (r[2] === 'sail') s += '<path d="M46,' + (y + 4) + ' L46,' + (y + 36) + '" stroke="#475569" stroke-width="2"/><path d="M47,' + (y + 6) + ' Q60,' + (y + 22) + ' 60,' + (y + 34) + ' L47,' + (y + 34) + ' Z" fill="#f8fafc" stroke="#94a3b8"/><path d="M45,' + (y + 10) + ' L34,' + (y + 32) + ' L45,' + (y + 32) + ' Z" fill="#eef2f6" stroke="#94a3b8"/><path d="M30,' + (y + 37) + ' L62,' + (y + 37) + ' L58,' + (y + 42) + ' L34,' + (y + 42) + ' Z" fill="#1e3a5f"/>';
      else if (r[2] === 'motor') s += '<path d="M24,' + (y + 26) + ' L70,' + (y + 26) + ' L64,' + (y + 36) + ' L28,' + (y + 36) + ' Z" fill="url(#' + p + 'hull)" stroke="#334155"/><path d="M38,' + (y + 26) + ' L42,' + (y + 16) + ' L56,' + (y + 16) + ' L58,' + (y + 26) + ' Z" fill="#1e3a5f"/>';
      else s += '<g transform="translate(0,' + (y - 3) + ') scale(.9)" transform-origin="46 ' + (y + 23) + '">' + shapes(r[2], 46, 3, p) + '</g>';
    });
    s += '<path d="M372,250 L372,40" stroke="#B45309" stroke-width="4" stroke-linecap="round"/><path d="M372,30 l-9,14 h18 z" fill="#B45309"/>' +
      '<text x="388" y="150" class="pl-sl" fill="#B45309" font-size="11" text-anchor="middle" transform="rotate(-90 388 150)">cede a los de arriba</text>';
    f.stage.innerHTML = s + '</svg>';
  };

  /* =====================================================================
     7. NUDOS (renderizador de cabos de Marinero)
     ===================================================================== */
  var KNOTS = [
    ['bowline', 'As de guía', 'Gaza fija en el chicote que no se corre.'],
    ['clove', 'Ballestrinque', 'Sujeta un cabo a un poste o mástil.'],
    ['fig8', 'Nudo de ocho', 'Tope en el chicote para que no se escape.'],
    ['reef', 'Rizo o llano', 'Une dos cabos de igual mena.'],
    ['sheet', 'Vuelta de escota', 'Une el chicote de un cabo a una gaza.'],
    ['cleat', 'Vuelta de cornamusa', 'Para tomar vueltas y hacer firme un cabo.']
  ];
  var _models = {};
  function knotDef(id){ var D = window.MarineroData; if (!D) return null; for (var i = 0; i < D.KNOTS.length; i++) if (D.KNOTS[i].id === id) return D.KNOTS[i]; return null; }
  function paintKnot(cv, K, w, vis, fast){
    var MA = window.MarineroArt;
    var M = _models[K.id] || (_models[K.id] = MA.buildModel(K));
    var h = Math.round(w * 0.72), o = MA.fitCanvas(cv, w, h, fast ? 1 : 2), ctx = o.ctx;
    var V = K.view || [0, 0, 1000], sc = w / V[2];
    ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
    ctx.drawImage(K.scene === 'post' ? MA.harbourBokeh(w, h, o.dpr) : MA.teakDeck(w, h, o.dpr), 0, 0, w, h);
    ctx.setTransform(o.dpr * sc, 0, 0, o.dpr * sc, -V[0] * sc * o.dpr, -V[1] * sc * o.dpr);
    MA.drawModel(ctx, M, { vis: vis, devScale: o.dpr * sc, objects: MA.knotObjects(K, o.dpr * sc), ground: K.scene !== 'post' });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return M;
  }
  FIG.nudos = function(el){
    var MA = window.MarineroArt;
    var f = frame(el, 'Nudos de examen', 'Toca un nudo para verlo grande y luego <b>▶ Ver cómo se hace</b>. Practícalo después con un cabo de verdad.', 'Interactivo');
    if (!MA || !window.MarineroData){ f.stage.innerHTML = '<p class="pl-fig-info">' + KNOTS.map(function(k){ return '<b>' + k[1] + '</b>: ' + k[2]; }).join('<br>') + '</p>'; return; }
    var cur = 0, anim = null, prog = 1;
    f.stage.innerHTML = '<div class="pl-knot-big"><canvas aria-label="Nudo seleccionado"></canvas><div class="pl-knot-cap"></div></div>' +
      '<div class="pl-fig-grid pl-knot-grid">' + KNOTS.map(function(k, i){
        return '<button type="button" class="pl-card' + (i ? '' : ' on') + '" data-i="' + i + '"><canvas aria-hidden="true"></canvas><span class="pl-card-t">' + esc(k[1]) + '</span><span class="pl-card-s">' + esc(k[2]) + '</span></button>';
      }).join('') + '</div>';
    var big = f.stage.querySelector('.pl-knot-big canvas'), cap = f.stage.querySelector('.pl-knot-cap');
    var cards = [].slice.call(f.stage.querySelectorAll('.pl-knot-grid .pl-card'));
    function vis(K, M, k){
      var v = []; M.ropes.forEach(function(R, ri){ v[ri] = R.L; });
      var tr = K.travel || 0, R = M.ropes[tr], s0 = MA.sAtCP(R, K.u0 || 1);
      v[tr] = s0 + (R.L - s0) * k;
      return v;
    }
    function drawBig(fast){
      var K = knotDef(KNOTS[cur][0]); if (!K) return;
      var w = Math.min(640, big.parentNode.clientWidth || 320);
      var M = _models[K.id] || (_models[K.id] = MA.buildModel(K));
      paintKnot(big, K, w, prog >= 1 ? null : vis(K, M, prog), fast);
      cap.innerHTML = '<b>' + esc(KNOTS[cur][1]) + '</b> · ' + esc(KNOTS[cur][2]);
    }
    function thumbs(){
      cards.forEach(function(c, i){ var K = knotDef(KNOTS[i][0]); if (K) paintKnot(c.querySelector('canvas'), K, c.clientWidth || 150, null, true); });
    }
    cards.forEach(function(c, i){ c.addEventListener('click', function(){ cur = i; prog = 1; cards.forEach(function(x){ x.classList.toggle('on', x === c); }); drawBig(); big.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); });
    var play = btn(f.ctrl, '▶ Ver cómo se hace', function(){ prog = 0; resume(anim); }, 'pl-mini-btn-alt');
    anim = addAnim(big, function(t, dt){
      if (prog >= 1) return false;
      prog = Math.min(1, prog + dt / 4.5);
      drawBig(prog < 1);
      return prog < 1;
    });
    anim.paused = true;
    // first paint once the figure is visible (canvas needs a layout width)
    requestAnimationFrame(function(){ drawBig(); thumbs(); });
    var rw = 0; window.addEventListener('resize', function(){ if (!big.isConnected) return; var w = big.parentNode.clientWidth; if (Math.abs(w - rw) > 30){ rw = w; drawBig(); thumbs(); } });
  };
  FIG.cabo = function(el){
    var MA = window.MarineroArt;
    var f = frame(el, 'Partes de un cabo', '<b>Firme</b>: la parte fija o que queda quieta. <b>Seno</b>: cualquier parte intermedia (una "U"). <b>Chicote</b>: el extremo con que se trabaja.', 'Diagrama');
    if (!MA){ el.remove(); return; }
    var K = { id: 'pl_cabo', W: 40, scene: 'deck', ropes: [{ color: 'manila', start: 'none', end: 'whip', pts: [[-80, 250], [120, 250], [330, 260], [520, 300], [660, 380], [700, 480], [640, 570], [500, 610], [340, 590], [230, 530], [190, 450]] }], ou: '', travel: 0 };
    var cv = document.createElement('canvas'); cv.className = 'pl-cv'; f.stage.appendChild(cv);
    function draw(){
      var w = f.stage.clientWidth || 320;
      paintKnot(cv, K, w);
      var ctx = cv.getContext('2d'), dpr = cv.width / w; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var k = w / 1000, sz = Math.max(12, Math.round(w / 34));
      label(ctx, 'FIRME', 150 * k, 180 * k, { size: sz, color: '#0b2545' });
      label(ctx, '(hacia la bita)', 150 * k, 180 * k + sz * 1.2, { size: sz * 0.75, weight: 700, color: '#0b2545' });
      label(ctx, 'SENO', 790 * k, 470 * k, { size: sz, color: '#0b2545' });
      label(ctx, 'CHICOTE', 250 * k, 380 * k, { size: sz, color: '#b45309' });
      arrow(ctx, 250 * k, 400 * k, 200 * k, 440 * k, '#b45309', Math.max(2, w / 220));
    }
    requestAnimationFrame(draw);
  };

  /* =====================================================================
     8. ESCALA BEAUFORT — estado del mar interactivo
     ===================================================================== */
  var BEAUFORT = [
    ['< 1', 'Calma', '0', 'Mar como un espejo.'],
    ['1–3', 'Ventolina', '0,1', 'Rizos como escamas, sin espuma.'],
    ['4–6', 'Brisa muy débil (flojito)', '0,2', 'Olas pequeñas; crestas de apariencia vítrea que no rompen.'],
    ['7–10', 'Brisa débil (flojo)', '0,6', 'Olas pequeñas; las crestas empiezan a romper; algunos borreguillos.'],
    ['11–16', 'Brisa moderada (bonancible)', '1', 'Olas pequeñas que se alargan; borreguillos frecuentes.'],
    ['17–21', 'Brisa fresca (fresquito)', '2', 'Olas moderadas y más largas; muchos borreguillos; algún roción.'],
    ['22–27', 'Brisa fuerte (fresco)', '3', 'Olas grandes; crestas de espuma blanca extensas; rociones.'],
    ['28–33', 'Viento fuerte (frescachón)', '4', 'Mar gruesa; la espuma de las crestas empieza a formar bandas en la dirección del viento.'],
    ['34–40', 'Temporal (duro)', '5,5', 'Olas altas y más largas; las crestas se rompen en rociones; espuma en bandas.'],
    ['41–47', 'Temporal fuerte (muy duro)', '7', 'Olas altas; densas bandas de espuma; las crestas rompen y ruedan; los rociones reducen la visibilidad.'],
    ['48–55', 'Temporal duro', '9', 'Olas muy altas con crestas largas; superficie blanca de espuma; visibilidad reducida.'],
    ['56–63', 'Temporal muy duro (borrasca)', '11,5', 'Olas excepcionalmente altas; mar cubierta de espuma; visibilidad reducida.'],
    ['≥ 64', 'Temporal huracanado (huracán)', '14 o más', 'Aire lleno de espuma y rociones; mar completamente blanca; visibilidad muy reducida.']
  ];
  function mixHex(a, b, t){
    var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    var r = Math.round(lerp(A >> 16 & 255, B >> 16 & 255, t)), g = Math.round(lerp(A >> 8 & 255, B >> 8 & 255, t)), bl = Math.round(lerp(A & 255, B & 255, t));
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  function drawSeaState(ctx, w, h, F, t){
    var q = F / 12, hz = h * (0.34 + q * 0.04);
    var sky = ctx.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, mixHex('#5fa8dc', '#3b4249', Math.min(1, q * 1.25))); sky.addColorStop(1, mixHex('#d6ecf8', '#7b858e', Math.min(1, q * 1.2)));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hz + 2);
    // clouds
    var r = rng(5);
    var nC = 3 + Math.round(q * 8);
    for (var c = 0; c < nC; c++){
      var cx = ((r() * w * 1.4 + t * (6 + F * 7)) % (w * 1.4)) - w * 0.2, cy = r() * hz * 0.6, cw = w * (0.12 + r() * 0.2) * (1 + q);
      ctx.fillStyle = 'rgba(' + Math.round(lerp(255, 90, q)) + ',' + Math.round(lerp(255, 96, q)) + ',' + Math.round(lerp(255, 104, q)) + ',' + (0.55 + q * 0.3) + ')';
      for (var b = 0; b < 5; b++){ ctx.beginPath(); ctx.ellipse(cx + (b - 2) * cw * 0.2, cy + Math.sin(b * 2) * cw * 0.05, cw * 0.22, cw * 0.11, 0, 0, TAU); ctx.fill(); }
    }
    // sea base
    var sea = ctx.createLinearGradient(0, hz, 0, h);
    sea.addColorStop(0, mixHex('#3d8fb5', '#3c4b55', q)); sea.addColorStop(1, mixHex('#16577a', '#1d2830', q));
    ctx.fillStyle = sea; ctx.fillRect(0, hz, w, h - hz);
    if (F === 0){
      // mirror reflection of the sky
      var mg = ctx.createLinearGradient(0, hz, 0, h); mg.addColorStop(0, 'rgba(220,240,250,.55)'); mg.addColorStop(1, 'rgba(220,240,250,0)');
      ctx.fillStyle = mg; ctx.fillRect(0, hz, w, (h - hz) * 0.6);
    }
    var Hm = [0, 0.1, 0.2, 0.6, 1, 2, 3, 4, 5.5, 7, 9, 11.5, 14][F];
    var amp = Math.pow(Hm, 0.62) * h * 0.028, rows = 14;
    var foam = [0, 0, 0, 0.08, 0.22, 0.38, 0.55, 0.68, 0.78, 0.86, 0.93, 0.97, 1][F];
    for (var i = 0; i < rows; i++){
      var k = i / (rows - 1), y0 = hz + (h - hz) * Math.pow(k, 1.5) + 2, A = amp * (0.15 + k * 0.95), lam = w * (0.06 + k * 0.32) * (1 + q * 0.6);
      var ph = i * 1.7, spd = 1.2 + q * 1.5;
      ctx.beginPath(); ctx.moveTo(0, h);
      var step = Math.max(3, lam / 18), crest = [];
      for (var x = -lam; x <= w + lam; x += step){
        var th = (x / lam) * TAU - t * spd + ph;
        var am = 0.72 + 0.28 * Math.sin(x / (lam * 2.7) + i * 2.1 - t * 0.3);
        var yy = y0 - A * am * Math.cos(th) - A * am * 0.35 * Math.cos(2 * th + 0.6) * q;
        var xx = x + A * 0.45 * Math.sin(th) * (0.4 + q);
        ctx.lineTo(xx, yy);
        if (Math.cos(th) > 0.93) crest.push([xx, yy, th]);
      }
      ctx.lineTo(w, h); ctx.closePath();
      var gg = ctx.createLinearGradient(0, y0 - A, 0, y0 + A * 1.5 + 6);
      gg.addColorStop(0, mixHex('#5aa9cc', '#6c7d88', q)); gg.addColorStop(1, mixHex('#1c6589', '#23323c', q));
      ctx.fillStyle = gg; ctx.fill();
      if (F > 1){ ctx.strokeStyle = 'rgba(255,255,255,' + (0.08 + k * 0.12) + ')'; ctx.lineWidth = 1; ctx.stroke(); }
      // whitecaps
      if (foam > 0){
        var rr = rng(i * 31 + 7);
        crest.forEach(function(cp){
          var seed = Math.floor((cp[2] + t * spd) / TAU * 7 + i * 13);
          var rnd = (Math.sin(seed * 12.9898) * 43758.5453) % 1; rnd = rnd < 0 ? -rnd : rnd;
          if (rnd > foam) return;
          var fw = (4 + k * 18) * (0.55 + foam), fh = 1 + k * 3 * (0.5 + foam), cx2 = cp[0], cy2 = cp[1];
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 + 0.35 * foam) + ')'; ctx.lineWidth = 1 + k * 2.6 * (0.4 + foam); ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(cx2 - fw, cy2 + fh * 1.2); ctx.quadraticCurveTo(cx2 - fw * 0.2, cy2 - fh * 0.6, cx2 + fw * 0.7, cy2 + fh * 1.6); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + 0.3 * foam) + ')';
          for (var sp2 = 0; sp2 < 3 + foam * 6; sp2++){ var sx2 = cx2 + (rr() - 0.3) * fw * 1.8, sy2 = cy2 + fh + rr() * (2 + k * 7); ctx.fillRect(sx2, sy2, 1 + k * 2 * rr(), 1 + k * 1.2 * rr()); }
          if (F >= 7){ ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 1 + k * 1.6; ctx.beginPath(); ctx.moveTo(cx2 + fw * 0.6, cy2 + fh * 2); ctx.lineTo(cx2 + fw * 3.2, cy2 + fh * 3.2 + k * 6); ctx.stroke(); }
        });
      }
    }
    // spray / reduced visibility
    if (F >= 9){
      ctx.fillStyle = 'rgba(220,226,230,' + ((F - 8) * 0.09) + ')'; ctx.fillRect(0, 0, w, h);
      var rs = rng(99); ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (var sp = 0; sp < 40 + (F - 8) * 40; sp++){ var sx = (rs() * w + t * 180) % w, sy = rs() * h; ctx.fillRect(sx, sy, 2 + rs() * 6, 1); }
    }
    // flag pole (wind from the left)
    var px = w * 0.08, py = hz + (h - hz) * 0.15;
    ctx.fillStyle = '#5b4a33'; ctx.fillRect(px - 2, py - h * 0.3, 3, h * 0.3);
    ctx.fillStyle = '#6b5a43'; ctx.fillRect(px - 10, py - 2, 20, 6);
    var fl = w * 0.08, droop = Math.max(0, 1 - F / 4), fy = py - h * 0.3 + 2;
    ctx.beginPath(); ctx.moveTo(px, fy);
    for (var j = 0; j <= 10; j++){
      var u = j / 10, wave = Math.sin(u * 6 - t * (4 + F)) * (2 + F * 0.4) * u * (1 - droop * 0.6);
      ctx.lineTo(px + u * fl * (1 - droop * 0.75), fy + u * fl * droop * 0.9 + wave);
    }
    for (j = 10; j >= 0; j--){
      var u2 = j / 10, wave2 = Math.sin(u2 * 6 - t * (4 + F)) * (2 + F * 0.4) * u2 * (1 - droop * 0.6);
      ctx.lineTo(px + u2 * fl * (1 - droop * 0.75) - droop * u2 * 4, fy + fl * 0.55 + u2 * fl * droop * 0.9 + wave2);
    }
    ctx.closePath(); ctx.fillStyle = '#d7262b'; ctx.fill();
    // wind arrow
    if (F > 0) arrow(ctx, w * 0.78, h * 0.12, w * 0.78 + Math.min(w * 0.18, 12 + F * 6), h * 0.12, 'rgba(255,255,255,0.9)', 2 + F * 0.25);
  }
  FIG.beaufort = function(el){
    var f = frame(el, 'Escala Beaufort', 'Velocidad del viento en <b>nudos</b> y altura probable de las olas <b>en mar abierto</b> (OMM). En bahías y cerca de la costa las olas suelen ser menores.', 'Interactivo');
    var F = 4, quiz = null;
    var C = canvasIn(f.stage, 0.5, 340);
    var info = document.createElement('div'); info.className = 'pl-bft';
    f.stage.appendChild(info);
    var range = document.createElement('div'); range.className = 'pl-range';
    var rid = uid() + 'r';
    range.innerHTML = '<label for="' + rid + '">Fuerza</label><input type="range" id="' + rid + '" min="0" max="12" step="1" value="4"><span class="pl-readout"></span>';
    f.ctrl.appendChild(range);
    var inp = range.querySelector('input'), out = range.querySelector('.pl-readout');
    function show(){
      var d = BEAUFORT[F];
      out.textContent = 'Fuerza ' + F;
      info.innerHTML = quiz ? '<b>¿Qué fuerza Beaufort es?</b> Mira las olas, la espuma y la bandera.' :
        '<div class="pl-bft-n"><b>' + F + '</b><span>' + esc(d[1]) + '</span></div><div class="pl-bft-d"><div><b>' + d[0] + '</b> nudos</div><div>olas ≈ <b>' + d[2] + ' m</b></div><p>' + esc(d[3]) + '</p></div>';
    }
    inp.addEventListener('input', function(){ F = +inp.value; show(); });
    var qb = document.createElement('div'); qb.className = 'pl-lquiz'; f.fig.insertBefore(qb, f.cap);
    var qBtn = btn(f.ctrl, '¿Qué fuerza es? (prueba)', function(){
      if (quiz){ quiz = null; qb.innerHTML = ''; inp.disabled = false; qBtn.textContent = '¿Qué fuerza es? (prueba)'; show(); return; }
      quiz = { ok: 0, n: 0 }; inp.disabled = true; qBtn.textContent = 'Salir de la prueba'; ask();
    }, 'pl-mini-btn-alt');
    function ask(){
      var pool = [0, 2, 4, 6, 8, 10, 12], ans = pool[Math.floor(Math.random() * pool.length)];
      F = ans; inp.value = F; show();
      var opts = shuffle([ans].concat(shuffle(pool.filter(function(x){ return Math.abs(x - ans) >= 2; })).slice(0, 2)));
      qb.innerHTML = opts.map(function(o){ return '<button type="button" class="pl-lq-opt" data-f="' + o + '">Fuerza ' + o + ' · ' + esc(BEAUFORT[o][1]) + '</button>'; }).join('');
      qb.querySelectorAll('button').forEach(function(b){
        b.addEventListener('click', function(){
          if (quiz.done) return; quiz.done = true; quiz.n++;
          var ok = +b.getAttribute('data-f') === ans; if (ok) quiz.ok++;
          qb.querySelectorAll('button').forEach(function(x){ x.disabled = true; if (+x.getAttribute('data-f') === ans) x.classList.add('ok'); });
          if (!ok) b.classList.add('bad');
          var q0 = quiz; quiz = null; show(); quiz = q0;
          info.insertAdjacentHTML('afterbegin', '<div class="pl-bft-res">' + (ok ? '✅ ¡Correcto!' : '❌ Era fuerza ' + ans) + ' · ' + quiz.ok + ' de ' + quiz.n + '</div>');
          var nx = document.createElement('button'); nx.type = 'button'; nx.className = 'pl-mini-btn'; nx.textContent = 'Siguiente →';
          nx.addEventListener('click', function(){ quiz.done = false; ask(); }); qb.appendChild(nx);
        });
      });
    }
    show();
    addAnim(C.cv, function(t){ var o = C.size(); drawSeaState(o.ctx, o.w, o.h, F, t); return true; });
  };

  /* =====================================================================
     9. ROSA DE LOS VIENTOS / RUMBOS — arrastra el rumbo
     ===================================================================== */
  var P16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  function pad3(n){ n = ((Math.round(n) % 360) + 360) % 360; return ('00' + n).slice(-3); }
  FIG.rosa = function(el){
    var f = frame(el, 'Rosa de los vientos y rumbos', 'El rumbo se mide de <b>000° a 360°</b> en sentido horario desde el Norte. Arrastra la flecha o prueba el desafío.', 'Interactivo');
    var p = uid(), hdg = 45, target = null, score = 0, n = 0;
    var s = '<svg viewBox="0 0 300 300" class="pl-svg pl-rose" role="img" aria-label="Rosa de los vientos"><defs>' +
      '<radialGradient id="' + p + 'card" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#efe6cc"/></radialGradient>' +
      '<linearGradient id="' + p + 'brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e19a"/><stop offset=".5" stop-color="#b8901f"/><stop offset="1" stop-color="#6e4f15"/></linearGradient></defs>' +
      '<circle cx="150" cy="150" r="146" fill="url(#' + p + 'brass)"/><circle cx="150" cy="150" r="139" fill="url(#' + p + 'card)"/>';
    for (var d = 0; d < 360; d += 2){
      var big = d % 10 === 0, mid = d % 5 === 0, r0 = 139, r1 = big ? 126 : mid ? 130 : 133;
      var a = d * D2R;
      s += '<path d="M' + (150 + r0 * Math.sin(a)).toFixed(1) + ',' + (150 - r0 * Math.cos(a)).toFixed(1) + ' L' + (150 + r1 * Math.sin(a)).toFixed(1) + ',' + (150 - r1 * Math.cos(a)).toFixed(1) + '" stroke="#3b2f1a" stroke-width="' + (big ? 1.3 : 0.7) + '"/>';
      if (d % 30 === 0) s += '<text x="' + (150 + 116 * Math.sin(a)).toFixed(1) + '" y="' + (150 - 116 * Math.cos(a) + 3.5).toFixed(1) + '" text-anchor="middle" font-size="9.5" font-weight="800" fill="#3b2f1a" font-family="Nunito,sans-serif" transform="rotate(' + d + ' ' + (150 + 116 * Math.sin(a)).toFixed(1) + ' ' + (150 - 116 * Math.cos(a)).toFixed(1) + ')">' + pad3(d) + '</text>';
    }
    s += '<circle cx="150" cy="150" r="104" fill="none" stroke="#3b2f1a" stroke-width=".8"/>';
    // 32-point star: 4 cardinals long, 4 intercardinals, 8 and 16 small
    function point(ang, len, wdt, dark, light){
      var a2 = ang * D2R, tip = [150 + len * Math.sin(a2), 150 - len * Math.cos(a2)];
      var l = [150 + wdt * Math.sin(a2 - Math.PI / 2), 150 - wdt * Math.cos(a2 - Math.PI / 2)], r = [150 + wdt * Math.sin(a2 + Math.PI / 2), 150 - wdt * Math.cos(a2 + Math.PI / 2)];
      return '<path d="M150,150 L' + l[0].toFixed(1) + ',' + l[1].toFixed(1) + ' L' + tip[0].toFixed(1) + ',' + tip[1].toFixed(1) + ' Z" fill="' + light + '"/><path d="M150,150 L' + r[0].toFixed(1) + ',' + r[1].toFixed(1) + ' L' + tip[0].toFixed(1) + ',' + tip[1].toFixed(1) + ' Z" fill="' + dark + '"/>';
    }
    for (var q = 0; q < 32; q++){ var ang = q * 11.25; if (q % 2) s += point(ang, 62, 3.4, '#9a8a64', '#d9cda8'); }
    for (q = 0; q < 16; q++){ if (q % 2) s += point(q * 22.5, 78, 6, '#2e5b86', '#8fb2d1'); }
    for (q = 0; q < 8; q++){ if (q % 2) s += point(q * 45, 88, 9, '#0b2545', '#5d7ea0'); }
    for (q = 0; q < 4; q++) s += point(q * 90, 102, 12, q === 0 ? '#8f1a14' : '#0b2545', q === 0 ? '#e2382f' : '#4e6f92');
    s += '<circle cx="150" cy="150" r="7" fill="url(#' + p + 'brass)" stroke="#3b2f1a" stroke-width=".8"/>';
    [['N', 0], ['E', 90], ['S', 180], ['O', 270]].forEach(function(c){ var a3 = c[1] * D2R; s += '<text x="' + (150 + 92 * Math.sin(a3)).toFixed(1) + '" y="' + (150 - 92 * Math.cos(a3) + 6).toFixed(1) + '" text-anchor="middle" font-size="17" font-weight="900" fill="' + (c[0] === 'N' ? '#b91c1c' : '#0b2545') + '" font-family="Baloo 2,Nunito,sans-serif" stroke="#fffdf6" stroke-width="3" paint-order="stroke">' + c[0] + '</text>'; });
    [['NE', 45], ['SE', 135], ['SO', 225], ['NO', 315]].forEach(function(c){ var a3 = c[1] * D2R; s += '<text x="' + (150 + 70 * Math.sin(a3)).toFixed(1) + '" y="' + (150 - 70 * Math.cos(a3) + 4).toFixed(1) + '" text-anchor="middle" font-size="10" font-weight="900" fill="#0b2545" font-family="Nunito,sans-serif" stroke="#fffdf6" stroke-width="2.5" paint-order="stroke">' + c[0] + '</text>'; });
    s += '<g class="pl-rose-tgt"></g><g class="pl-rose-ptr"></g></svg>';
    f.stage.innerHTML = '<div class="pl-rose-wrap">' + s + '<div class="pl-rose-read" aria-live="polite"></div></div>';
    var svg = f.stage.querySelector('svg'), ptr = svg.querySelector('.pl-rose-ptr'), tg = svg.querySelector('.pl-rose-tgt'), read = f.stage.querySelector('.pl-rose-read');
    function draw(){
      var a4 = hdg * D2R, x = 150 + 132 * Math.sin(a4), y = 150 - 132 * Math.cos(a4);
      ptr.innerHTML = '<path d="M150,150 L' + x.toFixed(1) + ',' + y.toFixed(1) + '" stroke="#b45309" stroke-width="4" stroke-linecap="round"/>' +
        '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') rotate(' + hdg + ')"><path d="M0,-6 L8,12 L-8,12 Z" fill="#b45309"/><circle r="15" fill="#b45309" fill-opacity=".14"/></g>';
      var name = P16[Math.round(hdg / 22.5) % 16], off = Math.abs(((hdg - Math.round(hdg / 22.5) * 22.5) + 540) % 360 - 180);
      read.innerHTML = target != null ? '<b>Apunta a: ' + target.txt + '</b><span>Tu rumbo: ' + pad3(hdg) + '°</span>' :
        '<b>' + pad3(hdg) + '°</b><span>' + (off < 4 ? name : '≈ ' + name) + '</span>';
    }
    var drag = false;
    function setFrom(ev){ var pt = svgPt(svg, ev); hdg = (Math.atan2(pt.x - 150, -(pt.y - 150)) / D2R + 360) % 360; hdg = Math.round(hdg) % 360; draw(); }
    svg.addEventListener('pointerdown', function(ev){ drag = true; svg.setPointerCapture(ev.pointerId); setFrom(ev); });
    svg.addEventListener('pointermove', function(ev){ if (drag) setFrom(ev); });
    svg.addEventListener('pointerup', function(){ drag = false; if (target) check(); });
    var cb;
    var chal = btn(f.ctrl, '🎯 Desafío de rumbos', function(){
      if (target){ target = null; tg.innerHTML = ''; chal.textContent = '🎯 Desafío de rumbos'; if (cb) cb.remove(); draw(); return; }
      score = 0; n = 0; chal.textContent = 'Salir del desafío'; newT();
    }, 'pl-mini-btn-alt');
    function newT(){
      var useName = Math.random() < 0.5, k = Math.floor(Math.random() * 16);
      target = useName ? { deg: k * 22.5, txt: P16[k] } : { deg: Math.floor(Math.random() * 36) * 10, txt: '' };
      if (!useName) target.txt = pad3(target.deg) + '°';
      tg.innerHTML = ''; draw();
      if (!cb){ cb = document.createElement('div'); cb.className = 'pl-rose-score'; f.ctrl.appendChild(cb); }
      cb.textContent = 'Suelta la flecha en el rumbo pedido · ' + score + '/' + n;
    }
    function check(){
      var err = Math.abs(((hdg - target.deg) + 540) % 360 - 180), ok = err <= 6; n++; if (ok) score++;
      var a5 = target.deg * D2R;
      tg.innerHTML = '<path d="M150,150 L' + (150 + 132 * Math.sin(a5)).toFixed(1) + ',' + (150 - 132 * Math.cos(a5)).toFixed(1) + '" stroke="' + (ok ? '#059669' : '#2563eb') + '" stroke-width="3" stroke-dasharray="5 4"/>';
      cb.textContent = (ok ? '✅ ¡Bien! ' : '❌ Era ' + pad3(target.deg) + '° (' + P16[Math.round(target.deg / 22.5) % 16] + '). ') + score + '/' + n;
      var t0 = target; setTimeout(function(){ if (target === t0) newT(); }, 1400);
    }
    draw();
  };

  /* =====================================================================
     10. CARTA NÁUTICA — compás de puntas sobre la escala de latitudes
     ===================================================================== */
  FIG.carta = function(el){
    var f = frame(el, 'Medir distancias en la carta', 'Arrastra las dos puntas del <b>compás</b>. La abertura se lleva a la <b>escala de latitudes</b> (margen izquierdo): cada minuto de latitud = 1 milla náutica. Carta de práctica <b>ficticia</b>.', 'Interactivo');
    var p = uid(), LAT0 = 33, PXM = 46, X0 = 34, Y0 = 26, Wc = 352, Hc = 258;
    var pxLon = PXM * Math.cos(33.04 * D2R);
    var A = { x: 120, y: 150 }, B = { x: 250, y: 92 };
    var s = '<svg viewBox="0 0 400 300" class="pl-svg pl-chart" role="img" aria-label="Carta náutica de práctica con escala de latitudes y compás de puntas"><defs>' +
      '<clipPath id="' + p + 'clip"><rect x="' + X0 + '" y="' + Y0 + '" width="' + Wc + '" height="' + Hc + '"/></clipPath>' +
      '<linearGradient id="' + p + 'steel" x1="0" x2="1"><stop offset="0" stop-color="#6b7280"/><stop offset=".5" stop-color="#e5e7eb"/><stop offset="1" stop-color="#4b5563"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="#fbfaf4"/>' +
      '<g clip-path="url(#' + p + 'clip)"><rect x="' + X0 + '" y="' + Y0 + '" width="' + Wc + '" height="' + Hc + '" fill="#ffffff"/>' +
      // 10 m and 5 m shallows (blue tint) + land (buff) on the east
      '<path d="M300,26 C292,70 262,96 270,132 C278,168 240,190 252,230 C262,262 300,276 300,284 L386,284 L386,26 Z" fill="#cfe6f3"/>' +
      '<path d="M330,26 C322,66 300,92 306,130 C312,166 284,190 292,228 C300,258 330,274 334,284 L386,284 L386,26 Z" fill="#a9d3ea"/>' +
      '<path d="M352,26 C344,62 330,88 336,126 C340,150 322,170 326,200 C330,236 356,262 362,284 L386,284 L386,26 Z" fill="#f2e3b3" stroke="#6b5a2e" stroke-width="1"/>' +
      '<path d="M300,26 C292,70 262,96 270,132 C278,168 240,190 252,230 C262,262 300,276 300,284" fill="none" stroke="#2a6e94" stroke-width=".8" stroke-dasharray="6 2 1 2"/>' +
      '<path d="M330,26 C322,66 300,92 306,130 C312,166 284,190 292,228 C300,258 330,274 334,284" fill="none" stroke="#2a6e94" stroke-width=".8" stroke-dasharray="3 2"/>' +
      '<text x="276" y="108" font-size="7.5" fill="#2a6e94" font-style="italic" font-family="Nunito,sans-serif">10 m</text><text x="309" y="112" font-size="7.5" fill="#2a6e94" font-style="italic" font-family="Nunito,sans-serif">5 m</text>';
    // graticule every minute
    for (var m = 0; m <= 6; m++){ var yy = Y0 + m * PXM; s += '<path d="M' + X0 + ',' + yy + ' H' + (X0 + Wc) + '" stroke="#94a3b8" stroke-width=".4"/>'; }
    for (m = 0; m <= 9; m++){ var xx = X0 + m * pxLon; s += '<path d="M' + xx.toFixed(1) + ',' + Y0 + ' V' + (Y0 + Hc) + '" stroke="#94a3b8" stroke-width=".4"/>'; }
    // soundings (italic, metres) and bottom letters
    var snd = [[70, 60, '42', 'f'], [120, 100, '38', ''], [180, 56, '35', 'a'], [80, 200, '45', ''], [150, 240, '40', 'f'], [210, 150, '27', 'a'], [240, 210, '18', ''], [250, 70, '22', ''], [268, 160, '9', 'a'], [290, 240, '7', 'r'], [316, 90, '4', 'r'], [300, 196, '6', ''], [200, 110, '30', ''], [110, 150, '41', 'a']];
    snd.forEach(function(q){ s += '<text x="' + q[0] + '" y="' + q[1] + '" font-size="9" font-style="italic" fill="#1f2937" font-family="Nunito,sans-serif">' + q[2] + (q[3] ? '<tspan font-size="6.5" dx="1">' + q[3] + '</tspan>' : '') + '</text>'; });
    // rocks, lighthouse, buoys
    s += '<text x="318" y="148" font-size="10" fill="#1f2937">✳</text>' +
      '<g transform="translate(342,176)"><path d="M0,0 L-2,-10 L2,-10 Z" fill="#1f2937"/><circle cx="0" cy="-12" r="2" fill="#1f2937"/><path d="M0,-12 C12,-22 20,-14 26,-24 C18,-8 8,-10 0,-12" fill="#c026d3" opacity=".75"/></g>' +
      '<text x="356" y="196" font-size="7" fill="#6b21a8" font-family="Nunito,sans-serif" font-weight="800">Fl 10s</text><text x="356" y="168" font-size="8" fill="#3f3a2e" font-family="Nunito,sans-serif" font-weight="800">Faro</text>' +
      '<g transform="translate(286,120)"><path d="M-3,0 L0,-8 L3,0 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width=".6"/><circle cy="1.5" r="1.3" fill="none" stroke="#1f2937" stroke-width=".6"/></g>' +
      '<g transform="translate(262,138)"><rect x="-3" y="-7" width="6" height="7" fill="#16a34a" stroke="#14532d" stroke-width=".6"/><circle cy="1.5" r="1.3" fill="none" stroke="#1f2937" stroke-width=".6"/></g>' +
      '<text x="348" y="70" font-size="9" fill="#3f3a2e" font-family="Nunito,sans-serif" font-weight="800" text-anchor="middle">Caleta</text>' +
      '<text x="140" y="276" font-size="8" fill="#64748b" font-style="italic" font-family="Nunito,sans-serif">Sondas en metros · a = arena · f = fango · r = roca</text>' +
      '</g>' +
      '<rect x="' + X0 + '" y="' + Y0 + '" width="' + Wc + '" height="' + Hc + '" fill="none" stroke="#1f2937" stroke-width="1"/>';
    // latitude scale (left) — alternating minutes, 0.2' ticks
    for (m = 0; m < 6; m++){
      var y1 = Y0 + m * PXM;
      s += '<rect x="' + (X0 - 8) + '" y="' + y1 + '" width="8" height="' + PXM + '" fill="' + (m % 2 ? '#1f2937' : '#fff') + '" stroke="#1f2937" stroke-width=".6"/>';
      for (var k = 1; k < 5; k++) s += '<path d="M' + (X0 - 8) + ',' + (y1 + k * PXM / 5).toFixed(1) + ' h-3" stroke="#1f2937" stroke-width=".5"/>';
      s += '<text x="' + (X0 - 12) + '" y="' + (y1 + 3) + '" font-size="7.5" text-anchor="end" fill="#1f2937" font-family="Nunito,sans-serif" font-weight="800">' + (m === 0 ? "33°00'" : "0" + m + "'") + '</text>';
    }
    s += '<text x="' + (X0 - 12) + '" y="' + (Y0 + 6 * PXM + 3) + '" font-size="7.5" text-anchor="end" fill="#1f2937" font-family="Nunito,sans-serif" font-weight="800">06\'</text>';
    s += '<text x="10" y="' + (Y0 + Hc / 2) + '" font-size="8" fill="#0e7490" font-weight="900" font-family="Nunito,sans-serif" text-anchor="middle" transform="rotate(-90 10 ' + (Y0 + Hc / 2) + ')">LATITUD S · 1\' = 1 milla</text>';
    // longitude scale (top)
    for (m = 0; m < 8; m++){
      var x1 = X0 + m * pxLon;
      s += '<rect x="' + x1.toFixed(1) + '" y="' + (Y0 - 8) + '" width="' + pxLon.toFixed(1) + '" height="8" fill="' + (m % 2 ? '#1f2937' : '#fff') + '" stroke="#1f2937" stroke-width=".6"/>';
      if (m % 2 === 0) s += '<text x="' + x1.toFixed(1) + '" y="' + (Y0 - 11) + '" font-size="7" text-anchor="middle" fill="#1f2937" font-family="Nunito,sans-serif" font-weight="800">' + (m === 0 ? "71°40'O" : (40 - m) + "'") + '</text>';
    }
    s += '<g class="pl-div-ghost"></g><g class="pl-div"></g></svg>';
    f.stage.innerHTML = s + '<div class="pl-fig-info pl-chart-read" aria-live="polite"></div>';
    var svg = f.stage.querySelector('svg'), gd = svg.querySelector('.pl-div'), gg = svg.querySelector('.pl-div-ghost'), read = f.stage.querySelector('.pl-chart-read');
    function latStr(y){ var mins = (y - Y0) / PXM; return "33°" + ('0' + mins.toFixed(1)).slice(-4).replace('.', ',') + "' S"; }
    function lonStr(x){ var mins = 40 - (x - X0) / pxLon; return "71°" + mins.toFixed(1).replace('.', ',') + "' O"; }
    function draw(){
      var dx = B.x - A.x, dy = B.y - A.y, d = Math.sqrt(dx * dx + dy * dy), nm = d / PXM;
      var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, nx = -dy / (d || 1), ny = dx / (d || 1);
      var hl = Math.max(30, d * 0.75), hx = mx + nx * hl * (ny < 0 ? 1 : -1) * 0.9, hy = my + ny * hl * (ny < 0 ? 1 : -1) * 0.9;
      if (hy > my) { hx = mx - nx * hl * 0.9 * (ny < 0 ? 1 : -1); hy = my - ny * hl * 0.9 * (ny < 0 ? 1 : -1); }
      gd.innerHTML = '<path d="M' + A.x + ',' + A.y + ' L' + B.x + ',' + B.y + '" stroke="#b45309" stroke-width="1" stroke-dasharray="3 3"/>' +
        '<path d="M' + hx.toFixed(1) + ',' + hy.toFixed(1) + ' L' + A.x + ',' + A.y + '" stroke="url(#' + p + 'steel)" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M' + hx.toFixed(1) + ',' + hy.toFixed(1) + ' L' + B.x + ',' + B.y + '" stroke="url(#' + p + 'steel)" stroke-width="4" stroke-linecap="round"/>' +
        '<circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="5" fill="#b8901f" stroke="#5b4510"/>' +
        '<circle class="pl-pt" data-p="A" cx="' + A.x + '" cy="' + A.y + '" r="12" fill="#b45309" fill-opacity=".18" stroke="#b45309"/><circle cx="' + A.x + '" cy="' + A.y + '" r="2" fill="#1f2937"/>' +
        '<circle class="pl-pt" data-p="B" cx="' + B.x + '" cy="' + B.y + '" r="12" fill="#b45309" fill-opacity=".18" stroke="#b45309"/><circle cx="' + B.x + '" cy="' + B.y + '" r="2" fill="#1f2937"/>' +
        '<text x="' + (A.x - 14) + '" y="' + (A.y + 4) + '" class="pl-sl" text-anchor="end" font-size="10">A</text><text x="' + (B.x + 14) + '" y="' + (B.y + 4) + '" class="pl-sl" text-anchor="start" font-size="10">B</text>';
      var gy0 = clamp(my - d / 2, Y0, Y0 + Hc - d), gy1 = gy0 + d;
      gg.innerHTML = d <= Hc ? '<path d="M' + (X0 - 4) + ',' + gy0.toFixed(1) + ' L' + (X0 + 10) + ',' + gy0.toFixed(1) + ' M' + (X0 - 4) + ',' + gy1.toFixed(1) + ' L' + (X0 + 10) + ',' + gy1.toFixed(1) + ' M' + (X0 + 6) + ',' + gy0.toFixed(1) + ' L' + (X0 + 6) + ',' + gy1.toFixed(1) + '" stroke="#b45309" stroke-width="2"/>' : '';
      read.innerHTML = 'Distancia A–B: <b>' + nm.toFixed(1).replace('.', ',') + ' millas</b> (' + nm.toFixed(1).replace('.', ',') + "' de latitud) · A: " + latStr(A.y) + ' ' + lonStr(A.x);
    }
    var drag = null;
    svg.addEventListener('pointerdown', function(ev){
      var pt = svgPt(svg, ev), da = Math.hypot(pt.x - A.x, pt.y - A.y), db = Math.hypot(pt.x - B.x, pt.y - B.y);
      drag = da < db ? A : B; svg.setPointerCapture(ev.pointerId); move(ev);
    });
    function move(ev){ if (!drag) return; var pt = svgPt(svg, ev); drag.x = Math.round(clamp(pt.x, X0 + 4, X0 + Wc - 4)); drag.y = Math.round(clamp(pt.y, Y0 + 4, Y0 + Hc - 4)); draw(); }
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', function(){ drag = null; });
    svg.style.touchAction = 'none';
    draw();
  };

  /* =====================================================================
     11. COORDENADAS — latitud y longitud en el globo
     ===================================================================== */
  FIG.coordenadas = function(el){
    var f = frame(el, 'Latitud y longitud', '<b>Latitud</b>: desde el ecuador, N o S (0° a 90°). <b>Longitud</b>: desde el meridiano de <b>Greenwich</b>, E u O (0° a 180°). Valparaíso queda cerca de <b>33° S, 71,6° O</b>.', 'Diagrama');
    var p = uid(), R = 120, cx = 160, cy = 150, lon0 = -38 * D2R, lat0 = -8 * D2R;
    function proj(lat, lon){
      lat *= D2R; lon *= D2R;
      var x = Math.cos(lat) * Math.sin(lon - lon0);
      var y = Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * Math.cos(lat) * Math.cos(lon - lon0);
      var z = Math.sin(lat0) * Math.sin(lat) + Math.cos(lat0) * Math.cos(lat) * Math.cos(lon - lon0);
      return { x: cx + R * x, y: cy - R * y, v: z > 0 };
    }
    function line(pts, attrs){
      var d = '', on = false;
      pts.forEach(function(q){ if (q.v){ d += (on ? ' L' : ' M') + q.x.toFixed(1) + ',' + q.y.toFixed(1); on = true; } else on = false; });
      return d ? '<path d="' + d + '" ' + attrs + '/>' : '';
    }
    var s = '<svg viewBox="0 0 400 300" class="pl-svg" role="img" aria-label="Globo con ecuador, meridiano de Greenwich y la posición de Valparaíso"><defs>' +
      '<radialGradient id="' + p + 'oc" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#9fd6ee"/><stop offset=".6" stop-color="#2f86b5"/><stop offset="1" stop-color="#14466b"/></radialGradient></defs>' +
      '<rect width="400" height="300" fill="#f4f8fb"/>' +
      '<circle cx="' + cx + '" cy="' + (cy + 4) + '" r="' + R + '" fill="#0b2545" opacity=".15" filter="blur(4px)"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="url(#' + p + 'oc)"/>';
    var la, lo, pts;
    for (la = -75; la <= 75; la += 15){ pts = []; for (lo = -180; lo <= 180; lo += 4) pts.push(proj(la, lo)); s += line(pts, 'fill="none" stroke="#fff" stroke-opacity="' + (la === 0 ? 0 : 0.3) + '" stroke-width=".8"'); }
    for (lo = -180; lo < 180; lo += 15){ pts = []; for (la = -90; la <= 90; la += 3) pts.push(proj(la, lo)); s += line(pts, 'fill="none" stroke="#fff" stroke-opacity="' + (lo === 0 ? 0 : 0.3) + '" stroke-width=".8"'); }
    pts = []; for (lo = -180; lo <= 180; lo += 2) pts.push(proj(0, lo)); s += line(pts, 'fill="none" stroke="#f59e0b" stroke-width="2.6"');
    pts = []; for (la = -90; la <= 90; la += 2) pts.push(proj(la, 0)); s += line(pts, 'fill="none" stroke="#e11d48" stroke-width="2.6"');
    var VLAT = -33.05, VLON = -71.62;
    pts = []; for (lo = 0; lo >= VLON; lo -= 1) pts.push(proj(0, lo)); s += line(pts, 'fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-opacity=".9"');
    pts = []; for (la = 0; la >= VLAT; la -= 1) pts.push(proj(la, VLON)); s += line(pts, 'fill="none" stroke="#fde047" stroke-width="5" stroke-linecap="round"');
    var V = proj(VLAT, VLON), E = proj(0, VLON), G = proj(0, 0), NP = proj(90, 0);
    s += '<circle cx="' + V.x.toFixed(1) + '" cy="' + V.y.toFixed(1) + '" r="6" fill="#b91c1c" stroke="#fff" stroke-width="2"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#0b2545" stroke-width="1.2"/>' +
      '<circle cx="' + G.x.toFixed(1) + '" cy="' + G.y.toFixed(1) + '" r="3.5" fill="#fff" stroke="#e11d48" stroke-width="1.5"/>' +
      T(V.x - 10, V.y + 22, 'Valparaíso', { anchor: 'middle', size: 11 }) +
      T(V.x + 12, (E.y + V.y) / 2 + 4, 'latitud 33° S', { anchor: 'start', size: 10.5, fill: '#854d0e' }) +
      T((E.x + G.x) / 2, E.y - 8, 'longitud 71,6° O', { size: 10.5, fill: '#0b2545' }) +
      T(G.x + 6, G.y - 30, 'Greenwich 0°', { anchor: 'start', size: 10.5, fill: '#be123c' }) +
      T(cx + R + 6, cy + 14, 'ECUADOR 0°', { anchor: 'start', size: 10.5, fill: '#b45309' }) +
      T(NP.x, NP.y - 8, 'Polo Norte', { size: 10 }) +
      '<g transform="translate(286,250)"><text class="pl-sl" x="0" y="0" text-anchor="start" font-size="10">— meridianos (N–S)</text><text class="pl-sl" x="0" y="16" text-anchor="start" font-size="10">— paralelos (E–O)</text></g>' +
      '</svg>';
    f.stage.innerHTML = s;
  };

  /* =====================================================================
     12. FONDEO — filar 5 a 7 veces la profundidad
     ===================================================================== */
  FIG.fondeo = function(el){
    var f = frame(el, 'Fondeo: cuánto filar', 'Regla práctica del manual: filar <b>5 a 7 veces la profundidad</b>. Un ángulo bajo del cabo hace que el ancla "muerda" el fondo; si el ancla se arrastra, <b>garrea</b>.', 'Interactivo');
    var p = uid(), depth = 4;
    var rid = uid() + 'd';
    var range = document.createElement('div'); range.className = 'pl-range';
    range.innerHTML = '<label for="' + rid + '">Profundidad</label><input type="range" id="' + rid + '" min="2" max="12" step="1" value="4"><span class="pl-readout"></span>';
    f.ctrl.appendChild(range);
    var inp = range.querySelector('input'), out = range.querySelector('.pl-readout');
    function draw(){
      var surf = 70, sc = 150 / 12, bottom = surf + depth * sc, scope = 6 * depth, run = Math.sqrt(Math.max(1, scope * scope - depth * depth)) * sc;
      var bx = 70, ax = Math.min(380, bx + run * 0.95), ay = bottom;
      var s = '<svg viewBox="0 0 400 260" class="pl-svg" role="img" aria-label="Embarcación fondeada con el cabo filado"><defs>' +
        '<linearGradient id="' + p + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cb8d6"/><stop offset="1" stop-color="#1d5c7e"/></linearGradient>' +
        '<linearGradient id="' + p + 'sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9d39a"/><stop offset="1" stop-color="#c7a865"/></linearGradient>' +
        '<linearGradient id="' + p + 'hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c7d1d8"/></linearGradient></defs>' +
        '<rect width="400" height="260" fill="#eaf5fb"/>' +
        '<rect x="0" y="' + surf + '" width="400" height="' + (260 - surf) + '" fill="url(#' + p + 'w)"/>' +
        '<path d="M0,' + bottom + ' C80,' + (bottom - 3) + ' 160,' + (bottom + 3) + ' 260,' + (bottom - 2) + ' S360,' + (bottom + 2) + ' 400,' + bottom + ' L400,260 L0,260 Z" fill="url(#' + p + 'sand)"/>' +
        '<g fill="#b08d4a" opacity=".6">' + [30, 90, 150, 210, 270, 330].map(function(x, i){ return '<circle cx="' + x + '" cy="' + (bottom + 12 + (i % 2) * 8) + '" r="1.6"/>'; }).join('') + '</g>' +
        // boat (bow to the right, toward the anchor)
        '<path d="M28,' + (surf - 14) + ' L108,' + (surf - 16) + ' L96,' + (surf + 6) + ' L36,' + (surf + 6) + ' Z" fill="url(#' + p + 'hull)" stroke="#475569"/>' +
        '<path d="M48,' + (surf - 14) + ' L56,' + (surf - 28) + ' L80,' + (surf - 28) + ' L84,' + (surf - 15) + ' Z" fill="#1e3a5f"/>' +
        // rode: chain + rope catenary
        '<path d="M104,' + (surf - 8) + ' C' + (bx + run * 0.45) + ',' + (surf + depth * sc * 0.55) + ' ' + (ax - 40) + ',' + (ay - 1) + ' ' + ax + ',' + (ay - 2) + '" fill="none" stroke="#b08d4a" stroke-width="2.6"/>' +
        '<path d="M' + (ax - 50) + ',' + (ay - 2) + ' L' + ax + ',' + (ay - 2) + '" stroke="#4b5563" stroke-width="3" stroke-dasharray="3 1.5"/>' +
        // anchor
        '<g transform="translate(' + ax + ',' + (ay - 2) + ')"><path d="M0,0 L14,0 M14,-6 L14,6 M14,0 C22,0 24,6 26,10 M14,0 C22,0 24,-6 26,-2" stroke="#374151" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>' +
        // depth dim
        dimV(150, surf, bottom, 'p = ' + depth + ' m', 1, '#0b2545') +
        T(Math.min(330, (104 + ax) / 2 + 20), surf + depth * sc * 0.25 + 28, 'filar ' + 5 * depth + '–' + 7 * depth + ' m', { size: 12, fill: '#854d0e' }) +
        T(Math.max(60, ax - 70), Math.min(250, bottom + 26), 'buen tenedero: arena o fango', { size: 10 }) +
        '</svg>';
      f.stage.innerHTML = s;
      out.textContent = depth + ' m → filar ' + 5 * depth + ' a ' + 7 * depth + ' m';
    }
    inp.addEventListener('input', function(){ depth = +inp.value; draw(); });
    draw();
  };

  /* =====================================================================
     13. MOVIMIENTOS — balance, cabeceo y escora
     ===================================================================== */
  FIG.movimientos = function(el){
    var f = frame(el, 'Balance, cabeceo y escora', '<b>Balance</b>: de banda a banda (olas de costado). <b>Cabeceo</b>: de proa a popa (olas de proa o popa). <b>Escora</b>: inclinación a una banda; <b>adrizar</b> es enderezarla.', 'Animación');
    var p = uid();
    var defs = '<defs><linearGradient id="' + p + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c3ced6"/></linearGradient>' +
      '<linearGradient id="' + p + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb3d0"/><stop offset="1" stop-color="#1f6f96"/></linearGradient></defs>';
    var stern = '<path d="M-34,-6 L34,-6 L28,16 Q0,26 -28,16 Z" fill="url(#' + p + 'h)" stroke="#475569"/><path d="M-14,-6 L-12,-24 L12,-24 L14,-6 Z" fill="#1e3a5f"/><path d="M-34,-6 L34,-6" stroke="#0b2545" stroke-width="3"/>';
    var side = '<path d="M-52,-8 L50,-10 L40,10 L-46,10 Z" fill="url(#' + p + 'h)" stroke="#475569"/><path d="M-20,-9 L-14,-24 L8,-24 L12,-10 Z" fill="#1e3a5f"/>';
    var panels = [['Balance', stern, 'bal'], ['Cabeceo', side, 'cab'], ['Escora', stern, 'esc']];
    f.stage.innerHTML = '<svg viewBox="0 0 400 150" class="pl-svg" role="img" aria-label="Balance, cabeceo y escora">' + defs + '<rect width="400" height="150" fill="#eef6fa"/>' +
      panels.map(function(q, i){ var x = 68 + i * 132; return '<g><rect x="' + (x - 62) + '" y="8" width="124" height="134" rx="12" fill="#fff" stroke="#dbe5ec"/>' +
        '<path class="pl-mv-sea" data-i="' + i + '" d="" fill="url(#' + p + 'w)"/>' +
        '<g class="pl-mv-boat" data-i="' + i + '" transform="translate(' + x + ',86)"><g transform="scale(1.25)">' + q[1] + '</g></g>' +
        (q[2] === 'esc' ? '<path d="M' + (x - 50) + ',38 L' + (x - 20) + ',38" stroke="#1e3a8a" stroke-width="2.5"/><path d="M' + (x - 18) + ',38 l-7,-4 v8 z" fill="#1e3a8a"/><text x="' + (x - 40) + '" y="32" class="pl-sl" font-size="9">viento</text>' : '') +
        '<text x="' + x + '" y="132" class="pl-sl" text-anchor="middle" font-size="12">' + q[0] + '</text></g>'; }).join('') + '</svg>';
    var seas = f.stage.querySelectorAll('.pl-mv-sea'), boats = f.stage.querySelectorAll('.pl-mv-boat');
    addAnim(f.stage, function(t){
      for (var i = 0; i < 3; i++){
        var x = 68 + i * 132, d = 'M' + (x - 62) + ',142 ';
        for (var xx = -62; xx <= 62; xx += 4){
          var ph = i === 0 ? xx / 22 - t * 2 : i === 1 ? xx / 28 - t * 2 : xx / 30;
          var amp = i === 2 ? 1.5 : 6;
          d += 'L' + (x + xx) + ',' + (92 + Math.sin(ph) * amp).toFixed(1) + ' ';
        }
        d += 'L' + (x + 62) + ',142 Z';
        seas[i].setAttribute('d', d);
        var ang = i === 0 ? Math.sin(t * 2 + 1.2) * 14 : i === 1 ? Math.sin(t * 2 + 1.8) * 9 : 16;
        var bob = i === 2 ? 0 : Math.sin(t * 2) * 2;
        boats[i].setAttribute('transform', 'translate(' + x + ',' + (88 + bob).toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
      }
      return !REDUCED;
    });
  };

  /* =====================================================================
     14. ESTRUCTURA — esqueleto y sección
     ===================================================================== */
  FIG.estructura = function(el){
    var f = frame(el, 'Estructura del casco', 'La <b>quilla</b> es la columna; las <b>cuadernas</b>, las costillas; los <b>baos</b> sostienen la cubierta y los <b>mamparos</b> dividen el interior.', 'Diagrama');
    var p = uid();
    var s = '<svg viewBox="0 0 400 344" class="pl-svg" role="img" aria-label="Esqueleto del casco de perfil y sección transversal"><defs>' +
      '<linearGradient id="' + p + 'wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6a66a"/><stop offset="1" stop-color="#9a6a33"/></linearGradient>' +
      '<linearGradient id="' + p + 'shell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a7b4be"/><stop offset=".5" stop-color="#eef2f5"/><stop offset="1" stop-color="#a7b4be"/></linearGradient></defs>' +
      '<rect width="400" height="344" fill="#f6fafc"/>' +
      '<text x="12" y="20" class="pl-sl" text-anchor="start" font-size="11" fill="#0e7490">Esqueleto (de costado) · proa →</text>';
    // longitudinal skeleton: keel y=150 from x=50..320, stem (roda) up to (372,52), sternpost (codaste) at x=50 up to 62
    var sheer = function(x){ return 62 - (x - 50) / 322 * 10; };
    s += '<path d="M50,150 L320,150 C344,148 360,112 372,52" fill="none" stroke="url(#' + p + 'wood)" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M50,150 L44,60" stroke="url(#' + p + 'wood)" stroke-width="8" stroke-linecap="round"/>';
    for (var i = 0; i < 11; i++){
      var x = 72 + i * 24, top = sheer(x), bot = 150;
      if (x > 300) bot = 150 - (x - 300) * 1.4;
      s += '<path d="M' + x + ',' + bot + ' C' + (x - 5) + ',' + (bot - 34) + ' ' + (x - 3) + ',' + (top + 24) + ' ' + x + ',' + top + '" fill="none" stroke="#b07a40" stroke-width="3.2"/>';
    }
    s += '<path d="M44,62 L372,52" stroke="#8a5a2a" stroke-width="3.4"/>' +
      '<rect x="185" y="60" width="7" height="88" fill="#64748b" opacity=".85"/>' +
      T(180, 172, 'quilla', { size: 11.5 }) + T(372, 40, 'roda', { size: 11.5 }) + T(44, 48, 'codaste', { size: 11.5 }) +
      T(112, 40, 'cuadernas', { size: 11.5 }) + leader(112, 44, 120, 80) + T(250, 40, 'mamparo', { size: 11.5 }) + leader(244, 44, 192, 84) + T(300, 72, 'cubierta', { anchor: 'start', size: 10 });
    // cross-section
    s += '<text x="12" y="200" class="pl-sl" text-anchor="start" font-size="11" fill="#0e7490">Sección transversal</text>' +
      '<g transform="translate(200,262) scale(.82)">' +
      '<path d="M-90,-62 C-90,0 -64,46 0,66 C64,46 90,0 90,-62" fill="none" stroke="url(#' + p + 'shell)" stroke-width="10"/>' +
      '<path d="M-82,-62 C-82,0 -58,40 0,58 C58,40 82,0 82,-62" fill="none" stroke="#b07a40" stroke-width="5"/>' +
      '<path d="M-96,-66 L96,-66" stroke="#c99a62" stroke-width="8"/><path d="M-82,-56 L82,-56" stroke="#8a5a2a" stroke-width="5"/>' +
      '<rect x="-11" y="58" width="22" height="20" rx="2" fill="url(#' + p + 'wood)"/>' +
      '<path d="M-48,34 Q0,52 48,34" fill="#5fb3d0" opacity=".35"/>' +
      '</g>' +
      T(200, 340, 'quilla', { size: 11 }) + T(200, 200, 'cubierta', { size: 11 }) + T(200, 228, 'bao', { size: 11 }) + leader(200, 232, 200, 216) +
      T(104, 246, 'cuaderna', { anchor: 'end', size: 11 }) + leader(106, 244, 134, 244) + T(296, 246, 'casco (forro)', { anchor: 'start', size: 11 }) + leader(294, 244, 274, 244) +
      T(200, 294, 'sentina', { size: 10, fill: '#0e7490' }) + '</svg>';
    f.stage.innerHTML = s;
  };

  /* =====================================================================
     15. ÁREAS NÁUTICO-DEPORTIVAS DE UNA PLAYA
     ===================================================================== */
  FIG.playa = function(el){
    var f = frame(el, 'Áreas de una playa', 'Desde la orilla: bañistas hasta 100 m; remo y vela de 100 a 200 m; motor y vela más allá de 200 m. Hacia y desde la playa, por el canal delimitado y a <b>mínima velocidad</b>.', 'Diagrama');
    var p = uid();
    var s = '<svg viewBox="0 0 400 300" class="pl-svg" role="img" aria-label="Zonas de una playa: bañistas, remo y vela, motor y vela"><defs>' +
      '<linearGradient id="' + p + 'sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f6f96"/><stop offset=".7" stop-color="#4aa3c8"/><stop offset="1" stop-color="#8fd3e6"/></linearGradient>' +
      '<linearGradient id="' + p + 'sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4e2b0"/><stop offset="1" stop-color="#e2c486"/></linearGradient>' +
      '<linearGradient id="' + p + 'hull" x1="0" x2="1"><stop offset="0" stop-color="#a7b4be"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#97a5b0"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#' + p + 'sea)"/>' +
      '<rect x="0" y="246" width="400" height="54" fill="url(#' + p + 'sand)"/><path d="M0,246 q20,-4 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t40,0" fill="none" stroke="#fff" stroke-width="2.5" stroke-opacity=".85"/>' +
      '<rect x="0" y="166" width="400" height="80" fill="#fff" opacity=".10"/><rect x="0" y="86" width="400" height="80" fill="#fff" opacity=".05"/>';
    [166, 86].forEach(function(y){ s += '<path d="M0,' + y + ' H400" stroke="#fde047" stroke-width="1.6" stroke-dasharray="8 6"/>'; for (var x = 12; x < 400; x += 40) s += '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#fde047" stroke="#a16207" stroke-width=".8"/>'; });
    // access channel
    s += '<path d="M292,246 V40 M332,246 V40" stroke="#fff" stroke-width="1.4" stroke-dasharray="3 5"/>';
    for (var y = 60; y < 246; y += 30){ s += '<circle cx="292" cy="' + y + '" r="2.6" fill="#fff"/><circle cx="332" cy="' + y + '" r="2.6" fill="#fff"/>'; }
    s += '<g transform="translate(312,198)"><path d="M0,-14 C4,-10 5,-4 5,2 L4.7,10 L-4.7,10 L-5,2 C-5,-4 -4,-10 0,-14 Z" fill="url(#' + p + 'hull)" stroke="#334155"/><rect x="-2.6" y="-3" width="5.2" height="5" rx="1" fill="#1e3a5f"/></g>' +
      '<path d="M312,210 L308,226 M312,210 L316,226" stroke="#fff" stroke-opacity=".7"/>' +
      T(312, 34, 'canal de acceso', { size: 10 }) + T(312, 46, 'mínima velocidad', { size: 9, fill: '#b45309' });
    // swimmers
    [[40, 224], [70, 214], [110, 230], [150, 220], [200, 228], [236, 212]].forEach(function(q){ s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.4" fill="#f2c9a0" stroke="#7c5a3a" stroke-width=".7"/><path d="M' + (q[0] - 6) + ',' + (q[1] + 4) + ' q6,-3 12,0" stroke="#fff" fill="none"/>'; });
    // kayak + dinghy
    s += '<g transform="translate(90,128) rotate(-20)"><ellipse rx="16" ry="3.4" fill="#f97316" stroke="#7c2d12" stroke-width=".7"/><path d="M-10,-6 L10,6" stroke="#1f2937" stroke-width="1.4"/></g>' +
      '<g transform="translate(190,120)"><path d="M-9,4 L9,4 L6,9 L-6,9 Z" fill="#fff" stroke="#334155" stroke-width=".7"/><path d="M0,4 L0,-18 L12,2 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width=".7"/></g>' +
      // motor boat + sail
      '<g transform="translate(110,52) rotate(80)"><path d="M0,-16 C5,-12 6,-4 6,2 L5.7,12 L-5.7,12 L-6,2 C-6,-4 -5,-12 0,-16 Z" fill="url(#' + p + 'hull)" stroke="#334155"/><rect x="-3" y="-4" width="6" height="6" rx="1" fill="#1e3a5f"/></g>' +
      '<path d="M90,55 L60,62 M90,49 L60,42" stroke="#fff" stroke-opacity=".6"/>' +
      '<g transform="translate(220,44)"><path d="M-12,6 L12,6 L8,12 L-8,12 Z" fill="#fff" stroke="#334155" stroke-width=".7"/><path d="M0,6 L0,-24 L16,4 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width=".7"/><path d="M-1,-20 L-12,4 L-1,4 Z" fill="#eef2f6" stroke="#94a3b8" stroke-width=".7"/></g>' +
      // labels
      T(140, 206, 'BAÑISTAS · 0 a 100 m', { size: 11.5 }) + T(140, 102, 'REMO Y VELA · 100 a 200 m', { size: 11.5 }) + T(140, 22, 'MOTOR Y VELA · más de 200 m', { size: 11.5, cls: 'pl-sl-w' }) +
      T(380, 170, '100 m', { anchor: 'end', size: 10 }) + T(380, 90, '200 m', { anchor: 'end', size: 10 }) + T(60, 276, 'ORILLA', { size: 11 }) +
      '</svg>';
    f.stage.innerHTML = s;
  };

  /* =====================================================================
     16. MOTOR DE 4 TIEMPOS — ciclo animado
     ===================================================================== */
  FIG.cuatro = function(el){
    var f = frame(el, 'Ciclo de 4 tiempos', 'Dos vueltas del cigüeñal = un ciclo: <b>admisión → compresión → combustión → escape</b>. El de <b>2 tiempos</b> hace lo mismo en una sola vuelta (dos carreras).', 'Animación');
    var p = uid(), playing = !REDUCED, ang = 30;
    var PH = [['1. Admisión', 'Baja el pistón; abre la válvula de admisión y entra la mezcla.', '#60a5fa'], ['2. Compresión', 'Sube el pistón con las válvulas cerradas y comprime la mezcla.', '#3b82f6'], ['3. Combustión', 'Salta la chispa de la bujía: la explosión empuja el pistón hacia abajo.', '#f97316'], ['4. Escape', 'Sube el pistón; abre la válvula de escape y salen los gases.', '#9ca3af']];
    f.stage.innerHTML = '<div class="pl-eng"><svg viewBox="0 0 240 280" class="pl-svg" role="img" aria-label="Pistón, biela, cigüeñal y válvulas de un motor de 4 tiempos"><defs>' +
      '<linearGradient id="' + p + 'm" x1="0" x2="1"><stop offset="0" stop-color="#6b7280"/><stop offset=".45" stop-color="#e5e7eb"/><stop offset="1" stop-color="#4b5563"/></linearGradient>' +
      '<linearGradient id="' + p + 'blk" x1="0" x2="1"><stop offset="0" stop-color="#9aa3ad"/><stop offset=".5" stop-color="#cfd6dd"/><stop offset="1" stop-color="#8b949e"/></linearGradient></defs>' +
      '<rect width="240" height="280" fill="#f6fafc"/>' +
      '<path d="M60,40 L180,40 L180,168 L164,168 L164,58 L76,58 L76,168 L60,168 Z" fill="url(#' + p + 'blk)" stroke="#4b5563"/>' +
      '<path d="M40,26 L200,26 L200,46 L40,46 Z" fill="#8b949e" stroke="#4b5563"/>' +
      '<rect class="e-gas" x="76" y="58" width="88" height="40" fill="#60a5fa" opacity=".5"/>' +
      '<path d="M40,30 L86,30 L86,40" fill="none" stroke="#3b82f6" stroke-width="7" opacity=".55"/><path d="M200,30 L154,30 L154,40" fill="none" stroke="#9ca3af" stroke-width="7" opacity=".7"/>' +
      '<g class="e-vi"><path d="M94,8 L94,50" stroke="#4b5563" stroke-width="3"/><path d="M84,50 L104,50 L100,56 L88,56 Z" fill="url(#' + p + 'm)"/></g>' +
      '<g class="e-ve"><path d="M146,8 L146,50" stroke="#4b5563" stroke-width="3"/><path d="M136,50 L156,50 L152,56 L140,56 Z" fill="url(#' + p + 'm)"/></g>' +
      '<g><rect x="115" y="10" width="10" height="44" rx="2" fill="#f8fafc" stroke="#64748b"/><path d="M120,54 v5" stroke="#374151" stroke-width="2"/><circle class="e-spark" cx="120" cy="62" r="7" fill="#fde047" opacity="0"/></g>' +
      '<path class="e-rod" d="" stroke="url(#' + p + 'm)" stroke-width="12" stroke-linecap="round"/>' +
      '<g class="e-pis"><rect x="78" y="0" width="84" height="38" rx="4" fill="url(#' + p + 'm)" stroke="#4b5563"/><path d="M78,8 H162 M78,14 H162" stroke="#4b5563" stroke-width="1"/><circle cx="120" cy="24" r="5" fill="#4b5563"/></g>' +
      '<circle cx="120" cy="222" r="40" fill="#e5e7eb" stroke="#9aa3ad"/>' +
      '<g class="e-crank"><path d="M120,222 L120,190" stroke="#4b5563" stroke-width="18" stroke-linecap="round"/><circle cx="120" cy="222" r="10" fill="#374151"/><path d="M104,236 a22,22 0 0 0 32,0 L128,226 L112,226 Z" fill="#6b7280"/></g>' +
      T(24, 22, 'admisión', { anchor: 'start', size: 9.5, fill: '#1d4ed8' }) + T(216, 22, 'escape', { anchor: 'end', size: 9.5, fill: '#4b5563' }) +
      T(134, 14, 'bujía', { anchor: 'start', size: 9 }) + T(200, 120, 'pistón', { anchor: 'start', size: 10 }) + T(200, 178, 'biela', { anchor: 'start', size: 10 }) + T(176, 252, 'cigüeñal', { anchor: 'start', size: 10 }) +
      '</svg><div class="pl-eng-ph"></div></div>';
    var q = function(c){ return f.stage.querySelector(c); };
    var pis = q('.e-pis'), rod = q('.e-rod'), crank = q('.e-crank'), vi = q('.e-vi'), ve = q('.e-ve'), gas = q('.e-gas'), spark = q('.e-spark'), ph = q('.pl-eng-ph');
    var segsW = segs(f.ctrl, PH.map(function(x){ return x[0]; }), function(i){ ang = i * 180 + 90; playing = false; setB(); draw(); }, -1, 'Fase');
    var pb = btn(f.ctrl, '', function(){ playing = !playing; setB(); resume(an); });
    function setB(){ pb.textContent = playing ? '❚❚ Pausa' : '▶ Animar'; }
    setB();
    var lastPh = -1;
    function draw(){
      var a = ang * D2R, r = 32, L = 96, cx = 120, cy = 222;
      var px = cx + r * Math.sin(a), py = cy - r * Math.cos(a);
      var pinY = py - Math.sqrt(L * L - Math.pow(px - cx, 2));
      pis.setAttribute('transform', 'translate(0,' + (pinY - 24).toFixed(1) + ')');
      rod.setAttribute('d', 'M120,' + pinY.toFixed(1) + ' L' + px.toFixed(1) + ',' + py.toFixed(1));
      crank.setAttribute('transform', 'rotate(' + (ang % 360).toFixed(1) + ' 120 222)');
      var cyc = ((ang % 720) + 720) % 720, k = Math.floor(cyc / 180);
      var top = pinY - 24;
      gas.setAttribute('y', 58); gas.setAttribute('height', Math.max(2, top - 58).toFixed(1));
      gas.setAttribute('fill', PH[k][2]); gas.setAttribute('opacity', k === 2 ? 0.75 : 0.45);
      var u = (cyc % 180) / 180, lift = Math.sin(u * Math.PI) * 8;
      vi.setAttribute('transform', 'translate(0,' + (k === 0 ? lift : 0).toFixed(1) + ')');
      ve.setAttribute('transform', 'translate(0,' + (k === 3 ? lift : 0).toFixed(1) + ')');
      spark.setAttribute('opacity', k === 2 && u < 0.15 ? (1 - u / 0.15).toFixed(2) : 0);
      if (k !== lastPh){ lastPh = k; ph.innerHTML = '<b style="color:' + PH[k][2] + '">' + PH[k][0] + '</b><span>' + PH[k][1] + '</span>'; segsW.querySelectorAll('.pl-seg-b').forEach(function(b, j){ b.classList.toggle('on', j === k); }); }
    }
    var an = addAnim(f.stage, function(t, dt){ if (playing) ang += dt * 110; draw(); return playing; });
    draw();
  };

  /* =====================================================================
     17. MOTOR FUERABORDA — partes y chequeos
     ===================================================================== */
  FIG.fueraborda = function(el){
    var f = frame(el, 'Motor fuera de borda', 'Si deja de salir el <b>chorro testigo</b>, la bomba no está refrigerando: apaga el motor.', 'Diagrama');
    var p = uid();
    var s = '<svg viewBox="0 0 400 330" class="pl-svg" role="img" aria-label="Partes de un motor fuera de borda"><defs>' +
      '<linearGradient id="' + p + 'cw" x1="0" x2="1"><stop offset="0" stop-color="#111827"/><stop offset=".4" stop-color="#4b5563"/><stop offset=".6" stop-color="#374151"/><stop offset="1" stop-color="#0b0f14"/></linearGradient>' +
      '<linearGradient id="' + p + 'leg" x1="0" x2="1"><stop offset="0" stop-color="#1f2937"/><stop offset=".5" stop-color="#6b7280"/><stop offset="1" stop-color="#111827"/></linearGradient>' +
      '<linearGradient id="' + p + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6cb8d6" stop-opacity=".85"/><stop offset="1" stop-color="#1d5c7e"/></linearGradient>' +
      '<linearGradient id="' + p + 'hull" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c7d1d8"/><stop offset="1" stop-color="#fff"/></linearGradient>' +
      '<linearGradient id="' + p + 'zn" x1="0" x2="1"><stop offset="0" stop-color="#9ca3af"/><stop offset=".5" stop-color="#f3f4f6"/><stop offset="1" stop-color="#9ca3af"/></linearGradient></defs>' +
      '<rect width="400" height="330" fill="#eef6fa"/><rect x="0" y="196" width="400" height="134" fill="url(#' + p + 'w)"/>' +
      // boat stern (transom) on the right
      '<path d="M236,92 L400,92 L400,232 L262,232 C250,228 240,210 236,196 Z" fill="url(#' + p + 'hull)" stroke="#64748b"/>' +
      '<path d="M236,92 L246,92 L246,214" fill="none" stroke="#94a3b8" stroke-width="2"/>' +
      // fuel tank with vent + hose + primer bulb
      '<rect x="318" y="58" width="66" height="34" rx="6" fill="#dc2626" stroke="#7f1d1d"/><rect x="330" y="52" width="10" height="8" rx="2" fill="#111"/><circle cx="364" cy="56" r="3" fill="#111"/>' +
      '<path d="M330,60 C300,40 250,40 214,70" fill="none" stroke="#111" stroke-width="3"/><ellipse cx="270" cy="47" rx="10" ry="6" fill="#111"/>' +
      // clamp + cowling + leg
      '<rect x="222" y="86" width="22" height="30" rx="4" fill="#374151"/><circle cx="233" cy="96" r="3.5" fill="#cbd5e1"/><circle cx="233" cy="108" r="3.5" fill="#cbd5e1"/>' +
      '<path d="M140,50 C140,30 156,22 186,22 L222,24 C236,26 240,40 238,62 L232,104 L150,104 C142,90 140,70 140,50 Z" fill="url(#' + p + 'cw)"/>' +
      '<path d="M150,40 C170,32 210,32 226,40" stroke="#9ca3af" stroke-width="2" fill="none" opacity=".7"/>' +
      '<rect x="166" y="104" width="52" height="16" fill="#1f2937"/>' +
      '<path d="M176,120 L208,120 L206,226 L180,226 Z" fill="url(#' + p + 'leg)"/>' +
      '<path d="M156,226 L230,226 L226,236 L160,236 Z" fill="#374151"/>' +
      '<path d="M166,236 L224,236 C232,240 234,252 224,258 L170,258 C160,252 160,242 166,236 Z" fill="url(#' + p + 'leg)"/>' +
      '<path d="M190,258 L198,258 L196,282 L190,286 Z" fill="#1f2937"/>' +
      '<g fill="#111"><path d="M168,240 h6 v12 h-6z M178,240 h6 v12 h-6z" opacity=".55"/></g>' +
      '<rect x="160" y="228" width="12" height="7" rx="2" fill="url(#' + p + 'zn)"/>' +
      // propeller
      '<g transform="translate(152,248)"><ellipse cx="0" cy="-16" rx="5" ry="14" fill="#9ca3af" stroke="#374151"/><ellipse cx="0" cy="16" rx="5" ry="14" fill="#6b7280" stroke="#374151"/><rect x="-2" y="-4" width="14" height="8" fill="#374151"/></g>' +
      // tiller, shift lever, start rope, kill cord
      '<path d="M222,96 L300,124" stroke="#111" stroke-width="6" stroke-linecap="round"/><path d="M300,124 L322,132" stroke="#374151" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M224,80 L246,66" stroke="#b91c1c" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M150,64 C132,66 128,74 132,84" stroke="#e5e7eb" stroke-width="2" fill="none"/><rect x="124" y="82" width="14" height="6" rx="3" fill="#111"/>' +
      '<path d="M200,98 C214,118 232,130 262,126" stroke="#dc2626" stroke-width="1.6" fill="none" stroke-dasharray="3 2"/>' +
      // tell-tale water jet
      '<path class="pl-jet" d="M150,112 C136,118 128,130 124,150" stroke="#38bdf8" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="6 5"/>' +
      // labels
      T(186, 14, 'capot', { size: 10.5 }) + T(118, 108, 'chorro', { anchor: 'end', size: 10.5, fill: '#0369a1' }) + T(118, 120, 'testigo', { anchor: 'end', size: 10.5, fill: '#0369a1' }) +
      T(112, 76, 'piola de', { anchor: 'end', size: 9.5 }) + T(112, 86, 'arranque', { anchor: 'end', size: 9.5 }) +
      T(270, 34, 'pera de cebado', { size: 9.5 }) + T(350, 108, 'estanque', { size: 9.5 }) + T(394, 44, 'respiradero', { anchor: 'end', size: 9 }) +
      T(330, 152, 'caña / acelerador', { size: 9.5 }) + T(252, 70, 'palanca de cambios', { anchor: 'start', size: 9.5, fill: '#b91c1c' }) +
      T(266, 128, 'corta-corriente', { anchor: 'start', size: 9, fill: '#b91c1c' }) + T(262, 196, 'trincado al espejo', { anchor: 'start', size: 9 }) + leader(260, 192, 240, 112) +
      T(110, 160, 'pata', { anchor: 'end', size: 10.5 }) + leader(112, 158, 180, 170) +
      T(120, 300, 'hélice', { size: 10.5 }) + leader(132, 294, 150, 268) +
      T(214, 300, 'toma de agua', { size: 10.5 }) + leader(206, 294, 180, 250) +
      T(310, 262, 'ánodo de zinc', { size: 10.5 }) + leader(266, 262, 172, 232) +
      '</svg>';
    f.stage.innerHTML = s;
    var jet = f.stage.querySelector('.pl-jet');
    addAnim(f.stage, function(t){ jet.setAttribute('stroke-dashoffset', (-t * 40).toFixed(1)); return !REDUCED; });
  };
  FIG.tercio = function(el){
    var f = frame(el, 'Regla del tercio', 'Planifica el combustible: <b>⅓ para ir, ⅓ para volver y ⅓ de reserva</b> ante viento, corriente o imprevistos.', 'Diagrama');
    var s = '<svg viewBox="0 0 400 120" class="pl-svg" role="img" aria-label="Un tercio para ir, un tercio para volver y un tercio de reserva">' +
      '<rect width="400" height="120" fill="#f6fafc"/>' +
      '<rect x="30" y="34" width="340" height="44" rx="12" fill="#e2e8f0" stroke="#94a3b8"/>' +
      '<rect x="34" y="38" width="108" height="36" rx="9" fill="#0e7490"/><rect x="146" y="38" width="108" height="36" rx="9" fill="#1d4ed8"/><rect x="258" y="38" width="108" height="36" rx="9" fill="#b45309"/>' +
      '<text x="88" y="61" text-anchor="middle" fill="#fff" font-weight="900" font-size="13" font-family="Nunito,sans-serif">⅓ IDA</text>' +
      '<text x="200" y="61" text-anchor="middle" fill="#fff" font-weight="900" font-size="13" font-family="Nunito,sans-serif">⅓ VUELTA</text>' +
      '<text x="312" y="61" text-anchor="middle" fill="#fff" font-weight="900" font-size="13" font-family="Nunito,sans-serif">⅓ RESERVA</text>' +
      T(30, 24, 'estanque lleno', { anchor: 'start', size: 10 }) + T(370, 24, 'vacío', { anchor: 'end', size: 10 }) +
      T(200, 104, 'Nunca planees usar la reserva', { size: 11, fill: '#b45309' }) + '</svg>';
    f.stage.innerHTML = s;
  };

  /* =====================================================================
     18. METEOROLOGÍA — brisas, nubes, olas y mareas
     ===================================================================== */
  FIG.brisas = function(el){
    var f = frame(el, 'Virazón y terral', 'De <b>día</b> la tierra se calienta más rápido: el aire sube sobre ella y entra brisa del mar (<b>virazón</b>). De <b>noche</b> la tierra se enfría antes y la brisa va de tierra al mar (<b>terral</b>).', 'Animación');
    var p = uid(), night = 0;
    f.stage.innerHTML = '<svg viewBox="0 0 400 220" class="pl-svg" role="img" aria-label="Circulación de la brisa de mar y de tierra"><defs>' +
      '<linearGradient id="' + p + 'd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4ec"/><stop offset="1" stop-color="#dff1fb"/></linearGradient>' +
      '<linearGradient id="' + p + 'n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a33"/><stop offset="1" stop-color="#2a3f63"/></linearGradient>' +
      '<marker id="' + p + 'a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#fff"/></marker></defs>' +
      '<rect class="b-sky" width="400" height="220" fill="url(#' + p + 'd)"/>' +
      '<g class="b-sun"></g>' +
      '<path d="M0,160 L200,160 L200,220 L0,220 Z" fill="#2f86a8"/><path d="M0,162 q10,-3 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0" fill="none" stroke="#fff" stroke-opacity=".5"/>' +
      '<path d="M200,160 C230,150 260,148 300,140 C330,134 360,128 400,124 L400,220 L200,220 Z" fill="#a3b86c"/><path d="M200,160 C230,150 260,148 300,140" fill="none" stroke="#e8dcb5" stroke-width="5"/>' +
      '<g class="b-flow"><path class="b-low" d="" fill="none" stroke="#fff" stroke-width="3" marker-end="url(#' + p + 'a)" stroke-dasharray="10 8"/>' +
      '<path class="b-up" d="" fill="none" stroke="#fff" stroke-width="2" stroke-opacity=".7" marker-end="url(#' + p + 'a)" stroke-dasharray="6 8"/>' +
      '<path class="b-high" d="" fill="none" stroke="#fff" stroke-width="2" stroke-opacity=".7" marker-end="url(#' + p + 'a)" stroke-dasharray="6 8"/>' +
      '<path class="b-down" d="" fill="none" stroke="#fff" stroke-width="2" stroke-opacity=".7" marker-end="url(#' + p + 'a)" stroke-dasharray="6 8"/></g>' +
      '<text class="b-t1 pl-sl" x="100" y="196" text-anchor="middle"></text><text class="b-t2 pl-sl" x="300" y="196" text-anchor="middle"></text><text class="b-t3 pl-sl" x="200" y="150" text-anchor="middle" font-size="13"></text></svg>';
    var q = function(c){ return f.stage.querySelector(c); };
    function set(){
      q('.b-sky').setAttribute('fill', 'url(#' + p + (night ? 'n' : 'd') + ')');
      q('.b-sun').innerHTML = night ? '<circle cx="330" cy="40" r="14" fill="#f1f5f9"/><circle cx="336" cy="36" r="12" fill="#1c2e4d"/>' : '<circle cx="330" cy="40" r="18" fill="#fde047"/><circle cx="330" cy="40" r="28" fill="#fde047" opacity=".25"/>';
      var low = night ? 'M300,128 C250,140 180,150 90,148' : 'M90,148 C180,150 250,140 300,128';
      var up = night ? 'M90,140 C80,120 80,90 90,70' : 'M310,120 C320,100 320,80 310,60';
      var high = night ? 'M100,60 C170,48 240,48 300,56' : 'M300,56 C240,48 170,48 100,60';
      var down = night ? 'M310,64 C320,84 320,104 310,118' : 'M90,70 C80,90 80,120 90,138';
      q('.b-low').setAttribute('d', low); q('.b-up').setAttribute('d', up); q('.b-high').setAttribute('d', high); q('.b-down').setAttribute('d', down);
      q('.b-t1').textContent = night ? 'mar más tibio' : 'mar más fresco';
      q('.b-t2').textContent = night ? 'tierra más fría' : 'tierra más caliente';
      q('.b-t3').textContent = night ? 'TERRAL (tierra → mar)' : 'VIRAZÓN (mar → tierra)';
      q('.b-t3').setAttribute('class', 'b-t3 pl-sl' + (night ? ' pl-sl-w' : ''));
    }
    segs(f.ctrl, ['☀️ Día', '🌙 Noche'], function(i){ night = i; set(); }, 0, 'Momento');
    set();
    var flows = f.stage.querySelectorAll('.b-flow path');
    addAnim(f.stage, function(t){ flows.forEach(function(pth){ pth.setAttribute('stroke-dashoffset', (-t * 30).toFixed(1)); }); return !REDUCED; });
  };
  FIG.nubes = function(el){
    var f = frame(el, 'Tipos de nubes', '<b>Cirros</b>: altos, de hielo, en filamentos. <b>Cúmulos</b>: blancos, como algodón. <b>Estratos</b>: bajos y grises, como una sábana. <b>Nimbos</b>: grises oscuros, dan lluvia.', 'Diagrama');
    var p = uid();
    function puff(x, y, s, col, op){ var o = ''; [[0, 0, 1], [-0.8, 0.25, 0.75], [0.85, 0.2, 0.8], [-0.35, -0.45, 0.8], [0.45, -0.4, 0.7], [0, 0.35, 0.9]].forEach(function(b){ o += '<ellipse cx="' + (x + b[0] * s * 22) + '" cy="' + (y + b[1] * s * 18) + '" rx="' + (b[2] * s * 22) + '" ry="' + (b[2] * s * 17) + '" fill="' + col + '" opacity="' + (op || 1) + '"/>'; }); return o; }
    var s = '<svg viewBox="0 0 400 260" class="pl-svg" role="img" aria-label="Cirros altos, cúmulos, estratos bajos y nimbos con lluvia"><defs>' +
      '<linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9bd1"/><stop offset="1" stop-color="#d8edf8"/></linearGradient>' +
      '<filter id="' + p + 'bl"><feGaussianBlur stdDeviation="2.2"/></filter><filter id="' + p + 'bl2"><feGaussianBlur stdDeviation="1"/></filter>' +
      '<radialGradient id="' + p + 'cu" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef3f7"/><stop offset="1" stop-color="#b9c6d2"/></radialGradient>' +
      '<radialGradient id="' + p + 'nb" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#8b95a1"/><stop offset="1" stop-color="#3c444e"/></radialGradient></defs>' +
      '<rect width="400" height="260" fill="url(#' + p + 'sky)"/>' +
      '<g filter="url(#' + p + 'bl2)" stroke="#fff" stroke-linecap="round" fill="none" opacity=".9"><path d="M30,40 C70,30 100,36 140,22" stroke-width="2.5"/><path d="M50,52 C90,44 120,48 160,36" stroke-width="1.6"/><path d="M200,30 C240,20 270,28 310,16 l12,-4" stroke-width="2.2"/><path d="M230,46 C260,40 290,44 330,32" stroke-width="1.4"/></g>' +
      '<g filter="url(#' + p + 'bl)">' + puff(90, 128, 1.25, 'url(#' + p + 'cu)') + puff(170, 120, 0.9, 'url(#' + p + 'cu)') + '</g>' +
      '<g filter="url(#' + p + 'bl)"><rect x="0" y="182" width="230" height="22" rx="11" fill="#c9d2da"/><rect x="20" y="176" width="180" height="16" rx="8" fill="#d6dde3"/></g>' +
      '<g filter="url(#' + p + 'bl)">' + puff(320, 150, 1.5, 'url(#' + p + 'nb)') + puff(285, 160, 1.1, 'url(#' + p + 'nb)') + '</g>' +
      '<g stroke="#5b7da3" stroke-width="1.4" opacity=".8">' + [270, 282, 294, 306, 318, 330, 342, 354].map(function(x, i){ return '<path d="M' + x + ',' + (186 + (i % 2) * 6) + ' l-6,' + (40 + (i % 3) * 8) + '"/>'; }).join('') + '</g>' +
      '<path d="M0,240 L400,240 L400,260 L0,260 Z" fill="#2f86a8"/>' +
      '<path d="M380,20 V230" stroke="#0b2545" stroke-opacity=".3"/><text x="386" y="34" class="pl-sl" font-size="9" text-anchor="end">alto</text><text x="386" y="124" class="pl-sl" font-size="9" text-anchor="end">medio</text><text x="386" y="200" class="pl-sl" font-size="9" text-anchor="end">bajo</text>' +
      T(90, 70, 'CIRROS', { size: 11.5 }) + T(120, 98, 'CÚMULOS', { size: 11.5 }) + T(110, 222, 'ESTRATOS', { size: 11.5 }) + T(310, 118, 'NIMBOS', { size: 11.5 }) + '</svg>';
    f.stage.innerHTML = s;
  };
  FIG.ola = function(el){
    var f = frame(el, 'Partes de una ola', 'Mira la boya: sube y baja (y gira un poco) pero <b>no avanza</b> con la ola. El agua oscila; lo que viaja es la onda.', 'Animación');
    var p = uid();
    f.stage.innerHTML = '<svg viewBox="0 0 400 220" class="pl-svg" role="img" aria-label="Ola con cresta, seno, altura y longitud"><defs>' +
      '<linearGradient id="' + p + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4aa3c8"/><stop offset="1" stop-color="#14567a"/></linearGradient></defs>' +
      '<rect width="400" height="220" fill="#eaf5fb"/><path class="o-w" d="" fill="url(#' + p + 'w)"/><path class="o-l" d="" fill="none" stroke="#fff" stroke-width="2"/>' +
      '<path d="M0,120 H400" stroke="#0b2545" stroke-opacity=".3" stroke-dasharray="4 4"/>' +
      '<g class="o-dim"></g><g class="o-buoy"><path d="M-8,0 L8,0 L5,10 L-5,10 Z" fill="#f97316" stroke="#7c2d12"/><path d="M0,0 V-14" stroke="#111" stroke-width="1.6"/><path d="M0,-14 L9,-11 L0,-8 Z" fill="#dc2626"/></g>' +
      '<path class="o-orb" d="" fill="none" stroke="#f97316" stroke-dasharray="2 3"/></svg>';
    var q = function(c){ return f.stage.querySelector(c); };
    var A = 30, lam = 200, BX = 250;
    function yAt(x, t){ return 120 - A * Math.cos((x / lam) * TAU - t * 1.6); }
    addAnim(f.stage, function(t){
      var d = 'M0,220 ', l = '';
      for (var x = 0; x <= 400; x += 5){ var y = yAt(x, t); d += 'L' + x + ',' + y.toFixed(1) + ' '; l += (x ? 'L' : 'M') + x + ',' + y.toFixed(1) + ' '; }
      q('.o-w').setAttribute('d', d + 'L400,220 Z'); q('.o-l').setAttribute('d', l);
      var ph = (BX / lam) * TAU - t * 1.6, bx = BX + A * 0.5 * Math.sin(ph), by = yAt(BX, t) - 8;
      q('.o-buoy').setAttribute('transform', 'translate(' + bx.toFixed(1) + ',' + by.toFixed(1) + ') rotate(' + (Math.sin(ph) * 16).toFixed(1) + ')');
      q('.o-orb').setAttribute('d', 'M' + (BX - A * 0.5) + ',' + (120 - 8) + ' a' + (A * 0.5) + ',' + A + ' 0 1 0 ' + A + ',0 a' + (A * 0.5) + ',' + A + ' 0 1 0 ' + (-A) + ',0');
      // crest positions for labels
      var c0 = ((t * 1.6) / TAU * lam) % lam, cx = c0 < 40 ? c0 + lam : c0, tx = cx - lam / 2;
      q('.o-dim').innerHTML = dimV(cx, 90, 150, 'altura', -1, '#0b2545') + '<path d="M' + cx + ',150 H' + (tx < 0 ? tx + lam : tx) + '" stroke="#0b2545" stroke-dasharray="2 3"/>' +
        dimH(66, cx - lam < 0 ? cx : cx - lam, cx - lam < 0 ? cx + lam : cx, 'longitud', '#b45309') +
        T(cx, 84, 'cresta', { size: 11 }) + T(tx < 0 ? tx + lam : tx, 170, 'seno', { size: 11 });
      return !REDUCED;
    });
  };
  FIG.marea = function(el){
    var f = frame(el, 'Marea mixta (ejemplo)', 'En Chile hay normalmente <b>2 pleamares y 2 bajamares</b> en cada día-marea (unas 24 h 50 min), de alturas distintas. Curva <b>ilustrativa</b>: para navegar usa la <b>tabla de mareas del SHOA</b>.', 'Diagrama');
    var W = 400, H = 200, X0 = 36, X1 = 384, Y0 = 26, Y1 = 160, T0 = 25;
    function h(tt){ return 0.9 + 0.55 * Math.cos(TAU * (tt - 3) / 12.42) + 0.22 * Math.cos(TAU * (tt - 5) / 24.84); }
    function X(tt){ return X0 + (X1 - X0) * tt / T0; } function Y(v){ return Y1 - (Y1 - Y0) * v / 1.9; }
    var d = '', area = 'M' + X(0) + ',' + Y1 + ' ', ext = [];
    for (var tt = 0; tt <= T0; tt += 0.1){ var v = h(tt); d += (tt ? 'L' : 'M') + X(tt).toFixed(1) + ',' + Y(v).toFixed(1) + ' '; area += 'L' + X(tt).toFixed(1) + ',' + Y(v).toFixed(1) + ' '; var a = h(tt - 0.1), b = h(tt + 0.1); if ((v > a && v > b) || (v < a && v < b)) ext.push([tt, v, v > a]); }
    area += 'L' + X(T0) + ',' + Y1 + ' Z';
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pl-svg" role="img" aria-label="Curva de marea con dos pleamares y dos bajamares"><rect width="400" height="200" fill="#f6fafc"/>' +
      '<path d="' + area + '" fill="#5fb3d0" opacity=".35"/><path d="' + d + '" fill="none" stroke="#0e7490" stroke-width="2.6"/>' +
      '<path d="M' + X0 + ',' + Y1 + ' H' + X1 + ' M' + X0 + ',' + Y0 + ' V' + Y1 + '" stroke="#64748b"/>';
    for (var k = 0; k <= 24; k += 6) s += '<text x="' + X(k) + '" y="' + (Y1 + 14) + '" font-size="9" text-anchor="middle" fill="#475569" font-family="Nunito,sans-serif" font-weight="800">' + ('0' + k).slice(-2) + ':00</text>';
    ext.forEach(function(e){ s += '<circle cx="' + X(e[0]).toFixed(1) + '" cy="' + Y(e[1]).toFixed(1) + '" r="4" fill="' + (e[2] ? '#0b2545' : '#b45309') + '"/>' + T(X(e[0]), Y(e[1]) + (e[2] ? -10 : 18), e[2] ? 'pleamar' : 'bajamar', { size: 10, fill: e[2] ? '#0b2545' : '#b45309' }); });
    s += '<text x="12" y="' + ((Y0 + Y1) / 2) + '" font-size="9" fill="#475569" font-weight="800" font-family="Nunito,sans-serif" text-anchor="middle" transform="rotate(-90 12 ' + ((Y0 + Y1) / 2) + ')">altura (m)</text>' +
      T(200, 190, 'hora del día (ejemplo)', { size: 10 }) + '</svg>';
    f.stage.innerHTML = s;
  };

  /* =====================================================================
     19. SEGURIDAD — equipo mínimo de bahía
     ===================================================================== */
  FIG.equipo = function(el){
    var f = frame(el, 'Equipo mínimo en bahía', 'Un <b>chaleco salvavidas por persona</b>, un <b>pito</b> y un <b>achicador</b>. El mejor chaleco es el que llevas puesto.', 'Diagrama');
    var p = uid();
    var s = '<svg viewBox="0 0 400 200" class="pl-svg" role="img" aria-label="Chaleco salvavidas, pito y achicador"><defs>' +
      '<linearGradient id="' + p + 'o" x1="0" x2="1"><stop offset="0" stop-color="#c2410c"/><stop offset=".4" stop-color="#fb923c"/><stop offset="1" stop-color="#c2410c"/></linearGradient>' +
      '<linearGradient id="' + p + 'y" x1="0" x2="1"><stop offset="0" stop-color="#ca8a04"/><stop offset=".45" stop-color="#fde047"/><stop offset="1" stop-color="#a16207"/></linearGradient>' +
      '<linearGradient id="' + p + 'b" x1="0" x2="1"><stop offset="0" stop-color="#1e3a8a"/><stop offset=".45" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient>' +
      '<filter id="' + p + 'sh"><feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity=".25"/></filter></defs>' +
      '<rect width="400" height="200" fill="#f6fafc"/>' +
      // life jacket
      '<g filter="url(#' + p + 'sh)" transform="translate(30,16)"><path d="M30,10 C40,4 50,4 56,14 L58,40 L76,40 L78,14 C84,4 94,4 104,10 L118,40 L114,150 C90,160 44,160 20,150 L16,40 Z" fill="url(#' + p + 'o)" stroke="#7c2d12"/>' +
      '<path d="M58,40 C60,60 74,60 76,40" fill="#f6fafc"/><path d="M67,60 V156" stroke="#7c2d12" stroke-width="1.5"/>' +
      '<path d="M18,96 H116 M19,124 H115" stroke="#111827" stroke-width="6"/><rect x="58" y="90" width="18" height="12" rx="2" fill="#374151"/><rect x="58" y="118" width="18" height="12" rx="2" fill="#374151"/>' +
      '<path d="M26,30 L44,24 M90,24 L108,30" stroke="#e5e7eb" stroke-width="5"/><circle cx="96" cy="70" r="5" fill="none" stroke="#111" stroke-width="1.5"/></g>' +
      // whistle
      '<g filter="url(#' + p + 'sh)" transform="translate(186,80)"><path d="M0,10 L40,10 C56,10 66,18 66,30 C66,44 54,52 40,50 C30,50 24,42 24,32 L0,32 Z" fill="url(#' + p + 'y)" stroke="#854d0e"/><rect x="6" y="14" width="10" height="5" fill="#854d0e" opacity=".6"/><circle cx="44" cy="31" r="9" fill="#a16207" opacity=".5"/>' +
      '<path d="M62,20 C76,6 84,-6 96,-10" stroke="#111" stroke-width="1.5" fill="none"/></g>' +
      // bailer
      '<g filter="url(#' + p + 'sh)" transform="translate(290,60)"><path d="M0,30 L70,20 L78,90 C60,104 20,104 8,90 Z" fill="url(#' + p + 'b)" stroke="#1e3a8a"/><path d="M0,30 L70,20" stroke="#93c5fd" stroke-width="3"/><path d="M30,26 C30,0 52,-4 58,22" stroke="#1e3a8a" stroke-width="7" fill="none"/></g>' +
      T(97, 192, 'chaleco salvavidas', { size: 11 }) + T(220, 160, 'pito', { size: 11 }) + T(330, 180, 'achicador', { size: 11 }) +
      '</svg>';
    f.stage.innerHTML = s;
  };

  /* =====================================================================
     20. HOMBRE AL AGUA — maniobra animada
     ===================================================================== */
  FIG.mob = function(el){
    var f = frame(el, 'Hombre al agua', 'Lo importante: <b>no perderla de vista</b>, acercarse <b>despacio por sotavento</b> y poner el motor en <b>neutro</b> antes de llegar a la persona.', 'Animación');
    var tt = REDUCED ? 15 : 0, playing = !REDUCED, DUR = 15;
    var C = canvasIn(f.stage, 0.7, 440);
    var step = document.createElement('div'); step.className = 'pl-step'; f.stage.appendChild(step);
    var STEPS = [[0, 'Cae una persona por la banda.'], [0.6, 'Grita "<b>¡Hombre al agua!</b>", lanza un <b>aro salvavidas</b> y que alguien la <b>señale</b> con el brazo sin dejar de mirarla.'], [1.4, 'Antes de virar, comprueba que no haya <b>cabos en el agua</b> que enreden la hélice. Vira para volver.'], [4.4, 'Sin perderla de vista, pasa a <b>sotavento</b> de la persona y vira para quedar con la proa al viento.'], [9.8, 'Acércate <b>despacio</b> por <b>sotavento</b> (con la proa al viento), con la nave frenada.'], [12.6, 'Motor en <b>neutro</b> junto a la persona y recógela cuanto antes.']];
    // path: north, then a wide turn to starboard and back south, then turn to come up from leeward (south of the person) heading north
    // tuned so the boat loops downwind and comes back up into the wind, stopping with the person at its port bow
    var B = { x: 360, y: 380, spd: function(t){ return t < 9.8 ? 85 : t < 12.6 ? 85 - 60 * ramp(t, 9.8, 2.4) : 25 * (1 - ramp(t, 12.6, 1.6)); },
      hdg: function(t){ return 180 * ramp(t, 1.6, 2.6) + 180 * ramp(t, 7.6, 2.6); } };
    var sim = simBoat(B, DUR), mob = { x: 360, y: 640 - 85 * 0.5 };
    var i0 = Math.round(0.4 / sim.dt); mob.x = sim.x[i0] - 24; mob.y = sim.y[i0];
    var lastS = -1;
    var pb = btn(f.ctrl, '', function(){ playing = !playing; if (playing && tt >= DUR) tt = 0; setB(); resume(an); });
    btn(f.ctrl, '↺ Repetir', function(){ tt = 0; playing = true; setB(); resume(an); });
    function setB(){ pb.textContent = playing ? '❚❚ Pausa' : '▶ Ver'; }
    setB();
    var an = addAnim(C.cv, function(t, dt){
      if (playing){ tt += dt; if (tt >= DUR){ tt = DUR; playing = false; setB(); } }
      var o = C.size(), ctx = o.ctx, w = o.w, h = o.h;
      drawWater(ctx, w, h, t * 0.6);
      var sc = Math.min(w / 1000, h / 700);
      ctx.save(); ctx.translate((w - 1000 * sc) / 2, (h - 700 * sc) / 2); ctx.scale(sc, sc);
      // wind
      ctx.save(); ctx.translate(880, 90); ctx.fillStyle = 'rgba(255,255,255,.88)'; rrect(ctx, -62, -62, 124, 124, 18); ctx.fill();
      arrow(ctx, 0, -40, 0, 30, '#1e3a8a', 6); label(ctx, 'VIENTO', 0, 48, { size: 18, color: '#1e3a8a', halo: 0 }); ctx.restore();
      label(ctx, 'barlovento ↑', 120, 50, { size: 22, color: '#fff', haloColor: 'rgba(0,30,50,.5)' });
      label(ctx, 'sotavento ↓', 120, 670, { size: 22, color: '#fff', haloColor: 'rgba(0,30,50,.5)' });
      var i = sampleAt(sim, tt), L = 84, trail = [];
      for (var j = Math.max(0, i - 200); j <= i; j += 6){ var hj = sim.h[j] * D2R; trail.push([sim.x[j] - Math.sin(hj) * L * 0.5, sim.y[j] + Math.cos(hj) * L * 0.5, sim.h[j]]); }
      drawWake(ctx, trail, L * 0.6, clamp(sim.v[i] / 70, 0.2, 1.3));
      if (tt > 0.3){
        // ring buoy + person
        if (tt > 0.8){ ctx.save(); ctx.translate(mob.x + 26, mob.y - 8); ctx.lineWidth = 9; ctx.strokeStyle = '#f97316'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.setLineDash([7, 15]); ctx.stroke(); ctx.restore(); }
        var bob = Math.sin(t * 3) * 2;
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(mob.x, mob.y, 18 + Math.sin(t * 2) * 3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(mob.x, mob.y + bob, 11, 0, TAU); ctx.fill();
        ctx.fillStyle = '#f2c9a0'; ctx.beginPath(); ctx.arc(mob.x, mob.y - 6 + bob, 7, 0, TAU); ctx.fill();
        // pointing line from boat
        if (tt > 0.6 && tt < 12.6){ ctx.save(); ctx.setLineDash([8, 8]); ctx.strokeStyle = 'rgba(253,224,71,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sim.x[i], sim.y[i]); ctx.lineTo(mob.x, mob.y); ctx.stroke(); ctx.restore(); }
      }
      ctx.save(); ctx.translate(sim.x[i], sim.y[i]); ctx.rotate(sim.h[i] * D2R); lanchaTop(ctx, L, { stripe: '#1d4ed8' }); ctx.restore();
      if (tt > 12.6) pill(ctx, 'NEUTRO', sim.x[i], sim.y[i] + 70, '#047857', '#fff', 19);
      if (tt > 0.6 && tt < 3) pill(ctx, '¡HOMBRE AL AGUA!', mob.x, mob.y - 52, '#b91c1c', '#fff', 19);
      ctx.restore();
      var si = 0; STEPS.forEach(function(st, k){ if (tt >= st[0]) si = k; });
      if (si !== lastS){ lastS = si; step.innerHTML = '<span class="pl-step-n">' + (si + 1) + '/' + STEPS.length + '</span> ' + STEPS[si][1]; }
      return true;
    });
  };

  /* =====================================================================
     21. MAYDAY — radio VHF y orden del mensaje (con práctica)
     ===================================================================== */
  var MAYDAY = ['MAYDAY, MAYDAY, MAYDAY', 'AQUÍ "ALBATROS", "ALBATROS", "ALBATROS"', 'Posición: 33° 02\' S, 71° 38\' O', 'Vía de agua, nos hundimos; necesitamos auxilio inmediato', '3 personas a bordo', 'CAMBIO'];
  FIG.mayday = function(el){
    var f = frame(el, 'Llamada de socorro por VHF', 'Canal <b>16</b>. Nombre y posición de ejemplo (ficticios). Toca <b>Ordenar el mensaje</b> para practicar.', 'Interactivo');
    var p = uid();
    var radio = '<svg viewBox="0 0 200 140" class="pl-svg pl-vhf" role="img" aria-label="Radio VHF en el canal 16"><defs>' +
      '<linearGradient id="' + p + 'r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#374151"/><stop offset="1" stop-color="#0b0f14"/></linearGradient>' +
      '<linearGradient id="' + p + 'lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9f99d"/><stop offset="1" stop-color="#a3c27a"/></linearGradient></defs>' +
      '<rect x="8" y="22" width="184" height="110" rx="14" fill="url(#' + p + 'r)"/><rect x="24" y="36" width="96" height="56" rx="6" fill="url(#' + p + 'lcd)" stroke="#111"/>' +
      '<text x="72" y="82" text-anchor="middle" font-size="40" font-weight="900" fill="#1a2e05" font-family="Baloo 2,Nunito,sans-serif">16</text><text x="30" y="48" font-size="8" fill="#1a2e05" font-weight="800" font-family="Nunito,sans-serif">CH</text>' +
      '<rect x="132" y="36" width="44" height="56" rx="6" fill="#1f2937"/>' + [0, 1, 2, 3, 4].map(function(k){ return '<path d="M138,' + (44 + k * 10) + ' H170" stroke="#4b5563" stroke-width="3"/>'; }).join('') +
      '<rect x="24" y="102" width="40" height="18" rx="5" fill="#b91c1c"/><text x="44" y="115" text-anchor="middle" font-size="8.5" fill="#fff" font-weight="900" font-family="Nunito,sans-serif">DISTRESS</text>' +
      '<circle cx="90" cy="111" r="9" fill="#4b5563"/><circle cx="116" cy="111" r="9" fill="#4b5563"/><circle cx="160" cy="111" r="12" fill="#6b7280"/>' +
      '<path d="M40,22 L40,4" stroke="#111" stroke-width="5" stroke-linecap="round"/></svg>';
    f.stage.innerHTML = '<div class="pl-may"><div class="pl-may-r">' + radio + '</div><ol class="pl-may-msg">' + MAYDAY.map(function(m){ return '<li>' + esc(m) + '</li>'; }).join('') + '</ol></div><div class="pl-may-game"></div>';
    var game = f.stage.querySelector('.pl-may-game'), list = f.stage.querySelector('.pl-may-msg');
    var gb = btn(f.ctrl, '🧩 Ordenar el mensaje', function(){
      if (game.innerHTML){ game.innerHTML = ''; list.style.display = ''; gb.textContent = '🧩 Ordenar el mensaje'; return; }
      gb.textContent = 'Ver el mensaje'; list.style.display = 'none';
      var order = [], sh = shuffle(MAYDAY.map(function(_, i){ return i; }));
      game.innerHTML = '<p class="pl-may-h">Toca las partes en el orden correcto:</p><div class="pl-may-picked"></div><div class="pl-may-opts">' + sh.map(function(i){ return '<button type="button" class="pl-lq-opt" data-i="' + i + '">' + esc(MAYDAY[i]) + '</button>'; }).join('') + '</div>';
      var picked = game.querySelector('.pl-may-picked');
      game.querySelectorAll('.pl-may-opts button').forEach(function(b){
        b.addEventListener('click', function(){
          var i = +b.getAttribute('data-i');
          if (i === order.length){ order.push(i); b.classList.add('ok'); b.disabled = true; picked.insertAdjacentHTML('beforeend', '<div>' + (i + 1) + '. ' + esc(MAYDAY[i]) + '</div>'); if (order.length === MAYDAY.length) picked.insertAdjacentHTML('beforeend', '<div class="pl-may-ok">✅ ¡Mensaje completo! Recuerda: la posición es el dato más importante.</div>'); }
          else { b.classList.add('bad'); setTimeout(function(){ b.classList.remove('bad'); }, 600); }
        });
      });
    }, 'pl-mini-btn-alt');
  };

  /* =====================================================================
     22. VELA — rumbos respecto al viento y partes de la vela
     ===================================================================== */
  FIG.vela = function(el){
    var f = frame(el, 'Rumbos respecto al viento', 'No se puede navegar contra el viento (zona muerta, unos 45° a cada lado). La botavara va hacia <b>sotavento</b> y se abre más cuanto más a popa entra el viento.', 'Diagrama');
    var C = canvasIn(f.stage, 0.9, 460);
    var R = [[0, 'proa al viento', 'zona muerta', 0, 1], [45, 'ceñida', '', 0.18], [90, 'de través', '', 0.7], [135, 'a un largo', '', 1.05], [180, 'en popa', '', 1.45]];
    function draw(t){
      var o = C.size(), ctx = o.ctx, w = o.w, h = o.h, cx = w / 2, cy = h * 0.5, Rr = Math.min(w, h) * 0.335;
      drawWater(ctx, w, h, t * 0.5, { scale: 0.8 });
      // sectors
      function sec(a0, a1, col){ ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, Rr * 1.2, (a0 - 90) * D2R, (a1 - 90) * D2R); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
      sec(-45, 45, 'rgba(248,113,113,0.35)');
      sec(45, 70, 'rgba(34,211,238,0.22)'); sec(-70, -45, 'rgba(34,211,238,0.22)');
      sec(70, 110, 'rgba(52,211,153,0.22)'); sec(-110, -70, 'rgba(52,211,153,0.22)');
      sec(110, 160, 'rgba(251,191,36,0.22)'); sec(-160, -110, 'rgba(251,191,36,0.22)');
      sec(160, 200, 'rgba(167,139,250,0.28)');
      // wind
      arrow(ctx, 26, 8, 26, 62, '#1e3a8a', 5);
      label(ctx, 'VIENTO', 34, 76, { size: 12, color: '#1e3a8a', align: 'left' });
      var L = Math.min(w, h) * 0.19;
      [1, -1].forEach(function(side){
        R.forEach(function(r, k){
          if (side < 0 && (r[0] === 0 || r[0] === 180)) return;
          var a = r[0] * side, x = cx + Rr * Math.sin(a * D2R), y = cy - Rr * Math.cos(a * D2R);
          ctx.save(); ctx.translate(x, y); ctx.rotate(a * D2R);
          // wind from north: boom to leeward = toward the side away from the wind
          var boom = side * r[3];
          if (r[0] === 180) boom = 1.45;
          veleroTop(ctx, L, boom, { luff: r[4], t: t, wingJib: r[0] === 180 });
          ctx.restore();
          label(ctx, r[1], x, y + (r[0] === 0 ? L * 0.95 : r[0] === 180 ? -L * 0.9 : L * 0.82), { size: w < 500 ? 10.5 : 12 });
          if (r[2]) label(ctx, r[2], cx, cy - Rr * 0.45, { size: 12, color: '#b91c1c' });
        });
      });
      label(ctx, 'viento por estribor', cx - Rr * 0.95, h - 12, { size: 10.5, color: '#334155' });
      label(ctx, 'viento por babor', cx + Rr * 0.95, h - 12, { size: 10.5, color: '#334155' });
    }
    addAnim(C.cv, function(t){ draw(t); return !REDUCED; });
    requestAnimationFrame(function(){ draw(0); });
  };
  FIG.velas = function(el){
    var f = frame(el, 'Aparejo y partes de la vela', '<b>Jarcia firme</b> (obenques, estay) sostiene el palo. <b>Jarcia de labor</b>: drizas para izar y escotas para cazar o lascar las velas.', 'Diagrama');
    var p = uid();
    var s = '<svg viewBox="0 0 400 320" class="pl-svg" role="img" aria-label="Velero con mayor, foque, palo, botavara, estay y obenques; partes de la vela"><defs>' +
      '<linearGradient id="' + p + 'sail" x1="0" x2="1"><stop offset="0" stop-color="#f8f7f0"/><stop offset=".6" stop-color="#ffffff"/><stop offset="1" stop-color="#e5e2d6"/></linearGradient>' +
      '<linearGradient id="' + p + 'jib" x1="0" x2="1"><stop offset="0" stop-color="#ecebe2"/><stop offset="1" stop-color="#ffffff"/></linearGradient>' +
      '<linearGradient id="' + p + 'h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#c3ced6"/></linearGradient>' +
      '<linearGradient id="' + p + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb3d0"/><stop offset="1" stop-color="#1f6f96"/></linearGradient></defs>' +
      '<rect width="400" height="320" fill="#eef6fa"/><rect y="262" width="400" height="58" fill="url(#' + p + 'w)"/>' +
      '<path d="M70,250 L300,250 C290,268 270,276 240,276 L110,276 C90,272 78,262 70,250 Z" fill="url(#' + p + 'h)" stroke="#475569"/><path d="M70,250 L300,250" stroke="#0b2545" stroke-width="3"/>' +
      '<path d="M170,250 L170,30" stroke="#64748b" stroke-width="4"/>' +
      '<path d="M170,32 L296,248" stroke="#475569" stroke-width="1.4"/><path d="M170,40 L120,250 M170,40 L214,250" stroke="#94a3b8" stroke-width="1.1"/>' +
      '<path d="M176,226 L118,228" stroke="#475569" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M171,42 C150,110 128,170 118,226 L171,226 Z" fill="url(#' + p + 'sail)" stroke="#94a3b8"/>' +
      '<path d="M180,62 L284,232 L210,236 C220,180 210,110 180,62 Z" fill="url(#' + p + 'jib)" stroke="#94a3b8"/>' +
      '<path d="M210,236 L234,250 M118,228 L132,250" stroke="#b45309" stroke-width="1.4" stroke-dasharray="3 2"/>' +
      '<path d="M166,40 L160,250" stroke="#b45309" stroke-width="1" stroke-dasharray="2 3" opacity=".8"/>' +
      T(70, 120, 'MAYOR', { size: 12 }) + T(240, 150, 'FOQUE', { size: 12 }) +
      T(150, 24, 'palo', { size: 10.5 }) + T(262, 132, 'estay', { anchor: 'start', size: 10.5 }) + leader(260, 130, 238, 168) + T(100, 196, 'obenque', { anchor: 'end', size: 10 }) + leader(102, 194, 134, 190) +
      T(110, 244, 'botavara', { anchor: 'end', size: 10.5 }) + leader(112, 240, 130, 228) +
      T(150, 74, 'grátil', { anchor: 'end', size: 10.5, fill: '#0e7490' }) + leader(152, 72, 160, 82, '#0e7490') +
      T(100, 160, 'baluma', { anchor: 'end', size: 10.5, fill: '#0e7490' }) + leader(102, 158, 132, 168, '#0e7490') +
      T(146, 216, 'pujamen', { size: 10.5, fill: '#0e7490' }) +
      T(190, 34, 'puño de driza', { anchor: 'start', size: 9.5, fill: '#b45309' }) + T(176, 238, 'puño de amura', { anchor: 'start', size: 9.5, fill: '#b45309' }) + T(14, 206, 'puño de escota', { anchor: 'start', size: 9.5, fill: '#b45309' }) + leader(60, 210, 116, 226, '#b45309') +
      T(256, 262, 'escota', { size: 10, fill: '#b45309' }) + T(150, 140, 'driza', { anchor: 'end', size: 9.5, fill: '#b45309' }) +
      '<text x="30" y="300" class="pl-sl" font-size="10" text-anchor="start">← popa</text><text x="370" y="300" class="pl-sl" font-size="10" text-anchor="end">proa →</text>' +
      '</svg>';
    f.stage.innerHTML = s;
  };

  /* ---------------- mount ---------------- */
  function mount(root){
    if (!root) return;
    root.querySelectorAll('.pl-fig[data-fig]:not([data-ready])').forEach(function(el){
      var id = el.getAttribute('data-fig');
      el.setAttribute('data-ready', '1');
      if (!FIG[id]) { el.remove(); return; }
      try { FIG[id](el); } catch (err) { el.innerHTML = ''; if (window.console) console.warn('PLArt ' + id, err); }
    });
  }
  /* Small SVG icons for modules / tabs */
  var ICONS = {
    nautica: '<path d="M12 3v18M7 7h10M12 21c-4 0-7-3-7-7m7 7c4 0 7-3 7-7" /><circle cx="12" cy="4.5" r="1.6"/><path d="M3.5 14l1.5-1.6 1.6 1.6M20.5 14L19 12.4 17.4 14"/>',
    reglamentacion: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    motores: '<circle cx="12" cy="12" r="2.2"/><path d="M12 9.8C10 6 12 3 14.5 3.6 16.2 4 15.6 8 12 9.8zM14 13.1c4 1 6 4 4.3 5.9-1.2 1.3-4.6-.9-4.3-5.9zM9.9 13c-2.6 3.2-6.2 3.4-6.9 1-.5-1.7 3.3-3.4 6.9-1z"/>',
    meteo: '<path d="M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6 1.6A3.2 3.2 0 0 0 7 18z"/><path d="M9 21l1-2M13 21l1-2"/>',
    seguridad: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="M12 3.5v4.5M12 16v4.5M3.5 12H8M16 12h4.5"/>',
    navegacion: '<circle cx="12" cy="12" r="9"/><path d="M12 5l2.5 7-2.5 7-2.5-7z"/><path d="M12 3v1.6M12 19.4V21M3 12h1.6M19.4 12H21"/>',
    ripa: '<path d="M5 19l3-9 3 9z" /><path d="M13 9l9-3-9-3z" /><path d="M8 10V6M13 6H9" stroke-dasharray="1.6 1.6"/>',
    emergencias: '<path d="M12 3l9 16H3z"/><path d="M12 9v5M12 16.6v.4"/>',
    vela: '<path d="M11 3v15M11 4c4 3 6.5 8 7 13h-7M10 6c-2.5 3-4 7-4.2 11H10"/><path d="M4 19.5h16l-2 2H6z"/>',
    learn: '<path d="M3 5.5C5.5 4.5 8.5 4.5 12 6.5c3.5-2 6.5-2 9-1v13c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1z"/><path d="M12 6.5v13"/>',
    practice: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 7l3 3"/>',
    review: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/><path d="M12 8v4l3 2"/>',
    exam: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l1.5 1.5L12 7M8 13l1.5 1.5L12 12M14 8h3M14 13h3M8 17.5h9"/>',
    progress: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'
  };
  function icon(name, cls){
    return '<svg class="pl-ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }
  /* Header emblem: brass anchor on a navy roundel with a rope ring */
  function emblem(){
    var p = uid();
    return '<svg class="pl-emblem" viewBox="0 0 64 64" aria-hidden="true"><defs>' +
      '<radialGradient id="' + p + 'n" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#2b5a8a"/><stop offset="1" stop-color="#0b2545"/></radialGradient>' +
      '<linearGradient id="' + p + 'b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e19a"/><stop offset=".5" stop-color="#c9a227"/><stop offset="1" stop-color="#7d5a10"/></linearGradient></defs>' +
      '<circle cx="32" cy="32" r="30" fill="url(#' + p + 'n)"/>' +
      '<circle cx="32" cy="32" r="27" fill="none" stroke="#d8c08a" stroke-width="3" stroke-dasharray="3.2 1.6"/>' +
      '<g fill="none" stroke="url(#' + p + 'b)" stroke-width="3.6" stroke-linecap="round"><circle cx="32" cy="16.5" r="3.6"/><path d="M32 20v26M24 25h16M17 36c2 7 8 11 15 11s13-4 15-11"/></g>' +
      '<path d="M14.5 38.5l3-4 3.4 3.6M49.5 38.5l-3-4-3.4 3.6" fill="none" stroke="url(#' + p + 'b)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  return {
    mount: mount, icon: icon, emblem: emblem, FIG: FIG,
    lanchaTop: lanchaTop, veleroTop: veleroTop, drawWater: drawWater, fit: fit
  };
})();
