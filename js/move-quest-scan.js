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

  /* Parse the OCR text of one screenshot into rows of
     { key: 'YYYY-MM-DD', steps }. Pure — `today` is injectable so
     the year inference is testable.

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
      var m = DAY_PREFIX.exec(line);
      if (!m) return;
      var rest = line.slice(m[0].length);

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

      // Steps is the first number left once the durations are gone.
      var tail = rest.slice(dateEnd)
        .replace(/\b\d+\s*h\b(\s*\d+\s*m\b)?/gi, ' ')
        .replace(/\b\d+\s*m\b/gi, ' ');
      var stepTok = /\d[\d.,]*/.exec(tail);
      if (!stepTok) return;
      var steps = _num(stepTok[0]);
      if (steps === null || steps === 0) return;

      var d = new Date(today.getFullYear(), month - 1, day);
      if (d.getTime() > endOfToday.getTime()) d.setFullYear(d.getFullYear() - 1);
      // Reject impossible dates (Feb 30 rolls over to March).
      if (d.getMonth() !== month - 1) return;

      rows.push({
        key: d.getFullYear() + '-' + _pad(d.getMonth() + 1) + '-' + _pad(d.getDate()),
        steps: steps
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
      var mean = sum / (px.length / 40);
      if (mean < 128) {
        for (var j = 0; j < px.length; j += 4) {
          px[j] = 255 - px[j];
          px[j + 1] = 255 - px[j + 1];
          px[j + 2] = 255 - px[j + 2];
        }
        ctx.putImageData(img, 0, 0);
      }
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
          return worker.recognize(canvas);
        }).then(function(result) {
          var rows = parseMovementText(result.data.text);
          if (!rows.length) {
            report.problems.push(file.name + ': no Movement rows found — screenshot the weekly list with the Steps column visible.');
          } else {
            report.scanned++;
            rows.forEach(function(r) {
              totals[r.key] = Math.max(totals[r.key] || 0, r.steps);
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
    scanImages: scanImages
  };
})();
