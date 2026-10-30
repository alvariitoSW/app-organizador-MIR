/*
 * EL RECETARIO SIN GLUTEN (data/recetario.json): cada receta tiene que llegar entera y ser segura para
 * un celíaco. Lo que se comprueba es lo que pidió el Consejo «El Chef» (acta 2026-10-30-chef.md):
 *   - todos los campos del esquema, con valores válidos (cocina, tipo, dificultad 1-3, equipo…);
 *   - cada ingrediente casa con la tabla de alimentos de la app (si no, no hay kcal ni compra);
 *   - ningún ingrediente lleva gluten según glutenDe (lo que lo lleva va como «X sin gluten»);
 *   - la etiqueta es coherente: todo lo «depende» y todo «X sin gluten» (hay que comprar el certificado)
 *     está en `etiqueta`, y `gluten` es «depende» si y solo si hay algo que mirar;
 *   - kcal y proteína razonables y las declaradas cuadran con la tabla (±10 %);
 *   - ≥3 pasos, temporizadores que apuntan a un paso que existe, sin platos repetidos (ni con las 43
 *     de siempre de TP_RECETAS);
 *   - ≤6 raciones por olla de 5-6 L.
 * Va en node, sin navegador: lee la tabla y glutenDe de app.js tal cual (tools/recetario-tabla.js).
 *
 * Uso: node tests/recetario.test.js
 */
'use strict';
const { cargaTabla, cargaRecetario, macros } = require('../tools/recetario-tabla.js');

const T = cargaTabla();
const R = cargaRecetario();
let fallos = 0, pasan = 0;
const mal = (r, que) => { fallos++; console.log('FAIL ' + (r && r.n ? r.n : '(sin nombre)') + ': ' + que); };

const COCINAS = ['es', 'it', 'gr', 'med'];
const TIPOS = ['cu', 'fr', 'ar', 'pa', 'pe', 'ca', 've', 'ta', 'de', 'po'];
const REGIONES = ['AND', 'ARA', 'AST', 'BAL', 'CAN', 'CTB', 'CLM', 'CYL', 'CAT', 'VAL', 'EXT', 'GAL', 'MAD', 'MUR', 'NAV', 'PV', 'RIO', 'ESP', 'IT', 'GR', 'MED'];
const CAMPOS = Object.keys(R.esquema || {});
const OPCIONALES = ['duda'];
const esTexto = (s) => typeof s === 'string' && s.trim().length > 0;

if (!Array.isArray(R.recetas) || !R.recetas.length) mal(null, 'no hay recetas');
/* las 43 de siempre (TP_RECETAS) ya están en la app: el recetario no las repite */
const vistos = {};
T.TP_RECETAS.forEach((x) => [x[0]].concat(x[2]).forEach((n) => { vistos[T.alimTxt(n).trim()] = -1; }));
(R.recetas || []).forEach((r, ir) => {
  const antes = fallos;
  /* los campos: todos los del esquema, y ninguno que el esquema no explique */
  CAMPOS.forEach((c) => { if (!(c in r) && OPCIONALES.indexOf(c) < 0) mal(r, 'falta el campo «' + c + '»'); });
  Object.keys(r).forEach((c) => { if (CAMPOS.indexOf(c) < 0) mal(r, 'campo sin explicar en el esquema: «' + c + '»'); });
  if (!esTexto(r.n)) mal(r, 'sin nombre');
  /* sin repetidos: ni el nombre ni sus alias pueden ser de otro plato */
  [r.n].concat(r.alias || []).forEach((x) => {
    const k = T.alimTxt(x).trim();
    if (k in vistos && vistos[k] !== ir) mal(r, '«' + x + '» ya es de «' + (vistos[k] < 0 ? 'las de siempre (TP_RECETAS)' : R.recetas[vistos[k]].n) + '»');
    vistos[k] = ir;
  });
  if (!/^[dcn]+$/.test(r.m || '')) mal(r, 'momentos no válidos: ' + r.m);
  if (!(r.min > 0 && r.min <= 300)) mal(r, 'minutos fuera de rango: ' + r.min);
  if (!(Number.isInteger(r.rac) && r.rac >= 1 && r.rac <= 8)) mal(r, 'raciones no válidas: ' + r.rac);
  if (COCINAS.indexOf(r.cocina) < 0) mal(r, 'cocina no válida: ' + r.cocina);
  if (TIPOS.indexOf(r.tipo) < 0) mal(r, 'tipo no válido: ' + r.tipo);
  if (REGIONES.indexOf(r.region) < 0) mal(r, 'región no válida: ' + r.region);
  const fuera = { it: 'IT', gr: 'GR', med: 'MED' }[r.cocina];
  if (fuera && r.region !== fuera) mal(r, 'cocina ' + r.cocina + ' con región ' + r.region);
  if (r.cocina === 'es' && ['IT', 'GR', 'MED'].indexOf(r.region) >= 0) mal(r, 'cocina española con región ' + r.region);
  if ([1, 2, 3].indexOf(r.dif) < 0) mal(r, 'dificultad no es 1-3: ' + r.dif);
  if (!(Number.isInteger(r.dias) && r.dias >= 0 && r.dias <= 5)) mal(r, 'días que aguanta fuera de 0-5: ' + r.dias);
  ['congela', 'tanda', 'fiesta'].forEach((c) => { if (typeof r[c] !== 'boolean') mal(r, c + ' no es true/false'); });

  /* el equipo */
  const q = r.equipo || {};
  if (!(Number.isInteger(q.fuegos) && q.fuegos >= 0 && q.fuegos <= 4)) mal(r, 'fuegos no válidos: ' + q.fuegos);
  if (!(typeof q.olla === 'number' && q.olla >= 0 && q.olla <= 12)) mal(r, 'olla en litros no válida: ' + q.olla);
  ['micro', 'horno', 'freidora'].forEach((c) => { if (typeof q[c] !== 'boolean') mal(r, 'equipo.' + c + ' no es true/false'); });
  if (!(Number.isInteger(q.expres) && q.expres >= 0 && q.expres <= 120)) mal(r, 'equipo.expres no válido: ' + q.expres);
  if (q.olla >= 5 && q.olla <= 6 && r.rac > 6) mal(r, 'más de 6 raciones en una olla de ' + q.olla + ' L');
  if (q.olla > 0 && !q.fuegos) mal(r, 'olla sin fuego');

  /* los ingredientes: casan con la tabla y ninguno lleva gluten */
  if (!Array.isArray(r.ing) || !r.ing.length) mal(r, 'sin ingredientes');
  const ingN = {};
  (r.ing || []).forEach((x) => {
    if (!Array.isArray(x) || !esTexto(x[0]) || !(x[1] > 0 && x[1] <= 600)) { mal(r, 'ingrediente mal escrito: ' + JSON.stringify(x)); return; }
    if (ingN[x[0]]) mal(r, 'ingrediente repetido: ' + x[0]);
    ingN[x[0]] = 1;
    if (!T.alim(x[0])) mal(r, '«' + x[0] + '» no está en la tabla de alimentos (tools/recetario-faltan.js)');
    if (T.glutenDe(x[0]) === 'si') mal(r, '«' + x[0] + '» lleva gluten');
  });

  /* la etiqueta, coherente con «depende» */
  const hayQueMirar = (r.ing || []).map((x) => x[0]).filter((n) =>
    T.glutenDe(n) === 'depende' || /sin gluten$/i.test(n));
  const et = r.etiqueta || [];
  hayQueMirar.forEach((n) => { if (et.indexOf(n) < 0) mal(r, '«' + n + '» depende de la marca y no está en etiqueta'); });
  et.forEach((n) => { if (!ingN[n]) mal(r, 'etiqueta nombra «' + n + '», que no está entre los ingredientes'); });
  if (r.gluten !== (et.length ? 'depende' : 'no')) mal(r, 'gluten «' + r.gluten + '» no cuadra con la etiqueta (' + et.length + ')');
  if (et.length ? !esTexto(r.aviso) : r.aviso !== '') mal(r, 'el aviso no cuadra con la etiqueta');

  /* kcal y proteína: razonables, y las declaradas cuadran con la tabla */
  const M = macros(T, r);
  const postre = r.tipo === 'po' || r.tipo === 'de';
  const [kMin, kMax] = postre ? [80, 650] : [150, 1100];
  if (!(M.kcal >= kMin && M.kcal <= kMax)) mal(r, M.kcal + ' kcal por ración, fuera de ' + kMin + '-' + kMax);
  if (!postre && ['cu', 'pe', 'ca', 'ar', 'pa'].indexOf(r.tipo) >= 0 && M.prot < 10) mal(r, 'solo ' + M.prot + ' g de proteína para un principal');
  if (Math.abs(r.kcal - M.kcal) > Math.max(20, M.kcal * 0.1)) mal(r, 'dice ' + r.kcal + ' kcal y la tabla da ' + M.kcal);
  if (Math.abs(r.prot - M.prot) > Math.max(2, M.prot * 0.1)) mal(r, 'dice ' + r.prot + ' g de proteína y la tabla da ' + M.prot);

  /* pasos y temporizadores */
  if (!Array.isArray(r.pasos) || r.pasos.length < 3) mal(r, 'menos de 3 pasos');
  (r.pasos || []).forEach((p, i) => { if (!esTexto(p) || p.length < 15) mal(r, 'paso ' + (i + 1) + ' vacío o muy corto'); });
  if (!Array.isArray(r.tmp)) mal(r, 'tmp no es una lista');
  (r.tmp || []).forEach((t) => {
    if (!(Number.isInteger(t.p) && t.p >= 0 && t.p < (r.pasos || []).length)) mal(r, 'temporizador en un paso que no existe: ' + JSON.stringify(t));
    if (!(t.min > 0 && t.min <= 1440)) mal(r, 'temporizador de ' + t.min + ' min');
    if (!esTexto(t.t)) mal(r, 'temporizador sin nombre');
  });

  /* lo que enseña */
  if (!Array.isArray(r.porque) || !r.porque.length || !r.porque.every(esTexto)) mal(r, 'sin trucos ni «por qué»');
  if (!esTexto(r.error)) mal(r, 'sin error típico');
  if (!Array.isArray(r.alias)) mal(r, 'alias no es una lista');

  if (fallos === antes) { pasan++; console.log('PASS ' + r.n + ' · ' + M.kcal + ' kcal · ' + M.prot + ' g P'); }
});

if (fallos) console.log('\n' + fallos + ' fallo(s)');
console.log((fallos ? '' : '\n') + pasan + '/' + (R.recetas || []).length + ' recetas del recetario OK');
process.exit(fallos ? 1 : 0);
