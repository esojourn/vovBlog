// Service Worker 文件
// 这是一个最小的 Service Worker，用于支持 PWA 功能

const CACHE_NAME = 'vovblog-v1';

// 安装事件
self.addEventListener('install', (_event) => {
  console.log('Service Worker 已安装');
  self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker 已激活');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch 事件处理
self.addEventListener('fetch', (event) => {
  // 仅处理 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // 不缓存 API 请求
        if (event.request.url.includes('/api/')) {
          return response;
        }

        // 缓存成功的响应
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      });
    })
  );
});
