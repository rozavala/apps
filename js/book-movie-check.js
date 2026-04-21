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

  // Environment detection for iPad-in-WKWebView-wrapper cases
  var _cameraAvailable = null;  // null = unknown; true/false after probe
  function _isIpadWrapper() {
    try {
      var ua = navigator.userAgent || '';
      var isIOS = /iPad|iPhone|iPod/.test(ua) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (!isIOS) return false;
      // Safari on iOS reports "Safari" in UA. WKWebView wrappers do not.
      var isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
      return !isSafari;
    } catch (e) { return false; }
  }

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
      _refreshStaleCount();
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

    function _activateTabButtons(selector) {
      document.querySelectorAll(selector).forEach(function(b) { b.classList.add('active'); });
    }

    if (name === 'library') {
      document.getElementById('screen-library').classList.add('active');
      _renderLibrary();
      _refreshStaleCount();
      _activateTabButtons('.bmc-tab-btn[onclick*="library"]');
    } else if (name === 'history') {
      document.getElementById('screen-history').classList.add('active');
      _renderHistory();
      _refreshStaleCount();
      _activateTabButtons('.bmc-tab-btn[onclick*="history"]');
    } else if (name === 'result') {
      document.getElementById('screen-result').classList.add('active');
    } else {
      document.getElementById('screen-home').classList.add('active');
      _renderHome();
      _activateTabButtons('.bmc-tab-btn[onclick*="home"]');
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
  function _httpsCover(url) {
    return url ? String(url).replace(/^http:\/\//i, 'https://') : '';
  }

  function _listItemHtml(item) {
    if (!item) return '';
    var coverUrl = _httpsCover(item.cover_url);
    var cover = coverUrl
      ? 'style="background-image:url(\'' + escAttr(coverUrl) + '\')"'
      : '';
    var emoji = (item.type === 'movie' || item.type === 'series') ? '🎬' : '📕';
    var verdict = item.verdict || 'caution';
    return '<button type="button" class="bmc-list-item verdict-' + escAttr(verdict) + '" onclick="BMC.selectCandidate(\'' + escAttr(item.canonical_id) + '\')">' +
      '<div class="bmc-list-cover" ' + cover + '>' + (coverUrl ? '' : emoji) + '</div>' +
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
  function _showScanModalWithHint() {
    var modal = document.getElementById('bmc-scan-modal');
    var hint = document.getElementById('bmc-scan-ipad-hint');
    if (!modal) return false;
    if (hint) hint.style.display = 'block';
    modal.classList.add('active');
    return true;
  }

  function scanIsbn() {
    // BarcodeDetector is Chromium-only; on all WebKit iPads it is undefined.
    if (typeof BarcodeDetector === 'undefined') {
      if (_showScanModalWithHint()) return;
      return promptManualIsbn();
    }
    BarcodeDetector.getSupportedFormats().then(function(formats) {
      if (formats.indexOf('ean_13') === -1 && formats.indexOf('isbn_13') === -1) {
        if (_showScanModalWithHint()) return;
        return promptManualIsbn();
      }
      _startScan(formats);
    }).catch(function() {
      if (_showScanModalWithHint()) return;
      promptManualIsbn();
    });
  }

  function _startScan(formats) {
    var modal = document.getElementById('bmc-scan-modal');
    var video = document.getElementById('bmc-scan-video');
    var hint = document.getElementById('bmc-scan-hint');
    var ipadHint = document.getElementById('bmc-scan-ipad-hint');
    if (!modal || !video) return promptManualIsbn();
    modal.classList.add('active');

    // iPad WKWebView wrapper (e.g. Web MIDI Browser) — camera rarely works here
    if (_isIpadWrapper() && ipadHint) {
      ipadHint.style.display = 'block';
    }
    // BarcodeDetector is Chromium-only; on all WebKit iPads it is undefined
    if (typeof BarcodeDetector === 'undefined' && ipadHint) {
      ipadHint.style.display = 'block';
    }

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
        if (ipadHint) {
          ipadHint.style.display = 'block';
          ipadHint.innerHTML = '⚠️ Camera not available in this app. ' +
            'Tap <b>"Type ISBN instead"</b> below, or open Book &amp; Movie Check in Safari.';
        }
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
      var coverUrl = _httpsCover(c.cover_url);
      var cover = coverUrl
        ? 'style="background-image:url(\'' + escAttr(coverUrl) + '\');width:44px;height:60px;background-size:cover;background-position:center;border-radius:6px;flex-shrink:0;"'
        : 'style="width:44px;height:60px;border-radius:6px;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0;"';
      var emoji = (c.type === 'movie' || c.type === 'series') ? '🎬' : '📕';
      return '<button type="button" class="bmc-candidate" onclick="BMC.pickCandidate(\'' + escAttr(c.canonical_id) + '\')">' +
        '<div ' + cover + '>' + (coverUrl ? '' : emoji) + '</div>' +
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

    var coverUrl = _httpsCover(e.cover_url);
    var coverStyle = coverUrl ? 'style="background-image:url(\'' + escAttr(coverUrl) + '\')"' : '';
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

    // Maturity gate vs. values rejection — soften messaging for pure adult content
    if (isBlocked && !isParent) {
      var f = e.content_flags || {};
      var valuesFlags = ['lgbtq_content', 'crt_ideology', 'anti_religious', 'occult_aspirational'];
      var hasSignificantValues = valuesFlags.some(function(k) {
        return f[k] === 'significant';
      });
      var hasModerateValues = valuesFlags.some(function(k) {
        return f[k] === 'moderate';
      });
      var hasSignificantRelativism = f.moral_relativism === 'significant';
      var isPureMaturityGate =
        !hasSignificantValues &&
        !hasModerateValues &&
        !hasSignificantRelativism &&
        e.minimum_age && e.minimum_age >= 13;
      if (isPureMaturityGate) {
        verdictEmoji = '🧓';
        verdictTitle = 'Grown-up book';
        verdictMessage = 'This one is a grown-up book. Ask Mom or Dad if it is right for you yet.';
      }
    }

    var bannerVerdictClass = (isBlocked && !isParent && verdictTitle === 'Grown-up book')
      ? 'verdict-caution'  // reuse the amber caution styling for maturity
      : e.verdict;

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
        '<div class="bmc-result-cover" ' + coverStyle + '>' + (coverUrl ? '' : coverEmoji) + '</div>' +
        '<div class="bmc-result-meta">' +
          '<h2>' + _escHtmlLocal(e.title) + '</h2>' +
          '<div class="bmc-result-author">' + _escHtmlLocal(e.author_or_director || '') + (e.year ? ' · ' + e.year : '') + '</div>' +
          '<span class="bmc-result-type">' + _escHtmlLocal(e.type || 'book') + '</span>' +
        '</div>' +
      '</div>' +

      '<div class="bmc-verdict-banner verdict-' + escAttr(bannerVerdictClass) + '">' +
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

      (isParent
        ? '<div class="bmc-action-row"><button class="bmc-btn bmc-btn-ghost" onclick="BMC.rereviewCurrent()">🔄 Re-review this ' + ((e.type === 'movie' || e.type === 'series') ? 'title' : 'book') + '</button></div>'
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

  // ── Re-review / stale-count (parent tools) ─────────────────────
  function _refreshStaleCount() {
    var libTools = document.getElementById('bmc-parent-tools');
    var shelfTools = document.getElementById('bmc-shelf-parent-tools');
    var countEl = document.getElementById('bmc-stale-count');
    var unlockBtns = document.querySelectorAll('.bmc-parent-unlock-btn');
    var display = _parentMode ? 'block' : 'none';
    if (libTools) libTools.style.display = display;
    if (shelfTools) shelfTools.style.display = display;
    unlockBtns.forEach(function(b) {
      b.textContent = _parentMode ? '🔓 Parent mode on' : '🔒 Parents';
    });
    if (!_parentMode) return;
    _fetchJson(VPS + '/api/media/stale-count')
      .then(function(r) {
        if (countEl) countEl.textContent = r.stale + ' of ' + r.total;
      })
      .catch(function() {
        if (countEl) countEl.textContent = '?';
      });
  }

  // Re-review the book currently on the result screen (parent only)
  function rereviewCurrent() {
    if (!_currentResult) return;
    if (!_requestParentMode()) return;
    var id = _currentResult.canonical_id;
    var title = _currentResult.title;
    if (!confirm('Re-evaluate "' + title + '" from scratch? This takes a few seconds.')) return;
    _setStatus('Re-evaluating "' + title + '"…', 'working');
    _fetchJson(VPS + '/api/media/reevaluate/' + encodeURIComponent(id), { method: 'POST' })
      .then(function(fresh) {
        _familyLibrary[id] = fresh;
        _setStatus('');
        showResult(fresh);
      })
      .catch(function(err) {
        console.warn('[BMC] Re-review failed:', err);
        _setStatus('Re-review failed: ' + (err && err.message ? err.message : 'unknown'), 'error');
      });
  }

  // Re-review every title on this child's shelf + wishlist + recent checks
  function rereviewMyShelf() {
    if (!_requestParentMode()) return;
    var statusEl = document.getElementById('bmc-shelf-reeval-status');
    var data = loadData();
    var ids = {};
    (data.consumed || []).forEach(function(c) { ids[c.canonical_id] = true; });
    (data.wishlist || []).forEach(function(id) { ids[id] = true; });
    Object.keys(data.lookups || {}).forEach(function(id) { ids[id] = true; });
    var idList = Object.keys(ids).filter(function(id) { return _familyLibrary[id]; });
    if (!idList.length) {
      if (statusEl) statusEl.textContent = 'Nothing on this shelf to re-review.';
      return;
    }
    if (!confirm('Re-review all ' + idList.length + ' titles on this child\'s shelf? This can take several minutes.')) return;
    if (statusEl) statusEl.textContent = 'Starting…';
    _fetchJson(VPS + '/api/media/reevaluate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idList })
    })
      .then(function(r) {
        if (statusEl) {
          statusEl.textContent = 'Re-reviewing ' + r.count + ' titles in the background. '
            + 'Refresh in a few minutes.';
        }
      })
      .catch(function(err) {
        if (statusEl) statusEl.textContent = 'Failed to start: ' + (err && err.message ? err.message : 'unknown');
      });
  }

  // Re-review every title in the family library, not just stale ones
  function rereviewFamilyLibrary() {
    if (!_requestParentMode()) return;
    var statusEl = document.getElementById('bmc-reeval-status');
    var idList = Object.keys(_familyLibrary);
    if (!idList.length) {
      if (statusEl) statusEl.textContent = 'Family library is empty.';
      return;
    }
    if (!confirm('Re-review ALL ' + idList.length + ' titles in the family library? '
                 + 'This can take a long time and uses API quota.')) return;
    if (statusEl) statusEl.textContent = 'Starting…';
    _fetchJson(VPS + '/api/media/reevaluate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: idList })
    })
      .then(function(r) {
        if (statusEl) {
          statusEl.textContent = 'Re-reviewing ' + r.count + ' titles in the background. '
            + 'Refresh in a few minutes.';
        }
      })
      .catch(function(err) {
        if (statusEl) statusEl.textContent = 'Failed to start: ' + (err && err.message ? err.message : 'unknown');
      });
  }

  // Clear this kid's lookups (recent checks list on home)
  function clearMySearches() {
    if (!_requestParentMode()) return;
    if (!confirm('Clear this child\'s recent checks? Their shelf and wishlist stay.')) return;
    var data = loadData();
    data.lookups = {};
    saveData(data);
    var statusEl = document.getElementById('bmc-reeval-status');
    if (statusEl) statusEl.textContent = 'Recent checks cleared.';
    // If currently on home, re-render so the list disappears
    if (document.getElementById('screen-home').classList.contains('active')) {
      _renderHome();
    }
  }

  // Wipe the family-wide media-cache.json on the VPS
  function resetFamilyLibrary() {
    if (!_requestParentMode()) return;
    var statusEl = document.getElementById('bmc-reeval-status');
    if (!confirm('⚠️ This will DELETE every evaluation in the family library for ALL kids.\n\n' +
                 'Every previously-checked book will be re-evaluated from scratch the next time ' +
                 'anyone searches for it.\n\nAre you sure?')) return;
    var typed = prompt('Type WIPE to confirm:');
    if (typed !== 'WIPE') {
      if (statusEl) statusEl.textContent = 'Reset cancelled.';
      return;
    }
    if (statusEl) statusEl.textContent = 'Wiping family library…';
    _fetchJson(VPS + '/api/media/library', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'WIPE_FAMILY_LIBRARY' })
    })
      .then(function(r) {
        _familyLibrary = {};
        if (statusEl) statusEl.textContent = 'Wiped ' + r.cleared + ' entries. Library reset.';
        _refreshStaleCount();
        // Clear the displayed library list too
        var listEl = document.getElementById('bmc-library-list');
        if (listEl) listEl.innerHTML = '<div class="bmc-empty">Library is empty. Check a book to get started.</div>';
      })
      .catch(function(err) {
        if (statusEl) statusEl.textContent = 'Reset failed: ' + err.message;
      });
  }

  function reviewWithNewCriteria() {
    if (!_requestParentMode()) return;
    if (!confirm('Re-review all stale entries? This can take several minutes.')) return;
    var statusEl = document.getElementById('bmc-reeval-status');
    if (statusEl) statusEl.textContent = 'Starting…';
    _fetchJson(VPS + '/api/media/reevaluate-stale', { method: 'POST' })
      .then(function(r) {
        if (statusEl) {
          statusEl.textContent = 'Re-reviewing ' + r.count + ' books in the background. '
            + 'Refresh in a few minutes.';
        }
      })
      .catch(function(err) {
        if (statusEl) statusEl.textContent = 'Failed to start: ' + (err && err.message ? err.message : 'unknown');
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
    unlockParent: unlockParent,
    reviewWithNewCriteria: reviewWithNewCriteria,
    rereviewCurrent: rereviewCurrent,
    rereviewMyShelf: rereviewMyShelf,
    rereviewFamilyLibrary: rereviewFamilyLibrary,
    clearMySearches: clearMySearches,
    resetFamilyLibrary: resetFamilyLibrary
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  BMC.init();
});
