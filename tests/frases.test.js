/*
 * EL BANCO DE FRASES: lo que la gente escribe de verdad al apuntar lo que ha comido, cada frase con
 * lo que la app TIENE que entender. Es la red del lector: un cambio que arregla una frase y rompe
 * otra no pasa.
 *
 * Cada caso de tests/frases.json:
 *   f        la frase tal cual
 *   tiene    trozos de nombre que tienen que salir entre lo apuntado (sin tildes; «a|b» = cualquiera)
 *   no       trozos que NO pueden salir (lo que se colaba antes: «tomate» en «una lata de atún»)
 *   pregunta trozos que tienen que quedar como pregunta («filete» → ¿de qué?), con opciones
 *   dudas    cuántas preguntas exactamente (0 = lo entiende todo)
 *   kcal     [mín, máx] de lo apuntado
 *   pos      la comida que sale de la frase («de cena…» → cena)
 *
 * Uso: node tests/frases.test.js  (o npm run test:frases)
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const CASOS = JSON.parse(fs.readFileSync(path.join(__dirname, 'frases.json'), 'utf8'));
const sinTildes = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

(async () => {
  const server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    fs.readFile(p, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const pre = '/opt/pw-browsers/chromium';
  const browser = await chromium.launch({ executablePath: fs.existsSync(pre) ? pre : undefined });
  const page = await browser.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.PG && window.PG.store);
  await page.evaluate(() => { const P = window.PG; P.store.meta.montada = true; P.ui.arranque = null; P.save(); P.render(); });

  const leidos = await page.evaluate((frases) => {
    const P = window.PG;
    const nombreDe = (x) => {
      const out = [];
      if (x.pl) out.push(x.pl);
      if (x.dish) { const d = P.dishById(x.dish); if (d) out.push(d.name); }
      if (x.fuera) { const b = P.buscableDe(x.fuera); out.push(b ? b.nombre : x.nom); }
      if (x.ean) out.push(x.nom || '');
      if (x.id) { const a = P.alimById(x.id); if (a) out.push(a.n); }
      return out.join(' / ');
    };
    return frases.map((f) => {
      try {
        const fr = P.fraseLeer(f);
        if (!fr) return { f, vacio: true };
        const m = P.fraseMacros(fr);
        return {
          f, pos: fr.pos || '', kcal: m.kcal,
          items: fr.items.map((x) => ({ n: nombreDe(x), g: x.g || 0, rac: x.rac || 0 })),
          dudas: (fr.dudas || []).map((d) => ({ txt: d.txt, nopc: (d.opc || []).length })),
          nombre: P.fraseNombre(fr),
        };
      } catch (e) { return { f, error: String(e && e.stack || e) }; }
    });
  }, CASOS.map((c) => c.f));

  const fallos = [];
  CASOS.forEach((c, i) => {
    const r = leidos[i], mal = [];
    if (r.error) mal.push('ERROR ' + r.error.split('\n')[0]);
    else if (r.vacio) mal.push('no devuelve nada');
    else {
      const noms = r.items.map((x) => sinTildes(x.n));
      const huecos = r.items.filter((x) => !x.n);
      if (huecos.length) mal.push('hay ' + huecos.length + ' trozo(s) sin nombre');
      // «macarron|pasta»: vale cualquiera de los dos
      const hay = (t) => t.split('|').some((u) => noms.some((n) => n.includes(sinTildes(u))));
      (c.tiene || []).forEach((t) => { if (!hay(t)) mal.push('falta «' + t + '»'); });
      (c.no || []).forEach((t) => { if (noms.some((n) => n.includes(sinTildes(t)))) mal.push('sobra «' + t + '»'); });
      (c.pregunta || []).forEach((t) => {
        const d = r.dudas.find((x) => t.split('|').some((u) => sinTildes(x.txt).includes(sinTildes(u))));
        if (!d) mal.push('no pregunta «' + t + '»'); else if (!d.nopc) mal.push('pregunta «' + t + '» sin opciones');
      });
      if (c.dudas != null && r.dudas.length !== c.dudas) mal.push(r.dudas.length + ' preguntas (esperaba ' + c.dudas + ': ' + r.dudas.map((d) => d.txt).join(', ') + ')');
      if (c.kcal && (r.kcal < c.kcal[0] || r.kcal > c.kcal[1])) mal.push(r.kcal + ' kcal (esperaba ' + c.kcal[0] + '–' + c.kcal[1] + ')');
      if (c.pos != null && r.pos !== c.pos) mal.push('va a «' + r.pos + '» (esperaba «' + c.pos + '»)');
    }
    if (mal.length) fallos.push({ c, r, mal });
  });

  const verbose = process.argv.includes('-v');
  fallos.forEach(({ c, r, mal }) => {
    console.log('✗ «' + c.f + '»  →  ' + mal.join(' · '));
    if (verbose && r && r.items) console.log('    lee: ' + r.items.map((x) => x.n + (x.g ? ' ' + x.g + 'g' : '') + (x.rac ? ' ×' + x.rac : '')).join(' | ') +
      (r.dudas.length ? '  ¿? ' + r.dudas.map((d) => d.txt + '(' + d.nopc + ')').join(', ') : '') + '  = ' + r.kcal + ' kcal');
  });
  if (errores.length) console.log('Errores de JavaScript: ' + errores.join(' | '));
  console.log('\n' + (CASOS.length - fallos.length) + '/' + CASOS.length + ' frases del banco OK');
  await browser.close();
  server.close();
  process.exit(fallos.length || errores.length ? 1 : 0);
})();
