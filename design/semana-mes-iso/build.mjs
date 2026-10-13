/* Semana y Mes en isométrico (maquetas, kit de /anatomy), sobre las maquetas planas aprobadas.
   - Semana: «la cochera de la semana». Siete andenes, uno por día, con la misma escala de horas pintada
     en el suelo: el andén es la fila del tablón. En la entrada, el autobús del tipo de día con su
     letrero; por el andén, el servicio pintado en el suelo y las paradas como bolardos de colores; al
     fondo, la noche (suelo azul) y un cartel con las horas de sueño previstas. Hoy, con la raya de la
     hora y su farol.
   - Mes: «el tablero de fichas». Cada día es una baldosa con su ficha: búho de guardia, autobús rojo de
     jornada, flecha a la cochera el saliente, un árbol el libre y el autocar las vacaciones. Al lado,
     la canceladora con el abono del mes asomando, taladrado según las guardias hechas.
   Los datos son los de ejemplo de ../semana-mes-conductor/datos.json (sacados de la app).
   node build.mjs [--light] → semana(-light).html, mes(-light).html */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const DAT = JSON.parse(readFileSync(join(HERE, "../semana-mes-conductor/datos.json"), "utf8"));
const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const hm = (h) => { h = ((h % 24) + 24) % 24; const H = Math.floor(h), M = Math.round((h - H) * 60); return H + ":" + String(M).padStart(2, "0"); };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, f) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * f).toString(16).padStart(2, "0")).join("");
const mat = (sel, v) => `${sel}{${Object.entries(v).map(([a, b]) => `--anatomy-${a}:${b}`).join(";")}}`;
const tinte = (sel, c, dark) => mat(sel, dark
  ? { paper: c, "shade-0": mix(c, "#000000", 0.45), "shade-1": mix(c, "#000000", 0.35), "shade-2": mix(c, "#000000", 0.25), "shade-3": mix(c, "#000000", 0.15), top: mix(c, "#ffffff", 0.12), hi: mix(c, "#ffffff", 0.55), mid: mix(c, "#ffffff", 0.25), lo: mix(c, "#000000", 0.5), faint: mix(c, "#000000", 0.3) }
  : { paper: c, "shade-0": mix(c, "#000000", 0.22), "shade-1": mix(c, "#000000", 0.16), "shade-2": mix(c, "#000000", 0.1), "shade-3": mix(c, "#000000", 0.04), top: mix(c, "#ffffff", 0.3), hi: mix(c, "#000000", 0.6), mid: mix(c, "#000000", 0.35), lo: mix(c, "#000000", 0.18), faint: mix(c, "#000000", 0.08) });
/* los colores del conductor: jornada roja, guardia azul noche, comida verde, entreno violeta, planes turquesa */
const MATS = {
  base: ["#16223a", "#dfe7f2"], steel: ["#3a4a62", "#d4dde8"], concrete: ["#2c3647", "#e3e8ef"], bus: ["#c9d4e4", "#f7f9fc"], tyre: ["#151a22", "#3a404a"],
  work: ["#d9573f", "#ef7a63"], guard: ["#34467e", "#6f86c8"], meal: ["#2f9e6b", "#56c48f"], gym: ["#7a5cf0", "#9c86ff"], plan: ["#1fa6c4", "#4cc9e4"],
  night: ["#1b2547", "#aebce6"], libre: ["#56627a", "#c3cbd8"], vac: ["#e3a72f", "#f6c35a"], tile: ["#1d283c", "#eef2f7"], amber: ["#ffd66b", "#f2b929"],
  leaf: ["#3f8a4f", "#86c47a"], trunk: ["#5a3f2a", "#a07a58"], ticket: ["#f6c35a", "#f6c35a"], moon: ["#e9eef5", "#ffffff"], lcdcase: ["#0e1626", "#26334a"],
};
const CSS_COMUN = [
  mat(".iso", { page: "#070b14", card: "#111a2b", paper: "#111a2b", text: "#8fa6c6", strong: "#e9f2ff", muted: "#5d7394", halo: "#02040a" }),
  mat(".iso[data-theme=light]", { page: "#f4f7fb", card: "#ffffff", paper: "#ffffff", text: "#4a5d78", strong: "#0d1726", muted: "#8a9ab2", halo: "#5c6f8c" }),
  ...Object.entries(MATS).flatMap(([n, [d, l]]) => [tinte(".m-" + n, d, true), tinte("[data-theme=light] .m-" + n, l, false)]),
  ".glass{fill:#0a1220}[data-theme=light] .glass{fill:#22324a}.sign{fill:#05080e}.sign-t{fill:#e9f2ff;font:800 6px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.04em}",
  ".hoy .sign-t{fill:#ffd66b}.sign-n{fill:#8fa6c6;font:700 4.4px/1 ui-monospace,Menlo,monospace}",
  ".l-amber{stroke:#ffd66b!important;stroke-width:1.1px}.l-paint{stroke:#8fa6c6!important;stroke-opacity:.5}[data-theme=light] .l-paint{stroke:#6a7c96!important}",
  ".hora{fill:#8fa6c6;font:800 7px/1 ui-monospace,Menlo,monospace;text-anchor:middle}[data-theme=light] .hora{fill:#4a5d78}",
  ".placa{fill:#05080e}.placa-t{fill:#7fecff;font:700 5.6px/1 ui-monospace,Menlo,monospace;text-anchor:middle}.placa-t.corta{fill:#ffd66b}",
  ".num{fill:#8fa6c6;font:800 7.4px/1 ui-sans-serif,system-ui,sans-serif}.num.hoy{fill:#ffd66b}[data-theme=light] .num{fill:#4a5d78}",
  ".tk-t{fill:#3b2a05;font:800 4.6px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em}.hole{fill:#070b14}[data-theme=light] .hole{fill:#8a9ab2}",
  ".lcd{fill:#04131a}.lcd-t{fill:#7fecff;font:700 6px/1 ui-monospace,Menlo,monospace;text-anchor:middle}",
  "[data-day]{cursor:pointer}[data-day]:hover .iso-fill{filter:brightness(1.15)}",
  ".iso-page{width:min(660px,100% - 16px)!important}",
].join("");

/* ====================== SEMANA: la cochera de la semana ====================== */
function semana() {
  const BAY = 46, X0 = 6, X1 = 26, XA = 20, XB = 400, xh = (h) => XA + (Math.max(X0, Math.min(X1, h)) - X0) / (X1 - X0) * (XB - XA);
  const dias = DAT.sem.slice(1), N = dias.length, HOY = "2026-10-14", AHORA = 10.4;
  const PLATE = { x: -96, y: -10, w: 520, d: N * BAY + 34, r: 6 };
  const P = k.fitProjection([...k.boxCorners(PLATE, -12, 0), ...k.boxCorners({ x: -96, y: -10, w: 520, d: 10 }, 0, 40)], 600, 420, { pad: 12, azimuth: 66, elevation: 44 });
  const at = (p) => k.iso(p, P), S = (paths, o) => k.solidSvg(paths, o), L = (d, o) => k.lineSvg(d, o), D = (p, o) => k.dotsSvg(p, o);
  const front = (y) => k.sideMatrix([0, y], 0, P, "left"), top = (z) => k.topMatrix([0, 0], z, P, "x");
  const rect = (u0, z0, u1, z1) => `M${u0} ${-z1}H${u1}V${-z0}H${u0}Z`;
  const out = [];
  /* la peana con sus patas, la escala grabada y los tornillos */
  out.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -12, 8, P)}"/>`);
  for (const [x, y] of k.corners(PLATE, 14).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P)))
    out.push(S(k.cylinder(x, y, 5, -12, 4, P, 24), { tone: "lo", className: "m-steel" }));
  out.push(S(k.slabOf(PLATE, -8, 8, P, 8, 1.4), { tone: "mid", className: "m-base" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4), 0, P), { tone: "lo" }));
  out.push(D(k.corners(PLATE, 8).map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  /* el muro del fondo de la cochera con sus pilares, detrás de los autobuses */
  out.push(S(k.slabOf({ x: -94, y: -8, w: 6, d: N * BAY + 4, r: 0.5 }, 0, 34, P, 2, 0.4), { tone: "mid", className: "m-concrete" }));
  for (let i = 0; i <= N; i++) out.push(S(k.slabOf({ x: -90, y: i * BAY - 3, w: 5, d: 4, r: 0.4 }, 0, 36, P, 2, 0.3), { tone: "mid", className: "m-steel" }));
  /* el suelo de los andenes: líneas divisorias, la cuadrícula de horas y los números pintados */
  out.push(S(k.slabOf({ x: -88, y: -2, w: 500, d: N * BAY + 4, r: 0.5 }, 0, 0.6, P, 2), { tone: "mid", className: "m-concrete", crease: "none", flat: true }));
  const lin = [];
  for (let i = 0; i <= N; i++) lin.push(k.lineOnTop([-86, i * BAY], [410, i * BAY], 0.62, P));
  out.push(L(lin.join(""), { className: "l-paint" }));
  const grid = [];
  for (let h = 6; h <= 26; h += 3) grid.push(k.lineOnTop([xh(h), 2], [xh(h), N * BAY - 2], 0.62, P));
  out.push(L(grid.join(""), { tone: "faint", dashed: true }));
  /* la regla delante, con su escala de hora en hora */
  const reg = { x: XA - 6, y: N * BAY + 6, w: XB - XA + 12, d: 12, r: 0.8 };
  out.push(S(k.slabOf(reg, 0, 2.4, P, 3, 0.5), { tone: "mid", className: "m-steel" }));
  const tk = [];
  for (let h = 6; h <= 26; h++) tk.push(k.lineOnTop([xh(h), reg.y + 0.6], [xh(h), reg.y + (h % 6 === 0 ? 5 : 3)], 2.42, P));
  out.push(L(tk.join(""), { tone: "lo" }));
  out.push(`<g transform="${top(2.45)}">${[6, 12, 18, 24].map((h) => `<text class="hora" x="${xh(h)}" y="${reg.y + 10}">${h === 24 ? 0 : h}</text>`).join("")}</g>`);
  /* los siete andenes, del fondo hacia delante */
  const COLS = { work: "m-work", guard: "m-guard", meal: "m-meal", gym: "m-gym", plan: "m-plan" };
  dias.forEach((d, i) => {
    const y0 = i * BAY, yc = y0 + BAY / 2, hoy = d.k === HOY, o = [];
    o.push(`<g data-day="${d.k}">`);
    /* la noche: suelo azul desde que te acuestas, y la mañana hasta que te levantas */
    d.noches.forEach((n) => { const a = Math.max(n.a, X0), b = Math.min(n.b, X1); if (b - a < 0.2) return;
      o.push(S(k.slabOf({ x: xh(a), y: y0 + 4, w: xh(b) - xh(a), d: BAY - 8, r: 1 }, 0.6, 0.4, P, 2), { tone: "mid", className: "m-night", crease: "none", flat: true })); });
    /* el servicio pintado en el suelo: la jornada roja, la guardia azul */
    d.dia.filter((e) => (e.k === "work" || e.k === "guard") && (e.b - e.a >= 1 || e.ayer)).forEach((e) => {
      const a = Math.max(e.a, X0), b = Math.min(e.b, X1); if (b <= a) return;
      o.push(S(k.slabOf({ x: xh(a), y: yc - 4, w: xh(b) - xh(a), d: 8, r: 2 }, 0.6, 1.2, P, 3, 0.3), { tone: "mid", className: COLS[e.k] }));
    });
    /* las paradas: bolardos de colores a su hora (los hechos con la tapa encendida) */
    d.dia.filter((e) => e.k !== "work" && e.k !== "guard" && e.a >= X0 && e.a <= X1).sort((a, b) => a.a - b.a).forEach((e) => {
      const x = xh(e.a), hecho = hoy && e.b < AHORA;
      o.push(S(k.cylinder(x, yc, 2.6, 0.6, 7, P, 20), { tone: "mid", className: COLS[e.k] || "m-plan", lit: hecho }));
      o.push(L(k.ring(x, yc, 1.6, 7.6, P, 16), { tone: "lo" }));
    });
    /* el cartel del sueño, al fondo del andén, de cara a quien mira */
    const sn = d.sueno, xs = 404;
    o.push(S(k.cylinder(xs, yc - 6, 0.8, 0.6, 12, P, 8), { tone: "mid", className: "m-steel", crease: "none" }));
    o.push(S(k.slabOf({ x: xs - 9, y: yc - 7, w: 18, d: 1.4, r: 0.3 }, 12.6, 7, P, 2, 0.3), { tone: "mid", className: "m-steel" }));
    o.push(`<g transform="${front(yc - 5.58)}"><path class="placa" d="${rect(xs - 8, 13.2, xs + 8, 19)}"/><text class="placa-t${sn && sn.h < DAT.obj ? " corta" : ""}" x="${xs}" y="-14.4">${sn ? String(sn.h).replace(".", ",") + " h" : "☾ guardia"}</text></g>`);
    /* el autobús del día en la entrada: librea por tipo de día y su letrero con el día */
    const lv = { trabajo: "m-work", guardia: "m-guard", saliente: "m-guard", fuerza: "m-gym", libre: "m-libre" }[d.tipo] || "m-libre";
    const B = { x: -80, y: yc - 8, w: 56, d: 16, r: 2.4 };
    o.push(`<path class="iso-halo" d="${k.haloOf(B, 0, 0.3, P)}" style="filter:blur(2px)"/>`);
    o.push(S(k.slabOf(B, 2.6, 15, P, 4, 0.8), { tone: "mid", className: "m-bus" }));
    o.push(S(k.slabOf({ x: B.x + 1.4, y: B.y + 1.2, w: B.w - 2.8, d: B.d - 2.4, r: 2 }, 17.6, 1.2, P, 3, 0.4), { tone: "mid", className: lv }));
    if (d.tipo === "guardia") o.push(S(G.sphereOf([B.x + B.w - 10, yc, 21.2], 2.6, P), { tone: "hi", className: "m-moon" }));
    const nom = DIAS[d.dow] + " " + d.dnum, tipoTxt = { trabajo: "SERVICIO", guardia: "BÚHO ☾", saliente: "→COCHERA", fuerza: "SERVICIO", libre: "LIBRE" }[d.tipo] || "";
    o.push(`<g transform="${front(B.y + B.d + 0.02)}"${hoy ? ' class="hoy"' : ""}><path class="glass" d="${rect(B.x + 3, 8, B.x + B.w - 3, 11.4)}"/>` +
      `<path class="lvl" d="${rect(B.x + 1, 5, B.x + B.w - 1, 6.6)}" style="fill:var(--anatomy-paper)"/>` +
      `<path class="sign" d="${rect(B.x + 3, 12.2, B.x + B.w - 3, 17.2)}"/><text class="sign-t" x="${B.x + 4.6}" y="-13.4">${nom}</text>` +
      `<text class="sign-n" x="${B.x + B.w - 4.4}" y="-13.7" text-anchor="end">${tipoTxt}</text></g>`);
    for (const x of [B.x + 11, B.x + B.w - 11]) { const F = G.frameAlong([x, B.y + B.d - 1, 4.2], [0, 1, 0]);
      o.push(S(G.disc(0, 1.8, 4.2, F, P), { tone: "lo", className: "m-tyre" }), S(G.disc(1.8, 2.1, 2.2, F, P), { tone: "mid", className: "m-steel" })); }
    /* hoy: el andén enmarcado en ámbar y la raya de la hora con su farol */
    if (hoy) {
      o.push(L(k.onTop([[-86, y0 + 1.5], [410, y0 + 1.5], [410, y0 + BAY - 1.5], [-86, y0 + BAY - 1.5]], 0.64, P, true), { className: "l-amber" }));
      const xn = xh(AHORA);
      o.push(S(k.cylinder(xn, y0 + 5, 0.7, 0.6, 24, P, 8), { tone: "mid", className: "m-steel", crease: "none" }));
      o.push(S(G.sphereOf([xn, y0 + 5, 26], 2.4, P), { tone: "hi", className: "m-amber", lit: true }));
      o.push(L(k.lineOnTop([xn, y0 + 3], [xn, y0 + BAY - 3], 0.66, P), { className: "l-amber" }));
    }
    o.push("</g>");
    out.push(o.join(""));
  });
  return { P, svg: k.figureSvg({ width: 600, height: 420, label: "La semana como la cochera: siete andenes, uno por día, con la misma escala de horas. En la entrada de cada andén, el autobús del tipo de día; por el andén, el servicio pintado y las paradas como bolardos; al fondo, la noche y un cartel con las horas de sueño.", body: out }) };
}

/* ====================== MES: el tablero de fichas y la canceladora ====================== */
function mes() {
  const C = 30, GAP = 5, PASO = C + GAP, HOY = "2026-10-14";
  const celdas = DAT.mes.map((c, i) => ({ ...c, col: i % 7, fila: Math.floor(i / 7) }));
  const PLATE = { x: -12, y: -12, w: 7 * PASO + 92, d: 6 * PASO + 19, r: 6 };
  const P = k.fitProjection([...k.boxCorners(PLATE, -12, 0), ...k.boxCorners({ x: 7 * PASO + 34, y: 2 * PASO - 6, w: 50, d: 40 }, 0, 74)], 600, 400, { pad: 12, azimuth: 66, elevation: 46 });
  const at = (p) => k.iso(p, P), S = (paths, o) => k.solidSvg(paths, o), L = (d, o) => k.lineSvg(d, o), D = (p, o) => k.dotsSvg(p, o);
  const front = (y) => k.sideMatrix([0, y], 0, P, "left"), side = (x) => k.sideMatrix([x, 0], 0, P, "right"), top = (z) => k.topMatrix([0, 0], z, P, "x");
  const rect = (u0, z0, u1, z1) => `M${u0} ${-z1}H${u1}V${-z0}H${u0}Z`;
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -12, 8, P)}"/>`);
  for (const [x, y] of k.corners(PLATE, 14).sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P)))
    out.push(S(k.cylinder(x, y, 5, -12, 4, P, 24), { tone: "lo", className: "m-steel" }));
  out.push(S(k.slabOf(PLATE, -8, 8, P, 8, 1.4), { tone: "mid", className: "m-base" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4), 0, P), { tone: "lo" }));
  out.push(D(k.corners(PLATE, 8).map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  /* las baldosas de atrás adelante, cada una con su ficha */
  const orden = celdas.slice().sort((a, b) => k.depthOf([a.col * PASO + C / 2, a.fila * PASO + C / 2, 0], P) - k.depthOf([b.col * PASO + C / 2, b.fila * PASO + C / 2, 0], P));
  for (const c of orden) {
    const x = c.col * PASO, y = c.fila * PASO, cx = x + C / 2, cy = y + C / 2, hoy = c.k === HOY, oct = c.m === 9, o = [];
    o.push(`<g data-day="${c.k}" data-txt="${c.d} · ${c.tipo}${c.g ? " " + c.g.toUpperCase() : ""}${c.sv ? " · " + c.sv : ""}"${oct ? "" : ' style="opacity:.45"'}>`);
    const tono = { guardia: "m-guard", trabajo: "m-tile", saliente: "m-tile", libre: "m-tile", vac: "m-tile", fuerza: "m-tile" }[c.tipo];
    o.push(S(k.slabOf({ x, y, w: C, d: C, r: 2 }, 0, 2.6, P, 3, 0.6), { tone: "mid", className: tono }));
    o.push(`<g transform="${top(2.62)}"><text class="num${hoy ? " hoy" : ""}" x="${x + 2.2}" y="${y + C - 2.2}">${c.d}</text></g>`);
    const z = 2.6;
    if (c.tipo === "guardia") {
      /* el búho: una ficha alta azul con la luna en lo alto; URG en ámbar, UMI en violeta */
      o.push(S(k.cylinder(cx + 2, cy - 2, 8, z, 12, P, 28, 0.8), { tone: "mid", className: "m-guard" }));
      o.push(S(G.sphereOf([cx + 2, cy - 2, z + 15], 3.6, P), { tone: "hi", className: "m-moon" }));
      o.push(L(k.ring(cx + 2, cy - 2, 6, z + 12, P, 28), { className: c.g === "umi" ? "l-umi" : "l-amber" }));
    } else if (c.tipo === "trabajo" || c.tipo === "fuerza") {
      /* el autobús rojo de jornada (violeta el día de fuerza) */
      const B = { x: x + 5, y: cy - 6, w: 21, d: 9, r: 1.6 };
      o.push(S(k.slabOf(B, z + 1.2, 9, P, 3, 0.5), { tone: "mid", className: "m-bus" }));
      o.push(S(k.slabOf({ x: B.x + 0.8, y: B.y + 0.7, w: B.w - 1.6, d: B.d - 1.4, r: 1.2 }, z + 10.2, 0.8, P, 3, 0.3), { tone: "mid", className: c.tipo === "fuerza" ? "m-gym" : "m-work" }));
      o.push(`<g transform="${front(B.y + B.d + 0.02)}"><path class="glass" d="${rect(B.x + 1.6, z + 5.4, B.x + B.w - 1.6, z + 8.6)}"/></g>`);
      for (const wx of [B.x + 4.4, B.x + B.w - 4.4]) { const F = G.frameAlong([wx, B.y + B.d - 0.6, z + 1.8], [0, 1, 0]); o.push(S(G.disc(0, 1, 1.8, F, P), { tone: "lo", className: "m-tyre" })); }
    } else if (c.tipo === "saliente") {
      /* vuelta a la cochera: una flecha en el suelo y la casita con su puerta */
      o.push(S(k.slabOf({ x: x + 4, y: cy - 1.4, w: 12, d: 2.8, r: 0.6 }, z, 0.6, P, 2), { tone: "mid", className: "m-guard" }));
      o.push(L(k.onTop([[x + 14, cy - 4], [x + 18.5, cy], [x + 14, cy + 4]], z + 0.6, P), { className: "l-sal" }));
      const g = { x: x + 19, y: cy - 6, w: 8, d: 12, r: 0.4 };
      o.push(S(k.slabOf(g, z, 9, P, 2, 0.3), { tone: "mid", className: "m-guard" }));
      o.push(`<g transform="${side(g.x + g.w + 0.02)}"><path class="glass" d="${rect(-(g.y + g.d) + 2.4, z, -g.y - 2.4, z + 6)}"/></g>`);
    } else if (c.tipo === "vac") {
      /* el autocar de excursión */
      const B = { x: x + 3.5, y: cy - 7, w: 24, d: 10, r: 2.4 };
      o.push(S(k.slabOf(B, z + 1.2, 10, P, 3, 0.6), { tone: "mid", className: "m-vac" }));
      o.push(`<g transform="${front(B.y + B.d + 0.02)}"><path class="glass" d="${rect(B.x + 1.6, z + 6, B.x + B.w - 1.6, z + 9.4)}"/></g>`);
    } else {
      /* libre: un árbol, como el bosque de Hoy */
      o.push(S(k.cylinder(cx + 2, cy - 2, 1.3, z, 6, P, 12), { tone: "mid", className: "m-trunk", crease: "none" }));
      o.push(S(G.sphereOf([cx + 2, cy - 2, z + 11.5], 6.4, P), { tone: "mid", className: "m-leaf" }));
    }
    if (hoy) o.push(L(k.planOutline({ x: x - 1.6, y: y - 1.6, w: C + 3.2, d: C + 3.2, r: 2.6 }, 0.02, P), { className: "l-amber" }));
    o.push("</g>");
    out.push(o.join(""));
  }
  /* la canceladora: pedestal, cabeza con la ranura y el abono asomando, taladrado por guardias */
  const X = 7 * PASO + 40, Y = 2 * PASO, hechas = DAT.oct.hechas, cupo = (DAT.cuota.urg || 0) + (DAT.cuota.umi || 0);
  out.push(S(k.slabOf({ x: X, y: Y, w: 30, d: 26, r: 2 }, 0, 4, P, 3, 0.6), { tone: "mid", className: "m-steel" }));
  out.push(S(k.slabOf({ x: X + 9, y: Y + 8, w: 12, d: 10, r: 1.2 }, 4, 38, P, 3, 0.5), { tone: "mid", className: "m-steel" }));
  const head = { x: X + 2, y: Y + 3, w: 26, d: 20, r: 2.6 };
  out.push(S(k.slabOf(head, 42, 26, P, 4, 0.9), { tone: "mid", className: "m-lcdcase" }));
  out.push(S(k.slabOf({ x: head.x - 0.6, y: head.y - 0.6, w: head.w + 1.2, d: head.d + 1.2, r: 2.8 }, 68, 2.4, P, 4, 0.6), { tone: "mid", className: "m-amber" }));
  const fy = head.y + head.d + 0.02;
  out.push(`<g transform="${front(fy)}"><path class="lcd" d="${rect(head.x + 4, 56, head.x + head.w - 4, 64)}"/><text class="lcd-t" x="${head.x + head.w / 2}" y="-58">${DAT.oct.h} h</text>` +
    `<path class="sign" d="${rect(head.x + 5, 48.6, head.x + head.w - 5, 50)}"/></g>`);
  /* el abono: sale de la ranura hacia delante, con un agujero por guardia del cupo */
  const tk = { x: head.x + 6, y: fy, w: head.w - 12, d: 22, r: 0.8 };
  out.push(S(k.slabOf(tk, 49, 0.5, P, 2), { tone: "mid", className: "m-ticket", crease: "none" }));
  out.push(`<g transform="${top(49.52)}"><text class="tk-t" x="${tk.x + 1.6}" y="${tk.y + 20.4}">ABONO OCT</text></g>`);
  for (let i = 0; i < cupo; i++) {
    const hx = tk.x + 3 + (i % 3) * 5, hy = tk.y + 5 + Math.floor(i / 3) * 5;
    out.push(i < hechas ? `<path class="hole" d="${k.ring(hx, hy, 1.4, 49.53, P, 16)}"/>` : L(k.ring(hx, hy, 1.4, 49.53, P, 16), { tone: "lo" }));
  }
  out.push(D(k.corners(head, 2).map(([x, y]) => at([x, y, 68])), { size: 0.4 }));
  return { P, svg: k.figureSvg({ width: 600, height: 400, label: "El mes como un tablero de fichas: cada día una baldosa con su ficha (búho de guardia, autobús de jornada, flecha a la cochera el saliente, un árbol el libre, el autocar las vacaciones). Al lado, la canceladora con el abono del mes, taladrado según las guardias hechas.", body: out }) };
}

const live = `
const ro = document.querySelector("[data-readout]"), base = ro.textContent;
document.querySelectorAll("[data-day]").forEach((g) => g.addEventListener("pointerenter", () => { ro.textContent = g.getAttribute("data-txt") || g.getAttribute("data-day"); }));
document.querySelector(".iso-stage").addEventListener("pointerleave", () => { ro.textContent = base; });
document.querySelectorAll("[data-day]").forEach((g) => g.addEventListener("click", () => { ro.textContent = "abriría " + g.getAttribute("data-day"); }));`;

const CSS_MES = ".l-umi{stroke:#9c86ff!important;stroke-width:1px}.l-sal{stroke:#b9c7f3!important;stroke-width:1.1px}";
const pon = (nombre, fig, title, hint, readout, cap, keys, svg) => {
  const body = `<style>${CSS_COMUN}${CSS_MES}</style>` + k.plateHtml({ fig, title, hint, readout, keys, caption: cap, body: `<div class="iso-stage">${svg}</div>` });
  const page = k.pageHtml({ title, theme, body, script: live }).replace('<html lang="en">', '<html lang="es">');
  writeFileSync(join(HERE, nombre + (theme === "light" ? "-light" : "") + ".html"), page);
  console.log(nombre, Math.round(page.length / 1024), "KB");
};
const s = semana(), m = mes();
pon("semana", "Semana", "La cochera de la semana", "Toca un andén", "mié 14 → mar 20 oct", "La semana como la cochera donde se prepara el servicio: siete andenes con la misma escala de horas, así se comparan de un vistazo. Hoy va enmarcado en ámbar, con la raya de la hora.",
  [{ mark: "raised", label: "El autobús de cada día: rojo jornada, azul búho la guardia, gris fuera de servicio el libre" }, { mark: "flat", label: "Por el andén: el servicio pintado, las paradas como bolardos y la noche en azul" }, { mark: "lit", label: "Al fondo, el cartel con las horas de sueño (ámbar si no llegan a tu objetivo)" }], s.svg);
pon("mes", "Mes", "El tablero del mes", "Pasa por una baldosa", `${DAT.oct.hechas} de ${(DAT.cuota.urg || 0) + (DAT.cuota.umi || 0)} guardias · ${DAT.oct.h} h · ${DAT.oct.findes} findes libres`, "Cada día, una ficha: búho la guardia, autobús la jornada, flecha a la cochera el saliente, árbol el libre y autocar las vacaciones. La canceladora taladra el abono con cada guardia hecha.",
  [{ mark: "raised", label: "Las fichas: lo que te toca ese día" }, { mark: "lit", label: "La canceladora: el abono del mes, un agujero por guardia hecha" }], m.svg);
