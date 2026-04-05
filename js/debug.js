/* ================================================================
   DEBUG SYSTEM — Persistent Error & Event Logging
   Captures global errors and unhandled rejections for mobile debugging.
   ================================================================ */

var Debug = (function() {
  'use strict';

  var logs = [];
  var MAX_LOGS = 100;

  function _add(type, msg, meta) {
    var entry = {
      ts: new Date().toLocaleTimeString(),
      type: type,
      msg: msg,
      meta: meta || ''
    };
    logs.unshift(entry);
    if (logs.length > MAX_LOGS) logs.pop();
    
    // Also print to real console
    if (console && console.log) {
      var color = type === 'error' ? 'color:#ef4444' : 'color:#3b82f6';
      console.log('%c[Debug ' + type + '] ' + msg, color, meta || '');
    }
  }

  // Catch global JS errors
  window.onerror = function(msg, url, line, col, error) {
    var filename = url ? url.split('/').pop() : 'unknown';
    _add('error', msg, filename + ':' + line + ':' + col);
    return false; // Let browser still handle it
  };

  // Catch Promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    _add('error', 'Unhandled Promise: ' + event.reason);
  });

  function getLogs() { return logs; }

  function clear() { logs = []; }

  function show() {
    var overlay = document.getElementById('debug-log-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'debug-log-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(11,11,26,0.98);z-index:10000;padding:20px;color:#fff;font-family:monospace;overflow-y:auto;';
      
      var header = document.createElement('div');
      header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid #333;padding-bottom:10px;';
      header.innerHTML = '<h2 style="margin:0">🛠 Debug Log</h2><button onclick="Debug.hide()" style="background:#333;color:#fff;border:none;padding:8px 16px;border-radius:8px;">Close</button>';
      
      var controls = document.createElement('div');
      controls.style.cssText = 'margin-bottom:15px;display:flex;gap:10px;';
      controls.innerHTML = '<button onclick="Debug.clear();Debug.render();" style="background:#ef444433;color:#ef4444;border:1px solid #ef444455;padding:4px 12px;border-radius:4px;font-size:12px;">Clear All</button>';
      
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
      return '<div style="margin-bottom:12px;padding:8px;background:rgba(255,255,255,0.03);border-radius:4px;border-left:3px solid ' + color + '">' +
        '<div style="font-size:10px;color:#666;margin-bottom:4px;">[' + l.ts + '] ' + l.type.toUpperCase() + '</div>' +
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
    clear: clear,
    render: render,
    getLogs: getLogs
  };
})();
