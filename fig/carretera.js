/* ===================== LA CARRETERA DEL MES: lo que viene, desde el asiento =====================
   Un módulo sin dependencias, como fig/conductor.js: window.Carretera.crea({onAbrir}) devuelve {el, actualiza(D)}.
   La misma cabina que el conductor (parabrisas, pilares, salpicadero, volante) y la misma cámara, pero la
   carretera no es el día: son LOS DÍAS QUE VIENEN. Cada día es un mojón al borde con su número y la cabeza del
   color del tipo. Lo que toca está en la carretera a esa distancia: la guardia es un túnel (la noche de trabajo,
   se entra por la tarde y se sale a la mañana), el finde libre un área de descanso, las vacaciones la salida a
   la playa y cada evento una señal azul en su poste. La jornada es la ciudad a los lados.
   El salpicadero dice la fecha, la próxima guardia y el próximo finde; la tira de arriba es el mes entero.
   Se arrastra (hacia delante = avanzar días) y tocar un mojón, un cartel o una marca de la tira abre ese día.

   D = { hoy:'YYYY-MM-DD', claro:bool, hoyTxt:'MAR 13', hoySub:'guardia URG · 15→9',
         dias:[{k,d,dow,tipo,g,gh,evs:[{t,h}],vac0,finde0,finde1}]  (desde hoy, en orden; tipo: trabajo|fuerza|guardia|saliente|libre|vac)
         prox:{guardia:{txt,sub}, finde:{txt}, vac:{txt}}, chips:[{txt,o}], tira:[{k,tipo,hoy,pasado}] }
   onAbrir recibe {tipo:'dia', k} | {tipo:'chip', o} */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const CSS = `
.ct{position:relative;--ct-frame:#0a0e16;--ct-pillar:#111724;--ct-dash:#151c2a;--ct-dashe:#2a3448;--ct-panel:#04131a;--ct-panele:#1d3340;--ct-disp:#060a10;--ct-ink:#e9f2ff;--ct-ink2:#8fa6c6;--ct-ink3:#5d7394;--ct-amb:#ffd66b;--ct-cyan:#7fecff;--ct-wheel:#263044}
.ct.ct-claro{--ct-frame:#c9d2df;--ct-pillar:#b8c2d1;--ct-dash:#dbe2ec;--ct-dashe:#aab6c8;--ct-panel:#f6f9fd;--ct-panele:#b9c6d8;--ct-disp:#0b1220;--ct-ink:#0d1726;--ct-ink2:#4a5d78;--ct-ink3:#6f819c;--ct-cyan:#0a7f99;--ct-wheel:#6f7d93}
.ct svg{display:block;width:100%;height:auto;touch-action:pan-y;user-select:none;-webkit-user-select:none;border-radius:14px}
.ct svg:focus-visible{outline:2px solid var(--ct-amb);outline-offset:2px}
.ct [data-o]{cursor:pointer}
.ct-ground{fill:#3b4352}.ct-road{fill:#262c36}.ct-walk{fill:#59616f}.ct-kerb{fill:#9aa3b2}.ct-edge{fill:#cfd5df}.ct-dash{fill:#d8dde6}
.ct-ba{fill:#4b5a78}.ct-bb{fill:#3a4763}.ct-bc{fill:#5b6a8a}.ct-bd{fill:#43506d}.ct-bend{fill:#2e3850}.ct-win{fill:#1a2236}.ct-wino{fill:#ffd98a}
.ct-hosp{fill:#c9d2de}.ct-hospe{fill:#9aa6b8}.ct-cross{fill:#e5484d}.ct-trunk{stroke:#4a3527;fill:none;stroke-linecap:round}.ct-post{stroke:#8a96a8;fill:none;stroke-linecap:round}
.ct-mojon{fill:#e9eef5}.ct-mojt{fill:#1d2b40;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.ct-gwl{fill:#1b212b}.ct-gwr{fill:#181d26}.ct-gceil{fill:#0d1118}.ct-portal{fill:#3a4252}.ct-boca{fill:#0a0d13}.ct-glampo{fill:#ffe9b0}
.ct-sig{fill:#0b1020;stroke:#ffd66b;stroke-width:1.2}.ct-sigt{fill:#ffd66b;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.ct-sigv{fill:#1f6b3a;stroke:#e9f2ff;stroke-width:.8}.ct-sigtv{fill:#f3f7f1;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.ct-sigb{fill:#1a3f8a;stroke:#e9f2ff;stroke-width:.8}.ct-sigtb{fill:#e9f2ff;font-weight:700;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.ct-mesa{fill:#8a6a48}.ct-mesat{fill:#a07a58}
.ct-sigg{fill:#4b3f7a;stroke:#9c86ff;stroke-width:.8}.ct-sigtg{fill:#e9e4ff;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.ct-sigm{fill:#215f45;stroke:#7fe0a8;stroke-width:.8}.ct-sigtm{fill:#eafff2;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.ct-pen{fill:#ffd66b}.ct-pent{fill:#3b2a05;font-weight:900;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.ct-salida{fill:#e8eef8;fill-opacity:.3}.ct-pared{fill:#0e1322;stroke:#ffd66b;stroke-width:.9}.ct-paredt{fill:#ffd66b;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.ct-paredt.s{fill:#e9f2ff;font-weight:600}
.ct-frame{fill:var(--ct-frame)}.ct-pillar{fill:var(--ct-pillar)}.ct-strip{fill:#05070c;stroke:#1e2738;stroke-width:1.2}.ct-stt{fill:#5d7394;font:700 9.5px ui-monospace,Menlo,monospace;letter-spacing:.06em}
.ct-sdot{fill:#2a3a55}.ct-spast{fill:#56708f}.ct-snext{fill:#ffd66b}.ct-sguard{fill:#7d93e0}.ct-svac{fill:#e3a72f}.ct-slibre{fill:#3f8a4f}.ct-scam{fill:none;stroke:#7fecff;stroke-width:1.2}
.ct-dashtop{fill:var(--ct-dash)}.ct-dashe{stroke:var(--ct-dashe);stroke-width:1.5;fill:none}.ct-lcd{fill:var(--ct-panel);stroke:var(--ct-panele);stroke-width:1.2}.ct-clk{fill:var(--ct-cyan);font:700 24px ui-monospace,Menlo,monospace;text-anchor:middle}
.ct-q{fill:var(--ct-ink2);font:700 11px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.ct-lab{fill:var(--ct-ink3);font:800 9px ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em}
.ct-disp{fill:var(--ct-disp);stroke:var(--ct-dashe);stroke-width:1.4}.ct-nxl{fill:#b98c2c;font:800 10px ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em}.ct-nxb{fill:#ffd66b;font:800 21px ui-sans-serif,system-ui,sans-serif}.ct-nxa{fill:#e9f2ff;font:600 12px ui-sans-serif,system-ui,sans-serif}
.ct-chip{fill:#0d1726;stroke:#ffd66b;stroke-width:1.2}.ct-chipt{fill:#ffd66b;font:700 11.5px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.ct-chip.c2{stroke:#7fecff}.ct-chipt.c2{fill:#7fecff}
.ct-wheel{stroke:var(--ct-wheel);stroke-width:22;fill:none}
.ct-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.ct-sr:focus-within{position:static;width:auto;height:auto;clip-path:none;white-space:normal;display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.ct-sr button{font:inherit;font-size:13px;padding:6px 10px;border-radius:8px;border:1px solid #2a3448;background:#0d1726;color:#e9f2ff}`;

  /* ---------- la cámara: los ojos del conductor, como en Hoy ---------- */
  const W = 600, HG = 440, CX = 300, HY = 150, F = 270, EYE = 2.4, NEAR = 0.9, FAR = 200, GAP = 11, Z0 = 4;
  const pr = (x, y, z) => [CX + F * x / z, HY + F * (EYE - y) / z];
  const f1 = (n) => n.toFixed(1);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function poly(pts, cls, extra) {
    const o = [];
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], ina = a[2] >= NEAR, inb = b[2] >= NEAR;
      if (ina) o.push(a); if (ina !== inb) { const f = (NEAR - a[2]) / (b[2] - a[2]); o.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, NEAR]); } }
    if (o.length < 3) return "";
    return '<path class="' + cls + '"' + (extra || "") + ' d="M' + o.map((p) => { const s = pr(p[0], p[1], p[2]); return f1(s[0]) + " " + f1(s[1]); }).join("L") + 'Z"/>';
  }
  function seg(a, b, cls, w) {
    if (a[2] < NEAR && b[2] < NEAR) return "";
    if (a[2] < NEAR) { const f = (NEAR - a[2]) / (b[2] - a[2]); a = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, NEAR]; }
    if (b[2] < NEAR) { const f = (NEAR - b[2]) / (a[2] - b[2]); b = [b[0] + (a[0] - b[0]) * f, b[1] + (a[1] - b[1]) * f, NEAR]; }
    const p = pr(a[0], a[1], a[2]), q = pr(b[0], b[1], b[2]), zw = Math.min(a[2], b[2]);
    return '<path class="' + cls + '" style="stroke-width:' + Math.max(0.6, w * F / zw).toFixed(2) + 'px" d="M' + f1(p[0]) + " " + f1(p[1]) + "L" + f1(q[0]) + " " + f1(q[1]) + '"/>';
  }
  /* lo que ocupa un texto en negrita, en «em»: mayúsculas anchas, espacios estrechos y el resto como una minúscula */
  const anchoEm = (s) => Math.max(3.5, Array.from(String(s)).reduce((a, c) => a + (c === " " ? 0.32 : /[A-ZÁÉÍÓÚÑÜ]/.test(c) ? 0.78 : 0.6), 0));
  const corta = (s, sw, fmin) => { s = String(s); if (anchoEm(s) * fmin <= sw * 0.8) return s;   /* a letra mínima, con más margen: ocupa más */
    while (s.length > 1 && anchoEm(s + "…") * fmin > sw * 0.8) s = s.slice(0, -1); return s.trimEnd() + "…"; };
  /* un cartel plano frente al conductor, con su texto a la medida del cartel */
  function cartel(x, y, z, w, h, cls, txt, sub, tcls, o) {
    if (z < NEAR) return "";
    const p = pr(x, y, z), q = pr(x + w, y + h, z), sw = q[0] - p[0], sh = p[1] - q[1]; if (sw < 7 || sw > 330) return "";
    /* la letra, a la medida del cartel Y de lo que dice (las mayúsculas en negrita ocupan más): antes se calculaba con
       un ancho por letra de minúscula y solo con el título, y «GUARDIA URG · vie 16» tocaba los bordes y la línea de
       debajo («7:00 · 18:00 · 19:15») se salía de la placa */
    const entero = txt + (sub ? " · " + sub : "");
    txt = corta(txt, sw, 4); sub = sub ? corta(sub, sw, 3.5) : sub;   /* un nombre largo en un cartel lejano: se corta con «…» (entero, en su <title>) */
    const fs = Math.max(4, Math.min(16, sw * 0.9 / anchoEm(txt))), fs2 = sub ? Math.max(3.5, Math.min(fs * 0.72, sw * 0.9 / anchoEm(sub))) : 0;
    return '<g' + (o ? ' data-o="' + esc(o) + '"' : "") + '>' + (/…$/.test(txt) || /…$/.test(sub || "") ? "<title>" + esc(entero) + "</title>" : "") + '<rect class="' + cls + '" x="' + f1(p[0]) + '" y="' + f1(q[1]) + '" width="' + f1(sw) + '" height="' + f1(sh) + '" rx="' + f1(sh * 0.08) + '"/>' +
      '<text class="' + tcls + '" x="' + f1(p[0] + sw / 2) + '" y="' + f1(q[1] + sh * (sub ? 0.5 : 0.66)) + '" style="font-size:' + f1(fs) + 'px">' + esc(txt) + "</text>" +
      (sub ? '<text class="' + tcls + '" x="' + f1(p[0] + sw / 2) + '" y="' + f1(q[1] + sh * 0.88) + '" style="font-size:' + f1(fs2) + 'px;opacity:.85">' + esc(sub) + "</text>" : "") + "</g>";
  }
  const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  const dur = (m) => { m = Math.max(0, Math.round(m)); return m >= 60 ? Math.floor(m / 60) + " h" + (m % 60 ? " " + String(m % 60).padStart(2, "0") : "") : m + " min"; };
  /* los carteles de salida colgados del techo cada «paso» metros: lo que falta para salir desde ese punto */
  function salidas(o, z0, z1, d, faltan, paso, desde) {
    const sale = d.tunel && d.tunel.sale ? "a las " + d.tunel.sale : "";
    for (let zz = z0 + (desde || 2.2); zz < z1 - 1.4; zz += paso) { const queda = faltan != null ? faltan * (z1 - zz) / (z1 - z0) : null;
      o.push(cartel(-1.7, 3.35, zz, 3.4, 0.95, "ct-pared", queda != null ? "SALIDA · " + dur(queda) : "SALIDA", sale, "ct-paredt", d.k)); }
  }
  function tunel(o, z0, z1, d, faltan) {
    o.push(poly([[-7, 0, z0], [-7, 7.5, z0], [-7, 7.5, z1], [-7, 0, z1]], "ct-gwl"), poly([[4.8, 0, z0], [4.8, 7.5, z0], [4.8, 7.5, z1], [4.8, 0, z1]], "ct-gwr"));
    o.push(poly([[-7, 7.5, z0], [4.8, 7.5, z0], [4.8, 7.5, z1], [-7, 7.5, z1]], "ct-gceil"));
    for (let zz = z0 + 4; zz < z1 - 0.5; zz += 4) if (zz >= NEAR) o.push(poly([[-1.5, 7.3, zz], [0.4, 7.3, zz], [0.4, 7.3, zz + 1.2], [-1.5, 7.3, zz + 1.2]], "ct-glampo"));
    salidas(o, z0, z1, d, faltan, 3);
  }
  const COL = { trabajo: "#d9573f", fuerza: "#7a5cf0", guardia: "#ff2b3a", saliente: "#7d93e0", libre: "#3f8a4f", vac: "#e3a72f" };

  /* ---------- la escena: los días desde la cámara (cam = días avanzados) ---------- */
  function escena(D, cam) {
    const dias = D.dias || [], out = [];
    const zDe = (i) => Z0 + (i - cam) * GAP;
    const amb = (d) => d.tipo === "libre" || d.tipo === "vac" ? "campo" : d.tipo === "guardia" ? "hospital" : "ciudad";
    out.push('<rect class="ct-ground" x="0" y="' + HY + '" width="600" height="200"/>');
    out.push(poly([[-5.2, 0, NEAR], [3.0, 0, NEAR], [3.0, 0, FAR], [-5.2, 0, FAR]], "ct-road"));
    out.push(poly([[3.0, 0.15, NEAR], [8, 0.15, NEAR], [8, 0.15, FAR], [3.0, 0.15, FAR]], "ct-walk"));
    out.push(poly([[-11, 0.15, NEAR], [-5.2, 0.15, NEAR], [-5.2, 0.15, FAR], [-11, 0.15, FAR]], "ct-walk"));
    const tira = (x0, x1, y, cls) => poly([[x0, y, NEAR], [x1, y, NEAR], [x1, y, FAR], [x0, y, FAR]], cls);
    out.push(tira(2.96, 3.1, 0.16, "ct-kerb"), tira(-5.3, -5.16, 0.16, "ct-kerb"), tira(2.72, 2.8, 0.011, "ct-edge"), tira(-4.98, -4.9, 0.011, "ct-edge"));
    const dz = ((cam * GAP) % 6 + 6) % 6;
    for (let z0 = 2 - dz; z0 < FAR; z0 += 6) if (z0 + 3 >= NEAR) out.push(poly([[-1.15, 0.01, z0], [-1.0, 0.01, z0], [-1.0, 0.01, z0 + 3], [-1.15, 0.01, z0 + 3]], "ct-dash"));
    /* el paisaje por día, de atrás adelante: el campo donde lo libre y la playa, la ciudad donde la jornada */
    for (let i = dias.length - 1; i >= 0; i--) {
      const d = dias[i], z0 = zDe(i) - GAP / 2, z1 = zDe(i) + GAP / 2; if (z1 < NEAR || z0 > FAR) continue;
      const a = amb(d), n = d.d;
      if (a === "campo") {
        out.push(poly([[8.05, 0.02, Math.max(NEAR, z0)], [60, 0.02, Math.max(NEAR, z0)], [60, 0.02, z1], [8.05, 0.02, z1]], "", ' style="fill:#2f5a3a"'));
        out.push(poly([[-60, 0.02, Math.max(NEAR, z0)], [-11.05, 0.02, Math.max(NEAR, z0)], [-11.05, 0.02, z1], [-60, 0.02, z1]], "", ' style="fill:#2a523a"'));
        for (let j = 0; j < 5; j++) for (const lado of [1, -1]) { const z = z0 + 2 + j * 2; if (z < NEAR) continue; const x = lado * (12 + hash(n * 7 + j * 3 + lado) * 10), h = 3.5 + hash(n + j) * 2.5;
          out.push(seg([x, 0, z], [x, h * 0.45, z], "ct-trunk", 0.35)); out.push(poly([[x - 1.6, h * 0.4, z], [x + 1.6, h * 0.4, z], [x, h, z]], "", ' style="fill:#2f7a52"')); out.push(poly([[x - 1.2, h * 0.55, z - 0.2], [x + 1.2, h * 0.55, z - 0.2], [x, h * 1.05, z - 0.2]], "", ' style="fill:#3f8a4f"')); }
      } else {
        for (const lado of [1, -1]) { const x0 = lado > 0 ? 10.4 : -13.4, x1 = lado > 0 ? 17 : -20, hosp = a === "hospital" && lado > 0, h = hosp ? 7 : 3 + Math.floor(hash(n * 7 + (lado > 0 ? 1 : 5)) * 4);
          out.push(poly([[x0, 0, z0 + 1], [x0, 0, z1 - 1.5], [x0, h, z1 - 1.5], [x0, h, z0 + 1]], hosp ? "ct-hosp" : ["ct-ba", "ct-bb", "ct-bc", "ct-bd"][Math.floor(hash(n * 3 + lado) * 4)]));
          if (z0 + 1 >= NEAR) out.push(poly([[x0, 0, z0 + 1], [x1, 0, z0 + 1], [x1, h, z0 + 1], [x0, h, z0 + 1]], hosp ? "ct-hospe" : "ct-bend"));
          if (z0 < 90) for (let y = 1.6; y < h - 1.2; y += 2.8) for (let z = z0 + 2; z < z1 - 2.9; z += 2.4) { if (z < NEAR) continue; const x = x0 - 0.01 * lado; out.push(poly([[x, y, z], [x, y, z + 1.3], [x, y + 1.4, z + 1.3], [x, y + 1.4, z]], hosp && hash(y * 7 + z) > 0.3 ? "ct-wino" : "ct-win")); }
          if (hosp) { const zc = (z0 + z1) / 2; if (zc > NEAR) { out.push(poly([[x0 - 0.02, 5.2, zc - 1.4], [x0 - 0.02, 5.2, zc + 1.4], [x0 - 0.02, 7.6, zc + 1.4], [x0 - 0.02, 7.6, zc - 1.4]], "ct-hosp")); out.push(poly([[x0 - 0.04, 6.1, zc - 1.1], [x0 - 0.04, 6.1, zc + 1.1], [x0 - 0.04, 6.7, zc + 1.1], [x0 - 0.04, 6.7, zc - 1.1]], "ct-cross")); out.push(poly([[x0 - 0.04, 5.5, zc - 0.3], [x0 - 0.04, 5.5, zc + 0.3], [x0 - 0.04, 7.3, zc + 0.3], [x0 - 0.04, 7.3, zc - 0.3]], "ct-cross")); } }
        }
      }
    }
    /* lo que hay en la carretera, de atrás adelante */
    let nEv = 0;
    const c0 = D.cam0 || 0, d0 = dias[c0];   /* hoy: el día en el que arranca la cámara (en el mes natural, no siempre el primero) */
    /* HOY DE GUARDIA (o saliente): estás dentro del túnel. Su salida se acerca según pasan las horas, y en la pared
       va cada 3 m lo que falta para salir. Solo en la posición de hoy: si avanzas días, el túnel queda atrás */
    if (cam === c0 && d0 && d0.tunel && d0.tunel.faltan != null) {
      const T = d0.tunel, frac = T.total ? Math.max(0.1, Math.min(1, T.faltan / T.total)) : 1, z0 = NEAR - 0.3, z1 = NEAR + 4 + 9 * frac, o = [];
      const XL = -5.4, XR = 3.2, YT = 4.6;
      o.push('<rect class="ct-gceil" x="0" y="0" width="600" height="' + HY + '"/>');   /* dentro no hay cielo */
      o.push(poly([[XL, 0, z0], [XL, YT, z0], [XL, YT, z1], [XL, 0, z1]], "ct-gwl"), poly([[XR, 0, z0], [XR, YT, z0], [XR, YT, z1], [XR, 0, z1]], "ct-gwr"));
      o.push(poly([[XL, YT, z0], [XR, YT, z0], [XR, YT, z1], [XL, YT, z1]], "ct-gceil"));
      for (let zz = z0 + 1.6; zz < z1 - 0.4; zz += 2) if (zz >= NEAR) o.push(poly([[-1.5, YT - 0.1, zz], [0.4, YT - 0.1, zz], [0.4, YT - 0.1, zz + 0.8], [-1.5, YT - 0.1, zz + 0.8]], "ct-glampo"));
      /* la luz al final del túnel: la boca de salida, que se acerca según pasan las horas */
      o.push(poly([[XL, 0, z1], [XR, 0, z1], [XR, YT, z1], [XL, YT, z1]], "ct-salida"));
      o.push(cartel(XL + 0.6, YT * 0.55, z1 - 0.02, XR - XL - 1.2, YT * 0.3, "ct-pared", "SALIDA" + (T.sale ? " · " + T.sale : ""), dur(T.faltan), "ct-paredt", d0.k));
      salidas(o, z0, z1, d0, T.faltan, 3, 3.5);
      out.push(o.join(""));
    }
    /* los días se cuentan desde HOY (c0), no desde el día 1: con el mes natural, el 22 salía «en 21 días» el día 14 */
    for (let i = dias.length - 1; i >= 0; i--) {
      if (i === c0) continue;
      const d = dias[i], z = zDe(i); if (z - 3 > FAR || z + GAP * 1.6 < NEAR) continue;
      const r = i - c0, t = d.tipo, o = [], dow = DIAS[d.dow], fecha = dow + " " + d.d,
        en = r === 1 ? "mañana" : r === -1 ? "ayer" : r > 0 ? "en " + r + " días" : "hace " + (-r) + " días";
      /* el mojón del día: un hito blanco con la cabeza del color del tipo y el número */
      const mx = 3.6, mh = 1.1, col = (D.col && D.col[t]) || COL[t] || COL.libre;   /* el color del tipo, el tuyo si lo has cambiado en Ajustes */
      o.push('<g data-o="' + esc(d.k) + '">' + poly([[mx - 0.25, 0, z - 0.25], [mx + 0.25, 0, z - 0.25], [mx + 0.25, mh, z - 0.25], [mx - 0.25, mh, z - 0.25]], "ct-mojon") +
        poly([[mx - 0.25, mh * 0.62, z - 0.26], [mx + 0.25, mh * 0.62, z - 0.26], [mx + 0.25, mh, z - 0.26], [mx - 0.25, mh, z - 0.26]], "", ' style="fill:' + col + '"'));
      if (z - 0.27 >= NEAR) { const p = pr(mx, mh * 0.3, z - 0.27), fs = Math.max(3, 0.42 * F / z); if (fs >= 3.5) o.push('<text class="ct-mojt" x="' + f1(p[0]) + '" y="' + f1(p[1] + fs * 0.35) + '" style="font-size:' + f1(fs) + 'px">' + d.d + "</text>"); }
      o.push("</g>");
      if (t === "guardia") {
        /* el túnel de la guardia: paredes, techo y lámparas, con los carteles de salida en la pared; la boca oscura
           sobre la carretera, el portal y el cartel con el tipo y las horas */
        const z0 = z - 2, z1 = z + GAP * 0.7;
        tunel(o, z0, z1, d, d.tunel ? d.tunel.total : null);
        /* el portal es un marco (dintel y dos jambas); la boca negra solo de lejos: cerca y dentro se ven las paredes y
           las lámparas, que si no, a dos metros del túnel el parabrisas era negro */
        if (z0 > NEAR + 0.6) { o.push(poly([[-8.5, 7.5, z0], [6.3, 7.5, z0], [6.3, 9, z0], [-8.5, 9, z0]], "ct-portal"), poly([[-8.5, 0, z0], [-7, 0, z0], [-7, 7.5, z0], [-8.5, 7.5, z0]], "ct-portal"), poly([[4.8, 0, z0], [6.3, 0, z0], [6.3, 7.5, z0], [4.8, 7.5, z0]], "ct-portal")); }
        if (z0 > 6) o.push(poly([[-7, 0, z0 - 0.02], [4.8, 0, z0 - 0.02], [4.8, 7.5, z0 - 0.02], [-7, 7.5, z0 - 0.02]], "ct-boca"));
        o.push(cartel(-7.2, 9.3, z0 - 0.03, 13.2, 3.4, "ct-sig", "GUARDIA" + (d.g ? " " + d.g.toUpperCase() : "") + " · " + fecha, (d.gh ? d.gh + " · " : "") + en, "ct-sigt", d.k));
        o.push(seg([-8.3, 0, z0 - 0.05], [-8.3, 9.1, z0 - 0.05], "ct-post", 0.18), seg([6.1, 0, z0 - 0.05], [6.1, 9.1, z0 - 0.05], "ct-post", 0.18));
      }
      if (d.finde0) {
        /* el área de descanso: el carril de entrada a la derecha, la mesa con los bancos y el cartel */
        const z0 = z - 4, z1 = z + GAP * 1.6;
        o.push(poly([[3.0, 0.005, z0 + 2], [11, 0.005, z0 + 8], [11, 0.005, z1 - 6], [3.0, 0.005, z1]], "ct-road"));
        if (z + 3 >= NEAR) o.push(poly([[8.4, 0.3, z + 3], [10.4, 0.3, z + 3], [10.4, 0.3, z + 4.6], [8.4, 0.3, z + 4.6]], "ct-mesa"), poly([[8.4, 0.55, z + 3.2], [10.4, 0.55, z + 3.2], [10.4, 0.55, z + 4.4], [8.4, 0.55, z + 4.4]], "ct-mesat"));
        o.push(cartel(5.2, 2.4, z0 + 1, 7.4, 2.4, "ct-sigv", "ÁREA DE DESCANSO", d.finde1 ? fecha + " – " + d.finde1 : fecha, "ct-sigtv", d.k));
        o.push(seg([5.2, 0, z0 + 0.98], [5.2, 2.4, z0 + 0.98], "ct-post", 0.16), seg([12.6, 0, z0 + 0.98], [12.6, 2.4, z0 + 0.98], "ct-post", 0.16));
      }
      if (d.vac0) {
        /* la salida a la playa: el pórtico verde sobre la carretera con la flecha, y la palmera */
        o.push(seg([-6, 0, z - 2], [-6, 7, z - 2], "ct-post", 0.3), seg([4, 0, z - 2], [4, 7, z - 2], "ct-post", 0.3));
        o.push(cartel(-6.2, 7, z - 2.02, 10.4, 2.8, "ct-sigv", "SALIDA " + d.d + " · PLAYA ↗", "vacaciones · " + d.vac0, "ct-sigtv", d.k));
        if (z + 4 >= NEAR) { o.push(seg([9, 0, z + 4], [9.6, 5, z + 4], "ct-trunk", 0.5)); for (let a = 0; a < 6; a++) { const an = a / 6 * Math.PI * 2; o.push(poly([[9.6, 5, z + 4], [9.6 + Math.cos(an) * 2.6, 4.7 + Math.sin(an) * 0.4, z + 4 + Math.sin(an) * 1.2], [9.6 + Math.cos(an + 0.5) * 2.2, 4.4 + Math.sin(an + 0.5) * 0.3, z + 4 + Math.sin(an + 0.5) * 1.1]], "", ' style="fill:#2f8a4f"')); } }
      }
      /* lo del día cuando toca: el entreno (violeta, a la derecha, bajo), las comidas de los dos próximos días (verde,
         a la izquierda, bajo) y los hábitos que tocan, como banderín en el mojón */
      if (d.gym) { o.push(seg([5.6, 0, z - 1.0], [5.6, 1.3, z - 1.0], "ct-post", 0.14));
        o.push(cartel(3.4, 1.3, z - 1.02, 5.2, 1.5, "ct-sigg", "ENTRENO" + (d.gym.h ? " · " + d.gym.h : ""), d.gym.t || fecha, "ct-sigtg", d.k)); }
      /* si el día siguiente también lleva cartel de comidas, éste va más bajo: a la misma altura tapaba el de detrás
         y de él solo asomaba «…MIDAS» */
      const yc = dias[i + 1] && dias[i + 1].com && dias[i + 1].com.length ? 0.15 : 1.3;
      if (d.com && d.com.length) { o.push(seg([-6.4, 0, z - 1.0], [-6.4, yc, z - 1.0], "ct-post", 0.14));
        o.push(cartel(-9.4, yc, z - 1.02, 5.6, 1.5, "ct-sigm", d.com.length === 1 ? "COMIDA" : d.com.length + " COMIDAS", d.com.join(" · "), "ct-sigtm", d.k)); }
      if (d.hab && z - 0.3 >= NEAR) { o.push(poly([[mx, mh, z - 0.3], [mx, mh + 0.7, z - 0.3], [mx + 0.9, mh + 0.5, z - 0.3]], "ct-pen"));
        const p = pr(mx + 0.3, mh + 0.42, z - 0.31), fs = Math.max(2.5, 0.3 * F / z); if (fs >= 3.5) o.push('<text class="ct-pent" x="' + f1(p[0]) + '" y="' + f1(p[1] + fs * 0.35) + '" style="font-size:' + f1(fs) + 'px">' + d.hab + "</text>"); }
      (d.evs || []).slice(0, 2).forEach((ev, j) => {   /* las señales de los eventos, azules, alternando de lado */
        const izq = (nEv + j) % 2 === 0, px = izq ? -6.2 : 5.4, zz = z - 0.4 - j * 2.4;
        o.push(seg([px, 0, zz], [px, 4.2, zz], "ct-post", 0.16));
        o.push(cartel(izq ? -9.8 : 1.6, 4.2, zz - 0.02, 7.6, 2.3, "ct-sigb", ev.t, (ev.h ? ev.h + " · " : "") + fecha, "ct-sigtb", d.k));
      });
      nEv += Math.min(2, (d.evs || []).length);
      out.push(o.join(""));
    }
    return out.join("");
  }
  /* ---------- la cabina: parabrisas, tira del mes, salpicadero ---------- */
  function cabina(D, cam) {
    const o = [];
    o.push('<path class="ct-frame" d="M0 0H600V' + HG + 'H0ZM22 24H578V' + (HY + 130) + 'H22Z" fill-rule="evenodd"/>');
    o.push('<path class="ct-pillar" d="M22 24L58 24L58 ' + (HY + 130) + 'L22 ' + (HY + 130) + 'Z"/><path class="ct-pillar" d="M542 24L578 24L578 ' + (HY + 130) + 'L542 ' + (HY + 130) + 'Z"/>');
    /* la tira de arriba: el mes entero, hoy en ámbar, las guardias en azul, lo libre en verde, la playa en ámbar claro; la ventana que se ve, en cian */
    const T = D.tira || [];
    o.push('<rect class="ct-strip" x="60" y="4" width="480" height="18" rx="4"/><text class="ct-stt" x="68" y="16">' + esc(D.mesTxt || "") + "</text>");
    const x0 = 130, dx = Math.min(13, 400 / Math.max(1, T.length));
    T.forEach((t, i) => { const x = x0 + i * dx, c = t.hoy ? "ct-snext" : t.pasado ? "ct-spast" : t.tipo === "guardia" ? "ct-sguard" : t.tipo === "vac" ? "ct-svac" : t.tipo === "libre" ? "ct-slibre" : "ct-sdot";
      o.push('<circle class="' + c + '" data-o="' + esc(t.k) + '" cx="' + f1(x) + '" cy="13" r="' + (t.hoy ? 3.6 : t.tipo === "guardia" ? 3 : 2.2) + '"/>'); });
    const ih = T.findIndex((t) => t.hoy);
    if (ih >= 0) { const a = x0 + (ih + cam) * dx - 4, b = x0 + Math.min(T.length - 1, ih + cam + 11) * dx + 4; o.push('<rect class="ct-scam" x="' + f1(a) + '" y="6" width="' + f1(Math.max(8, b - a)) + '" height="14" rx="4"/>'); }
    /* el salpicadero: la fecha, la próxima guardia y los chips */
    const P = D.prox || {};
    o.push('<path class="ct-dashtop" d="M0 ' + (HY + 130) + 'H600V' + HG + 'H0Z"/><path class="ct-dashe" d="M22 ' + (HY + 130) + 'H578"/>');
    o.push('<rect class="ct-lcd" x="40" y="' + (HY + 142) + '" width="150" height="74" rx="8"/><text class="ct-lab" x="52" y="' + (HY + 158) + '">HOY</text><text class="ct-clk" x="115" y="' + (HY + 186) + '">' + esc(D.hoyTxt || "") + '</text><text class="ct-q" x="115" y="' + (HY + 206) + '">' + esc(D.hoySub || "") + "</text>");
    o.push('<rect class="ct-disp" x="205" y="' + (HY + 142) + '" width="250" height="74" rx="8"/><text class="ct-nxl" x="218" y="' + (HY + 158) + '">' + esc(P.guardia ? "PRÓXIMA GUARDIA" : "SIN GUARDIAS A LA VISTA") + '</text><text class="ct-nxb" x="218" y="' + (HY + 184) + '">' + esc(P.guardia ? P.guardia.txt : (P.finde ? P.finde.txt : "")) + '</text><text class="ct-nxa" x="218" y="' + (HY + 204) + '">' + esc(P.guardia ? [P.finde && P.finde.txt, P.vac && P.vac.txt].filter(Boolean).join(" · ") : (P.vac ? P.vac.txt : "")) + "</text>");
    (D.chips || []).slice(0, 2).forEach((c, i) => { const y = HY + 148 + i * 36; o.push('<g data-o="chip:' + esc(c.o) + '"><rect class="ct-chip' + (i ? " c2" : "") + '" x="470" y="' + y + '" width="96" height="26" rx="13"/><text class="ct-chipt' + (i ? " c2" : "") + '" x="518" y="' + (y + 17) + '">' + esc(c.txt) + "</text></g>"); });
    o.push('<path class="ct-wheel" d="M240 ' + (HG + 10) + 'A80 80 0 0 1 360 ' + (HG + 10) + '"/>');
    return o.join("");
  }

  function crea(opts) {
    opts = opts || {};
    const el = document.createElement("div"); el.className = "ct";
    if (!document.getElementById("ct-css")) { const st = document.createElement("style"); st.id = "ct-css"; st.textContent = CSS; document.head.appendChild(st); }
    const svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 " + W + " " + HG); svg.setAttribute("tabindex", "0"); svg.setAttribute("role", "img");
    const gEsc = document.createElementNS(NS, "g"), gCab = document.createElementNS(NS, "g");
    svg.appendChild(gEsc); svg.appendChild(gCab); el.appendChild(svg);
    const sr = document.createElement("div"); sr.className = "ct-sr"; el.appendChild(sr);
    let D = { dias: [] }, cam = 0, arrastre = null, movido = false;
    const maxCam = () => Math.max(0, (D.dias || []).length - 12, D.cam0 || 0);
    let mesVisto = null;
    function pinta() { gEsc.innerHTML = escena(D, cam); gCab.innerHTML = cabina(D, cam); }
    function abre(o) { if (!o || !opts.onAbrir) return; if (o.indexOf("chip:") === 0) opts.onAbrir({ tipo: "chip", o: o.slice(5) }); else opts.onAbrir({ tipo: "dia", k: o }); }
    /* arrastrar hacia arriba o hacia la izquierda = avanzar días; el toque corto abre lo tocado */
    /* lo tocado se apunta al bajar el dedo: con la captura del puntero, el «up» ya llega retargetado al svg */
    svg.addEventListener("pointerdown", (e) => { const t = e.target && e.target.closest ? e.target.closest("[data-o]") : null; arrastre = { x: e.clientX, y: e.clientY, cam: cam, o: t ? t.getAttribute("data-o") : "" }; movido = false; try { svg.setPointerCapture(e.pointerId); } catch (x) {} });
    svg.addEventListener("pointermove", (e) => { if (!arrastre) return; const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y; const esc_ = svg.getBoundingClientRect().width / W;
      const d = (-dx - dy * 0.6) / (38 * esc_); if (Math.abs(dx) + Math.abs(dy) > 6) movido = true; const c = clamp(Math.round(arrastre.cam + d), 0, maxCam()); if (c !== cam) { cam = c; pinta(); } });
    const suelta = () => { if (!arrastre) return; const o = arrastre.o; arrastre = null; if (!movido && o) abre(o); };
    svg.addEventListener("pointerup", suelta); svg.addEventListener("pointercancel", () => { arrastre = null; });
    svg.addEventListener("keydown", (e) => { if (e.key === "ArrowRight" || e.key === "ArrowUp") { cam = clamp(cam + 1, 0, maxCam()); pinta(); e.preventDefault(); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { cam = clamp(cam - 1, 0, maxCam()); pinta(); e.preventDefault(); } else if (e.key === "Home") { cam = 0; pinta(); } });
    sr.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) abre(b.getAttribute("data-o")); });
    function actualiza(d) {
      D = d || { dias: [] };
      if (D.mesTxt !== mesVisto) { mesVisto = D.mesTxt; cam = D.cam0 || 0; }   /* otro mes: la cámara vuelve a hoy (o al día 1) */
      cam = clamp(cam, 0, maxCam());
      el.classList.toggle("ct-claro", !!D.claro);
      svg.setAttribute("aria-label", "La carretera del mes: " + ((D.dias || []).length) + " días por delante. " + (D.prox && D.prox.guardia ? "Próxima guardia " + D.prox.guardia.txt + ". " : "") + "Arrastra para avanzar días; toca un mojón o un cartel para abrir ese día.");
      sr.innerHTML = (D.dias || []).slice(1, 15).map((x) => '<button type="button" data-o="' + esc(x.k) + '">' + esc(DIAS[x.dow] + " " + x.d + " · " + x.tipo + ((x.evs || []).length ? " · " + x.evs.map((e) => e.t).join(", ") : "") +
        (x.gym ? " · entreno " + (x.gym.h || "") : "") + (x.com && x.com.length ? " · comidas " + x.com.join(" ") : "") + (x.hab ? " · " + x.hab + " hábitos" : "")) + "</button>").join("");
      pinta();
    }
    return { el: el, actualiza: actualiza, avanza: function (n) { cam = clamp(cam + n, 0, maxCam()); pinta(); return cam; }, donde: function () { return cam; } };
  }
  window.Carretera = { crea: crea, escena: escena };
})();
