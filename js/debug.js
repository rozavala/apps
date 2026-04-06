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
  // This browser injects code that calls these globals. If not defined, 
  // it throws ReferenceErrors that can break the UI.
  if (typeof window._callback_receiveMIDIMessage === 'undefined') {
    window._callback_receiveMIDIMessage = function() {};
  }
  if (typeof window._callback_addSource === 'undefined') {
    window._callback_addSource = function() {};
  }
  if (typeof window._callback_addDestination === 'undefined') {
    window._callback_addDestination = function() {};
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
      controls.style.cssText = 'margin-bottom:15px;display:flex;gap:10px;flex-wrap:wrap;';
      controls.innerHTML = 
        '<button onclick="Debug.clear();Debug.render();" style="background:#ef444433;color:#ef4444;border:1px solid #ef444455;padding:4px 12px;border-radius:4px;font-size:12px;">Clear Local Logs</button>' +
        '<button onclick="Debug.pushToServer().then(function(){alert(\'Logs pushed! Check /api/kids/debug/logs_\' + Debug.getDeviceId())})" style="background:#3b82f633;color:#3b82f6;border:1px solid #3b82f655;padding:4px 12px;border-radius:4px;font-size:12px;">⬆️ Push to Cloud</button>' +
        '<button onclick="Debug.showStorageReport()" style="background:#10b98133;color:#10b981;border:1px solid #10b98155;padding:4px 12px;border-radius:4px;font-size:12px;">📊 Storage Report</button>';
      
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

  function _deleteKey(key) {
    if (!key) return;
    if (typeof Debug !== 'undefined') Debug.log('[Debug] Deleting key: ' + key);
    try {
      localStorage.removeItem(key);
      showStorageReport();
    } catch (e) {
      if (typeof Debug !== 'undefined') Debug.error('[Debug] Delete failed', e.message);
    }
  }

  function showStorageReport() {
    var list = document.getElementById('debug-log-list');
    if (!list) return;
    
    var items = [];
    var total = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      var val = localStorage.getItem(key);
      var size = val.length * 2;
      total += size;
      items.push({ key: key, size: size });
    }
    
    items.sort(function(a, b) { return b.size - a.size; });
    
    var html = '<div style="background:#1a1a2e; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #3b82f655;">' +
      '<h3 style="margin-top:0">📊 Storage Manager</h3>' +
      '<p style="font-size:12px; color:#aaa;">Total Usage: ' + (total / (1024 * 1024)).toFixed(2) + ' MB / 5.00 MB</p>' +
      '<button onclick="Debug.render()" style="background:#333; color:#fff; border:none; padding:4px 10px; border-radius:4px; font-size:11px;">Back to Logs</button>' +
      '<div style="margin-top:15px; display:flex; flex-direction:column; gap:8px;">';
    
    items.forEach(function(item) {
      var mb = (item.size / (1024 * 1024)).toFixed(2);
      var color = item.size > 1000000 ? '#ef4444' : (item.size > 100000 ? '#f59e0b' : '#34d399');
      html += '<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:rgba(255,255,255,0.03); border-radius:4px; font-size:12px;">' +
        '<div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; margin-right:10px;">' +
          '<b style="color:' + color + '">' + mb + ' MB</b> - ' + item.key +
        '</div>' +
        '<button onclick="Debug.deleteKey(\'' + item.key + '\')" ' +
        'style="background:#ef444433; color:#ef4444; border:1px solid #ef444455; padding:2px 8px; border-radius:4px; cursor:pointer;">Delete</button>' +
      '</div>';
    });
    
    html += '</div></div>';
    list.innerHTML = html;
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
    showStorageReport: showStorageReport,
    deleteKey: _deleteKey,
    clear: function() { logs = []; },
    render: render,
    getLogs: function() { return logs; },
    pushToServer: pushToServer,
    getDeviceId: _getDeviceId
  };
})();
