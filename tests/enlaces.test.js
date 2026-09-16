/*
 * Cargar una receta a partir del enlace: la cadena de intentos y sus salidas.
 *
 * Va aparte de la suite grande porque necesita fingir la red de otros dominios (TikTok y los
 * lectores públicos) escenario a escenario, y eso ahí dentro se pisaría con las demás pruebas.
 *
 * Ninguna prueba sale de verdad a internet: todo son respuestas fingidas con page.route().
 * Lo que NO se puede comprobar desde aquí es si TikTok deja de verdad que un navegador le pida la
 * descripción (el entorno de desarrollo no tiene salida a tiktok.com). Por eso la app está hecha
 * para averiguarlo en el momento y ofrecer una salida, en vez de dar nada por supuesto.
 *
 * Uso: node tests/enlaces.test.js
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png' };

function serveStatic() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
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

const PIE = 'Lentejas de la abuela\nIngredientes:\n500 g lenteja pardina\n200 g chorizo\n2 zanahoria\n' +
  'Preparación:\nSofríe el ajo 8 min\nCuece 25 min a fuego suave';
const OEMBED = JSON.stringify({ title: PIE, author_name: '@cocina' });
const VIDEO = 'https://www.tiktok.com/@cocina/video/7300000000000000000';

(async () => {
  const server = await serveStatic();
  const base = `http://127.0.0.1:${server.address().port}/`;
  const preinstalled = '/opt/pw-browsers/chromium';
  const browser = await chromium.launch({
    executablePath: fs.existsSync(preinstalled) ? preinstalled : undefined,
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  const compartir = () => base + 'index.html?url=' + encodeURIComponent(VIDEO);
  const estado = () => page.evaluate(() => {
    const r = window.PG.ui.imp.receta;
    return {
      tab: window.PG.ui.tab,
      estado: window.PG.ui.imp.estado,
      msg: window.PG.ui.imp.msg || '',
      receta: r ? { n: r.name, ing: r.ingredients.length, pasos: r.steps.length } : null,
      ficha: !!document.querySelector('[data-imp="previa"]'),
      publico: window.PG.store.lector.publico,
    };
  });

  // 1) el caso que se pidió: llega SOLO el enlace y la receta tiene que quedar lista sin tocar nada
  await page.route('https://www.tiktok.com/oembed**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: OEMBED }));
  await page.goto(compartir());
  await page.waitForTimeout(1200);
  const directo = await estado();
  check('mandar solo el enlace deja la receta leída y su ficha en pantalla, sin tocar nada',
    directo.tab === 'import' && directo.estado === '' && directo.ficha &&
    directo.receta && directo.receta.n === 'Lentejas de la abuela' &&
    directo.receta.ing === 3 && directo.receta.pasos === 2, JSON.stringify(directo));
  await page.unroute('https://www.tiktok.com/oembed**');

  // 2) si la plataforma no deja, se ofrecen las DOS salidas — y no se activa nada a espaldas del usuario
  await page.route('https://www.tiktok.com/oembed**', (r) => r.abort('failed'));
  await page.evaluate(() => localStorage.clear());
  await page.goto(compartir());
  await page.waitForTimeout(1500);
  const bloqueado = await estado();
  const salidas = await page.evaluate(() => ({
    publico: !!document.querySelector('[data-a="lector-publico"]'),
    propio: !!document.querySelector('[data-a="ir-lector"]'),
  }));
  check('si la plataforma no deja, se ofrecen las dos salidas y no se activa ningún tercero solo',
    bloqueado.estado === 'error' && salidas.publico && salidas.propio && bloqueado.publico === false,
    JSON.stringify({ ...bloqueado, ...salidas }));

  // 3) un toque en «usar un lector público» reintenta y saca la receta
  await page.route('https://api.allorigins.win/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: OEMBED }));
  await page.click('[data-a="lector-publico"]');
  await page.waitForTimeout(1200);
  const conPublico = await estado();
  check('un toque en «lector público» reintenta y saca la receta',
    conPublico.publico === true && conPublico.estado === '' &&
    conPublico.receta && conPublico.receta.ing === 3, JSON.stringify(conPublico));

  // 4) si el primer lector público está caído, se prueba el siguiente
  await page.unroute('https://api.allorigins.win/**');
  await page.route('https://api.allorigins.win/**', (r) =>
    r.fulfill({ status: 503, contentType: 'text/html', body: '<h1>down</h1>' }));
  await page.route('https://api.codetabs.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: OEMBED }));
  await page.evaluate(() => { window.PG.ui.imp.receta = null; window.PG.ui.imp.txt = ''; window.PG.render(); });
  await page.click('[data-a="imp-traer"]');
  await page.waitForTimeout(1500);
  const segundo = await estado();
  check('si el primer lector público está caído, se prueba el siguiente',
    segundo.estado === '' && segundo.receta, JSON.stringify(segundo));

  // 5) «no hay descripción» es una respuesta, no un fallo de camino: no se van paseando los enlaces
  // por todos los intermediarios para acabar en lo mismo
  let enBalde = 0;
  await page.unroute('https://api.allorigins.win/**');
  await page.unroute('https://api.codetabs.com/**');
  await page.route('https://api.allorigins.win/**', (r) => { enBalde++; r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); });
  await page.route('https://api.codetabs.com/**', (r) => { enBalde++; r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); });
  await page.unroute('https://www.tiktok.com/oembed**');
  await page.route('https://www.tiktok.com/oembed**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.evaluate(() => { window.PG.ui.imp.receta = null; window.PG.ui.imp.txt = ''; window.PG.render(); });
  await page.click('[data-a="imp-traer"]');
  await page.waitForTimeout(1500);
  const vacio = await estado();
  check('un vídeo sin descripción se dice y punto: no se pasea el enlace por los intermediarios',
    vacio.estado === 'error' && /no traía descripción/.test(vacio.msg) && enBalde === 0,
    JSON.stringify({ ...vacio, enBalde }));

  // 6) con lector propio puesto, NADA sale hacia terceros — ni siquiera a la plataforma
  let terceros = 0;
  await page.unroute('https://api.allorigins.win/**');
  await page.unroute('https://api.codetabs.com/**');
  await page.unroute('https://www.tiktok.com/oembed**');
  await page.route('https://api.allorigins.win/**', (r) => { terceros++; r.abort('failed'); });
  await page.route('https://api.codetabs.com/**', (r) => { terceros++; r.abort('failed'); });
  await page.route('https://www.tiktok.com/oembed**', (r) => { terceros++; r.abort('failed'); });
  await page.route('https://mi-lector.workers.dev/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ texto: PIE, autor: '@cocina' }) }));
  await page.evaluate(() => {
    window.PG.store.lector.proxy = 'https://mi-lector.workers.dev';
    window.PG.save();
    window.PG.ui.imp.receta = null; window.PG.ui.imp.txt = ''; window.PG.render();
  });
  await page.click('[data-a="imp-traer"]');
  await page.waitForTimeout(1500);
  const propio = await estado();
  check('con lector propio puesto no sale nada hacia terceros, ni siquiera a la plataforma',
    propio.estado === '' && propio.receta && terceros === 0,
    JSON.stringify({ ...propio, terceros }));

  check('sin errores de JavaScript durante la sesión', pageErrors.length === 0, JSON.stringify(pageErrors));

  await browser.close();
  server.close();

  results.forEach((r) => console.log((r.pass ? 'OK   — ' : 'FAIL — ') + r.name + (r.pass ? '' : '  (' + r.detail + ')')));
  const malas = results.filter((r) => !r.pass).length;
  console.log('\n' + (results.length - malas) + '/' + results.length + ' pruebas de enlaces OK');
  process.exit(malas ? 1 : 0);
})().catch((e) => { console.error('la suite ha fallado al ejecutarse:', e); process.exit(1); });
