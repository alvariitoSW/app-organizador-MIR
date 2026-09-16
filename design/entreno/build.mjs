/* Genera los .dc.html de las maquetas. La piel sale de _base.css, copiada de styles.css de la app. */
import {readFileSync, writeFileSync} from 'node:fs';
const CSS = readFileSync('_base.css', 'utf8');

const ICO = {
  pesa:'<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
  pulso:'<path d="M3 12h4l2-5 3 10 2.5-6 1.5 3h5"/>',
  libro:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
  barras:'<path d="M3 20h18"/><path d="M6.5 20v-4"/><path d="M11.5 20V9"/><path d="M16.5 20v-7"/><path d="M21 20V5"/>',
  chevron:'<path d="M9 5l7 7-7 7"/>',
  atras:'<path d="M15 5l-7 7 7 7"/>',
  mas:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="M4 12.5l5 5L20 6.5"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lupa:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  trofeo:'<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 4M17 6h2.5a2.5 2.5 0 0 1-2.5 4"/><path d="M10 20h4M12 14v6"/>',
};
const svg = (n, cls='ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n]}</svg>`;

const cab = (activo='Entreno') => `
<header>
  <div class="hwrap">
    <h1><svg viewBox="0 0 24 24" fill="none" stroke="#38e1ff" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;flex:none"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>Guardias · rotación y cocina</h1>
    <nav>
      ${['Calendario','Entreno','Compra','☰ Más'].map(t=>`<button class="${t===activo?'on':''}">${t}</button>`).join('')}
    </nav>
  </div>
</header>`;

/* cabecera de una subpantalla: volver + título, el mismo patrón que ya usa Cardio */
const sub = (titulo, extra='') => `
<div class="subcab">
  <button class="btn s volver">${svg('atras','ico sm')} Entreno</button>
  <h2 class="subtit">${titulo}</h2>
  ${extra}
</div>`;

const EXTRA = `
.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
.tile{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;text-align:left;font:inherit;color:#e9f2ff;
  cursor:pointer;padding:12px 11px;border-radius:14px;min-height:104px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.tile .ico{color:#8fa6c6;margin-bottom:4px}
.tile b{font-size:13px;line-height:1.2}
.tile .n{font-size:11.5px;font-weight:700;color:#38e1ff}
.tile .s{font-size:10.5px;color:#8fa6c6}
.hero{position:relative;border:1px solid color-mix(in srgb,#38e1ff 34%,#1e2b44);border-radius:16px;padding:14px 13px;
  background:linear-gradient(150deg,color-mix(in srgb,#38e1ff 12%,#111a2b),#111a2b 55%);
  box-shadow:0 0 0 1px color-mix(in srgb,#38e1ff 12%,transparent),0 18px 40px -24px rgba(0,0,0,.9)}
.hero-top{display:flex;align-items:center;gap:9px}
.hero-top .ico{color:#38e1ff}
.hero-tit{font-size:16px;font-weight:800;letter-spacing:.02em}
.hero-sub{font-size:11.5px;color:#8fa6c6;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.exlist{display:flex;flex-direction:column;gap:0;margin:11px 0 12px}
.exrow{display:flex;align-items:center;gap:9px;padding:8px 0;border-top:1px dashed #1e2b44}
.exrow:first-child{border-top:none}
.exrow .nm{flex:1;min-width:0;font-size:13px;font-weight:700}
.dots{display:flex;gap:4px;flex:none}
.dot{width:9px;height:9px;border-radius:999px;background:color-mix(in srgb,#111a2b 55%,#070b14);border:1px solid #1e2b44}
.dot.on{background:#34d399;border-color:transparent}
.dot.pr{background:#fbbf24;border-color:transparent}
.big{width:100%;justify-content:center;min-height:46px;font-size:14px;display:flex;align-items:center;gap:8px}
.subcab{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:12px}
.volver{display:inline-flex;align-items:center;gap:5px;flex:none}
.subtit{font-size:17px;font-weight:800;margin:0;letter-spacing:.02em;flex:1;min-width:0}
.barra{height:6px;border-radius:999px;background:color-mix(in srgb,#111a2b 60%,#070b14);border:1px solid #1e2b44;overflow:hidden}
.barra i{display:block;height:100%;background:linear-gradient(90deg,#38e1ff,#7c5cff)}
.setchips{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}
.chip{font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:9px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#111a2b 62%,#070b14);color:#e9f2ff}
.chip.add{color:#38e1ff;border-color:color-mix(in srgb,#38e1ff 40%,#1e2b44);display:inline-flex;align-items:center;gap:4px}
.chip.top{border-color:color-mix(in srgb,#fbbf24 45%,#1e2b44);color:#fbbf24}
.apunta{margin-top:auto;position:relative;z-index:1;padding:11px 9px 14px;border-top:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 92%,transparent);backdrop-filter:blur(12px);display:flex;gap:7px;align-items:flex-end}
.apunta::before{content:'';position:absolute;left:0;right:0;top:-1px;height:1px;
  background:linear-gradient(90deg,transparent,color-mix(in srgb,#38e1ff 55%,transparent),transparent)}
.campo{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
.campo span{font-size:9.5px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.06em}
.campo i{display:block;font-style:normal;font-size:15px;font-weight:700;padding:9px 10px;border-radius:10px;
  border:1px solid #1e2b44;background:color-mix(in srgb,#070b14 55%,#111a2b);min-height:40px}
.heat{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:8px;max-width:320px}
.hcell{aspect-ratio:1/1;border-radius:5px;background:color-mix(in srgb,#111a2b 55%,#070b14);border:1px solid #1e2b44}
.hcell.l1{background:color-mix(in srgb,#34d399 45%,#111a2b);border-color:transparent}
.hcell.l2{background:#38e1ff;border-color:transparent;box-shadow:0 0 8px -1px color-mix(in srgb,#38e1ff 70%,transparent)}
.hwd{text-align:center;font-size:9px;font-weight:800;color:#8fa6c6;text-transform:uppercase}
.volrow{display:flex;align-items:center;gap:8px;padding:5px 0}
.volrow .d{font-size:11px;font-weight:800;color:#8fa6c6;width:52px;flex:none;white-space:nowrap}
.volbar{flex:1;height:8px;border-radius:999px;background:color-mix(in srgb,#111a2b 60%,#070b14);overflow:hidden}
.volbar i{display:block;height:100%;background:linear-gradient(90deg,#38e1ff,#7c5cff)}
.volrow .v{font-size:11px;font-weight:800;width:58px;text-align:right;flex:none}
.buscador{display:flex;align-items:center;gap:8px;padding:10px 11px;border-radius:12px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 55%,#111a2b);color:#8fa6c6;font-size:13.5px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.lib{display:flex;align-items:center;gap:10px;padding:10px 0;border-top:1px dashed #1e2b44}
.lib:first-child{border-top:none}
.lib .nm{flex:1;min-width:0}
.lib .nm b{display:block;font-size:13px}
.rut{display:flex;align-items:center;gap:10px;padding:12px 11px;border-radius:13px;border:1px solid #1e2b44;
  background:color-mix(in srgb,#070b14 42%,#111a2b);margin-top:9px;cursor:pointer;min-height:56px}
.rut .nm{flex:1;min-width:0}
.rut .nm b{display:block;font-size:14px}
.rut.hoy{border-color:color-mix(in srgb,#38e1ff 40%,#1e2b44);background:linear-gradient(140deg,color-mix(in srgb,#38e1ff 10%,#111a2b),#111a2b 60%)}
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

/* ---------- 1. portada ---------- */
const ejercicio = (nm, hechas, total, pr) => `
    <div class="exrow">
      <span class="nm">${nm}</span>
      <span class="dots">${Array.from({length:total},(_,i)=>
        `<span class="dot${i<hechas?(pr&&i===hechas-1?' pr':' on'):''}"></span>`).join('')}</span>
    </div>`;

writeFileSync('Main.dc.html', pagina(`${cab()}
  <main>
    <div class="hero">
      <div class="hero-top">${svg('pesa')}<div><div class="hero-tit">Entrenar</div><div class="hero-sub">hoy · Empuje</div></div></div>
      <div class="exlist">
        ${ejercicio('Press banca', 2, 4)}
        ${ejercicio('Press militar', 0, 3)}
        ${ejercicio('Fondos', 0, 3)}
      </div>
      <button class="btn p big">${svg('mas','ico sm')} apuntar serie</button>
    </div>
    <div class="tiles">
      <button class="tile">${svg('pulso')}<b>Cardio</b><span class="n">2</span><span class="s">esta semana</span></button>
      <button class="tile">${svg('libro')}<b>Biblioteca</b><span class="n">1.240</span><span class="s">ejercicios</span></button>
      <button class="tile">${svg('barras')}<b>Progreso</b><span class="n">racha 2</span><span class="s">4 días este mes</span></button>
    </div>
  </main>`));

/* ---------- 2. la sesión ---------- */
const exCard = (nm, obj, chips) => `
    <div class="card" style="margin-top:10px">
      <div class="row" style="justify-content:space-between"><b style="font-size:14px">${nm}</b><span class="mini">${obj}</span></div>
      <div class="setchips">${chips}</div>
    </div>`;

writeFileSync('Sesion.dc.html', pagina(`${cab()}
  <main>
    ${sub('Empuje', '<span class="tag b2">hoy</span>')}
    <div class="card">
      <div class="row" style="justify-content:space-between;margin-bottom:7px">
        <b style="font-size:13px">4 de 10 series</b><span class="mini">2 340 kg de volumen</span>
      </div>
      <div class="barra"><i style="width:40%"></i></div>
    </div>
    ${exCard('Press banca','4 × 8 · 60 kg',
      '<span class="chip">60×8</span><span class="chip">60×8</span><span class="chip top">62,5×8 · PR</span><span class="chip add">'+svg('mas','ico sm')+'serie</span>')}
    ${exCard('Press militar','3 × 8 · 35 kg',
      '<span class="chip">35×8</span><span class="chip add">'+svg('mas','ico sm')+'serie</span>')}
    ${exCard('Fondos','3 × máximas',
      '<span class="chip add">'+svg('mas','ico sm')+'serie</span>')}
  </main>
  <div class="apunta">
    <label class="campo" style="flex:0 0 74px"><span>kg</span><i>62,5</i></label>
    <label class="campo" style="flex:0 0 62px"><span>reps</span><i>8</i></label>
    <button class="btn p" style="min-height:46px;flex:1">apuntar serie</button>
  </div>`));

/* ---------- 3. rutinas ---------- */
writeFileSync('Rutinas.dc.html', pagina(`${cab()}
  <main>
    ${sub('Rutinas')}
    <div class="rut hoy">${svg('pesa')}<span class="nm"><b>Empuje</b><span class="mini">3 ejercicios · 10 series</span></span><span class="tag b2">hoy</span>${svg('chevron','ico sm')}</div>
    <div class="rut">${svg('pesa')}<span class="nm"><b>Tirón</b><span class="mini">4 ejercicios · 12 series</span></span>${svg('chevron','ico sm')}</div>
    <div class="rut">${svg('pesa')}<span class="nm"><b>Pierna</b><span class="mini">5 ejercicios · 15 series</span></span>${svg('chevron','ico sm')}</div>
    <div class="row" style="margin-top:12px"><button class="btn s">${svg('mas','ico sm')} Nueva rutina</button></div>
    <div class="card" style="margin-top:14px">
      <h2>Segundo entreno</h2>
      <p class="note" style="margin-bottom:9px">Piscina o carrera además del gym. No se pone en guardias, salientes ni vacaciones.</p>
      <div class="row">
        ${['dom','lun','mar','mié','jue','vie','sáb'].map(d=>`<button class="btn s${d==='mar'?' p':''}">${d}</button>`).join('')}
      </div>
      <div class="row" style="margin-top:9px"><span class="tag b3">${'piscina'}</span><span class="tag">15:30</span></div>
    </div>
  </main>`));

/* ---------- 4. progreso ---------- */
const semana = (dias) => dias.map(l=>`<span class="hcell${l?` l${l}`:''}"></span>`).join('');
writeFileSync('Progreso.dc.html', pagina(`${cab()}
  <main>
    ${sub('Progreso')}
    <div class="card">
      <h2>Días entrenados <span class="mini">últimas 6 semanas</span></h2>
      <div class="heat">${['L','M','X','J','V','S','D'].map(d=>`<span class="hwd">${d}</span>`).join('')}</div>
      <div class="heat">
        ${semana([0,2,0,1,2,0,0])}${semana([2,0,1,2,0,1,0])}${semana([0,2,0,2,1,0,0])}
        ${semana([2,0,2,0,1,0,0])}${semana([0,2,1,2,0,0,0])}${semana([2,0,1,0,0,0,0])}
      </div>
      <div class="row" style="margin-top:11px;gap:14px">
        <span class="mini"><b style="color:#e9f2ff">19</b> días entrenados</span>
        <span class="mini"><b style="color:#e9f2ff">2</b> de racha</span>
      </div>
    </div>
    <div class="card" style="margin-top:13px">
      <h2>Volumen de la semana</h2>
      ${[['lun 14',78,'2 340 kg'],['mar 15',0,'—'],['mié 16',54,'1 620 kg'],['jue 17',0,'—'],
         ['vie 18',92,'2 760 kg'],['sáb 19',0,'—'],['dom 20',0,'—']]
        .map(([d,p,v])=>`<div class="volrow"><span class="d">${d}</span><span class="volbar"><i style="width:${p}%"></i></span><span class="v">${v}</span></div>`).join('')}
      <p class="mini" style="margin:8px 0 0">kg × repeticiones de lo que apuntas. Sirve para compararte contigo, no para castigarte.</p>
    </div>
    <div class="card" style="margin-top:13px">
      <h2>Tus marcas</h2>
      ${[['Press banca','62,5 kg × 8','hoy'],['Sentadilla','90 kg × 5','12 sep'],['Peso muerto','110 kg × 3','5 sep']]
        .map(([nm,m,f])=>`<div class="lib"><span style="color:#fbbf24">${svg('trofeo','ico sm')}</span><span class="nm"><b>${nm}</b><span class="mini">${f}</span></span><span class="tag b4">${m}</span></div>`).join('')}
    </div>
  </main>`));

/* ---------- 5. biblioteca ---------- */
writeFileSync('Biblioteca.dc.html', pagina(`${cab()}
  <main>
    ${sub('Biblioteca')}
    <div class="buscador">${svg('lupa','ico sm')} press de banca</div>
    <div class="chips">
      <span class="tag b2">gimnasio</span><span class="tag">casa</span><span class="tag">pecho</span>
      <span class="tag">espalda</span><span class="tag">pierna</span>
    </div>
    <div class="card" style="margin-top:12px">
      ${[['Press de banca con barra','pecho · tríceps · hombros'],
         ['Press de banca inclinado','pecho superior · hombros'],
         ['Press de banca con mancuernas','pecho · tríceps'],
         ['Press en máquina','pecho'],
         ['Aperturas en polea','pecho']]
        .map(([nm,mus])=>`<div class="lib"><span class="nm"><b>${nm}</b><span class="mini">${mus}</span></span><button class="btn s">añadir</button></div>`).join('')}
      <p class="mini" style="margin:10px 0 0">1.240 ejercicios guardados en el móvil · openGym</p>
    </div>
  </main>`));

/* ---------- lienzo ---------- */
writeFileSync('canvas.json', JSON.stringify({
  artboards:[
    {file:'Main.dc.html',     x:0,    y:0,    w:390, h:844, title:'Entreno · portada'},
    {file:'Sesion.dc.html',   x:470,  y:0,    w:390, h:844, title:'Entrenando'},
    {file:'Rutinas.dc.html',  x:940,  y:0,    w:390, h:844, title:'Rutinas'},
    {file:'Progreso.dc.html', x:0,    y:964,  w:390, h:1200, title:'Progreso (se desplaza)'},
    {file:'Biblioteca.dc.html',x:470, y:964,  w:390, h:844, title:'Biblioteca'}
  ],
  annotations:[
    {id:'brief', x:-370, y:0, w:280,
     text:'Entreno, rediseñado\n\nAhora: 8 tarjetas apiladas, 2.974 px (3,3 pantallas) y 27 botones nada más entrar.\n\nAquí: la portada cabe en media pantalla. Entrenar es lo único grande; el resto entra por su ficha y vuelve con «‹ Entreno», como ya hace Cardio.'},
    {id:'nota-sesion', x:470, y:-132, w:390,
     text:'La pantalla de entrenar: lo que toca hoy, las series ya hechas como fichas y el par kg/reps siempre a mano abajo.'},
    {id:'nota-prog', x:0, y:876, w:390,
     text:'Progreso junta las tres tarjetas de números que antes estaban sueltas por el medio: mapa de calor, volumen y marcas.'}
  ],
  launch:{view:'canvas'}
}, null, 2));

console.log('escritos: Main, Sesion, Rutinas, Progreso, Biblioteca + canvas.json');
