import worker from '../tools/worker-calendario.js';
let ok = 0, fail = 0;
const check = (n, c, d) => { (c ? ok++ : fail++); console.log((c ? 'PASS' : 'FAIL') + ' — ' + n + (c ? '' : '  (' + (d || '') + ')')); };

/* un KV de mentira con el mismo contrato que el de Cloudflare */
const kvNuevo = () => { const m = new Map(); return {
  _m: m,
  get: async (k) => (m.has(k) ? m.get(k) : null),
  put: async (k, v) => { m.set(k, v); },
  delete: async (k) => { m.delete(k); },
}; };
const BUZON = 'a1b2c3d4e5f6g7h8i9j0k1l2';
const ICS = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:x@y\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
const pide = (ruta, m = 'GET', cuerpo, token) => new Request('https://cal.workers.dev' + ruta, {
  method: m, body: cuerpo,
  headers: token ? { authorization: 'Bearer ' + token } : {},
});
const env = () => ({ CAL: kvNuevo(), TOKEN: 'secreto-largo-de-verdad' });

/* 1) preflight */
let e = env();
let r = await worker.fetch(pide('/cal/' + BUZON + '/guardias.ics', 'OPTIONS'), e);
check('OPTIONS devuelve CORS y deja pasar el PUT',
  r.status === 200 && /PUT/.test(r.headers.get('access-control-allow-methods') || ''), r.status);

/* 2) ESCRIBIR SIN TOKEN NO SE PUEDE. Es lo único que separa tu calendario de cualquiera. */
e = env();
r = await worker.fetch(pide('/cal/' + BUZON + '/guardias', 'PUT', ICS), e);
check('un PUT sin token se rechaza', r.status === 401, r.status);
r = await worker.fetch(pide('/cal/' + BUZON + '/guardias', 'PUT', ICS, 'otro-token'), e);
check('un PUT con el token equivocado se rechaza', r.status === 401, r.status);
check('y no ha escrito nada', e.CAL._m.size === 0, e.CAL._m.size);

/* 3) el camino bueno: subir y que Google lo lea sin credenciales */
e = env();
r = await worker.fetch(pide('/cal/' + BUZON + '/guardias', 'PUT', ICS, 'secreto-largo-de-verdad'), e);
check('con el token bueno, guarda', r.status === 200, r.status);
r = await worker.fetch(pide('/cal/' + BUZON + '/guardias.ics'), e);
const cuerpo = await r.text();
check('Google lo lee sin cabeceras, con el tipo de contenido de un calendario',
  r.status === 200 && cuerpo === ICS && /text\/calendar/.test(r.headers.get('content-type') || ''),
  r.status + ' ' + r.headers.get('content-type'));
check('y pide que no lo indexen', /noindex/.test(r.headers.get('x-robots-tag') || ''), r.headers.get('x-robots-tag'));

/* 4) UN BUZÓN QUE NO EXISTE NO DA UN 404: da un calendario vacío. Un 404 hace que Google marque
      la suscripción como rota y deje de mirarla, y entonces no se arregla sola nunca. */
e = env();
r = await worker.fetch(pide('/cal/' + BUZON + '/trabajo.ics'), e);
check('un buzón todavía vacío devuelve un calendario vacío, no un 404',
  r.status === 200 && /BEGIN:VCALENDAR/.test(await r.text()), r.status);

/* 5) no es un almacén general */
e = env();
r = await worker.fetch(pide('/cal/' + BUZON + '/guardias', 'PUT', 'hola que tal', 'secreto-largo-de-verdad'), e);
check('no se puede guardar cualquier cosa: tiene que ser un .ics', r.status === 400, r.status);
r = await worker.fetch(pide('/cal/' + BUZON + '/loquesea', 'PUT', ICS, 'secreto-largo-de-verdad'), e);
check('solo los cuatro calendarios que la app sabe exportar', r.status === 404, r.status);
r = await worker.fetch(pide('/cal/corto/guardias', 'PUT', ICS, 'secreto-largo-de-verdad'), e);
check('una dirección corta se rechaza: el secreto es que sea larga', r.status === 400, r.status);
r = await worker.fetch(pide('/cal/' + BUZON + '/guardias', 'PUT', 'BEGIN:VCALENDAR' + 'x'.repeat(600 * 1024), 'secreto-largo-de-verdad'), e);
check('un fichero enorme se rechaza', r.status === 413, r.status);

/* 6) sin KV o sin TOKEN configurados, lo dice en vez de fallar en silencio */
r = await worker.fetch(pide('/cal/' + BUZON + '/guardias.ics'), { TOKEN: 'x' });
check('sin el almacén KV lo dice claro', r.status === 500 && /KV/.test(await r.text()), r.status);
r = await worker.fetch(pide('/cal/' + BUZON + '/guardias', 'PUT', ICS, 'x'), { CAL: kvNuevo() });
check('sin el secreto TOKEN lo dice claro', r.status === 500 && /TOKEN/.test(await r.text()), r.status);

/* 7) borrar */
e = env();
await worker.fetch(pide('/cal/' + BUZON + '/guardias', 'PUT', ICS, 'secreto-largo-de-verdad'), e);
r = await worker.fetch(pide('/cal/' + BUZON + '/guardias', 'DELETE', null, 'secreto-largo-de-verdad'), e);
check('con el token se puede borrar', r.status === 200 && e.CAL._m.size === 0, r.status);

/* 8) que no se indexe */
r = await worker.fetch(pide('/robots.txt'), env());
check('robots.txt lo deja todo fuera de los buscadores', /Disallow: \//.test(await r.text()));

console.log('\n' + ok + '/' + (ok + fail) + ' pruebas del buzón de calendario OK');
process.exit(fail ? 1 : 0);
