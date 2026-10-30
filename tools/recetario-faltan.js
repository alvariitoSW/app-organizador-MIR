/*
 * LOS ALIMENTOS QUE FALTAN: recorre data/recetario.json y dice qué ingredientes no están en la tabla
 * de la app (ALIMENTOS / ALIMENTOS_MAS), con una línea de plantilla para pegar al final de
 * ALIMENTOS_MAS. Los valores por 100 g se rellenan a mano desde tablas oficiales (BEDCA; USDA si BEDCA
 * no lo trae). Lo que tiene gluten en su versión normal se añade como «X sin gluten».
 *
 * Uso: node tools/recetario-faltan.js            los que faltan en el recetario
 *      node tools/recetario-faltan.js "a, b, c"  comprueba además esos nombres sueltos
 */
'use strict';
const { cargaTabla, cargaRecetario } = require('./recetario-tabla.js');

const T = cargaTabla();
const R = cargaRecetario();
const usos = {};
R.recetas.forEach((r) => r.ing.forEach(([n]) => { (usos[n] = usos[n] || []).push(r.n); }));
(process.argv[2] || '').split(',').map((s) => s.trim()).filter(Boolean).forEach((n) => { usos[n] = usos[n] || ['(a mano)']; });

const faltan = Object.keys(usos).filter((n) => !T.alim(n)).sort();
if (!faltan.length) { console.log('No falta ninguno: los ' + Object.keys(usos).length + ' ingredientes están en la tabla.'); process.exit(0); }
console.log(faltan.length + ' que faltan:\n');
faltan.forEach((n) => {
  const g = T.glutenDe(n);
  const nombre = g !== 'no' ? n + ' sin gluten' : n;
  console.log('· ' + n + (g !== 'no' ? ' (gluten: ' + g + ')' : '') + ' — en ' + usos[n].slice(0, 3).join(', ') + (usos[n].length > 3 ? '…' : ''));
  console.log("  {n:'" + nombre + "',e:'',g:'',kcal:0,pr:0,ch:0,az:0,fi:0,gr:0,sa:0,r:[['1 ración',0]]},");
});
process.exit(1);
