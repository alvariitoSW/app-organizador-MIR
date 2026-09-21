import {writeFileSync} from 'node:fs';
import {svg, cab, sub, pagina, ring, macro} from '../comida/build.mjs';
import {EXTRA2, svg2} from './estilo.mjs';

/* svg() del juego anterior, ampliado con los iconos que faltaban */
const ico = (n, cls='ico') => svg2(n, cls) || svg(n, cls);

/* la barra de abajo cambia: «Compra» deja su sitio a «Comida», que se lo come todo */
const cabecera = () => cab().replace('>Compra<','>Comida<')
  .replace('class="on">☰ Más','>☰ Más').replace('<button >Comida<','<button class="on">Comida<');

const P = (cuerpo) => pagina(EXTRA2 + cuerpo);

/* ================= 1. la portada: el día arriba y la cadena de la semana ================= */
writeFileSync('Main.dc.html', P(`${cabecera()}
<main>
  <div class="card">
    <div class="row" style="justify-content:space-between;margin-bottom:11px">
      <div class="row" style="gap:6px"><button class="btn s">‹</button><b style="font-size:13.5px">lun 21 sep</b><button class="btn s">›</button></div>
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
      <span class="tx">Micronutrientes<small>6 por debajo de la mitad · vit. D, calcio…</small></span>
      ${svg('chevron','ico sm')}
    </button>
  </div>

  <button class="buscaz">${svg('lupa','ico')} <b>Apuntar algo</b> · busca entre todo <span class="kbd">290</span></button>

  <div class="card">
    <h2>Esta semana <span class="mini">del 21 al 27</span></h2>
    <p class="note" style="margin:0 0 4px">Lo de arriba manda en lo de abajo: cambias el menú y se recalculan las tandas y la compra.</p>
    <div class="cadena">
      <button class="eslabon m">
        <span class="pto">${svg('libro')}</span>
        <span class="tx"><b>Menú</b><span><em>6</em> tipos de día · <em>2 400</em> kcal/día planificadas</span></span>
        ${svg('chevron','ico sm ch')}
      </button>
      <button class="eslabon c">
        <span class="pto">${svg('olla')}</span>
        <span class="tx"><b>Cocina</b><span><em>5</em> tandas · <em>23</em> raciones · <em>2</em> platos te salen hoy</span></span>
        ${svg('chevron','ico sm ch')}
      </button>
      <button class="eslabon k">
        <span class="pto">${ico('lista')}</span>
        <span class="tx"><b>Compra</b><span><em>18</em> cosas · <em>7</em> ya las tienes</span></span>
        ${svg('chevron','ico sm ch')}
      </button>
    </div>
  </div>

  <div class="card">
    <h2>Lo de hoy <span class="mini">3 tomas</span></h2>
    <div class="mom">desayuno</div>
    <div class="toma"><span class="em">🍌</span><span class="nm"><b>Plátano</b><span>120 g</span></span><span class="kc">107</span></div>
    <div class="toma"><span class="em">🌾</span><span class="nm"><b>Copos de avena</b><span>60 g</span></span><span class="kc">233</span></div>
    <div class="mom">comida</div>
    <div class="toma"><span class="em">🍗</span><span class="nm"><b>Pechuga de pollo</b><span>cruda · 180 g</span></span><span class="kc">216</span></div>
  </div>

  <div class="puertas">
    <button class="puerta">${svg('libro')}<b>Mis platos</b><span class="s">16 guardados</span></button>
    <button class="puerta">${svg('nevera')}<b>Mi nevera</b><span class="s">10 cosas</span></button>
    <button class="puerta">${svg('pastilla')}<b>Alimentos</b><span class="s">86 con micros</span></button>
  </div>
</main>`));

/* ================= 2. la compra ================= */
const linea = (q, item, de, ok) => `
<div class="linea${ok?' ok':''}"><span class="box"></span>
  <span class="tx"><b>${q?`<span class="q">${q}</span> `:''}${item}</b>${de?`<span class="de"><i></i>${de}</span>`:''}</span></div>`;

writeFileSync('Compra.dc.html', P(`${cabecera()}
<main>
  ${sub('Compra','Comida','<span class="tag b2">7 / 18</span>')}
  <div class="card">
    <div class="prog"><span class="bar"><i style="width:39%"></i></span><b>7 de 18</b></div>
    <p class="note" style="margin:0">Lo fresco sale de las tandas de esta semana; lo de rutina, de tus listas. Marca lo que eches al carro.</p>
    <div style="margin-top:6px">
      <button class="seccion"><b>Fresco de esta semana</b><span class="n">7</span>${svg('chevron','ico sm ch')}</button>
      ${linea('900 g','pechuga de pollo','2 tandas · pollo al curry')}
      ${linea('500 g','lentejas','1 tanda · lentejas de bote')}
      ${linea('6','cebollas','3 recetas',true)}
      ${linea('1 kg','patata','2 recetas')}
      ${linea('400 g','brócoli','1 tanda · salteado')}
      ${linea('12','huevos','2 recetas',true)}
      ${linea('','sal gorda','al gusto',true)}
    </div>
    <div style="margin-top:4px">
      <button class="seccion"><b>De rutina</b><span class="n">8</span>${svg('chevron','ico sm ch')}</button>
      ${linea('','leche semidesnatada','',true)}
      ${linea('','café molido','')}
      ${linea('','yogur natural ×8','',true)}
      <p class="mini" style="margin:8px 0 0;padding-left:31px">y 5 más de «la compra de siempre»</p>
    </div>
    <div style="margin-top:4px">
      <button class="seccion"><b>Básicos del desayuno</b><span class="n">3</span>${svg('chevron','ico sm ch')}</button>
      ${linea('5×','🥤 batido de whey','viene en comida armada',true)}
      ${linea('7×','🍎 fruta de diario','')}
      ${linea('1','café de la máquina','')}
    </div>
  </div>
  <div class="row">
    <button class="btn s">${svg('equis','ico sm')} limpiar marcados</button>
    <button class="btn s">imprimir</button>
    <span class="sp"></span>
    <button class="btn s">mis listas <span class="mini">(4)</span></button>
  </div>
</main>`));

/* ================= 3. el menú de la semana ================= */
const dia = (d, ico, tipo, hoy) => `<div${hoy?' class="hoy"':''}><span>${d}</span><em>${ico}</em><b>${tipo}</b></div>`;
const tipoFila = (ico, nom, horas, tomas, kcal) => `
<div class="hit"><span class="em">${ico}</span>
  <span class="nm"><b>${nom}</b><span>${horas} · ${tomas} tomas</span></span>
  <span class="kc">${kcal}<small>kcal/día</small></span>${svg('chevron','ico sm')}</div>`;

writeFileSync('Menu.dc.html', P(`${cabecera()}
<main>
  ${sub('Menú','Comida','<span class="tag b2">6 tipos</span>')}
  <div class="card">
    <h2>Qué te toca comer esta semana</h2>
    <div class="tirasem">
      ${dia('L','🩺','guard.',true)}${dia('M','😴','sal.')}${dia('X','🏥','diario')}
      ${dia('J','🏥','diario')}${dia('V','🏥','diario')}${dia('S','🏖','libre')}${dia('D','🍳','libre')}
    </div>
    <p class="mini" style="margin:9px 0 0">Sale de tu rotación: el menú va pegado al tipo de día, no a la fecha.</p>
  </div>
  <div class="card">
    <h2>Tus tipos de día <span class="mini">toca uno para cambiar sus comidas</span></h2>
    ${tipoFila('🩺','Guardia','08:00–08:00',5,'2 400')}
    ${tipoFila('😴','Saliente','—',3,'1 700')}
    ${tipoFila('🏥','Diario','08:00–15:00',5,'2 300')}
    ${tipoFila('🏋','Diario + gym','08:00–15:00',6,'2 650')}
    ${tipoFila('🏖','Libre','—',4,'2 100')}
    ${tipoFila('🍳','Finde','—',4,'2 200')}
  </div>
  <div class="row">
    <button class="btn s">${ico('caja','ico sm')} comidas armadas <span class="mini">(5)</span></button>
    <button class="btn s">${svg('libro','ico sm')} mis platos <span class="mini">(16)</span></button>
  </div>
</main>`));

/* ================= 4. el menú de un día ================= */
const toma2 = (hora, et, kc, cuerpo, acc) => `
<div class="toma2">
  <div class="cab"><span class="hora">${hora}</span><span class="et">${et}</span><span class="kc">${kc}</span></div>
  <div class="cuerpo">${cuerpo}</div>
  <div class="acc">${acc}</div>
</div>`;

writeFileSync('MenuDia.dc.html', P(`${cabecera()}
<main>
  ${sub('🩺 Guardia','Menú','<span class="tag b2">2 400 kcal</span>')}
  <div class="card">
    <div class="row" style="justify-content:space-between">
      <span class="mini">08:00–08:00 · carga alta</span>
      <span class="row" style="gap:6px"><span class="tag b3">148 g P</span><span class="tag">6 rac./día</span></span>
    </div>
    ${toma2('08:00','desayuno','520 kcal',
      '<span class="pl arm">🍱 táper de guardia <b>2 rac</b></span>',
      '<span class="mini2">editar la comida armada</span><span class="mini2">montar suelto</span>')}
    ${toma2('14:00','comida','740 kcal',
      '<span class="pl">🍲 Lentejas de bote <b>1</b></span><span class="pl">🥗 Ensalada de tomate <b>0,5</b></span>',
      '<span class="mini2">+ plato</span><span class="mini2">guardar como comida</span>')}
    ${toma2('21:00','cena','610 kcal',
      '<span class="pl">🍗 Pollo al curry <b>1</b></span><span class="pl">🍚 Arroz blanco <b>1</b></span>',
      '<span class="mini2">+ plato</span><span class="mini2">guardar como comida</span>')}
    ${toma2('03:00','tentempié de guardia','290 kcal',
      '<span class="pl">🥤 Batido de whey <b>1</b></span><span class="pl">🍌 Plátano <b>1</b></span>',
      '<span class="mini2">+ plato</span>')}
    <div class="row" style="margin-top:11px">
      <button class="btn s">+ comida</button>
      <button class="btn s">nombre y horario</button>
      <button class="btn s">duplicar día</button>
    </div>
  </div>
</main>`));

/* ================= 5. cocina ================= */
writeFileSync('Cocina.dc.html', P(`${cabecera()}
<main>
  ${sub('Cocina','Comida')}
  <div class="pest"><span class="on">Qué hago hoy</span><span>Mi nevera 10</span><span>Tandas 5</span></div>
  <p class="note" style="margin:0">Con las 10 cosas de tu nevera, y cuadrado con las <b>1 844 kcal</b> y los <b>98 g de proteína</b> que te quedan hoy.</p>
  <div class="card">
    <h2>Te sale entero <span class="mini">2</span></h2>
    <div class="idea buena">
      <h4>🍲 Lentejas de bote <span class="tag b3">tienes todo</span></h4>
      <p class="por">4 raciones · 430 kcal y 24 g P por ración</p>
      <div class="row" style="margin-top:9px"><button class="btn s">${svg('olla','ico sm')} cocinar</button></div>
    </div>
    <div class="idea buena">
      <h4>🍳 Tortilla de patata <span class="tag b3">tienes todo</span></h4>
      <p class="por">3 raciones · 380 kcal y 14 g P por ración</p>
      <div class="row" style="margin-top:9px"><button class="btn s">${svg('olla','ico sm')} cocinar</button></div>
    </div>
  </div>
  <div class="card">
    <h2>Combinaciones ${svg('chispa','ico sm')}</h2>
    <p class="note" style="margin-bottom:2px">Armadas con lo que tienes. Para una comida, no para el día entero.</p>
    <div class="idea buena">
      <h4>Pollo con arroz y brócoli</h4>
      <p class="por">612 kcal · 48 g P · 63 g C · 14 g G · cuadra con lo que te queda</p>
      <div class="row" style="margin-top:9px"><button class="btn s">guardar como plato</button><button class="btn s">apuntarlo ya</button></div>
    </div>
  </div>
  <div class="card">
    <h2>Te falta poco <span class="mini">2</span></h2>
    <div class="idea"><h4>🍛 Pollo al curry</h4><p class="por">te falta: leche de coco, curry</p>
      <div class="row" style="margin-top:9px"><button class="btn s">+ a la compra</button></div></div>
  </div>
</main>`));

/* ================= 6. tandas (la cocina en lote, rehecha) ================= */
const fila = (em, nom, sub2) => `<div class="fila"><span class="em">${em}</span>
  <span class="nm"><b>${nom}</b><span>${sub2}</span></span><span class="mini2">cocinar</span></div>`;

writeFileSync('Tandas.dc.html', P(`${cabecera()}
<main>
  ${sub('Tandas','Cocina','<span class="tag b2">5</span>')}
  <p class="note" style="margin:0">Las sesiones de cocina de esta semana: qué pones al fuego cada día y cuántos tápers salen.</p>
  <div class="tanda">
    <button class="th"><span><span class="dia">Domingo por la tarde</span>
      <span class="sub">4 platos · para lunes, martes y miércoles</span></span>
      <span class="rac">14 raciones</span></button>
    <div class="tb">
      ${fila('🍲','Lentejas de bote','4 raciones · 430 kcal')}
      ${fila('🍗','Pollo al curry','4 raciones · 520 kcal')}
      ${fila('🍚','Arroz blanco','4 raciones · 210 kcal')}
      ${fila('🥦','Brócoli al vapor','2 raciones · 90 kcal')}
    </div>
  </div>
  <div class="tanda">
    <button class="th"><span><span class="dia">Miércoles noche</span>
      <span class="sub">2 platos · para jueves y viernes</span></span>
      <span class="rac">6 raciones</span>${svg('chevron','ico sm')}</button>
  </div>
  <div class="tanda">
    <button class="th"><span><span class="dia">Viernes</span>
      <span class="sub">1 plato · para el finde</span></span>
      <span class="rac">3 raciones</span>${svg('chevron','ico sm')}</button>
  </div>
  <p class="mini" style="margin:11px 0 0">Las tandas salen del menú: si cambias lo que come un tipo de día, esto y la compra se recalculan solos.</p>
</main>`));

/* ================= 7. mis platos (catálogo y mis platos, que hoy son dos) ================= */
const plato = (em, nom, sub2, kc) => `<div class="hit"><span class="em">${em}</span>
  <span class="nm"><b>${nom}</b><span>${sub2}</span></span>
  <span class="kc">${kc}<small>/ración</small></span><span class="add">${svg('olla','ico sm')}</span></div>`;

writeFileSync('Platos.dc.html', P(`${cabecera()}
<main>
  ${sub('Mis platos','Comida','<span class="tag b2">16</span>')}
  <div class="pest"><span class="on">Todos</span><span>Qué me apetece</span><span>Importar</span></div>
  <div class="campo">${svg('lupa','ico sm')} <span style="color:#8fa6c6">buscar entre tus platos…</span></div>
  <div class="card" style="margin-top:11px">
    ${plato('🍲','Lentejas de bote','4 raciones · 24 g P','430')}
    ${plato('🍗','Pollo al curry','4 raciones · 38 g P','520')}
    ${plato('🍳','Tortilla de patata','3 raciones · 14 g P','380')}
    ${plato('🥗','Ensalada de tomate','2 raciones · 4 g P','120')}
    ${plato('🍚','Arroz blanco','4 raciones · 5 g P','210')}
    <p class="mini" style="margin:11px 0 0">y 11 más: escribe arriba para encontrarlo.</p>
  </div>
  <div class="row">
    <button class="btn p">${svg('mas','ico sm')} con ingredientes</button>
    <button class="btn s">a mano</button>
    <button class="btn s">${ico('importar','ico sm')} de un vídeo</button>
  </div>
  <p class="mini" style="margin:8px 0 0">Antes esto eran dos pantallas: «Catálogo de platos» en Días y menús y «Mis platos» en Comida, con los mismos 16 platos y cada una con su buscador.</p>
</main>`));

console.log('7 maquetas escritas');
