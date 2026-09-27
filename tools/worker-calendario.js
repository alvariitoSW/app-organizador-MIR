/*
 * Buzón de calendario para la app «Guardias · rotación y cocina».
 *
 * PARA QUÉ. Google Calendar sabe suscribirse a un .ics que esté en una URL: lo relee cada
 * pocas horas y deja el calendario igual que el fichero — añade lo nuevo, cambia lo que
 * cambió y BORRA lo que ya no está. Eso es lo que convierte «importar» en «sincronizar», y
 * es lo único que hace que no se acumulen copias. Lo que falta es una URL, porque la app es
 * un fichero HTML en tu móvil y no tiene servidor. Esto es ese servidor, y no hace nada más.
 *
 * QUÉ GUARDA. El .ics que le manda la app: tus guardias, tu jornada, tus entrenos y tus
 * avisos, con sus horas. No hay nada de comida, ni de dinero, ni de peso.
 *
 * QUIÉN PUEDE LEERLO. Cualquiera que tenga la URL completa. Es el mismo trato que hace
 * Google con su «dirección secreta en formato iCal»: el secreto es que la dirección es larga
 * y aleatoria, no que esté cifrada. No la pegues en un sitio público. Si se te escapa, en la
 * app le das a «cambiar la dirección» y la vieja deja de existir.
 *
 * QUIÉN PUEDE ESCRIBIR. Solo quien tenga el TOKEN, que va en una cabecera y nunca en la URL
 * (las URLs se quedan en los registros de medio mundo; las cabeceras no).
 *
 * Cómo se despliega: mira tools/CALENDARIO-EN-GOOGLE.md.
 */

/* los cuatro calendarios, que son los que la app sabe exportar por separado. La lista está
   cerrada a propósito: sin ella, cualquiera con el token podría llenarte el KV de ficheros. */
const GRUPOS = ['guardias', 'trabajo', 'entrenos', 'avisos'];

/* un .ics de tres meses de guardias son unos pocos kB. 512 kB es de sobra y evita que un
   error de la app —o alguien con el token— te llene la cuenta. */
const MAX_BYTES = 512 * 1024;

/* el buzón es la parte secreta de la URL. Se exige largo para que no se pueda adivinar
   probando: 24 caracteres de [a-z0-9] son ~124 bits. */
const RE_BUZON = /^[a-z0-9]{24,64}$/;

function cabecerasCORS(env) {
  return {
    'access-control-allow-origin': (env && env.ORIGEN) || '*',
    'access-control-allow-methods': 'GET,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type',
    'access-control-max-age': '86400',
  };
}

function texto(cuerpo, estado, extra) {
  return new Response(cuerpo, {
    status: estado || 200,
    headers: { 'content-type': 'text/plain; charset=utf-8', ...(extra || {}) },
  });
}

/* comparación en tiempo constante: con un === normal, el tiempo que tarda en fallar dice
   cuántos caracteres llevas acertados, y con eso se saca un token a base de intentos */
function mismoToken(a, b) {
  const x = String(a || ''), y = String(b || '');
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
}

export default {
  async fetch(peticion, env) {
    const cors = cabecerasCORS(env);
    if (peticion.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(peticion.url);

    /* que no lo indexe nadie */
    if (url.pathname === '/robots.txt') return texto('User-agent: *\nDisallow: /\n');

    /* /cal/<buzon>/<grupo>.ics */
    const m = /^\/cal\/([^/]+)\/([^/]+?)(?:\.ics)?$/.exec(url.pathname);
    if (!m) return texto('no hay nada aquí', 404, cors);

    const buzon = m[1].toLowerCase(), grupo = m[2].toLowerCase();
    if (!RE_BUZON.test(buzon)) return texto('esa dirección no tiene la forma que toca', 400, cors);
    if (GRUPOS.indexOf(grupo) < 0) return texto('ese calendario no existe', 404, cors);

    if (!env || !env.CAL) return texto('al Worker le falta el almacén KV (se llama CAL)', 500, cors);
    const clave = 'ics:' + buzon + ':' + grupo;

    /* ---- LEER: esto es lo que llama Google, y llama sin cabeceras ni cookies ---- */
    if (peticion.method === 'GET') {
      const ics = await env.CAL.get(clave);
      if (ics == null) {
        /* un calendario vacío es una respuesta válida: Google se suscribe igual y se llena
           cuando la app suba algo. Devolver 404 le hace marcar la suscripción como rota. */
        return new Response(
          'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//plan-guardias//buzon//ES\r\n' +
          'X-WR-CALNAME:' + grupo + ' (todavía vacío)\r\nEND:VCALENDAR\r\n',
          { status: 200, headers: { ...cors, 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'no-store' } });
      }
      return new Response(ics, {
        status: 200,
        headers: {
          ...cors,
          'content-type': 'text/calendar; charset=utf-8',
          'content-disposition': 'inline; filename="' + grupo + '.ics"',
          /* que Google no se quede con una copia vieja más de media hora */
          'cache-control': 'public, max-age=1800',
          'x-robots-tag': 'noindex, nofollow',
        },
      });
    }

    /* ---- ESCRIBIR y BORRAR: solo la app, con el token ---- */
    if (peticion.method === 'PUT' || peticion.method === 'DELETE') {
      if (!env.TOKEN) return texto('al Worker le falta el secreto TOKEN', 500, cors);
      const dado = (peticion.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      if (!mismoToken(dado, env.TOKEN)) return texto('token incorrecto', 401, cors);

      if (peticion.method === 'DELETE') {
        await env.CAL.delete(clave);
        return texto('borrado', 200, cors);
      }

      const cuerpo = await peticion.text();
      if (cuerpo.length > MAX_BYTES) return texto('demasiado grande', 413, cors);
      /* que sea un .ics de verdad y no cualquier cosa: esto no es un almacén general */
      if (!/^BEGIN:VCALENDAR/i.test(cuerpo.trim())) return texto('eso no es un .ics', 400, cors);

      await env.CAL.put(clave, cuerpo);
      return texto('guardado (' + cuerpo.length + ' bytes)', 200, cors);
    }

    return texto('método no permitido', 405, cors);
  },
};
