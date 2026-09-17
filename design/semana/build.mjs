/* Maquetas del rediseño de Semana. La piel sale de ../_base.css, copiada de styles.css de la app. */
import {readFileSync} from 'node:fs';
const CSS = readFileSync('../_base.css', 'utf8');

const ICO = {
  mas:'<path d="M12 5v14M5 12h14"/>',
  atras:'<path d="M15 5l-7 7 7 7"/>',
  chevron:'<path d="M9 5l7 7-7 7"/>',
  sol:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/>',
  luna:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  amanecer:'<path d="M3 19h18M6.5 19a5.5 5.5 0 0 1 11 0"/><path d="M12 3v3.5M4.8 8.3l2 2M19.2 8.3l-2 2"/><path d="M9 15.5l3-3 3 3"/>',
  ocaso:'<path d="M3 19h18M6.5 19a5.5 5.5 0 0 1 11 0"/><path d="M12 9.5V6M4.8 8.3l2 2M19.2 8.3l-2 2"/><path d="M9 6.5l3 3 3-3"/>',
  sitio:'<path d="M12 21.5s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10.3" r="2.6"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  ajuste:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4L5.3 5.3"/>',
  olla:'<path d="M4 9h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 9h20M8 9V6M16 9V6"/>',
  nota:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3h8L19 7.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19z"/><path d="M14 3v5h5M8.5 12h7M8.5 16h4"/>',
  cama:'<path d="M3 18v-7h13a4 4 0 0 1 4 4v3M3 18h18M3 13V7"/><circle cx="7.5" cy="9.5" r="1.8"/>',
};
const svg = (n, cls='ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n]}</svg>`;

const cab = (activa='Calendario', rango='14 – 20 sep', modos=['Mes','Semana','Hoy'], modoOn='Semana') => `
<header>
  <div class="hwrap">
    <h1><svg viewBox="0 0 24 24" fill="none" stroke="#38e1ff" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;flex:none"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>Guardias · rotación y cocina</h1>
    <nav>${['Calendario','Entreno','Compra','☰ Más'].map(t=>`<button class="${t===activa?'on':''}">${t}</button>`).join('')}</nav>
    <div class="modos">
      <button class="wk">‹</button>
      <b class="rango">${rango}</b>
      <button class="wk">›</button>
      <span class="sp"></span>
      ${modos.map(t=>`<button class="md ${t===modoOn?'on':''}">${t}</button>`).join('')}
    </div>
  </div>
</header>`;

const EXTRA = `
/* --- cabecera con los tres modos --- */
.modos{display:flex;align-items:center;gap:6px;padding:0 0 10px}
.modos .wk{appearance:none;border:1px solid #1e2b44;background:color-mix(in srgb,#111a2b 62%,#070b14);color:#e9f2ff;
  width:28px;height:28px;border-radius:9px;font:inherit;font-weight:800;cursor:pointer;line-height:1}
.modos .rango{font-size:12.5px;font-weight:800;letter-spacing:.02em}
.modos .md{appearance:none;border:1px solid #1e2b44;background:none;color:#8fa6c6;font:inherit;font-weight:700;font-size:11.5px;
  padding:5px 10px;border-radius:999px;cursor:pointer}
.modos .md.on{color:#04121c;background:linear-gradient(94deg,#38e1ff,color-mix(in srgb,#7c5cff 70%,#38e1ff));border-color:transparent}
.sp{flex:1}
/* --- la fila de un día --- */
.dia{position:relative;border:1px solid #1e2b44;border-left:3px solid color-mix(in srgb,#38e1ff 26%,#1e2b44);
  border-radius:13px;padding:9px 11px 10px;background:color-mix(in srgb,#111a2b 86%,transparent)}
.dia+.dia{margin-top:8px}
.dia.hoy{border-color:color-mix(in srgb,#38e1ff 55%,#1e2b44);border-left:3px solid #38e1ff;
  background:color-mix(in srgb,#38e1ff 10%,#111a2b);
  box-shadow:0 0 0 1px color-mix(in srgb,#38e1ff 26%,transparent),0 14px 34px -20px color-mix(in srgb,#38e1ff 60%,transparent)}
.dia.finde{border-left-color:color-mix(in srgb,#34d399 35%,#1e2b44)}
.dcab{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.dnum{font-size:15px;font-weight:800;letter-spacing:-.01em}
.dnum small{font-size:10.5px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.06em;margin-right:5px}
.dturno{font-size:12.5px;font-weight:700}
.hoychip{font-size:9.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;padding:2px 8px;border-radius:999px;
  background:linear-gradient(94deg,#38e1ff,color-mix(in srgb,#7c5cff 70%,#38e1ff));color:#04121c}
.dkc{font-size:11px;font-weight:800;color:#8fa6c6;margin-left:auto;white-space:nowrap}
/* franja de 24 h con la noche sombreada y el sol marcado */
.franja{position:relative;height:26px;border-radius:7px;overflow:hidden;margin-top:8px;border:1px solid #1e2b44;
  background:#05080f}   /* de base, noche: lo que se pinta encima es la luz */
.luz{position:absolute;top:0;bottom:0;
  background:linear-gradient(90deg,
    color-mix(in srgb,#fbbf24 22%,transparent),
    color-mix(in srgb,#fbbf24 9%,transparent) 22%,
    color-mix(in srgb,#fbbf24 9%,transparent) 78%,
    color-mix(in srgb,#fb7185 20%,transparent));
  border-left:1px solid color-mix(in srgb,#fbbf24 55%,transparent);
  border-right:1px solid color-mix(in srgb,#fb7185 55%,transparent)}
.bloque{position:absolute;top:5px;height:16px;border-radius:4px;opacity:.92}
.ahora{position:absolute;top:-3px;bottom:-3px;width:2px;background:#fb7185;box-shadow:0 0 10px #fb7185;z-index:3}
.ahora::before{content:'';position:absolute;top:-1px;left:-3px;width:8px;height:8px;border-radius:999px;background:#fb7185;
  box-shadow:0 0 10px #fb7185}
.horas{display:flex;justify-content:space-between;font-size:8.5px;font-weight:800;color:#8fa6c6;margin-top:3px;letter-spacing:.04em}
.dpies{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px;align-items:center}
.pie{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:#8fa6c6;white-space:nowrap}
.pie .ico{width:13px;height:13px;stroke-width:2.2;flex:none}
.pie.sol{color:color-mix(in srgb,#fbbf24 85%,#e9f2ff)}
.pie.ev{color:color-mix(in srgb,#38e1ff 80%,#e9f2ff)}
.pie.nt{color:color-mix(in srgb,#7c5cff 80%,#e9f2ff)}
/* --- resumen compacto --- */
.res{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
.res div{border:1px solid #1e2b44;border-radius:11px;padding:8px 9px;background:color-mix(in srgb,#070b14 42%,#111a2b)}
.res b{display:block;font-size:17px;font-weight:800;letter-spacing:-.02em;line-height:1.15}
.res span{font-size:8.5px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.03em;
  display:block;line-height:1.25}
.res div{display:flex;flex-direction:column;justify-content:center}
/* --- sol --- */
.solhero{display:flex;align-items:center;gap:14px}
.arco{position:relative;flex:none;width:140px;height:78px}
.solnum{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px}
.solfila{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700}
.solfila .ico{width:18px;height:18px;flex:none;color:#fbbf24}
.solfila b{margin-left:auto;font-size:14px;font-weight:800}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
.chipx{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:7px 12px;border-radius:999px;
  border:1px solid #1e2b44;background:color-mix(in srgb,#070b14 42%,#111a2b);color:#e9f2ff;min-height:36px}
.chipx.on{border-color:color-mix(in srgb,#38e1ff 55%,#1e2b44);color:#38e1ff;background:color-mix(in srgb,#38e1ff 12%,#111a2b)}
.fld{display:flex;flex-direction:column;gap:4px;font-size:10.5px;font-weight:800;color:#8fa6c6;
  text-transform:uppercase;letter-spacing:.05em;min-width:0}
.fld .campo{border:1px solid #1e2b44;border-radius:10px;padding:9px 11px;background:color-mix(in srgb,#070b14 55%,#111a2b);
  color:#e9f2ff;font-size:13.5px;font-weight:600;text-transform:none;letter-spacing:0}
.big{width:100%;justify-content:center;min-height:46px;font-size:14px;display:flex;align-items:center;gap:8px}
/* --- detalle de un día abierto --- */
.comida{display:flex;gap:9px;padding:8px 0;border-top:1px dashed #1e2b44;font-size:12.5px}
.comida:first-of-type{border-top:0}
.comida .h{font-size:11px;font-weight:800;color:#8fa6c6;width:38px;flex:none}
.comida .q{flex:1;min-width:0}
.comida .q b{display:block;font-size:12.5px;font-weight:700}
.comida .q span{font-size:11px;color:#8fa6c6}
/* --- dónde se marca hoy --- */
.demo{border:1px solid #1e2b44;border-radius:12px;padding:11px;background:color-mix(in srgb,#070b14 42%,#111a2b);margin-top:9px}
.demo .et{font-size:10px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;display:block}
.mgrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
.dbox{min-height:58px;border:1px solid #1e2b44;border-radius:8px;padding:4px 3px;background:color-mix(in srgb,#070b14 42%,#111a2b);
  font-size:10px;font-weight:800}
.dbox.hoy{border-color:#38e1ff;background:color-mix(in srgb,#38e1ff 14%,#111a2b);
  box-shadow:0 0 0 1px color-mix(in srgb,#38e1ff 40%,transparent)}
.dbox .pt{display:block;font-size:8px;color:#8fa6c6;font-weight:700}
`;

const pagina = (cuerpo) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
${CSS}${EXTRA}  </style>
</helmet>
<div class="scr">
  <div class="bgfx"></div>
  <div class="gridfx"></div>
${cuerpo}
</div>
</x-dc>
</body>
</html>
`;

/* una franja de 24 h: noche sombreada a los lados, bloques de actividad y, si es hoy, la marca de ahora */
const pct = (h) => (h / 24 * 100).toFixed(2) + '%';
const franja = ({sale, pone, bloques = [], ahora = null}) => `
<div class="franja">
  <span class="luz" style="left:${pct(sale)};width:${pct(pone-sale)}"></span>
  ${bloques.map(b=>`<span class="bloque" style="left:${pct(b.de)};width:${pct(b.a-b.de)};background:${b.color}"></span>`).join('')}
  ${ahora!=null?`<span class="ahora" style="left:${pct(ahora)}"></span>`:''}
</div>
<div class="horas"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span></div>`;

const pie = (icono, txt, cls='') => `<span class="pie ${cls}">${svg(icono,'ico')}${txt}</span>`;

export {ICO, svg, cab, pagina, franja, pie, EXTRA};
