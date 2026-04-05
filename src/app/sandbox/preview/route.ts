// Raw HTML route for the sandbox preview iframe.
// Returns a standalone HTML document (not wrapped by Next.js layout)
// with React 18 UMD, Tailwind CDN, and SDK shims.

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
  <style>body { margin: 0; }</style>
</head>
<body>
  <div id="root"></div>
  <script>
// --- SDK Shims (flat — each hook is a direct property on window.__SDK__) ---
var dataStore = {};

function getCollection(name) {
  if (!dataStore[name]) dataStore[name] = [];
  return dataStore[name];
}

window.__SDK__ = {
  // useTenant hook
  useTenant: function() {
    return {
      tenantId: 'preview-tenant-id',
      tenantSlug: 'preview',
      tenantName: 'Preview App',
      instanceId: 'preview-instance-id',
      templateSlug: 'preview',
      config: {},
    };
  },

  // useTenantData hook
  useTenantData: function(collectionName) {
    var col = getCollection(collectionName);
    var _state = React.useState(col.slice());
    var data = _state[0];
    var setData = _state[1];

    return {
      data: data,
      loading: false,
      error: null,
      insert: function(item) {
        var newItem = Object.assign({}, item, { id: 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2) });
        col.unshift(newItem);
        setData(col.slice());
        return Promise.resolve(newItem);
      },
      update: function(id, changes) {
        var idx = col.findIndex(function(i) { return i.id === id; });
        if (idx === -1) return Promise.resolve(null);
        col[idx] = Object.assign({}, col[idx], changes);
        setData(col.slice());
        return Promise.resolve(col[idx]);
      },
      remove: function(id) {
        var idx = col.findIndex(function(i) { return i.id === id; });
        if (idx === -1) return Promise.resolve(false);
        col.splice(idx, 1);
        setData(col.slice());
        return Promise.resolve(true);
      },
      refresh: function() { return Promise.resolve(); },
    };
  },

  // useIntegration hook
  useIntegration: function(service) {
    return {
      call: function() { return Promise.resolve({ ok: true, data: { message: 'Mock response from ' + service } }); },
      loading: false,
      error: null,
    };
  },

  // useFileUpload hook — reads file as data URL for preview
  useFileUpload: function() {
    var _state = React.useState(false);
    var uploading = _state[0];
    var setUploading = _state[1];

    return {
      upload: function(file) {
        setUploading(true);
        return new Promise(function(resolve) {
          var reader = new FileReader();
          reader.onload = function() {
            setUploading(false);
            resolve({
              url: reader.result,
              path: 'preview/' + file.name,
              filename: file.name,
            });
          };
          reader.onerror = function() {
            setUploading(false);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      },
      uploading: uploading,
      error: null,
    };
  },
};

// --- Renderer ---
var root = null;

function renderComponent(code, componentName) {
  try {
    // Save for re-renders after data mutations
    window.__lastCode = code;
    window.__lastComponent = componentName;

    var module = { exports: {} };
    var fn = new Function('React', 'module', 'exports', code);
    fn(React, module, module.exports);

    var Component = null;
    if (module.exports[componentName]) {
      Component = module.exports[componentName];
    } else {
      var keys = Object.keys(module.exports);
      for (var i = 0; i < keys.length; i++) {
        if (typeof module.exports[keys[i]] === 'function' && keys[i] !== 'default') {
          Component = module.exports[keys[i]];
          break;
        }
      }
      if (!Component && module.exports.default) {
        Component = module.exports.default;
      }
    }

    if (!Component) {
      throw new Error('No component found in generated code');
    }

    if (!root) {
      root = ReactDOM.createRoot(document.getElementById('root'));
    }

    root.render(React.createElement(Component, {
      tenantId: 'preview-tenant-id',
      instanceId: 'preview-instance-id',
    }));

    window.parent.postMessage({ type: 'preview-ready' }, '*');
  } catch (err) {
    window.parent.postMessage({ type: 'preview-error', error: err.message }, '*');
    document.getElementById('root').innerHTML =
      '<div style="padding:2rem;color:#dc2626;font-family:monospace;white-space:pre-wrap;">' +
      'Error: ' + err.message + '</div>';
  }
}

// Send data snapshot to parent
function sendDataSnapshot() {
  var snapshot = {};
  for (var key in dataStore) {
    snapshot[key] = dataStore[key].map(function(item) {
      return { id: item.id, collection: key, data: item, created_at: item.created_at || new Date().toISOString() };
    });
  }
  window.parent.postMessage({ type: 'data-snapshot', collections: snapshot }, '*');
}

window.addEventListener('message', function(event) {
  if (!event.data || !event.data.type) return;

  switch (event.data.type) {
    case 'render':
      renderComponent(event.data.code, event.data.componentName || 'Page');
      break;

    case 'request-data':
      sendDataSnapshot();
      break;

    case 'data-insert': {
      var col = getCollection(event.data.collection);
      var newItem = Object.assign({}, event.data.data, {
        id: 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        created_at: event.data.data.created_at || new Date().toISOString()
      });
      col.unshift(newItem);
      sendDataSnapshot();
      // Re-render to pick up new data
      if (root) root.render(React.createElement('div'));
      setTimeout(function() { renderComponent(window.__lastCode, window.__lastComponent); }, 50);
      break;
    }

    case 'data-update': {
      var uCol = getCollection(event.data.collection);
      var uIdx = uCol.findIndex(function(i) { return i.id === event.data.id; });
      if (uIdx !== -1) {
        uCol[uIdx] = Object.assign({}, event.data.data, { id: event.data.id });
      }
      sendDataSnapshot();
      if (root) root.render(React.createElement('div'));
      setTimeout(function() { renderComponent(window.__lastCode, window.__lastComponent); }, 50);
      break;
    }

    case 'data-delete': {
      var dCol = getCollection(event.data.collection);
      var dIdx = dCol.findIndex(function(i) { return i.id === event.data.id; });
      if (dIdx !== -1) dCol.splice(dIdx, 1);
      sendDataSnapshot();
      if (root) root.render(React.createElement('div'));
      setTimeout(function() { renderComponent(window.__lastCode, window.__lastComponent); }, 50);
      break;
    }
  }
});

window.parent.postMessage({ type: 'sandbox-ready' }, '*');
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
