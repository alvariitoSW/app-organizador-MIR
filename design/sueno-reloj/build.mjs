/* El reloj de arena del sueño. Escribe design/sueno-reloj/reloj(-light).html (maqueta) y, con
   --app, fig/sueno(-light).html, que es lo que abre la app. node build.mjs [--light] [--t=29] [--app]
   La guardia llega en la dirección (#p=…) desde la app; sin ella, una guardia típica. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
import { kitScript } from "../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import * as M from "../sueno-figura/model.mjs";
import { reloj } from "./reloj.mjs";

const HERE = dirname(fileURLToPath(import.meta.url)), RAIZ = join(HERE, "..", "..");
const KIT = join(RAIZ, ".claude/skills/anatomy/kit");
const theme = process.argv.includes("--light") ? "light" : "dark";
const arg = process.argv.find((a) => a.startsWith("--t="));
const paraApp = process.argv.includes("--app");
const WIDTH = 600, HEIGHT = 520;

/* la cámara: un poco más alta que la de serie para ver dentro del reloj */
const W0 = reloj(k, G, k.fitProjection([[0, 0, 0], [1, 1, 1]], WIDTH, HEIGHT));
const reach = Math.hypot(W0.CAP_S + W0.CAP_T, W0.CAP_R);
const P = k.fitProjection([
  ...k.boxCorners(W0.PLATE, -W0.PLATE_H - W0.FOOT_H, 0),
  [W0.HG[0], W0.HG[1] - reach, W0.PIV], [W0.HG[0], W0.HG[1] + reach, W0.PIV], [W0.HG[0], W0.HG[1], W0.PIV + reach],
  [W0.GAUGE.x, W0.GAUGE.y, W0.G1 + 8], [W0.DIAL[0], W0.DIAL[1], W0.DIAL_Z + W0.DIAL_R + 6], [W0.DIAL[0] + 30, W0.DIAL[1] - 30, W0.DIAL_Z + 20],
], WIDTH, HEIGHT, { pad: 18, azimuth: 45, elevation: 32 });
const W = reloj(k, G, P);

/* ---------- la muestra estática ---------- */
const plan0 = M.GUARDIA, R0 = M.rangoDe(plan0), t0 = arg ? +arg.slice(4) : 18, se0 = M.sim(plan0, R0.T0 - 1, R0.T1 + 0.5);
const e0 = se0[Math.round((t0 - se0[0].t) / M.DT)], th0 = e0.z ? Math.PI : 0, caf0 = M.cafeExtra(e0.c);
const lp = W.post(-1), rp = W.post(1);
const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "Un reloj de arena de madera y latón, montado en un bastidor que gira entre dos postes. La arena es el cansancio: mientras estás despierto cae al bulbo de la banda de latón; cuando duermes el reloj se da la vuelta y ese bulbo se vacía. Detrás, una esfera de día y noche asoma sobre un horizonte de madera: el sol sube y baja con el reloj interno. Un manguito de latón, el café, tapa parte de la arena. A la izquierda, una regla con zonas roja, ámbar y verde y un cursor marca la alerta. Delante, la regla de la guardia con las horas dormidas, la guardia y los cafés, y un carro que señala la hora.",
  body: [
    W.base(), `<g data-part="strip">${W.stripMarks(plan0, R0.T0, R0.T1)}</g>`,
    W.gaugeBack(), `<g data-part="gcur">${W.gaugeCursor(e0.A || 0, !!e0.z)}</g>`,
    lp.knob, lp.post, lp.pin,
    `<g data-part="reloj">${W.relojSvg(W.relojFijo(th0), W.relojDentro(th0, e0.S, caf0, true, 0))}</g>`,
    rp.pin, rp.post, rp.knob,
    W.dialBack(), `<g data-part="disc">${W.dialDisc(t0)}</g>`, W.horizon(),
    `<g data-part="cups">${W.cups(plan0, R0.T0, R0.T1, t0)}</g>`,
    `<g data-part="carriage" transform="${k.translateAlong(P, [W.X(t0, R0.T0, R0.T1), 0, 0])}">${W.carriage()}</g>`,
  ],
});

/* ---------- los colores: madera, latón, arena, cielo (el color es lo que se explica) ---------- */
const mat = (sel, v) => `${sel}{${Object.entries(v).map(([a, b]) => `--anatomy-${a}:${b}`).join(";")}}`;
const sh = (a, b, c, d) => ({ "shade-0": a, "shade-1": b, "shade-2": c, "shade-3": d });
const CSS = [
  // la página, cálida
  mat(".iso", { page: "#120e0b", card: "#18130f", paper: "#18130f", text: "#b3a594", strong: "#efe3d2", muted: "#7d6f60", halo: "#050302" }),
  mat(".iso[data-theme=light]", { page: "#f3ece2", card: "#fbf7f1", paper: "#fbf7f1", text: "#5d5045", strong: "#2a1f16", muted: "#9a8b7b", halo: "#7a6450" }),
  mat(".m-wood", { paper: "#2c1f15", ...sh("#1c130c", "#221810", "#291d14", "#302219"), top: "#3d2c1f", hi: "#d2ab82", mid: "#8d6b4c", lo: "#5b4330", faint: "#3f2e21" }),
  mat(".m-brass", { paper: "#3a2d12", ...sh("#271e0b", "#2e240e", "#352a11", "#3d3015"), top: "#5d4a1d", hi: "#ecc96e", mid: "#b8944a", lo: "#7c6331", faint: "#4f401f", "lit-top": "#7a6226", "lit-shade": "#4e3e18", lit: "#ffe08a", face: "#4e3e18" }),
  mat(".m-sand", { paper: "#a5661f", ...sh("#7a4913", "#895417", "#975e1b", "#a5661f"), top: "#d99a48", hi: "#f0bd72", mid: "#d6974a", lo: "#8a5a22" }),
  mat(".m-coffee", { paper: "#4d2b17", ...sh("#2f190c", "#381e0f", "#422513", "#4d2b17"), top: "#73432a", hi: "#e3a273", mid: "#a8683f", lo: "#6a3f25" }),
  mat(".m-cup", { paper: "#2f2a25", ...sh("#211d19", "#26221e", "#2b2622", "#302b26"), top: "#3c3630", hi: "#e6ddd0", mid: "#948a7d", lo: "#5c544a" }),
  mat(".m-paper", { paper: "#2a2319", top: "#3a3123", mid: "#8a7a5e", lo: "#5e5240" }),
  mat("[data-theme=light] .m-wood", { paper: "#e6cca8", ...sh("#c39e72", "#cfaa7f", "#d9b88f", "#e6cca8"), top: "#f3e2c8", hi: "#5b3d22", mid: "#9a7550", lo: "#c4a37b", faint: "#dcc3a0" }),
  mat("[data-theme=light] .m-brass", { paper: "#e8cd84", ...sh("#c5a253", "#d1b062", "#ddbe72", "#e8cd84"), top: "#f7e4a8", hi: "#6b5016", mid: "#a5822f", lo: "#cdb06a", faint: "#e3cf96", "lit-top": "#fff0bd", "lit-shade": "#e2c375", lit: "#4a3608", face: "#f2da92" }),
  mat("[data-theme=light] .m-sand", { paper: "#e0a253", ...sh("#bf7c2d", "#cb8a3a", "#d69746", "#e0a253"), top: "#f1c27c", hi: "#7d4c14", mid: "#b8762a", lo: "#d9a660" }),
  mat("[data-theme=light] .m-coffee", { paper: "#b97a4d", ...sh("#93552e", "#a26238", "#ae6e43", "#b97a4d"), top: "#d79b6c", hi: "#4f2810", mid: "#7c4524", lo: "#c08a62" }),
  mat("[data-theme=light] .m-cup", { paper: "#fbf8f2", ...sh("#dcd4c6", "#e5ded2", "#eee8de", "#f6f2ea"), top: "#ffffff", hi: "#4a4238", mid: "#a49a8b", lo: "#cfc6b8" }),
  mat("[data-theme=light] .m-paper", { paper: "#f6eedf", top: "#fbf5ea", mid: "#a8977a", lo: "#cbbd9f" }),
  ".g-glass{fill:#bfe3ff;fill-opacity:.09}.l-glass{stroke:#a9cbe0!important;stroke-opacity:.8;stroke-width:1px}.l-shine{stroke:#fff!important;stroke-opacity:.45;stroke-width:1.1px}",
  "[data-theme=light] .g-glass{fill:#8fc3e6;fill-opacity:.12}[data-theme=light] .l-glass{stroke:#5f8fae!important}[data-theme=light] .l-shine{stroke:#fff!important;stroke-opacity:.9}",
  ".l-sand{stroke:#d6974a!important}.l-grain{stroke:#46321f!important}[data-theme=light] .l-grain{stroke:#cba57c!important}.l-wood{stroke:#5b4330!important}[data-theme=light] .l-wood{stroke:#c4a37b!important}",
  ".z-bad{fill:#b8473b}.z-warn{fill:#c98d2e}.z-ok{fill:#4f9a62}[data-theme=light] .z-bad{fill:#d9574a}[data-theme=light] .z-warn{fill:#e3a53c}[data-theme=light] .z-ok{fill:#5bb072}",
  ".sky-day{fill:#9c7330}.sky-night{fill:#1b2a4e}.sun{fill:#ffcf4a}.moon{fill:#ece4cf}.l-sun{stroke:#ffcf4a!important}",
  "[data-theme=light] .sky-day{fill:#f5cf7c}[data-theme=light] .sky-night{fill:#3c5799}[data-theme=light] .sun{fill:#f3a81c}[data-theme=light] .l-sun{stroke:#f3a81c!important}[data-theme=light] .moon{fill:#faf6ea}",
  ".strip-sleep{fill:#5a78b8}.strip-guard{fill:#c9573a}.coffee{fill:#5a3218}[data-theme=light] .strip-sleep{fill:#6f8fd0}[data-theme=light] .coffee{fill:#6e3e1e}",
  // dentro de la app: sin márgenes de página de libro
  ".iso-page{margin:14px auto 28px!important;width:min(650px,100% - 20px)!important}",
  ".corto .iso-legend{display:none}.corto .iso-page{margin:0 auto!important;width:100%!important}.corto .iso-figure{margin:0}.corto,.corto body{background:transparent}",
  "@media (max-width:520px){.iso-plate-corner{font-size:10.5px!important;letter-spacing:.03em!important}.iso-plate-corner[data-corner=readout]{font-size:10px!important;letter-spacing:0!important}}",
].join("");

/* ---------- la parte viva ---------- */
const kitNames = [...kitScript().matchAll(/^(?:function|const|let|class) ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
const latheSrc = readFileSync(join(KIT, "lathe.mjs"), "utf8").replace(/^import .*$/m, "").replace(/^export /gm, "");
const latheNames = [...readFileSync(join(KIT, "lathe.mjs"), "utf8").matchAll(/^export (?:function|const) ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
const live = `
const k = { ${kitNames.join(", ")} };
const G = (() => { ${latheSrc}
return { ${latheNames.join(", ")} }; })();
${readFileSync(join(HERE, "../sueno-figura/model.mjs"), "utf8").replace(/^export /gm, "")}
${readFileSync(join(HERE, "reloj.mjs"), "utf8").replace(/^export /gm, "")}
const P = ${JSON.stringify(P)};
const W = reloj(k, G, P);
const plan = planDe(location.hash), R = rangoDe(plan), T0 = R.T0, T1 = R.T1, SERIE = sim(plan, T0 - 1, T1 + 0.5);
const en = (t) => SERIE[Math.max(0, Math.min(SERIE.length - 1, Math.round((t - SERIE[0].t) / DT)))];
const stage = document.querySelector(".iso-stage"), svg = stage.querySelector("svg");
const $ = (n) => svg.querySelector('[data-part="' + n + '"]');
const parts = { strip: $("strip"), cups: $("cups"), reloj: $("reloj"), disc: $("disc"), gcur: $("gcur"), car: $("carriage") };
const readout = document.querySelector("[data-readout]");
if (plan.label) { for (const n of document.querySelectorAll(".iso-plate *")) if (n.childElementCount === 0 && /reloj del sue/i.test(n.textContent)) { n.textContent = (plan.g === false ? "Tu reloj · " : "Tu guardia · ") + plan.label; break; } }
// &corto: dentro de una tarjeta de la app, sin leyenda ni márgenes
if (/[#&]corto(&|$)/.test(location.hash)) document.body.classList.add("corto");
parts.strip.innerHTML = W.stripMarks(plan, T0, T1);
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hhmm = (t) => { const m = Math.round(((t % 24) + 24) % 24 * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const fase = (t) => plan.g === false ? (t < 0 ? "ayer" : t < 24 ? "hoy" : "mañana") : t < plan.de ? "antes de la guardia" : t < plan.sale ? "de guardia" : "saliente";
const sueno = (t) => (plan.todo.filter((s) => t >= s.a && t < s.b)[0] || {}).txt || "durmiendo";
const HT = /[#&]t=(-?[0-9.]+)/.exec(location.hash), ARG = ${arg ? t0 : "null"} ?? (HT ? clamp(+HT[1], T0, T1) : null);
let t = ARG == null ? clamp(${t0}, T0, T1) : ARG, target = t, frame = 0, last = 0, touring = ARG == null, visible = false, idle = 0, grano = 0, tomadas = -1;
let th = en(t).z ? Math.PI : 0, cursor = en(t).A || 0, quieto = { th: null, items: null };
const fijoDe = (a) => { if (quieto.th === a) return quieto.items; const it = W.relojFijo(a); if (a === 0 || a === Math.PI) quieto = { th: a, items: it }; return it; };
let arena = { key: "", d: null };
// la arena solo se rehace cuando cambia de verdad; los granos que caen, en cada fotograma
const arenaDe = (a, S0, caf) => { const key = a.toFixed(3) + "|" + S0.toFixed(3) + "|" + caf.toFixed(1); if (arena.key !== key) arena = { key, d: W.relojDentro(a, S0, caf, false, 0) }; return arena.d; };
function draw() {
  const e = en(t), caf = cafeExtra(e.c), d = arenaDe(th, e.S, caf);
  const g = still.matches ? "" : W.granos(th, e.S, grano);
  parts.reloj.innerHTML = W.relojSvg(fijoDe(th), { dentro: [d.dentro[0], d.dentro[1] + g], fuera: d.fuera });
  parts.disc.innerHTML = W.dialDisc(t);
  parts.gcur.innerHTML = W.gaugeCursor(cursor, e.A == null);
  const n = plan.cafes.filter((c) => t >= c.t).length;
  if (n !== tomadas) { tomadas = n; parts.cups.innerHTML = W.cups(plan, T0, T1, t); }
  parts.car.setAttribute("transform", translateAlong(P, [W.X(t, T0, T1), 0, 0]));
  const txt = hhmm(t) + " · " + fase(t) + " · " + (e.A == null ? sueno(t) : "alerta " + Math.round(e.A) + " · " + estado(e.A) + (caf >= 1 ? " · café +" + Math.round(caf) : ""));
  if (readout.textContent !== txt) readout.textContent = txt;
  stage.setAttribute("aria-valuetext", txt);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
  const calm = still.matches;
  grano = calm ? 0 : (grano + dt * 1.1) % 1;
  if (touring) { target += dt * 2.0; if (target > T1) target = T0; }
  t = calm || touring ? target : t + (target - t) * (1 - Math.exp(-dt / 0.25));
  const e = en(t), thT = e.z ? Math.PI : 0, want = e.A == null ? 0 : e.A;
  th = calm || Math.abs(thT - th) < 0.004 ? thT : th + (thT - th) * (1 - Math.exp(-dt / 0.16));
  cursor = calm ? want : cursor + (want - cursor) * (1 - Math.exp(-dt / 0.3));
  draw();
  frame = visible && !calm ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
// sin hora de la app, al soltar vuelve el paseo; con ella (la de ahora), vuelve a ahora
const steer = (to) => { touring = false; target = clamp(to, T0, T1); clearTimeout(idle); idle = setTimeout(() => { if (ARG != null) target = ARG; else touring = !still.matches; run(); }, 4000); run(); };
new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (ev) => { const b = svg.getBoundingClientRect(); steer(T0 + clamp((ev.clientX - b.left) / b.width, 0, 1) * (T1 - T0)); });
stage.addEventListener("keydown", (ev) => { const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[ev.key]; if (!d) return; ev.preventDefault(); steer(Math.round(target) + d); });
stage.setAttribute("aria-valuemin", String(T0)); stage.setAttribute("aria-valuemax", String(T1));
draw();
`;

const body = `<style>${CSS}</style>` + k.plateHtml({
  fig: "Fig 1",
  title: "El reloj del sueño",
  hint: "Desliza para mover la hora",
  readout: "",
  keys: [
    { mark: "lit", label: "Arena: tu cansancio. Despierto, cae al bulbo de la tapa de latón; al dormir el reloj se da la vuelta y ese bulbo se vacía" },
    { mark: "raised", label: "Sol y luna: tu reloj interno, que sube hasta las 17:00 y baja de madrugada" },
    { mark: "flat", label: "Manguito de latón: el café tapa parte del cansancio, pero no lo quita" },
  ],
  caption: "La regla de la izquierda es tu alerta: sube con el sol y con el café y baja con la arena. Por debajo de 35, riesgo (rojo); de 35 a 55, flojo (ámbar); por encima, despejado (verde). La arena tarda unas 18 h en llenarse y unas 4 h en vaciarse: por eso una siesta corta ya se nota. El café se va a la mitad cada 5 h. Delante, tu guardia: en azul lo que duermes, en rojo la guardia, y los cafés en su hora. Los números salen del mismo modelo que usa la app (Borbély; Åkerstedt).",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="El reloj del sueño: las flechas mueven la hora">${svg}</div>`,
});
const html = k.pageHtml({ title: "El reloj del sueño", theme, body, script: kitScript() + live });
const nombre = (arg ? "reloj-t" + t0 : "reloj") + (theme === "light" ? "-light" : "") + ".html";
writeFileSync(join(HERE, nombre), html);
if (paraApp && !arg) { mkdirSync(join(RAIZ, "fig"), { recursive: true }); writeFileSync(join(RAIZ, "fig", "sueno" + (theme === "light" ? "-light" : "") + ".html"), html); }
console.log("wrote", nombre, Math.round(html.length / 1024) + " KB");
