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

// ficheros que el servidor acepta y luego NO contesta nunca: la wifi que no falla, se queda.
// Es el caso que dejaba la app en blanco para siempre, y no hace falta estar sin cobertura.
const colgados = new Set();
// ficheros que el servidor da por perdidos: un despliegue a medias, o Pages todavía publicando
const rotos = new Set();
function serveComoGitHubPages() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      if (u.indexOf(SUB) !== 0) { res.writeHead(404); res.end('fuera'); return; }
      const p = path.join(raiz, u.slice(SUB.length));
      if (colgados.has(path.basename(p))) return;   // ni responde ni cierra: se queda ahí
      if (rotos.has(path.basename(p))) { res.writeHead(404); res.end('no está'); return; }
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

  // 7) una red que acepta y no contesta (wifi de hospital, portal cautivo, Pages a medio desplegar)
  //    no puede dejar la app colgada: un fetch así NO falla, se queda esperando, y respondWith()
  //    con una promesa que nunca se resuelve es una pantalla en blanco para siempre.
  {
    const abre = async (etiqueta) => {
      const t = Date.now();
      const ok = await page.reload({ timeout: 15000 }).then(() => true).catch(() => false);
      await page.waitForTimeout(1200);
      const vivo = await Promise.race([
        page.evaluate(() => ({ pg: typeof window.PG,
          main: document.querySelector('#main') ? document.querySelector('#main').innerHTML.length : 0 })),
        new Promise((r) => setTimeout(() => r(null), 5000)),
      ]).catch(() => null);
      return { etiqueta, ok, ms: Date.now() - t, vivo };
    };

    colgados.add('version.json');
    const conSelloColgado = await abre('version.json no contesta');
    colgados.clear();

    colgados.add('app.js');
    const conAppColgada = await abre('app.js no contesta');
    colgados.clear();

    const normal = await abre('red normal');

    check('si la red acepta y no contesta, la app abre igual en vez de quedarse en blanco',
      conSelloColgado.ok && conSelloColgado.vivo && conSelloColgado.vivo.pg === 'object' &&
      conSelloColgado.vivo.main > 500 && conSelloColgado.ms < 12000 &&
      conAppColgada.ok && conAppColgada.vivo && conAppColgada.vivo.pg === 'object' &&
      conAppColgada.vivo.main > 500 &&
      normal.ok && normal.vivo && normal.vivo.pg === 'object',
      JSON.stringify({ conSelloColgado, conAppColgada, normal }));
  }

  // 8) un 404 en app.js (Pages a medio desplegar) no puede dejar la app muerta: hay copia guardada
  {
    rotos.add('app.js');
    await page.reload({ timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const con404 = await page.evaluate(() => ({
      pg: typeof window.PG,
      main: document.querySelector('#main') ? document.querySelector('#main').innerHTML.length : 0,
    })).catch(() => ({ pg: 'sin respuesta', main: 0 }));
    rotos.clear();
    check('si app.js da 404, se sirve la copia guardada en vez de dejar la app muerta',
      con404.pg === 'object' && con404.main > 500, JSON.stringify(con404));
  }

  // 9) y si no hay copia guardada, la pantalla de rescate: el HTML lleva su propio salvavidas
  //    en línea, así que aparece aunque app.js no llegue nunca. Sin esto el usuario se queda
  //    mirando una cabecera, sin error y sin nada que tocar.
  {
    rotos.add('app.js');
    const limpio = await browser.newContext();   // móvil nuevo: ni service worker ni caché
    const p2 = await limpio.newPage();
    await p2.goto(base + 'index.html', { timeout: 20000 }).catch(() => {});
    await p2.waitForTimeout(10500);
    const rescate = await p2.evaluate(() => {
      const d = document.getElementById('rescate');
      return d ? { sale: true, boton: !!document.getElementById('rescateBtn'),
        info: (document.getElementById('rescateInfo') || {}).textContent || '' } : { sale: false };
    }).catch(() => ({ sale: false }));

    rotos.clear();
    let reparado = { pg: 'no se intentó' };
    if (rescate.sale) {
      await p2.click('#rescateBtn');
      await p2.waitForTimeout(5000);
      reparado = await p2.evaluate(() => ({ pg: typeof window.PG,
        main: document.querySelector('#main') ? document.querySelector('#main').innerHTML.length : 0 })).catch(() => ({ pg: 'sin respuesta' }));
    }

    // y con la app sana, el rescate NO puede aparecer
    const p3 = await limpio.newPage();
    await p3.goto(base + 'index.html', { timeout: 20000 });
    await p3.waitForTimeout(10500);
    const falsaAlarma = await p3.evaluate(() => !!document.getElementById('rescate'));
    await limpio.close();

    check('sin copia guardada y sin app.js, sale la pantalla de rescate, repara, y no salta en falso',
      rescate.sale && rescate.boton && /app\.js cargó: undefined/.test(rescate.info) &&
      reparado.pg === 'object' && reparado.main > 500 && falsaAlarma === false,
      JSON.stringify({ rescate, reparado, falsaAlarma }));
  }

  check('sin errores de JavaScript durante la sesión', pageErrors.length === 0, JSON.stringify(pageErrors));

  await browser.close();
  server.close();
  fs.rmSync(raiz, { recursive: true, force: true });

  results.forEach((r) => console.log((r.pass ? 'OK   — ' : 'FAIL — ') + r.name + (r.pass ? '' : '  (' + r.detail + ')')));
  const malas = results.filter((r) => !r.pass).length;
  console.log('\n' + (results.length - malas) + '/' + results.length + ' pruebas de actualización OK');
  process.exit(malas ? 1 : 0);
})().catch((e) => { console.error('la suite ha fallado al ejecutarse:', e); process.exit(1); });
