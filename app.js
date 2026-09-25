"use strict";
/* ===================== util ===================== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.prototype.slice.call(r.querySelectorAll(s));
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+'-'+Math.random().toString(36).slice(2,8);
const clone=o=>JSON.parse(JSON.stringify(o));
const num=(v,d)=>{const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?d:n;};
const fmt=n=>{if(n==null||isNaN(n))return '';const r=Math.round(n*100)/100;return String(r).replace(/\.0+$/,'');};
const rac=n=>{n=Math.round((n||0)*10)/10;return fmt(n)+(n===1?' ración':' raciones');};
const MON=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DAYN=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DAYSH=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DOWN0=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];   /* indexado como Date#getDay() */
const DIA3=['dom','lun','mar','mié','jue','vie','sáb'];   /* también como Date#getDay() */
/* franja de 24 h: un color fijo por categoría (no por tipo de día), configurable en Ajustes */
const TLCAT=[['sleep','Dormir','#7c5cff'],['work','Trabajo','#f59e0b'],['guard','Guardia','#ef4444'],
             ['meal','Comidas','#10b981'],['gym','Gimnasio','#22d3ee'],['evt','Eventos','#a855f7']];
const TLKEYS=TLCAT.map(function(c){return c[0];});
function tlColor(k){const c=((store.franja||{}).colores||{})[k];
  if(c)return c;
  for(let i=0;i<TLCAT.length;i++)if(TLCAT[i][0]===k)return TLCAT[i][2];
  return '#888888';}
function tlHoras(){const h=+((store.franja||{}).horas);return [12,18,24].indexOf(h)>=0?h:24;}
function mondayOf(d){const x=new Date(d.getTime());x.setDate(x.getDate()-((x.getDay()+6)%7));x.setHours(0,0,0,0);return x;}
function addDays(d,n){const x=new Date(d.getTime());x.setDate(x.getDate()+n);return x;}
function iso(d){const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10);}
function parseDate(s){const d=new Date(String(s)+'T00:00:00');return isNaN(d)?null:d;}
function roundNice(n){if(n<=0)return 0;const r=n>=20?5:n>=8?1:n>=3?.5:.25;return Math.round(Math.ceil(n/r)*r*100)/100;}
function isGuardia(sh){return !!sh&&(sh.intensity==='alto'&&/guardia|24/i.test(sh.name+sh.desc)||/guardia/i.test(sh.name));}
function hasTime(s){const sh=shiftById(s);return !!(sh&&sh.start);}
function toMin(t){const m=/^(\d{1,2})[:.](\d{2})$/.exec(String(t||'').trim());if(!m)return null;
  const h=+m[1],mi=+m[2];if(h>23||mi>59)return null;return h*60+mi;}
function fmtHM(mins){mins=Math.max(0,Math.round(mins));return Math.floor(mins/60)+'h'+String(mins%60).padStart(2,'0');}
function sleepHours(bed,wake){const b=toMin(bed),w=toMin(wake);if(b==null||w==null)return null;
  let d=(w+1440-b)%1440;if(d===0)d=1440;return Math.round(d/6)/10;}
function nextIso(s){const d=parseDate(s);if(!d)return '';const n=addDays(d,1);return iso(n);}
function monthOf(s){const d=parseDate(s);return d?d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'):'';}

/* ===================== datos por defecto ===================== */
function DEFAULTS(){return {
  meta:{owner:'',notes:'',backupAvisoD:13,montada:false,sesionesFijas:true},
  /* el temario vive en otra app: aquí solo su copia, tu progreso y tus ratos */
  estudio:{fuente:{nombre:'',url:'',cuando:''},temas:[],estado:{},sesiones:[]},
  shifts:[
    {id:'sh-g',code:'G',name:'Guardia',icon:'🩺',start:'08:00',end:'08:00',intensity:'alto',
      desc:'Turno de 24 h en destino: no se cocina, todo viene de táper.',color:'#ef4444'},
    {id:'sh-s',code:'S',name:'Saliente',icon:'🚪',start:'09:00',end:'13:00',intensity:'medio',
      desc:'Entrega del servicio, trámites y casa. Toca recuperar.',color:'#3b82f6'},
    {id:'sh-t',code:'T',name:'Día de trabajo',icon:'💼',start:'08:00',end:'15:00',intensity:'medio',
      desc:'Laborable normal: de 8:00 a 15:00, sin gym. Es la base de todos los meses.',color:'#22d3ee'},
    {id:'sh-f',code:'F',name:'Día de fuerza',icon:'💪',start:'06:30',end:'08:00',intensity:'alto',
      desc:'Entreno a primera hora + jornada de 8:00 a 15:00.',color:'#10b981'},
    {id:'sh-l',code:'L',name:'Día libre',icon:'🌿',start:'',end:'',intensity:'bajo',
      desc:'Sin servicio: se cocina, se reposta y se duerme.',color:'#a855f7'},
    {id:'sh-v',code:'V',name:'Vacaciones',icon:'🏖️',start:'',end:'',intensity:'bajo',
      desc:'Día de vacaciones: sin jornada, se come en casa y se desconecta.',color:'#f59e0b'}
  ],
  /* horas de cada tipo de día: despertar, desayuno, salir, llegar, acostarse */
  rhythm:{
    'sh-g':{wake:'06:45',breakfast:'06:55',leave:'07:30',arrive:'07:45',sleep:'22:30'},
    'sh-s':{wake:'08:30',breakfast:'09:15',leave:'',arrive:'',sleep:'23:30'},
    'sh-t':{wake:'06:50',breakfast:'06:55',leave:'07:30',arrive:'07:45',sleep:'22:40'},
    'sh-f':{wake:'06:50',breakfast:'06:55',leave:'07:30',arrive:'07:45',sleep:'22:40'},
    'sh-l':{wake:'08:30',breakfast:'09:30',leave:'',arrive:'',sleep:'23:45'},
    'sh-v':{wake:'08:45',breakfast:'09:30',leave:'',arrive:'',sleep:'00:00'}
  },
  rotation:{mode:'template',pattern:0,anchor:iso(mondayOf(new Date())),index:0,shiftByDay:{},daySet:{},
             monthService:'',quota:{urg:4,umi:2},autoPos:true,guardiasMes:6,
             calNombre:'',calAlarm:true,calOculto:true,icsAvisoMin:30,calWeekStart:'lun',
             saltoDia:{from:6,to:1},
             servicios:['Rayos','Cardiología','Medicina Interna','Infecciosas','Neumología','UCRI','Neurología'],
             svcMeses:[1,1,1,1,1,1,1],
             jornada:{start:'08:00',end:'15:00',workdays:[1,2,3,4,5],aplicaLibres:true},vacaciones:[]},
  sueno:{min:8,cenaMin:90,cenaMax:180,latencia:10,siesta:360},
  /* la comida principal va cuando toca según el día, no a una hora fija del tipo de día */
  comidas:{conEntreno:{de:'18:00',a:'18:30'},sinEntreno:{de:'14:00',a:'15:00'},trasSiesta:30},
  tema:{brand:'',brand2:'',ink:''},
  franja:{horas:24,colores:{}},
  lector:{proxy:'',publico:false},
  usda:{key:''},
  sitio:'lpa',sitios:[],
  impPendiente:null,   /* lo último compartido desde otra app, hasta que se use o se limpie */
  notasDia:{},         /* se migra a notas[] al arrancar; se deja para no romper copias viejas */
  notas:[],            /* la libreta: {id,txt,fecha:''|'2026-09-17',hecha:0|ts,color,evId} */
  eventos:[],
  listas:[
    {id:'ls-siempre',nombre:'La compra de siempre',fija:true,
     items:['Leche','Huevos (docena)','Yogur griego natural (12)','Fruta para 7 raciones','Pan de masa madre',
            'Café','Frutos secos naturales','Aceite de oliva virgen extra','Verdura para la semana','Pechuga de pollo']},
    {id:'ls-despensa',nombre:'Despensa · repaso mensual',fija:false,
     items:['Arroz basmati / pasta integral (1 kg)','Lenteja pardina y garbanzos de bote (6-8)','Tomate triturado (6 bricks)',
            'Sal, pimienta, pimentón, curry, jengibre, comino','Congelados de rescate: verdura al vapor, pimiento, gambas',
            'Tápers de cristal (mín. 8), film, papel de hornear']}],
  habitos:{items:[],registro:{}},
  food:{objetivo:{kcal:0,prot:0},eans:{},log:{},fav:[]},
  /* quién eres, que es lo que decide cuántas kcal necesitas y qué puedes comer */
  perfil:{celiaco:false,avenaSinGluten:true,alturaCm:0,pesoKg:0,sexo:'h',nacido:0,actividad:1.5,meta:'mantener',pesos:[]},
  gym:{biblioteca:[],rutinas:[],registro:[],sesiones:[],cardio:[],fav:[],fuente:'',marks:{},
    segundo:{on:true,dias:[2],tipo:'piscina',hora:'15:30'}},
  patterns:[
    {id:'pat1',name:'1 guardia · repartida',days:['G','S','T','T','F','L','L'],note:'Lunes guardia → martes saliente → miércoles y jueves de 8 a 15 → viernes con gym → finde en casa.'},
    {id:'pat2',name:'2 guardias · alternas',days:['G','S','F','G','S','T','L'],note:'Dos guardias con su saliente automático; el resto de laborables, de 8 a 15.'},
    {id:'pat3',name:'G-S pegados · 1 guardia',days:['G','S','T','F','T','L','L'],note:'Guardia el lunes, saliente el martes y vuelta al horario normal.'},
    {id:'pat4',name:'Semana sin guardias',days:['T','F','T','T','F','L','L'],note:'Solo jornada de 8 a 15 y dos días de gym; la usa el mes que no te toca servicio.'}
  ],
  batches:[
    {id:'b1',label:'Cocina del domingo',when:'dom · 17:00–19:00',minCook:4,note:'La sesión grande: 2 h y la semana resuelta. Lo que sobre, al congelador.'},
    {id:'b2',label:'Cocina del miércoles',when:'mié · 20:00 (25 min)',minCook:4,note:'Refresco de mitad de semana, dos recetas.'},
    {id:'b3',label:'Cocina del viernes',when:'vie · 19:00 (15 min)',minCook:2,note:'Lo justo para el finde y la guardia del lunes.'},
    {id:'bn',label:'Sin lote (la vuelta)',when:'',note:'Cosas que se montan en el momento, no se preparan antes.'}
  ],
  dishes:[
    {id:'d-tortilla',name:'Tortilla de patata y cebolla',icon:'🍳',batchId:'b1',kcal:310,prot:18,portions:6,
      ingredients:['8 huevo','700 g patata','2 cebolla','60 ml aceite de oliva','6 g sal'],
      steps:['Fríe la patata en lámina gruesa con la cebolla en juliana, 12 min a fuego medio, sin dorar.','Escurre, mezcla con los huevos batidos y sal. Cuaja 3-4 min por lado a fuego fuerte.','8 raciones: se come fría o templada, aguanta 4 días tapada en nevera.']},
    {id:'d-porridge',name:'Porridge overnight (avena + yogur)',icon:'🥣',batchId:'b1',kcal:430,prot:22,portions:4,
      ingredients:['320 g yogur griego natural','160 g copos de avena','400 ml leche','1 plátano','20 g miel'],
      steps:['Reparte la avena y el yogur en 4 tarros.','Cubre con leche, tapa y remueve. A la nevera toda la noche.','Por la mañana: plátano en rodajas y miel. Aguanta 4 días. El plátano lo pones en el momento.']},
    {id:'d-arroz-pollo',name:'Arroz caldoso de pollo y garbanzos',icon:'🍗',batchId:'b1',kcal:520,prot:38,portions:4,
      ingredients:['700 g muslo de pollo','280 g arroz basmati','400 g garbanzos cocidos','400 g tomate triturado','1 pimiento verde','200 g calabacín','2 diente ajo','600 ml caldo de pollo','5 g pimentón','4 g sal'],
      steps:['Sella el pollo salpimentado con el pimentón y retíralo.','En la misma cazuela: ajo, pimiento y calabacín 5 min; tomate triturado, otros 5.','Añade el arroz y los garbanzos, devuelve el pollo y el caldo caliente. 18 min tapado a fuego bajo, 5 de reposo.','4 tápers: queda meloso, no se pasa al recalentar en el microondas del destino.']},
    {id:'d-lentejas',name:'Lentejas estofadas con chorizo y verdura',icon:'🥘',batchId:'b1',kcal:470,prot:26,portions:4,
      ingredients:['500 g lenteja pardina','200 g chorizo','2 zanahoria','1 pimiento rojo','400 g tomate triturado','2 diente ajo','1200 ml agua','5 g pimentón','5 g sal'],
      steps:['Sofríe ajo, zanahoria y pimiento en dados, 8 min.','Chorizo en rodajas, tomate y pimentón: 3 min más.','Lentejas y agua fría. 25 min a fuego suave; sal al final para no endurecer la legumbre.','Reposo 10 min (espesa al enfriar). 4 tápers, 2 de ellos al congelador.']},
    {id:'d-salmon',name:'Salmón al horno con patata y espárragos',icon:'🐟',batchId:'b2',kcal:540,prot:36,portions:6,
      ingredients:['6 lomo salmón','1000 g patata nueva','600 g espárragos verdes','45 ml aceite de oliva','2 limón','7 g sal','3 g pimienta'],
      steps:['Patata en cascos al horno, 200 °C, 20 min con aceite y sal.','Salmón y espárragos sobre la patata: 9-10 min más. Se hace la tanda de 6 y la mitad se come templada.','Zumo de limón y un hilo de aceite al salir. En guardia se come templado y sentado, que es un lujo.']},
    {id:'d-curry',name:'Pollo al curry con boniato',icon:'🍛',batchId:'b2',kcal:520,prot:34,portions:6,
      ingredients:['960 g pechuga de pollo','720 g boniato','480 ml leche de coco','1.2 cebolla','2.4 diente ajo','24 g curry','360 g espinaca fresca','6 g jengibre molido','5 g sal'],
      steps:['Boniato en dados: microondas 8 min (rápido) u horno 15 min.','Pollo en dados dorado con ajo y cebolla; especias 1 min para que tuesten.','Leche de coco y boniato, 10 min tapado. Espinacas con el fuego apagado.','6 raciones: 3 a nevera y 3 al congelador para la próxima guardia.']},
    {id:'d-omelette',name:'Tortilla francesa de atún',icon:'🍳',batchId:'b3',kcal:300,prot:30,portions:1,
      ingredients:['3 huevo','1 lata atún en aceite','20 g queso rallado','2 g sal'],
      steps:['Bate los huevos con sal y cuaja en sartén caliente, 2 min.','Atún escurrido y queso en el centro, dobla y fuera. 6 min sin ensuciar nada.']},
    {id:'d-ensalada-completa',name:'Ensalada completa de bote y táper',icon:'🥗',batchId:'b3',kcal:410,prot:24,portions:1,
      ingredients:['150 g canónigos y tomate','1 lata atún','100 g garbanzos cocidos','25 g mezcla frutos secos','15 ml aceite de oliva','5 ml vinagre'],
      steps:['Base de hoja y tomate (ya limpio, no se cocina nada).','Proteína y garbanzos de bote por encima.','Aceite y vinagre en unbote aparte, se aliña al comer para que no se ponga todo triste.']},
    {id:'d-yogur-avena',name:'Yogur griego con avena y fruta',icon:'🥛',batchId:'bn',kcal:380,prot:25,portions:1,
      ingredients:['250 g yogur griego natural','40 g copos de avena','1 pieza fruta','5 g miel'],
      steps:['Mezclar y comer: 3 minutos, sin fuego ni cacharros.']},
    {id:'d-pan-aceite',name:'Pan integral con tomate y aceite',icon:'🍞',batchId:'bn',kcal:260,prot:8,portions:1,
      ingredients:['2 rebanada pan integral masa madre','1 tomate','8 ml aceite de oliva','2 g sal'],
      steps:['Tuesta, frota tomate, aceite y sal.']},
    {id:'d-cafe',name:'Café o infusión',icon:'☕',batchId:'bn',kcal:30,prot:2,portions:1,
      ingredients:['200 ml café con leche'],
      steps:['Sin azúcar. En guardia: última toma con cafeína antes de las 02:00, luego descafeinado.']},
    {id:'d-fruita-nueces',name:'Fruta y frutos secos',icon:'🍎',batchId:'bn',kcal:230,prot:5,portions:1,
      ingredients:['1 pieza fruta','25 g mezcla frutos secos'],
      steps:['El bote del domingo con 7 raciones de frutos secos te quita este trámite toda la semana.']},
    {id:'d-sandwich',name:'Bocadillo de atún y pimiento asado',icon:'🥪',batchId:'bn',kcal:450,prot:26,portions:1,
      ingredients:['1 pan bocadillo integral','1 lata atún','40 g tomate natural','30 g pimiento asado','5 ml aceite de oliva'],
      steps:['Mezcla atún, tomate muy escurrido y pimiento. Al pan y envuelto en film: cena de guardia sin cocina.']},
    {id:'d-sopa',name:'Crema de verduras con pollo',icon:'🍲',batchId:'bn',kcal:240,prot:18,portions:1,
      ingredients:['150 g calabacín','100 g puerro','1 patata pequeña','50 g pollo desmechado','300 ml agua','2 g sal'],
      steps:['Verduras 15 min con agua y sal, tritura. Pollo por encima.','Caldiente después del turno: hidrata y ayuda a dormir en el saliente.']},
    {id:'d-whey',name:'Batido de whey',icon:'🥤',batchId:'bn',kcal:130,prot:25,portions:1,
      ingredients:['30 g proteína whey','250 ml agua o leche'],
      steps:['Shaker con agua, 20 segundos. No se cocina, no se ensucia nada.']},
    {id:'d-leche-proteica',name:'Leche de proteínas (Mercadona)',icon:'🥛',batchId:'bn',kcal:150,prot:12,portions:1,
      ingredients:['1 brick 250 ml leche de proteínas'],
      steps:['Del brik a la taza. El de siempre para el desayuno de diario, sin pensar.']}
  ],
  meals:[
    {id:'m-desc-b',name:'Desayuno de guardia (sin cocinar)',note:'10 min antes de salir; se coge del frigo y al coche.',items:[{kind:'dish',id:'d-yogur-avena',portions:1},{kind:'dish',id:'d-cafe',portions:1},{kind:'dish',id:'d-fruita-nueces',portions:1}]},
    {id:'m-comida-b1',name:'Táper de guardia · lote del domingo',note:'Ración y media: son 24 h. 4 min de microondas en el destino.',items:[{kind:'dish',id:'d-arroz-pollo',portions:1.5},{kind:'dish',id:'d-fruita-nueces',portions:1}]},
    {id:'m-comida-b2',name:'Táper de guardia · legumbre',note:'Sacia toda la tarde; si hay aviso, cómetelo antes.',items:[{kind:'dish',id:'d-lentejas',portions:1.5},{kind:'dish',id:'d-pan-aceite',portions:1}]},
    {id:'m-cena-g',name:'Cena fría en destino',note:'Nada grasiento a las 22 h o el resto de la guardia se hace eterno.',items:[{kind:'dish',id:'d-sandwich',portions:1},{kind:'dish',id:'d-ensalada-completa',portions:1}]},
    {id:'m-postg',name:'Post-guardia antes de la siesta',note:'No te saltes este paso o duermes fatal y cenas de más.',items:[{kind:'dish',id:'d-tortilla',portions:1},{kind:'dish',id:'d-sopa',portions:1}]},
    {id:'m-desc-f',name:'Desayuno pre-entreno',note:'Tarro del lote del domingo recién sacado.',items:[{kind:'dish',id:'d-porridge',portions:1},{kind:'dish',id:'d-cafe',portions:1}]},
    {id:'m-com-f',name:'Comida post-entreno',note:'Aquí entra doble ración si te interesa subir.',items:[{kind:'dish',id:'d-curry',portions:1},{kind:'dish',id:'d-pan-aceite',portions:1}]},
    {id:'m-cen-f',name:'Cena de fuerza',note:'Proteína lenta (yogur) antes de dormir.',items:[{kind:'dish',id:'d-salmon',portions:1},{kind:'dish',id:'d-yogur-avena',portions:1}]},
    {id:'m-desc-v',name:'Desayuno de vacaciones',note:'Con calma, en casa. Sin el tarro del lote ni la prisa.',items:[{kind:'dish',id:'d-porridge',portions:1},{kind:'dish',id:'d-cafe',portions:1}]},
    {id:'m-com-v',name:'Comida de vacaciones',note:'Se cocina a tu hora; si sobra, cena del día siguiente.',items:[{kind:'dish',id:'d-lentejas',portions:1},{kind:'dish',id:'d-pan-aceite',portions:1}]},
    {id:'m-cen-v',name:'Cena de vacaciones',note:'Aqui vale el pescado al horno con tranquilidad.',items:[{kind:'dish',id:'d-salmon',portions:1},{kind:'dish',id:'d-fruita-nueces',portions:1}]},
    {id:'m-desc-l',name:'Desayuno tranquilo',note:'El único desayuno que se hace con calma.',items:[{kind:'dish',id:'d-porridge',portions:1},{kind:'dish',id:'d-cafe',portions:1}]},
    {id:'m-com-l',name:'Comida de cuchara',note:'Si sobra ración, va al táper de la siguiente guardia.',items:[{kind:'dish',id:'d-lentejas',portions:1},{kind:'dish',id:'d-pan-aceite',portions:1}]},
    {id:'m-cen-l',name:'Cena de horno',note:'Cocina raciones dobles: sobran para 2 cenas más.',items:[{kind:'dish',id:'d-salmon',portions:1},{kind:'dish',id:'d-fruita-nueces',portions:1}]},
    {id:'m-desc-diario',name:'Desayuno rápido de diario',note:'Sin platos preparados: café, fruta y nueces, whey y leche de proteínas. 6 min y a la ducha.',
      items:[{kind:'dish',id:'d-cafe',portions:1},{kind:'dish',id:'d-fruita-nueces',portions:1},{kind:'dish',id:'d-whey',portions:1},{kind:'dish',id:'d-leche-proteica',portions:1}]},
    {id:'m-desc-s',name:'Brunch del saliente',note:'Media mañana en casa, sin culpa.',items:[{kind:'dish',id:'d-tortilla',portions:1},{kind:'dish',id:'d-pan-aceite',portions:1},{kind:'dish',id:'d-cafe',portions:1}]},
    {id:'m-com-s',name:'Comida del saliente',note:'Día de gasto bajo: una ración y sin repetir.',items:[{kind:'dish',id:'d-curry',portions:1},{kind:'dish',id:'d-fruita-nueces',portions:1}]},
    {id:'m-cen-s',name:'Cena suave',note:'Recovery: verdura y proteína, poco arroz.',items:[{kind:'dish',id:'d-yogur-avena',portions:1},{kind:'dish',id:'d-ensalada-completa',portions:1}]}
  ],
  menu:{
    'sh-g':[
      {id:'sg1',time:'07:00',label:'Desayuno antes de entrar',mealId:'m-desc-b',items:[]},
      {id:'sg2',time:'14:00',label:'Comida en destino',mealId:'m-comida-b1',items:[]},
      {id:'sg3',time:'21:30',label:'Cena en destino',mealId:'m-cena-g',items:[]},
      {id:'sg4',time:'01:30',label:'Snack nocturno (opcional)',mealId:'',items:[{kind:'dish',id:'d-fruita-nueces',portions:1}]}],
    'sh-s':[
      {id:'ss1',time:'11:00',label:'Post-guardia + siesta',mealId:'m-postg',items:[]},
      {id:'ss2',time:'14:30',label:'Comida',mealId:'m-com-s',items:[]},
      {id:'ss3',time:'21:00',label:'Cena',mealId:'m-cen-s',items:[]}],
    'sh-f':[
      {id:'sf1',time:'06:00',label:'Desayuno pre-entreno',mealId:'m-desc-f',items:[]},
      {id:'sf2',time:'09:00',label:'Media mañana',mealId:'',items:[{kind:'dish',id:'d-yogur-avena',portions:1}]},
      {id:'sf3',time:'13:30',label:'Comida post-entreno',mealId:'m-com-f',items:[]},
      {id:'sf4',time:'20:30',label:'Cena',mealId:'m-cen-f',items:[]}],
    'sh-t':[
      {id:'st1',time:'07:00',label:'Desayuno antes de salir',mealId:'m-desc-diario',items:[]},
      {id:'st2',time:'14:15',label:'Comida en casa',mealId:'m-com-l',items:[]},
      {id:'st3',time:'20:45',label:'Cena (3-1,5 h antes de dormir)',mealId:'m-cen-l',items:[]}],
    'sh-l':[
      {id:'sl1',time:'09:30',label:'Desayuno',mealId:'m-desc-l',items:[]},
      {id:'sl2',time:'14:00',label:'Comida',mealId:'m-com-l',items:[]},
      {id:'sl3',time:'21:00',label:'Cena',mealId:'m-cen-l',items:[]}],
    'sh-v':[
      {id:'sv1',time:'09:30',label:'Desayuno',mealId:'m-desc-v',items:[]},
      {id:'sv2',time:'14:30',label:'Comida',mealId:'m-com-v',items:[]},
      {id:'sv3',time:'21:30',label:'Cena',mealId:'m-cen-v',items:[]}]
  },
  rules:[
    'Domingo 17:00 y dos horas: tortilla de 8 huevos, 4 tápers de arroz caldoso y 4 de lentejas. Con eso comes 6 días.',
    'Cada lote se cocina pensando en ×2: lo que sobre el domingo va al congelador y es la comida de la siguiente semana de guardias.',
    'En guardia no se cocina ni se pide: desayuno sin fuego, comida del táper, cena fría montada en 5 min.',
    'Después de 24 h: come algo antes de la siesta y siéntala de 90-120 min. Saltarte la comida del saliente es lo que dispara los atracones del día libre.',
    'Cafeína: hasta ~400 mg/día y última toma antes de las 02:00 de la guardia. Después, agua o descafeinado.',
    'Agua en guardia: 2,5-3 l (botella de 1,5 l que rellenas dos veces). Si sudas el uniforme, un poco de sal en una toma.',
    'Proteína 25-35 g en cada toma; carbohidrato doble el día de fuerza y en el desayuno de la guardia.',
    'Tápers: salsa y aliño aparte, 2 h para templar antes a la nevera, 4 días en frío o 2 meses en congelador, y etiqueta con la fecha.',
    'El día libre se come una vez fuera (menú del día, paella, lo que toque) y no se compensa: al día siguiente vuelves al lote.',
    'Si una semana tienes 2 guardias, no dobles la cocina: dobla la tanda del domingo y congela. La semana siguiente solo descongelas.',
    'El mes se cuadra en «Mes»: 4 guardias de urgencias + 2 de UMI, y el día de después es saliente (si la guardia acaba el sábado, el libre cae el lunes: el domingo se descansa en casa).',
    'Entre semana el desayuno es siempre el mismo: café, fruta y nueces, whey y leche de proteínas. Levantarse 06:45, salir 07:30, en el destino 07:45; lo que cambia es la hora de acostarse, no lo que comes.'
  ]
};}

/* ===================== store ===================== */
const KEY='planGuardias.v1', MKEY='planGuardias.marks.v1', TKEY='planGuardias.theme',
  BKEY='planGuardias.lastBackup', FKEY='planGuardias.firstUse', NKEY='planGuardias.backupNag';
function marcarBackup(){try{localStorage.setItem(BKEY,String(Date.now()));}catch(e){}}
function diasDesdeBackup(){try{const t=+localStorage.getItem(BKEY);
  return t?Math.floor((Date.now()-t)/864e5):null;}catch(e){return null;}}
function diasDesdePrimerUso(){try{let t=+localStorage.getItem(FKEY);
  if(!t){t=Date.now();localStorage.setItem(FKEY,String(t));}
  return Math.floor((Date.now()-t)/864e5);}catch(e){return 999;}}
function avisoBackupD(){const v=store.meta&&+store.meta.backupAvisoD;return (v&&v>0)?v:13;}
/* Sin pedirlo, lo guardado en el navegador es «de usar y tirar»: Android y Chrome pueden borrarlo
   cuando al móvil le falta espacio, sin avisar y sin que tú hayas tocado nada. Esto pide que se
   trate como almacenamiento permanente —en una app instalada suele concederse sin preguntar— y así
   solo desaparece si lo borras tú a propósito. No sustituye a la copia en JSON: si desinstalas la
   app o borras los datos del sitio, se va igual. */
let _almacen={estado:'?',usado:null,total:null};
function pedirPersistencia(){
  if(typeof navigator==='undefined'||!navigator.storage)return Promise.resolve();
  const st=navigator.storage;
  const paso=(st.persisted&&st.persist)
    ? st.persisted().then(function(ya){
        if(ya)return true;
        return st.persist();
      }).then(function(ok){_almacen.estado=ok?'si':'no';})
       .catch(function(){_almacen.estado='?';})
    : Promise.resolve();
  return paso.then(function(){
    if(!st.estimate)return;
    return st.estimate().then(function(e){
      _almacen.usado=(e&&e.usage)||0;_almacen.total=(e&&e.quota)||null;}).catch(function(){});
  }).then(function(){if(ui.tab==='data')render();}).catch(function(){});}
function tamanoLegible(n){
  if(n==null)return '';
  if(n<1024)return n+' B';
  if(n<1024*1024)return Math.round(n/1024)+' KB';
  return (Math.round(n/1024/1024*10)/10)+' MB';}
function avisarBackupSiToca(){
  const db=diasDesdeBackup(),dp=diasDesdePrimerUso(),n=avisoBackupD();
  if(!((db===null&&dp>n)||(db!==null&&db>n)))return;
  try{const ultimo=+localStorage.getItem(NKEY);if(Date.now()-ultimo<864e5)return;
    localStorage.setItem(NKEY,String(Date.now()));}catch(e){}
  setTimeout(function(){flash('💾 hace tiempo que no haces una copia de seguridad: en «Datos» tienes «Descargar JSON» — es la única red de seguridad, nada se guarda en ningún servidor',6000);},900);}
let store, ui={tab:'hoy',calMode:'hoy',drawerOpen:false,monSel:'',marks:new Set(),draftPattern:null,openDays:new Set(),openPickers:new Set(),
  calDesde:'',calHasta:'',icsDesde:'',icsHasta:'',calView:false,calTxt:'',calFile:'',calUrl:'',icsPrev:null,
  icsTxt:'',icsEncima:false,
  foodPanel:'',foodObjOpen:false,foodTipo:'',foodCant:0,foodPos:'',cocinaTab:'',platosTab:'',antojo:null,prodMarca:'',
  shopVista:'',compraCerradas:new Set(['rutina','basicos']),compraAbiertas:new Set(),tandaAbierta:'',dineroVista:'',notaProy:'',cfgVista:'',
  evVista:'',evForm:null,ajuVista:'',datosVista:'',estVista:'',estTxt:'',estPrev:null,arranque:null,
  gymFiltroRegion:'',gymFiltroTipo:'gimnasio',scanSoloMercadona:true,
  evNuevo:{dow:[],modo:'semanal',fecha:''},habNuevo:{dow:[]},habDetalle:'',cardioAbierto:'',listaPlatos:'',gymPanel:'',typesVista:'',dishQ:'',foodVista:'',
  cocinaPlato:'',cocinaPaso:0,cocinaRac:0,foodBusca:'',foodSel:'',lectorGuia:false,diaEditor:false,usdaGuia:false,
  alimQ:'',alimGrupo:'',alimSel:'',alimG:100,neveraQ:'',microAbierto:'',
  plato:null,platoQ:'',ideasCache:null,alimNuevo:null,sitioNuevo:false,
  notaSel:'',notaFiltro:'',notaNueva:'',
  imp:{txt:'',url:'',receta:null,estado:'',msg:'',destinoLote:'',destinoDia:'',via:'',imagenes:null}};
const allOpen=()=>{const ds=semanaVentana();return ds.length>0&&ds.every(function(d){return ui.openDays.has(d.key||('tpl'+d.idx));});};
function load(){
  let ok=false,raw=null,habiaAlgo=false;
  try{raw=localStorage.getItem(KEY);
    habiaAlgo=!!(raw&&raw!=='undefined'&&raw!=='null');
    if(habiaAlgo){const o=JSON.parse(raw);
      if(o&&Array.isArray(o.shifts)&&o.menu&&Array.isArray(o.dishes)){store=o;ok=true;}}}catch(e){
    console.warn('no se pudo leer el planning guardado, se arranca de cero');}
  if(!ok){store=DEFAULTS();
    if(habiaAlgo)setTimeout(function(){flash('⚠ no se ha podido leer tu planning guardado (datos dañados o de un formato antiguo): se ha cargado el ejemplo. No hemos borrado nada — tus datos anteriores siguen tal cual en el navegador',7000);},0);}
  normalize(store);
  /* primer arranque: no hab\u00eda NADA guardado y no viene de una copia ya montada. Quien ya tiene
     sus datos no ve el asistente nunca, ni aunque actualice la app. */
  if(!habiaAlgo&&!(store.meta&&store.meta.montada))ui.arranque={paso:0,jEntra:'08:00',jSale:'15:00',
    gEntra:'08:00',gSale:'08:00',gMes:4,despierta:'06:50',acuesta:'22:40',sitio:SITIOS_FIJOS[0].id};
  try{const m=JSON.parse(localStorage.getItem(MKEY)||'[]');if(Array.isArray(m))ui.marks=new Set(m);}catch(e){}
  try{if(localStorage.getItem(TKEY)!=='light')document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}
  aplicarTema();
}
/* ===================== temas de color =====================
   Cinco aspectos ya hechos, cada uno con su fondo, su texto, su acento y los colores de la franja
   pensados JUNTOS: con los selectores sueltos se podía poner el texto en negro sobre el fondo negro, o
   el sueño y el trabajo del mismo blanco, y la app dejaba de leerse. Elegir uno pone también si es
   claro u oscuro, y los colores de la franja. */
const TEMAS=[
  {id:'hud',nombre:'Noche HUD',modo:'dark',
    v:{bg:'#070b14',bg2:'#0b1120',card:'#111a2b',ink:'#e9f2ff',ink2:'#8fa6c6',line:'#1e2b44',brand:'#38e1ff',brand2:'#7c5cff',accent:'#a3e635'},
    f:{sleep:'#7c5cff',work:'#f59e0b',guard:'#ef4444',meal:'#10b981',gym:'#22d3ee',evt:'#e879f9'}},
  {id:'magenta',nombre:'Magenta',modo:'dark',
    v:{bg:'#12081a',bg2:'#1a0c24',card:'#1f1230',ink:'#f7eefe',ink2:'#b7a3c9',line:'#35224a',brand:'#f050c8',brand2:'#8b5cf6',accent:'#fbbf24'},
    f:{sleep:'#6d5dfc',work:'#f59e0b',guard:'#f43f5e',meal:'#34d399',gym:'#38bdf8',evt:'#f050c8'}},
  {id:'bosque',nombre:'Bosque',modo:'dark',
    v:{bg:'#06120e',bg2:'#0a1a14',card:'#10241c',ink:'#eafbf2',ink2:'#95b8a8',line:'#1f3a2f',brand:'#34d399',brand2:'#2dd4bf',accent:'#facc15'},
    f:{sleep:'#818cf8',work:'#fb923c',guard:'#f87171',meal:'#facc15',gym:'#2dd4bf',evt:'#f0abfc'}},
  {id:'papel',nombre:'Papel',modo:'light',
    v:{bg:'#eef2f9',bg2:'#e6ecf7',card:'#ffffff',ink:'#0d1729',ink2:'#5a6d8a',line:'#dbe4f2',brand:'#2563eb',brand2:'#7c3aed',accent:'#15803d'},
    f:{sleep:'#6366f1',work:'#d97706',guard:'#dc2626',meal:'#059669',gym:'#0891b2',evt:'#c026d3'}},
  {id:'arena',nombre:'Arena',modo:'light',
    v:{bg:'#f5efe4',bg2:'#ede5d6',card:'#fffcf6',ink:'#2a2118',ink2:'#76685a',line:'#e4d9c6',brand:'#c2410c',brand2:'#0f766e',accent:'#4d7c0f'},
    f:{sleep:'#4f46e5',work:'#ea580c',guard:'#b91c1c',meal:'#15803d',gym:'#0e7490',evt:'#a21caf'}}];
const TEMA_VARS=['bg','bg2','card','ink','ink2','line','brand','brand2','accent'];
function temaById(id){return TEMAS.filter(function(t){return t.id===id;})[0]||null;}
function luminancia(hex){
  const m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex||''));if(!m)return null;
  const c=[m[1],m[2],m[3]].map(function(x){const v=parseInt(x,16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contraste(a,b){const la=luminancia(a),lb=luminancia(b);if(la==null||lb==null)return 21;
  return (Math.max(la,lb)+.05)/(Math.min(la,lb)+.05);}
function fondoActual(){
  const t=temaById((store.tema||{}).preset),osc=document.documentElement.classList.contains('dark');
  if(t&&(t.modo==='dark')===osc)return t.v.bg;
  return osc?'#070b14':'#eef2f9';}
function tintaLegible(ink){
  /* el color de texto a mano solo se aplica si se lee sobre el fondo que hay: texto negro en modo
     noche dejaba la app en blanco y negro sobre negro */
  return /^#[0-9a-fA-F]{6}$/.test(ink||'')&&contraste(ink,fondoActual())>=4.5;}
function aplicarTema(){
  /* el tema elegido (fondos, texto, acento) cuando la pantalla está en su modo; encima, el color de
     acento que hayas puesto a mano; vacío = el de la app */
  const t=(store.tema)||{},root=document.documentElement.style;
  const ok=v=>/^#[0-9a-fA-F]{6}$/.test(v||'');
  const pre=temaById(t.preset),osc=document.documentElement.classList.contains('dark');
  const usaPre=!!(pre&&(pre.modo==='dark')===osc);
  TEMA_VARS.forEach(function(k){if(usaPre)root.setProperty('--'+k,pre.v[k]);else root.removeProperty('--'+k);});
  if(ok(t.brand))root.setProperty('--brand',t.brand);
  if(ok(t.brand2))root.setProperty('--brand2',t.brand2);
  if(tintaLegible(t.ink))root.setProperty('--ink',t.ink);
  const mt=document.querySelector('meta[name="theme-color"]');
  if(mt)mt.setAttribute('content',usaPre?pre.v.bg:(osc?'#070b14':'#eef2f9'));
}
function ponerTema(id){
  const pre=temaById(id);if(!pre)return 'ese tema no existe';
  store.tema={brand:'',brand2:'',ink:'',preset:pre.id};
  if(!store.franja)store.franja={horas:24};
  store.franja.colores=Object.assign({},pre.f);
  const osc=pre.modo==='dark';
  document.documentElement.classList.toggle('dark',osc);
  try{localStorage.setItem(TKEY,osc?'dark':'light');}catch(e){}
  aplicarTema();save();render();
  return 'tema «'+pre.nombre+'» puesto, con sus colores de la franja';}
function normalize(o){
  const d=DEFAULTS();
  if(!o.meta||typeof o.meta!=='object')o.meta={};
  o.meta.montada=!!o.meta.montada;   /* si no, el asistente volver\u00eda a salir tras restaurar una copia */
  if(!o||!Array.isArray(o.shifts)||!o.menu)return o;
  ['meta','shifts','rotation','patterns','batches','dishes','meals','menu','rules','rhythm'].forEach(k=>{if(o[k]==null)o[k]=d[k];});
  if(!o.rhythm||typeof o.rhythm!=='object')o.rhythm={};
  o.shifts.forEach(function(s2){if(!o.rhythm[s2.id])o.rhythm[s2.id]=d.rhythm[s2.id]||{wake:'',breakfast:'',leave:'',arrive:'',sleep:''};});
  if(!o.meta)o.meta={owner:'',notes:''};
  if(typeof o.meta.backupAvisoD!=='number'||o.meta.backupAvisoD<1)o.meta.backupAvisoD=13;
  if(!Array.isArray(o.patterns)||!o.patterns.length)o.patterns=d.patterns;
  if(!o.rotation||typeof o.rotation!=='object')o.rotation=d.rotation;
  if(typeof o.rotation.pattern!=='number'||!o.patterns[o.rotation.pattern])
    o.rotation.pattern=Math.max(0,Math.min(o.patterns.length-1,o.rotation.pattern||0));
  if(!o.rotation.shiftByDay)o.rotation.shiftByDay={};
  if(!o.rotation.daySet)o.rotation.daySet={};
  if(o.rotation.monthService==null)o.rotation.monthService='';   /* el servicio lo pones tú, no se inventa */
  if(!o.rotation.quota||typeof o.rotation.quota!=='object')o.rotation.quota={urg:4,umi:2};
  ['urg','umi'].forEach(function(k){if(typeof o.rotation.quota[k]!=='number')o.rotation.quota[k]=(k==='urg'?4:2);});
  if(o.rotation.autoPos===undefined)o.rotation.autoPos=true;
  if(!o.rotation.saltoDia||typeof o.rotation.saltoDia!=='object')o.rotation.saltoDia={from:6,to:1};
  o.rotation.saltoDia.from=Math.max(0,Math.min(6,+o.rotation.saltoDia.from));
  o.rotation.saltoDia.to=Math.max(0,Math.min(6,+o.rotation.saltoDia.to));
  if(isNaN(o.rotation.saltoDia.from))o.rotation.saltoDia.from=6;
  if(isNaN(o.rotation.saltoDia.to))o.rotation.saltoDia.to=1;
  if(typeof o.rotation.icsAvisoMin!=='number'||o.rotation.icsAvisoMin<0)o.rotation.icsAvisoMin=30;
  if(o.rotation.calWeekStart!=='lun'&&o.rotation.calWeekStart!=='dom')o.rotation.calWeekStart='lun';
  if([5,7,10,14].indexOf(+o.rotation.semanaDias)<0)o.rotation.semanaDias=7;
  if(!o.tema||typeof o.tema!=='object')o.tema={brand:'',brand2:'',ink:''};
  ['brand','brand2','ink'].forEach(function(k){if(!/^#[0-9a-fA-F]{6}$/.test(o.tema[k]||''))o.tema[k]='';});
  if(!TEMAS.some(function(t){return t.id===o.tema.preset;}))o.tema.preset='';
  if(!Array.isArray(o.listas))o.listas=[];
  o.listas=o.listas.map(function(l){return l&&typeof l==='object'?{
    id:String(l.id||uid('ls')),nombre:String(l.nombre||'Lista').slice(0,60),fija:!!l.fija,
    items:(Array.isArray(l.items)?l.items:[]).map(function(x){return String(x||'').trim().slice(0,90);}).filter(Boolean)}:null;})
    .filter(Boolean);
  if(!o.franja||typeof o.franja!=='object')o.franja={};
  o.franja.horas=[12,18,24].indexOf(+o.franja.horas)>=0?+o.franja.horas:24;
  /* el «lector de enlaces»: una función propia que va a buscar la descripción de un vídeo.
     Solo https, y solo lo que el usuario haya escrito a mano en Ajustes. */
  if(o.impPendiente&&typeof o.impPendiente==='object'){
    o.impPendiente={txt:String(o.impPendiente.txt||'').slice(0,20000),
      url:String(o.impPendiente.url||'').slice(0,500),
      ts:+o.impPendiente.ts||0,abierto:!!o.impPendiente.abierto};
    if(!o.impPendiente.txt&&!o.impPendiente.url)o.impPendiente=null;
  }else o.impPendiente=null;
  migraNotasDia(o);   /* mismo sitio que migrarRutinas: normalize() es el embudo por el que pasa
                         TODO almacén —arranque, importar una copia, restaurar—, así que una copia
                         vieja traída por cualquiera de esas vías se migra igual */
  purgaNotas(o);
  if(!Array.isArray(o.notas))o.notas=[];
  o.notas=o.notas.map(function(x){return (x&&typeof x==='object')?{
    id:String(x.id||uid('nt')),txt:String(x.txt||'').slice(0,600),
    fecha:/^\d{4}-\d{2}-\d{2}$/.test(x.fecha||'')?x.fecha:'',
    hecha:(+x.hecha>0)?+x.hecha:0,
    color:/^#[0-9a-fA-F]{6}$/.test(x.color||'')?x.color:'',
    evId:String(x.evId||''),ts:+x.ts||Date.now()}:null;})
    .filter(function(x){return x&&x.txt.trim();});
  if(!o.notasDia||typeof o.notasDia!=='object'||Array.isArray(o.notasDia))o.notasDia={};
  Object.keys(o.notasDia).forEach(function(k){
    const t=String(o.notasDia[k]||'').slice(0,400);
    if(t.trim())o.notasDia[k]=t;else delete o.notasDia[k];});
  if(!o.lector||typeof o.lector!=='object')o.lector={proxy:''};
  o.lector.proxy=/^https:\/\/[^\s"'<>]+$/.test(String(o.lector.proxy||'').trim())?String(o.lector.proxy).trim().slice(0,300):'';
  o.lector.publico=!!o.lector.publico;   /* usar intermediarios públicos: solo si lo has aceptado */
  if(!Array.isArray(o.sitios))o.sitios=[];
  o.sitios=o.sitios.map(function(x){return (x&&typeof x==='object'&&x.id)?{
    id:String(x.id).slice(0,20),nombre:String(x.nombre||'Sitio').slice(0,48),
    lat:Math.max(-90,Math.min(90,+x.lat||0)),lon:Math.max(-180,Math.min(180,+x.lon||0)),
    tz:String(x.tz||'').slice(0,40)}:null;}).filter(Boolean);
  if(typeof o.sitio!=='string'||!o.sitio)o.sitio='lpa';
  if(!o.usda||typeof o.usda!=='object')o.usda={key:''};
  o.usda.key=String(o.usda.key||'').trim().slice(0,120);   /* clave de FoodData Central: tuya, se queda en el móvil */
  if(!o.franja.colores||typeof o.franja.colores!=='object')o.franja.colores={};
  Object.keys(o.franja.colores).forEach(function(k){
    if(TLKEYS.indexOf(k)<0||!/^#[0-9a-fA-F]{6}$/.test(o.franja.colores[k]||''))delete o.franja.colores[k];});
  if(!Array.isArray(o.rotation.servicios)||!o.rotation.servicios.length)o.rotation.servicios=d.rotation.servicios.slice();
  o.rotation.servicios=o.rotation.servicios.map(function(x){return String(x||'').trim();}).filter(Boolean);
  /* cuántos meses dura cada rotación: hay servicios de 1 mes y servicios de 2 o 3 */
  if(!Array.isArray(o.rotation.svcMeses))o.rotation.svcMeses=[];
  o.rotation.svcMeses=o.rotation.servicios.map(function(_,ix){
    const n=Math.round(+o.rotation.svcMeses[ix]);return (n>=1&&n<=6)?n:1;});
  if(typeof o.rotation.guardiasMes!=='number')
    o.rotation.guardiasMes=o.rotation.quota?((+o.rotation.quota.urg||0)+(+o.rotation.quota.umi||0)||6):6;
  if(!o.rotation.month)o.rotation.month={};
  Object.keys(o.rotation.month).forEach(function(k){const mm=o.rotation.month[k];if(!mm||typeof mm!=='object')return;
    if(typeof mm.guardias!=='number'){const q=mm.quota||o.rotation.quota||{urg:0,umi:0};
      mm.guardias=(+q.urg||0)+(+q.umi||0)||o.rotation.guardiasMes;}
    delete mm.quota;
    if(mm.service&&!o.rotation.servicios.some(function(x){return x.toLowerCase()===String(mm.service).toLowerCase();}))
      o.rotation.servicios.push(mm.service);});
  if(!o.rotation.jornada)o.rotation.jornada=d.rotation.jornada;
  if(o.rotation.jornada.aplicaLibres===undefined)o.rotation.jornada.aplicaLibres=true;
  if(!o.food||typeof o.food!=='object')o.food=JSON.parse(JSON.stringify(d.food||{objetivo:{kcal:0,prot:0},eans:{},log:{},fav:[]}));
  if(!o.food.objetivo||typeof o.food.objetivo!=='object')o.food.objetivo={kcal:0,prot:0};
  /* el perfil: sin registrarlo aquí se perdería al recargar, como todo lo que normalize() no conoce */
  if(!o.perfil||typeof o.perfil!=='object')o.perfil={};
  o.perfil.celiaco=!!o.perfil.celiaco;
  /* la avena certificada: por defecto sí, que es lo que compra él */
  o.perfil.avenaSinGluten=o.perfil.avenaSinGluten!==false;
  o.perfil.alturaCm=(+o.perfil.alturaCm>=100&&+o.perfil.alturaCm<=250)?+o.perfil.alturaCm:0;
  o.perfil.pesoKg=(+o.perfil.pesoKg>=30&&+o.perfil.pesoKg<=300)?+o.perfil.pesoKg:0;
  o.perfil.sexo=(o.perfil.sexo==='m')?'m':'h';
  o.perfil.nacido=(+o.perfil.nacido>=1900&&+o.perfil.nacido<=2100)?+o.perfil.nacido:0;
  o.perfil.actividad=(+o.perfil.actividad>=1.2&&+o.perfil.actividad<=2.2)?+o.perfil.actividad:1.5;
  o.perfil.meta=(['perder','mantener','ganar'].indexOf(o.perfil.meta)>=0)?o.perfil.meta:'mantener';
  /* el peso, uno por día: lo que de verdad se puede seguir. La masa muscular NO se calcula de los
     menús —eso sería inventarla—; lo que se sigue es el peso y su tendencia. */
  o.perfil.pesos=Array.isArray(o.perfil.pesos)?o.perfil.pesos
    .filter(function(x){return x&&/^\d{4}-\d{2}-\d{2}$/.test(String(x.k))&&+x.kg>=30&&+x.kg<=300;})
    .map(function(x){return {k:x.k,kg:Math.round(+x.kg*10)/10};})
    .sort(function(a,b){return a.k.localeCompare(b.k);}).slice(-400):[];
  if(!o.food.eans||typeof o.food.eans!=='object')o.food.eans={};
  if(!o.food.log||typeof o.food.log!=='object')o.food.log={};
  if(!Array.isArray(o.food.fav))o.food.fav=[];
  /* la despensa con cantidades: sin registrarla aquí se perdería al recargar */
  o.food.despensa=Array.isArray(o.food.despensa)?o.food.despensa
    .filter(function(x){return x&&typeof x==='object'&&String(x.k||'').trim();})
    .map(function(x){return {k:String(x.k).slice(0,60),nom:String(x.nom||x.k).slice(0,80),
      q:Math.max(0,Math.min(100000,+x.q||0)),uni:(['g','ml',''].indexOf(x.uni)>=0?x.uni:''),
      q0:Math.max(0,Math.min(100000,+x.q0||+x.q||0)),
      ts:+x.ts||Date.now(),sec:String(x.sec||'otros').slice(0,16)};})
    .slice(0,400):[];
  /* lo que has metido en la nevera a mano: ids de la tabla de alimentos, no objetos */
  o.food.neveraMano=Array.isArray(o.food.neveraMano)
    ?o.food.neveraMano.filter(function(x){return typeof x==='string'&&x&&x.length<60;}).slice(0,300):[];
  o.food.ultimaCompra=/^\d{4}-\d{2}-\d{2}$/.test(String(o.food.ultimaCompra))?o.food.ultimaCompra:'';
  o.food.compraCada=(+o.food.compraCada>=1&&+o.food.compraCada<=14)?+o.food.compraCada:4;
  if(!o.gym||typeof o.gym!=='object')o.gym=JSON.parse(JSON.stringify(d.gym||{biblioteca:[],rutinas:[],registro:[],sesiones:[],cardio:[],fav:[],
    segundo:{on:true,dias:[2,5],tipo:'piscina',hora:'15:30'}}));
  ['biblioteca','registro','fav'].forEach(function(k){if(!Array.isArray(o.gym[k]))o.gym[k]=[];});
  migrarRutinas(o.gym);
  if(!Array.isArray(o.gym.sesiones))o.gym.sesiones=[];
  if(!Array.isArray(o.gym.cardio))o.gym.cardio=[];
  if(!o.gym.segundo||typeof o.gym.segundo!=='object')
    o.gym.segundo={on:true,dias:[2,5],tipo:'piscina',hora:'15:30'};
  if(!Array.isArray(o.gym.segundo.dias))o.gym.segundo.dias=[2,5];
  /* los cambios de día sueltos: {díaQueTocaba:díaAlQueSeMueve}, ambos YYYY-MM-DD. Sin registrarlos
     aquí se perderían al recargar, que es lo que pasa con todo campo que normalize() no conoce.
     Se tiran los de hace más de 60 días: ya no cambian nada y solo engordan el guardado. */
  /* los objetivos: sin registrarlos aquí se perderían al recargar, como todo lo que normalize()
     no conoce. Se valida el tipo y el número, y se tira lo que no cuadre. */
  if(!Array.isArray(o.gym.objetivos))o.gym.objetivos=[];
  else o.gym.objetivos=o.gym.objetivos.filter(function(x){
    return x&&typeof x==='object'&&['fuerza','constancia','tiempo'].indexOf(x.tipo)>=0&&+x.meta>0;})
    .slice(0,12).map(function(x){
      return {id:String(x.id||uid('obj')),tipo:x.tipo,ex:String(x.ex||'').slice(0,60),
        meta:Math.min(1000,Math.max(0.5,+x.meta)),desde:/^\d{4}-\d{2}-\d{2}$/.test(String(x.desde))?x.desde:iso(new Date())};});
  if(!o.gym.cambios||typeof o.gym.cambios!=='object'||Array.isArray(o.gym.cambios))o.gym.cambios={};
  else{const lim=iso(addDays(new Date(),-60)),lim2=iso(addDays(new Date(),400));
    Object.keys(o.gym.cambios).forEach(function(k){
      const v=o.gym.cambios[k];
      if(!/^\d{4}-\d{2}-\d{2}$/.test(k)||!/^\d{4}-\d{2}-\d{2}$/.test(String(v))||k<lim||v<lim||v>lim2||v===k)
        delete o.gym.cambios[k];});}
  if(!o.sueno||typeof o.sueno!=='object')o.sueno={min:8,cenaMin:90,cenaMax:180,latencia:10};
  ['min','cenaMin','cenaMax','latencia'].forEach(function(k){if(typeof o.sueno[k]!=='number')o.sueno[k]={min:8,cenaMin:90,cenaMax:180,latencia:10}[k];});
  /* la siesta del saliente: puede ser 0, así que se comprueba el rango y no el «si es verdadero».
     De fábrica son 6 h: el día que sales de guardia lo que hace falta es llegar a dormir 6 h por la
     mañana y 8 por la noche. Antes puse 3 h por mi cuenta y estaba mal; a quien tuviera guardado
     ese valor exacto se le sube, y a quien haya puesto otro no se le toca. */
  if(o.sueno.siesta===180&&o.sueno.siestaMia!==true)o.sueno.siesta=360;
  if(typeof o.sueno.siesta!=='number'||o.sueno.siesta<0||o.sueno.siesta>480)o.sueno.siesta=360;
  /* a qué hora se come, que depende de si ese día entrenas y no del tipo de día */
  if(!o.comidas||typeof o.comidas!=='object')o.comidas={};
  const hhx=/^\d{1,2}:\d{2}$/;
  [['conEntreno','18:00','18:30'],['sinEntreno','14:00','15:00']].forEach(function(f){
    const v=o.comidas[f[0]];
    if(!v||typeof v!=='object'||!hhx.test(String(v.de||''))||!hhx.test(String(v.a||'')))
      o.comidas[f[0]]={de:f[1],a:f[2]};
    else o.comidas[f[0]]={de:String(v.de),a:String(v.a)};});
  if(typeof o.comidas.trasSiesta!=='number'||o.comidas.trasSiesta<0||o.comidas.trasSiesta>180)o.comidas.trasSiesta=30;
  /* las horas de cada tipo de guardia. Sin esto, normalize() las tiraba al recargar y la app volvía
     a creer que todas las guardias duran de 8:00 a 8:00 pasara lo que pasara. */
  if(Array.isArray(o.rotation.guardiaTipos))o.rotation.guardiaTipos=o.rotation.guardiaTipos
    .filter(function(t){return t&&t.code;})
    .map(function(t){const h=function(v,d){const m=/^(\d{1,2}):(\d{2})$/.exec(String(v||'').trim());
        return m&&+m[1]<24&&+m[2]<60?(String(+m[1]).padStart(2,'0')+':'+m[2]):d;};
      return {code:String(t.code).slice(0,8),label:String(t.label||'').slice(0,22),
        relevoSem:h(t.relevoSem,'08:00'),
        relevoFinde:h(t.relevoFinde,String(t.code)==='umi'?'10:00':'09:00'),
        pase:Math.max(0,Math.min(480,Math.round(+t.pase||0)))};});
  if(!Array.isArray(o.rotation.vacaciones))o.rotation.vacaciones=[];
  o.rotation.vacaciones=o.rotation.vacaciones.filter(function(v){return v&&v.start&&v.end;})
    .map(function(v){return {label:String(v.label||''),start:String(v.start),end:String(v.end)};});
  if(!o.rotation.jornada||typeof o.rotation.jornada!=='object')o.rotation.jornada={start:'',end:'',workdays:[1,2,3,4,5]};
  if(!Array.isArray(o.rotation.jornada.workdays)||!o.rotation.jornada.workdays.length)o.rotation.jornada.workdays=[1,2,3,4,5];
  o.rotation.jornada.workdays=o.rotation.jornada.workdays.map(function(x){return +x;})
    .filter(function(x){return x>=0&&x<=6;}).sort(function(a,b){return a-b;});
  if(!o.estudio||typeof o.estudio!=='object')o.estudio={};
  {const e=o.estudio;
   if(!e.fuente||typeof e.fuente!=='object')e.fuente={nombre:'',url:'',cuando:''};
   e.fuente={nombre:String(e.fuente.nombre||'').slice(0,80),
     url:/^https:\/\//.test(e.fuente.url||'')?String(e.fuente.url).slice(0,400):'',
     cuando:/^\d{4}-\d{2}-\d{2}$/.test(e.fuente.cuando||'')?e.fuente.cuando:''};
   e.temas=(Array.isArray(e.temas)?e.temas:[]).filter(function(t){return t&&t.id&&t.nombre;})
     .map(function(t){return {id:String(t.id).slice(0,64),nombre:String(t.nombre).slice(0,120),
       bloque:String(t.bloque||'').slice(0,60),peso:Math.max(0,Math.min(9,+t.peso||0)),
       url:/^https:\/\//.test(t.url||'')?String(t.url).slice(0,400):''};});
   if(!e.estado||typeof e.estado!=='object')e.estado={};
   Object.keys(e.estado).forEach(function(k){const x=e.estado[k]||{};
     e.estado[k]={nivel:Math.max(0,Math.min(4,+x.nivel||0)),
       visto:/^\d{4}-\d{2}-\d{2}$/.test(x.visto||'')?x.visto:'',
       repasos:(Array.isArray(x.repasos)?x.repasos:[]).filter(function(f){return /^\d{4}-\d{2}-\d{2}$/.test(f);}).slice(-12),
       min:Math.max(0,+x.min||0)};});
   e.sesiones=(Array.isArray(e.sesiones)?e.sesiones:[]).filter(function(x){return x&&x.id&&/^\d{4}-\d{2}-\d{2}$/.test(x.fecha||'');})
     .map(function(x){return {id:String(x.id).slice(0,40),fecha:x.fecha,min:Math.max(0,Math.min(600,+x.min||0)),
       temas:(Array.isArray(x.temas)?x.temas:[]).map(String).slice(0,20)};});}
  ahorroLimpia(o);
  if(!Array.isArray(o.eventos))o.eventos=[];
  o.eventos=o.eventos.filter(function(e){return e&&e.id;}).map(function(e){
    const modo=e.modo==='fecha'?'fecha':'semanal';
    return {id:e.id,titulo:String(e.titulo||''),hora:/^\d{2}:\d{2}$/.test(e.hora||'')?e.hora:'09:00',
      /* hasta qué hora dura. Vacío = como siempre: la app no sabe cuánto ocupa y lo trata como una
         cita suelta. OJO: este map DESCARTA cualquier campo que no esté aquí, así que un campo nuevo
         que no se dé de alta en esta lista se pierde en la siguiente carga sin dar ningún error. */
      fin:/^\d{2}:\d{2}$/.test(e.fin||'')?e.fin:'',
      modo:modo,
      dow:Array.isArray(e.dow)?e.dow.map(Number).filter(function(x){return x>=0&&x<=6;}):[],
      fecha:/^\d{4}-\d{2}-\d{2}$/.test(e.fecha||'')?e.fecha:'',
      recordatorio:!!e.recordatorio,cuentaAtras:!!e.cuentaAtras,
      /* el enlace de vuelta a la nota que creó este evento. Estaba escrito en notaAEvento() pero
         no en esta lista, así que se perdía en la siguiente carga sin que nadie se enterara. */
      notaId:String(e.notaId||''),
      /* semanal que solo existe los días que trabajas (no en vacaciones ni libres) */
      soloTrabajo:!!e.soloTrabajo,
      color:/^#[0-9a-fA-F]{6}$/.test(e.color||'')?e.color:'#38e1ff',on:e.on!==false};})
    .filter(function(e){return e.modo==='semanal'?e.dow.length>0:!!e.fecha;});
  /* las dos sesiones fijas del hospital: la de la UMI los martes (8:00–8:39) y la general del
     auditorio los jueves (8:00–8:30). Se meten UNA vez; si luego las borras o las cambias, se quedan
     como las dejes. Una instalación nueva (DEFAULTS) ya viene con la marca puesta: son las tuyas,
     no se le cuelan a quien estrena la app. */
  if(!o.meta.sesionesFijas){
    o.meta.sesionesFijas=true;
    if(!o.eventos.some(function(e){return /sesi[oó]n.*umi/i.test(e.titulo);}))
      o.eventos.push({id:'ev-ses-umi',titulo:'Sesión UMI',hora:'08:00',fin:'08:39',modo:'semanal',dow:[2],fecha:'',
        recordatorio:false,cuentaAtras:false,notaId:'',soloTrabajo:true,color:'#f472b6',on:true});
    if(!o.eventos.some(function(e){return /sesi[oó]n general/i.test(e.titulo);}))
      o.eventos.push({id:'ev-ses-gen',titulo:'Sesión general · auditorio',hora:'08:00',fin:'08:30',modo:'semanal',dow:[4],fecha:'',
        recordatorio:false,cuentaAtras:false,notaId:'',soloTrabajo:true,color:'#38e1ff',on:true});}
  if(!o.habitos||typeof o.habitos!=='object')o.habitos={items:[],registro:{}};
  if(!Array.isArray(o.habitos.items))o.habitos.items=[];
  o.habitos.items=o.habitos.items.filter(function(h){return h&&h.id;}).map(function(h){
    const dow=Array.isArray(h.dow)?h.dow.map(Number).filter(function(x){return x>=0&&x<=6;}):[];
    return {id:h.id,nombre:String(h.nombre||''),icono:String(h.icono||'✅').slice(0,4)||'✅',
      color:/^#[0-9a-fA-F]{6}$/.test(h.color||'')?h.color:'#38e1ff',
      dow:dow.length?dow:[0,1,2,3,4,5,6],creado:h.creado||iso(new Date())};});
  if(!o.habitos.registro||typeof o.habitos.registro!=='object')o.habitos.registro={};
  Object.keys(o.habitos.registro).forEach(function(k){
    if(!o.habitos.registro[k]||typeof o.habitos.registro[k]!=='object')delete o.habitos.registro[k];});
  if(!Array.isArray(o.rules))o.rules=[];
  if(!Array.isArray(o.dishes))o.dishes=[];
  if(!Array.isArray(o.meals))o.meals=[];
  if(!Array.isArray(o.batches))o.batches=[];
  if(!o.batches.some(b=>b.id==='bn'))o.batches.push({id:'bn',label:'Sin lote (la vuelta)',when:'',note:''});
  const mids=new Set((o.meals||[]).map(m=>m.id));
  o.shifts.forEach(s2=>{if(!o.menu[s2.id])o.menu[s2.id]=[];
    o.menu[s2.id].forEach(sl=>{if(sl.mealId&&!mids.has(sl.mealId))sl.mealId='';});});
  return o;
}
let saveFailWarned=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(store));saveFailWarned=false;}catch(e){console.warn('no se pudo guardar',e);
  if(!saveFailWarned){saveFailWarned=true;flash('⚠ no se ha podido guardar: el navegador no deja escribir (¿modo incógnito o memoria llena?). Copia tu JSON desde «Datos» antes de cerrar esta pestaña',6000);}}}
function saveMarks(){try{localStorage.setItem(MKEY,JSON.stringify(Array.from(ui.marks)));}catch(e){}}
const shiftById=id=>store.shifts.find(s=>s.id===id);
const shiftByCode=c=>store.shifts.find(s=>s.code===c)||(c&&store.shifts.find(s=>s.name.toLowerCase()===String(c).toLowerCase()));
const dishById=id=>store.dishes.find(d=>d.id===id);
const mealById=id=>store.meals.find(m=>m.id===id);
const batchById=id=>store.batches.find(b=>b.id===id);
const isBatch=id=>!!id&&id!=='bn';

function rotationStrip(){
  /* el ciclo de semanas tipo, con lo que exige de cocina cada una */
  if(!store.patterns.length)return '';
  const rows=store.patterns.map(function(p,i){
    const codes=p.days.map(function(c){return resolveCode(c)||'';});
    const g=codes.filter(function(id){return isGuardia(shiftById(id));}).length;
    const plan=planBatches(codes.map(function(id){return {shiftId:id||null};}));
    const keys=Object.keys(plan).filter(function(k){return plan[k].hasNeed;});
    const rac=Math.round(keys.reduce(function(a,k){return a+plan[k].portions;},0)*10)/10;
    const dots=codes.map(function(id){const sh=shiftById(id);
      return `<span class="tag" style="background:${sh?sh.color+'22':'transparent'};color:${sh?sh.color:'var(--ink2)'};padding:2px 6px" title="${sh?esc(sh.name):'sin asignar'}">${sh?esc(sh.icon):'·'}</span>`;}).join('');
    return `<tr><td><b>${i+1}</b></td><td>${esc(p.name)}</td><td>${dots}</td><td><b>${g}</b></td><td>${rac} rac. · ${keys.length} sesión(es)</td></tr>`;
  }).join('');
  const active=store.patterns[store.rotation.pattern];
  return `<div style="margin-top:12px"><b class="mini">CICLO DE SEMANAS · se repite en este orden${store.rotation.mode==='date'?' y está anclado al '+esc(store.rotation.anchor||'')+' como lunes de la semana 1':''}</b>
    <table style="margin-top:4px"><thead><tr><th>#</th><th>Semana tipo</th><th>L→D</th><th>G</th><th>Cocina que exige</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="mini" style="margin-top:6px">Semana en pantalla: <b>${active?esc(active.name):'—'}</b>. En modo fecha la app elige la fila que toca según el calendario; en modo plantilla la eliges tú.</p></div>`;
}

const tagFor=id=>{const i=store.batches.findIndex(b=>b.id===id);return 'b'+((i<0?0:i)%4)+1;};

/* ===================== semana ===================== */
let weekDate=mondayOf(new Date());
let _renderTick=0;
let _weekDaysCache=null,_weekDaysTick=-1;
function weekDays(){
  if(_weekDaysTick===_renderTick&&_weekDaysCache)return _weekDaysCache;
  const r=store.rotation,out=[];
  if(r.mode==='date'){
    for(let i=0;i<7;i++){
      const d=addDays(mondayOf(weekDate),i);
      const inf=dayInfo(iso(d));
      const legacy=(r.shiftByDay&&r.shiftByDay[iso(d)]!==undefined)?r.shiftByDay[iso(d)]:null;
      const shiftId=inf.shiftId||(typeof legacy==='string'?legacy:null);
      out.push({date:d,key:iso(d),label:DAYN[i],short:DAYSH[i],sub:d.getDate()+' '+MON[d.getMonth()],
        shiftId:shiftId,auto:inf.auto&&!legacy,guard:inf.guard,pat:inf.pat,day:inf.day,inf:inf});
    }
  }else{
    const p=store.patterns[r.pattern]||store.patterns[0]||{days:[]};
    for(let i=0;i<7;i++){
      const manual=(r.shiftByDay&&r.shiftByDay['tpl'+r.pattern+'#'+i]!==undefined)?r.shiftByDay['tpl'+r.pattern+'#'+i]:null;
      out.push({date:null,key:null,label:DAYN[i],short:DAYSH[i],sub:'',
        shiftId:(typeof manual==='string'?manual:null)||resolveCode(p.days[i]),auto:manual==null,idx:i,guard:''});
    }
  }
  _weekDaysCache=out;_weekDaysTick=_renderTick;
  return out;
}
function shiftForDate(date){
  const r=store.rotation;
  if(!r.anchor||!store.patterns.length)return null;
  const a=parseDate(r.anchor);if(!a)return null;
  const src=(typeof date==='string')?parseDate(date):date;if(!src)return null;
  const d=new Date(src.getTime());d.setHours(12,0,0,0);
  const a12=new Date(a.getTime());a12.setHours(12,0,0,0);
  const idx=Math.round((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())
                        -Date.UTC(a12.getFullYear(),a12.getMonth(),a12.getDate()))/86400000);
  const cycle=store.patterns.length*7;
  const pos=((idx%cycle)+cycle)%cycle;
  const p=store.patterns[Math.floor(pos/7)];
  const day=pos%7;
  const raw=r.index!==undefined&&p.days[day]!==undefined?p.days[day]:null;
  return {shiftId:resolveCode(raw),pat:Math.floor(pos/7),day:day,pattern:p};
}
function resolveCode(c){
  if(!c)return null;
  if(store.shifts.some(s=>s.id===c))return c;
  const s=shiftByCode(c);
  return s?s.id:null;
}
/* ===================== notas =====================
   Una nota es un trozo de texto que puede tener día o no tenerlo. Sin día vive solo en la libreta y
   no ensucia el calendario; con día sale en la casilla del Mes y al abrirlo. Si además la pasas al
   calendario, la nota guarda el id del evento (evId): no se duplica nada, se enlaza. */
const NOTA_PURGA_DIAS=2;
function notasS(){
  if(!Array.isArray(store.notas))store.notas=[];
  return store.notas;}
function migraNotasDia(o){
  /* lo que ya tenías en store.notasDia era UNA nota por día, texto suelto. Pasa a la lista sin
     perder nada y sin crear duplicados si la migración ya se hizo. */
  const S=o||store;
  const viejo=S.notasDia;
  if(!viejo||typeof viejo!=='object')return 0;
  const ks=Object.keys(viejo);
  if(!ks.length)return 0;
  if(!Array.isArray(S.notas))S.notas=[];
  const lista=S.notas;
  let n=0;
  ks.forEach(function(k){
    const txt=String(viejo[k]||'').trim();
    if(!txt)return;
    if(lista.some(function(x){return x.fecha===k&&x.txt===txt;}))return;
    lista.push({id:uid('nt'),txt:txt,fecha:k,hecha:0,color:'',evId:'',ts:Date.now()});
    n++;});
  S.notasDia={};   /* ya vive en store.notas: dejarlo duplicado acabaría en dos verdades */
  if(n){olvidaNotas();if(S===store)save();}
  return n;}
function purgaNotas(o){
  /* «que se borre a los 2 días»: una nota marcada como hecha se queda a la vista dos días —por si te
     arrepientes— y luego se va sola. Se mira al cargar el almacén y al entrar en Notas. */
  const S=o||store;
  if(!Array.isArray(S.notas))S.notas=[];
  const lista=S.notas,limite=Date.now()-NOTA_PURGA_DIAS*86400000;
  let n=0;
  for(let i=lista.length-1;i>=0;i--){
    const x=lista[i];
    if(x.hecha&&x.hecha<limite){lista.splice(i,1);n++;}}
  if(n){olvidaNotas();if(S===store)save();}
  return n;}
function notaById(id){return notasS().filter(function(x){return x.id===id;})[0]||null;}
let _notasIdx=null,_notasTick=-1;
function olvidaNotas(){_notasIdx=null;_notasTick=-1;}
function notasPorFecha(){
  /* La cuadrícula del mes preguntaba por las notas de cada una de sus 31 casillas, y cada pregunta
     barría la lista entera y la ordenaba: 31·N. Un índice por pintado lo deja en 1·N. Se rehace
     cuando cambia el pintado, igual que hace monthDays(). */
  if(_notasTick!==_renderTick||!_notasIdx){
    _notasIdx={};
    notasS().forEach(function(x){
      if(!x.fecha)return;
      (_notasIdx[x.fecha]||(_notasIdx[x.fecha]=[])).push(x);});
    Object.keys(_notasIdx).forEach(function(k){
      _notasIdx[k].sort(function(a,b){return (a.hecha?1:0)-(b.hecha?1:0)||a.ts-b.ts;});});
    _notasTick=_renderTick;}
  return _notasIdx;}
function notasDeFecha(key){return notasPorFecha()[key]||[];}
function notaDia(key){
  /* se queda por compatibilidad: las notas de un día, en una sola cadena */
  return notasDeFecha(key).map(function(x){return x.txt;}).join('\n');}
function addNota(txt,fecha){
  const t=String(txt||'').trim().slice(0,600);
  if(!t)return {ok:false,msg:'escribe algo primero'};
  const f=fecha?(foodKey(fecha)||''):'';
  const nota={id:uid('nt'),txt:t,fecha:f,hecha:0,color:'',evId:'',proy:'',ts:Date.now()};
  notasS().push(nota);olvidaNotas();save();
  return {ok:true,id:nota.id,msg:'apuntado'+(f?(' para el '+fechaCorta(f)):'')};}
function setNota(id,campo,valor){
  const x=notaById(id);if(!x)return 'esa nota ya no está';
  if(campo==='txt')x.txt=String(valor||'').slice(0,600);
  else if(campo==='fecha')x.fecha=valor?(foodKey(valor)||''):'';
  else if(campo==='color')x.color=/^#[0-9a-fA-F]{6}$/.test(valor||'')?valor:'';
  else if(campo==='proy')x.proy=String(valor||'').trim().slice(0,40);
  olvidaNotas();save();return '';}
function proyectos(){
  /* los proyectos no se crean en ningún sitio: son el nombre que le pones a una nota, y la lista
     sale de las que ya tienes. Una cosa menos que administrar. */
  const c={};
  notasS().forEach(function(x){const p=(x.proy||'').trim();if(!p)return;
    if(!c[p])c[p]={nombre:p,total:0,pend:0};
    c[p].total++;if(!x.hecha)c[p].pend++;});
  return Object.keys(c).map(function(k){return c[k];})
    .sort(function(a,b){return b.pend-a.pend||a.nombre.localeCompare(b.nombre,'es');});}
function notasDeHoy(){
  /* lo que toca hoy y lo que se te pasó: es lo que convierte la libreta en una lista de tareas */
  const hoy=iso(new Date());
  const pend=notasS().filter(function(x){return !x.hecha&&x.fecha;});
  return {hoy:pend.filter(function(x){return x.fecha===hoy;}),
    tarde:pend.filter(function(x){return x.fecha<hoy;})
      .sort(function(a,b){return a.fecha.localeCompare(b.fecha);})};}
function notasDeLaSemana(){
  const hoy=new Date(),ini=iso(hoy),fin=iso(addDays(hoy,7));
  return notasS().filter(function(x){return !x.hecha&&x.fecha&&x.fecha>=ini&&x.fecha<=fin;});}
function toggleNotaHecha(id){
  const x=notaById(id);if(!x)return 'esa nota ya no está';
  x.hecha=x.hecha?0:Date.now();olvidaNotas();save();
  return x.hecha?('hecha · se borra sola dentro de '+NOTA_PURGA_DIAS+' días'):'vuelve a estar pendiente';}
function delNota(id){
  const lista=notasS(),i=lista.findIndex(function(x){return x.id===id;});
  if(i<0)return 'esa nota ya no estaba';
  lista.splice(i,1);olvidaNotas();save();return 'nota borrada';}
function notaAEvento(id,opts){
  /* de nota a evento del calendario. La nota NO se copia: se queda enlazada por evId, así que si
     cambias la hora en un sitio es la misma en el otro. */
  const x=notaById(id);if(!x)return {ok:false,msg:'esa nota ya no está'};
  opts=opts||{};
  const fecha=foodKey(opts.fecha||x.fecha||'');
  if(!fecha)return {ok:false,msg:'ponle primero un día a la nota'};
  const titulo=String(opts.titulo||x.txt.split('\n')[0]||'').trim().slice(0,60);
  if(!titulo)return {ok:false,msg:'la nota está vacía: no sé cómo llamar al evento'};
  const ev={id:uid('ev'),titulo:titulo,modo:'fecha',fecha:fecha,
    hora:String(opts.hora||'').slice(0,5),fin:String(opts.fin||'').slice(0,5),
    color:x.color||tlColor('evt'),on:true,
    recordatorio:!!opts.recordatorio,cuentaAtras:!!opts.cuentaAtras,notaId:x.id};
  eventosS().push(ev);
  x.fecha=fecha;x.evId=ev.id;olvidaNotas();save();
  return {ok:true,ev:ev,msg:'en el calendario: '+titulo+' · '+fechaCorta(fecha)};}
function desenlazaNota(id){
  const x=notaById(id);if(!x)return 'esa nota ya no está';
  if(!x.evId)return 'esta nota no tiene evento';
  const evs=eventosS(),i=evs.findIndex(function(e){return e.id===x.evId;});
  if(i>=0)evs.splice(i,1);
  x.evId='';save();
  return 'fuera del calendario · la nota se queda con su día';}
function eventoDeNota(x){
  if(!x||!x.evId)return null;
  return eventosS().filter(function(e){return e.id===x.evId;})[0]||null;}
function notasCuenta(){
  const c={total:0,sinDia:0,conDia:0,hechas:0,hoy:0,tarde:0,semana:0};
  const hoy=iso(new Date()),fin=iso(addDays(new Date(),7));
  notasS().forEach(function(x){c.total++;
    if(x.hecha){c.hechas++;return;}
    if(x.fecha){c.conDia++;
      if(x.fecha===hoy)c.hoy++;
      else if(x.fecha<hoy)c.tarde++;
      if(x.fecha>=hoy&&x.fecha<=fin)c.semana++;}
    else c.sinDia++;});
  return c;}
function dayOverride(dateStr){const v=(store.rotation.daySet||{})[dateStr];if(v===undefined||v===null||v==='')return null;
  return (typeof v==='string')?{shift:v,guard:''}:{shift:v.shift||'',guard:v.guard||''};}
function setDayOverride(dateStr,shiftId,guard){
  if(!store.rotation.daySet)store.rotation.daySet={};
  if(shiftId===null){delete store.rotation.daySet[dateStr];limpiarSalientesAuto(dateStr);return;}
  store.rotation.daySet[dateStr]=(guard&&shiftId)?{shift:shiftId,guard:guard}:{shift:shiftId||''};
  const sh=shiftById(shiftId);
  if(sh&&isGuardia(sh)){if(store.rotation.autoPos!==false)ponerSalienteAuto(dateStr);}
  else limpiarSalientesAuto(dateStr);}
function saltoDia(){const s=(store.rotation&&store.rotation.saltoDia)||{};
  const from=(s.from!=null?+s.from:6),to=(s.to!=null?+s.to:1);
  return {from:isNaN(from)?6:from,to:isNaN(to)?1:to};}
function saltoDiaTxt(){const s=saltoDia();return 'si cae en '+DOWN0[s.from]+', el '+DOWN0[s.to];}
function marcarAuto(fecha,shiftId,de){
  if(!shiftId)return false;
  const cur=dayOverride(fecha);
  if(cur&&!cur.auto)return false;              /* si ya lo pusiste tú a mano, no te lo toco */
  if(cur&&cur.auto&&cur.auto!=='pos')return false;
  if(vacationOf(fecha))return false;           /* en vacaciones no se escribe nada */
  store.rotation.daySet[fecha]={shift:shiftId,auto:'pos',de:de};return true;
}
function ponerSalienteAuto(dateStr){
  /* la guardia se acaba a las 8 del día siguiente: ese día es saliente; si cae en el día que marque
     «Ajustes → qué día de la semana absorbe el saliente» (sábado→lunes de fábrica), los días de por
     medio quedan libres y el saliente se pasa al día configurado (se descansa en casa) */
  const S=shiftByCode('S'),L=shiftByCode('L'),d=parseDate(dateStr);
  if(!d)return {ok:false,msg:'fecha rara'};
  limpiarSalientesAuto(dateStr);
  const DN3=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];const wd=d.getDay();let n=0,txt='';
  const sd=saltoDia();
  if(wd===sd.from){
    let gap=(sd.to-wd+7)%7;if(gap===0)gap=7;
    for(let i=1;i<gap;i++){const k=iso(addDays(d,i));if(L&&marcarAuto(k,L.id,dateStr))n++;}
    const destino=iso(addDays(d,gap));
    if(S&&marcarAuto(destino,S.id,dateStr)){n++;txt=' ('+DN3[wd]+' → el saliente cae el '+DN3[(wd+gap)%7]+')';}
  }else{
    const sig=iso(addDays(d,1));
    if(S&&marcarAuto(sig,S.id,dateStr)){n++;const dd=parseDate(sig);txt=' al '+DN3[dd.getDay()]+' '+dd.getDate();}
  }
  return {ok:n>0,txt:txt,n:n};}
function limpiarSalientesAuto(dateStr){
  const ds=store.rotation.daySet||{};
  Object.keys(ds).forEach(function(k){const v=ds[k];
    if(v&&typeof v==='object'&&v.auto==='pos'&&v.de===dateStr)delete ds[k];});}
function rhythmOf(shiftId,dateStr){
  const base=(store.rhythm&&store.rhythm[shiftId])||{};
  const ov=dateStr?((store.rotation.dayRhythm||{})[dateStr]||{}):{};
  const r={};Object.keys(base).forEach(k=>r[k]=base[k]);
  Object.keys(ov).forEach(k=>{if(ov[k]!==''&&ov[k]!=null)r[k]=ov[k];});
  return r;}
let _vacMapCache=null,_vacMapSig='';
function vacMap(){
  /* los rangos de vacaciones se traducen a días sueltos: así el calendario, la cocina y la compra los ven.
     dayInfo() llama a esto para CADA día que se pinta, así que se cachea por firma: reconstruir day-por-día
     un mapa entero en cada consulta era el cuello de botella medido en el informe de rendimiento (la pestaña
     Mes tardaba ~550ms con años de datos porque este mapa se rehacía cientos de veces por render). */
  const vs=(store.rotation&&store.rotation.vacaciones)||[];
  const n=store.shifts.filter(function(x){return /vacacion|festiv/i.test(String(x.name||''));})[0]||
    store.shifts.filter(function(x){return x.code==='V';})[0]||shiftById('sh-v');
  const sig=(n?n.id:'')+'|'+vs.length+'|'+vs.map(function(v){return v.start+'~'+v.end+'~'+(v.label||'');}).join(',');
  if(_vacMapCache&&_vacMapSig===sig)return _vacMapCache;
  const out={};
  if(!n){_vacMapCache=out;_vacMapSig=sig;return out;}   /* sin tipo de día de vacaciones no hay mapa, pero tampoco vacío: esto se llamaba así y reventaba */
  vs.forEach(function(v,ix){const a=parseDate(v.start),b=parseDate(v.end);if(!a||!b)return;
    const lo=a<=b?a:b,hi=a<=b?b:a;
    for(let d=new Date(lo.getTime());d<=hi;d=addDays(d,1)){const k=iso(d);
      if(!out[k])out[k]={shiftId:n.id,ix:ix,label:v.label||'vacaciones'};}});
  _vacMapCache=out;_vacMapSig=sig;
  return out;}
function vacationOf(dateStr){const v=vacMap()[dateStr];if(!v)return null;const vs=(store.rotation.vacaciones||[])[v.ix];
  return {ix:v.ix,shiftId:v.shiftId,label:v.label,start:vs?vs.start:'',end:vs?vs.end:''};}
function vacDays(y,m){return monthDays(y,m).filter(function(d){return d.vac;}).length;}
function addVacation(start,end,label){
  let s0=parseDate(start),e0=parseDate(end);
  if(!s0||!e0)return 'pon dos fechas válidas (aaaa-mm-dd)';
  if(e0<s0){const t=s0;s0=e0;e0=t;}   /* si el fin queda antes que el inicio, se giran: nunca un rango al revés */
  if(!store.rotation.vacaciones)store.rotation.vacaciones=[];
  store.rotation.vacaciones.push({start:iso(s0),end:iso(e0),label:String(label||'').trim()});
  const n=Math.round((Date.UTC(e0.getFullYear(),e0.getMonth(),e0.getDate())
    -Date.UTC(s0.getFullYear(),s0.getMonth(),s0.getDate()))/86400000)+1;
  save();render();return n+' día(s) marcados como vacaciones del '+s0.getDate()+' '+MON[s0.getMonth()]+' al '+e0.getDate()+' '+MON[e0.getMonth()]+'. La jornada y las guardias de esos días se dan por no puestas';}
function delVacation(ix){if(!store.rotation.vacaciones)return 'no hay vacaciones apuntadas';
  store.rotation.vacaciones.splice(+ix,1);save();render();return 'vacaciones quitadas';}
function jornadaEn(wday,shiftId,override){
  /* la jornada base del mes (8:00–15:00 de lunes a viernes), para el día que sea
     vale también en los días con hora propia: el entreno de la mañana no quita que luego trabajes */
  const j=store.rotation&&store.rotation.jornada;if(!j||!j.start||!j.end)return null;
  if(wday==null||wday<0)return null;
  if(j.workdays&&j.workdays.length&&j.workdays.indexOf(wday)<0)return null;
  const sh=shiftById(shiftId);if(!sh)return null;
  if(isGuardia(sh))return null;
  if(/saliente|post ?-?guardia|vacacion|festiv/i.test(sh.name||''))return null;
  /* un día libre PUESTO POR TI es de verdad: no se trabaja; si solo lo dice la plantilla, sí entra la jornada */
  const descanso=/libre|descanso|asuntos|franco|vacante/i.test(sh.name||'');
  if(descanso&&(override||j.aplicaLibres===false))return null;
  return {start:j.start,end:j.end};}
function jornadaOf(dateStr,infOpt){
  const d=parseDate(dateStr);if(!d)return null;
  const inf=infOpt||dayInfo(dateStr);
  return jornadaEn(d.getDay(),inf.shiftId,!!dayOverride(dateStr));}
function baseWorkday(dateStr){
  /* si el hueco está vacío y es un laborable de tu jornada, el día es «Día de trabajo» con sus horas */
  const j=store.rotation&&store.rotation.jornada;if(!j||!j.start||!j.end)return null;
  const d=parseDate(dateStr);if(!d)return null;
  if(j.workdays&&j.workdays.length&&j.workdays.indexOf(d.getDay())<0)return null;
  return (shiftById('sh-t')||store.shifts.filter(function(x){return /trabajo/.test(x.name||'');})[0]||{}).id||null;}
function dayInfo(dateStr){
  const ov=dayOverride(dateStr);
  const vac=ov?null:vacationOf(dateStr);
  const auto=ov||vac?null:shiftForDate(dateStr);
  const raw=ov?(ov.shift||null):(vac?vac.shiftId:(auto?auto.shiftId:null));
  const shiftId=raw||(!ov&&!vac?baseWorkday(dateStr):null);
  return {shiftId:shiftId,auto:!ov&&!vac,ov:ov,pat:auto?auto.pat:null,day:auto?auto.day:null,
          guard:ov&&ov.guard?ov.guard:'',vac:vac,rhythm:rhythmOf(shiftId,dateStr)};}
function sleepOf(dateStr,infOpt){
  const inf=infOpt||dayInfo(dateStr);const rh=inf.rhythm||{};
  const o={bed:rh.sleep||'',wake:rh.wake||'',h:(rh.sleep&&rh.wake)?sleepHours(rh.sleep,rh.wake):null};
  const sal=dateStr?salidaDeGuardia(dateStr):null;
  if(!sal)return o;
  /* El día de después de una guardia esa mañana no vienes de dormir: vienes de trabajar. Lo que
     hay son DOS sueños —la siesta al llegar a casa y, por la noche, el de siempre para el día
     siguiente—, y la app contaba como sueño las horas que estabas en el hospital. */
  const c=suenoCfg(),s0=mins(sal.sale);
  if(s0!=null&&c.siesta>0){const de=s0+trayectoMin();
    o.siesta={de:hm(de),a:hm(de+c.siesta),min:c.siesta};
    o.wake=o.siesta.a;}
  else o.wake='';
  const sig=nextIso(dateStr);
  o.wakeSig=sig?((rhythmOf(dayInfo(sig).shiftId,sig)||{}).wake||''):'';
  o.noche=(o.bed&&o.wakeSig)?sleepHours(o.bed,o.wakeSig):null;
  const tot=(o.noche||0)+(o.siesta?o.siesta.min/60:0);
  o.h=tot>0?Math.round(tot*10)/10:null;
  return o;}
function suenoCfg(){const d={min:8,cenaMin:90,cenaMax:180,latencia:10,siesta:360};const o=store.sueno||{};
  ['min','cenaMin','cenaMax','latencia'].forEach(function(k){if(typeof o[k]==='number'&&o[k]>0)d[k]=o[k];});
  /* la siesta del saliente puede ser 0 (hay quien aguanta del tirón), así que no vale el >0 */
  if(typeof o.siesta==='number'&&o.siesta>=0&&o.siesta<=480)d.siesta=o.siesta;
  return d;}
function mins(t){const m=/^(\d{1,2}):(\d{2})$/.exec(String(t||'').trim());return m?(+m[1])*60+(+m[2]):null;}
function hm(m){const x=((Math.round(m)%1440)+1440)%1440;return String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0');}
function acostarsePara(wake){/* hora de ENANAS en la cama para dormir el mínimo: si te levantas a las X, a la cama a X-mín-latencia */
  const c=suenoCfg(),w=mins(wake);if(w==null)return '';return hm(w-(c.min*60+c.latencia));}
function ventanaCena(bed){/* cenar entre 3 h y 1,5 h antes de dormir para que la digestión no robe sueño */
  const c=suenoCfg(),b=mins(bed);if(b==null)return null;return {from:hm(b-c.cenaMax),to:hm(b-c.cenaMin)};}
function despertarBase(){const rh=rhythmOf('sh-t')||{};return rh.wake||(store.rhythm&&store.rhythm['sh-t']&&store.rhythm['sh-t'].wake)||'06:50';}
function nightOf(dateStr,slOpt){
  /* qué toca esa noche: acostarse sugerido, hora real, horas dormidas y ventana de cena */
  const sl=slOpt||sleepOf(dateStr),c=suenoCfg();
  const wake=sl.wake,bed=sl.bed,rec=acostarsePara(wake);
  return {wake:wake,bed:bed,rec:rec,h:sl.h,min:c.min,corto:sl.h!=null&&sl.h<c.min,
    cena:ventanaCena(rec||bed||''),falta:(sl.h!=null&&sl.h<c.min)?Math.round((c.min-sl.h)*60):0};}
let _monthDaysCache={},_monthDaysTick=-1;
function monthDays(y,m){
  if(_monthDaysTick!==_renderTick){_monthDaysCache={};_monthDaysTick=_renderTick;}
  const mk=y+'-'+m;
  if(_monthDaysCache[mk])return _monthDaysCache[mk];
  const out=[],first=new Date(y,m,1,12,0,0,0),len=new Date(y,m+1,0).getDate();
  for(let i=0;i<len;i++){
    const d=new Date(y,m,1+i,12,0,0,0),key=iso(d),inf=dayInfo(key),sh=shiftById(inf.shiftId),sl=sleepOf(key,inf);
    out.push({key:key,date:d,wday:(d.getDay()+6)%7,shiftId:inf.shiftId,guard:inf.guard,over:!!inf.ov,vac:inf.vac,
      jor:jornadaOf(key,inf),inf:inf,
      color:sh?sh.color:'',icon:sh?sh.icon:'·',name:sh?sh.name:'sin asignar',sleepH:sl.h,bed:sl.bed,wake:sl.wake});}
  _monthDaysCache[mk]=out;
  return out;}
function monthService(y,m){
  /* el servicio que rotas ese mes y cuántas guardias tocan: lo pones tú, la app no lo inventa */
  const key=y+'-'+String(m+1).padStart(2,'0'),r=store.rotation,mm=(r.month||{})[key];
  const svc=(mm&&mm.service)||r.monthService||'';
  const n=(mm&&typeof mm.guardias==='number')?mm.guardias:(typeof r.guardiasMes==='number'?r.guardiasMes:6);
  return {key:key,service:svc,guardias:n,set:!!mm};}
function setGuardiasMes(y,m,n){
  if(y==='default'){store.rotation.guardiasMes=Math.max(0,Math.min(15,+n||0));return;}
  const key=y+'-'+String(m+1).padStart(2,'0');
  if(!store.rotation.month)store.rotation.month={};
  const cur=store.rotation.month[key]||{service:store.rotation.monthService,guardias:store.rotation.guardiasMes};
  store.rotation.month[key]={service:cur.service,guardias:Math.max(0,Math.min(15,+n||0))};}
function svcLabel(y,m){return monthService(y,m).service||'sin servicio';}
function svcMesesDe(nombre,porDefecto){
  /* cada rotación puede durar lo suyo: se busca por nombre para que valga aunque el orden venga de fuera */
  const r=store.rotation,ix=(r.servicios||[]).indexOf(nombre);
  const n=(ix>=0)?Math.round(+(r.svcMeses||[])[ix]):0;
  return (n>=1&&n<=6)?n:Math.max(1,+porDefecto||1);}
function svcColor(nombre){
  /* un color estable por servicio para poder ver el año de un vistazo */
  const PAL=['#38e1ff','#7c5cff','#10b981','#f59e0b','#ef4444','#a855f7','#22d3ee','#84cc16','#f472b6'];
  const ix=(store.rotation.servicios||[]).indexOf(nombre);
  return ix>=0?PAL[ix%PAL.length]:'var(--ink2)';}
function cicloServicios(desdeY,desdeM,hastaY,hastaM,mesesPor,orden){
  /* solo devuelve el reparto, no escribe nada: así la interfaz puede enseñarlo antes de aplicarlo */
  const sv=(orden&&orden.length)?orden:(store.rotation.servicios||[]);
  const out=[];
  let cur=new Date(desdeY,desdeM,1,12),fin=new Date(hastaY,hastaM,1,12);
  if(!sv.length)return out;
  let i=0,quedan=svcMesesDe(sv[0],mesesPor);
  while(cur<=fin&&out.length<240){
    out.push({key:cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0'),
      y:cur.getFullYear(),m:cur.getMonth(),service:sv[i%sv.length]});
    cur=new Date(cur.getFullYear(),cur.getMonth()+1,1,12);
    if(--quedan<=0){i++;quedan=svcMesesDe(sv[i%sv.length],mesesPor);}}
  return out;}
function planServicios(desdeY,desdeM,hastaY,hastaM,mesesPor){
  const r=store.rotation;
  if(!r.servicios||!r.servicios.length)return 'primero escribe tus servicios (arriba): sin lista no reparto';
  const ciclo=cicloServicios(desdeY,desdeM,hastaY,hastaM,mesesPor,r.servicios);
  if(!ciclo.length)return 'el rango de meses no cuadra (¿el final es anterior al principio?)';
  if(!r.month)r.month={};
  ciclo.forEach(function(c){const prev=r.month[c.key]||{};
    r.month[c.key]={service:c.service,guardias:prev.guardias!=null?prev.guardias:r.guardiasMes};});
  save();
  return ciclo.length+' mes(es) repartidos de '+mesesPor+' en '+mesesPor+' ('+r.servicios.join(' → ')+'): '+
    ciclo.map(function(c){return MON[c.m]+' '+c.y+' · '+c.service;}).join(' · ');}
function setMonthService(y,m,svc,quota){
  /* con y='default' se cambia el valor que heredan los meses sin ajuste; si no, solo se toca ese mes */
  const n=(typeof quota==='number')?quota:(quota&&typeof quota.urg==='number')?((+quota.urg||0)+(+quota.umi||0)):
    (quota&&typeof quota.guardias==='number')?+quota.guardias:null;
  if(y==='default'){store.rotation.monthService=svc||store.rotation.monthService;
    if(n!=null)store.rotation.guardiasMes=n;return;}
  const key=y+'-'+String(m+1).padStart(2,'0');
  if(!store.rotation.month)store.rotation.month={};
  const cur=store.rotation.month[key]||{service:store.rotation.monthService,guardias:store.rotation.guardiasMes};
  store.rotation.month[key]={service:(svc===null||svc===undefined||svc===cur.service)?cur.service:svc,
    guardias:n!=null?n:(cur.guardias!=null?cur.guardias:store.rotation.guardiasMes)};}
/* ===================== guardias por tipo (Urgencias / UMI): no dependen del servicio del mes ===================== */
function gTipos(){
  /* la lista de tipos de guardia es tuya; por defecto las dos que haces */
  const r=store.rotation;
  const hora=function(v,pordef){const m=/^(\d{1,2}):(\d{2})$/.exec(String(v||'').trim());
    return m&&+m[1]<24&&+m[2]<60?(String(+m[1]).padStart(2,'0')+':'+m[2]):pordef;};
  const sane=function(t){const lab=String((t&&t.label)||'').trim().slice(0,22);
    let code=String((t&&t.code)||lab).trim().toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8);
    if(!code)code='g'+Math.random().toString(36).slice(2,5);
    /* cada tipo de guardia trae SUS horas: a qué hora es el relevo entre semana, a qué hora el fin
       de semana y cuánto se alarga la salida por el pase de guardia. Sin esto todas las guardias
       duraban 08:00–08:00 pasara lo que pasara. */
    const jd=(store.rotation&&store.rotation.jornada)||{};
    return {code:code,label:lab||code.toUpperCase(),
      relevoSem:hora(t&&t.relevoSem,hora(jd.start,'08:00')),
      relevoFinde:hora(t&&t.relevoFinde,code==='umi'?'10:00':'09:00'),
      pase:Math.max(0,Math.min(480,+((t&&t.pase)!=null?t.pase:(code==='umi'?75:0))||0))};};
  if(!Array.isArray(r.guardiaTipos)||!r.guardiaTipos.length)
    r.guardiaTipos=[{code:'urg',label:'Urgencias'},{code:'umi',label:'UMI'}];
  r.guardiaTipos=r.guardiaTipos.map(sane);
  if(!r.cupoTipos||typeof r.cupoTipos!=='object')r.cupoTipos={urg:4,umi:2};
  return r.guardiaTipos;}
function gTipo(code){const l=gTipos();
  const c=String(code||'').trim().toLowerCase();
  return l.filter(function(t){return t.code===c;})[0]||l[0];}
function gEtiqueta(code){return code?String(code).toUpperCase().slice(0,6):'SIN TIPO';}
function gTiposTxt(g){const l=gTipos();
  return l.map(function(t){return (g.por[t.code]||0)+' '+t.label;}).join(' · ');
}
function repartoTipos(total){
  /* el cupo se reparte con la proporción que tú pongas (4+2) y sin juntar cuatro del mismo día tras otro */
  const l=gTipos(),cu=store.rotation.cupoTipos||{},bks=[],out=[];
  l.forEach(function(t){const n=Math.max(0,Math.min(15,+cu[t.code]||0)),a=[];
    for(let i=0;i<n;i++)a.push(t.code);bks.push(a);});
  if(!bks.length)bks.push([]);
  let sig=0;
  while(out.length<total&&sig<total*8+l.length){const b=bks[sig%bks.length];
    if(b&&b.length)out.push(b.shift());sig++;}
  while(out.length<total)out.push(l[out.length%l.length].code);
  return out.slice(0,total);}
function setCupoTipo(code,n){
  const l=gTipos();l.forEach(function(t){if(t.code===code)store.rotation.cupoTipos[code]=Math.max(0,Math.min(15,+n||0));});
  const suma=l.reduce(function(a,t){return a+(+store.rotation.cupoTipos[t.code]||0);},0);
  if(suma>0)store.rotation.guardiasMes=suma;
  return suma;}
function setGuardiaTipo(dateStr,code){
  /* poner la guardia con su tipo; el saliente del día siguiente lo sigue poniendo la app */
  const k=foodKey(dateStr);if(!k)return {ok:false,msg:'ese día todavía no tiene fecha'};
  const G=store.shifts.filter(isGuardia)[0];
  if(!G)return {ok:false,msg:'no hay ningún tipo de día marcado como guardia (míralo en «Turno y rotación»)'};
  if(code===null||code===''){setDayOverride(k,null);save();render();
    return {ok:true,msg:'guardia quitada del '+k+' (y su saliente automático, si lo puso la app)'};}
  const t=gTipo(code);
  setDayOverride(k,G.id,t.code);save();render();
  const sd=saltoDia(),cae=parseDate(k)&&parseDate(k).getDay()===sd.from;
  return {ok:true,msg:'guardia de '+t.label+' el '+k.slice(8)+' '+MON[+k.slice(5,7)-1]+
    (store.rotation.autoPos!==false?(' · el '+(cae?DOWN0[sd.to]:'día siguiente')+' queda saliente solo')
      :' · el post-guardia automático está apagado: lo pones tú')};}
function setHorasTipo(code,campo,valor){
  /* las horas de cada tipo de guardia: el relevo entre semana, el del fin de semana y el pase */
  const t=gTipos().filter(function(x){return x.code===code;})[0];
  if(!t)return 'ese tipo de guardia no existe';
  if(campo==='pase'){t.pase=Math.max(0,Math.min(480,Math.round(+valor||0)));
    save();render();
    return t.label+': '+(t.pase?('sales '+fmtHM(t.pase)+' más tarde por el pase de guardia'):'sin pase de guardia');}
  const m=/^(\d{1,2}):(\d{2})$/.exec(String(valor||'').trim());
  if(!m||+m[1]>23||+m[2]>59)return 'pon la hora como 09:00';
  t[campo]=String(+m[1]).padStart(2,'0')+':'+m[2];
  save();render();
  return t.label+': relevo '+(campo==='relevoSem'?'de lunes a viernes':'de sábado y domingo')+' a las '+t[campo];}
function renombraTipo(code,label){
  const l=gTipos(),t=l.filter(function(x){return x.code===code;})[0];
  if(!t)return 'ese tipo no existe';
  t.label=String(label||'').trim().replace(/\s+/g,' ').slice(0,22)||t.code.toUpperCase();
  save();render();return 'tipo renombrado: '+t.label;}
function addGuardiaTipo(nombre){
  /* por si en tu sitio hay una tercera clase de guardia (o las llaman de otra manera) */
  const n=String(nombre||'').trim().replace(/\s+/g,' ');
  if(!n)return {ok:false,msg:'escribe antes el nombre del tipo de guardia (p. ej. «Guardias de placa»), no lo invento yo'};
  const l=gTipos();
  if(l.some(function(t){return String(t.label).toLowerCase()===n.toLowerCase();}))
    return {ok:false,msg:'«'+n+'» ya está en la lista'};
  let code=n.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g,'').slice(0,8);
  if(!code)code='t'+(l.length+1);
  while(l.some(function(t){return t.code===code;}))code=code.slice(0,7)+(l.length+1);
  l.push({code:code,label:n.slice(0,22)});
  store.rotation.cupoTipos[code]=0;
  save();render();
  return {ok:true,msg:'añadido «'+n.slice(0,22)+'» (se llama '+code+'): ponle cuántas tocan y sale en cada día'};}
/* ===================== a qué hora se entra y se sale de guardia =====================
   Una guardia no dura lo mismo según el día en que cae ni según de qué sea, y de ahí salía el
   error que se veía en pantalla: el turno decía 08:00–08:00 siempre, cuando en realidad

     · entre semana entras a las 8:00 a tu JORNADA normal y a las 15:00 empieza la guardia;
     · el sábado y el domingo entras directamente a la hora del relevo (9:00 en urgencias,
       10:00 en UMI), sin jornada previa;
     · y SALES a la hora del relevo DEL DÍA EN QUE SALES —no del día en que entraste—, porque esa
       es la hora a la que entra el siguiente: 8:00 si es laborable, 9:00/10:00 si es finde;
     · en UMI, además, hay pase de guardia: se sale un rato más tarde.

   Con esa única regla salen todos los casos: viernes → sábado a las 9:00 (urgencias) o 10:00
   (UMI), sábado → domingo a la misma hora, domingo → lunes a las 8:00 en los dos. */
function esDiaDeJornada(d){
  const j=store.rotation&&store.rotation.jornada;
  if(!j||!j.start||!j.end)return false;
  const wd=(j.workdays&&j.workdays.length)?j.workdays:[1,2,3,4,5];
  return wd.indexOf(d.getDay())>=0;}
function horaRelevo(t,d){
  /* a qué hora se hace el cambio de guardia ESE día */
  const j=store.rotation&&store.rotation.jornada;
  return esDiaDeJornada(d)?(t.relevoSem||(j&&j.start)||'08:00'):(t.relevoFinde||'09:00');}
function guardiaHoras(dateStr,tipoCode){
  /* desde: cuándo pisas el hospital · guardia: cuándo empieza la guardia propiamente
     sale:  cuándo te vas al día siguiente, con el pase ya sumado */
  const d=parseDate(dateStr);if(!d)return null;
  const t=gTipo(tipoCode),j=store.rotation&&store.rotation.jornada;
  const conJornada=esDiaDeJornada(d);
  const rel=mins(horaRelevo(t,addDays(d,1)));
  const pase=Math.max(0,Math.min(480,+t.pase||0));
  return {tipo:t,code:t.code,
    desde:conJornada?j.start:horaRelevo(t,d),
    guardia:conJornada?j.end:horaRelevo(t,d),
    relevo:rel==null?'':hm(rel),
    sale:rel==null?'':hm(rel+pase),
    pase:pase};}
let _salidaCache={},_salidaTick=-1;
function salidaDeGuardia(dateStr){
  /* el día DESPUÉS de una guardia no empieza en casa: de 00:00 hasta que te relevan sigues
     trabajando. Vale aunque ese día no esté marcado como saliente —si la guardia cae en sábado el
     saliente se pasa al lunes, pero el domingo por la mañana sales del hospital igual—. */
  if(!dateStr)return null;
  if(_salidaTick!==_renderTick){_salidaCache={};_salidaTick=_renderTick;}
  if(Object.prototype.hasOwnProperty.call(_salidaCache,dateStr))return _salidaCache[dateStr];
  let out=null;
  const d=parseDate(dateStr);
  if(d){const ant=iso(addDays(d,-1)),inf=dayInfo(ant),sh=shiftById(inf.shiftId);
    if(sh&&isGuardia(sh))out=guardiaHoras(ant,inf.guard);}
  _salidaCache[dateStr]=out;
  return out;}
function esSaliente(sh){return !!sh&&/saliente|post ?-?guardia/i.test(String(sh.name||''));}
/* ===================== la comida principal no está a una hora fija =====================
   La hora de comer no la manda el tipo de día: la manda lo que haces ese día.
     · Si entrenas, la comida principal cae después del entreno: 18:00–18:30.
     · Si no entrenas, al acabar la jornada de 8 a 15: 14:00–15:00.
     · Y el día que sales de guardia, cuando te despiertas de la siesta — no a una hora del reloj,
       porque esa hora depende de a qué hora te relevaron.
   Antes era una lista de horas fijas por tipo de día, y por eso el mismo «Día de trabajo» decía
   siempre 14:30 entrenaras o no. Los valores se cambian en Ajustes; estos son los de fábrica. */
function comidasCfg(){
  const d={conEntreno:{de:'18:00',a:'18:30'},sinEntreno:{de:'14:00',a:'15:00'},trasSiesta:30};
  const o=store.comidas||{},hh=/^\d{1,2}:\d{2}$/;
  ['conEntreno','sinEntreno'].forEach(function(k){
    if(o[k]&&hh.test(String(o[k].de||''))&&hh.test(String(o[k].a||'')))d[k]={de:o[k].de,a:o[k].a};});
  if(typeof o.trasSiesta==='number'&&o.trasSiesta>=0&&o.trasSiesta<=180)d.trasSiesta=o.trasSiesta;
  return d;}
function hayEntrenoEn(dateStr,infOpt){
  /* cuenta como entreno la rutina que toca ese día, el segundo entreno (piscina y demás) y que el
     propio tipo de día sea de fuerza */
  if(!dateStr)return false;
  const inf=infOpt||dayInfo(dateStr);
  if(rutinaDeFecha(dateStr))return true;
  const s2=diaSegundo(dateStr,inf);if(s2&&s2.on)return true;
  const sh=shiftById(inf.shiftId);
  return !!(sh&&/fuerza|entreno|gym/i.test(sh.name||''));}
function comidaPrincipalDe(dateStr,infOpt){
  if(!dateStr)return null;
  const inf=infOpt||dayInfo(dateStr),c=comidasCfg();
  const sal=salidaDeGuardia(dateStr);
  if(sal){const sl=sleepOf(dateStr,inf);
    if(sl&&sl.siesta){const m=mins(sl.siesta.a);
      if(m!=null)return {de:hm(m+c.trasSiesta),a:hm(m+c.trasSiesta+60),por:'siesta'};}}
  if(hayEntrenoEn(dateStr,inf))return {de:c.conEntreno.de,a:c.conEntreno.a,por:'entreno'};
  /* un día libre no tiene jornada de la que salir: la hora es la misma, pero no se inventa el motivo */
  return {de:c.sinEntreno.de,a:c.sinEntreno.a,por:jornadaOf(dateStr,inf)?'jornada':'normal'};}
function comidaPorqueTxt(por){
  return por==='entreno'?'después de entrenar':por==='siesta'?'al despertar de la siesta':
    por==='jornada'?'al salir de la jornada':'';}
function comidaPrincipalTxt(cp){
  if(!cp)return '';
  const q=comidaPorqueTxt(cp.por);
  return fmtTimeOut(cp.de)+'–'+fmtTimeOut(cp.a)+(q?(' · '+q):'');}
function esComidaPrincipal(slot){
  /* cuál de las tomas del día es «la comida»: la que se llama así, y no la media mañana */
  const l=String((slot&&slot.label)||'');
  return /comida/i.test(l)&&!/media\s*ma/i.test(l);}
function horaDeToma(dateStr,slot,cpOpt){
  /* la hora que hay que ENSEÑAR de esa toma: la de la lista, salvo que sea la comida principal y
     ese día tenga una hora propia */
  const cp=cpOpt!==undefined?cpOpt:(dateStr?comidaPrincipalDe(dateStr):null);
  return (cp&&esComidaPrincipal(slot))?cp.de:((slot&&slot.time)||'');}
function trayectoMin(){
  /* lo que tardas del hospital a casa: sale de tus propias horas de guardia (salir → llegar) */
  const rh=(store.rhythm&&store.rhythm['sh-g'])||{};
  const a=mins(rh.leave),b=mins(rh.arrive);
  const t=(a!=null&&b!=null)?((b-a+1440)%1440):15;
  return (t>0&&t<=120)?t:15;}
function bloquesTrabajo(dateStr,inf){
  /* Todo lo que se trabaja ESE día, ya partido por la medianoche y en minutos. Es una LISTA porque
     un día puede tener dos cosas: la jornada y luego la guardia encima, o la salida de la guardia
     de ayer y nada más. Antes esto era una sola pareja de horas sacada del tipo de día, y por eso
     el saliente salía como si trabajaras de 9 a 13 cuando lo que hay es trabajo hasta el relevo. */
  const out=[];
  if(!dateStr){
    const sh0=shiftById(inf&&inf.shiftId);
    if(sh0&&sh0.start){const a=mins(sh0.start);let b=mins(sh0.end);
      if(a!=null&&b!=null){if(b<=a)b=1440;
        out.push({de:a,a:b,tipo:isGuardia(sh0)?'guard':'work',txt:(isGuardia(sh0)?'guardia ':'trabajo ')+sh0.start+'–'+sh0.end});}}
    return out;}
  inf=inf||dayInfo(dateStr);
  const sh=shiftById(inf.shiftId);
  const sal=salidaDeGuardia(dateStr);
  if(sal&&mins(sal.sale)!=null&&mins(sal.sale)>0)
    out.push({de:0,a:mins(sal.sale),tipo:'guard',
      txt:'guardia de ayer hasta el relevo de las '+sal.sale+(sal.pase?(' (con pase de '+fmtHM(sal.pase)+')'):'')});
  if(sh&&isGuardia(sh)){
    const g=guardiaHoras(dateStr,inf.guard);
    if(g){const d0=mins(g.desde),g0=mins(g.guardia);
      if(d0!=null&&g0!=null&&g0>d0)out.push({de:d0,a:g0,tipo:'work',txt:'jornada '+g.desde+'–'+g.guardia});
      if(g0!=null)out.push({de:g0,a:1440,tipo:'guard',txt:'guardia desde las '+g.guardia+', sales a las '+g.sale});}
  }else if(!(sal&&esSaliente(sh))){
    /* el saliente ya tiene sus horas de verdad arriba: las suyas propias sobran y estorban */
    const jor=jornadaOf(dateStr,inf);
    const propio=(sh&&sh.start)?{start:sh.start,end:sh.end}:null;
    const mete=function(w,txt){if(!w||!w.start)return;
      const a=mins(w.start);let b=mins(w.end);
      if(a==null||b==null)return;if(b<=a)b=1440;
      out.push({de:a,a:b,tipo:'work',txt:txt+' '+w.start+'–'+w.end});};
    /* un «Día de fuerza» es entreno DE 6:30 A 8:00 *Y* jornada de 8 a 15: antes solo salía lo
       primero y el resto del día se pintaba vacío, como si no trabajaras */
    /* las horas propias son el ENTRENO solo en un día de fuerza; en cualquier otro son su jornada.
       Antes se llamaban «entreno» siempre, y un «Día de trabajo» de 8 a 15 salía en Hoy como entreno */
    mete(propio,/fuerza|entreno|gym/i.test((sh&&sh.name)||'')?'entreno':'jornada');
    if(jor&&(!propio||propio.start!==jor.start||propio.end!==jor.end))mete(jor,'jornada');
    if(!propio&&!jor&&false)return out;}
  return out;}
function horasDelDiaTxt(dateStr,inf){
  /* la misma lista, en una línea: «8:00–15:00 · guardia 15:00→09:15» */
  const bs=bloquesTrabajo(dateStr,inf);
  if(!bs.length)return '';
  const sal=dateStr?salidaDeGuardia(dateStr):null;
  const sh=shiftById((inf||dayInfo(dateStr||'')).shiftId);
  if(sh&&isGuardia(sh)&&dateStr){
    const g=guardiaHoras(dateStr,(inf||dayInfo(dateStr)).guard);
    if(g)return (g.desde!==g.guardia?(fmtTimeOut(g.desde)+'–'+fmtTimeOut(g.guardia)+' · '):'')+
      'guardia '+fmtTimeOut(g.guardia)+'→'+fmtTimeOut(g.sale);}
  if(sal&&sh&&esSaliente(sh))return 'sales a las '+fmtTimeOut(sal.sale);
  return bs.map(function(b){
    return fmtTimeOut(hm(b.de))+'–'+fmtTimeOut(hm(b.a>=1440?0:b.a));}).join(' · ');}
function guardCount(y,m){
  /* las guardias van por TIPO (Urgencias / UMI, o lo que tú hayas puesto), no por el servicio del mes */
  const n={any:0,por:{},urg:0,umi:0};
  monthDays(y,m).forEach(function(d){if(d.shiftId&&isGuardia(shiftById(d.shiftId))){n.any++;
    const k=d.guard?String(d.guard).toLowerCase():'sin';
    n.por[k]=(n.por[k]||0)+1;if(k==='urg')n.urg++;if(k==='umi')n.umi++;}});
  return n;}
function slotsFor(shiftId){return store.menu[shiftId]||[];}
function slotItems(shiftId,s){
  if(s&&s.mealId){const m=mealById(s.mealId);if(m)return {items:m.items||[],name:m.name,meal:true};}
  return {items:(s&&s.items)||[],name:null,meal:false};
}
function dishQty(items){const q={};(items||[]).forEach(it=>{if(!it||it.kind!=='dish'||!it.id)return;const d=dishById(it.id);if(!d)return;q[d.id]=(q[d.id]||0)+num(it.portions,1);});return q;}
function totals(items){const q=dishQty(items);let k=0,p=0,n=0;
  Object.keys(q).forEach(id=>{const d=dishById(id),m=q[id];k+=(d.kcal||0)*m;p+=(d.prot||0)*m;n+=m;});
  return {kcal:Math.round(k),prot:Math.round(p),parts:Math.round(n*10)/10};}
function dayTotals(shiftId){const sh=shiftById(shiftId);if(!sh)return {kcal:0,prot:0,parts:0};
  const items=[];slotsFor(shiftId).forEach(s=>items.push.apply(items,slotItems(shiftId,s).items));return totals(items);}

/* cuántas raciones toca de cada plato, y en qué tandas se convierten */
function necesidadSemana(days){
  /* cuántas raciones de cada plato pide el menú de la semana. Lo usan las tandas Y la compra: la
     compra miraba SOLO las tandas, así que un plato del menú sin sesión de cocina asignada no
     aportaba ni un ingrediente a la lista, y encima sin avisar. */
  const need={};
  (days||[]).forEach(function(d){if(!d.shiftId)return;
    slotsFor(d.shiftId).forEach(function(s){const q=dishQty(slotItems(d.shiftId,s).items);
      Object.keys(q).forEach(function(id){need[id]=(need[id]||0)+q[id];});});});
  return need;}
function planBatches(days){
  const need=necesidadSemana(days);
  const batches={};
  store.dishes.forEach(d=>{if(!isBatch(d.batchId))return;
    const b=batchById(d.batchId);if(!b)return;
    const needP=Math.round((need[d.id]||0)*10)/10;
    const perPort=d.portions||1;
    const runs=needP>0?Math.max(1,Math.ceil(needP/perPort)):0;
    const suelo=Math.max(needP||0,(b.minCook||0),runs*perPort);   // nunca media receta: se hace la tanda y lo que sobra se congela
    const cooked=Math.round(suelo*10)/10;
    if(!batches[b.id])batches[b.id]={id:b.id,label:b.label,when:b.when,note:b.note,minCook:b.minCook||0,items:[],portions:0,hasNeed:false};
    batches[b.id].items.push({dish:d,needPort:needP,runs:runs,cooked:cooked});
    batches[b.id].portions+=cooked;
    if(needP>0)batches[b.id].hasNeed=true;});
  Object.keys(batches).forEach(k=>{batches[k].portions=Math.round(batches[k].portions*10)/10;});
  return batches;
}

/* hora orientativa según la etiqueta de la toma (palabras sueltas, para no
   pescar "comida" dentro de "comida favorita" ni "patata" dentro de una cena) */
const TIME_HINT=[[/^\b(desayun|breakfast)|\bantes de entrar\b/,'07:30'],
  [/\b(cena|cenas|nocturn|post-?guardia)|\bantes de dormir\b/,'21:00'],
  [/\b(media\s?ma|snack|picoteo)\b/,'11:00'],
  [/\b(comida|comidas|almuerzo|táper|tap|destino)\b/,'14:00'],
  [/\b(merienda|pre-?entreno|post-?entreno|entreno)\b/,'17:30']];
function defaultTime(txt){const t=String(txt||'').toLowerCase();for(const e of TIME_HINT){if(e[0].test(t))return e[1];}return '';}
function dayPicker(shiftId){
  const menu=slotsFor(shiftId);
  const used=new Set();const loose={};
  menu.forEach(function(s){
    if(s.mealId){used.add(s.mealId);return;}
    (s.items||[]).forEach(function(it){if(it.id)loose[it.id]=Math.max(loose[it.id]||0,num(it.portions,1));});});
  const mBtn=function(m){const t=totals(m.items),on=used.has(m.id);
    return '<button class="'+(on?'on':'')+'" data-a="pick-meal" data-shift="'+shiftId+'" data-id="'+m.id+'" title="'+(on?'quitarla de este día':'añadirla a este día')+'">'
      +(on?'✓ ':'+ ')+esc(m.name)+' <small>'+t.kcal+'k · '+t.prot+'g P</small></button>';};
  const dBtn=function(d){const on=!!loose[d.id];
    return '<button class="'+(on?'on':'')+'" data-a="pick-dish" data-shift="'+shiftId+'" data-id="'+d.id+'" title="'+
      (on?'hoy hay '+rac(loose[d.id])+' — toca para quitarlas':'añadir 1 ración a un hueco de hoy')+'">'
      +(on?'✓ ':'+ ')+esc(d.icon)+' '+esc(d.name)+' <small>'+(on?fmt(loose[d.id])+' rac. · +'+d.kcal+'k':'1 rac. · '+d.kcal+'k')+'</small></button>';};
  return '<div class="pick" data-pick="'+shiftId+'">'
    +'<h4>Elegir qué comer este día</h4>'
    +'<span class="row" style="gap:6px;width:auto"><button class="btn s" data-a="bf-quick" data-id="'+shiftId+'">☕ desayuno rápido de diario</button>'+
      '<span class="mini">café + fruta y nueces + whey + leche de proteínas, en el hueco del desayuno</span></span>'
    +(store.meals.length?'<span class="mini">comidas armadas:</span>'+store.meals.map(mBtn).join('')
      :'<span class="mini">no hay comidas armadas todavía · créalas abajo y reutilízalas en varios días</span>')
    +'<span class="mini">platos sueltos:</span>'+store.dishes.map(dBtn).join('')
    +'<span class="mini">'+menu.length+' hueco(s) en este día · vuelve a tocar para quitarlo · si desmontas una comida armada ajustas sus platos solo en este día</span></div>';
}
function togglePicker(shiftId,kind,mid){
  if(!shiftId)return 'no encuentro ese tipo de día';
  if(!store.menu[shiftId])store.menu[shiftId]=[];
  let menu=store.menu[shiftId];
  const m=kind==='meal'?mealById(mid):dishById(mid);
  if(!m)return 'ya no está en el catálogo';
  if(kind==='meal'){
    const on=menu.filter(function(s){return s.mealId===mid;});
    if(on.length){on.forEach(function(s){s.mealId='';s.items=clone(m.items||[]);});
      return '«'+m.name+'» quitada de este día (sus platos quedan sueltos por si quieres tunearlos)';}
    const t=defaultTime(m.name+' '+(m.note||''));
    const empty=menu.filter(function(s){return !s.mealId&&!(s.items||[]).length;})[0];
    if(empty){empty.mealId=mid;empty.label=empty.label||m.name;if(!empty.time)empty.time=t;
      return '«'+m.name+'» colocada en el hueco libre «'+empty.label+'»';}
    menu.push({id:uid('sl'),time:t,label:m.name,mealId:mid,items:[]});
    return '«'+m.name+'» añadida a este día';
  }
  const inDay=menu.some(function(s){return !s.mealId&&(s.items||[]).some(function(x){return x.id===mid;});});
  if(inDay){let hits=0;
    menu.forEach(function(s){if(s.mealId)return;const before=(s.items||[]).length;
      s.items=(s.items||[]).filter(function(x){if(x.id===mid){hits++;return false;}return true;});
      if(before&&!s.items.length)s._drop=1;});
    store.menu[shiftId]=menu.filter(function(s){return !s._drop;});
    return '«'+m.name+'» quitado de '+hits+' hueco(s) del día';
  }
  const t=defaultTime(m.name);
  const open=menu.filter(function(s){return !s.mealId&&(s.items||[]).length&&(s.items||[]).length<4;});
  const hit=open.filter(function(s){return s.items.some(function(x){return x.id===mid;});})[0];
  if(hit){hit.items.forEach(function(x){if(x.id===mid)x.portions=num(x.portions,1)+0.5;});
    return '+0,5 raciones de «'+m.name+'» en «'+(hit.label||'el hueco')+'»';}
  if(open.length){const sl=open[open.length-1];sl.items.push({kind:'dish',id:mid,portions:1});
    return '«'+m.name+'» añadido a «'+(sl.label||'el hueco')+'»';}
  menu.push({id:uid('sl'),time:t,label:t?'Comida':m.name,items:[{kind:'dish',id:mid,portions:1}]});
  return 'hueco nuevo con «'+m.name+'»';
}

/* ============ ritmo del día (acostarse / levantarse) y reparto de guardias ============ */
const RKEYS=[['wake','levantarse'],['breakfast','desayuno'],['leave','salir de casa'],['arrive','llegar'],['sleep','acostarse']];
function schedLine(shiftId,dateStr){
  const sh=shiftById(shiftId);if(!sh)return '';
  const rh=rhythmOf(shiftId,dateStr);
  const bed=rh.sleep?fmtTimeOut(rh.sleep):'',wake=rh.wake?fmtTimeOut(rh.wake):'';
  const h=fmtHM(sleepHours(rh.sleep,rh.wake)*60);
  const s=bed&&wake?'🛌 '+bed+' → ⏰ '+wake+(h?' · '+h:''):'';
  const tr=(rh.leave&&rh.arrive)?' · 🚌 '+fmtTimeOut(rh.leave)+'→'+fmtTimeOut(rh.arrive):'';
  return s+tr;}
function fmtTimeOut(t){const m=toMin(t);if(m==null)return '';const h=Math.floor(m/60),mi=m%60;
  return String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0');}
function nombreCorto(n){
  /* en la casilla del mes «Día de trabajo» no cabe: el «Día de» sobra, el icono ya dice que es un día.
     «Vacaciones» sí se parte en dos líneas, y se deja: cabe, y acortarlo salía peor. */
  return String(n||'').replace(/^d[íi]a\s+(de\s+|del\s+)?/i,'').trim()||String(n||'');}
function hCorta(t){/* en la casilla del mes no cabe «08:00»: las horas en punto van sin :00 */
  const m=toMin(t);if(m==null)return '';
  const h=Math.floor(m/60),mi=m%60;
  return mi?String(h)+':'+String(mi).padStart(2,'0'):String(h);}
function dayLine(d){
  const sh=shiftById(d.shiftId);
  if(!sh)return '<span class="mini">sin asignar</span>';
  const g=isGuardia(sh),rh=rhythmOf(sh.id,d.key);
  const jo=d.key?jornadaOf(d.key):jornadaEn((((d.idx||0)+1)%7),d.shiftId,false);
  const t=[];
  /* las horas de dormir y de levantarse NO van aquí: desde que se enseñan siempre debajo de la
     franja (horasSuenoHTML), ponerlas también en esta línea era decirlas dos veces en la misma
     fila. Aquí se queda lo del trabajo, que es lo otro que define el día. */
  /* con fecha, las horas DE VERDAD de ese día: una guardia de sábado no entra a la misma hora que
     una de martes, y el saliente trabaja hasta que le relevan */
  const hd=d.key?horasDelDiaTxt(d.key,d.inf):'';
  if(hd)t.push((g?'🩺 ':'💼 ')+hd);
  else if(sh.start)t.push((g?'🩺 ':'💼 ')+fmtTimeOut(sh.start)+(sh.end?'–'+fmtTimeOut(sh.end):'')+
    (jo&&sh.start!==jo.start?(' · jornada '+fmtTimeOut(jo.start)+'–'+fmtTimeOut(jo.end)):''));
  else if(jo)t.push('💼 '+fmtTimeOut(jo.start)+'–'+fmtTimeOut(jo.end));
  else if(rh.leave)t.push('🚌 '+fmtTimeOut(rh.leave));
  const gl=d.key?gymLine(d.key):'';if(gl)t.push(gl);
  const gs=d.key?resumenGym(d.key):'';if(gs)t.push('🏋️ '+gs);
  return t.join(' · ')||esc(sh.name);}
function distributeGuardias(y,m,replace){
  /* el mes: las guardias del cupo (6 por defecto), cada una con su saliente automático del día siguiente */
  const svc=monthService(y,m),G=(store.shifts.filter(isGuardia)[0])||store.shifts[0];
  if(!G)return 'no hay ningún tipo de día marcado como guardia (carga alta) en «Turno y rotación»';
  let days=monthDays(y,m);
  /* la guardia NO es del servicio del mes: el cupo se reparte por tipo (Urgencias / UMI) sin esperar a que pongas dónde trabajas */
  const total=+svc.guardias||0;
  const tipos=repartoTipos(total);
  if(!total)return 'pone un cupo mayor en «Guardias este mes»';
  let nG=0;
  if(replace){/* desde cero: se escriben los 6 del cupo encima de lo que hubiera */
    days.forEach(function(d){if(d.over)setDayOverride(d.key,null);});
    days=monthDays(y,m);
  }else{
    nG=days.filter(function(d){return d.shiftId&&isGuardia(shiftById(d.shiftId));}).length;
    if(nG>=total)return 'el mes ya va sobrado: '+nG+' guardia(s) frente a un cupo de '+total+
      ' · «repartir desde cero» escribe el mes a mano y manda sobre la plantilla';
    days=days.filter(function(d){return !d.shiftId;});
  }
  const toAdd=Math.max(0,total-nG);
  const cand=days.filter(function(d){return !d.over;});
  if(!cand.length)return 'no hay días sueltos para repartir: quita lo que pusiste a mano o cambia el cupo';
  const per=Math.max(1,Math.floor(cand.length/toAdd)),out=[];
  cand.forEach(function(d,ix){
    if(out.length>=toAdd||ix%per!==0)return;
    if(out.length&&d.key===out[out.length-1].next)return;
    setDayOverride(d.key,G.id,tipos[out.length]||'');   /* el saliente lo pone setDayOverride solo */
    out.push({key:d.key,next:nextIso(d.key)});
  });
  save();
  if(!out.length)return 'no he podido encajar ninguna guardia: no hay huecos separados entre sí';
  const g=guardCount(y,m);
  const extra=g.any-out.length;
  return out.length+' guardia(s) ('+gTiposTxt(g)+'), cada una con su saliente al día siguiente ('+saltoDiaTxt()+')'+
    (extra>0?' · la plantilla suma '+extra+' más: el mes queda en '+g.any+' · cambia de semana tipo o quita días en el calendario'
            :' · el mes queda en '+g.any+' de '+svc.guardias);}
  function syncToRotation(y,m){
  const list=monthDays(y,m).filter(function(d){return d.over;});
  const puestos=list.filter(function(d){return d.shiftId;});
  if(!list.length)return 'nada que volcar: primero asigna días en el calendario';
  const r=store.rotation;
  list.forEach(function(d){r.shiftByDay[d.key]={shift:d.shiftId,guard:d.guard||''};
    if(!r.daySet[d.key])r.daySet[d.key]={shift:d.shiftId,guard:d.guard||''};});
  if(!r.anchor||!parseDate(r.anchor))r.anchor=iso(mondayOf(list[0].date));
  r.anchorSet=true;r.mode='date';
  save();render();
  return 'Semana y cocina ya van por fecha con lo que marcaste en el calendario ('+
    list.length+' día(s) escritos · '+puestos.length+' con día asignado, '+
    (list.length-puestos.length)+' dejados vacíos a propósito).';}

function quickBreakfast(shiftId,dateStr){
  /* el desayuno de diario, sin platos preparados: café + fruta y nueces + whey + leche de proteínas */
  const sh=shiftById(shiftId);if(!sh)return 'no hay tipo de día que editar';
  const m=mealById('m-desc-diario'),mid=(m&&m.id)||'';
  if(!mid)return 'no encuentro la comida armada del desayuno rápido';
  if(!store.menu[sh.id])store.menu[sh.id]=[];
  const menu=store.menu[sh.id],rh=rhythmOf(sh.id,dateStr);
  if(menu.some(function(s){return s.mealId===mid;}))return 'ese día ya tiene el desayuno rápido montado';
  let sl=menu.filter(function(s){return /desayun/i.test(s.label||'');})[0]||menu.filter(function(s){return !s.mealId&&!(s.items||[]).length;})[0];
  if(!sl){sl={id:uid('sl'),time:rh.breakfast||'',label:'Desayuno',mealId:mid,items:[]};menu.unshift(sl);}
  else{sl.mealId=mid;sl.items=[];sl.label=sl.label||'Desayuno';if(!sl.time)sl.time=rh.breakfast||'';}
  return 'desayuno rápido de diario montado en «'+(sl.label||'Desayuno')+'»'+(sl.time?' a las '+sl.time:'');
}
/* catálogo local de alimentos (Mercadona, Carrefour, 100 Montaditos): mismo espíritu que
   GYM_URL/gymImportText más abajo, pero embebido aquí (sin fetch) para que participe en
   food.eans desde el primer arranque, sin red, incluso dentro del sandbox de un Artifact.
   Valores por 100 g estimados a partir de perfiles nutricionales típicos de cada categoría
   de producto (no son un volcado en vivo de Open Food Facts ni de la API de Mercadona: se
   generaron sin acceso de red a esos dominios — ver data/food-catalogo.json, que guarda el
   mismo contenido en un fichero aparte por si se quiere regenerar/ampliar con datos reales). */
const FOOD_CATALOGO=[{"ean":"cat-mercadona-001","nombre":"Leche entera","marca":"Mercadona","kcal":65,"prot":3.2,"carb":4.8,"gresa":3.6,"azucar":4.8,"fibra":0,"sal":0.1,"envase":"1 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-002","nombre":"Leche semidesnatada","marca":"Mercadona","kcal":47,"prot":3.2,"carb":4.8,"gresa":1.6,"azucar":4.8,"fibra":0,"sal":0.1,"envase":"1 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-003","nombre":"Leche desnatada","marca":"Mercadona","kcal":35,"prot":3.3,"carb":4.9,"gresa":0.3,"azucar":4.9,"fibra":0,"sal":0.1,"envase":"1 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-004","nombre":"Yogur natural","marca":"Mercadona","kcal":61,"prot":3.8,"carb":4.7,"gresa":3.2,"azucar":4.7,"fibra":0,"sal":0.13,"envase":"pack 4x125 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-005","nombre":"Yogur natural azucarado","marca":"Mercadona","kcal":87,"prot":3.4,"carb":12.6,"gresa":2.7,"azucar":12.6,"fibra":0,"sal":0.13,"envase":"pack 4x125 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-006","nombre":"Yogur desnatado natural","marca":"Mercadona","kcal":45,"prot":4.3,"carb":5.8,"gresa":0.2,"azucar":5.8,"fibra":0,"sal":0.14,"envase":"pack 4x125 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-007","nombre":"Yogur griego","marca":"Mercadona","kcal":121,"prot":4.5,"carb":5.9,"gresa":9,"azucar":5.9,"fibra":0,"sal":0.1,"envase":"pack 4x125 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-008","nombre":"Yogur de fresa","marca":"Mercadona","kcal":98,"prot":3.3,"carb":15.6,"gresa":2.6,"azucar":14,"fibra":0.2,"sal":0.13,"envase":"pack 4x125 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-009","nombre":"Cuajada","marca":"Mercadona","kcal":90,"prot":4,"carb":4.6,"gresa":6.4,"azucar":4.6,"fibra":0,"sal":0.12,"envase":"pack 2x150 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-010","nombre":"Requesón","marca":"Mercadona","kcal":98,"prot":13,"carb":3,"gresa":4.3,"azucar":3,"fibra":0,"sal":0.5,"envase":"250 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-011","nombre":"Queso fresco batido 0%","marca":"Mercadona","kcal":47,"prot":8,"carb":4,"gresa":0.2,"azucar":4,"fibra":0,"sal":0.35,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-012","nombre":"Huevos frescos categoría M","marca":"Mercadona","kcal":148,"prot":12.6,"carb":0.8,"gresa":10.6,"azucar":0.6,"fibra":0,"sal":0.36,"envase":"docena","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-013","nombre":"Queso curado mezcla","marca":"Mercadona","kcal":402,"prot":26,"carb":0.5,"gresa":33,"azucar":0.5,"fibra":0,"sal":1.8,"envase":"250 g cuña","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-014","nombre":"Queso semicurado","marca":"Mercadona","kcal":375,"prot":24,"carb":0.6,"gresa":30,"azucar":0.6,"fibra":0,"sal":1.7,"envase":"300 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-015","nombre":"Queso fresco para untar","marca":"Mercadona","kcal":245,"prot":5.8,"carb":4,"gresa":23,"azucar":3.5,"fibra":0,"sal":0.9,"envase":"150 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-016","nombre":"Queso en lonchas sándwich","marca":"Mercadona","kcal":300,"prot":18,"carb":2,"gresa":24,"azucar":1,"fibra":0,"sal":2.2,"envase":"200 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-017","nombre":"Mozzarella","marca":"Mercadona","kcal":280,"prot":18,"carb":1,"gresa":22,"azucar":1,"fibra":0,"sal":0.6,"envase":"125 g bola","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-018","nombre":"Queso rallado gratinar","marca":"Mercadona","kcal":350,"prot":27,"carb":2,"gresa":26,"azucar":1,"fibra":0,"sal":1.9,"envase":"200 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-019","nombre":"Pechuga de pollo fileteada","marca":"Mercadona","kcal":110,"prot":23,"carb":0,"gresa":1.5,"azucar":0,"fibra":0,"sal":0.15,"envase":"500 g bandeja","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-020","nombre":"Contramuslo de pollo","marca":"Mercadona","kcal":180,"prot":18,"carb":0,"gresa":12,"azucar":0,"fibra":0,"sal":0.15,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-021","nombre":"Filete de pavo fileteado","marca":"Mercadona","kcal":104,"prot":24,"carb":0,"gresa":1,"azucar":0,"fibra":0,"sal":0.2,"envase":"400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-022","nombre":"Solomillo de cerdo","marca":"Mercadona","kcal":143,"prot":21,"carb":0,"gresa":6,"azucar":0,"fibra":0,"sal":0.1,"envase":"400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-023","nombre":"Carne picada mixta","marca":"Mercadona","kcal":215,"prot":18,"carb":0,"gresa":16,"azucar":0,"fibra":0,"sal":0.15,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-024","nombre":"Jamón cocido extra","marca":"Mercadona","kcal":105,"prot":18,"carb":1,"gresa":3.5,"azucar":0.5,"fibra":0,"sal":2.1,"envase":"150 g sobres","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-025","nombre":"Pechuga de pavo cocida","marca":"Mercadona","kcal":95,"prot":20,"carb":1,"gresa":1,"azucar":0.5,"fibra":0,"sal":2,"envase":"150 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-026","nombre":"Jamón serrano loncheado","marca":"Mercadona","kcal":195,"prot":31,"carb":0,"gresa":8,"azucar":0,"fibra":0,"sal":4.8,"envase":"100 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-027","nombre":"Chorizo loncheado","marca":"Mercadona","kcal":380,"prot":22,"carb":1,"gresa":32,"azucar":0.5,"fibra":0,"sal":3.2,"envase":"100 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-028","nombre":"Salchichón loncheado","marca":"Mercadona","kcal":400,"prot":24,"carb":1,"gresa":34,"azucar":0.5,"fibra":0,"sal":3,"envase":"100 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-029","nombre":"Bacon lonchas","marca":"Mercadona","kcal":350,"prot":25,"carb":0.5,"gresa":27,"azucar":0.5,"fibra":0,"sal":2.8,"envase":"150 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-030","nombre":"Salchichas frankfurt","marca":"Mercadona","kcal":260,"prot":12,"carb":2,"gresa":22,"azucar":1,"fibra":0,"sal":2,"envase":"6 uds. 250 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-031","nombre":"Chóped","marca":"Mercadona","kcal":160,"prot":14,"carb":3,"gresa":10,"azucar":1,"fibra":0,"sal":2.5,"envase":"400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-032","nombre":"Alitas de pollo adobadas","marca":"Mercadona","kcal":210,"prot":17,"carb":2,"gresa":15,"azucar":0.5,"fibra":0,"sal":1,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-033","nombre":"Atún claro en aceite de oliva","marca":"Mercadona","kcal":200,"prot":25,"carb":0,"gresa":11,"azucar":0,"fibra":0,"sal":0.9,"envase":"pack 3x52 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-034","nombre":"Atún claro al natural","marca":"Mercadona","kcal":105,"prot":24,"carb":0,"gresa":0.8,"azucar":0,"fibra":0,"sal":0.6,"envase":"pack 3x52 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-035","nombre":"Salmón ahumado","marca":"Mercadona","kcal":155,"prot":22,"carb":0,"gresa":8,"azucar":0,"fibra":0,"sal":3.5,"envase":"80 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-036","nombre":"Bacalao desalado","marca":"Mercadona","kcal":82,"prot":18,"carb":0,"gresa":0.7,"azucar":0,"fibra":0,"sal":0.6,"envase":"400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-037","nombre":"Palitos de mar (surimi)","marca":"Mercadona","kcal":95,"prot":10,"carb":10,"gresa":0.5,"azucar":3,"fibra":0,"sal":1.5,"envase":"200 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-038","nombre":"Sardinas en aceite de oliva","marca":"Mercadona","kcal":210,"prot":20,"carb":0,"gresa":14,"azucar":0,"fibra":0,"sal":1,"envase":"lata 120 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-039","nombre":"Mejillones en escabeche","marca":"Mercadona","kcal":175,"prot":16,"carb":4,"gresa":10,"azucar":0.5,"fibra":0,"sal":1.4,"envase":"lata 111 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-040","nombre":"Gambas peladas cocidas congeladas","marca":"Mercadona","kcal":90,"prot":20,"carb":0.5,"gresa":0.8,"azucar":0,"fibra":0,"sal":1,"envase":"300 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-041","nombre":"Garbanzos cocidos (bote)","marca":"Mercadona","kcal":130,"prot":7.5,"carb":18,"gresa":2.5,"azucar":1.5,"fibra":6,"sal":0.7,"envase":"bote 400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-042","nombre":"Lentejas cocidas (bote)","marca":"Mercadona","kcal":105,"prot":7.5,"carb":15,"gresa":0.5,"azucar":1,"fibra":6.5,"sal":0.6,"envase":"bote 400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-043","nombre":"Alubias blancas cocidas (bote)","marca":"Mercadona","kcal":120,"prot":8,"carb":17,"gresa":0.5,"azucar":0.5,"fibra":6,"sal":0.6,"envase":"bote 400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-044","nombre":"Arroz blanco redondo","marca":"Mercadona","kcal":349,"prot":7,"carb":79,"gresa":0.6,"azucar":0.1,"fibra":1.3,"sal":0.01,"envase":"1 kg","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-045","nombre":"Arroz integral","marca":"Mercadona","kcal":340,"prot":7.5,"carb":71,"gresa":2.5,"azucar":0.5,"fibra":3.5,"sal":0.01,"envase":"1 kg","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-046","nombre":"Pasta macarrones","marca":"Mercadona","kcal":353,"prot":12,"carb":71,"gresa":1.5,"azucar":3,"fibra":3,"sal":0.01,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-047","nombre":"Espaguetis","marca":"Mercadona","kcal":355,"prot":12.5,"carb":72,"gresa":1.6,"azucar":3,"fibra":3,"sal":0.01,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-048","nombre":"Pasta integral","marca":"Mercadona","kcal":340,"prot":13,"carb":63,"gresa":2.5,"azucar":2.5,"fibra":8,"sal":0.01,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-049","nombre":"Cuscús","marca":"Mercadona","kcal":376,"prot":12.8,"carb":77,"gresa":0.6,"azucar":0,"fibra":5,"sal":0.01,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-050","nombre":"Quinoa","marca":"Mercadona","kcal":368,"prot":14,"carb":64,"gresa":6,"azucar":1,"fibra":7,"sal":0.01,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-051","nombre":"Pan de molde blanco","marca":"Mercadona","kcal":250,"prot":8,"carb":47,"gresa":3,"azucar":4,"fibra":3,"sal":1.1,"envase":"460 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-052","nombre":"Pan de molde integral","marca":"Mercadona","kcal":230,"prot":9,"carb":40,"gresa":3.5,"azucar":3,"fibra":6.5,"sal":1.1,"envase":"460 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-053","nombre":"Pan de hamburguesa","marca":"Mercadona","kcal":270,"prot":9,"carb":48,"gresa":4,"azucar":5,"fibra":3,"sal":1.2,"envase":"6 uds.","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-054","nombre":"Pan de pita","marca":"Mercadona","kcal":275,"prot":9,"carb":55,"gresa":1.5,"azucar":2,"fibra":2.5,"sal":1.3,"envase":"6 uds.","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-055","nombre":"Tostadas integrales","marca":"Mercadona","kcal":415,"prot":11,"carb":70,"gresa":8,"azucar":3,"fibra":7,"sal":1.4,"envase":"270 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-056","nombre":"Croissant","marca":"Mercadona","kcal":420,"prot":8,"carb":45,"gresa":22,"azucar":10,"fibra":2,"sal":0.8,"envase":"6 uds.","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-057","nombre":"Magdalenas","marca":"Mercadona","kcal":400,"prot":6,"carb":55,"gresa":17,"azucar":25,"fibra":1.5,"sal":0.5,"envase":"12 uds.","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-058","nombre":"Palmeras de chocolate","marca":"Mercadona","kcal":480,"prot":6,"carb":48,"gresa":29,"azucar":20,"fibra":2,"sal":0.4,"envase":"4 uds.","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-059","nombre":"Donuts","marca":"Mercadona","kcal":410,"prot":6,"carb":50,"gresa":20,"azucar":22,"fibra":2,"sal":0.6,"envase":"6 uds.","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-060","nombre":"Galletas María","marca":"Mercadona","kcal":430,"prot":7,"carb":75,"gresa":11,"azucar":22,"fibra":2.5,"sal":0.7,"envase":"800 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-061","nombre":"Copos de avena","marca":"Mercadona","kcal":375,"prot":13,"carb":60,"gresa":7,"azucar":1,"fibra":10,"sal":0.01,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-062","nombre":"Cereales de chocolate","marca":"Mercadona","kcal":390,"prot":6,"carb":78,"gresa":8,"azucar":32,"fibra":4,"sal":0.7,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-063","nombre":"Muesli con frutos secos","marca":"Mercadona","kcal":420,"prot":10,"carb":60,"gresa":13,"azucar":20,"fibra":8,"sal":0.1,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-064","nombre":"Barritas de cereales","marca":"Mercadona","kcal":410,"prot":6,"carb":65,"gresa":14,"azucar":30,"fibra":4,"sal":0.3,"envase":"6 uds.","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-065","nombre":"Cacao soluble","marca":"Mercadona","kcal":385,"prot":5,"carb":82,"gresa":3,"azucar":70,"fibra":6,"sal":0.3,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-066","nombre":"Mermelada de fresa","marca":"Mercadona","kcal":250,"prot":0.3,"carb":62,"gresa":0.1,"azucar":60,"fibra":1,"sal":0.02,"envase":"410 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-067","nombre":"Aceite de oliva virgen extra","marca":"Mercadona","kcal":900,"prot":0,"carb":0,"gresa":100,"azucar":0,"fibra":0,"sal":0,"envase":"1 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-068","nombre":"Aceite de girasol","marca":"Mercadona","kcal":900,"prot":0,"carb":0,"gresa":100,"azucar":0,"fibra":0,"sal":0,"envase":"1 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-069","nombre":"Tomate frito","marca":"Mercadona","kcal":85,"prot":1.5,"carb":10,"gresa":4,"azucar":8,"fibra":1.5,"sal":1,"envase":"400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-070","nombre":"Tomate triturado natural","marca":"Mercadona","kcal":25,"prot":1.2,"carb":4,"gresa":0.2,"azucar":3.5,"fibra":1.2,"sal":0.1,"envase":"390 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-071","nombre":"Mayonesa","marca":"Mercadona","kcal":680,"prot":1,"carb":3,"gresa":75,"azucar":2,"fibra":0,"sal":1.2,"envase":"450 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-072","nombre":"Ketchup","marca":"Mercadona","kcal":105,"prot":1.2,"carb":24,"gresa":22,"azucar":1,"fibra":0.7,"sal":2.1,"envase":"560 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-073","nombre":"Mostaza","marca":"Mercadona","kcal":110,"prot":5,"carb":8,"gresa":5,"azucar":3,"fibra":3,"sal":3.5,"envase":"225 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-074","nombre":"Vinagre de manzana","marca":"Mercadona","kcal":21,"prot":0,"carb":0.9,"gresa":0,"azucar":0.9,"fibra":0,"sal":0.02,"envase":"750 ml","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-075","nombre":"Ensalada de lechugas variadas (bolsa)","marca":"Mercadona","kcal":15,"prot":1.3,"carb":2,"gresa":0.2,"azucar":1.5,"fibra":1.6,"sal":0.02,"envase":"150 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-076","nombre":"Tomate frito casero congelado","marca":"Mercadona","kcal":60,"prot":1.5,"carb":8,"gresa":2.5,"azucar":6,"fibra":1.5,"sal":0.8,"envase":"400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-077","nombre":"Guisantes congelados","marca":"Mercadona","kcal":70,"prot":5.4,"carb":10,"gresa":0.5,"azucar":3.5,"fibra":5,"sal":0.05,"envase":"1 kg","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-078","nombre":"Judías verdes congeladas","marca":"Mercadona","kcal":30,"prot":1.8,"carb":5,"gresa":0.2,"azucar":2,"fibra":3,"sal":0.02,"envase":"1 kg","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-079","nombre":"Brócoli congelado","marca":"Mercadona","kcal":34,"prot":2.8,"carb":4,"gresa":0.4,"azucar":1.5,"fibra":3,"sal":0.02,"envase":"1 kg","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-080","nombre":"Espinacas congeladas","marca":"Mercadona","kcal":26,"prot":2.6,"carb":1.5,"gresa":0.5,"azucar":0.5,"fibra":3,"sal":0.1,"envase":"1 kg","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-081","nombre":"Macedonia de frutas en almíbar","marca":"Mercadona","kcal":65,"prot":0.5,"carb":15,"gresa":0.1,"azucar":14,"fibra":1,"sal":0.01,"envase":"480 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-082","nombre":"Aceitunas verdes rellenas de anchoa","marca":"Mercadona","kcal":145,"prot":1,"carb":3,"gresa":14,"azucar":0.5,"fibra":3,"sal":3.5,"envase":"350 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-083","nombre":"Frutos secos mix","marca":"Mercadona","kcal":600,"prot":18,"carb":15,"gresa":52,"azucar":5,"fibra":8,"sal":0.1,"envase":"200 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-084","nombre":"Pasas","marca":"Mercadona","kcal":300,"prot":3,"carb":70,"gresa":0.5,"azucar":60,"fibra":4,"sal":0.02,"envase":"200 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-085","nombre":"Pizza fresca margarita","marca":"Mercadona","kcal":240,"prot":10,"carb":30,"gresa":8,"azucar":3,"fibra":2,"sal":1.3,"envase":"400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-086","nombre":"Croquetas de jamón congeladas","marca":"Mercadona","kcal":260,"prot":6,"carb":22,"gresa":16,"azucar":2,"fibra":1.5,"sal":1.1,"envase":"600 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-087","nombre":"Croquetas de pollo congeladas","marca":"Mercadona","kcal":230,"prot":6,"carb":22,"gresa":13,"azucar":2,"fibra":1.5,"sal":1,"envase":"600 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-088","nombre":"Empanadillas de atún","marca":"Mercadona","kcal":290,"prot":8,"carb":28,"gresa":16,"azucar":2,"fibra":2,"sal":1.2,"envase":"10 uds.","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-089","nombre":"Lasaña de carne preparada","marca":"Mercadona","kcal":140,"prot":7,"carb":13,"gresa":6.5,"azucar":3,"fibra":1,"sal":0.6,"envase":"400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-090","nombre":"Canelones de carne preparados","marca":"Mercadona","kcal":150,"prot":6.5,"carb":15,"gresa":7,"azucar":2.5,"fibra":1,"sal":0.6,"envase":"500 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-091","nombre":"Patatas fritas congeladas para horno","marca":"Mercadona","kcal":165,"prot":3,"carb":26,"gresa":5,"azucar":0.5,"fibra":2.5,"sal":0.4,"envase":"1 kg","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-092","nombre":"Nuggets de pollo congelados","marca":"Mercadona","kcal":250,"prot":14,"carb":15,"gresa":15,"azucar":1,"fibra":1,"sal":1.2,"envase":"400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-093","nombre":"Ensaladilla rusa preparada","marca":"Mercadona","kcal":160,"prot":3,"carb":10,"gresa":12,"azucar":2,"fibra":1.5,"sal":0.8,"envase":"400 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-094","nombre":"Paella de marisco preparada","marca":"Mercadona","kcal":130,"prot":6,"carb":18,"gresa":3.5,"azucar":1,"fibra":1,"sal":0.9,"envase":"600 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-095","nombre":"Patatas fritas de bolsa","marca":"Mercadona","kcal":540,"prot":6,"carb":50,"gresa":35,"azucar":0.5,"fibra":4,"sal":1.4,"envase":"150 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-096","nombre":"Palomitas microondas","marca":"Mercadona","kcal":480,"prot":8,"carb":55,"gresa":25,"azucar":1,"fibra":10,"sal":1.3,"envase":"3 uds.","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-097","nombre":"Frutos secos fritos con sal","marca":"Mercadona","kcal":610,"prot":20,"carb":12,"gresa":54,"azucar":2,"fibra":8,"sal":1.5,"envase":"200 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-098","nombre":"Chocolate con leche tableta","marca":"Mercadona","kcal":535,"prot":7,"carb":57,"gresa":31,"azucar":55,"fibra":2.5,"sal":0.2,"envase":"125 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-099","nombre":"Chocolate negro 70%","marca":"Mercadona","kcal":570,"prot":8,"carb":35,"gresa":42,"azucar":24,"fibra":11,"sal":0.02,"envase":"100 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-100","nombre":"Galletas rellenas de chocolate","marca":"Mercadona","kcal":480,"prot":5,"carb":65,"gresa":22,"azucar":35,"fibra":2,"sal":0.5,"envase":"150 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-101","nombre":"Helado de vainilla tarrina","marca":"Mercadona","kcal":210,"prot":3.5,"carb":24,"gresa":11,"azucar":21,"fibra":0,"sal":0.15,"envase":"1 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-102","nombre":"Gominolas","marca":"Mercadona","kcal":340,"prot":5,"carb":78,"gresa":0,"azucar":55,"fibra":0,"sal":0.1,"envase":"250 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-103","nombre":"Agua mineral","marca":"Mercadona","kcal":0,"prot":0,"carb":0,"gresa":0,"azucar":0,"fibra":0,"sal":0.001,"envase":"1.5 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-104","nombre":"Refresco de cola","marca":"Mercadona","kcal":42,"prot":0,"carb":10.6,"gresa":0,"azucar":10.6,"fibra":0,"sal":0.01,"envase":"2 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-105","nombre":"Refresco de cola zero","marca":"Mercadona","kcal":0.3,"prot":0,"carb":0,"gresa":0,"azucar":0,"fibra":0,"sal":0.02,"envase":"2 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-106","nombre":"Zumo de naranja exprimido","marca":"Mercadona","kcal":45,"prot":0.7,"carb":10,"gresa":0.2,"azucar":8.5,"fibra":0.3,"sal":0.01,"envase":"1 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-107","nombre":"Bebida de soja","marca":"Mercadona","kcal":42,"prot":3.3,"carb":2.5,"gresa":2,"azucar":1,"fibra":0.5,"sal":0.1,"envase":"1 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-108","nombre":"Horchata","marca":"Mercadona","kcal":90,"prot":0.5,"carb":18,"gresa":2,"azucar":15,"fibra":0,"sal":0.05,"envase":"1 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-109","nombre":"Cerveza sin alcohol","marca":"Mercadona","kcal":21,"prot":0.3,"carb":4.3,"gresa":0,"azucar":4,"fibra":0,"sal":0.01,"envase":"6x330 ml","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-110","nombre":"Café soluble","marca":"Mercadona","kcal":12,"prot":0.6,"carb":2,"gresa":0.1,"azucar":0,"fibra":0,"sal":0.02,"envase":"200 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-111","nombre":"Té frío de limón","marca":"Mercadona","kcal":32,"prot":0,"carb":8,"gresa":0,"azucar":8,"fibra":0,"sal":0.02,"envase":"1.5 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-112","nombre":"Isotónica sabor limón","marca":"Mercadona","kcal":25,"prot":0,"carb":6,"gresa":0,"azucar":6,"fibra":0,"sal":0.15,"envase":"1.5 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-113","nombre":"Hummus natural","marca":"Mercadona","kcal":250,"prot":7,"carb":12,"gresa":20,"azucar":1,"fibra":5,"sal":1,"envase":"200 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-114","nombre":"Guacamole","marca":"Mercadona","kcal":150,"prot":1.5,"carb":6,"gresa":13,"azucar":1,"fibra":4,"sal":0.9,"envase":"150 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-115","nombre":"Aceitunas negras","marca":"Mercadona","kcal":130,"prot":1,"carb":2,"gresa":13,"azucar":0.5,"fibra":3,"sal":3,"envase":"200 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-116","nombre":"Patatas chips sabor jamón","marca":"Mercadona","kcal":530,"prot":5,"carb":52,"gresa":34,"azucar":1,"fibra":4,"sal":1.6,"envase":"160 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-117","nombre":"Tortitas de arroz","marca":"Mercadona","kcal":385,"prot":8,"carb":80,"gresa":3,"azucar":0.5,"fibra":3,"sal":0.02,"envase":"130 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-118","nombre":"Barritas proteicas de chocolate","marca":"Mercadona","kcal":370,"prot":30,"carb":35,"gresa":12,"azucar":15,"fibra":4,"sal":0.5,"envase":"5x40 g","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-119","nombre":"Batido proteico de chocolate listo para beber","marca":"Mercadona","kcal":75,"prot":8,"carb":6,"gresa":2,"azucar":4,"fibra":0.5,"sal":0.15,"envase":"500 ml","fuente":"Catálogo local · Mercadona"},{"ean":"cat-mercadona-120","nombre":"Leche de avena","marca":"Mercadona","kcal":47,"prot":0.5,"carb":8,"gresa":1.5,"azucar":4,"fibra":0.8,"sal":0.1,"envase":"1 L","fuente":"Catálogo local · Mercadona"},{"ean":"cat-carrefour-001","nombre":"Leche entera","marca":"Carrefour","kcal":64,"prot":3.1,"carb":4.7,"gresa":3.5,"azucar":4.7,"fibra":0,"sal":0.1,"envase":"1 L","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-002","nombre":"Leche semidesnatada","marca":"Carrefour","kcal":46,"prot":3.1,"carb":4.8,"gresa":1.5,"azucar":4.8,"fibra":0,"sal":0.1,"envase":"1 L","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-003","nombre":"Yogur natural","marca":"Carrefour","kcal":60,"prot":3.7,"carb":4.6,"gresa":3.1,"azucar":4.6,"fibra":0,"sal":0.13,"envase":"pack 4x125 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-004","nombre":"Yogur griego","marca":"Carrefour","kcal":125,"prot":4.4,"carb":6,"gresa":9.3,"azucar":6,"fibra":0,"sal":0.1,"envase":"pack 4x125 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-005","nombre":"Queso curado","marca":"Carrefour","kcal":398,"prot":25,"carb":0.6,"gresa":32,"azucar":0.6,"fibra":0,"sal":1.8,"envase":"250 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-006","nombre":"Queso en lonchas","marca":"Carrefour","kcal":295,"prot":17,"carb":2,"gresa":24,"azucar":1,"fibra":0,"sal":2.1,"envase":"200 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-007","nombre":"Pechuga de pollo fileteada","marca":"Carrefour","kcal":108,"prot":23,"carb":0,"gresa":1.3,"azucar":0,"fibra":0,"sal":0.15,"envase":"500 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-008","nombre":"Jamón cocido extra","marca":"Carrefour","kcal":100,"prot":18,"carb":1,"gresa":3,"azucar":0.5,"fibra":0,"sal":2,"envase":"150 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-009","nombre":"Jamón serrano loncheado","marca":"Carrefour","kcal":190,"prot":30,"carb":0,"gresa":8,"azucar":0,"fibra":0,"sal":4.6,"envase":"100 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-010","nombre":"Chorizo loncheado","marca":"Carrefour","kcal":375,"prot":22,"carb":1,"gresa":31,"azucar":0.5,"fibra":0,"sal":3.1,"envase":"100 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-011","nombre":"Atún claro en aceite de oliva","marca":"Carrefour","kcal":195,"prot":25,"carb":0,"gresa":10.5,"azucar":0,"fibra":0,"sal":0.9,"envase":"pack 3x52 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-012","nombre":"Salmón ahumado","marca":"Carrefour","kcal":150,"prot":22,"carb":0,"gresa":7.5,"azucar":0,"fibra":0,"sal":3.4,"envase":"80 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-013","nombre":"Sardinas en aceite de oliva","marca":"Carrefour","kcal":205,"prot":19,"carb":0,"gresa":13.5,"azucar":0,"fibra":0,"sal":1,"envase":"120 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-014","nombre":"Garbanzos cocidos (bote)","marca":"Carrefour","kcal":128,"prot":7.4,"carb":17.5,"gresa":2.4,"azucar":1.4,"fibra":6,"sal":0.7,"envase":"400 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-015","nombre":"Lentejas cocidas (bote)","marca":"Carrefour","kcal":103,"prot":7.4,"carb":14.5,"gresa":0.5,"azucar":1,"fibra":6.4,"sal":0.6,"envase":"400 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-016","nombre":"Arroz blanco","marca":"Carrefour","kcal":348,"prot":7,"carb":78.5,"gresa":0.6,"azucar":0.1,"fibra":1.3,"sal":0.01,"envase":"1 kg","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-017","nombre":"Espaguetis","marca":"Carrefour","kcal":352,"prot":12.3,"carb":71.5,"gresa":1.6,"azucar":3,"fibra":3,"sal":0.01,"envase":"500 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-018","nombre":"Pan de molde blanco","marca":"Carrefour","kcal":245,"prot":7.8,"carb":46.5,"gresa":3,"azucar":4,"fibra":3,"sal":1.1,"envase":"460 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-019","nombre":"Pan de hamburguesa","marca":"Carrefour","kcal":265,"prot":8.8,"carb":47.5,"gresa":3.8,"azucar":4.8,"fibra":3,"sal":1.2,"envase":"6 uds.","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-020","nombre":"Croissant","marca":"Carrefour","kcal":415,"prot":7.8,"carb":44.5,"gresa":21.5,"azucar":9.8,"fibra":2,"sal":0.8,"envase":"6 uds.","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-021","nombre":"Galletas María","marca":"Carrefour","kcal":425,"prot":6.8,"carb":74.5,"gresa":10.8,"azucar":21.5,"fibra":2.5,"sal":0.7,"envase":"800 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-022","nombre":"Copos de avena","marca":"Carrefour","kcal":372,"prot":12.8,"carb":59.5,"gresa":6.8,"azucar":1,"fibra":10,"sal":0.01,"envase":"500 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-023","nombre":"Cereales de chocolate","marca":"Carrefour","kcal":385,"prot":5.8,"carb":77,"gresa":7.8,"azucar":31,"fibra":4,"sal":0.7,"envase":"500 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-024","nombre":"Aceite de oliva virgen extra","marca":"Carrefour","kcal":900,"prot":0,"carb":0,"gresa":100,"azucar":0,"fibra":0,"sal":0,"envase":"1 L","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-025","nombre":"Tomate frito","marca":"Carrefour","kcal":82,"prot":1.4,"carb":9.5,"gresa":3.8,"azucar":7.5,"fibra":1.5,"sal":1,"envase":"400 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-026","nombre":"Mayonesa","marca":"Carrefour","kcal":675,"prot":1,"carb":3,"gresa":74.5,"azucar":2,"fibra":0,"sal":1.2,"envase":"450 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-027","nombre":"Ketchup","marca":"Carrefour","kcal":102,"prot":1.1,"carb":23.5,"gresa":21.5,"azucar":1,"fibra":0.7,"sal":2.1,"envase":"560 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-028","nombre":"Guisantes congelados","marca":"Carrefour","kcal":68,"prot":5.3,"carb":9.8,"gresa":0.5,"azucar":3.4,"fibra":5,"sal":0.05,"envase":"1 kg","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-029","nombre":"Judías verdes congeladas","marca":"Carrefour","kcal":29,"prot":1.7,"carb":4.8,"gresa":0.2,"azucar":2,"fibra":3,"sal":0.02,"envase":"1 kg","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-030","nombre":"Brócoli congelado","marca":"Carrefour","kcal":33,"prot":2.7,"carb":3.8,"gresa":0.4,"azucar":1.4,"fibra":3,"sal":0.02,"envase":"1 kg","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-031","nombre":"Pizza fresca cuatro quesos","marca":"Carrefour","kcal":260,"prot":12,"carb":28,"gresa":11,"azucar":3,"fibra":2,"sal":1.4,"envase":"400 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-032","nombre":"Croquetas de jamón congeladas","marca":"Carrefour","kcal":255,"prot":5.8,"carb":21.5,"gresa":15.5,"azucar":2,"fibra":1.5,"sal":1.1,"envase":"600 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-033","nombre":"Nuggets de pollo congelados","marca":"Carrefour","kcal":245,"prot":13.8,"carb":14.5,"gresa":14.5,"azucar":1,"fibra":1,"sal":1.2,"envase":"400 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-034","nombre":"Lasaña de carne preparada","marca":"Carrefour","kcal":138,"prot":6.8,"carb":12.8,"gresa":6.3,"azucar":3,"fibra":1,"sal":0.6,"envase":"400 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-035","nombre":"Patatas fritas congeladas para horno","marca":"Carrefour","kcal":160,"prot":2.8,"carb":25.5,"gresa":4.8,"azucar":0.5,"fibra":2.5,"sal":0.4,"envase":"1 kg","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-036","nombre":"Patatas fritas de bolsa","marca":"Carrefour","kcal":535,"prot":5.8,"carb":49.5,"gresa":34.5,"azucar":0.5,"fibra":4,"sal":1.4,"envase":"150 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-037","nombre":"Chocolate con leche tableta","marca":"Carrefour","kcal":530,"prot":6.8,"carb":56.5,"gresa":30.5,"azucar":54,"fibra":2.5,"sal":0.2,"envase":"125 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-038","nombre":"Chocolate negro 70%","marca":"Carrefour","kcal":565,"prot":7.8,"carb":34.5,"gresa":41.5,"azucar":23.5,"fibra":11,"sal":0.02,"envase":"100 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-039","nombre":"Helado de vainilla tarrina","marca":"Carrefour","kcal":205,"prot":3.4,"carb":23.5,"gresa":10.8,"azucar":20.5,"fibra":0,"sal":0.15,"envase":"1 L","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-040","nombre":"Agua mineral","marca":"Carrefour","kcal":0,"prot":0,"carb":0,"gresa":0,"azucar":0,"fibra":0,"sal":0.001,"envase":"1.5 L","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-041","nombre":"Refresco de cola","marca":"Carrefour","kcal":41,"prot":0,"carb":10.4,"gresa":0,"azucar":10.4,"fibra":0,"sal":0.01,"envase":"2 L","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-042","nombre":"Zumo de naranja","marca":"Carrefour","kcal":44,"prot":0.7,"carb":9.8,"gresa":0.2,"azucar":8.3,"fibra":0.3,"sal":0.01,"envase":"1 L","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-043","nombre":"Bebida de soja","marca":"Carrefour","kcal":41,"prot":3.2,"carb":2.4,"gresa":1.9,"azucar":1,"fibra":0.5,"sal":0.1,"envase":"1 L","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-044","nombre":"Hummus natural","marca":"Carrefour","kcal":245,"prot":6.8,"carb":11.5,"gresa":19.5,"azucar":1,"fibra":5,"sal":1,"envase":"200 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-carrefour-045","nombre":"Aceitunas verdes rellenas de anchoa","marca":"Carrefour","kcal":142,"prot":1,"carb":2.8,"gresa":13.8,"azucar":0.5,"fibra":3,"sal":3.5,"envase":"350 g","fuente":"Catálogo local · Carrefour"},{"ean":"cat-100montaditos-001","nombre":"Montadito de jamón serrano","marca":"100 Montaditos","kcal":260,"prot":12,"carb":30,"gresa":9,"azucar":2,"fibra":1.5,"sal":1.8,"envase":"1 ud. ≈ 60 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-002","nombre":"Montadito de jamón y queso","marca":"100 Montaditos","kcal":270,"prot":13,"carb":29,"gresa":11,"azucar":2,"fibra":1.3,"sal":1.9,"envase":"1 ud. ≈ 65 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-003","nombre":"Montadito de lomo","marca":"100 Montaditos","kcal":250,"prot":14,"carb":28,"gresa":8.5,"azucar":2,"fibra":1.3,"sal":1.6,"envase":"1 ud. ≈ 65 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-004","nombre":"Montadito de chorizo","marca":"100 Montaditos","kcal":290,"prot":12,"carb":27,"gresa":15,"azucar":2,"fibra":1.3,"sal":2.1,"envase":"1 ud. ≈ 60 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-005","nombre":"Montadito de tortilla española","marca":"100 Montaditos","kcal":230,"prot":8,"carb":26,"gresa":10,"azucar":1.5,"fibra":1.2,"sal":1,"envase":"1 ud. ≈ 70 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-006","nombre":"Montadito de pollo","marca":"100 Montaditos","kcal":235,"prot":13,"carb":27,"gresa":8,"azucar":2,"fibra":1.3,"sal":1.4,"envase":"1 ud. ≈ 65 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-007","nombre":"Montadito de atún","marca":"100 Montaditos","kcal":225,"prot":12,"carb":27,"gresa":7,"azucar":2,"fibra":1.3,"sal":1.3,"envase":"1 ud. ≈ 65 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-008","nombre":"Montadito vegetal","marca":"100 Montaditos","kcal":190,"prot":6,"carb":28,"gresa":6,"azucar":3,"fibra":2,"sal":0.9,"envase":"1 ud. ≈ 70 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-009","nombre":"Montadito de chóped","marca":"100 Montaditos","kcal":240,"prot":10,"carb":29,"gresa":9,"azucar":2,"fibra":1.3,"sal":1.9,"envase":"1 ud. ≈ 65 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-010","nombre":"Montadito de sobrasada","marca":"100 Montaditos","kcal":300,"prot":9,"carb":27,"gresa":18,"azucar":2,"fibra":1.3,"sal":2,"envase":"1 ud. ≈ 60 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-011","nombre":"Montadito de queso","marca":"100 Montaditos","kcal":265,"prot":11,"carb":27,"gresa":12,"azucar":2,"fibra":1.3,"sal":1.7,"envase":"1 ud. ≈ 65 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-012","nombre":"Montadito de bacon","marca":"100 Montaditos","kcal":275,"prot":12,"carb":26,"gresa":14,"azucar":2,"fibra":1.3,"sal":2,"envase":"1 ud. ≈ 60 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-013","nombre":"Montadito de huevo","marca":"100 Montaditos","kcal":220,"prot":10,"carb":26,"gresa":8,"azucar":2,"fibra":1.3,"sal":1.2,"envase":"1 ud. ≈ 70 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-014","nombre":"Flauta de jamón y queso","marca":"100 Montaditos","kcal":260,"prot":12,"carb":32,"gresa":9,"azucar":2,"fibra":1.6,"sal":1.8,"envase":"1 ud. ≈ 140 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-015","nombre":"Flauta vegetal","marca":"100 Montaditos","kcal":200,"prot":6,"carb":30,"gresa":6,"azucar":3,"fibra":2.2,"sal":0.9,"envase":"1 ud. ≈ 150 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-016","nombre":"Patatas bravas","marca":"100 Montaditos","kcal":175,"prot":2.5,"carb":20,"gresa":9,"azucar":1,"fibra":1.8,"sal":1,"envase":"ración ≈ 250 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-017","nombre":"Croquetas de jamón (ración)","marca":"100 Montaditos","kcal":260,"prot":6,"carb":22,"gresa":16,"azucar":2,"fibra":1.5,"sal":1.1,"envase":"ración 8 uds. ≈ 200 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-018","nombre":"Ensaladilla rusa (ración)","marca":"100 Montaditos","kcal":160,"prot":3,"carb":10,"gresa":12,"azucar":2,"fibra":1.5,"sal":0.8,"envase":"ración ≈ 200 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-019","nombre":"Nachos con queso","marca":"100 Montaditos","kcal":320,"prot":8,"carb":34,"gresa":17,"azucar":2,"fibra":2.5,"sal":1.4,"envase":"ración ≈ 200 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-020","nombre":"Alitas de pollo (ración)","marca":"100 Montaditos","kcal":260,"prot":20,"carb":5,"gresa":18,"azucar":1,"fibra":0.5,"sal":1.5,"envase":"ración 6 uds. ≈ 250 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-021","nombre":"Ensalada César","marca":"100 Montaditos","kcal":140,"prot":8,"carb":6,"gresa":9,"azucar":2,"fibra":1.5,"sal":0.9,"envase":"ración ≈ 300 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-022","nombre":"Tarta de queso","marca":"100 Montaditos","kcal":320,"prot":6,"carb":28,"gresa":20,"azucar":22,"fibra":0.5,"sal":0.4,"envase":"ración ≈ 120 g","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-023","nombre":"Cerveza de barril (caña)","marca":"100 Montaditos","kcal":42,"prot":0.4,"carb":3.5,"gresa":0,"azucar":0,"fibra":0,"sal":0.01,"envase":"caña ≈ 200 ml","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-024","nombre":"Refresco de cola (vaso)","marca":"100 Montaditos","kcal":42,"prot":0,"carb":10.6,"gresa":0,"azucar":10.6,"fibra":0,"sal":0.01,"envase":"vaso ≈ 300 ml","fuente":"Catálogo local · 100 Montaditos (restaurante)"},{"ean":"cat-100montaditos-025","nombre":"Tinto de verano","marca":"100 Montaditos","kcal":35,"prot":0.1,"carb":4,"gresa":0,"azucar":4,"fibra":0,"sal":0.01,"envase":"vaso ≈ 250 ml","fuente":"Catálogo local · 100 Montaditos (restaurante)"}];
/* ===================== alimentos: la tabla de nutrición =====================
   Alimentos a peso (no productos de marca: eso es FOOD_CATALOGO). Todo por 100 g de la forma en
   que se compra —crudo salvo que diga otra cosa— porque es como se pesa al cocinar.

   ⚠ Estos valores los he escrito yo a partir de tablas de composición publicadas: son de
   REFERENCIA y aproximados, no de una base oficial. La app lo dice en cada ficha. Con una clave
   de USDA FoodData Central puesta en Ajustes, cada alimento que consultes se corrige con el dato
   oficial y se guarda ya corregido.

   Campos: n nombre · e emoji · g grupo · kcal · pr proteína · ch carbohidrato · az azúcares
   fi fibra · gr grasa · sa sal — y los micros: fe hierro(mg) ca calcio(mg) k potasio(mg)
   mg magnesio(mg) vc vit.C(mg) vd vit.D(µg) b12(µg) b6(mg) fo folato(µg). */
const ALIM_MICROS=['fe','ca','k','mg','vc','vd','b12','b6','fo'];
const ALIM_LABEL={fe:'Hierro',ca:'Calcio',k:'Potasio',mg:'Magnesio',vc:'Vitamina C',
  vd:'Vitamina D',b12:'Vitamina B12',b6:'Vitamina B6',fo:'Folato'};
const ALIM_UNIDAD={fe:'mg',ca:'mg',k:'mg',mg:'mg',vc:'mg',vd:'µg',b12:'µg',b6:'mg',fo:'µg'};
/* ingesta de referencia de un adulto (VRN del reglamento europeo de etiquetado). NO es una pauta
   médica personalizada: es la referencia que se usa en los envases. */
const ALIM_VRN={fe:14,ca:800,k:2000,mg:375,vc:80,vd:5,b12:2.5,b6:1.4,fo:200};
const ALIM_GRUPOS=[['fruta','🍎 Fruta'],['verdura','🥦 Verdura'],['carne','🍗 Carne y huevo'],
  ['pescado','🐟 Pescado'],['legumbre','🫘 Legumbre'],['cereal','🌾 Cereal y pan'],
  ['lacteo','🥛 Lácteo'],['graso','🥑 Grasas y frutos secos'],['otro','🧂 Otros']];
/* ===================== gluten =====================
   Eres celíaco, así que esto no es una etiqueta más: es lo que decide si puedes comer un plato.
   La app AVISA, NO GARANTIZA. Un nombre no dice lo que lleva un producto —el chorizo de una marca
   lleva gluten y el de otra no—, así que hay tres estados y el tercero es de verdad «no lo sé»:

     no       alimento de toda la vida sin gluten: carne, pescado, huevo, fruta, verdura, arroz…
     sí       trigo, cebada, centeno, espelta y lo hecho con ellos
     depende  la marca manda: avena (contaminación cruzada), embutidos, caldos, salsas, rebozados,
              suplementos, conservas preparadas… aquí hay que mirar la etiqueta

   La regla de oro está escrita en la pantalla: lo que manda es el envase, no esta app. */
const GLUTEN_SI=[
  /trigo|wheat|espelta|kamut|cebada|barley|centeno|rye|malta|s[ée]mola|cuscus|cusc[úu]s|bulgur/i,
  /\bpan\b|panecillo|panko|biscote|tostada|bollo|croissant|magdalena|galleta|bizcocho|masa madre/i,
  /pasta|macarr|espagueti|espagueti|tallarin|fideo|lasa[ñn]a|canel[óo]n|noodle|ramen/i,
  /harina(?! de (arroz|ma[íi]z|garbanzo|almendra|trigo sarraceno))/i,
  /rebozad|empanad|croqueta|empanadilla|pizza|tortilla de trigo|wrap de trigo|cerveza/i,
  /cus?c[úu]s|seit[áa]n|cerveza|obleas/i];
const GLUTEN_DEPENDE=[
  /* la avena NO lleva gluten, pero se cultiva y se muele con trigo: la contaminación cruzada es lo
     que la hace dudosa. Si la tuya es certificada sin gluten, deja de serlo — y eso lo dice tu
     perfil, no una lista fija, porque el día que compres otra marca vuelve a avisar. */
  /avena|oat/i,
  /chorizo|salchich|embutido|morcilla|fiambre|jam[óo]n cocido|pav[oa] cocid|surimi|patatas? fritas de bolsa/i,
  /caldo|fumet|pastilla de|sopa de sobre|salsa|soja|teriyaki|ketchup|mostaza|mayonesa/i,
  /curry|especias? mezcl|sazonador|colorante alimentario|levadura/i,
  /prote[íi]na|whey|caseina|case[íi]na|barrita|suplement|batido de/i,
  /yogur de sabores|postre l[áa]cteo|helado|chocolate|cacao soluble|colacao/i,
  /conserva|de bote|precocinad|congelad[oa]s? preparad|ensalada completa|hamburguesa|alb[óo]ndiga/i,
  /at[úu]n en aceite|paté|patés|foie/i,
  /* envasados que NO son de trigo pero pasan por fábrica: las tortitas de arroz llevan malta de
     cebada en más marcas de las que uno esperaría */
  /tortita|nacho|snack|palomitas|cereales de desayuno|muesli|gran ?ola|granola/i];
function avenaSegura(){
  /* por defecto SÍ: lo dijo él, compra avena certificada sin gluten. Se apaga desde «Tú» el día que
     compre otra, y entonces el porridge y el yogur con avena vuelven a salir en ámbar. */
  const p=perfilS();
  return p.avenaSinGluten!==false;}
function glutenDe(nombre){
  const t=String(nombre||'').toLowerCase();
  if(!t.trim())return 'no';
  /* lo que pone el envase manda: si dice «sin gluten», es sin gluten */
  if(/sin gluten|gluten ?free|libre de gluten|sin tacc/.test(t))return 'no';
  /* tu avena es certificada sin gluten, así que para ti la avena sola no es «depende». Lo que la
     lleva mezclada —muesli, granola, cereales de caja— sigue siéndolo: eso no lo arregla la avena. */
  if(avenaSegura()&&/avena|oat/i.test(t)&&!/muesli|gran ?ola|granola|cereales|barrita|galleta|bizcocho|pan\b|bar-?bar/i.test(t))
    return 'no';
  let est='no';
  for(let i=0;i<GLUTEN_SI.length;i++)if(GLUTEN_SI[i].test(t)){est='si';break;}
  if(est!=='si')for(let j=0;j<GLUTEN_DEPENDE.length;j++)if(GLUTEN_DEPENDE[j].test(t)){est='depende';break;}
  /* Un cereal alternativo NO hace seguro un producto: el pan de maíz del súper suele llevar trigo
     también. Baja el aviso a «mira la etiqueta», nunca a «sin gluten». Para un celíaco el error
     barato es mirar una etiqueta de más; el caro es el otro. */
  if(est==='si'&&/de ma[íi]z|de arroz|de trigo sarraceno|de garbanzo|de quinoa|de almendra|de avena/.test(t))
    est='depende';
  return est;}
const GLUTEN_ETQ={si:{t:'lleva gluten',c:'mal'},depende:{t:'mira la etiqueta',c:'duda'},no:{t:'sin gluten',c:'ok'}};
function glutenDePlato(d){
  /* un plato es lo peor de sus ingredientes: si uno lleva gluten, el plato lleva gluten */
  if(!d)return {est:'no',porQue:[]};
  if(d.gluten==='si'||d.gluten==='no'||d.gluten==='depende')return {est:d.gluten,porQue:[]};
  const ing=[].concat(d.ingredients||[]);
  let peor='no';const porQue=[];
  ing.forEach(function(x){
    const g=glutenDe(x);
    if(g==='si'){peor='si';porQue.push({x:x,g:g});}
    else if(g==='depende'){if(peor!=='si')peor='depende';porQue.push({x:x,g:g});}});
  if(peor==='no'){const gn=glutenDe(d.name);if(gn!=='no'){peor=gn;porQue.push({x:d.name,g:gn});}}
  return {est:peor,porQue:porQue};}
function esCeliaco(){return !!(store.perfil&&store.perfil.celiaco);}
function glutenChipHTML(est,corto){
  if(!esCeliaco()||!est||est==='no')return '';
  const e=GLUTEN_ETQ[est]||GLUTEN_ETQ.depende;
  return '<span class="glu '+e.c+'" title="'+esc(e.t)+'">'+(est==='si'?'⚠ gluten':(corto?'? etiqueta':'? mira la etiqueta'))+'</span>';}
function perfilS(){
  if(!store.perfil||typeof store.perfil!=='object')
    store.perfil={celiaco:false,avenaSinGluten:true,alturaCm:0,pesoKg:0,sexo:'h',nacido:0,actividad:1.5,meta:'mantener',pesos:[]};
  if(!Array.isArray(store.perfil.pesos))store.perfil.pesos=[];
  return store.perfil;}
function setPerfil(campo,valor){
  const p=perfilS();
  if(campo==='celiaco')p.celiaco=!p.celiaco;
  else if(campo==='avena')p.avenaSinGluten=(p.avenaSinGluten===false);
  else if(campo==='meta')p.meta=(['perder','mantener','ganar'].indexOf(valor)>=0)?valor:'mantener';
  else if(campo==='alturaCm')p.alturaCm=Math.max(0,Math.min(250,Math.round(+valor||0)));
  else if(campo==='pesoKg')p.pesoKg=Math.max(0,Math.min(300,Math.round((+valor||0)*10)/10));
  else if(campo==='nacido')p.nacido=Math.max(0,Math.round(+valor||0));
  else if(campo==='actividad')p.actividad=Math.max(1.2,Math.min(2.2,+valor||1.5));
  save();render();
  if(campo==='celiaco')return p.celiaco?'celíaco: la app te avisa del gluten en la compra y en los platos'
    :'aviso de gluten apagado';
  if(campo==='avena')return p.avenaSinGluten?'avena certificada: el porridge y el yogur con avena dejan de avisar'
    :'avena sin certificar: vuelven a salir en ámbar por contaminación cruzada';
  return 'perfil guardado';}
function apuntarPeso(kg,key){
  const p=perfilS(),k=foodKey(key)||iso(new Date()),v=Math.round((+kg||0)*10)/10;
  if(!(v>=30&&v<=300))return 'ese peso no puede ser';
  p.pesos=p.pesos.filter(function(x){return x.k!==k;});
  p.pesos.push({k:k,kg:v});
  p.pesos.sort(function(a,b){return a.k.localeCompare(b.k);});
  p.pesoKg=v;
  save();render();
  return 'apuntado: '+fmtKg(v)+' kg el '+fechaCortaTxt(k);}
function tendenciaPeso(n){
  /* media móvil de 7 días: el peso del día sube y baja con la sal, el agua y la hora. Lo que dice
     algo es la tendencia, no la báscula de esta mañana. */
  const p=perfilS(),l=p.pesos.slice(-(n||90));
  if(l.length<2)return null;
  const media=function(hasta){
    const desde=iso(addDays(parseDate(hasta),-6));
    const t=l.filter(function(x){return x.k>=desde&&x.k<=hasta;});
    return t.length?t.reduce(function(a,x){return a+x.kg;},0)/t.length:null;};
  const ult=l[l.length-1],pri=l[0];
  const mUlt=media(ult.k),mPri=media(pri.k);
  const dias=Math.max(1,Math.round((parseDate(ult.k)-parseDate(pri.k))/86400000));
  const dif=(mUlt!=null&&mPri!=null)?Math.round((mUlt-mPri)*10)/10:null;
  return {hoy:ult.kg,fecha:ult.k,n:l.length,media:mUlt!=null?Math.round(mUlt*10)/10:null,
    dif:dif,dias:dias,porSemana:(dif!=null&&dias>=7)?Math.round(dif/dias*7*100)/100:null};}
function platosConGluten(){
  /* los platos que hay que cambiar, y los que dependen de qué marca compres */
  const out={si:[],depende:[]};
  (store.dishes||[]).forEach(function(d){
    const g=glutenDePlato(d);
    if(g.est==='si')out.si.push({d:d,porQue:g.porQue});
    else if(g.est==='depende')out.depende.push({d:d,porQue:g.porQue});});
  return out;}
/* el sustituto sin gluten de cada plato que lo lleva: se propone, no se cambia solo */
const GLUTEN_CAMBIOS={
  'd-pan-aceite':{name:'Tostada de maíz con tomate y aceite',
    ing:['2 tostada de maíz sin gluten','1 tomate','8 ml aceite de oliva','2 g sal'],
    nota:'el pan de trigo por tortitas o pan de maíz sin gluten'},
  'd-sandwich':{name:'Tortitas de maíz con atún y pimiento asado',
    ing:['2 tortita de maíz sin gluten','1 lata atún','30 g pimiento asado','5 ml aceite de oliva'],
    nota:'el bocadillo por tortitas de maíz certificadas'}};
function cambiarPlatoSinGluten(id){
  const d=(store.dishes||[]).filter(function(x){return x.id===id;})[0];
  if(!d)return 'ese plato ya no está';
  const c=GLUTEN_CAMBIOS[id];
  if(!c)return 'ese plato no tiene un cambio preparado: edítalo a mano';
  d.name=c.name;d.ingredients=c.ing.slice();d.gluten='no';
  save();render();
  return 'cambiado por «'+c.name+'»: '+c.nota;}
const ALIMENTOS=[
/* --- fruta --- */
{n:'Manzana',e:'🍎',g:'fruta',kcal:52,pr:0.3,ch:14,az:10,fi:2.4,gr:0.2,fe:0.1,ca:6,k:107,mg:5,vc:4.6,b6:0.04,fo:3},
{n:'Plátano',e:'🍌',g:'fruta',kcal:89,pr:1.1,ch:23,az:12,fi:2.6,gr:0.3,fe:0.3,ca:5,k:358,mg:27,vc:8.7,b6:0.37,fo:20},
{n:'Naranja',e:'🍊',g:'fruta',kcal:47,pr:0.9,ch:12,az:9,fi:2.4,gr:0.1,fe:0.1,ca:40,k:181,mg:10,vc:53,b6:0.06,fo:30},
{n:'Mandarina',e:'🍊',g:'fruta',kcal:53,pr:0.8,ch:13,az:11,fi:1.8,gr:0.3,fe:0.15,ca:37,k:166,mg:12,vc:27,b6:0.08,fo:16},
{n:'Fresa',e:'🍓',g:'fruta',kcal:32,pr:0.7,ch:7.7,az:4.9,fi:2,gr:0.3,fe:0.4,ca:16,k:153,mg:13,vc:59,b6:0.05,fo:24},
{n:'Kiwi',e:'🥝',g:'fruta',kcal:61,pr:1.1,ch:15,az:9,fi:3,gr:0.5,fe:0.3,ca:34,k:312,mg:17,vc:93,b6:0.06,fo:25},
{n:'Uva',e:'🍇',g:'fruta',kcal:69,pr:0.7,ch:18,az:16,fi:0.9,gr:0.2,fe:0.4,ca:10,k:191,mg:7,vc:3.2,b6:0.09,fo:2},
{n:'Pera',e:'🍐',g:'fruta',kcal:57,pr:0.4,ch:15,az:10,fi:3.1,gr:0.1,fe:0.2,ca:9,k:116,mg:7,vc:4.3,b6:0.03,fo:7},
{n:'Melocotón',e:'🍑',g:'fruta',kcal:39,pr:0.9,ch:10,az:8.4,fi:1.5,gr:0.3,fe:0.25,ca:6,k:190,mg:9,vc:6.6,b6:0.03,fo:4},
{n:'Sandía',e:'🍉',g:'fruta',kcal:30,pr:0.6,ch:7.6,az:6.2,fi:0.4,gr:0.2,fe:0.24,ca:7,k:112,mg:10,vc:8.1,b6:0.05,fo:3},
{n:'Melón',e:'🍈',g:'fruta',kcal:34,pr:0.8,ch:8.2,az:7.9,fi:0.9,gr:0.2,fe:0.21,ca:9,k:267,mg:12,vc:37,b6:0.07,fo:21},
{n:'Piña',e:'🍍',g:'fruta',kcal:50,pr:0.5,ch:13,az:9.9,fi:1.4,gr:0.1,fe:0.29,ca:13,k:109,mg:12,vc:48,b6:0.11,fo:18},
{n:'Aguacate',e:'🥑',g:'fruta',kcal:160,pr:2,ch:8.5,az:0.7,fi:6.7,gr:15,fe:0.55,ca:12,k:485,mg:29,vc:10,b6:0.26,fo:81},
{n:'Arándano',e:'🫐',g:'fruta',kcal:57,pr:0.7,ch:14,az:10,fi:2.4,gr:0.3,fe:0.28,ca:6,k:77,mg:6,vc:9.7,b6:0.05,fo:6},
{n:'Limón',e:'🍋',g:'fruta',kcal:29,pr:1.1,ch:9.3,az:2.5,fi:2.8,gr:0.3,fe:0.6,ca:26,k:138,mg:8,vc:53,b6:0.08,fo:11},
{n:'Ciruela',e:'🍑',g:'fruta',kcal:46,pr:0.7,ch:11,az:10,fi:1.4,gr:0.3,fe:0.17,ca:6,k:157,mg:7,vc:9.5,b6:0.03,fo:5},
/* --- verdura --- */
{n:'Brócoli',e:'🥦',g:'verdura',kcal:34,pr:2.8,ch:6.6,az:1.7,fi:2.6,gr:0.4,fe:0.73,ca:47,k:316,mg:21,vc:89,b6:0.18,fo:63},
{n:'Espinaca',e:'🥬',g:'verdura',kcal:23,pr:2.9,ch:3.6,az:0.4,fi:2.2,gr:0.4,fe:2.7,ca:99,k:558,mg:79,vc:28,b6:0.2,fo:194},
{n:'Tomate',e:'🍅',g:'verdura',kcal:18,pr:0.9,ch:3.9,az:2.6,fi:1.2,gr:0.2,fe:0.27,ca:10,k:237,mg:11,vc:14,b6:0.08,fo:15},
{n:'Cebolla',e:'🧅',g:'verdura',kcal:40,pr:1.1,ch:9.3,az:4.2,fi:1.7,gr:0.1,fe:0.21,ca:23,k:146,mg:10,vc:7.4,b6:0.12,fo:19},
{n:'Zanahoria',e:'🥕',g:'verdura',kcal:41,pr:0.9,ch:9.6,az:4.7,fi:2.8,gr:0.2,fe:0.3,ca:33,k:320,mg:12,vc:5.9,b6:0.14,fo:19},
{n:'Pimiento rojo',e:'🫑',g:'verdura',kcal:31,pr:1,ch:6,az:4.2,fi:2.1,gr:0.3,fe:0.43,ca:7,k:211,mg:12,vc:128,b6:0.29,fo:46},
{n:'Calabacín',e:'🥒',g:'verdura',kcal:17,pr:1.2,ch:3.1,az:2.5,fi:1,gr:0.3,fe:0.37,ca:16,k:261,mg:18,vc:18,b6:0.16,fo:24},
{n:'Berenjena',e:'🍆',g:'verdura',kcal:25,pr:1,ch:5.9,az:3.5,fi:3,gr:0.2,fe:0.23,ca:9,k:229,mg:14,vc:2.2,b6:0.08,fo:22},
{n:'Patata',e:'🥔',g:'verdura',kcal:77,pr:2,ch:17,az:0.8,fi:2.2,gr:0.1,fe:0.81,ca:12,k:425,mg:23,vc:19.7,b6:0.3,fo:15},
{n:'Boniato',e:'🍠',g:'verdura',kcal:86,pr:1.6,ch:20,az:4.2,fi:3,gr:0.1,fe:0.61,ca:30,k:337,mg:25,vc:2.4,b6:0.21,fo:11},
{n:'Lechuga',e:'🥬',g:'verdura',kcal:15,pr:1.4,ch:2.9,az:0.8,fi:1.3,gr:0.2,fe:0.86,ca:36,k:194,mg:13,vc:9.2,b6:0.09,fo:38},
{n:'Ajo',e:'🧄',g:'verdura',kcal:149,pr:6.4,ch:33,az:1,fi:2.1,gr:0.5,fe:1.7,ca:181,k:401,mg:25,vc:31,b6:1.24,fo:3},
{n:'Champiñón',e:'🍄',g:'verdura',kcal:22,pr:3.1,ch:3.3,az:2,fi:1,gr:0.3,fe:0.5,ca:3,k:318,mg:9,vc:2.1,vd:0.2,b6:0.1,fo:17},
{n:'Judía verde',e:'🫛',g:'verdura',kcal:31,pr:1.8,ch:7,az:3.3,fi:2.7,gr:0.2,fe:1.03,ca:37,k:211,mg:25,vc:12.2,b6:0.14,fo:33},
{n:'Guisante',e:'🫛',g:'verdura',kcal:81,pr:5.4,ch:14,az:5.7,fi:5.7,gr:0.4,fe:1.47,ca:25,k:244,mg:33,vc:40,b6:0.17,fo:65},
{n:'Pepino',e:'🥒',g:'verdura',kcal:15,pr:0.7,ch:3.6,az:1.7,fi:0.5,gr:0.1,fe:0.28,ca:16,k:147,mg:13,vc:2.8,b6:0.04,fo:7},
{n:'Coliflor',e:'🥬',g:'verdura',kcal:25,pr:1.9,ch:5,az:1.9,fi:2,gr:0.3,fe:0.42,ca:22,k:299,mg:15,vc:48,b6:0.18,fo:57},
{n:'Espárrago',e:'🥬',g:'verdura',kcal:20,pr:2.2,ch:3.9,az:1.9,fi:2.1,gr:0.1,fe:2.14,ca:24,k:202,mg:14,vc:5.6,b6:0.09,fo:52},
{n:'Puerro',e:'🧅',g:'verdura',kcal:61,pr:1.5,ch:14,az:3.9,fi:1.8,gr:0.3,fe:2.1,ca:59,k:180,mg:28,vc:12,b6:0.23,fo:64},
{n:'Calabaza',e:'🎃',g:'verdura',kcal:26,pr:1,ch:6.5,az:2.8,fi:0.5,gr:0.1,fe:0.8,ca:21,k:340,mg:12,vc:9,b6:0.06,fo:16},
{n:'Pimiento verde',e:'🫑',g:'verdura',kcal:20,pr:0.9,ch:4.6,az:2.4,fi:1.7,gr:0.2,fe:0.34,ca:10,k:175,mg:10,vc:80,b6:0.22,fo:10},
/* --- carne y huevo --- */
{n:'Pechuga de pollo',e:'🍗',g:'carne',nota:'cruda, sin piel',kcal:120,pr:22.5,ch:0,az:0,fi:0,gr:2.6,fe:0.7,ca:11,k:334,mg:27,b12:0.2,b6:0.55,fo:4},
{n:'Muslo de pollo',e:'🍗',g:'carne',nota:'crudo, sin piel',kcal:119,pr:19.7,ch:0,az:0,fi:0,gr:3.9,fe:0.9,ca:8,k:243,mg:23,b12:0.5,b6:0.35,fo:7},
{n:'Pechuga de pavo',e:'🦃',g:'carne',nota:'cruda',kcal:111,pr:24,ch:0,az:0,fi:0,gr:1.5,fe:0.8,ca:8,k:300,mg:28,b12:0.4,b6:0.7,fo:6},
{n:'Ternera magra',e:'🥩',g:'carne',nota:'cruda',kcal:131,pr:21.5,ch:0,az:0,fi:0,gr:4.6,fe:2.1,ca:12,k:330,mg:22,b12:1.6,b6:0.5,fo:9},
{n:'Lomo de cerdo',e:'🥩',g:'carne',nota:'crudo',kcal:143,pr:21.4,ch:0,az:0,fi:0,gr:5.9,fe:0.8,ca:14,k:373,mg:25,b12:0.6,b6:0.5,fo:2},
{n:'Huevo',e:'🥚',g:'carne',nota:'entero, crudo',kcal:143,pr:12.6,ch:0.7,az:0.4,fi:0,gr:9.5,fe:1.75,ca:56,k:138,mg:12,vd:2,b12:0.89,b6:0.17,fo:47},
{n:'Jamón serrano',e:'🍖',g:'carne',kcal:241,pr:31,ch:0.3,az:0,fi:0,gr:12.6,sa:4.9,fe:1.4,ca:12,k:480,mg:25,b12:1.2,b6:0.4,fo:3},
{n:'Jamón cocido',e:'🍖',g:'carne',kcal:107,pr:18,ch:1.5,az:1,fi:0,gr:3.3,sa:2.3,fe:0.9,ca:9,k:290,mg:18,b12:0.7,b6:0.3,fo:3},
{n:'Chorizo',e:'🌭',g:'carne',kcal:455,pr:24,ch:1.9,az:0.5,fi:0,gr:38,sa:4.6,fe:1.4,ca:10,k:340,mg:18,b12:1.4,b6:0.3,fo:2},
/* --- pescado --- */
{n:'Salmón',e:'🐟',g:'pescado',nota:'crudo',kcal:208,pr:20,ch:0,az:0,fi:0,gr:13,fe:0.34,ca:9,k:363,mg:27,vd:11,b12:3.2,b6:0.6,fo:26},
{n:'Merluza',e:'🐟',g:'pescado',nota:'cruda',kcal:86,pr:17,ch:0,az:0,fi:0,gr:1.8,fe:0.4,ca:25,k:300,mg:30,vd:1.5,b12:1,b6:0.2,fo:8},
{n:'Atún en lata al natural',e:'🐟',g:'pescado',kcal:116,pr:26,ch:0,az:0,fi:0,gr:1,sa:0.8,fe:1,ca:11,k:237,mg:33,vd:2,b12:2.2,b6:0.32,fo:4},
{n:'Sardina',e:'🐟',g:'pescado',nota:'cruda',kcal:208,pr:25,ch:0,az:0,fi:0,gr:11,fe:2.9,ca:382,k:397,mg:39,vd:4.8,b12:8.9,b6:0.17,fo:10},
{n:'Bacalao',e:'🐟',g:'pescado',nota:'fresco',kcal:82,pr:18,ch:0,az:0,fi:0,gr:0.7,fe:0.4,ca:16,k:413,mg:32,vd:0.9,b12:0.9,b6:0.24,fo:7},
{n:'Gamba',e:'🦐',g:'pescado',nota:'cruda',kcal:85,pr:20,ch:0,az:0,fi:0,gr:0.5,sa:0.5,fe:0.5,ca:64,k:185,mg:37,vd:0.1,b12:1.1,b6:0.1,fo:19},
{n:'Boquerón',e:'🐟',g:'pescado',nota:'crudo',kcal:131,pr:20,ch:0,az:0,fi:0,gr:4.8,fe:3.3,ca:147,k:383,mg:41,vd:11,b12:0.6,b6:0.14,fo:9},
/* --- legumbre --- */
{n:'Lenteja',e:'🫘',g:'legumbre',nota:'cruda',kcal:352,pr:25,ch:63,az:2,fi:11,gr:1.1,fe:7.5,ca:56,k:955,mg:122,vc:4.5,b6:0.54,fo:479},
{n:'Lenteja cocida',e:'🫘',g:'legumbre',kcal:116,pr:9,ch:20,az:1.8,fi:7.9,gr:0.4,fe:3.3,ca:19,k:369,mg:36,vc:1.5,b6:0.18,fo:181},
{n:'Garbanzo',e:'🫘',g:'legumbre',nota:'crudo',kcal:364,pr:19,ch:61,az:11,fi:17,gr:6,fe:6.2,ca:105,k:875,mg:115,vc:4,b6:0.54,fo:557},
{n:'Garbanzo de bote',e:'🫘',g:'legumbre',nota:'cocido y escurrido',kcal:139,pr:7.3,ch:22,az:3.6,fi:6.4,gr:2.6,sa:0.4,fe:1.6,ca:38,k:173,mg:30,vc:1,b6:0.11,fo:54},
{n:'Alubia blanca',e:'🫘',g:'legumbre',nota:'cruda',kcal:333,pr:23,ch:60,az:2,fi:15,gr:0.8,fe:5.5,ca:240,k:1400,mg:190,vc:0,b6:0.4,fo:388},
{n:'Tofu',e:'🧈',g:'legumbre',kcal:76,pr:8,ch:1.9,az:0.6,fi:0.3,gr:4.8,fe:5.4,ca:350,k:121,mg:30,vc:0.1,b6:0.05,fo:15},
/* --- cereal y pan --- */
{n:'Arroz blanco',e:'🍚',g:'cereal',nota:'crudo',kcal:360,pr:6.6,ch:79,az:0.1,fi:1.3,gr:0.6,fe:0.8,ca:9,k:86,mg:25,b6:0.16,fo:8},
{n:'Arroz integral',e:'🍚',g:'cereal',nota:'crudo',kcal:370,pr:7.9,ch:77,az:0.7,fi:3.5,gr:2.9,fe:1.5,ca:23,k:223,mg:143,b6:0.51,fo:20},
{n:'Pasta',e:'🍝',g:'cereal',nota:'cruda',kcal:371,pr:13,ch:75,az:2.7,fi:3.2,gr:1.5,fe:1.3,ca:21,k:223,mg:53,b6:0.14,fo:18},
{n:'Pan integral',e:'🍞',g:'cereal',kcal:247,pr:13,ch:41,az:4.3,fi:7,gr:3.4,sa:1.2,fe:2.5,ca:107,k:254,mg:82,b6:0.2,fo:42},
{n:'Pan blanco',e:'🍞',g:'cereal',kcal:265,pr:9,ch:49,az:5,fi:2.7,gr:3.2,sa:1.2,fe:3.6,ca:151,k:126,mg:25,b6:0.1,fo:85},
{n:'Copos de avena',e:'🥣',g:'cereal',kcal:389,pr:17,ch:66,az:1,fi:11,gr:7,fe:4.7,ca:54,k:429,mg:177,b6:0.12,fo:56},
{n:'Quinoa',e:'🌾',g:'cereal',nota:'cruda',kcal:368,pr:14,ch:64,az:0,fi:7,gr:6,fe:4.6,ca:47,k:563,mg:197,b6:0.49,fo:184},
{n:'Harina de trigo',e:'🌾',g:'cereal',kcal:364,pr:10,ch:76,az:0.3,fi:2.7,gr:1,fe:1.2,ca:15,k:107,mg:22,b6:0.04,fo:26},
/* --- lácteo --- */
{n:'Leche entera',e:'🥛',g:'lacteo',kcal:61,pr:3.2,ch:4.8,az:4.8,fi:0,gr:3.3,sa:0.1,fe:0,ca:113,k:143,mg:10,vd:1.1,b12:0.45,b6:0.04,fo:5},
{n:'Leche desnatada',e:'🥛',g:'lacteo',kcal:34,pr:3.4,ch:5,az:5,fi:0,gr:0.1,sa:0.1,fe:0,ca:122,k:156,mg:11,vd:1.1,b12:0.5,b6:0.04,fo:5},
{n:'Yogur natural',e:'🥛',g:'lacteo',kcal:61,pr:3.5,ch:4.7,az:4.7,fi:0,gr:3.3,sa:0.1,fe:0.1,ca:121,k:155,mg:12,vd:0.1,b12:0.37,b6:0.03,fo:7},
{n:'Yogur griego',e:'🥛',g:'lacteo',kcal:97,pr:9,ch:3.6,az:3.6,fi:0,gr:5,sa:0.1,fe:0.1,ca:100,k:141,mg:11,vd:0.1,b12:0.75,b6:0.06,fo:7},
{n:'Queso fresco',e:'🧀',g:'lacteo',kcal:98,pr:11,ch:3.4,az:3.4,fi:0,gr:4.3,sa:0.9,fe:0.1,ca:111,k:122,mg:11,vd:0.1,b12:0.4,b6:0.05,fo:12},
{n:'Queso curado',e:'🧀',g:'lacteo',kcal:393,pr:26,ch:1,az:0.5,fi:0,gr:32,sa:1.8,fe:0.3,ca:750,k:100,mg:30,vd:0.5,b12:1.5,b6:0.07,fo:18},
{n:'Mantequilla',e:'🧈',g:'lacteo',kcal:717,pr:0.9,ch:0.1,az:0.1,fi:0,gr:81,sa:0.1,fe:0,ca:24,k:24,mg:2,vd:1.5,b12:0.17,b6:0,fo:3},
/* --- grasas y frutos secos --- */
{n:'Aceite de oliva',e:'🫒',g:'graso',kcal:884,pr:0,ch:0,az:0,fi:0,gr:100,fe:0.6,ca:1,k:1,mg:0,vc:0,fo:0},
{n:'Nuez',e:'🌰',g:'graso',kcal:654,pr:15,ch:14,az:2.6,fi:6.7,gr:65,fe:2.9,ca:98,k:441,mg:158,vc:1.3,b6:0.54,fo:98},
{n:'Almendra',e:'🌰',g:'graso',kcal:579,pr:21,ch:22,az:4.4,fi:12.5,gr:50,fe:3.7,ca:269,k:733,mg:270,vc:0,b6:0.14,fo:44},
{n:'Cacahuete',e:'🥜',g:'graso',kcal:567,pr:26,ch:16,az:4.7,fi:8.5,gr:49,fe:4.6,ca:92,k:705,mg:168,vc:0,b6:0.35,fo:240},
{n:'Semilla de chía',e:'🌱',g:'graso',kcal:486,pr:17,ch:42,az:0,fi:34,gr:31,fe:7.7,ca:631,k:407,mg:335,vc:1.6,b6:0.09,fo:49},
{n:'Aceituna',e:'🫒',g:'graso',kcal:145,pr:1,ch:3.8,az:0.5,fi:3.3,gr:15,sa:3.3,fe:3.3,ca:88,k:8,mg:4,vc:0.9,b6:0.03,fo:3},
/* --- otros --- */
{n:'Miel',e:'🍯',g:'otro',kcal:304,pr:0.3,ch:82,az:82,fi:0.2,gr:0,fe:0.42,ca:6,k:52,mg:2,vc:0.5,b6:0.02,fo:2},
{n:'Chocolate negro 70%',e:'🍫',g:'otro',kcal:598,pr:7.8,ch:46,az:24,fi:11,gr:43,fe:11.9,ca:73,k:715,mg:228,vc:0,b6:0.04,fo:12},
{n:'Tomate triturado',e:'🥫',g:'otro',kcal:32,pr:1.6,ch:7,az:4.4,fi:1.9,gr:0.3,sa:0.3,fe:0.9,ca:14,k:293,mg:15,vc:14,b6:0.1,fo:13},
{n:'Leche de coco',e:'🥥',g:'otro',kcal:197,pr:2,ch:2.8,az:2.8,fi:0,gr:21,fe:1.6,ca:16,k:220,mg:37,vc:1,b6:0.03,fo:16},
{n:'Caldo de pollo',e:'🍲',g:'otro',kcal:15,pr:1.2,ch:0.9,az:0.3,fi:0,gr:0.6,sa:0.9,fe:0.1,ca:5,k:40,mg:2,vc:0,b6:0.01,fo:1},
{n:'Proteína whey',e:'🥤',g:'otro',nota:'en polvo',kcal:380,pr:80,ch:7,az:4,fi:0.5,gr:5,sa:0.5,fe:1,ca:400,k:300,mg:60,vc:0,b12:1.5,b6:0.3,fo:20}
];
/* ===================== comida: productos, escáner y cuenta de calorías ===================== */
function food(){
  if(!store.food||typeof store.food!=='object')store.food={objetivo:{kcal:0,prot:0},eans:{},log:{},fav:[]};
  const f=store.food;
  if(!f.eans||typeof f.eans!=='object')f.eans={};
  if(!f.log||typeof f.log!=='object')f.log={};
  if(!Array.isArray(f.fav))f.fav=[];
  if(!f.objetivo||typeof f.objetivo!=='object')f.objetivo={kcal:0,prot:0};
  ['kcal','prot','carb','gresa'].forEach(function(k){if(typeof f.objetivo[k]!=='number')f.objetivo[k]=0;});
  if(typeof f.catalogoFuente!=='string')f.catalogoFuente='';
  if(!Array.isArray(f.alimentos))f.alimentos=[];   /* alimentos tuyos, los que no están en la tabla */
  if(!f.usda||typeof f.usda!=='object')f.usda={};  /* correcciones traídas de FoodData Central, por id */
  if(!Array.isArray(f.nevera))f.nevera=[];         /* lo que tienes en casa ahora mismo */
  if(!Array.isArray(f.despensa))f.despensa=[];     /* …y cuánto hay de cada cosa */
  if(!Array.isArray(f.neveraMano))f.neveraMano=[];
  return f;}
function offNum(v){const n=parseFloat(String(v==null?'':v).replace(',','.'));return isFinite(n)?Math.round(n*10)/10:0;}
function mapOffProduct(p){
  /* de la ficha de Open Food Facts a nuestro producto: siempre por 100 g, que es como se cuentan las raciones */
  if(!p||typeof p!=='object')return null;
  const n=p.nutriments||{},code=String(p.code||p.barcode||'').replace(/\D/g,'');
  const name=String(p.product_name||p.product_name_es||p.generic_name||'').trim();
  if(!name&&!code)return null;
  const per=function(k){const a=k+'_per_100g';return offNum(n[a]!=null?n[a]:n[k]);};
  const kcal=(n['energy-kcal_per_100g']!=null)?offNum(n['energy-kcal_per_100g']):Math.round(per('energy')/4.184);
  const out={ean:code,nombre:name||(code+' sin nombre'),marca:String(p.brands||'').split(',')[0].trim(),
    kcal:kcal,prot:per('proteins'),carb:per('carbohydrates'),gresa:per('fat'),
    azucar:per('sugars'),fibra:per('fiber'),sal:per('salt'),
    envase:String(p.quantity||'').trim().slice(0,28),fuente:'Open Food Facts',ts:Date.now()};
  if(!out.kcal&&!out.prot)return null;   /* sin datos no lo guardamos: la app no inventa lo que comes */
  return out;}
function addEanProduct(o){
  if(!o||!(+o.kcal||+o.prot))return {ok:false,msg:'ese producto no trae kcal ni proteína por 100 g: no lo guardo a medias'};
  const f=food(),ean=String(o.ean||'').replace(/\D/g,'')||('sin'+String(Date.now()).slice(-6));
  f.eans[ean]=Object.assign({},f.eans[ean]||{},o,{ean:ean,ts:Date.now()});
  save();
  return {ok:true,ean:ean,p:f.eans[ean],
    msg:'guardado: '+f.eans[ean].nombre+' · '+f.eans[ean].kcal+' kcal y '+f.eans[ean].prot+' g de proteína por 100 g'};}
function delEanProduct(ean){const f=food();if(!f.eans[ean])return 'ese código no estaba en tus productos';
  const nm=f.eans[ean].nombre;delete f.eans[ean];
  f.fav=f.fav.filter(function(x){return x!==ean;});save();return 'quitado '+nm;}
function toggleFavEan(ean){const f=food();if(!f.eans[ean])return 'no está en tus productos';
  const i=f.fav.indexOf(ean);if(i>=0)f.fav.splice(i,1);else f.fav.push(ean);save();
  return i>=0?('fuera de favoritos'):('en favoritos: lo verás a un toque en el día');}
function foodImportCatalogo(){
  /* catálogo local (Mercadona, Carrefour, 100 Montaditos): mismo patrón que gymImportText —
     se importa una vez y desde ahí se busca y se apunta en local, sin red nunca más. No pisa
     productos que ya tengas guardados (escaneados o con el mismo id de catálogo). */
  const f=food();
  let n=0,ya=0;
  FOOD_CATALOGO.forEach(function(p){
    if(f.eans[p.ean]){ya++;return;}
    if(!(+p.kcal||+p.prot))return;   /* misma regla que addEanProduct: sin datos no se guarda */
    f.eans[p.ean]=Object.assign({},p,{ts:Date.now()});
    n++;
  });
  if(n||ya)f.catalogoFuente='catálogo local · '+iso(new Date())+' · '+FOOD_CATALOGO.length+' productos (Mercadona, Carrefour, 100 Montaditos)';
  save();render();
  return {ok:true,n:n,ya:ya,
    msg:n?(n+' producto(s) del catálogo local añadidos: ya se buscan y se apuntan sin conexión'):
      (ya?'ya tenías todo el catálogo local importado':'nada que importar')};}
function porcionDe(p,g){
  /* las calorías enteras y los macro al décimo: es lo que se lee en un envase */
  const q=Math.max(0,+g||0)/100,o={};
  ['kcal','prot','carb','gresa','azucar','fibra','sal'].forEach(function(k){const v=(+p[k]||0)*q;
    o[k]=(k==='kcal')?Math.round(v):Math.round(v*10)/10;});
  return o;}
/* ===================== alimentos: el modelo =====================
   Un "alimento" es comida a peso (un plátano, 100 g de lentejas). Un "producto" —lo de food().eans—
   es un envase con código de barras. Los dos se apuntan igual en el día; lo que cambia es de dónde
   sale el dato: el producto lo trae su etiqueta y el alimento, la tabla de abajo o USDA. */
function alimTxt(s){return String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');}
function alimSlug(n){return 'al-'+alimTxt(n).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,28);}
function alimBase(){
  /* la tabla que viene con la app, ya con id */
  if(!alimBase._c)alimBase._c=ALIMENTOS.map(function(a){
    return Object.assign({},a,{id:alimSlug(a.n),fuente:'tabla'});});
  return alimBase._c;}
function alimTodos(){
  /* tabla + los tuyos, y encima la corrección de USDA si la hay. El orden importa: lo tuyo pisa la
     tabla (si te has molestado en escribirlo, es porque el tuyo es distinto) y USDA pisa la tabla
     pero nunca lo que has escrito tú a mano. */
  const f=food(),mapa={};
  alimBase().forEach(function(a){
    const u=f.usda[a.id];
    mapa[a.id]=u?Object.assign({},a,u,{id:a.id,n:a.n,e:a.e,g:a.g,fuente:'usda'}):a;});
  f.alimentos.forEach(function(a){
    if(!a||!a.id)return;
    mapa[a.id]=Object.assign({},a,{fuente:'tuyo'});});
  return Object.keys(mapa).map(function(k){return mapa[k];});}
function alimById(id){
  if(!id)return null;
  const todos=alimTodos();
  for(let i=0;i<todos.length;i++)if(todos[i].id===id)return todos[i];
  return null;}
function alimBuscar(q,grupo){
  const t=alimTxt(q).trim();
  return alimTodos().filter(function(a){
    if(grupo&&a.g!==grupo)return false;
    if(!t)return true;
    return alimTxt(a.n+' '+(a.nota||'')+' '+(a.g||'')).indexOf(t)>=0;
  }).sort(function(a,b){
    /* lo que empieza por lo tecleado va primero: buscando "pl" quieres el plátano, no la "coliflor" */
    if(t){const ia=alimTxt(a.n).indexOf(t)===0?0:1,ib=alimTxt(b.n).indexOf(t)===0?0:1;if(ia!==ib)return ia-ib;}
    return String(a.n).localeCompare(String(b.n),'es');});}
const ALIM_MACROS=['kcal','pr','ch','az','fi','gr','sa'];
function alimPorcion(a,g){
  /* la tabla va por 100 g, así que todo se escala. kcal enteras, el resto al décimo: es como se lee
     una etiqueta y como se puede pesar en casa. */
  const q=Math.max(0,+g||0)/100,o={mi:{}};
  ALIM_MACROS.forEach(function(k){const v=(+a[k]||0)*q;
    o[k]=(k==='kcal')?Math.round(v):Math.round(v*10)/10;});
  ALIM_MICROS.forEach(function(k){
    if(typeof a[k]!=='number')return;
    const v=a[k]*q;
    o.mi[k]=Math.round(v*100)/100;});
  return o;}
function alimEntrada(a,g){
  /* de alimento a toma del día: los nombres de campo son los del registro (prot/carb/gresa...) */
  const p=alimPorcion(a,g);
  return {kcal:p.kcal,prot:p.pr,carb:p.ch,gresa:p.gr,azucar:p.az,fibra:p.fi,sal:p.sa,mi:p.mi};}
function alimFuenteTxt(a){
  if(!a)return '';
  if(a.fuente==='tuyo')return 'lo has puesto tú';
  if(a.fuente==='usda')return 'USDA FoodData Central';
  return 'tabla de la app · aproximado';}
function addAlimPropio(o){
  /* mismo listón que un producto: sin kcal ni proteína no se guarda a medias */
  const n=String((o&&o.n)||'').trim();
  if(!n)return {ok:false,msg:'ponle un nombre al alimento'};
  if(!(+o.kcal||+o.pr))return {ok:false,msg:'sin kcal ni proteína por 100 g no lo guardo: son el dato que luego se suma'};
  const f=food(),id=alimSlug(n);
  const a={id:id,n:n,e:String(o.e||'🍽').slice(0,4),g:String(o.g||'otro'),nota:String(o.nota||'').slice(0,40)};
  ALIM_MACROS.forEach(function(k){if(o[k]!=null&&o[k]!=='')a[k]=Math.round((+o[k]||0)*10)/10;});
  a.kcal=Math.round(+o.kcal||0);
  ALIM_MICROS.forEach(function(k){if(o[k]!=null&&o[k]!=='')a[k]=Math.round((+o[k]||0)*100)/100;});
  const i=f.alimentos.findIndex(function(x){return x.id===id;});
  if(i>=0)f.alimentos[i]=a;else f.alimentos.push(a);
  save();
  return {ok:true,id:id,msg:(i>=0?'actualizado: ':'guardado: ')+n+' · '+a.kcal+' kcal /100 g'};}
function delAlimPropio(id){
  const f=food(),i=f.alimentos.findIndex(function(x){return x.id===id;});
  if(i<0)return 'ese alimento no lo habías puesto tú: los de la tabla no se borran';
  const nm=f.alimentos[i].n;f.alimentos.splice(i,1);
  f.nevera=f.nevera.filter(function(x){return x!==id;});
  save();return 'quitado '+nm;}
/* Término en inglés con el que se busca cada alimento en USDA FoodData Central: buscar «Plátano»
   en una base americana no devuelve nada útil. Solo se usa si pones la clave en Ajustes. */
const ALIM_EN={
'al-manzana':'apple, raw','al-platano':'bananas, raw','al-naranja':'oranges, raw','al-mandarina':'tangerines, raw',
'al-fresa':'strawberries, raw','al-kiwi':'kiwifruit, raw','al-uva':'grapes, raw','al-pera':'pears, raw',
'al-melocoton':'peaches, raw','al-sandia':'watermelon, raw','al-melon':'melons, cantaloupe, raw','al-pina':'pineapple, raw',
'al-aguacate':'avocados, raw','al-arandano':'blueberries, raw','al-limon':'lemons, raw','al-ciruela':'plums, raw',
'al-brocoli':'broccoli, raw','al-espinaca':'spinach, raw','al-tomate':'tomatoes, red, ripe, raw','al-cebolla':'onions, raw',
'al-zanahoria':'carrots, raw','al-pimiento-rojo':'peppers, sweet, red, raw','al-calabacin':'squash, summer, zucchini, raw',
'al-berenjena':'eggplant, raw','al-patata':'potatoes, flesh and skin, raw','al-boniato':'sweet potato, raw, unprepared',
'al-lechuga':'lettuce, cos or romaine, raw','al-ajo':'garlic, raw','al-champinon':'mushrooms, white, raw',
'al-judia-verde':'beans, snap, green, raw','al-guisante':'peas, green, raw','al-pepino':'cucumber, with peel, raw',
'al-coliflor':'cauliflower, raw','al-esparrago':'asparagus, raw','al-puerro':'leeks, raw','al-calabaza':'pumpkin, raw',
'al-pimiento-verde':'peppers, sweet, green, raw',
'al-pechuga-de-pollo':'chicken, broilers or fryers, breast, meat only, raw',
'al-muslo-de-pollo':'chicken, broilers or fryers, thigh, meat only, raw',
'al-pechuga-de-pavo':'turkey, breast, meat only, raw','al-ternera-magra':'beef, round, top round, raw',
'al-lomo-de-cerdo':'pork, loin, raw','al-huevo':'egg, whole, raw, fresh','al-jamon-serrano':'ham, dry-cured',
'al-jamon-cocido':'ham, sliced, extra lean','al-chorizo':'sausage, chorizo, pork and beef',
'al-salmon':'fish, salmon, atlantic, raw','al-merluza':'fish, hake, raw','al-atun-en-lata-al-natural':'fish, tuna, light, canned in water',
'al-sardina':'fish, sardine, atlantic, raw','al-bacalao':'fish, cod, atlantic, raw','al-gamba':'crustaceans, shrimp, raw',
'al-boqueron':'fish, anchovy, european, raw',
'al-lenteja':'lentils, raw','al-lenteja-cocida':'lentils, cooked, boiled','al-garbanzo':'chickpeas, mature seeds, raw',
'al-garbanzo-de-bote':'chickpeas, canned, drained','al-alubia-blanca':'beans, white, mature seeds, raw','al-tofu':'tofu, raw, firm',
'al-arroz-blanco':'rice, white, long-grain, regular, raw','al-arroz-integral':'rice, brown, long-grain, raw',
'al-pasta':'pasta, dry, enriched','al-pan-integral':'bread, whole-wheat','al-pan-blanco':'bread, white',
'al-copos-de-avena':'oats, whole grain, rolled','al-quinoa':'quinoa, uncooked','al-harina-de-trigo':'wheat flour, white, all-purpose',
'al-leche-entera':'milk, whole, 3.25% milkfat','al-leche-desnatada':'milk, nonfat, fluid','al-yogur-natural':'yogurt, plain, whole milk',
'al-yogur-griego':'yogurt, greek, plain, whole milk','al-queso-fresco':'cheese, queso fresco','al-queso-curado':'cheese, cheddar',
'al-mantequilla':'butter, without salt',
'al-aceite-de-oliva':'oil, olive, salad or cooking','al-nuez':'nuts, walnuts, english','al-almendra':'nuts, almonds',
'al-cacahuete':'peanuts, all types, raw','al-semilla-de-chia':'seeds, chia seeds, dried','al-aceituna':'olives, ripe, canned',
'al-miel':'honey','al-chocolate-negro-70':'chocolate, dark, 70-85% cacao solids','al-tomate-triturado':'tomatoes, crushed, canned',
'al-leche-de-coco':'nuts, coconut milk, canned','al-caldo-de-pollo':'soup, chicken broth, canned, prepared',
'al-proteina-whey':'whey protein powder isolate'};
/* de número de nutriente de FoodData Central a nuestro campo. Todo lo que devuelve Foundation y
   SR Legacy viene ya por 100 g, que es como está nuestra tabla. */
const USDA_NUM={1008:'kcal',1003:'pr',1005:'ch',2000:'az',1079:'fi',1004:'gr',
  1089:'fe',1087:'ca',1092:'k',1090:'mg',1162:'vc',1114:'vd',1178:'b12',1175:'b6',1177:'fo'};
const USDA_SODIO=1093;
function usdaKey(){return String((store.usda||{}).key||'').trim();}
function usdaOn(){return usdaKey().length>=10;}
function mapUsdaFood(fd){
  /* de la ficha de FoodData Central a nuestro alimento. Si no trae ni kcal ni proteína no vale:
     mejor quedarse con el valor aproximado de la tabla que pisarlo con un hueco. */
  if(!fd||!Array.isArray(fd.foodNutrients))return null;
  const o={};
  fd.foodNutrients.forEach(function(n){
    const id=+(n.nutrientId!=null?n.nutrientId:(n.nutrient&&n.nutrient.id));
    const v=+(n.value!=null?n.value:n.amount);
    if(!isFinite(v))return;
    if(id===USDA_SODIO){o.sa=Math.round(v*2.5)/1000;return;}   /* sodio mg → sal g */
    const k=USDA_NUM[id];if(!k)return;
    o[k]=(k==='kcal')?Math.round(v):Math.round(v*100)/100;});
  if(!o.kcal&&!o.pr)return null;
  o.usdaDesc=String(fd.description||'').slice(0,80);
  o.usdaId=fd.fdcId||0;
  o.ts=Date.now();
  return o;}
function usdaBuscar(id){
  /* consulta un alimento concreto y guarda el resultado: a partir de ahí ya está corregido y no se
     vuelve a salir a la red por él. Lo único que sale del móvil es el nombre del alimento en inglés. */
  const a=alimById(id);
  if(!a)return Promise.resolve({ok:false,msg:'ese alimento no está'});
  if(a.fuente==='tuyo')return Promise.resolve({ok:false,msg:'este alimento lo has escrito tú: USDA no lo va a conocer'});
  if(!usdaOn())return Promise.resolve({ok:false,msg:'te falta la clave de FoodData Central: se pone en Ajustes'});
  if(typeof fetch!=='function')return Promise.resolve({ok:false,msg:'este navegador no sale a la red'});
  const q=ALIM_EN[id]||a.n;
  const url='https://api.nal.usda.gov/fdc/v1/foods/search?api_key='+encodeURIComponent(usdaKey())+
    '&query='+encodeURIComponent(q)+'&dataType=Foundation,SR%20Legacy&pageSize=1';
  return fetch(url)
    .then(function(r){
      if(r.status===403)throw new Error('la clave no vale o se ha pasado del límite diario');
      if(!r.ok)throw new Error('FoodData Central ha contestado '+r.status);
      return r.json();})
    .then(function(j){
      const fd=j&&j.foods&&j.foods[0];
      const o=mapUsdaFood(fd);
      if(!o)return {ok:false,msg:'FoodData Central no tiene datos completos de «'+q+'»: se queda el valor de la tabla'};
      const f=food();f.usda[id]=o;save();
      return {ok:true,o:o,msg:'corregido con USDA: '+(o.usdaDesc||q)};})
    .catch(function(e){return {ok:false,msg:'no he podido consultar ('+((e&&e.message)||'sin red')+')'};});}
function usdaProbar(){
  /* se prueba con el plátano: si la clave vale, vuelve con datos y el usuario lo ve al momento */
  if(!usdaOn()){flash('pega primero la clave: la que te llega por correo tiene unas 40 letras');return;}
  flash('probando la clave…');
  usdaBuscar('al-platano').then(function(r){
    render();
    flash(r.ok?('la clave funciona · '+r.msg):r.msg);});}
function usdaOlvidar(id){
  const f=food();if(!f.usda[id])return 'ese alimento no estaba corregido';
  delete f.usda[id];save();return 'vuelve al valor aproximado de la tabla';}
/* --- micronutrientes del día --- */
function microTotales(dateStr){
  const o={};
  foodLog(foodKey(dateStr)).forEach(function(x){
    const mi=x.mi;if(!mi)return;
    ALIM_MICROS.forEach(function(k){if(typeof mi[k]==='number')o[k]=(o[k]||0)+mi[k];});});
  ALIM_MICROS.forEach(function(k){if(o[k]!=null)o[k]=Math.round(o[k]*100)/100;});
  return o;}
function microPct(k,v){const r=+ALIM_VRN[k]||0;return r?Math.round((+v||0)/r*100):0;}
function microCortos(dateStr){
  /* «vas corto de» solo tiene sentido si has apuntado algo: con el día vacío todo está a cero y la
     app te diría que te falta de todo, que no es información */
  const t=microTotales(dateStr);
  if(!Object.keys(t).length)return [];
  return ALIM_MICROS.filter(function(k){return microPct(k,t[k]||0)<50;})
    .sort(function(a,b){return microPct(a,t[a]||0)-microPct(b,t[b]||0);});}
function alimRicosEn(k,n){
  /* los alimentos que más traen de ese micro por 100 g: es lo que se ofrece cuando vas corto */
  return alimTodos().filter(function(a){return typeof a[k]==='number'&&a[k]>0;})
    .sort(function(a,b){return b[k]-a[k];}).slice(0,n||6);}
/* --- mi nevera --- */
/* ===================== la despensa: lo que HAY y cuánto =====================
   «Mi nevera» era una lista de nombres: sabía que tenías lentejas, no cuántas. Y sin cantidad no
   se puede gastar, así que nunca se acababa nada y nunca volvía solo a la lista de la compra.
   Aquí va el inventario de verdad. La nevera de siempre se queda y se mantiene sola a partir de
   esto, para que «qué puedo cocinar» y las ideas sigan funcionando igual. */
function despensaS(){const f=food();if(!Array.isArray(f.despensa))f.despensa=[];return f.despensa;}
function despClave(nom){
  /* la clave para que «500 g lenteja pardina» y «lentejas pardinas» sean lo mismo */
  let t=alimTxt(String(nom||'')).replace(/^[\d.,\/\s]+/,'').trim();
  t=t.replace(/^(g|kg|ml|l|ud|uds|unidad(es)?|lata|latas|brick|briks|bote|botes|paquete|paquetes|rebanada|rebanadas|lonchas?|dientes?|piezas?)\b\s*/,'');
  t=t.replace(/\b(de|del|la|el|los|las|un|una)\b\s*/g,' ');
  t=t.replace(/s\b/g,'').replace(/\s+/g,' ').trim();   /* plural fuera, a lo bruto pero estable */
  return t;}
function despUnidad(uni,item){
  const u=String(uni||'').toLowerCase();
  if(/^(g|gr|gramos?)$/.test(u))return 'g';
  if(/^(kg|kilos?)$/.test(u))return 'kg';
  if(/^(ml|mililitros?)$/.test(u))return 'ml';
  if(/^(l|litros?)$/.test(u))return 'l';
  return '';}
function despensaAdd(texto,qOpt,uniOpt){
  /* entra algo en casa: si ya estaba, se suma */
  const l=despensaS(),p=parseIng(String(texto||''));
  const nom=(p.item||String(texto||'')).trim();
  const k=despClave(nom);
  if(!k)return '';
  let q=(qOpt!=null&&qOpt!=='')?(+qOpt||0):(p.num!=null?p.num:0);
  let uni=uniOpt!=null?despUnidad(uniOpt):despUnidad(p.unit);
  if(uni==='kg'){q=q*1000;uni='g';}
  if(uni==='l'){q=q*1000;uni='ml';}
  const hay=l.filter(function(x){return x.k===k;})[0];
  if(hay){
    if(uni&&hay.uni&&uni!==hay.uni)hay.q=Math.max(hay.q,q);   /* unidades distintas: no se suman peras con litros */
    else {hay.q=(+hay.q||0)+q;if(uni)hay.uni=uni;}
    hay.q0=Math.max(+hay.q0||0,hay.q);
    hay.ts=Date.now();}
  else l.push({k:k,nom:nom,q:q,q0:q,uni:uni,ts:Date.now(),sec:seccionDeCompra(nom)});
  neveraSync();
  return k;}
function pasoDeGasto(x){
  /* un toque de «gastar» es un cuarto de LO QUE COMPRASTE, no de lo que queda. Con el 25 % de lo
     que queda no se acababa nunca: 600 g tras veinte toques seguían siendo 4 g. */
  const q0=Math.max(+x.q0||0,+x.q||0);
  if(!q0)return 0;
  return Math.max(x.uni?1:0.25,Math.round(q0/4*100)/100);}
function despensaGasta(texto,qOpt){
  /* se usa algo: se descuenta, y cuando llega a cero deja de estar y vuelve a hacer falta */
  const l=despensaS(),p=parseIng(String(texto||''));
  const k=despClave(p.item||texto);
  const hay=l.filter(function(x){return x.k===k;})[0];
  if(!hay)return '';
  const q=(qOpt!=null&&qOpt!=='')?(+qOpt||0):(p.num!=null?p.num:0);
  if(!q||!hay.q){                       /* sin cantidad conocida, gastar es acabarlo */
    despensaQuitar(k);return 'acabado';}
  hay.q=Math.round((hay.q-q)*100)/100;
  /* si lo que queda no da ni para otro toque, es que se ha acabado: si no, se quedaban migajas
     eternas en la despensa y la compra nunca volvía a pedirlo */
  if(hay.q<=0||hay.q<pasoDeGasto(hay)*0.5){despensaQuitar(k);return 'acabado';}
  neveraSync();
  return 'queda '+fmt(hay.q)+(hay.uni?(' '+hay.uni):'');}
function despensaQuitar(k){
  const f=food();
  f.despensa=despensaS().filter(function(x){return x.k!==k;});
  neveraSync();
  return 'fuera de la despensa';}
function despensaVaciar(){const f=food();const n=despensaS().length;f.despensa=[];neveraSync();
  return n?('despensa vacía: '+n+' cosa(s) fuera'):'ya estaba vacía';}
function neveraSync(){
  /* la nevera de siempre —la lista de ids de la tabla de alimentos— se calcula a partir de la
     despensa, para que «qué puedo cocinar» y las ideas sigan funcionando sin tocarlas */
  const f=food(),l=despensaS(),ids={};
  l.forEach(function(x){
    const cual=alimTxt(x.nom).trim();if(!cual)return;
    const hit=alimTodos().filter(function(a){
      const an=alimTxt(a.n);return an===cual||cual.indexOf(an)>=0||an.indexOf(cual)>=0;})
      .sort(function(a,b){return a.n.length-b.n.length;})[0];
    if(hit)ids[hit.id]=1;});
  /* lo que pusiste tú a mano en la nevera y no está en la despensa se respeta */
  (f.neveraMano||[]).forEach(function(id){ids[id]=1;});
  f.nevera=Object.keys(ids);
  save();}
function hacerCompra(soloMarcados){
  /* «He hecho esta compra»: lo que has echado al carro entra en casa. Es el gesto que une la lista
     con la nevera, y sin él la nevera había que rellenarla a mano una por una. */
  const d=compraDatos();let n=0,nm=0;
  d.grupos.forEach(function(g){
    g[2].forEach(function(x){
      const marcado=ui.marks.has(x.id);
      if(soloMarcados&&!marcado)return;
      if(marcado)nm++;
      if(despensaAdd(x.texto))n++;});});
  if(!n)return 'no había nada que meter en casa';
  /* lo comprado deja de estar marcado: la lista se queda limpia para la próxima */
  d.grupos.forEach(function(g){g[2].forEach(function(x){ui.marks.delete(x.id);});});
  const f=food();f.ultimaCompra=iso(new Date());
  save();render();
  return n+' cosa'+(n===1?'':'s')+' a la despensa'+(soloMarcados?(' (las '+nm+' que marcaste)'):'')+
    '. La lista queda limpia.';}
function listaAMano(texto){
  /* una lista escrita o pegada: cada línea, una cosa. Va a una lista tuya, no al menú, porque
     esto es «lo que quiero comprar» y no «lo que toca cocinar». */
  const lineas=String(texto||'').split(/[\n;]+/).map(function(x){return x.trim();})
    .filter(function(x){return x&&x.length<80;});
  if(!lineas.length)return 'no he leído nada: una cosa por línea';
  let l=listasS().filter(function(x){return x.nombre==='A mano';})[0];
  if(!l){addLista('A mano');l=listasS().filter(function(x){return x.nombre==='A mano';})[0];}
  if(!l)return 'no he podido crear la lista';
  let n=0;
  lineas.forEach(function(t){if(addItemLista(l.id,t))n++;});
  l.fija=true;   /* entra sola en la compra de la semana */
  /* «De rutina» arranca plegado, así que lo pegado entraba en la lista sin que se viera nada y
     parecía que el botón no hacía nada. Se abre para que lo veas llegar. */
  if(ui.compraCerradas)ui.compraCerradas.delete('rutina');
  save();render();
  return n+' cosa'+(n===1?'':'s')+' a tu lista «A mano», que ya entra en la compra';}
/* ===================== el ticket de la compra =====================
   Fase 3. La foto la lee Claude, pero Claude SOLO existe dentro del Artifact de claude.ai: en el
   móvil, que es donde de verdad se hace la compra, window.claude no está. Así que el camino de
   todos los días es el de aquí: pegar el ticket —el electrónico de Mercadona es texto— y que lo
   entienda la app, sin conexión y sin que nada salga del teléfono. */
/* lo que NO es un artículo: cabecera de la tienda, datos fiscales y forma de pago. Va por
   PRINCIPIO de línea, no por línea entera: «MERCADONA, S.A.» y «NIF: A-46103834» llevan cola. */
const TICKET_FUERA=/^\s*(mercadona|carrefour|lidl|aldi|dia\b|alcampo|eroski|consum|s\.?a\.?\b|s\.?l\.?\b|c\/|avda|avenida|calle|plaza|pol[íi]gono|\d{5}\s|tel[ée]fono|tel[:.]|nif|cif|factura|descripci[óo]n|p\.? ?unit|importe|total|entrega|tarjeta|efectivo|contactless|cambio|iva\b|base imponible|cuota|gracias|su compra|op[:.]|aut[:.]|fecha|hora|caja|ticket|n\.? ?factura|simplificada|www\.|https?:|[-=*_]{3,})/i;
const TICKET_FIN=/^total\b|^total ?\(/i;
function ticketNum(x){const n=parseFloat(String(x||'').replace(/\./g,'').replace(',','.'));return isNaN(n)?null:n;}
function ticketLinea(raw){
  /* una línea de ticket: cantidad, nombre y uno o dos importes al final. Los formatos que se ven
     de verdad en un Mercadona:
       «1 ACEITE OLIVA SUAVE            5,95»      → unidad suelta
       «2 LECHE SEMIDESNATADA   0,89    1,78»      → varias, con precio unitario
       «0,894 kg TOMATE RAMA    2,19    1,96»      → a peso
     y lo mismo de cualquier otro súper, que es la misma forma. */
  const t=String(raw||'').replace(/\s+/g,' ').trim();
  if(!t||t.length>90)return null;
  if(TICKET_FUERA.test(t))return null;
  /* a peso: la cantidad lleva unidad pegada */
  let m=t.match(/^([\d.,]+)\s*(kg|g|l|ml)\s+(.+?)(?:\s+([\d.,]+))?\s+([\d.,]+)$/i);
  if(m){const q=ticketNum(m[1]);
    if(q==null||!m[3].trim())return null;
    return {q:q,uni:m[2].toLowerCase(),nom:ticketNombre(m[3]),eur:ticketNum(m[5])};}
  /* por unidades: número al principio, importes al final */
  m=t.match(/^(\d+)\s+(.+?)(?:\s+([\d.,]+))?\s+([\d.,]+)$/);
  if(m){const q=+m[1],nom=ticketNombre(m[2]);
    if(!nom||!/[a-záéíóúñ]/i.test(nom))return null;
    return {q:q,uni:'',nom:nom,eur:ticketNum(m[4])};}
  return null;}
function ticketNombre(x){
  /* los tickets vienen en mayúsculas y con abreviaturas del súper. Se pasa a algo que la app sepa
     clasificar por pasillos y buscar en la tabla de alimentos. */
  let n=String(x||'').trim().toLowerCase();
  n=n.replace(/\b(bolsa pl[aá]stico|bolsa de pl[aá]stico|bolsa)\b/g,'bolsa');
  n=n.replace(/\bsemi\b/g,'semidesnatada').replace(/\bdesn\b/g,'desnatada')
     .replace(/\bnat\b/g,'natural').replace(/\bcong\b/g,'congelado')
     .replace(/\bac\.? ?oliva\b/g,'aceite de oliva').replace(/\bac\b/g,'aceite')
     .replace(/\bp\.? ?pollo\b/g,'pechuga de pollo').replace(/\byog\b/g,'yogur')
     .replace(/\bfrut\b/g,'fruta').replace(/\bverd\b/g,'verdura');
  n=n.replace(/\s+/g,' ').trim();
  return n.slice(0,60);}
function ticketLeer(texto){
  /* devuelve lo que ha entendido Y lo que no: una línea que no se entiende se enseña, no se tira
     en silencio. Así se ve de un vistazo si el ticket ha entrado entero. */
  const lineas=String(texto||'').split(/\n+/);
  const items=[],sueltas=[];let total=null,fin=false;
  lineas.forEach(function(l){
    const t=l.replace(/\s+/g,' ').trim();
    if(!t)return;
    if(TICKET_FIN.test(t)){
      const m=t.match(/([\d.,]+)\s*€?$/);
      if(m&&total==null)total=ticketNum(m[1]);
      fin=true;return;}
    if(fin)return;                       /* lo de después del total es forma de pago y datos fiscales */
    const it=ticketLinea(t);
    if(it)items.push(it);
    else if(!TICKET_FUERA.test(t)&&/[a-záéíóúñ]{3}/i.test(t)&&t.length<90)sueltas.push(t);});
  return {items:items,sueltas:sueltas,total:total};}
function ticketAplicar(items){
  /* el ticket entra en casa: cada línea a la despensa con su cantidad, y la fecha de la compra
     queda puesta, que es lo que apaga el aviso de «toca hacer la compra» */
  let n=0;
  (items||[]).forEach(function(x){
    /* la cantidad va COMO NÚMERO, no metida en el texto: al pasarla por fmt() para escribirla,
       «0,894 kg» de tomate se quedaba en 0,89 kg y entraban 890 g en vez de 894. */
    if(despensaAdd(x.nom,x.q,x.uni))n++;});
  if(!n)return 'no he metido nada: revisa las líneas';
  const f=food();f.ultimaCompra=iso(new Date());
  save();
  return n+' cosa'+(n===1?'':'s')+' del ticket a la despensa';}
function ticketPrompt(){
  return 'Te paso la foto de un ticket de la compra de un supermercado español. Sácame lo que se '+
    'compró.\n\n'+
    'Responde SOLO con un objeto JSON con esta forma exacta:\n'+
    '{"items":[{"q":1,"uni":"","nom":"","eur":0}],"total":0}\n\n'+
    '- q: cuántas unidades, o el peso si va a peso.\n'+
    '- uni: "" si son unidades sueltas, o "kg", "g", "l", "ml" si va a peso o volumen.\n'+
    '- nom: el nombre del producto en minúsculas y en español normal, desarrollando las '+
    'abreviaturas del ticket ("LECHE SEMI" → "leche semidesnatada", "P. POLLO" → "pechuga de pollo").\n'+
    '- eur: lo que costó esa línea, en euros.\n'+
    '- total: el total del ticket.\n\n'+
    'No inventes líneas que no se lean. Si la foto no es un ticket, responde {"error":"no es un ticket"}.';}
function ticketSano(data){
  /* lo que venga de fuera se valida aquí: ni se guarda ni se pinta nada sin pasar por esto */
  if(!data||typeof data!=='object'||!Array.isArray(data.items))return null;
  const items=data.items.map(function(x){
    if(!x||typeof x!=='object')return null;
    const nom=ticketNombre(String(x.nom||''));
    if(!nom||!/[a-záéíóúñ]/i.test(nom))return null;
    const q=Math.max(0,Math.min(10000,+x.q||0));
    const uni=(['g','kg','ml','l',''].indexOf(String(x.uni||''))>=0)?String(x.uni||''):'';
    const eur=Math.max(0,Math.min(100000,+x.eur||0));
    return {q:q,uni:uni,nom:nom,eur:eur};}).filter(Boolean).slice(0,200);
  if(!items.length)return null;
  const total=(+data.total>0&&+data.total<100000)?+data.total:null;
  return {items:items,sueltas:[],total:total};}
function ticketConClaude(){
  const t=ui.ticket||(ui.ticket={txt:'',leido:null,msg:''});
  if(!_sampleFn){t.msg='Claude no está disponible en esta ventana.';render();return;}
  const imgs=t.imagenes||null;
  if(!imgs||!imgs.length){t.msg='Elige antes la foto del ticket.';render();return;}
  t.estado='pensando';t.msg='';render();
  _sampleFn.json(ticketPrompt(),{modelTier:'default',images:imgs}).then(function(data){
    t.estado='';
    if(data&&data.error){t.msg='Claude no ha visto un ticket en esa foto.';render();return;}
    const l=ticketSano(data);
    if(!l){t.msg='La respuesta no traía una lista reconocible. Prueba con otra foto.';render();return;}
    t.leido=l;t.msg='';render();
    flash('Ticket leído por Claude: '+l.items.length+' línea(s)');
  }).catch(function(e){
    const code=(e&&e.code)||'upstream_error';
    t.estado='';
    if(code==='cancelled'){render();return;}
    t.msg=IMP_ERRORES[code]||('No ha salido («'+code+'»). Pega el texto del ticket aquí arriba.');
    if(code==='not_granted'||code==='sampling_disabled'||code==='not_declared'||code==='capability_disabled')_sampleEstado='no';
    render();});}
function compraCada(){
  /* cada cuántos días toca ir. Por defecto 4: dos veces por semana, que es como dijo que la hace.
     Se cambia desde la propia pantalla de la compra. */
  const v=+food().compraCada;
  return (v>=1&&v<=14)?v:4;}
function tocaComprar(){
  /* LA COMPRA ES UNA TAREA DE LA SEMANA, no un sitio al que entrar por si acaso. Sale en «Hoy»
     como sale entrenar. En el calendario de Google NO entra: eso lo dijo él. */
  const d=diasDesdeCompra();
  if(d==null)return {toca:true,dias:null,faltan:0,primera:true};
  const c=compraCada();
  return {toca:d>=c,dias:d,faltan:Math.max(0,c-d),primera:false};}
function compraTocaHTML(){
  const t=tocaComprar();
  if(!t.toca)return '';
  const d=compraDatos();
  const pend=d.total;
  if(!pend)return '';
  const sup=compraCuenta(d,'super').total,fru=compraCuenta(d,'fruteria').total;
  /* una tira, no una tarjeta con título: «Hoy» ya tiene siete bloques y cada uno que se añade se
     come pantalla. Todo lo que hace falta saber cabe en un renglón y dos botones. */
  return '<div class="card tcompra">'+
    '<div class="tcab"><b>🛒 Toca hacer la compra</b>'+
      '<span class="mini">'+(t.primera?'la primera':('hace '+t.dias+' d'))+'</span></div>'+
    '<p class="mini">Quedan <b>'+pend+'</b> por coger'+
      ((sup&&fru)?(': '+sup+' en el súper y '+fru+' en la frutería'):'')+
      (t.primera?'':' · la haces cada '+compraCada()+' días')+'.</p>'+
    '<div class="row">'+
      '<button class="btn p" data-a="tab" data-t="shop">abrir la lista</button>'+
      (fru?'<button class="btn s" data-a="ir-fruteria">solo la frutería</button>':'')+
      '</div></div>';}
function diasDesdeCompra(){
  const f=food(),u=f.ultimaCompra;
  if(!u)return null;
  const d=parseDate(u);if(!d)return null;
  return Math.max(0,Math.floor((Date.now()-d.getTime())/86400000));}
/* la frutería: la verdura y la fruta se compran en otro sitio y en otro momento */
function salidaDe(sec){return sec==='verdura'?'fruteria':'super';}
const SALIDAS=[['todo','Todo'],['super','Súper'],['fruteria','Frutería']];
function neveraIds(){return food().nevera.slice();}
function neveraAlimentos(){return neveraIds().map(alimById).filter(Boolean);}
function neveraToggle(id){
  /* lo que marcas a mano vive aparte: neveraSync() recalcula la nevera desde la despensa y si esto
     escribiera en f.nevera directamente se borraría al primer recálculo */
  const f=food();
  if(!Array.isArray(f.neveraMano))f.neveraMano=[];
  const i=f.neveraMano.indexOf(id),estaba=f.nevera.indexOf(id)>=0;
  if(i>=0)f.neveraMano.splice(i,1);
  else if(!estaba)f.neveraMano.push(id);
  else{/* está por la despensa: quitarlo de la nevera es sacarlo de la despensa */
    const x=despensaS().filter(function(y){
      const cual=alimTxt(y.nom).trim(),a2=alimById(id);
      return a2&&(cual.indexOf(alimTxt(a2.n))>=0||alimTxt(a2.n).indexOf(cual)>=0);})[0];
    if(x)despensaQuitar(x.k);}
  neveraSync();
  const a=alimById(id);
  return ((i>=0||estaba)?'fuera de la nevera: ':'a la nevera: ')+((a&&a.n)||id);}
function neveraVaciar(){const f=food();const n=f.nevera.length;
  f.neveraMano=[];f.despensa=[];f.nevera=[];save();
  return n?('vaciada: '+n+' cosa(s) fuera'):'la nevera ya estaba vacía';}
function neveraDesdeCompra(){
  /* lo que hay en tus listas de la compra, pasado a la nevera: lo normal es que si lo compras, lo
     tengas. Solo entra lo que la tabla sabe reconocer por nombre. */
  const nombres=[];
  (store.listas||[]).forEach(function(L){(L.items||[]).forEach(function(it){
    nombres.push(String(it&&it.txt!=null?it.txt:it));});});
  const f=food();let n=0;
  nombres.forEach(function(txt){
    const p=parseIng(txt),cual=alimTxt(p.item||txt).trim();
    if(!cual)return;
    const hit=alimTodos().filter(function(a){
      const an=alimTxt(a.n);return an===cual||cual.indexOf(an)>=0||an.indexOf(cual)>=0;})
      .sort(function(a,b){return a.n.length-b.n.length;})[0];
    if(hit&&f.nevera.indexOf(hit.id)<0){f.nevera.push(hit.id);n++;}});
  save();
  return n?(n+' cosa(s) de tu compra puestas en la nevera'):
    (nombres.length?'no he reconocido nada de tu compra en la tabla de alimentos':'no tienes nada en las listas de la compra');}
function foodKey(dateStr){const d=parseDate(dateStr);return d?iso(d):'';}
function foodLog(dateStr){const f=food(),k=foodKey(dateStr);
  if(!k)return [];
  if(!f.log[k]||!Array.isArray(f.log[k]))f.log[k]=[];return f.log[k];}
function posDeSlot(label,time){
  /* a qué "momento" (desayuno/comida/cena...) corresponde una comida ya montada en el menú,
     para registrarla de un toque sin tener que preguntarle al usuario cada vez */
  const t=String(label||'').toLowerCase();
  if(/desayuno/.test(t))return 'desayuno';
  if(/post.?.?entreno|pre.?.?entreno/.test(t))return 'post-entreno';
  if(/cena/.test(t))return 'cena';
  if(/merienda/.test(t))return 'merienda';
  if(/media ma[ñn]ana|snack/.test(t))return 'media';
  if(/comida/.test(t))return 'comida';
  const h=+String(time||'').split(':')[0];
  if(!isNaN(h)){if(h<10)return 'desayuno';if(h<12)return 'media';if(h<16)return 'comida';if(h<19)return 'merienda';return 'cena';}
  return 'comida';}
function addFoodEntry(dateStr,opt){
  opt=opt||{};
  const k=foodKey(dateStr);if(!k)return 'ese día no tiene pinta de fecha (falta el calendario o la rotación por fecha)';
  const f=food(),list=foodLog(k);
  if(opt.ean){
    const p=f.eans[opt.ean];if(!p)return 'ese código no está en tus productos: escanéalo o búscalo primero';
    const g=Math.max(1,+opt.grams||100),pc=porcionDe(p,g);
    list.push({id:uid('fe'),when:opt.when||'',p:opt.pos||'comida',nombre:p.nombre,marca:p.marca,ean:p.ean,g:g,
      kcal:pc.kcal,prot:pc.prot,carb:pc.carb,gresa:pc.gresa,azucar:pc.azucar,fibra:pc.fibra,sal:pc.sal,ts:Date.now()});
    save();return 'añadido: '+p.nombre+' · '+g+' g · '+pc.kcal+' kcal · '+pc.prot+' g prot';}
  if(opt.alim){
    const a=alimById(opt.alim);if(!a)return 'ese alimento ya no está en la tabla';
    const g=Math.max(1,+opt.grams||100),pc=alimEntrada(a,g);
    list.push(Object.assign({id:uid('fe'),when:opt.when||'',p:opt.pos||'comida',nombre:a.n,marca:a.nota||'',
      alim:a.id,emoji:a.e||'',g:g,ts:Date.now()},pc));
    save();return 'añadido: '+a.n+' · '+g+' g · '+pc.kcal+' kcal · '+pc.prot+' g prot';}
  if(opt.dishId){
    const d=dishById(opt.dishId);if(!d)return 'ese plato ya no está en el catálogo';
    const rac=Math.max(0.1,Math.round((+opt.rac||1)*4)/4);
    list.push({id:uid('fe'),when:opt.when||'',p:opt.pos||'comida',nombre:d.name,dishId:d.id,rac:rac,
      kcal:Math.round((+d.kcal||0)*rac),prot:Math.round((+d.prot||0)*rac*10)/10,ts:Date.now()});
    save();return 'añadido: '+d.name+' · '+rac+' ración(es) · '+Math.round((+d.kcal||0)*rac)+' kcal';}
  return 'dime qué: un código guardado o un plato del catálogo';}
function delFoodEntry(dateStr,id){const list=foodLog(foodKey(dateStr));
  const i=list.findIndex(function(x){return x.id===id;});if(i<0)return 'esa toma ya no estaba';
  const nm=list[i].nombre;list.splice(i,1);save();return 'quitado '+nm;}
function bumpFoodEntry(dateStr,id,delta){
  const e=foodLog(foodKey(dateStr)).filter(function(x){return x.id===id;})[0];
  if(!e)return 'no encuentro esa toma';
  if(e.alim){const a=alimById(e.alim);const g=Math.max(5,(+e.g||0)+(+delta||0));
    if(a){const pc=alimEntrada(a,g);e.g=g;Object.keys(pc).forEach(function(k){e[k]=pc[k];});}}
  else if(e.ean){const p=food().eans[e.ean]||e;const g=Math.max(5,(+e.g||0)+(+delta||0));
    const pc=porcionDe(p,g);e.g=g;Object.keys(pc).forEach(function(k){e[k]=pc[k];});}
  else{const d=dishById(e.dishId)||e;const rac=Math.max(0.25,Math.round(((+e.rac||1)+(+delta||0))*4)/4);
    e.rac=rac;e.kcal=Math.round((+d.kcal||0)*rac);e.prot=Math.round((+d.prot||0)*rac*10)/10;}
  save();return 'rectificado: '+e.nombre;}
function foodTotals(dateStr){
  const o={kcal:0,prot:0,carb:0,gresa:0,azucar:0,fibra:0,sal:0};
  foodLog(foodKey(dateStr)).forEach(function(x){Object.keys(o).forEach(function(k){o[k]+=+x[k]||0;});});
  Object.keys(o).forEach(function(k){o[k]=Math.round(o[k]*10)/10;});return o;}
function planTotalsOf(dateStr){
  /* lo que ya está montado en los menús de ese día: el plan contra lo que registras */
  const inf=dayInfo(dateStr);if(!inf.shiftId)return {kcal:0,prot:0,parts:0,shiftId:null};
  const items=[];slotsFor(inf.shiftId).forEach(function(sl){items.push.apply(items,slotItems(inf.shiftId,sl).items);});
  const t=totals(items);t.shiftId=inf.shiftId;return t;}
function sugerirObjetivo(){
  /* la media de lo que sale en tus días: punto de partida, no dogma (esto no es una dieta pautada) */
  let k=0,p=0,n=0;
  (store.shifts||[]).forEach(function(sh){const t=dayTotals(sh.id);if(t.kcal>0){k+=t.kcal;p+=t.prot;n++;}});
  if(!n)return 'no hay ningún menú con platos: no puedo promediar nada';
  const f=food();f.objetivo.kcal=Math.round(k/n/10)*10;f.objetivo.prot=Math.round(p/n/2)*2;
  save();render();
  return 'objetivo: '+f.objetivo.kcal+' kcal y '+f.objetivo.prot+' g de proteína (media de tus '+n+' tipos de día)';}
function offUrl(qs){return 'https://world.openfoodfacts.org/'+qs;}
function buscarEan(code){
  const c=String(code||'').replace(/\D/g,'');
  if(c.length<8)return Promise.resolve({ok:false,msg:'un código de barras suele tener 13 dígitos (has puesto '+c.length+')'});
  if(typeof fetch!=='function')return Promise.resolve({ok:false,msg:'este navegador no sale a la red: apunta las kcal del paquete a mano'});
  return fetch(offUrl('api/v2/product/'+c+'.json?fields=code,product_name,brands,quantity,nutriments'))
    .then(function(r){if(!r.ok)throw new Error('no está en la base ('+r.status+')');return r.json();})
    .then(function(j){const out=mapOffProduct(j&&j.product);
      if(!out)return {ok:false,msg:'no encuentro el '+c+' con datos de nutrición: prueba a buscarlo por nombre'};
      return {ok:true,p:out};})
    .catch(function(e){return {ok:false,msg:'no he podido consultar ('+((e&&e.message)||'sin red')+')'};});}
function buscarOffNombre(txt,marca){
  /* búsqueda por nombre en Open Food Facts; con "marca" (p. ej. "mercadona") se filtra a esa marca
     -sus propias etiquetas Hacendado, Deliplus, etc. van con el nombre "Mercadona" en Open Food Facts-,
     para que se sienta como buscar en el catálogo de esa cadena aunque por debajo siga siendo OFF */
  const t=String(txt||'').trim();
  if(t.length<3)return Promise.resolve({ok:false,msg:'escribe al menos 3 letras del producto'});
  if(typeof fetch!=='function')return Promise.resolve({ok:false,msg:'este navegador no sale a la red'});
  const filtroMarca=marca?('&tagtype_0=brands&tag_contains_0=contains&tag_0='+encodeURIComponent(marca)):'';
  const url=offUrl('cgi/search.pl?search_terms='+encodeURIComponent(t)+
    '&search_simple=1&action=process&json=1&page_size=16&fields=code,product_name,brands,quantity,nutriments'+filtroMarca);
  return fetch(url).then(function(r){return r.json();})
    .then(function(j){const list=((j&&j.products)||[]).map(mapOffProduct).filter(Boolean).slice(0,10);
      return {ok:list.length>0,list:list,
        msg:list.length?(list.length+' producto(s) para «'+t+'»'+(marca?' en '+marca:'')):
          'nada por ahí con «'+t+'»'+(marca?' en '+marca+(': prueba a quitar el filtro de marca o'):':')+' prueba con el código de barras'};})
    .catch(function(e){return {ok:false,msg:'no he podido consultar: '+((e&&e.message)||'sin red')};});}
const SCAN_TIMEOUT_MS=30000;
function camErrMsg(e){
  /* los mensajes de DOMException de la cámara son en inglés y varían por navegador: los traducimos
     a algo que explique qué hacer, no solo que "algo falló" */
  const n=(e&&e.name)||'';
  if(n==='NotAllowedError'||n==='SecurityError')return 'permiso de cámara denegado';
  if(n==='NotFoundError'||n==='OverconstrainedError')return 'no encuentro ninguna cámara en este dispositivo';
  if(n==='NotReadableError'||n==='AbortError')return 'la cámara la está usando otra app ahora mismo';
  return (e&&e.message)||'sin más detalle';}
function iniciarEscaner(){
  /* la cámara del móvil con el detector de códigos que trae Chrome; si no hay, se escribe el número */
  if(ui.scanStream)pararEscaner();
  const v=document.getElementById('scanV');
  if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia))
    return Promise.resolve('la cámara necesita https y permiso: escribe el código abajo, el resultado es el mismo');
  return navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}}).then(function(stream){
    ui.scanStream=stream;if(v){v.srcObject=stream;if(v.play)v.play();}
    const caja=document.getElementById('scanBox');if(caja)caja.classList.add('on');
    if('BarcodeDetector' in window){
      const det=new window.BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128']});
      const tick=function(){if(!ui.scanStream)return;
        det.detect(v).then(function(res){
          if(res&&res.length&&res[0].rawValue){const inp=document.getElementById('scanEan');
            if(inp)inp.value=res[0].rawValue;pararEscaner();buscarYmostrar(res[0].rawValue);}
        }).catch(function(){});
        ui.scanRaf=requestAnimationFrame(tick);};
      tick();
      /* si en 30 s no se ha pillado ningún código, se para sola y se avisa: mejor que dejar la
         cámara encendida indefinidamente sin decir nada mientras el usuario espera */
      ui.scanTimeout=setTimeout(function(){
        if(!ui.scanStream)return;   /* ya se paró sola: encontrado, cambio de pestaña o segundo plano */
        pararEscaner();
        const msg='30 s sin pillar ningún código: prueba a acercarlo más, con mejor luz, o escribe el número debajo';
        ui.scanMsg=msg;const out=document.getElementById('scanOut');if(out)out.textContent=msg;flash(msg);
      },SCAN_TIMEOUT_MS);
      return 'cámara abierta: acerca el código del paquete: se pilla solo';
    }
      return 'este navegador no lee códigos con la cámara: escribe el número debajo (hace lo mismo)';
  }).catch(function(e){return 'no he podido abrir la cámara ('+camErrMsg(e)+'): usa el buscador de abajo';});}
function pararEscaner(){
  if(ui.scanRaf)cancelAnimationFrame(ui.scanRaf);ui.scanRaf=null;
  if(ui.scanTimeout)clearTimeout(ui.scanTimeout);ui.scanTimeout=null;
  if(ui.scanStream){ui.scanStream.getTracks().forEach(function(t){t.stop();});ui.scanStream=null;}
  const caja=document.getElementById('scanBox');if(caja)caja.classList.remove('on');}
function buscarYmostrar(code){
  const out=document.getElementById('scanOut');
  if(out)out.textContent='buscando '+code+'…';
  return buscarEan(code).then(function(r){
    if(!r.ok){if(out)out.textContent=r.msg;flash(r.msg);return r;}
    const res=addEanProduct(r.p);
    if(out)out.textContent=res.msg;
    flash(res.msg);render();return r;});}

/* ===================== calendario: piezas compartidas entre Hoy/Semana/Mes =====================
   Reformulación del informe "Reformular Mes, Semana y Hoy": antes cada pantalla resolvía "qué día
   es hoy" y "qué pasa este día" a su manera (Hoy con new Date() fijo, Mes con un modal aparte,
   Semana con su propio maquetado de comidas) — estas funciones son la base común que reutilizan
   las tres, para que marcar "hoy" y ver el detalle de un día se vea y se calcule igual en todas. */
/* ===================== el sol: orto, ocaso y dónde estoy =====================
   Todo se calcula aquí, en el móvil, con la ecuación del orto/ocaso (la de NOAA) a partir de la
   latitud, la longitud y la fecha. Ni red, ni API, ni clave: de guardia sin cobertura sigue dando
   la hora, y no sale del teléfono ni dónde estás. Precisión de unos minutos, y la app lo dice. */
const SOL_RAD=Math.PI/180;
const SITIOS_FIJOS=[
  {id:'lpa',nombre:'Las Palmas de Gran Canaria',lat:28.1235,lon:-15.4363,tz:'Atlantic/Canary'},
  {id:'mad',nombre:'Madrid',lat:40.4168,lon:-3.7038,tz:'Europe/Madrid'}];
let _sitiosCache=null,_sitioCache=null;
function olvidaSitios(){_sitiosCache=null;_sitioCache=null;}
function sitiosS(){
  /* los dos de fábrica más los que añadas tú, que se guardan igual que el resto de tus datos.
     Memorizado porque solDe() lo llamaba en cada día de la semana: eran 28 arrays de usar y tirar
     por pintado. Se olvida al tocar la lista o al cargar otro almacén. */
  if(!Array.isArray(store.sitios))store.sitios=[];
  if(!_sitiosCache)_sitiosCache=SITIOS_FIJOS.concat(store.sitios);
  return _sitiosCache;}
function sitioActual(){
  if(_sitioCache)return _sitioCache;
  const id=(store.sitio||'')||SITIOS_FIJOS[0].id;
  _sitioCache=sitiosS().filter(function(s){return s.id===id;})[0]||SITIOS_FIJOS[0];
  return _sitioCache;}
function setSitio(id){
  if(!sitiosS().some(function(s){return s.id===id;}))return 'ese sitio ya no está';
  store.sitio=id;olvidaSitios();save();render();
  return 'ahora el sol se calcula para '+sitioActual().nombre;}
function addSitio(nombre,lat,lon){
  const n=String(nombre||'').trim().slice(0,48);
  const la=+lat,lo=+lon;
  if(!n)return {ok:false,msg:'ponle nombre al sitio'};
  if(!isFinite(la)||la<-90||la>90)return {ok:false,msg:'la latitud va de -90 a 90 (Las Palmas es 28.12)'};
  if(!isFinite(lo)||lo<-180||lo>180)return {ok:false,msg:'la longitud va de -180 a 180 (Las Palmas es -15.44)'};
  if(!Array.isArray(store.sitios))store.sitios=[];
  const id=uid('st');
  store.sitios.push({id:id,nombre:n,lat:Math.round(la*1e4)/1e4,lon:Math.round(lo*1e4)/1e4,tz:''});
  store.sitio=id;olvidaSitios();save();
  return {ok:true,id:id,msg:'guardado: '+n};}
function delSitio(id){
  if(SITIOS_FIJOS.some(function(s){return s.id===id;}))return 'Las Palmas y Madrid vienen con la app: esos no se quitan';
  if(!Array.isArray(store.sitios))store.sitios=[];
  const i=store.sitios.findIndex(function(s){return s.id===id;});
  if(i<0)return 'ese sitio ya no estaba';
  const nm=store.sitios[i].nombre;store.sitios.splice(i,1);
  if(store.sitio===id)store.sitio=SITIOS_FIJOS[0].id;
  olvidaSitios();save();return 'quitado '+nm;}
let _solCache={},_solTick=-1;
function solDe(fecha,sitio){
  /* Memoria por pintado: renderWeek pedía el sol dos veces por día (una para la franja y otra para
     las horas de debajo), 14 llamadas de las que 7 eran idénticas. _renderTick la invalida igual
     que hace weekDays(), y el sitio entra en la clave porque cambiarlo cambia el resultado. */
  const k=(fecha instanceof Date)?iso(fecha):String(fecha||'');
  /* la clave va por coordenadas, no por id: un sitio puede llegar suelto —{lat,lon} sin id— y
     entonces todos compartirían la entrada del sitio elegido y devolverían el sol de otro sitio */
  const st=sitio||sitioActual();
  const cl=k+'|'+st.lat+','+st.lon;
  if(_solTick!==_renderTick){_solCache={};_solTick=_renderTick;}
  if(_solCache[cl])return _solCache[cl];
  return (_solCache[cl]=solCalcula(fecha,st));}
function solCalcula(fecha,sitio){
  /* fecha: Date o 'YYYY-MM-DD'. Devuelve las horas de salida y puesta como Date, o marca el caso
     polar en vez de inventarse una hora que no existe. */
  const d=(fecha instanceof Date)?fecha:parseDate(fecha);
  if(!d)return {sinDatos:true};
  const s=sitio||sitioActual();
  const lat=+s.lat,lon=+s.lon;
  const jd=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),12,0,0)/86400000+2440587.5;
  const n=Math.round(jd-2451545.0+0.0008);
  /* longitud en grados, este positivo: cuanto más al oeste, más tarde sale el sol en UTC */
  const Js=n-lon/360;
  const M=(357.5291+0.98560028*Js)%360;
  const C=1.9148*Math.sin(M*SOL_RAD)+0.0200*Math.sin(2*M*SOL_RAD)+0.0003*Math.sin(3*M*SOL_RAD);
  const lam=(M+C+180+102.9372)%360;
  const Jt=2451545.0+Js+0.0053*Math.sin(M*SOL_RAD)-0.0069*Math.sin(2*lam*SOL_RAD);
  const sinDec=Math.sin(lam*SOL_RAD)*Math.sin(23.4397*SOL_RAD);
  const cosDec=Math.cos(Math.asin(sinDec));
  const cosW=(Math.sin(-0.833*SOL_RAD)-Math.sin(lat*SOL_RAD)*sinDec)/(Math.cos(lat*SOL_RAD)*cosDec);
  if(cosW>1)return {polar:'noche'};    /* no amanece en todo el día */
  if(cosW<-1)return {polar:'dia'};     /* no se pone en todo el día */
  const w=Math.acos(cosW)/SOL_RAD;
  const aFecha=function(J){return new Date((J-2440587.5)*86400000);};
  const sale=aFecha(Jt-w/360),pone=aFecha(Jt+w/360);
  return {sale:sale,pone:pone,luzMin:Math.round((pone-sale)/60000)};}
function horaLocal(d){
  /* la hora del teléfono, que es lo que el usuario mira en la pantalla de bloqueo */
  return d?hm(d.getHours()*60+d.getMinutes()):'';}
function horaDecimal(d){return d?(d.getHours()+d.getMinutes()/60+d.getSeconds()/3600):0;}
function solTxt(key){
  const s=solDe(key);
  if(s.polar==='dia')return 'no se pone';
  if(s.polar==='noche')return 'no amanece';
  if(s.sinDatos)return '';
  return horaLocal(s.sale)+' · '+horaLocal(s.pone);}
function luzTxt(min){
  if(min==null)return '';
  const h=Math.floor(min/60),m=min%60;
  return h+' h'+(m?' '+String(m).padStart(2,'0'):'');}
function tzDelMovil(){
  try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){return '';}}
function tzCuadra(){
  /* si el sitio elegido tiene zona horaria conocida y no es la del móvil, las horas del sol que se
     ven serían de otro huso. Mejor avisar que dar una hora que no es. */
  const s=sitioActual(),mia=tzDelMovil();
  if(!s.tz||!mia)return {ok:true};
  return {ok:s.tz===mia,sitio:s.tz,movil:mia};}
/* ---------- el sol, pintado ---------- */
function arcoSolHTML(s,ahora){
  /* el arco es el recorrido del sol y el punto es dónde va ahora: de un vistazo se ve si queda
     tarde o si ya es de noche, sin tener que restar horas mentalmente */
  if(s.polar||s.sinDatos){
    return '<div class="arco arcovacio">'+(s.polar==='dia'?'☀️':'🌙')+'</div>';}
  const h0=horaDecimal(s.sale),h1=horaDecimal(s.pone);
  const t=Math.max(0,Math.min(1,(ahora-h0)/Math.max(0.01,h1-h0)));
  const R=62,cx=70,cy=66;
  const ang=Math.PI*(1-t);
  const px=cx+R*Math.cos(ang),py=cy-R*Math.sin(ang);
  /* large-arc-flag SIEMPRE a 0: del amanecer al punto de ahora se barre como mucho media vuelta
     (t·180°). Con el flag a 1 el navegador no dibuja «el mismo arco pero más largo», sino el de la
     OTRA circunferencia que pasa por esos dos puntos: el trazo se despegaba de la guía y se salía
     del dibujo por arriba. Era lo que se veía roto de mediodía en adelante. */
  const rec=(t<=0)?'':('<path d="M8 66 A'+R+' '+R+' 0 0 1 '+px.toFixed(1)+' '+py.toFixed(1)+
    '" stroke="url(#solg)" stroke-width="3" stroke-linecap="round"/>');
  const dia=(ahora>=h0&&ahora<=h1);
  return '<div class="arco"><svg viewBox="0 0 140 78" width="140" height="78" fill="none">'+
    '<path d="M8 66 A'+R+' '+R+' 0 0 1 132 66" stroke="var(--line)" stroke-width="2.5" stroke-linecap="round"/>'+
    rec+
    '<defs><linearGradient id="solg" gradientUnits="userSpaceOnUse" x1="8" y1="66" x2="132" y2="66">'+
      '<stop offset="0" stop-color="var(--bad)"/><stop offset="1" stop-color="var(--warn)"/></linearGradient></defs>'+
    (dia?('<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="12" fill="var(--warn)" opacity=".2"/>'+
          '<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="7" fill="var(--warn)"/>'):'')+
    '<line x1="4" y1="66" x2="136" y2="66" stroke="var(--line)" stroke-width="1.5"/>'+
    '</svg></div>';}
function solHoyHTML(key){
  const k=key||iso(new Date());
  const s=solDe(k),sit=sitioActual();
  const esHoy=(k===iso(new Date()));
  const ahora=esHoy?horaDecimal(new Date()):12;
  if(s.sinDatos)return '';
  if(s.polar){
    return '<div class="solhero">'+arcoSolHTML(s,ahora)+
      '<div class="solnum"><div class="solfila">'+(s.polar==='dia'?'☀️ hoy el sol no se pone':'🌙 hoy el sol no sale')+'</div>'+
      '<div class="solfila mini">'+esc(sit.nombre)+'</div></div></div>';}
  const h0=horaDecimal(s.sale),h1=horaDecimal(s.pone);
  const queda=esHoy?Math.round((h1-ahora)*60):null;
  const ayer=solDe(addDays(parseDate(k)||new Date(),-1));
  const delta=(ayer&&ayer.luzMin!=null&&s.luzMin!=null)?(s.luzMin-ayer.luzMin):null;
  return '<div class="solhero">'+arcoSolHTML(s,ahora)+
    '<div class="solnum">'+
      '<div class="solfila"><span>🌅</span>'+(esHoy&&ahora>h0?'salió':'sale')+'<b>'+horaLocal(s.sale)+'</b></div>'+
      '<div class="solfila"><span>🌇</span>'+(esHoy&&ahora>h1?'se puso':'se pone')+'<b>'+horaLocal(s.pone)+'</b></div>'+
      '<div class="solfila"><span>☀️</span>'+
        (queda!=null&&queda>0?('quedan<b>'+luzTxt(queda)+'</b>'):('luz<b>'+luzTxt(s.luzMin)+'</b>'))+'</div>'+
    '</div></div>'+
    '<p class="mini" style="margin:9px 0 0">'+esc(sit.nombre)+
      (delta!=null&&delta!==0?(' · '+Math.abs(delta)+' min '+(delta>0?'más':'menos')+' de luz que ayer'):'')+'</p>';}
function planDiaHTML(d){
  /* LO QUE VAS A HACER ese día, que es a lo que se entra a «Semana». Antes la fila solo llevaba la
     franja y las horas de dormir, y el detalle del día eran las comidas: había que abrirlo para
     saber si ese día entrenabas o a qué hora entrabas. Aquí va todo lo que ocupa el día —jornada o
     guardia con sus horas de verdad, entreno, eventos, repasos— y las comidas se quedan en una
     línea con la principal. */
  if(!d)return '';
  const sh=shiftById(d.shiftId),bits=[];
  const hd=d.key?horasDelDiaTxt(d.key,d.inf):'';
  const deGuardia=!!(sh&&isGuardia(sh))||!!(d.key&&salidaDeGuardia(d.key));
  if(hd)bits.push('<span class="pl trab">'+(deGuardia?'\ud83e\ude7a':'\ud83d\udcbc')+' '+esc(hd)+'</span>');
  if(d.key){
    const rt=rutinaDeFecha(d.key);
    if(rt)bits.push('<span class="pl gym">\ud83c\udfcb\ufe0f '+esc(nombreCorto(rt.nombre))+'</span>');
    const s2=diaSegundo(d.key,d.inf);
    if(s2&&s2.on)bits.push('<span class="pl gym">\ud83c\udfca '+esc(s2.hora||'')+'</span>');
    const evs=eventosDeFecha(d.key);
    evs.slice(0,2).forEach(function(ev){
      bits.push('<span class="pl evt">\ud83d\udcc5 '+esc(evHoraTxt(ev))+' '+esc(nombreCorto(ev.titulo||''))+'</span>');});
    if(evs.length>2)bits.push('<span class="pl evt">+'+(evs.length-2)+'</span>');
    try{const n=estTocaHoy(d.key);
      if(n&&n.length)bits.push('<span class="pl est">\ud83d\udcda '+n.length+' repaso'+(n.length===1?'':'s')+'</span>');}catch(e){}
    const cp=comidaPrincipalDe(d.key,d.inf);
    if(cp)bits.push('<span class="pl com">\ud83c\udf7d\ufe0f '+esc(comidaPrincipalTxt(cp))+'</span>');
  }
  return bits.length?('<div class="drplan">'+bits.join('')+'</div>'):'';}
function horasSuenoHTML(key,inf,shiftId){
  /* Las dos horas del sueño, SIEMPRE a la vista, igual que las dos del sol. Antes solo se veían
     abriendo el día en «Semana» (y en «Hoy» había una sola: la de acostarse). La de levantarse no
     salía en ninguna de las dos pantallas.
       🛌 22:40  = la hora a la que TE ACUESTAS ese tipo de día
       ⏰ 06:50  = a la que te levantas
       8h00      = lo que sale de ahí
     Y si acostándote a esa hora no llegas a tu mínimo, se dice a qué hora habría que hacerlo: eso
     es lo que la app sabe y tú no quieres calcular a las once de la noche. */
  /* con fecha, las horas de ese día; sin fecha (modo plantilla) las del tipo de día, que es de
     donde salen igualmente. Antes esto solo se pintaba con fecha real y en plantilla «Semana» no
     enseñaba ni una de las dos horas. */
  let sl;
  if(key)sl=sleepOf(key,inf);
  else{const rh=shiftId?(rhythmOf(shiftId)||{}):{};
    sl={bed:rh.sleep||'',wake:rh.wake||'',h:(rh.sleep&&rh.wake)?sleepHours(rh.sleep,rh.wake):null};}
  const nt=nightOf(key||'',sl),c=suenoCfg();
  if(!sl.bed&&!sl.wake){
    /* que no se quede en blanco: sin horas puestas, lo que hace falta es saber dónde se ponen */
    return '<span class="pie sue falta" data-a="ir-sueno" role="button" tabindex="0">'+
      '\ud83d\udecc sin horas puestas \u2014 ponlas</span>';}
  const corto=sl.h!=null&&sl.h<c.min;
  /* el día de después de una guardia se duerme DOS veces: la siesta al llegar del hospital y por
     la noche el sueño normal. Enseñar solo «⏰ 08:30» ahí era mentira: a esa hora estabas saliendo
     de trabajar. */
  if(sl.siesta){
    /* el día de saliente se mide por partida doble: la siesta tiene su propio mínimo (6 h) y la
       noche el de siempre (8 h). Sumarlas y comparar con 8 daba por bueno dormir 6 de siesta y 2
       de noche, que no es lo mismo ni de lejos. */
    const minSiesta=c.siesta,cortaSiesta=sl.siesta.min<minSiesta;
    const cortaNoche=sl.noche!=null&&sl.noche<c.min;
    return '<span class="pie sue'+(cortaSiesta?' corto':'')+'">\ud83d\ude34 siesta '+esc(sl.siesta.de)+'\u2013'+esc(sl.siesta.a)+
      ' ('+fmtHM(sl.siesta.min)+')</span>'+
      '<span class="pie sue'+(cortaNoche?' corto':'')+'">\ud83d\udecc '+esc(sl.bed||'\u2014')+
      (sl.noche!=null?(' \u00b7 '+fmtHM(Math.round(sl.noche*60))):'')+'</span>'+
      (sl.h!=null?('<span class="pie sue">'+fmtHM(sl.h*60)+' en total</span>'):'')+
      (cortaNoche?('<span class="pie sue rec">la noche se queda corta: para tus '+c.min+' h, a la cama a las '+
        esc(acostarsePara(sl.wakeSig||'')||'\u2014')+'</span>'):'');}
  const tarde=nt.rec&&sl.bed&&mins(sl.bed)!=null&&mins(nt.rec)!=null&&
    ((mins(sl.bed)-mins(nt.rec)+1440)%1440)>10&&((mins(sl.bed)-mins(nt.rec)+1440)%1440)<12*60;
  return '<span class="pie sue'+(corto?' corto':'')+'">\ud83d\udecc '+esc(sl.bed||'\u2014')+'</span>'+
    '<span class="pie sue">\u23f0 '+esc(sl.wake||'\u2014')+'</span>'+
    (sl.h!=null?('<span class="pie sue'+(corto?' corto':'')+'">'+fmtHM(sl.h*60)+
      (corto?(' \u00b7 te faltan '+fmtHM(nt.falta)):'')+'</span>'):'')+
    ((corto||tarde)&&nt.rec?('<span class="pie sue rec">para tus '+c.min+' h, a la cama a las '+esc(nt.rec)+'</span>'):'');}
function solPiesHTML(key){
  /* las dos horas en una línea, para la fila de un día en Semana */
  const s=solDe(key);
  if(s.sinDatos)return '';
  if(s.polar)return '<span class="pie sol">'+(s.polar==='dia'?'☀️ no se pone':'🌙 no amanece')+'</span>';
  return '<span class="pie sol">🌅 '+horaLocal(s.sale)+'</span><span class="pie sol">🌇 '+horaLocal(s.pone)+'</span>';}
/* dónde vive ahora cada tarjeta que se puede enlazar desde otra pantalla. Sin esto, irACard()
   hace `if(!c)return;` y el botón no hace NADA y no da ningún error: justo el fallo mudo que este
   repositorio se come una y otra vez. Cada vez que una tarjeta con data-cfg se mueva a una vista,
   tiene que aparecer aquí. */
const CFG_DONDE={
  sol:      {tab:'ajustes',v:'sol'},
  lector:   {tab:'ajustes',v:'lector'},
  usda:     {tab:'ajustes',v:'comida'},
  franja:   {tab:'ajustes',v:'aspecto'},
  sueno:    {tab:'cfg',    v:'horas'},
  copias:   {tab:'data',   v:'copia'},
  rotaciones:{tab:'cfg',   v:'rotacion'}
};
function irACard(tab,cfg,espera){
  const d=CFG_DONDE[cfg];
  if(d){
    tab=tab||d.tab;
    if(d.tab==='ajustes')ui.ajuVista=d.v;
    else if(d.tab==='data')ui.datosVista=d.v;
    else if(d.tab==='cfg')ui.cfgVista=d.v;
  }
  /* «llévame a la tarjeta donde se cambia esto» y enciéndela un momento para que se vea cuál es.
     Estaba escrito SIETE veces con las mismas constantes de 60 ms y 1600 ms repartidas por el
     fichero; ahora el tiempo, el color y el caso de «la tarjeta no está» viven en un sitio. */
  if(tab&&ui.tab!==tab){ui.tab=tab;if(CAL_SET.has(tab))ui.calMode=tab;}
  render();
  setTimeout(function(){
    const c=document.querySelector('#main [data-cfg="'+cfg+'"]');
    if(!c)return;
    if(c.tagName==='DETAILS')c.open=true;
    c.scrollIntoView({behavior:'smooth',block:'center'});
    c.style.outline='2px solid var(--brand)';
    setTimeout(function(){c.style.outline='';},1600);
  },espera||60);}
let _hoyKey='',_hoyTick=-1;
function hoyKey(){
  /* iso(new Date()) se llamaba por fila de semana y por nota pintada. Una vez por pintado basta:
     el cambio de día lo fuerza vigilarElDia(), que repinta. */
  if(_hoyTick!==_renderTick){_hoyKey=iso(new Date());_hoyTick=_renderTick;}
  return _hoyKey;}
function isToday(key){return !!key&&key===hoyKey();}
function modoAvisoHTML(){
  /* aviso de modo compartido (informe, decisión B): Mes y Hoy siempre usan fecha real; si "Semana"
     está en modo plantilla (sin fechas), lo avisa aquí para que el cambio de pantalla no sorprenda */
  if(store.rotation.mode==='date')return '';
  return '<p class="mini">ℹ️ «Semana» está en modo plantilla (sin fechas reales) ahora mismo — este calendario siempre usa la fecha real.</p>';
}
function daySleepLineHTML(dateStr,inf){
  const sl=sleepOf(dateStr,inf),nt=nightOf(dateStr,sl),today=isToday(dateStr);
  if(sl.h!=null)return '<p class="mini" style="margin-top:6px">🛌 '+(today?'dormiste ':'durmió ')+fmtHM(sl.h*60)+
    (sl.h<suenoCfg().min?' ⚠ menos de lo tuyo':'')+(today&&nt.rec?' · esta noche, a la cama sobre las '+esc(nt.rec):'')+'</p>';
  if(nt.rec)return '<p class="mini" style="margin-top:6px">🛌 para dormir lo tuyo, a la cama sobre las '+esc(nt.rec)+'</p>';
  return '';
}
function mealRowsHTML(dateStr,sh){
  if(!sh)return '<div class="empty">Sin tipo de día asignado: ponlo en «Mes» o «Turno y rotación».</div>';
  const slots=slotsFor(sh.id);
  if(!slots.length)return '<div class="empty">Este tipo de día no tiene comidas montadas todavía: abre «Comer → Menú».</div>';
  const today=isToday(dateStr),now=new Date();
  const nowHM=today?(String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')):'';
  /* la comida principal no está a la hora de la lista: depende de si ese día entrenas o vienes de
     guardia. Se calcula una vez y manda sobre el `time` del hueco. */
  const cp=dateStr?comidaPrincipalDe(dateStr):null;
  const hDe=function(x){return horaDeToma(dateStr,x,cp);};
  let nextIdx=-1;if(today)slots.forEach(function(s,i){if(nextIdx<0&&hDe(s)>=nowHM)nextIdx=i;});
  return slots.map(function(s,i){
    const info=slotItems(sh.id,s),t=totals(info.items);
    const hora=hDe(s),principal=!!(cp&&esComidaPrincipal(s));
    const dishTxt=info.items.map(function(it){const dd=dishById(it.id);if(!dd)return '';const q=num(it.portions,1);
      return esc(dd.icon)+' '+esc(dd.name)+(q!==1?' ('+rac(q)+')':'');}).filter(Boolean).join(' + ')||'<i>sin asignar</i>';
    const pasada=today&&hora&&hora<nowHM&&i!==nextIdx;
    return '<div class="meal'+(i===nextIdx?' next':'')+(pasada?' past':'')+'"><span class="mt">'+esc(hora||'·')+'</span><span>'+
      '<span class="ml">'+esc(s.label||'')+(i===nextIdx?' <span class="tag b2">siguiente</span>':'')+'</span>'+
      '<span class="mn">'+dishTxt+'</span>'+
      (principal?'<span class="md">hasta las '+esc(cp.a)+' · '+esc(comidaPorqueTxt(cp.por))+'</span>':'')+
      (t.kcal?'<span class="md">'+t.kcal+' kcal · '+t.prot+' g P'+(info.name?' · 🍱 '+esc(info.name):'')+'</span>':'')+
      (info.items.length?'<button class="btn s" style="margin-top:5px" data-a="hoy-log-slot" data-shift="'+sh.id+'" data-slot="'+s.id+'" data-key="'+dateStr+'">✓ ya me la he comido</button>':'')+
      '</span></div>';}).join('');
}
function franjaVentana(marcas){
  /* cuántas horas de la franja se ven (Ajustes → «Franja de 24 h»). Si son menos de 24,
     la ventana se centra en lo que realmente pasa ese día en vez de recortar por el principio. */
  const H=tlHoras();
  if(H>=24)return {from:0,to:1440};
  const w=H*60,ok=marcas.filter(function(m){return m!=null;});
  if(!ok.length)return {from:480,to:Math.min(1440,480+w)};
  const lo=Math.min.apply(Math,ok),hi=Math.max.apply(Math,ok);
  let from=Math.round((lo+hi)/2-w/2);
  if(from<0)from=0;
  if(from+w>1440)from=1440-w;
  return {from:from,to:from+w};
}
function timelineBar(dateStr,inf,opt){
  /* barra del día (informe: sustituye a la línea de texto de Semana, y es la agenda de Hoy):
     sueño de sleepOf(), trabajo/guardia de las horas del propio tipo de día o de la jornada base,
     comidas de slotsFor() — los mismos tres orígenes de datos que ya se listaban como texto.
     Cada categoría lleva su color fijo (tlColor), configurable en Ajustes. */
  if(!dateStr)return '';
  inf=inf||dayInfo(dateStr);
  const sh=shiftById(inf.shiftId),sl=sleepOf(dateStr,inf);
  /* el trabajo del día ya no es una sola pareja de horas: una guardia entre semana es jornada y
     luego guardia, y el día siguiente empieza trabajando hasta el relevo */
  const bloq=bloquesTrabajo(dateStr,inf);
  const cpF=dateStr?comidaPrincipalDe(dateStr,inf):null;
  const comidas=(sh?slotsFor(sh.id).map(function(x){
    return {time:horaDeToma(dateStr,x,cpF),label:x.label};}):[]);
  const seg2=diaSegundo(dateStr,inf);
  const evs=eventosDeFecha(dateStr);
  const V=franjaVentana([mins(sl.wake),mins(sl.bed),
    sl.siesta?mins(sl.siesta.de):null,sl.siesta?mins(sl.siesta.a):null,
    (seg2&&seg2.on)?mins(seg2.hora):null]
    .concat(bloq.map(function(b){return b.de;}))
    .concat(bloq.map(function(b){return b.a>=1440?1439:b.a;}))
    .concat(comidas.map(function(c){return mins(c.time);}))
    .concat(evs.map(function(e){return mins(e.hora);})));
  const span=V.to-V.from;
  opt=opt||{};
  const pct=function(m){return m==null?null:(m-V.from)/span*100;};
  const dentro=function(m){return m!=null&&m>=V.from&&m<=V.to;};
  /* la franja «grande» (Semana y Hoy) lleva escrito dentro de cada bloque lo que es —«trabajo 8–15»,
     «guardia 15→8»— cuando cabe: así no hace falta ir a la leyenda para saber qué es cada color */
  const seg=function(m1,m2,color,titulo,etq){
    if(m1==null||m2==null)return '';
    const a=Math.max(m1,V.from),b=Math.min(m2,V.to);
    if(b<=a)return '';
    const w=(b-a)/span*100;
    const txt=(opt.grande&&etq)?(w>=24?etq:(w>=11?String(etq).split(' ')[0]:'')):'';
    return '<i class="tl-seg" style="left:'+pct(a).toFixed(1)+'%;width:'+w.toFixed(1)+
      '%;background:'+esc(color)+'" title="'+esc(titulo||'')+'">'+(txt?'<b>'+esc(txt)+'</b>':'')+'</i>';};
  const segs=[];
  /* saliente: la mañana no es sueño, es trabajo; el sueño de la mañana es la siesta de después */
  if(sl.siesta)segs.push(seg(mins(sl.siesta.de),mins(sl.siesta.a),tlColor('sleep'),
    'siesta al llegar de la guardia · '+sl.siesta.de+'–'+sl.siesta.a,'siesta'));
  else if(sl.wake)segs.push(seg(0,mins(sl.wake),tlColor('sleep'),'durmiendo hasta las '+sl.wake));
  /* acostarse a las 00:00 (o a la 1:00) es acostarse la noche SIGUIENTE, pasada la medianoche: en
     la franja de hoy no hay tramo de «a la cama». Antes se pintaba de mins('00:00')=0 hasta las 24:00
     y el día entero salía del color del sueño —en vacaciones, con la cama a medianoche, la barra era
     un solo bloque gris y no se veía nada más—. */
  const bedM=mins(sl.bed),wakeM=mins(sl.wake);
  if(sl.bed&&!(bedM!=null&&wakeM!=null&&bedM<wakeM))segs.push(seg(bedM,1440,tlColor('sleep'),'a la cama a las '+sl.bed));
  /* el entreno de primera hora del «Día de fuerza» va del color del gimnasio, no del de trabajo:
     antes salía naranja pegado a la jornada y parecía que entrabas a las 6:30 */
  bloq.forEach(function(b){
    const esEnt=/^entreno/.test(b.txt||'');
    let etq;
    if(esEnt)etq='entreno';
    else if(b.tipo==='guard'){const g=b.de>0?guardiaHoras(dateStr,inf.guard):null;
      etq=g&&g.sale?('guardia '+hCorta(hm(b.de))+'→'+hCorta(g.sale)):'guardia';}
    else etq='trabajo '+hCorta(hm(b.de))+'–'+(b.a>=1440?'24':hCorta(hm(b.a)));
    segs.push(seg(b.de,b.a,esEnt?tlColor('gym'):tlColor(b.tipo),b.txt||'',etq));});
  const dots=comidas.map(function(c){const m=mins(c.time);if(!dentro(m))return '';
    return '<i class="tl-dot meal" style="left:'+pct(m).toFixed(1)+'%;background:'+esc(tlColor('meal'))+
      '" title="'+esc(c.time||'')+' · '+esc(c.label||'')+'"></i>';}).join('');
  const gymDot=(seg2&&seg2.on&&dentro(mins(seg2.hora)))?
    ('<i class="tl-dot gym" style="left:'+pct(mins(seg2.hora)).toFixed(1)+'%;background:'+esc(tlColor('gym'))+
      '" title="🏊 segundo entreno · '+esc(seg2.hora)+'"></i>'):'';
  /* un evento con hora de fin ocupa un RATO, así que se pinta como banda y no como punto: eso es lo
     que deja ver de un vistazo que la presentación te come toda la mañana. Sin fin sigue siendo un
     punto, como siempre. La banda se corta a medianoche igual que la jornada de trabajo. */
  const evDots=evs.map(function(ev){
    const m=mins(ev.hora);if(m==null)return '';
    const dur=evDura(ev);
    if(dur){
      const a=Math.max(m,V.from),b=Math.min(m+dur,1440,V.to);
      if(b<=a)return '';
      const t='📅 '+evHoraTxt(ev)+' '+(ev.titulo||'')+(evDuraTxt(ev)?(' ('+evDuraTxt(ev)+')'):'');
      return '<i class="tl-seg evt" style="left:'+pct(a).toFixed(1)+'%;width:'+((b-a)/span*100).toFixed(1)+
        '%;background:'+esc(ev.color||tlColor('evt'))+'" title="'+esc(t)+'"></i>';}
    if(!dentro(m))return '';
    return '<i class="tl-dot evt" style="left:'+pct(m).toFixed(1)+'%;background:'+esc(ev.color||tlColor('evt'))+
      '" title="📅 '+esc(ev.hora)+' '+esc(ev.titulo)+'"></i>';}).join('');
  /* la noche, por ENCIMA de todo lo demás: se oscurecen las horas sin sol en vez de iluminar las que
     lo tienen. Al fondo no valía —los bloques de dormir y de trabajo tapaban justo la franja de luz—
     y así además se lee bien que una guardia se come la noche entera. Se recorta a la ventana
     visible igual que los tramos, porque la barra no siempre enseña las 24 h. */
  const sol=solDe(dateStr);
  let noche='';
  const trozoNoche=function(m1,m2,lado){
    const a=Math.max(m1,V.from),b=Math.min(m2,V.to);
    if(b<=a)return '';
    return '<i class="tl-noche '+lado+'" style="left:'+pct(a).toFixed(1)+'%;width:'+((b-a)/span*100).toFixed(1)+'%"></i>';};
  if(sol.polar==='noche')noche='<i class="tl-noche" style="left:0;width:100%" title="hoy el sol no sale"></i>';
  else if(sol.sale&&sol.pone){
    const m1=sol.sale.getHours()*60+sol.sale.getMinutes(),m2=sol.pone.getHours()*60+sol.pone.getMinutes();
    noche=trozoNoche(0,m1,'alba')+trozoNoche(m2,1440,'ocaso');}
  let now='';
  if(isToday(dateStr)){const d=new Date(),m=d.getHours()*60+d.getMinutes();
    if(dentro(m))now='<i class="tl-now" style="left:'+pct(m).toFixed(1)+'%" title="ahora"></i>';}
  const ejes=[0,.25,.5,.75,1].map(function(f){const m=V.from+span*f;
    /* los extremos se anclan al borde: con translateX(-50%) se salían de la tarjeta */
    const pos=f===0?'left:0;transform:none':(f===1?'right:0;left:auto;transform:none':'left:'+(f*100)+'%');
    return '<span style="'+pos+'">'+Math.round(m/60)+'h</span>';}).join('');
  /* sin eje cuando la pantalla ya pinta uno solo para todos los días (Semana a 24 h): repetirlo en
     cada día era parte de lo «sobrecargado» */
  return '<div class="tl-wrap'+(opt.grande?' grande':'')+'">'+(opt.sinEje?'':'<div class="tl-axis">'+ejes+'</div>')+
    '<div class="tl-bar" title="'+esc(sol.sale&&sol.pone?('luz de '+horaLocal(sol.sale)+' a '+horaLocal(sol.pone)):'')+
      '">'+segs.join('')+noche+dots+gymDot+evDots+now+'</div></div>';
}
function franjaLeyendaHTML(){
  return '<div class="tlleg">'+TLCAT.map(function(c){
    return '<span><i style="background:'+esc(tlColor(c[0]))+'"></i>'+esc(c[1])+'</span>';}).join('')+
    '<span class="sp"></span><button class="btn s" data-a="franja-cfg" style="padding:2px 8px;font-size:10.5px">colores y horas ▸</button></div>';
}
function dayPanelHTML(dateStr){
  /* panel inline de un día (informe, decisión A: recomendada) — lo que antes abría renderDayModal()
     como ventana aparte, ahora se pinta bajo la propia cuadrícula de Mes: se ve el detalle (sueño,
     comidas) con el mismo componente que usa Hoy, y las acciones de asignar quedan plegadas debajo */
  const d=parseDate(dateStr);if(!d)return '';
  const key=iso(d),inf=dayInfo(key),sh=shiftById(inf.shiftId),today=isToday(key);
  const opts=store.shifts.map(function(s){
    return '<button class="btn s '+(inf.shiftId===s.id?'p':'')+'" data-a="day-set" data-key="'+key+'" data-sid="'+s.id+'" data-guard="">'+
      esc(s.icon)+' '+esc(s.name)+'</button>';}).join('');
  const gd=store.shifts.filter(isGuardia),tipos=gTipos(),sd0=saltoDia();
  const guardBtn=gd.length?('<span class="mini">'+(d.getDay()===sd0.from?('eres '+DOWN0[sd0.from]+': el saliente cae el '+DOWN0[sd0.to]):'el día siguiente queda saliente solo')+'</span> '+
    tipos.map(function(t){const on=inf.shiftId===gd[0].id&&String(inf.guard||'').toLowerCase()===t.code;
      return '<button class="btn s '+(on?'p':'')+'" data-a="day-guardia" data-key="'+key+'" data-guard="'+t.code+'">'+
        (on?'✓ ':'')+'🩺 '+esc(t.label)+'</button>';}).join('')+
    (inf.shiftId===gd[0].id?' <button class="btn s" data-a="day-guardia" data-key="'+key+'" data-guard="">quitar guardia y saliente</button>':''))
    :'<span class="mini">marca en «Turno y rotación» qué tipo de día es guardia</span>';
  return '<div class="daydetail'+(today?' today':'')+'">'+
    '<div class="row" style="align-items:baseline;justify-content:space-between">'+
      '<b>'+DAYN[(d.getDay()+6)%7]+' '+d.getDate()+' de '+MON[d.getMonth()]+' · '+(sh?esc(sh.icon)+' '+esc(sh.name):'sin asignar')+'</b>'+
      (today?'<span class="tag b2">hoy</span>':'')+
    '</div>'+
    timelineBar(key,inf)+
    daySleepLineHTML(key,inf)+
    (eventosDeFecha(key).length?('<div class="row" style="margin-top:6px;flex-wrap:wrap">'+eventosTagsHTML(eventosDeFecha(key))+'</div>'):'')+
    '<div style="margin-top:6px">'+mealRowsHTML(key,sh)+'</div>'+
    /* lo que pedía el usuario: poder meter cosas suyas en un día concreto y que se queden.
       Antes era UNA nota por día en un textarea; ahora son las notas de la libreta que caen en este
       día, con su propio hueco, y el evento se crea aquí sin ir a otra pestaña a escribir la fecha. */
    '<div style="margin-top:10px">'+notasDelDiaHTML(key)+'</div>'+
    '<div class="row" style="margin-top:8px;gap:6px">'+
      '<label class="fld" style="flex:2 1 150px">añadir un evento este día'+
        '<input id="evDia-'+key+'" data-a="dia-ev-tit" placeholder="Sesión clínica" maxlength="70"></label>'+
      '<label class="fld" style="flex:0 0 96px">hora<input type="time" id="evDiaH-'+key+'" value="09:00"></label>'+
      '<label class="fld" style="flex:0 0 auto;justify-content:flex-end">'+
        '<button class="btn s" data-a="dia-ev-add" data-key="'+key+'">+ añadir</button></label></div>'+
    '<details class="dtip" style="margin-top:9px"'+(ui.diaEditor?' open':'')+'><summary class="mini">cambiar qué día es ▾</summary>'+
      '<div class="row" style="margin-top:8px">'+opts+'</div>'+
      '<div class="row" style="margin-top:8px;gap:8px">'+guardBtn+'</div>'+
      '<div class="row" style="margin-top:8px">'+
        '<button class="btn s" data-a="day-set" data-key="'+key+'" data-sid="" data-guard="">quitar lo puesto</button>'+
        '<button class="btn s '+(diaSegundo(key).on?'g':'')+'" data-a="gym-seg-hoy" data-key="'+key+'">'+(diaSegundo(key).on?'✓':'○')+' 🏊 segundo entreno</button>'+
      '</div>'+
      /* El botón «Vacaciones» de arriba marca ESTE día y ya. Para unas vacaciones de verdad hacía
         falta bajar dos pantallas hasta la tarjeta; desde aquí se marca el periodo entero de una. */
      '<div class="row" style="margin-top:8px;gap:6px;align-items:flex-end">'+
        '<span class="mini" style="flex:0 0 auto">🏖️ vacaciones desde este día</span>'+
        '<label class="fld" style="flex:0 0 150px">hasta<input type="date" id="vacHasta-'+key+'" min="'+key+'" value="'+key+'"></label>'+
        '<button class="btn s" data-a="vac-desde" data-key="'+key+'">marcar periodo</button>'+
      '</div>'+
      '<div class="row" style="margin-top:8px">'+
        '<span class="sp"></span><button class="btn s" data-a="day-rhythm" data-key="'+key+'">editar horas 🛌⏰</button>'+
      '</div></details>'+
    '</div>';
}
/* ===================== render: hoy (pantalla de inicio) ===================== */
/* «Hoy» enseñaba hoy y solo hoy: para ver qué te toca mañana —o qué hiciste ayer— había que ir a
   «Semana» y abrir el día. Ahora la pantalla se mueve por días con las mismas flechas ‹ › de
   arriba que ya mueven el mes y la semana, y se vuelve al día de hoy pulsando «Hoy» en la barra. */
function fechaHoy(){return ui.diaHoy||iso(new Date());}
function esHoyDeVerdad(k){return k===iso(new Date());}
function moverDiaHoy(n){
  const d=parseDate(fechaHoy());if(!d)return;
  const k=iso(addDays(d,n));
  ui.diaHoy=esHoyDeVerdad(k)?'':k;}
function hoyAhoraHTML(key,inf,esHoy){
  /* lo que toca AHORA y lo SIGUIENTE, arriba del todo: es lo que se mira al sacar el móvil */
  if(!esHoy)return '';
  const now=new Date(),n=now.getHours()*60+now.getMinutes();
  const ag=agendaDia(key,inf);
  const dura=ag.filter(function(x){return x.fin&&x.m2<=n&&n<finMin(x)&&x.tipo!=='meal';});
  const ahora=dura.length?dura[dura.length-1]:null;
  const sig=ag.filter(function(x){return x.m2>n;})[0]||null;
  if(!ahora&&!sig)return '';
  const ahoraTxt=ahora?('<b>'+esc(ahora.txt)+'</b> <span class="mini">hasta las '+esc(hCortaHM(ahora.fin))+'</span>'):'<b>Nada en marcha</b>';
  return '<div class="hoyahora"><div><span class="e">AHORA</span>'+ahoraTxt+'</div>'+
    (sig?('<div class="sig"><span class="e">SIGUIENTE</span><b>'+sig.ico+' '+esc(sig.txt)+' '+esc(hCortaHM(sig.hora))+'</b></div>'):'')+'</div>';}
function hoyAgendaHTML(key,inf,esHoy){
  /* el día entero como lista por horas: cada cosa con su hora, su color y, las comidas, sus platos
     y el ✓ para apuntarla. Lo que ya ha pasado se apaga. */
  const ag=agendaDia(key,inf);
  /* los eventos sin hora (todo el día) no caben en una lista por horas: van encima, como etiqueta */
  const sinHora=eventosDeFecha(key).filter(function(e){return !e.hora;});
  const tags=sinHora.length?('<div class="row" style="margin-top:8px;flex-wrap:wrap">'+eventosTagsHTML(sinHora)+'</div>'):'';
  if(!ag.length)return tags;
  const now=new Date(),n=now.getHours()*60+now.getMinutes();
  return tags+'<div class="hoyag">'+ag.map(function(x){
    const pasado=esHoy&&finMin(x)<n&&!(x.fin&&n<finMin(x));
    const enCurso=esHoy&&x.fin&&x.m2<=n&&n<finMin(x);
    const sub=[x.fin?('hasta '+hCortaHM(x.fin)):'',x.sub,enCurso?'ahora':''].filter(Boolean).join(' · ');
    return '<div class="agf '+x.tipo+(pasado?' ya':'')+(enCurso?' ahora':'')+'">'+
      '<b class="h">'+esc(hCortaHM(x.hora))+'</b><i style="background:'+esc(x.color)+'"></i>'+
      '<span class="ico">'+x.ico+'</span>'+
      '<span class="t"><b>'+esc(x.txt)+'</b>'+(sub?' <span class="mini">'+esc(sub)+'</span>':'')+'</span>'+
      (x.tipo==='meal'&&x.conPlatos?('<button class="btn s" data-a="hoy-log-slot" data-shift="'+esc(x.sh.id)+'" data-slot="'+esc(x.slot.id)+
        '" data-key="'+esc(key)+'" title="ya me la he comido">✓</button>'):'')+
    '</div>';}).join('')+'</div>';}
function renderHoy(){
  const now=new Date(),hoy=fechaHoy(),dref=parseDate(hoy)||now,inf=dayInfo(hoy),sh=shiftById(inf.shiftId);
  const esHoy=esHoyDeVerdad(hoy);
  const ft=foodTotals(hoy),pl=planTotalsOf(hoy);
  const fecha=DAYN[(dref.getDay()+6)%7]+' '+dref.getDate()+' de '+MONTH_FULL[dref.getMonth()];
  const dist=Math.round((Date.UTC(dref.getFullYear(),dref.getMonth(),dref.getDate())
    -Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);
  const chip=dist===0?'hoy':dist===1?'mañana':dist===-1?'ayer':
    (dist>0?('en '+dist+' días'):('hace '+(-dist)+' días'));
  /* una línea que se lee de un vistazo: «💪 Día de fuerza · 8–15 · UMI». Antes iban todas las
     horas de todos los bloques («00:00–08:00 · 06:30–08:00 · 08:00–15:00») y eso ya está, mejor
     contado, en la agenda de debajo */
  const hhE=horasCortasDia(hoy,inf,sh),rotE=monthService(dref.getFullYear(),dref.getMonth()).service;
  const estado=inf.vac?('🏖️ Vacaciones'+(inf.vac.label?' · '+esc(inf.vac.label):'')):
    (sh?(esc(sh.icon)+' '+esc(sh.name)+(inf.guard?' '+esc(gTipo(inf.guard).label):'')+
      (hhE?' · '+esc(hhE):'')+(rotE&&!isGuardia(sh)&&hhE?' · '+esc(rotE):'')):'sin día asignado');
  const guardiaHoy=!inf.vac&&sh&&isGuardia(sh);
  $('#main').innerHTML='<div class="grid">'+
    '<div class="card"><h2>'+(esHoy?'☀️ Hoy · ':'🗓️ ')+esc(fecha)+'<span class="hoychip'+(esHoy?'':' otro')+'">'+esc(chip)+'</span>'+
      (esHoy?('<span class="mini" style="margin-left:auto;font-weight:700">son las '+horaLocal(now)+'</span>'):'')+'</h2>'+
    /* moverse por días sin salir de la pantalla: la víspera de una guardia quieres ver el día de
       mañana, no el de hoy. Las flechas ‹ › de la barra de arriba hacen lo mismo. */
    '<div class="row diasnav">'+
      '<button class="btn s" data-a="dia-prev" title="día anterior">‹ '+esc(DIA3[addDays(dref,-1).getDay()])+'</button>'+
      (esHoy?'':'<button class="btn p s" data-a="dia-hoy">volver a hoy</button>')+
      '<button class="btn s" data-a="dia-next" title="día siguiente">'+esc(DIA3[addDays(dref,1).getDay()])+' ›</button>'+
    '</div>'+
    modoAvisoHTML()+
    '<div class="hoyest" style="color:'+(sh&&!inf.vac?esc(sh.color):'var(--ink)')+'">'+estado+
    (guardiaHoy?' <span class="tag b1">de guardia</span>':'')+'</div>'+
    timelineBar(hoy,inf,{grande:true})+
    leyendaPlegadaHTML('hoyley')+
    hoyAhoraHTML(hoy,inf,esHoy)+
    hoyAgendaHTML(hoy,inf,esHoy)+
    /* el pie: las horas del sueño y del sol, y cuánto llevas comido frente al plan */
    '<div class="hoypie">'+
      '<div class="drsol">'+horasSuenoHTML(hoy,inf)+solPiesHTML(hoy)+'</div>'+
      '<span class="hoykcal"><b>'+ft.kcal+'</b> / '+(pl.kcal||'—')+' kcal</span></div>'+
    '<div class="row" style="margin-top:8px">'+
      '<button class="btn s" data-a="hoy-food-obj">✎ objetivo de kcal →</button>'+
      '<button class="btn s" data-a="tab" data-t="ajustes">🌙 horas de sueño →</button>'+
    '</div>'+
    '</div>'+
    /* el orden manda: primero el día, luego LO QUE HAY QUE HACER —entrenar, las tareas, lo que
       toca pagar, los hábitos— y al final lo de consulta. Al abrir la app por la mañana lo que
       quieres es la lista, no el atardecer. */
    tocaEntrenarHTML(hoy)+
    /* las tareas, los hábitos y «lo que viene» se marcan y se cuentan contra HOY: enseñarlos
       mirando el jueves que viene sería invitarte a tachar una casilla del día equivocado */
    (esHoy?tareasHoyHTML():'')+
    /* la compra es una tarea más de la semana: sale aquí cuando toca, igual que entrenar. Al
       calendario de Google no va —eso se queda en la app— */
    (esHoy?compraTocaHTML():'')+
    pagosHoyHTML(hoy)+
    repasoHoyHTML(hoy)+
    (esHoy?habitosHoyHTML():'')+
    (esHoy?proximosPuntualesHTML():'')+
    '<div class="card"><h2>Comidas '+(esHoy?'de hoy':'del '+esc(DIA3[dref.getDay()])+' '+dref.getDate())+(sh?'<span class="mini" style="margin-left:auto"><button class="btn s" data-a="day-edit" data-id="'+sh.id+'">✎ cambiar horas/platos →</button></span>':'')+'</h2>'+mealRowsHTML(hoy,sh)+'</div>'+
    /* el sol: cuánta luz queda es lo que usas para decidir si sales a correr. Es de consulta, así
       que va después de lo que hay que hacer. */
    '<div class="card"><h2>El sol '+(esHoy?'hoy':'ese día')+'</h2>'+solHoyHTML(hoy)+
      '<div class="row" style="margin-top:10px">'+
        '<button class="btn s" data-a="ir-sol">cambiar de sitio</button>'+
        '<span class="mini">se calcula en el móvil, sin internet</span></div></div>'+
    '<div class="row">'+
      '<button class="btn s" data-a="nav-comer">🍽 apuntar comida</button>'+
      '<button class="btn s" data-a="tab" data-t="week">ver toda la semana</button>'+
      '<button class="btn s" data-a="tab" data-t="month">ver el mes</button>'+
    '</div></div>';
}
/* ===================== la agenda de un día: lo que haces, a su hora =====================
   Hoy y Semana la leen de aquí: dormir, trabajo o guardia, entreno, eventos y cada comida con su
   hora. Antes cada pantalla juntaba estas horas por su cuenta y las comidas eran puntos sin hora
   en la franja: había que adivinar a qué hora cenabas. */
function icoToma(label){const l=String(label||'').toLowerCase();
  if(/desay/.test(l))return '☕';
  if(/merienda/.test(l))return '🥪';
  if(/cena/.test(l))return '🌙';
  if(/pre|post|entren|batido/.test(l))return '🥤';
  if(/media|tentempi|almuerzo|snack/.test(l))return '🍎';
  if(/comida/.test(l))return '🍽️';
  return '🍴';}
function tomasDelDia(key,inf,shiftId){
  const sh=shiftById(shiftId||(inf&&inf.shiftId));if(!sh)return [];
  const cp=key?comidaPrincipalDe(key,inf):null;
  return slotsFor(sh.id).map(function(x){
    return {hora:key?horaDeToma(key,x,cp):(x.time||''),label:x.label||'',ico:icoToma(x.label),slot:x,sh:sh};})
    .filter(function(t){return mins(t.hora)!=null;})
    .sort(function(a,b){return a.hora.localeCompare(b.hora);});}
function horasCortasDia(key,inf,sh){
  /* «8–15», «15→8», «hasta 9:15»: las horas del día en lo que cabe al lado del nombre */
  if(!sh)return '';
  if(key&&isGuardia(sh)){const g=guardiaHoras(key,inf.guard);return g&&g.sale?(hCorta(g.guardia)+'→'+hCorta(g.sale)):'';}
  const sal=key?salidaDeGuardia(key):null;
  const j=key?jornadaOf(key,inf):null;
  if(sal&&!j)return 'hasta '+hCorta(sal.sale);
  if(j)return hCorta(j.start)+'–'+hCorta(j.end);
  if(!key&&sh.start&&!/libre|vacacion/i.test(sh.name||''))return hCorta(sh.start)+(sh.end?'–'+hCorta(sh.end):'');
  /* un día con horas propias y sin jornada (el de fuerza en sábado): de lo primero a lo último */
  const bs=key?bloquesTrabajo(key,inf):[];
  if(bs.length){const a=bs[0].de,b=bs[bs.length-1].a;return hCorta(hm(a))+'–'+(b>=1440?'24':hCorta(hm(b)));}
  return '';}
function agendaDia(key,inf){
  inf=inf||dayInfo(key);
  const sh=shiftById(inf.shiftId),out=[];
  const add=function(hora,fin,ico,txt,sub,tipo,color,extra){
    const m=mins(hora);if(m==null)return;
    out.push(Object.assign({m:m,hora:hora,fin:fin||'',ico:ico,txt:txt,sub:sub||'',tipo:tipo,color:color},extra||{}));};
  const sl=sleepOf(key,inf);
  if(sl.siesta)add(sl.siesta.de,sl.siesta.a,'😴','Siesta',fmtHM(sl.siesta.min),'sleep',tlColor('sleep'));
  else if(sl.wake)add(sl.wake,'','⏰','Levantarse',sl.h!=null?(fmtHM(sl.h*60)+' de sueño'):'','sleep',tlColor('sleep'));
  const rt=rutinaDeFecha(key);
  let hayEntreno=false;
  const rot=monthService(+key.slice(0,4),+key.slice(5,7)-1).service;
  bloquesTrabajo(key,inf).forEach(function(b){
    const fin=b.a>=1440?'':hm(b.a);
    if(/^entreno/.test(b.txt||'')){hayEntreno=true;
      add(hm(b.de),fin,'💪','Entreno'+(rt?(' · '+rt.nombre):''),'','gym',tlColor('gym'));}
    else if(b.tipo==='guard'&&b.de===0)add(hm(b.a),'','🚪','Sales de la guardia',b.pase?'con el pase':'','guard',tlColor('guard'));
    else if(b.tipo==='guard'){const g=guardiaHoras(key,inf.guard);
      add(hm(b.de),g&&g.sale?g.sale:'','🩺','Guardia'+(inf.guard?(' '+gTipo(inf.guard).label):''),
        g&&g.sale?('sales mañana a las '+g.sale):'','guard',tlColor('guard'));}
    else add(hm(b.de),fin,'💼','Trabajo'+(rot?(' · '+rot):''),'','work',tlColor('work'));});
  if(rt&&!hayEntreno&&gymS().hora)
    add(gymS().hora,hm(mins(gymS().hora)+(+gymS().duracion||75)),'💪','Entreno · '+rt.nombre,'','gym',tlColor('gym'));
  const s2=diaSegundo(key,inf);
  if(s2&&s2.on)add(s2.hora,'','🏊',(s2.tipo||'entreno').replace(/^./,function(c){return c.toUpperCase();}),'segundo entreno','gym',tlColor('gym'));
  eventosDeFecha(key).forEach(function(ev){
    if(ev.hora)add(ev.hora,ev.fin||'','📌',ev.titulo||'Evento','','evt',ev.color||tlColor('evt'));});
  tomasDelDia(key,inf).forEach(function(t){
    const info=slotItems(t.sh.id,t.slot);
    const platos=info.items.map(function(it){const dd=dishById(it.id);return dd?dd.name:'';}).filter(Boolean).join(' + ');
    add(t.hora,'',t.ico,t.label||'Comida',platos,'meal',tlColor('meal'),{slot:t.slot,sh:t.sh,conPlatos:info.items.length>0});});
  if(sl.bed){const bm=mins(sl.bed),wm=mins(sl.wake);
    const tarde=bm!=null&&wm!=null&&bm<wm;   /* a la cama pasada la medianoche: va al final del día */
    add(sl.bed,'','🛌','A la cama','','sleep',tlColor('sleep'),{m2:tarde?bm+1440:bm});}
  out.forEach(function(x){if(x.m2==null)x.m2=x.m;});
  return out.sort(function(a,b){return a.m2-b.m2;});}
function finMin(x){const f=mins(x.fin);if(f==null)return x.m2;return f<x.m?f+1440:f;}
/* los días que enseña «Semana»: desde hoy (o desde el día al que te hayas movido) los que elijas
   —5, 7, 10 o 14—, y aparte el de ayer, plegado. «La semana» ya no es de lunes a domingo: el
   lunes por la tarde no quieres ver el lunes, quieres ver lo que viene. */
const SEM_DIAS=[5,7,10,14];
function semDias(){const n=+store.rotation.semanaDias;return SEM_DIAS.indexOf(n)>=0?n:7;}
function semDesde(){return parseDate(ui.semDesde||'')||parseDate(iso(new Date()));}
function diaObj(d){
  const k=iso(d),inf=dayInfo(k),r=store.rotation;
  const legacy=(r.shiftByDay&&r.shiftByDay[k]!==undefined)?r.shiftByDay[k]:null;
  return {date:d,key:k,label:DAYN[(d.getDay()+6)%7],short:DAYSH[(d.getDay()+6)%7],sub:d.getDate()+' '+MON[d.getMonth()],
    shiftId:inf.shiftId||(typeof legacy==='string'?legacy:null),guard:inf.guard,inf:inf};}
function semanaVentana(){
  if(store.rotation.mode!=='date')return weekDays();
  const a=semDesde(),n=semDias(),out=[];
  for(let i=0;i<n;i++)out.push(diaObj(addDays(a,i)));
  return out;}
function semRangoTxt(){
  const a=semDesde(),b=addDays(a,semDias()-1);
  return DIA3[a.getDay()]+' '+a.getDate()+' '+MON[a.getMonth()]+' → '+DIA3[b.getDay()]+' '+b.getDate()+' '+MON[b.getMonth()];}
function moverSemana(n){
  const a=addDays(semDesde(),n);
  ui.semDesde=iso(a)===iso(new Date())?'':iso(a);
  weekDate=mondayOf(a);}
/* ===================== render: semana ===================== */
function resumenSemana(){
  /* una línea en vez de la tarjeta entera: qué patrón se está aplicando y de dónde sale */
  const r=store.rotation,p=store.patterns[r.pattern];
  if(r.mode==='date')
    return 'Por fecha · ciclo de '+store.patterns.length+' semana(s)'+(r.anchor?(', anclado al '+r.anchor):', sin anclar todavía')+'.';
  return 'Plantilla'+(p?(' · '+p.name):'')+'. Los días no llevan fecha: para eso, «por fecha · rotación».';}
function semanaConfigHTML(){
  /* Todo esto vivía encima de la semana y ocupaba el 110 % de la pantalla del móvil: había que
     hacer scroll de una pantalla entera de ajustes antes de ver el lunes. Es configuración, así que
     ahora vive en «Turno y rotación», que es donde el usuario la va a buscar. */
  const r=store.rotation;
  return '<div class="card" data-cfg="semana"><h2>Cómo se arma tu semana</h2>'+
    '<p class="note">Lo que decide qué día es cada día en la vista «Semana».</p>'+
    '<div class="row">'+
      '<button class="btn s '+(r.mode==='template'?'p':'')+'" data-a="mode-template">Plantilla (1 o 2 guardias)</button>'+
      '<button class="btn s '+(r.mode==='date'?'p':'')+'" data-a="mode-date">Por fecha · rotación</button>'+
      (r.mode==='template'
        ?('<select id="patSel" data-a="pat-sel" style="max-width:260px">'+store.patterns.map(function(p,i){
            return '<option value="'+p.id+'" '+(i===r.pattern?'selected':'')+'>'+esc(p.name)+'</option>';}).join('')+'</select>')
        :('<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink2)">lunes de ref.'+
          '<input type="date" value="'+esc(r.anchor||'')+'" data-a="rot-anchor" style="width:145px"></label>'+
          '<button class="btn s" data-a="today">hoy</button>'))+
      '<span class="sp"></span>'+
      '<button class="btn s" data-a="autofill">Autocompletar semanas desde mi turno</button>'+
    '</div>'+
    (store.patterns[r.pattern]&&r.mode==='template'
      ?('<p class="note" style="margin:10px 0 0">'+esc(store.patterns[r.pattern].note||'')+
        ' Cambia cualquier día en «Semana» y todo se adapta: menús, tandas y compra.</p>')
      :(r.mode==='date'
        ?('<p class="note" style="margin:10px 0 0">Ciclo de '+store.patterns.length+' semana(s): <b>'+
          esc(store.patterns.map(function(p){return p.days.join('·');}).join('  |  '))+
          '</b>. Ancla la rotación al lunes de una semana con 1 guardia.</p>')
        :''))+
    (store.patterns.length>1?rotationStrip():'')+
    '<div class="row" style="margin-top:10px"><button class="btn s" data-a="tab" data-t="week">ver mi semana →</button></div>'+
  '</div>';}
function semanaNavHTML(){
  /* La misma navegación que ya tienen Mes («‹ septiembre 2026 › mes actual») y Hoy («‹ jue · volver
     a hoy · sáb ›»), pero dentro de la pantalla. En «Semana» las flechas vivían SOLO en la barra de
     arriba: si no mirabas ahí, no había manera de ver la semana que viene.
     En modo plantilla los días no llevan fecha, así que no hay semana anterior ni siguiente: ahí lo
     que se ofrece es pasarse a «por fecha», que es lo que hace falta para poder moverse. */
  /* Va como TIRA FINA, no como tarjeta: «Semana empieza por los días» es una decisión tomada y hay
     una prueba que la fija (menos de 60 px por delante del primer día). Una tarjeta con su relleno
     metía 106 px y empujaba los siete días fuera de la primera pantalla. El rango del día no se
     repite aquí: ya está en el rótulo de la barra de arriba. */
  if(store.rotation.mode!=='date')
    return '<div class="semnav">'+
      '<span class="mini">Modo <b style="color:var(--ink)">plantilla</b>: los días no llevan fecha.</span>'+
      '<span class="sp"></span>'+
      '<button class="btn p s" data-a="mode-date">ver mi semana real</button></div>';
  /* el rango se lee de un vistazo («vie 25 sep → jue 1 oct») y al tocarlo abre el calendario del
     móvil para saltar a otra fecha: el <input type=date> va encima, transparente */
  const n=semDias(),esHoy=!ui.semDesde;
  return '<div class="semnav">'+
    '<button class="btn s" data-a="wk-prev" title="'+n+' días antes" aria-label="'+n+' días antes">‹</button>'+
    '<label class="semrango"><span>'+esc(semRangoTxt())+'</span>'+
      '<input type="date" value="'+esc(iso(semDesde()))+'" data-a="wk-set" aria-label="empezar en otra fecha"></label>'+
    '<button class="btn s" data-a="wk-next" title="'+n+' días después" aria-label="'+n+' días después">›</button>'+
    (esHoy?'':'<button class="btn s" data-a="today">hoy</button>')+
    '</div>';}
function semOpcHTML(){
  const n=semDias();
  return '<div class="semopc"><span class="mini">ver</span>'+SEM_DIAS.map(function(x){
    return '<button class="btn s'+(x===n?' p':'')+'" data-a="sem-dias" data-n="'+x+'" aria-pressed="'+(x===n)+'">'+x+'</button>';}).join('')+
    '<span class="mini">días</span></div>';}
function semanaCabeceraHTML(){
  /* el eje de horas y qué es cada color, UNA vez para todos los días (y la leyenda plegada): antes
     cada día repetía su eje, y la leyenda no estaba en ninguna parte */
  const eje=tlHoras()>=24?('<div class="tl-axis semeje">'+[0,6,12,18,24].map(function(h,i){
    return '<span style="'+(i===0?'left:0;transform:none':(i===4?'right:0;left:auto;transform:none':'left:'+(h/24*100)+'%'))+'">'+h+'</span>';}).join('')+'</div>'):'';
  /* en una fila: la leyenda plegada a la izquierda y cuántos días ver a la derecha; debajo, el eje */
  return '<div class="leyfila semley"><details class="dtip"><summary class="mini">ⓘ colores</summary>'+franjaLeyendaHTML()+'</details>'+
    semOpcHTML()+'</div>'+eje;}
function leyendaPlegadaHTML(cls){
  /* la leyenda plegada, con el atajo a cambiar los colores A LA VISTA al lado: plegado dentro no
     se podía pulsar sin abrirla antes */
  return '<div class="leyfila '+cls+'"><button class="btn s leyatajo" data-a="franja-cfg">colores ▸</button>'+
    '<details class="dtip"><summary class="mini">ⓘ qué es cada color</summary>'+franjaLeyendaHTML()+'</details></div>';}
function semanaFilaHTML(d,i,anyDate){
  /* un día: nombre y horas arriba, la franja con lo que es cada bloque escrito dentro, las dos
     horas del sueño, las comidas con su hora y, en filas, lo que tiene hora de empezar y de acabar
     (entreno, sesiones, eventos). Los números de la comida van dentro, al abrirlo. */
  const sh=shiftById(d.shiftId);
  const kk=d.key||('tpl'+d.idx);
  const open=ui.openDays.has(kk);
  const hh=horasCortasDia(d.key,d.inf||{},sh);
  const head='<span class="drday">'+(d.key?(d.short+' '+d.date.getDate()):d.label)+'</span>'+
    '<span class="drtag" style="color:'+(sh?sh.color:'var(--ink2)')+'">'+
      (sh?esc(sh.icon)+' '+esc(sh.name)+(d.guard?' '+esc(gTipo(d.guard).label):'')+(hh?'<span class="drh"> · '+esc(hh)+'</span>':''):'sin asignar')+'</span>'+
    (isToday(d.key)?'<span class="hoychip">hoy</span>':'')+
    '<span class="sp"></span><span class="mini">'+(open?'▴':'▾')+'</span>';
  const tomas=tomasDelDia(d.key||'',d.inf,d.shiftId);
  const comidas=tomas.length?('<div class="drcom">'+tomas.map(function(t){
    return '<span class="pl com" title="'+esc(t.label)+'">'+t.ico+' <b>'+esc(hCortaHM(t.hora))+'</b></span>';}).join('')+'</div>'):'';
  const filas=d.key?agendaDia(d.key,d.inf).filter(function(x){return x.tipo==='gym'||x.tipo==='evt';}):[];
  let est='';
  if(d.key){try{const nr=estTocaHoy(d.key);if(nr&&nr.length)est='<div class="drev est"><i style="background:var(--brand2)"></i><span class="h">repaso</span><span class="pl est">📚 '+nr.length+' tema'+(nr.length===1?'':'s')+'</span></div>';}catch(e){}}
  const evs=filas.map(function(x){
    return '<div class="drev"><i style="background:'+esc(x.color)+'"></i>'+
      '<span class="h">'+esc(hCortaHM(x.hora))+(x.fin?'–'+esc(hCortaHM(x.fin)):'')+'</span>'+
      '<span class="pl '+(x.tipo==='gym'?'gym':'evt')+'">'+x.ico+' '+esc(x.txt)+'</span></div>';}).join('');
  const t=sh?totals((function(){const out=[];slotsFor(sh.id).forEach(function(sl){out.push.apply(out,slotItems(sh.id,sl).items);});return out;})()):null;
  const det='<div class="drdet">'+
      (sh?'<p class="mini" style="margin:0 0 6px">'+t.kcal+' kcal · '+t.parts+' rac.'+
        (d.key&&foodLog(d.key).length?(' · 🍽 '+foodTotals(d.key).kcal+' kcal apuntadas'):'')+'</p>':'')+
      (sh?mealRowsCompactHTML(d,sh):'<div class="empty">Día sin asignar: elige qué es (y si toca guardia, de qué).</div>')+
      '<div class="row" style="margin-top:9px">'+
        (sh?'<button class="btn s" data-a="day-edit" data-id="'+sh.id+'">abrir menús de este tipo de día</button>':'')+
        (anyDate&&d.key?'<button class="btn s" data-a="mon-day" data-key="'+d.key+'">cambiar qué día es</button>':
          ('<select data-a="day-pick" data-i="'+i+'" onchange="PG.render()" style="max-width:190px">'+
            '<option value="">— sin día —</option>'+store.shifts.map(function(x){
              return '<option value="'+x.id+'" '+(x.id===d.shiftId?'selected':'')+'>'+esc(x.icon)+' '+esc(x.name)+'</option>';}).join('')+'</select>'))+
        (sh&&d.key?'<button class="btn s" data-a="day-quickbf" data-id="'+sh.id+'">desayuno rápido de diario</button>':'')+
        (sh&&d.key?'<button class="btn s" data-a="day-rhythm" data-key="'+d.key+'">cambiar las horas de dormir</button>':'')+
      '</div></div>';
  return '<div class="drow'+(open?' open':'')+(isToday(d.key)?' today':'')+'" style="border-left-color:'+(sh?sh.color:'var(--line)')+'">'+
    '<div class="drmain" data-a="day-open" data-key="'+kk+'" role="button" tabindex="0" aria-expanded="'+(open?'true':'false')+'">'+head+'</div>'+
    (d.key&&sh?timelineBar(d.key,d.inf,{grande:true,sinEje:tlHoras()>=24}):'')+
    '<div class="drsol">'+horasSuenoHTML(d.key||'',d.inf,d.shiftId)+(d.key?solPiesHTML(d.key):'')+'</div>'+
    ((comidas||evs||est)?('<div class="drplan">'+comidas+evs+est+'</div>'):'')+
    (open?det:'')+'</div>';}
function hCortaHM(t){/* «6:55», «15:30», «21:00»: sin el cero delante, que es lo que más se lee */
  const m=mins(t);if(m==null)return t||'';return Math.floor(m/60)+':'+String(m%60).padStart(2,'0');}
function mealRowsCompactHTML(d,sh){
  return slotsFor(sh.id).map(function(x){
    const inf=slotItems(sh.id,x),tt=totals(inf.items),bs=[];
    Object.keys(dishQty(inf.items)).forEach(function(idx){const dd=dishById(idx);
      if(dd&&isBatch(dd.batchId)&&bs.indexOf(dd.batchId)<0)bs.push(dd.batchId);});
    const dishTxt=inf.items.map(function(it){const dd=dishById(it.id);if(!dd)return '';const q=num(it.portions,1);
      return esc(dd.icon)+' '+esc(dd.name)+(q!==1?' ('+rac(q)+')':'');}).filter(Boolean).join(' + ')||'<i>sin asignar</i>';
    const hora=d.key?horaDeToma(d.key,x):(x.time||'');
    return '<div class="meal compact"><span class="mt">'+esc(hora||'·')+'</span><span>'+
      '<span class="ml">'+esc(x.label||'')+'</span><span class="mn">'+dishTxt+'</span>'+
      '<span class="md">'+esc(inf.name?('🍱 '+inf.name+' · '):'')+esc(tt.kcal?(tt.kcal+' kcal · '+tt.prot+' g P'):'')+
      bs.map(function(b){return ' <span class="tag '+tagFor(b)+'">'+esc((batchById(b)||{}).label||'')+'</span>';}).join('')+
      '</span></span></div>';}).join('');}
function semanaAyerHTML(){
  /* el día de antes de la ventana, plegado en una línea: para mirar qué hiciste sin que empuje hoy
     hacia abajo. Tocarlo lo abre entero. */
  if(store.rotation.mode!=='date')return '';
  const d=diaObj(addDays(semDesde(),-1)),sh=shiftById(d.shiftId);
  if(ui.semAyer)return '<div class="semayer-abierto">'+semanaFilaHTML(d,-1,true).replace('class="drow','class="drow ayer')+
    '<button class="btn s" data-a="sem-ayer" style="margin-top:4px">plegar '+(ui.semDesde?'el día anterior':'ayer')+' ▴</button></div>';
  const evs=eventosDeFecha(d.key);
  return '<button class="dayer" data-a="sem-ayer" style="border-left-color:'+(sh?sh.color:'var(--line)')+'">'+
    '<span class="drday">'+(ui.semDesde?(d.short+' '+d.date.getDate()):('Ayer '+d.date.getDate()))+'</span>'+
    '<span class="drtag" style="color:'+(sh?sh.color:'var(--ink2)')+'">'+(sh?esc(sh.icon)+' '+esc(sh.name):'sin asignar')+'</span>'+
    (evs.length?'<span class="mini">· '+esc((evs[0].hora?hCortaHM(evs[0].hora)+' ':'')+evs[0].titulo)+(evs.length>1?' +'+(evs.length-1):'')+'</span>':'')+
    '<span class="sp"></span><span class="mini">▸</span></button>';}

function renderWeek(){
  const days=semanaVentana();   /* la rotación ya no se toca aquí: vive en semanaConfigHTML() */
  const sleepStats=(function(){const c=suenoCfg();return function(){
    let n=0,t=0,low=0;const min=c.min;
    days.forEach(function(d){if(!d.date)return;const sl=sleepOf(d.key);
      if(sl.h==null||!d.shiftId)return;n++;t+=sl.h;if(sl.h<min)low++;});
    return {n:n,avg:n?Math.round(t/n*10)/10:null,low:low,min:min};};})();
  const anyDate=days.some(function(d){return !!d.date;});
  const ss=sleepStats();
  const rows=days.map(function(d,i){return semanaFilaHTML(d,i,anyDate);}).join('');
    const pb=planBatches(weekDays()), used=Object.keys(pb).map(k=>pb[k]).filter(b=>b.hasNeed);
  const g=days.filter(function(d){const sh=shiftById(d.shiftId);return sh&&isGuardia(sh)&&(!d.guard||true);}).length;
  const tot=days.reduce((a,d)=>{a.k+=dayTotals(d.shiftId).kcal;return a;},{k:0});
  $('#main').innerHTML=`<div class="grid">
    <div class="semcab">${semanaNavHTML()}${anyDate?semanaCabeceraHTML():''}</div>
    <div class="daylist">${semanaAyerHTML()}${rows}</div>
    <div class="card"><h2>La semana en números</h2>
      <div class="tot">
        <div><b>${g}</b><span>guardia${g===1?'':'s'}</span></div>
        <div><b>${used.length}</b><span>sesiones de cocina</span></div>
        <div><b>${anyDate&&ss.avg!=null?ss.avg+' h':(g?Math.round(tot.k/days.length):0)}</b><span>${anyDate&&ss.avg!=null?'sueño de media':'kcal/día de media'}</span></div>
      </div>
      <p class="mini" style="margin:10px 0 0">${esc(resumenSemana())}</p>
      ${anyDate&&ss.low?`<p class="mini" style="margin:5px 0 0;color:var(--warn)">${ss.low} noche(s) por debajo de ${ss.min} h.</p>`:''}
      ${g>0&&used.length===0?'<p class="note" style="margin:8px 0 0;color:var(--warn)">⚠ Hay días de guardia pero ningún plato marcado como lote: se comería cocinando de cero cada día.</p>':''}
      <div class="row" style="margin-top:10px">
        <button class="btn s" data-a="ir-semana-cfg">⚙️ patrón y rotación</button>
        <button class="btn s" data-a="wk-expand-all">${allOpen()?'cerrar todos':'abrir todos'}</button>
        ${anyDate?'':'<button class="btn s" data-a="mode-date">ver mi semana real</button>'}
        <button class="btn s" data-a="tab" data-t="month">el mes →</button>
      </div>
    </div>
    <div class="grid g2">
      <div class="card"><h2>Lo que hay que cocinar esta semana</h2>
        <p class="note">Un bloque por sesión de cocina: qué pones al fuego ese día y cuántos tápers salen de cada cosa. Lo que sobre de una tanda va al congelador.</p>
        ${used.length?used.map(b=>`<div class="cocblq">
          <div class="tarj-top">
            <b style="font-size:13.5px">${esc(b.label)}</b>
            <span class="sp"></span>
            <span class="tag b2">${b.portions} raciones</span></div>
          <div class="row" style="margin-top:3px">
            <span class="mini">${esc(b.when||'')}</span>
            <span class="sp"></span>
            <button class="btn s" data-a="tab" data-t="batches">abrir →</button></div>
          <div class="platos">${b.items.filter(i=>i.runs>0).map(function(i){
            const sobra=i.cooked>i.needPort?Math.round((i.cooked-i.needPort)*10)/10:0;
            return '<div class="plato" title="'+esc(i.dish.name)+'">'+
              '<span class="pic">'+esc(i.dish.icon||'🍽')+'</span>'+
              '<b>'+esc(i.dish.name)+'</b>'+
              '<span class="mini">'+fmt(i.cooked)+' rac.</span>'+
              (sobra?'<span class="tag b4">sobran '+fmt(sobra)+' 🧊</span>':'')+
              '</div>';}).join('')}</div>
          </div>`).join('')
        :'<div class="empty">Nada en lote esta semana.</div>'}
      </div>
      <div class="card"><h2>Reglas de oro</h2><p class="note">Lo que sostiene el planning cuando la semana se tuerce.</p>
        <details class="dtip"><summary class="mini">ver las ${store.rules.length} reglas</summary>
        <ul style="margin-top:8px">${store.rules.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>
        <div class="row no-print" style="margin-top:10px"><button class="btn s" data-a="rules">Editar reglas</button></div></div>
    </div></div>`;
}

/* ===================== render: mes (calendario y guardias) ===================== */
let monthDate=new Date(new Date().getFullYear(),new Date().getMonth(),1,12,0,0,0);
function vacRangeRow(v,ix){
  let a=parseDate(v.start),b=parseDate(v.end);
  if(a&&b&&b<a){const t=a;a=b;b=t;}   /* datos antiguos guardados al revés: se muestran ya girados */
  const n=(a&&b)?Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/86400000)+1:0;
  return '<div class="row" style="padding:5px 0;border-top:1px dashed var(--line);font-size:13px">'+
    '<b style="min-width:150px">'+(a?a.getDate()+' '+MON[a.getMonth()]:'?')+' → '+(b?b.getDate()+' '+MON[b.getMonth()]:'?')+'</b>'+
    '<span class="mini">'+n+' día(s)'+(v.label?' · '+esc(v.label):'')+'</span>'+
    '<span class="sp"></span><button class="btn s" data-a="vac-del" data-ix="'+ix+'">quitar</button></div>';}
function vacCardMonth(y,mo,list){
  const vs=store.rotation.vacaciones||[];
  const toc=vs.filter(function(v){const a=parseDate(v.start),b=parseDate(v.end);
    return a&&b&&a<=new Date(y,mo+1,0,12)&&b>=new Date(y,mo,1,12);}).length;
  const first=new Date(y,mo,1,12),last=new Date(y,mo,Math.min(new Date(y,mo+1,0).getDate(),7),12);
  /* Se podían meter varios periodos desde el principio —es una lista— pero todo estaba escrito en
     singular («marca el rango», «marcar») y la lista quedaba dos pantallas más abajo, así que daba
     la impresión de que solo cabía uno y que el segundo pisaba al primero. */
  return '<div class="card" data-cfg="vac"><h2>🏖️ Tus vacaciones'+
      (vs.length?' <span class="tag b2">'+vs.length+' periodo'+(vs.length===1?'':'s')+'</span>':'')+'</h2>'+
    '<p class="note">Puedes apuntar <b>todos los periodos que quieras</b> —Semana Santa, verano, unos días sueltos— '+
    'y se van sumando a la lista. Esos días no cuentan jornada ni guardias. Lo que pongas a mano en un día concreto manda sobre el periodo.</p>'+
    (vs.length?'<div style="margin-bottom:10px">'+vs.map(vacRangeRow).join('')+'</div>'
      :'<div class="empty" style="margin-bottom:10px">Sin vacaciones apuntadas todavía.</div>')+
    '<div class="row" style="margin-top:6px"><label class="fld">Desde<input type="date" id="vacA" value="'+iso(first)+'"></label>'+
    '<label class="fld">Hasta<input type="date" id="vacB" value="'+iso(last)+'"></label>'+
    '<label class="fld" style="flex:1">Nombre<input id="vacL" placeholder="verano, Semana Santa, puente de mayo…"></label>'+
    '<button class="btn p" data-a="vac-add">+ añadir '+(vs.length?'otro periodo':'periodo')+'</button></div>'+
    '<div class="row" style="margin-top:8px"><span class="mini">en '+MONTH_FULL[mo]+': '+toc+' rango(s) que caen aquí · '+
      (list||[]).filter(function(d){return d.vac;}).length+' día(s) marcados</span></div></div>';}
function jornadaCard(){
  const j=store.rotation.jornada||{start:'',end:'',workdays:[1,2,3,4,5]},vs=store.rotation.vacaciones||[];
  const DN=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  return '<div class="card" data-cfg="jornada"><h2>2b · La jornada de diario y tus vacaciones</h2>'+
    '<p class="note"><b>Base de todos los meses:</b> se trabaja de '+(j.start||'—')+' a '+(j.end||'—')+' los días marcados abajo. '+
    'Se da por hecha en cada mes en los días de trabajar que no tengan hora propia; el saliente, las vacaciones y lo que marques tú en el calendario no la llevan.</p>'+
    '<div class="row"><label class="fld">Entrada<input type="time" value="'+esc(j.start||'')+'" data-a="jor-f" data-f="start"></label>'+
    '<label class="fld">Salida<input type="time" value="'+esc(j.end||'')+'" data-a="jor-f" data-f="end"></label>'+
    '<span class="sp"></span><span class="mini">días con jornada:</span>'+DN.map(function(nm,ix){
      const on=(j.workdays||[]).indexOf(ix)>=0;
      return '<button class="btn s '+(on?'p':'')+'" data-a="jor-day" data-day="'+ix+'">'+nm+'</button>';}).join('')+'</div>'+
    '<p class="mini" style="margin-top:8px">🏖️ <b>Vacaciones</b> (lo mismo está en «Mes», con el calendario delante):</p>'+
    '<div class="row" style="margin-top:4px"><label class="fld">Desde<input type="date" id="vacA2"></label>'+
    '<label class="fld">Hasta<input type="date" id="vacB2"></label>'+
    '<label class="fld" style="flex:1">Nombre<input id="vacL2" placeholder="verano…"></label>'+
    '<button class="btn p" data-a="vac-add2">añadir</button></div>'+
    (vs.length?'<div style="margin-top:6px">'+vs.map(vacRangeRow).join('')+'</div>'
      :'<p class="mini" style="margin-top:4px">Ninguna apuntada: cuando cojas días, mete el rango y se marcan solos en el mes.</p>')+
    '</div>';}
function serviciosEditorHTML(){
  /* el mismo editor sirve en «Turno y rotación» y en Ajustes: el usuario pedía poder tocar las
     rotaciones nuevas (R2) desde Ajustes sin buscarlas en otra pantalla */
  const r=store.rotation;
  return '<div class="svcls">'+(r.servicios||[]).map(function(x,ix){
    const mes=svcMesesDe(x,1);
    return '<div class="svcrow" style="--svc:'+svcColor(x)+'">'+
      '<i class="svcdot"></i>'+
      '<input value="'+esc(x)+'" data-a="svc-edit" data-ix="'+ix+'" aria-label="nombre del servicio">'+
      '<select data-a="svc-meses" data-ix="'+ix+'" aria-label="cuántos meses dura">'+
        [1,2,3,4,5,6].map(function(n){return '<option value="'+n+'" '+(mes===n?'selected':'')+'>'+n+' mes'+(n===1?'':'es')+'</option>';}).join('')+
      '</select>'+
      '<button class="btn d" data-a="svc-del" data-ix="'+ix+'" title="quitar">×</button>'+
      '</div>';}).join('')+'</div>'+
    '<div class="row" style="margin-top:8px"><button class="btn s" data-a="svc-add">+ Añadir rotación</button></div>';}
function anyoServiciosHTML(ciclo,cur){
  /* «que aparezcan los meses del año que quedan y así saber en qué roto»: una tira de meses con el
     color de su servicio en vez de una tabla de tres columnas */
  if(!ciclo.length)return '';
  const hoyK=iso(new Date()).slice(0,7);
  let out='',i=0;
  while(i<ciclo.length){
    const serv=((cur[ciclo[i].key]||{}).service)||ciclo[i].service;
    let j=i;while(j+1<ciclo.length&&(((cur[ciclo[j+1].key]||{}).service)||ciclo[j+1].service)===serv)j++;
    const meses=ciclo.slice(i,j+1);
    const activo=meses.some(function(c){return c.key===hoyK;});
    out+='<div class="svcblq'+(activo?' ahora':'')+'" style="--svc:'+svcColor(serv)+'" '+
      'title="'+esc(serv)+': '+meses.map(function(c){return MON[c.m]+' '+c.y;}).join(', ')+'">'+
      '<b>'+esc(serv)+'</b>'+
      '<span>'+meses.map(function(c){return MON[c.m];}).join(' · ')+
        (meses[0].y!==meses[meses.length-1].y?' '+meses[meses.length-1].y:'')+'</span>'+
      (activo?'<span class="tag b2">ahora</span>':'')+
      '</div>';
    i=j+1;}
  return '<div class="svctira">'+out+'</div>';}
function serviciosCard(){
  const r=store.rotation,now=new Date();
  const desde=(document.getElementById('svcDesde')||{}).value||now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const hasta=(document.getElementById('svcHasta')||{}).value||(now.getFullYear()+(now.getMonth()>5?1:0))+'-06';
  const dm=/^(\d{4})-(\d{2})$/.exec(desde),hm=/^(\d{4})-(\d{2})$/.exec(hasta);
  const ciclo=dm&&hm?cicloServicios(+dm[1],+dm[2]-1,+hm[1],+hm[2]-1,1,r.servicios):[];
  const cur=store.rotation.month||{};
  const j=r.jornada||{};
  return '<div class="card" data-cfg="servicios"><h2>🔁 Tus rotaciones</h2>'+
    anyoServiciosHTML(ciclo,cur)+
    '<p class="mini" style="margin-top:8px">El servicio del mes no toca tu calendario: los días de trabajar siguen con la jornada de '+
      esc(j.start||'—')+' a '+esc(j.end||'—')+' y solo cambia dónde vas.</p>'+
    '<details class="dtip" style="margin-top:10px"><summary class="mini">cambiar las rotaciones y el reparto ▾</summary>'+
      serviciosEditorHTML()+
      '<div class="fgrid c3 tight" style="margin-top:10px">'+
        '<label class="fld">Empieza en<input type="month" id="svcDesde" value="'+desde+'" data-a="svc-m"></label>'+
        '<label class="fld">Hasta<input type="month" id="svcHasta" value="'+hasta+'" data-a="svc-m"></label>'+
        '<label class="fld">Guardias por mes<input type="number" min="0" max="15" value="'+(r.guardiasMes!=null?r.guardiasMes:6)+'" data-a="guard-default"></label>'+
      '</div>'+
      '<div class="row" style="margin-top:8px"><button class="btn p" data-a="svc-plan">repartir el ciclo</button>'+
      '<button class="btn s" data-a="svc-clear">quitar el reparto</button></div>'+
    '</details>'+
    '</div>';}
function mesRejilla(y,mo,lead){
  /* los días que pinta la cuadrícula de Mes: la semana entera de antes del día 1, el mes, y la
     semana entera de después del último. Cada día sale de monthDays() de SU mes, así que trae lo
     mismo que los del mes (tipo de día, guardia, jornada, sueño). */
  let ini=new Date(y,mo,1-lead-7,12,0,0,0);
  const ult=new Date(y,mo+1,0,12,0,0,0);
  const cola=6-((lead+ult.getDate()-1)%7);
  let fin=new Date(y,mo+1,cola+7,12,0,0,0);
  /* el mes en el que ESTÁS no va del día 1 al 30: va con la semana. «Que se mueva según las semanas,
     que solo vea 2 anteriores a la que estoy y la mayoría delante»: dos semanas antes de la de hoy,
     la de hoy y cuatro más. Al pasar el lunes, la cuadrícula corre sola una fila. Los otros meses
     (con ‹ ›) siguen enseñándose enteros, con una semana de margen a cada lado. */
  const hoy=new Date(),movil=(y===hoy.getFullYear()&&mo===hoy.getMonth());
  let semHoy='';
  if(movil){
    const domFirst=store.rotation.calWeekStart==='dom';
    const h=new Date(hoy.getFullYear(),hoy.getMonth(),hoy.getDate(),12,0,0,0);
    const inicio=addDays(h,-(domFirst?h.getDay():(h.getDay()+6)%7));
    semHoy=iso(inicio);
    ini=addDays(inicio,-14);fin=addDays(inicio,5*7-1);}
  const out=[];
  out.movil=movil;out.semHoy=semHoy;
  for(let d=new Date(ini.getTime());d<=fin;d=addDays(d,1)){
    const m=d.getMonth(),yy=d.getFullYear(),k=iso(d);
    const x=monthDays(yy,m).filter(function(o){return o.key===k;})[0];
    if(x)out.push(x);}
  return out;}
function renderMonth(){
  const y=monthDate.getFullYear(),mo=monthDate.getMonth(),svc=monthService(y,mo),g=guardCount(y,mo);
  const domFirst=store.rotation.calWeekStart==='dom';
  const list=monthDays(y,mo),lead=domFirst?new Date(y,mo,1).getDay():(new Date(y,mo,1).getDay()+6)%7;
  const WDH=domFirst?['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const cells=[];
  /* «quiero ver dos semanas más, una del mes anterior y otra del siguiente»: la cuadrícula ya no
     empieza en el día 1 con huecos vacíos delante, sino una semana entera antes, y acaba una semana
     entera después. Los días de fuera van en su color pero apagados (.fuera), y se pueden tocar
     igual. Las cuentas del mes (guardias, vacaciones, sueño) siguen saliendo de `list`, solo del mes. */
  const rejilla=mesRejilla(y,mo,lead);
  rejilla.forEach(function(d){
    /* en el mes que se mueve con la semana, lo apagado son las dos semanas ya pasadas (y son las que
       no salen al imprimir: el papel empieza en la semana en la que estás) */
    const previa=rejilla.movil&&d.key<rejilla.semHoy;
    const fuera=rejilla.movil?previa:d.date.getMonth()!==mo;
    const ov=dayOverride(d.key),manual=d.over||(store.rotation.shiftByDay[d.key]!==undefined);
    const seg=d.key?diaSegundo(d.key,d.inf):null;
    const evsDia=d.key?eventosDeFecha(d.key):[];
    /* el usuario pedía ver de un vistazo qué toca cada día en vez de puntitos: además del tipo de
       día van una línea por cosa (jornada, entreno, eventos), cortas y con su color */
    const lineas=[];
    if(d.jor)lineas.push('<span class="dline hr">'+hCorta(d.jor.start)+'–'+hCorta(d.jor.end)+'</span>');
    /* en la casilla caben ocho caracteres, así que la guardia va como «15→8» (empieza → sales) y el
       día de después como «→9:15» (hasta esa hora sigues trabajando). Antes no salía ninguna hora:
       jornadaOf() devuelve null en las guardias y la casilla se quedaba muda justo el día que más
       importa saber a qué hora entras. */
    if(d.key){
      const shD=shiftById(d.shiftId);
      if(shD&&isGuardia(shD)){const g=guardiaHoras(d.key,d.guard);
        if(g)lineas.push('<span class="dline hr" title="entras a las '+esc(g.desde)+
          (g.desde!==g.guardia?(', guardia desde las '+esc(g.guardia)):'')+' y sales a las '+esc(g.sale)+'">'+
          hCorta(g.guardia)+'→'+hCorta(g.sale)+'</span>');}
      else{const sal=salidaDeGuardia(d.key);
        if(sal)lineas.push('<span class="dline hr" title="vienes de guardia: trabajas hasta las '+esc(sal.sale)+'">→'+
          hCorta(sal.sale)+'</span>');}}
    if(seg&&seg.on)lineas.push('<span class="dline gym" title="segundo entreno: '+esc(seg.tipo||'entreno')+' a las '+esc(seg.hora||'—')+'">'+
      '🏊 '+esc(seg.hora||'')+'</span>');
    const rtDia=d.key?rutinaDeFecha(d.key):null;
    if(rtDia)lineas.push('<span class="dline gym" title="entreno: '+esc(rtDia.nombre)+'">🏋 '+esc(nombreCorto(rtDia.nombre))+'</span>');
    /* La casilla mide 53 px de ancho: ahí caben ocho caracteres. Poner el título del evento daba
       «Llegar a», «Vuelo de» —texto que aparenta informar y no informa— y además cada uno se comía
       una línea entera, así que con cuatro eventos la casilla reventaba. Un punto de color por
       evento dice cuántos hay y de qué son, cabe siempre, y el nombre entero está dos sitios más
       abajo: en la lista de eventos del mes y al tocar el día. */
    const nt=d.key?notaDia(d.key):'';
    const marcas=[];
    /* «que quepan aunque sea en pequeño los eventos del día»: con las casillas ya altas, cada evento
       lleva su nombre en letra pequeña —hasta dos líneas, partido por palabras— y la hora DETRÁS:
       delante se comía la primera línea y el nombre se quedaba en «Sesión…». Caben tres; el resto va como «+N» y está entero en la
       lista del mes y al tocar el día. */
    const EVMAX=3;
    const evLineas=evsDia.slice(0,EVMAX).map(function(ev){
      return '<span class="dev'+(evsDia.length===1?' solo':'')+'" title="'+esc((ev.hora?evHoraTxt(ev)+' ':'')+ev.titulo)+'">'+
        '<i class="dpt" style="background:'+esc(ev.color||tlColor('evt'))+'" title="'+
          esc((ev.hora?evHoraTxt(ev)+' ':'')+ev.titulo)+'"></i>'+
        esc(ev.titulo||'evento')+(ev.hora?' <b>'+esc(hCorta(ev.hora))+'</b>':'')+'</span>';}).join('');
    if(evsDia.length>EVMAX)marcas.push('<b class="dmas">+'+(evsDia.length-EVMAX)+'</b>');
    if(nt)marcas.push('<b class="dnota" title="'+esc(nt)+'">📝</b>');
    /* el alquiler, la luz, el gimnasio: si cae ese día, se ve en la casilla como se ven los eventos */
    const gsDia=d.key?gastosDeFecha(d.key):[];
    if(gsDia.length){const n2=new Date(),pend=gsDia.filter(function(g){return !gastoPagado(g,n2.getFullYear(),n2.getMonth());});
      marcas.push('<b class="dgasto'+(pend.length?' pend':'')+'" title="'+
        esc(gsDia.map(function(g){return g.nombre+' '+eur(g.importe);}).join(' · '))+'">€</b>');}
    if(evLineas)lineas.push(evLineas);
    if(marcas.length)lineas.push('<span class="dline marcas">'+marcas.join('')+'</span>');
    cells.push('<button class="dbox'+(d.shiftId?' on':' blank')+(fuera?' fuera':'')+(previa?' semprev':'')+(isToday(d.key)?' today':'')+(ui.monSel===d.key?' sel':'')+'" data-a="mon-day" data-key="'+d.key+'"'+
      ' style="border-top-color:'+(d.color||'var(--line)')+'" title="'+esc(d.name)+(manual?' · puesto a mano':'')+(isToday(d.key)?' · hoy':'')+'">'+
      '<span class="dtop"><span class="dnum">'+d.date.getDate()+((fuera||d.date.getMonth()!==mo)&&d.date.getDate()===1?' '+MON[d.date.getMonth()]:'')+'</span>'+
        (d.shiftId?'<span class="dic">'+esc(d.icon)+'</span>':'')+
        (d.vac?'':'')+
        (manual?'<span class="dman" title="puesto a mano">✎</span>':'')+'</span>'+
      '<span class="dnm">'+(d.shiftId?esc(nombreCorto(d.name)):'·')+'</span>'+
      /* El tipo de guardia ya no va apretado en la fila del número —ahí «UMI» salía partido letra a
         letra, o cortado— sino en su propia línea. La etiqueta «VAC» se ha quitado: el 🏖️ y la
         palabra debajo ya dicen que son vacaciones, y ocupaba un tercio del ancho de la casilla. */
      (d.guard?'<span class="dline gflag" title="tipo de guardia: '+esc(gEtiqueta(d.guard))+'">'+
        esc(String(d.guard).toUpperCase().slice(0,4))+'</span>':'')+
      lineas.join('')+
      (d.sleepH!=null?'<span class="dsl'+(d.sleepH<(store.sueno?store.sueno.min:8)?' low':'')+'">🛌 '+fmtHM(d.sleepH*60)+
        (d.sleepH<(store.sueno?store.sueno.min:8)?' ⚠':'')+'</span>':'')+
      '</button>');});
  const fiascos=list.filter(function(d){return d.shiftId&&d.sleepH!=null&&d.sleepH<(store.sueno?store.sueno.min:8);}).length;
  const conSueño=list.filter(function(d){return d.sleepH!=null;});
  const media=conSueño.length?Math.round(conSueño.reduce(function(a,d){return a+d.sleepH;},0)/conSueño.length*10)/10:null;
  $('#main').innerHTML=`<div class="grid">
    <div class="card calmes"><h2>🗓️ ${rejilla.movil&&rejilla.length&&rejilla[rejilla.length-1].date.getMonth()!==mo
      ?MONTH_FULL[mo]+' – '+MONTH_FULL[rejilla[rejilla.length-1].date.getMonth()]:MONTH_FULL[mo]} de ${y}</h2>
      ${modoAvisoHTML()}
      <div class="mesnav">
        <button class="btn s" data-a="mon-prev" aria-label="mes anterior">‹</button>
        <input type="month" value="${y}-${String(mo+1).padStart(2,'0')}" data-a="mon-set" aria-label="ir a un mes">
        <button class="btn s" data-a="mon-next" aria-label="mes siguiente">›</button>
        <button class="btn s" data-a="mon-today">hoy</button>
        <button class="btn p s" data-a="dia-editar" title="abrir un día con el editor desplegado (o toca cualquier casilla)">✏️ editar</button></div>
      <div class="cal ext">${WDH.map(function(n){return '<span class="wd">'+n+'</span>';}).join('')}${cells.join('')}</div>
      ${ui.monSel?dayPanelHTML(ui.monSel):''}
    </div>
    ${agendaMesHTML(y,mo)}
    ${vacCardMonth(y,mo,list)}
    <div class="card">
      <div class="row" style="margin-top:10px">
        <span class="mini">${(g.por&&g.por.sin)?g.por.sin+' guardia(s) sin tipo · ':''}${!svc.set&&!store.rotation.monthService
          ?'sin servicio puesto'
          :(g.any!==svc.guardias?'⚠ '+g.any+'/'+svc.guardias+' guardias':'cupo cubierto')}</span>
        <span class="sp"></span><button class="btn s" data-a="mon-sync">volcar al calendario de «Semana»</button></div>
      <div class="row" style="margin-top:8px">
        <button class="btn s" data-a="mon-auto">repartir ${svc.guardias} guardias</button>
        <button class="btn s" data-a="mon-clear">vaciar mes</button></div>
      <details class="dtip" style="margin-top:12px"><summary class="mini">ⓘ cómo se calcula este mes ▾</summary>
      <p class="note" style="margin-top:6px"><b>Primero, lo que trabajas:</b> de ${esc((store.rotation.jornada||{}).start||'08:00')} a ${esc((store.rotation.jornada||{}).end||'15:00')} los ${((store.rotation.jornada||{}).workdays||[1,2,3,4,5]).length} días laborables de la semana, en <b>todos</b> los meses, aunque la plantilla no diga nada. Encima van tus guardias (toca un día y márcalo: el día siguiente se queda como saliente solo; ${saltoDiaTxt()}) y tus vacaciones. Cada guardia lleva su <b>tipo</b> —Urgencias o UMI—: <b>no</b> es del servicio del mes, eso es otra cosa y se marca aparte. Lo que marques a mano manda sobre la plantilla y luego lo vuelcas a «Semana».</p>
      </details>
      <details class="dtip" data-cfg="mescfg" style="margin-top:6px"><summary class="mini">configurar este mes (servicio, tipos de guardia, cupo) ▾</summary>
      <div class="row" style="margin-top:8px">
        <button class="btn s" data-a="mon-auto-rep">repartir el mes desde cero</button>
        <span class="mini">tira lo que hayas puesto a mano y vuelve a repartir las ${svc.guardias} guardias según tu plantilla (${saltoDiaTxt()})</span></div>
      <div class="row" style="margin-top:8px">
        <label class="fld">Servicio que rotas este mes<select data-a="mon-svc">
          <option value="" ${svc.set&&svc.service?'':'selected'}>· sin poner: lo marcas tú ·</option>
          ${(store.rotation.servicios||[]).map(function(x){
            return '<option value="'+esc(x)+'" '+(svc.service===x?'selected':'')+'>'+esc(x)+' (guardias de 24 h)</option>';}).join('')}
          </select></label>
        <label class="fld">Guardias este mes<input type="number" min="0" max="15" value="${svc.guardias}" data-a="mon-guard"></label>
        ${gTipos().map(function(t){return '<label class="fld" style="flex:0 0 168px">tipo de guardia · nombre<input value="'+esc(t.label)+'" data-a="gtipo-lbl" data-code="'+t.code+'" placeholder="Urgencias"></label>'+
          '<label class="fld" style="flex:0 0 110px">cuántas de ésas<input type="number" min="0" max="15" value="'+(+store.rotation.cupoTipos[t.code]||0)+'" data-a="gtipo-n" data-code="'+t.code+'"></label>';}).join('')}
        <label class="fld" style="flex:0 0 168px">añadir un tipo más<input id="gtipoNuevo" placeholder="p. ej. Guardias de placa"></label>
        <label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn s" data-a="gtipo-add">+ tipo</button></label>
        <label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn s ${store.rotation.autoPos?'g':''}" data-a="mon-autopos">
          ${store.rotation.autoPos?'✓':'○'} post-guardia automático</button></label></div>
      </details>
      <div class="kpis compact" style="margin-top:8px">
        <button class="kpi-go" data-a="mes-cfg" data-to="mescfg" title="cambiar el cupo de guardias de este mes"><b>${g.any}/${svc.guardias}</b><span>guardias · ${esc(gTiposTxt(g))} ✎</span></button>
        <div><b>${list.filter(function(d){return /saliente/i.test(d.name);}).length}</b><span>días salientes</span></div>
        <button class="kpi-go" data-a="mes-cfg" data-to="jornada" title="cambiar la jornada de diario"><b>${list.filter(function(d){return d.jor||/trabajo|fuerza/i.test(d.name);}).length}</b><span>días de ${esc((store.rotation.jornada||{}).start||'08:00')}–${esc((store.rotation.jornada||{}).end||'15:00')} ✎</span></button>
        <button class="kpi-go" data-a="mes-cfg" data-to="vac" title="apuntar o quitar vacaciones"><b>${list.filter(function(d){return d.vac;}).length}</b><span>días de vacaciones ✎</span></button>
      </div>
      <details class="dtip" style="margin-top:6px"><summary class="mini">ver más números ▾</summary>
      <div class="kpis compact" style="margin-top:8px">
        <div><b>${media||'—'}${media!=null?'h':''}</b><span>sueño de media</span></div>
        <div><b>${fiascos}</b><span>noches con menos de ${store.sueno?store.sueno.min:8} h</span></div>
        <div><b>${list.filter(function(d){return d.over&&d.shiftId;}).length}</b><span>días escritos a mano</span></div>
        <div><b>${acostarsePara(despertarBase())}</b><span>acostarse para ${store.sueno?store.sueno.min:8} h</span></div>
      </div>
      </details>
    </div>
    ${serviciosCard()}
  </div>`;}

/* ===================== entreno: biblioteca de openGym, segundo día y registro ===================== */
const GYM_URL='https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/data/exercises.json';
const GYM_SITIO='https://opengym-bc111a.gitlab.io/#/library';
const GYM_DIAS=['dom','lun','mar','mié','jue','vie','sáb'];
function gymS(){
  if(!store.gym||typeof store.gym!=='object')
    store.gym={biblioteca:[],rutinas:[],registro:[],sesiones:[],cardio:[],fav:[],fuente:'',marks:{},
      segundo:{on:true,dias:[3],tipo:'piscina',hora:'15:30'}};
  const g=store.gym;
  ['biblioteca','registro','fav'].forEach(function(k){if(!Array.isArray(g[k]))g[k]=[];});
  migrarRutinas(g);
  if(!Array.isArray(g.sesiones))g.sesiones=[];
  if(!Array.isArray(g.cardio))g.cardio=[];
  if(!g.segundo||typeof g.segundo!=='object')g.segundo={on:true,dias:[3],tipo:'piscina',hora:'15:30'};
  if(!Array.isArray(g.segundo.dias))g.segundo.dias=[3];
  if(!g.marks||typeof g.marks!=='object')g.marks={};
  if(!Array.isArray(g.objetivos))g.objetivos=[];
  if(!g.cambios||typeof g.cambios!=='object'||Array.isArray(g.cambios))g.cambios={};
  return g;}
function migrarRutinas(g){
  /* gym.rutina (única, sin nombre) -> gym.rutinas[] (varias, con nombre): la rutina que hubiera se
     convierte en la primera rutina con nombre, sin perder ni un ejercicio. Se hace una sola vez: en
     cuanto gym.rutinas ya existe como array (aunque se quede vacío después, p. ej. si el usuario borra
     todas sus rutinas) no se vuelve a tocar — mismo patrón que el resto de migraciones silenciosas de
     normalize(). */
  if(Array.isArray(g.rutinas))return;
  const vieja=Array.isArray(g.rutina)?g.rutina:[];
  g.rutinas=vieja.length?[{id:uid('rt'),nombre:'Mi rutina',notas:'',
    ejercicios:vieja.map(function(r){return {ex:r.ex,series:Math.max(1,+r.series||3),reps:Math.max(1,+r.reps||8),
      pesoObjetivo:Math.max(0,+r.pesoObjetivo||0),descansoSeg:Math.max(0,+r.descansoSeg||90),nota:r.nota||'',
      c:r.c||'',eq:r.eq||'',tg:r.tg||'',msc:r.msc||''};})}]:[];
  delete g.rutina;
}
function gymImportText(txt){
  /* acepta el exercises.json del dataset (array o {exercises:[…]}) y se queda con el índice, sin imágenes */
  let data;
  try{data=JSON.parse(String(txt||'').trim());}catch(e){return {ok:false,msg:'eso no es JSON válido (¿lo pegaste cortado?)'};}
  const arr=Array.isArray(data)?data:(data&&Array.isArray(data.exercises)?data.exercises:null);
  if(!arr)return {ok:false,msg:'no veo la lista de ejercicios: esperaba un array de fichas'};
  const out=[],seen={};
  arr.forEach(function(x){
    if(!x||!x.name)return;
    const nm=String(x.name).trim().slice(0,64);if(!nm)return;
    const key=nm.toLowerCase();if(seen[key])return;seen[key]=1;
    out.push({id:String(x.id||('x'+out.length)).slice(0,12),n:nm,
      c:String(x.category||x.body_part||'').slice(0,20),
      eq:String(x.equipment||'').slice(0,26),
      tg:String(x.target||'').slice(0,26),
      msc:(x.muscles&&Array.isArray(x.muscles.secondary))?x.muscles.secondary.slice(0,3).join(', '):''});});
  if(!out.length)return {ok:false,msg:'no he sacado ni un ejercicio de ahí'};
  const g=gymS();g.biblioteca=out;
  g.fuente='openGym · '+iso(new Date())+' · '+out.length+' ejercicios (dataset MIT de hasaneyldrm)';
  save();render();
  return {ok:true,n:out.length,msg:out.length+' ejercicios guardados: ya los puedes buscar y montar en tu rutina'};}
function gymImportUrl(){
  if(typeof fetch!=='function')return Promise.resolve({ok:false,msg:'sin red aquí: baja el JSON y pégalo en la caja'});
  return fetch(GYM_URL).then(function(r){if(!r.ok)throw new Error('http '+r.status);return r.text();})
    .then(function(t){return gymImportText(t);})
    .catch(function(e){return {ok:false,msg:'no he podido bajarla ('+((e&&e.message)||'red')+'): pega el JSON si tienes el fichero'};});}
function gymBuscar(txt,max){
  const g=gymS(),q=(txt||'').toLowerCase().trim();
  const de=function(x){return String(x.n||'').toLowerCase()+' '+String(x.c||'')+' '+String(x.eq||'')+' '+String(x.tg||'');};
  const lista=q?g.biblioteca.filter(function(x){return de(x).indexOf(q)>=0;}):g.biblioteca;
  return lista.slice(0,max||40);}
function nuevaRutina(nombre){
  const g=gymS(),nm=String(nombre||'').trim()||('Rutina '+(g.rutinas.length+1));
  const r={id:uid('rt'),nombre:nm.slice(0,40),notas:'',ejercicios:[]};
  g.rutinas.push(r);ui.gymRutinaSel=r.id;
  save();render();
  return 'nueva rutina creada: '+r.nombre+' — ya puedes añadirle ejercicios';}
function delRutinaCard(rid){
  const g=gymS(),i=g.rutinas.findIndex(function(r){return r.id===rid;});
  if(i<0)return 'esa rutina ya no estaba';
  const nm=g.rutinas[i].nombre;
  g.rutinas.splice(i,1);
  if(ui.gymRutinaSel===rid)ui.gymRutinaSel='';
  if(ui.gymSesionActiva&&ui.gymSesionActiva.rutinaId===rid)ui.gymSesionActiva=null;
  save();render();
  return 'rutina eliminada: '+nm+' (las sesiones que ya hiciste con ella se quedan en el historial)';}
function addRutina(rid,nombre,det){
  det=det||{};
  const g=gymS(),nm=String(nombre||'').trim();
  if(!nm)return 'escribe el ejercicio (o búscalo en la biblioteca y dale a «a la rutina»)';
  if(!g.rutinas.length)g.rutinas.push({id:uid('rt'),nombre:'Mi rutina',notas:'',ejercicios:[]});
  let rt=g.rutinas.find(function(r){return r.id===rid;});
  if(!rt)rt=g.rutinas[0];
  const ex=g.biblioteca.filter(function(x){return x.n===nm||x.id===nm;})[0]||{};
  if(rt.ejercicios.some(function(x){return x.ex===nm;}))return '«'+nm+'» ya está en «'+rt.nombre+'»';
  rt.ejercicios.push({ex:nm,series:Math.max(1,+det.series||3),reps:Math.max(1,+det.reps||8),
    pesoObjetivo:Math.max(0,+det.pesoObjetivo||0),descansoSeg:Math.max(0,+det.descansoSeg||90),nota:'',
    c:ex.c||'',eq:ex.eq||'',tg:ex.tg||'',msc:ex.msc||''});
  save();render();return 'añadido a «'+rt.nombre+'»: '+nm;}
function delRutina(rid,ix){
  const g=gymS(),rt=g.rutinas.find(function(r){return r.id===rid;});
  if(!rt)return 'esa rutina ya no está';
  const r=rt.ejercicios[ix];if(!r)return 'ese ejercicio ya no estaba';
  rt.ejercicios.splice(ix,1);save();render();return 'quitado de «'+rt.nombre+'»: '+r.ex;}
function setRutina(rid,ix,campo,val){
  const g=gymS(),rt=g.rutinas.find(function(r){return r.id===rid;});if(!rt)return;
  const r=rt.ejercicios[ix];if(!r)return;
  if(campo==='series')r.series=Math.max(1,Math.min(12,+val||1));
  else if(campo==='reps')r.reps=Math.max(1,Math.min(30,+val||1));
  else if(campo==='pesoObjetivo')r.pesoObjetivo=Math.max(0,+val||0);
  else if(campo==='descansoSeg')r.descansoSeg=Math.max(0,Math.min(600,+val||0));
  else if(campo==='nota')r.nota=String(val||'').slice(0,90);
  save();}
function moverEjercicio(rid,ix,dir){
  const g=gymS(),rt=g.rutinas.find(function(r){return r.id===rid;});if(!rt)return;
  const j=ix+dir;if(j<0||j>=rt.ejercicios.length)return;
  const tmp=rt.ejercicios[ix];rt.ejercicios[ix]=rt.ejercicios[j];rt.ejercicios[j]=tmp;
  save();render();}
function addSet(fecha,opt){
  opt=opt||{};
  const g=gymS(),k=foodKey(fecha)||iso(new Date());
  const nm=String(opt.ex||'').trim();
  if(!nm)return 'dime qué ejercicio es';
  const kg=Math.max(0,Math.round((+opt.kg||0)*10)/10),reps=Math.max(1,Math.min(200,+opt.reps||1));
  /* si hay una sesión en curso ese mismo día, la serie que apuntes a mano cuenta también para ella
     (para "9 de 10 series hechas" y su volumen), aunque no viniera pre-montada por «empezar rutina» */
  const sid=(ui.gymSesionActiva&&ui.gymSesionActiva.fecha===k)?ui.gymSesionActiva.id:null;
  g.registro.push({id:uid('gs'),fecha:k,ex:nm,kg:kg,reps:reps,rpe:(+opt.rpe||0)||null,
    nota:String(opt.nota||'').slice(0,90),ts:Date.now(),sesionId:sid});
  save();
  return 'serie apuntada: '+nm+' '+kg+' kg × '+reps;}
function delSet(id){const g=gymS(),i=g.registro.findIndex(function(x){return x.id===id;});
  if(i<0)return 'esa serie ya no estaba';const s=g.registro[i];g.registro.splice(i,1);save();
  return 'borrada: '+s.ex+' '+s.kg+'×'+s.reps;}
let _gymIdxLen=-1,_gymIdxByFecha=null,_gymIdxByEx=null;
function gymIdx(){
  /* registro puede llegar a miles de series tras años de uso: recorrerlo entero por cada fecha/ejercicio
     consultado (setsDe, prDe, ejercicioUltimo...) era el hallazgo #1 del informe de rendimiento sobre
     Entreno. Se indexa una vez y se reutiliza; solo se rehace si registro cambió de tamaño — en este
     archivo nunca se edita una serie en sitio, solo se añade o se borra entera, así que el tamaño basta. */
  const reg=gymS().registro;
  if(_gymIdxByFecha&&_gymIdxLen===reg.length)return {byFecha:_gymIdxByFecha,byEx:_gymIdxByEx};
  const byFecha={},byEx={};
  reg.forEach(function(x){
    (byFecha[x.fecha]||(byFecha[x.fecha]=[])).push(x);
    (byEx[x.ex]||(byEx[x.ex]=[])).push(x);});
  _gymIdxByFecha=byFecha;_gymIdxByEx=byEx;_gymIdxLen=reg.length;
  return {byFecha:byFecha,byEx:byEx};}
function setsDe(fecha){const k=foodKey(fecha);return gymIdx().byFecha[k]||[];}
function volumenDe(fecha){const k=foodKey(fecha);
  return Math.round((gymIdx().byFecha[k]||[])
    .reduce(function(a,x){return a+(+x.kg||0)*(+x.reps||0);},0));}
function prDe(nombre){
  /* mejor serie estimada (Epley) y el máximo peso que has movido, sacado de tu propio registro */
  const xs=gymIdx().byEx[nombre]||[];
  if(!xs.length)return null;
  let best=null,one=null;
  xs.forEach(function(x){const rm=Math.round((+x.kg||0)*(1+(+x.reps||0)/30)*10)/10;
    if(!one||rm>one.rm)one={rm:rm,kg:x.kg,reps:x.reps,fecha:x.fecha};
    if(!best||(x.kg||0)>(best.kg||0))best=x;});
  return {maxKg:best.kg,maxReps:best.reps,maxFecha:best.fecha,rm:one.rm,rmKg:one.kg,rmReps:one.reps,n:xs.length};}
function ejercicioUltimo(nombre){
  const xs=gymIdx().byEx[nombre]||[];
  return xs.length?xs[xs.length-1]:null;}
/* ===================== qué rutina toca cada día =====================
   Los menús van pegados al TIPO de día desde el principio; el entreno no, y por eso la app nunca
   sabía qué te tocaba hoy. Mismo modelo: una rutina se asigna a uno o varios tipos de día. */
function rutinaDias(rt){if(!Array.isArray(rt.dias))rt.dias=[];return rt.dias;}
function toggleRutinaDia(rid,shiftId){
  const g=gymS(),rt=g.rutinas.filter(function(r){return r.id===rid;})[0];
  if(!rt)return 'esa rutina ya no existe';
  const d=rutinaDias(rt),i=d.indexOf(shiftId);
  if(i>=0)d.splice(i,1);
  else{
    /* dos rutinas el mismo tipo de día serían dos entrenos a la vez: la nueva manda */
    g.rutinas.forEach(function(o){
      if(o.id===rid)return;
      const od=rutinaDias(o),j=od.indexOf(shiftId);
      if(j>=0)od.splice(j,1);});
    d.push(shiftId);}
  save();
  const sh=shiftById(shiftId);
  return rt.nombre+(i>=0?' ya no toca':' toca')+' en «'+((sh&&sh.name)||'ese día')+'»';}
function gymCambios(){
  /* los cambios de día sueltos: {díaQueTocaba: díaAlQueSeMueve}. Las rutinas se asignan a TIPOS de
     día, no a fechas, así que sin esto un entreno que cae en una guardia no se puede mover: o lo
     pierdes o cambias la rutina entera. */
  const g=gymS();
  if(!g.cambios||typeof g.cambios!=='object')g.cambios={};
  return g.cambios;}
function rutinaDelDia(key){
  /* la rutina que toca ese día por el tipo de día que es, sin mirar los cambios sueltos */
  const inf=dayInfo(key);
  if(!inf.shiftId)return null;
  return gymS().rutinas.filter(function(r){return rutinaDias(r).indexOf(inf.shiftId)>=0;})[0]||null;}
function rutinaDeFecha(key){
  /* la que toca de verdad: la del tipo de día, salvo que la hayas movido a otro (o que venga
     movida de otro). Va aquí y no solo en la portada para que el cambio valga en todas partes:
     «Semana», «Hoy», el aviso de entrenar y hasta la hora de comer, que depende de si entrenas. */
  const k=foodKey(key)||key,c=gymCambios();
  if(c[k])return null;
  for(const o in c){if(c[o]===k)return rutinaDelDia(o);}
  return rutinaDelDia(k);}
function moverEntreno(deKey,aKey){
  const de=foodKey(deKey),a=foodKey(aKey);
  if(!de||!a)return 'esas fechas no valen';
  const rt=rutinaDeFecha(de);
  if(!rt)return 'ese día no tienes entreno que mover';
  gymCambios()[de]=a;
  save();render();
  return '«'+rt.nombre+'» pasa al '+fechaCortaTxt(a);}
function deshacerMovido(deKey){
  const de=foodKey(deKey),c=gymCambios();
  if(!c[de])return 'ese día no estaba movido';
  delete c[de];
  save();render();
  return 'el entreno vuelve al '+fechaCortaTxt(de);}
function fechaCortaTxt(key){
  const d=parseDate(key);
  return d?(DAYN[(d.getDay()+6)%7].toLowerCase()+' '+d.getDate()):key;}
function rutinaPlanHTML(rt,key){
  /* los ejercicios con el peso que usaste la última vez: la progresión donde hace falta, que es
     justo antes de levantar */
  return rt.ejercicios.slice(0,6).map(function(ej){
    const u=ejercicioUltimo(ej.ex);
    return '<div class="exrow"><span class="nm">'+esc(ej.ex)+'</span>'+
      '<span class="mini">'+(+ej.series||3)+'×'+(+ej.reps||8)+
        (u?(' · '+(+u.kg>0?('<b style="color:var(--ink)">'+fmt(u.kg)+' kg</b> la última vez')
          :'<b style="color:var(--ink)">con tu peso</b> la última vez')):' · primera vez')+'</span></div>';}).join('')+
    (rt.ejercicios.length>6?('<p class="mini" style="margin:7px 0 0">y '+(rt.ejercicios.length-6)+' más</p>'):'');}
function tocaEntrenarHTML(key){
  const rt=rutinaDeFecha(key);
  if(!rt||ui.gymSesionActiva)return '';
  const g=gymS();
  const yaHoy=g.sesiones.filter(function(s){return s.fecha===key&&s.rutinaId===rt.id;}).length;
  return '<div class="card"><h2>Hoy toca entrenar <span class="mini">'+esc(rt.nombre)+'</span></h2>'+
    (yaHoy?('<p class="note" style="margin:0">Ya la hiciste hoy. Si quieres repetir, empiézala otra vez.</p>'):'')+
    '<div class="exlist" style="margin-top:8px">'+rutinaPlanHTML(rt,key)+'</div>'+
    '<div class="row" style="margin-top:11px">'+
      '<button class="btn p" data-a="ses-empezar" data-id="'+esc(rt.id)+'" data-key="'+esc(key)+'">'+
        gymIco('pesa','gico sm')+' empezar «'+esc(rt.nombre)+'»</button>'+
      '<button class="btn s" data-a="tab" data-t="gym">ver Entreno →</button></div></div>';}
/* ===================== empezar/terminar una rutina = una sesión ===================== */
function empezarRutina(rid,fecha){
  /* monta las series de esa rutina con el último peso que usaste en cada ejercicio (misma idea que
     antes pasarRutina(), pero ahora sabiendo de qué rutina se trata) y abre una "sesión en curso":
     hasta que no le des a «he terminado» (o «descartar»), no hay una sola sesión más que empezar. */
  const g=gymS(),rt=g.rutinas.find(function(r){return r.id===rid;});
  if(!rt)return 'esa rutina ya no existe';
  if(!rt.ejercicios.length)return '«'+rt.nombre+'» no tiene ejercicios todavía: añade alguno primero';
  if(ui.gymSesionActiva)return 'ya tienes una sesión en curso: termínala o descártala antes de empezar otra';
  const k=foodKey(fecha)||iso(new Date());
  const sid=uid('gses');
  /* NO se montan las series por adelantado. Antes se metían las 17 de golpe en el registro con el
     peso de la última vez; como ui.gymSesionActiva no se guarda, cerrar la app a mitad dejaba en tu
     historial 17 series que no habías hecho. Ahora cada serie entra cuando la apuntas. */
  const n=rt.ejercicios.reduce(function(a,ej){return a+Math.max(1,+ej.series||3);},0);
  ui.gymSesionActiva={id:sid,rutinaId:rid,fecha:k,plan:n,ix:0,ts:Date.now()};
  ui.gymVivo=null;ui.gymDesc=null;ui.gymInforme='';
  /* empezar una rutina te deja DENTRO del entreno, no en un formulario — y también cuando le das
     desde «Hoy», que es donde sale el aviso de que hoy toca: sin cambiar de pestaña, pulsabas
     «empezar» y no pasaba nada a la vista */
  ui.tab='gym';ui.gymPanel='vivo';
  save();render();window.scrollTo(0,0);
  return '«'+rt.nombre+'»: '+n+' series por delante. Apunta cada una según la hagas.';}
function duracionTipica(rid){
  const g=gymS(),ss=g.sesiones.filter(function(s){return s.rutinaId===rid;});
  if(!ss.length)return 45;
  return Math.round(ss.reduce(function(a,s){return a+(+s.duracionMin||0);},0)/ss.length)||45;}
function terminarSesion(minutos,completo,nota){
  const g=gymS();
  if(!ui.gymSesionActiva)return 'no hay ninguna sesión en curso';
  const sa=ui.gymSesionActiva,rt=g.rutinas.find(function(r){return r.id===sa.rutinaId;});
  const seriesIds=g.registro.filter(function(x){return x.sesionId===sa.id;}).map(function(x){return x.id;});
  const dur=Math.max(1,Math.min(600,Math.round(+minutos||duracionTipica(sa.rutinaId))));
  const comp=(typeof completo==='boolean')?completo:(seriesIds.length>=sa.plan);
  g.sesiones.push({id:sa.id,rutinaId:sa.rutinaId,fecha:sa.fecha,duracionMin:dur,seriesIds:seriesIds,
    plan:+sa.plan||seriesIds.length,   /* cuántas había planeadas: el informe dice «3 de 6», no «3 de 3» */
    completo:comp,nota:String(nota||'').slice(0,140)});
  ui.gymSesionActiva=null;
  save();render();
  return 'sesión guardada: '+(rt?rt.nombre:'')+' · '+seriesIds.length+' series · '+dur+' min'+(comp?' · entera':' · parcial');}
function descartarSesion(){
  const g=gymS();
  if(!ui.gymSesionActiva)return 'no hay ninguna sesión en curso';
  const sid=ui.gymSesionActiva.id;
  const n=g.registro.filter(function(x){return x.sesionId===sid;}).length;
  g.registro=g.registro.filter(function(x){return x.sesionId!==sid;});
  ui.gymSesionActiva=null;ui.gymVivo=null;ui.gymDesc=null;ui.gymPanel='';
  save();render();
  return n?('sesión descartada: se han quitado las '+n+' series que llevabas'):'sesión descartada';}
function historialRutina(rid){
  const g=gymS(),hoy=new Date(),mesActual=hoy.getFullYear()+'-'+String(hoy.getMonth()+1).padStart(2,'0');
  const ss=g.sesiones.filter(function(s){return s.rutinaId===rid;});
  const esteMes=ss.filter(function(s){return (s.fecha||'').slice(0,7)===mesActual;});
  const media=ss.length?Math.round(ss.reduce(function(a,s){return a+(+s.duracionMin||0);},0)/ss.length):0;
  let ultima=null;
  ss.forEach(function(s){if(!ultima||s.fecha>ultima)ultima=s.fecha;});
  const diasDesde=ultima?Math.max(0,Math.floor((Date.now()-(parseDate(ultima)||hoy).getTime())/864e5)):null;
  return {n:ss.length,esteMes:esteMes.length,media:media,ultima:ultima,diasDesde:diasDesde};}
function sesionesRecientes(n){
  const g=gymS();
  return g.sesiones.slice().sort(function(a,b){return (b.fecha||'').localeCompare(a.fecha||'');}).slice(0,n||20);}
/* ===================== cardio: natación, carrera, bici… aparte de la fuerza ===================== */
function addCardio(opt){
  opt=opt||{};
  const g=gymS();
  const tipo=String(opt.tipo||'otro').trim().slice(0,20)||'otro';
  const k=foodKey(opt.fecha)||iso(new Date());
  const dur=Math.max(1,Math.min(600,Math.round(+opt.duracionMin||30)));
  const kmVal=(opt.distanciaKm===''||opt.distanciaKm==null)?null:Math.max(0,Math.round((+opt.distanciaKm||0)*100)/100);
  g.cardio.push({id:uid('cd'),fecha:k,tipo:tipo,duracionMin:dur,distanciaKm:kmVal,nota:String(opt.nota||'').slice(0,140)});
  save();render();
  return 'cardio apuntado: '+tipo+' · '+dur+' min'+(kmVal?(' · '+kmVal+' km'):'');}
function delCardio(id){
  const g=gymS(),i=g.cardio.findIndex(function(x){return x.id===id;});
  if(i<0)return 'ese cardio ya no estaba';
  const x=g.cardio[i];g.cardio.splice(i,1);save();render();
  return 'borrado: '+x.tipo+' del '+x.fecha;}
/* ===================== diagrama de músculos: de la biblioteca a 10 regiones fijas ===================== */
const MREGIONES=['pecho','espalda','hombros','biceps','triceps','cuadriceps','isquiotibiales','gluteos','gemelos','core'];
const MREG_LABEL={pecho:'Pecho',espalda:'Espalda',hombros:'Hombros',biceps:'Bíceps',triceps:'Tríceps',
  cuadriceps:'Cuádriceps',isquiotibiales:'Isquiotibiales',gluteos:'Glúteos',gemelos:'Gemelos',core:'Core / abdomen'};
/* La biblioteca de openGym trae category/body_part (c), target muscle (tg) y músculos secundarios (msc)
   con el vocabulario típico de ese tipo de dataset (inglés, "chest"/"upper legs"/"hamstrings"/"lats"...).
   No hay una tabla 1:1 con las 10 regiones fijas de este diagrama, así que se hace por coincidencia de
   palabra clave: tg (el músculo objetivo, lo más específico) manda; msc (secundarios) se suma aparte;
   c (categoría/body_part, mucho más genérico: "upper legs", "back"...) solo se usa si tg no dio ninguna
   región, para no dejar el ejercicio sin ninguna región reconocida. */
const MUSCLE_MAP=[
  [/pector|pecho|chest|serratus/,'pecho'],
  [/\blat\b|lats|upper back|middle back|lower back|\bback\b|espalda|trapez|\btraps\b|rhomboid|spine|neck/,'espalda'],
  [/delt|shoulder|hombro/,'hombros'],
  [/bicep|brachialis|forearm|antebrazo/,'biceps'],
  [/tricep/,'triceps'],
  [/quad|cuádricep|cuadricep|upper leg/,'cuadriceps'],
  [/hamstring|isquio/,'isquiotibiales'],
  [/glute|glúteo|gluteo/,'gluteos'],
  [/calf|calves|gastroc|soleus|lower leg|gemelo/,'gemelos'],
  [/\babs\b|abdomin|oblique|waist|\bcore\b|abductor|adductor/,'core']];
/* Los músculos salían SOLO de los campos de la biblioteca de openGym (tg/msc/c), y addRutina esos
   campos solo los rellena cuando el nombre coincide EXACTO con la biblioteca... que está en inglés.
   Escribiendo «Dominadas» o «Sentadilla» el muñeco no se podía pintar nunca: salían tres ejercicios
   en la tabla y debajo «añade ejercicios para ver qué trabajas». Esta tabla traduce el nombre que
   escribes —en español o en inglés— a grupos musculares, sin depender de ninguna biblioteca.
   El orden importa: lo específico va antes que lo genérico, y los casos que comparten palabra
   («curl» de bíceps contra «curl femoral») se separan mirando el resto del nombre. */
const EJERCICIOS_NOMBRE=[
  /* pierna */
  [/sentadilla|squat|goblet|hack\b/,['cuadriceps','gluteos','core']],
  [/prensa|leg press/,['cuadriceps','gluteos']],
  [/zancada|estocada|lunge|b[úu]lgara|split squat/,['cuadriceps','gluteos']],
  [/extensi[óo]n(es)?\s*(de\s*)?(cu[áa]dric|pierna|rodilla)|leg extension/,['cuadriceps']],
  [/peso muerto rumano|rdl\b|buenos d[íi]as|good morning/,['isquiotibiales','gluteos','espalda']],
  [/peso muerto|deadlift/,['isquiotibiales','gluteos','espalda','core']],
  [/(curl|flexi[óo]n)\s*(de\s*)?(femoral|pierna|isquio)|leg curl|femoral/,['isquiotibiales']],
  [/hip thrust|empuje de cadera|puente de gl[úu]teo|patada de gl[úu]teo|abductor/,['gluteos','isquiotibiales']],
  [/gemelo|elevaci[óo]n(es)?\s*(de\s*)?talon|calf raise|s[óo]leo/,['gemelos']],
  /* empuje: pecho y hombro */
  [/press (de )?banca|bench press|press plano|press inclinado|press declinado/,['pecho','triceps','hombros']],
  [/apertura|fly\b|pec deck|contractora|cruce de polea/,['pecho']],
  [/fondo|dips?\b/,['pecho','triceps']],
  [/flexion(es)?\b|push ?up|lagartija/,['pecho','triceps','core']],
  [/press militar|press (de )?hombro|overhead press|press arnold|push press/,['hombros','triceps']],
  [/elevaci[óo]n(es)?\s*(lateral|frontal)|lateral raise|front raise/,['hombros']],
  [/p[áa]jaro|deltoide posterior|rear delt|face pull/,['hombros','espalda']],
  /* tirón: espalda y bíceps */
  [/dominada|pull ?up|chin ?up/,['espalda','biceps']],
  [/jal[óo]n|lat pulldown|polea al pecho/,['espalda','biceps']],
  [/remo\b|row\b/,['espalda','biceps']],
  [/pull ?over/,['espalda','pecho']],
  [/encogimiento|shrug|trapecio/,['espalda']],
  [/hiperextensi[óo]n|lumbar|back extension/,['espalda','gluteos']],
  /* brazo */
  [/(curl|martillo|hammer|predicador|concentrado)(?!.*(femoral|pierna|isquio))/,['biceps']],
  [/tr[íi]ceps|press franc[ée]s|skull ?crusher|copa|patada de tr[íi]ceps|jal[óo]n de tr/,['triceps']],
  /* core */
  [/plancha|plank|hollow/,['core']],
  [/abdominal|crunch|encogimiento abdominal|elevaci[óo]n(es)?\s*(de\s*)?pierna|rueda abdominal|ab wheel/,['core']],
  [/oblicuo|russian twist|giro ruso|leñador|pallof/,['core']],
  /* mixtos */
  [/burpee/,['pecho','cuadriceps','core']],
  [/thruster|clean|arrancada|cargada|snatch/,['cuadriceps','hombros','espalda','core']]
];
function regionesDeNombre(nombre){
  const t=String(nombre||'').toLowerCase().trim(),out=new Set();
  if(!t)return out;
  for(let i=0;i<EJERCICIOS_NOMBRE.length;i++){
    if(EJERCICIOS_NOMBRE[i][0].test(t))EJERCICIOS_NOMBRE[i][1].forEach(function(r){out.add(r);});}
  return out;}
function regionesDeTexto(txt){
  const t=String(txt||'').toLowerCase(),out=new Set();
  MUSCLE_MAP.forEach(function(p){if(p[0].test(t))out.add(p[1]);});
  return out;}
function regionesDeEjercicio(ej){
  const out=new Set();
  /* la biblioteca manda cuando la hay: trae el músculo objetivo, que es más preciso que el nombre */
  regionesDeTexto(ej&&ej.tg).forEach(function(r){out.add(r);});
  regionesDeTexto(ej&&ej.msc).forEach(function(r){out.add(r);});
  /* y si no la hay —el caso normal escribiendo el ejercicio a mano—, se saca del propio nombre */
  if(!out.size)regionesDeNombre(ej&&ej.ex).forEach(function(r){out.add(r);});
  if(!out.size)regionesDeTexto(ej&&ej.ex).forEach(function(r){out.add(r);});
  if(!out.size)regionesDeTexto(ej&&ej.c).forEach(function(r){out.add(r);});
  return out;}
function ejerciciosSinMusculo(rid){
  /* los que no se han sabido traducir: mejor decirlo que dejar el muñeco a medias sin explicación */
  const g=gymS(),rt=g.rutinas.find(function(r){return r.id===rid;});
  if(!rt)return [];
  return rt.ejercicios.filter(function(ej){return !regionesDeEjercicio(ej).size;})
    .map(function(ej){return ej.ex;});}
function tipoDeEjercicio(ej){
  /* la biblioteca de openGym no trae "tipo": se saca del equipo — sin equipo (o "body weight") es calistenia,
     cualquier otro equipo (barra, mancuerna, máquina, polea…) es gimnasio */
  return /body ?weight|bodyweight|^none$|^-$/i.test((ej&&ej.eq||'').trim())?'calistenia':'gimnasio';}
function recomendacionRutina(regiones){
  /* misma idea que empuje/tirón/pierna/core del informe de rediseño: si a una rutina le falta alguno
     de los cuatro grupos grandes, se lo dice; si los tiene todos, un mensaje de que está equilibrada */
  const MAYORES=['pecho','espalda','cuadriceps','core'];
  if(!regiones||!regiones.size)return 'añade ejercicios para ver qué trabajas';
  const falta=MAYORES.filter(function(r){return !regiones.has(r);});
  if(!falta.length)return 'equilibrada: empuje, tirón, pierna y core cubiertos';
  return 'falta: '+falta.map(function(r){return MREG_LABEL[r];}).join(', ');}
function regionesDeRutina(rid){
  const g=gymS(),rt=g.rutinas.find(function(r){return r.id===rid;}),out=new Set();
  if(rt)rt.ejercicios.forEach(function(ej){regionesDeEjercicio(ej).forEach(function(r){out.add(r);});});
  return out;}
function regionesDeSesion(sid){
  const g=gymS(),s=g.sesiones.find(function(x){return x.id===sid;});
  return s?regionesDeRutina(s.rutinaId):new Set();}
function libMatch(nombre){
  const g=gymS(),q=String(nombre||'').toLowerCase();
  return g.biblioteca.find(function(x){return String(x.n||'').toLowerCase()===q;})||null;}
function svgCuerpo(activas){
  activas=activas||new Set();
  const on=function(r){return activas.has(r)?' on':'';};
  const R=function(x,y,w,h,rx,region){
    return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" class="mreg'+on(region)+'" data-region="'+region+'"><title>'+esc(MREG_LABEL[region]||region)+'</title></rect>';};
  const E=function(cx,cy,rx,ry,region){
    return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" class="mreg'+on(region)+'" data-region="'+region+'"><title>'+esc(MREG_LABEL[region]||region)+'</title></ellipse>';};
  return '<svg viewBox="0 0 200 300" class="mbody" role="img" aria-label="Diagrama del cuerpo con los grupos musculares que se han trabajado resaltados">'+
    '<circle cx="100" cy="24" r="16" class="mneutro"/>'+
    '<rect x="92" y="38" width="16" height="14" class="mneutro"/>'+
    '<rect x="40" y="122" width="14" height="44" rx="6" class="mneutro"/>'+
    '<rect x="146" y="122" width="14" height="44" rx="6" class="mneutro"/>'+
    '<circle cx="47" cy="170" r="7" class="mneutro"/>'+
    '<circle cx="153" cy="170" r="7" class="mneutro"/>'+
    '<ellipse cx="86" cy="270" rx="10" ry="6" class="mneutro"/>'+
    '<ellipse cx="114" cy="270" rx="10" ry="6" class="mneutro"/>'+
    R(78,48,44,8,4,'espalda')+
    E(58,62,16,13,'hombros')+E(142,62,16,13,'hombros')+
    R(70,58,60,40,10,'pecho')+
    R(36,66,18,58,8,'biceps')+R(146,66,18,58,8,'biceps')+
    R(30,68,7,54,3,'triceps')+R(163,68,7,54,3,'triceps')+
    R(76,96,48,42,8,'core')+
    E(80,142,11,9,'gluteos')+E(120,142,11,9,'gluteos')+
    R(72,138,22,66,10,'cuadriceps')+R(106,138,22,66,10,'cuadriceps')+
    R(65,140,7,62,3,'isquiotibiales')+R(128,140,7,62,3,'isquiotibiales')+
    R(74,206,17,52,8,'gemelos')+R(109,206,17,52,8,'gemelos')+
    '</svg>';}
function diagramaHTML(regiones,titulo){
  const arr=Array.from(regiones||[]);
  const leyenda=arr.length?arr.map(function(r){return '<span class="tag b3">'+esc(MREG_LABEL[r]||r)+'</span>';}).join(' ')
    :'<span class="mini">sin ejercicios de la biblioteca reconocidos todavía: importa la biblioteca de openGym y añade los ejercicios desde ahí (no a mano) para que el diagrama se rellene</span>';
  return '<details class="dtip" style="margin-top:10px"><summary class="mini">'+esc(titulo||'ver qué músculos trabaja')+'</summary>'+
    '<div class="mdiagram">'+svgCuerpo(regiones)+'<div class="mlegend"><b>Resalta:</b>'+leyenda+'</div></div></details>';}
function diaSegundo(dateStr,infOpt){
  /* el segundo día de gym: lo que marques para ese día concreto manda sobre la regla de la semana */
  const g=gymS(),k=foodKey(dateStr);
  if(!k)return {on:false,auto:false,tipo:g.segundo.tipo,hora:g.segundo.hora};
  const d=parseDate(k),mk=g.marks[k];
  const sh=shiftById((infOpt||dayInfo(k)).shiftId||'');
  const bloqueado=!!(sh&&(isGuardia(sh)||/saliente|vacacion|festiv/i.test(sh.name||'')));
  const porSemana=!!(g.segundo.on&&!bloqueado&&d&&g.segundo.dias.indexOf(d.getDay())>=0);
  if(mk&&typeof mk.on==='boolean')
    return {on:mk.on&&!bloqueado,auto:false,tipo:mk.tipo||g.segundo.tipo,hora:mk.hora||g.segundo.hora,porSemana:porSemana};
  return {on:porSemana,auto:true,tipo:g.segundo.tipo,hora:g.segundo.hora,porSemana:porSemana};}
function toggleSegundo(dateStr,forzar){
  const g=gymS(),k=foodKey(dateStr);if(!k)return 'ese día no tiene fecha todavía';
  const cur=diaSegundo(k),mk=g.marks[k]||{};
  const nuevo=(forzar===true||forzar===false)?forzar:!cur.on;
  g.marks[k]={on:nuevo,tipo:mk.tipo||g.segundo.tipo,hora:mk.hora||g.segundo.hora};
  if(nuevo&&/guardia|saliente|vacacion|festiv/i.test((shiftById(dayInfo(k).shiftId||'')||{}).name||''))
    return 'lo he dejado apuntado, pero ese día toca '+((shiftById(dayInfo(k).shiftId||'')||{}).name||'descanso')+' y no se entrena';
  save();render();
  return (nuevo?'segundo entreno añadido el ':'segundo entreno quitado del ')+k.slice(8)+' '+MON[+k.slice(5,7)-1];}
function setSegundoCampo(dateStr,campo,val){
  const g=gymS(),k=foodKey(dateStr);if(!k)return;
  const mk=g.marks[k]||{on:true};mk[campo]=val;g.marks[k]=mk;save();}
function toggleSegundoDia(ix){
  const g=gymS(),d=g.segundo,dias=d.dias.slice(),i=dias.indexOf(+ix);
  if(i>=0)dias.splice(i,1);else dias.push(+ix);
  d.dias=dias.sort(function(a,b){return a-b;});d.on=dias.length>0;save();render();
  return dias.length?('segundo entreno: '+dias.map(function(x){return GYM_DIAS[x];}).join(', ')):'sin segundo día fijo';}
function resumenGym(fecha){
  const xs=setsDe(fecha);
  if(!xs.length)return '';
  const por={},orden=[];
  xs.forEach(function(x){if(!por[x.ex]){por[x.ex]=[];orden.push(x.ex);}por[x.ex].push(x);});
  return orden.map(function(e){
    return e+' '+por[e].map(function(x){return (x.kg?x.kg+'×'+x.reps:x.reps+'×peso');}).join(' ')+
      ' · '+Math.round(por[e].reduce(function(a,x){return a+(+x.kg||0)*(+x.reps||0);},0))+' kg';}).join(' | ');}
function volumenSemana(desde){
  const ini=mondayOf(parseDate(desde)||new Date()),out=[];
  for(let i=0;i<7;i++){const dd=addDays(ini,i),k=iso(dd);
    out.push({k:k,nm:DAYSH[i]+' '+dd.getDate(),sets:setsDe(k).length,vol:volumenDe(k)});}
  return out;}
function gymLine(dateStr){
  const g=diaSegundo(dateStr);if(!g.on)return '';
  return '🏊 '+(g.tipo||'entreno')+(g.hora?(' '+g.hora):'')+(g.auto?'':' · puesto tú');}
/* ===================== limpiar el entreno (con red de seguridad) ===================== */
function gymWipe(que){
  const g=gymS(),fab={on:true,dias:[2],tipo:'piscina',hora:'15:30'};
  const antes={registro:g.registro.slice(),rutinas:clone(g.rutinas),sesiones:g.sesiones.slice(),cardio:g.cardio.slice(),
    fav:(g.fav||[]).slice(),marks:JSON.parse(JSON.stringify(g.marks||{})),segundo:JSON.parse(JSON.stringify(g.segundo||{})),
    biblioteca:g.biblioteca.slice(),fuente:g.fuente||''};
  let n=0;
  if(que==='log'){n=g.registro.length;g.registro=[];ui.gymSesionActiva=null;}
  else if(que==='rut'){n=g.rutinas.length;g.rutinas=[];g.fav=[];ui.gymRutinaSel='';ui.gymSesionActiva=null;}
  else if(que==='seg'){n=Object.keys(g.marks||{}).length;g.marks={};g.segundo=JSON.parse(JSON.stringify(fab));}
  else if(que==='all'){n=g.registro.length+g.rutinas.length+g.sesiones.length+g.cardio.length;
    g.registro=[];g.rutinas=[];g.sesiones=[];g.cardio=[];g.fav=[];g.marks={};g.segundo=JSON.parse(JSON.stringify(fab));
    ui.gymSesionActiva=null;ui.gymRutinaSel='';}
  else if(que==='todo'){n=g.registro.length+g.rutinas.length+g.sesiones.length+g.cardio.length+g.biblioteca.length;
    g.registro=[];g.rutinas=[];g.sesiones=[];g.cardio=[];g.fav=[];g.marks={};g.biblioteca=[];g.fuente='';g.segundo=JSON.parse(JSON.stringify(fab));
    ui.gymSesionActiva=null;ui.gymRutinaSel='';}
  else return {ok:false,msg:'no sé qué quieres limpiar'};
  ui.gymUndo={antes:antes,que:que};
  save();render();
  return {ok:true,n:n,que:que,
    msg:(n?('limpiado «'+que+'»: '+n+' cosa(s) fuera'):'eso ya estaba vacío')+
      (n?' · con «deshacer» vuelve tal cual':'')};}
function gymUndoWipe(){
  if(!ui.gymUndo)return {ok:false,msg:'no hay ningún borrado que deshacer ahora mismo'};
  const g=gymS(),a=ui.gymUndo.antes;
  g.registro=a.registro;g.rutinas=a.rutinas;g.sesiones=a.sesiones||[];g.cardio=a.cardio||[];
  g.fav=a.fav;g.marks=a.marks;g.segundo=a.segundo;
  g.biblioteca=a.biblioteca;g.fuente=a.fuente;
  ui.gymUndo=null;save();render();
  return {ok:true,msg:'restaurado: '+g.registro.length+' serie(s), '+g.rutinas.length+' rutina(s)'+
    (g.biblioteca.length?' y la biblioteca de '+g.biblioteca.length+' ejercicios':'')};}
/* ===================== comida: la vista (día, escáner, armario y objetivo) ===================== */
function kcalRingHTML(val,obj){
  /* el resumen del día (informe: rediseño de Comida) en un anillo, en vez de tres barras y cuatro KPI */
  const r=52,circ=2*Math.PI*r;
  const pct=obj>0?Math.min(1,val/obj):0,off=circ*(1-pct);
  const over=obj>0&&val>obj;
  return '<div class="ringwrap"><svg viewBox="0 0 120 120">'+
    '<circle class="ringTrack" cx="60" cy="60" r="'+r+'"></circle>'+
    '<circle class="ringFill'+(over?' over':'')+'" cx="60" cy="60" r="'+r+'" style="stroke-dasharray:'+circ.toFixed(1)+';stroke-dashoffset:'+off.toFixed(1)+'"></circle>'+
    '</svg><div class="ringnum"><b>'+val+'</b><span>kcal hoy</span></div></div>';
}
/* ===================== Comida: portada, apuntar, qué cocino y modo cocina =====================
   Antes esta pestaña pintaba de una sentada el resumen del día, el registro, el formulario de
   apuntar, los cuatro modos de añadir productos y la semana. Se parte igual que Entreno y que
   Días y menús: una portada que se lee de un vistazo y pantallas propias con botón de volver. */
/* ===================== ideas: qué sale con lo que hay en casa =====================
   Nada de esto sale a la red ni se inventa nutrición: las combinaciones se arman con alimentos de
   tu nevera y las cantidades se calculan con la misma tabla que usa el resto de la app. */
function objetivoMacros(){
  /* la proteína la pones tú. El carbohidrato y la grasa, si no los has puesto, salen de repartir a
     partes iguales las kcal que quedan después de la proteína: es una referencia, no una pauta. */
  const ob=food().objetivo||{},k=+ob.kcal||0,p=+ob.prot||0;
  let c=+ob.carb||0,g=+ob.gresa||0,derivado=false;
  if(k>0&&(!c||!g)){
    const resto=Math.max(0,k-4*p);
    if(!c)c=Math.round(resto*0.5/4);
    if(!g)g=Math.round(resto*0.5/9);
    derivado=true;}
  return {kcal:k,prot:p,carb:c,gresa:g,derivado:derivado};}
/* condimentos: están en la tabla y pueden estar en tu nevera, pero nadie se come 150 g de ajo ni
   una guarnición de cebolla. No entran como pieza principal de una combinación; dan sabor y ya. */
const ALIM_CONDIMENTO=['al-ajo','al-cebolla','al-puerro','al-limon','al-tomate-triturado',
  'al-caldo-de-pollo','al-miel','al-aceite-de-oliva','al-leche-de-coco'];
function esCondimento(a){return ALIM_CONDIMENTO.indexOf(a.id)>=0;}
function esProte(a){return (+a.pr||0)>=10&&['carne','pescado','legumbre'].indexOf(a.g)>=0||
  (a.g==='lacteo'&&(+a.pr||0)>=8)||(a.g==='otro'&&(+a.pr||0)>=20);}
function esCarb(a){return (+a.ch||0)>=15&&['cereal','legumbre','verdura','otro'].indexOf(a.g)>=0;}
function esVerdura(a){return a.g==='verdura'&&(+a.ch||0)<15;}
function esGrasa(a){return (+a.gr||0)>=30;}
function sumaAlimentos(partes){
  /* partes: [{a:alimento,g:gramos}] → un total con los mismos campos que una toma del día */
  const t={kcal:0,pr:0,ch:0,az:0,fi:0,gr:0,sa:0,mi:{}};
  partes.forEach(function(x){
    const p=alimPorcion(x.a,x.g);
    ALIM_MACROS.forEach(function(k){t[k]+=+p[k]||0;});
    Object.keys(p.mi).forEach(function(k){t.mi[k]=(t.mi[k]||0)+p.mi[k];});});
  ALIM_MACROS.forEach(function(k){t[k]=(k==='kcal')?Math.round(t[k]):Math.round(t[k]*10)/10;});
  Object.keys(t.mi).forEach(function(k){t.mi[k]=Math.round(t.mi[k]*100)/100;});
  return t;}
function redondeaG(g){return g<40?Math.round(g/5)*5:Math.round(g/10)*10;}
function metaDePlato(huecoK,huecoP){
  /* una combinación es UN plato, no el día entero: si te quedan 2 300 kcal por delante no se te
     propone un plato de 2 300 kcal. Con el hueco ya pequeño (media tarde) se apunta al hueco. */
  const k=huecoK>0?Math.max(350,Math.min(850,huecoK>1200?Math.round(huecoK*0.4):huecoK)):650;
  const p=huecoP>0?Math.max(20,Math.min(55,huecoP>70?Math.round(huecoP*0.4):huecoP)):35;
  return {kcal:k,prot:p};}
function topeRacion(a){
  /* los cereales y las legumbres de la tabla van en crudo: 300 g de lenteja cruda no es una ración,
     son tres. Lo que se pesa ya cocinado o es verdura aguanta raciones mucho mayores. */
  if(/crud|seco/i.test(a.nota||''))return 110;
  if(a.g==='cereal'||a.g==='legumbre')return 120;
  return 320;}
function combinaciones(huecoK,huecoP){
  /* arma platos de tres o cuatro piezas con lo que tengas y ajusta las cantidades. Sin nevera no hay
     nada que proponer: la app no va a sugerir que compres. */
  const n=neveraAlimentos();
  const util=n.filter(function(a){return !esCondimento(a);});
  const prot=util.filter(esProte),carb=util.filter(esCarb),verd=util.filter(esVerdura),
        gras=n.filter(esGrasa);   /* la grasa sí puede ser un condimento: van 10 ml de aceite */
  if(!prot.length||(!carb.length&&!verd.length))return [];
  const meta=metaDePlato(huecoK,huecoP);
  const out=[];
  prot.forEach(function(P){
    (carb.length?carb:[null]).forEach(function(C){
      if(C&&C.id===P.id)return;   /* «lenteja con lenteja» no es una idea */
      (verd.length?verd:[null]).forEach(function(V){
        if(V&&(V.id===P.id||(C&&V.id===C.id)))return;
        const partes=[];
        /* 1) la proteína cubre el objetivo de proteína del plato, con tope de ración */
        const gP=Math.min(topeRacion(P),Math.max(60,redondeaG(meta.prot*100/Math.max(1,+P.pr||1))));
        partes.push({a:P,g:gP});
        /* 2) la verdura va fija: es guarnición, no se estira para cuadrar números */
        if(V)partes.push({a:V,g:150});
        /* 3) la grasa de cocinar, antes de rellenar: 10 ml de aceite son 88 kcal y si se suman
              después, el carbohidrato ya se ha comido ese hueco y el plato se va por encima */
        if(gras.length&&gras[0].id!==P.id)partes.push({a:gras[0],g:10});
        /* 4) el carbohidrato rellena las kcal que falten, sin pasarse de ración */
        if(C){
          const hasta=sumaAlimentos(partes).kcal;
          const gC=Math.min(topeRacion(C),Math.max(30,redondeaG((meta.kcal-hasta)*100/Math.max(1,+C.kcal||1))));
          if(gC>=25)partes.push({a:C,g:gC});}
        const t=sumaAlimentos(partes);
        /* el nombre se lee como un plato: proteína, carbohidrato y verdura, en ese orden */
        const orden=[P,C,V].filter(Boolean).map(function(x){return String(x.n).toLowerCase();});
        out.push({
          id:partes.map(function(x){return x.a.id;}).join('+'),
          nombre:orden[0].charAt(0).toUpperCase()+orden[0].slice(1)+
            (orden[1]?(' con '+orden[1]):'')+(orden[2]?(' y '+orden[2]):''),
          partes:partes,t:t,meta:meta,
          crudo:partes.some(function(x){return /crud/i.test(x.a.nota||'');}),
          /* se ordenan por lo cerca que quedan del objetivo del plato, contando doble la proteína:
             pasarse de kcal molesta menos que quedarse corto de proteína */
          err:Math.abs(t.kcal-meta.kcal)/meta.kcal+2*Math.abs(t.pr-meta.prot)/meta.prot});});});});
  out.sort(function(a,b){return a.err-b.err;});
  const vistos={},res=[];
  out.forEach(function(x){if(res.length>=3)return;const k=x.partes[0].a.id;
    if(vistos[k])return;vistos[k]=1;res.push(x);});
  return res;}
function guardarCombinacion(idx){
  const c=(ui.ideasCache||[])[idx];
  if(!c)return 'esa idea ya no está: vuelve a entrar en Ideas';
  const d={id:uid('d'),name:c.nombre,icon:'🍲',portions:1,
    kcal:c.t.kcal,prot:c.t.pr,
    ingredients:c.partes.map(function(x){return x.g+' g '+String(x.a.n).toLowerCase();}),
    steps:[],nota:'idea armada con lo que tenías en la nevera'};
  store.dishes.push(d);save();
  return 'guardado como plato: '+d.name;}
const FOOD_POS=['desayuno','media','comida','merienda','cena','post-entreno'];
function foodCtx(){
  const f=food(),hoy=iso(new Date());
  const sel=(ui.foodDate&&foodKey(ui.foodDate))?foodKey(ui.foodDate):hoy;
  return {f:f,hoy:hoy,sel:sel,ft:foodTotals(sel),pl:planTotalsOf(sel),ob:f.objetivo||{},
          d:parseDate(sel)||new Date(),lista:foodLog(sel)};}
function foodSubcab(titulo,extra){
  return '<div class="subcab">'+
    '<button class="btn s volver" data-a="food-vista" data-v="">'+gymIco('atras','gico sm')+' Comer</button>'+
    '<h2 class="subtit">'+esc(titulo)+'</h2>'+(extra||'')+'</div>';}
function momentoAhora(){
  /* a las 14:30 lo normal es que apuntes la comida, no el desayuno: el selector ya viene puesto */
  const n=new Date();
  return posDeSlot('',String(n.getHours()).padStart(2,'0')+':00');}
function posOptions(seleccion){
  return FOOD_POS.map(function(x){
    return '<option value="'+x+'"'+(x===(seleccion||'comida')?' selected':'')+'>'+x+'</option>';}).join('');}
function renderFoodDia(){
  const c=foodCtx(),f=c.f,sel=c.sel,ft=c.ft,pl=c.pl,ob=c.ob,d=c.d;
  const objK=+ob.kcal||0,objP=+ob.prot||0,obm=objetivoMacros();
  const mt=microTotales(sel),cortos=microCortos(sel);
  const gruposHtml=c.lista.length?FOOD_POS.map(function(g){
    const xs=c.lista.filter(function(x){return (x.p||'comida')===g;});if(!xs.length)return '';
    return '<div class="moment">'+g+'</div>'+xs.map(function(x){
      const peso=(x.ean||x.alim)?(' · '+x.g+' g'):(' · '+rac(x.rac));
      return '<div class="logrow"><span class="nm"><b>'+esc(x.emoji?(x.emoji+' '):'')+esc(x.nombre)+'</b><span>'+esc(x.marca||'')+peso+'</span></span>'+
        '<span class="kc">'+(x.kcal||0)+' kcal</span>'+
        '<span class="row" style="gap:2px">'+
        '<button class="btn s" style="padding:3px 7px" data-a="fe-less" data-key="'+sel+'" data-id="'+x.id+'" title="quitar un poco">−</button>'+
        '<button class="btn s" style="padding:3px 7px" data-a="fe-more" data-key="'+sel+'" data-id="'+x.id+'" title="añadir un poco">+</button>'+
        '<button class="btn d s" style="padding:3px 7px" data-a="fe-del" data-key="'+sel+'" data-id="'+x.id+'" title="quitar la toma">×</button></span></div>';}).join('');
    }).join(''):'<p class="empty">Nada apuntado todavía este día.</p>';
  const sem=(function(){
    const ini=mondayOf(d),out=[];
    for(let i=0;i<7;i++){const dd=addDays(ini,i),k=iso(dd);
      out.push({k:k,nm:DAYSH[i],hoy:k===c.hoy,ver:k===sel,pl:planTotalsOf(k).kcal,lg:foodTotals(k).kcal});}
    return out;})();
  /* la barra de cada día se mide contra el objetivo si lo hay y, si no, contra el día más alto de la
     semana: sin referencia una barra al 100 % no significa nada (era el fallo de la versión vieja) */
  const tope=Math.max(objK,sem.reduce(function(a,x){return Math.max(a,x.lg||0);},0),1);
  const conDato=sem.filter(function(x){return (x.lg||0)>0;});
  const restan=objK?(objK-ft.kcal):null;
  $('#main').innerHTML='<div class="grid">'+
    '<div class="card">'+
      '<div class="row" style="justify-content:space-between;margin-bottom:10px">'+
        '<span class="row" style="gap:6px"><button class="btn s" data-a="food-prev">‹</button>'+
        '<input type="date" value="'+sel+'" data-a="food-day" style="width:146px">'+
        '<button class="btn s" data-a="food-next">›</button>'+
        (sel===c.hoy?'':'<button class="btn s" data-a="food-today">hoy</button>')+'</span>'+
        '<span class="mini">'+DAYN[(d.getDay()+6)%7]+' '+d.getDate()+' '+MON[d.getMonth()]+'</span></div>'+
      '<div class="kcalhero">'+
        kcalRingHTML(ft.kcal,objK)+
        '<div class="heroside">'+
          '<div class="macros">'+
            macroHTML('proteína',ft.prot,obm.prot,'p')+
            macroHTML('carbohidratos',ft.carb,obm.carb,'c')+
            macroHTML('grasa',ft.gresa,obm.gresa,'g')+
          '</div>'+
          /* cifras, no barras: «te quedan» y «cocinado» no son progreso hacia nada */
          '<div class="dosdatos">'+
            '<div><b>'+(restan==null?'—':(restan>=0?restan:('+'+(-restan))))+'</b><span>'+(restan==null?'sin objetivo':(restan>=0?'te quedan':'te has pasado'))+'</span></div>'+
            '<div><b>'+(pl.kcal||0)+'</b><span>cocinado hoy</span></div>'+
          '</div>'+
          '<button class="btn s" style="align-self:flex-start" data-a="food-obj-toggle">'+(ui.foodObjOpen?'▴ objetivo':'✎ objetivo')+'</button>'+
        '</div>'+
      '</div>'+

      (ui.foodObjOpen?('<div class="row" style="margin-top:2px;border-top:1px solid var(--line);padding-top:10px">'+
        '<label class="fld" style="flex:0 0 110px">kcal/día<input type="number" min="0" max="6000" step="50" value="'+objK+'" data-a="food-ob" data-k="kcal"></label>'+
        '<label class="fld" style="flex:0 0 110px">proteína (g)<input type="number" min="0" max="400" step="5" value="'+objP+'" data-a="food-ob" data-k="prot"></label>'+
        '<label class="fld" style="flex:0 0 110px">carbohidr. (g)<input type="number" min="0" max="800" step="10" value="'+(+ob.carb||0)+'" data-a="food-ob" data-k="carb" placeholder="'+obm.carb+'"></label>'+
        '<label class="fld" style="flex:0 0 100px">grasa (g)<input type="number" min="0" max="300" step="5" value="'+(+ob.gresa||0)+'" data-a="food-ob" data-k="gresa" placeholder="'+obm.gresa+'"></label>'+
        '<label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn s" data-a="food-sugerir">sugerir desde mis menús</button></label>'+
        /* la puerta a TU perfil va aquí, que es donde se miran las kcal: tu altura, tu peso y si
           eres celíaco son justo lo que decide estos números. La tenía metida dentro de «apuntar
           algo» y ahí no la encuentra nadie. */
        '<label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn s" data-a="food-vista" data-v="perfil">'+
          gymIco('balanza','gico sm')+' tú: peso, altura y gluten</button></label></div>'+
        (obm.derivado&&objK?('<p class="mini" style="margin:6px 0 0">El carbohidrato y la grasa salen de repartir a partes '+
          'iguales las kcal que quedan tras la proteína. Si sigues otro reparto, ponlos aquí.</p>'):'')):'')+
      microLineaHTML(sel)+
    '</div>'+
    /* la barra de buscar es LA acción de esta pantalla, y va suelta para que se lea como una puerta */
    '<button class="buscaz" data-a="food-vista" data-v="buscar">'+gymIco('lupa','gico')+
      '<b>Apuntar algo</b> · busca entre todo<span class="kbd">'+foodBuscables().length+'</span></button>'+
    cadenaHTML()+
    /* Micronutrientes eran nueve casillas que se llevaban el 25 % de la portada con información de
       consulta. Ahora es una línea de nueve puntos con su pantalla detrás. */
    /* los favoritos eran otra lista de accesos rápidos en la portada, y el buscador ya abre con lo
       que más apuntas —contado de tu historial, sin tener que marcar nada—. El ★ sigue en Mis productos. */
    '<div class="card"><h2>Lo de este día <span class="mini">'+c.lista.length+' toma'+(c.lista.length===1?'':'s')+'</span></h2>'+
      '<div class="foodlog">'+gruposHtml+'</div></div>'+
    '<div class="card"><h2>La semana</h2>'+
      '<div class="semtira">'+sem.map(function(x){
        const alto=Math.round((x.lg||0)/tope*100);
        return '<button class="semd'+(x.ver?' ver':'')+(x.hoy?' hoy':'')+'" data-a="food-jump" data-key="'+x.k+'" title="'+(x.lg||0)+' kcal">'+
          '<span class="semb'+(objK&&x.lg>objK?' pasada':'')+'"><i style="height:'+Math.min(100,alto)+'%"></i></span>'+
          '<span class="nm">'+x.nm+'</span></button>';}).join('')+'</div>'+
      '<p class="mini" style="margin-top:9px">'+(conDato.length?
        ('media de lo apuntado: <b style="color:var(--ink)">'+Math.round(conDato.reduce(function(a,x){return a+x.lg;},0)/conDato.length)+' kcal</b>'+
         (objK?(' · objetivo '+objK):' · sin objetivo puesto')):
        'esta semana no has apuntado nada todavía')+'</p></div>'+
    /* Menú, Cocina y Compra ya están en la cadena de arriba: repetirlos aquí abajo como fichas era
       tener dos veces la misma puerta en la misma pantalla. Aquí quedan las tres despensas. */
    '<div class="puertas">'+
      '<button class="puerta" data-a="food-vista" data-v="platos">'+gymIco('libro')+
        '<b>Mis platos</b><span class="s">'+store.dishes.length+' guardados</span></button>'+
      '<button class="puerta" data-a="food-vista" data-v="nevera">'+gymIco('nevera')+
        '<b>Mi nevera</b><span class="s">'+neveraAlimentos().length+' cosas</span></button>'+
      '<button class="puerta" data-a="food-vista" data-v="alimentos">'+gymIco('manzana')+
        '<b>Alimentos</b><span class="s">'+alimTodos().length+' con micros</span></button>'+
    '</div></div>';
}
function cadenaHTML(){
  /* la cadena: el menú manda en las tandas y las tandas mandan en la compra. Hasta ahora eran tres
     destinos distintos que no se nombraban entre ellos, aunque el código ya los encadenaba así. */
  const days=weekDays(),pb=planBatches(days);
  let sesiones=0,raciones=0;
  Object.keys(pb).forEach(function(k){const b=pb[k];if(!b.hasNeed)return;sesiones++;raciones+=b.portions||0;});
  const plan=days.map(function(d){
    return d.key?planTotalsOf(d.key).kcal:(d.shiftId?dayTotals(d.shiftId).kcal:0);
  }).filter(function(x){return x>0;});
  const media=plan.length?Math.round(plan.reduce(function(a,x){return a+x;},0)/plan.length):0;
  const listos=platosCocinables().listos.length;
  const c=compraDatos();
  const esl=function(cls,ico,tit,txt,accion){
    return '<button class="eslabon '+cls+'" '+accion+'>'+
      '<span class="pto">'+gymIco(ico)+'</span>'+
      '<span class="tx"><b>'+tit+'</b><span>'+txt+'</span></span>'+
      gymIco('chevron','gico sm ch')+'</button>';};
  const n=function(v){return '<em>'+v+'</em>';};
  return '<div class="card"><h2>Esta semana <span class="mini">'+esc(rangoSemanaTxt())+'</span></h2>'+
    '<p class="note" style="margin:0 0 2px">El menú manda en las tandas, y las tandas en la compra.</p>'+
    '<div class="cadena">'+
      esl('m','libro','Menú',n(store.shifts.length)+' tipos de día'+
        (media?(' · '+n(media)+' kcal/día planificadas'):' · sin menús puestos'),
        'data-a="tab" data-t="types"')+
      esl('c','olla','Cocina',n(sesiones)+' tanda'+(sesiones===1?'':'s')+' · '+n(raciones)+' raciones · '+
        n(listos)+' plato'+(listos===1?'':'s')+' te sale'+(listos===1?'':'n')+' hoy',
        'data-a="food-vista" data-v="cocina-panel"')+
      esl('k','lista','Compra',n(c.total)+' cosa'+(c.total===1?'':'s')+' · '+n(c.marcados)+' ya las tienes',
        'data-a="tab" data-t="shop"')+
    '</div></div>';}
function rangoSemanaTxt(){
  /* en modo plantilla la semana no tiene fechas: se dice el patrón, que es lo que la define */
  const d=weekDays();
  if(!d.length)return '';
  const a=parseDate(d[0].key),b=parseDate(d[d.length-1].key);
  if(!a||!b){const pt=store.patterns[store.rotation.pattern];return pt?('plantilla · '+pt.name):'plantilla';}
  return 'del '+a.getDate()+' al '+b.getDate()+' de '+MON[b.getMonth()];}
function foodBuscables(){
  /* todo lo que se puede apuntar, en una sola lista: los productos que has guardado y tus platos */
  const f=food(),out=[];
  Object.keys(f.eans).forEach(function(k){const x=f.eans[k];
    out.push({v:'ean:'+x.ean,nombre:x.nombre||'',busca:alimTxt(x.nombre+' '+(x.marca||'')+' '+x.ean),
      kcal:+x.kcal||0,prot:+x.prot||0,base:100,porDefecto:150,unidad:'/100 g',etiqueta:'producto',
      tipo:'ean',em:'📦',sub:(x.marca||'')+(x.envase?(' · '+x.envase):'')});});
  (store.dishes||[]).forEach(function(d){
    out.push({v:'dish:'+d.id,nombre:d.name||'',busca:alimTxt(d.name||''),
      kcal:+d.kcal||0,prot:+d.prot||0,base:1,porDefecto:1,unidad:'/ración',etiqueta:'plato tuyo',
      tipo:'dish',em:d.icon||'🍽',sub:rac(d.portions)+(d.prot?(' · '+fmt(d.prot)+' g P'):'')});});
  alimTodos().forEach(function(a){
    out.push({v:'alim:'+a.id,nombre:a.n||'',busca:alimTxt(a.n+' '+(a.nota||'')),
      kcal:+a.kcal||0,prot:+a.pr||0,base:100,porDefecto:gramosPorDefecto(a),unidad:'/100 g',etiqueta:'alimento',
      tipo:'alim',em:a.e||'🍽',sub:alimSubtexto(a)});});
  return out;}
/* ===================== comida: el buscador, que es LA puerta =====================
   Antes había tres listas separadas —86 alimentos, 188 productos, 16 platos— y antes de buscar
   había que acertar en cuál de los tres mundos vivía lo que querías. Ahora hay un campo y una
   lista. Y sin escribir no se vuelca nada: salen las seis cosas que más apuntas. */
const FOOD_TIPOS=[['','todo'],['alim','alimentos'],['ean','productos'],['dish','mis platos']];
function foodEmoji(x){
  if(x.em)return x.em;
  if(x.tipo==='dish')return '🍽';
  return '📦';}
function frecuentes(n){
  /* lo que más apuntas, contado de tu propio historial: nada que configurar y se adapta solo */
  const f=food(),cuenta={};
  Object.keys(f.log).forEach(function(k){
    (f.log[k]||[]).forEach(function(t){
      const v=t.alim?('alim:'+t.alim):(t.ean?('ean:'+t.ean):(t.dishId?('dish:'+t.dishId):''));
      if(v)cuenta[v]=(cuenta[v]||0)+1;});});
  const todo=foodBuscables(),porV={};
  todo.forEach(function(x){porV[x.v]=x;});
  const orden=Object.keys(cuenta).filter(function(v){return porV[v];})
    .sort(function(a,b){return cuenta[b]-cuenta[a];});
  const out=orden.slice(0,n||6).map(function(v){return porV[v];});
  /* si todavía no has apuntado casi nada, se completa con lo que la app trae: mejor eso que un
     hueco en blanco la primera vez que se abre */
  if(out.length<(n||6)){
    const ya={};out.forEach(function(x){ya[x.v]=1;});
    ['alim:al-platano','alim:al-huevo','alim:al-pechuga-de-pollo','alim:al-copos-de-avena',
     'alim:al-yogur-natural','alim:al-arroz-blanco'].forEach(function(v){
      if(out.length>=(n||6)||ya[v]||!porV[v])return;out.push(porV[v]);ya[v]=1;});}
  return out;}
function foodBuscar(q,tipo){
  const t=alimTxt(q).trim();
  return foodBuscables().filter(function(x){
    if(tipo&&x.tipo!==tipo)return false;
    if(!t)return true;
    return x.busca.indexOf(t)>=0;
  }).sort(function(a,b){
    if(t){const ia=alimTxt(a.nombre).indexOf(t)===0?0:1,ib=alimTxt(b.nombre).indexOf(t)===0?0:1;
      if(ia!==ib)return ia-ib;}
    return String(a.nombre).localeCompare(String(b.nombre),'es');});}
function hitHTML(x,sel){
  /* dos gestos en la misma fila: el + apunta con la cantidad de siempre, y tocar el nombre abre la
     hoja para cambiarla. Es lo que el usuario eligió. */
  return '<div class="hit">'+
    '<button class="hitnom" data-a="food-abrir" data-v="'+esc(x.v)+'">'+
      '<span class="em">'+esc(foodEmoji(x))+'</span>'+
      '<span class="nm"><b>'+esc(x.nombre)+'</b><span>'+esc(x.sub||'')+'</span></span>'+
      '<span class="kc">'+(x.kcal||0)+'<small>'+esc(x.unidad)+'</small></span></button>'+
    '<button class="add" data-a="food-rapido" data-v="'+esc(x.v)+'" data-key="'+esc(sel)+'" '+
      'title="apuntar '+esc(x.porDefecto+(x.base===1?' ración':' g'))+'" aria-label="apuntar '+esc(x.nombre)+'">'+
      gymIco('mas','gico sm')+'</button></div>';}
function apuntaBuscable(key,x,cant,pos){
  /* del buscable al registro del día, sea lo que sea: así el + y la hoja hacen exactamente lo mismo */
  const m=/^(alim|ean|dish):(.+)$/.exec(x.v);
  if(!m)return 'no sé qué es eso';
  const opt=(m[1]==='dish')?{dishId:m[2],rac:cant,pos:pos,when:pos}:
    (m[1]==='ean'?{ean:m[2],grams:cant,pos:pos,when:pos}:{alim:m[2],grams:cant,pos:pos,when:pos});
  return addFoodEntry(key,opt);}
function renderFoodBuscar(){
  const c=foodCtx(),sel=c.sel;
  const q=ui.foodBusca||'',tipo=ui.foodTipo||'';
  const hay=q.trim().length>0;
  const res=hay?foodBuscar(q,tipo):[];
  const porTipo=function(t){return foodBuscar(q,t).length;};
  const grupos=[['alim','Alimentos'],['dish','Mis platos'],['ean','Mis productos']];
  let cuerpo='';
  if(!hay){
    const fr=frecuentes(6);
    cuerpo='<div class="card"><h2>Lo que más apuntas</h2>'+
      fr.map(function(x){return hitHTML(x,sel);}).join('')+
      '<p class="mini" style="margin:11px 0 0">Escribe arriba para buscar entre las <b style="color:var(--ink)">'+
        foodBuscables().length+'</b> cosas que tienes. Ya no hay ninguna lista larga que recorrer.</p></div>';
  }else if(!res.length){
    cuerpo='<div class="card"><div class="empty">Nada se llama así. Puedes escanearlo, apuntarlo a mano o '+
      'añadirlo como alimento tuyo.</div></div>';
  }else{
    const trozos=grupos.map(function(g){
      const l=res.filter(function(x){return x.tipo===g[0];});
      if(!l.length)return '';
      return '<div class="grp">'+esc(g[1])+'</div>'+l.slice(0,12).map(function(x){return hitHTML(x,sel);}).join('')+
        (l.length>12?('<p class="mini" style="margin:7px 0 0">y '+(l.length-12)+' más de este tipo: afina la búsqueda</p>'):'');
    }).filter(Boolean).join('');
    cuerpo='<div class="card">'+trozos+'</div>';}
  $('#main').innerHTML='<div class="grid">'+
    foodSubcab('Apuntar','<span class="tag b2">'+c.ft.kcal+' kcal</span>')+
    '<div class="buscador">'+gymIco('lupa','gico sm')+
      '<input id="fbQ" value="'+esc(q)+'" data-a="food-busca" placeholder="pollo, yogur, lentejas…" '+
      'autocomplete="off" autocapitalize="none">'+
      (q?('<button class="btn s" data-a="food-busca-clear" style="margin-right:6px" aria-label="borrar">×</button>'):'')+
    '</div>'+
    '<div class="chips">'+FOOD_TIPOS.map(function(t){
      const n=hay?porTipo(t[0]):(t[0]?foodBuscar('',t[0]).length:foodBuscables().length);
      return '<button class="chipx'+(tipo===t[0]?' on':'')+'" data-a="food-tipo" data-t="'+t[0]+'">'+
        esc(t[1])+' <b>'+n+'</b></button>';}).join('')+'</div>'+
    cuerpo+
    '<div class="row">'+
      '<button class="btn s" data-a="food-panel2" data-k="scan">'+gymIco('camara','gico sm')+' escanear</button>'+
      '<button class="btn s" data-a="food-panel2" data-k="mano">'+gymIco('lapiz','gico sm')+' a mano</button>'+
      '<button class="btn s" data-a="food-vista" data-v="productos">'+gymIco('caja','gico sm')+' mis productos</button>'+
      '<button class="btn s" data-a="food-vista" data-v="perfil">'+gymIco('balanza','gico sm')+' tú</button>'+
    '</div></div>';
}
/* ---------- la hoja de cantidad ----------
   Un toque en el nombre trae aquí. Raciones de verdad en vez de un número pelado, la previa de kcal
   y macros mientras tocas, y en el propio botón lo que te va a quedar del día. */
function buscableDe(v){
  const todo=foodBuscables();
  for(let i=0;i<todo.length;i++)if(todo[i].v===v)return todo[i];
  return null;}
function racionesDe(x){
  /* cantidades que una persona usa de verdad, no «100 g» a secas */
  if(!x)return [];
  if(x.base===1)return [[0.5,'media ración'],[1,'1 ración'],[1.5,'1 ración y media'],[2,'2 raciones']];
  const m=/^alim:(.+)$/.exec(x.v),a=m?alimById(m[1]):null;
  const g=a?a.g:'';
  if(g==='fruta')return [[1,'1 pieza',120],[80,'80 g'],[120,'120 g'],[200,'200 g']];
  if(g==='carne'||g==='pescado')return [[120,'1 filete · 120 g'],[150,'150 g'],[180,'180 g'],[250,'1 pieza · 250 g']];
  if(g==='cereal'||g==='legumbre')return [[60,'60 g en crudo'],[80,'80 g'],[100,'100 g'],[150,'150 g']];
  if(g==='lacteo')return [[125,'1 yogur · 125 g'],[200,'1 vaso · 200 ml'],[250,'250 ml'],[100,'100 g']];
  if(g==='graso')return [[10,'1 cucharada · 10 g'],[15,'15 g'],[30,'30 g'],[5,'5 g']];
  if(g==='verdura')return [[100,'100 g'],[150,'150 g'],[200,'200 g'],[250,'1 plato · 250 g']];
  return [[100,'100 g'],[150,'150 g'],[200,'200 g'],[50,'50 g']];}
function previaDe(x,cant){
  const q=cant/(x.base||100);
  return {kcal:Math.round((x.kcal||0)*q),prot:Math.round((x.prot||0)*q*10)/10};}
function previaMacrosDe(x,cant){
  /* los cuatro números de la previa. Los macros completos solo los tienen los alimentos y los
     productos; un plato guarda kcal y proteína, así que ahí se dicen dos y no se inventan cuatro. */
  const m=/^(alim|ean|dish):(.+)$/.exec(x.v);
  if(!m)return null;
  if(m[1]==='alim'){const a=alimById(m[2]);if(!a)return null;
    const p=alimPorcion(a,cant);return {kcal:p.kcal,prot:p.pr,carb:p.ch,gresa:p.gr};}
  if(m[1]==='ean'){const pr=food().eans[m[2]];if(!pr)return null;
    const p=porcionDe(pr,cant);return {kcal:p.kcal,prot:p.prot,carb:p.carb,gresa:p.gresa};}
  const b=previaDe(x,cant);return {kcal:b.kcal,prot:b.prot};}
function renderFoodCantidad(){
  const x=buscableDe(ui.foodSel||'');
  if(!x){ui.foodVista='buscar';return renderFoodBuscar();}
  const c=foodCtx(),sel=c.sel,ob=objetivoMacros();
  const cant=+ui.foodCant||x.porDefecto;
  const mac=previaMacrosDe(x,cant)||{kcal:0,prot:0};
  const paso=x.base===1?0.25:(cant<30?5:10);
  const restan=ob.kcal?(ob.kcal-c.ft.kcal-mac.kcal):null;
  const pctProt=ob.prot?Math.round(mac.prot/ob.prot*100):0;
  const cajas=[['kcal',mac.kcal],['prot. g',fmt(mac.prot)]]
    .concat(mac.carb!=null?[['carb. g',fmt(mac.carb)],['grasa g',fmt(mac.gresa)]]:[]);
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="food-vista" data-v="buscar">'+gymIco('atras','gico sm')+' Apuntar</button>'+
      '<h2 class="subtit">'+esc(x.nombre)+'</h2></div>'+
    '<div class="hoja">'+
      '<div class="row" style="align-items:flex-start;gap:11px">'+
        '<span style="font-size:34px;line-height:1">'+esc(foodEmoji(x))+'</span>'+
        '<span style="flex:1;min-width:0"><b style="font-size:16px;display:block">'+esc(x.nombre)+'</b>'+
        '<span class="mini">'+esc(x.etiqueta)+(x.sub?(' · '+esc(x.sub)):'')+' · '+(x.kcal||0)+' kcal '+esc(x.unidad)+'</span></span>'+
      '</div>'+
      '<div class="pasos">'+
        '<button data-a="food-cant-paso" data-d="-'+paso+'" aria-label="menos">−</button>'+
        '<span class="val"><b id="fcVal">'+fmt(cant)+'</b><span>'+(x.base===1?'raciones':'gramos')+'</span></span>'+
        '<button data-a="food-cant-paso" data-d="'+paso+'" aria-label="más">+</button>'+
      '</div>'+
      '<div class="rac">'+racionesDe(x).map(function(r){
        const v=(r.length>2)?r[2]:r[0];
        return '<button class="racb'+(Math.abs(v-cant)<0.001?' on':'')+'" data-a="food-cant-set" data-n="'+v+'">'+
          esc(r[1])+'</button>';}).join('')+'</div>'+
      '<div class="previa" id="fcPrevia">'+cajas.map(function(k){
        return '<div><b>'+k[1]+'</b><span>'+k[0]+'</span></div>';}).join('')+'</div>'+
      '<div class="chips" style="margin-top:12px">'+FOOD_POS.slice(0,3).concat(['otro']).map(function(p){
        const act=(ui.foodPos||momentoAhora());
        if(p==='otro')return '<label class="chipx" style="gap:4px">otro<select data-a="food-pos" style="width:96px;padding:2px 4px;font-size:12px">'+
          posOptions(act)+'</select></label>';
        return '<button class="chipx'+(act===p?' on':'')+'" data-a="food-pos-b" data-p="'+p+'">'+esc(p)+'</button>';}).join('')+
      '</div>'+
      '<button class="btn p gbig" style="margin-top:13px" data-a="food-apuntar" data-key="'+esc(sel)+'">'+
        gymIco('mas','gico sm')+' apuntar'+(restan!=null?(' · te quedarán '+Math.max(0,restan)+' kcal'):'')+'</button>'+
      (pctProt?('<p class="mini" style="text-align:center;margin:9px 0 0">Aporta el <b style="color:var(--ink)">'+
        pctProt+' %</b> de tu proteína del día.</p>'):'')+
    '</div></div>';
}
/* ===================== Cocina: tres destinos en una pantalla =====================
   «Qué cocino», «Mi nevera» e «Ideas» eran tres puertas distintas para la misma pregunta: qué hago
   de comer. Ahora son tres pestañas de la misma. */
const COCINA_TABS=[['','Qué hago hoy'],['nevera','Mi nevera'],['lote','En lote']];
function renderCocinaPanel(){
  const tab=ui.cocinaTab||'';
  const dentro=neveraAlimentos();
  const cab='<div class="pest">'+COCINA_TABS.map(function(t){
    const n=(t[0]==='nevera'&&dentro.length)?(' '+dentro.length):'';
    return '<button class="pestb'+(tab===t[0]?' on':'')+'" data-a="cocina-tab" data-t="'+t[0]+'">'+
      esc(t[1])+n+'</button>';}).join('')+'</div>';
  let cuerpo='';
  if(tab==='nevera')cuerpo=neveraCuerpoHTML();
  else if(tab==='lote')cuerpo=loteCuerpoHTML();
  else cuerpo=queHagoHTML();
  $('#main').innerHTML='<div class="grid">'+
    foodSubcab('Cocina')+cab+cuerpo+'</div>';
}
function queHagoHTML(){
  const c=foodCtx(),ob=objetivoMacros();
  const huecoK=ob.kcal?Math.max(0,ob.kcal-c.ft.kcal):0;
  const huecoP=ob.prot?Math.max(0,ob.prot-c.ft.prot):0;
  const dentro=neveraAlimentos();
  const combis=combinaciones(huecoK,huecoP);
  ui.ideasCache=combis;
  const pc=platosCocinables();
  const tarjeta=function(x,listo){
    const d=x.dish;
    return '<div class="idea'+(listo?' buena':'')+'">'+
      '<h4>'+esc(d.icon||'🍽')+' '+esc(d.name)+(listo?' <span class="tag b3">tienes todo</span>':'')+'</h4>'+
      '<p class="por">'+(listo?(rac(d.portions)+' · '+(d.kcal||0)+' kcal y '+fmt(d.prot||0)+' g P por ración'):
        ('te falta: '+esc(x.faltan.slice(0,3).join(', '))))+'</p>'+
      '<div class="row" style="margin-top:9px">'+
        (listo?('<button class="btn s" data-a="food-cocina" data-id="'+d.id+'">'+gymIco('olla','gico sm')+' cocinar</button>'):
          ('<button class="btn s" data-a="cocinar-compra" data-id="'+d.id+'">'+gymIco('mas','gico sm')+' a la compra</button>'))+
      '</div></div>';};
  return '<p class="note" style="margin:0">'+(dentro.length?
      ('Con las '+dentro.length+' cosas de tu nevera'+(huecoK?(', y cuadrado con las <b>'+huecoK+' kcal</b> y los <b>'+
        Math.round(huecoP)+' g de proteína</b> que te quedan hoy'):'')+'.'):
      'Apunta lo que tienes en casa en «Mi nevera» y esto se llena solo.')+'</p>'+
    '<div class="card"><h2>Te sale entero <span class="mini">'+pc.listos.length+'</span></h2>'+
      (pc.listos.length?pc.listos.slice(0,3).map(function(x){return tarjeta(x,true);}).join(''):
        '<div class="empty">Ninguno con lo que hay apuntado ahora mismo.</div>')+
      (pc.listos.length>3?('<button class="btn s" style="margin-top:9px" data-a="food-vista" data-v="platos">'+
        'y '+(pc.listos.length-3)+' más en Mis platos</button>'):'')+'</div>'+
    (combis.length?('<div class="card"><h2>Combinaciones '+gymIco('chispa','gico sm')+'</h2>'+
      '<p class="note" style="margin-bottom:2px">Armadas con lo que tienes. Para una comida, no para el día entero.</p>'+
      combis.slice(0,1).map(function(x,ix){
        const bien=Math.abs(x.t.kcal-x.meta.kcal)<=x.meta.kcal*0.2&&x.t.pr>=x.meta.prot*0.8;
        return '<div class="idea'+(bien?' buena':'')+'">'+
          '<h4>'+esc(x.nombre)+'</h4>'+
          '<p class="por">'+x.t.kcal+' kcal · '+fmt(x.t.pr)+' g P · '+fmt(x.t.ch)+' g C · '+fmt(x.t.gr)+' g G'+
            (bien?' · cuadra con lo que te queda':'')+'</p>'+
          x.partes.map(function(pt){
            return '<div class="ingr"><span>'+esc(pt.a.e||'')+' '+esc(String(pt.a.n).toLowerCase())+
              (/crud/i.test(pt.a.nota||'')?' <span class="mini">(en crudo)</span>':'')+'</span><b>'+pt.g+' g</b></div>';}).join('')+
          '<div class="row" style="margin-top:9px">'+
            '<button class="btn s" data-a="idea-guardar" data-ix="'+ix+'">guardar como plato</button>'+
            '<button class="btn s" data-a="idea-apuntar" data-ix="'+ix+'" data-key="'+c.sel+'">apuntarlo ya</button></div>'+
        '</div>';}).join('')+'</div>'):'')+
    (pc.casi.length?('<div class="card"><h2>Te falta poco <span class="mini">'+pc.casi.length+'</span></h2>'+
      pc.casi.slice(0,2).map(function(x){return tarjeta(x,false);}).join('')+'</div>'):'');}
function despensaCardHTML(){
  /* LO QUE HAY Y CUÁNTO. Con cantidad se puede gastar, y lo que se gasta vuelve solo a la lista de
     la compra: es lo que cierra el círculo comprar → cocinar → comprar. */
  const l=despensaS().slice().sort(function(a,b){
    const sa=COMPRA_SECS.map(function(x){return x[0];});
    const da=sa.indexOf(a.sec||'otros'),db=sa.indexOf(b.sec||'otros');
    if(da!==db)return da-db;
    return String(a.nom).localeCompare(String(b.nom),'es');});
  const filas=l.map(function(x){
    const sc=COMPRA_SECS.filter(function(y){return y[0]===x.sec;})[0];
    const glu=esCeliaco()?glutenChipHTML(glutenDe(x.nom),true):'';
    return '<div class="dfila">'+
      '<span class="i" aria-hidden="true">'+((sc&&sc[2])||'\ud83d\uded2')+'</span>'+
      '<span class="n">'+esc(x.nom)+glu+'</span>'+
      '<span class="q">'+(x.q?(fmtKg(x.q)+(x.uni?(' '+x.uni):'')):'—')+'</span>'+
      '<button class="btn s" data-a="desp-gasta" data-k="'+esc(x.k)+'" title="he gastado un poco">'+
        (x.q&&pasoDeGasto(x)?('−'+fmt(pasoDeGasto(x))+(x.uni||'')):'gastar')+'</button>'+
      '<button class="btn d s" data-a="desp-quitar" data-k="'+esc(x.k)+'" aria-label="quitar">×</button>'+
      '</div>';}).join('');
  return '<div class="card"><h2>La despensa</h2>'+
    '<p class="note">Lo que hay en casa Y cuánto. Al gastarlo baja, y cuando se acaba vuelve solo a la '+
    'lista de la compra. Entra sola al pulsar «he hecho esta compra».</p>'+
    (l.length?('<div class="dlista">'+filas+'</div>')
      :'<div class="empty">Vacía. Haz la compra y pulsa «he hecho esta compra», o mete algo aquí abajo.</div>')+
    '<div class="row" style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px">'+
      '<label class="fld" style="flex:1 1 200px">he metido en casa'+
      '<input id="despAdd" placeholder="500 g lenteja pardina"></label>'+
      '<button class="btn p" data-a="desp-add">a la despensa</button></div>'+
    '</div>';}
function neveraCuerpoHTML(){
  const dentro=neveraAlimentos(),q=ui.neveraQ||'';
  const sug=q?alimBuscar(q,'').filter(function(a){return food().nevera.indexOf(a.id)<0;}).slice(0,8):[];
  return despensaCardHTML()+
    /* la lista de abajo son los alimentos de la tabla, que es lo que hace falta para las ideas de
       cocina; la de arriba es lo que hay y cuánto. Se dice, porque si no parecen la misma lista
       dos veces. */
    '<p class="note" style="margin:0">Y esto es lo que la app reconoce de ahí para darte ideas: lo de '+
    'la despensa entra solo, y aquí puedes añadir lo que se le haya escapado.</p>'+
    '<div class="buscador">'+gymIco('lupa','gico sm')+
      '<input id="nvQ" value="'+esc(q)+'" data-a="nevera-busca" placeholder="añadir algo que tengas…"></div>'+
    (sug.length?('<div class="card">'+sug.map(function(a){
      return '<div class="hit"><button class="hitnom" data-a="nevera-add" data-id="'+esc(a.id)+'">'+
        '<span class="em">'+esc(a.e||'🍽')+'</span>'+
        '<span class="nm"><b>'+esc(a.n)+'</b><span>'+esc(alimSubtexto(a))+'</span></span></button>'+
        '<button class="add" data-a="nevera-add" data-id="'+esc(a.id)+'" aria-label="a la nevera">'+
        gymIco('mas','gico sm')+'</button></div>';}).join('')+'</div>'):
      (q?'<div class="card"><div class="empty">Nada se llama así en la tabla de alimentos.</div></div>':''))+
    '<div class="card"><h2>En casa <span class="mini">'+dentro.length+'</span></h2>'+
      (dentro.length?('<div class="chips">'+dentro.map(function(a){
        return '<span class="chipx">'+esc(a.e||'🍽')+' '+esc(a.n)+
          '<button class="x" data-a="nevera-del" data-id="'+esc(a.id)+'" aria-label="quitar '+esc(a.n)+'">×</button></span>';}).join('')+'</div>'):
        '<div class="empty">Vacía. Busca arriba lo que tengas, o tráelo de tu lista de la compra.</div>')+
      '<div class="row" style="margin-top:11px">'+
        '<button class="btn s" data-a="nevera-compra">'+gymIco('lista','gico sm')+' de mi lista de la compra</button>'+
        (dentro.length?'<button class="btn s" data-a="nevera-vaciar">vaciar</button>':'')+'</div></div>'+
    (dentro.length?('<button class="btn p gbig" data-a="cocina-tab" data-t="">'+gymIco('chispa','gico sm')+
      ' qué hago con esto</button>'):'');}
function loteCuerpoHTML(){
  /* «Cocina en lote» era una pantalla aparte de 5 356 px —casi seis pantallas de móvil— porque
     repetía, de cada plato de cada sesión, los pasos enteros. Los pasos se siguen en el modo cocina,
     que es donde se cocina; aquí hace falta saber qué sesiones hay, qué sale de cada una y qué
     ingredientes pide, con una abierta cada vez. */
  const pb=planBatches(weekDays());
  const usadas=Object.keys(pb).map(function(k){return pb[k];}).filter(function(b){return b.hasNeed;});
  const otras=Object.keys(pb).map(function(k){return pb[k];}).filter(function(b){return !b.hasNeed;});
  if(!usadas.length&&!otras.length)
    return '<div class="card"><div class="empty">No hay ninguna sesión de cocina montada. Se crean marcando '+
      'un plato como «de tanda» en Mis platos.</div></div>';
  const abierta=ui.tandaAbierta||(usadas[0]&&usadas[0].id)||'';
  const tarjeta=function(b,activa){
    const list=b.items.filter(function(i){return i.runs>0;});
    const abierto=(b.id===abierta);
    const ing=abierto&&activa?ingredientsFor(list):[];
    const sobra=Math.round(list.reduce(function(a,i){return a+Math.max(0,(i.cooked||0)-(i.needPort||0));},0)*10)/10;
    return '<div class="tanda'+(abierto?' on':'')+'">'+
      '<button class="th" data-a="tanda-abrir" data-id="'+esc(b.id)+'" aria-expanded="'+(abierto?'true':'false')+'">'+
        '<span class="nm"><span class="dia">'+esc(b.label)+'</span>'+
        '<span class="sub">'+(activa?(list.length+' plato'+(list.length===1?'':'s')):'no entra esta semana')+
          (b.when?(' · '+esc(b.when)):'')+'</span></span>'+
        (activa?('<span class="rac">'+b.portions+' raciones</span>'):'')+
        gymIco('chevron','gico sm ch'+(abierto?' abajo':''))+'</button>'+
      (abierto?('<div class="tb">'+
        (activa?list.map(function(i){
          return '<div class="fila"><span class="em">'+esc(i.dish.icon||'🍽')+'</span>'+
            '<span class="nm"><b>'+esc(i.dish.name)+'</b><span>'+rac(i.cooked)+' · '+(i.dish.kcal||0)+' kcal'+
            (i.needPort?(' · tocan '+fmt(i.needPort)):'')+'</span></span>'+
            '<button class="mini2" data-a="food-cocina" data-id="'+i.dish.id+'">cocinar</button></div>';}).join(''):
          '<p class="mini" style="margin:9px 0 0">Ningún plato de esta sesión entra en el menú de esta semana.</p>')+
        (ing.length?('<p class="mini" style="margin:11px 0 3px"><b style="color:var(--ink)">Para toda la sesión</b> '+
          '· cantidades ya escaladas a estas tandas</p><div class="chips">'+
          ing.map(function(x){return '<span class="chipx">'+esc((x.q?x.q+' ':'')+x.item)+'</span>';}).join('')+'</div>'):'')+
        (sobra>0?('<p class="mini" style="margin:9px 0 0">Sobran '+fmt(sobra)+' raciones: al congelador.</p>'):'')+
        '<div class="row" style="margin-top:10px">'+
          '<button class="btn s" data-a="batch-edit" data-id="'+esc(b.id)+'">editar la sesión</button>'+
          '<span class="sp"></span><button class="btn s" data-a="print">imprimir</button></div>'+
      '</div>'):'')+
    '</div>';};
  return '<p class="note" style="margin:0">Las sesiones de cocina de esta semana: qué pones al fuego cada día y '+
      'cuántos tápers salen. Salen del menú, así que si cambias lo que come un tipo de día, esto y la compra '+
      'se recalculan solos.</p>'+
    (usadas.length?usadas.map(function(b){return tarjeta(b,true);}).join(''):
      '<div class="card"><div class="empty">Esta semana no hay ninguna sesión de cocina planificada.</div></div>')+
    (otras.length?('<p class="mini" style="margin:12px 0 0">Otras sesiones tuyas, que esta semana no tocan:</p>'+
      otras.map(function(b){return tarjeta(b,false);}).join('')):'');}
/* ===================== Mis platos ===================== */
const PLATOS_TABS=[['','Mis platos'],['antojo','Qué me apetece'],['importar','Importar']];
const ANTOJO_ING=[['pollo','🍗 pollo'],['pescado','🐟 pescado'],['huevo','🥚 huevo'],['ternera','🥩 carne'],
  ['lenteja garbanzo alubia','🫘 legumbre'],['arroz','🍚 arroz'],['pasta','🍝 pasta'],['patata boniato','🥔 patata'],
  ['verdura brocoli espinaca','🥦 verdura'],['queso yogur leche','🥛 lácteo']];
const ANTOJO_KCAL=[['','cualquiera'],['bajo','ligero · hasta 400'],['medio','medio · 400-700'],['alto','fuerte · más de 700']];
const ANTOJO_PROT=[['','cualquiera'],['alto','alta · 30 g o más'],['medio','media · 15-30 g'],['bajo','baja']];
function antojoS(){
  if(!ui.antojo)ui.antojo={ing:[],kcal:'',prot:''};
  if(!Array.isArray(ui.antojo.ing))ui.antojo.ing=[];
  return ui.antojo;}
function platosPorAntojo(){
  /* «qué quiero comer» + los macros aproximados. Busca en tus platos por el ingrediente y por los
     números que ya guarda cada plato; si no llega ninguno, propone combinaciones con la nevera. */
  const a=antojoS();
  const cae=function(v,rango){
    if(!rango)return true;
    if(rango==='bajo')return v<=400;
    if(rango==='medio')return v>400&&v<=700;
    return v>700;};
  const caeP=function(v,rango){
    if(!rango)return true;
    if(rango==='alto')return v>=30;
    if(rango==='medio')return v>=15&&v<30;
    return v<15;};
  return (store.dishes||[]).filter(function(d){
    if(!cae(+d.kcal||0,a.kcal))return false;
    if(!caeP(+d.prot||0,a.prot))return false;
    if(!a.ing.length)return true;
    const txt=alimTxt(d.name+' '+((d.ingredients||[]).join(' ')));
    return a.ing.some(function(g){
      return g.split(' ').some(function(p){return txt.indexOf(alimTxt(p))>=0;});});
  }).sort(function(x,y){return (+y.prot||0)-(+x.prot||0);});}
function renderMisPlatos(){
  const tab=ui.platosTab||'';
  const cab='<div class="pest">'+PLATOS_TABS.map(function(t){
    return '<button class="pestb'+(tab===t[0]?' on':'')+'" data-a="platos-tab" data-t="'+t[0]+'">'+
      esc(t[1])+'</button>';}).join('')+'</div>';
  let cuerpo='';
  if(tab==='antojo')cuerpo=antojoHTML();
  else if(tab==='importar')cuerpo=
    '<p class="note" style="margin:0">Pega el enlace de un vídeo de TikTok o su descripción y la app saca la receta, '+
    'con sus ingredientes y sus pasos.</p>'+
    '<div class="row"><button class="btn p gbig" data-a="tab" data-t="import">'+gymIco('importar','gico sm')+
      ' abrir el importador</button></div>'+
    '<p class="mini" style="margin:0">También puedes compartir el vídeo desde TikTok directamente a «Guardias».</p>';
  else{
    const q=(ui.dishQ||'').toLowerCase();
    const ds=(store.dishes||[]).filter(function(d){return !q||String(d.name||'').toLowerCase().indexOf(q)>=0;});
    cuerpo='<div class="buscador">'+gymIco('lupa','gico sm')+
      '<input id="mpQ" value="'+esc(ui.dishQ||'')+'" data-a="dish-q" placeholder="buscar entre tus platos…"></div>'+
      '<div class="card">'+(ds.length?ds.map(function(d){
        /* la etiqueta de la tanda venía del «Catálogo de platos», que era la otra pantalla que
           pintaba estos mismos platos: al fundirlas no se pierde */
        const b=isBatch(d.batchId)?batchById(d.batchId):null;
        return '<div class="hit"><button class="hitnom" data-a="dish-edit" data-id="'+d.id+'">'+
          '<span class="em">'+esc(d.icon||'🍽')+'</span>'+
          '<span class="nm"><b>'+esc(d.name)+'</b><span>'+rac(d.portions)+' · '+fmt(d.prot||0)+' g P'+
            (b?(' · '+esc(b.label)):'')+'</span></span>'+
          '<span class="kc">'+(d.kcal||0)+'<small>/ración</small></span></button>'+
          '<button class="add" data-a="food-cocina" data-id="'+d.id+'" aria-label="cocinar '+esc(d.name)+'">'+
          gymIco('olla','gico sm')+'</button></div>';}).join(''):
        '<div class="empty">Ningún plato con ese nombre.</div>')+'</div>'+
      '<div class="row"><button class="btn p" data-a="plato-nuevo">'+gymIco('mas','gico sm')+' plato con ingredientes</button>'+
      '<button class="btn s" data-a="dish-new">a mano</button></div>';}
  $('#main').innerHTML='<div class="grid">'+
    foodSubcab('Mis platos','<span class="tag b2">'+(store.dishes||[]).length+'</span>')+cab+cuerpo+'</div>';
}
function antojoHTML(){
  const a=antojoS(),res=platosPorAntojo();
  const c=foodCtx(),ob=objetivoMacros();
  const huecoK=ob.kcal?Math.max(0,ob.kcal-c.ft.kcal):0;
  const chip=function(act,val,txt,accion,extra){
    return '<button class="chipx'+(act?' on':'')+'" data-a="'+accion+'" data-v="'+esc(val)+'"'+(extra||'')+'>'+esc(txt)+'</button>';};
  return '<p class="note" style="margin:0">Dime qué te apetece y más o menos cuánto, y te digo qué platos tuyos encajan.'+
    (huecoK?(' Hoy te quedan <b>'+huecoK+' kcal</b>.'):'')+'</p>'+
    '<div class="card"><h2>Con qué</h2>'+
      '<div class="chips">'+ANTOJO_ING.map(function(g){
        return chip(a.ing.indexOf(g[0])>=0,g[0],g[1],'antojo-ing');}).join('')+'</div>'+
      '<h2 style="margin-top:14px">Cuántas kcal por ración</h2>'+
      '<div class="chips">'+ANTOJO_KCAL.map(function(k){
        return chip(a.kcal===k[0],k[0],k[1],'antojo-kcal');}).join('')+'</div>'+
      '<h2 style="margin-top:14px">Cuánta proteína</h2>'+
      '<div class="chips">'+ANTOJO_PROT.map(function(k){
        return chip(a.prot===k[0],k[0],k[1],'antojo-prot');}).join('')+'</div>'+
      ((a.ing.length||a.kcal||a.prot)?('<div class="row" style="margin-top:11px">'+
        '<button class="btn s" data-a="antojo-limpiar">quitar los filtros</button></div>'):'')+
    '</div>'+
    '<div class="card"><h2>Te encajan <span class="mini">'+res.length+'</span></h2>'+
      (res.length?res.slice(0,10).map(function(d){
        return '<div class="hit"><button class="hitnom" data-a="dish-edit" data-id="'+d.id+'">'+
          '<span class="em">'+esc(d.icon||'🍽')+'</span>'+
          '<span class="nm"><b>'+esc(d.name)+'</b><span>'+rac(d.portions)+' · '+fmt(d.prot||0)+' g proteína</span></span>'+
          '<span class="kc">'+(d.kcal||0)+'<small>/ración</small></span></button>'+
          '<button class="add" data-a="food-rapido" data-v="dish:'+d.id+'" data-key="'+c.sel+'" '+
            'aria-label="apuntar una ración">'+gymIco('mas','gico sm')+'</button></div>';}).join(''):
        '<div class="empty">Ningún plato tuyo encaja con eso. Prueba a soltar un filtro, o mira las combinaciones '+
        'que salen con lo que tienes en la nevera.</div>')+
      '<div class="row" style="margin-top:10px">'+
        '<button class="btn s" data-a="food-vista" data-v="cocina-panel">'+gymIco('chispa','gico sm')+
        ' combinaciones con mi nevera</button></div>'+
    '</div>';}
/* ---------- micronutrientes: una línea en la portada, su pantalla aparte ---------- */
function microColor(p){return p<50?'var(--bad)':(p<80?'var(--warn)':(p>=100?'var(--brand)':'var(--ok)'));}
function microLineaHTML(key){
  const mt=microTotales(key),cortos=microCortos(key);
  const conDato=Object.keys(mt).length>0;
  const pts=ALIM_MICROS.map(function(k){
    const p=conDato?microPct(k,mt[k]||0):0;
    return '<i style="background:'+(conDato?microColor(p):'var(--line)')+'"></i>';}).join('');
  const txt=conDato
    ?(cortos.length?(cortos.length+' por debajo de la mitad · '+cortos.slice(0,3).map(function(k){
        return String(ALIM_LABEL[k]||k).toLowerCase();}).join(', ')):'todo por encima de la mitad de la referencia')
    :'los traen los alimentos de la tabla, no los productos de código de barras';
  return '<button class="microlinea" data-a="food-vista" data-v="micros">'+
    '<span class="pts">'+pts+'</span>'+
    '<span class="tx">Micronutrientes<small>'+esc(txt)+'</small></span>'+
    gymIco('chevron','gico sm')+'</button>';}
function renderFoodMicros(){
  const c=foodCtx(),sel=c.sel;
  const mt=microTotales(sel),cortos=microCortos(sel);
  const conDato=c.lista.filter(function(x){return x.mi&&Object.keys(x.mi).length;}).length;
  const cubrir=cortos.slice(0,3).map(function(k){
    const ricos=alimRicosEn(k,1)[0];
    if(!ricos)return '';
    return '<div class="hit"><button class="hitnom" data-a="alim-pick" data-id="'+esc(ricos.id)+'">'+
      '<span class="em">'+esc(ricos.e||'🍽')+'</span>'+
      '<span class="nm"><b>'+esc(ricos.n)+'</b><span>'+esc(String(ALIM_LABEL[k]||k).toLowerCase())+' · '+
        fmt(ricos[k])+' '+esc(ALIM_UNIDAD[k]||'')+' /100 g</span></span>'+
      '<span class="kc">'+(ricos.kcal||0)+'<small>/100 g</small></span></button>'+
      '<button class="add" data-a="food-rapido" data-v="alim:'+esc(ricos.id)+'" data-key="'+esc(sel)+'" '+
        'aria-label="apuntar '+esc(ricos.n)+'">'+gymIco('mas','gico sm')+'</button></div>';}).join('');
  $('#main').innerHTML='<div class="grid">'+
    foodSubcab('Micronutrientes',cortos.length?('<span class="tag b4">'+cortos.length+' cortos</span>'):'')+
    '<p class="note" style="margin:0">Sobre la ingesta de referencia de un adulto, la de las etiquetas. '+
      (conDato?('Salen de '+conDato+' de tus '+c.lista.length+' tomas de hoy.'):
        'Hoy no tengo ninguno: los traen los alimentos de la tabla, no los productos de código de barras.')+'</p>'+
    (cortos.length?('<div class="card"><h2>Hoy vas corto de</h2>'+
      '<div class="chips">'+cortos.map(function(k){
        const p=microPct(k,mt[k]||0);
        return '<span class="chipx" style="border-color:color-mix(in srgb,'+microColor(p)+' 45%,var(--line));color:'+
          microColor(p)+'">'+esc(ALIM_LABEL[k]||k)+' '+p+' %</span>';}).join('')+'</div>'+
      (cubrir?('<p class="note" style="margin:12px 0 4px"><b>Con esto lo cubres:</b></p>'+cubrir):'')+
      '</div>'):'')+
    '<div class="card"><h2>Todos <span class="mini">'+ALIM_MICROS.length+'</span></h2>'+
      '<div class="micros">'+ALIM_MICROS.map(function(k){
        return micHTML(k,mt[k]||0,+ALIM_VRN[k]||0,' data-a="micro-abrir" data-k="'+k+'"');}).join('')+'</div>'+
      (ui.microAbierto?(function(){
        const k=ui.microAbierto;
        return '<p class="note" style="margin:12px 0 4px">Lo que más '+esc(String(ALIM_LABEL[k]||k).toLowerCase())+
          ' trae, por 100 g:</p><div class="chips">'+alimRicosEn(k,6).map(function(a){
          return '<button class="chipx" data-a="alim-pick" data-id="'+esc(a.id)+'">'+esc(a.e||'')+' '+esc(a.n)+
            ' <b>'+fmt(a[k])+' '+esc(ALIM_UNIDAD[k]||'')+'</b></button>';}).join('')+'</div>';})():'')+
      '<p class="mini" style="margin:11px 0 0">No es una pauta médica: es la referencia genérica de un adulto.</p>'+
    '</div></div>';
}
/* ---------- mis productos, de 27 pantallas a una ---------- */
function renderFoodProductos(){
  const c=foodCtx(),f=c.f,sel=c.sel;
  const q=alimTxt(ui.foodQ||'').trim(),marca=ui.prodMarca||'';
  const todos=Object.keys(f.eans).map(function(k){return f.eans[k];});
  const marcas={};
  todos.forEach(function(x){const m=(x.marca||'').trim();if(m)marcas[m]=(marcas[m]||0)+1;});
  const topMarcas=Object.keys(marcas).sort(function(a,b){return marcas[b]-marcas[a];}).slice(0,3);
  const ver=todos.filter(function(x){
    if(marca==='fav')return f.fav.indexOf(x.ean)>=0;
    if(marca&&(x.marca||'').trim()!==marca)return false;
    if(!q)return true;
    return alimTxt(x.nombre+' '+(x.marca||'')+' '+x.ean).indexOf(q)>=0;
  }).sort(function(a,b){return String(a.nombre||'').localeCompare(String(b.nombre||''),'es');});
  /* ocho filas y a buscar: antes se pintaban los 188 con un campo numérico y tres botones cada uno,
     24 882 px de una sentada. La lista deja de ser el sitio donde se elige; el buscador lo es. */
  const muestra=ver.slice(0,8);
  $('#main').innerHTML='<div class="grid">'+
    foodSubcab('Mis productos','<span class="tag b2">'+todos.length+'</span>')+
    (todos.length?(
      '<div class="buscador">'+gymIco('lupa','gico sm')+
        '<input id="fdQ" value="'+esc(ui.foodQ||'')+'" data-a="food-q" placeholder="nombre, marca o código…"></div>'+
      '<div class="chips">'+
        '<button class="chipx'+(marca?'':' on')+'" data-a="prod-marca" data-m="">todos <b>'+todos.length+'</b></button>'+
        (f.fav.length?('<button class="chipx'+(marca==='fav'?' on':'')+'" data-a="prod-marca" data-m="fav">★ favoritos <b>'+
          f.fav.length+'</b></button>'):'')+
        topMarcas.map(function(m){
          return '<button class="chipx'+(marca===m?' on':'')+'" data-a="prod-marca" data-m="'+esc(m)+'">'+
            esc(m)+' <b>'+marcas[m]+'</b></button>';}).join('')+
      '</div>'+
      '<div class="card">'+(muestra.length?muestra.map(function(x){
        const favo=f.fav.indexOf(x.ean)>=0;
        return '<div class="hit"><button class="hitnom" data-a="food-abrir" data-v="ean:'+esc(x.ean)+'">'+
          '<span class="em">📦</span>'+
          '<span class="nm"><b>'+esc(x.nombre)+'</b><span>'+esc(x.marca||'')+(x.envase?(' · '+esc(x.envase)):'')+
            (favo?' · ★':'')+'</span></span>'+
          '<span class="kc">'+(x.kcal||0)+'<small>/100 g</small></span></button>'+
          '<button class="mini-acc'+(favo?' on':'')+'" data-a="ean-fav" data-ean="'+esc(x.ean)+'" '+
            'aria-pressed="'+(favo?'true':'false')+'" aria-label="favorito">'+(favo?'★':'☆')+'</button>'+
          '<button class="mini-acc" data-a="ean-del" data-ean="'+esc(x.ean)+'" aria-label="quitar '+esc(x.nombre)+'">×</button>'+
          '<button class="add" data-a="food-rapido" data-v="ean:'+esc(x.ean)+'" data-key="'+esc(sel)+'" '+
            'aria-label="apuntar '+esc(x.nombre)+'">'+gymIco('mas','gico sm')+'</button></div>';}).join(''):
        '<div class="empty">Nada encaja con eso.</div>')+
        (ver.length>muestra.length?('<p class="mini" style="margin:11px 0 0">y '+(ver.length-muestra.length)+
          ' más: escribe arriba para encontrarlo.</p>'):'')+
      '</div>'):
      '<div class="card"><div class="empty">Aún no has guardado ningún producto. Escanea el primero o importa el catálogo local.</div></div>')+
    '<div class="row">'+
      '<button class="btn s" data-a="food-panel2" data-k="scan">'+gymIco('camara','gico sm')+' escanear uno nuevo</button>'+
      '<button class="btn s" data-a="food-catalogo-import">'+(f.catalogoFuente?'repasar el catálogo':'importar el catálogo local')+'</button>'+
    '</div>'+
    (f.catalogoFuente?('<p class="mini" style="margin:0">'+esc(f.catalogoFuente)+'</p>'):'')+
    '</div>';
}
function renderFoodAdd(){
  const c=foodCtx(),f=c.f,sel=c.sel;
  /* buscar y «mis productos» tienen ya su propia pantalla (el buscador y renderFoodProductos):
     aquí solo quedan las dos formas de meter algo que la app todavía no conoce */
  const modo=(ui.foodPanel==='mano')?'mano':'scan';
  const modos=[['scan','camara','escanear'],['mano','lapiz','a mano']];
  const tira='<div class="modos">'+modos.map(function(m){
    return '<button class="modo'+(modo===m[0]?' on':'')+'" data-a="food-panel" data-k="'+m[0]+'">'+
      gymIco(m[1],'gico sm')+'<span>'+m[2]+'</span></button>';}).join('')+'</div>';
  let cuerpo='';
  if(modo==='scan'){
    cuerpo='<div class="card" style="margin-top:11px">'+
      '<p class="note">Enfoca el código de barras: se busca en Open Food Facts y se guarda con sus kcal y proteína. '+
      'Solo el código (no tu nombre ni nada tuyo) sale hacia ese servicio externo.</p>'+
      '<div class="scanbox" id="scanBox"><video id="scanV" playsinline muted></video></div>'+
      '<div class="row"><button class="btn p" data-a="scan-start">'+gymIco('camara','gico sm')+' abrir la cámara</button>'+
      '<button class="btn s" data-a="scan-stop">parar</button></div>'+
      '<div class="fgrid c3" style="margin-top:8px">'+
        '<label class="fld">código de barras<input id="scanEan" inputmode="numeric" placeholder="8410046001962"></label>'+
        '<label class="fld">o busca por nombre<input id="scanQ" placeholder="yogur proteico…"></label>'+
        '<label class="fld">&nbsp;<span class="row" style="gap:6px">'+
        '<button class="btn s" data-a="scan-go">buscar el código</button>'+
        '<button class="btn s" data-a="scan-find">buscar por nombre</button></span></label></div>'+
      '<label class="fld" style="margin-top:6px;flex-direction:row;align-items:center;gap:6px;font-size:12px;text-transform:none;font-weight:400">'+
        '<input type="checkbox" id="scanMerc" data-a="scan-solo-merc" style="width:auto" '+(ui.scanSoloMercadona?'checked':'')+'>'+
        '<span>🛒 solo Mercadona (Hacendado, Deliplus…)</span></label>'+
      '<p id="scanOut">'+esc(ui.scanMsg||'')+'</p>'+
      ((ui.scanRes||[]).length?('<div class="daylist" style="margin-top:4px">'+ui.scanRes.map(function(x,ix){
        return '<div class="frow"><span><span class="fn">'+esc(x.nombre)+'</span>'+
          '<span class="fm">'+esc(x.marca||'')+(x.envase?' · '+esc(x.envase):'')+'</span></span>'+
          '<span class="mini chipnum">'+(x.kcal||0)+' kcal · '+(x.prot||0)+' g prot /100 g</span>'+
          '<span class="row" style="gap:4px"><button class="btn s" data-a="scan-save" data-ix="'+ix+'" data-key="'+sel+'">guardar</button>'+
          '<button class="btn s" data-a="scan-today" data-ix="'+ix+'" data-key="'+sel+'">apuntar 100 g hoy</button></span></div>';}).join('')+'</div>'):'')+
      '</div>';
  }else{
    cuerpo='<div class="card" style="margin-top:11px">'+
      '<p class="note">Para lo que no tiene código de barras: ponle sus kcal y proteína por 100 g y se guarda igual que un escaneado.</p>'+
      '<div class="fgrid c3">'+
        '<label class="fld">nombre<input id="foodNewNombre" placeholder="Lentejas de mi madre"></label>'+
        '<label class="fld">marca u origen (opcional)<input id="foodNewMarca" placeholder="casero"></label>'+
        '<label class="fld">envase/ración (opcional)<input id="foodNewEnvase" placeholder="1 táper ≈ 400 g"></label>'+
        '<label class="fld">kcal /100 g<input id="foodNewKcal" type="number" min="0" step="1" value=""></label>'+
        '<label class="fld">proteína g/100 g<input id="foodNewProt" type="number" min="0" step="0.1" value=""></label>'+
        '<label class="fld">carbohidratos g/100 g<input id="foodNewCarb" type="number" min="0" step="0.1" value=""></label>'+
        '<label class="fld">grasa g/100 g<input id="foodNewGresa" type="number" min="0" step="0.1" value=""></label>'+
        '<label class="fld">azúcares g/100 g<input id="foodNewAzucar" type="number" min="0" step="0.1" value=""></label>'+
        '<label class="fld">fibra g/100 g<input id="foodNewFibra" type="number" min="0" step="0.1" value=""></label>'+
        '<label class="fld">sal g/100 g<input id="foodNewSal" type="number" min="0" step="0.01" value=""></label>'+
        '<label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn p" data-a="food-new-add">guardar alimento</button></label>'+
      '</div></div>';
  }
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="food-vista" data-v="buscar">'+gymIco('atras','gico sm')+' Apuntar</button>'+
      '<h2 class="subtit">Algo nuevo</h2><span class="tag b2">'+c.ft.kcal+' kcal</span></div>'+
    tira+cuerpo+'</div>';
}
const ING_CONTINUA=['g','kg','ml','l','litro','litros'];
function escalaIng(linea,factor){
  /* «500 g lenteja» a 1,5 → «750 g lenteja». Si la línea no lleva cantidad se deja tal cual.
     Se redondea a algo que se pueda comprar y pesar: los gramos y mililitros al entero (no existe
     «933,33 g de patata»), y lo que se cuenta —huevos, cebollas, latas— al medio. */
  const p=parseIng(linea);
  if(p.num==null)return {q:'',item:p.item||String(linea)};
  const bruto=p.num*factor;
  const continua=ING_CONTINUA.indexOf(p.unit)>=0;
  const n=continua?(bruto<10?Math.round(bruto*10)/10:Math.round(bruto))
                  :Math.max(0.5,Math.round(bruto*2)/2);
  return {q:(fmt(n)+(p.unit?' '+p.unit:'')).trim(),item:p.item};}
function renderFoodCocina(){
  const d=dishById(ui.cocinaPlato);
  if(!d){ui.foodVista='cocina-panel';return renderCocinaPanel();}
  const base=Math.max(1,+d.portions||1);
  const objetivo=Math.max(1,+ui.cocinaRac||base);
  const factor=objetivo/base;
  const pasos=(d.steps||[]).filter(Boolean);
  const i=Math.min(Math.max(0,+ui.cocinaPaso||0),Math.max(0,pasos.length-1));
  const opciones=[];[base,2,4,6,8].forEach(function(n){if(opciones.indexOf(n)<0)opciones.push(n);});
  opciones.sort(function(a,b){return a-b;});
  const ingr=(d.ingredients||[]).map(function(l){const e=escalaIng(l,factor);
    return '<div class="ingr"><span>'+esc(e.item)+'</span><b>'+esc(e.q||'—')+'</b></div>';}).join('')||
    '<div class="empty">Este plato no tiene ingredientes apuntados.</div>';
  $('#main').innerHTML='<div class="grid">'+
    /* aquí el botón de volver va sin texto y el paso va en su tira de puntos: con el nombre de un
       plato largo, tres cosas en la misma fila dejaban el título partido en tres renglones */
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="food-vista" data-v="cocina-panel" title="Cocina" aria-label="volver a Cocina">'+
        gymIco('atras','gico sm')+'</button>'+
      '<h2 class="subtit">'+esc(d.icon||'')+' '+esc(d.name)+'</h2></div>'+
    '<div class="card">'+
      '<div class="row" style="justify-content:space-between;margin-bottom:9px">'+
        '<span class="mini">raciones</span>'+
        '<span class="row" style="gap:6px">'+opciones.map(function(n){
          return '<button class="racchip'+(n===objetivo?' on':'')+'" data-a="cocina-rac" data-n="'+n+'">'+n+'</button>';}).join('')+'</span></div>'+
      ingr+
      '<p class="mini" style="margin:9px 0 0">'+(factor===1?('la receta es de '+rac(base)):
        ('escalado a '+rac(objetivo)+' desde '+rac(base)+' de la receta'))+
        ' · '+Math.round((+d.kcal||0))+' kcal por ración</p>'+
    '</div>'+
    (pasos.length?('<div class="card">'+
      '<div class="pasonum">'+pasos.map(function(_,j){
        return '<span class="pasopunto'+(j<=i?' on':'')+'" data-a="cocina-paso" data-n="'+j+'"></span>';}).join('')+
        '<span class="sp"></span><span class="tag b2">paso '+(i+1)+' de '+pasos.length+'</span></div>'+
      '<p class="paso">'+esc(pasos[i])+'</p></div>'+
      '<div class="row" style="gap:8px">'+
        '<button class="btn s" style="min-height:46px;flex:0 0 118px;justify-content:center" data-a="cocina-paso" data-n="'+(i-1)+'"'+
          (i===0?' disabled':'')+'>'+gymIco('atras','gico sm')+' anterior</button>'+
        (i<pasos.length-1?
          ('<button class="btn p" style="min-height:46px;flex:1" data-a="cocina-paso" data-n="'+(i+1)+'">siguiente paso</button>'):
          ('<button class="btn p" style="min-height:46px;flex:1" data-a="cocina-hecho" data-id="'+d.id+'">✓ hecho · apuntar una ración</button>'))+
      '</div>'):
      '<div class="card"><div class="empty">Este plato no tiene pasos escritos. Edítalo en «Comer → Mis platos» para tenerlos aquí.</div></div>')+
    '</div>';
}
/* ===================== nutrición: trozos de pantalla que se repiten ===================== */
function macroHTML(nm,val,obj,cls){
  const pct=obj>0?Math.min(100,Math.round(val/obj*100)):0;
  return '<div class="macro"><div class="mt"><span>'+esc(nm)+'</span><b>'+fmt(val)+' / '+(obj>0?fmt(obj):'—')+' g</b></div>'+
    '<div class="mbar"><i class="'+cls+'" style="width:'+pct+'%"></i></div></div>';}
function micHTML(k,val,obj,extra){
  /* la barra es el % de la ingesta de referencia: por encima del 100 % cambia de color en vez de
     desbordarse, que era la única forma de ver de un vistazo lo que ya está cubierto */
  const pct=obj>0?Math.round((+val||0)/obj*100):0;
  const cls=pct<50?'bajo':(pct>=100?'alto':'');
  const u=ALIM_UNIDAD[k]||'';
  return '<'+(extra?'button':'div')+' class="mic'+(ui.microAbierto===k?' on':'')+'"'+(extra||'')+'>'+
    '<span class="mn">'+esc(ALIM_LABEL[k]||k)+'</span>'+
    '<span class="mv">'+fmt(Math.round((+val||0)*10)/10)+(obj>0?(' / '+fmt(obj)):'')+' '+u+'</span>'+
    '<span class="micbar"><i class="'+cls+'" style="width:'+Math.min(100,pct)+'%"></i></span>'+
    '</'+(extra?'button':'div')+'>';}
function fuenteHTML(a){
  if(!a)return '';
  if(a.fuente==='tuyo')return '<span class="fuente tuyo">✎ lo has puesto tú</span>';
  if(a.fuente==='usda')return '<span class="fuente usda">✓ USDA FoodData Central</span>';
  return '<span class="fuente" title="valor de referencia aproximado escrito para la app">≈ tabla de la app</span>';}
function grupoNombre(g){
  const x=ALIM_GRUPOS.filter(function(p){return p[0]===g;})[0];
  return x?x[1].replace(/^\S+\s/,''):g;}
function alimSubtexto(a){
  const p=[grupoNombre(a.g)];
  if(a.nota)p.push(a.nota);
  return p.join(' · ');}
/* ---------- Alimentos: el buscador ---------- */
function renderAlimentos(){
  const q=ui.alimQ||'',gr=ui.alimGrupo||'';
  const todos=alimTodos(),res=alimBuscar(q,gr);
  const ver=q?res.slice(0,40):res.slice(0,12);   /* sin nada escrito, una muestra: 86 seguidos es un scroll inútil */
  $('#main').innerHTML='<div class="grid">'+
    foodSubcab('Alimentos','<span class="tag b2">'+todos.length+'</span>')+
    '<p class="note" style="margin:0">Comida a peso, no productos de marca: eso está en «mis productos». '+
    'Cada uno con sus kcal, sus macros y sus micronutrientes por 100 g.</p>'+
    '<div class="buscador">'+gymIco('lupa','gico sm')+
      '<input id="alQ" value="'+esc(q)+'" data-a="alim-busca" placeholder="plátano, lentejas, salmón…"></div>'+
    '<div class="chips">'+
      '<button class="chipx'+(gr?'':' on')+'" data-a="alim-grupo" data-g="">todo</button>'+
      ALIM_GRUPOS.map(function(p){
        return '<button class="chipx'+(gr===p[0]?' on':'')+'" data-a="alim-grupo" data-g="'+p[0]+'">'+esc(p[1])+'</button>';}).join('')+
    '</div>'+
    '<div class="card">'+
      (ver.length?ver.map(function(a){
        return '<button class="alim" data-a="alim-pick" data-id="'+esc(a.id)+'">'+
          '<span class="em">'+esc(a.e||'🍽')+'</span>'+
          '<span class="nm"><b>'+esc(a.n)+'</b><span class="mini">'+esc(alimSubtexto(a))+'</span></span>'+
          '<span class="kc">'+(a.kcal||0)+' kcal</span>'+gymIco('chevron','gico sm')+'</button>';}).join(''):
        '<div class="empty">Nada se llama así. Puedes añadirlo tú abajo con sus kcal.</div>')+
      (res.length>ver.length?('<p class="mini" style="margin:9px 0 0">y '+(res.length-ver.length)+
        ' más: afina la búsqueda para verlos</p>'):'')+
    '</div>'+
    '<div class="row">'+
      '<button class="btn s" data-a="alim-nuevo">'+gymIco('mas','gico sm')+' añadir un alimento mío</button>'+
      '<button class="btn s" data-a="food-vista" data-v="add" data-p="scan">'+gymIco('camara','gico sm')+' escanear un producto</button>'+
    '</div>'+
    (usdaOn()?'':('<p class="mini" style="margin:2px 0 0">Los valores de la tabla son aproximados. '+
      '<button class="btn s" style="padding:3px 9px" data-a="ir-usda">corregirlos con USDA (gratis)</button></p>'))+
    '</div>';
}
/* ---------- Ficha de un alimento ---------- */
function renderAlimFicha(){
  const a=alimById(ui.alimSel);
  if(!a){ui.foodVista='alimentos';return renderAlimentos();}
  const g=Math.max(1,+ui.alimG||100);
  const p=alimPorcion(a,g);
  const enNevera=food().nevera.indexOf(a.id)>=0;
  const cual=alimTxt(a.n);
  const platos=(store.dishes||[]).filter(function(d){
    return (d.ingredients||[]).some(function(l){return alimTxt(l).indexOf(cual)>=0;});});
  const micros=ALIM_MICROS.filter(function(k){return typeof a[k]==='number';});
  const raciones=[30,100,150,200];   /* las cuatro de siempre; para otra cosa está el campo «otra» */
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="food-vista" data-v="alimentos">'+gymIco('atras','gico sm')+' Alimentos</button>'+
      '<h2 class="subtit">'+esc(a.e||'')+' '+esc(a.n)+'</h2></div>'+
    '<div class="card">'+
      '<div class="row" style="justify-content:space-between;align-items:flex-start;gap:10px">'+
        '<div><div style="font-size:40px;line-height:1">'+esc(a.e||'🍽')+'</div>'+
          '<p class="mini" style="margin:4px 0 0">'+esc(alimSubtexto(a))+'</p></div>'+
        fuenteHTML(a)+'</div>'+
      '<div class="chips">'+raciones.map(function(v){
        return '<button class="chipx'+(v===g?' on':'')+'" data-a="alim-g" data-n="'+v+'">'+v+' g</button>';}).join('')+
        '<label class="chipx" style="gap:4px">otra<input type="number" min="1" max="2000" step="5" value="'+g+
          '" data-a="alim-g-f" style="width:58px;padding:2px 4px;font-size:12px"></label>'+
      '</div>'+
      '<div class="tot">'+
        '<div><b>'+p.kcal+'</b><span>kcal</span></div>'+
        '<div><b>'+fmt(p.pr)+'</b><span>prot. g</span></div>'+
        '<div><b>'+fmt(p.ch)+'</b><span>carb. g</span></div>'+
        '<div><b>'+fmt(p.gr)+'</b><span>grasa g</span></div></div>'+
      '<p class="mini" style="margin:9px 0 0">de los '+fmt(p.ch)+' g de carbohidrato, '+fmt(p.az)+' g son azúcares y '+
        fmt(p.fi)+' g fibra'+(p.sa?(' · '+fmt(p.sa)+' g de sal'):'')+'</p>'+
    '</div>'+
    (micros.length?('<div class="card"><h2>Micronutrientes <span class="mini">en '+g+' g</span></h2>'+
      '<div class="micros">'+micros.map(function(k){
        return micHTML(k,p.mi[k],+ALIM_VRN[k]||0,'');}).join('')+'</div>'+
      '<p class="mini" style="margin:10px 0 0">La barra es el % de la ingesta de referencia diaria de un adulto '+
      '(la de las etiquetas europeas). No es una pauta médica ni está calculada para ti.</p></div>'):'')+
    '<div class="card"><h2>De dónde sale el dato</h2>'+
      '<p class="note" style="margin-bottom:8px">'+esc(alimFuenteTxt(a))+
        (a.usdaDesc?(' · «'+esc(a.usdaDesc)+'»'):'')+'</p>'+
      (a.fuente==='tuyo'?
        ('<div class="row"><button class="btn s" data-a="alim-editar" data-id="'+esc(a.id)+'">'+gymIco('lapiz','gico sm')+' editarlo</button>'+
         '<button class="btn d s" data-a="alim-del" data-id="'+esc(a.id)+'">quitarlo</button></div>'):
        (usdaOn()?
          ('<div class="row"><button class="btn s" data-a="alim-usda" data-id="'+esc(a.id)+'">'+
            (a.fuente==='usda'?'volver a consultar USDA':'corregirlo con USDA')+'</button>'+
           (a.fuente==='usda'?('<button class="btn s" data-a="alim-usda-off" data-id="'+esc(a.id)+'">volver a la tabla</button>'):'')+'</div>'):
          ('<div class="row"><button class="btn s" data-a="ir-usda">poner la clave de USDA (gratis, 2 min)</button></div>')))+
    '</div>'+
    (platos.length?('<div class="card"><h2>Dónde lo usas <span class="mini">'+platos.length+' plato'+(platos.length===1?'':'s')+'</span></h2>'+
      '<div class="chips">'+platos.slice(0,8).map(function(d){
        return '<button class="chipx" data-a="dish-edit" data-id="'+esc(d.id)+'">'+esc(d.icon||'🍽')+' '+esc(d.name)+'</button>';}).join('')+
      '</div></div>'):'')+
    '<div class="row">'+
      '<label class="fld" style="flex:0 0 116px">en qué momento<select id="alPos">'+posOptions(momentoAhora())+'</select></label>'+
      '<button class="btn p" style="flex:1;min-height:46px" data-a="alim-apuntar" data-id="'+esc(a.id)+'">'+
        gymIco('mas','gico sm')+' apuntar '+g+' g</button></div>'+
    '<button class="btn s gbig" data-a="alim-nevera" data-id="'+esc(a.id)+'">'+gymIco('nevera','gico sm')+' '+
      (enNevera?'quitar de la nevera':'a la nevera')+'</button>'+
    '</div>';
}
/* ---------- Mi nevera ---------- */
/* ---------- Crear un plato con ingredientes de la tabla ----------
   La gracia es que aquí no se teclea ni un número de nutrición: se eligen alimentos y gramos, y las
   kcal, los macros y los micros salen solos. El plato guarda qué alimentos lleva (dish.alims) para
   poder recalcularlo si mañana corriges uno con USDA. */
function platoVacio(){return {id:'',name:'',icon:'🍲',portions:2,alims:[],steps:[]};}
function gramosPorDefecto(a){
  /* 100 g de todo era absurdo para el aceite: un plato no lleva 100 g de aceite de oliva.
     Estos son puntos de partida; el gramaje se edita al lado del ingrediente. */
  if(!a)return 100;
  if(esCondimento(a)||a.g==='graso')return 10;
  if(a.g==='cereal'||a.g==='legumbre')return 80;
  if(a.g==='verdura'||a.g==='fruta')return 150;
  if(a.g==='lacteo')return 200;
  return 150;}
function platoTotales(pl){
  const partes=(pl.alims||[]).map(function(x){const a=alimById(x.id);return a?{a:a,g:Math.max(0,+x.g||0)}:null;}).filter(Boolean);
  const t=sumaAlimentos(partes);
  const n=Math.max(1,+pl.portions||1),porRacion={mi:{}};
  ALIM_MACROS.forEach(function(k){porRacion[k]=(k==='kcal')?Math.round(t[k]/n):Math.round(t[k]/n*10)/10;});
  Object.keys(t.mi).forEach(function(k){porRacion.mi[k]=Math.round(t.mi[k]/n*100)/100;});
  return {total:t,racion:porRacion,partes:partes};}
function guardarPlato(){
  const pl=ui.plato;
  if(!pl)return 'no hay ningún plato abierto';
  const nombre=String(pl.name||'').trim();
  if(!nombre)return 'ponle un nombre al plato';
  if(!(pl.alims||[]).length)return 'un plato sin ingredientes no tiene nutrición que calcular: añade al menos uno';
  const r=platoTotales(pl).racion;
  const d=pl.id?dishById(pl.id):null;
  const datos={name:nombre.slice(0,70),icon:String(pl.icon||'🍲').slice(0,4),
    portions:Math.max(1,Math.min(20,+pl.portions||1)),
    kcal:r.kcal,prot:r.pr,
    alims:pl.alims.map(function(x){return {id:x.id,g:Math.max(1,+x.g||0)};}),
    ingredients:pl.alims.map(function(x){const a=alimById(x.id);
      return x.g+' g '+String((a&&a.n)||'').toLowerCase();}),
    steps:(pl.steps||[]).filter(Boolean)};
  if(d){Object.assign(d,datos);save();return 'guardado: '+datos.name;}
  const nuevo=Object.assign({id:uid('d')},datos);
  store.dishes.push(nuevo);ui.plato.id=nuevo.id;save();
  return 'plato creado: '+datos.name+' · '+r.kcal+' kcal por ración';}
function renderPlatoNuevo(){
  const pl=ui.plato||(ui.plato=platoVacio());
  const tt=platoTotales(pl);
  const q=(ui.platoQ||'').trim();
  const sug=q?alimBuscar(q,'').slice(0,8):[];
  const micros=ALIM_MICROS.filter(function(k){return typeof tt.racion.mi[k]==='number'&&tt.racion.mi[k]>0;}).slice(0,6);
  const fuentes={};tt.partes.forEach(function(x){fuentes[x.a.fuente]=(fuentes[x.a.fuente]||0)+1;});
  const fuenteTxt=Object.keys(fuentes).map(function(k){
    return fuentes[k]+' de '+(k==='usda'?'USDA':(k==='tuyo'?'los tuyos':'la tabla de la app'));}).join(' · ');
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="food-vista" data-v="">'+gymIco('atras','gico sm')+' Comer</button>'+
      '<h2 class="subtit">'+(pl.id?'Editar plato':'Plato nuevo')+'</h2></div>'+
    '<div class="card"><div class="row">'+
      '<label class="fld" style="flex:0 0 60px">icono<input id="plIcon" value="'+esc(pl.icon||'🍲')+'" data-a="plato-f" data-k="icon" maxlength="4"></label>'+
      '<label class="fld" style="flex:1 1 110px">nombre<input id="plName" value="'+esc(pl.name||'')+'" data-a="plato-f" data-k="name" placeholder="Pollo con arroz y brócoli"></label>'+
      '<label class="fld" style="flex:0 0 84px">raciones<input id="plPor" type="number" min="1" max="20" step="1" value="'+(+pl.portions||2)+'" data-a="plato-f" data-k="portions"></label>'+
    '</div></div>'+
    '<div class="card"><h2>Ingredientes <span class="mini">'+tt.partes.length+'</span></h2>'+
      '<p class="note" style="margin-bottom:6px">Búscalos en la tabla y las kcal, los macros y los micros salen solos. No hay que teclear ningún número de nutrición.</p>'+
      (tt.partes.length?tt.partes.map(function(x,ix){
        return '<div class="ingr"><span>'+esc(x.a.e||'')+' '+esc(String(x.a.n).toLowerCase())+'</span>'+
          '<span class="row" style="gap:6px;flex:0 0 auto">'+
          '<input type="number" min="1" max="3000" step="5" value="'+x.g+'" data-a="plato-ing-g" data-ix="'+ix+'" style="width:72px;text-align:right">'+
          '<span class="mini">g</span>'+
          '<button class="btn d s" style="padding:3px 8px" data-a="plato-ing-del" data-ix="'+ix+'" title="quitar">×</button></span></div>';}).join(''):
        '<div class="empty">Todavía no lleva nada.</div>')+
      '<div class="buscador" style="margin-top:10px">'+gymIco('lupa','gico sm')+
        '<input id="plQ" value="'+esc(ui.platoQ||'')+'" data-a="plato-busca" placeholder="añadir un ingrediente…"></div>'+
      (sug.length?('<div style="margin-top:4px">'+sug.map(function(a){
        return '<button class="alim" data-a="plato-ing-add" data-id="'+esc(a.id)+'">'+
          '<span class="em">'+esc(a.e||'🍽')+'</span>'+
          '<span class="nm"><b>'+esc(a.n)+'</b><span class="mini">'+esc(alimSubtexto(a))+'</span></span>'+
          '<span class="kc">'+(a.kcal||0)+' kcal</span>'+gymIco('mas','gico sm')+'</button>';}).join('')+'</div>'):'')+
    '</div>'+
    '<div class="card"><h2>Sale a <span class="mini">por ración</span></h2>'+
      '<div class="tot">'+
        '<div><b>'+tt.racion.kcal+'</b><span>kcal</span></div>'+
        '<div><b>'+fmt(tt.racion.pr)+'</b><span>prot. g</span></div>'+
        '<div><b>'+fmt(tt.racion.ch)+'</b><span>carb. g</span></div>'+
        '<div><b>'+fmt(tt.racion.gr)+'</b><span>grasa g</span></div></div>'+
      (micros.length?('<div class="micros">'+micros.map(function(k){
        return micHTML(k,tt.racion.mi[k],+ALIM_VRN[k]||0,'');}).join('')+'</div>'):'')+
      '<p class="mini" style="margin:10px 0 0">'+(tt.partes.length?
        ('Calculado con '+tt.partes.length+' ingrediente'+(tt.partes.length===1?'':'s')+'. <span class="fuente">'+esc(fuenteTxt)+'</span>'):
        'Añade ingredientes y esto se rellena solo.')+'</p>'+
    '</div>'+
    '<div class="card"><h2>Pasos <span class="mini">opcional</span></h2>'+
      '<p class="note" style="margin-bottom:6px">Si los escribes, tendrás el modo cocina paso a paso con las cantidades escaladas. Uno por línea.</p>'+
      '<textarea id="plSteps" rows="4" data-a="plato-f" data-k="steps" placeholder="Cuece el arroz 12 min.&#10;Saltea el pollo…">'+
        esc((pl.steps||[]).join('\n'))+'</textarea></div>'+
    '<button class="btn p gbig" data-a="plato-guardar">'+(pl.id?'guardar los cambios':'guardar el plato')+'</button>'+
    '</div>';
}
/* ---------- Un alimento tuyo ----------
   Para lo que no está en la tabla. Los micros son opcionales: si no los pones, ese alimento
   simplemente no suma en la tarjeta de micronutrientes, que es más honesto que poner ceros. */
function renderAlimNuevo(){
  const a=ui.alimNuevo||(ui.alimNuevo={});
  const campo=function(k,etq,ph,tipo,paso){
    return '<label class="fld">'+esc(etq)+'<input '+(tipo?('type="'+tipo+'" min="0" step="'+(paso||'0.1')+'"'):'')+
      ' value="'+esc(a[k]==null?'':a[k])+'" data-a="alim-f" data-k="'+k+'" placeholder="'+esc(ph||'')+'"></label>';};
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="food-vista" data-v="alimentos">'+gymIco('atras','gico sm')+' Alimentos</button>'+
      '<h2 class="subtit">'+(a.id?'Editar alimento':'Alimento nuevo')+'</h2></div>'+
    '<div class="card">'+
      '<p class="note">Todo por 100 g, como en las tablas y en las etiquetas. Con las kcal y la proteína ya vale; lo demás, si lo sabes.</p>'+
      '<div class="fgrid c3">'+
        campo('n','nombre','Lentejas de mi madre')+
        campo('e','emoji','🍲')+
        '<label class="fld">grupo<select data-a="alim-f" data-k="g">'+ALIM_GRUPOS.map(function(p){
          return '<option value="'+p[0]+'"'+((a.g||'otro')===p[0]?' selected':'')+'>'+esc(p[1])+'</option>';}).join('')+'</select></label>'+
        campo('nota','apunte (opcional)','crudo, sin piel')+
        campo('kcal','kcal /100 g','','number','1')+
        campo('pr','proteína g','','number')+
        campo('ch','carbohidrato g','','number')+
        campo('gr','grasa g','','number')+
        campo('az','azúcares g','','number')+
        campo('fi','fibra g','','number')+
        campo('sa','sal g','','number','0.01')+
      '</div></div>'+
    '<div class="card"><h2>Micronutrientes <span class="mini">opcional</span></h2>'+
      '<p class="note">Si no los pones, este alimento no cuenta en la tarjeta de micros del día. Prefiero eso a rellenarlo con ceros que no son verdad.</p>'+
      '<div class="fgrid c3">'+ALIM_MICROS.map(function(k){
        return campo(k,ALIM_LABEL[k]+' ('+ALIM_UNIDAD[k]+')','','number','0.01');}).join('')+'</div></div>'+
    '<button class="btn p gbig" data-a="alim-guardar">'+(a.id?'guardar los cambios':'guardar el alimento')+'</button>'+
    '</div>';
}
/* ---------- Notas: la libreta ---------- */
function notaColor(x){return x.color||(x.evId?tlColor('evt'):(x.fecha?'var(--brand)':'var(--ink2)'));}
function notaPiesHTML(x){
  const out=[];
  if(x.fecha){
    const hoy=iso(new Date());
    const cls=x.fecha===hoy?'dia hoy':'dia';
    out.push('<span class="pie '+cls+'">📅 '+esc(x.fecha===hoy?('hoy, '+fechaCorta(x.fecha)):fechaCorta(x.fecha))+'</span>');
  }else out.push('<span class="pie">sin día</span>');
  if(x.proy)out.push('<span class="pie proy">◆ '+esc(x.proy)+'</span>');
  if(!x.hecha&&x.fecha&&x.fecha<iso(new Date()))out.push('<span class="pie tarde">se te pasó</span>');
  const ev=eventoDeNota(x);
  if(ev)out.push('<span class="pie ev">🔔 '+esc(ev.hora?evHoraTxt(ev):'en el calendario')+'</span>');
  if(x.hecha){
    const quedan=Math.max(0,Math.ceil((x.hecha+NOTA_PURGA_DIAS*86400000-Date.now())/86400000));
    out.push('<span class="pie">se borra en '+quedan+' día'+(quedan===1?'':'s')+'</span>');}
  return out.join('');}
function notaFilaHTML(x,conAbrir){
  return '<div class="nota'+(x.hecha?' hecha':'')+'">'+
    '<button class="tick" data-a="nota-hecha" data-id="'+x.id+'" title="'+(x.hecha?'volver a pendiente':'marcar hecha')+'" '+
      'aria-label="'+(x.hecha?'volver a pendiente':'marcar hecha')+'">✓</button>'+
    '<span class="franja" style="background:'+esc(notaColor(x))+'"></span>'+
    '<button class="cuerpo" '+(conAbrir!==false?('data-a="nota-abrir" data-id="'+x.id+'"'):'')+'>'+
      '<span class="t">'+esc(x.txt.split('\n')[0])+(x.txt.indexOf('\n')>=0?' …':'')+'</span>'+
      '<span class="pies">'+notaPiesHTML(x)+'</span></button>'+
  '</div>';}
function renderNotas(){
  purgaNotas();
  if(ui.notaSel)return renderNotaAbierta();
  const c=notasCuenta(),filtro=ui.notaFiltro||'';
  const todas=notasS().slice().sort(function(a,b){
    return (a.hecha?1:0)-(b.hecha?1:0)||(a.fecha&&b.fecha?a.fecha.localeCompare(b.fecha):(a.fecha?-1:(b.fecha?1:0)))||b.ts-a.ts;});
  /* una sola partición: los tres montones y los tres filtros son la misma pregunta, y tenerla
     escrita dos veces obligaba a cambiar dos sitios para añadir un filtro */
  /* los montones van por CUÁNDO toca, no por si tienen día o no: «se te pasó», «hoy», «esta
     semana», «más adelante», «sin día». Una libreta ordenada por fecha de creación no dice qué
     hacer ahora; esto sí. */
  const hoyK=iso(new Date()),finK=iso(addDays(new Date(),7));
  const proy=ui.notaProy||'';
  const enProy=function(x){return !proy||(x.proy||'')===proy;};
  const tarde=[],hoyL=[],semana=[],luego=[],sinDia=[],hechas=[];
  todas.filter(enProy).forEach(function(x){
    if(x.hecha){hechas.push(x);return;}
    if(!x.fecha){sinDia.push(x);return;}
    if(x.fecha<hoyK)tarde.push(x);
    else if(x.fecha===hoyK)hoyL.push(x);
    else if(x.fecha<=finK)semana.push(x);
    else luego.push(x);});
  const bloque=function(titulo,cual,lista,cls){
    if(!lista.length||(filtro&&filtro!==cual))return '';
    return '<div class="card'+(cls?(' '+cls):'')+'"><h2>'+esc(titulo)+' <span class="mini">'+lista.length+'</span></h2>'+
      lista.map(function(x){return notaFilaHTML(x);}).join('')+'</div>';};
  const cuerpo=bloque('Se te pasó','con',tarde,'avisa')+bloque('Hoy','con',hoyL)+
    bloque('Esta semana','con',semana)+bloque('Más adelante','con',luego)+
    bloque('Sin día','sin',sinDia)+bloque('Hechas','hechas',hechas);
  const proys=proyectos();
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><h2 class="subtit">📝 Notas</h2><span class="tag b2">'+c.total+'</span></div>'+
    '<div class="captura">'+
      '<textarea id="ntNueva" rows="2" data-a="nota-txt" placeholder="Apunta algo y ya le pones día luego…">'+esc(ui.notaNueva||'')+'</textarea>'+
      '<div class="row" style="margin-top:9px">'+
        '<button class="btn p" data-a="nota-add">+ guardar</button>'+
        '<button class="btn s" data-a="nota-add" data-hoy="1">📅 guardar para hoy</button>'+
        '<span class="sp"></span><span class="mini">se guarda en tu móvil</span></div>'+
    '</div>'+
    '<div class="chips">'+
      [['','todas',c.total],['sin','sin día',c.sinDia],['con','con día',c.conDia],['hechas','hechas',c.hechas]]
        .map(function(f){
          return '<button class="chipx'+(filtro===f[0]?' on':'')+'" data-a="nota-filtro" data-f="'+f[0]+'">'+
            esc(f[1])+' <b>'+f[2]+'</b></button>';}).join('')+
    '</div>'+
    (proys.length?('<div class="chips">'+
      '<button class="chipx'+(proy?'':' on')+'" data-a="nota-proy-f" data-p="">todos</button>'+
      proys.map(function(p){
        return '<button class="chipx'+(proy===p.nombre?' on':'')+'" data-a="nota-proy-f" data-p="'+esc(p.nombre)+'">'+
          '◆ '+esc(p.nombre)+' <b>'+p.pend+'</b></button>';}).join('')+'</div>'):'')+
    (cuerpo||('<div class="card"><div class="empty">'+(todas.length?'Nada en este filtro.':
      'Todavía no has apuntado nada. Escribe arriba: lo que no tenga día se queda aquí y no molesta en el calendario.')+
      '</div></div>'))+
    '</div>';
}
function renderNotaAbierta(){
  const x=notaById(ui.notaSel);
  if(!x){ui.notaSel='';return renderNotas();}
  const ev=eventoDeNota(x);
  const hoy=iso(new Date());
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="nota-cerrar">'+gymIco('atras','gico sm')+' Notas</button>'+
      '<h2 class="subtit">La nota</h2></div>'+
    '<textarea class="editor" id="ntTxt" rows="5" data-a="nota-f" data-id="'+x.id+'" data-k="txt">'+esc(x.txt)+'</textarea>'+
    '<div class="row">'+
      '<label class="fld" style="flex:1 1 150px">qué día'+
        '<input type="date" value="'+esc(x.fecha)+'" data-a="nota-f" data-id="'+x.id+'" data-k="fecha"></label>'+
      '<label class="fld" style="flex:0 0 76px">color'+
        '<input type="color" value="'+esc(x.color||'#38e1ff')+'" data-a="nota-f" data-id="'+x.id+'" data-k="color" style="height:38px;padding:3px"></label>'+
      (x.fecha?'':'<label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn s" data-a="nota-hoy" data-id="'+x.id+'">ponerle hoy</button></label>')+
    '</div>'+
    '<div class="row">'+
      '<label class="fld" style="flex:1 1 200px">proyecto (opcional)'+
        '<input list="proyLista" value="'+esc(x.proy||'')+'" data-a="nota-f" data-id="'+x.id+'" data-k="proy" '+
        'placeholder="mudanza, papeleo, sesión del jueves…"></label>'+
      '<datalist id="proyLista">'+proyectos().map(function(p){
        return '<option value="'+esc(p.nombre)+'">';}).join('')+'</datalist>'+
    '</div>'+
    '<p class="mini" style="margin:0">El proyecto agrupa varias notas bajo un mismo nombre. No hay que crearlo: lo escribes y ya está.</p>'+
    '<p class="mini" style="margin:0">'+(x.fecha?
      ('Con día puesto sale en el calendario: en la casilla del '+fechaCorta(x.fecha)+' y al abrir ese día.'):
      'Sin día vive solo aquí. Ponle uno y saldrá en el calendario.')+'</p>'+
    (ev?('<div class="card"><h2>📅 En el calendario</h2>'+
      '<div class="logrow"><span class="evdot" style="background:'+esc(ev.color||tlColor('evt'))+'"></span>'+
      '<span class="nm"><b>'+esc(ev.titulo)+'</b><span>'+esc(fechaCorta(ev.fecha))+' · '+esc(evHoraTxt(ev))+'</span></span></div>'+
      '<p class="mini" style="margin:8px 0 0">Creado desde esta nota: es el mismo evento, no una copia.</p>'+
      '<div class="row" style="margin-top:9px">'+
        '<button class="btn s" data-a="mon-day" data-key="'+esc(ev.fecha)+'">ver ese día en el mes</button>'+
        '<button class="btn s" data-a="nota-desenlaza" data-id="'+x.id+'">quitarlo del calendario</button></div></div>'):
      (x.fecha?('<div class="card"><h2>📅 Pasarla al calendario</h2>'+
        '<p class="note">Se crea un evento el '+esc(fechaCorta(x.fecha))+' con la primera línea de la nota como título. '+
        'La nota no se duplica: se queda enlazada.</p>'+
        '<div class="row">'+
          '<label class="fld" style="flex:1 1 140px">título<input id="ntEvTit" value="'+esc(x.txt.split('\n')[0].slice(0,60))+'"></label>'+
          '<label class="fld" style="flex:0 0 106px">hora (opcional)<input id="ntEvHora" type="time" value=""></label></div>'+
        /* casillas de verdad, leídas al enviar igual que el título y la hora: antes eran dos
           banderas en ui que repintaban la app entera en cada toque y se quedaban puestas de una
           nota a la siguiente */
        '<div class="chips">'+
          '<label class="chipx"><input type="checkbox" id="ntEvAviso" style="width:auto;margin:0"> 🔔 avisarme</label>'+
          '<label class="chipx"><input type="checkbox" id="ntEvCuenta" style="width:auto;margin:0"> cuenta atrás</label></div>'+
        '<button class="btn p gbig" style="margin-top:11px" data-a="nota-al-calendario" data-id="'+x.id+'">crear el evento</button></div>'):'')
    )+
    '<div class="row">'+
      '<button class="btn s" data-a="nota-hecha" data-id="'+x.id+'">'+(x.hecha?'✓ hecha · volver a pendiente':'✓ marcar hecha')+'</button>'+
      (x.fecha?'<button class="btn s" data-a="nota-sin-dia" data-id="'+x.id+'">quitarle el día</button>':'')+
      '<button class="btn d s" data-a="nota-del" data-id="'+x.id+'">borrar la nota</button></div>'+
    (x.hecha?('<p class="mini" style="margin:0">Marcada como hecha: se borrará sola a los '+NOTA_PURGA_DIAS+' días.</p>'):'')+
    '</div>';
}
function notasDelDiaHTML(key){
  /* el cruce con el calendario: las notas de ese día, al abrirlo en el Mes */
  const ns=notasDeFecha(key);
  return '<div class="card"><h2>📝 Notas de este día <span class="mini">'+ns.length+'</span></h2>'+
    (ns.length?ns.map(function(x){return notaFilaHTML(x);}).join(''):
      '<div class="empty">Ninguna. Apunta lo que no quieras que se te olvide ese día.</div>')+
    '<div class="row" style="margin-top:10px">'+
      '<button class="btn s" data-a="nota-add-dia" data-key="'+esc(key)+'">+ nota para este día</button>'+
      '<button class="btn s" data-a="tab" data-t="notas">ver todas mis notas</button></div></div>';}
function renderFoodPerfil(){
  /* Quién eres: es lo que decide cuántas kcal necesitas y qué puedes comer. El peso se sigue por
     TENDENCIA y no por la báscula de esta mañana, y la masa muscular no se calcula aquí: de los
     menús no sale, y ponerla sería inventártela. */
  const p=perfilS(),t=tendenciaPeso(90);
  const METAS=[['perder','perder grasa'],['mantener','mantenerme'],['ganar','ganar músculo']];
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><button class="btn s volver" data-a="food-vista" data-v="">'+
      gymIco('atras','gico sm')+' Comer</button><h2 class="subtit">Tú</h2></div>'+
    '<div class="card"><h2>Tus datos</h2>'+
      '<div class="fgrid c3 tight">'+
        '<label class="fld">altura (cm)<input type="number" min="100" max="250" value="'+(p.alturaCm||'')+'" data-a="perf-n" data-f="alturaCm"></label>'+
        '<label class="fld">peso de hoy (kg)<input type="number" min="30" max="300" step="0.1" id="perfPeso" value="'+(p.pesoKg||'')+'"></label>'+
        '<label class="fld" style="justify-content:flex-end"><button class="btn p" data-a="perf-peso">apuntar peso</button></label>'+
      '</div>'+
      '<p class="mini" style="margin:10px 0 4px">Hacia dónde vas</p>'+
      '<div class="row">'+METAS.map(function(m){
        return '<button class="btn s '+(p.meta===m[0]?'p':'')+'" data-a="perf-meta" data-v="'+m[0]+'">'+m[1]+'</button>';}).join('')+'</div>'+
      '<div class="row" style="margin-top:12px;border-top:1px solid var(--line);padding-top:11px">'+
        '<button class="btn s '+(p.celiaco?'g':'')+'" data-a="perf-celiaco">'+(p.celiaco?'✓':'○')+' soy celíaco</button>'+
        (p.celiaco?'<button class="btn s" data-a="food-vista" data-v="gluten">revisar mis platos →</button>':'')+
      '</div>'+
      /* la avena no lleva gluten: lo que la hace dudosa es que se muele con trigo. Si la tuya es
         certificada, el porridge y el yogur con avena dejan de salir en ámbar. */
      (p.celiaco?('<div class="row" style="margin-top:9px">'+
        '<button class="btn s '+(avenaSegura()?'g':'')+'" data-a="perf-avena">'+(avenaSegura()?'✓':'○')+
          ' mi avena es sin gluten certificada</button></div>'+
        '<p class="mini" style="margin:7px 0 0">'+(avenaSegura()
          ?'Así que el porridge y el yogur con avena cuentan como sin gluten. Cámbialo el día que compres otra marca.'
          :'Mientras no lo sea, la avena sale en ámbar: se cultiva y se muele con trigo.')+'</p>'):'')+
    '</div>'+
    '<div class="card"><h2>Tu peso</h2>'+
      (t?('<div class="kpis compact">'+
          '<div><b>'+fmtKg(t.hoy)+'</b><span>último ('+esc(fechaCortaTxt(t.fecha))+')</span></div>'+
          '<div><b>'+(t.media!=null?fmtKg(t.media):'—')+'</b><span>media de 7 días</span></div>'+
          '<div><b>'+(t.porSemana!=null?((t.porSemana>0?'+':'')+fmtKg(t.porSemana)):'—')+'</b><span>kg por semana</span></div>'+
        '</div>'+pesoCurvaHTML()+
        '<p class="mini" style="margin-top:8px">La báscula de un día sube y baja con la sal, el agua y la hora. '+
        'Lo que dice algo es la media de siete días: son '+t.n+' pesadas en '+t.dias+' días.</p>')
        :'<div class="empty">Apunta tu peso unos días y aquí sale la tendencia. Con una sola pesada no hay nada que decir.</div>')+
      '<p class="mini" style="margin-top:8px;color:var(--ink2)">La masa muscular no se puede sacar de lo que comes: '+
      'eso habría que inventárselo. Aquí va el peso y su tendencia, cruzados con lo que comes y lo que levantas.</p>'+
    '</div></div>';}
function pesoCurvaHTML(){
  const p=perfilS(),l=p.pesos.slice(-60);
  if(l.length<3)return '';
  const max=l.reduce(function(a,x){return Math.max(a,x.kg);},0);
  const min=l.reduce(function(a,x){return Math.min(a,x.kg);},max);
  const rango=Math.max(0.5,max-min),W=280,H=64;
  const pts=l.map(function(x,i){
    return {x:4+(l.length<2?0:i*(W-8)/(l.length-1)),y:H-6-((x.kg-min)/rango)*(H-14)};});
  const d=pts.map(function(q,i){return (i?'L':'M')+q.x.toFixed(1)+' '+q.y.toFixed(1);}).join(' ');
  return '<svg class="curva" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="tu peso">'+
    '<path d="'+d+'" class="cl"></path></svg>'+
    '<div class="curvapie"><span>'+fmtKg(l[0].kg)+' kg</span>'+
    '<b class="'+(l[l.length-1].kg<l[0].kg?'sube':'')+'">'+fmtKg(Math.round((l[l.length-1].kg-l[0].kg)*10)/10)+' kg</b>'+
    '<span>'+fmtKg(l[l.length-1].kg)+' kg</span></div>';}
function renderFoodGluten(){
  /* LO QUE HAY QUE CAMBIAR. La app avisa, no garantiza: lo que manda es el envase. */
  const g=platosConGluten();
  const fila=function(o,tipo){
    const c=GLUTEN_CAMBIOS[o.d.id];
    return '<div class="glufila '+tipo+'">'+
      '<div class="n"><b>'+esc(o.d.name)+'</b>'+
        '<span>'+esc(o.porQue.map(function(x){return x.x;}).slice(0,3).join(' · ')||'por el nombre')+'</span></div>'+
      (tipo==='si'&&c?('<button class="btn p s" data-a="glu-cambiar" data-id="'+esc(o.d.id)+'">cambiar</button>'):'')+
      '</div>';};
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><button class="btn s volver" data-a="food-vista" data-v="perfil">'+
      gymIco('atras','gico sm')+' Tú</button><h2 class="subtit">Gluten</h2></div>'+
    '<div class="card gluaviso">'+gymIco('aviso','gico')+
      '<div><b>La app avisa, no garantiza.</b> Un nombre no dice lo que lleva un producto: el chorizo '+
      'de una marca lleva gluten y el de otra no. Lo que manda es la etiqueta del envase.</div></div>'+
    '<div class="card"><h2>Llevan gluten</h2>'+
      (g.si.length?(g.si.map(function(o){return fila(o,'si');}).join('')+
        '<p class="mini" style="margin-top:9px">«Cambiar» te deja el mismo plato con la versión sin gluten. '+
        'No se cambia nada sin que lo toques.</p>')
        :'<div class="empty">Ninguno de tus platos lleva gluten.</div>')+
    '</div>'+
    '<div class="card"><h2>Depende de la marca</h2>'+
      (g.depende.length?(g.depende.map(function(o){return fila(o,'dep');}).join('')+
        '<p class="mini" style="margin-top:9px">Estos pueden ser sin gluten o no según lo que compres: '+
        'avena certificada, embutidos, caldos, salsas y suplementos. Mira la etiqueta una vez y ya lo sabes.</p>')
        :'<div class="empty">Nada dudoso.</div>')+
    '</div></div>';}
function renderFood(){
  const v=ui.foodVista||'';
  if(v==='buscar')return renderFoodBuscar();
  if(v==='cantidad')return renderFoodCantidad();
  if(v==='micros')return renderFoodMicros();
  if(v==='productos')return renderFoodProductos();
  if(v==='cocina-panel')return renderCocinaPanel();
  if(v==='platos')return renderMisPlatos();
  if(v==='add')return renderFoodAdd();
  if(v==='perfil')return renderFoodPerfil();
  if(v==='gluten')return renderFoodGluten();
  /* «Qué cocino», «Mi nevera» e «Ideas» eran tres pantallas para la misma pregunta: ahora son las
     tres pestañas de Cocina. Los nombres viejos siguen llevando a su pestaña y no a una pared. */
  if(v==='cocinar'||v==='ideas'||v==='nevera'){
    ui.cocinaTab=(v==='nevera')?'nevera':'';
    ui.foodVista='cocina-panel';return renderCocinaPanel();}
  if(v==='cocina')return renderFoodCocina();
  if(v==='alimentos')return renderAlimentos();
  if(v==='ficha')return renderAlimFicha();
  if(v==='plato')return renderPlatoNuevo();
  if(v==='alimnuevo')return renderAlimNuevo();
  return renderFoodDia();
}

/* ===================== entreno: la vista ===================== */
function renderSesionActiva(){
  const sa=ui.gymSesionActiva;if(!sa)return '';
  const g=gymS(),rt=g.rutinas.find(function(r){return r.id===sa.rutinaId;});
  const hechas=g.registro.filter(function(x){return x.sesionId===sa.id;});
  const vol=Math.round(hechas.reduce(function(a,x){return a+(+x.kg||0)*(+x.reps||0);},0));
  return '<div class="card"><h2>🏁 Sesión en curso: '+esc(rt?rt.nombre:'')+'</h2>'+
    '<p class="note">'+hechas.length+' de '+sa.plan+' series hechas · '+vol.toLocaleString('es-ES')+' kg de volumen. '+
    'Apunta o ajusta las series en «El día» (más abajo) y, cuando acabes, dale a «he terminado».</p>'+
    '<div class="fgrid c3">'+
      '<label class="fld">¿cuánto has tardado? (min)<input id="sesMinutos" type="number" min="1" max="240" value="'+duracionTipica(sa.rutinaId)+'"></label>'+
      '<label class="fld">nota<input id="sesNota" placeholder="floja, con prisa…"></label>'+
      '<label class="fld" style="flex-direction:row;align-items:center;gap:6px">'+
        '<input type="checkbox" id="sesCompleto" style="width:auto" '+(hechas.length>=sa.plan?'checked':'')+'> la he hecho entera</label>'+
    '</div>'+
    '<div class="row" style="margin-top:10px">'+
      '<button class="btn p" data-a="ses-terminar">✓ he terminado</button>'+
      '<button class="btn s" data-a="ses-descartar">descartar sesión</button></div>'+
    '</div>';}
function renderGymVivo(){
  /* LA PANTALLA DE ENTRENAR, la que se usa con el móvil en la mano entre serie y serie:
     ejercicio actual arriba, el peso propuesto CON SU PORQUÉ, −/+ sin teclado, el esfuerzo en
     palabras y no en números, la cuenta atrás y el récord marcado. */
  const sa=ui.gymSesionActiva;
  if(!sa)return renderGymPortada();
  const g=gymS(),rt=g.rutinas.filter(function(r){return r.id===sa.rutinaId;})[0];
  const c=vivoCampos(sa);
  const hechas=g.registro.filter(function(x){return x.sesionId===sa.id;});
  const vol=Math.round(hechas.reduce(function(a,x){return a+(+x.kg||0)*(+x.reps||0);},0));
  const min=Math.max(0,Math.round((Date.now()-(+sa.ts||Date.now()))/60000));
  const pct=Math.min(1,hechas.length/Math.max(1,sa.plan));
  const R=17,C=2*Math.PI*R;
  const anillo='<svg class="gvanillo" width="42" height="42" viewBox="0 0 42 42" role="img" aria-label="'+
    hechas.length+' de '+sa.plan+' series">'+
    '<circle cx="21" cy="21" r="'+R+'" fill="none" stroke="var(--line)" stroke-width="5"></circle>'+
    '<circle cx="21" cy="21" r="'+R+'" fill="none" stroke="var(--brand)" stroke-width="5" stroke-linecap="round"'+
    ' stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-pct)).toFixed(1)+'" transform="rotate(-90 21 21)"></circle>'+
    '<text x="21" y="25" text-anchor="middle" fill="var(--ink)" font-size="13" font-weight="800">'+hechas.length+'</text></svg>';

  const cab='<div class="gvcab">'+
    '<button class="btn s volver" data-a="gym-panel" data-p="">'+gymIco('atras','gico sm')+'</button>'+
    '<div class="gvtit"><b>'+esc(rt?rt.nombre:'Entreno')+'</b>'+
      '<span>'+min+' MIN · '+vol.toLocaleString('es-ES')+' KG MOVIDOS</span></div>'+anillo+'</div>';

  if(!c)return ($('#main').innerHTML='<div class="grid">'+cab+
    '<div class="card"><div class="empty">Esta rutina no tiene ejercicios. Añádeselos desde «Rutinas» y vuelve.</div>'+
    '<div class="row" style="margin-top:10px"><button class="btn s" data-a="gym-panel" data-p="rutinas">ir a Rutinas</button>'+
    '<button class="btn d s" data-a="ses-descartar">descartar sesión</button></div></div></div>');

  const ej=c.ej,pr=c.pr;
  const serieN=Math.min(ej.series,ej.hechas+1);
  const hoyEx=seriesDeDia(ej.ex,sa.fecha).filter(function(x){return x.sesionId===sa.id;});
  const mejor=prDe(ej.ex);
  const sig=c.plan.map(function(p,i){return {p:p,i:i};})
    .filter(function(o){return o.i!==c.ix&&o.p.hechas<o.p.series;})[0];

  const paso=esEjercicioDeAbajo(ej.ex)?5:2.5;
  const mando=function(campo,etq,val,dm,dp,uni){
    return '<div class="gvnum"><div class="e">'+etq+'</div><div class="m">'+
      '<button class="btn s" data-a="gv-'+campo+'" data-d="'+dm+'" aria-label="menos '+etq.toLowerCase()+'">−</button>'+
      '<div class="v">'+esc(val)+(uni?'<i>'+uni+'</i>':'')+'</div>'+
      '<button class="btn s" data-a="gv-'+campo+'" data-d="'+dp+'" aria-label="más '+etq.toLowerCase()+'">+</button>'+
      '</div></div>';};

  const esfuerzo='<div class="gvesf"><span class="e">ESFUERZO</span>'+
    RPE_PAL.map(function(r){
      return '<button class="btn s'+(c.rpe===r.n?' on':'')+'" data-a="gv-rpe" data-d="'+r.n+'"'+
        (c.rpe===r.n?' aria-pressed="true"':'')+'>'+r.txt+'</button>';}).join('')+'</div>';

  const chips=hoyEx.length?('<div class="gvchips">'+hoyEx.map(function(x){
      const rec=esRecord(x.ex,x.kg,x.reps,x.id);
      return '<span class="gvchip'+(rec?' pr':'')+'">'+fmtKg(x.kg)+' × '+x.reps+(rec?' ★':'')+'</span>';}).join('')+'</div>')
    :'<div class="mini" style="margin-top:7px;color:var(--ink2)">Todavía no has apuntado ninguna serie de este ejercicio hoy.</div>';

  const desc=ui.gymDesc?('<div class="gvdesc" id="gvDesc">'+
    '<div class="r" id="gvReloj">–</div>'+
    '<div class="b"><span class="e">DESCANSO</span><span class="ba"><i id="gvBarra" style="width:100%"></i></span></div>'+
    '<button class="btn s" data-a="gv-mas15">+15s</button>'+
    '<button class="btn s" data-a="gv-saltar">saltar</button></div>'):'';

  $('#main').innerHTML='<div class="grid">'+cab+
    '<div class="card gvhero">'+
      '<div class="gvex"><b>'+esc(ej.ex)+'</b><span>serie '+serieN+'/'+ej.series+'</span></div>'+
      '<div class="gvpor '+pr.cl+'">'+gymIco(pr.cl==='sube'?'subir':(pr.cl==='baja'?'bajar':'chispa'),'gico sm')+
        '<span>'+esc(pr.txt)+'</span></div>'+
      '<div class="gvmandos">'+mando('kg','KG',fmtKg(c.kg),-paso,paso,'')+mando('reps','REPS',c.reps,-1,1,'')+'</div>'+
      esfuerzo+
      '<button class="btn p gbig" data-a="gv-apuntar">apuntar serie</button>'+
    '</div>'+
    desc+
    '<div class="card"><div class="gvh"><span>SERIES DE HOY</span>'+
      (mejor?('<span class="pr">tu mejor marca: '+fmtKg(mejor.rmKg)+' × '+mejor.rmReps+'</span>'):'')+'</div>'+
      chips+'</div>'+
    (sig?('<div class="card gvsig"><div><span class="e">DESPUÉS</span>'+
      '<b>'+esc(sig.p.ex)+' · '+sig.p.series+'×'+sig.p.reps+'</b></div>'+
      '<button class="btn s" data-a="gv-ir" data-ix="'+sig.i+'">pasar ›</button></div>'):'')+
    '<div class="gvpie">'+
      '<button class="btn s" data-a="gv-cambiar">cambiar ejercicio</button>'+
      '<button class="btn g" data-a="gv-terminar">terminar</button></div>'+
    '</div>';
  cuentaAtras();}
function renderGymCambiar(){
  /* elegir a mano en qué ejercicio estás: la rutina no siempre se hace en orden */
  const sa=ui.gymSesionActiva;
  if(!sa)return renderGymPortada();
  const plan=sesionPlan(sa),act=sesionIx(sa);
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><button class="btn s volver" data-a="gym-panel" data-p="vivo">'+
      gymIco('atras','gico sm')+' Entrenando</button><h2 class="subtit">¿Cuál toca?</h2></div>'+
    '<div class="card">'+plan.map(function(p,i){
      return '<button class="gvfila'+(i===act?' on':'')+'" data-a="gv-ir" data-ix="'+i+'">'+
        '<span class="n">'+esc(p.ex)+'</span>'+
        '<span class="mini chipnum">'+p.hechas+'/'+p.series+'</span>'+
        (p.hechas>=p.series?'<span class="mini ok">✓</span>':'<span class="mini">'+p.series+'×'+p.reps+'</span>')+
        '</button>';}).join('')+'</div></div>';}
function informeSesion(sid){
  /* EL INFORME AL TERMINAR: qué has hecho, cómo ha ido frente a la vez anterior y qué récords hay */
  const g=gymS(),ses=g.sesiones.filter(function(s){return s.id===sid;})[0];
  if(!ses)return null;
  const rt=g.rutinas.filter(function(r){return r.id===ses.rutinaId;})[0];
  const series=g.registro.filter(function(x){return x.sesionId===sid;});
  const vol=Math.round(series.reduce(function(a,x){return a+(+x.kg||0)*(+x.reps||0);},0));
  /* los récords: se comparan contra todo lo anterior A ESTA sesión */
  const previos={};
  g.registro.forEach(function(x){
    if(x.sesionId===sid)return;
    const rm=Math.round((+x.kg||0)*(1+(+x.reps||0)/30)*10)/10;
    if(!previos[x.ex]||rm>previos[x.ex])previos[x.ex]=rm;});
  const records=[];
  const mejorPorEx={};
  series.forEach(function(x){
    const rm=Math.round((+x.kg||0)*(1+(+x.reps||0)/30)*10)/10;
    if(!mejorPorEx[x.ex]||rm>mejorPorEx[x.ex].rm)mejorPorEx[x.ex]={rm:rm,kg:x.kg,reps:x.reps};});
  Object.keys(mejorPorEx).forEach(function(ex){
    if(mejorPorEx[ex].rm>(previos[ex]||0))records.push({ex:ex,kg:mejorPorEx[ex].kg,reps:mejorPorEx[ex].reps});});
  /* la vez anterior con la misma rutina */
  const antes=g.sesiones.filter(function(s){return s.rutinaId===ses.rutinaId&&s.id!==sid;})
    .sort(function(a,b){return (b.fecha||'').localeCompare(a.fecha||'');})[0];
  let volAntes=null;
  if(antes){const sa2=g.registro.filter(function(x){return x.sesionId===antes.id;});
    volAntes=Math.round(sa2.reduce(function(a,x){return a+(+x.kg||0)*(+x.reps||0);},0));}
  const regs=new Set();
  series.forEach(function(x){regionesDeEjercicio(x).forEach(function(r){regs.add(r);});});
  return {ses:ses,rt:rt,series:series,vol:vol,records:records,antes:antes,volAntes:volAntes,regs:regs,
    esfuerzo:series.filter(function(x){return +x.rpe>=9;}).length};}
function renderGymInforme(){
  const inf=informeSesion(ui.gymInforme);
  if(!inf){ui.gymInforme='';return renderGymPortada();}
  const dif=(inf.volAntes!=null&&inf.volAntes>0)?Math.round((inf.vol-inf.volAntes)/inf.volAntes*100):null;
  const porEx={};
  inf.series.forEach(function(x){(porEx[x.ex]=porEx[x.ex]||[]).push(x);});
  $('#main').innerHTML='<div class="grid">'+
    '<div class="card gvfin">'+
      '<div class="gvfint">'+gymIco('ok','gico')+'<div><b>'+esc(inf.rt?inf.rt.nombre:'Sesión')+(inf.ses.completo?' hecha':', a medias')+'</b>'+
        '<span>'+inf.series.length+' de '+(+inf.ses.plan||inf.series.length)+' series · '+
        inf.ses.duracionMin+' min'+(inf.ses.completo?' · entera':'')+'</span></div></div>'+
      '<div class="kpis compact" style="margin-top:10px">'+
        '<div><b>'+inf.vol.toLocaleString('es-ES')+'</b><span>kg movidos</span></div>'+
        '<div><b>'+(dif==null?'—':((dif>0?'+':'')+dif+'%')) +'</b><span>'+(inf.antes?'frente a la anterior':'primera vez')+'</span></div>'+
        '<div><b>'+inf.records.length+'</b><span>récord'+(inf.records.length===1?'':'s')+'</span></div>'+
      '</div>'+
      (inf.records.length?('<div class="gvrecs">'+inf.records.map(function(r){
        return '<span class="gvchip pr">★ '+esc(r.ex)+' · '+fmtKg(r.kg)+' × '+r.reps+'</span>';}).join('')+'</div>'):'')+
    '</div>'+
    '<div class="card"><h2>Lo que has hecho</h2>'+
      Object.keys(porEx).map(function(ex){
        const xs=porEx[ex];
        return '<div class="frow"><span class="fn">'+esc(ex)+'</span>'+
          '<span class="mini">'+xs.map(function(x){return fmtKg(x.kg)+'×'+x.reps;}).join(' · ')+'</span></div>';}).join('')+
      diagramaHTML(inf.regs,'músculos de esta sesión')+
    '</div>'+
    '<div class="row"><button class="btn p" data-a="gym-informe-cerrar">listo</button>'+
      '<button class="btn s" data-a="gym-panel" data-p="progreso">ver progreso</button></div>'+
    '</div>';}
function renderHistorialCard(){
  const g=gymS();
  if(!g.rutinas.length)return '';
  const filas=g.rutinas.map(function(rt){
    const h=historialRutina(rt.id);
    return '<div class="row" style="justify-content:space-between;border-top:1px dashed var(--line);padding:6px 0">'+
      '<b>'+esc(rt.nombre)+'</b>'+
      '<span class="mini chipnum">'+h.esteMes+' este mes</span>'+
      '<span class="mini chipnum">'+(h.n?(h.media+' min de media'):'sin sesiones')+'</span>'+
      '<span class="mini">'+(h.ultima?('hace '+h.diasDesde+' día'+(h.diasDesde===1?'':'s')):'nunca')+'</span></div>';}).join('');
  const recientes=sesionesRecientes(20);
  const ultima=recientes[0];
  const listaSes=recientes.length?('<div class="daylist" style="margin-top:8px">'+recientes.map(function(s){
    const rt=g.rutinas.find(function(r){return r.id===s.rutinaId;});
    return '<div class="frow"><span><span class="fn">'+esc(rt?rt.nombre:'(rutina borrada)')+'</span>'+
      '<span class="fm"> · '+s.fecha.slice(8)+'/'+s.fecha.slice(5,7)+'</span></span>'+
      '<span class="mini chipnum">'+s.duracionMin+' min</span>'+
      '<span class="mini">'+(s.completo?'✓ entera':'parcial')+'</span></div>';}).join('')+'</div>')
    :'<div class="empty">Ninguna sesión guardada todavía: empieza una rutina de arriba y termínala para que aparezca aquí.</div>';
  return '<div class="card"><h2>🗓️ Historial de rutinas</h2>'+filas+
    (ultima?diagramaHTML(regionesDeSesion(ultima.id),'músculos de tu última sesión ('+esc((g.rutinas.find(function(r){return r.id===ultima.rutinaId;})||{}).nombre||'')+')'):'')+
    '<details class="dtip" style="margin-top:10px"><summary class="mini">últimas sesiones</summary>'+listaSes+'</details>'+
    '</div>';}
const CTIPOS=[['natación','🏊'],['carrera','🏃'],['bici','🚴'],['otro','🤸']];
function cardioPorTipo(){
  const g=gymS(),porTipo={};
  g.cardio.forEach(function(x){(porTipo[x.tipo]=porTipo[x.tipo]||[]).push(x);});
  Object.keys(porTipo).forEach(function(t){
    porTipo[t].sort(function(a,b){return (b.fecha||'').localeCompare(a.fecha||'');});});
  return porTipo;}
function cardioFormHTML(tipo){
  return '<div class="fgrid c3 tight" style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)">'+
    '<label class="fld">fecha<input type="date" id="cardioFecha" value="'+iso(new Date())+'"></label>'+
    '<label class="fld">minutos<input type="number" min="1" max="360" id="cardioMin" value="30"></label>'+
    '<label class="fld">km (opcional)<input type="number" min="0" step="0.1" id="cardioKm"></label>'+
    '<label class="fld" style="grid-column:1/-1">nota<input id="cardioNota" placeholder="ritmo, sensaciones…"></label>'+
    '</div>'+
    '<input type="hidden" id="cardioTipo" value="'+esc(tipo)+'">'+
    '<div class="row" style="margin-top:8px"><button class="btn p" data-a="cardio-add">apuntar '+esc(tipo)+'</button></div>';}
function renderCardioCard(){
  /* el usuario pidió quitar el scroll infinito: primero los tipos como fichas y, al tocar una,
     su propia pantalla con un botón de volver — en vez de cuatro acordeones abiertos a la vez */
  const porTipo=cardioPorTipo(),abierto=ui.cardioAbierto;
  const ficha=CTIPOS.filter(function(t){return t[0]===abierto;})[0];
  if(ficha){
    const nm=ficha[0],lista=porTipo[nm]||[];
    const minTot=lista.reduce(function(a,x){return a+(x.duracionMin||0);},0);
    const kmTot=Math.round(lista.reduce(function(a,x){return a+(x.distanciaKm||0);},0)*10)/10;
    const mes=lista.filter(function(x){return (x.fecha||'').slice(0,7)===iso(new Date()).slice(0,7);}).length;
    return '<div class="card" data-cardio="'+esc(nm)+'">'+
      '<div class="row" style="align-items:center;gap:8px">'+
        '<button class="btn s" data-a="cardio-back">‹ Cardio</button>'+
        '<h2 style="margin:0">'+ficha[1]+' '+esc(nm.charAt(0).toUpperCase()+nm.slice(1))+'</h2></div>'+
      '<div class="kpis compact" style="margin-top:10px">'+
        '<div><b>'+lista.length+'</b><span>sesiones</span></div>'+
        '<div><b>'+mes+'</b><span>este mes</span></div>'+
        '<div><b>'+fmtHM(minTot)+'</b><span>en total</span></div>'+
        (kmTot?'<div><b>'+kmTot+'</b><span>km</span></div>':'')+
      '</div>'+
      (lista.length?('<div class="daylist" style="margin-top:10px">'+lista.map(function(x){
        return '<div class="frow"><span><span class="fn">'+x.fecha.slice(8)+'/'+x.fecha.slice(5,7)+'</span>'+
          (x.nota?'<span class="fm"> · '+esc(x.nota)+'</span>':'')+'</span>'+
          '<span class="mini chipnum">'+x.duracionMin+' min'+(x.distanciaKm?(' · '+x.distanciaKm+' km'):'')+'</span>'+
          '<span><button class="btn d s" data-a="cardio-del" data-id="'+x.id+'" title="borrar">×</button></span></div>';}).join('')+'</div>')
        :'<div class="empty" style="margin-top:10px">Nada apuntado todavía de '+esc(nm)+'. Apúntalo aquí abajo.</div>')+
      cardioFormHTML(nm)+
      '</div>';}
  const fichas=CTIPOS.map(function(t){
    const nm=t[0],lista=porTipo[nm]||[],ultimo=lista[0];
    return '<button class="ctile" data-a="cardio-open" data-tipo="'+esc(nm)+'">'+
      '<span class="ctile-ic">'+t[1]+'</span>'+
      '<b>'+esc(nm.charAt(0).toUpperCase()+nm.slice(1))+'</b>'+
      '<span class="ctile-n">'+lista.length+(lista.length===1?' sesión':' sesiones')+'</span>'+
      '<span class="mini">'+(ultimo?('última: '+ultimo.fecha.slice(8)+'/'+ultimo.fecha.slice(5,7)):'sin apuntar')+'</span>'+
      '</button>';}).join('');
  return '<div class="card"><h2>🏃 Cardio</h2>'+
    '<p class="note">Aparte del entreno de fuerza. Toca un tipo y entras en su pantalla.</p>'+
    '<div class="ctiles">'+fichas+'</div>'+
    '</div>';}
function entrenoHeatmapCard(){
  /* informe: falta una gráfica con los días entrenados — 6 semanas, fuerza (sesiones) y cardio aparte */
  const g=gymS(),hoy=new Date(),hoyK=iso(hoy);
  const inicio=addDays(mondayOf(hoy),-35);
  const porFecha={};
  g.sesiones.forEach(function(s){porFecha[s.fecha]=Math.max(porFecha[s.fecha]||0,2);});
  g.cardio.forEach(function(c){porFecha[c.fecha]=Math.max(porFecha[c.fecha]||0,1);});
  const cells=[];
  for(let i=0;i<42;i++){const k=iso(addDays(inicio,i));cells.push({k:k,lvl:k>hoyK?-1:(porFecha[k]||0)});}
  const trained=cells.filter(function(c){return c.lvl>0;}).length;
  let racha=0;
  for(let i=cells.length-1;i>=0;i--){if(cells[i].lvl<0)continue;if(cells[i].lvl>0)racha++;else break;}
  const cellsHtml=cells.map(function(c){
    return '<div class="hcell'+(c.lvl<0?' off':c.lvl===2?' l2':c.lvl===1?' l1':'')+'" title="'+c.k+'"></div>';}).join('');
  return '<div class="card"><h2>📈 Días entrenados <span class="mini">últimas 6 semanas</span></h2>'+
    '<div class="heat"><span class="wd">L</span><span class="wd">M</span><span class="wd">X</span><span class="wd">J</span>'+
    '<span class="wd">V</span><span class="wd">S</span><span class="wd">D</span>'+cellsHtml+'</div>'+
    '<div class="heatstat"><span><b>'+trained+'</b> día(s) entrenado(s)</span><span><b>'+racha+'</b> de racha</span></div>'+
    '</div>';
}
/* ===================== Entreno: portada de fichas y pantallas enfocadas =====================
   Antes esta pestaña apilaba 8 tarjetas —2.974 px, 3,3 pantallas, 27 botones— nada más entrar,
   con lo que de verdad se usa a diario (apuntar una serie) a mil píxeles de scroll y la fila de
   borrado por encima de todo. Ahora la portada cabe en media pantalla y cada bloque vive en su
   pantalla, con «‹ Entreno» para volver, igual que ya hacía Cardio. */
const GYM_ICO={
  pesa:'<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
  lista:'<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  pulso:'<path d="M3 12h4l2-5 3 10 2.5-6 1.5 3h5"/>',
  libro:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
  barras:'<path d="M3 20h18"/><path d="M6.5 20v-4"/><path d="M11.5 20V9"/><path d="M16.5 20v-7"/><path d="M21 20V5"/>',
  atras:'<path d="M15 5l-7 7 7 7"/>',
  mas:'<path d="M12 5v14M5 12h14"/>',
  chevron:'<path d="M9 5l7 7-7 7"/>',
  caja:'<path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5 3.5 16.5z"/><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9"/>',
  olla:'<path d="M4 9h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M2 9h20M8 9V6M16 9V6"/>',
  importar:'<path d="M12 3v11M8 10.5l4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  lupa:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  camara:'<path d="M3 8.5A2 2 0 0 1 5 6.5h2l1.5-2h7L17 6.5h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/>',
  lapiz:'<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>',
  reloj:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  manzana:'<path d="M12 8.2c-1.3-1.4-3-1.9-4.4-1.2C5.6 7.9 5 10.6 6 13.6c.9 2.7 2.6 4.9 4 4.9.7 0 1.3-.4 2-.4s1.3.4 2 .4c1.4 0 3.1-2.2 4-4.9 1-3 .4-5.7-1.6-6.6-1.4-.7-3.1-.2-4.4 1.2z"/><path d="M12 8.2V5.6c0-1 .8-1.9 1.9-2.1"/>',
  nevera:'<rect x="5.5" y="2.8" width="13" height="18.4" rx="2.5"/><path d="M5.5 10h13M9 6v2M9 13v2.5"/>',
  chispa:'<path d="M12 3l1.9 4.9L19 9.8l-4.4 3.1.6 5.3-3.2-2.6-3.2 2.6.6-5.3L5 9.8l5.1-1.9z"/>',
  balanza:'<path d="M12 4v16M7 8h10"/><path d="M4 14a3 3 0 0 0 6 0l-3-6z"/><path d="M14 14a3 3 0 0 0 6 0l-3-6z"/>',
  cama:'<path d="M3 18v-7h18v7"/><path d="M3 11V7M21 18v2M3 18v2"/><circle cx="7.5" cy="9" r="1.8"/><path d="M10.5 11V9h8"/>',
  calendario:'<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  repetir:'<path d="M4 9a5 5 0 0 1 5-5h9"/><path d="M15 1l3 3-3 3"/><path d="M20 15a5 5 0 0 1-5 5H6"/><path d="M9 23l-3-3 3-3"/>',
  ajustes:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>',
  /* las puertas de Ajustes y de Datos */
  sol:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
  pincel:'<path d="M4 20c0-2.2 1.3-3 2.5-3S9 17.8 9 20c0 1.1-1.1 1.6-2.5 1.6S4 21.1 4 20z"/><path d="M8.5 16.5 19 6a2.1 2.1 0 0 0-3-3L5.5 13.5"/>',
  enlace:'<path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.5 6.3"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.3-1.3"/>',
  disco:'<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M8 3.5v6h8v-6M8 20.5v-5h8v5"/>',
  tabla:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M9 9.5v10M15 9.5v10"/>',
  plato:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>',
  hoja:'<path d="M6 3.5h8l4.5 4.5v12a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5z"/><path d="M14 3.5V8h4.5M8 13h8M8 17h5"/>',
  chincheta:'<path d="M9 3.5h6l-1 5 3.5 3v2H6.5v-2l3.5-3z"/><path d="M12 13.5V21"/>',
  ok:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  subir:'<path d="M6 14l6-6 6 6"/>',
  flecha:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  bajar:'<path d="M6 10l6 6 6-6"/>',
  aviso:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.2v.4"/>'
};
function gymIco(n,cls){return '<svg class="'+(cls||'gico')+'" viewBox="0 0 24 24" aria-hidden="true">'+(GYM_ICO[n]||'')+'</svg>';}
function gymSubcab(titulo,extra){
  return '<div class="subcab">'+
    '<button class="btn s volver" data-a="gym-panel" data-p="">'+gymIco('atras','gico sm')+' Entreno</button>'+
    '<h2 class="subtit">'+esc(titulo)+'</h2>'+(extra||'')+'</div>';}
function gymCtx(){
  const g=gymS(),hoy=iso(new Date());
  const sel=(ui.gymDate&&foodKey(ui.gymDate))?foodKey(ui.gymDate):hoy;
  const d=parseDate(sel)||new Date();
  const q=ui.gymQ||'';
  const hay=g.biblioteca.length>0;
  const filtroTipo=ui.gymFiltroTipo||'',filtroRegion=ui.gymFiltroRegion||'';
  const res=hay?gymBuscar(q,200).filter(function(x){
    if(filtroTipo&&tipoDeEjercicio(x)!==filtroTipo)return false;
    if(filtroRegion&&!regionesDeEjercicio(x).has(filtroRegion))return false;
    return true;}).slice(0,40):[];
  const sets=setsDe(sel);
  const sem=volumenSemana(sel);
  const maxvol=Math.max(1,sem.reduce(function(a,x){return Math.max(a,x.vol);},0));
  const nombres={},enRutina={};
  g.registro.forEach(function(x){nombres[x.ex]=(nombres[x.ex]||0)+1;});
  g.rutinas.forEach(function(rt){rt.ejercicios.forEach(function(r){enRutina[r.ex]=1;});});
  if(!g.rutinas.some(function(r){return r.id===ui.gymRutinaSel;}))ui.gymRutinaSel=(g.rutinas[0]||{}).id||'';
  const opcEx=Object.keys(nombres).concat(Object.keys(enRutina)).filter(function(x,i,a){return a.indexOf(x)===i;})
    .sort().map(function(nm){return '<option value="'+esc(nm)+'"></option>';}).join('');
  const prs=Object.keys(nombres).map(function(nm){const p=prDe(nm);return p?{ex:nm,p:p}:null;}).filter(Boolean)
    .sort(function(a,b){return b.p.rm-a.p.rm;}).slice(0,10);
  return {g:g,hoy:hoy,sel:sel,d:d,q:q,hay:hay,filtroTipo:filtroTipo,filtroRegion:filtroRegion,res:res,
    sets:sets,sem:sem,maxvol:maxvol,nombres:nombres,enRutina:enRutina,opcEx:opcEx,prs:prs,sg:diaSegundo(sel)};}
function gymDiasMes(){
  /* días con algo apuntado en el mes en curso: fuerza o cardio */
  const g=gymS(),m=iso(new Date()).slice(0,7),dias={};
  g.sesiones.forEach(function(s){if(String(s.fecha||'').slice(0,7)===m)dias[s.fecha]=1;});
  g.registro.forEach(function(s){if(String(s.fecha||'').slice(0,7)===m)dias[s.fecha]=1;});
  g.cardio.forEach(function(s){if(String(s.fecha||'').slice(0,7)===m)dias[s.fecha]=1;});
  return Object.keys(dias).length;}
function gymCardioSemana(){
  const g=gymS(),l=iso(mondayOf(new Date())),f=iso(addDays(mondayOf(new Date()),6));
  return g.cardio.filter(function(x){return x.fecha>=l&&x.fecha<=f;}).length;}
function gymFicha(p,ico,titulo,n,sub){
  return '<button class="gtile" data-a="gym-panel" data-p="'+p+'">'+gymIco(ico)+
    '<b>'+esc(titulo)+'</b><span class="n">'+esc(n)+'</span><span class="s">'+esc(sub)+'</span></button>';}
/* ===================== entrenar en vivo =====================
   Hasta ahora «empezar una rutina» montaba las 17 series de golpe en el registro con el peso de la
   última vez y luego había que ir corrigiéndolas en un formulario. Dos problemas: el formulario no
   es una pantalla para usar con el móvil en la mano entre serie y serie, y —peor— ui.gymSesionActiva
   NO se guarda: si cerrabas la app a medias, la sesión desaparecía y las 17 series se quedaban en tu
   historial como si las hubieras hecho. Ahora la serie se apunta cuando la haces, y solo esa. */
const RPE_PAL=[{n:7,txt:'fácil'},{n:8,txt:'justo'},{n:9,txt:'duro'},{n:10,txt:'al fallo'}];
function fmtKg(n){return fmt(n).replace('.',',');}   /* 62,5 y no 62.5: es el número más grande de la pantalla */
function esfuerzoTxt(rpe){
  const n=+rpe||0;if(!n)return '';
  let mejor=RPE_PAL[0];
  RPE_PAL.forEach(function(r){if(n>=r.n)mejor=r;});
  return mejor.txt;}
const MREG_ABAJO={cuadriceps:1,isquiotibiales:1,gluteos:1,gemelos:1};
function esEjercicioDeAbajo(nombre){
  /* el salto de peso no es el mismo arriba que abajo: 2,5 kg en un press, 5 en una sentadilla */
  const regs=regionesDeEjercicio({ex:nombre});
  let abajo=false;
  regs.forEach(function(r){if(MREG_ABAJO[r])abajo=true;});
  return abajo;}
function redondeaKg(x){return Math.max(0,Math.round((+x||0)/2.5)*2.5);}
function diasDeEjercicio(nombre){
  /* las fechas en las que has hecho ese ejercicio, de la más nueva a la más vieja */
  const xs=gymIdx().byEx[nombre]||[],f={};
  xs.forEach(function(x){if(x.fecha)f[x.fecha]=1;});
  return Object.keys(f).sort().reverse();}
function seriesDeDia(nombre,fecha){
  return (gymIdx().byEx[nombre]||[]).filter(function(x){return x.fecha===fecha;});}
function diaCumplido(dia,nser,tope){
  /* «la sacaste entera»: todas las series planeadas, al tope de repeticiones y sin pasar de «justo» */
  if(!dia.length)return false;
  if(nser&&dia.length<nser)return false;
  if(dia.some(function(x){return (+x.reps||0)<tope;}))return false;
  return !dia.some(function(x){return (+x.rpe||0)>=9;});}
function progresionDe(nombre,nser,tope,hoyKey){
  /* EL PESO DE HOY Y SU PORQUÉ. La regla, tal cual quedó en el diseño:
       · sacas todas las series al tope de reps con esfuerzo «justo» o menos  -> subes
         (2,5 kg arriba, 5 abajo)
       · te cuesta «duro» o «al fallo», o te quedas corto de reps            -> repites peso
       · dos veces seguidas atascado en el mismo peso                        -> bajas un 10 %
     Nunca mira el día de hoy: lo que interesa es de dónde vienes. */
  const reps=+tope||8,ns=+nser||0;
  const dias=diasDeEjercicio(nombre).filter(function(f){return f!==hoyKey;});
  if(!dias.length)
    return {kg:0,cl:'nuevo',txt:'Primera vez con este ejercicio. Empieza cómodo y apunta lo que hagas: a partir de ahí la app te dice el peso.'};
  const dia=seriesDeDia(nombre,dias[0]);
  const kg=redondeaKg(dia.reduce(function(a,x){return Math.max(a,+x.kg||0);},0));
  const hechas=dia.length,peorReps=dia.reduce(function(a,x){return Math.min(a,+x.reps||0);},99);
  const dur=dia.filter(function(x){return (+x.rpe||0)>=9;}).length;
  if(diaCumplido(dia,ns,reps)){
    const paso=esEjercicioDeAbajo(nombre)?5:2.5;
    return {kg:redondeaKg(kg+paso),cl:'sube',
      txt:'Sube a '+fmtKg(kg+paso)+' kg. La última vez hiciste '+hechas+'×'+peorReps+' a '+fmtKg(kg)+
        ' sin pasar de «justo».'};}
  /* ¿atascado? dos días seguidos con el mismo peso sin sacarla */
  if(dias.length>=2){
    const ant=seriesDeDia(nombre,dias[1]);
    const kgAnt=redondeaKg(ant.reduce(function(a,x){return Math.max(a,+x.kg||0);},0));
    if(kgAnt===kg&&!diaCumplido(ant,ns,reps)){
      const baja=redondeaKg(kg*0.9);
      if(baja>0&&baja<kg)
        return {kg:baja,cl:'baja',
          txt:'Baja a '+fmtKg(baja)+' kg. Llevas dos sesiones atascado en '+fmtKg(kg)+
            ': bajar un 10 % y volver a subir es más rápido que seguir peleándolo.'};}}
  return {kg:kg,cl:'mantiene',
    txt:'Repite '+fmtKg(kg)+' kg. La última vez '+(dur?('te costó «'+esfuerzoTxt(9)+'» o más'):('te quedaste en '+peorReps+' repeticiones'))+
      ', así que toca cerrarla antes de subir.'};}
function esRecord(nombre,kg,reps,excluirId){
  /* récord = mejor serie estimada (Epley) por encima de todo lo anterior de ese ejercicio */
  const rm=Math.round((+kg||0)*(1+(+reps||0)/30)*10)/10;
  if(!rm)return false;
  const xs=(gymIdx().byEx[nombre]||[]).filter(function(x){return x.id!==excluirId;});
  let mejor=0;
  xs.forEach(function(x){const r=Math.round((+x.kg||0)*(1+(+x.reps||0)/30)*10)/10;if(r>mejor)mejor=r;});
  return rm>mejor;}
function sesionPlan(sa){
  /* los ejercicios de la rutina con lo planeado y lo que llevas hecho en ESTA sesión */
  const g=gymS(),rt=g.rutinas.filter(function(r){return r.id===(sa&&sa.rutinaId);})[0];
  if(!rt)return [];
  const hechas={};
  g.registro.forEach(function(x){if(x.sesionId===sa.id)hechas[x.ex]=(hechas[x.ex]||0)+1;});
  return rt.ejercicios.map(function(ej){
    return {ex:ej.ex,series:Math.max(1,+ej.series||3),reps:Math.max(1,+ej.reps||8),hechas:hechas[ej.ex]||0};});}
function sesionIx(sa){
  /* en qué ejercicio estás: el que tú hayas elegido, y si no, el primero que no esté acabado */
  const plan=sesionPlan(sa);
  if(!plan.length)return 0;
  const n=+(sa&&sa.ix);
  if(n>=0&&n<plan.length)return n;
  for(let i=0;i<plan.length;i++)if(plan[i].hechas<plan[i].series)return i;
  return plan.length-1;}
function vivoCampos(sa){
  /* el peso y las reps que se ven en la pantalla: lo que hayas tocado tú, y si no, la propuesta */
  const plan=sesionPlan(sa),i=sesionIx(sa),ej=plan[i];
  if(!ej)return null;
  const pr=progresionDe(ej.ex,ej.series,ej.reps,sa.fecha);
  const tocado=ui.gymVivo&&ui.gymVivo.ex===ej.ex;
  return {ej:ej,ix:i,plan:plan,pr:pr,
    kg:tocado?ui.gymVivo.kg:pr.kg,
    reps:tocado?ui.gymVivo.reps:ej.reps,
    rpe:tocado?(ui.gymVivo.rpe||0):0};}
function vivoSet(campo,delta){
  const sa=ui.gymSesionActiva;if(!sa)return;
  const c=vivoCampos(sa);if(!c)return;
  const base={ex:c.ej.ex,kg:c.kg,reps:c.reps,rpe:c.rpe};
  if(campo==='kg')base.kg=Math.max(0,Math.round((base.kg+delta)*10)/10);
  else if(campo==='reps')base.reps=Math.max(1,Math.min(99,base.reps+delta));
  else if(campo==='rpe')base.rpe=(base.rpe===delta)?0:delta;
  ui.gymVivo=base;render();}
function vivoApuntar(){
  const sa=ui.gymSesionActiva;if(!sa)return 'no hay ninguna sesión en curso';
  const c=vivoCampos(sa);if(!c)return 'esta rutina no tiene ejercicios';
  const g=gymS(),id=uid('gs');
  const record=esRecord(c.ej.ex,c.kg,c.reps,id);
  g.registro.push({id:id,fecha:sa.fecha,ex:c.ej.ex,kg:c.kg,reps:c.reps,
    rpe:c.rpe||null,nota:'',ts:Date.now(),sesionId:sa.id});
  ui.gymVivo={ex:c.ej.ex,kg:c.kg,reps:c.reps,rpe:0};
  /* si con esta se acaba el ejercicio, se pasa solo al siguiente que quede */
  if(c.ej.hechas+1>=c.ej.series){
    const sig=c.plan.map(function(p,i){return {p:p,i:i};})
      .filter(function(o){return o.i!==c.ix&&o.p.hechas<o.p.series;})[0];
    if(sig){sa.ix=sig.i;ui.gymVivo=null;}}
  arrancaDescanso();
  save();render();
  return record?('¡récord! '+c.ej.ex+' '+fmtKg(c.kg)+' kg × '+c.reps)
    :(c.ej.ex+' '+fmtKg(c.kg)+' kg × '+c.reps+' apuntada');}
function descansoCfg(){
  const n=+((store.gym||{}).descansoSeg);
  return (n>=0&&n<=600)?n:90;}
function arrancaDescanso(){
  const seg=descansoCfg();
  if(!seg){ui.gymDesc=null;return;}
  ui.gymDesc={fin:Date.now()+seg*1000,total:seg};}
let _gvTick=null;
function pintaDescanso(){
  /* el reloj se escribe A MANO en su nodo: render() reemplaza #main entero, y repintarlo cada
     segundo tiraría lo que estés tocando además de ser un derroche */
  const n=document.getElementById('gvReloj');
  if(!n){if(_gvTick){clearInterval(_gvTick);_gvTick=null;}return;}
  const d=ui.gymDesc;
  if(!d){if(_gvTick){clearInterval(_gvTick);_gvTick=null;}return;}
  const queda=Math.max(0,Math.round((d.fin-Date.now())/1000));
  n.textContent=Math.floor(queda/60)+':'+String(queda%60).padStart(2,'0');
  const b=document.getElementById('gvBarra');
  if(b)b.style.width=Math.round(queda/Math.max(1,d.total)*100)+'%';
  if(queda<=0){ui.gymDesc=null;if(_gvTick){clearInterval(_gvTick);_gvTick=null;}
    const caja=document.getElementById('gvDesc');
    if(caja)caja.classList.add('fin');
    n.textContent='ya';}}
function cuentaAtras(){
  if(_gvTick){clearInterval(_gvTick);_gvTick=null;}
  if(!ui.gymDesc||!document.getElementById('gvReloj'))return;
  pintaDescanso();
  _gvTick=setInterval(pintaDescanso,1000);}
function gymDiaMalo(key,infOpt){
  /* un día en el que no vas a entrenar aunque el calendario diga que toca: guardia o saliente */
  const inf=infOpt||dayInfo(key),sh=shiftById(inf.shiftId);
  if(sh&&isGuardia(sh))return 'guardia';
  if(esSaliente(sh))return 'saliente';
  if(salidaDeGuardia(key))return 'saliente';
  return '';}
function gymHechoEn(key){
  /* ¿hiciste algo ese día? series apuntadas, sesión cerrada o cardio */
  const g=gymS();
  if(setsDe(key).length)return true;
  if(g.sesiones.some(function(s){return s.fecha===key;}))return true;
  return g.cardio.some(function(x){return x.fecha===key;});}
function gymDiaEstado(key){
  /* el estado de un día para la tira de la semana, y la línea que lo explica al tocarlo */
  const inf=dayInfo(key),sh=shiftById(inf.shiftId),hoy=iso(new Date());
  const rt=rutinaDeFecha(key),malo=gymDiaMalo(key,inf),hecho=gymHechoEn(key);
  let est='libre';
  if(hecho)est='hecho';
  else if(rt&&malo)est='choque';
  else if(key===hoy)est='hoy';
  else if(malo)est='guardia';
  else if(rt)est='plan';
  const partes=[];
  const hd=horasDelDiaTxt(key,inf);
  if(hd)partes.push(hd);
  if(hecho){
    const n=setsDe(key).length;
    if(n)partes.push(n+' serie'+(n===1?'':'s')+' apuntada'+(n===1?'':'s'));
    const cd=gymS().cardio.filter(function(x){return x.fecha===key;});
    if(cd.length)partes.push(cd.length+' de cardio');
  }else if(rt&&malo)partes.push('«'+rt.nombre+'» puesto aquí, pero estás de '+malo);
  else if(rt)partes.push('toca «'+rt.nombre+'»');
  else if(malo)partes.push('de '+malo+', sin entreno');
  else if(!hd)partes.push('sin nada puesto');
  return {key:key,est:est,rt:rt,malo:malo,hecho:hecho,sh:sh,txt:partes.join(' · ')};}
const GYM_EST_NOM={hecho:'hecho',hoy:'hoy',plan:'planeado',guardia:'guardia',choque:'choca con la guardia',libre:'libre'};
function gymTiraHTML(sel){
  /* L a D con lo que hay cada día. Tocas uno y la línea de abajo lo cuenta: la portada de Entreno
     no decía en qué punto de la semana estabas ni qué días te quedan libres. */
  const d0=parseDate(sel)||new Date(),lun=mondayOf(d0),hoy=iso(new Date());
  const celdas=[];let selTxt='',selEst='libre';
  for(let i=0;i<7;i++){
    const k=iso(addDays(lun,i)),e=gymDiaEstado(k),dd=parseDate(k);
    const marca=(k===sel);
    if(marca){selTxt=DAYSH[i]+' '+dd.getDate()+' · '+e.txt;selEst=e.est;}
    celdas.push('<button class="gday '+e.est+(marca?' sel':'')+(k===hoy?' esHoy':'')+'" data-a="gym-dia" data-key="'+k+'"'+
      ' aria-label="'+esc(DAYN[i]+' '+dd.getDate()+', '+GYM_EST_NOM[e.est])+'"'+(marca?' aria-current="true"':'')+'>'+
      '<span class="l">'+DAYSH[i].charAt(0)+'</span><span class="n">'+dd.getDate()+'</span><span class="b"></span></button>');}
  return '<div class="gtira">'+celdas.join('')+'</div>'+
    '<div class="gtiraq"><span class="pt '+selEst+'"></span><span>'+esc(selTxt)+'</span></div>';}
const GYM_DESC_GRUPOS=['pecho','espalda','hombros','cuadriceps','core'];
function gymDescanso(){
  /* cuántos días llevas sin tocar cada grupo grande. Es lo que justifica que hoy toque torso y no
     pierna, y hasta ahora no se veía en ninguna pantalla. */
  const g=gymS(),hoy=parseDate(iso(new Date())),ult={};
  g.registro.forEach(function(s){
    const f=parseDate(s.fecha);if(!f)return;
    regionesDeEjercicio(s).forEach(function(r){
      if(!ult[r]||f.getTime()>ult[r])ult[r]=f.getTime();});});
  return GYM_DESC_GRUPOS.map(function(r){
    if(!ult[r])return {reg:r,dias:null,cl:'nunca',txt:'—'};
    const dias=Math.max(0,Math.round((hoy.getTime()-ult[r])/86400000));
    return {reg:r,dias:dias,
      cl:dias<=1?'cansado':(dias===2?'casi':'listo'),
      txt:dias===0?'hoy':(dias===1?'ayer':(dias>=7?'7+ d':dias+' d'))};});}
function gymDescansoHTML(){
  const l=gymDescanso();
  if(!l.some(function(x){return x.dias!==null;}))return '';
  return '<div class="gdesc"><div class="gdesch"><span>QUÉ TIENES DESCANSADO</span>'+
    '<span class="mini">desde que lo entrenaste</span></div><div class="gdescr">'+
    l.map(function(x){
      return '<div class="gm '+x.cl+'"><span class="g">'+esc((MREG_LABEL[x.reg]||x.reg).split(' ')[0])+'</span>'+
        '<span class="v">'+esc(x.txt)+'</span></div>';}).join('')+'</div></div>';}
function gymChoque(desde){
  /* el primer entreno de los próximos 7 días que cae en un día en el que no vas a entrenar, y el
     primer hueco de verdad al que se puede mover */
  const d0=parseDate(desde);if(!d0)return null;
  for(let i=0;i<7;i++){
    const k=iso(addDays(d0,i)),inf=dayInfo(k);
    if(gymHechoEn(k))continue;
    const rt=rutinaDeFecha(k);if(!rt)continue;
    const malo=gymDiaMalo(k,inf);if(!malo)continue;
    let a='';
    for(let j=1;j<=7;j++){
      const k2=iso(addDays(parseDate(k),j));
      if(gymDiaMalo(k2))continue;
      if(rutinaDeFecha(k2))continue;
      if(gymHechoEn(k2))continue;
      a=k2;break;}
    return {key:k,rt:rt,malo:malo,a:a};}
  return null;}
function gymAvisoHTML(sel){
  /* El aviso ya no solo cuenta que tienes guardia: trae el botón que lo arregla.
     El choque manda sobre la confirmación: si no, al mover uno el «hecho» verde se quedaba una
     semana entera tapando el siguiente. */
  const ch=gymChoque(sel);
  if(!ch){
    /* la confirmación, solo mientras el día de origen siga en la semana que se está mirando */
    const c=gymCambios(),lun=iso(mondayOf(parseDate(sel)||new Date())),dom=iso(addDays(parseDate(lun),6));
    const movidos=Object.keys(c).filter(function(k){return k>=lun&&k<=dom;}).sort();
    if(!movidos.length)return '';
    const de=movidos[0],a=c[de],rt=rutinaDeFecha(a);
    return '<div class="gaviso ok"><div class="t">'+gymIco('ok','gico sm')+
      '<span><b>'+esc((rt?rt.nombre:'El entreno'))+' pasa al '+esc(fechaCortaTxt(a))+'.</b> '+
      'Lo tenías el '+esc(fechaCortaTxt(de))+', que no te dejaba entrenar.</span></div>'+
      '<button class="btn s" data-a="gym-deshacer" data-key="'+esc(de)+'">deshacer</button></div>';}
  return '<div class="gaviso mal"><div class="t">'+gymIco('aviso','gico sm')+
    '<span>El <b>'+esc(fechaCortaTxt(ch.key))+'</b> toca <b>'+esc(ch.rt.nombre)+'</b> y estás de '+esc(ch.malo)+': '+
    (ch.a?('el '+esc(fechaCortaTxt(ch.a))+' lo tienes libre.'):'no hay ningún hueco libre esta semana.')+'</span></div>'+
    (ch.a?('<button class="btn s" data-a="gym-mover" data-key="'+esc(ch.key)+'" data-to="'+esc(ch.a)+'">mover «'+
      esc(ch.rt.nombre)+'» al '+esc(fechaCortaTxt(ch.a))+'</button>'):'')+'</div>';}
function renderGymPortada(){
  const c=gymCtx(),g=c.g,sa=ui.gymSesionActiva;
  const rt=sa?g.rutinas.filter(function(r){return r.id===sa.rutinaId;})[0]:null;
  const hechas=sa?g.registro.filter(function(x){return x.sesionId===sa.id;}):[];
  /* las filas del héroe: los ejercicios de la rutina en curso con sus series marcadas; si no hay
     sesión abierta, lo que se haya apuntado hoy */
  let filas='',sub='',pie='';
  if(sa&&rt){
    sub='en curso · '+rt.nombre;
    const porEx={};hechas.forEach(function(x){porEx[x.ex]=(porEx[x.ex]||0)+1;});
    filas=rt.ejercicios.slice(0,4).map(function(ej){
      const tot=Math.max(1,+ej.series||3),n=Math.min(tot,porEx[ej.ex]||0);
      return '<div class="exrow"><span class="nm">'+esc(ej.ex)+'</span><span class="dots">'+
        Array.from({length:tot},function(_,i){return '<span class="gdot'+(i<n?' on':'')+'"></span>';}).join('')+
        '</span></div>';}).join('');
    pie=hechas.length+' de '+sa.plan+' series';
  }else if(c.sets.length){
    sub='hoy · '+c.sets.length+' serie'+(c.sets.length===1?'':'s');
    const porEx={};c.sets.forEach(function(x){porEx[x.ex]=(porEx[x.ex]||0)+1;});
    filas=Object.keys(porEx).slice(0,4).map(function(nm){
      return '<div class="exrow"><span class="nm">'+esc(nm)+'</span><span class="dots">'+
        Array.from({length:porEx[nm]},function(){return '<span class="gdot on"></span>';}).join('')+
        '</span></div>';}).join('');
    pie=volumenDe(c.sel).toLocaleString('es-ES')+' kg de volumen';
  }else{
    sub='hoy · nada apuntado';
    filas='<div class="empty" style="padding:4px 0">Apunta la primera serie y aquí verás cómo va el día.</div>';
  }
  $('#main').innerHTML='<div class="grid">'+
    gymTiraHTML(c.sel)+
    /* el aviso va ANTES de «hoy toca entrenar»: si ese día no vas a poder, leerlo después de una
       tarjeta que te invita a empezar la sesión es leerlo tarde */
    gymAvisoHTML(c.sel)+
    tocaEntrenarHTML(c.sel)+
    '<div class="ghero">'+
      '<div class="ghero-top">'+gymIco('pesa')+
        '<div><div class="ghero-tit">Entrenar</div><div class="ghero-sub">'+esc(sub)+'</div></div>'+
        (pie?'<span class="sp"></span><span class="tag b2">'+esc(pie)+'</span>':'')+'</div>'+
      '<div class="exlist">'+filas+'</div>'+
      (sa
        ? ('<button class="btn p gbig" data-a="gym-panel" data-p="vivo">'+gymIco('pesa','gico sm')+' seguir'+
            (function(){const cc=vivoCampos(sa);
              return cc?(' · '+esc(cc.ej.ex)+' serie '+Math.min(cc.ej.series,cc.ej.hechas+1)):'';})()+'</button>')
        : ('<button class="btn p gbig" data-a="gym-panel" data-p="sesion">'+gymIco('mas','gico sm')+' apuntar serie</button>'))+
      /* antes desde aquí solo se podía seguir la de hoy: para empezar otra o montar una nueva
         había que salir a buscarla */
      /* Las dos puertas de debajo cambian con la sesión, pero SIEMPRE dejan llegar a todas las
         pantallas: con una sesión abierta no se puede empezar otra rutina, y en cambio hacen falta
         «el día» (para corregir una serie o apuntar algo fuera de la rutina) y «Rutinas». */
      '<div class="growtras">'+
        (sa
          ? ('<button class="btn s" data-a="gym-panel" data-p="sesion">'+gymIco('lapiz','gico sm')+' apuntar a mano</button>'+
             '<button class="btn s" data-a="gym-panel" data-p="rutinas">'+gymIco('lista','gico sm')+' tus rutinas</button>')
          : ('<button class="btn s" data-a="gym-panel" data-p="rutinas">'+gymIco('lista','gico sm')+' empezar otra</button>'+
             '<button class="btn s" data-a="gym-nueva">'+gymIco('mas','gico sm')+' montar una nueva</button>'))+
      '</div>'+
    '</div>'+
    gymDescansoHTML()+
    '<div class="gtiles tres">'+
      gymFicha('objetivos','chispa','Objetivos',objetivosS().length||'—',objetivosS().length?'en marcha':'ponte uno')+
      gymFicha('progreso','barras','Progreso',gymDiasMes(),'días este mes')+
      gymFicha('cardio','pulso','Cardio',gymCardioSemana(),'esta semana')+
    '</div></div>';}
function renderGymSesion(){
  const c=gymCtx(),d=c.d,sel=c.sel;
  $('#main').innerHTML='<div class="grid">'+
    gymSubcab('Entrenar',isToday(sel)?'<span class="tag b2">hoy</span>':'')+
    renderSesionActiva()+
    '<div class="card"><h2>'+DAYN[(d.getDay()+6)%7]+' '+d.getDate()+' de '+MONTH_FULL[d.getMonth()]+'</h2>'+
    '<div class="row"><button class="btn s" data-a="gym-prev">‹</button>'+
    '<input type="date" value="'+sel+'" data-a="gym-day" style="width:158px">'+
    '<button class="btn s" data-a="gym-next">›</button>'+
    '<button class="btn s" data-a="gym-today">hoy</button>'+
    '<span class="sp"></span>'+
    '<button class="btn s '+(c.sg.on?'g':'')+'" data-a="gym-seg-hoy" data-key="'+sel+'">'+
      (c.sg.on?'✓':'○')+' segundo entreno</button></div>'+
    '<div class="kpis compact" style="margin-top:9px">'+
      '<div><b>'+c.sets.length+'</b><span>series</span></div>'+
      '<div><b>'+volumenDe(sel).toLocaleString('es-ES')+'</b><span>kg de volumen</span></div>'+
      '<div><b>'+(c.sg.on?(c.sg.tipo||'entreno'):'—')+'</b><span>2º entreno'+(c.sg.hora?' · '+c.sg.hora:'')+'</span></div>'+
    '</div>'+
    (c.sets.length?('<div style="margin-top:9px">'+c.sets.map(function(x){
      return '<div class="frow"><span><span class="fn">'+esc(x.ex)+'</span>'+
        (x.nota?'<span class="fm"> · '+esc(x.nota)+'</span>':'')+'</span>'+
        '<span class="mini chipnum">'+(x.kg?x.kg+' kg × ':'')+x.reps+' rep'+(x.rpe?(' · RPE '+x.rpe):'')+'</span>'+
        '<span><button class="btn d s" data-a="set-del" data-id="'+x.id+'" title="borrar serie">×</button></span></div>';}).join('')+'</div>')
      :'<div class="empty" style="margin-top:9px">Nada apuntado este día. Monta la serie aquí abajo o pasa una rutina desde «Rutinas».</div>')+
    '<div class="fgrid c3 tight" style="margin-top:12px;border-top:1px solid var(--line);padding-top:11px">'+
      '<label class="fld" style="grid-column:1/-1">ejercicio<input id="setEx" list="gymLista" placeholder="Sentadilla" value="'+esc(ui.gymEx||'')+'">'+
      '<datalist id="gymLista">'+c.opcEx+'</datalist></label>'+
      '<label class="fld">kg<input id="setKg" type="number" min="0" step="2.5" value="0"></label>'+
      '<label class="fld">reps<input id="setReps" type="number" min="1" max="60" value="8"></label>'+
      '<label class="fld">RPE<input id="setRpe" type="number" min="1" max="10" step="0.5" value=""></label>'+
      '<label class="fld" style="grid-column:1/-1">nota<input id="setNota" placeholder="barras, ritmo, rodilla…"></label>'+
    '</div>'+
    '<div class="row" style="margin-top:11px"><button class="btn p gbig" data-a="gym-set" data-key="'+sel+'">apuntar serie</button></div>'+
    '</div></div>';}
/* ===================== objetivos: el número Y EL CAMINO =====================
   Hasta ahora no existía el concepto: ni «100 kg en banca» ni «tres días por semana». Y un objetivo
   sin camino es un cartel: cada uno dice dónde estás, cuánto falta, a qué ritmo vas y qué toca esta
   semana. La fecha sale de TU ritmo de las últimas 8 semanas, y lo dice: no es una promesa. */
const OBJ_TIPOS=['fuerza','constancia','tiempo'];
function objetivosS(){
  const g=gymS();
  if(!Array.isArray(g.objetivos))g.objetivos=[];
  return g.objetivos;}
function nuevoObjetivo(tipo,ex,meta){
  const t=OBJ_TIPOS.indexOf(tipo)>=0?tipo:'fuerza';
  const o={id:uid('obj'),tipo:t,ex:String(ex||'').slice(0,60),meta:+meta||0,desde:iso(new Date())};
  if(t==='fuerza'&&!o.ex)return 'dile de qué ejercicio es el objetivo';
  if(!(o.meta>0))return 'pon un número al objetivo';
  objetivosS().push(o);save();render();
  return 'objetivo puesto: '+objetivoTitulo(o);}
function delObjetivo(id){
  const l=objetivosS(),i=l.findIndex(function(x){return x.id===id;});
  if(i<0)return 'ese objetivo ya no está';
  const nm=objetivoTitulo(l[i]);l.splice(i,1);save();render();
  return 'objetivo quitado: '+nm;}
function objetivoTitulo(o){
  if(o.tipo==='fuerza')return o.ex+' · '+fmtKg(o.meta)+' kg';
  if(o.tipo==='constancia')return 'Entrenar '+o.meta+' día'+(o.meta===1?'':'s')+' por semana';
  return '10 km por debajo de '+Math.floor(o.meta)+' min';}
function semanasAtras(n){
  const l=mondayOf(new Date());
  return iso(addDays(l,-7*n));}
function pesoMaximo(nombre,hasta){
  /* el peso de verdad que has puesto en la barra, que es lo que mide un objetivo de fuerza */
  const xs=(gymIdx().byEx[nombre]||[]).filter(function(x){return !hasta||x.fecha<=hasta;});
  return xs.reduce(function(a,x){return Math.max(a,+x.kg||0);},0);}
function fuerzaEstimada(nombre,desde,hasta){
  /* la mejor serie estimada (Epley) del tramo: no hace falta probar un máximo */
  const xs=(gymIdx().byEx[nombre]||[]).filter(function(x){
    return (!desde||x.fecha>=desde)&&(!hasta||x.fecha<=hasta);});
  let mejor=0;
  xs.forEach(function(x){const r=Math.round((+x.kg||0)*(1+(+x.reps||0)/30)*10)/10;if(r>mejor)mejor=r;});
  return mejor;}
function diasEntrenadosSemana(lunKey){
  const g=gymS(),dias={};
  for(let i=0;i<7;i++){const k=iso(addDays(parseDate(lunKey),i));
    if(setsDe(k).length||g.cardio.some(function(x){return x.fecha===k;}))dias[k]=1;}
  return Object.keys(dias);}
function rachaConstancia(meta){
  /* semanas seguidas, hacia atrás desde la anterior, en las que llegaste a tu número */
  let n=0;
  for(let i=1;i<=52;i++){
    const lun=semanasAtras(i);
    if(diasEntrenadosSemana(lun).length>=meta)n++;else break;}
  return n;}
function mejorCarrera(desde){
  /* el mejor ritmo (min/km) de las carreras de al menos 3 km */
  const g=gymS();
  let mejor=null;
  g.cardio.forEach(function(x){
    if(desde&&x.fecha<desde)return;
    if(!/carrera|corr/i.test(x.tipo||''))return;
    const km=+x.distanciaKm||0,min=+x.duracionMin||0;
    if(km<3||min<=0)return;
    const r=min/km;
    if(!mejor||r<mejor.ritmo)mejor={ritmo:r,km:km,min:min,fecha:x.fecha};});
  return mejor;}
function ritmoTxt(minPorKm){
  if(!minPorKm)return '—';
  const m=Math.floor(minPorKm),sg=Math.round((minPorKm-m)*60);
  return m+':'+String(sg).padStart(2,'0');}
function objetivoEstado(o){
  /* dónde estás, cuánto falta, a qué ritmo vas y para cuándo llegas A TU RITMO */
  const hace8=semanasAtras(8);
  if(o.tipo==='fuerza'){
    /* «Banca 100 kg» es poner 100 kg en la barra, no un 1RM estimado. Contra el estimado la app
       diría «104,5 de 100, conseguido» sin que hayas puesto nunca más de 82,5: mentira. El
       estimado se enseña al lado, que para eso sirve, y la curva de Progreso sí va con él. */
    const hoy=pesoMaximo(o.ex),antes=pesoMaximo(o.ex,hace8);
    const av=(hoy&&antes)?Math.round((hoy-antes)*10)/10:0;
    const falta=Math.round((o.meta-hoy)*10)/10;
    return {tipo:'fuerza',hoy:hoy,meta:o.meta,pct:o.meta>0?Math.max(0,Math.min(1,hoy/o.meta)):0,
      av:av,falta:falta,sem:(av>0&&falta>0)?Math.ceil(falta/(av/8)):null,
      rm:fuerzaEstimada(o.ex),uni:'kg',hayDatos:hoy>0};}
  if(o.tipo==='constancia'){
    const lun=iso(mondayOf(new Date())),hechos=diasEntrenadosSemana(lun).length;
    return {tipo:'constancia',hoy:hechos,meta:o.meta,pct:o.meta>0?Math.max(0,Math.min(1,hechos/o.meta)):0,
      racha:rachaConstancia(o.meta),falta:Math.max(0,o.meta-hechos),hayDatos:true};}
  const hoy=mejorCarrera(),antes=mejorCarrera(hace8);
  const minAhora=hoy?hoy.ritmo*10:0;                      /* 10 km al ritmo actual */
  const av=(hoy&&antes&&antes.ritmo>hoy.ritmo)?Math.round((antes.ritmo-hoy.ritmo)*10*10)/10:0;
  const falta=minAhora?Math.round((minAhora-o.meta)*10)/10:0;
  return {tipo:'tiempo',hoy:minAhora,meta:o.meta,ritmo:hoy?hoy.ritmo:0,
    pct:minAhora>0?Math.max(0,Math.min(1,o.meta/minAhora)):0,
    av:av,falta:falta,sem:(av>0&&falta>0)?Math.ceil(falta/(av/8)):null,hayDatos:!!hoy};}
function cuandoLlegasTxt(sem){
  if(sem==null)return '';
  if(sem<=0)return 'ya lo tienes';
  const d=addDays(new Date(),sem*7);
  const q=d.getDate()<=10?'principios':(d.getDate()<=20?'mediados':'finales');
  return 'a '+q+' de '+MONTH_FULL[d.getMonth()];}
function objetivoConsejoTxt(o,e){
  if(o.tipo==='fuerza'){
    if(!e.hayDatos)return 'Apunta alguna serie de «'+o.ex+'» y aquí saldrá a qué ritmo vas.';
    if(e.falta<=0)return '¡Conseguido! Ponle un número nuevo.';
    const pr=progresionDe(o.ex,0,8,iso(new Date()));
    return (e.sem!=null?('A este ritmo llegas '+cuandoLlegasTxt(e.sem)+'. '):'Todavía no hay ritmo que medir: sigue apuntando. ')+
      (pr.cl!=='nuevo'?('Esta semana toca '+fmtKg(pr.kg)+' kg.'):'');}
  if(o.tipo==='constancia'){
    if(e.falta<=0)return 'Semana cerrada. Racha de '+e.racha+' semana'+(e.racha===1?'':'s')+'.';
    const ch=gymChoque(iso(new Date()));
    return 'Te queda'+(e.falta===1?'':'n')+' '+e.falta+'. '+
      (ch&&ch.a?('El '+fechaCortaTxt(ch.a)+' es tu mejor hueco: el '+fechaCortaTxt(ch.key)+' tienes '+ch.malo+'.')
        :'Mira la tira de la semana para elegir el hueco.');}
  if(!e.hayDatos)return 'Apunta una carrera de 3 km o más y aquí saldrá tu ritmo.';
  if(e.falta<=0)return '¡Conseguido! Ponle un tiempo nuevo.';
  return 'Vas a '+ritmoTxt(e.ritmo)+' /km, que son '+fmt(Math.round(e.hoy))+' min en 10 km. '+
    (e.sem!=null?('A este ritmo llegas '+cuandoLlegasTxt(e.sem)+'.'):'Corre alguna más y podré decirte para cuándo.');}
function rutinaResumen(rt){
  const n=rt.ejercicios.length,ser=rt.ejercicios.reduce(function(a,e){return a+Math.max(1,+e.series||3);},0);
  return n+' ejercicio'+(n===1?'':'s')+' · '+ser+' serie'+(ser===1?'':'s');}
function rutinaDiasTxt(rt){
  const d=rutinaDias(rt);
  if(!d.length)return rt.notas?esc(rt.notas):'sin días asignados';
  return d.map(function(id){const sh=shiftById(id);return esc((sh&&sh.name)||'');}).filter(Boolean).join(', ');}
function renderGymRutinas(){
  /* Una tarjeta por rutina que se lee de un vistazo, y editar detrás de «editar». Antes esto era
     3 256 px —3,56 pantallas— con 68 botones y 68 campos: una tabla de nueve columnas por
     ejercicio, con «peso objetivo» y «descanso» incluidos, que no se usan. */
  const c=gymCtx(),g=c.g,hoyRt=rutinaDeFecha(c.sel);
  const tarjetas=g.rutinas.map(function(rt){
    const h=historialRutina(rt.id),regs=regionesDeRutina(rt.id);
    const chips=Array.from(regs).slice(0,5).map(function(r){
      return '<span class="rmus">'+esc(MREG_LABEL[r]||r)+'</span>';}).join('');
    const cuando=h.ultima?('última vez hace '+h.diasDesde+' día'+(h.diasDesde===1?'':'s')):'nunca la has hecho';
    return '<div class="card rcard'+(hoyRt&&hoyRt.id===rt.id?' hoy':'')+'">'+
      '<div class="rcab"><b>'+esc(rt.nombre)+'</b>'+
        (hoyRt&&hoyRt.id===rt.id?'<span class="tag b2">HOY</span>':'')+'</div>'+
      '<div class="rsub">'+rutinaResumen(rt)+' · '+rutinaDiasTxt(rt)+'</div>'+
      (chips?('<div class="rmusr">'+chips+'</div>'):'<div class="rmusr"><span class="mini">añade ejercicios para ver qué trabaja</span></div>')+
      '<div class="rbot">'+
        '<button class="btn p" data-a="ses-empezar" data-id="'+esc(rt.id)+'" data-key="'+esc(c.sel)+'">empezar</button>'+
        '<button class="btn s" data-a="rt-editar" data-id="'+esc(rt.id)+'">editar</button>'+
      '</div>'+
      '<div class="rpie">'+esc(cuando)+(h.esteMes?(' · '+h.esteMes+' este mes'):'')+'</div>'+
      '</div>';}).join('');
  $('#main').innerHTML='<div class="grid">'+
    gymSubcab('Rutinas','<button class="btn s" data-a="rt-nueva-rapida">+ nueva</button>')+
    (g.rutinas.length?tarjetas:'<div class="card"><div class="empty">Todavía no tienes ninguna rutina. Crea una y añádele ejercicios.</div></div>')+
    '<div class="card"><h2>+ Nueva rutina</h2>'+
    '<div class="row"><label class="fld" style="flex:1 1 200px">nombre<input id="rtNombreNueva" placeholder="Empuje, Tirón, Pierna…"></label>'+
    '<button class="btn p" data-a="rt-nueva">crear rutina</button></div></div>'+
    renderSegundoCard(c,g)+
    '</div>';}
function renderSegundoCard(c,g){
  const d=c.d;
  return '<div class="card"><h2>🏊 Segundo entreno</h2>'+
    '<p class="note">Junto al día de fuerza, un segundo día para piscina o entreno normal. '+
    'Se marca solo en los días que elijas; en guardias, salientes y vacaciones nunca se pone.</p>'+
    '<div class="row"><span class="mini">entre semana, qué días:</span>'+
      GYM_DIAS.map(function(nm,ix){const on=g.segundo.dias.indexOf(ix)>=0;
        return '<button class="btn s '+(on?'p':'')+'" data-a="gym-seg-day" data-day="'+ix+'">'+nm+'</button>';}).join('')+'</div>'+
    '<div class="fgrid c3 tight" style="margin-top:9px">'+
      '<label class="fld">qué haces<select id="segTipo" data-a="gym-seg-tipo">'+
        ['piscina','entreno normal','movilidad','cardio suave','padel o frontón'].map(function(x){
          return '<option value="'+x+'" '+(g.segundo.tipo===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></label>'+
      '<label class="fld">a las<input type="time" id="segHora" value="'+esc(g.segundo.hora||'')+'" data-a="gym-seg-hora"></label>'+
      '<label class="fld" style="justify-content:flex-end">'+
        '<button class="btn s '+(g.segundo.on?'g':'')+'" data-a="gym-seg-on">'+(g.segundo.on?'✓':'○')+
        ' activado</button></label></div>'+
    '<p class="mini" style="margin-top:9px">para el '+DAYN[(d.getDay()+6)%7]+' '+d.getDate()+': '+
      (c.sg.on?('sí, '+(c.sg.tipo||'entreno')+' a las '+(c.sg.hora||'—')):(c.sg.porSemana?'ese día toca otra cosa':'sin segundo entreno'))+
      ' <button class="btn s" data-a="gym-seg-hoy" data-key="'+c.sel+'">cambiar</button></p>'+
    '</div>';}
/* ===================== evolución: lo que se nota al tercer mes =====================
   Volumen semana a semana, descarga cuando toca, estancamiento por ejercicio con un cambio
   sugerido, y el cruce con lo que la app ya sabe: guardias, sueño y proteína. */
function volumenSemanal(n){
  const out=[];
  for(let i=(n||8)-1;i>=0;i--){
    const lun=semanasAtras(i),dom=iso(addDays(parseDate(lun),6));
    let vol=0,series=0;
    gymS().registro.forEach(function(x){
      if(x.fecha<lun||x.fecha>dom)return;
      vol+=(+x.kg||0)*(+x.reps||0);series++;});
    out.push({lun:lun,sem:i,vol:Math.round(vol),series:series});}
  return out;}
function tocaDescarga(){
  /* tres semanas seguidas subiendo volumen y sin bajar: toca aflojar una. No es una regla sagrada,
     es lo que hace todo el mundo que lleva años: cada 4-6 semanas una semana suave. */
  const v=volumenSemanal(6).filter(function(x){return x.sem>0;});   /* sin la semana en curso */
  if(v.length<4)return null;
  const u=v.slice(-4);
  const subiendo=u[1].vol>u[0].vol&&u[2].vol>u[1].vol&&u[3].vol>u[2].vol;
  if(!subiendo||!u[3].vol)return null;
  return {semanas:4,vol:u[3].vol,sug:Math.round(u[3].vol*0.6)};}
function estancados(){
  /* un ejercicio está atascado si llevas 3 sesiones o más sin subir de peso ni de repeticiones */
  const g=gymS(),out=[];
  Object.keys(gymIdx().byEx).forEach(function(ex){
    const dias=diasDeEjercicio(ex);
    if(dias.length<3)return;
    const tres=dias.slice(0,3).map(function(f){
      const d=seriesDeDia(ex,f);
      return {kg:d.reduce(function(a,x){return Math.max(a,+x.kg||0);},0),
        reps:d.reduce(function(a,x){return Math.max(a,+x.reps||0);},0)};});
    const igual=tres.every(function(t){return t.kg===tres[0].kg;});
    const sinReps=tres.every(function(t){return t.reps<=tres[0].reps;});
    if(igual&&sinReps&&tres[0].kg>0)out.push({ex:ex,kg:tres[0].kg,veces:3,desde:dias[2]});});
  return out;}
function cambioSugerido(ex){
  /* otro ejercicio de tu biblioteca que toque los mismos músculos: cambiar el estímulo suele
     desatascar más rápido que insistir con el mismo movimiento */
  const g=gymS(),regs=regionesDeEjercicio({ex:ex});
  if(!regs.size||!g.biblioteca.length)return '';
  let mejor='',mejorN=0;
  g.biblioteca.forEach(function(x){
    if(x.n===ex)return;
    const r2=regionesDeEjercicio({ex:x.n,tg:x.tg,msc:x.msc,c:x.c});
    let n=0;r2.forEach(function(r){if(regs.has(r))n++;});
    /* con que comparta un grupo grande vale: pedir dos dejaba fuera el press inclinado como
       alternativa al press banca, que es justo el cambio que uno haría */
    if(n>mejorN&&n>=1){mejorN=n;mejor=x.n;}});
  return mejor;}
function cruceEntreno(){
  /* lo que solo puede decir ESTA app: cómo van las guardias, el sueño y la proteína alrededor
     de lo que entrenas. Nada de esto lo sabe una app de gimnasio. */
  const hoy=iso(new Date()),lun=iso(mondayOf(new Date())),out=[];
  /* guardias de la semana que viene, que es lo que decide cuándo puedes entrenar */
  let guardias=0,libres=0;
  for(let i=0;i<7;i++){
    const k=iso(addDays(parseDate(lun),7+i));
    if(gymDiaMalo(k))guardias++;else libres++;}
  if(guardias)out.push({cl:'aviso',txt:'La semana que viene tienes '+guardias+' día'+(guardias===1?'':'s')+
    ' de guardia o saliente: te quedan '+libres+' huecos para entrenar.'});
  /* sueño: entrenar con menos de tu mínimo dos días seguidos es pedir peras al olmo */
  try{
    let cortos=0;
    for(let i=0;i<7;i++){const k=iso(addDays(parseDate(lun),i));
      if(k>hoy)break;
      const sl=sleepOf(k);
      if(sl&&sl.h!=null&&sl.h<suenoCfg().min-0.5)cortos++;}
    if(cortos>=3)out.push({cl:'aviso',txt:'Llevas '+cortos+' días esta semana durmiendo menos de tu mínimo. '+
      'Si una sesión sale floja, empieza por ahí antes que por el peso.'});
  }catch(e){}
  /* proteína: sin ella el entreno no cuaja */
  try{
    const ob=(store.food&&store.food.objetivo)||{};
    if(ob.prot>0){
      let dias=0,ok=0;
      for(let i=0;i<7;i++){const k=iso(addDays(parseDate(lun),i));
        if(k>hoy)break;
        const t=foodTotals(k);
        if(t&&t.kcal>0){dias++;if(t.prot>=ob.prot*0.9)ok++;}}
      if(dias>=3&&ok<Math.ceil(dias*0.6))
        out.push({cl:'aviso',txt:'Solo '+ok+' de '+dias+' días has llegado a tu proteína. '+
          'El músculo se hace con lo que comes, no solo con lo que levantas.'});}
  }catch(e){}
  return out;}
function evolucionHTML(){
  const v=volumenSemanal(8),max=v.reduce(function(a,x){return Math.max(a,x.vol);},1);
  const desc=tocaDescarga(),est=estancados(),cru=cruceEntreno();
  const barras='<div class="fb2">'+v.map(function(x){
      const alt=Math.max(4,Math.round(x.vol/max*100));
      return '<div class="fb2c" title="'+esc(x.lun)+' · '+x.vol.toLocaleString('es-ES')+' kg">'+
        '<i style="height:'+alt+'%"'+(x.sem===0?' class="ahora"':'')+'></i>'+
        '<span>'+(x.sem===0?'esta':('−'+x.sem))+'</span></div>';}).join('')+'</div>';
  const avisos=[];
  if(desc)avisos.push({cl:'aviso',txt:'Llevas '+desc.semanas+' semanas subiendo volumen sin aflojar. '+
    'Toca una semana de descarga: unos '+desc.sug.toLocaleString('es-ES')+' kg, un 60 % de la última.'});
  est.slice(0,2).forEach(function(x){
    const sug=cambioSugerido(x.ex);
    avisos.push({cl:'aviso',txt:'«'+x.ex+'» lleva 3 sesiones clavado en '+fmtKg(x.kg)+' kg. '+
      (sug?('Prueba a cambiarlo por «'+sug+'» unas semanas: mismo músculo, otro estímulo.')
          :'Baja un 10 % y vuelve a subir, o cámbialo por otro del mismo músculo.')});});
  cru.forEach(function(x){avisos.push(x);});
  return barras+
    '<div class="curvapie"><span>8 semanas</span><b>'+v[v.length-1].vol.toLocaleString('es-ES')+' kg</b>'+
    '<span>esta semana</span></div>'+
    (avisos.length?('<div class="evav">'+avisos.map(function(a){
      return '<div class="ev"><span class="p"></span><span>'+esc(a.txt)+'</span></div>';}).join('')+'</div>')
      :'<p class="mini" style="margin-top:8px">Nada que avisar: el volumen sube sin dispararse y no hay ejercicios atascados.</p>');}
function objetivoCardHTML(o){
  const e=objetivoEstado(o),pct=Math.round(e.pct*100);
  const consejo=objetivoConsejoTxt(o,e);
  let cifra='',sub='',lado='';
  if(o.tipo==='fuerza'){
    cifra=fmtKg(e.hoy||0);
    sub='de '+fmtKg(o.meta)+' kg'+(e.rm?(' · 1RM ~'+fmtKg(e.rm)):'');
    lado=e.av>0?('+'+fmtKg(e.av)+' en 8 sem.'):(e.hayDatos?'sin cambio en 8 sem.':'');}
  else if(o.tipo==='constancia'){
    cifra=e.hoy+' de '+o.meta;sub='esta semana';
    lado=e.racha?('racha de '+e.racha+' sem.'):'';}
  else{
    cifra=e.hayDatos?ritmoTxt(e.ritmo):'—';sub=e.hayDatos?('/km · '+fmt(Math.round(e.hoy))+' min en 10 km'):'sin carreras';
    lado=e.av>0?('−'+fmt(e.av)+' min en 8 sem.'):'';}
  return '<div class="card obj '+o.tipo+(e.falta<=0&&e.hayDatos?' hecho':'')+'">'+
    '<div class="objcab"><b>'+esc(objetivoTitulo(o))+'</b>'+
      '<span class="e">'+(o.tipo==='fuerza'?'EN LA BARRA':(o.tipo==='constancia'?'DÍAS':'CARRERA'))+'</span>'+
      '<button class="btn d s" data-a="obj-del" data-id="'+esc(o.id)+'" aria-label="quitar objetivo">×</button></div>'+
    '<div class="objnum"><b>'+esc(cifra)+'</b><span>'+esc(sub)+'</span>'+
      (lado?('<i>'+esc(lado)+'</i>'):'')+'</div>'+
    '<div class="objbar"><i style="width:'+pct+'%"></i></div>'+
    (consejo?('<div class="objvia">'+gymIco('flecha','gico sm')+'<span>'+esc(consejo)+'</span></div>'):'')+
    '</div>';}
function volumenPorMusculo(desde,hasta){
  /* el volumen repartido por grupo grande: es lo que enseña si llevas semanas descuidando la
     pierna sin darte cuenta. Una serie que toca dos grupos suma en los dos: no se reparte, porque
     no sabemos cuánto va a cada uno y repartir a medias sería inventárselo. */
  const g=gymS(),out={};
  MREGIONES.forEach(function(r){out[r]=0;});
  g.registro.forEach(function(x){
    if(desde&&x.fecha<desde)return;
    if(hasta&&x.fecha>hasta)return;
    const v=(+x.kg||0)*(+x.reps||0);
    if(!v)return;
    regionesDeEjercicio(x).forEach(function(r){if(out[r]!=null)out[r]+=v;});});
  return out;}
function volumenMusculoHTML(){
  const desde=semanasAtras(4);
  const v=volumenPorMusculo(desde,null);
  const filas=MREGIONES.map(function(r){return {r:r,v:Math.round(v[r])};})
    .filter(function(x){return x.v>0;}).sort(function(a,b){return b.v-a.v;});
  if(!filas.length)return '<div class="empty">Apunta unas cuantas series y aquí se ve cómo se reparte el trabajo.</div>';
  const max=filas[0].v;
  const flojos=MREGIONES.filter(function(r){return !v[r];}).map(function(r){return MREG_LABEL[r]||r;});
  return filas.map(function(x){
    return '<div class="fb"><div class="fbt"><span>'+esc(MREG_LABEL[x.r]||x.r)+'</span>'+
      '<b>'+x.v.toLocaleString('es-ES')+' kg</b></div>'+
      '<div class="fbar"><i style="width:'+Math.round(x.v/max*100)+'%"></i></div></div>';}).join('')+
    (flojos.length?('<p class="mini" style="margin-top:7px;color:var(--warn)">En cuatro semanas no has tocado: '+
      esc(flojos.join(', '))+'.</p>'):'<p class="mini" style="margin-top:7px">En cuatro semanas has tocado los diez grupos.</p>');}
function cardioProgresoHTML(){
  /* el cardio con ritmo y mejoría, que es donde se ve de verdad si vas a mejor */
  const g=gymS();
  const carreras=g.cardio.filter(function(x){return /carrera|corr/i.test(x.tipo||'')&&(+x.distanciaKm||0)>=1&&(+x.duracionMin||0)>0;})
    .sort(function(a,b){return (a.fecha||'').localeCompare(b.fecha||'');});
  if(carreras.length<2)return '<div class="empty">Con dos carreras apuntadas (km y minutos) aquí sale tu ritmo y si mejoras.</div>';
  const ritmos=carreras.map(function(x){return {k:x.fecha,r:(+x.duracionMin)/(+x.distanciaKm),km:+x.distanciaKm};});
  const mejor=ritmos.reduce(function(a,x){return x.r<a.r?x:a;},ritmos[0]);
  const peor=ritmos.reduce(function(a,x){return x.r>a.r?x:a;},ritmos[0]);
  const pri=ritmos[0],ult=ritmos[ritmos.length-1];
  const dif=Math.round((pri.r-ult.r)*60);
  const rango=Math.max(0.1,peor.r-mejor.r);
  return '<div class="fb2">'+ritmos.slice(-12).map(function(x){
      const alt=Math.max(8,Math.round((peor.r-x.r)/rango*100));
      return '<div class="fb2c" title="'+esc(x.k)+' · '+ritmoTxt(x.r)+' /km">'+
        '<i style="height:'+alt+'%"></i><span>'+esc(x.k.slice(8))+'</span></div>';}).join('')+'</div>'+
    '<div class="curvapie"><span>mejor '+ritmoTxt(mejor.r)+' /km</span>'+
    '<b class="'+(dif>0?'sube':(dif<0?'baja':''))+'">'+(dif>0?('−'+dif+' s/km'):(dif<0?('+'+(-dif)+' s/km'):'igual'))+'</b>'+
    '<span>ahora '+ritmoTxt(ult.r)+' /km</span></div>'+
    '<p class="mini" style="margin-top:6px">barra más alta = más rápido. '+carreras.length+' carrera'+(carreras.length===1?'':'s')+' apuntadas.</p>';}
function renderGymObjetivos(){
  /* LOS OBJETIVOS CON SU CAMINO. Un número solo es un cartel: aquí cada uno dice dónde estás,
     cuánto falta, a qué ritmo vas y para cuándo llegas A TU RITMO —el de tus últimas 8 semanas—,
     dicho como estimación y no como promesa. */
  const l=objetivosS();
  const tipo=ui.objTipo||'fuerza';
  const exs=Object.keys(gymIdx().byEx).sort();
  $('#main').innerHTML='<div class="grid">'+
    gymSubcab('Objetivos')+
    (l.length?l.map(objetivoCardHTML).join('')
      :'<div class="card"><div class="empty">Todavía no tienes objetivos. Ponte uno abajo: un número y la app te dice el camino.</div></div>')+
    '<div class="card"><h2>+ Nuevo objetivo</h2>'+
    '<div class="row">'+
      OBJ_TIPOS.map(function(t){
        return '<button class="btn s '+(tipo===t?'p':'')+'" data-a="obj-tipo" data-t="'+t+'">'+
          (t==='fuerza'?'fuerza':(t==='constancia'?'constancia':'tiempo'))+'</button>';}).join('')+
    '</div>'+
    '<div class="fgrid c3 tight" style="margin-top:10px">'+
      (tipo==='fuerza'?('<label class="fld" style="grid-column:1/-1">ejercicio'+
        '<input id="objEx" list="objLista" placeholder="Press banca">'+
        '<datalist id="objLista">'+exs.map(function(n){return '<option value="'+esc(n)+'"></option>';}).join('')+'</datalist></label>'):'')+
      '<label class="fld">'+(tipo==='fuerza'?'kg a levantar':(tipo==='constancia'?'días por semana':'minutos en 10 km'))+
        '<input id="objMeta" type="number" min="1" max="'+(tipo==='constancia'?'7':'500')+'" step="'+(tipo==='fuerza'?'2.5':'1')+'"></label>'+
      '<label class="fld" style="justify-content:flex-end">'+
        '<button class="btn p" data-a="obj-add" data-t="'+tipo+'">poner objetivo</button></label>'+
    '</div>'+
    '<p class="mini" style="margin-top:8px">La fecha que te diga sale de tu ritmo de las últimas 8 semanas. '+
      'Es una estimación con lo que llevas hecho, no una promesa.</p>'+
    '</div></div>';}
function curvaFuerzaHTML(nombre){
  /* la curva de fuerza estimada (Epley) semana a semana: no hace falta probar un máximo */
  const puntos=[];
  for(let i=11;i>=0;i--){
    const lun=semanasAtras(i),dom=iso(addDays(parseDate(lun),6));
    puntos.push({k:lun,v:fuerzaEstimada(nombre,lun,dom)});}
  const con=puntos.filter(function(p){return p.v>0;});
  if(con.length<2)return '<div class="empty">Apunta '+esc(nombre)+' un par de semanas y aquí sale la curva.</div>';
  const max=con.reduce(function(a,p){return Math.max(a,p.v);},0);
  const min=con.reduce(function(a,p){return Math.min(a,p.v);},max);
  const rango=Math.max(1,max-min);
  const W=280,H=68;
  const xs=puntos.map(function(p,i){return 4+i*(W-8)/11;});
  const ys=puntos.map(function(p){return p.v>0?(H-6-((p.v-min)/rango)*(H-16)):null;});
  let d='',prev=false;
  puntos.forEach(function(p,i){
    if(ys[i]==null){prev=false;return;}
    d+=(prev?' L':' M')+xs[i].toFixed(1)+' '+ys[i].toFixed(1);prev=true;});
  const bolas=puntos.map(function(p,i){
    return ys[i]==null?'':('<circle cx="'+xs[i].toFixed(1)+'" cy="'+ys[i].toFixed(1)+'" r="2.6" class="cp"></circle>');}).join('');
  const ult=con[con.length-1],pri=con[0];
  const dif=Math.round((ult.v-pri.v)*10)/10;
  return '<svg class="curva" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="fuerza estimada de '+esc(nombre)+'">'+
    '<path d="'+d.trim()+'" class="cl"></path>'+bolas+'</svg>'+
    '<div class="curvapie"><span>'+fmtKg(pri.v)+' kg hace '+(11)+' semanas</span>'+
    '<b class="'+(dif>0?'sube':(dif<0?'baja':''))+'">'+(dif>0?'+':'')+fmtKg(dif)+' kg</b>'+
    '<span>'+fmtKg(ult.v)+' kg ahora</span></div>';}
function renderGymRutEdit(){
  /* EL CONSTRUCTOR: buscador sobre tu biblioteca, series con −/+ sin teclado, y «cómo queda»
     debajo mientras la montas. Sin «peso objetivo» ni «descanso», que no los usas. */
  const c=gymCtx(),g=c.g;
  const rt=g.rutinas.filter(function(r){return r.id===ui.gymRutSel;})[0];
  if(!rt){ui.gymPanel='rutinas';return renderGymRutinas();}
  const regs=regionesDeRutina(rt.id);
  const sinTocar=MREGIONES.filter(function(r){return !regs.has(r);});
  const sinMusc=ejerciciosSinMusculo(rt.id);
  const filas=rt.ejercicios.length?rt.ejercicios.map(function(ej,ix){
    const m=Array.from(regionesDeEjercicio(ej)).map(function(r){return MREG_LABEL[r]||r;}).join(' · ');
    return '<div class="refila">'+
      '<div class="n"><b>'+esc(ej.ex)+'</b><span>'+esc(m||'sin músculo reconocido')+'</span></div>'+
      '<div class="ser">'+
        '<button class="btn s" data-a="rt-ser" data-id="'+esc(rt.id)+'" data-ix="'+ix+'" data-d="-1" aria-label="menos series">−</button>'+
        '<span class="v">'+(+ej.series||3)+'×'+(+ej.reps||8)+'</span>'+
        '<button class="btn s" data-a="rt-ser" data-id="'+esc(rt.id)+'" data-ix="'+ix+'" data-d="1" aria-label="más series">+</button>'+
      '</div>'+
      '<button class="btn d s rex" data-a="rt-del" data-id="'+esc(rt.id)+'" data-ix="'+ix+'" aria-label="quitar '+esc(ej.ex)+'">×</button>'+
      '</div>';}).join('')
    :'<div class="empty" style="padding:14px 12px">Sin ejercicios todavía. Búscalos abajo y añádelos de un toque.</div>';
  const res=c.hay?c.res.slice(0,8):[];
  const sug=res.map(function(x){
    const m=Array.from(regionesDeEjercicio({ex:x.n,tg:x.tg,msc:x.msc,c:x.c})).map(function(r){return MREG_LABEL[r]||r;}).join(' · ');
    return '<button class="resug" data-a="rt-add-lib" data-id="'+esc(rt.id)+'" data-n="'+esc(x.n)+'">'+
      '<span class="n"><b>'+esc(x.n)+'</b><span>'+esc(m||x.c||'')+'</span></span><span class="mas">+</span></button>';}).join('');
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><button class="btn s volver" data-a="gym-panel" data-p="rutinas">'+
      gymIco('atras','gico sm')+' Rutinas</button>'+
      '<h2 class="subtit">'+esc(rt.nombre)+'</h2>'+
      '<span class="mini">'+rutinaResumen(rt)+'</span></div>'+
    '<div class="card">'+
      '<div class="row"><label class="fld" style="flex:1 1 180px">nombre'+
        '<input value="'+esc(rt.nombre)+'" data-a="rt-nombre" data-id="'+esc(rt.id)+'"></label>'+
        '<label class="fld" style="flex:1 1 180px">notas'+
        '<input value="'+esc(rt.notas||'')+'" data-a="rt-notas" data-id="'+esc(rt.id)+'" placeholder="martes y viernes"></label></div>'+
      '<p class="mini" style="margin:10px 0 4px">Qué días toca</p>'+
      '<div class="chips">'+store.shifts.map(function(sh){
        const on=rutinaDias(rt).indexOf(sh.id)>=0;
        return '<button class="chipx'+(on?' on':'')+'" data-a="rt-dia" data-id="'+esc(rt.id)+'" data-sh="'+esc(sh.id)+'">'+
          esc(sh.icon||'')+' '+esc(sh.name)+'</button>';}).join('')+'</div>'+
    '</div>'+
    '<div class="card relist">'+filas+'</div>'+
    '<div class="card">'+
      '<div class="row"><label class="fld" style="flex:1 1 220px">'+
        (c.hay?('buscar en tus '+g.biblioteca.length.toLocaleString('es-ES')+' ejercicios'):'escribe el ejercicio')+
        '<input id="rtNew-'+esc(rt.id)+'" value="'+esc(c.q)+'" data-a="gym-q" placeholder="sentadilla, press, remo…"></label>'+
        '<button class="btn p" data-a="rt-add" data-id="'+esc(rt.id)+'">añadir</button></div>'+
      /* la biblioteca se llega desde aquí, que es el único sitio donde se usa: para buscar
         ejercicios mientras montas la rutina */
      '<div class="row" style="margin-top:6px"><button class="btn s" data-a="gym-panel" data-p="biblioteca">'+
        gymIco('libro','gico sm')+(c.hay?(' biblioteca · '+g.biblioteca.length.toLocaleString('es-ES')):' importar biblioteca')+'</button></div>'+
      (c.hay?('<div class="row" style="margin-top:7px"><span class="mini">parte del cuerpo:</span>'+
        MREGIONES.map(function(r){
          return '<button class="btn s '+(c.filtroRegion===r?'p':'')+'" data-a="gym-filtro-region" data-r="'+r+'">'+
            esc(MREG_LABEL[r]||r)+'</button>';}).join('')+'</div>'):'')+
      (sug?('<div class="resugs">'+sug+'</div>')
        :(c.hay?'<div class="mini" style="margin-top:9px">Sin resultados: prueba otra palabra.</div>'
              :'<div class="mini" style="margin-top:9px">No tienes la biblioteca importada: escribe el nombre a mano y dale a «añadir».</div>'))+
    '</div>'+
    /* «Cómo queda»: lo que trabajas Y lo que te dejas, que es lo que hay que mirar para decidir si
       a la rutina le falta algo. El muñeco se queda: con datos se ve de un vistazo. */
    '<div class="card">'+
      '<div class="gvh"><span>CÓMO QUEDA</span></div>'+
      '<div class="mdiagram" style="margin-top:9px">'+svgCuerpo(regs)+
        '<div class="mlegend"><b>Trabaja:</b>'+
        (regs.size?Array.from(regs).map(function(r){return '<span class="tag b3">'+esc(MREG_LABEL[r]||r)+'</span>';}).join(' ')
          :'<span class="mini">añade ejercicios abajo y el muñeco se pinta solo</span>')+
        (sinTocar.length&&regs.size?('<div class="msin"><b>Sin tocar:</b> '+
          sinTocar.map(function(r){return '<span class="tag">'+esc(MREG_LABEL[r]||r)+'</span>';}).join(' ')+'</div>'):'')+
        '<p class="mini" style="margin-top:8px">'+esc(recomendacionRutina(regs))+'</p>'+
        (sinMusc.length?('<p class="mini" style="margin-top:4px;color:var(--warn)">No sé qué músculos trabaja: '+
          esc(sinMusc.join(', '))+'. Se cuenta igual en la rutina, solo que no pinta el muñeco.</p>'):'')+
        '</div></div>'+
    '</div>'+
    '<div class="row"><button class="btn d" data-a="rt-borrar" data-id="'+esc(rt.id)+'">eliminar rutina</button>'+
      '<span class="sp"></span>'+
      '<button class="btn p" data-a="gym-panel" data-p="rutinas">listo</button></div>'+
    '</div>';}
function renderGymCardio(){
  $('#main').innerHTML='<div class="grid">'+gymSubcab('Cardio')+renderCardioCard()+'</div>';}
function renderGymProgreso(){
  const c=gymCtx();
  const exs=Object.keys(gymIdx().byEx).sort();
  const sel=(exs.indexOf(ui.objEx)>=0)?ui.objEx:(exs[0]||'');
  $('#main').innerHTML='<div class="grid">'+
    gymSubcab('Progreso')+
    (exs.length?('<div class="card"><h2>Fuerza estimada</h2>'+
      '<p class="note">De tu mejor serie de cada semana (Epley). No hace falta probar un máximo.</p>'+
      '<div class="chips">'+exs.slice(0,12).map(function(n){
        return '<button class="chipx'+(n===sel?' on':'')+'" data-a="obj-ex" data-n="'+esc(n)+'">'+esc(nombreCorto(n))+'</button>';}).join('')+'</div>'+
      '<div style="margin-top:10px">'+curvaFuerzaHTML(sel)+'</div></div>'):'')+
    '<div class="card"><h2>Cómo evoluciona</h2>'+
    '<p class="note">Volumen semana a semana, y lo que la app ve venir cruzando tus guardias, tu sueño y lo que comes.</p>'+
    evolucionHTML()+'</div>'+
    '<div class="card"><h2>Dónde va el trabajo</h2>'+
    '<p class="note">Volumen de las últimas cuatro semanas repartido por grupo muscular.</p>'+
    volumenMusculoHTML()+'</div>'+
    '<div class="card"><h2>Ritmo de carrera</h2>'+cardioProgresoHTML()+'</div>'+
    entrenoHeatmapCard()+
    renderHistorialCard()+
    '<div class="card"><h2>🏆 Tus marcas</h2>'+
    (c.prs.length?('<div style="overflow-x:auto"><table><thead><tr><th>Ejercicio</th><th>más peso</th><th>1RM estimado</th>'+
      '<th>series</th></tr></thead><tbody>'+c.prs.map(function(x){
        return '<tr><td><b>'+esc(x.ex)+'</b></td><td class="chipnum">'+x.p.maxKg+' kg × '+x.p.maxReps+
          '<br><span class="mini">el '+x.p.maxFecha.slice(8)+'/'+x.p.maxFecha.slice(5,7)+'</span></td>'+
          '<td class="chipnum">'+x.p.rm+' kg<span class="mini"> ('+x.p.rmKg+'×'+x.p.rmReps+')</span></td>'+
          '<td class="chipnum">'+x.p.n+'</td></tr>';}).join('')+'</tbody></table></div>'):
      '<div class="empty">sin series apuntadas todavía: en cuanto registres la primera, aquí sale tu progresión</div>')+
    '</div></div>';}
function renderGymBiblioteca(){
  const c=gymCtx(),g=c.g;
  $('#main').innerHTML='<div class="grid">'+
    gymSubcab('Biblioteca',c.hay?'<span class="tag b2">'+g.biblioteca.length.toLocaleString('es-ES')+'</span>':'')+
    '<div class="card">'+
    (c.hay?('<div class="row"><label class="fld" style="flex:1 1 220px">buscar'+
      '<input id="gymQ" value="'+esc(c.q)+'" data-a="gym-q" placeholder="sentadilla, press, lumbar, plank…"></label>'+
      '<span class="mini">'+c.res.length+' resultado(s)'+(c.q?' para «'+esc(c.q)+'»':'')+'</span></div>'+
      '<div class="row" style="margin-top:7px"><span class="mini">tipo:</span>'+
        '<button class="btn s '+(c.filtroTipo==='gimnasio'?'p':'')+'" data-a="gym-filtro-tipo" data-t="gimnasio">gimnasio</button>'+
        '<button class="btn s '+(c.filtroTipo==='calistenia'?'p':'')+'" data-a="gym-filtro-tipo" data-t="calistenia">calistenia</button>'+
      '</div>'+
      '<div class="row" style="margin-top:6px"><span class="mini">parte del cuerpo:</span>'+
        MREGIONES.map(function(r){return '<button class="btn s '+(c.filtroRegion===r?'p':'')+'" data-a="gym-filtro-region" data-r="'+r+'">'+esc(MREG_LABEL[r])+'</button>';}).join('')+
      '</div>'+
      (g.rutinas.length?('<div class="row" style="margin-top:7px"><label class="fld" style="flex:0 0 210px">añadir a la rutina'+
        '<select data-a="gym-rut-sel">'+g.rutinas.map(function(r){return '<option value="'+r.id+'" '+(r.id===ui.gymRutinaSel?'selected':'')+'>'+esc(r.nombre)+'</option>';}).join('')+
        '</select></label></div>'):'')+
      (c.res.length?('<div class="daylist" style="margin-top:8px">'+c.res.map(function(x){
        return '<div class="frow"><span><span class="fn">'+esc(x.n)+'</span>'+
          '<span class="fm">'+esc([x.c,x.eq,x.tg].filter(Boolean).join(' · '))+'</span></span>'+
          '<span class="mini">'+(c.enRutina[x.n]?'en alguna rutina':'')+'</span>'+
          '<span class="row" style="gap:4px"><button class="btn s" data-a="gym-rut" data-n="'+esc(x.n)+'">a la rutina</button>'+
          '<button class="btn s" data-a="gym-set-ex" data-n="'+esc(x.n)+'">apuntar serie</button></span></div>';}).join('')+'</div>')
        :'<div class="empty" style="margin-top:8px">nada con ese nombre: prueba con la palabra en inglés (squats, bench, row…)</div>'))
     :('<p class="note">Los ejercicios de <a href="'+GYM_SITIO+'" target="_blank" rel="noopener">openGym</a>, con su vídeo en el sitio. '+
       'La lista se baja una vez y se queda en el móvil: luego buscas, montas rutinas y apuntas series.</p>'+
       '<div class="row"><button class="btn p" data-a="gym-fetch">importar la biblioteca</button>'+
       '<span class="sp"></span><span class="mini">'+esc(g.fuente||'todavía no la has importado')+'</span></div>'+
       '<details class="dtip" style="margin-top:9px"><summary class="mini">¿no hay forma de bajarla? pégala aquí</summary>'+
       '<textarea id="gymJson" rows="4" placeholder=\'[{"name":"Bench press","category":"chest","equipment":"barbell","target":"pectorals"},…]\'></textarea>'+
       '<div class="row" style="margin-top:6px"><button class="btn s" data-a="gym-paste">usar el pegote</button>'+
       '<span class="mini">también vale el fichero exercises.json del dataset (MIT) de hasaneyldrm</span></div></details>'))+
    '</div>'+
    /* el borrado, plegado y al final: antes estaba por encima de todo lo que se usa a diario */
    '<details class="dtip"><summary class="mini">🧹 borrar cosas del entreno ▾</summary>'+
      '<div class="row" style="margin-top:9px">'+
      (c.hay?'<button class="btn s" data-a="gym-clear">quitar la biblioteca</button>':'')+
      '<button class="btn s" data-a="gym-wipe" data-what="log">las series del registro</button>'+
      '<button class="btn s" data-a="gym-wipe" data-what="rut">las rutinas</button>'+
      '<button class="btn s" data-a="gym-wipe" data-what="seg">el segundo día</button>'+
      '<button class="btn d" data-a="gym-wipe" data-what="all">todo el entreno</button>'+
      '<button class="btn d" data-a="gym-wipe" data-what="todo">todo, con la biblioteca</button>'+
      (ui.gymUndo?'<span class="sp"></span><button class="btn s p" data-a="gym-undo">↩ deshacer el borrado</button>':'')+
      '</div></details>'+
    '</div>';}
function renderGym(){
  const p=ui.gymPanel||'';
  if(ui.gymInforme)return renderGymInforme();
  if(p==='vivo')return renderGymVivo();
  if(p==='cambiar')return renderGymCambiar();
  if(p==='sesion')return renderGymSesion();
  if(p==='objetivos')return renderGymObjetivos();
  if(p==='rutedit')return renderGymRutEdit();
  if(p==='rutinas')return renderGymRutinas();
  if(p==='cardio')return renderGymCardio();
  if(p==='progreso')return renderGymProgreso();
  if(p==='biblioteca')return renderGymBiblioteca();
  return renderGymPortada();}

/* ===================== hábitos ===================== */
function habitosS(){
  if(!store.habitos||typeof store.habitos!=='object')store.habitos={items:[],registro:{}};
  if(!Array.isArray(store.habitos.items))store.habitos.items=[];
  if(!store.habitos.registro||typeof store.habitos.registro!=='object')store.habitos.registro={};
  return store.habitos;
}
function habitoHecho(hid,key){const h=habitosS();return !!(h.registro[key]&&h.registro[key][hid]);}
function toggleHabito(hid,key){
  const h=habitosS();
  if(!h.registro[key])h.registro[key]={};
  if(h.registro[key][hid])delete h.registro[key][hid];else h.registro[key][hid]=true;
  if(!Object.keys(h.registro[key]).length)delete h.registro[key];
  save();
}
function habitosHoyHTML(){
  /* referencia cruzada (informe): un vistazo a los hábitos de hoy desde «Hoy», sin tener que
     entrar en su propia pestaña */
  const hb=habitosS(),hoyDow=new Date().getDay(),hoyKey=iso(new Date());
  const items=hb.items.filter(function(h){return (h.dow||[]).indexOf(hoyDow)>=0;});
  if(!items.length)return '';
  const hechos=items.filter(function(h){return habitoHecho(h.id,hoyKey);}).length;
  return '<div class="card"><h2>✅ Hábitos de hoy<span class="mini" style="margin-left:auto;font-weight:400">'+hechos+'/'+items.length+'</span></h2>'+
    items.map(function(h){
      const on=habitoHecho(h.id,hoyKey);
      return '<label class="row" style="gap:8px;padding:5px 0;cursor:pointer">'+
        '<input type="checkbox" data-a="hab-mark" data-id="'+h.id+'" data-key="'+hoyKey+'" style="width:auto" '+(on?'checked':'')+'>'+
        '<span style="'+(on?'color:var(--ink2);text-decoration:line-through':'')+'">'+esc(h.icono)+' '+esc(h.nombre)+'</span></label>';
    }).join('')+
    '<div class="row" style="margin-top:6px"><button class="btn s" data-a="tab" data-t="habitos">ver todos los hábitos →</button></div></div>';
}
function rachaHabito(hab){
  /* cuenta hacia atrás desde hoy los días que tocan según hab.dow: si hoy toca y aún no está marcado,
     no rompe la racha (el día no ha terminado); el primer día pasado sin marcar sí la corta */
  let n=0,d=new Date();const hoyK=iso(new Date());
  for(let i=0;i<371;i++){
    const dow=d.getDay(),key=iso(d);
    if((hab.dow||[]).indexOf(dow)>=0){
      if(habitoHecho(hab.id,key))n++;
      else if(key!==hoyK)break;
    }
    d=addDays(d,-1);
  }
  return n;
}
function constanciaRingHTML(pct){
  const r=52,circ=2*Math.PI*r;
  const p=Math.max(0,Math.min(1,pct/100)),off=circ*(1-p);
  return '<div class="ringwrap"><svg viewBox="0 0 120 120">'+
    '<circle class="ringTrack" cx="60" cy="60" r="'+r+'"></circle>'+
    '<circle class="ringFill" cx="60" cy="60" r="'+r+'" style="stroke-dasharray:'+circ.toFixed(1)+';stroke-dashoffset:'+off.toFixed(1)+'"></circle>'+
    '</svg><div class="ringnum"><b>'+pct+'%</b><span>7 días</span></div></div>';
}
function habitoRowHTML(hab,weekDaysArr){
  const racha=rachaHabito(hab);
  const bg='color-mix(in srgb,'+hab.color+' 20%,transparent)';
  const dots=weekDaysArr.map(function(w){
    const due=(hab.dow||[]).indexOf(w.dow)>=0;
    const done=due&&habitoHecho(hab.id,w.key);
    const cls=(due?'':'off')+(w.today?' today':'');
    return '<div class="wdot"><span>'+w.label+'</span>'+
      '<button class="'+cls.trim()+'" style="'+(done?'background:'+hab.color+';border-color:transparent':'')+'" '+
      (due?('data-a="hab-mark" data-id="'+hab.id+'" data-key="'+w.key+'"'):'disabled')+'>'+(done?'✓':'')+'</button></div>';
  }).join('');
  return '<div class="habrow"><div class="row" style="justify-content:space-between;flex-wrap:nowrap">'+
    '<span class="row" style="gap:8px;flex:1;min-width:0">'+
      '<span class="habicon" style="background:'+bg+';color:'+hab.color+'">'+esc(hab.icono)+'</span>'+
      '<span style="min-width:0"><b style="display:block;font-size:13px">'+esc(hab.nombre)+'</b><span class="mini">'+diasCorta(hab.dow)+'</span></span>'+
    '</span>'+
    '<span class="mini" style="text-align:right;white-space:nowrap">🔥 <b style="color:var(--accent);font-size:14px">'+racha+'</b><br>racha</span>'+
    '<button class="btn d" data-a="hab-del" data-id="'+hab.id+'" title="borrar hábito">×</button>'+
    '</div><div class="habweek">'+dots+'</div></div>';
}
function habitoHeatmapHTML(hab){
  const hoy=new Date(),hoyK=iso(hoy),inicio=addDays(mondayOf(hoy),-35);
  const reg=habitosS().registro;
  let hechos=0;Object.keys(reg).forEach(function(k){if(reg[k][hab.id])hechos++;});
  const cells=[];
  for(let i=0;i<42;i++){
    const k=iso(addDays(inicio,i)),d=parseDate(k),due=(hab.dow||[]).indexOf(d.getDay())>=0;
    const done=due&&habitoHecho(hab.id,k),future=k>hoyK;
    cells.push('<div class="hcell'+(future||!due?' off':'')+'" style="'+(done&&!future?'background:'+hab.color+';border-color:transparent':'')+'" title="'+k+'"></div>');
  }
  return '<div class="heat"><span class="wd">L</span><span class="wd">M</span><span class="wd">X</span><span class="wd">J</span>'+
    '<span class="wd">V</span><span class="wd">S</span><span class="wd">D</span>'+cells.join('')+'</div>'+
    '<div class="heatstat"><span><b>'+rachaHabito(hab)+'</b> de racha</span><span><b>'+hechos+'</b> vez/veces hecho en total</span></div>';
}
function renderHabitos(){
  const hb=habitosS(),items=hb.items,DOWL=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const monday=mondayOf(new Date()),todayKey=iso(new Date()),hoyDow=new Date().getDay();
  const weekDaysArr=[0,1,2,3,4,5,6].map(function(i){const d=addDays(monday,i),key=iso(d);
    return {key:key,dow:d.getDay(),label:DAYSH[i].slice(0,1),today:key===todayKey};});
  let hechosHoy=0,activosHoy=0,mejorRacha=0,dueWeek=0,doneWeek=0;
  items.forEach(function(h){
    const r=rachaHabito(h);if(r>mejorRacha)mejorRacha=r;
    if((h.dow||[]).indexOf(hoyDow)>=0){activosHoy++;if(habitoHecho(h.id,todayKey))hechosHoy++;}
    weekDaysArr.forEach(function(w){if((h.dow||[]).indexOf(w.dow)>=0){dueWeek++;if(habitoHecho(h.id,w.key))doneWeek++;}});
  });
  const pct=dueWeek?Math.round(100*doneWeek/dueWeek):0;
  if(!items.some(function(h){return h.id===ui.habDetalle;}))ui.habDetalle=(items[0]||{}).id||'';
  const sel=items.find(function(h){return h.id===ui.habDetalle;});
  $('#main').innerHTML='<div class="grid">'+
    '<div class="card"><h2>✅ Hábitos</h2>'+
    '<p class="note">Créalos una vez y márcalos cada día: la app lleva la constancia y la racha por ti.</p>'+
    (items.length?('<div class="kcalhero">'+constanciaRingHTML(pct)+
      '<div class="heroside">'+
        '<div class="protrow"><span>hábitos activos</span><b>'+items.length+'</b></div>'+
        '<div class="protrow"><span>hechos hoy</span><b>'+hechosHoy+'/'+activosHoy+'</b></div>'+
        '<div class="protrow"><span>mejor racha</span><b>'+mejorRacha+' día(s)</b></div>'+
      '</div></div>'):'<div class="empty">Aún no tienes ningún hábito: crea el primero abajo.</div>')+
    '</div>'+
    (items.length?('<div class="card"><h2>Tus hábitos</h2>'+items.map(function(h){return habitoRowHTML(h,weekDaysArr);}).join('')+'</div>'):'')+
    '<div class="card"><h2>+ Crear hábito</h2>'+
      '<div class="row">'+
        '<label class="fld" style="flex:0 0 64px">icono<input id="habNuevoIcono" value="✅" maxlength="4" style="text-align:center"></label>'+
        '<label class="fld" style="flex:1 1 180px">nombre<input id="habNuevoNombre" placeholder="p. ej. Estirar 10 min"></label>'+
        '<label class="fld" style="flex:0 0 54px">color<input type="color" id="habNuevoColor" value="#38e1ff" style="height:30px;padding:2px"></label>'+
      '</div>'+
      '<div class="row" style="margin-top:6px"><span class="mini">qué días (ninguno = todos):</span>'+
      DOWL.map(function(nm,ix){return '<button class="btn s '+(ui.habNuevo.dow.indexOf(ix)>=0?'p':'')+'" data-a="hab-dia" data-day="'+ix+'">'+nm+'</button>';}).join('')+
      '</div>'+
      '<div class="row" style="margin-top:8px"><button class="btn p" data-a="hab-add">+ crear hábito</button></div>'+
    '</div>'+
    (items.length?('<div class="card"><h2>Constancia'+(sel?' · '+esc(sel.nombre):'')+'<span class="mini" style="margin-left:auto;font-weight:400">últimas 6 semanas</span></h2>'+
      (items.length>1?('<select data-a="hab-detalle" style="max-width:220px;margin-bottom:8px">'+
        items.map(function(h){return '<option value="'+h.id+'" '+(h.id===ui.habDetalle?'selected':'')+'>'+esc(h.icono)+' '+esc(h.nombre)+'</option>';}).join('')+
        '</select>'):'')+
      (sel?habitoHeatmapHTML(sel):'')+
      '</div>'):'')+
    '</div>';
}
/* ===================== render: días y menús ===================== */
/* ===================== importar recetas de redes sociales ===================== */
/* El caso de uso: ves una receta en TikTok/Instagram y quieres el plato en la app sin teclearlo.
   Dos caminos, y la pantalla usa el que haya: el parser de aquí abajo (funciona en todas partes,
   también sin conexión) y, dentro del Artifact de claude.ai, pedirle a Claude que lea el texto o
   una captura. La app NO puede bajarse el vídeo ni la descripción: su red está cerrada. */
const RICONOS=[[/pollo|pechuga|muslo|pavo/i,'🍗'],[/salm[óo]n|pescado|at[úu]n|merluza|bacalao|gamba|marisco/i,'🐟'],
  [/huevo|tortilla|revuelto/i,'🍳'],[/arroz|paella|risotto/i,'🍚'],[/pasta|espagueti|macarr|bolo[ñn]|lasa[ñn]a|fideo/i,'🍝'],
  [/lenteja|garbanzo|alubia|jud[íi]a|legumbre|potaje|cocido|estofado/i,'🍲'],[/ensalada|lechuga|canon|r[úu]cula/i,'🥗'],
  [/sopa|crema|caldo|pur[ée]/i,'🍜'],[/ternera|cerdo|solomillo|filete|carne|albondiga|alb[óo]ndiga/i,'🥩'],
  [/bocadillo|s[áa]ndwich|sandwich|tosta|wrap/i,'🥪'],[/avena|porridge|yogur|batido|smoothie/i,'🥣'],
  [/tarta|bizcocho|galleta|postre|brownie|crepe|tortita/i,'🍰'],[/pizza/i,'🍕'],[/taco|burrito|fajita|quesadilla/i,'🌮'],
  [/curry/i,'🍛'],[/patata|boniato/i,'🥔'],[/verdura|brocoli|br[óo]coli|calabac[íi]n|espinaca|pimiento/i,'🥦'],[/pan\b|masa madre/i,'🍞']];
function recetaIcono(txt){
  const t=String(txt||'');
  for(let i=0;i<RICONOS.length;i++)if(RICONOS[i][0].test(t))return RICONOS[i][1];
  return '🍽';}
function recetaLineas(txt){
  /* una descripción de TikTok viene con hashtags, enlaces, viñetas y líneas de solo emojis */
  return String(txt||'').split(/\r?\n+/).map(function(l){
    return String(l).replace(/https?:\/\/\S+/g,'').replace(/#[^\s#]+/g,'')
      .replace(/^[\s\-•*·—–>»]+/,'').replace(/\s+/g,' ').trim();})
    .filter(function(l){return l&&!/^[^\p{L}\d]+$/u.test(l);});}
function recetaTrocea(linea,destino){
  /* «200 g arroz, 2 cebollas, aceite» en una sola línea es lo normal en un pie de foto */
  const trozos=linea.split(/\s*[,;]\s*/).filter(Boolean);
  const conCantidad=trozos.filter(function(t){return parseIng(t).num!=null;}).length;
  if(trozos.length>1&&conCantidad>=2)trozos.forEach(function(t){destino.push(t);});
  else destino.push(linea);}
const R_RUIDO=/^(s[íi]gueme|s[íi]guenos|guarda|gu[áa]rdalo|comenta|comparte|link en bio|enlace en bio|receta completa|m[áa]s recetas|suscr[íi]bete|dale a|no te pierdas|te leo|ap[úu]ntate)\b/i;
function recetaRuido(l){
  /* coletillas de las redes y la línea de macros: ni son pasos ni son ingredientes */
  const t=String(l||'').trim();
  if(!t)return true;
  if(R_RUIDO.test(t))return true;
  if(/^@[\w.]+$/.test(t))return true;
  if(/^\d{2,4}\s*(kcal|calor[íi]as)\b/i.test(t))return true;
  if(/^\d{1,3}\s*g?\s*(de\s*)?prote/i.test(t))return true;
  if(/^\d{2,4}\s*kcal\b.*prote/i.test(t))return true;
  return false;}
function recetaTitulo(t){
  /* «POLLO AL LIMÓN 🍋🔥 guárdalo que…» y «🍝 PASTA DE ATÚN»: se corta en los emojis y se
     queda el trozo con más letra, que es el nombre del plato */
  const trozos=String(t||'').split(/[\p{Extended_Pictographic}]/u)
    .map(function(x){return x.replace(/[️‍]/g,'').trim();}).filter(Boolean);
  /* el primero que valga, no el más largo: la coletilla de después del emoji suele ser más larga
     que el nombre del plato («POLLO AL LIMÓN 🍋 guárdalo que lo vas a hacer seguro») */
  let n=trozos.filter(function(x){return x.length>=4&&!recetaRuido(x);})[0]||trozos[0]||String(t||'').trim();
  n=n.replace(/^[\s:·\-–—]+/,'').replace(/[\s:.·\-–—]+$/,'').trim();
  if(n&&!/\p{Ll}/u.test(n))n=n.charAt(0).toUpperCase()+n.slice(1).toLowerCase();   /* venía TODO EN MAYÚSCULAS */
  return n;}
function parseReceta(txt){
  /* devuelve la misma forma que un plato del catálogo, para poder guardarlo sin traducir nada */
  const crudo=String(txt||'');
  const lineas=recetaLineas(crudo);
  if(!lineas.length)return null;
  const H_ING=/^(ingredientes?|necesitas|qu[ée] necesitas|lista de la compra|para la receta)\b\s*:?\s*(.*)$/i;
  const H_PAS=/^(preparaci[óo]n|pasos?|elaboraci[óo]n|c[óo]mo se hace|modo de preparaci[óo]n|instrucciones|procedimiento|receta)\b\s*:?\s*(.*)$/i;
  const ing=[],pas=[],otras=[];
  let modo='';
  lineas.forEach(function(l){
    if(recetaRuido(l))return;
    /* «Ingredientes (para 4 personas):» — el paréntesis de detrás del encabezado no es un ingrediente */
    const resto=function(x){return String(x||'').replace(/^\(.*?\)\s*:?\s*/,'').replace(/^:\s*/,'').trim();};
    const hi=H_ING.exec(l);
    if(hi){modo='ing';const r0=resto(hi[2]);if(r0)recetaTrocea(r0,ing);return;}
    const hp=H_PAS.exec(l);
    if(hp){modo='pas';const r1=resto(hp[2]);if(r1)pas.push(r1);return;}
    const numerada=/^\d{1,2}\s*[.)\-]\s+/.test(l);
    const limpia=l.replace(/^\d{1,2}\s*[.)\-]\s+/,'').trim();
    if(modo==='ing'){recetaTrocea(l,ing);return;}
    if(modo==='pas'){if(limpia)pas.push(limpia);return;}
    /* sin encabezados: lo que arranca con una cantidad es ingrediente (aunque la línea sea larga: en
       un pie de foto la lista entera suele venir en un renglón); lo numerado o largo, paso */
    if(numerada&&limpia.length>18){pas.push(limpia);return;}
    if(parseIng(l).num!=null){recetaTrocea(l,ing);return;}
    otras.push(l);});
  /* si no ha quedado ningún paso, los renglones largos sueltos lo son: muchas recetas cuentan el
     método en prosa, sin numerar ni encabezar */
  if(!pas.length){
    for(let i=otras.length-1;i>=0;i--)if(otras[i].length>55)pas.unshift(otras.splice(i,1)[0]);}
  if(!ing.length&&!pas.length)return null;
  const meta=crudo.replace(/\s+/g,' ');
  const mRac=/\bpara\s+(\d{1,2})\s*(?:personas|raciones|comensales|pers\b)/i.exec(meta)||/\b(\d{1,2})\s*raciones\b/i.exec(meta);
  const mKcal=/\b(\d{2,4})\s*(?:kcal|calor[íi]as)\b/i.exec(meta);
  const mProt=/\b(\d{1,3})\s*g?\s*(?:de\s*)?prote/i.exec(meta);
  const titulo=recetaTitulo(otras.filter(function(l){return l.length>=4;})[0]||lineas[0]||'Receta importada');
  return {name:(titulo||'Receta importada').slice(0,70),
    icon:recetaIcono(titulo+' '+ing.join(' ')),
    portions:mRac?Math.max(1,Math.min(20,+mRac[1])):4,
    kcal:mKcal?Math.max(0,Math.min(3000,+mKcal[1])):0,
    prot:mProt?Math.max(0,Math.min(300,+mProt[1])):0,
    ingredients:ing.slice(0,40),steps:pas.slice(0,20)};}
function recetaSana(o){
  /* lo que vuelve de Claude no está validado por el contrato: se comprueba campo a campo */
  if(!o||typeof o!=='object'||Array.isArray(o))return null;
  const lista=function(v){return (Array.isArray(v)?v:[]).map(function(x){return String(x==null?'':x).trim();})
    .filter(Boolean).slice(0,40);};
  const nombre=String(o.name==null?'':o.name).trim().slice(0,70);
  const ing=lista(o.ingredients),pas=lista(o.steps);
  if(!nombre||(!ing.length&&!pas.length))return null;
  const n=function(v,def,max){const x=Math.round(+v);return (isFinite(x)&&x>=0&&x<=max)?x:def;};
  return {name:nombre,
    icon:(String(o.icon==null?'':o.icon).trim()||recetaIcono(nombre)).slice(0,4),
    portions:Math.max(1,n(o.portions,4,20)),kcal:n(o.kcal,0,3000),prot:n(o.prot,0,300),
    ingredients:ing,steps:pas.slice(0,20)};}
/* --- pegar el enlace: ir a buscar la descripción del vídeo ---
   Dos caminos y ninguno puede fallar en silencio:
   1. sin nada configurado, se le pide directamente a la plataforma (oEmbed). Puede que el navegador
      no deje: oEmbed es público, pero que mande o no las cabeceras CORS lo decide la plataforma.
   2. con un «lector de enlaces» propio puesto en Ajustes (una función tuya; hay una lista para
      copiar y pegar en tools/worker-recetas.js), se le pide a ella y CORS deja de ser problema.
   Dentro del Artifact de claude.ai ninguno de los dos funciona: ahí toda petición externa está
   cerrada, y por eso se avisa antes de gastarle un toque al usuario. */
function enArtifact(){return !!(typeof window!=='undefined'&&window.claude&&typeof window.claude.use==='function');}
const LECTOR_SITIOS=[
  {re:/^https?:\/\/([\w-]+\.)*tiktok\.com\//i,nombre:'TikTok',
   oembed:function(u){return 'https://www.tiktok.com/oembed?url='+encodeURIComponent(u);}},
  {re:/^https?:\/\/(([\w-]+\.)*youtube\.com|youtu\.be)\//i,nombre:'YouTube',
   oembed:function(u){return 'https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(u);}},
  {re:/^https?:\/\/([\w-]+\.)*instagram\.com\//i,nombre:'Instagram',oembed:null}
];
/* Intermediarios públicos: la app NO los usa salvo que lo hayas aceptado (store.lector.publico).
   Lo único que sale hacia ellos es la dirección del vídeo, que es pública de por sí; ni tus datos
   ni tus recetas pasan por ahí. Están en orden: si uno no contesta se prueba el siguiente. */
const LECTORES_PUBLICOS=[
  {nombre:'AllOrigins',url:function(d){return 'https://api.allorigins.win/raw?url='+encodeURIComponent(d);}},
  {nombre:'CodeTabs',url:function(d){return 'https://api.codetabs.com/v1/proxy?quest='+encodeURIComponent(d);}}
];
function lectorPublicoOn(){return !!(store.lector||{}).publico;}
function lectorSitio(url){
  const u=String(url||'').trim();
  for(let i=0;i<LECTOR_SITIOS.length;i++)if(LECTOR_SITIOS[i].re.test(u))return LECTOR_SITIOS[i];
  return null;}
function lectorProxy(){return ((store.lector||{}).proxy||'').trim();}
function lectorNormaliza(data){
  /* vale tanto lo que devuelve oEmbed tal cual como lo que devuelve tu función ya masticado */
  if(!data||typeof data!=='object')return null;
  const txt=String(data.texto||data.title||'').trim();
  const autor=String(data.autor||data.author_name||'').trim();
  if(!txt&&!autor)return null;
  return {texto:txt,autor:autor};}
function pedirALector(destino,quien){
  /* un intento contra un sitio concreto. Los fallos van etiquetados para poder distinguir «no me
     dejan» (se prueba el siguiente) de «me han contestado que no hay descripción» (no hay más que
     rascar, por muchos intermediarios que se prueben). */
  return fetch(destino,{headers:{accept:'application/json'}}).then(function(res){
    if(!res.ok)return res.text().then(function(t){
      throw {tipo:'http',quien:quien,msg:quien+' ha respondido '+res.status+'. '+(String(t||'').slice(0,120))};});
    return res.json().catch(function(){
      throw {tipo:'formato',quien:quien,
        msg:quien+' ha contestado, pero con algo que no es JSON: no es que el navegador lo bloquee, '+
          'es que la respuesta no venía en el formato esperado.'};});
  }).then(function(data){
    if(data&&data.error)throw {tipo:'http',quien:quien,msg:String(data.error).slice(0,160)};
    const n=lectorNormaliza(data);
    if(!n)throw {tipo:'vacio',quien:quien,
      msg:'El enlace no traía descripción ninguna. Si la receta solo se dice en el vídeo, copia el comentario donde esté escrita.'};
    n.via=quien;return n;
  }).catch(function(e){
    if(e&&e.tipo)throw e;
    /* un fallo de CORS llega como TypeError sin estado: ni siquiera hemos llegado a hablar */
    throw {tipo:'cors',quien:quien,msg:'El navegador no ha dejado pedírselo a '+quien+' (no permite CORS).'};});}
function lectorIntentos(u){
  /* en qué orden se prueba. Tu propio lector va primero y solo; si lo has montado es por algo, y
     no tiene sentido mandar tus enlaces a terceros teniéndolo. */
  const proxy=lectorProxy(),sitio=lectorSitio(u),out=[];
  if(proxy){out.push({quien:'Tu lector de enlaces',
    destino:proxy+(proxy.indexOf('?')>=0?'&':'?')+'url='+encodeURIComponent(u)});return out;}
  if(sitio&&sitio.oembed)out.push({quien:sitio.nombre,destino:sitio.oembed(u)});
  if(lectorPublicoOn()&&sitio&&sitio.oembed){
    const oe=sitio.oembed(u);
    LECTORES_PUBLICOS.forEach(function(l){out.push({quien:l.nombre,destino:l.url(oe),publico:true});});}
  return out;}
function traerDescripcion(url){
  const u=String(url||'').trim();
  if(!/^https?:\/\//i.test(u))return Promise.reject({tipo:'url',msg:'Eso no parece un enlace. Pega la dirección completa del vídeo.'});
  if(enArtifact())return Promise.reject({tipo:'artifact',
    msg:'Aquí dentro (el Artifact de claude.ai) no se puede salir a la red. Usa «Que la lea Claude» con el texto o una captura, o abre la app del móvil.'});
  const sitio=lectorSitio(u),proxy=lectorProxy();
  if(!sitio&&!proxy)return Promise.reject({tipo:'url',msg:'De momento sé leer enlaces de TikTok y de YouTube. Para otros, pon tu lector de enlaces en Ajustes.'});
  if(sitio&&!sitio.oembed&&!proxy)return Promise.reject({tipo:'url',
    msg:'Los enlaces de Instagram no se pueden leer sin un lector propio (Instagram pide credenciales). Pon uno en Ajustes o pega el texto.'});
  const intentos=lectorIntentos(u);
  if(!intentos.length)return Promise.reject({tipo:'url',msg:'No sé por dónde pedir ese enlace.'});
  /* se van probando en fila; el primero que traiga algo gana */
  return intentos.reduce(function(cadena,intento){
    return cadena.catch(function(fallo){
      /* «no hay descripción» es una respuesta, no un fallo de camino: probar otro intermediario
         daría exactamente lo mismo, así que se para aquí */
      if(fallo&&fallo.tipo==='vacio')throw fallo;
      return pedirALector(intento.destino,intento.quien);});
  },Promise.reject({tipo:'inicio'})).catch(function(e){
    if(e&&e.tipo==='vacio')throw e;
    const puedeMas=!proxy&&!lectorPublicoOn();
    /* «me han contestado, pero mal» NO es lo mismo que «no me dejan hablar». Mandar al usuario a
       montar un proxy por un 200 con HTML dentro es mandarlo a arreglar lo que no está roto: el
       último intento sabe qué le pasó y se cuenta tal cual. */
    if(e&&(e.tipo==='formato'||e.tipo==='http'))throw {tipo:e.tipo,ofrecer:puedeMas,
      msg:e.msg+(puedeMas?'':' Prueba a pegar el texto de la receta a mano.')};
    throw {tipo:'cors',ofrecer:puedeMas,
      msg:(proxy?'No he podido hablar con tu lector de enlaces. Comprueba la dirección en Ajustes.'
        :(lectorPublicoOn()
          ?'Ni la plataforma ni los lectores públicos me han dejado traerla. Monta tu propio lector (Ajustes) o pega el texto a mano.'
          :'El navegador no ha dejado pedírselo a '+((sitio&&sitio.nombre)||'la plataforma')+' (no permite CORS).'))};});}
function impFuenteNueva(){
  /* en cuanto cambia el texto de origen, la receta de antes deja de valer: si se queda en pantalla
     acabas guardando el plato del enlace anterior */
  ui.imp.receta=null;ui.imp.via='';}
function impTraerEnlace(){
  const u=String(ui.imp.url||'').trim();
  if(!u){flash('Pega antes el enlace del vídeo');return;}
  impFuenteNueva();
  ui.imp.estado='trayendo';ui.imp.msg='';render();
  ui.imp.ofrecer=false;
  traerDescripcion(u).then(function(d){
    const partes=[d.texto,d.autor?('— '+d.autor):''].filter(Boolean);
    ui.imp.txt=partes.join('\n');
    ui.imp.estado='';ui.imp.msg='';
    const r=parseReceta(ui.imp.txt);
    if(r){ui.imp.receta=r;ui.imp.via='local';render();flash('Receta lista: '+r.name+(d.via?(' · vía '+d.via):''));}
    else{render();flash('Descripción traída'+(d.via?(' vía '+d.via):'')+': ahora dale a leerla');}
  }).catch(function(e){
    ui.imp.estado='error';ui.imp.msg=(e&&e.msg)||'No he podido traer la descripción.';
    ui.imp.ofrecer=!!(e&&e.ofrecer);   /* quedan salidas que ofrecerle al usuario */
    render();});}
function impAutoDesdeEnlace(){
  /* «mando el link y ya está»: si llega un enlace y no viene con una receta legible detrás, la app
     va sola a por la descripción y la convierte en receta. Solo en el móvil: dentro del Artifact no
     se puede salir a la red y el intento acabaría en un aviso que no lleva a ninguna parte. */
  if(!ui.imp||!String(ui.imp.url||'').trim())return;
  if(ui.imp.receta||ui.imp.estado==='trayendo')return;
  if(String(ui.imp.txt||'').trim()&&parseReceta(ui.imp.txt))return;   /* ya venía la receta en el texto */
  if(enArtifact())return;
  if(!lectorIntentos(String(ui.imp.url).trim()).length)return;
  setTimeout(impTraerEnlace,0);}
function lectorProbar(){
  const u='https://www.tiktok.com/@cocina/video/1234567890123456789';
  const proxy=lectorProxy();
  if(!proxy){flash('Escribe primero la dirección de tu lector');return;}
  flash('Probando tu lector…');
  fetch(proxy+(proxy.indexOf('?')>=0?'&':'?')+'url='+encodeURIComponent(u),{headers:{accept:'application/json'}})
    .then(function(res){
      /* el vídeo de prueba no existe a propósito: lo que se comprueba no es que lo encuentre, sino
         que contesta TU función (JSON con nuestra forma) y que el navegador acepta la respuesta.
         Un 404 de una dirección equivocada también es un 404, así que el estado por sí solo no vale. */
      return res.text().then(function(t){
        let d=null;try{d=JSON.parse(t);}catch(e){}
        const nuestro=d&&typeof d==='object'&&(typeof d.texto==='string'||typeof d.error==='string');
        if(nuestro)flash('✓ Tu lector responde y el navegador lo acepta');
        else if(res.status>=500)flash('✗ Responde con error '+res.status+': revisa que el código esté pegado entero');
        else flash('✗ Ahí hay algo, pero no es tu lector ('+res.status+'). ¿Es esa la dirección del Worker?');});
    }).catch(function(){flash('✗ No he podido hablar con esa dirección. ¿La has copiado entera, con https?');});}
/* --- el puente con Claude: solo existe dentro del Artifact --- */
let _sampleFn=null,_sampleLim=null,_sampleEstado='buscando';
function claudeBuscar(){
  /* window.claude no existe en GitHub Pages ni en un index.html abierto a pelo: ahí no hay nada que hacer */
  if(typeof window==='undefined'||!window.claude||typeof window.claude.use!=='function'){_sampleEstado='no';return;}
  window.claude.use('sample').then(function(s){
    if(!s){_sampleEstado='no';return;}
    _sampleFn=s;_sampleEstado='si';
    return s.limits().then(function(l){_sampleLim=l;}).catch(function(){});
  }).catch(function(){_sampleEstado='no';})
   .then(function(){if(ui.tab==='import')render();});}
const IMP_ERRORES={
  not_granted:'No has dado permiso para que esta página use Claude. Pega el texto y dale a «Leerlo aquí mismo».',
  sampling_disabled:'Tu cuenta no tiene disponible esta función de Claude.',
  not_declared:'Esta versión de la app no tiene activado el acceso a Claude.',
  capability_disabled:'Claude no está disponible en esta ventana.',
  capability_removed:'Esta versión del visor no admite esta llamada.',
  images_unavailable:'Desde aquí no se pueden mandar imágenes. Prueba pegando el texto.',
  image_rejected:'Esa imagen no vale (formato raro, o demasiado grande). Prueba con una captura normal.',
  rate_limited:'Has hecho muchas consultas seguidas. Espera un poco y vuelve a darle.',
  session_expired:'Se ha cerrado tu sesión de Claude: vuelve a entrar y prueba otra vez.',
  refused:'Claude no ha querido responder a esto. Prueba con otro texto.',
  empty_completion:'Claude no ha devuelto nada. Prueba con menos texto o más claro.',
  invalid_json:'La respuesta ha venido mal formada. Dale otra vez.',
  prompt_too_large:'El texto es demasiado largo. Pega solo la parte de la receta.',
  cancelled:''};
function impPrompt(txt,conImagen){
  return 'Te paso '+(conImagen?'una captura de pantalla y ':'')+'el texto de una publicación de redes sociales '+
    '(TikTok, Instagram, un blog…). Saca de ahí la receta.\n\n'+
    'Responde SOLO con un objeto JSON con esta forma exacta:\n'+
    '{"name":"","icon":"","portions":4,"kcal":0,"prot":0,"ingredients":[],"steps":[]}\n\n'+
    '- name: el nombre del plato, en español y corto.\n'+
    '- icon: UN solo emoji de comida que lo represente.\n'+
    '- portions: cuántas raciones salen de la receta entera. Si no lo dice, estímalo.\n'+
    '- kcal y prot: POR RACIÓN. Si no vienen, estímalos a ojo por los ingredientes. Números enteros, prot en gramos.\n'+
    '- ingredients: una línea por ingrediente, empezando por la cantidad y la unidad cuando se sepa. '+
    'Ejemplos: "700 g patata", "2 cebolla", "aceite de oliva".\n'+
    '- steps: los pasos en orden, frases cortas y en imperativo.\n\n'+
    'Si ahí no hay ninguna receta, responde {"error":"sin receta"}.\n\n'+
    'TEXTO:\n'+String(txt||'').slice(0,20000);}
function impConClaude(){
  if(!_sampleFn){flash('Claude no está disponible en esta ventana');return;}
  const imgs=ui.imp.imagenes||null;
  const conImagen=!!(imgs&&imgs.length);
  if(!conImagen&&!String(ui.imp.txt||'').trim()){flash('Pega antes el texto de la receta');return;}
  ui.imp.estado='pensando';ui.imp.msg='';render();
  const opciones={modelTier:'default'};
  if(conImagen)opciones.images=imgs;
  _sampleFn.json(impPrompt(ui.imp.txt,conImagen),opciones).then(function(data){
    if(data&&data.error){impFuenteNueva();ui.imp.estado='error';ui.imp.msg='Claude no ha visto ninguna receta ahí dentro.';render();return;}
    const r=recetaSana(data);
    if(!r){impFuenteNueva();ui.imp.estado='error';ui.imp.msg='La respuesta no traía una receta reconocible. Prueba otra vez.';render();return;}
    ui.imp.receta=r;ui.imp.estado='';ui.imp.msg='';ui.imp.via='claude';render();
    flash('Receta leída por Claude: '+r.name);
  }).catch(function(e){
    const code=(e&&e.code)||'upstream_error';
    if(code==='cancelled'){ui.imp.estado='';render();return;}
    impFuenteNueva();ui.imp.estado='error';
    ui.imp.msg=IMP_ERRORES[code]||'No ha salido («'+code+'»). Puedes leerlo aquí mismo con el lector de la app.';
    if(code==='not_granted'||code==='sampling_disabled'||code==='not_declared'||code==='capability_disabled')_sampleEstado='no';
    render();});}
function impLocal(){
  const r=parseReceta(ui.imp.txt);
  if(!r)impFuenteNueva();
  if(!r){impFuenteNueva();ui.imp.estado='error';
    ui.imp.msg='No he sacado nada en claro. Suele pasar cuando la receta se dice en el vídeo y no está escrita: copia el comentario donde esté la lista de ingredientes.';
    render();return;}
  ui.imp.receta=r;ui.imp.estado='';ui.imp.msg='';ui.imp.via='local';render();
  flash('Receta leída: '+r.name);}
function impGuardar(){
  const r=ui.imp.receta;
  if(!r)return 'no hay receta que guardar';
  const lote=ui.imp.destinoLote||(store.batches[0]||{id:'bn'}).id;
  const plato={id:uid('d'),name:r.name,icon:r.icon||'🍽',batchId:lote,
    portions:Math.max(1,+r.portions||1),kcal:Math.max(0,+r.kcal||0),prot:Math.max(0,+r.prot||0),
    ingredients:(r.ingredients||[]).slice(),steps:(r.steps||[]).slice()};
  store.dishes.push(plato);
  let extra='';
  const dia=ui.imp.destinoDia;
  if(dia&&shiftById(dia)){
    if(!store.menu[dia])store.menu[dia]=[];
    store.menu[dia].push({id:uid('sl'),time:'',label:plato.name,items:[{kind:'dish',id:plato.id,portions:1}]});
    extra=' y puesto en el menú de '+shiftById(dia).name;}
  ui.imp={txt:'',url:'',receta:null,estado:'',msg:'',destinoLote:'',destinoDia:'',via:'',imagenes:null};
  store.impPendiente=null;   /* ya está guardada: no hay nada pendiente que rescatar */
  save();render();
  return 'Guardado: '+plato.icon+' '+plato.name+extra;}
function impPegar(){
  /* la red de seguridad de todo esto: en iPhone no hay «compartir con la app» que valga, y en
     Android TikTok solo enseña la app si tiras de «Más». Copiar el enlace sí funciona siempre. */
  if(!navigator.clipboard||!navigator.clipboard.readText){
    flash('Este navegador no me deja leer el portapapeles: pega el enlace en el campo a mano');return;}
  navigator.clipboard.readText().then(function(t){
    const txt=String(t||'').trim();
    if(!txt){flash('El portapapeles está vacío: copia antes el enlace en TikTok');return;}
    const m=/https?:\/\/\S+/.exec(txt);
    if(!ui.imp)ui.imp={txt:'',url:'',receta:null,estado:'',msg:'',destinoLote:'',destinoDia:'',via:'',imagenes:null};
    if(m){
      ui.imp.url=m[0];
      const resto=txt.replace(/https?:\/\/\S+/g,'').replace(/\n{2,}/g,'\n').trim();
      if(resto)ui.imp.txt=resto;
      impFuenteNueva();render();
      flash('Enlace pegado: voy a por la receta…');
      impAutoDesdeEnlace();
    }else{
      ui.imp.txt=txt;impFuenteNueva();render();
      flash('Texto pegado: dale a «Leerla aquí mismo»');}
  }).catch(function(){
    flash('No me has dado permiso para leer el portapapeles: pega el enlace a mano en el campo');});}
function impPreviaHTML(r){
  return '<div class="tarj" data-imp="previa">'+
    '<div class="tarj-top">'+
      '<input class="tarj-ic" value="'+esc(r.icon)+'" data-a="imp-f" data-f="icon" maxlength="4" aria-label="icono">'+
      '<input class="tarj-nm" value="'+esc(r.name)+'" data-a="imp-f" data-f="name" aria-label="nombre del plato">'+
      '<span class="tag '+(ui.imp.via==='claude'?'b2':'b3')+'">'+(ui.imp.via==='claude'?'leída por Claude':'leída por la app')+'</span>'+
    '</div>'+
    '<div class="fgrid c3 tight" style="margin-top:9px">'+
      '<label class="fld">raciones<input type="number" min="1" max="20" value="'+(+r.portions||1)+'" data-a="imp-f" data-f="portions"></label>'+
      '<label class="fld">kcal / ración<input type="number" min="0" value="'+(+r.kcal||0)+'" data-a="imp-f" data-f="kcal"></label>'+
      '<label class="fld">proteína g / ración<input type="number" min="0" value="'+(+r.prot||0)+'" data-a="imp-f" data-f="prot"></label>'+
    '</div>'+
    '<label class="fld" style="margin-top:9px">ingredientes · uno por línea, con la cantidad delante'+
      '<textarea rows="'+Math.min(12,Math.max(4,(r.ingredients||[]).length+1))+'" data-a="imp-f" data-f="ingredients">'+
      esc((r.ingredients||[]).join('\n'))+'</textarea></label>'+
    '<label class="fld" style="margin-top:9px">pasos'+
      '<textarea rows="'+Math.min(12,Math.max(3,(r.steps||[]).length+1))+'" data-a="imp-f" data-f="steps">'+
      esc((r.steps||[]).join('\n'))+'</textarea></label>'+
    '<h3 class="subh">¿Dónde lo metes?</h3>'+
    '<div class="fgrid c2 tight">'+
      '<label class="fld">sesión de cocina<select data-a="imp-f" data-f="destinoLote">'+
        store.batches.map(function(b){return '<option value="'+esc(b.id)+'" '+(ui.imp.destinoLote===b.id?'selected':'')+'>'+esc(b.label)+'</option>';}).join('')+
      '</select></label>'+
      '<label class="fld">y en el menú de…<select data-a="imp-f" data-f="destinoDia">'+
        '<option value="">de momento en ningún menú</option>'+
        store.shifts.map(function(s){return '<option value="'+esc(s.id)+'" '+(ui.imp.destinoDia===s.id?'selected':'')+'>'+esc(s.icon)+' '+esc(s.name)+'</option>';}).join('')+
      '</select></label>'+
    '</div>'+
    '<div class="row" style="margin-top:11px">'+
      '<button class="btn p" data-a="imp-save">Guardar el plato</button>'+
      '<button class="btn s" data-a="imp-descartar">descartar</button></div>'+
    '</div>';}
function renderImport(){
  if(!ui.imp)ui.imp={txt:'',url:'',receta:null,estado:'',msg:'',destinoLote:'',destinoDia:'',via:'',imagenes:null};
  const hayClaude=_sampleEstado==='si'&&!!_sampleFn;
  const puedeImagen=hayClaude&&!!(_sampleLim&&_sampleLim.images);
  const pensando=ui.imp.estado==='pensando';
  const trayendo=ui.imp.estado==='trayendo';
  const tipos=puedeImagen?(_sampleLim.images.mediaTypes||[]).join(','):'';
  const nImg=(ui.imp.imagenes&&ui.imp.imagenes.length)||0;
  $('#main').innerHTML='<div class="grid">'+
    '<div class="card"><h2>📥 Importar una receta</h2>'+
      '<p class="note">Pega el enlace y la app intenta traer la descripción sola; si no puede, te lo dice y '+
      'pegas el texto tú. Lo que no hay forma de hacer es escuchar el vídeo: si la receta solo se dice en voz alta '+
      'y no está escrita en ninguna parte, copia el comentario donde esté.</p>'+
      '<div class="enlacefila">'+
        '<label class="fld" style="flex:1 1 190px;min-width:0">enlace del vídeo'+
          '<input id="impUrl" type="url" inputmode="url" value="'+esc(ui.imp.url||'')+'" data-a="imp-url" placeholder="https://www.tiktok.com/@…">'+
        '</label>'+
        '<button class="btn s" data-a="imp-pegar" title="pegar lo que tengas copiado">📋 pegar</button>'+
        '<button class="btn s" data-a="imp-traer"'+(trayendo?' disabled':'')+'>'+(trayendo?'trayendo…':'traer la descripción')+'</button>'+
      '</div>'+
      (enArtifact()
        ?'<p class="mini" style="margin-top:6px">⚠ Aquí dentro el enlace no se puede leer: el Artifact no deja salir a la red. En la app del móvil sí.</p>'
        :(lectorProxy()?'<p class="mini" style="margin-top:6px">Usando tu lector de enlaces: nada sale hacia terceros.</p>'
          :(lectorPublicoOn()
            ?'<p class="mini" style="margin-top:6px">Primero se le pide a la plataforma; si no deja, tiras de los lectores públicos (activados en Ajustes).</p>'
            :'<p class="mini" style="margin-top:6px">Se le pide directamente a la plataforma. Si el navegador no deja, te ofrezco ahí mismo por dónde salir.</p>')))+
      '<label class="fld" style="margin-top:10px">texto de la receta'+
        '<textarea id="impTxt" rows="8" data-a="imp-txt" placeholder="Pega aquí la descripción del vídeo…">'+esc(ui.imp.txt||'')+'</textarea></label>'+
      (puedeImagen?('<div class="row" style="margin-top:9px;gap:7px">'+
        '<label class="fld" style="flex:1 1 200px">…o una captura de pantalla de la receta'+
        '<input type="file" accept="'+esc(tipos)+'" data-a="imp-img"'+(_sampleLim.images.maxCount>1?' multiple':'')+'></label>'+
        (nImg?'<span class="tag b2" style="align-self:flex-end;margin-bottom:6px">'+nImg+' imagen'+(nImg===1?'':'es')+'</span>':'')+
        '</div>'):'')+
      '<div class="row" style="margin-top:11px">'+
        (hayClaude?'<button class="btn p" data-a="imp-claude"'+(pensando||trayendo?' disabled':'')+'>'+
          (pensando?'Claude está leyéndola…':'✨ Que la lea Claude')+'</button>':'')+
        '<button class="btn '+(hayClaude?'s':'p')+'" data-a="imp-local"'+(pensando||trayendo?' disabled':'')+'>Leerla aquí mismo</button>'+
        (String(ui.imp.txt||'').trim()||nImg?'<button class="btn s" data-a="imp-clear">limpiar</button>':'')+
      '</div>'+
      (ui.imp.estado==='error'?('<p class="note" style="margin-top:10px;color:var(--warn)">⚠ '+esc(ui.imp.msg)+'</p>'+
        (ui.imp.ofrecer?('<div class="card" style="margin-top:8px;background:color-mix(in srgb,var(--warn) 7%,var(--card))">'+
          '<p class="note" style="margin-bottom:9px">Hay dos maneras de saltárselo:</p>'+
          '<div class="row"><button class="btn p" data-a="lector-publico">Usar un lector público ahora</button>'+
          '<button class="btn s" data-a="ir-lector">Montar el mío (5 min, una vez)</button></div>'+
          '<p class="mini" style="margin:9px 0 0">Con el lector público, lo único que sale de tu móvil es <b>la dirección del vídeo</b> '+
          '—que es pública— hacia un servicio gratuito de terceros. Ni tus recetas ni tus datos pasan por ahí. '+
          'Se queda activado hasta que lo apagues en Ajustes.</p></div>'):'')):'')+
      (pensando?'<p class="mini" style="margin-top:10px">Puede tardar entre 5 y 60 segundos. La primera vez te pedirá permiso.</p>':'')+
      (hayClaude?'<p class="mini" style="margin-top:10px">💡 «Que la lea Claude» se apaña con el texto desordenado, con emojis y sin lista de ingredientes; '+
        'gasta de tu cuenta de Claude. «Leerla aquí mismo» no gasta nada y funciona sin conexión, pero necesita que la receta venga más o menos escrita.'
        :'<p class="mini" style="margin-top:10px">💡 Esta versión lee la receta con el lector de la app. En la versión del Artifact de claude.ai '+
        'sale además un botón para que la lea Claude, que se apaña con texto mucho más desordenado.')+'</p>'+
    '</div>'+
    (ui.imp.receta?impPreviaHTML(ui.imp.receta):'')+
    '<div class="card"><h2>Traer una receta de TikTok</h2>'+
      '<p class="note"><b>Lo que funciona siempre, en cualquier móvil:</b> en el vídeo, «Compartir → Copiar enlace»; '+
      'vuelves aquí y le das a 📋 pegar. Dos toques.</p>'+
      '<p class="note"><b>En Android, con la app instalada</b> (menú del navegador → «Instalar aplicación»), también puedes mandarla directamente: '+
      '«Compartir → <b>Más</b> → Guardias». El «Más» es importante: en la fila de iconos que TikTok enseña de primeras solo salen sus apps de siempre, '+
      'la nuestra está en el menú del sistema que hay detrás de «Más» (en algunos móviles se llama «Otros» o «Compartir con»).</p>'+
      '<p class="note" style="margin:0">En iPhone esto último no existe —Safari no admite que una app web reciba lo compartido—, así que ahí el camino es copiar y pegar.</p>'+
    '</div>'+
  '</div>';
}
/* ===================== Menú: los tipos de día y sus comidas =====================
   Antes esta vista pintaba los SEIS editores de tipo de día a la vez, más las comidas armadas y el
   catálogo: 9.912 px —11 pantallas—, 202 botones y 64 campos de una sentada. Para cambiar la cena
   del día libre te tragabas los otros cinco días enteros. */
function menuSubcab(titulo,volver,extra){
  return '<div class="subcab">'+
    '<button class="btn s volver" data-a="types-vista" data-v="'+esc(volver.v||'')+'">'+gymIco('atras','gico sm')+' '+esc(volver.t||'Menú')+'</button>'+
    '<h2 class="subtit">'+esc(titulo)+'</h2>'+(extra||'')+'</div>';}
function loQueHay(){
  /* lo que se da por disponible: las listas marcadas «de rutina» más lo fresco que piden las
     tandas de la semana vista. Es la misma idea que «qué platos salen» de la Compra. */
  const out=itemsDeRutina().map(function(r){return r.texto;});
  const pb=planBatches(weekDays());
  Object.keys(pb).forEach(function(k){const b=pb[k];if(!b.hasNeed)return;
    ingredientsFor(b.items.filter(function(i){return i.runs>0;})).forEach(function(i){out.push(i.item);});});
  return out;}
function esReceta(d){
  /* «qué cocino» tiene que proponer cosas que se cocinen. En el catálogo conviven recetas de verdad
     con entradas de registro —el café, la fruta con frutos secos, el batido de whey, el brik de
     leche—: tienen ingredientes y por tanto encajaban con la compra, pero nadie las «cocina».
     El corte es el que distingue a unas de otras: tres ingredientes y al menos dos pasos. */
  return (d.ingredients||[]).length>=3&&(d.steps||[]).filter(Boolean).length>=2;}
function platosCocinables(){
  const todo=platosConLista(loQueHay(),0,200).filter(function(x){return esReceta(x.dish);});
  return {listos:todo.filter(function(x){return !x.faltan.length;}),
          casi:todo.filter(function(x){return x.faltan.length&&x.faltan.length<=3;})};}
function renderTypesLista(){
  /* la tira de la semana primero: el menú va pegado al TIPO de día, y sin ver qué tipo te toca cada
     día no se sabe qué vas a comer. Antes había que ir al Calendario a mirarlo. */
  const dias=weekDays();
  const tira='<div class="tirasem">'+dias.map(function(d){
    const sh=d.shiftId?shiftById(d.shiftId):null;
    const hoy=d.key&&isToday(d.key);
    return '<button class="'+(hoy?'hoy':'')+'"'+(sh?(' data-a="types-vista" data-v="'+esc(sh.id)+'"'):'')+'>'+
      '<span>'+esc(d.short)+'</span><em>'+esc(sh?(sh.icon||'🍽'):'·')+'</em>'+
      '<b>'+esc(sh?sh.name:'—')+'</b></button>';}).join('')+'</div>';
  const filas=store.shifts.map(function(sh){
    const t=dayTotals(sh.id),n=slotsFor(sh.id).length;
    const horas=(sh.start||sh.end)?((sh.start||'—')+'–'+(sh.end||'—')):'sin jornada';
    return '<div class="hit"><button class="hitnom" data-a="types-vista" data-v="'+esc(sh.id)+'">'+
      '<span class="em">'+esc(sh.icon||'🍽')+'</span>'+
      '<span class="nm"><b>'+esc(sh.name)+'</b><span>'+esc(horas)+' · '+n+' toma'+(n===1?'':'s')+'</span></span>'+
      '<span class="kc">'+t.kcal+'<small>kcal/día</small></span></button>'+
      gymIco('chevron','gico sm')+'</div>';}).join('');
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="nav-comer">'+gymIco('atras','gico sm')+' Comer</button>'+
      '<h2 class="subtit">Menú</h2><span class="tag b2">'+store.shifts.length+' tipos</span></div>'+
    '<div class="card"><h2>Qué te toca comer esta semana <span class="mini">'+esc(rangoSemanaTxt())+'</span></h2>'+
      tira+
      '<p class="mini" style="margin:9px 0 0">Sale de tu rotación: el menú va pegado al tipo de día, no a la fecha.</p></div>'+
    '<div class="card"><h2>Tus tipos de día <span class="mini">toca uno para cambiar sus comidas</span></h2>'+
      (filas||'<div class="empty">No hay tipos de día: créalos en «Turno y rotación».</div>')+'</div>'+
    '<div class="row">'+
      '<button class="btn s" data-a="types-vista" data-v="meals">'+gymIco('caja','gico sm')+
        ' comidas armadas <span class="mini">('+store.meals.length+')</span></button>'+
      '<button class="btn s" data-a="food-vista" data-v="platos">'+gymIco('libro','gico sm')+
        ' mis platos <span class="mini">('+store.dishes.length+')</span></button>'+
    '</div></div>';}
function renderTypesDia(shiftId){
  const sh=shiftById(shiftId);
  if(!sh){ui.typesVista='';return renderTypesLista();}
  const t=dayTotals(sh.id),slots=slotsFor(sh.id);
  $('#main').innerHTML='<div class="grid">'+
    menuSubcab(sh.icon+' '+sh.name,{v:'',t:'Menú'},'<span class="tag b2">'+t.kcal+' kcal</span>')+
    '<div class="card"><div class="row" style="justify-content:space-between">'+
      '<span class="mini">'+esc((sh.start||sh.end)?((sh.start||'—')+'–'+(sh.end||'—')):'sin jornada')+' · carga '+esc(sh.intensity||'—')+'</span>'+
      '<span class="row" style="gap:6px"><span class="tag b3">'+t.prot+' g P</span><span class="tag">'+t.parts+' rac./día</span></span></div>'+
      (sh.desc?'<p class="mini" style="margin:8px 0 0">'+esc(sh.desc)+'</p>':'')+
    '</div>'+
    '<div class="card" data-shift="'+sh.id+'">'+
      '<ul class="slots">'+(slots.map(function(s,i){return slotRow(sh.id,s,i,slots.length);}).join('')||
        '<li class="empty">Sin comidas todavía: elige abajo qué quieres comer este día.</li>')+'</ul>'+
      '<div class="row" style="margin-top:9px"><button class="btn s" data-a="toggle-picker" data-id="'+sh.id+'" aria-expanded="'+(ui.openPickers.has(sh.id)?'true':'false')+'">'+
        (ui.openPickers.has(sh.id)?'▴ cerrar comidas y platos':'▾ elegir/cambiar comidas y platos')+'</button></div>'+
      (ui.openPickers.has(sh.id)?dayPicker(sh.id):'')+
      '<div class="row" style="margin-top:11px">'+
        '<button class="btn s" data-a="slot-add" data-id="'+sh.id+'">+ Comida</button>'+
        '<button class="btn s" data-a="shift-edit" data-id="'+sh.id+'">Editar nombre y horario</button>'+
        '<button class="btn s" data-a="dup-day" data-id="'+sh.id+'">Duplicar día</button>'+
        '<span class="sp"></span><button class="btn d" data-a="shift-del" data-id="'+sh.id+'">Eliminar</button></div>'+
    '</div></div>';}
function renderTypesMeals(){
  $('#main').innerHTML='<div class="grid">'+
    menuSubcab('Comidas armadas',{v:'',t:'Menú'},'<span class="tag b2">'+store.meals.length+'</span>')+
    '<div class="card"><p class="note">Bloques reutilizables (el táper de guardia, el brunch del saliente…). Un cambio aquí actualiza todos los días que las usen.</p>'+
    (store.meals.map(function(m){const t=totals(m.items);
      return '<div class="res"><span class="nm"><b>'+esc(m.name)+'</b><span class="mini">'+
        m.items.map(function(it){const d=dishById(it.id);return d?esc(d.icon)+' '+esc(d.name)+(num(it.portions,1)>1?' ×'+fmt(it.portions):''):'';}).filter(Boolean).join(' + ')+
        (m.note?' · '+esc(m.note):'')+'</span></span>'+
        '<span class="tag b2">'+t.kcal+'</span>'+
        '<span class="row" style="gap:4px"><button class="btn s" data-a="meal-edit" data-id="'+m.id+'">editar</button>'+
        '<button class="btn d s" data-a="meal-del" data-id="'+m.id+'">×</button></span></div>';}).join('')||'<div class="empty">Ninguna todavía.</div>')+
    '<div class="row" style="margin-top:11px"><button class="btn p" data-a="meal-new">+ Crear comida</button></div></div></div>';}
/* «Catálogo de platos» y «Mis platos» pintaban los mismos store.dishes en dos pantallas, cada una
   con su buscador y sus botones de crear e importar. Ahora hay una, y el nombre viejo lleva a ella. */
function renderTypes(){
  const v=ui.typesVista||'';
  if(v==='meals')return renderTypesMeals();
  if(v==='dishes'){ui.typesVista='';ui.tab='food';ui.foodVista='platos';ui.platosTab='';return renderFood();}
  if(v&&shiftById(v))return renderTypesDia(v);
  return renderTypesLista();}
function slotRow(shiftId,s,i,count){
  /* cada toma es una TARJETA, no una fila de tabla. La fila metía hora, etiqueta, selector, kcal,
     tres botones y los platos en un grid de una línea: con un nombre de plato largo se salía de la
     pantalla (medido: 415 px de ancho en un móvil de 412). */
  const inf=slotItems(shiftId,s);
  const t=totals(inf.items);
  const mealOpt='<option value="">platos sueltos</option>'+store.meals.map(function(m){
    return '<option value="'+m.id+'"'+(s.mealId===m.id?' selected':'')+'>🍱 '+esc(m.name)+'</option>';}).join('');
  const dishOpt=function(id){return store.dishes.map(function(d){
    return '<option value="'+d.id+'"'+(d.id===id?' selected':'')+'>'+esc(d.icon)+' '+esc(d.name)+
      (isBatch(d.batchId)?' · '+esc((batchById(d.batchId)||{}).label||''):'')+'</option>';}).join('');};
  const cuerpo=inf.meal
    ? '<span class="pl arm">🍱 '+esc(inf.name)+(t.parts?(' <b>'+rac(t.parts)+'</b>'):'')+'</span>'
    : (inf.items.map(function(it,j){
        return '<span class="pl"><select data-a="it-dish" data-i="'+i+'" data-j="'+j+'" data-shift="'+shiftId+'">'+
          dishOpt(it.id)+'</select>'+
          '<input type="number" step="0.5" min="0.5" value="'+fmt(num(it.portions,1))+'" '+
            'data-a="it-port" data-i="'+i+'" data-j="'+j+'" data-shift="'+shiftId+'" aria-label="raciones">'+
          '<button class="x" data-a="it-del" data-i="'+i+'" data-j="'+j+'" data-shift="'+shiftId+'" aria-label="quitar el plato">×</button></span>';
      }).join('')||'<span class="mini">sin plato todavía</span>');
  const acciones=inf.meal
    ? '<button class="mini2" data-a="slot-meal-edit" data-i="'+i+'" data-shift="'+shiftId+'" title="se cambia en todos los días que la usen">editar la comida armada</button>'+
      '<button class="mini2" data-a="slot-loose" data-i="'+i+'" data-shift="'+shiftId+'" title="desmonta la comida solo en este día">montar suelto</button>'
    : '<button class="mini2" data-a="it-add" data-i="'+i+'" data-shift="'+shiftId+'">+ plato</button>'+
      (inf.items.length?('<button class="mini2" data-a="slot-tomeal" data-i="'+i+'" data-shift="'+shiftId+'" title="conviértela en una comida reutilizable">guardar como comida</button>'):'');
  return '<li class="toma2" data-slot="'+s.id+'" data-shift="'+shiftId+'">'+
    '<div class="cab">'+
      '<input class="st" value="'+esc(s.time||'')+'" placeholder="14:00" data-a="slot-time" data-i="'+i+'" data-shift="'+shiftId+'" aria-label="hora">'+
      '<input class="sl" value="'+esc(s.label||'')+'" placeholder="etiqueta de la comida" data-a="slot-label" data-i="'+i+'" data-shift="'+shiftId+'" aria-label="etiqueta">'+
      '<span class="kc">'+t.kcal+' kcal</span>'+
    '</div>'+
    '<div class="cuerpo">'+cuerpo+'</div>'+
    '<div class="acc">'+
      '<select class="sm" data-a="slot-meal" data-i="'+i+'" data-shift="'+shiftId+'" aria-label="comida armada">'+mealOpt+'</select>'+
      acciones+
      '<span class="sp"></span>'+
      '<button class="mini2 no-print" data-a="slot-up" data-i="'+i+'" data-shift="'+shiftId+'"'+(i===0?' disabled':'')+' title="subir" aria-label="subir">↑</button>'+
      '<button class="mini2 no-print" data-a="slot-down" data-i="'+i+'" data-shift="'+shiftId+'"'+(i>=count-1?' disabled':'')+' title="bajar" aria-label="bajar">↓</button>'+
      '<button class="mini2 d no-print" data-a="slot-del" data-i="'+i+'" data-shift="'+shiftId+'" title="quitar del día" aria-label="quitar la toma">×</button>'+
    '</div></li>';
}

/* ===================== render: cocina ===================== */
function renderBatches(){
  /* «Cocina en lote» ya no es una pantalla aparte: es la pestaña «En lote» de Cocina */
  ui.tab='food';ui.foodVista='cocina-panel';ui.cocinaTab='lote';
  return renderCocinaPanel();}

/* ---------- ingredientes y listas de la compra ---------- */
function parseIng(line){
  const raw=String(line).trim();
  if(!raw)return {q:'',unit:'',num:null,item:''};
  let rest=raw,num=null,head=null;
  /* cantidad: «500», «1,5», «1/2», «medio», «media» */
  let m=rest.match(/^(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)/);
  if(m){head=m[0];rest=rest.slice(head.length).trim();}
  else{m=rest.match(/^(medio|media)\b/i);if(m){head='0.5';rest=rest.slice(m[0].length).trim();}}
  if(head!=null){
    if(/\//.test(head)){const a=head.split('/').map(x=>parseFloat(x.trim().replace(',','.')));num=(a.length===2&&a[1])?a[0]/a[1]:null;}
    else num=parseFloat(head.replace(',','.'));
    if(isNaN(num))num=null;
  }
  /* unidad: sólo si va seguida de un espacio (así «lata» no se parte en «l» + «ata») */
  const UNITS=['g','kg','ml','l','litro','litros','cda','cucharada','cucharadas','cdta','cucharita','cucharitas',
    'lata','latas','bote','botes','diente','dientes','rebanada','rebanadas','rodaja','rodajas','pieza','piezas',
    'puñad','puñado','chorro','chorros','cabeza','cabezas','ramillete','manojo','paquete','paquetes','sobre','sobres','pastilla','pastillas'];
  let unit='';
  m=rest.match(/^([a-záéíóúñ]+)/i);
  if(m&&num!=null&&UNITS.indexOf(m[1].toLowerCase())>=0){unit=m[1].toLowerCase();rest=rest.slice(m[0].length).trim();}
  const item=rest.trim();
  if(num==null&&!item)return {q:raw,unit:'',num:null,item:raw};
  if(num==null&&!unit)return {q:'',unit:'',num:null,item:item||raw};
  return {num:num,unit:unit,q:(fmt(num)+(unit?' '+unit:'')).trim(),item:item||raw};
}
function ingredientsFor(list,exacto){
  /* suma los ingredientes de todas las recetas, escalados a lo que se cocina.
     En una tanda se cocina la receta ENTERA (no existe media tanda), así que se redondea hacia
     arriba. Lo que no es de tanda —la tostada del desayuno, la ensalada— se hace por raciones
     sueltas, y ahí redondear a receta entera multiplicaría la compra: con `exacto` se escala tal
     cual y el redondeo de la cantidad ya lo hace roundNice() al pintarla. */
  const map={};
  list.forEach(it=>{const d=it&&it.dish;if(!d)return;
    const per=d.portions||1;
    const raciones=(it.cooked&&isFinite(it.cooked)&&it.cooked>0)?it.cooked:per;
    const mm=exacto?(raciones/per):Math.max(1,Math.ceil(raciones/per));
    (d.ingredients||[]).forEach(line=>{const p=parseIng(line);if(!p.item)return;
      const key=p.item.toLowerCase()+'|'+(p.unit||'');
      if(!map[key])map[key]={item:p.item,unit:p.unit,num:0,hasNum:false,notes:new Set(),from:new Set()};
      const m=map[key];m.from.add(d.name);
      if(p.num!=null){m.num+=p.num*mm;m.hasNum=true;}
      else{const tail=p.q.replace(/^[\d.,\s/]+\s*[a-záéíóúñ]*\s*/i,'').trim();m.notes.add(tail||'al gusto');}});
  });
  return Object.keys(map).map(k=>{const m=map[k];
    const q=m.hasNum?fmt(roundNice(m.num))+(m.unit?' '+m.unit:''):'';
    /* el origen SIEMPRE dice de dónde sale: con un plato, su nombre; con dos, los dos; con más,
       la cuenta. Antes, una línea que venía de una sola receta se quedaba sin origen. */
    const de=m.from.size>2?(m.from.size+' recetas'):Array.from(m.from).join(' + ');
    const also=m.notes.size?(Array.from(m.notes).join('/')+(de?' · '+de:'')):de;
    return {q:q,unit:m.unit,num:m.hasNum?m.num:null,item:m.item,also:also};})
    .sort((a,b)=>a.item.localeCompare(b.item,'es'));
}
function mergeIng(dishes,scale){
  const map={};
  dishes.forEach(d=>{
    const per=(d.portions||1);
    const mult=typeof scale==='function'?scale(d):(scale||1);
    (d.ingredients||[]).forEach(line=>{
      const p=parseIng(line);if(!p.item)return;
      const key=(p.item.toLowerCase().replace(/\(.*?\)/g,'').trim()||p.item)+'|'+(p.unit||'');
      if(!map[key])map[key]={item:p.item,unit:p.unit,num:0,hasNum:false,notes:new Set()};
      if(p.num!=null){map[key].num+=p.num*mult;map[key].hasNum=true;}
      else map[key].notes.add(/[^\d]/.test(p.q)?p.q.replace(/^[^\s,]+\s*[a-záéíóúñ]*\s*/i,'').trim()||'al gusto':'al gusto');
    });
  });
  return Object.keys(map).map(k=>{const m=map[k];
    const q=m.hasNum?fmt(roundNice(m.num))+(m.unit?' '+m.unit:''):'';
    return {q:q,item:m.item+(m.notes.size&&!m.hasNum?' · '+Array.from(m.notes).join('/'):'')};})
    .sort((a,b)=>a.item.localeCompare(b.item,'es'));
}

/* ===================== render: compra ===================== */
/* ===================== listas de la compra propias ===================== */
function listasS(){if(!Array.isArray(store.listas))store.listas=[];return store.listas;}
function listaById(id){return listasS().filter(function(l){return l.id===id;})[0]||null;}
function addLista(nombre){
  const n=String(nombre||'').trim().slice(0,60);
  if(!n)return 'ponle un nombre a la lista';
  listasS().push({id:uid('ls'),nombre:n,fija:false,items:[]});
  save();render();return 'lista creada: '+n;}
function delLista(id){
  const ls=listasS(),i=ls.findIndex(function(l){return l.id===id;});
  if(i<0)return 'esa lista ya no estaba';
  const n=ls[i].nombre;ls.splice(i,1);save();render();return 'borrada: '+n;}
function addItemLista(id,txt){
  const l=listaById(id);if(!l)return 'esa lista ya no está';
  const t=String(txt||'').trim().slice(0,90);
  if(!t)return 'escribe qué hay que comprar';
  if(l.items.some(function(x){return x.toLowerCase()===t.toLowerCase();}))return 'eso ya está en la lista';
  l.items.push(t);save();render();return 'apuntado: '+t;}
function delItemLista(id,i){
  const l=listaById(id);if(!l||!l.items[i])return '';
  const t=l.items.splice(i,1)[0];save();render();return 'quitado: '+t;}
function itemsDeRutina(){
  /* lo que compras sí o sí: las listas marcadas «de rutina» entran solas en la compra de la semana */
  const out=[];
  listasS().forEach(function(l){if(!l.fija)return;
    l.items.forEach(function(x){out.push({texto:x,lista:l.nombre});});});
  return out;}
function platosConLista(items,minPct,max){
  /* «en base a esa lista, hacer los platos de la semana»: cuánto de cada receta cubre lo que compras.
     minPct y max son opcionales: la Compra enseña los 6 mejores por encima del 50 %, y «Qué cocino»
     los pide todos para poder separar los que salen enteros de los que casi. */
  const tengo=items.map(function(x){return String(x).toLowerCase();});
  /* la primera palabra de la línea de la compra («Pechuga de pollo» → «pechuga»); las de menos de
     4 letras se descartan para no encajar «sal» dentro de «salmón» */
  const claves=tengo.map(function(t){return (t.split(/[\s(,.]/)[0]||'');}).filter(function(t){return t.length>=4;});
  const cubre=function(ing){
    const it=parseIng(ing).item.toLowerCase();
    if(!it)return false;
    return tengo.some(function(t){return t.indexOf(it)>=0;})||claves.some(function(c){return it.indexOf(c)>=0;});};
  return (store.dishes||[]).map(function(d){
    const ing=(d.ingredients||[]);
    if(!ing.length)return null;
    const hay=ing.filter(cubre),faltan=ing.filter(function(x){return !cubre(x);});
    return {dish:d,pct:Math.round(hay.length/ing.length*100),faltan:faltan.map(function(x){return parseIng(x).item;})};})
    .filter(function(x){return x&&x.pct>=(minPct==null?50:minPct);})
    .sort(function(a,b){return b.pct-a.pct;})
    .slice(0,max==null?6:max);}
function listaTarjHTML(l){
  const items=l.items.map(function(x,i){
    return '<div class="frow"><span><span class="fm">'+esc(x)+'</span></span>'+
      '<span><button class="btn d s" data-a="lista-item-del" data-id="'+l.id+'" data-i="'+i+'" title="quitar">×</button></span></div>';}).join('');
  const sug=ui.listaPlatos===l.id?platosConLista(l.items):null;
  return '<div class="tarj'+(l.fija?' usada':'')+'" data-lista="'+l.id+'">'+
    '<div class="tarj-top">'+
      '<input class="tarj-nm" value="'+esc(l.nombre)+'" data-a="lista-nombre" data-id="'+l.id+'" aria-label="nombre de la lista">'+
      '<button class="btn s'+(l.fija?' g':'')+'" data-a="lista-fija" data-id="'+l.id+'" '+
        'title="si está activo, esta lista entra sola en la compra de la semana">'+(l.fija?'✓ de rutina':'○ de rutina')+'</button>'+
      '<button class="btn d" data-a="lista-del" data-id="'+l.id+'" title="borrar la lista">×</button>'+
    '</div>'+
    (items?('<div class="daylist" style="margin-top:8px">'+items+'</div>')
      :'<div class="empty" style="margin-top:8px">Lista vacía: apunta abajo lo que compras siempre.</div>')+
    '<div class="row" style="margin-top:8px;gap:6px">'+
      '<input id="lsNew-'+l.id+'" placeholder="añadir a la lista…" style="flex:1 1 150px">'+
      '<button class="btn s" data-a="lista-item-add" data-id="'+l.id+'">+</button>'+
      '<span class="sp"></span>'+
      '<button class="btn s" data-a="lista-platos" data-id="'+l.id+'">'+(sug?'ocultar platos':'qué platos salen ▸')+'</button>'+
    '</div>'+
    (sug?('<div style="margin-top:9px;padding-top:9px;border-top:1px dashed var(--line)">'+
      (sug.length?sug.map(function(x){
        return '<div class="frow"><span><span class="fn">'+esc(x.dish.icon||'🍽')+' '+esc(x.dish.name)+'</span>'+
          (x.faltan.length?'<span class="fm"> · te falta '+esc(x.faltan.slice(0,3).join(', '))+'</span>':'<span class="fm"> · lo tienes todo</span>')+'</span>'+
          '<span class="mini chipnum">'+x.pct+'%</span></div>';}).join('')
        :'<div class="empty">Con esta lista no sale ninguna receta entera todavía. Añade más cosas.</div>')+
      '</div>'):'')+
    '</div>';}

/* ===================== la compra =====================
   La lista era 59 casillas seguidas, sin agrupar y sin decir de dónde sale cada cosa, y con la
   tarjeta «Mis listas» por encima de la propia lista —que es lo que miras en el supermercado—.
   Ahora los datos se calculan una vez (compraDatos) y los usan la lista Y la cadena de la portada. */
function compraDatos(){
  const days=weekDays(), pb=planBatches(days), need=necesidadSemana(days);
  const agg={},order=[];let recetas=0,sueltas=0;
  /* un solo embudo para los dos orígenes: lo que se cocina en tanda y lo que no */
  const mete=function(ings){
    ings.forEach(function(i){
      const key=i.item.toLowerCase()+'|'+(i.unit||'');
      const n=parseFloat(String(i.q).replace(',','.'));
      if(!agg[key]){agg[key]={item:i.item,unit:i.unit,num:(isNaN(n)?null:n),hasNum:!isNaN(n),notes:new Set()};order.push(key);}
      else{const g=agg[key];if(!isNaN(n)&&g.hasNum)g.num+=n;else if(i.also)g.notes.add(i.also);}
      if(i.also)agg[key].notes.add(i.also);});};
  /* 1 · lo que se cocina en tandas: la receta entera, que no existe media tanda */
  Object.keys(pb).forEach(function(k){const b=pb[k];if(!b.hasNeed)return;
    const list=b.items.filter(function(i){return i.runs>0;});recetas+=list.length;
    mete(ingredientsFor(list));});
  /* 2 · lo que está en el menú y NO se cocina en tanda: por raciones sueltas. Esto es lo que
     faltaba: un plato del menú sin sesión de cocina no aportaba nada a la compra. */
  const sueltos=[],sinReceta=[];
  Object.keys(need).forEach(function(id){
    const d=dishById(id);if(!d||isBatch(d.batchId)||!(need[id]>0))return;
    if((d.ingredients||[]).length)sueltos.push({dish:d,cooked:need[id]});
    else sinReceta.push({d:d,q:need[id]});});
  if(sueltos.length){sueltas=sueltos.length;mete(ingredientsFor(sueltos,true));}
  const fresco=order.map(function(k){const m=agg[k];
    /* lo que se pesa se redondea a algo que se pueda comprar; lo que se CUENTA —aguacates, huevos,
       limones— sube a pieza entera: «0,5 aguacate» no existe en la frutería */
    const cant=m.hasNum?(m.unit?roundNice(m.num):Math.max(1,Math.ceil(m.num))):0;
    const q=m.hasNum?fmt(cant)+(m.unit?' '+m.unit:''):'al gusto';
    /* de dónde sale la línea. Con uno o dos platos se dicen sus nombres, que es lo útil en el
       supermercado («500 g lentejas · Lentejas estofadas»); con más, la cuenta, porque pegar cinco
       nombres hace una línea de tres renglones y la lista entera se va de largo. */
    const piezas=[];
    Array.from(m.notes).forEach(function(x){
      String(x).split(/\s*(?:·|\+|,)\s*/).forEach(function(t){
        t=t.trim();if(t&&piezas.indexOf(t)<0)piezas.push(t);});});
    const cuentas=piezas.map(function(x){const mm=/^(\d+) recetas$/.exec(x);return mm?+mm[1]:null;});
    const soloCuentas=piezas.length&&cuentas.every(function(c){return c!=null;});
    const de=soloCuentas?(Math.max.apply(Math,cuentas)+' recetas')
      :(piezas.length>2?(piezas.length+' recetas'):piezas.join(' + '));
    return {sort:m.item,texto:(m.hasNum?q+' ':'')+m.item+(m.unit&&!m.hasNum?' '+m.unit:''),de:de};});
  fresco.sort(function(a,b){return a.sort.localeCompare(b.sort,'es');});
  const key=(store.rotation.mode==='date'?iso(weekDate):'tpl'+store.rotation.pattern);
  /* la lista de origen solo se nombra si hay más de una «de rutina»: con una sola era repetir el
     mismo nombre en cada línea */
  const variasFijas=listasS().filter(function(l){return l.fija;}).length>1;
  const rutina=itemsDeRutina().map(function(r){
    return {id:'fija#'+r.texto,texto:r.texto,de:variasFijas?r.lista:''};});
  /* 3 · lo del menú que no tiene receta escrita (el café, la fruta del desayuno, un yogur): se
     compra tal cual. Antes esto se filtraba con una expresión regular —whey|prote|Caf|fruta—, así
     que cualquier otra cosa que te comieras a diario no llegaba nunca a la lista. */
  sinReceta.sort(function(a,b){return String(a.d.name).localeCompare(String(b.d.name),'es');});
  const talCual=sinReceta.map(function(x){
    return {id:'base#'+x.d.id,texto:fmt(x.q)+'× '+(x.d.icon?x.d.icon+' ':'')+x.d.name,
      de:'del menú de la semana'};});
  const grupos=[
    ['fresco','Fresco de esta semana',fresco.map(function(r){return {id:key+'#'+r.sort,texto:r.texto,de:r.de};})],
    ['rutina','De rutina',rutina],
    ['basicos','Del menú, sin receta',talCual]];
  /* EL CÍRCULO SE CIERRA AQUÍ. Lo que ya tienes en casa no hay que volver a comprarlo, así que
     sale de la cuenta y se pinta apagado; y en cuanto lo gastas y desaparece de la despensa,
     vuelve a la lista él solo. Sin esto, «la despensa baja al gastarla» no servía de nada: la
     lista seguía pidiendo lo mismo estuviera la nevera llena o vacía. */
  const desp=despensaS();
  grupos.forEach(function(g){g[2].forEach(function(x){
    const t=tengoEnCasa(x.texto,desp);
    if(t){x.tengo=t.txt;x.falta=t.falta;}});});
  let total=0,marcados=0;
  grupos.forEach(function(g){g[2].forEach(function(x){
    if(x.tengo&&!x.falta)return;        /* cubierto: no cuenta ni como pendiente ni como marcado */
    total++;if(ui.marks.has(x.id))marcados++;});});
  return {grupos:grupos,total:total,marcados:marcados,recetas:recetas,sueltas:sueltas};}
function tengoEnCasa(texto,despOpt){
  /* ¿esta línea de la compra ya está en casa? Devuelve null si no, y si sí, qué decir y si aun así
     falta algo. Compara cantidades cuando las dos las tienen y en la misma unidad; si no, tener
     algo cuenta como tenerlo. */
  const desp=despOpt||despensaS(),pi=parseIng(String(texto||''));
  const k=despClave(pi.item||texto);
  if(!k)return null;
  const hay=desp.filter(function(x){return x.k===k;})[0];
  if(!hay)return null;
  let uni=despUnidad(pi.unit),q=(pi.num!=null?pi.num:0);
  if(uni==='kg'){q=q*1000;uni='g';}
  if(uni==='l'){q=q*1000;uni='ml';}
  const enCasa=+hay.q||0;
  if(q>0&&enCasa>0&&uni&&hay.uni&&uni===hay.uni&&enCasa<q){
    const f=Math.round((q-enCasa)*100)/100;
    return {txt:'en casa '+fmt(enCasa)+' '+hay.uni+' · faltan '+fmt(f)+' '+hay.uni,falta:f};}
  return {txt:'ya en casa'+(enCasa?(': '+fmt(enCasa)+(hay.uni?(' '+hay.uni):'')):''),falta:0};}
/* ===================== por dónde pasas en el súper =====================
   La lista salía ordenada alfabéticamente: 52 artículos seguidos, del aceite al yogur, que con el
   carro en la mano son 52 viajes de un pasillo a otro. Agrupada por sección se recorre la tienda
   una vez. El orden es el de un supermercado normal: entras por la fruta y sales por la caja.
   OJO al orden de las reglas: lo específico va ANTES que lo general —«tomate triturado» es una
   conserva y «tomate» es fruta; «caldo de pollo» es un brik y «pollo» es carne—. */
const COMPRA_SECS=[
  ['verdura','Fruta y verdura','🥬'],
  ['carne','Carne','🍗'],
  ['pescado','Pescado','🐟'],
  ['lacteos','Huevos y lácteos','🧀'],
  ['pan','Panadería','🥖'],
  ['despensa','Despensa','🥫'],
  ['congelado','Congelados','❄️'],
  ['bebida','Bebidas','🧃'],
  ['otros','Otros','🛒']];
const COMPRA_REGLAS=[
  /* lo específico primero */
  [/congelad|helado/i,'congelado'],
  [/caldo|fumet/i,'despensa'],
  [/tomate (triturado|frito|natural|pelado)|salsa de tomate/i,'despensa'],
  [/pimiento (asado|del piquillo|en conserva)/i,'despensa'],
  [/(jengibre|\bajo\b|cebolla|pimiento|perejil|oregano|or[ée]gano) (molid|en polvo|seco)/i,'despensa'],
  /* OJO con las palabras cortas sin frontera: «lata» suelta casa con el trozo «p-LATA-no», así que
     el plátano acababa en el pasillo de las conservas. Lo mismo valdría para cualquier otra. */
  [/\b(en |de )?latas?\b|conserva|bote de|tarro/i,'despensa'],
  [/leche de (coco|almendra|avena|soja|arroz)/i,'despensa'],
  [/caf[ée]|infusi[óo]n|\bt[ée]\b|cacao|colacao/i,'despensa'],
  /* la leche de proteínas está en el frigorífico de lácteos, no en el pasillo de suplementos:
     sin esta regla la pillaba la de «proteína» y mandaba a la despensa un brik refrigerado */
  [/(leche|batido|yogur|queso|skyr) (de |con )?prote/i,'lacteos'],
  [/prote[íi]na|whey|caseina|case[íi]na|creatina|suplement/i,'despensa'],
  [/lomo de (salm[óo]n|at[úu]n|bacalao)|salm[óo]n|merluza|bacalao|at[úu]n fresco|gamba|langostino|marisco|pescad|boquer[óo]n|sardina|lubina|dorada/i,'pescado'],
  /* generales */
  [/pollo|pavo|pechuga|muslo|ternera|cerdo|lomo|chorizo|jam[óo]n|bacon|panceta|carne|solomillo|costilla|salchich|albóndiga|alb[óo]ndiga/i,'carne'],
  [/huevo|leche|yogur|queso|mantequilla|nata|k[ée]fir|reques[óo]n|cuajada|batido/i,'lacteos'],
  [/pan\b|panecillo|bollo|tortilla de (trigo|ma[íi]z)|wrap|masa madre|biscote|tostada/i,'pan'],
  [/agua|refresco|zumo|cerveza|vino|bebida/i,'bebida'],
  [/arroz|pasta|macarr|espagueti|fideo|lenteja|garbanzo|alubia|jud[íi]a blanca|avena|quinoa|cuscus|cusc[úu]s|harina|az[úu]car|miel|aceite|vinagre|\bsal\b|pimienta|piment[óo]n|curry|comino|canela|especia|frutos secos|almendra|nuez|nueces|anacardo|cacahuete|semilla|chia|ch[íi]a|levadura|caldo|galleta|cereal|mermelada|chocolate|at[úu]n/i,'despensa'],
  [/patata|boniato|cebolla|\bajos?\b|tomate|lechuga|canonigo|can[óo]nigo|espinaca|r[úu]cula|zanahoria|calabac[íi]n|calabaza|berenjena|pimiento|br[óo]coli|coliflor|jud[íi]a verde|guisante|esp[áa]rrago|champi[ñn][óo]n|seta|puerro|apio|pepino|aguacate|lim[óo]n|lima|naranja|mandarina|manzana|pl[áa]tano|banana|pera|fresa|ar[áa]ndano|frambuesa|kiwi|mango|pi[ñn]a|melon|mel[óo]n|sand[íi]a|uva|melocot[óo]n|nectarina|ciruela|higo|fruta|verdura|hortaliza|jengibre|perejil|cilantro|albahaca|hierbabuena|menta/i,'verdura']];
function reglasSinTildes(){
  /* las mismas reglas, con las tildes quitadas también del PATRÓN. Un ticket de súper viene en
     mayúsculas y sin tildes («PLATANO»), así que /plátano/ no casaba y el plátano acababa en el
     pasillo de la despensa. Se construye una vez. */
  if(!reglasSinTildes._c)reglasSinTildes._c=COMPRA_REGLAS.map(function(r){
    return [new RegExp(r[0].source.normalize('NFD').replace(/[̀-ͯ]/g,''),r[0].flags),r[1]];});
  return reglasSinTildes._c;}
function seccionDeCompra(texto){
  const t=String(texto||'').toLowerCase();
  for(let i=0;i<COMPRA_REGLAS.length;i++)if(COMPRA_REGLAS[i][0].test(t))return COMPRA_REGLAS[i][1];
  /* segundo intento sin tildes, por lo que venga del ticket o escrito a la carrera */
  const t2=alimTxt(texto),rr=reglasSinTildes();
  for(let j=0;j<rr.length;j++)if(rr[j][0].test(t2))return rr[j][1];
  return 'otros';}
function porSeccion(items){
  /* los artículos repartidos por pasillo, en el orden en el que se recorre la tienda */
  const por={};
  items.forEach(function(x){
    const k=seccionDeCompra(x.texto);
    (por[k]||(por[k]=[])).push(x);});
  return COMPRA_SECS.filter(function(sc){return (por[sc[0]]||[]).length;})
    .map(function(sc){
      const l=por[sc[0]].slice().sort(function(a,b){
        return String(a.texto).localeCompare(String(b.texto),'es');});
      return {k:sc[0],nom:sc[1],ico:sc[2],items:l};});}
function compraLineaHTML(x){
  const on=ui.marks.has(x.id);
  /* lo que ya está en la despensa se pinta apagado y con su cantidad: sigue en la lista para que
     veas que el menú lo pide, pero ya no te lo hace comprar */
  const ten=x.tengo&&!x.falta;
  return '<li class="linea'+(on?' ok':'')+(ten?' tengo':'')+'" data-a="mark" data-id="'+esc(x.id)+'">'+
    '<span class="box" role="checkbox" aria-checked="'+(on?'true':'false')+'"></span>'+
    '<span class="tx"><b>'+esc(x.texto)+'</b>'+
    (x.tengo?('<span class="de ten"><i></i>'+esc(x.tengo)+'</span>')
      :(x.de?('<span class="de"><i></i>'+esc(x.de)+'</span>'):''))+'</span></li>';}
let _compraUlt={total:0,marcados:0,cola:''};
function compraPinta(){
  /* en el supermercado se tocan veinte cosas seguidas: se actualiza la barra y la cifra a mano en
     vez de repintar la pantalla entera (que además cerraría el teclado y movería el scroll) */
  const bar=document.querySelector('#main .prog .bar i'),num=document.querySelector('#main .prog b'),
        tag=document.querySelector('#main .subcab .tag');
  if(!bar)return;
  const t=_compraUlt.total,m=Math.max(0,Math.min(t,_compraUlt.marcados));
  bar.style.width=(t?Math.round(m/t*100):0)+'%';
  if(num)num.textContent=m+' de '+t+(_compraUlt.cola||'');
  if(tag)tag.textContent=m+' / '+t;}
function compraCuenta(d,salida){
  /* lo que queda por coger EN ESTA SALIDA: sin el filtro es la lista entera, y con él solo su
     mitad. Lo que ya está en casa no cuenta en ninguna de las dos. */
  let total=0,marcados=0;
  d.grupos.forEach(function(g){g[2].forEach(function(x){
    if(x.tengo&&!x.falta)return;
    if(salida&&salida!=='todo'&&salidaDe(seccionDeCompra(x.texto))!==salida)return;
    total++;if(ui.marks.has(x.id))marcados++;});});
  return {total:total,marcados:marcados};}
function renderShop(){
  if(ui.shopVista==='listas')return renderShopListas();
  if(ui.shopVista==='ticket')return renderShopTicket();
  const d=compraDatos();
  const dias=diasDesdeCompra(),salida=ui.compraSalida||'todo';
  /* la cuenta es la de ESTA salida: en «Frutería» la barra tiene que ir de 0 a 18, no de 0 a 60,
     que si no nunca se llena y no dice nada de lo que llevas cogido en la frutería */
  const cnt=compraCuenta(d,salida);
  const pct=cnt.total?Math.round(cnt.marcados/cnt.total*100):0;
  const cola=(salida==='todo'?'':(' en la '+(salida==='fruteria'?'frutería':'compra del súper')));
  _compraUlt={total:cnt.total,marcados:cnt.marcados,cola:cola};
  const cuerpo=d.grupos.map(function(g){
    if(!g[2].length)return '';
    const abierto=!ui.compraCerradas||!ui.compraCerradas.has(g[0]);
    /* dentro de cada grupo, por pasillo: con 52 artículos en orden alfabético hacías el súper
       en zigzag. Cada pasillo se pliega solo cuando lo has terminado. */
    /* la frutería se hace en otro momento y en otro sitio: la fruta y la verdura por un lado y el
       súper por otro, para no llevar dos listas mezcladas en la mano */
    const secs=porSeccion(g[2]).filter(function(sc){
      return salida==='todo'||salidaDe(sc.k)===salida;});
    if(!secs.length)return '';
    /* con el filtro puesto queda un solo pasillo, y su cabecera sigue siendo útil: es la que lleva
       el 0/18 de lo que llevas cogido en la frutería */
    const dentro=(secs.length>1||salida!=='todo')
      ? secs.map(function(sc){
          const k2=g[0]+':'+sc.k;
          /* lo que ya está en casa cuenta como hecho: si no, un pasillo con tres cosas que ya
             tienes no se plegaba nunca y te lo hacía recorrer igual */
          const hechos=sc.items.filter(function(x){return ui.marks.has(x.id)||(x.tengo&&!x.falta);}).length;
          /* un pasillo que ya has terminado se pliega SOLO: la lista se va acortando según llenas
             el carro, que es lo contrario de lo que hacía —52 líneas fijas de principio a fin—.
             Se puede volver a abrir tocándolo, y entonces manda lo que tú digas. */
          const listo=sc.items.length>0&&hechos===sc.items.length;
          const ab2=(ui.compraAbiertas&&ui.compraAbiertas.has(k2))?true
            :((ui.compraCerradas&&ui.compraCerradas.has(k2))?false:!listo);
          return '<button class="pasillo'+(hechos===sc.items.length?' ok':'')+'" data-a="compra-sec" data-k="'+esc(k2)+'"'+
            ' aria-expanded="'+(ab2?'true':'false')+'">'+
            '<span class="i" aria-hidden="true">'+sc.ico+'</span><b>'+esc(sc.nom)+'</b>'+
            '<span class="n">'+hechos+'/'+sc.items.length+'</span>'+
            gymIco('chevron','gico sm ch'+(ab2?' abajo':''))+'</button>'+
            (ab2?('<ul class="lcompra">'+sc.items.map(compraLineaHTML).join('')+'</ul>'):'');}).join('')
      /* OJO: las líneas salen de `secs` y no de `g[2]`. Con el filtro en «Frutería» queda un solo
         pasillo, y pintar el grupo entero devolvía la lista completa del súper: 52 líneas en la
         pantalla que abres delante del puesto de fruta. */
      : ('<ul class="lcompra">'+secs[0].items.map(compraLineaHTML).join('')+'</ul>');
    return '<button class="seccion" data-a="compra-sec" data-k="'+g[0]+'" aria-expanded="'+(abierto?'true':'false')+'">'+
      /* la cifra del grupo también es de esta salida: decía 52 con 18 debajo */
      '<b>'+esc(g[1])+'</b><span class="n">'+secs.reduce(function(a,sc){return a+sc.items.length;},0)+'</span>'+
      gymIco('chevron','gico sm ch'+(abierto?' abajo':''))+'</button>'+
      (abierto?dentro:'');}).join('');
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="nav-comer">'+gymIco('atras','gico sm')+' Comer</button>'+
      '<h2 class="subtit">Compra</h2><span class="tag b2">'+cnt.marcados+' / '+cnt.total+'</span></div>'+
    '<div class="card">'+
      /* esto SÍ es progreso: cuántas cosas de la lista llevas ya en el carro */
      '<div class="prog"><span class="bar"><i style="width:'+pct+'%"></i></span><b>'+cnt.marcados+' de '+cnt.total+
        cola+'</b></div>'+
      /* tres renglones fijos de explicación en la pantalla que miras de pie con el carro: la
         misma información cabe en uno */
      '<p class="note" style="margin:0">Por pasillos, en el orden del súper. '+
        d.recetas+' receta'+(d.recetas===1?'':'s')+' de tanda'+
        (d.sueltas?(' y '+d.sueltas+' suelto'+(d.sueltas===1?'':'s')):'')+'.</p>'+
      '<div class="row" style="margin-top:9px">'+SALIDAS.map(function(x){
        return '<button class="btn s '+(salida===x[0]?'p':'')+'" data-a="compra-salida" data-v="'+x[0]+'">'+
          esc(x[1])+'</button>';}).join('')+'</div>'+
      (d.total?cuerpo:'<div class="empty">Sin tandas esta semana y sin listas «de rutina»: nada que comprar.</div>')+
    '</div>'+
    /* EL GESTO QUE UNE LA LISTA CON LA CASA. Sin esto la nevera había que rellenarla a mano una
       por una, así que nunca estaba al día y el menú no podía contar con ella. */
    '<div class="card">'+
      '<button class="btn p gbig" data-a="compra-hecha" data-solo="1">'+gymIco('ok','gico sm')+
        ' he hecho esta compra'+(cnt.marcados?(' ('+cnt.marcados+' marcadas)'):'')+'</button>'+
      '<p class="mini" style="margin:8px 0 0">Lo que marcaste pasa a la despensa con su cantidad, y la '+
      'lista se queda limpia. Lo que no marcaste sigue pendiente.'+
      (cnt.marcados?'':' <b>Marca antes lo que hayas echado al carro.</b>')+'</p>'+
      (dias!=null?('<p class="mini" style="margin:6px 0 0;color:var(--ink2)">Última compra hace '+dias+' día'+
        (dias===1?'':'s')+(dias>=compraCada()?' · toca':'')+'.</p>'):'')+
      /* cada cuánto la haces: con esto «Hoy» sabe cuándo avisarte, sin meterla en el calendario */
      '<div class="row" style="margin-top:9px;align-items:center">'+
        '<span class="mini">la hago cada</span>'+
        '<select data-a="compra-cada" style="width:auto">'+
          [['3','3 días'],['4','4 días (2 veces por semana)'],['7','7 días (1 vez por semana)']]
            .map(function(o){return '<option value="'+o[0]+'"'+(compraCada()===+o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+
        '</select></div>'+
    '</div>'+
    '<div class="row">'+
      '<button class="btn s" data-a="mark-clear">limpiar marcados</button>'+
      '<button class="btn s" data-a="print">imprimir</button>'+
      '<span class="sp"></span>'+
      '<button class="btn s" data-a="compra-listas">mis listas <span class="mini">('+listasS().length+')</span></button>'+
    '</div>'+
    /* el otro camino de meter la compra en casa: el ticket, que no depende de haber hecho la lista */
    '<div class="row">'+
      '<button class="btn s" data-a="compra-ticket">🧾 tengo el ticket →</button>'+
    '</div>'+
    /* la compra es el gasto más repetido de vivir solo: se apunta desde aquí, sin ir a buscarlo */
    '<div class="row">'+
      '<button class="btn s" data-a="dinero-compra">'+gymIco('mas','gico sm')+' apuntar lo que me he gastado</button>'+
    '</div></div>';
}
function listaManoCardHTML(){
  return '<div class="card"><h2>Pegar una lista</h2>'+
    '<p class="note">Una cosa por línea. Va a tu lista «A mano», que entra sola en la compra de la '+
    'semana. Sirve para lo que no sale de ningún menú: papel, bolsas, lo que te pidan en casa.</p>'+
    '<label class="fld">tu lista<textarea id="compraMano" rows="4" '+
      'placeholder="2 rollos de papel\n1 gel de ducha\n500 g arroz"></textarea></label>'+
    '<div class="row" style="margin-top:9px"><button class="btn p" data-a="compra-mano">añadir a la compra</button></div>'+
    '</div>';}
function renderShopTicket(){
  /* EL TICKET. Dos caminos, y el que sirve todos los días es el de pegar el texto: Claude solo
     existe dentro del Artifact de claude.ai, y la compra se hace con el móvil. */
  const t=ui.ticket||(ui.ticket={txt:'',leido:null,msg:''});
  const l=t.leido;
  const hayClaude=_sampleEstado==='si'&&!!_sampleFn;
  const puedeImagen=hayClaude&&!!(_sampleLim&&_sampleLim.images);
  const nImg=(t.imagenes&&t.imagenes.length)||0;
  const filas=l?l.items.map(function(x,i){
    const sc=COMPRA_SECS.filter(function(y){return y[0]===seccionDeCompra(x.nom);})[0];
    const glu=esCeliaco()?glutenChipHTML(glutenDe(x.nom),true):'';
    return '<div class="dfila">'+
      '<span class="i" aria-hidden="true">'+((sc&&sc[2])||'🛒')+'</span>'+
      '<span class="n">'+esc(x.nom)+glu+'</span>'+
      '<span class="q">'+fmtKg(x.q)+(x.uni?(' '+x.uni):'')+'</span>'+
      '<button class="btn d s" data-a="tk-quitar" data-i="'+i+'" aria-label="quitar">×</button>'+
      '</div>';}).join(''):'';
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="compra-volver">'+gymIco('atras','gico sm')+' Compra</button>'+
      '<h2 class="subtit">El ticket</h2></div>'+
    '<div class="card"><h2>Pega el ticket</h2>'+
      '<p class="note">El ticket electrónico de Mercadona (el de su app o el del correo) es texto: '+
      'pégalo aquí y entra la compra entera en la despensa. Esto funciona <b>sin conexión</b> y '+
      '<b>sin que nada salga del móvil</b>.</p>'+
      '<label class="fld">el ticket<textarea id="tkTxt" rows="6" placeholder="1 ACEITE OLIVA SUAVE     5,95&#10;2 LECHE SEMI      0,89     1,78&#10;0,894 kg TOMATE RAMA   2,19   1,96">'+esc(t.txt||'')+'</textarea></label>'+
      '<div class="row" style="margin-top:9px">'+
        '<button class="btn p" data-a="tk-leer">leerlo</button>'+
        '<button class="btn s" data-a="tk-pegar" title="pegar lo que tengas copiado">📋 pegar</button>'+
        (t.txt||l?'<button class="btn s" data-a="tk-limpiar">limpiar</button>':'')+
      '</div>'+
    '</div>'+
    /* la foto: se ofrece solo donde de verdad funciona, y diciendo que la foto sale del móvil */
    '<div class="card"><h2>📷 Una foto del ticket</h2>'+
      (puedeImagen
        ?('<p class="note">Le paso la foto a Claude y él saca la lista. <b>Ojo: la foto sale de tu '+
          'móvil</b> y viaja a Claude para que pueda leerla. Si prefieres que no salga nada, usa la caja de arriba.</p>'+
          '<div class="row">'+
            '<label class="btn s" style="cursor:pointer">elegir la foto'+
              '<input type="file" accept="'+esc((_sampleLim.images.mediaTypes||[]).join(','))+'" data-a="tk-foto" style="display:none">'+
            '</label>'+
            (nImg?('<span class="mini">'+nImg+' foto'+(nImg===1?'':'s')+' puesta'+(nImg===1?'':'s')+'</span>'+
              '<button class="btn p" data-a="tk-claude"'+(t.estado==='pensando'?' disabled':'')+'>'+
              (t.estado==='pensando'?'leyendo…':'que lo lea Claude')+'</button>'):'')+
          '</div>')
        :('<p class="note">Aquí no se puede: leer una foto necesita a Claude, y Claude solo está cuando '+
          'abres la app <b>dentro de claude.ai</b>. En el móvil, con la app instalada, no existe. '+
          'Por eso el camino de todos los días es pegar el texto del ticket, aquí arriba.</p>'))+
    '</div>'+
    (t.msg?('<div class="card"><div class="empty">'+esc(t.msg)+'</div></div>'):'')+
    (l?('<div class="card"><h2>Lo que he leído <span class="mini">'+l.items.length+'</span></h2>'+
      (l.total!=null?('<p class="mini" style="margin:0 0 8px">Total del ticket: <b>'+eur(l.total)+'</b>.</p>'):'')+
      (l.items.length?('<div class="dlista">'+filas+'</div>')
        :'<div class="empty">No he sacado ninguna línea. ¿Seguro que has pegado el detalle de los artículos?</div>')+
      (l.sueltas.length?('<p class="mini" style="margin:9px 0 0;color:var(--warn)">'+l.sueltas.length+
        ' línea'+(l.sueltas.length===1?'':'s')+' que no he entendido: '+esc(l.sueltas.slice(0,4).join(' / '))+
        (l.sueltas.length>4?'…':'')+'</p>'):'')+
      (l.items.length?('<div class="row" style="margin-top:11px">'+
        '<button class="btn p gbig" data-a="tk-aplicar">'+gymIco('ok','gico sm')+' a la despensa</button></div>'+
        (l.total!=null?('<div class="row" style="margin-top:7px">'+
          '<button class="btn s" data-a="tk-gasto">apuntar los '+eur(l.total)+' en Dinero</button></div>'):'')):'')+
      '</div>'):'')+
    '</div>';}
function renderShopListas(){
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="compra-volver">'+gymIco('atras','gico sm')+' Compra</button>'+
      '<h2 class="subtit">Mis listas</h2><span class="tag b2">'+listasS().length+'</span></div>'+
    '<div class="card">'+
      '<p class="note">Las listas que haces siempre. Márcalas «de rutina» y entran solas en la compra de la '+
      'semana; y con «qué platos salen» ves qué recetas puedes hacer con lo que llevas.</p>'+
      (listasS().map(listaTarjHTML).join('')||'<div class="empty">Todavía no tienes ninguna lista.</div>')+
      '<div class="row" style="margin-top:10px;gap:6px">'+
        '<input id="lsNueva" placeholder="nombre de la lista nueva…" style="flex:1 1 180px">'+
        '<button class="btn p" data-a="lista-add">+ Crear lista</button></div>'+
    '</div>'+
    listaManoCardHTML()+
    '</div>';
}

/* ===================== render: turno y rotación ===================== */
function suenoCard(){
  const c=suenoCfg(),base=despertarBase(),rec=acostarsePara(base),ven=ventanaCena(rec);
  const dias=(store.rotation.jornada&&store.rotation.jornada.workdays)||[1,2,3,4,5];
  const DN=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  return '<div class="card" data-cfg="sueno"><h2>2c · Dormir '+c.min+' h, sin excepciones</h2>'+
    '<p class="note">De lunes a viernes te levantas a las <b>'+esc(base)+'</b>, así que para tener tus '+c.min+' h hay que estar en la cama a las '
    +'<b>'+esc(rec)+'</b> (contando '+c.latencia+' min de quedarte dormido). La cena, entre '+(ven?ven.from+' y '+ven.to:'—')+
    ': de 3 h a 1,5 h antes de dormir, para no acostarse con la digestión a medias. Los días '+dias.map(function(x){return DN[x];}).join(', ')+'.</p>'+
    /* la latencia estaba en una tarjeta aparte, en Ajustes, que además avisaba de que «la ventana de
       la cena sigue en Turno y rotación → 2c»: eran dos editores a medias del mismo asunto. Aquí
       están los cuatro números del sueño juntos. */
    '<div class="fgrid c3"><label class="fld">Horas mínimas<input type="number" min="6" max="10" step="0.25" value="'+c.min+'" data-a="sueno-f" data-k="min"></label>'+
    '<label class="fld">Tardas en dormirte (min)<input type="number" min="0" max="60" value="'+c.latencia+'" data-a="sueno-f" data-k="latencia"></label>'+
    '<label class="fld">Cena antes (h)<input type="number" min="60" max="240" step="15" value="'+c.cenaMax+'" data-a="sueno-f" data-k="cenaMax"></label>'+
    '<label class="fld">Cena como pronto (h)<input type="number" min="30" max="120" step="15" value="'+c.cenaMin+'" data-a="sueno-f" data-k="cenaMin"></label>'+
    /* el día de después de una guardia se duerme dos veces: la siesta al llegar y la noche. Sin
       este número la app daba por dormidas las horas que estabas saliendo del hospital. */
    '<label class="fld">Siesta del saliente (min)<input type="number" min="0" max="480" step="15" value="'+c.siesta+'" data-a="sueno-f" data-k="siesta"></label></div>'+
    '<p class="mini" style="margin:8px 0 0">El día de después de una guardia no cuenta como una noche: de 00:00 hasta que te relevan sigues trabajando, luego duermes '+fmtHM(c.siesta)+' al llegar a casa y por la noche lo de siempre. Las dos salen en «Hoy» y en «Semana», con su propio mínimo cada una.</p>'+
    /* la comida principal no está a una hora fija: la manda lo que haces ese día */
    (function(){const cm=comidasCfg();
      return '<h3 style="font-size:13px;margin:14px 0 4px">A qué hora comes</h3>'+
      '<p class="note" style="margin:0 0 8px">La comida principal no tiene una hora fija: si ese día entrenas cae después del entreno, si no al salir de la jornada, y el día que sales de guardia, al despertar de la siesta.</p>'+
      '<div class="fgrid c3">'+
      '<label class="fld">Si entrenas, desde<input type="time" value="'+esc(cm.conEntreno.de)+'" data-a="com-h" data-k="conEntreno" data-w="de"></label>'+
      '<label class="fld">hasta<input type="time" value="'+esc(cm.conEntreno.a)+'" data-a="com-h" data-k="conEntreno" data-w="a"></label>'+
      '<label class="fld">Si no entrenas, desde<input type="time" value="'+esc(cm.sinEntreno.de)+'" data-a="com-h" data-k="sinEntreno" data-w="de"></label>'+
      '<label class="fld">hasta<input type="time" value="'+esc(cm.sinEntreno.a)+'" data-a="com-h" data-k="sinEntreno" data-w="a"></label>'+
      '<label class="fld">De saliente, tras la siesta (min)<input type="number" min="0" max="180" step="5" value="'+cm.trasSiesta+'" data-a="com-tras"></label>'+
      '</div>';})()+
    '<div class="row" style="margin-top:10px"><button class="btn p" data-a="sueno-fix">poner la cama a '+esc(rec)+' en los días de diario</button>'+
    '<button class="btn s" data-a="sueno-cenas">encajar la hora de la cena en los menús</button>'+
    '<span class="sp"></span><span class="mini">el acostarse se calcula a partir de tu despertador; si lo cambias arriba, vuelve a darle</span></div></div>';}
function aplicarAcostarse(){
  /* escribe la hora de dormir que garantiza el mínimo, solo en los días que madrugas como el de diario */
  const base=despertarBase(),rec=acostarsePara(base);
  if(!rec)return 'primero pon la hora de levantarte en el día de trabajo (arriba, tabla de horas)';
  if(!store.rhythm)store.rhythm={};
  let n=0;
  store.shifts.forEach(function(sh){
    const rh=store.rhythm[sh.id]||(store.rhythm[sh.id]=Object.assign({},(DEFAULTS().rhythm||{})[sh.id]||{}));
    if(!rh.wake||rh.wake!==base)return;
    if(/saliente|guardia|vacacion/i.test(sh.name||''))return;
    if(rh.sleep!==rec){rh.sleep=rec;n++;}});
  save();render();
  return n?('acostarse a las '+rec+' en '+n+' tipo(s) de día: '+c0(n)+' con '+suenoCfg().min+' h justitas'):
    ('ya estabas a las '+rec+': nada que cambiar');}
function c0(n){return n===1?'día':'días';}
function encajarCenas(){
  /* la cena de cada tipo de día se pone en su hueco de digestión (1,5-3 h antes de la cama) */
  let n=0;
  (store.shifts||[]).forEach(function(sh){
    const rh=rhythmOf(sh.id,null)||{};
    const rec=acostarsePara(rh.wake)||rh.sleep;if(!rec)return;
    const ven=ventanaCena(rec);if(!ven)return;
    (store.menu[sh.id]||[]).forEach(function(sl){
      if(!/cena/i.test(sl.label||''))return;
      if(sl.time!==ven.to){sl.time=ven.to;n++;}});});
  save();render();
  return n?('hora de cena ajustada en '+n+' toma(s) (a las '+ven0()+', con la digestión hecha)'):'las cenas ya estaban en su hora';}
function ven0(){const c=(store.shifts||[]).map(function(sh){const rh=rhythmOf(sh.id,null)||{};
  return ventanaCena(acostarsePara(rh.wake)||rh.sleep);}).filter(Boolean)[0];return c?c.to:'—';}
function renderCfg(){
  const r=store.rotation;
  /* un bloque por tipo de día en vez de una fila de tabla de 9 columnas: en el móvil la tabla
     obligaba a hacer scroll lateral y las horas no se leían (comentarios del usuario) */
  const shifts=store.shifts.map(s=>`<div class="tarj">
    <div class="tarj-top">
      <input class="tarj-ic" value="${esc(s.icon)}" data-a="sh-f" data-id="${s.id}" data-f="icon" maxlength="4" aria-label="icono">
      <input class="tarj-nm" value="${esc(s.name)}" data-a="sh-f" data-id="${s.id}" data-f="name" placeholder="nombre del día" aria-label="nombre">
      <input type="color" value="${esc(s.color||'#2563eb')}" data-a="sh-f" data-id="${s.id}" data-f="color" style="height:30px;width:42px;padding:2px;flex:none" aria-label="color">
      <button class="btn d" data-a="shift-del" data-id="${s.id}" title="quitar este tipo de día">×</button>
    </div>
    <div class="fgrid c3" style="margin-top:8px">
      <label class="fld">clave<input value="${esc(s.code)}" data-a="sh-f" data-id="${s.id}" data-f="code" maxlength="3" style="text-align:center"></label>
      <label class="fld">entra<input value="${esc(s.start)}" placeholder="08:00" data-a="sh-f" data-id="${s.id}" data-f="start"></label>
      <label class="fld">sale<input value="${esc(s.end)}" placeholder="15:00" data-a="sh-f" data-id="${s.id}" data-f="end"></label>
      <label class="fld">carga<select data-a="sh-f" data-id="${s.id}" data-f="intensity">${['bajo','medio','alto'].map(x=>`<option ${s.intensity===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <label class="fld" style="grid-column:1/-1">notas<input value="${esc(s.desc)}" data-a="sh-f" data-id="${s.id}" data-f="desc" placeholder="opcional"></label>
    </div>
    <!-- los dos atajos que vivían en una tarjeta aparte de 548 px en Ajustes, donde solo repetían
         lo que ya hay aquí: en su sitio son dos botones, no una pantalla -->
    <div class="row" style="margin-top:9px">
      <button class="btn s" data-a="day-rhythm-shift" data-id="${s.id}">🕐 sus horas →</button>
      <button class="btn s" data-a="day-edit" data-id="${s.id}">🍽 sus comidas →</button>
    </div></div>`).join('');
  const DSEM=['L','M','X','J','V','S','D'];
  const pats=store.patterns.map((p,pi)=>{
    const usada=pi===r.pattern;
    return `<div class="tarj${usada?' usada':''}">
      <div class="tarj-top">
        <input class="tarj-nm" value="${esc(p.name)}" data-a="pat-name" data-id="${p.id}" placeholder="nombre de la semana tipo" aria-label="nombre">
        ${usada?'<span class="tag b3">en uso</span>':`<button class="btn s" data-a="pat-use" data-id="${p.id}">usar</button>`}
        <button class="btn s" data-a="pat-copy" data-id="${p.id}" title="duplicar">⧉</button>
        <button class="btn d" data-a="pat-del" data-id="${p.id}" title="quitar">×</button>
      </div>
      <div class="semdias">${p.days.map((c,di)=>{const s=shiftById(resolveCode(c));
        return `<label class="semdia"><span>${DSEM[di]}</span>
          <select data-a="pat-day" data-id="${p.id}" data-d="${di}" style="border-color:${s?s.color:'var(--line)'}">${store.shifts.map(x=>`<option value="${esc(x.code)}" ${x.code===c?'selected':''}>${esc(x.code)}</option>`).join('')}</select>
          <b style="color:${s?s.color:'var(--ink2)'}">${s?esc(s.icon):'·'}</b></label>`;}).join('')}</div>
      <input value="${esc(p.note||'')}" placeholder="nota (cuándo usas esta semana)" data-a="pat-note" data-id="${p.id}" style="margin-top:8px;font-size:12px">
    </div>`}).join('');
  const SC=suenoCfg();
  /* mismas horas, pero cada tipo de día en su bloque con las etiquetas visibles al lado de cada hora */
  const rhythmRows=store.shifts.map(function(sh){
    const rh=(store.rhythm&&store.rhythm[sh.id])||{};
    const h=sleepHours(rh.sleep,rh.wake);
    const rec=acostarsePara(rh.wake),ven=ventanaCena(rec||rh.sleep);
    const falta=(h!=null&&h<SC.min)?Math.round((SC.min-h)*60):0;
    return '<div class="tarj"><div class="tarj-top">'+
      '<span class="tarj-ic" style="border:0;background:none">'+esc(sh.icon)+'</span>'+
      '<b style="flex:1;font-size:13.5px">'+esc(sh.name)+'</b>'+
      '<span class="tag '+(falta?'b4':'b3')+'">'+(h?fmtHM(h*60):'—')+(falta?(' · faltan '+falta+' min'):'')+'</span>'+
      '</div>'+
      '<div class="fgrid c3" style="margin-top:8px">'+
      RKEYS.map(function(k){return '<label class="fld">'+k[1]+
        '<input type="time" value="'+esc(rh[k[0]]||'')+'" data-a="rh-f" data-id="'+sh.id+'" data-f="'+k[0]+'"></label>';}).join('')+
      '</div>'+
      (rec?'<p class="mini" style="margin-top:8px">sugerido: 🛌 '+esc(rec)+' · 🍽 cena '+(ven?esc(ven.from)+'–'+esc(ven.to):'—')+'</p>':'')+
      '</div>';}).join('');
  /* Esto era UNA pantalla de 7 005 px —7,7 pantallas de móvil— con 126 campos seguidos: los seis
     tipos de día con sus ocho campos, la tabla de horas de levantarse y acostarse, la estructura
     semanal, la rotación por fecha y las notas. Y es lo primero que tocas al llegar a un destino
     nuevo. Mismo patrón que Comida: una portada que se lee de un vistazo y una pantalla por tarea. */
  const v=ui.cfgVista||'';
  if(v==='dias')return cfgPantalla('Mis tipos de día',
    '<div class="card"><p class="note" style="margin:0 0 10px">Los horarios reales de tu destino, un bloque por tipo de día. '+
      'Con el horario y la carga, la app ya sabe qué menú y qué tanda tocan.</p>'+shifts+
      '<div class="row" style="margin-top:10px"><button class="btn s" data-a="shift-new">+ añadir tipo de día</button></div></div>',
    store.shifts.length+' tipos');
  if(v==='horas')return cfgPantalla('A qué horas',
    '<div class="card"><p class="note" style="margin:0 0 10px">Se aplica por tipo de día; si un día concreto cambia, lo ajustas '+
      'en el calendario sin romper la plantilla. Con estas horas la app cuenta tus horas de sueño.</p>'+rhythmRows+
      '<div class="row" style="margin-top:9px">'+
        '<button class="btn s" data-a="bf-defaults">poner el desayuno rápido en los días de trabajar</button>'+
        '<button class="btn s" data-a="mon-autopos">'+(store.rotation.autoPos?'✓':'○')+' post-guardia automático</button></div>'+
      '<p class="mini" style="margin:9px 0 0">💡 si sales de guardia a las 08:00, el día siguiente no madrugues: el cuerpo pide 8 h y media</p>'+
    '</div>'+jornadaCard()+suenoCard());
  if(v==='semana')return cfgPantalla('Cómo se arma tu semana',
    semanaConfigHTML()+
    '<div class="card"><h2>Semanas tipo</h2><p class="note">Una tarjeta = una semana tipo. Ten una para <b>1 guardia</b> '+
      'y otra para <b>2 guardias</b>: en «Semana» eliges cuál se aplica y todo se recalcula.</p>'+pats+
      '<div class="row" style="margin-top:10px"><button class="btn s" data-a="pat-new">+ semana tipo</button>'+
      '<button class="btn s" data-a="autofill">autocompletar desde mi turno</button></div></div>',
    store.patterns.length+' semanas');
  if(v==='rotacion'){
    /* «Guardias y rotación» y «Mis rotaciones» vivían en Ajustes, y la propia tarjeta admitía que
       era «lo mismo que ves dentro de Mes → configurar este mes». Son de aquí: el ciclo, cuántas
       guardias tocan y por dónde rotas se deciden en el mismo sitio. */
    const sd=saltoDia(),tipos=gTipos();
    const cap=function(x){return x.charAt(0).toUpperCase()+x.slice(1);};
    const diaOpts=function(sel){return DOWN0.map(function(n,i){
      return '<option value="'+i+'" '+(i===sel?'selected':'')+'>'+cap(n)+'</option>';}).join('');};
    const jd=store.rotation.jornada||{};
    const ejemplo=function(t){
      /* un ejemplo de verdad, con las horas puestas, para no tener que fiarse de la explicación */
      const rs=t.relevoSem||jd.start||'08:00',rf=t.relevoFinde||'09:00';
      const sale=function(h){const m=mins(h);return m==null?h:hm(m+(+t.pase||0));};
      return 'martes: '+(jd.start||'08:00')+' jornada \u2192 guardia desde '+(jd.end||'15:00')+
        ', sales el miércoles a las '+sale(rs)+
        ' \u00b7 sábado: entras a las '+rf+' y sales el domingo a las '+sale(rf)+
        ' \u00b7 domingo: entras a las '+rf+' y sales el lunes a las '+sale(rs);};
    const tipoRows=tipos.map(function(t){
      return '<div class="tarj" style="margin-top:8px">'+
        '<div class="row">'+
        '<label class="fld" style="flex:1 1 150px">nombre<input value="'+esc(t.label)+'" data-a="gtipo-lbl" data-code="'+t.code+'"></label>'+
        '<label class="fld" style="flex:0 0 108px">cuántas al mes<input type="number" min="0" max="15" value="'+(+store.rotation.cupoTipos[t.code]||0)+'" data-a="gtipo-n" data-code="'+t.code+'"></label>'+
        '</div>'+
        '<div class="row" style="margin-top:6px">'+
        '<label class="fld" style="flex:0 0 132px">relevo L\u2013V<input type="time" value="'+esc(t.relevoSem||jd.start||'08:00')+'" data-a="gtipo-sem" data-code="'+t.code+'"></label>'+
        '<label class="fld" style="flex:0 0 142px">relevo sáb. y dom.<input type="time" value="'+esc(t.relevoFinde||'09:00')+'" data-a="gtipo-finde" data-code="'+t.code+'"></label>'+
        '<label class="fld" style="flex:0 0 132px">pase de guardia (min)<input type="number" min="0" max="480" step="5" value="'+(+t.pase||0)+'" data-a="gtipo-pase" data-code="'+t.code+'"></label>'+
        '</div>'+
        '<p class="mini" style="margin:7px 0 0">'+esc(ejemplo(t))+'</p>'+
      '</div>';}).join('');
    return cfgPantalla('Rotación por fecha',
    '<div class="card"><p class="note" style="margin:0 0 10px">Si tu calendario es un ciclo de semanas (1G·S → 2G·S·S → libre), '+
      'ordena las semanas del ciclo en «Cómo se arma tu semana» y pon aquí la fecha de un lunes que sepas qué semana era. '+
      'La app repite el ciclo sola; y si un día se tuerce, lo cambias en «Semana» sin romper la rotación.</p>'+
      '<div class="row">'+
        '<label class="fld">lunes de una semana con 1 guardia<input type="date" value="'+esc(r.anchor||'')+'" data-a="rot-anchor"></label>'+
        '<label class="fld" style="flex:0 0 130px">semana del ciclo<input type="number" value="'+(r.index||0)+'" disabled></label>'+
      '</div>'+
      '<p class="mini" style="margin:9px 0 0">modo activo: <b style="color:var(--ink)">'+(r.mode==='date'?'rotación por fecha':'plantilla')+'</b></p>'+
      '<div class="row" style="margin-top:9px"><button class="btn s" data-a="mode-date">activar rotación por fecha</button>'+
      '<button class="btn s" data-a="mode-template">volver a plantilla</button>'+
      '<button class="btn s" data-a="clear-overrides">quitar mis cambios a mano</button></div></div>'+
    `<div class="card"><h2>Guardias y rotación</h2>
      <p class="note">De fábrica: si la guardia cae en sábado, el saliente se pasa al lunes y el día de por medio queda libre. Si tu rotación descansa otro día, cámbialo aquí.</p>
      <div class="row">
        <label class="fld">Si la guardia cae en<select data-a="salto-from">${diaOpts(sd.from)}</select></label>
        <label class="fld">el saliente se pasa al<select data-a="salto-to">${diaOpts(sd.to)}</select></label>
      </div>
      <p class="mini" style="margin-top:8px">Ahora mismo: ${saltoDiaTxt()}.</p>
      <label class="fld" style="max-width:220px;margin-top:10px">Guardias por mes, por defecto (para un mes que no hayas tocado)
        <input type="number" min="0" max="15" value="${store.rotation.guardiasMes!=null?store.rotation.guardiasMes:6}" data-a="guard-default"></label>
      <p class="mini" style="margin-top:10px">Tipos de guardia, cuántas tocan al mes y <b>a qué hora se entra y se sale</b>. La regla es una sola: <b>sales a la hora del relevo del día en que sales</b>, porque es cuando entra el siguiente. Entre semana entras a tu jornada y la guardia empieza al acabarla; el fin de semana entras directamente a la hora del relevo. El pase de guardia son los minutos que te quedas de más al salir.</p>
      ${tipoRows}
      <div class="row" style="margin-top:8px">
        <label class="fld" style="flex:0 0 200px">añadir un tipo más<input id="gtipoNuevo" placeholder="p. ej. Guardias de placa"></label>
        <label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn s" data-a="gtipo-add">+ tipo</button></label>
      </div></div>
    <div class="card" data-cfg="rotaciones"><h2>Mis rotaciones</h2>
      <p class="note">Por dónde vas rotando y cuánto dura cada sitio. Si te salen rotaciones nuevas (R2 y demás), se añaden aquí.</p>
      ${serviciosEditorHTML()}
      <div class="row" style="margin-top:10px"><button class="btn s" data-a="ir-servicios">ver el año repartido ▸</button></div></div>`);}
  if(v==='notas')return cfgPantalla('Notas del planning',
    '<div class="card"><p class="note" style="margin:0 0 10px">Vacaciones, permisos, cursos, «esta semana cambio con Antonio».</p>'+
      '<textarea rows="8" data-a="meta-notes" placeholder="Vacaciones 3-17 de octubre; el 22 curso en academia…">'+esc(store.meta.notes||'')+'</textarea></div>');
  /* la portada: en qué estado está tu turno, y una puerta por tarea */
  const pat=store.patterns[r.pattern];
  const conHoras=store.shifts.filter(function(x){return x.start||x.end;}).length;
  const puerta=function(vista,ico,tit,sub){
    return '<button class="puerta" data-a="cfg-vista" data-v="'+vista+'">'+gymIco(ico)+
      '<b>'+esc(tit)+'</b><span class="s">'+esc(sub)+'</span></button>';};
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><h2 class="subtit">🕐 Turno y rotación</h2></div>'+
    '<div class="card"><h2>Cómo estás montado ahora</h2>'+
      '<div class="dosdatos">'+
        '<div><b>'+store.shifts.length+'</b><span>tipos de día</span></div>'+
        '<div><b>'+(r.mode==='date'?'por fecha':'plantilla')+'</b><span>cómo se arma la semana</span></div>'+
      '</div>'+
      '<p class="mini" style="margin:10px 0 0">'+
        (r.mode==='date'
          ?('Ciclo de '+store.patterns.length+' semana'+(store.patterns.length===1?'':'s')+
            (r.anchor?(', anclado al lunes '+esc(fechaCorta(r.anchor))):', <b style="color:var(--warn)">sin anclar todavía</b>'))
          :('Se repite la semana tipo «'+esc((pat&&pat.name)||'—')+'» todas las semanas.'))+
        ' · '+conHoras+' de '+store.shifts.length+' tipos con horario puesto.</p>'+
      '<div class="row" style="margin-top:11px"><button class="btn s" data-a="tab" data-t="week">ver mi semana →</button></div>'+
    '</div>'+
    '<div class="puertas">'+
      puerta('dias','reloj','Mis días',store.shifts.length+' tipos')+
      puerta('horas','cama','A qué horas','levantarse y dormir')+
      puerta('semana','calendario','Mi semana',r.mode==='date'?'ciclo de '+store.patterns.length:'plantilla')+
    '</div>'+
    '<div class="puertas">'+
      puerta('rotacion','repetir','Rotación','servicios y guardias')+
      puerta('notas','lapiz','Notas','del planning')+
      '<button class="puerta" data-a="tab" data-t="month">'+gymIco('calendario')+
        '<b>El año</b><span class="s">repartido por meses</span></button>'+
    '</div></div>';
}
function cfgPantalla(titulo,cuerpo,extra){
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="cfg-vista" data-v="">'+gymIco('atras','gico sm')+' Turno</button>'+
      '<h2 class="subtit">'+esc(titulo)+'</h2>'+(extra?('<span class="tag b2">'+esc(extra)+'</span>'):'')+'</div>'+
    cuerpo+'</div>';}

/* ===================== render: ajustes ===================== */
/* ===================== eventos que se repiten cada semana ===================== */
/* ===================== dinero =====================
   Lo mínimo que hace falta para vivir solo, y nada más: lo que pagas todos los meses el mismo día,
   lo que te has gastado de verdad, y lo que llevas. No estima precios ni se inventa nada: los
   números salen de lo que tú apuntas. */
const DIN_CAT=[['casa','🏠','casa y facturas'],['compra','🛒','compra'],['transporte','🚌','transporte'],
  ['estudio','📚','estudio'],['salud','💊','salud'],['ocio','🍻','ocio'],['otros','💳','otros']];
function dinCatIco(k){const c=DIN_CAT.filter(function(x){return x[0]===k;})[0];return c?c[1]:'💳';}
function dinCatTxt(k){const c=DIN_CAT.filter(function(x){return x[0]===k;})[0];return c?c[2]:'otros';}
function numEuro(v){
  /* «41,30» es como se escribe un importe en España, y un <input type="number"> lo rechaza en
     silencio: el campo se queda vacío y el gasto se pierde. Los importes van en campos de texto con
     teclado numérico, y se leen aceptando coma o punto. */
  const t=String(v==null?'':v).trim().replace(/[\s€]/g,'').replace(',','.');
  const n=parseFloat(t);
  return (isFinite(n)&&n>0)?Math.round(n*100)/100:0;}
function eur(n){
  const v=Math.round((+n||0)*100)/100;
  return (Math.abs(v%1)<0.005?String(Math.round(v)):v.toFixed(2).replace('.',','))+' €';}
function dineroS(){
  if(!store.dinero||typeof store.dinero!=='object')store.dinero={};
  const d=store.dinero;
  if(!Array.isArray(d.gastos))d.gastos=[];
  if(!Array.isArray(d.pagos))d.pagos=[];
  if(typeof d.presupuesto!=='number')d.presupuesto=0;
  return d;}
function gastosFijos(){
  return dineroS().gastos.filter(function(g){return g.on!==false;})
    .sort(function(a,b){return (a.dia||0)-(b.dia||0);});}
function diaDelMes(g,y,m){
  /* un recibo del 31 en un mes de 30 se cobra el último día: no se salta el mes */
  const ultimo=new Date(y,m+1,0).getDate();
  return Math.max(1,Math.min(ultimo,+g.dia||1));}
function fechaDeGasto(g,y,m){return iso(new Date(y,m,diaDelMes(g,y,m)));}
function pagosDelMes(y,m){
  const ini=iso(new Date(y,m,1)),fin=iso(new Date(y,m+1,0));
  return dineroS().pagos.filter(function(p){return p.fecha>=ini&&p.fecha<=fin;})
    .sort(function(a,b){return b.fecha.localeCompare(a.fecha)||b.ts-a.ts;});}
function gastoPagado(g,y,m){
  const ini=iso(new Date(y,m,1)),fin=iso(new Date(y,m+1,0));
  return dineroS().pagos.filter(function(p){
    return p.gastoId===g.id&&p.fecha>=ini&&p.fecha<=fin;})[0]||null;}
function mesDinero(y,m){
  const fijos=gastosFijos(),pagos=pagosDelMes(y,m);
  let pend=0,fijoTotal=0;
  fijos.forEach(function(g){fijoTotal+=+g.importe||0;if(!gastoPagado(g,y,m))pend+=+g.importe||0;});
  const pagado=pagos.reduce(function(a,p){return a+(+p.importe||0);},0);
  const porCat={};
  pagos.forEach(function(p){porCat[p.cat||'otros']=(porCat[p.cat||'otros']||0)+(+p.importe||0);});
  const pres=+dineroS().presupuesto||0;
  return {fijos:fijos,fijoTotal:fijoTotal,pend:pend,pagos:pagos,pagado:pagado,porCat:porCat,
    pres:pres,previsto:pagado+pend,queda:pres?(pres-pagado-pend):null};}
function gastosDeFecha(key){
  /* los fijos que tocan ese día: lo usan el Mes y Hoy */
  const d=parseDate(key);if(!d)return [];
  const y=d.getFullYear(),m=d.getMonth();
  return gastosFijos().filter(function(g){return diaDelMes(g,y,m)===d.getDate();});}
function addGasto(o){
  const d=dineroS();
  const g={id:uid('gt'),nombre:String((o&&o.nombre)||'').trim().slice(0,50)||'Gasto',
    importe:numEuro(o&&o.importe),
    dia:Math.max(1,Math.min(31,+(o&&o.dia)||1)),cat:(o&&o.cat)||'casa',on:true};
  if(!g.importe)return 'ponle un importe';
  d.gastos.push(g);save();
  return g.nombre+' · '+eur(g.importe)+' el día '+g.dia+' de cada mes';}
function delGasto(id){
  const d=dineroS(),i=d.gastos.findIndex(function(g){return g.id===id;});
  if(i<0)return 'ese gasto ya no está';
  const n=d.gastos[i].nombre;d.gastos.splice(i,1);
  /* los pagos ya hechos se quedan: son historia, y borrarlos cambiaría meses cerrados */
  d.pagos.forEach(function(p){if(p.gastoId===id)p.gastoId='';});
  save();return 'quitado «'+n+'» de los fijos (lo ya pagado se queda apuntado)';}
function addPago(o){
  const d=dineroS();
  const p={id:uid('pg'),fecha:(o&&o.fecha)||iso(new Date()),
    nombre:String((o&&o.nombre)||'').trim().slice(0,50)||'Gasto',
    importe:numEuro(o&&o.importe),
    cat:(o&&o.cat)||'otros',gastoId:(o&&o.gastoId)||'',ts:Date.now()};
  if(!p.importe)return 'ponle un importe';
  d.pagos.push(p);save();
  return 'apuntado: '+p.nombre+' · '+eur(p.importe);}
function delPago(id){
  const d=dineroS(),i=d.pagos.findIndex(function(p){return p.id===id;});
  if(i<0)return 'ese gasto ya no está';
  const p=d.pagos[i];d.pagos.splice(i,1);save();
  return 'quitado '+p.nombre+' ('+eur(p.importe)+')';}
function pagarGasto(id,y,m){
  const g=dineroS().gastos.filter(function(x){return x.id===id;})[0];
  if(!g)return 'ese gasto ya no está';
  const ya=gastoPagado(g,y,m);
  if(ya){delPago(ya.id);return g.nombre+': lo he desmarcado';}
  return addPago({fecha:fechaDeGasto(g,y,m),nombre:g.nombre,importe:g.importe,cat:g.cat,gastoId:g.id});}

function repasoHoyHTML(key){
  /* lo que esta app aporta sobre un temario suelto: que el repaso te salga en el día, al lado de
     lo que tienes que hacer y de lo que te toca pagar, y no solo si te acuerdas de entrar */
  if(!store.estudio||!estS().temas.length)return '';
  const t=estTocaHoy(key);
  if(!t.length)return '';
  const hoy=iso(new Date()),tarde=t.filter(function(x){const p=estProxima(x.id);return p&&p<hoy;}).length;
  return '<div class="card'+(tarde?' avisa':'')+'"><h2>Toca repasar <span class="mini">'+t.length+'</span></h2>'+
    t.slice(0,4).map(function(x){return estFilaHTML(x,true);}).join('')+
    (t.length>4?('<p class="mini" style="margin:9px 0 0">y '+(t.length-4)+' más.</p>'):'')+
    '<div class="row" style="margin-top:10px"><button class="btn s" data-a="ir-tab" data-t="estudio">ver Estudio →</button></div>'+
  '</div>';}
function tareasHoyHTML(){
  /* lo que toca hoy y lo que se te pasó, en «Hoy». Sin esto, una nota con día era algo que solo
     veías si te acordabas de entrar en la libreta. */
  const t=notasDeHoy();
  if(!t.hoy.length&&!t.tarde.length)return '';
  const n=t.hoy.length+t.tarde.length;
  return '<div class="card'+(t.tarde.length?' avisa':'')+'"><h2>Para hoy <span class="mini">'+n+'</span></h2>'+
    t.tarde.map(function(x){return notaFilaHTML(x);}).join('')+
    t.hoy.map(function(x){return notaFilaHTML(x);}).join('')+
    '<div class="row" style="margin-top:10px"><button class="btn s" data-a="tab" data-t="notas">abrir la libreta →</button></div>'+
  '</div>';}
function pagosHoyHTML(key){
  /* «hoy toca pagar el alquiler» es de las cosas que más se olvidan viviendo solo, y hasta ahora la
     app no lo sabía. Sale en Hoy, junto a los hábitos y los eventos. */
  const d=parseDate(key);if(!d)return '';
  const y=d.getFullYear(),m=d.getMonth();
  const hay=gastosDeFecha(key).filter(function(g){return !gastoPagado(g,y,m);});
  if(!hay.length)return '';
  const total=hay.reduce(function(a2,g){return a2+(+g.importe||0);},0);
  return '<div class="card avisa"><h2>Hoy toca pagar <span class="mini">'+esc(eur(total))+'</span></h2>'+
    hay.map(function(g){
      return '<div class="gfila">'+
        '<button class="tick" data-a="dinero-pagar" data-id="'+esc(g.id)+'" aria-label="marcar como pagado '+esc(g.nombre)+'"></button>'+
        '<span class="tx"><b>'+esc(dinCatIco(g.cat))+' '+esc(g.nombre)+'</b><span>'+esc(dinCatTxt(g.cat))+'</span></span>'+
        '<span class="im">'+esc(eur(g.importe))+'</span></div>';}).join('')+
    '<div class="row" style="margin-top:10px"><button class="btn s" data-a="tab" data-t="dinero">ver el mes entero →</button></div>'+
  '</div>';}
function renderDinero(){
  /* Dinero es AHORRO: la portada es cuánto cobras este mes, cuánto apartas y en qué huchas. Los
     gastos los lleva otra app; aquí solo quedan los recibos (salen en el calendario y en Google) y
     los «este mes intento gastar menos en…». */
  const v=ui.dineroVista||'';
  if(v==='fijos')return renderDineroFijos();
  if(v==='recibos')return renderDineroMes();
  if(v==='nomina')return renderAhorroNomina();
  if(v==='huchas')return renderAhorroHuchas();
  if(v==='fintonic')return renderFintonic();
  return renderAhorro();}
function dinSubcab(titulo,extra,volver){
  const vv=volver==null?'':volver;
  return '<div class="subcab">'+
    '<button class="btn s volver" data-a="dinero-vista" data-v="'+vv+'">'+gymIco('atras','gico sm')+' '+(vv==='recibos'?'Recibos':'Ahorro')+'</button>'+
    '<h2 class="subtit">'+esc(titulo)+'</h2>'+(extra||'')+'</div>';}
function renderDineroMes(){
  const hoy=new Date(),y=hoy.getFullYear(),m=hoy.getMonth();
  const d=mesDinero(y,m),hk=iso(hoy);
  const hoyToca=gastosDeFecha(hk).filter(function(g){return !gastoPagado(g,y,m);});
  const pct=d.pres?Math.min(100,Math.round((d.pagado+d.pend)/d.pres*100)):0;
  const filaFijo=function(g){
    const pg=gastoPagado(g,y,m),f=fechaDeGasto(g,y,m),vencido=!pg&&f<hk;
    return '<div class="gfila'+(pg?' ok':'')+(vencido?' tarde':'')+'">'+
      '<button class="tick" data-a="dinero-pagar" data-id="'+esc(g.id)+'" aria-pressed="'+(pg?'true':'false')+'" '+
        'aria-label="'+(pg?'desmarcar':'marcar como pagado')+' '+esc(g.nombre)+'"></button>'+
      '<span class="tx"><b>'+esc(dinCatIco(g.cat))+' '+esc(g.nombre)+'</b>'+
        '<span>día '+diaDelMes(g,y,m)+(pg?' · pagado':(vencido?' · pendiente, ya ha pasado':' · pendiente'))+'</span></span>'+
      '<span class="im">'+esc(eur(g.importe))+'</span></div>';};
  const cats=Object.keys(d.porCat).sort(function(a,b){return d.porCat[b]-d.porCat[a];});
  $('#main').innerHTML='<div class="grid">'+
    dinSubcab('Recibos del mes')+
    '<div class="card">'+
      '<div class="row" style="justify-content:space-between;margin-bottom:10px">'+
        '<b style="font-size:15px">'+esc(MONTH_FULL[m])+'</b>'+
        '<button class="btn s" data-a="dinero-pres">'+(d.pres?('✎ tope '+eur(d.pres)):'✎ poner un tope')+'</button></div>'+
      (d.pres?('<div class="prog"><span class="bar"><i class="'+(d.queda<0?'mal':'')+'" style="width:'+pct+'%"></i></span>'+
        '<b>'+esc(eur(Math.max(0,d.queda||0)))+'</b></div>'+
        '<p class="mini" style="margin:0 0 8px">'+(d.queda<0?('te has pasado '+eur(-d.queda)):('te quedan para el mes, contando lo que falta por pagar'))+'</p>'):'')+
      '<div class="dosdatos">'+
        '<div><b>'+esc(eur(d.pagado))+'</b><span>llevas gastado</span></div>'+
        '<div><b>'+esc(eur(d.pend))+'</b><span>falta por pagar</span></div>'+
      '</div>'+
      (cats.length?('<div class="chips" style="margin-top:11px">'+cats.map(function(k){
        return '<span class="chipx">'+esc(dinCatIco(k))+' '+esc(dinCatTxt(k))+' <b>'+esc(eur(d.porCat[k]))+'</b></span>';}).join('')+'</div>'):'')+
    '</div>'+
    '<button class="btn p gbig" data-a="dinero-apuntar">'+gymIco('mas','gico sm')+' apuntar un gasto</button>'+
    (hoyToca.length?('<div class="card avisa"><h2>Hoy toca pagar</h2>'+
      hoyToca.map(filaFijo).join('')+'</div>'):'')+
    '<div class="card"><h2>Todos los meses <span class="mini">'+esc(eur(d.fijoTotal))+'</span></h2>'+
      (d.fijos.length?d.fijos.filter(function(g){
        return !hoyToca.some(function(x){return x.id===g.id;});}).map(filaFijo).join(''):
        '<div class="empty">Apunta aquí el alquiler, la luz, el móvil, el gimnasio… y la app te dice cada mes qué falta por pagar.</div>')+
      '<div class="row" style="margin-top:11px"><button class="btn s" data-a="dinero-vista" data-v="fijos">'+
        gymIco('lapiz','gico sm')+' gastos fijos</button></div></div>'+
    '<div class="card"><h2>Lo de este mes <span class="mini">'+d.pagos.length+'</span></h2>'+
      (d.pagos.length?d.pagos.slice(0,12).map(function(p){
        return '<div class="gfila"><span class="em">'+esc(dinCatIco(p.cat))+'</span>'+
          '<span class="tx"><b>'+esc(p.nombre)+'</b><span>'+esc(fechaCorta(p.fecha))+' · '+esc(dinCatTxt(p.cat))+'</span></span>'+
          '<span class="im">'+esc(eur(p.importe))+'</span>'+
          '<button class="mini2 d" data-a="dinero-del-pago" data-id="'+esc(p.id)+'" aria-label="quitar">×</button></div>';}).join('')+
        (d.pagos.length>12?('<p class="mini" style="margin:9px 0 0">y '+(d.pagos.length-12)+' más este mes</p>'):''):
        '<div class="empty">Nada apuntado este mes.</div>')+
    '</div></div>';}
function renderDineroFijos(){
  const g=dineroS().gastos;
  const opts=function(sel){return DIN_CAT.map(function(c){
    return '<option value="'+c[0]+'"'+(c[0]===sel?' selected':'')+'>'+c[1]+' '+c[2]+'</option>';}).join('');};
  $('#main').innerHTML='<div class="grid">'+
    dinSubcab('Gastos fijos','<span class="tag b2">'+g.length+'</span>','recibos')+
    '<p class="note" style="margin:0">Lo que pagas todos los meses el mismo día. Sale en el Mes, en Hoy y en el resumen de arriba.</p>'+
    '<div class="card">'+(g.length?g.map(function(x){
      return '<div class="gedit" data-gasto="'+esc(x.id)+'">'+
        '<input class="gn" value="'+esc(x.nombre)+'" data-a="dinero-f" data-k="nombre" data-id="'+esc(x.id)+'" placeholder="alquiler" aria-label="nombre">'+
        '<input class="gi" type="text" inputmode="decimal" value="'+esc(fmt(+x.importe||0))+'" data-a="dinero-f" data-k="importe" data-id="'+esc(x.id)+'" aria-label="importe en euros">'+
        '<label class="gd">día<input type="number" min="1" max="31" value="'+(+x.dia||1)+'" data-a="dinero-f" data-k="dia" data-id="'+esc(x.id)+'"></label>'+
        '<select class="gc" data-a="dinero-f" data-k="cat" data-id="'+esc(x.id)+'" aria-label="categoría">'+opts(x.cat)+'</select>'+
        '<button class="mini2 d" data-a="dinero-del" data-id="'+esc(x.id)+'" aria-label="quitar '+esc(x.nombre)+'">×</button>'+
      '</div>';}).join(''):'<div class="empty">Todavía no tienes ninguno.</div>')+
    '</div>'+
    '<div class="card"><h2>Añadir uno</h2>'+
      '<div class="row" style="gap:6px">'+
        '<input id="gnNombre" placeholder="alquiler, luz, móvil, gimnasio…" style="flex:1 1 150px">'+
        '<input id="gnImporte" type="text" inputmode="decimal" placeholder="€" style="width:86px" aria-label="importe en euros">'+
        '<label class="fld" style="flex:0 0 78px">día<input id="gnDia" type="number" min="1" max="31" value="1"></label>'+
        '<select id="gnCat" style="flex:0 0 130px">'+opts('casa')+'</select>'+
        '<button class="btn p" data-a="dinero-add">+ añadir</button></div>'+
    '</div></div>';}

/* ===================== ahorro =====================
   Lo que pedía el usuario: «no me interesa llevar la cuenta de gastos, sino una ayuda para ahorrar:
   si este mes cobro tanto, cuánto quiero apartar, y dentro de eso qué es para no tocar, qué para
   viajes, qué para algún capricho».
   · la NÓMINA se estima sola: la app ya sabe cuántas guardias tienes y cuáles caen en finde (sábado,
     domingo o festivo), y cada «época» (R1 con IRPF 2 %, desde enero con ~20 %, R2…) dice cuánto se
     cobra con una de finde y cuánto suma cada una de más. Cuando llega la nómina se apunta lo
     cobrado de verdad y manda eso.
   · lo que APARTAS se reparte en HUCHAS por porcentaje; «ya lo he apartado» lo suma a cada una.
   · los RETOS («este mes intento gastar menos en salir») son lo único de gastos: si lo cumples, la
     diferencia va a una hucha.
   Todo se edita desde la app —épocas, pagas, festivos, huchas—, sin tocar código. */
const AHO_FESTIVOS=['2026-10-12','2026-12-08','2026-12-25','2027-01-01','2027-01-06','2027-03-25','2027-03-26',
  '2027-10-12','2027-11-01','2027-12-06','2027-12-08','2027-12-25'];
function ahorroS(){
  /* OJO: aquí solo se rellena lo que falte. La limpieza (el map de cada época y cada hucha) va en
     ahorroLimpia(), que corre al cargar: si se hiciera aquí, cada llamada crearía objetos nuevos y
     lo que se cambia en mitad de un bucle —el saldo de una hucha al repartir— se perdería */
  if(!store.ahorro||typeof store.ahorro!=='object')store.ahorro={};
  const a=store.ahorro;
  if(!Array.isArray(a.epocas)||!a.epocas.length)a.epocas=[
    {id:'ep-r1',nombre:'R1 · IRPF 2 %',desde:'2026-05',neto:2766,finde:300,pagaJun:0,pagaDic:733},
    {id:'ep-r1b',nombre:'R1 · IRPF ~20 %',desde:'2027-01',neto:2066,finde:100,pagaJun:733,pagaDic:733}];
  if(!a.cobrado||typeof a.cobrado!=='object'||Array.isArray(a.cobrado))a.cobrado={};
  if(!Array.isArray(a.festivos))a.festivos=AHO_FESTIVOS.slice();
  if(!Array.isArray(a.huchas))a.huchas=[
    {id:'hu-colchon',nombre:'Colchón',ico:'🔒',color:'#8b5cf6',pct:50,objetivo:0,meta:'no se toca',saldo:0},
    {id:'hu-viajes',nombre:'Viajes',ico:'✈️',color:'#38bdf8',pct:30,objetivo:0,meta:'',saldo:0},
    {id:'hu-caprichos',nombre:'Caprichos',ico:'🎁',color:'#fbbf24',pct:20,objetivo:0,meta:'para gastar sin culpa',saldo:0}];
  if(!a.meses||typeof a.meses!=='object'||Array.isArray(a.meses))a.meses={};
  if(!Array.isArray(a.movs))a.movs=[];
  if(typeof a.vivirMin!=='number')a.vivirMin=1000;
  return a;}
function ahorroLimpia(o){
  /* al cargar: lo guardado se deja en su forma (una copia vieja o tocada a mano no rompe nada) */
  if(!o.ahorro||typeof o.ahorro!=='object')return;
  const a=o.ahorro;
  if(Array.isArray(a.epocas))a.epocas=a.epocas.filter(function(e){return e&&e.id;}).map(function(e){return {id:String(e.id),
    nombre:String(e.nombre||'Época').slice(0,40),desde:/^\d{4}-\d{2}$/.test(e.desde||'')?e.desde:'2026-01',
    neto:Math.max(0,+e.neto||0),finde:+e.finde||0,pagaJun:Math.max(0,+e.pagaJun||0),pagaDic:Math.max(0,+e.pagaDic||0)};});
  if(Array.isArray(a.festivos))a.festivos=a.festivos.filter(function(f){return /^\d{4}-\d{2}-\d{2}$/.test(f);});
  if(Array.isArray(a.huchas))a.huchas=a.huchas.filter(function(h){return h&&h.id;}).map(function(h){return {id:String(h.id),
    nombre:String(h.nombre||'Hucha').slice(0,30),ico:String(h.ico||'🐷').slice(0,4),
    color:/^#[0-9a-fA-F]{6}$/.test(h.color||'')?h.color:'#8b5cf6',pct:Math.max(0,Math.min(100,+h.pct||0)),
    objetivo:Math.max(0,+h.objetivo||0),meta:String(h.meta||'').slice(0,60),saldo:Math.round((+h.saldo||0)*100)/100};});
  if(Array.isArray(a.movs))a.movs=a.movs.filter(function(m){return m&&m.hucha;}).slice(0,200);
  if(typeof a.vivirMin!=='number'||!(a.vivirMin>=0))a.vivirMin=1000;
  if(Array.isArray(a.real))a.real=a.real.filter(function(x){return x&&/^\d{4}-\d{2}-\d{2}$/.test(x.fecha||'');}).slice(0,36).map(function(x){
    const cats={};if(x.cats&&typeof x.cats==='object')Object.keys(x.cats).slice(0,40).forEach(function(k){const v=+x.cats[k];if(v>=0)cats[String(k).slice(0,40)]=v;});
    const n=function(v){return (v==null||v==='')?null:(isFinite(+v)?+v:null);};
    return {fecha:x.fecha,hora:/^\d{2}:\d{2}$/.test(x.hora||'')?x.hora:'',mes:/^\d{4}-\d{2}$/.test(x.mes||'')?x.mes:x.fecha.slice(0,7),
      banco:n(x.banco),ingresos:n(x.ingresos),gastos:n(x.gastos),cats:cats};});}
function ahoMk(y,m){return y+'-'+String(m+1).padStart(2,'0');}
function ahoYm(mk){const x=/^(\d{4})-(\d{2})$/.exec(mk||'');return x?{y:+x[1],m:+x[2]-1}:null;}
function ahoMesTxt(mk){const t=ahoYm(mk);return t?MONTH_FULL[t.m]:'';}
function epocaDe(mk){
  const ep=ahorroS().epocas.slice().sort(function(a,b){return a.desde.localeCompare(b.desde);});
  let r=ep[0]||null;ep.forEach(function(e){if(e.desde<=mk)r=e;});
  return r;}
function esFestivo(k){return ahorroS().festivos.indexOf(k)>=0;}
function guardiasDelMes(y,m){
  /* las de finde: sábado o domingo, y cualquier festivo (el viernes no, salvo que sea festivo) */
  const out={total:0,finde:0,dias:[]};
  monthDays(y,m).forEach(function(d){
    if(!d.shiftId||!isGuardia(shiftById(d.shiftId)))return;
    out.total++;
    const dw=d.date.getDay();
    if(dw===0||dw===6||esFestivo(d.key)){out.finde++;out.dias.push(d.key);}});
  return out;}
function nominaMes(y,m){
  const a=ahorroS(),mk=ahoMk(y,m),ep=epocaDe(mk),g=guardiasDelMes(y,m);
  /* un mes aún sin guardias puestas se estima como uno normal (con una de finde): contar cero
     guardias daría un sueldo que no vas a cobrar */
  const finde=g.total?g.finde:1;
  const base=ep?Math.max(0,ep.neto+(finde-1)*ep.finde):0;
  const paga=ep?(m===5?ep.pagaJun:(m===11?ep.pagaDic:0)):0;
  const est=Math.round(base+paga);
  const real=(typeof a.cobrado[mk]==='number')?a.cobrado[mk]:null;
  return {mk:mk,ep:ep,g:g,finde:finde,supuesto:!g.total,paga:paga,est:est,real:real,neto:real!=null?real:est};}
function recibosMes(y,m){return gastosFijos().reduce(function(t,g){return t+(+g.importe||0);},0);}
function redondea50(n){return Math.max(0,Math.floor((+n||0)/50)*50);}
function ahorroMes(mk,crear){
  const a=ahorroS();
  if(!a.meses[mk]&&crear){
    /* lo que apartas un mes nuevo: lo del anterior, o un 20 % de lo que cobras */
    const ant=Object.keys(a.meses).filter(function(k){return k<mk;}).sort().pop();
    const t=ahoYm(mk),nm=nominaMes(t.y,t.m);
    a.meses[mk]={aparto:ant?(+a.meses[ant].aparto||0):redondea50(nm.neto*0.2),hecho:false,reparto:{},retos:[]};}
  const x=a.meses[mk]||{aparto:0,hecho:false,reparto:{},retos:[]};
  if(!Array.isArray(x.retos))x.retos=[];
  if(!x.reparto||typeof x.reparto!=='object')x.reparto={};
  return x;}
function repartoDe(importe){
  /* por porcentaje, en euros enteros; lo que sobra del redondeo va a la primera hucha */
  const hs=ahorroS().huchas,tot=hs.reduce(function(t,h){return t+h.pct;},0)||1,out={};
  let usado=0;
  hs.forEach(function(h){const v=Math.floor(importe*h.pct/tot);out[h.id]=v;usado+=v;});
  if(hs.length)out[hs[0].id]+=Math.round(importe-usado);
  return out;}
function ahoMov(hucha,importe,txt){ahorroS().movs.unshift({fecha:iso(new Date()),hucha:hucha,importe:Math.round(importe*100)/100,txt:String(txt||'').slice(0,60)});
  ahorroS().movs=ahorroS().movs.slice(0,200);}
function apartarMes(mk){
  const x=ahorroMes(mk,true);
  if(x.hecho)return 'este mes ya estaba apartado';
  if(!(x.aparto>0))return 'pon primero cuánto apartas';
  const r=repartoDe(x.aparto);
  ahorroS().huchas.forEach(function(h){if(r[h.id]){h.saldo=Math.round((h.saldo+r[h.id])*100)/100;ahoMov(h.id,r[h.id],'apartado de '+ahoMesTxt(mk));}});
  x.reparto=r;x.hecho=true;save();render();
  return eur(x.aparto)+' repartidos en tus huchas';}
function deshacerApartado(mk){
  const x=ahorroMes(mk,false);
  if(!x.hecho)return 'no había nada apartado';
  ahorroS().huchas.forEach(function(h){const v=+x.reparto[h.id]||0;if(v){h.saldo=Math.round((h.saldo-v)*100)/100;ahoMov(h.id,-v,'deshecho '+ahoMesTxt(mk));}});
  x.reparto={};x.hecho=false;save();render();
  return 'deshecho: el dinero vuelve a estar sin apartar';}
function retoAhorro(r){return Math.max(0,(+r.antes||0)-(+r.max||0));}
function cerrarReto(mk,id,ok){
  const x=ahorroMes(mk,true),r=x.retos.filter(function(q){return q.id===id;})[0];
  if(!r)return 'ese reto ya no está';
  if(r.cerrado)return 'ya estaba cerrado';
  r.cerrado=true;r.ok=!!ok;
  if(ok){const v=+r.real>=0&&r.real!==''&&r.real!=null?Math.max(0,(+r.antes||0)-(+r.real||0)):retoAhorro(r);
    const h=ahorroS().huchas.filter(function(q){return q.id===r.hucha;})[0]||ahorroS().huchas[0];
    if(h&&v>0){h.saldo=Math.round((h.saldo+v)*100)/100;ahoMov(h.id,v,'reto: '+r.nombre);r.ganado=v;}}
  save();render();
  return ok?('¡bien! '+(r.ganado?eur(r.ganado)+' a la hucha':'reto cumplido')):'no pasa nada: el mes que viene';}
function sacarHucha(id,importe,txt,meter){
  /* sacar para el viaje, o meter a mano lo que ya tenías ahorrado de antes */
  const h=ahorroS().huchas.filter(function(q){return q.id===id;})[0];
  if(!h)return 'esa hucha no existe';
  const v=numEuro(importe);if(!v)return meter?'pon cuánto metes':'pon cuánto sacas';
  const d=meter?v:-v;
  h.saldo=Math.round((h.saldo+d)*100)/100;ahoMov(h.id,d,txt||(meter?'metido a mano':'sacado'));save();render();
  return eur(v)+(meter?' metidos en ':' sacados de ')+h.nombre;}
function proyeccionAhorro(n){
  /* los meses que vienen: lo que cobrarías, lo que apartarías y, si no te deja lo mínimo para
     vivir (con los recibos pagados), lo que la app te propone */
  const hoy=new Date(),a=ahorroS(),out=[];
  const actual=ahorroMes(ahoMk(hoy.getFullYear(),hoy.getMonth()),false);
  const fijos=recibosMes();
  for(let i=0;i<n;i++){
    const d=new Date(hoy.getFullYear(),hoy.getMonth()+i,1,12),y=d.getFullYear(),m=d.getMonth(),mk=ahoMk(y,m);
    const nm=nominaMes(y,m),x=a.meses[mk];
    const plan=x?(+x.aparto||0):(+actual.aparto||0);
    const vivir=nm.neto-plan-fijos;
    const sug=vivir<a.vivirMin?redondea50(nm.neto-fijos-a.vivirMin):plan;
    out.push({mk:mk,m:m,y:y,nm:nm,plan:plan,sug:Math.min(plan,sug),vivir:vivir,hecho:!!(x&&x.hecho),aviso:vivir<a.vivirMin});}
  return out;}
function renderAhorro(){
  const hoy=new Date(),y=hoy.getFullYear(),m=hoy.getMonth(),mk=ahoMk(y,m);
  const a=ahorroS(),nm=nominaMes(y,m),x=ahorroMes(mk,true),fijos=recibosMes();
  const pct=nm.neto?Math.round(x.aparto/nm.neto*100):0;
  const queda=nm.neto-x.aparto,vivir=queda-fijos;
  const r=x.hecho?x.reparto:repartoDe(x.aparto);
  const total=a.huchas.reduce(function(t,h){return t+h.saldo;},0);
  const diasF=nm.g.dias.map(function(k){const d=parseDate(k);return DIA3[d.getDay()]+' '+d.getDate();}).join(' · ');
  const expl=nm.real!=null?('lo cobrado de verdad'+(nm.est!==nm.real?(' · estimabas '+eur(nm.est)):'')):
    ((nm.supuesto?'sin guardias puestas: se cuenta 1 de finde':(nm.g.finde+' guardia'+(nm.g.finde===1?'':'s')+' de finde'+(diasF?' ('+diasF+')':'')+
      ' + '+(nm.g.total-nm.g.finde)+' entre semana'))+(nm.ep?' · '+nm.ep.nombre:'')+(nm.paga?' · paga extra '+eur(nm.paga):'')+' · estimado');
  const hucha=function(h){
    const pr=h.objetivo?Math.min(100,Math.round(h.saldo/h.objetivo*100)):0;
    return '<div class="ahhu"><span class="ic" style="background:color-mix(in srgb,'+h.color+' 25%,transparent)">'+esc(h.ico)+'</span>'+
      '<span class="t"><b>'+esc(h.nombre)+'</b><span>'+
        esc([h.meta,h.objetivo?(eur(h.saldo)+' de '+eur(h.objetivo)):'',h.pct+' % de lo que apartas'].filter(Boolean).join(' · '))+'</span>'+
        (h.objetivo?'<span class="prog"><i style="width:'+pr+'%;background:'+h.color+'"></i></span>':'')+'</span>'+
      '<span class="n"><b>'+esc(eur(h.saldo))+'</b>'+(r[h.id]?'<span class="'+(x.hecho?'ok':'')+'">'+(x.hecho?'+':'→ +')+esc(eur(r[h.id]))+'</span>':'')+'</span></div>';};
  const retos=x.retos.map(function(q){
    /* con el gasto de verdad (de Fintonic) ya no se promete: se dice cómo vas */
    const conReal=q.real!=null&&q.real!=='';
    const v=conReal?Math.max(0,(+q.antes||0)-(+q.real||0)):retoAhorro(q);
    const pasa=conReal&&(+q.real>+q.max);
    return '<div class="ahreto'+(q.cerrado?' cerrado':'')+'"><span class="ic">'+esc(q.ico||'🎯')+'</span>'+
      '<span class="t"><b>'+esc(q.nombre)+'</b><span>'+(conReal?('<b style="display:inline;font-size:11px;color:'+(pasa?'var(--warn)':'var(--ok)')+'">llevas '+esc(eur(q.real))+'</b> · '):'')+
        'máx '+esc(eur(q.max))+(q.antes?' · antes '+esc(eur(q.antes)):'')+
        ' · a '+esc(((a.huchas.filter(function(h){return h.id===q.hucha;})[0])||a.huchas[0]||{}).nombre||'—')+'</span></span>'+
      (q.cerrado?('<b class="'+(q.ok?'ok':'mini')+'">'+(q.ok?('✓ '+(q.ganado?'+'+eur(q.ganado):'')):'✗')+'</b>'):
        ((v&&!pasa?'<b class="ok">+'+esc(eur(v))+'</b>':'')+
        '<button class="btn s" data-a="aho-reto-ok" data-id="'+esc(q.id)+'" title="lo he cumplido">✓</button>'+
        '<button class="btn s" data-a="aho-reto-no" data-id="'+esc(q.id)+'" title="no lo he cumplido">✗</button>'))+
      '</div>';}).join('');
  const pr=proyeccionAhorro(6);
  const maxB=Math.max.apply(Math,pr.map(function(p){return p.sug;}).concat([1]));
  const avisos=pr.filter(function(p){return p.aviso;});
  const ult=pr[pr.length-1];
  $('#main').innerHTML='<div class="grid">'+
    '<div class="card ahhero">'+
      '<div class="row"><span class="ahe">'+esc(MONTH_FULL[m].toUpperCase())+' · NÓMINA</span><span class="sp"></span>'+
        '<button class="btn s" data-a="dinero-vista" data-v="nomina">✎ '+(nm.real!=null?'cobrado':'lo cobrado')+'</button></div>'+
      '<div class="ahbig">'+(nm.real!=null?'':'≈ ')+esc(eur(nm.neto))+'</div>'+
      '<div class="mini">'+esc(expl)+'</div>'+
      '<div class="ahapar"><span class="ahe">ESTE MES APARTO</span>'+
        '<div class="ahpm">'+(x.hecho?'':'<button class="btn s" data-a="aho-menos" aria-label="apartar 50 € menos">−</button>')+
          '<span class="ahbig" style="font-size:30px">'+esc(eur(x.aparto))+'</span>'+
          (x.hecho?'':'<button class="btn s" data-a="aho-mas" aria-label="apartar 50 € más">+</button>')+
          '<span class="sp"></span><span class="mini" style="text-align:right">'+pct+' %<br>del sueldo</span></div>'+
        '<div class="ahsplit">'+a.huchas.map(function(h){return r[h.id]?'<i style="flex:'+r[h.id]+';background:'+h.color+'" title="'+esc(h.nombre)+'"></i>':'';}).join('')+'</div>'+
        '<div class="mini" style="margin-top:8px">Te quedan <b>'+esc(eur(queda))+'</b>'+(fijos?' · menos '+esc(eur(fijos))+' de recibos = <b>'+esc(eur(vivir))+' para vivir</b>':'')+'</div>'+
        (vivir<a.vivirMin?'<div class="mini" style="color:var(--warn);margin-top:4px">⚠ por debajo de tu mínimo para vivir ('+esc(eur(a.vivirMin))+')</div>':'')+
      '</div>'+
      (x.hecho?('<div class="row" style="margin-top:12px"><span class="ok" style="font-weight:800">✓ apartado este mes</span><span class="sp"></span>'+
          '<button class="btn s" data-a="aho-deshacer">deshacer</button></div>'):
        '<button class="btn p gbig" style="margin-top:12px" data-a="aho-apartar">✓ ya lo he apartado</button>')+
    '</div>'+
    finRealHTML()+
    '<div class="card"><h2>Huchas <span class="mini">· '+esc(eur(total))+' en total</span></h2>'+
      (a.huchas.length?a.huchas.map(hucha).join(''):'<div class="empty">Sin huchas: crea una en «huchas y reparto».</div>')+
      '<div class="row" style="margin-top:8px"><button class="btn s" data-a="dinero-vista" data-v="huchas">✎ huchas y reparto</button></div></div>'+
    '<div class="card"><h2>Este mes intento gastar menos en…</h2>'+
      (retos||'<p class="mini" style="margin:0">Nada todavía. Por ejemplo: salir, máx 150 € (antes 220): si lo cumples, 70 € a la hucha.</p>')+
      (ui.ahoRetoNuevo?('<div class="ahform">'+
          '<input id="ahRtIco" value="🍻" maxlength="4" aria-label="icono" style="width:52px">'+
          '<input id="ahRtNom" placeholder="salir, pedir comida…" maxlength="40" style="flex:1 1 140px">'+
          '<input id="ahRtMax" inputmode="decimal" placeholder="máx €" style="width:78px" aria-label="máximo este mes">'+
          '<input id="ahRtAnt" inputmode="decimal" placeholder="antes €" style="width:80px" aria-label="lo que solías gastar">'+
          '<select id="ahRtHu" aria-label="hucha">'+a.huchas.map(function(h){return '<option value="'+esc(h.id)+'">'+esc(h.ico+' '+h.nombre)+'</option>';}).join('')+'</select>'+
          '<button class="btn p s" data-a="aho-reto-add">añadir</button></div>'):
        '<button class="btn s" style="margin-top:8px" data-a="aho-reto-nuevo">+ otro</button>')+
    '</div>'+
    '<div class="card"><h2>Lo que viene</h2>'+
      '<div class="ahmes">'+pr.map(function(p,i){
        return '<div class="'+(i===0?'ya':'')+(p.aviso?' aviso':'')+'"><i style="height:'+Math.max(6,Math.round(p.sug/maxB*60))+'px"></i>'+
          esc(MON[p.m])+'<br>'+esc(fmt(p.sug))+'</div>';}).join('')+'</div>'+
      (avisos.length?avisos.slice(0,1).map(function(p){
        return '<p class="mini" style="margin:8px 0 0">⚠ En <b>'+esc(MONTH_FULL[p.m])+'</b> cobrarías ~'+esc(eur(p.nm.neto))+
          (p.nm.ep?' ('+esc(p.nm.ep.nombre)+')':'')+'. Apartar '+esc(eur(p.plan))+' te dejaría '+esc(eur(p.vivir))+
          ' para vivir: la app te propone <b>'+esc(eur(p.sug))+'</b>'+(avisos.length>2?' (y lo mismo los '+(avisos.length-1)+' meses siguientes)':(avisos.length===2?' (y lo mismo el mes siguiente)':''))+'.</p>';}).join(''):'')+
      '<p class="mini" style="margin:6px 0 0">A este ritmo, en '+esc(MONTH_FULL[ult.m])+': '+a.huchas.map(function(h){
        const fut=h.saldo+pr.reduce(function(t,p,i){return t+((i===0&&x.hecho)?0:(repartoDe(p.sug)[h.id]||0));},0);
        return esc(h.nombre.toLowerCase())+' '+esc(eur(fut))+(h.objetivo&&fut>=h.objetivo?' ✓':'');}).join(' · ')+'</p>'+
    '</div>'+
    '<button class="card ahpuerta" data-a="dinero-vista" data-v="recibos"><span>🧾</span><span class="t"><b>Recibos del mes</b>'+
      '<span class="mini">'+esc(eur(fijos))+' · salen en el calendario</span></span><span class="mini">›</span></button>'+
    '<button class="card ahpuerta" data-a="dinero-vista" data-v="nomina"><span>💶</span><span class="t"><b>Tu nómina</b>'+
      '<span class="mini">'+esc(a.epocas.map(function(e){return e.nombre;}).join(' → '))+'</span></span><span class="mini">›</span></button>'+
  '</div>';}
function renderAhorroNomina(){
  const a=ahorroS(),hoy=new Date();
  const ep=a.epocas.slice().sort(function(p,q){return p.desde.localeCompare(q.desde);});
  const fila=function(e){
    const f=function(k,txt,val,tipo){return '<label class="fld">'+txt+'<input '+(tipo==='month'?'type="month"':'inputmode="decimal"')+
      ' value="'+esc(val)+'" data-a="aho-ep" data-id="'+esc(e.id)+'" data-k="'+k+'"></label>';};
    return '<div class="card ahep"><div class="row"><input class="ahepnom" value="'+esc(e.nombre)+'" data-a="aho-ep" data-id="'+esc(e.id)+'" data-k="nombre" aria-label="nombre de la época">'+
      '<button class="mini2 d" data-a="aho-ep-del" data-id="'+esc(e.id)+'" aria-label="quitar esta época">×</button></div>'+
      '<div class="fgrid c2 tight" style="margin-top:8px">'+f('desde','desde',e.desde,'month')+f('neto','neto con 1 finde',fmt(e.neto))+
        f('finde','cada finde de más',fmt(e.finde))+'<span></span>'+f('pagaJun','paga extra junio',fmt(e.pagaJun))+f('pagaDic','paga extra diciembre',fmt(e.pagaDic))+'</div></div>';};
  const meses=[];for(let i=-3;i<=1;i++){const d=new Date(hoy.getFullYear(),hoy.getMonth()+i,1,12);meses.push(nominaMes(d.getFullYear(),d.getMonth()));}
  $('#main').innerHTML='<div class="grid">'+dinSubcab('Tu nómina')+
    '<p class="note" style="margin:0">Tu sueldo depende de las guardias, y la app ya sabe cuántas tienes y cuáles caen en finde (sábado, domingo o festivo). Cada época dice cuánto cobras con una de finde y cuánto suma cada una de más; la de cada mes es la última que haya empezado. Cuando llegue la nómina, apunta lo cobrado y manda eso.</p>'+
    ep.map(fila).join('')+
    '<button class="btn s" data-a="aho-ep-add">+ otra época (R2, cambio de IRPF…)</button>'+
    '<div class="card"><h2>Lo cobrado de verdad</h2>'+meses.map(function(n){
      return '<div class="ahcob"><span class="t">'+esc(ahoMesTxt(n.mk))+'<span class="mini"> · estimado '+esc(eur(n.est))+'</span></span>'+
        '<input inputmode="decimal" placeholder="—" value="'+(n.real!=null?esc(fmt(n.real)):'')+'" data-a="aho-cobrado" data-mk="'+n.mk+'" aria-label="cobrado en '+esc(ahoMesTxt(n.mk))+'"></div>';}).join('')+'</div>'+
    '<div class="card"><h2>Cuándo llega</h2><p class="mini" style="margin:0 0 8px">Se transfiere ese día y tarda esos días hábiles: sábados, domingos y festivos no cuentan.</p>'+
      '<div class="row" style="gap:8px"><label class="fld" style="flex:1">se transfiere el día<input inputmode="numeric" value="'+nominaCfg().dia+'" data-a="nom-dia"></label>'+
      '<label class="fld" style="flex:1">días hábiles hasta que llega<input inputmode="numeric" value="'+nominaCfg().habiles+'" data-a="nom-habiles"></label></div>'+
      '<p class="mini" style="margin:8px 0 0">Las próximas: '+[0,1,2].map(function(i){const d=new Date(hoy.getFullYear(),hoy.getMonth()+i,1,12);
        const L=llegadaNomina(d.getFullYear(),d.getMonth());return esc(MON[d.getMonth()])+' → '+esc(DIA3[L.llega.getDay()]+' '+L.llega.getDate());}).join(' · ')+'</p></div>'+
    '<div class="card"><h2>Lo mínimo para vivir</h2><p class="mini" style="margin:0 0 8px">Después de apartar y de pagar los recibos. Si un mes no llega, la app te propone apartar menos.</p>'+
      '<input inputmode="decimal" value="'+esc(fmt(a.vivirMin))+'" data-a="aho-vivir" aria-label="mínimo para vivir" style="width:120px"></div>'+
    '<div class="card"><h2>Festivos <span class="mini">cuentan como guardia de finde</span></h2>'+
      '<div class="chips">'+a.festivos.slice().sort().map(function(f){const d=parseDate(f);
        return '<span class="chipx">'+esc(DIA3[d.getDay()]+' '+d.getDate()+' '+MON[d.getMonth()]+' '+String(d.getFullYear()).slice(2))+
          ' <button class="mini2 d" data-a="aho-fest-del" data-f="'+f+'" aria-label="quitar">×</button></span>';}).join('')+'</div>'+
      '<div class="row" style="margin-top:8px"><input type="date" id="ahFest"><button class="btn s" data-a="aho-fest-add">+ festivo</button></div>'+
      '<p class="mini" style="margin:6px 0 0">Vienen los nacionales; añade los de tu comunidad y tu ciudad.</p></div>'+
  '</div>';}
function renderAhorroHuchas(){
  const a=ahorroS(),tot=a.huchas.reduce(function(t,h){return t+h.pct;},0);
  $('#main').innerHTML='<div class="grid">'+dinSubcab('Huchas y reparto')+
    (tot!==100?'<p class="note" style="margin:0;color:var(--warn)">El reparto suma '+tot+' %: se reparte en proporción, pero lo normal es que sume 100.</p>':'')+
    a.huchas.map(function(h){
      const f=function(k,txt,val,w){return '<label class="fld"'+(w?' style="flex:'+w+'"':'')+'>'+txt+'<input '+(k==='nombre'||k==='meta'||k==='ico'?'':'inputmode="decimal" ')+
        'value="'+esc(val)+'" data-a="aho-hu" data-id="'+esc(h.id)+'" data-k="'+k+'"'+(k==='ico'?' maxlength="4"':'')+'></label>';};
      return '<div class="card ahhued" style="border-left:3px solid '+h.color+'">'+
        '<div class="row" style="gap:6px">'+f('ico','icono',h.ico,'0 0 62px')+f('nombre','nombre',h.nombre,'1 1 120px')+
          '<label class="fld" style="flex:0 0 52px">color<input type="color" value="'+esc(h.color)+'" data-a="aho-hu" data-id="'+esc(h.id)+'" data-k="color"></label></div>'+
        '<div class="row" style="gap:6px;margin-top:6px">'+f('pct','% de lo que apartas',h.pct,'1')+f('objetivo','meta (€, opcional)',h.objetivo?fmt(h.objetivo):'','1')+'</div>'+
        '<div class="row" style="gap:6px;margin-top:6px">'+f('meta','para qué','' +h.meta,'1')+'</div>'+
        '<div class="row" style="gap:6px;margin-top:8px;align-items:flex-end"><b style="font-size:15px">'+esc(eur(h.saldo))+'</b><span class="sp"></span>'+
          '<input id="ahSac-'+esc(h.id)+'" inputmode="decimal" placeholder="€" style="width:80px" aria-label="cuánto sacas">'+
          '<button class="btn s" data-a="aho-sacar" data-id="'+esc(h.id)+'">sacar</button>'+
          '<button class="btn s" data-a="aho-meter" data-id="'+esc(h.id)+'">meter</button>'+
          '<button class="mini2 d" data-a="aho-hu-del" data-id="'+esc(h.id)+'" aria-label="quitar la hucha">×</button></div></div>';}).join('')+
    '<button class="btn s" data-a="aho-hu-add">+ hucha</button>'+
    (a.movs.length?('<div class="card"><h2>Movimientos</h2>'+a.movs.slice(0,15).map(function(mv){
      const h=a.huchas.filter(function(q){return q.id===mv.hucha;})[0];
      return '<div class="ahcob"><span class="t">'+esc((h?h.ico+' ':'')+mv.txt)+'<span class="mini"> · '+esc(fechaCorta(mv.fecha))+'</span></span>'+
        '<b class="'+(mv.importe>=0?'ok':'')+'">'+(mv.importe>=0?'+':'')+esc(eur(mv.importe))+'</b></div>';}).join('')+'</div>'):'')+
  '</div>';}

/* ===================== lo real: capturas de Fintonic =====================
   «Mandar capturas de Fintonic para que se ajuste el dinero con los gastos reales y el dinero real
   que hay.» Se leen EN EL MÓVIL con Tesseract (vendor/ocr, ~6 MB que se bajan la primera vez y luego
   se quedan): nada sale del teléfono. Claude no sirve aquí: solo existe dentro de claude.ai.
   Medido con sus capturas: la pantalla de Inicio (Bancos 582 €, Gastos 1.578 €) se lee bien; la de
   categorías, con la letra fina de Fintonic, confunde la mitad de los importes (7→/, 6→0, la coma se
   pierde). Por eso lo leído NO se guarda solo: pasa por una pantalla de revisar, con lo dudoso
   marcado, y lo que cuadra con otra cifra (suma de categorías = gastos del mes) se da por bueno. */
const FIN_MESES={ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,sept:8,oct:9,nov:10,dic:11};
function finNum(tok,dec){
  /* un importe tal como lo deja el lector → {v, ok}. ok solo si tiene la forma exacta de Fintonic
     (1.578,40 € en Análisis y categorías; 1.578 € en Inicio) y no ha hecho falta cambiar letras */
  let t=String(tok||'').replace(/\s+/g,'').replace(/[€>»]/g,'');
  const neg=/^[-–]/.test(t);t=t.replace(/^[-–]+/,'');
  const cambiado=/[OoIl|]/.test(t);
  t=t.replace(/[Oo]/g,'0').replace(/[Il|]/g,'1');
  /* Fintonic nunca pone un cero delante («03,00» es un 63,00 mal leído): eso ya es dudoso */
  const exacto=dec?/^(0|[1-9]\d{0,2}(\.\d{3})*),\d{2}$/.test(t):/^(0|[1-9]\d{0,2}(\.\d{3})*)$/.test(t);
  let v;
  if(exacto)v=dec?+t.replace(/\./g,'').replace(',','.'):+t.replace(/\./g,'');
  else{const dg=t.replace(/\D/g,'');if(!dg)return null;
    v=dec&&dg.length>=3?(+dg)/100:+dg;}
  v=Math.round(v*100)/100;
  return {v:neg?-v:v,ok:exacto&&!cambiado};}
function finEtiqueta(txt){
  /* delante del nombre el lector deja basura de los iconos («e», «Ax», «EA», «+»): el nombre empieza
     en la primera palabra con mayúscula seguida de minúsculas */
  const ws=String(txt||'').trim().split(/\s+/);
  let i=0;while(i<ws.length&&!/^[A-ZÁÉÍÓÚÑ][a-záéíóúñü]{2,}/.test(ws[i]))i++;
  return ws.slice(i).join(' ').replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñü ,.y-]/g,'').trim();}
function finParse(texto){
  const out={banco:null,ingresos:null,gastos:null,neto:null,cats:[],mes:'',pantallas:[]};
  const lin=String(texto||'').split(/\n+/).map(function(l){return l.trim();}).filter(Boolean);
  const todo=lin.join('\n');
  const per=/(\d{1,2})\s*([a-zA-Z]{3,4})\.?\s*[-–]\s*(\d{1,2})\s*([a-zA-Z]{3,4})\.?\s*(\d{4})/.exec(todo);
  if(per&&FIN_MESES[per[4].toLowerCase()]!=null)out.mes=per[5]+'-'+String(FIN_MESES[per[4].toLowerCase()]+1).padStart(2,'0');
  /* Inicio: «Bancos 582€» y «Ingresos ↑ 11€ Gastos ↓ 1.578€», en euros enteros */
  const bn=/Bancos\s+([\dOoIl.]+)\s*€/.exec(todo);
  if(bn){out.banco=finNum(bn[1],false);out.pantallas.push('inicio');}
  const ig=/Ingresos\D{0,6}?([\dOoIl.]+)\s*€\s*Gastos\D{0,6}?([\dOoIl.]+)\s*€/.exec(todo);
  if(ig){out.ingresos=finNum(ig[1],false);out.gastos=finNum(ig[2],false);}
  /* Análisis: una cifra por línea y con céntimos */
  const an=function(re){const m=re.exec(todo);return m?finNum(m[1],true):null;};
  if(/An[aá]lisis|\bNeto\b/.test(todo)){
    out.pantallas.push('analisis');
    const i2=an(/Ingresos\s+(-?[\dOoIl.,\/ ]+?)\s*€/),g2=an(/Gastos\s+(-?[\dOoIl.,\/ ]+?)\s*€/),n2=an(/Neto\s+(-?[\dOoIl.,\/ ]+?)\s*€/);
    if(i2)out.ingresosAn=i2;
    if(g2)out.gastosAn={v:Math.abs(g2.v),ok:g2.ok};
    if(n2)out.neto=n2;}
  /* categorías: «Supermercado 283,06€ >» (las líneas «26 movimientos de 300€» son el presupuesto) */
  lin.forEach(function(l){
    if(/movimient|previstos|Ingresos|Gastos|Neto|Bancos|de\s*\d+\s*€/i.test(l))return;
    const m=/^(.*?[A-Za-záéíóúñ].*?)\s+(-?\d[\dOoIl.,\/ ]{0,12}?)\s*€/.exec(l);
    if(!m)return;
    const nom=finEtiqueta(m[1]);
    if(!nom||nom.length<3)return;
    const n=finNum(m[2],true);if(!n)return;
    out.cats.push({nombre:nom.slice(0,40),v:Math.abs(n.v),ok:n.ok});});
  if(out.cats.length&&out.pantallas.indexOf('categorias')<0)out.pantallas.push('categorias');
  return out;}
function finJunta(lista){
  /* varias capturas → una lectura: lo seguro gana a lo dudoso, y una categoría repetida en dos
     capturas (Efectivo sale en las dos listas) cuenta una vez */
  const r={banco:null,ingresos:null,gastos:null,neto:null,cats:[],mes:'',pantallas:[]};
  const mejor=function(a,b){if(!a)return b;if(!b)return a;return (b.ok&&!a.ok)?b:a;};
  const an={ingresos:null,gastos:null};
  lista.forEach(function(x){
    r.banco=mejor(r.banco,x.banco);r.neto=mejor(r.neto,x.neto);
    r.ingresos=mejor(r.ingresos,x.ingresos);r.gastos=mejor(r.gastos,x.gastos);
    an.ingresos=mejor(an.ingresos,x.ingresosAn);an.gastos=mejor(an.gastos,x.gastosAn);
    if(x.mes)r.mes=x.mes;
    x.pantallas.forEach(function(p){if(r.pantallas.indexOf(p)<0)r.pantallas.push(p);});
    x.cats.forEach(function(c){
      const k=c.nombre.toLowerCase(),y=r.cats.filter(function(q){return q.nombre.toLowerCase()===k;})[0];
      if(!y){r.cats.push(Object.assign({},c));return;}
      /* la misma categoría en dos capturas con dos cifras distintas: una de las dos está mal leída */
      if(Math.abs(y.v-c.v)>=0.01){y.ok=false;y.otra=c.v;}
      else if(c.ok)y.ok=true;});});
  /* Inicio (en euros enteros) y Análisis (con céntimos) dicen lo mismo dos veces: si cuadran, las
     dos son buenas y manda la de céntimos; si no, se enseña la que parezca buena marcada para
     revisar. Pasó con sus capturas: el «11 €» de Inicio se leyó «1 €» con toda la pinta de bueno. */
  ['ingresos','gastos'].forEach(function(k){
    const a=r[k],b=an[k];
    if(a&&b){if(Math.abs(a.v-b.v)<1)r[k]={v:b.v,ok:true};
      else r[k]={v:(b.ok?b.v:a.v),ok:false,otra:(b.ok?a.v:b.v)};}
    else if(b)r[k]=b;});
  /* la suma de las categorías tiene que dar el gasto del mes. Si da, todas son buenas; si no, alguna
     está mal leída aunque tenga buena pinta («603,00» por 63,00) y hay que mirarlas todas */
  if(r.gastos&&r.cats.length){const sum=Math.round(r.cats.reduce(function(t,c){return t+c.v;},0)*100)/100;
    r.suma=sum;
    if(Math.abs(sum-r.gastos.v)<0.5)r.cats.forEach(function(c){c.ok=true;});
    else{r.descuadre=Math.round((sum-r.gastos.v)*100)/100;r.cats.forEach(function(c){c.ok=false;});}}
  return r;}
/* --- cuándo llega la nómina: se transfiere el día 25 y tarda 2 días hábiles; sábados, domingos y
   festivos no cuentan, así que si el 25 cae en viernes o en fin de semana llega más tarde --- */
function nominaCfg(){const a=ahorroS();if(!a.nomina||typeof a.nomina!=='object')a.nomina={dia:25,habiles:2};
  a.nomina.dia=Math.max(1,Math.min(28,+a.nomina.dia||25));a.nomina.habiles=Math.max(0,Math.min(10,+a.nomina.habiles||0));return a.nomina;}
function esHabil(d){const w=d.getDay();return w!==0&&w!==6&&!esFestivo(iso(d));}
function llegadaNomina(y,m){
  const c=nominaCfg();let d=new Date(y,m,c.dia,12),n=0;
  while(n<c.habiles){d=addDays(d,1);if(esHabil(d))n++;}
  return {transfiere:new Date(y,m,c.dia,12),llega:d};}
function proximaNomina(desde){
  const d=parseDate(desde)||new Date();
  let L=llegadaNomina(d.getFullYear(),d.getMonth());
  if(iso(L.llega)<iso(d))L=llegadaNomina(d.getFullYear(),d.getMonth()+1);
  return L;}
function finUltima(){return (ahorroS().real||[])[0]||null;}
function finRetosDe(real){
  /* los retos del mes que se llaman como una categoría de Fintonic: «Restaurante» con «Restaurante» */
  if(!real||!real.cats)return [];
  const sa=function(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');};
  const x=ahorroMes(real.mes||ahoMk(new Date().getFullYear(),new Date().getMonth()),false);
  return x.retos.map(function(r){
    const k=Object.keys(real.cats).filter(function(c){return sa(c).indexOf(sa(r.nombre))>=0||sa(r.nombre).indexOf(sa(c))>=0;})[0];
    return k?{reto:r,cat:k,v:real.cats[k]}:null;}).filter(Boolean);}
function finRealHTML(){
  const u=finUltima(),hoy=iso(new Date());
  const L=proximaNomina(hoy),dias=Math.max(0,Math.round((parseDate(iso(L.llega))-parseDate(hoy))/86400000));
  const fch=function(d){return DIA3[d.getDay()]+' '+d.getDate();};
  const nom='<div class="finnom"><span>💶</span><span class="t"><b>'+(dias===0?'La nómina llega hoy':('La nómina llega el '+DOWN0[L.llega.getDay()]+' '+L.llega.getDate()))+'</b>'+
    '<span class="mini">se transfiere el '+esc(fch(L.transfiere))+' · '+nominaCfg().habiles+' días hábiles, sin fines de semana ni festivos</span></span>'+
    (dias?'<b>en '+dias+' día'+(dias===1?'':'s')+'</b>':'')+'</div>';
  const boton='<label class="btn s" style="cursor:pointer">📷 capturas<input type="file" accept="image/*" multiple data-a="fin-fotos" style="display:none"></label>';
  if(!u)return '<div class="card finreal"><div class="row"><span class="ahe">LO REAL · FINTONIC</span><span class="sp"></span>'+boton+'</div>'+
    '<p class="mini" style="margin:8px 0 0">Sube capturas de Fintonic —Inicio, Análisis y las categorías del mes— y aquí sale lo que tienes de verdad en el banco y lo que llevas gastado. Se leen en tu móvil; no sale nada de él.</p>'+nom+'</div>';
  const fu=parseDate(u.fecha),antesDeCobrar=u.fecha<=iso(L.llega)&&dias>0;
  const porDia=(u.banco!=null&&antesDeCobrar)?(u.banco/Math.max(1,dias)):null;
  const rt=finRetosDe(u);
  return '<div class="card finreal"><div class="row"><span class="ahe">LO REAL · FINTONIC · '+esc((fu?(fu.getDate()+' '+MON[fu.getMonth()]):'').toUpperCase())+
      (u.hora?' '+esc(u.hora):'')+'</span><span class="sp"></span>'+boton+'</div>'+
    '<div class="row" style="margin-top:8px;align-items:flex-end">'+
      (u.banco!=null?'<div><div class="ahbig" style="font-size:30px">'+esc(eur(u.banco))+'</div><div class="mini">en el banco</div></div>':'')+
      '<span class="sp"></span>'+
      (u.gastos!=null?'<div style="text-align:right"><b style="font-size:18px">'+esc(eur(u.gastos))+'</b><div class="mini">gastado en '+esc((ahoMesTxt(u.mes)||'el mes').slice(0,4))+'</div></div>':'')+'</div>'+
    nom+
    (porDia!=null?'<div class="mini" style="margin-top:6px">Hasta entonces: <b style="color:var(--ink)">'+esc(eur(u.banco))+' → '+esc(eur(Math.floor(porDia)))+' al día</b>'+
      (u.fecha<hoy?' <span style="color:var(--warn)">(saldo del '+esc(fechaCorta(u.fecha))+')</span>':'')+'</div>':'')+
    (rt.length?'<div class="mini" style="margin-top:6px">Tus retos: '+rt.map(function(x){const pasa=x.v>x.reto.max;
      return '<b style="color:var(--ink)">'+esc(x.reto.nombre)+'</b> '+esc(fmt(x.v))+' de '+esc(fmt(x.reto.max))+' €'+(pasa?' ⚠':' ✓');}).join(' · ')+'</div>':'')+
  '</div>';}
let _ocrCarga=null;
function ocrListo(){
  /* el lector se carga la primera vez que hace falta, no al abrir la app */
  if(_ocrCarga)return _ocrCarga;
  _ocrCarga=new Promise(function(ok,ko){
    if(window.Tesseract)return ok(window.Tesseract);
    const sc=document.createElement('script');sc.src=new URL('vendor/ocr/tesseract.min.js',location.href).href;
    sc.onload=function(){ok(window.Tesseract);};sc.onerror=function(){_ocrCarga=null;ko(new Error('no se ha podido cargar el lector'));};
    document.head.appendChild(sc);});
  return _ocrCarga;}
function ocrPrepara(file){
  /* ampliar ×2, a blanco y negro y engordar el trazo un píxel: la letra de Fintonic es muy fina y,
     tal cual, el lector se come las comas. Medido con sus capturas: así se leen bien las de Inicio */
  return new Promise(function(ok,ko){
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=function(){URL.revokeObjectURL(url);
      const k=Math.min(2,2400/Math.max(1,img.width));
      const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
      const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(img,0,0,c.width,c.height);
      const d=x.getImageData(0,0,c.width,c.height),a=d.data,W=c.width,H=c.height;
      const g=new Uint8Array(W*H);
      for(let i=0,j=0;i<a.length;i+=4,j++)g[j]=(.299*a[i]+.587*a[i+1]+.114*a[i+2])<200?0:255;
      for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){let m=255;
        for(let dy=-1;dy<=1&&m;dy++){const y2=yy+dy;if(y2<0||y2>=H)continue;
          for(let dx=-1;dx<=1;dx++){const x2=xx+dx;if(x2<0||x2>=W)continue;if(!g[y2*W+x2]){m=0;break;}}}
        const i=(yy*W+xx)*4;a[i]=a[i+1]=a[i+2]=m;a[i+3]=255;}
      x.putImageData(d,0,0);ok(c);};
    img.onerror=function(){URL.revokeObjectURL(url);ko(new Error('esa imagen no se puede abrir'));};
    img.src=url;});}
function finLeer(files){
  const fs=Array.prototype.slice.call(files||[]).filter(function(f){return /^image\//.test(f.type||'image/');}).slice(0,8);
  if(!fs.length){flash('elige alguna captura');return Promise.resolve();}
  /* la fecha de la captura es la del archivo: la del día en que la hiciste, no la de hoy */
  const ult=fs.reduce(function(t,f){return Math.max(t,+f.lastModified||0);},0)||Date.now();
  const cuando=new Date(ult);
  ui.fin={estado:'leyendo',hechas:0,total:fs.length,res:null,msg:'',fecha:iso(cuando),
    hora:String(cuando.getHours()).padStart(2,'0')+':'+String(cuando.getMinutes()).padStart(2,'0')};
  ui.dineroVista='fintonic';render();window.scrollTo(0,0);
  const base=new URL('vendor/ocr/',location.href).href;
  let worker=null;const lecturas=[];
  return ocrListo().then(function(T){
    return T.createWorker('spa',1,{workerPath:base+'worker.min.js',corePath:base+'tesseract-core-lstm.wasm.js',
      langPath:base.replace(/\/$/,''),gzip:true});
  }).then(function(w){worker=w;
    return fs.reduce(function(p,f){return p.then(function(){
      return ocrPrepara(f).then(function(c){return worker.recognize(c);}).then(function(r){
        lecturas.push(finParse(r.data.text||''));
        if(ui.fin){ui.fin.hechas++;if(ui.dineroVista==='fintonic')render();}});});},Promise.resolve());
  }).then(function(){
    const r=finJunta(lecturas);
    if(!r.mes)r.mes=ui.fin.fecha.slice(0,7);
    ui.fin.res=r;ui.fin.estado=(r.banco||r.gastos||r.cats.length)?'listo':'nada';
    if(ui.fin.estado==='nada')ui.fin.msg='No he encontrado cifras de Fintonic en esas capturas. ¿Son de Inicio, de Análisis o de las categorías?';
  }).catch(function(e){ui.fin.estado='error';ui.fin.msg=(e&&e.message)||'no se ha podido leer';
  }).then(function(){if(worker)worker.terminate().catch(function(){});render();});}
function finGuardar(){
  const f=ui.fin;if(!f||!f.res)return 'no hay nada leído';
  const r=f.res,a=ahorroS();
  if(!Array.isArray(a.real))a.real=[];
  const cats={};r.cats.forEach(function(c){if(c.v>0)cats[c.nombre]=c.v;});
  const reg={fecha:f.fecha,hora:f.hora||'',mes:r.mes,banco:r.banco?r.banco.v:null,ingresos:r.ingresos?r.ingresos.v:null,
    gastos:r.gastos?r.gastos.v:null,cats:cats};
  a.real=[reg].concat(a.real.filter(function(x){return !(x.fecha===reg.fecha&&x.hora===reg.hora);}))
    .sort(function(p,q){return (q.fecha+q.hora).localeCompare(p.fecha+p.hora);}).slice(0,36);
  /* los retos de ese mes que se llaman como una categoría se quedan con el gasto de verdad */
  finRetosDe(reg).forEach(function(x){x.reto.real=x.v;});
  ui.fin=null;ui.dineroVista='';save();render();window.scrollTo(0,0);
  return 'guardado lo del '+fechaCorta(reg.fecha);}
function renderFintonic(){
  const f=ui.fin;
  const cab=dinSubcab('Revisa lo leído');
  if(!f){$('#main').innerHTML='<div class="grid">'+cab+'<div class="card"><div class="empty">No hay capturas leyéndose.</div></div></div>';return;}
  if(f.estado==='leyendo'){$('#main').innerHTML='<div class="grid">'+cab+
    '<div class="card"><h2>Leyendo '+(f.hechas+1>f.total?f.total:f.hechas+1)+' de '+f.total+'…</h2>'+
    '<div class="prog"><span class="bar"><i style="width:'+Math.round(f.hechas/Math.max(1,f.total)*100)+'%"></i></span></div>'+
    '<p class="mini" style="margin:8px 0 0">La primera vez se descarga el lector (unos 6 MB); después funciona sin internet. Las capturas se leen aquí, en tu móvil.</p></div></div>';return;}
  if(f.estado!=='listo'){$('#main').innerHTML='<div class="grid">'+cab+'<div class="card"><div class="empty">'+esc(f.msg||'no se ha podido leer')+'</div>'+
    '<label class="btn s" style="cursor:pointer;margin-top:10px">📷 probar con otras<input type="file" accept="image/*" multiple data-a="fin-fotos" style="display:none"></label></div></div>';return;}
  const r=f.res;
  const campo=function(k,txt,o,dec){
    if(!o)return '';
    return '<div class="finfila'+(o.ok?' ok':' duda')+'"><span class="t">'+esc(txt)+
        (o.otra!=null&&!o.ok?'<span class="mini"> · en otra captura: '+esc(String(o.otra.toFixed(2)).replace('.',','))+'</span>':'')+'</span>'+
      '<input inputmode="decimal" value="'+esc((dec||o.v%1)?String(o.v.toFixed(2)).replace('.',','):fmt(o.v))+'" data-a="fin-v" data-k="'+k+'" aria-label="'+esc(txt)+'">'+
      '<span class="m">'+(o.ok?'✓':'⚠')+'</span></div>';};
  const sum=r.cats.reduce(function(t,c){return t+c.v;},0);
  const dudas=[r.banco,r.ingresos,r.gastos].concat(r.cats).filter(function(o){return o&&!o.ok;}).length;
  $('#main').innerHTML='<div class="grid">'+cab+
    '<p class="note" style="margin:0">He leído '+f.total+' captura'+(f.total===1?'':'s')+' del <b>'+esc(fechaCorta(f.fecha))+'</b>. '+
      (dudas?('La letra de Fintonic es fina y a veces confundo cifras: <b style="color:var(--warn)">'+dudas+' con ⚠</b>, revísalas y corrígelas. '):'Todo cuadra. ')+
      'Nada se guarda hasta que pulses «guardar».</p>'+
    '<div class="card"><h2>La captura</h2><div class="row" style="gap:8px">'+
      '<label class="fld" style="flex:1">día<input type="date" value="'+esc(f.fecha)+'" data-a="fin-fecha"></label>'+
      '<label class="fld" style="flex:1">mes de Fintonic<input type="month" value="'+esc(r.mes)+'" data-a="fin-mes"></label></div></div>'+
    ((r.banco||r.ingresos||r.gastos)?('<div class="card"><h2>Lo del mes</h2>'+
      campo('banco','En el banco',r.banco,false)+campo('ingresos','Ingresos del mes',r.ingresos,false)+campo('gastos','Gastos del mes',r.gastos,false)+
      (r.ingresos&&r.ingresos.v>=1000?('<p class="mini" style="margin:8px 0 0">¿Es la nómina? <button class="btn s" data-a="fin-cobrado">apuntar '+esc(eur(r.ingresos.v))+' como lo cobrado de '+esc(ahoMesTxt(r.mes))+'</button></p>'):'')+
      '</div>'):'')+
    (r.cats.length?('<div class="card"><h2>Categorías <span class="mini">· suman '+esc(eur(sum))+(r.gastos?' de '+esc(eur(r.gastos.v)):'')+'</span></h2>'+
      ((r.gastos&&Math.abs(sum-r.gastos.v)>=0.5)?('<p class="mini" style="margin:0 0 8px;color:var(--warn)">⚠ No cuadran: '+
        (sum>r.gastos.v?'sobran ':'faltan ')+esc(eur(Math.abs(sum-r.gastos.v)))+'. Alguna cifra está mal leída aunque parezca buena: compáralas con Fintonic. '+
        'Si falta alguna categoría, no pasa nada: se guarda lo que haya.</p>'):'')+
      r.cats.map(function(c,i){return campo('cat:'+i,c.nombre,c,true);}).join('')+'</div>'):'')+
    '<button class="btn p gbig" data-a="fin-guardar">✓ guardar lo del '+esc(fechaCorta(f.fecha))+'</button>'+
    '<button class="btn s" data-a="fin-descartar">descartar</button>'+
  '</div>';}

function eventosS(){if(!Array.isArray(store.eventos))store.eventos=[];return store.eventos;}
/* ---- cuánto dura un evento ----
   Hasta ahora un evento solo tenía hora de empezar, y eso salía caro en tres sitios: el .ics le
   ponía 60 minutos fijos a todo (una presentación de dos horas y media te reservaba una hora), la
   franja del día lo pintaba como un punto dure lo que dure, y en Mes y Semana solo se leía la hora
   de empezar. Con `fin` puesto, el rato es de verdad. Sin `fin`, todo sigue como antes. */
function evMin(ev){return mins(ev&&ev.hora);}
function evDura(ev){
  /* minutos que ocupa, o null si no lo sabemos. Si el fin es igual o anterior al principio se
     entiende que cruza la medianoche, que es la misma regla que ya usa la jornada de trabajo. */
  const a=evMin(ev),b=mins(ev&&ev.fin);
  if(a==null||b==null)return null;
  return b>a?(b-a):(b+1440-a);}
function evDuraTxt(ev){
  const d=evDura(ev);if(d==null)return '';
  if(d>=1440)return 'todo el día';
  const h=Math.floor(d/60),m=d%60;
  return h?(h+' h'+(m?' '+String(m).padStart(2,'0'):'')):(m+' min');}
function evHoraTxt(ev){
  /* lo que se lee en una fila: «08:30 – 11:00» si sabemos el fin, «08:30» si no, «todo el día» si
     ni siquiera hay hora de empezar */
  if(!ev||!ev.hora)return 'todo el día';
  return ev.fin?(ev.hora+' – '+ev.fin):ev.hora;}
function diasCorta(dow){
  const DS=['D','L','M','X','J','V','S'];
  if(!dow||!dow.length)return '—';
  if(dow.length>=7)return 'todos los días';
  return dow.slice().sort(function(a,b){return a-b;}).map(function(i){return DS[i];}).join('·');
}
function fechaCorta(key){const d=parseDate(key);return d?(d.getDate()+' '+MON[d.getMonth()]):'—';}
function diasHasta(key){const d=parseDate(key);if(!d)return null;const hoy=new Date();
  return Math.round((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(hoy.getFullYear(),hoy.getMonth(),hoy.getDate()))/86400000);}
function cuentaAtrasTxt(key){const n=diasHasta(key);if(n==null)return '';
  if(n<0)return 'ya pasó';if(n===0)return 'es hoy';if(n===1)return 'mañana';return 'faltan '+n+' días';}
function eventosDelDia(dow){return eventosS().filter(function(e){return e.on!==false&&e.modo!=='fecha'&&(e.dow||[]).indexOf(dow)>=0;});}
function eventosPuntualesDe(key){return eventosS().filter(function(e){return e.on!==false&&e.modo==='fecha'&&e.fecha===key;});}
function eventoAplica(ev,key){
  /* un evento semanal marcado «solo los días que trabajas» (la sesión de la UMI de los martes a las
     8) no existe en vacaciones, libres ni fiestas: no se pinta ni se manda a Google */
  if(!ev.soloTrabajo)return true;
  const inf=dayInfo(key);
  if(inf.vac)return false;
  return bloquesTrabajo(key,inf).length>0;}
function eventosDeFecha(key){const d=parseDate(key);if(!d)return [];
  return eventosDelDia(d.getDay()).filter(function(e){return eventoAplica(e,key);}).concat(eventosPuntualesDe(key))
    .sort(function(a,b){return (a.hora||'').localeCompare(b.hora||'');});}
function eventosDelMes(y,mo){
  /* los eventos con fecha que caen en el mes que estás viendo, en orden. Los que se repiten cada
     semana no se listan uno a uno —serían veinte líneas iguales—: van resumidos al final. */
  const ini=iso(new Date(y,mo,1)),fin=iso(new Date(y,mo+1,0));
  return eventosS().filter(function(e){
    return e.on!==false&&e.modo==='fecha'&&e.fecha>=ini&&e.fecha<=fin;})
    .sort(function(a,b){return a.fecha.localeCompare(b.fecha)||(a.hora||'').localeCompare(b.hora||'');});}
function agendaMesHTML(y,mo){
  /* «que pueda ver los eventos del mes para no perderlos»: la cuadrícula enseña lo que cabe en la
     casilla, y esto es la lista entera, con su día y su hora, sin tener que ir tocando día por día */
  const evs=eventosDelMes(y,mo);
  const fijos=eventosS().filter(function(e){return e.on!==false&&e.modo!=='fecha'&&(e.dow||[]).length;});
  if(!evs.length&&!fijos.length)return '';
  const hoy=iso(new Date());
  const filas=evs.map(function(ev){
    const d=parseDate(ev.fecha),pasado=ev.fecha<hoy;
    return '<button class="agrow'+(pasado?' ya':'')+(ev.fecha===hoy?' hoy':'')+'" data-a="mon-day" data-key="'+esc(ev.fecha)+'"'+
      ' title="ver ese día">'+
      '<span class="agdot" style="background:'+esc(ev.color||tlColor('evt'))+'"></span>'+
      '<span class="agd"><b>'+(d?d.getDate():'?')+'</b><span>'+(d?DAYSH[(d.getDay()+6)%7].toLowerCase():'')+'</span></span>'+
      '<span class="agnm"><b>'+esc(ev.titulo||'(sin título)')+'</b>'+
        (ev.cuentaAtras&&!pasado?'<span class="mini">'+esc(cuentaAtrasTxt(ev.fecha))+'</span>':'')+'</span>'+
      '<span class="aghr">'+esc(evHoraTxt(ev))+'</span></button>';}).join('');
  return '<div class="card" style="margin-top:12px"><h2>Eventos de '+MONTH_FULL[mo]+
      (evs.length?' <span class="tag b2">'+evs.length+'</span>':'')+'</h2>'+
    (filas||'<p class="mini" style="margin:0">Ninguno con fecha este mes.</p>')+
    (fijos.length?('<p class="mini" style="margin:9px 0 0">Además, todas las semanas: '+
      fijos.map(function(e){return esc(e.titulo||'(sin título)')+' <span style="opacity:.7">('+diasCorta(e.dow)+')</span>';}).join(' · ')+'</p>'):'')+
    '<div class="row" style="margin-top:10px"><button class="btn s" data-a="ir-eventos">+ añadir o quitar eventos</button></div>'+
    '</div>';}
function eventosPuntualesProximos(){const hoy=iso(new Date());
  return eventosS().filter(function(e){return e.on!==false&&e.modo==='fecha'&&e.fecha>=hoy;})
    .sort(function(a,b){return a.fecha.localeCompare(b.fecha)||(a.hora||'').localeCompare(b.hora||'');});}
function eventoRowHTML(ev){
  const dur=evDuraTxt(ev);
  const cuando=esc(evHoraTxt(ev))+(dur?(' <span style="opacity:.75">('+esc(dur)+')</span>'):'');
  const sub=ev.modo==='fecha'?(fechaCorta(ev.fecha)+' · '+cuando+(ev.cuentaAtras?' · '+cuentaAtrasTxt(ev.fecha):'')):
    (diasCorta(ev.dow)+' · '+cuando);
  return '<div class="logrow"><span class="evdot" style="background:'+esc(ev.color)+'"></span>'+
    '<span class="nm"><b>'+esc(ev.titulo||'(sin título)')+(ev.modo==='fecha'?' <span class="tag b2" style="font-size:9px;vertical-align:middle">puntual</span>':'')+'</b>'+
    '<span>'+sub+(ev.recordatorio?' · 🔔':'')+'</span></span>'+
    '<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--ink2);white-space:nowrap">'+
      '<input type="checkbox" data-a="ev-toggle" data-id="'+ev.id+'" style="width:auto" '+(ev.on!==false?'checked':'')+'> activo</label>'+
    '<button class="btn d" data-a="ev-del" data-id="'+ev.id+'" title="quitar este evento">×</button></div>';
}
/* ===================== Estudio =====================
   El temario NO vive aquí: vive en tu otra app. Esta no intenta ser un temario —sería mantener dos
   listas que se desincronizan— sino aportar lo que la otra no puede saber: qué toca hoy contra tu
   turno, cuándo te toca repasar cada tema y cuánto has estudiado de verdad.

   El cruce es un contrato JSON de dos direcciones, el mismo camino que ya usa el .ics: entra por
   fichero, pegado o URL pública, y sale igual. Está escrito en docs/CONTRATO-TEMARIO.md.
       entra:  {app:'temario', version:1, nombre, url, temas:[{id,bloque,nombre,peso,url}]}
       sale:   {app:'organizador-mir', version:1, progreso:{<id>:{nivel,visto,repasos,min}}}
   La clave del cruce es `id`: mientras no cambie, el progreso de aquí sigue casando con los temas
   de allí aunque se renombren, se reordenen o se añadan. */
const EST_NIVELES=[
  {n:0,dias:1,  txt:'sin ver',    cls:''},
  {n:1,dias:3,  txt:'visto',      cls:'n1'},
  {n:2,dias:7,  txt:'1 repaso',   cls:'n2'},
  {n:3,dias:21, txt:'2 repasos',  cls:'n3'},
  {n:4,dias:60, txt:'sabido',     cls:'n4'}
];
function estS(){
  const e=store.estudio||(store.estudio={});
  if(!e.fuente||typeof e.fuente!=='object')e.fuente={nombre:'',url:'',cuando:''};
  if(!Array.isArray(e.temas))e.temas=[];
  if(!e.estado||typeof e.estado!=='object')e.estado={};
  if(!Array.isArray(e.sesiones))e.sesiones=[];
  return e;}
function estTema(id){return estS().temas.filter(function(t){return t.id===id;})[0]||null;}
function estEstado(id){
  const e=estS();
  if(!e.estado[id])e.estado[id]={nivel:0,visto:'',repasos:[],min:0};
  const x=e.estado[id];
  if(!Array.isArray(x.repasos))x.repasos=[];
  x.nivel=Math.max(0,Math.min(4,+x.nivel||0));
  x.min=Math.max(0,+x.min||0);
  return x;}
function estProxima(id){
  /* cuándo toca el siguiente repaso: el último día que lo tocaste más los días de su nivel.
     Un tema sin ver no «toca» nunca por sí solo — toca estudiarlo, que es otra cosa. */
  const x=estEstado(id);
  if(!x.visto||!x.nivel)return '';
  const d=parseDate(x.visto);if(!d)return '';
  return iso(addDays(d,EST_NIVELES[x.nivel].dias));}
function estTocaHoy(key){
  key=key||iso(new Date());
  return estS().temas.filter(function(t){
    const p=estProxima(t.id);return p&&p<=key;})
    .sort(function(a,b){return (estProxima(a.id)||'').localeCompare(estProxima(b.id)||'');});}
function estBloques(){
  const por={},orden=[];
  estS().temas.forEach(function(t){
    const b=t.bloque||'Sin bloque';
    if(!por[b]){por[b]=[];orden.push(b);}
    por[b].push(t);});
  return orden.map(function(b){return {nombre:b,temas:por[b]};});}
function estCuenta(){
  const t=estS().temas,n={total:t.length,sinVer:0,enMarcha:0,sabidos:0};
  t.forEach(function(x){const nv=estEstado(x.id).nivel;
    if(!nv)n.sinVer++;else if(nv>=4)n.sabidos++;else n.enMarcha++;});
  return n;}
function estMinSemana(key){
  const hoy=parseDate(key||iso(new Date()))||new Date();
  const lun=mondayOf(hoy),dom=iso(addDays(lun,6)),ini=iso(lun);
  return estS().sesiones.filter(function(s){return s.fecha>=ini&&s.fecha<=dom;})
    .reduce(function(a,s){return a+(+s.min||0);},0);}
function estSubir(id){
  /* «me lo he estudiado / lo he repasado»: sube un nivel y reinicia la cuenta atrás del repaso */
  const t=estTema(id);if(!t)return 'ese tema ya no está';
  const x=estEstado(id),hoy=iso(new Date());
  x.nivel=Math.min(4,x.nivel+1);
  if(x.visto&&x.visto!==hoy)x.repasos.push(hoy);
  x.visto=hoy;
  save();
  const p=estProxima(id);
  return x.nivel>=4?('«'+t.nombre+'» sabido'):('hecho — el siguiente repaso, el '+fechaCorta(p));}
function estBajar(id){
  const t=estTema(id);if(!t)return 'ese tema ya no está';
  const x=estEstado(id);
  x.nivel=Math.max(0,x.nivel-1);
  if(!x.nivel)x.visto='';
  save();return 'bajado a «'+EST_NIVELES[x.nivel].txt+'»';}
function estOlvidar(id){
  const t=estTema(id);if(!t)return 'ese tema ya no está';
  delete estS().estado[id];save();return 'borrado lo que tenías de «'+t.nombre+'»';}
function estAddSesion(min,temas){
  min=Math.max(1,Math.min(600,Math.round(+min||0)));
  if(!min)return 'dime cuántos minutos';
  const hoy=iso(new Date());
  estS().sesiones.push({id:uid('est'),fecha:hoy,min:min,temas:(temas||[]).slice(0,20)});
  (temas||[]).forEach(function(id){const x=estEstado(id);x.min+=Math.round(min/Math.max(1,temas.length));});
  save();return fmtHM(min)+' apuntados';}
function estDelSesion(id){
  const e=estS(),i=e.sesiones.findIndex(function(s){return s.id===id;});
  if(i<0)return 'esa sesión ya no está';
  e.sesiones.splice(i,1);save();return 'quitada';}
/* ---- el contrato con la otra app ---- */
function estImportar(txt){
  let o=null;
  try{o=JSON.parse(String(txt||''));}catch(e){return {ok:false,msg:'eso no es un JSON válido'};}
  if(!o||typeof o!=='object')return {ok:false,msg:'eso no es un JSON válido'};
  const temas=Array.isArray(o.temas)?o.temas:(Array.isArray(o)?o:null);
  if(!temas)return {ok:false,msg:'no veo una lista «temas» dentro'};
  const limpios=[],vistos={};
  temas.forEach(function(t){
    if(!t||typeof t!=='object')return;
    const id=String(t.id||t.slug||'').trim().slice(0,64);
    const nombre=String(t.nombre||t.titulo||t.title||'').trim().slice(0,120);
    if(!id||!nombre||vistos[id])return;
    vistos[id]=1;
    limpios.push({id:id,nombre:nombre,
      bloque:String(t.bloque||t.tema||t.grupo||'').trim().slice(0,60),
      peso:Math.max(0,Math.min(9,+t.peso||0)),
      url:/^https:\/\//.test(t.url||'')?String(t.url).slice(0,400):''});});
  if(!limpios.length)return {ok:false,msg:'la lista venía vacía o sin id y nombre en cada tema'};
  const e=estS(),antes=e.temas.length;
  /* el progreso se respeta: la clave es el id, así que renombrar o reordenar allí no borra nada
     de aquí. Lo que ya no está en el temario nuevo deja de listarse, pero su estado se guarda por
     si vuelve. */
  e.temas=limpios;
  e.fuente={nombre:String(o.nombre||o.titulo||'Temario').slice(0,80),
    url:/^https:\/\//.test(o.url||'')?String(o.url).slice(0,400):'',
    cuando:iso(new Date())};
  save();
  const conEstado=limpios.filter(function(t){const x=e.estado[t.id];return x&&x.nivel;}).length;
  return {ok:true,n:limpios.length,antes:antes,conEstado:conEstado,
    msg:limpios.length+' temas'+(conEstado?(' · '+conEstado+' con tu progreso ya puesto'):'')};}
function estProgresoJSON(){
  const e=estS(),prog={};
  e.temas.forEach(function(t){
    const x=e.estado[t.id];
    if(x&&(x.nivel||x.min))prog[t.id]={nivel:x.nivel,visto:x.visto||'',repasos:x.repasos.slice(-8),min:x.min};});
  return JSON.stringify({app:'organizador-mir',version:1,cuando:iso(new Date()),
    temario:e.fuente.nombre||'',progreso:prog},null,1);}
/* ---- Estudio: portada y una pantalla por tarea ---- */
function estPantalla(titulo,cuerpo,extra){
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="est-vista" data-v="">'+gymIco('atras','gico sm')+' Estudio</button>'+
      '<h2 class="subtit">'+esc(titulo)+'</h2>'+(extra?('<span class="tag b2">'+esc(extra)+'</span>'):'')+'</div>'+
    cuerpo+'</div>';}
function estFilaHTML(t,conBloque){
  const x=estEstado(t.id),nv=EST_NIVELES[x.nivel],p=estProxima(t.id);
  const hoy=iso(new Date());
  const tarde=p&&p<hoy,toca=p&&p<=hoy;
  return '<button class="estfila'+(toca?' toca':'')+'" data-a="est-tema" data-id="'+esc(t.id)+'">'+
    '<span class="niv '+nv.cls+'" title="'+esc(nv.txt)+'">'+x.nivel+'</span>'+
    '<span class="tx"><b>'+esc(t.nombre)+'</b><span>'+
      (conBloque&&t.bloque?(esc(t.bloque)+' · '):'')+esc(nv.txt)+
      (p?(' · '+(tarde?'te pasaste el '+fechaCorta(p):(toca?'toca hoy':'repaso el '+fechaCorta(p)))):'')+
    '</span></span>'+
    (t.url?('<span class="fuera" title="está en tu temario">↗</span>'):'')+
  '</button>';}
function renderEstudio(){
  const e=estS(),v=ui.estVista||'';
  if(v==='conectar')return estPantalla('🔌 Conectar con tu temario',estConectarHTML());
  if(v==='sesiones')return estPantalla('⏱ Mis sesiones',estSesionesHTML(),fmtHM(estMinSemana())+' esta semana');
  if(v==='temario'){
    if(!e.temas.length)return estPantalla('📚 El temario',estVacioHTML());
    return estPantalla('📚 El temario',
      estBloques().map(function(b){
        const n=b.temas.filter(function(t){return estEstado(t.id).nivel>=4;}).length;
        return '<div class="card"><h2>'+esc(b.nombre)+
          '<span class="mini" style="margin-left:auto;font-weight:400">'+n+' de '+b.temas.length+'</span></h2>'+
          b.temas.map(function(t){return estFilaHTML(t,false);}).join('')+'</div>';}).join(''),
      e.temas.length+' temas');}
  if(v&&v.indexOf('t:')===0){
    const t=estTema(v.slice(2));
    if(!t){ui.estVista='temario';return renderEstudio();}
    const x=estEstado(t.id),nv=EST_NIVELES[x.nivel],p=estProxima(t.id);
    return estPantalla(t.nombre,
      '<div class="card">'+
        '<div class="dosdatos">'+
          '<div><b>'+esc(nv.txt)+'</b><span>cómo lo llevas</span></div>'+
          '<div><b>'+(p?esc(fechaCorta(p)):'—')+'</b><span>siguiente repaso</span></div>'+
        '</div>'+
        (x.min?('<p class="mini" style="margin:10px 0 0">Le has echado <b style="color:var(--ink)">'+fmtHM(x.min)+'</b>.</p>'):'')+
        (x.repasos.length?('<p class="mini" style="margin:6px 0 0">Repasos: '+
          x.repasos.slice(-5).map(function(f){return esc(fechaCorta(f));}).join(' · ')+'</p>'):'')+
        '<div class="row" style="margin-top:12px">'+
          '<button class="btn p" data-a="est-sube" data-id="'+esc(t.id)+'">'+
            (x.nivel?'✓ lo he repasado':'✓ me lo he estudiado')+'</button>'+
          (x.nivel?('<button class="btn s" data-a="est-baja" data-id="'+esc(t.id)+'">no me acordaba</button>'):'')+
        '</div>'+
        (t.url?('<div class="row" style="margin-top:9px">'+
          '<a class="btn s" href="'+esc(t.url)+'" target="_blank" rel="noopener">abrir en tu temario ↗</a></div>'):
          (e.fuente.url?('<div class="row" style="margin-top:9px">'+
            '<a class="btn s" href="'+esc(e.fuente.url)+'" target="_blank" rel="noopener">abrir tu temario ↗</a></div>'):''))+
      '</div>'+
      '<div class="card"><h2>Cómo funciona el repaso</h2>'+
        '<p class="note" style="margin:0">Cada vez que le das a «lo he repasado», el siguiente se aleja: '+
        EST_NIVELES.slice(0,4).map(function(n){return n.dias+' d';}).join(' → ')+' → '+EST_NIVELES[4].dias+' d. '+
        'Si un día no te acordabas, baja un escalón y vuelve antes.</p>'+
        '<div class="row" style="margin-top:11px"><button class="btn d s" data-a="est-olvida" data-id="'+esc(t.id)+'">empezar este tema de cero</button></div>'+
      '</div>',
      t.bloque||'');}
  /* la portada */
  if(!e.temas.length){$('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><h2 class="subtit">📚 Estudio</h2></div>'+estVacioHTML()+'</div>';return;}
  const toca=estTocaHoy(),c=estCuenta(),min=estMinSemana();
  const pct=c.total?Math.round(c.sabidos/c.total*100):0;
  const puerta=function(vista,ico,tit,sub){
    return '<button class="puerta" data-a="est-vista" data-v="'+vista+'">'+gymIco(ico)+
      '<b>'+esc(tit)+'</b><span class="s">'+esc(sub)+'</span></button>';};
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><h2 class="subtit">📚 Estudio</h2>'+
      '<span class="tag b2">'+esc(e.fuente.nombre||'temario')+'</span></div>'+
    (toca.length?('<div class="card avisa"><h2>Hoy toca repasar<span class="mini" style="margin-left:auto;font-weight:400">'+
      toca.length+'</span></h2>'+toca.slice(0,6).map(function(t){return estFilaHTML(t,true);}).join('')+
      (toca.length>6?('<p class="mini" style="margin:9px 0 0">y '+(toca.length-6)+' más.</p>'):'')+'</div>')
      :('<div class="card"><h2>Hoy no toca repasar nada</h2>'+
        '<p class="note" style="margin:0">Todo al día. Si quieres adelantar, entra en el temario y dale a un tema sin ver.</p></div>'))+
    '<div class="card"><h2>Cómo vas</h2>'+
      '<div class="prog"><div class="bar"><i style="width:'+pct+'%"></i></div><b>'+c.sabidos+' de '+c.total+'</b></div>'+
      '<div class="dosdatos" style="margin-top:10px">'+
        '<div><b>'+c.enMarcha+'</b><span>en marcha</span></div>'+
        '<div><b>'+(min?fmtHM(min):'0h00')+'</b><span>esta semana</span></div>'+
      '</div>'+
      '<div class="row" style="margin-top:11px"><button class="btn p" data-a="est-vista" data-v="sesiones">+ apuntar un rato</button></div>'+
    '</div>'+
    '<div class="puertas">'+
      puerta('temario','libro','El temario',c.total+' temas')+
      puerta('sesiones','reloj','Sesiones',min?fmtHM(min)+' esta semana':'sin apuntar')+
      puerta('conectar','enlace','Conectar',e.fuente.url?'enlazado':'sin enlazar')+
    '</div>'+
  '</div>';}
function estVacioHTML(){
  return '<div class="card"><h2>Tu temario no vive aquí</h2>'+
    '<p class="note">Y está bien que no viva aquí: mantener dos listas de temas es garantía de que se '+
    'desincronicen. Trae el temario de tu otra app y esta se encarga de lo que aquella no puede saber: '+
    '<b>qué toca repasar hoy contra tu turno</b>, cuánto llevas y cuándo te toca volver a cada tema.</p>'+
    '<div class="row" style="margin-top:11px">'+
      '<button class="btn p" data-a="est-vista" data-v="conectar">traer mi temario</button></div>'+
    '<p class="mini" style="margin:11px 0 0">El formato está en <code>docs/CONTRATO-TEMARIO.md</code>: una lista de '+
    '<code>{id, nombre, bloque, url}</code>. Nada más.</p>'+
  '</div>';}
function estConectarHTML(){
  const e=estS(),pr=ui.estPrev;
  return '<div class="card"><h2>Traer el temario</h2>'+
    '<p class="note">Un JSON con la lista de temas. Sube el fichero, pégalo o dame su dirección: '+
    'se lee <b>aquí, en el móvil</b>, y no sale nada a ninguna parte.</p>'+
    (e.fuente.nombre?('<div class="estado"><span class="em">📚</span><span class="tx"><b>'+esc(e.fuente.nombre)+'</b></span>'+
      '<span class="vl">'+e.temas.length+' temas · '+esc(fechaCorta(e.fuente.cuando))+'</span></div>'):'')+
    '<div class="row" style="margin-top:10px">'+
      '<label class="fld" style="flex:0 0 auto">fichero .json<input type="file" id="estFile" data-a="est-file" accept="application/json,.json"></label>'+
    '</div>'+
    '<textarea id="estBox" rows="6" style="margin-top:8px" placeholder=\'{"nombre":"Temario MIR","url":"https://…","temas":[{"id":"card-01","bloque":"Cardiología","nombre":"Insuficiencia cardiaca","url":"https://…"}]}\'>'+esc(ui.estTxt||'')+'</textarea>'+
    '<div class="row" style="margin-top:8px">'+
      '<button class="btn p" data-a="est-importar">traer estos temas</button>'+
      '<span class="sp"></span>'+
      '<label class="fld" style="flex:1 1 200px">o desde una dirección<input type="url" inputmode="url" id="estUrl" value="'+esc(e.fuente.url||'')+'" placeholder="https://…/temario.json"></label>'+
      '<button class="btn s" data-a="est-url">traerlo de ahí</button>'+
    '</div>'+
    (pr?('<p class="mini" style="margin:9px 0 0;color:var(--'+(pr.ok?'ok':'warn')+')">'+esc(pr.msg)+'</p>'):'')+
    '<p class="mini" style="margin:9px 0 0">Traer el temario otra vez <b>no borra tu progreso</b>: se casa por '+
    '<code>id</code>, así que puedes renombrar, reordenar y añadir temas allí sin perder nada aquí.</p>'+
  '</div>'+
  '<div class="card"><h2>Devolver tu progreso</h2>'+
    '<p class="note">Para que tu temario sepa por dónde vas: un JSON con el nivel de cada tema, cuándo lo '+
    'viste y cuánto le has echado.</p>'+
    '<div class="row"><button class="btn s" data-a="est-exportar">descargar mi progreso</button>'+
      '<button class="btn s" data-a="est-copiar">copiarlo</button></div>'+
    '<p class="mini" style="margin:9px 0 0">El formato de ida y el de vuelta están escritos en '+
    '<code>docs/CONTRATO-TEMARIO.md</code> del repositorio, para poder implementarlos en la otra app.</p>'+
  '</div>';}
function estSesionesHTML(){
  const e=estS(),hoy=iso(new Date());
  const ult=e.sesiones.slice(-14).reverse();
  const deHoy=e.sesiones.filter(function(s){return s.fecha===hoy;}).reduce(function(a,s){return a+s.min;},0);
  return '<div class="card"><h2>Apuntar un rato</h2>'+
    '<div class="row">'+
      '<label class="fld" style="flex:0 0 120px">minutos<input type="number" id="estMin" min="1" max="600" value="45"></label>'+
      '<label class="fld" style="flex:1 1 180px">sobre qué tema (opcional)<select id="estTema">'+
        '<option value="">— sin tema —</option>'+
        estS().temas.map(function(t){return '<option value="'+esc(t.id)+'">'+esc(t.nombre)+'</option>';}).join('')+
      '</select></label>'+
    '</div>'+
    '<div class="row" style="margin-top:9px"><button class="btn p" data-a="est-sesion">apuntar</button>'+
      '<span class="mini">hoy llevas <b style="color:var(--ink)">'+(deHoy?fmtHM(deHoy):'0h00')+'</b></span></div>'+
  '</div>'+
  '<div class="card"><h2>Lo apuntado</h2>'+
    (ult.length?ult.map(function(s){
      const nms=(s.temas||[]).map(function(id){const t=estTema(id);return t?t.nombre:'';}).filter(Boolean);
      return '<div class="logrow"><span class="nm"><b>'+fmtHM(s.min)+'</b><span>'+esc(fechaCorta(s.fecha))+
        (nms.length?(' · '+esc(nms.join(', '))):'')+'</span></span>'+
        '<button class="btn d" data-a="est-del-sesion" data-id="'+esc(s.id)+'" title="quitar">×</button></div>';}).join('')
      :'<div class="empty">Nada apuntado todavía.</div>')+
  '</div>';}
/* ===================== el primer arranque =====================
   Hasta ahora la app abría con el planning de ejemplo —«Pollo al curry», la semana «1 guardia ·
   repartida»— presentado como si ya fuera tuyo, y hacerla tuya era encontrar «Datos → importar tu
   planning» o editar 126 campos a mano. `grep -i bienvenida|onboarding|asistente app.js` daba cero.
   Esto son cuatro preguntas cortas, todas de cosas que la app usa de verdad: con ellas queda
   montada a tu nombre. Los menús y los platos de ejemplo se quedan: son contenido útil, no
   configuración, y se cambian en Comer cuando quieras. */
const ARR_PASOS=[
  {id:'jornada',t:'Tu jornada',s:'Un día normal de trabajo'},
  {id:'guardias',t:'Tus guardias',s:'Cuántas y a qué hora'},
  {id:'sueno',t:'Tus horas',s:'Cuándo te levantas y te acuestas'},
  {id:'sitio',t:'Dónde vives',s:'Para las horas de sol'}
];
function arrS(){
  if(!ui.arranque)ui.arranque={paso:0,jEntra:'08:00',jSale:'15:00',gEntra:'08:00',gSale:'08:00',
    gMes:4,despierta:'06:50',acuesta:'22:40',sitio:(sitioActual()||{}).id||''};
  return ui.arranque;}
function arrLee(){
  /* se relee del DOM antes de cada paso: el formulario se repinta entero y lo tecleado se perdería */
  const a=arrS(),v=function(id){const e=$('#'+id);return e?e.value:null;};
  [['arrJEntra','jEntra'],['arrJSale','jSale'],['arrGEntra','gEntra'],['arrGSale','gSale'],
   ['arrDespierta','despierta'],['arrAcuesta','acuesta'],['arrSitio','sitio']].forEach(function(p){
    const x=v(p[0]);if(x!=null&&x!=='')a[p[1]]=x;});
  const g=v('arrGMes');if(g!=null&&g!=='')a.gMes=Math.max(0,Math.min(15,+g||0));
  return a;}
function arrAplica(){
  const a=arrLee();
  /* la jornada y el día de trabajo */
  const t=shiftById('sh-t');if(t){t.start=a.jEntra;t.end=a.jSale;}
  const f=shiftById('sh-f');if(f)f.end=a.jSale;   /* el día de fuerza entrena antes y luego trabaja igual */
  if(!store.rotation.jornada)store.rotation.jornada={};
  store.rotation.jornada.from=a.jEntra;store.rotation.jornada.to=a.jSale;
  /* las guardias */
  const g=shiftById('sh-g');if(g){g.start=a.gEntra;g.end=a.gSale;}
  store.rotation.guardiasMes=a.gMes;
  /* las horas: se aplican al día de trabajo y al de fuerza, que son los que siguen un horario fijo */
  ['sh-t','sh-f'].forEach(function(id){
    if(!store.rhythm[id])store.rhythm[id]={};
    store.rhythm[id].wake=a.despierta;store.rhythm[id].sleep=a.acuesta;});
  /* dónde vives */
  if(a.sitio){store.sitio=a.sitio;olvidaSitios();}   /* hay caché: sin esto el sol sigue en el sitio viejo */
  store.meta.montada=true;
  save();}
function arrCampo(id,etiqueta,valor,tipo,extra){
  return '<label class="fld" style="flex:1 1 130px">'+esc(etiqueta)+
    '<input type="'+(tipo||'time')+'" id="'+id+'" value="'+esc(valor)+'"'+(extra||'')+'></label>';}
function renderArranque(){
  const a=arrS(),n=ARR_PASOS.length;
  /* la barra de arriba no pinta nada aquí: todavía no hay nada que navegar */
  const tb=$('#tabs');if(tb)tb.innerHTML='';
  const cm=$('#calModes');if(cm)cm.hidden=true;
  /* «Imprimir» y «JSON» son de una app que ya tiene datos: aquí todavía no hay nada que imprimir */
  document.documentElement.classList.add('en-arranque');
  const wn=$('#wkNav');if(wn)wn.hidden=true;
  const wl=$('#wkLabel');if(wl)wl.textContent='';
  if(a.paso>=n){
    /* el resumen: qué ha quedado montado, con las cifras de verdad */
    const sit=sitiosS().filter(function(s){return s.id===a.sitio;})[0]||sitioActual();
    const horas=sleepHours(a.acuesta,a.despierta);
    $('#main').innerHTML='<div class="grid arranque">'+
      '<div class="card"><h2>✓ Listo</h2>'+
        '<p class="note" style="margin:0 0 10px">Esto es lo que te he montado. Todo se cambia luego en '+
        '«Turno y rotación» sin romper nada.</p>'+
        '<div class="estado"><span class="em">💼</span><span class="tx"><b>Tu jornada</b></span>'+
          '<span class="vl">'+esc(a.jEntra)+' – '+esc(a.jSale)+'</span></div>'+
        '<div class="estado"><span class="em">🩺</span><span class="tx"><b>Guardias</b></span>'+
          '<span class="vl">'+a.gMes+' al mes · '+esc(a.gEntra)+'</span></div>'+
        '<div class="estado"><span class="em">🛌</span><span class="tx"><b>Duermes</b></span>'+
          '<span class="vl">'+(horas!=null?fmtHM(horas*60):'—')+'</span></div>'+
        '<div class="estado"><span class="em">☀️</span><span class="tx"><b>Dónde</b></span>'+
          '<span class="vl">'+esc((sit&&sit.nombre)||'—')+'</span></div>'+
      '</div>'+
      '<div class="card"><h2>Lo que traes de fábrica</h2>'+
        '<p class="note" style="margin:0">Los menús, los platos y las semanas tipo que ves son un '+
        '<b>ejemplo</b> para que la app haga algo desde el primer día. Cámbialos cuando quieras en '+
        '«Comer» y en «Turno y rotación», o pega tu planning de verdad en «Datos».</p>'+
      '</div>'+
      '<div class="row">'+
        '<button class="btn p" data-a="arr-fin">empezar</button>'+
        '<button class="btn s" data-a="arr-fin" data-t="data">pegar mi planning →</button>'+
        '<span class="sp"></span>'+
        '<button class="btn s" data-a="arr-paso" data-p="0">volver atrás</button>'+
      '</div>'+
    '</div>';
    return;}
  const p=ARR_PASOS[a.paso];
  let cuerpo='';
  if(p.id==='jornada')cuerpo=
    '<p class="note" style="margin:0 0 10px">Un día de trabajo normal, el que más se repite. Con esto '+
    'la app sabe cuándo estás fuera de casa y coloca las comidas y el entreno alrededor.</p>'+
    '<div class="row">'+arrCampo('arrJEntra','entras',a.jEntra)+arrCampo('arrJSale','sales',a.jSale)+'</div>';
  else if(p.id==='guardias')cuerpo=
    '<p class="note" style="margin:0 0 10px">Si no haces guardias, deja el número en 0 y sigue: el resto '+
    'de la app funciona igual.</p>'+
    '<div class="row">'+arrCampo('arrGEntra','entras',a.gEntra)+arrCampo('arrGSale','sales',a.gSale)+
      arrCampo('arrGMes','al mes',String(a.gMes),'number',' min="0" max="15"')+'</div>'+
    '<p class="mini" style="margin:9px 0 0">Una guardia que entra y sale a la misma hora se entiende como '+
    'de 24 h, y el día siguiente queda como saliente.</p>';
  else if(p.id==='sueno')cuerpo=
    '<p class="note" style="margin:0 0 10px">Entre semana. La app cuenta tus horas, te dice a qué hora '+
    'tocaría acostarse y encaja la cena para no dormir con la digestión a medias.</p>'+
    '<div class="row">'+arrCampo('arrDespierta','te levantas',a.despierta)+arrCampo('arrAcuesta','te acuestas',a.acuesta)+'</div>'+
    (function(){const h=sleepHours(a.acuesta,a.despierta);
      return h!=null?('<p class="mini" style="margin:9px 0 0">Son <b style="color:var(--ink)">'+fmtHM(h*60)+'</b> de sueño.</p>'):'';})();
  else cuerpo=
    '<p class="note" style="margin:0 0 10px">Solo para las horas de sol, que se calculan aquí en el móvil '+
    'sin conexión. No sale nada a internet.</p>'+
    '<label class="fld" style="max-width:280px">tu sitio<select id="arrSitio">'+
      sitiosS().map(function(s){return '<option value="'+esc(s.id)+'"'+(s.id===a.sitio?' selected':'')+'>'+esc(s.nombre)+'</option>';}).join('')+
    '</select></label>';
  $('#main').innerHTML='<div class="grid arranque">'+
    '<div class="card"><h2>👋 Vamos a montarla a tu nombre</h2>'+
      '<p class="note" style="margin:0">Cuatro preguntas cortas. Todo esto se cambia luego, y si prefieres '+
      'saltarlas, la app arranca igual con un ejemplo.</p>'+
      '<div class="arrpasos">'+ARR_PASOS.map(function(x,i){
        return '<i class="'+(i<a.paso?'ok':(i===a.paso?'on':''))+'"></i>';}).join('')+'</div>'+
    '</div>'+
    '<div class="card"><h2>'+esc(p.t)+'<span class="mini" style="margin-left:auto;font-weight:400">'+
      (a.paso+1)+' de '+n+'</span></h2>'+cuerpo+'</div>'+
    '<div class="row">'+
      (a.paso?'<button class="btn s" data-a="arr-paso" data-p="'+(a.paso-1)+'">‹ atrás</button>':'')+
      '<button class="btn p" data-a="arr-paso" data-p="'+(a.paso+1)+'">'+(a.paso===n-1?'ver lo que queda':'siguiente ›')+'</button>'+
      '<span class="sp"></span>'+
      '<button class="btn s" data-a="arr-saltar">saltar</button>'+
    '</div>'+
  '</div>';}
/* ===================== Eventos: sección propia =====================
   Estaban dentro de Ajustes, tarjeta 4 de 13, entre el lector de enlaces y las copias de
   seguridad: lo que más se usa, en lo que menos se encuentra. Aquí son una sección del cajón,
   al lado de Notas, Hábitos y Dinero, con una pantalla por evento donde se dice cuánto dura. */
function evById(id){return eventosS().filter(function(e){return e.id===id;})[0]||null;}
const EV_DOWL=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const EV_DURAS=[['sin hora de fin',0],['30 min',30],['1 h',60],['1 h 30',90],['2 h',120],['3 h',180],['toda la mañana',-1],['todo el día',-2]];
function evFormDefecto(ev){
  return ev?{modo:ev.modo==='fecha'?'fecha':'semanal',dow:(ev.dow||[]).slice(),fecha:ev.fecha||''}
           :{modo:'fecha',dow:[],fecha:iso(new Date())};}
function evPantalla(titulo,cuerpo,extra){
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="ev-vista" data-v="">'+gymIco('atras','gico sm')+' Eventos</button>'+
      '<h2 class="subtit">'+esc(titulo)+'</h2>'+(extra?('<span class="tag b2">'+esc(extra)+'</span>'):'')+'</div>'+
    cuerpo+'</div>';}
function evFormHTML(ev){
  const f=ui.evForm||(ui.evForm=evFormDefecto(ev));
  const hora=ev?(ev.hora||''):'18:00',fin=ev?(ev.fin||''):'';
  const dActual=ev?evDura(ev):null;
  const chips=EV_DURAS.map(function(d){
    const on=(d[1]===0&&!fin)||(d[1]>0&&dActual===d[1])||(d[1]===-1&&dActual===240)||(d[1]===-2&&!hora);
    return '<button class="dura'+(on?' on':'')+'" data-a="ev-dura" data-min="'+d[1]+'">'+esc(d[0])+'</button>';}).join('');
  return '<div class="card"><h2>Cuándo es</h2>'+
    '<div class="row">'+
      '<button class="btn s '+(f.modo!=='fecha'?'p':'')+'" data-a="ev-modo" data-modo="semanal">se repite cada semana</button>'+
      '<button class="btn s '+(f.modo==='fecha'?'p':'')+'" data-a="ev-modo" data-modo="fecha">un día en concreto</button>'+
    '</div>'+
    '<div class="row" style="margin-top:9px">'+
      '<label class="fld" style="flex:1 1 180px">título<input id="evTitulo" value="'+esc(ev?(ev.titulo||''):'')+
        '" placeholder="'+(f.modo==='fecha'?'p. ej. Presentación en rayos':'p. ej. Sesión clínica')+'"></label>'+
      '<label class="fld" style="flex:0 0 54px">color<input type="color" id="evColor" value="'+
        esc(ev?(ev.color||'#38e1ff'):'#38e1ff')+'" style="height:30px;padding:2px"></label>'+
    '</div>'+
    (f.modo==='fecha'
      ?('<div class="row" style="margin-top:8px"><label class="fld" style="flex:0 0 172px">qué día'+
        '<input type="date" id="evFecha" value="'+esc(f.fecha||iso(new Date()))+'"></label></div>')
      :('<div class="row" style="margin-top:8px"><span class="mini" style="flex:0 0 100%">qué días:</span>'+
        EV_DOWL.map(function(nm,ix){return '<button class="btn s '+(f.dow.indexOf(ix)>=0?'p':'')+
          '" data-a="ev-dia" data-day="'+ix+'">'+nm+'</button>';}).join('')+'</div>'))+
    '<div class="row" style="margin-top:9px">'+
      '<label class="fld" style="flex:1 1 120px">desde<input type="time" id="evHora" value="'+esc(hora)+'"></label>'+
      '<label class="fld" style="flex:1 1 120px">hasta<input type="time" id="evFin" value="'+esc(fin)+'"></label>'+
    '</div>'+
    '<div class="duras">'+chips+'</div>'+
    '<p class="mini" style="margin:9px 0 0">Con la hora de fin puesta, el calendario del móvil te '+
      '<b style="color:var(--ink)">reserva el hueco</b> en vez de meter una cita suelta de una hora. '+
      'Si pones una hora de fin anterior a la de empezar, se entiende que acaba al día siguiente.</p>'+
  '</div>'+
  (f.modo==='fecha'?('<div class="card"><h2>Avisos</h2>'+
    '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink2)">'+
      '<input type="checkbox" id="evRec" style="width:auto" '+((ev&&ev.recordatorio)?'checked':'')+'> '+
      '🔔 avisarme (sale en «Hoy» y en «Próximos»)</label>'+
    '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink2);margin-top:9px">'+
      '<input type="checkbox" id="evCuenta" style="width:auto" '+((ev&&ev.cuentaAtras)?'checked':'')+'> '+
      '⏳ mostrar cuenta atrás</label></div>'):'')+
  '<div class="row" style="margin-top:2px">'+
    '<button class="btn p" data-a="ev-guardar" data-id="'+esc(ev?ev.id:'')+'">'+(ev?'guardar los cambios':'+ añadir el evento')+'</button>'+
    (ev?('<span class="sp"></span><button class="btn d" data-a="ev-del" data-id="'+esc(ev.id)+'">quitar</button>'):'')+
  '</div>';}
function evFilaHTML(ev){
  const d=ev.modo==='fecha'?parseDate(ev.fecha):null;
  const dur=evDuraTxt(ev);
  const cuando=ev.modo==='fecha'
    ?(DAYSH[(d?(d.getDay()+6)%7:0)].toLowerCase()+' · '+evHoraTxt(ev)+(ev.cuentaAtras?(' · '+cuentaAtrasTxt(ev.fecha)):''))
    :(diasCorta(ev.dow)+' · '+evHoraTxt(ev));
  return '<button class="evfila'+(ev.on===false?' off':'')+'" data-a="ev-abrir" data-id="'+esc(ev.id)+'">'+
    (d?('<span class="fch"><em>'+d.getDate()+'</em><span>'+MON[d.getMonth()]+'</span></span>')
       :('<span class="fch sem"><em>'+diasCorta(ev.dow)+'</em><span>cada sem</span></span>'))+
    '<span class="tx"><b>'+esc(ev.titulo||'(sin título)')+'</b><span>'+esc(cuando)+
      (ev.recordatorio?' · 🔔':'')+(ev.on===false?' · apagado':'')+'</span></span>'+
    (dur?('<span class="dur">'+esc(dur)+'</span>'):'')+
    '<span class="evdot" style="background:'+esc(ev.color||'#38e1ff')+'"></span></button>';}
function renderEventos(){
  const v=ui.evVista||'';
  if(v==='nuevo')return evPantalla('Un evento nuevo',evFormHTML(null));
  if(v){const ev=evById(v);
    if(ev)return evPantalla(ev.titulo||'Evento',evFormHTML(ev),ev.modo==='fecha'?fechaCorta(ev.fecha):diasCorta(ev.dow));
    ui.evVista='';}
  const hoy=iso(new Date());
  const puntuales=eventosS().filter(function(e){return e.modo==='fecha';})
    .sort(function(a,b){return a.fecha.localeCompare(b.fecha)||(a.hora||'').localeCompare(b.hora||'');});
  const proximos=puntuales.filter(function(e){return e.fecha>=hoy;});
  const pasados=puntuales.filter(function(e){return e.fecha<hoy;});
  const semanales=eventosS().filter(function(e){return e.modo!=='fecha';})
    .sort(function(a,b){return (a.hora||'').localeCompare(b.hora||'');});
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><h2 class="subtit">📌 Eventos</h2>'+
      (eventosS().length?('<span class="tag b2">'+eventosS().length+' apuntado'+(eventosS().length===1?'':'s')+'</span>'):'')+'</div>'+
    '<div class="card"><h2>Lo que viene</h2>'+
      (proximos.length?proximos.map(evFilaHTML).join('')
        :'<div class="empty">Nada por delante. Añade una cita, un curso o el día que pagas algo.</div>')+
      '<div class="row" style="margin-top:11px"><button class="btn p" data-a="ev-nuevo">+ añadir un evento</button></div>'+
    '</div>'+
    '<div class="card"><h2>Todas las semanas</h2>'+
      '<p class="note" style="margin:0 0 9px">Lo que se repite sin fecha: la sesión de los jueves, el fisio, la lavadora.</p>'+
      (semanales.length?semanales.map(evFilaHTML).join(''):'<div class="empty">Ninguno todavía.</div>')+
      '<div class="row" style="margin-top:11px"><button class="btn s" data-a="ev-nuevo" data-modo="semanal">+ uno semanal</button></div>'+
    '</div>'+
    (pasados.length?('<div class="card"><h2>Ya pasaron<span class="mini" style="margin-left:auto;font-weight:400">'+
      pasados.length+'</span></h2>'+pasados.slice(-6).reverse().map(evFilaHTML).join('')+'</div>'):'')+
    '<p class="mini" style="margin:2px 0 0">Todo lo de aquí sale en <b style="color:var(--ink)">Mes</b>, '+
      'en <b style="color:var(--ink)">Hoy</b> y en el <b style="color:var(--ink)">.ics</b> del calendario del móvil, '+
      'con su alarma y con el rato que ocupa.</p>'+
  '</div>';}
function eventosTagsHTML(list){
  if(!list||!list.length)return '';
  return list.map(function(ev){return '<span class="tag" style="border:1px solid '+esc(ev.color)+';color:'+esc(ev.color)+'">'+
    esc(evHoraTxt(ev))+' '+esc(ev.titulo)+'</span>';}).join('');
}
function proximosPuntualesHTML(){
  const prox=eventosPuntualesProximos();
  if(!prox.length)return '';
  return '<div class="card"><h2>📌 Próximos<span class="mini" style="margin-left:auto;font-weight:400">'+prox.length+'</span></h2>'+
    '<p class="note">Eventos puntuales que has apuntado — se editan en «Eventos».</p>'+
    prox.slice(0,6).map(function(ev){
      return '<div class="logrow"><span class="evdot" style="background:'+esc(ev.color)+'"></span>'+
        '<span class="nm"><b>'+esc(ev.titulo||'(sin título)')+'</b><span>'+fechaCorta(ev.fecha)+' · '+esc(evHoraTxt(ev))+
        (ev.recordatorio?' · 🔔 recordatorio':'')+'</span></span>'+
        (ev.cuentaAtras?'<span class="tag b2">'+cuentaAtrasTxt(ev.fecha)+'</span>':'')+
        '</div>';}).join('')+
    '</div>';
}
/* ===================== Ajustes: portada y una pantalla por tarea =====================
   Eran 13 tarjetas sin relación entre ellas, 5 150 px y 1 176 palabras —la pantalla con más texto
   de toda la app—, con los eventos enterrados en el puesto 4 y tres tarjetas distintas hablando
   del calendario de Google en dos secciones. Mismo patrón que «Turno y rotación»: una portada que
   se lee de un vistazo y una pantalla por tarea. */
const ICS_CAT=[['GUARDIA','\ud83e\ude7a','guardias'],['TRABAJO','\ud83d\udcbc','trabajo'],['ENTRENO','\ud83d\udcaa','entrenos'],
  ['DINERO','\ud83d\udcb6','recibos'],['TAREA','\ud83d\udcdd','tareas con d\u00eda'],['EVENTO','\ud83d\udccc','eventos'],
  ['ESTUDIO','\ud83d\udcda','repasos'],['ROTACION','\ud83d\udd01','rotaci\u00f3n']];
function icsResumen(desde,hasta){
  /* qué se lleva de verdad el calendario del móvil, contado. La tarjeta vieja decía que iban «solo
     tres cosas» y se quedó caduca cuando los avisos empezaron a llevar también recibos, tareas y
     eventos: ahora la cuenta sale del mismo sitio que el .ics, así que no puede desfasarse. */
  let evs=[];
  try{evs=calEventos(desde,hasta);}catch(e){evs=[];}
  const n={};evs.forEach(function(e){n[e.cat]=(n[e.cat]||0)+1;});
  return {total:evs.length,n:n};}
function icsCatsHTML(desde,hasta){
  const r=icsResumen(desde,hasta);
  return '<div class="cats">'+ICS_CAT.map(function(c){
      const k=r.n[c[0]]||0;
      return '<span'+(k?'':' class="off"')+'><i style="background:'+esc(tlColor(
        c[0]==='GUARDIA'?'guard':c[0]==='TRABAJO'?'work':c[0]==='ENTRENO'?'gym':'evt'))+'"></i>'+
        c[1]+' '+esc(c[2])+(k?(' <b>'+k+'</b>'):'')+'</span>';}).join('')+'</div>'+
    '<p class="mini" style="margin:9px 0 0"><b style="color:var(--ink)">'+r.total+' cita'+(r.total===1?'':'s')+
      '</b> en ese rango. Vacaciones, salientes y d\u00edas libres <b style="color:var(--ink)">no</b> salen: se quedan en la app.</p>';}
function ajuPantalla(titulo,cuerpo,extra){
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="aju-vista" data-v="">'+gymIco('atras','gico sm')+' Ajustes</button>'+
      '<h2 class="subtit">'+esc(titulo)+'</h2>'+(extra?('<span class="tag b2">'+esc(extra)+'</span>'):'')+'</div>'+
    cuerpo+'</div>';}
function renderAjustes(){
  const tm=store.tema||{};
  const v=ui.ajuVista||'';
  if(v==='calendario')return ajuPantalla('\ud83d\udcc5 Calendario del m\u00f3vil',`<div class="card"><h2>Qu\u00e9 se manda, y c\u00f3mo te avisa</h2>
      <p class="note" style="margin:0">Esta app no tiene ning\u00fan servidor detr\u00e1s, as\u00ed que no puede darte un toque
      con el m\u00f3vil bloqueado. Lo que hace es meter cada cosa en el calendario del tel\u00e9fono <b>con su alarma</b>:
      de avisarte se encarga \u00e9l, que para eso est\u00e1 hecho y funciona con la app cerrada.</p>
      ${icsCatsHTML(ui.calDesde||calRango().desde,ui.calHasta||calRango().hasta)}
      <label class="fld" style="max-width:260px;margin-top:11px">Avisar antes de cada cosa (minutos)
        <input type="number" min="0" max="180" value="${+store.rotation.icsAvisoMin||30}" data-a="ics-aviso-min"></label>
      <div class="row" style="margin-top:9px;gap:8px">
        <label class="fld" style="flex:0 0 150px">Hora de ir a entrenar
          <input type="time" value="${esc(gymS().hora||'')}" data-a="gym-hora"></label>
        <label class="fld" style="flex:0 0 130px">Dura (min)
          <input type="number" min="15" max="240" step="5" value="${+gymS().duracion||75}" data-a="gym-duracion"></label></div>
      <p class="mini" style="margin:6px 0 0">Para los días con rutina que no traen hora propia. El «Día de fuerza» manda con sus horas (${esc(((shiftById('sh-f')||{}).start||'—')+'–'+((shiftById('sh-f')||{}).end||'—'))}); sin ninguna de las dos, el entreno va como aviso de todo el día.</p>
    </div>
    <div class="card"><h2>Llevarlo al calendario</h2>
      <p class="note">Elige el rango y desc\u00e1rgalo. Abajo tienes los pasos para dejarlo sincronizado en Google.</p>
      <div class="row">
        <label class="fld">desde<input type="date" id="calDesde" data-a="cal-desde" value="${esc(ui.calDesde||calRango().desde)}"></label>
        <label class="fld">hasta<input type="date" id="calHasta" data-a="cal-hasta" value="${esc(ui.calHasta||calRango().hasta)}" min="${esc(ui.calDesde||calRango().desde)}"></label>
      </div>
      <div class="row" style="margin-top:9px">
        <button class="btn p" data-a="cal-descargar">descargar .ics</button>
        <button class="btn s" data-a="cal-copiar">copiar el .ics</button>
        <button class="btn ${ui.calView?'':'p'} s" data-a="cal-ver">${ui.calView?'ocultar la lista':'ver la lista'}</button></div>
      <div id="txtIcs" class="mini" style="${ui.calView?'margin-top:8px':'display:none;margin-top:8px'};background:color-mix(in srgb,var(--card) 55%,var(--bg));border:1px solid var(--line);border-radius:10px;padding:10px;max-height:200px;overflow:auto;white-space:pre;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px">${esc(ui.calTxt||'')}</div>
      <div class="row" style="margin-top:11px">
        <label class="fld" style="flex:1 1 200px">nombre del cuaderno<input id="calNombre" value="${esc(store.rotation.calNombre||'')}" placeholder="${esc(calNombreTxt(calRangoUI().desde))}"></label>
        <label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn s" data-a="cal-nombre">poner el nombre</button></label>
      </div>
      <label class="fld" style="margin-top:8px;flex-direction:row;align-items:center;gap:6px;font-size:12px;text-transform:none;font-weight:400">
        <input type="checkbox" id="calOculto" data-a="cal-oculto" style="width:auto" ${store.rotation.calOculto!==false?'checked':''}>
        <span>etiquetarlos (IMPORT_TAG) para poder filtrarlos u ocultarlos luego en Google</span></label>
      ${ui.calView?`<p class="mini" style="margin:9px 0 0">la caja de arriba es el <code>.ics</code> tal cual: si tu editor no lo parte en l\u00edneas de 75, Google no lo traga \u2014 por eso el <i>descargar</i> es el camino normal, y esto solo para copiar y pegar</p>`:''}
      ${calNotas()}</div>
    <div class="card"><h2>Traer un calendario de fuera</h2>
      <p class="note">Exporta tu calendario de Google a <code>.ics</code> (⚙ → Importar y exportar → Exportar calendario),
      sube aquí ese archivo (o pégalo a mano abajo) y la app reconoce tus días. Antes de escribir nada te enseña
      <b>lo que va a hacer y lo que deja como está</b>, con el título de cada evento y su hora.</p>
      <div class="row" style="margin-top:8px;align-items:center">
        <label class="fld" style="flex:0 0 auto">archivo .ics<input type="file" id="icsFile" data-a="ics-file" accept=".ics,text/calendar"></label>
        <span class="mini">se lee aquí mismo, en tu navegador — no se sube a ningún sitio</span></div>
      <textarea id="icsBox" rows="7" data-a="ics-in" style="margin-top:8px" placeholder="BEGIN:VCALENDAR&#10;BEGIN:VEVENT&#10;DTSTART;VALUE=DATE:20260911&#10;SUMMARY:Guardia Urgencias&#10;END:VEVENT&#10;END:VCALENDAR">${esc(ui.icsTxt||'')}</textarea>
      <div class="row" style="margin-top:8px">
        <label class="fld">empezar a mirar desde<input type="date" id="icsDesde" data-a="cal-ics-desde" value="${esc(ui.icsDesde||calIniMes(iso(monthDate)))}"></label>
        <label class="fld">y hasta<input type="date" id="icsHasta" data-a="cal-ics-hasta" value="${esc(ui.icsHasta||calFinMes(iso(monthDate)))}"></label>
        <span class="sp"></span>
        <button class="btn s" data-a="cal-analizar">Analizar el .ics</button>
        <button class="btn p" data-a="cal-aplicar" id="calApply" ${ui.icsPrev&&ui.icsPrev.ok?'':'disabled'}>Marcar esos días</button>
        <label class="fld" style="flex:0 0 auto;font-size:11px;text-transform:none"><span class="row" style="gap:5px">
          <input type="checkbox" id="calEncima" data-a="cal-encima" style="width:auto" ${ui.icsEncima?'checked':''}><span>pisar lo que yo puse a mano</span></span></label></div>
      ${ui.icsPrev?icsPreviewHTML(ui.icsPrev):'<div id="calOut" style="display:none"></div>'}
      <details class="plegable" style="margin-top:10px"><summary>traerlo de una URL pública</summary>
        <div class="row" style="margin-top:8px">
          <label class="fld" style="flex:1 1 240px">la dirección del .ics<input id="icsUrl" data-a="cal-url-in" value="${esc(ui.calUrl||'')}" placeholder="https://…/mi-calendario.ics"></label>
          <button class="btn s" data-a="cal-url">leer la URL</button></div>
        <p class="mini" style="margin-top:6px">Sólo <code>https://</code> y sólo si ese servidor deja leer desde fuera
        (en Google, «disponible para cualquier persona» + la URL pública del calendario). Si falla, no toca nada:
        pega el fichero a mano. <b>Ojo:</b> es tu navegador el que pide esa URL directamente, sin pasar por ningún
        servidor nuestro — quien aloje ese calendario puede ver que alguien lo ha leído, como al abrir cualquier enlace.</p>
        <p class="mini" style="margin-top:6px">La app no se conecta a Google por su cuenta (harían falta claves y un
        servidor): lee y escribe ficheros <code>.ics</code>, que es el idioma común de los calendarios. El
        <code>IMPORT_TAG</code> y los <code>UID</code> estables son lo que hace que Google actualice en vez de duplicar.</p>
      </details></div>`);
  if(v==='sol')return ajuPantalla('\u2600\ufe0f El sol y d\u00f3nde estoy',`<div class="card" data-cfg="sol">
      <p class="note">A qué hora sale y se pone el sol cada día, en «Hoy» y en «Semana». Se calcula aquí,
      en el móvil, con la latitud y la longitud: no sale nada a internet y funciona sin cobertura. Las horas salen
      en el reloj de tu móvil y la precisión es de unos minutos.</p>
      ${solHoyHTML()}
      <div class="chips" style="margin-top:11px">${sitiosS().map(function(s){
        const mio=!SITIOS_FIJOS.some(function(f){return f.id===s.id;});
        return '<button class="chipx'+(s.id===sitioActual().id?' on':'')+'" data-a="sitio-set" data-id="'+esc(s.id)+'">'+
          esc(s.nombre)+(mio?('<b class="x" data-a="sitio-del" data-id="'+esc(s.id)+'" title="quitar este sitio">×</b>'):'')+'</button>';}).join('')+
        '<button class="chipx" data-a="sitio-nuevo">'+(ui.sitioNuevo?'▴ cancelar':'+ añadir un sitio')+'</button>'}</div>
      ${ui.sitioNuevo?`<div class="row" style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px">
        <label class="fld" style="flex:1 1 150px">nombre<input id="stNombre" placeholder="Valencia"></label>
        <label class="fld" style="flex:0 0 108px">latitud<input id="stLat" type="number" step="0.0001" min="-90" max="90" placeholder="39.4699"></label>
        <label class="fld" style="flex:0 0 108px">longitud<input id="stLon" type="number" step="0.0001" min="-180" max="180" placeholder="-0.3763"></label>
        <label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn p" data-a="sitio-add">guardar el sitio</button></label>
        </div>
        <p class="mini" style="margin:8px 0 0">La longitud es <b>negativa al oeste</b>: Las Palmas es −15.44 y Barcelona +2.17.
        O deja que lo ponga el móvil: <button class="btn s" style="padding:3px 9px" data-a="sitio-gps">usar mi ubicación</button></p>`:''}
      ${(function(){const t=tzCuadra();
        if(t.ok)return '';
        return '<p class="note" style="margin:11px 0 0;color:var(--warn)">⚠ Tu móvil está en <b>'+esc(t.movil)+
          '</b> y «'+esc(sitioActual().nombre)+'» va por <b>'+esc(t.sitio)+'</b>. Las horas se enseñan siempre en el '+
          '<b>reloj de tu móvil</b>, así que verás el sol de '+esc(sitioActual().nombre)+' puesto en tu hora: no es la hora '+
          'a la que allí amanece. Cambia el sitio, o la zona horaria del móvil.</p>';})()}</div>`,sitioActual().nombre);
  if(v==='aspecto')return ajuPantalla('\ud83c\udfa8 C\u00f3mo se ve',`<div class="card" data-cfg="temas"><h2>Temas</h2>
      <p class="note">Cinco aspectos ya ajustados: fondo, texto, acento y los colores de la franja van juntos y se leen bien. Tocar uno cambia todo a la vez.</p>
      <div class="temas">${TEMAS.map(function(t){const on=(store.tema||{}).preset===t.id;
        return '<button class="tema'+(on?' on':'')+'" data-a="tema-pre" data-id="'+t.id+'" aria-pressed="'+(on?'true':'false')+'" '+
          'style="background:'+t.v.bg+';color:'+t.v.ink+';border-color:'+(on?t.v.brand:t.v.line)+'">'+
          '<span class="tmues" style="background:'+t.v.card+'">'+
            '<i style="background:'+t.v.brand+'"></i><i style="background:'+t.v.brand2+'"></i>'+
            '<b style="background:linear-gradient(90deg,'+t.f.sleep+' 0 30%,'+t.f.work+' 30% 62%,'+t.f.meal+' 62% 70%,'+t.f.gym+' 70% 82%,'+t.f.evt+' 82%)"></b></span>'+
          '<span class="tnom">'+esc(t.nombre)+(on?' ✓':'')+'</span>'+
          '<span class="tmodo" style="color:'+t.v.ink2+'">'+(t.modo==='dark'?'oscuro':'claro')+'</span></button>';}).join('')}</div></div>
    <div class="card" data-cfg="franja"><h2>La franja del d\u00eda</h2>
      <p class="note">La barra que aparece en «Hoy», «Semana» y al abrir un día. Cada cosa lleva su color fijo, sea cual sea el tipo de día.</p>
      <label class="fld" style="max-width:260px">Cuántas horas se ven
        <select data-a="franja-horas">${[[24,'24 h · el día entero'],[18,'18 h'],[12,'12 h · centrada en tu día']].map(function(o){
          return '<option value="'+o[0]+'" '+(tlHoras()===o[0]?'selected':'')+'>'+o[1]+'</option>';}).join('')}</select></label>
      <div class="colgrid">${TLCAT.map(function(c){
        return '<label class="fld">'+esc(c[1])+
          '<input type="color" value="'+esc(tlColor(c[0]))+'" data-a="franja-color" data-k="'+c[0]+'" style="height:30px;padding:2px">'+
          '</label>';}).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn s" data-a="franja-reset">restablecer colores</button></div>
      <div style="margin-top:12px">${timelineBar(iso(new Date()))}</div></div>
    <div class="card"><h2>Apariencia</h2>
      <div class="row">
        <label class="fld" style="flex:0 0 auto">Color principal<input type="color" value="${esc(tm.brand||'#38e1ff')}" data-a="tema-f" data-k="brand" style="height:30px;width:56px;padding:2px"></label>
        <label class="fld" style="flex:0 0 auto">Color secundario<input type="color" value="${esc(tm.brand2||'#7c5cff')}" data-a="tema-f" data-k="brand2" style="height:30px;width:56px;padding:2px"></label>
        <label class="fld" style="flex:0 0 auto">Color del texto<input type="color" value="${esc(tm.ink||'#e9f2ff')}" data-a="tema-f" data-k="ink" style="height:30px;width:56px;padding:2px"></label>
        <label class="fld" style="flex:0 0 auto;justify-content:flex-end"><button class="btn s" data-a="tema-reset">restablecer</button></label>
      </div>
      <p class="mini" style="margin-top:8px">Se aplica igual en modo claro y en modo oscuro. Si en algún móvil ves letras en negro que casi no se leen (por ejemplo en el nombre del tipo de día en «Mes»), pon aquí el color de texto a mano — aunque ya debería verse bien de fábrica.</p>
      <label class="fld" style="max-width:220px;margin-top:12px">Primer día de la semana en «Mes»
        <select data-a="cal-weekstart"><option value="lun" ${store.rotation.calWeekStart!=='dom'?'selected':''}>Lunes</option>
          <option value="dom" ${store.rotation.calWeekStart==='dom'?'selected':''}>Domingo</option></select></label></div>`);
  if(v==='lector')return ajuPantalla('\ud83d\udd17 Lector de enlaces',`<div class="card" data-cfg="lector">
      <p class="note">Para que al mandarle un enlace de TikTok la app traiga sola la descripción y la convierta en receta.
      Primero lo intenta directamente con la plataforma; esto es para cuando el navegador no la deja.</p>

      <div class="res" style="border-top:0">
        <span class="nm"><b>Lectores públicos</b><span class="mini">servicios gratuitos de terceros que hacen de intermediarios</span></span>
        <button class="btn s${lectorPublicoOn() ? ' g' : ''}" data-a="${lectorPublicoOn() ? 'lector-publico-off' : 'lector-publico'}">${lectorPublicoOn() ? '✓ activados' : '○ desactivados'}</button>
      </div>
      <p class="mini" style="margin:0 0 12px">Lo único que sale de tu móvil es <b>la dirección del vídeo</b>, que es pública de por sí.
      Ni tus recetas, ni tus menús, ni nada tuyo pasa por ahí. Se prueban ${LECTORES_PUBLICOS.length} por orden:
      ${LECTORES_PUBLICOS.map(function(l){return esc(l.nombre);}).join(' y ')}. Son de terceros: van y vienen, y pueden dejar de funcionar sin avisar.</p>

      <label class="fld">tu propio lector — el más fiable, y nada sale hacia terceros
        <input type="url" inputmode="url" value="${esc((store.lector||{}).proxy||'')}" data-a="lector-f" placeholder="https://recetas.tu-usuario.workers.dev"></label>
      <div class="row" style="margin-top:9px">
        <button class="btn s" data-a="lector-probar">probar</button>
        <button class="btn s" data-a="lector-guia">${ui.lectorGuia ? '▴ ocultar los pasos' : '▾ cómo montarlo (5 min, gratis)'}</button>
        <span class="mini">si lo pones, se usa solo este</span></div>
      ${ui.lectorGuia ? ('<ol class="mini" style="margin:11px 0 0;padding-left:20px;line-height:1.7">' +
        '<li>Entra en <a href="https://dash.cloudflare.com/" target="_blank" rel="noopener">dash.cloudflare.com</a> y crea una cuenta (gratis, sin tarjeta).</li>' +
        '<li>Workers &amp; Pages → <b>Create</b> → <b>Worker</b>. Ponle el nombre que quieras y dale a <b>Deploy</b>.</li>' +
        '<li><b>Edit code</b>: borra lo que haya y pega el contenido de <code>tools/worker-recetas.js</code> del repositorio de la app. <b>Deploy</b> otra vez.</li>' +
        '<li>Copia la dirección que te da (acaba en <code>.workers.dev</code>) y pégala aquí arriba. Dale a «probar».</li>' +
        '</ol><p class="mini" style="margin:8px 0 0">El Worker solo acepta enlaces de TikTok, YouTube e Instagram: no es un proxy abierto. ' +
        'La explicación larga está en <code>tools/LECTOR-DE-ENLACES.md</code>.</p>') : ''}</div>`,lectorPublicoOn()?'p\u00fablicos on':( (store.lector||{}).proxy?'el tuyo':'apagado'));
  if(v==='comida')return ajuPantalla('\ud83e\udd57 Datos de los alimentos',`<div class="card" data-cfg="usda">
      <p class="note">La tabla de alimentos que trae la app son <b>${ALIMENTOS.length} valores de referencia aproximados</b>,
      escritos a partir de tablas de composición publicadas. Sirven para hacerte una idea, no son una base oficial.
      Con una clave gratuita de USDA FoodData Central, cada alimento que abras se corrige con el dato oficial y se guarda ya corregido.</p>
      <label class="fld">tu clave de FoodData Central
        <input type="text" inputmode="latin" autocomplete="off" value="${esc((store.usda||{}).key||'')}" data-a="usda-f" placeholder="pégala aquí"></label>
      <div class="row" style="margin-top:9px">
        <button class="btn s" data-a="usda-probar">probar</button>
        <button class="btn s" data-a="usda-guia">${ui.usdaGuia ? '▴ ocultar los pasos' : '▾ cómo sacarla (2 min, gratis)'}</button>
        <span class="sp"></span>
        <span class="mini">${Object.keys(food().usda).length} alimento(s) ya corregidos</span></div>
      ${ui.usdaGuia ? ('<ol class="mini" style="margin:11px 0 0;padding-left:20px;line-height:1.7">' +
        '<li>Entra en <a href="https://fdc.nal.usda.gov/api-key-signup.html" target="_blank" rel="noopener">fdc.nal.usda.gov</a> y pide una clave con tu correo.</li>' +
        '<li>Te llega al momento por email. Cópiala y pégala aquí arriba.</li>' +
        '<li>Listo: al abrir la ficha de un alimento verás el sello verde de USDA en vez de «aproximado».</li>' +
        '</ol><p class="mini" style="margin:8px 0 0">La clave se queda en tu móvil. Lo único que sale hacia USDA es ' +
        '<b>el nombre del alimento en inglés</b> —«bananas, raw»—: ni lo que comes, ni tus menús, ni nada tuyo. ' +
        'Eso sí: se guarda junto al resto de tus datos, así que si le pasas a alguien tu copia de seguridad en JSON, la clave va dentro.</p>') : ''}
      ${Object.keys(food().usda).length ? ('<div class="row" style="margin-top:10px"><button class="btn d s" data-a="usda-olvidar-todo">volver todo a la tabla aproximada</button></div>') : ''}</div>`,usdaOn()?'USDA':'tabla local');
  /* la portada: qu\u00e9 tienes encendido, y una puerta por tarea */
  const linea=function(em,tit,val,off){
    return '<div class="estado"><span class="em">'+em+'</span><span class="tx"><b>'+esc(tit)+'</b></span>'+
      '<span class="vl'+(off?' off':'')+'">'+esc(val)+'</span></div>';};
  const puerta=function(vista,ico,tit,sub){
    return '<button class="puerta" data-a="aju-vista" data-v="'+vista+'">'+gymIco(ico)+
      '<b>'+esc(tit)+'</b><span class="s">'+esc(sub)+'</span></button>';};
  const lec=(store.lector||{}).proxy?'el tuyo':(lectorPublicoOn()?'p\u00fablicos':'apagado');
  const sc=suenoCfg();
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><h2 class="subtit">\u2699\ufe0f Ajustes</h2></div>'+
    '<div class="card"><h2>Qu\u00e9 tienes encendido</h2>'+
      linea('\ud83d\udcc5','Calendario del m\u00f3vil','aviso '+(+store.rotation.icsAvisoMin||30)+' min antes')+
      linea('\u2600\ufe0f','D\u00f3nde estoy',sitioActual().nombre)+
      linea('\ud83d\udecc','Sue\u00f1o','m\u00ednimo '+sc.min+' h')+
      linea('\ud83c\udf5e','Gluten',esCeliaco()?'te aviso':'apagado',!esCeliaco())+
      linea('\ud83e\udd57','Datos de los alimentos',usdaOn()?'USDA oficial':'tabla aproximada',!usdaOn())+
      linea('\ud83d\udd17','Lector de enlaces',lec,lec==='apagado')+
    '</div>'+
    '<div class="puertas">'+
      puerta('calendario','calendario','Calendario','y los avisos')+
      puerta('sol','sol','El sol',sitioActual().nombre)+
      puerta('aspecto','pincel','C\u00f3mo se ve',(store.tema&&store.tema.brand?'a tu color':'oscuro')+' \u00b7 la franja')+
      /* el perfil vive en Comer porque es lo que decide las kcal, pero la puerta también va aquí:
         «tú» es de las cosas que se buscan en Ajustes */
      '<button class="puerta" data-a="ir-perfil">'+gymIco('balanza')+
        '<b>T\u00fa</b><span class="s">'+(perfilS().alturaCm?(fmt(perfilS().alturaCm/100)+' m'):'altura')+
        ' \u00b7 '+(perfilS().pesoKg?(fmtKg(perfilS().pesoKg)+' kg'):'peso')+
        (esCeliaco()?' \u00b7 cel\u00edaco':'')+'</span></button>'+
    '</div>'+
    '<div class="puertas" style="margin-top:9px">'+
      puerta('lector','enlace','Lector',lec)+
      puerta('comida','manzana','Alimentos',usdaOn()?'USDA':'tabla local')+
      '<button class="puerta" data-a="ir-sueno">'+gymIco('cama')+
        '<b>Sue\u00f1o</b><span class="s">est\u00e1 en Turno \u2192</span></button>'+
    '</div>'+
    '<p class="mini" style="margin:13px 0 0">Los horarios de cada tipo de d\u00eda, las guardias y tus rotaciones est\u00e1n en '+
      '<button class="lnk" data-a="ir-tab" data-t="cfg">Turno y rotaci\u00f3n</button>. '+
      'Importar y sacar datos, en <button class="lnk" data-a="ir-tab" data-t="data">Datos</button>. '+
      'Y tus citas, en <button class="lnk" data-a="ir-tab" data-t="eventos">Eventos</button>.</p>'+
  '</div>';
}

/* ===================== render: datos =====================
   Eran 7 tarjetas y 4 317 px, con el calendario de Google partido en dos (y una tercera copia en
   Ajustes) y 210 palabras explicando d\u00f3nde se guarda todo. Ahora: portada con tu copia arriba
   \u2014que es lo \u00fanico urgente de esta pantalla\u2014 y una pantalla por tarea. */
function datosPantalla(titulo,cuerpo,extra){
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab">'+
      '<button class="btn s volver" data-a="datos-vista" data-v="">'+gymIco('atras','gico sm')+' Datos</button>'+
      '<h2 class="subtit">'+esc(titulo)+'</h2>'+(extra?('<span class="tag b2">'+esc(extra)+'</span>'):'')+'</div>'+
    cuerpo+'</div>';}
function renderData(){
  const v=ui.datosVista||'';
  if(v==='planning'){datosPantalla('\ud83d\uddc2 Mi planning',`<div class="card">
      <p class="note">Pega aquí las líneas del mes, tal cual: <i>1 ago G 08:00-08:00</i>. Reconoce día+mes, tipo de día (guardia/saliente/fuerza/libre/descanso/asuntos propios/vacante/noche) y horarios, agrupa por semanas y genera las semanas tipo —incluida la variante de 1 y 2 guardias— con sus horarios puestos en los turnos.</p>
      <textarea id="pasteBox" rows="12" placeholder="1 ago · G 24h 08:00-08:00 guardia destino Sur&#10;2 ago · S 09:00-13:00 saliente&#10;3 ago · L libre&#10;4 ago · F fuerza 18:00&#10;5 ago · L asuntos propios&#10;6 ago · G 24h 08:00-08:00&#10;7 ago · S 09:00-13:00"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn p" data-a="draft">Analizar</button>
      <button class="btn" data-a="draft-apply" disabled id="applyBtn">Aplicar al planning</button>
      <button class="btn g" data-a="draft-semanales" hidden id="semBtn">+ crear esos eventos semanales</button>
      <span class="mini" id="draftMsg"></span></div>
      <div id="draftOut" class="mini" style="background:color-mix(in srgb,var(--card) 55%,var(--bg));border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:8px;display:none;white-space:pre-wrap"></div>
      <label class="fld" style="margin-top:8px">Letras de tus días — añade una si te falta alguna (p. ej. <i>V=Noche en el cuarto</i>)
        <input id="codeMap" value="G=Guardia 24 h,S=Saliente,F=Fuerza,L=Libre" title="formato: LETRA=Nombre del día. Las cuatro de siempre están reconocidas; si añades V=Noche en el cuarto, las líneas que digan «noche en el cuarto» se cuentan como V y se crea ese tipo de día con su horario."></label>
      <p class="mini" style="margin-top:6px">Los días que no aparezcan en tu texto se rellenan como día libre para cerrar la semana: luego los cambias en «Turno y rotación».</p></div>`);
    if(window._draftInfo)showDraft(window._draftInfo);return;}
  if(v==='dieta'){datosPantalla('\ud83c\udf7d Mi dieta',`<div class="card">
      <p class="note">Pon un encabezado por día (<i>GUARDIA</i>, <i>SALIENTE</i>, <i>LIBRE</i>, <i>DIAS DE FUERZA</i>) y debajo <i>desayuno: …</i>, <i>comida: …</i>, <i>cena: …</i>. Cada plato se busca contra tu catálogo por las palabras de su nombre; lo que no se reconozca se lista para que lo añadas como plato nuevo.</p>
      <textarea id="dietBox" rows="8" placeholder="GUARDIA&#10;desayuno: café con leche y tostada integral&#10;comida: arroz con pollo y verduras + fruta&#10;cena: bocadillo de atún&#10;SALIENTE&#10;comida: lentejas con arroz"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn" data-a="diet">Relacionar con mis platos</button>
      <button class="btn g" data-a="diet-apply" disabled id="dietApply">Guardar como menús sugeridos</button></div>
      <div id="dietOut" class="mini" style="background:color-mix(in srgb,var(--card) 55%,var(--bg));border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:8px;display:none;white-space:pre-wrap"></div></div>`);
    if(window._dietInfo)showDiet(window._dietInfo);return;}
  if(v==='horas')return datosPantalla('\ud83d\udd50 Horas, servicios y vacaciones',`<div class="card">
      <p class="note">Tres cosas a la vez: el horario fijo del día (levantarse, desayuno, salir, llegar, acostarse, trabajar), qué servicio rotas cada mes con su cupo de guardias y tus rangos de vacaciones. Se puede pegar tal cual, en plan nota.</p>
      <textarea id="rhythmBox" rows="7" placeholder="entre semana: me levanto 6:45-6:55, desayuno normal (café, fruta y nueces, whey y leche de proteínas), salgo de casa 7:30, llego 7:45, trabajo 8:00-15:00, me acuesto 23:00&#10;guardia: me acuesto 22:30&#10;libre: me levanto 8:30, duermo 23:45&#10;septiembre: urgencias (4+2) · octubre: umi · noviembre: urgencias 4+2&#10;vacaciones del 24/08 al 2/09"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn p" data-a="rhythm">Analizar horas, meses y vacaciones</button>
      <button class="btn" data-a="rhythm-apply" disabled id="rhythmApply">Aplicar al planning</button>
      <span class="mini" id="rhythmMsg"></span></div>
      <div id="rhythmOut" class="mini" style="background:color-mix(in srgb,var(--card) 55%,var(--bg));border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:8px;display:none;white-space:pre-wrap"></div>
      <label class="fld" style="margin-top:8px">Año en el que aplico los meses
        <input type="number" id="rhythmYear" value="${new Date().getFullYear()}" min="2000" max="2100" style="max-width:110px"></label>
      <p class="mini" style="margin-top:6px">Lo que no se entienda se ignora y se dice: no se toca ningún horario que no hayas mencionado y no se reparte ninguna guardia ni se da por hecho ningún servicio de mes si tú no lo escribes.</p></div>`);
  if(v==='copia')return datosPantalla('\ud83d\udcbe Copias de seguridad',`<div class="card" data-cfg="copias"><h2>Dónde se guarda todo esto</h2>
      <p class="note"><b>En este móvil y en ningún sitio más.</b> Tus rutinas, tus menús, lo que apuntas de comer y tus guardias
      se guardan dentro de la propia app, en este aparato. No hay cuenta, no hay servidor, no viaja a ninguna parte:
      ni yo ni nadie puede verlo. La contrapartida es que <b>nadie puede devolvértelo si lo pierdes</b>.</p>
      <p class="mini" style="margin:0 0 10px">Versión instalada: <b>${esc(versionActual()||'comprobando…')}</b>${
        hayVersionNueva() ? ' · <b style="color:var(--brand)">hay una más nueva</b>' : ''}</p>
      <div class="dosdatos" style="margin-bottom:11px">
        <div><b>${_almacen.estado === 'si' ? '✓' : (_almacen.estado === 'no' ? '⚠' : '…')}</b><span>${
          _almacen.estado === 'si' ? 'protegido' : (_almacen.estado === 'no' ? 'sin proteger' : 'comprobando')}</span></div>
        <div><b>${_almacen.usado != null ? esc(tamanoLegible(_almacen.usado)) : '—'}</b><span>ocupado</span></div>
      </div>
      <p class="mini" style="margin:0 0 11px">${_almacen.estado === 'si'
        ? 'El navegador se ha comprometido a no borrar tus datos para hacer sitio. Solo desaparecen si los borras tú.'
        : (_almacen.estado === 'no'
          ? '⚠ El navegador no ha querido marcarlos como permanentes: si al móvil le falta espacio, podría borrarlos para hacer hueco. Instala la app desde el menú del navegador («Instalar aplicación») y suele concederse; mientras tanto, baja el JSON más a menudo.'
          : 'Comprobando si el navegador los tiene marcados como permanentes…')}</p>
      <p class="note" style="margin-bottom:6px"><b>Lo que sí se los lleva por delante, aunque estén protegidos:</b>
      desinstalar la app, «borrar datos del sitio» o limpiar el navegador a fondo, y cambiar de móvil.
      Para cualquiera de esas tres, la única red de seguridad es el JSON de aquí abajo.</p>
      <h2 style="margin-top:14px">Copia de seguridad (JSON)</h2>
      <p class="note">Descárgalo y guárdalo donde quieras —Drive, el correo a ti mismo, lo que sea—. Sirve también para
      pasarte todo a otro móvil: lo bajas aquí y lo pegas allí en «Importar JSON».</p>
      <p class="mini" style="${diasDesdeBackup()===null||diasDesdeBackup()>avisoBackupD()?'color:var(--warn);font-weight:700':''}">
      ${diasDesdeBackup()===null?'⚠ todavía no has hecho ninguna copia de seguridad':
        (diasDesdeBackup()===0?'última copia: hoy':'última copia: hace '+diasDesdeBackup()+' día'+(diasDesdeBackup()===1?'':'s')+(diasDesdeBackup()>avisoBackupD()?' — te toca otra':''))}</p>
      <div class="row" style="margin-top:6px"><button class="btn" data-a="export">Descargar JSON</button><button class="btn" data-a="copy">Copiar JSON</button>
      <span class="sp"></span><button class="btn d" data-a="reset">Restaurar el ejemplo</button></div>
      <textarea id="importBox" rows="8" placeholder="Pega aquí un JSON y pulsa Importar" style="margin-top:8px"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn g" data-a="import">Importar JSON</button></div>
      <div class="row" style="margin-top:12px;border-top:1px solid var(--line);padding-top:11px">
        <label class="fld" style="max-width:250px">Avisarme si llevo sin copia (d\u00edas)
          <input type="number" min="1" max="90" value="${avisoBackupD()}" data-a="backup-aviso-d"></label>
      </div></div>`);
  if(v==='texto')return datosPantalla('\ud83d\udcc4 Texto para imprimir',`<div class="card">
      <p class="note">La semana vista, con kcal y proteína por comida, y las tandas de cocina. Se pega en cualquier chat.</p>
      <div class="row"><button class="btn" data-a="txt">Generar</button><button class="btn" data-a="txtcopy">Copiar</button></div>
      <textarea id="txtOut" rows="16" readonly style="margin-top:8px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px"></textarea></div>`);
  /* la portada: tu copia arriba, y una puerta por tarea */
  const puerta=function(vista,ico,tit,sub){
    return '<button class="puerta" data-a="datos-vista" data-v="'+vista+'">'+gymIco(ico)+
      '<b>'+esc(tit)+'</b><span class="s">'+esc(sub)+'</span></button>';};
  const d=diasDesdeBackup(),toca=(d===null||d>avisoBackupD());
  const cuando=d===null?'nunca':(d===0?'hoy':('hace '+d+' d\u00eda'+(d===1?'':'s')));
  $('#main').innerHTML='<div class="grid">'+
    '<div class="subcab"><h2 class="subtit">\ud83d\udce4 Datos</h2></div>'+
    '<div class="card'+(toca?' avisa':'')+'"><h2>Tu copia de seguridad</h2>'+
      '<div class="dosdatos">'+
        '<div><b>'+esc(cuando)+'</b><span>\u00faltima copia</span></div>'+
        '<div><b>'+esc(_almacen.usado!=null?tamanoLegible(_almacen.usado):'\u2014')+'</b><span>ocupa la app</span></div>'+
      '</div>'+
      (toca?('<p class="mini" style="margin:10px 0 0;color:var(--warn)">\u26a0 Te toca otra copia: todo esto vive solo en este m\u00f3vil, y nadie puede devolv\u00e9rtelo si lo pierdes.</p>'):'')+
      '<div class="row" style="margin-top:11px">'+
        '<button class="btn p" data-a="export">guardar una copia</button>'+
        '<button class="btn s" data-a="datos-vista" data-v="copia">restaurar o ver d\u00f3nde se guarda</button>'+
      '</div>'+
    '</div>'+
    '<div class="puertas">'+
      puerta('planning','tabla','Mi planning','pegar la tabla')+
      puerta('dieta','plato','Mi dieta','pegarla tal cual')+
      puerta('horas','reloj','Horas','servicios y vacaciones')+
    '</div>'+
    '<div class="puertas" style="margin-top:9px">'+
      puerta('copia','disco','Copias','y d\u00f3nde se guarda')+
      puerta('texto','hoja','Texto','para imprimir')+
      '<button class="puerta" data-a="aju-ir" data-v="calendario">'+gymIco('calendario')+
        '<b>Calendario</b><span class="s">est\u00e1 en Ajustes \u2192</span></button>'+
    '</div>'+
  '</div>';
}

function mapCodes(v){
  return String(v||'').split(/[,\n]/).map(function(x){
    const m=x.split('=');if(m.length<2)return null;
    const code=m[0].trim().toUpperCase(),name=m.slice(1).join('=').trim();
    return code&&name?{code:code.charAt(0).toUpperCase(),name:name}:null;}).filter(Boolean);
}
function showDraft(info){
  const out=$('#draftOut');out.style.display='block';
  const sb=$('#semBtn');
  if(sb){const n=(info.semanales||[]).length;sb.hidden=!n;
    if(n)sb.textContent='+ crear '+n+' evento'+(n===1?'':'s')+' semanal'+(n===1?'':'es');}
  const pat=info.weeks.map((w,i)=>i+': '+w.join(' ')+'  →  '+w.join('·')).join('\n');
  if(!info.dias){
    /* sin un solo día reconocido, el resumen de semanas no dice nada útil: mejor explicar qué
       espera esta caja y, si lo que han escrito es una sesión semanal, mandarles a su sitio */
    const sem=info.semanales&&info.semanales.length;
    out.textContent='No he reconocido ningún día de turno en ese texto.\n\n'+
      'Esta caja espera el cuadrante del mes, una línea por día, así:\n'+
      '  1 ago · G 08:00-08:00\n  2 ago · S 09:00-13:00\n  3 ago · L\n\n'+
      (sem?('Lo que has escrito son sesiones que se repiten cada semana, y eso va en Eventos, no aquí.\n'+
        'He entendido '+sem+':\n'+info.semanales.map(function(e){
          /* «martes» ya es plural: DOWN0[dow]+'s' daba «martess» */
          return '  · los '+DOWN0[e.dow]+', '+e.hora+(e.fin?('–'+e.fin):'')+' — '+e.titulo;}).join('\n')+
        '\n\nDale al botón de abajo y te los dejo puestos.')
        :'Si lo que quieres es una sesión que se repite cada semana, eso va en «Eventos» (menú «☰ Más»).');
    return;}
  out.textContent=
`Leídas ${info.leidas} líneas · ${info.dias} días con tipo de día (${info.skipped} sin reconocer, se ignoran).
Por semana: ${info.count.G} guardia(s), ${info.count.S} saliente(s), ${info.count.F} fuerza, ${info.count.L} libre(s) en ${info.weeks.length} semana(s) → media ${info.gPerWeek} guardia(s)/semana.
Horarios reconocidos: ${['G','S','F','L'].filter(k=>info.times[k]).map(k=>k+' '+info.times[k][0]+'–'+info.times[k][1]).join('  ·  ')||'ninguno (escribe «08:00-08:00» en la línea para que los ponga en el turno)'}
Semanas que voy a crear:
${pat||'—'}`;
  const pb=$('#pasteBox');
  const extra=window._draftExtrasInfo||(pb?parseRhythmText(pb.value||''):{days:{}});
  const sv=window._draftServices||
    (pb?parseServicesText(pb.value||'').months:[]);
  if(extra&&(extra.work||Object.keys(extra.days).length)){
    out.textContent+='\nHoras leídas del mismo texto: '+(extra.work?('trabajar '+extra.work[0]+'–'+extra.work[1]+' · '):'')+
      Object.keys(extra.days).map(function(k){const d=extra.days[k];
        return ((extra.labels&&extra.labels[k])||k)+': ⏰'+(d.wake||'—')+' 🛌'+(d.sleep||'—');}).join(' · ')+
      (extra.quickBf?' · desayuno rápido de diario':'');}
  if(sv&&sv.length){
    out.textContent+='\nServicios: '+sv.map(function(x){
      return x.months.map(function(m){return MON[m];}).join('+')+' → '+(x.label||x.service);}).join(' · ');}
  $('#draftMsg').textContent=info.dias?info.weeks.length+' semana(s) listas para aplicar':'no he encontrado días';
  $('#applyBtn').disabled=!info.dias;
}
function showDiet(res){
  const out=$('#dietOut');out.style.display='block';
  const hits=res.slots.filter(s=>s.items.some(i=>i.dishId));
  const missing=[];
  res.slots.forEach(s=>s.items.forEach(i=>{if(!i.dishId)missing.push(i.raw);}));
  const NOM={G:'Guardia',S:'Saliente',F:'Día de fuerza',L:'Día libre'};
  out.textContent=(res.heads.length?'Días reconocidos: '+res.heads.join(' · ')+'\n\n':'')+
    res.slots.map(s=>(s.day?('—— '+(NOM[s.day]||s.day)+' ——\n'):'')+s.label+':  '+
      s.items.map(i=>i.label+(i.dishId?'':' *')).join('  + ')).join('\n')
   +'\n\n'+(missing.length?missing.length+' línea(s) que no están en el catálogo (añádelas como plato si quieres que cocine de ellas)':'todo reconocido')
   +'\nCon «Guardar como menús sugeridos» las coloco en el tipo de día que pone en el encabezado.';
  $('#dietApply').disabled=hits.length===0;
  return hits.length;
}
/* ===================== render ===================== */
const TABS=[['hoy','Hoy'],['week','Semana'],['month','Mes'],['gym','Entreno'],['shop','Compra'],['food','Comer'],['habitos','Hábitos'],['dinero','Dinero'],['types','Menú'],['batches','Tandas'],['import','Importar receta'],['cfg','Turno y rotación'],['data','Datos'],['ajustes','Ajustes']];
const CAL_SET=new Set(['hoy','week','month']);
const CAL_MODES=[['month','Mes'],['week','Semana'],['hoy','Hoy']];
/* Comer: lo que comes, lo que planeas, lo que cocinas y lo que compras eran tres destinos que no
   se nombraban entre ellos, aunque el código ya los encadena (el menú manda en las tandas y las
   tandas mandan en la compra). Son una sola sección con cuatro modos, como Calendario. */
const COMER_SET=new Set(['food','shop','types','batches','import']);
function comerModo(){
  if(ui.tab==='shop')return 'compra';
  if(ui.tab==='types')return 'menu';
  if(ui.tab==='batches')return 'cocina';
  if(ui.tab==='food'&&ui.foodVista==='cocina-panel')return 'cocina';
  return 'dia';}
function comerModosHTML(){
  const m=comerModo(),b=function(k,txt,a,v){
    return '<button class="'+(m===k?'on':'')+'" data-a="'+a+'" data-'+(a==='tab'?'t':'v')+'="'+v+'"'+
      (m===k?' aria-current="true"':'')+'>'+txt+'</button>';};
  return b('dia','Hoy','food-vista','')+b('menu','Menú','tab','types')+
    b('cocina','Cocina','food-vista','cocina-panel')+b('compra','Compra','tab','shop');}
const DRAWER_GROUPS=[
  ['Seguimiento',[['notas','📝 Notas'],['habitos','✅ Hábitos'],['dinero','💶 Dinero'],['eventos','📌 Eventos'],['estudio','📚 Estudio']]],
  ['Configuración',[['cfg','🕐 Turno y rotación'],['ajustes','⚙️ Ajustes'],['data','📤 Datos']]]
];
const MONTH_FULL=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function render(){
  try{renderNow();}catch(e){
    console.warn('fallo al pintar la vista',e);
    const m=$('#main');
    if(m)m.innerHTML='<div class="card"><h2>Se ha roto esta vista</h2><p class="note">Tus datos siguen guardados: '+
      'prueba con otra pestaña y, si nada arranca, vuelve a importar tu JSON o restaura el ejemplo desde «Datos».</p>'+
      '<p class="mini">'+esc(String((e&&e.message)||e))+'</p></div>';
  }
}
function renderNow(){
  _renderTick++;   /* invalida la caché de weekDays()/monthDays() de este render: se recalculan como mucho una vez cada uno */
  /* el asistente del primer arranque se come la pantalla entera: todavía no hay nada que navegar */
  if(ui.arranque)return renderArranque();
  if(ui.scanStream&&ui.tab!=='food')pararEscaner();   /* solo si de verdad se sale de Comida: un render de paso (p. ej. al filtrar) no debe apagar la cámara */
  const hk=iso(new Date()),ft=foodTotals(hk),gn=setsDe(hk).length,gc=guardCount(monthDate.getFullYear(),monthDate.getMonth());
  const BADGE={food:ft.kcal?ft.kcal+' kcal':'',gym:gn?gn+' series':'',month:(gc&&gc.any)?gc.any+' 🩺':''};
  const inCal=CAL_SET.has(ui.tab),inComer=COMER_SET.has(ui.tab);
  $('#tabs').innerHTML=
    `<button class="${inCal?'on':''}" data-a="nav-cal"${inCal?' aria-current="true"':''}>Calendario</button>`+
    `<button class="${ui.tab==='gym'?'on':''}" data-a="tab" data-t="gym"${ui.tab==='gym'?' aria-current="true"':''}>Entreno${BADGE.gym?'<span class="tb">'+BADGE.gym+'</span>':''}</button>`+
    `<button class="${inComer?'on':''}" data-a="nav-comer"${inComer?' aria-current="true"':''}>Comer</button>`+
    `<button data-a="drawer-toggle" aria-haspopup="true" aria-expanded="${ui.drawerOpen?'true':'false'}" aria-controls="drawer" title="Más" aria-label="Más">☰ Más</button>`;
  const cm=$('#calModes');
  if(cm){cm.hidden=!inCal&&!inComer;
    cm.innerHTML=inCal?CAL_MODES.map(t=>`<button class="${ui.tab===t[0]?'on':''}" data-a="tab" data-t="${t[0]}"${ui.tab===t[0]?' aria-current="true"':''}>${t[1]}${(t[0]==='month'&&BADGE.month)?'<span class="tb">'+BADGE.month+'</span>':''}</button>`).join(''):
      (inComer?comerModosHTML():'');}
  const dr=$('#drawer');
  if(dr)dr.innerHTML='<div class="drawer-head"><strong>Más</strong><button class="btn s" data-a="drawer-close" aria-label="Cerrar menú">✕</button></div>'+
    DRAWER_GROUPS.map(g=>'<div class="drawer-group"><h4>'+g[0]+'</h4>'+
      g[1].map(t=>`<button class="drawer-item ${ui.tab===t[0]?'on':''}" data-a="drawer-nav" data-t="${t[0]}">${t[1]}${BADGE[t[0]]?'<span class="tb">'+BADGE[t[0]]+'</span>':''}</button>`).join('')+
      '</div>').join('');
  const d=store.rotation.mode==='date'?addDays(mondayOf(weekDate),6):null;
  const mlbl=MONTH_FULL[monthDate.getMonth()]+' '+monthDate.getFullYear();
  $('#wkLabel').textContent=store.rotation.mode==='date'
    ? `${weekDate.getDate()} ${MON[weekDate.getMonth()]} – ${d.getDate()} ${MON[d.getMonth()]}`
    : `plantilla · ${esc(store.patterns[store.rotation.pattern]?store.patterns[store.rotation.pattern].name:'—')}`;
  if(ui.tab==='month')$('#wkLabel').textContent=mlbl;
  if(ui.tab==='week'&&store.rotation.mode==='date'){const a0=semDesde(),b0=addDays(a0,semDias()-1);
    $('#wkLabel').textContent=a0.getDate()+' '+MON[a0.getMonth()]+' – '+b0.getDate()+' '+MON[b0.getMonth()];}
  if(ui.tab==='hoy'){const dh=parseDate(fechaHoy())||new Date();
    $('#wkLabel').textContent=DIA3[dh.getDay()]+' '+dh.getDate()+' '+MON[dh.getMonth()]+(ui.diaHoy?'':' · hoy');}
  /* las flechas ‹ › solo tienen un efecto real en Mes (mueven el mes) o en Semana+«por fecha» (mueven la semana);
     en cualquier otro caso (Hoy, Semana en plantilla, Entreno, Compra, cajón) se ocultan para no cambiar una fecha oculta sin avisar */
  const wkNav=$('#wkNav');
  if(wkNav){
    const modoFecha=store.rotation.mode==='date';
    wkNav.hidden=!(ui.tab==='month'||ui.tab==='hoy'||(ui.tab==='week'&&modoFecha));
    const lbl=ui.tab==='month'?'mes':ui.tab==='hoy'?'día':'semana';
    const bPrev=document.querySelector('[data-a="wk-prev"]'),bNext=document.querySelector('[data-a="wk-next"]');
    if(bPrev){bPrev.title=lbl+' anterior';bPrev.setAttribute('aria-label',bPrev.title);}
    if(bNext){bNext.title=lbl+' siguiente';bNext.setAttribute('aria-label',bNext.title);}
  }
  const mm=$('#main');if(mm){mm.classList.remove('in');
    /* reiniciar la animación sin forzar un reflow síncrono (antes: void mm.offsetWidth) */
    requestAnimationFrame(function(){mm.classList.add('in');});}
  const bt=document.querySelector('[data-a="theme"]');
  if(bt){const osc=document.documentElement.classList.contains('dark');bt.textContent=osc?'☀️':'🌙';
    bt.title=osc?'Modo día':'Modo noche HUD';bt.setAttribute('aria-label',bt.title);}
  ({hoy:renderHoy,week:renderWeek,month:renderMonth,food:renderFood,gym:renderGym,notas:renderNotas,habitos:renderHabitos,types:renderTypes,batches:renderBatches,import:renderImport,shop:renderShop,dinero:renderDinero,eventos:renderEventos,estudio:renderEstudio,cfg:renderCfg,data:renderData,ajustes:renderAjustes}[ui.tab]||renderMonth)();
  /* el aviso de versión nueva se pega arriba del todo, salga la pantalla que salga: es lo único
     que importa en ese momento y no puede depender de en qué pestaña estés */
  if(hayVersionNueva()){const mn=$('#main');
    if(mn&&!mn.querySelector('.avisoVer'))mn.insertAdjacentHTML('afterbegin',
      '<div class="avisoVer"><span>Hay una versi\u00f3n nueva de la app.</span>'+
      '<button class="btn p s" data-a="app-actualizar">actualizar</button></div>');}
  $('#foot').textContent='Estructura editable: cambia horarios, patrones, platos y tandas; la semana, la cocina y la compra se recalculan solas.';
  mejoraAccesibilidad($('#main'));
}
function flash(msg,ms){let f=$('#flash');if(!f){f=document.createElement('div');f.id='flash';document.body.appendChild(f);}
  f.textContent=msg;clearTimeout(f._t);f._t=setTimeout(()=>f.remove(),ms||2600);}
function mejoraAccesibilidad(root){
  /* botones de solo icono (×, ★/☆, ‹›…) que ya llevan title: que un lector de pantalla tenga algo que decir */
  if(!root)return;
  root.querySelectorAll('button[title]:not([aria-label])').forEach(function(b){
    if((b.textContent||'').trim().length<=2)b.setAttribute('aria-label',b.title);});}

/* ===================== modales ===================== */
let modalSave=null,mealCtx=null,draftMeal=null,mealSlot=null,modalPrevFocus=null,drawerPrevFocus=null;
function focusablesIn(el){
  return Array.prototype.slice.call(el.querySelectorAll(
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
  )).filter(function(x){return x.offsetParent!==null;});}
function trapModalTab(e){
  const modal=$('#modal');if(!modal)return;
  const f=focusablesIn(modal);
  if(!f.length){e.preventDefault();modal.focus();return;}
  const first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
function openModal(title,html,onSave,extra){
  modalPrevFocus=document.activeElement;
  const modal=$('#modal');
  modal.innerHTML=`<h3 id="modalTitle">${title}</h3>${html}<div class="row" style="margin-top:14px;justify-content:flex-end">${extra||''}<button class="btn" data-a="m-cancel">Cancelar</button>${onSave?'<button class="btn p" data-a="m-save">Guardar</button>':''}</div>`;
  $('#overlay').classList.add('on');modalSave=onSave;
  mejoraAccesibilidad(modal);
  const f=focusablesIn(modal);(f[0]||modal).focus();
}
function closeModal(){$('#overlay').classList.remove('on');modalSave=null;
  if(modalPrevFocus&&document.body.contains(modalPrevFocus)&&modalPrevFocus.focus)modalPrevFocus.focus();
  modalPrevFocus=null;}
function openDrawer(){
  ui.drawerOpen=true;drawerPrevFocus=document.activeElement;
  const dr=$('#drawer');
  dr.classList.add('on');dr.setAttribute('aria-hidden','false');
  $('#drawerScrim').classList.add('on');
  const mb=document.querySelector('[data-a="drawer-toggle"]');if(mb)mb.setAttribute('aria-expanded','true');
  const f=focusablesIn(dr);(f[0]||dr).focus();}
function closeDrawer(){
  ui.drawerOpen=false;
  const dr=$('#drawer');
  dr.classList.remove('on');dr.setAttribute('aria-hidden','true');
  $('#drawerScrim').classList.remove('on');
  const mb=document.querySelector('[data-a="drawer-toggle"]');if(mb)mb.setAttribute('aria-expanded','false');
  if(drawerPrevFocus&&document.body.contains(drawerPrevFocus)&&drawerPrevFocus.focus)drawerPrevFocus.focus();
  drawerPrevFocus=null;}
function trapDrawerTab(e){
  const dr=$('#drawer');if(!dr)return;
  const f=focusablesIn(dr);
  if(!f.length){e.preventDefault();dr.focus();return;}
  const first=f[0],last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
let confirmResolve=null;
function confirmar(msg,textoSi){
  /* confirm() propio: mismo diálogo accesible que el resto de la app, en vez del cuadro nativo del navegador */
  return new Promise(function(resolve){
    confirmResolve=resolve;
    modalPrevFocus=document.activeElement;
    const modal=$('#modal');
    modal.innerHTML='<h3 id="modalTitle">¿Seguro?</h3><p style="margin:0">'+esc(msg)+'</p>'+
      '<div class="row" style="margin-top:14px;justify-content:flex-end">'+
      '<button class="btn" data-a="m-cancel">Cancelar</button>'+
      '<button class="btn bad" data-a="confirm-yes">'+esc(textoSi||'Sí, continuar')+'</button></div>';
    $('#overlay').classList.add('on');modalSave=null;
    mejoraAccesibilidad(modal);
    const f=focusablesIn(modal);(f[0]||modal).focus();
  });}
function cancelModal(){
  if(confirmResolve){const r=confirmResolve;confirmResolve=null;closeModal();r(false);return;}
  if(mealSlot){const sh=mealSlot.shift,s=store.menu[sh]&&store.menu[sh][mealSlot.i];
    if(s&&mealSlot.restore)s.items=mealSlot.restore;}
  if(draftMeal&&!mealById(draftMeal.id))draftMeal=null;
  mealSlot=null;closeModal();}
function capMeal(){if(!$('#overlay').classList.contains('on'))return null;
  const v=fields(),id=mealCtx,m=(id?mealById(id):null)||draftMeal;if(!m)return null;
  m.name=String(v.name==null?m.name:v.name);m.note=v.note||'';
  m.items=m.items||[];
  /* sólo se sobrescriben los platos que hay en el DOM; los añadidos después se conservan */
  Object.keys(v).forEach(k=>{const mm=k.match(/^md-(\d+)$/);if(!mm)return;const j=+mm[1];
    if(!v[k]){m.items[j]={kind:'dish',id:'',portions:1,_gone:1};return;}
    if(m.items[j]&&m.items[j]._gone)return;
    const it=m.items[j]||(m.items[j]={kind:'dish',id:v[k],portions:1});
    it.kind='dish';it.id=v[k];it.portions=Math.max(0.5,num(v['mp-'+j],1));});
  m.items=m.items.filter(x=>x&&!x._gone);
  return m;}
function fields(){const o={};$$('#modal [data-k]').forEach(el=>{o[el.dataset.k]=el.value;});return o;}
function editShift(id){
  const isNew=!id;
  const o=isNew?{id:uid('sh'),code:'X',name:'',icon:'📌',start:'',end:'',intensity:'bajo',desc:'',color:'#2563eb'}:shiftById(id);
  openModal(isNew?'Nuevo tipo de día':'Editar tipo de día',
   `<div class="fgrid c3">
      <label class="fld">Icono<input value="${esc(o.icon)}" data-k="icon"></label>
      <label class="fld">Nombre<input value="${esc(o.name)}" data-k="name"></label>
      <label class="fld">Clave (1 letra)<input value="${esc(o.code)}" data-k="code" maxlength="3"></label>
      <label class="fld">Entra<input value="${esc(o.start)}" placeholder="08:00" data-k="start"></label>
      <label class="fld">Sale<input value="${esc(o.end)}" placeholder="08:00" data-k="end"></label>
      <label class="fld">Color<input type="color" value="${esc(o.color||'#2563eb')}" data-k="color" style="height:34px"></label>
      <label class="fld">Carga<select data-k="intensity">${['bajo','medio','alto'].map(x=>`<option ${o.intensity===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <label class="fld" style="grid-column:1/-1">Notas<textarea rows="2" data-k="desc">${esc(o.desc||'')}</textarea></label>
    </div>`,
   ()=>{const v=fields();if(!String(v.name).trim())throw 'Ponle un nombre';
     if(isNew){store.shifts.push(Object.assign(o,v));store.menu[o.id]=[];}else Object.assign(o,v);});
}
function editDish(id){
  const isNew=!id;
  const o=isNew?{id:uid('d'),name:'',icon:'🍽',batchId:(store.batches[0]||{id:'bn'}).id,kcal:450,prot:30,portions:4,ingredients:[],steps:[]}
    :{id:id,name:'',icon:'',batchId:'',kcal:0,prot:0,portions:1,ingredients:[],steps:[]};
  if(!isNew)Object.assign(o,clone(dishById(id)));
  openModal(isNew?'Nuevo plato':'Editar plato · '+esc(o.name),
   `<div class="fgrid c2">
      <label class="fld">Nombre<input value="${esc(o.name)}" data-k="name"></label>
      <label class="fld">Icono<input value="${esc(o.icon)}" data-k="icon"></label>
      <label class="fld">Raciones por tanda<input type="number" min="1" value="${o.portions}" data-k="portions"></label>
      <label class="fld">Sesión de lote<select data-k="batchId">${store.batches.map(b=>`<option value="${b.id}" ${o.batchId===b.id?'selected':''}>${esc(b.label)}</option>`).join('')}</select></label>
      <label class="fld">kcal por ración<input type="number" min="0" value="${o.kcal}" data-k="kcal"></label>
      <label class="fld">Proteína g por ración<input type="number" min="0" value="${o.prot}" data-k="prot"></label>
      <label class="fld" style="grid-column:1/-1">Ingredientes · uno por línea, con cantidad delante («500 g lentejas», «3 diente ajo», «sal»)
        <textarea rows="7" data-k="ingredients">${esc((o.ingredients||[]).join('\n'))}</textarea></label>
      <label class="fld" style="grid-column:1/-1">Pasos (para la sesión de cocina)
        <textarea rows="6" data-k="steps">${esc((o.steps||[]).join('\n'))}</textarea></label>
    </div>`,
   ()=>{const v=fields();if(!String(v.name).trim())throw 'Ponle un nombre';
     const arr=k=>String(v[k]||'').split('\n').map(x=>x.trim()).filter(Boolean);
     const data={name:v.name.trim(),icon:v.icon||'🍽',batchId:v.batchId,portions:Math.max(1,num(v.portions,1)),
       kcal:Math.max(0,num(v.kcal,0)),prot:Math.max(0,num(v.prot,0)),ingredients:arr('ingredients'),steps:arr('steps')};
     if(isNew)store.dishes.push(Object.assign(o,data));else Object.assign(dishById(id),data);});
}
function editMeal(id,opts){
  opts=opts||{};
  capMeal();
  const isNew=!id&&opts.mode!=='loose';
  let o;
  if(opts.slot){
    const sh=opts.slot.s,sl=(store.menu[sh]||[])[opts.slot.i];if(!sl)return;
    mealSlot={shift:sh,i:opts.slot.i,prevMeal:sl.mealId||'',restore:clone(sl.items||[])};
    const base=sl.mealId&&mealById(sl.mealId)?mealById(sl.mealId).name+' (variante)':(sl.label||'Comida nueva');
    o={id:uid('m'),name:base,note:'',items:clone(sl.items||[]),_fromSlot:1};
    draftMeal=o;mealCtx=null;
  }else if(isNew){draftMeal=draftMeal||{id:uid('m'),name:'',note:'',items:[{kind:'dish',id:(store.dishes[0]||{}).id,portions:1}]};o=draftMeal;mealCtx=null;}
  else{if(draftMeal&&draftMeal.id===id){o=draftMeal;}else{draftMeal=null;o=mealById(id);}mealCtx=id;}
  const titulo=opts.slot?'Guardar este hueco como comida reutilizable':(isNew?'Nueva comida armada':'Editar comida armada');
  openModal(titulo,
   `<div class="fgrid c2"><label class="fld">Nombre<input value="${esc(o.name)}" data-k="name"></label>
    <label class="fld">Nota (cuándo / cómo)<input value="${esc(o.note||'')}" data-k="note"></label></div>
    <div style="margin-top:12px"><b class="mini">PLATOS QUE LLEVA</b>
    ${o.items.map((it,j)=>`<div class="row" style="margin-top:6px">
      <select style="flex:1 1 240px" data-k="md-${j}">${store.dishes.map(d=>`<option value="${d.id}" ${it.id===d.id?'selected':''}>${esc(d.icon)} ${esc(d.name)}</option>`).join('')}</select>
      <input type="number" step="0.5" min="0.5" style="width:76px" value="${fmt(num(it.portions,1))}" data-k="mp-${j}" title="raciones">
      <button class="btn s" data-a="m-del-item" data-j="${j}">quitar</button></div>`).join('')||'<div class="empty">Sin platos: añade uno.</div>'}
      <div class="row" style="margin-top:9px"><button class="btn s" data-a="m-add-item">+ Añadir plato</button>
      <span class="mini">1 ración = la ración del lote tal como está definida en el plato</span></div></div>`,
   ()=>{const v=fields();if(!String(v.name).trim())throw 'Ponle un nombre';
     const items=o.items||[];Object.keys(v).forEach(k=>{const m=k.match(/^md-(\d+)$/);if(!m)return;const j=+m[1];
       if(!v[k]){items[j]=null;return;}
       items[j]={kind:'dish',id:v[k],portions:Math.max(0.5,num(v['mp-'+j],1))};});
     o.items=items.filter(x=>x&&x.id&&!x._gone);
     o.name=v.name.trim();o.note=v.note||'';
     if(mealSlot){
       const sl=store.menu[mealSlot.shift][mealSlot.i];
       if(!o.items.length)throw 'Al menos un plato, o usa «montar suelto»';
       let mm=mealById(o.id);
       if(!mm){mm=clone(o);delete mm._fromSlot;store.meals.push(mm);}
       else Object.assign(mm,o);
       sl.mealId=mm.id;sl.items=[];if(!sl.label)sl.label=mm.name;
       mealSlot=null;draftMeal=null;return;
     }
     if(!store.meals.some(x=>x.id===o.id))store.meals.push(o);
     else Object.assign(mealById(o.id),o);
     if(!mealSlot)draftMeal=null;});
}
function editRules(){
  openModal('Reglas de oro (una por línea)','<textarea rows="12" data-k="rules">'+esc(store.rules.join('\n'))+'</textarea>',
   ()=>{const v=fields();store.rules=String(v.rules||'').split('\n').map(x=>x.trim()).filter(Boolean);});
}
function editBatch(id){
  const b=batchById(id);if(!b)return;
  openModal('Sesión de cocina',
   `<div class="fgrid c2"><label class="fld">Nombre<input value="${esc(b.label)}" data-k="label"></label>
    <label class="fld">Cuándo<input value="${esc(b.when||'')}" placeholder="dom · 17:00" data-k="when"></label>
    <label class="fld" style="grid-column:1/-1">Nota<input value="${esc(b.note||'')}" data-k="note"></label>
    <label class="fld">Tanda mínima (raciones)<input type="number" min="0" value="${b.minCook||0}" data-k="minCook"
      title="aunque se coma menos, se cocina esta tanda y lo demás se congela"></label></div>
    <p class="mini" style="margin-top:10px">Platos en esta sesión: ${store.dishes.filter(d=>d.batchId===id).map(d=>esc(d.name)).join(', ')||'—'}. Se asignan editando el plato.</p>
    ${id!=='bn'?`<div class="row" style="margin-top:8px"><button class="btn d" data-a="batch-del" data-id="${id}">Eliminar sesión</button></div>`:''}`,
   ()=>{const v=fields();Object.assign(b,{label:v.label||b.label,when:v.when,note:v.note,minCook:Math.max(0,num(v.minCook,0))});});
}

function rhythmForm(rh,key){
  const h=sleepHours(rh.sleep,rh.wake),c=suenoCfg();
  const rec=acostarsePara(rh.wake),ven=ventanaCena(rec||rh.sleep);
  return '<div class="fgrid c3">'+RKEYS.map(function(k){
      return '<label class="fld">'+k[1]+'<input type="time" value="'+esc(rh[k[0]]||'')+'" data-k="'+k[0]+'"></label>';}).join('')+
    '</div><p class="mini" style="margin-top:8px">Con estas horas: <b>'+(h?fmtHM(h*60)+' durmiendo':'sin horas puestas')+
    '</b>'+(h!=null?(h<c.min?(' · te faltan '+Math.round((c.min-h)*60)+' min para tus '+c.min+' h'):' · dentro de tus '+c.min+' h'):'')+
    ' · al guardar se recalcula la semana.</p>'+
    (rec?('<p class="mini" style="margin:6px 0 0">Para tus '+c.min+' h: a la cama sobre las <b>'+rec+'</b>'+
      (ven?(' y a cenar entre '+ven.from+' y '+ven.to):'')+
      ' <button class="btn s" data-a="rh-8h" data-key="'+esc(key||'')+'">poner esa hora</button></p>'):'')+
    (key?('<div class="row" style="margin-top:8px"><span class="mini">esto es solo para este día</span>'+
      '<button class="btn s" data-a="rh-reset" data-key="'+esc(key)+'">volver a la plantilla</button></div>'):'');
}
function editDayRhythm(dateStr){
  const d=parseDate(dateStr);if(!d)return;const key=iso(d);
  const info=dayInfo(key),rh=rhythmOf(info.shiftId,key);
  openModal('Horas del '+d.getDate()+' de '+MON[d.getMonth()]+
    ' <span class="mini">· '+esc((shiftById(info.shiftId)||{}).name||'sin día')+' · solo afecta a este día</span>',
    rhythmForm(rh,key),function(){const v=fields();if(!store.rotation.dayRhythm)store.rotation.dayRhythm={};
      const o={};RKEYS.forEach(function(k){if(v[k[0]])o[k[0]]=v[k[0]];});
      if(Object.keys(o).length)store.rotation.dayRhythm[key]=o;else delete store.rotation.dayRhythm[key];});
}
function editDayRhythmShift(shiftId){
  const sh=shiftById(shiftId);if(!sh)return;
  openModal('Horas de '+esc(sh.icon)+' '+esc(sh.name)+' <span class="mini">· se editan en la tabla 2 de «Turno y rotación»</span>',
    rhythmForm(Object.assign({},(store.rhythm||{})[shiftId]||{}),null),function(){
      const v=fields(),cur=(store.rhythm||{})[shiftId]||{};
      RKEYS.forEach(function(k){if(v[k[0]]!==undefined)cur[k[0]]=v[k[0]];});
      if(!store.rhythm)store.rhythm={};store.rhythm[shiftId]=cur;});
}

/* ===================== acciones ===================== */
function moveSlot(shiftId,i,dir){const menu=store.menu[shiftId]||[];const j=i+dir;
  if(!menu[i]||!menu[j])return;
  const t=menu[i];menu[i]=menu[j];menu[j]=t;
  store.menu[shiftId]=menu;save();render();}
function curShiftId(el){const n=el&&el.closest?el.closest('[data-shift]'):null;if(n)return n.dataset.shift;
  const c=$('#main')&&$('#main').querySelector('.card[data-shift]');return c?c.dataset.shift:null;}
function act(a,el){
  const id=el.dataset.id;
  switch(a){
    case 'tab':ui.tab=el.dataset.t;if(CAL_SET.has(ui.tab))ui.calMode=ui.tab;
      /* entrar en «Turno y rotación» te deja en su portada, no en la última pantalla que abriste
         hace tres días: es configuración, no un sitio donde se continúa algo */
      if(ui.tab==='cfg')ui.cfgVista='';
      if(ui.tab==='ajustes')ui.ajuVista='';
      if(ui.tab==='data')ui.datosVista='';
      if(ui.tab==='eventos'){ui.evVista='';ui.evForm=null;}
      if(ui.tab==='estudio')ui.estVista='';
      /* pulsar «Hoy» en la barra vuelve al día de hoy, aunque te hubieras ido con las flechas a
         mirar el sábado que viene: si no, «Hoy» no llevaba a hoy, que es lo único que promete */
      if(ui.tab==='hoy')ui.diaHoy='';
      render();window.scrollTo(0,0);break;
    case 'nav-comer':{ui.tab='food';ui.foodVista='';ui.typesVista='';ui.shopVista='';render();window.scrollTo(0,0);break;}
    case 'compra-salida':ui.compraSalida=el.dataset.v||'todo';render();break;
    case 'compra-ticket':ui.shopVista='ticket';render();window.scrollTo(0,0);break;
    case 'tk-leer':{const ta=document.getElementById('tkTxt');
      const t=ui.ticket||(ui.ticket={});
      t.txt=ta?ta.value:(t.txt||'');
      if(!String(t.txt).trim()){flash('pega antes el ticket');break;}
      t.leido=ticketLeer(t.txt);t.msg='';
      render();
      flash(t.leido.items.length?(t.leido.items.length+' línea(s) leídas'):'no he sacado ninguna línea');
      break;}
    case 'tk-pegar':{
      if(!navigator.clipboard||!navigator.clipboard.readText){flash('tu navegador no me deja leer lo copiado: pégalo a mano');break;}
      navigator.clipboard.readText().then(function(txt){
        const t=ui.ticket||(ui.ticket={});t.txt=String(txt||'');t.leido=ticketLeer(t.txt);t.msg='';
        render();flash(t.leido.items.length+' línea(s) leídas');})
        .catch(function(){flash('no he podido leer lo copiado: pégalo a mano');});
      break;}
    case 'tk-limpiar':{ui.ticket={txt:'',leido:null,msg:''};render();break;}
    case 'tk-quitar':{const t=ui.ticket;if(!t||!t.leido)break;
      t.leido.items.splice(+el.dataset.i,1);render();break;}
    case 'tk-aplicar':{const t=ui.ticket;if(!t||!t.leido)break;
      flash(ticketAplicar(t.leido.items));
      ui.ticket={txt:'',leido:null,msg:''};ui.shopVista='';render();window.scrollTo(0,0);break;}
    case 'tk-gasto':{const t=ui.ticket;
      if(!t||!t.leido||t.leido.total==null){flash('el ticket no traía total');break;}
      /* la compra es un gasto del día, no un fijo mensual: va a lo apuntado, con el total del
         propio ticket, que es el número que menos se equivoca */
      flash(addPago({nombre:'Compra del súper',importe:String(t.leido.total).replace('.',','),
        fecha:iso(new Date()),cat:'compra'}));
      break;}
    case 'tk-claude':ticketConClaude();break;
    case 'ir-fruteria':ui.compraSalida='fruteria';ui.tab='shop';ui.shopVista='';render();window.scrollTo(0,0);break;
    case 'compra-hecha':flash(hacerCompra(el.dataset.solo==='1'));break;
    case 'compra-mano':{const t=document.getElementById('compraMano');
      flash(listaAMano(t?t.value:''));if(t)t.value='';break;}
    case 'desp-quitar':flash(despensaQuitar(el.dataset.k)||'fuera');render();break;
    case 'desp-gasta':{const x=despensaS().filter(function(y){return y.k===el.dataset.k;})[0];
      flash(x?(despensaGasta(x.nom,pasoDeGasto(x))||'acabado'):'ya no está');
      render();break;}
    case 'desp-add':{const t=document.getElementById('despAdd');
      const v2=t?t.value:'';
      if(!String(v2).trim()){flash('escribe qué has metido, con su cantidad si la sabes');break;}
      despensaAdd(v2);if(t)t.value='';render();flash('a la despensa: '+v2);break;}
    case 'compra-sec':{const k=el.dataset.k||'';
      /* se mira lo que hay en pantalla y no un único conjunto: un pasillo terminado se pinta
         plegado por su cuenta, así que «cerrarlo» otra vez no haría nada visible */
      if(!ui.compraAbiertas)ui.compraAbiertas=new Set();
      const abierto=el.getAttribute('aria-expanded')==='true';
      if(abierto){ui.compraAbiertas.delete(k);ui.compraCerradas.add(k);}
      else{ui.compraCerradas.delete(k);ui.compraAbiertas.add(k);}
      render();break;}
    case 'tanda-abrir':{const t=el.dataset.id||'';ui.tandaAbierta=(ui.tandaAbierta===t)?'-':t;render();break;}
    case 'rt-dia':{flash(toggleRutinaDia(el.dataset.id,el.dataset.sh));render();break;}
    case 'cfg-vista':{ui.cfgVista=el.dataset.v||'';render();window.scrollTo(0,0);break;}
    case 'arr-paso':{
      /* leer SIEMPRE antes de repintar: el formulario se reemplaza entero y lo tecleado se perdería */
      const a=arrLee(),n=ARR_PASOS.length,to=Math.max(0,Math.min(n,+el.dataset.p||0));
      a.paso=to;
      if(to>=n)arrAplica();     /* al llegar al resumen ya queda guardado: si cierra la app, no lo pierde */
      render();window.scrollTo(0,0);break;}
    case 'arr-saltar':{
      confirmar('¿Saltar las preguntas? La app arranca con un ejemplo y lo cambias luego en «Turno y rotación».',
        'Sí, saltar').then(function(ok){
        if(!ok)return;
        store.meta.montada=true;save();
        ui.arranque=null;document.documentElement.classList.remove('en-arranque');render();window.scrollTo(0,0);
        flash('montada con el ejemplo — cámbialo en «Turno y rotación» cuando quieras',4500);});
      break;}
    case 'arr-fin':{
      arrAplica();
      ui.arranque=null;document.documentElement.classList.remove('en-arranque');
      if(el.dataset.t){ui.tab=el.dataset.t;ui.datosVista='planning';}
      render();window.scrollTo(0,0);
      flash('lista: tu jornada, tus guardias y tus horas ya están puestas',4000);break;}
    case 'est-vista':{ui.estVista=el.dataset.v||'';ui.estPrev=null;render();window.scrollTo(0,0);break;}
    case 'est-tema':{ui.estVista='t:'+el.dataset.id;render();window.scrollTo(0,0);break;}
    case 'est-sube':{flash(estSubir(el.dataset.id));render();break;}
    case 'est-baja':{flash(estBajar(el.dataset.id));render();break;}
    case 'est-olvida':{const id=el.dataset.id;
      confirmar('¿Empezar este tema de cero? Se borra su nivel y sus repasos.','Sí, de cero').then(function(ok){
        if(!ok)return;flash(estOlvidar(id));render();});
      break;}
    case 'est-importar':{
      const box=$('#estBox');
      const r=estImportar(box?box.value:'');
      ui.estPrev=r;
      if(r.ok){ui.estTxt='';ui.estVista='temario';}
      flash(r.msg);render();window.scrollTo(0,0);break;}
    case 'est-url':{
      const u=($('#estUrl')||{}).value||'';
      if(!/^https:\/\//.test(u)){flash('la dirección tiene que empezar por https://');break;}
      ui.estPrev={ok:true,msg:'trayendo…'};render();
      /* lo pide el navegador directamente, sin ningún servidor por medio: si ese sitio no deja
         leerlo desde fuera (CORS), no se puede, y se dice en vez de dejarlo colgado */
      fetch(u,{cache:'no-store'}).then(function(res){
        if(!res.ok)throw new Error('ha contestado '+res.status);
        return res.text();}).then(function(txt){
        const r=estImportar(txt);ui.estPrev=r;
        if(r.ok){estS().fuente.url=u;save();ui.estVista='temario';}
        flash(r.msg);render();}).catch(function(err){
        ui.estPrev={ok:false,msg:'no he podido traerlo ('+String(err.message||err).slice(0,60)+
          '). Si es tu propia app, tiene que permitir leerla desde fuera; mientras tanto, baja el fichero y súbelo aquí.'};
        render();});
      break;}
    case 'est-exportar':{dlTxt(estProgresoJSON(),'progreso-estudio.json','application/json;charset=utf-8');break;}
    case 'est-copiar':{copy(estProgresoJSON());break;}
    case 'est-sesion':{
      const min=($('#estMin')||{}).value||'',t=($('#estTema')||{}).value||'';
      flash(estAddSesion(min,t?[t]:[]));render();break;}
    case 'est-del-sesion':{flash(estDelSesion(el.dataset.id));render();break;}
    case 'aju-vista':{ui.ajuVista=el.dataset.v||'';render();window.scrollTo(0,0);break;}
    case 'ir-perfil':{ui.tab='food';ui.foodVista='perfil';ui.ajuVista='';render();window.scrollTo(0,0);break;}
    case 'ir-sueno':irACard('cfg','sueno');break;
    case 'aju-ir':{ui.tab='ajustes';ui.ajuVista=el.dataset.v||'';render();window.scrollTo(0,0);break;}
    case 'datos-vista':{ui.datosVista=el.dataset.v||'';render();window.scrollTo(0,0);break;}
    case 'nota-proy-f':{ui.notaProy=el.dataset.p||'';render();break;}
    case 'dinero-vista':{ui.dineroVista=el.dataset.v||'';render();window.scrollTo(0,0);break;}
    case 'fin-guardar':flash(finGuardar());break;
    case 'fin-descartar':ui.fin=null;ui.dineroVista='';render();window.scrollTo(0,0);break;
    case 'fin-cobrado':{const f=ui.fin;if(!f||!f.res||!f.res.ingresos)break;
      ahorroS().cobrado[f.res.mes]=f.res.ingresos.v;save();flash(eur(f.res.ingresos.v)+' apuntados como lo cobrado de '+ahoMesTxt(f.res.mes));render();break;}
    case 'aho-mas':case 'aho-menos':{const hoy=new Date(),x=ahorroMes(ahoMk(hoy.getFullYear(),hoy.getMonth()),true);
      if(x.hecho)break;x.aparto=Math.max(0,(+x.aparto||0)+(a==='aho-mas'?50:-50));save();render();break;}
    case 'aho-apartar':{const hoy=new Date();flash(apartarMes(ahoMk(hoy.getFullYear(),hoy.getMonth())));break;}
    case 'aho-deshacer':{const hoy=new Date();flash(deshacerApartado(ahoMk(hoy.getFullYear(),hoy.getMonth())));break;}
    case 'aho-reto-nuevo':ui.ahoRetoNuevo=true;render();{const f=document.getElementById('ahRtNom');if(f)f.focus();}break;
    case 'aho-reto-add':{const g=function(id){return (document.getElementById(id)||{}).value||'';};
      const nom=g('ahRtNom').trim(),mx=num(g('ahRtMax'),NaN);
      if(!nom){flash('ponle un nombre: salir, pedir comida…');break;}
      if(!(mx>=0)){flash('pon el máximo que quieres gastar');break;}
      const hoy=new Date(),x=ahorroMes(ahoMk(hoy.getFullYear(),hoy.getMonth()),true);
      x.retos.push({id:uid('rt'),ico:g('ahRtIco').trim()||'🎯',nombre:nom.slice(0,40),max:mx,antes:num(g('ahRtAnt'),0)||0,hucha:g('ahRtHu')});
      ui.ahoRetoNuevo=false;save();render();flash('reto puesto: '+nom+' máx '+eur(mx));break;}
    case 'aho-reto-ok':case 'aho-reto-no':{const hoy=new Date();
      flash(cerrarReto(ahoMk(hoy.getFullYear(),hoy.getMonth()),el.dataset.id,a==='aho-reto-ok'));break;}
    case 'aho-ep-add':{const eps=ahorroS().epocas,ult=eps.slice().sort(function(p,q){return p.desde.localeCompare(q.desde);}).pop()||{};
      const d=ahoYm(ult.desde||ahoMk(new Date().getFullYear(),new Date().getMonth()));
      eps.push({id:uid('ep'),nombre:'Nueva época',desde:ahoMk(d.y+1,d.m),neto:ult.neto||0,finde:ult.finde||0,pagaJun:ult.pagaJun||0,pagaDic:ult.pagaDic||0});
      save();render();break;}
    case 'aho-ep-del':{const a2=ahorroS();if(a2.epocas.length<=1){flash('tiene que quedar al menos una época');break;}
      a2.epocas=a2.epocas.filter(function(e){return e.id!==el.dataset.id;});save();render();break;}
    case 'aho-fest-add':{const v=(document.getElementById('ahFest')||{}).value||'';
      if(!/^\d{4}-\d{2}-\d{2}$/.test(v)){flash('elige el día');break;}
      if(ahorroS().festivos.indexOf(v)<0)ahorroS().festivos.push(v);save();render();break;}
    case 'aho-fest-del':{const a2=ahorroS();a2.festivos=a2.festivos.filter(function(f){return f!==el.dataset.f;});save();render();break;}
    case 'aho-hu-add':{const cols=['#f472b6','#34d399','#fb923c','#60a5fa','#a78bfa'];
      ahorroS().huchas.push({id:uid('hu'),nombre:'Nueva hucha',ico:'🐷',color:cols[ahorroS().huchas.length%cols.length],pct:0,objetivo:0,meta:'',saldo:0});
      save();render();break;}
    case 'aho-hu-del':{const h=ahorroS().huchas.filter(function(q){return q.id===el.dataset.id;})[0];if(!h)break;
      confirmar('¿Quitar la hucha «'+h.nombre+'»?'+(h.saldo?' Tiene '+eur(h.saldo)+': ese dinero deja de contarse aquí.':'')).then(function(ok){
        if(!ok)return;const a2=ahorroS();a2.huchas=a2.huchas.filter(function(q){return q.id!==h.id;});save();render();});break;}
    case 'aho-sacar':case 'aho-meter':{const inp=document.getElementById('ahSac-'+el.dataset.id);const v=inp?inp.value:'';
      flash(sacarHucha(el.dataset.id,v,'',a==='aho-meter'));break;}
    case 'dinero-pagar':{const n=new Date();flash(pagarGasto(el.dataset.id,n.getFullYear(),n.getMonth()));render();break;}
    case 'dinero-del':{const g=dineroS().gastos.filter(function(x){return x.id===el.dataset.id;})[0];
      const gid=el.dataset.id;
      confirmar('¿Quitar «'+((g&&g.nombre)||'ese gasto')+'» de los fijos?','Sí, quitar').then(function(ok){
        if(!ok)return;flash(delGasto(gid));render();});break;}
    case 'dinero-del-pago':{flash(delPago(el.dataset.id));render();break;}
    case 'dinero-add':{const g=function(id){return (document.getElementById(id)||{}).value||'';};
      flash(addGasto({nombre:g('gnNombre'),importe:g('gnImporte'),dia:g('gnDia'),cat:g('gnCat')}));
      render();break;}
    case 'dinero-pres':{
      openModal('Tope del mes',
        '<label class="fld">cuánto quieres gastar como mucho al mes (0 = sin tope)'+
        '<input id="mPres" type="number" min="0" step="10" value="'+(+dineroS().presupuesto||0)+'"></label>'+
        '<p class="note">Solo sirve para que la app te diga cuánto te queda. No bloquea nada.</p>',
        function(){dineroS().presupuesto=Math.max(0,+((document.getElementById('mPres')||{}).value)||0);
          save();render();return true;});break;}
    case 'dinero-apuntar':{
      const hoyK=iso(new Date());
      const cats=DIN_CAT.map(function(c){return '<option value="'+c[0]+'">'+c[1]+' '+c[2]+'</option>';}).join('');
      openModal('Apuntar un gasto',
        '<div class="fgrid c3">'+
          '<label class="fld">en qué<input id="mPgNombre" placeholder="compra del súper" value="'+esc(ui.pagoNombre||'')+'"></label>'+
          '<label class="fld">cuánto (€)<input id="mPgImporte" type="text" inputmode="decimal" placeholder="41,30"></label>'+
          '<label class="fld">qué día<input id="mPgFecha" type="date" value="'+hoyK+'"></label>'+
          '<label class="fld">de qué<select id="mPgCat">'+cats+'</select></label>'+
        '</div>',
        function(){const g=function(id){return (document.getElementById(id)||{}).value||'';};
          const r=addPago({nombre:g('mPgNombre'),importe:g('mPgImporte'),fecha:g('mPgFecha'),cat:g('mPgCat')});
          if(/ponle un importe/.test(r)){flash(r);return false;}
          ui.pagoNombre='';flash(r);render();return true;});
      setTimeout(function(){const c=document.getElementById('mPgCat');
        if(c&&ui.pagoCat)c.value=ui.pagoCat;ui.pagoCat='';
        const i=document.getElementById('mPgImporte');if(i)i.focus();},60);
      break;}
    case 'dinero-compra':{
      /* desde la lista de la compra: se abre ya con el nombre y la categoría puestos */
      ui.pagoNombre='Compra del súper';ui.pagoCat='compra';
      ui.tab='dinero';ui.dineroVista='';render();
      setTimeout(function(){const b2=document.querySelector('[data-a="dinero-apuntar"]');if(b2)b2.click();},80);
      break;}
    case 'compra-listas':{ui.shopVista='listas';render();window.scrollTo(0,0);break;}
    case 'compra-volver':{ui.shopVista='';render();window.scrollTo(0,0);break;}
    case 'nav-cal':ui.tab=ui.calMode||'month';render();window.scrollTo(0,0);break;
    case 'drawer-toggle':if(ui.drawerOpen)closeDrawer();else openDrawer();break;
    case 'drawer-close':closeDrawer();break;
    case 'ir-tab':          /* el mismo salto, pero desde un enlace dentro de un texto */
    case 'drawer-nav':ui.tab=el.dataset.t;if(CAL_SET.has(ui.tab))ui.calMode=ui.tab;
      if(ui.tab==='cfg')ui.cfgVista='';
      if(ui.tab==='ajustes')ui.ajuVista='';
      if(ui.tab==='data')ui.datosVista='';
      if(ui.tab==='eventos'){ui.evVista='';ui.evForm=null;}
      if(ui.tab==='estudio')ui.estVista='';
      /* pulsar «Hoy» en la barra vuelve al día de hoy, aunque te hubieras ido con las flechas a
         mirar el sábado que viene: si no, «Hoy» no llevaba a hoy, que es lo único que promete */
      if(ui.tab==='hoy')ui.diaHoy='';
      closeDrawer();render();window.scrollTo(0,0);break;
    case 'theme':{document.documentElement.classList.toggle('dark');
      const osc=document.documentElement.classList.contains('dark');
      try{localStorage.setItem(TKEY,osc?'dark':'light');}catch(e){}
      aplicarTema();
      const bt=document.querySelector('[data-a="theme"]');
      if(bt){bt.textContent=osc?'☀️':'🌙';bt.title=osc?'Modo día':'Modo noche HUD';}
      break;}
    case 'wk-prev':case 'wk-next':{
      /* en Mes mueven el mes, en «Hoy» el día y en Semana+por fecha la semana */
      if(ui.tab==='month'){monthDate=new Date(monthDate.getFullYear(),monthDate.getMonth()+(a==='wk-next'?1:-1),1,12,0,0,0);}
      else if(ui.tab==='hoy'){moverDiaHoy(a==='wk-next'?1:-1);}
      else if(store.rotation.mode==='date'){moverSemana((a==='wk-next'?1:-1)*semDias());}
      else{weekDate=addDays(weekDate,a==='wk-next'?7:-7);}
      render();break;}
    case 'sem-dias':{const n=+el.dataset.n;if(SEM_DIAS.indexOf(n)<0)break;
      store.rotation.semanaDias=n;save();render();break;}
    case 'sem-ayer':ui.semAyer=!ui.semAyer;render();break;
    case 'dia-prev':moverDiaHoy(-1);render();break;
    case 'dia-next':moverDiaHoy(1);render();break;
    case 'dia-hoy':ui.diaHoy='';render();break;
    case 'today':weekDate=mondayOf(new Date());ui.semDesde='';render();break;
    case 'print':imprimir();break;
    case 'mode-template':store.rotation.mode='template';save();render();break;
    case 'mode-date':store.rotation.mode='date';save();render();break;
    case 'clear-overrides':store.rotation.shiftByDay={};store.rotation.daySet={};store.rotation.dayRhythm={};
      save();render();flash('Días vuelve a la rotación (y se quita lo escrito a mano en el calendario)');break;
    case 'export':dl();marcarBackup();render();break;
    case 'copy':copy(JSON.stringify(store,null,1));marcarBackup();render();break;
    case 'import':{let raw,o;
      try{raw=$('#importBox').value.trim();if(!raw)throw ' vacío';o=JSON.parse(raw);
        if(!o||typeof o!=='object'||!Array.isArray(o.shifts)||!o.menu||!Array.isArray(o.dishes))throw 'x';
      }catch(e){flash('Ese JSON no es válido');break;}
      confirmar('¿Sustituir TODOS tus datos actuales por este JSON? No se puede deshacer — si quieres conservar lo que tienes, cópialo antes con «JSON»/«copiar».').then(function(ok){
        if(!ok)return;normalize(o);store=o;save();render();flash('Importado ✔');});break;}
    case 'reset':confirmar('¿Sustituir todo por el ejemplo por defecto?').then(function(ok){
      if(!ok)return;store=DEFAULTS();save();render();flash('Ejemplo restaurado');});break;
    case 'autofill':flash(autofill()||'Semanas tipo creadas');render();break;
    case 'draft':{const t=$('#pasteBox').value||'';
      window._draftExtras=mapCodes($('#codeMap').value);window._draftInfo=parsePlanning(t,window._draftExtras);
      window._draftExtrasInfo=parseRhythmText(t);window._draftServices=parseServicesText(t).months;
      showDraft(window._draftInfo);break;}
    case 'rhythm':{const t=$('#rhythmBox').value||'';
      window._rhythmInfo=parseRhythmText(t);window._rhythmServices=parseServicesText(t).months;
      window._rhythmVac=parseVacacionesText(t).ranges;
      const prev=applyRhythm({rhythm:window._rhythmInfo,services:window._rhythmServices,vacaciones:window._rhythmVac},
        {dryRun:true,year:+($('#rhythmYear')&&$('#rhythmYear').value)||new Date().getFullYear()});
      const out=$('#rhythmOut');out.style.display='block';
      const rl=Object.keys(window._rhythmInfo.days).map(function(k){const d=window._rhythmInfo.days[k];
        return (window._rhythmInfo.labels[k]||k)+' → '+['wake','breakfast','leave','arrive','sleep']
          .filter(function(x){return d[x];})
          .map(function(x){return (RKEY_LAB[x]||x)+' '+d[x];}).join(', ');}).join('\n');
      out.textContent='Horas: '+(rl||'(ninguna entendida)');
      out.textContent+='\nTrabajo: '+(window._rhythmInfo.work?window._rhythmInfo.work[0]+'–'+window._rhythmInfo.work[1]:'sin horario de jornada')+
        (window._rhythmInfo.quickBf?' · desayuno rápido de diario':'');
      out.textContent+='\nMeses: '+(window._rhythmServices.length?window._rhythmServices.map(function(x){
        return x.months.map(function(m){return MON[m];}).join('+')+' → '+(x.label||x.service);}).join('\n'):'(ninguno — los meses se rellenan desde la tarjeta de servicios)')+
        '\n\nSe tocarían: '+prev.rh+' campo(s) de hora, '+(prev.work||0)+' ajuste(s) de jornada, '+prev.sv+' mes(es), '+
          prev.quick+' desayuno(s), '+(prev.vac||0)+' rango(s) de vacaciones.';
      if(window._rhythmVac&&window._rhythmVac.length)
        out.textContent+='\nVacaciones: '+window._rhythmVac.map(function(v){return v.start+' → '+v.end+(v.label?' ('+v.label+')':'');}).join('\n');
      else out.textContent+='\nVacaciones: ninguna en ese texto (se marcan en «Mes» o en «Turno y rotación»);'
      $('#rhythmApply').disabled=!(prev.rh||prev.work||prev.sv||prev.quick||prev.vac);
      $('#rhythmMsg').textContent=(prev.rh+prev.work+prev.sv+prev.quick+prev.vac)?'listo para aplicar':'no he entendido nada de ese texto';
      flash($('#rhythmMsg').textContent);break;}
    case 'rhythm-apply':{if(!window._rhythmInfo){flash('Primero dale a Analizar');break;}
      const y=+($('#rhythmYear')&&$('#rhythmYear').value)||new Date().getFullYear();
      flash(applyRhythm({rhythm:window._rhythmInfo,services:window._rhythmServices,vacaciones:window._rhythmVac||[]},{year:y}));break;}
    case 'draft-apply':{
      if(!window._draftInfo){flash('Primero dale a Analizar');break;}
      const list=window._draftExtras||mapCodes($('#codeMap').value);
      const map=list.map(function(e){
        const nm=String(e.name||'');
        if(!e.name||e.name.length<3||/^[gsfl]$/i.test(nm))return {from:e.code,to:e.code,name:nm||null};
        if(!SOFT.test(nm))return {from:nm,to:e.code,name:nm};
        const cls=dayClasses([]).filter(function(k){return k[1]!==e.code&&k[0].test(nm);})[0];
        return cls?{from:cls[1],to:e.code,name:nm}:{from:e.code,to:e.code,name:nm};});
      flash(applyParse(window._draftInfo,{codes:map}));break;}
    case 'diet':window._dietInfo=parseDietText($('#dietBox').value||'');{
      const n=showDiet(window._dietInfo);flash(n+' toma(s) relacionadas con tu catálogo');}break;
    case 'diet-apply':{
      const info=window._dietInfo;if(!info){flash('Primero relaciona los platos');break;}
      const byDay={};
      info.slots.forEach(function(sl){const k=sl.day||'';(byDay[k]=byDay[k]||[]).push(sl);});
      let made=0,filled=0,loose=0;
      Object.keys(byDay).forEach(function(key){
        const shift=key?shiftByCode(key):null;
        const menu=shift?(store.menu[shift.id]||[]):[];
        byDay[key].forEach(function(sl){
          let items=sl.items.filter(function(x){return x.dishId;})
                     .map(function(x){return {kind:'dish',id:x.dishId,portions:1};});
          loose+=sl.items.length-items.length;
          if(!items.length)return;
          const uniq=[];items.forEach(function(x){if(!uniq.some(function(u){return u.id===x.id;}))uniq.push(x);});
          items=uniq;
          const name='Importado'+(shift?' · '+shift.name:'')+' · '+sl.label;
          let m=store.meals.find(function(x){return x.name===name;});
          if(m){m.items=items;}else{m={id:uid('m'),name:name,note:'Sugerido desde tu dieta pegada',items:items};store.meals.push(m);}
          made++;
          if(!shift)return;
          const hueco=menu.filter(function(x){return new RegExp(sl.label,'i').test(x.label);})[0]||menu.filter(function(x){return !x.mealId&&!x.items.length;})[0];
          if(hueco){hueco.mealId=m.id;hueco.items=[];filled++;}
        });});
      window._dietInfo=info;
      save();render();
      flash(made?('creadas '+made+' comida(s)'+(filled?(' · encajadas en '+filled+' hueco(s)'):'')
          +(loose?(' · '+loose+' línea(s) que no reconocí (suenan a plato de tu casa: añádelas al catálogo)'):''))
        :'nada que guardar (revisa que las líneas digan desayuno/comida/cena)');break;}
    case 'mon-prev':case 'mon-next':{monthDate=new Date(monthDate.getFullYear(),monthDate.getMonth()+(a==='mon-next'?1:-1),1,12,0,0,0);render();break;}
    case 'jor-day':{const j=store.rotation.jornada||(store.rotation.jornada={start:'',end:'',workdays:[1,2,3,4,5]});
      if(!Array.isArray(j.workdays))j.workdays=[1,2,3,4,5];
      const dd=+el.dataset.day,at=j.workdays.indexOf(dd);
      if(at>=0)j.workdays.splice(at,1);else j.workdays.push(dd);
      j.workdays.sort(function(a,b){return a-b;});save();render();break;}
    case 'draft-semanales':{
      const info=window._draftInfo,list=(info&&info.semanales)||[];
      if(!list.length){flash('no he visto sesiones semanales en ese texto');break;}
      const colores=['#a855f7','#38e1ff','#34d399','#fbbf24','#fb7185'];
      let n=0;
      list.forEach(function(e,ix){
        const ya=eventosS().some(function(x){return x.modo!=='fecha'&&x.titulo===e.titulo&&(x.dow||[]).indexOf(e.dow)>=0;});
        if(ya)return;
        eventosS().push({id:uid('ev'),titulo:e.titulo,hora:e.hora,modo:'semanal',dow:[e.dow],
          fecha:'',recordatorio:false,cuentaAtras:false,color:colores[ix%colores.length],on:true});
        n++;});
      save();render();
      flash(n?('creados '+n+' evento(s) semanal(es)'):'esos eventos ya estaban puestos');break;}
    case 'vac-desde':{const key=el.dataset.key;
      const h=(document.getElementById('vacHasta-'+key)||{}).value||key;
      flash(addVacation(key,h,''));break;}
    case 'vac-add':case 'vac-add2':{if(el.tagName!=='BUTTON')break;const pre=(el.dataset.a==='vac-add2')?'2':'';
      const A=$('#vacA'+pre),B=$('#vacB'+pre),L=$('#vacL'+pre);
      if(!A||!A.value||!B||!B.value){flash('necesito el día de inicio y el de fin');break;}
      flash(addVacation(A.value,B.value,(L&&L.value)||''));break;}
    case 'vac-text':{const t=$('#rhythmBox')?$('#rhythmBox').value:'';
      const vs=parseVacacionesText(t);if(!vs.count){flash('no he visto ningún rango de vacaciones en ese texto');break;}
      if(!store.rotation.vacaciones)store.rotation.vacaciones=[];
      vs.ranges.forEach(function(v){store.rotation.vacaciones.push(v);});save();render();
      flash(vs.count+' rango(s) de vacaciones sacados del texto pegado');break;}
    case 'vac-del':{if(el.tagName!=='BUTTON')break;const n=store.rotation.vacaciones?store.rotation.vacaciones.length:0;
      if(n>1){confirmar('¿Quitar estas vacaciones?').then(function(ok){if(ok)flash(delVacation(el.dataset.ix));});break;}
      flash(delVacation(el.dataset.ix));break;}
    case 'hoy-food-obj':ui.tab='food';ui.foodObjOpen=true;render();window.scrollTo(0,0);break;
    case 'ev-vista':{ui.evVista=el.dataset.v||'';ui.evForm=null;render();window.scrollTo(0,0);break;}
    case 'ev-abrir':{const ev=evById(el.dataset.id);if(!ev)break;
      ui.evVista=ev.id;ui.evForm=evFormDefecto(ev);render();window.scrollTo(0,0);break;}
    case 'ev-nuevo':{ui.evVista='nuevo';
      ui.evForm=evFormDefecto(null);
      if(el.dataset.modo==='semanal'){ui.evForm.modo='semanal';ui.evForm.fecha='';}
      render();window.scrollTo(0,0);break;}
    case 'ev-modo':{if(!ui.evForm)ui.evForm=evFormDefecto(null);
      /* el modo cambia qué campos hay (un día concreto o unos días de la semana), así que aquí sí
         toca repintar; lo tecleado se relee del DOM antes para no perderlo */
      ui.evForm.modo=el.dataset.modo==='fecha'?'fecha':'semanal';
      const t=$('#evTitulo');if(t)ui.evForm.titulo=t.value;
      render();break;}
    case 'ev-dia':{const ix=+el.dataset.day;if(!ui.evForm)ui.evForm=evFormDefecto(null);
      const at=ui.evForm.dow.indexOf(ix);
      /* sin render: repintar aquí desmontaría el título a medio escribir */
      if(at>=0){ui.evForm.dow.splice(at,1);el.classList.remove('p');}
      else{ui.evForm.dow.push(ix);el.classList.add('p');}
      break;}
    case 'ev-dura':{
      /* los atajos de cuánto dura: escriben en el campo «hasta» a mano, sin repintar, porque un
         render se llevaría por delante el título que se está escribiendo */
      const min=+el.dataset.min,H=$('#evHora'),F=$('#evFin');
      if(!F)break;
      if(min===-2){if(H)H.value='';F.value='';}           /* todo el día: ni empieza ni acaba */
      else if(min===0)F.value='';                          /* sin hora de fin */
      else{
        if(min===-1){if(H)H.value='09:00';F.value='14:00';} /* toda la mañana */
        else{const a=mins((H&&H.value)||'');if(a==null){flash('ponle primero la hora de empezar');break;}
          F.value=hm(a+min);}
      }
      const cont=el.parentNode;
      if(cont)Array.prototype.forEach.call(cont.children,function(b){b.classList.toggle('on',b===el);});
      break;}
    case 'ev-guardar':{
      const id=el.dataset.id||'',ev=id?evById(id):null,f=ui.evForm||evFormDefecto(ev);
      const t=(($('#evTitulo')||{}).value||'').trim();
      if(!t){flash('ponle un título');break;}
      const hora=($('#evHora')||{}).value||'',fin=($('#evFin')||{}).value||'',
        color=($('#evColor')||{}).value||'#38e1ff';
      if(fin&&!hora){flash('si pones hora de fin, dime también a qué hora empieza');break;}
      const modo=f.modo==='fecha'?'fecha':'semanal';
      let fecha='',dow=[];
      if(modo==='fecha'){fecha=($('#evFecha')||{}).value||f.fecha||'';
        if(!fecha){flash('elige un día');break;}}
      else{dow=(f.dow||[]).slice().sort(function(a,b){return a-b;});
        if(!dow.length){flash('marca al menos un día');break;}}
      const rec=!!($('#evRec')||{}).checked,cuenta=!!($('#evCuenta')||{}).checked;
      const datos={titulo:t,hora:hora,fin:fin,modo:modo,fecha:fecha,dow:dow,color:color,
        recordatorio:modo==='fecha'&&rec,cuentaAtras:modo==='fecha'&&cuenta};
      if(ev){Object.keys(datos).forEach(function(k){ev[k]=datos[k];});}
      else eventosS().push(Object.assign({id:uid('ev'),on:true},datos));
      save();ui.evVista='';ui.evForm=null;render();window.scrollTo(0,0);
      flash(ev?'guardado':('apuntado: '+t+(evDuraTxt(datos)?(' · '+evDuraTxt(datos)):'')));break;}
    case 'ev-del':{if(el.tagName!=='BUTTON')break;
      const id=el.dataset.id;
      confirmar('¿Quitar este evento?').then(function(ok){
        if(!ok)return;
        store.eventos=eventosS().filter(function(e){return e.id!==id;});
        /* si lo estabas mirando, no te dejes en una pantalla de un evento que ya no existe */
        if(ui.evVista===id){ui.evVista='';ui.evForm=null;}
        save();render();flash('quitado');});
      break;}
    case 'hab-dia':{const ix=+el.dataset.day;if(!ui.habNuevo)ui.habNuevo={dow:[]};
      const at=ui.habNuevo.dow.indexOf(ix);
      if(at>=0){ui.habNuevo.dow.splice(at,1);el.classList.remove('p');}
      else{ui.habNuevo.dow.push(ix);el.classList.add('p');}
      break;}
    case 'hab-add':{const nm=($('#habNuevoNombre')||{}).value||'',ic=(($('#habNuevoIcono')||{}).value||'✅').trim()||'✅',
        co=($('#habNuevoColor')||{}).value||'#38e1ff',dow=(ui.habNuevo&&ui.habNuevo.dow||[]).slice();
      if(!nm.trim()){flash('ponle un nombre al hábito');break;}
      habitosS().items.push({id:uid('hab'),nombre:nm.trim(),icono:ic.slice(0,4),color:co,
        dow:dow.length?dow.sort(function(a,b){return a-b;}):[0,1,2,3,4,5,6],creado:iso(new Date())});
      ui.habNuevo={dow:[]};save();render();flash('hábito creado');break;}
    case 'hab-del':{if(el.tagName!=='BUTTON')break;const hid=el.dataset.id;
      confirmar('¿Borrar este hábito? También se pierde su historial de marcas.').then(function(ok){
        if(!ok)return;const h=habitosS();h.items=h.items.filter(function(x){return x.id!==hid;});
        Object.keys(h.registro).forEach(function(k){delete h.registro[k][hid];
          if(!Object.keys(h.registro[k]).length)delete h.registro[k];});
        save();render();flash('hábito borrado');});break;}
    case 'hab-mark':{toggleHabito(el.dataset.id,el.dataset.key);render();break;}
    case 'mon-today':monthDate=new Date(new Date().getFullYear(),new Date().getMonth(),1,12,0,0,0);render();break;
    case 'mon-autopos':store.rotation.autoPos=!store.rotation.autoPos;save();render();break;
    case 'mon-auto':{const y=monthDate.getFullYear(),m=monthDate.getMonth();
      flash(distributeGuardias(y,m,false));save();render();break;}
    case 'mon-auto-rep':{const y=monthDate.getFullYear(),m=monthDate.getMonth();
      confirmar('¿Repartir de nuevo las guardias de este mes? Se quitan las que hay puestas.').then(function(ok){
        if(!ok)return;flash(distributeGuardias(y,m,true));save();render();});break;}
    case 'mon-clear':{const y=monthDate.getFullYear(),m=monthDate.getMonth();
      confirmar('¿Quitar todo lo que has puesto a mano en este mes?').then(function(ok){
        if(!ok)return;
        monthDays(y,m).forEach(function(d){if(dayOverride(d.key))setDayOverride(d.key,null);});
        save();render();flash('mes vaciado (la plantilla manda otra vez)');});break;}
    case 'mon-sync':{const y=monthDate.getFullYear(),m=monthDate.getMonth();
      flash(syncToRotation(y,m));break;}
    case 'dia-ev-add':{
      const key=el.dataset.key;
      const t=((document.getElementById('evDia-'+key)||{}).value||'').trim();
      const h=(document.getElementById('evDiaH-'+key)||{}).value||'09:00';
      if(!t){flash('ponle un t\u00edtulo al evento');break;}
      eventosS().push({id:uid('ev'),titulo:t.slice(0,70),hora:h,modo:'fecha',fecha:key,dow:[],
        recordatorio:false,cuentaAtras:false,color:tlColor('evt'),on:true});
      save();render();flash('a\u00f1adido el '+fechaCorta(key)+': '+t);break;}
    case 'dia-editar':{
      /* «un bot\u00f3n para elegir un d\u00eda y cambiar cosas»: abre el d\u00eda que est\u00e9 elegido —o el de hoy— con
         el editor ya desplegado, y baja hasta \u00e9l. Antes hab\u00eda que saber que se pod\u00eda tocar la casilla. */
      ui.diaEditor=true;
      if(!ui.monSel)ui.monSel=iso(new Date());
      render();
      setTimeout(function(){const c=document.querySelector('#main .daydetail');
        if(c)c.scrollIntoView({behavior:'smooth',block:'center'});},60);
      break;}
    case 'mon-day':{
      ui.diaEditor=false;   /* tocando una casilla el editor va plegado; solo el botón lo abre */
      /* antes abría renderDayModal() como ventana aparte; ahora despliega el panel inline debajo
         del calendario (informe "reformular Mes/Semana/Hoy", decisión A) — si se llama desde fuera
         de Mes (p. ej. "cambiar qué día es" en Semana), entra en Mes con ese día ya seleccionado */
      const key=el.dataset.key;
      ui.monSel=(ui.monSel===key)?'':key;
      if(ui.tab!=='month'){ui.tab='month';ui.calMode='month';}
      render();break;}
    case 'food-prev':case 'food-next':{const cur=foodKey(ui.foodDate||iso(new Date()));
      const dd=parseDate(cur)||new Date();ui.foodDate=iso(addDays(dd,a==='food-next'?1:-1));render();break;}
    case 'food-today':ui.foodDate=iso(new Date());render();break;
    case 'food-jump':{const k=foodKey(el.dataset.key);if(k)ui.foodDate=k;render();break;}
    case 'food-panel':ui.foodPanel=el.dataset.k||'scan';ui.foodSel='';render();window.scrollTo(0,0);break;
    case 'food-cocina':{ui.cocinaPlato=el.dataset.id||'';ui.cocinaPaso=0;ui.cocinaRac=0;
      ui.foodVista='cocina';ui.tab='food';render();window.scrollTo(0,0);break;}
    case 'cocina-paso':{const d=dishById(ui.cocinaPlato),n=(d&&(d.steps||[]).filter(Boolean).length)||0;
      ui.cocinaPaso=Math.min(Math.max(0,+el.dataset.n||0),Math.max(0,n-1));render();break;}
    case 'cocina-rac':ui.cocinaRac=Math.max(1,+el.dataset.n||1);render();break;
    case 'cocina-hecho':{flash(addFoodEntry(iso(new Date()),{dishId:el.dataset.id,rac:1,pos:momentoAhora()}));
      ui.foodVista='';ui.cocinaPlato='';ui.cocinaPaso=0;render();window.scrollTo(0,0);break;}
    case 'cocinar-compra':{const d=dishById(el.dataset.id);
      if(!d){flash('ese plato ya no está en el catálogo');break;}
      const todos=platosCocinables(),x=todos.casi.concat(todos.listos).filter(function(y){return y.dish.id===d.id;})[0];
      if(!x||!x.faltan.length){flash('de ese plato no falta nada');break;}
      /* va a la lista de rutina si la hay: es la que entra sola en la compra de la semana */
      let l=listasS().filter(function(y){return y.fija;})[0]||listasS()[0];
      if(!l){addLista('Para cocinar');l=listasS()[listasS().length-1];}
      let n=0;x.faltan.forEach(function(it){if(/^apuntado/.test(addItemLista(l.id,it)))n++;});
      flash(n?('a «'+l.nombre+'»: '+n+' cosa'+(n===1?'':'s')):('ya estaba todo en «'+l.nombre+'»'));
      break;}
    case 'food-obj-toggle':ui.foodObjOpen=!ui.foodObjOpen;render();break;
    case 'fe-quick':{const gg=el.dataset.gq?(+(document.getElementById(el.dataset.gq)||{}).value||150):150;
      flash(addFoodEntry(el.dataset.key,{ean:el.dataset.ean,grams:gg,pos:'comida'}));render();break;}
    case 'fe-more':case 'fe-less':{const e=foodLog(el.dataset.key).filter(function(x){return x.id===el.dataset.id;})[0]||{};
      const paso=e.dishId?0.5:25;
      flash(bumpFoodEntry(el.dataset.key,el.dataset.id,a==='fe-more'?paso:-paso));render();break;}
    case 'fe-del':flash(delFoodEntry(el.dataset.key,el.dataset.id));render();break;
    case 'hoy-log-slot':{const hk=el.dataset.key||iso(new Date()),s=(store.menu[el.dataset.shift]||[]).find(function(x){return x.id===el.dataset.slot;});
      if(!s){flash('esa comida ya no está en el menú');break;}
      const info=slotItems(el.dataset.shift,s),cat=posDeSlot(s.label,s.time);
      if(!info.items.length){flash('esa comida no tiene platos asignados todavía');break;}
      info.items.forEach(function(it){addFoodEntry(hk,{dishId:it.id,rac:num(it.portions,1),pos:cat,when:cat});});
      flash('apuntado: '+(s.label||'esa comida')+' ('+info.items.length+' plato'+(info.items.length>1?'s':'')+')');render();break;}
    case 'ean-del':flash(delEanProduct(el.dataset.ean));render();break;
    case 'ean-fav':flash(toggleFavEan(el.dataset.ean));render();break;
    case 'food-sugerir':flash(sugerirObjetivo());break;
    case 'food-catalogo-import':flash(foodImportCatalogo().msg);break;
    case 'food-new-add':{const g=function(id){return (document.getElementById(id)||{}).value||'';};
      const o={nombre:g('foodNewNombre').trim().slice(0,64),marca:g('foodNewMarca').trim().slice(0,40),
        envase:g('foodNewEnvase').trim().slice(0,28),fuente:'añadido a mano',
        kcal:+g('foodNewKcal')||0,prot:+g('foodNewProt')||0,carb:+g('foodNewCarb')||0,
        gresa:+g('foodNewGresa')||0,azucar:+g('foodNewAzucar')||0,fibra:+g('foodNewFibra')||0,sal:+g('foodNewSal')||0};
      if(!o.nombre){flash('ponle un nombre al alimento');break;}
      const r=addEanProduct(o);flash(r.msg);
      if(r.ok){['foodNewNombre','foodNewMarca','foodNewEnvase','foodNewKcal','foodNewProt','foodNewCarb','foodNewGresa','foodNewAzucar','foodNewFibra','foodNewSal']
        .forEach(function(id){const el=document.getElementById(id);if(el)el.value='';});
        render();}
      break;}
    case 'scan-start':{
      /* la clase "on" del recuadro la pone iniciarEscaner() solo si la cámara llega a abrirse de
         verdad: si no hay permiso o no hay BarcodeDetector, no queremos un recuadro "encendido"
         con un vídeo en negro que parezca que está escaneando sin estarlo */
      Promise.resolve(iniciarEscaner()).then(function(m){ui.scanMsg=m;
        const o=document.getElementById('scanOut');if(o)o.textContent=m;flash(m);});break;}
    case 'scan-stop':pararEscaner();ui.scanMsg='';ui.scanRes=[];render();break;
    case 'scan-go':{const c=(document.getElementById('scanEan')||{}).value||'';
      ui.scanMsg='buscando '+c+'…';const o=document.getElementById('scanOut');if(o)o.textContent=ui.scanMsg;
      Promise.resolve(buscarYmostrar(c)).then(function(){render();});break;}
    case 'scan-find':{const t=(document.getElementById('scanQ')||{}).value||'';
      const marca=ui.scanSoloMercadona?'mercadona':'';
      Promise.resolve(buscarOffNombre(t,marca)).then(function(r){ui.scanMsg=r.msg;ui.scanRes=r.ok?(r.list||[]):[];
        render();flash(r.msg);});break;}
    case 'scan-solo-merc':ui.scanSoloMercadona=!!el.checked;break;
    case 'scan-save':{const x=(ui.scanRes||[])[+el.dataset.ix];if(!x)break;
      const res=addEanProduct(x);flash(res.msg);if(res.ok)render();break;}
    case 'scan-today':{const x=(ui.scanRes||[])[+el.dataset.ix];if(!x)break;
      const r2=addEanProduct(x);if(!r2.ok){flash(r2.msg);break;}
      flash(addFoodEntry(el.dataset.key,{ean:r2.ean,grams:100,pos:'comida'}));render();break;}
    case 'gym-prev':case 'gym-next':{const gd=parseDate(foodKey(ui.gymDate||iso(new Date()))||iso(new Date()))||new Date();
      ui.gymDate=iso(addDays(gd,a==='gym-next'?1:-1));render();break;}
    case 'gym-today':ui.gymDate=iso(new Date());render();break;
    case 'gym-dia':ui.gymDate=el.dataset.key||iso(new Date());render();break;
    case 'gym-mover':flash(moverEntreno(el.dataset.key,el.dataset.to));break;
    case 'gym-deshacer':flash(deshacerMovido(el.dataset.key));break;
    case 'gym-nueva':{ui.gymPanel='rutinas';render();window.scrollTo(0,0);
      /* render() ha reemplazado #main entero: la caja del nombre es nueva, hay que enfocarla ahora */
      const nn=document.getElementById('rtNombreNueva');if(nn)nn.focus();
      break;}
    case 'gym-fetch':flash('bajando la biblioteca de openGym: pesan unos 17 MB, en el móvil mejor con wifi');
      gymImportUrl().then(function(r){flash((r&&r.msg)||'nada más');});break;
    case 'gym-paste':{const ta=document.getElementById('gymJson');const r=gymImportText(ta?ta.value:'');
      flash((r&&r.msg)||'sin más');if(r&&r.ok&&ta)ta.value='';break;}
    case 'gym-clear':{const gg=gymS();gg.biblioteca=[];gg.fuente='';render();
      flash('lista quitada: tu rutina y tus marcas se quedan');break;}
    case 'gym-rut':flash(addRutina(ui.gymRutinaSel,el.dataset.n));break;
    case 'gym-filtro-tipo':ui.gymFiltroTipo=(ui.gymFiltroTipo===el.dataset.t)?'':el.dataset.t;render();break;
    case 'gym-filtro-region':ui.gymFiltroRegion=(ui.gymFiltroRegion===el.dataset.r)?'':el.dataset.r;render();break;
    case 'gym-set-ex':{ui.gymEx=el.dataset.n;
      ui.gymPanel='sesion';   /* el formulario vive ahí: si no, el ejercicio se pone en una pantalla que no se ve */
      render();window.scrollTo(0,0);
      const se=document.getElementById('setEx');if(se)se.focus();
      flash('ejercicio puesto en la ficha: rellena kg y reps');break;}
    case 'rt-nueva':{const inp=document.getElementById('rtNombreNueva');
      flash(nuevaRutina(inp?inp.value:''));if(inp)inp.value='';break;}
    case 'rt-add':{const rid=el.dataset.id,n=document.getElementById('rtNew-'+rid);
      ui.gymQ='';   /* añadido: la caja se vacía para el siguiente, no se queda el texto pegado */
      const r=addRutina(rid,n?n.value:'',
        {series:(document.getElementById('rtNs-'+rid)||{}).value,reps:(document.getElementById('rtNr-'+rid)||{}).value});
      flash(r);
      /* addRutina() ya ha vuelto a pintar #main: el input de antes ha quedado desmontado y sin foco,
         así que sin esto tocar «añadir» varias veces seguidas exige volver a tocar la caja cada vez
         (parece que "solo deja meter un ejercicio") — se recupera el foco en la caja nueva */
      const n2=document.getElementById('rtNew-'+rid);if(n2)n2.focus();
      break;}
    case 'rt-del':flash(delRutina(el.dataset.id,+el.dataset.ix));break;
    case 'rt-up':moverEjercicio(el.dataset.id,+el.dataset.ix,-1);break;
    case 'rt-down':moverEjercicio(el.dataset.id,+el.dataset.ix,1);break;
    case 'rt-borrar':{const nm=((gymS().rutinas.find(function(r){return r.id===el.dataset.id;}))||{}).nombre||'';
      confirmar('¿Eliminar la rutina «'+nm+'» entera? Las sesiones ya guardadas con ella se quedan en el historial.').then(function(ok){
        if(!ok)return;flash(delRutinaCard(el.dataset.id));});break;}
    case 'ses-empezar':flash(empezarRutina(el.dataset.id,el.dataset.key));break;
    case 'gv-kg':vivoSet('kg',+el.dataset.d||0);break;
    case 'gv-reps':vivoSet('reps',+el.dataset.d||0);break;
    case 'gv-rpe':vivoSet('rpe',+el.dataset.d||0);break;
    case 'gv-apuntar':flash(vivoApuntar());break;
    case 'gv-ir':{const sa=ui.gymSesionActiva;if(!sa)break;
      sa.ix=+el.dataset.ix||0;ui.gymVivo=null;ui.gymPanel='vivo';render();window.scrollTo(0,0);break;}
    case 'gv-cambiar':ui.gymPanel='cambiar';render();window.scrollTo(0,0);break;
    case 'rt-editar':{ui.gymRutSel=el.dataset.id||'';ui.gymPanel='rutedit';ui.gymQ='';ui.gymFiltroRegion='';
      render();window.scrollTo(0,0);break;}
    case 'rt-ser':{const g2=gymS(),rt2=g2.rutinas.filter(function(r){return r.id===el.dataset.id;})[0];
      if(!rt2)break;
      const ej=rt2.ejercicios[+el.dataset.ix];if(!ej)break;
      ej.series=Math.max(1,Math.min(12,(+ej.series||3)+(+el.dataset.d||0)));
      save();render();break;}
    case 'rt-add-lib':{ui.gymQ='';flash(addRutina(el.dataset.id,el.dataset.n));break;}
    case 'obj-tipo':ui.objTipo=el.dataset.t||'fuerza';render();break;
    case 'obj-add':{const gv=function(id){return (document.getElementById(id)||{}).value||'';};
      flash(nuevoObjetivo(el.dataset.t,gv('objEx'),gv('objMeta')));break;}
    case 'obj-del':flash(delObjetivo(el.dataset.id));break;
    case 'perf-celiaco':flash(setPerfil('celiaco'));break;
    case 'perf-avena':flash(setPerfil('avena'));break;
    case 'perf-meta':flash(setPerfil('meta',el.dataset.v));break;
    case 'perf-peso':{const c=document.getElementById('perfPeso');
      flash(apuntarPeso(c?c.value:0));break;}
    case 'glu-cambiar':flash(cambiarPlatoSinGluten(el.dataset.id));break;
    case 'obj-ex':{ui.objEx=el.dataset.n||'';render();window.scrollTo(0,0);break;}
    case 'rt-nueva-rapida':{flash(nuevaRutina(''));
      const g3=gymS(),ult=g3.rutinas[g3.rutinas.length-1];
      if(ult){ui.gymRutSel=ult.id;ui.gymPanel='rutedit';render();window.scrollTo(0,0);}
      break;}
    case 'gv-mas15':{if(!ui.gymDesc)break;
      ui.gymDesc.fin+=15000;ui.gymDesc.total+=15;pintaDescanso();break;}
    case 'gv-saltar':ui.gymDesc=null;render();break;
    case 'gv-terminar':{const sa=ui.gymSesionActiva;if(!sa)break;
      const min=Math.max(1,Math.round((Date.now()-(+sa.ts||Date.now()))/60000))||duracionTipica(sa.rutinaId);
      const sid=sa.id;
      flash(terminarSesion(min,undefined,''));
      /* el informe: lo que has hecho, cómo ha ido frente a la vez anterior y los récords */
      ui.gymInforme=sid;ui.gymPanel='';render();window.scrollTo(0,0);break;}
    case 'gym-informe-cerrar':ui.gymInforme='';ui.gymPanel='';render();window.scrollTo(0,0);break;
    case 'ses-terminar':{const gv=function(id){return (document.getElementById(id)||{}).value||'';};
      const chk=document.getElementById('sesCompleto');
      const sid=(ui.gymSesionActiva||{}).id||'';
      flash(terminarSesion(gv('sesMinutos'),chk?!!chk.checked:undefined,gv('sesNota')));
      /* el informe sale se termine por donde se termine */
      if(sid&&gymS().sesiones.some(function(x){return x.id===sid;})){
        ui.gymInforme=sid;ui.gymPanel='';render();window.scrollTo(0,0);}
      break;}
    case 'ses-descartar':{confirmar('¿Descartar esta sesión? Las series que has montado se quitan del registro.').then(function(ok){
        if(!ok)return;flash(descartarSesion());});break;}
    case 'cardio-add':{const gv=function(id){return (document.getElementById(id)||{}).value||'';};
      const tipoNuevo=gv('cardioTipo')||ui.cardioAbierto||'otro';ui.cardioAbierto=tipoNuevo;
      flash(addCardio({tipo:tipoNuevo,fecha:gv('cardioFecha'),duracionMin:gv('cardioMin'),
        distanciaKm:gv('cardioKm'),nota:gv('cardioNota')}));break;}
    case 'tema-pre':flash(ponerTema(el.dataset.id));break;
    case 'franja-reset':{if(!store.franja)store.franja={horas:24};
      store.franja.colores={};save();render();flash('Colores de la franja restablecidos');break;}
    case 'mes-cfg':{
      /* el número por sí solo no se puede tocar: el KPI lleva al sitio donde se cambia (315fd543) */
      const to=el.dataset.to;
      irACard(to==='jornada'?'types':'',to,to==='jornada'?80:0);
      break;}
    case 'ir-servicios':irACard('month','servicios');break;
    case 'franja-cfg':irACard('ajustes','franja');break;
    case 'types-vista':{ui.typesVista=el.dataset.v||'';render();window.scrollTo(0,0);break;}
    case 'food-vista':{ui.foodVista=el.dataset.v||'';
      if(el.dataset.p)ui.foodPanel=el.dataset.p;
      if(ui.foodVista!=='add')ui.foodSel='';
      if(ui.foodVista!=='cocina'){ui.cocinaPlato='';ui.cocinaPaso=0;ui.cocinaRac=0;}
      if(ui.tab!=='food'){ui.tab='food';}
      render();window.scrollTo(0,0);break;}
    case 'gym-panel':{ui.gymPanel=el.dataset.p||'';
      ui.gymInforme='';   /* el informe tapa cualquier panel: salir de él es cerrarlo */
      if(!ui.gymPanel)ui.cardioAbierto='';   /* al volver a la portada, Cardio empieza en sus fichas */
      render();window.scrollTo(0,0);break;}
    case 'imp-traer':impTraerEnlace();break;
    case 'lector-probar':lectorProbar();break;
    case 'food-abrir':{
      ui.foodSel=el.dataset.v||'';
      const x=buscableDe(ui.foodSel);
      ui.foodCant=x?x.porDefecto:0;
      ui.foodPos=ui.foodPos||momentoAhora();
      ui.foodVista='cantidad';render();window.scrollTo(0,0);break;}
    case 'food-rapido':{
      /* el + apunta con la cantidad de siempre, sin abrir nada: es el camino de tres toques */
      const x=buscableDe(el.dataset.v||'');
      if(!x){flash('eso ya no está');break;}
      flash(apuntaBuscable(el.dataset.key,x,x.porDefecto,ui.foodPos||momentoAhora()));
      render();break;}
    case 'food-apuntar':{
      const x=buscableDe(ui.foodSel||'');
      if(!x){flash('eso ya no está');break;}
      flash(apuntaBuscable(el.dataset.key,x,+ui.foodCant||x.porDefecto,ui.foodPos||momentoAhora()));
      ui.foodSel='';ui.foodVista='';render();window.scrollTo(0,0);break;}
    case 'food-cant-paso':{
      const x=buscableDe(ui.foodSel||'');if(!x)break;
      const d=+el.dataset.d||0,min=x.base===1?0.25:5;
      ui.foodCant=Math.max(min,Math.round(((+ui.foodCant||x.porDefecto)+d)*100)/100);
      render();break;}
    case 'food-cant-set':{ui.foodCant=+el.dataset.n||0;render();break;}
    case 'food-pos-b':{ui.foodPos=el.dataset.p||'';render();break;}
    case 'food-tipo':{ui.foodTipo=el.dataset.t||'';render();break;}
    case 'food-busca-clear':{ui.foodBusca='';render();
      setTimeout(function(){const i=document.getElementById('fbQ');if(i)i.focus();},40);break;}
    case 'food-panel2':{ui.foodPanel=el.dataset.k||'scan';ui.foodVista='add';render();window.scrollTo(0,0);break;}
    case 'cocina-tab':{ui.cocinaTab=el.dataset.t||'';render();window.scrollTo(0,0);break;}
    case 'platos-tab':{ui.platosTab=el.dataset.t||'';render();window.scrollTo(0,0);break;}
    case 'prod-marca':{ui.prodMarca=el.dataset.m||'';render();break;}
    case 'antojo-ing':{const a=antojoS(),v=el.dataset.v,i=a.ing.indexOf(v);
      if(i>=0)a.ing.splice(i,1);else a.ing.push(v);render();break;}
    case 'antojo-kcal':{antojoS().kcal=el.dataset.v||'';render();break;}
    case 'antojo-prot':{antojoS().prot=el.dataset.v||'';render();break;}
    case 'antojo-limpiar':{ui.antojo={ing:[],kcal:'',prot:''};render();break;}
    case 'alim-pick':{ui.alimSel=el.dataset.id||'';ui.alimG=100;ui.foodVista='ficha';
      if(ui.tab!=='food')ui.tab='food';
      render();window.scrollTo(0,0);break;}
    case 'alim-grupo':{ui.alimGrupo=el.dataset.g||'';render();break;}
    case 'alim-g':{ui.alimG=Math.max(1,+el.dataset.n||100);render();break;}
    case 'alim-apuntar':{
      const sel=(ui.foodDate&&foodKey(ui.foodDate))?foodKey(ui.foodDate):iso(new Date());
      const pos=document.getElementById('alPos');
      flash(addFoodEntry(sel,{alim:el.dataset.id,grams:Math.max(1,+ui.alimG||100),pos:pos?pos.value:momentoAhora()}));
      render();break;}
    case 'alim-nevera':{flash(neveraToggle(el.dataset.id));render();break;}
    case 'alim-usda':{flash('consultando USDA…');
      usdaBuscar(el.dataset.id).then(function(r){render();flash(r.msg);});break;}
    case 'alim-usda-off':{flash(usdaOlvidar(el.dataset.id));render();break;}
    case 'alim-nuevo':{ui.alimNuevo={};ui.foodVista='alimnuevo';render();window.scrollTo(0,0);break;}
    case 'alim-editar':{const a=alimById(el.dataset.id);
      if(a){ui.alimNuevo=Object.assign({},a);ui.foodVista='alimnuevo';render();window.scrollTo(0,0);}break;}
    case 'alim-del':{const a=alimById(el.dataset.id);
      confirmar('¿Quitar «'+((a&&a.n)||'este alimento')+'»? Las tomas que ya apuntaste se quedan como están.','Sí, quitarlo')
        .then(function(ok){if(!ok)return;flash(delAlimPropio(el.dataset.id));ui.foodVista='alimentos';render();});
      break;}
    case 'alim-guardar':{
      const r=addAlimPropio(ui.alimNuevo||{});
      flash(r.msg);
      if(r.ok){ui.alimSel=r.id;ui.alimG=100;ui.foodVista='ficha';ui.alimNuevo=null;render();window.scrollTo(0,0);}
      break;}
    case 'micro-abrir':{ui.microAbierto=(ui.microAbierto===el.dataset.k)?'':(el.dataset.k||'');render();break;}
    case 'nevera-add':{flash(neveraToggle(el.dataset.id));ui.neveraQ='';render();break;}
    case 'nevera-del':{flash(neveraToggle(el.dataset.id));render();break;}
    case 'nevera-vaciar':{confirmar('¿Vaciar la nevera entera?','Sí, vaciarla').then(function(ok){
      if(!ok)return;flash(neveraVaciar());render();});break;}
    case 'nevera-compra':{flash(neveraDesdeCompra());render();break;}
    case 'idea-guardar':{flash(guardarCombinacion(+el.dataset.ix));render();break;}
    case 'idea-apuntar':{
      const c=(ui.ideasCache||[])[+el.dataset.ix];
      if(!c){flash('esa idea ya no está');break;}
      const key=el.dataset.key,pos=momentoAhora();
      c.partes.forEach(function(pt){addFoodEntry(key,{alim:pt.a.id,grams:pt.g,pos:pos});});
      flash('apuntado: '+c.nombre+' · '+c.t.kcal+' kcal');render();break;}
    case 'plato-nuevo':{ui.plato=platoVacio();ui.platoQ='';ui.foodVista='plato';render();window.scrollTo(0,0);break;}
    case 'plato-ing-add':{
      if(!ui.plato)ui.plato=platoVacio();
      const id=el.dataset.id;
      if(ui.plato.alims.some(function(x){return x.id===id;})){flash('ya lo lleva');break;}
      ui.plato.alims.push({id:id,g:gramosPorDefecto(alimById(id))});ui.platoQ='';render();break;}
    case 'plato-ing-del':{if(ui.plato)ui.plato.alims.splice(+el.dataset.ix,1);render();break;}
    case 'plato-guardar':{const m=guardarPlato();flash(m);render();break;}
    case 'ir-usda':ui.usdaGuia=true;irACard('ajustes','usda');break;
    case 'sitio-set':flash(setSitio(el.dataset.id));break;
    case 'sitio-nuevo':{ui.sitioNuevo=!ui.sitioNuevo;render();break;}
    case 'sitio-add':{
      const n=document.getElementById('stNombre'),la=document.getElementById('stLat'),lo=document.getElementById('stLon');
      const r=addSitio(n?n.value:'',la?la.value:'',lo?lo.value:'');
      flash(r.msg);
      if(r.ok){ui.sitioNuevo=false;render();}
      break;}
    case 'sitio-del':
      /* la × vive dentro del chip que cambia de sitio. No hace falta parar la propagación: el
         despachador usa closest('[data-a]') desde el elemento pulsado, así que gana la ×. */
      flash(delSitio(el.dataset.id));render();break;
    case 'sitio-gps':{
      if(!navigator.geolocation){flash('este navegador no sabe darme la ubicación: pon la latitud y la longitud a mano');break;}
      flash('pidiendo la ubicación…');
      navigator.geolocation.getCurrentPosition(function(p){
        const la=document.getElementById('stLat'),lo=document.getElementById('stLon');
        if(la)la.value=Math.round(p.coords.latitude*1e4)/1e4;
        if(lo)lo.value=Math.round(p.coords.longitude*1e4)/1e4;
        flash('ahí está: ponle nombre y guarda');
      },function(e){flash('no me ha dejado ('+((e&&e.message)||'sin permiso')+'): ponlo a mano');},
        {timeout:10000,maximumAge:600000});
      break;}
    case 'nota-add':{
      const t=document.getElementById('ntNueva');
      const r=addNota(t?t.value:(ui.notaNueva||''),el.dataset.hoy?iso(new Date()):'');
      flash(r.msg);
      if(r.ok){ui.notaNueva='';render();}
      break;}
    case 'nota-add-dia':{
      const r=addNota('Nota nueva',el.dataset.key);
      if(!r.ok){flash(r.msg);break;}
      ui.notaSel=r.id;ui.tab='notas';render();window.scrollTo(0,0);
      setTimeout(function(){const t=document.getElementById('ntTxt');
        if(t){t.focus();t.select();}},80);
      break;}
    case 'nota-abrir':{ui.notaSel=el.dataset.id;ui.tab='notas';render();window.scrollTo(0,0);break;}
    case 'nota-cerrar':{ui.notaSel='';render();window.scrollTo(0,0);break;}
    case 'nota-filtro':{ui.notaFiltro=el.dataset.f||'';render();break;}
    case 'nota-hecha':{flash(toggleNotaHecha(el.dataset.id));render();break;}
    case 'nota-hoy':{setNota(el.dataset.id,'fecha',iso(new Date()));render();flash('puesta para hoy');break;}
    case 'nota-sin-dia':{
      const x=notaById(el.dataset.id);
      if(x&&x.evId){flash('primero quítala del calendario: su evento tiene fecha');break;}
      setNota(el.dataset.id,'fecha','');render();flash('sin día: se queda solo en la libreta');break;}
    case 'nota-del':{
      confirmar('¿Borrar esta nota?','Sí, borrarla').then(function(ok){
        if(!ok)return;
        const x=notaById(el.dataset.id);
        if(x&&x.evId)desenlazaNota(el.dataset.id);
        flash(delNota(el.dataset.id));ui.notaSel='';render();});
      break;}
    case 'nota-al-calendario':{
      const tit=document.getElementById('ntEvTit'),hr=document.getElementById('ntEvHora');
      const av=document.getElementById('ntEvAviso'),ca=document.getElementById('ntEvCuenta');
      const r=notaAEvento(el.dataset.id,{titulo:tit?tit.value:'',hora:hr?hr.value:'',
        recordatorio:!!(av&&av.checked),cuentaAtras:!!(ca&&ca.checked)});
      flash(r.msg);render();break;}
    case 'nota-desenlaza':{flash(desenlazaNota(el.dataset.id));render();break;}
    case 'ir-eventos':ui.tab='eventos';ui.evVista='';ui.evForm=null;render();window.scrollTo(0,0);break;
    case 'ir-semana-cfg':
      /* Turno y rotación ya no es una pantalla única: la tarjeta de la semana vive en su vista, así
         que el atajo tiene que abrirla antes de ir a buscarla */
      ui.cfgVista='semana';irACard('cfg','semana');break;
    case 'ir-sol':irACard('ajustes','sol');break;
    case 'usda-probar':usdaProbar();break;
    case 'usda-guia':ui.usdaGuia=!ui.usdaGuia;render();break;
    case 'usda-olvidar-todo':{
      const n=Object.keys(food().usda).length;
      if(!n){flash('no hay nada corregido todavía');break;}
      confirmar('¿Volver los '+n+' alimento(s) al valor aproximado de la tabla?','Sí, volver a la tabla').then(function(ok){
        if(!ok)return;
        food().usda={};save();render();flash('listo: todo vuelve a la tabla de la app');});
      break;}
    case 'app-actualizar':{flash('actualizando…');
      /* recarga saltándose la caché: el service worker ya pide con no-store, pero la propia
         navegación también tiene que salir a la red */
      setTimeout(function(){location.reload();},120);break;}
    case 'lector-guia':ui.lectorGuia=!ui.lectorGuia;render();break;
    case 'ir-lector':ui.lectorGuia=true;irACard('ajustes','lector');break;
    case 'imp-claude':impConClaude();break;
    case 'imp-local':impLocal();break;
    case 'imp-clear':{ui.imp.txt='';ui.imp.url='';ui.imp.imagenes=null;ui.imp.estado='';ui.imp.msg='';ui.imp.ofrecer=false;
      impFuenteNueva();impOlvidaPendiente();render();break;}
    case 'imp-pegar':impPegar();break;
    case 'lector-publico':{
      if(!store.lector)store.lector={proxy:'',publico:false};
      store.lector.publico=true;save();
      ui.imp.estado='';ui.imp.msg='';ui.imp.ofrecer=false;
      flash('Lector público activado: reintentando…');
      impTraerEnlace();break;}
    case 'lector-publico-off':{
      if(!store.lector)store.lector={proxy:'',publico:false};
      store.lector.publico=false;save();render();flash('Desactivado: ya no se usan intermediarios públicos');break;}
    case 'imp-descartar':{ui.imp.receta=null;ui.imp.via='';render();break;}
    case 'imp-save':flash(impGuardar());break;
    case 'cardio-del':flash(delCardio(el.dataset.id));break;
    case 'lista-add':{const n=document.getElementById('lsNueva');
      flash(addLista(n?n.value:''));break;}
    case 'lista-del':{const l=listaById(el.dataset.id);if(!l)break;
      confirmar('¿Borrar la lista «'+l.nombre+'»?').then(function(ok){if(ok)flash(delLista(el.dataset.id));});break;}
    case 'lista-fija':{const l=listaById(el.dataset.id);if(l){l.fija=!l.fija;save();render();}break;}
    case 'lista-item-add':{const lid=el.dataset.id,n=document.getElementById('lsNew-'+lid);
      flash(addItemLista(lid,n?n.value:''));
      /* addItemLista() ha repintado #main: el input de antes está desmontado y sin foco, así que
         en el móvil se cerraría el teclado y el siguiente toque enviaría vacío (mismo caso que rt-add) */
      const n2=document.getElementById('lsNew-'+lid);if(n2)n2.focus();
      break;}
    case 'lista-item-del':flash(delItemLista(el.dataset.id,+el.dataset.i));break;
    case 'lista-platos':{ui.listaPlatos=(ui.listaPlatos===el.dataset.id)?'':el.dataset.id;render();break;}
    case 'cardio-open':{ui.cardioAbierto=el.dataset.tipo||'';render();
      setTimeout(function(){const c=document.querySelector('#main .card[data-cardio]');
        if(c)c.scrollIntoView({behavior:'smooth',block:'start'});},40);
      break;}
    case 'cardio-back':ui.cardioAbierto='';render();break;
    case 'gym-set':{const gv=function(id){return (document.getElementById(id)||{}).value||'';};
      const r=addSet(el.dataset.key,{ex:gv('setEx'),kg:gv('setKg'),reps:gv('setReps'),rpe:gv('setRpe'),nota:gv('setNota')});
      ui.gymEx=gv('setEx');render();flash(r);break;}
    case 'set-del':{const r=delSet(el.dataset.id);render();flash(r);break;}
    case 'gym-seg-on':{const gg=gymS();gg.segundo.on=!gg.segundo.on;if(gg.segundo.on&&!gg.segundo.dias.length)gg.segundo.dias=[3];
      render();flash(gg.segundo.on?'segundo día activado: se pondrá solo en los días marcados':'segundo día apagado');break;}
    case 'gym-seg-day':flash(toggleSegundoDia(+el.dataset.day));break;
    case 'gym-seg-hoy':{const r=toggleSegundo(el.dataset.key);flash(r);break;}
    case 'svc-plan':{const dm=/^(\d{4})-(\d{2})$/.exec((document.getElementById('svcDesde')||{}).value||'');
      const hm=/^(\d{4})-(\d{2})$/.exec((document.getElementById('svcHasta')||{}).value||'');
      if(!dm||!hm){flash('pon el mes de empezar y el mes de acabar');break;}
      flash(planServicios(+dm[1],+dm[2]-1,+hm[1],+hm[2]-1,num((document.getElementById('svcMeses')||{}).value,1)));render();break;}
    case 'svc-clear':{confirmar('¿Quitar el servicio y las guardias asignadas a TODOS los meses? Tus días puestos a mano se quedan.').then(function(ok){
      if(!ok)return;store.rotation.month={};save();render();flash('reparto de servicios quitado');});break;}
    case 'svc-add':{store.rotation.servicios.push('Servicio '+(store.rotation.servicios.length+1));
      if(!Array.isArray(store.rotation.svcMeses))store.rotation.svcMeses=[];
      store.rotation.svcMeses.push(1);save();render();break;}
    case 'svc-del':{const ix=+el.dataset.ix;store.rotation.servicios.splice(ix,1);
      if(Array.isArray(store.rotation.svcMeses))store.rotation.svcMeses.splice(ix,1);
      save();render();break;}
    case 'day-set':{const v=el.dataset.sid||'';
      setDayOverride(el.dataset.key,v||'',el.dataset.guard||(v?'':''));save();
      render();
      const auto=v?((ponerSalienteAuto(el.dataset.key).txt)||''):'';
      flash(v?('día puesto: '+((shiftById(v)||{}).name||'')+(el.dataset.guard?(' · '+el.dataset.guard):'')+
        (store.rotation.autoPos!==false?auto:'')):'día liberado (y su saliente automático, si lo puso la app)');break;}
    case 'day-rhythm':editDayRhythm(el.dataset.key);break;
    case 'day-guardia':{const rg=setGuardiaTipo(el.dataset.key,el.dataset.guard||'');flash(rg.msg);
      if(rg.ok)render();break;}
    case 'gtipo-add':{const inp=document.getElementById('gtipoNuevo');const r=addGuardiaTipo(inp?inp.value:'');
      if(r.ok&&inp)inp.value='';flash(r.msg);break;}
    case 'gym-wipe':{const txts={log:'¿Borrar las series apuntadas? Tus pesos y tus marcas salen de ahí (luego se pueden deshacer).',
        rut:'¿Vaciar tus rutinas? El registro de series y el historial de sesiones se quedan.',
        seg:'¿Quitar el segundo día de gym y las marcas puestas a mano?',
        all:'¿Limpiar TODO el entreno (series, rutinas, sesiones, cardio y segundo día)? La biblioteca importada se queda.',
        todo:'¿Limpiar todo el entreno, incluida la biblioteca de openGym? (También se puede deshacer)'};
      confirmar(txts[el.dataset.what]||'¿Limpiar esa parte del entreno?').then(function(ok){
        if(!ok)return;const rw=gymWipe(el.dataset.what);flash(rw.msg);});break;}
    case 'gym-undo':{const ru=gymUndoWipe();flash(ru.msg);break;}
    case 'cal-descargar':{const rr=calRangoUI();
      const tx=icsTexto(rr.desde,rr.hasta,{import:calNombreTxt(rr.desde)});
      if(!tx||tx.indexOf('BEGIN:VCALENDAR')<0){flash('no hay nada que exportar en ese rango');break;}
      ui.calTxt=tx;ui.calView=true;ui.calFile=calFileTxt(rr.desde,rr.hasta);
      dlTxt(tx,ui.calFile,'text/calendar;charset=utf-8');render();
      flash('descargado: cópialo a la carpeta que sincronices y pega en Google el bloque de las cuatro líneas');break;}
    case 'cal-copiar':{const rr2=calRangoUI();
      copy(icsTexto(rr2.desde,rr2.hasta,{import:calNombreTxt(rr2.desde)}));break;}
    case 'cal-ver':{const rr3=calRangoUI();
      if(ui.calView){ui.calView=false;render();flash('lista ocultada (el texto sigue ahí para copiar)');break;}
      ui.calTxt=icsTexto(rr3.desde,rr3.hasta,{import:calNombreTxt(rr3.desde)});
      ui.calView=true;ui.calFile=calFileTxt(rr3.desde,rr3.hasta);render();
      flash(ui.calTxt.indexOf('BEGIN:VCALENDAR')<0?'no hay nada que ver en ese rango':'los pasos para Google, abajo del todo');break;}
    case 'cal-nombre':{const inp=document.getElementById('calNombre');
      const v=(inp?inp.value:'').trim().replace(/\s+/g,' ').slice(0,40);
      store.rotation.calNombre=v;calRefresca();save();render();
      flash(v?('el cuaderno se llamará «'+v+'»: así sale en la descarga y en el IMPORT_TAG')
        :'nombre quitado: se llamará «'+calNombreTxt(calRangoUI().desde)+'» con el rango detrás');break;}
    case 'cal-copiar-url':{const t=document.getElementById('calUrlTxt');
      if(!t){flash('primero dale a «ver la lista»: el bloque sale ahí');break;}
      copy(t.value);break;}
    case 'cal-url':{const u=((document.getElementById('icsUrl')||{}).value||'').trim();
      if(!/^https?:\/\//i.test(u)){flash('pega la dirección completa del .ics (empezando por https://)');break;}
      if(typeof fetch!=='function'){flash('sin red aquí: exporta el .ics desde Google y pégalo en la caja');break;}
      flash('leyendo el enlace…');
      fetch(u).then(function(r){if(!r.ok)throw new Error('http '+r.status);return r.text();}).then(function(t){
        const box=document.getElementById('icsBox');if(box)box.value=t;
        const mm=/IMPORT-FLAG:([^\r\n]{2,40})/.exec(String(t||''));
        if(mm&&!store.rotation.calNombre){store.rotation.calNombre=icsUnesc(mm[1]).trim();}
        ui.calTxt='';ui.calView=false;icsAnalizar();
        flash('traído de la URL: mira la lista de «para dentro»');}).catch(function(e){
        flash('no he podido bajarlo ('+((e&&e.message)||'permisos')+'): exporta el .ics y pégalo aquí');});break;}
    case 'cal-analizar':{icsAnalizar();break;}
    case 'cal-aplicar':{const box2=document.getElementById('icsBox'),v2=(box2&&box2.value?box2.value:(ui.icsTxt||''));
      const opt2={desde:(document.getElementById('icsDesde')||{}).value||ui.icsDesde||'',
        hasta:(document.getElementById('icsHasta')||{}).value||ui.icsHasta||'',
        encima:!!(document.getElementById('calEncima')||{}).checked};
      ui.icsEncima=!!opt2.encima;
      /* si nadie tocó la caja desde el análisis, se reutiliza la vista: no se vuelve a parsear */
      const p2=(ui.icsPrev&&ui.icsPrev.txt===v2&&ui.icsPrev.ok)?ui.icsPrev:icsPlan(v2,opt2);
      const r=icsAplicar(p2,opt2);
      if(r&&r.ok){ui.icsPrev=null;save();render();flash(r.msg);}
      else{ui.icsPrev=null;render();flash((r&&r.msg)||'nada que aplicar');}break;}
    case 'sueno-fix':flash(aplicarAcostarse());save();render();break;
    case 'sueno-cenas':flash(encajarCenas());save();render();break;
    case 'rh-8h':{const wEl=document.querySelector('#modal [data-k="wake"]');
      const rec=acostarsePara(wEl?wEl.value:'');
      if(!rec){flash('pon antes la hora de levantarte');break;}
      const sEl=document.querySelector('#modal [data-k="sleep"]');if(sEl)sEl.value=rec;
      const kk=el.dataset.key;
      if(kk){if(!store.rotation.dayRhythm)store.rotation.dayRhythm={};
        const o=store.rotation.dayRhythm[kk]||{};o.sleep=rec;store.rotation.dayRhythm[kk]=o;
        closeModal();save();render();
        flash('acostarse a las '+rec+': '+suenoCfg().min+' h aseguradas');}
      else flash('acostarse a las '+rec+' apuntado: dale a «guardar» para que se quede');break;}
    case 'day-rhythm-shift':editDayRhythmShift(el.dataset.id);break;
    case 'rh-reset':{const k=el.dataset.key;if(k&&store.rotation.dayRhythm){delete store.rotation.dayRhythm[k];}
      closeModal();save();render();flash('el día vuelve a usar las horas de la plantilla');break;}
    case 'bf-defaults':{const lista=store.shifts.filter(function(sh){return sh.start&&!/saliente/i.test(sh.name);});
      const msgs=lista.map(function(sh){return quickBreakfast(sh.id,null);});
      save();render();flash(msgs.filter(function(x){return /montado|añadido/.test(x);}).length+'/'+lista.length+
        ' día(s) de trabajar con el desayuno rápido (el resto ya lo tenía)');break;}
    case 'bf-quick':case 'day-quickbf':{let sh=el.dataset.id;
      if(a==='day-quickbf'&&!sh){const dd=weekDays()[+el.dataset.i];sh=dd&&dd.shiftId;}
      if(!sh){flash('ese día aún no tiene tipo asignado');break;}
      flash(quickBreakfast(sh,null));save();render();break;}
    case 'day-open':{const k=el.dataset.key;if(ui.openDays.has(k))ui.openDays.delete(k);else ui.openDays.add(k);
      render();
      const nx=document.querySelector('[data-a="day-open"][data-key="'+CSS.escape(k)+'"]');if(nx)nx.focus();break;}
    case 'toggle-picker':{const k=el.dataset.id;if(ui.openPickers.has(k))ui.openPickers.delete(k);else ui.openPickers.add(k);
      render();
      const nx=document.querySelector('[data-a="toggle-picker"][data-id="'+CSS.escape(k)+'"]');if(nx)nx.focus();break;}
    case 'wk-expand-all':{if(allOpen())ui.openDays=new Set();
      else ui.openDays=new Set(semanaVentana().map(function(d){return d.key||('tpl'+d.idx);}));render();break;}
    case 'rules':editRules();break;
    case 'txt':$('#txtOut').value=toText();break;
    case 'txtcopy':copy($('#txtOut').value||toText());break;
    case 'day-edit':{if(!id)break;ui.tab='types';ui.typesVista=id;render();
      setTimeout(function(){const c=$('#main .card[data-shift="'+id+'"]');
        if(c){c.style.outline='2px solid var(--brand)';c.scrollIntoView({behavior:'smooth',block:'start'});
          setTimeout(function(){c.style.outline='';},1400);}},60);break;}
    case 'shift-new':editShift(null);break;
    case 'shift-edit':editShift(id);break;
    case 'shift-del':{if(store.shifts.length<=1){flash('Hace falta al menos un tipo de día');break;}
      const s=shiftById(id);confirmar('¿Eliminar «'+s.name+'» con su menú?').then(function(ok){
        if(!ok)return;
        store.shifts=store.shifts.filter(x=>x.id!==id);delete store.menu[id];
        store.patterns.forEach(p=>{p.days=p.days.map(c=>c===s.code?'':c);});
        save();render();});break;}
    case 'dup-day':{const src=clone(store.menu[id]||[]).map(s=>Object.assign(s,{id:uid('sl')}));
      const base=shiftById(id);const n={id:uid('sh'),code:(base.code+'2').slice(0,3),name:'Copia '+base.name,icon:base.icon,start:base.start,end:base.end,intensity:base.intensity,desc:base.desc,color:base.color};
      store.shifts.push(n);store.menu[n.id]=src;save();render();flash('Día duplicado: edita su menú');break;}
    case 'slot-add':{const t=curShiftId(el)||id;
      if(!t)break;if(!store.menu[t])store.menu[t]=[];
      store.menu[t].push({id:uid('sl'),time:'',label:'Nueva comida',items:[]});save();render();break;}
    case 'slot-del':{const sh=curShiftId(el);if(!sh)break;store.menu[sh].splice(+el.dataset.i,1);save();render();break;}
    case 'slot-meal-edit':{const sh=curShiftId(el);if(!sh)break;editMeal(store.menu[sh][+el.dataset.i].mealId);break;}
    case 'slot-loose':{const sh=curShiftId(el);if(!sh)break;const sl=store.menu[sh][+el.dataset.i];if(!sl||!sl.mealId)break;
      const m=mealById(sl.mealId);sl.items=clone((m&&m.items)||[]);sl.mealId='';save();render();
      flash('desmontada «'+((m&&m.name)||'la comida')+'»: ya puedes cambiar sus platos solo en este día');break;}
    case 'slot-tomeal':{const sh=curShiftId(el);if(!sh)break;const sl=store.menu[sh][+el.dataset.i];
      if(!sl||!(sl.items||[]).length){flash('primero ponle al menos un plato a ese hueco');break;}
      editMeal(null,{slot:{s:sh,i:+el.dataset.i}});break;}
    case 'slot-up':case 'slot-down':{const sh=curShiftId(el);if(!sh)break;moveSlot(sh,+el.dataset.i,a==='slot-up'?-1:1);break;}
    case 'pick-meal':case 'pick-dish':{const sh=el.dataset.shift||curShiftId(el);
      flash(togglePicker(sh,a==='pick-meal'?'meal':'dish',id));save();render();break;}
    case 'it-add':{const sh=curShiftId(el)||id;if(!sh)break;const s=store.menu[sh][+el.dataset.i];s.mealId='';s.items=s.items||[];
      s.items.push({kind:'dish',id:(store.dishes[0]||{}).id,portions:1});save();render();break;}
    case 'it-del':{const sh=curShiftId(el)||id;if(!sh)break;const s=store.menu[sh][+el.dataset.i];s.items.splice(+el.dataset.j,1);save();render();break;}
    case 'dish-new':editDish(null);break;
    case 'dish-edit':editDish(id);break;
    case 'dish-del':{const dnm=dishById(id).name;confirmar('¿Eliminar «'+dnm+'» del catálogo?').then(function(ok){
      if(!ok)return;store.dishes=store.dishes.filter(d=>d.id!==id);purgeDish(id);save();render();});break;}
    case 'meal-new':draftMeal=null;editMeal(null);break;
    case 'meal-edit':editMeal(id);break;
    case 'meal-del':confirmar('¿Eliminar esta comida armada? Los días que la usen se quedan sin plato.').then(function(ok){
      if(!ok)return;
      store.meals=store.meals.filter(m=>m.id!==id);
      Object.keys(store.menu).forEach(k=>store.menu[k].forEach(s=>{if(s.mealId===id)s.mealId='';}));
      save();render();});break;
    case 'batch-new':{store.batches.push({id:uid('b'),label:'Nueva sesión',when:'',note:''});save();render();break;}
    case 'batch-edit':editBatch(id);break;
    case 'batch-del':{const b=batchById(id);if(!b)break;confirmar('¿Eliminar la sesión «'+b.label+'»? Sus platos pasan a «sin lote».').then(function(ok){
      if(!ok)return;
      store.dishes.forEach(d=>{if(d.batchId===id)d.batchId='bn';});
      store.batches=store.batches.filter(x=>x.id!==id);save();render();});break;}
    case 'mark':{const on=!ui.marks.has(id);if(on)ui.marks.add(id);else ui.marks.delete(id);
      el.classList.toggle('done',on);el.classList.toggle('ok',on);
      const cb=el.querySelector('input');if(cb)cb.checked=on;
      const bx=el.querySelector('.box');if(bx)bx.setAttribute('aria-checked',on?'true':'false');
      _compraUlt.marcados+=on?1:-1;compraPinta();
      saveMarks();break;}
    case 'mark-clear':ui.marks=new Set();saveMarks();render();break;
    case 'pat-use':store.rotation.pattern=store.patterns.findIndex(p=>p.id===id);store.rotation.mode='template';save();render();break;
    case 'pat-new':{store.patterns.push({id:uid('pat'),name:'Semana nueva',days:['G','','','','','',''],note:''});save();render();break;}
    case 'pat-copy':{const n=clone(store.patterns.find(p=>p.id===id));n.id=uid('pat');n.name+=' (copia)';store.patterns.push(n);save();render();break;}
    case 'pat-del':{if(store.patterns.length<=1){flash('Debe quedar al menos una semana tipo');break;}
      confirmar('¿Eliminar esta semana tipo?').then(function(ok){
        if(!ok)return;
        store.patterns=store.patterns.filter(p=>p.id!==id);
        store.rotation.pattern=Math.min(store.rotation.pattern,store.patterns.length-1);save();render();});break;}
    case 'm-add-item':{const m=mealById(mealCtx)||draftMeal;if(!m)break;
      capMeal();m.items=m.items||[];m.items.push({kind:'dish',id:(store.dishes[0]||{}).id,portions:1});
      editMeal(mealCtx);break;}
    case 'm-del-item':{const m=mealById(mealCtx)||draftMeal;if(!m)break;
      capMeal();const j=+el.dataset.j;if(m.items[j])m.items[j]._gone=1;editMeal(mealCtx);break;}
  }
}
function copy(txt){
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(()=>flash('Copiado al portapapeles'),()=>fallbackCopy(txt));}
  else fallbackCopy(txt);
}
function fallbackCopy(txt){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');flash('Copiado');}catch(e){flash('Copia manual: selecciona el texto');}ta.remove();}
function dl(){
  const name='planning-guardias-'+iso(new Date())+'.json';
  try{
    const blob=new Blob([JSON.stringify(store,null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),3000);
  }catch(e){
    const ta=document.createElement('textarea');ta.value=JSON.stringify(store,null,1);
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');flash('Tu navegador no permite descargar: copia el JSON del cuadro «Importar»');}
    catch(e2){copy(JSON.stringify(store,null,1));}
    ta.remove();
  }
}
let _imprimiendo=null;
function imprimir(){
  /* En papel no se puede desplegar nada: lo que esté plegado sencillamente NO SALE. Y eso no es
     cosmético — la compra se imprimía sin las 10 cosas «de rutina» (plegadas de fábrica) y la
     semana sin una sola comida, porque los siete días están cerrados por defecto. Así que antes de
     imprimir se abre todo, y al terminar se deja exactamente como estaba. */
  if(_imprimiendo)return;
  _imprimiendo={openDays:new Set(ui.openDays),compraCerradas:new Set(ui.compraCerradas),
    compraAbiertas:new Set(ui.compraAbiertas||[]),compraSalida:ui.compraSalida,
    tandaAbierta:ui.tandaAbierta,microAbierto:ui.microAbierto,detalles:[],soloMes:false,monSel:ui.monSel};
  /* imprimir el Mes es para colgarlo en la pared: sale la cuadrícula sola, a toda la hoja y por
     una cara. Los KPI, las vacaciones, la agenda y los botones no pintan nada ahí colgados. */
  if(ui.tab==='month'){_imprimiendo.soloMes=true;
    ui.monSel=null;   /* el panel del día abierto se colaba en medio del calendario */
    document.documentElement.classList.add('imp-mes');}
  try{ui.openDays=new Set(semanaVentana().map(function(d){return d.key||('tpl'+d.idx);}));}catch(e){}
  ui.compraCerradas=new Set();
  /* y la lista entera de las DOS salidas: si te la llevas en papel, la del súper y la de la
     frutería van en la misma hoja */
  ui.compraSalida='todo';
  /* al imprimir sale la lista ENTERA, pasillos terminados incluidos: el papel no se pliega */
  ui.compraAbiertas=new Set(['fresco:verdura','fresco:carne','fresco:pescado','fresco:lacteos',
    'fresco:pan','fresco:despensa','fresco:congelado','fresco:bebida','fresco:otros',
    'rutina:verdura','rutina:carne','rutina:pescado','rutina:lacteos','rutina:pan','rutina:despensa',
    'rutina:congelado','rutina:bebida','rutina:otros']);
  render();
  /* los <details> se abren sobre el DOM ya pintado: no dependen de `ui` */
  Array.prototype.forEach.call(document.querySelectorAll('#main details:not([open])'),function(d){
    _imprimiendo.detalles.push(d);d.open=true;});
  const restaurar=function(){
    const a=_imprimiendo;if(!a)return;_imprimiendo=null;
    a.detalles.forEach(function(d){if(d&&d.isConnected)d.open=false;});
    ui.openDays=a.openDays;ui.compraCerradas=a.compraCerradas;ui.compraAbiertas=a.compraAbiertas;
    ui.compraSalida=a.compraSalida;
    ui.tandaAbierta=a.tandaAbierta;ui.microAbierto=a.microAbierto;
    if(a.soloMes){document.documentElement.classList.remove('imp-mes');ui.monSel=a.monSel;}
    window.removeEventListener('afterprint',restaurar);
    render();};
  window.addEventListener('afterprint',restaurar);
  try{window.print();}catch(e){}
  /* Safari en iOS no siempre dispara «afterprint»: red de seguridad para no dejar la app abierta
     del todo para siempre */
  setTimeout(restaurar,4000);}
function dlTxt(txt,name,mime){
  try{const blob=new Blob([txt],{type:mime||'text/calendar;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),3000);flash('descargado: '+name);}
  catch(e){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();
    let hecho=false;try{hecho=document.execCommand('copy');}catch(e2){hecho=false;}
    ta.remove();
    flash(hecho?'tu navegador no descarga ficheros: el .ics está copiado, pégalo donde haga falta'
      :'no he podido descargar: usa «copiar el .ics» y pégalo en Google');}}
function purgeDish(did){
  store.meals.forEach(m=>{m.items=(m.items||[]).filter(i=>i.id!==did);});
  Object.keys(store.menu).forEach(k=>store.menu[k].forEach(s=>{if(s.items)s.items=s.items.filter(i=>i.id!==did);}));
}
function autofill(){
  const find=re=>store.shifts.find(x=>re.test(x.name)||re.test(x.desc||''));
  const codeOf=(re,fb)=>{const x=find(re);return x?x.code:fb;};
  const g=codeOf(/guardia|24 ?h|cuarto|pleno|servicio/i,'G');
  const sa=codeOf(/saliente|salida|posterior|entrega/i,'S');
  const fu=codeOf(/fuerza|entrena|gimnasio|volumen|peso/i,'F');
  const li=codeOf(/libre|descanso|asuntos|franco|vacante/i,'L');
  const rest=[g,sa,fu,li];
  const fill=base=>{const out=base.slice();rest.forEach(c=>{for(let i=0;i<7;i++){if(!out[i])out[i]=c;}});
    for(let i=0;i<7;i++){if(!out[i])out[i]=li||g||out.filter(Boolean)[0]||'';}return out;};
  const postG=sa||li;
  const mk=(name,days,note)=>({id:uid('pat'),name:name,days:fill(days),note:note});
  const fromDates=nG=>{
    if(!store.rotation||store.rotation.mode!=='date'||!store.rotation.anchorSet||!store.rotation.anchor)return null;
    const a=parseDate(store.rotation.anchor);if(!a)return null;
    const start=mondayOf(a);const days=[];let gs=0;
    for(let i=0;i<7;i++){
      const sh=shiftForDate(addDays(start,i));let c=null;
      if(sh&&sh.shiftId){const s2=shiftById(sh.shiftId);
        if(s2){if(isGuardia(s2)){if(gs<nG)c=s2.code;gs++;}else c=s2.code;}}
      days.push(c||'');}
    for(let i=0;i<6;i++){if(days[i]===g&&!days[i+1]&&postG)days[i+1]=postG;}
    return mk(nG+' guardia'+(nG>1?'s':'')+' · de mi calendario',days,'Leída de la rotación por fecha: el día siguiente a cada guardia se deja como saliente.');
  };
  const tpl=[
    {name:'1 guardia · repartida',days:[g,li,fu,li,sa,li,li],note:'Una sola guardia y el saliente unos días después.'},
    {name:'1 guardia · saliente al día siguiente',days:[g,sa,li,fu,li,li,li],note:'Guardia el lunes y salida el martes.'},
    {name:'2 guardias · alternas',days:[g,li,g,sa,li,fu,li],note:'Dos guardias separadas por un día de respiro.'},
    {name:'2 guardias · G-S-G-S',days:[g,sa,g,sa,li,li,fu],note:'Guardias encadenadas con su saliente.'}
  ].map(x=>mk(x.name,x.days,x.note));
  const one=fromDates(1),two=fromDates(2);
  const out=[],seen={};
  [one,two].concat(tpl).forEach(x=>{if(!x||x.days.length!==7)return;const k=x.days.join('-')+'|'+x.name;
    if(seen[k])return;seen[k]=1;out.push(x);});
  store.patterns=out.length?out:tpl.map(x=>mk(x.name,x.days,x.note));
  store.rotation.pattern=0;store.rotation.shiftByDay={};store.rotation.daySet={};
  save();
  return 'Semanas tipo listas: '+store.patterns.map(p=>p.days.filter(c=>c===g).length+'G').join(' · ')+
    (one?' (2 leídas de tu calendario)':' (añade el lunes de referencia para leerlas de tu calendario)');
}

const SOFT=/guardia|24 ?h|servicio completo|saliente|salida|entrega|post ?-?guardia|fuerza|\bgym\b|gimnasio|peso|volumen|libre|asuntos|franco|vacante|turno|comida|cena|desayuno/i;
function dayClasses(extra){
  const base=[[/guardia|24 ?h|servicio completo/i,'G'],[/saliente|salida|entrega|post ?-?guardia/i,'S'],
             [/fuerza|\bgym\b|gimnasio|peso|volumen|entren/i,'F'],[/libre|asuntos|franco|vacante|descanso/i,'L']];
  const syn=(extra||[]).filter(function(e){return e&&e.name&&e.name.length>3&&!SOFT.test(e.name)&&e.code&&e.code.length===1;})
    .map(function(e){return [new RegExp(String(e.name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),e.code];});
  return base.concat(syn).concat([[/\bG\b/i,'G'],[/\bS\b/i,'S'],[/\bF\b/i,'F'],[/\bL\b/i,'L']]);
}
const DOW_TXT=[
  [/\bdomingos?\b/i,0],[/\blunes\b/i,1],[/\bmartes\b/i,2],[/\bmi[eé]rcoles\b/i,3],
  [/\bjueves\b/i,4],[/\bviernes\b/i,5],[/\bs[aá]bados?\b/i,6]];
function parseSemanales(txt){
  /* «Todos los martes tengo sesión en UMI de 8:00 a 8:30 y todos los jueves sesión general de 8:00
     a 8:30 en docencia»: eso no es un cuadrante, son eventos que se repiten cada semana. El usuario
     lo escribió en la caja de importar el planning y se topó con «no he encontrado días». */
  const t=String(txt||'');
  if(!/todos los|cada\s|todas las/i.test(t))return [];
  /* se parte por cada «todos los / cada» para no mezclar dos sesiones en una */
  const trozos=t.split(/(?=todos los|todas las|cada\s)/i).map(function(x){return x.trim();}).filter(Boolean);
  const out=[];
  trozos.forEach(function(tr){
    let dow=null;
    for(let i=0;i<DOW_TXT.length;i++)if(DOW_TXT[i][0].test(tr)){dow=DOW_TXT[i][1];break;}
    if(dow==null)return;
    const h=tr.match(/(\d{1,2})[:.](\d{2})\s*(?:a|-|–|hasta)\s*(\d{1,2})[:.](\d{2})/);
    const h1=tr.match(/(?:a las|de)\s*(\d{1,2})[:.](\d{2})/);
    const hora=h?(h[1].padStart(2,'0')+':'+h[2]):(h1?(h1[1].padStart(2,'0')+':'+h1[2]):'');
    const fin=h?(h[3].padStart(2,'0')+':'+h[4]):'';
    if(!hora)return;
    /* el título: lo que quede al quitar el «todos los martes», las horas y las muletillas */
    let tit=tr.replace(/todos los|todas las|cada\s/ig,'')
      .replace(DOW_TXT[dow][0],'')
      /* se lleva por delante el «de» que precede al horario: sin eso quedaba «Sesión en umi de» */
      .replace(/\b(?:de|desde)\s+(\d{1,2})[:.](\d{2})\s*(?:a|-|–|hasta)\s*(\d{1,2})[:.](\d{2})/ig,'')
      .replace(/(\d{1,2})[:.](\d{2})\s*(?:a|-|–|hasta)\s*(\d{1,2})[:.](\d{2})/g,'')
      .replace(/(?:a las|de)\s*\d{1,2}[:.]\d{2}/g,'')
      .replace(/\btengo\b|\bhay\b|\by\b\s*$/ig,'')
      .replace(/\s+de\s*$/i,'')
      .replace(/\s{2,}/g,' ').replace(/^[\s,.;:—-]+|[\s,.;:—-]+$/g,'').trim();
    if(!tit)tit='Sesión';
    out.push({dow:dow,hora:hora,fin:fin,titulo:tit.charAt(0).toUpperCase()+tit.slice(1)});});
  return out;}
function parsePlanning(txt,extra){
  const re=/(\d{1,2})\s*(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\b/ig;
  const hits=[];let m;
  while((m=re.exec(txt))){hits.push({d:parseInt(m[1],10),mon:MON.indexOf(m[2].slice(0,3).toLowerCase()),idx:m.index});}
  const chunks=[];
  for(let i=0;i<hits.length;i++){chunks.push(txt.slice(hits[i].idx,(i+1<hits.length)?hits[i+1].idx:txt.length));}
  const lines=(chunks.length?chunks:txt.split(/\n+/)).map(l=>String(l).split('\n')[0].trim()).filter(Boolean);
  const kw=dayClasses(extra);
  const codeOf=l=>{for(const [re2,c] of kw){if(re2.test(l))return c;}return null;};
  const tRe=/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})/;
  const weeks=[];const count={};const times={};const found=[];let skipped=0;let lineas=0;
  const at=function(n,c){const w=Math.floor(n/7),d=((n%7)+7)%7;
    while(weeks.length<=w)weeks.push(new Array(7).fill(''));weeks[w][d]=c;};
  const ord=h=>(h.mon+12)*31+h.d;
  const base=hits.length?ord(hits[0]):null;
  lines.forEach(function(l){
    lineas++;
    const c=codeOf(l);
    if(!c){skipped++;return;}
    const tm=l.match(tRe);
    const dm=l.match(/^\s*(\d{1,2})\s*(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*/i);
    let n;
    if(base==null)n=found.length;
    else if(dm)n=(MON.indexOf(dm[2].slice(0,3).toLowerCase())+12)*31+parseInt(dm[1],10)-base;
    else n=found.length?found[found.length-1]+1:0;
    found.push(n);at(n,c);count[c]=(count[c]||0)+1;
    if(tm){const t=[tm[1]+':'+tm[2],tm[3]+':'+tm[4]];if(!times[c])times[c]=t;}
  });
  if(!weeks.length)weeks.push(new Array(7).fill(''));
  const nW=Math.max(weeks.length,1);
  const dias=weeks.reduce(function(a,w){return a+w.filter(Boolean).length;},0);
  /* count nace vacío, así que sin días reconocidos el resumen salía con «undefined guardia(s)» y
     «media NaN» en pantalla. Se rellenan los cuatro a cero y la media se acota. */
  ['G','S','F','L'].forEach(function(k){if(typeof count[k]!=='number')count[k]=0;});
  return {weeks:weeks,semanales:parseSemanales(txt),count:count,times:times,dias:dias,lineas:lineas,skipped:skipped,
    gPerWeek:dias?Math.round(count.G/nW*10)/10:0,leidas:lineas,
    aviso:base==null?'no he visto fechas (tipo "3 ago"): agrupo de 7 en 7 según el orden del texto':''};
}

function applyParse(info,opt){
  opt=opt||{};
  const g=store;
  const codeName={G:'Guardia',S:'Saliente',F:'Día de fuerza',L:'Día libre',V:'Vacaciones'};
  const map={};
  let created=0,renamed=0,timed=0;const avisos=[];
  const esVac=function(x){return !!x&&/vacacion|festiv/i.test(String(x.name||''));};
  const letraLibre=function(evita){const used={};g.shifts.forEach(function(x){if(x!==evita)used[(x.code||'').toUpperCase()]=1;});
    const L='WXYZJKLMNPQRSTUVOIEAGFDBCH';for(let q=0;q<L.length;q++)if(!used[L[q]])return L[q];return 'X'+g.shifts.length;};
  (opt.codes||[]).forEach(function(p){if(!p||!p.from)return;
    const ex=g.shifts.find(function(sl){const nm=String(sl.name||'').toLowerCase();
      return sl.code===p.to||nm===String(p.to||'').toLowerCase()||nm===String(p.name||p.from).toLowerCase();});
    if(ex&&!esVac(ex)){if(!map[p.from]){map[p.from]=ex.code;renamed++;}else map[p.from]=ex.code;}
    else if(ex&&esVac(ex)&&/vacacion|festiv|permiso/i.test(String(p.name||'')+' '+String(p.from))){map[p.from]=ex.code;}
    else if(p.to&&p.to!=='G'&&p.to!=='S'&&p.to!=='F'&&p.to!=='L'&&g.shifts.length<8){
      if(ex&&esVac(ex)){const mov=letraLibre(ex);
        avisos.push('tus vacaciones pasan a la letra '+mov+' para dejar libre la '+p.to+' (se siguen marcando igual, por rangos)');ex.code=mov;}
      const n={id:uid('sh'),code:p.to,name:p.name||p.from,icon:'📌',start:'',end:'',intensity:'medio',desc:'Creado al importar tu planning',color:'#0ea5e9'};
      g.shifts.push(n);
      g.menu[n.id]=[{id:uid('sl'),time:'',label:'Desayuno',items:[]},
                    {id:uid('sl'),time:'',label:'Comida',items:[]},
                    {id:uid('sl'),time:'',label:'Cena',items:[]}];
      map[p.from]=p.to;created++;
    } else map[p.from]=p.to||'L';});
  ['G','S','F','L','V'].forEach(function(k){if(!map[k])map[k]=k;});
  function setShift(code,name,start,end){
    const s=g.shifts.find(function(x){return x.code===code;});if(!s)return;
    if(name)s.name=name;
    if(start&&end){s.start=start;s.end=end;s.desc=s.desc||'';timed++;}
  }
  setShift(map.G,null,info.times.G?info.times.G[0]:null,info.times.G?info.times.G[1]:null);
  setShift(map.S,null,info.times.S?info.times.S[0]:null,info.times.S?info.times.S[1]:null);
  setShift(map.F,null,info.times.F?info.times.F[0]:null,info.times.F?info.times.F[1]:null);
  setShift(map.L,null,'','');
  Object.keys(info.times||{}).forEach(function(k){if('GSFL'.indexOf(k)<0)setShift(map[k]||k,null,info.times[k][0],info.times[k][1]);});
  const patName={G:map.G,S:map.S,F:map.F,L:map.L};
  Object.keys(map).forEach(function(k){patName[k]=map[k];});
  const codeFor=function(c){if(!c)return '';if(patName[c])return patName[c];
    const k=Object.keys(map).filter(function(x){return map[x]===c;})[0];if(k)return c;
    return c.length===1?c:'';};
  const weeks=info.weeks.length?info.weeks:[['G','L','L','L','L','L','L']];
  g.patterns=weeks.slice(0,8).map(function(w,i){
    const days=w.slice(0,7).map(codeFor);
    for(let j=0;j<6;j++){                              // el día después de una guardia, si no venía, es el saliente
      if(days[j]===patName.G&&!days[j+1]){
        const next=w[j+1]?codeFor(w[j+1]):null;
        days[j+1]=next||(g.shifts.some(function(x){return x.code===patName.S;})?patName.S:patName.L);
      }
    }
    const huecos=days.filter(function(c){return !c;}).length;
    for(let j=0;j<7;j++)if(!days[j])days[j]=patName.L;  // lo que no venía se pone como día libre, ya lo tocarás
    while(days.length<7)days.push(patName.L);
    const gN=days.filter(function(c){return c===patName.G;}).length;
    return {id:uid('pat'),name:'Semana '+(i+1)+' · '+gN+' guardia'+(gN===1?'':'s'),days:days.slice(0,7),
            note:(huecos?'['+huecos+' día(s) sin dato → día libre] ':'')+'Importada de tu planning ('+w.slice(0,7).join(' ')+' → '+days.slice(0,7).join(' ')+')'};
  });
  g.rotation.pattern=0;g.rotation.mode='template';g.rotation.shiftByDay={};g.rotation.daySet={};

  save();render();
  return 'Aplicado: '+g.patterns.length+' semana(s) tipo · '+created+' turno(s) nuevo(s) · '+timed+' horario(s) actualizado(s).'
    +(avisos.length?' · '+avisos.join(' · '):'')+' Repasa «Turno y rotación» y «Comer → Menú».';
}
/* --- dieta pegada → sugerencias sobre el catálogo existente --- */
const ING_STOP=new Set(['g','kg','ml','l','litro','litros','cda','cdta','lata','latas','diente','dientes','rebanada','rebanadas','rodaja','rodajas','pieza','piezas','bote','botes','puñad','puñado','chorro','chorros','sal','aceite','de','oliva','virgen','extra','unidad','unidades','una','uno','el','la','los','las','al','gusto','y','o','con','sin','medio','media','natural','fresco','fresca','cocido','cocida','merienda']);
const STOP_FOOD=new Set(['agua','gas','sal','azucar','aceite','vinagre','pan','leche','miel','infusion','cafe','te','al','gusto','medio','media','natural','extra','virgen','oliva','con','sin','una','uno','el','la','los','las','de','del','y','o','u','en','para','por','unos','unas','primera','segundo','segunda','rac','racion','raciones','yd']);
const normWord=w=>String(w||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9.]/g,'');
const wordsOf=t=>String(t||'').split(/[^\p{L}\p{N}.]+/u).map(normWord).filter(w=>w.length>2&&!STOP_FOOD.has(w));
function dishKeywords(){
  const out=[];
  store.dishes.forEach(function(d){
    const name=new Set(wordsOf(d.name));
    const ing=new Set();
    (d.ingredients||[]).forEach(function(line){const p=parseIng(line);
      wordsOf(p.item).forEach(function(w){if(!name.has(w)&&!ING_STOP.has(w))ing.add(w);});});
    out.push({id:d.id,name:d.name,words:Array.from(name),also:Array.from(ing)});
  });
  return out;
}
function matchDish(line,kw){kw=kw||dishKeywords();
  const toks=wordsOf(line);if(!toks.length)return null;
  let best=null,score=0;
  kw.forEach(function(k){
    const name=new Set(k.words.map(normWord)),also=new Set((k.also||[]).map(normWord));
    let sc=0;const hit=new Set();
    toks.forEach(function(t){
      if(name.has(t)){sc+=t.length;hit.add(t);}
      else if(also.has(t))sc+=Math.min(t.length,3);
      else name.forEach(function(w){if(w.length>5&&(w.indexOf(t)===0||t.indexOf(w)===0))sc+=3;});
    });
    if(hit.size<2)sc-=3;
    if(sc>score){score=sc;best=k;}
  });
  return best&&score>=6?{id:best.id,name:best.name,score:score}:null;
}
function parseDietText(txt){
  const kw=dishKeywords();
  const dayRe=[[/guardia|24 ?h/i,'G'],[/saliente|salida|entrega/i,'S'],[/fuerza|entreno|gimnasio|volumen/i,'F'],
               [/libre|descanso|asuntos|franco|vacante/i,'L']];
  const reHead=/^(desayuno|comida|cena|merienda|snack|brunch|pre[ \-]?entreno|post[ \-]?entreno|media ma[nñ]ana|almuerzo)\b\s*[:.\-–]?\s*(.*)$/i;
  const slots=[];const heads=[];let cur=null;let curDay='';let n=0;
  String(txt||'').split(/\n+/).forEach(function(line){
    const l=String(line).trim().replace(/^[-•*]+\s*/,'').replace(/^\d{1,2}\s*[.)]?\s*/,'');
    if(!l||/^#/.test(l))return;
    n++;
    const dm=dayRe.filter(function(k){return k[0].test(l);});
    if(l.length<=24&&dm.length&&!reHead.test(l)){curDay=dm.length===1?dm[0][1]:curDay;heads.push(l);cur=null;return;}
    const hm=l.match(reHead);
    if(hm){cur={day:curDay,label:hm[1].charAt(0).toUpperCase()+hm[1].slice(1).toLowerCase(),items:[]};slots.push(cur);
      if(String(hm[2]||'').trim())pushFood(hm[2]);return;}
    if(!cur){cur={day:curDay,label:'Toma',items:[]};slots.push(cur);}
    pushFood(l);
  });
  function pushFood(t){
    String(t).split(/\s*(?:\+|,| y |;)\s*/i).forEach(function(seg){
      seg=String(seg).trim();if(seg.length<3)return;
      const m=matchDish(seg,kw);
      cur.items.push(m?{dishId:m.id,raw:seg,label:m.name}:{dishId:null,raw:seg,label:seg});});
  }
  return {slots:slots,lineas:n,heads:heads,dias:Array.from(new Set(slots.map(function(x){return x.day;}).filter(Boolean)))};
}
const hhmm=t=>{const m=/^(\d{1,2})[:.](\d{2})$/.exec(String(t||'').trim());if(!m)return null;
  const h=+m[1],mi=+m[2];if(h>23||mi>59)return null;
  return String(h).padStart(2,'0')+':'+String(mi).padStart(2,'0');};
const RKEY_RE=[
  ['wake',/(^|\s)(levantarme?|me levanto|despertador|despertar|madrugo|madrugar)\b/],
  ['breakfast',/(^|\s)desayun[oa]\b/],
  ['leave',/(^|\s)(salir de casa|salgo|me voy|salida|coger el bus|autob[uú]s|bus)\b/],
  ['arrive',/(^|\s)(llegar|llego|llegada|al destino|en destino|entrar en destino)\b/],
  ['sleep',/(^|\s)(acostarme?|me acuesto|a dormir|acostarse|me tumbo)\b/]];
const HOURISH=/(levant|acuest|desayun|dormir|tumbo|salgo|salir de casa|llegad|a las|autob[uú]s|\bbus\b|madrug)/i;
function normClock(t){
  /* «6 y media», «7 en punto», «a las 7» → 06:30, 07:00 (solo si la frase habla de horas) */
  const x=String(t||'');if(!HOURISH.test(x))return x;
  return x
   .replace(/\ba las (\d{1,2})\s+y\s+media\b/g,function(h0,h){return +h>12?h0:(h.length<2?'0'+h:h)+':30';})
   .replace(/\ba las (\d{1,2})\s+en punto\b/g,function(h0,h){return +h>12?h0:(h.length<2?'0'+h:h)+':00';})
   .replace(/\b(\d{1,2})\s+y\s+media\b/g,function(h0,h){return +h>12?h0:(h.length<2?'0'+h:h)+':30';})
   .replace(/\b(\d{1,2})\s+en punto\b/g,function(h0,h){return +h>12?h0:(h.length<2?'0'+h:h)+':00';})
   .replace(/\ba las (\d{1,2})(?![:.\d])(?=[^\d]|$)/g,function(h0,h){return +h>12?h0:(h.length<2?'0'+h:h)+':00';});
}
const RKEY_LAB={wake:'levantarse',breakfast:'desayuno',leave:'salir de casa',arrive:'llegar',sleep:'acostarse'};
function nearestTime(re,text){
  /* hora «pegada» a la palabra clave: la primera que viene después, o «23 y media» / «sobre las 23» */
  const m=re.exec(text);if(!m)return null;
  const from=m.index+m[0].length,full=text.slice(from);
  const cut=full.search(/[,;)]/),tail=cut>=0?full.slice(0,cut):full;
  if(cut>=0&&tail.length<3)return null;
  const t=tail.match(/\d{1,2}[:.]\d{2}/);
  if(t){const h=hhmm(t[0]);if(h)return h;}
  const b=tail.match(/\s*(y\s+media|y\s+cuarto|y\s+media\s+hora)?/);
  const n=tail.match(/(\d{1,2})(\s+y\s+media)?/);
  if(n){const h=hhmm(('0'+n[1]).slice(-2)+':'+(n[2]?'30':'00'));if(h)return h;
    const e=hhmm(n[1]+':00');if(e)return e;}
  const su=tail.match(/(\d{1,2})\s*[:.]\s*(\d{2})(?!\d)/);
  if(su){const h=hhmm(su[1]+':'+su[2]);if(h)return h;}
  return null;}
function parseRhythmText(txt){
  /* se lee en plan suelto: «entre semana me levanto 6:45, salgo 7:30, trabajo de 8 a 15,
     me acuesto sobre las 23» y se traduce a horas por tipo de día */
  const days={},found={},labels={};let work=null,workdays=null,quickBf=false;
  String(txt||'').replace(/\r/g,'').split(/\n+/).forEach(function(raw){
    const line=normClock(String(raw||'').replace(/^[-•*\s]+/,'').trim());
    if(!line||line.length<4)return;
    let dk=null;
    [[/^entre semana\b|diari[oa]|de lunes a viernes|semana laboral|desayuno r[aá]pid/i,'G','entre semana'],
     [/guardia|24 ?h|servicio completo/i,'G','guardia'],
     [/saliente|post ?-?guardia|salida del servicio|bajada/i,'S','saliente'],
     [/fuerza|entreno|entrenar|gimnasio|peso/i,'F','fuerza'],
     [/libre|descanso|asuntos|franco|vacante|fin de semana|s[aá]bado|domingo/i,'L','libre']]
      .forEach(function(k){if(dk)return;if(k[0].test(line)){dk=k[1];labels[dk]=k[2];}});
    if(!dk)return;
    const o=days[dk]||(days[dk]={});
    RKEY_RE.forEach(function(pair){
      const h=nearestTime(pair[1],line);if(!h)return;
      if(!o[pair[0]])o[pair[0]]=h;
      found[pair[0]]=(found[pair[0]]||0)+1;});
    const w=line.match(/\btrabaj\w*\b|\bjornada\b|\bhorario laborable\b/i);
    if(w){
      const tail=line.slice(w.index+w[0].length);
      const t=tail.match(/(\d{1,2})(?::?(\d{2}))?\s*(?:-|a|de|→|>|,)\s*(\d{1,2})(?::?(\d{2}))?/i);
      if(t){const a=hhmm((t[2]?t[1]+':'+t[2]:t[1]+':00')),b=hhmm((t[4]?t[3]+':'+t[4]:t[3]+':00'));
        if(a&&b&&+b.slice(0,2)>=+a.slice(0,2)){if(!work)work=[a,b];found.work=(found.work||0)+1;}}
      const dw=line.match(/lunes\s*(?:a|al)\s*(viernes|s[aá]bado|domingo)/i);
      if(dw){const fin={'viernes':5,'sábado':6,'sabado':6,'domingo':0}[dw[1].toLowerCase()];
        if(fin!=null){workdays=[];for(let x=1;x<=fin;x++)workdays.push(x);found.workdays=1}}}
    if(/whey|leche de prote|fruta y (nuez|nuec)|sin complicar|sin platos preparados/i.test(line)){
      o.quickBf=true;quickBf=true;found.quickBf=(found.quickBf||0)+1;}
    const s2=line.match(/\bsalgo?\b|\bsalir de casa\b|\bducha\b|\bautob[uú]s\b|\bbus\b|\bcoger\b/i);
    if(s2)found.bus=(found.bus||0)+1;});
  return {days:days,work:work,workdays:workdays,found:found,labels:labels,quickBf:quickBf};}
function canon(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function svcAliasList(){
  /* tus servicios, con los apodos con los que suelen escribirse: así «cardio» vale y «urgencias» no se pierde */
  const base=((store.rotation&&store.rotation.servicios&&store.rotation.servicios.length)?store.rotation.servicios.slice():
    ['Rayos','Cardiología','Medicina Interna','Infecciosas','Neumología','UCRI','Neurología']);
  const alias={rx:'Rayos',rayos:'Rayos',radiodiagnostico:'Rayos',radiologia:'Rayos',
    cardio:'Cardiología',cardiologia:'Cardiología',urgenciascardiacas:'Cardiología',
    interna:'Medicina Interna',medicinainterna:'Medicina Interna',
    infecciosas:'Infecciosas',inflamatorios:'Infecciosas',
    neuro:'Neumología',neumologia:'Neumología',respiratorio:'Neumología',
    ucri:'UCRI',criticos:'UCRI',intensivos:'UCRI',
    neurologia:'Neurología',neuro:'Neurología',ictus:'Neurología',
    urg:'urg',urgencias:'urg',umi:'umi'};
  const out=base.map(function(nm){return [canon(nm),nm];});
  Object.keys(alias).forEach(function(k){
    const diana=canon(alias[k]);
    const enBase=base.filter(function(x){return canon(x).replace(/ /g,'')===diana.replace(/ /g,'');})[0];
    if(enBase||/^(urg|umi|urgencias)$/.test(k))out.push([k,enBase||alias[k]]);});
  out.sort(function(a,b){return b[0].length-a[0].length;});
  return out;}
function matchSvcIn(seg,alOpt){
  const cn=' '+canon(seg)+' ',AL=alOpt||svcAliasList();
  for(let k=0;k<AL.length;k++){if(cn.indexOf(' '+AL[k][0]+' ')>=0)return AL[k][1];}
  return null;}
function guardiasEn(seg){
  /* «6 guardias», «4+2», «4 y 2» o el número suelto que va detrás del servicio; los años no cuentan */
  const t=String(seg||'').replace(/(?:19|20)\d{2}[-/.]\d{1,2}/g,' ').replace(/\b(?:19|20)\d{2}\b/g,' ');
  const g=/(\d{1,2})\s*(?:guardias?|turnos?|d[ií]as?)/i.exec(t);if(g)return +g[1];
  const p=/(\d{1,2})\s*(?:\+|y)\s*(\d{1,2})/.exec(t);if(p)return (+p[1])+(+p[2]);
  const s=/(?:^|\D)(\d{1,2})(?:\D|$)/.exec(canon(t).replace(/^(?:[a-z]+ ?){0,3}/,''));
  return s?+s[1]:null;}
function parseServicesText(txt){
  /* «septiembre: Rayos (4+2) · octubre y noviembre: Cardiología 6 guardias» → servicio y cupo de cada mes */
  const names=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const fullRe='enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';
  const nameRe=new RegExp('(^|[^a-záéíóúñ])((?:'+fullRe+'|'+names.join('|')+')(?:[a-z]{0,4}))(?![a-z])','ig');
  const ymRe=/((?:19|20)\d{2})[-/.](0?[1-9]|1[0-2])(?![\d])/g;
  const AL=svcAliasList();   /* se calcula una vez para todo el texto, no por cada mes que aparezca en él */
  const months=[];let m;
  String(txt||'').replace(/\r/g,'').split(/\n+/).forEach(function(raw){
    const line=String(raw||'').replace(/^[-•*\s]+/,'').trim();
    if(!line)return;
    const marks=[];
    while((m=nameRe.exec(line))){const w=m[2].toLowerCase();
      if(/^se[pm]/.test(w)&&w.length>3&&!/^sep/.test(w)&&!/^set/.test(w))continue;
      const k=names.indexOf(w.slice(0,3));
      if(k>=0)marks.push({at:m.index+m[1].length,to:m.index+m[0].length,mon:k});}
    while((m=ymRe.exec(line))){const y=+m[1],mo=+m[2]-1;
      if(mo>=0&&mo<12)marks.push({at:m.index,to:m.index+m[0].length,mon:mo,year:y});}
    if(!marks.length)return;
    marks.sort(function(a,b){return a.at-b.at;});
    for(let i=0;i<marks.length;i++){
      const fin=(i+1<marks.length)?marks[i+1].at:line.length;
      const found=matchSvcIn(line.slice(marks[i].at,fin),AL)||
        /* «enero y febrero: Rayos» → el servicio va escrito al final de la línea */
        (marks.length>1?matchSvcIn(line.slice(marks[i].at),AL):null);
      if(!found){continue;}
      let g=guardiasEn(line.slice(marks[i].at,fin));if(g==null&&marks.length>1)g=guardiasEn(line.slice(marks[i].at));
      const mons=[marks[i].mon];
      for(let k=i+1;k<marks.length;k++){
        const sep=line.slice(marks[k-1].to,marks[k].at);
        if(!/^\s*(?:,|;|y|o|&|\+|-|a|hasta|al)?\s*$/i.test(sep))break;
        const finK=(k+1<marks.length)?marks[k+1].at:line.length;
        const f2=matchSvcIn(line.slice(marks[k].at,finK),AL);
        if(f2&&f2!==found)break;                    /* ese mes anuncia su propio servicio */
        mons.push(marks[k].mon);}
      months.push({months:mons,service:found,guardias:(g!=null?g:null),year:(marks[i].year||null),
        label:found+(g!=null?' ('+g+' guardias)':'')});
      i+=mons.length-1;}});
  return {months:months,count:months.reduce(function(a,x){return a+x.months.length;},0)};}
function parseVacacionesText(txt){
  /* «vacaciones del 24/08 al 2/09», «del 1 al 15 de octubre: vacaciones», «vacaciones: 3-17 oct» */
  const MON2={ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11};
  const out=[];
  String(txt||'').replace(/\r/g,'').split(/\n+/).forEach(function(raw){
    const line=String(raw||'').replace(/^[-•*\s]+/,'').trim();
    if(!line||!/vacacion|festiv|permiso|asuntos propios de una semana/i.test(line))return;
    const ym=function(str){const m=/(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?/.exec(str)||/(\d{1,2})\s*(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*(?:\s+(\d{2,4}))?/i.exec(str);
      if(!m)return null;
      const mo=m[2]!=null&&/^\d+$/.test(m[2])?(+m[2]-1):(MON2[String(m[2]||'').slice(0,3).toLowerCase()]);
      const y=m[3]?(+m[3]<100?2000+ +m[3]:+m[3]):null;const d=+m[1];
      if(mo==null||mo<0||mo>11||!d)return null;return {d:d,mo:mo,y:y};};
    const nums=line.match(/\d{1,2}[\/.]\d{1,2}(?:[\/.]\d{2,4})?[^\d]{0,12}(?:al?|-|a|hasta)\s*\d{1,2}[\/.]\d{1,2}(?:[\/.]\d{2,4})?/i);
    const solo=line.match(/\b(\d{1,2})\s*(?:al?|-)\s*(\d{1,2})\s+(?:de\s+)?(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*/i);
    let a=null,b=null;
    if(nums){const p=nums[0].split(/(?:al?|-|a|hasta)\s*/i);a=ym(p[0]);b=ym(p[1]);
      if(a&&!a.y&&b&&b.y)a.y=b.y;if(b&&!b.y&&a&&a.y)b.y=a.y;}
    else if(solo){const mo=MON2[solo[3].slice(0,3).toLowerCase()];const ym2=line.match(/(?:19|20)(\d{2})\b/);
      const y=ym2?+ym2[0]:null;
      a={d:+solo[1],mo:mo,y:y};b={d:+solo[2],mo:mo,y:y};}
    if(!a||!b||a.mo==null||b.mo==null)return;
    const y=(a.y||b.y||new Date().getFullYear());
    const iso2=function(o){return y+'-'+String(o.mo+1).padStart(2,'0')+'-'+String(o.d).padStart(2,'0');};
    const lab=String(line.replace(/[^\p{L}\p{N} ]/gu,' ').split(/vacacion|festiv|permiso/ig)[0]||'').trim().slice(0,40);
    out.push({start:iso2(a),end:iso2(b),label:lab});});
  return {ranges:out.length?out:[],count:out.length};}
function applyRhythm(info,opt){
  /* escribe en el planning lo que se ha leído: horas por tipo de día, jornada y servicio del mes.
     el "dry run" (Analizar, antes de Aplicar) necesita un borrador aislado para no tocar el store real
     hasta confirmar — pero solo hace falta clonar de verdad lo que esta función escribe (rhythm/rotation/
     menu); food.log y gym.registro, que son lo grande del store tras años de uso, se quedan compartidos
     porque nunca se escriben aquí. Antes se clonaba el store entero por esto. */
  opt=opt||{};
  const g=Object.assign({},store,{
    rhythm:JSON.parse(JSON.stringify(store.rhythm||{})),
    rotation:JSON.parse(JSON.stringify(store.rotation||{})),
    menu:JSON.parse(JSON.stringify(store.menu||{}))});
  let rh=0,wrk=0,sv=0,quick=0,vac=0;
  const R=(info&&info.rhythm)||{days:{},work:null};
  const put=function(shiftId,key,val){if(!val||!shiftId)return;
    if(!g.rhythm)g.rhythm={};const o=g.rhythm[shiftId]||(g.rhythm[shiftId]={});o[key]=val;rh++;};
  const byCode=c=>g.shifts.find(function(s){return (s.code||'').toUpperCase()===c;});
  ['G','S','F','L'].forEach(function(c){
    const d=R.days[c];if(!d)return;const sh=byCode(c);if(!sh)return;
    ['wake','breakfast','leave','arrive','sleep'].forEach(function(k){put(sh.id,k,d[k]);});});
  if(R.days.G){/* «entre semana» también describe el día de trabajo y el de fuerza: se los prestas
                  (y el sleep del T no se toca, que ahí manda la cuenta de las 8 horas) */
    ['F','T'].forEach(function(c){const sh=byCode(c);if(!sh)return;
      ['wake','leave','arrive'].forEach(function(k){if(!R.days[c]||!R.days[c][k])put(sh.id,k,R.days.G[k]);});});}
  if(R.work){/* la jornada es la base del mes: vive en rotación, no dentro de cada turno */
    const j=g.rotation.jornada||(g.rotation.jornada={start:'',end:'',workdays:[1,2,3,4,5]});
    let toc=0;
    if(!j.start){j.start=R.work[0];toc++;}else if(j.start!==R.work[0]&&R.forceJornada){j.start=R.work[0];toc++;}
    if(!j.end){j.end=R.work[1]||'';toc++;}else if(R.forceJornada&&R.work[1]&&j.end!==R.work[1]){j.end=R.work[1];toc++;}
    if(R.workdays&&R.workdays.length){j.workdays=R.workdays.slice(0);toc++;}
    if(toc)wrk++;}
  if(info&&info.services&&info.services.length){
    if(!g.rotation.month)g.rotation.month={};
    if(!Array.isArray(g.rotation.servicios))g.rotation.servicios=[];
    info.services.forEach(function(x){const y=x.year||opt.year||new Date().getFullYear();
      if(x.service&&g.rotation.servicios.indexOf(x.service)<0&&!/^(urg|umi|urgencias)$/.test(x.service))
        g.rotation.servicios.push(x.service);
      x.months.forEach(function(mo){const key=y+'-'+String(mo+1).padStart(2,'0');
        const cur=g.rotation.month[key]||{service:'',guardias:g.rotation.guardiasMes};
        g.rotation.month[key]={service:x.service||cur.service,
          guardias:(x.guardias!=null?+x.guardias:(cur.guardias!=null?cur.guardias:g.rotation.guardiasMes))};sv++;});});}
  if(R.quickBf){/* desayuno de diario sin platos preparados, en los días que madrugar */
    g.shifts.forEach(function(sh){
      if(/saliente|post ?-?guardia/i.test(sh.name||''))return;
      const rh=g.rhythm&&g.rhythm[sh.id];
      if(!(rh&&rh.wake)&&!/guardia|fuerza/i.test(sh.name||''))return;
      if(!(store.meals||[]).some(function(x){return x.id==='m-desc-diario';}))return;
      const menu=g.menu[sh.id]||(g.menu[sh.id]=[]);
      if(menu.some(function(sl){return sl.mealId==='m-desc-diario';}))return;
      const sl=menu.filter(function(x){return /desayun/i.test(x.label||'');})[0]||
        menu.filter(function(x){return !x.mealId&&!(x.items||[]).length;})[0];
      if(sl){sl.mealId='m-desc-diario';sl.items=[];if(!sl.time)sl.time=(rh&&rh.breakfast)||'';}
      else menu.unshift({id:uid('sl'),time:(rh&&rh.breakfast)||'',label:'Desayuno',mealId:'m-desc-diario',items:[]});
      quick++;});}
  if(info&&info.vacaciones&&info.vacaciones.length){/* rangos de vacaciones leídos del texto */
    if(!g.rotation.vacaciones)g.rotation.vacaciones=[];
    info.vacaciones.forEach(function(v){if(v&&v.start&&v.end){g.rotation.vacaciones.push({start:v.start,end:v.end,label:v.label||''});vac++;}});}
  if(opt.dryRun)return {rh:rh,work:wrk,sv:sv,quick:quick,vac:vac};
  store=g;normalize(store);save();render();
  return 'Horas aplicadas: '+rh+' campo(s) de horario'+(wrk?(' · jornada base del mes '+(g.rotation.jornada.start||'—')+'–'+(g.rotation.jornada.end||'—')):'')+
    (sv?(' · '+sv+' mes(es) con servicio y cupo'):'')+
    (quick?(' · desayuno rápido montado en '+quick+' tipo(s) de día'):'')+
    (vac?(' · '+vac+' rango(s) de vacaciones'):'')+
    ' · revisa «Turno y rotación» y «Mes».';}
function toText(){
  const days=weekDays();
  const j=store.rotation.jornada||{};
  const vs=(store.rotation.vacaciones||[]);
  var out0='';
  if(j.start&&j.end){const nom=(j.workdays||[]).length===5&&(j.workdays||[]).join(',')==='1,2,3,4,5'?'de lunes a viernes':    ('los días '+((j.workdays||[]).map(function(x){return ['dom','lun','mar','mié','jue','vie','sáb'][x];}).join(', ')||'—'));
    out0='Jornada: '+j.start+'–'+j.end+' '+nom+' (no cuenta en salientes, vacaciones ni lo que marques a mano)\n';}
  const ob=(store.food&&store.food.objetivo)?store.food.objetivo.kcal:0;
  const vacTxt=vs.length?vs.map(function(v){const a=parseDate(v.start),b=parseDate(v.end);
    return a&&b?(a.getDate()+' '+MON[a.getMonth()]+'–'+b.getDate()+' '+MON[b.getMonth()]+(v.label?' ('+v.label+')':'')):'';}).filter(Boolean).join(' · '):'';
  let out=((typeof out0!=='undefined'&&out0)?out0:'')+`SEMANA ${store.rotation.mode==='date'?iso(weekDate)+' – '+iso(addDays(weekDate,6)):'plantilla: '+(store.patterns[store.rotation.pattern]?store.patterns[store.rotation.pattern].name:'')}\n`;
  if(vacTxt)out+='Vacaciones: '+vacTxt+'\n';
  days.forEach(d=>{const sh=shiftById(d.shiftId);if(!sh){out+=`${d.label} — libre sin asignar\n\n`;return;}
    const sl=d.key?sleepOf(d.key):{bed:'',wake:'',h:null};
    const jo=d.key?jornadaOf(d.key):jornadaEn((((d.idx||0)+1)%7),d.shiftId,false);
    const vac=d.key?vacationOf(d.key):null;
    const ho=sh.start?(sh.start+(sh.end?'-'+sh.end:'')+(jo&&sh.start!==jo.start?(' (jornada '+jo.start+'–'+jo.end+')'):'')):(jo?('trabajo '+jo.start+'–'+jo.end):'');
    out+=`\n${d.label}${d.date?' ('+d.date.getDate()+' '+MON[d.date.getMonth()]+')':''} — ${sh.icon} ${sh.name}${ho?' '+ho:''}${vac?' 🏖️':''}${sl.h!=null?' · 🛌'+sl.bed+'→'+sl.wake+' ('+fmtHM(sl.h*60)+')':''}\n`;
    slotsFor(sh.id).forEach(s=>{const inf=slotItems(sh.id,s),t=totals(inf.items);
      out+=`  ${((s.time||'')+'          ').slice(0,7)} ${(s.label||'')+(inf.name?'  [🍱 '+inf.name+']':'')}  →  ${inf.items.map(it=>{const dd=dishById(it.id);return dd?dd.name+(num(it.portions,1)>1?' ×'+fmt(it.portions):''):''}).filter(Boolean).join(' + ')}  · ${t.kcal} kcal / ${t.prot} g P\n`;});
    const fl=d.key?foodLog(d.key):[];
    if(fl.length){const ft=foodTotals(d.key);
      out+='  🍽 apuntado: '+ft.kcal+' kcal · '+ft.prot+' g P en '+fl.length+' toma'+(fl.length>1?'s':'')+
        (ob?' (de '+ob+' kcal)':'')+'\n';}
    const gs=d.key?resumenGym(d.key):'';if(gs)out+='  🏋️ '+gs+'\n';
    const gl=d.key?gymLine(d.key):'';if(gl)out+='  '+gl+'\n';});
  const semK=days.reduce(function(a,x){return a+(x.key?foodTotals(x.key).kcal:0);},0);
  out+='\n─── LO APUNTADO EN «COMIDA» ───\n'+
    (semK?('esta semana: '+semK+' kcal registradas'+(ob?(' · objetivo '+ob+' kcal al día'):'')+
      ' · media '+Math.round(semK/7)+' kcal/día\n')
     :'nada apuntado aún: escanea o añade tus tomas en la pestaña Comida\n');
  const pb=planBatches(days);
  out+='\n─── COCINA EN LOTE ───\n';
  Object.keys(pb).forEach(k=>{const b=pb[k];if(!b.hasNeed)return;
    out+=`${b.label}${b.when?' · '+b.when:''} → ${b.portions} raciones\n`;
    b.items.filter(i=>i.runs>0).forEach(i=>{out+=`   • ${i.dish.name}: ${i.needPort} raciones → ${i.runs} tanda(s)${i.cooked>i.needPort?' (sobran '+Math.round((i.cooked-i.needPort)*10)/10+' → congelador)':''}\n`;});});
  out+='\n─── REGLAS ───\n'+store.rules.map(r=>'· '+r).join('\n')+'\n';
  return out;
}

/* ===================== calendario: .ics para Google y leer el tuyo ===================== */
function icsFold(l){/* el RFC pide líneas cortas: se parten con un espacio delante */
  const out=[];let s=String(l);
  while(s.length>72){out.push(s.slice(0,72));s=' '+s.slice(72);}
  out.push(s);return out.join('\r\n');}
function icsEsc(t){return icsEscTxt(t).slice(0,200);}   /* el bloc de notas no perdona las líneas kilométricas */
function icsEscTxt(t){return String(t==null?'':t).replace(/\\/g,'\\\\').replace(/;/g,'\\;')
  .replace(/,/g,'\\,').replace(/\n/g,'\\n');}
function icsUnesc(s){return String(s==null?'':s).replace(/\\n/gi,' · ').replace(/\\([,;\\:])/g,'$1');}
function icsNum(k){return String(k||'').replace(/-/g,'');}
function icsStampUTC(){const d=new Date(),p=function(n){return String(n).padStart(2,'0');};
  return ''+d.getUTCFullYear()+p(d.getUTCMonth()+1)+p(d.getUTCDate())+'T'+
    p(d.getUTCHours())+p(d.getUTCMinutes())+p(d.getUTCSeconds())+'Z';}
function icsUID(txt){/* el UID nace del propio evento: al volver a descargar el mismo día Google lo actualiza en vez de duplicarlo */
  let h=2166136261;const s=String(txt||'');
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h*16777619)>>>0;}
  return 'pg-'+h.toString(36)+s.length.toString(36)+'@plan-guardias.local';}
function icsEscXml(t){return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;')
  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function calNombreTxt(desde){
  const n=String(store.rotation.calNombre||'').trim().replace(/\s+/g,' ');
  if(n)return n.slice(0,40);
  const d=parseDate(desde||calRango().desde)||new Date();
  return 'Guardias · '+(MONTH_FULL[d.getMonth()]||'')+' '+d.getFullYear();}
function calRangoUI(){
  /* el rango que hay en la pantalla, con el desde mandando sobre el hasta */
  const R=calRango();const d0=(ui.calDesde||'')||R.desde;let h0=(ui.calHasta||'')||R.hasta;
  if(h0<d0)h0=d0;return {desde:d0,hasta:h0};}
function calFileTxt(desde,hasta){return 'guardias-'+(desde||'sin-fecha')+'--'+(hasta||'sin-fecha')+'.ics';}
function calUrlBloque(archivo,nombre){
  /* el bloque que Google espera cuando se sincroniza por URL; no hay interfaz para esto, por eso va en texto */
  const url=String((document.getElementById('icsUrl')||{}).value||'').trim();
  const L=['<?xml version="1.0" encoding="UTF-8"?>','<icalendar xmlns="http://www.google.com/calendar/v3/icalendar">',
    '<request><name>'+icsEscXml(nombre)+'</name>'];
  if(/^https?:\/\//i.test(url))L.push('<href>'+icsEscXml(url)+'</href>');
  else L.push('<!-- aquí la URL pública a la que subas ESTE fichero (carpeta sincronizada, repositorio, tu servidor…)',
    '     p. ej. https://dl.dropboxusercontent.com/s/…/'+icsEscXml(archivo)+' -->');
  if(store.rotation.calAlarm!==false)L.push('<alarm><minutes>30</minutes><action>DISPLAY</action></alarm>');
  L.push('<color>#4A9172</color>','<timezone>Europe/Madrid</timezone>');
  L.push('<IMPORT>true</IMPORT>','<IMPORTABLE>yes</IMPORTABLE>');
  if(store.rotation.calOculto!==false)L.push('<IMPORT_TAG>'+icsEscXml(nombre)+'</IMPORT_TAG>');
  L.push('</request>','</icalendar>');
  return L.join('\n');}
function calNotas(){
  const li=function(n,t){return '<div class="row wrap" style="gap:8px;align-items:flex-start;margin-top:7px">'+
    '<b class="mini" style="flex:0 0 auto;text-transform:none">'+n+'</b>'+
    '<span class="mini" style="flex:1 1 240px;text-transform:none">'+t+'</span></div>';};
  const hay=String(ui.calTxt||'').indexOf('BEGIN:VCALENDAR')>=0;
  if(!hay)return '<div style="border-top:1px dashed var(--line);margin-top:12px;padding-top:6px">'+
    li('1 ·','dale a <b>ver la lista</b> y aquí aparecerán los cuatro pasos con tu fichero ya nombrado, el bloque <code>calUrl</code> y su botón de copiar.')+
    li('Sin la URL','también vale bajar el <code>.ics</code> y abrirlo con Google Calendar (Ajustes → Importar y exportar → Importar).')+
    '</div>';
  const arch=ui.calFile||'guardias.ics',nom=calNombreTxt(ui.calDesde||calRango().desde);
  return '<div style="border-top:1px dashed var(--line);margin-top:12px;padding-top:6px">'+
    li('Paso 1 · Descarga el','<code>'+esc(arch)+'</code> (o copia el texto y guárdalo en un fichero con ese nombre en tu ordenador).')+
    li('Paso 2 · Sube','ese fichero a un sitio que Google pueda leer: una carpeta sincronizada con enlace público, un repositorio, tu servidor. Copia la URL directa del <code>.ics</code>.')+
    li('Paso 3 · En el ordenador','abre <b>Google Calendar → ⚙ Configuración</b> (la rueda) → <b>Importar y exportar</b>.')+
    li('Paso 4 ·','pega abajo el bloque <i>calUrl</i>, déjalo tal cual —con sus cuatro líneas, que son las que le dicen a Google que se quede sincronizado— y pulsa <b>IMPORTAR</b>.')+
    '<div class="row wrap" style="gap:8px;align-items:center;margin-top:8px">'+
      '<span class="mini">copia estas 4 líneas (en Google no hay interfaz para ellas):</span>'+
      '<span class="sp"></span><button class="btn s" data-a="cal-copiar-url">copiar el bloque</button></div>'+
    '<textarea id="calUrlTxt" rows="9" readonly style="width:100%;margin-top:6px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px">'+
      esc(calUrlBloque(arch,nom))+'</textarea>'+
    li('Y sin la URL','si solo quieres verlo en el móvil: baja el <code>.ics</code> y ábrelo con Google Calendar. No se sincroniza: es una foto del planning en la fecha en que lo descargaste.')+
    li('Ojo con los recordatorios y el color','al descargar, el navegador te abre el fichero: cópialo a la carpeta que sincronices (o vuelve a pulsar <b>descargar</b> desde la pestaña de Google: el navegador no deja escribir en ella).')+
    li('Este .ics no se auto-refresca','cada vez que cambie tu planning, vuelve a descargar e importar el mismo fichero con el mismo nombre: los <code>UID</code> estables y el <code>IMPORT_TAG</code> hacen que Google actualice los eventos en vez de duplicarlos. No hace falta borrar el calendario cada vez.')+
    li('Qué se manda a Google','cada cosa con su hora de inicio y fin: <b>guardias</b>, <b>trabajo</b> (tu jornada, con la rotación del mes), <b>entrenos</b> (la rutina que toca, a su hora, y el segundo entreno), tus <b>eventos</b> —también los de cada semana, como la sesión de la UMI de los martes y la general de los jueves— y un aviso de varios días con la <b>rotación</b> en la que estás. Nada de vacaciones, salientes ni días libres. Lo que tú ya tengas en Google queda igual.')+
    '</div>';}
function calRefresca(){
  /* si la lista está abierta, que siempre sea el fichero de verdad: ni nombre viejo ni rango viejo */
  if(!ui.calView)return;
  const rr=calRangoUI();
  ui.calTxt=icsTexto(rr.desde,rr.hasta,{import:calNombreTxt(rr.desde)});
  ui.calFile=calFileTxt(rr.desde,rr.hasta);}
function icsAnalizar(){
  /* se queda con la vista en memoria: la lista y el botón de marcar trabajan sobre lo mismo */
  const box=document.getElementById('icsBox');
  const txt=(box&&box.value?box.value:(ui.icsTxt||''));
  if(box&&!box.value&&txt)box.value=txt;
  ui.icsTxt=txt;
  const opt={desde:(document.getElementById('icsDesde')||{}).value||ui.icsDesde||'',
    hasta:(document.getElementById('icsHasta')||{}).value||ui.icsHasta||'',
    encima:!!ui.icsEncima};
  const pr=icsPlan(txt,opt);pr.txt=txt;ui.icsRango=opt;
  ui.icsPrev=pr;save();render();
  flash(pr.ok?('mira la lista y dale a «Marcar esos días»: '+pr.msg):(pr.msg||'nada reconocible'));}
function icsHM(t){const m=/^(\d{1,2}):(\d{2})$/.exec(String(t||'').trim());
  if(!m)return '08:00';
  const h=Math.min(23,Math.max(0,+m[1]));
  return (h<10?'0':'')+h+':'+m[2];}
function icsCompacta(t){return icsHM(t).replace(':','')+'00';}
function icsTimestamp(d){const p=function(n){return String(n).padStart(2,'0');};
  return ''+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'T'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds());}
function tzWallToLocal(y,mo,d,h,mi,s,tz){
  /* "las 8:00 en Europe/Madrid" -> el Date real que le corresponde, para leerlo luego en la hora de este navegador */
  try{
    const guess=Date.UTC(y,mo,d,h,mi,s||0);
    const dtf=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const p=dtf.formatToParts(new Date(guess)).reduce(function(a,x){a[x.type]=x.value;return a;},{});
    const comoUtc=Date.UTC(+p.year,+p.month-1,+p.day,(+p.hour)%24,+p.minute,+p.second);
    return new Date(guess-(comoUtc-guess));
  }catch(e){return null;}}
function icsFecha(v,tz){
  /* 20260911, 20260911T080000, 20260911T060000Z */
  const m=/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/.exec(String(v||'').trim());
  if(!m)return null;
  let hh=m[4]?String(Math.min(23,+m[4])).padStart(2,'0'):'',mi=+m[5]||0,key=m[1]+'-'+m[2]+'-'+m[3],tzOk=false;
  if(m[4]&&tz&&!m[7]){const loc=tzWallToLocal(+m[1],+m[2]-1,+m[3],+m[4],mi,+m[6]||0,tz);
    if(loc){key=iso(loc);hh=String(loc.getHours()).padStart(2,'0');mi=loc.getMinutes();tzOk=true;}}
  return {key:key,hm:hh?(hh+':'+(mi<10?'0'+mi:''+mi)):'',
    allDay:!m[4],utc:!!m[7],tzAplicada:tzOk};}   /* la Z es el grupo 7: con el 6 toda hora con segundos parecía UTC */
function calFinMes(d){const x=parseDate(d)||new Date();
  /* el día 0 del mes siguiente: así febrero de un bisiestro acaba en 29 y no revienta en 31 */
  return iso(new Date(x.getFullYear(),x.getMonth()+1,0,12));}
function calIniMes(d){const x=parseDate(d)||new Date();return iso(new Date(x.getFullYear(),x.getMonth(),1,12));}
function calRango(desdeStr){
  /* del mes que se está mirando a dos meses más; si traes un «desde», de ese mes al siguiente */
  const base=parseDate(desdeStr||'')||parseDate(iso(monthDate))||new Date();
  const ini=iso(new Date(base.getFullYear(),base.getMonth(),1,12));
  const hasta=calFinMes(iso(new Date(base.getFullYear(),base.getMonth()+1,1,12)));
  return {desde:ini,hasta:hasta};}
function calEventos(desde,hasta){
  /* a Google solo le mandamos tres cosas, y siempre con su hora de inicio y fin: guardias, trabajo
     y entrenos. Nada de vacaciones, salientes ni días libres — eso se queda solo en la app. */
  const out=[],i0=parseDate(desde),i1=parseDate(hasta);
  if(!i0||!i1)return out;
  for(let d=new Date(i0.getTime());d<=i1;d=addDays(d,1)){
    const k=iso(d),inf=dayInfo(k),sh=shiftById(inf.shiftId);
    if(inf.vac||!sh)continue;
    const nm=sh.name||'',st=icsHM(sh.start||''),en=sh.end?icsHM(sh.end):'',conHoras=!!sh.start;
    if(isGuardia(sh)){
      const tipo=inf.guard?gTipo(inf.guard).label:'sin tipo';
      /* al calendario va el rato entero que estás fuera de casa —desde que entras hasta que te
         relevan al día siguiente, con el pase incluido—, no un bloque fijo de 24 h desde las 8:00:
         una guardia de sábado no empieza a la misma hora que una de martes. */
      const g=guardiaHoras(k,inf.guard);
      const d0=g?mins(g.desde):null,d1=g?mins(g.sale):null;
      const dur=(d0!=null&&d1!=null)?((d1+1440)-d0):24*60;
      out.push({allDay:!g&&!conHoras,fecha:icsNum(k),isoKey:k,hora:g?icsHM(g.desde):st,horaFin:'',
        dur:dur,
        summ:'🩺 Guardia · '+tipo+(inf.guard?(' ['+inf.guard+']'):''),
        desc:'Guardia de '+tipo+(g?('. Entras a las '+g.desde+
          (g.desde!==g.guardia?(' (jornada hasta las '+g.guardia+')'):'')+
          ' y sales a las '+g.sale+' del día siguiente'+(g.pase?(', pase de guardia incluido'):'')+'.'):'.'),
        cat:'GUARDIA'});continue;}
    /* el entreno que toca ese día: la rutina puesta (o movida aquí) y, en un día de fuerza, sus
       horas propias. Va ANTES del filtro de libres: una rutina puesta en sábado también se manda. */
    const rtDia=rutinaDeFecha(k),esFuerza=/fuerza|entreno/i.test(nm);
    const jor=jornadaOf(k,inf);
    if(esFuerza||rtDia){
      /* las horas del entreno son las del propio tipo de día —«Día de fuerza» 6:30–8:00— siempre que
         no sean las mismas de la jornada; si no hay, la hora que pongas en Entreno, y si tampoco,
         el entreno va como aviso de todo el día (se sabe QUÉ día, no a qué hora) */
      const propias=sh.start&&!(jor&&jor.start===sh.start&&jor.end===sh.end);
      const hG=gymS().hora||'';
      const hIni=propias?st:(hG?icsHM(hG):''),hFin=propias?((en&&en>st)?en:''):'';
      const qu=rtDia?(' · '+rtDia.nombre):'';
      out.push({allDay:!hIni,fecha:icsNum(k),isoKey:k,hora:hIni,horaFin:hFin,dur:hFin?0:(+gymS().duracion||75),
        uid:icsUID('entreno|'+k),
        summ:'💪 Entreno'+qu,
        desc:(rtDia?('Rutina «'+rtDia.nombre+'»: '+rtDia.ejercicios.length+' ejercicios. '):'')+
          (hIni?'':'Sin hora puesta: ponla en Entreno o en las horas del «Día de fuerza».'),cat:'ENTRENO'});}
    if(/saliente|libre|vacacion|festiv/i.test(nm)&&!jor)continue;   /* fuera, a propósito: no se manda */
    /* la jornada: la de diario (8–15) si ese día la hay; si no, las horas del propio tipo de día —
       salvo en el de fuerza, cuyas horas propias son las del entreno y ya han salido arriba— */
    const trab=jor?{start:jor.start,end:jor.end}:((conHoras&&!esFuerza)?{start:sh.start,end:sh.end}:null);
    if(trab){
      const a=icsHM(trab.start),b=trab.end?icsHM(trab.end):'';
      const rot=monthService(+k.slice(0,4),+k.slice(5,7)-1).service;
      out.push({allDay:false,fecha:icsNum(k),isoKey:k,hora:a,horaFin:(b&&b>a)?b:'',dur:(b&&b>a)?0:7*60,
        uid:icsUID('trabajo|'+k),
        summ:'💼 Trabajo'+(rot?(' · '+rot):''),
        desc:'Jornada de '+a+(b?(' a '+b):'')+'.'+(rot?(' Rotación: '+rot+'.'):''),cat:'TRABAJO'});}
    const g2=diaSegundo(k,inf);
    if(g2.on)out.push({allDay:false,fecha:icsNum(k),isoKey:k,hora:icsHM(g2.hora||'15:30'),dur:60,
      summ:'🏊 '+(g2.tipo||'entreno'),desc:'Segundo entreno'+(g2.auto?' (regla de la semana)':' (puesto tú)')+'.',cat:'ENTRENO'});
  }
  /* Y lo que hay que ACORDARSE de hacer: los recibos que vencen, las tareas con día y los eventos
     que has apuntado. Una PWA estática no puede avisarte con el móvil bloqueado —para eso hace
     falta un servidor de push—, pero el calendario del teléfono sí: aquí salen como eventos de
     todo el día con su alarma, y de eso ya se encarga él aunque la app esté cerrada. */
  gastosFijos().forEach(function(g){
    /* se recorren los MESES del rango, no los días: si el rango empieza a mitad de mes, ese mes
       tiene que entrar igual */
    for(let m=new Date(i0.getFullYear(),i0.getMonth(),1);m<=i1;m=new Date(m.getFullYear(),m.getMonth()+1,1)){
      const y=m.getFullYear(),mo=m.getMonth();
      const k=fechaDeGasto(g,y,mo),dd=parseDate(k);
      if(!dd||dd<i0||dd>i1)continue;
      if(gastoPagado(g,y,mo))continue;
      out.push({allDay:true,fecha:icsNum(k),isoKey:k,uid:icsUID('gasto|'+g.id+'|'+k),
        summ:'💶 '+g.nombre+' · '+eur(g.importe),
        desc:'Gasto fijo del día '+g.dia+' de cada mes.',cat:'DINERO'});}});
  notasS().forEach(function(x){
    if(x.hecha||!x.fecha)return;
    const dd=parseDate(x.fecha);
    if(!dd||dd<i0||dd>i1)return;
    const t=String(x.txt||'').split('\n')[0].slice(0,60);
    out.push({allDay:true,fecha:icsNum(x.fecha),isoKey:x.fecha,uid:icsUID('nota|'+x.id),
      summ:'📝 '+t,desc:(x.proy?('Proyecto: '+x.proy+'. '):'')+'Apuntado en la libreta.',cat:'TAREA'});});
  /* los repasos que vencen dentro del rango: una línea por día, no una por tema, para no llenar
     el calendario de veinte citas idénticas */
  if(store.estudio&&estS().temas.length){
    const primero=iso(i0);
    for(let d=new Date(i0);d<=i1;d=addDays(d,1)){
      const k=iso(d);
      /* cada repaso avisa el día que vence, y no todos los días a partir de ahí. La excepción es
         el primer día del rango: ahí entran también los que ya se te pasaron, porque si no, un
         atrasado no aparecería NUNCA en el calendario — y es justo cuando hace falta el aviso. */
      const hoyMismo=estS().temas.filter(function(x){
        const p=estProxima(x.id);
        return p&&(p===k||(k===primero&&p<k));});
      if(!hoyMismo.length)continue;
      out.push({allDay:true,fecha:icsNum(k),isoKey:k,uid:icsUID('repaso|'+k),
        summ:'📚 repasar '+hoyMismo.length+' tema'+(hoyMismo.length===1?'':'s'),
        desc:hoyMismo.map(function(x){return x.nombre;}).slice(0,12).join(', '),cat:'ESTUDIO'});}}
  eventosS().forEach(function(ev){
    if(ev.on===false||ev.modo!=='fecha'||!ev.fecha)return;
    const dd=parseDate(ev.fecha);
    if(!dd||dd<i0||dd>i1)return;
    /* el rato de verdad: `horaFin` cuando acaba el mismo día, y `dur` para el que cruza la
       medianoche (ahí horaFin es menor que la hora de empezar y el escritor del VEVENT la
       descarta, pero con los minutos sabe pasar al día siguiente solo). Antes esto era `dur:60`
       fijo: una presentación de dos horas y media te reservaba una hora en el calendario. */
    const dur=evDura(ev);
    out.push({allDay:!ev.hora,fecha:icsNum(ev.fecha),isoKey:ev.fecha,hora:icsHM(ev.hora||''),
      horaFin:ev.fin||'',dur:dur||60,
      uid:icsUID('evento|'+ev.id),summ:'📌 '+String(ev.titulo||'Evento').slice(0,60),
      desc:'Evento apuntado en la app'+(dur?(' · dura '+evDuraTxt(ev)):'')+'.',cat:'EVENTO'});});
  /* los eventos que se repiten cada semana —la sesión de la UMI de los martes, la general de los
     jueves—, uno por día, cada uno con su UID para que al volver a importar se actualice. Los que
     van «solo los días que trabajas» no salen en vacaciones ni en libres. */
  for(let d=new Date(i0.getTime());d<=i1;d=addDays(d,1)){
    const k=iso(d);
    eventosDelDia(d.getDay()).forEach(function(ev){
      if(!eventoAplica(ev,k))return;
      const dur=evDura(ev);
      out.push({allDay:!ev.hora,fecha:icsNum(k),isoKey:k,hora:icsHM(ev.hora||''),
        horaFin:ev.fin||'',dur:dur||60,
        uid:icsUID('evsem|'+ev.id+'|'+k),summ:'📌 '+String(ev.titulo||'Evento').slice(0,60),
        desc:'Se repite '+diasCorta(ev.dow)+(ev.soloTrabajo?', los días que trabajas':'')+'.',cat:'EVENTO'});});}
  /* la rotación en la que estás: un aviso de varios días por cada tramo de mes con servicio puesto */
  for(let m=new Date(i0.getFullYear(),i0.getMonth(),1,12);m<=i1;m=new Date(m.getFullYear(),m.getMonth()+1,1,12)){
    const sv=monthService(m.getFullYear(),m.getMonth()).service;
    if(!sv)continue;
    const a=iso(m)<iso(i0)?iso(i0):iso(m);
    const finMes=calFinMes(iso(m)),b=finMes>iso(i1)?iso(i1):finMes;
    out.push({allDay:true,fecha:icsNum(a),isoKey:a,hastaIso:b,uid:icsUID('rotacion|'+iso(m).slice(0,7)),
      summ:'🔁 Rotación · '+sv,desc:'Rotas en '+sv+' en '+MONTH_FULL[m.getMonth()]+' de '+m.getFullYear()+'.',cat:'ROTACION'});}
  return out;}
function icsTexto(desde,hasta,opt){
  /* el .ics que Google entiende: cabecera de cuaderno, eventos con UID estable y su VALARM */
  opt=opt||{};
  const evs=calEventos(desde,hasta),stamp=icsStampUTC();
  /* la casilla «etiquetarlos» manda: sin ella no salen ni el IMPORT-FLAG ni el ENABLE */
  const etq=(opt.etiqueta===undefined)?(store.rotation.calOculto!==false):!!opt.etiqueta;
  const nomTxt=String(opt.import!==undefined&&opt.import!==''?opt.import:calNombreTxt(desde)).trim().slice(0,40);
  const nom=(etq&&nomTxt)?icsEscTxt(nomTxt):'';
  const cab=nomTxt||calNombreTxt(desde);
  const rango=icsEscTxt((desde||'')+' a '+(hasta||''));
  const tz=(Intl&&Intl.DateTimeFormat&&Intl.DateTimeFormat().resolvedOptions?
    (Intl.DateTimeFormat().resolvedOptions().timeZone||''):'');
  const L=['BEGIN:VCALENDAR','VERSION:2.0',
    'PRODID:-//plan-guardias//es//ES (usa icalendar solo para escribir el fichero)',
    'CALSCALE:GREGORIAN','METHOD:PUBLISH',
    'X-WR-CALNAME:'+icsEscTxt(cab+' · '+rango),
    'X-WR-CALDESC:'+icsEscTxt('planning de guardias escrito por la app (un solo fichero HTML)')];
  if(nom){L.push('X-CALENDAR-ENABLE:true');L.push('IMPORT-FLAG:'+nom);}
  if(tz)L.push('X-WR-TIMEZONE:'+icsEscTxt(tz));
  evs.forEach(function(e){
    const kISO=e.isoKey||String(e.fecha||'').slice(0,4)+'-'+String(e.fecha||'').slice(4,6)+'-'+String(e.fecha||'').slice(6,8);
    const cuerpo=[];
    if(e.allDay)cuerpo.push('DTSTART;VALUE=DATE:'+e.fecha,'DTEND;VALUE=DATE:'+icsNum(nextIso(e.hastaIso||kISO)),'TRANSP:TRANSPARENT');
    else{
      const hi=mins(icsHM(e.hora))||0;
      let fn=mins(e.horaFin||'');
      if(!(fn>hi))fn=hi+(e.dur||60);
      const cruza=fn>=1440;
      cuerpo.push('DTSTART:'+e.fecha+'T'+icsCompacta(hm(hi)),
        'DTEND:'+icsNum(cruza?nextIso(kISO):e.fecha)+'T'+icsCompacta(hm(fn)));}
    cuerpo.push('SUMMARY:'+icsEscTxt(e.summ),'DESCRIPTION:'+icsEscTxt(e.desc||''),
      'CATEGORIES:'+icsEscTxt(e.cat||'OTRO'),'STATUS:CONFIRMED','SEQUENCE:0');
    if(store.rotation.calAlarm!==false){
      const av=Math.max(0,+store.rotation.icsAvisoMin||30);
      cuerpo.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEscTxt(e.summ),
        'TRIGGER;VALUE=DURATION:-PT'+av+'M','END:VALARM');}
    const bloque=cuerpo.join('\r\n');
    L.push('BEGIN:VEVENT','UID:'+(e.uid||icsUID(e.fecha+'|'+(e.allDay?'D':'T')+kISO+'|'+(e.summ||''))));
    L.push('DTSTAMP:'+stamp);
    cuerpo.forEach(function(x){L.push(x);});
    L.push('END:VEVENT');});
  L.push('END:VCALENDAR');
  return L.map(icsFold).join('\r\n')+'\r\n';}
function icsPreviewHTML(p){
  /* lo que sale en «lo que va a hacer y lo que deja como está», en el orden en que se leyó */
  if(!p||!p.ok)return '<div id="calOut" class="mini" style="background:color-mix(in srgb,var(--card) 55%,var(--bg));'+
    'border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:8px;white-space:pre-wrap">'+
    esc((p&&p.msg)||'nada reconocible')+'</div>';
  const dia=function(k){const d=parseDate(k);return d?((GYM_DIAS[d.getDay()]||'')+' '):'';};
  const fila=function(o,aplica,why){
    return '<div class="row wrap" style="gap:8px;padding:5px 0;border-top:1px solid var(--line);align-items:center">'+
      '<span class="mini" style="flex:0 0 92px;font-family:ui-monospace,Menlo,Consolas,monospace">'+
        esc(dia(o.key)+o.key.slice(8,10)+'/'+o.key.slice(5,7))+'</span>'+
      '<span class="badge" style="flex:0 0 auto">'+esc(o.txt||'—')+'</span>'+
      '<span class="mini" style="flex:1 1 190px;text-transform:none">'+esc(o.titulo||'—')+
        (o.cuando?(' · '+esc(o.cuando)):'')+' · <i>ahora: '+esc(o.actual||'sin asignar')+'</i></span>'+
      '<span class="mini" style="flex:0 0 auto;color:'+(aplica?'var(--brand2)':'var(--bad)')+'">'+
        (aplica?'se pondrá':'se queda igual')+'</span>'+
      (why?('<span class="mini" style="flex:1 1 130px;text-transform:none">'+esc(why)+'</span>'):'')+
      '</div>';};
  const van=p.filas.filter(function(f){return !f.mantenido;}).length;
  const ver=p.filas.slice(0,40).map(function(f){
    return fila(f,!f.mantenido,(f.why||'')+(f.rec?' · evento repetido':''));}).join('');
  const oc=(p.ocultas||[]).slice(0,20).map(function(o){return fila(o,false,o.why||'');}).join('');
  const msjs=(p.avisos&&p.avisos.length)?('<div class="mini" style="margin-top:6px">⚠ '+p.avisos.map(esc).join(' · ')+'</div>'):'';
  return '<div id="calOut" style="background:color-mix(in srgb,var(--card) 55%,var(--bg));border:1px solid var(--line);'+
    'border-radius:10px;padding:10px;margin-top:8px">'+
    '<div class="row" style="align-items:center"><span class="sp"></span><b style="text-transform:uppercase;font-size:12px">'+
      esc(p.desde===p.hasta?('Tu calendario · '+p.desde):('Tu calendario · '+p.desde+' → '+p.hasta))+'</b>'+
      '<span class="sp"></span></div>'+
    '<div class="mini" style="text-transform:none">a continuación, lo que se ha entendido de lo que no · '+esc(p.msg||'')+'</div>'+
    '<div style="margin-top:6px">'+ver+oc+'</div>'+
    (p.filas.length>40?('<div class="mini" style="margin-top:4px">… y '+(p.filas.length-40)+' día(s) más que no se enseñan aquí</div>'):'')+
    msjs+
    '<div class="mini" style="margin-top:6px">'+van+' día(s) que se pondrán · '+
      ((p.filas.length-van)+(p.ocultas||[]).length)+' que se quedan igual · '+
      (p.leidos?('leídos de '+p.leidos+' evento(s) de Google'):'')+'</div>'+
    '</div>';}
function icsUnfold(t){/* el .ics pliega las líneas largas: se vuelve a pegar lo que sigue, conservando el espacio */
  return String(t||'').replace(/\r\n/g,'\n').replace(/\r/g,'\n').replace(/\n([ \t])/g,'$1');}
function parseIcs(txt){
  const src=icsUnfold(txt),ev=[],avisos=[],tzsFallidas=new Set();
  const re=/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;let m;
  while((m=re.exec(src))){
    const f={},cab=m[1].split('\n');
    cab.forEach(function(l){const i=l.indexOf(':');if(i<0)return;
      const pre=l.slice(0,i),k=pre.split(';')[0].trim().toUpperCase();
      const multi=/^(CATEGORIES|COMMENT|CONFERENCE|REQUEST-STATUS|X-)/i.test(k);
      if(!multi&&f[k]!==undefined)return;
      f[k]=l.slice(i+1).trim();
      if(/VALUE=DATE/i.test(pre))f.__allDay=1;
      const tzm=/;TZID=([^;:]+)/i.exec(pre);if(tzm)f[k+'_TZID']=tzm[1].replace(/^"|"$/g,'');});
    const ini=icsFecha(f.DTSTART,f.DTSTART_TZID);
    if(!ini){avisos.push('un evento sin fecha clara: me lo salto');continue;}
    if(ini.utc)avisos.push('viene en UTC (la Z final): la hora puede cuadrar una o dos horas fuera');
    if(f.DTSTART_TZID&&!ini.tzAplicada&&!tzsFallidas.has(f.DTSTART_TZID)){tzsFallidas.add(f.DTSTART_TZID);
      avisos.push('la zona horaria «'+f.DTSTART_TZID+'» no la reconoce este navegador: la hora se ha leído tal cual, puede que no cuadre');}
    const fin=icsFecha(f.DTEND||'',f.DTEND_TZID);
    let finKey=fin?fin.key:ini.key;
    /* en los eventos de todo el día el DTEND es el día siguiente (exclusivo): el último día que ocupa es el de antes */
    if(!ini.hm&&fin&&fin.key>ini.key)finKey=iso(addDays(parseDate(fin.key),-1));
    if(finKey<ini.key)finKey=ini.key;
    ev.push({key:ini.key,keyFin:finKey,allDay:ini.allDay||!!f.__allDay,
      start:ini.hm,end:fin?fin.hm:'',resumen:icsUnesc(f.SUMMARY||'(sin título)'),
      desc:icsUnesc(f.DESCRIPTION||''),lugar:icsUnesc(f.LOCATION||''),
      rrule:String(f.RRULE||'')});}
  if(!ev.length)return {ok:false,eventos:[],avisos:avisos,
    msg:'no he encontrado ni un VEVENT: en Google es Ajustes → Importar y exportar → Exportar calendario (.ics) y pegar el fichero entero'};
  return {ok:true,eventos:ev,avisos:avisos,msg:ev.length+' evento(s) leídos'};}
function icsDesdoblar(ev,desde,hasta){
  /* los recurrentes («cada lunes, consulta») se expanden solo dentro del rango mirado */
  const out=[],i0=parseDate(desde),i1=parseDate(hasta);
  if(!ev.rrule||!i0||!i1){out.push(ev);return out;}
  const mm=/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/.exec(ev.rrule);
  if(!mm||mm[1]==='YEARLY'){out.push(ev);return out;}
  const cnt=/COUNT=(\d+)/.exec(ev.rrule),lim=cnt?Math.min(400,+cnt[1]):400;
  const intervalo=(/INTERVAL=(\d+)/.exec(ev.rrule)||[0,1])[1]|0;
  const bd=/BYDAY=([A-Z0-9,]+)/.exec(ev.rrule);
  const mapa={MO:1,TU:2,WE:3,TH:4,FR:5,SA:6,SU:0};
  const dias=bd?String(bd[1]).split(',').map(function(x){return mapa[String(x).replace(/^[+-]?\d+/,'')];})
    .filter(function(x){return typeof x==='number';}):null;
  const base=parseDate(ev.key)||i0;
  let d=new Date(i0.getTime()),n=0;
  for(let c=0;d<=i1&&c<400;c++){
    const k=iso(d),semanas=Math.round((d-base)/864e5/7);
    let vale=false;
    if(mm[1]==='DAILY')vale=intervalo<=1||(Math.round((d-base)/864e5)%intervalo===0);
    else if(mm[1]==='WEEKLY')vale=dias?(dias.indexOf(d.getDay())>=0&&semanas%Math.max(1,intervalo)===0)
      :(d.getDay()===base.getDay()&&semanas%Math.max(1,intervalo)===0);
    else if(mm[1]==='MONTHLY')vale=d.getDate()===base.getDate();
    if(vale&&k>=ev.key)out.push({key:k,keyFin:k,allDay:ev.allDay,start:ev.start,end:ev.end,
      resumen:ev.resumen,desc:ev.desc,lugar:ev.lugar,rrule:'',recurrente:true});
    d=addDays(d,1);n++;if(n>1500)break;}
  return out;}
function icsClasificar(ev){
  const t=(ev.resumen+' '+ev.desc+' '+ev.lugar).toLowerCase();
  const ti=String(ev.resumen||'').toLowerCase();
  /* el título manda: «Saliente tras la guardia» menciona la guardia pero el día es de bajada */
  if(/^\W*(saliente|bajada|post ?guardia|descanso)/.test(ti))return {kind:'saliente',txt:'saliente'};
  if(/vacacion|festival|asuntos propios|permiso|vacances/.test(t))return {kind:'vac',txt:'vacaciones o permiso'};
  if(/\bumi\b|umi\b|umi\//.test(t)||/umi/.test(t)&&/guardia|24/.test(t))return {kind:'guardia',guard:'umi',txt:'guardia de UMI'};
  if(/urgenc|\burg\b/.test(t)||(/guardia/.test(t)&&!/umi/.test(t)&&/urg/.test(t)))return {kind:'guardia',guard:'urg',txt:'guardia de Urgencias'};
  if(/guardia|guarda 24|24 ?h|24horas|de guardia/.test(t))return {kind:'guardia',guard:'',txt:'guardia sin tipo'};
  if(/saliente|post.?guardia|despu[eé]s de guardia|descanso activo/.test(t))return {kind:'saliente',txt:'saliente'};
  if(/fuerza|gym|pesas|entrena|piscina|nataci/.test(t))return {kind:'fuerza',txt:'entreno'};
  if(/libre|franco|casa|descanso/.test(t))return {kind:'libre',txt:'día libre'};
  if(/consulta|planta|inter|query|residenc|tarde|ma[nñ]ana|jornada/.test(t))return {kind:'trabajo',txt:'jornada de 8 a 15'};
  return {kind:'',txt:''};}
function icsPlan(txt,opt){
  /* qué haría la app con ese .ics: lo enseña y no escribe nada */
  opt=opt||{};
  const r=parseIcs(txt);if(!r.ok)return r;
  const keys=r.eventos.map(function(e){return e.key;}),fins=r.eventos.map(function(e){return e.keyFin;});
  let desde=opt.desde||keys.sort()[0],hasta=opt.hasta||(fins.sort()[fins.length-1]);
  if(desde&&hasta&&hasta<desde){const x=desde;desde=hasta;hasta=x;}
  const filas=[],ocultas=[],vistas={},RANGO={guardia:5,saliente:4,vac:3,fuerza:2,libre:1,trabajo:0};
  const pinta=function(e,cl){
    const cur=dayInfo(e.key);
    const cuan=e.allDay?'todo el día':((e.start||'—')+(e.end?('–'+e.end):''));
    return {key:e.key,keyFin:e.keyFin,kind:cl.kind,guard:cl.guard||'',txt:cl.txt,
      titulo:e.resumen,actual:(shiftById(cur.shiftId)||{}).name||'sin asignar',
      curGuard:cur.guard||'',ov:!!cur.ov,cuando:cuan,rec:!!e.recurrente,mantenido:false,why:''};};
  r.eventos.forEach(function(e0){
    icsDesdoblar(e0,desde,hasta).forEach(function(e){
      /* el rango que elegiste manda: lo de fuera ni se lista ni se escribe */
      if(desde&&hasta&&(e.key>hasta||e.keyFin<desde))return;
      const cl=icsClasificar(e);
      if(!cl.kind){
        /* no es un día de tu planning: se enseña como «se queda igual», pero ni se toca */
        const kk='n'+e.key;if(!vistas[kk]){vistas[kk]=1;
          ocultas.push({key:e.key,txt:'',titulo:e.resumen,cuando:e.allDay?'todo el día':((e.start||'—')+(e.end?('–'+e.end):'')),
            actual:(shiftById(dayInfo(e.key).shiftId)||{}).name||'sin asignar',
            why:'no se parece a un día de tu turno'});}
        return;}
      const prev=vistas[e.key];
      if(prev!==undefined){
        /* un mismo día puede salir en dos eventos (la consulta recurrente y la guardia): manda el que más dice */
        const f=filas[prev];
        if(cl.kind==='vac'&&e.keyFin>f.keyFin)f.keyFin=e.keyFin;
        if(RANGO[cl.kind]>RANGO[f.kind])filas[prev]=pinta(e,cl);
        return;}
      vistas[e.key]=filas.length;filas.push(pinta(e,cl));
    });});
  /* el orden es el de lectura del calendario, no alfabético: lo que buscas es «¿la del día 11?, ahí está» */
  filas.forEach(function(f){
    if(f.kind==='trabajo'){f.mantenido=true;f.why='jornada normal: ya la cubre tu 8–15 de «Turno y rotación»';}
    else if(f.ov&&!opt.encima){f.mantenido=true;f.why='ya lo pusiste tú: se respeta (marca «pisar lo que yo puse a mano» para cambiarlo)';}
    if(opt.encima&&f.ov)f.why='lo que pusiste tú se pisa';});
  const cuenta={};filas.forEach(function(f){cuenta[f.txt]=(cuenta[f.txt]||0)+1;});
  const van=filas.filter(function(f){return !f.mantenido;}).length;
  return {ok:filas.length>0,desde:desde,hasta:hasta,filas:filas,ocultas:ocultas,cuenta:cuenta,avisos:r.avisos,
    leidos:r.eventos.length,van:van,
    msg:filas.length
      ?('he reconocido '+filas.length+' día(s) de '+r.eventos.length+' evento(s): '+
        Object.keys(cuenta).map(function(k){return cuenta[k]+' '+k;}).join(', ')+
        (ocultas.length?(' · '+ocultas.length+' evento(s) que no toco'):''))
      :'no hay nada que se parezca a un día de tu planning (¿los títulos están en otro idioma?)'};}
function icsAplicar(txt,opt){
  /* txt puede ser el .ics o la vista que ya se analizó (así el botón no vuelve a parsear 20 kB) */
  opt=opt||{};
  const p=(txt&&typeof txt==='object')?txt:icsPlan(txt,opt);
  if(!p||!p.ok)return {ok:false,escritos:0,sin:0,detalle:[],msg:(p&&p.msg)||'nada que aplicar'};
  const busca=function(re){return store.shifts.filter(function(s){return re.test(String(s.name||''));})[0];};
  const G=store.shifts.filter(isGuardia)[0],S1=busca(/saliente/i),F=busca(/fuerza|entreno/i),L=busca(/libre|franco|descanso|casa/i);
  let escritos=0,sin=0;const detalle=[];
  p.filas.forEach(function(f){
    if(f.mantenido&&!(opt.encima&&f.kind!=='trabajo')){sin++;
      detalle.push(f.key+' · '+(f.why||(f.ov?'ya lo pusiste tú':'no lo toco')));return;}
    if(f.kind==='vac'){
      if(f.keyFin&&f.keyFin>f.key){addVacation(f.key,f.keyFin,String(f.titulo||'').slice(0,28));escritos++;
        detalle.push(f.key+' → '+f.keyFin+' · vacaciones desde el calendario');return;}
      sin++;detalle.push(f.key+' · permiso de un día: márcalo en «Mes»');return;}
    if(f.kind==='trabajo'){sin++;detalle.push(f.key+' · jornada normal: ya la cubre tu 8–15 de «Turno y rotación»');return;}
    const id=f.kind==='guardia'?(G||{}).id:f.kind==='saliente'?(S1||{}).id:f.kind==='fuerza'?(F||{}).id:
      f.kind==='libre'?(L||{}).id:(L||F||{}).id||'';
    if(!id){sin++;detalle.push(f.key+' · no tengo ningún tipo de día para «'+f.txt+'»');return;}
    setDayOverride(f.key,id,(f.kind==='guardia'&&f.guard)?f.guard:'');
    escritos++;detalle.push(f.key+' · '+f.txt+(f.actual&&f.actual!=='sin asignar'?' (antes: '+f.actual+')':''));});
  save();render();
  const msg=escritos?('calendario aplicado: '+escritos+' día(s) escritos, '+sin+' sin tocar'+
      (p.desde&&p.hasta?(' · rango '+p.desde+' → '+p.hasta):''))
    :'no he escrito nada: o no reconocía el día o ya lo tenías puesto a mano (usa «encima» para pisarlo)';
  return {ok:escritos>0,escritos:escritos,sin:sin,detalle:detalle,desde:p.desde,hasta:p.hasta,msg:msg};}
/* ===================== eventos ===================== */
document.addEventListener('keydown',e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  const t=e.target,tag=t&&t.tagName;
  const escribiendo=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable);
  if(ui.drawerOpen){
    if(e.key==='Escape'){closeDrawer();return;}
    if(e.key==='Tab'){trapDrawerTab(e);return;}
    return;}
  if($('#overlay')&&$('#overlay').classList.contains('on')){
    if(e.key==='Escape'){cancelModal();return;}
    if(e.key==='Tab'){trapModalTab(e);return;}
    return;}
  if(escribiendo){if(e.key==='Escape'&&t.blur)t.blur();return;}
  const k=e.key||'';
  if(/^[1-9]$/.test(k)){const tb=TABS[+k-1];if(tb){ui.tab=tb[0];if(CAL_SET.has(tb[0]))ui.calMode=tb[0];render();
    const b=document.querySelector('#tabs button[data-t="'+tb[0]+'"]')||document.querySelector('#calModes button[data-t="'+tb[0]+'"]');
    if(b&&b.scrollIntoView)b.scrollIntoView({block:'nearest',inline:'center'});}return;}
  if(k==='ArrowRight'||k==='ArrowLeft'){const nav=$('#wkNav');if(nav&&nav.hidden)return;
    const b=document.querySelector('[data-a="'+(k==='ArrowRight'?'wk-next':'wk-prev')+'"]');
    if(b)b.click();return;}
  if(k==='t'||k==='T'){const b=document.querySelector('[data-a="theme"]');if(b)b.click();return;}
  if(k==='/'){const s2=document.getElementById(ui.tab==='gym'?'gymQ':(ui.tab==='food'?'fdQ':''));
    if(s2){e.preventDefault();s2.focus();s2.select();}}
  if((k==='Enter'||k===' ')&&t&&t.getAttribute&&t.getAttribute('role')==='button'&&t.dataset&&t.dataset.a){
    e.preventDefault();t.click();}
});
document.addEventListener('click',e=>{
  if(e.target.id==='overlay'){cancelModal();return;}
  if(e.target.id==='drawerScrim'){closeDrawer();return;}
  const el=e.target.closest('[data-a]');
  if(!el)return;
  const a=el.dataset.a;
  if(a==='m-save'){try{capMeal();if(modalSave)modalSave();closeModal();save();render();}
    catch(err){flash(err&&err.message?err.message:'Revisa los campos');}return;}
  if(a==='m-cancel'){cancelModal();return;}
  if(a==='confirm-yes'){const r=confirmResolve;confirmResolve=null;closeModal();if(r)r(true);return;}
  act(a,el);
});
let searchDebounce=null;
document.addEventListener('input',e=>{
  const el=e.target;const a=el.dataset&&el.dataset.a;if(!a||el.closest('#modal'))return;
  if(a==='cal-url-in'){ui.calUrl=el.value||'';return;}
  if(a==='ics-in'){ui.icsTxt=el.value||'';return;}
  if(a==='imp-txt'){ui.imp.txt=el.value||'';return;}
  if(a==='imp-url'){ui.imp.url=el.value||'';return;}
  if(a==='dish-q'){ui.dishQ=el.value||'';
    clearTimeout(searchDebounce);
    searchDebounce=setTimeout(function(){const f=document.activeElement&&document.activeElement.id;
      render();if(f){const nx=document.getElementById(f);if(nx){nx.focus();
        try{nx.setSelectionRange(nx.value.length,nx.value.length);}catch(e2){}}}},160);
    return;}
  if(a==='lector-f'){if(!store.lector)store.lector={proxy:''};
    store.lector.proxy=String(el.value||'').trim().slice(0,300);save();return;}   /* crudo mientras escribe */
  if(a==='nota-txt'){ui.notaNueva=el.value||'';return;}   /* sin render: desmontaría el campo */
  if(a==='nota-f'&&el.dataset.k==='txt'){setNota(el.dataset.id,'txt',el.value);return;}
  if(a==='usda-f'){if(!store.usda)store.usda={key:''};
    store.usda.key=String(el.value||'').trim().slice(0,120);save();return;}   /* sin re-render: desmontaría el campo */
  if(a==='imp-f'){
    const f=el.dataset.f;
    if(f==='destinoLote'||f==='destinoDia'){ui.imp[f]=el.value||'';return;}
    const r=ui.imp.receta;if(!r)return;
    if(f==='ingredients'||f==='steps')r[f]=String(el.value||'').split('\n').map(function(x){return x.trim();}).filter(Boolean);
    else if(f==='portions')r.portions=Math.max(1,Math.round(+el.value||1));
    else if(f==='kcal'||f==='prot')r[f]=Math.max(0,Math.round(+el.value||0));
    else r[f]=String(el.value||'').slice(0,70);
    return;}
  if(a==='alim-busca'||a==='nevera-busca'||a==='plato-busca'||a==='food-busca'){
    /* mismo patrón que la búsqueda de comida: se re-renderiza con retraso y se devuelve el foco al
       campo, porque render() reescribe #main entero y desmontaría el cursor a cada letra */
    ui[a==='alim-busca'?'alimQ':(a==='nevera-busca'?'neveraQ':(a==='food-busca'?'foodBusca':'platoQ'))]=el.value||'';
    clearTimeout(searchDebounce);
    searchDebounce=setTimeout(function(){const f=document.activeElement&&document.activeElement.id;
      render();if(f){const nx=document.getElementById(f);if(nx){nx.focus();
        try{nx.setSelectionRange(nx.value.length,nx.value.length);}catch(e2){}}}},160);
    return;}
  if(a==='dinero-f'){
    const g=dineroS().gastos.filter(function(x){return x.id===el.dataset.id;})[0];
    if(!g)return;
    const k=el.dataset.k;
    if(k==='importe')g.importe=numEuro(el.value);
    else if(k==='dia')g.dia=Math.max(1,Math.min(31,+el.value||1));
    else if(k==='cat')g.cat=el.value||'otros';
    else g.nombre=String(el.value||'').trim().slice(0,50)||'Gasto';
    save();render();
    return;}
  if(a==='food-q'||a==='gym-q'){
    const v=(el.value||'').trim();
    const campo=a==='food-q'?'foodQ':'gymQ';
    if(v===(ui[campo]||'').trim())return;
    ui[campo]=v;
    /* el listado a filtrar es corto, pero renderGym()/renderFood() recalculan de paso totales de
       toda tu historia (volumen semanal, PRs...): con la tecla a tumba abierta eso se nota, así que
       se agrupan las pulsaciones en vez de repintar entero en cada una */
    clearTimeout(searchDebounce);
    searchDebounce=setTimeout(function(){
      const foco=document.activeElement&&document.activeElement.id;
      render();
      if(foco){const nx=document.getElementById(foco);if(nx){nx.focus();try{nx.setSelectionRange(nx.value.length,nx.value.length);}catch(e2){}}}
    },140);
  }
});
document.addEventListener('change',e=>{
  const el=e.target;const a=el.dataset&&el.dataset.a;if(!a||el.closest('#modal'))return;
  switch(a){
    case 'fin-fotos':{const fs=el.files;if(fs&&fs.length)finLeer(fs);break;}
    case 'fin-fecha':{if(ui.fin&&/^\d{4}-\d{2}-\d{2}$/.test(el.value||''))ui.fin.fecha=el.value;render();break;}
    case 'fin-mes':{if(ui.fin&&ui.fin.res&&/^\d{4}-\d{2}$/.test(el.value||''))ui.fin.res.mes=el.value;render();break;}
    case 'fin-v':{const f=ui.fin;if(!f||!f.res)break;const k=el.dataset.k,v=num(String(el.value).replace(/\./g,'').replace(/[^\d,.-]/g,''),NaN);
      if(!(v>=0))break;
      let o=null;if(/^cat:/.test(k))o=f.res.cats[+k.slice(4)];else o=f.res[k];
      if(o){o.v=Math.round(v*100)/100;o.ok=true;}
      render();break;}
    case 'nom-dia':{nominaCfg().dia=Math.max(1,Math.min(28,Math.round(num(el.value,25))));save();render();break;}
    case 'nom-habiles':{nominaCfg().habiles=Math.max(0,Math.min(10,Math.round(num(el.value,2))));save();render();break;}
    /* los ajustes del ahorro son <input>: van en ESTE switch, el de change */
    case 'aho-ep':{const e2=ahorroS().epocas.filter(function(x){return x.id===el.dataset.id;})[0];if(!e2)break;
      const k=el.dataset.k;
      if(k==='nombre')e2.nombre=String(el.value||'').trim().slice(0,40)||'Época';
      else if(k==='desde'){if(/^\d{4}-\d{2}$/.test(el.value||''))e2.desde=el.value;}
      else if(k==='finde')e2.finde=num(el.value,0);
      else e2[k]=Math.max(0,num(el.value,0));
      save();render();break;}
    case 'aho-cobrado':{const c=ahorroS().cobrado,v=String(el.value||'').trim();
      if(!v)delete c[el.dataset.mk];else{const n=numEuro(v);if(n)c[el.dataset.mk]=n;}
      save();render();break;}
    case 'aho-vivir':{ahorroS().vivirMin=Math.max(0,num(el.value,0));save();render();break;}
    case 'aho-hu':{const h=ahorroS().huchas.filter(function(x){return x.id===el.dataset.id;})[0];if(!h)break;
      const k=el.dataset.k;
      if(k==='pct')h.pct=Math.max(0,Math.min(100,Math.round(num(el.value,0))));
      else if(k==='objetivo')h.objetivo=Math.max(0,num(el.value,0));
      else if(k==='color'){if(/^#[0-9a-fA-F]{6}$/.test(el.value))h.color=el.value;}
      else if(k==='ico')h.ico=String(el.value||'').trim().slice(0,4)||'🐷';
      else if(k==='nombre')h.nombre=String(el.value||'').trim().slice(0,30)||'Hucha';
      else h.meta=String(el.value||'').trim().slice(0,60);
      save();render();break;}
    case 'wk-set':{const d=parseDate(el.value);if(d){weekDate=mondayOf(d);
      ui.semDesde=iso(d)===iso(new Date())?'':iso(d);render();}break;}
    /* cada cuánto haces la compra: es un <select>, así que vive en ESTE switch */
    case 'compra-cada':{const v=+el.value;if(v>=1&&v<=14){food().compraCada=v;save();render();}break;}
    case 'pat-sel':{const i=store.patterns.findIndex(p=>p.id===el.value);if(i>=0){store.rotation.pattern=i;store.rotation.mode='template';save();render();}break;}
    case 'rot-anchor':{if(el.value){store.rotation.anchor=el.value;store.rotation.anchorSet=true;save();render();}break;}
    case 'est-file':{const f=el.files&&el.files[0];if(!f)break;
      /* ojo: los ficheros y los <select> se manejan en ESTE switch (change), no en act(): un case
         puesto en el otro no se dispara nunca y no da ningún error */
      const rd=new FileReader();
      rd.onload=function(){const r=estImportar(String(rd.result||''));
        ui.estPrev=r;if(r.ok)ui.estVista='temario';flash(r.msg);render();window.scrollTo(0,0);};
      rd.onerror=function(){flash('no he podido leer ese archivo: pégalo a mano en la caja de abajo');};
      rd.readAsText(f);break;}
    case 'ics-file':{const f=el.files&&el.files[0];if(!f)break;
      const rd=new FileReader();
      rd.onload=function(){ui.icsTxt=String(rd.result||'');
        const box=document.getElementById('icsBox');if(box)box.value=ui.icsTxt;
        icsAnalizar();};
      rd.onerror=function(){flash('no he podido leer ese archivo: pégalo a mano en la caja de abajo');};
      rd.readAsText(f);break;}
    case 'sh-f':{const s=shiftById(el.dataset.id);if(s){s[el.dataset.f]=el.value;save();render();}break;}
    case 'pat-name':{const p=store.patterns.find(x=>x.id===el.dataset.id);if(p){p.name=el.value;save();}break;}
    case 'pat-note':{const p=store.patterns.find(x=>x.id===el.dataset.id);if(p){p.note=el.value;save();}break;}
    case 'pat-day':{const p=store.patterns.find(x=>x.id===el.dataset.id);if(p){p.days[+el.dataset.d]=el.value;save();render();}break;}
    case 'day-pick':{const days=weekDays();const d=days[+el.dataset.i];if(!d)break;
      if(d.date){setDayOverride(iso(d.date),el.value||'',(dayOverride(iso(d.date))||{}).guard);
        delete store.rotation.shiftByDay[iso(d.date)];}
      else store.rotation.shiftByDay['tpl'+store.rotation.pattern+'#'+d.idx]=el.value;
      save();render();break;}
    case 'rh-f':{if(!store.rhythm)store.rhythm={};const o=store.rhythm[el.dataset.id]||(store.rhythm[el.dataset.id]={});
      o[el.dataset.f]=el.value;save();render();break;}
    case 'mon-set':{const mm=/^(\d{4})-(\d{2})$/.exec(el.value||'');if(mm){monthDate=new Date(+mm[1],+mm[2]-1,1,12,0,0,0);render();}break;}
    case 'food-day':{const k=foodKey(el.value);if(k)ui.foodDate=k;render();break;}
    case 'food-ob':{const fb=food(),v=Math.max(0,Math.round(+el.value||0));
      if(!fb.objetivo)fb.objetivo={kcal:0,prot:0};fb.objetivo[el.dataset.k]=v;save();render();break;}
    case 'gym-day':{const k=foodKey(el.value);if(k)ui.gymDate=k;render();break;}
    case 'perf-n':setPerfil(el.dataset.f,el.value);break;   /* los campos van en el switch de change, no en el de click */
    case 'rt-n':setRutina(el.dataset.id,+el.dataset.ix,el.dataset.f,el.value);render();break;
    case 'rt-nota':setRutina(el.dataset.id,+el.dataset.ix,'nota',el.value);break;
    case 'rt-nombre':{const rt=gymS().rutinas.find(function(r){return r.id===el.dataset.id;});
      if(rt){rt.nombre=el.value.trim().slice(0,40)||rt.nombre;save();render();}break;}
    case 'rt-notas':{const rt=gymS().rutinas.find(function(r){return r.id===el.dataset.id;});
      if(rt){rt.notas=el.value;save();}break;}
    case 'gym-rut-sel':ui.gymRutinaSel=el.value;break;
    case 'gym-seg-tipo':{const gg=gymS();gg.segundo.tipo=el.value;
      const k=foodKey(ui.gymDate||iso(new Date()));if(gg.marks[k])gg.marks[k].tipo=el.value;
      save();render();flash('segundo entreno: '+el.value);break;}
    case 'gym-seg-hora':{const gg=gymS();gg.segundo.hora=el.value;
      const k2=foodKey(ui.gymDate||iso(new Date()));if(gg.marks[k2])gg.marks[k2].hora=el.value;
      save();render();break;}
    case 'com-h':{if(!store.comidas)store.comidas={};
      const k=el.dataset.k,w=el.dataset.w;
      if(!store.comidas[k]||typeof store.comidas[k]!=='object')store.comidas[k]={de:'14:00',a:'15:00'};
      if(/^\d{1,2}:\d{2}$/.test(el.value||''))store.comidas[k][w]=el.value;
      save();render();break;}
    case 'com-tras':{if(!store.comidas)store.comidas={};
      const v=Math.round(+el.value||0);
      if(v>=0&&v<=180)store.comidas.trasSiesta=v;
      save();render();break;}
    case 'sueno-f':{if(!store.sueno)store.sueno={min:8,cenaMin:90,cenaMax:180,latencia:10};
      /* la siesta SÍ puede ser 0 —hay quien aguanta del tirón—, así que no vale el mismo v>0 que
         para las demás: con el filtro de antes, poner 0 no se guardaba y no pasaba nada */
      const k=el.dataset.k,v=+el.value;
      if(k==='siesta'){if(v>=0&&v<=480)store.sueno.siesta=Math.round(v);}
      else if(v>0)store.sueno[k]=(k==='min'?Math.round(v*4)/4:Math.round(v));
      save();render();break;}
    case 'ev-toggle':{const ev=eventosS().find(function(e){return e.id===el.dataset.id;});
      if(ev){ev.on=!!el.checked;save();render();}break;}
    case 'hab-detalle':{ui.habDetalle=el.value;render();break;}
    case 'salto-from':{if(!store.rotation.saltoDia)store.rotation.saltoDia={from:6,to:1};
      store.rotation.saltoDia.from=Math.max(0,Math.min(6,+el.value));save();render();break;}
    case 'salto-to':{if(!store.rotation.saltoDia)store.rotation.saltoDia={from:6,to:1};
      store.rotation.saltoDia.to=Math.max(0,Math.min(6,+el.value));save();render();break;}
    case 'gym-hora':{gymS().hora=/^\d{2}:\d{2}$/.test(el.value||'')?el.value:'';save();render();break;}
    case 'gym-duracion':{gymS().duracion=Math.max(15,Math.min(240,+el.value||75));save();render();break;}
    case 'ics-aviso-min':{store.rotation.icsAvisoMin=Math.max(0,Math.min(180,+el.value||30));save();render();break;}
    case 'cal-weekstart':{store.rotation.calWeekStart=el.value==='dom'?'dom':'lun';save();render();break;}
    case 'backup-aviso-d':{if(!store.meta)store.meta={owner:'',notes:''};
      store.meta.backupAvisoD=Math.max(1,Math.min(90,+el.value||13));save();render();break;}
    case 'svc-meses':{const ix=+el.dataset.ix;
      if(!Array.isArray(store.rotation.svcMeses))store.rotation.svcMeses=[];
      store.rotation.svcMeses[ix]=Math.max(1,Math.min(6,+el.value||1));save();render();break;}
    case 'lista-nombre':{const l=listaById(el.dataset.id);if(l){l.nombre=String(el.value||'').slice(0,60);save();}break;}
    case 'nota-f':{
      const k=el.dataset.k;
      if(k==='txt'){setNota(el.dataset.id,'txt',el.value);break;}
      setNota(el.dataset.id,k,el.value);render();break;}
    case 'food-pos':{ui.foodPos=el.value||'';render();break;}
    case 'alim-g-f':{ui.alimG=Math.max(1,Math.min(2000,Math.round(+el.value||100)));render();break;}
    case 'plato-f':{
      if(!ui.plato)ui.plato=platoVacio();
      const k=el.dataset.k;
      if(k==='steps')ui.plato.steps=String(el.value||'').split('\n').map(function(x){return x.trim();}).filter(Boolean);
      else if(k==='portions')ui.plato.portions=Math.max(1,Math.min(20,Math.round(+el.value||1)));
      else ui.plato[k]=String(el.value||'').slice(0,k==='icon'?4:70);
      render();break;}
    case 'plato-ing-g':{
      if(!ui.plato)break;
      const x=ui.plato.alims[+el.dataset.ix];
      if(x)x.g=Math.max(1,Math.min(3000,Math.round(+el.value||0)));
      render();break;}
    case 'alim-f':{
      if(!ui.alimNuevo)ui.alimNuevo={};
      const k=el.dataset.k;
      ui.alimNuevo[k]=(k==='n'||k==='e'||k==='g'||k==='nota')?String(el.value||''):el.value;
      break;}
    case 'usda-f':{
      if(!store.usda)store.usda={key:''};
      store.usda.key=String(el.value||'').trim().slice(0,120);save();render();break;}
    case 'lector-f':{
      /* al salir del campo se completa el https:// que falte: guardarlo tal cual lo dejaba inservible
         (fetch lo resolvía contra la propia web) y además normalize() lo borraba al recargar */
      let v=String(el.value||'').trim().slice(0,300);
      if(v&&!/^https?:\/\//i.test(v))v='https://'+v.replace(/^\/+/,'');
      v=v.replace(/^http:\/\//i,'https://');
      if(!store.lector)store.lector={proxy:''};
      store.lector.proxy=/^https:\/\/[^\s"'<>]+$/.test(v)?v:'';
      if(v&&!store.lector.proxy)flash('Esa dirección no vale: tiene que ser una URL https');
      save();render();break;}
    case 'tk-foto':{const fs=el.files;
      /* un <input type=file> vive en ESTE switch (change): puesto en act() no se dispara nunca */
      const t=ui.ticket||(ui.ticket={txt:'',leido:null,msg:''});
      t.imagenes=(fs&&fs.length)?Array.prototype.slice.call(fs):null;
      render();break;}
    case 'imp-img':{const fs=el.files;
      ui.imp.imagenes=(fs&&fs.length)?Array.prototype.slice.call(fs):null;
      ui.imp.estado='';ui.imp.msg='';render();break;}
    case 'franja-horas':{if(!store.franja)store.franja={colores:{}};
      store.franja.horas=+el.value||24;save();render();break;}
    case 'franja-color':{if(!store.franja)store.franja={horas:24};
      if(!store.franja.colores)store.franja.colores={};
      store.franja.colores[el.dataset.k]=el.value||'';save();render();break;}
    case 'tema-f':{if(!store.tema)store.tema={brand:'',brand2:''};
      store.tema[el.dataset.k]=el.value||'';aplicarTema();save();
      if(el.dataset.k==='ink'&&!tintaLegible(el.value))flash('ese color de texto no se lee sobre este fondo: lo dejo apuntado pero no lo aplico');
      break;}
    case 'tema-reset':{store.tema={brand:'',brand2:'',ink:''};aplicarTema();save();render();
      flash('colores restablecidos a los de la app');break;}
    case 'jor-f':{const j=store.rotation.jornada||(store.rotation.jornada={start:'',end:'',workdays:[1,2,3,4,5]});
      j[el.dataset.f]=el.value||'';save();render();break;}
    case 'mon-svc':{const y=monthDate.getFullYear(),m=monthDate.getMonth();
      setMonthService(y,m,el.value||'',null);save();render();break;}
    case 'mon-guard':{const y=monthDate.getFullYear(),m=monthDate.getMonth();
      setMonthService(y,m,monthService(y,m).service||'',num(el.value,6));save();render();break;}
    case 'gtipo-n':{const suma=setCupoTipo(el.dataset.code,el.value);
      setMonthService(monthDate.getFullYear(),monthDate.getMonth(),null,suma);save();render();
      flash('cupo por tipo: '+suma+' guardias este mes');break;}
    case 'gtipo-lbl':{flash(renombraTipo(el.dataset.code,el.value));break;}
    case 'gtipo-sem':case 'gtipo-finde':case 'gtipo-pase':{
      flash(setHorasTipo(el.dataset.code,a==='gtipo-sem'?'relevoSem':a==='gtipo-finde'?'relevoFinde':'pase',el.value));break;}
    case 'cal-desde':{ui.calDesde=el.value||'';
      if(ui.calHasta&&ui.calHasta<ui.calDesde)ui.calHasta=ui.calDesde;
      calRefresca();render();break;}
    case 'cal-hasta':{ui.calHasta=el.value||'';calRefresca();render();break;}
    case 'cal-ics-desde':{ui.icsDesde=el.value||'';render();break;}
    case 'cal-ics-hasta':{ui.icsHasta=el.value||'';render();break;}
    case 'cal-encima':{ui.icsEncima=!!el.checked;
      if(ui.icsTxt)icsAnalizar();else render();break;}
    case 'cal-oculto':{store.rotation.calOculto=!!el.checked;calRefresca();save();render();
      flash(el.checked?'los eventos saldrán con su etiqueta (IMPORT_TAG), para filtrarlos u ocultarlos en Google'
        :'sin etiqueta: cada descarga se verá como calendario suelto');break;}
    case 'guard-default':{setMonthService('default',null,store.rotation.monthService,num(el.value,6));save();render();break;}
    case 'svc-edit':{const ix=+el.dataset.ix,v=(el.value||'').trim();
      if(v)store.rotation.servicios[ix]=v;save();break;}
    case 'svc-m':break;
    case 'slot-time':case 'slot-label':{const sh=curShiftId(el);if(!sh)break;
      const s=store.menu[sh][+el.dataset.i];if(!s)break;s[a==='slot-time'?'time':'label']=el.value;save();break;}
    case 'slot-meal':{const sh=curShiftId(el);if(!sh)break;const s=store.menu[sh][+el.dataset.i];if(!s)break;
      s.mealId=el.value||'';if(!el.value)s.items=s.items||[];save();render();break;}
    case 'it-dish':{const sh=curShiftId(el)||id;if(!sh)break;const s=store.menu[sh][+el.dataset.i];if(!s||s.mealId){flash('Es una comida armada: edítala desde su tarjeta');break;}
      s.items[+el.dataset.j].id=el.value;save();render();break;}
    case 'it-port':{const sh=curShiftId(el)||id;if(!sh)break;const s=store.menu[sh][+el.dataset.i];if(!s||s.mealId)break;
      s.items[+el.dataset.j].portions=Math.max(0.5,num(el.value,1));save();render();break;}
    case 'meta-notes':store.meta.notes=el.value;save();break;
  }
});
window.addEventListener('beforeprint',()=>{if(ui.tab!=='week')return;});
document.addEventListener('visibilitychange',function(){
  /* el móvil se bloquea o se cambia de app a media lectura: apaga la cámara en vez de dejarla
     grabando en segundo plano sin que se vea (gasto de batería y de privacidad para nada) */
  if(document.hidden&&ui.scanStream){
    pararEscaner();
    const msg='cámara parada al pasar a segundo plano: vuelve a abrirla cuando quieras seguir';
    ui.scanMsg=msg;const o=document.getElementById('scanOut');if(o)o.textContent=msg;
  }
});
/* cabecera que se esconde al bajar y vuelve al subir: en pantallas pequeñas, más sitio para ver
   el calendario en vez de tenerla siempre fija ocupando espacio.
   El scroll táctil no es monótono (rebotes de inercia de unos pocos px hacia arriba en pleno
   gesto de bajar), así que en vez de comparar cada frame con el anterior (eso hacía que la
   cabecera "parpadeara" y no se llegara a esconder hasta casi el final) se acumula el recorrido
   en una misma dirección y solo se decide al pasar un umbral: bajar 26 px seguidos la esconde,
   subir 14 px seguidos la trae de vuelta. */
(function(){
  let lastY=0,downRun=0,upRun=0,ticking=false;
  function onScroll(){
    if(ticking)return;ticking=true;
    requestAnimationFrame(function(){
      ticking=false;
      const h=document.querySelector('header');if(!h)return;
      const y=window.scrollY||document.documentElement.scrollTop||0;
      if(ui.drawerOpen||document.getElementById('overlay').classList.contains('on')){
        h.classList.remove('hide');lastY=y;downRun=upRun=0;return;}
      const dy=y-lastY;lastY=y;
      if(y<=40){h.classList.remove('hide');downRun=upRun=0;return;}
      if(dy>0){downRun+=dy;upRun=0;}else if(dy<0){upRun-=dy;downRun=0;}
      if(downRun>26)h.classList.add('hide');
      else if(upRun>14)h.classList.remove('hide');
    });
  }
  window.addEventListener('scroll',onScroll,{passive:true});
})();

/* ===================== arranque ===================== */
/* expone el modelo para depurar / testear desde la consola */
function compartidoEntrante(){
  /* el share_target del manifest entrega title/text/url en la query de index.html (método GET).
     Se vacía la barra de direcciones para que al recargar no vuelva a abrirse la importación. */
  try{
    const q=new URLSearchParams(location.search||'');
    const titulo=(q.get('title')||'').trim(),texto=(q.get('text')||'').trim(),enlace=(q.get('url')||'').trim();
    /* TikTok manda a veces el enlace dentro de «text» en vez de en «url»: se saca de donde esté y
       va al campo del enlace, no al cuadro de la receta */
    const m=/https?:\/\/\S+/.exec(enlace||texto||'');
    const url=m?m[0]:'';
    const cuerpo=[titulo,texto].filter(Boolean).join('\n').replace(/https?:\/\/\S+/g,'').replace(/\n{2,}/g,'\n').trim();
    if(!cuerpo&&!url)return;
    if(!ui.imp)ui.imp={txt:'',url:'',receta:null,estado:'',msg:'',destinoLote:'',destinoDia:'',via:'',imagenes:null};
    ui.imp.txt=cuerpo;
    ui.imp.url=url;
    ui.tab='import';
    /* A disco antes de nada. Android mata la app en cuanto vuelves a TikTok, y como la barra de
       direcciones se limpia dos líneas más abajo, al reabrir no quedaba ni rastro de la receta:
       compartías, mirabas otra cosa y al volver la pantalla estaba vacía. */
    store.impPendiente={txt:cuerpo,url:url,ts:Date.now(),abierto:true};
    save();
    if(history&&history.replaceState)history.replaceState(null,'',location.pathname);
  }catch(e){/* navegador sin URLSearchParams o sin history: se entra a la app como siempre */}}
function compartidoPendiente(){
  /* al abrir sin nada en la query: si quedó algo compartido sin usar, se recupera. La primera vez
     además te lleva a la pantalla; a partir de ahí se queda esperando sin dar la lata. */
  const pen=store.impPendiente;
  if(!pen||(!pen.txt&&!pen.url))return;
  if(Date.now()-(+pen.ts||0)>7*24*3600*1000){store.impPendiente=null;save();return;}
  if(!ui.imp)ui.imp={txt:'',url:'',receta:null,estado:'',msg:'',destinoLote:'',destinoDia:'',via:'',imagenes:null};
  if(ui.imp.txt||ui.imp.url)return;   /* ya hay algo en marcha: no se pisa */
  ui.imp.txt=pen.txt;ui.imp.url=pen.url;
  if(!pen.abierto){ui.tab='import';pen.abierto=true;save();}}
function impOlvidaPendiente(){if(store.impPendiente){store.impPendiente=null;save();}}
/* ===== ¿hay una versión nueva? =====
   El caso que se nos escapaba: en Android, al volver a la app desde las recientes NO hay ninguna
   navegación —la página sigue ahí tal cual, con el JavaScript viejo cargado— así que puede pasar
   días sin enterarse de nada por mucho que el servidor tenga otra cosa. Esto lo comprueba cada vez
   que la app vuelve a primer plano: lee version.json saltándose la caché y, si la marca ha
   cambiado desde que arrancó, avisa. No recarga a traición: te lo ofrece. */
let _versionArranque=null,_versionNueva=false,_versionMirando=false;
function versionURL(){return new URL('version.json',location.href).href;}
function leerVersion(){
  return fetch(versionURL(),{cache:'no-store'}).then(function(r){
    if(!r.ok)throw new Error('no');return r.json();
  }).then(function(d){return String((d&&d.v)||'');});}
function versionActual(){return _versionArranque;}
function hayVersionNueva(){return _versionNueva;}
function mirarVersion(){
  if(_versionMirando||_versionNueva)return Promise.resolve();
  _versionMirando=true;
  return leerVersion().then(function(v){
    if(!v)return;
    if(_versionArranque===null){_versionArranque=v;return;}
    if(v!==_versionArranque){
      _versionNueva=true;
      /* también se le dice al service worker que se mire a sí mismo, para que la recarga traiga
         ya el código nuevo y no otra vuelta de lo mismo */
      if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration){
        navigator.serviceWorker.getRegistration().then(function(reg){if(reg)reg.update();}).catch(function(){});}
      render();
      flash('Hay una versión nueva de la app: dale a «actualizar» arriba',6000);}
  }).catch(function(){/* sin red: ya se mirará la próxima vez */})
   .then(function(){_versionMirando=false;});}
function vigilarVersion(){
  if(typeof document==='undefined'||!/^https?:$/.test(location.protocol))return;
  mirarVersion();
  document.addEventListener('visibilitychange',function(){
    if(!document.hidden)mirarVersion();});
  window.addEventListener('focus',function(){mirarVersion();});}
let _diaVigilado=null,_relojDia=null;
function vigilarElDia(){
  /* «que vaya acorde a la hora de mi teléfono»: si dejas la app abierta y pasa la medianoche, el día
     marcado como hoy se quedaba clavado en el de ayer hasta recargar. Esto lo mueve solo.
     Se programa para el minuto siguiente a las 00:00 en vez de hacer un temporizador cada minuto:
     el móvil suspende la pestaña y un intervalo corto solo gastaría batería. */
  if(typeof document==='undefined')return;
  _diaVigilado=iso(new Date());
  const alSiguienteDia=function(){
    if(_relojDia)clearTimeout(_relojDia);
    const n=new Date(),manana=new Date(n.getFullYear(),n.getMonth(),n.getDate()+1,0,0,5);
    /* setTimeout no aguanta más de 24.8 días y el móvil puede dormirse: se recorta a una hora y se
       vuelve a programar, que además cubre los cambios de hora */
    const espera=Math.min(3600000,Math.max(1000,manana-n));
    _relojDia=setTimeout(function(){comprobarCambioDeDia();alSiguienteDia();},espera);};
  const comprobarCambioDeDia=function(){
    const hoy=iso(new Date());
    if(hoy===_diaVigilado)return false;
    _diaVigilado=hoy;
    /* solo se repinta lo que enseña días; en Ajustes o en Compra no hace falta molestar */
    if(CAL_SET.has(ui.tab)||ui.tab==='food'||ui.tab==='notas')render();
    return true;};
  alSiguienteDia();
  /* y al volver a la app desde segundo plano, que es cuando de verdad ha pasado la noche */
  document.addEventListener('visibilitychange',function(){
    if(!document.hidden&&comprobarCambioDeDia())alSiguienteDia();});
  window.addEventListener('focus',function(){if(comprobarCambioDeDia())alSiguienteDia();});}
function registrarSW(){
  /* hace falta para poder instalar la app y que TikTok la ofrezca al compartir. Donde no se puede
     (el sandbox del Artifact, file://, iOS) simplemente no pasa nada: la app va igual. */
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
  try{navigator.serviceWorker.register('./sw.js').catch(function(){});}catch(e){}}
window.PG={parseRhythmText,parseServicesText,applyRhythm,hhmm,normClock,
  get store(){return store;},set store(v){store=normalize(v);},get ui(){return ui;},render,save,weekDays,
  shiftById,resolveCode,isGuardia,dayTotals,planBatches,shiftForDate,fmt,autofill,parseDate,mondayOf,addDays,ingredientsFor,editBatch,slotsFor,
  parsePlanning,parseSemanales,applyParse,parseDietText,dishKeywords,matchDish,togglePicker,dayPicker,defaultTime,toText,
  sleepHours,fmtHM,toMin,dayInfo,dayOverride,setDayOverride,rhythmOf,sleepOf,monthDays,monthService,setMonthService,
  guardCount,distributeGuardias,syncToRotation,quickBreakfast,schedLine,dayLine,RKEYS,necesidadSemana,
  dineroS,gastosFijos,gastosDeFecha,gastoPagado,mesDinero,addGasto,delGasto,addPago,delPago,pagarGasto,eur,
  vacMap,vacationOf,addVacation,delVacation,jornadaOf,jornadaEn,parseVacacionesText,vacDays,
  baseWorkday,svcLabel,setGuardiasMes,planServicios,cicloServicios,ponerSalienteAuto,limpiarSalientesAuto,
  suenoCfg,mins,hm,acostarsePara,ventanaCena,despertarBase,nightOf,aplicarAcostarse,encajarCenas,
  fechaHoy,moverDiaHoy,imprimir,
  gTipos,gTipo,setHorasTipo,guardiaHoras,salidaDeGuardia,bloquesTrabajo,horasDelDiaTxt,esDiaDeJornada,
  comidasCfg,comidaPrincipalDe,comidaPrincipalTxt,hayEntrenoEn,esComidaPrincipal,horaDeToma,planDiaHTML,
  gymCambios,rutinaDelDia,rutinaDeFecha,moverEntreno,deshacerMovido,gymDiaEstado,gymDiaMalo,gymHechoEn,
  gymDescanso,gymChoque,fechaCortaTxt,
  objetivosS,nuevoObjetivo,delObjetivo,objetivoTitulo,objetivoEstado,objetivoConsejoTxt,OBJ_TIPOS,
  pesoMaximo,volumenSemanal,tocaDescarga,estancados,cambioSugerido,cruceEntreno,
  fuerzaEstimada,diasEntrenadosSemana,rachaConstancia,mejorCarrera,ritmoTxt,cuandoLlegasTxt,
  volumenPorMusculo,rutinaResumen,semanasAtras,fmtKg,
  progresionDe,esEjercicioDeAbajo,esRecord,sesionPlan,sesionIx,vivoCampos,vivoApuntar,vivoSet,
  informeSesion,esfuerzoTxt,diaCumplido,descansoCfg,RPE_PAL,
  saltoDia,saltoDiaTxt,aplicarTema,avisoBackupD,renderAjustes,
  TLCAT,TLKEYS,tlColor,tlHoras,franjaVentana,timelineBar,franjaLeyendaHTML,
  listasS,listaById,addLista,delLista,addItemLista,delItemLista,itemsDeRutina,platosConLista,
  seccionDeCompra,porSeccion,COMPRA_SECS,
  despensaS,despensaAdd,despensaGasta,despensaQuitar,despensaVaciar,despClave,neveraSync,
  hacerCompra,listaAMano,diasDesdeCompra,salidaDe,SALIDAS,compraDatos,tengoEnCasa,
  compraCada,tocaComprar,compraCuenta,pasoDeGasto,avenaSegura,seccionDeCompra2:seccionDeCompra,
  ticketLeer,ticketLinea,ticketNombre,ticketAplicar,ticketSano,
  glutenDe,glutenDePlato,platosConGluten,cambiarPlatoSinGluten,esCeliaco,GLUTEN_CAMBIOS,
  perfilS,setPerfil,apuntarPeso,tendenciaPeso,
  nombreCorto,hCorta,
  parseReceta,recetaSana,recetaIcono,recetaLineas,impGuardar,impLocal,renderImport,
  enArtifact,versionActual,hayVersionNueva,mirarVersion,pedirPersistencia,tamanoLegible,impPegar,impAutoDesdeEnlace,lectorIntentos,lectorPublicoOn,LECTORES_PUBLICOS,compartidoPendiente,impOlvidaPendiente,lectorSitio,lectorProxy,lectorNormaliza,traerDescripcion,impTraerEnlace,
  svcMesesDe,svcColor,serviciosEditorHTML,anyoServiciosHTML,serviciosCard,
  gTipos,gTipo,gEtiqueta,gTiposTxt,repartoTipos,setCupoTipo,setGuardiaTipo,renombraTipo,addGuardiaTipo,
  icsUID,icsEscTxt,icsEsc,icsUnfold,icsStampUTC,calNombreTxt,calRangoUI,calFileTxt,calUrlBloque,calNotas,icsPreviewHTML,icsAnalizar,
  gymWipe,gymUndoWipe,calEventos,icsTexto,parseIcs,icsDesdoblar,icsClasificar,icsPlan,icsAplicar,calFinMes,calIniMes,calRango,
  gymS,gymImportText,gymImportUrl,gymBuscar,nuevaRutina,delRutinaCard,addRutina,delRutina,setRutina,moverEjercicio,
  tipoDeEjercicio,recomendacionRutina,entrenoHeatmapCard,kcalRingHTML,
  addSet,delSet,setsDe,volumenDe,prDe,
  ejercicioUltimo,empezarRutina,terminarSesion,descartarSesion,duracionTipica,historialRutina,sesionesRecientes,
  addCardio,delCardio,libMatch,regionesDeTexto,regionesDeNombre,ejerciciosSinMusculo,EJERCICIOS_NOMBRE,regionesDeEjercicio,regionesDeRutina,regionesDeSesion,svgCuerpo,
  MREGIONES,MREG_LABEL,GYM_SITIO,GYM_URL,
  diaSegundo,toggleSegundo,setSegundoCampo,toggleSegundoDia,resumenGym,volumenSemana,gymLine,
  food,foodKey,offNum,mapOffProduct,addEanProduct,delEanProduct,toggleFavEan,porcionDe,foodLog,addFoodEntry,delFoodEntry,
  bumpFoodEntry,foodTotals,planTotalsOf,sugerirObjetivo,buscarEan,buscarOffNombre,iniciarEscaner,pararEscaner,buscarYmostrar,
  FOOD_CATALOGO,foodImportCatalogo,
  ALIMENTOS,ALIM_MICROS,ALIM_LABEL,ALIM_UNIDAD,ALIM_VRN,ALIM_GRUPOS,ALIM_EN,
  notasS,notaById,notasDeFecha,addNota,setNota,delNota,proyectos,notasDeHoy,notasDeLaSemana,toggleNotaHecha,notaAEvento,desenlazaNota,
  imprimir,
  eventosS,evById,evDura,evDuraTxt,evHoraTxt,eventosDeFecha,icsResumen,
  TEMAS,temaById,ponerTema,tintaLegible,eventoAplica,mesRejilla,
  finNum,finParse,finJunta,finLeer,finGuardar,llegadaNomina,proximaNomina,nominaCfg,
  ahorroS,nominaMes,guardiasDelMes,ahorroMes,apartarMes,deshacerApartado,repartoDe,cerrarReto,sacarHucha,proyeccionAhorro,epocaDe,
  estS,estTema,estEstado,estProxima,estTocaHoy,estBloques,estCuenta,estMinSemana,
  estSubir,estBajar,estOlvidar,estAddSesion,estDelSesion,estImportar,estProgresoJSON,EST_NIVELES,
  arrS,arrLee,arrAplica,ARR_PASOS,
  rutinaDias,toggleRutinaDia,rutinaDeFecha,CFG_DONDE,
  eventoDeNota,notasCuenta,purgaNotas,migraNotasDia,
  SITIOS_FIJOS,sitiosS,sitioActual,addSitio,delSitio,solDe,solTxt,horaLocal,arcoSolHTML,
  alimTxt,alimSlug,alimTodos,alimById,alimBuscar,alimPorcion,alimEntrada,alimFuenteTxt,addAlimPropio,delAlimPropio,
  microTotales,microPct,microCortos,alimRicosEn,
  neveraIds,neveraAlimentos,neveraToggle,neveraVaciar,neveraDesdeCompra,
  usdaKey,usdaOn,mapUsdaFood,usdaBuscar,usdaOlvidar,USDA_NUM,
  objetivoMacros,sumaAlimentos,combinaciones,metaDePlato,topeRacion,esCondimento,ALIM_CONDIMENTO,guardarCombinacion,platoVacio,platoTotales,guardarPlato,gramosPorDefecto,
  renderAlimentos,renderAlimFicha,renderCocinaPanel,renderPlatoNuevo,renderAlimNuevo,
  foodBuscar,frecuentes,buscableDe,racionesDe,previaMacrosDe,apuntaBuscable,FOOD_TIPOS,
  renderFoodBuscar,renderFoodCantidad,renderFoodMicros,renderFoodProductos,renderCocinaPanel,renderMisPlatos,
  platosPorAntojo,antojoS,microLineaHTML,
  esReceta,dishById,iso,momentoAhora,foodCtx,foodBuscables,platosCocinables,loQueHay,escalaIng,parseIng,
  get monthDate(){return monthDate;},set monthDate(v){monthDate=v;},nextIso,
  set weekDate(v){weekDate=v;},get weekDate(){return weekDate;},DEFAULTS,
  openDrawer,closeDrawer,CAL_SET,isToday,timelineBar,mealRowsHTML,daySleepLineHTML,dayPanelHTML,modoAvisoHTML,
  notaDia,eventosS,eventosDelDia,eventosDeFecha,eventosDelMes,agendaMesHTML,diasCorta,eventoRowHTML,eventosTagsHTML,
  fechaCorta,diasHasta,cuentaAtrasTxt,eventosPuntualesDe,eventosPuntualesProximos,proximosPuntualesHTML,
  habitosS,habitoHecho,toggleHabito,rachaHabito,constanciaRingHTML,habitoRowHTML,habitoHeatmapHTML,renderHabitos,habitosHoyHTML};
load();
compartidoEntrante();   /* antes de pintar: si vienes de «Compartir → Guardias», abre ya la pantalla */
compartidoPendiente();  /* y si el sistema mató la app a medias, se recupera lo compartido */
/* Si has entrado compartiendo una receta, vienes con una intención concreta: el asistente del
   primer arranque no puede comerse el compartido. Se guarda para la próxima vez que abras la app
   por tu cuenta. (Pasó: en una instalación nueva, compartir desde TikTok abría el asistente y la
   receta se perdía de vista.) */
if(ui.arranque&&ui.imp&&(ui.imp.txt||ui.imp.url))ui.arranque=null;
impAutoDesdeEnlace();   /* con un enlace a la vista, la receta se carga sola */
render();
avisarBackupSiToca();
pedirPersistencia();   /* que el navegador no pueda borrarlo por falta de espacio */
claudeBuscar();
registrarSW();
vigilarVersion();   /* al volver a la app, comprobar si hay algo nuevo desplegado */
vigilarElDia();     /* y que «hoy» siga siendo hoy aunque la app pase la noche abierta */
/* la bandera que mira el salvavidas de index.html: si esta línea no se ejecuta, la app no arrancó */
window.__arrancada=true;
