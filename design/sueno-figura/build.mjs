/* El banco del sueño. Escribe fig/sueno.html (lo abre la app) y una copia de muestra en
   design/sueno-figura/. node design/sueno-figura/build.mjs [--light] [--t=29]
   La guardia llega en la dirección (#p=…) desde la app; sin ella, una guardia típica. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url)), RAIZ = join(HERE, "..", "..");
const theme = process.argv.includes("--light") ? "light" : "dark";
const arg = process.argv.find((a) => a.startsWith("--t="));
const WIDTH = 600, HEIGHT = 420;

/* ---------- el mundo ---------- */
const PLATE = { x: -150, y: -64, w: 300, d: 128, r: 8 };
const PLATE_H = 12, FOOT_H = 5;
const RX0 = -128, RX1 = 128;                      // la regla del tiempo
const STRIP = { x: RX0 - 6, y: PLATE.y + PLATE.d - 16, w: RX1 - RX0 + 12, d: 9, r: 1.2 };
const RAILS = [30, 39];
const CAR = { x: -9, y: 26, w: 18, d: 18, r: 2.5 }, CAR_Z = 3, CAR_TOP = 9;
const TANK = [-100, -26], TANK_R = 21, TANK_H = 70;        // la presión de sueño
const ROD = [-88, -30], ROD_R = 1.8, ROD_Z = TANK_H + 4, ROD_SPAN = 56;
const TAP_POST = [-136, -42], TAP_Z = 98, NOZZLE = [-114, -40];
const DRAIN = [-105, -26 + TANK_R + 7];                     // el caño del desagüe
const DISC = [100, -24], DISC_R = 30, DISC_Z = 20, DISC_H = 6;   // el reloj interno
const FOL = [100, 13], FOL_Z = 12, FOL_SPAN = 50;
const DIAL = [4, -26], DIAL_R = 24, DIAL_Z = 66, DIAL_H = 9, DIAL_TOP = DIAL_Z + DIAL_H, TURN = 0.82;
const CAF = [40, -4], CAF_Z = 10, CAF_SPAN = 26;            // el émbolo del café

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [TAP_POST[0], TAP_POST[1], TAP_Z + 4], [ROD[0], ROD[1], ROD_Z + ROD_SPAN + 2], [DIAL[0], DIAL[1], DIAL_TOP + 2]],
  WIDTH, HEIGHT, { pad: 26, azimuth: 45 });
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

/* ---------- lo fijo, construido una vez ---------- */
function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const lab = { x: -40, y: -56, w: 34, d: 12, r: 1.5 };   // placa de nombre con tres renglones
  out.push(S(k.slabOf(lab, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(lab, 1.6), 0.8, P, 4), { tone: "faint" }));
  [[4, 26], [7, 20], [10, 23]].forEach(([dy, w]) => out.push(L(k.lineOnTop([lab.x + 4, lab.y + dy], [lab.x + 4 + w, lab.y + dy], 0.8, P), { tone: "lo", free: true })));
  out.push(S(k.slabOf(STRIP, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  return out.join("");
}
function rails() {
  const out = [];
  for (const y of RAILS) {
    out.push(S(k.slabOf({ x: RX0 - 4, y, w: RX1 - RX0 + 8, d: 4, r: 1 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
    out.push(D([RX0, RX1].map((x) => at([x, y + 2, 3])), { size: 0.4 }));
  }
  for (const x of [RX0 - 10, RX1 + 4]) {
    out.push(S(k.slabOf({ x, y: RAILS[0] - 3, w: 6, d: RAILS[1] - RAILS[0] + 10, r: 1.2 }, 0, 7, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([x + 3, RAILS[0], 7]), at([x + 3, RAILS[1] + 4, 7])], { size: 0.45 }));
  }
  return out.join("");
}
function tap() {
  const [px, py] = TAP_POST, out = [];
  out.push(S(k.cylinder(px, py, 5, 0, 3, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(px, py, 2.6, 3, TAP_Z - 3, P, 20), { tone: "mid", crease: "none" }));
  out.push(L([30, 60].map((z) => k.sideArc(px, py, 2.6, z, P, 14)).join(""), { tone: "faint" }));
  out.push(S(k.slabOf({ x: px - 4, y: py - 4, w: NOZZLE[0] - px + 8, d: 8, r: 2 }, TAP_Z, 4, P, 3, 0.5), { tone: "mid" }));
  out.push(D([at([px, py, TAP_Z + 4]), at([NOZZLE[0], NOZZLE[1], TAP_Z + 4])], { size: 0.45 }));
  out.push(S(k.cylinder(NOZZLE[0], NOZZLE[1], 2.2, TAP_Z - 7, 7, P, 20), { tone: "mid" }));
  out.push(S(k.cylinder(NOZZLE[0], NOZZLE[1], 3.6, TAP_Z + 4, 2.4, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(NOZZLE[0], NOZZLE[1], 3.6, TAP_Z + 4, TAP_Z + 6.4, 16, P), { tone: "lo" }));
  return out.join("");
}
function tank() {
  const [x, y] = TANK, out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - TANK_R, y: y - TANK_R, w: TANK_R * 2, d: TANK_R * 2, r: TANK_R }, 0, 2, P)}" style="filter:blur(3px)"/>`);
  out.push(S(k.cylinder(x, y, TANK_R + 3, 0, 4, P, 56), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, TANK_R, 4, TANK_H - 4, P, 64, 0.8), { tone: "mid", inner: L([16, 40, 64].map((z) => k.sideArc(x, y, TANK_R, z, P, 40)).join(""), { tone: "faint" }) }));
  out.push(L(k.ring(x, y, TANK_R - 3, TANK_H, P, 48), { tone: "lo" }));
  out.push(D(k.circleRing(x, y, TANK_R - 1.6, 12).map(([a, b]) => at([a, b, TANK_H])), { size: 0.4, tone: "lo" }));
  const sc = { x: x + 10, y: y + TANK_R - 1, w: 5, d: 3, r: 0.6 }, face = sc.y + sc.d, ticks = [];
  out.push(S(k.slabOf(sc, 6, TANK_H - 12, P, 2), { tone: "lo", crease: "none" }));
  for (let i = 0; i <= 10; i++) { const z = 8 + i * (TANK_H - 16) / 10; ticks.push(k.segment([sc.x, face, z], [sc.x + (i % 5 ? 2.4 : 5), face, z], P)); }
  out.push(L(ticks.join(""), { tone: "mid" }));
  out.push(S(k.slabOf({ x: DRAIN[0] - 4, y: y + TANK_R - 2, w: 8, d: 7, r: 1.2 }, 4, 6, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(DRAIN[0] + 7, DRAIN[1] - 3, 2.2, 5, 4, P, 18), { tone: "mid" }));
  out.push(L(k.knurl(DRAIN[0] + 7, DRAIN[1] - 3, 2.2, 5, 9, 12, P), { tone: "lo" }));
  out.push(S(k.cylinder(DRAIN[0], DRAIN[1], 1.6, 4, 2.4, P, 16), { tone: "mid" }));   // el caño
  out.push(S(k.cylinder(ROD[0], ROD[1], 5.2, TANK_H, 4, P, 28, 0.4), { tone: "mid" }));
  out.push(L(k.ring(ROD[0], ROD[1], 2.4, TANK_H + 4, P, 16), { tone: "faint" }));
  return out.join("");
}
function dialStand() {
  const [x, y] = DIAL, out = [], base = { x: x - 14, y: y - 12, w: 28, d: 24, r: 3 };
  out.push(S(k.slabOf(base, 0, 8, P, 4, 0.6), { tone: "mid" }));
  out.push(D(k.corners(base, 3.5).map(([a, b]) => at([a, b, 8])), { size: 0.45 }));
  out.push(S(k.cylinder(x, y - 2, 4.4, 8, 4, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(x, y - 2, 3, 12, DIAL_Z - 12, P, 20), { tone: "mid", crease: "none" }));
  out.push(L([30, 50].map((z) => k.sideArc(x, y - 2, 3, z, P, 14)).join(""), { tone: "faint" }));
  return out.join("");
}
function cafColumn() {
  // el émbolo del café: un tubo con su escala, la varilla sube con el efecto (hasta +15)
  const [x, y] = CAF, out = [], base = { x: x - 7, y: y - 7, w: 14, d: 14, r: 2.5 };
  out.push(S(k.slabOf(base, 0, CAF_Z - 4, P, 3, 0.5), { tone: "mid" }));
  out.push(D(k.corners(base, 2.6).map(([a, b]) => at([a, b, CAF_Z - 4])), { size: 0.4 }));
  out.push(S(k.cylinder(x, y, 4.2, CAF_Z - 4, 4 + 14, P, 28, 0.4), { tone: "mid", inner: L(k.sideArc(x, y, 4.2, CAF_Z + 6, P, 18), { tone: "faint" }) }));
  out.push(S(k.cylinder(x, y, 2.6, CAF_Z + 14, 1.6, P, 20), { tone: "mid" }));
  return out.join("");
}
function dialFace() {
  const [x, y] = DIAL, out = [];
  out.push(S(k.cylinder(x, y, DIAL_R, DIAL_Z, DIAL_H, P, 64, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(x, y, DIAL_R - 2.2, DIAL_TOP, P, 64), { tone: "lo" }));
  const tk = k.radialTicks(x, y, DIAL_R - 3.4, 41, 10, DIAL_TOP, [1.3, 3], P, 0, TURN * 2 * Math.PI * 41 / 40);
  out.push(L(tk.minor, { tone: "lo" }), L(tk.major, { tone: "mid" }));
  const umbral = [35, 55].map((v) => { const a = v / 100 * TURN * 2 * Math.PI; return k.lineOnTop([x + Math.sin(a) * (DIAL_R - 3.4), y - Math.cos(a) * (DIAL_R - 3.4)], [x + Math.sin(a) * (DIAL_R - 9), y - Math.cos(a) * (DIAL_R - 9)], DIAL_TOP, P); });
  out.push(L(umbral.join(""), { tone: "hi" }));
  out.push(L(k.ring(x, y, 1.8, DIAL_TOP, P, 16), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([x, y + 9], DIAL_TOP, P, "x"), "ALERTA", { size: 2.4, tone: "lo", anchor: "middle" }));
  return out.join("");
}
function turntable() {
  const [x, y] = DISC, out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - 16, y: y - 16, w: 32, d: 32, r: 16 }, 0, 2, P)}" style="filter:blur(3px)"/>`);
  out.push(S(k.cylinder(x, y, 16, 0, 4, P, 40), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 9, 4, DISC_Z - 4, P, 32), { tone: "mid", inner: L(k.sideArc(x, y, 9, 12, P, 20), { tone: "faint" }) }));
  out.push(S(k.cylinder(x, y, DISC_R, DISC_Z, DISC_H, P, 72, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, DISC_R, DISC_Z + 0.6, DISC_Z + DISC_H - 0.6, 96, P, 0.3), { tone: "faint" }));
  out.push(L(k.ring(x, y, DISC_R - 2.4, DISC_Z + DISC_H, P, 72), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 4, DISC_Z + DISC_H, 2.4, P, 20), { tone: "mid" }));
  return out.join("");
}
function follower() {
  const [x, y] = FOL, out = [], block = { x: x - 7, y: y - 6, w: 14, d: 12, r: 2 };
  out.push(S(k.slabOf(block, 0, FOL_Z, P, 3, 0.5), { tone: "mid" }));
  out.push(D(k.corners(block, 2.6).map(([a, b]) => at([a, b, FOL_Z])), { size: 0.4 }));
  out.push(S(k.cylinder(x, y, 3.6, FOL_Z, 3, P, 20, 0.3), { tone: "mid" }));
  // el palpador que toca el canto del plato: la hora que tiene delante es la que lee
  out.push(S(k.slabOf({ x: x - 1.4, y: DISC[1] + DISC_R - 0.5, w: 2.8, d: y - 6 - DISC[1] - DISC_R + 0.5, r: 0.8 }, DISC_Z + 1, 4, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}
function carriage() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CAR, 2), CAR_Z, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(CAR, CAR_Z, CAR_TOP - CAR_Z, P, 4, 0.6), { tone: "mid" }));
  out.push(D([[-6, 28.5], [6, 28.5], [-6, 41.5], [6, 41.5]].map(([a, b]) => at([a, b, CAR_TOP])), { size: 0.4, tone: "lo" }));
  out.push(S(k.extrude([[-2.6, CAR.y + CAR.d], [2.6, CAR.y + CAR.d], [0, STRIP.y + 1]], CAR_Z + 1, 2, P), { tone: "hi", lit: true }));
  return out.join("");
}

/* ---------- lo que se mueve: funciones que también corren en la página ---------- */
const rodS = (S0) => { const h = Math.max(0.6, S0 * ROD_SPAN); return k.solidSvg(k.cylinder(ROD[0], ROD[1], ROD_R, ROD_Z, h, P, 16), { tone: "hi", crease: "none" }) + k.solidSvg(k.cylinder(ROD[0], ROD[1], 3, ROD_Z + h, 2.2, P, 20), { tone: "hi" }); };
const rodC = (c) => { const h = Math.max(0.6, (c + 0.62) / 1.24 * FOL_SPAN); return k.solidSvg(k.cylinder(FOL[0], FOL[1], ROD_R, FOL_Z + 3, h, P, 16), { tone: "hi", crease: "none" }) + k.solidSvg(k.cylinder(FOL[0], FOL[1], 3, FOL_Z + 3 + h, 2.2, P, 20), { tone: "hi" }); };
const rodCaf = (x) => { const h = Math.max(0.6, x / 15 * CAF_SPAN); return k.solidSvg(k.cylinder(CAF[0], CAF[1], 1.4, CAF_Z + 15.6, h, P, 16), { tone: "hi", crease: "none" }) + k.solidSvg(k.cylinder(CAF[0], CAF[1], 2.4, CAF_Z + 15.6 + h, 1.8, P, 18), { tone: "hi" }); };
const discTicks = (t) => {
  // la hora que tiene delante el palpador (el canto que mira a +y) es la de ahora; la marca de las 17:00, la más larga
  const [x, y] = DISC, from = Math.PI - ((t % 24) / 24) * 2 * Math.PI, tk = k.radialTicks(x, y, DISC_R - 3.6, 24, 6, DISC_Z + DISC_H, [1.6, 4], P, from);
  const a17 = from + 17 / 24 * 2 * Math.PI, r0 = DISC_R - 3.6, r1 = DISC_R - 12;
  return k.lineSvg(tk.minor, { tone: "lo" }) + k.lineSvg(tk.major, { tone: "mid" }) + k.lineSvg(k.lineOnTop([x + Math.sin(a17) * r0, y - Math.cos(a17) * r0], [x + Math.sin(a17) * r1, y - Math.cos(a17) * r1], DISC_Z + DISC_H, P), { tone: "hi" });
};
const needleAt = (A) => { const a = (A / 100) * TURN * 2 * Math.PI, [x, y] = DIAL; return k.lineOnTop([x - Math.sin(a) * 3.6, y + Math.cos(a) * 3.6], [x + Math.sin(a) * (DIAL_R - 4), y - Math.cos(a) * (DIAL_R - 4)], DIAL_TOP + 0.2, P); };
const wires = (S0, c, caf) => {
  const sTip = k.iso([ROD[0], ROD[1], ROD_Z + Math.max(0.6, S0 * ROD_SPAN) + 2.2], P);
  const cTip = k.iso([FOL[0], FOL[1], FOL_Z + 3 + Math.max(0.6, (c + 0.62) / 1.24 * FOL_SPAN) + 2.2], P);
  const fTip = k.iso([CAF[0], CAF[1], CAF_Z + 15.6 + Math.max(0.6, caf / 15 * CAF_SPAN) + 1.8], P);
  const dl = k.iso([DIAL[0] - DIAL_R, DIAL[1], DIAL_Z + 4], P), dr = k.iso([DIAL[0] + DIAL_R, DIAL[1], DIAL_Z + 4], P), df = k.iso([DIAL[0] + DIAL_R * 0.7, DIAL[1] + DIAL_R * 0.7, DIAL_Z + 3], P);
  return k.wireSvg(sTip, dl, { via: [[(sTip[0] + dl[0]) / 2, Math.max(sTip[1], dl[1]) + 10]], tone: "lo", size: 1 })
    + k.wireSvg(cTip, dr, { via: [[(cTip[0] + dr[0]) / 2, Math.max(cTip[1], dr[1]) + 12]], tone: "lo", size: 1 })
    + k.wireSvg(fTip, df, { via: [[(fTip[0] + df[0]) / 2, Math.max(fTip[1], df[1]) + 6]], tone: "lo", size: 1 });
};
// la regla de ESTA guardia: las horas dormidas embutidas, la guardia detrás y una raya por hora
const stripMarks = (p, T0, T1) => {
  const X = (t) => RX0 + (t - T0) * (RX1 - RX0) / (T1 - T0), out = [];
  for (const s of p.todo) { const a = Math.max(T0, s.a), b = Math.min(T1, s.b); if (b - a > 0.05) out.push(k.solidSvg(k.slabOf({ x: X(a), y: STRIP.y + 1.4, w: X(b) - X(a), d: 3.2, r: 0.6 }, 0.8, 0.3, P, 2), { tone: "hi", crease: "none", flat: true })); }
  out.push(k.solidSvg(k.slabOf({ x: X(Math.max(T0, p.de)), y: STRIP.y + 5.2, w: X(Math.min(T1, p.sale)) - X(Math.max(T0, p.de)), d: 1.6, r: 0.5 }, 0.8, 0.3, P, 2), { tone: "mid", crease: "none", flat: true }));
  const edge = STRIP.y + STRIP.d, mi = [], ma = [];
  for (let t = Math.ceil(T0); t <= T1; t++) (t % 6 === 0 ? ma : mi).push(k.lineOnTop([X(t), edge], [X(t), edge - (t % 6 === 0 ? 3.6 : 2)], 0.8, P));
  return out.join("") + k.lineSvg(mi.join(""), { tone: "lo" }) + k.lineSvg(ma.join(""), { tone: "mid" });
};
// los cafés del plan, en su hora detrás de los raíles: llena hasta que te la tomas, vacía después
const cups = (p, T0, T1, t) => {
  const X = (h) => RX0 + (h - T0) * (RX1 - RX0) / (T1 - T0), out = [];
  for (const c of [...p.cafes].filter((c) => c.t >= T0 && c.t <= T1).sort((a, b) => a.t - b.t)) {
    const x = X(c.t), y = 16, tomada = t >= c.t;
    out.push(k.solidSvg(k.cylinder(x, y, 4.2, 0, 1, P, 24), { tone: "lo" }));
    out.push(k.solidSvg(k.cylinder(x, y, 2.8, 1, 5, P, 24, 0.3), { tone: "mid" }));
    out.push(k.solidSvg(k.slabOf({ x: x + 2.4, y: y - 0.6, w: 2.4, d: 1.2, r: 0.5 }, 2.2, 2.4, P, 2), { tone: "mid", crease: "none" }));
    out.push(tomada ? k.lineSvg(k.ring(x, y, 2.2, 6, P, 20), { tone: "faint" }) : k.solidSvg(k.cylinder(x, y, 2.2, 5.6, 0.3, P, 20), { tone: "lo", crease: "none", flat: true }));
  }
  return out.join("");
};
// las gotas: del grifo mientras estás despierto, del desagüe mientras duermes
const drops = (dormido, fase) => {
  const pts = [];
  for (let i = 0; i < 3; i++) {
    const f = (fase + i / 3) % 1;
    if (dormido) pts.push(k.iso([DRAIN[0], DRAIN[1] + 1.5, 4 - f * 4], P));
    else pts.push(k.iso([NOZZLE[0], NOZZLE[1], TAP_Z - 7 - f * (TAP_Z - 7 - TANK_H)], P));
  }
  return k.dotsSvg(pts, { size: 0.9, tone: "hi" });
};

/* ---------- la muestra estática (la de la guardia típica) ---------- */
const plan0 = M.GUARDIA, R0 = M.rangoDe(plan0), t0 = arg ? +arg.slice(4) : 18, se0 = M.sim(plan0, R0.T0 - 1, R0.T1 + 0.5);
const e0 = se0[Math.round((t0 - se0[0].t) / M.DT)];
const X0 = (t) => RX0 + (t - R0.T0) * (RX1 - RX0) / (R0.T1 - R0.T0);
const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "Un banco de pruebas del sueño. A la izquierda, un depósito que un grifo llena mientras estás despierto y un desagüe vacía mientras duermes: su varilla es la presión de sueño. A la derecha, un plato de 24 horas que gira y un seguidor que sube y baja con el reloj interno. Junto al comparador, un émbolo que sube con el café. En el centro, el comparador recoge las tres y su aguja marca la alerta de 0 a 100. Delante, la regla de la guardia con las horas dormidas y los cafés, y un carro que señala la hora.",
  body: [
    plate(), `<g data-part="strip">${stripMarks(plan0, R0.T0, R0.T1)}</g>`, rails(), `<g data-part="cups">${cups(plan0, R0.T0, R0.T1, t0)}</g>`,
    tap(), tank(), `<g data-part="drops">${drops(!!e0.z, 0)}</g>`, `<g data-part="rodS">${rodS(e0.S)}</g>`,
    dialStand(), cafColumn(), `<g data-part="rodCaf">${rodCaf(M.cafeExtra(e0.c))}</g>`,
    turntable(), `<g data-part="disc">${discTicks(t0)}</g>`, follower(), `<g data-part="rodC">${rodC(e0.C)}</g>`,
    dialFace(),
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(e0.A || 0)}" style="stroke-width:1.2"/>`,
    `<g data-part="wires">${wires(e0.S, e0.C, M.cafeExtra(e0.c))}</g>`,
    `<g data-part="carriage" transform="${k.translateAlong(P, [X0(t0), 0, 0])}">${carriage()}</g>`,
  ],
});

const strip = (f) => f.toString().replace(/\bk\./g, "");
const live = `
${readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "")}
const P = ${JSON.stringify(P)};
const RX0 = ${RX0}, RX1 = ${RX1}, STRIP = ${JSON.stringify(STRIP)};
const ROD = ${JSON.stringify(ROD)}, ROD_R = ${ROD_R}, ROD_Z = ${ROD_Z}, ROD_SPAN = ${ROD_SPAN};
const FOL = ${JSON.stringify(FOL)}, FOL_Z = ${FOL_Z}, FOL_SPAN = ${FOL_SPAN};
const DISC = ${JSON.stringify(DISC)}, DISC_R = ${DISC_R}, DISC_Z = ${DISC_Z}, DISC_H = ${DISC_H};
const DIAL = ${JSON.stringify(DIAL)}, DIAL_R = ${DIAL_R}, DIAL_Z = ${DIAL_Z}, DIAL_TOP = ${DIAL_TOP}, TURN = ${TURN};
const CAF = ${JSON.stringify(CAF)}, CAF_Z = ${CAF_Z}, CAF_SPAN = ${CAF_SPAN};
const TANK_H = ${TANK_H}, TAP_Z = ${TAP_Z}, NOZZLE = ${JSON.stringify(NOZZLE)}, DRAIN = ${JSON.stringify(DRAIN)};
const rodS = ${strip(rodS)}, rodC = ${strip(rodC)}, rodCaf = ${strip(rodCaf)}, discTicks = ${strip(discTicks)};
const needleAt = ${strip(needleAt)}, wires = ${strip(wires)}, stripMarks = ${strip(stripMarks)}, cups = ${strip(cups)}, drops = ${strip(drops)};
const plan = planDe(location.hash), R = rangoDe(plan), T0 = R.T0, T1 = R.T1, SERIE = sim(plan, T0 - 1, T1 + 0.5);
const en = (t) => SERIE[Math.max(0, Math.min(SERIE.length - 1, Math.round((t - SERIE[0].t) / DT)))];
const X = (t) => RX0 + (t - T0) * (RX1 - RX0) / (T1 - T0);
const stage = document.querySelector(".iso-stage"), svg = stage.querySelector("svg");
const $ = (n) => svg.querySelector('[data-part="' + n + '"]');
const parts = { strip: $("strip"), cups: $("cups"), drops: $("drops"), rodS: $("rodS"), rodC: $("rodC"), rodCaf: $("rodCaf"), disc: $("disc"), needle: $("needle"), wires: $("wires"), car: $("carriage") };
const readout = document.querySelector("[data-readout]");
const titulo = document.querySelector(".iso-plate [class*=title]") || null;
if (plan.label) { const tt = document.querySelectorAll(".iso-plate *"); for (const n of tt) if (n.childElementCount === 0 && /banco del sue/i.test(n.textContent)) { n.textContent = "Tu guardia · " + plan.label; break; } }
parts.strip.innerHTML = stripMarks(plan, T0, T1);
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hhmm = (t) => { const m = Math.round(((t % 24) + 24) % 24 * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const fase = (t) => t < plan.de ? "antes de la guardia" : t < plan.sale ? "de guardia" : "saliente";
const sueno = (t) => (plan.todo.filter((s) => t >= s.a && t < s.b)[0] || {}).txt || "durmiendo";
const HT = /[#&]t=(-?[0-9.]+)/.exec(location.hash), ARG = ${arg ? t0 : "null"} ?? (HT ? clamp(+HT[1], T0, T1) : null);   // la hora con la que se abre (la app manda la de ahora)
let t = ARG == null ? clamp(${t0}, T0, T1) : ARG, target = t, needle = (en(t).A || 0), frame = 0, last = 0, touring = ARG == null, visible = false, idle = 0, gota = 0, tomadas = -1;
function draw() {
  const e = en(t), caf = cafeExtra(e.c);
  parts.rodS.innerHTML = rodS(e.S);
  parts.rodC.innerHTML = rodC(e.C);
  parts.rodCaf.innerHTML = rodCaf(caf);
  parts.disc.innerHTML = discTicks(t);
  parts.drops.innerHTML = drops(!!e.z, gota);
  parts.needle.setAttribute("d", needleAt(needle));
  parts.wires.innerHTML = wires(e.S, e.C, caf);
  const n = plan.cafes.filter((c) => t >= c.t).length;
  if (n !== tomadas) { tomadas = n; parts.cups.innerHTML = cups(plan, T0, T1, t); }
  parts.car.setAttribute("transform", translateAlong(P, [X(t), 0, 0]));
  const txt = hhmm(t) + " · " + fase(t) + " · " + (e.A == null ? sueno(t) : "alerta " + Math.round(e.A) + " · " + estado(e.A) + (caf >= 1 ? " · café +" + Math.round(caf) : ""));
  if (readout.textContent !== txt) readout.textContent = txt;
  stage.setAttribute("aria-valuetext", txt);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
  const calm = still.matches;
  gota = calm ? 0 : (gota + dt * 0.9) % 1;
  if (touring) { target += dt * 2.2; if (target > T1) target = T0; }
  t = calm || touring ? target : t + (target - t) * (1 - Math.exp(-dt / 0.25));
  const e = en(t), want = e.A == null ? 0 : e.A;
  needle = calm ? want : needle + (want - needle) * (1 - Math.exp(-dt / 0.35));
  draw();
  frame = visible && !calm ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (to) => { touring = false; target = clamp(to, T0, T1); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 4000); run(); };
new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (ev) => { const b = svg.getBoundingClientRect(); steer(T0 + clamp((ev.clientX - b.left) / b.width, 0, 1) * (T1 - T0)); });
stage.addEventListener("keydown", (ev) => { const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[ev.key]; if (!d) return; ev.preventDefault(); steer(Math.round(target) + d); });
stage.setAttribute("aria-valuemin", String(T0)); stage.setAttribute("aria-valuemax", String(T1));
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "El banco del sueño",
  hint: "Desliza para mover la hora",
  readout: "",
  keys: [
    { mark: "lit", label: "Aguja: tu alerta, de 0 a 100 (marcas en 35 y 55)" },
    { mark: "raised", label: "Varillas: presión de sueño (depósito), reloj interno (plato) y café (émbolo)" },
    { mark: "flat", label: "En la regla, lo dormido y la guardia; detrás, los cafés" },
  ],
  caption: "La alerta es lo que queda entre dos piezas. La presión de sueño se llena mientras estás despierto (en unas 18 h) y se vacía durmiendo (en unas 4 h): por eso una siesta baja la varilla. El reloj interno sube y baja cada 24 h, con lo más alto hacia las 17:00 y lo más bajo de madrugada. El café empuja la aguja hasta 15 puntos y se va a la mitad cada 5 horas. Los números salen del mismo modelo que usa la app (Borbély; Åkerstedt).",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="El banco del sueño: las flechas mueven la hora">${svg}</div>`,
});
const html = k.pageHtml({ title: "El banco del sueño", theme, body, script: kitScript() + live });
const nombre = (arg ? "sueno-t" + t0 : "sueno") + (theme === "light" ? "-light" : "") + ".html";
writeFileSync(join(HERE, nombre), html);
if (!arg) { mkdirSync(join(RAIZ, "fig"), { recursive: true }); writeFileSync(join(RAIZ, "fig", nombre), html); }
console.log("wrote", nombre, Math.round(html.length / 1024) + " KB");
