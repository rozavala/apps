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

  function parseVoice(src, hand, songLabel) {
    var bars = String(src || '').split('|').map(function (b) { return b.trim(); });
    if (bars.length && bars[bars.length - 1] === '') bars.pop();
    return bars.map(function (bar, bi) {
      if (!bar) return [];
      return bar.split(/\s+/).map(function (tok) {
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
    });
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
      var m = { index: i, start: start, len: expect, rh: rhBars[i] || null, lh: lhBars[i] || null };
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
    return finish(song, time, spec.key || 'C', pickup, measures);
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
      var m = { index: i, start: start, len: time.barBeats, rh: rhBars[i] || null, lh: lhAligned ? (lhBars[i] || []) : null };
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

  // ── Shared tail: sounding notes, onset events, ranges ─────────
  function finish(song, time, key, pickup, measures) {
    var notes = [];   // one per sounding note, ties merged
    var open = {};    // hand|pitch → note still sounding through a tie
    measures.forEach(function (m) {
      ['rh', 'lh'].forEach(function (h) {
        (m[h] || []).forEach(function (e) {
          e.hand = h;
          if (e.rest) return;
          e.pitches.forEach(function (p, pi) {
            var k = h + '|' + canonical(p);
            if (open[k]) {
              // Tied over: the earlier note just lasts longer.
              open[k].beats += e.beats;
              e.tiedFrom = true;
              if (!e.tie) delete open[k];
              return;
            }
            var n = {
              note: canonical(p), spelled: p, hand: h === 'rh' ? 'right' : 'left',
              t: e.t, beats: e.beats, m: e.m, finger: e.fingers[pi] || null,
              duration: legacyName(e.dur, e.dots), gameSkip: !!e.gameSkip,
            };
            notes.push(n);
            if (e.tie) open[k] = n;
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
      if (!ev) { ev = byT[k] = { t: n.t, m: n.m, rh: [], lh: [] }; events.push(ev); }
      ev[n.hand === 'right' ? 'rh' : 'lh'].push(n);
    });
    events.sort(function (a, b) { return a.t - b.t; });
    events.forEach(function (ev, i) {
      ev.index = i;
      ev.rh.concat(ev.lh).forEach(function (n) { n.ev = i; });
    });

    var hasRH = measures.some(function (m) { return m.rh && m.rh.some(function (e) { return !e.rest; }); });
    var hasLH = measures.some(function (m) { return m.lh && m.lh.some(function (e) { return !e.rest; }); });
    var last = measures[measures.length - 1];
    return {
      songId: song.id,
      time: time,
      key: key,
      pickup: pickup,
      measures: measures,
      notes: notes,
      events: events,
      hasRH: hasRH,
      hasLH: hasLH,
      totalBeats: last ? last.start + last.len : 0,
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
    var lo = fromBar == null ? 0 : fromBar;
    var hi = toBar == null ? c.measures.length - 1 : toBar;
    var out = [];
    c.events.forEach(function (ev) {
      if (ev.m < lo || ev.m > hi) return;
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
  function barSpan(c, fromBar, toBar) {
    var lo = c.measures[fromBar == null ? 0 : fromBar];
    var hi = c.measures[toBar == null ? c.measures.length - 1 : toBar];
    return { start: lo.start, end: hi.start + hi.len };
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
          if (audio && audio.playNote) audio.playNote(n.note, len * 0.95, n.hand === 'left' ? 62 : 80);
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
    for (var i = c.measures.length - 1; i >= 0; i--) {
      var m = c.measures[i];
      if (beat >= m.start - EPS) {
        // In a pickup bar, count from where the full bar would have begun.
        var off = beat - m.start;
        if (i === 0 && c.pickup) off += c.time.barBeats - c.pickup;
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
    var showRH = c.hasRH;
    var showLH = c.hasLH;
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
    var bars = [];
    var tieQueue = [];       // [{from: StaveNote, idx, hand, pitch}]
    var lastByHandPitch = {};

    for (var row = 0; row < rowCount; row++) {
      var y = top + row * rowH;
      var first = row * perRow;
      var inRow = c.measures.slice(first, first + perRow);
      // Opening bars carry clef/key/time, so give them more room.
      var keyN = Math.abs(KEY_COUNT[c.key] || 0);
      var decor = 38 + keyN * 10 + (row === 0 ? 26 : 0);
      var barW = (usable - decor) / perRow;
      var x = left;

      inRow.forEach(function (m, mi) {
        var w = barW + (mi === 0 ? decor : 0);
        var staves = {};
        if (showRH) staves.rh = new VF.Stave(x, y, w);
        if (showLH) staves.lh = new VF.Stave(x, y + (grand ? staffGap : 0), w);
        Object.keys(staves).forEach(function (h) {
          var st = staves[h];
          if (mi === 0) {
            st.addClef(h === 'rh' ? 'treble' : 'bass');
            if (keyN) st.addKeySignature(c.key.replace(/m$/, '') === c.key ? c.key : relativeMajor(c.key));
            if (row === 0) st.addTimeSignature(c.time.str);
          }
          if (m.index === c.measures.length - 1) st.setEndBarType(VF.Barline.type.END);
          st.setContext(ctx).draw();
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
          var beams = [];
          try {
            beams = VF.Beam.generateBeams(tickables[vv.h].filter(function (n) { return !n.isRest(); }), {
              groups: c.time.compound ? [new VF.Fraction(3, 8)] : [new VF.Fraction(2, 8)],
            });
          } catch (e) { beams = []; }
          vv.v.draw(ctx, vv.stave);
          beams.forEach(function (b) { b.setContext(ctx).draw(); });

          (vv.evs || []).forEach(function (e, i) {
            var sn = tickables[vv.h][i];
            if (!sn || e.rest) return;
            var el = sn.attrs && sn.attrs.el;
            // Highlight against the onset this note belongs to (ties point back to the original).
            var evIdx = noteEventIndex(c, e);
            if (el && evIdx != null) {
              el.setAttribute('data-ev', evIdx);
              (evEls[evIdx] = evEls[evIdx] || []).push(el);
            }
            // Ties
            e.pitches.forEach(function (p, pi) {
              var k = vv.h + '|' + canonical(p);
              if (lastByHandPitch[k] && lastByHandPitch[k].tie) {
                tieQueue.push({ from: lastByHandPitch[k].sn, fromIdx: lastByHandPitch[k].pi, to: sn, toIdx: pi });
              }
              lastByHandPitch[k] = { sn: sn, pi: pi, tie: e.tie };
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

    tieQueue.forEach(function (tq) {
      try {
        new VF.StaveTie({ first_note: tq.from, last_note: tq.to, first_indices: [tq.fromIdx], last_indices: [tq.toIdx] })
          .setContext(ctx).draw();
      } catch (e) { /* a tie VexFlow can't place is only cosmetic */ }
    });

    return { svg: svg, evEls: evEls, bars: bars, perRow: perRow, rowH: rowH, top: top };
  }

  function relativeMajor(minor) {
    var map = { Am: 'C', Em: 'G', Bm: 'D', 'F#m': 'A', 'C#m': 'E', 'G#m': 'B', Dm: 'F', Gm: 'Bb', Cm: 'Eb', Fm: 'Ab', Bbm: 'Db', Ebm: 'Gb' };
    return map[minor] || 'C';
  }

  function noteEventIndex(c, e) {
    if (e.rest || !e.pitches.length) return null;
    // Find the onset event for this staff event's time.
    for (var i = 0; i < c.events.length; i++) {
      if (Math.abs(c.events[i].t - e.t) < EPS) return i;
    }
    // A tied-over note has no onset of its own; it lights with its start.
    var best = null;
    for (var j = 0; j < c.events.length; j++) if (c.events[j].t < e.t) best = j;
    return best;
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
