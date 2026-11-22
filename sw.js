// wiserest 서비스워커: 앱 파일을 저장해 두어 인터넷이 없어도 열리게 함
const C = 'wiserest-v2';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

// 예전 버전 캐시 정리
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // 구글 폰트: 한 번 받은 폰트는 저장해 두고 재사용 (오프라인에서도 글씨체 유지)
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const k = r.clone(); caches.open(C).then(c => c.put(e.request, k)); return r;
    })).catch(() => caches.match(e.request)));
    return;
  }

  // 그 밖의 다른 사이트(유튜브, AI 등)는 건드리지 않음
  if (url.origin !== self.location.origin) return;

  // 앱 파일: 인터넷 되면 최신 파일, 안 되면 저장해 둔 파일
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const k = r.clone(); caches.open(C).then(c => c.put(e.request, k)); }
    return r;
  }).catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html'))));
});
