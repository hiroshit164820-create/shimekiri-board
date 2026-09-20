/* 会社業務のしめきりボード：ホーム画面用の受け口
 *
 * 取りかたは「ネットが先、駄目ならキャッシュ」。
 * キャッシュを先に見ると、こちらが進捗を更新しても相手の画面が古いまま止まる。
 * 圏外や機内モードのときだけ、最後に見た内容を出す。
 */
var CACHE = 'shimekiri-1bdcb1d8b4ed';
var ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-192-mask.png', 'icons/icon-512-mask.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return c.addAll(ASSETS);
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){
      return k === CACHE ? null : caches.delete(k);
    }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   /* フォントなどは触らない */
  e.respondWith(
    fetch(req).then(function(res){
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || caches.match('index.html');
      });
    })
  );
});
