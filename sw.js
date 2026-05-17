const CACHE_NAME = "miaoli-price-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];

// 安裝並快取資源
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 清除舊快取
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 攔截請求並優先從快取載入，若無快取則發送網路請求
self.addEventListener("fetch", (e) => {
  // 只攔截 GET 請求與同源/快取內資源
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        // 如果請求成功且同源，動態加入快取
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // 離線且無快取時的防呆處理
        return new Response("離線狀態且無快取資源");
      });
    })
  );
});
