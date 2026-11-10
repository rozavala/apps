/* ================================================================
   CODE LAB — art (js/code-lab-art.js)

   Hand-built SVG, as strings: the turtle mascot, an icon for each
   chapter, a star, and the little block icons for the Code Cadet bridge.
   Nothing here takes kid text, so it is safe to put in with innerHTML.
   ================================================================ */

var CodeLabArt = (function() {
  'use strict';

  var uid = 0;

  // The mascot, seen from above (it points up, like the turtle on the canvas).
  function turtle(size, opts) {
    opts = opts || {};
    var shell = opts.shell || '#2a9d3f', dark = opts.dark || '#16692a', skin = opts.skin || '#9ad37a';
    return '<svg viewBox="0 0 100 100" width="' + size + '" height="' + size + '" aria-hidden="true" focusable="false">' +
      '<g fill="' + skin + '" stroke="' + dark + '" stroke-width="2.5" stroke-linejoin="round">' +
        '<ellipse cx="50" cy="14" rx="9" ry="10"/>' +
        '<ellipse cx="22" cy="34" rx="10" ry="7" transform="rotate(-35 22 34)"/>' +
        '<ellipse cx="78" cy="34" rx="10" ry="7" transform="rotate(35 78 34)"/>' +
        '<ellipse cx="25" cy="72" rx="10" ry="7" transform="rotate(35 25 72)"/>' +
        '<ellipse cx="75" cy="72" rx="10" ry="7" transform="rotate(-35 75 72)"/>' +
        '<path d="M50 84 Q47 94 50 97 Q53 94 50 84Z"/>' +
      '</g>' +
      '<ellipse cx="50" cy="52" rx="27" ry="33" fill="' + shell + '" stroke="' + dark + '" stroke-width="3"/>' +
      '<path d="M50 28 L63 38 L63 56 L50 66 L37 56 L37 38Z" fill="none" stroke="' + dark + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M50 28 L50 20 M63 38 L73 33 M63 56 L74 63 M50 66 L50 80 M37 56 L26 63 M37 38 L27 33" stroke="' + dark + '" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
      '<circle cx="45.5" cy="11" r="2.2" fill="#1c2330"/><circle cx="54.5" cy="11" r="2.2" fill="#1c2330"/>' +
      '</svg>';
  }

  function star(on, size) {
    var id = 'cls' + (uid++);
    return '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) + '" aria-hidden="true" focusable="false">' +
      (on ? '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd84d"/><stop offset="1" stop-color="#f4a21b"/></linearGradient></defs>' : '') +
      '<path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.2 1.2-6.5L2.5 9.5l6.6-.9z" fill="' + (on ? 'url(#' + id + ')' : '#e5e1d3') + '" stroke="' + (on ? '#b9801a' : '#cfc9b4') + '" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  }

  var CH = {
    hello: '<rect x="6" y="10" width="52" height="34" rx="9" fill="#d8f1ee" stroke="#0a6b64" stroke-width="3"/><path d="M18 44 L16 58 L32 44Z" fill="#d8f1ee" stroke="#0a6b64" stroke-width="3" stroke-linejoin="round"/><path d="M18 27 h4 M26 27 h4 M34 27 h4 M42 27 h4" stroke="#0a6b64" stroke-width="3.5" stroke-linecap="round"/>',
    turtle: '<path d="M10 52 L10 14 L48 14 L48 52Z" fill="#e6f5e8" stroke="#16692a" stroke-width="3" stroke-linejoin="round"/><path d="M22 40 L22 26 L36 26 L36 40Z" fill="none" stroke="#2a9d3f" stroke-width="3" stroke-dasharray="4 4"/><circle cx="48" cy="52" r="5" fill="#2a9d3f"/>',
    numbers: '<path d="M14 32 a18 18 0 1 1 6 13" fill="none" stroke="#1b4fd1" stroke-width="5" stroke-linecap="round"/><path d="M8 24 L14 34 L24 28Z" fill="#1b4fd1"/><path d="M27 24 h6 v18 M25 42 h10" stroke="#10246b" stroke-width="4" stroke-linecap="round" fill="none"/>',
    color: '<path d="M32 8 C14 8 6 22 8 34 C10 48 24 56 36 54 C44 53 42 46 46 44 C52 41 58 42 58 34 C58 18 46 8 32 8Z" fill="#fff4d6" stroke="#8d5524" stroke-width="3" stroke-linejoin="round"/><circle cx="22" cy="24" r="5" fill="#d62828"/><circle cx="34" cy="19" r="5" fill="#ffc300"/><circle cx="46" cy="26" r="5" fill="#2a9d3f"/><circle cx="20" cy="38" r="5" fill="#1b4fd1"/>',
    lists: '<path d="M18 10 H8 V54 H18 M46 10 H56 V54 H46" fill="none" stroke="#7b2cbf" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><rect x="20" y="16" width="24" height="8" rx="3" fill="#c8a6ea"/><rect x="20" y="28" width="24" height="8" rx="3" fill="#a57bd6"/><rect x="20" y="40" width="24" height="8" rx="3" fill="#7b2cbf"/>',
    functions: '<circle cx="32" cy="32" r="12" fill="#fde3c4" stroke="#c2410c" stroke-width="3.5"/><circle cx="32" cy="32" r="4.5" fill="#c2410c"/><path d="M32 6 v8 M32 50 v8 M6 32 h8 M50 32 h8 M13.6 13.6 l5.7 5.7 M44.7 44.7 l5.7 5.7 M13.6 50.4 l5.7 -5.7 M44.7 19.3 l5.7 -5.7" stroke="#c2410c" stroke-width="5" stroke-linecap="round"/>',
    big: '<path d="M32 58 V36 M32 36 L18 22 M32 36 L46 22 M18 22 L10 12 M18 22 L24 10 M46 22 L40 10 M46 22 L54 12" stroke="#10246b" stroke-width="4.5" stroke-linecap="round" fill="none"/><circle cx="10" cy="12" r="3.5" fill="#2a9d3f"/><circle cx="24" cy="10" r="3.5" fill="#2a9d3f"/><circle cx="40" cy="10" r="3.5" fill="#2a9d3f"/><circle cx="54" cy="12" r="3.5" fill="#2a9d3f"/>'
  };
  function chapter(id, size) {
    return '<svg viewBox="0 0 64 64" width="' + (size || 40) + '" height="' + (size || 40) + '" aria-hidden="true" focusable="false">' + (CH[id] || CH.hello) + '</svg>';
  }

  // Pocket icons for the Code Cadet block chips in the bridge.
  var BLK = {
    move: '<path d="M12 4 L18 12 L14 12 L14 20 L10 20 L10 12 L6 12Z" fill="#fff"/>',
    turnRight: '<path d="M6 18 V12 Q6 7 11 7 H16 M13 3 L18 7 L13 11" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    turnLeft: '<path d="M18 18 V12 Q18 7 13 7 H8 M11 3 L6 7 L11 11" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    repeat: '<path d="M5 12 a7 7 0 0 1 12 -4 M19 12 a7 7 0 0 1 -12 4 M17 4 v4 h-4 M7 20 v-4 h4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    func: '<path d="M14 5 Q9 5 9 10 V14 Q9 19 4 19 M6 11 H14" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>'
  };
  function block(type, size) {
    var k = type === 'turnRight' || type === 'turnLeft' ? type : type === 'forLoop' ? 'repeat' : type === 'callF1' ? 'func' : type;
    return '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) + '" aria-hidden="true" focusable="false">' + (BLK[k] || '') + '</svg>';
  }

  return { turtle: turtle, star: star, chapter: chapter, block: block };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = CodeLabArt;
