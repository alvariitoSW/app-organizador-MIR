/* Maquetas de «Notas». Misma piel que el resto: _base.css está copiado de styles.css de la app. */
import {readFileSync} from 'node:fs';
const CSS = readFileSync('../_base.css', 'utf8');

const ICO = {
  mas:'<path d="M12 5v14M5 12h14"/>',
  atras:'<path d="M15 5l-7 7 7 7"/>',
  chevron:'<path d="M9 5l7 7-7 7"/>',
  lupa:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  lapiz:'<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>',
  nota:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3h8L19 7.5V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19z"/><path d="M14 3v5h5M8.5 12h7M8.5 16h4"/>',
  calendario:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  campana:'<path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5z"/><path d="M13.7 19a2 2 0 0 1-3.4 0"/>',
  papelera:'<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 13h9.4l.8-13"/>',
  check:'<path d="M4.5 12.5l5 5 10-11"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const svg = (n, cls='ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n]}</svg>`;

const cab = (activa='☰ Más') => `
<header>
  <div class="hwrap">
    <h1><svg viewBox="0 0 24 24" fill="none" stroke="#38e1ff" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;flex:none"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>Guardias · rotación y cocina</h1>
    <nav>${['Calendario','Entreno','Compra','☰ Más'].map(t=>`<button class="${t===activa?'on':''}">${t}</button>`).join('')}</nav>
  </div>
</header>`;

const sub = (titulo, volver='Notas', extra='') => `
<div class="subcab">
  <button class="btn s volver">${svg('atras','ico sm')} ${volver}</button>
  <h2 class="subtit">${titulo}</h2>${extra}
</div>`;

const EXTRA = `
/* --- notas --- */
/* un h2 dentro de una tarjeta pero no hijo directo se quedaba a tamaño de navegador (2 em):
   en «Notas de este día» se veía el doble de grande que «Eventos», justo al lado */
.card h2{font-size:14px;margin:0 0 6px;letter-spacing:.03em;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-weight:800}
.card h2::before{content:'';width:3px;height:15px;border-radius:2px;flex:none;
  background:linear-gradient(#38e1ff,#7c5cff);box-shadow:0 0 12px color-mix(in srgb,#38e1ff 70%,transparent)}
.card .subcab h2::before{display:none}
.captura{border:1px solid color-mix(in srgb,#38e1ff 35%,#1e2b44);border-radius:14px;padding:11px 12px;
  background:color-mix(in srgb,#38e1ff 7%,#111a2b)}
.captura .txt{color:#8fa6c6;font-size:13.5px;min-height:42px;line-height:1.45}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.chipx{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:7px 12px;border-radius:999px;
  border:1px solid #1e2b44;background:color-mix(in srgb,#070b14 42%,#111a2b);color:#e9f2ff;min-height:36px}
.chipx.on{border-color:color-mix(in srgb,#38e1ff 55%,#1e2b44);color:#38e1ff;background:color-mix(in srgb,#38e1ff 12%,#111a2b)}
.nota{display:flex;gap:10px;align-items:flex-start;padding:11px 0;border-top:1px dashed #1e2b44}
.nota:first-of-type{border-top:0}
.nota .tick{width:22px;height:22px;flex:none;border-radius:7px;border:1.5px solid #1e2b44;margin-top:1px;
  display:flex;align-items:center;justify-content:center;color:transparent}
.nota.hecha .tick{border-color:color-mix(in srgb,#34d399 60%,#1e2b44);color:#34d399;background:color-mix(in srgb,#34d399 12%,transparent)}
.nota .cuerpo{flex:1;min-width:0}
.nota .t{font-size:13.5px;line-height:1.45;margin:0}
.nota.hecha .t{color:#8fa6c6;text-decoration:line-through}
.nota .pies{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.pie{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:999px;
  border:1px solid #1e2b44;color:#8fa6c6;white-space:nowrap}
.pie.dia{border-color:color-mix(in srgb,#38e1ff 40%,#1e2b44);color:color-mix(in srgb,#38e1ff 80%,#e9f2ff)}
.pie.hoy{border-color:color-mix(in srgb,#fbbf24 45%,#1e2b44);color:color-mix(in srgb,#fbbf24 85%,#e9f2ff)}
.pie.ev{border-color:color-mix(in srgb,#34d399 40%,#1e2b44);color:color-mix(in srgb,#34d399 80%,#e9f2ff)}
.pie .ico{width:12px;height:12px;stroke-width:2.2}
.franja{width:3px;border-radius:2px;flex:none;align-self:stretch;min-height:34px}
.editor{border:1px solid #1e2b44;border-radius:13px;padding:12px;background:color-mix(in srgb,#070b14 42%,#111a2b);
  font-size:14.5px;line-height:1.55;min-height:120px}
.fld{display:flex;flex-direction:column;gap:4px;font-size:10.5px;font-weight:800;color:#8fa6c6;
  text-transform:uppercase;letter-spacing:.05em;min-width:0}
.fld .campo{border:1px solid #1e2b44;border-radius:10px;padding:9px 11px;background:color-mix(in srgb,#070b14 55%,#111a2b);
  color:#e9f2ff;font-size:13.5px;font-weight:600;text-transform:none;letter-spacing:0}
.fld .campo.gris{color:#8fa6c6;font-weight:400}
.acciones{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}
.acc{display:flex;align-items:center;gap:8px;padding:12px 11px;border-radius:12px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 42%,#111a2b);color:#e9f2ff;font-size:12.5px;font-weight:700;min-height:52px}
.acc.p{border-color:color-mix(in srgb,#38e1ff 50%,#1e2b44);background:color-mix(in srgb,#38e1ff 11%,#111a2b)}
.acc.mala{border-color:color-mix(in srgb,#fb7185 35%,#1e2b44);color:color-mix(in srgb,#fb7185 85%,#e9f2ff)}
.acc .ico{width:19px;height:19px;flex:none;color:#8fa6c6}
.acc.p .ico{color:#38e1ff}
.big{width:100%;justify-content:center;min-height:46px;font-size:14px;display:flex;align-items:center;gap:8px}
/* la cuadrícula del mes, tal cual está en la app */
.mgrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;margin-top:8px}
.mdow{font-size:9.5px;font-weight:800;color:#8fa6c6;text-align:center;text-transform:uppercase;letter-spacing:.05em}
.dbox{min-height:114px;border:1px solid #1e2b44;border-radius:9px;padding:4px 3px;display:flex;flex-direction:column;gap:2px;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.dbox.hoy{border-color:color-mix(in srgb,#38e1ff 55%,#1e2b44);background:color-mix(in srgb,#38e1ff 10%,#111a2b)}
.dnum{font-size:11px;font-weight:800}
.dnm{font-size:8.5px;color:#8fa6c6;line-height:1.15}
.dmarcas{display:flex;gap:2px;flex-wrap:wrap;margin-top:auto;align-items:center}
.dpt{width:5px;height:5px;border-radius:999px;display:block}
.dnota{font-size:9px}
.evrow{display:flex;align-items:center;gap:9px;padding:9px 0;border-top:1px dashed #1e2b44}
.evrow:first-of-type{border-top:0}
.evdot{width:8px;height:8px;border-radius:999px;flex:none}
.evrow .nm{flex:1;min-width:0;font-size:13px;font-weight:700}
.evrow .hr{font-size:11.5px;font-weight:800;color:#8fa6c6}
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

const nota = (txt, pies, hecha=false, color='#38e1ff') => `
<div class="nota${hecha?' hecha':''}">
  <span class="tick">${svg('check','ico sm')}</span>
  <span class="franja" style="background:${color}"></span>
  <div class="cuerpo"><p class="t">${txt}</p>
    <div class="pies">${pies.join('')}</div></div>
</div>`;
const pie = (t, cls='') => `<span class="pie ${cls}">${t}</span>`;

export {ICO, svg, cab, sub, pagina, nota, pie};
