/* «Hoy» como una estación de autobuses (maqueta). Cada cosa del día es un autobús con su hora y su
   nombre en el letrero. Hacen cola por orden de llegada: el primero está en el andén (AHORA) y los
   siguientes esperan detrás; cuando uno termina sale por la derecha y la cola avanza. La cochera es la
   noche: por la mañana se abre y salen los autobuses; a tu hora de dormir entra el último, se apaga y la
   puerta baja. En su fachada, un indicador con lo que dormiste anoche frente a tu objetivo. El reloj
   de la marquesina marca la hora; deslizar el dedo mueve el día.
   Escribe design/hoy-estacion/estacion(-light).html. node build.mjs [--light] [--t=10.4]
   El día puede llegar en la dirección: #d=[{a,b,t,k}…]&s=7.5/8&t=10.4&corto */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const arg = process.argv.find((a) => a.startsWith("--t="));
const T0 = arg ? +arg.slice(4) : 10.4;
const WIDTH = 600, HEIGHT = 330;

/* ---------- un día de ejemplo (en la app sale de la agenda de Hoy) ---------- */
const DIA = [
  { a: 0, b: 6.75, t: "DORMIR", k: "sleep" },
  { a: 6.75, b: 7.25, t: "DESAYUNO", k: "meal" },
  { a: 8, b: 15, t: "TRABAJO UMI", k: "work" },
  { a: 15.17, b: 15.75, t: "COMIDA", k: "meal" },
  { a: 17.5, b: 18.75, t: "GYM FUERZA", k: "gym" },
  { a: 19.25, b: 19.75, t: "CENA", k: "meal" },
  { a: 20, b: 22.17, t: "LLORETAZO", k: "plan" },
  { a: 22.67, b: 30.75, t: "A DORMIR", k: "sleep" },
];
const SUENO = { h: 7, obj: 8 };

/* ---------- el mundo (unidades ~ px; x a lo largo de la calzada, y hacia quien mira, z arriba) ---------- */
const PLATE = { x: -186, y: -62, w: 346, d: 96, r: 6 }, PLATE_H = 8, FOOT_H = 4;
const LANE = { x: -110, y: -6, w: 268, d: 26 };
const PLAT = { x: 26, y: -54, w: 130, d: 44, r: 2 }, PLAT_H = 5;
const ROOF = { x: 28, y: -58, w: 128, d: 50, r: 2 }, ROOF_Z = 60;
const POSTS = [[40, -46], [142, -46]];
const CLOCK = [92, -9.6, 46], CLOCK_R = 7.4;
const GAR = { x: -178, y: -46, w: 68, d: 68, r: 1 }, GAR_H = 46, DOOR = { y0: -4, y1: 18, h: 27 };
const BUS = { L: 60, W: 14, Z0: 3, Z1: 32 };
const SLOT = { bay: 44, s0: -24, s1: -94, garage: -174, exit: 196 };

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners(ROOF, 0, ROOF_Z + 4), ...k.boxCorners(GAR, 0, GAR_H + 3)],
  WIDTH, HEIGHT, { pad: 12, azimuth: +(process.argv.find((a) => a.startsWith("--az=")) || "--az=50").slice(5), elevation: +(process.argv.find((a) => a.startsWith("--el=")) || "--el=27").slice(5) });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const front = (y) => k.sideMatrix([0, y], 0, P, "left");     // la cara que mira hacia y+ : (u = x, v = −z)
const side = (x) => k.sideMatrix([x, 0], 0, P, "right");     // la cara que mira hacia x+ : (u = −y, v = −z)
const rect = (u0, z0, u1, z1) => `M${u0} ${-z1}H${u1}V${-z0}H${u0}Z`;
const quad = (pts) => k.pathOf(pts.map(at), true);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

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
  /* la placa: tres renglones grabados */
  const lab = { x: 112, y: 24, w: 30, d: 7, r: 1 };
  out.push(S(k.slabOf(lab, 0, 0.6, P, 3), { tone: "mid", className: "m-steel", crease: "none" }));
  out.push(L([20, 14].map((w, i) => k.lineOnTop([lab.x + 3, lab.y + 2.4 + i * 2.2], [lab.x + 3 + w, lab.y + 2.4 + i * 2.2], 0.6, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([lab.x + lab.w - 2.4, lab.y + lab.d / 2, 0.6])], { size: 0.4 }));
  return out.join("");
}

/* la calzada: asfalto, el bordillo, el hueco del andén pintado y la flecha de salida */
function lane() {
  const out = [];
  out.push(S(k.slabOf({ ...LANE, r: 0.6 }, 0, 0.6, P, 2), { tone: "mid", className: "m-asphalt", crease: "none", flat: true }));
  out.push(L(k.lineOnTop([LANE.x, LANE.y + 1.2], [LANE.x + LANE.w, LANE.y + 1.2], 0.6, P) + k.lineOnTop([LANE.x, LANE.y + LANE.d - 1.2], [LANE.x + LANE.w, LANE.y + LANE.d - 1.2], 0.6, P), { tone: "faint", className: "l-paint" }));
  const bay = { x: SLOT.bay - 3, y: -2.5, w: BUS.L + 6, d: BUS.W + 5 };
  out.push(L(k.onTop([[bay.x, bay.y], [bay.x + bay.w, bay.y], [bay.x + bay.w, bay.y + bay.d], [bay.x, bay.y + bay.d]], 0.6, P, true), { className: "l-bay" }));
  for (const x of [128, 140]) out.push(L(k.onTop([[x, 1], [x + 7, 7], [x, 13]], 0.6, P), { className: "l-paint" }));
  return out.join("");
}

/* el andén: losa, banda podotáctil, bancos, papelera y farola */
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

/* la marquesina: dos postes, la cubierta con su canalón y el reloj colgado */
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
  /* el reloj: varilla, caja redonda y esfera de cara a quien mira */
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
  /* la farola del extremo del andén */
  out.push(S(k.cylinder(152, -14, 2.4, PLAT_H, 1.4, P, 20), { tone: "mid", className: "m-steel" }));
  out.push(S(k.cylinder(152, -14, 1, PLAT_H + 1.4, 46, P, 16), { tone: "mid", className: "m-steel", crease: "none" }));
  out.push(`<g data-part="farola">${S(k.slabOf({ x: 148.5, y: -17.5, w: 7, d: 7, r: 1.4 }, PLAT_H + 47.4, 3.2, P, 3, 0.4), { tone: "mid", className: "m-lamp-off" })}</g>`);
  out.push(S(k.slabOf({ x: 147.5, y: -18.5, w: 9, d: 9, r: 1.8 }, PLAT_H + 50.6, 1.6, P, 3, 0.4), { tone: "mid", className: "m-steel" }));
  return out.join("");
}

/* ---------- la cochera: atrás (antes de los autobuses) y la fachada (después, los tapa al entrar) ---------- */
const FACE_PTS = [[GAR.x + GAR.w, GAR.y, 0], [GAR.x + GAR.w, GAR.y + GAR.d, 0], [GAR.x + GAR.w, GAR.y + GAR.d, GAR_H], [GAR.x + GAR.w, GAR.y, GAR_H]];
const DX = GAR.x + GAR.w;
function garageBack() {
  const out = [`<path class="iso-halo" d="${k.haloOf(GAR, 0, 4, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(GAR, 0, GAR_H, P, 2, 0.6), { tone: "mid", className: "m-brick" }));
  out.push(S(k.slabOf({ x: GAR.x - 2, y: GAR.y - 2, w: GAR.w + 2, d: GAR.d + 4, r: 1 }, GAR_H, 3, P, 2, 0.5), { tone: "mid", className: "m-roof" }));
  out.push(L(k.planOutline(k.insetPlan({ x: GAR.x - 2, y: GAR.y - 2, w: GAR.w + 2, d: GAR.d + 4, r: 1 }, 3), GAR_H + 3, P), { tone: "faint" }));
  /* el hueco de la puerta, oscuro, con su dintel; la persiana se pinta viva */
  const op = [[DX, DOOR.y0, 0], [DX, DOOR.y1, 0], [DX, DOOR.y1, DOOR.h], [DX, DOOR.y0, DOOR.h]];
  out.push(`<path class="garage-dark" d="${quad(op)}"/>`);
  out.push(`<path data-part="door" class="door" d=""/><path data-part="slats" class="door-slat" d=""/>`);
  out.push(S(k.slabOf({ x: DX - 0.6, y: DOOR.y0 - 2, w: 1.6, d: DOOR.y1 - DOOR.y0 + 4, r: 0.3 }, DOOR.h, 2.4, P, 2), { tone: "mid", className: "m-steel" }));
  for (const y of [DOOR.y0 - 1.4, DOOR.y1 + 0.2]) out.push(S(k.slabOf({ x: DX - 0.4, y, w: 1.2, d: 1.2, r: 0.2 }, 0, DOOR.h, P, 1), { tone: "mid", className: "m-steel", crease: "none" }));
  /* rejilla de ventilación sobre la puerta */
  out.push(L(Array.from({ length: 6 }, (_, i) => k.segment([DX, -30 + i * 2.6, GAR_H - 12], [DX, -30 + i * 2.6, GAR_H - 5], P)).join(""), { tone: "faint" }));
  return out.join("");
}
function garageFront() {
  const out = [];
  const yF = GAR.y + GAR.d;
  out.push(S(k.slabOf({ x: GAR.x, y: yF - 1, w: GAR.w, d: 1, r: 0 }, 0, GAR_H, P, 1), { tone: "mid", className: "m-brick" }));
  /* hiladas de ladrillo, de canto a canto */
  const hil = [];
  for (let z = 4; z < GAR_H; z += 4) hil.push(`M${GAR.x + 0.6} ${-z}H${DX - 0.6}`);
  out.push(`<g transform="${front(yF + 0.02)}"><path class="brick" d="${hil.join("")}"/></g>`);
  /* el indicador del sueño: un tubo con su escala de 0 a 10 h, la marca del objetivo y la lectura */
  const g = { u0: -168, u1: -161, z0: 8, z1: 38 };
  const zh = (h) => g.z0 + 1.2 + (g.z1 - g.z0 - 2.4) * Math.min(10, Math.max(0, h)) / 10;
  const marks = [];
  for (let h = 0; h <= 10; h++) marks.push(`M${g.u1 + 0.6} ${-zh(h)}H${g.u1 + (h % 2 ? 2 : 3.4)}`);
  out.push(S(k.slabOf({ x: g.u0 - 2, y: yF, w: g.u1 - g.u0 + 7, d: 1.2, r: 0.5 }, g.z0 - 2.5, g.z1 - g.z0 + 5, P, 2, 0.3), { tone: "mid", className: "m-steel" }));
  out.push(`<g transform="${front(yF + 1.25)}">` +
    `<rect class="gauge-tube" x="${g.u0}" y="${-g.z1}" width="${g.u1 - g.u0}" height="${g.z1 - g.z0}" rx="1.6"/>` +
    `<rect data-part="gauge" class="gauge-fill" x="${g.u0 + 1}" y="${-zh(SUENO.h)}" width="${g.u1 - g.u0 - 2}" height="${zh(SUENO.h) - g.z0 - 1}" rx="1"/>` +
    `<path class="gauge-mark" d="${marks.join("")}"/>` +
    `<path data-part="obj" class="gauge-obj" d="M${g.u0 - 1.2} ${-zh(SUENO.obj)}H${g.u1 + 3.6}"/>` +
    `</g>`);
  /* la lectura del indicador: un visor con «7 h / 8» */
  const v = { u0: -156, u1: -128, z0: 25, z1: 33 };
  out.push(S(k.slabOf({ x: v.u0 - 1.5, y: yF, w: v.u1 - v.u0 + 3, d: 1.2, r: 0.6 }, v.z0 - 1.5, v.z1 - v.z0 + 3, P, 2, 0.3), { tone: "mid", className: "m-steel" }));
  out.push(`<g transform="${front(yF + 1.25)}"><rect class="lcd" x="${v.u0}" y="${-v.z1}" width="${v.u1 - v.u0}" height="${v.z1 - v.z0}" rx="0.8"/>` +
    `<text data-part="lcd" class="lcd-t" x="${(v.u0 + v.u1) / 2}" y="${-(v.z0 + 2.2)}">${SUENO.h} h · ${SUENO.obj}</text>` +
    `<text class="lcd-s" x="${(v.u0 + v.u1) / 2}" y="${-(v.z0 - 4.6)}">ANOCHE</text></g>`);
  /* el farol de la cochera: se enciende de noche */
  out.push(S(k.slabOf({ x: -140, y: yF, w: 6, d: 2.4, r: 0.6 }, 40, 1.4, P, 2), { tone: "mid", className: "m-steel" }));
  out.push(`<g data-part="farol">${S(k.slabOf({ x: -139.2, y: yF + 0.4, w: 4.4, d: 1.8, r: 0.6 }, 36.4, 3.6, P, 2, 0.3), { tone: "mid", className: "m-lamp-off" })}</g>`);
  out.push(D([[-174, 4], [-114, 4], [-174, 42], [-114, 42]].map(([x, z]) => at([x, yF + 0.05, z])), { size: 0.45 }));
  return out.join("");
}

/* ---------- un autobús, construido una vez en x = 0 y movido entero ---------- */
function busSvg(LV, TXT, HORA) {
  const { L: BL, W: BW, Z0, Z1 } = BUS, out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: 2, y: 1, w: BL - 4, d: BW - 2, r: 3 }, 0, 0.2, P)}" style="filter:blur(2.5px)"/>`);
  out.push(S(k.slabOf({ x: 0, y: 0, w: BL, d: BW, r: 2.6 }, Z0, Z1 - Z0, P, 4, 0.9), { tone: "mid", className: "m-bus" }));
  out.push(S(k.slabOf({ x: 1.5, y: 1.2, w: BL - 3, d: BW - 2.4, r: 2 }, Z1, 1.2, P, 4, 0.4), { tone: "mid", className: "m-" + LV }));
  out.push(S(k.slabOf({ x: 20, y: 3.4, w: 18, d: BW - 6.8, r: 1 }, Z1 + 1.2, 2.4, P, 3, 0.4), { tone: "mid", className: "m-steel" }));
  out.push(L(k.planOutline({ x: 22, y: 4.6, w: 14, d: BW - 9.2, r: 0.6 }, Z1 + 3.6, P, 2), { tone: "faint" }));
  /* el costado: franja de color, ventanillas con sus montantes y el letrero */
  const pil = [15, 27, 39, 51].map((u) => `M${u} ${-21.4}V${-14}`).join("");
  out.push(`<g transform="${front(BW + 0.02)}">` +
    `<path class="lv ${LV}" d="${rect(0.8, 8, BL - 0.8, 10.6)}"/>` +
    `<path class="glass" d="${rect(3, 13.4, BL - 3, 22)}"/><path class="pillar" d="${pil}"/>` +
    `<path class="sign" d="${rect(3, 23.2, BL - 3, 30.6)}"/>` +
    `<text class="sign-h" x="4.4" y="${-25.3}">${HORA}</text><text class="sign-t" x="${BL - 4.6}" y="${-24.4}">${TXT}</text>` +
    `<path class="skirt" d="M1 -6H${BL - 1}"/></g>`);
  /* el frente: parabrisas, faros y el letrero pequeño */
  out.push(`<g transform="${side(BL + 0.02)}">` +
    `<path class="glass" d="${rect(-BW + 1.6, 13, -1.6, 27.6)}"/>` +
    `<path class="sign" d="${rect(-BW + 2.2, 28.4, -2.2, 31)}"/>` +
    `<path class="lv ${LV}" d="${rect(-BW + 0.8, 8, -0.8, 10.6)}"/>` +
    `<circle class="lamp-h" cx="${-BW + 2.6}" cy="-5.6" r="1.1"/><circle class="lamp-h" cx="-2.6" cy="-5.6" r="1.1"/></g>`);
  /* el retrovisor */
  out.push(S(k.slabOf({ x: BL - 1, y: BW - 0.4, w: 1.6, d: 2.6, r: 0.4 }, 22, 6, P, 2), { tone: "lo", className: "m-steel" }));
  /* las ruedas del lado que se ve, con su tapacubos */
  for (const x of [12, 47]) {
    const F = G.frameAlong([x, BW - 1.2, 5], [0, 1, 0]);
    out.push(S(G.disc(0, 2.2, 5, F, P), { tone: "lo", className: "m-tyre" }));
    out.push(S(G.disc(2.2, 2.5, 2.6, F, P), { tone: "mid", className: "m-steel" }));
  }
  return out.join("");
}

/* la recorte de la cochera para el autobús que entra o sale: todo menos su fachada lateral, salvo el
   hueco de la puerta abierta (la parte que se pinta en vivo) */
const faceScreen = FACE_PTS.map(at);

const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "Una estación de autobuses en miniatura sobre una peana. Cada cosa del día es un autobús con su hora y su nombre en el letrero; hacen cola por orden de llegada y el primero espera en el andén, bajo la marquesina con el reloj. A la izquierda, la cochera: de noche guarda el autobús con la puerta bajada, y en su fachada un indicador marca lo que dormiste anoche frente a tu objetivo.",
  body: [
    `<defs><clipPath id="garclip" clipPathUnits="userSpaceOnUse"><path data-part="garclip" clip-rule="evenodd" d=""/></clipPath></defs>`,
    base(), lane(), platform(), canopy(), `<g class="garaje">${garageBack()}</g>`,
    `<g data-part="buses"></g>`,
    `<g class="garaje">${garageFront()}</g>`,
  ],
});

/* ---------- los colores: los de la app (azul marino, acero, cian) y una librea por tipo ---------- */
const mat = (sel, v) => `${sel}{${Object.entries(v).map(([a, b]) => `--anatomy-${a}:${b}`).join(";")}}`;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, f) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * f).toString(16).padStart(2, "0")).join("");
/* un material a partir de un color: caras más oscuras según miran, techo más claro */
const tinte = (sel, c, dark) => mat(sel, dark
  ? { paper: c, "shade-0": mix(c, "#000000", 0.45), "shade-1": mix(c, "#000000", 0.35), "shade-2": mix(c, "#000000", 0.25), "shade-3": mix(c, "#000000", 0.15), top: mix(c, "#ffffff", 0.12), hi: mix(c, "#ffffff", 0.55), mid: mix(c, "#ffffff", 0.25), lo: mix(c, "#000000", 0.5), faint: mix(c, "#000000", 0.3) }
  : { paper: c, "shade-0": mix(c, "#000000", 0.22), "shade-1": mix(c, "#000000", 0.16), "shade-2": mix(c, "#000000", 0.1), "shade-3": mix(c, "#000000", 0.04), top: mix(c, "#ffffff", 0.3), hi: mix(c, "#000000", 0.6), mid: mix(c, "#000000", 0.35), lo: mix(c, "#000000", 0.18), faint: mix(c, "#000000", 0.08) });
const LIBREAS = { work: ["#d9573f", "#ef7a63"], meal: ["#2f9e6b", "#56c48f"], gym: ["#7a5cf0", "#9c86ff"], plan: ["#1fa6c4", "#4cc9e4"], sleep: ["#34467e", "#6f86c8"] };
const CSS = [
  mat(".iso", { page: "#070b14", card: "#111a2b", paper: "#111a2b", text: "#8fa6c6", strong: "#e9f2ff", muted: "#5d7394", halo: "#02040a" }),
  mat(".iso[data-theme=light]", { page: "#f4f7fb", card: "#ffffff", paper: "#ffffff", text: "#4a5d78", strong: "#0d1726", muted: "#8a9ab2", halo: "#5c6f8c" }),
  tinte(".m-base", "#16223a", true), tinte("[data-theme=light] .m-base", "#dfe7f2", false),
  tinte(".m-steel", "#3a4a62", true), tinte("[data-theme=light] .m-steel", "#d4dde8", false),
  tinte(".m-roof", "#24324c", true), tinte("[data-theme=light] .m-roof", "#c9d4e3", false),
  tinte(".m-concrete", "#3b4659", true), tinte("[data-theme=light] .m-concrete", "#e3e8ef", false),
  tinte(".m-asphalt", "#1c2433", true), tinte("[data-theme=light] .m-asphalt", "#b9c2cf", false),
  tinte(".m-brick", "#5a3b33", true), tinte("[data-theme=light] .m-brick", "#d9a493", false),
  tinte(".m-wood", "#6b5038", true), tinte("[data-theme=light] .m-wood", "#d8b892", false),
  tinte(".m-bus", "#c9d4e4", true), tinte("[data-theme=light] .m-bus", "#f7f9fc", false),
  tinte(".m-tyre", "#151a22", true), tinte("[data-theme=light] .m-tyre", "#3a404a", true),
  tinte(".m-dial", "#e9eef5", true), tinte("[data-theme=light] .m-dial", "#ffffff", false),
  tinte(".m-lamp-off", "#2a3448", true), tinte("[data-theme=light] .m-lamp-off", "#c5ceda", false),
  tinte(".m-lamp", "#ffd66b", true), tinte("[data-theme=light] .m-lamp", "#ffcf4a", false),
  ...Object.entries(LIBREAS).flatMap(([n, [d, l]]) => [tinte(".m-" + n, d, true), tinte("[data-theme=light] .m-" + n, l, false),
    `.lv.${n}{fill:${d}}[data-theme=light] .lv.${n}{fill:${l}}`]),
  ".l-paint{stroke:#8fa6c6!important;stroke-opacity:.55}.l-bay{stroke:#e3b341!important;stroke-width:.9px}[data-theme=light] .l-paint{stroke:#ffffff!important;stroke-opacity:.9}",
  ".tactile{fill:#c99a2e}[data-theme=light] .tactile{fill:#f0c24b}",
  ".garage-dark{fill:#05070c}.door{fill:#55657d}.door-slat{stroke:#2c3a50;stroke-width:.5;fill:none}[data-theme=light] .door{fill:#c3cddb}[data-theme=light] .door-slat{stroke:#93a3b9}",
  ".brick{stroke:#3d2620;stroke-width:.45;fill:none}[data-theme=light] .brick{stroke:#c08b79}",
  ".gauge-tube{fill:#05070c;stroke:#52647f;stroke-width:.5}.gauge-fill{fill:#5a78d0}.gauge-mark{stroke:#8fa6c6;stroke-width:.45}.gauge-obj{stroke:#38e1ff;stroke-width:.9}",
  "[data-theme=light] .gauge-tube{fill:#1b2537}[data-theme=light] .gauge-fill{fill:#6f8fe0}[data-theme=light] .gauge-mark{stroke:#4a5d78}[data-theme=light] .gauge-obj{stroke:#0b8eae}",
  ".lcd{fill:#04131a}.lcd-t{fill:#7fecff;font:700 4.6px/1 ui-monospace,Menlo,monospace;text-anchor:middle}.lcd-s{fill:#e9f2ff;font:800 3.2px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-anchor:middle}",
  "[data-theme=light] .lcd{fill:#0d1a24}[data-theme=light] .lcd-s{fill:#1d2b40}",
  ".glass{fill:#0a1220}.pillar{stroke:#c9d4e4;stroke-width:1.1}.skirt{stroke:#5d6f8a;stroke-width:.4}.sign{fill:#05080e}",
  "[data-theme=light] .glass{fill:#22324a}[data-theme=light] .pillar{stroke:#f7f9fc}",
  ".sign-t{fill:#e9f2ff;font:800 6.6px/1 ui-sans-serif,system-ui,sans-serif;text-anchor:end;letter-spacing:.01em}.sign-h{fill:#8fa6c6;font:700 4.2px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}",
  ".ahora .sign-t,.ahora .sign-h{fill:#ffd66b}.dormido .sign-t,.dormido .sign-h{fill:#2a3448}.dormido .glass{fill:#05080e}",
  ".lamp-h{fill:#4a5568}.ahora .lamp-h{fill:#fff3c4}",
  ".clock-tick{stroke:#1d2b40;stroke-width:.55}.clock-hand{stroke:#0d1726;stroke-width:.8;stroke-linecap:round;fill:none}.clock-pin{fill:#d9573f}",
  "[data-bus]{cursor:pointer}[data-bus]:hover .sign{stroke:#38e1ff;stroke-width:.5}.garaje{cursor:pointer}",
  ".iso-page{margin:14px auto 28px!important;width:min(650px,100% - 20px)!important}",
  ".corto .iso-legend{display:none}.corto .iso-page{margin:0 auto!important;width:100%!important}.corto .iso-figure{margin:0}.corto,.corto body{background:transparent}.corto .iso-plate{padding:0 0 26px!important;background:none!important;border:0!important;box-shadow:none!important}.corto .iso-plate-corner[data-corner=fig],.corto .iso-plate-corner[data-corner=title],.corto .iso-plate-corner[data-corner=hint]{display:none}",
  ".iso-stage{touch-action:pan-y}",
  "@media (max-width:520px){.iso-plate-corner{font-size:10.5px!important;letter-spacing:.03em!important}.iso-plate-corner[data-corner=readout]{font-size:10px!important;letter-spacing:0!important}}",
].join("");

/* ---------- la parte viva ---------- */
const live = `
const P = ${JSON.stringify(P)}, BUS = ${JSON.stringify(BUS)}, SLOT = ${JSON.stringify(SLOT)}, DOOR = ${JSON.stringify(DOOR)}, DX = ${DX};
const FACE = ${JSON.stringify(faceScreen)};
const TPL = ${JSON.stringify(busSvg("__LV__", "__TXT__", "__HORA__"))};
let DIA = ${JSON.stringify(DIA)}, SUENO = ${JSON.stringify(SUENO)};
const HD = /[#&]d=([^&]+)/.exec(location.hash), HT = /[#&]t=([0-9.]+)/.exec(location.hash), HS = /[#&]s=([0-9.]+)\\/([0-9.]+)/.exec(location.hash);
if (HD) try { DIA = JSON.parse(decodeURIComponent(HD[1])); } catch (e) {}
if (HS) SUENO = { h: +HS[1], obj: +HS[2] };
if (/[#&]corto(&|$)/.test(location.hash)) document.body.classList.add("corto");
const svg = document.querySelector(".iso-stage svg"), stage = document.querySelector(".iso-stage"), readout = document.querySelector("[data-readout]");
const $ = (n) => svg.querySelector('[data-part="' + n + '"]');
const still = matchMedia("(prefers-reduced-motion: reduce)");
const hhmm = (h) => { const m = Math.round(((h % 24) + 24) % 24 * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const dura = (h) => { const m = Math.max(0, Math.round(h * 60)); return m >= 60 ? Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0") : m + " min"; };
/* el nombre en el letrero: cabe uno de 8 letras; si es más largo, su primera palabra */
const corto = (s) => { s = String(s).trim(); if (s.length <= 8) return s; const w = s.split(/\\s+/)[0]; return w.length <= 8 ? w : w.slice(0, 7) + "."; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* el sueño: la noche de antes da la hora de despertar; la de esta noche, la de dormir */
const noches = DIA.filter((e) => e.k === "sleep");
const WAKE = Math.max(0, ...noches.filter((e) => e.a < 12).map((e) => e.b), 0) || 7;
const nocheBus = noches.filter((e) => e.a >= 12)[0] || { a: 23.5, b: 31, t: "A DORMIR", k: "sleep" };
const BED = nocheBus.a;
/* los autobuses: lo del día (sin los puntos sueltos) y el de la noche, el último */
const dia = DIA.filter((e) => e.k !== "sleep" && e.k !== "punto" && e.b > e.a).sort((a, b) => a.a - b.a);
const flota = dia.concat([nocheBus]);
const capa = $("buses");
/* de atrás adelante: el que va detrás en la cola (más a la izquierda) se pinta antes */
/* el recorte de la cochera va en un grupo quieto: dentro, el que se mueve (si no, el recorte viajaría con él) */
capa.innerHTML = flota.map((e, i) => '<g data-bus="' + i + '"><g data-mv>' + TPL.replace(/__LV__/g, e.k === "work" || e.k === "guard" ? "work" : e.k).replace("__TXT__", esc(e === nocheBus ? "A DORMIR" : corto(e.t))).replace("__HORA__", hhmm(e.a)) + "</g></g>").reverse().join("");
const buses = flota.map((e, i) => { const el = capa.querySelector('[data-bus="' + i + '"]'); return { e, i, el, mv: el.firstChild, x: SLOT.garage, op: 1, cls: "" }; });

function destino(b, t) {
  const noche = t < WAKE || t >= BED;
  if (b.e === nocheBus) {
    if (noche) return SLOT.garage;
  } else {
    if (t >= b.e.b) return SLOT.exit;
    if (noche) return t < WAKE ? SLOT.garage : SLOT.exit;
    if (t >= b.e.a) return SLOT.bay;
  }
  /* en la cola: cuántos de los que aún no han llegado van antes */
  const delante = buses.filter((o) => o !== b && o.e !== nocheBus && o.e.a <= b.e.a && o.i < b.i && t < o.e.a).length + (b.e === nocheBus ? 0 : 0);
  const espera = b.e === nocheBus ? dia.filter((o) => t < o.a).length : delante;
  return espera === 0 ? SLOT.s0 : espera === 1 ? SLOT.s1 : SLOT.garage;
}
function estado(t) {
  const ahora = dia.find((e) => t >= e.a && t < e.b), sig = dia.filter((e) => e.a > t);
  if (t < WAKE) return { txt: "durmiendo · te levantas a las " + hhmm(WAKE), ahora: null };
  if (t >= BED) return { txt: "a dormir · hasta las " + hhmm(nocheBus.b), ahora: null };
  if (ahora) return { txt: ahora.t.toLowerCase() + " · hasta las " + hhmm(ahora.b) + " · queda" + (ahora.b - t >= 1 ? "n " : " ") + dura(ahora.b - t), ahora };
  return { txt: "libre · " + (sig[0] ? sig[0].t.toLowerCase() + " a las " + hhmm(sig[0].a) : "a dormir a las " + hhmm(BED)), ahora: null };
}
/* la puerta de la cochera y su recorte */
const door = $("door"), slats = $("slats"), clip = $("garclip");
const BIG = "M-50 -50H${WIDTH + 50}V${HEIGHT + 50}H-50Z";
const facePath = "M" + FACE.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L") + "Z";
const Q = (pts) => "M" + pts.map((p) => { const s = iso(p, P); return s[0].toFixed(2) + " " + s[1].toFixed(2); }).join("L") + "Z";
let abierta = 1;
function pintaPuerta(a) {
  const z0 = DOOR.h * a;
  door.setAttribute("d", a > 0.995 ? "" : Q([[DX, DOOR.y0, z0], [DX, DOOR.y1, z0], [DX, DOOR.y1, DOOR.h], [DX, DOOR.y0, DOOR.h]]));
  let s = "";
  for (let z = z0 + 2.2; z < DOOR.h - 0.4; z += 2.2) { const p = iso([DX, DOOR.y0, z], P), q = iso([DX, DOOR.y1, z], P); s += "M" + p[0].toFixed(2) + " " + p[1].toFixed(2) + "L" + q[0].toFixed(2) + " " + q[1].toFixed(2); }
  slats.setAttribute("d", s);
  clip.setAttribute("d", BIG + facePath + (a > 0.01 ? Q([[DX, DOOR.y0, 0], [DX, DOOR.y1, 0], [DX, DOOR.y1, z0], [DX, DOOR.y0, z0]]) : ""));
}
/* el reloj */
const hands = $("hands"), C = ${JSON.stringify(CLOCK)};
function pintaReloj(t) {
  const am = (t % 1) * Math.PI * 2, ah = ((t % 12) / 12) * Math.PI * 2;
  const p = (a, r) => (C[0] + r * Math.sin(a)).toFixed(2) + " " + (-(C[2] + r * Math.cos(a))).toFixed(2);
  hands.setAttribute("d", "M" + p(ah + Math.PI, 1) + "L" + p(ah, 3.8) + "M" + p(am + Math.PI, 1.4) + "L" + p(am, 5.6));
}
/* el indicador del sueño */
(function () { const g = $("gauge"), o = $("obj"), lcd = $("lcd"); const z0 = 8, z1 = 38, zh = (h) => z0 + 1.2 + (z1 - z0 - 2.4) * Math.min(10, Math.max(0, h)) / 10;
  g.setAttribute("y", -zh(SUENO.h)); g.setAttribute("height", zh(SUENO.h) - z0 - 1); o.setAttribute("d", "M-169.2 " + (-zh(SUENO.obj)) + "H-157.4");
  lcd.textContent = (Math.round(SUENO.h * 10) / 10 + " h · " + SUENO.obj).replace(".", ","); })();
const farol = $("farol"), farola = $("farola");
const lampara = (el, on) => el.querySelector("path") && el.querySelectorAll(".m-lamp-off,.m-lamp").forEach((n) => { n.classList.toggle("m-lamp", on); n.classList.toggle("m-lamp-off", !on); });

const AHORA = HT ? Math.min(23.99, +HT[1]) : null;
let t = AHORA != null ? AHORA : ${T0}, target = t, frame = 0, last = 0, touring = AHORA == null, visible = false, idle = 0, clock = 0, aviso = "", avisoT = 0;
const PARADAS = [5.5, 7, 10.4, 15.4, 16.6, 18, 19.5, 21, 23, 23.9];
function draw(dt) {
  const noche = t < WAKE || t >= BED, st = estado(t);
  const want = noche ? 0 : 1;
  abierta = still.matches || !dt ? want : abierta + (want - abierta) * (1 - Math.exp(-dt / 0.35));
  if (Math.abs(want - abierta) < 0.002) abierta = want;
  pintaPuerta(abierta);
  pintaReloj(t);
  lampara(farol, noche); lampara(farola, t < 7.5 || t >= 20);
  let busy = abierta !== want;
  for (const b of buses) {
    const goal = destino(b, t);
    b.x = still.matches || !dt ? goal : b.x + (goal - b.x) * (1 - Math.exp(-dt / 0.45));
    if (Math.abs(goal - b.x) < 0.05) b.x = goal; else busy = true;
    const op = b.x > 110 ? Math.max(0, 1 - (b.x - 110) / 40) : 1;
    b.mv.setAttribute("transform", translateAlong(P, [b.x, 0, 0]));
    b.el.style.opacity = op < 0.999 ? op.toFixed(3) : "";
    b.el.style.display = op <= 0.001 ? "none" : "";
    if (b.x < DX + 0.5) b.el.setAttribute("clip-path", "url(#garclip)"); else b.el.removeAttribute("clip-path");
    const cls = st.ahora === b.e && Math.abs(b.x - SLOT.bay) < 6 ? "ahora" : (b.e === nocheBus && noche ? "dormido" : "");
    if (cls !== b.cls) { if (b.cls) b.el.classList.remove(b.cls); if (cls) b.el.classList.add(cls); b.cls = cls; }
  }
  const txt = aviso && avisoT > 0 ? aviso : hhmm(t) + " · " + st.txt;
  if (readout.textContent !== txt) readout.textContent = txt;
  stage.setAttribute("aria-valuetext", hhmm(t) + " · " + st.txt);
  return busy;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
  if (touring) { clock += dt; target = PARADAS[Math.floor(clock / 2.8) % PARADAS.length]; }
  t = still.matches ? target : t + (target - t) * (1 - Math.exp(-dt / 0.4));
  if (Math.abs(target - t) < 0.002) t = target;
  if (avisoT > 0) avisoT -= dt;
  const busy = draw(dt);
  frame = visible && (touring || busy || t !== target || avisoT > 0) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (to) => { touring = false; target = Math.min(23.99, Math.max(0, to)); clearTimeout(idle); idle = setTimeout(() => { if (AHORA != null) target = AHORA; else touring = !still.matches; run(); }, 5000); run(); };
new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
/* arrastrar a lo ancho mueve la hora; un toque en un autobús o en la cochera abre lo suyo */
let down = null;
stage.addEventListener("pointerdown", (ev) => { down = { x: ev.clientX, y: ev.clientY, t: target, moved: false }; });
stage.addEventListener("pointermove", (ev) => {
  const b = svg.getBoundingClientRect();
  if (down) { const dx = ev.clientX - down.x; if (Math.abs(dx) > 6) down.moved = true; if (down.moved) steer(down.t + dx / b.width * 14); }
  else if (ev.pointerType === "mouse") steer(24 * Math.min(1, Math.max(0, (ev.clientX - b.left) / b.width)));
});
stage.addEventListener("pointerup", (ev) => {
  const d = down; down = null; if (!d || d.moved) return;
  const bus = ev.target.closest && ev.target.closest("[data-bus]");
  const gar = !bus && ev.target.closest && ev.target.closest(".garaje");
  const e = bus ? flota[+bus.getAttribute("data-bus")] : null;
  aviso = e ? "abriría: " + e.t.toLowerCase() + " · " + hhmm(e.a) + "–" + hhmm(e.b % 24) : (gar ? "abriría: tu sueño" : "");
  avisoT = aviso ? 2.4 : 0; if (aviso) { window.parent && window.parent.postMessage({ hoy: e ? { abrir: e.t, a: e.a } : { abrir: "sueno" } }, "*"); run(); }
});
stage.addEventListener("pointerleave", () => { down = null; });
stage.addEventListener("keydown", (ev) => { const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[ev.key]; if (!d) return; ev.preventDefault(); steer(Math.round(target * 4) / 4 + d * 0.25); });
draw(0);
`;

const body = `<style>${CSS}</style>` + k.plateHtml({
  fig: "Hoy",
  title: "Tu estación",
  hint: "Desliza o toca un autobús",
  readout: "",
  keys: [
    { mark: "lit", label: "En el andén: lo que estás haciendo ahora, con el letrero encendido" },
    { mark: "raised", label: "En la cola: lo siguiente, por orden de llegada; el color dice qué es (rojo trabajo, verde comida, violeta entreno, azul planes)" },
    { mark: "flat", label: "La cochera: de noche guarda el autobús con la puerta bajada; su indicador marca lo que dormiste anoche frente a tu objetivo" },
  ],
  caption: "Tu día como una estación de autobuses. El reloj de la marquesina marca la hora; cuando acaba una cosa, su autobús sale por la derecha y la cola avanza. Todo sale de la misma agenda que Hoy.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Tu día como una estación: las flechas mueven la hora de cuarto en cuarto" aria-valuemin="0" aria-valuemax="24">${svg.replace('<path class="m-brick"', '<path class="m-brick"')}</div>`,
});
const out = "estacion" + (theme === "light" ? "-light" : "") + ".html";
const page = k.pageHtml({ title: "Tu estación", theme, body, script: kitScript() + live }).replace('<html lang="en">', '<html lang="es">');
writeFileSync(join(HERE, out), page);
console.log("wrote", out, Math.round(page.length / 1024), "KB");
