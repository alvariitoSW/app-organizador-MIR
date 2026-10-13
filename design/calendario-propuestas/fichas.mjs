/* Las fichas del calendario, estáticas: seis objetos del kit, uno por tipo de día, para usarlos como símbolos
   en Mes (la casilla), Semana (la fila), Hoy (la cabecera) y la leyenda. Hoy la casilla dice el tipo con un
   emoji + texto («8–15», «☾ URG»); la ficha lo dice sola y las horas solo salen cuando no son las de siempre.
   node fichas.mjs → fichas.html, fichas-light.html y fichas.svg (los <symbol>) */
import { writeFileSync } from "node:fs";
import { basename } from "node:path";
const MAIN = !!process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]));
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { CSS, rect } from "./comun.mjs";

const C = 30, BOX = { x: 0, y: 0, w: C, d: C, r: 2 };
const P = k.fitProjection([...k.boxCorners({ x: -3, y: -3, w: C + 6, d: C + 6 }, 0, 0), [C / 2, C / 2, 24]], 120, 108, { pad: 4, azimuth: 66, elevation: 46 });

/* las piezas, para cualquier proyección y baldosa de lado C: las usa esta hoja (fichas fijas) y el tablero
   isométrico vivo de Mes (design/semana-mes-iso/app.mjs), que así enseña las mismas figuras */
export function fichasDe(P, C) {
const BOX = { x: 0, y: 0, w: C, d: C, r: 2 };
const S = (paths, o) => k.solidSvg(paths, o), L = (d, o) => k.lineSvg(d, o), D = (p, o) => k.dotsSvg(p, o), at = (p) => k.iso(p, P);
const front = (y) => k.sideMatrix([0, y], 0, P, "left"), side = (x) => k.sideMatrix([x, 0], 0, P, "right"), top = (z) => k.topMatrix([0, 0], z, P, "x");
const cx = C / 2, cy = C / 2, z = 2.6;

function baldosa(cls) {
  return `<path class="iso-halo" d="${k.haloOf(BOX, 0, 2.6, P)}"/>` + S(k.slabOf(BOX, 0, 2.6, P, 3, 0.6), { tone: "mid", className: cls || "m-tile" }) +
    L(k.planOutline(k.insetPlan(BOX, 1.6), 2.62, P), { tone: "faint" }) + D(k.corners(BOX, 3).map(([x, y]) => at([x, y, 2.62])), { size: 0.3 });
}
/* el autobús: caja, techo con el letrero del tipo, luna delantera, ruedas, faros y la puerta. El de la jornada es el
   urbano, largo y claro con el letrero rojo-naranja; el del entreno es el microbús violeta, más corto, con la barra
   de pesas en la baca: que se distingan de un vistazo */
function bus({ w, cuerpo, letrero, baca }) {
  const B = { x: (C - w) / 2, y: cy - 6, w, d: 9, r: 1.6 }, zb = z + 1.2; let o = "";
  for (const wx of [B.x + 4.2, B.x + B.w - 4.2]) for (const wy of [B.y + 0.6, B.y + B.d - 0.6]) { const F = G.frameAlong([wx, wy, zb + 0.6], [0, 1, 0]); o += S(G.disc(-0.9, 0.9, 1.8, F, P, { steps: 12 }), { tone: "lo", className: "m-tyre" }); }
  o += S(k.slabOf(B, zb, 9, P, 3, 0.5), { tone: "mid", className: cuerpo });
  o += S(k.slabOf({ x: B.x + 0.8, y: B.y + 0.7, w: B.w - 1.6, d: B.d - 1.4, r: 1.2 }, zb + 9, 0.9, P, 3, 0.3), { tone: "mid", className: letrero });
  o += `<g transform="${front(B.y + B.d + 0.02)}"><path class="glass" d="${rect(B.x + 1.6, zb + 4.2, B.x + B.w - 1.6, zb + 7.4)}"/>` +
    `<path class="glass" d="${rect(B.x + B.w - 5.2, zb + 0.8, B.x + B.w - 2.2, zb + 3.6)}"/></g>`;   /* ventanas y la puerta */
  o += `<g transform="${side(B.x + B.w + 0.02)}"><path class="glass" d="${rect(-(B.y + B.d) + 1.2, zb + 4.2, -B.y - 1.2, zb + 7.4)}"/></g>`;   /* la luna delantera */
  o += D([at([B.x + B.w + 0.02, B.y + 1.6, zb + 2.2]), at([B.x + B.w + 0.02, B.y + B.d - 1.6, zb + 2.2])], { size: 0.45, tone: "hi" });   /* faros */
  if (baca) {   /* la barra de pesas en la baca: la barra a lo largo y dos discos en cada punta */
    const zt = zb + 9.9 + 1.4, xm = B.x + B.w / 2, Fb = G.frameAlong([xm, cy, zt], [1, 0, 0]);
    o += S(G.disc(-B.w / 2 + 1.2, B.w / 2 - 1.2, 0.35, Fb, P), { tone: "lo", className: "m-steel" });
    for (const sx of [-B.w / 2 + 1.4, -B.w / 2 + 3.0, B.w / 2 - 3.0, B.w / 2 - 1.4]) o += S(G.disc(sx - 0.6, sx + 0.6, 2.1, Fb, P, { steps: 12 }), { tone: "mid", className: "m-tyre" });
    o += L(k.pathOf([at([xm - 3, cy, zb + 9.9]), at([xm - 3, cy, zt])]) + k.pathOf([at([xm + 3, cy, zb + 9.9]), at([xm + 3, cy, zt])]), { tone: "faint" });
  } else o += L(k.onTop([[B.x + 2, B.y + 0.7], [B.x + 2, B.y + B.d - 0.7]], zb + 9.02, P), { tone: "faint" });   /* la junta del techo */
  return o;
}
const T = {};
T.jornada = bus({ w: 23, cuerpo: "m-bus", letrero: "m-work" });
T.fuerza = bus({ w: 15, cuerpo: "m-gym", letrero: "m-gym", baca: true });
/* la guardia: el tren, rojo chillón y mucho más grande que el resto (se sale de la baldosa): la locomotora con la
   cabina atrás, la chimenea y el faro, y un vagón detrás. El aro del tipo va en el techo de la cabina (ámbar URG,
   violeta UMI) */
function tren(aro) {
  const y0 = cy - 7, d = 11, zb = z + 1.6, LOC = { x: -7, y: y0, w: 26, d, r: 1.4 }, VAG = { x: LOC.x + LOC.w + 1.2, y: y0 + 0.5, w: 19, d: d - 1, r: 1.2 }, W = { steps: 12 }; let o = "";
  for (const B of [VAG, LOC]) for (const wx of [B.x + 4, B.x + B.w - 4]) for (const wy of [B.y + 0.5, B.y + B.d - 0.5]) { const F = G.frameAlong([wx, wy, zb + 0.4], [0, 1, 0]); o += S(G.disc(-1, 1, 2.2, F, P, W), { tone: "lo", className: "m-tyre" }); }
  o += S(k.slabOf(VAG, zb, 9, P, 3, 0.5), { tone: "mid", className: "m-rojo" });   /* el vagón, detrás de la cabina */
  o += `<g transform="${front(VAG.y + VAG.d + 0.02)}">${[0, 1, 2].map((i) => `<path class="glass" d="${rect(VAG.x + 1.6 + i * 5.6, zb + 4, VAG.x + 5.6 + i * 5.6, zb + 7.4)}"/>`).join("")}</g>`;
  o += S(k.slabOf({ x: LOC.x, y: LOC.y + 1.2, w: 15, d: d - 2.4, r: 1.2 }, zb, 7.5, P, 3, 0.5), { tone: "mid", className: "m-rojo" });   /* la caldera, delante */
  o += S(k.slabOf({ x: LOC.x + 15, y: LOC.y, w: 11, d, r: 1.2 }, zb, 13, P, 3, 0.6), { tone: "mid", className: "m-rojo" });   /* la cabina */
  o += S(k.slabOf({ x: LOC.x + 15.6, y: LOC.y + 0.7, w: 9.8, d: d - 1.4, r: 1 }, zb + 13, 1, P, 3, 0.3), { tone: "mid", className: "m-rojot" });   /* el techo */
  o += L(k.ring(LOC.x + 20.5, cy - 1.5, 3.4, zb + 14.02, P, 16), { className: aro });
  o += S(k.cylinder(LOC.x + 4, cy - 1.5, 2, zb + 7.5, 5, P, 12, 0.4), { tone: "mid", className: "m-rojot" });   /* la chimenea */
  o += S(G.sphereOf([LOC.x + 4, cy - 1.5, zb + 14], 2.4, P, { steps: 20 }), { tone: "hi", className: "m-moon" });   /* el humo */
  o += `<g transform="${front(LOC.y + LOC.d + 0.02)}"><path class="glass" d="${rect(LOC.x + 17, zb + 6, LOC.x + 24, zb + 11)}"/></g>`;   /* la ventana de la cabina */
  o += `<g transform="${side(LOC.x + 0.02)}"><path class="glass" d="${rect(-(LOC.y + d) + 3.6, zb + 2.4, -LOC.y - 3.6, zb + 5.6)}"/></g>`;
  o += D([at([LOC.x - 0.02, cy - 1.5, zb + 4.2])], { size: 0.9, tone: "hi" });   /* el faro */
  o += S(k.slabOf({ x: LOC.x - 2.4, y: LOC.y + 1.6, w: 3, d: d - 3.2, r: 0.4 }, zb - 0.6, 2.4, P, 2, 0.3), { tone: "lo", className: "m-rojot" });   /* el quitapiedras */
  return o;
}
T.guardia = tren("l-amber");
T.guardiaUmi = tren("l-umi");
/* la casa con jardín: el césped sobre la baldosa, la casa con el tejado a dos aguas, la puerta y la ventana, el seto
   y el árbol. El saliente vuelve a casa a dormir: la luna sobre el tejado y la flecha que entra por la puerta. Las
   vacaciones son la misma casa de día, con la sombrilla y la piscina */
function casa({ luna, piscina, flecha }) {
  let o = S(k.slabOf({ x: 2, y: 2, w: C - 4, d: C - 4, r: 2 }, z, 0.5, P, 3, 0.2), { tone: "mid", className: "m-cesped" });
  const H = { x: 5, y: 9, w: 13, d: 12, r: 0.3 }, zh = z + 0.5, hw = 7;
  o += S(k.slabOf(H, zh, hw, P, 2, 0.2), { tone: "mid", className: "m-casa" });
  const F = G.frameAlong([H.x, H.y + H.d / 2, zh + hw], [1, 0, 0]);   /* el tejado: un prisma triangular a lo largo de x */
  o += S(G.prismOf(F, [[-(H.d / 2 + 1), 0], [H.d / 2 + 1, 0], [0, 5]], -0.8, H.w + 0.8, P), { tone: "mid", className: "m-tejado" });
  o += `<g transform="${front(H.y + H.d + 0.02)}"><path class="glass" d="${rect(H.x + 2, zh + 0.1, H.x + 5, zh + 4.4)}"/><path class="glass" d="${rect(H.x + 7.5, zh + 2.6, H.x + 11, zh + 5.4)}"/></g>`;   /* la puerta y la ventana */
  o += `<g transform="${side(H.x + H.w + 0.02)}"><path class="glass" d="${rect(-(H.y + H.d) + 3, zh + 2.6, -H.y - 3, zh + 5.4)}"/></g>`;
  o += S(k.cylinder(23.5, 8, 1.1, z + 0.5, 4, P, 10), { tone: "mid", className: "m-trunk", crease: "none" }) + S(G.sphereOf([23.5, 8, z + 7.6], 4, P, { steps: 24 }), { tone: "mid", className: "m-leaf" });   /* el árbol */
  o += S(k.slabOf({ x: 4, y: 23.5, w: 16, d: 2.2, r: 0.8 }, z + 0.5, 2, P, 2, 0.4), { tone: "mid", className: "m-leaf" });   /* el seto */
  if (piscina) { o += S(k.slabOf({ x: 20, y: 17, w: 7.5, d: 9, r: 1.2 }, z + 0.5, 0.3, P, 3), { tone: "hi", className: "m-agua" });
    const Fs = G.frameAlong([23, 14, z + 0.5], [0, 0, 1]); o += S(G.disc(0, 6, 0.25, Fs, P), { tone: "lo", className: "m-steel" }) + S(G.disc(5.6, 6.4, 3.2, Fs, P, { steps: 14 }), { tone: "mid", className: "m-vac" }); }   /* la sombrilla */
  if (luna) o += S(G.sphereOf([H.x + H.w / 2 + 2, H.y + 2, zh + hw + 9.5], 2.6, P, { steps: 24 }), { tone: "hi", className: "m-moon" }) + D([at([H.x + H.w / 2 + 0.8, H.y + 2, zh + hw + 10.6]), at([H.x + H.w / 2 + 3.2, H.y + 2, zh + hw + 10.4])], { size: 0.4, tone: "lo" });
  if (flecha) o += L(k.onTop([[H.x + 3.5, H.y + H.d + 7], [H.x + 3.5, H.y + H.d + 0.6]], z + 0.52, P) + k.onTop([[H.x + 1.6, H.y + H.d + 3], [H.x + 3.5, H.y + H.d + 0.6], [H.x + 5.4, H.y + H.d + 3]], z + 0.52, P), { className: "l-sal" });
  return o;
}
T.saliente = casa({ luna: true, flecha: true });
/* el libre: el árbol del bosque, con una segunda copa más baja */
T.libre = S(k.cylinder(cx + 2, cy - 2, 1.3, z, 6, P, 12), { tone: "mid", className: "m-trunk", crease: "none" }) +
  S(G.sphereOf([cx + 2, cy - 2, z + 10.5], 5.6, P), { tone: "mid", className: "m-leaf" }) + S(G.sphereOf([cx + 5.4, cy - 4.2, z + 8.4], 3.2, P), { tone: "mid", className: "m-leaf" });
T.vacaciones = casa({ piscina: true });
return { T, baldosa };
}
const { T, baldosa } = fichasDe(P, C);

const NOM = { jornada: "jornada", fuerza: "día de fuerza", guardia: "guardia (URG)", guardiaUmi: "guardia (UMI)", saliente: "saliente", libre: "libre", vacaciones: "vacaciones" };
const CLS = { guardia: "m-rojo", guardiaUmi: "m-rojo" };
export { T, baldosa, NOM, CLS };
const figs = Object.keys(T).map((n) => ({ n, svg: k.figureSvg({ width: 120, height: 108, label: "ficha: " + NOM[n], body: baldosa(CLS[n]) + T[n], className: "ficha" }) }));
const symbols = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${figs.map((f) => f.svg.replace(/<svg[^>]*>/, `<symbol id="f-${f.n}" viewBox="0 0 120 108" overflow="visible">`).replace("</svg>", "</symbol>")).join("")}</svg>`;
export const SYMBOLS = symbols;
if (MAIN) writeFileSync("fichas.svg", symbols);
if (MAIN) for (const theme of ["dark", "light"]) {
  const body = `<h1>Las fichas, estáticas</h1><p>Siete objetos del kit, uno por tipo de día: el tren rojo de la guardia (mucho más grande, se sale de su baldosa), el autobús urbano de la jornada y el microbús violeta del entreno con la barra en la baca, la casa con jardín del saliente (con la luna) y de las vacaciones (con la piscina), y el árbol del libre. Los mismos que en el tablero isométrico, pero como <b>símbolos fijos</b> (un <code>&lt;symbol&gt;</code> cada uno, 112 KB en total, frente a los 300 KB de la vista isométrica viva) para la casilla de Mes, la fila de Semana, la cabecera de Hoy y la leyenda. La ficha dice el tipo sola: las horas solo se escriben cuando no son las de siempre.</p>
  <div class="hoja">${figs.map((f) => `<figure><div class="iso-plate">${f.svg}</div><figcaption>${NOM[f.n]}</figcaption></figure>`).join("")}</div>
  <h2>A tamaño de casilla (28 px) y a 4×</h2><div class="fila">${figs.map((f) => `<svg class="mini" viewBox="0 0 120 108"><use href="#f-${f.n}"/></svg>`).join("")}</div>
  <div class="fila">${figs.slice(0, 3).map((f) => `<svg class="x4" viewBox="0 0 120 108"><use href="#f-${f.n}"/></svg>`).join("")}</div>${symbols}`;
  writeFileSync(theme === "dark" ? "fichas.html" : "fichas-light.html", k.pageHtml({ title: "Las fichas del calendario", theme, width: 760, body }).replace("</style>", CSS +
    `.hoja{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.hoja figure{margin:0}.hoja .iso-plate{padding:0}.hoja figcaption{font:700 12px/1.4 ui-sans-serif,system-ui;color:var(--anatomy-text);text-align:center;margin-top:4px}
     h1{font-size:20px;color:var(--anatomy-strong);margin:0 0 6px}h2{font-size:15px;color:var(--anatomy-strong);margin:22px 0 8px}p{max-width:720px}p b{color:var(--anatomy-strong)}
     .fila{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}.mini{width:28px;height:25px}.x4{width:112px;height:101px}</style>`));
}
if (MAIN) console.log("fichas:", figs.length, "símbolos,", Math.round(symbols.length / 1024), "KB");
