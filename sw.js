/* Service worker mínimo. Existe por dos razones:
   1. sin él el navegador no ofrece instalar la app, y sin instalarla TikTok no la enseña al compartir;
   2. de paso da modo sin conexión.
   Estrategia: red primero y caché de reserva. Al revés (caché primero) se quedaría servida una versión
   vieja de app.js después de cada despliegue. */
const CACHE='guardias-v1';
const BASE=['./','./index.html','./app.js','./styles.css','./icon.svg','./manifest.json'];

self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(BASE).catch(function(){});}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){return k===CACHE?null:caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});

self.addEventListener('fetch',function(e){
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;   /* nada de tocar peticiones a otros sitios */
  e.respondWith(
    fetch(req).then(function(res){
      if(res&&res.ok){const copia=res.clone();caches.open(CACHE).then(function(c){c.put(req,copia).catch(function(){});});}
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        if(hit)return hit;
        /* una navegación a /index.html?title=… no está en caché con esa query: se sirve la portada */
        if(req.mode==='navigate')return caches.match('./index.html');
        return Promise.reject(new Error('sin red y sin copia'));
      });
    })
  );
});
