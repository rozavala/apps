/* ================================================================
   BOOK & MOVIE CHECK — book-movie-check.js
   Look up books and movies, evaluate through family values,
   age-appropriate filtering. Uses VPS media endpoints for AI eval.
   Storage key: zs_bmcheck_[username] via getUserAppKey('zs_bmcheck_')
   ================================================================ */

var BMC = (function() {
  'use strict';

  var VPS = 'https://real-options-dev.tail57521e.ts.net';
  var STORAGE_PREFIX = 'zs_bmcheck_';
  var FETCH_TIMEOUT = 20000;  // 20s — AI evaluations can take 5-10s

  // In-memory caches
  var _familyLibrary = {};   // canonical_id -> full evaluation (synced across family via VPS cache)
  var _currentResult = null; // last shown evaluation
  var _scanActive = false;
  var _scanStream = null;
  var _parentMode = false;  // session-only, resets on page reload

  function _requestParentMode() {
    if (_parentMode) return true;
    var entered = prompt('Parent PIN:');
    if (!entered) return false;
    var correct = typeof getParentPin === 'function' ? getParentPin() : '1234';
    if (entered === correct) {
      _parentMode = true;
      return true;
    }
    alert('Incorrect PIN.');
    return false;
  }

  function unlockParent() {
    if (_requestParentMode()) {
      if (_currentResult) showResult(_currentResult);
    }
  }

  // ── Storage helpers ────────────────────────────────────────────
  function _key() {
    return typeof getUserAppKey === 'function' ? getUserAppKey(STORAGE_PREFIX) : null;
  }

  function _defaultData() {
    return {
      totalStars: 0,
      lookups: {},     // canonical_id -> { ts, query, verdict }
      consumed: [],    // [{ canonical_id, ts, rating }]
      wishlist: []     // [canonical_id]
    };
  }

  function loadData() {
    var k = _key();
    if (!k) return _defaultData();
    try {
      var raw = localStorage.getItem(k);
      if (!raw) return _defaultData();
      var d = JSON.parse(raw);
      // Merge defaults for forward-compat
      if (!d.lookups) d.lookups = {};
      if (!d.consumed) d.consumed = [];
      if (!d.wishlist) d.wishlist = [];
      if (typeof d.totalStars !== 'number') d.totalStars = 0;
      return d;
    } catch (e) { return _defaultData(); }
  }

  function saveData(data) {
    var k = _key();
    if (!k) return;
    try {
      localStorage.setItem(k, JSON.stringify(data));
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
    } catch (e) {
      console.warn('[BMC] Save failed:', e);
    }
  }

  // ── Fetch helpers ──────────────────────────────────────────────
  function _fetchJson(url, opts) {
    opts = opts || {};
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var id = controller ? setTimeout(function() { controller.abort(); }, FETCH_TIMEOUT) : null;
    if (controller) opts.signal = controller.signal;
    return fetch(url, opts)
      .then(function(res) {
        if (id) clearTimeout(id);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
  }

  // ── Status display ─────────────────────────────────────────────
  function _setStatus(msg, kind) {
    var el = document.getElementById('bmc-status');
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'bmc-status' + (kind ? ' ' + kind : '');
  }

  // ── Screen navigation ──────────────────────────────────────────
  function showTab(name) {
    var screens = document.querySelectorAll('#screen-home, #screen-result, #screen-library, #screen-history');
    screens.forEach(function(s) { s.classList.remove('active'); });
    var tabButtons = document.querySelectorAll('.bmc-tab-btn');
    tabButtons.forEach(function(b) { b.classList.remove('active'); });

    if (name === 'library') {
      document.getElementById('screen-library').classList.add('active');
      _renderLibrary();
      var btn = document.querySelector('.bmc-tab-btn[onclick*="library"]');
      if (btn) btn.classList.add('active');
    } else if (name === 'history') {
      document.getElementById('screen-history').classList.add('active');
      _renderHistory();
      var btn2 = document.querySelector('.bmc-tab-btn[onclick*="history"]');
      if (btn2) btn2.classList.add('active');
    } else if (name === 'result') {
      document.getElementById('screen-result').classList.add('active');
    } else {
      document.getElementById('screen-home').classList.add('active');
      _renderHome();
      var btn3 = document.querySelector('.bmc-tab-btn[onclick*="home"]');
      if (btn3) btn3.classList.add('active');
    }
  }

  // ── Home screen render ─────────────────────────────────────────
  function _renderHome() {
    var data = loadData();
    var recentEl = document.getElementById('bmc-recent');
    var suggestedEl = document.getElementById('bmc-suggested');

    // Recent lookups (by this kid)
    var recentIds = Object.keys(data.lookups || {})
      .sort(function(a, b) { return (data.lookups[b].ts || 0) - (data.lookups[a].ts || 0); })
      .slice(0, 5);
    if (recentIds.length && recentEl) {
      var html = '<div class="bmc-list-group-title">Recently checked</div>';
      html += recentIds.map(function(id) {
        var lib = _familyLibrary[id];
        if (!lib) return '';
        return _listItemHtml(lib);
      }).join('');
      recentEl.innerHTML = html;
    } else if (recentEl) {
      recentEl.innerHTML = '';
    }

    // Suggested: approved items from the family library this kid hasn't looked up yet
    var kidLookupIds = {};
    Object.keys(data.lookups || {}).forEach(function(id) { kidLookupIds[id] = true; });
    var suggested = Object.keys(_familyLibrary)
      .map(function(id) { return _familyLibrary[id]; })
      .filter(function(item) {
        if (!item) return false;
        if (kidLookupIds[item.canonical_id]) return false;
        if (item.verdict === 'not_recommended') return false;
        return true;
      })
      .slice(0, 5);

    if (suggested.length && suggestedEl) {
      var html2 = '<div class="bmc-list-group-title">Suggested for you</div>';
      html2 += suggested.map(_listItemHtml).join('');
      suggestedEl.innerHTML = html2;
    } else if (suggestedEl) {
      suggestedEl.innerHTML = '';
    }
  }

  // ── Library screen (family-wide) ───────────────────────────────
  function _renderLibrary() {
    var container = document.getElementById('bmc-library-list');
    if (!container) return;
    var items = Object.keys(_familyLibrary)
      .map(function(id) { return _familyLibrary[id]; })
      .filter(function(item) {
        if (!item) return false;
        if (!_parentMode && item.verdict === 'not_recommended') return false;
        return true;
      })
      .sort(function(a, b) { return (b.evaluated_at || 0) - (a.evaluated_at || 0); });
    if (!items.length) {
      container.innerHTML = '<div class="bmc-empty">No titles checked yet. Search for a book or movie to get started!</div>';
      return;
    }
    container.innerHTML = items.map(_listItemHtml).join('');
  }

  // ── History screen (per kid) ───────────────────────────────────
  function _renderHistory() {
    var container = document.getElementById('bmc-history-list');
    if (!container) return;
    var data = loadData();
    var html = '';

    var consumed = (data.consumed || []).slice().sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); });
    if (consumed.length) {
      html += '<div class="bmc-list-group-title">Reading / watched</div>';
      html += consumed.map(function(c) {
        var lib = _familyLibrary[c.canonical_id];
        return lib ? _listItemHtml(lib) : '';
      }).join('');
    }
    if ((data.wishlist || []).length) {
      html += '<div class="bmc-list-group-title">Wishlist</div>';
      html += data.wishlist.map(function(id) {
        var lib = _familyLibrary[id];
        if (!lib) return '';
        if (!_parentMode && lib.verdict === 'not_recommended') return '';
        return _listItemHtml(lib);
      }).join('');
    }
    if (!html) {
      html = '<div class="bmc-empty">Nothing here yet. Check a book or movie, then add it to your shelf.</div>';
    }
    container.innerHTML = html;
  }

  // ── List item HTML ─────────────────────────────────────────────
  function _listItemHtml(item) {
    if (!item) return '';
    var cover = item.cover_url
      ? 'style="background-image:url(\'' + escAttr(item.cover_url) + '\')"'
      : '';
    var emoji = (item.type === 'movie' || item.type === 'series') ? '🎬' : '📕';
    var verdict = item.verdict || 'caution';
    return '<button type="button" class="bmc-list-item verdict-' + escAttr(verdict) + '" onclick="BMC.selectCandidate(\'' + escAttr(item.canonical_id) + '\')">' +
      '<div class="bmc-list-cover" ' + cover + '>' + (item.cover_url ? '' : emoji) + '</div>' +
      '<div class="bmc-list-body">' +
      '  <div class="bmc-list-title">' + escHtml(item.title) + '</div>' +
      '  <div class="bmc-list-meta">' + escHtml(item.author_or_director || '') + (item.year ? ' · ' + item.year : '') + ' · ages ' + (item.minimum_age || '?') + '+</div>' +
      '</div>' +
      '<div class="bmc-list-verdict verdict-' + escAttr(verdict) + '">' + _verdictLabel(verdict) + '</div>' +
    '</button>';
  }

  // ── Safe escape helpers ────────────────────────────────────────
  function escAttr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  // escHtml is provided globally by auth.js — prefer that; fallback:
  var _escHtmlLocal = (typeof escHtml === 'function') ? escHtml : escAttr;

  function _verdictLabel(v) {
    if (v === 'approved') return '✅ Approved';
    if (v === 'not_recommended') return '❌ Skip';
    return '⚠️ Caution';
  }

  // ── Search flow (title text) ───────────────────────────────────
  function search() {
    var input = document.getElementById('bmc-query');
    var q = (input ? input.value : '').trim();
    if (!q) return;

    // Check family library first
    var hit = Object.keys(_familyLibrary).find(function(id) {
      var it = _familyLibrary[id];
      return it && (
        it.title.toLowerCase() === q.toLowerCase() ||
        (it.title + ' ' + (it.author_or_director || '')).toLowerCase().includes(q.toLowerCase())
      );
    });
    if (hit) {
      return selectCandidate(hit);
    }

    _setStatus('Searching for "' + q + '"…', 'working');
    _fetchJson(VPS + '/api/media/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    })
      .then(function(res) {
        if (!res.candidates || !res.candidates.length) {
          _setStatus('No results for "' + q + '". Try a different title.', 'error');
          return;
        }
        if (res.candidates.length === 1) {
          _requestEvaluation(res.candidates[0]);
        } else {
          _showCandidates(res.candidates);
        }
      })
      .catch(function(err) {
        console.warn('[BMC] Lookup failed:', err);
        var msg = (err && err.name === 'AbortError')
          ? 'The search timed out. Check your connection and try again.'
          : 'Could not reach the book server. Please try again.';
        _setStatus(msg, 'error');
      });
  }

  // ── ISBN scan + manual entry ───────────────────────────────────
  function scanIsbn() {
    if (typeof BarcodeDetector === 'undefined') {
      return promptManualIsbn();
    }
    BarcodeDetector.getSupportedFormats().then(function(formats) {
      if (formats.indexOf('ean_13') === -1 && formats.indexOf('isbn_13') === -1) {
        return promptManualIsbn();
      }
      _startScan(formats);
    }).catch(function() {
      promptManualIsbn();
    });
  }

  function _startScan(formats) {
    var modal = document.getElementById('bmc-scan-modal');
    var video = document.getElementById('bmc-scan-video');
    var hint = document.getElementById('bmc-scan-hint');
    if (!modal || !video) return promptManualIsbn();
    modal.classList.add('active');

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(function(stream) {
        _scanStream = stream;
        video.srcObject = stream;
        video.play();
        var detector = new BarcodeDetector({ formats: formats.filter(function(f) { return /ean_13|isbn_13/.test(f); }) });
        _scanActive = true;
        hint.textContent = 'Looking for barcode…';
        var loop = function() {
          if (!_scanActive) return;
          detector.detect(video).then(function(hits) {
            if (hits && hits.length) {
              var code = hits[0].rawValue;
              closeScan();
              _lookupByIsbn(code);
            } else {
              setTimeout(loop, 500);
            }
          }).catch(function() { setTimeout(loop, 800); });
        };
        loop();
      })
      .catch(function() {
        closeScan();
        promptManualIsbn();
      });
  }

  function closeScan() {
    _scanActive = false;
    var modal = document.getElementById('bmc-scan-modal');
    if (modal) modal.classList.remove('active');
    if (_scanStream) {
      _scanStream.getTracks().forEach(function(t) { t.stop(); });
      _scanStream = null;
    }
  }

  function promptManualIsbn() {
    closeScan();
    var isbn = prompt('Type the ISBN (the number on the barcode):');
    if (!isbn) return;
    isbn = isbn.replace(/[^0-9Xx]/g, '');
    if (isbn.length !== 10 && isbn.length !== 13) {
      alert('That doesn\'t look like a valid ISBN.');
      return;
    }
    _lookupByIsbn(isbn);
  }

  function _lookupByIsbn(isbn) {
    _setStatus('Looking up ISBN ' + isbn + '…', 'working');
    _fetchJson(VPS + '/api/media/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isbn: isbn })
    })
      .then(function(res) {
        if (!res.candidates || !res.candidates.length) {
          _setStatus('Could not find that ISBN.', 'error');
          return;
        }
        _requestEvaluation(res.candidates[0]);
      })
      .catch(function(err) {
        console.warn('[BMC] ISBN lookup failed:', err);
        _setStatus('Could not look up that ISBN right now.', 'error');
      });
  }

  // ── Photo-of-cover flow ────────────────────────────────────────
  function capturePhoto() {
    var input = document.getElementById('bmc-photo-input');
    if (!input) return;
    input.value = '';  // allow re-selecting same file
    input.onchange = function() {
      var file = input.files && input.files[0];
      if (!file) return;
      _setStatus('Reading photo…', 'working');
      var reader = new FileReader();
      reader.onload = function() {
        var b64 = String(reader.result).split(',')[1];
        _setStatus('Identifying the book…', 'working');
        _fetchJson(VPS + '/api/media/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: b64 })
        })
          .then(function(res) {
            if (!res.candidates || !res.candidates.length) {
              _setStatus('Could not identify that book. Try typing the title.', 'error');
              return;
            }
            _requestEvaluation(res.candidates[0]);
          })
          .catch(function(err) {
            console.warn('[BMC] Photo lookup failed:', err);
            _setStatus('Could not identify the photo right now.', 'error');
          });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  // ── Candidate disambiguation ───────────────────────────────────
  function _showCandidates(candidates) {
    _setStatus('');
    var wrap = document.getElementById('bmc-result');
    if (!wrap) return;
    var html = '<h3 style="font-family:var(--font-display);font-weight:800;margin-bottom:12px;color:var(--text-primary);">Which one?</h3>';
    html += candidates.map(function(c) {
      var cover = c.cover_url
        ? 'style="background-image:url(\'' + escAttr(c.cover_url) + '\');width:44px;height:60px;background-size:cover;background-position:center;border-radius:6px;flex-shrink:0;"'
        : 'style="width:44px;height:60px;border-radius:6px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0;"';
      var emoji = (c.type === 'movie' || c.type === 'series') ? '🎬' : '📕';
      return '<button type="button" class="bmc-candidate" onclick="BMC.pickCandidate(\'' + escAttr(c.canonical_id) + '\')">' +
        '<div ' + cover + '>' + (c.cover_url ? '' : emoji) + '</div>' +
        '<div style="flex:1;min-width:0;"><div>' + _escHtmlLocal(c.title) + '</div>' +
        '<div class="candidate-meta">' + _escHtmlLocal(c.author_or_director || '') + (c.year ? ' · ' + c.year : '') + '</div></div>' +
      '</button>';
    }).join('');
    wrap.innerHTML = html;
    // Stash candidates temporarily for pickCandidate
    BMC._lastCandidates = candidates.reduce(function(map, c) { map[c.canonical_id] = c; return map; }, {});
    showTab('result');
  }

  function pickCandidate(canonicalId) {
    var c = BMC._lastCandidates && BMC._lastCandidates[canonicalId];
    if (c) _requestEvaluation(c);
  }

  // ── Get evaluation from VPS ────────────────────────────────────
  function _requestEvaluation(candidate) {
    _setStatus('Evaluating "' + candidate.title + '"…', 'working');
    showTab('result');
    var wrap = document.getElementById('bmc-result');
    if (wrap) wrap.innerHTML = '<div class="bmc-empty">Checking… this can take a few seconds ⏳</div>';

    _fetchJson(VPS + '/api/media/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canonical_id: candidate.canonical_id, metadata: candidate })
    })
      .then(function(evaluation) {
        _familyLibrary[candidate.canonical_id] = evaluation;
        _recordLookup(evaluation);
        _setStatus('');
        showResult(evaluation);
        if (typeof ActivityLog !== 'undefined') {
          ActivityLog.log('Book & Movie Check', '🔍',
            'Checked "' + evaluation.title + '" — ' + _verdictLabel(evaluation.verdict));
        }
      })
      .catch(function(err) {
        console.warn('[BMC] Evaluate failed:', err);
        if (wrap) wrap.innerHTML = '<div class="bmc-empty">Could not finish the check right now. Please try again.</div>';
        _setStatus('');
      });
  }

  function _recordLookup(evaluation) {
    var data = loadData();
    data.lookups[evaluation.canonical_id] = {
      ts: Date.now(),
      query: evaluation.title,
      verdict: evaluation.verdict
    };
    saveData(data);
  }

  // ── Result screen render ───────────────────────────────────────
  function showResult(e) {
    _currentResult = e;
    var wrap = document.getElementById('bmc-result');
    if (!wrap) return;

    var coverStyle = e.cover_url ? 'style="background-image:url(\'' + escAttr(e.cover_url) + '\')"' : '';
    var coverEmoji = (e.type === 'movie' || e.type === 'series') ? '🎬' : '📕';

    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    var userAge = user && user.age;
    var tooYoung = userAge && e.minimum_age && userAge < e.minimum_age;

    var isParent = _parentMode;
    var isSafe = e.verdict === 'approved';
    var isCaution = e.verdict === 'caution';
    var isBlocked = e.verdict === 'not_recommended';

    var showSummary = isParent || isSafe || isCaution;
    var showFlags = isParent || isSafe;
    var showConcerns = isParent || isSafe;
    var showParentNotes = isParent;
    var showActions = isParent || !isBlocked;

    var verdictEmoji = e.verdict === 'approved' ? '✅' : (e.verdict === 'not_recommended' ? '❌' : '⚠️');
    var verdictTitle = e.verdict === 'approved' ? 'Approved' : (e.verdict === 'not_recommended' ? 'Not for our family' : 'Needs care');
    var verdictMessage = isBlocked && !isParent
      ? 'This book or movie is not a good fit for our family. If you\'re curious, talk with Mom or Dad.'
      : (e.verdict_reasoning || '');

    var confBanner = (e.confidence === 'low' && (isParent || !isBlocked))
      ? '<div class="bmc-lowconf">ℹ️ This check is low-confidence — please verify with a parent.</div>'
      : '';

    var data = loadData();
    var onWishlist = (data.wishlist || []).indexOf(e.canonical_id) !== -1;
    var alreadyConsumed = (data.consumed || []).some(function(c) { return c.canonical_id === e.canonical_id; });

    var chipHtml = '';
    var posHtml = '';
    if (showFlags) {
      var flagOrder = ['lgbtq_content','crt_ideology','sexual_content','violence','scary_content','profanity','occult_aspirational','anti_religious','moral_relativism','disrespect_authority'];
      var flagLabels = {
        lgbtq_content: 'LGBTQ content',
        crt_ideology: 'Racial ideology',
        sexual_content: 'Sexual content',
        violence: 'Violence',
        scary_content: 'Scary',
        profanity: 'Language',
        occult_aspirational: 'Occult themes',
        anti_religious: 'Anti-religious',
        moral_relativism: 'Moral relativism',
        disrespect_authority: 'Disrespect of authority'
      };
      chipHtml = flagOrder.map(function(k) {
        var sev = (e.content_flags || {})[k];
        if (!sev || sev === 'none') return '';
        return '<span class="bmc-chip bmc-chip-' + sev + '">' + flagLabels[k] + ' · ' + sev + '</span>';
      }).join('');
      var posLabels = {
        catholic_themes: '✝️ Catholic',
        christian_themes: '🙏 Christian',
        virtue_modeled: '⚔️ Virtue',
        intact_family: '👨‍👩‍👧 Family',
        clear_moral_framework: '⚖️ Clear morals',
        educational_value: '📚 Educational',
        classic_literary_merit: '🏛 Classic',
        inspires_wonder: '✨ Wonder'
      };
      posHtml = Object.keys(posLabels).filter(function(k) {
        return (e.positive_flags || {})[k];
      }).map(function(k) {
        return '<span class="bmc-chip bmc-chip-positive">' + posLabels[k] + '</span>';
      }).join('');
    }

    var concernsHtml = '';
    if (showConcerns && e.specific_concerns && e.specific_concerns.length) {
      concernsHtml = '<div class="bmc-card"><h4>Things to know</h4><ul>' +
        e.specific_concerns.map(function(c) { return '<li>' + _escHtmlLocal(c) + '</li>'; }).join('') +
        '</ul></div>';
    } else if (isCaution && !isParent && e.confidence !== 'low') {
      var nFlags = 0;
      if (e.content_flags) {
        for (var k in e.content_flags) {
          if (e.content_flags[k] && e.content_flags[k] !== 'none') nFlags++;
        }
      }
      if (nFlags > 0) {
        concernsHtml = '<div class="bmc-card"><h4>Good to know</h4><p style="font-size:0.9rem;">This one has some content worth checking with a parent first.</p></div>';
      }
    }

    var unlockStrip = '';
    if (!isParent && (isBlocked || !showParentNotes || !showFlags)) {
      unlockStrip = '<button class="bmc-btn bmc-btn-ghost" onclick="BMC.unlockParent()" style="width:100%;margin-top:4px;">🔒 Show Mom or Dad (parent PIN)</button>';
    }

    var html =
      '<div class="bmc-result-head">' +
        '<div class="bmc-result-cover" ' + coverStyle + '>' + (e.cover_url ? '' : coverEmoji) + '</div>' +
        '<div class="bmc-result-meta">' +
          '<h2>' + _escHtmlLocal(e.title) + '</h2>' +
          '<div class="bmc-result-author">' + _escHtmlLocal(e.author_or_director || '') + (e.year ? ' · ' + e.year : '') + '</div>' +
          '<span class="bmc-result-type">' + _escHtmlLocal(e.type || 'book') + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="bmc-verdict-banner verdict-' + escAttr(e.verdict) + '">' +
        '<div class="verdict-emoji">' + verdictEmoji + '</div>' +
        '<div><h3>' + verdictTitle + '</h3><p>' + _escHtmlLocal(verdictMessage) + '</p></div>' +
      '</div>' +

      '<div class="bmc-age-row">' +
        '<span class="bmc-age-pill">Ages ' + (e.minimum_age || '?') + '+' + (e.ideal_age_range ? ' · ideal ' + _escHtmlLocal(e.ideal_age_range) : '') + '</span>' +
        (isParent && e.parent_reviewed ? '<span class="bmc-reviewed-pill">✓ Parent reviewed</span>' : '') +
      '</div>' +

      (tooYoung && !isParent
        ? '<div class="bmc-age-gate">This is recommended for age ' + e.minimum_age + '+. Ask Mom or Dad first.</div>'
        : ''
      ) +

      (showSummary && e.summary
        ? '<div class="bmc-summary"><h4>What it\'s about</h4>' + _escHtmlLocal(e.summary) + '</div>'
        : ''
      ) +

      ((chipHtml || posHtml)
        ? '<div class="bmc-chips">' + chipHtml + posHtml + '</div>'
        : ''
      ) +

      concernsHtml +

      (showParentNotes && e.parent_notes
        ? '<div class="bmc-parent-notes"><strong>Parent notes</strong>' + _escHtmlLocal(e.parent_notes) + '</div>'
        : ''
      ) +

      (showActions
        ? ('<div class="bmc-action-row">' +
            (alreadyConsumed
              ? '<button class="bmc-btn bmc-btn-ghost" disabled>✅ On your shelf</button>'
              : '<button class="bmc-btn bmc-btn-primary" onclick="BMC.recordConsumed(\'' + escAttr(e.canonical_id) + '\')">📖 I\'m reading/watching this</button>'
            ) +
            (onWishlist
              ? '<button class="bmc-btn bmc-btn-ghost" disabled>💫 On wishlist</button>'
              : '<button class="bmc-btn bmc-btn-secondary" onclick="BMC.addToWishlist(\'' + escAttr(e.canonical_id) + '\')">+ Add to wishlist</button>'
            ) +
          '</div>')
        : ''
      ) +

      unlockStrip +
      confBanner;

    wrap.innerHTML = html;
  }

  // ── Library/history click → show result for a known item ───────
  function selectCandidate(canonicalId) {
    var item = _familyLibrary[canonicalId];
    if (!item) {
      _setStatus('Loading…', 'working');
      _fetchJson(VPS + '/api/media/cache/' + encodeURIComponent(canonicalId))
        .then(function(evaluation) {
          _familyLibrary[canonicalId] = evaluation;
          _setStatus('');
          showTab('result');
          showResult(evaluation);
        })
        .catch(function() { _setStatus('Could not load that entry.', 'error'); });
      return;
    }
    _setStatus('');
    showTab('result');
    showResult(item);
  }

  // ── Actions: consumed / wishlist ───────────────────────────────
  function recordConsumed(canonicalId) {
    var data = loadData();
    if (data.consumed.some(function(c) { return c.canonical_id === canonicalId; })) return;
    data.consumed.push({ canonical_id: canonicalId, ts: Date.now() });
    data.wishlist = (data.wishlist || []).filter(function(id) { return id !== canonicalId; });
    data.totalStars = (data.totalStars || 0) + 1;  // earns a star for starting something
    saveData(data);
    var item = _familyLibrary[canonicalId];
    if (item && typeof ActivityLog !== 'undefined') {
      ActivityLog.log('Book & Movie Check', '🔍',
        'Started ' + (item.type || 'book') + ' "' + item.title + '"');
    }
    if (_currentResult) showResult(_currentResult);
  }

  function addToWishlist(canonicalId) {
    var data = loadData();
    if ((data.wishlist || []).indexOf(canonicalId) !== -1) return;
    data.wishlist.push(canonicalId);
    saveData(data);
    if (_currentResult) showResult(_currentResult);
  }

  // ── VPS family library hydration ───────────────────────────────
  function _hydrateFamilyLibrary() {
    // Pulls the full server-side cache of evaluated titles
    return _fetchJson(VPS + '/api/media/library')
      .then(function(library) {
        _familyLibrary = library || {};
      })
      .catch(function(err) {
        console.warn('[BMC] Library hydrate failed:', err);
      });
  }

  // ── Init ───────────────────────────────────────────────────────
  function init() {
    _hydrateFamilyLibrary().then(function() {
      _renderHome();
    });

    // Handle #library / #history / #wishlist deep links
    var h = (location.hash || '').replace('#', '');
    if (h === 'library' || h === 'history' || h === 'wishlist') {
      showTab(h === 'wishlist' ? 'history' : h);
    }

    // Enter-to-search
    var input = document.getElementById('bmc-query');
    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); search(); }
      });
    }
  }

  return {
    init: init,
    search: search,
    scanIsbn: scanIsbn,
    capturePhoto: capturePhoto,
    promptManualIsbn: promptManualIsbn,
    closeScan: closeScan,
    showTab: showTab,
    showResult: showResult,
    selectCandidate: selectCandidate,
    pickCandidate: pickCandidate,
    recordConsumed: recordConsumed,
    addToWishlist: addToWishlist,
    unlockParent: unlockParent
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  BMC.init();
});
