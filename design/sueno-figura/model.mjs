/* El modelo de la figura: el mismo que usa la app (SNM en app.js), sin cambiar un número.
   S = presión de sueño (sube despierto, tau 18,2 h; baja dormido, tau 4,2 h).
   C = reloj interno, con su máximo hacia las 17:00.
   Alerta = 100·(1 − S + 0,5·C) + café (hasta +15) − inercia al despertar, de 0 a 100. */
export const DT = 1 / 12;
export const C = (h) => { const x = ((h % 24) + 24) % 24; return 0.5 * Math.cos(2 * Math.PI * (x - 17) / 24) + 0.12 * Math.cos(4 * Math.PI * (x - 17) / 24); };
export const dormido = (p, t) => p.todo.some((s) => t >= s.a && t < s.b) ? 1 : 0;
export const cafe = (p, t) => p.cafes.reduce((c, x) => { const d = t - x.t; return d > 0 ? c + (x.mg || 80) * (1 - Math.exp(-d / 0.5)) * Math.exp(-d * Math.LN2 / 5) : c; }, 0);
export const inercia = (p, t) => p.todo.reduce((r, s) => { const d = t - s.b; return d >= 0 && d < 0.34 && s.b - s.a > 0.4 ? Math.max(r, 18 * (1 - d / 0.34)) : r; }, 0);
export function sim(p, t0, t1) {
  const out = []; let S = 0.72, t = t0 - 7;
  while (t <= t1 + 1e-9) {
    const z = dormido(p, t);
    S = z ? S * Math.exp(-z * DT / 4.2) : 1 - (1 - S) * Math.exp(-DT / 18.2);
    if (t >= t0 - 1e-9) {
      const c = cafe(p, t);
      out.push({ t, S, z, c, C: C(t), A: z ? null : Math.max(0, Math.min(100, 100 * (1 - S + 0.5 * C(t)) + Math.min(15, 9 * c / 80) - inercia(p, t))) });
    }
    t += DT;
  }
  return out;
}
/* una guardia típica, como la monta la app por defecto (snBase): la noche de antes 23:30–7:00, la
   guardia de 15:00 a 8:00 con un rato de descanso de 2:00 a 4:00, tres cafés (15:30, 21:00 y 2:00),
   llegar a las 8:30, siesta de hora y media y la cama de la noche siguiente a las 23:30 */
export const GUARDIA = {
  de: 15, sale: 32, llega: 32.5,
  todo: [
    { a: -0.5, b: 7, txt: "noche de antes" },
    { a: 26, b: 28, txt: "descanso en la guardia" },
    { a: 32.5, b: 34, txt: "siesta al llegar" },
    { a: 47.5, b: 55.5, txt: "a la cama" },
  ],
  cafes: [{ t: 15.5, mg: 80 }, { t: 21, mg: 80 }, { t: 26, mg: 80 }],
};
export const T0 = 7, T1 = 47.5;
export const SERIE = sim(GUARDIA, T0 - 1, T1 + 0.5);
export const en = (t) => SERIE[Math.max(0, Math.min(SERIE.length - 1, Math.round((t - SERIE[0].t) / DT)))];
export const estado = (A) => A == null ? "durmiendo" : A < 35 ? "riesgo" : A < 55 ? "flojo" : "despejado";
