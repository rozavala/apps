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
   Any element with data-speak gets a 🔊 as well (its value, if any,
   is what is said instead of its text).

   API:
     ZsSpeak.say(text, lang)     speak now (false when read-aloud is off)
     ZsSpeak.button(text, lang)  HTML for a 🔊 button that says text
     ZsSpeak.watch(rule | [rules])
     ZsSpeak.stop()
   ================================================================ */

var ZsSpeak = (function() {
  'use strict';

  var RULES = {
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
    'math-galaxy':      [{ prompt: '.sprint-q-text' }]
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
    t = t.replace(/×/g, es ? ' por ' : ' times ')
         .replace(/÷/g, es ? ' dividido por ' : ' divided by ')
         .replace(/−/g, es ? ' menos ' : ' minus ')
         .replace(/\s*=\s*\?/g, es ? ' es igual a cuánto' : ' equals what')
         .replace(/\s*=\s*/g, es ? ' es igual a ' : ' equals ');
    return t.replace(/\s+/g, ' ').trim();
  }

  function _textOf(el) {
    if (!el) return '';
    var copy = el.cloneNode(true);
    Array.prototype.forEach.call(copy.querySelectorAll('.zs-say'), function(b) { b.remove(); });
    return (copy.textContent || '').replace(/\s+/g, ' ').trim();
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
    var l = _langOf(text, lang);
    var t = _clean(text, l);
    if (!t) return false;
    _spokenText = t;
    return !!ZsTTS.speak(t, { lang: _voiceLang(l) });
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
    var had = Array.prototype.some.call(el.children, function(c) { return c.classList.contains('zs-say'); });
    if (!had) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zs-say';
      b.textContent = '🔊';
      b.setAttribute('aria-label', _label());
      b.__zsTarget = el;
      b.__zsLang = cfg && cfg.lang;
      el.appendChild(b);
    }
    var text = _textOf(el);
    var changed = el.__zsText !== text;
    el.__zsText = text;
    return (!had || changed) && !!text;
  }

  function scan() {
    if (!enabled()) return;
    var fresh = [];

    _cfgs.forEach(function(cfg) {
      var prompts = [];
      if (cfg.prompt) prompts = _all(cfg.prompt);
      else _all(cfg.group).forEach(function(g) { var p = _promptBefore(g); if (p) prompts.push(p); });
      prompts.forEach(function(p) { if (_decorate(p, cfg)) fresh.push(p); });

      _all(cfg.choice).forEach(function(c) {
        c.setAttribute('data-zs-choice', '1');
        if (cfg.lang) c.setAttribute('data-zs-lang', cfg.lang);
      });
    });

    _all('[data-speak]').forEach(function(el) { _decorate(el, null); });

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
      var b = el.querySelector('.zs-say');
      say(_textOf(el), b && b.__zsLang);
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
      var text = say_.hasAttribute('data-say') ? say_.getAttribute('data-say')
        : (tgt && tgt.getAttribute('data-speak')) || _textOf(tgt);
      say(text, say_.getAttribute('data-say-lang') || say_.__zsLang);
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
    say(_textOf(c), c.getAttribute('data-zs-lang'));
  }

  function _onDown(e) {
    // A touch is the first thing an iPad will let us speak after.
    if (_pending) {
      var p = _pending; _pending = null;
      if (_visible(p)) { var b = p.querySelector('.zs-say'); say(_textOf(p), b && b.__zsLang); }
    }
    var c = _closest(e.target, '[data-zs-choice]');
    if (!c || !enabled()) return;
    _suppressClick = false;
    _pressAt = { x: e.clientX, y: e.clientY };
    clearTimeout(_pressTimer);
    _pressTimer = setTimeout(function() {
      say(_textOf(c), c.getAttribute('data-zs-lang'));
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

  return { say: say, stop: stop, button: button, watch: watch, scan: scan, enabled: enabled, little: little, init: init, _rules: RULES };
})();
