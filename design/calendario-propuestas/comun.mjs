/* lo común de las figuras estáticas de Calendario: materiales del conductor, CSS y utilidades */
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
export const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const mix = (a, b, f) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * f).toString(16).padStart(2, "0")).join("");
export const mat = (sel, v) => `${sel}{${Object.entries(v).map(([a, b]) => `--anatomy-${a}:${b}`).join(";")}}`;
export const tinte = (sel, c, dark) => mat(sel, dark
  ? { paper: c, "shade-0": mix(c, "#000000", 0.45), "shade-1": mix(c, "#000000", 0.35), "shade-2": mix(c, "#000000", 0.25), "shade-3": mix(c, "#000000", 0.15), top: mix(c, "#ffffff", 0.12), hi: mix(c, "#ffffff", 0.55), mid: mix(c, "#ffffff", 0.25), lo: mix(c, "#000000", 0.5), faint: mix(c, "#000000", 0.3) }
  : { paper: c, "shade-0": mix(c, "#000000", 0.22), "shade-1": mix(c, "#000000", 0.16), "shade-2": mix(c, "#000000", 0.1), "shade-3": mix(c, "#000000", 0.04), top: mix(c, "#ffffff", 0.3), hi: mix(c, "#000000", 0.6), mid: mix(c, "#000000", 0.35), lo: mix(c, "#000000", 0.18), faint: mix(c, "#000000", 0.08) });
export const MATS = {
  base: ["#16223a", "#dfe7f2"], steel: ["#3a4a62", "#d4dde8"], concrete: ["#2c3647", "#e3e8ef"], bus: ["#c9d4e4", "#f7f9fc"], tyre: ["#151a22", "#3a404a"],
  work: ["#d9573f", "#ef7a63"], guard: ["#34467e", "#6f86c8"], meal: ["#2f9e6b", "#56c48f"], gym: ["#7a5cf0", "#9c86ff"], plan: ["#1fa6c4", "#4cc9e4"],
  night: ["#1b2547", "#aebce6"], libre: ["#56627a", "#c3cbd8"], vac: ["#e3a72f", "#f6c35a"], tile: ["#1d283c", "#eef2f7"], amber: ["#ffd66b", "#f2b929"],
  leaf: ["#3f8a4f", "#86c47a"], trunk: ["#5a3f2a", "#a07a58"], ticket: ["#f6c35a", "#f6c35a"], moon: ["#e9eef5", "#ffffff"], lcdcase: ["#0e1626", "#26334a"],
  card: ["#1b2a4a", "#e8eef8"], cardl: ["#223560", "#dbe4f3"], chip: ["#c9a24a", "#d8b454"], mat: ["#101828", "#d8e0ec"], hole: ["#070b14", "#8a9ab2"],
  rojo: ["#ff2b3a", "#ff3d4a"], rojot: ["#3a0c12", "#ffd5d9"], casa: ["#e8dcc4", "#f3ead8"], tejado: ["#b3503a", "#c9654d"], cesped: ["#3f8a4f", "#7fc46e"], agua: ["#1fa6c4", "#4cc9e4"],
};
export const CSS = [
  k.ISO_CSS,
  mat(".iso", { page: "#070b14", card: "#111a2b", paper: "#111a2b", text: "#8fa6c6", strong: "#e9f2ff", muted: "#5d7394", halo: "#02040a" }),
  mat(".iso[data-theme=light]", { page: "#f4f7fb", card: "#ffffff", paper: "#ffffff", text: "#4a5d78", strong: "#0d1726", muted: "#8a9ab2", halo: "#5c6f8c" }),
  ...Object.entries(MATS).flatMap(([n, [d, l]]) => [tinte(".m-" + n, d, true), tinte("[data-theme=light] .m-" + n, l, false)]),
  ".glass{fill:#0a1220}[data-theme=light] .glass{fill:#22324a}",
  ".l-amber{stroke:#ffd66b!important;stroke-width:1.1px}.l-umi{stroke:#9c86ff!important;stroke-width:1px}.l-sal{stroke:#b9c7f3!important;stroke-width:1.1px}",
  ".num{fill:#8fa6c6;font:800 7.4px/1 ui-sans-serif,system-ui,sans-serif}.num.hoy{fill:#ffd66b}[data-theme=light] .num{fill:#4a5d78}",
  ".grab{fill:#aebce6;font:800 5.2px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.12em}[data-theme=light] .grab{fill:#3b4f78}",
  ".grab.g{fill:#ffd66b;font-size:11px;letter-spacing:0}[data-theme=light] .grab.g{fill:#9a6b00}.grab.s{fill:#8fa6c6;font-size:3.8px;font-weight:700}[data-theme=light] .grab.s{fill:#6a7c96}",
  ".dn{fill:#8fa6c6;font:800 3.6px/1 ui-monospace,Menlo,monospace}.dn.hoy{fill:#ffd66b}.dn.pas{fill:#4a5a74}[data-theme=light] .dn{fill:#4a5d78}[data-theme=light] .dn.pas{fill:#aab6c8}",
  ".hole{fill:#070b14}[data-theme=light] .hole{fill:#8a9ab2}",
].join("");
export const rect = (u0, z0, u1, z1) => `M${u0} ${-z1}H${u1}V${-z0}H${u0}Z`;
