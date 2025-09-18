const CACHE_NAME = 'time-check-buddy-v2-1-8';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg'
];

// 서비스 워커 설치
self.addEventListener('install', event => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Cached all files');
        // 새 서비스 워커가 즉시 활성화되도록 함
        return self.skipWaiting();
      })
      .catch(err => {
        console.log('Service Worker: Cache failed', err);
      })
  );
});

// 서비스 워커 활성화
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// 네트워크 요청 가로채기 (오프라인 지원)
self.addEventListener('fetch', event => {
  // HTML 요청만 처리 (CSS, JS는 인라인이므로)
  if (event.request.destination === 'document' || 
      event.request.url.includes('.html') || 
      event.request.url.endsWith('/')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            console.log('Service Worker: Serving from cache', event.request.url);
            return response;
          }
          
          console.log('Service Worker: Fetching from network', event.request.url);
          return fetch(event.request)
            .then(response => {
              // 네트워크 응답을 캐시에 저장
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // 네트워크 실패 시 캐시에서 index.html 제공
              console.log('Service Worker: Network failed, serving offline page');
              return caches.match('./index.html');
            });
        })
    );
  }
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync');
    // 필요시 데이터 동기화 로직 추가
  }
});

// 앱 업데이트 알림
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});