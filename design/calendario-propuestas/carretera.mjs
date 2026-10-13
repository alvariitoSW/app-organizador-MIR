/* LA CARRETERA DEL MES: el modelo alternativo en primera persona. Lo que viene, visto desde el asiento del
   conductor, como en Hoy: la misma cabina (parabrisas, pilares, salpicadero, volante) y la misma cámara, pero la
   carretera no es el día sino LOS DÍAS. Cada día es un mojón al borde de la carretera, con su número; lo que toca
   cada día es lo que hay en la carretera a esa distancia:
     · la guardia es un túnel (la noche de trabajo, se entra y se sale a la mañana siguiente);
     · el finde libre es un área de descanso con sus árboles y su mesa;
     · las vacaciones son la salida a la playa, con su cartel verde;
     · un evento es una señal azul en su poste, con el nombre y la hora;
     · la jornada es la ciudad a los lados, como en Hoy.
   El salpicadero no dice la hora: dice la fecha, la próxima guardia (en días) y el próximo finde libre. La tira
   de arriba es el mes entero (31 marcas, con hoy en ámbar): el mapa de la ruta.
   Sustituye a cuatro cosas: la cuenta atrás de Hoy («finde libre en 4 d»), «Próximos» de Hoy, «Eventos de
   octubre» de Mes y la segunda y tercera semana de la cuadrícula. Estática (un fotograma); si se construye, se
   movería con el dedo (arrastrar = avanzar días) y tocar un mojón abriría ese día.
   node carretera.mjs → carretera.html, carretera-light.html, carretera.svg */
import { writeFileSync } from "node:fs";

const W = 600, HG = 440, CX = 300, HY = 150, F = 270, EYE = 2.4, NEAR = 0.9, FAR = 200, GAP = 11;   /* un día = 11 m de carretera: en el parabrisas caben unos 12 días */
const pr = (x, y, z) => [CX + F * x / z, HY + F * (EYE - y) / z];
const f1 = (n) => n.toFixed(1);
function poly(pts, cls, extra) {
  const o = [];
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], ina = a[2] >= NEAR, inb = b[2] >= NEAR;
    if (ina) o.push(a); if (ina !== inb) { const f = (NEAR - a[2]) / (b[2] - a[2]); o.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, NEAR]); } }
  if (o.length < 3) return "";
  return `<path class="${cls}"${extra || ""} d="M${o.map((p) => { const s = pr(p[0], p[1], p[2]); return f1(s[0]) + " " + f1(s[1]); }).join("L")}Z"/>`;
}
function seg(a, b, cls, w) {
  if (a[2] < NEAR && b[2] < NEAR) return "";
  const p = pr(a[0], a[1], a[2]), q = pr(b[0], b[1], b[2]), zw = Math.min(a[2], b[2]);
  return `<path class="${cls}" style="stroke-width:${Math.max(0.6, w * F / zw).toFixed(2)}px" d="M${f1(p[0])} ${f1(p[1])}L${f1(q[0])} ${f1(q[1])}"/>`;
}
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/* ---------- los datos: octubre 2026 desde el martes 13 ---------- */
const HOY = 13, DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const TIPO = {}; for (let d = 1; d <= 31; d++) { const w = new Date(2026, 9, d).getDay(); TIPO[d] = w === 0 || w === 6 ? "libre" : "jornada"; }
Object.assign(TIPO, { 3: "guardia", 8: "guardia", 13: "guardia", 19: "guardia", 24: "guardia", 28: "guardia", 4: "saliente", 9: "saliente", 14: "saliente", 20: "saliente", 25: "saliente", 29: "saliente", 30: "vac", 31: "vac" });
const GT = { 8: "UMI", 24: "UMI" };
const EVS = [[15, "Sesión general", "08:15"], [17, "Cumple de Marta", "21:00"], [22, "Dentista", "17:30"], [27, "Examen", "09:00"]];
const zDe = (d) => 4 + (d - HOY) * GAP;   /* hoy está justo delante; mañana a 15 m */

const out = [], defs = [];
/* el cielo y el suelo */
defs.push(`<linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a3a"/><stop offset="1" stop-color="#2a4a7a"/></linearGradient>`);
out.push(`<rect x="0" y="0" width="600" height="${HY}" fill="url(#cielo)"/>`);
out.push(`<rect class="cd-ground" x="0" y="${HY}" width="600" height="200"/>`);
/* la carretera, los arcenes y las aceras */
out.push(poly([[-5.2, 0, NEAR], [3.0, 0, NEAR], [3.0, 0, FAR], [-5.2, 0, FAR]], "cd-road"));
out.push(poly([[3.0, 0.15, NEAR], [8, 0.15, NEAR], [8, 0.15, FAR], [3.0, 0.15, FAR]], "cd-walk"));
out.push(poly([[-11, 0.15, NEAR], [-5.2, 0.15, NEAR], [-5.2, 0.15, FAR], [-11, 0.15, FAR]], "cd-walk"));
const tira = (x0, x1, y, cls) => poly([[x0, y, NEAR], [x1, y, NEAR], [x1, y, FAR], [x0, y, FAR]], cls);
out.push(tira(2.96, 3.1, 0.16, "cd-kerb"), tira(-5.3, -5.16, 0.16, "cd-kerb"), tira(2.72, 2.8, 0.011, "cd-edge"), tira(-4.98, -4.9, 0.011, "cd-edge"));
for (let z0 = 2; z0 < FAR; z0 += 6) out.push(poly([[-1.15, 0.01, z0], [-1.0, 0.01, z0], [-1.0, 0.01, z0 + 3], [-1.15, 0.01, z0 + 3]], "cd-dash"));
/* la hierba a la derecha donde el finde y las vacaciones; la ciudad donde la jornada */
const amb = (d) => TIPO[d] === "libre" || TIPO[d] === "vac" ? "campo" : TIPO[d] === "guardia" ? "hospital" : "ciudad";
const far = [];   /* todo lo que está lejos se pinta primero: de atrás adelante */
for (let d = 31; d >= HOY; d--) {
  const z0 = zDe(d) - GAP / 2, z1 = zDe(d) + GAP / 2, a = amb(d), o = [];
  if (a === "campo") {
    o.push(poly([[8.05, 0.02, Math.max(NEAR, z0)], [60, 0.02, Math.max(NEAR, z0)], [60, 0.02, z1], [8.05, 0.02, z1]], "", ' style="fill:#2f5a3a"'));
    o.push(poly([[-60, 0.02, Math.max(NEAR, z0)], [-11.05, 0.02, Math.max(NEAR, z0)], [-11.05, 0.02, z1], [-60, 0.02, z1]], "", ' style="fill:#2a523a"'));
    for (let i = 0; i < 5; i++) for (const lado of [1, -1]) { const z = z0 + 2 + i * 4.4, x = lado * (12 + hash(d * 7 + i * 3 + lado) * 10), h = 3.5 + hash(d + i) * 2.5;
      o.push(seg([x, 0, z], [x, h * 0.45, z], "cd-trunk", 0.35)); o.push(poly([[x - 1.6, h * 0.4, z], [x + 1.6, h * 0.4, z], [x, h, z]], "", ' style="fill:#2f7a52"')); o.push(poly([[x - 1.2, h * 0.55, z - 0.2], [x + 1.2, h * 0.55, z - 0.2], [x, h * 1.05, z - 0.2]], "", ' style="fill:#3f8a4f"')); }
  } else {
    for (const lado of [1, -1]) { const x0 = lado > 0 ? 10.4 : -13.4, x1 = lado > 0 ? 17 : -20, hosp = a === "hospital" && lado > 0, h = hosp ? 7 : 3 + Math.floor(hash(d * 7 + (lado > 0 ? 1 : 5)) * 4);
      o.push(poly([[x0, 0, z0 + 1], [x0, 0, z1 - 1.5], [x0, h, z1 - 1.5], [x0, h, z0 + 1]], hosp ? "cd-hosp" : ["cd-ba", "cd-bb", "cd-bc", "cd-bd"][Math.floor(hash(d * 3 + lado) * 4)]));
      o.push(poly([[x0, 0, z0 + 1], [x1, 0, z0 + 1], [x1, h, z0 + 1], [x0, h, z0 + 1]], hosp ? "cd-hospe" : "cd-bend"));
      if (z0 < 90) for (let y = 1.6; y < h - 1.2; y += 2.8) for (let z = z0 + 2; z < z1 - 2.9; z += 2.4) { const x = x0 - 0.01 * lado; o.push(poly([[x, y, z], [x, y, z + 1.3], [x, y + 1.4, z + 1.3], [x, y + 1.4, z]], hosp && hash(y * 7 + z) > 0.3 ? "cd-wino" : "cd-win")); }
      if (hosp) { const zc = (z0 + z1) / 2; o.push(poly([[x0 - 0.02, 5.2, zc - 1.4], [x0 - 0.02, 5.2, zc + 1.4], [x0 - 0.02, 7.6, zc + 1.4], [x0 - 0.02, 7.6, zc - 1.4]], "cd-hosp")); o.push(poly([[x0 - 0.04, 6.1, zc - 1.1], [x0 - 0.04, 6.1, zc + 1.1], [x0 - 0.04, 6.7, zc + 1.1], [x0 - 0.04, 6.7, zc - 1.1]], "cd-cross")); o.push(poly([[x0 - 0.04, 5.5, zc - 0.3], [x0 - 0.04, 5.5, zc + 0.3], [x0 - 0.04, 7.3, zc + 0.3], [x0 - 0.04, 7.3, zc - 0.3]], "cd-cross")); }
    }
  }
  far.push(...o);
}
out.push(...far);
/* lo que hay en la carretera a cada distancia, de atrás adelante */
const cosas = [];
const cartel = (x, y, z, w, h, cls, txt, sub, tcls) => { const p = pr(x, y, z), q = pr(x + w, y + h, z); const sw = q[0] - p[0], sh = p[1] - q[1]; if (sw < 6) return "";
  const fs = Math.max(4, Math.min(16, sw / Math.max(6, txt.length) * 1.7));
  return `<rect class="${cls}" x="${f1(p[0])}" y="${f1(q[1])}" width="${f1(sw)}" height="${f1(sh)}" rx="${f1(sh * 0.08)}"/>` +
    `<text class="${tcls || "cd-sigt2"}" x="${f1(p[0] + sw / 2)}" y="${f1(q[1] + sh * (sub ? 0.5 : 0.66))}" style="font-size:${f1(fs)}px">${esc(txt)}</text>` +
    (sub ? `<text class="${tcls || "cd-sigt2"}" x="${f1(p[0] + sw / 2)}" y="${f1(q[1] + sh * 0.88)}" style="font-size:${f1(fs * 0.72)};opacity:.85">${esc(sub)}</text>` : ""); };
for (let d = 31; d >= HOY + 1; d--) {
  const z = zDe(d), t = TIPO[d], o = [];
  /* el mojón del día: un hito blanco con la cabeza del color del tipo y el número */
  const mx = 3.6, mh = 1.1, col = { jornada: "#d9573f", guardia: "#34467e", saliente: "#7d93e0", libre: "#3f8a4f", vac: "#e3a72f" }[t];
  o.push(poly([[mx - 0.25, 0, z - 0.25], [mx + 0.25, 0, z - 0.25], [mx + 0.25, mh, z - 0.25], [mx - 0.25, mh, z - 0.25]], "cd-mojon"));
  o.push(poly([[mx - 0.25, mh * 0.62, z - 0.26], [mx + 0.25, mh * 0.62, z - 0.26], [mx + 0.25, mh, z - 0.26], [mx - 0.25, mh, z - 0.26]], "", ` style="fill:${col}"`));
  { const p = pr(mx, mh * 0.3, z - 0.27), fs = Math.max(3, 0.42 * F / z); if (fs >= 3.5) o.push(`<text class="cd-mojt" x="${f1(p[0])}" y="${f1(p[1] + fs * 0.35)}" style="font-size:${f1(fs)}px">${d}</text>`); }
  if (t === "guardia") {
    /* el túnel de la guardia: la boca oscura sobre la carretera, el portal de hormigón y el cartel con el tipo y las horas */
    const z0 = z - 2, z1 = z + GAP * 0.7;
    o.push(poly([[-7, 0, z0], [-7, 7.5, z0], [-7, 7.5, z1], [-7, 0, z1]], "cd-gwl"), poly([[4.8, 0, z0], [4.8, 7.5, z0], [4.8, 7.5, z1], [4.8, 0, z1]], "cd-gwr"));
    o.push(poly([[-7, 7.5, z0], [4.8, 7.5, z0], [4.8, 7.5, z1], [-7, 7.5, z1]], "cd-gceil"));
    o.push(poly([[-8.5, 0, z0], [6.3, 0, z0], [6.3, 9, z0], [-8.5, 9, z0]], "cd-portal"));
    o.push(poly([[-7, 0, z0 - 0.02], [4.8, 0, z0 - 0.02], [4.8, 7.5, z0 - 0.02], [-7, 7.5, z0 - 0.02]], "cd-boca"));
    for (let k2 = 0; k2 < 3; k2++) { const zz = z0 + 4 + k2 * 4; if (zz < z1) o.push(poly([[-1.5, 7.3, zz], [0.4, 7.3, zz], [0.4, 7.3, zz + 1.2], [-1.5, 7.3, zz + 1.2]], "cd-glampo")); }
    o.push(cartel(-7.2, 9.3, z0 - 0.03, 13.2, 3.4, "cd-sig", `GUARDIA ${GT[d] || "URG"} · ${DIAS[new Date(2026, 9, d).getDay()]} ${d}`, "15:00 → 9:15 · " + ((d - HOY) === 1 ? "mañana" : "en " + (d - HOY) + " días"), "cd-sigt"));
    o.push(seg([-8.3, 0, z0 - 0.05], [-8.3, 9.1, z0 - 0.05], "cd-post", 0.18), seg([6.1, 0, z0 - 0.05], [6.1, 9.1, z0 - 0.05], "cd-post", 0.18));
  }
  if (t === "libre" && (TIPO[d - 1] !== "libre" || d === HOY + 1)) {
    /* el área de descanso: el carril de entrada a la derecha, la mesa con los bancos y el cartel */
    const z0 = z - 4, z1 = z + GAP * 1.6;
    o.push(poly([[3.0, 0.005, z0 + 2], [11, 0.005, z0 + 8], [11, 0.005, z1 - 6], [3.0, 0.005, z1]], "cd-road"));
    o.push(poly([[8.4, 0.3, z + 3], [10.4, 0.3, z + 3], [10.4, 0.3, z + 4.6], [8.4, 0.3, z + 4.6]], "cd-mesa"), poly([[8.4, 0.55, z + 3.2], [10.4, 0.55, z + 3.2], [10.4, 0.55, z + 4.4], [8.4, 0.55, z + 4.4]], "cd-mesat"));
    o.push(cartel(5.2, 2.4, z0 + 1, 7.4, 2.4, "cd-sigv", "ÁREA DE DESCANSO", DIAS[new Date(2026, 9, d).getDay()] + " " + d + (TIPO[d + 1] === "libre" ? " – " + DIAS[new Date(2026, 9, d + 1).getDay()] + " " + (d + 1) : ""), "cd-sigtv"));
    o.push(seg([5.2, 0, z0 + 0.98], [5.2, 2.2, z0 + 0.98], "cd-post", 0.16), seg([12.6, 0, z0 + 0.98], [12.6, 2.4, z0 + 0.98], "cd-post", 0.16));
  }
  if (t === "vac" && TIPO[d - 1] !== "vac") {
    /* la salida a la playa: el pórtico verde sobre la carretera con la flecha y la palmera */
    o.push(seg([-6, 0, z - 2], [-6, 7, z - 2], "cd-post", 0.3), seg([4, 0, z - 2], [4, 7, z - 2], "cd-post", 0.3));
    o.push(cartel(-6.2, 7, z - 2.02, 10.4, 2.8, "cd-sigv", "SALIDA 30 · PLAYA ↗", "vacaciones · 30 oct → 1 nov", "cd-sigtv"));
    o.push(seg([9, 0, z + 4], [9.6, 5, z + 4], "cd-trunk", 0.5)); for (let a = 0; a < 6; a++) { const an = a / 6 * Math.PI * 2; o.push(poly([[9.6, 5, z + 4], [9.6 + Math.cos(an) * 2.6, 5.6 + Math.sin(an) * 0.4 - 0.9, z + 4 + Math.sin(an) * 1.2], [9.6 + Math.cos(an + 0.5) * 2.2, 5 + Math.sin(an + 0.5) * 0.3 - 0.6, z + 4 + Math.sin(an + 0.5) * 1.1]], "", ' style="fill:#2f8a4f"')); }
  }
  const ev = EVS.find((e) => e[0] === d);
  if (ev) {   /* la señal del evento, azul, en su poste a la izquierda */
    const izq = EVS.indexOf(ev) % 2 === 0, px = izq ? -6.2 : 5.4;
    o.push(seg([px, 0, z - 0.4], [px, 4.2, z - 0.4], "cd-post", 0.16));
    o.push(cartel(izq ? -9.8 : 1.6, 4.2, z - 0.42, 7.6, 2.3, "cd-sigb", ev[1], ev[2] + " · " + DIAS[new Date(2026, 9, d).getDay()] + " " + d, "cd-sigtb"));
  }
  cosas.push(o.join(""));
}
out.push(...cosas);
/* ---------- la cabina: parabrisas, pilares, salpicadero y volante, como en Hoy ---------- */
out.push(`<path class="cd-frame" d="M0 0H600V${HG}H0ZM22 24H578V${HY + 130}H22Z" fill-rule="evenodd"/>`);
out.push(`<path class="cd-pillar" d="M22 24L58 24L58 ${HY + 130}L22 ${HY + 130}Z"/><path class="cd-pillar" d="M542 24L578 24L578 ${HY + 130}L542 ${HY + 130}Z"/>`);
/* la tira de arriba: el mes entero, 31 marcas, hoy en ámbar, las guardias en azul, las vacaciones en ámbar claro */
out.push(`<rect class="cd-strip" x="60" y="4" width="480" height="18" rx="4"/><text class="cd-stt" x="68" y="16">OCTUBRE</text>`);
for (let d = 1; d <= 31; d++) { const x = 130 + (d - 1) * 13, t = TIPO[d], c = d === HOY ? "cd-snext" : d < HOY ? "cd-spast" : t === "guardia" ? "cd-sguard" : t === "vac" ? "cd-svac" : t === "libre" ? "cd-slibre" : "cd-sdot"; out.push(`<circle class="${c}" cx="${x}" cy="13" r="${d === HOY ? 3.6 : t === "guardia" ? 3 : 2.2}"/>`); }
/* el salpicadero */
out.push(`<path class="cd-dashtop" d="M0 ${HY + 130}H600V${HG}H0Z"/><path class="cd-dashe" d="M22 ${HY + 130}H578"/>`);
out.push(`<rect class="cd-lcd" x="40" y="${HY + 142}" width="150" height="74" rx="8"/><text class="cd-lab" x="52" y="${HY + 158}">HOY</text><text class="cd-clk" style="font-size:24px" x="115" y="${HY + 186}">MAR 13</text><text class="cd-q" x="115" y="${HY + 206}">guardia URG · 15→9</text>`);
out.push(`<rect class="cd-disp" x="205" y="${HY + 142}" width="250" height="74" rx="8"/><text class="cd-nxl" x="218" y="${HY + 158}">PRÓXIMA GUARDIA</text><text class="cd-nxb" x="218" y="${HY + 184}">lun 19 · en 6 días</text><text class="cd-nxa" x="218" y="${HY + 204}">finde libre sáb 17 · playa en 17 d</text>`);
out.push(`<rect class="cd-chip" x="470" y="${HY + 148}" width="96" height="26" rx="13"/><text class="cd-chipt" x="518" y="${HY + 165}">PARA HOY · 3</text>`);
out.push(`<rect class="cd-chip" style="stroke:#7fecff" x="470" y="${HY + 184}" width="96" height="26" rx="13"/><text class="cd-chipt" style="fill:#7fecff" x="518" y="${HY + 201}">4 EVENTOS</text>`);
out.push(`<path class="cd-wheel" d="M240 ${HG + 10}A80 80 0 0 1 360 ${HG + 10}"/>`);
const CSS = `.cd-ground{fill:#3b4352}.cd-road{fill:#262c36}.cd-walk{fill:#59616f}.cd-kerb{fill:#9aa3b2}.cd-edge{fill:#cfd5df}.cd-dash{fill:#d8dde6}
.cd-ba{fill:#4b5a78}.cd-bb{fill:#3a4763}.cd-bc{fill:#5b6a8a}.cd-bd{fill:#43506d}.cd-bend{fill:#2e3850}.cd-win{fill:#1a2236}.cd-wino{fill:#ffd98a}
.cd-hosp{fill:#c9d2de}.cd-hospe{fill:#9aa6b8}.cd-cross{fill:#e5484d}.cd-trunk{stroke:#4a3527;fill:none;stroke-linecap:round}.cd-post{stroke:#8a96a8;fill:none;stroke-linecap:round}
.cd-mojon{fill:#e9eef5}.cd-mojt{fill:#1d2b40;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-gwl{fill:#1b212b}.cd-gwr{fill:#181d26}.cd-gceil{fill:#0d1118}.cd-portal{fill:#3a4252}.cd-boca{fill:#0a0d13}.cd-glampo{fill:#ffe9b0}
.cd-sig{fill:#0b1020;stroke:#ffd66b;stroke-width:1.2}.cd-sigt{fill:#ffd66b;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-sigv{fill:#1f6b3a;stroke:#e9f2ff;stroke-width:.8}.cd-sigtv{fill:#f3f7f1;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-sigb{fill:#1a3f8a;stroke:#e9f2ff;stroke-width:.8}.cd-sigtb{fill:#e9f2ff;font-weight:700;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-mesa{fill:#8a6a48}.cd-mesat{fill:#a07a58}
.cd-frame{fill:#0a0e16}.cd-pillar{fill:#111724}.cd-strip{fill:#05070c;stroke:#1e2738;stroke-width:1.2}.cd-stt{fill:#5d7394;font:700 9.5px ui-monospace,Menlo,monospace;letter-spacing:.06em}
.cd-sdot{fill:#2a3a55}.cd-spast{fill:#56708f}.cd-snext{fill:#ffd66b}.cd-sguard{fill:#7d93e0}.cd-svac{fill:#e3a72f}.cd-slibre{fill:#3f8a4f}
.cd-dashtop{fill:#151c2a}.cd-dashe{stroke:#2a3448;stroke-width:1.5;fill:none}.cd-lcd{fill:#04131a;stroke:#1d3340;stroke-width:1.2}.cd-clk{fill:#7fecff;font:700 32px ui-monospace,Menlo,monospace;text-anchor:middle}
.cd-q{fill:#8fa6c6;font:700 11.5px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.cd-lab{fill:#5d7394;font:800 9px ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em}
.cd-disp{fill:#060a10;stroke:#2a3448;stroke-width:1.4}.cd-nxl{fill:#b98c2c;font:800 10px ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em}.cd-nxb{fill:#ffd66b;font:800 22px ui-sans-serif,system-ui,sans-serif}.cd-nxa{fill:#e9f2ff;font:600 12.5px ui-sans-serif,system-ui,sans-serif}
.cd-chip{fill:#0d1726;stroke:#ffd66b;stroke-width:1.2}.cd-chipt{fill:#ffd66b;font:700 12px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.cd-wheel{stroke:#263044;stroke-width:22;fill:none}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 ${HG}" role="img" aria-label="La carretera del mes desde el asiento del conductor: mojones con los días, el túnel de la guardia del lunes 19, el área de descanso del finde 17–18, la salida a la playa el 30 y las señales de los eventos."><style>${CSS}</style><defs>${defs.join("")}</defs>${out.join("")}</svg>`;
writeFileSync("carretera.svg", svg);
const page = (theme) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>La carretera del mes</title>
<style>body{margin:0;background:${theme === "light" ? "#f4f7fb" : "#070b14"};color:${theme === "light" ? "#4a5d78" : "#8fa6c6"};font:15px/1.45 system-ui,sans-serif;padding:20px}h1{font-size:20px;color:${theme === "light" ? "#0d1726" : "#e9f2ff"};margin:0 0 6px}p{max-width:720px}p b{color:${theme === "light" ? "#0d1726" : "#e9f2ff"}}
.fig{width:min(600px,100%);border-radius:14px;overflow:hidden}.fig svg{display:block;width:100%;height:auto}.movil{width:358px}</style></head><body>
<h1>La carretera del mes</h1><p>El modelo alternativo en primera persona: la misma cabina que en Hoy, pero la carretera son <b>los días que vienen</b>. Cada día es un mojón con su número (la cabeza del color del tipo). Lo que toca está en la carretera a esa distancia: <b>la guardia es un túnel</b> con su cartel («GUARDIA URG · lun 19 · en 6 días»), <b>el finde libre un área de descanso</b>, <b>las vacaciones la salida a la playa</b> y <b>cada evento una señal azul</b> con su hora. El salpicadero dice la fecha, la próxima guardia y el próximo finde; la tira de arriba es el mes entero con hoy en ámbar. Sustituye a la cuenta atrás y a «Próximos» de Hoy, a «Eventos de octubre» de Mes y a las semanas vacías de la cuadrícula.</p>
<div class="fig">${svg}</div><h2 style="font-size:15px;margin:22px 0 8px;color:${theme === "light" ? "#0d1726" : "#e9f2ff"}">A 390 px</h2><div class="fig movil">${svg}</div></body></html>`;
writeFileSync("carretera.html", page("dark")); writeFileSync("carretera-light.html", page("light"));
console.log("carretera:", Math.round(svg.length / 1024), "KB");
