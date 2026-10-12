/* El modelo de la figura: el mismo que usa la app (SNM en app.js), sin cambiar un número.
   S = presión de sueño (sube despierto, tau 18,2 h; baja dormido, tau 4,2 h).
   C = reloj interno, con su máximo hacia las 17:00.
   Alerta = 100·(1 − S + 0,5·C) + café (hasta +15) − inercia al despertar, de 0 a 100.
   Las horas cuentan desde las 0:00 del día de la guardia (las 2:00 de la noche son 26). */
export const DT = 1 / 12;
export const C = (h) => { const x = ((h % 24) + 24) % 24; return 0.5 * Math.cos(2 * Math.PI * (x - 17) / 24) + 0.12 * Math.cos(4 * Math.PI * (x - 17) / 24); };
export const dormido = (p, t) => p.todo.some((s) => t >= s.a && t < s.b) ? 1 : 0;
export const cafe = (p, t) => p.cafes.reduce((c, x) => { const d = t - x.t; return d > 0 ? c + (x.mg || 80) * (1 - Math.exp(-d / 0.5)) * Math.exp(-d * Math.LN2 / 5) : c; }, 0);
export const inercia = (p, t) => p.todo.reduce((r, s) => { const d = t - s.b; return d >= 0 && d < 0.34 && s.b - s.a > 0.4 ? Math.max(r, 18 * (1 - d / 0.34)) : r; }, 0);
export const cafeExtra = (c) => Math.min(15, 9 * c / 80);
export function sim(p, t0, t1) {
  const out = []; let S = 0.72, t = t0 - 7;
  while (t <= t1 + 1e-9) {
    const z = dormido(p, t);
    S = z ? S * Math.exp(-z * DT / 4.2) : 1 - (1 - S) * Math.exp(-DT / 18.2);
    if (t >= t0 - 1e-9) {
      const c = cafe(p, t);
      out.push({ t, S, z, c, C: C(t), A: z ? null : Math.max(0, Math.min(100, 100 * (1 - S + 0.5 * C(t)) + cafeExtra(c) - inercia(p, t))) });
    }
    t += DT;
  }
  return out;
}
/* una guardia típica, como la monta la app por defecto (snBase): la noche de antes 23:30–7:00, la
   guardia de 15:00 a 8:00 con un rato de descanso de 2:00 a 4:00, tres cafés (15:30, 21:00 y 2:00),
   llegar a las 8:30, siesta de hora y media y la cama de la noche siguiente a las 23:30 */
export const GUARDIA = {
  label: "", wake: 7, de: 15, sale: 32, llega: 32.5, cama: 47.5,
  todo: [
    { a: -0.5, b: 7, txt: "la noche de antes" },
    { a: 26, b: 28, txt: "descanso en la guardia" },
    { a: 32.5, b: 34, txt: "siesta al llegar" },
    { a: 47.5, b: 55.5, txt: "a la cama" },
  ],
  cafes: [{ t: 15.5, mg: 80 }, { t: 21, mg: 80 }, { t: 26, mg: 80 }],
};
/* el plan que manda la app en la dirección (#p=…): se valida número a número; si algo no cuadra,
   la guardia típica. No sale del móvil: lo que va detrás de # nunca se envía a ningún servidor */
export function planDe(hash) {
  try {
    const m = /[#&]p=([^&]+)/.exec(hash || ""); if (!m) return GUARDIA;
    const o = JSON.parse(decodeURIComponent(m[1])), n = (v, a, b) => typeof v === "number" && isFinite(v) && v >= a && v <= b;
    if (!Array.isArray(o.todo) || !Array.isArray(o.cafes)) return GUARDIA;
    const sinGuardia = o.g === false;   // un día normal: tu reloj de hoy con lo que has dormido
    if (!sinGuardia && (!n(o.de, 0, 30) || !n(o.sale, o.de, 60))) return GUARDIA;
    const todo = o.todo.filter((s) => s && n(s.a, -24, 80) && n(s.b, s.a, 90)).slice(0, 12).map((s) => ({ a: s.a, b: s.b, txt: String(s.txt || "durmiendo").slice(0, 40) }));
    const cafes = o.cafes.filter((c) => c && n(c.t, -24, 80)).slice(0, 8).map((c) => ({ t: c.t, mg: n(c.mg, 1, 400) ? c.mg : 80 }));
    if (sinGuardia) {
      if (!n(o.t0, -24, 48) || !n(o.t1, o.t0 + 2, 72)) return GUARDIA;
      return { label: String(o.label || "").slice(0, 40), g: false, wake: n(o.wake, -12, 30) ? o.wake : 7, de: null, sale: null, llega: null, cama: n(o.cama, 0, 60) ? o.cama : 23.5, todo, cafes, t0: o.t0, t1: o.t1 };
    }
    return { label: String(o.label || "").slice(0, 40), wake: n(o.wake, 0, 30) ? o.wake : 7, de: o.de, sale: o.sale, llega: n(o.llega, o.sale, 60) ? o.llega : o.sale, cama: n(o.cama, o.sale, 60) ? o.cama : 47.5, todo, cafes };
  } catch (e) { return GUARDIA; }
}
/* la regla: desde que te levantas el día de la guardia hasta que te acuestas la noche siguiente */
export const rangoDe = (p) => p.g === false ? { T0: p.t0, T1: p.t1 } : ({ T0: Math.max(4, Math.floor(Math.min(p.wake, p.de) * 2) / 2), T1: Math.min(50, Math.max(p.sale + 4, p.cama)) });
export const estado = (A) => A == null ? "durmiendo" : A < 35 ? "riesgo" : A < 55 ? "flojo" : "despejado";
