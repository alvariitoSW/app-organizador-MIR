import worker from '../tools/worker-recetas.js';
let ok=0,fail=0;
const check=(n,c,d)=>{ (c?ok++:fail++); console.log((c?'PASS':'FAIL')+' — '+n+(c?'':'  ('+(d||'')+')')); };
const pide=(u,m='GET')=>new Request('https://x.workers.dev/'+(u?('?url='+encodeURIComponent(u)):''),{method:m});

// 1) preflight
let r=await worker.fetch(pide('','OPTIONS'),{});
check('OPTIONS devuelve CORS sin cuerpo', r.status===200 && r.headers.get('access-control-allow-origin')==='*', r.status);

// 2) sin url
r=await worker.fetch(pide(''),{});
check('sin url -> 400 con CORS', r.status===400 && r.headers.get('access-control-allow-origin')==='*', r.status);

// 3) dominio fuera de la lista (lo importante: no es un proxy abierto)
r=await worker.fetch(pide('https://evil.example.com/secreto'),{});
check('un dominio cualquiera se rechaza: no es un proxy abierto', r.status===400 && /permitidos/.test((await r.json()).error));

// 3b) intento de colarse con un subdominio parecido
r=await worker.fetch(pide('https://tiktok.com.evil.example/x'),{});
check('«tiktok.com.evil.example» no cuela', r.status===400);

// 4) camino bueno: oEmbed contesta
globalThis.fetch=async(u)=>{
  if(String(u).includes('tiktok.com/oembed'))return new Response(JSON.stringify({title:'POLLO AL LIMÓN 🍋\n600 g pollo',author_name:'cocinafit'}),{status:200});
  throw new Error('no debería pedir nada más');
};
r=await worker.fetch(pide('https://www.tiktok.com/@cocinafit/video/123'),{});
let b=await r.json();
check('oEmbed bueno -> {texto, autor} con CORS', r.status===200 && /POLLO AL LIM/.test(b.texto) && b.autor==='cocinafit' && b.via==='oembed' && r.headers.get('access-control-allow-origin')==='*', JSON.stringify(b));

// 5) oEmbed falla -> reserva og:description
globalThis.fetch=async(u)=>{
  if(String(u).includes('/oembed'))return new Response('nope',{status:403});
  return new Response('<html><head><meta property="og:description" content="Lentejas r&amp;pidas: 250 g lenteja, 1 cebolla"></head></html>',{status:200});
};
r=await worker.fetch(pide('https://www.tiktok.com/@x/video/9'),{});
b=await r.json();
check('si oEmbed falla, tira de og:description', r.status===200 && b.via==='og' && /Lentejas r&pidas/.test(b.texto), JSON.stringify(b));

// 6) ni oEmbed ni og
globalThis.fetch=async(u)=>String(u).includes('/oembed')?new Response('x',{status:404}):new Response('<html></html>',{status:200});
r=await worker.fetch(pide('https://youtu.be/abc'),{});
check('sin descripción por ningún lado -> 404 explicado', r.status===404 && /descripci/.test((await r.json()).error));

// 7) la red revienta
globalThis.fetch=async()=>{throw new Error('boom');};
r=await worker.fetch(pide('https://www.tiktok.com/@x/video/1'),{});
check('si la red falla -> 502 y no una excepción sin capturar', r.status===502 && /no he podido leer/i.test((await r.json()).error));

// 8) ORIGEN restringido
globalThis.fetch=async()=>new Response(JSON.stringify({title:'x'}),{status:200});
r=await worker.fetch(pide('https://www.tiktok.com/@x/video/1'),{ORIGEN:'https://alvariitosw.github.io'});
check('con ORIGEN puesto, solo esa web puede usarlo', r.headers.get('access-control-allow-origin')==='https://alvariitosw.github.io');

// 9) Instagram
r=await worker.fetch(pide('https://www.instagram.com/reel/abc/'),{});
check('Instagram responde que hace falta pegar el texto', r.status===400 && /credenciales/.test((await r.json()).error));

console.log('\n'+ok+'/'+(ok+fail)+' pruebas del lector OK');
process.exit(fail?1:0);
