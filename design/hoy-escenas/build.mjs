/* La hoja de escenas del rediseño de Hoy (tanda 2, maquetas): lo que el conductor hace a cada hora, dibujado
   con el kit de /anatomy como objetos de verdad. La casa por dentro (cama con el móvil, ducha, cafetera, perchero,
   escritorio, sofá con la play), la parada con el taxi detrás, la cabina con las manos y el cartel de la rotación,
   el manillar de la bici, el parque de calistenia y la regleta de la mañana («llegar a las 8 es salir a las 7:31»).
   node build.mjs → escenas.html y escenas-light.html (390 px de ancho, el móvil) */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { CSS, tinte, rect } from "../calendario-propuestas/comun.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const S = (paths, o) => k.solidSvg(paths, o), L = (d, o) => k.lineSvg(d, o), D = (p, o) => k.dotsSvg(p, o);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
/* los materiales de la casa, encima de los del calendario */
const EXTRA = { skin: ["#e3b08e", "#f0c7ab"], uni: ["#2f5fb3", "#4a7fd6"], gorra: ["#1d3a73", "#2d4f94"], wood: ["#8a5a3a", "#b07a52"], cloth: ["#5c79c9", "#8fa8e6"],
  white: ["#e6ebf2", "#ffffff"], pillow: ["#f2f4f8", "#ffffff"], tile: ["#c9d6e4", "#e6edf5"], wall: ["#2a3650", "#eef1f6"], floor: ["#3a2f27", "#d9c3a5"], part: ["#33415e", "#e3e8f0"],
  taxi: ["#f2cf3a", "#f7dc5a"], taxit: ["#1a2236", "#2a3448"], rubber: ["#2a3340", "#8a94a0"], bar: ["#9aa6b8", "#d4dde8"], screen: ["#0d1726", "#0d1726"], play: ["#1b2236", "#2a3448"],
  lamp: ["#ffe7a6", "#ffe7a6"], phone: ["#9fd8ff", "#9fd8ff"], asphalt: ["#262c38", "#9aa3b2"], kerb: ["#8a94a4", "#d9dee6"], grass: ["#3f8a4f", "#7fc46e"], post: ["#6f7b8c", "#b9c3cf"], glassy: ["#8fd3ff", "#bfe7ff"] };
const CSS2 = CSS + Object.entries(EXTRA).map(([n, [d, l]]) => tinte(".m-" + n, d, true) + tinte("[data-theme=light] .m-" + n, l, false)).join("") +
  `.glass{fill:#0a1220;fill-opacity:.85}[data-theme=light] .glass{fill:#22324a;fill-opacity:.8}.vidrio{fill:#9fd3ff;fill-opacity:.22;stroke:#bfe7ff;stroke-width:.5}
   .vapor{fill:#e6ebf2;fill-opacity:.35}[data-theme=light] .vapor{fill:#8a9ab2;fill-opacity:.3}.luz{fill:#ffe7a6;fill-opacity:.35}.luzm{fill:#9fd8ff;fill-opacity:.45}
   .tx{font:700 4.2px ui-sans-serif,system-ui,sans-serif;fill:#e9f2ff}[data-theme=light] .tx{fill:#0d1726}.tx.s{font-size:3.2px;font-weight:600;fill:#8fa6c6}[data-theme=light] .tx.s{fill:#4a5d78}
   .tx.k{fill:#0d1726}.tx.y{fill:#ffd66b}.tx.g{fill:#7fe0a8}.pant{fill:#0d1726}.pant.on{fill:#1a2a44}
   .cab{font:800 9px ui-sans-serif,system-ui,sans-serif;fill:#e9f2ff}.cab.s{font-size:7px;font-weight:700;fill:#8fa6c6}.cab.y{fill:#ffd66b}.cab.k{fill:#0d1726}
   .ab{width:390px;margin:0 auto 14px}.ab .iso-plate{padding:0}.ab figcaption{font:600 12px/1.45 ui-sans-serif,system-ui;color:var(--anatomy-text);margin:6px 2px 0}.ab figcaption b{color:var(--anatomy-strong)}
   h1{font-size:20px;color:var(--anatomy-strong);margin:0 0 4px}h2{font-size:15px;color:var(--anatomy-strong);margin:18px 0 8px}p{max-width:390px;margin:0 auto 10px}
   .fila{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.fila .ab{width:188px;margin:0}.fila .ab figcaption{font-size:11px}`;

/* ---------- la figura: cabeza, gorra, torso, piernas; de pie, tumbado, sentado, colgado ---------- */
function persona(P, [x, y, z], pose, mirando) {
  const o = [], d = mirando || [0, 1];
  const H = 3.2;   /* el radio de la cabeza */
  if (pose === "tumbado") {   /* a lo largo de x, la cabeza a la izquierda */
    o.push(S(k.slabOf({ x: x, y: y - 3, w: 10, d: 6, r: 1.4 }, z, 3.4, P, 3, 0.6), { tone: "mid", className: "m-uni" }));
    o.push(S(k.slabOf({ x: x + 10, y: y - 2.4, w: 9, d: 4.8, r: 1.2 }, z, 2.8, P, 3, 0.5), { tone: "mid", className: "m-cloth" }));
    o.push(S(G.sphereOf([x - 2.4, y, z + 2.4], H, P, { steps: 24 }), { tone: "hi", className: "m-skin" }));
    return o.join("");
  }
  if (pose === "sentado") {
    o.push(S(k.slabOf({ x: x - 3, y: y - 2.6, w: 6, d: 5.2, r: 1.2 }, z, 9, P, 3, 0.6), { tone: "mid", className: "m-uni" }));
    o.push(S(k.slabOf({ x: x - 3, y: y + 2.4, w: 6, d: 6, r: 1 }, z, 3, P, 3, 0.5), { tone: "mid", className: "m-gorra" }));   /* los muslos hacia delante */
    o.push(S(G.sphereOf([x, y, z + 9 + H], H, P, { steps: 24 }), { tone: "hi", className: "m-skin" }));
    o.push(S(k.cylinder(x, y, H + 0.3, z + 9 + H + 1.2, 1.2, P, 16), { tone: "mid", className: "m-gorra" }));
    return o.join("");
  }
  if (pose === "colgado") {   /* bajo la barra: brazos arriba, pies en el aire */
    for (const dx of [-1.4, 1.4]) o.push(S(k.slabOf({ x: x + dx - 1.1, y: y - 1.1, w: 2.2, d: 2.2, r: 0.6 }, z, 8, P, 2, 0.3), { tone: "mid", className: "m-gorra" }));
    o.push(S(k.slabOf({ x: x - 3, y: y - 2.4, w: 6, d: 4.8, r: 1.2 }, z + 8, 10, P, 3, 0.6), { tone: "mid", className: "m-uni" }));
    o.push(S(G.sphereOf([x, y, z + 18 + H], H, P, { steps: 24 }), { tone: "hi", className: "m-skin" }));
    for (const dx of [-3.6, 3.6]) o.push(S(k.slabOf({ x: x + dx - 0.9, y: y - 0.9, w: 1.8, d: 1.8, r: 0.5 }, z + 16, 10, P, 2, 0.3), { tone: "mid", className: "m-skin" }));
    return o.join("");
  }
  /* de pie */
  for (const dx of [-1.6, 1.6]) o.push(S(k.slabOf({ x: x + dx - 1.2, y: y - 1.2, w: 2.4, d: 2.4, r: 0.6 }, z, 9, P, 2, 0.3), { tone: "mid", className: "m-gorra" }));
  o.push(S(k.slabOf({ x: x - 3.2, y: y - 2.4, w: 6.4, d: 4.8, r: 1.3 }, z + 9, 10.5, P, 3, 0.7), { tone: "mid", className: "m-uni" }));
  for (const dx of [-4.2, 4.2]) o.push(S(k.slabOf({ x: x + dx - 0.9, y: y - 0.9, w: 1.8, d: 1.8, r: 0.5 }, z + 10, 8.5, P, 2, 0.3), { tone: "mid", className: "m-uni" }));
  o.push(S(G.sphereOf([x, y, z + 19.5 + H], H, P, { steps: 24 }), { tone: "hi", className: "m-skin" }));
  o.push(S(k.cylinder(x, y, H + 0.3, z + 19.5 + H + 1.3, 1.2, P, 16), { tone: "mid", className: "m-gorra" }));
  o.push(S(k.slabOf({ x: x - 2.2 + d[0] * 2.5, y: y - 2.2 + d[1] * 2.5, w: 4.4, d: 4.4, r: 0.6 }, z + 19.5 + H + 1.2, 0.5, P, 2), { tone: "mid", className: "m-gorra" }));   /* la visera */
  return o.join("");
}

/* ---------- la casa por dentro: dos paredes de fondo, tabiques y las cosas de cada cuarto ---------- */
const CASA = { x: 0, y: 0, w: 132, d: 72, r: 0.5 }, WH = 34;
const PC = k.fitProjection([...k.boxCorners(CASA, 0, WH), [CASA.w, CASA.d, 0]], 390, 262, { pad: 10, azimuth: 52, elevation: 36 });
function casa(pose) {
  const P = PC, items = [], at = (p) => k.iso(p, P), add = (c, svg) => items.push({ d: k.depthOf(c, P), svg });
  const front = (y) => k.sideMatrix([0, y], 0, P, "left"), side = (x) => k.sideMatrix([x, 0], 0, P, "right"), top = (z) => k.topMatrix([0, 0], z, P, "x");
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: -6, y: -6, w: CASA.w + 12, d: CASA.d + 12, r: 4 }, -4, 2, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf({ x: -4, y: -4, w: CASA.w + 8, d: CASA.d + 8, r: 2 }, -4, 4, P, 3, 0.6), { tone: "lo", className: "m-base" }));   /* la peana */
  out.push(S(k.slabOf(CASA, 0, 1.2, P, 2, 0.2), { tone: "mid", className: "m-floor" }));
  /* las tablas del suelo */
  out.push(L(Array.from({ length: 10 }, (_, i) => k.onTop([[1, 7 * (i + 1)], [CASA.w - 1, 7 * (i + 1)]], 1.22, P)).join(""), { tone: "faint" }));
  /* la pared del fondo (y=0) y la del lado (x=0), con el zócalo; en ellas, la ventana y la puerta de la calle */
  out.push(S(k.slabOf({ x: 0, y: 0, w: CASA.w, d: 2, r: 0 }, 0, WH, P, 1), { tone: "mid", className: "m-wall" }));
  out.push(S(k.slabOf({ x: 0, y: 0, w: 2, d: CASA.d, r: 0 }, 0, WH, P, 1), { tone: "mid", className: "m-wall" }));
  out.push(`<g transform="${front(2.02)}"><path class="pant" d="${rect(2, 0, CASA.w - 2, 3)}" style="fill-opacity:.5"/>` +
    `<path class="vidrio" d="${rect(108, 14, 126, 28)}"/><path class="vidrio" d="${rect(76, 16, 90, 28)}"/></g>`);   /* las ventanas del salón y la cocina */
  out.push(`<g transform="${side(2.02)}"><path class="glass" d="${rect(-30, 0, -18, 24)}"/><path class="tx s" x="0" y="0"/></g>`);   /* la puerta de la calle, en la pared del lado */
  /* los tabiques (hasta y=44, dejan el pasillo delante) */
  for (const x of [44, 66, 96]) out.push(S(k.slabOf({ x: x - 1, y: 0, w: 2, d: 44, r: 0 }, 0, WH - 6, P, 1), { tone: "mid", className: "m-part" }));
  /* DORMITORIO: la cama, la mesilla con la lámpara y el móvil, el escritorio con el libro y la silla */
  const cama = () => { let o = S(k.slabOf({ x: 5, y: 8, w: 32, d: 18, r: 1 }, 0, 5, P, 3, 0.5), { tone: "mid", className: "m-wood" });
    o += S(k.slabOf({ x: 6, y: 9, w: 30, d: 16, r: 1.6 }, 5, 3, P, 3, 0.8), { tone: "mid", className: "m-white" });
    o += S(k.slabOf({ x: 7, y: 11, w: 7, d: 12, r: 1.4 }, 8, 2.2, P, 3, 0.9), { tone: "hi", className: "m-pillow" });
    o += S(k.slabOf({ x: 5, y: 8, w: 1.6, d: 18, r: 0.4 }, 0, 13, P, 2, 0.4), { tone: "mid", className: "m-wood" });   /* el cabecero */
    if (pose === "cama" || pose === "movil") o += persona(P, [14, 17, 8], "tumbado");
    else o += S(k.slabOf({ x: 15, y: 10, w: 20, d: 14, r: 1.4 }, 8, 1.6, P, 3, 0.6), { tone: "mid", className: "m-cloth" });   /* la manta doblada */
    if (pose === "movil") o += `<path class="luzm" d="${k.pathOf([at([9, 14, 12]), at([13, 10, 15]), at([19, 12, 15]), at([16, 18, 12])], true)}"/>`;
    return o; };
  add([21, 17, 4], cama());
  const mesilla = () => { let o = S(k.slabOf({ x: 38, y: 8, w: 6, d: 7, r: 0.6 }, 0, 9, P, 2, 0.4), { tone: "mid", className: "m-wood" });
    o += S(k.cylinder(41, 11, 1.6, 9, 1, P, 12), { tone: "lo", className: "m-steel" }) + S(k.cylinder(41, 11, 0.4, 10, 5, P, 8), { tone: "mid", className: "m-steel" });
    o += S(k.cylinder(41, 11, 2.4, 15, 3, P, 14, 0.4), { tone: "hi", className: "m-lamp" });
    o += S(k.slabOf({ x: 38.6, y: 12.4, w: 2.2, d: 1.2, r: 0.2 }, 9, 0.4, P, 1), { tone: "mid", className: pose === "movil" ? "m-phone" : "m-lcdcase", crease: "none" });   /* el móvil */
    return o; };
  add([41, 11, 5], mesilla());
  const escritorio = () => { let o = "";
    for (const [x, y] of [[6, 48], [28, 48], [6, 58], [28, 58]]) o += S(k.slabOf({ x: x - 0.8, y: y - 0.8, w: 1.6, d: 1.6, r: 0.3 }, 0, 12, P, 1), { tone: "lo", className: "m-wood", crease: "none" });
    o += S(k.slabOf({ x: 4, y: 46, w: 26, d: 14, r: 0.8 }, 12, 1.4, P, 3, 0.4), { tone: "mid", className: "m-wood" });
    o += S(k.slabOf({ x: 9, y: 50, w: 9, d: 7, r: 0.3 }, 13.4, 1.2, P, 2, 0.3), { tone: "hi", className: "m-white" });   /* el libro abierto */
    o += L(k.onTop([[13.5, 50.5], [13.5, 56.5]], 14.62, P), { tone: "faint" });
    o += S(k.cylinder(25, 49, 1.4, 13.4, 0.8, P, 12), { tone: "lo", className: "m-steel" }) + S(k.cylinder(25, 49, 0.35, 14, 7, P, 8), { tone: "mid", className: "m-steel" });
    o += S(k.cylinder(25, 49, 2.2, 21, 2.2, P, 14, 0.3), { tone: "hi", className: pose === "escritorio" ? "m-lamp" : "m-steel" });   /* el flexo */
    if (pose === "escritorio") o += `<path class="luz" d="${k.pathOf([at([25, 49, 21]), at([17, 47, 14.7]), at([28, 56, 14.7])], true)}"/>`;
    return o; };
  add([17, 53, 6], escritorio());
  const silla = () => { let o = S(k.slabOf({ x: 13, y: 62, w: 7, d: 7, r: 1 }, 7, 1.2, P, 2, 0.4), { tone: "mid", className: "m-wood" });
    o += S(k.slabOf({ x: 13, y: 68, w: 7, d: 1.2, r: 0.3 }, 7, 9, P, 2, 0.3), { tone: "mid", className: "m-wood" });
    o += S(k.cylinder(16.5, 65.5, 0.6, 0, 7, P, 8), { tone: "lo", className: "m-steel", crease: "none" });
    if (pose === "escritorio") o += persona(P, [16.5, 64, 8.2], "sentado");
    return o; };
  add([16.5, 65, 4], silla());
  /* BAÑO: el plato de ducha con la mampara, el grifo arriba, el vapor; el lavabo con el espejo; la toalla */
  const ducha = () => { let o = S(k.slabOf({ x: 47, y: 4, w: 17, d: 17, r: 1 }, 0, 1.6, P, 3, 0.4), { tone: "mid", className: "m-tile" });
    o += L(k.planOutline({ x: 48.5, y: 5.5, w: 14, d: 14, r: 0.6 }, 1.62, P), { tone: "faint" }) + D([at([55.5, 12.5, 1.62])], { size: 0.5, tone: "lo" });
    o += S(k.cylinder(63, 12.5, 0.5, 1.6, 26, P, 8), { tone: "mid", className: "m-steel", crease: "none" }) + S(k.slabOf({ x: 56, y: 12, w: 7, d: 1, r: 0.3 }, 26.5, 1, P, 1), { tone: "mid", className: "m-steel", crease: "none" });
    o += S(k.cylinder(56, 12.5, 2.2, 25.6, 0.8, P, 14), { tone: "hi", className: "m-steel" });   /* la alcachofa */
    if (pose === "ducha") { o += persona(P, [55.5, 12.5, 1.6], "de-pie", [0, 1]);
      for (const [cx, cy, r] of [[52, 9, 3], [58, 8, 2.4], [55, 15, 2.6], [60, 14, 2]]) o += `<circle class="vapor" cx="${at([cx, cy, 24]).map((v) => v.toFixed(1)).join('" cy="')}" r="${r}"/>`;
      o += L([54, 56, 58].map((x) => k.pathOf([at([x, 12.5, 24.5]), at([x, 12.5, 18])])).join(""), { tone: "faint", dashed: true }); }
    o += `<path class="vidrio" d="${k.pathOf([at([47, 21, 1.6]), at([64, 21, 1.6]), at([64, 21, 24]), at([47, 21, 24])], true)}"/>`;   /* la mampara */
    return o; };
  add([55, 12, 10], ducha());
  const lavabo = () => { let o = S(k.slabOf({ x: 48, y: 30, w: 14, d: 9, r: 0.8 }, 0, 13, P, 3, 0.5), { tone: "mid", className: "m-white" });
    o += S(k.slabOf({ x: 49.5, y: 31.5, w: 11, d: 6, r: 2 }, 13, 0.4, P, 4), { tone: "lo", className: "m-tile", crease: "none" }) + S(k.cylinder(55, 32.5, 0.5, 13, 3.5, P, 8), { tone: "hi", className: "m-steel", crease: "none" });
    o += S(k.slabOf({ x: 44, y: 30, w: 0.6, d: 9, r: 0 }, 18, 9, P, 1), { tone: "hi", className: "m-glassy", crease: "none" });   /* el espejo en el tabique */
    o += S(k.slabOf({ x: 44, y: 24, w: 1.4, d: 4, r: 0.3 }, 14, 7, P, 2, 0.3), { tone: "mid", className: "m-cloth" });   /* la toalla colgada */
    return o; };
  add([55, 34, 6], lavabo());
  /* COCINA: la encimera con la cafetera y la taza, la nevera, y el perchero con el uniforme */
  const cocina = () => { let o = S(k.slabOf({ x: 68, y: 4, w: 26, d: 12, r: 0.6 }, 0, 14, P, 3, 0.5), { tone: "mid", className: "m-wood" });
    o += S(k.slabOf({ x: 67.5, y: 3.5, w: 27, d: 13, r: 0.6 }, 14, 1.2, P, 3, 0.4), { tone: "hi", className: "m-steel" });
    o += L([[76, 4.5], [84, 4.5]].map(([x]) => k.pathOf([at([x, 4.5, 2]), at([x, 15.5, 2])])).join(""), { tone: "faint" });
    o += S(k.slabOf({ x: 70, y: 6, w: 7, d: 7, r: 1 }, 15.2, 9, P, 3, 0.8), { tone: "mid", className: "m-lcdcase" });   /* la cafetera */
    o += S(k.cylinder(73.5, 9.5, 2.4, 24.2, 1.2, P, 14, 0.3), { tone: "mid", className: "m-steel" });
    o += S(k.cylinder(80, 9.5, 1.8, 15.2, 2.6, P, 14), { tone: "hi", className: pose === "cafe" ? "m-lamp" : "m-white" });   /* la taza */
    if (pose === "cafe") { for (const [cx, cy, r] of [[80, 9.5, 1.3], [81, 8, 1]]) o += `<circle class="vapor" cx="${at([cx, cy, 20]).map((v) => v.toFixed(1)).join('" cy="')}" r="${r}"/>`; }
    o += S(k.slabOf({ x: 86, y: 6, w: 6, d: 7, r: 0.6 }, 15.2, 4, P, 2, 0.4), { tone: "mid", className: "m-white" });   /* el tostador */
    return o; };
  add([81, 10, 8], cocina());
  const nevera = () => S(k.slabOf({ x: 68, y: 20, w: 12, d: 12, r: 0.8 }, 0, 29, P, 3, 0.6), { tone: "hi", className: "m-white" }) +
    L(k.pathOf([at([80.02, 21, 18]), at([80.02, 31, 18])]) + k.pathOf([at([80.02, 29, 19.5]), at([80.02, 29, 26])]) + k.pathOf([at([80.02, 29, 8]), at([80.02, 29, 15])]), { tone: "faint" });
  add([74, 26, 14], nevera());
  const perchero = () => { let o = S(k.cylinder(90, 36, 3, 0, 0.8, P, 14), { tone: "lo", className: "m-steel" }) + S(k.cylinder(90, 36, 0.6, 0.8, 28, P, 8), { tone: "mid", className: "m-steel", crease: "none" });
    for (const a of [0, 1.6, 3.2, 4.8]) o += S(k.cylinder(90 + Math.cos(a) * 2.4, 36 + Math.sin(a) * 2.4, 0.4, 27.5, 1.6, P, 6), { tone: "hi", className: "m-steel", crease: "none" });
    if (pose !== "cafe" && pose !== "cama" && pose !== "movil") o += S(k.slabOf({ x: 86.5, y: 36, w: 7, d: 2.4, r: 0.8 }, 15, 12, P, 3, 0.8), { tone: "mid", className: "m-uni" });   /* la chaqueta del uniforme, salvo que la lleves */
    return o; };
  add([90, 36, 14], perchero());
  if (pose === "cafe") add([84, 20, 10], persona(P, [84, 21, 0], "de-pie", [0, -1]));
  /* SALÓN: el sofá, el mueble con la tele y la play, la alfombra */
  const alfombra = () => S(k.slabOf({ x: 100, y: 24, w: 28, d: 20, r: 2 }, 1.2, 0.5, P, 3), { tone: "mid", className: "m-cloth", crease: "none" }) + L(k.planOutline({ x: 102, y: 26, w: 24, d: 16, r: 1.4 }, 1.72, P), { tone: "faint" });
  add([114, 34, 1], alfombra());
  const mueble = () => { let o = S(k.slabOf({ x: 100, y: 4, w: 28, d: 9, r: 0.6 }, 0, 9, P, 3, 0.5), { tone: "mid", className: "m-wood" });
    o += S(k.slabOf({ x: 103, y: 7, w: 22, d: 1.6, r: 0.4 }, 9, 14, P, 2, 0.4), { tone: "lo", className: "m-lcdcase" });   /* la tele */
    o += `<g transform="${front(8.62)}"><path class="pant${pose === "play" ? " on" : ""}" d="${rect(104, 10, 124, 22)}"/>${pose === "play" ? `<path class="luz" d="${rect(106, 12, 122, 20)}" style="fill:#7fe0a8;fill-opacity:.5"/><text class="tx k" x="114" y="-16.6" text-anchor="middle" style="font-size:3px;fill:#0d1726">PLAY</text>` : ""}</g>`;
    o += S(k.slabOf({ x: 106, y: 9.5, w: 7, d: 3, r: 0.6 }, 9, 1.6, P, 3, 0.4), { tone: "mid", className: "m-play" });   /* la consola */
    o += D([at([112, 11, 10.65])], { size: 0.35, tone: pose === "play" ? "hi" : "lo" });
    return o; };
  add([114, 8, 8], mueble());
  const sofa = () => { let o = S(k.slabOf({ x: 100, y: 46, w: 28, d: 11, r: 1.6 }, 0, 7, P, 3, 0.9), { tone: "mid", className: "m-cloth" });
    o += S(k.slabOf({ x: 100, y: 55, w: 28, d: 3, r: 1.2 }, 7, 7, P, 3, 0.9), { tone: "mid", className: "m-cloth" });
    for (const x of [100, 125]) o += S(k.slabOf({ x, y: 46, w: 3, d: 12, r: 1 }, 7, 3, P, 3, 0.8), { tone: "mid", className: "m-cloth" });
    if (pose === "play") { o += persona(P, [113, 52, 7], "sentado"); o += S(k.slabOf({ x: 110, y: 56, w: 6, d: 2.4, r: 0.8 }, 15.5, 1.4, P, 3, 0.5), { tone: "mid", className: "m-play" }); }   /* el mando */
    return o; };
  add([114, 51, 5], sofa());
  items.sort((a, b) => a.d - b.d).forEach((i) => out.push(i.svg));
  const NOM = { movil: "con el móvil en la cama", cama: "durmiendo", ducha: "en la ducha", cafe: "café y desayuno", escritorio: "estudiando", play: "en el salón, con la play" };
  return k.figureSvg({ width: 390, height: 262, label: "La casa por dentro: " + NOM[pose], body: out.join(""), className: "casa" });
}

/* ---------- la parada: la acera, el poste con el horario y el reloj, la marquesina, el banco, tú esperando y el taxi detrás ---------- */
function parada(taxi) {
  const W = { x: 0, y: 0, w: 130, d: 92 }, P = k.fitProjection([...k.boxCorners(W, 0, 40)], 390, 240, { pad: 8, azimuth: 48, elevation: 34 });
  const at = (p) => k.iso(p, P), front = (y) => k.sideMatrix([0, y], 0, P, "left"), side = (x) => k.sideMatrix([x, 0], 0, P, "right"), items = [], add = (c, svg) => items.push({ d: k.depthOf(c, P), svg });
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: -4, y: -4, w: W.w + 8, d: W.d + 8, r: 3 }, -4, 2, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf({ x: -4, y: -4, w: W.w + 8, d: W.d + 8, r: 2 }, -4, 4, P, 3, 0.6), { tone: "lo", className: "m-base" }));
  out.push(S(k.slabOf({ x: 0, y: 40, w: 130, d: 52, r: 0 }, 0, 0.8, P, 1), { tone: "mid", className: "m-asphalt" }));   /* la calzada */
  out.push(L(Array.from({ length: 7 }, (_, i) => k.onTop([[4 + i * 19, 66], [14 + i * 19, 66]], 0.82, P)).join(""), { tone: "hi" }));
  out.push(S(k.slabOf({ x: 0, y: 0, w: 130, d: 40, r: 0 }, 0, 3, P, 1, 0.3), { tone: "mid", className: "m-tile" }));   /* la acera */
  out.push(S(k.slabOf({ x: 0, y: 38.5, w: 130, d: 1.5, r: 0 }, 0, 3.2, P, 1), { tone: "hi", className: "m-kerb", crease: "none" }));
  out.push(L(Array.from({ length: 12 }, (_, i) => k.onTop([[10 * (i + 1), 1], [10 * (i + 1), 38]], 3.02, P)).join(""), { tone: "faint" }));
  /* el poste con el horario, el reloj arriba */
  const poste = () => { let o = S(k.cylinder(28, 30, 2.4, 3, 1, P, 14), { tone: "lo", className: "m-steel" }) + S(k.cylinder(28, 30, 0.9, 4, 36, P, 10), { tone: "mid", className: "m-post", crease: "none" });
    o += S(k.slabOf({ x: 22, y: 29.2, w: 12, d: 1.6, r: 0.4 }, 22, 12, P, 2, 0.4), { tone: "mid", className: "m-steel" });
    o += `<g transform="${front(30.82)}"><path class="pant" d="${rect(22.6, 22.6, 33.4, 33.4)}"/><text class="tx y" x="28" y="-30.4" text-anchor="middle" style="font-size:3.4px">L7</text><text class="tx" x="28" y="-26.2" text-anchor="middle" style="font-size:3.6px">7:35</text><text class="tx s" x="28" y="-23.4" text-anchor="middle" style="font-size:2.4px">último 7:37</text></g>`;
    o += S(k.cylinder(28, 30, 4.2, 40, 1.2, P, 20, 0.3), { tone: "hi", className: "m-white" });   /* el reloj, mirando arriba */
    o += L(k.ring(28, 30, 3.4, 41.22, P, 20) + k.onTop([[28, 30], [28, 27.2]], 41.24, P) + k.onTop([[28, 30], [30.2, 30.6]], 41.24, P), { tone: "lo" });
    return o; };
  add([28, 30, 20], poste());
  /* la marquesina: dos postes, el techo, el cristal de atrás, el banco */
  const marq = () => { let o = "";
    for (const x of [62, 112]) o += S(k.cylinder(x, 6, 1.1, 3, 30, P, 10), { tone: "mid", className: "m-post", crease: "none" });
    o += `<path class="vidrio" d="${k.pathOf([at([62, 6, 3]), at([112, 6, 3]), at([112, 6, 30]), at([62, 6, 30])], true)}"/>`;
    o += S(k.slabOf({ x: 58, y: 3, w: 58, d: 26, r: 1.2 }, 31, 2.2, P, 3, 0.6), { tone: "mid", className: "m-steel" });
    o += S(k.slabOf({ x: 66, y: 9, w: 42, d: 7, r: 0.8 }, 10, 1.6, P, 3, 0.4), { tone: "mid", className: "m-wood" });   /* el banco */
    for (const x of [68, 104]) o += S(k.slabOf({ x: x, y: 11, w: 1.6, d: 3, r: 0.3 }, 3, 7, P, 1), { tone: "lo", className: "m-steel", crease: "none" });
    return o; };
  add([87, 10, 15], marq());
  add([44, 20, 10], persona(P, [44, 22, 3], "de-pie", [0, 1]) + S(k.slabOf({ x: 40.6, y: 17.4, w: 6.8, d: 2.6, r: 1 }, 13, 9, P, 3, 0.8), { tone: "mid", className: "m-cloth" }));   /* tú, con la mochila */
  /* el taxi, parado en la calzada: carrocería, cabina, ruedas, luz del techo */
  if (taxi) { const tx = () => { const B = { x: 50, y: 50, w: 44, d: 18, r: 2 }; let o = `<path class="iso-halo" d="${k.haloOf(B, 0.8, 0.2, P)}" style="filter:blur(2px)"/>`;
      for (const x of [58, 86]) for (const y of [50.6, 67.4]) { const F = G.frameAlong([x, y, 4.6], [0, 1, 0]); o += S(G.disc(-1, 1, 4.2, F, P, { steps: 14 }), { tone: "lo", className: "m-tyre" }); }
      o += S(k.slabOf(B, 4, 8, P, 3, 1), { tone: "mid", className: "m-taxi" });
      o += S(k.slabOf({ x: 60, y: 51.5, w: 24, d: 15, r: 2.2 }, 12, 7, P, 3, 1.2), { tone: "mid", className: "m-taxi" });
      o += `<g transform="${front(68.02)}"><path class="glass" d="${rect(62, 13.2, 72, 18.2)}"/><path class="glass" d="${rect(73.5, 13.2, 82, 18.2)}"/><text class="tx k" x="72" y="-7.6" text-anchor="middle" style="font-size:3.6px;font-weight:800">TAXI</text><path class="pant" d="${rect(52, 6, 59, 10.5)}" style="fill:#0d1726"/></g>`;
      o += `<g transform="${side(94.02)}"><path class="glass" d="${rect(-66.5, 13, -51.5, 18)}"/></g>`;
      o += S(k.slabOf({ x: 68, y: 56, w: 8, d: 5, r: 1 }, 19, 2, P, 3, 0.6), { tone: "hi", className: "m-lamp" });   /* la luz del techo, libre */
      o += D([at([94.02, 53, 8]), at([94.02, 65, 8])], { size: 0.7, tone: "hi" });
      return o; };
    add([72, 59, 8], tx()); }
  items.sort((a, b) => a.d - b.d).forEach((i) => out.push(i.svg));
  return k.figureSvg({ width: 390, height: 240, label: "La parada: el poste con el horario (7:35, último 7:37), la marquesina, tú con la mochila" + (taxi ? " y el taxi detrás" : ""), body: out.join(""), className: "parada" });
}

/* ---------- el parque de calistenia: el suelo de caucho, la barra con el conductor colgado, el banco, el árbol ---------- */
function parque() {
  const W = { x: 0, y: 0, w: 110, d: 70, r: 1 }, P = k.fitProjection([...k.boxCorners(W, 0, 40)], 390, 220, { pad: 8, azimuth: 50, elevation: 34 });
  const at = (p) => k.iso(p, P), items = [], add = (c, svg) => items.push({ d: k.depthOf(c, P), svg });
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: -4, y: -4, w: W.w + 8, d: W.d + 8, r: 3 }, -4, 2, P)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf({ x: -4, y: -4, w: W.w + 8, d: W.d + 8, r: 2 }, -4, 4, P, 3, 0.6), { tone: "lo", className: "m-base" }));
  out.push(S(k.slabOf(W, 0, 1, P, 2, 0.2), { tone: "mid", className: "m-grass" }));
  out.push(S(k.slabOf({ x: 14, y: 12, w: 70, d: 46, r: 2 }, 1, 1.2, P, 3, 0.3), { tone: "mid", className: "m-rubber" }));
  out.push(L(Array.from({ length: 4 }, (_, i) => k.onTop([[16, 20 + i * 10], [82, 20 + i * 10]], 2.22, P)).join(""), { tone: "faint" }));
  const barra = () => { let o = "";
    for (const x of [30, 66]) o += S(k.cylinder(x, 34, 2.6, 2.2, 1, P, 14), { tone: "lo", className: "m-steel" }) + S(k.cylinder(x, 34, 1.3, 3.2, 30, P, 12), { tone: "mid", className: "m-bar", crease: "none" });
    const F = G.frameAlong([30, 34, 33], [1, 0, 0]); o += S(G.disc(0, 36, 1.1, F, P, { steps: 12 }), { tone: "hi", className: "m-bar" });
    o += persona(P, [48, 34, 12], "colgado");
    return o; };
  add([48, 34, 16], barra());
  const paralelas = () => { let o = "";
    for (const x of [22, 44]) for (const y of [50, 60]) o += S(k.cylinder(x, y, 0.9, 2.2, 14, P, 10), { tone: "mid", className: "m-bar", crease: "none" });
    for (const y of [50, 60]) { const F = G.frameAlong([22, y, 16], [1, 0, 0]); o += S(G.disc(0, 22, 0.9, F, P, { steps: 10 }), { tone: "hi", className: "m-bar" }); }
    return o; };
  add([33, 55, 8], paralelas());
  const banco = () => S(k.slabOf({ x: 60, y: 54, w: 20, d: 6, r: 0.8 }, 6, 1.4, P, 3, 0.4), { tone: "mid", className: "m-wood" }) + [62, 76].map((x) => S(k.slabOf({ x, y: 55.5, w: 1.6, d: 3, r: 0.3 }, 2.2, 3.8, P, 1), { tone: "lo", className: "m-steel", crease: "none" })).join("");
  add([70, 57, 4], banco());
  const arbol = () => S(k.cylinder(96, 16, 1.6, 1, 10, P, 12), { tone: "mid", className: "m-trunk", crease: "none" }) + S(G.sphereOf([96, 16, 16], 8, P, { steps: 28 }), { tone: "mid", className: "m-leaf" }) + S(G.sphereOf([101, 12, 13], 5, P, { steps: 24 }), { tone: "mid", className: "m-leaf" });
  add([96, 16, 10], arbol());
  const rack = () => { let o = S(k.slabOf({ x: 90, y: 40, w: 14, d: 5, r: 0.6 }, 1, 2, P, 2, 0.4), { tone: "mid", className: "m-steel" });
    for (const x of [93, 101]) { const F = G.frameAlong([x, 42.5, 4.4], [1, 0, 0]); o += S(G.disc(-2.6, 2.6, 0.5, F, P, { steps: 8 }), { tone: "mid", className: "m-steel" }); for (const s of [-2.4, 1.8]) o += S(G.disc(s, s + 0.6, 1.6, F, P, { steps: 10 }), { tone: "lo", className: "m-tyre" }); }
    return o; };
  add([97, 42, 3], rack());
  items.sort((a, b) => a.d - b.d).forEach((i) => out.push(i.svg));
  return k.figureSvg({ width: 390, height: 220, label: "El parque de calistenia: la barra con el conductor colgado, las paralelas, el banco y las mancuernas", body: out.join(""), className: "parque" });
}

/* ---------- la regleta de la mañana: una regla con los hitos clavados a su hora ---------- */
function regleta() {
  const W = { x: 0, y: 0, w: 300, d: 30, r: 2 }, P = k.fitProjection([...k.boxCorners(W, 0, 18)], 390, 118, { pad: 4, azimuth: 86, elevation: 48 });
  const at = (p) => k.iso(p, P), x0 = 10, x1 = 290, h0 = 6.5, h1 = 8.1, X = (h) => x0 + (x1 - x0) * (h - h0) / (h1 - h0);
  const out = [`<path class="iso-halo" d="${k.haloOf(W, -2, 2, P)}" style="filter:blur(2px)"/>`, S(k.slabOf(W, 0, 4, P, 3, 0.8), { tone: "mid", className: "m-steel" })];
  /* los ticks a mano: cada cuarto una raya, cada hora más larga, con la hora escrita */
  const t = [];
  for (let h = h0; h <= h1 + 1e-6; h += 1 / 12) { const q = Math.round(h * 12) % 3 === 0, hh = Math.round(h * 12) % 12 === 0; t.push(k.onTop([[X(h), 2], [X(h), hh ? 7 : q ? 5 : 3.5]], 4.02, P)); }
  out.push(L(t.join(""), { tone: "lo" }));
  const HIT = [[6.833, "6:50", "Levantarse", "cama"], [6.917, "6:55", "Ducha", "ducha"], [7.167, "7:10", "Café", "cafe"], [7.333, "7:20", "Vestirse", "vestir"], [7.517, "7:31", "Puerta", "parada"], [7.583, "7:35", "Bus", "bus"], [7.617, "7:37", "Último bus", "ultimo"], [8, "8:00", "Hospital", "cabina"]];
  const sweep = (a, b, cls) => `<path class="${cls}" d="${k.pathOf([at([X(a), 9, 4.02]), at([X(b), 9, 4.02]), at([X(b), 18, 4.02]), at([X(a), 18, 4.02])], true)}"/>`;
  out.push(sweep(7.517, 7.617, "luz") + sweep(7.617, 8, "luz").replace('class="luz"', 'class="luz" style="fill:#ff2b3a;fill-opacity:.22"'));
  HIT.forEach(([h, txt, nom, e], i) => { const x = X(h), ult = e === "ultimo";
    out.push(S(k.cylinder(x, 9, ult ? 1.1 : 1.6, 4, ult ? 5 : 8, P, 10), { tone: ult ? "lo" : "hi", className: ult ? "m-rojo" : e === "bus" ? "m-amber" : "m-steel" }));
    const q = at([x, 9, ult ? 10 : 13]); out.push(`<text class="tx${ult ? " y" : ""}" x="${q[0].toFixed(1)}" y="${(q[1] - 2.2).toFixed(1)}" text-anchor="middle" style="font-size:${ult ? 4.2 : 5}px">${txt}</text>`);
    const p = at([x, 26, 4.02]); out.push(`<text class="tx s" x="${p[0].toFixed(1)}" y="${(p[1] + (i % 2 ? 9 : 4.2)).toFixed(1)}" text-anchor="middle" style="font-size:4.2px">${esc(nom)}</text>`); });
  return k.figureSvg({ width: 390, height: 118, label: "La regleta de la mañana: levantarse 6:50, ducha 6:55, café 7:10, vestirse 7:20, puerta 7:31, bus 7:35, último bus 7:37, hospital 8:00", body: out.join(""), className: "regleta" });
}

/* ---------- la cabina y el manillar, en primera persona (el estilo del conductor, no isométrico) ---------- */
function fondoCalle(w, h, claro) {
  const sky = claro ? ["#9fd0ff", "#dff0ff"] : ["#1a2a4e", "#5a93d6"], road = claro ? "#8a94a4" : "#2b3140";
  return `<defs><linearGradient id="g_sky_${claro ? "l" : "d"}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>` +
    `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#g_sky_${claro ? "l" : "d"})"/>` +
    `<path d="M0 ${h * 0.56}H${w}V${h}H0Z" fill="${claro ? "#cfd8e4" : "#1c2230"}"/>` +
    `<path d="M${w * 0.42} ${h * 0.5}L${w * 0.58} ${h * 0.5}L${w * 0.98} ${h}H${w * 0.02}Z" fill="${road}"/>` +
    [[0.5, 0.56, 0.5, 0.6], [0.5, 0.64, 0.5, 0.7], [0.5, 0.76, 0.5, 0.86]].map(([a, b, c, d]) => `<path d="M${w * a} ${h * b}L${w * c} ${h * d}" stroke="#e9f2e4" stroke-width="2.2" stroke-linecap="round"/>`).join("") +
    [[0.04, 0.22, 0.14, 0.34], [0.2, 0.3, 0.1, 0.26], [0.7, 0.3, 0.1, 0.26], [0.84, 0.2, 0.14, 0.36]].map(([x, y, bw, bh]) => `<rect x="${w * x}" y="${h * y}" width="${w * bw}" height="${h * bh}" rx="2" fill="${claro ? "#aeb9c9" : "#2e3a52"}"/>` +
      Array.from({ length: 6 }, (_, i) => `<rect x="${w * x + 4 + (i % 3) * (w * bw / 3)}" y="${h * y + 6 + Math.floor(i / 3) * 16}" width="6" height="8" fill="${claro ? "#5d7394" : "#8fb0ff"}" fill-opacity=".8"/>`).join("")).join("");
}
function cabina(claro) {
  const w = 390, h = 250, o = [fondoCalle(w, h, claro)];
  const ink = claro ? "#dbe4f3" : "#0d1726", ink2 = claro ? "#aab6c8" : "#1b2a4a", txt = claro ? "#0d1726" : "#e9f2ff";
  /* el marco del parabrisas y el salpicadero */
  o.push(`<path d="M0 0H${w}V${h}H0Z M30 26 Q195 14 360 26 L372 184 Q195 198 18 184 Z" fill="${ink}" fill-rule="evenodd"/>`);
  o.push(`<path d="M0 184 Q195 206 390 184 V250 H0Z" fill="${ink}"/><path d="M40 192 Q195 212 350 192 L344 214 Q195 232 46 214Z" fill="${ink2}"/>`);
  /* el cartel de la rotación, en el salpicadero: RAYOS */
  o.push(`<rect x="262" y="188" width="92" height="28" rx="5" fill="#0d1726" stroke="#ffd66b" stroke-width="1.2"/><text class="cab y" x="308" y="200" text-anchor="middle">📷 RAYOS</text><text class="cab s" x="308" y="211" text-anchor="middle">Radiología · 8–15</text>`);
  /* la radio con la sesión */
  o.push(`<rect x="36" y="188" width="92" height="28" rx="5" fill="#0d1726" stroke="#2a3448" stroke-width="1"/><text class="cab s" x="82" y="200" text-anchor="middle" style="fill:#7fe0a8">● 10:00 SESIÓN</text><text class="cab s" x="82" y="211" text-anchor="middle">general · 30 min</text>`);
  /* el volante y las manos, a las 10 y a las 2 */
  o.push(`<ellipse cx="195" cy="254" rx="88" ry="30" fill="none" stroke="${claro ? "#4a5d78" : "#2a3448"}" stroke-width="11"/><ellipse cx="195" cy="254" rx="88" ry="30" fill="none" stroke="${claro ? "#8fa6c6" : "#3d4a66"}" stroke-width="3"/>`);
  o.push(`<path d="M150 258 Q195 236 240 258" stroke="${claro ? "#4a5d78" : "#2a3448"}" stroke-width="9" fill="none"/>`);
  const mano = (x, y, lado) => `<g transform="translate(${x} ${y}) scale(${lado} 1)"><path d="M-16 0 Q-18 -14 -6 -16 L10 -16 Q20 -14 18 -4 L16 10 Q6 16 -8 12 Q-16 10 -16 0Z" fill="#e3b08e" stroke="#b07a52" stroke-width="1.2"/>` +
    `<path d="M-14 -4 Q-8 -8 -2 -4 M-10 2 Q-4 -2 2 2" stroke="#b07a52" stroke-width="1" fill="none"/><path d="M-18 10 Q-20 20 -8 22 L8 22 Q20 20 18 10" fill="#2f5fb3"/></g>`;
  o.push(mano(116, 236, 1) + mano(274, 236, -1));
  /* la hora y el letrero de arriba */
  o.push(`<rect x="150" y="30" width="90" height="16" rx="8" fill="#0d1726" stroke="#ffd66b"/><text class="cab y" x="195" y="42" text-anchor="middle" style="font-size:8px">11:20 · de servicio</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg cab-fig" viewBox="0 0 ${w} ${h}" role="img" aria-label="La cabina: las manos en el volante, el cartel de la rotación (Rayos) y la radio con la sesión">${o.join("")}</svg>`;
}
function bici(claro) {
  const w = 390, h = 250, o = [fondoCalle(w, h, claro)];
  const ink = claro ? "#4a5d78" : "#1b2436";
  /* el manillar: el tubo, los puños, el timbre, la cesta con la mochila */
  o.push(`<path d="M30 206 Q80 170 150 190 Q195 200 240 190 Q310 170 360 206" stroke="${ink}" stroke-width="12" fill="none" stroke-linecap="round"/>`);
  o.push(`<path d="M30 206 Q80 170 150 190 Q195 200 240 190 Q310 170 360 206" stroke="${claro ? "#8fa6c6" : "#3d4a66"}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
  o.push(`<rect x="22" y="196" width="40" height="18" rx="9" fill="#0d1726"/><rect x="328" y="196" width="40" height="18" rx="9" fill="#0d1726"/>`);   /* los puños */
  o.push(`<circle cx="238" cy="186" r="8" fill="#c9d4e4" stroke="#8fa6c6" stroke-width="1.5"/><circle cx="238" cy="186" r="2.5" fill="#8fa6c6"/>`);   /* el timbre */
  o.push(`<path d="M150 230 L240 230 L230 202 L160 202Z" fill="none" stroke="${ink}" stroke-width="3"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${160 + i * 17.5} 202 L${150 + i * 22.5} 230" stroke="${ink}" stroke-width="1.6"/>`).join("")}<path d="M150 230H240" stroke="${ink}" stroke-width="3"/>`);   /* la cesta */
  o.push(`<path d="M166 222 Q168 198 195 198 Q222 198 224 222Z" fill="#5c79c9"/>`);   /* la mochila dentro */
  o.push(`<path d="M195 196 L195 250" stroke="${ink}" stroke-width="10"/>`);   /* la potencia */
  o.push(`<rect x="150" y="30" width="90" height="16" rx="8" fill="#0d1726" stroke="#7fe0a8"/><text class="cab" x="195" y="42" text-anchor="middle" style="font-size:8px;fill:#7fe0a8">15:00 · a casa en bici</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg cab-fig" viewBox="0 0 ${w} ${h}" role="img" aria-label="La bici: el manillar con los puños, el timbre y la cesta con la mochila; la calle delante">${o.join("")}</svg>`;
}

/* ---------- la hoja ---------- */
for (const theme of ["dark", "light"]) {
  const claro = theme === "light";
  const fig = (svg, cap) => `<figure class="ab"><div class="iso-plate">${svg}</div><figcaption>${cap}</figcaption></figure>`;
  const body = `<h1>Hoy, por dentro: la hoja de escenas</h1>
  <p>Maquetas de la tanda 2. Lo que el conductor hace a cada hora, dibujado como objetos de verdad con el kit: la casa por dentro, la parada, la cabina, la bici y el parque. En la app lo moverá <code>estadoDe(día, hora)</code>, que ya existe.</p>
  <h2>1 · La casa por dentro (la cochera de siempre, con interior)</h2>
  ${fig(casa("movil"), "<b>22:10 · en la cama con el móvil.</b> Dormitorio, baño, cocina y salón con el pasillo delante. La lámpara de la mesilla y el móvil encendido; en el perchero no hay chaqueta porque la ropa de mañana ya está en la silla.")}
  <div class="fila">${fig(casa("cama"), "<b>23:00 · durmiendo.</b> Sin luz.")}${fig(casa("ducha"), "<b>6:55 · la ducha</b> (vapor y mampara).")}${fig(casa("cafe"), "<b>7:10 · el café</b> en la encimera.")}${fig(casa("escritorio"), "<b>17:00 · estudio</b> en el escritorio, flexo encendido.")}</div>
  ${fig(casa("play"), "<b>20:30 · el salón:</b> la tele encendida con la play y el mando en el sofá. Solo cuando no hay nada puesto a esa hora.")}
  <h2>2 · La parada, y el taxi</h2>
  ${fig(parada(true), "<b>7:31 · en la parada.</b> El poste dice la línea, tu bus (7:35) y el último que te vale (7:37); el reloj arriba. El taxi detrás <b>solo existe si el hábito «Taxi» está activo</b>: si lo quitas, desaparece.")}
  <h2>3 · La cabina y la bici (primera persona, como el conductor de ahora)</h2>
  ${fig(cabina(claro), "<b>De servicio:</b> las manos en el volante, el cartel de la rotación (📷 Rayos, del servicio del mes) y la radio con la sesión de las 10:00 sonando. Al acabar la sesión, el autobús vuelve a la jornada (arreglado en la tanda 0).")}
  ${fig(bici(claro), "<b>15:00 · a casa en bici:</b> el manillar en vez del volante, la mochila en la cesta.")}
  <h2>4 · El parque</h2>
  ${fig(parque(), "<b>17:30 · entrenando:</b> la barra con el conductor colgado, las paralelas, el banco y las mancuernas. Después, la segunda ducha del día.")}
  <h2>5 · La regleta de la mañana</h2>
  ${fig(regleta(), "<b>Por qué llegar a las 8 es salir a las 7:31:</b> levantarse 6:50, ducha, café, vestirse, puerta 7:31, bus 7:35, último bus 7:37 (en rojo lo que ya es taxi), hospital 8:00. Sale de tu hora de levantarte y de Ajustes → Ir y volver.")}`;
  writeFileSync(join(HERE, claro ? "escenas-light.html" : "escenas.html"), k.pageHtml({ title: "Hoy, por dentro: las escenas", theme, width: 420, body }).replace("</style>", CSS2 + "</style>"));
}
console.log("escenas.html y escenas-light.html");
