/* ================================================================
   MENSAJES SECRETOS — hand-built graphics (canvas + inline SVG)
   Caesar wheel, telegraph key, signal lamp, Morse tree, pigpen ink
   glyphs, scytale rod, desk + paper textures, history illustrations.
   No external images. Exposes one global: MensajesSecretosArt
   ================================================================ */

var MensajesSecretosArt = (function() {
  'use strict';

  var TAU = Math.PI * 2;

  function rng(seed) {
    var s = seed >>> 0;
    return function() {
      s = s + 0x6D2B79F5 | 0;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function dpr() { return Math.min(window.devicePixelRatio || 1, 3); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ---------------------------------------------------------------
  //  Tiny value noise (for wood + paper)
  // ---------------------------------------------------------------
  function makeNoise(seed) {
    var r = rng(seed), P = new Float32Array(256 * 256);
    for (var i = 0; i < P.length; i++) P[i] = r();
    function v(ix, iy) { return P[((iy & 255) << 8) | (ix & 255)]; }
    function n2(x, y) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      var a = v(ix, iy), b = v(ix + 1, iy), c = v(ix, iy + 1), d = v(ix + 1, iy + 1);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    }
    return function fbm(x, y, oct) {
      var s = 0, amp = 0.5, f = 1;
      for (var o = 0; o < (oct || 4); o++) { s += amp * n2(x * f, y * f); f *= 2.03; amp *= 0.5; }
      return s;
    };
  }

  // ---------------------------------------------------------------
  //  Paper texture tile → data URL (used as CSS background)
  // ---------------------------------------------------------------
  function paperTile(seed, base) {
    var S = 320, c = document.createElement('canvas');
    c.width = c.height = S;
    var g = c.getContext('2d');
    var col = base || [241, 230, 204];
    var img = g.createImageData(S, S), d = img.data, fb = makeNoise(seed || 7), r = rng(seed || 7);
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      // tileable noise: blend the four wraps
      var u = x / S, w = y / S;
      var n = fb(x * 0.05, y * 0.05, 3) * (1 - u) * (1 - w) + fb((x - S) * 0.05, y * 0.05, 3) * u * (1 - w) +
              fb(x * 0.05, (y - S) * 0.05, 3) * (1 - u) * w + fb((x - S) * 0.05, (y - S) * 0.05, 3) * u * w;
      var k = (n - 0.5) * 26 + (r() - 0.5) * 10;
      var i = (y * S + x) * 4;
      d[i] = col[0] + k; d[i + 1] = col[1] + k * 0.95; d[i + 2] = col[2] + k * 0.8; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // fibres
    for (var f = 0; f < 140; f++) {
      var fx = r() * S, fy = r() * S, a = r() * TAU, len = 4 + r() * 14;
      g.strokeStyle = r() < 0.5 ? 'rgba(120,90,50,0.10)' : 'rgba(255,255,240,0.20)';
      g.lineWidth = 0.6;
      g.beginPath(); g.moveTo(fx, fy);
      g.quadraticCurveTo(fx + Math.cos(a + 0.6) * len * 0.5, fy + Math.sin(a + 0.6) * len * 0.5,
                         fx + Math.cos(a) * len, fy + Math.sin(a) * len);
      g.stroke();
    }
    return c.toDataURL('image/png');
  }

  // ---------------------------------------------------------------
  //  Walnut desk behind everything (fixed canvas, drawn once / resize)
  // ---------------------------------------------------------------
  function drawDesk(canvas) {
    var W = window.innerWidth, H = window.innerHeight;
    var scale = 0.5;
    var w = Math.ceil(W * scale), h = Math.ceil(H * scale);
    canvas.width = w; canvas.height = h;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    var g = canvas.getContext('2d');
    var img = g.createImageData(w, h), d = img.data;
    var fb = makeNoise(31), fb2 = makeNoise(77), r = rng(5);
    var plankH = 150 * scale, seams = [];
    for (var py = 0; py < h; py += plankH) seams.push(py);
    for (var y = 0; y < h; y++) {
      var plank = Math.floor(y / plankH), off = plank * 913.7;
      for (var x = 0; x < w; x++) {
        var X = x / scale + off, Y = y / scale;
        var n = fb(X * 0.0016, Y * 0.012, 4);
        var ring = Math.sin(Y * 0.09 + n * 26 + plank * 2.1);
        var t = 0.5 + 0.5 * ring; t = t * t;
        var fine = fb2(X * 0.05, Y * 0.6, 2);
        var lum = 0.62 + 0.38 * t + (fine - 0.5) * 0.22;
        var R0 = 58, G0 = 33, B0 = 18, R1 = 128, G1 = 78, B1 = 42;
        var k = clamp(lum - 0.4, 0, 1);
        var i = (y * w + x) * 4;
        d[i] = R0 + (R1 - R0) * k; d[i + 1] = G0 + (G1 - G0) * k; d[i + 2] = B0 + (B1 - B0) * k; d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    // plank seams
    seams.forEach(function(sy) {
      if (sy === 0) return;
      g.fillStyle = 'rgba(15,6,2,0.55)'; g.fillRect(0, sy - 1, w, 1.4);
      g.fillStyle = 'rgba(255,210,160,0.10)'; g.fillRect(0, sy + 0.6, w, 0.8);
    });
    // varnish sheen + lamp pool + vignette
    var lamp = g.createRadialGradient(w * 0.5, h * 0.12, 0, w * 0.5, h * 0.12, Math.max(w, h) * 0.75);
    lamp.addColorStop(0, 'rgba(255,214,150,0.22)');
    lamp.addColorStop(0.5, 'rgba(255,190,120,0.05)');
    lamp.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = lamp; g.fillRect(0, 0, w, h);
  }

  // ---------------------------------------------------------------
  //  Shared audio: detent clicks + Morse tone
  // ---------------------------------------------------------------
  var _ac = null, _noise = null;
  function audio() {
    if (!_ac) {
      try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (_ac.state === 'suspended') { try { _ac.resume(); } catch (e) {} }
    return _ac;
  }
  function tick(strength) {
    var ac = audio(); if (!ac) return;
    if (!_noise) {
      _noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.03), ac.sampleRate);
      var ch = _noise.getChannelData(0);
      for (var i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 6);
    }
    var src = ac.createBufferSource(); src.buffer = _noise;
    var bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 1.4;
    var gn = ac.createGain(); gn.gain.value = 0.35 * (strength || 1);
    src.connect(bp); bp.connect(gn); gn.connect(ac.destination);
    src.start();
    if (navigator.vibrate) { try { navigator.vibrate(3); } catch (e) {} }
  }
  // Continuous tone with soft edges (no clicks).
  function Tone(freq) {
    this.freq = freq || 600; this.osc = null; this.gain = null;
  }
  Tone.prototype.on = function() {
    var ac = audio(); if (!ac || this.osc) return;
    var o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = this.freq;
    lp.type = 'lowpass'; lp.frequency.value = 2400;
    g.gain.setValueAtTime(0, ac.currentTime);
    g.gain.linearRampToValueAtTime(0.22, ac.currentTime + 0.006);
    o.connect(lp); lp.connect(g); g.connect(ac.destination); o.start();
    this.osc = o; this.gain = g;
  };
  Tone.prototype.off = function() {
    var ac = _ac; if (!ac || !this.osc) return;
    var o = this.osc, g = this.gain, t = ac.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0, t + 0.008);
    o.stop(t + 0.02);
    this.osc = null; this.gain = null;
  };

  // ---------------------------------------------------------------
  //  CAESAR WHEEL (canvas). Outer brass ring = plain, inner paper = secret.
  // ---------------------------------------------------------------
  function CaesarWheel(canvas, opts) {
    this.c = canvas; this.g = canvas.getContext('2d');
    this.opts = opts || {};
    this.alpha = this.opts.alphabet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    this.phi = 0; this.omega = 0; this.drag = null; this.sel = -1;
    this.lastIdx = 0; this.raf = 0; this.alive = true;
    this._bind();
    this.resize();
  }
  CaesarWheel.prototype.N = function() { return this.alpha.length; };
  CaesarWheel.prototype.step = function() { return TAU / this.alpha.length; };
  CaesarWheel.prototype.shift = function() {
    var n = this.N(); return ((Math.round(-this.phi / this.step()) % n) + n) % n;
  };
  CaesarWheel.prototype.setAlphabet = function(a) {
    var k = this.shift();
    this.alpha = a; this.phi = -k * this.step(); this.lastIdx = Math.round(this.phi / this.step());
    this.sel = -1; this._build(); this.kick();
    this._emit();
  };
  CaesarWheel.prototype.setShift = function(k, animate) {
    var n = this.N(); k = ((k % n) + n) % n;
    var cur = this.shift(), d = k - cur;
    if (d > n / 2) d -= n; if (d < -n / 2) d += n;
    this.target = this.phi - d * this.step();
    if (!animate) { this.phi = this.target; this.target = null; this.lastIdx = Math.round(this.phi / this.step()); }
    this.omega = 0; this.kick(); this._emit();
  };
  CaesarWheel.prototype.select = function(i) { this.sel = i; this.kick(); };
  CaesarWheel.prototype._emit = function() {
    if (this.opts.onChange) this.opts.onChange(this.shift(), this.sel);
  };
  CaesarWheel.prototype.resize = function() {
    var rect = this.c.getBoundingClientRect();
    var S = Math.max(200, Math.round(rect.width || 320));
    this.S = S; this.k = dpr();
    this.c.width = Math.round(S * this.k); this.c.height = Math.round(S * this.k);
    this._build(); this.kick();
  };
  CaesarWheel.prototype._geom = function() {
    var S = this.S, R = S / 2 - S * 0.035;
    return { cx: S / 2, cy: S / 2, R: R, rIn: R * 0.70, rDisc: R * 0.685 };
  };
  CaesarWheel.prototype._build = function() {
    var k = this.k, G = this._geom(), n = this.N(), step = TAU / n, self = this;
    // ---- static ring layer ----
    var ring = document.createElement('canvas');
    ring.width = ring.height = Math.round(this.S * k);
    var g = ring.getContext('2d'); g.scale(k, k);
    var cx = G.cx, cy = G.cy, R = G.R, rIn = G.rIn;
    // cast shadow on desk/paper
    g.save();
    g.shadowColor = 'rgba(20,10,0,0.55)'; g.shadowBlur = R * 0.09; g.shadowOffsetY = R * 0.04;
    g.fillStyle = '#7a561c'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.restore();
    // annulus clip
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.arc(cx, cy, rIn, 0, TAU, true); g.clip('evenodd');
    var rad = g.createRadialGradient(cx, cy, rIn, cx, cy, R);
    rad.addColorStop(0, '#6e4b14'); rad.addColorStop(0.08, '#b98a32'); rad.addColorStop(0.35, '#e7c36e');
    rad.addColorStop(0.62, '#f6dd96'); rad.addColorStop(0.86, '#c7973d'); rad.addColorStop(1, '#5e3f10');
    g.fillStyle = rad; g.fillRect(0, 0, this.S, this.S);
    // anisotropic sheen (brushed metal catches light in sectors)
    if (g.createConicGradient) {
      var cg = g.createConicGradient(-Math.PI / 4, cx, cy);
      var st = [[0, 'rgba(255,248,215,0.55)'], [0.1, 'rgba(255,240,200,0.05)'], [0.25, 'rgba(70,40,5,0.30)'],
                [0.4, 'rgba(255,240,200,0.10)'], [0.5, 'rgba(255,248,215,0.45)'], [0.62, 'rgba(255,240,200,0.05)'],
                [0.75, 'rgba(70,40,5,0.35)'], [0.9, 'rgba(255,240,200,0.08)'], [1, 'rgba(255,248,215,0.55)']];
      st.forEach(function(s) { cg.addColorStop(s[0], s[1]); });
      g.fillStyle = cg; g.fillRect(0, 0, this.S, this.S);
    }
    // brushed concentric micro-lines
    var r = rng(11);
    for (var rr = rIn; rr < R; rr += 0.55) {
      g.strokeStyle = r() < 0.5 ? 'rgba(255,250,225,' + (0.03 + r() * 0.06) + ')' : 'rgba(60,35,5,' + (0.03 + r() * 0.05) + ')';
      g.lineWidth = 0.5; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke();
    }
    g.restore();
    // knurled outer edge (fine milled ridges)
    g.save();
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.arc(cx, cy, R * 0.965, 0, TAU, true); g.clip('evenodd');
    for (var kn = 0; kn < 240; kn++) {
      var ka = kn * TAU / 240;
      g.strokeStyle = kn % 2 ? 'rgba(60,35,5,0.45)' : 'rgba(255,245,205,0.35)';
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx + Math.cos(ka) * R * 0.965, cy + Math.sin(ka) * R * 0.965); g.lineTo(cx + Math.cos(ka) * R, cy + Math.sin(ka) * R); g.stroke();
    }
    g.restore();
    // bevels
    function bevel(radius, w, lightFirst) {
      var lg = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      lg.addColorStop(0, lightFirst ? 'rgba(255,250,220,0.95)' : 'rgba(50,30,5,0.85)');
      lg.addColorStop(0.5, 'rgba(160,110,40,0.2)');
      lg.addColorStop(1, lightFirst ? 'rgba(50,30,5,0.85)' : 'rgba(255,250,220,0.9)');
      g.strokeStyle = lg; g.lineWidth = w; g.beginPath(); g.arc(cx, cy, radius, 0, TAU); g.stroke();
    }
    bevel(R - R * 0.012, R * 0.022, true);
    bevel(R - R * 0.04, R * 0.008, false);
    bevel(rIn + R * 0.01, R * 0.02, false);
    // engraved grooves
    function groove(radius) {
      g.lineWidth = Math.max(1, R * 0.006);
      g.strokeStyle = 'rgba(55,32,6,0.75)'; g.beginPath(); g.arc(cx, cy, radius, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(255,245,205,0.6)'; g.beginPath(); g.arc(cx + 0.7, cy + 0.9, radius, 0, TAU); g.stroke();
    }
    groove(R * 0.945); groove(R * 0.755);
    // tick marks + engraved letters
    var fs = R * (n > 26 ? 0.098 : 0.104);
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + i * step, ta = a + step / 2;
      var x1 = cx + Math.cos(ta) * R * 0.755, y1 = cy + Math.sin(ta) * R * 0.755;
      var x2 = cx + Math.cos(ta) * R * 0.945, y2 = cy + Math.sin(ta) * R * 0.945;
      g.lineWidth = Math.max(1, R * 0.005);
      g.strokeStyle = 'rgba(255,245,205,0.55)'; g.beginPath(); g.moveTo(x1 + 0.7, y1 + 0.9); g.lineTo(x2 + 0.7, y2 + 0.9); g.stroke();
      g.strokeStyle = 'rgba(55,32,6,0.7)'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      var lx = cx + Math.cos(a) * R * 0.85, ly = cy + Math.sin(a) * R * 0.85;
      engrave(g, this.alpha[i], lx, ly, a + Math.PI / 2, fs);
    }
    // inner disc drop shadow onto the ring (rotation-symmetric, so static)
    var sh = g.createRadialGradient(cx, cy + R * 0.012, G.rDisc * 0.98, cx, cy + R * 0.012, G.rDisc + R * 0.06);
    sh.addColorStop(0, 'rgba(25,12,0,0.55)'); sh.addColorStop(1, 'rgba(25,12,0,0)');
    g.fillStyle = sh; g.beginPath(); g.arc(cx, cy, G.rDisc + R * 0.06, 0, TAU); g.arc(cx, cy, G.rDisc * 0.97, 0, TAU, true); g.fill('evenodd');
    this.ring = ring;

    // ---- rotating paper disc layer ----
    var D = Math.round(G.rDisc * 2 * k) + 2, disc = document.createElement('canvas');
    disc.width = disc.height = D;
    var p = disc.getContext('2d'); p.scale(k, k);
    var rc = G.rDisc + 1 / k, rD = G.rDisc;
    p.save(); p.beginPath(); p.arc(rc, rc, rD, 0, TAU); p.clip();
    var pg = p.createRadialGradient(rc - rD * 0.2, rc - rD * 0.25, rD * 0.1, rc, rc, rD);
    pg.addColorStop(0, '#f7eed8'); pg.addColorStop(0.6, '#efe0bd'); pg.addColorStop(0.9, '#dcc392'); pg.addColorStop(1, '#b8945a');
    p.fillStyle = pg; p.fillRect(0, 0, rD * 2 + 2, rD * 2 + 2);
    p.restore();
    // grain
    var id = p.getImageData(0, 0, D, D), dd = id.data, nr = rng(23), fbn = makeNoise(41);
    for (var y = 0; y < D; y++) for (var x = 0; x < D; x++) {
      var j = (y * D + x) * 4; if (dd[j + 3] === 0) continue;
      var nn = (fbn(x * 0.03 / k, y * 0.03 / k, 3) - 0.5) * 22 + (nr() - 0.5) * 9;
      dd[j] += nn; dd[j + 1] += nn * 0.95; dd[j + 2] += nn * 0.8;
    }
    p.putImageData(id, 0, 0);
    // coffee ring stain + foxing spots
    p.save(); p.beginPath(); p.arc(rc, rc, rD, 0, TAU); p.clip();
    p.strokeStyle = 'rgba(120,70,20,0.10)'; p.lineWidth = rD * 0.025;
    p.beginPath(); p.arc(rc + rD * 0.35, rc + rD * 0.3, rD * 0.42, 0.3, 4.9); p.stroke();
    p.strokeStyle = 'rgba(120,70,20,0.06)'; p.lineWidth = rD * 0.05;
    p.beginPath(); p.arc(rc + rD * 0.36, rc + rD * 0.31, rD * 0.40, 0.2, 5.2); p.stroke();
    for (var f = 0; f < 14; f++) {
      var fx = nr() * rD * 2, fy = nr() * rD * 2, fr = rD * (0.01 + nr() * 0.04);
      var fg = p.createRadialGradient(fx, fy, 0, fx, fy, fr);
      fg.addColorStop(0, 'rgba(140,90,40,0.18)'); fg.addColorStop(1, 'rgba(140,90,40,0)');
      p.fillStyle = fg; p.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
    }
    p.restore();
    // printed rings + sector lines in sepia ink
    p.strokeStyle = 'rgba(92,48,20,0.75)'; p.lineWidth = Math.max(1, rD * 0.006);
    [0.965, 0.75, 0.43].forEach(function(f2) { p.beginPath(); p.arc(rc, rc, rD * f2, 0, TAU); p.stroke(); });
    p.lineWidth = Math.max(0.8, rD * 0.004);
    for (var s2 = 0; s2 < n; s2++) {
      var sa = -Math.PI / 2 + s2 * step + step / 2;
      p.beginPath(); p.moveTo(rc + Math.cos(sa) * rD * 0.75, rc + Math.sin(sa) * rD * 0.75);
      p.lineTo(rc + Math.cos(sa) * rD * 0.965, rc + Math.sin(sa) * rD * 0.965); p.stroke();
    }
    // secret letters (red ink) + little numbers
    var lf = rD * (n > 26 ? 0.118 : 0.125);
    for (var q = 0; q < n; q++) {
      var qa = -Math.PI / 2 + q * step;
      p.save();
      p.translate(rc + Math.cos(qa) * rD * 0.86, rc + Math.sin(qa) * rD * 0.86);
      p.rotate(qa + Math.PI / 2);
      p.fillStyle = 'rgba(128,28,18,0.93)';
      p.font = '700 ' + lf + 'px Georgia, "Times New Roman", serif';
      p.textAlign = 'center'; p.textBaseline = 'middle';
      p.fillText(this.alpha[q], 0, 0);
      p.restore();
      p.save();
      p.translate(rc + Math.cos(qa) * rD * 0.67, rc + Math.sin(qa) * rD * 0.67);
      p.rotate(qa + Math.PI / 2);
      p.fillStyle = 'rgba(92,60,30,0.7)';
      p.font = '600 ' + (rD * 0.06) + 'px "Courier New", Courier, monospace';
      p.textAlign = 'center'; p.textBaseline = 'middle';
      p.fillText(String(q), 0, 0);
      p.restore();
    }
    // compass-rose ornament inside
    p.save(); p.translate(rc, rc);
    p.strokeStyle = 'rgba(92,48,20,0.35)'; p.lineWidth = 1;
    for (var o = 0; o < 8; o++) {
      p.rotate(TAU / 8);
      p.beginPath(); p.moveTo(0, -rD * 0.42); p.lineTo(rD * 0.04, -rD * 0.2); p.lineTo(0, -rD * 0.17); p.lineTo(-rD * 0.04, -rD * 0.2); p.closePath();
      p.fillStyle = o % 2 ? 'rgba(128,28,18,0.10)' : 'rgba(92,48,20,0.12)'; p.fill(); p.stroke();
    }
    p.restore();
    // cardboard edge
    p.strokeStyle = 'rgba(90,60,25,0.8)'; p.lineWidth = 1.4;
    p.beginPath(); p.arc(rc, rc, rD - 0.7, 0, TAU); p.stroke();
    p.strokeStyle = 'rgba(255,250,235,0.5)'; p.lineWidth = 1;
    p.beginPath(); p.arc(rc, rc, rD - 2.2, Math.PI * 0.9, Math.PI * 1.7); p.stroke();
    this.disc = disc; this.discR = rc;
    self.lastIdx = Math.round(this.phi / step);
  };
  function engrave(g, ch, x, y, rot, fs) {
    g.save();
    g.font = '700 ' + fs + 'px Georgia, "Times New Roman", serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    // light catches the lower-right lip of the cut
    g.save(); g.translate(x + 0.8, y + 1); g.rotate(rot);
    g.fillStyle = 'rgba(255,246,210,0.75)'; g.fillText(ch, 0, 0); g.restore();
    g.save(); g.translate(x - 0.4, y - 0.5); g.rotate(rot);
    g.fillStyle = 'rgba(30,16,2,0.55)'; g.fillText(ch, 0, 0); g.restore();
    g.save(); g.translate(x, y); g.rotate(rot);
    var lg = g.createLinearGradient(0, -fs / 2, 0, fs / 2);
    lg.addColorStop(0, '#3b2406'); lg.addColorStop(1, '#6a4512');
    g.fillStyle = lg; g.fillText(ch, 0, 0); g.restore();
    g.restore();
  }
  CaesarWheel.prototype.kick = function() {
    if (this.raf || !this.alive) return;
    var self = this, last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var busy = self._physics(dt);
      self._draw();
      self.raf = busy ? requestAnimationFrame(frame) : 0;
    }
    this.raf = requestAnimationFrame(frame);
  };
  CaesarWheel.prototype._physics = function(dt) {
    var step = this.step();
    if (this.drag) return true;
    if (this.target != null) {
      var d = this.target - this.phi;
      this.phi += d * Math.min(1, dt * 10);
      if (Math.abs(d) < 0.0008) { this.phi = this.target; this.target = null; }
    } else if (Math.abs(this.omega) > 0.25) {
      this.phi += this.omega * dt;
      this.omega *= Math.exp(-dt * 2.6);
    } else {
      this.omega = 0;
      var snap = Math.round(this.phi / step) * step, e = snap - this.phi;
      if (Math.abs(e) > 0.0006) { this.phi += e * Math.min(1, dt * 14); }
      else { this.phi = snap; this._checkTick(); this._emit(); return false; }
    }
    this._checkTick();
    return true;
  };
  CaesarWheel.prototype._checkTick = function() {
    var idx = Math.round(this.phi / this.step());
    if (idx !== this.lastIdx) {
      var steps = Math.min(4, Math.abs(idx - this.lastIdx));
      this.lastIdx = idx; tick(0.6 + steps * 0.1);
      if (this.opts.onChange) this.opts.onChange(this.shift(), this.sel);
    }
  };
  CaesarWheel.prototype._draw = function() {
    var g = this.g, k = this.k, G = this._geom(), step = this.step(), n = this.N();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.c.width, this.c.height);
    g.drawImage(this.ring, 0, 0);
    g.setTransform(k, 0, 0, k, 0, 0);
    // detent feel while dragging: pull gently toward the nearest notch
    var phi = this.phi;
    if (this.drag) { var nearest = Math.round(phi / step) * step; phi += (nearest - phi) * 0.3; }
    g.save();
    g.translate(G.cx, G.cy); g.rotate(phi);
    g.drawImage(this.disc, -this.discR, -this.discR, this.discR * 2, this.discR * 2);
    g.restore();
    // reading window at 12 o'clock + selected column highlight
    var cols = [0]; if (this.sel >= 0) cols.push(this.sel);
    for (var ci = 0; ci < cols.length; ci++) {
      var a = -Math.PI / 2 + cols[ci] * step, sel = ci > 0;
      g.save();
      g.translate(G.cx, G.cy); g.rotate(a + Math.PI / 2);
      var w = Math.min(G.R * 0.2, 2 * Math.sin(step / 2) * G.R * 0.75), top = -G.R * 0.975, bot = -G.R * 0.5;
      if (!sel) {
        // glass slider in a brass frame
        g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
        roundRect(g, -w / 2, top, w, bot - top, w * 0.25);
        var glass = g.createLinearGradient(-w / 2, 0, w / 2, 0);
        glass.addColorStop(0, 'rgba(255,255,255,0.28)'); glass.addColorStop(0.35, 'rgba(255,255,255,0.05)');
        glass.addColorStop(0.7, 'rgba(255,255,255,0.12)'); glass.addColorStop(1, 'rgba(255,255,255,0.02)');
        g.fillStyle = glass; g.fill();
        g.shadowColor = 'transparent';
        var fr = g.createLinearGradient(-w / 2, top, w / 2, bot);
        fr.addColorStop(0, '#fff0b8'); fr.addColorStop(0.4, '#b8862f'); fr.addColorStop(1, '#5c3c0c');
        g.strokeStyle = fr; g.lineWidth = Math.max(2, G.R * 0.014); g.stroke();
        g.strokeStyle = 'rgba(178,40,24,0.55)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(0, top + 4); g.lineTo(0, top + 9); g.moveTo(0, bot - 9); g.lineTo(0, bot - 4); g.stroke();
      } else {
        roundRect(g, -w / 2, top, w, bot - top, w * 0.25);
        g.fillStyle = 'rgba(255,214,90,0.20)'; g.fill();
        g.strokeStyle = 'rgba(255,226,130,0.95)'; g.lineWidth = 2.2; g.setLineDash([5, 4]); g.stroke(); g.setLineDash([]);
      }
      g.restore();
    }
    // room light falling across the whole instrument
    var lgt = g.createLinearGradient(G.cx - G.R, G.cy - G.R, G.cx + G.R, G.cy + G.R);
    lgt.addColorStop(0, 'rgba(255,248,225,0.16)'); lgt.addColorStop(0.45, 'rgba(255,248,225,0)');
    lgt.addColorStop(0.7, 'rgba(40,20,0,0)'); lgt.addColorStop(1, 'rgba(40,20,0,0.18)');
    g.fillStyle = lgt; g.beginPath(); g.arc(G.cx, G.cy, G.R, 0, TAU); g.fill();
    // brass hub with engraved shift number (does not turn)
    var hr = G.R * 0.16, cx = G.cx, cy = G.cy;
    g.save();
    g.shadowColor = 'rgba(30,15,0,0.5)'; g.shadowBlur = hr * 0.35; g.shadowOffsetY = hr * 0.12;
    var hub = g.createRadialGradient(cx - hr * 0.35, cy - hr * 0.4, hr * 0.1, cx, cy, hr);
    hub.addColorStop(0, '#fff6cf'); hub.addColorStop(0.35, '#e4bd62'); hub.addColorStop(0.8, '#9a6c20'); hub.addColorStop(1, '#5a3a0a');
    g.fillStyle = hub; g.beginPath(); g.arc(cx, cy, hr, 0, TAU); g.fill();
    g.restore();
    g.strokeStyle = 'rgba(60,35,5,0.6)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, hr * 0.82, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,245,210,0.5)'; g.beginPath(); g.arc(cx + 0.6, cy + 0.8, hr * 0.82, 0, TAU); g.stroke();
    var sh = this.shift();
    engrave(g, String(sh), cx, cy + hr * 0.08, 0, hr * 0.9);
    g.font = '700 ' + (hr * 0.22) + 'px "Courier New", Courier, monospace';
    g.textAlign = 'center'; g.fillStyle = 'rgba(60,35,5,0.75)';
    g.fillText('SHIFT', cx, cy - hr * 0.5);
    // specular glint on the hub
    var gl = g.createRadialGradient(cx - hr * 0.45, cy - hr * 0.5, 0, cx - hr * 0.45, cy - hr * 0.5, hr * 0.5);
    gl.addColorStop(0, 'rgba(255,255,255,0.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(cx, cy, hr, 0, TAU); g.fill();
  };
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    g.closePath();
  }
  CaesarWheel.prototype._bind = function() {
    var self = this, c = this.c;
    function pt(e) {
      var r = c.getBoundingClientRect();
      return { x: (e.clientX - r.left) * self.S / r.width, y: (e.clientY - r.top) * self.S / r.height };
    }
    this._down = function(e) {
      var p = pt(e), G = self._geom(), dx = p.x - G.cx, dy = p.y - G.cy, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > G.R) return;
      audio();
      c.setPointerCapture && c.setPointerCapture(e.pointerId);
      self.drag = { a: Math.atan2(dy, dx), t: performance.now(), moved: 0, start: p, onDisc: dist < G.rDisc, dist: dist };
      self.omega = 0; self.target = null; self.vHist = [];
      self.kick();
      e.preventDefault();
    };
    this._move = function(e) {
      if (!self.drag) return;
      var p = pt(e), G = self._geom(), a = Math.atan2(p.y - G.cy, p.x - G.cx);
      var d = a - self.drag.a; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
      var now = performance.now(), dt = Math.max(1, now - self.drag.t);
      self.phi += d; self.drag.a = a; self.drag.t = now; self.drag.moved += Math.abs(d);
      self.vHist.push({ v: d / (dt / 1000), t: now }); if (self.vHist.length > 6) self.vHist.shift();
      self._checkTick();
    };
    this._up = function(e) {
      if (!self.drag) return;
      var dr = self.drag; self.drag = null;
      if (dr.moved < 0.04) {
        // tap → select a column (letters are on the ring or disc)
        var G = self._geom(), a2 = Math.atan2(dr.start.y - G.cy, dr.start.x - G.cx);
        if (dr.dist > G.R * 0.2) {
          var rel = dr.onDisc ? a2 : a2;
          var idx = Math.round((rel + Math.PI / 2) / self.step());
          idx = ((idx % self.N()) + self.N()) % self.N();
          self.sel = self.sel === idx ? -1 : idx; tick(0.5); self._emit();
        }
      } else {
        var now = performance.now(), vs = self.vHist.filter(function(h) { return now - h.t < 90; });
        var v = vs.length ? vs.reduce(function(s, h) { return s + h.v; }, 0) / vs.length : 0;
        self.omega = clamp(v, -18, 18);
      }
      self.kick();
    };
    c.addEventListener('pointerdown', this._down);
    c.addEventListener('pointermove', this._move);
    c.addEventListener('pointerup', this._up);
    c.addEventListener('pointercancel', this._up);
    this._rs = function() { self.resize(); };
    window.addEventListener('resize', this._rs);
  };
  CaesarWheel.prototype.destroy = function() {
    this.alive = false; if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._rs);
  };

  // ---------------------------------------------------------------
  //  SVG helpers
  // ---------------------------------------------------------------
  var _uid = 0;
  function uid(p) { _uid++; return (p || 'g') + _uid; }
  function brassStops(id, vertical, dark) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="' + (vertical ? 1 : 0) + '">' +
      '<stop offset="0" stop-color="' + (dark ? '#d9b062' : '#fff4c8') + '"/>' +
      '<stop offset="0.22" stop-color="#e8c36a"/>' +
      '<stop offset="0.5" stop-color="#b0812c"/>' +
      '<stop offset="0.78" stop-color="#6b4713"/>' +
      '<stop offset="1" stop-color="#c79a46"/></linearGradient>';
  }
  function woodGrainPaths(r, x0, y0, w, h, count, color, maxA) {
    var s = '';
    for (var i = 0; i < count; i++) {
      var y = y0 + r() * h, amp = 1 + r() * 3, f = 0.01 + r() * 0.02, ph = r() * 6;
      var d = 'M' + x0 + ' ' + y.toFixed(1);
      for (var x = x0; x <= x0 + w; x += 16) {
        d += ' L' + x + ' ' + (y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1 + ph) * amp * 0.3).toFixed(1);
      }
      s += '<path d="' + d + '" stroke="' + color + '" stroke-opacity="' + (0.08 + r() * (maxA || 0.25)).toFixed(2) +
        '" stroke-width="' + (0.5 + r() * 1.6).toFixed(1) + '" fill="none"/>';
    }
    return s;
  }

  // ---------------------------------------------------------------
  //  TELEGRAPH KEY (SVG, side view). Lever group pivots at (205,128).
  // ---------------------------------------------------------------
  function telegraphKeySVG() {
    var id = uid('tk'), r = rng(1844);
    var B = id + 'b', BV = id + 'bv', W1 = id + 'w1', W2 = id + 'w2', K = id + 'k', SH = id + 'sh', CL = id + 'cl', SIL = id + 's', VN = id + 'vn';
    var grainTop = woodGrainPaths(r, 30, 178, 590, 26, 28, '#2a1405', 0.3);
    var grainFront = woodGrainPaths(r, 30, 206, 590, 40, 22, '#1f0e03', 0.35);
    function post(x, y, h, w) {
      return '<rect x="' + (x - w / 2) + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="url(#' + B + ')"/>' +
        '<ellipse cx="' + x + '" cy="' + (y + h) + '" rx="' + (w / 2 + 3) + '" ry="3" fill="#6b4713"/>';
    }
    function knurl(x, y, w, h) {
      var s = '<rect x="' + (x - w / 2) + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2.5" fill="url(#' + B + ')"/>';
      for (var i = 1; i < 8; i++) s += '<line x1="' + (x - w / 2 + i * w / 8) + '" y1="' + (y + 1) + '" x2="' + (x - w / 2 + i * w / 8) + '" y2="' + (y + h - 1) + '" stroke="#5c3c0c" stroke-opacity="0.55" stroke-width="0.8"/>';
      return s + '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (w / 2) + '" ry="2.4" fill="#f8e3a0"/>';
    }
    function screwHead(x, y, rr) {
      return '<circle cx="' + x + '" cy="' + y + '" r="' + rr + '" fill="url(#' + BV + ')" stroke="#5c3c0c" stroke-width="0.8"/>' +
        '<line x1="' + (x - rr * 0.7) + '" y1="' + (y - rr * 0.3) + '" x2="' + (x + rr * 0.7) + '" y2="' + (y + rr * 0.3) + '" stroke="#4a2f08" stroke-width="1.6" stroke-linecap="round"/>';
    }
    // coil spring between lever (y≈136) and base (y≈186) at x=300
    var coil = '';
    for (var c = 0; c < 9; c++) {
      var yy = 140 + c * 5;
      coil += '<path d="M292 ' + yy + ' Q300 ' + (yy - 3.5) + ' 308 ' + (yy + 1.5) + '" stroke="url(#' + BV + ')" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
              '<path d="M292 ' + yy + ' Q300 ' + (yy - 3.5) + ' 308 ' + (yy + 1.5) + '" stroke="#fff3c0" stroke-opacity="0.6" stroke-width="0.8" fill="none"/>';
    }
    return '<svg class="ms-key-svg" viewBox="0 0 640 270" role="img" aria-label="Brass telegraph key on a wooden base">' +
      '<defs>' + brassStops(B, true) + brassStops(BV, false) +
        '<linearGradient id="' + W1 + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5f30"/><stop offset="1" stop-color="#6e3d1a"/></linearGradient>' +
        '<linearGradient id="' + W2 + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2f12"/><stop offset="0.5" stop-color="#47230c"/><stop offset="1" stop-color="#2c1405"/></linearGradient>' +
        '<linearGradient id="' + VN + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.6" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
        '<radialGradient id="' + K + '" cx="0.35" cy="0.25" r="0.9"><stop offset="0" stop-color="#6b6b72"/><stop offset="0.25" stop-color="#26262b"/><stop offset="1" stop-color="#050506"/></radialGradient>' +
        '<linearGradient id="' + SIL + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#a9aeb6"/><stop offset="1" stop-color="#5b6068"/></linearGradient>' +
        '<filter id="' + SH + '" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>' +
        '<clipPath id="' + CL + '"><path d="M44 178 L606 178 Q616 178 618 186 L622 204 L26 204 L30 186 Q34 178 44 178Z"/></clipPath>' +
      '</defs>' +
      // table shadow
      '<ellipse cx="324" cy="252" rx="306" ry="12" fill="#000" opacity="0.45" filter="url(#' + SH + ')"/>' +
      // base: top face + front face
      '<path d="M44 178 L606 178 Q616 178 618 186 L622 204 L26 204 L30 186 Q34 178 44 178Z" fill="url(#' + W1 + ')"/>' +
      '<g clip-path="url(#' + CL + ')">' + grainTop + '<rect x="20" y="178" width="610" height="26" fill="url(#' + VN + ')"/></g>' +
      '<path d="M26 204 L622 204 L620 246 Q619 250 614 250 L34 250 Q29 250 28 246Z" fill="url(#' + W2 + ')"/>' +
      '<g opacity="0.9">' + grainFront + '</g>' +
      '<path d="M26 204 L622 204" stroke="#c98a55" stroke-opacity="0.55" stroke-width="1.4"/>' +
      '<path d="M30 186 Q34 178 44 178 L606 178 Q616 178 618 186" stroke="#e0a774" stroke-opacity="0.5" stroke-width="1.2" fill="none"/>' +
      // brass name plate on the front
      '<rect x="270" y="215" width="108" height="22" rx="3" fill="url(#' + B + ')" stroke="#4a2f08" stroke-width="0.8"/>' +
      '<text x="324" y="230" text-anchor="middle" font-family="Georgia,serif" font-size="10" font-weight="700" letter-spacing="1" fill="#4a2f08">TELÉGRAFO</text>' +
      screwHead(278, 226, 2.6) + screwHead(370, 226, 2.6) +
      // binding posts (wire terminals) at the back
      post(78, 156, 26, 14) + knurl(78, 142, 20, 14) + post(122, 156, 26, 14) + knurl(122, 142, 20, 14) +
      '<path d="M78 170 C 60 200, 30 212, 10 216" stroke="#7a3b12" stroke-width="3.5" fill="none"/>' +
      '<path d="M122 170 C 110 210, 60 226, 10 232" stroke="#2a2a2a" stroke-width="3.5" fill="none"/>' +
      // pivot yoke (trunnion)
      '<path d="M186 186 L190 120 L220 120 L224 186Z" fill="url(#' + BV + ')" stroke="#5c3c0c" stroke-width="0.8"/>' +
      '<ellipse cx="205" cy="186" rx="24" ry="4" fill="#5c3c0c"/>' +
      // contact anvil (lower contact) at x=470
      post(470, 160, 26, 12) +
      '<rect x="464" y="153" width="12" height="8" rx="2" fill="url(#' + SIL + ')"/>' +
      // spring base cup
      '<ellipse cx="300" cy="186" rx="12" ry="3.2" fill="#5c3c0c"/><rect x="291" y="178" width="18" height="8" rx="2" fill="url(#' + B + ')"/>' +
      '<g class="ms-spring" style="transform-origin:300px 186px">' + coil + '</g>' +
      // shadow cast by the lever on the base (moves with press)
      '<ellipse class="ms-lever-shadow" cx="380" cy="182" rx="190" ry="4" fill="#000" opacity="0.35" filter="url(#' + SH + ')"/>' +
      // LEVER GROUP
      '<g class="ms-lever" style="transform-origin:205px 128px">' +
        '<path d="M160 122 L540 124 Q548 125 548 131 L548 134 Q548 139 540 139 L160 137 Q152 136 152 129.5 Q152 123 160 122Z" fill="url(#' + B + ')" stroke="#4a2f08" stroke-width="0.8"/>' +
        '<path d="M162 124.5 L538 126.5" stroke="#fff6cc" stroke-opacity="0.8" stroke-width="1.2"/>' +
        // back-stop screw + locknut
        knurl(170, 108, 16, 12) + '<rect x="167" y="120" width="6" height="18" fill="url(#' + BV + ')"/>' +
        // tension screw through spring
        knurl(300, 108, 18, 13) + '<rect x="297" y="104" width="6" height="40" fill="url(#' + BV + ')"/>' +
        // upper contact
        '<rect x="464" y="139" width="12" height="9" rx="2" fill="url(#' + SIL + ')"/>' +
        knurl(470, 110, 16, 12) + '<rect x="467" y="104" width="6" height="22" fill="url(#' + BV + ')"/>' +
        // pivot axle screw
        screwHead(205, 128, 9) +
        // knob stem + bakelite knob + skirt
        '<rect x="532" y="104" width="14" height="22" fill="url(#' + BV + ')"/>' +
        '<path d="M504 92 Q506 70 539 68 Q572 70 574 92 Q574 104 539 106 Q504 104 504 92Z" fill="url(#' + K + ')"/>' +
        '<ellipse cx="539" cy="74" rx="26" ry="5" fill="#9a9aa3" opacity="0.35"/>' +
        '<path d="M514 80 Q522 72 538 71" stroke="#fff" stroke-opacity="0.55" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M506 99 Q539 111 572 99 L571 102 Q539 115 507 102Z" fill="#141416"/>' +
        '<path d="M509 100 Q539 110 569 100" stroke="#6a6a72" stroke-width="0.8" fill="none"/>' +
        '<ellipse cx="539" cy="106" rx="12" ry="2.5" fill="#000" opacity="0.35"/>' +
      '</g>' +
      '</svg>';
  }

  // Signal lamp: brass housing + glass lens; .on lights it.
  function lampSVG() {
    var id = uid('lp'), B = id + 'b', G = id + 'g', H = id + 'h', BL = id + 'bl', GL = id + 'gl';
    return '<svg class="ms-lamp-svg" viewBox="0 0 120 150" role="img" aria-label="Signal lamp">' +
      '<defs>' + brassStops(B, false) +
        '<radialGradient id="' + G + '" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#fffbe8"/><stop offset="0.35" stop-color="#ffe27a"/><stop offset="0.8" stop-color="#f59e0b"/><stop offset="1" stop-color="#b45309"/></radialGradient>' +
        '<radialGradient id="' + GL + '" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#8a8f87"/><stop offset="0.6" stop-color="#4a4a3c"/><stop offset="1" stop-color="#262620"/></radialGradient>' +
        '<radialGradient id="' + H + '"><stop offset="0" stop-color="#ffe9a0" stop-opacity="0.9"/><stop offset="1" stop-color="#ffb020" stop-opacity="0"/></radialGradient>' +
        '<filter id="' + BL + '"><feGaussianBlur stdDeviation="3"/></filter>' +
      '</defs>' +
      '<ellipse cx="60" cy="140" rx="42" ry="6" fill="#000" opacity="0.4" filter="url(#' + BL + ')"/>' +
      '<circle class="ms-lamp-halo" cx="60" cy="58" r="58" fill="url(#' + H + ')"/>' +
      '<rect x="48" y="96" width="24" height="34" fill="url(#' + B + ')"/>' +
      '<path d="M26 136 Q26 126 60 126 Q94 126 94 136 L94 140 Q60 146 26 140Z" fill="url(#' + B + ')" stroke="#4a2f08" stroke-width="0.8"/>' +
      '<circle cx="60" cy="58" r="40" fill="url(#' + B + ')" stroke="#4a2f08" stroke-width="1"/>' +
      '<circle cx="60" cy="58" r="33" fill="#3b2a10"/>' +
      '<circle class="ms-lamp-off" cx="60" cy="58" r="30" fill="url(#' + GL + ')"/>' +
      '<circle class="ms-lamp-glow" cx="60" cy="58" r="30" fill="url(#' + G + ')"/>' +
      // fresnel rings
      '<g fill="none" stroke="#fff" stroke-opacity="0.18"><circle cx="60" cy="58" r="24"/><circle cx="60" cy="58" r="17"/><circle cx="60" cy="58" r="10"/></g>' +
      '<path d="M40 44 Q48 32 62 30" stroke="#fff" stroke-opacity="0.7" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<circle cx="24" cy="58" r="3" fill="#5c3c0c"/><circle cx="96" cy="58" r="3" fill="#5c3c0c"/>' +
      '</svg>';
  }

  // ---------------------------------------------------------------
  //  MORSE TREE (SVG). Dot = left, dash = right.
  // ---------------------------------------------------------------
  var TREE = ['', 'ET', 'IANM', 'SURWDKGO', 'HVF·L·PJBXCYZQ··'];
  function morseTreeSVG() {
    var W = 640, H = 262, top = 30, dy = 54, s = '', nodes = '';
    s += '<svg class="ms-tree-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Morse code tree: dot goes left, dash goes right">';
    function pos(level, i) { return { x: (i + 0.5) * W / Math.pow(2, level), y: top + level * dy }; }
    for (var L = 1; L <= 4; L++) {
      for (var i = 0; i < Math.pow(2, L); i++) {
        var p = pos(L, i), par = pos(L - 1, Math.floor(i / 2)), isDash = i % 2 === 1;
        var code = ''; for (var b = L - 1; b >= 0; b--) code += ((i >> b) & 1) ? '-' : '.';
        s += '<line class="ms-tree-edge" data-code="' + code + '" x1="' + par.x + '" y1="' + par.y + '" x2="' + p.x + '" y2="' + p.y + '"' +
          (isDash ? '' : ' stroke-dasharray="1 5"') + '/>';
        var ch = TREE[L][i], r = L === 4 ? 12 : 15;
        nodes += '<g class="ms-tree-node' + (ch === '·' ? ' empty' : '') + '" data-code="' + code + '">' +
          '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '"/>' +
          (ch === '·' ? '' : '<text x="' + p.x + '" y="' + (p.y + 5) + '" text-anchor="middle">' + ch + '</text>') + '</g>';
      }
    }
    var root = pos(0, 0);
    nodes += '<g class="ms-tree-node root" data-code=""><circle cx="' + root.x + '" cy="' + root.y + '" r="15"/><text x="' + root.x + '" y="' + (root.y + 4) + '" text-anchor="middle" class="sm">START</text></g>';
    s += nodes;
    s += '<text x="10" y="18" class="ms-tree-legend">· dot → left</text><text x="' + (W - 10) + '" y="18" text-anchor="end" class="ms-tree-legend">dash → right —</text>';
    return s + '</svg>';
  }
  function highlightTree(svg, code) {
    if (!svg) return;
    var els = svg.querySelectorAll('[data-code]');
    for (var i = 0; i < els.length; i++) {
      var c = els[i].getAttribute('data-code');
      var on = code != null && code.indexOf(c) === 0 && (c.length > 0 || els[i].tagName === 'g');
      els[i].classList.toggle('on', !!on && c.length <= code.length);
      els[i].classList.toggle('here', c === code);
    }
  }

  // ---------------------------------------------------------------
  //  PIGPEN glyph as ink strokes (inline SVG string)
  // ---------------------------------------------------------------
  function pigpenSVG(ch, info, size, seed) {
    if (!info) return '';
    var r = rng(seed || ch.charCodeAt(0) * 31 + 7);
    function j(v) { return (v + (r() - 0.5) * 1.6).toFixed(1); }
    var a = 7, b = 33, m = 20, pts = [];
    if (info.kind === 'grid') {
      // walls exist where the cell touches a neighbour
      var top = info.r > 0, bottom = info.r < 2, left = info.c > 0, right = info.c < 2;
      // build as one continuous stroke going around the walls
      var seq = [];
      if (top && left && right && bottom) seq = [[a, a], [b, a], [b, b], [a, b], [a, a]];
      else {
        // order walls clockwise starting after the open side
        var walls = [['top', [a, a], [b, a]], ['right', [b, a], [b, b]], ['bottom', [b, b], [a, b]], ['left', [a, b], [a, a]]];
        var has = { top: top, right: right, bottom: bottom, left: left };
        var startIdx = 0;
        for (var w = 0; w < 4; w++) if (!has[walls[w][0]]) { startIdx = (w + 1) % 4; }
        for (var w2 = 0; w2 < 4; w2++) {
          var wl = walls[(startIdx + w2) % 4];
          if (!has[wl[0]]) { if (seq.length) { pts.push(seq); seq = []; } continue; }
          if (!seq.length) seq.push(wl[1]);
          seq.push(wl[2]);
        }
      }
      if (seq.length) pts.push(seq);
    } else {
      var reg = info.region;
      if (reg === 'top') pts.push([[a, a + 2], [m, b], [b, a + 2]]);
      if (reg === 'bottom') pts.push([[a, b - 2], [m, a], [b, b - 2]]);
      if (reg === 'left') pts.push([[a + 2, a], [b, m], [a + 2, b]]);
      if (reg === 'right') pts.push([[b - 2, a], [a, m], [b - 2, b]]);
    }
    var d = pts.map(function(line) {
      var s = 'M' + j(line[0][0]) + ' ' + j(line[0][1]);
      for (var i = 1; i < line.length; i++) {
        var p0 = line[i - 1], p1 = line[i];
        var mx = (p0[0] + p1[0]) / 2 + (r() - 0.5) * 1.8, my = (p0[1] + p1[1]) / 2 + (r() - 0.5) * 1.8;
        s += ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + j(p1[0]) + ' ' + j(p1[1]);
      }
      return s;
    }).join(' ');
    var dot = '';
    if (info.dot) {
      var dx = m, dy2 = m;
      if (info.kind === 'x') {
        if (info.region === 'top') dy2 = 13; if (info.region === 'bottom') dy2 = 27;
        if (info.region === 'left') dx = 13; if (info.region === 'right') dx = 27;
      }
      dot = '<circle cx="' + j(dx) + '" cy="' + j(dy2) + '" r="2.9" class="ink-dot"/>';
    }
    var tilde = info.tilde ? '<path d="M12 4 Q16 0 20 3 Q24 6 28 2" class="ink-thin"/>' : '';
    return '<svg class="ms-pig" viewBox="0 0 40 40" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<path d="' + d + '" class="ink-bleed"/><path d="' + d + '" class="ink"/>' + dot + tilde + '</svg>';
  }
  // Shared ink filter (rough edges). Inserted once into the page.
  function inkDefs() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<filter id="ms-ink" x="-10%" y="-10%" width="120%" height="120%">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.4"/></filter>' +
      '</defs></svg>';
  }

  // ---------------------------------------------------------------
  //  SCYTALE (canvas): helical strip on a turning wooden rod.
  // ---------------------------------------------------------------
  function Scytale(canvas, opts) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.opts = opts || {};
    this.strip = 'SCYTALE'; this.rows = 3; this.rot = 0; this.omega = 0;
    this.rr = null; this.drag = null; this.raf = 0; this.alive = true;
    this.grain = []; var r = rng(400);
    for (var i = 0; i < 46; i++) this.grain.push({ a: r() * TAU, f: 0.004 + r() * 0.01, p: r() * 6, amp: 0.02 + r() * 0.06, w: 0.5 + r() * 1.4, dark: r() < 0.7, o: 0.15 + r() * 0.35 });
    this._bind(); this.resize();
  }
  Scytale.prototype.set = function(strip, rows) {
    if (strip != null) this.strip = strip;
    if (rows != null) this.rows = rows;
    this.kick();
  };
  Scytale.prototype.frontRow = function() {
    var R = this.rows, best = 0, bestC = -2;
    for (var r = 0; r < R; r++) {
      var a = TAU * (r + 0.5) / R + this.rot, c = Math.cos(a);
      if (c > bestC) { bestC = c; best = r; }
    }
    return best;
  };
  Scytale.prototype.resize = function() {
    var rect = this.c.getBoundingClientRect();
    this.W = Math.max(260, Math.round(rect.width || 600));
    this.H = Math.round(clamp(this.W * 0.42, 200, 330));
    this.k = dpr();
    this.c.width = Math.round(this.W * this.k); this.c.height = Math.round(this.H * this.k);
    this.c.style.height = this.H + 'px';
    this.kick();
  };
  Scytale.prototype.kick = function() {
    if (this.raf || !this.alive) return;
    var self = this, last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var busy = self._physics(dt); self._draw();
      self.raf = busy ? requestAnimationFrame(frame) : 0;
    }
    this.raf = requestAnimationFrame(frame);
  };
  Scytale.prototype._targetRR = function() {
    return clamp(this.H * (0.085 + 0.032 * this.rows), 18, this.H * 0.36);
  };
  Scytale.prototype._physics = function(dt) {
    var busy = false, tr = this._targetRR();
    if (this.rr == null) this.rr = tr;
    if (Math.abs(this.rr - tr) > 0.2) { this.rr += (tr - this.rr) * Math.min(1, dt * 8); busy = true; } else this.rr = tr;
    if (this.drag) return true;
    var stepA = TAU / this.rows;
    if (Math.abs(this.omega) > 0.3) { this.rot += this.omega * dt; this.omega *= Math.exp(-dt * 3); busy = true; }
    else {
      this.omega = 0;
      // snap so the nearest row faces front: rot = -TAU*(r+0.5)/R
      var t = -(this.rot / stepA) - 0.5, snap = -(Math.round(t) + 0.5) * stepA, e = snap - this.rot;
      if (Math.abs(e) > 0.001) { this.rot += e * Math.min(1, dt * 10); busy = true; } else this.rot = snap;
    }
    var fr = this.frontRow();
    if (fr !== this._lastFront) { if (this._lastFront != null) tick(0.5); this._lastFront = fr; if (this.opts.onRow) this.opts.onRow(fr); }
    return busy;
  };
  Scytale.prototype._draw = function() {
    var g = this.g, W = this.W, H = this.H, k = this.k, rr = this.rr || this._targetRR();
    g.setTransform(k, 0, 0, k, 0, 0); g.clearRect(0, 0, W, H);
    var cy = H * 0.5, x0 = W * 0.07, x1 = W * 0.95, capRx = rr * 0.26;
    var R = this.rows, n = this.strip.length, cols = Math.ceil(n / R);
    var colW = Math.min((x1 - x0 - 40) / (cols + 0.6), 64), xs = x0 + 14 + colW * 0.5;
    // cast shadow on the desk
    g.save(); g.filter = 'blur(8px)'; g.fillStyle = 'rgba(0,0,0,0.45)';
    g.beginPath(); g.ellipse((x0 + x1) / 2 + 10, cy + rr + 16, (x1 - x0) / 2, rr * 0.22 + 6, 0, 0, TAU); g.fill(); g.restore();
    // rod body
    var body = g.createLinearGradient(0, cy - rr, 0, cy + rr);
    body.addColorStop(0, '#3a1f0c'); body.addColorStop(0.18, '#8a5428'); body.addColorStop(0.36, '#c58a50');
    body.addColorStop(0.5, '#a86c38'); body.addColorStop(0.8, '#5b3214'); body.addColorStop(1, '#2a1406');
    g.fillStyle = body;
    g.beginPath(); g.moveTo(x0, cy - rr); g.lineTo(x1, cy - rr); g.ellipse(x1, cy, capRx, rr, 0, -Math.PI / 2, Math.PI / 2); g.lineTo(x0, cy + rr); g.closePath(); g.fill();
    // grain that turns with the rod
    g.save(); g.beginPath(); g.rect(x0, cy - rr, x1 - x0, rr * 2); g.clip();
    for (var gi = 0; gi < this.grain.length; gi++) {
      var gr = this.grain[gi];
      g.beginPath();
      var vis = false;
      for (var x = x0; x <= x1; x += 10) {
        var a = gr.a + this.rot + Math.sin(x * gr.f + gr.p) * gr.amp;
        var ca = Math.cos(a); if (ca <= 0) { vis = false; continue; }
        var y = cy + rr * Math.sin(a);
        if (!vis) { g.moveTo(x, y); vis = true; } else g.lineTo(x, y);
      }
      g.strokeStyle = gr.dark ? 'rgba(45,22,6,' + gr.o + ')' : 'rgba(240,190,130,' + (gr.o * 0.6) + ')';
      g.lineWidth = gr.w; g.stroke();
    }
    g.restore();
    // left end cap with growth rings
    var capG = g.createRadialGradient(x0 - capRx * 0.2, cy - rr * 0.2, 0, x0, cy, rr);
    capG.addColorStop(0, '#e0b07a'); capG.addColorStop(0.7, '#b47a44'); capG.addColorStop(1, '#6e4220');
    g.fillStyle = capG; g.beginPath(); g.ellipse(x0, cy, capRx, rr, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(90,50,20,0.45)'; g.lineWidth = 0.8;
    for (var ri = 1; ri < 6; ri++) { g.beginPath(); g.ellipse(x0 + ri * 0.2, cy, capRx * ri / 6, rr * ri / 6, 0, 0, TAU); g.stroke(); }
    g.strokeStyle = 'rgba(40,20,5,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x0, cy, capRx, rr, 0, 0, TAU); g.stroke();
    // the strip: helix, one turn per column
    var rs = rr * 1.035, bandW = colW * 0.94, steps = 28;
    var total = n / R;
    for (var t = 0; t < total; t += 1 / (R * steps)) {
      var tA = t, tB = Math.min(total, t + 1 / (R * steps));
      var aA = TAU * tA + this.rot, aB = TAU * tB + this.rot;
      var cA = Math.cos(aA), cB = Math.cos(aB);
      if (cA <= 0 && cB <= 0) continue;
      var yA = cy + rs * Math.sin(aA), yB = cy + rs * Math.sin(aB);
      var xA = xs + tA * colW, xB = xs + tB * colW;
      var light = clamp(0.3 + 0.7 * Math.pow(Math.max(0, Math.cos((aA + aB) / 2 + 0.4)), 1.5), 0, 1);
      var cr = Math.round(128 + (246 - 128) * light), cg2 = Math.round(94 + (232 - 94) * light), cb = Math.round(54 + (192 - 54) * light);
      g.fillStyle = 'rgb(' + cr + ',' + cg2 + ',' + cb + ')';
      var ov = yB > yA ? 0.7 : -0.7;
      g.beginPath();
      g.moveTo(xA - bandW / 2, yA - ov); g.lineTo(xA + bandW / 2, yA - ov); g.lineTo(xB + bandW / 2, yB + ov); g.lineTo(xB - bandW / 2, yB + ov);
      g.closePath(); g.fill();
      // edges
      g.strokeStyle = 'rgba(110,70,30,0.55)'; g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(xA - bandW / 2, yA); g.lineTo(xB - bandW / 2, yB); g.moveTo(xA + bandW / 2, yA); g.lineTo(xB + bandW / 2, yB); g.stroke();
    }
    // letters
    var arc = TAU * rs / R;
    var fs = Math.min(colW * 0.62, arc * 0.62, 30);
    var front = this.frontRow();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (var q = 0; q < n; q++) {
      var tq = (q + 0.5) / R, aq = TAU * tq + this.rot, cq = Math.cos(aq);
      if (cq < 0.12) continue;
      var yq = cy + rs * Math.sin(aq), xq = xs + tq * colW;
      g.save(); g.translate(xq, yq); g.scale(1, cq);
      var isFront = (q % R) === front && cq > 0.8;
      g.font = '700 ' + fs + 'px "Courier New", Courier, monospace';
      g.fillStyle = isFront ? 'rgba(120,24,14,' + (0.5 + 0.5 * cq) + ')' : 'rgba(40,26,12,' + (0.25 + 0.7 * cq) + ')';
      g.fillText(this.strip[q], 0, 1);
      g.restore();
    }
    // top highlight + soft rim light
    var hl = g.createLinearGradient(0, cy - rr, 0, cy);
    hl.addColorStop(0, 'rgba(255,230,190,0)'); hl.addColorStop(0.35, 'rgba(255,235,200,0.16)'); hl.addColorStop(1, 'rgba(255,235,200,0)');
    g.fillStyle = hl; g.fillRect(x0, cy - rr * 1.05, x1 - x0, rr);
    // reading guide on the front line
    g.strokeStyle = 'rgba(178,40,24,0.35)'; g.setLineDash([6, 6]); g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0 + 8, cy + fs * 0.62); g.lineTo(x1 - 8, cy + fs * 0.62); g.stroke(); g.setLineDash([]);
  };
  Scytale.prototype._bind = function() {
    var self = this, c = this.c;
    this._down = function(e) {
      audio();
      c.setPointerCapture && c.setPointerCapture(e.pointerId);
      self.drag = { y: e.clientY, t: performance.now() }; self.omega = 0; self.vh = [];
      self.kick(); e.preventDefault();
    };
    this._move = function(e) {
      if (!self.drag) return;
      var dy = e.clientY - self.drag.y, now = performance.now(), dt = Math.max(1, now - self.drag.t);
      var da = -dy / Math.max(20, self.rr || 40);
      self.rot += da; self.drag.y = e.clientY; self.drag.t = now;
      self.vh.push({ v: da / (dt / 1000), t: now }); if (self.vh.length > 6) self.vh.shift();
    };
    this._up = function() {
      if (!self.drag) return; self.drag = null;
      var now = performance.now(), vs = (self.vh || []).filter(function(h) { return now - h.t < 90; });
      self.omega = vs.length ? clamp(vs.reduce(function(s, h) { return s + h.v; }, 0) / vs.length, -14, 14) : 0;
      self.kick();
    };
    c.addEventListener('pointerdown', this._down);
    c.addEventListener('pointermove', this._move);
    c.addEventListener('pointerup', this._up);
    c.addEventListener('pointercancel', this._up);
    this._rs = function() { self.resize(); };
    window.addEventListener('resize', this._rs);
  };
  Scytale.prototype.turn = function(dir) {
    this.omega = 0; this.rot -= dir * TAU / this.rows; this.kick();
  };
  Scytale.prototype.destroy = function() {
    this.alive = false; if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this._rs);
  };

  // ---------------------------------------------------------------
  //  Small illustrations (history cards + tool tiles)
  // ---------------------------------------------------------------
  function art(kind) {
    var id = uid('a'), B = id + 'b', P = id + 'p', W = id + 'w', S = id + 's';
    var defs = '<defs>' + brassStops(B, true) +
      '<linearGradient id="' + P + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ecd2"/><stop offset="1" stop-color="#dcc597"/></linearGradient>' +
      '<linearGradient id="' + W + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1f0c"/><stop offset="0.3" stop-color="#b07440"/><stop offset="0.5" stop-color="#8e5a2c"/><stop offset="1" stop-color="#2e1606"/></linearGradient>' +
      '<filter id="' + S + '"><feGaussianBlur stdDeviation="2.2"/></filter></defs>';
    var o = '<svg viewBox="0 0 160 110" class="ms-art" aria-hidden="true">' + defs +
      '<ellipse cx="80" cy="100" rx="62" ry="6" fill="#000" opacity="0.35" filter="url(#' + S + ')"/>';
    var r = rng(kind.length * 97);
    switch (kind) {
      case 'caesar': case 'wheel':
        var wh = '<circle cx="80" cy="54" r="44" fill="url(#' + B + ')" stroke="#4a2f08"/>' +
             '<circle cx="80" cy="54" r="31" fill="url(#' + P + ')" stroke="#7a4a1a" stroke-width="0.8"/>';
        for (var i = 0; i < 26; i++) {
          var a = -Math.PI / 2 + i * TAU / 26, L = String.fromCharCode(65 + i), L2 = String.fromCharCode(65 + (i + 3) % 26);
          var ox = (80 + Math.cos(a) * 38).toFixed(1), oy = (54 + Math.sin(a) * 38).toFixed(1), ix = (80 + Math.cos(a) * 26).toFixed(1), iy = (54 + Math.sin(a) * 26).toFixed(1), rot = (a * 180 / Math.PI + 90).toFixed(1);
          wh += '<text x="' + ox + '" y="' + (+oy + 2.3) + '" font-size="6.4" font-weight="700" text-anchor="middle" fill="#3b2406" font-family="Georgia,serif" transform="rotate(' + rot + ' ' + ox + ' ' + oy + ')">' + L + '</text>' +
               '<text x="' + ix + '" y="' + (+iy + 2) + '" font-size="5.4" font-weight="700" text-anchor="middle" fill="#8a1e12" font-family="Georgia,serif" transform="rotate(' + rot + ' ' + ix + ' ' + iy + ')">' + L2 + '</text>';
        }
        wh += '<circle cx="80" cy="54" r="7" fill="url(#' + B + ')" stroke="#4a2f08"/><circle cx="77.5" cy="51.5" r="2" fill="#fff" opacity="0.6"/>';
        if (kind === 'caesar') {
          // Roman wax tablet with a shifted message, wheel resting on it
          o += '<g transform="rotate(-9 46 60)"><rect x="10" y="24" width="72" height="70" rx="4" fill="url(#' + W + ')"/>' +
               '<rect x="16" y="30" width="60" height="58" rx="2" fill="#2e2418"/><rect x="16" y="30" width="60" height="6" fill="#000" opacity="0.25"/>' +
               '<text x="46" y="52" font-family="Courier New,monospace" font-size="9" font-weight="700" fill="#cdb88c" text-anchor="middle">DWWDFN</text>' +
               '<text x="46" y="66" font-family="Courier New,monospace" font-size="9" font-weight="700" fill="#cdb88c" text-anchor="middle">DW GDZQ</text>' +
               '<line x1="22" y1="76" x2="70" y2="76" stroke="#cdb88c" stroke-opacity="0.4" stroke-width="0.8"/></g>' +
               '<rect x="8" y="86" width="64" height="3.5" rx="1.7" fill="url(#' + B + ')" transform="rotate(-24 40 88)"/>' +
               '<g transform="translate(58 14) scale(0.76)"><ellipse cx="82" cy="102" rx="40" ry="5" fill="#000" opacity="0.35" filter="url(#' + S + ')"/>' + wh + '</g>';
        } else o += wh;
        break;
      case 'scytale':
        o += '<rect x="14" y="40" width="132" height="30" rx="4" fill="url(#' + W + ')"/>' +
             '<ellipse cx="14" cy="55" rx="5" ry="15" fill="#c48e58" stroke="#5c3214" stroke-width="0.8"/>';
        for (var s2 = 0; s2 < 9; s2++) {
          var x = 24 + s2 * 13;
          o += '<path d="M' + x + ' 39 L' + (x + 10) + ' 39 L' + (x + 16) + ' 71 L' + (x + 6) + ' 71Z" fill="#ecdcb4" stroke="#8a5a2a" stroke-width="0.6"/>' +
               '<text x="' + (x + 8) + '" y="59" font-size="8" font-family="Courier New,monospace" font-weight="700" text-anchor="middle" fill="#3a2410">' + 'SPARTANS!'[s2] + '</text>';
        }
        o += '<path d="M146 50 Q156 70 140 88 Q130 98 150 104" stroke="#ecdcb4" stroke-width="7" fill="none"/>';
        break;
      case 'polybius':
        o += '<rect x="44" y="12" width="76" height="76" rx="3" fill="url(#' + P + ')" stroke="#7a4a1a"/>';
        var A5 = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';
        for (var pr = 0; pr < 5; pr++) for (var pc = 0; pc < 5; pc++) {
          o += '<text x="' + (55 + pc * 14) + '" y="' + (27 + pr * 14) + '" font-size="9" font-family="Georgia,serif" font-weight="700" text-anchor="middle" fill="' + (pr === 2 && pc === 2 ? '#8a1e12' : '#3a2410') + '">' + A5[pr * 5 + pc] + '</text>';
        }
        o += '<g stroke="#7a4a1a" stroke-width="0.5">' + [1, 2, 3, 4].map(function(z) { return '<line x1="' + (48 + z * 14) + '" y1="16" x2="' + (48 + z * 14) + '" y2="86"/><line x1="48" y1="' + (16 + z * 14) + '" x2="118" y2="' + (16 + z * 14) + '"/>'; }).join('') + '</g>';
        [[20, 3], [140, 3]].forEach(function(t) {
          for (var q = 0; q < t[1]; q++) {
            var tx = t[0] + (q - 1) * 9;
            o += '<rect x="' + (tx - 2) + '" y="56" width="4" height="40" rx="1.5" fill="#6e3d1a"/>' +
                 '<path d="M' + tx + ' 36 Q' + (tx + 7) + ' 46 ' + tx + ' 58 Q' + (tx - 7) + ' 46 ' + tx + ' 36Z" fill="#f59e0b"/>' +
                 '<path d="M' + tx + ' 44 Q' + (tx + 3) + ' 50 ' + tx + ' 57 Q' + (tx - 3) + ' 50 ' + tx + ' 44Z" fill="#fff3b0"/>';
          }
        });
        break;
      case 'atbash':
        o += '<path d="M20 30 Q14 30 14 36 L14 80 Q14 86 20 86 L140 86 Q146 86 146 80 L146 36 Q146 30 140 30Z" fill="url(#' + P + ')" stroke="#7a4a1a"/>' +
             '<rect x="10" y="26" width="10" height="64" rx="5" fill="url(#' + W + ')"/><rect x="140" y="26" width="10" height="64" rx="5" fill="url(#' + W + ')"/>';
        var top = 'ABCDEFGHIJKLM', bot = 'ZYXWVUTSRQPON';
        for (var t2 = 0; t2 < 13; t2++) {
          o += '<text x="' + (30 + t2 * 8.4) + '" y="50" font-size="8" font-family="Georgia,serif" font-weight="700" text-anchor="middle" fill="#3a2410">' + top[t2] + '</text>' +
               '<text x="' + (30 + t2 * 8.4) + '" y="74" font-size="8" font-family="Georgia,serif" font-weight="700" text-anchor="middle" fill="#8a1e12">' + bot[t2] + '</text>';
        }
        o += '<line x1="22" y1="59" x2="138" y2="59" stroke="#8fa3ad" stroke-width="2.4"/><line x1="22" y1="58" x2="138" y2="58" stroke="#fff" stroke-width="0.8" opacity="0.8"/>';
        break;
      case 'morse':
        o += '<rect x="10" y="66" width="140" height="22" rx="3" fill="#7a4520"/><rect x="10" y="80" width="140" height="10" rx="2" fill="#4a250c"/>' +
             '<rect x="40" y="56" width="96" height="6" rx="2" fill="url(#' + B + ')" transform="rotate(-2 40 58)"/>' +
             '<rect x="40" y="52" width="10" height="16" fill="url(#' + B + ')"/>' +
             '<ellipse cx="130" cy="50" rx="14" ry="6" fill="#111"/><ellipse cx="127" cy="47.5" rx="7" ry="2" fill="#777" opacity="0.6"/>' +
             '<rect x="4" y="14" width="152" height="20" fill="url(#' + P + ')" stroke="#a8875a" stroke-width="0.6"/>';
        var tape = '.-- .... .- -', tx2 = 12;
        tape.split('').forEach(function(ch) {
          if (ch === '.') { o += '<circle cx="' + (tx2 + 2) + '" cy="24" r="2.2" fill="#1d2a4a"/>'; tx2 += 7; }
          else if (ch === '-') { o += '<rect x="' + tx2 + '" y="22" width="11" height="4" rx="2" fill="#1d2a4a"/>'; tx2 += 15; }
          else tx2 += 8;
        });
        break;
      case 'enigma':
        o += '<rect x="16" y="44" width="128" height="52" rx="5" fill="#2b2a26"/><rect x="16" y="44" width="128" height="8" rx="3" fill="#3d3b35"/>';
        for (var e = 0; e < 3; e++) {
          var ex = 54 + e * 26;
          o += '<rect x="' + (ex - 9) + '" y="14" width="18" height="40" rx="3" fill="#191917"/>' +
               '<rect x="' + (ex - 7) + '" y="18" width="14" height="32" rx="2" fill="url(#' + P + ')"/>';
          for (var ln = 0; ln < 5; ln++) o += '<line x1="' + (ex - 7) + '" y1="' + (21 + ln * 6.4) + '" x2="' + (ex + 7) + '" y2="' + (21 + ln * 6.4) + '" stroke="#8a7a5a" stroke-width="0.4"/>';
          o += '<text x="' + ex + '" y="37" font-size="9" font-weight="700" font-family="Courier New,monospace" text-anchor="middle" fill="#1a1a1a">' + 'QEV'[e] + '</text>' +
               '<rect x="' + (ex + 9) + '" y="20" width="4" height="28" rx="1" fill="url(#' + B + ')"/>';
        }
        for (var kr = 0; kr < 2; kr++) for (var kc = 0; kc < 8; kc++) {
          var kx = 28 + kc * 14.5 + kr * 7, ky = 66 + kr * 14;
          o += '<circle cx="' + kx + '" cy="' + ky + '" r="5.2" fill="#0d0d0c" stroke="#9a9a90" stroke-width="0.9"/>' +
               '<text x="' + kx + '" y="' + (ky + 2.4) + '" font-size="5.5" font-family="Arial,sans-serif" text-anchor="middle" fill="#eee">' + 'QWERTZUIASDFGHJK'[kr * 8 + kc] + '</text>';
        }
        break;
      case 'radio':
        o += '<defs><linearGradient id="' + id + 'od" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b7434"/><stop offset="0.5" stop-color="#4b5320"/><stop offset="1" stop-color="#2f3514"/></linearGradient>' +
             '<linearGradient id="' + id + 'hs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4a46"/><stop offset="1" stop-color="#121210"/></linearGradient></defs>' +
             '<line x1="98" y1="30" x2="128" y2="4" stroke="#2a2a26" stroke-width="2.4" stroke-linecap="round"/><circle cx="128" cy="4" r="2" fill="#555"/>' +
             '<rect x="24" y="30" width="86" height="64" rx="5" fill="url(#' + id + 'od)" stroke="#262b10"/>' +
             '<rect x="24" y="30" width="86" height="9" rx="4" fill="#7a843c" opacity="0.6"/>' +
             [30, 104].map(function(x5) { return '<circle cx="' + x5 + '" cy="36" r="1.6" fill="#262b10"/><circle cx="' + x5 + '" cy="88" r="1.6" fill="#262b10"/>'; }).join('') +
             '<rect x="34" y="46" width="40" height="22" rx="2" fill="#141610" stroke="#8a8f6a" stroke-width="0.8"/>' +
             '<path d="M37 60 Q41 50 45 58 T53 57 T61 55 T71 58" stroke="#a6d86e" stroke-width="1.2" fill="none"/>' +
             '<circle cx="92" cy="52" r="8" fill="#1a1a16" stroke="#b9b9a8" stroke-width="1"/><line x1="92" y1="52" x2="96" y2="46.5" stroke="#eee" stroke-width="1.3"/>' +
             '<circle cx="92" cy="76" r="5.5" fill="#1a1a16" stroke="#b9b9a8" stroke-width="1"/>' +
             '<rect x="32" y="74" width="46" height="10" rx="1" fill="#e6d9b4"/><text x="55" y="81.4" font-size="5.6" text-anchor="middle" font-family="Courier New,monospace" font-weight="700" fill="#333">CHAY-DA-GAHI</text>' +
             '<path d="M110 70 C118 66, 114 80, 122 76 C130 72, 126 86, 134 82" stroke="#1a1a18" stroke-width="1.8" fill="none"/>' +
             '<path d="M128 70 Q142 64 148 78 L150 94 Q146 102 136 98 L130 86 Q126 78 128 70Z" fill="url(#' + id + 'hs)"/>' +
             '<path d="M132 72 Q140 68 144 76" stroke="#777" stroke-width="1" fill="none" opacity="0.7"/>';
        break;
      case 'pigpen':
        o += '<rect x="22" y="14" width="116" height="80" rx="3" fill="url(#' + P + ')" stroke="#a8875a"/>' +
             '<g stroke="#1d2340" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M58 22 L58 86 M80 22 L80 86 M36 43 L102 43 M36 65 L102 65"/>' +
             '<path d="M110 30 L130 50 M130 30 L110 50"/><path d="M110 60 L130 80 M130 60 L110 80"/></g>' +
             '<g fill="#1d2340"><circle cx="69" cy="54" r="2.4"/><circle cx="120" cy="72" r="2"/></g>';
        break;
      case 'sub':
        o += '<rect x="16" y="12" width="128" height="80" rx="3" fill="url(#' + P + ')" stroke="#a8875a"/>';
        [28, 22, 18, 15, 13, 11, 9, 7, 5, 4, 3, 2].forEach(function(h, i3) {
          o += '<rect x="' + (26 + i3 * 9.5) + '" y="' + (84 - h * 2.2) + '" width="6" height="' + (h * 2.2) + '" rx="1.5" fill="' + (i3 < 3 ? '#B24A2E' : '#2A78B0') + '"/>';
        });
        o += '<line x1="22" y1="84.5" x2="138" y2="84.5" stroke="#7a5a3a" stroke-width="0.8"/>';
        break;
    }
    return o + '</svg>';
  }

  return {
    rng: rng, paperTile: paperTile, drawDesk: drawDesk, audio: audio, tick: tick, Tone: Tone,
    CaesarWheel: CaesarWheel, Scytale: Scytale,
    telegraphKeySVG: telegraphKeySVG, lampSVG: lampSVG,
    morseTreeSVG: morseTreeSVG, highlightTree: highlightTree,
    pigpenSVG: pigpenSVG, inkDefs: inkDefs, art: art
  };
})();
