/* Maquetas del rediseño de Comida. La piel sale de ../_base.css, copiada de styles.css de la app. */
import {readFileSync} from 'node:fs';
const CSS = readFileSync('../_base.css', 'utf8');

const ICO = {
  mas:'<path d="M12 5v14M5 12h14"/>',
  atras:'<path d="M15 5l-7 7 7 7"/>',
  chevron:'<path d="M9 5l7 7-7 7"/>',
  lupa:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  camara:'<path d="M3 8.5A2 2 0 0 1 5 6.5h2l1.5-2h7L17 6.5h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
  lapiz:'<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>',
  olla:'<path d="M4 9h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 9h20M8 9V6M16 9V6"/>',
  nevera:'<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M6 9.5h12M9.2 5.5v2M9.2 12v2.5"/>',
  chispa:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  pastilla:'<circle cx="12" cy="12" r="9"/><path d="M8.5 12h7M12 8.5v7"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  libro:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
  equis:'<path d="M6 6l12 12M18 6L6 18"/>',
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
/* --- la barra de buscar, que es LA puerta de todo --- */
.buscaz{display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:14px;
  border:1px solid color-mix(in srgb,#38e1ff 40%,#1e2b44);background:color-mix(in srgb,#38e1ff 9%,#111a2b);
  color:#8fa6c6;font-size:14.5px;font-weight:600;min-height:52px}
.buscaz .ico{color:#38e1ff;flex:none}
.buscaz b{color:#e9f2ff;font-weight:800}
.buscaz .kbd{margin-left:auto;font-size:10.5px;font-weight:800;color:#8fa6c6;border:1px solid #1e2b44;
  border-radius:7px;padding:3px 7px;white-space:nowrap}
.campo{display:flex;align-items:center;gap:10px;padding:13px 14px;border-radius:14px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 55%,#111a2b);color:#e9f2ff;font-size:15px;min-height:52px}
.campo .cur{width:1.5px;height:19px;background:#38e1ff;display:inline-block;margin-left:-6px}
.campo .ico{color:#8fa6c6;flex:none}
/* --- resultados --- */
.grp{font-size:9.5px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.07em;
  margin:13px 0 2px;display:flex;align-items:center;gap:7px}
.grp::after{content:'';flex:1;height:1px;background:#1e2b44}
.hit{display:flex;align-items:center;gap:11px;padding:10px 0;border-top:1px dashed #1e2b44;width:100%;text-align:left;
  background:none;border-left:0;border-right:0;border-bottom:0;color:#e9f2ff;font:inherit;min-height:56px}
.hit:first-of-type{border-top:0}
.hit .em{font-size:23px;flex:none;line-height:1;width:26px;text-align:center}
.hit .nm{flex:1;min-width:0}
.hit .nm b{display:block;font-size:14px;line-height:1.25}
.hit .nm span{font-size:11px;color:#8fa6c6}
.hit .kc{font-size:12px;font-weight:800;color:#8fa6c6;white-space:nowrap;text-align:right}
.hit .kc small{display:block;font-size:9.5px;font-weight:700;opacity:.8}
.hit .add{width:34px;height:34px;flex:none;border-radius:11px;border:1px solid color-mix(in srgb,#38e1ff 45%,#1e2b44);
  background:color-mix(in srgb,#38e1ff 14%,transparent);color:#38e1ff;display:flex;align-items:center;justify-content:center}
.hit .add .ico{width:18px;height:18px;stroke-width:2.4}
/* --- la hoja de cantidad --- */
.hoja{position:relative;border:1px solid color-mix(in srgb,#38e1ff 35%,#1e2b44);border-radius:18px;padding:15px 14px;
  background:linear-gradient(180deg,color-mix(in srgb,#38e1ff 10%,#111a2b),#111a2b)}
.hoja .tira{width:38px;height:4px;border-radius:99px;background:#1e2b44;margin:0 auto 12px}
.pasos{display:flex;align-items:center;gap:12px;justify-content:center;margin:12px 0 4px}
.pasos button{width:46px;height:46px;border-radius:14px;border:1px solid #1e2b44;background:color-mix(in srgb,#070b14 45%,#111a2b);
  color:#e9f2ff;font:inherit;font-size:22px;font-weight:800;line-height:1}
.pasos .val{min-width:104px;text-align:center}
.pasos .val b{display:block;font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1}
.pasos .val span{font-size:10.5px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.06em}
.rac{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px}
.rac span{font-size:12px;font-weight:700;padding:7px 12px;border-radius:999px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 42%,#111a2b);min-height:36px;display:inline-flex;align-items:center}
.rac span.on{border-color:color-mix(in srgb,#38e1ff 55%,#1e2b44);color:#38e1ff;background:color-mix(in srgb,#38e1ff 12%,#111a2b)}
.previa{display:flex;gap:8px;margin-top:13px}
.previa div{flex:1;border:1px solid #1e2b44;border-radius:11px;padding:8px 6px;text-align:center;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.previa b{display:block;font-size:17px;font-weight:800;letter-spacing:-.02em}
.previa span{font-size:8.5px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.04em}
/* --- resumen del día --- */
.ringrow{display:flex;align-items:center;gap:14px}
.ring{position:relative;width:104px;height:104px;flex:none}
.ring svg{transform:rotate(-90deg)}
.ringnum{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ringnum b{font-size:25px;font-weight:800;line-height:1;letter-spacing:-.02em}
.ringnum span{font-size:9px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.06em}
.macros{flex:1;min-width:0;display:flex;flex-direction:column;gap:9px}
.macro .mt{display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;margin-bottom:3px}
.macro .mt span{color:#8fa6c6}
.mbar{height:7px;border-radius:999px;background:color-mix(in srgb,#111a2b 60%,#070b14);border:1px solid #1e2b44;overflow:hidden}
.mbar i{display:block;height:100%}
.mbar i.p{background:linear-gradient(90deg,#38e1ff,#7c5cff)}
.mbar i.c{background:linear-gradient(90deg,#fbbf24,#f59e0b)}
.mbar i.g{background:linear-gradient(90deg,#34d399,#a3e635)}
/* una línea para los micros, en vez de nueve casillas en la portada */
.microlinea{display:flex;align-items:center;gap:9px;padding:11px 12px;border-radius:12px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 42%,#111a2b);margin-top:11px;width:100%;text-align:left;color:#e9f2ff;font:inherit}
.microlinea .pts{display:flex;gap:3px;flex:none}
.microlinea .pts i{width:7px;height:7px;border-radius:99px;display:block}
.microlinea .tx{flex:1;min-width:0;font-size:12.5px;font-weight:700}
.microlinea .tx small{display:block;font-size:10.5px;font-weight:400;color:#8fa6c6}
/* --- registro del día --- */
.mom{font-size:9.5px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.07em;margin:12px 0 1px}
.toma{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px dashed #1e2b44}
.toma:first-of-type{border-top:0}
.toma .em{font-size:19px;flex:none}
.toma .nm{flex:1;min-width:0}
.toma .nm b{display:block;font-size:13px}
.toma .nm span{font-size:10.5px;color:#8fa6c6}
.toma .kc{font-size:12px;font-weight:800;white-space:nowrap}
/* --- tira de la semana --- */
.sem{display:flex;gap:5px;margin-top:10px;align-items:flex-end}
.semd{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.semb{width:100%;height:52px;border-radius:6px;background:color-mix(in srgb,#111a2b 60%,#070b14);border:1px solid #1e2b44;
  display:flex;align-items:flex-end;overflow:hidden}
.semb i{display:block;width:100%;background:linear-gradient(180deg,#38e1ff,#7c5cff)}
.semd span{font-size:9.5px;font-weight:800;color:#8fa6c6}
.semd.hoy span{color:#38e1ff}
/* --- puertas --- */
.puertas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:12px}
.puerta{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;text-align:left;font:inherit;color:#e9f2ff;
  padding:12px 10px;border-radius:14px;min-height:88px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.puerta .ico{color:#8fa6c6;margin-bottom:4px}
.puerta b{font-size:12.5px;line-height:1.2}
.puerta .s{font-size:10px;color:#8fa6c6}
/* --- pestañas dentro de una pantalla --- */
.pest{display:flex;gap:6px;margin-bottom:11px;border-bottom:1px solid #1e2b44;padding-bottom:9px}
.pest span{font-size:12.5px;font-weight:700;padding:7px 12px;border-radius:999px;border:1px solid #1e2b44;color:#8fa6c6;
  background:color-mix(in srgb,#070b14 42%,#111a2b);min-height:36px;display:inline-flex;align-items:center;gap:5px}
.pest span.on{border-color:color-mix(in srgb,#38e1ff 55%,#1e2b44);color:#38e1ff;background:color-mix(in srgb,#38e1ff 12%,#111a2b)}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
.chipx{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;padding:7px 12px;border-radius:999px;
  border:1px solid #1e2b44;background:color-mix(in srgb,#070b14 42%,#111a2b);color:#e9f2ff;min-height:36px}
.chipx.on{border-color:color-mix(in srgb,#38e1ff 55%,#1e2b44);color:#38e1ff;background:color-mix(in srgb,#38e1ff 12%,#111a2b)}
.mic{border:1px solid #1e2b44;border-radius:10px;padding:7px 9px;background:color-mix(in srgb,#070b14 42%,#111a2b)}
.micros{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:10px}
.mic .mn{display:block;font-size:10px;color:#8fa6c6;font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.mic .mv{display:block;font-size:12.5px;font-weight:800;margin-top:1px}
.micbar{display:block;width:100%;height:5px;border-radius:999px;background:color-mix(in srgb,#111a2b 60%,#070b14);
  border:1px solid #1e2b44;overflow:hidden;margin-top:6px}
.micbar i{display:block;height:100%;background:linear-gradient(90deg,#34d399,#a3e635)}
.micbar i.bajo{background:linear-gradient(90deg,#fbbf24,#fb7185)}
.micbar i.alto{background:linear-gradient(90deg,#38e1ff,#7c5cff)}
.idea{border:1px solid #1e2b44;border-radius:13px;padding:11px 12px;margin-top:9px;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.idea.buena{border-color:color-mix(in srgb,#34d399 45%,#1e2b44);background:color-mix(in srgb,#34d399 8%,#111a2b)}
.idea h4{margin:0 0 3px;font-size:13.5px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.idea .por{font-size:11.5px;color:#8fa6c6;margin:0}
.big{width:100%;justify-content:center;min-height:48px;font-size:14.5px;display:flex;align-items:center;gap:8px}
.vacio{color:#8fa6c6;font-size:12.5px;font-style:italic;padding:14px 0;text-align:center}
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
  <span class="micbar"><i class="${pct<50?'bajo':(pct>=100?'alto':'')}" style="width:${Math.min(100,pct)}%"></i></span></div>`;
const hit = (em,nom,sub,kc,unidad)=>`<button class="hit"><span class="em">${em}</span>
  <span class="nm"><b>${nom}</b><span>${sub}</span></span>
  <span class="kc">${kc}<small>${unidad}</small></span>
  <span class="add">${svg('mas','ico')}</span></button>`;

export {ICO, svg, cab, sub, pagina, ring, macro, mic, hit};
