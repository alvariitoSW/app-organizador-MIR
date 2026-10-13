/* El panel de llegadas de «Hoy» (maqueta). Un tablero de lamas de madera y latón, como los de las
   estaciones, con tres filas: AHORA (lo que estás haciendo y hasta cuándo), LUEGO y DESPUÉS. Cuando
   empieza otra cosa, las lamas giran y todo sube una fila. Debajo, sobre la peana, una regla de 24 h
   con el día incrustado (dormir, trabajo, gimnasio, comidas) y un cursor de latón en la hora.
   Escribe design/hoy-panel/panel(-light).html. node build.mjs [--light] [--t=10.4] */
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
/* dos acabados: «hoy» (por defecto: colgado del techo, con los colores de la app, para la tarjeta de
   Hoy) y «madera» (de pie sobre una peana con la regla del día, de la familia del reloj de arena) */
const MADERA = process.argv.includes("--madera");
const WIDTH = 600, HEIGHT = MADERA ? 430 : 330;

/* ---------- el día (en la app saldría de la agenda de Hoy) ---------- */
const DIA = [
  { a: 0, b: 6.75, t: "DORMIR", k: "sleep" },
  { a: 6.75, b: 7.25, t: "DESAYUNO", k: "meal" },
  { a: 8, b: 15, t: "TRABAJO UMI", k: "work" },
  { a: 15.17, b: 15.75, t: "COMIDA", k: "meal" },
  { a: 17.5, b: 18.75, t: "GYM FUERZA", k: "gym" },
  { a: 19.25, b: 19.75, t: "CENA", k: "meal" },
  { a: 20, b: 22.17, t: "LLORETAZO", k: "plan" },
  { a: 22.67, b: 30.75, t: "A LA CAMA", k: "sleep" },
];

/* ---------- el mundo ---------- */
const PLATE = { x: -124, y: -34, w: 248, d: 80, r: 6 }, PLATE_H = 9, FOOT_H = 4;
const CAB = { x: -104, y: -10, w: 208, d: 20, r: 1.6 }, CAB_Z0 = 30, CAB_Z1 = 116;
const FRONT = CAB.y + CAB.d, SIDE = CAB.x + CAB.w;
const ROWS = [{ z0: 88, z1: 110 }, { z0: 62, z1: 84 }, { z0: 36, z1: 58 }];
const NAMES = ["AHORA", "LUEGO", "DESPUÉS"];
const HEAD = { u0: -99, u1: -64 };
const WIN = { u0: -61, u1: 99 }, DEPTH = 2.4;
const PITCH = 7.7, CELL_W = 7, NT = 5, NX = 14;
const cellU = (i) => WIN.u0 + 2.4 + i * PITCH + (i >= NT ? 3.6 : 0);
const RULE = { x: -112, y: 28, w: 224, d: 9, r: 1.2 }, RULE_Z = 0.7;
const hx = (h) => RULE.x + 6 + (RULE.w - 12) * Math.min(24, Math.max(0, h)) / 24;

const TECHO = CAB_Z1 + 5 + 20;
const P = MADERA
  ? k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), ...k.boxCorners({ x: CAB.x - 4, y: CAB.y - 3, w: CAB.w + 8, d: CAB.d + 6 }, 0, CAB_Z1 + 6)], WIDTH, HEIGHT, { pad: 16, azimuth: 63, elevation: 24 })
  : k.fitProjection([...k.boxCorners({ x: CAB.x - 4, y: CAB.y - 3, w: CAB.w + 14, d: CAB.d + 6 }, CAB_Z0 - 4, CAB_Z1 + 6), ...k.boxCorners({ x: -82, y: -8, w: 164, d: 16 }, TECHO, TECHO + 3)], WIDTH, HEIGHT, { pad: 10, azimuth: 68, elevation: 20 });

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left");
const flat = (u0, z0, u1, z1, r, steps = 6) => k.pathOf(k.roundedPlan({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
const box = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const sideSlot = (y, z0, z1, half = 0.7) => k.pathOf(k.roundedPlan({ x: y - half, y: z0, w: half * 2, d: z1 - z0, r: half }, 4).map(([u, z]) => at([SIDE, u, z])), true);

let clips = 0;
/* una ventana hundida en la cara de delante, con sus paredes sombreadas por orientación */
function recess({ u0, u1, z0, z1, r }, y, depth, back = "", backClass = "sf-well") {
  const id = `sf-clip-${clips++}`, ring = k.roundedPlan({ x: u0, y: z0, w: u1 - u0, d: z1 - z0, r }, 6);
  const cu = (u0 + u1) / 2, cz = (z0 + z1) / 2, { sinA } = k.cameraOf(P), tops = [], sides = [[], [], [], []];
  ring.forEach(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length], len = Math.hypot(bx - ax, bz - az) || 1;
    let [nx, nz] = [(bz - az) / len, -(bx - ax) / len];
    if (nx * (cu - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
    if (nx <= 0 && nz <= 0) return;
    const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - depth, bz]), at([ax, y - depth, az])], true);
    if (nz >= nx) tops.push(quad); else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
  });
  const shape = flat(u0, z0, u1, z1, r);
  return [`<clipPath id="${id}"><path transform="${planeOf(y)}" d="${shape}"/></clipPath>`, `<g clip-path="url(#${id})">`,
    `<path class="iso-top" d="${tops.join("")}"/>`, ...sides.map((d, s) => (d.length ? `<path class="iso-shade" data-shade="${s}" d="${d.join("")}"/>` : "")),
    `<g transform="${planeOf(y - depth)}"><path class="${backClass}" d="${shape}"/>${back}</g>`, `</g>`,
    `<g transform="${planeOf(y)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`].join("");
}

/* ---------- la peana ---------- */
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 16).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P))) {
    out.push(S(k.cylinder(x, y, 6, -PLATE_H - FOOT_H, 1.4, P, 28), { tone: "lo", className: "m-brass" }));
    out.push(S(k.cylinder(x, y, 4.6, -PLATE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 28), { tone: "mid", className: "m-brass" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", className: "m-wood" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4.5), 0, P), { tone: "lo", className: "l-wood" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo", className: "l-wood" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  /* la placa del fabricante, a la izquierda de la regla */
  const lab = { x: -118, y: -29, w: 26, d: 9, r: 1.2 };
  out.push(S(k.slabOf(lab, 0, 0.7, P, 3), { tone: "mid", className: "m-brass", crease: "none" }));
  out.push(L([18, 12, 15].map((w, i) => k.lineOnTop([lab.x + 3.5, lab.y + 2.3 + i * 2.2], [lab.x + 3.5 + w, lab.y + 2.3 + i * 2.2], 0.7, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([lab.x + lab.w - 2.5, lab.y + 2.5, 0.7]), at([lab.x + lab.w - 2.5, lab.y + lab.d - 2.5, 0.7])], { size: 0.4 }));
  return out.join("");
}

/* la regla del día: 24 h con lo que haces incrustado en su sitio */
function rule() {
  const out = [];
  out.push(S(k.slabOf(RULE, 0, RULE_Z, P, 3), { tone: "mid", className: "m-brass", crease: "none" }));
  out.push(`<g data-part="inlays">${inlaysSvg(DIA, P, RULE, RULE_Z)}</g>`);
  const ticks = k.topTicks(hx(0), hx(24), (hx(24) - hx(0)) / 24, 6, RULE.y + RULE.d - 0.6, RULE_Z, [1.6, 3.2], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([RULE.x + 2.4, RULE.y + RULE.d / 2, RULE_Z]), at([RULE.x + RULE.w - 2.4, RULE.y + RULE.d / 2, RULE_Z])], { size: 0.45 }));
  [0, 6, 12, 18, 24].forEach((h) => out.push(k.faceTextSvg(k.topMatrix([hx(h), RULE.y - 2.2], 0, P, "x"), String(h), { size: 5.2, tone: "mid", anchor: "middle" })));
  return out.join("");
}

/* lo incrustado en la regla: dormir, trabajo o guardia, entreno y planes; las comidas, un remache */
function inlaysSvg(DIA, P, RULE, RULE_Z) {
  const hx = (h) => RULE.x + 6 + (RULE.w - 12) * Math.min(24, Math.max(0, h)) / 24, at = (p) => k.iso(p, P);
  const band = (a, b, cls) => b - a < 0.05 ? "" : `<path class="${cls}" d="${k.pathOf([at([hx(a), RULE.y + 1.4, RULE_Z]), at([hx(b), RULE.y + 1.4, RULE_Z]), at([hx(b), RULE.y + 4.2, RULE_Z]), at([hx(a), RULE.y + 4.2, RULE_Z])], true)}"/>`;
  const cls = { sleep: "in-sleep", work: "in-work", gym: "in-gym", plan: "in-gym" };
  let out = "";
  DIA.forEach((e) => { if (!cls[e.k]) return; out += band(e.a, Math.min(24, e.b), cls[e.k]); if (e.b > 24) out += band(0, e.b - 24, cls[e.k]); });
  const meals = DIA.filter((e) => e.k === "meal").map((e) => at([hx(e.a), RULE.y + 2.8, RULE_Z]));
  return out + (meals.length ? k.dotsSvg(meals, { size: 0.75, tone: "hi" }) : "");
}

/* el cursor: un carro de latón que corre por el canto de la regla */
function carriage() {
  const out = [];
  const c = { x: -3.4, y: RULE.y - 1.6, w: 6.8, d: RULE.d + 3.2, r: 1 };
  out.push(S(k.slabOf(c, RULE_Z, 2.2, P, 3, 0.4), { tone: "hi", className: "m-brass" }));
  out.push(S(k.extrude([[-1.2, RULE.y + RULE.d + 1.6], [1.2, RULE.y + RULE.d + 1.6], [0, RULE.y + RULE.d + 4.4]], RULE_Z, 2.2, P), { tone: "hi", className: "m-brass", lit: true }));
  out.push(L(k.lineOnTop([0, c.y + 0.8], [0, c.y + c.d - 0.8], RULE_Z + 2.2, P), { tone: "lit" }));
  out.push(D([at([0, c.y + 1.6, RULE_Z + 2.2])], { size: 0.45 }));
  return out.join("");
}

/* las dos patas con su zapata atornillada */
function legs() {
  const out = [];
  for (const cx of [-78, 78]) {
    const foot = { x: cx - 11, y: -16, w: 22, d: 30, r: 2 };
    out.push(S(k.slabOf(foot, 0, 4, P, 3, 0.6), { tone: "mid", className: "m-brass" }));
    out.push(D(k.corners(foot, 3).map(([x, y]) => at([x, y, 4])), { size: 0.45 }));
    out.push(S(k.slabOf({ x: cx - 4.5, y: -5, w: 9, d: 10, r: 1.5 }, 4, CAB_Z0 - 3 - 4, P, 3, 0.5), { tone: "mid", className: "m-wood" }));
  }
  return out.join("");
}

/* colgado del techo: dos placas atornilladas, dos varillas con su tensor y las orejetas de la cornisa */
function hangers() {
  const out = [];
  for (const cx of [-70, 70]) {
    const pl = { x: cx - 10, y: -7, w: 20, d: 14, r: 1.6 };
    out.push(S(k.slabOf(pl, TECHO, 3, P, 3, 0.5), { tone: "mid", className: "m-brass" }));
    out.push(D(k.corners(pl, 2.6).map(([x, y]) => at([x, y, TECHO + 3])), { size: 0.45 }));
    const z0 = CAB_Z1 + 5;
    out.push(S(k.slabOf({ x: cx - 4, y: -1.4, w: 8, d: 2.8, r: 0.8 }, z0, 4.5, P, 2, 0.3), { tone: "mid", className: "m-brass" }));
    out.push(D([at([cx, 1.4, z0 + 2.6])], { size: 0.55 }));
    out.push(S(k.cylinder(cx, 0, 1.1, z0 + 4.5, TECHO - z0 - 4.5, P, 18), { tone: "mid", crease: "none", className: "m-brass" }));
    out.push(S(k.cylinder(cx, 0, 2, z0 + 10, 5, P, 20), { tone: "mid", className: "m-brass" }));
    out.push(L(k.sideArc(cx, 0, 2, z0 + 12.5, P, 14), { tone: "lo" }));
  }
  return out.join("");
}

/* ---------- la caja con sus tres filas ---------- */
function cabinet() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CAB, CAB_Z0 - 3, 6, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf({ x: CAB.x - 2, y: CAB.y - 2, w: CAB.w + 4, d: CAB.d + 4, r: 2 }, CAB_Z0 - 3, 3, P, 4, 0.5), { tone: "mid", className: "m-brass" }));
  out.push(S(k.slabOf(CAB, CAB_Z0, CAB_Z1 - CAB_Z0, P, 4, 1.2), { tone: "mid", className: "m-wood" }));
  out.push(L(k.sideSeam(k.insetPlan(CAB, 0), CAB_Z1 - 10, P), { tone: "faint", className: "l-wood" }));
  /* la cornisa, con remaches por delante */
  const corn = { x: CAB.x - 3, y: CAB.y - 3, w: CAB.w + 6, d: CAB.d + 6, r: 2.4 };
  out.push(S(k.slabOf(corn, CAB_Z1, 5, P, 4, 0.8), { tone: "mid", className: "m-brass" }));
  out.push(L(k.planOutline(k.insetPlan(corn, 3), CAB_Z1 + 5, P), { tone: "faint" }));
  out.push(D(Array.from({ length: 13 }, (_, i) => at([corn.x + 8 + i * (corn.w - 16) / 12, corn.y + corn.d, CAB_Z1 + 2.5])), { size: 0.4 }));
  /* el costado: rejilla de ventilación y la tapa de servicio */
  out.push(L(Array.from({ length: 6 }, (_, i) => sideSlot(CAB.y + 4 + i * 2.4, CAB_Z1 - 24, CAB_Z1 - 12)).join(""), { tone: "faint", className: "l-wood" }));
  const tapa = k.pathOf([[CAB.y + 2.5, CAB_Z0 + 5], [CAB.y + CAB.d - 2.5, CAB_Z0 + 5], [CAB.y + CAB.d - 2.5, CAB_Z0 + 40], [CAB.y + 2.5, CAB_Z0 + 40]].map(([y, z]) => at([SIDE, y, z])), true);
  out.push(L(tapa, { tone: "lo", className: "l-wood" }));
  out.push(D([[CAB.y + 4.5, CAB_Z0 + 7], [CAB.y + CAB.d - 4.5, CAB_Z0 + 7], [CAB.y + 4.5, CAB_Z0 + 38], [CAB.y + CAB.d - 4.5, CAB_Z0 + 38]].map(([y, z]) => at([SIDE, y, z])), { size: 0.4 }));
  /* la cara: separadores entre filas de canto a canto y tornillos en las esquinas */
  const face = [];
  for (const z of [86, 60]) face.push(`<path class="iso-line" data-tone="faint" d="M${CAB.x + 2} ${-z}H${SIDE - 2}"/>`);
  out.push(`<g transform="${planeOf(FRONT)}" class="l-wood">${face.join("")}</g>`);
  out.push(D([[CAB.x + 4, CAB_Z1 - 3.5], [SIDE - 4, CAB_Z1 - 3.5], [CAB.x + 4, CAB_Z0 + 3.5], [SIDE - 4, CAB_Z0 + 3.5]].map(([x, z]) => at([x, FRONT, z])), { size: 0.5 }));
  return out.join("");
}

/* una fila: la placa con su nombre y su piloto, y la ventana con las lamas */
function row(r) {
  const { z0, z1 } = ROWS[r], zc = (z0 + z1) / 2, out = [];
  const plate = { x: HEAD.u0, y: FRONT, w: HEAD.u1 - HEAD.u0, d: 0.8, r: 0.4 };
  out.push(S(k.slabOf(plate, z0 + 3, z1 - z0 - 6, P, 2, 0.3), { tone: "mid", className: "m-brass" }));
  out.push(`<g transform="${planeOf(FRONT + 0.8)}"><text class="sf-name" x="${HEAD.u0 + 3.4}" y="${-(zc + 0.6)}">${NAMES[r]}</text><text class="sf-sub" x="${HEAD.u0 + 3.4}" y="${-(zc - 4.6)}">${r === 0 ? "hasta las" : "a las"}</text></g>`);
  out.push(D([at([HEAD.u0 + 1.8, FRONT + 0.8, z1 - 4.8]), at([HEAD.u0 + 1.8, FRONT + 0.8, z0 + 4.8])], { size: 0.35 }));
  /* el piloto: encendido en AHORA */
  const F = G.frameAlong([HEAD.u1 - 4.5, FRONT + 0.8, zc], [0, 1, 0]);
  out.push(S(G.disc(0, 1.2, 2.6, F, P), { tone: "mid", className: "m-brass" }));
  out.push(`<g data-lamp="${r}">${S(G.disc(1.2, 2.2, 1.7, F, P), { tone: r === 0 ? "hi" : "mid", lit: r === 0, className: r === 0 ? "m-lamp" : "m-lamp-off" })}</g>`);
  /* las lamas */
  const cells = [], tops = [], bots = [];
  for (let i = 0; i < NT + NX; i++) {
    const u = cellU(i), cx = u + CELL_W / 2;
    cells.push(`<path class="sf-cell" d="${flat(u, z0 + 2.2, u + CELL_W, z1 - 2.2, 0.8, 3)}"/>`);
    const ch = (cls, half) => `<g class="sf-f ${cls}" data-c="${r}-${i}-${half}"><rect class="sf-flap" x="${u}" y="${half === "t" ? -(z1 - 2.2) : -zc}" width="${CELL_W}" height="${zc - z0 - 2.2}" rx="0.8"/><text class="sf-ch" x="${cx}" y="${-(zc - 3.7)}"> </text></g>`;
    tops.push(ch("st", "t"), ch("ft", "t"));
    bots.push(ch("sb", "b"), ch("fb", "b"));
  }
  const id = `sf-half-${r}`;
  const back = [
    ...cells,
    `<clipPath id="${id}t"><rect x="${WIN.u0}" y="${-(z1 - 2.2)}" width="${WIN.u1 - WIN.u0}" height="${z1 - 2.2 - zc - 0.25}"/></clipPath>`,
    `<clipPath id="${id}b"><rect x="${WIN.u0}" y="${-zc + 0.25}" width="${WIN.u1 - WIN.u0}" height="${zc - z0 - 2.2 - 0.25}"/></clipPath>`,
    `<g clip-path="url(#${id}t)">${tops.join("")}</g>`, `<g clip-path="url(#${id}b)">${bots.join("")}</g>`,
    /* los ejes de las lamas, de punta a punta de la ventana */
    `<path class="sf-axle" d="M${WIN.u0 + 1} ${-zc}H${WIN.u1 - 1}"/>`,
    `<path class="sf-sep" d="M${cellU(NT) - 2.2} ${-(z1 - 3)}V${-(z0 + 3)}"/>`,
  ].join("");
  out.push(recess({ u0: WIN.u0, u1: WIN.u1, z0, z1, r: 1.6 }, FRONT, DEPTH, back));
  out.push(D([at([WIN.u0 + 1, FRONT - DEPTH, zc]), at([WIN.u1 - 1, FRONT - DEPTH, zc])], { size: 0.5 }));
  return out.join("");
}

/* el pomo del costado (en la app: tocar el panel lleva a la agenda) */
function knob() {
  const F = G.frameAlong([SIDE, 0, 73], [1, 0, 0]);
  return S(G.disc(0, 2, 7, F, P), { tone: "mid", className: "m-brass" })
    + S(G.disc(2, 6, 5.2, F, P), { tone: "mid", className: "m-brass" })
    + L(G.ribsOf(F, 2.3, 5.7, 5.2, 30, P, { seams: false }), { tone: "lo" });
}

const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "Un panel de lamas de madera y latón sobre una peana, como los de llegadas de una estación. Tres filas: ahora, luego y después, cada una con su hora y lo que toca. Cuando empieza otra cosa, las lamas giran y todo sube una fila. Sobre la peana, una regla de 24 horas con el día incrustado y un cursor de latón en la hora.",
  body: MADERA ? [base(), legs(), cabinet(), row(0), row(1), row(2), knob(), rule(), `<g data-part="carriage" transform="${k.translateAlong(P, [hx(T0), 0, 0])}">${carriage()}</g>`]
    : [hangers(), cabinet(), row(0), row(1), row(2), knob()],
});

/* ---------- los colores: madera y latón (los del reloj de arena) y lamas negras ---------- */
const mat = (sel, v) => `${sel}{${Object.entries(v).map(([a, b]) => `--anatomy-${a}:${b}`).join(";")}}`;
const sh = (a, b, c, d) => ({ "shade-0": a, "shade-1": b, "shade-2": c, "shade-3": d });
const AZUL = [
  mat(".iso", { page: "#070b14", card: "#111a2b", paper: "#111a2b", text: "#8fa6c6", strong: "#e9f2ff", muted: "#5d7394", halo: "#02040a" }),
  mat(".iso[data-theme=light]", { page: "#f4f7fb", card: "#ffffff", paper: "#ffffff", text: "#4a5d78", strong: "#0d1726", muted: "#8a9ab2", halo: "#5c6f8c" }),
  mat(".m-wood", { paper: "#14203a", ...sh("#0b1222", "#0e172a", "#121d33", "#16233d"), top: "#1d2c4a", hi: "#9fc4f0", mid: "#4a6a92", lo: "#2a3d5c", faint: "#1e2c47" }),
  mat(".m-brass", { paper: "#253246", ...sh("#141c28", "#19222f", "#1e2836", "#242f3f"), top: "#3a4a62", hi: "#dbe9fb", mid: "#8ea4c2", lo: "#52647f", faint: "#2e3b50", "lit-top": "#2f6f86", "lit-shade": "#1b4a5c", lit: "#9ff3ff", face: "#1b4a5c" }),
  mat(".m-lamp", { paper: "#0e5566", ...sh("#1d9fbd", "#26b2d1", "#30c4e3", "#38d3f2"), top: "#7fecff", hi: "#e6fbff", mid: "#7fecff", lo: "#1d8aa3", "lit-top": "#9ff3ff", "lit-shade": "#2fc3e2", lit: "#f2fdff" }),
  mat(".m-lamp-off", { paper: "#1a2436", ...sh("#111827", "#141c2c", "#172031", "#1a2436"), top: "#26324a", hi: "#5d7394", mid: "#3f5070", lo: "#26324a" }),
  mat("[data-theme=light] .m-wood", { paper: "#dfe7f2", ...sh("#b7c5d8", "#c3d0e1", "#cfdaea", "#dfe7f2"), top: "#eef3f9", hi: "#22344f", mid: "#6f84a3", lo: "#a9b9cf", faint: "#cfdaea" }),
  mat("[data-theme=light] .m-brass", { paper: "#eef2f7", ...sh("#c6d0dd", "#d0d9e4", "#dae2eb", "#e4eaf1"), top: "#f8fafc", hi: "#1d2b40", mid: "#7c8ea8", lo: "#b6c3d4", faint: "#dbe3ec", "lit-top": "#c9f6ff", "lit-shade": "#7fd9ec", lit: "#00586b", face: "#bfeffa" }),
  mat("[data-theme=light] .m-lamp", { paper: "#28c3e2", ...sh("#0f9cbd", "#17accb", "#20bbd9", "#28c3e2"), top: "#8beaff", hi: "#00485a", mid: "#0b8eae", lo: "#5fd6ee", "lit-top": "#a6f0ff", "lit-shade": "#22b4d4", lit: "#003d4c" }),
  mat("[data-theme=light] .m-lamp-off", { paper: "#d3dce8", ...sh("#b4c1d2", "#bdc9d9", "#c7d2e0", "#d3dce8"), top: "#e3e9f1", hi: "#5d7394", mid: "#8a9ab2", lo: "#b4c1d2" }),
  ".sf-well{fill:#05080e}.sf-cell,.sf-flap{fill:#0d131f}.sf-flap{stroke:#05080e;stroke-width:.25}.sf-axle{stroke:#000;stroke-width:.55}.sf-sep{stroke:#2a3d5c;stroke-width:.6}",
  ".sf-ch{fill:#e9f2ff;font:700 10.4px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-anchor:middle}.sf-row0 .sf-ch{fill:#7fecff}",
  ".sf-name{fill:#e9f2ff;font:800 4.4px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:0}.sf-sub{fill:#8fa6c6;font:600 3.9px/1 ui-sans-serif,system-ui,sans-serif}",
  "[data-theme=light] .sf-well{fill:#101827}[data-theme=light] .sf-cell,[data-theme=light] .sf-flap{fill:#1b2537}[data-theme=light] .sf-flap{stroke:#0b111c}[data-theme=light] .sf-ch{fill:#f4f8ff}[data-theme=light] .sf-row0 .sf-ch{fill:#8beaff}[data-theme=light] .sf-name{fill:#1d2b40}[data-theme=light] .sf-sub{fill:#4a5d78}",
  ".iso-page{margin:14px auto 28px!important;width:min(650px,100% - 20px)!important}",
  ".corto .iso-legend{display:none}.corto .iso-page{margin:0 auto!important;width:100%!important}.corto .iso-figure{margin:0}.corto,.corto body{background:transparent}.corto .iso-plate{padding:0!important;background:none!important;border:0!important;box-shadow:none!important}.corto .iso-plate-corners{display:none}",
].join("");
const CSS = MADERA ? [
  mat(".iso", { page: "#120e0b", card: "#18130f", paper: "#18130f", text: "#b3a594", strong: "#efe3d2", muted: "#7d6f60", halo: "#050302" }),
  mat(".iso[data-theme=light]", { page: "#f3ece2", card: "#fbf7f1", paper: "#fbf7f1", text: "#5d5045", strong: "#2a1f16", muted: "#9a8b7b", halo: "#7a6450" }),
  mat(".m-wood", { paper: "#2c1f15", ...sh("#1c130c", "#221810", "#291d14", "#302219"), top: "#3d2c1f", hi: "#d2ab82", mid: "#8d6b4c", lo: "#5b4330", faint: "#3f2e21" }),
  mat(".m-brass", { paper: "#3a2d12", ...sh("#271e0b", "#2e240e", "#352a11", "#3d3015"), top: "#5d4a1d", hi: "#ecc96e", mid: "#b8944a", lo: "#7c6331", faint: "#4f401f", "lit-top": "#7a6226", "lit-shade": "#4e3e18", lit: "#ffe08a", face: "#4e3e18" }),
  mat(".m-lamp", { paper: "#6b4a10", ...sh("#c98a1c", "#d9992a", "#e8aa3a", "#f5bd4e"), top: "#ffd66b", hi: "#fff1bf", mid: "#ffd66b", lo: "#b07a1a", "lit-top": "#ffe08a", "lit-shade": "#e0a12f", lit: "#fff6d6" }),
  mat(".m-lamp-off", { paper: "#2a2118", ...sh("#1d1610", "#221a13", "#271f17", "#2c231a"), top: "#3a2e22", hi: "#6e5a44", mid: "#5a4936", lo: "#3e3226" }),
  mat("[data-theme=light] .m-wood", { paper: "#e6cca8", ...sh("#c39e72", "#cfaa7f", "#d9b88f", "#e6cca8"), top: "#f3e2c8", hi: "#5b3d22", mid: "#9a7550", lo: "#c4a37b", faint: "#dcc3a0" }),
  mat("[data-theme=light] .m-brass", { paper: "#e8cd84", ...sh("#c5a253", "#d1b062", "#ddbe72", "#e8cd84"), top: "#f7e4a8", hi: "#6b5016", mid: "#a5822f", lo: "#cdb06a", faint: "#e3cf96", "lit-top": "#fff0bd", "lit-shade": "#e2c375", lit: "#4a3608", face: "#f2da92" }),
  mat("[data-theme=light] .m-lamp", { paper: "#f2b53c", ...sh("#d98f12", "#e49c1f", "#eda92e", "#f5b83e"), top: "#ffcf5e", hi: "#7a4a00", mid: "#c07a0a", lo: "#e8a733", "lit-top": "#ffd977", "lit-shade": "#e7a22a", lit: "#5a3600" }),
  mat("[data-theme=light] .m-lamp-off", { paper: "#d9c6a6", ...sh("#bfa883", "#c8b28e", "#d0bb98", "#d9c6a6"), top: "#e6d6ba", hi: "#7d6648", mid: "#a8916f", lo: "#c4ae8b" }),
  ".l-wood{stroke:#5b4330!important}[data-theme=light] .l-wood{stroke:#c4a37b!important}",
  ".in-sleep{fill:#5a78b8}.in-work{fill:#c9573a}.in-gym{fill:#4f9a62}[data-theme=light] .in-sleep{fill:#6f8fd0}[data-theme=light] .in-work{fill:#d9574a}[data-theme=light] .in-gym{fill:#5bb072}",
  /* las lamas: negras con letra crema, en los dos temas (son pintura del objeto, no tinta) */
  ".sf-well{fill:#0b0806}.sf-cell,.sf-flap{fill:#17120e}.sf-flap{stroke:#0b0806;stroke-width:.25}.sf-axle{stroke:#000;stroke-width:.55}.sf-sep{stroke:#5b4330;stroke-width:.6}",
  ".sf-ch{fill:#efe3d2;font:700 10.4px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-anchor:middle}",
  "[data-r='0'] .sf-ch,.sf-row0 .sf-ch{fill:#ffe08a}",
  ".sf-sub{fill:#c9a85a;font:600 3.4px/1 ui-sans-serif,system-ui,sans-serif}[data-theme=light] .sf-sub{fill:#5a4520}",
  ".sf-name{fill:#f3d98f;font:800 4.1px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.03em}",
  "[data-theme=light] .sf-well{fill:#2a2018}[data-theme=light] .sf-cell,[data-theme=light] .sf-flap{fill:#2e241b}[data-theme=light] .sf-flap{stroke:#1a130d}[data-theme=light] .sf-ch{fill:#fbf3e6}[data-theme=light] .sf-row0 .sf-ch{fill:#ffd66b}[data-theme=light] .sf-name{fill:#3a2a12}",
  ".iso-page{margin:14px auto 28px!important;width:min(650px,100% - 20px)!important}",
  ".corto .iso-legend{display:none}.corto .iso-page{margin:0 auto!important;width:100%!important}.corto .iso-figure{margin:0}.corto,.corto body{background:transparent}.corto .iso-plate-corner[data-corner=fig],.corto .iso-plate-corner[data-corner=title]{display:none}",
  "@media (max-width:520px){.iso-plate-corner{font-size:10.5px!important;letter-spacing:.03em!important}.iso-plate-corner[data-corner=readout]{font-size:10px!important;letter-spacing:0!important}}",
].join("") : AZUL + "@media (max-width:520px){.iso-plate-corner{font-size:10.5px!important;letter-spacing:.03em!important}.iso-plate-corner[data-corner=readout]{font-size:10px!important;letter-spacing:0!important}}";

/* ---------- la parte viva: el día que pasa y las lamas que giran ---------- */
const live = `
const P = ${JSON.stringify(P)}, NT = ${NT}, NX = ${NX}, ROWS = ${JSON.stringify(ROWS)};
const RULE = ${JSON.stringify(RULE)}, RULE_Z = ${RULE_Z};
let DIA = ${JSON.stringify(DIA)};
const HD = /[#&]d=([^&]+)/.exec(location.hash), HT = /[#&]t=([0-9.]+)/.exec(location.hash);
if (HD) try { DIA = JSON.parse(decodeURIComponent(HD[1])); } catch (e) {}
if (/[#&]corto(&|$)/.test(location.hash)) document.body.classList.add("corto");
const k = { iso, pathOf, dotsSvg };
${inlaysSvg.toString()}
const hx = (h) => RULE.x + 6 + (RULE.w - 12) * Math.min(24, Math.max(0, h)) / 24;
const svg = document.querySelector(".iso-stage svg"), stage = document.querySelector(".iso-stage"), readout = document.querySelector("[data-readout]");
const car = svg.querySelector('[data-part="carriage"]');
if (HD && svg.querySelector('[data-part="inlays"]')) svg.querySelector('[data-part="inlays"]').innerHTML = inlaysSvg(DIA, P, RULE, RULE_Z);
const still = matchMedia("(prefers-reduced-motion: reduce)");
const hhmm = (h) => { const m = Math.round(((h % 24) + 24) % 24 * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const dura = (h) => { const m = Math.max(0, Math.round(h * 60)); return (m >= 60 ? Math.floor(m / 60) + " h " : "") + String(m % 60).padStart(m >= 60 ? 2 : 1, "0") + " min"; };
/* lo que dicen las tres filas a una hora: AHORA lleva su hora de fin, LUEGO y DESPUÉS la de empezar */
function filas(t) {
  const ahora = DIA.find((e) => t >= e.a && t < e.b), sig = DIA.filter((e) => e.a > t);
  const r0 = ahora ? ["→" + hhmm(ahora.b).slice(0, 5), ahora.t] : ["→" + hhmm(sig[0] ? sig[0].a : 24), "LIBRE"];
  const pad = (s, n) => (s + " ".repeat(n)).slice(0, n);
  const fila = (h, txt) => pad(h, NT).slice(0, NT) + pad(txt, NX);
  return {
    txt: [fila(r0[0].slice(1).length === 5 ? r0[0].slice(1) : r0[0], r0[1]), sig[0] ? fila(hhmm(sig[0].a), sig[0].t) : fila("", ""), sig[1] ? fila(hhmm(sig[1].a), sig[1].t) : fila("", "")],
    ahora: ahora ? ahora.t.toLowerCase() : "libre", queda: ahora ? ahora.b - t : (sig[0] ? sig[0].a - t : 0),
  };
}
/* una lama por casilla: gira pasando por las letras de en medio, como las de verdad */
const ORDEN = " ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚÜ0123456789:·→-+";
const cells = [];
for (let r = 0; r < 3; r++) for (let i = 0; i < NT + NX; i++) {
  const g = (h) => svg.querySelector('[data-c="' + r + "-" + i + "-" + h + '"]');
  const c = { r, i, st: g("t"), sb: g("b"), cur: " ", queue: [], p: 0, delay: 0 };
  [c.st, c.sb] = svg.querySelectorAll('[data-c="' + r + "-" + i + '-t"]').length ? [svg.querySelectorAll('[data-c="' + r + "-" + i + '-t"]')[0], svg.querySelectorAll('[data-c="' + r + "-" + i + '-b"]')[0]] : [null, null];
  c.ft = svg.querySelectorAll('[data-c="' + r + "-" + i + '-t"]')[1]; c.fb = svg.querySelectorAll('[data-c="' + r + "-" + i + '-b"]')[1];
  const y = (el) => +el.querySelector("text").getAttribute("y");
  c.split = ((+c.st.querySelector("rect").getAttribute("y")) + (+c.st.querySelector("rect").getAttribute("height")));
  c.cx = +c.st.querySelector("text").getAttribute("x");
  if (r === 0) [c.st, c.sb, c.ft, c.fb].forEach((el) => el.classList.add("sf-row0"));
  cells.push(c);
}
const put = (el, ch) => { const t = el.querySelector("text"); if (t.textContent !== ch) t.textContent = ch; };
const fold = (el, s, c) => el.setAttribute("transform", s >= 0.999 ? "" : "translate(0 " + c.split + ") scale(1 " + Math.max(0.001, s).toFixed(3) + ") translate(0 " + (-c.split) + ")");
function settle(c) { put(c.st, c.cur); put(c.sb, c.cur); fold(c.ft, 0, c); fold(c.fb, 0, c); c.ft.style.visibility = c.fb.style.visibility = "hidden"; }
function want(c, ch) {
  if (c.target === ch) return; c.target = ch;
  if (still.matches) { c.cur = ch; c.queue = []; settle(c); return; }
  const a = Math.max(0, ORDEN.indexOf(c.cur)), b = Math.max(0, ORDEN.indexOf(ch)), n = (b - a + ORDEN.length) % ORDEN.length;
  const pasos = Math.min(n, 4), q = [];
  for (let s = pasos - 1; s >= 1; s--) q.push(ORDEN[(b - s + ORDEN.length) % ORDEN.length]);
  q.push(ch); c.queue = q; c.p = 0; c.delay = (c.i * 0.022 + c.r * 0.09);
}
const FLIP = 0.075;   // segundos por lama
function step(c, dt) {
  if (!c.queue.length) return false;
  if (c.delay > 0) { c.delay -= dt; return true; }
  const next = c.queue[0];
  c.p += dt / FLIP;
  c.ft.style.visibility = c.fb.style.visibility = "visible";
  put(c.st, next); put(c.ft, c.cur); put(c.sb, c.cur); put(c.fb, next);
  if (c.p < 0.5) { fold(c.ft, 1 - 2 * c.p, c); fold(c.fb, 0, c); }
  else { fold(c.ft, 0, c); fold(c.fb, Math.min(1, 2 * c.p - 1), c); }
  if (c.p >= 1) { c.cur = next; c.queue.shift(); c.p = 0; if (!c.queue.length) settle(c); }
  return true;
}
const AHORA = HT ? Math.min(23.99, +HT[1]) : null;
let t = AHORA != null ? AHORA : ${T0}, target = t, frame = 0, last = 0, touring = true, visible = false, idle = 0, clock = 0, shown = "";
const PARADAS = [6.5, 7, 10.4, 15.3, 16.6, 18, 19.4, 20.5, 22.4, 23];
function draw() {
  if (car) car.setAttribute("transform", translateAlong(P, [hx(t), 0, 0]));
  const f = filas(t), key = f.txt.join("|");
  if (key !== shown) { shown = key; f.txt.forEach((s, r) => [...s].forEach((ch, i) => want(cells[r * (NT + NX) + i], ch))); }
  const txt = hhmm(t) + " · " + f.ahora + " · queda" + (f.queda >= 1 ? "n " : " ") + dura(f.queda);
  if (readout.textContent !== txt) readout.textContent = txt;
  stage.setAttribute("aria-valuetext", txt);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
  if (touring) { clock += dt; target = PARADAS[Math.floor(clock / 2.6) % PARADAS.length]; }
  t = still.matches ? target : t + (target - t) * (1 - Math.exp(-dt / 0.35));
  if (Math.abs(target - t) < 0.002) t = target;
  draw();
  let busy = false; for (const c of cells) busy = step(c, dt) || busy;
  frame = visible && (touring || busy || t !== target) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (to) => { touring = false; target = Math.min(23.99, Math.max(0, to)); clearTimeout(idle); idle = setTimeout(() => { if (AHORA != null) target = AHORA; else touring = !still.matches; run(); }, 4000); run(); };
new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches || AHORA != null) touring = false;
stage.addEventListener("pointermove", (ev) => { const b = svg.getBoundingClientRect(); steer(24 * Math.min(1, Math.max(0, (ev.clientX - b.left) / b.width))); });
stage.addEventListener("keydown", (ev) => { const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[ev.key]; if (!d) return; ev.preventDefault(); steer(Math.round(target * 4) / 4 + d * 0.25); });
cells.forEach((c) => settle(c));
const f0 = filas(t); f0.txt.forEach((s, r) => [...s].forEach((ch, i) => { const c = cells[r * (NT + NX) + i]; c.cur = c.target = ch; settle(c); })); shown = f0.txt.join("|");
draw();
`;

const body = `<style>${CSS}</style>` + k.plateHtml({
  fig: "Fig 1",
  title: "Lo que viene",
  hint: "Desliza para mover la hora",
  readout: "",
  keys: [
    { mark: "lit", label: "AHORA: lo que estás haciendo y hasta qué hora; su piloto está encendido" },
    { mark: "raised", label: "LUEGO y DESPUÉS: lo siguiente, con la hora a la que empieza" },
    ...(MADERA ? [{ mark: "flat", label: "La regla: tu día en 24 h (azul dormir, rojo trabajo, verde entreno y planes, remaches las comidas)" }] : []),
  ],
  caption: "Un panel de llegadas como los de las estaciones. Cuando empieza otra cosa, las lamas giran y todo sube una fila. Lo que dice sale de la misma agenda que el reloj de Hoy.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Panel de lo que viene: las flechas mueven la hora de cuarto en cuarto" aria-valuemin="0" aria-valuemax="24">${svg}</div>`,
});
const out = (MADERA ? "madera" : "panel") + (theme === "light" ? "-light" : "") + ".html";
writeFileSync(join(HERE, out), k.pageHtml({ title: "Lo que viene", theme, body, script: kitScript() + live }).replace('<html lang="en">', '<html lang="es">'));
console.log("wrote", out, Math.round(k.pageHtml({ title: "", theme, body, script: kitScript() + live }).length / 1024), "KB");
