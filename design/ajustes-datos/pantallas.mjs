import {writeFileSync} from 'node:fs';
import {svg, sub, pagina} from '../comida/build.mjs';
import {EXTRA3, svg3} from './estilo.mjs';

const ico = (n, cls='ico') => svg3(n, cls) || svg(n, cls);
const P = (cuerpo) => pagina(EXTRA3 + cuerpo);

/* la barra: «☰ Más» encendido, que es de donde cuelgan estas tres secciones */
const cabecera = () => `
<header>
  <div class="hwrap">
    <h1><svg viewBox="0 0 24 24" fill="none" stroke="#38e1ff" stroke-width="2" stroke-linecap="round" style="width:22px;height:22px;flex:none"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>Guardias · rotación y cocina</h1>
    <nav>${['Calendario','Entreno','Comer','☰ Más'].map(t=>`<button class="${t==='☰ Más'?'on':''}">${t}</button>`).join('')}</nav>
  </div>
</header>`;

const cat = (c, t) => `<span><i style="background:${c}"></i>${t}</span>`;
const puerta = (i, tit, sub2) =>
  `<button class="puerta">${ico(i,'gico')}<b>${tit}</b><span class="s">${sub2}</span></button>`;

/* ===================== 1. Ajustes: la portada ===================== */
writeFileSync('Main.dc.html', P(`${cabecera()}
<main>
  <div class="subcab"><h2 class="subtit">⚙️ Ajustes</h2></div>

  <div class="card">
    <h2>Qué tienes encendido</h2>
    <div class="estado"><span class="em">📅</span><span class="tx"><b>Calendario del móvil</b></span><span class="vl">aviso 30 min antes</span></div>
    <div class="estado"><span class="em">☀️</span><span class="tx"><b>Dónde estoy</b></span><span class="vl">Las Palmas</span></div>
    <div class="estado"><span class="em">🛌</span><span class="tx"><b>Sueño</b></span><span class="vl">mínimo 7 h</span></div>
    <div class="estado"><span class="em">🔗</span><span class="tx"><b>Lector de enlaces</b></span><span class="vl off">apagado</span></div>
  </div>

  <div class="puertas">
    ${puerta('calendario','Calendario','y los avisos')}
    ${puerta('sol','El sol','Las Palmas')}
    ${puerta('pincel','Cómo se ve','oscuro · la franja')}
  </div>
  <div class="puertas" style="margin-top:9px">
    ${puerta('cama','Sueño','mínimo 7 h')}
    ${puerta('enlace','Lector','de enlaces')}
    ${puerta('manzana','Alimentos','tabla local')}
  </div>

  <p class="mini" style="margin:13px 0 0">Los horarios de cada tipo de día, las guardias y tus rotaciones
  están en <b style="color:#e9f2ff">Turno y rotación</b>. Importar y sacar datos, en <b style="color:#e9f2ff">Datos</b>.</p>
</main>`));

/* ===================== 2. Calendario del móvil: las tres tarjetas, fundidas ===================== */
writeFileSync('Calendario.dc.html', P(`${cabecera()}
<main>
  ${sub('📅 Calendario del móvil','Ajustes')}

  <div class="card">
    <h2>Qué se manda, y cómo te avisa</h2>
    <p class="note" style="margin:0">Esta app no tiene servidor, así que no puede darte un toque con el móvil
    bloqueado. Lo que hace es meter cada cosa en el calendario del teléfono <b>con su alarma</b>: de avisarte se
    encarga él, con la app cerrada.</p>
    <div class="cats">
      ${cat('#38e1ff','🩺 guardias')}${cat('#8fa6c6','💼 trabajo')}${cat('#34d399','💪 entrenos')}
      ${cat('#fbbf24','💶 recibos')}${cat('#a78bfa','📝 tareas con día')}${cat('#fb7185','📌 eventos')}
    </div>
    <label class="fld" style="max-width:250px;margin-top:11px">Avisar antes de cada cosa
      <input value="30 minutos"></label>
    <p class="mini" style="margin:9px 0 0">Vacaciones, salientes y días libres <b style="color:#e9f2ff">no</b> salen: se quedan en la app.</p>
  </div>

  <div class="card">
    <h2>${'Llevarlo al calendario'}</h2>
    <div class="row">
      <label class="fld" style="flex:1 1 130px">desde<input value="01/09/2026"></label>
      <label class="fld" style="flex:1 1 130px">hasta<input value="31/12/2026"></label>
    </div>
    <div class="row" style="margin-top:9px">
      <button class="btn p">${ico('bajar','ico sm')} descargar el .ics</button>
      <button class="btn s">ver la lista</button>
    </div>
    <p class="mini" style="margin:9px 0 0"><b style="color:#e9f2ff">118 citas</b> en ese rango · 41 guardias, 52 trabajos, 12 entrenos, 8 recibos, 5 tareas</p>
    <div class="row" style="margin-top:11px">
      <label class="fld" style="flex:1 1 200px">nombre del cuaderno<input value="Guardias · sep–dic"></label>
      <label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn s">poner</button></label>
    </div>
    <label class="fld" style="margin-top:8px;flex-direction:row;align-items:center;gap:6px;font-size:12px;text-transform:none;font-weight:400">
      <input type="checkbox" checked style="width:auto"><span>etiquetarlos para poder ocultarlos luego en Google</span></label>
  </div>

  <div class="card">
    <h2>Traer un calendario de fuera</h2>
    <p class="note" style="margin:0 0 9px">Sube el <code>.ics</code> que te den en el hospital y la app te dice qué
    días cambia antes de tocar nada.</p>
    <div class="row"><button class="btn s">${ico('subir','ico sm')} subir un .ics</button>
      <button class="btn s">pegar el texto</button></div>
  </div>
</main>`));

/* ===================== 3. Eventos: sección propia, y con cuánto dura ===================== */
const ev = (d, m, t, s2, dur='') => `<div class="ev"><div class="fch"><em>${d}</em><span>${m}</span></div>
  <div class="tx"><b>${t}</b><span>${s2}</span></div>${dur?`<span class="vl" style="font-size:11px;font-weight:800;color:#8fa6c6;white-space:nowrap">${dur}</span>`:''}<button class="x">✕</button></div>`;
writeFileSync('Eventos.dc.html', P(`${cabecera()}
<main>
  <div class="subcab"><h2 class="subtit">📌 Eventos</h2><span class="tag b2">6 apuntados</span></div>

  <div class="card">
    <h2>Lo que viene</h2>
    ${ev('24','sep','Presentación en rayos','jue · <b style="color:#e9f2ff">08:30 – 11:00</b>','2 h 30')}
    ${ev('01','oct','Pagar el alquiler','todos los meses · 520 €')}
    ${ev('09','oct','Curso de ecografía','vie · <b style="color:#e9f2ff">16:00 – 20:00</b>','4 h')}
    ${ev('17','oct','Cumple de Marta','sáb · todo el día')}
    <div class="row" style="margin-top:11px"><button class="btn p">+ añadir un evento</button></div>
  </div>

  <div class="card">
    <h2>Todas las semanas</h2>
    <p class="note" style="margin:0 0 9px">Lo que se repite sin fecha: la sesión de los jueves, el grupo de guardia.</p>
    <div class="estado"><span class="em">📚</span><span class="tx"><b>Sesión clínica</b></span><span class="vl">jue · 08:15 – 09:00</span></div>
    <div class="estado"><span class="em">🧺</span><span class="tx"><b>Lavadora</b></span><span class="vl">domingos</span></div>
    <div class="row" style="margin-top:11px"><button class="btn s">+ uno semanal</button></div>
  </div>

  <p class="mini" style="margin:13px 0 0">Todo lo de aquí sale en <b style="color:#e9f2ff">Mes</b>, en <b style="color:#e9f2ff">Hoy</b>
  y en el <b style="color:#e9f2ff">.ics</b> con su alarma y con el rato que ocupa.</p>
</main>`));

/* ===================== 3b. Un evento: desde, hasta y cuánto ocupa el día ===================== */
writeFileSync('EventoNuevo.dc.html', P(`${cabecera()}
<main>
  ${sub('Presentación en rayos','Eventos')}

  <div class="card">
    <h2>Cuándo es</h2>
    <div class="row">
      <label class="fld" style="flex:0 0 150px">qué día<input value="24/09/2026"></label>
      <label class="fld" style="flex:0 0 54px">color<input value="#a78bfa" style="height:30px"></label>
    </div>
    <div class="row" style="margin-top:8px">
      <label class="fld" style="flex:1 1 110px">desde<input value="08:30"></label>
      <label class="fld" style="flex:1 1 110px">hasta<input value="11:00"></label>
    </div>
    <div class="duras">
      <button>sin hora de fin</button><button>1 h</button><button class="on">2 h 30</button>
      <button>3 h</button><button>toda la mañana</button><button>todo el día</button>
    </div>
    <p class="mini" style="margin:9px 0 0">Con la hora de fin puesta, el calendario del móvil te <b style="color:#e9f2ff">reserva el hueco</b>
    en vez de meter una cita suelta de una hora.</p>
  </div>

  <div class="card">
    <h2>Cómo te queda el jueves</h2>
    <div class="franja">
      <i style="left:0;width:5.6%;background:#4c5b7a"></i>
      <i style="left:11.1%;width:38.9%;background:#38e1ff;opacity:.8"></i>
      <i class="pt" style="left:27.8%;background:#34d399"></i>
      <i class="pt" style="left:47.2%;background:#34d399"></i>
      <i class="pt" style="left:83.3%;background:#34d399"></i>
      <i style="left:94.4%;width:5.6%;background:#4c5b7a"></i>
      <i style="left:13.9%;width:13.9%;background:#a78bfa;border-radius:5px;top:3px;bottom:3px;box-shadow:0 0 0 1.5px #0b1220"></i>
      <div class="hrs"><span>6</span><span>9</span><span>12</span><span>15</span><span>18</span><span>21</span></div>
    </div>
    <div class="cats">
      ${cat('#a78bfa','📌 la presentación · 08:30–11:00')}${cat('#38e1ff','💼 trabajo')}${cat('#4c5b7a','dormir')}
    </div>
    <p class="mini" style="margin:9px 0 0">Hoy un evento es <b style="color:#e9f2ff">un punto</b> en la franja, dure lo que dure.
    Con la hora de fin pasa a ser una banda: se ve de un vistazo el rato que te come.</p>
  </div>

  <div class="card">
    <h2>Avisos</h2>
    <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#8fa6c6"><input type="checkbox" checked style="width:auto"> 🔔 avisarme (sale en «Hoy» y en «Próximos»)</label>
    <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#8fa6c6;margin-top:8px"><input type="checkbox" style="width:auto"> ⏳ mostrar cuenta atrás</label>
  </div>
</main>`));

/* ===================== 4. Datos: la portada ===================== */
writeFileSync('Datos.dc.html', P(`${cabecera()}
<main>
  <div class="subcab"><h2 class="subtit">📤 Datos</h2></div>

  <div class="card">
    <h2>Tu copia de seguridad</h2>
    <div class="dosdatos">
      <div><b>hace 3 días</b><span>última copia</span></div>
      <div><b>612 KB</b><span>ocupa la app</span></div>
    </div>
    <div class="row" style="margin-top:11px">
      <button class="btn p">${ico('bajar','ico sm')} guardar una copia</button>
      <button class="btn s">restaurar</button>
    </div>
  </div>

  <div class="puertas">
    ${puerta('tabla','Mi planning','pegar la tabla')}
    ${puerta('plato','Mi dieta','pegarla tal cual')}
    ${puerta('reloj2','Horas','servicios y vacaciones')}
  </div>
  <div class="puertas" style="margin-top:9px">
    ${puerta('disco','Copias','y dónde se guarda')}
    ${puerta('hoja','Texto','para imprimir')}
    ${puerta('calendario','Calendario','está en Ajustes →')}
  </div>
</main>`));

/* ===================== 5. Cómo se ve: apariencia + la franja, juntas ===================== */
writeFileSync('Aspecto.dc.html', P(`${cabecera()}
<main>
  ${sub('🎨 Cómo se ve','Ajustes')}

  <div class="card">
    <h2>Tema</h2>
    <div class="pest" style="border-bottom:0;padding-bottom:0">
      <button class="pestb on">oscuro</button><button class="pestb">claro</button><button class="pestb">el del móvil</button>
    </div>
    <label class="fld" style="max-width:220px;margin-top:11px">Color de marca
      <input value="#38e1ff"></label>
  </div>

  <div class="card">
    <h2>La franja del día</h2>
    <p class="note" style="margin:0 0 9px">La barra de colores de «Hoy». Elige qué horas se ven y de qué color va cada cosa.</p>
    <div class="row">
      <label class="fld" style="flex:1 1 110px">desde<input value="06:00"></label>
      <label class="fld" style="flex:1 1 110px">hasta<input value="24:00"></label>
    </div>
    <div style="display:flex;height:22px;border-radius:8px;overflow:hidden;border:1px solid #1e2b44;margin-top:11px">
      <i style="flex:2;background:#4c5b7a"></i><i style="flex:3;background:#38e1ff"></i>
      <i style="flex:1;background:#fbbf24"></i><i style="flex:2;background:#34d399"></i><i style="flex:1.5;background:#a78bfa"></i>
    </div>
    <div class="cats">
      ${cat('#4c5b7a','dormir')}${cat('#38e1ff','trabajo')}${cat('#fbbf24','guardia')}
      ${cat('#34d399','comidas')}${cat('#a78bfa','gimnasio')}${cat('#fb7185','eventos')}
    </div>
  </div>
</main>`));

/* ===================== 6. Copias: y «dónde se guarda esto», en cifras ===================== */
writeFileSync('Copia.dc.html', P(`${cabecera()}
<main>
  ${sub('💾 Copias de seguridad','Datos')}

  <div class="card">
    <h2>Guardar y restaurar</h2>
    <div class="row">
      <button class="btn p">${ico('bajar','ico sm')} guardar una copia (.json)</button>
      <button class="btn s">${ico('subir','ico sm')} restaurar una copia</button>
    </div>
    <label class="fld" style="max-width:250px;margin-top:11px">Avisarme si llevo sin copia
      <input value="14 días"></label>
    <p class="mini" style="margin:9px 0 0">Última copia: <b style="color:#e9f2ff">hace 3 días</b>.</p>
  </div>

  <div class="card">
    <h2>Dónde se guarda todo esto</h2>
    <p class="note" style="margin:0 0 4px">En tu navegador y en ningún sitio más: sin cuenta, sin servidor y sin red.
    Si borras los datos del navegador, se va. Por eso el aviso de la copia.</p>
    <div class="guarda">
      <div><b>612 KB</b><span>ocupado</span></div>
      <div><b>este móvil</b><span>dónde vive</span></div>
      <div><b>nunca</b><span>sale de aquí</span></div>
    </div>
    <div class="row" style="margin-top:11px">
      <button class="btn s">pedir que no se borre</button>
      <button class="btn d">empezar de cero</button>
    </div>
  </div>
</main>`));

console.log('6 maquetas escritas');
