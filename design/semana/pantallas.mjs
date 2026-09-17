import {writeFileSync} from 'node:fs';
import {svg, cab, pagina, franja, pie} from './build.mjs';

/* Datos de la semana del 14 al 20 de septiembre, con el sol real de Las Palmas de Gran Canaria
   (28.1235 N, 15.4363 O) calculado con la ecuación del orto/ocaso. Hoy es jueves 17. */
const SEM = [
  {d:14,dw:'lun',turno:'🩺 Guardia',col:'#fb7185',kc:2740,sale:7.73,pone:20.15,
   bloques:[{de:8,a:15,color:'#7c5cff'},{de:15,a:24,color:'#fb7185'}],ev:'Fisio 19:00'},
  {d:15,dw:'mar',turno:'🚪 Saliente',col:'#fbbf24',kc:2090,sale:7.74,pone:20.13,
   bloques:[{de:0,a:9,color:'#fb7185'},{de:10,a:17,color:'#34d399'}]},
  {d:16,dw:'mié',turno:'💼 Día de trabajo',col:'#7c5cff',kc:2040,sale:7.75,pone:20.11,
   bloques:[{de:8,a:15,color:'#7c5cff'},{de:20,a:20.5,color:'#38e1ff'}],nota:'Sesión clínica',ev:'Sesión clínica 08:15'},
  {d:17,dw:'jue',turno:'💼 Día de trabajo',col:'#7c5cff',kc:2040,sale:7.78,pone:20.08,hoy:true,ahora:14.6,
   bloques:[{de:8,a:15,color:'#7c5cff'},{de:18,a:19.5,color:'#38e1ff'}],nota:'Gestoría',ev:'Gestoría 08:30'},
  {d:18,dw:'vie',turno:'💪 Día de fuerza',col:'#38e1ff',kc:2540,sale:7.79,pone:20.06,
   bloques:[{de:8,a:15,color:'#7c5cff'},{de:18,a:19.5,color:'#38e1ff'}]},
  {d:19,dw:'sáb',turno:'🌿 Día libre',col:'#34d399',kc:1960,sale:7.80,pone:20.05,finde:true,
   bloques:[{de:11,a:13,color:'#34d399'}],nota:'Sesión 214'},
  {d:20,dw:'dom',turno:'🌿 Día libre',col:'#34d399',kc:1960,sale:7.81,pone:20.03,finde:true,
   bloques:[{de:17,a:19,color:'#a3e635'}],ev:'Cocina 17:00'},
];
const hhmm = (h) => String(Math.floor(h)).padStart(2,'0')+':'+String(Math.round((h%1)*60)).padStart(2,'0');

const filaDia = (x) => `
<div class="dia${x.hoy?' hoy':''}${x.finde?' finde':''}">
  <div class="dcab">
    <span class="dnum"><small>${x.dw}</small>${x.d}</span>
    <span class="dturno" style="color:${x.col}">${x.turno}</span>
    ${x.hoy?'<span class="hoychip">hoy</span>':''}
    <span class="dkc">${x.kc} kcal</span>
  </div>
  ${franja({sale:x.sale, pone:x.pone, bloques:x.bloques, ahora:x.hoy?x.ahora:null})}
  <div class="dpies">
    ${pie('amanecer', hhmm(x.sale), 'sol')}
    ${pie('ocaso', hhmm(x.pone), 'sol')}
    ${x.ev?pie('reloj', x.ev, 'ev'):''}
    ${x.nota?pie('nota', x.nota, 'nt'):''}
  </div>
</div>`;

/* ---------- 1. Semana: la semana es lo primero que se ve ---------- */
writeFileSync('Semana.dc.html', pagina(`${cab()}
<main>
  <div class="daylist">${SEM.map(filaDia).join('')}</div>

  <div class="card" style="margin-top:12px">
    <h2>La semana en números</h2>
    <div class="res">
      <div><b>1</b><span>guardia</span></div>
      <div><b>3</b><span>sesiones de cocina</span></div>
      <div><b>8.5 h</b><span>sueño de media</span></div>
    </div>
    <p class="mini" style="margin:10px 0 0">1 guardia · repartida · ciclo de 4 semanas, anclado al 2026-09-14.</p>
    <div class="row" style="margin-top:9px">
      <button class="btn s">${svg('ajuste','ico sm')} patrón y rotación</button>
      <button class="btn s">${svg('olla','ico sm')} qué cocinar</button>
      <button class="btn s">abrir todos los días</button>
    </div>
  </div>
</main>`));

/* ---------- 2. Un día abierto ---------- */
writeFileSync('DiaAbierto.dc.html', pagina(`${cab()}
<main>
  <div class="daylist">
    ${filaDia(SEM[2])}
    <div class="dia hoy">
      <div class="dcab">
        <span class="dnum"><small>jue</small>17</span>
        <span class="dturno" style="color:#7c5cff">💼 Día de trabajo</span>
        <span class="hoychip">hoy</span>
        <span class="dkc">2040 kcal</span>
      </div>
      ${franja({sale:7.78, pone:20.08, bloques:SEM[3].bloques, ahora:14.6})}
      <div class="dpies">
        ${pie('amanecer','07:47','sol')}${pie('ocaso','20:05','sol')}
        ${pie('sol','12 h 18 min de luz','sol')}
      </div>

      <div style="border-top:1px solid #1e2b44;margin-top:11px;padding-top:10px">
        <div class="comida"><span class="h">07:00</span><span class="q"><b>🥣 Porridge overnight</b><span>430 kcal · 22 g P</span></span></div>
        <div class="comida"><span class="h">14:30</span><span class="q"><b>🍛 Pollo al curry con boniato</b><span>620 kcal · 34 g P · 🍱 táper del domingo</span></span></div>
        <div class="comida"><span class="h">21:00</span><span class="q"><b>🥗 Ensalada completa</b><span>410 kcal · 28 g P</span></span></div>
      </div>

      <div class="dpies" style="margin-top:10px">
        ${pie('reloj','Gestoría · 08:30','ev')}
        ${pie('nota','Llamar a la gestoría por el certificado','nt')}
        ${pie('cama','🛌 23:30 → ⏰ 07:00 · 7 h 30','')}
      </div>

      <div class="row" style="margin-top:10px">
        <button class="btn s">abrir los menús de este día</button>
        <button class="btn s">cambiar qué día es</button>
        <button class="btn s">cambiar estas horas</button>
      </div>
    </div>
    ${filaDia(SEM[4])}
  </div>
</main>`));

/* ---------- 3. El sol y dónde estoy ---------- */
const arco = `
<svg viewBox="0 0 140 78" width="140" height="78" fill="none">
  <path d="M8 66 A62 62 0 0 1 132 66" stroke="#1e2b44" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M8 66 A62 62 0 0 1 96.5 22.5" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>
  <defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stop-color="#fb7185"/><stop offset="1" stop-color="#fbbf24"/></linearGradient></defs>
  <circle cx="96.5" cy="22.5" r="7" fill="#fbbf24"/>
  <circle cx="96.5" cy="22.5" r="12" fill="#fbbf24" opacity=".2"/>
  <line x1="4" y1="66" x2="136" y2="66" stroke="#1e2b44" stroke-width="1.5"/>
</svg>`;
writeFileSync('Sol.dc.html', pagina(`${cab('☰ Más')}
<main>
  <div class="subcab">
    <button class="btn s volver">${svg('atras','ico sm')} Ajustes</button>
    <h2 class="subtit">El sol y dónde estoy</h2>
  </div>

  <div class="card">
    <h2>Hoy, jueves 17</h2>
    <div class="solhero">
      ${arco}
      <div class="solnum">
        <div class="solfila">${svg('amanecer')} salió a las <b>07:47</b></div>
        <div class="solfila">${svg('ocaso')} se pone a las <b>20:05</b></div>
        <div class="solfila">${svg('sol')} luz <b>12 h 18</b></div>
      </div>
    </div>
    <p class="mini" style="margin:10px 0 0">Quedan <b style="color:#e9f2ff">5 h 27</b> de luz.</p>
  </div>

  <div class="card">
    <h2>${svg('sitio','ico sm')} Dónde estoy</h2>
    <p class="note">Se calcula en el móvil con la latitud y la longitud: no sale nada a internet y funciona sin cobertura.</p>
    <div class="chips">
      <span class="chipx on">${svg('sitio','ico sm')} Las Palmas de Gran Canaria</span>
      <span class="chipx">Santa Cruz de Tenerife</span>
      <span class="chipx">Madrid</span>
      <span class="chipx">Barcelona</span>
      <span class="chipx">Sevilla</span>
      <span class="chipx">Valencia</span>
      <span class="chipx">+ otro sitio</span>
    </div>
    <div class="row" style="margin-top:11px">
      <label class="fld" style="flex:1 1 120px">latitud<span class="campo">28.1235</span></label>
      <label class="fld" style="flex:1 1 120px">longitud<span class="campo">−15.4363</span></label>
    </div>
    <div class="row" style="margin-top:9px">
      <button class="btn s">${svg('sitio','ico sm')} usar mi ubicación</button>
      <span class="mini">te lo pide el navegador, y solo esa vez</span>
    </div>
  </div>

  <div class="card">
    <h2>La hora</h2>
    <p class="note" style="margin:0">La app usa <b>la hora de tu teléfono</b> para saber qué día es hoy y dónde cae el «ahora» en la franja. Tu móvil está en <b>hora de Canarias</b>, que es la del sitio elegido: cuadra.</p>
    <p class="mini" style="margin:9px 0 0">Si viajas y cambias de región sin cambiar la del móvil, la app te avisa aquí en vez de darte horas que no son.</p>
  </div>
</main>`));

/* ---------- 4. Hoy, con el sol ---------- */
writeFileSync('Hoy.dc.html', pagina(`${cab('Calendario','jueves 17 sep',['Mes','Semana','Hoy'],'Hoy')}
<main>
  <div class="card">
    <div class="dcab">
      <span class="dnum"><small>jue</small>17</span>
      <span class="dturno" style="color:#7c5cff">💼 Día de trabajo</span>
      <span class="hoychip">hoy</span>
    </div>
    ${franja({sale:7.78, pone:20.08, bloques:[{de:8,a:15,color:'#7c5cff'},{de:18,a:19.5,color:'#38e1ff'}], ahora:14.6})}
    <div class="dpies">
      ${pie('amanecer','07:47','sol')}${pie('ocaso','20:05','sol')}
      ${pie('reloj','son las 14:36','')}
    </div>
  </div>

  <div class="card">
    <h2>${svg('sol','ico sm')} El sol hoy</h2>
    <div class="solhero">
      ${arco}
      <div class="solnum">
        <div class="solfila">${svg('amanecer')} salió <b>07:47</b></div>
        <div class="solfila">${svg('ocaso')} se pone <b>20:05</b></div>
        <div class="solfila">${svg('sol')} quedan <b>5 h 27</b></div>
      </div>
    </div>
    <p class="mini" style="margin:10px 0 0">Las Palmas de Gran Canaria · 1 min menos de luz que ayer. <button class="btn s" style="padding:3px 9px">cambiar sitio</button></p>
  </div>

  <div class="card">
    <h2>Lo que toca</h2>
    <div class="comida"><span class="h">07:00</span><span class="q"><b>🥣 Porridge overnight</b><span>430 kcal · 22 g P</span></span></div>
    <div class="comida"><span class="h">14:30</span><span class="q"><b>🍛 Pollo al curry con boniato</b><span>620 kcal · 34 g P</span></span></div>
    <div class="comida"><span class="h">21:00</span><span class="q"><b>🥗 Ensalada completa</b><span>410 kcal · 28 g P</span></span></div>
  </div>
</main>`));

/* ---------- 5. La marca de hoy, en los tres sitios ---------- */
writeFileSync('MarcaDeHoy.dc.html', pagina(`${cab('☰ Más')}
<main>
  <div class="subcab"><h2 class="subtit">La señal de «hoy»</h2></div>
  <p class="note" style="margin:0">La misma marca en las tres vistas, y siempre según la hora del teléfono: borde encendido, fondo azul y la etiqueta <span class="hoychip">hoy</span>.</p>

  <div class="card">
    <h2>En Semana</h2>
    <div class="demo">
      <span class="et">antes · solo cambiaba el color del borde izquierdo</span>
      <div class="dia" style="border-left-color:#38e1ff">
        <div class="dcab"><span class="dnum"><small>jue</small>17</span>
          <span class="dturno" style="color:#7c5cff">💼 Día de trabajo</span>
          <span class="dkc">2040 kcal</span></div>
      </div>
    </div>
    <div class="demo">
      <span class="et">ahora</span>
      ${filaDia({...SEM[3], ev:null, nota:null})}
    </div>
  </div>

  <div class="card">
    <h2>En Mes</h2>
    <div class="demo">
      <div class="mgrid">
        ${[14,15,16,17,18,19,20].map(n=>`<div class="dbox${n===17?' hoy':''}">${n}<span class="pt">${n===17?'hoy':'·'}</span></div>`).join('')}
      </div>
    </div>
  </div>

  <div class="card">
    <h2>En Hoy</h2>
    <div class="demo">
      <div class="dcab"><span class="dnum"><small>jue</small>17</span>
        <span class="dturno" style="color:#7c5cff">💼 Día de trabajo</span>
        <span class="hoychip">hoy</span>
        <span class="dkc">son las 14:36</span></div>
    </div>
  </div>

  <div class="card">
    <h2>A medianoche</h2>
    <p class="note" style="margin:0">Si dejas la app abierta y pasa la medianoche, la marca <b>se mueve sola</b> al día siguiente. Hoy se queda clavada hasta que recargas.</p>
  </div>
</main>`));

console.log('5 maquetas escritas');
