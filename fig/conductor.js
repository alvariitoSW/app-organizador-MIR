/* ===================== HOY DESDE EL ASIENTO DEL CONDUCTOR =====================
   Un módulo sin dependencias: window.Conductor.crea({onAbrir}) devuelve {el, actualiza(datos)}.
   La app lo pinta DENTRO de Hoy (sin marco: no se recarga al repintar ni pierde la hora que movías) y
   fig/conductor.html lo usa suelto como maqueta.

   El día es una ruta: cada cosa es una parada, en el orden en que empieza. Mientras haya algo en
   marcha (un turno, una comida, una cita) el autobús está parado en la última parada; solo va de
   camino en los ratos libres, así que no se marcha del trabajo porque dentro hubiera una comida. Las
   noches y las siestas son la cochera, con la persiana bajada. Una guardia es servicio nocturno: la
   cabina en penumbra y el letrero de búho, sin cochera hasta que sales.

   datos = {
     dia:    [{a,b,t,k,i,h,m}]   a/b en horas desde las 0:00 de ese día (pueden ser <0 o >24);
                                 k: work|guard|meal|gym|plan; i: índice en la agenda de la app;
                                 h: 1 si está hecho; m: 'meal'|'gym' si se puede marcar o empezar
     noches: [{a,b,t}]           cochera: t 'noche' o 'siesta'
     ahora, vivo, modo           la hora; si avanza sola; 'hoy' | 'pasado' | 'futuro'
     sueno:  {h,obj} | null      lo dormido anoche y el objetivo (null: sin apuntar)
     comida: {kc,obj,pr,prObj} | null
     sol:    [sale, pone]        senales: [{t,txt,ico}]   pendiente: [{i,txt}] (sin hora)
     ph:     cosas por marcar en «Para hoy»   manana: hora de salir mañana
   }
   onAbrir recibe {tipo:'item', i, rapida} | {tipo:'sueno'|'anotar'|'comer'|'parahoy'|'nuevoDia'} */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const CSS = `
.cd{position:relative;--cd-frame:#0a0e16;--cd-pillar:#111724;--cd-visor:#161d2c;--cd-dash:#151c2a;--cd-dashe:#2a3448;--cd-panel:#04131a;--cd-panele:#1d3340;
  --cd-disp:#060a10;--cd-ink:#e9f2ff;--cd-ink2:#8fa6c6;--cd-ink3:#5d7394;--cd-amb:#ffd66b;--cd-cyan:#7fecff;--cd-ok:#4ad08a;--cd-wheel:#263044;--cd-dim:0}
.cd.cd-claro{--cd-frame:#c9d2df;--cd-pillar:#b8c2d1;--cd-visor:#aeb9c9;--cd-dash:#dbe2ec;--cd-dashe:#aab6c8;--cd-panel:#f6f9fd;--cd-panele:#b9c6d8;
  --cd-disp:#0b1220;--cd-ink:#0d1726;--cd-ink2:#4a5d78;--cd-ink3:#6f819c;--cd-cyan:#0a7f99;--cd-wheel:#6f7d93}
.cd svg{display:block;width:100%;height:auto;touch-action:pan-y;user-select:none;-webkit-user-select:none;border-radius:14px}
.cd svg:focus-visible{outline:2px solid var(--cd-amb);outline-offset:2px}
.cd [data-o]{cursor:pointer}
.cd-ground{fill:#3b4352}.cd-road{fill:#262c36}.cd-walk{fill:#59616f}.cd-walkl{stroke:#4a5260;fill:none}.cd-kerb{fill:#9aa3b2}.cd-edge{fill:#cfd5df}.cd-dash{fill:#d8dde6}
.cd-ba{fill:#4b5a78}.cd-bb{fill:#3a4763}.cd-bc{fill:#5b6a8a}.cd-bd{fill:#43506d}.cd-bend{fill:#2e3850}.cd-win{fill:#1a2236}.cd-wino{fill:#ffd98a}
.cd-post{stroke:#6c7686;fill:none;stroke-linecap:round}.cd-lamp{fill:#9aa3b2}.cd-glow{fill:#ffd98a}
.cd-shroof{fill:#7f8ea6}.cd-shedge{fill:#5c6b84}.cd-shglass{fill:#9fd0ff;fill-opacity:.22;stroke:#b8c6da;stroke-width:.6}.cd-shbench{fill:#8a6a48}
.cd-board{fill:#0b1020;stroke:#3a4a66;stroke-width:.8}.cd-on .cd-board{stroke:#ffd66b;stroke-width:2}.cd-pend .cd-board{stroke:#f2a33a;stroke-width:1.6;stroke-dasharray:4 3}
.cd-bt{fill:#e9f2ff;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif}.cd-bh{fill:#8fa6c6;font-weight:700;font-family:ui-monospace,Menlo,monospace}
.cd-on .cd-bt,.cd-on .cd-bh{fill:#ffd66b}.cd-hecho .cd-bt{fill:#bfe9d1}.cd-tick{fill:#2f9e6b}.cd-tickm{stroke:#fff;fill:none;stroke-linecap:round;stroke-linejoin:round}
.cd-lv-work{fill:#d9573f}.cd-lv-guard{fill:#34467e}.cd-lv-meal{fill:#2f9e6b}.cd-lv-gym{fill:#7a5cf0}.cd-lv-plan{fill:#1fa6c4}
.cd-sig{fill:#f3efe4;stroke:#c9302c}.cd-sigt{fill:#1d2b40;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-gfloor{fill:#151a22}.cd-gceil{fill:#0d1118}.cd-gwl{fill:#1b212b}.cd-gwr{fill:#181d26}.cd-gback{fill:#20262f}.cd-gdoor{fill:#3d4859}.cd-gslat{stroke:#28303c;stroke-width:.8;fill:none}
.cd-gslit{fill:#ffd98a}.cd-glamp{fill:#2a3240}.cd-glampo{fill:#ffe9b0}
.cd-frame{fill:var(--cd-frame)}.cd-pillar{fill:var(--cd-pillar)}.cd-visor{fill:var(--cd-visor)}.cd-seal{stroke:#1e2738;stroke-width:3;fill:none}
.cd-mirror{fill:#0e1420;stroke:#2a3448;stroke-width:2}.cd-mirrorg{fill:#1a2333}.cd-mirt{fill:#8fa6c6;font:600 11px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.cd-mirt.cd-pend{fill:#f2a33a}
.cd-strip{fill:#05070c;stroke:#1e2738;stroke-width:1.2}.cd-stripl{stroke:#2a3a55;stroke-width:2}.cd-stt{fill:#5d7394;font:700 9.5px ui-monospace,Menlo,monospace;letter-spacing:.06em}
.cd-sdot{fill:#2a3a55}.cd-sdone{fill:#4ad08a}.cd-spast{fill:#56708f}.cd-snext{fill:#ffd66b}.cd-spend{fill:none;stroke:#f2a33a;stroke-width:1.8}.cd-sbus{fill:#38e1ff}
.cd-dashtop{fill:var(--cd-dash)}.cd-dashe{stroke:var(--cd-dashe);stroke-width:1.5;fill:none}
.cd-lcd{fill:var(--cd-panel);stroke:var(--cd-panele);stroke-width:1.2}.cd-clk{fill:var(--cd-cyan);font:700 30px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-anchor:middle}
.cd-q{fill:var(--cd-ink2);font:700 11.5px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.cd-lab{fill:var(--cd-ink3);font:800 9px ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em}
.cd-bar{fill:#1f2a3d}.cd-claro .cd-bar{fill:#dfe6ef}.cd-barf{fill:#5a78d0}.cd-barf.cd-kc{fill:#2f9e6b}.cd-barobj{stroke:#38e1ff;stroke-width:2}.cd-bv{fill:var(--cd-ink);font:700 11px ui-monospace,Menlo,monospace}
.cd-bv.cd-sin{fill:#f2a33a}
.cd-disp{fill:var(--cd-disp);stroke:var(--cd-dashe);stroke-width:1.4}.cd-nxl{fill:#b98c2c;font:800 10px ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em}
.cd-nxb{fill:#ffd66b;font:800 12.5px ui-sans-serif,system-ui,sans-serif}.cd-nxa{fill:#e9f2ff;font:600 12px ui-sans-serif,system-ui,sans-serif}
.cd-wheel{stroke:var(--cd-wheel);stroke-width:22;fill:none}.cd-spoke{fill:var(--cd-wheel)}.cd-horn{fill:var(--cd-dashe)}
.cd-tkb{fill:#1b2333;stroke:#2a3448;stroke-width:1.2}.cd-tkp{fill:#f3efe4}.cd-tkt{fill:#1d2b40;font:800 11px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-note{fill:#ffe27a}.cd-notet{fill:#3a2a00;font:800 11px ui-sans-serif,system-ui,sans-serif}
.cd-chip{fill:#0d1726;stroke:#ffd66b;stroke-width:1.2}.cd-chipt{fill:#ffd66b;font:700 12px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-dimmer{fill:#000;pointer-events:none}
.cd-trunk{stroke:#4a3527;fill:none;stroke-linecap:round}.cd-line{stroke:#e9f2e4;fill:none}.cd-fence{stroke:#8a96a8;fill:none;stroke-linecap:round}.cd-flood{fill:#cfd6e0}.cd-floodo{fill:#fff6d0}
.cd-gyma{fill:#4b3f7a}.cd-gymb{fill:#3a3163}.cd-gymg{fill:#1a2236}.cd-gymgo{fill:#ffe7a6}.cd-gyms{fill:#0b1020;stroke:#9c86ff;stroke-width:.8}.cd-gymt{fill:#e9e4ff;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-humo{fill:none;stroke:#e6ebf2;stroke-linecap:round;opacity:0;animation:cd-humo 3.6s ease-out infinite}.cd-ascua{fill:#ff7a2e;animation:cd-ascua 2.2s ease-in-out infinite}
@keyframes cd-humo{0%{opacity:0;transform:translateY(0)}18%{opacity:.6}100%{opacity:0;transform:translateY(var(--sube,-20px))}}@keyframes cd-ascua{0%,100%{opacity:.7}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.cd-humo{animation:none;opacity:.35}.cd-ascua{animation:none}}
.cd-hosp{fill:#c9d2de}.cd-hospe{fill:#9aa6b8}.cd-cross{fill:#e5484d}.cd-fly{fill:#e6ff8a}
.cd-rot{fill:var(--cd-amb);font:800 10.5px ui-sans-serif,system-ui,sans-serif;letter-spacing:.02em}
/* de guardia la cabina cambia: bata blanca en las mangas, el panel y el parasol en rojo, el busca en el salpicadero */
.cd.guardia{--cd-panel:#1c0a0f;--cd-panele:#7a2a35;--cd-disp:#140608;--cd-cyan:#ff8c7a;--cd-visor:#3a1017}
.cd.guardia .cd-manga{fill:#eef2f7}.cd.guardia .cd-rot{fill:#ffb3a7}.cd.guardia .cd-nxl{fill:#e07a6c}.cd.guardia .cd-nxb{fill:#ffb3a7}
.cd-busca{fill:#1a1f2b;stroke:#3a4458;stroke-width:1.2}.cd-buscap{fill:#0a0d14}.cd-buscat{fill:#8fa6c6;font:800 8.5px ui-monospace,Menlo,monospace;letter-spacing:.08em}
.cd-buscav{fill:#ffb3a7;font:800 11px ui-monospace,Menlo,monospace}.cd-led{fill:#ff3b3b;animation:cd-led 1.6s ease-in-out infinite}
@keyframes cd-led{0%,100%{opacity:.25}50%{opacity:1}}@media (prefers-reduced-motion:reduce){.cd-led{animation:none;opacity:.9}}
.cd-mano{fill:#e3b08e;stroke:#b07a52;stroke-width:1.1}.cd-manol{fill:none;stroke:#b07a52;stroke-width:.9}.cd-manga{fill:#2f5fb3}
.cd-manillar{fill:none;stroke:#7d8ea8;stroke-width:11;stroke-linecap:round;paint-order:stroke;filter:drop-shadow(0 0 1px #05080e)}.cd-puno{fill:#0d1726;stroke:#7d8ea8;stroke-width:1.2}.cd-timbre{fill:#c9d4e4;stroke:#8fa6c6;stroke-width:1.2}.cd-timbrec{fill:#8fa6c6}
.cd-bicit{fill:var(--cd-ok);font:800 11px ui-sans-serif,system-ui,sans-serif}
.cd-taxi{fill:#f2cf3a}.cd-taxid{fill:#b8961c}.cd-taxiv{fill:#0a1220}.cd-taxit{fill:#0d1726;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.cd-taxil{fill:#7fe0a8}
.cd-barra{stroke:#9aa6b8;fill:none;stroke-linecap:round}.cd-cuerpo{fill:#2f5fb3}.cd-piel{fill:#e3b08e}.cd-gorra{fill:#1d3a73}
.cd-nxl{font-size:9.5px}.cd-nxb{font-size:12.5px;font-weight:800}.cd-nxa{font-size:12px}
.cd-arc0{fill:none;stroke:#1f2a3d;stroke-width:5;stroke-linecap:round}.cd-arc{fill:none;stroke:var(--cd-cyan);stroke-width:5;stroke-linecap:round}
.cd-esp{fill:#1b2333;stroke:#38e1ff;stroke-width:3}.cd-espd{stroke:#4ad08a}.cd-espc{fill:#5b6a8a}.cd-esp.on{stroke-width:6;filter:drop-shadow(0 0 6px #38e1ff)}.cd-espd.on{filter:drop-shadow(0 0 6px #4ad08a)}
.cd-lado{fill:#0d1726;stroke-width:2}.cd-ladoi{stroke:#38e1ff}.cd-ladod{stroke:#4ad08a}.cd-ladot{font:800 13px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.cd-ladoit{fill:#7fecff}.cd-ladodt{fill:#7cf0b0}
.cd-tks{fill:#04131a}.cd-tkv{fill:#7fecff;font:700 11px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-rdisp{fill:#061a10}.cd-rt{fill:#7cf0b0;font:800 11px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.cd-rl{fill:#4ad08a;font:700 9.5px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-knob{fill:#2a3448;stroke:#5d6676;stroke-width:2}.cd-rh{fill:var(--cd-ink3);font:700 11px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-ranura{stroke:#3a4458;stroke-width:7;stroke-linecap:round;fill:none}.cd-ml{fill:#8fa6c6;font:900 15px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.cd-mw{fill:#5d7394;font:700 11px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-ml.on,.cd-mw.on{fill:#ffd66b}.cd-palo{stroke:#5d6676;stroke-width:9;stroke-linecap:round}.cd-pomo{fill:#2a3448;stroke:#ffd66b;stroke-width:2.5}
[data-r="palanca"]{transition:transform .35s ease}@media (prefers-reduced-motion:reduce){[data-r="palanca"]{transition:none}}
.cd-rpanel{fill:#10151f;stroke:#ffd66b;stroke-width:2.5}.cd-rtt{fill:#7cf0b0;font:900 16px ui-sans-serif,system-ui,sans-serif}.cd-rs1{fill:#c8ffe0;font:800 20px ui-sans-serif,system-ui,sans-serif}.cd-rs2{fill:#4ad08a;font:700 12.5px ui-sans-serif,system-ui,sans-serif}
.cd-rlink{fill:#0d2a1c;stroke:#4ad08a;stroke-width:1.5}.cd-rlinkt{fill:#7cf0b0;font:800 12px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-rlab{fill:#8fa6c6;font:800 11.5px ui-sans-serif,system-ui,sans-serif;letter-spacing:.04em}.cd-rmini{fill:#5d7394;font:700 11px ui-sans-serif,system-ui,sans-serif}
.cd-kb rect{fill:#1b2333;stroke:#3a4458;stroke-width:2}.cd-kb text{fill:#c9d4e4;font:900 18px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.cd-kb.on rect{fill:#ffd66b;stroke:#ffd66b}.cd-kb.on text{fill:#06101a}
.cd-ab circle{fill:#1b2333;stroke:#3a4458;stroke-width:2}.cd-ab text{font-size:17px;text-anchor:middle}.cd-ab.on circle{fill:#3a2f0a;stroke:#ffd66b}
.cd-dial{fill:#2a3448;stroke:#38e1ff;stroke-width:2}.cd-dialm{stroke:#38e1ff;stroke-width:3;stroke-linecap:round}.cd-rint{fill:#e9f2ff;font:700 12.5px ui-sans-serif,system-ui,sans-serif}
.cd-rx{fill:#1b2333;stroke:#ffd66b;stroke-width:2}.cd-rxt{fill:#ffd66b;font:900 18px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd.casa .cd-frame,.cd.casa .cd-seal,.cd.casa .cd-pillar,.cd.casa .cd-visor,.cd.casa [data-r="rot"],.cd.casa [data-o="atras"],.cd.casa .cd-espejo,.cd.casa [data-r="volante"]{display:none}
.cd.casa{--cd-dash:#3b2a1f;--cd-dashe:#5c4330}
.cd-pan{transition:transform .55s cubic-bezier(.45,.05,.25,1)}.cd-pan.sin{transition:none}@media (prefers-reduced-motion:reduce){.cd-pan{transition:none}}
.cd-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.cd-sr:focus-within{position:static;width:auto;height:auto;clip-path:none;white-space:normal;display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.cd-sr button{font:inherit;font-size:13px;padding:6px 10px;border-radius:8px;border:1px solid #2a3448;background:#0d1726;color:#e9f2ff}`;

  /* ---------- utilidades ---------- */
  const hhmm = (h) => { const m = Math.round(((h % 24) + 24) % 24 * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
  const dura = (h) => { const m = Math.max(0, Math.round(h * 60)); return m >= 60 ? Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0") : m + " min"; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const cap = (s) => { s = String(s || "").toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (p) => { p = clamp(p, 0, 1); return p * p * (3 - 2 * p); };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const mix = (a, b, f) => { const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, "0")).join(""); };
  const TURNO = (k) => k === "work" || k === "guard";
  /* la ruta copia las cosas del día: se comparan por índice y hora, no por referencia */
  const igual = (x, y) => !!x && !!y && String(x.i) === String(y.i) && x.a === y.a;
  const esta = (l, x) => l.some((y) => igual(x, y));

  /* ---------- la cámara: los ojos del conductor ---------- */
  const CX = 300, HY = 255, F = 270, EYE = 2.4, NEAR = 0.9, FAR = 260, ZSTOP = 9, GAP = 40;
  const pr = (x, y, z) => [CX + F * x / z, HY + F * (EYE - y) / z];
  function poly(pts, cls, extra) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], ina = a[2] >= NEAR, inb = b[2] >= NEAR;
      if (ina) out.push(a);
      if (ina !== inb) { const f = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, NEAR]); }
    }
    if (out.length < 3) return "";
    return '<path class="' + cls + '"' + (extra || "") + ' d="M' + out.map((p) => { const s = pr(p[0], p[1], p[2]); return s[0].toFixed(1) + " " + s[1].toFixed(1); }).join("L") + 'Z"/>';
  }
  function seg(a, b, cls, w) {
    if (a[2] < NEAR && b[2] < NEAR) return "";
    if (a[2] < NEAR) { const f = (NEAR - a[2]) / (b[2] - a[2]); a = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, NEAR]; }
    if (b[2] < NEAR) { const f = (NEAR - b[2]) / (a[2] - b[2]); b = [b[0] + (a[0] - b[0]) * f, b[1] + (a[1] - b[1]) * f, NEAR]; }
    const p = pr(a[0], a[1], a[2]), q = pr(b[0], b[1], b[2]), zw = Math.min(a[2], b[2]);
    return '<path class="' + cls + '" style="stroke-width:' + Math.max(0.6, w * F / zw).toFixed(2) + 'px" d="M' + p[0].toFixed(1) + " " + p[1].toFixed(1) + "L" + q[0].toFixed(1) + " " + q[1].toFixed(1) + '"/>';
  }

  /* ---------- la ruta: paradas y cocheras en el orden en que empiezan ---------- */
  function ruta(D) {
    const it = (D.dia || []).filter((e) => e.b > e.a).map((e) => Object.assign({}, e));
    /* lo que cae dentro de un turno (la sesión, la comida) es una parada, y después EL TURNO VUELVE como
       parada: sin esto, el autobús se quedaba en el cartel «10:00 Sesión» hasta las 15:00 */
    const vuelta = [];
    it.filter((T) => TURNO(T.k)).forEach((T) => {
      /* lo que empieza a la vez que el turno (la sesión de las 8:00 con la jornada de las 8:00) va primero:
         el cartel del turno se pone donde acaba. Sin esto el autobús se quedaba en «8:00 Sesión» todo el día */
      const aLaVez = it.filter((c) => c !== T && !TURNO(c.k) && Math.abs(c.a - T.a) < 1e-6 && c.b < T.b - 1e-6).sort((x, y) => y.b - x.b)[0];
      if (aLaVez) T.a = aLaVez.b;
      const dentro = it.filter((c) => c !== T && !TURNO(c.k) && c.a > T.a + 1e-6 && c.b < T.b - 1e-6).sort((x, y) => x.a - y.a);
      dentro.forEach((c, j) => { const fin = dentro[j + 1] ? dentro[j + 1].a : T.b; if (fin - c.b >= 0.25) vuelta.push(Object.assign({}, T, { a: c.b, b: fin, cont: true, padre: T.a })); });
    });
    const no = (D.noches || []).filter((n) => n.b > n.a).map((n) => Object.assign({ dep: true }, n));
    const est = it.concat(vuelta, no).sort((x, y) => x.a - y.a || (x.dep ? 1 : 0) - (y.dep ? 1 : 0));
    est.forEach((e, i) => { e.s = i * GAP; e.amb = ambDe(e, it); });
    /* lo que tiene algo en marcha: mientras dure, el autobús no se mueve */
    const iv = est.map((e) => [e.a, e.b]).sort((x, y) => x[0] - y[0]), union = [];
    iv.forEach((v) => { const u = union[union.length - 1]; if (u && v[0] <= u[1] + 1e-6) u[1] = Math.max(u[1], v[1]); else union.push(v.slice()); });
    const finDe = (t) => { const u = union.find((v) => t >= v[0] - 1e-6 && t <= v[1] + 1e-6); return u ? u[1] : t; };
    est.forEach((e, i) => { const sig = est[i + 1]; e.hold = sig ? Math.min(sig.a, finDe(e.a)) : finDe(e.a); });
    return { est, union };
  }
  /* el paisaje de cada parada: la ciudad si es la jornada (o cae dentro), el hospital de guardia, el
     polideportivo si toca entrenar y el bosque en lo libre y por la noche */
  const esLL = (e) => !!e && (e.ll || /lloret/i.test(String(e.t || "")));
  function ambDe(e, it) {
    if (e.dep) return "bosque";
    if (esLL(e)) return "mar";
    if (e.k === "guard") return "hospital";
    if (e.k === "work") return "ciudad";
    if (e.k === "gym") return "deporte";
    const t = (it || []).find((x) => TURNO(x.k) && e.a >= x.a && e.a < x.b);
    return t ? (t.k === "guard" ? "hospital" : "ciudad") : "bosque";
  }
  /* el ambiente de un trozo de carretera: el de su parada; entre dos, se mezclan con un fundido de
     manzanas (cada una elige según lo cerca que esté de la siguiente) */
  function ambEn(R, w, semilla) {
    const E = R.est, n = E.length; if (!n) return "bosque";
    const f = (w - ZSTOP) / GAP, i = Math.floor(f);
    if (i < 0) return E[0].amb; if (i >= n - 1) return E[n - 1].amb;
    return hash(semilla) < ease((f - i - 0.3) / 0.4) ? E[i + 1].amb : E[i].amb;
  }
  /* dónde va el autobús a una hora: parado en la última parada mientras haya algo en marcha; entre
     una y otra, de camino */
  function camDe(R, t) {
    const E = R.est;
    if (!E.length) return { s: 0, k: -1, parado: true };
    if (t < E[0].a) return { s: E[0].s - GAP, k: -1, parado: false, p: 1, sig: 0 };
    let k = 0; for (let j = 0; j < E.length; j++) if (E[j].a <= t) k = j;
    const e = E[k], q = E[k + 1];
    if (t <= e.hold || !q) return { s: e.s, k, parado: true };
    const p = (t - e.hold) / Math.max(0.01, q.a - e.hold);
    return { s: e.s + (q.s - e.s) * ease(p), k, parado: false, p, sig: k + 1 };
  }

  /* ---------- la luz ---------- */
  function luz(t, SOL) {
    const d = clamp(Math.min((t - SOL[0] + 0.5), (SOL[1] + 0.5 - t)), 0, 1);
    const tw = clamp(1 - Math.min(Math.abs(t - SOL[0]), Math.abs(t - SOL[1])) / 0.8, 0, 1);
    let top = mix("#0b1430", "#4f93d8", d), bot = mix("#1b2a4e", "#bfe0ff", d);
    bot = mix(bot, "#f2a65a", tw * 0.7); top = mix(top, "#6b5aa8", tw * 0.35);
    return { d, top, bot };
  }

  /* ---------- el dibujo fijo: marco, salpicadero, volante ---------- */
  const MARCO = `
  <defs><clipPath id="cdwin__ID"><path d="M44 56 Q300 44 556 56 L574 560 Q300 580 26 560 Z"/></clipPath><clipPath id="cdcasa__ID"><rect x="0" y="40" width="600" height="566"/></clipPath>
    <linearGradient id="cdsky__ID" x1="0" y1="0" x2="0" y2="1"><stop data-r="sky0" offset="0" stop-color="#5aa0e0"/><stop data-r="sky1" offset="1" stop-color="#bfe0ff"/></linearGradient>
    <linearGradient id="cdmar__ID" x1="0" y1="0" x2="0" y2="1"><stop data-r="mar0" offset="0" stop-color="#4c8fc4"/><stop data-r="mar1" offset="1" stop-color="#123a5e"/></linearGradient>
    <linearGradient id="cdrio__ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c8fc4"/><stop offset="1" stop-color="#1d5a8a"/></linearGradient>
    <linearGradient id="cdbeam__ID" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff3c4" stop-opacity=".42"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></linearGradient></defs>
  <g data-r="vent" clip-path="url(#cdwin__ID)">
    <rect x="0" y="0" width="600" height="600" fill="url(#cdsky__ID)"/>
    <g data-r="frenteg" class="cd-pan"><g data-r="stars"></g><g data-r="scene"></g><g data-r="garage"></g></g><g data-r="lado" class="cd-pan"></g>
    <g data-r="mirar" style="display:none" data-o="ahora"><rect class="cd-chip" x="214" y="520" width="172" height="28" rx="14"/><text data-r="mirart" class="cd-chipt" x="300" y="538.5"></text></g>
  </g>
  <path class="cd-frame" fill-rule="evenodd" d="M0 0H600V610H0Z M44 56 Q300 44 556 56 L574 560 Q300 580 26 560 Z"/>
  <path class="cd-seal" d="M44 56 Q300 44 556 56 L574 560 Q300 580 26 560 Z"/>
  <path class="cd-pillar" d="M0 44 L44 56 L26 560 L0 600Z"/><path class="cd-pillar" d="M600 44 L556 56 L574 560 L600 600Z"/>
  <path class="cd-visor" d="M62 54 Q150 48 238 51 L234 80 Q150 78 68 82 Z"/><text data-r="rot" class="cd-rot" x="151" y="70" text-anchor="middle"></text>
  <g data-o="atras"><rect class="cd-mirror" x="244" y="52" width="112" height="30" rx="9"/><rect class="cd-mirrorg" x="249" y="56.5" width="102" height="21" rx="6"/>
    <text data-r="mir" class="cd-mirt" x="300" y="71"></text><rect x="296" y="42" width="8" height="11" rx="2" class="cd-pillar"/></g>
  <rect class="cd-strip" x="40" y="8" width="520" height="28" rx="7"/><text class="cd-stt" x="52" y="25.5">LÍNEA DE HOY</text><g data-r="route"></g>
  <g data-o="mirai" class="cd-espejo"><ellipse data-r="mi" class="cd-esp" cx="30" cy="520" rx="32" ry="40"/><ellipse class="cd-espc" cx="30" cy="520" rx="24" ry="32"/>
    <rect x="16" y="508" width="9" height="28" rx="1" fill="#2e3850"/><rect x="27" y="498" width="11" height="38" rx="1" fill="#3a4763"/><rect x="40" y="516" width="7" height="20" rx="1" fill="#2e3850"/></g>
  <g data-o="mirad" class="cd-espejo"><ellipse data-r="md" class="cd-esp cd-espd" cx="570" cy="520" rx="32" ry="40"/><ellipse class="cd-espc" cx="570" cy="520" rx="24" ry="32" style="fill:#46784d"/>
    <path d="M548 526L563 502L576 514L592 500V548H548Z" fill="#6f8aa8"/><rect x="546" y="530" width="48" height="9" fill="#4c8fc4"/></g>
  <path class="cd-dashtop" d="M0 604 Q300 576 600 604 V900 H0Z"/><path class="cd-dashe" d="M0 604 Q300 576 600 604"/>
  <g data-o="mirai"><rect class="cd-lado cd-ladoi" x="6" y="588" width="98" height="26" rx="13"/><text class="cd-ladot cd-ladoit" x="55" y="606">◀ eventos</text></g>
  <g data-o="mirad"><rect class="cd-lado cd-ladod" x="484" y="588" width="110" height="26" rx="13"/><text class="cd-ladot cd-ladodt" x="539" y="606">entreno ▶</text></g>
  <g data-o="proxima"><rect class="cd-lcd" x="180" y="620" width="240" height="110" rx="20"/>
    <path class="cd-arc0" d="M222 684H378"/><path data-r="arc" class="cd-arc" d=""/>
    <text data-r="nxl" class="cd-nxl" x="300" y="638" text-anchor="middle"></text><text data-r="clk" class="cd-clk" x="300" y="672"></text>
    <text data-r="nxa" class="cd-nxa" x="300" y="704" text-anchor="middle"></text><text data-r="nxb" class="cd-nxb" x="300" y="721" text-anchor="middle"></text><text data-r="q" class="cd-q" x="300" y="0" style="display:none"></text></g>
  <g data-o="parahoy"><rect class="cd-tkb" x="18" y="652" width="142" height="76" rx="10"/><rect class="cd-tkp" x="30" y="630" width="118" height="28" rx="2"/>
    <text data-r="tk" class="cd-tkt" x="89" y="649"></text><rect x="30" y="676" width="118" height="20" rx="4" class="cd-tks"/><text data-r="tkv" class="cd-tkv" x="89" y="690"></text><circle cx="42" cy="712" r="4" fill="#38e1ff"/></g>
  <g data-o="radio"><rect class="cd-tkb" x="440" y="632" width="142" height="92" rx="12"/><rect class="cd-rdisp" x="452" y="644" width="118" height="32" rx="5"/>
    <text class="cd-rt" x="511" y="659">📻 RADIO SUEÑO</text><text data-r="rdl" class="cd-rl" x="511" y="671"></text>
    <circle class="cd-knob" cx="472" cy="700" r="12"/><circle class="cd-knob" cx="550" cy="700" r="12"/><rect x="490" y="694" width="8" height="12" rx="2" fill="#1f2a3d"/><rect x="502" y="694" width="8" height="12" rx="2" fill="#1f2a3d"/><rect x="514" y="694" width="8" height="12" rx="2" fill="#1f2a3d"/><rect x="526" y="694" width="8" height="12" rx="2" fill="#1f2a3d"/>
    <text class="cd-rh" x="511" y="740">toca para oírla</text></g>
  <g data-r="busca" style="display:none"><rect class="cd-busca" x="432" y="752" width="156" height="32" rx="6"/><rect class="cd-buscap" x="440" y="758" width="124" height="20" rx="3"/>
    <text class="cd-buscat" x="445" y="766">GUARDIA</text><text data-r="buscav" class="cd-buscav" x="445" y="776"></text><circle class="cd-led" cx="576" cy="768" r="4"/></g>
  <g data-r="nota" data-o="nota" style="display:none"><path class="cd-note" d="M428 796 L588 794 L590 830 L430 833 Z"/><text data-r="notat" class="cd-notet" x="438" y="817"></text></g>
  <g class="cd-marcha"><rect class="cd-tkb" x="8" y="772" width="132" height="120" rx="18"/><path class="cd-ranura" d="M32 832H112"/>
    <text data-r="mR" class="cd-ml" x="32" y="858">R</text><text data-r="mN" class="cd-ml" x="72" y="858">N</text><text data-r="mD" class="cd-ml" x="112" y="858">D</text>
    <text data-r="wR" class="cd-mw" x="32" y="878">ayer</text><text data-r="wN" class="cd-mw" x="72" y="878">hoy</text><text data-r="wD" class="cd-mw" x="112" y="878">mañana</text>
    <g data-r="palanca"><path class="cd-palo" d="M72 832L72 786"/><circle class="cd-pomo" cx="72" cy="778" r="16"/><circle cx="67" cy="773" r="5" fill="#5d6676"/></g>
    <rect data-o="marcha" data-d="-1" x="10" y="774" width="42" height="116" fill="transparent"/><rect data-o="marcha" data-d="0" x="52" y="774" width="40" height="116" fill="transparent"/><rect data-o="marcha" data-d="1" x="92" y="774" width="46" height="116" fill="transparent"/></g>
  <g data-r="volante" style="pointer-events:none"><circle class="cd-wheel" cx="300" cy="932" r="160"/><path class="cd-spoke" d="M172 884 Q300 852 428 884 L418 904 Q300 876 182 904Z"/><circle class="cd-horn" cx="300" cy="918" r="46"/>
    <g transform="translate(178 830) scale(1.2)"><path class="cd-mano" d="M-15 2 Q-16 -10 -7 -12 L8 -12 Q16 -10 15 -1 L14 10 Q6 16 -7 13 Q-15 11 -15 2Z"/><path class="cd-manol" d="M-11 -3 Q-6 -7 -1 -3 M-8 3 Q-3 -1 2 3"/><path class="cd-manga" d="M-17 10 Q-18 20 -8 22 L8 22 Q18 20 17 10 L14 10 Q6 16 -7 13 Q-15 11 -15 2Z"/></g>
    <g transform="translate(422 830) scale(-1.2 1.2)"><path class="cd-mano" d="M-15 2 Q-16 -10 -7 -12 L8 -12 Q16 -10 15 -1 L14 10 Q6 16 -7 13 Q-15 11 -15 2Z"/><path class="cd-manol" d="M-11 -3 Q-6 -7 -1 -3 M-8 3 Q-3 -1 2 3"/><path class="cd-manga" d="M-17 10 Q-18 20 -8 22 L8 22 Q18 20 17 10 L14 10 Q6 16 -7 13 Q-15 11 -15 2Z"/></g></g>
  <g data-r="bici" style="display:none;pointer-events:none"><g transform="translate(150 372)"><path class="cd-manillar" d="M14 436 Q60 404 120 410 Q150 414 150 440"/><path class="cd-manillar" d="M286 436 Q240 404 180 410 Q150 414 150 440"/>
    <rect class="cd-puno" x="8" y="422" width="30" height="14" rx="7"/><rect class="cd-puno" x="262" y="422" width="30" height="14" rx="7"/><circle class="cd-timbre" cx="236" cy="408" r="7"/><circle class="cd-timbrec" cx="236" cy="408" r="2.2"/>
    <g transform="translate(46 420)"><path class="cd-mano" d="M-15 2 Q-16 -10 -7 -12 L8 -12 Q16 -10 15 -1 L14 10 Q6 16 -7 13 Q-15 11 -15 2Z"/><path class="cd-manga" d="M-17 10 Q-18 20 -8 22 L8 22 Q18 20 17 10 L14 10 Q6 16 -7 13 Q-15 11 -15 2Z"/></g>
    <g transform="translate(254 420) scale(-1 1)"><path class="cd-mano" d="M-15 2 Q-16 -10 -7 -12 L8 -12 Q16 -10 15 -1 L14 10 Q6 16 -7 13 Q-15 11 -15 2Z"/><path class="cd-manga" d="M-17 10 Q-18 20 -8 22 L8 22 Q18 20 17 10 L14 10 Q6 16 -7 13 Q-15 11 -15 2Z"/></g>
    <text class="cd-bicit" x="150" y="396" text-anchor="middle">🚲 a casa en bici</text></g></g>
  <g data-r="manosc" style="display:none;pointer-events:none"></g>
  <rect data-r="dim" class="cd-dimmer" x="0" y="604" width="600" height="296" opacity="0"/>
  <g data-r="radiob" style="display:none"><rect data-o="radio" x="0" y="580" width="600" height="320" fill="#000" opacity=".4"/>
    <rect class="cd-rpanel" x="26" y="608" width="548" height="284" rx="22"/><rect class="cd-rdisp" x="46" y="626" width="508" height="104" rx="10"/>
    <text class="cd-rtt" x="62" y="652">📻 RADIO SUEÑO · 97.5 FM</text><g data-o="sueno"><rect x="420" y="634" width="128" height="26" rx="13" class="cd-rlink"/><text class="cd-rlinkt" x="484" y="652">abrir Sueño ›</text></g>
    <text data-r="rs1" class="cd-rs1" x="62" y="686"></text><text data-r="rs2" class="cd-rs2" x="62" y="714"></text>
    <text class="cd-rlab" x="46" y="748">¿CÓMO AMANECES? · los botones de emisora</text><g data-o="kss" data-v="1" class="cd-kb"><rect x="46" y="756" width="50" height="40" rx="8"/><text x="71" y="783">1</text></g><g data-o="kss" data-v="2" class="cd-kb"><rect x="103" y="756" width="50" height="40" rx="8"/><text x="128" y="783">2</text></g><g data-o="kss" data-v="3" class="cd-kb"><rect x="160" y="756" width="50" height="40" rx="8"/><text x="185" y="783">3</text></g><g data-o="kss" data-v="4" class="cd-kb"><rect x="217" y="756" width="50" height="40" rx="8"/><text x="242" y="783">4</text></g><g data-o="kss" data-v="5" class="cd-kb"><rect x="274" y="756" width="50" height="40" rx="8"/><text x="299" y="783">5</text></g><g data-o="kss" data-v="6" class="cd-kb"><rect x="331" y="756" width="50" height="40" rx="8"/><text x="356" y="783">6</text></g><g data-o="kss" data-v="7" class="cd-kb"><rect x="388" y="756" width="50" height="40" rx="8"/><text x="413" y="783">7</text></g><g data-o="kss" data-v="8" class="cd-kb"><rect x="445" y="756" width="50" height="40" rx="8"/><text x="470" y="783">8</text></g><g data-o="kss" data-v="9" class="cd-kb"><rect x="502" y="756" width="50" height="40" rx="8"/><text x="527" y="783">9</text></g>
    <text class="cd-rmini" x="46" y="814">1 muy despierto</text><text class="cd-rmini" x="554" y="814" text-anchor="end">9 me caigo</text>
    <text class="cd-rlab" x="46" y="858">ÁNIMO</text><g data-o="animo" data-v="1" class="cd-ab"><circle cx="118" cy="852" r="17"/><text x="118" y="858">😣</text></g><g data-o="animo" data-v="2" class="cd-ab"><circle cx="158" cy="852" r="17"/><text x="158" y="858">😕</text></g><g data-o="animo" data-v="3" class="cd-ab"><circle cx="198" cy="852" r="17"/><text x="198" y="858">😐</text></g><g data-o="animo" data-v="4" class="cd-ab"><circle cx="238" cy="852" r="17"/><text x="238" y="858">🙂</text></g><g data-o="animo" data-v="5" class="cd-ab"><circle cx="278" cy="852" r="17"/><text x="278" y="858">😄</text></g>
    <g data-o="int"><circle class="cd-dial" cx="352" cy="852" r="18"/><path data-r="rdial" class="cd-dialm" d="M352 852L342 840"/><text data-r="rint" class="cd-rint" x="378" y="857"></text></g>
    <g data-o="radio"><circle cx="556" cy="626" r="15" class="cd-rx"/><text class="cd-rxt" x="556" y="632">×</text></g></g>`;

  function crea(opts) {
    opts = opts || {};
    const ID = Math.random().toString(36).slice(2, 8);
    const el = document.createElement("div");
    el.className = "cd";
    if (!document.getElementById("cd-css")) { const st = document.createElement("style"); st.id = "cd-css"; st.textContent = CSS; document.head.appendChild(st); }
    el.innerHTML = '<svg viewBox="0 0 600 900" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="24" aria-label="Tu día desde el asiento del conductor. Arrastra a lo ancho o usa las flechas para mover la hora; Intro abre la próxima parada.">' + MARCO.replace(/__ID/g, ID) + "</svg>" +
      '<div class="cd-sr" data-r="sr" aria-label="Paradas de hoy"></div>';
    const svg = el.querySelector("svg"), R_ = {};
    el.querySelectorAll("[data-r]").forEach((n) => { R_[n.getAttribute("data-r")] = n; });
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    let D = null, R = null, t = 10, target = 10, AHORA = null, frame = 0, last = 0, idle = 0, vivoT = 0, visible = true, mirando = false, lado = null, radio = false, ladoVa = null, ladoT = 0;
    /* girar la cabeza: la vista de frente se va hacia un lado y entra la del otro, como una cámara que gira */
    const pon = (g, x, sin) => { g.classList.toggle("sin", !!sin); g.style.transform = x ? "translateX(" + x + "px)" : ""; };
    function girar(nuevo) {
      const antes = lado; if (antes === nuevo) return;
      clearTimeout(ladoT); lado = nuevo; ladoVa = null;
      const dir = (q) => (q === "izq" ? 1 : -1);
      if (nuevo) {   /* entra la vista del lado nuevo desde ese lado; el frente (o el otro lado) se va al contrario */
        if (!antes) pon(R_.frenteg, 0, true);
        pon(R_.lado, -dir(nuevo) * 600, true); draw(0); void R_.lado.getBoundingClientRect();
        pon(R_.lado, 0); pon(R_.frenteg, dir(nuevo) * 600);
      } else {   /* vuelve el frente y el lado se va por donde vino */
        ladoVa = antes; draw(0); void R_.lado.getBoundingClientRect();
        pon(R_.lado, -dir(antes) * 600); pon(R_.frenteg, 0);
        ladoT = setTimeout(() => { ladoVa = null; pon(R_.lado, 0, true); draw(0); }, still.matches ? 0 : 600);
      }
    }

    /* ---------- lo que se dibuja por el parabrisas ---------- */
    /* el Lloretazo: el conductor se baja, va hasta el borde del acantilado y se fuma un cigarro mirando
       al mar; al acabar, vuelve. Se ve por el parabrisas desde el asiento vacío */
    function mirador(L, p) {
      const n = 1 - L.d, o = [], SOL = D.sol || [7, 18.6];
      R_.mar0.setAttribute("stop-color", mix(mix("#5a9fd2", "#f2a65a", clamp(1 - Math.abs(t - SOL[1]) / 0.9, 0, 1) * 0.5), "#0d1d38", n * 0.9));
      R_.mar1.setAttribute("stop-color", mix("#123a5e", "#050c18", n));
      o.push('<rect x="0" y="' + HY + '" width="600" height="400" fill="url(#cdmar' + ID + ')"/>');
      /* el cabo de enfrente con su faro, y otro más bajo a la izquierda */
      const roca = mix("#5b5148", "#151820", n * 0.85);
      o.push('<path d="M420 ' + HY + "L452 " + (HY - 16) + "L486 " + (HY - 27) + "L528 " + (HY - 31) + "L566 " + (HY - 24) + "L600 " + (HY - 20) + "V" + HY + 'Z" fill="' + roca + '"/>' +
        '<path d="M0 ' + HY + "L0 " + (HY - 9) + "L46 " + (HY - 12) + "L98 " + (HY - 6) + "L136 " + HY + 'Z" fill="' + mix(roca, "#7d8ea8", 0.25) + '"/>');
      o.push('<rect x="523" y="' + (HY - 52) + '" width="7" height="22" fill="' + mix("#e9eef5", "#8a93a6", n * 0.6) + '"/><rect x="523" y="' + (HY - 44) + '" width="7" height="4" fill="#c9302c"/><rect x="523" y="' + (HY - 36) + '" width="7" height="4" fill="#c9302c"/>' +
        '<rect x="521" y="' + (HY - 56) + '" width="11" height="4" fill="' + (n > 0.4 ? "#fff3c4" : "#5d6676") + '"/><path d="M520 ' + (HY - 56) + 'h13l-6.5-4z" fill="#3a4250"/>');
      if (n > 0.4) { const g = ((t * 1.6) % 2) - 1;
        o.push('<circle cx="526.5" cy="' + (HY - 54) + '" r="9" fill="#fff3c4" opacity="' + (0.35 * n).toFixed(2) + '"/><path d="M526.5 ' + (HY - 54) + "L" + (526.5 - 260 * Math.cos(g)).toFixed(1) + " " + (HY - 70 + g * 18).toFixed(1) + "L" + (526.5 - 260 * Math.cos(g)).toFixed(1) + " " + (HY - 40 + g * 18).toFixed(1) + 'Z" fill="#fff3c4" opacity="' + (0.12 * n).toFixed(2) + '"/>'); }
      /* el brillo del sol o de la luna en el agua, y las olas */
      const f = (t - SOL[0]) / (SOL[1] - SOL[0]), larga = 24 - (SOL[1] - SOL[0]), gl = ((((t - SOL[1]) % 24) + 24) % 24) / larga;
      const dia = f > 0 && f < 1, bx = dia ? 70 + f * 460 : gl > 0 && gl < 1 ? 70 + gl * 460 : null, bc = dia ? (Math.sin(Math.PI * f) < 0.45 ? "#ffb05a" : "#fff2c4") : "#dfe7ff";
      if (bx != null) for (let k = 1; k < 13; k++) { const y = HY + 2 + k * k * 0.85, w = 4 + k * 2.6;
        o.push('<rect x="' + (bx - w / 2 + Math.sin(k * 2.3 + t * 3) * k).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (0.8 + k * 0.12).toFixed(1) + '" rx=".6" fill="' + bc + '" opacity="' + (0.55 - k * 0.03).toFixed(2) + '"/>'); }
      for (let k = 0; k < 26; k++) { const y = HY + 4 + hash(k) * hash(k + 3) * 60, x = hash(k + 7) * 600, w = 6 + (y - HY) * 0.5;
        o.push('<path d="M' + x.toFixed(0) + " " + y.toFixed(1) + "h" + w.toFixed(1) + '" stroke="' + mix("#bcd6ee", "#41557a", n) + '" stroke-width="' + (0.6 + (y - HY) * 0.02).toFixed(2) + '" opacity=".5" stroke-linecap="round"/>'); }
      /* el apartadero de grava, el borde con hierba y las rocas a los lados */
      o.push(poly([[-9, 0, NEAR], [9, 0, NEAR], [9, 0, 14], [-9, 0, 14]], "", ' style="fill:' + mix("#7b7262", "#22242c", n * 0.85) + '"'));
      for (let k = 0; k < 40; k++) { const z = 1.4 + hash(k * 3) * 12, x = (hash(k * 5) - 0.5) * 16, q = pr(x, 0, z);
        o.push('<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + Math.max(0.5, (0.05 * F) / z).toFixed(1) + '" fill="' + mix("#958b78", "#2b2d35", n * 0.85) + '"/>'); }
      o.push(poly([[-9, 0, 13.2], [9, 0, 13.2], [9, 0.12, 14], [-9, 0.12, 14]], "", ' style="fill:' + mix("#4f7a45", "#14261a", n * 0.85) + '"'));
      for (const lado of [-1, 1]) o.push(poly([[lado * 9, 0, NEAR], [lado * 5.6, 0, 7], [lado * 6.4, 0, 14], [lado * 8, 1.6, 13], [lado * 9.6, 2.6, 5]], "", ' style="fill:' + mix(lado < 0 ? "#6a5e52" : "#5e544a", "#16181f", n * 0.85) + '"'));
      /* la barandilla de madera, abierta en el centro para asomarse */
      const post = mix("#8a6a48", "#2a2420", n * 0.8), palo = (a, b, w) => seg(a, b, "cd-palo", w).replace('class="cd-palo"', 'stroke="' + post + '" stroke-linecap="round"');
      for (const [x0, x1] of [[-6.4, -1.4], [1.4, 6.4]]) {
        for (let x = x0; x <= x1 + 0.01; x += 1.25) o.push(palo([x, 0, 12.8], [x, 1.0, 12.8], 0.08));
        o.push(palo([x0, 0.95, 12.8], [x1, 0.95, 12.8], 0.07), palo([x0, 0.55, 12.8], [x1, 0.55, 12.8], 0.06));
      }
      o.push(conductorFuera(p, n));
      return o.join("");
    }
    /* el conductor: camisa azul clara, chaleco con franja y gorra de la empresa. Va del autobús al borde,
       se queda fumando (la brasa y el humo) y al final vuelve, ya sin el cigarro */
    function conductorFuera(p, n) {
      const ida = p < 0.12, vuelta = p > 0.88, w = ida ? ease(p / 0.12) : vuelta ? ease((1 - p) / 0.12) : 1;
      const x = 1.4 + (0.2 - 1.4) * w, z = 2.6 + (12.2 - 2.6) * w, k = F / z, P0 = pr(x, 0, z), cx = P0[0], cy = P0[1];
      const anda = ida || vuelta, paso = anda ? Math.sin(p * 260) * 0.07 * k : 0;
      const c = (a, b) => mix(a, b, n * 0.65), Y = (m) => cy - m * k, X = (m) => cx + m * k, r1 = (v) => v.toFixed(1);
      const rect = (x0, y0, w0, h0, r0, col) => '<rect x="' + r1(x0) + '" y="' + r1(y0) + '" width="' + r1(w0) + '" height="' + r1(h0) + '" rx="' + r1(r0) + '" fill="' + col + '"/>';
      const piel = c("#e0b48f", "#3a2a22"), camisa = c("#9cc3ea", "#2a3a52"), chaleco = c("#1d2b4a", "#090d16"), pantalon = c("#2a3550", "#0c1018");
      const o = ['<ellipse cx="' + r1(cx) + '" cy="' + r1(cy) + '" rx="' + r1(0.32 * k) + '" ry="' + r1(0.06 * k) + '" fill="#000" opacity=".25"/>'];
      /* las piernas, que se alternan al andar */
      o.push(rect(X(-0.2), Y(0.86) + paso, 0.15 * k, 0.86 * k - paso, 0.05 * k, pantalon), rect(X(0.05), Y(0.86) - paso, 0.15 * k, 0.86 * k + paso, 0.05 * k, pantalon));
      /* el brazo izquierdo, colgando; el cuerpo, la franja del chaleco y la nuca */
      o.push(rect(X(-0.33), Y(1.42), 0.11 * k, 0.56 * k, 0.05 * k, camisa));
      o.push(rect(X(-0.24), Y(1.48), 0.48 * k, 0.66 * k, 0.1 * k, chaleco), rect(X(-0.24), Y(1.05), 0.48 * k, 0.05 * k, 0, c("#ffd66b", "#6b5a2a")));
      o.push(rect(X(-0.05), Y(1.56), 0.1 * k, 0.1 * k, 0, piel));
      /* la cabeza: de espaldas, pelo; al volver, la cara. Y la gorra con su visera al volver */
      o.push('<circle cx="' + r1(cx) + '" cy="' + r1(Y(1.66)) + '" r="' + r1(0.12 * k) + '" fill="' + (vuelta ? piel : c("#3a2a20", "#0e0a08")) + '"/>');
      o.push('<path d="M' + r1(X(-0.13)) + " " + r1(Y(1.72)) + "Q" + r1(cx) + " " + r1(Y(1.9)) + " " + r1(X(0.13)) + " " + r1(Y(1.72)) + 'Z" fill="' + chaleco + '"/>');
      if (vuelta) o.push('<path d="M' + r1(X(-0.16)) + " " + r1(Y(1.72)) + "H" + r1(X(0.16)) + '" stroke="' + chaleco + '" stroke-width="' + r1(Math.max(1, 0.04 * k)) + '" stroke-linecap="round"/>');
      if (!anda && !(D.esc && D.esc.fumar === false)) {
        /* fumando: el brazo derecho sube a la boca; el cigarro, la brasa con su halo y el humo que sube. Solo si fumar
           es cosa tuya (el hábito o el 4:20 de estas semanas): si lo dejas, el cigarro desaparece del dibujo */
        const sh = [X(0.22), Y(1.4)], el = [X(0.36), Y(1.12)], ha = [X(0.17), Y(1.58)], tip = [X(0.29), Y(1.6)];
        o.push('<path d="M' + r1(sh[0]) + " " + r1(sh[1]) + "L" + r1(el[0]) + " " + r1(el[1]) + "L" + r1(ha[0]) + " " + r1(ha[1]) + '" stroke="' + camisa + '" stroke-width="' + r1(0.11 * k) + '" stroke-linecap="round" stroke-linejoin="round" fill="none"/>');
        o.push('<path d="M' + r1(ha[0]) + " " + r1(ha[1]) + "L" + r1(tip[0]) + " " + r1(tip[1]) + '" stroke="#f3efe4" stroke-width="' + r1(Math.max(1, 0.025 * k)) + '" stroke-linecap="round"/>' +
          '<circle cx="' + r1(tip[0]) + '" cy="' + r1(tip[1]) + '" r="' + r1(Math.max(2, 0.06 * k)) + '" fill="#ff9a4a" opacity="' + (0.25 + 0.35 * n).toFixed(2) + '"/>' +
          '<circle class="cd-ascua" cx="' + r1(tip[0]) + '" cy="' + r1(tip[1]) + '" r="' + r1(Math.max(0.9, 0.018 * k)) + '"/>');
        for (let i = 0; i < 3; i++) {
          const a = tip[0], b = tip[1] - 2;
          o.push('<path class="cd-humo" style="--sube:' + (-0.55 * k).toFixed(0) + "px;animation-delay:" + (i * 1.2).toFixed(1) + "s;stroke-width:" + r1(Math.max(1, 0.03 * k)) + 'px" d="M' + r1(a) + " " + r1(b) +
            "c" + r1(-0.12 * k) + " " + r1(-0.12 * k) + " " + r1(0.14 * k) + " " + r1(-0.2 * k) + " " + r1(0.02 * k) + " " + r1(-0.32 * k) +
            "s" + r1(-0.1 * k) + " " + r1(-0.2 * k) + " " + r1(0.04 * k) + " " + r1(-0.3 * k) + '"/>');
        }
      } else o.push(rect(X(0.22), Y(1.42), 0.11 * k, 0.56 * k, 0.05 * k, camisa));
      return o.join("");
    }

    function escena(cam, L, st) {
      const ll = !st.noche && st.enCurso.find(esLL);
      if (ll) return mirador(L, clamp((t - ll.a) / Math.max(0.1, ll.b - ll.a), 0, 1));
      const out = [], noche = 1 - L.d;
      out.push('<rect class="cd-ground" x="0" y="' + HY + '" width="600" height="400"/>');
      out.push(poly([[-5.2, 0, NEAR], [3.0, 0, NEAR], [3.0, 0, FAR], [-5.2, 0, FAR]], "cd-road"));
      out.push(poly([[3.0, 0.15, NEAR], [8, 0.15, NEAR], [8, 0.15, FAR], [3.0, 0.15, FAR]], "cd-walk"));
      out.push(poly([[-11, 0.15, NEAR], [-5.2, 0.15, NEAR], [-5.2, 0.15, FAR], [-11, 0.15, FAR]], "cd-walk"));
      const tira = (x0, x1, y, cls) => poly([[x0, y, NEAR], [x1, y, NEAR], [x1, y, FAR], [x0, y, FAR]], cls);
      out.push(tira(2.96, 3.1, 0.16, "cd-kerb"), tira(-5.3, -5.16, 0.16, "cd-kerb"), tira(2.72, 2.8, 0.011, "cd-edge"), tira(-4.98, -4.9, 0.011, "cd-edge"));
      for (let w = Math.floor(cam / 3) * 3; w < cam + 120; w += 3) { const z = w - cam + 3; if (z >= NEAR) out.push(seg([3.2, 0.16, z], [8, 0.16, z], "cd-walkl", 0.03)); }
      for (let w = Math.floor(cam / 6) * 6; w < cam + FAR; w += 6) { const z0 = w - cam + 2; if (z0 + 3 >= NEAR) out.push(poly([[-1.15, 0.01, z0], [-1.0, 0.01, z0], [-1.0, 0.01, z0 + 3], [-1.15, 0.01, z0 + 3]], "cd-dash")); }
      if (noche > 0.05) out.push(poly([[-1.6, 0.01, 1.2], [1.6, 0.01, 1.2], [4, 0.01, 30], [-4, 0.01, 30]], "", ' fill="url(#cdbeam' + ID + ')" style="opacity:' + (noche * 0.55).toFixed(2) + '"'));
      /* el paisaje, por manzanas de 13 m a cada lado: ciudad, hospital, polideportivo o bosque */
      const blq = [], cosas = [];
      for (let j = Math.floor((cam - 20) / 13); j * 13 < cam + FAR; j++) for (const lado of [1, -1]) {
        const z0 = j * 13 - cam + 2, z1 = z0 + 10.5; if (z1 < NEAR) continue;
        blq.push({ z0, z1, h: 5 + Math.floor(hash(j * 7 + (lado > 0 ? 1 : 5)) * 11), x0: lado > 0 ? 8.4 : -11.4, x1: lado > 0 ? 15 : -18, j, lado, amb: ambEn(R, j * 13 + 7, j * 3.7 + (lado > 0 ? 0.3 : 0.8)) });
      }
      const verde = (a, b) => mix(a, b, noche * 0.75);
      const G = { hierba: verde("#3d6b45", "#0f2218"), hierba2: verde("#46784d", "#122a1d"), pino: verde("#1f5a3e", "#0b2116"), pino2: verde("#2f7a52", "#11301f"),
        hoja: verde("#3f8a4f", "#123020"), hoja2: verde("#5aa865", "#1a4229"), campo: verde("#2e7d4a", "#123a22"), campo2: verde("#348a52", "#154226") };
      /* el suelo primero: hierba en el bosque, el campo en el polideportivo */
      for (const b of blq) {
        if (b.amb !== "bosque" && b.amb !== "deporte") continue;
        const xa = b.lado > 0 ? 8.05 : -11.05, xb = b.lado > 0 ? 60 : -60, za = Math.max(NEAR, b.z0 - 2), zb = b.z0 + 11;
        out.push(poly([[xa, 0.02, za], [xb, 0.02, za], [xb, 0.02, zb], [xa, 0.02, zb]], "", ' style="fill:' + (b.j % 2 ? G.hierba : G.hierba2) + '"'));
        if (b.amb === "deporte" && b.lado > 0) {
          out.push(poly([[9.6, 0.04, b.z0], [24, 0.04, b.z0], [24, 0.04, b.z0 + 9.6], [9.6, 0.04, b.z0 + 9.6]], "", ' style="fill:' + (b.j % 2 ? G.campo : G.campo2) + '"'));
          const ln = (a, c) => out.push(seg(a, c, "cd-line", 0.05));
          ln([10.2, 0.05, b.z0 + 0.4], [10.2, 0.05, b.z0 + 9.2]); ln([23.4, 0.05, b.z0 + 0.4], [23.4, 0.05, b.z0 + 9.2]);
          ln([10.2, 0.05, b.z0 + 4.8], [23.4, 0.05, b.z0 + 4.8]);
          if (b.z0 + 0.4 > NEAR) ln([10.2, 0.05, b.z0 + 0.4], [23.4, 0.05, b.z0 + 0.4]);
        }
      }
      const cls = ["cd-ba", "cd-bb", "cd-bc", "cd-bd"];
      for (const b of blq) {
        const key = b.z0;
        if (b.amb === "ciudad" || b.amb === "hospital") {
          const hosp = b.amb === "hospital" && b.j % 2 === 0, h = hosp ? 9 : b.h, o = [];
          o.push(poly([[b.x0, 0, b.z0], [b.x0, 0, b.z1], [b.x0, h, b.z1], [b.x0, h, b.z0]], hosp ? "cd-hosp" : cls[Math.floor(hash(b.j * 3 + b.lado) * 4)]));
          if (b.z0 > NEAR) o.push(poly([[b.x0, 0, b.z0], [b.x1, 0, b.z0], [b.x1, h, b.z0], [b.x0, h, b.z0]], hosp ? "cd-hospe" : "cd-bend"));
          if (b.z0 < 70) for (let y = 1.6; y < h - 1.2; y += 2.8) for (let z = b.z0 + 1; z < b.z1 - 1.4; z += 2.4) {
            /* de noche, ventanas encendidas; de guardia, el hospital entero */
            const on = noche > 0.3 && (hosp ? hash(b.j * 31 + y * 7 + z) > 0.2 : hash(b.j * 31 + y * 7 + z) > 0.55), x = b.x0 - 0.01 * b.lado;
            o.push(poly([[x, y, z], [x, y, z + 1.3], [x, y + 1.4, z + 1.3], [x, y + 1.4, z]], on ? "cd-wino" : "cd-win"));
          }
          /* la cruz roja en la fachada de cara a la calle */
          if (hosp && b.z0 > NEAR) { const xm = (b.x0 + b.x1) / 2, ym = h - 1.8, zz = b.z0 - 0.02;
            o.push(poly([[xm - 1.1, ym - 0.35, zz], [xm + 1.1, ym - 0.35, zz], [xm + 1.1, ym + 0.35, zz], [xm - 1.1, ym + 0.35, zz]], "cd-cross"),
              poly([[xm - 0.35, ym - 1.1, zz], [xm + 0.35, ym - 1.1, zz], [xm + 0.35, ym + 1.1, zz], [xm - 0.35, ym + 1.1, zz]], "cd-cross")); }
          cosas.push({ key, svg: o.join("") });
        } else if (b.amb === "mar") {
          /* la carretera de la costa: el mar a la izquierda tras un murete; a la derecha, roca */
          const o = [];
          if (b.lado < 0) {
            o.push(poly([[-11.2, -0.4, Math.max(NEAR, b.z0 - 2)], [-200, -0.4, Math.max(NEAR, b.z0 - 2)], [-200, -0.4, b.z0 + 11], [-11.2, -0.4, b.z0 + 11]], "", ' style="fill:' + mix("#2f6fa3", "#0b1a33", noche) + '"'));
            o.push(poly([[-11.2, 0, Math.max(NEAR, b.z0 - 2)], [-11.2, 0, b.z0 + 11], [-11.2, 0.7, b.z0 + 11], [-11.2, 0.7, Math.max(NEAR, b.z0 - 2)]], "", ' style="fill:' + mix("#8f8676", "#2a2a30", noche * 0.8) + '"'));
          } else {
            const h = 1.2 + hash(b.j * 5) * 2.2;
            o.push(poly([[9.4, 0, b.z0 + 1], [9.4, 0, b.z1 - 1], [12, h, b.z1 - 3], [13.5, h * 0.8, b.z0 + 3]], "", ' style="fill:' + mix("#7a6e60", "#1d1f27", noche * 0.85) + '"'));
          }
          cosas.push({ key: b.z0, svg: o.join("") });
        } else if (b.amb === "bosque") {
          /* tres árboles por manzana: pinos y frondosos, cada uno con su tronco */
          for (let q = 0; q < 3; q++) {
            const sd = b.j * 11 + q * 3 + (b.lado > 0 ? 0 : 50), z = b.z0 + 1.2 + q * 4.1 + hash(sd) * 1.6; if (z < NEAR + 0.3) continue;
            const x = b.lado > 0 ? 9.6 + hash(sd + 1) * 7 : -12.6 - hash(sd + 1) * 7, sc = 0.8 + hash(sd + 2) * 0.5, o = [];
            o.push(seg([x, 0, z], [x, 1.6 * sc, z], "cd-trunk", 0.22 * sc));
            if (hash(sd + 3) > 0.45) {
              for (let k = 0; k < 3; k++) { const yb = (1.0 + k * 1.45) * sc, r = (1.9 - k * 0.5) * sc, hh = 2.5 * sc;
                o.push(poly([[x - r, yb, z], [x, yb, z], [x, yb + hh, z]], "", ' style="fill:' + G.pino + '"'), poly([[x, yb, z], [x + r, yb, z], [x, yb + hh, z]], "", ' style="fill:' + G.pino2 + '"')); }
            } else {
              const c = pr(x, 3.6 * sc, z), r = 1.9 * sc * F / z, c2 = pr(x - 0.5 * sc, 4.1 * sc, z);
              o.push('<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="' + r.toFixed(1) + '" style="fill:' + G.hoja + '"/>' +
                '<circle cx="' + c2[0].toFixed(1) + '" cy="' + c2[1].toFixed(1) + '" r="' + (r * 0.55).toFixed(1) + '" style="fill:' + G.hoja2 + '"/>');
            }
            /* de noche, luciérnagas */
            if (noche > 0.55 && z < 45) for (let f = 0; f < 2; f++) { const p = pr(x + (hash(sd + f + 7) - 0.5) * 3, 0.6 + hash(sd + f + 9) * 1.6, z), al = 0.35 + 0.65 * Math.abs(Math.sin(t * 9 + sd + f));
              o.push('<circle class="cd-fly" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + Math.max(0.6, 0.07 * F / z).toFixed(1) + '" opacity="' + (al * (noche - 0.5) * 2).toFixed(2) + '"/>'); }
            cosas.push({ key: z, svg: o.join("") });
          }
        } else if (b.lado > 0) {
          /* el polideportivo: la valla del campo y una torre de focos que se enciende al caer la tarde */
          const o = [];
          for (let z = b.z0; z < b.z1 + 2; z += 1.6) if (z > NEAR + 0.2) o.push(seg([8.9, 0, z], [8.9, 1.9, z], "cd-fence", 0.05));
          o.push(seg([8.9, 1.9, Math.max(NEAR + 0.2, b.z0)], [8.9, 1.9, b.z1 + 2], "cd-fence", 0.06));
          const zt = b.z0 + 5;
          if (zt > NEAR + 0.3 && b.j % 2 === 0) {
            const enc = L.d < 0.75;
            o.push(seg([25, 0, zt], [25, 11, zt], "cd-fence", 0.16));
            o.push(poly([[23.6, 11, zt], [26.4, 11, zt], [26.4, 12.3, zt], [23.6, 12.3, zt]], enc ? "cd-floodo" : "cd-flood"));
            if (enc) { const c = pr(25, 11.6, zt);
              o.push('<circle class="cd-glow" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="' + (2.6 * F / zt).toFixed(1) + '" style="opacity:' + (0.3 * (1 - L.d)).toFixed(2) + '"/>',
                poly([[23.8, 11, zt], [26.2, 11, zt], [24, 0.05, zt + 6], [12, 0.05, zt + 6]], "cd-floodo", ' style="opacity:' + (0.1 * (1 - L.d)).toFixed(2) + '"')); }
          }
          cosas.push({ key: b.z0, svg: o.join("") });
        } else {
          /* el gimnasio: nave baja violeta con ventanales y su letrero de cara a la calle */
          const o = [], h = 6;
          o.push(poly([[b.x0, 0, b.z0], [b.x0, 0, b.z1], [b.x0, h, b.z1], [b.x0, h, b.z0]], "cd-gyma"));
          if (b.z0 > NEAR) o.push(poly([[b.x0, 0, b.z0], [b.x1, 0, b.z0], [b.x1, h, b.z0], [b.x0, h, b.z0]], "cd-gymb"));
          if (b.z0 < 90) for (let z = b.z0 + 0.8; z < b.z1 - 1; z += 3.1) { const x = b.x0 + 0.01;
            o.push(poly([[x, 1, z], [x, 1, z + 2.5], [x, 4.4, z + 2.5], [x, 4.4, z]], noche > 0.25 ? "cd-gymgo" : "cd-gymg")); }
          if (b.z0 > NEAR + 0.3) { const a = pr(b.x1 + 0.6, h + 1.9, b.z0), c = pr(b.x0 - 0.6, h + 0.2, b.z0), w = c[0] - a[0], hh = c[1] - a[1];
            if (w > 6) o.push('<rect class="cd-gyms" x="' + a[0].toFixed(1) + '" y="' + a[1].toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="' + (hh * 0.2).toFixed(1) + '"/>' +
              '<text class="cd-gymt" x="' + (a[0] + w / 2).toFixed(1) + '" y="' + (a[1] + hh * 0.74).toFixed(1) + '" font-size="' + (hh * 0.7).toFixed(1) + '">▬●▬ GYM</text>'); }
          cosas.push({ key: b.z0, svg: o.join("") });
        }
      }
      cosas.sort((a, b) => b.key - a.key).forEach((c) => out.push(c.svg));
      for (let w = Math.floor(cam / 25) * 25; w < cam + 160; w += 25) {
        const z = w - cam + 12; if (z < NEAR + 0.5) continue;
        out.push(seg([3.5, 0.15, z], [3.5, 5.2, z], "cd-post", 0.09), seg([3.5, 5.2, z], [2.6, 5.4, z], "cd-post", 0.07));
        const p = pr(2.6, 5.3, z), r = Math.max(0.8, 0.16 * F / z);
        out.push('<circle class="cd-lamp" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r.toFixed(1) + '"/>');
        if (noche > 0.3) out.push('<circle class="cd-glow" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (r * 3).toFixed(1) + '" style="opacity:' + (0.25 * noche).toFixed(2) + '"/>');
      }
      /* señales a la izquierda: el último café, las órdenes de la guardia; están donde irá el autobús a esa hora */
      (D.senales || []).forEach((sg, j) => {
        const z = camDe(R, sg.t).s - cam + 6; if (z < NEAR + 0.4 || z > 120) return;
        out.push(seg([-5.6, 0.15, z], [-5.6, 2.3, z], "cd-post", 0.06));
        const c = pr(-5.6, 2.75, z), r = 0.55 * F / z;
        out.push('<g><circle class="cd-sig" cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="' + r.toFixed(1) + '" style="stroke-width:' + Math.max(0.6, r * 0.16).toFixed(2) + 'px"/>' +
          (r > 5 ? '<text class="cd-sigt" x="' + c[0].toFixed(1) + '" y="' + (c[1] + r * 0.12).toFixed(1) + '" font-size="' + (r * 0.62).toFixed(1) + '">' + esc(sg.ico || "!") + "</text>" : "") +
          (r > 9 ? '<text class="cd-sigt" x="' + c[0].toFixed(1) + '" y="' + (c[1] + r * 0.62).toFixed(1) + '" font-size="' + (r * 0.3).toFixed(1) + '">' + hhmm(sg.t) + "</text>" : "") + "</g>");
      });
      /* el taxi, parado junto a la primera parada del día cuando hoy saliste tarde (o lo marcaste): amarillo, con
         la luz en el techo; y en el polideportivo, la barra con el conductor colgado mientras entrena */
      const primera = R.est.filter((e) => !e.dep && TURNO(e.k) && !e.cont)[0];   /* el taxi va al hospital: antes del primer turno, no del desayuno */
      if (D.esc && D.esc.taxi && primera && t < primera.a) { const z0 = Math.max(4.2, primera.s - cam + ZSTOP - 7.5); if (z0 < 120) out.push(taxi(z0)); }
      const cc = camDe(R, t), enGym = cc.k >= 0 && R.est[cc.k] && R.est[cc.k].k === "gym" && cc.parado && t < R.est[cc.k].b;
      if (enGym) out.push(barra(ZSTOP + 2.2, t));
      /* las paradas: marquesina y letrero, de lejos a cerca */
      const ps = R.est.filter((e) => !e.dep).map((e) => ({ e, zc: e.s - cam + ZSTOP })).filter((o) => o.zc > -3 && o.zc < 170).sort((a, b) => b.zc - a.zc);
      for (const { e, zc } of ps) {
        const z0 = zc - 2.1, z1 = zc + 2.1;
        out.push(poly([[6.3, 0.2, z0], [6.3, 0.2, z1], [6.3, 2.45, z1], [6.3, 2.45, z0]], "cd-shglass"));
        out.push(poly([[5.4, 0.45, z0 + 0.6], [6.2, 0.45, z0 + 0.6], [6.2, 0.45, z1 - 0.6], [5.4, 0.45, z1 - 0.6]], "cd-shbench"));
        out.push(seg([3.7, 0.15, z0 + 0.1], [3.7, 2.5, z0 + 0.1], "cd-post", 0.06), seg([3.7, 0.15, z1 - 0.1], [3.7, 2.5, z1 - 0.1], "cd-post", 0.06));
        out.push(poly([[3.5, 2.5, z0], [6.5, 2.5, z0], [6.5, 2.5, z1], [3.5, 2.5, z1]], "cd-shroof"));
        out.push(poly([[3.5, 2.5, z0], [6.5, 2.5, z0], [6.5, 2.72, z0], [3.5, 2.72, z0]], "cd-shedge"), poly([[3.5, 2.5, z0], [3.5, 2.5, z1], [3.5, 2.72, z1], [3.5, 2.72, z0]], "cd-shedge"));
        const zb = z0 - 0.5;
        out.push(seg([3.3, 0.15, zb], [3.3, 2.6, zb], "cd-post", 0.07));
        if (zb > NEAR + 0.2) {
          const a = pr(2.0, 3.55, zb), b = pr(4.6, 2.6, zb), w = b[0] - a[0], h = b[1] - a[1], fs = h * 0.42;
          const on = esta(st.enCurso, e), pend = e.m && !e.h && e.b <= (AHORA != null ? AHORA : t) && D.modo !== "futuro";
          const k = e.k === "guard" ? "guard" : e.k;
          out.push('<g data-o="ev" data-i="' + e.i + '" class="' + (on ? "cd-on " : "") + (e.h ? "cd-hecho " : "") + (pend ? "cd-pend" : "") + '">' +
            '<rect class="cd-board" x="' + a[0].toFixed(1) + '" y="' + a[1].toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + (h * 0.12).toFixed(1) + '"/>' +
            '<rect class="cd-lv-' + k + '" x="' + a[0].toFixed(1) + '" y="' + a[1].toFixed(1) + '" width="' + (w * 0.05).toFixed(1) + '" height="' + h.toFixed(1) + '"/>' +
            (fs > 2.2 ? '<text class="cd-bh" x="' + (a[0] + w * 0.09).toFixed(1) + '" y="' + (a[1] + h * 0.42).toFixed(1) + '" font-size="' + (fs * 0.72).toFixed(1) + '">' + hhmm(e.a) + (e.k === "guard" ? " ☾" : "") + (pend ? "  ¿la apuntas?" : "") + "</text>" +
              '<text class="cd-bt" x="' + (a[0] + w * 0.09).toFixed(1) + '" y="' + (a[1] + h * 0.84).toFixed(1) + '" font-size="' + fs.toFixed(1) + '" textLength="' + Math.min(w * (e.h ? 0.7 : 0.86), fs * 0.62 * String(e.t).length).toFixed(1) + '" lengthAdjust="spacingAndGlyphs">' + esc(String(e.t).toUpperCase()) + "</text>" : "") +
            (e.h ? '<circle class="cd-tick" cx="' + (b[0] - h * 0.32).toFixed(1) + '" cy="' + (a[1] + h * 0.5).toFixed(1) + '" r="' + (h * 0.24).toFixed(1) + '"/><path class="cd-tickm" style="stroke-width:' + (h * 0.07).toFixed(2) + 'px" d="M' + (b[0] - h * 0.43).toFixed(1) + " " + (a[1] + h * 0.5).toFixed(1) + "l" + (h * 0.08).toFixed(1) + " " + (h * 0.09).toFixed(1) + "l" + (h * 0.16).toFixed(1) + " " + (-h * 0.18).toFixed(1) + '"/>' : "") + "</g>");
        }
      }
      return out.join("");
    }

    /* el taxi: carrocería, cabina con las lunas, ruedas, la luz del techo y el cartel */
    function taxi(z0) {
      const o = [], x0 = 0.9, x1 = 2.8, z1 = z0 + 3.4;
      o.push(poly([[x0, 0.25, z0], [x1, 0.25, z0], [x1, 0.25, z1], [x0, 0.25, z1]], "cd-taxid"));
      o.push(poly([[x0, 0.25, z0], [x0, 1.05, z0], [x0, 1.05, z1], [x0, 0.25, z1]], "cd-taxi"), poly([[x0, 0.25, z0], [x1, 0.25, z0], [x1, 1.05, z0], [x0, 1.05, z0]], "cd-taxid"));
      o.push(poly([[x0, 1.05, z0], [x1, 1.05, z0], [x1, 1.05, z1], [x0, 1.05, z1]], "cd-taxi"));
      o.push(poly([[x0 + 0.15, 1.05, z0 + 0.5], [x0 + 0.15, 1.65, z0 + 0.7], [x0 + 0.15, 1.65, z1 - 0.9], [x0 + 0.15, 1.05, z1 - 0.7]], "cd-taxiv"), poly([[x0 + 0.1, 1.05, z0 + 0.4], [x1 - 0.1, 1.05, z0 + 0.4], [x1 - 0.1, 1.65, z0 + 0.65], [x0 + 0.1, 1.65, z0 + 0.65]], "cd-taxiv"));
      o.push(poly([[x0 + 0.1, 1.65, z0 + 0.65], [x1 - 0.1, 1.65, z0 + 0.65], [x1 - 0.1, 1.65, z1 - 0.85], [x0 + 0.1, 1.65, z1 - 0.85]], "cd-taxi"));
      for (const zz of [z0 + 0.6, z1 - 0.6]) { const p = pr(x0 - 0.02, 0.3, zz), r = Math.max(0.6, 0.3 * F / zz); o.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + r.toFixed(1) + '" fill="#111"/>'); }
      o.push(poly([[x0 + 0.6, 1.66, z0 + 1.3], [x1 - 0.6, 1.66, z0 + 1.3], [x1 - 0.6, 1.9, z0 + 1.3], [x0 + 0.6, 1.9, z0 + 1.3]], "cd-taxil"));
      const c = pr((x0 + x1) / 2, 0.68, z0), fs = 0.42 * F / z0; if (fs > 3.5) o.push('<text class="cd-taxit" x="' + c[0].toFixed(1) + '" y="' + (c[1] + fs * 0.35).toFixed(1) + '" font-size="' + fs.toFixed(1) + '">TAXI</text>');
      return o.join("");
    }
    /* la barra de dominadas junto a la parada: dos postes, la barra y el conductor colgado, subiendo y bajando */
    function barra(z, hora) {
      const o = [], x0 = -7.6, x1 = -6.0, h = 2.6, sube = 0.5 + 0.5 * Math.sin(hora * 40);   /* a la izquierda, delante del polideportivo: a la derecha lo tapaba la marquesina */
      o.push(seg([x0, 0.15, z], [x0, h, z], "cd-post", 0.08), seg([x1, 0.15, z], [x1, h, z], "cd-post", 0.08), seg([x0, h, z], [x1, h, z], "cd-barra", 0.06));
      const xm = (x0 + x1) / 2, top = h - 0.3 - 0.35 * sube, k = F / z, P0 = pr(xm, top, z - 0.05), X = (m) => (P0[0] + m * k).toFixed(1), Y = (m) => (P0[1] - m * k).toFixed(1);
      const rect = (x, y, w, hh, cls) => '<rect class="' + cls + '" x="' + X(x) + '" y="' + Y(y + hh) + '" width="' + (w * k).toFixed(1) + '" height="' + (hh * k).toFixed(1) + '" rx="' + (0.05 * k).toFixed(1) + '"/>';
      o.push(rect(-0.3, -0.75, 0.6, 0.75, "cd-cuerpo"), rect(-0.42, 0.55 * sube - 0.1, 0.12, 0.9, "cd-piel"), rect(0.3, 0.55 * sube - 0.1, 0.12, 0.9, "cd-piel"));
      o.push('<circle class="cd-piel" cx="' + X(0) + '" cy="' + Y(0.26) + '" r="' + (0.2 * k).toFixed(1) + '"/>' + rect(-0.22, 0.38, 0.44, 0.1, "cd-gorra"));
      o.push(rect(-0.22, -1.35, 0.16, 0.6, "cd-gorra"), rect(0.06, -1.35, 0.16, 0.6, "cd-gorra"));
      return o.join("");
    }
    /* la cochera por dentro, de cara a la persiana */
    function cochera(desplaza, abierta, luzCalle) {
      const zd = 12 - desplaza; if (zd < NEAR + 0.05) return "";
      const X = 4.6, Y = 4.8, o = [];
      o.push(poly([[-X, 0, NEAR], [X, 0, NEAR], [X, 0, zd], [-X, 0, zd]], "cd-gfloor"), poly([[-X, Y, NEAR], [X, Y, NEAR], [X, Y, zd], [-X, Y, zd]], "cd-gceil"));
      o.push(poly([[-X, 0, NEAR], [-X, 0, zd], [-X, Y, zd], [-X, Y, NEAR]], "cd-gwl"), poly([[X, 0, NEAR], [X, 0, zd], [X, Y, zd], [X, Y, NEAR]], "cd-gwr"));
      const P = (x, y) => pr(x, y, zd).map((v) => v.toFixed(1)).join(" ");
      o.push('<path class="cd-gback" fill-rule="evenodd" d="M' + P(-X, 0) + "L" + P(X, 0) + "L" + P(X, Y) + "L" + P(-X, Y) + "Z M" + P(-3.4, 0) + "L" + P(-3.4, 4.1) + "L" + P(3.4, 4.1) + "L" + P(3.4, 0) + 'Z"/>');
      const yb = 4.1 * abierta;
      if (abierta < 0.995) {
        o.push(poly([[-3.4, yb, zd], [3.4, yb, zd], [3.4, 4.1, zd], [-3.4, 4.1, zd]], "cd-gdoor"));
        let s = ""; for (let y = yb + 0.35; y < 4.05; y += 0.35) { const a = pr(-3.4, y, zd), b = pr(3.4, y, zd); s += "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + "L" + b[0].toFixed(1) + " " + b[1].toFixed(1); }
        o.push('<path class="cd-gslat" d="' + s + '"/>');
        if (abierta < 0.02) o.push(poly([[-3.4, 0, zd], [3.4, 0, zd], [3.4, 0.05, zd], [-3.4, 0.05, zd]], "cd-gslit", ' style="opacity:' + (0.4 + 0.5 * luzCalle).toFixed(2) + '"'));
      }
      o.push(poly([[-0.6, Y - 0.01, 6], [0.6, Y - 0.01, 6], [0.6, Y - 0.01, 7], [-0.6, Y - 0.01, 7]], abierta > 0.02 ? "cd-glampo" : "cd-glamp"));
      return o.join("");
    }

    /* ---------- lo que pasa a una hora ---------- */
    function estado(t) {
      const dia = (D.dia || []).filter((e) => e.b > e.a);
      const enCurso = dia.filter((e) => t >= e.a && t < e.b);
      const turno = enCurso.filter((e) => TURNO(e.k)).pop() || null, corto = enCurso.filter((e) => !TURNO(e.k)).pop() || null;
      const noche = (D.noches || []).find((n) => t >= n.a && t < n.b) || null;
      const sig = dia.filter((e) => e.a > t).sort((a, b) => a.a - b.a);
      const hechos = dia.filter((e) => e.b <= t).sort((a, b) => a.b - b.b);
      return { dia, enCurso, turno, corto, noche, sig, previo: hechos[hechos.length - 1] || null, guardia: turno && turno.k === "guard" ? turno : null };
    }

    function salpicadero(st, c) {
      const ahora = AHORA != null ? AHORA : t;
      R_.clk.textContent = hhmm(t);
      const nx = st.sig[0], a = st.corto || st.turno;
      R_.q.textContent = st.noche ? (st.noche.t === "siesta" ? "siesta" : "durmiendo") : a ? "queda" + (a.b - t >= 1 ? "n " : " ") + dura(a.b - t) : (nx ? "libre" : "");
      if (D.modo === "pasado") {
        const m = st.dia.filter((e) => e.m), h = m.filter((e) => e.h);
        R_.nxl.textContent = "DÍA TERMINADO";
        R_.nxb.textContent = m.length ? h.length + " de " + m.length + " hechas" : "Todo hecho";
        R_.nxa.textContent = st.dia.length + " paradas · toca una para ver qué fue";
      } else if (st.noche) {
        const sale = st.noche.b >= 24 && D.manana != null ? D.manana : st.noche.b;
        R_.nxl.textContent = st.noche.t === "siesta" ? "SIESTA EN LA COCHERA" : "EN COCHERA";
        R_.nxb.textContent = st.noche.t === "siesta" ? "Siesta" : (t >= 12 ? "A dormir" : "Durmiendo");
        R_.nxa.innerHTML = "Sales a las <tspan font-weight=\"800\">" + hhmm(sale) + "</tspan>" + (st.noche.b < 24 && nx ? " · luego " + esc(cap(nx.t)) : "");
      } else if (!st.dia.length) {
        R_.nxl.textContent = "DÍA LIBRE"; R_.nxb.textContent = "Sin paradas hoy"; R_.nxa.textContent = (D.pendiente || []).length ? "Sin hora: " + D.pendiente[0].txt : "Toca «＋ Añadir» para poner algo";
      } else {
        R_.nxl.textContent = st.guardia ? "SERVICIO NOCTURNO ☾" : (nx ? "PRÓXIMA PARADA" : "FIN DE LÍNEA");
        R_.nxb.textContent = nx ? hhmm(nx.a) + "  " + cap(nx.t) : (st.guardia ? "Sales a las " + hhmm(st.guardia.b) : "Cochera" + ((D.noches || []).some((n) => n.a > t) ? " · " + hhmm((D.noches || []).find((n) => n.a > t).a) : ""));
        /* lo de ahora, y si hay dos cosas a la vez (una comida dentro del turno), las dos */
        R_.nxa.innerHTML = st.corto && st.turno ? '<tspan font-weight="800">' + esc(cap(st.corto.t)) + "</tspan> · en " + esc(cap(st.turno.t).toLowerCase()) + " hasta " + hhmm(st.turno.b)
          : a ? 'Ahora: <tspan font-weight="800">' + esc(cap(a.t)) + "</tspan> · hasta " + hhmm(a.b)
          : 'Ahora: <tspan font-weight="800">libre</tspan>' + (nx ? " · llegas en " + dura(nx.a - t) : "");
      }
      /* el retrovisor: la última parada; si era para apuntar y no está, lo pregunta */
      const pv = st.previo, pend = pv && pv.m && !pv.h && D.modo !== "futuro";
      const n0 = (D.noches || []).find((x) => x.a <= 0.5 && x.t === "noche");
      const mt = pv ? (pend ? "¿Apuntas " + cap(pv.t).toLowerCase() + "?" : (pv.m && pv.h ? "✓ " : "") + hhmm(pv.a) + " " + cap(pv.t)) : (st.noche || !n0 ? "" : "salida " + hhmm(n0.b));
      R_.mir.textContent = mt;
      /* el retrovisor es estrecho: lo largo se encoge para caber entero, sin cortarlo */
      if (mt.length > 16) { R_.mir.setAttribute("textLength", "98"); R_.mir.setAttribute("lengthAdjust", "spacingAndGlyphs"); } else R_.mir.removeAttribute("textLength");
      R_.mir.setAttribute("class", "cd-mirt" + (pend ? " cd-pend" : ""));
      R_.mir.parentNode.setAttribute("data-i", pv ? pv.i : "");
      /* la línea de hoy: una bolita por parada (verde hecha, ámbar sin apuntar, amarilla la próxima) */
      const E = R.est.filter((e) => !e.dep && !e.cont), n = E.length, x = (i) => 150 + (400 * (i + 0.5)) / Math.max(1, n);   /* la vuelta al turno no es otra bolita */
      let r = n ? '<path class="cd-stripl" d="M' + x(0).toFixed(1) + " 22H" + x(n - 1).toFixed(1) + '"/>' : "";
      E.forEach((e, i) => {
        const cls = e.h ? "cd-sdone" : (e.m && e.b <= ahora && D.modo !== "futuro") ? "cd-spend" : (igual(e, nx) || esta(st.enCurso, e)) ? "cd-snext" : e.b <= t ? "cd-spast" : "cd-sdot";
        r += '<circle class="' + cls + '" cx="' + x(i).toFixed(1) + '" cy="22" r="' + (esta(st.enCurso, e) ? 5 : 3.6) + '"/>';
      });
      /* parado en la vuelta a un turno, el autobús de la línea va en la bolita de ese turno */
      const cur = c.k >= 0 ? R.est[c.k] : null, cs = cur && cur.cont && c.parado ? ((E.find((e) => e.k === cur.k && e.a === cur.padre) || cur).s) : c.s;
      if (n) { const pos = E.findIndex((e) => e.s >= cs - 1e-6), bi = pos < 0 ? n - 0.5 : clamp(pos - (E[pos].s - cs) / GAP, -0.5, n - 0.5); r += '<path class="cd-sbus" d="M' + (x(bi) - 6).toFixed(1) + ' 15h12v7h-12z"/>'; }
      R_.route.innerHTML = r;
    }

    const coma = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
    /* que un texto quepa en su sitio: si es largo se encoge, sin cortarlo */
    const cabe = (n, max) => { if (n.textContent.length * parseFloat(getComputedStyle(n).fontSize || 12) * 0.56 > max) { n.setAttribute("textLength", max); n.setAttribute("lengthAdjust", "spacingAndGlyphs"); } else n.removeAttribute("textLength"); };
    function indicadores() {
      const s = D.sueno, cab = D.cab || {}, rd = cab.radio || {}, ph = (cab.izq && cab.izq.ph) || [];
      R_.rdl.textContent = s ? "anoche " + coma(s.h) + " h" : "anoche: sin apuntar";
      const pend = ph.filter((x) => !x.hecho).length;
      R_.tk.textContent = pend ? "PARA HOY · " + pend : "PARA HOY ✓";
      R_.tkv.textContent = ph.length ? ph.filter((x) => x.hecho).length + " de " + ph.length + " hechas" : "nada pendiente";
      /* la radio: lo dormido, la cama y el café; los botones de emisora son el «¿cómo amaneces?» */
      R_.rs1.textContent = s ? "Anoche dormiste " + coma(s.h) + " h de " + s.obj : "Anoche: sin apuntar · toca «abrir Sueño»";
      R_.rs2.textContent = [rd.ayer != null ? "ayer " + coma(rd.ayer) + " h" : "", rd.cama ? "a la cama " + rd.cama : "", rd.cafe ? "último café " + rd.cafe : ""].filter(Boolean).join(" · ");
      svg.querySelectorAll('[data-o="kss"]').forEach((g) => g.classList.toggle("on", +g.getAttribute("data-v") === rd.kss));
      svg.querySelectorAll('[data-o="animo"]').forEach((g) => g.classList.toggle("on", +g.getAttribute("data-v") === rd.animo));
      R_.rint.textContent = rd.int ? "hoy: " + (rd.intTxt || "") : "¿qué te propones hoy?";
      const ni = (rd.ints || []).findIndex((x) => x[0] === rd.int), ang = ni < 0 ? -2.3 : -2.3 + (ni + 1) * (4.6 / Math.max(1, (rd.ints || []).length));
      R_.rdial.setAttribute("d", "M352 852L" + (352 + 12 * Math.sin(ang)).toFixed(1) + " " + (852 - 12 * Math.cos(ang)).toFixed(1));
      /* la palanca: R el día de antes, N hoy, D el de después */
      const m = D.modo === "pasado" ? -1 : D.modo === "futuro" ? 1 : 0;
      R_.palanca.style.transform = "translateX(" + m * 40 + "px)";
      ["R", "N", "D"].forEach((l, j) => { R_["m" + l].classList.toggle("on", j - 1 === m); R_["w" + l].classList.toggle("on", j - 1 === m); });
      const p = (D.pendiente || [])[0];
      R_.nota.style.display = p ? "" : "none";
      if (p) { R_.notat.textContent = ("Hoy toca: " + p.txt).slice(0, 22) + " ▶"; R_.nota.setAttribute("data-i", p.i); }
    }

    /* el sol cruza de izquierda (al salir) a derecha (al ponerse), bajo y naranja por la mañana y por la
       tarde; de noche, la luna */
    function astro(t, SOL, L) {
      let o = "";
      const f = (t - SOL[0]) / (SOL[1] - SOL[0]);
      if (f > -0.06 && f < 1.06) { const al = Math.sin(Math.PI * clamp(f, 0, 1)), x = 70 + f * 460, y = HY - 6 - al * 96, c = mix("#ff9a3c", "#fff4c8", clamp(al * 1.6, 0, 1));
        o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="34" fill="' + c + '" opacity="' + (0.18 * L.d).toFixed(2) + '"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="13" fill="' + c + '"/>'; }
      const larga = 24 - (SOL[1] - SOL[0]), g = (((t - SOL[1]) % 24) + 24) % 24 / larga;
      if (g > 0 && g < 1 && L.d < 0.9) { const al = Math.sin(Math.PI * g), x = 70 + g * 460, y = HY - 10 - al * 80, op = (1 - L.d).toFixed(2);
        o += '<g opacity="' + op + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="24" fill="#cfdcff" opacity=".12"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9.5" fill="#e8eefc"/>' +
          '<circle cx="' + (x - 3).toFixed(1) + '" cy="' + (y - 2).toFixed(1) + '" r="2.2" fill="#c9d3ea"/><circle cx="' + (x + 2.6).toFixed(1) + '" cy="' + (y + 3).toFixed(1) + '" r="1.5" fill="#c9d3ea"/></g>'; }
      return o;
    }

    function draw(dt) {
      if (!D) return false;
      const L = luz(t, D.sol || [7, 18.6]), c = camDe(R, t), st = estado(t);
      R_.sky0.setAttribute("stop-color", L.top); R_.sky1.setAttribute("stop-color", L.bot);
      const cs = casaEn(st);
      el.classList.toggle("casa", !!cs);
      R_.vent.setAttribute("clip-path", "url(#" + (cs ? "cdcasa" : "cdwin") + ID + ")");
      R_.manosc.style.display = "none";
      R_.stars.innerHTML = cs ? "" : astro(t, D.sol || [7, 18.6], L) + (L.d < 0.6 ? Array.from({ length: 26 }, (_, i) => '<circle cx="' + (40 + hash(i) * 520).toFixed(0) + '" cy="' + (52 + hash(i + 50) * 90).toFixed(0) + '" r="' + (0.6 + hash(i + 9) * 0.9).toFixed(1) + '" fill="#e9f2ff" opacity="' + ((1 - L.d) * 0.8).toFixed(2) + '"/>').join("") : "");
      R_.scene.innerHTML = cs ? casaSVG(cs, L) : escena(c.s, L, st);
      /* la cochera: parada en una noche o siesta, con la persiana bajada; al salir sube y te alejas;
         al llegar a la siguiente, se funde */
      let g = "";
      const E = R.est, e = E[c.k], q = c.sig != null ? E[c.sig] : null;
      if (e && e.dep && c.parado) g = cochera(0, t >= e.b - 0.02 ? 1 : 0, L.d);
      else if (e && e.dep && !c.parado) g = cochera(c.s - e.s, clamp(c.p / 0.3, 0, 1), L.d);
      else if (q && q.dep && !c.parado && c.p > 0.85) g = '<g style="opacity:' + clamp((c.p - 0.85) / 0.15, 0, 1).toFixed(2) + '">' + cochera(0, 1, L.d) + "</g>";
      R_.garage.innerHTML = cs ? "" : g;
      /* de guardia, la cabina en penumbra */
      R_.dim.setAttribute("opacity", st.guardia && L.d < 0.5 ? 0.32 : 0);
      /* la cabina de guardia: clase en la raíz (bata, panel rojo), el busca con las horas hechas y las que
         quedan, y el parasol dice GUARDIA en vez de la rotación */
      el.classList.toggle("guardia", !!st.guardia);
      R_.busca.style.display = st.guardia ? "" : "none";
      if (st.guardia) R_.buscav.textContent = Math.floor(t - st.guardia.a) + " h · quedan " + Math.ceil(st.guardia.b - t) + " h";
      R_.rot.textContent = st.guardia ? "☾ GUARDIA · sales " + hhmm(st.guardia.b) : (D.esc && D.esc.rot ? D.esc.rot : "");
      /* a casa en bici: el manillar en vez del volante */
      const bici = ((D.esc && D.esc.bici) || []).some((v) => t >= v[0] && t < v[1]);
      R_.volante.style.display = bici ? "none" : ""; R_.bici.style.display = bici ? "" : "none";
      salpicadero(st, c);
      const ah = st.corto || st.turno;
      if (ah && !st.noche) { const f = clamp((t - ah.a) / Math.max(0.01, ah.b - ah.a), 0, 1);
        R_.arc.setAttribute("d", f > 0.005 ? "M222 684H" + (222 + 156 * f).toFixed(1) : ""); }
      else R_.arc.setAttribute("d", "");
      if (cs) { R_.nxl.textContent = cs.e === "cama" && st.noche ? "EN CASA · DURMIENDO" : "EN CASA";
        if (!(cs.e === "cama" && st.noche)) R_.nxa.textContent = "Ahora: " + (cs.e === "mesa" && cs.t ? cap(cs.t) : CASA_TXT[cs.e] || "en casa") + " · hasta " + hhmm(cs.b);
        else R_.nxa.innerHTML = "Te levantas a las <tspan font-weight=\"800\">" + hhmm(st.noche.b) + "</tspan>"; }
      cabe(R_.nxl, 224); cabe(R_.nxa, 226); cabe(R_.nxb, 226);
      /* mirar a un lado: la ventana enseña la ciudad (izquierda) o el campo (derecha); la radio, encima del salpicadero */
      R_.lado.innerHTML = lado || ladoVa ? ladoSVG(lado || ladoVa, st) : "";
      R_.mi.classList.toggle("on", lado === "izq"); R_.md.classList.toggle("on", lado === "der");
      R_.radiob.style.display = radio ? "" : "none";
      R_.mirar.style.display = mirando && !lado ? "" : "none";
      if (mirando) R_.mirart.textContent = "viendo las " + hhmm(t) + " · volver ⟲";
      svg.setAttribute("aria-valuenow", String(Math.round(t * 100) / 100));
      svg.setAttribute("aria-valuetext", hhmm(t) + " · " + (st.noche ? "en la cochera" : (st.corto || st.turno) ? cap((st.corto || st.turno).t) + " hasta las " + hhmm((st.corto || st.turno).b) : "libre"));
      return false;
    }
    /* ---------- en casa, en primera persona ---------- */
    const CASA_TXT = { cama: "en la cama", movil: "en la cama con el móvil", leer: "leyendo en la cama", siesta: "siesta", ducha: "en la ducha", cafe: "el café", vestir: "vistiéndote", escritorio: "en el escritorio", salon: "en el sofá", casa: "en casa", mesa: "a la mesa" };
    /* lo de casa (sale de las escenas del día) cuando no hay nada en marcha: ni turno, ni comida, ni evento */
    function casaEn(st) {
      if (st.guardia || st.enCurso.some((x) => x.k !== "meal")) return null;   /* comer en casa sí es estar en casa */
      const v = ((D.esc && D.esc.casa) || []).find((x) => t >= x[0] - 1e-6 && t < x[1]);
      const m = st.enCurso.find((x) => x.k === "meal");   /* la comida que toca: el plato se toca como su cartel */
      return v ? { e: v[2], a: v[0], b: v[1], t: v[3] || "", i: m ? m.i : null } : null;
    }
    function manoSVG(x, y, f, s, extra) {
      return '<g transform="translate(' + x + " " + y + ") scale(" + (f * s) + " " + s + ')">' + (extra || "") + '<path class="cd-mano" d="M-15 2 Q-16 -10 -7 -12 L8 -12 Q16 -10 15 -1 L14 10 Q6 16 -7 13 Q-15 11 -15 2Z"/><path class="cd-manga" d="M-17 10 Q-18 20 -8 22 L8 22 Q18 20 17 10 L14 10 Q6 16 -7 13 Q-15 11 -15 2Z"/></g>';
    }
    function casaSVG(cs, L) {
      const n = 1 - L.d, o = [], pose = cs.e === "siesta" ? "cama" : cs.e === "leer" ? "movil" : cs.e;
      const duerme = pose === "cama", pal = {
        cama: ["#6d7fa6", "#7a5a3e", "#8c9cc0"], movil: ["#6d7fa6", "#7a5a3e", "#8c9cc0"], ducha: ["#cfe3ea", "#9fb7c0", "#e3eef2"], cafe: ["#e8d9b5", "#b9a27c", "#f2ead6"],
        vestir: ["#c7b9a6", "#8a6a4c", "#ddd2c2"], escritorio: ["#9fb0c8", "#7a5a3e", "#c3cfdf"], salon: ["#b98f6e", "#6b4a32", "#d7b99c"], casa: ["#b98f6e", "#6b4a32", "#d7b99c"] }[pose] || ["#b98f6e", "#6b4a32", "#d7b99c"];
      const pared = pal[0], suelo = pal[1], techo = pal[2], B = [140, 150, 460, 420];
      /* la habitación: techo, suelo, paredes y la del fondo, con su ventana al cielo de esa hora */
      o.push(Pp([[0, 40], [600, 40], [B[2], B[1]], [B[0], B[1]]], techo), Pp([[B[0], B[3]], [B[2], B[3]], [600, 606], [0, 606]], suelo),
        Pp([[0, 40], [B[0], B[1]], [B[0], B[3]], [0, 606]], mix(pared, "#000000", 0.12)), Pp([[600, 40], [B[2], B[1]], [B[2], B[3]], [600, 606]], mix(pared, "#000000", 0.18)), Rr(B[0], B[1], B[2] - B[0], B[3] - B[1], 0, pared));
      for (let i = 1; i < 7; i++) { const f = i / 7; o.push('<path d="M' + (B[0] + (0 - B[0]) * f) + " " + (B[3] + (606 - B[3]) * f) + "L" + (B[2] + (600 - B[2]) * f) + " " + (B[3] + (606 - B[3]) * f) + '" stroke="' + mix(suelo, "#000000", 0.25) + '" stroke-width="1.5" opacity=".5"/>'); }
      const ventana = (x, y, w, h) => { const sky = mix(L.top, L.bot, 0.55);
        o.push(Rr(x - 6, y - 6, w + 12, h + 12, 3, "#e9e2d6"), Rr(x, y, w, h, 2, sky), '<path d="M' + (x + w / 2) + " " + y + "V" + (y + h) + "M" + x + " " + (y + h / 2) + "H" + (x + w) + '" stroke="#e9e2d6" stroke-width="4"/>');
        o.push(L.d > 0.5 ? '<circle cx="' + (x + w * 0.7) + '" cy="' + (y + h * 0.3) + '" r="9" fill="#fff3b8"/>' : '<circle cx="' + (x + w * 0.7) + '" cy="' + (y + h * 0.3) + '" r="7" fill="#e8eefc"/><circle cx="' + (x + w * 0.25) + '" cy="' + (y + h * 0.2) + '" r="1.4" fill="#fff"/><circle cx="' + (x + w * 0.4) + '" cy="' + (y + h * 0.65) + '" r="1.2" fill="#fff"/>'); };
      const luces = [];   /* lo que brilla va después de la penumbra */
      if (pose === "cama" || pose === "movil") {
        ventana(190, 200, 120, 100); o.push(Rr(176, 190, 18, 128, 3, "#8b5e8f"), Rr(306, 190, 18, 128, 3, "#8b5e8f"));
        o.push(Rr(380, 210, 60, 46, 2, "#c9b38f", 'opacity=".9"'));   /* un cuadro */
        /* la mesilla con la lámpara y el despertador */
        o.push(Rr(470, 430, 100, 90, 4, "#5a3f2b"), Rr(470, 422, 100, 12, 3, "#6b4c34"), Pp([[492, 360], [538, 360], [548, 396], [482, 396]], "#e8d3a8"), Rr(512, 396, 6, 26, 0, "#7d7d7d"));
        o.push(Rr(530, 400, 34, 20, 4, "#111"), '<text x="547" y="414.5" font-size="11" font-weight="800" fill="#ff4d4d" text-anchor="middle" font-family="ui-monospace,Menlo,monospace">' + hhmm(t) + "</text>");
        /* la manta, con las rodillas: estás tumbado mirando a los pies de la cama */
        o.push('<path d="M0 606V500Q90 470 170 488Q240 440 320 470Q410 430 480 486Q560 476 600 500V606Z" fill="#3f5fa8"/><path d="M0 540Q150 520 300 548T600 540" stroke="#5a7bc4" stroke-width="5" fill="none" opacity=".7"/>');
        if (duerme && n > 0.3) luces.push('<g font-weight="900" fill="#cfe0ff"><text x="250" y="170" font-size="26" opacity=".8">z</text><text x="280" y="140" font-size="34" opacity=".65">Z</text><text x="318" y="104" font-size="44" opacity=".5">Z</text></g>');
        if (pose === "movil") { luces.push('<ellipse cx="320" cy="430" rx="190" ry="140" fill="#8fd3ff" opacity=".12"/>');
          luces.push('<g transform="rotate(-8 320 470)">' + Rr(282, 400, 76, 130, 12, "#111") + Rr(288, 410, 64, 108, 6, "#bfe6ff") + Rr(296, 420, 48, 8, 3, "#4a90c4") + Rr(296, 434, 40, 6, 3, "#7fb6dd") + Rr(296, 446, 44, 6, 3, "#7fb6dd") + "</g>" + manoSVG(300, 520, 1, 1.6) + manoSVG(372, 500, -1, 1.5)); }
      } else if (pose === "ducha") {
        for (let x = B[0]; x <= B[2]; x += 32) o.push('<path d="M' + x + " " + B[1] + "V" + B[3] + '" stroke="#b5ccd4" stroke-width="1.5"/>');
        for (let y = B[1]; y <= B[3]; y += 32) o.push('<path d="M' + B[0] + " " + y + "H" + B[2] + '" stroke="#b5ccd4" stroke-width="1.5"/>');
        o.push('<path d="M430 150V190Q430 200 418 200H392" stroke="#9aa3b2" stroke-width="7" fill="none"/>', '<ellipse cx="384" cy="204" rx="26" ry="9" fill="#c9d1dc"/>');
        for (let i = 0; i < 26; i++) { const x = 362 + hash(i) * 46 + (hash(i + 3) - 0.5) * 80 * hash(i + 9), y0 = 214 + hash(i + 5) * 40; o.push('<path d="M' + (362 + hash(i) * 46).toFixed(1) + " " + y0.toFixed(1) + "L" + x.toFixed(1) + " " + (y0 + 180 + hash(i + 7) * 200).toFixed(1) + '" stroke="#e6f6ff" stroke-width="2" opacity=".7"/>'); }
        o.push(Rr(470, 60, 130, 546, 0, "#cfe9f5", 'opacity=".25"'), '<path d="M470 60V606" stroke="#e8f4fa" stroke-width="4" opacity=".7"/>');
        o.push(Rr(40, 250, 70, 150, 6, "#e85d75"), Rr(36, 240, 78, 16, 6, "#9aa3b2"));   /* la toalla en su gancho */
        luces.push('<g fill="#ffffff" opacity=".1"><ellipse cx="300" cy="120" rx="260" ry="60"/><ellipse cx="380" cy="190" rx="120" ry="34"/><ellipse cx="200" cy="170" rx="110" ry="28"/></g>');   /* el vaho, arriba, sin tapar la ducha */
      } else if (pose === "cafe" || pose === "mesa") {
        o.push(Rr(B[0], B[1] + 6, B[2] - B[0], 64, 3, "#f3efe6"), '<path d="M' + (B[0] + (B[2] - B[0]) / 2) + " " + (B[1] + 6) + "V" + (B[1] + 70) + '" stroke="#d9d1c2" stroke-width="2"/>');
        ventana(230, 250, 140, 90);
        o.push(Pp([[0, 476], [600, 476], [600, 500], [0, 500]], "#d7d2c8"), Rr(0, 500, 600, 106, 0, "#8a6a4c"));
        o.push(Rr(100, 392, 86, 86, 8, "#2a2f38"), Rr(112, 404, 62, 30, 4, "#11141a"), '<circle cx="168" cy="452" r="5" fill="#ff5a4d"/>', Rr(124, 448, 28, 26, 3, "#f3efe6"));
        o.push(Rr(250, 440, 40, 36, 6, "#c46a1a"), Rr(300, 452, 30, 24, 4, "#4a90c4"));   /* el bote y una taza */
        if (pose === "mesa") {   /* sentado a la mesa: el plato delante, el tenedor y el cuchillo en las manos */
          const desay = /desay/i.test(cs.t || "");
          o.push((cs.i != null ? '<g data-o="ev" data-i="' + esc(String(cs.i)) + '" style="cursor:pointer">' : "<g>") + '<ellipse cx="300" cy="566" rx="118" ry="34" fill="#e9e4da"/><ellipse cx="300" cy="562" rx="86" ry="22" fill="#f7f4ee"/>' +
            (desay ? Rr(250, 540, 50, 20, 6, "#d9a35f") + Rr(306, 542, 46, 18, 6, "#c98a4a") + '<circle cx="290" cy="548" r="7" fill="#e85b3a"/>'
              : '<ellipse cx="280" cy="556" rx="34" ry="12" fill="#e2b05a"/><ellipse cx="324" cy="560" rx="26" ry="10" fill="#5aa04a"/><ellipse cx="300" cy="566" rx="22" ry="8" fill="#b5562e"/>') + "</g>");
          if (desay) o.push(Rr(430, 520, 44, 46, 8, "#f3efe6"));
          luces.push((desay ? '<g stroke="#ffffff" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"><path d="M444 516c-8-12 8-18 0-30"/><path d="M460 516c-8-12 8-18 0-30"/></g>' : "") +
            manoSVG(150, 580, 1, 1.5, '<path d="M14 -10L40 -70M34 -70v-16M40 -70v-18M46 -70v-16" stroke="#c9ced6" stroke-width="5" stroke-linecap="round" fill="none"/>') +
            manoSVG(450, 580, -1, 1.5, '<path d="M14 -10L36 -78" stroke="#c9ced6" stroke-width="7" stroke-linecap="round"/>'));
        } else luces.push('<g stroke="#ffffff" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"><path d="M440 452c-8-12 8-18 0-30"/><path d="M458 452c-8-12 8-18 0-30"/></g>' +
          manoSVG(452, 540, -1, 1.6, Rr(-30, -64, 46, 52, 8, "#f3efe6") + '<path d="M16 -52q18 2 16 18q-2 14 -16 12" stroke="#f3efe6" stroke-width="7" fill="none"/>'));
      } else if (pose === "vestir") {
        o.push(Rr(180, 160, 240, 260, 4, "#6b4c34"), Rr(190, 170, 220, 240, 2, "#3b2a1f"), '<path d="M196 200H404" stroke="#9aa3b2" stroke-width="4"/>');
        [["#2f5fb3", 210], ["#e9e2d6", 250], ["#3f8a4f", 290], ["#1d3a73", 330], ["#c46a1a", 370]].forEach(([c, x]) => o.push('<path d="M' + x + ' 200l-14 16h28z" fill="none" stroke="#9aa3b2" stroke-width="2"/>' + Rr(x - 16, 214, 32, 120, 4, c)));
        o.push(Rr(30, 180, 90, 230, 6, "#d6dee8"), Rr(38, 188, 74, 214, 4, "#9fb3cf"), '<circle cx="75" cy="270" r="18" fill="#3a2a20"/>' + Rr(56, 250, 38, 10, 4, "#1d3a73") + Rr(54, 288, 42, 70, 10, "#2f5fb3"));   /* el espejo */
        luces.push(manoSVG(220, 560, 1, 1.6, Rr(-10, -40, 220, 60, 8, "#1d3a73")) + manoSVG(400, 560, -1, 1.6));
      } else if (pose === "escritorio") {
        ventana(330, 200, 110, 100);
        o.push(Rr(160, 190, 140, 10, 2, "#6b4c34"), Rr(166, 160, 14, 30, 1, "#c9302c"), Rr(182, 166, 12, 24, 1, "#2f5fb3"), Rr(196, 156, 16, 34, 1, "#3f8a4f"), Rr(214, 168, 12, 22, 1, "#c46a1a"));
        o.push(Pp([[0, 470], [600, 470], [600, 606], [0, 606]], "#8a6a48"), Rr(0, 466, 600, 8, 0, "#a07650"));
        o.push(Pp([[200, 520], [300, 500], [400, 520], [400, 590], [300, 572], [200, 590]], "#f3efe4"), '<path d="M300 500V572" stroke="#c9c2b2" stroke-width="2"/>');
        for (let i = 0; i < 5; i++) o.push('<path d="M214 ' + (530 + i * 11) + "L288 " + (514 + i * 11) + "M314 " + (514 + i * 11) + "L388 " + (530 + i * 11) + '" stroke="#9aa3b2" stroke-width="2"/>');
        o.push('<path d="M70 466L96 380L150 350" stroke="#3a4250" stroke-width="7" fill="none"/>', Pp([[136, 334], [176, 350], [160, 372], [124, 360]], "#2a3448"));
        luces.push(Pp([[150, 360], [130, 470], [330, 470]], "#fff3c4", 'opacity=".28"') + manoSVG(470, 560, -1, 1.6, '<path d="M-20 -40L30 -90" stroke="#1d2b40" stroke-width="6" stroke-linecap="round"/>'));
      } else {
        o.push(Rr(210, 230, 180, 104, 6, "#11141a"), Rr(218, 238, 164, 88, 3, "#2a5fa3"), Rr(280, 334, 40, 10, 0, "#11141a"), Rr(200, 380, 200, 40, 4, "#5a3f2b"));
        o.push('<path d="M70 420V250" stroke="#7a7a7a" stroke-width="5"/>', Pp([[46, 250], [94, 250], [104, 290], [36, 290]], "#e8d3a8"), Rr(470, 340, 40, 70, 6, "#6b4c34"), '<circle cx="490" cy="320" r="34" fill="#3f8a4f"/>');
        o.push('<ellipse cx="300" cy="560" rx="230" ry="50" fill="#5a3f2b"/>', Rr(150, 530, 34, 30, 6, "#e9e2d6"));
        luces.push('<ellipse cx="300" cy="290" rx="150" ry="90" fill="#7fb6ff" opacity=".14"/>' + Rr(232, 252, 50, 40, 4, "#9fd0ff", 'opacity=".55"') + Rr(300, 270, 66, 30, 4, "#ffd66b", 'opacity=".5"') +
          (n > 0.3 ? '<circle cx="70" cy="270" r="60" fill="#fff3c4" opacity=".2"/>' : "") + manoSVG(260, 560, 1, 1.5) + manoSVG(340, 560, -1, 1.5) + Rr(250, 520, 100, 34, 16, "#1b2333"));
      }
      /* la penumbra de la noche (o de dormir), y luego lo que brilla */
      const osc = duerme ? 0.35 + 0.5 * n : n * 0.55;
      if (osc > 0.02) o.push(Rr(0, 40, 600, 566, 0, "#05070f", 'opacity="' + clamp(osc, 0, 0.85).toFixed(2) + '"'));
      o.push(luces.join(""));
      return o.join("");
    }
    /* ---------- mirar a los lados ---------- */
    const Rr = (x, y, w, h, rx, fill, extra) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + fill + '" ' + (extra || "") + "/>";
    const Tt = (x, y, str, size, fill, w, anchor, max) => { const long = String(str).length * size * 0.56 > (max || 1e9);
      return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" font-weight="' + (w || 700) + '" fill="' + fill + '" text-anchor="' + (anchor || "start") + '"' + (long ? ' textLength="' + max + '" lengthAdjust="spacingAndGlyphs"' : "") + ">" + esc(str) + "</text>"; };
    const Pp = (pts, fill, extra) => '<path d="M' + pts.map((p) => p[0] + " " + p[1]).join("L") + 'Z" fill="' + fill + '" ' + (extra || "") + "/>";
    const cuando = (e, ahora) => D.modo !== "hoy" ? hhmm(e.a) + "–" + hhmm(e.b) : e.b <= ahora ? "✓ ya pasó" : e.a <= ahora ? "ahora · hasta " + hhmm(e.b) : "dentro de " + dura(e.a - ahora);
    const dentro = (d) => d === 1 ? "mañana" : "dentro de " + d + " días";
    function ladoSVG(cual, st) {
      const ahora = AHORA != null ? AHORA : t, cab = D.cab || {}, o = [];
      const cielo = cual === "izq" ? ["#4f93d8", "#d7ebff"] : ["#5aa0e0", "#e3f1ff"];
      o.push('<defs><linearGradient id="cdl' + cual + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + cielo[0] + '"/><stop offset="1" stop-color="' + cielo[1] + '"/></linearGradient></defs>');
      o.push(Rr(0, 0, 600, 600, 0, "url(#cdl" + cual + ")"));
      if (cual === "izq") {
        const izq = cab.izq || {}, viene = izq.viene || [], ph = izq.ph || [];
        const evs = (D.dia || []).filter((e) => e.k === "plan" && e.b > e.a).sort((a, b) => a.a - b.a);
        o.push('<g fill="#fff" opacity=".8"><ellipse cx="460" cy="150" rx="56" ry="15"/><ellipse cx="486" cy="138" rx="28" ry="14"/></g><g transform="translate(0 26)">');
        /* al fondo, lo importante que viene: la torre y el hospital, con sus vallas */
        o.push(Rr(70, 150, 92, 330, 2, "#9fb3cf"), Rr(84, 136, 64, 18, 2, "#9fb3cf"));
        for (let y = 170; y < 470; y += 26) for (let x = 80; x < 156; x += 20) o.push(Rr(x, y, 12, 14, 1, "#b9c9de"));
        o.push(Rr(178, 220, 150, 260, 2, "#c3cfdf"), Rr(232, 234, 42, 14, 2, "#e5484d"), Rr(246, 220, 14, 42, 2, "#e5484d"));
        for (let y = 270; y < 470; y += 26) for (let x = 190; x < 320; x += 24) o.push(Rr(x, y, 14, 14, 1, "#dfe7f2"));
        const valla = (v, x, y, w) => '<g data-o="verdia" data-k="' + v.k + '">' + Rr(x, y, w, 46, 8, "#0b1020", 'stroke="' + v.col + '" stroke-width="2"') + Tt(x + 14, y + 22, v.t, 14, "#e9f2ff", 800, "start", w - 26) + Tt(x + 14, y + 38, dentro(v.dias), 12, "#ffd66b", 700) + "</g>";
        if (viene[0]) o.push(valla(viene[0], 50, 100, 206)); else o.push(Rr(50, 100, 206, 40, 8, "#0b1020", 'stroke="#3a4458" stroke-width="2"'), Tt(64, 125, "nada importante a la vista", 13, "#8fa6c6", 700));
        if (viene[1]) o.push(valla(viene[1], 186, 164, 176));
        /* delante, los eventos de hoy en sus fachadas */
        o.push(Rr(350, 196, 230, 290, 3, "#5b6a8a"));
        for (let y = 280; y < 480; y += 30) for (let x = 362; x < 570; x += 28) o.push(Rr(x, y, 16, 18, 2, "#1a2236"));
        o.push(Rr(26, 330, 150, 160, 3, "#43506d"), Rr(26, 320, 150, 16, 2, "#7a5cf0"));
        for (let y = 360; y < 480; y += 30) for (let x = 36; x < 166; x += 26) o.push(Rr(x, y, 14, 18, 2, "#1a2236"));
        const pend = evs.filter((e) => e.b > ahora || D.modo !== "hoy"), a1 = pend[0] || evs[evs.length - 1] || null, a2 = evs.filter((e) => e !== a1 && (pend.indexOf(e) >= 0 || !pend.length))[0] || null;
        const cartel = (e, x, y, w, col, mas) => '<g data-o="ev" data-i="' + e.i + '">' + Rr(x, y, w, 56, 8, "#0b1020", 'stroke="' + col + '" stroke-width="2.5"') +
          Tt(x + 12, y + 24, hhmm(e.a) + " " + String(e.t).toUpperCase(), 15, "#e9f2ff", 900, "start", w - 22) + Tt(x + 12, y + 44, cuando(e, ahora) + (mas ? " · +" + mas + " más" : ""), 12.5, e.b <= ahora && D.modo === "hoy" ? "#4ad08a" : "#c9bfff", 700, "start", w - 22) + "</g>";
        if (a1) o.push(cartel(a1, 352, 210, 216, "#1fa6c4", 0)); else o.push(Rr(352, 210, 216, 46, 8, "#0b1020", 'stroke="#3a4458" stroke-width="2"'), Tt(366, 238, "Sin eventos este día", 14, "#8fa6c6", 800));
        if (a2) o.push(cartel(a2, 44, 274, 196, "#7a5cf0", Math.max(0, evs.length - 2)));
        /* la acera y el quiosco de «Para hoy» */
        o.push(Rr(0, 486, 600, 120, 0, "#59616f"), Rr(0, 486, 600, 6, 0, "#9aa3b2"));
        const lista = ph.map((x, n) => Object.assign({ n }, x)).sort((a, b) => (a.hecho ? 1 : 0) - (b.hecho ? 1 : 0) || (b.av ? 1 : 0) - (a.av ? 1 : 0)).slice(0, 3);
        const hechas = ph.filter((x) => x.hecho).length, kh = 30 + Math.max(1, lista.length) * 34 + (ph.length > 3 ? 14 : 0);
        o.push('<g>' + Rr(186, 492 - kh, 196, kh, 10, "#1f6b4f") + Rr(176, 480 - kh, 216, 22, 6, "#2f9e6b") + Tt(284, 496 - kh, ph.length ? "PARA HOY · " + hechas + " de " + ph.length : "PARA HOY", 13, "#eafff4", 900, "middle") + "</g>");
        if (!lista.length) o.push(Rr(196, 514 - kh, 176, 30, 3, "#f3efe4"), Tt(284, 534 - kh, "✓ nada pendiente", 12.5, "#1d2b40", 800, "middle"));
        lista.forEach((x, j) => { const y = 506 - kh + j * 34;
          o.push('<g data-o="ph" data-n="' + x.n + '"' + (x.hecho ? ' opacity=".6"' : "") + ">" + Rr(196, y, 176, 30, 3, "#f3efe4") + Rr(202, y + 8, 12, 12, 3, x.hecho ? "#2f9e6b" : "none", 'stroke="' + (x.av ? "#c46a1a" : "#4a5d78") + '" stroke-width="2"') +
            (x.hecho ? Tt(208, y + 18, "✓", 11, "#fff", 900, "middle") : "") + Tt(220, y + 14, (x.ico ? x.ico + " " : "") + x.t, 12, "#1d2b40", 800, "start", 146) + Tt(220, y + 26, x.sub || "", 9.5, "#4a5d78", 600, "start", 146) + "</g>"); });
        if (ph.length > 3) o.push(Tt(284, 500, "+" + (ph.length - 3) + " más · toca la máquina de billetes", 10, "#eafff4", 700, "middle"));
        o.push('<path d="M520 496V330q0-14 14-14h18" stroke="#6c7686" stroke-width="6" fill="none"/>' + Rr(546, 310, 22, 10, 3, "#9aa3b2") + "</g>");
      } else {
        const der = cab.der || {}, habs = der.habs || [];
        o.push('<circle cx="120" cy="130" r="34" fill="#fff6c8" opacity=".35"/><circle cx="120" cy="130" r="18" fill="#fff3b8"/>');
        o.push(Pp([[0, 410], [120, 230], [190, 280], [300, 140], [430, 290], [520, 240], [600, 330], [600, 430], [0, 430]], "#6f8aa8"), Pp([[300, 140], [330, 180], [312, 176], [296, 190], [276, 172]], "#eef4fb"));
        o.push(Pp([[0, 430], [0, 360], [160, 330], [340, 350], [600, 320], [600, 430]], "#3d6b45"));
        /* el polideportivo en la ladera, con el entreno de hoy */
        const gym = (D.dia || []).filter((e) => e.k === "gym" && e.b > e.a).sort((a, b) => a.a - b.a)[0];
        o.push(Rr(330, 266, 150, 70, 4, "#4b3f7a"), Pp([[322, 268], [405, 236], [488, 268]], "#3a3163"), Rr(392, 298, 26, 38, 2, "#ffe7a6"));
        o.push('<g data-o="' + (gym ? 'ev" data-i="' + gym.i : "tabgym") + '">' + Rr(290, 196, 230, 54, 8, "#0b1020", 'stroke="#9c86ff" stroke-width="2.5"') +
          Tt(304, 219, gym ? "🏋 " + hhmm(gym.a) + " " + String(gym.t).toUpperCase() : "🏋 Hoy no toca entrenar", 16, "#e9e4ff", 900, "start", 204) + Tt(304, 240, gym ? (gym.h ? "✓ hecho · " : cuando(gym, ahora) + " · ") + (der.sem || "") : der.sem || "toca para ver Entreno", 12, "#c9bfff", 700, "start", 204) + "</g>");
        /* el río */
        o.push(Pp([[0, 440], [600, 422], [600, 500], [0, 518]], "url(#cdrio" + ID + ")"));
        for (let i = 0; i < 18; i++) { const x = (i * 71) % 600, y = 450 + ((i * 29) % 56); o.push('<path d="M' + x + " " + y + "h" + (18 + (i % 3) * 8) + '" stroke="#bcd6ee" stroke-width="2" opacity=".55" stroke-linecap="round"/>'); }
        o.push(Pp([[0, 518], [600, 500], [600, 610], [0, 610]], "#46784d"));
        /* el merendero junto al río, con la comida que toca */
        const meals = (D.dia || []).filter((e) => e.k === "meal" && e.b > e.a).sort((a, b) => a.a - b.a), m = meals.find((e) => e.b > ahora) || meals[meals.length - 1], k = D.comida || {};
        o.push(Rr(30, 392, 176, 96, 6, "#8a6a48"), Pp([[22, 396], [118, 356], [214, 396]], "#c9302c"));
        o.push('<g data-o="' + (m ? 'ev" data-i="' + m.i : "comer") + '">' + Rr(42, 420, 152, 56, 4, "#f3efe4") + Tt(118, 442, m ? "🍽 " + hhmm(m.a) + " " + String(m.t).toUpperCase() : "🍽 COMIDA", 13.5, "#1d2b40", 900, "middle", 140) +
          Tt(118, 464, m && m.h ? "✓ apuntada · " + Math.round(k.kc || 0) + " kcal" : Math.round(k.kc || 0) + (k.obj ? " / " + Math.round(k.obj) : "") + " kcal", 12, "#2f9e6b", 800, "middle", 140) + "</g>");
        /* el poste de madera: una flecha por hábito, con su luz */
        const ver = habs.slice(0, 4), y0 = 372;
        o.push(Rr(318, y0 - 4, 10, 160, 0, "#6b4c32"));
        if (!ver.length) o.push(Pp([[328, y0], [480, y0], [498, y0 + 13], [480, y0 + 26], [328, y0 + 26]], "#a07650"), Tt(342, y0 + 18, "sin hábitos hoy", 12.5, "#fff8ec", 800));
        ver.forEach((hb, j) => { const y = y0 + j * 32, luz = hb.on ? "#4ad08a" : hb.est === "min" ? "#f2a33a" : "#2a3a55";
          o.push('<g data-o="hab" data-n="' + j + '">' + Pp([[328, y], [488, y], [508, y + 13], [488, y + 26], [328, y + 26]], "#a07650") + '<circle cx="343" cy="' + (y + 13) + '" r="6" fill="' + luz + '"/>' + Tt(356, y + 18, (hb.ico ? hb.ico + " " : "") + hb.t, 12.5, "#fff8ec", 800, "start", 140) + "</g>"); });
        if (habs.length > 4) o.push(Tt(418, y0 + 4 * 32 + 14, "+" + (habs.length - 4) + " más en Hábitos", 10.5, "#eafff4", 700, "middle"));
      }
      /* el letrero de arriba y el botón para volver a mirar al frente */
      o.push(Rr(120, 92, 360, 22, 11, "#0b1020", 'opacity=".85"'), Tt(300, 107, cual === "izq" ? "◀ MIRANDO A LA IZQUIERDA · LA CIUDAD" : "MIRANDO A LA DERECHA · EL CAMPO ▶", 11.5, "#e9f2ff", 800, "middle"));
      o.push('<g data-o="frente">' + Rr(196, 524, 208, 32, 16, "#0d1726", 'stroke="#ffd66b" stroke-width="2.5"') + Tt(300, 545, cual === "izq" ? "volver al frente ▶" : "◀ volver al frente", 15, "#ffd66b", 800, "middle") + "</g>");
      return o.join("");
    }
    function tick(now) {
      const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60; last = now;
      t = still.matches ? target : t + (target - t) * (1 - Math.exp(-dt / 0.45));
      if (Math.abs(target - t) < 0.001) t = target;
      draw(dt);
      frame = visible && t !== target ? requestAnimationFrame(tick) : 0;
    }
    const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
    const vuelve = () => { mirando = false; if (AHORA != null) target = AHORA; run(); draw(0); };
    const steer = (to) => { target = clamp(to, 0, 23.99); mirando = AHORA != null && Math.abs(target - AHORA) > 0.05; clearTimeout(idle); idle = setTimeout(vuelve, 9000); run(); };
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }).observe(svg);

    /* ---------- tocar: un toque hace lo rápido (apuntar la comida, empezar el entreno); mantener abre la hoja ---------- */
    let down = null;
    const abrir = (o) => { try { opts.onAbrir && opts.onAbrir(o); } catch (e) {} };
    svg.addEventListener("pointerdown", (ev) => { down = { x: ev.clientX, t: target, moved: false, at: Date.now(), el: ev.target.closest && ev.target.closest("[data-o]") }; });
    svg.addEventListener("pointermove", (ev) => {
      if (!down) return; const dx = ev.clientX - down.x, w = svg.getBoundingClientRect().width;
      if (Math.abs(dx) > 7) down.moved = true; if (down.moved) steer(down.t - dx / w * 10);
    });
    svg.addEventListener("pointerup", () => {
      const d = down; down = null; if (!d || d.moved || !d.el) return;
      toca(d.el, Date.now() - d.at > 450);
    });
    svg.addEventListener("pointercancel", () => { down = null; });
    function toca(n, largo) {
      const o = n.getAttribute("data-o"), i = n.getAttribute("data-i"), st = estado(t);
      const item = (idx) => (D.dia || []).find((e) => String(e.i) === String(idx));
      if (o === "ahora") return vuelve();
      if (o === "sueno") { radio = false; draw(0); return abrir({ tipo: D.sueno ? "sueno" : "anotar" }); }
      if (o === "comer") return abrir({ tipo: "comer" });
      /* mirar a un lado (los retrovisores y sus letreros), volver al frente; la máquina de billetes lleva al quiosco */
      if (o === "mirai" || o === "mirad" || o === "parahoy") { const q = o === "mirad" ? "der" : "izq"; radio = false; girar(lado === q && o !== "parahoy" ? null : q); draw(0); return; }
      if (o === "frente") { girar(null); draw(0); return; }
      if (o === "radio") { radio = !radio; draw(0); return; }
      const rd = (D.cab && D.cab.radio) || {}, cab = D.cab || {};
      if (o === "kss" || o === "animo") return abrir({ tipo: "act", a: o === "kss" ? "asist-kss" : "asist-animo", ds: { k: rd.k || "", v: n.getAttribute("data-v") } });
      if (o === "int") { const L = rd.ints || []; if (!L.length) return; const j = L.findIndex((x) => x[0] === rd.int), x = L[(j + 1) % L.length];
        return abrir({ tipo: "act", a: "asist-int", ds: { k: rd.k || "", v: x[0], t: x[1] } }); }
      if (o === "marcha") return abrir({ tipo: "marcha", d: +n.getAttribute("data-d") });
      if (o === "verdia") return abrir({ tipo: "verdia", k: n.getAttribute("data-k") });
      if (o === "tabgym") return abrir({ tipo: "tab", t: "gym" });
      if (o === "ph" || o === "hab") { const x = ((o === "ph" ? (cab.izq || {}).ph : (cab.der || {}).habs) || [])[+n.getAttribute("data-n")]; if (x && x.acc) abrir({ tipo: "act", a: x.acc.a, ds: x.acc.ds }); return; }
      let e = null;
      if (o === "ev" || o === "nota") e = item(i) || (o === "nota" ? { i: +i } : null);
      else if (o === "proxima") e = st.corto || st.sig[0] || st.turno;
      else if (o === "atras") e = st.previo;
      if (!e || e.i == null || e.i === "") return;
      /* lo rápido solo para lo que ya toca (desde una hora antes) y aún no está hecho */
      const ahora = AHORA != null ? AHORA : t, rapida = !largo && e.m && !e.h && e.a <= ahora + 1 && D.modo === "hoy";
      abrir({ tipo: "item", i: +e.i, rapida: !!rapida });
    }
    svg.addEventListener("keydown", (ev) => {
      const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[ev.key];
      if (d) { ev.preventDefault(); steer(Math.round(target * 4) / 4 + d * 0.25); return; }
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); const st = estado(t), e = st.corto || st.sig[0] || st.turno; if (e) abrir({ tipo: "item", i: +e.i, rapida: false }); }
      if (ev.key === "Escape" || ev.key === "Home") { if (lado || radio) { radio = false; girar(null); draw(0); } else vuelve(); }
    });

    /* ---------- los datos ---------- */
    function actualiza(datos) {
      D = datos || { dia: [] }; R = ruta(D);
      el.classList.toggle("cd-claro", !!D.claro);
      const nuevaHora = D.ahora != null ? clamp(D.ahora, 0, 23.99) : null;
      if (!mirando || nuevaHora == null) { AHORA = nuevaHora; if (AHORA != null) { t = target = AHORA; } }
      else AHORA = nuevaHora;
      clearInterval(vivoT);
      if (D.vivo && AHORA != null) {
        const t0 = AHORA, carga = Date.now();
        vivoT = setInterval(() => {
          const h = t0 + (Date.now() - carga) / 36e5;
          if (h >= 24) { clearInterval(vivoT); abrir({ tipo: "nuevoDia" }); return; }
          const sigue = !mirando; AHORA = h; if (sigue) { target = h; run(); }
        }, 30000);
      }
      indicadores();
      /* para el lector de pantalla y el teclado: las paradas como botones */
      R_.sr.innerHTML = (D.dia || []).filter((e) => e.b > e.a).sort((a, b) => a.a - b.a).map((e) => '<button type="button" data-i="' + e.i + '">' + hhmm(e.a) + " " + esc(cap(e.t)) + (e.h ? ", hecha" : e.m ? ", sin hacer" : "") + "</button>").join("");
      draw(0);
    }
    R_.sr.addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (b) abrir({ tipo: "item", i: +b.getAttribute("data-i"), rapida: false }); });
    return { el, actualiza, hora: () => t };
  }
  /* el ambiente a una hora (para la estación): el de lo que está en marcha, o el de lo siguiente */
  function ambienteA(D, t) {
    const it = (D.dia || []).filter((e) => e.b > e.a), n = (D.noches || []).find((x) => t >= x.a && t < x.b);
    if (n) return "bosque";
    const ya = it.filter((e) => t >= e.a && t < e.b);
    if (ya.some(esLL)) return "acantilado";
    const turno = ya.find((e) => TURNO(e.k)), gym = ya.find((e) => e.k === "gym");
    if (gym) return "deporte"; if (turno) return turno.k === "guard" ? "hospital" : "ciudad";
    const sig = it.filter((e) => e.a > t).sort((a, b) => a.a - b.a)[0];
    return sig && sig.k === "gym" && sig.a - t < 0.75 ? "deporte" : "bosque";
  }
  window.Conductor = { crea, ruta, camDe, ambienteA, luz };
})();
