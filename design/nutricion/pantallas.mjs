import {writeFileSync} from 'node:fs';
import {svg,cab,sub,pagina,ring,macro,mic} from './build.mjs';

/* ---------- 1. El día, ahora con micros ---------- */
const LOG=[['08:10','Porridge overnight','avena, yogur griego, plátano',430],
 ['11:00','Café con leche','',90],['14:30','Pollo al curry con boniato','táper del domingo',620],
 ['17:00','Manzana y nueces','',210]];
writeFileSync('Dia.dc.html',pagina(`${cab()}
<main>
  <div class="card">
    <div class="row" style="justify-content:space-between;margin-bottom:11px">
      <div class="row" style="gap:6px"><button class="btn s">‹</button><b style="font-size:13.5px">jue 17 sep</b><button class="btn s">›</button></div>
      <span class="tag b2">🩺 Guardia</span>
    </div>
    <div class="ringrow">
      ${ring(0.66,'1 350','de 2 040')}
      <div class="macros">
        ${macro('proteína','96 / 150 g',64,'p')}
        ${macro('carbohidratos','142 / 230 g',62,'c')}
        ${macro('grasa','48 / 68 g',70,'g')}
      </div>
    </div>
    <button class="btn p big" style="margin-top:13px">${svg('mas','ico sm')} apuntar comida</button>
  </div>

  <div class="card">
    <h2>Micronutrientes de hoy</h2>
    <p class="note" style="margin-bottom:0">Sobre la ingesta de referencia para un adulto. Toca uno para ver de qué alimento sale.</p>
    <div class="micros">
      ${mic('Hierro','8,2 / 11 mg',75)}${mic('Calcio','640 / 1000 mg',64)}
      ${mic('Vit. C','88 / 80 mg',110)}${mic('Vit. D','1,2 / 15 µg',8)}
      ${mic('Potasio','2 100 / 3 500 mg',60)}${mic('Vit. B12','3,1 / 4 µg',78)}
    </div>
    <p class="note" style="margin:11px 0 6px"><b>Hoy vas corto de:</b></p>
    <div class="falta"><span class="tag">Vitamina D</span><span class="tag">Potasio</span><span class="tag">Calcio</span></div>
    <button class="btn s" style="margin-top:10px">${svg('chispa','ico sm')} qué comer para cubrirlo</button>
  </div>

  <div class="card">
    <h2>Lo de hoy <span class="mini">4 tomas</span></h2>
    ${LOG.map(([h,n,s,k])=>`<div class="alim"><span class="kc" style="width:38px">${h}</span>
      <span class="nm"><b>${n}</b>${s?`<span class="mini">${s}</span>`:''}</span><span class="kc">${k}</span></div>`).join('')}
  </div>

  <div class="tiles">
    <button class="tile">${svg('manzana')}<b>Alimentos</b><span class="n">184</span><span class="s">kcal y micros</span></button>
    <button class="tile">${svg('nevera')}<b>Mi nevera</b><span class="n">12</span><span class="s">cosas en casa</span></button>
    <button class="tile">${svg('chispa')}<b>Ideas</b><span class="n">5</span><span class="s">con lo que tienes</span></button>
    <button class="tile">${svg('libro')}<b>Mis platos</b><span class="n">16</span><span class="s">crear y editar</span></button>
  </div>
</main>`));

/* ---------- 2. Alimentos: el buscador ---------- */
const ALIM=[['🍎','Manzana','fruta fresca','52 kcal'],['🍌','Plátano','fruta fresca','89 kcal'],
 ['🥦','Brócoli','verdura','34 kcal'],['🍗','Pechuga de pollo','carne, cruda','165 kcal'],
 ['🐟','Salmón','pescado azul, crudo','208 kcal'],['🥚','Huevo','entero, crudo','143 kcal'],
 ['🫘','Lenteja','legumbre, cruda','352 kcal'],['🥛','Leche entera','lácteo','61 kcal'],
 ['🌰','Nuez','fruto seco','654 kcal'],['🍚','Arroz blanco','cereal, crudo','360 kcal']];
writeFileSync('Alimentos.dc.html',pagina(`${cab()}
<main>
  ${sub('Alimentos','Comida','<span class="tag b2">184</span>')}
  <p class="note" style="margin:0">Alimentos de verdad, no productos de marca: lo que compras a peso. Cada uno con sus kcal, sus macros y sus micronutrientes por 100 g.</p>
  <div class="buscador">${svg('lupa','ico sm')} plátano</div>
  <div class="chips">
    <span class="chipx" style="border-color:color-mix(in srgb,#38e1ff 45%,#1e2b44)">todo</span>
    <span class="chipx">🍎 fruta</span><span class="chipx">🥦 verdura</span><span class="chipx">🍗 carne</span>
    <span class="chipx">🐟 pescado</span><span class="chipx">🫘 legumbre</span><span class="chipx">🥛 lácteo</span>
  </div>
  <div class="card" style="margin-top:11px">
    ${ALIM.map(([e,n,s,k])=>`<button class="alim"><span class="em">${e}</span>
      <span class="nm"><b>${n}</b><span class="mini">${s}</span></span>
      <span class="kc">${k}</span>${svg('chevron','ico sm')}</button>`).join('')}
  </div>
  <div class="row" style="margin-top:11px">
    <button class="btn s">${svg('mas','ico sm')} añadir un alimento mío</button>
    <button class="btn s">${svg('camara','ico sm')} escanear un producto</button>
  </div>
</main>`));

/* ---------- 3. Ficha de un alimento ---------- */
writeFileSync('Ficha.dc.html',pagina(`${cab()}
<main>
  ${sub('Plátano','Alimentos')}
  <div class="card">
    <div class="row" style="justify-content:space-between;align-items:flex-start">
      <div><div style="font-size:40px;line-height:1">🍌</div>
        <p class="mini" style="margin:4px 0 0">fruta fresca · crudo</p></div>
      <span class="fuente usda">✓ USDA FoodData Central</span>
    </div>
    <div class="row" style="margin-top:10px;gap:6px">
      <span class="chipx" style="border-color:color-mix(in srgb,#38e1ff 45%,#1e2b44)">100 g</span>
      <span class="chipx">1 pieza (118 g)</span><span class="chipx">1 rodaja</span>
    </div>
    <div class="tot">
      <div><b>89</b><span>kcal</span></div><div><b>1,1</b><span>prot. g</span></div>
      <div><b>23</b><span>carb. g</span></div><div><b>0,3</b><span>grasa g</span></div>
    </div>
    <p class="mini" style="margin:9px 0 0">de los 23 g de carbohidrato, 12 g son azúcares y 2,6 g fibra</p>
  </div>
  <div class="card">
    <h2>Micronutrientes <span class="mini">por 100 g</span></h2>
    <div class="micros">
      ${mic('Potasio','358 mg',10)}${mic('Vit. B6','0,37 mg',26)}
      ${mic('Vit. C','8,7 mg',11)}${mic('Magnesio','27 mg',7)}
      ${mic('Folato','20 µg',10)}${mic('Manganeso','0,27 mg',13)}
    </div>
    <p class="mini" style="margin:10px 0 0">La barra es el % de la ingesta de referencia diaria de un adulto. El plátano destaca en potasio y B6.</p>
  </div>
  <div class="card">
    <h2>Dónde lo usas</h2>
    <p class="note" style="margin-bottom:8px">En 3 de tus platos</p>
    <div class="chips"><span class="chipx">🥣 Porridge overnight</span><span class="chipx">🥤 Batido post-entreno</span><span class="chipx">🍎 Fruta y frutos secos</span></div>
  </div>
  <div class="row" style="margin-top:12px">
    <button class="btn p" style="flex:1">${svg('mas','ico sm')} apuntar que me lo he comido</button>
    <button class="btn s">${svg('nevera','ico sm')} a la nevera</button>
  </div>
</main>`));

/* ---------- 4. Mi nevera ---------- */
writeFileSync('Nevera.dc.html',pagina(`${cab()}
<main>
  ${sub('Mi nevera','Comida','<span class="tag b2">12</span>')}
  <p class="note" style="margin:0">Lo que tienes en casa ahora mismo. Con esto la app te dice qué puedes cocinar y te propone combinaciones.</p>
  <div class="buscador">${svg('lupa','ico sm')} añadir algo que tengas…</div>
  <div class="card" style="margin-top:11px">
    <h2>En casa</h2>
    <div class="chips">
      ${['🥚 Huevos','🍗 Pechuga de pollo','🍚 Arroz','🫘 Lentejas','🥦 Brócoli','🧅 Cebolla','🥔 Patata','🍅 Tomate','🧄 Ajo','🫒 Aceite de oliva','🥛 Leche','🍌 Plátanos']
        .map(x=>`<span class="chipx">${x}<button>×</button></span>`).join('')}
    </div>
    <div class="row" style="margin-top:11px">
      <button class="btn s">${svg('lapiz','ico sm')} de mi lista de la compra</button>
      <button class="btn s">vaciar</button>
    </div>
  </div>
  <button class="btn p big" style="margin-top:12px">${svg('chispa','ico sm')} dame ideas con esto</button>
</main>`));

/* ---------- 5. Ideas con lo que hay ---------- */
writeFileSync('Ideas.dc.html',pagina(`${cab()}
<main>
  ${sub('Ideas con lo que tienes','Comida')}
  <p class="note" style="margin:0">Con las 12 cosas de tu nevera. Cuadradas contra lo que te queda hoy: <b>690 kcal</b> y <b>54 g de proteína</b>.</p>

  <div class="card">
    <h2>Tus platos, enteros</h2>
    <div class="idea buena">
      <h4>🍲 Lentejas estofadas <span class="tag b3">sale entero</span></h4>
      <p class="por">4 raciones · 480 kcal y 26 g P por ración</p>
    </div>
    <div class="idea buena">
      <h4>🍳 Tortilla de patata <span class="tag b3">sale entero</span></h4>
      <p class="por">6 raciones · 310 kcal y 12 g P por ración</p>
    </div>
  </div>

  <div class="card">
    <h2>Combinaciones nuevas ${svg('chispa','ico sm')}</h2>
    <p class="note" style="margin-bottom:4px">Armadas con lo que tienes, no son platos guardados. Si te gusta una, la guardas como plato.</p>
    <div class="idea buena">
      <h4>Pollo con arroz y brócoli</h4>
      <p class="por">640 kcal · 52 g P · cubre el hueco de hoy casi exacto</p>
      <div class="ingr"><span>pechuga de pollo</span><b>180 g</b></div>
      <div class="ingr"><span>arroz</span><b>70 g en crudo</b></div>
      <div class="ingr"><span>brócoli</span><b>150 g</b></div>
      <div class="ingr"><span>aceite de oliva</span><b>10 ml</b></div>
      <div class="row" style="margin-top:9px"><button class="btn s">guardar como plato</button><button class="btn s">apuntarlo ya</button></div>
    </div>
    <div class="idea">
      <h4>Revuelto de huevo con patata y cebolla</h4>
      <p class="por">520 kcal · 28 g P · te quedarías corto de proteína</p>
      <div class="row" style="margin-top:9px"><button class="btn s">ver ingredientes</button></div>
    </div>
  </div>

  <div class="card">
    <h2>Te falta poco</h2>
    <div class="idea">
      <h4>🍛 Pollo al curry con boniato</h4>
      <p class="por">te falta: leche de coco, boniato</p>
      <div class="row" style="margin-top:9px"><button class="btn s">${svg('mas','ico sm')} a la compra</button></div>
    </div>
  </div>
</main>`));

/* ---------- 6. Crear un plato ---------- */
writeFileSync('CrearPlato.dc.html',pagina(`${cab()}
<main>
  ${sub('Nuevo plato','Mis platos')}
  <div class="card">
    <div class="row">
      <label class="fld" style="flex:0 0 58px">icono<input value="🍲"></label>
      <label class="fld" style="flex:1 1 150px">nombre<input value="Pollo con arroz y brócoli"></label>
      <label class="fld" style="flex:0 0 88px">raciones<input value="2"></label>
    </div>
  </div>
  <div class="card">
    <h2>Ingredientes</h2>
    <p class="note" style="margin-bottom:6px">Búscalos en Alimentos y las kcal, los macros y los micros salen solos. No hay que teclear ningún número.</p>
    <div class="ingr"><span>🍗 pechuga de pollo</span><b>360 g</b></div>
    <div class="ingr"><span>🍚 arroz blanco</span><b>140 g</b></div>
    <div class="ingr"><span>🥦 brócoli</span><b>300 g</b></div>
    <div class="ingr"><span>🫒 aceite de oliva</span><b>20 ml</b></div>
    <div class="buscador">${svg('lupa','ico sm')} añadir un ingrediente…</div>
  </div>
  <div class="card">
    <h2>Sale a <span class="mini">por ración</span></h2>
    <div class="tot">
      <div><b>640</b><span>kcal</span></div><div><b>52</b><span>prot. g</span></div>
      <div><b>61</b><span>carb. g</span></div><div><b>17</b><span>grasa g</span></div>
    </div>
    <div class="micros">
      ${mic('Hierro','3,1 mg',28)}${mic('Potasio','1 240 mg',35)}
      ${mic('Vit. C','132 mg',165)}${mic('Calcio','98 mg',10)}
    </div>
    <p class="mini" style="margin:10px 0 0">Calculado con los 4 ingredientes. <span class="fuente">3 de tabla propia · 1 de USDA</span></p>
  </div>
  <div class="card">
    <h2>Pasos <span class="mini">opcional</span></h2>
    <p class="note" style="margin:0">Si los escribes, luego tienes el modo cocina paso a paso con las cantidades escaladas.</p>
  </div>
  <button class="btn p big" style="margin-top:12px">guardar el plato</button>
</main>`));
console.log('6 maquetas escritas');
