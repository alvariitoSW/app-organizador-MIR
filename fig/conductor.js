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
.cd-lcd{fill:var(--cd-panel);stroke:var(--cd-panele);stroke-width:1.2}.cd-clk{fill:var(--cd-cyan);font:700 32px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-anchor:middle}
.cd-q{fill:var(--cd-ink2);font:700 11.5px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}.cd-lab{fill:var(--cd-ink3);font:800 9px ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em}
.cd-bar{fill:#1f2a3d}.cd-claro .cd-bar{fill:#dfe6ef}.cd-barf{fill:#5a78d0}.cd-barf.cd-kc{fill:#2f9e6b}.cd-barobj{stroke:#38e1ff;stroke-width:2}.cd-bv{fill:var(--cd-ink);font:700 11px ui-monospace,Menlo,monospace}
.cd-bv.cd-sin{fill:#f2a33a}
.cd-disp{fill:var(--cd-disp);stroke:var(--cd-dashe);stroke-width:1.4}.cd-nxl{fill:#b98c2c;font:800 10px ui-sans-serif,system-ui,sans-serif;letter-spacing:.14em}
.cd-nxb{fill:#ffd66b;font:800 24px ui-sans-serif,system-ui,sans-serif}.cd-nxa{fill:#e9f2ff;font:600 13.5px ui-sans-serif,system-ui,sans-serif}
.cd-wheel{stroke:var(--cd-wheel);stroke-width:22;fill:none}.cd-spoke{fill:var(--cd-wheel)}.cd-horn{fill:var(--cd-dashe)}
.cd-tkb{fill:#1b2333;stroke:#2a3448;stroke-width:1.2}.cd-tkp{fill:#f3efe4}.cd-tkt{fill:#1d2b40;font:800 11px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-note{fill:#ffe27a}.cd-notet{fill:#3a2a00;font:800 11px ui-sans-serif,system-ui,sans-serif}
.cd-chip{fill:#0d1726;stroke:#ffd66b;stroke-width:1.2}.cd-chipt{fill:#ffd66b;font:700 12px ui-sans-serif,system-ui,sans-serif;text-anchor:middle}
.cd-dimmer{fill:#000;pointer-events:none}
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
  const CX = 300, HY = 150, F = 270, EYE = 2.4, NEAR = 0.9, FAR = 260, ZSTOP = 9, GAP = 40;
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
    const no = (D.noches || []).filter((n) => n.b > n.a).map((n) => Object.assign({ dep: true }, n));
    const est = it.concat(no).sort((x, y) => x.a - y.a || (x.dep ? 1 : 0) - (y.dep ? 1 : 0));
    est.forEach((e, i) => { e.s = i * GAP; });
    /* lo que tiene algo en marcha: mientras dure, el autobús no se mueve */
    const iv = est.map((e) => [e.a, e.b]).sort((x, y) => x[0] - y[0]), union = [];
    iv.forEach((v) => { const u = union[union.length - 1]; if (u && v[0] <= u[1] + 1e-6) u[1] = Math.max(u[1], v[1]); else union.push(v.slice()); });
    const finDe = (t) => { const u = union.find((v) => t >= v[0] - 1e-6 && t <= v[1] + 1e-6); return u ? u[1] : t; };
    est.forEach((e, i) => { const sig = est[i + 1]; e.hold = sig ? Math.min(sig.a, finDe(e.a)) : finDe(e.a); });
    return { est, union };
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
  <defs><clipPath id="cdwin__ID"><path d="M44 52 Q300 40 556 52 L572 266 Q300 284 28 266 Z"/></clipPath>
    <linearGradient id="cdsky__ID" x1="0" y1="0" x2="0" y2="1"><stop data-r="sky0" offset="0" stop-color="#5aa0e0"/><stop data-r="sky1" offset="1" stop-color="#bfe0ff"/></linearGradient>
    <linearGradient id="cdbeam__ID" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff3c4" stop-opacity=".42"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></linearGradient></defs>
  <g clip-path="url(#cdwin__ID)">
    <rect x="0" y="0" width="600" height="300" fill="url(#cdsky__ID)"/>
    <g data-r="stars"></g><g data-r="scene"></g><g data-r="garage"></g>
    <g data-r="mirar" style="display:none" data-o="ahora"><rect class="cd-chip" x="214" y="232" width="172" height="26" rx="13"/><text data-r="mirart" class="cd-chipt" x="300" y="249.5"></text></g>
  </g>
  <path class="cd-frame" fill-rule="evenodd" d="M0 0H600V300H0Z M44 52 Q300 40 556 52 L572 266 Q300 284 28 266 Z"/>
  <path class="cd-seal" d="M44 52 Q300 40 556 52 L572 266 Q300 284 28 266 Z"/>
  <path class="cd-pillar" d="M0 40 L44 52 L28 266 L0 300Z"/><path class="cd-pillar" d="M600 40 L556 52 L572 266 L600 300Z"/>
  <path class="cd-visor" d="M60 50 Q150 44 236 47 L232 74 Q150 72 66 76 Z"/>
  <g data-o="atras"><rect class="cd-mirror" x="244" y="50" width="112" height="30" rx="9"/><rect class="cd-mirrorg" x="249" y="54.5" width="102" height="21" rx="6"/>
    <text data-r="mir" class="cd-mirt" x="300" y="69"></text><rect x="296" y="40" width="8" height="11" rx="2" class="cd-pillar"/></g>
  <rect class="cd-strip" x="40" y="8" width="520" height="28" rx="7"/><text class="cd-stt" x="52" y="25.5">LÍNEA DE HOY</text><g data-r="route"></g>
  <path class="cd-dashtop" d="M0 300 Q300 278 600 300 V440 H0Z"/><path class="cd-dashe" d="M0 300 Q300 278 600 300"/>
  <rect class="cd-lcd" x="34" y="306" width="232" height="88" rx="14"/>
  <text class="cd-lab" x="48" y="323">HORA</text><text data-r="clk" class="cd-clk" x="96" y="361"></text><text data-r="q" class="cd-q" x="96" y="382"></text>
  <g data-o="sueno"><rect x="152" y="310" width="110" height="38" fill="transparent"/><text class="cd-lab" x="160" y="323">SUEÑO</text>
    <rect class="cd-bar" x="160" y="328" width="96" height="7" rx="3.5"/><rect data-r="sbar" class="cd-barf" x="160" y="328" width="0" height="7" rx="3.5"/><path data-r="sobj" class="cd-barobj" d=""/>
    <text data-r="sval" class="cd-bv" x="160" y="347"></text></g>
  <g data-o="comer"><rect x="152" y="352" width="110" height="40" fill="transparent"/><text class="cd-lab" x="160" y="364">COMIDA</text>
    <rect class="cd-bar" x="160" y="369" width="96" height="7" rx="3.5"/><rect data-r="kbar" class="cd-barf cd-kc" x="160" y="369" width="0" height="7" rx="3.5"/>
    <text data-r="kval" class="cd-bv" x="160" y="388"></text></g>
  <g data-o="proxima"><rect class="cd-disp" x="278" y="306" width="290" height="88" rx="14"/>
    <text data-r="nxl" class="cd-nxl" x="294" y="326"></text><text data-r="nxb" class="cd-nxb" x="294" y="356"></text><text data-r="nxa" class="cd-nxa" x="294" y="381"></text></g>
  <g data-o="parahoy"><rect class="cd-tkb" x="452" y="404" width="124" height="34" rx="8"/><rect class="cd-tkp" x="462" y="398" width="104" height="22" rx="2"/>
    <text data-r="tk" class="cd-tkt" x="514" y="413.5"></text><circle cx="466" cy="430" r="2.4" fill="#38e1ff"/></g>
  <g data-r="nota" data-o="nota" style="display:none"><path class="cd-note" d="M300 400 L440 398 L442 434 L302 437 Z"/><text data-r="notat" class="cd-notet" x="310" y="421"></text></g>
  <circle class="cd-wheel" cx="150" cy="532" r="118"/><path class="cd-spoke" d="M50 470 Q150 444 250 470 L240 488 Q150 466 60 488Z"/><circle class="cd-horn" cx="150" cy="520" r="44"/>
  <rect data-r="dim" class="cd-dimmer" x="0" y="300" width="600" height="140" opacity="0"/>`;

  function crea(opts) {
    opts = opts || {};
    const ID = Math.random().toString(36).slice(2, 8);
    const el = document.createElement("div");
    el.className = "cd";
    if (!document.getElementById("cd-css")) { const st = document.createElement("style"); st.id = "cd-css"; st.textContent = CSS; document.head.appendChild(st); }
    el.innerHTML = '<svg viewBox="0 0 600 440" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="24" aria-label="Tu día desde el asiento del conductor. Arrastra a lo ancho o usa las flechas para mover la hora; Intro abre la próxima parada.">' + MARCO.replace(/__ID/g, ID) + "</svg>" +
      '<div class="cd-sr" data-r="sr" aria-label="Paradas de hoy"></div>';
    const svg = el.querySelector("svg"), R_ = {};
    el.querySelectorAll("[data-r]").forEach((n) => { R_[n.getAttribute("data-r")] = n; });
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    let D = null, R = null, t = 10, target = 10, AHORA = null, frame = 0, last = 0, idle = 0, vivoT = 0, visible = true, mirando = false;

    /* ---------- lo que se dibuja por el parabrisas ---------- */
    function escena(cam, L, st) {
      const out = [], noche = 1 - L.d;
      out.push('<rect class="cd-ground" x="0" y="' + HY + '" width="600" height="160"/>');
      out.push(poly([[-5.2, 0, NEAR], [3.0, 0, NEAR], [3.0, 0, FAR], [-5.2, 0, FAR]], "cd-road"));
      out.push(poly([[3.0, 0.15, NEAR], [8, 0.15, NEAR], [8, 0.15, FAR], [3.0, 0.15, FAR]], "cd-walk"));
      out.push(poly([[-11, 0.15, NEAR], [-5.2, 0.15, NEAR], [-5.2, 0.15, FAR], [-11, 0.15, FAR]], "cd-walk"));
      const tira = (x0, x1, y, cls) => poly([[x0, y, NEAR], [x1, y, NEAR], [x1, y, FAR], [x0, y, FAR]], cls);
      out.push(tira(2.96, 3.1, 0.16, "cd-kerb"), tira(-5.3, -5.16, 0.16, "cd-kerb"), tira(2.72, 2.8, 0.011, "cd-edge"), tira(-4.98, -4.9, 0.011, "cd-edge"));
      for (let w = Math.floor(cam / 3) * 3; w < cam + 120; w += 3) { const z = w - cam + 3; if (z >= NEAR) out.push(seg([3.2, 0.16, z], [8, 0.16, z], "cd-walkl", 0.03)); }
      for (let w = Math.floor(cam / 6) * 6; w < cam + FAR; w += 6) { const z0 = w - cam + 2; if (z0 + 3 >= NEAR) out.push(poly([[-1.15, 0.01, z0], [-1.0, 0.01, z0], [-1.0, 0.01, z0 + 3], [-1.15, 0.01, z0 + 3]], "cd-dash")); }
      if (noche > 0.05) out.push(poly([[-1.6, 0.01, 1.2], [1.6, 0.01, 1.2], [4, 0.01, 30], [-4, 0.01, 30]], "", ' fill="url(#cdbeam' + ID + ')" style="opacity:' + (noche * 0.55).toFixed(2) + '"'));
      /* edificios, de lejos a cerca */
      const blq = [];
      for (let j = Math.floor((cam - 20) / 13); j * 13 < cam + FAR; j++) for (const lado of [1, -1]) {
        const z0 = j * 13 - cam + 2, z1 = z0 + 10.5; if (z1 < NEAR) continue;
        blq.push({ z0, z1, h: 5 + Math.floor(hash(j * 7 + (lado > 0 ? 1 : 5)) * 11), x0: lado > 0 ? 8.4 : -11.4, x1: lado > 0 ? 15 : -18, j, lado });
      }
      blq.sort((a, b) => b.z0 - a.z0);
      const cls = ["cd-ba", "cd-bb", "cd-bc", "cd-bd"];
      for (const b of blq) {
        out.push(poly([[b.x0, 0, b.z0], [b.x0, 0, b.z1], [b.x0, b.h, b.z1], [b.x0, b.h, b.z0]], cls[Math.floor(hash(b.j * 3 + b.lado) * 4)]));
        if (b.z0 > NEAR) out.push(poly([[b.x0, 0, b.z0], [b.x1, 0, b.z0], [b.x1, b.h, b.z0], [b.x0, b.h, b.z0]], "cd-bend"));
        if (b.z0 < 70) for (let y = 1.6; y < b.h - 1.2; y += 2.8) for (let z = b.z0 + 1; z < b.z1 - 1.4; z += 2.4) {
          const on = noche > 0.3 && hash(b.j * 31 + y * 7 + z) > 0.55, x = b.x0 - 0.01 * b.lado;
          out.push(poly([[x, y, z], [x, y, z + 1.3], [x, y + 1.4, z + 1.3], [x, y + 1.4, z]], on ? "cd-wino" : "cd-win"));
        }
      }
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
      const E = R.est.filter((e) => !e.dep), n = E.length, x = (i) => 150 + (400 * (i + 0.5)) / Math.max(1, n);
      let r = n ? '<path class="cd-stripl" d="M' + x(0).toFixed(1) + " 22H" + x(n - 1).toFixed(1) + '"/>' : "";
      E.forEach((e, i) => {
        const cls = e.h ? "cd-sdone" : (e.m && e.b <= ahora && D.modo !== "futuro") ? "cd-spend" : (igual(e, nx) || esta(st.enCurso, e)) ? "cd-snext" : e.b <= t ? "cd-spast" : "cd-sdot";
        r += '<circle class="' + cls + '" cx="' + x(i).toFixed(1) + '" cy="22" r="' + (esta(st.enCurso, e) ? 5 : 3.6) + '"/>';
      });
      if (n) { const pos = E.findIndex((e) => e.s >= c.s - 1e-6), bi = pos < 0 ? n - 0.5 : clamp(pos - (E[pos].s - c.s) / GAP, -0.5, n - 0.5); r += '<path class="cd-sbus" d="M' + (x(bi) - 6).toFixed(1) + ' 15h12v7h-12z"/>'; }
      R_.route.innerHTML = r;
    }

    function indicadores() {
      const s = D.sueno;
      R_.sbar.setAttribute("width", s ? (96 * clamp(s.h / 10, 0, 1)).toFixed(1) : 0);
      R_.sobj.setAttribute("d", s && s.obj ? "M" + (160 + 96 * clamp(s.obj / 10, 0, 1)).toFixed(1) + " 325v13" : "");
      R_.sval.textContent = s ? String(Math.round(s.h * 10) / 10).replace(".", ",") + " de " + s.obj + " h" : "sin apuntar · toca";
      R_.sval.setAttribute("class", "cd-bv" + (s ? "" : " cd-sin"));
      const k = D.comida;
      R_.kbar.setAttribute("width", k && k.obj ? (96 * clamp(k.kc / k.obj, 0, 1)).toFixed(1) : 0);
      R_.kval.textContent = k ? Math.round(k.kc) + (k.obj ? "/" + Math.round(k.obj) : "") + " kcal" : "—";
      R_.tk.textContent = D.ph ? "PARA HOY · " + D.ph : "PARA HOY ✓";
      const p = (D.pendiente || [])[0];
      R_.nota.style.display = p ? "" : "none";
      if (p) { R_.notat.textContent = ("Hoy toca: " + p.txt).slice(0, 22) + " ▶"; R_.nota.setAttribute("data-i", p.i); }
    }

    function draw(dt) {
      if (!D) return false;
      const L = luz(t, D.sol || [7, 18.6]), c = camDe(R, t), st = estado(t);
      R_.sky0.setAttribute("stop-color", L.top); R_.sky1.setAttribute("stop-color", L.bot);
      R_.stars.innerHTML = L.d < 0.6 ? Array.from({ length: 26 }, (_, i) => '<circle cx="' + (40 + hash(i) * 520).toFixed(0) + '" cy="' + (52 + hash(i + 50) * 90).toFixed(0) + '" r="' + (0.6 + hash(i + 9) * 0.9).toFixed(1) + '" fill="#e9f2ff" opacity="' + ((1 - L.d) * 0.8).toFixed(2) + '"/>').join("") : "";
      R_.scene.innerHTML = escena(c.s, L, st);
      /* la cochera: parada en una noche o siesta, con la persiana bajada; al salir sube y te alejas;
         al llegar a la siguiente, se funde */
      let g = "";
      const E = R.est, e = E[c.k], q = c.sig != null ? E[c.sig] : null;
      if (e && e.dep && c.parado) g = cochera(0, t >= e.b - 0.02 ? 1 : 0, L.d);
      else if (e && e.dep && !c.parado) g = cochera(c.s - e.s, clamp(c.p / 0.3, 0, 1), L.d);
      else if (q && q.dep && !c.parado && c.p > 0.85) g = '<g style="opacity:' + clamp((c.p - 0.85) / 0.15, 0, 1).toFixed(2) + '">' + cochera(0, 1, L.d) + "</g>";
      R_.garage.innerHTML = g;
      /* de guardia, la cabina en penumbra */
      R_.dim.setAttribute("opacity", st.guardia && L.d < 0.5 ? 0.32 : 0);
      salpicadero(st, c);
      R_.mirar.style.display = mirando ? "" : "none";
      if (mirando) R_.mirart.textContent = "viendo las " + hhmm(t) + " · volver ⟲";
      svg.setAttribute("aria-valuenow", String(Math.round(t * 100) / 100));
      svg.setAttribute("aria-valuetext", hhmm(t) + " · " + (st.noche ? "en la cochera" : (st.corto || st.turno) ? cap((st.corto || st.turno).t) + " hasta las " + hhmm((st.corto || st.turno).b) : "libre"));
      return false;
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
      if (o === "sueno") return abrir({ tipo: D.sueno ? "sueno" : "anotar" });
      if (o === "comer") return abrir({ tipo: "comer" });
      if (o === "parahoy") return abrir({ tipo: "parahoy" });
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
      if (ev.key === "Escape" || ev.key === "Home") vuelve();
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
  window.Conductor = { crea, ruta, camDe };
})();
