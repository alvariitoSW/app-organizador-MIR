/* Ley de La Noche · N0 · lo común a las tres maquetas: la cadena calculada con el mapa del acta
   (consejo/2026-10-29.md) y la navegación. Cada maqueta pone su `pintaArriba(S,C)`.
   Minutos desde las 00:00 del día de la noche; la mañana siguiente va +1440. */
const M=s=>{const[h,m]=s.split(':').map(Number);return h*60+m;};
const HM=x=>{x=((Math.round(x)%1440)+1440)%1440;return String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0');};
const falta=d=>d<60?d+' min':Math.floor(d/60)+' h'+(d%60?' '+String(d%60).padStart(2,'0'):'');
const CFG={wake:M('06:45')+1440,sueno:490,margen:15,ida:35,estancia:60,pref:M('20:00'),bus:M('07:35')+1440,antes:4,trayecto:20};
/* adelantar la cama 15 min cada 3 días desde la mediana (00:30 sin datos) hasta despertador − 8 h 10 */
const OBJ=CFG.wake-CFG.sueno;   /* 22:35 */
const PASOS=[];for(let c=M('00:30')+1440;c>OBJ;c-=15)PASOS.push(c);PASOS.push(OBJ);
const S={now:M('21:20'),paso:PASOS.length-1,modo:'conductor',pantalla:'hoy',abierta:false,hoja:null,vuelta:null,llego:null,sugerencia:false,sugeridaOk:false};

function cadena(){
  const cama=PASOS[S.paso],casa=cama-CFG.margen,vete=casa-CFG.ida,salirLl=Math.min(CFG.pref,vete-CFG.estancia-CFG.ida);
  const salir=CFG.bus-CFG.antes,llegar=CFG.bus+CFG.trayecto;
  return [
    {id:'ir',ico:'🌿',hora:salirLl,cartel:'Sal al Lloret',corto:'Ir al Lloret',nota:'a tu hora de siempre'},
    {id:'vete',ico:'🌿',hora:vete,cartel:'Vete del Lloret',corto:'Vete del Lloret',nota:'a más tardar · lo último allí antes de las '+HM(cama-60),boton:'vuelta'},
    {id:'casa',ico:'🏠',hora:casa,cartel:'En casa',corto:'En casa',nota:'pantallas fuera: el Lloret ya contó como rato sin pantalla'},
    {id:'cama',ico:'🛌',hora:cama,cartel:'A la cama',corto:'A la cama',nota:cama>OBJ?'paso '+(S.paso+1)+' de '+PASOS.length+' hacia las '+HM(OBJ):'tu hora: 8 h 10 antes del despertador'},
    {id:'desp',ico:'⏰',hora:CFG.wake,cartel:'Despertador',corto:'Despertador',nota:'fijo, lejos de la cama y sin posponer'},
    {id:'salir',ico:'🚪',hora:salir,cartel:'Sal de casa',corto:'Sal de casa',nota:'4 min hasta la parada'},
    {id:'bus',ico:'🚌',hora:CFG.bus,cartel:'Bus',corto:'Bus',nota:''},
    {id:'llegar',ico:'🏢',hora:llegar,cartel:'Llegas al trabajo',corto:'Llegas',nota:'sobre esta hora',boton:'llego'}];}
/* lo que falta: los hitos aún por pasar (el de «vete» se da por pasado al apuntar la vuelta) */
function pendientes(C){return C.filter(h=>{if(h.id==='ir'&&S.now>=h.hora)return false;if(h.id==='vete'&&S.vuelta!=null)return false;
  if(h.id==='llegar')return S.llego==null&&S.now<h.hora+60;return h.hora>S.now;});}
/* la frase grande: «Vete del Lloret en 25 min · 21:45»; por la mañana, «Bus en 18 min» */
function grande(C){const P=pendientes(C),h=P[0];if(!h)return {txt:'Buen día',sub:'',h:null};
  const d=h.hora-S.now;
  if(h.id==='desp'&&d>60)return {txt:'Despertador '+HM(h.hora),sub:'quedan '+falta(d)+' de sueño',h:h,ico:'⏰',sinCuenta:true};
  if(h.id==='salir'||h.id==='bus'){const b=C.find(x=>x.id==='bus');const db=b.hora-S.now;
    return {txt:'Bus en '+falta(db),hora:HM(b.hora),sub:db>CFG.antes?'sal de casa a las '+HM(b.hora-CFG.antes):'¡a la parada!',h:b,ico:'🚌',min:db};}
  if(h.id==='llegar'&&d<=0)return {txt:'¿Ya en el trabajo?',sub:'apunta la hora con un toque',h:h,ico:'🏢'};
  return {txt:h.cartel+' en '+falta(d),hora:HM(h.hora),sub:h.nota,h:h,ico:h.ico,min:d};}
function botonVivo(C){const v=C.find(x=>x.id==='vete'),l=C.find(x=>x.id==='llegar');
  if(S.vuelta==null&&S.now>=v.hora-20&&S.now<v.hora+120)return {k:'vuelta',txt:'🏠 He vuelto'};
  if(S.llego==null&&S.now>=l.hora-25&&S.now<l.hora+90)return {k:'llego',txt:'🏢 He llegado'};
  return null;}

/* ---------- piezas comunes ---------- */
function hojaHTML(){if(!S.hoja)return '';const t=S.hoja.t,k=S.hoja.k;
  return '<div class="velo" data-a="cerrar"></div><div class="hoja"><div class="asa"></div>'+
    '<h3>'+(k==='vuelta'?'🏠 He vuelto del Lloret':'🏢 He llegado al trabajo')+'</h3>'+
    '<p class="sub">La hora ya está puesta. Si no es, muévela.</p>'+
    '<div class="horab"><button class="b" data-a="h-5">−5</button><b class="hora">'+HM(t)+'</b><button class="b" data-a="h+5">+5</button></div>'+
    '<button class="b p ancho" data-a="guardar">Guardar '+HM(t)+'</button></div>';}
function alarmasHTML(C){const g=id=>C.find(x=>x.id===id);
  const fila=(ico,nom,h,dias,cambio)=>'<div class="al"><span class="alico">'+ico+'</span><div><b>'+nom+'</b><small>'+dias+'</small></div><span class="alh">'+HM(h)+(cambio?'<i>antes '+HM(cambio)+'</i>':'')+'</span></div>';
  const ant=S.paso>0?PASOS[S.paso-1]:null;
  return '<div class="pant"><button class="volver" data-a="hoy">‹ Hoy</button><h2>⏰ Pon estas alarmas en tu Reloj</h2>'+
    '<p class="sub">Así suenan aunque la app esté cerrada. Ponlas una vez con este mismo nombre.</p>'+
    fila('🌿','Vete del Lloret',g('vete').hora,'todas las noches menos guardia',ant?ant-CFG.margen-CFG.ida:null)+
    fila('🛌','A la cama',g('cama').hora,'todas las noches',ant)+
    fila('🚪','Sal de casa',g('salir').hora,'lunes a viernes')+
    '<p class="nota">⏰ El despertador de las <b>'+HM(CFG.wake)+'</b> ya lo tienes: déjalo lejos de la cama. También en libres, como mucho 45 min más tarde.</p>'+
    (ant?'<p class="nota">Esta semana han cambiado dos: lo pone en pequeño al lado.</p>':'')+
    '<button class="b p ancho" data-a="hoy">Ya las he puesto</button></div>';}
function semanaHTML(){const fila=(ico,nom,min,antes)=>'<div class="dif"><span>'+ico+' '+nom+'</span><b>'+(min>0?'+':'')+min+' min</b><small>la semana pasada '+(antes>0?'+':'')+antes+'</small></div>';
  return '<div class="pant"><button class="volver" data-a="hoy">‹ Hoy</button><h2>Tu semana en minutos</h2>'+
    '<p class="sub">De media, lo que hiciste frente a la hora puesta. Solo tres cifras.</p>'+
    fila('🛌','A la cama',32,48)+fila('⏰','Levantarte',9,14)+fila('🚪','Salir de casa',4,11)+
    '<p class="nota">Va bajando en las tres. Un cambio para esta semana: <b>vete del Lloret con la alarma, cuando suene la alarma</b>.</p></div>';}
function sugerenciaHTML(){if(!S.sugerencia||S.paso>=PASOS.length-1)return '';
  return '<div class="sug">💡 Llevas 3 noches cerca de las '+HM(PASOS[S.paso])+'. ¿Probamos a la cama a las <b>'+HM(PASOS[S.paso+1])+'</b> desde hoy?'+
    '<div class="row"><button class="b s p" data-a="sug-si">Vale, '+HM(PASOS[S.paso+1])+'</button><button class="b s" data-a="sug-no">Aún no</button></div></div>';}
function restoHoy(){return '<div class="fantasma"><b>🍽 Comer</b><span>cena 19:15 · lo de siempre</span></div><div class="fantasma"><b>📅 Agenda</b><span>mañana · Medicina Interna 8–15</span></div>';}

function pinta(){const C=cadena();let h;
  if(S.pantalla==='alarmas')h=alarmasHTML(C);else if(S.pantalla==='semana')h=semanaHTML();
  else h='<div class="cab"><h1>☀️ Hoy · jueves 29</h1><div class="modos"><button class="'+(S.modo==='conductor'?'on':'')+'" data-a="m-conductor">🚌 Conductor</button><button class="'+(S.modo==='lista'?'on':'')+'" data-a="m-lista">☰ Línea</button></div></div>'+
    pintaArriba(S,C)+sugerenciaHTML()+restoHoy();
  document.getElementById('tel').innerHTML=h+hojaHTML();
  document.getElementById('reloj').textContent=HM(S.now);
  document.getElementById('cama').textContent=HM(PASOS[S.paso]);}
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el)return;const a=el.dataset.a;
  if(a.startsWith('m-'))S.modo=a.slice(2);
  else if(a==='hoy'){S.pantalla='hoy';S.hoja=null;}else if(a==='alarmas')S.pantalla='alarmas';else if(a==='semana')S.pantalla='semana';
  else if(a==='plegar')S.abierta=!S.abierta;
  else if(a==='vuelta'||a==='llego')S.hoja={k:a,t:S.now};
  else if(a==='h-5')S.hoja.t-=5;else if(a==='h+5')S.hoja.t+=5;
  else if(a==='guardar'){S[S.hoja.k]=S.hoja.t;S.hoja=null;}else if(a==='cerrar')S.hoja=null;
  else if(a==='sug-si'){S.paso++;S.sugerencia=false;}else if(a==='sug-no')S.sugerencia=false;
  else if(a.startsWith('ir-')){S.now=M(a.slice(3))+(a.slice(3)<'12:00'?1440:0);S.pantalla='hoy';}
  else if(a==='cama+'){S.paso=Math.min(PASOS.length-1,S.paso+1);}else if(a==='cama-'){S.paso=Math.max(0,S.paso-1);}
  else if(a==='t-10')S.now-=10;else if(a==='t+10')S.now+=10;
  else if(a==='sug')S.sugerencia=!S.sugerencia;else if(a==='borra'){S.vuelta=null;S.llego=null;}
  pinta();});
/* ?h=21:20&cama=0&modo=lista&p=alarmas&sug=1&hoja=vuelta para las capturas */
(function(){const q=new URLSearchParams(location.search);if(q.get('h')){const t=q.get('h');S.now=M(t)+(t<'12:00'?1440:0);}
  if(q.get('cama')!=null)S.paso=Math.max(0,Math.min(PASOS.length-1,+q.get('cama')));if(q.get('modo'))S.modo=q.get('modo');
  if(q.get('p'))S.pantalla=q.get('p');if(q.get('sug'))S.sugerencia=true;if(q.get('abierta'))S.abierta=true;
  if(q.get('hoja'))S.hoja={k:q.get('hoja'),t:S.now};if(q.get('vuelta'))S.vuelta=M(q.get('vuelta'));
  document.addEventListener('DOMContentLoaded',pinta);})();
/* el dibujo del modo Conductor, simplificado (en la app es el de `renderHoy`): de noche, la carretera y el bus */
function escena(alto){const noche=S.now<CFG.wake-30||S.now>M('19:30')&&S.now<1440+M('06:00');
  return '<svg viewBox="0 0 388 '+alto+'" width="100%" height="'+alto+'" style="display:block;border-radius:16px">'+
    '<defs><linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+(noche?'#0a1230':'#3b6fb6')+'"/><stop offset="1" stop-color="'+(noche?'#1a2350':'#f2b880')+'"/></linearGradient></defs>'+
    '<rect width="388" height="'+alto+'" fill="url(#cielo)"/>'+(noche?'<circle cx="350" cy="130" r="14" fill="#f4f1d0"/><circle cx="356" cy="125" r="12" fill="#0e1638"/>':'<circle cx="60" cy="'+(alto-70)+'" r="22" fill="#ffd27a"/>')+
    '<rect y="'+(alto-56)+'" width="388" height="56" fill="#141a26"/><rect y="'+(alto-30)+'" width="388" height="3" fill="#3a4560" stroke-dasharray="14 10"/>'+
    '<g transform="translate(150 '+(alto-104)+')"><rect width="150" height="62" rx="10" fill="#e8a33a"/><rect x="10" y="10" width="100" height="22" rx="4" fill="#9fd4ff" opacity=".85"/><rect x="118" y="10" width="24" height="36" rx="3" fill="#9fd4ff" opacity=".85"/>'+
    '<circle cx="32" cy="64" r="11" fill="#222"/><circle cx="118" cy="64" r="11" fill="#222"/></g></svg>';}
/* la cadena desplegada (igual en las tres): solo lo que falta, con su nota, y los dos accesos */
function cadenaAbierta(C){const P=pendientes(C);
  return '<div class="cad">'+P.map((h,i)=>'<div class="cadf'+(i===0?' ya':'')+'"><span class="cico">'+h.ico+'</span><div><b>'+h.corto+'</b>'+(h.nota?'<small>'+h.nota+'</small>':'')+'</div><span class="ch">'+HM(h.hora)+'</span></div>').join('')+
    (S.vuelta!=null?'<div class="cadok">✓ Volviste a las '+HM(S.vuelta)+'</div>':'')+(S.llego!=null?'<div class="cadok">✓ Llegaste a las '+HM(S.llego)+'</div>':'')+
    '<div class="row"><button class="b s" data-a="alarmas">⏰ Alarmas del móvil</button><button class="b s" data-a="semana">📊 Tu semana</button></div></div>';}
