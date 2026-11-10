/* ================================================================
   GEDCOM 🌳 — reads a family-tree file (js/gedcom.js)

   Árbol familiar imports the parent's tree from a GEDCOM file (.ged),
   the exchange format every genealogy service and program writes
   (GEDCOM 5.5, 5.5.1 and 7.0). Everything runs in the browser, on the
   file the parent picked: nothing is uploaded anywhere but the family's
   own sync server, and the file's text is UNTRUSTED. This module never
   builds HTML; the app escapes every string it draws.

   Gedcom.decode(bytes)        ArrayBuffer/Uint8Array -> text. Handles a UTF-8 or
                               UTF-16 byte-order mark, the file's own CHAR line
                               (UTF-8, ASCII, ANSI/Windows-1252, ANSEL, UNICODE) and
                               falls back to Windows-1252 when UTF-8 is malformed.
   Gedcom.parse(text)          text -> { version, charset, software, people, families,
                                         stats, warnings }
   Gedcom.parseDate(s)         a GEDCOM date -> { y, m, d, q, y2, raw } (see below)
   Gedcom.formatDate(s, lang, exact)   a readable date ('12 mar 1950', 'hacia 1900')
   Gedcom.yearOf(s)            first year of a date, or null

   people[id] = { id, ft, g, s, x, k, z, lv, e:[[type, date, place, lat, lon]],
                  n:[note text], fc:[{f, p}], fs:[familyId], src, obj }
     g given names, s surname, x suffix, k nickname, z sex 'M'|'F'|'',
     lv 1 when the file flags the person living/private, ft the FamilySearch
     tree id (_FSFTID) when the program exported one, src/obj counts of
     source citations and media links that are NOT kept.
   families[id] = { id, h, w, c:[childIds], e:[[type, date, place]], n:[] }
   Ids are the file's cross-reference ids without the @ signs.
   ================================================================ */
(function(root) {
  'use strict';

  // ---------------------------------------------------------------
  // Bytes -> text
  // ---------------------------------------------------------------
  // ANSEL (Z39.47), the old GEDCOM 5.5 character set: letters with
  // marks are written MARK then LETTER, the reverse of Unicode.
  var ANSEL_SPECIAL = {
    0xA1: 'Ł', 0xA2: 'Ø', 0xA3: 'Đ', 0xA4: 'Þ', 0xA5: 'Æ', 0xA6: 'Œ',
    0xA7: 'ʹ', 0xA8: '·', 0xA9: '♭', 0xAA: '®', 0xAB: '±', 0xAC: 'Ơ',
    0xAD: 'Ư', 0xAE: 'ʼ', 0xB0: 'ʻ', 0xB1: 'ł', 0xB2: 'ø', 0xB3: 'đ',
    0xB4: 'þ', 0xB5: 'æ', 0xB6: 'œ', 0xB7: 'ʺ', 0xB8: 'ı', 0xB9: '£',
    0xBA: 'ð', 0xBC: 'ơ', 0xBD: 'ư', 0xC0: '°', 0xC1: 'ℓ', 0xC2: '℗',
    0xC3: '©', 0xC4: '♯', 0xC5: '¿', 0xC6: '¡', 0xC7: 'ß', 0xC8: '€'
  };
  var ANSEL_MARK = {
    0xE0: '̉', 0xE1: '̀', 0xE2: '́', 0xE3: '̂', 0xE4: '̃', 0xE5: '̄',
    0xE6: '̆', 0xE7: '̇', 0xE8: '̈', 0xE9: '̌', 0xEA: '̊', 0xEB: '︠',
    0xEC: '︡', 0xED: '̕', 0xEE: '̋', 0xEF: '̐', 0xF0: '̧', 0xF1: '̨',
    0xF2: '̣', 0xF3: '̤', 0xF4: '̥', 0xF5: '̳', 0xF6: '̲', 0xF7: '̦',
    0xF8: '̜', 0xF9: '̮', 0xFA: '︢', 0xFB: '︣', 0xFE: '̓'
  };

  function decodeAnsel(u8) {
    var out = '', marks = '', i, b, ch;
    for (i = 0; i < u8.length; i++) {
      b = u8[i];
      if (ANSEL_MARK[b]) { marks += ANSEL_MARK[b]; continue; }
      if (b < 0x80) ch = String.fromCharCode(b);
      else ch = ANSEL_SPECIAL[b] || '';
      out += ch + marks;                 // the marks belong AFTER the letter in Unicode
      marks = '';
    }
    return out.normalize ? out.normalize('NFC') : out;
  }

  var CP1252_HIGH = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008DŽ\u008F' +
                    '\u0090‘’“”•–—˜™š›œ\u009DžŸ';
  function decodeLatin(u8) {            // Windows-1252, a superset of Latin-1
    var out = [], i, b, chunk = '';
    for (i = 0; i < u8.length; i++) {
      b = u8[i];
      chunk += (b >= 0x80 && b < 0xA0) ? CP1252_HIGH.charAt(b - 0x80) : String.fromCharCode(b);
      if (chunk.length > 8000) { out.push(chunk); chunk = ''; }
    }
    out.push(chunk);
    return out.join('');
  }

  function isValidUtf8(u8) {
    var i = 0, n = u8.length, b, need;
    while (i < n) {
      b = u8[i++];
      if (b < 0x80) continue;
      if (b >= 0xC2 && b <= 0xDF) need = 1;
      else if (b >= 0xE0 && b <= 0xEF) need = 2;
      else if (b >= 0xF0 && b <= 0xF4) need = 3;
      else return false;
      while (need--) { if (i >= n || (u8[i++] & 0xC0) !== 0x80) return false; }
    }
    return true;
  }

  function decodeUtf8(u8) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(u8);
    var s = '', i; for (i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
  }

  function decodeUtf16(u8, le) {
    var s = [], i;
    for (i = 0; i + 1 < u8.length; i += 2) s.push(String.fromCharCode(le ? (u8[i] | (u8[i + 1] << 8)) : ((u8[i] << 8) | u8[i + 1])));
    return s.join('');
  }

  // What the file says about itself: the first "1 CHAR xxx" in the first 4 KB.
  function declaredCharset(u8) {
    var head = '', i, n = Math.min(u8.length, 4096);
    for (i = 0; i < n; i++) head += String.fromCharCode(u8[i] < 0x80 ? u8[i] : 0x3F);
    var m = /\n\s*1\s+CHAR\s+([^\r\n]+)/i.exec('\n' + head);
    return m ? m[1].trim().toUpperCase() : '';
  }

  function decode(bytes) {
    var u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    if (u8.length >= 3 && u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF) return decodeUtf8(u8.subarray(3));
    if (u8.length >= 2 && u8[0] === 0xFF && u8[1] === 0xFE) return decodeUtf16(u8.subarray(2), true);
    if (u8.length >= 2 && u8[0] === 0xFE && u8[1] === 0xFF) return decodeUtf16(u8.subarray(2), false);
    // UTF-16 without a mark: a zero byte beside the first "0 HEAD"
    if (u8.length >= 4 && u8[0] === 0x30 && u8[1] === 0x00) return decodeUtf16(u8, true);
    if (u8.length >= 4 && u8[0] === 0x00 && u8[1] === 0x30) return decodeUtf16(u8, false);
    var cs = declaredCharset(u8);
    if (cs === 'ANSEL') return decodeAnsel(u8);
    if (cs === 'ANSI' || cs === 'WINDOWS-1252' || cs === 'CP1252' || cs === 'IBMPC' || cs === 'IBM' || cs === 'ASCII' || cs === 'ISO-8859-1' || cs === 'LATIN1') {
      return isValidUtf8(u8) ? decodeUtf8(u8) : decodeLatin(u8);     // many programs say ANSI and write UTF-8
    }
    if (isValidUtf8(u8)) return decodeUtf8(u8);
    return decodeLatin(u8);
  }

  // ---------------------------------------------------------------
  // Lines -> a tree of nodes
  // ---------------------------------------------------------------
  function unescapeAt(v) { return v.indexOf('@@') >= 0 ? v.replace(/@@/g, '@') : v; }

  function lex(text) {
    var roots = [], stack = [], warnings = [], lines = String(text).split(/\r\n|\n|\r/), i, ln, m, lvl, node, parent, bad = 0;
    for (i = 0; i < lines.length; i++) {
      ln = lines[i];
      if (i === 0 && ln.charCodeAt(0) === 0xFEFF) ln = ln.slice(1);
      // level, optional @xref@, tag, optional value (leading blanks are allowed by old exporters)
      m = /^[\s ]*(\d+)[ \t]+(?:(@[^@\s][^@]*@)[ \t]+)?([A-Za-z_][A-Za-z0-9_.:-]*)(?:[ \t](.*))?$/.exec(ln);
      if (!m) { if (ln.trim() !== '') bad++; continue; }
      lvl = parseInt(m[1], 10);
      node = { tag: m[3].toUpperCase(), xref: m[2] ? m[2].slice(1, -1) : '', value: m[4] == null ? '' : unescapeAt(m[4].replace(/\s+$/, '')), kids: [] };
      if (node.tag === 'CONC' || node.tag === 'CONT') {
        // continuation of the line above: CONC glues, CONT starts a new line.
        // (the value of a CONC keeps its leading space, so the line is NOT trimmed at the left)
        var target = stack.length ? stack[stack.length - 1] : null;
        while (target && target.level >= lvl) { stack.pop(); target = stack.length ? stack[stack.length - 1] : null; }
        if (target) {
          var raw = m[4] == null ? '' : unescapeAt(m[4]);
          target.node.value += (node.tag === 'CONT' ? '\n' : '') + raw;
          continue;
        }
        bad++;
        continue;
      }
      while (stack.length && stack[stack.length - 1].level >= lvl) stack.pop();
      if (lvl === 0) roots.push(node);
      else {
        parent = stack.length ? stack[stack.length - 1].node : null;
        if (!parent) { bad++; continue; }
        parent.kids.push(node);
      }
      stack.push({ level: lvl, node: node });
    }
    if (bad) warnings.push(bad + ' line(s) could not be read and were skipped.');
    return { roots: roots, warnings: warnings };
  }

  function kid(n, tag) { for (var i = 0; i < n.kids.length; i++) if (n.kids[i].tag === tag) return n.kids[i]; return null; }
  function kidsOf(n, tag) { return n.kids.filter(function(k) { return k.tag === tag; }); }
  function val(n, tag) { var k = kid(n, tag); return k ? k.value : ''; }
  function idOf(ref) { return ref && ref.charAt(0) === '@' ? ref.slice(1, -1) : ref; }

  // ---------------------------------------------------------------
  // Dates
  // ---------------------------------------------------------------
  var MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
                 // French Republican and Hebrew months are read as "no month"; their year is kept as written
                 ENE: 1, ABR: 4, AGO: 8, DIC: 12 };

  // One date value: [calendar escape] [day] [month] year [BC]
  function _single(s) {
    s = s.replace(/@#D[A-Z ]+@/g, ' ').replace(/\s+/g, ' ').trim();
    var m = /^(?:(\d{1,2}) )?(?:([A-Za-z]{3,})\.? )?(\d{1,4})(?:\/(\d{1,4}))?(?: ?(B\.?C\.?E?\.?|BCE))?$/i.exec(s);
    if (!m) return null;
    var mo = m[2] ? MONTHS[m[2].slice(0, 3).toUpperCase()] : 0;
    if (m[2] && !mo) return null;
    var y = parseInt(m[3], 10), d = m[1] ? parseInt(m[1], 10) : 0;
    if (m[5]) y = -y;
    if (d < 0 || d > 31) d = 0;
    return { y: y, m: mo || 0, d: mo ? d : 0 };
  }

  // q: '' exact, 'abt' about, 'bef', 'aft', 'bet' (between, y2 is the end), 'from'
  function parseDate(raw) {
    var s = String(raw == null ? '' : raw).trim(), out = { y: null, m: 0, d: 0, q: '', y2: null, raw: s }, t, p, a, b, mm;
    if (!s) return out;
    t = s.replace(/^INT\s+/i, '').replace(/\s*\([^)]*\)\s*$/, '').trim();   // "INT 1900 (about then)", phrases in parentheses
    mm = /^(ABT|ABOUT|CALC|CAL|EST|CIRCA|CA|C)\b\.?\s*(.+)$/i.exec(t);
    if (mm) { p = _single(mm[2]); if (p) { out.y = p.y; out.m = p.m; out.d = p.d; out.q = 'abt'; } return out; }
    mm = /^(BEFORE|BEF)\b\.?\s*(.+)$/i.exec(t);
    if (mm) { p = _single(mm[2]); if (p) { out.y = p.y; out.m = p.m; out.d = p.d; out.q = 'bef'; } return out; }
    mm = /^(AFTER|AFT)\b\.?\s*(.+)$/i.exec(t);
    if (mm) { p = _single(mm[2]); if (p) { out.y = p.y; out.m = p.m; out.d = p.d; out.q = 'aft'; } return out; }
    mm = /^(?:BET|BETWEEN)\s+(.+?)\s+(?:AND|&)\s+(.+)$/i.exec(t);
    if (mm) { a = _single(mm[1]); b = _single(mm[2]); if (a) { out.y = a.y; out.m = a.m; out.d = a.d; out.q = 'bet'; out.y2 = b ? b.y : null; } return out; }
    mm = /^FROM\s+(.+?)(?:\s+TO\s+(.+))?$/i.exec(t);
    if (mm) { a = _single(mm[1]); b = mm[2] ? _single(mm[2]) : null; if (a) { out.y = a.y; out.m = a.m; out.d = a.d; out.q = 'from'; out.y2 = b ? b.y : null; } return out; }
    mm = /^TO\s+(.+)$/i.exec(t);
    if (mm) { p = _single(mm[1]); if (p) { out.y = p.y; out.m = p.m; out.d = p.d; out.q = 'bef'; } return out; }
    p = _single(t);
    if (p) { out.y = p.y; out.m = p.m; out.d = p.d; }
    return out;
  }

  function yearOf(s) { var p = parseDate(s); return p.y; }

  var MON_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // lang 'es' | 'en'. exact=false shows the year only (what kids see for a living person).
  function formatDate(raw, lang, exact) {
    var p = typeof raw === 'object' && raw ? raw : parseDate(raw);
    if (p.y == null) return '';
    var es = lang === 'es', y = p.y < 0 ? Math.abs(p.y) + (es ? ' a. C.' : ' BC') : String(p.y), core;
    if (exact !== false && p.m) core = (p.d ? p.d + ' ' : '') + (es ? MON_ES : MON_EN)[p.m - 1] + ' ' + y;
    else core = y;
    switch (p.q) {
      case 'abt': return (es ? 'hacia ' : 'about ') + core;
      case 'bef': return (es ? 'antes de ' : 'before ') + core;
      case 'aft': return (es ? 'después de ' : 'after ') + core;
      case 'bet': return core + (p.y2 != null ? '–' + p.y2 : '');
      case 'from': return core + '–' + (p.y2 != null ? p.y2 : '');
      default: return core;
    }
  }

  // ---------------------------------------------------------------
  // Records
  // ---------------------------------------------------------------
  // Events kept for the person page. Anything else is skipped.
  var PERSON_EVENTS = ['BIRT', 'CHR', 'BAPM', 'BARM', 'BASM', 'BLES', 'CHRA', 'CONF', 'FCOM', 'ORDN', 'NATU', 'EMIG', 'IMMI',
                       'CENS', 'PROB', 'WILL', 'GRAD', 'RETI', 'DEAT', 'BURI', 'CREM', 'OCCU', 'EDUC', 'RESI', 'MILI', 'EVEN', 'PROP', 'RELI', 'NATI'];
  var FAMILY_EVENTS = ['MARR', 'DIV', 'ANUL', 'ENGA', 'MARB', 'MARC', 'MARL', 'MARS', 'CENS', 'RESI', 'EVEN'];

  function noteText(n, notes) {
    var v = n.value || '';
    var r = /^@[^@]+@$/.test(v) ? (notes[idOf(v)] || '') : v;
    // continuation lines under the NOTE were already folded into value by lex()
    return r.replace(/\s+$/, '');
  }

  function placeOf(ev) {
    var pl = kid(ev, 'PLAC'), name = '', lat = null, lon = null, map, la, lo;
    if (!pl) return { p: '', lat: null, lon: null };
    name = pl.value.replace(/\s*,\s*/g, ', ').replace(/^[,\s]+|[,\s]+$/g, '');
    map = kid(pl, 'MAP');
    if (map) {
      la = parseCoord(val(map, 'LATI'), 'N', 'S');
      lo = parseCoord(val(map, 'LONG'), 'E', 'W');
      if (la != null && lo != null) { lat = la; lon = lo; }
    }
    return { p: name, lat: lat, lon: lon };
  }
  // "N37.7749", "S33.45", "W70.65" or a plain signed number
  function parseCoord(str, pos, neg) {
    str = String(str || '').trim().toUpperCase();
    if (!str) return null;
    var sign = 1, h = str.charAt(0);
    if (h === neg) { sign = -1; str = str.slice(1); }
    else if (h === pos) str = str.slice(1);
    var f = parseFloat(str);
    return isFinite(f) ? Math.round(sign * f * 1000) / 1000 : null;
  }

  function eventOf(ev, type, notes) {
    var pl = placeOf(ev), date = val(ev, 'DATE'), ty = val(ev, 'TYPE'), v = ev.value;
    var label = type;
    if ((type === 'EVEN' || type === 'RESI') && ty) label = type + ':' + ty.slice(0, 40);
    else if ((type === 'OCCU' || type === 'EDUC' || type === 'RELI' || type === 'NATI') && v && v !== 'Y') label = type + ':' + v.slice(0, 60);
    var out = [label, String(date).slice(0, 60), pl.p.slice(0, 160)];
    if (pl.lat != null) { out.push(pl.lat, pl.lon); }
    return out;
  }

  function nameParts(indi) {
    var n = kid(indi, 'NAME'), g = '', s = '', x = '', nick = '', v, m;
    if (!n) return { g: '', s: '', x: '', k: '' };
    g = val(n, 'GIVN'); s = val(n, 'SURN'); x = val(n, 'NSFX'); nick = val(n, 'NICK');
    v = n.value || '';
    m = /^(.*?)\/([^/]*)\/(.*)$/.exec(v);
    if (m) {
      if (!g) g = m[1].trim();
      if (!s) s = m[2].trim();
      if (!x) x = m[3].trim();
    } else if (!g && !s && v) g = v.trim();
    // a surname written with several comma-separated parts ("Reyes,Soto") reads better with a space
    s = s.replace(/\s*,\s*/g, ' ');
    return { g: g.replace(/\s+/g, ' ').slice(0, 80), s: s.replace(/\s+/g, ' ').slice(0, 80), x: x.slice(0, 20), k: nick.slice(0, 40) };
  }

  function parse(text) {
    var lx = lex(text), roots = lx.roots, warnings = lx.warnings.slice();
    var info = { version: '', charset: '', software: '', people: {}, families: {}, warnings: warnings, stats: null };
    var notes = {}, indis = [], fams = [], nSour = 0, nObje = 0, nNote = 0, i, j, r;

    // header
    var head = roots.filter(function(r) { return r.tag === 'HEAD'; })[0];
    if (head) {
      var g = kid(head, 'GEDC');
      info.version = g ? val(g, 'VERS') : '';
      info.charset = val(head, 'CHAR');
      var sr = kid(head, 'SOUR');
      info.software = sr ? (val(sr, 'NAME') || sr.value || '') : '';
    } else warnings.push('The file has no GEDCOM header; it was read anyway.');
    var v7 = /^7/.test(info.version);

    roots.forEach(function(r) {
      if (r.tag === 'NOTE' || r.tag === 'SNOTE') { if (r.xref) notes[r.xref] = r.value; nNote++; }
      else if (r.tag === 'INDI') indis.push(r);
      else if (r.tag === 'FAM') fams.push(r);
      else if (r.tag === 'SOUR') nSour++;
      else if (r.tag === 'OBJE') nObje++;
    });

    indis.forEach(function(ind) {
      if (!ind.xref) return;
      var id = ind.xref, np = nameParts(ind), p = { id: id, ft: '', g: np.g, s: np.s, x: np.x, k: np.k, z: '', lv: 0, e: [], n: [], fc: [], fs: [], src: 0, obj: 0 };
      var sex = val(ind, 'SEX').toUpperCase();
      p.z = sex === 'M' ? 'M' : sex === 'F' ? 'F' : '';
      ind.kids.forEach(function(k) {
        var tag = k.tag;
        if (PERSON_EVENTS.indexOf(tag) >= 0) {
          if (p.e.length < 60) p.e.push(eventOf(k, tag, notes));
          kidsOf(k, 'NOTE').forEach(function(nn) { var t = noteText(nn, notes); if (t && p.n.length < 12) p.n.push(t); });
          p.src += kidsOf(k, 'SOUR').length;
        } else if (tag === 'NOTE' || tag === 'SNOTE') {
          var t2 = noteText(k, notes); if (t2 && p.n.length < 12) p.n.push(t2);
        } else if (tag === 'FAMC') {
          p.fc.push({ f: idOf(k.value), p: (val(k, 'PEDI') || '').toLowerCase().slice(0, 8) });
        } else if (tag === 'FAMS') p.fs.push(idOf(k.value));
        else if (tag === 'SOUR') p.src++;
        else if (tag === 'OBJE') p.obj++;
        else if (tag === '_FSFTID' || tag === '_FSID') p.ft = k.value.slice(0, 20);
        else if (tag === '_LIVING' || tag === 'LVG') { if (!/^(N|NO|FALSE)$/i.test(k.value)) p.lv = 1; }
        else if (tag === 'RESN') { if (/PRIVACY|CONFIDENTIAL/i.test(k.value)) p.lv = 1; }
      });
      // a name the exporter replaced for privacy
      var priv = function(x) { return /^(private|living|privado|vivo|\[private\])$/i.test(x.trim()); };
      if ((priv(np.g) && (!np.s || priv(np.s))) || (!np.g && priv(np.s))) p.lv = 1;
      info.people[id] = p;
    });

    fams.forEach(function(fam) {
      if (!fam.xref) return;
      var f = { id: fam.xref, h: '', w: '', c: [], e: [], n: [] };
      fam.kids.forEach(function(k) {
        if (k.tag === 'HUSB') f.h = idOf(k.value);
        else if (k.tag === 'WIFE') f.w = idOf(k.value);
        else if (k.tag === 'CHIL') f.c.push(idOf(k.value));
        else if (FAMILY_EVENTS.indexOf(k.tag) >= 0) { if (f.e.length < 20) f.e.push(eventOf(k, k.tag, notes)); }
        else if (k.tag === 'NOTE' || k.tag === 'SNOTE') { var t = noteText(k, notes); if (t && f.n.length < 6) f.n.push(t); }
      });
      info.families[fam.xref] = f;
    });

    // Make the two directions agree: a file may list a child under the family only,
    // or the family under the child only. @VOID@ (GEDCOM 7) and dangling ids are dropped.
    var fid, f2, pid, p2;
    for (fid in info.families) {
      f2 = info.families[fid];
      if (f2.h && !info.people[f2.h]) f2.h = '';
      if (f2.w && !info.people[f2.w]) f2.w = '';
      f2.c = f2.c.filter(function(c, idx, a) { return info.people[c] && a.indexOf(c) === idx; });
      [f2.h, f2.w].forEach(function(sp) {
        if (sp && info.people[sp].fs.indexOf(fid) < 0) info.people[sp].fs.push(fid);
      });
      f2.c.forEach(function(c) {
        var pc = info.people[c];
        if (!pc.fc.some(function(x) { return x.f === fid; })) pc.fc.push({ f: fid, p: '' });
      });
    }
    for (pid in info.people) {
      p2 = info.people[pid];
      p2.fc = p2.fc.filter(function(x) { return info.families[x.f]; });
      p2.fs = p2.fs.filter(function(x) { return info.families[x]; });
      p2.fc.forEach(function(x) {
        var fm = info.families[x.f];
        if (fm.c.indexOf(pid) < 0) fm.c.push(pid);
      });
      p2.fs.forEach(function(x) {
        var fm = info.families[x];
        if (fm.h !== pid && fm.w !== pid) { if (!fm.h) fm.h = pid; else if (!fm.w) fm.w = pid; }
      });
    }

    // people with no name at all get a kind placeholder; the app shows "?"
    var nIndi = Object.keys(info.people).length;
    var noName = 0;
    for (pid in info.people) if (!info.people[pid].g && !info.people[pid].s) noName++;
    if (noName) warnings.push(noName + ' people have no name.');
    if (!nIndi) warnings.push('No people were found in this file.');
    info.stats = { individuals: nIndi, families: Object.keys(info.families).length, notes: nNote, sources: nSour, media: nObje, v7: v7 };
    return info;
  }

  var api = { decode: decode, decodeAnsel: decodeAnsel, lex: lex, parse: parse, parseDate: parseDate, formatDate: formatDate, yearOf: yearOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Gedcom = api;
})(typeof window !== 'undefined' ? window : this);
