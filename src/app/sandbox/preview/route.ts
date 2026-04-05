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
// --- SDK Shims (in-memory) ---
var dataStore = {};

function getCollection(name) {
  if (!dataStore[name]) dataStore[name] = [];
  return dataStore[name];
}

window.__SDK__ = {
  tenantContext: {
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
  },
  useTenantData: {
    useTenantData: function(collectionName) {
      var _React = React;
      var _useState = _React.useState;
      var col = getCollection(collectionName);
      var _state = _useState(col.slice());
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
  },
  useIntegration: {
    useIntegration: function(service) {
      return {
        call: function() { return Promise.resolve({ ok: true, data: { message: 'Mock response from ' + service } }); },
        loading: false,
        error: null,
      };
    },
  },
};

// --- Renderer ---
var root = null;

function renderComponent(code, componentName) {
  try {
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

window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'render') {
    for (var key in dataStore) delete dataStore[key];
    renderComponent(event.data.code, event.data.componentName || 'Page');
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
