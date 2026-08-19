/* ================================================================
   MOVE QUEST — move-quest-scan.js

   Steps from screenshots. The parent screenshots the Movement table
   in the Fitbit / Google Health app (the per-kid weekly view), drops
   the images into the Steps screen, and this module reads them:

     screenshot → on-device OCR (vendored tesseract.js, js/tesseract/)
                → Movement-table line parser
                → { 'YYYY-MM-DD': steps }

   Everything runs in the browser. The images never leave the device,
   and after the first load the OCR engine works offline like the
   rest of the suite.

   OCR misreads happen, so this module never saves anything itself:
   it hands totals back to the caller, which shows a review table
   the parent can correct before storing.

   Requires: nothing at load time. Lazily injects js/tesseract/ on
   first scan.
   ================================================================ */

var MoveQuestScan = (function() {
  'use strict';

  // ── Parsing ─────────────────────────────────────────────────────

  // English and Spanish month tokens, matched on their first letters
  // so "Aug", "August", "ago" and "agosto" all land on the same month.
  var MONTHS = [
    ['jan', 1], ['ene', 1],
    ['feb', 2],
    ['mar', 3],            // marzo — "mar" the weekday is consumed earlier
    ['apr', 4], ['abr', 4],
    ['may', 5],
    ['jun', 6],
    ['jul', 7],
    ['aug', 8], ['ago', 8],
    ['sep', 9],
    ['oct', 10],
    ['nov', 11],
    ['dec', 12], ['dic', 12]
  ];

  var DAY_PREFIX = /^\s*(today|hoy|sun|mon|tue|wed|thu|fri|sat|dom|lun|mar|mi[eé]|jue|vie|s[aá]b)[a-zá-úñ]*[.,:]?\s+/i;

  // Column separator injected between words whose horizontal gap is
  // wide enough to be a table column, not word spacing. Any character
  // that can never come out of OCR text works.
  var COL = '\u00a6';

  /* Rebuild the page text from word boxes, marking column gaps.
     "Sat, Aug 8   14,026   3 h 52 m   1 h 1 m" becomes
     "Sat, Aug 8 ¦ 14,026 ¦ 3 h 52 m ¦ 1 h 1 m", which removes the
     one real ambiguity of flat text: whether "1 h 42 m" is a single
     duration or two columns. Falls back to null when the engine
     returned no block data. */
  function structuredText(data) {
    if (!data || !data.blocks) return null;
    var out = [];
    data.blocks.forEach(function(block) {
      (block.paragraphs || []).forEach(function(par) {
        (par.lines || []).forEach(function(line) {
          var words = line.words || [];
          if (!words.length) return;
          var lineH = Math.max(8, line.bbox ? (line.bbox.y1 - line.bbox.y0) : 20);
          var gapMin = Math.max(12, lineH * 0.7);
          var parts = [];
          for (var i = 0; i < words.length; i++) {
            if (i > 0) {
              var gap = words[i].bbox.x0 - words[i - 1].bbox.x1;
              parts.push(gap > gapMin ? ' ' + COL + ' ' : ' ');
            }
            parts.push(words[i].text);
          }
          out.push(parts.join(''));
        });
      });
    });
    return out.length ? out.join('\n') : null;
  }

  function _monthFrom(word) {
    var w = String(word || '').toLowerCase();
    for (var i = 0; i < MONTHS.length; i++) {
      if (w.indexOf(MONTHS[i][0]) === 0) return MONTHS[i][1];
    }
    return 0;
  }

  function _num(s) {
    var t = String(s).replace(/[.,\s](?=\d{3}\b)/g, '').replace(/[^\d]/g, '');
    if (!t) return null;
    var n = parseInt(t, 10);
    return (isFinite(n) && n >= 0 && n <= 200000) ? n : null;
  }

  function _pad(n) { return (n < 10 ? '0' : '') + n; }

  /* Duration tokens in OCR text come glued as often as spaced —
     "4 h 40 m", "4h40 m" and "3h33m" are all the same reading — so
     the pattern must not lean on word boundaries. Each token records
     the span it covered so the caller can blank durations out of the
     line before looking for the steps number. */
  function _durTokens(tail) {
    var out = [];
    var re = /(\d+)\s*h\s*(?:(\d+)\s*m)?|(\d+)\s*m/gi;
    var m;
    while ((m = re.exec(tail)) !== null) {
      out.push({
        h: m[1] !== undefined ? parseInt(m[1], 10) : null,
        m: m[1] !== undefined
          ? (m[2] !== undefined ? parseInt(m[2], 10) : null)
          : parseInt(m[3], 10),
        start: m.index,
        end: m.index + m[0].length
      });
    }
    return out;
  }

  /* The Light and Active minutes of one row. */
  function _durationsFrom(tail) {
    // The Active column wraps on narrow phones, leaving "2 h 17" with
    // its "m" on the next OCR line — restore it before scanning.
    tail = _repairDigits(tail).replace(/(\d+\s*h\s*\d+)\s*$/, '$1 m');
    var out = _validTokens(_durTokens(tail));

    function total(t) { return (t.h || 0) * 60 + (t.m || 0); }
    function clamp(n) { return (n === null || !isFinite(n) || n < 0 || n > 1440) ? null : n; }

    // Two columns flatten into one line of text, which makes
    // "3 h" (light) + "15 m" (active) read exactly like the single
    // duration "3 h 15 m". Rows always carry both columns, so a lone
    // h+m token is treated as that pair, split back apart.
    var light = null, active = null;
    if (out.length >= 2) {
      light = total(out[0]);
      active = total(out[1]);
    } else if (out.length === 1) {
      if (out[0].h !== null && out[0].m !== null) {
        light = out[0].h * 60;
        active = out[0].m;
      } else {
        light = total(out[0]);
      }
    }
    return { light: clamp(light), active: clamp(active) };
  }

  /* OCR trades digits for lookalike letters constantly — the digit 1
     in "1 h 9 m" comes back as "l h 9 m", killing the hour and leaving
     "9 m". Inside text known to be numeric, repair the classic swaps.
     A [letter][digit] pair like "l1" is a split stroke of one digit:
     drop the letter rather than doubling it. */
  function _repairDigits(str) {
    return String(str)
      .replace(/[lI|í](?=\d)/g, '')
      .replace(/(\d)[lI|í]/g, '$1' + '1')
      .replace(/[lI|í]/g, '1')
      .replace(/[Oo]/g, '0')
      .replace(/é/g, '6');
  }

  /* Impossible readings become null instead of numbers: on these
     screens minutes past the hour are 0-59 (an hour or more always
     shows as "N h M m") and hours are 0-23. */
  function _validTokens(toks) {
    var out = [];
    toks.forEach(function(t) {
      var h = t.h, m = t.m;
      if (h !== null && (h < 0 || h > 23)) return;
      if (h !== null && m !== null && (m < 0 || m > 59)) m = null;
      if (h === null && (m === null || m < 0 || m > 59)) return;
      out.push({ h: h, m: m, start: t.start, end: t.end });
    });
    return out;
  }

  /* All duration tokens in one COLUMN, summed — inside a single
     column "1 h 42 m" is one reading, never two. Null when nothing
     in the field parses as a duration. The field is known to hold
     only a duration, so repair is aggressive: lookalike letters
     become digits ("é" was a 6), a lone T hugging the h is a lost 1,
     and anything else that is not digit/h/m becomes a space. */
  function _fieldDuration(field) {
    var fixed = _repairDigits(field)
      .replace(/[Ss]/g, '5')
      .replace(/B/g, '8')
      .replace(/M/g, 'm')
      .replace(/H/g, 'h')
      .replace(/[Tt](?=\s*h\b)/g, '1')
      .replace(/[^0-9hm\s]/g, ' ')
      .replace(/(\d+\s*h\s*\d+)\s*$/, '$1 m');
    var toks = _validTokens(_durTokens(fixed));
    if (!toks.length) return null;
    var total = 0;
    toks.forEach(function(t) { total += (t.h || 0) * 60 + (t.m || 0); });
    return (total >= 0 && total <= 1440) ? total : null;
  }

  /* Parse one column-marked row: date ¦ steps ¦ light ¦ active. */
  function _parseFieldRow(line) {
    var fields = line.split(COL).map(function(f) { return f.trim(); }).filter(Boolean);
    if (fields.length < 2) return null;
    if (!DAY_PREFIX.test(fields[0])) return null;

    var steps = null, durations = [];
    for (var i = 1; i < fields.length; i++) {
      var f = fields[i];
      var isDuration = /\d\s*[hm]/i.test(f);
      var fNum = _repairDigits(f);
      if (steps === null && !isDuration && /^\d[\d.,\s]*$/.test(fNum)) {
        steps = _num(fNum);
      } else if (durations.length < 2) {
        var d = _fieldDuration(f);
        if (d !== null) durations.push(d);
      }
    }
    if (steps === null) return null;
    return {
      datePart: fields[0],
      steps: steps,
      light: durations.length > 0 ? durations[0] : null,
      active: durations.length > 1 ? durations[1] : null
    };
  }

  /* Parse the OCR text of one screenshot into rows of
     { key: 'YYYY-MM-DD', steps, light, active } — light and active
     are minutes, null when unreadable. Pure — `today` is injectable
     so the year inference is testable.

     A Movement row reads like:
       "Sat, Aug 8   14,026   4 h 40 m   28 m"
       "mié, 6 ago   7.507    2 h 57 m   16 m"
     The screenshot has no year, so each date is taken as the most
     recent time that month/day happened. Rows with 0 steps are
     dropped: on these screens 0 means the watch was not worn, and
     writing a 0 would erase a day the kid may have typed in. */
  function parseMovementText(text, today) {
    today = today || new Date();
    var endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    var rows = [];

    String(text || '').split(/\n+/).forEach(function(line) {
      // Column-marked lines (from word boxes) parse by field — exact
      // for every duration. Flat lines keep the heuristic path.
      var fieldRow = line.indexOf(COL) !== -1 ? _parseFieldRow(line) : null;
      if (line.indexOf(COL) !== -1 && !fieldRow) line = line.split(COL).join(' ');

      var m = DAY_PREFIX.exec(fieldRow ? fieldRow.datePart : line);
      if (!m) return;
      var rest = fieldRow
        ? fieldRow.datePart.slice(m[0].length)
        : line.slice(m[0].length);

      // "Aug 8" (EN) or "8 ago" / "8 de ago" (ES). Both are anchored
      // to the start of the row — searching further in would let the
      // month-first pattern bite into the numbers ("ago 14.026" must
      // not read as August 14).
      var month = 0, day = 0, dateEnd = -1;
      var en = /^\s*([A-Za-zá-úñ]{3,10})\.?\s+(\d{1,2})\b/.exec(rest);
      if (en) { month = _monthFrom(en[1]); day = parseInt(en[2], 10); }
      if (month) {
        dateEnd = en[0].length;
      } else {
        var es = /^\s*(\d{1,2})\s+(?:de\s+)?([A-Za-zá-úñ]{3,10})\b/.exec(rest);
        if (es) {
          month = _monthFrom(es[2]);
          day = parseInt(es[1], 10);
          if (month) dateEnd = es[0].length;
        }
      }
      if (!month || !day || day > 31) return;

      var steps, mins;
      if (fieldRow) {
        steps = fieldRow.steps;
        mins = { light: fieldRow.light, active: fieldRow.active };
      } else {
        // Flat text: steps is the first number left once the durations
        // are gone; the durations become the Light and Active minutes.
        var tail = rest.slice(dateEnd);
        mins = _durationsFrom(tail);
        var chars = tail.replace(/(\d+\s*h\s*\d+)\s*$/, '$1 m').split('');
        _durTokens(chars.join('')).forEach(function(t) {
          for (var c = t.start; c < t.end; c++) chars[c] = ' ';
        });
        var stripped = chars.join('');
        var stepTok = /\d[\d.,]*/.exec(stripped);
        if (!stepTok) return;
        steps = _num(stepTok[0]);
      }
      if (steps === null || steps === 0) return;

      var d = new Date(today.getFullYear(), month - 1, day);
      if (d.getTime() > endOfToday.getTime()) d.setFullYear(d.getFullYear() - 1);
      // Reject impossible dates (Feb 30 rolls over to March).
      if (d.getMonth() !== month - 1) return;

      rows.push({
        key: d.getFullYear() + '-' + _pad(d.getMonth() + 1) + '-' + _pad(d.getDate()),
        steps: steps,
        light: mins.light,
        active: mins.active
      });
    });

    return rows;
  }

  // ── OCR engine (lazy) ───────────────────────────────────────────

  var _workerPromise = null;

  function _loadScript() {
    if (typeof Tesseract !== 'undefined') return Promise.resolve();
    return new Promise(function(resolve, reject) {
      var s = document.createElement('script');
      s.src = 'js/tesseract/tesseract.min.js';
      s.onload = resolve;
      s.onerror = function() { reject(new Error('the OCR engine could not be loaded')); };
      document.head.appendChild(s);
    });
  }

  function _createWorker(base, coreFile) {
    return Tesseract.createWorker('eng', 1, {
      workerPath: base + 'worker.min.js',
      corePath: base + coreFile,
      langPath: base.replace(/\/$/, ''),
      gzip: true
    });
  }

  function _getWorker() {
    if (_workerPromise) return _workerPromise;
    _workerPromise = _loadScript().then(function() {
      // Absolute URLs: the worker resolves relative paths against its
      // own location, which would double the js/tesseract/ prefix.
      // corePath names a specific build rather than a directory —
      // left to itself the worker probes for a relaxed-SIMD variant
      // we do not vendor. The SIMD build covers every browser since
      // 2021 (and Safari 16.4); anything older falls back to the
      // plain build.
      var base = new URL('js/tesseract/', window.location.href).href;
      return _createWorker(base, 'tesseract-core-simd-lstm.wasm.js').catch(function() {
        return _createWorker(base, 'tesseract-core-lstm.wasm.js');
      });
    });
    _workerPromise.catch(function() { _workerPromise = null; });
    return _workerPromise;
  }

  function _releaseWorker() {
    var p = _workerPromise;
    _workerPromise = null;
    if (p) p.then(function(w) { try { w.terminate(); } catch (e) {} }, function() {});
  }

  // The app renders light-on-dark; tesseract reads dark-on-light far
  // better, so invert when the picture is mostly dark.
  function _prepare(file) {
    return createImageBitmap(file).then(function(bmp) {
      var canvas = document.createElement('canvas');
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(bmp, 0, 0);
      if (bmp.close) bmp.close();

      var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var px = img.data;
      var sum = 0;
      for (var i = 0; i < px.length; i += 40) sum += px[i] * 0.3 + px[i + 1] * 0.6 + px[i + 2] * 0.1;
      var invert = (sum / (px.length / 40)) < 128;
      // Grayscale everything: the Active column is coloured, and after
      // a plain inversion it lands as odd purples that OCR misreads.
      // Luminance keeps every column plain dark-on-light text.
      for (var j = 0; j < px.length; j += 4) {
        var y = px[j] * 0.299 + px[j + 1] * 0.587 + px[j + 2] * 0.114;
        if (invert) y = 255 - y;
        px[j] = px[j + 1] = px[j + 2] = y;
      }
      ctx.putImageData(img, 0, 0);
      return canvas;
    });
  }

  function isImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.indexOf('image/') === 0) return true;
    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name || '');
  }

  /* OCR every screenshot and merge the rows. The same day can appear
     in two screenshots (overlapping weeks, or a "Today" row captured
     twice at different times) — the day's count only ever grows, so
     the larger reading wins.
     Resolves { totals, report: { scanned, problems: [] } }. */
  function scanImages(files, onProgress) {
    var totals = {};
    var report = { scanned: 0, problems: [] };
    var list = (files || []).filter(isImageFile);
    if (!list.length) return Promise.resolve({ totals: totals, report: report });

    var chain = _getWorker();
    list.forEach(function(file, i) {
      chain = chain.then(function(worker) {
        if (onProgress) onProgress(i + 1, list.length);
        return _prepare(file).then(function(canvas) {
          return worker.recognize(canvas, {}, { text: true, blocks: true });
        }).then(function(result) {
          var text = structuredText(result.data) || result.data.text;
          var rows = parseMovementText(text);
          if (!rows.length) {
            report.problems.push(file.name + ': no Movement rows found — screenshot the weekly list with the Steps column visible.');
          } else {
            report.scanned++;
            rows.forEach(function(r) {
              var cur = totals[r.key];
              if (!cur) {
                totals[r.key] = { steps: r.steps, light: r.light, active: r.active };
              } else {
                // Overlapping weeks repeat a day, and a day's counts
                // only ever grow — the larger reading wins per field.
                cur.steps = Math.max(cur.steps, r.steps);
                if (r.light !== null) cur.light = cur.light === null ? r.light : Math.max(cur.light, r.light);
                if (r.active !== null) cur.active = cur.active === null ? r.active : Math.max(cur.active, r.active);
              }
            });
          }
          return worker;
        }, function() {
          report.problems.push(file.name + ': could not be read as a picture. Screenshots should be PNG or JPG.');
          return worker;
        });
      });
    });

    return chain.then(function() {
      _releaseWorker();
      return { totals: totals, report: report };
    }, function(err) {
      _releaseWorker();
      report.problems.push('OCR failed: ' + (err && err.message ? err.message : 'unknown error'));
      return { totals: totals, report: report };
    });
  }

  return {
    isImageFile: isImageFile,
    parseMovementText: parseMovementText,
    structuredText: structuredText,
    scanImages: scanImages
  };
})();
