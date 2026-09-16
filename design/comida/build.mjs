/* Maquetas del rediseño de Comida / Días y menús. La piel sale de _base.css (copiada de la app). */
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
  chispa:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 16.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  calendario:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  caja:'<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5 3.5 16.5z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>',
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

const pagina = (cuerpo, extraCss='') => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <style>
${CSS}${extraCss}  </style>
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

/* anillo de kcal: arco proporcional, sin librerías */
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
const macro = (nm, val, pct, cls) => `
  <div class="macro"><div class="mt"><span>${nm}</span><b>${val}</b></div>
    <div class="mbar"><i class="${cls}" style="width:${pct}%"></i></div></div>`;

/* ---------- 1. Comida: el día ---------- */
const LOG = [
  ['08:10','Porridge overnight','avena, yogur, plátano',430],
  ['11:00','Café con leche','',  90],
  ['14:30','Pollo al curry con boniato','táper del domingo',620],
  ['17:00','Fruta y frutos secos','',210],
];
writeFileSync('Main.dc.html', pagina(`${cab()}
  <main>
    <div class="card">
      <div class="row" style="justify-content:space-between;margin-bottom:11px">
        <div class="row" style="gap:6px"><button class="btn s">‹</button><b style="font-size:13.5px">mié 16 sep</b><button class="btn s">›</button></div>
        <span class="tag b2">💼 día de trabajo</span>
      </div>
      <div class="ringrow">
        ${ring(0.66,'1 350','de 2 040')}
        <div class="macros">
          ${macro('proteína','96 / 150 g',64,'p')}
          <div class="dosdatos">
            <div><b>690</b><span>te quedan</span></div>
            <div><b>2 040</b><span>cocinado hoy</span></div>
          </div>
        </div>
      </div>
      <button class="btn p big" style="margin-top:13px">${svg('mas','ico sm')} apuntar comida</button>
    </div>

    <div class="card">
      <h2>Lo de hoy <span class="mini">4 tomas</span></h2>
      ${LOG.map(([h,nm,det,kc])=>`<div class="logrow"><span class="h">${h}</span>
        <span class="nm"><b>${nm}</b>${det?`<span class="mini">${det}</span>`:''}</span>
        <span class="kc">${kc}</span></div>`).join('')}
    </div>

    <div class="card">
      <h2>La semana</h2>
      <div class="wk">
        ${[['lun',72],['mar',88],['mié',66],['jue',0],['vie',0],['sáb',0],['dom',0]].map(([d,p],i)=>
          `<div class="wkd${i===2?' hoy':''}"><div class="wkb${p>100?' over':''}"><i style="height:${p}%"></i></div><span>${d}</span></div>`).join('')}
      </div>
      <p class="mini" style="margin-top:9px">media de lo que va de semana: <b style="color:#e9f2ff">1 880 kcal</b> · objetivo 2 040</p>
    </div>
  </main>`));

/* ---------- 2. Añadir comida ---------- */
writeFileSync('Anadir.dc.html', pagina(`${cab()}
  <main>
    ${sub('Apuntar comida')}
    <div class="modos">
      ${[['lupa','buscar',1],['camara','escanear',0],['caja','mis productos',0],['lapiz','a mano',0]]
        .map(([i,t,on])=>`<button class="modo${on?' on':''}">${svg(i,'ico sm')}<span>${t}</span></button>`).join('')}
    </div>
    <div style="margin-top:11px">
      <div class="buscador">${svg('lupa','ico sm')} pollo</div>
    </div>
    <div class="card" style="margin-top:11px">
      ${[['Pechuga de pollo a la plancha','165 kcal · 31 g P  /100 g','del catálogo'],
         ['Pollo al curry con boniato','620 kcal · 42 g P  /ración','plato tuyo'],
         ['Muslo de pollo asado','209 kcal · 26 g P  /100 g','del catálogo'],
         ['Caldo de pollo','38 kcal · 3 g P  /100 ml','del catálogo']]
        .map(([nm,mac,src])=>`<div class="res"><span class="nm"><b>${nm}</b><span class="mini">${mac}</span></span>
          <span class="tag">${src}</span><button class="btn s">${svg('mas','ico sm')}</button></div>`).join('')}
    </div>
    <div class="card" style="margin-top:11px">
      <h2>Pechuga de pollo a la plancha</h2>
      <div class="fgrid c3 tight">
        <label class="fld">cantidad<input value="180" style="font-size:16px"></label>
        <label class="fld">unidad<select><option>gramos</option><option>ración</option></select></label>
        <label class="fld">momento<select><option>comida</option><option>desayuno</option><option>cena</option></select></label>
      </div>
      <div class="row" style="margin-top:10px;gap:14px">
        <span class="tag b2">297 kcal</span><span class="tag b3">56 g proteína</span>
      </div>
      <button class="btn p big" style="margin-top:11px">apuntar</button>
    </div>
  </main>`));

/* ---------- 3. Días y menús: la portada ---------- */
const DIAS = [
  ['🩺','Guardia','24 h en destino','5 tomas','2 400'],
  ['🚪','Saliente','09:00–13:00','4 tomas','1 960'],
  ['💼','Día de trabajo','08:00–15:00','4 tomas','2 040'],
  ['💪','Día de fuerza','06:30–08:00','5 tomas','2 540'],
  ['🌿','Día libre','sin jornada','4 tomas','1 960'],
  ['🏖️','Vacaciones','sin jornada','4 tomas','1 960'],
];
writeFileSync('DiasMenus.dc.html', pagina(`${cab()}
  <main>
    ${sub('Días y menús','Más')}
    <p class="note">Qué se come en cada tipo de día. Toca uno para ver y cambiar sus comidas.</p>
    <div class="card">
      ${DIAS.map(([ic,nm,hr,n,kc])=>`<div class="res" style="cursor:pointer">
        <span style="font-size:20px;flex:none">${ic}</span>
        <span class="nm"><b>${nm}</b><span class="mini">${hr} · ${n}</span></span>
        <span class="tag b2">${kc}</span>${svg('chevron','ico sm')}</div>`).join('')}
    </div>
    <div class="tiles">
      <button class="tile">${svg('caja')}<b>Comidas armadas</b><span class="n">18</span><span class="s">bloques reutilizables</span></button>
      <button class="tile">${svg('libro')}<b>Catálogo</b><span class="n">16</span><span class="s">platos</span></button>
    </div>
  </main>`));

/* ---------- 4. El menú de un tipo de día ---------- */
const TOMAS = [
  ['06:45','Desayuno pre-entreno','🥣 Porridge overnight + ☕ Café',520],
  ['11:00','Media mañana','🍎 Fruta y frutos secos',210],
  ['14:30','Comida post-entreno','🍛 Pollo al curry + 🍞 Pan con aceite',780],
  ['21:15','Cena','🐟 Salmón al horno + 🥛 Yogur con avena',640],
];
writeFileSync('MenuDia.dc.html', pagina(`${cab()}
  <main>
    ${sub('Día de fuerza','Días y menús','<span class="tag b2">2 540 kcal</span>')}
    <div class="card">
      <div class="row" style="justify-content:space-between">
        <span class="mini">06:30–08:00 · carga alta</span>
        <span class="row" style="gap:6px"><span class="tag b3">168 g P</span><span class="tag">4 tomas</span></span>
      </div>
    </div>
    ${TOMAS.map(([h,nm,det,kc])=>`<div class="card" style="margin-top:10px">
      <div class="row" style="justify-content:space-between">
        <span class="row" style="gap:7px"><span class="tag">${h}</span><b style="font-size:13.5px">${nm}</b></span>
        <span class="tag b2">${kc}</span></div>
      <p class="mini" style="margin:8px 0 0">${det}</p>
      <div class="row" style="margin-top:9px"><button class="btn s">cambiar platos</button><button class="btn s">hora</button></div>
    </div>`).join('')}
    <div class="row" style="margin-top:11px"><button class="btn s">${svg('mas','ico sm')} añadir toma</button></div>
  </main>`));

/* ---------- 5. Qué cocino hoy ---------- */
writeFileSync('QueCocino.dc.html', pagina(`${cab()}
  <main>
    ${sub('Qué puedo cocinar')}
    <p class="note">Con lo que llevas en la compra de esta semana. Lo verde ya lo tienes entero.</p>
    <div class="card">
      <div class="row" style="justify-content:space-between"><b style="font-size:13.5px">Te sale entero</b><span class="tag b3">3 platos</span></div>
      <div class="platos">
        ${[['🍲','Lentejas estofadas','4 rac · 480 kcal'],['🍳','Tortilla de patata','6 rac · 310 kcal'],['🥣','Porridge overnight','4 rac · 430 kcal']]
          .map(([p,nm,m])=>`<div class="plato cocinable"><span class="pic">${p}</span><b>${nm}</b><span class="mini">${m}</span>
            <button class="btn s" style="margin-top:7px">${svg('olla','ico sm')} cocinar</button></div>`).join('')}
      </div>
    </div>
    <div class="card" style="margin-top:12px">
      <div class="row" style="justify-content:space-between"><b style="font-size:13.5px">Casi</b><span class="tag b4">te falta poco</span></div>
      <div class="platos">
        ${[['🍛','Pollo al curry','te falta leche de coco'],['🐟','Salmón al horno','te faltan espárragos']]
          .map(([p,nm,m])=>`<div class="plato"><span class="pic">${p}</span><b>${nm}</b><span class="mini">${m}</span>
            <button class="btn s" style="margin-top:7px">${svg('mas','ico sm')} a la compra</button></div>`).join('')}
      </div>
    </div>
  </main>`));

/* ---------- 6. Modo cocina ---------- */
writeFileSync('ModoCocina.dc.html', pagina(`${cab()}
  <main style="display:flex;flex-direction:column;flex:1">
    <div class="subcab">
      <button class="btn s volver" title="volver">${svg('atras','ico sm')}</button>
      <h2 class="subtit">Lentejas estofadas</h2>
      <span class="tag b2">paso 2 de 4</span>
    </div>
    <div class="card">
      <div class="row" style="justify-content:space-between;margin-bottom:9px">
        <span class="mini">raciones</span>
        <span class="row" style="gap:6px">${['2','4','6','8'].map(n=>`<button class="chip${n==='6'?' on':''}">${n}</button>`).join('')}</span>
      </div>
      ${[['750 g','lenteja pardina'],['300 g','chorizo'],['3','zanahoria'],['1,5','cebolla'],['9 g','pimentón']]
        .map(([q,nm])=>`<div class="ingr"><span>${nm}</span><b>${q}</b></div>`).join('')}
      <p class="mini" style="margin:9px 0 0">escalado a 6 raciones desde las 4 de la receta</p>
    </div>
    <div class="card" style="margin-top:12px;flex:1">
      <div class="pasonum">
        ${[1,2,3,4].map(n=>`<span class="pasopunto${n<=2?' on':''}"></span>`).join('')}
        <span class="sp"></span><span class="tag">${''}${svg('reloj','ico sm')} 20 min</span>
      </div>
      <p class="paso">Pocha la cebolla y la zanahoria 8 minutos. Añade el pimentón fuera del fuego para que no amargue.</p>
    </div>
  </main>
  <div class="navpaso">
    <button class="btn s" style="min-height:46px;flex:0 0 118px;display:inline-flex;align-items:center;justify-content:center;gap:6px">${svg('atras','ico sm')} anterior</button>
    <button class="btn p" style="min-height:46px;flex:1">siguiente paso</button>
  </div>`));

/* ---------- 7. Claude inventa recetas ---------- */
writeFileSync('Inventar.dc.html', pagina(`${cab()}
  <main>
    ${sub('Inventar una receta')}
    <label class="fld">qué tienes o qué te apetece
      <textarea rows="3">pollo, arroz, espinacas y media lata de tomate</textarea></label>
    <div class="row" style="margin-top:10px;gap:6px">
      ${['≤ 600 kcal','≥ 40 g proteína','≤ 30 min','para táper'].map((t,i)=>`<button class="chip${i<3?' on':''}">${t}</button>`).join('')}
    </div>
    <button class="btn p big" style="margin-top:12px">${svg('chispa','ico sm')} que lo piense Claude</button>
    <p class="mini" style="margin-top:9px">Solo dentro del Artifact de claude.ai; gasta de tu cuenta. En la web del móvil este botón no sale.</p>

    <div class="card" style="margin-top:13px">
      <div class="row" style="justify-content:space-between"><b style="font-size:14px">🍛 Arroz con pollo y espinacas</b><span class="tag b2">540 kcal</span></div>
      <p class="mini" style="margin:6px 0 9px">4 raciones · 44 g proteína · 25 min · aguanta 4 días en táper</p>
      ${[['400 g','pechuga de pollo'],['280 g','arroz'],['200 g','espinaca'],['200 g','tomate triturado']]
        .map(([q,nm])=>`<div class="ingr"><span>${nm}</span><b>${q}</b></div>`).join('')}
      <div class="row" style="margin-top:11px"><button class="btn p">guardar en el catálogo</button><button class="btn s">otra idea</button></div>
    </div>
  </main>`));

/* ---------- 8. Catálogo de platos ---------- */
writeFileSync('Catalogo.dc.html', pagina(`${cab()}
  <main>
    ${sub('Catálogo','Días y menús','<span class="tag b2">16</span>')}
    <div class="buscador">${svg('lupa','ico sm')} buscar un plato</div>
    <div class="row" style="margin-top:9px;gap:6px">
      ${['todos','del domingo','del miércoles','sin tanda'].map((t,i)=>`<button class="chip${i===0?' on':''}">${t}</button>`).join('')}
    </div>
    <div class="platos">
      ${[['🍲','Lentejas estofadas','4 rac · 480 kcal · 26 g P'],['🍳','Tortilla de patata','6 rac · 310 kcal · 18 g P'],
         ['🍛','Pollo al curry','6 rac · 620 kcal · 42 g P'],['🐟','Salmón al horno','6 rac · 560 kcal · 38 g P'],
         ['🥣','Porridge overnight','4 rac · 430 kcal · 22 g P'],['🍚','Arroz caldoso de pollo','4 rac · 590 kcal · 36 g P']]
        .map(([p,nm,m])=>`<div class="plato"><span class="pic">${p}</span><b>${nm}</b><span class="mini">${m}</span></div>`).join('')}
    </div>
    <div class="row" style="margin-top:12px">
      <button class="btn s">${svg('mas','ico sm')} nuevo plato</button>
      <button class="btn s">${svg('chispa','ico sm')} inventar uno</button></div>
  </main>`));

/* ---------- lienzo ---------- */
const A=(f,x,y,t,h=844)=>({file:f,x,y,w:390,h,title:t});
writeFileSync('canvas.json', JSON.stringify({
  artboards:[
    A('Main.dc.html',        0,    0,   'Comida · el día'),
    A('Anadir.dc.html',      470,  0,   'Apuntar comida'),
    A('DiasMenus.dc.html',   940,  0,   'Días y menús'),
    A('MenuDia.dc.html',     1410, 0,   'El menú de un día', 1000),
    A('QueCocino.dc.html',   0,    1160,'Qué puedo cocinar'),
    A('ModoCocina.dc.html',  470,  1160,'Modo cocina'),
    A('Inventar.dc.html',    940,  1160,'Inventar una receta'),
    A('Catalogo.dc.html',    1410, 1160,'Catálogo de platos'),
  ],
  annotations:[
    {id:'brief', x:-370, y:0, w:290,
     text:'Comida y menús, rediseñado\n\nHoy «Días y menús» son 9.912 px —11 pantallas—, 202 botones y 64 campos en una sola vista: los seis tipos de día abiertos a la vez.\n\nArriba: las cuatro pantallas del día a día. Abajo: las tres de recetas que pediste.'},
    {id:'bug', x:0, y:876, w:390,
     text:'Fallo real encontrado de paso: en «Objetivo, semana a semana» la barra se pone al 100 % cuando no tienes objetivo puesto, hayas comido lo que hayas comido. Aquí la tira semanal mide lo comido contra el plan del día.'},
    {id:'nota-cocina', x:470, y:1064, w:390,
     text:'Modo cocina: un paso a la vez en grande y los ingredientes ya escalados a las raciones que elijas.'},
  ],
  launch:{view:'canvas'}
}, null, 2));
console.log('escritos 8 artboards + canvas.json');
