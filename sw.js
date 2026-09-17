/* Service worker mínimo. Existe por dos razones:
   1. sin él el navegador no ofrece instalar la app, y sin instalarla TikTok no la enseña al compartir;
   2. de paso da modo sin conexión.
   Estrategia: red primero y caché de reserva. Al revés (caché primero) se quedaría servida una versión
   vieja de app.js después de cada despliegue. */
const CACHE='guardias-v4';
/* Absolutas y contra el ámbito del registro. En GitHub Pages la app no cuelga de la raíz sino de
   /app-organizador-MIR/, y una ruta relativa suelta no siempre cae donde uno cree. */
const RAIZ=new URL('./',self.registration?self.registration.scope:self.location.href);
const INDEX=new URL('index.html',RAIZ).href;
const BASE=['index.html','app.js','styles.css','icon.svg','manifest.json','version.json']
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
  if(navegacion&&!url.search){e.respondWith(navegacionSellada(req,url));return;}
  e.respondWith(
    /* «red primero» NO se cumple con un fetch() a secas: por encima del service worker está la
       caché HTTP del navegador, y GitHub Pages sirve con Cache-Control: max-age=600. Medido: tras
       desplegar una versión nueva y reabrir la app, llegaban CERO peticiones al servidor y se
       seguía viendo la versión vieja. Con no-store la petición sale de verdad a la red. */
    pedirFresco(req,url).then(function(res){
      /* no se guarda la navegación de un «compartir»: su URL lleva la receta en la query, así que
         cada vídeo compartido dejaría una copia distinta engordando la caché para siempre */
      if(res&&res.ok&&!(navegacion&&url.search)){
        const copia=res.clone();
        caches.open(CACHE).then(function(c){c.put(req,copia).catch(function(){});}).catch(function(){});
      }
      return res;
    }).catch(function(){
      return caches.match(req,{ignoreSearch:true}).then(function(hit){
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

const VERSION_URL=new URL('version.json',RAIZ).href;
function leerSello(){
  /* la marca del despliegue. Se pide sin caché y es un archivo de dos líneas. */
  return fetch(VERSION_URL,{cache:'no-store'}).then(function(r){
    return r.ok?r.json():null;}).then(function(d){
    return (d&&d.v)?String(d.v).replace(/[^0-9A-Za-z-]/g,''):'';}).catch(function(){return '';});}
function navegacionSellada(req,url){
  /* EL problema de verdad para que se actualice una app instalada: la caché EN MEMORIA del
     navegador sirve app.js y styles.css sin pasar siquiera por el service worker, así que da igual
     lo que haga aquí y da igual cómo recargues: con Cache-Control: max-age=600 te comes hasta diez
     minutos de código viejo, y si la página lleva rato abierta, lo que sea. Lo único que la vence
     es que la URL cambie, así que el propio service worker le pega la marca de la versión al
     enlace de app.js y styles.css antes de entregar el HTML. Cuando despliego, la marca cambia,
     la URL cambia y no hay caché que valga. */
  return Promise.all([pedirFresco(req,url),leerSello()]).then(function(r){
    const res=r[0],sello=r[1];
    if(!res||!res.ok||!sello)return res;
    const ct=res.headers.get('content-type')||'';
    if(!/text\/html/i.test(ct))return res;
    return res.text().then(function(html){
      const sellado=html.replace(/(src|href)="(\.\/)?(app\.js|styles\.css)"/g,
        function(_,attr,punto,archivo){return attr+'="'+(punto||'')+archivo+'?v='+sello+'"';});
      const h=new Headers(res.headers);h.set('cache-control','no-store');
      return new Response(sellado,{status:res.status,statusText:res.statusText,headers:h});});
  }).catch(function(){
    /* sin red: la portada guardada, que apunta a app.js sin marca — y esa sí está en la caché */
    return caches.match(INDEX).then(function(p){return p||respuestaSinRed();});});}
function pedirFresco(req,url){
  /* no se puede reutilizar un Request de navegación cambiándole el modo de caché, así que se pide
     por URL. Si el navegador no admite la opción, se cae al fetch de siempre en vez de romper. */
  try{
    return fetch(url.href,{cache:'no-store',credentials:'same-origin',
      headers:req.headers,redirect:'follow'});
  }catch(err){return fetch(req);}}
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
