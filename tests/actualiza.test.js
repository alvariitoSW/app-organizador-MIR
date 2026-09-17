/*
 * Que la app INSTALADA se entere de que hay una versión nueva.
 *
 * Va aparte porque necesita dos cosas que en la suite grande estorban: servir con las cabeceras
 * reales de GitHub Pages (Cache-Control: max-age=600 + ETag) y "desplegar" versiones nuevas a
 * mitad de la prueba cambiando los archivos servidos.
 *
 * El fallo que fija: se daba por hecho que el service worker iba "a red primero" porque hacía
 * fetch(req). No es verdad: por encima del service worker está la caché HTTP del navegador, así
 * que tras desplegar llegaban CERO peticiones al servidor y el móvil seguía con la versión vieja.
 *
 * Uso: node tests/actualiza.test.js
 */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const REPO = path.join(__dirname, '..');
const SUB = '/app-organizador-MIR/';
const ARCHIVOS = ['index.html', 'app.js', 'styles.css', 'manifest.json', 'sw.js', 'icon.svg', 'version.json'];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml' };

let raiz = '';
let peticiones = 0;

function serveComoGitHubPages() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      if (u.indexOf(SUB) !== 0) { res.writeHead(404); res.end('fuera'); return; }
      const p = path.join(raiz, u.slice(SUB.length));
      fs.readFile(p, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        peticiones++;
        res.writeHead(200, {
          'Content-Type': MIME[path.extname(p)] || 'application/octet-stream',
          'Cache-Control': 'max-age=600',
          ETag: '"' + crypto.createHash('md5').update(data).digest('hex') + '"',
        });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || '' }); }

(async () => {
  raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'pages-sim-'));
  ARCHIVOS.forEach((f) => fs.copyFileSync(path.join(REPO, f), path.join(raiz, f)));

  const server = await serveComoGitHubPages();
  const base = `http://127.0.0.1:${server.address().port}${SUB}`;
  const preinstalled = '/opt/pw-browsers/chromium';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(preinstalled) ? preinstalled : undefined,
  });
  const context = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  await page.goto(base + 'index.html');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(1200);

  const arranque = await page.evaluate(() => ({
    version: window.PG.versionActual(),
    sinAviso: !document.querySelector('.avisoVer'),
  }));
  check('al arrancar, la app sabe su versión y no avisa de nada',
    !!arranque.version && arranque.sinAviso, JSON.stringify(arranque));

  // ---- se despliega una versión nueva ----
  const marca = 'MARCA-' + Date.now();
  fs.writeFileSync(path.join(raiz, 'app.js'),
    fs.readFileSync(path.join(raiz, 'app.js'), 'utf8') + '\nwindow.__MARCA="' + marca + '";\n');
  fs.writeFileSync(path.join(raiz, 'version.json'),
    JSON.stringify({ v: '2099-01-01T00:00:00Z', commit: 'nuevo' }) + '\n');

  // 1) reabrir la app (arranque en frío) tiene que traer el código nuevo. Antes NO lo traía: la
  //    caché HTTP contestaba por el service worker y no salía ni una petición a la red.
  peticiones = 0;
  await page.goto(base + 'index.html');
  await page.waitForTimeout(1000);
  const trasReabrir = await page.evaluate((m) => ({ tieneLoNuevo: window.__MARCA === m }), marca);
  check('reabrir la app trae de verdad el código nuevo, sin quedarse en la caché del navegador',
    trasReabrir.tieneLoNuevo && peticiones > 0,
    JSON.stringify({ ...trasReabrir, peticionesAlServidor: peticiones }));

  // 2) el caso de Android: se vuelve a la app desde las recientes y NO hay navegación ninguna.
  //    La página sigue con el JavaScript viejo cargado, así que hay que avisar.
  const marca2 = 'SEGUNDA-' + Date.now();
  fs.writeFileSync(path.join(raiz, 'app.js'),
    fs.readFileSync(path.join(raiz, 'app.js'), 'utf8').replace(/window\.__MARCA=".*?";/, 'window.__MARCA="' + marca2 + '";'));
  fs.writeFileSync(path.join(raiz, 'version.json'),
    JSON.stringify({ v: '2099-06-06T00:00:00Z', commit: 'otro' }) + '\n');

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(1500);
  const aviso = await page.evaluate(() => ({
    lodetecta: window.PG.hayVersionNueva(),
    banner: !!document.querySelector('.avisoVer'),
    tieneBoton: !!document.querySelector('[data-a="app-actualizar"]'),
  }));
  check('al volver a la app sin recargar, avisa de que hay una versión nueva',
    aviso.lodetecta && aviso.banner && aviso.tieneBoton, JSON.stringify(aviso));

  // 3) y el botón de actualizar trae de verdad el código nuevo
  if (aviso.tieneBoton) {
    await page.click('[data-a="app-actualizar"]');
    await page.waitForTimeout(1800);
  }
  const trasActualizar = await page.evaluate((m) => ({
    tieneLoNuevo: window.__MARCA === m,
    version: window.PG.versionActual(),
    sinAviso: !document.querySelector('.avisoVer'),
  }), marca2);
  check('«actualizar» recarga y deja la app en la versión nueva, sin el aviso',
    trasActualizar.tieneLoNuevo && trasActualizar.version === '2099-06-06T00:00:00Z' && trasActualizar.sinAviso,
    JSON.stringify(trasActualizar));

  // 4) sin red, comprobar la versión no puede reventar nada
  await context.setOffline(true);
  const sinRed = await page.evaluate(async () => {
    let reventó = false;
    try { await window.PG.mirarVersion(); } catch (e) { reventó = true; }
    return { reventó, vivo: !!document.querySelector('#main') };
  });
  await context.setOffline(false);
  check('sin conexión, comprobar la versión no rompe la app',
    !sinRed.reventó && sinRed.vivo, JSON.stringify(sinRed));

  check('sin errores de JavaScript durante la sesión', pageErrors.length === 0, JSON.stringify(pageErrors));

  await browser.close();
  server.close();
  fs.rmSync(raiz, { recursive: true, force: true });

  results.forEach((r) => console.log((r.pass ? 'OK   — ' : 'FAIL — ') + r.name + (r.pass ? '' : '  (' + r.detail + ')')));
  const malas = results.filter((r) => !r.pass).length;
  console.log('\n' + (results.length - malas) + '/' + results.length + ' pruebas de actualización OK');
  process.exit(malas ? 1 : 0);
})().catch((e) => { console.error('la suite ha fallado al ejecutarse:', e); process.exit(1); });
