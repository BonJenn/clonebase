// Minimal sandbox page rendered inside an iframe for previewing generated templates.
// Receives transpiled code via postMessage, evaluates it, and renders the component.
// SDK hooks are shimmed with in-memory implementations.

export default function SandboxPreviewPage() {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@4/index.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/react@19/umd/react.production.min.js" crossOrigin="anonymous" />
        <script src="https://cdn.jsdelivr.net/npm/react-dom@19/umd/react-dom.production.min.js" crossOrigin="anonymous" />
      </head>
      <body>
        <div id="root" />
        <script dangerouslySetInnerHTML={{ __html: SANDBOX_SCRIPT }} />
      </body>
    </html>
  );
}

const SANDBOX_SCRIPT = `
// --- SDK Shims (in-memory) ---
const dataStore = {};

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
      const [data, setData] = React.useState(getCollection(collectionName));
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState(null);

      return {
        data: data,
        loading: loading,
        error: error,
        insert: async function(item) {
          const newItem = { ...item, id: 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2) };
          const col = getCollection(collectionName);
          col.unshift(newItem);
          setData([...col]);
          return newItem;
        },
        update: async function(id, changes) {
          const col = getCollection(collectionName);
          const idx = col.findIndex(function(i) { return i.id === id; });
          if (idx === -1) return null;
          col[idx] = { ...col[idx], ...changes };
          setData([...col]);
          return col[idx];
        },
        remove: async function(id) {
          const col = getCollection(collectionName);
          const idx = col.findIndex(function(i) { return i.id === id; });
          if (idx === -1) return false;
          col.splice(idx, 1);
          setData([...col]);
          return true;
        },
        refresh: async function() {},
      };
    },
  },
  useIntegration: {
    useIntegration: function(service) {
      return {
        call: async function() { return { ok: true, data: { message: 'Mock response from ' + service } }; },
        loading: false,
        error: null,
      };
    },
  },
};

// --- Renderer ---
let root = null;

function renderComponent(code, componentName) {
  try {
    // Create a module scope
    const module = { exports: {} };
    const fn = new Function('React', 'module', 'exports', code);
    fn(React, module, module.exports);

    // Find the exported component
    let Component = null;
    if (module.exports[componentName]) {
      Component = module.exports[componentName];
    } else {
      // Find any exported function
      for (const key in module.exports) {
        if (typeof module.exports[key] === 'function' && key !== 'default') {
          Component = module.exports[key];
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

// Listen for code from parent
window.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'render') {
    // Clear data store between renders
    for (const key in dataStore) delete dataStore[key];
    renderComponent(event.data.code, event.data.componentName || 'Page');
  }
});

window.parent.postMessage({ type: 'sandbox-ready' }, '*');
`;
