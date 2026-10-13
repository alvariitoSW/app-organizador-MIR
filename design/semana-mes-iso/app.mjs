/* Semana y Mes en isométrico para la app: genera fig/calendario-iso.js, un módulo sin dependencias
   (window.CalIso.semana({onDia}) y window.CalIso.mes({onDia}) → {el, actualiza(datos)}).
   Lo que no cambia (la peana, la cochera, la regla, la canceladora, las piezas redondas) se dibuja aquí
   con el kit de /anatomy; lo que sale de los datos (el servicio de cada andén, las paradas, la noche,
   las fichas del mes, los agujeros del abono) lo pinta el móvil con el mismo kit, que va dentro.
   Mismo dibujo que las maquetas aprobadas (design/semana-mes-iso/build.mjs).
   node design/semana-mes-iso/app.mjs → fig/calendario-iso.js */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import { fichasDe } from "../calendario-propuestas/fichas.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, f) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * f).toString(16).padStart(2, "0")).join("");
const mat = (sel, v) => `${sel}{${Object.entries(v).map(([a, b]) => `--anatomy-${a}:${b}`).join(";")}}`;
const tinte = (sel, c, dark) => mat(sel, dark
  ? { paper: c, "shade-0": mix(c, "#000000", 0.45), "shade-1": mix(c, "#000000", 0.35), "shade-2": mix(c, "#000000", 0.25), "shade-3": mix(c, "#000000", 0.15), top: mix(c, "#ffffff", 0.12), hi: mix(c, "#ffffff", 0.55), mid: mix(c, "#ffffff", 0.25), lo: mix(c, "#000000", 0.5), faint: mix(c, "#000000", 0.3) }
  : { paper: c, "shade-0": mix(c, "#000000", 0.22), "shade-1": mix(c, "#000000", 0.16), "shade-2": mix(c, "#000000", 0.1), "shade-3": mix(c, "#000000", 0.04), top: mix(c, "#ffffff", 0.3), hi: mix(c, "#000000", 0.6), mid: mix(c, "#000000", 0.35), lo: mix(c, "#000000", 0.18), faint: mix(c, "#000000", 0.08) });
const MATS = {
  base: ["#16223a", "#dfe7f2"], steel: ["#3a4a62", "#d4dde8"], concrete: ["#2c3647", "#e3e8ef"], bus: ["#c9d4e4", "#f7f9fc"], tyre: ["#151a22", "#3a404a"],
  work: ["#d9573f", "#ef7a63"], guard: ["#34467e", "#6f86c8"], meal: ["#2f9e6b", "#56c48f"], gym: ["#7a5cf0", "#9c86ff"], plan: ["#1fa6c4", "#4cc9e4"],
  night: ["#1b2547", "#aebce6"], libre: ["#56627a", "#c3cbd8"], vac: ["#e3a72f", "#f6c35a"], tile: ["#1d283c", "#eef2f7"], amber: ["#ffd66b", "#f2b929"],
  leaf: ["#3f8a4f", "#86c47a"], trunk: ["#5a3f2a", "#a07a58"], ticket: ["#f6c35a", "#f6c35a"], moon: ["#e9eef5", "#ffffff"], lcdcase: ["#0e1626", "#26334a"],
  rojo: ["#ff2b3a", "#ff3d4a"], rojot: ["#3a0c12", "#ffd5d9"], casa: ["#e8dcc4", "#f3ead8"], tejado: ["#b3503a", "#c9654d"], cesped: ["#3f8a4f", "#7fc46e"], agua: ["#1fa6c4", "#4cc9e4"],
  tejsal: ["#b3503a", "#c9654d"], tejvac: ["#b3503a", "#c9654d"], arbol: ["#3f8a4f", "#86c47a"],
};
const CSS = [
  k.ISO_CSS,
  mat(".ci", { page: "#070b14", card: "#111a2b", paper: "#111a2b", text: "#8fa6c6", strong: "#e9f2ff", muted: "#5d7394", halo: "#02040a" }),
  mat(".ci[data-theme=light]", { page: "#f4f7fb", card: "#ffffff", paper: "#ffffff", text: "#4a5d78", strong: "#0d1726", muted: "#8a9ab2", halo: "#5c6f8c" }),
  ...Object.entries(MATS).flatMap(([n, [d, l]]) => [tinte(".ci .m-" + n, d, true), tinte(".ci[data-theme=light] .m-" + n, l, false)]),
  ".ci{position:relative}.ci svg{display:block;width:100%;height:auto;border-radius:14px}",
  ".ci .glass{fill:#0a1220}.ci[data-theme=light] .glass{fill:#22324a}.ci .sign{fill:#05080e}.ci .sign-t{fill:#e9f2ff;font:800 6px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.04em}",
  ".ci .hoy .sign-t{fill:#ffd66b}.ci .sign-n{fill:#8fa6c6;font:700 4.4px/1 ui-monospace,Menlo,monospace}",
  ".ci .l-amber{stroke:#ffd66b!important;stroke-width:1.1px}.ci .l-paint{stroke:#8fa6c6!important;stroke-opacity:.5}.ci[data-theme=light] .l-paint{stroke:#6a7c96!important}",
  ".ci .l-umi{stroke:#9c86ff!important;stroke-width:1px}.ci .l-sal{stroke:#b9c7f3!important;stroke-width:1.1px}",
  ".ci .hora{fill:#8fa6c6;font:800 7px/1 ui-monospace,Menlo,monospace;text-anchor:middle}.ci[data-theme=light] .hora{fill:#4a5d78}",
  ".ci .placa{fill:#05080e}.ci .placa-t{fill:#7fecff;font:700 5.6px/1 ui-monospace,Menlo,monospace;text-anchor:middle}.ci .placa-t.corta{fill:#ffd66b}",
  ".ci .num{fill:#8fa6c6;font:800 7.4px/1 ui-sans-serif,system-ui,sans-serif}.ci .num.hoy{fill:#ffd66b}.ci[data-theme=light] .num{fill:#4a5d78}",
  ".ci .tk-t{fill:#3b2a05;font:800 4.6px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em}.ci .hole{fill:#070b14}.ci[data-theme=light] .hole{fill:#8a9ab2}",
  ".ci .lcd{fill:#04131a}.ci .lcd-t{fill:#7fecff;font:700 6px/1 ui-monospace,Menlo,monospace;text-anchor:middle}",
  ".ci [data-day]{cursor:pointer}.ci [data-day]:hover .iso-fill{filter:brightness(1.15)}",
  ".ci-pie{margin-top:6px;font:600 12.5px/1.35 ui-sans-serif,system-ui,sans-serif;color:#8fa6c6}.ci-pie b{color:#e9f2ff}.ci[data-theme=light] .ci-pie{color:#4a5d78}.ci[data-theme=light] .ci-pie b{color:#0d1726}",
].join("");

/* ====================== SEMANA: la cochera ====================== */
const SB = { BAY: 46, X0: 6, X1: 26, XA: 20, XB: 400, N: 7 };
const SP = (() => {
  const PLATE = { x: -96, y: -10, w: 520, d: SB.N * SB.BAY + 34, r: 6 };
  return k.fitProjection([...k.boxCorners(PLATE, -12, 0), ...k.boxCorners({ x: -96, y: -10, w: 520, d: 10 }, 0, 40)], 600, 420, { pad: 12, azimuth: 66, elevation: 44 });
})();
function semanaEstatico() {
  const P = SP, { BAY, N, XA, XB, X0, X1 } = SB, xh = (h) => XA + (Math.max(X0, Math.min(X1, h)) - X0) / (X1 - X0) * (XB - XA);
  const at = (p) => k.iso(p, P), S = (paths, o) => k.solidSvg(paths, o), L = (d, o) => k.lineSvg(d, o), D = (p, o) => k.dotsSvg(p, o);
  const front = (y) => k.sideMatrix([0, y], 0, P, "left"), top = (z) => k.topMatrix([0, 0], z, P, "x");
  const rect = (u0, z0, u1, z1) => `M${u0} ${-z1}H${u1}V${-z0}H${u0}Z`;
  const PLATE = { x: -96, y: -10, w: 520, d: N * BAY + 34, r: 6 }, out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -12, 8, P)}"/>`);
  for (const [x, y] of k.corners(PLATE, 14).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P)))
    out.push(S(k.cylinder(x, y, 5, -12, 4, P, 24), { tone: "lo", className: "m-steel" }));
  out.push(S(k.slabOf(PLATE, -8, 8, P, 8, 1.4), { tone: "mid", className: "m-base" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4), 0, P), { tone: "lo" }));
  out.push(D(k.corners(PLATE, 8).map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  out.push(S(k.slabOf({ x: -94, y: -8, w: 6, d: N * BAY + 4, r: 0.5 }, 0, 34, P, 2, 0.4), { tone: "mid", className: "m-concrete" }));
  for (let i = 0; i <= N; i++) out.push(S(k.slabOf({ x: -90, y: i * BAY - 3, w: 5, d: 4, r: 0.4 }, 0, 36, P, 2, 0.3), { tone: "mid", className: "m-steel" }));
  out.push(S(k.slabOf({ x: -88, y: -2, w: 500, d: N * BAY + 4, r: 0.5 }, 0, 0.6, P, 2), { tone: "mid", className: "m-concrete", crease: "none", flat: true }));
  const lin = [];
  for (let i = 0; i <= N; i++) lin.push(k.lineOnTop([-86, i * BAY], [410, i * BAY], 0.62, P));
  out.push(L(lin.join(""), { className: "l-paint" }));
  const grid = [];
  for (let h = 6; h <= 26; h += 3) grid.push(k.lineOnTop([xh(h), 2], [xh(h), N * BAY - 2], 0.62, P));
  out.push(L(grid.join(""), { tone: "faint", dashed: true }));
  /* los andenes: cada uno con su capa viva (la pinta el móvil), el cartel del sueño y el autobús */
  const busTpl = semanaBus(), signTpl = semanaCartel();
  for (let i = 0; i < N; i++) {
    const tr = k.translateAlong(P, [0, i * BAY, 0]);
    out.push(`<g data-fila="${i}"><g data-viva></g><g transform="${tr}" data-cartel>${signTpl}</g><g transform="${tr}" data-bus>${busTpl}</g></g>`);
  }
  /* la regla delante, con su escala de hora en hora */
  const reg = { x: XA - 6, y: N * BAY + 6, w: XB - XA + 12, d: 12, r: 0.8 };
  out.push(S(k.slabOf(reg, 0, 2.4, P, 3, 0.5), { tone: "mid", className: "m-steel" }));
  const tk = [];
  for (let h = 6; h <= 26; h++) tk.push(k.lineOnTop([xh(h), reg.y + 0.6], [xh(h), reg.y + (h % 6 === 0 ? 5 : 3)], 2.42, P));
  out.push(L(tk.join(""), { tone: "lo" }));
  out.push(`<g transform="${top(2.45)}">${[6, 12, 18, 24].map((h) => `<text class="hora" x="${xh(h)}" y="${reg.y + 10}">${h === 24 ? 0 : h}</text>`).join("")}</g>`);
  void rect; void front;
  return k.figureSvg({ width: 600, height: 420, label: "La semana como la cochera: siete andenes, uno por día, con la misma escala de horas. En la entrada de cada andén, el autobús del tipo de día; por el andén, el servicio y las paradas; al fondo, la noche y las horas de sueño.", body: out });
}
/* el autobús de un andén (en la fila 0; cada fila lo mueve entero): librea, letrero y la luna si es guardia */
function semanaBus() {
  const P = SP, yc = SB.BAY / 2, B = { x: -80, y: yc - 8, w: 56, d: 16, r: 2.4 }, o = [];
  const S = (paths, opt) => k.solidSvg(paths, opt), front = (y) => k.sideMatrix([0, y], 0, P, "left"), rect = (u0, z0, u1, z1) => `M${u0} ${-z1}H${u1}V${-z0}H${u0}Z`;
  o.push(`<path class="iso-halo" d="${k.haloOf(B, 0, 0.3, P)}" style="filter:blur(2px)"/>`);
  o.push(S(k.slabOf(B, 2.6, 15, P, 4, 0.8), { tone: "mid", className: "m-bus" }));
  o.push(S(k.slabOf({ x: B.x + 1.4, y: B.y + 1.2, w: B.w - 2.8, d: B.d - 2.4, r: 2 }, 17.6, 1.2, P, 3, 0.4), { tone: "mid", className: "m-__LV__" }));
  o.push(`<g data-luna style="display:__LUNA__">${S(G.sphereOf([B.x + B.w - 10, yc, 21.2], 2.6, P), { tone: "hi", className: "m-moon" })}</g>`);
  o.push(`<g transform="${front(B.y + B.d + 0.02)}" class="__HOY__"><path class="glass" d="${rect(B.x + 3, 8, B.x + B.w - 3, 11.4)}"/>` +
    `<path d="${rect(B.x + 1, 5, B.x + B.w - 1, 6.6)}" style="fill:var(--anatomy-paper)"/>` +
    `<path class="sign" d="${rect(B.x + 3, 12.2, B.x + B.w - 3, 17.2)}"/><text class="sign-t" x="${B.x + 4.6}" y="-13.4">__NOM__</text>` +
    `<text class="sign-n" x="${B.x + B.w - 4.4}" y="-13.7" text-anchor="end">__TIPO__</text></g>`);
  for (const x of [B.x + 11, B.x + B.w - 11]) { const F = G.frameAlong([x, B.y + B.d - 1, 4.2], [0, 1, 0]);
    o.push(S(G.disc(0, 1.8, 4.2, F, P), { tone: "lo", className: "m-tyre" }), S(G.disc(1.8, 2.1, 2.2, F, P), { tone: "mid", className: "m-steel" })); }
  return o.join("");
}
/* el cartel del sueño al fondo del andén (fila 0) */
function semanaCartel() {
  const P = SP, yc = SB.BAY / 2, xs = 404, S = (paths, opt) => k.solidSvg(paths, opt), front = (y) => k.sideMatrix([0, y], 0, P, "left"), rect = (u0, z0, u1, z1) => `M${u0} ${-z1}H${u1}V${-z0}H${u0}Z`;
  return S(k.cylinder(xs, yc - 6, 0.8, 0.6, 12, P, 8), { tone: "mid", className: "m-steel", crease: "none" }) +
    S(k.slabOf({ x: xs - 9, y: yc - 7, w: 18, d: 1.4, r: 0.3 }, 12.6, 7, P, 2, 0.3), { tone: "mid", className: "m-steel" }) +
    `<g transform="${front(yc - 5.58)}"><path class="placa" d="${rect(xs - 8, 13.2, xs + 8, 19)}"/><text data-r="sueno" class="placa-t" x="${xs}" y="-14.4"></text></g>`;
}
/* el farol de la raya de la hora y la tapa encendida, como piezas sueltas en el origen */
const SEM_FAROL = k.solidSvg(G.sphereOf([0, 0, 26], 2.4, SP), { tone: "hi", className: "m-amber", lit: true });

/* ====================== MES: el tablero y la canceladora ====================== */
const MB = { C: 30, GAP: 5, FILAS: 6 };
MB.PASO = MB.C + MB.GAP;
const MP = (() => {
  const PLATE = { x: -12, y: -12, w: 7 * MB.PASO + 92, d: MB.FILAS * MB.PASO + 19, r: 6 };
  return k.fitProjection([...k.boxCorners(PLATE, -12, 0), ...k.boxCorners({ x: 7 * MB.PASO + 34, y: 2 * MB.PASO - 6, w: 50, d: 40 }, 0, 74)], 600, 400, { pad: 12, azimuth: 66, elevation: 46 });
})();
const VAL = { X: 7 * MB.PASO + 40, Y: 2 * MB.PASO };
function mesEstatico() {
  const P = MP, out = [], at = (p) => k.iso(p, P), S = (paths, o) => k.solidSvg(paths, o), L = (d, o) => k.lineSvg(d, o), D = (p, o) => k.dotsSvg(p, o);
  const PLATE = { x: -12, y: -12, w: 7 * MB.PASO + 92, d: MB.FILAS * MB.PASO + 19, r: 6 };
  out.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -12, 8, P)}"/>`);
  for (const [x, y] of k.corners(PLATE, 14).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P)))
    out.push(S(k.cylinder(x, y, 5, -12, 4, P, 24), { tone: "lo", className: "m-steel" }));
  out.push(S(k.slabOf(PLATE, -8, 8, P, 8, 1.4), { tone: "mid", className: "m-base" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4), 0, P), { tone: "lo" }));
  out.push(D(k.corners(PLATE, 8).map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  out.push(`<g data-fichas></g>`);
  return k.figureSvg({ width: 600, height: 400, label: "El mes como un tablero de fichas: cada día una baldosa con su ficha (búho la guardia, autobús la jornada, flecha a la cochera el saliente, árbol el libre, autocar las vacaciones). Al lado, la canceladora con el abono del mes, taladrado según las guardias hechas.", body: out });
}
/* la canceladora (pedestal, cabeza, pantalla y la ranura con el abono); el texto y los agujeros los pone el móvil */
function canceladora() {
  const P = MP, { X, Y } = VAL, o = [], S = (paths, opt) => k.solidSvg(paths, opt), D = (p, opt) => k.dotsSvg(p, opt), at = (p) => k.iso(p, P);
  const front = (y) => k.sideMatrix([0, y], 0, P, "left"), top = (z) => k.topMatrix([0, 0], z, P, "x"), rect = (u0, z0, u1, z1) => `M${u0} ${-z1}H${u1}V${-z0}H${u0}Z`;
  o.push(S(k.slabOf({ x: X, y: Y, w: 30, d: 26, r: 2 }, 0, 4, P, 3, 0.6), { tone: "mid", className: "m-steel" }));
  o.push(S(k.slabOf({ x: X + 9, y: Y + 8, w: 12, d: 10, r: 1.2 }, 4, 38, P, 3, 0.5), { tone: "mid", className: "m-steel" }));
  const head = { x: X + 2, y: Y + 3, w: 26, d: 20, r: 2.6 };
  o.push(S(k.slabOf(head, 42, 26, P, 4, 0.9), { tone: "mid", className: "m-lcdcase" }));
  o.push(S(k.slabOf({ x: head.x - 0.6, y: head.y - 0.6, w: head.w + 1.2, d: head.d + 1.2, r: 2.8 }, 68, 2.4, P, 4, 0.6), { tone: "mid", className: "m-amber" }));
  const fy = head.y + head.d + 0.02;
  o.push(`<g transform="${front(fy)}"><path class="lcd" d="${rect(head.x + 4, 56, head.x + head.w - 4, 64)}"/><text data-r="lcd" class="lcd-t" x="${head.x + head.w / 2}" y="-58"></text>` +
    `<path class="sign" d="${rect(head.x + 5, 48.6, head.x + head.w - 5, 50)}"/></g>`);
  const tk = { x: head.x + 6, y: fy, w: head.w - 12, d: 22, r: 0.8 };
  o.push(S(k.slabOf(tk, 49, 0.5, P, 2), { tone: "mid", className: "m-ticket", crease: "none" }));
  o.push(`<g transform="${top(49.52)}"><text data-r="abono" class="tk-t" x="${tk.x + 1.6}" y="${tk.y + 20.4}">ABONO</text></g><g data-r="agujeros"></g>`);
  o.push(D(k.corners(head, 2).map(([x, y]) => at([x, y, 68])), { size: 0.4 }));
  return { svg: o.join(""), tk };
}
/* las piezas de una baldosa, en la casilla (0,0): la baldosa, el marco de hoy y una ficha por tipo */
function piezasMes() {
  const P = MP, C = MB.C, cx = C / 2, cy = C / 2, z = 2.6, S = (paths, o) => k.solidSvg(paths, o), L = (d, o) => k.lineSvg(d, o);
  const front = (y) => k.sideMatrix([0, y], 0, P, "left"), side = (x) => k.sideMatrix([x, 0], 0, P, "right"), top = (zz) => k.topMatrix([0, 0], zz, P, "x");
  const rect = (u0, z0, u1, z1) => `M${u0} ${-z1}H${u1}V${-z0}H${u0}Z`, T = {};
  T.baldosa = S(k.slabOf({ x: 0, y: 0, w: C, d: C, r: 2 }, 0, 2.6, P, 3, 0.6), { tone: "mid", className: "m-tile" });
  T.baldosaG = S(k.slabOf({ x: 0, y: 0, w: C, d: C, r: 2 }, 0, 2.6, P, 3, 0.6), { tone: "mid", className: "m-rojo" });
  T.num = `<g transform="${top(2.62)}"><text class="num __HOY__" x="2.2" y="${C - 2.2}">__N__</text></g>`;
  T.hoy = L(k.planOutline({ x: -1.6, y: -1.6, w: C + 3.2, d: C + 3.2, r: 2.6 }, 0.02, P), { className: "l-amber" });
  /* las mismas fichas que la casilla de Mes (design/calendario-propuestas/fichas.mjs): el tren rojo de la guardia,
     los dos autobuses, la casa con jardín del saliente y de las vacaciones, el árbol del libre */
  const F = fichasDe(P, C).T;
  T.guardia = F.guardia.replace("l-amber", "__ARO__"); T.trabajo = F.jornada; T.fuerza = F.fuerza; T.saliente = F.saliente; T.vac = F.vacaciones; T.libre = F.libre;
  return T;
}
/* el orden de pintado: de atrás adelante; la canceladora entra en su sitio */
const ORDEN_MES = (() => {
  const P = MP, items = [];
  for (let i = 0; i < 7 * MB.FILAS; i++) { const c = i % 7, f = Math.floor(i / 7); items.push({ i, d: k.depthOf([c * MB.PASO + MB.C / 2, f * MB.PASO + MB.C / 2, 0], P) }); }
  items.push({ i: -1, d: k.depthOf([VAL.X + 15, VAL.Y + 13, 0], P) });
  return items.sort((a, b) => a.d - b.d).map((x) => x.i);
})();
const MES_OFF = Array.from({ length: 7 * MB.FILAS }, (_, i) => k.translateAlong(MP, [(i % 7) * MB.PASO, Math.floor(i / 7) * MB.PASO, 0]));
const CANC = canceladora();
const HOLES = (() => { const out = []; for (let i = 0; i < 12; i++) out.push([CANC.tk.x + 3 + (i % 3) * 5, CANC.tk.y + 5 + Math.floor(i / 3) * 5]); return out; })();

const live = String.raw`
(function () {
  "use strict";
  __KIT__
  const SP = __SP__, SB = __SB__, MP = __MP__, MB = __MB__;
  const SEM = __SEM__, MES = __MES__, CSS = __CSS__, FAROL = __FAROL__, PZ = __PZ__, ORDEN = __ORDEN__, OFF = __OFF__, CANC = __CANC__, HOLES = __HOLES__;
  const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const css = () => { if (!document.getElementById("ci-css")) { const st = document.createElement("style"); st.id = "ci-css"; st.textContent = CSS; document.head.appendChild(st); } };
  const base = (svg, opts) => {
    css();
    const el = document.createElement("div"); el.className = "ci iso";
    el.innerHTML = svg + '<div class="ci-pie" data-r="pie"></div>';
    el.addEventListener("click", (ev) => { const g = ev.target.closest && ev.target.closest("[data-day]"); if (g && opts.onDia) opts.onDia(g.getAttribute("data-day")); });
    return el;
  };

  /* ---------- la cochera de la semana ---------- */
  function semana(opts) {
    opts = opts || {};
    const el = base(SEM, opts), P = SP, { BAY, X0, X1, XA, XB } = SB;
    const xh = (h) => XA + (Math.max(X0, Math.min(X1, h)) - X0) / (X1 - X0) * (XB - XA);
    const COLS = { work: "m-work", guard: "m-guard", meal: "m-meal", gym: "m-gym", plan: "m-plan" };
    const LV = { trabajo: "work", guardia: "guard", saliente: "guard", fuerza: "gym", libre: "libre" };
    const TIPO = { trabajo: "SERVICIO", guardia: "BÚHO ☾", saliente: "→COCHERA", fuerza: "SERVICIO", libre: "LIBRE" };
    function actualiza(D) {
      el.setAttribute("data-theme", D.claro ? "light" : "dark");
      const filas = (D.filas || []).slice(0, SB.N);
      el.querySelectorAll("[data-fila]").forEach((g, i) => {
        const d = filas[i], viva = g.querySelector("[data-viva]"), bus = g.querySelector("[data-bus]"), cartel = g.querySelector("[data-cartel]");
        if (!d) { viva.innerHTML = ""; bus.style.display = "none"; cartel.style.display = "none"; g.removeAttribute("data-day"); return; }
        bus.style.display = ""; cartel.style.display = ""; g.setAttribute("data-day", d.k);
        const y0 = i * BAY, yc = y0 + BAY / 2, o = [];
        (d.noches || []).forEach((n) => { const a = Math.max(n.a, X0), b = Math.min(n.b, X1); if (b - a < 0.2) return;
          o.push(solidSvg(slabOf({ x: xh(a), y: y0 + 4, w: xh(b) - xh(a), d: BAY - 8, r: 1 }, 0.6, 0.4, P, 2), { tone: "mid", className: "m-night", crease: "none", flat: true })); });
        (d.dia || []).filter((e) => (e.k === "work" || e.k === "guard") && (e.b - e.a >= 1 || e.ayer)).forEach((e) => {
          const a = Math.max(e.a, X0), b = Math.min(e.b, X1); if (b <= a) return;
          o.push(solidSvg(slabOf({ x: xh(a), y: yc - 4, w: xh(b) - xh(a), d: 8, r: 2 }, 0.6, 1.2, P, 3, 0.3), { tone: "mid", className: COLS[e.k] })); });
        (d.dia || []).filter((e) => e.k !== "work" && e.k !== "guard" && e.a >= X0 && e.a <= X1).sort((a, b) => a.a - b.a).forEach((e) => {
          const x = xh(e.a);
          o.push(solidSvg(cylinder(x, yc, 2.6, 0.6, 7, P, 20), { tone: "mid", className: COLS[e.k] || "m-plan", lit: !!e.h }));
          o.push(lineSvg(ring(x, yc, 1.6, 7.6, P, 16), { tone: "lo" })); });
        if (d.hoy) {
          o.push(lineSvg(onTop([[-86, y0 + 1.5], [410, y0 + 1.5], [410, y0 + BAY - 1.5], [-86, y0 + BAY - 1.5]], 0.64, P, true), { className: "l-amber" }));
          if (D.ahora != null) { const xn = xh(D.ahora);
            o.push(solidSvg(cylinder(xn, y0 + 5, 0.7, 0.6, 24, P, 8), { tone: "mid", className: "m-steel", crease: "none" }));
            o.push('<g transform="' + translateAlong(P, [xn, y0 + 5, 0]) + '">' + FAROL + "</g>");
            o.push(lineSvg(lineOnTop([xn, y0 + 3], [xn, y0 + BAY - 3], 0.66, P), { className: "l-amber" })); }
        }
        viva.innerHTML = o.join("");
        const tr = translateAlong(P, [0, y0, 0]);
        bus.innerHTML = '<g transform="' + tr + '"></g>';
        bus.removeAttribute("transform");
        bus.firstChild.innerHTML = SEMBUS.replace(/__LV__/g, LV[d.tipo] || "libre").replace("__LUNA__", d.tipo === "guardia" ? "inline" : "none")
          .replace("__HOY__", d.hoy ? "hoy" : "").replace("__NOM__", esc(DIAS[d.dow] + " " + d.dnum)).replace("__TIPO__", esc(TIPO[d.tipo] || ""));
        const t = cartel.querySelector('[data-r="sueno"]'), sn = d.sueno;
        t.textContent = sn ? String(sn.h).replace(".", ",") + " h" : (d.tipo === "guardia" ? "☾ guardia" : "—");
        t.setAttribute("class", "placa-t" + (sn && sn.h < D.obj ? " corta" : ""));
      });
      el.querySelector('[data-r="pie"]').innerHTML = D.pie || "";
    }
    return { el, actualiza };
  }
  const SEMBUS = __SEMBUS__;

  /* ---------- el tablero del mes ---------- */
  function mes(opts) {
    opts = opts || {};
    const el = base(MES, opts), capa = el.querySelector("[data-fichas]"), P = MP;
    function actualiza(D) {
      el.setAttribute("data-theme", D.claro ? "light" : "dark");
      const cel = D.celdas || [], o = [];
      for (const i of ORDEN) {
        if (i < 0) { o.push(CANC); continue; }
        const c = cel[i]; if (!c) continue;
        const ficha = (PZ[c.tipo] || PZ.libre).replace("__ARO__", c.g === "umi" ? "l-umi" : "l-amber");
        o.push('<g transform="' + OFF[i] + '" data-day="' + c.k + '"' + (c.fuera ? ' style="opacity:.45"' : "") + ">" + (c.tipo === "guardia" ? PZ.baldosaG : PZ.baldosa) +
          PZ.num.replace("__HOY__", c.hoy ? "hoy" : "").replace("__N__", c.d) + ficha + (c.hoy ? PZ.hoy : "") + "</g>");
      }
      capa.innerHTML = o.join("");
      const a = D.abono || {};
      const lcd = capa.querySelector('[data-r="lcd"]'); if (lcd) lcd.textContent = (a.h || 0) + " h";
      const ab = capa.querySelector('[data-r="abono"]'); if (ab) ab.textContent = "ABONO " + (a.mes || "");
      const ag = capa.querySelector('[data-r="agujeros"]');
      if (ag) ag.innerHTML = HOLES.slice(0, Math.min(12, a.cupo || 0)).map((h, j) => j < (a.hechas || 0) ? '<path class="hole" d="' + ring(h[0], h[1], 1.4, 49.53, P, 16) + '"/>' : lineSvg(ring(h[0], h[1], 1.4, 49.53, P, 16), { tone: "lo" })).join("");
      el.querySelector('[data-r="pie"]').innerHTML = D.pie || "";
    }
    return { el, actualiza };
  }
  window.CalIso = { semana, mes };
})();
`;
const js = `/* GENERADO por design/semana-mes-iso/app.mjs con el kit de /anatomy: no se edita a mano. */\n` + live
  .replace("__KIT__", () => kitScript())
  .replace("__SP__", () => JSON.stringify(SP)).replace("__SB__", () => JSON.stringify(SB)).replace("__MP__", () => JSON.stringify(MP)).replace("__MB__", () => JSON.stringify(MB))
  .replace("__SEM__", () => JSON.stringify(semanaEstatico())).replace("__MES__", () => JSON.stringify(mesEstatico())).replace("__CSS__", () => JSON.stringify(CSS))
  .replace("__FAROL__", () => JSON.stringify(SEM_FAROL)).replace("__PZ__", () => JSON.stringify(piezasMes())).replace("__ORDEN__", () => JSON.stringify(ORDEN_MES))
  .replace("__OFF__", () => JSON.stringify(MES_OFF)).replace("__CANC__", () => JSON.stringify(CANC.svg)).replace("__HOLES__", () => JSON.stringify(HOLES))
  .replace("__SEMBUS__", () => JSON.stringify(semanaBus()));
writeFileSync(join(HERE, "../../fig/calendario-iso.js"), js);
console.log("fig/calendario-iso.js", Math.round(js.length / 1024), "KB");
