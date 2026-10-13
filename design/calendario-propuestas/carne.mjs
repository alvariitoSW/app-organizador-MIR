/* El carné de abono del mes: UNA tarjeta que junta lo que hoy son cuatro bloques de Mes (el abono, la cuadrícula
   de seis semanas, la leyenda y «Este mes»). Es la tarjeta de transporte del conductor: arriba el mes y el
   servicio grabados; en medio el mes como rejilla de 5×7 con una marca por día (la tinta del tipo: rojo jornada,
   azul noche guardia con su luna, verde libre, ámbar vacaciones) y UN AGUJERO TALADRADO por día ya pasado; a la
   derecha las tres cifras (guardias hechas de las del cupo, horas de servicio, findes libres); abajo la regla
   del mes con el día de hoy marcado. El chip dorado y la pinza son los de una tarjeta de verdad.
   Tocar el carné abriría la hoja del mes (cupo, servicio, vacaciones, repartir): lo que hoy es «Este mes».
   node carne.mjs → carne.html, carne-light.html */
import { writeFileSync } from "node:fs";
import { basename } from "node:path";
const MAIN = !!process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]));
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { CSS, rect } from "./comun.mjs";

/* los datos del mes de ejemplo (octubre 2026, el de las capturas): tipo por día, hoy el 13 */
const TIPO = {}; for (let d = 1; d <= 31; d++) { const w = new Date(2026, 9, d).getDay(); TIPO[d] = w === 0 || w === 6 ? "libre" : "jornada"; }
Object.assign(TIPO, { 3: "guardia", 8: "guardia", 13: "guardia", 19: "guardia", 24: "guardia", 28: "guardia", 4: "saliente", 9: "saliente", 14: "saliente", 20: "saliente", 25: "saliente", 29: "saliente", 30: "vacaciones", 31: "vacaciones" });
const UMI = { 8: 1, 24: 1 }, HOY = 13, LEAD = 3;   /* octubre 2026 empieza en jueves: tres huecos */
const CIFRAS = [["2/6", "GUARDIAS"], ["186 h", "SERVICIO"], ["2", "FINDES"]];

const CARD0 = { x: 0, y: 0, w: 172, d: 108, r: 7 }, CZ = 0, CH = 3.2;
const MAT = { x: -22, y: -18, w: 216, d: 146, r: 8 };
const S = (paths, o) => k.solidSvg(paths, o), L = (d, o) => k.lineSvg(d, o), D = (p, o) => k.dotsSvg(p, o);
export function dibuja(P, conMat, W, H, corto, huecos) {
const CARD = corto ? { x: 0, y: 0, w: 172, d: 58, r: 7 } : CARD0;
const at = (p) => k.iso(p, P), top = (z) => k.topMatrix([0, 0], z, P, "x");
const out = [];
if (conMat) {

/* la alfombrilla del escritorio con sus cuatro tornillos y la regla */
out.push(`<path class="iso-halo" d="${k.haloOf(MAT, -6, 6, P)}"/>`);
out.push(S(k.slabOf(MAT, -6, 6, P, 8, 1.2), { tone: "lo", className: "m-mat" }));
out.push(L(k.planOutline(k.insetPlan(MAT, 4), 0.01, P), { tone: "faint" }));
const scr = k.corners(MAT, 8);
out.push(L(scr.map(([x, y]) => k.ring(x, y, 1.6, 0.01, P, 16)).join(""), { tone: "lo" }), D(scr.map(([x, y]) => at([x, y, 0.01])), { size: 0.45 }));
}

/* la tarjeta: cuerpo con bisel, el filo claro y la banda del tipo de abono en la esquina */
out.push(`<path class="iso-halo" d="${k.haloOf(CARD, CZ, CH, P)}"/>`);
out.push(S(k.slabOf(CARD, CZ, CH, P, 8, 0.8), { tone: "mid", className: "m-card" }));
out.push(S(k.slabOf({ x: 0, y: 0, w: 172, d: 22, r: 7 }, CZ + CH, 0.3, P, 8), { tone: "mid", className: "m-cardl", crease: "none" }));   /* la cabecera, una lámina más clara */
out.push(L(k.planOutline(k.insetPlan(CARD, 3), CZ + CH + 0.02, P), { tone: "faint" }));
/* el chip dorado con sus ocho contactos y la pinza con su agujero */
const CHIP = { x: 148, y: 5, w: 16, d: 13, r: 1.4 };
out.push(S(k.slabOf(CHIP, CZ + CH, 0.6, P, 3, 0.2), { tone: "mid", className: "m-chip" }));
out.push(L([CHIP.y + 4.3, CHIP.y + 8.6].map((y) => k.lineOnTop([CHIP.x + 1, y], [CHIP.x + CHIP.w - 1, y], CZ + CH + 0.62, P)).join("") + k.lineOnTop([CHIP.x + 5.3, CHIP.y + 1], [CHIP.x + 5.3, CHIP.y + CHIP.d - 1], CZ + CH + 0.62, P) + k.lineOnTop([CHIP.x + 10.6, CHIP.y + 1], [CHIP.x + 10.6, CHIP.y + CHIP.d - 1], CZ + CH + 0.62, P), { tone: "lo" }));
out.push(S(k.cylinder(10, 11, 3.2, CZ - 0.01, CH + 0.02, P, 24), { tone: "lo", className: "m-hole", crease: "none" }));
out.push(S(k.slabOf({ x: 4, y: 6.5, w: 12, d: 9, r: 4.5 }, CZ + CH + 0.3, 1.6, P, 8, 0.4), { tone: "hi", className: "m-steel" }));   /* la pinza, una lengüeta de acero */
out.push(S(k.cylinder(10, 11, 2.2, CZ + CH + 1.9, 0.4, P, 20), { tone: "lo", className: "m-hole", crease: "none" }));
/* los textos grabados de la cabecera */
out.push(`<g transform="${top(CZ + CH + 0.33)}"><text class="grab" data-r="mes" x="22" y="10">ABONO · OCTUBRE 2026</text><text class="grab s" data-r="sub" x="22" y="17">URGENCIAS · GUARDIAS DE 17 H · JORNADA 8–15</text></g>`);

const GX = 8, GY = 28, CW = corto ? 22 : 14, CHh = 13.6, g = (d) => { const i = d - 1 + LEAD; return [GX + (i % 7) * CW, GY + Math.floor(i / 7) * CHh]; };
const DOW = ["L", "M", "X", "J", "V", "S", "D"];
if (!corto) {
out.push(`<g transform="${top(CZ + CH + 0.02)}">${DOW.map((n, i) => `<text class="dn pas" x="${GX + i * CW + 5}" y="${GY - 1.6}">${n}</text>`).join("")}</g>`);
out.push(L(Array.from({ length: 6 }, (_, r) => k.lineOnTop([GX, GY + r * CHh], [GX + 7 * CW, GY + r * CHh], CZ + CH + 0.02, P)).join("") + Array.from({ length: 8 }, (_, c) => k.lineOnTop([GX + c * CW, GY], [GX + c * CW, GY + 5 * CHh], CZ + CH + 0.02, P)).join(""), { tone: "faint" }));
const marcas = [], agujeros = [], numeros = [];
for (let d = 1; d <= 31; d++) {
  const [x, y] = g(d), t = TIPO[d], pasado = d < HOY, zz = CZ + CH;
  numeros.push(`<text class="dn${d === HOY ? " hoy" : pasado ? " pas" : ""}" x="${x + 1.4}" y="${y + 4.6}">${d}</text>`);
  if (pasado) agujeros.push(d);
  const px = x + CW - 4.8, py = y + CHh - 4.6;   /* la marca, abajo a la derecha del cuadro */
  if (t === "jornada") marcas.push(S(k.slabOf({ x: x + 3, y: py - 1.2, w: 8, d: 2.6, r: 0.8 }, zz, 0.5, P, 2), { tone: "mid", className: "m-work", crease: "none" }));
  else if (t === "guardia") marcas.push(S(k.cylinder(px, py, 3.2, zz, 2.2, P, 20, 0.3), { tone: "mid", className: "m-guard" }) + S(G.sphereOf([px, py, zz + 3.2], 1.2, P), { tone: "hi", className: "m-moon" }) + L(k.ring(px, py, 2.4, zz + 2.22, P, 20), { className: UMI[d] ? "l-umi" : "l-amber" }));
  else if (t === "saliente") marcas.push(S(k.slabOf({ x: x + 3, y: py - 1, w: 5, d: 2, r: 0.6 }, zz, 0.4, P, 2), { tone: "mid", className: "m-guard", crease: "none" }) + L(k.onTop([[x + 9.5, py - 2.2], [x + 7.2, py], [x + 9.5, py + 2.2]], zz + 0.42, P), { className: "l-sal" }));
  else if (t === "vacaciones") marcas.push(S(k.slabOf({ x: x + 2.5, y: py - 1.6, w: 9, d: 3.2, r: 1.2 }, zz, 1.2, P, 3, 0.3), { tone: "mid", className: "m-vac" }));
  else marcas.push(S(k.cylinder(px, py, 0.6, zz, 1.2, P, 8), { tone: "mid", className: "m-trunk", crease: "none" }) + S(G.sphereOf([px, py, zz + 2.4], 1.7, P), { tone: "mid", className: "m-leaf" }));
}
/* hoy: el marco ámbar en su cuadro */
{ const [x, y] = g(HOY); out.push(L(k.planOutline({ x: x + 0.6, y: y + 0.6, w: CW - 1.2, d: CHh - 1.2, r: 1 }, CZ + CH + 0.03, P), { className: "l-amber" })); }
out.push(`<g transform="${top(CZ + CH + 0.03)}">${numeros.join("")}</g>`);
/* los agujeros taladrados: un cilindro oscuro que atraviesa la tarjeta, arriba a la derecha del cuadro */
for (const d of agujeros) { const [x, y] = g(d); out.push(`<path class="hole" d="${k.ring(x + CW - 3.4, y + 3.4, 1.5, CZ + CH + 0.03, P, 16)}"/>` + L(k.ring(x + CW - 3.4, y + 3.4, 1.5, CZ + CH + 0.03, P, 16), { tone: "lo" })); }
out.push(marcas.join(""));
/* las tres cifras grabadas a la derecha, con su rótulo y una línea de corte entre ellas */
CIFRAS.forEach(([v, lab], i) => { const y = 34 + i * 23;
  out.push(`<g transform="${top(CZ + CH + 0.03)}"><text class="grab g" x="112" y="${y + 9}">${v}</text><text class="grab" x="112" y="${y + 16}">${lab}</text></g>`);
  if (i) out.push(L(k.lineOnTop([110, y - 3], [166, y - 3], CZ + CH + 0.03, P), { tone: "faint" })); });
} else {
/* el carné corto: las tres cifras en fila, con sus cortes, y la regla debajo */
CIFRAS.forEach(([v, lab], i) => { const x = 10 + i * 54;
  out.push(`<g transform="${top(CZ + CH + 0.03)}"><text class="grab g" data-r="c${i}" x="${x}" y="38">${v}</text><text class="grab" data-r="l${i}" x="${x}" y="45">${lab}</text></g>`);
  if (i) out.push(L(k.lineOnTop([x - 6, 28], [x - 6, 47], CZ + CH + 0.03, P), { tone: "faint" })); });
}
/* la regla del mes al pie: un tic por día, mayor cada 7, y la aguja de hoy */
const RY = corto ? 53 : 100, tk = k.topTicks(GX, GX + 7 * CW, 7 * CW / 31, 7, RY, CZ + CH + 0.03, [1.6, 3], P);
out.push(L(k.lineOnTop([GX, RY], [GX + 7 * CW, RY], CZ + CH + 0.03, P), { tone: "lo" }), L(tk.minor, { tone: "lo" }), L(tk.major, { tone: "mid" }));
const hxDe = (d) => GX + (d - 0.5) * 7 * CW / 31, hx = hxDe(huecos ? 1 : HOY);
const AG = []; if (huecos) { const o = k.iso([hx, RY - 2.4, CZ + CH], P); for (let d = 1; d <= 31; d++) { const p = k.iso([hxDe(d), RY - 2.4, CZ + CH], P); AG.push([+(p[0] - o[0]).toFixed(2), +(p[1] - o[1]).toFixed(2)]); } }
out.push(`<g data-r="aguja" data-pos="${AG.map((p) => p.join(",")).join(";")}">` + S(k.cylinder(hx, RY - 2.4, 1.3, CZ + CH, 1.2, P, 12), { tone: "hi", className: "m-amber", lit: true }) + `</g>`);
out.push(`<g transform="${top(CZ + CH + 0.03)}"><text class="dn" data-r="ult" x="${GX + 7 * CW + 2}" y="${RY + 1.5}">31</text><text class="dn" x="${GX - 1}" y="${RY + 1.5}" text-anchor="end">1</text></g>`);
/* la banda magnética, en el canto trasero: una franja oscura en la cara +y */
out.push(`<g transform="${k.sideMatrix([0, CARD.d + 0.02], 0, P, "left")}"><path class="hole" style="opacity:.55" d="${rect(10, CZ + 0.9, 162, CZ + 2.3)}"/></g>`);

return k.figureSvg({ width: W, height: H, label: "El carné de abono de octubre: el mes como rejilla de 5×7 con una marca por tipo de día y un agujero por día pasado, las tres cifras del mes y la regla con el día de hoy.", body: out });
}
export const corto = () => dibuja(k.fitProjection([...k.boxCorners({ x: 0, y: 0, w: 172, d: 58 }, -2, 0), ...k.boxCorners({ x: 0, y: 0, w: 172, d: 58 }, 0, 6)], 600, 180, { pad: 6, azimuth: 84, elevation: 64 }), false, 600, 180, true, true);
if (MAIN) {
const svg = dibuja(k.fitProjection([...k.boxCorners(MAT, -6, 0), ...k.boxCorners(CARD0, 0, 14)], 640, 380, { pad: 10, azimuth: 58, elevation: 50 }), true, 640, 380);
const movil = dibuja(k.fitProjection([...k.boxCorners(CARD0, -2, 0), ...k.boxCorners(CARD0, 0, 6)], 600, 300, { pad: 6, azimuth: 84, elevation: 64 }), false, 600, 300);
writeFileSync("carne-movil.svg", movil.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
const corto = dibuja(k.fitProjection([...k.boxCorners({ x: 0, y: 0, w: 172, d: 58 }, -2, 0), ...k.boxCorners({ x: 0, y: 0, w: 172, d: 58 }, 0, 6)], 600, 180, { pad: 6, azimuth: 84, elevation: 64 }), false, 600, 180, true);
writeFileSync("carne-corto.svg", corto.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
for (const theme of ["dark", "light"]) {
  const body = `<h1>El carné de abono</h1><p>Una sola tarjeta para lo que hoy son cuatro bloques de Mes: el abono (99 px), la cuadrícula de seis semanas (845 px), la leyenda (50 px) y «Este mes» (298 px). Arriba, el mes y el servicio grabados; en medio, el mes entero en 5×7 con la marca de cada tipo de día (la misma tinta que las fichas) y <b>un agujero taladrado por día ya pasado</b>; a la derecha, las tres cifras; abajo, la regla del mes con la aguja de hoy. <b>Tocar el carné abre la hoja del mes</b>: cupo, servicio, vacaciones y repartir, lo que ahora es «Este mes».</p>
  ${k.plateHtml({ fig: "Fig 2", title: "Mes · el carné de abono", hint: "toca el carné: la hoja del mes", body: svg, caption: "Octubre 2026: 6 guardias (4 URG, 2 UMI), 2 hechas, 12 días pasados taladrados, vacaciones el 30 y 31." })}
  <h2>A 390 px de ancho (en la pantalla de Mes): solo la tarjeta, más desde arriba</h2><div style="width:358px">${movil}</div>
  <h2>El carné corto: solo la cabecera, las cifras y la regla (encima de la cuadrícula)</h2><div style="width:358px">${corto}</div>`;
  writeFileSync(theme === "dark" ? "carne.html" : "carne-light.html", k.pageHtml({ title: "El carné de abono", theme, width: 700, body }).replace("</style>", CSS +
    `h1{font-size:20px;color:var(--anatomy-strong);margin:0 0 6px}h2{font-size:15px;color:var(--anatomy-strong);margin:22px 0 8px}p{max-width:700px}p b{color:var(--anatomy-strong)}</style>`));
}
console.log("carné:", Math.round(svg.length / 1024), "KB · móvil", Math.round(movil.length / 1024), "KB · corto", Math.round(corto.length / 1024), "KB");
}
