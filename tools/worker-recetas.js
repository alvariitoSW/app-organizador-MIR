/*
 * Lector de enlaces para «Importar receta» (app Guardias · rotación y cocina).
 *
 * Qué hace: recibe el enlace de un vídeo, le pregunta a la plataforma por su descripción
 * y te la devuelve con las cabeceras que el navegador necesita (CORS). Eso último es todo
 * el motivo de que exista: oEmbed es público, pero desde una página web el navegador solo
 * acepta la respuesta si el servidor da permiso, y eso no lo controlas tú.
 *
 * Qué NO hace: no se baja el vídeo ni lo escucha. Si la receta solo se dice en voz alta y no
 * está escrita en ningún sitio, esto no la va a sacar.
 *
 * Cómo se despliega: mira tools/LECTOR-DE-ENLACES.md (5 minutos, gratis, sin tarjeta).
 */

/* Solo estos sitios. Sin esta lista tendrías un proxy abierto con el que cualquiera podría
   pedir cualquier URL desde tu cuenta. */
const SITIOS = [
  { re: /^https:\/\/([\w-]+\.)*tiktok\.com\//i,
    oembed: (u) => 'https://www.tiktok.com/oembed?url=' + encodeURIComponent(u) },
  { re: /^https:\/\/(([\w-]+\.)*youtube\.com|youtu\.be)\//i,
    oembed: (u) => 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(u) },
  { re: /^https:\/\/([\w-]+\.)*instagram\.com\//i, oembed: null },
];

export default {
  async fetch(peticion, env) {
    /* ORIGEN: ponlo a la dirección de tu app (https://tu-usuario.github.io) para que solo ella
       pueda usar tu lector. Sin ponerlo vale cualquiera, que para esto tampoco es grave. */
    const cors = {
      'access-control-allow-origin': (env && env.ORIGEN) || '*',
      'access-control-allow-methods': 'GET,OPTIONS',
      'access-control-allow-headers': 'accept,content-type',
      'access-control-max-age': '86400',
    };
    const responde = (cuerpo, estado) => new Response(JSON.stringify(cuerpo), {
      status: estado || 200,
      headers: { ...cors, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
    });

    if (peticion.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (peticion.method !== 'GET') return responde({ error: 'solo GET' }, 405);

    const url = (new URL(peticion.url).searchParams.get('url') || '').trim();
    if (!url) return responde({ error: 'falta el parámetro url' }, 400);

    const sitio = SITIOS.find((s) => s.re.test(url));
    if (!sitio) return responde({ error: 'ese enlace no está en la lista de sitios permitidos' }, 400);
    if (!sitio.oembed) return responde({ error: 'Instagram pide credenciales propias: pega el texto a mano' }, 400);

    try {
      /* 1) el camino bueno: oEmbed. Devuelve el pie del vídeo en "title". */
      const r = await fetch(sitio.oembed(url), {
        headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (compatible; lector-recetas/1.0)' },
        cf: { cacheTtl: 3600 },
      });
      if (r.ok) {
        const d = await r.json();
        const texto = String((d && d.title) || '').trim();
        if (texto) return responde({ texto, autor: String((d && d.author_name) || '').trim(), via: 'oembed' });
      }

      /* 2) si oEmbed no da nada, la etiqueta og:description de la propia página. Es más frágil
            (depende del HTML que sirvan ese día), por eso va de reserva y no de primera opción. */
      const html = await (await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; lector-recetas/1.0)', accept: 'text/html' },
        cf: { cacheTtl: 3600 },
      })).text();
      const og = /<meta[^>]+(?:property|name)=["']og:description["'][^>]+content=["']([^"']*)["']/i.exec(html);
      const texto = og ? og[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim() : '';
      if (texto) return responde({ texto, autor: '', via: 'og' });

      return responde({ error: 'ese enlace no trae descripción escrita' }, 404);
    } catch (e) {
      return responde({ error: 'no he podido leer el enlace: ' + String((e && e.message) || e).slice(0, 120) }, 502);
    }
  },
};
