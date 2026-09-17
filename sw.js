/* Service worker mínimo. Existe por dos razones:
   1. sin él el navegador no ofrece instalar la app, y sin instalarla TikTok no la enseña al compartir;
   2. de paso da modo sin conexión.
   Estrategia: red primero y caché de reserva. Al revés (caché primero) se quedaría servida una versión
   vieja de app.js después de cada despliegue. */
const CACHE='guardias-v5';
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
  const responder=(navegacion&&!url.search)?navegacionSellada(req,url):desdeLaRed(req,url,navegacion);
  /* El reloj va AQUÍ, en la frontera, y no alrededor de cada fetch. Es la diferencia que importa:
     fetch() resuelve en cuanto llegan las CABECERAS, así que un servidor que contesta «200, es
     HTML» y luego se calla pasaba el filtro y se colgaba después, al leer el cuerpo. Con el límite
     en respondWith() queda cubierto todo lo que hay detrás —leer el cuerpo, buscar en la caché— y
     también lo que se añada mañana. */
  e.respondWith(conLimite(responder,LIMITE_TOTAL,function(){
    return reserva(req,navegacion).then(function(r){return r||respuestaSinRed();});}));
});
function desdeLaRed(req,url,navegacion){
  /* «red primero» NO se cumple con un fetch() a secas: por encima del service worker está la caché
     HTTP del navegador, y GitHub Pages sirve con Cache-Control: max-age=600. Medido: tras desplegar
     una versión nueva y reabrir la app, llegaban CERO peticiones al servidor y se seguía viendo la
     versión vieja. Con no-store la petición sale de verdad a la red. */
  return pedirFresco(req,url).then(function(res){
    /* Un 404 o un 500 NO son una respuesta válida para app.js: si el servidor está a medio
       desplegar, el navegador se traga el error, la página se queda con la cabecera pintada y nada
       más, y parece que la app «se ha quedado pillada». Teniendo copia buena, servir el error es lo
       peor que se puede hacer. */
    if(!res.ok)return reserva(req,navegacion).then(function(r){return r||res;});
    /* no se guarda la navegación de un «compartir»: su URL lleva la receta en la query, así que
       cada vídeo compartido dejaría una copia distinta engordando la caché para siempre */
    if(!(navegacion&&url.search)){
      const copia=res.clone();
      caches.open(CACHE).then(function(c){c.put(req,copia).catch(function(){});}).catch(function(){});
    }
    return res;
  }).catch(function(){
    return reserva(req,navegacion).then(function(r){return r||respuestaSinRed();});});}
function reserva(req,navegacion){
  /* La mejor respuesta guardada para esta petición, o null si no hay ninguna. Antes esto estaba
     escrito tres veces con tres respuestas distintas para el mismo caso; ahora la decisión vive en
     un sitio. Compartir desde TikTok entra por index.html?title=…&text=…&url=…, que como URL no
     está en la caché: por eso una navegación cae a la portada guardada y la propia página se
     encarga de leer la query. */
  return caches.match(req,{ignoreSearch:true}).then(function(hit){
    if(hit)return hit;
    return navegacion?caches.match(INDEX):null;
  }).catch(function(){return null;});}

/* Una promesa que NUNCA se resuelve cuelga respondWith() para siempre y el usuario se queda
   mirando una pantalla en blanco, sin error y sin nada que tocar. No hace falta estar sin cobertura:
   basta una wifi que acepta la conexión y luego no contesta —la del hospital, un portal cautivo, o
   GitHub Pages a mitad de despliegue—. Un fetch así no falla: se queda ahí. Por eso todo lo que
   entra en respondWith() lleva reloj y una alternativa. */
function conLimite(promesa,ms,alternativa){
  return new Promise(function(res){
    let listo=false;
    const dar=function(v){if(listo)return;listo=true;clearTimeout(t);res(v);};
    const t=setTimeout(function(){dar(typeof alternativa==='function'?alternativa():alternativa);},ms);
    promesa.then(dar,function(){dar(typeof alternativa==='function'?alternativa():alternativa);});
  });}
const LIMITE_SELLO=1500;    /* la marca de versión es un adorno: si tarda, se sigue sin ella */
const LIMITE_TOTAL=7000;    /* tope de TODA la respuesta. index.html espera algo más que esto antes
                               de sacar su pantalla de rescate: si se toca uno, hay que tocar el otro */
const VERSION_URL=new URL('version.json',RAIZ).href;
function leerSello(){
  /* la marca del despliegue. Se pide sin caché y es un archivo de dos líneas. Con reloj: sin marca
     se sirve el HTML tal cual —lo peor que pasa es que tardes un rato en ver la versión nueva—,
     que es infinitamente mejor que no abrir la app. */
  return conLimite(
    fetch(VERSION_URL,{cache:'no-store'}).then(function(r){
      return r.ok?r.json():null;}).then(function(d){
      return (d&&d.v)?String(d.v).replace(/[^0-9A-Za-z-]/g,''):'';}),
    LIMITE_SELLO,'');}
function navegacionSellada(req,url){
  /* EL problema de verdad para que se actualice una app instalada: la caché EN MEMORIA del
     navegador sirve app.js y styles.css sin pasar siquiera por el service worker, así que da igual
     lo que haga aquí y da igual cómo recargues: con Cache-Control: max-age=600 te comes hasta diez
     minutos de código viejo, y si la página lleva rato abierta, lo que sea. Lo único que la vence
     es que la URL cambie, así que el propio service worker le pega la marca de la versión al
     enlace de app.js y styles.css antes de entregar el HTML. Cuando despliego, la marca cambia,
     la URL cambia y no hay caché que valga. */
  const guardada=function(){
    return reserva(req,true).then(function(r){return r||respuestaSinRed();});};
  /* solo leerSello lleva reloj propio: si la marca tarda pero el HTML ya está, servir el HTML sin
     marca es mucho mejor que esperar. Del resto se encarga el límite de la frontera. */
  return Promise.all([pedirFresco(req,url),leerSello()]).then(function(r){
    const res=r[0],sello=r[1];
    if(!res.ok)return guardada();   /* 404/500: mejor la portada guardada que un error */
    if(!sello)return res;
    const ct=res.headers.get('content-type')||'';
    if(!/text\/html/i.test(ct))return res;
    return res.text().then(function(html){
      const sellado=html.replace(/(src|href)="(\.\/)?(app\.js|styles\.css)"/g,
        function(_,attr,punto,archivo){return attr+'="'+(punto||'')+archivo+'?v='+sello+'"';});
      const h=new Headers(res.headers);h.set('cache-control','no-store');
      return new Response(sellado,{status:res.status,statusText:res.statusText,headers:h});});
  }).catch(function(){
    /* sin red: la portada guardada, que apunta a app.js sin marca — y esa sí está en la caché */
    return guardada();});}
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
