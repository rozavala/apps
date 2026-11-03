/* ================================================================
   LAB EXPLORER — lab-explorer-art.js
   Hand-built art: the illustrated home cards (inline SVG) and the
   canvas helpers the labs share (clouds, sun, wood, glass, labels).
   No images, no network: everything is drawn in code.
   ================================================================ */

const LXArt = (() => {
  'use strict';

  let _uid = 0;
  // Each SVG gets its own id suffix: gradients inside a hidden screen
  // would otherwise be picked up by a visible copy and fail to paint.
  function _u(svg) { const u = 'lx' + (++_uid); return svg.replace(/\{u\}/g, u); }

  // ── Small utilities ──
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  }
  function hex(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function toHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  }
  function rgba(h, a) { const c = hex(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function shade(h, amt) { return amt >= 0 ? mix(h, '#ffffff', amt) : mix(h, '#000000', -amt); }

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function offscreen(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  }

  // Soft contact shadow under an object.
  function shadow(ctx, x, y, rx, ry, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, 'rgba(20,15,10,' + (a == null ? 0.35 : a) + ')');
    g.addColorStop(1, 'rgba(20,15,10,0)');
    ctx.save();
    ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, rx, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // A readable label on any background.
  function label(ctx, text, x, y, o) {
    o = o || {};
    const size = o.size || 20;
    ctx.save();
    ctx.font = (o.weight || 800) + ' ' + size + 'px Nunito, system-ui, sans-serif';
    const w = ctx.measureText(text).width;
    const padX = size * 0.55, h = size * 1.5;
    let bx = x - w / 2 - padX;
    if (o.align === 'left') bx = x;
    if (o.align === 'right') bx = x - w - padX * 2;
    rr(ctx, bx, y - h / 2, w + padX * 2, h, h / 2);
    ctx.fillStyle = o.bg || 'rgba(255,255,255,0.92)';
    ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = o.shadow === false ? 0 : 6; ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    if (o.border) { ctx.strokeStyle = o.border; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.fillStyle = o.color || '#1c1b29';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + padX + w / 2, y + size * 0.05);
    ctx.restore();
    return { x: bx, y: y - h / 2, w: w + padX * 2, h };
  }

  // ── Wood grain (cached offscreen) ──
  const _woodCache = {};
  function wood(w, h, tone, seed) {
    const key = [w, h, tone, seed].join(':');
    if (_woodCache[key]) return _woodCache[key];
    const c = offscreen(w, h), x = c.getContext('2d');
    const base = tone || '#C8955A';
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, shade(base, 0.12)); g.addColorStop(0.5, base); g.addColorStop(1, shade(base, -0.12));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = rng(seed || 7);
    for (let i = 0; i < h / 3; i++) {
      const y0 = r() * h, amp = 1 + r() * 3, ph = r() * 6;
      x.strokeStyle = rgba(shade(base, -0.35), 0.08 + r() * 0.14);
      x.lineWidth = 0.6 + r() * 1.6;
      x.beginPath();
      for (let xx = 0; xx <= w; xx += 8) {
        const yy = y0 + Math.sin(xx / (40 + r() * 4) + ph) * amp;
        if (xx === 0) x.moveTo(xx, yy); else x.lineTo(xx, yy);
      }
      x.stroke();
    }
    for (let k = 0; k < Math.max(1, w / 260); k++) {
      const kx = r() * w, ky = r() * h, kr = 4 + r() * 6;
      x.strokeStyle = rgba(shade(base, -0.4), 0.22);
      for (let j = 0; j < 4; j++) { x.beginPath(); x.ellipse(kx, ky, kr + j * 5, (kr + j * 5) * 0.35, 0, 0, Math.PI * 2); x.stroke(); }
      x.fillStyle = rgba(shade(base, -0.5), 0.4);
      x.beginPath(); x.ellipse(kx, ky, kr * 0.6, kr * 0.25, 0, 0, Math.PI * 2); x.fill();
    }
    _woodCache[key] = c;
    return c;
  }

  // ── Paper / noise texture ──
  const _paperCache = {};
  function paper(w, h, tint) {
    const key = w + ':' + h + ':' + tint;
    if (_paperCache[key]) return _paperCache[key];
    const c = offscreen(w, h), x = c.getContext('2d');
    x.fillStyle = tint || '#FBF8F1'; x.fillRect(0, 0, w, h);
    const r = rng(99);
    for (let i = 0; i < w * h / 40; i++) {
      x.fillStyle = 'rgba(120,100,70,' + (r() * 0.05) + ')';
      x.fillRect(r() * w, r() * h, 1 + r(), 1 + r());
    }
    _paperCache[key] = c;
    return c;
  }

  // ── Sun with glow ──
  function sun(ctx, x, y, r, power, t) {
    power = power == null ? 1 : power;
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * (3 + power * 2));
    glow.addColorStop(0, 'rgba(255,236,150,' + (0.55 * power + 0.1) + ')');
    glow.addColorStop(0.4, 'rgba(255,214,102,' + (0.18 * power) + ')');
    glow.addColorStop(1, 'rgba(255,214,102,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, r * (3 + power * 2), 0, Math.PI * 2); ctx.fill();
    // soft rays
    ctx.translate(x, y); ctx.rotate((t || 0) * 0.05);
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      const g = ctx.createLinearGradient(0, r, 0, r * (1.9 + power * 0.6));
      g.addColorStop(0, 'rgba(255,230,140,' + (0.35 * power) + ')'); g.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-r * 0.16, r * 0.95); ctx.lineTo(0, r * (1.9 + power * 0.6)); ctx.lineTo(r * 0.16, r * 0.95); ctx.fill();
    }
    ctx.rotate(-(t || 0) * 0.05);
    const d = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    d.addColorStop(0, '#FFFBEA'); d.addColorStop(0.55, '#FFE27A'); d.addColorStop(1, power > 0.2 ? '#FFB531' : '#E8C47A');
    ctx.fillStyle = d;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ── Puffy cumulus cloud ──
  // Built from a seeded set of puffs: a shaded base layer, then a
  // lit layer nudged up, which reads as volume. dark 0..1 → rain cloud.
  function cloudPuffs(w, h, seed) {
    const r = rng(seed || 3), puffs = [];
    const n = 7 + Math.floor(w / 40);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const px = (u - 0.5) * w * 0.86 + (r() - 0.5) * w * 0.08;
      const bulge = Math.sin(u * Math.PI);
      const pr = h * (0.28 + bulge * 0.34) * (0.8 + r() * 0.4);
      const py = h * 0.18 - bulge * h * 0.28 + (r() - 0.5) * h * 0.12;
      puffs.push([px, py, pr]);
    }
    return puffs;
  }
  function cloud(ctx, x, y, w, h, o) {
    o = o || {};
    const dark = Math.max(0, Math.min(1, o.dark || 0));
    const alpha = o.alpha == null ? 1 : o.alpha;
    const puffs = o.puffs || cloudPuffs(w, h, o.seed);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    const top = mix('#FFFFFF', '#8A93A3', dark * 0.85);
    const mid = mix('#E9EEF5', '#646C7A', dark * 0.9);
    const bot = mix('#B9C3D1', '#3E4552', dark * 0.95);
    // base (shadow side)
    puffs.forEach(p => {
      const g = ctx.createRadialGradient(p[0], p[1] + p[2] * 0.2, p[2] * 0.2, p[0], p[1] + p[2] * 0.2, p[2]);
      g.addColorStop(0, mid); g.addColorStop(1, bot);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p[0], p[1] + p[2] * 0.18, p[2], 0, Math.PI * 2); ctx.fill();
    });
    // flat-ish bottom
    ctx.fillStyle = bot;
    rr(ctx, -w * 0.43, h * 0.1, w * 0.86, h * 0.32, h * 0.16); ctx.fill();
    // lit tops
    puffs.forEach(p => {
      const g = ctx.createRadialGradient(p[0] - p[2] * 0.25, p[1] - p[2] * 0.35, p[2] * 0.1, p[0], p[1], p[2] * 0.95);
      g.addColorStop(0, top); g.addColorStop(0.7, rgba(mid, 0.85)); g.addColorStop(1, rgba(mid, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p[0], p[1] - p[2] * 0.06, p[2] * 0.92, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  // SVG CARD ART (320 × 200)
  // ═══════════════════════════════════════════════════════════════
  const CARDS = {};

  CARDS.colors = () => `
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A paint palette and three coloured light beams">
<defs>
  <linearGradient id="bg{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7ED"/><stop offset="1" stop-color="#FDE7D3"/></linearGradient>
  <linearGradient id="pw{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3D3A2"/><stop offset="1" stop-color="#C98F4E"/></linearGradient>
  <radialGradient id="gl{u}" cx="0.35" cy="0.3" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.85"/><stop offset="0.35" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="dk{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B1B2E"/><stop offset="1" stop-color="#0B0B16"/></linearGradient>
  <filter id="bl{u}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>
<rect width="320" height="200" fill="url(#bg{u})"/>
<rect x="176" y="0" width="144" height="200" fill="url(#dk{u})"/>
<g style="mix-blend-mode:screen" filter="url(#bl{u})">
  <circle cx="232" cy="82" r="38" fill="#FF2A2A"/><circle cx="268" cy="82" r="38" fill="#22FF3A"/><circle cx="250" cy="113" r="38" fill="#2A5BFF"/>
</g>
<g transform="translate(14 36)">
  <ellipse cx="80" cy="140" rx="74" ry="10" fill="#000" opacity="0.12"/>
  <path d="M10 70 C10 20 70 0 120 10 C160 18 168 52 150 70 C140 80 122 74 116 88 C110 104 128 112 126 126 C122 146 80 150 50 140 C22 130 10 104 10 70 Z" fill="url(#pw{u})" stroke="#A86F33" stroke-width="2"/>
  <ellipse cx="108" cy="104" rx="11" ry="9" fill="#FDE7D3" stroke="#A86F33" stroke-width="2"/>
  <g><circle cx="44" cy="46" r="14" fill="#D62839"/><circle cx="44" cy="46" r="14" fill="url(#gl{u})"/></g>
  <g><circle cx="80" cy="30" r="14" fill="#F7C62F"/><circle cx="80" cy="30" r="14" fill="url(#gl{u})"/></g>
  <g><circle cx="118" cy="38" r="14" fill="#1F5FBF"/><circle cx="118" cy="38" r="14" fill="url(#gl{u})"/></g>
  <g><path d="M30 92 C38 78 64 80 70 94 C76 108 56 120 42 114 C30 108 26 100 30 92Z" fill="#F07A1A"/><path d="M36 96 C44 90 56 92 58 100" stroke="#F7C62F" stroke-width="3" fill="none" opacity="0.8"/><path d="M30 92 C38 78 64 80 70 94 C76 108 56 120 42 114 C30 108 26 100 30 92Z" fill="url(#gl{u})"/></g>
  <g><circle cx="74" cy="122" r="11" fill="#2E9E4A"/><circle cx="74" cy="122" r="11" fill="url(#gl{u})"/></g>
</g>
<g transform="translate(118 132) rotate(-38)">
  <rect x="0" y="-4" width="74" height="8" rx="4" fill="#7A3E12"/><rect x="74" y="-5" width="18" height="10" fill="#C9CED6"/><rect x="74" y="-5" width="18" height="3" fill="#fff" opacity="0.6"/>
  <path d="M92 -5 C104 -6 114 -2 118 0 C114 2 104 6 92 5 Z" fill="#F07A1A"/>
</g>
<path d="M188 188 L214 150 M246 188 L250 154 M306 188 L284 152" stroke="#3a3a55" stroke-width="7" stroke-linecap="round"/>
<circle cx="214" cy="150" r="6" fill="#FF5A5A"/><circle cx="250" cy="154" r="6" fill="#5AFF6A"/><circle cx="284" cy="152" r="6" fill="#6A8CFF"/>
</svg>`;

  CARDS.water = () => `
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sea, mountains, a rain cloud and a river">
<defs>
  <linearGradient id="sk{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5BA8E6"/><stop offset="1" stop-color="#CDEBFA"/></linearGradient>
  <linearGradient id="sea{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B86C5"/><stop offset="1" stop-color="#0E4F86"/></linearGradient>
  <linearGradient id="mt{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C8B74"/><stop offset="1" stop-color="#4C6B3C"/></linearGradient>
  <linearGradient id="mt2{u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9AA9A0"/><stop offset="1" stop-color="#6E8070"/></linearGradient>
  <radialGradient id="sun{u}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF8D6"/><stop offset="0.35" stop-color="#FFE071"/><stop offset="0.6" stop-color="#FFD24A" stop-opacity="0.5"/><stop offset="1" stop-color="#FFD24A" stop-opacity="0"/></radialGradient>
  <radialGradient id="cl{u}" cx="0.4" cy="0.3" r="0.7"><stop offset="0" stop-color="#F4F6FA"/><stop offset="1" stop-color="#8B94A4"/></radialGradient>
</defs>
<rect width="320" height="200" fill="url(#sk{u})"/>
<circle cx="54" cy="44" r="40" fill="url(#sun{u})"/><circle cx="54" cy="44" r="15" fill="#FFF1A8"/>
<path d="M150 140 L205 62 L222 78 L240 52 L320 120 L320 200 L150 200Z" fill="url(#mt2{u})"/>
<path d="M205 62 L194 78 L203 76 L212 84 L222 78Z M240 52 L230 66 L240 64 L250 70 L256 66Z" fill="#fff"/>
<path d="M120 200 L120 150 C150 140 170 126 196 108 C214 96 240 98 262 112 C286 126 300 134 320 140 L320 200Z" fill="url(#mt{u})"/>
<path d="M0 142 C40 138 80 144 128 148 L128 200 L0 200Z" fill="url(#sea{u})"/>
<path d="M8 152 q8 -4 16 0 t16 0 M50 160 q8 -4 16 0 t16 0 M14 172 q8 -4 16 0 t16 0 M80 178 q8 -4 16 0 t16 0" stroke="#9AD4F5" stroke-width="2" fill="none" opacity="0.7"/>
<path d="M250 116 C236 132 214 136 200 150 C186 164 160 160 128 168" stroke="#5DB6EE" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M250 116 C236 132 214 136 200 150 C186 164 160 160 128 168" stroke="#BDE6FF" stroke-width="1.5" fill="none" stroke-dasharray="4 8"/>
<g stroke="#fff" stroke-width="2" fill="none" opacity="0.75" stroke-linecap="round">
  <path d="M30 132 q-5 -8 0 -16 t0 -16"/><path d="M62 128 q5 -8 0 -16 t0 -16"/><path d="M94 134 q-5 -8 0 -16 t0 -16"/>
</g>
<g stroke="#4A84C4" stroke-width="2.5" stroke-linecap="round" opacity="0.85">
  <path d="M206 64 l-5 14 M220 70 l-5 14 M234 62 l-5 14 M248 70 l-5 14 M212 86 l-5 14 M228 88 l-5 14 M242 86 l-5 14"/>
</g>
<g>
  <circle cx="200" cy="44" r="20" fill="url(#cl{u})"/><circle cx="226" cy="34" r="26" fill="url(#cl{u})"/><circle cx="254" cy="42" r="21" fill="url(#cl{u})"/><circle cx="272" cy="52" r="14" fill="url(#cl{u})"/>
  <rect x="186" y="46" width="94" height="18" rx="9" fill="#8B94A4"/>
</g>
</svg>`;

  CARDS.plants = () => `
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A bean seedling in a pot by a sunny window">
<defs>
  <linearGradient id="wl{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6EFE3"/><stop offset="1" stop-color="#EADFCB"/></linearGradient>
  <linearGradient id="win{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#BFE6FF"/><stop offset="1" stop-color="#EAF7FF"/></linearGradient>
  <linearGradient id="pot{u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9C4A24"/><stop offset="0.45" stop-color="#D9773F"/><stop offset="1" stop-color="#8A3C1C"/></linearGradient>
  <linearGradient id="lf{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7BD155"/><stop offset="1" stop-color="#2E8B2E"/></linearGradient>
  <linearGradient id="beam{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6C9" stop-opacity="0.7"/><stop offset="1" stop-color="#FFF6C9" stop-opacity="0"/></linearGradient>
</defs>
<rect width="320" height="200" fill="url(#wl{u})"/>
<rect x="18" y="14" width="120" height="120" rx="4" fill="#fff"/><rect x="26" y="22" width="104" height="104" fill="url(#win{u})"/>
<path d="M26 98 C50 90 70 96 92 88 C110 82 120 86 130 84 L130 126 L26 126Z" fill="#9CCB7A"/>
<rect x="76" y="22" width="5" height="104" fill="#fff"/><rect x="26" y="72" width="104" height="5" fill="#fff"/>
<circle cx="52" cy="44" r="10" fill="#FFE57A"/>
<path d="M130 22 L300 150 L300 200 L130 126Z" fill="url(#beam{u})"/>
<rect x="0" y="158" width="320" height="42" fill="#C9A273"/><rect x="0" y="158" width="320" height="5" fill="#E4C597"/>
<ellipse cx="206" cy="160" rx="48" ry="6" fill="#000" opacity="0.15"/>
<path d="M164 104 L248 104 L238 160 L174 160Z" fill="url(#pot{u})"/>
<rect x="158" y="96" width="96" height="14" rx="3" fill="#C2622F"/><rect x="158" y="96" width="96" height="4" rx="2" fill="#E08A55"/>
<ellipse cx="206" cy="100" rx="42" ry="4" fill="#4A2E1C"/>
<path d="M206 100 C206 82 200 66 196 50" stroke="#5DA33A" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M200 74 C186 72 174 64 172 54 C186 52 198 60 200 74Z" fill="url(#lf{u})"/>
<path d="M203 66 C216 60 228 62 236 70 C226 78 212 76 203 66Z" fill="url(#lf{u})"/>
<path d="M196 50 C184 40 182 26 192 18 C202 26 202 40 196 50Z" fill="url(#lf{u})"/>
<path d="M196 50 C206 42 220 40 228 46 C220 56 206 56 196 50Z" fill="url(#lf{u})"/>
<rect x="266" y="70" width="16" height="90" rx="2" fill="#F2D24B" stroke="#C9A62C"/>
<g stroke="#7A5B10" stroke-width="1.5"><path d="M266 80h6M266 90h9M266 100h6M266 110h9M266 120h6M266 130h9M266 140h6M266 150h9"/></g>
</svg>`;

  CARDS.physics = () => `
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A balanced seesaw with a heavy weight near the middle and a light one far out">
<defs>
  <linearGradient id="bg{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF8EC"/><stop offset="1" stop-color="#F7E6C8"/></linearGradient>
  <linearGradient id="pl{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E7B979"/><stop offset="1" stop-color="#A86B2E"/></linearGradient>
  <linearGradient id="st{u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5B6472"/><stop offset="0.5" stop-color="#AEB7C4"/><stop offset="1" stop-color="#4A525E"/></linearGradient>
  <linearGradient id="ir{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6B7280"/><stop offset="0.5" stop-color="#3B4250"/><stop offset="1" stop-color="#1F2430"/></linearGradient>
</defs>
<rect width="320" height="200" fill="url(#bg{u})"/>
<rect x="0" y="170" width="320" height="30" fill="#D9C2A0"/><rect x="0" y="170" width="320" height="3" fill="#EEDCC0"/>
<ellipse cx="160" cy="172" rx="40" ry="5" fill="#000" opacity="0.18"/>
<path d="M160 110 L192 170 L128 170Z" fill="url(#st{u})"/><circle cx="160" cy="116" r="5" fill="#2B313B"/>
<rect x="24" y="100" width="272" height="12" rx="3" fill="url(#pl{u})" stroke="#7A4A1C"/>
<g fill="#7A4A1C" opacity="0.6"><rect x="40" y="104" width="2" height="5"/><rect x="64" y="104" width="2" height="5"/><rect x="88" y="104" width="2" height="5"/><rect x="112" y="104" width="2" height="5"/><rect x="136" y="104" width="2" height="5"/><rect x="182" y="104" width="2" height="5"/><rect x="206" y="104" width="2" height="5"/><rect x="230" y="104" width="2" height="5"/><rect x="254" y="104" width="2" height="5"/><rect x="278" y="104" width="2" height="5"/></g>
<g transform="translate(112 62)"><path d="M6 38 L42 38 L38 10 L10 10Z" fill="url(#ir{u})"/><path d="M14 10 C14 -4 34 -4 34 10" stroke="#3B4250" stroke-width="5" fill="none"/><text x="24" y="30" font-family="Nunito,sans-serif" font-weight="900" font-size="13" fill="#E5E7EB" text-anchor="middle">3 kg</text></g>
<g transform="translate(264 76)"><path d="M3 24 L27 24 L24 6 L6 6Z" fill="url(#ir{u})"/><path d="M9 6 C9 -3 21 -3 21 6" stroke="#3B4250" stroke-width="4" fill="none"/><text x="15" y="20" font-family="Nunito,sans-serif" font-weight="900" font-size="9" fill="#E5E7EB" text-anchor="middle">1 kg</text></g>
<g font-family="Nunito,sans-serif" font-weight="800" font-size="11" fill="#7A4A1C" text-anchor="middle"><text x="136" y="130">1</text><text x="280" y="130">3</text></g>
<g transform="translate(40 24)"><rect width="74" height="30" rx="8" fill="#fff" stroke="#E5D3B5"/><text x="37" y="20" font-family="Nunito,sans-serif" font-weight="900" font-size="13" fill="#15803D" text-anchor="middle">3 = 3 ✓</text></g>
</svg>`;

  CARDS.magnets = () => {
    // Iron-filing lines around a bar magnet, traced from a dipole field.
    let lines = '';
    const N = [118, 100], S = [202, 100];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + 0.2;
      let x = N[0] + Math.cos(a) * 8, y = N[1] + Math.sin(a) * 8;
      let d = 'M' + x.toFixed(1) + ' ' + y.toFixed(1);
      for (let k = 0; k < 220; k++) {
        const dx1 = x - N[0], dy1 = y - N[1], r1 = Math.pow(dx1 * dx1 + dy1 * dy1, 1.5) + 1;
        const dx2 = x - S[0], dy2 = y - S[1], r2 = Math.pow(dx2 * dx2 + dy2 * dy2, 1.5) + 1;
        let fx = dx1 / r1 - dx2 / r2, fy = dy1 / r1 - dy2 / r2;
        const m = Math.hypot(fx, fy) || 1;
        x += fx / m * 2.2; y += fy / m * 2.2;
        if (x < -10 || x > 330 || y < -10 || y > 210) break;
        if (Math.hypot(x - S[0], y - S[1]) < 7) break;
        d += 'L' + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      lines += '<path d="' + d + '"/>';
    }
    return `
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A bar magnet with iron filings showing its field and a compass">
<defs>
  <linearGradient id="pp{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFDF7"/><stop offset="1" stop-color="#F0EADB"/></linearGradient>
  <linearGradient id="mr{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F05A5A"/><stop offset="0.5" stop-color="#C81E1E"/><stop offset="1" stop-color="#8E1212"/></linearGradient>
  <linearGradient id="mb{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A8CF0"/><stop offset="0.5" stop-color="#1E4FC8"/><stop offset="1" stop-color="#12328E"/></linearGradient>
  <radialGradient id="br{u}" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#F6D98A"/><stop offset="1" stop-color="#A87A22"/></radialGradient>
</defs>
<rect width="320" height="200" fill="#D8C3A0"/>
<rect x="8" y="8" width="304" height="184" rx="3" fill="url(#pp{u})"/>
<g stroke="#4B4B52" stroke-width="1.6" fill="none" stroke-dasharray="2.2 2.8" opacity="0.75">${lines}</g>
<rect x="100" y="86" width="60" height="28" fill="url(#mr{u})"/><rect x="160" y="86" width="60" height="28" fill="url(#mb{u})"/>
<rect x="100" y="86" width="120" height="6" fill="#fff" opacity="0.25"/>
<text x="130" y="106" font-family="Nunito,sans-serif" font-weight="900" font-size="16" fill="#fff" text-anchor="middle">N</text>
<text x="190" y="106" font-family="Nunito,sans-serif" font-weight="900" font-size="16" fill="#fff" text-anchor="middle">S</text>
<g transform="translate(262 46)"><circle r="24" fill="url(#br{u})"/><circle r="19" fill="#FBFAF5" stroke="#8C6A20"/>
<path d="M0 -15 L4 0 L-4 0Z" fill="#D62828" transform="rotate(-62)"/><path d="M0 15 L4 0 L-4 0Z" fill="#C9CED6" transform="rotate(-62)"/><circle r="2.5" fill="#333"/></g>
</svg>`;
  };

  CARDS.weather = () => `
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A weather station with a thermometer, wind sock and rain gauge under clouds">
<defs>
  <linearGradient id="sk{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4E9BE0"/><stop offset="1" stop-color="#CFE8FA"/></linearGradient>
  <radialGradient id="cl{u}" cx="0.4" cy="0.3" r="0.75"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#B9C6D6"/></radialGradient>
  <linearGradient id="gr{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8CC26A"/><stop offset="1" stop-color="#5C9A3E"/></linearGradient>
  <linearGradient id="gl{u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E8F4FF" stop-opacity="0.9"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0.4"/><stop offset="1" stop-color="#CFE3F5" stop-opacity="0.9"/></linearGradient>
</defs>
<rect width="320" height="200" fill="url(#sk{u})"/>
<g opacity="0.85" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"><path d="M180 22 C200 18 230 20 262 16"/><path d="M196 32 C220 28 250 30 290 26"/></g>
<g><circle cx="70" cy="58" r="22" fill="url(#cl{u})"/><circle cx="98" cy="46" r="28" fill="url(#cl{u})"/><circle cx="128" cy="56" r="22" fill="url(#cl{u})"/><rect x="52" y="58" width="96" height="20" rx="10" fill="#C3CFDD"/></g>
<rect x="0" y="160" width="320" height="40" fill="url(#gr{u})"/>
<g transform="translate(44 76)"><rect x="-3" y="0" width="6" height="90" fill="#7B8794"/><path d="M3 4 L54 10 L54 26 L3 32Z" fill="#F97316"/><path d="M20 6 L20 30 M37 8 L37 28" stroke="#fff" stroke-width="5"/></g>
<g transform="translate(160 70)"><rect x="-12" y="0" width="24" height="96" rx="12" fill="#fff" stroke="#9AA6B2" stroke-width="2"/><rect x="-3" y="12" width="6" height="64" rx="3" fill="#EDEFF2"/><rect x="-3" y="40" width="6" height="40" rx="3" fill="#E11D48"/><circle cy="82" r="8" fill="#E11D48"/>
<g stroke="#9AA6B2" stroke-width="1.5"><path d="M5 20h4M5 30h4M5 40h4M5 50h4M5 60h4M5 70h4"/></g></g>
<g transform="translate(252 110)"><path d="M-16 0 L16 0 L12 56 L-12 56Z" fill="url(#gl{u})" stroke="#93A9BF" stroke-width="2"/><path d="M-13.5 30 L13.5 30 L12 56 L-12 56Z" fill="#5AA9E6" opacity="0.7"/>
<g stroke="#5D7286" stroke-width="1.2"><path d="M-10 12h6M-10 22h6M-10 32h6M-10 42h6"/></g></g>
</svg>`;

  CARDS.astronomy = () => {
    // Cruz del Sur and the two Pointers, placed from real coordinates,
    // drawn upright as when the cross stands highest in the south.
    const D = window.LXData ? LXData.STARS : [];
    const pick = ids => ids.map(id => D.find(s => s.id === id)).filter(Boolean);
    const sel = pick(['acrux', 'mimosa', 'gacrux', 'imai', 'ginan', 'rigilk', 'hadar']);
    const k = 7.2, cx = 172, cy = 92;
    const pos = s => {
      const dra = (s.ra - 12.9) * 15 * Math.cos(s.dec * Math.PI / 180);
      return [cx - dra * k * 0.62, cy - (s.dec + 60.5) * k * 0.62];
    };
    let st = '';
    sel.forEach(s => {
      const p = pos(s), r = Math.max(1.6, 4.6 - s.mag * 1.5);
      st += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (r * 3).toFixed(1) + '" fill="url(#sg{u})"/>' +
            '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r.toFixed(1) + '" fill="#fff"/>';
    });
    const P = id => pos(D.find(s => s.id === id) || { ra: 12, dec: -60 });
    const ln = (a, b) => { const A = P(a), B = P(b); return '<line x1="' + A[0].toFixed(1) + '" y1="' + A[1].toFixed(1) + '" x2="' + B[0].toFixed(1) + '" y2="' + B[1].toFixed(1) + '"/>'; };
    const r = rng(11);
    let bg = '';
    for (let i = 0; i < 70; i++) bg += '<circle cx="' + (r() * 320).toFixed(1) + '" cy="' + (r() * 150).toFixed(1) + '" r="' + (0.4 + r() * 0.8).toFixed(2) + '" fill="#fff" opacity="' + (0.3 + r() * 0.5).toFixed(2) + '"/>';
    return `
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Southern Cross and the Pointers above the Andes">
<defs>
  <linearGradient id="nt{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060A1F"/><stop offset="0.7" stop-color="#16204A"/><stop offset="1" stop-color="#2D3B6E"/></linearGradient>
  <radialGradient id="sg{u}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#CFE0FF" stop-opacity="0.8"/><stop offset="1" stop-color="#CFE0FF" stop-opacity="0"/></radialGradient>
  <linearGradient id="mw{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8FA3D9" stop-opacity="0"/><stop offset="0.5" stop-color="#B8C6EE" stop-opacity="0.28"/><stop offset="1" stop-color="#8FA3D9" stop-opacity="0"/></linearGradient>
  <linearGradient id="an{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2240"/><stop offset="1" stop-color="#0A0E1E"/></linearGradient>
</defs>
<rect width="320" height="200" fill="url(#nt{u})"/>
<path d="M0 40 C80 70 180 90 320 170 L320 120 C200 60 100 20 0 0Z" fill="url(#mw{u})"/>
<ellipse cx="206" cy="92" rx="12" ry="9" fill="#05070F" opacity="0.6"/>
${bg}
<g stroke="#9DB4FF" stroke-width="1.3" opacity="0.65">${ln('gacrux', 'acrux')}${ln('mimosa', 'imai')}</g>
${st}
<path d="M0 200 L0 168 L30 150 L52 160 L80 132 L104 150 L128 138 L150 156 L178 128 L200 144 L226 120 L252 146 L280 136 L320 158 L320 200Z" fill="url(#an{u})"/>
<path d="M80 132 L72 140 L84 138Z M178 128 L170 137 L183 135Z M226 120 L218 129 L231 128Z" fill="#DDE6FF" opacity="0.8"/>
</svg>`;
  };

  CARDS.sound = () => `
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A loudspeaker and an oscilloscope showing a sound wave">
<defs>
  <linearGradient id="bg{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ECFEFF"/><stop offset="1" stop-color="#CDEFF1"/></linearGradient>
  <linearGradient id="cs{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D1DA"/><stop offset="1" stop-color="#8E99A6"/></linearGradient>
  <radialGradient id="scr{u}" cx="0.5" cy="0.5" r="0.7"><stop offset="0" stop-color="#0E3B2C"/><stop offset="1" stop-color="#03140E"/></radialGradient>
  <radialGradient id="cone{u}" cx="0.45" cy="0.4" r="0.6"><stop offset="0" stop-color="#5E6470"/><stop offset="0.6" stop-color="#2A2E36"/><stop offset="1" stop-color="#111318"/></radialGradient>
  <filter id="gw{u}" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
</defs>
<rect width="320" height="200" fill="url(#bg{u})"/>
<rect x="0" y="176" width="320" height="24" fill="#9BB5B8"/>
<g transform="translate(20 46)"><rect width="86" height="128" rx="10" fill="#3A2A20"/><rect x="4" y="4" width="78" height="120" rx="8" fill="#5A4030"/>
<circle cx="43" cy="74" r="32" fill="#1A1C22"/><circle cx="43" cy="74" r="28" fill="url(#cone{u})"/><circle cx="43" cy="74" r="9" fill="#3C414C"/><circle cx="40" cy="71" r="3" fill="#8A93A3"/>
<circle cx="43" cy="24" r="12" fill="#1A1C22"/><circle cx="43" cy="24" r="8" fill="url(#cone{u})"/></g>
<g stroke="#0D9488" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"><path d="M114 106 q10 14 0 28"/><path d="M124 98 q16 22 0 44"/><path d="M134 90 q22 30 0 60"/></g>
<g transform="translate(150 34)"><rect width="156" height="132" rx="12" fill="url(#cs{u})"/><rect x="10" y="10" width="110" height="84" rx="8" fill="url(#scr{u})" stroke="#555E6A" stroke-width="3"/>
<g stroke="#2E6B55" stroke-width="0.7" opacity="0.7"><path d="M10 31h110M10 52h110M10 73h110M32 10v84M54 10v84M76 10v84M98 10v84"/></g>
<path d="M12 52 C20 26 28 26 36 52 S52 78 60 52 S76 26 84 52 S100 78 108 52 S116 34 118 40" stroke="#5CFFB0" stroke-width="4" fill="none" filter="url(#gw{u})" opacity="0.8"/>
<path d="M12 52 C20 26 28 26 36 52 S52 78 60 52 S76 26 84 52 S100 78 108 52 S116 34 118 40" stroke="#D8FFE9" stroke-width="1.6" fill="none"/>
<circle cx="138" cy="28" r="9" fill="#2B313B"/><circle cx="138" cy="28" r="6" fill="#4B5563"/><path d="M138 22v5" stroke="#fff" stroke-width="2"/>
<circle cx="138" cy="60" r="9" fill="#2B313B"/><circle cx="138" cy="60" r="6" fill="#4B5563"/><path d="M134 56l3 3" stroke="#fff" stroke-width="2"/>
<rect x="16" y="104" width="30" height="16" rx="4" fill="#E11D48"/><rect x="54" y="104" width="30" height="16" rx="4" fill="#475569"/><rect x="92" y="104" width="30" height="16" rx="4" fill="#475569"/></g>
</svg>`;

  CARDS.crystals = () => `
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A glass jar with crystals growing on a string">
<defs>
  <linearGradient id="bg{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5F3FF"/><stop offset="1" stop-color="#E4DEFA"/></linearGradient>
  <linearGradient id="sol{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7DD3FC" stop-opacity="0.45"/><stop offset="1" stop-color="#2563EB" stop-opacity="0.55"/></linearGradient>
  <linearGradient id="gl{u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.75"/><stop offset="0.15" stop-color="#fff" stop-opacity="0.1"/><stop offset="0.85" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#fff" stop-opacity="0.6"/></linearGradient>
  <linearGradient id="c1{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#A5D8FF"/><stop offset="1" stop-color="#1D4ED8"/></linearGradient>
  <linearGradient id="c2{u}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60A5FA"/><stop offset="1" stop-color="#1E3A8A"/></linearGradient>
  <linearGradient id="pc{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCD34D"/><stop offset="1" stop-color="#D97706"/></linearGradient>
</defs>
<rect width="320" height="200" fill="url(#bg{u})"/>
<rect x="0" y="176" width="320" height="24" fill="#CFC6EA"/>
<ellipse cx="160" cy="178" rx="70" ry="7" fill="#000" opacity="0.12"/>
<path d="M98 44 L222 44 L222 54 C232 60 234 70 234 80 L234 162 C234 172 226 178 216 178 L104 178 C94 178 86 172 86 162 L86 80 C86 70 88 60 98 54Z" fill="#fff" opacity="0.35"/>
<path d="M88 84 L232 84 L232 162 C232 171 225 176 216 176 L104 176 C95 176 88 171 88 162Z" fill="url(#sol{u})"/>
<ellipse cx="160" cy="84" rx="72" ry="5" fill="#BAE6FD" opacity="0.8"/>
<rect x="66" y="34" width="188" height="10" rx="5" fill="url(#pc{u})" transform="rotate(-3 160 39)"/>
<path d="M160 38 L160 128" stroke="#F5F5F4" stroke-width="2"/>
<g stroke="#DBEAFE" stroke-width="1" stroke-linejoin="round">
  <path d="M146 104 L160 94 L176 100 L170 116 L152 118Z" fill="url(#c1{u})"/><path d="M160 94 L176 100 L164 106Z" fill="#DBEAFE" opacity="0.7"/>
  <path d="M150 120 L166 112 L180 124 L170 140 L152 136Z" fill="url(#c2{u})"/><path d="M166 112 L180 124 L168 124Z" fill="#BFDBFE" opacity="0.7"/>
  <path d="M138 126 L150 120 L152 136 L140 140Z" fill="url(#c1{u})"/>
  <path d="M112 176 L122 154 L138 160 L134 176Z" fill="url(#c2{u})"/><path d="M190 176 L198 160 L214 162 L212 176Z" fill="url(#c1{u})"/><path d="M198 160 L214 162 L204 168Z" fill="#DBEAFE" opacity="0.7"/>
</g>
<path d="M88 84 L88 162 C88 171 95 176 104 176 L216 176 C225 176 232 171 232 162 L232 84" fill="url(#gl{u})" stroke="#A5B4CF" stroke-width="2.5"/>
<path d="M98 92 L98 160" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.55"/>
</svg>`;

  CARDS.static = () => {
    let hair = '';
    const r = rng(5);
    for (let i = 0; i < 26; i++) {
      const a = Math.PI * (0.98 + i / 25 * 0.95);
      const x0 = 96 + Math.cos(a) * 40, y0 = 112 + Math.sin(a) * 44;
      const pull = Math.max(0, Math.cos(a - (-0.45))) ;
      const tx = x0 + Math.cos(a) * 18 + pull * 48 + r() * 4, ty = y0 + Math.sin(a) * 16 - pull * 10;
      hair += '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' Q' + ((x0 + tx) / 2 + 4).toFixed(1) + ' ' + ((y0 + ty) / 2 - 8).toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1) + '"/>';
    }
    return `
<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A charged balloon pulling hair up and lifting bits of paper">
<defs>
  <linearGradient id="bg{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4EC"/><stop offset="1" stop-color="#FCE1CF"/></linearGradient>
  <radialGradient id="bl{u}" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#FF8A8A"/><stop offset="0.5" stop-color="#E11D2E"/><stop offset="1" stop-color="#8A0F18"/></radialGradient>
  <radialGradient id="sk{u}" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#FFE0C4"/><stop offset="1" stop-color="#E0A47A"/></radialGradient>
</defs>
<rect width="320" height="200" fill="url(#bg{u})"/>
<rect x="0" y="168" width="320" height="32" fill="#C8A27A"/><rect x="0" y="168" width="320" height="3" fill="#E2C29C"/>
<path d="M46 200 C46 168 70 154 96 154 C122 154 146 168 146 200Z" fill="#3B82F6"/>
<ellipse cx="96" cy="118" rx="38" ry="42" fill="url(#sk{u})"/>
<g stroke="#7A4A1E" stroke-width="2.4" fill="none" stroke-linecap="round">${hair}</g>
<path d="M60 108 C60 76 132 72 134 106 C120 92 78 90 60 108Z" fill="#8A5528"/>
<circle cx="84" cy="122" r="3.5" fill="#3A2A20"/><circle cx="110" cy="122" r="3.5" fill="#3A2A20"/>
<path d="M88 140 Q97 148 106 140" stroke="#A0522D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<g transform="translate(206 70)">
  <ellipse cx="0" cy="0" rx="40" ry="48" fill="url(#bl{u})"/>
  <ellipse cx="-14" cy="-20" rx="9" ry="15" fill="#fff" opacity="0.55" transform="rotate(-20 -14 -20)"/>
  <path d="M-5 47 L5 47 L0 55Z" fill="#8A0F18"/>
  <path d="M0 55 C8 70 -6 84 4 100" stroke="#6B7280" stroke-width="1.4" fill="none"/>
  <g fill="#fff" font-family="Nunito,sans-serif" font-weight="900" font-size="13" text-anchor="middle" opacity="0.9"><text x="-16" y="10">−</text><text x="10" y="-4">−</text><text x="18" y="22">−</text><text x="-4" y="30">−</text></g>
</g>
<g><rect x="214" y="132" width="10" height="7" fill="#fff" stroke="#D4C4B0" transform="rotate(20 219 135)"/><rect x="236" y="146" width="9" height="6" fill="#FDE68A" transform="rotate(-25 240 149)"/><rect x="196" y="152" width="10" height="7" fill="#BFDBFE" transform="rotate(40 201 155)"/><rect x="252" y="160" width="10" height="6" fill="#fff" stroke="#D4C4B0"/><rect x="224" y="162" width="9" height="6" fill="#FBCFE8"/></g>
</svg>`;
  };

  function card(id) {
    const f = CARDS[id];
    return f ? _u(f()) : '';
  }

  // Header banner: a bench with glassware.
  function hero() {
    return _u(`
<svg viewBox="0 0 640 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A science bench with flasks, test tubes, a microscope and a seedling">
<defs>
  <linearGradient id="wall{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ECFDF5"/><stop offset="1" stop-color="#D1F2E4"/></linearGradient>
  <linearGradient id="bench{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C08A52"/><stop offset="1" stop-color="#7A4B22"/></linearGradient>
  <linearGradient id="liqG{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6EE7B7"/><stop offset="1" stop-color="#059669"/></linearGradient>
  <linearGradient id="liqB{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93C5FD"/><stop offset="1" stop-color="#1D4ED8"/></linearGradient>
  <linearGradient id="liqP{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9A8D4"/><stop offset="1" stop-color="#BE185D"/></linearGradient>
  <linearGradient id="liqO{u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDBA74"/><stop offset="1" stop-color="#C2410C"/></linearGradient>
  <linearGradient id="gls{u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.8"/><stop offset="0.2" stop-color="#fff" stop-opacity="0.12"/><stop offset="0.8" stop-color="#fff" stop-opacity="0.06"/><stop offset="1" stop-color="#fff" stop-opacity="0.55"/></linearGradient>
  <linearGradient id="met{u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#475569"/><stop offset="0.5" stop-color="#CBD5E1"/><stop offset="1" stop-color="#334155"/></linearGradient>
  <linearGradient id="pot{u}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9C4A24"/><stop offset="0.45" stop-color="#D9773F"/><stop offset="1" stop-color="#8A3C1C"/></linearGradient>
</defs>
<rect width="640" height="180" rx="22" fill="url(#wall{u})"/>
<g opacity="0.35" stroke="#A7D9C4" stroke-width="1"><path d="M0 40h640M0 80h640M0 120h640"/></g>
<rect x="0" y="140" width="640" height="40" fill="url(#bench{u})"/><rect x="0" y="140" width="640" height="5" fill="#DDAE78"/>
<g transform="translate(70 30)">
  <ellipse cx="40" cy="112" rx="46" ry="6" fill="#000" opacity="0.15"/>
  <path d="M28 0 L52 0 L52 36 L86 102 C90 110 84 112 78 112 L2 112 C-4 112 -10 110 -6 102 L28 36Z" fill="#fff" opacity="0.35"/>
  <path d="M8 66 L72 66 L86 102 C90 110 84 112 78 112 L2 112 C-4 112 -10 110 -6 102Z" fill="url(#liqG{u})"/>
  <circle cx="30" cy="88" r="4" fill="#D1FAE5" opacity="0.8"/><circle cx="46" cy="78" r="3" fill="#D1FAE5" opacity="0.8"/><circle cx="38" cy="54" r="2.5" fill="#D1FAE5" opacity="0.7"/><circle cx="42" cy="36" r="2" fill="#D1FAE5" opacity="0.6"/>
  <path d="M28 0 L52 0 L52 36 L86 102 C90 110 84 112 78 112 L2 112 C-4 112 -10 110 -6 102 L28 36Z" fill="url(#gls{u})" stroke="#94A3B8" stroke-width="2.5"/>
  <rect x="24" y="-4" width="32" height="7" rx="3" fill="#E2E8F0" stroke="#94A3B8"/>
</g>
<g transform="translate(190 52)">
  <rect x="-6" y="70" width="140" height="18" rx="3" fill="#8B5A2B"/><rect x="-6" y="70" width="140" height="4" fill="#B07A44"/>
  <rect x="4" y="0" width="16" height="84" rx="8" fill="url(#liqB{u})" opacity="0.9"/>
  <rect x="38" y="16" width="16" height="68" rx="8" fill="url(#liqP{u})" opacity="0.9"/>
  <rect x="72" y="8" width="16" height="76" rx="8" fill="url(#liqO{u})" opacity="0.9"/>
  <rect x="106" y="24" width="16" height="60" rx="8" fill="url(#liqG{u})" opacity="0.9"/>
  <g fill="url(#gls{u})" stroke="#94A3B8" stroke-width="2"><rect x="4" y="-14" width="16" height="98" rx="8"/><rect x="38" y="-14" width="16" height="98" rx="8"/><rect x="72" y="-14" width="16" height="98" rx="8"/><rect x="106" y="-14" width="16" height="98" rx="8"/></g>
  <rect x="-10" y="40" width="148" height="10" rx="3" fill="#A06A34"/>
</g>
<g transform="translate(390 18)">
  <ellipse cx="50" cy="124" rx="52" ry="6" fill="#000" opacity="0.15"/>
  <rect x="6" y="104" width="90" height="18" rx="6" fill="#334155"/>
  <path d="M62 104 C62 70 70 50 52 30" stroke="#475569" stroke-width="14" fill="none" stroke-linecap="round"/>
  <rect x="20" y="70" width="58" height="8" rx="3" fill="#64748B"/>
  <g transform="rotate(-28 40 30)"><rect x="28" y="-6" width="22" height="70" rx="5" fill="url(#met{u})"/><rect x="31" y="-16" width="16" height="14" rx="3" fill="#1E293B"/><rect x="32" y="62" width="14" height="12" rx="2" fill="#94A3B8"/></g>
  <circle cx="72" cy="60" r="8" fill="#94A3B8" stroke="#334155" stroke-width="2"/>
</g>
<g transform="translate(540 52)">
  <ellipse cx="30" cy="88" rx="34" ry="5" fill="#000" opacity="0.15"/>
  <path d="M4 46 L56 46 L50 88 L10 88Z" fill="url(#pot{u})"/><rect x="0" y="40" width="60" height="10" rx="2" fill="#C2622F"/>
  <path d="M30 40 C30 26 26 14 22 4" stroke="#4D8F2E" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M26 24 C14 22 6 14 6 6 C18 6 26 14 26 24Z" fill="#4CAF50"/><path d="M28 18 C38 10 50 12 56 18 C48 26 36 26 28 18Z" fill="#66BB6A"/>
</g>
</svg>`);
  }

  return { rng, hex, toHex, mix, rgba, shade, rr, offscreen, shadow, label, wood, paper, sun, cloud, cloudPuffs, card, hero };
})();
window.LXArt = LXArt;
