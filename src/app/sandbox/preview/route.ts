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
  <!-- html2canvas-pro: fork of html2canvas with modern CSS support (oklch, color-mix, etc.)
       Tailwind 4+ uses oklch() color values which the original html2canvas chokes on. -->
  <script src="https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.8/dist/html2canvas-pro.min.js" crossorigin="anonymous"></script>
  <!-- ApexCharts for beautiful line/bar/pie/donut/area/etc. charts in generated apps. -->
  <script src="https://cdn.jsdelivr.net/npm/apexcharts@3.53.0/dist/apexcharts.min.js" crossorigin="anonymous"></script>
  <style>
    body { margin: 0; }
    /* Edit mode visual affordances — only active when body.edit-mode is set */
    body.edit-mode [data-edit-id] {
      cursor: pointer;
      outline-offset: 2px;
      transition: outline-color 0.1s ease;
    }
    body.edit-mode [data-edit-id]:hover {
      outline: 2px dashed rgb(99, 102, 241);
    }
    body.edit-mode [data-edit-id][contenteditable="true"] {
      outline: 2px solid rgb(99, 102, 241) !important;
      background: rgba(99, 102, 241, 0.05);
      cursor: text;
    }
    body.edit-mode [data-edit-id].clonebase-selected {
      outline: 2px solid rgb(236, 72, 153) !important;
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <input type="file" id="clonebase-image-input" accept="image/*" style="display:none" />
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
        // Push the new snapshot to the parent Data panel immediately so it
        // doesn't have to wait for the 1s polling interval.
        sendDataSnapshot();
        return Promise.resolve(newItem);
      },
      update: function(id, changes) {
        var idx = col.findIndex(function(i) { return i.id === id; });
        if (idx === -1) return Promise.resolve(null);
        col[idx] = Object.assign({}, col[idx], changes);
        setData(col.slice());
        sendDataSnapshot();
        return Promise.resolve(col[idx]);
      },
      remove: function(id) {
        var idx = col.findIndex(function(i) { return i.id === id; });
        if (idx === -1) return Promise.resolve(false);
        col.splice(idx, 1);
        setData(col.slice());
        sendDataSnapshot();
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

  // Chart component — wraps ApexCharts (loaded from CDN above) in a React
  // component with sensible defaults matching the design system lock.
  // API mirrors src/sdk/chart.tsx so generated code works identically in
  // the preview iframe and in production.
  Chart: function(props) {
    var containerRef = React.useRef(null);
    var chartRef = React.useRef(null);
    var serializedProps = JSON.stringify({
      type: props.type,
      series: props.series,
      categories: props.categories,
      labels: props.labels,
      height: props.height,
      colors: props.colors,
      title: props.title,
      stacked: props.stacked,
      curve: props.curve,
      horizontal: props.horizontal,
      options: props.options,
    });

    React.useEffect(function() {
      if (!containerRef.current) return;
      var cancelled = false;
      var interval = null;

      function buildConfig() {
        var type = props.type;
        var height = props.height || 300;
        var curve = props.curve || 'smooth';
        var isPie = type === 'pie' || type === 'donut' || type === 'radialBar' || type === 'polarArea';
        var defaults = {
          chart: {
            type: type,
            height: height,
            stacked: !!props.stacked,
            fontFamily: 'inherit',
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: { enabled: true, speed: 400 },
            background: 'transparent',
          },
          series: props.series,
          colors: props.colors || ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'],
          grid: {
            borderColor: '#E5E7EB',
            strokeDashArray: 3,
            padding: { top: 0, right: 0, bottom: 0, left: 8 },
          },
          stroke: {
            curve: curve,
            width: type === 'line' ? 2.5 : type === 'area' ? 2 : 0,
          },
          dataLabels: { enabled: false },
          legend: {
            position: isPie ? 'bottom' : 'top',
            horizontalAlign: 'left',
            fontFamily: 'inherit',
            fontSize: '12px',
            markers: { size: 6 },
            itemMargin: { horizontal: 8, vertical: 4 },
          },
          tooltip: {
            theme: 'light',
            style: { fontFamily: 'inherit', fontSize: '12px' },
          },
          plotOptions: props.horizontal
            ? { bar: { horizontal: true, borderRadius: 4 } }
            : { bar: { borderRadius: 4, columnWidth: '60%' } },
        };
        if (type === 'area') {
          defaults.fill = { type: 'gradient', gradient: { shadeIntensity: 0.4, opacityFrom: 0.5, opacityTo: 0.05 } };
        }
        if (props.categories) {
          defaults.xaxis = {
            categories: props.categories,
            labels: { style: { colors: '#6B7280', fontSize: '11px', fontFamily: 'inherit' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
          };
        }
        defaults.yaxis = {
          labels: { style: { colors: '#6B7280', fontSize: '11px', fontFamily: 'inherit' } },
        };
        if (props.labels) defaults.labels = props.labels;
        if (props.title) defaults.title = { text: props.title, style: { fontFamily: 'inherit', fontSize: '14px', fontWeight: 500 } };
        // Shallow merge passthrough options
        if (props.options) {
          for (var k in props.options) defaults[k] = props.options[k];
        }
        return defaults;
      }

      function init() {
        if (cancelled) return;
        if (!window.ApexCharts) {
          // CDN still loading — poll briefly
          interval = setInterval(function() {
            if (cancelled) return;
            if (window.ApexCharts) {
              clearInterval(interval);
              interval = null;
              init();
            }
          }, 100);
          return;
        }
        try {
          if (chartRef.current) {
            chartRef.current.destroy();
            chartRef.current = null;
          }
          if (!containerRef.current) return;
          var chart = new window.ApexCharts(containerRef.current, buildConfig());
          chart.render();
          chartRef.current = chart;
        } catch (err) {
          console.error('[sandbox chart] render failed', err);
        }
      }

      init();

      return function() {
        cancelled = true;
        if (interval) clearInterval(interval);
        if (chartRef.current) {
          try { chartRef.current.destroy(); } catch (e) {}
          chartRef.current = null;
        }
      };
    }, [serializedProps]);

    return React.createElement('div', { ref: containerRef, className: 'w-full' });
  },

  // useTenantAuth hook (mock — persists across re-renders)
  useTenantAuth: function() {
    // Persist auth state and accounts across code re-renders
    if (!window.__authAccounts) window.__authAccounts = {};
    if (!window.__authCurrentUser) window.__authCurrentUser = null;

    var _userState = React.useState(window.__authCurrentUser);
    var user = _userState[0];
    var setUser = _userState[1];
    var _errorState = React.useState(null);
    var error = _errorState[0];
    var setError = _errorState[1];

    return {
      user: user,
      loading: false,
      error: error,
      signUp: function(email, password, metadata) {
        setError(null);
        if (window.__authAccounts[email]) {
          setError('An account with this email already exists.');
          return Promise.resolve(false);
        }
        // Consistent user ID based on email so data persists across sign-ins
        var userId = 'user-' + email.replace(/[^a-z0-9]/gi, '-');
        var newUser = { id: userId, email: email, user_metadata: metadata || { name: email.split('@')[0] } };
        window.__authAccounts[email] = { user: newUser, password: password };
        window.__authCurrentUser = newUser;
        setUser(newUser);
        return Promise.resolve(true);
      },
      signIn: function(email, password) {
        setError(null);
        var account = window.__authAccounts[email];
        if (!account) {
          setError('No account found with this email. Please sign up first.');
          return Promise.resolve(false);
        }
        if (account.password !== password) {
          setError('Incorrect password.');
          return Promise.resolve(false);
        }
        window.__authCurrentUser = account.user;
        setUser(account.user);
        return Promise.resolve(true);
      },
      signOut: function() {
        window.__authCurrentUser = null;
        setUser(null);
        setError(null);
        return Promise.resolve();
      },
      resetPassword: function() {
        setError(null);
        return Promise.resolve(true);
      },
      updatePassword: function(newPassword) {
        var currentUser = window.__authCurrentUser;
        if (!currentUser) { setError('Not signed in.'); return Promise.resolve(false); }
        var account = window.__authAccounts[currentUser.email];
        if (account) account.password = newPassword;
        setError(null);
        return Promise.resolve(true);
      },
      updateProfile: function(metadata) {
        var currentUser = window.__authCurrentUser;
        if (!currentUser) { setError('Not signed in.'); return Promise.resolve(false); }
        currentUser.user_metadata = Object.assign({}, currentUser.user_metadata || {}, metadata);
        window.__authCurrentUser = currentUser;
        setUser(Object.assign({}, currentUser));
        setError(null);
        return Promise.resolve(true);
      },
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

// --- Edit Mode ---
var editMode = false;
var pendingImageEditId = null;

function setEditMode(enabled) {
  editMode = !!enabled;
  if (editMode) {
    document.body.classList.add('edit-mode');
  } else {
    document.body.classList.remove('edit-mode');
    // Clear any pending edits or selections
    var editing = document.querySelector('[contenteditable="true"][data-edit-id]');
    if (editing) editing.removeAttribute('contenteditable');
    var selected = document.querySelector('[data-edit-id].clonebase-selected');
    if (selected) selected.classList.remove('clonebase-selected');
  }
}

function findEditableAncestor(el) {
  while (el && el !== document.body) {
    if (el.getAttribute && el.getAttribute('data-edit-id')) return el;
    el = el.parentNode;
  }
  return null;
}

// Click handler runs in CAPTURE phase so it intercepts before app onClick handlers fire
document.addEventListener('click', function(e) {
  if (!editMode) return;
  var target = findEditableAncestor(e.target);
  if (!target) return;

  // Shift+click → click-to-prompt selection (any element)
  if (e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    // Clear previous selection
    var prev = document.querySelector('[data-edit-id].clonebase-selected');
    if (prev) prev.classList.remove('clonebase-selected');
    target.classList.add('clonebase-selected');
    var editId = target.getAttribute('data-edit-id');
    var tag = target.tagName.toLowerCase();
    var text = (target.textContent || '').trim().slice(0, 60);
    window.parent.postMessage({
      type: 'element-selected',
      editId: editId,
      tag: tag,
      text: text,
    }, '*');
    return;
  }

  // Image swap
  if (target.tagName === 'IMG') {
    e.preventDefault();
    e.stopPropagation();
    pendingImageEditId = target.getAttribute('data-edit-id');
    var input = document.getElementById('clonebase-image-input');
    input.value = '';
    input.click();
    return;
  }

  // Text edit — only for text-only elements
  // Skip if the element has child elements (other than just text nodes)
  var hasOnlyText = true;
  for (var i = 0; i < target.childNodes.length; i++) {
    if (target.childNodes[i].nodeType !== Node.TEXT_NODE) {
      hasOnlyText = false;
      break;
    }
  }
  if (!hasOnlyText) {
    // Element has child elements — treat as click-to-prompt selection instead
    e.preventDefault();
    e.stopPropagation();
    var prevSel = document.querySelector('[data-edit-id].clonebase-selected');
    if (prevSel) prevSel.classList.remove('clonebase-selected');
    target.classList.add('clonebase-selected');
    window.parent.postMessage({
      type: 'element-selected',
      editId: target.getAttribute('data-edit-id'),
      tag: target.tagName.toLowerCase(),
      text: (target.textContent || '').trim().slice(0, 60),
    }, '*');
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  var origText = target.textContent;
  target.setAttribute('contenteditable', 'true');
  target.dataset.clonebaseOrigText = origText;
  target.focus();
  // Select all text in the element
  var range = document.createRange();
  range.selectNodeContents(target);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}, true);

// Commit text edits on blur
document.addEventListener('blur', function(e) {
  if (!editMode) return;
  var target = e.target;
  if (!target || !target.getAttribute || target.getAttribute('contenteditable') !== 'true') return;
  if (!target.getAttribute('data-edit-id')) return;

  target.removeAttribute('contenteditable');
  var newText = target.textContent;
  var origText = target.dataset.clonebaseOrigText || '';
  delete target.dataset.clonebaseOrigText;

  if (newText !== origText) {
    window.parent.postMessage({
      type: 'element-edited',
      kind: 'text',
      editId: target.getAttribute('data-edit-id'),
      oldValue: origText,
      newValue: newText,
    }, '*');
  }
}, true);

// Prevent Enter from inserting newlines in editable text — commit instead
document.addEventListener('keydown', function(e) {
  if (!editMode) return;
  var target = e.target;
  if (!target || !target.getAttribute || target.getAttribute('contenteditable') !== 'true') return;
  if (e.key === 'Enter') {
    e.preventDefault();
    target.blur();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    // Revert
    target.textContent = target.dataset.clonebaseOrigText || target.textContent;
    target.blur();
  }
}, true);

// Image input change handler
document.getElementById('clonebase-image-input').addEventListener('change', function(e) {
  var file = e.target.files && e.target.files[0];
  if (!file || !pendingImageEditId) return;
  var editId = pendingImageEditId;
  pendingImageEditId = null;
  // Pass the File via postMessage — modern browsers support structured cloning Files
  window.parent.postMessage({
    type: 'element-edited',
    kind: 'image',
    editId: editId,
    file: file,
  }, '*');
});

// --- Screenshot capture via html2canvas ---
// Used by the publish flow to generate a preview thumbnail stored as preview_url
// on the template. Runs inside the sandboxed iframe so we have direct DOM access.
//
// CRITICAL: this iframe is sandbox="allow-scripts" with NO allow-same-origin,
// which means it's a null-origin context. Any image without CORS headers will
// taint the canvas, and toDataURL() will throw SecurityError.
//
// Strategy: use allowTaint: false + useCORS: true. html2canvas will attempt
// CORS fetches for every image, and silently skip (blank placeholder) any that
// fail. The canvas stays clean and toDataURL succeeds. Screenshots may show
// blank areas where non-CORS images would be, but at least we get SOMETHING.
function captureScreenshot(requestId) {
  function respond(payload) {
    window.parent.postMessage(
      Object.assign({ type: 'capture-result', requestId: requestId }, payload),
      '*'
    );
  }

  if (typeof html2canvas !== 'function') {
    console.error('[clonebase] html2canvas not loaded — CDN blocked or slow?');
    respond({ error: 'html2canvas library not loaded' });
    return;
  }

  // Disable edit-mode visual affordances during capture so outlines/hover rings
  // don't appear in the screenshot.
  var wasEditMode = document.body.classList.contains('edit-mode');
  if (wasEditMode) document.body.classList.remove('edit-mode');

  // Preemptively convert any <img> elements to blank placeholders if they
  // haven't loaded with CORS — prevents taint. html2canvas will redraw from
  // the cleaned DOM.
  var scrollW = Math.min(document.documentElement.scrollWidth || 1280, 1600);
  var scrollH = Math.min(document.documentElement.scrollHeight || 800, 1200);

  html2canvas(document.body, {
    backgroundColor: '#ffffff',
    scale: 1,
    logging: false,
    useCORS: true,
    allowTaint: false, // keep canvas clean so toDataURL works
    imageTimeout: 3000,
    width: scrollW,
    height: scrollH,
    windowWidth: scrollW,
    windowHeight: scrollH,
    // Ignore the floating file input we use for image editing
    ignoreElements: function(el) {
      return el && el.id === 'clonebase-image-input';
    },
  }).then(function(canvas) {
    if (wasEditMode) document.body.classList.add('edit-mode');
    try {
      // Downscale huge canvases before encoding — previews don't need to be 1600px wide
      var MAX_W = 1280;
      var finalCanvas = canvas;
      if (canvas.width > MAX_W) {
        var ratio = MAX_W / canvas.width;
        var scaled = document.createElement('canvas');
        scaled.width = MAX_W;
        scaled.height = Math.round(canvas.height * ratio);
        var ctx = scaled.getContext('2d');
        ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
        finalCanvas = scaled;
      }
      var dataUrl = finalCanvas.toDataURL('image/png');
      console.log('[clonebase] capture ok', finalCanvas.width + 'x' + finalCanvas.height, Math.round(dataUrl.length / 1024) + 'KB');
      respond({ dataUrl: dataUrl, width: finalCanvas.width, height: finalCanvas.height });
    } catch (err) {
      console.error('[clonebase] toDataURL failed — canvas tainted by cross-origin content', err);
      respond({ error: 'toDataURL failed (likely cross-origin image taint): ' + err.message });
    }
  }).catch(function(err) {
    if (wasEditMode) document.body.classList.add('edit-mode');
    var msg = err && err.message ? err.message : String(err);
    var stack = err && err.stack ? String(err.stack) : '';
    // Full error dump — shows up in the creator's console with all the detail
    console.error('[clonebase] html2canvas threw', { message: msg, stack: stack, error: err });
    respond({ error: 'html2canvas failed: ' + msg, stack: stack });
  });
}

window.addEventListener('message', function(event) {
  if (!event.data || !event.data.type) return;

  switch (event.data.type) {
    case 'render':
      renderComponent(event.data.code, event.data.componentName || 'Page');
      break;

    case 'set-edit-mode':
      setEditMode(event.data.enabled);
      break;

    case 'request-data':
      sendDataSnapshot();
      break;

    case 'capture':
      captureScreenshot(event.data.requestId);
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
