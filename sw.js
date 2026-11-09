/* PWA：缓存应用外壳 + 全部脚本/样式，支持离线打开 */
const CACHE = 'perler-bead-v17';
const SCRIPTS = [
  'src/util.js', 'src/perf.js', 'src/history.js', 'src/viewport.js', 'src/state.js',
  'src/dom.js', 'src/palette.js', 'src/color.js', 'src/image.js', 'src/quantize.js',
  'src/outline.js', 'src/region.js', 'src/pipeline.js', 'src/legend.js', 'src/renderer.js', 'src/editor.js',
  'src/tools.js', 'src/exporter.js', 'src/source-ops.js', 'src/sheet.js', 'src/suggest.js', 'src/compare.js', 'src/panels.js',
  'src/app.js'
];
const STYLES = ['styles/base.css', 'styles/components.css', 'styles/layout-mobile.css'];
const ASSETS = [
  './',
  './index.html',
  './palettes.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
].concat(SCRIPTS.map(s => './' + s)).concat(STYLES.map(s => './' + s));

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 只处理同源请求；CDN（智能去背景模型等）直接走网络
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
