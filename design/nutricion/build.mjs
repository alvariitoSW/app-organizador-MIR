/* Maquetas de la app de nutrición dentro de la app. La piel sale de _base.css (copiada de la app). */
import {readFileSync, writeFileSync} from 'node:fs';
const CSS = readFileSync('_base.css', 'utf8');

const ICO = {
  mas:'<path d="M12 5v14M5 12h14"/>',
  atras:'<path d="M15 5l-7 7 7 7"/>',
  chevron:'<path d="M9 5l7 7-7 7"/>',
  lupa:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  camara:'<path d="M3 8.5A2 2 0 0 1 5 6.5h2l1.5-2h7L17 6.5h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
  libro:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
  lapiz:'<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>',
  olla:'<path d="M4 9h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 9h20M8 9V6M16 9V6"/>',
  chispa:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  nevera:'<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M6 9.5h12M9.2 5.5v2M9.2 12v2.5"/>',
  hoja:'<path d="M20 4c0 9-6 14-13 14 0-9 5-14 13-14z"/><path d="M4 20c3-4 6-6 10-8"/>',
  manzana:'<path d="M12 7.5c2-3 6-2.5 7 .5 1.5 4.5-2 12-4.5 12-1.2 0-1.6-.7-2.5-.7s-1.3.7-2.5.7C7 20 3.5 12.5 5 8c1-3 5-3.5 7-.5z"/><path d="M12 7.5V4.5M12 4.5c1.5 0 2.5-1 2.5-2"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const svg = (n, cls='ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n]}</svg>`;

const cab = () => `
<header>
  <div class="hwrap">
    <h1><svg viewBox="0 0 24 24" fill="none" stroke="#38e1ff" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;flex:none"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>Guardias · rotación y cocina</h1>
    <nav>${['Calendario','Entreno','Compra','☰ Más'].map(t=>`<button class="${t==='☰ Más'?'on':''}">${t}</button>`).join('')}</nav>
  </div>
</header>`;

const sub = (titulo, volver='Comida', extra='') => `
<div class="subcab">
  <button class="btn s volver">${svg('atras','ico sm')} ${volver}</button>
  <h2 class="subtit">${titulo}</h2>${extra}
</div>`;

const EXTRA = `
/* --- nutrición --- */
.micros{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:10px}
.mic{border:1px solid #1e2b44;border-radius:10px;padding:7px 9px;background:color-mix(in srgb,#070b14 42%,#111a2b)}
.mic .mn{display:block;font-size:10px;color:#8fa6c6;font-weight:800;text-transform:uppercase;letter-spacing:.04em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mic .mv{display:block;color:#e9f2ff;font-size:12.5px;font-weight:800;white-space:nowrap;margin-top:1px}
.micbar{height:5px;border-radius:999px;background:color-mix(in srgb,#111a2b 60%,#070b14);border:1px solid #1e2b44;overflow:hidden;margin-top:5px}
.micbar i{display:block;height:100%;background:linear-gradient(90deg,#34d399,#a3e635)}
.micbar i.bajo{background:linear-gradient(90deg,#fbbf24,#fb7185)}
.micbar i.alto{background:linear-gradient(90deg,#38e1ff,#7c5cff)}
.falta{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.falta .tag{background:color-mix(in srgb,#fbbf24 16%,transparent);color:color-mix(in srgb,#fbbf24 85%,#e9f2ff);border-color:color-mix(in srgb,#fbbf24 30%,transparent)}
.alim{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px dashed #1e2b44;width:100%;text-align:left;background:none;border-left:0;border-right:0;border-bottom:0;color:#e9f2ff;font:inherit;cursor:pointer}
.alim:first-of-type{border-top:0}
.alim .em{font-size:22px;flex:none;line-height:1}
.alim .nm{flex:1;min-width:0}
.alim .nm b{display:block;font-size:13.5px}
.alim .kc{font-size:12px;font-weight:800;color:#8fa6c6;white-space:nowrap}
.fuente{font-size:10px;color:#8fa6c6;display:inline-flex;align-items:center;gap:4px;
  border:1px solid #1e2b44;border-radius:999px;padding:2px 8px}
.fuente.usda{border-color:color-mix(in srgb,#34d399 40%,#1e2b44);color:color-mix(in srgb,#34d399 80%,#e9f2ff)}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.chipx{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:5px 10px;border-radius:999px;
  border:1px solid #1e2b44;background:color-mix(in srgb,#070b14 42%,#111a2b);color:#e9f2ff}
.chipx button{background:none;border:0;color:#8fa6c6;font:inherit;cursor:pointer;padding:0 0 0 2px}
.idea{border:1px solid #1e2b44;border-radius:13px;padding:11px 12px;margin-top:9px;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.idea.buena{border-color:color-mix(in srgb,#34d399 45%,#1e2b44);background:color-mix(in srgb,#34d399 8%,#111a2b)}
.idea h4{margin:0 0 3px;font-size:14px;display:flex;align-items:center;gap:7px}
.idea .por{font-size:11.5px;color:#8fa6c6;margin:0}
.ingr{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px dashed #1e2b44;font-size:13px}
.ingr:first-of-type{border-top:0}
.ingr b{font-weight:800;white-space:nowrap}
.tot{display:flex;gap:8px;margin-top:10px}
.tot div{flex:1;min-width:0;border:1px solid #1e2b44;border-radius:10px;padding:6px 8px;text-align:center;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.tot b{display:block;font-size:15px;font-weight:800;letter-spacing:-.02em}
.tot span{font-size:8.5px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.04em}
.tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}
.tile{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;text-align:left;font:inherit;color:#e9f2ff;
  cursor:pointer;padding:12px 11px;border-radius:14px;min-height:92px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.tile .ico{color:#8fa6c6;margin-bottom:4px}
.tile b{font-size:13.5px;line-height:1.2}
.tile .n{font-size:13px;font-weight:800;color:#38e1ff}
.tile .s{font-size:10.5px;color:#8fa6c6}
.ringrow{display:flex;align-items:center;gap:14px}
.ring{position:relative;width:104px;height:104px;flex:none}
.ring svg{transform:rotate(-90deg)}
.ringnum{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ringnum b{font-size:24px;font-weight:800;line-height:1;letter-spacing:-.02em}
.ringnum span{font-size:9px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.06em}
.macros{flex:1;min-width:0;display:flex;flex-direction:column;gap:9px}
.macro .mt{display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;margin-bottom:3px}
.macro .mt span{color:#8fa6c6}
.mbar{height:7px;border-radius:999px;background:color-mix(in srgb,#111a2b 60%,#070b14);border:1px solid #1e2b44;overflow:hidden}
.mbar i{display:block;height:100%}
.mbar i.p{background:linear-gradient(90deg,#38e1ff,#7c5cff)}
.mbar i.c{background:linear-gradient(90deg,#fbbf24,#f59e0b)}
.mbar i.g{background:linear-gradient(90deg,#34d399,#a3e635)}
.buscador{display:flex;align-items:center;gap:8px;padding:11px 12px;border-radius:12px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 55%,#111a2b);color:#8fa6c6;font-size:13.5px;margin-top:11px}
.modos{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:10px}
.modo{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 4px;border-radius:11px;font:inherit;
  border:1px solid #1e2b44;background:color-mix(in srgb,#070b14 42%,#111a2b);color:#8fa6c6;cursor:pointer;min-height:60px}
.modo.on{border-color:color-mix(in srgb,#38e1ff 55%,#1e2b44);color:#e9f2ff;background:color-mix(in srgb,#38e1ff 12%,#111a2b)}
.modo span{font-size:10px;font-weight:700;text-align:center;line-height:1.15}
.big{width:100%;justify-content:center;min-height:46px;font-size:14px;display:flex;align-items:center;gap:8px}
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

const ring = (pct, num, lab) => {
  const r=46, c=2*Math.PI*r, off=c*(1-Math.min(1,pct));
  return `<div class="ring">
    <svg width="104" height="104" viewBox="0 0 104 104">
      <circle cx="52" cy="52" r="${r}" fill="none" stroke="#1e2b44" stroke-width="9"/>
      <circle cx="52" cy="52" r="${r}" fill="none" stroke="url(#g)" stroke-width="9" stroke-linecap="round"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"/>
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#38e1ff"/><stop offset="1" stop-color="#7c5cff"/></linearGradient></defs>
    </svg>
    <div class="ringnum"><b>${num}</b><span>${lab}</span></div>
  </div>`;
};
const macro = (nm,val,pct,cls)=>`<div class="macro"><div class="mt"><span>${nm}</span><b>${val}</b></div>
  <div class="mbar"><i class="${cls}" style="width:${pct}%"></i></div></div>`;
const mic = (nm,val,pct)=>`<div class="mic"><span class="mn">${nm}</span><span class="mv">${val}</span>
  <div class="micbar"><i class="${pct<50?'bajo':(pct>=100?'alto':'')}" style="width:${Math.min(100,pct)}%"></i></div></div>`;

export {ICO,svg,cab,sub,pagina,ring,macro,mic};
