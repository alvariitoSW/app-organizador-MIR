/* La estación de Hoy para la app: genera fig/estacion.js, un módulo sin dependencias que la pinta
   DENTRO de Hoy con los mismos datos que el conductor (window.Estacion.crea({onAbrir}) → {el, actualiza}).
   Es la maqueta de build.mjs con dos cosas más:
   - detrás del andén, un decorado que cambia con lo que toca: la ciudad cuando trabajas, el hospital de
     guardia, el polideportivo cuando entrenas y el bosque cuando estás libre (se funden entre sí);
   - la luz de la hora: cielo, sol y luna, y de tarde y de noche los materiales se apagan y se encienden
     las ventanas, las farolas y los focos del campo.
   node design/hoy-estacion/app.mjs → fig/estacion.js */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { persona } from "../hoy-escenas/piezas.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const WIDTH = 600, HEIGHT = 400;

/* ---------- el mundo (unidades ~ px; x a lo largo de la calzada, y hacia quien mira, z arriba) ---------- */
const PLATE = { x: -186, y: -152, w: 346, d: 186, r: 6 }, PLATE_H = 8, FOOT_H = 4;
const LANE = { x: -110, y: -6, w: 268, d: 26 };
const PLAT = { x: 26, y: -54, w: 130, d: 44, r: 2 }, PLAT_H = 5;
const ROOF = { x: 28, y: -58, w: 128, d: 50, r: 2 }, ROOF_Z = 60;
const POSTS = [[40, -46], [142, -46]];
const CLOCK = [92, -9.6, 46], CLOCK_R = 7.4;
const GAR = { x: -178, y: -46, w: 68, d: 68, r: 1 }, GAR_H = 46, DOOR = { y0: -4, y1: 18, h: 27 };
const ZF = 35.5, ALTO_CASA = 72;   /* la casa está encima de la cochera: el suelo del piso y la altura de sus paredes */
const BUS = { L: 60, W: 14, Z0: 3, Z1: 32 };
const SLOT = { bay: 44, s0: -24, s1: -94, garage: -174, exit: 196 };
/* el decorado vive detrás del andén: x de −182 a 156, y de −148 a −64 */
const FONDO = { x: -182, y: -148, w: 338, d: 82, r: 3 };

const ALTO = 104;
const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners({ x: FONDO.x, y: FONDO.y, w: FONDO.w, d: 40 }, 0, ALTO + 8), ...k.boxCorners(ROOF, 0, ROOF_Z + 4), ...k.boxCorners(GAR, 0, GAR_H + 3)],
  WIDTH, HEIGHT, { pad: 10, azimuth: 50, elevation: 27 });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const front = (y) => k.sideMatrix([0, y], 0, P, "left");     // la cara que mira hacia y+ : (u = x, v = −z)
const side = (x) => k.sideMatrix([x, 0], 0, P, "right");     // la cara que mira hacia x+ : (u = −y, v = −z)
const rect = (u0, z0, u1, z1) => `M${u0} ${-z1}H${u1}V${-z0}H${u0}Z`;
const quad = (pts) => k.pathOf(pts.map(at), true);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------- la peana ---------- */
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 16))) {
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H, 1.4, P, 28), { tone: "lo", className: "m-steel" }));
    out.push(S(k.cylinder(x, y, 4.6, -PLATE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 28), { tone: "mid", className: "m-steel" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", className: "m-base" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4.5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const lab = { x: 112, y: 24, w: 30, d: 7, r: 1 };
  out.push(S(k.slabOf(lab, 0, 0.6, P, 3), { tone: "mid", className: "m-steel", crease: "none" }));
  out.push(L([20, 14].map((w, i) => k.lineOnTop([lab.x + 3, lab.y + 2.4 + i * 2.2], [lab.x + 3 + w, lab.y + 2.4 + i * 2.2], 0.6, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([lab.x + lab.w - 2.4, lab.y + lab.d / 2, 0.6])], { size: 0.4 }));
  return out.join("");
}

/* ---------- el decorado: cuatro juegos sobre el mismo terreno ---------- */
/* un edificio: caja con cornisa, ventanas en las dos caras que se ven (unas se encienden de noche) y
   lo que lleva en la azotea */
function edificio(b, mat, sd, extra) {
  b = { r: 0.8, ...b };
  const out = [];
  out.push(S(k.slabOf(b, 0, b.h, P, 3, 0.6), { tone: "mid", className: mat }));
  out.push(S(k.slabOf({ x: b.x - 1, y: b.y - 1, w: b.w + 2, d: b.d + 2, r: 0.6 }, b.h, 2.2, P, 2, 0.4), { tone: "mid", className: mat }));
  out.push(L(k.planOutline(k.insetPlan({ x: b.x - 1, y: b.y - 1, w: b.w + 2, d: b.d + 2, r: 0.6 }, 2.4), b.h + 2.2, P), { tone: "faint" }));
  const wf = [], ws = [];
  for (let z = 8; z < b.h - 6; z += 9) {
    for (let u = b.x + 4; u < b.x + b.w - 6; u += 7) wf.push(`<path class="win${hash(sd + u * 3 + z) > 0.4 ? " w-on" : ""}" d="${rect(u, z, u + 4, z + 5.4)}"/>`);
    for (let u = -(b.y + b.d) + 4; u < -b.y - 6; u += 7) ws.push(`<path class="win${hash(sd + u * 5 + z * 2) > 0.45 ? " w-on" : ""}" d="${rect(u, z, u + 4, z + 5.4)}"/>`);
  }
  out.push(`<g transform="${front(b.y + b.d + 0.02)}">${wf.join("")}</g><g transform="${side(b.x + b.w + 0.02)}">${ws.join("")}</g>`);
  if (extra) out.push(extra(b));
  return out.join("");
}
const tejado = {
  deposito: (b) => {
    const cx = b.x + b.w * 0.35, cy = b.y + b.d * 0.4, z = b.h + 2.2, o = [];
    for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) o.push(S(k.cylinder(cx + dx, cy + dy, 0.6, z, 4, P, 8), { tone: "lo", className: "m-steel", crease: "none" }));
    o.push(S(k.cylinder(cx, cy, 5.2, z + 4, 7, P, 28), { tone: "mid", className: "m-wood" }));
    o.push(L(k.ring(cx, cy, 5.2, z + 7.6, P, 28), { tone: "faint" }));
    return o.join("");
  },
  maquinas: (b) => {
    const z = b.h + 2.2, o = [];
    for (const [fx, fy, w] of [[0.18, 0.25, 9], [0.55, 0.5, 7]]) {
      const pl = { x: b.x + b.w * fx, y: b.y + b.d * fy, w, d: 6, r: 0.6 };
      o.push(S(k.slabOf(pl, z, 4, P, 2, 0.4), { tone: "mid", className: "m-steel" }));
      o.push(L(k.ring(pl.x + w / 2, pl.y + 3, 2, z + 4, P, 16), { tone: "lo" }));
    }
    return o.join("");
  },
  antena: (b) => {
    const cx = b.x + b.w * 0.7, cy = b.y + b.d * 0.35, z = b.h + 2.2;
    return S(k.cylinder(cx, cy, 2, z, 1.2, P, 16), { tone: "mid", className: "m-steel" }) + S(k.cylinder(cx, cy, 0.5, z + 1.2, 18, P, 8), { tone: "mid", className: "m-steel", crease: "none" }) +
      D([at([cx, cy, z + 19.2])], { size: 0.9, className: "baliza" });
  },
};
const BLOQUES = [
  { x: -178, y: -144, w: 36, d: 32, h: 84, mat: "m-bld1", ex: tejado.maquinas },
  { x: -134, y: -138, w: 32, d: 30, h: 58, mat: "m-bld2", ex: tejado.deposito },
  { x: -94, y: -146, w: 42, d: 38, h: 104, mat: "m-bld3", ex: tejado.antena },
  { x: -44, y: -136, w: 34, d: 30, h: 66, mat: "m-bld2", ex: tejado.maquinas },
  { x: 0, y: -144, w: 44, d: 36, h: 90, mat: "m-bld1", ex: tejado.deposito },
  { x: 54, y: -134, w: 32, d: 28, h: 56, mat: "m-bld3", ex: null },
  { x: 96, y: -142, w: 54, d: 34, h: 78, mat: "m-bld2", ex: tejado.antena },
];
function terreno(mat) {
  return S(k.slabOf(FONDO, 0, 0.6, P, 3, 0.3), { tone: "mid", className: mat, crease: "none", flat: true });
}
/* la ciudad: aceras entre bloques y los edificios, de atrás adelante */
function ciudad(sinEl) {
  const out = [], bl = BLOQUES.filter((b, i) => i !== sinEl).sort((a, b) => k.depthOf([a.x + a.w / 2, a.y + a.d / 2, 0], P) - k.depthOf([b.x + b.w / 2, b.y + b.d / 2, 0], P));
  for (const b of bl) out.push(edificio(b, b.mat, b.x * 7 + b.y, b.ex));
  return out.join("");
}
/* el hospital ocupa el sitio del quinto bloque: blanco, cruz roja, rótulo de urgencias y helipuerto */
function hospital() {
  const b = { x: 0, y: -144, w: 44, d: 36, h: 90 };
  return edificio(b, "m-hosp", 91, (b) => {
    const o = [], fy = b.y + b.d + 0.05, cx = b.x + b.w / 2;
    o.push(`<g transform="${front(fy)}"><path class="cruz" d="${rect(cx - 6, b.h - 18, cx + 6, b.h - 14)}${rect(cx - 2, b.h - 22, cx + 2, b.h - 10)}"/>` +
      `<path class="rotulo" d="${rect(b.x + 6, 2, b.x + b.w - 6, 6.4)}"/><text class="rotulo-t" x="${cx}" y="-3.1">URGENCIAS</text></g>`);
    const hz = b.h + 2.2, hx = b.x + b.w * 0.55, hy = b.y + b.d * 0.5;
    o.push(L(k.ring(hx, hy, 9, hz, P, 36), { className: "l-heli" }));
    o.push(L(k.lineOnTop([hx - 3, hy - 4], [hx - 3, hy + 4], hz, P) + k.lineOnTop([hx + 3, hy - 4], [hx + 3, hy + 4], hz, P) + k.lineOnTop([hx - 3, hy], [hx + 3, hy], hz, P), { className: "l-heli" }));
    return o.join("");
  });
}
/* el polideportivo: campo con sus líneas, dos porterías, la grada al fondo, dos torres de focos y el
   gimnasio con su ventanal */
function deporte() {
  const out = [];
  const C = { x: -170, y: -134, w: 150, d: 64 };
  out.push(S(k.slabOf({ ...C, r: 1 }, 0.6, 0.3, P, 2), { tone: "mid", className: "m-pitch", crease: "none", flat: true }));
  const z = 0.92, ln = (a, b) => k.lineOnTop(a, b, z, P);
  out.push(L(k.onTop([[C.x + 3, C.y + 3], [C.x + C.w - 3, C.y + 3], [C.x + C.w - 3, C.y + C.d - 3], [C.x + 3, C.y + C.d - 3]], z, P, true), { className: "l-cal" }));
  out.push(L(ln([C.x + C.w / 2, C.y + 3], [C.x + C.w / 2, C.y + C.d - 3]) + k.ring(C.x + C.w / 2, C.y + C.d / 2, 9, z, P, 36), { className: "l-cal" }));
  for (const sx of [C.x + 3, C.x + C.w - 3]) {
    const dir = sx < 0 && sx < C.x + 10 ? 1 : -1;
    out.push(L(k.onTop([[sx, C.y + C.d / 2 - 14], [sx + dir * 16, C.y + C.d / 2 - 14], [sx + dir * 16, C.y + C.d / 2 + 14], [sx, C.y + C.d / 2 + 14]], z, P), { className: "l-cal" }));
  }
  /* las porterías: dos postes y el larguero */
  for (const gx of [C.x + 3, C.x + C.w - 3]) {
    const y0 = C.y + C.d / 2 - 7, y1 = C.y + C.d / 2 + 7;
    for (const y of byDepth([[gx, y0], [gx, y1]]).map((p) => p[1])) out.push(S(k.cylinder(gx, y, 0.7, z, 8, P, 10), { tone: "hi", className: "m-goal", crease: "none" }));
    out.push(S(k.slabOf({ x: gx - 0.6, y: y0 - 0.6, w: 1.2, d: y1 - y0 + 1.2, r: 0.4 }, z + 8, 1.2, P, 2), { tone: "hi", className: "m-goal" }));
  }
  /* la grada, tres escalones */
  for (let i = 0; i < 3; i++) out.push(S(k.slabOf({ x: -150, y: -148 + i * 3.6, w: 110, d: 4, r: 0.3 }, 0, 9 - i * 3, P, 2, 0.4), { tone: "mid", className: "m-concrete" }));
  /* las torres de focos (la cabeza se enciende de tarde) */
  for (const [x, y] of [[-176, -140], [-14, -140]]) {
    out.push(S(k.cylinder(x, y, 2.4, 0, 1.4, P, 16), { tone: "mid", className: "m-steel" }));
    out.push(S(k.cylinder(x, y, 1.1, 1.4, 92, P, 12), { tone: "mid", className: "m-steel", crease: "none" }));
    out.push(`<g data-part="foco">${S(k.slabOf({ x: x - 7, y: y + 1, w: 14, d: 3, r: 0.4 }, 93, 6, P, 2, 0.3), { tone: "mid", className: "m-lamp-off" })}</g>`);
  }
  /* el gimnasio: nave violeta, ventanal corrido en la fachada y el rótulo GYM con su mancuerna */
  const g = { x: 12, y: -146, w: 140, d: 50, h: 34, r: 0.8 };
  out.push(S(k.slabOf(g, 0, g.h, P, 3, 0.6), { tone: "mid", className: "m-gym" }));
  out.push(S(k.slabOf({ x: g.x - 1, y: g.y - 1, w: g.w + 2, d: g.d + 2, r: 0.6 }, g.h, 2, P, 2, 0.4), { tone: "mid", className: "m-gym" }));
  const vent = [];
  for (let u = g.x + 6; u < g.x + g.w - 10; u += 14) vent.push(`<path class="win w-on gymwin" d="${rect(u, 6, u + 11, 22)}"/>`);
  out.push(`<g transform="${front(g.y + g.d + 0.02)}">${vent.join("")}` +
    `<path class="rotulo gym" d="${rect(g.x + g.w / 2 - 22, 25, g.x + g.w / 2 + 22, 32)}"/><text class="rotulo-t gym" x="${g.x + g.w / 2 + 5}" y="-26.6">GYM</text>` +
    `<path class="pesa" d="M${g.x + g.w / 2 - 17} -28.5H${g.x + g.w / 2 - 7}M${g.x + g.w / 2 - 17} -30.6V-26.4M${g.x + g.w / 2 - 7} -30.6V-26.4"/></g>`);
  out.push(`<g transform="${side(g.x + g.w + 0.02)}">${[0, 1, 2].map((i) => `<path class="win w-on gymwin" d="${rect(-(g.y + g.d) + 6 + i * 14, 6, -(g.y + g.d) + 17 + i * 14, 22)}"/>`).join("")}</g>`);
  return out.join("");
}
/* el bosque: pinos de tres pisos y árboles de copa redonda, un estanque y unas rocas; de noche,
   luciérnagas */
function bosque() {
  const out = [], arboles = [];
  const estanque = [-52, -112];
  for (let i = 0; i < 26; i++) {
    const x = FONDO.x + 8 + hash(i * 3.1) * (FONDO.w - 16), y = FONDO.y + 8 + hash(i * 5.7 + 1) * (FONDO.d - 18);
    if (Math.hypot((x - estanque[0]) / 1.6, y - estanque[1]) < 22) continue;
    if (arboles.some((a) => Math.hypot(a.x - x, a.y - y) < 15)) continue;
    arboles.push({ x, y, pino: hash(i * 9.3) > 0.45, s: 0.8 + hash(i * 2.2) * 0.55 });
  }
  /* el estanque, con su orilla */
  const pond = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pond.push([estanque[0] + Math.cos(a) * 26, estanque[1] + Math.sin(a) * 13]); }
  out.push(`<path class="agua" d="${quad(pond.map(([x, y]) => [x, y, 0.65]))}"/>`);
  out.push(L(k.onTop(pond, 0.66, P, true), { className: "l-orilla" }));
  for (const [x, y, r] of [[-20, -96, 3], [-84, -128, 2.4], [118, -84, 2.8]]) out.push(S(G.sphereOf([x, y, 0.6 + r * 0.4], r, P), { tone: "mid", className: "m-roca" }));
  const items = arboles.sort((a, b) => k.depthOf([a.x, a.y, 0], P) - k.depthOf([b.x, b.y, 0], P));
  for (const a of items) {
    const s = a.s;
    out.push(S(k.cylinder(a.x, a.y, 1.6 * s, 0.6, 10 * s, P, 12), { tone: "mid", className: "m-trunk", crease: "none" }));
    if (a.pino) {
      const F = G.frameAlong([a.x, a.y, 8 * s], [0, 0, 1]);
      out.push(S(G.solidOf([[0, 11 * s], [11 * s, 5 * s], [11 * s, 8.5 * s], [21 * s, 3 * s], [21 * s, 6 * s], [31 * s, 0]], F, P), { tone: "mid", className: "m-pine" }));
    } else {
      out.push(S(G.sphereOf([a.x, a.y, 10 * s + 8 * s], 10 * s, P), { tone: "mid", className: "m-leaf" }));
    }
  }
  /* luciérnagas: puntos que solo se ven de noche y parpadean */
  const fl = [];
  for (let i = 0; i < 14; i++) fl.push(`<circle class="fly" style="animation-delay:${(hash(i * 4.4) * 3).toFixed(2)}s" cx="${at([FONDO.x + 12 + hash(i * 7.7) * (FONDO.w - 24), FONDO.y + 10 + hash(i * 3.3) * (FONDO.d - 20), 4 + hash(i) * 10])[0].toFixed(1)}" cy="${at([FONDO.x + 12 + hash(i * 7.7) * (FONDO.w - 24), FONDO.y + 10 + hash(i * 3.3) * (FONDO.d - 20), 4 + hash(i) * 10])[1].toFixed(1)}" r="0.9"/>`);
  out.push(`<g class="flies">${fl.join("")}</g>`);
  return out.join("");
}

/* el Lloretazo: el mar con sus olas, un acantilado de dos escalones con hierba arriba y, en el borde,
   el conductor fumándose un cigarro de cara al mar (la brasa y el humo, vivos); enfrente, el faro */
function acantilado() {
  const out = [];
  out.push(S(k.slabOf(FONDO, 0, 0.6, P, 3, 0.3), { tone: "mid", className: "m-sea", crease: "none", flat: true }));
  const olas = [];
  for (let i = 0; i < 22; i++) { const x = FONDO.x + 10 + hash(i * 2.7) * (FONDO.w - 30), y = FONDO.y + 6 + hash(i * 4.1) * (FONDO.d - 12);
    if (x < -40 && y < -76) continue; olas.push(k.lineOnTop([x, y], [x + 8 + hash(i) * 8, y], 0.64, P)); }
  out.push(L(olas.join(""), { className: "l-ola" }));
  /* el acantilado: roca en dos escalones, hierba encima y unas piedras al pie */
  const R1 = { x: -180, y: -148, w: 138, d: 76, r: 3 }, R2 = { x: -176, y: -146, w: 82, d: 50, r: 3 };
  out.push(S(k.slabOf(R1, 0.6, 30, P, 4, 0.8), { tone: "mid", className: "m-roca" }));
  out.push(S(k.slabOf({ ...R1, x: R1.x + 1, y: R1.y + 1, w: R1.w - 2, d: R1.d - 2 }, 30.6, 1.4, P, 4, 0.4), { tone: "mid", className: "m-grass" }));
  out.push(S(k.slabOf(R2, 32, 12, P, 4, 0.6), { tone: "mid", className: "m-roca" }));
  out.push(S(k.slabOf({ ...R2, x: R2.x + 1, y: R2.y + 1, w: R2.w - 2, d: R2.d - 2 }, 44, 1.2, P, 4, 0.4), { tone: "mid", className: "m-grass" }));
  const est = [];
  for (let z = 6; z < 30; z += 6) est.push(k.segment([R1.x + R1.w, R1.y + 6, z], [R1.x + R1.w, R1.y + R1.d - 6, z + 1.5], P));
  out.push(L(est.join(""), { tone: "faint" }));
  for (const [x, y, r] of [[-36, -74, 3.4], [-30, -96, 2.6], [-48, -70, 2]]) out.push(S(G.sphereOf([x, y, 0.6 + r * 0.5], r, P), { tone: "mid", className: "m-roca" }));
  /* un banco de madera en lo alto, por si hay que sentarse */
  out.push(S(k.slabOf({ x: -84, y: -120, w: 16, d: 4, r: 0.5 }, 32, 3, P, 2), { tone: "mid", className: "m-wood" }));
  /* matas en lo alto y vetas en la cara de la roca que mira al andén */
  for (const [x, y, r] of [[-170, -100, 4], [-160, -84, 3.2], [-120, -80, 3.6], [-96, -96, 2.6], [-66, -132, 3]]) out.push(S(G.sphereOf([x, y, 31 + r * 0.7], r, P), { tone: "mid", className: "m-leaf" }));
  const vet = [];
  for (let z = 5; z < 30; z += 5) vet.push(`M${R1.x + 4} ${-z}H${R1.x + R1.w - 4}`);
  out.push(`<g transform="${front(R1.y + R1.d + 0.02)}"><path class="veta" d="${vet.join("")}"/></g>`);
  /* el conductor, en el borde de cara al mar: piernas, chaleco con su franja, brazo al cigarro, cabeza y gorra */
  const fx = -52, fy = -90, fz = 32, e = 1.7;
  for (const dy of [-1, 1]) out.push(S(k.cylinder(fx, fy + dy * e * 0.55, 0.75 * e, fz, 5 * e, P, 10), { tone: "mid", className: "m-pant", crease: "none" }));
  out.push(S(k.slabOf({ x: fx - 1.3 * e, y: fy - 2 * e, w: 2.6 * e, d: 4 * e, r: 0.8 * e }, fz + 5 * e, 5 * e, P, 3, 0.4), { tone: "mid", className: "m-vest" }));
  out.push(S(k.slabOf({ x: fx - 1.35 * e, y: fy - 2.05 * e, w: 2.7 * e, d: 4.1 * e, r: 0.8 * e }, fz + 7 * e, 0.6 * e, P, 3), { tone: "mid", className: "m-amber" }));
  out.push(S(k.cylinder(fx + 0.4 * e, fy + 2.3 * e, 0.6 * e, fz + 7.6 * e, 2.6 * e, P, 8), { tone: "mid", className: "m-shirt", crease: "none" }));
  out.push(S(G.sphereOf([fx, fy, fz + 11.6 * e], 1.5 * e, P), { tone: "mid", className: "m-skin" }));
  out.push(S(k.cylinder(fx, fy, 1.6 * e, fz + 12.4 * e, 0.9 * e, P, 16), { tone: "mid", className: "m-vest" }));
  out.push(S(k.slabOf({ x: fx + 0.8 * e, y: fy - 1.2 * e, w: 1.8 * e, d: 2.4 * e, r: 0.6 }, fz + 12.4 * e, 0.4, P, 2), { tone: "mid", className: "m-vest" }));
  /* el cigarro: la brasa y el humo que sube y se va */
  const tip = at([fx + 1.6 * e, fy + 2.1 * e, fz + 10.6 * e]);
  out.push(`<circle class="ascua-h" cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="3"/><circle class="ascua" cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="1"/>`);
  for (let i = 0; i < 3; i++) out.push(`<path class="humo" style="animation-delay:${(i * 1.2).toFixed(1)}s" d="M${tip[0].toFixed(1)} ${(tip[1] - 1.4).toFixed(1)}c-2.4 -2.4 2.8 -4 0.5 -6.6s-1.9 -4 0.7 -6"/>`);
  /* el faro sobre su roca, con franjas rojas y la linterna que se enciende de noche */
  out.push(S(G.sphereOf([108, -118, -4], 11, P), { tone: "mid", className: "m-roca" }));
  out.push(S(k.slabOf({ x: 98, y: -128, w: 20, d: 20, r: 6 }, 0.6, 8, P, 6, 0.8), { tone: "mid", className: "m-roca" }));
  for (let i = 0; i < 4; i++) out.push(S(k.cylinder(108, -118, 4.4 - i * 0.35, 8.6 + i * 9.8, 9.8, P, 24), { tone: "mid", className: i % 2 ? "m-faroR" : "m-faro", crease: "none" }));
  out.push(`<g data-part="faro">${S(k.cylinder(108, -118, 3.2, 48, 5, P, 20), { tone: "mid", className: "m-lamp-off" })}</g>`);
  out.push(S(k.cylinder(108, -118, 4, 53, 1.2, P, 20), { tone: "mid", className: "m-steel" }));
  out.push(S(G.sphereOf([108, -118, 55.4], 2, P), { tone: "mid", className: "m-faroR" }));
  return out.join("");
}

/* ---------- la estación (igual que la maqueta) ---------- */
function lane() {
  const out = [];
  out.push(S(k.slabOf({ ...LANE, r: 0.6 }, 0, 0.6, P, 2), { tone: "mid", className: "m-asphalt", crease: "none", flat: true }));
  out.push(L(k.lineOnTop([LANE.x, LANE.y + 1.2], [LANE.x + LANE.w, LANE.y + 1.2], 0.6, P) + k.lineOnTop([LANE.x, LANE.y + LANE.d - 1.2], [LANE.x + LANE.w, LANE.y + LANE.d - 1.2], 0.6, P), { tone: "faint", className: "l-paint" }));
  const bay = { x: SLOT.bay - 3, y: -2.5, w: BUS.L + 6, d: BUS.W + 5 };
  out.push(L(k.onTop([[bay.x, bay.y], [bay.x + bay.w, bay.y], [bay.x + bay.w, bay.y + bay.d], [bay.x, bay.y + bay.d]], 0.6, P, true), { className: "l-bay" }));
  for (const x of [128, 140]) out.push(L(k.onTop([[x, 1], [x + 7, 7], [x, 13]], 0.6, P), { className: "l-paint" }));
  return out.join("");
}
function platform() {
  const out = [];
  out.push(S(k.slabOf(PLAT, 0, PLAT_H, P, 4, 0.6), { tone: "mid", className: "m-concrete" }));
  for (let x = PLAT.x + 18; x < PLAT.x + PLAT.w; x += 18) out.push(L(k.lineOnTop([x, PLAT.y], [x, PLAT.y + PLAT.d - 5], PLAT_H, P), { tone: "faint" }));
  const tac = { x: PLAT.x + 1, y: PLAT.y + PLAT.d - 4.6, w: PLAT.w - 2, d: 2.6 };
  out.push(`<path class="tactile" d="${quad([[tac.x, tac.y, PLAT_H + 0.05], [tac.x + tac.w, tac.y, PLAT_H + 0.05], [tac.x + tac.w, tac.y + tac.d, PLAT_H + 0.05], [tac.x, tac.y + tac.d, PLAT_H + 0.05]])}"/>`);
  for (const bx of [58, 104]) {
    const seat = { x: bx, y: -44, w: 22, d: 6, r: 0.8 };
    for (const lx of [bx + 2, bx + 18]) out.push(S(k.slabOf({ x: lx, y: -43, w: 2, d: 4, r: 0.3 }, PLAT_H, 4, P, 2), { tone: "lo", className: "m-steel" }));
    out.push(S(k.slabOf(seat, PLAT_H + 4, 1.4, P, 3, 0.3), { tone: "mid", className: "m-wood" }));
    out.push(S(k.slabOf({ x: bx, y: -45.6, w: 22, d: 1.4, r: 0.4 }, PLAT_H + 5.4, 5, P, 2), { tone: "mid", className: "m-wood" }));
    out.push(L([4, 8, 12, 16].map((u) => k.lineOnTop([bx + u + 1, seat.y + 0.5], [bx + u + 1, seat.y + seat.d - 0.5], PLAT_H + 5.4, P)).join(""), { tone: "faint" }));
  }
  out.push(S(k.cylinder(134, -26, 2.6, PLAT_H, 7, P, 24), { tone: "mid", className: "m-steel" }));
  out.push(L(k.ring(134, -26, 1.8, PLAT_H + 7, P, 20), { tone: "lo" }));
  return out.join("");
}
function canopy() {
  const out = [];
  for (const [x, y] of POSTS) {
    out.push(S(k.cylinder(x, y, 3.4, PLAT_H, 1.6, P, 24), { tone: "mid", className: "m-steel" }));
    out.push(S(k.cylinder(x, y, 1.8, PLAT_H + 1.6, ROOF_Z - PLAT_H - 1.6, P, 20), { tone: "mid", className: "m-steel", crease: "none" }));
  }
  out.push(S(k.slabOf(ROOF, ROOF_Z, 3, P, 4, 0.6), { tone: "mid", className: "m-roof" }));
  out.push(L(k.planOutline(k.insetPlan(ROOF, 3), ROOF_Z + 3, P), { tone: "faint" }));
  out.push(L([0.25, 0.5, 0.75].map((f) => k.lineOnTop([ROOF.x + ROOF.w * f, ROOF.y + 3], [ROOF.x + ROOF.w * f, ROOF.y + ROOF.d - 3], ROOF_Z + 3, P)).join(""), { tone: "faint" }));
  out.push(D(k.corners(ROOF, 3).map(([x, y]) => at([x, y, ROOF_Z + 3])), { size: 0.45 }));
  const [cx, cy, cz] = CLOCK;
  out.push(S(k.cylinder(cx, cy - 1.2, 0.7, cz + CLOCK_R, ROOF_Z - cz - CLOCK_R, P, 12), { tone: "mid", className: "m-steel", crease: "none" }));
  const F = G.frameAlong([cx, cy - 3, cz], [0, 1, 0]);
  out.push(S(G.disc(0, 3, CLOCK_R, F, P), { tone: "mid", className: "m-steel" }));
  out.push(S(G.disc(3, 3.3, CLOCK_R - 0.9, F, P), { tone: "hi", className: "m-dial" }));
  const fy = cy + 0.35, ticks = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, r0 = i % 3 === 0 ? CLOCK_R - 3.4 : CLOCK_R - 2.6, r1 = CLOCK_R - 1.7;
    ticks.push(`M${(cx + r0 * Math.sin(a)).toFixed(2)} ${(-(cz + r0 * Math.cos(a))).toFixed(2)}L${(cx + r1 * Math.sin(a)).toFixed(2)} ${(-(cz + r1 * Math.cos(a))).toFixed(2)}`);
  }
  out.push(`<g transform="${front(fy)}"><path class="clock-tick" d="${ticks.join("")}"/><path data-part="hands" class="clock-hand" d=""/><circle class="clock-pin" cx="${cx}" cy="${-cz}" r="0.7"/></g>`);
  out.push(S(k.cylinder(152, -14, 2.4, PLAT_H, 1.4, P, 20), { tone: "mid", className: "m-steel" }));
  out.push(S(k.cylinder(152, -14, 1, PLAT_H + 1.4, 46, P, 16), { tone: "mid", className: "m-steel", crease: "none" }));
  out.push(`<g data-part="farola">${S(k.slabOf({ x: 148.5, y: -17.5, w: 7, d: 7, r: 1.4 }, PLAT_H + 47.4, 3.2, P, 3, 0.4), { tone: "mid", className: "m-lamp-off" })}</g>`);
  out.push(S(k.slabOf({ x: 147.5, y: -18.5, w: 9, d: 9, r: 1.8 }, PLAT_H + 50.6, 1.6, P, 3, 0.4), { tone: "mid", className: "m-steel" }));
  return out.join("");
}
const FACE_PTS = [[GAR.x + GAR.w, GAR.y, 0], [GAR.x + GAR.w, GAR.y + GAR.d, 0], [GAR.x + GAR.w, GAR.y + GAR.d, GAR_H], [GAR.x + GAR.w, GAR.y, GAR_H]];
const DX = GAR.x + GAR.w;
function garageBack() {
  const out = [`<path class="iso-halo" d="${k.haloOf(GAR, 0, 4, P)}" style="filter:blur(3px)"/>`];
  /* la cochera es también la casa: se ve por dentro como una casa de muñecas (sin tejado, la pared de delante
     baja). Quedan en pie la del fondo, la del lado y la de la puerta, que lleva fuera el indicador del sueño */
  out.push(S(k.slabOf({ x: GAR.x, y: GAR.y, w: GAR.w, d: GAR.d, r: 0.6 }, 0, 1.2, P, 2, 0.2), { tone: "mid", className: "m-concrete" }));
  out.push(S(k.slabOf({ x: GAR.x, y: GAR.y, w: GAR.w, d: 1.6, r: 0 }, 0, ALTO_CASA, P, 1), { tone: "mid", className: "m-brick" }));
  out.push(S(k.slabOf({ x: GAR.x, y: GAR.y, w: 1.6, d: GAR.d, r: 0 }, 0, ALTO_CASA, P, 1), { tone: "mid", className: "m-brick" }));
  /* el piso de arriba: el forjado sobre el autobús, el suelo de madera y las ventanas del fondo */
  out.push(S(k.slabOf({ x: GAR.x, y: GAR.y, w: GAR.w, d: GAR.d, r: 0.6 }, ZF - 1.5, 1.5, P, 2, 0.2), { tone: "mid", className: "m-floor" }));
  out.push(L(Array.from({ length: 7 }, (_, i) => k.onTop([[GAR.x + 1, GAR.y + 8 * (i + 1)], [DX - 1, GAR.y + 8 * (i + 1)]], ZF + 0.02, P)).join(""), { tone: "faint" }));
  out.push(`<g transform="${front(GAR.y + 1.62)}"><path class="vidrio" d="${rect(GAR.x + 46, ZF + 16, GAR.x + 62, ZF + 28)}"/><path class="vidrio" d="${rect(GAR.x + 8, ZF + 18, GAR.x + 20, ZF + 28)}"/></g>`);
  out.push(interior());
  out.push(S(k.slabOf({ x: DX - 1.6, y: GAR.y, w: 1.6, d: GAR.d, r: 0 }, 0, GAR_H, P, 1), { tone: "mid", className: "m-brick" }));   /* la pared de la puerta solo llega al pretil del piso: más alta tapaba la cocina y el sofá */
  const op = [[DX, DOOR.y0, 0], [DX, DOOR.y1, 0], [DX, DOOR.y1, DOOR.h], [DX, DOOR.y0, DOOR.h]];
  out.push(`<path class="garage-dark" d="${quad(op)}"/>`);
  out.push(`<path data-part="door" class="door" d=""/><path data-part="slats" class="door-slat" d=""/>`);
  out.push(S(k.slabOf({ x: DX - 0.6, y: DOOR.y0 - 2, w: 1.6, d: DOOR.y1 - DOOR.y0 + 4, r: 0.3 }, DOOR.h, 2.4, P, 2), { tone: "mid", className: "m-steel" }));
  for (const y of [DOOR.y0 - 1.4, DOOR.y1 + 0.2]) out.push(S(k.slabOf({ x: DX - 0.4, y, w: 1.2, d: 1.2, r: 0.2 }, 0, DOOR.h, P, 1), { tone: "mid", className: "m-steel", crease: "none" }));
  out.push(L(Array.from({ length: 6 }, (_, i) => k.segment([DX, -30 + i * 2.6, GAR_H - 12], [DX, -30 + i * 2.6, GAR_H - 5], P)).join(""), { tone: "faint" }));
  return out.join("");
}
function garageFront() {
  const out = [];
  const yF = GAR.y + GAR.d;
  const PAR = 9;   /* abajo, el pretil de la cochera (el autobús se ve dentro); arriba, el del piso (la casa se ve) */
  out.push(S(k.slabOf({ x: GAR.x, y: yF - 1.6, w: GAR.w, d: 1.6, r: 0 }, 0, PAR, P, 1), { tone: "mid", className: "m-brick" }));
  out.push(S(k.slabOf({ x: GAR.x, y: yF - 1.6, w: GAR.w, d: 1.6, r: 0 }, ZF - 1.5, 9.5, P, 1), { tone: "mid", className: "m-brick" }));
  const hil = [];
  for (let z = 4; z < PAR; z += 4) hil.push(`M${GAR.x + 0.6} ${-z}H${DX - 0.6}`);
  for (let z = ZF + 2; z < ZF + 8; z += 4) hil.push(`M${GAR.x + 0.6} ${-z}H${DX - 0.6}`);
  out.push(`<g transform="${front(yF + 0.02)}"><path class="brick" d="${hil.join("")}"/></g>`);
  /* el indicador del sueño y el LCD, en la pared de la puerta (la de delante ya es un pretil); u = -y en esa cara */
  const sideD = (x) => k.sideMatrix([x, 0], 0, P, "right");
  const g = { u0: 36, u1: 43, z0: 8, z1: 38 };
  const zh = (h) => g.z0 + 1.2 + (g.z1 - g.z0 - 2.4) * Math.min(10, Math.max(0, h)) / 10;
  const marks = [];
  for (let h = 0; h <= 10; h++) marks.push(`M${g.u1 + 0.6} ${-zh(h)}H${g.u1 + (h % 2 ? 2 : 3.4)}`);
  out.push(S(k.slabOf({ x: DX, y: -g.u1 - 2, w: 1.2, d: g.u1 - g.u0 + 7, r: 0.5 }, g.z0 - 2.5, g.z1 - g.z0 + 5, P, 2, 0.3), { tone: "mid", className: "m-steel" }));
  out.push(`<g transform="${sideD(DX + 1.25)}">` +
    `<rect class="gauge-tube" x="${g.u0}" y="${-g.z1}" width="${g.u1 - g.u0}" height="${g.z1 - g.z0}" rx="1.6"/>` +
    `<rect data-part="gauge" class="gauge-fill" x="${g.u0 + 1}" y="${-zh(0)}" width="${g.u1 - g.u0 - 2}" height="0" rx="1"/>` +
    `<path class="gauge-mark" d="${marks.join("")}"/>` +
    `<path data-part="obj" class="gauge-obj" d=""/>` +
    `</g>`);
  const v = { u0: 8, u1: 32, z0: 25, z1: 33 };
  out.push(S(k.slabOf({ x: DX, y: -v.u1 - 1.5, w: 1.2, d: v.u1 - v.u0 + 3, r: 0.6 }, v.z0 - 1.5, v.z1 - v.z0 + 3, P, 2, 0.3), { tone: "mid", className: "m-steel" }));
  out.push(`<g transform="${sideD(DX + 1.25)}"><rect class="lcd" x="${v.u0}" y="${-v.z1}" width="${v.u1 - v.u0}" height="${v.z1 - v.z0}" rx="0.8"/>` +
    `<text data-part="lcd" class="lcd-t" x="${(v.u0 + v.u1) / 2}" y="${-(v.z0 + 2.2)}"></text>` +
    `<text class="lcd-s" x="${(v.u0 + v.u1) / 2}" y="${-(v.z0 - 4.6)}">ANOCHE</text></g>`);
  out.push(S(k.slabOf({ x: DX, y: 4, w: 2.4, d: 6, r: 0.6 }, 40, 1.4, P, 2), { tone: "mid", className: "m-steel" }));
  out.push(`<g data-part="farol">${S(k.slabOf({ x: DX + 0.4, y: 4.8, w: 1.8, d: 4.4, r: 0.6 }, 36.4, 3.6, P, 2, 0.3), { tone: "mid", className: "m-lamp-off" })}</g>`);
  out.push(D([[-174, 4], [-114, 4]].map(([x, z]) => at([x, yF + 0.05, z])), { size: 0.45 }));
  return out.join("");
}
/* ---------- la casa por dentro: dormitorio, baño y cocina al fondo; escritorio y salón delante; el conductor en
   cada sitio según la hora (todas las posturas dibujadas, la parte viva enseña una) ---------- */
function interior() {
  const items = [], add = (c, svg) => items.push({ d: k.depthOf(c, P), svg }), ox = GAR.x, oy = GAR.y, zf = ZF;
  const slab = (pl, z, h, P_, st, bv) => k.slabOf(pl, z + zf, h, P, st, bv), cyl = (x, y, r, z, h, P_, st, bv) => k.cylinder(x, y, r, z + zf, h, P, st, bv), AT = (q) => at([q[0], q[1], q[2] + zf]);
  for (const x of [ox + 26, ox + 42]) add([x, oy + 15, 6], S(slab({ x: x - 0.7, y: oy + 1.6, w: 1.4, d: 26, r: 0 }, 1.2, 11, P, 1), { tone: "mid", className: "m-concrete" }));   /* tabiques bajos: la cámara ve por encima */
  /* dormitorio: la cama, la mesilla con la lámpara y el móvil */
  let o = S(slab({ x: ox + 4, y: oy + 4, w: 20, d: 12, r: 0.8 }, 1.2, 4, P, 3, 0.4), { tone: "mid", className: "m-wood" });
  o += S(slab({ x: ox + 4.6, y: oy + 4.6, w: 18.8, d: 10.8, r: 1.2 }, 5.2, 2.4, P, 3, 0.6), { tone: "mid", className: "m-white" });
  o += S(slab({ x: ox + 5.4, y: oy + 6, w: 5, d: 8, r: 1 }, 7.6, 1.6, P, 3, 0.6), { tone: "hi", className: "m-pillow" });
  o += S(slab({ x: ox + 4, y: oy + 4, w: 1.2, d: 12, r: 0.3 }, 1.2, 10, P, 2, 0.3), { tone: "mid", className: "m-wood" });
  o += `<g data-part="manta">` + S(slab({ x: ox + 11, y: oy + 5.4, w: 12, d: 9.2, r: 1 }, 7.6, 1.2, P, 3, 0.4), { tone: "mid", className: "m-cloth" }) + `</g>`;
  o += `<g data-pose="cama" style="display:none">` + persona(P, [ox + 11, oy + 10, 7.6 + zf], "tumbado") + `</g>`;
  add([ox + 14, oy + 10, 4], o);
  o = S(slab({ x: ox + 4, y: oy + 18, w: 5, d: 5, r: 0.5 }, 1.2, 6, P, 2, 0.3), { tone: "mid", className: "m-wood" });
  o += S(cyl(ox + 6.5, oy + 20.5, 0.3, 7.2, 3.5, P, 8), { tone: "mid", className: "m-steel", crease: "none" }) + `<g data-part="lampara">` + S(cyl(ox + 6.5, oy + 20.5, 1.7, 10.7, 2, P, 12, 0.3), { tone: "hi", className: "m-lamp-off" }) + `</g>`;
  o += `<g data-part="movil">` + S(slab({ x: ox + 4.5, y: oy + 18.6, w: 1.6, d: 0.9, r: 0.15 }, 7.2, 0.3, P, 1), { tone: "mid", className: "m-lamp-off", crease: "none" }) + `</g>`;
  add([ox + 6.5, oy + 20.5, 4], o);
  /* baño: el plato de ducha con la mampara y el vapor, el lavabo */
  o = S(slab({ x: ox + 28, y: oy + 3, w: 12, d: 12, r: 0.8 }, 1.2, 1.2, P, 3, 0.3), { tone: "mid", className: "m-tile" });
  o += S(cyl(ox + 39.5, oy + 9, 0.4, 2.4, 20, P, 8), { tone: "mid", className: "m-steel", crease: "none" }) + S(cyl(ox + 34, oy + 9, 1.6, 21.8, 0.6, P, 12), { tone: "hi", className: "m-steel" });
  o += `<g data-pose="ducha" style="display:none">` + persona(P, [ox + 34, oy + 9, 2.4 + zf], "de-pie", [0, 1]) + `</g>`;
  o += `<g data-part="vapor" style="opacity:0">` + [[31, 7, 2.2], [36, 6, 1.8], [33, 12, 2]].map(([x, y, r]) => `<circle class="vapor" cx="${AT([ox + x, oy + y, 18]).map((v) => v.toFixed(1)).join('" cy="')}" r="${r}"/>`).join("") + `</g>`;
  o += `<path class="vidrio" d="${k.pathOf([AT([ox + 28, oy + 15, 1.2]), AT([ox + 40, oy + 15, 1.2]), AT([ox + 40, oy + 15, 18]), AT([ox + 28, oy + 15, 18])], true)}"/>`;
  add([ox + 34, oy + 9, 8], o);
  o = S(slab({ x: ox + 28, y: oy + 21, w: 10, d: 6, r: 0.6 }, 1.2, 10, P, 3, 0.4), { tone: "mid", className: "m-white" }) + S(cyl(ox + 33, oy + 23, 0.4, 11.2, 2.6, P, 8), { tone: "hi", className: "m-steel", crease: "none" });
  add([ox + 33, oy + 24, 6], o);
  /* cocina: la encimera con la cafetera y la taza, la nevera, el perchero con la chaqueta */
  o = S(slab({ x: ox + 44, y: oy + 3, w: 22, d: 9, r: 0.5 }, 1.2, 11, P, 3, 0.4), { tone: "mid", className: "m-wood" }) + S(slab({ x: ox + 43.6, y: oy + 2.6, w: 22.8, d: 9.8, r: 0.5 }, 12.2, 1, P, 3, 0.3), { tone: "hi", className: "m-steel" });
  o += S(slab({ x: ox + 46, y: oy + 4.5, w: 5, d: 5, r: 0.8 }, 13.2, 7, P, 3, 0.6), { tone: "mid", className: "m-lcdcase" }) + S(cyl(ox + 48.5, oy + 7, 1.7, 20.2, 0.8, P, 12), { tone: "mid", className: "m-steel" });
  o += `<g data-part="taza">` + S(cyl(ox + 54, oy + 7, 1.4, 13.2, 2, P, 12), { tone: "hi", className: "m-lamp-off" }) + `</g>`;
  add([ox + 55, oy + 7.5, 7], o);
  o = S(slab({ x: ox + 44, y: oy + 16, w: 8, d: 8, r: 0.6 }, 1.2, 22, P, 3, 0.5), { tone: "hi", className: "m-white" }) + L(k.pathOf([AT([ox + 52.02, oy + 17, 14]), AT([ox + 52.02, oy + 23, 14])]), { tone: "faint" });
  add([ox + 48, oy + 20, 11], o);
  add([ox + 55, oy + 16, 10], `<g data-pose="cafe" style="display:none">` + persona(P, [ox + 56, oy + 16, 1.2 + zf], "de-pie", [0, -1]) + `</g>`);
  o = S(cyl(ox + 61, oy + 25, 2.2, 1.2, 0.6, P, 12), { tone: "lo", className: "m-steel" }) + S(cyl(ox + 61, oy + 25, 0.45, 1.8, 20, P, 8), { tone: "mid", className: "m-steel", crease: "none" });
  o += `<g data-part="chaqueta">` + S(slab({ x: ox + 58.5, y: oy + 25, w: 5, d: 1.8, r: 0.6 }, 11, 9, P, 3, 0.6), { tone: "mid", className: "m-uni" }) + `</g>`;
  o += `<g data-pose="vestir" style="display:none">` + persona(P, [ox + 57, oy + 31, 1.2 + zf], "de-pie", [1, 0]) + `</g>`;
  add([ox + 61, oy + 25, 10], o);
  /* delante: el escritorio con el flexo y la silla; el sofá y la tele con la play */
  o = "";
  for (const [x, y] of [[ox + 4, oy + 35], [ox + 16, oy + 35], [ox + 4, oy + 40], [ox + 16, oy + 40]]) o += S(slab({ x: x - 0.6, y: y - 0.6, w: 1.2, d: 1.2, r: 0.2 }, 1.2, 9, P, 1), { tone: "lo", className: "m-wood", crease: "none" });
  o += S(slab({ x: ox + 3, y: oy + 34, w: 14, d: 7, r: 0.5 }, 10.2, 1.2, P, 3, 0.3), { tone: "mid", className: "m-wood" });
  o += S(slab({ x: ox + 6, y: oy + 36, w: 6, d: 4, r: 0.2 }, 11.4, 0.8, P, 2, 0.2), { tone: "hi", className: "m-white" });
  o += S(cyl(ox + 14.5, oy + 36, 0.3, 11.4, 5, P, 8), { tone: "mid", className: "m-steel", crease: "none" }) + `<g data-part="flexo">` + S(cyl(ox + 14.5, oy + 36, 1.6, 16.4, 1.6, P, 12, 0.3), { tone: "hi", className: "m-lamp-off" }) + `</g>`;
  add([ox + 10, oy + 37.5, 6], o);
  o = S(slab({ x: ox + 7.5, y: oy + 28.5, w: 5, d: 5, r: 0.8 }, 5.2, 1, P, 2, 0.3), { tone: "mid", className: "m-wood" }) + S(slab({ x: ox + 7.5, y: oy + 28.5, w: 5, d: 1, r: 0.2 }, 6.2, 7, P, 2, 0.3), { tone: "mid", className: "m-wood" });
  o += S(cyl(ox + 10, oy + 31, 0.5, 1.2, 4, P, 8), { tone: "lo", className: "m-steel", crease: "none" });
  o += `<g data-pose="escritorio" style="display:none">` + persona(P, [ox + 10, oy + 31, 6.2 + zf], "sentado") + `</g>`;
  add([ox + 10, oy + 31, 4], o);
  o = S(slab({ x: ox + 44, y: oy + 27, w: 14, d: 6, r: 1 }, 1.2, 5, P, 3, 0.6), { tone: "mid", className: "m-cloth" }) + S(slab({ x: ox + 44, y: oy + 27, w: 14, d: 1.6, r: 0.8 }, 6.2, 5, P, 3, 0.6), { tone: "mid", className: "m-cloth" });
  o += `<g data-pose="salon" style="display:none">` + persona(P, [ox + 51, oy + 31, 6.2 + zf], "sentado") + S(slab({ x: ox + 49, y: oy + 34.5, w: 4, d: 1.6, r: 0.5 }, 12.6, 1, P, 3, 0.4), { tone: "mid", className: "m-lcdcase" }) + `</g>`;
  add([ox + 51, oy + 30, 4], o);
  o = S(slab({ x: ox + 44, y: oy + 36.5, w: 12, d: 3.5, r: 0.4 }, 1.2, 6, P, 3, 0.3), { tone: "mid", className: "m-wood" }) + S(slab({ x: ox + 45, y: oy + 37.5, w: 10, d: 1.2, r: 0.3 }, 7.2, 9, P, 2, 0.3), { tone: "lo", className: "m-lcdcase" });
  o += `<g transform="${front(oy + 38.72)}"><path data-part="tv" class="pant" d="${rect(ox + 45.6, 8 + zf, ox + 54.4, 15.4 + zf)}"/></g>`;
  o += S(slab({ x: ox + 46, y: oy + 37.8, w: 4, d: 2, r: 0.4 }, 7.2, 1, P, 3, 0.3), { tone: "mid", className: "m-lcdcase" });
  add([ox + 50, oy + 38, 7], o);
  return items.sort((a, b) => a.d - b.d).map((i) => i.svg).join("");
}
function busSvg(LV, TXT, HORA) {
  const { L: BL, W: BW, Z0, Z1 } = BUS, out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: 2, y: 1, w: BL - 4, d: BW - 2, r: 3 }, 0, 0.2, P)}" style="filter:blur(2.5px)"/>`);
  out.push(S(k.slabOf({ x: 0, y: 0, w: BL, d: BW, r: 2.6 }, Z0, Z1 - Z0, P, 4, 0.9), { tone: "mid", className: "m-bus" }));
  out.push(S(k.slabOf({ x: 1.5, y: 1.2, w: BL - 3, d: BW - 2.4, r: 2 }, Z1, 1.2, P, 4, 0.4), { tone: "mid", className: "m-" + LV }));
  out.push(S(k.slabOf({ x: 20, y: 3.4, w: 18, d: BW - 6.8, r: 1 }, Z1 + 1.2, 2.4, P, 3, 0.4), { tone: "mid", className: "m-steel" }));
  out.push(L(k.planOutline({ x: 22, y: 4.6, w: 14, d: BW - 9.2, r: 0.6 }, Z1 + 3.6, P, 2), { tone: "faint" }));
  const pil = [15, 27, 39, 51].map((u) => `M${u} ${-21.4}V${-14}`).join("");
  out.push(`<g transform="${front(BW + 0.02)}">` +
    `<path class="lv ${LV}" d="${rect(0.8, 8, BL - 0.8, 10.6)}"/>` +
    `<path class="glass" d="${rect(3, 13.4, BL - 3, 22)}"/><path class="pillar" d="${pil}"/>` +
    `<path class="sign" d="${rect(3, 23.2, BL - 3, 30.6)}"/>` +
    `<text class="sign-h" x="4.4" y="${-25.3}">${HORA}</text><text class="sign-t" x="${BL - 4.6}" y="${-24.4}">${TXT}</text>` +
    `<path class="skirt" d="M1 -6H${BL - 1}"/></g>`);
  out.push(`<g transform="${side(BL + 0.02)}">` +
    `<path class="glass" d="${rect(-BW + 1.6, 13, -1.6, 27.6)}"/>` +
    `<path class="sign" d="${rect(-BW + 2.2, 28.4, -2.2, 31)}"/>` +
    `<path class="lv ${LV}" d="${rect(-BW + 0.8, 8, -0.8, 10.6)}"/>` +
    `<circle class="lamp-h" cx="${-BW + 2.6}" cy="-5.6" r="1.1"/><circle class="lamp-h" cx="-2.6" cy="-5.6" r="1.1"/></g>`);
  out.push(S(k.slabOf({ x: BL - 1, y: BW - 0.4, w: 1.6, d: 2.6, r: 0.4 }, 22, 6, P, 2), { tone: "lo", className: "m-steel" }));
  for (const x of [12, 47]) {
    const F = G.frameAlong([x, BW - 1.2, 5], [0, 1, 0]);
    out.push(S(G.disc(0, 2.2, 5, F, P), { tone: "lo", className: "m-tyre" }));
    out.push(S(G.disc(2.2, 2.5, 2.6, F, P), { tone: "mid", className: "m-steel" }));
  }
  return out.join("");
}

/* ---------- la figura ---------- */
const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT, className: "es-svg",
  label: "Tu día como una estación de autobuses en miniatura. Cada cosa del día es un autobús con su hora; el primero espera en el andén. Detrás, el decorado cambia con lo que toca: la ciudad cuando trabajas, el hospital de guardia, el polideportivo cuando entrenas y el bosque cuando estás libre. A la izquierda, la cochera con lo que dormiste anoche.",
  body: [
    `<defs><linearGradient id="es-cielo__ID" x1="0" y1="0" x2="0" y2="1"><stop data-part="sky0" offset="0" stop-color="#4f93d8"/><stop data-part="sky1" offset="1" stop-color="#bfe0ff"/></linearGradient>` +
      `<clipPath id="es-gar__ID" clipPathUnits="userSpaceOnUse"><path data-part="garclip" clip-rule="evenodd" d=""/></clipPath></defs>`,
    `<rect class="es-cielo" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="14" fill="url(#es-cielo__ID)"/><g data-part="astro"></g>`,
    base(),
    `<g data-amb="ciudad hospital">${terreno("m-plaza")}</g><g data-amb="deporte bosque">${terreno("m-grass")}</g>`,
    `<g data-amb="ciudad">${ciudad(-1)}</g>`,
    `<g data-amb="hospital">${ciudad(4)}${hospital()}</g>`,
    `<g data-amb="deporte">${deporte()}</g>`,
    `<g data-amb="bosque">${bosque()}</g>`,
    `<g data-amb="acantilado">${acantilado()}</g>`,
    lane(), platform(), canopy(), `<g class="garaje" data-o="garaje">${garageBack()}</g>`,
    `<g data-part="buses"></g>`,
    `<g class="garaje" data-o="garaje">${garageFront()}</g>`,
  ],
});

/* ---------- los colores: materiales de día, de tarde (cálidos) y de noche (apagados) ---------- */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, f) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * f).toString(16).padStart(2, "0")).join("");
const mat = (sel, v) => `${sel}{${Object.entries(v).map(([a, b]) => `--anatomy-${a}:${b}`).join(";")}}`;
const tono = (c, dark) => dark
  ? { paper: c, "shade-0": mix(c, "#000000", 0.45), "shade-1": mix(c, "#000000", 0.35), "shade-2": mix(c, "#000000", 0.25), "shade-3": mix(c, "#000000", 0.15), top: mix(c, "#ffffff", 0.12), hi: mix(c, "#ffffff", 0.55), mid: mix(c, "#ffffff", 0.25), lo: mix(c, "#000000", 0.5), faint: mix(c, "#000000", 0.3) }
  : { paper: c, "shade-0": mix(c, "#000000", 0.22), "shade-1": mix(c, "#000000", 0.16), "shade-2": mix(c, "#000000", 0.1), "shade-3": mix(c, "#000000", 0.04), top: mix(c, "#ffffff", 0.3), hi: mix(c, "#000000", 0.6), mid: mix(c, "#000000", 0.35), lo: mix(c, "#000000", 0.18), faint: mix(c, "#000000", 0.08) };
const TARDE = "#ff9a4a", NOCHE = "#0b1430";
/* un material en los dos temas y las tres luces */
const material = (n, d, l) => [
  mat(`.es .m-${n}`, tono(d, true)), mat(`.es[data-theme=light] .m-${n}`, tono(l, false)),
  mat(`.es.es-tarde .m-${n}`, tono(mix(d, TARDE, 0.14), true)), mat(`.es[data-theme=light].es-tarde .m-${n}`, tono(mix(l, TARDE, 0.16), false)),
  mat(`.es.es-noche .m-${n}`, tono(mix(d, NOCHE, 0.45), true)), mat(`.es[data-theme=light].es-noche .m-${n}`, tono(mix(l, NOCHE, 0.38), false)),
].join("");
const LIBREAS = { work: ["#d9573f", "#ef7a63"], guard: ["#34467e", "#6f86c8"], meal: ["#2f9e6b", "#56c48f"], gym: ["#7a5cf0", "#9c86ff"], plan: ["#1fa6c4", "#4cc9e4"], sleep: ["#34467e", "#6f86c8"] };
const MATS = {
  base: ["#16223a", "#dfe7f2"], steel: ["#3a4a62", "#d4dde8"], roof: ["#24324c", "#c9d4e3"], concrete: ["#3b4659", "#e3e8ef"], asphalt: ["#1c2433", "#b9c2cf"],
  brick: ["#5a3b33", "#d9a493"], wood: ["#6b5038", "#d8b892"], bus: ["#c9d4e4", "#f7f9fc"], dial: ["#e9eef5", "#ffffff"], "lamp-off": ["#2a3448", "#c5ceda"],
  bld1: ["#3e4c6a", "#c8d2e0"], bld2: ["#4a5878", "#d6dee9"], bld3: ["#33405c", "#bcc8d8"], hosp: ["#d5dce6", "#f4f7fb"], plaza: ["#2a3446", "#cfd7e2"],
  grass: ["#2d5a3a", "#b7d9a8"], pitch: ["#2e7d4a", "#8fcf8a"], goal: ["#e9eef5", "#ffffff"], gym: ["#3f3566", "#b9adf0"], trunk: ["#5a3f2a", "#a07a58"],
  pine: ["#1f5a3e", "#5f9e72"], leaf: ["#3f8a4f", "#86c47a"], roca: ["#59606c", "#b4bac4"],
  sea: ["#1f4f73", "#7fb6dc"], faro: ["#e9eef5", "#ffffff"], faroR: ["#c9302c", "#e5484d"], vest: ["#1d2b4a", "#33456e"], shirt: ["#9cc3ea", "#b9d6f2"],
  pant: ["#2a3550", "#3e4a66"], skin: ["#d8a982", "#e8bf9a"], amber: ["#ffd66b", "#f2b929"],
  uni: ["#2f5fb3", "#4a7fd6"], gorra: ["#1d3a73", "#2d4f94"], cloth: ["#5c79c9", "#8fa8e6"], white: ["#e6ebf2", "#ffffff"], pillow: ["#f2f4f8", "#ffffff"], tile: ["#c9d6e4", "#e6edf5"],
  floor: ["#3a2f27", "#d9c3a5"], lcdcase: ["#0e1626", "#26334a"],
  ...Object.fromEntries(Object.entries(LIBREAS).map(([n, c]) => [n, c])),
};
const CSS = [
  k.ISO_CSS,
  mat(".es", { page: "#070b14", card: "#111a2b", paper: "#111a2b", text: "#8fa6c6", strong: "#e9f2ff", muted: "#5d7394", halo: "#02040a" }),
  mat(".es[data-theme=light]", { page: "#f4f7fb", card: "#ffffff", paper: "#ffffff", text: "#4a5d78", strong: "#0d1726", muted: "#8a9ab2", halo: "#5c6f8c" }),
  ...Object.entries(MATS).map(([n, [d, l]]) => material(n, d, l)),
  /* la farola, el farol y los focos encendidos no se apagan con la noche */
  mat(".es .m-lamp", tono("#ffd66b", true)), mat(".es[data-theme=light] .m-lamp", tono("#ffcf4a", false)),
  ...Object.entries(LIBREAS).map(([n, [d, l]]) => `.es .lv.${n}{fill:${d}}.es[data-theme=light] .lv.${n}{fill:${l}}`),
  ".es .vidrio{fill:#9fd3ff;fill-opacity:.22;stroke:#bfe7ff;stroke-width:.5}.es .vapor{fill:#e6ebf2;fill-opacity:.4;transition:opacity .6s}.es[data-theme=light] .vapor{fill:#8a9ab2;fill-opacity:.3}.es .pant{fill:#0d1726}.es .pant.on{fill:#7fe0a8;fill-opacity:.6}.es [data-pose],.es [data-part=vapor]{transition:opacity .4s}",
  ".es{position:relative;touch-action:pan-y;user-select:none;-webkit-user-select:none}.es svg{display:block;width:100%;height:auto}.es svg:focus-visible{outline:2px solid #ffd66b;outline-offset:2px;border-radius:14px}",
  ".es [data-amb]{transition:opacity .9s ease}.es [data-bus],.es .garaje{cursor:pointer}.es [data-bus]:hover .sign{stroke:#38e1ff;stroke-width:.5}",
  ".es .l-paint{stroke:#8fa6c6!important;stroke-opacity:.55}.es .l-bay{stroke:#e3b341!important;stroke-width:.9px}.es[data-theme=light] .l-paint{stroke:#ffffff!important;stroke-opacity:.9}",
  ".es .l-cal{stroke:#e9f5ea!important;stroke-opacity:.85;stroke-width:.7px}.es .l-heli{stroke:#ffd66b!important;stroke-width:.8px}.es .l-orilla{stroke:#6b7f5e!important;stroke-width:.8px}",
  ".es .agua{fill:#1f4f73}.es[data-theme=light] .agua{fill:#7fb6dc}.es.es-noche .agua{fill:#10263a}",
  ".es .tactile{fill:#c99a2e}.es[data-theme=light] .tactile{fill:#f0c24b}",
  ".es .garage-dark{fill:#05070c}.es .door{fill:#55657d}.es .door-slat{stroke:#2c3a50;stroke-width:.5;fill:none}.es[data-theme=light] .door{fill:#c3cddb}.es[data-theme=light] .door-slat{stroke:#93a3b9}",
  ".es .brick{stroke:#3d2620;stroke-width:.45;fill:none}.es[data-theme=light] .brick{stroke:#c08b79}",
  ".es .gauge-tube{fill:#05070c;stroke:#52647f;stroke-width:.5}.es .gauge-fill{fill:#5a78d0}.es .gauge-mark{stroke:#8fa6c6;stroke-width:.45}.es .gauge-obj{stroke:#38e1ff;stroke-width:.9}",
  ".es .lcd{fill:#04131a}.es .lcd-t{fill:#7fecff;font:700 4.6px/1 ui-monospace,Menlo,monospace;text-anchor:middle}.es .lcd-s{fill:#e9f2ff;font:800 3.2px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-anchor:middle}",
  ".es[data-theme=light] .lcd-s{fill:#1d2b40}",
  ".es .glass{fill:#0a1220}.es .pillar{stroke:#c9d4e4;stroke-width:1.1}.es .skirt{stroke:#5d6f8a;stroke-width:.4}.es .sign{fill:#05080e}",
  ".es[data-theme=light] .glass{fill:#22324a}.es[data-theme=light] .pillar{stroke:#f7f9fc}",
  ".es .sign-t{fill:#e9f2ff;font:800 6.6px/1 ui-sans-serif,system-ui,sans-serif;text-anchor:end;letter-spacing:.01em}.es .sign-h{fill:#8fa6c6;font:700 4.2px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}",
  ".es .ahora .sign-t,.es .ahora .sign-h{fill:#ffd66b}.es .dormido .sign-t,.es .dormido .sign-h{fill:#2a3448}.es .dormido .glass{fill:#05080e}",
  ".es .lamp-h{fill:#4a5568}.es .ahora .lamp-h,.es.es-noche .lamp-h{fill:#fff3c4}",
  ".es .clock-tick{stroke:#1d2b40;stroke-width:.55}.es .clock-hand{stroke:#0d1726;stroke-width:.8;stroke-linecap:round;fill:none}.es .clock-pin{fill:#d9573f}",
  /* ventanas: oscuras de día; de tarde y de noche se encienden las que tocan */
  ".es .win{fill:#18223a}.es[data-theme=light] .win{fill:#8ea3bf}.es.es-tarde .win.w-on{fill:#f6c76e}.es.es-noche .win.w-on{fill:#ffd98a}.es.es-noche .win{fill:#0b1222}",
  ".es .gymwin{fill:#20294a}.es.es-tarde .gymwin,.es.es-noche .gymwin{fill:#ffe7a6}",
  ".es .cruz{fill:#e5484d}.es .rotulo{fill:#e5484d}.es .rotulo.gym{fill:#0b1020;stroke:#9c86ff;stroke-width:.5}.es .rotulo-t{fill:#fff;font:800 3.4px/1 ui-sans-serif,system-ui,sans-serif;text-anchor:middle;letter-spacing:.12em}",
  ".es .rotulo-t.gym{fill:#e9e4ff;font-size:5.4px}.es .pesa{stroke:#e9e4ff;stroke-width:1.1;fill:none;stroke-linecap:round}",
  ".es .veta{stroke:#3a3f48;stroke-width:.5;fill:none}.es[data-theme=light] .veta{stroke:#8f96a0}.es .l-ola{stroke:#bcd6ee!important;stroke-opacity:.55;stroke-width:.7px}.es .ascua{fill:#ff7a2e;animation:es-ascua 2.2s ease-in-out infinite}.es .ascua-h{fill:#ff9a4a;opacity:.35}",
  ".es .humo{fill:none;stroke:#e6ebf2;stroke-width:.9;stroke-linecap:round;opacity:0;animation:es-humo 3.6s ease-out infinite}",
  "@keyframes es-humo{0%{opacity:0;transform:translateY(0)}18%{opacity:.7}100%{opacity:0;transform:translateY(-14px)}}@keyframes es-ascua{0%,100%{opacity:.7}50%{opacity:1}}@media (prefers-reduced-motion:reduce){.es .humo{animation:none;opacity:.4}.es .ascua{animation:none}}",
  ".es .baliza{fill:#e5484d}.es .fly{fill:#e6ff8a;opacity:0}.es.es-noche [data-amb~=bosque] .fly{animation:es-fly 3s ease-in-out infinite}",
  "@keyframes es-fly{0%,100%{opacity:0}50%{opacity:.9}}@media (prefers-reduced-motion:reduce){.es.es-noche [data-amb~=bosque] .fly{animation:none;opacity:.6}.es [data-amb]{transition:none}}",
  ".es-pie{display:flex;align-items:center;gap:8px;margin-top:6px;font:600 12.5px/1.3 ui-sans-serif,system-ui,sans-serif;color:#8fa6c6}.es-pie b{color:#e9f2ff;font-weight:800}.es[data-theme=light] .es-pie{color:#4a5d78}.es[data-theme=light] .es-pie b{color:#0d1726}",
  ".es-pie button{margin-left:auto;font:700 12px ui-sans-serif,system-ui,sans-serif;padding:4px 10px;border-radius:999px;border:1px solid #ffd66b;background:transparent;color:#ffd66b;cursor:pointer}",
].join("");

const faceScreen = FACE_PTS.map(at);
const TPL = busSvg("__LV__", "__TXT__", "__HORA__");

/* ---------- la parte viva ---------- */
const live = String.raw`
(function () {
  "use strict";
  const P = __P__, BUS = __BUS__, SLOT = __SLOT__, DOOR = __DOOR__, DX = __DX__, FACE = __FACE__, CLK = __CLOCK__, W = __W__, H = __H__;
  const TPL = __TPL__, SVG = __SVG__, CSS = __CSS__;
  /* la cámara isométrica del kit, lo justo para mover autobuses y la persiana */
  const RAD = Math.PI / 180, UNIT = Math.sqrt(1.6);
  function iso(p) { const a = P.azimuth * RAD, e = P.elevation * RAD, kk = P.scale * UNIT;
    return [P.origin[0] + (p[0] * Math.sin(a) - p[1] * Math.cos(a)) * kk, P.origin[1] + ((p[0] * Math.cos(a) + p[1] * Math.sin(a)) * Math.sin(e) - p[2] * Math.cos(e)) * kk]; }
  const o0 = iso([0, 0, 0]);
  const mueve = (x) => { const q = iso([x, 0, 0]); return "translate(" + (q[0] - o0[0]).toFixed(2) + " " + (q[1] - o0[1]).toFixed(2) + ")"; };
  const hhmm = (h) => { const m = Math.round(((h % 24) + 24) % 24 * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  const dura = (h) => { const m = Math.max(0, Math.round(h * 60)); return m >= 60 ? Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0") : m + " min"; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const corto = (s) => { s = String(s).trim().toUpperCase(); if (s.length <= 9) return s; const w = s.split(/\s+/)[0]; return w.length <= 9 ? w : w.slice(0, 8) + "."; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const AMBS = ["ciudad", "hospital", "deporte", "bosque"];

  function crea(opts) {
    opts = opts || {};
    if (!document.getElementById("es-css")) { const st = document.createElement("style"); st.id = "es-css"; st.textContent = CSS; document.head.appendChild(st); }
    const ID = Math.random().toString(36).slice(2, 8);
    const el = document.createElement("div");
    el.className = "es iso";
    el.innerHTML = '<div tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="24" aria-label="Tu día como una estación: arrastra a lo ancho o usa las flechas para mover la hora; toca un autobús para abrirlo">' + SVG.replace(/__ID/g, ID) + "</div>" +
      '<div class="es-pie"><span data-r="pie"></span><button type="button" data-r="volver" hidden>volver ⟲</button></div>';
    const stage = el.firstChild, svg = el.querySelector("svg"), $ = (n) => svg.querySelector('[data-part="' + n + '"]');
    svg.querySelectorAll('[clip-path="url(#es-gar)"]').forEach((n) => n.setAttribute("clip-path", "url(#es-gar" + ID + ")"));
    const pie = el.querySelector('[data-r="pie"]'), btnV = el.querySelector('[data-r="volver"]');
    const capa = $("buses"), door = $("door"), slats = $("slats"), clip = $("garclip"), hands = $("hands"), astro = $("astro"), sky0 = $("sky0"), sky1 = $("sky1");
    const grupos = AMBS.map((a) => [a, [...svg.querySelectorAll("[data-amb]")].filter((g) => g.getAttribute("data-amb").split(" ").indexOf(a) >= 0)]);
    const todos = [...svg.querySelectorAll("[data-amb]")];
    const farol = $("farol"), farola = $("farola"), faro = $("faro"), focos = [...svg.querySelectorAll('[data-part="foco"]')];
    /* la casa por dentro: el conductor en una postura por escena, y lo que se enciende con él */
    const poses = [...svg.querySelectorAll("[data-pose]")], movil = $("movil"), lamparaM = $("lampara"), flexo = $("flexo"), tv = $("tv"), vapor = $("vapor"), taza = $("taza"), chaqueta = $("chaqueta"), manta = $("manta");
    const POSE = { cama: "cama", movil: "cama", leer: "cama", siesta: "cama", ducha: "ducha", cafe: "cafe", vestir: "vestir", escritorio: "escritorio", salon: "salon", casa: "salon" };
    let poseSet = null;
    function enCasa(t) {
      const casa = (D.esc && D.esc.casa) || [], sg = casa.find((s) => t >= s[0] && t < s[1]), e = sg ? sg[2] : "", pose = POSE[e] || "";
      if (pose === poseSet && e === enCasa.e) return; poseSet = pose; enCasa.e = e;
      poses.forEach((g) => { g.style.display = g.getAttribute("data-pose") === pose ? "" : "none"; });
      if (manta) manta.style.display = pose === "cama" ? "none" : "";
      if (vapor) vapor.style.opacity = e === "ducha" ? "1" : "0";
      if (movil) lampara(movil, e === "movil"); if (lamparaM) lampara(lamparaM, e === "movil" || e === "leer"); if (flexo) lampara(flexo, e === "escritorio"); if (taza) lampara(taza, e === "cafe");
      if (tv) tv.classList.toggle("on", e === "salon" || e === "casa");
      if (chaqueta) chaqueta.style.display = (e === "escritorio" || e === "salon" || e === "casa" || e === "ducha" || e === "leer" || e === "movil" || e === "cama") ? "" : "none";
    }
    const lampara = (n, on) => n.querySelectorAll(".m-lamp-off,.m-lamp").forEach((x) => { x.classList.toggle("m-lamp", on); x.classList.toggle("m-lamp-off", !on); });
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const BIG = "M-50 -50H" + (W + 50) + "V" + (H + 50) + "H-50Z", facePath = "M" + FACE.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
    const Q = (pts) => "M" + pts.map((p) => { const s = iso(p); return s[0].toFixed(2) + " " + s[1].toFixed(2); }).join("L") + "Z";
    let D = null, flota = [], buses = [], WAKE = 7, BED = 23.5, nocheBus = null;
    let t = 10, target = 10, AHORA = null, frame = 0, last = 0, idle = 0, vivoT = 0, visible = true, mirando = false, abierta = 1, amb = "", ambSet = "";

    function pintaPuerta(a) {
      const z0 = DOOR.h * a;
      door.setAttribute("d", a > 0.995 ? "" : Q([[DX, DOOR.y0, z0], [DX, DOOR.y1, z0], [DX, DOOR.y1, DOOR.h], [DX, DOOR.y0, DOOR.h]]));
      let s = "";
      for (let z = z0 + 2.2; z < DOOR.h - 0.4; z += 2.2) { const p = iso([DX, DOOR.y0, z]), q = iso([DX, DOOR.y1, z]); s += "M" + p[0].toFixed(2) + " " + p[1].toFixed(2) + "L" + q[0].toFixed(2) + " " + q[1].toFixed(2); }
      slats.setAttribute("d", s);
      clip.setAttribute("d", BIG + facePath + (a > 0.01 ? Q([[DX, DOOR.y0, 0], [DX, DOOR.y1, 0], [DX, DOOR.y1, z0], [DX, DOOR.y0, z0]]) : ""));
    }
    function pintaReloj(t) {
      const am = (t % 1) * Math.PI * 2, ah = ((t % 12) / 12) * Math.PI * 2;
      const p = (a, r) => (CLK[0] + r * Math.sin(a)).toFixed(2) + " " + (-(CLK[2] + r * Math.cos(a))).toFixed(2);
      hands.setAttribute("d", "M" + p(ah + Math.PI, 1) + "L" + p(ah, 3.8) + "M" + p(am + Math.PI, 1.4) + "L" + p(am, 5.6));
    }
    /* el cielo: el mismo del conductor; el sol cruza la parte de arriba y de noche sale la luna */
    function cielo(t) {
      const SOL = D.sol || [7, 18.6], C = window.Conductor;
      const L = C && C.luz ? C.luz(t, SOL) : { d: t > SOL[0] && t < SOL[1] ? 1 : 0, top: "#4f93d8", bot: "#bfe0ff" };
      sky0.setAttribute("stop-color", L.top); sky1.setAttribute("stop-color", L.bot);
      let o = "";
      const f = (t - SOL[0]) / (SOL[1] - SOL[0]);
      if (f > -0.05 && f < 1.05) { const al = Math.sin(Math.PI * clamp(f, 0, 1)), x = 40 + f * 520, y = 120 - al * 92;
        o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="30" fill="#ffe2a0" opacity="' + (0.22 * L.d).toFixed(2) + '"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="12" fill="' + (al < 0.45 ? "#ffab55" : "#fff2c4") + '"/>'; }
      const larga = 24 - (SOL[1] - SOL[0]), g = (((t - SOL[1]) % 24) + 24) % 24 / larga;
      if (g > 0 && g < 1 && L.d < 0.9) { const al = Math.sin(Math.PI * g), x = 40 + g * 520, y = 110 - al * 80;
        o += '<g opacity="' + (1 - L.d).toFixed(2) + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" fill="#e8eefc"/><circle cx="' + (x - 3).toFixed(1) + '" cy="' + (y - 2).toFixed(1) + '" r="2" fill="#c9d3ea"/><circle cx="' + (x + 2.4).toFixed(1) + '" cy="' + (y + 3).toFixed(1) + '" r="1.4" fill="#c9d3ea"/></g>';
        for (let i = 0; i < 18; i++) o += '<circle cx="' + (20 + ((i * 97) % 560)).toFixed(0) + '" cy="' + (14 + ((i * 53) % 120)).toFixed(0) + '" r="' + (0.6 + (i % 3) * 0.35).toFixed(1) + '" fill="#e9f2ff" opacity="' + ((1 - L.d) * 0.7).toFixed(2) + '"/>'; }
      astro.innerHTML = o;
      return L;
    }

    function prepara() {
      const dia = (D.dia || []).filter((e) => e.b > e.a);
      const noches = D.noches || [];
      const manana = noches.filter((n) => n.t === "noche" && n.a <= 3)[0];
      WAKE = manana ? manana.b : 0;
      const nn = noches.filter((n) => n.t === "noche" && n.a >= 12)[0];
      BED = nn ? nn.a : 24.5;
      nocheBus = { a: BED, b: nn ? nn.b : 31, t: "A DORMIR", k: "sleep", i: "" };
      flota = dia.slice().sort((a, b) => a.a - b.a).concat(nn ? [nocheBus] : []);
      const lv = (k) => (k === "guard" ? "guard" : k === "work" ? "work" : k === "meal" || k === "gym" || k === "plan" ? k : "plan");
      capa.innerHTML = flota.map((e, i) => '<g data-bus="' + i + '"><g data-mv>' + TPL.replace(/__LV__/g, e === nocheBus ? "sleep" : lv(e.k)).replace("__TXT__", esc(e === nocheBus ? "A DORMIR" : corto(e.t))).replace("__HORA__", hhmm(e.a)) + "</g></g>").reverse().join("");
      /* un nombre largo se estrecha para no pisar la hora del letrero */
      capa.querySelectorAll(".sign-t").forEach((n) => { if (n.textContent.length > 6) { n.setAttribute("textLength", "33"); n.setAttribute("lengthAdjust", "spacingAndGlyphs"); } });
      buses = flota.map((e, i) => { const n = capa.querySelector('[data-bus="' + i + '"]'); n.querySelectorAll('[clip-path]').forEach(() => {}); return { e, i, el: n, mv: n.firstChild, x: SLOT.garage, cls: "" }; });
      /* el indicador del sueño en la fachada de la cochera */
      const g = $("gauge"), ob = $("obj"), lcd = $("lcd"), z0 = 8, z1 = 38, zh = (h) => z0 + 1.2 + (z1 - z0 - 2.4) * clamp(h, 0, 10) / 10, s = D.sueno;
      g.setAttribute("y", -zh(s ? s.h : 0)); g.setAttribute("height", Math.max(0, zh(s ? s.h : 0) - z0 - 1));
      ob.setAttribute("d", s && s.obj ? "M-169.2 " + (-zh(s.obj)) + "H-157.4" : "");
      lcd.textContent = s ? (Math.round(s.h * 10) / 10 + " h · " + s.obj).replace(".", ",") : "sin apuntar";
    }
    function noche(t) { return t < WAKE || t >= BED || (D.noches || []).some((n) => n.t === "siesta" && t >= n.a && t < n.b); }
    function destino(b, t) {
      const nc = noche(t);
      if (b.e === nocheBus) { if (t < WAKE || t >= BED) return SLOT.garage; }
      else {
        if (t >= b.e.b) return SLOT.exit;
        if (nc && b.e.k !== "guard") return t < WAKE ? SLOT.garage : (t >= b.e.a ? SLOT.exit : SLOT.garage);
        if (t >= b.e.a) return SLOT.bay;
      }
      const delante = buses.filter((o) => o !== b && o.e !== nocheBus && o.i < b.i && t < o.e.a).length;
      const espera = b.e === nocheBus ? flota.filter((o) => o !== nocheBus && t < o.a).length : delante;
      return espera === 0 ? SLOT.s0 : espera === 1 ? SLOT.s1 : SLOT.garage;
    }
    function estado(t) {
      const dia = flota.filter((e) => e !== nocheBus), ya = dia.filter((e) => t >= e.a && t < e.b), sig = dia.filter((e) => e.a > t);
      const ahora = ya.filter((e) => e.k !== "work" && e.k !== "guard").pop() || ya.pop() || null;
      const siesta = (D.noches || []).find((n) => n.t === "siesta" && t >= n.a && t < n.b);
      if (siesta) return { txt: "siesta · hasta las <b>" + hhmm(siesta.b) + "</b>", ahora: null };
      if (t < WAKE) return { txt: "durmiendo · te levantas a las <b>" + hhmm(WAKE) + "</b>", ahora: null };
      if (t >= BED && !ahora) return { txt: "a dormir · hasta las <b>" + hhmm(nocheBus.b) + "</b>", ahora: null };
      if (ahora) return { txt: "<b>" + esc(ahora.t) + "</b> · hasta las " + hhmm(ahora.b) + " · queda" + (ahora.b - t >= 1 ? "n " : " ") + dura(ahora.b - t), ahora };
      return { txt: "libre · " + (sig[0] ? "<b>" + esc(sig[0].t) + "</b> a las " + hhmm(sig[0].a) : "a la cochera a las " + hhmm(BED)), ahora: null };
    }
    /* el ambiente se funde: el que toca a 1 y los demás a 0 */
    function decorado(a) {
      if (a === ambSet) return; ambSet = a;
      todos.forEach((g) => { g.style.opacity = g.getAttribute("data-amb").split(" ").indexOf(a) >= 0 ? "1" : "0"; });
    }
    function draw(dt) {
      if (!D) return false;
      const L = cielo(t), luz = L.d;
      el.classList.toggle("es-noche", luz < 0.35); el.classList.toggle("es-tarde", luz >= 0.35 && luz < 0.92 && t > 12);
      const C = window.Conductor; decorado(C && C.ambienteA ? C.ambienteA(D, t) : "ciudad");
      const want = (t < WAKE || t >= BED) && !flota.some((e) => e.k === "guard" && t >= e.a && t < e.b) ? 0 : 1;
      abierta = still.matches || !dt ? want : abierta + (want - abierta) * (1 - Math.exp(-dt / 0.35));
      if (Math.abs(want - abierta) < 0.002) abierta = want;
      pintaPuerta(abierta); pintaReloj(t); enCasa(t);
      lampara(farol, luz < 0.5); lampara(farola, luz < 0.6); focos.forEach((f) => lampara(f, luz < 0.75)); if (faro) lampara(faro, luz < 0.6);
      let busy = abierta !== want;
      const st = estado(t);
      for (const b of buses) {
        const goal = destino(b, t);
        b.x = still.matches || !dt ? goal : b.x + (goal - b.x) * (1 - Math.exp(-dt / 0.45));
        if (Math.abs(goal - b.x) < 0.05) b.x = goal; else busy = true;
        const op = b.x > 110 ? Math.max(0, 1 - (b.x - 110) / 40) : 1;
        b.mv.setAttribute("transform", mueve(b.x));
        b.el.style.opacity = op < 0.999 ? op.toFixed(3) : "";
        b.el.style.display = op <= 0.001 ? "none" : "";
        if (b.x < DX + 0.5) b.el.setAttribute("clip-path", "url(#es-gar" + ID + ")"); else b.el.removeAttribute("clip-path");
        const cls = st.ahora === b.e && Math.abs(b.x - SLOT.bay) < 6 ? "ahora" : (b.e === nocheBus && (t < WAKE || t >= BED) ? "dormido" : "");
        if (cls !== b.cls) { if (b.cls) b.el.classList.remove(b.cls); if (cls) b.el.classList.add(cls); b.cls = cls; }
      }
      pie.innerHTML = (mirando ? "viendo las " : "") + "<b>" + hhmm(t) + "</b> · " + st.txt;
      btnV.hidden = !mirando;
      stage.setAttribute("aria-valuenow", String(Math.round(t * 100) / 100));
      stage.setAttribute("aria-valuetext", hhmm(t) + " · " + st.txt.replace(/<[^>]+>/g, ""));
      return busy;
    }
    function tick(now) {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
      t = still.matches ? target : t + (target - t) * (1 - Math.exp(-dt / 0.4));
      if (Math.abs(target - t) < 0.002) t = target;
      const busy = draw(dt);
      frame = visible && (busy || t !== target) ? requestAnimationFrame(tick) : 0;
    }
    const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
    const vuelve = () => { mirando = false; if (AHORA != null) target = AHORA; run(); draw(0); };
    const steer = (to) => { target = clamp(to, 0, 23.99); mirando = AHORA != null && Math.abs(target - AHORA) > 0.05; clearTimeout(idle); idle = setTimeout(vuelve, 9000); run(); };
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }).observe(stage);
    const abrir = (o) => { try { opts.onAbrir && opts.onAbrir(o); } catch (e) {} };
    let down = null;
    stage.addEventListener("pointerdown", (ev) => { down = { x: ev.clientX, t: target, moved: false, el: ev.target }; });
    stage.addEventListener("pointermove", (ev) => {
      if (!down) return; const dx = ev.clientX - down.x, w = svg.getBoundingClientRect().width;
      if (Math.abs(dx) > 7) down.moved = true; if (down.moved) steer(down.t + dx / w * 14);
    });
    stage.addEventListener("pointerup", () => {
      const d = down; down = null; if (!d || d.moved) return;
      const bus = d.el.closest && d.el.closest("[data-bus]"), gar = !bus && d.el.closest && d.el.closest(".garaje");
      if (bus) { const e = flota[+bus.getAttribute("data-bus")]; if (e && e !== nocheBus && e.i !== "" && e.i != null) abrir({ tipo: "item", i: +e.i, rapida: false }); else if (e === nocheBus) abrir({ tipo: D.sueno ? "sueno" : "anotar" }); }
      else if (gar) abrir({ tipo: D.sueno ? "sueno" : "anotar" });
    });
    stage.addEventListener("pointercancel", () => { down = null; });
    stage.addEventListener("keydown", (ev) => {
      const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[ev.key];
      if (d) { ev.preventDefault(); steer(Math.round(target * 4) / 4 + d * 0.25); }
      if (ev.key === "Escape" || ev.key === "Home") vuelve();
    });
    btnV.addEventListener("click", vuelve);

    function actualiza(datos) {
      D = datos || { dia: [] };
      el.setAttribute("data-theme", D.claro ? "light" : "dark");
      prepara();
      const nuevaHora = D.ahora != null ? clamp(D.ahora, 0, 23.99) : null;
      if (!mirando || nuevaHora == null) { AHORA = nuevaHora; if (AHORA != null) t = target = AHORA; } else AHORA = nuevaHora;
      clearInterval(vivoT);
      if (D.vivo && AHORA != null) {
        const t0 = AHORA, carga = Date.now();
        vivoT = setInterval(() => {
          const h = t0 + (Date.now() - carga) / 36e5;
          if (h >= 24) { clearInterval(vivoT); abrir({ tipo: "nuevoDia" }); return; }
          AHORA = h; if (!mirando) { target = h; run(); }
        }, 30000);
      }
      ambSet = ""; poseSet = null; buses.forEach((b) => { b.x = destino(b, t); });
      draw(0);
    }
    return { el, actualiza, hora: () => t };
  }
  window.Estacion = { crea };
})();
`;
const js = `/* GENERADO por design/hoy-estacion/app.mjs con el kit de /anatomy: no se edita a mano. */\n` + live
  .replace("__P__", JSON.stringify(P)).replace("__BUS__", JSON.stringify(BUS)).replace("__SLOT__", JSON.stringify(SLOT)).replace("__DOOR__", JSON.stringify(DOOR))
  .replace("__DX__", String(DX)).replace("__FACE__", JSON.stringify(faceScreen)).replace("__CLOCK__", JSON.stringify(CLOCK)).replace("__W__", String(WIDTH)).replace("__H__", String(HEIGHT))
  .replace("__TPL__", JSON.stringify(TPL)).replace("__SVG__", JSON.stringify(svg.replace(/url\(#es-gar__ID\)/g, "url(#es-gar__ID)"))).replace("__CSS__", JSON.stringify(CSS));
writeFileSync(join(HERE, "../../fig/estacion.js"), js);
console.log("fig/estacion.js", Math.round(js.length / 1024), "KB");
