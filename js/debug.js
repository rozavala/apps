/* ================================================================
   DEBUG SYSTEM — Persistent Error & Event Logging
   Captures global errors and pushes to server for remote viewing.
   ================================================================ */

var Debug = (function() {
  'use strict';

  var logs = [];
  var MAX_LOGS = 100;
  var SYNC_SERVER = 'https://real-options-dev.tail57521e.ts.net';

  // ── Device Identification ──
  function _getDeviceId() {
    var id = localStorage.getItem('zs_debug_device_id');
    if (!id) {
      var platform = (navigator.userAgent.indexOf('iPad') !== -1) ? 'iPad' :
                     (navigator.userAgent.indexOf('iPhone') !== -1) ? 'iPhone' :
                     (navigator.userAgent.indexOf('Firefox') !== -1) ? 'Firefox' : 'Mobile';
      id = platform + '_' + Math.random().toString(36).substring(2, 7);
      localStorage.setItem('zs_debug_device_id', id);
    }
    return id;
  }

  function _add(type, msg, meta) {
    var entry = {
      ts: new Date().toISOString(),
      type: type,
      msg: msg,
      meta: meta || '',
      device: _getDeviceId(),
      ua: navigator.userAgent
    };
    logs.unshift(entry);
    if (logs.length > MAX_LOGS) logs.pop();
    
    if (console && console.log) {
      var color = type === 'error' ? 'color:#ef4444' : 'color:#3b82f6';
      console.log('%c[Debug ' + type + '] ' + msg, color, meta || '');
    }

    // Auto-push errors
    if (type === 'error') {
      setTimeout(function() { pushToServer(); }, 1000);
    }
  }

  function pushToServer() {
    if (!SYNC_SERVER || SYNC_SERVER.indexOf('x.x.x') !== -1) return Promise.resolve();
    
    var deviceId = _getDeviceId();
    var payload = {
      _isList: true,
      _items: logs,
      _syncedAt: Date.now()
    };

    return fetch(SYNC_SERVER + '/api/kids/debug/logs_' + deviceId, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function(e) { console.warn('[Debug] Cloud push failed'); });
  }

  // Catch global JS errors
  window.onerror = function(msg, url, line, col, error) {
    var filename = url ? url.split('/').pop() : 'unknown';
    _add('error', msg, filename + ':' + line + ':' + col);
    return false;
  };

  // Catch Promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    _add('error', 'Unhandled Promise: ' + event.reason);
  });

  // ── iPad WebMIDIBrowser Shield ──
  // This browser injects code that calls this global. If not defined, 
  // it throws ReferenceErrors that can break the UI.
  if (typeof window._callback_receiveMIDIMessage === 'undefined') {
    window._callback_receiveMIDIMessage = function() {};
  }

  function show() {
    var overlay = document.getElementById('debug-log-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'debug-log-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(11,11,26,0.98);z-index:10000;padding:20px;color:#fff;font-family:monospace;overflow-y:auto;';
      
      var header = document.createElement('div');
      header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid #333;padding-bottom:10px;';
      header.innerHTML = '<h2 style="margin:0">🛠 Debug Log (' + _getDeviceId() + ')</h2><button onclick="Debug.hide()" style="background:#333;color:#fff;border:none;padding:8px 16px;border-radius:8px;">Close</button>';
      
      var controls = document.createElement('div');
      controls.style.cssText = 'margin-bottom:15px;display:flex;gap:10px;';
      controls.innerHTML = 
        '<button onclick="Debug.clear();Debug.render();" style="background:#ef444433;color:#ef4444;border:1px solid #ef444455;padding:4px 12px;border-radius:4px;font-size:12px;">Clear Local</button>' +
        '<button onclick="Debug.pushToServer().then(function(){alert(\'Logs pushed! Check /api/kids/debug/logs_' + _getDeviceId() + '\')})" style="background:#3b82f633;color:#3b82f6;border:1px solid #3b82f655;padding:4px 12px;border-radius:4px;font-size:12px;">⬆️ Push to Cloud</button>';
      
      var list = document.createElement('div');
      list.id = 'debug-log-list';
      
      overlay.appendChild(header);
      overlay.appendChild(controls);
      overlay.appendChild(list);
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'block';
    render();
  }

  function hide() {
    var overlay = document.getElementById('debug-log-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function render() {
    var list = document.getElementById('debug-log-list');
    if (!list) return;
    
    if (logs.length === 0) {
      list.innerHTML = '<p style="color:#666">No logs yet.</p>';
      return;
    }

    list.innerHTML = logs.map(function(l) {
      var color = l.type === 'error' ? '#ef4444' : '#3b82f6';
      var time = l.ts.split('T')[1].split('.')[0]; // HH:MM:SS
      return '<div style="margin-bottom:12px;padding:8px;background:rgba(255,255,255,0.03);border-radius:4px;border-left:3px solid ' + color + '">' +
        '<div style="font-size:10px;color:#666;margin-bottom:4px;">[' + time + '] ' + l.type.toUpperCase() + '</div>' +
        '<div style="font-size:13px;word-break:break-all;">' + l.msg + '</div>' +
        (l.meta ? '<div style="font-size:11px;color:#888;margin-top:4px;">' + l.meta + '</div>' : '') +
      '</div>';
    }).join('');
  }

  return {
    log: function(msg, meta) { _add('info', msg, meta); },
    error: function(msg, meta) { _add('error', msg, meta); },
    show: show,
    hide: hide,
    clear: function() { logs = []; },
    render: render,
    getLogs: function() { return logs; },
    pushToServer: pushToServer,
    getDeviceId: _getDeviceId
  };
})();
