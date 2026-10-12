/* Fig · El banco del sueño. Construye sueno.html (y sueno-light.html con --light).
   node design/sueno-figura/build.mjs [--light] */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const WIDTH = 600, HEIGHT = 420;

/* ---------- el mundo ---------- */
const PLATE = { x: -150, y: -64, w: 300, d: 128, r: 8 };
const PLATE_H = 12, FOOT_H = 5;
// la regla del tiempo: de las 7:00 del día de la guardia a las 23:30 del día siguiente
const RX0 = -128, RX1 = 128;
const X = (t) => RX0 + (t - M.T0) * (RX1 - RX0) / (M.T1 - M.T0);
const STRIP = { x: RX0 - 6, y: PLATE.y + PLATE.d - 16, w: RX1 - RX0 + 12, d: 9, r: 1.2 };
const RAILS = [30, 39];
const CAR = { x: -9, y: 26, w: 18, d: 18, r: 2.5 }, CAR_Z = 3, CAR_TOP = 9;
// el depósito de la presión de sueño
const TANK = [-100, -26], TANK_R = 21, TANK_H = 70;
const ROD = [-88, -30], ROD_R = 1.8, ROD_Z = TANK_H + 4, ROD_SPAN = 56;
const TAP_POST = [-136, -42], TAP_Z = 98, NOZZLE = [-114, -40];
// el reloj interno: plato de 24 h y su seguidor
const DISC = [100, -24], DISC_R = 30, DISC_Z = 20, DISC_H = 6;
const FOL = [100, 13], FOL_Z = 12, FOL_SPAN = 50;
// el comparador de la alerta
const DIAL = [4, -26], DIAL_R = 24, DIAL_Z = 66, DIAL_H = 9, DIAL_TOP = DIAL_Z + DIAL_H;
const TURN = 0.82;   // la aguja recorre 0,82 de vuelta de 0 a 100

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [TAP_POST[0], TAP_POST[1], TAP_Z + 4], [ROD[0], ROD[1], ROD_Z + ROD_SPAN + 2], [DIAL[0], DIAL[1], DIAL_TOP + 2]],
  WIDTH, HEIGHT, { pad: 26, azimuth: 45 });
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

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
  // placa de nombre al fondo a la izquierda, con tres renglones
  const lab = { x: -40, y: -56, w: 34, d: 12, r: 1.5 };
  out.push(S(k.slabOf(lab, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(lab, 1.6), 0.8, P, 4), { tone: "faint" }));
  [[4, 26], [7, 20], [10, 23]].forEach(([dy, w]) => out.push(L(k.lineOnTop([lab.x + 4, lab.y + dy], [lab.x + 4 + w, lab.y + dy], 0.8, P), { tone: "lo", free: true })));
  return out.join("");
}

function ruler() {
  const out = [];
  out.push(S(k.slabOf(STRIP, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  // las horas dormidas, embutidas en la regla
  for (const s of M.GUARDIA.todo) {
    const a = Math.max(M.T0, s.a), b = Math.min(M.T1, s.b);
    if (b <= a) continue;
    out.push(S(k.slabOf({ x: X(a), y: STRIP.y + 1.4, w: X(b) - X(a), d: 3.2, r: 0.6 }, 0.8, 0.3, P, 2), { tone: "hi", crease: "none", flat: true }));
  }
  // la guardia, como una banda fina detrás
  out.push(S(k.slabOf({ x: X(M.GUARDIA.de), y: STRIP.y + 5.2, w: X(M.GUARDIA.sale) - X(M.GUARDIA.de), d: 1.6, r: 0.5 }, 0.8, 0.3, P, 2), { tone: "mid", crease: "none", flat: true }));
  // una raya por hora, larga cada seis (las 12, las 18, las 24…), colgando del borde delantero
  const edge = STRIP.y + STRIP.d;
  const minor = [], major = [];
  for (let t = Math.ceil(M.T0); t <= M.T1; t++) (t % 6 === 0 ? major : minor).push(k.lineOnTop([X(t), edge], [X(t), edge - (t % 6 === 0 ? 3.6 : 2)], 0.8, P));
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
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

function cups() {
  // los tres cafés, en su hora, detrás de los raíles
  const out = [];
  for (const c of M.GUARDIA.cafes) {
    const x = X(c.t), y = 16;
    out.push(S(k.cylinder(x, y, 4.2, 0, 1, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 2.8, 1, 5, P, 24, 0.3), { tone: "mid" }));
    out.push(S(k.slabOf({ x: x + 2.4, y: y - 0.6, w: 2.4, d: 1.2, r: 0.5 }, 2.2, 2.4, P, 2), { tone: "mid", crease: "none" }));
    out.push(L(k.ring(x, y, 2.2, 6, P, 20), { tone: "faint" }));
  }
  return out.join("");
}

function tap() {
  // el grifo que llena el depósito mientras estás despierto
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
  // la escala de la presión, en una regleta delante del depósito
  const sc = { x: x + 10, y: y + TANK_R - 1, w: 5, d: 3, r: 0.6 };
  out.push(S(k.slabOf(sc, 6, TANK_H - 12, P, 2), { tone: "lo", crease: "none" }));
  const face = sc.y + sc.d, ticks = [];
  for (let i = 0; i <= 10; i++) { const z = 8 + i * (TANK_H - 16) / 10; ticks.push(k.segment([sc.x, face, z], [sc.x + (i % 5 ? 2.4 : 5), face, z], P)); }
  out.push(L(ticks.join(""), { tone: "mid" }));
  // el desagüe que vacía mientras duermes, con su mando
  out.push(S(k.slabOf({ x: x - 9, y: y + TANK_R - 2, w: 8, d: 7, r: 1.2 }, 4, 6, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(x - 5, y + TANK_R + 7, 2.2, 5, 4, P, 18), { tone: "mid" }));
  out.push(L(k.knurl(x - 5, y + TANK_R + 7, 2.2, 5, 9, 12, P), { tone: "lo" }));
  // la prensaestopas por donde sale la varilla
  out.push(S(k.cylinder(ROD[0], ROD[1], 5.2, TANK_H, 4, P, 28, 0.4), { tone: "mid" }));
  out.push(L(k.ring(ROD[0], ROD[1], 2.4, TANK_H + 4, P, 16), { tone: "faint" }));
  return out.join("");
}

const rodS = (S0) => k.solidSvg(k.cylinder(ROD[0], ROD[1], ROD_R, ROD_Z, Math.max(0.6, S0 * ROD_SPAN), P, 16), { tone: "hi", crease: "none" })
  + k.solidSvg(k.cylinder(ROD[0], ROD[1], 3, ROD_Z + Math.max(0.6, S0 * ROD_SPAN), 2.2, P, 20), { tone: "hi" });

function dialStand() {
  const [x, y] = DIAL, out = [];
  const base = { x: x - 14, y: y - 12, w: 28, d: 24, r: 3 };
  out.push(S(k.slabOf(base, 0, 8, P, 4, 0.6), { tone: "mid" }));
  out.push(D(k.corners(base, 3.5).map(([a, b]) => at([a, b, 8])), { size: 0.45 }));
  out.push(S(k.cylinder(x, y - 2, 4.4, 8, 4, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(x, y - 2, 3, 12, DIAL_Z - 12, P, 20), { tone: "mid", crease: "none" }));
  out.push(L([30, 50].map((z) => k.sideArc(x, y - 2, 3, z, P, 14)).join(""), { tone: "faint" }));
  return out.join("");
}

function dialFace() {
  const [x, y] = DIAL, out = [];
  out.push(S(k.cylinder(x, y, DIAL_R, DIAL_Z, DIAL_H, P, 64, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3), { tone: "lo" }));
  out.push(L(k.ring(x, y, DIAL_R - 2.2, DIAL_TOP, P, 64), { tone: "lo" }));
  const tk = k.radialTicks(x, y, DIAL_R - 3.4, 41, 10, DIAL_TOP, [1.3, 3], P, 0, TURN * 2 * Math.PI * 41 / 40);
  out.push(L(tk.minor, { tone: "lo" }), L(tk.major, { tone: "mid" }));
  // los umbrales de la app: 35 (riesgo) y 55 (despejado), marcados más largos
  const umbral = [35, 55].map((v) => { const a = v / 100 * TURN * 2 * Math.PI; return k.lineOnTop([x + Math.sin(a) * (DIAL_R - 3.4), y - Math.cos(a) * (DIAL_R - 3.4)], [x + Math.sin(a) * (DIAL_R - 9), y - Math.cos(a) * (DIAL_R - 9)], DIAL_TOP, P); });
  out.push(L(umbral.join(""), { tone: "hi" }));
  out.push(L(k.ring(x, y, 1.8, DIAL_TOP, P, 16), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([x, y + 9], DIAL_TOP, P, "x"), "ALERTA", { size: 2.4, tone: "lo", anchor: "middle" }));
  return out.join("");
}
const needleAt = (A) => { const a = (A / 100) * TURN * 2 * Math.PI, [x, y] = DIAL; return k.lineOnTop([x - Math.sin(a) * 3.6, y + Math.cos(a) * 3.6], [x + Math.sin(a) * (DIAL_R - 4), y - Math.cos(a) * (DIAL_R - 4)], DIAL_TOP + 0.2, P); };

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
const discTicks = (t) => { const [x, y] = DISC, from = -((t % 24) / 24) * 2 * Math.PI; const tk = k.radialTicks(x, y, DISC_R - 3.6, 24, 6, DISC_Z + DISC_H, [1.6, 4], P, from); return L(tk.minor, { tone: "lo" }) + L(tk.major, { tone: "mid" }); };

function follower() {
  // el seguidor del reloj interno, delante del plato: su varilla sube con C
  const [x, y] = FOL, out = [];
  const block = { x: x - 7, y: y - 6, w: 14, d: 12, r: 2 };
  out.push(S(k.slabOf(block, 0, FOL_Z, P, 3, 0.5), { tone: "mid" }));
  out.push(D(k.corners(block, 2.6).map(([a, b]) => at([a, b, FOL_Z])), { size: 0.4 }));
  out.push(S(k.cylinder(x, y, 3.6, FOL_Z, 3, P, 20, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x - 1.4, y: y - 14, w: 2.8, d: 8, r: 0.8 }, DISC_Z + 1, 4, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}
const rodC = (c) => { const h = Math.max(0.6, (c + 0.62) / 1.24 * FOL_SPAN); return k.solidSvg(k.cylinder(FOL[0], FOL[1], ROD_R, FOL_Z + 3, h, P, 16), { tone: "hi", crease: "none" }) + k.solidSvg(k.cylinder(FOL[0], FOL[1], 3, FOL_Z + 3 + h, 2.2, P, 20), { tone: "hi" }); };

const wires = (S0, c) => {
  const sTip = at([ROD[0], ROD[1], ROD_Z + Math.max(0.6, S0 * ROD_SPAN) + 2.2]);
  const cTip = at([FOL[0], FOL[1], FOL_Z + 3 + Math.max(0.6, (c + 0.62) / 1.24 * FOL_SPAN) + 2.2]);
  const dl = at([DIAL[0] - DIAL_R, DIAL[1], DIAL_Z + 4]), dr = at([DIAL[0] + DIAL_R, DIAL[1], DIAL_Z + 4]);
  return k.wireSvg(sTip, dl, { via: [[(sTip[0] + dl[0]) / 2, Math.max(sTip[1], dl[1]) + 10]], tone: "lo", size: 1 }) + k.wireSvg(cTip, dr, { via: [[(cTip[0] + dr[0]) / 2, Math.max(cTip[1], dr[1]) + 12]], tone: "lo", size: 1 });
};

function carriage() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CAR, 2), CAR_Z, 0.1, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(CAR, CAR_Z, CAR_TOP - CAR_Z, P, 4, 0.6), { tone: "mid" }));
  out.push(D([[-6, 28.5], [6, 28.5], [-6, 41.5], [6, 41.5]].map(([a, b]) => at([a, b, CAR_TOP])), { size: 0.4, tone: "lo" }));
  // la flecha que señala la hora en la regla
  out.push(S(k.extrude([[-2.6, CAR.y + CAR.d], [2.6, CAR.y + CAR.d], [0, STRIP.y + 1]], CAR_Z + 1, 2, P), { tone: "hi", lit: true }));
  return out.join("");
}

const arg = process.argv.find((a) => a.startsWith("--t="));
const t0 = arg ? +arg.slice(4) : 18;
const e0 = M.en(t0);
const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "Un banco de pruebas del sueño. A la izquierda, un depósito que un grifo llena mientras estás despierto y un desagüe vacía mientras duermes: su varilla es la presión de sueño. A la derecha, un plato de 24 horas que gira y un seguidor que sube y baja con el reloj interno. En el centro, un comparador recoge las dos y su aguja marca la alerta de 0 a 100. Delante, una regla de 40 horas con la guardia y las horas dormidas, y un carro que señala la hora.",
  body: [
    plate(), ruler(), rails(), cups(), tap(), tank(),
    `<g data-part="rodS">${rodS(e0.S)}</g>`,
    dialStand(), turntable(),
    `<g data-part="disc">${discTicks(t0)}</g>`,
    follower(),
    `<g data-part="rodC">${rodC(e0.C)}</g>`,
    dialFace(),
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(e0.A || 0)}" style="stroke-width:1.2"/>`,
    `<g data-part="wires">${wires(e0.S, e0.C)}</g>`,
    `<g data-part="carriage" transform="${k.translateAlong(P, [X(t0), 0, 0])}">${carriage()}</g>`,
  ],
});

const modelSrc = readFileSync(join(HERE, "model.mjs"), "utf8").replace(/^export /gm, "");
const live = `
${modelSrc}
const P = ${JSON.stringify(P)};
const ROD = ${JSON.stringify(ROD)}, ROD_R = ${ROD_R}, ROD_Z = ${ROD_Z}, ROD_SPAN = ${ROD_SPAN};
const FOL = ${JSON.stringify(FOL)}, FOL_Z = ${FOL_Z}, FOL_SPAN = ${FOL_SPAN};
const DISC = ${JSON.stringify(DISC)}, DISC_R = ${DISC_R}, DISC_Z = ${DISC_Z}, DISC_H = ${DISC_H};
const DIAL = ${JSON.stringify(DIAL)}, DIAL_R = ${DIAL_R}, DIAL_Z = ${DIAL_Z}, DIAL_TOP = ${DIAL_TOP}, TURN = ${TURN};
const RX0 = ${RX0}, RX1 = ${RX1};
const X = ${X.toString().replace(/\bM\./g, "")};
const at = (p) => iso(p, P);
const L = (d, style) => lineSvg(d, style);
const rodS = ${rodS.toString().replace(/\bk\./g, "")};
const rodC = ${rodC.toString().replace(/\bk\./g, "")};
const discTicks = ${discTicks.toString().replace(/\bk\./g, "")};
const needleAt = ${needleAt.toString().replace(/\bk\./g, "")};
const wires = ${wires.toString().replace(/\bk\./g, "")};
const stage = document.querySelector(".iso-stage"), svg = stage.querySelector("svg");
const $ = (n) => svg.querySelector('[data-part="' + n + '"]');
const parts = { rodS: $("rodS"), rodC: $("rodC"), disc: $("disc"), needle: $("needle"), wires: $("wires"), car: $("carriage") };
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const DIAS = ["día de guardia", "día del saliente", "día siguiente"];
const hhmm = (t) => { const m = Math.round(((t % 24) + 24) % 24 * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const fase = (t) => t < GUARDIA.de ? "antes de la guardia" : t < GUARDIA.sale ? "de guardia" : "saliente";
let t = ${t0}, target = t, needle = ${e0.A || 0}, frame = 0, last = 0, touring = ${arg ? "false" : "true"}, visible = false, idle = 0;
function draw() {
  const e = en(t);
  needle += 0;
  parts.rodS.innerHTML = rodS(e.S);
  parts.rodC.innerHTML = rodC(e.C);
  parts.disc.innerHTML = discTicks(t);
  parts.needle.setAttribute("d", needleAt(needle));
  parts.wires.innerHTML = wires(e.S, e.C);
  parts.car.setAttribute("transform", translateAlong(P, [X(t), 0, 0]));
  const txt = hhmm(t) + " · " + fase(t) + " · " + (e.A == null ? "durmiendo" : "alerta " + Math.round(e.A) + " · " + estado(e.A));
  if (readout.textContent !== txt) readout.textContent = txt;
  stage.setAttribute("aria-valuetext", txt);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
  const calm = still.matches;
  if (touring) { target += dt * 2.2; if (target > T1) target = T0; }
  t = calm || touring ? target : t + (target - t) * (1 - Math.exp(-dt / 0.25));
  const e = en(t), want = e.A == null ? 0 : e.A;
  needle = calm ? want : needle + (want - needle) * (1 - Math.exp(-dt / 0.35));
  draw();
  const quieto = !touring && Math.abs(target - t) < 0.002 && Math.abs(want - needle) < 0.05;
  frame = visible && !quieto ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (to) => { touring = false; target = clamp(to, T0, T1); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 4000); run(); };
new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (ev) => { const b = svg.getBoundingClientRect(); steer(T0 + clamp((ev.clientX - b.left) / b.width, 0, 1) * (T1 - T0)); });
stage.addEventListener("keydown", (ev) => { const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[ev.key]; if (!d) return; ev.preventDefault(); steer(Math.round(target) + d); });
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "El banco del sueño",
  hint: "Desliza para mover la hora",
  readout: "",
  keys: [
    { mark: "lit", label: "Aguja: tu alerta, de 0 a 100 (marcas en 35 y 55)" },
    { mark: "raised", label: "Varilla izquierda: la presión de sueño · varilla derecha: el reloj interno" },
    { mark: "flat", label: "En la regla, las horas dormidas y la guardia" },
  ],
  caption: "La alerta es la distancia entre dos piezas. La presión de sueño sube mientras estás despierto (se llena en unas 18 h) y baja durmiendo (en unas 4 h). El reloj interno sube y baja cada 24 h, con su punto más alto hacia las 17:00 y el más bajo de madrugada. Por eso a las 5:00 de una guardia coinciden lo peor de las dos: muchas horas despierto y el reloj en lo más bajo. Los números salen del mismo modelo que usa la app (Borbély y Daan; café con vida media de 5 h).",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="El banco del sueño: las flechas mueven la hora" aria-valuemin="${M.T0}" aria-valuemax="${M.T1}">${svg}</div>`,
});
const out = (arg ? "sueno-t" + t0 : "sueno") + (theme === "light" ? "-light" : "") + ".html";
writeFileSync(join(HERE, out), k.pageHtml({ title: "El banco del sueño", theme, body, script: kitScript() + live }));
console.log("wrote", out);
