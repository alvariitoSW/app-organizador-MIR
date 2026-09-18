import {writeFileSync} from 'node:fs';
import {svg, cab, sub, pagina, ring, macro, mic, hit} from './build.mjs';

/* ---------- 1. Comida: el día, y una sola puerta ---------- */
writeFileSync('Dia.dc.html', pagina(`${cab()}
<main>
  <div class="card">
    <div class="row" style="justify-content:space-between;margin-bottom:11px">
      <div class="row" style="gap:6px"><button class="btn s">‹</button><b style="font-size:13.5px">vie 18 sep</b><button class="btn s">›</button></div>
      <span class="mini">te quedan <b style="color:#e9f2ff">1 844 kcal</b></span>
    </div>
    <div class="ringrow">
      ${ring(0.23,'556','de 2 400')}
      <div class="macros">
        ${macro('proteína','52 / 150 g',35,'p')}
        ${macro('carbohidratos','67 / 225 g',30,'c')}
        ${macro('grasa','9 / 100 g',9,'g')}
      </div>
    </div>
    <button class="microlinea">
      <span class="pts">
        <i style="background:#fb7185"></i><i style="background:#fbbf24"></i><i style="background:#fbbf24"></i>
        <i style="background:#34d399"></i><i style="background:#34d399"></i><i style="background:#34d399"></i>
        <i style="background:#38e1ff"></i><i style="background:#38e1ff"></i><i style="background:#34d399"></i></span>
      <span class="tx">Micronutrientes<small>4 por debajo de la mitad · vit. D, calcio, vit. C…</small></span>
      ${svg('chevron','ico sm')}
    </button>
  </div>

  <button class="buscaz">${svg('lupa','ico')} <b>Apuntar algo</b> · busca entre todo <span class="kbd">290</span></button>

  <div class="card">
    <h2>Lo de hoy <span class="mini">3 tomas</span></h2>
    <div class="mom">desayuno</div>
    <div class="toma"><span class="em">🍌</span><span class="nm"><b>Plátano</b><span>120 g</span></span><span class="kc">107</span></div>
    <div class="toma"><span class="em">🌾</span><span class="nm"><b>Copos de avena</b><span>60 g</span></span><span class="kc">233</span></div>
    <div class="mom">comida</div>
    <div class="toma"><span class="em">🍗</span><span class="nm"><b>Pechuga de pollo</b><span>cruda · 180 g</span></span><span class="kc">216</span></div>
  </div>

  <div class="card">
    <h2>La semana</h2>
    <div class="sem">
      ${[['lun',72],['mar',88],['mié',64],['jue',95],['vie',23],['sáb',0],['dom',0]].map(([d,h],i)=>`
        <div class="semd${i===4?' hoy':''}"><span class="semb"><i style="height:${h}%"></i></span><span>${d}</span></div>`).join('')}
    </div>
    <p class="mini" style="margin:9px 0 0">media de lo apuntado: <b style="color:#e9f2ff">1 980 kcal</b> · objetivo 2 400</p>
  </div>

  <div class="puertas">
    <button class="puerta">${svg('olla')}<b>Cocina</b><span class="s">qué hago hoy</span></button>
    <button class="puerta">${svg('libro')}<b>Mis platos</b><span class="s">16 guardados</span></button>
    <button class="puerta">${svg('pastilla')}<b>Alimentos</b><span class="s">86 con micros</span></button>
  </div>
</main>`));

/* ---------- 2. El buscador: la puerta única ---------- */
writeFileSync('Buscar.dc.html', pagina(`${cab()}
<main>
  ${sub('Apuntar', 'Comida')}
  <div class="campo">${svg('lupa','ico')} <span style="color:#8fa6c6">pollo, yogur, lentejas…</span><span class="cur"></span></div>
  <div class="chips">
    <span class="chipx on">todo <b>290</b></span>
    <span class="chipx">alimentos 86</span>
    <span class="chipx">productos 188</span>
    <span class="chipx">mis platos 16</span>
  </div>

  <div class="card" style="margin-top:12px">
    <h2>Lo que más apuntas</h2>
    ${hit('🍗','Pechuga de pollo','alimento · cruda, sin piel','120','/100 g')}
    ${hit('🥛','Leche entera','producto · Mercadona','65','/100 g')}
    ${hit('🍌','Plátano','alimento · fruta','89','/100 g')}
    ${hit('🍛','Pollo al curry con boniato','plato tuyo · 6 raciones','520','/ración')}
    ${hit('🥣','Porridge overnight','plato tuyo · 4 raciones','430','/ración')}
    ${hit('🥚','Huevo','alimento · entero, crudo','143','/100 g')}
    <p class="mini" style="margin:11px 0 0">Escribe arriba para buscar entre las <b style="color:#e9f2ff">290</b> cosas que tienes.
    Ya no hay ninguna lista larga que recorrer.</p>
  </div>

  <div class="row" style="margin-top:12px">
    <button class="btn s">${svg('camara','ico sm')} escanear</button>
    <button class="btn s">${svg('lapiz','ico sm')} a mano</button>
    <button class="btn s">${svg('olla','ico sm')} lo que cociné</button>
  </div>
</main>`));

/* ---------- 3. El buscador, escribiendo ---------- */
writeFileSync('BuscarEscribiendo.dc.html', pagina(`${cab()}
<main>
  ${sub('Apuntar', 'Comida')}
  <div class="campo">${svg('lupa','ico')} <span>pollo</span><span class="cur"></span>
    <span style="margin-left:auto">${svg('equis','ico sm')}</span></div>
  <div class="chips">
    <span class="chipx on">todo <b>7</b></span>
    <span class="chipx">alimentos 2</span>
    <span class="chipx">productos 3</span>
    <span class="chipx">mis platos 2</span>
  </div>

  <div class="card" style="margin-top:12px">
    <div class="grp">alimentos</div>
    ${hit('🍗','Pechuga de pollo','cruda, sin piel','120','/100 g')}
    ${hit('🍗','Muslo de pollo','crudo, sin piel','130','/100 g')}
    <div class="grp">mis platos</div>
    ${hit('🍛','Pollo al curry con boniato','6 raciones · 34 g P','520','/ración')}
    ${hit('🍚','Arroz caldoso de pollo y garbanzos','4 raciones · 38 g P','520','/ración')}
    <div class="grp">mis productos</div>
    ${hit('🥡','Pollo asado','Mercadona','187','/100 g')}
    ${hit('🥫','Paté de pollo','Carrefour','290','/100 g')}
    ${hit('🌯','Burrito de pollo','100 Montaditos','245','/100 g')}
  </div>
</main>`));

/* ---------- 4. La hoja de cantidad: un toque y dentro ---------- */
writeFileSync('Cantidad.dc.html', pagina(`${cab()}
<main>
  ${sub('Apuntar', 'Comida')}
  <div class="campo" style="opacity:.45">${svg('lupa','ico')} <span style="color:#8fa6c6">pollo</span></div>

  <div class="hoja" style="margin-top:12px">
    <span class="tira"></span>
    <div class="row" style="align-items:flex-start;gap:11px">
      <span style="font-size:34px;line-height:1">🍗</span>
      <div style="flex:1;min-width:0">
        <b style="font-size:16px;display:block">Pechuga de pollo</b>
        <span class="mini">alimento · cruda, sin piel · 120 kcal /100 g</span>
      </div>
    </div>

    <div class="pasos">
      <button>−</button>
      <span class="val"><b>180</b><span>gramos</span></span>
      <button>+</button>
    </div>
    <div class="rac">
      <span>1 filete · 120 g</span><span class="on">180 g</span><span>100 g</span><span>1 pechuga · 250 g</span>
    </div>

    <div class="previa">
      <div><b>216</b><span>kcal</span></div>
      <div><b>40,5</b><span>prot. g</span></div>
      <div><b>0</b><span>carb. g</span></div>
      <div><b>4,7</b><span>grasa g</span></div>
    </div>

    <div class="row" style="margin-top:12px">
      <span class="chipx">desayuno</span><span class="chipx on">comida</span><span class="chipx">cena</span>
      <span class="chipx">otro…</span>
    </div>

    <button class="btn p big" style="margin-top:13px">${svg('mas','ico sm')} apuntar · te quedarán 1 628 kcal</button>
    <p class="mini" style="text-align:center;margin:9px 0 0">Aporta el <b style="color:#e9f2ff">27 %</b> de tu proteína del día.</p>
  </div>
</main>`));

/* ---------- 5. Cocina: qué hago hoy (nevera + ideas + platos, en una) ---------- */
writeFileSync('Cocina.dc.html', pagina(`${cab()}
<main>
  ${sub('Cocina', 'Comida')}
  <div class="pest">
    <span class="on">${svg('chispa','ico sm')} Qué hago hoy</span>
    <span>${svg('nevera','ico sm')} Nevera 10</span>
    <span>${svg('olla','ico sm')} En lote</span>
  </div>

  <p class="note" style="margin:0">Con lo que tienes en casa, y cuadrado con las <b>1 844 kcal</b> y los <b>98 g de proteína</b> que te quedan hoy.</p>

  <div class="card">
    <h2>Te sale entero <span class="mini">3</span></h2>
    <div class="idea buena">
      <h4>🍲 Lentejas estofadas <span class="tag b3">tienes todo</span></h4>
      <p class="por">4 raciones · 470 kcal y 26 g P por ración · 35 min</p>
    </div>
    <div class="idea buena">
      <h4>🍳 Tortilla de patata <span class="tag b3">tienes todo</span></h4>
      <p class="por">6 raciones · 310 kcal y 18 g P por ración · 25 min</p>
    </div>
  </div>

  <div class="card">
    <h2>Combinaciones ${svg('chispa','ico sm')}</h2>
    <p class="note" style="margin-bottom:2px">Armadas con lo que hay. Para una comida, no para el día entero.</p>
    <div class="idea buena">
      <h4>Pechuga de pollo con lenteja y brócoli</h4>
      <p class="por">658 kcal · 56 g P · cuadra con lo que te queda</p>
      <div class="row" style="margin-top:9px"><button class="btn s">guardar como plato</button><button class="btn s">apuntarlo ya</button></div>
    </div>
  </div>

  <div class="card">
    <h2>Te falta poco <span class="mini">2</span></h2>
    <div class="idea"><h4>🍛 Pollo al curry con boniato</h4>
      <p class="por">te falta: leche de coco, boniato</p>
      <div class="row" style="margin-top:9px"><button class="btn s">${svg('mas','ico sm')} a la compra</button></div></div>
  </div>
</main>`));

/* ---------- 6. Mis productos, rescatado de las 27 pantallas ---------- */
writeFileSync('Productos.dc.html', pagina(`${cab()}
<main>
  ${sub('Mis productos', 'Comida', '<span class="tag b2">188</span>')}
  <div class="campo">${svg('lupa','ico')} <span style="color:#8fa6c6">filtrar por nombre, marca o código…</span><span class="cur"></span></div>
  <div class="chips">
    <span class="chipx on">todos 188</span><span class="chipx">★ favoritos 4</span>
    <span class="chipx">Mercadona 96</span><span class="chipx">Carrefour 61</span>
  </div>
  <div class="card" style="margin-top:12px">
    ${hit('🥛','Leche entera','Mercadona · 1 L · ★','65','/100 g')}
    ${hit('🥛','Leche semidesnatada','Mercadona · 1 L · ★','47','/100 g')}
    ${hit('🥛','Leche desnatada','Mercadona · 1 L · ★','35','/100 g')}
    ${hit('🥣','Yogur natural','Mercadona · pack 4 · ★','61','/100 g')}
    ${hit('🥣','Yogur griego','Mercadona · pack 4','121','/100 g')}
    ${hit('🧀','Requesón','Mercadona · 250 g','97','/100 g')}
    ${hit('🍞','Pan de molde integral','Carrefour · 460 g','247','/100 g')}
    ${hit('🥜','Crema de cacahuete','Carrefour · 340 g','588','/100 g')}
    <p class="mini" style="margin:11px 0 0">y 180 más: escribe arriba para encontrarlo.
    Antes esta pantalla los pintaba <b style="color:#e9f2ff">todos</b> — 27 pantallas de scroll.</p>
  </div>
  <div class="row" style="margin-top:12px">
    <button class="btn s">${svg('camara','ico sm')} escanear uno nuevo</button>
    <button class="btn s">importar catálogo</button>
  </div>
</main>`));

/* ---------- 7. Micronutrientes, fuera de la portada ---------- */
writeFileSync('Micros.dc.html', pagina(`${cab()}
<main>
  ${sub('Micronutrientes', 'Comida', '<span class="tag b4">4 cortos</span>')}
  <p class="note" style="margin:0">Sobre la ingesta de referencia de un adulto, la de las etiquetas. Salen de 3 de tus 3 tomas de hoy.</p>
  <div class="card">
    <h2>Hoy vas corto de</h2>
    <div class="chips">
      <span class="chipx" style="border-color:color-mix(in srgb,#fb7185 45%,#1e2b44);color:#fb7185">Vitamina D 0 %</span>
      <span class="chipx" style="border-color:color-mix(in srgb,#fbbf24 45%,#1e2b44);color:#fbbf24">Calcio 7 %</span>
      <span class="chipx" style="border-color:color-mix(in srgb,#fbbf24 45%,#1e2b44);color:#fbbf24">Vit. C 13 %</span>
      <span class="chipx" style="border-color:color-mix(in srgb,#fbbf24 45%,#1e2b44);color:#fbbf24">B12 16 %</span>
    </div>
    <p class="note" style="margin:11px 0 6px"><b>Con esto lo cubres:</b></p>
    ${hit('🐟','Salmón','vit. D · 11 µg /100 g','208','/100 g')}
    ${hit('🥛','Leche entera','calcio · 113 mg /100 g','61','/100 g')}
    ${hit('🥝','Kiwi','vit. C · 93 mg /100 g','61','/100 g')}
  </div>
  <div class="card">
    <h2>Todos <span class="mini">9</span></h2>
    <div class="micros">
      ${mic('Hierro','4,4 / 14 mg',31)}${mic('Calcio','58 / 800 mg',7)}
      ${mic('Potasio','1 288 / 2 000 mg',64)}${mic('Magnesio','187 / 375 mg',50)}
      ${mic('Vit. C','10 / 80 mg',13)}${mic('Vit. D','0 / 5 µg',0)}
      ${mic('Vit. B12','0,4 / 2,5 µg',16)}${mic('Vit. B6','1,5 / 1,4 mg',107)}
      ${mic('Folato','65 / 200 µg',32)}
    </div>
    <p class="mini" style="margin:10px 0 0">No es una pauta médica: es la referencia genérica de un adulto.</p>
  </div>
</main>`));

console.log('7 maquetas escritas');
