#!/usr/bin/env node
// Conduce la app de verdad: sirve el repo, abre Chromium a 412×915 (el móvil del usuario), salta el
// asistente de primer arranque y ejecuta una orden por línea leída de stdin. Una línea = un paso;
// cada paso imprime una línea de resultado. Al final: errores de JS de la página (si hay) y sale.
//
//   node .claude/skills/verify/driver.mjs [--out DIR] [--size 412x915] [--wizard] <<'EOF'
//   nav comer
//   click [data-a="food-prev"]
//   ss ayer
//   EOF
//
// Órdenes:
//   nav <cal|mes|semana|hoy|entreno|comer|menu|nevera|compra|consumo|dinero|…>  ir a una sección (por la UI)
//   ui <clave>=<valor> [...]        poner campos de PG.ui y render() (valores JSON o texto)
//   click <selector>                clic (por selector: no guarda el nodo, así no se «suelta»)
//   fill <selector> <texto>         escribir y disparar change (fill solo no lo dispara)
//   press <selector> <tecla>        p. ej. press #frIn Enter
//   back                            el atrás del móvil (history.back)
//   wait <ms>
//   eval <js>                       expresión evaluada en la página; imprime el resultado en JSON
//   text [selector]                 innerText (por defecto #main), compactado
//   ss <nombre>                     captura de página completa (desde arriba) en OUT/<nombre>.png
//   ssv <nombre>                    captura solo de lo que se ve ahora (sin desplazar)
//   seed <fichero.js>               ejecuta un fichero JS en la página (para sembrar datos con PG)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const OUT = path.resolve(opt('--out', '/tmp/guardias-driver'));
const [W, H] = opt('--size', '412x915').split('x').map(Number);
const WIZARD = args.includes('--wizard');
fs.mkdirSync(OUT, { recursive: true });

// servidor estático propio, en un puerto libre: el de `python3 -m http.server` en segundo plano
// se muere solo a menudo en este contenedor y las capturas salen de «ERR_CONNECTION_REFUSED»
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const URL0 = `http://127.0.0.1:${server.address().port}/index.html`;

// el playwright de npm no casa con el Chromium preinstalado: siempre el binario fijo
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(URL0);
await page.waitForFunction(() => window.PG && window.PG.store);
if (!WIZARD) {
  // contexto nuevo = localStorage vacío = asistente de primer arranque, que no pinta ni la barra
  await page.evaluate(() => { const P = window.PG; P.store.meta.montada = true; P.ui.arranque = null; P.save(); P.render(); });
}

const NAV = {
  cal: ['[data-a="nav-cal"]'], mes: ['[data-a="nav-cal"]', '#calModes button[data-t="month"]'],
  semana: ['[data-a="nav-cal"]', '#calModes button[data-t="week"]'], hoy: ['[data-a="nav-cal"]', '#calModes button[data-t="hoy"]'],
  entreno: ['[data-a="tab"][data-t="gym"]'], comer: ['[data-a="nav-comer"]'],
  menu: ['[data-a="nav-comer"]', '#calModes button[data-t="types"]'], compra: ['[data-a="nav-comer"]', '#calModes button[data-t="shop"]'],
  nevera: ['[data-a="nav-comer"]', '#calModes button[data-v="nevera2"]'],
};
const parseVal = (v) => { try { return JSON.parse(v); } catch { return v; } };
const lines = fs.readFileSync(0, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
let fallos = 0;
for (const line of lines) {
  const [cmd, ...rest] = line.split(' ');
  const arg = rest.join(' ');
  let out = 'ok';
  try {
    if (cmd === 'nav') {
      const pasos = NAV[arg];
      if (pasos) for (const s of pasos) { await page.click(s, { timeout: 5000 }); await page.waitForTimeout(80); }
      else { // las del cajón (consumo, dinero, habitos, notas, eventos, cfg, data, ajustes…)
        await page.click('[data-a="drawer-toggle"]', { timeout: 5000 }); await page.waitForTimeout(120);
        await page.click(`#drawer [data-a="drawer-nav"][data-t="${arg}"]`, { timeout: 5000 });
      }
      out = await page.evaluate(() => window.PG.ui.tab);
    } else if (cmd === 'ui') {
      const kv = Object.fromEntries(rest.map((p) => { const i = p.indexOf('='); return [p.slice(0, i), parseVal(p.slice(i + 1))]; }));
      await page.evaluate((kv) => { Object.assign(window.PG.ui, kv); window.PG.render(); }, kv);
    } else if (cmd === 'click') { await page.click(arg, { timeout: 5000 }); }
    else if (cmd === 'fill') {
      const sel = rest[0], txt = rest.slice(1).join(' ');
      await page.fill(sel, txt, { timeout: 5000 }); await page.dispatchEvent(sel, 'change');
    } else if (cmd === 'press') { await page.press(rest[0], rest[1], { timeout: 5000 }); }
    else if (cmd === 'back') { await page.goBack(); }
    else if (cmd === 'wait') { await page.waitForTimeout(+arg || 100); continue; }
    else if (cmd === 'eval') { out = JSON.stringify(await page.evaluate(arg)); }
    else if (cmd === 'text') { out = await page.$eval(arg || '#main', (e) => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 1500)); }
    else if (cmd === 'ss') {
      // la barra de arriba es fija: con la página desplazada, una captura completa la pinta a media altura
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(60);
      const f = path.join(OUT, (arg || 'shot') + '.png'); await page.screenshot({ path: f, fullPage: true }); out = f; }
    else if (cmd === 'ssv') { const f = path.join(OUT, (arg || 'shot') + '.png'); await page.screenshot({ path: f }); out = f; }
    else if (cmd === 'seed') { await page.evaluate(fs.readFileSync(path.resolve(arg), 'utf8')); await page.evaluate(() => { window.PG.save(); window.PG.render(); }); }
    else { out = 'orden desconocida'; fallos++; }
    await page.waitForTimeout(80);   // render() y las hojas se pintan en el mismo tick, pero hay retardos (buscador)
  } catch (e) { out = 'ERROR ' + String(e.message || e).split('\n')[0]; fallos++; }
  console.log(`> ${line}\n  ${out}`);
}
if (errs.length) { console.log('ERRORES JS:\n  ' + errs.join('\n  ')); fallos++; }
await browser.close(); server.close();
process.exit(fallos ? 1 : 0);
