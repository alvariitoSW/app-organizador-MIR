/* Service worker mínimo. Existe por dos razones:
   1. sin él el navegador no ofrece instalar la app, y sin instalarla TikTok no la enseña al compartir;
   2. de paso da modo sin conexión.
   Estrategia: red primero y caché de reserva. Al revés (caché primero) se quedaría servida una versión
   vieja de app.js después de cada despliegue. */
const CACHE='guardias-v2';
/* Absolutas y contra el ámbito del registro. En GitHub Pages la app no cuelga de la raíz sino de
   /app-organizador-MIR/, y una ruta relativa suelta no siempre cae donde uno cree. */
const RAIZ=new URL('./',self.registration?self.registration.scope:self.location.href);
const INDEX=new URL('index.html',RAIZ).href;
const BASE=['index.html','app.js','styles.css','icon.svg','manifest.json']
  .map(function(f){return new URL(f,RAIZ).href;});

self.addEventListener('install',function(e){
  self.skipWaiting();
  /* uno a uno y cada cual con su red de seguridad: addAll es atómico, así que un solo archivo que
     falle (o que el servidor no sirva el directorio) dejaba la caché ENTERA vacía, y con la caché
     vacía la reserva sin conexión no tenía nada que servir. */
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(BASE.map(function(u){return c.add(u).catch(function(){});}));
  }).catch(function(){}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){return k===CACHE?null:caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});

self.addEventListener('fetch',function(e){
  const req=e.request;
  if(req.method!=='GET')return;
  let url;
  try{url=new URL(req.url);}catch(err){return;}
  if(url.origin!==location.origin)return;   /* nada de tocar peticiones a otros sitios */
  const navegacion=req.mode==='navigate';
  e.respondWith(
    fetch(req).then(function(res){
      /* no se guarda la navegación de un «compartir»: su URL lleva la receta en la query, así que
         cada vídeo compartido dejaría una copia distinta engordando la caché para siempre */
      if(res&&res.ok&&!(navegacion&&url.search)){
        const copia=res.clone();
        caches.open(CACHE).then(function(c){c.put(req,copia).catch(function(){});}).catch(function(){});
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        if(hit)return hit;
        /* Compartir desde TikTok entra por index.html?title=…&text=…&url=…, que como URL no está en
           la caché: sin esto la app ni se abría —error de red en seco— justo cuando más falta hace,
           que es con la app instalada y la cobertura del hospital. Se sirve la portada guardada y
           la propia página se encarga de leer la query. */
        if(navegacion)return caches.match(INDEX).then(function(portada){
          return portada||respuestaSinRed();});
        return respuestaSinRed();
      }).catch(function(){return respuestaSinRed();});
    })
  );
});

function respuestaSinRed(){
  /* devolver undefined desde respondWith() es un error de red en seco: mejor decir qué pasa */
  return new Response(
    '<!doctype html><meta charset="utf-8"><title>Sin conexión</title>'+
    '<body style="font:16px/1.5 system-ui;background:#070b14;color:#e9f2ff;padding:24px">'+
    '<h1 style="font-size:19px">Sin conexión</h1>'+
    '<p>Todavía no tengo una copia guardada de la app. Abre «Guardias» una vez con datos o wifi y '+
    'a partir de ahí funcionará también sin conexión.</p>',
    {status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
}
