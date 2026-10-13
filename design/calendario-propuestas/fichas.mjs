/* Las fichas del calendario, estáticas: seis objetos del kit, uno por tipo de día, para usarlos como símbolos
   en Mes (la casilla), Semana (la fila), Hoy (la cabecera) y la leyenda. Hoy la casilla dice el tipo con un
   emoji + texto («8–15», «☾ URG»); la ficha lo dice sola y las horas solo salen cuando no son las de siempre.
   node fichas.mjs → fichas.html, fichas-light.html y fichas.svg (los <symbol>) */
import { writeFileSync } from "node:fs";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { CSS, rect } from "./comun.mjs";

const C = 30, BOX = { x: 0, y: 0, w: C, d: C, r: 2 };
const P = k.fitProjection([...k.boxCorners({ x: -3, y: -3, w: C + 6, d: C + 6 }, 0, 0), [C / 2, C / 2, 24]], 120, 108, { pad: 4, azimuth: 66, elevation: 46 });
const S = (paths, o) => k.solidSvg(paths, o), L = (d, o) => k.lineSvg(d, o), D = (p, o) => k.dotsSvg(p, o), at = (p) => k.iso(p, P);
const front = (y) => k.sideMatrix([0, y], 0, P, "left"), side = (x) => k.sideMatrix([x, 0], 0, P, "right"), top = (z) => k.topMatrix([0, 0], z, P, "x");
const cx = C / 2, cy = C / 2, z = 2.6;

function baldosa(cls) {
  return `<path class="iso-halo" d="${k.haloOf(BOX, 0, 2.6, P)}"/>` + S(k.slabOf(BOX, 0, 2.6, P, 3, 0.6), { tone: "mid", className: cls || "m-tile" }) +
    L(k.planOutline(k.insetPlan(BOX, 1.6), 2.62, P), { tone: "faint" }) + D(k.corners(BOX, 3).map(([x, y]) => at([x, y, 2.62])), { size: 0.3 });
}
/* el autobús: caja, techo con el letrero del tipo, luna delantera, dos ruedas, faros y la línea de la puerta */
function bus(lv) {
  const B = { x: 4, y: cy - 6, w: 22, d: 9, r: 1.6 }, zb = z + 1.2; let o = "";
  for (const wx of [B.x + 4.4, B.x + B.w - 4.4]) for (const wy of [B.y + 0.6, B.y + B.d - 0.6]) { const F = G.frameAlong([wx, wy, zb + 0.6], [0, 1, 0]); o += S(G.disc(-0.9, 0.9, 1.8, F, P), { tone: "lo", className: "m-tyre" }); }
  o += S(k.slabOf(B, zb, 9, P, 3, 0.5), { tone: "mid", className: "m-bus" });
  o += S(k.slabOf({ x: B.x + 0.8, y: B.y + 0.7, w: B.w - 1.6, d: B.d - 1.4, r: 1.2 }, zb + 9, 0.9, P, 3, 0.3), { tone: "mid", className: lv });
  o += `<g transform="${front(B.y + B.d + 0.02)}"><path class="glass" d="${rect(B.x + 1.6, zb + 4.2, B.x + B.w - 1.6, zb + 7.4)}"/>` +
    `<path class="glass" d="${rect(B.x + B.w - 5.2, zb + 0.8, B.x + B.w - 2.2, zb + 3.6)}"/></g>`;   /* ventanas y la puerta */
  o += `<g transform="${side(B.x + B.w + 0.02)}"><path class="glass" d="${rect(-(B.y + B.d) + 1.2, zb + 4.2, -B.y - 1.2, zb + 7.4)}"/></g>`;   /* la luna delantera */
  o += D([at([B.x + B.w + 0.02, B.y + 1.6, zb + 2.2]), at([B.x + B.w + 0.02, B.y + B.d - 1.6, zb + 2.2])], { size: 0.45, tone: "hi" });   /* faros */
  o += L(k.onTop([[B.x + 2, B.y + 0.7], [B.x + 2, B.y + B.d - 0.7]], zb + 9.02, P), { tone: "faint" });   /* la junta del techo */
  return o;
}
const T = {};
T.jornada = bus("m-work");
T.fuerza = bus("m-gym");
/* la guardia: el búho, un tambor azul noche con la luna encima y el aro del tipo (ámbar URG, violeta UMI) */
T.guardia = S(k.cylinder(cx + 2, cy - 2, 8, z, 12, P, 28, 0.8), { tone: "mid", className: "m-guard" }) + L(k.ring(cx + 2, cy - 2, 6, z + 12.02, P, 28), { className: "l-amber" }) +
  S(G.sphereOf([cx + 2, cy - 2, z + 15.2], 3.6, P), { tone: "hi", className: "m-moon" }) + D([at([cx + 2 - 1.2, cy - 2, z + 16.6]), at([cx + 2 + 1.2, cy - 2, z + 16.4])], { size: 0.5, tone: "lo" });
T.guardiaUmi = T.guardia.replace("l-amber", "l-umi");
/* el saliente: la cochera a la izquierda (la caseta con la persiana en su cara visible) y la flecha pintada en la
   baldosa que entra por la puerta: vienes de la guardia y te vas a dormir */
T.saliente = S(k.slabOf({ x: 3, y: cy - 6.5, w: 8.5, d: 13, r: 0.4 }, z, 9, P, 2, 0.3), { tone: "mid", className: "m-concrete" }) +
  S(k.slabOf({ x: 2.4, y: cy - 7.1, w: 9.7, d: 14.2, r: 0.6 }, z + 9, 1.2, P, 2, 0.4), { tone: "lo", className: "m-steel" }) +
  `<g transform="${side(11.5 + 0.02)}"><path class="glass" d="${rect(-(cy + 4.6), z + 0.4, -(cy - 4.6), z + 7)}"/></g>` +
  L([1.9, 3.4, 4.9, 6.4].map((h) => k.pathOf([at([11.53, cy - 4.6, z + h]), at([11.53, cy + 4.6, z + h])])).join(""), { tone: "faint" }) +   /* las lamas de la persiana */
  S(k.slabOf({ x: 16, y: cy - 1.4, w: 11, d: 2.8, r: 0.6 }, z, 0.6, P, 2), { tone: "mid", className: "m-guard" }) +
  L(k.onTop([[17, cy - 4.4], [12.4, cy], [17, cy + 4.4]], z + 0.62, P), { className: "l-sal" });
/* el libre: el árbol del bosque, con una segunda copa más baja */
T.libre = S(k.cylinder(cx + 2, cy - 2, 1.3, z, 6, P, 12), { tone: "mid", className: "m-trunk", crease: "none" }) +
  S(G.sphereOf([cx + 2, cy - 2, z + 10.5], 5.6, P), { tone: "mid", className: "m-leaf" }) + S(G.sphereOf([cx + 5.4, cy - 4.2, z + 8.4], 3.2, P), { tone: "mid", className: "m-leaf" });
/* las vacaciones: el autocar amarillo, más largo, con la ventana corrida y el maletero */
T.vacaciones = (() => { const B = { x: 2.5, y: cy - 7, w: 25, d: 10, r: 2.4 }, zb = z + 1.4; let o = "";
  for (const wx of [B.x + 5, B.x + B.w - 5]) for (const wy of [B.y + 0.6, B.y + B.d - 0.6]) { const F = G.frameAlong([wx, wy, zb + 0.6], [0, 1, 0]); o += S(G.disc(-0.9, 0.9, 2, F, P), { tone: "lo", className: "m-tyre" }); }
  o += S(k.slabOf(B, zb, 11, P, 3, 0.7), { tone: "mid", className: "m-vac" });
  o += `<g transform="${front(B.y + B.d + 0.02)}"><path class="glass" d="${rect(B.x + 2, zb + 6, B.x + B.w - 2, zb + 9.6)}"/><path class="glass" d="${rect(B.x + 2, zb + 1.2, B.x + 7, zb + 4.6)}"/></g>`;
  o += `<g transform="${side(B.x + B.w + 0.02)}"><path class="glass" d="${rect(-(B.y + B.d) + 1.4, zb + 5, -B.y - 1.4, zb + 9.8)}"/></g>`;
  o += L(k.onTop([[B.x + 1.4, B.y + 1], [B.x + B.w - 1.4, B.y + 1]], zb + 11.02, P) + k.onTop([[B.x + 1.4, B.y + B.d - 1], [B.x + B.w - 1.4, B.y + B.d - 1]], zb + 11.02, P), { tone: "faint" });
  return o; })();

const NOM = { jornada: "jornada", fuerza: "día de fuerza", guardia: "guardia (URG)", guardiaUmi: "guardia (UMI)", saliente: "saliente", libre: "libre", vacaciones: "vacaciones" };
const CLS = { guardia: "m-guard", guardiaUmi: "m-guard" };
const figs = Object.keys(T).map((n) => ({ n, svg: k.figureSvg({ width: 120, height: 108, label: "ficha: " + NOM[n], body: baldosa(CLS[n]) + T[n], className: "ficha" }) }));
const symbols = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${figs.map((f) => f.svg.replace(/<svg[^>]*>/, `<symbol id="f-${f.n}" viewBox="0 0 120 108">`).replace("</svg>", "</symbol>")).join("")}</svg>`;
writeFileSync("fichas.svg", symbols);
for (const theme of ["dark", "light"]) {
  const body = `<h1>Las fichas, estáticas</h1><p>Seis objetos del kit, uno por tipo de día. Los mismos que en el tablero isométrico, pero como <b>símbolos fijos</b> (un <code>&lt;symbol&gt;</code> cada uno, 73 KB en total, frente a los 300 KB de la vista isométrica viva) para la casilla de Mes, la fila de Semana, la cabecera de Hoy y la leyenda. La ficha dice el tipo sola: las horas solo se escriben cuando no son las de siempre.</p>
  <div class="hoja">${figs.map((f) => `<figure><div class="iso-plate">${f.svg}</div><figcaption>${NOM[f.n]}</figcaption></figure>`).join("")}</div>
  <h2>A tamaño de casilla (28 px) y a 4×</h2><div class="fila">${figs.map((f) => `<svg class="mini" viewBox="0 0 120 108"><use href="#f-${f.n}"/></svg>`).join("")}</div>
  <div class="fila">${figs.slice(0, 3).map((f) => `<svg class="x4" viewBox="0 0 120 108"><use href="#f-${f.n}"/></svg>`).join("")}</div>${symbols}`;
  writeFileSync(theme === "dark" ? "fichas.html" : "fichas-light.html", k.pageHtml({ title: "Las fichas del calendario", theme, width: 760, body }).replace("</style>", CSS +
    `.hoja{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.hoja figure{margin:0}.hoja .iso-plate{padding:0}.hoja figcaption{font:700 12px/1.4 ui-sans-serif,system-ui;color:var(--anatomy-text);text-align:center;margin-top:4px}
     h1{font-size:20px;color:var(--anatomy-strong);margin:0 0 6px}h2{font-size:15px;color:var(--anatomy-strong);margin:22px 0 8px}p{max-width:720px}p b{color:var(--anatomy-strong)}
     .fila{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}.mini{width:28px;height:25px}.x4{width:112px;height:101px}</style>`));
}
console.log("fichas:", figs.length, "símbolos,", Math.round(symbols.length / 1024), "KB");
