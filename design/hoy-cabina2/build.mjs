// node design/hoy-cabina2/build.mjs → maqueta.html + shots/*.png
// La cabina con mandos de verdad: ventana alta, el conductor mira a la izquierda (la ciudad: los eventos y lo
// que toca hoy) o a la derecha (el río y la montaña: entreno, comida, hábitos); la radio es el sueño y la
// palanca de cambios mueve el día (R ayer · N hoy · D mañana). Todo dibujado a mano en SVG (600 × 900).
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const W = 600, H = 900, r1 = (v) => Math.round(v * 10) / 10;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const T = (x, y, s, size, fill, w = 700, anchor = "start", extra = "") => `<text x="${r1(x)}" y="${r1(y)}" font-size="${size}" font-weight="${w}" fill="${fill}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
const P = (pts, fill, extra = "") => `<path d="M${pts.map((p) => r1(p[0]) + " " + r1(p[1])).join("L")}Z" fill="${fill}" ${extra}/>`;
const R = (x, y, w, h, rx, fill, extra = "") => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${rx}" fill="${fill}" ${extra}/>`;

/* ---------- la carretera de frente, en perspectiva ---------- */
const CX = 300, HY = 262, F = 300, EYE = 2.4;
const pr = (x, y, z) => [CX + F * x / z, HY + F * (EYE - y) / z];
const quad = (a, b, c, d, fill, extra = "") => P([pr(...a), pr(...b), pr(...c), pr(...d)], fill, extra);
const VENT = "M38 56 Q300 42 562 56 L580 576 Q300 598 20 576 Z";

function frente() {
  const o = [];
  o.push(`<defs><linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f93d8"/><stop offset="1" stop-color="#cfe6ff"/></linearGradient>
    <clipPath id="vent"><path d="${VENT}"/></clipPath></defs>`);
  o.push(`<g clip-path="url(#vent)">`);
  o.push(R(0, 0, W, 600, 0, "url(#cielo)"));
  // el sol y dos nubes
  o.push(`<circle cx="470" cy="118" r="38" fill="#fff6c8" opacity=".35"/><circle cx="470" cy="118" r="20" fill="#fff3b8"/>`);
  for (const [x, y, s] of [[150, 110, 1], [360, 150, 0.7]]) o.push(`<g fill="#fff" opacity=".85"><ellipse cx="${x}" cy="${y}" rx="${46 * s}" ry="${14 * s}"/><ellipse cx="${x + 22 * s}" cy="${y - 9 * s}" rx="${24 * s}" ry="${13 * s}"/></g>`);
  // a lo lejos: la montaña (derecha) y la ciudad (izquierda), anticipando lo que se ve al girar la cabeza
  o.push(P([[300, HY], [360, 214], [400, 228], [452, 186], [520, 230], [600, 210], [600, HY]], "#7d97b6"));
  o.push(P([[452, 186], [470, 200], [440, 202]], "#eef4fb"));
  for (let i = 0; i < 9; i++) { const x = 30 + i * 30, h = 20 + ((i * 37) % 5) * 9; o.push(R(x, HY - h, 26, h, 1, i % 2 ? "#8ea3c0" : "#99aecb")); }
  o.push(R(0, HY, W, 340, 0, "#3b4352"));
  // la calzada, las aceras y las líneas
  o.push(quad([-4.6, 0, 1.2], [3.2, 0, 1.2], [3.2, 0, 300], [-4.6, 0, 300], "#262c36"));
  o.push(quad([3.2, 0.15, 1.2], [8, 0.15, 1.2], [8, 0.15, 300], [3.2, 0.15, 300], "#59616f"));
  o.push(quad([-10, 0.15, 1.2], [-4.6, 0.15, 1.2], [-4.6, 0.15, 300], [-10, 0.15, 300], "#59616f"));
  o.push(quad([3.0, 0.02, 1.2], [3.1, 0.02, 1.2], [3.1, 0.02, 300], [3.0, 0.02, 300], "#d8dde6"));
  o.push(quad([-4.4, 0.02, 1.2], [-4.3, 0.02, 1.2], [-4.3, 0.02, 300], [-4.4, 0.02, 300], "#d8dde6"));
  for (let z = 2; z < 120; z += 6) o.push(quad([-0.75, 0.01, z], [-0.62, 0.01, z], [-0.62, 0.01, z + 3], [-0.75, 0.01, z + 3], "#d8dde6"));
  // a la izquierda, la ciudad (fachadas que miran a la calle)
  const cols = ["#4b5a78", "#3a4763", "#5b6a8a", "#43506d"];
  for (let j = 7; j >= 0; j--) {
    const z0 = 3 + j * 12, z1 = z0 + 10, h = 7 + ((j * 53) % 7);
    o.push(quad([-10.4, 0, z0], [-10.4, 0, z1], [-10.4, h, z1], [-10.4, h, z0], cols[j % 4]));
    o.push(quad([-10.4, 0, z0], [-30, 0, z0], [-30, h, z0], [-10.4, h, z0], "#2e3850"));
    for (let y = 1.6; y < h - 1; y += 2.6) for (let z = z0 + 1; z < z1 - 1.2; z += 2.3) o.push(quad([-10.38, y, z], [-10.38, y, z + 1.2], [-10.38, y + 1.3, z + 1.2], [-10.38, y + 1.3, z], "#1a2236"));
  }
  // a la derecha, árboles y el río que asoma
  for (let j = 9; j >= 0; j--) {
    const z = 4 + j * 9, [x, y] = pr(9.5, 0, z), s = F / z;
    o.push(`<rect x="${r1(x - 0.12 * s)}" y="${r1(y - 1.6 * s)}" width="${r1(0.24 * s)}" height="${r1(1.6 * s)}" fill="#4a3527"/><circle cx="${r1(x)}" cy="${r1(y - 2.4 * s)}" r="${r1(1.2 * s)}" fill="${j % 2 ? "#3f8a4f" : "#2f7a52"}"/>`);
  }
  // la marquesina de la parada con el cartel de lo que toca ahora
  const a = pr(4.6, 0, 9), b = pr(4.6, 3.2, 9), c = pr(7.4, 3.2, 12);
  o.push(`<path d="M${r1(a[0])} ${r1(a[1])}V${r1(b[1])}" stroke="#6c7686" stroke-width="5"/>`);
  o.push(P([pr(4.4, 3.2, 8.6), pr(7.6, 3.2, 8.6), pr(7.6, 3.4, 12.4), pr(4.4, 3.4, 12.4)], "#7f8ea6"));
  o.push(P([pr(4.7, 0.6, 9.2), pr(4.7, 3.1, 9.2), pr(4.7, 3.1, 12), pr(4.7, 0.6, 12)], "#9fd0ff", 'opacity=".25"'));
  const sx = b[0] - 84;
  o.push(R(sx, b[1] - 92, 150, 70, 8, "#0b1020", 'stroke="#ffd66b" stroke-width="2"'), R(sx, b[1] - 92, 8, 70, 3, "#d9573f"));
  o.push(T(sx + 18, b[1] - 66, "10:30", 17, "#8fa6c6", 700, "start", 'font-family="ui-monospace,Menlo,monospace"'), T(sx + 18, b[1] - 38, "TRABAJO", 25, "#ffd66b", 900));
  o.push(`</g>`);
  return o.join("");
}

/* ---------- mirando a la izquierda: la ciudad, con los eventos colgados en sus fachadas ---------- */
function izquierda() {
  const o = [];
  o.push(`<defs><linearGradient id="cieloI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f93d8"/><stop offset="1" stop-color="#d7ebff"/></linearGradient>
    <clipPath id="ventI"><path d="M34 70 Q300 58 566 70 L566 704 Q300 716 34 704 Z"/></clipPath></defs>`);
  o.push(`<g clip-path="url(#ventI)">`, R(0, 0, W, 760, 0, "url(#cieloI)"), `<g fill="#fff" opacity=".8"><ellipse cx="420" cy="110" rx="56" ry="15"/><ellipse cx="446" cy="98" rx="28" ry="14"/><ellipse cx="140" cy="150" rx="40" ry="11"/></g>`, `<g transform="translate(0 130)">`);
  // al fondo, la torre del examen y el hospital de la guardia, más pálidos (lo que viene)
  o.push(R(70, 120, 92, 330, 2, "#9fb3cf"), R(84, 106, 64, 18, 2, "#9fb3cf"));
  for (let y = 140; y < 440; y += 26) for (let x = 80; x < 156; x += 20) o.push(R(x, y, 12, 14, 1, "#b9c9de"));
  o.push(R(178, 190, 150, 260, 2, "#c3cfdf"), R(232, 204, 42, 14, 2, "#e5484d"), R(246, 190, 14, 42, 2, "#e5484d"));
  for (let y = 240; y < 440; y += 26) for (let x = 190; x < 320; x += 24) o.push(R(x, y, 14, 14, 1, "#dfe7f2"));
  // los dos carteles de lo que viene, como vallas en las azoteas
  o.push(R(54, 70, 196, 46, 8, "#0b1020", 'stroke="#ef4444" stroke-width="2"'), T(68, 92, "EXAMEN DE LA ROTACIÓN", 14, "#e9f2ff", 800), T(68, 108, "dentro de 12 días", 12, "#ffb3a7", 700));
  o.push(R(178, 136, 166, 46, 8, "#0b1020", 'stroke="#ffd66b" stroke-width="2"'), T(192, 158, "☾ GUARDIA · lun 19", 14, "#e9f2ff", 800), T(192, 174, "dentro de 4 días", 12, "#ffd66b", 700));
  // delante, los edificios de hoy con su evento en la fachada
  o.push(R(350, 168, 230, 290, 3, "#5b6a8a"));
  for (let y = 250; y < 450; y += 30) for (let x = 362; x < 570; x += 28) o.push(R(x, y, 16, 18, 2, "#1a2236"));
  o.push(R(352, 182, 212, 56, 8, "#0b1020", 'stroke="#1fa6c4" stroke-width="2.5"'), T(364, 206, "10:00 SESIÓN GENERAL", 15, "#e9f2ff", 900), T(364, 226, "✓ hecha · en el hospital", 13, "#4ad08a", 700));
  o.push(R(20, 300, 150, 160, 3, "#43506d"), R(20, 290, 150, 16, 2, "#7a5cf0"));
  for (let y = 330; y < 450; y += 30) for (let x = 30; x < 160; x += 26) o.push(R(x, y, 14, 18, 2, "#1a2236"));
  o.push(R(26, 250, 170, 52, 8, "#0b1020", 'stroke="#7a5cf0" stroke-width="2.5"'), T(40, 272, "19:30 PÁDEL", 17, "#e9f2ff", 900), T(40, 291, "dentro de 8 h 30", 13, "#c9bfff", 700));
  // la acera y el quiosco de «Para hoy», con sus tres papeles
  o.push(R(0, 456, W, 200, 0, "#59616f"), R(0, 456, W, 6, 0, "#9aa3b2"), R(0, 540, W, 120, 0, "#262c36"), R(0, 540, W, 5, 0, "#9aa3b2"));
  o.push(R(186, 352, 196, 118, 10, "#1f6b4f"), R(176, 340, 216, 20, 6, "#2f9e6b"), T(284, 355, "PARA HOY · 0 de 3", 13, "#eafff4", 900, "middle"));
  const pap = (y, t, s) => R(194, y, 180, 30, 3, "#f3efe4") + R(200, y + 8, 12, 12, 3, "none", 'stroke="#c46a1a" stroke-width="2"') + T(218, y + 14, t, 12, "#1d2b40", 800) + T(218, y + 26, s, 9.5, "#4a5d78", 600);
  o.push(pap(366, "💾 Haz una copia", "nunca la has guardado"), pap(400, "💳 Alquiler · 650 €", "toca pagar hoy"), pap(434, "📝 Llamar al tutor", "nota de ayer"));
  // la farola
  o.push(`<path d="M520 470V300q0-14 14-14h18" stroke="#6c7686" stroke-width="6" fill="none"/><rect x="546" y="280" width="22" height="10" rx="3" fill="#9aa3b2"/>`);
  o.push(`</g></g>`);
  return o.join("");
}

/* ---------- mirando a la derecha: el río y la montaña (entreno, comida, hábitos) ---------- */
function derecha() {
  const o = [];
  o.push(`<defs><linearGradient id="cieloD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5aa0e0"/><stop offset="1" stop-color="#e3f1ff"/></linearGradient>
    <linearGradient id="rio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c8fc4"/><stop offset="1" stop-color="#1d5a8a"/></linearGradient>
    <clipPath id="ventD"><path d="M34 70 Q300 58 566 70 L566 704 Q300 716 34 704 Z"/></clipPath></defs>`);
  o.push(`<g clip-path="url(#ventD)">`, R(0, 0, W, 760, 0, "url(#cieloD)"), `<circle cx="120" cy="120" r="34" fill="#fff6c8" opacity=".35"/><circle cx="120" cy="120" r="18" fill="#fff3b8"/>`, `<g transform="translate(0 130)">`);
  // la montaña con el polideportivo en la ladera
  o.push(P([[0, 380], [120, 200], [190, 250], [300, 110], [430, 260], [520, 210], [600, 300], [600, 400], [0, 400]], "#6f8aa8"));
  o.push(P([[300, 110], [330, 150], [312, 146], [296, 160], [276, 142]], "#eef4fb"));
  o.push(P([[0, 400], [0, 330], [160, 300], [340, 320], [600, 290], [600, 400]], "#3d6b45"));
  o.push(R(330, 236, 150, 70, 4, "#4b3f7a"), P([[322, 238], [405, 206], [488, 238]], "#3a3163"), R(392, 268, 26, 38, 2, "#ffe7a6"));
  o.push(R(300, 178, 214, 52, 8, "#0b1020", 'stroke="#9c86ff" stroke-width="2.5"'), T(314, 200, "🏋 17:30 FUERZA", 17, "#e9e4ff", 900), T(314, 220, "0 de 4 esta semana · mín. 4", 12.5, "#c9bfff", 700));
  // el río
  o.push(P([[0, 410], [600, 392], [600, 470], [0, 488]], "url(#rio)"));
  for (let i = 0; i < 18; i++) { const x = (i * 71) % 600, y = 420 + ((i * 29) % 56); o.push(`<path d="M${x} ${y}h${18 + (i % 3) * 8}" stroke="#bcd6ee" stroke-width="2" opacity=".55" stroke-linecap="round"/>`); }
  // la orilla de acá, con el merendero de la comida y los postes de los hábitos
  o.push(P([[0, 488], [600, 470], [600, 660], [0, 660]], "#46784d"));
  o.push(R(30, 362, 170, 92, 6, "#8a6a48"), P([[22, 366], [115, 328], [208, 366]], "#c9302c"), R(44, 392, 142, 50, 4, "#f3efe4"));
  o.push(T(115, 412, "🍽 15:20 COMIDA", 14, "#1d2b40", 900, "middle"), T(115, 432, "640 / 2 400 kcal", 12, "#2f9e6b", 800, "middle"));
  // el poste de madera con las flechas de los hábitos, cada una con su luz
  o.push(`<rect x="374" y="420" width="10" height="150" fill="#6b4c32"/>`);
  const flecha = (y, t, on, col) => P([[384, y], [536, y], [554, y + 13], [536, y + 26], [384, y + 26]], "#a07650") + `<circle cx="398" cy="${y + 13}" r="5.5" fill="${col || (on ? "#4ad08a" : "#2a3a55")}"/>` + T(410, y + 18, t, 12.5, "#fff8ec", 800);
  o.push(flecha(420, "💧 agua 2 L", true), flecha(452, "📚 10 min de test", false), flecha(484, "🛌 cama 23:00", false), flecha(516, "🚕 taxi · 7 este mes", false, "#f2a33a"));
  o.push(`</g></g>`);
  return o.join("");
}

/* ---------- el marco de la cabina (pilares, techo, retrovisores) ---------- */
function marco(vista) {
  const o = [];
  o.push(`<path fill="#0a0e16" fill-rule="evenodd" d="M0 0H600V${vista === "frente" ? 600 : 724}H0Z ${vista === "frente" ? VENT : "M34 70 Q300 58 566 70 L566 704 Q300 716 34 704 Z"}"/>`);
  o.push(`<path d="${vista === "frente" ? VENT : "M34 70 Q300 58 566 70 L566 704 Q300 716 34 704 Z"}" fill="none" stroke="#1e2738" stroke-width="4"/>`);
  if (vista === "frente") {
    o.push(P([[0, 44], [38, 56], [20, 576], [0, 600]], "#111724"), P([[600, 44], [562, 56], [580, 576], [600, 600]], "#111724"));
    // el parasol con la rotación y el retrovisor con la parada de antes
    o.push(`<path d="M62 54 Q150 48 240 51 L236 82 Q150 80 68 84 Z" fill="#161d2c"/>`, T(152, 72, "📷 RAYOS · RADIOLOGÍA", 12.5, "#ffd66b", 800, "middle"));
    o.push(R(250, 56, 116, 34, 9, "#0e1420", 'stroke="#2a3448" stroke-width="2"'), R(296, 44, 8, 13, 2, "#111724"), T(308, 78, "✓ 10:00 Sesión", 12.5, "#8fa6c6", 700, "middle"));
    // los dos retrovisores laterales: son los botones para mirar a cada lado
    for (const [x, lado] of [[0, -1], [600, 1]]) {
      const cx = x + lado * -30, cy = 520;
      o.push(`<g><ellipse cx="${cx}" cy="${cy}" rx="34" ry="42" fill="#1b2333" stroke="${lado < 0 ? "#38e1ff" : "#4ad08a"}" stroke-width="3"/>` +
        `<ellipse cx="${cx}" cy="${cy}" rx="26" ry="34" fill="${lado < 0 ? "#5b6a8a" : "#46784d"}"/>` +
        (lado < 0 ? R(cx - 16, cy - 14, 10, 30, 1, "#2e3850") + R(cx - 3, cy - 24, 12, 40, 1, "#3a4763") + R(cx + 11, cy - 4, 8, 20, 1, "#2e3850")
          : P([[cx - 22, cy + 6], [cx - 6, cy - 20], [cx + 8, cy - 6], [cx + 22, cy - 18], [cx + 22, cy + 30], [cx - 22, cy + 30]], "#6f8aa8") + R(cx - 26, cy + 10, 52, 10, 0, "#4c8fc4")) +
        `</g>`);
    }
  } else {
    // la ventanilla lateral: la goma, la manilla de subir el cristal y el marco de la puerta
    o.push(R(30, 40, 540, 18, 4, "#161d2c"), T(300, 54, vista === "izq" ? "◀ MIRANDO A LA IZQUIERDA · TU DÍA EN LA CIUDAD" : "MIRANDO A LA DERECHA · TU CUERPO EN EL CAMPO ▶", 12, "#8fa6c6", 800, "middle", 'letter-spacing=".08em"'));
  }
  return o.join("");
}

/* ---------- la parte de abajo: pocos mandos y de verdad ---------- */
function salpicadero(vista, radioAbierta) {
  const o = [];
  if (vista !== "frente") {
    // la puerta: panel, reposabrazos, manilla; y el botón para volver a mirar al frente
    o.push(R(0, 720, W, 180, 0, "#151c2a"), `<path d="M0 744 Q300 724 600 744" stroke="#2a3448" stroke-width="3" fill="none"/>`);
    o.push(R(40, 786, 520, 44, 22, "#1f2838"), R(70, 798, 110, 20, 10, "#0d1320"));
    o.push(R(170, 836, 260, 54, 27, "#0d1726", 'stroke="#ffd66b" stroke-width="2.5"'), T(300, 870, vista === "izq" ? "volver al frente ▶" : "◀ volver al frente", 20, "#ffd66b", 800, "middle"));
    o.push(T(300, 770, vista === "izq" ? "toca un cartel para abrir el evento · el quiosco marca lo de hoy" : "toca el poste para marcar un hábito · el merendero apunta la comida", 13, "#8fa6c6", 600, "middle"));
    return o.join("");
  }
  o.push(`<path d="M0 620 Q300 584 600 620 V900 H0Z" fill="#151c2a"/><path d="M0 620 Q300 584 600 620" stroke="#2a3448" stroke-width="2" fill="none"/>`);
  // el reloj del cuadro, detrás del volante: la hora y cuánto queda de lo de ahora, nada más
  o.push(R(196, 612, 208, 82, 22, "#04131a", 'stroke="#1d3340" stroke-width="2"'));
  o.push(`<path d="M222 668 A80 52 0 0 1 378 668" stroke="#1f2a3d" stroke-width="6" fill="none"/><path d="M222 668 A80 52 0 0 1 322 617" stroke="#38e1ff" stroke-width="6" fill="none" stroke-linecap="round"/>`);
  o.push(T(300, 664, "11:00", 32, "#7fecff", 700, "middle", 'font-family="ui-monospace,Menlo,monospace"'), T(300, 686, "trabajo · quedan 4 h", 12, "#8fa6c6", 700, "middle"));
  // el volante, con las dos manos
  o.push(`<circle cx="300" cy="900" r="196" fill="none" stroke="#263044" stroke-width="26"/><path d="M168 846 Q300 800 432 846 L420 870 Q300 830 180 870Z" fill="#263044"/><circle cx="300" cy="880" r="54" fill="#2a3448"/>`);
  const mano = (x, y, f) => `<g transform="translate(${x} ${y}) scale(${f} 1)"><path d="M-17 4 Q-18 -11 -8 -13 L9 -13 Q18 -11 17 -1 L16 11 Q7 18 -8 15 Q-17 12 -17 4Z" fill="#e3b08e" stroke="#b07a52" stroke-width="1.3"/><path d="M-12 -3 Q-6 -8 0 -3 M-9 3 Q-3 -1 3 3" stroke="#b07a52" stroke-width="1" fill="none"/><path d="M-19 11 Q-20 22 -9 25 L9 25 Q20 22 19 11 L16 11 Q7 18 -8 15 Q-17 12 -17 4Z" fill="#2f5fb3"/></g>`;
  o.push(mano(152, 760, 1), mano(448, 760, -1));
  // la máquina de los billetes (Para hoy), a la izquierda, con su tique asomando
  o.push(R(20, 628, 140, 74, 10, "#1b2333", 'stroke="#2a3448" stroke-width="2"'), R(32, 610, 116, 28, 2, "#f3efe4"), T(90, 629, "PARA HOY · 3", 13, "#1d2b40", 900, "middle"));
  o.push(R(32, 656, 116, 18, 4, "#04131a"), T(90, 670, "0 de 3 hechas", 11, "#7fecff", 700, "middle"), `<circle cx="44" cy="690" r="4" fill="#38e1ff"/>`);
  // la palanca de cambios, abajo a la izquierda: R ayer · N hoy · D mañana
  o.push(R(18, 770, 144, 118, 18, "#10151f", 'stroke="#2a3448" stroke-width="2"'));
  o.push(`<path d="M44 830H136" stroke="#3a4458" stroke-width="7" stroke-linecap="round"/>`);
  [[44, "R", "ayer"], [90, "N", "hoy"], [136, "D", "mañana"]].forEach(([x, l, w]) => o.push(T(x, 856, l, 15, l === "N" ? "#ffd66b" : "#8fa6c6", 900, "middle"), T(x, 876, w, 11, l === "N" ? "#ffd66b" : "#5d7394", 700, "middle")));
  o.push(`<path d="M90 830L90 784" stroke="#5d6676" stroke-width="9" stroke-linecap="round"/><circle cx="90" cy="776" r="16" fill="#2a3448" stroke="#ffd66b" stroke-width="2.5"/><circle cx="85" cy="771" r="5" fill="#5d6676"/>`);
  // la radio, en la consola de la derecha: es el sueño
  if (!radioAbierta) {
    o.push(R(440, 628, 140, 92, 12, "#10151f", 'stroke="#2a3448" stroke-width="2"'), R(452, 640, 116, 30, 5, "#061a10"));
    o.push(T(510, 655, "📻 RADIO SUEÑO", 11.5, "#7cf0b0", 800, "middle"), T(510, 666, "97.5 · anoche 7,5 h", 9.5, "#4ad08a", 700, "middle"));
    o.push(`<circle cx="470" cy="696" r="12" fill="#2a3448" stroke="#5d6676" stroke-width="2"/><circle cx="550" cy="696" r="12" fill="#2a3448" stroke="#5d6676" stroke-width="2"/>`);
    for (let i = 0; i < 4; i++) o.push(R(488 + i * 11, 690, 8, 12, 2, "#1f2a3d"));
    o.push(T(510, 736, "toca para oírla", 11, "#5d7394", 700, "middle"));
  }
  // las etiquetas de los retrovisores: a la izquierda los eventos, a la derecha el cuerpo
  o.push(R(4, 576, 92, 26, 13, "#0d1726", 'stroke="#38e1ff" stroke-width="2"'), T(50, 594, "◀ eventos", 13, "#7fecff", 800, "middle"));
  o.push(R(486, 576, 110, 26, 13, "#0d1726", 'stroke="#4ad08a" stroke-width="2"'), T(541, 594, "entreno ▶", 13, "#7cf0b0", 800, "middle"));
  return o.join("");
}

/* ---------- la radio abierta: el sueño, con los botones de emisora como la escala de cómo amaneces ---------- */
function radio() {
  const o = [];
  o.push(`<rect x="0" y="560" width="600" height="340" fill="#000" opacity=".35"/>`);
  o.push(R(40, 590, 520, 290, 22, "#10151f", 'stroke="#ffd66b" stroke-width="2.5"'));
  o.push(R(62, 612, 476, 104, 10, "#061a10"));
  o.push(T(80, 640, "📻 RADIO SUEÑO · 97.5 FM", 17, "#7cf0b0", 900), T(80, 670, "Anoche dormiste 7,5 h de 8", 21, "#c8ffe0", 800), T(80, 696, "ayer 6,2 h · a la cama hoy 23:00 · último café 17:00", 13, "#4ad08a", 700));
  o.push(T(80, 744, "¿CÓMO AMANECES? — los botones de emisora", 12, "#8fa6c6", 800));
  for (let i = 1; i <= 9; i++) { const x = 72 + (i - 1) * 52, on = i === 3; o.push(R(x, 756, 44, 40, 8, on ? "#ffd66b" : "#1b2333", 'stroke="' + (on ? "#ffd66b" : "#3a4458") + '" stroke-width="2"'), T(x + 22, 783, String(i), 18, on ? "#06101a" : "#c9d4e4", 900, "middle")); }
  o.push(T(72, 816, "1 muy despierto", 11, "#5d7394", 700), T(528, 816, "9 me caigo", 11, "#5d7394", 700, "end"));
  // los dos mandos: el volumen es el ánimo y el dial, lo que te propones hoy
  o.push(`<circle cx="120" cy="852" r="18" fill="#2a3448" stroke="#ffd66b" stroke-width="2"/><path d="M120 852L128 840" stroke="#ffd66b" stroke-width="3" stroke-linecap="round"/>`, T(146, 857, "ánimo 🙂", 13, "#e9f2ff", 700));
  o.push(`<circle cx="330" cy="852" r="18" fill="#2a3448" stroke="#38e1ff" stroke-width="2"/><path d="M330 852L318 842" stroke="#38e1ff" stroke-width="3" stroke-linecap="round"/>`, T(356, 857, "hoy: salir a tiempo", 13, "#e9f2ff", 700));
  return o.join("");
}

function linea() {
  const o = [R(40, 8, 520, 26, 7, "#05070c", 'stroke="#1e2738" stroke-width="1.2"'), T(52, 25, "LÍNEA DE HOY", 10, "#5d7394", 800, "start", 'letter-spacing=".06em"')];
  o.push(`<path d="M150 21H540" stroke="#2a3a55" stroke-width="2"/>`);
  [[160, "#4ad08a"], [220, "#4ad08a"], [290, "#38e1ff"], [370, "#56708f"], [440, "#ffd66b"], [530, "#2a3a55"]].forEach(([x, c]) => o.push(`<circle cx="${x}" cy="21" r="4.5" fill="${c}"/>`));
  return o.join("");
}
const svg = (vista, radioAbierta) => `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="ui-sans-serif,system-ui,sans-serif" role="img">` +
  `<rect width="${W}" height="${H}" fill="#0a0e16"/>` + (vista === "frente" ? frente() : vista === "izq" ? izquierda() : derecha()) + marco(vista) + linea() + salpicadero(vista, radioAbierta) + (radioAbierta ? radio() : "") + `</svg>`;

const ART = [
  ["F", "Al frente", svg("frente", false), "La ventana es el doble de alta (la carretera llega hasta el volante). Abajo solo hay mandos: el reloj del cuadro (la hora y cuánto queda de lo de ahora), la máquina de los billetes con «Para hoy», la palanca de cambios (R ayer · N hoy · D mañana) y la radio. Los dos retrovisores son los botones para mirar a cada lado."],
  ["I", "Retrovisor izquierdo → mira a la izquierda", svg("izq", false), "La ciudad: cada evento de hoy es un cartel en su edificio (la sesión ya hecha, el pádel con lo que falta). Al fondo, más pálidas, las vallas de lo importante que viene (el examen, la próxima guardia). En la acera, el quiosco con lo que hay que hacer hoy."],
  ["D", "Retrovisor derecho → mira a la derecha", svg("der", false), "El campo: el polideportivo en la ladera con el entreno de hoy y la cuenta de la semana; el merendero junto al río con la próxima comida y las kcal; el poste de madera con una flecha por hábito, cada una con su luz (verde hecho, ámbar el taxi de serie)."],
  ["R", "Tocas la radio → el sueño", svg("frente", true), "La radio se abre sobre el salpicadero: «Radio Sueño» dice lo dormido anoche y ayer, la hora de la cama y el último café. Los botones de emisora (1–9) son el «¿cómo amaneces?» de cada mañana; el volumen, el ánimo; el dial, lo que te propones hoy."],
];
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Maqueta · la cabina con mandos</title>
<style>*{box-sizing:border-box}body{margin:0;background:#070b14;color:#e9f2ff;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.ab{width:390px;margin:18px auto;padding:10px;background:#0b1120;border:1px solid #1e2b44;border-radius:16px}
.ab h3{margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8fa6c6}
.ab svg{display:block;width:100%;height:auto;border-radius:14px}.nota{font-size:12.5px;color:#8fa6c6;margin:8px 2px 0;line-height:1.45}
.todas{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;padding:8px}.todas .ab{margin:0}</style></head><body><div class="todas">
${ART.map(([id, t, s, n]) => `<div class="ab" id="${id}"><h3>${id} · ${esc(t)}</h3>${s}<p class="nota">${esc(n)}</p></div>`).join("\n")}
</div></body></html>`;
writeFileSync(join(HERE, "maqueta.html"), html);

const { chromium } = await import("/home/user/app-organizador-MIR/node_modules/playwright/index.mjs");
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const pg = await b.newPage({ viewport: { width: 420, height: 1200 }, deviceScaleFactor: 2 });
await pg.goto("file://" + join(HERE, "maqueta.html")); await pg.waitForTimeout(300);
for (const [id] of ART) { const el = await pg.$("#" + id); await el.screenshot({ path: join(HERE, "shots", id + ".png") }); }
await pg.setViewportSize({ width: 1660, height: 1200 }); await pg.waitForTimeout(300);
const caja = await pg.evaluate(() => { const r = [...document.querySelectorAll(".ab")].map((e) => e.getBoundingClientRect()); const x = Math.min(...r.map((q) => q.left)), y = Math.min(...r.map((q) => q.top));
  return { x: x - 8, y: Math.max(0, y - 8), width: Math.max(...r.map((q) => q.right)) - x + 16, height: Math.max(...r.map((q) => q.bottom)) - y + 16 }; });
await pg.screenshot({ path: join(HERE, "shots", "todas.png"), clip: caja });
console.log("ok", JSON.stringify(caja));
await b.close();
