/* ================================================================
   ZS SPEAK — speak.js
   Read-aloud for the whole suite, so a kid who cannot read yet can
   still use an app. Built on ZsTTS (tts.js): the device's own voices,
   no network.

   What a kid gets (per kid, set in Parents Corner: Off / On / Auto):
     On    a 🔊 button next to each question or instruction, and
           pressing and holding an answer choice says it.
     Auto  "little-kid mode" (the default for age 5 and under): also
           reads a question out when it appears, the first tap on an
           answer says it and the second tap answers, and buttons and
           text are bigger.
     Off   nothing.

   How an app is covered: its question and answer elements are listed
   in RULES below, by page. The app's own code is not touched.
     group   the element holding the answer choices
     choice  one answer choice
     prompt  the question or instruction (when omitted: the element
             just before the group)
     lang    'es' | 'en' (when omitted: guessed from the text)
     auto    false: a 🔊 only, never read by itself in little-kid mode
     extra   text hidden in little-kid mode (less to look at for a
             kid who cannot read it anyway); class="zs-extra" does the same
   Any element with data-speak gets a 🔊 as well (its value, if any,
   is what is said instead of its text). data-speak-auto: also read it
   by itself in little-kid mode. data-speak-lang="es"|"en" when the
   words don't make the language obvious.

   Bilingual text: "Español · English" (what zsT() shows a kid who has
   both languages) is said twice, Spanish in a Spanish voice, then
   English in an English one.

   API:
     ZsSpeak.say(text, lang)     speak now (false when read-aloud is off)
     ZsSpeak.button(text, lang)  HTML for a 🔊 button that says text
     ZsSpeak.watch(rule | [rules])
     ZsSpeak.stop()
     ZsSpeak.refresh()           look at the page again after a redraw
   ================================================================ */

var ZsSpeak = (function() {
  'use strict';

  var RULES = {
    'repaso':           [{ group: '.rp-choices', choice: '.rp-choice', prompt: '.rp-prompt' }],
    'bible-explorer':   [{ group: '.bx-quiz-options, .bx-drill-options', choice: '.bx-quiz-opt, .bx-drill-opt', prompt: '.bx-quiz-q' }],
    'civics-lab':       [{ group: '.cv-quiz-options', choice: '.cv-quiz-opt', prompt: '.cv-quiz-q' }],
    'world-atlas':      [{ group: '.wa-options', choice: '.wa-option', prompt: '.wa-q-text' }],
    'world-explorer':   [{ group: '.quiz-options', choice: '.quiz-opt', prompt: '.quiz-q' }],
    'money-master':     [{ group: '.mm-options', choice: '.mm-option', prompt: '#mm-prompt-text' }],
    'invest-quest':     [{ group: '.iq-quiz-opts', choice: '.iq-quiz-opt', prompt: '.iq-quiz-q' }, { prompt: '.iq-math-prompt' }],
    'lab-explorer':     [{ group: '.lx-ch-choices', choice: '.lx-choice', prompt: '.lx-ch-q' }],
    'marinero':         [{ group: '.mar-opts', choice: '.mar-opt' }],
    'mi-negocio':       [{ group: '.mn-opts', choice: '.mn-opt', prompt: '.mn-quiz-q' }],
    'vocabulario-vivo': [{ group: '.vv-match-options', choice: '.vv-match-opt' }],
    'descubre-chile':   [{ group: '.quiz-opts', choice: '.quiz-opt-btn', prompt: '.quiz-q-text', lang: 'es' }],
    'fe-explorador':    [{ group: '.fe-quiz-opts', choice: '.fe-opt', prompt: '.fe-quiz-q', lang: 'es' }],
    'guitar-jam':       [{ prompt: '#ear-prompt' }],
    'math-galaxy':      [{ prompt: '.sprint-q-text' }],
    'world-cup':        [{ group: '.wc-quiz-opts', choice: '.wc-quiz-opt', prompt: '.wc-quiz-q' }],
    'cocina-lab':       [{ group: '.ck-choices', choice: '.ck-choice', prompt: '.ck-q' }, { prompt: '.ck-lab-prompt' },
                         { prompt: '.ck-why, .ck-cook-tip, .ck-sub', auto: false }, { choice: '.ck-card, .ck-task' }],

    // Apps with no quiz list: their instructions, and long-press (or, in
    // little-kid mode, a first tap) on the cards that open things.
    'art-studio':       [{ prompt: '.lp-text, .mxc-q' }, { prompt: '.lp-howto, .mx-hint, .mxc-msg, .kit-tip', auto: false },
                         { choice: '.ll-card', extra: '.ll-desc' }],
    'banco':            [{ prompt: '.bk-empty' }, { prompt: '.bk-small, .bk-note, .bk-story li', auto: false }],
    'chess-quest':      [{ prompt: '#lessonInfo p, #puzzleGoal' }, { prompt: '#lessonInfo .tip, .coach', auto: false },
                         { choice: '.mode-card, .level-card, .piece-card', extra: '.m-desc' }],
    'circuit-lab':      [{ prompt: '.cl-goal-text, .cl-fact p' }, { prompt: '.cl-hint-line, .cl-status, .cl-sub', auto: false },
                         { choice: '.cl-mode, .cl-level', extra: '.cl-mode-d' }],
    'code-cadet':       [{ prompt: '#cc-goal, #cc-win-msg' }, { prompt: '.cc-sub, .cc-fact, #cc-feedback', auto: false }],
    'dictado':          [{ prompt: '.dk-note, .dk-hint, .dk-fb-msg', auto: false }],
    'euclid-workshop':  [{ prompt: '.ew-goal' }, { prompt: '.ew-sub', auto: false }, { choice: '.ew-level' }],
    'guess-quest':      [{ prompt: '#gq-sub, #gq-guess-sub, .clue-empty' }, { choice: '.q-btn' }],
    'lector':           [{ prompt: '.lx-hint, .lx-lead', auto: false }],
    'little-engineer':  [{ prompt: '#le-tip > span' }, { prompt: '.le-lead, .le-sub', auto: false },
                         { choice: '.le-home-card', extra: '.le-home-desc' }],
    'mensajes-secretos':[{ prompt: '.ms-dos-brief' }, { prompt: '.ms-tip, .ms-hint, .ms-result', auto: false },
                         { choice: '.ms-mission, .ms-tool-card', extra: '.ms-tool-desc' }],
    'move-quest':       [{ choice: '.mode-card', extra: '.m-desc' }],
    'naturaleza':       [{ prompt: '.nat-hero-sub', auto: false }, { choice: '.nat-mcard, .nat-mode' }],
    'que-hora-es':      [{ prompt: '.qhe-tip, .qhe-sub', auto: false }, { choice: '.qhe-mode', extra: '.qhe-mode-desc' }],
    'quest-adventure':  [{ prompt: '.qa-sub' }, { prompt: '.qa-next-sub, .qa-sheet-desc, .quest-tour-desc', auto: false }, { choice: '.qa-q' }],
    'sports-arena':     [{ prompt: '#weekly-streak', auto: false }, { choice: '.mode-card', extra: '.m-desc' }],
    'story-explorer':   [{ prompt: '#se-sub, .se-choice-note', auto: false }, { choice: '.story-card' }],
    'trophy-room':      [{ prompt: '#tr-subtitle' }, { prompt: '.tr-next-desc', auto: false }, { choice: '.tr-badge' }]
  };

  var LONG_PRESS_MS = 600;
  var ARM_MS = 8000;

  var _cfgs = [];
  var _suppressClick = false;
  var _pressTimer = null;
  var _pressAt = null;
  var _autoTimer = null;
  var _pending = null;          // a question waiting for the first tap (iPad)
  var _spokenText = '';
  var _started = false;

  // ── Settings ──
  function _settings() {
    return typeof ZsTTS !== 'undefined' && ZsTTS.supported() ? ZsTTS.getSettings() : null;
  }
  function enabled() { var s = _settings(); return !!s && s.mode !== 'off'; }
  function little() { var s = _settings(); return !!s && s.mode === 'auto'; }

  // ── Text ──
  function _clean(text, lang) {
    var t = String(text == null ? '' : text);
    try { t = t.replace(/\p{Extended_Pictographic}|[️‍]/gu, ' '); }
    catch (e) { t = t.replace(/[←-⯿\uD83C-\uD83E][\uDC00-\uDFFF]?|️/g, ' '); }
    var es = String(lang || '').slice(0, 2) === 'es';
    t = t.replace(/[★☆✓✗]/g, ' ');
    t = t.replace(/×/g, es ? ' por ' : ' times ')
         .replace(/÷/g, es ? ' dividido por ' : ' divided by ')
         .replace(/−/g, es ? ' menos ' : ' minus ')
         .replace(/(\d)\s*\+\s*(?=\d)/g, es ? '$1 más ' : '$1 plus ')
         .replace(/\s*=\s*\?/g, es ? ' es igual a cuánto' : ' equals what')
         .replace(/\s*=\s*/g, es ? ' es igual a ' : ' equals ');
    return t.replace(/\s+/g, ' ').trim();
  }

  // What a choice says: its own words, unless it says what to say.
  function _choiceText(c) {
    return c.getAttribute('data-say-text') || _textOf(c);
  }

  function _textOf(el) {
    if (!el) return '';
    var copy = el.cloneNode(true);
    Array.prototype.forEach.call(copy.querySelectorAll('.zs-say'), function(b) { b.remove(); });
    // Parts of a card ("Challenges" + "16 puzzles") are separate words.
    Array.prototype.forEach.call(copy.querySelectorAll('*'), function(c) {
      if (!/^(B|I|EM|STRONG|U|SUP|SUB|MARK|ABBR|CODE|SMALL)$/.test(c.tagName)) c.after(' ');
    });
    return (copy.textContent || '').replace(/\s+/g, ' ').trim();
  }

  var ES_WORDS = /\b(el|la|los|las|de|del|que|qué|cuál|cuánto|es|son|un|una|por|con|para|en|y|se|tu|tus|al|lo|su|toca|haz|elige|arrastra|cuando|como|cómo|más|muy|hay)\b/g;
  var EN_WORDS = /\b(the|and|to|of|is|are|an|you|your|what|which|how|it|on|in|with|for|this|that|tap|drag|pick|choose|find|make|can|when|each|all|its|from|will|then|has|have|there)\b/g;

  // A firm guess from the words alone, or null.
  function _guess(text) {
    var t = String(text).toLowerCase();
    if (/[¿¡ñáéíóú]/.test(t)) return 'es';
    var es = (t.match(ES_WORDS) || []).length, en = (t.match(EN_WORDS) || []).length;
    if (es >= 2 && es > en) return 'es';
    if (en >= 2 && en > es) return 'en';
    return null;
  }

  // "Español · English" → two parts, each in its language. Anything else
  // → one part.
  function _parts(text, hint) {
    var bits = String(text).split(/\s+·\s+/);
    if (bits.length === 2 && bits[0] && bits[1]) {
      var a = _guess(bits[0]), b = _guess(bits[1]);
      var both = typeof getKidLang === 'function' && getKidLang() === 'both';
      if (!a && !b && both) { a = 'es'; b = 'en'; }
      else if (!a && b) a = b === 'es' ? 'en' : 'es';
      else if (a && !b) b = a === 'es' ? 'en' : 'es';
      if (a && b && a !== b) return [{ text: bits[0], lang: a }, { text: bits[1], lang: b }];
    }
    return [{ text: text, lang: _langOf(text, hint) }];
  }

  // Spanish or English? The rule says; failing that the words do; failing
  // that the page.
  function _langOf(text, hint) {
    if (hint === 'es' || hint === 'en') return hint;
    if (/[¿¡ñáéíóúü]/i.test(text)) return 'es';
    var hits = (String(text).toLowerCase().match(/\b(el|la|los|las|de|del|que|qué|cuál|cuáles|cuánto|cuántos|es|son|un|una|por|con|para|en|y|se)\b/g) || []).length;
    if (hits >= 3) return 'es';
    var page = String(document.documentElement.lang || '').slice(0, 2);
    return page === 'es' && hits >= 1 ? 'es' : 'en';
  }
  function _voiceLang(lang) { return lang === 'es' ? 'es-CL' : 'en-US'; }

  // ── Speaking ──
  function say(text, lang) {
    if (!enabled()) return false;
    var parts = _parts(text, lang).map(function(p) {
      return { text: _clean(p.text, p.lang), lang: p.lang };
    }).filter(function(p) { return p.text; });
    if (!parts.length) return false;
    _spokenText = parts.map(function(p) { return p.text; }).join(' · ');
    var ok = false;
    parts.forEach(function(p, i) {
      if (ZsTTS.speak(p.text, { lang: _voiceLang(p.lang), queue: i > 0 })) ok = true;
    });
    return ok;
  }

  // What an element says: its data-speak value, or its words.
  function _sayEl(el, lang) {
    if (!el) return false;
    var b = el.querySelector && el.querySelector(':scope > .zs-say');
    var l = lang || el.getAttribute('data-speak-lang') || (b && b.__zsLang);
    return say(el.getAttribute('data-speak') || _textOf(el), l);
  }

  function stop() {
    clearTimeout(_autoTimer);
    _pending = null;
    if (typeof ZsTTS !== 'undefined') ZsTTS.stop();
  }

  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _label() {
    return typeof zsT === 'function' ? zsT('Leer en voz alta', 'Read aloud') : 'Read aloud';
  }

  function button(text, lang) {
    if (!enabled()) return '';
    return '<button type="button" class="zs-say" data-say="' + _esc(text) + '"' +
      (lang ? ' data-say-lang="' + _esc(lang) + '"' : '') + ' aria-label="' + _esc(_label()) + '">🔊</button>';
  }

  // ── Finding the pieces on the page ──
  function _all(sel) {
    try { return sel ? Array.prototype.slice.call(document.querySelectorAll(sel)) : []; }
    catch (e) { return []; }
  }

  function _visible(el) {
    return !!(el && el.isConnected && (el.offsetParent !== null || el.getClientRects().length));
  }

  // The element just before the choices that has some words in it.
  function _promptBefore(group) {
    var el = group.previousElementSibling;
    for (var i = 0; el && i < 3; i++, el = el.previousElementSibling) {
      if (_textOf(el).length > 1) return el;
    }
    return null;
  }

  // Put a 🔊 in el. True when this is a new question: the element is new,
  // or an app that sets its text wiped the button and wrote another one.
  function _decorate(el, cfg) {
    // A rule never puts a 🔊 inside another button or link (data-speak
    // on a card title is the app asking for one, so that one is kept).
    if (cfg && el.closest('button, a[href], [role="button"], label')) return false;
    var old = null;
    Array.prototype.forEach.call(el.children, function(c) { if (c.classList.contains('zs-say')) old = c; });
    var text = el.getAttribute('data-speak') || _textOf(el);
    // Nothing to say (yet): no 🔊.
    if (!text) { if (old) old.remove(); el.__zsText = ''; return false; }
    if (!old) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zs-say';
      b.textContent = '🔊';
      b.setAttribute('aria-label', _label());
      b.__zsTarget = el;
      b.__zsLang = cfg && cfg.lang;
      el.appendChild(b);
    }
    var changed = el.__zsText !== text;
    el.__zsText = text;
    return !old || changed;
  }

  function scan() {
    if (!enabled()) return;
    var fresh = [];

    _cfgs.forEach(function(cfg) {
      var prompts = [];
      if (cfg.prompt) prompts = _all(cfg.prompt);
      else _all(cfg.group).forEach(function(g) { var p = _promptBefore(g); if (p) prompts.push(p); });
      prompts.forEach(function(p) { if (_decorate(p, cfg) && cfg.auto !== false) fresh.push(p); });

      _all(cfg.choice).forEach(function(c) {
        c.setAttribute('data-zs-choice', '1');
        if (cfg.lang) c.setAttribute('data-zs-lang', cfg.lang);
      });
    });

    _all('[data-speak]').forEach(function(el) {
      if (_decorate(el, null) && el.hasAttribute('data-speak-auto')) fresh.push(el);
    });

    // Less text for little kids.
    if (little()) _cfgs.forEach(function(cfg) {
      _all(cfg.extra).forEach(function(el) { el.setAttribute('data-zs-extra', '1'); });
    });

    if (little() && fresh.length) _autoRead(fresh[fresh.length - 1]);
  }

  // Little-kid mode: say a new question when it shows up. On iPad a page
  // may not speak until it has been touched once; wait for that touch.
  function _autoRead(el) {
    clearTimeout(_autoTimer);
    _autoTimer = setTimeout(function() {
      if (!_visible(el) || document.hidden) return;
      var ua = navigator.userActivation;
      if (ua && !ua.hasBeenActive) { _pending = el; return; }
      _sayEl(el);
    }, 450);
  }

  // ── Touch handling (one set of listeners for the whole page) ──
  function _closest(target, sel) {
    return target && target.closest ? target.closest(sel) : null;
  }

  function _disarmAll(except) {
    _all('[data-zs-armed]').forEach(function(c) {
      if (c !== except) { c.removeAttribute('data-zs-armed'); clearTimeout(c.__zsArmTimer); }
    });
  }

  function _onClick(e) {
    var say_ = _closest(e.target, '.zs-say');
    if (say_) {
      e.preventDefault();
      e.stopPropagation();
      var tgt = say_.__zsTarget;
      if (say_.hasAttribute('data-say')) say(say_.getAttribute('data-say'), say_.getAttribute('data-say-lang'));
      else _sayEl(tgt, say_.__zsLang);
      return;
    }

    var c = _closest(e.target, '[data-zs-choice]');
    if (!c || !enabled()) return;

    // The click that ends a long press must not also answer.
    if (_suppressClick) {
      _suppressClick = false;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      return;
    }
    if (!little()) return;

    // Little-kid mode: the first tap says it, the second tap answers.
    if (c.getAttribute('data-zs-armed') === '1') {
      c.removeAttribute('data-zs-armed');
      return;
    }
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    _disarmAll(c);
    c.setAttribute('data-zs-armed', '1');
    clearTimeout(c.__zsArmTimer);
    c.__zsArmTimer = setTimeout(function() { c.removeAttribute('data-zs-armed'); }, ARM_MS);
    say(_choiceText(c), c.getAttribute('data-zs-lang'));
  }

  function _onDown(e) {
    // A touch is the first thing an iPad will let us speak after.
    if (_pending) {
      var p = _pending; _pending = null;
      if (_visible(p)) _sayEl(p);
    }
    var c = _closest(e.target, '[data-zs-choice]');
    if (!c || !enabled()) return;
    _suppressClick = false;
    _pressAt = { x: e.clientX, y: e.clientY };
    clearTimeout(_pressTimer);
    _pressTimer = setTimeout(function() {
      say(_choiceText(c), c.getAttribute('data-zs-lang'));
      _suppressClick = true;
      setTimeout(function() { _suppressClick = false; }, 1200);
    }, LONG_PRESS_MS);
  }

  function _onUp() { clearTimeout(_pressTimer); }

  // ── Little-kid look ──
  var _styled = false;
  function _style() {
    if (_styled) return;
    _styled = true;
    var st = document.createElement('style');
    st.textContent =
      '.zs-say{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;margin-left:.45em;' +
        'min-width:40px;min-height:40px;padding:0;border:2px solid rgba(99,102,241,.35);border-radius:50%;' +
        'background:#fff;color:#4338ca;font:inherit;font-size:1.05rem;line-height:1;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.12)}' +
      '.zs-say:active{transform:scale(.94)}' +
      '[data-zs-choice]{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}' +
      '[data-zs-armed="1"]{outline:4px solid #f59e0b;outline-offset:2px}' +
      'html.zs-little{font-size:112.5%}' +
      'html.zs-little [data-zs-extra],html.zs-little .zs-extra{display:none!important}' +
      'html.zs-little :where(button,[role="button"],select){min-height:56px}' +
      'html.zs-little .zs-say,html.zs-little [data-zs-choice]{min-width:56px;min-height:56px}' +
      'html.zs-little .zs-say{font-size:1.4rem}';
    document.head.appendChild(st);
  }

  function _applyMode() {
    _style();
    document.documentElement.classList.toggle('zs-little', little());
  }

  // ── Setup ──
  function watch(rule) {
    (Array.isArray(rule) ? rule : [rule]).forEach(function(r) { if (r) _cfgs.push(r); });
    if (_started) scan();
  }

  function _pageName() {
    var f = location.pathname.split('/').pop() || 'index.html';
    return f.replace(/\.html$/, '');
  }

  function init() {
    if (_started) return;
    _started = true;
    if (!enabled()) return;
    _applyMode();
    watch(RULES[_pageName()] || []);

    document.addEventListener('click', _onClick, true);
    document.addEventListener('pointerdown', _onDown, true);
    document.addEventListener('pointerup', _onUp, true);
    document.addEventListener('pointercancel', _onUp, true);
    // Dragging is not a press.
    document.addEventListener('pointermove', function(e) {
      if (_pressAt && Math.abs(e.clientX - _pressAt.x) + Math.abs(e.clientY - _pressAt.y) > 12) _onUp();
    }, true);
    document.addEventListener('contextmenu', function(e) { if (_closest(e.target, '[data-zs-choice]')) e.preventDefault(); }, true);

    // Stop talking when the page goes away.
    window.addEventListener('pagehide', stop);
    document.addEventListener('visibilitychange', function() { if (document.hidden) stop(); });

    // The apps redraw their screens; look again when they do.
    if (typeof MutationObserver !== 'undefined') {
      var queued = false;
      new MutationObserver(function() {
        if (queued) return;
        queued = true;
        (window.requestAnimationFrame || setTimeout)(function() { queued = false; scan(); });
      }).observe(document.body, { childList: true, subtree: true });
    }
    scan();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { say: say, stop: stop, button: button, watch: watch, scan: scan, refresh: scan, enabled: enabled, little: little, init: init, _rules: RULES };
})();
