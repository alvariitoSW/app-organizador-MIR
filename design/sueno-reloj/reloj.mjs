/* El reloj de arena del sueño: la geometría y el dibujo. Lo usa build.mjs para la imagen fija y la
   página para lo que se mueve (se pega tal cual, con k = el kit y G = lathe).
   - La arena es el cansancio (presión de sueño). Despierto, cae al bulbo de la banda de latón; al
     dormir el bastidor gira y ese bulbo se vacía, más rápido de lo que se llenó.
   - Detrás, una esfera de día y noche: el sol sube y baja con el reloj interno (lo más alto a las 17:00).
   - El café es un manguito de latón que tapa parte de la arena: el cansancio sigue ahí, no lo notas.
   - A la izquierda, la regla de la alerta con su cursor; delante, la regla de tu guardia. */
export function reloj(k, G, P) {
  const at = (p) => k.iso(p, P);
  const S = (paths, o) => k.solidSvg(paths, o);
  const L = (d, o) => k.lineSvg(d, o);
  const poly = (pts, closed = true) => k.pathOf(pts.map(at), closed);
  const dep = (p) => k.depthOf(p, P);
  const W = {};

  /* ---------- medidas (1 unidad ≈ 1 px del objeto) ---------- */
  W.PLATE = { x: -122, y: -52, w: 244, d: 104, r: 7 }; W.PLATE_H = 10; W.FOOT_H = 4;
  W.RX0 = -108; W.RX1 = 108;                                     // la regla del tiempo
  W.STRIP = { x: W.RX0 - 5, y: 37, w: W.RX1 - W.RX0 + 10, d: 9, r: 1.2 };
  W.RAIL_Y = 29; W.CAR = { w: 14, d: 11 };
  W.CUP_Y = 21;
  W.HG = [-34, -8]; W.PIV = 66;                                   // el reloj de arena y su eje
  W.CAP_S = 44; W.CAP_T = 5; W.CAP_R = 23; W.COL_R = 19.6; W.NECK = 2.1; W.BULB = 16.4;
  W.POST_DX = 29; W.POST = { w: 7, d: 12 };
  W.GAUGE = { x: -108, y: -32, w: 9, d: 8 }; W.G0 = 10; W.G1 = 100;   // la regla de la alerta
  W.DIAL = [72, -20]; W.DIAL_Z = 47; W.DIAL_R = 30; W.DISC_T = 3;     // la esfera de día y noche
  W.HOR_W = 36; W.HOR_H = W.DIAL_Z + 2;   // el horizonte, a la altura del centro: el sol asoma de 11:00 a 23:00
  W.DN = [Math.SQRT1_2, Math.SQRT1_2, 0]; W.DU = [Math.SQRT1_2, -Math.SQRT1_2, 0];   // de cara, en diagonal

  /* ---------- el cristal: dos bulbos unidos por un cuello ---------- */
  const bulbR = (s) => {
    const u = Math.min(1, Math.abs(s) / W.CAP_S), c = 0.56;
    const e = Math.sqrt(Math.max(0, 1 - ((u - c) / c) ** 2));
    return Math.max(W.NECK, W.NECK + (W.BULB - W.NECK) * e);
  };
  W.bulbR = bulbR;
  // volumen acumulado de un bulbo (de 0 a 1), desde la tapa (fondo) o desde el cuello
  const N = 120, cum = [0];
  for (let i = 1; i <= N; i++) { const s = W.CAP_S * (1 - (i - 0.5) / N); cum.push(cum[i - 1] + bulbR(s) ** 2); }
  const tot = cum[N];
  const desdeTapa = (f) => { const v = f * tot; let i = 0; while (i < N && cum[i + 1] < v) i++; const a = cum[i], b = cum[i + 1] ?? a; return W.CAP_S * (i + (b > a ? (v - a) / (b - a) : 0)) / N; };
  const desdeCuello = (f) => { const v = (1 - f) * tot; let i = 0; while (i < N && cum[i + 1] < v) i++; const a = cum[i], b = cum[i + 1] ?? a; return W.CAP_S - W.CAP_S * (i + (b > a ? (v - a) / (b - a) : 0)) / N; };
  W.LLENO = 0.62;                                                 // la arena llena el 62 % de un bulbo

  /* el marco del reloj, girado θ alrededor del eje x (0: el bulbo del cansancio abajo) */
  const frameAt = (th) => G.frameOf([W.HG[0], W.HG[1], W.PIV], [0, -Math.sin(th), Math.cos(th)], [1, 0, 0], [0, Math.cos(th), Math.sin(th)]);

  const glassMeridian = (() => { const m = []; for (let i = 0; i <= 40; i++) { const s = -W.CAP_S + (2 * W.CAP_S * i) / 40; m.push([s, bulbR(s), 1]); } return m; })();

  // arena de un bulbo: lado −1 (el del cansancio) o +1; f = parte del bulbo llena; abajo = si ese bulbo está abajo
  function sandOf(F, lado, f, abajo) {
    if (f < 0.004) return "";
    const h = abajo ? desdeTapa(f) : desdeCuello(f);
    // de la tapa al nivel (abajo) o del cuello al nivel (arriba); la cara libre es siempre el anillo del nivel
    const [a, b] = abajo ? [Math.max(W.CAP_S - h, 1.2), W.CAP_S - 0.4] : [0.6, Math.min(W.CAP_S - 0.4, h)];
    const nivel = abajo ? a : b, n = 10, prof = [];
    for (let i = 0; i <= n; i++) { const s = a + (b - a) * i / n; prof.push([lado * s, Math.max(0.6, bulbR(s) - 0.7)]); }
    if (lado < 0) prof.reverse();
    // la arena es grano: un relleno liso con la cara libre más clara (las bandas de tono escalonaban)
    const pa = G.solidOf(prof, F, P, { smooth: false, steps: 40 });
    const cara = G.circleOf(F, lado * nivel, Math.max(0.6, bulbR(nivel) - 0.7), P, 48);
    return S({ ...pa, shades: [], top: cara }, { tone: "mid", className: "m-sand", crease: "none" });
  }
  W.sandOf = sandOf;

  /* el reloj entero en su posición θ: arena, café y tiempo que corre (fase de los granos) */
  // lo que solo cambia al girar: tapas, aro, columnas y cristal → [[profundidad, svg], …]
  W.relojFijo = function (th) {
    const F = frameAt(th);
    const ax = (s) => G.pointOf(F, s, 0, 0);
    const items = [];
    const put = (p, svg) => items.push([dep(p), svg]);
    // las tapas: la del bulbo del cansancio, de latón (al dormir se ve arriba); la otra, de madera
    for (const sg of [-1, 1]) {
      const a = sg * W.CAP_S, b = sg * (W.CAP_S + W.CAP_T);
      const svg = S(G.disc(Math.min(a, b), Math.max(a, b), W.CAP_R, F, P, { steps: 56 }), { tone: "mid", className: sg < 0 ? "m-brass" : "m-wood" })
        + (sg < 0 ? L(G.arcOf(F, b, W.CAP_R - 5.5, P, { least: -1 }), { tone: "lo" }) : "")
        + k.dotsSvg(G.dotsOf(F, b, W.CAP_R - 3, 6, P, { all: true, phase: 0.5 }), { size: 0.55, tone: "hi" });
      put(ax(sg * (W.CAP_S + W.CAP_T / 2)), svg);
    }
    // las virolas de latón donde el cristal entra en cada tapa
    for (const sg of [-1, 1]) {
      const r0 = bulbR(sg * (W.CAP_S - 1));
      put(ax(sg * (W.CAP_S - 1.5)), S(G.ringBand(Math.min(sg * (W.CAP_S - 3.2), sg * W.CAP_S), Math.max(sg * (W.CAP_S - 3.2), sg * W.CAP_S), r0 - 0.6, r0 + 1.8, F, P), { tone: "mid", className: "m-brass" }));
    }
    const d0 = dep(ax(0));
    // cuatro columnas torneadas; las dos de los lados llevan en medio el buje donde entra el pivote
    for (let i = 0; i < 4; i++) {
      const an = i * Math.PI / 2 + Math.PI / 4 * 0, p = G.pointOf(F, 0, W.COL_R, an), lado = i % 2 === 0;
      const C = G.frameOf(p, F.a, F.u, F.v);
      const prof = lado
        ? [[-W.CAP_S, 2.4], [-W.CAP_S + 4, 2.4], [-W.CAP_S + 5, 1.6, 1], [-7, 1.5, 1], [-4.2, 3.2], [4.2, 3.2], [7, 1.5, 1], [W.CAP_S - 5, 1.6, 1], [W.CAP_S - 4, 2.4], [W.CAP_S, 2.4]]
        : [[-W.CAP_S, 2.4], [-W.CAP_S + 4, 2.4], [-W.CAP_S + 5, 1.6, 1], [-6, 1.5, 1], [-3, 2.2, 1], [3, 2.2, 1], [6, 1.5, 1], [W.CAP_S - 5, 1.6, 1], [W.CAP_S - 4, 2.4], [W.CAP_S, 2.4]];
      put(p, S(G.solidOf(prof, C, P, { smooth: false, steps: 14 }), { tone: "mid", className: lado ? "m-brass" : "m-wood" }));
    }
    const vidrio = G.outlineOf(glassMeridian, F, P, { smooth: true });
    const hl = []; for (let i = 0; i <= 12; i++) { const s = -W.CAP_S * 0.86 + i * W.CAP_S * 0.62 / 12; hl.push(at(G.pointOf(F, s, bulbR(s) * 0.8, 2.4))); }
    const hl2 = []; for (let i = 0; i <= 12; i++) { const s = W.CAP_S * 0.24 + i * W.CAP_S * 0.62 / 12; hl2.push(at(G.pointOf(F, s, bulbR(s) * 0.8, 2.4))); }
    items.push([d0, `<path class="g-glass" d="${vidrio.fill}"/>` + L(vidrio.outline, { tone: "hi", className: "l-glass" })
      + L(k.pathOf(hl) + k.pathOf(hl2), { tone: "lit", className: "l-shine", free: true })
      + S(G.ringBand(-W.CAP_S + 2.2, -W.CAP_S + 4.4, bulbR(-W.CAP_S + 3.3) - 0.4, bulbR(-W.CAP_S + 3.3) + 1.2, F, P), { tone: "mid", className: "m-brass", crease: "none" })]);
    return items;
  };
  // lo de dentro: la arena de los dos bulbos, el hilo que cae y el manguito del café (va justo detrás del cristal)
  W.relojDentro = function (th, S0, caf, cae, fase) {
    const F = frameAt(th), up = Math.cos(th) >= 0;               // up: el bulbo del cansancio está abajo
    const fA = W.LLENO * S0, fB = W.LLENO * (1 - S0);
    let dentro = sandOf(F, -1, fA, up) + sandOf(F, 1, fB, !up);
    if (cae) dentro += W.granos(th, S0, fase);
    // el manguito del café: tapa la arena del bulbo del cansancio desde la tapa
    let fuera = "";
    if (caf > 0.3) {
      const hc = Math.min(14, caf / 15 * 14);
      const s0 = -W.CAP_S + 0.2, s1 = s0 + hc;
      fuera = S(G.ringBand(s0, s1, W.BULB + 0.4, W.BULB + 1.8, F, P), { tone: "hi", className: "m-coffee" }).replace('<g class="iso-solid m-coffee"', '<g class="iso-solid m-coffee" opacity=".6"')
        + L(G.arcOf(F, s1 - 1.4, W.BULB + 1.8, P), { tone: "faint" });
    }
    return { dentro: [dep(G.pointOf(F, 0, 0, 0)) - 0.01, dentro], fuera: [dep(G.pointOf(F, 0, 0, 0)) + 0.01, fuera] };
  };
  // el hilo de arena que cae por el cuello hasta el montón de abajo, con sus granos
  W.granos = function (th, S0, fase) {
    const F = frameAt(th), up = Math.cos(th) >= 0, lado = up ? -1 : 1, f = W.LLENO * (up ? S0 : 1 - S0);
    const cima = W.CAP_S - desdeTapa(Math.max(0.004, f)) - 2.5, pts = [];
    for (let i = 0; i < 5; i++) { const q = (fase + i / 5) % 1; pts.push(at(G.pointOf(F, lado * (1.5 + q * Math.max(0, cima - 1.5)), 0, 0))); }
    return L(k.pathOf([at(G.pointOf(F, lado * 1.2, 0, 0)), at(G.pointOf(F, lado * Math.max(1.5, cima), 0, 0))]), { tone: "faint", className: "l-sand" }) + k.dotsSvg(pts, { size: 0.55, tone: "hi" });
  };
  // el reloj entero, en orden de atrás adelante
  W.relojSvg = function (fijo, d) {
    return [...fijo, d.dentro, d.fuera].sort((a, b) => a[0] - b[0]).map((x) => x[1]).join("");
  };

  /* ---------- lo fijo ---------- */
  W.base = function () {
    const out = [`<path class="iso-halo" d="${k.haloOf(W.PLATE, -W.PLATE_H - W.FOOT_H, W.PLATE_H, P)}"/>`];
    const byDepth = (pts) => [...pts].sort((a, b) => dep([a[0], a[1], 0]) - dep([b[0], b[1], 0]));
    for (const [x, y] of byDepth(k.corners(W.PLATE, 18))) {
      out.push(S(k.cylinder(x, y, 7, -W.PLATE_H - W.FOOT_H, 1.4, P, 28), { tone: "lo", className: "m-brass" }));
      out.push(S(k.cylinder(x, y, 5.2, -W.PLATE_H - W.FOOT_H + 1.4, W.FOOT_H - 1.4, P, 28), { tone: "mid", className: "m-brass" }));
    }
    out.push(S(k.slabOf(W.PLATE, -W.PLATE_H, W.PLATE_H, P, 8, 1.4), { tone: "mid", className: "m-wood" }));
    // la veta de la madera en el canto de delante y en la tapa: rayas largas que acaban en el borde
    const vet = [];
    for (const [z, a, b] of [[-3.2, -110, 40], [-6.4, -60, 118], [-4.8, 70, 120]]) vet.push(k.pathOf([at([Math.max(W.PLATE.x + 4, a), W.PLATE.y + W.PLATE.d, z]), at([Math.min(W.PLATE.x + W.PLATE.w - 4, b), W.PLATE.y + W.PLATE.d, z])]));
    out.push(L(vet.join(""), { tone: "faint", className: "l-grain", free: true }));
    out.push(L(k.planOutline(k.insetPlan(W.PLATE, 4.5), 0, P), { tone: "lo", className: "l-wood" }));
    const sc = k.corners(W.PLATE, 9);
    out.push(k.dotsSvg(sc.map(([x, y]) => at([x, y, 0])), { size: 0.6, tone: "hi" }));
    // la placa con el nombre, en latón, con tres renglones
    const lab = { x: 20, y: 10, w: 36, d: 12, r: 1.5 };
    out.push(S(k.slabOf(lab, 0, 0.8, P, 4), { tone: "lo", crease: "none", className: "m-brass" }));
    out.push(L(k.planOutline(k.insetPlan(lab, 1.6), 0.8, P, 4), { tone: "faint" }));
    [[4, 26], [7, 20], [10, 23]].forEach(([dy, w]) => out.push(L(k.lineOnTop([lab.x + 5, lab.y + dy - 1.2], [lab.x + 5 + w, lab.y + dy - 1.2], 0.8, P), { tone: "lo", free: true })));
    out.push(k.dotsSvg([[lab.x + 2.2, lab.y + 6], [lab.x + lab.w - 2.2, lab.y + 6]].map(([x, y]) => at([x, y, 0.8])), { size: 0.45, tone: "hi" }));
    // la regla del tiempo, embutida
    out.push(S(k.slabOf(W.STRIP, 0, 0.8, P, 3), { tone: "lo", crease: "none", className: "m-paper" }));
    // el raíl del cursor
    out.push(S(k.slabOf({ x: W.RX0 - 4, y: W.RAIL_Y - 1.5, w: W.RX1 - W.RX0 + 8, d: 3, r: 1 }, 0, 2.4, P, 3, 0.4), { tone: "mid", className: "m-brass" }));
    for (const x of [W.RX0 - 9, W.RX1 + 3]) {
      out.push(S(k.slabOf({ x, y: W.RAIL_Y - 4, w: 6, d: 8, r: 1.2 }, 0, 5, P, 3, 0.5), { tone: "mid", className: "m-brass" }));
      out.push(k.dotsSvg([at([x + 3, W.RAIL_Y, 5])], { size: 0.5, tone: "hi" }));
    }
    return out.join("");
  };
  // la regla de la alerta: un listón de pie con tres zonas pintadas y un cursor
  W.gaugeBack = function () {
    const g = W.GAUGE, out = [];
    out.push(S(k.slabOf({ x: g.x - 3, y: g.y - 3, w: g.w + 6, d: g.d + 6, r: 1.6 }, 0, 3, P, 3, 0.5), { tone: "mid", className: "m-brass" }));
    out.push(S(k.slabOf(g, 3, W.G1 + 4 - 3, P, 2, 0.4), { tone: "mid", className: "m-wood" }));
    out.push(S(k.slabOf({ x: g.x - 1, y: g.y - 1, w: g.w + 2, d: g.d + 2, r: 1.2 }, W.G1 + 4, 2.4, P, 3, 0.5), { tone: "mid", className: "m-brass" }));
    const yf = g.y + g.d + 0.1, zA = (A) => W.G0 + (W.G1 - W.G0) * A / 100;
    for (const [a, b, cls] of [[0, 35, "z-bad"], [35, 55, "z-warn"], [55, 100, "z-ok"]])
      out.push(`<path class="${cls}" d="${poly([[g.x + 1.6, yf, zA(a)], [g.x + g.w - 1.6, yf, zA(a)], [g.x + g.w - 1.6, yf, zA(b)], [g.x + 1.6, yf, zA(b)]])}"/>`);
    const mi = [], ma = [];
    for (let a = 0; a <= 100; a += 5) (a % 25 === 0 ? ma : mi).push(k.pathOf([at([g.x + g.w, yf, zA(a)]), at([g.x + g.w - (a % 25 === 0 ? 3.4 : 2), yf, zA(a)])]));
    out.push(L(mi.join(""), { tone: "lo" }) + L(ma.join(""), { tone: "mid" }));
    return out.join("");
  };
  W.gaugeCursor = function (A, dormido) {
    const g = W.GAUGE, z = W.G0 + (W.G1 - W.G0) * Math.max(0, Math.min(100, A)) / 100 - 2.2;
    const ring = { x: g.x - 1.6, y: g.y - 1.6, w: g.w + 3.2, d: g.d + 3.2, r: 1.2 };
    return S(k.slabOf(ring, z, 4.4, P, 3, 0.4), { tone: dormido ? "mid" : "hi", className: "m-brass", lit: !dormido })
      + S(k.extrude([[g.x + g.w + 1.6, g.y + 1], [g.x + g.w + 6.5, g.y + g.d / 2], [g.x + g.w + 1.6, g.y + g.d - 1]], z + 1, 2.4, P), { tone: "hi", lit: !dormido, className: "m-brass" });
  };
  // los postes del reloj, con sus pivotes y pomos moleteados
  W.post = function (sg) {
    const x0 = W.HG[0] + sg * W.POST_DX - (sg < 0 ? W.POST.w : 0), out = [];
    const pl = { x: x0, y: W.HG[1] - W.POST.d / 2, w: W.POST.w, d: W.POST.d, r: 1.6 };
    out.push(S(k.slabOf({ x: pl.x - 2.5, y: pl.y - 2.5, w: pl.w + 5, d: pl.d + 5, r: 2 }, 0, 3, P, 3, 0.5), { tone: "mid", className: "m-brass" }));
    out.push(S(k.slabOf(pl, 3, W.PIV + 9 - 3, P, 3, 0.5), { tone: "mid", className: "m-wood" }));
    out.push(L(k.sideSeam(k.insetPlan(pl, 0), 14, P), { tone: "faint" }));
    // el pivote: un eje de latón del poste al aro, y el pomo por fuera
    const Fx = G.frameAlong([W.HG[0], W.HG[1], W.PIV], [sg, 0, 0]);
    const knob = S(G.disc(W.POST_DX + W.POST.w, W.POST_DX + W.POST.w + 3, 5, Fx, P), { tone: "mid", className: "m-brass" })
      + L(G.ribsOf(Fx, W.POST_DX + W.POST.w + 0.3, W.POST_DX + W.POST.w + 2.7, 5, 28, P, { seams: false }), { tone: "lo" });
    const pin = S(G.disc(W.COL_R + 3, W.POST_DX, 2.2, Fx, P), { tone: "mid", className: "m-brass" });
    return { post: out.join(""), pin, knob };
  };
  // la esfera de día y noche: un disco de pie, de cara a quien mira, que gira detrás de un horizonte
  const dP = (a, b, z) => [W.DIAL[0] + a * W.DU[0] + b * W.DN[0], W.DIAL[1] + a * W.DU[1] + b * W.DN[1], z];   // a: a lo ancho, b: hacia delante
  const boxAt = (a0, a1, b0, b1) => [[a0, b0], [a1, b0], [a1, b1], [a0, b1]].map(([a, b]) => dP(a, b, 0).slice(0, 2));
  W.dialBack = function () {
    const out = [];
    out.push(S(k.extrude(boxAt(-5, 5, -14, -6), 0, W.DIAL_Z + 3, P), { tone: "mid", className: "m-wood" }));
    out.push(S(k.extrude(boxAt(-8, 8, -16, -4), 0, 2.4, P), { tone: "mid", className: "m-brass" }));
    const Fn = G.frameAlong(dP(0, -6, W.DIAL_Z), W.DN);
    out.push(S(G.disc(0, 6, 3.2, Fn, P), { tone: "mid", className: "m-brass" }));
    return out.join("");
  };
  W.dialDisc = function (t) {
    const R = W.DIAL_R, Fn = G.frameOf(dP(0, 0, W.DIAL_Z), W.DN, W.DU, [0, 0, 1]);
    let out = W._disco || (W._disco = S(G.disc(0, W.DISC_T, R, Fn, P), { tone: "mid", className: "m-brass" }));
    const f = W.DISC_T + 0.05;
    // el sol arriba a las 17:00 y abajo a las 5:00; la luna, enfrente
    const ph = 2 * Math.PI * (t - 17) / 24;
    const pt = (r, a) => dP(r * Math.sin(a), f, W.DIAL_Z + r * Math.cos(a));
    const half = (a0, cls) => { const pts = []; for (let i = 0; i <= 36; i++) pts.push(pt(R - 2.6, a0 - Math.PI / 2 + Math.PI * i / 36)); return `<path class="${cls}" d="${poly(pts)}"/>`; };
    out += half(ph, "sky-day") + half(ph + Math.PI, "sky-night");
    out += L(poly(Array.from({ length: 60 }, (_, i) => pt(R - 2.6, i * Math.PI / 30))), { tone: "faint" });
    // las 24 horas en el canto de latón (las 5, 11, 17 y 23, más largas)
    const ticks = [], big = [];
    for (let h = 0; h < 24; h++) { const a = 2 * Math.PI * (t - h) / 24; (h % 6 === 5 ? big : ticks).push(k.pathOf([at(pt(R - 0.4, a)), at(pt(R - (h % 6 === 5 ? 2.4 : 1.4), a))])); }
    out += L(ticks.join(""), { tone: "lo" }) + L(big.join(""), { tone: "mid" });
    const circ = (c, r) => { const [a0, , z0] = [Math.hypot(c[0] - W.DIAL[0], c[1] - W.DIAL[1]) * Math.sign((c[0] - W.DIAL[0]) * W.DU[0] + (c[1] - W.DIAL[1]) * W.DU[1]), 0, c[2]]; return poly(Array.from({ length: 28 }, (_, i) => dP(a0 + r * Math.cos(i * Math.PI / 14), f + 0.05, z0 + r * Math.sin(i * Math.PI / 14)))); };
    const sun = pt(R * 0.6, ph), moon = pt(R * 0.6, ph + Math.PI);
    const sa = (sun[0] - W.DIAL[0]) * W.DU[0] + (sun[1] - W.DIAL[1]) * W.DU[1];
    const rays = []; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rays.push(k.pathOf([at(dP(sa + 6.6 * Math.cos(a), f + 0.05, sun[2] + 6.6 * Math.sin(a))), at(dP(sa + 9 * Math.cos(a), f + 0.05, sun[2] + 9 * Math.sin(a)))])); }
    out += `<path class="sun" d="${circ(sun, 5.4)}"/>` + L(rays.join(""), { tone: "mid", className: "l-sun" });
    const ma = (moon[0] - W.DIAL[0]) * W.DU[0] + (moon[1] - W.DIAL[1]) * W.DU[1];
    out += `<path class="moon" d="${circ(moon, 4.8)}"/><path class="sky-night" d="${poly(Array.from({ length: 28 }, (_, i) => dP(ma + 2.4 + 4.1 * Math.cos(i * Math.PI / 14), f + 0.1, moon[2] + 1.3 + 4.1 * Math.sin(i * Math.PI / 14))))}"/>`;
    out += k.dotsSvg([at(dP(0, f + 0.2, W.DIAL_Z))], { size: 1.3, tone: "hi" });
    return out;
  };
  W.horizon = function () {
    const out = [], b0 = 3, b1 = 14, Wd = W.HOR_W;
    const ring = boxAt(-Wd, Wd, b0, b1);
    out.push(`<path class="iso-halo" d="${k.pathOf(ring.map(([x, y]) => at([x, y, 0])), true)}" style="filter:blur(4px)"/>`);
    out.push(S(k.extrude(ring, 0, W.HOR_H, P), { tone: "mid", className: "m-wood" }));
    out.push(S(k.extrude(boxAt(-Wd - 1.2, Wd + 1.2, b0 - 1.2, b1 + 1.2), W.HOR_H, 1.8, P), { tone: "mid", className: "m-brass" }));
    // en la cara: un panel rehundido y cuatro tornillos
    out.push(L(poly([dP(-Wd + 7, b1, 8), dP(Wd - 7, b1, 8), dP(Wd - 7, b1, W.HOR_H - 8), dP(-Wd + 7, b1, W.HOR_H - 8)]), { tone: "lo", className: "l-wood" }));
    out.push(L(poly([dP(-Wd + 9, b1, 10), dP(Wd - 9, b1, 10), dP(Wd - 9, b1, W.HOR_H - 10), dP(-Wd + 9, b1, W.HOR_H - 10)]), { tone: "faint" }));
    out.push(k.dotsSvg([[-Wd + 4, W.HOR_H - 3], [Wd - 4, W.HOR_H - 3], [-Wd + 4, 5], [Wd - 4, 5]].map(([a, z]) => at(dP(a, b1, z))), { size: 0.5, tone: "hi" }));
    return out.join("");
  };

  /* ---------- la regla de la guardia y los cafés ---------- */
  W.X = (t, T0, T1) => W.RX0 + (t - T0) * (W.RX1 - W.RX0) / (T1 - T0);
  W.stripMarks = function (p, T0, T1) {
    const X = (t) => W.X(t, T0, T1), out = [], z = 0.85, ST = W.STRIP;
    const box = (a, b, y0, y1, cls) => `<path class="${cls}" d="${poly([[X(a), y0, z], [X(b), y0, z], [X(b), y1, z], [X(a), y1, z]])}"/>`;
    for (const s of p.todo) { const a = Math.max(T0, s.a), b = Math.min(T1, s.b); if (b - a > 0.05) out.push(box(a, b, ST.y + 1.2, ST.y + 4.6, "strip-sleep")); }
    if (p.de != null) out.push(box(Math.max(T0, p.de), Math.min(T1, p.sale), ST.y + 5.4, ST.y + 7.2, "strip-guard"));
    const edge = ST.y + ST.d, mi = [], ma = [];
    for (let t = Math.ceil(T0); t <= T1; t++) (t % 6 === 0 ? ma : mi).push(k.lineOnTop([X(t), edge], [X(t), edge - (t % 6 === 0 ? 3.4 : 1.8)], z, P));
    return out.join("") + L(mi.join(""), { tone: "lo" }) + L(ma.join(""), { tone: "mid" });
  };
  W.cups = function (p, T0, T1, t) {
    const X = (h) => W.X(h, T0, T1), out = [];
    for (const c of [...p.cafes].filter((c) => c.t >= T0 && c.t <= T1).sort((a, b) => a.t - b.t)) {
      const x = X(c.t), y = W.CUP_Y, tomada = t >= c.t;
      out.push(S(k.cylinder(x, y, 4.4, 0, 0.9, P, 28), { tone: "lo", className: "m-cup" }));
      out.push(S(k.cylinder(x, y, 2.9, 0.9, 5.2, P, 28, 0.3), { tone: "mid", className: "m-cup" }));
      out.push(S(k.slabOf({ x: x + 2.5, y: y - 0.6, w: 2.4, d: 1.2, r: 0.5 }, 2.2, 2.6, P, 2), { tone: "mid", crease: "none", className: "m-cup" }));
      out.push(tomada ? L(k.ring(x, y, 2.3, 6.1, P, 22), { tone: "faint" }) : `<path class="coffee" d="${k.pathOf(k.circleRing(x, y, 2.3, 22).map(([a, b]) => at([a, b, 5.8])), true)}"/>`);
    }
    return out.join("");
  };
  W.carriage = function () {
    const c = { x: -W.CAR.w / 2, y: W.RAIL_Y - W.CAR.d / 2, w: W.CAR.w, d: W.CAR.d, r: 2.2 }, out = [];
    out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(c, 2), 2.4, 0.1, P)}" style="filter:blur(3px)"/>`);
    out.push(S(k.slabOf(c, 2.4, 5, P, 4, 0.6), { tone: "mid", className: "m-brass" }));
    out.push(k.dotsSvg([[-4.5, -3], [4.5, -3], [-4.5, 3], [4.5, 3]].map(([a, b]) => at([a, W.RAIL_Y + b, 7.4])), { size: 0.45, tone: "lo" }));
    out.push(S(k.extrude([[-2.6, c.y + c.d], [2.6, c.y + c.d], [0, W.STRIP.y + 1.2]], 3, 1.8, P), { tone: "hi", lit: true }));
    return out.join("");
  };
  W.frameAt = frameAt;
  return W;
}
