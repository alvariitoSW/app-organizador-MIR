/*
 * Compartir desde TikTok con la app INSTALADA: service worker, reserva sin conexión y rescate.
 *
 * Va aparte de la suite grande porque necesita dos cosas que allí estorban: servir desde un
 * subdirectorio (GitHub Pages sirve /app-organizador-MIR/, no la raíz — una ruta relativa dentro
 * del service worker no cae en el mismo sitio en los dos casos) y cortar la red a mitad.
 *
 * Uso: node tests/compartir.test.js
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SUB = '/app-organizador-MIR/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };

function serveStatic() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      if (u.indexOf(SUB) !== 0) { res.writeHead(404); res.end('fuera del sitio'); return; }
      const p = path.join(ROOT, u.slice(SUB.length));
      fs.readFile(p, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || '' }); }

(async () => {
  const server = await serveStatic();
  const base = `http://127.0.0.1:${server.address().port}${SUB}`;
  const preinstalled = '/opt/pw-browsers/chromium';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(preinstalled) ? preinstalled : undefined,
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  // 1) la primera visita deja la app entera en la caché. Antes no: addAll() es atómico y un solo
  // archivo que fallara la dejaba vacía, así que la reserva sin conexión no tenía qué servir
  await page.goto(base + 'index.html');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(700);
  const enCache = await page.evaluate(async () => {
    const ks = await caches.keys();
    const out = [];
    for (const k of ks) { const c = await caches.open(k); (await c.keys()).forEach((r) => out.push(r.url)); }
    return out;
  });
  const imprescindibles = ['index.html', 'app.js', 'styles.css'];
  check('la primera visita guarda la app entera en la caché del service worker',
    imprescindibles.every((f) => enCache.some((u) => u.endsWith(SUB + f))),
    JSON.stringify(enCache));

  // 2) EL FALLO GORDO: compartir sin conexión. La URL de un «compartir» lleva la receta en la query,
  // así que no coincide con nada guardado; sin reserva, la app ni se abría (error de red en seco)
  const shareOffline = base + 'index.html?title=' + encodeURIComponent('Lentejas') +
    '&text=' + encodeURIComponent('500 g lenteja\n200 g chorizo https://vm.tiktok.com/ZGoff/');
  await context.setOffline(true);
  let errorDeRed = '';
  await page.goto(shareOffline).catch((e) => { errorDeRed = e.message.split('\n')[0]; });
  await page.waitForTimeout(700);
  const sinRed = errorDeRed ? null : await page.evaluate(() => ({
    hayApp: !!window.PG,
    tab: window.PG && window.PG.ui.tab,
    url: window.PG && window.PG.ui.imp.url,
    texto: !!(window.PG && window.PG.ui.imp.txt),
  })).catch(() => null);
  check('compartir sin conexión abre la app en Importar, en vez de morir con un error de red',
    !errorDeRed && sinRed && sinRed.hayApp && sinRed.tab === 'import' &&
    sinRed.url === 'https://vm.tiktok.com/ZGoff/' && sinRed.texto,
    errorDeRed || JSON.stringify(sinRed));

  // 3) y el lector local funciona sin conexión, que es el sentido de todo esto
  let receta = null;
  if (!errorDeRed) {
    await page.click('[data-a="imp-local"]').catch(() => {});
    await page.waitForTimeout(400);
    receta = await page.evaluate(() => {
      const r = window.PG.ui.imp.receta;
      return r ? { name: r.name, ing: r.ingredients.length } : null;
    }).catch(() => null);
  }
  check('sin conexión, la receta compartida se lee igual (el lector de la app no usa red)',
    receta && receta.ing >= 2, JSON.stringify(receta));
  await context.setOffline(false);

  // 4) arrancar sin conexión sigue funcionando (no se ha roto el modo sin red de siempre)
  await page.goto(base + 'index.html');
  await page.waitForTimeout(400);
  await context.setOffline(true);
  const arranque = await page.goto(base + 'index.html').then(() => true).catch(() => false);
  await page.waitForTimeout(500);
  const arranqueOk = arranque && await page.evaluate(() => !!window.PG).catch(() => false);
  check('la app sigue arrancando sin conexión', arranqueOk, 'navegación ok: ' + arranque);
  await context.setOffline(false);

  // 5) una petición que no es navegación y no está en caché devuelve una página que lo explica,
  // no un error en seco (respondWith(undefined) es un fallo de red)
  await page.goto(base + 'index.html');
  await page.waitForTimeout(300);
  await context.setOffline(true);
  const respuestaSuelta = await page.evaluate(async (b) => {
    try { const r = await fetch(b + 'no-existe-esto.txt'); return { status: r.status }; }
    catch (e) { return { error: String(e) }; }
  }, base);
  await context.setOffline(false);
  check('sin red y sin copia, el service worker contesta 503 explicándolo en vez de fallar en seco',
    respuestaSuelta.status === 503, JSON.stringify(respuestaSuelta));

  check('sin errores de JavaScript durante la sesión', pageErrors.length === 0, JSON.stringify(pageErrors));

  await browser.close();
  server.close();

  results.forEach((r) => console.log((r.pass ? 'OK   — ' : 'FAIL — ') + r.name + (r.pass ? '' : '  (' + r.detail + ')')));
  const malas = results.filter((r) => !r.pass).length;
  console.log('\n' + (results.length - malas) + '/' + results.length + ' pruebas de compartir OK');
  process.exit(malas ? 1 : 0);
})().catch((e) => { console.error('la suite ha fallado al ejecutarse:', e); process.exit(1); });
