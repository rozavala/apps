/* ================================================================
   LITTLE MAESTRO — Score engine (lm-score.js)

   One shared representation for every song, so the sheet music,
   the listen/play-along audio, the falling notes and the practice
   steps all agree on what happens when, in both hands.

   ── Writing a song ─────────────────────────────────────────────
   New songs carry a `score` instead of a hand-built `notes` list:

     score: {
       time: '3/4',            // 2/4 3/4 4/4 6/8 …   (default 4/4)
       key:  'G',              // VexFlow key name: C G D F Bb Am Em …
       pickup: 1,              // optional: beats in the first (short) bar
       rh: 'D5q:5 G4e:1 A4e B4e C5e | D5q G4q G4q | …',
       lh: 'G3+B3+D4h:5,3,1 A3q | B3h. | …',
     }

   Tokens are separated by spaces, bars by `|`:
     C4q        pitch + duration  (w h q e s = whole … sixteenth)
     C4q.       dotted
     C4h~       tied into the next note of the same pitch
     C4q:3      finger number
     C3+E3+G3h:5,3,1   chord (fingers listed bottom → top)
     Rq         rest
   Pitches are absolute (F#4, Bb3); key signatures and naturals are
   worked out for display, so write what sounds.

   Bar marks (in either hand's bar; both hands share them):
     [:  … :]   repeat start / end      {1} {2}   1st / 2nd ending
     Fine  DC  DS  Segno                D.C. / D.S. al Fine
   The sheet shows each bar once; listening, learning and play-along
   follow the performance order (repeats taken, endings chosen).

   Optional extras on `score`:
     tempo: 'Moderately'                        shown above bar 1
     marks: [{ bar: 5, kind: 'tip'|'teacher'|'dynamic', text: '…' }]
       tips and teacher's notes show over their bar (and in practice);
       dynamics (pp p mp mf f ff) also set how loud the app plays.

   compile() checks that every bar adds up to the time signature in
   both hands and throws with the bar number when one doesn't.

   Old songs (a flat `notes` list per hand, no rests) still work:
   they are grouped into 4/4 bars the way the sheet music always
   did. Their left hand is only kept when it lasts exactly as long
   as the right hand; most old two-hand songs have a left hand that
   drifts out of step, and playing that against the melody is worse
   than leaving it out.

   Works in the browser (window.LMScore) and in Node (module.exports)
   so tools/check-songs.js can validate the catalog.
   ================================================================ */

(function (root) {
  'use strict';

  // ── Durations ─────────────────────────────────────────────────
  // Lengths are measured in quarter-note beats throughout.
  var DUR_BEATS = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
  var LEGACY_DUR = {
    whole: ['w', 0], half: ['h', 0], quarter: ['q', 0], eighth: ['e', 0], sixteenth: ['s', 0],
    'dotted-whole': ['w', 1], 'dotted-half': ['h', 1], 'dotted-quarter': ['q', 1], 'dotted-eighth': ['e', 1],
  };
  var DUR_NAME = { w: 'whole', h: 'half', q: 'quarter', e: 'eighth', s: 'sixteenth' };
  var EPS = 1e-6;

  function beatsOf(dur, dots) {
    var b = DUR_BEATS[dur];
    return dots ? b * 1.5 : b;
  }

  // Name a span of beats as one note value, if there is one.
  function durForBeats(beats) {
    var keys = ['w', 'h', 'q', 'e', 's'];
    for (var i = 0; i < keys.length; i++) {
      if (Math.abs(DUR_BEATS[keys[i]] - beats) < EPS) return { dur: keys[i], dots: 0 };
      if (Math.abs(DUR_BEATS[keys[i]] * 1.5 - beats) < EPS) return { dur: keys[i], dots: 1 };
    }
    return null;
  }

  // Split a rest span into note values that each start on a clean spot.
  function restsFor(beats) {
    var out = [];
    var order = [4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25];
    var left = beats;
    while (left > EPS) {
      var pick = null;
      for (var i = 0; i < order.length; i++) {
        if (order[i] <= left + EPS) { pick = order[i]; break; }
      }
      if (!pick) break;
      out.push(durForBeats(pick));
      left -= pick;
    }
    return out;
  }

  // ── Pitches ───────────────────────────────────────────────────
  var LETTER_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  var SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var PITCH_RE = /^([A-G])(#|b)?(\d)$/;

  function parsePitch(p) {
    var m = PITCH_RE.exec(p);
    if (!m) return null;
    var alt = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
    return { letter: m[1], alt: alt, oct: +m[3], midi: LETTER_SEMI[m[1]] + alt + (+m[3] + 1) * 12 };
  }

  function midiOf(p) {
    var q = parsePitch(p);
    return q ? q.midi : null;
  }

  // Sharp spelling, which is what the keyboard, MIDI and audio use.
  function canonical(p) {
    var midi = midiOf(p);
    if (midi == null) return p;
    return SHARP_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
  }

  // ── Key signatures ────────────────────────────────────────────
  var SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
  var FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
  var KEY_COUNT = {
    C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
    F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
    Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, 'G#m': 5,
    Dm: -1, Gm: -2, Cm: -3, Fm: -4, Bbm: -5, Ebm: -6,
  };

  function keyAlterations(key) {
    var n = KEY_COUNT[key] || 0;
    var alts = { C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 };
    for (var i = 0; i < Math.abs(n); i++) {
      if (n > 0) alts[SHARP_ORDER[i]] = 1; else alts[FLAT_ORDER[i]] = -1;
    }
    return alts;
  }

  // ── Time signatures ───────────────────────────────────────────
  function parseTime(time) {
    var m = /^(\d+)\/(\d+)$/.exec(time || '4/4');
    if (!m) throw new Error('bad time signature "' + time + '"');
    var num = +m[1], den = +m[2];
    var barBeats = num * 4 / den;                 // in quarter beats
    // Compound meters count in dotted quarters; everything else in its denominator.
    var compound = den === 8 && num % 3 === 0 && num > 3;
    var pulse = compound ? 1.5 : 4 / den;         // quarter beats per metronome click
    return { num: num, den: den, str: num + '/' + den, barBeats: barBeats, pulse: pulse, compound: compound };
  }

  // ── Token parsing ─────────────────────────────────────────────
  var TOKEN_RE = /^((?:[A-G][#b]?\d\+)*[A-G][#b]?\d|R)(w|h|q|e|s)(\.?)(~?)(?::([1-5](?:,[1-5])*))?$/;
  var VOLTA_RE = /^\{([1-4])\}$/;

  // A bar mark token, or null. Sets the flag on `flags`.
  function barMark(tok, flags) {
    var v = VOLTA_RE.exec(tok);
    if (v) { flags.volta = +v[1]; return true; }
    switch (tok.toLowerCase()) {
      case '[:': flags.start = true; return true;
      case ':]': flags.end = true; return true;
      case 'fine': flags.fine = true; return true;
      case 'dc': flags.dc = true; return true;
      case 'ds': flags.ds = true; return true;
      case 'segno': flags.segno = true; return true;
    }
    return false;
  }

  function parseVoice(src, hand, songLabel) {
    var bars = String(src || '').split('|').map(function (b) { return b.trim(); });
    if (bars.length && bars[bars.length - 1] === '') bars.pop();
    return bars.map(function (bar, bi) {
      var flags = {};
      if (!bar) { var empty = []; empty.flags = flags; return empty; }
      var evs = bar.split(/\s+/).filter(function (tok) { return !barMark(tok, flags); }).map(function (tok) {
        var m = TOKEN_RE.exec(tok);
        if (!m) throw new Error(songLabel + ': ' + hand + ' bar ' + (bi + 1) + ': cannot read "' + tok + '"');
        var rest = m[1] === 'R';
        var pitches = rest ? [] : m[1].split('+');
        pitches.forEach(function (p) {
          if (!parsePitch(p)) throw new Error(songLabel + ': ' + hand + ' bar ' + (bi + 1) + ': bad pitch "' + p + '"');
        });
        var fingers = m[5] ? m[5].split(',').map(Number) : [];
        if (fingers.length && fingers.length !== pitches.length) {
          throw new Error(songLabel + ': ' + hand + ' bar ' + (bi + 1) + ': "' + tok + '" has ' + pitches.length + ' notes but ' + fingers.length + ' fingers');
        }
        var dots = m[3] ? 1 : 0;
        return {
          rest: rest,
          pitches: pitches,
          dur: m[2],
          dots: dots,
          beats: beatsOf(m[2], dots),
          tie: !!m[4],
          fingers: fingers,
        };
      });
      evs.flags = flags;
      return evs;
    });
  }

  function mergeFlags(a, b) {
    var out = {};
    [a || {}, b || {}].forEach(function (f) { Object.keys(f).forEach(function (k) { if (f[k]) out[k] = f[k]; }); });
    return out;
  }

  // ── Compile a `score` spec ────────────────────────────────────
  function compileSpec(song) {
    var spec = song.score;
    var label = '#' + song.id + ' ' + song.title;
    var time = parseTime(spec.time);
    var rhBars = spec.rh ? parseVoice(spec.rh, 'RH', label) : [];
    var lhBars = spec.lh ? parseVoice(spec.lh, 'LH', label) : [];
    var nBars = Math.max(rhBars.length, lhBars.length);
    if (spec.rh && spec.lh && rhBars.length !== lhBars.length) {
      throw new Error(label + ': RH has ' + rhBars.length + ' bars but LH has ' + lhBars.length);
    }
    var pickup = spec.pickup || 0;

    var measures = [];
    var start = 0;
    for (var i = 0; i < nBars; i++) {
      var expect = time.barBeats;
      if (i === 0 && pickup) expect = pickup;
      var m = { index: i, start: start, len: expect, rh: rhBars[i] || null, lh: lhBars[i] || null,
                flags: mergeFlags(rhBars[i] && rhBars[i].flags, lhBars[i] && lhBars[i].flags) };
      ['rh', 'lh'].forEach(function (h) {
        var evs = m[h];
        if (!evs) return;
        var sum = evs.reduce(function (a, e) { return a + e.beats; }, 0);
        // A song with a pickup may end on a short bar that completes it.
        var lastShort = i === nBars - 1 && pickup && Math.abs(sum - (time.barBeats - pickup)) < EPS;
        if (Math.abs(sum - expect) > EPS && !lastShort) {
          throw new Error(label + ': ' + h.toUpperCase() + ' bar ' + (i + 1) + ' has ' + sum + ' beats, expected ' + expect);
        }
        var t = start;
        evs.forEach(function (e) { e.t = t; e.m = i; t += e.beats; });
      });
      if (i === nBars - 1 && pickup) {
        var any = m.rh || m.lh;
        m.len = any.reduce(function (a, e) { return a + e.beats; }, 0);
      }
      start += m.len;
      measures.push(m);
    }
    var c = finish(song, time, spec.key || 'C', pickup, measures, spec.marks);
    c.tempo = spec.tempo || '';
    return c;
  }

  // ── Adapt an old flat `notes` song ────────────────────────────
  function compileLegacy(song) {
    var time = parseTime('4/4');
    var notes = song.notes || [];
    function toEvents(hand) {
      return notes.filter(function (n) { return hand === 'rh' ? (!n.hand || n.hand === 'right') : n.hand === 'left'; })
        .map(function (n) {
          var d = LEGACY_DUR[n.duration] || ['q', 0];
          return {
            rest: false, pitches: [n.note], dur: d[0], dots: d[1], beats: beatsOf(d[0], d[1]),
            tie: false, fingers: n.finger ? [n.finger] : [], gameSkip: !!n.gameSkip,
          };
        });
    }
    var rh = toEvents('rh');
    var lh = toEvents('lh');
    var total = function (evs) { return evs.reduce(function (a, e) { return a + e.beats; }, 0); };
    var lhAligned = lh.length > 0 && Math.abs(total(lh) - total(rh)) < EPS;

    // Fill bars greedily, as the old renderer did. A note that runs past
    // the barline is left in the bar it starts in; the bar is just long.
    function bars(evs) {
      var out = [], cur = [], sum = 0;
      evs.forEach(function (e) {
        cur.push(e); sum += e.beats;
        if (sum >= time.barBeats - EPS) { out.push(cur); cur = []; sum = 0; }
      });
      if (cur.length) out.push(cur);
      return out;
    }
    var rhBars = bars(rh);
    var lhBars = lhAligned ? bars(lh) : [];
    var nBars = Math.max(rhBars.length, lhBars.length);
    var measures = [];
    var start = 0;
    for (var i = 0; i < nBars; i++) {
      var m = { index: i, start: start, len: time.barBeats, rh: rhBars[i] || null, lh: lhAligned ? (lhBars[i] || []) : null, flags: {} };
      var longest = 0;
      ['rh', 'lh'].forEach(function (h) {
        if (!m[h]) return;
        var t = start;
        m[h].forEach(function (e) { e.t = t; e.m = i; t += e.beats; });
        longest = Math.max(longest, t - start);
      });
      m.len = Math.max(time.barBeats, longest);
      // Pad a short bar with rests so it still reads as a full bar.
      ['rh', 'lh'].forEach(function (h) {
        if (!m[h]) return;
        var used = m[h].reduce(function (a, e) { return a + e.beats; }, 0);
        if (used < m.len - EPS) {
          var t2 = start + used;
          restsFor(m.len - used).forEach(function (r) {
            m[h].push({ rest: true, pitches: [], dur: r.dur, dots: r.dots, beats: beatsOf(r.dur, r.dots), tie: false, fingers: [], t: t2, m: i, pad: true });
            t2 += beatsOf(r.dur, r.dots);
          });
        }
      });
      start += m.len;
      measures.push(m);
    }
    var c = finish(song, time, 'C', 0, measures);
    c.legacy = true;
    c.lhDropped = lh.length > 0 && !lhAligned;
    return c;
  }

  // ── Performance order ─────────────────────────────────────────
  // Which bars are played, in what order: repeats taken once, the
  // ending for each pass, then D.C./D.S. back to the top (or segno)
  // without repeats, stopping at Fine.
  function voltaSpans(measures) {
    // Ending n runs from its {n} bar up to and including the next :]
    // (stopping early at another {..}); an ending with no :] after it
    // (the last one) covers just the bars marked {n}.
    var n = measures.length, volta = [];
    for (var i = 0; i < n; i++) volta[i] = volta[i] || 0;
    for (var j = 0; j < n; j++) {
      var k = measures[j].flags.volta;
      if (!k) continue;
      var endAt = -1;
      for (var q = j; q < n; q++) {
        if (q > j && measures[q].flags.volta) break;
        if (measures[q].flags.end) { endAt = q; break; }
      }
      for (var r = j; r <= (endAt >= 0 ? endAt : j); r++) volta[r] = k;
    }
    return volta;
  }

  function performance(measures) {
    var n = measures.length;
    var volta = voltaSpans(measures);
    var lastEnding = Math.max.apply(null, [0].concat(volta));
    var segno = 0;
    measures.forEach(function (m, i) { if (m.flags.segno) segno = i; });
    var order = [];
    var repStart = 0, pass = 1, taken = {}, jumped = false, cameBack = false;
    var i = 0, guard = 0;
    while (i < n && guard++ < n * 10) {
      var f = measures[i].flags;
      // Walking into a new repeat section (not landing on it from a :])
      if (f.start && !cameBack) { repStart = i; pass = 1; }
      cameBack = false;
      // Endings: this pass's ending only; after D.C./D.S., the last ending
      if (volta[i] && volta[i] !== (jumped ? lastEnding : pass)) { i++; continue; }
      order.push(i);
      if (jumped && f.fine) break;
      if (f.end && !jumped && !taken[i]) {
        taken[i] = true;
        pass++;
        i = repStart;
        cameBack = true;
        continue;
      }
      if (f.end) pass = 1;
      if ((f.dc || f.ds) && !jumped) {
        jumped = true;
        i = f.ds ? segno : 0;
        cameBack = true;
        continue;
      }
      i++;
    }
    return { order: order, volta: volta };
  }

  // ── Shared tail: sounding notes, onset events, ranges ─────────
  // Staff events keep their written place (e.t, e.m); notes and onset
  // events are laid out on the performance timeline, one copy per pass.
  function finish(song, time, key, pickup, measures, marks) {
    var perf = performance(measures);
    var occ = [];      // [{ m, start }] in performance time
    var T = 0;
    perf.order.forEach(function (mi) {
      occ.push({ m: mi, start: T });
      T += measures[mi].len;
    });

    var notes = [];   // one per sounding note, ties merged
    var open = {};    // hand|pitch → note still sounding through a tie
    occ.forEach(function (o, oi) {
      var m = measures[o.m];
      ['rh', 'lh'].forEach(function (h) {
        (m[h] || []).forEach(function (e) {
          e.hand = h;
          if (e.rest) return;
          var off = e.t - m.start;
          e.pitches.forEach(function (p, pi) {
            var k = h + '|' + canonical(p);
            if (open[k] && Math.abs(open[k].t + open[k].beats - (o.start + off)) < EPS) {
              // Tied over: the earlier note just lasts longer.
              open[k].beats += e.beats;
              e.tiedFrom = true;
              if (!e.tie) delete open[k];
              return;
            }
            var n = {
              note: canonical(p), spelled: p, hand: h === 'rh' ? 'right' : 'left',
              t: o.start + off, off: off, occ: oi, beats: e.beats, m: o.m, finger: e.fingers[pi] || null,
              duration: legacyName(e.dur, e.dots), gameSkip: !!e.gameSkip,
            };
            notes.push(n);
            if (e.tie) open[k] = n; else delete open[k];
          });
        });
      });
    });
    notes.sort(function (a, b) { return a.t - b.t || midiOf(a.note) - midiOf(b.note); });

    // Onset events: every moment at least one note starts.
    var byT = {};
    var events = [];
    notes.forEach(function (n) {
      var k = n.t.toFixed(4);
      var ev = byT[k];
      if (!ev) { ev = byT[k] = { t: n.t, m: n.m, off: n.off, occ: n.occ, rh: [], lh: [] }; events.push(ev); }
      ev[n.hand === 'right' ? 'rh' : 'lh'].push(n);
    });
    events.sort(function (a, b) { return a.t - b.t; });
    events.forEach(function (ev, i) {
      ev.index = i;
      ev.rh.concat(ev.lh).forEach(function (n) { n.ev = i; });
    });

    // Dynamics: a playback loudness per written bar, carried forward
    var DYN = { ppp: 0.45, pp: 0.55, p: 0.7, mp: 0.85, mf: 1, f: 1.15, ff: 1.3, fff: 1.4 };
    // `src` is the mark's place in the song's list (the builder drags marks
    // by it); dx / dy nudge where it's drawn, in staff units.
    var nudge = function (v) { v = +v || 0; return Math.max(-300, Math.min(300, Math.round(v))); };
    var cleanMarks = (Array.isArray(marks) ? marks : []).map(function (mk, i) {
      return mk && mk.bar >= 1 && mk.bar <= measures.length && mk.text
        ? { bar: +mk.bar, kind: mk.kind || 'tip', text: String(mk.text).slice(0, 120), src: i, dx: nudge(mk.dx), dy: nudge(mk.dy) }
        : null;
    }).filter(Boolean);
    var dyn = [], level = 1;
    measures.forEach(function (m, i) {
      cleanMarks.forEach(function (mk) {
        var d = DYN[String(mk.text).trim().toLowerCase()];
        if (mk.kind === 'dynamic' && mk.bar === i + 1 && d) level = d;
      });
      dyn[i] = level;
    });

    var hasRH = measures.some(function (m) { return m.rh && m.rh.some(function (e) { return !e.rest; }); });
    var hasLH = measures.some(function (m) { return m.lh && m.lh.some(function (e) { return !e.rest; }); });
    return {
      songId: song.id,
      time: time,
      key: key,
      pickup: pickup,
      measures: measures,
      order: perf.order,
      volta: perf.volta,
      occ: occ,
      notes: notes,
      events: events,
      marks: cleanMarks,
      dyn: dyn,
      hasRH: hasRH,
      hasLH: hasLH,
      totalBeats: T,
    };
  }

  function legacyName(dur, dots) {
    return (dots ? 'dotted-' : '') + DUR_NAME[dur];
  }

  function compile(song) {
    if (song._compiled) return song._compiled;
    var c = song.score ? compileSpec(song) : compileLegacy(song);
    Object.defineProperty(song, '_compiled', { value: c, enumerable: false, configurable: true });
    return c;
  }

  // Give score songs the flat `notes` list older code reads.
  function attach(songs) {
    songs.forEach(function (s) {
      if (!s.score) return;
      var c = compile(s);
      s.notes = c.notes;
      if (s.rightHandOnly === undefined) s.rightHandOnly = !c.hasLH;
    });
    return songs;
  }

  // ── Practice views ────────────────────────────────────────────
  // hands: 'rh' | 'lh' | 'both'
  function wants(hands, n) {
    if (n.gameSkip) return false;
    if (hands === 'both') return true;
    if (hands === 'rh') return n.hand === 'right';
    if (hands === 'lh') return n.hand === 'left';
    return false;
  }

  // The steps a student plays, in order: each one is the set of keys
  // that start together in the chosen hand(s).
  function steps(c, hands, fromBar, toBar) {
    var span = barSpan(c, fromBar, toBar);
    var out = [];
    c.events.forEach(function (ev) {
      if (ev.t < span.start - EPS || ev.t >= span.end - EPS) return;
      var ns = ev.rh.concat(ev.lh).filter(function (n) { return wants(hands, n); });
      if (!ns.length) return;
      out.push({ ev: ev.index, t: ev.t, m: ev.m, notes: ns, keys: uniq(ns.map(function (n) { return n.note; })) });
    });
    return out;
  }

  function uniq(a) {
    var seen = {};
    return a.filter(function (x) { if (seen[x]) return false; seen[x] = 1; return true; });
  }

  // ── Range helpers ─────────────────────────────────────────────
  // A bar range in performance time: from the first time bar `fromBar`
  // is played to the end of the next time `toBar` is played after it.
  // No range = the whole performance.
  function barSpan(c, fromBar, toBar) {
    if (fromBar == null && toBar == null) return { start: 0, end: c.totalBeats };
    var lo = fromBar == null ? 0 : fromBar, hi = toBar == null ? c.measures.length - 1 : toBar;
    var a = -1, b = -1;
    for (var i = 0; i < c.occ.length; i++) {
      if (a < 0 && c.occ[i].m === lo) a = i;
      if (a >= 0 && c.occ[i].m === hi) { b = i; break; }
    }
    if (a < 0) a = 0;
    if (b < 0) b = c.occ.length - 1;
    var last = c.occ[b];
    return { start: c.occ[a].start, end: last.start + c.measures[last.m].len };
  }

  // ── Player ────────────────────────────────────────────────────
  // Plays a compiled song (or a bar range of it) through AudioEngine.
  // opts: bpm, hands ('rh'|'lh'|'both' — which hands make sound),
  //       fromBar, toBar, countIn (bars), metronome (bool),
  //       onEvent(evIndex), onBeat(beatInBar, isDownbeat), onEnd()
  function play(c, audio, opts) {
    opts = opts || {};
    var bpm = opts.bpm || 80;
    var qMs = 60000 / bpm;
    var span = barSpan(c, opts.fromBar, opts.toBar);
    var hands = opts.hands || 'both';
    var countBeats = (opts.countIn || 0) * c.time.barBeats;
    var timers = [];
    var stopped = false;
    var t0 = countBeats;

    function at(ms, fn) {
      timers.push(setTimeout(function () { if (!stopped) fn(); }, Math.max(0, ms)));
    }

    // Metronome clicks (count-in plus the passage itself)
    if (opts.metronome || countBeats) {
      var clickEnd = opts.metronome ? countBeats + (span.end - span.start) : countBeats;
      var pulse = c.time.pulse;
      for (var b = 0; b < clickEnd - EPS; b += pulse) {
        (function (beat) {
          // Bar position relative to the real barlines, so pickups click right.
          var songBeat = beat - countBeats + span.start;
          var inBar = beat < countBeats ? beat % c.time.barBeats : barOffset(c, songBeat);
          var down = Math.abs(inBar) < EPS;
          at(beat * qMs, function () {
            if (audio && audio.tick) audio.tick(down);
            if (opts.onBeat) opts.onBeat(inBar, down, beat < countBeats);
          });
        })(b);
      }
    }

    c.events.forEach(function (ev) {
      if (ev.t < span.start - EPS || ev.t >= span.end - EPS) return;
      var when = (t0 + ev.t - span.start) * qMs;
      at(when, function () {
        ev.rh.concat(ev.lh).forEach(function (n) {
          if (!wants(hands, n) && !n.gameSkip) return;
          var len = Math.min(n.beats, span.end - n.t) * qMs;
          var vel = Math.min(120, Math.round((n.hand === 'left' ? 62 : 80) * (c.dyn[n.m] || 1)));
          if (audio && audio.playNote) audio.playNote(n.note, len * 0.95, vel);
        });
        if (opts.onEvent) opts.onEvent(ev.index);
      });
    });

    var total = (t0 + span.end - span.start) * qMs;
    at(total + 150, function () { if (opts.onEnd) opts.onEnd(); });

    return {
      startedAt: Date.now(),
      leadMs: t0 * qMs,
      durationMs: total,
      stop: function () { stopped = true; timers.forEach(clearTimeout); timers = []; },
    };
  }

  function barOffset(c, beat) {
    for (var i = c.occ.length - 1; i >= 0; i--) {
      var o = c.occ[i];
      if (beat >= o.start - EPS) {
        // In a pickup bar, count from where the full bar would have begun.
        var off = beat - o.start;
        if (o.m === 0 && c.pickup) off += c.time.barBeats - c.pickup;
        return off;
      }
    }
    return 0;
  }

  // ── Sheet music (VexFlow 3) ───────────────────────────────────
  // Draws a grand staff (or one staff when the song has one hand) into
  // `container`. Returns { evEls: {evIndex: [svg <g>…]}, bars: [{x,y,w,h,row}] }.
  function render(VF, container, c, opts) {
    opts = opts || {};
    container.innerHTML = '';
    // opts.grand: always both staves (reading games, where a rest-only staff still matters)
    var showRH = c.hasRH || !!opts.grand;
    var showLH = c.hasLH || !!opts.grand;
    if (!showRH && !showLH) showRH = true;
    var grand = showRH && showLH;

    // `scale` < 1 shrinks the engraving so more of the song fits on short screens
    var scale = opts.scale || 1;
    var width = Math.max(320, (container.clientWidth || 600) / scale);
    var perRow = opts.perRow || (width >= 1100 ? 4 : width >= 760 ? 3 : 2);
    var rowCount = Math.ceil(c.measures.length / perRow);
    var staffGap = 92;           // top stave → bass stave
    var rowH = grand ? 210 : 130;
    var top = 34;
    var left = 10;
    var usable = width - left - 10;
    var height = rowCount * rowH + top + 10;

    var renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
    renderer.resize(width * scale, height * scale);
    var ctx = renderer.getContext();
    if (scale !== 1) ctx.scale(scale, scale);
    var svg = container.querySelector('svg');

    var keyAlts = keyAlterations(c.key);
    var evEls = {};
    var byPos = {};          // 'bar|offset' → staff note groups (one per staff)
    var texts = [];          // text to lay over the staves once drawn
    var bars = [];
    var tieQueue = [];       // [{from: StaveNote, idx, hand, pitch}]
    var lastByHandPitch = {};

    for (var row = 0; row < rowCount; row++) {
      var y = top + row * rowH;
      var first = row * perRow;
      var inRow = c.measures.slice(first, first + perRow);
      // Opening bars carry clef/key/time, so give them more room.
      var keyN = Math.abs(KEY_COUNT[c.key] || 0);
      var decor = 38 + keyN * 10 + (row === 0 && !opts.noTime ? 26 : 0);
      var barW = (usable - decor) / perRow;
      var x = left;

      inRow.forEach(function (m, mi) {
        var w = barW + (mi === 0 ? decor : 0);
        var staves = {};
        if (showRH) staves.rh = new VF.Stave(x, y, w);
        if (showLH) staves.lh = new VF.Stave(x, y + (grand ? staffGap : 0), w);
        var f = m.flags || {};
        var topStave = staves.rh || staves.lh;
        var vk = c.volta && c.volta[m.index];    // ending number over this bar, if any
        Object.keys(staves).forEach(function (h) {
          var st = staves[h];
          if (mi === 0) {
            st.addClef(h === 'rh' ? 'treble' : 'bass');
            if (keyN) st.addKeySignature(c.key.replace(/m$/, '') === c.key ? c.key : relativeMajor(c.key));
            if (row === 0 && !opts.noTime) st.addTimeSignature(c.time.str);
          }
          if (f.start) st.setBegBarType(VF.Barline.type.REPEAT_BEGIN);
          if (f.end) st.setEndBarType(VF.Barline.type.REPEAT_END);
          else if (m.index === c.measures.length - 1) st.setEndBarType(VF.Barline.type.END);
          // 1st / 2nd ending bracket over the top staff
          var k = vk;
          if (k && st === topStave && VF.Volta) {
            var prevSame = c.volta[m.index - 1] === k && mi > 0;
            var nextSame = c.volta[m.index + 1] === k && mi < inRow.length - 1;
            var type = prevSame ? (nextSame ? VF.Volta.type.MID : VF.Volta.type.END)
                                : (nextSame ? VF.Volta.type.BEGIN : VF.Volta.type.BEGIN_END);
            try { st.setVoltaType(type, prevSame ? '' : k + '.', -8); } catch (e) { /* cosmetic */ }
          }
          st.setContext(ctx).draw();
        });
        // Words over the staff: tempo, Fine / D.C., bar notes, dynamics
        // Placed once all the music is drawn (see placeTexts): `y` is where
        // each starts, and they move off the notes from there.
        var line0 = topStave.getYForLine(0);
        var under = staves.rh ? staves.rh.getYForLine(4) + (grand ? 34 : 22) : null;
        var gap = grand ? { lo: staves.rh.getYForLine(4) + 14, hi: staves.lh.getYForLine(0) - 2 } : null;
        var above = { row: row, rowY: y, place: 'above' };
        var add = function (tx, where) { texts.push(Object.assign(tx, where || above)); };
        if (row === 0 && mi === 0 && c.tempo) add({ x: x + 20, y: line0 - 26, t: c.tempo, size: 12, weight: 'bold' });
        if (f.segno) add({ x: x + 6, y: line0 - 6, t: '𝄋', size: 18 });
        if (f.fine) add({ x: x + w - 4, y: line0 - 6, t: 'Fine', size: 12, style: 'italic', weight: 'bold', anchor: 'end' });
        if (f.dc || f.ds) add({ x: x + w - 4, y: line0 - 6, t: (f.ds ? 'D.S.' : 'D.C.') + ' al Fine', size: 12, style: 'italic', weight: 'bold', anchor: 'end' });
        var noteY = line0 - (vk ? 30 : 18);
        (c.marks || []).filter(function (mk) { return mk.bar === m.index + 1; }).forEach(function (mk) {
          if (mk.kind === 'dynamic') {
            if (under != null) add({ x: x + (mi === 0 ? decor : 8), y: under, t: mk.text, size: 15, style: 'italic', weight: 'bold', family: 'Georgia, serif',
                                     cls: 'lm-bar-mark lm-dyn-mark', mk: mk }, { row: row, rowY: y, place: 'between', gap: gap });
            return;
          }
          var label = mk.text.length > 34 ? mk.text.slice(0, 33) + '…' : mk.text;
          add({ x: x + (mi === 0 ? decor : 6), y: noteY, t: (mk.kind === 'teacher' ? '✎ ' : '') + label, size: 10, weight: 'bold',
                style: mk.kind === 'teacher' ? 'italic' : '', fill: mk.kind === 'teacher' ? '#B45309' : '#0F766E', cls: 'lm-bar-mark', mk: mk });
          noteY -= 12;
        });
        if (grand) {
          if (mi === 0) {
            new VF.StaveConnector(staves.rh, staves.lh).setType(VF.StaveConnector.type.BRACE).setContext(ctx).draw();
            new VF.StaveConnector(staves.rh, staves.lh).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
          }
          new VF.StaveConnector(staves.rh, staves.lh)
            .setType(m.index === c.measures.length - 1 ? VF.StaveConnector.type.BOLD_DOUBLE_RIGHT : VF.StaveConnector.type.SINGLE_RIGHT)
            .setContext(ctx).draw();
        }
        if (opts.barNumbers !== false && mi === 0) {
          ctx.save && ctx.save();
          ctx.setFont('Arial', 9, '');
          ctx.fillText(String(m.index + 1), x + 2, y + 18);
          ctx.restore && ctx.restore();
        }

        var voices = [];
        var tickables = {};
        Object.keys(staves).forEach(function (h) {
          var evs = m[h];
          var clef = h === 'rh' ? 'treble' : 'bass';
          var accState = {};
          var list = [];
          if (!evs || !evs.length) {
            // A hand that sits out the bar gets a whole-bar rest.
            var r = new VF.StaveNote({ clef: clef, keys: [clef === 'treble' ? 'b/4' : 'd/3'], duration: 'wr', align_center: true });
            list.push(r);
          } else {
            evs.forEach(function (e) {
              list.push(makeNote(VF, e, clef, keyAlts, accState, opts, m.len, c.time));
            });
          }
          tickables[h] = list;
          var v = new VF.Voice({ num_beats: Math.round(m.len * 4) || 16, beat_value: 16 });
          v.setMode(VF.Voice.Mode.SOFT);
          v.addTickables(list);
          voices.push({ h: h, v: v, stave: staves[h], evs: evs });
        });

        var fmt = new VF.Formatter();
        voices.forEach(function (vv) { fmt.joinVoices([vv.v]); });
        var startX = Math.max.apply(null, voices.map(function (vv) { return vv.stave.getNoteStartX(); }));
        voices.forEach(function (vv) { vv.stave.setNoteStartX(startX); });
        var endX = Math.min.apply(null, voices.map(function (vv) { return vv.stave.getNoteEndX(); }));
        fmt.format(voices.map(function (vv) { return vv.v; }), Math.max(40, endX - startX - 12));

        voices.forEach(function (vv) {
          // Beam each run of notes between rests, so a beam never reaches over a rest.
          // Eighth-note meters (3/8, 6/8, 9/8) beam in threes; the rest by the quarter.
          var beams = [];
          var groups = c.time.den === 8 ? [new VF.Fraction(3, 8)] : [new VF.Fraction(2, 8)];
          var run = [];
          var flush = function () {
            if (run.length > 1) {
              try { beams = beams.concat(VF.Beam.generateBeams(run, { groups: groups })); } catch (e) { /* unbeamed is fine */ }
            }
            run = [];
          };
          tickables[vv.h].forEach(function (n) { if (n.isRest()) flush(); else run.push(n); });
          flush();
          vv.v.draw(ctx, vv.stave);
          beams.forEach(function (b) { b.setContext(ctx).draw(); });

          (vv.evs || []).forEach(function (e, i) {
            var sn = tickables[vv.h][i];
            if (!sn || e.rest) return;
            var el = sn.attrs && sn.attrs.el;
            // Indexed by place in the bar; every pass through the bar lights the same notes
            if (el) {
              var pos = m.index + '|' + (e.t - m.start).toFixed(4);
              (byPos[pos] = byPos[pos] || []).push(el);
            }
            // Ties
            e.pitches.forEach(function (p, pi) {
              var k = vv.h + '|' + canonical(p);
              if (lastByHandPitch[k] && lastByHandPitch[k].tie) {
                var lp = lastByHandPitch[k];
                tieQueue.push({ from: lp.sn, fromIdx: lp.pi, to: sn, toIdx: pi, split: lp.row !== row });
              }
              lastByHandPitch[k] = { sn: sn, pi: pi, tie: e.tie, row: row };
            });
          });
        });

        bars.push({
          index: m.index, row: row, x: x, w: w,
          y: y, h: grand ? staffGap + 80 : 80,
        });
        x += w;
      });
    }

    c.events.forEach(function (ev) {
      var els = byPos[ev.m + '|' + ev.off.toFixed(4)];
      if (els) evEls[ev.index] = els;
    });

    // Text goes on last, over the music
    var markEls = [];
    if (svg && svg.ownerDocument) placeTexts(svg, texts, top, markEls);

    tieQueue.forEach(function (tq) {
      try {
        // Across a line break: half a tie off the end of one line, half onto the next
        var ties = tq.split
          ? [{ first_note: tq.from, last_note: null, first_indices: [tq.fromIdx], last_indices: [tq.fromIdx] },
             { first_note: null, last_note: tq.to, first_indices: [tq.toIdx], last_indices: [tq.toIdx] }]
          : [{ first_note: tq.from, last_note: tq.to, first_indices: [tq.fromIdx], last_indices: [tq.toIdx] }];
        ties.forEach(function (t) { new VF.StaveTie(t).setContext(ctx).draw(); });
      } catch (e) { /* a tie VexFlow can't place is only cosmetic */ }
    });

    return { svg: svg, evEls: evEls, bars: bars, perRow: perRow, rowH: rowH, top: top, marks: markEls };
  }

  // Words over the music. Each starts where it belongs and steps off any
  // note, stem, finger number, bracket or earlier word in its way: up when
  // it sits over the staff, up or down when it sits between the staves.
  // A mark's own dx / dy is added last, so a hand-placed one stays put.
  // Off-screen (no layout, getBBox gives nothing) they keep their start.
  function placeTexts(svg, texts, top, markEls) {
    if (!texts.length) return markEls;
    var NS = 'http://www.w3.org/2000/svg';
    var boxOf = function (el) {
      try { var b = el.getBBox(); return b && (b.width || b.height) ? { x: b.x, y: b.y, w: b.width, h: b.height } : null; } catch (e) { return null; }
    };
    // What's already drawn, staff lines aside (long and thin)
    var ink = [];
    Array.prototype.forEach.call(svg.querySelectorAll('path, rect, text'), function (el) {
      var b = boxOf(el);
      if (b && !(b.h < 2.5 && b.w > 40)) ink.push(b);
    });
    var measured = ink.length > 0;
    var PAD = 3;
    var hits = function (r) {
      for (var i = 0; i < ink.length; i++) {
        var b = ink[i];
        if (r.x < b.x + b.w + PAD && r.x + r.w + PAD > b.x && r.y < b.y + b.h + PAD && r.y + r.h + PAD > b.y) return true;
      }
      return false;
    };
    var minY = Infinity;
    texts.forEach(function (tx) {
      var el = svg.ownerDocument.createElementNS(NS, 'text');
      el.setAttribute('x', tx.x); el.setAttribute('y', tx.y);
      el.setAttribute('font-family', tx.family || 'Arial, sans-serif');
      el.setAttribute('font-size', tx.size || 10);
      if (tx.weight) el.setAttribute('font-weight', tx.weight);
      if (tx.style) el.setAttribute('font-style', tx.style);
      if (tx.anchor) el.setAttribute('text-anchor', tx.anchor);
      el.setAttribute('fill', tx.fill || '#3D3555');
      if (tx.cls) el.setAttribute('class', tx.cls);
      el.textContent = tx.t;
      svg.appendChild(el);

      var y = tx.y;
      var b = measured && boxOf(el);
      if (b) {
        // Box relative to the baseline, so it can be tried at other heights
        var rel = { x: b.x, w: b.w, up: tx.y - b.y, down: b.y + b.h - tx.y };
        var at = function (yy) { return { x: rel.x, w: rel.w, y: yy - rel.up, h: rel.up + rel.down }; };
        var tries = [];
        if (tx.place === 'between' && tx.gap) {
          for (var d = 0; d <= 40; d += 3) { tries.push(tx.y + d); if (d) tries.push(tx.y - d); }
          tries = tries.filter(function (yy) { return yy - rel.up >= tx.gap.lo - 12 && yy + rel.down <= tx.gap.hi; });
        } else if (tx.place === 'between') {
          // One staff: dynamics sit under it, so only move down
          for (var dd = 0; dd <= 30; dd += 3) tries.push(tx.y + dd);
        } else {
          // Up to just under the row above; over the first row the page
          // grows upward instead (see below)
          var ceiling = tx.row === 0 ? -120 : tx.rowY - 26;
          for (var yy = tx.y; yy - rel.up >= ceiling; yy -= 3) tries.push(yy);
          if (!tries.length) tries.push(tx.y);
        }
        var free = tries.filter(function (yy) { return !hits(at(yy)); })[0];
        y = free != null ? free : (tx.place === 'between' ? tx.y : tries[tries.length - 1]);
      }
      var mk = tx.mk;
      if (mk && (mk.dx || mk.dy)) {
        el.setAttribute('x', tx.x + mk.dx);
        y += mk.dy;
      }
      el.setAttribute('y', y);
      if (b) {
        var nb = boxOf(el);
        if (nb) ink.push(nb);
      }
      if (mk) {
        el.setAttribute('data-mk', mk.src);
        markEls.push({ src: mk.src, el: el });
      }
      if (b) minY = Math.min(minY, y - rel.up);
    });
    // Words pushed above the first row: grow the drawing upward. Moving the
    // viewBox keeps every coordinate (bars, notes) where callers expect it.
    if (minY < 2) grow(svg, Math.ceil(4 - minY));
    return markEls;
  }

  function grow(svg, extra) {
    var w = parseFloat(svg.getAttribute('width')) || 0, h = parseFloat(svg.getAttribute('height')) || 0;
    var vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(parseFloat);
    if (vb.length !== 4 || vb.some(isNaN)) vb = [0, 0, w, h];
    var k = vb[3] ? h / vb[3] : 1;               // pixels per unit (the render scale)
    svg.setAttribute('viewBox', [vb[0], vb[1] - extra, vb[2], vb[3] + extra].join(' '));
    svg.setAttribute('height', h + extra * k);
    if (svg.style && svg.style.height) svg.style.height = (h + extra * k) + 'px';
  }

  function relativeMajor(minor) {
    var map = { Am: 'C', Em: 'G', Bm: 'D', 'F#m': 'A', 'C#m': 'E', 'G#m': 'B', Dm: 'F', Gm: 'Bb', Cm: 'Eb', Fm: 'Ab', Bbm: 'Db', Ebm: 'Gb' };
    return map[minor] || 'C';
  }

  function makeNote(VF, e, clef, keyAlts, accState, opts, barLen, time) {
    var vfDur = e.dur === 'e' ? '8' : e.dur === 's' ? '16' : e.dur;
    if (e.rest) {
      var full = Math.abs(e.beats - barLen) < EPS && barLen >= time.barBeats - EPS;
      var rn = new VF.StaveNote({
        clef: clef, keys: [clef === 'treble' ? 'b/4' : 'd/3'],
        duration: (full ? 'w' : vfDur) + 'r', align_center: full,
      });
      if (e.dots && !full) addDots(VF, rn);
      return rn;
    }
    var sorted = e.pitches.map(function (p, i) { return { p: p, f: e.fingers[i] }; })
      .sort(function (a, b) { return midiOf(a.p) - midiOf(b.p); });
    var keys = sorted.map(function (x) {
      var q = parsePitch(x.p);
      return x.p[0].toLowerCase() + (q.alt === 1 ? '#' : q.alt === -1 ? 'b' : '') + '/' + q.oct;
    });
    var sn = new VF.StaveNote({ clef: clef, keys: keys, duration: vfDur, auto_stem: true });
    sorted.forEach(function (x, i) {
      var q = parsePitch(x.p);
      var slot = q.letter + q.oct;
      var cur = accState[slot] !== undefined ? accState[slot] : keyAlts[q.letter];
      if (q.alt !== cur && !e.tiedFrom) {
        sn.addAccidental(i, new VF.Accidental(q.alt === 1 ? '#' : q.alt === -1 ? 'b' : 'n'));
      }
      accState[slot] = q.alt;
    });
    if (e.dots) addDots(VF, sn);
    if (opts.fingers) {
      var fs = sorted.map(function (x) { return x.f; }).filter(Boolean);
      if (fs.length) {
        var fa = new VF.Annotation(fs.join('·'));
        fa.setFont('Arial', 10, 'bold');
        fa.setVerticalJustification(clef === 'treble' ? VF.Annotation.VerticalJustify.TOP : VF.Annotation.VerticalJustify.BOTTOM);
        sn.addModifier(0, fa);
      }
    }
    if (opts.names) {
      var names = sorted.map(function (x) { return x.p.replace(/\d/, '').replace('#', '♯').replace('b', '♭'); });
      var na = new VF.Annotation(names.join(' '));
      na.setFont('Arial', 9, 'bold');
      // Names sit under each staff, so the hands never share a line of letters
      na.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
      sn.addModifier(0, na);
    }
    return sn;
  }

  function addDots(VF, sn) {
    if (typeof sn.addDotToAll === 'function') sn.addDotToAll();
    else if (VF.Dot && VF.Dot.buildAndAttach) VF.Dot.buildAndAttach([sn], { all: true });
  }

  var api = {
    compile: compile,
    attach: attach,
    steps: steps,
    play: play,
    render: render,
    barSpan: barSpan,
    canonical: canonical,
    midiOf: midiOf,
    parseTime: parseTime,
    keyAlterations: keyAlterations,
    DUR_BEATS: DUR_BEATS,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LMScore = api;
})(typeof window !== 'undefined' ? window : this);
