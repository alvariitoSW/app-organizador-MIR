import {writeFileSync} from 'node:fs';
import {svg, cab, sub, pagina, nota, pie} from './build.mjs';

/* ---------- 1. La libreta: la portada de Notas ---------- */
writeFileSync('Notas.dc.html', pagina(`${cab()}
<main>
  ${sub('Notas', '☰ Más', '<span class="tag b2">9</span>')}

  <div class="captura">
    <div class="txt">Apunta algo y ya le pones día luego…</div>
    <div class="row" style="margin-top:9px">
      <button class="btn p">${svg('mas','ico sm')} guardar</button>
      <button class="btn s">${svg('calendario','ico sm')} con día</button>
      <span class="mini" style="margin-left:auto">se guarda sola</span>
    </div>
  </div>

  <div class="chips">
    <span class="chipx on">todas <b>9</b></span>
    <span class="chipx">sin día <b>4</b></span>
    <span class="chipx">${svg('calendario','ico sm')} con día <b>5</b></span>
    <span class="chipx">hechas <b>2</b></span>
  </div>

  <div class="card">
    <h2>Esta semana <span class="mini">3</span></h2>
    ${nota('Llamar a la gestoría por el certificado del R1. Pedir cita antes del viernes.',
      [pie('📅 hoy, jue 17','hoy'), pie('🔔 08:30','ev')], false, '#fbbf24')}
    ${nota('Sesión clínica: preparar el caso del paciente de la 214.',
      [pie('📅 sáb 19','dia')], false, '#38e1ff')}
    ${nota('Pedir el justificante de la guardia del 3 a personal.',
      [pie('📅 dom 20','dia')], false, '#7c5cff')}
  </div>

  <div class="card">
    <h2>Sin día <span class="mini">4</span></h2>
    ${nota('Mirar si el curso de eco está abierto ya.', [pie('sin día')], false, '#8fa6c6')}
    ${nota('Cumple de Marta — mirar regalo', [pie('sin día'), pie('💡 ponle día')], false, '#34d399')}
    ${nota('Libro que me dijo Álvaro: «El infinito en un junco».', [pie('sin día')], false, '#8fa6c6')}
    ${nota('Cambiar las ruedas antes de que llueva.', [pie('sin día')], false, '#8fa6c6')}
  </div>

  <div class="card">
    <h2>Hechas <span class="mini">2</span></h2>
    ${nota('Renovar el seguro del coche.', [pie('📅 lun 14','dia')], true, '#34d399')}
    ${nota('Mandar el informe de la sesión.', [pie('sin día')], true, '#34d399')}
  </div>
</main>`));

/* ---------- 2. Una nota abierta ---------- */
writeFileSync('NotaAbierta.dc.html', pagina(`${cab()}
<main>
  ${sub('La nota', 'Notas')}

  <div class="editor">Llamar a la gestoría por el certificado del R1.<br><br>Pedir cita antes del viernes — preguntar también por el modelo 145.</div>

  <div class="row" style="margin-top:11px">
    <label class="fld" style="flex:1 1 150px">qué día<span class="campo">jue 17 sep 2026</span></label>
    <label class="fld" style="flex:0 0 96px">color<span class="campo">🟡 ámbar</span></label>
  </div>
  <p class="mini" style="margin:8px 0 0">Con día puesto, la nota sale en el calendario: en la casilla del 17 y al abrir ese día.</p>

  <div class="card" style="margin-top:12px">
    <h2>${svg('calendario','ico sm')} En el calendario</h2>
    <div class="evrow">
      <span class="evdot" style="background:#fbbf24"></span>
      <span class="nm">Gestoría · certificado R1</span>
      <span class="hr">08:30</span>
    </div>
    <p class="mini" style="margin:8px 0 0">Creado desde esta nota. Si cambias la hora aquí o allí, es el mismo evento.</p>
    <div class="row" style="margin-top:9px">
      <button class="btn s">ver el 17 en el mes</button>
      <button class="btn s">quitarlo del calendario</button>
    </div>
  </div>

  <div class="acciones">
    <span class="acc">${svg('check')} marcar hecha</span>
    <span class="acc">${svg('calendario')} quitarle el día</span>
    <span class="acc p">${svg('campana')} cambiar el aviso</span>
    <span class="acc mala">${svg('papelera')} borrar la nota</span>
  </div>
</main>`));

/* ---------- 3. Pasar una nota al calendario ---------- */
writeFileSync('AlCalendario.dc.html', pagina(`${cab()}
<main>
  ${sub('Al calendario', 'La nota')}

  <div class="card">
    <p class="note" style="margin-bottom:10px">De esta nota:</p>
    <div class="nota" style="border:0;padding:0">
      <span class="franja" style="background:#34d399"></span>
      <div class="cuerpo"><p class="t">Cumple de Marta — mirar regalo</p></div>
    </div>
  </div>

  <div class="card">
    <h2>El evento</h2>
    <div class="row">
      <label class="fld" style="flex:1 1 100%">título<span class="campo">Cumple de Marta</span></label>
    </div>
    <div class="row" style="margin-top:9px">
      <label class="fld" style="flex:1 1 140px">qué día<span class="campo">26 sep 2026</span></label>
      <label class="fld" style="flex:0 0 92px">hora<span class="campo gris">—:—</span></label>
      <label class="fld" style="flex:0 0 76px">color<span class="campo">🟢</span></label>
    </div>
    <div class="chips">
      <span class="chipx on">${svg('campana','ico sm')} avisarme</span>
      <span class="chipx on">cuenta atrás</span>
      <span class="chipx">se repite cada año</span>
    </div>
    <p class="mini" style="margin:10px 0 0">Sin hora, sale como algo del día entero. Con «cuenta atrás» te dice cuántos días faltan.</p>
  </div>

  <div class="card">
    <h2>Lo que va a pasar</h2>
    <p class="note" style="margin:0">La nota <b>no se duplica</b>: se queda enlazada al evento. Sale en «Notas», en la casilla del 26 y al abrir ese día. Si borras el evento, la nota sigue ahí con su día.</p>
  </div>

  <button class="btn p big" style="margin-top:12px">${svg('calendario','ico sm')} crear el evento</button>
</main>`));

/* ---------- 4. El día abierto desde el Mes ---------- */
const DOW = ['L','M','X','J','V','S','D'];
const dias = [
  {n:14,nm:'💼 trabajo',pts:['#7c5cff'],nota:true},
  {n:15,nm:'💼 trabajo',pts:[]},
  {n:16,nm:'💪 fuerza',pts:['#38e1ff']},
  {n:17,nm:'🩺 Guardia',pts:['#fbbf24'],nota:true,hoy:true},
  {n:18,nm:'🚪 Saliente',pts:[]},
  {n:19,nm:'🌿 libre',pts:[],nota:true},
  {n:20,nm:'🌿 libre',pts:[],nota:true},
];
writeFileSync('DiaEnElMes.dc.html', pagina(`${cab('Calendario')}
<main>
  <div class="card">
    <h2>Septiembre</h2>
    <div class="mgrid">${DOW.map(d=>`<div class="mdow">${d}</div>`).join('')}</div>
    <div class="mgrid">${dias.map(d=>`
      <div class="dbox${d.hoy?' hoy':''}">
        <span class="dnum">${d.n}</span><span class="dnm">${d.nm}</span>
        <span class="dmarcas">${d.pts.map(c=>`<i class="dpt" style="background:${c}"></i>`).join('')}${d.nota?'<b class="dnota">📝</b>':''}</span>
      </div>`).join('')}</div>
    <p class="mini" style="margin:9px 0 0">📝 = ese día tiene notas. Toca el día para verlas.</p>
  </div>

  <div class="card">
    <div class="subcab" style="margin-bottom:9px">
      <h2 class="subtit" style="font-size:15px">Jueves 17 · 🩺 Guardia</h2>
      <span class="tag b4">hoy</span>
    </div>

    <h2>${svg('calendario','ico sm')} Eventos <span class="mini">1</span></h2>
    <div class="evrow"><span class="evdot" style="background:#fbbf24"></span>
      <span class="nm">Gestoría · certificado R1</span><span class="hr">08:30</span></div>

    <div style="border-top:1px solid #1e2b44;margin:12px 0 0;padding-top:12px">
      <h2>${svg('nota','ico sm')} Notas de este día <span class="mini">2</span></h2>
      ${nota('Llamar a la gestoría por el certificado del R1. Pedir cita antes del viernes.',
        [pie('🔔 08:30','ev')], false, '#fbbf24')}
      ${nota('Llevar el portátil: la sesión es en la 3.ª planta.', [], false, '#38e1ff')}
      <div class="row" style="margin-top:10px">
        <button class="btn s">${svg('mas','ico sm')} nota para este día</button>
        <button class="btn s">${svg('nota','ico sm')} ver todas mis notas</button>
      </div>
    </div>
  </div>
</main>`));

/* ---------- 5. Hoy: las notas del día, sin ir al Mes ---------- */
writeFileSync('Hoy.dc.html', pagina(`${cab('Calendario')}
<main>
  <div class="card">
    <h2>Jueves 17 · 🩺 Guardia</h2>
    <p class="note" style="margin:0">Entras a las 8:00 · sales mañana a las 9:00 · 25 h</p>
  </div>

  <div class="card">
    <h2>${svg('nota','ico sm')} Notas de hoy <span class="mini">2</span>
      <button class="btn s" style="margin-left:auto">todas ▸</button></h2>
    ${nota('Llamar a la gestoría por el certificado del R1.', [pie('🔔 08:30','ev')], false, '#fbbf24')}
    ${nota('Llevar el portátil: la sesión es en la 3.ª planta.', [], false, '#38e1ff')}
    <div class="captura" style="margin-top:11px">
      <div class="txt">Apunta algo para hoy…</div>
      <div class="row" style="margin-top:8px"><button class="btn p s">${svg('mas','ico sm')} guardar para hoy</button></div>
    </div>
  </div>

  <div class="card">
    <h2>Y sueltas <span class="mini">4 sin día</span></h2>
    <div class="chips">
      <span class="chipx">Curso de eco</span>
      <span class="chipx">Regalo de Marta</span>
      <span class="chipx">Libro de Álvaro</span>
      <span class="chipx">+1</span>
    </div>
    <p class="mini" style="margin:9px 0 0">Las que no tienen día no molestan en el calendario, pero las tienes a un toque.</p>
  </div>
</main>`));

console.log('5 maquetas escritas');
