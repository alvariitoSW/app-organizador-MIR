/*
 * LA TABLA DE LA APP, FUERA DEL NAVEGADOR: saca de app.js la tabla de alimentos (ALIMENTOS y
 * ALIMENTOS_MAS) y el juez del gluten (glutenDe) para comprobar el recetario en node, sin abrir la
 * app; y las 43 recetas de siempre (TP_RECETAS). Se lee el código tal cual está en app.js (no una
 * copia), así que si la tabla o el juez cambian, la prueba del recetario lo nota.
 * Lo usan tests/recetario.test.js y tools/recetario-faltan.js.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* el trozo «const NOMBRE=…» hasta el cierre que le toca (`];` o `}` a principio de línea) */
function trozo(src, inicio, cierre) {
  const i = src.indexOf(inicio);
  if (i < 0) throw new Error('no encuentro «' + inicio + '» en app.js');
  const j = src.indexOf(cierre, i);
  if (j < 0) throw new Error('no encuentro el final de «' + inicio + '»');
  return src.slice(i, j + cierre.length);
}

function cargaTabla() {
  const src = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  const codigo = [
    trozo(src, 'function alimTxt(', '}\n'),
    trozo(src, 'const GLUTEN_SI=[', '];\n'),
    trozo(src, 'const GLUTEN_DEPENDE=[', '];\n'),
    /* la avena de la tabla es la suya, certificada (avenaSegura() por defecto dice que sí) */
    'function avenaSegura(){return true;}',
    trozo(src, 'function glutenDe(', '\n  return est;}'),
    trozo(src, 'const ALIMENTOS=[', '\n];'),
    trozo(src, 'const ALIMENTOS_MAS=[', '}];\n'),
    trozo(src, 'const TP_RECETAS=[', ']]];\n'),
    'this.R={alimTxt,glutenDe,ALIMENTOS,ALIMENTOS_MAS,TP_RECETAS};'
  ].join('\n');
  const ctx = {};
  vm.runInNewContext(codigo, ctx);
  const { alimTxt, glutenDe, ALIMENTOS, ALIMENTOS_MAS, TP_RECETAS } = ctx.R;
  /* como alimBase(): la primera con ese nombre manda */
  const porT = {};
  ALIMENTOS.concat(ALIMENTOS_MAS).forEach((a) => { const t = alimTxt(a.n); if (!(t in porT)) porT[t] = a; });
  return { alimTxt, glutenDe, porT, alim: (n) => porT[alimTxt(n)] || null, TP_RECETAS };
}

function cargaRecetario() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'recetario.json'), 'utf8'));
}

/* kcal y proteína de una ración, de la tabla (los gramos son por ración) */
function macros(T, r) {
  let kcal = 0, prot = 0;
  r.ing.forEach(([n, g]) => { const a = T.alim(n); if (a) { kcal += a.kcal * g / 100; prot += (a.pr || 0) * g / 100; } });
  return { kcal: Math.round(kcal), prot: Math.round(prot) };
}

module.exports = { ROOT, cargaTabla, cargaRecetario, macros };
