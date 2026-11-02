#!/usr/bin/env node
/* SUELO DE LETRA (C1 · «Letra y calma»). Repetible: correrlo dos veces no cambia nada la segunda.
 *
 *   node tools/suelo-letra.mjs            reescribe styles.css y app.js
 *   node tools/suelo-letra.mjs --seco     solo cuenta lo que cambiaría (no escribe)
 *
 * Qué hace
 *  - styles.css: todo `font-size:Npx` (y el tamaño dentro de `font:`) por debajo de 14 px pasa a la variable
 *    `--suelo` (N < 13 o N = 13) o a `max(Npx,var(--suelo))` (13 < N < 14). Así el suelo vive en UNA variable:
 *    `:root{--suelo:var(--t-13)}` y la pestaña Dinero lo sube con `body[data-tab="dinero"]{--suelo:14px}`.
 *    Para mover el suelo basta cambiar `--t-13` (o el 14 de Dinero). `var(--t-11)` y `var(--t-12)` también pasan
 *    a `var(--suelo)` (los dos escalones viejos de letra pequeña desaparecen).
 *  - app.js: los `style="…font-size:Npx"` con N ≤ 13 (texto visible en línea) pasan a `var(--suelo)`. Los
 *    `font-size="…"` de dentro de SVG (atributo) y los `<text style=…>` no se tocan.
 *  - Excepciones (NO se tocan): las casillas del Mes (.dbox y lo que va dentro: .dnum .dic .dline .dsl .dev
 *    .dgasto .dsem), la línea del día (.carril/.carrilbox), los textos dentro de SVG (.ico .num), la impresión
 *    (@media print y html.imp-mes), el calendario extendido (.cal.ext) y las franjas de guardia, saliente y
 *    conducir (.snord .snreloj .manana). Si una de ellas usaba var(--t-11/12) se fija en px para que no se mueva.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SUELO = 13;          /* debe coincidir con --t-13 de styles.css */
const SUELO_DINERO = 14;   /* debe coincidir con la regla de sección de Dinero */
const SECO = process.argv.includes('--seco');

const EXENTO = new RegExp([
  '\\.dbox\\b', '\\.dnum\\b', '\\.dic\\b', '\\.dline\\b', '\\.dsl\\b', '\\.dev\\b', '\\.dgasto\\b', '\\.dsem\\b',
  '\\.carril(box)?\\b', '\\.ico\\s+\\.num', 'imp-mes', '\\.cal\\.ext\\b',
  '\\.snord\\b', '\\.snreloj', '\\.manana\\b'
].join('|'));

function partirSelectores(s) {   /* coma de nivel superior (no las de :is(...)) */
  const out = []; let d = 0, ini = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(' || s[i] === '[') d++; else if (s[i] === ')' || s[i] === ']') d--;
    else if (s[i] === ',' && d === 0) { out.push(s.slice(ini, i)); ini = i + 1; }
  }
  out.push(s.slice(ini)); return out;
}

function bloques(css) {          /* los bloques de declaraciones, con su cabecera y su contexto (@media…) */
  const m = css.replace(/\/\*[\s\S]*?\*\//g, c => c.replace(/[^\n]/g, ' '));
  const res = [], pila = []; let seg = 0;
  for (let i = 0; i < m.length; i++) {
    const c = m[i];
    if (c === '{') { pila.push({h: m.slice(seg, i).trim(), ini: i + 1, hijos: 0}); if (pila.length > 1) pila[pila.length - 2].hijos++; seg = i + 1; }
    else if (c === '}') { const t = pila.pop(); if (t && !t.hijos) res.push({sel: t.h, ini: t.ini, fin: i, ctx: pila.map(x => x.h)}); seg = i + 1; }
    else if (c === ';') seg = i + 1;
  }
  return res;
}

function nuevoTam(n) {           /* n en px → lo que se escribe, o null si no cambia */
  if (n < SUELO || n === SUELO) return 'var(--suelo)';
  if (n < SUELO_DINERO) return 'max(' + n + 'px,var(--suelo))';
  return null;
}

function transformaCuerpo(cuerpo, exento) {
  let cambios = 0;
  let r = cuerpo;
  if (exento) {
    r = r.replace(/var\(--t-11\)/g, () => { cambios++; return '11px'; })
         .replace(/var\(--t-12\)/g, () => { cambios++; return '12.5px'; });
    return {r, cambios};
  }
  r = r.replace(/(font-size:\s*)([\d.]+)px/g, (t, a, n) => { const v = nuevoTam(+n); if (!v) return t; cambios++; return a + v; });
  r = r.replace(/(font-size:\s*)var\(--t-(?:11|12)\)/g, (t, a) => { cambios++; return a + 'var(--suelo)'; });
  r = r.replace(/(font:\s*(?:[a-z0-9-]+\s+)*?)([\d.]+)px/g, (t, a, n) => { const v = nuevoTam(+n); if (!v) return t; cambios++; return a + v; });
  return {r, cambios};
}

function procesaCss(css) {
  const bl = bloques(css).sort((a, b) => b.ini - a.ini);   /* de atrás adelante: los índices no se mueven */
  let out = css, total = 0;
  for (const b of bl) {
    const enImpresion = b.ctx.some(h => /^@media\s+print/i.test(h));
    const sels = partirSelectores(b.sel);
    const exento = enImpresion || sels.every(s => EXENTO.test(s));
    const mezcla = !exento && sels.some(s => EXENTO.test(s));
    if (mezcla) console.warn('AVISO selector mixto (exento + no exento), se trata como NO exento:', b.sel.replace(/\s+/g, ' ').slice(0, 100));
    const cuerpo = out.slice(b.ini, b.fin);
    const {r, cambios} = transformaCuerpo(cuerpo, exento);
    if (cambios) { out = out.slice(0, b.ini) + r + out.slice(b.fin); total += cambios; }
  }
  /* las variables: --t-13 y --suelo en :root, y la regla de sección de Dinero */
  if (!/--suelo\s*:/.test(out)) {
    out = out.replace('--t-11:11px;--t-12:12.5px;--t-14:14px;', '--t-11:11px;--t-12:12.5px;--t-13:13px;--t-14:14px;--suelo:var(--t-13);');
    out = out.replace(/\n:root\{/, m => m);   /* (sin cambio: la línea de arriba ya lleva las dos) */
    out += '\n/* SUELO DE LETRA (C1): ningún texto visible por debajo de --suelo; Dinero lo sube a 14 con UNA regla de sección.\n' +
           '   Lo reescribe tools/suelo-letra.mjs (repetible). Excepciones: casillas del Mes, línea del día, SVG, franjas de guardia. */\n' +
           'body[data-tab="dinero"]{--suelo:' + SUELO_DINERO + 'px}\n';
    total++;
  }
  /* <small> sin tamaño propio es el 83 % de su padre (10,8 px dentro de 13): también tiene suelo. Dentro de las excepciones, como estaba. */
  if (!/SUELO-SMALL/.test(out)) {
    out += '\n/* SUELO-SMALL: <small> hereda el 83 % del padre; con suelo. Las excepciones lo conservan. */\n' +
           'small{font-size:max(.83em,var(--suelo))}\n' +
           ':where(.dbox,.carrilbox,.snord,.snreloj,.manana,.cal.ext) small{font-size:.83em}\n';
    total++;
  }
  return {out, total};
}

function procesaApp(js) {
  let total = 0;
  const out = js.replace(/font-size:\s*([\d.]+)px/g, (t, n, pos) => {
    const num = +n; if (num > SUELO) return t;
    const ant = js.slice(Math.max(0, pos - 400), pos), lt = ant.lastIndexOf('<');
    if (lt >= 0 && /^<(text|tspan|svg|g|rect|circle|path)\b/.test(ant.slice(lt))) return t;   /* dentro de SVG */
    total++; return 'font-size:var(--suelo)';
  });
  return {out, total};
}

const fCss = path.join(RAIZ, 'styles.css'), fJs = path.join(RAIZ, 'app.js');
const css = fs.readFileSync(fCss, 'utf8'), js = fs.readFileSync(fJs, 'utf8');
const A = procesaCss(css), B = procesaApp(js);
console.log('styles.css: ' + A.total + ' tamaños cambiados · app.js: ' + B.total + ' tamaños cambiados' + (SECO ? ' (seco: no se escribe)' : ''));
if (!SECO) {
  if (A.out !== css) fs.writeFileSync(fCss, A.out);
  if (B.out !== js) fs.writeFileSync(fJs, B.out);
}
