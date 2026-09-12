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
  meta:{owner:'',notes:''},
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
             calNombre:'',calAlarm:true,calOculto:true,
             servicios:['Rayos','Cardiología','Medicina Interna','Infecciosas','Neumología','UCRI','Neurología'],
             jornada:{start:'08:00',end:'15:00',workdays:[1,2,3,4,5],aplicaLibres:true},vacaciones:[]},
  sueno:{min:8,cenaMin:90,cenaMax:180,latencia:10},
  food:{objetivo:{kcal:0,prot:0},eans:{},log:{},fav:[]},
  gym:{biblioteca:[],rutina:[],registro:[],fav:[],fuente:'',marks:{},
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
function avisarBackupSiToca(){
  const db=diasDesdeBackup(),dp=diasDesdePrimerUso();
  if(!((db===null&&dp>13)||(db!==null&&db>13)))return;
  try{const ultimo=+localStorage.getItem(NKEY);if(Date.now()-ultimo<864e5)return;
    localStorage.setItem(NKEY,String(Date.now()));}catch(e){}
  setTimeout(function(){flash('💾 hace tiempo que no haces una copia de seguridad: en «Datos» tienes «Descargar JSON» — es la única red de seguridad, nada se guarda en ningún servidor',6000);},900);}
let store, ui={tab:'hoy',marks:new Set(),draftPattern:null,openDays:new Set(),openPickers:new Set(),
  calDesde:'',calHasta:'',icsDesde:'',icsHasta:'',calView:false,calTxt:'',calFile:'',calUrl:'',icsPrev:null,
  icsTxt:'',icsEncima:false};
const allOpen=()=>{const ds=weekDays();return ds.length>0&&ds.every(function(d){return ui.openDays.has(d.key||('tpl'+d.idx));});};
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
  try{const m=JSON.parse(localStorage.getItem(MKEY)||'[]');if(Array.isArray(m))ui.marks=new Set(m);}catch(e){}
  try{if(localStorage.getItem(TKEY)!=='light')document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}
}
function normalize(o){
  const d=DEFAULTS();
  if(!o||!Array.isArray(o.shifts)||!o.menu)return o;
  ['meta','shifts','rotation','patterns','batches','dishes','meals','menu','rules','rhythm'].forEach(k=>{if(o[k]==null)o[k]=d[k];});
  if(!o.rhythm||typeof o.rhythm!=='object')o.rhythm={};
  o.shifts.forEach(function(s2){if(!o.rhythm[s2.id])o.rhythm[s2.id]=d.rhythm[s2.id]||{wake:'',breakfast:'',leave:'',arrive:'',sleep:''};});
  if(!o.meta)o.meta={owner:'',notes:''};
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
  if(!Array.isArray(o.rotation.servicios)||!o.rotation.servicios.length)o.rotation.servicios=d.rotation.servicios.slice();
  o.rotation.servicios=o.rotation.servicios.map(function(x){return String(x||'').trim();}).filter(Boolean);
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
  if(!o.food.eans||typeof o.food.eans!=='object')o.food.eans={};
  if(!o.food.log||typeof o.food.log!=='object')o.food.log={};
  if(!Array.isArray(o.food.fav))o.food.fav=[];
  if(!o.gym||typeof o.gym!=='object')o.gym=JSON.parse(JSON.stringify(d.gym||{biblioteca:[],rutina:[],registro:[],fav:[],
    segundo:{on:true,dias:[2,5],tipo:'piscina',hora:'15:30'}}));
  ['biblioteca','rutina','registro','fav'].forEach(function(k){if(!Array.isArray(o.gym[k]))o.gym[k]=[];});
  if(!o.gym.segundo||typeof o.gym.segundo!=='object')
    o.gym.segundo={on:true,dias:[2,5],tipo:'piscina',hora:'15:30'};
  if(!Array.isArray(o.gym.segundo.dias))o.gym.segundo.dias=[2,5];
  if(!o.sueno||typeof o.sueno!=='object')o.sueno={min:8,cenaMin:90,cenaMax:180,latencia:10};
  ['min','cenaMin','cenaMax','latencia'].forEach(function(k){if(typeof o.sueno[k]!=='number')o.sueno[k]={min:8,cenaMin:90,cenaMax:180,latencia:10}[k];});
  if(!Array.isArray(o.rotation.vacaciones))o.rotation.vacaciones=[];
  o.rotation.vacaciones=o.rotation.vacaciones.filter(function(v){return v&&v.start&&v.end;})
    .map(function(v){return {label:String(v.label||''),start:String(v.start),end:String(v.end)};});
  if(!o.rotation.jornada||typeof o.rotation.jornada!=='object')o.rotation.jornada={start:'',end:'',workdays:[1,2,3,4,5]};
  if(!Array.isArray(o.rotation.jornada.workdays)||!o.rotation.jornada.workdays.length)o.rotation.jornada.workdays=[1,2,3,4,5];
  o.rotation.jornada.workdays=o.rotation.jornada.workdays.map(function(x){return +x;})
    .filter(function(x){return x>=0&&x<=6;}).sort(function(a,b){return a-b;});
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
        shiftId:shiftId,auto:inf.auto&&!legacy,guard:inf.guard,pat:inf.pat,day:inf.day});
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
function dayOverride(dateStr){const v=(store.rotation.daySet||{})[dateStr];if(v===undefined||v===null||v==='')return null;
  return (typeof v==='string')?{shift:v,guard:''}:{shift:v.shift||'',guard:v.guard||''};}
function setDayOverride(dateStr,shiftId,guard){
  if(!store.rotation.daySet)store.rotation.daySet={};
  if(shiftId===null){delete store.rotation.daySet[dateStr];limpiarSalientesAuto(dateStr);return;}
  store.rotation.daySet[dateStr]=(guard&&shiftId)?{shift:shiftId,guard:guard}:{shift:shiftId||''};
  const sh=shiftById(shiftId);
  if(sh&&isGuardia(sh)){if(store.rotation.autoPos!==false)ponerSalienteAuto(dateStr);}
  else limpiarSalientesAuto(dateStr);}
function marcarAuto(fecha,shiftId,de){
  if(!shiftId)return false;
  const cur=dayOverride(fecha);
  if(cur&&!cur.auto)return false;              /* si ya lo pusiste tú a mano, no te lo toco */
  if(cur&&cur.auto&&cur.auto!=='pos')return false;
  if(vacationOf(fecha))return false;           /* en vacaciones no se escribe nada */
  store.rotation.daySet[fecha]={shift:shiftId,auto:'pos',de:de};return true;
}
function ponerSalienteAuto(dateStr){
  /* la guardia se acaba a las 8 del día siguiente: ese día es saliente; si es sábado, el lunes (el domingo se descansa en casa) */
  const S=shiftByCode('S'),L=shiftByCode('L'),d=parseDate(dateStr);
  if(!d)return {ok:false,msg:'fecha rara'};
  limpiarSalientesAuto(dateStr);
  const DN3=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];const wd=d.getDay();let n=0,txt='';
  if(wd===6){
    const doM=iso(addDays(d,1)),lu=iso(addDays(d,2));
    if(L&&marcarAuto(doM,L.id,dateStr))n++;
    if(S&&marcarAuto(lu,S.id,dateStr)){n++;txt=' (sábado → el saliente cae el lunes)';}
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
  return {bed:rh.sleep||'',wake:rh.wake||'',h:(rh.sleep&&rh.wake)?sleepHours(rh.sleep,rh.wake):null};}
function suenoCfg(){const d={min:8,cenaMin:90,cenaMax:180,latencia:10};const o=store.sueno||{};
  ['min','cenaMin','cenaMax','latencia'].forEach(function(k){if(typeof o[k]==='number'&&o[k]>0)d[k]=o[k];});
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
function cicloServicios(desdeY,desdeM,hastaY,hastaM,mesesPor,orden){
  /* solo devuelve el reparto, no escribe nada: así la interfaz puede enseñarlo antes de aplicarlo */
  const sv=(orden&&orden.length)?orden:(store.rotation.servicios||[]);
  const per=Math.max(1,+mesesPor||1),out=[];let i=0;
  let cur=new Date(desdeY,desdeM,1,12),fin=new Date(hastaY,hastaM,1,12);
  while(cur<=fin&&out.length<240){
    out.push({key:cur.getFullYear()+'-'+String(cur.getMonth()+1).padStart(2,'0'),
      y:cur.getFullYear(),m:cur.getMonth(),service:sv.length?sv[Math.floor(i/per)%sv.length]:''});
    cur=new Date(cur.getFullYear(),cur.getMonth()+1,1,12);i++;}
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
  const sane=function(t){const lab=String((t&&t.label)||'').trim().slice(0,22);
    let code=String((t&&t.code)||lab).trim().toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8);
    if(!code)code='g'+Math.random().toString(36).slice(2,5);
    return {code:code,label:lab||code.toUpperCase()};};
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
  const sab=parseDate(k)&&parseDate(k).getDay()===6;
  return {ok:true,msg:'guardia de '+t.label+' el '+k.slice(8)+' '+MON[+k.slice(5,7)-1]+
    (store.rotation.autoPos!==false?(' · el '+(sab?'lunes':'día siguiente')+' queda saliente solo')
      :' · el post-guardia automático está apagado: lo pones tú')};}
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
function planBatches(days){
  const need={};
  days.forEach(d=>{if(!d.shiftId)return;
    slotsFor(d.shiftId).forEach(s=>{const q=dishQty(slotItems(d.shiftId,s).items);
      Object.keys(q).forEach(id=>{need[id]=(need[id]||0)+q[id];});});});
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
function dayLine(d){
  const sh=shiftById(d.shiftId);
  if(!sh)return '<span class="mini">sin asignar</span>';
  const g=isGuardia(sh),rh=rhythmOf(sh.id,d.key);
  const jo=d.key?jornadaOf(d.key):jornadaEn((((d.idx||0)+1)%7),d.shiftId,false);
  const t=[];
  if(rh.wake)t.push('⏰ '+fmtTimeOut(rh.wake));
  if(sh.start)t.push((g?'🩺 ':'💼 ')+fmtTimeOut(sh.start)+(sh.end?'–'+fmtTimeOut(sh.end):'')+
    (jo&&sh.start!==jo.start?(' · jornada '+fmtTimeOut(jo.start)+'–'+fmtTimeOut(jo.end)):''));
  else if(jo)t.push('💼 '+fmtTimeOut(jo.start)+'–'+fmtTimeOut(jo.end));
  else if(rh.leave)t.push('🚌 '+fmtTimeOut(rh.leave));
  if(rh.sleep)t.push('🛌 '+fmtTimeOut(rh.sleep));
  const gl=d.key?gymLine(d.key):'';if(gl)t.push(gl);
  const gs=d.key?resumenGym(d.key):'';if(gs)t.push('🏋️ '+gs);
  return t.join(' · ')||esc(sh.name);}
function staplesFor(days){
  /* los básicos del desayuno rápido: no son tanda, pero hay que comprarlos */
  const need={},items=[];
  days.forEach(function(d){const sh=shiftById(d.shiftId);if(!sh)return;
    slotsFor(sh.id).forEach(function(sl){
      const inf=slotItems(sh.id,sl);
      (inf.items||[]).forEach(function(it){const dd=dishById(it.id);if(!dd||isBatch(dd.batchId))return;
        const q=num(it.portions,1);items.push({d:dd,q:q,batch:!!(inf.name&&inf.meal)});});});});
  items.forEach(function(x){need[x.d.id]=need[x.d.id]||{d:x.d,q:0,viaMeal:false};
    need[x.d.id].q+=x.q;if(x.viaMeal)need[x.d.id].viaMeal=true;});
  return Object.keys(need).map(k=>need[k]).sort((a,b)=>a.d.name.localeCompare(b.d.name,'es'));}
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
  return out.length+' guardia(s) ('+gTiposTxt(g)+'), cada una con su saliente al día siguiente (si cae en sábado, el lunes)'+
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
/* ===================== comida: productos, escáner y cuenta de calorías ===================== */
function food(){
  if(!store.food||typeof store.food!=='object')store.food={objetivo:{kcal:0,prot:0},eans:{},log:{},fav:[]};
  const f=store.food;
  if(!f.eans||typeof f.eans!=='object')f.eans={};
  if(!f.log||typeof f.log!=='object')f.log={};
  if(!Array.isArray(f.fav))f.fav=[];
  if(!f.objetivo||typeof f.objetivo!=='object')f.objetivo={kcal:0,prot:0};
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
function porcionDe(p,g){
  /* las calorías enteras y los macro al décimo: es lo que se lee en un envase */
  const q=Math.max(0,+g||0)/100,o={};
  ['kcal','prot','carb','gresa','azucar','fibra','sal'].forEach(function(k){const v=(+p[k]||0)*q;
    o[k]=(k==='kcal')?Math.round(v):Math.round(v*10)/10;});
  return o;}
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
  if(e.ean){const p=food().eans[e.ean]||e;const g=Math.max(5,(+e.g||0)+(+delta||0));
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
function buscarOffNombre(txt){
  const t=String(txt||'').trim();
  if(t.length<3)return Promise.resolve({ok:false,msg:'escribe al menos 3 letras del producto'});
  if(typeof fetch!=='function')return Promise.resolve({ok:false,msg:'este navegador no sale a la red'});
  const url=offUrl('cgi/search.pl?search_terms='+encodeURIComponent(t)+
    '&search_simple=1&action=process&json=1&page_size=16&fields=code,product_name,brands,quantity,nutriments');
  return fetch(url).then(function(r){return r.json();})
    .then(function(j){const list=((j&&j.products)||[]).map(mapOffProduct).filter(Boolean).slice(0,10);
      return {ok:list.length>0,list:list,msg:list.length?(list.length+' producto(s) para «'+t+'»'):'nada por ahí con «'+t+'»: prueba con el código de barras'};})
    .catch(function(e){return {ok:false,msg:'no he podido consultar: '+((e&&e.message)||'sin red')};});}
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
      return 'cámara abierta: acerca el código del paquete: se pilla solo';
    }
      return 'este navegador no lee códigos con la cámara: escribe el número debajo (hace lo mismo)';
  }).catch(function(e){return 'no he podido abrir la cámara ('+((e&&e.message)||'permiso denegado')+'): usa el buscador';});}
function pararEscaner(){
  if(ui.scanRaf)cancelAnimationFrame(ui.scanRaf);ui.scanRaf=null;
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

/* ===================== render: hoy (pantalla de inicio) ===================== */
function renderHoy(){
  const now=new Date(),hoy=iso(now),inf=dayInfo(hoy),sh=shiftById(inf.shiftId);
  const sl=sleepOf(hoy,inf),nt=nightOf(hoy,sl);
  const ft=foodTotals(hoy),pl=planTotalsOf(hoy),ob=(store.food&&store.food.objetivo)||{kcal:0,prot:0};
  const nowHM=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  const fecha=DAYN[(now.getDay()+6)%7]+' '+now.getDate()+' de '+MONTH_FULL[now.getMonth()];
  const slots=sh?slotsFor(sh.id):[];
  let nextIdx=-1;slots.forEach(function(s,i){if(nextIdx<0&&(s.time||'')>=nowHM)nextIdx=i;});
  const mealRows=slots.map(function(s,i){
    const info=slotItems(sh.id,s),t=totals(info.items);
    const dishTxt=info.items.map(function(it){const dd=dishById(it.id);if(!dd)return '';const q=num(it.portions,1);
      return esc(dd.icon)+' '+esc(dd.name)+(q!==1?' ('+rac(q)+')':'');}).filter(Boolean).join(' + ')||'<i>sin asignar</i>';
    const pasada=(s.time||'')&&(s.time||'')<nowHM&&i!==nextIdx;
    return '<div class="meal'+(i===nextIdx?' next':'')+(pasada?' past':'')+'"><span class="mt">'+esc(s.time||'·')+'</span><span>'+
      '<span class="ml">'+esc(s.label||'')+(i===nextIdx?' <span class="tag b2">siguiente</span>':'')+'</span>'+
      '<span class="mn">'+dishTxt+'</span>'+
      (t.kcal?'<span class="md">'+t.kcal+' kcal · '+t.prot+' g P'+(info.name?' · 🍱 '+esc(info.name):'')+'</span>':'')+
      (info.items.length?'<button class="btn s" style="margin-top:5px" data-a="hoy-log-slot" data-shift="'+sh.id+'" data-slot="'+s.id+'">✓ ya me la he comido</button>':'')+
      '</span></div>';}).join('');
  const estado=inf.vac?('🏖️ Vacaciones'+(inf.vac.label?' · '+esc(inf.vac.label):'')):
    (sh?(esc(sh.icon)+' '+esc(sh.name)+(inf.guard?' · '+esc(inf.guard):'')+(sh.start?' · '+esc(sh.start)+(sh.end?'–'+esc(sh.end):''):'')):'sin día asignado');
  const guardiaHoy=!inf.vac&&sh&&isGuardia(sh);
  $('#main').innerHTML='<div class="grid">'+
    '<div class="card"><h2>☀️ Hoy · '+esc(fecha)+'</h2>'+
    '<div class="row" style="align-items:baseline"><b style="font-size:17px">'+estado+'</b>'+
    (guardiaHoy?'<span class="tag b1">de guardia</span>':'')+'</div>'+
    (sl.h!=null?'<p class="mini" style="margin-top:6px">🛌 dormiste '+fmtHM(sl.h*60)+(sl.h<suenoCfg().min?' ⚠ menos de lo tuyo':'')+
      (nt.rec?' · esta noche, a la cama sobre las '+esc(nt.rec):'')+'</p>':
      (nt.rec?'<p class="mini" style="margin-top:6px">🛌 para dormir lo tuyo, a la cama sobre las '+esc(nt.rec)+'</p>':''))+
    '<div style="margin-top:10px">'+
      barRow('apuntado hoy',ft.kcal,+ob.kcal||0,'',' kcal')+
      (pl.kcal?barRow('plan de tus menús',pl.kcal,+ob.kcal||0,'plan',' kcal'):'')+
    '</div>'+
    '<div class="row" style="margin-top:10px">'+
      '<button class="btn s" data-a="tab" data-t="food">🍽 apuntar comida</button>'+
      '<button class="btn s" data-a="tab" data-t="week">ver toda la semana</button>'+
      '<button class="btn s" data-a="tab" data-t="month">ver el mes</button>'+
    '</div></div>'+
    '<div class="card"><h2>Comidas de hoy</h2>'+
    (slots.length?mealRows:'<div class="empty">'+(sh?'Este tipo de día no tiene comidas montadas todavía: abre «Días y menús».':
      'Hoy no tiene un tipo de día asignado: ponlo en «Mes» o «Turno y rotación».')+'</div>')+
    '</div></div>';
}
/* ===================== render: semana ===================== */
function renderWeek(){
  const r=store.rotation, days=weekDays();
  const sleepStats=(function(){const c=suenoCfg();return function(){
    let n=0,t=0,low=0;const min=c.min;
    days.forEach(function(d){if(!d.date)return;const sl=sleepOf(d.key);
      if(sl.h==null||!d.shiftId)return;n++;t+=sl.h;if(sl.h<min)low++;});
    return {n:n,avg:n?Math.round(t/n*10)/10:null,low:low,min:min};};})();
  const modeSeg=`<div class="row">
    <button class="btn s ${r.mode==='template'?'p':''}" data-a="mode-template">Plantilla (1 o 2 guardias)</button>
    <button class="btn s ${r.mode==='date'?'p':''}" data-a="mode-date">Por fecha · rotación</button>
    ${r.mode==='template'?`<select id="patSel" data-a="pat-sel" style="max-width:260px">${store.patterns.map((p,i)=>`<option value="${p.id}" ${i===r.pattern?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`
      :`<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink2)">lunes de ref.
        <input type="date" value="${esc(r.anchor||'')}" data-a="rot-anchor" style="width:145px"></label>
       <button class="btn s" data-a="today">hoy</button>`}
    <span class="sp"></span>
    <button class="btn s" data-a="autofill">Autocompletar semanas desde mi turno</button>
  </div>`;
  const anyDate=days.some(function(d){return !!d.date;});
  const ss=sleepStats();
  const dayItems=function(d){const sh=shiftById(d.shiftId);if(!sh)return [];const out=[];
    slotsFor(sh.id).forEach(function(sl){out.push.apply(out,slotItems(sh.id,sl).items);});return out;};
  const rows=days.map(function(d,i){
    const sh=shiftById(d.shiftId);
    const open=ui.openDays.has(d.key||('tpl'+d.idx));
    const rh=sh?rhythmOf(sh.id,d.key):{};
    const sl=d.key?sleepOf(d.key):{h:null};
    const nt=d.key?nightOf(d.key):{rec:''};
    const t=totals(dayItems(d));
    const mealHtml=sh?(slotsFor(sh.id).map(function(x){
        const inf=slotItems(sh.id,x),tt=totals(inf.items),bs=[];
        Object.keys(dishQty(inf.items)).forEach(function(idx){const dd=dishById(idx);
          if(dd&&isBatch(dd.batchId)&&bs.indexOf(dd.batchId)<0)bs.push(dd.batchId);});
        const dishTxt=inf.items.map(function(it){const dd=dishById(it.id);if(!dd)return '';const q=num(it.portions,1);
          return esc(dd.icon)+' '+esc(dd.name)+(q!==1?' ('+rac(q)+')':'');}).filter(Boolean).join(' + ')||'<i>sin asignar</i>';
        return '<div class="meal compact"><span class="mt">'+esc(x.time||'·')+'</span><span>'+
          '<span class="ml">'+esc(x.label||'')+'</span><span class="mn">'+dishTxt+'</span>'+
          '<span class="md">'+esc(inf.name?('🍱 '+inf.name+' · '):'')+esc(tt.kcal?(tt.kcal+' kcal · '+tt.prot+' g P'):'')+
          bs.map(function(b){return ' <span class="tag '+tagFor(b)+'">'+esc((batchById(b)||{}).label||'')+'</span>';}).join('')+
          '</span></span></div>';}).join(''))
      :'<div class="empty">Día sin asignar: elige qué es (y si toca guardia, de qué).</div>';
    const pick='<select data-a="day-pick" data-i="'+i+'" onchange="PG.render()" style="max-width:190px">'+
      '<option value="">— sin día —</option>'+store.shifts.map(function(x){
        return '<option value="'+x.id+'" '+(x.id===d.shiftId?'selected':'')+'>'+esc(x.icon)+' '+esc(x.name)+'</option>';}).join('')+'</select>';
    const head='<span class="drday">'+d.short+(d.sub?' '+d.sub:'')+'</span>'+
      '<span class="drtag" style="color:'+(sh?sh.color:'var(--ink2)')+'">'+
        (sh?esc(sh.icon)+' '+esc(sh.name)+(d.guard?' · '+esc(d.guard):''):'sin asignar')+'</span>'+
      '<span class="drsch">'+(sh?esc(dayLine(d)):'—')+'</span>'+
      (!anyDate&&sh&&rh.sleep?'<span class="drsleep">🛌 '+esc(schedLine(sh.id,null).replace(/^🛌 /,''))+'</span>':'')+
      (d.key&&sl.h!=null?'<span class="drsleep'+(sl.h<suenoCfg().min?' low':'')+'" title="mínimo '+suenoCfg().min+' h">'+
        (sl.h<suenoCfg().min?'⚠ ':'')+fmtHM(sl.h*60)+' de sueño'+
        (sl.h<suenoCfg().min&&nt.rec?(' · a la cama '+nt.rec):'')+'</span>':'')+
      '<span class="sp"></span>'+
      (d.key&&foodLog(d.key).length?'<span class="drnum" title="lo que llevas apuntado en la pestaña Comida">🍽 '+foodTotals(d.key).kcal+' kcal apuntadas</span>':'')+
      '<span class="drnum">'+(sh?(t.kcal+' kcal · '+t.parts+' rac.'):'—')+'</span>'+
      '<span class="mini">'+(open?'▴':'▾')+'</span>';
    const det='<div class="drdet">'+mealHtml+
      '<div class="row" style="margin-top:9px">'+
        (sh?'<button class="btn s" data-a="day-edit" data-id="'+sh.id+'">abrir menús de este tipo de día</button>':'')+
        (anyDate&&d.key?'<button class="btn s" data-a="mon-day" data-key="'+d.key+'">cambiar qué día es</button>':pick)+
        (sh&&anyDate?'<button class="btn s" data-a="day-quickbf" data-i="'+i+'">desayuno rápido de diario</button>':'')+
      '</div>'+
      (sh&&anyDate?'<div class="row" style="margin-top:6px"><span class="mini">🛌 '+esc(rh.sleep||'—')+' → ⏰ '+esc(rh.wake||'—')+
        (rh.leave?' · 🚌 '+esc(rh.leave)+' → '+esc(rh.arrive||''):'')+'</span>'+
        '<button class="btn s" data-a="day-rhythm" data-key="'+d.key+'">cambiar estas horas</button></div>':'')+
      '</div>';
    return '<div class="drow'+(open?' open':'')+'">'+
      '<div class="drmain" data-a="day-open" data-key="'+(d.key||('tpl'+d.idx))+'" role="button" tabindex="0" '+
      'aria-expanded="'+(open?'true':'false')+'">'+head+'</div>'+
      (open?det:'')+'</div>';}).join('');
    const pb=planBatches(days), used=Object.keys(pb).map(k=>pb[k]).filter(b=>b.hasNeed);
  const g=days.filter(function(d){const sh=shiftById(d.shiftId);return sh&&isGuardia(sh)&&(!d.guard||true);}).length;
  const sessions=used.reduce((a,b)=>a+b.items.filter(i=>i.runs>0).length,0);
  const portions=used.reduce((a,b)=>a+b.portions,0);
  const tot=days.reduce((a,d)=>{const t=dayTotals(d.shiftId);a.k+=t.kcal;a.p+=t.prot;return a;},{k:0,p:0});
  $('#main').innerHTML=`<div class="grid">
    <div class="card">${modeSeg}
      ${store.patterns[r.pattern]&&r.mode==='template'?`<p class="note" style="margin:10px 0 0">${esc(store.patterns[r.pattern].note||'')} Cambia cualquier día abajo y la semana se adapta (menús, tandas y compra).</p>`:
      (r.mode==='date'?`<p class="note" style="margin:10px 0 0">Ciclo de ${store.patterns.length} semana(s): <b>${esc(store.patterns.map(p=>p.days.join('·')).join('  |  '))}</b>. Ancla la rotación al lunes de una semana con 1 guardia.</p>`:'')}
      ${store.patterns.length>1?rotationStrip():''}
      <div class="row" style="margin-top:10px">
        <button class="btn s" data-a="wk-expand-all">${allOpen()?'cerrar todos':'abrir todos'}</button>
        ${anyDate?`<span class="mini">toca un día para ver o esconder sus comidas · las horas se cuentan por fecha en «Mes»</span>
          <button class="btn s" data-a="mode-date">ver mi semana real</button>`
        :`<span class="mini">toca un día para ver o esconder sus comidas</span>
          <button class="btn s" data-a="tab" data-t="month">organizar el mes →</button>`}</div>
      <div class="kpis">
        <div><b>${g}</b><span>guardias</span></div>
        <div><b>${used.length}</b><span>sesiones de cocina</span></div>
        <div><b>${portions}</b><span>raciones a preparar</span></div>
        <div><b>${g?Math.round(tot.k/7*10)/10:0}</b><span>kcal/día de media</span></div>
        <div><b>${g?Math.round(tot.p/7):0} g</b><span>proteína/día</span></div>
        ${anyDate?`<div><b>${ss.avg!=null?ss.avg+'h':'—'}</b><span>sueño de media</span></div>
        <div><b>${ss.low}</b><span>noches con &lt;${ss.min} h</span></div>`:''}
      </div>
      ${g>0&&used.length===0?'<p class="note" style="margin:10px 0 0;color:var(--warn)">⚠ Hay días de guardia pero ningún plato marcado como lote: se comería cada día cocinando de cero.</p>':''}
    </div>
    <div class="daylist">${rows}</div>
    <div class="grid g2">
      <div class="card"><h2>Lo que hay que cocinar esta semana</h2><p class="note">Suma las raciones que tocan en todos los días (guardia, saliente, fuerza, libre) y las redondea a tandas completas.</p>
        ${used.length?used.map(b=>`<div class="row" style="justify-content:space-between;padding:6px 0;border-top:1px dashed var(--line)">
          <span><b>${esc(b.label)}</b> <span class="mini">${esc(b.when||'')}</span><br>
          <span class="mini">${b.items.filter(i=>i.runs>0).map(i=>esc(i.dish.name)+(i.cooked>i.needPort?' (sobra '+(Math.round((i.cooked-i.needPort)*10)/10)+' rac. → congelador)':'')).join(' · ')}</span></span>
          <span class="mini"><b style="font-size:14px">${b.portions}</b> rac. <button class="btn s" data-a="tab" data-t="batches">abrir →</button></span></div>`).join('')
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
  return '<div class="card"><h2>🏖️ Vacaciones</h2>'+
    '<p class="note">Marca el rango y esos días quedan como día de vacaciones: no cuentan la jornada de diario, '+
    'no entran en el reparto de guardias y la cocina se hace con lo que de verdad estás en casa. '+
    'Lo que tú pongas a mano en un día manda sobre el rango.</p>'+
    '<div class="row" style="margin-top:6px"><label class="fld">Desde<input type="date" id="vacA" value="'+iso(first)+'"></label>'+
    '<label class="fld">Hasta<input type="date" id="vacB" value="'+iso(last)+'"></label>'+
    '<label class="fld" style="flex:1">Nombre<input id="vacL" placeholder="agosto, verano, con los niños…"></label>'+
    '<button class="btn p" data-a="vac-add">marcar</button></div>'+
    (vs.length?'<div style="margin-top:8px">'+vs.map(vacRangeRow).join('')+'</div>'
      :'<div class="empty" style="margin-top:8px">Sin vacaciones apuntadas todavía.</div>')+
    '<div class="row" style="margin-top:8px"><span class="mini">en '+MONTH_FULL[mo]+': '+toc+' rango(s) que caen aquí · '+
      (list||[]).filter(function(d){return d.vac;}).length+' día(s) marcados</span></div></div>';}
function jornadaCard(){
  const j=store.rotation.jornada||{start:'',end:'',workdays:[1,2,3,4,5]},vs=store.rotation.vacaciones||[];
  const DN=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  return '<div class="card"><h2>2b · La jornada de diario y tus vacaciones</h2>'+
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
function serviciosCard(){
  const r=store.rotation,now=new Date();
  const desde=(document.getElementById('svcDesde')||{}).value||now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const hasta=(document.getElementById('svcHasta')||{}).value||(now.getFullYear()+(now.getMonth()>5?1:0))+'-06';
  const per=+( (document.getElementById('svcMeses')||{}).value||1);
  const dm=/^(\d{4})-(\d{2})$/.exec(desde),hm=/^(\d{4})-(\d{2})$/.exec(hasta);
  const ciclo=dm&&hm?cicloServicios(+dm[1],+dm[2]-1,+hm[1],+hm[2]-1,per,r.servicios):[];
  const cur=store.rotation.month||{};
  return '<div class="card"><h2>🔁 Tus servicios <span class="mini">'+
    (r.servicios||[]).length+' · hasta '+(hm?MON[+hm[2]-1]+' '+hm[1]:'—')+'</span></h2>'+
    '<p class="note">Rotas <b>'+(r.servicios||[]).map(esc).join(', ')+'</b>. Nada de urgencias ni UMI: aquí manda tu lista. '+
    'Elije desde qué mes, cuántos meses se está en cada servicio y date al botón; la app escribe en cada mes el servicio que toca '+
    'y sus guardias, que luego mueves tú día a día.</p>'+
    '<div class="fgrid c3"><label class="fld">Empieza en<input type="month" id="svcDesde" value="'+desde+'" data-a="svc-m"></label>'+
      '<label class="fld">Meses por servicio<select id="svcMeses" data-a="svc-m"><option value="1" '+(per===1?'selected':'')+'>1 mes en cada sitio</option>'+
        '<option value="2" '+(per===2?'selected':'')+'>2 meses en cada sitio</option></select></label>'+
      '<label class="fld">Hasta<input type="month" id="svcHasta" value="'+hasta+'" data-a="svc-m"></label></div>'+
    '<div class="row" style="margin-top:8px"><label class="fld" style="flex:0 0 120px">Guardias por mes'+
      '<input type="number" min="0" max="15" value="'+(r.guardiasMes!=null?r.guardiasMes:6)+'" data-a="guard-default"></label>'+
      '<span class="sp"></span><button class="btn p" data-a="svc-plan">repartir el ciclo</button>'+
      '<button class="btn s" data-a="svc-clear">quitar el reparto</button></div>'+
    '<div style="margin-top:10px"><span class="mini">servicios (se editan en el sitio):</span>'+
    '<div class="row" style="margin-top:4px">'+(r.servicios||[]).map(function(x,ix){
      return '<span class="tag b2" style="gap:2px;padding:2px 4px 2px 8px"><input style="border:0;background:none;font-weight:700;color:inherit;width:'+
        Math.max(6,x.length)+'ch" value="'+esc(x)+'" data-a="svc-edit" data-ix="'+ix+'">'+
        '<button class="btn d s" data-a="svc-del" data-ix="'+ix+'" title="quitar">×</button></span>';}).join('')+
      '<button class="btn s" data-a="svc-add">+ servicio</button></div></div>'+
    (ciclo.length?'<div style="margin-top:10px"><table><thead><tr><th>Mes</th><th>Servicio</th><th>Guardias</th><th>Puestas</th></tr></thead><tbody>'+
      ciclo.map(function(c){const mm=cur[c.key]||{},gc=guardCount(c.y,c.m);
        return '<tr><td>'+MON[c.m]+' '+c.y+'</td><td>'+esc(mm.service||c.service)+
          (mm.service?'':' <span class="mini">· propuesto</span>')+'</td><td>'+(mm.guardias!=null?mm.guardias:r.guardiasMes)+
          '</td><td>'+(gc.any||'—')+'</td></tr>';}).join('')+'</tbody></table></div>':'')+
    '</div>';}
function renderMonth(){
  const y=monthDate.getFullYear(),mo=monthDate.getMonth(),svc=monthService(y,mo),g=guardCount(y,mo);
  const list=monthDays(y,mo),lead=(new Date(y,mo,1).getDay()+6)%7;
  const cells=[];for(let i=0;i<lead;i++)cells.push('<span></span>');
  list.forEach(function(d){
    const ov=dayOverride(d.key),manual=d.over||(store.rotation.shiftByDay[d.key]!==undefined);
    const seg=d.key?diaSegundo(d.key,d.inf):null;
    cells.push('<button class="dbox'+(d.shiftId?' on':' blank')+'" data-a="mon-day" data-key="'+d.key+'"'+
      ' style="border-top-color:'+(d.color||'var(--line)')+'" title="'+esc(d.name)+(manual?' · puesto a mano':'')+'">'+
      '<span class="dnum">'+d.date.getDate()+'</span>'+
      '<span class="dnm">'+(d.shiftId?esc(d.icon)+' '+esc(d.name):'·')+'</span>'+
      (d.guard?'<span class="dflag" title="tipo de guardia: '+esc(gEtiqueta(d.guard))+'">'+esc(String(d.guard).toUpperCase().slice(0,9))+'</span>':'')+
      (d.vac?'<span class="dflag vac">VAC</span>':'')+
      (d.jor?'<span class="djob">'+fmtTimeOut(d.jor.start)+'–'+fmtTimeOut(d.jor.end)+'</span>':'')+
      (seg&&seg.on?'<span class="dgym" title="segundo entreno: '+esc(seg.tipo||'entreno')+' a las '+esc(seg.hora||'—')+'">🏊</span>':'')+
      (d.sleepH!=null?'<span class="dsl'+(d.sleepH<(store.sueno?store.sueno.min:8)?' low':'')+'">🛌 '+fmtHM(d.sleepH*60)+
        (d.sleepH<(store.sueno?store.sueno.min:8)?' ⚠':'')+'</span>':'')+
      (manual?'<span class="dsl" title="puesto a mano">✎</span>':'')+'</button>');});
  const fiascos=list.filter(function(d){return d.shiftId&&d.sleepH!=null&&d.sleepH<(store.sueno?store.sueno.min:8);}).length;
  const conSueño=list.filter(function(d){return d.sleepH!=null;});
  const media=conSueño.length?Math.round(conSueño.reduce(function(a,d){return a+d.sleepH;},0)/conSueño.length*10)/10:null;
  $('#main').innerHTML=`<div class="grid">
    <div class="card"><h2>🗓️ ${MONTH_FULL[mo]} de ${y}</h2>
      <p class="note"><b>Primero, lo que trabajas:</b> de ${esc((store.rotation.jornada||{}).start||'08:00')} a ${esc((store.rotation.jornada||{}).end||'15:00')} los ${((store.rotation.jornada||{}).workdays||[1,2,3,4,5]).length} días laborables de la semana, en <b>todos</b> los meses, aunque la plantilla no diga nada. Encima van tus guardias (toca un día y márcalo: el día siguiente se queda como saliente solo; si la guardia es en sábado, el saliente es el lunes) y tus vacaciones. Cada guardia lleva su <b>tipo</b> —Urgencias o UMI—: <b>no</b> es del servicio del mes, eso es otra cosa y se marca aparte. Lo que marques a mano manda sobre la plantilla y luego lo vuelcas a «Semana».</p>
      <div class="row">
        <button class="btn s" data-a="mon-prev">‹</button>
        <input type="month" value="${y}-${String(mo+1).padStart(2,'0')}" data-a="mon-set" style="width:160px">
        <button class="btn s" data-a="mon-next">›</button>
        <button class="btn s" data-a="mon-today">mes actual</button>
        <span class="sp"></span>
        <button class="btn s" data-a="mon-auto">repartir ${svc.guardias} guardias</button>
        <button class="btn s" data-a="mon-clear">vaciar mes</button></div>
      <div class="row" style="margin-top:10px">
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
      <div class="kpis">
        <div><b>${list.filter(function(d){return d.jor||/trabajo|fuerza/i.test(d.name);}).length}</b><span>días de ${esc((store.rotation.jornada||{}).start||'08:00')}–${esc((store.rotation.jornada||{}).end||'15:00')}</span></div>
        <div><b>${g.any}/${svc.guardias}</b><span>guardias · ${esc(gTiposTxt(g))}</span></div>
        <div><b>${list.filter(function(d){return /saliente/i.test(d.name);}).length}</b><span>días salientes</span></div>
        <div><b>${media||'—'}${media!=null?'h':''}</b><span>sueño de media</span></div>
        <div><b>${fiascos}</b><span>noches con menos de ${store.sueno?store.sueno.min:8} h</span></div>
        <div><b>${list.filter(function(d){return d.over&&d.shiftId;}).length}</b><span>días escritos a mano</span></div>
        <div><b>${acostarsePara(despertarBase())}</b><span>acostarse para ${store.sueno?store.sueno.min:8} h</span></div>
        <div><b>${list.filter(function(d){return d.vac;}).length}</b><span>días de vacaciones</span></div>
      </div>
      <div class="cal"><span class="wd">Lun</span><span class="wd">Mar</span><span class="wd">Mié</span><span class="wd">Jue</span><span class="wd">Vie</span><span class="wd">Sáb</span><span class="wd">Dom</span>${cells.join('')}</div>
      <div class="row" style="margin-top:10px">
        <span class="mini">${list.filter(function(d){return d.over;}).length} día(s) puestos a mano · ${list.length-list.filter(function(d){return d.over;}).length} salen de la plantilla/rotación</span>
      <span class="sp"></span><span class="mini">horas de hoy: ${esc((function(){var td=list.filter(function(d){return d.key===iso(new Date());})[0];
          return td?dayLine(td):'sin asignar';})())}</span>
        <span class="sp"></span><button class="btn s" data-a="mon-sync">volcar al calendario de «Semana»</button></div>
      <p class="mini" style="margin-top:6px">${(g.por&&g.por.sin)?g.por.sin+' guardia(s) sin tipo —tócalas y elige '+(gTipos().map(function(t){return t.label;}).join(' o '))+' · ':''}${!svc.set&&!store.rotation.monthService
        ?'el servicio del mes (dónde trabajas) lo pones tú; las guardias van por tipo y no dependen de eso'
        :(g.any!==svc.guardias?'⚠ el mes lleva '+g.any+' guardias y el cupo pide '+svc.guardias+' ('+esc(gTiposTxt(g))+')'
          :'cupo cubierto: '+esc(gTiposTxt(g))+' · '+list.filter(function(d){return /saliente/i.test(d.name);}).length+' salientes')}</p></div>
    ${serviciosCard()}
    ${vacCardMonth(y,mo,list)}
    <div class="card"><h2>Cómo va quedando el mes</h2>
      <div class="row no-print" style="margin-bottom:6px"><button class="btn s" data-a="mon-auto-rep">repartir desde cero</button>
        <span class="mini">sobrescribe lo que hayas puesto tú en este mes</span></div>
      <p class="note">Cada guardia arrastra su día saliente al día siguiente; si la guardia cae en sábado, el saliente es el lunes (el domingo se descansa en casa). Los laborables sin marcar salen ya con la jornada puesta.</p>
      <details class="dtip"><summary class="mini">ver el mes día a día, con horas (${list.length} días — el calendario de arriba ya resume esto)</summary>
      <div style="margin-top:6px">${list.map(function(d){const sh=shiftById(d.shiftId);if(!sh)return '';
        return `<div class="row" style="padding:4px 0;border-top:1px dashed var(--line);font-size:12px">
          <b style="min-width:96px">${DAYSH[d.wday]} ${d.date.getDate()}</b>
          <span style="min-width:132px">${esc(d.icon)} ${esc(sh.name)}${d.guard?' · '+esc(d.guard):''}</span>
          <span class="mini">${esc(dayLine(d))}</span></div>`;}).join('')||'<div class="empty">Mes vacío: reparte las guardias o asígnalas día a día.</div>'}</div></details></div>
  </div>`;}
function renderDayModal(dateStr){
  const d=parseDate(dateStr);if(!d)return;
  const sel='<select data-a="day-sel" data-key="'+iso(d)+'" style="max-width:200px"><option value="">— sin día —</option>'+
    store.shifts.map(function(x){return '<option value="'+x.id+'" '+(dayInfo(iso(d)).shiftId===x.id?'selected':'')+'>'+esc(x.icon)+' '+esc(x.name)+'</option>';}).join('')+'</select>';
  const info=dayInfo(dateStr),key=iso(d);
  const opts=store.shifts.map(function(s){
    return '<button class="btn s '+(info.shiftId===s.id?'p':'')+'" data-a="day-set" data-key="'+key+'" data-sid="'+s.id+'" data-guard="">'+
      esc(s.icon)+' '+esc(s.name)+'</button>';}).join('');
  const gd=store.shifts.filter(isGuardia),tipos=gTipos();
  const guardBtn=gd.length?('<span class="mini">'+(d.getDay()===6
      ?'eres sábado: el saliente cae en lunes':'el día siguiente queda saliente solo')+'</span>'+
    tipos.map(function(t){const on=info.shiftId===gd[0].id&&String(info.guard||'').toLowerCase()===t.code;
      return '<button class="btn s '+(on?'p':'')+'" data-a="day-guardia" data-key="'+key+'" data-guard="'+t.code+'">'+
        (on?'✓ ':'')+'🩺 '+esc(t.label)+'</button>';}).join('')+
    (info.shiftId===gd[0].id?'<button class="btn s" data-a="day-guardia" data-key="'+key+'" data-guard="">quitar guardia y saliente</button>':'')+
    (info.guard?'<span class="mini">ahora: '+esc(gEtiqueta(info.guard))+'</span>':''))
    :'<span class="mini">marca en «Turno y rotación» qué tipo de día es guardia (carga alta y nombre con «guardia»)</span>';

  openModal('Asignar el '+d.getDate()+' de '+MON[d.getMonth()]+
    '<span class="mini"> · '+DAYN[(d.getDay()+6)%7]+(info.shiftId?' · ahora: '+esc((shiftById(info.shiftId)||{}).name||'')+' · lo pusiste tú':' · ahora: lo que diga la plantilla')+'</span>',
    '<p class="note">Elige qué día es. Al marcar una guardia se pone solo el saliente del día de después; al quitarla, se quita también si lo puso la app.</p>'+
    '<div class="row">'+opts+'</div><div class="row" style="margin-top:8px;gap:8px">'+guardBtn+'</div>'+
    '<div class="row" style="margin-top:12px;border-top:1px dashed var(--line);padding-top:10px">'+
      '<span class="mini">o elige el día sin guardar:</span>'+sel+
      '<button class="btn s" data-a="day-set" data-key="'+key+'" data-sid="" data-guard="">quitar lo puesto</button>'+
      '<button class="btn s '+(diaSegundo(key).on?'g':'')+'" data-a="gym-seg-hoy" data-key="'+key+'">'+
        (diaSegundo(key).on?'✓':'○')+' 🏊 segundo entreno</button>'+
      '<span class="sp"></span><button class="btn s" data-a="day-rhythm" data-key="'+key+'">editar horas 🛌⏰</button></div>',null);
}

/* ===================== entreno: biblioteca de openGym, segundo día y registro ===================== */
const GYM_URL='https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/data/exercises.json';
const GYM_SITIO='https://opengym-bc111a.gitlab.io/#/library';
const GYM_DIAS=['dom','lun','mar','mié','jue','vie','sáb'];
function gymS(){
  if(!store.gym||typeof store.gym!=='object')
    store.gym={biblioteca:[],rutina:[],registro:[],fav:[],fuente:'',marks:{},
      segundo:{on:true,dias:[3],tipo:'piscina',hora:'15:30'}};
  const g=store.gym;
  ['biblioteca','rutina','registro','fav'].forEach(function(k){if(!Array.isArray(g[k]))g[k]=[];});
  if(!g.segundo||typeof g.segundo!=='object')g.segundo={on:true,dias:[3],tipo:'piscina',hora:'15:30'};
  if(!Array.isArray(g.segundo.dias))g.segundo.dias=[3];
  if(!g.marks||typeof g.marks!=='object')g.marks={};
  return g;}
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
function addRutina(nombre,det){
  det=det||{};
  const g=gymS(),nm=String(nombre||'').trim();
  if(!nm)return 'escribe el ejercicio (o búscalo en la biblioteca y dale a «a la rutina»)';
  const ex=g.biblioteca.filter(function(x){return x.n===nm||x.id===nm;})[0]||{};
  if(g.rutina.some(function(r){return r.ex===nm;}))return '«'+nm+'» ya está en la rutina';
  g.rutina.push({ex:nm,series:Math.max(1,+det.series||3),reps:Math.max(1,+det.reps||8),c:ex.c||'',eq:ex.eq||''});
  save();render();return 'añadido a la rutina: '+nm;}
function delRutina(ix){const g=gymS(),r=g.rutina[ix];if(!r)return 'ese ya no estaba';
  g.rutina.splice(ix,1);save();render();return 'quitado de la rutina: '+r.ex;}
function setRutina(ix,campo,val){const r=gymS().rutina[ix];if(!r)return;
  r[campo]=Math.max(1,Math.min(12,+val||1));save();}
function addSet(fecha,opt){
  opt=opt||{};
  const g=gymS(),k=foodKey(fecha)||iso(new Date());
  const nm=String(opt.ex||'').trim();
  if(!nm)return 'dime qué ejercicio es';
  const kg=Math.max(0,Math.round((+opt.kg||0)*10)/10),reps=Math.max(1,Math.min(200,+opt.reps||1));
  g.registro.push({id:uid('gs'),fecha:k,ex:nm,kg:kg,reps:reps,rpe:(+opt.rpe||0)||null,
    nota:String(opt.nota||'').slice(0,90),ts:Date.now()});
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
function pasarRutina(fecha){
  /* monta las series de la rutina con el último peso que usaste en cada una */
  const g=gymS(),k=foodKey(fecha)||iso(new Date());
  if(!g.rutina.length)return 'no tienes nada en la rutina: añade ejercicios arriba';
  let n=0;
  g.rutina.forEach(function(r){
    const ult=ejercicioUltimo(r.ex),kg=ult?ult.kg:0;
    for(let i=0;i<Math.max(1,+r.series||3);i++){
      g.registro.push({id:uid('gs'),fecha:k,ex:r.ex,kg:kg,reps:+r.reps||8,rpe:null,nota:'',ts:Date.now()});n++;}});
  save();
  return n+' series montadas de tu rutina ('+g.rutina.length+' ejercicios) con el último peso que usaste';}
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
  const antes={registro:g.registro.slice(),rutina:g.rutina.slice(),fav:(g.fav||[]).slice(),
    marks:JSON.parse(JSON.stringify(g.marks||{})),segundo:JSON.parse(JSON.stringify(g.segundo||{})),
    biblioteca:g.biblioteca.slice(),fuente:g.fuente||''};
  let n=0;
  if(que==='log'){n=g.registro.length;g.registro=[];}
  else if(que==='rut'){n=g.rutina.length;g.rutina=[];g.fav=[];}
  else if(que==='seg'){n=Object.keys(g.marks||{}).length;g.marks={};g.segundo=JSON.parse(JSON.stringify(fab));}
  else if(que==='all'){n=g.registro.length+g.rutina.length;
    g.registro=[];g.rutina=[];g.fav=[];g.marks={};g.segundo=JSON.parse(JSON.stringify(fab));}
  else if(que==='todo'){n=g.registro.length+g.rutina.length+g.biblioteca.length;
    g.registro=[];g.rutina=[];g.fav=[];g.marks={};g.biblioteca=[];g.fuente='';g.segundo=JSON.parse(JSON.stringify(fab));}
  else return {ok:false,msg:'no sé qué quieres limpiar'};
  ui.gymUndo={antes:antes,que:que};
  save();render();
  return {ok:true,n:n,que:que,
    msg:(n?('limpiado «'+que+'»: '+n+' cosa(s) fuera'):'eso ya estaba vacío')+
      (n?' · con «deshacer» vuelve tal cual':'')};}
function gymUndoWipe(){
  if(!ui.gymUndo)return {ok:false,msg:'no hay ningún borrado que deshacer ahora mismo'};
  const g=gymS(),a=ui.gymUndo.antes;
  g.registro=a.registro;g.rutina=a.rutina;g.fav=a.fav;g.marks=a.marks;g.segundo=a.segundo;
  g.biblioteca=a.biblioteca;g.fuente=a.fuente;
  ui.gymUndo=null;save();render();
  return {ok:true,msg:'restaurado: '+g.registro.length+' serie(s), '+g.rutina.length+' en la rutina'+
    (g.biblioteca.length?' y la biblioteca de '+g.biblioteca.length+' ejercicios':'')};}
/* ===================== comida: la vista (día, escáner, armario y objetivo) ===================== */
function barRow(lab,val,obj,cls,u){
  const pc=obj>0?Math.min(100,Math.round(val/obj*100)):(val>0?100:0);
  return '<div class="fb'+(cls?' '+cls:'')+'"><div class="fbt"><span>'+lab+'</span><b>'+val+(u||'')+'</b>'+
    (obj>0?('<span class="mini">de '+obj+' · '+pc+'%</span>'):'')+'</div>'+
    '<div class="fbar'+((obj>0&&val>obj)?' pasada':'')+'"><i style="width:'+pc+'%"></i></div></div>';}
function armarioHtml(f,prods,ver,sel){
  /* el armario de productos: filtro, tabla y acciones, sin liarse con paréntesis anidados */
  if(!prods.length)return '<div class="empty">Aún no has guardado ningún producto: escanea el primero arriba y de ahí sale todo lo demás.</div>';
  const filtro='<div class="row" style="margin-bottom:4px"><label class="fld" style="flex:1 1 200px">filtrar'+
    '<input id="fdQ" value="'+esc(ui.foodQ||'')+'" data-a="food-q" placeholder="nombre, marca o código"></label></div>';
  if(!ver.length)return filtro+'<div class="empty">Nada encaja con ese filtro.</div>';
  const filas=ver.map(function(x){
    const cab='<tr><td><b>'+esc(x.nombre)+'</b><br><span class="mini">'+esc(x.marca||'')+
      (x.ean?(' · '+x.ean):'')+(x.fuente?(' · '+esc(x.fuente)):'')+'</span></td>';
    const mac='<td class="chipnum">'+(x.kcal||0)+' kcal</td><td class="chipnum">'+(x.prot||0)+' g</td>';
    const pon='<td><span class="row" style="gap:4px"><input class="g" id="gq-'+x.ean+'" type="number" min="1" step="5" value="150">'+
      '<button class="btn s" data-a="fe-quick" data-key="'+sel+'" data-ean="'+x.ean+'" data-gq="gq-'+x.ean+'">apuntar</button></span></td>';
    const est='<td><span class="row" style="gap:3px;justify-content:flex-end">'+
      '<button class="btn s '+(f.fav.indexOf(x.ean)>=0?'g':'')+'" data-a="ean-fav" data-ean="'+x.ean+'" title="favorito" aria-pressed="'+(f.fav.indexOf(x.ean)>=0?'true':'false')+'">'+
      (f.fav.indexOf(x.ean)>=0?'★':'☆')+'</button>'+
      '<button class="btn d s" data-a="ean-del" data-ean="'+x.ean+'" title="quitar del armario">×</button></span></td></tr>';
    return cab+mac+pon+est;}).join('');
  return filtro+'<div style="overflow-x:auto"><table class="ptable"><thead><tr><th>Producto</th><th>por 100 g</th>'+
    '<th>proteína</th><th>apuntar</th><th></th></tr></thead><tbody>'+filas+'</tbody></table></div>';
}
function renderFood(){
  const f=food(),hoy=iso(new Date());
  const sel=(ui.foodDate&&foodKey(ui.foodDate))?foodKey(ui.foodDate):hoy;
  const ft=foodTotals(sel),pl=planTotalsOf(sel),ob=f.objetivo||{},d=parseDate(sel)||new Date();
  const pos=['desayuno','media','comida','merienda','cena','post-entreno'];
  const lista=foodLog(sel);
  const filas=lista.length?pos.map(function(g){
    const xs=lista.filter(function(x){return (x.p||'comida')===g;});if(!xs.length)return '';
    const tk=Math.round(xs.reduce(function(a,x){return a+(+x.kcal||0);},0));
    return '<div class="fgrp">'+g+' · '+tk+' kcal</div>'+xs.map(function(x){
      const peso=x.ean?(' · '+x.g+' g'):(' · '+x.rac+' ración(es)');
      return '<div class="frow"><span><span class="fn">'+esc(x.nombre)+'</span>'+
        '<span class="fm">'+esc(x.marca||'')+peso+'</span></span>'+
        '<span class="mini chipnum">'+(x.kcal||0)+' kcal · '+(x.prot||0)+' g prot</span>'+
        '<span class="row" style="gap:3px">'+
        '<button class="btn s" data-a="fe-less" data-key="'+sel+'" data-id="'+x.id+'" title="quitar un poco">−</button>'+
        '<button class="btn s" data-a="fe-more" data-key="'+sel+'" data-id="'+x.id+'" title="añadir un poco">+</button>'+
        '<button class="btn d s" data-a="fe-del" data-key="'+sel+'" data-id="'+x.id+'" title="quitar la toma">×</button></span></div>';}).join('');
    }).join(''):'<div class="empty">Todavía no has apuntado nada en este día: escanea el paquete o elígelo de «Mis productos».</div>';
  const prods=Object.keys(f.eans).map(function(k){return f.eans[k];}).sort(function(a,b){
    return String(a.nombre||'').localeCompare(String(b.nombre||''),'es');});
  const qq=(ui.foodQ||'').toLowerCase();
  const ver=qq?prods.filter(function(x){return (x.nombre+' '+(x.marca||'')+' '+x.ean).toLowerCase().indexOf(qq)>=0;}):prods;
  const favs=f.fav.map(function(k){return f.eans[k];}).filter(Boolean);
  const opts=(prods.length?'<optgroup label="mis productos">'+prods.map(function(x){
      return '<option value="ean:'+x.ean+'">'+esc(x.nombre)+' · '+(x.kcal||0)+' kcal/100 g</option>';}).join('')+'</optgroup>':'')+
    ((store.dishes||[]).length?'<optgroup label="platos de mis menús">'+(store.dishes||[]).map(function(x){
      return '<option value="dish:'+x.id+'">'+esc(x.name)+' · '+(x.kcal||0)+' kcal/ración</option>';}).join('')+'</optgroup>':'');
  const sem=(function(){
    const ini=mondayOf(new Date()),out=[];
    for(let i=0;i<7;i++){const dd=addDays(ini,i),k=iso(dd),t=foodTotals(k),q=planTotalsOf(k);
      out.push({k:k,nm:DAYSH[i]+' '+dd.getDate(),hoy:k===hoy,pl:q.kcal,lg:t.kcal,ob:+ob.kcal||0});}
    return out;})();
  $('#main').innerHTML='<div class="grid">'+
    '<div class="card"><h2>🔥 El día, en calorías y en proteína</h2>'+
    '<p class="note">La vara morada es <b>lo que ya está montado en tus menús</b> (el plan de tandas); la azul, <b>lo que has apuntado</b>. '+
    'Si te pasas del objetivo se pone ámbar: esto no es una dieta pautada, es para saber de cuánto hablamos.</p>'+
    '<div class="row"><button class="btn s" data-a="food-prev">‹</button>'+
    '<input type="date" value="'+sel+'" data-a="food-day" style="width:158px">'+
    '<button class="btn s" data-a="food-next">›</button>'+
    '<button class="btn s" data-a="food-today">hoy</button>'+
    '<span class="mini">'+DAYN[(d.getDay()+6)%7]+' '+d.getDate()+' de '+MONTH_FULL[d.getMonth()]+' · '+
    (pl.shiftId?esc((shiftById(pl.shiftId)||{}).name||''):'sin día asignado')+'</span></div>'+
    '<div style="margin-top:4px">'+
      barRow('lo que llevas apuntado',ft.kcal,ob.kcal,'',' kcal')+
      barRow('el plan de tus menús',pl.kcal,ob.kcal,'plan',' kcal')+
      barRow('proteína',ft.prot,ob.prot,'',' g')+
    '</div>'+
    '<div class="kpis"><div><b>'+Math.max(0,(+ob.kcal||0)-ft.kcal)+'</b><span>kcal que quedan</span></div>'+
    '<div><b>'+(ft.kcal-pl.kcal>0?'+':'')+(ft.kcal-pl.kcal)+'</b><span>registro vs plan</span></div>'+
    '<div><b>'+lista.length+'</b><span>tomas apuntadas</span></div>'+
    '<div><b>'+(ft.azucar||0)+'</b><span>g de azúcares</span></div></div>'+
    (favs.length?('<div class="pick" style="margin-top:8px"><h4>favoritos, a un toque</h4>'+favs.map(function(x){
      return '<button class="btn s" data-a="fe-quick" data-key="'+sel+'" data-ean="'+x.ean+'">+'+esc(x.nombre)+' <small>'+
        (x.kcal||0)+'/100 g</small></button>';}).join('')+'</div>'):'')+
    '<div style="margin-top:8px">'+filas+'</div>'+
    '<div class="row" style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px">'+
      '<label class="fld" style="flex:2 1 200px">qué<select id="feSel"><option value="">— elegir —</option>'+opts+'</select></label>'+
      '<label class="fld" style="flex:0 0 92px">gramos<input id="feG" type="number" min="1" step="5" value="150"></label>'+
      '<label class="fld" style="flex:0 0 116px">en qué momento<select id="fePos">'+
        pos.map(function(x){return '<option value="'+x+'" '+(x==='comida'?'selected':'')+'>'+x+'</option>';}).join('')+'</select></label>'+
      '<span class="sp"></span><button class="btn p" data-a="fe-add" data-key="'+sel+'">apuntar</button></div>'+
    '</div>'+
    '<div class="card"><h2>📷 Escanear el paquete (Mercadona y compañía)</h2>'+
    '<p class="note">Se abre la cámara, enfocas el código de barras y la app lo busca en Open Food Facts: te guarda el producto con sus '+
    'kcal y su proteína por 100 g. Hace falta https y dar permiso a la cámara; si tu navegador no lee códigos, escribe el número que va '+
    'debajo del barras: el resultado es el mismo. <b>El código de barras (no tu nombre ni nada tuyo) sale de tu dispositivo hacia '+
    'Open Food Facts</b>, un servicio externo, para poder consultarlo — el vídeo de la cámara no sale de aquí.</p>'+
    '<div class="scanbox" id="scanBox"><video id="scanV" playsinline muted></video></div>'+
    '<div class="row"><button class="btn p" data-a="scan-start">📷 abrir la cámara</button>'+
    '<button class="btn s" data-a="scan-stop">parar</button>'+
    '<span class="sp"></span><span class="mini">sin red no busca: los productos guardados siguen valiendo</span></div>'+
    '<div class="fgrid c3" style="margin-top:8px">'+
      '<label class="fld">código de barras<input id="scanEan" inputmode="numeric" placeholder="8410046001962"></label>'+
      '<label class="fld">o busca por nombre<input id="scanQ" placeholder="yogur proteico, fiambre de pavo…"></label>'+
      '<label class="fld">&nbsp;<span class="row" style="gap:6px">'+
      '<button class="btn s" data-a="scan-go">buscar el código</button>'+
      '<button class="btn s" data-a="scan-find">buscar por nombre</button></span></label></div>'+
    '<p id="scanOut">'+esc(ui.scanMsg||'')+'</p>'+
    ((ui.scanRes||[]).length?('<div class="daylist" style="margin-top:4px">'+ui.scanRes.map(function(x,ix){
      return '<div class="frow"><span><span class="fn">'+esc(x.nombre)+'</span>'+
        '<span class="fm">'+esc(x.marca||'')+(x.envase?' · '+esc(x.envase):'')+'</span></span>'+
        '<span class="mini chipnum">'+(x.kcal||0)+' kcal · '+(x.prot||0)+' g prot /100 g</span>'+
        '<span class="row" style="gap:4px"><button class="btn s" data-a="scan-save" data-ix="'+ix+'" data-key="'+sel+'">guardar</button>'+
        '<button class="btn s" data-a="scan-today" data-ix="'+ix+'" data-key="'+sel+'">apuntar 100 g hoy</button></span></div>';}).join('')+'</div>'):'')+
    '</div>'+
    '<div class="card"><h2>🧾 Mis productos <span class="mini">'+prods.length+' guardados</span></h2>'+
    '<p class="note">Lo que escaneas se queda aquí, en el móvil, y lo apuntas en un toque. Si cambia el formato del paquete, '+
    'vuelve a escanearlo: se actualiza encima de lo viejo.</p>'+
    armarioHtml(f,prods,ver,sel)+
    '</div>'+
    '<div class="card"><h2>🎯 Objetivo y semana</h2>'+
    '<p class="note">El objetivo no te lo impone nadie: ponlo tú o saca la media de tus propios menús. '+
    '<b>Esto no sustituye el criterio de un nutricionista o de tu médico</b> — es sólo una cuenta para saber de cuánto hablas, no una pauta.</p>'+
    '<div class="fgrid c3"><label class="fld">kcal al día<input type="number" min="0" max="6000" step="50" value="'+(+ob.kcal||0)+
      '" data-a="food-ob" data-k="kcal"></label>'+
    '<label class="fld">proteína (g)<input type="number" min="0" max="400" step="5" value="'+(+ob.prot||0)+'" data-a="food-ob" data-k="prot"></label>'+
    '<label class="fld">&nbsp;<button class="btn s" data-a="food-sugerir">sugerir desde mis menús</button></label></div>'+
    '<div style="margin-top:10px">'+sem.map(function(x){
      return '<div class="row" style="padding:3px 0;'+(x.hoy?'font-weight:700':'')+'" data-a="food-jump" data-key="'+x.k+'">'+
        '<span style="min-width:62px">'+x.nm+'</span>'+
        '<span class="fbar" style="flex:1"><i style="width:'+(x.ob?Math.min(100,Math.round((x.lg||0)/x.ob*100)):(x.pl?100:0))+'%"></i></span>'+
        '<span class="mini chipnum" style="min-width:126px">'+(x.lg||0)+'/'+(x.ob||'—')+(x.pl?(' · plan '+x.pl):'')+'</span></div>';}).join('')+'</div>'+
    '<p class="mini" style="margin-top:6px">'+(ob.kcal?('media de la semana registrada: '+
      Math.round(sem.reduce(function(a,x){return a+(x.lg||0);},0)/7)+' kcal · objetivo '+ob.kcal+' kcal · '+
      DAYSH[0]+' a '+DAYSH[6]):'sin objetivo puesto: dale a «sugerir desde mis menús» o escríbelo arriba')+'</p>'+
    '</div></div>';
}

/* ===================== entreno: la vista ===================== */
function renderGym(){
  const g=gymS(),hoy=iso(new Date());
  const sel=(ui.gymDate&&foodKey(ui.gymDate))?foodKey(ui.gymDate):hoy;
  const d=parseDate(sel)||new Date();
  const q=ui.gymQ||'';
  const hay=g.biblioteca.length>0;
  const res=hay?gymBuscar(q,40):[];
  const sets=setsDe(sel);
  const sem=volumenSemana(sel);
  const maxvol=Math.max(1,sem.reduce(function(a,x){return Math.max(a,x.vol);},0));
  const nombres={},conte={};
  g.registro.forEach(function(x){nombres[x.ex]=(nombres[x.ex]||0)+1;});
  const enRutina={};g.rutina.forEach(function(r){enRutina[r.ex]=1;});
  const opcEx=Object.keys(nombres).concat(Object.keys(enRutina)).filter(function(x,i,a){return a.indexOf(x)===i;})
    .sort().map(function(nm){return '<option value="'+esc(nm)+'"></option>';}).join('');
  const prs=Object.keys(nombres).map(function(nm){const p=prDe(nm);return p?{ex:nm,p:p}:null;}).filter(Boolean)
    .sort(function(a,b){return b.p.rm-a.p.rm;}).slice(0,10);
  const sg=diaSegundo(sel);
  $('#main').innerHTML='<div class="grid">'+
    '<div class="card"><h2>🏋️ Entreno <span class="mini">'+(hay?(g.biblioteca.length+' ejercicios en el móvil'):'sin biblioteca importada')+'</span></h2>'+
    '<p class="note">Se integra con la biblioteca de <a href="'+GYM_SITIO+'" target="_blank" rel="noopener">openGym</a> '+
    '(los mismos ejercicios, con su vídeo en el sitio). La lista se baja una vez y se queda en el móvil: '+
    'luego buscas, montas tu rutina y apuntas las series. El peso y las repeticiones son tuyos; esto no te dice qué levantar.</p>'+
    '<div class="row"><button class="btn p" data-a="gym-fetch">importar la biblioteca de openGym</button>'+
    '<button class="btn s" data-a="gym-clear">quitar la lista</button>'+
    '<span class="sp"></span><span class="mini">'+esc(g.fuente||'todavía no la has importado')+'</span></div>'+
    '<div class="row" style="margin-top:10px;border-top:1px dashed var(--line);padding-top:9px">'+
      '<span class="mini">🧹 limpiar:</span>'+
      '<button class="btn s" data-a="gym-wipe" data-what="log">las series del registro</button>'+
      '<button class="btn s" data-a="gym-wipe" data-what="rut">la rutina</button>'+
      '<button class="btn s" data-a="gym-wipe" data-what="seg">el segundo día</button>'+
      '<button class="btn d" data-a="gym-wipe" data-what="all">todo el entreno</button>'+
      '<button class="btn d" data-a="gym-wipe" data-what="todo">todo, con la biblioteca</button>'+
      (ui.gymUndo?'<span class="sp"></span><button class="btn s p" data-a="gym-undo">↩ deshacer el borrado</button>':'')+
    '</div>'+
    '<details class="dtip" style="margin-top:8px"><summary class="mini">¿no hay forma de bajarla? pégala aquí</summary>'+
      '<textarea id="gymJson" rows="4" placeholder=\'[{"name":"Bench press","category":"chest","equipment":"barbell","target":"pectorals"},…]\'></textarea>'+
      '<div class="row" style="margin-top:6px"><button class="btn s" data-a="gym-paste">usar el pegote</button>'+
      '<span class="mini">también vale el fichero exercises.json del dataset (MIT) de hasaneyldrm</span></div></details>'+
    (hay?('<div class="row" style="margin-top:10px"><label class="fld" style="flex:1 1 220px">buscar en la biblioteca'+
      '<input id="gymQ" value="'+esc(q)+'" data-a="gym-q" placeholder="sentadilla, press, lumbar, plank…"></label>'+
      '<span class="mini">'+res.length+' resultado(s)'+(q?' para «'+esc(q)+'»':' (escribe para afinar)')+'</span></div>'+
      (res.length?('<div class="daylist" style="margin-top:6px">'+res.map(function(x){
        return '<div class="frow"><span><span class="fn">'+esc(x.n)+'</span>'+
          '<span class="fm">'+esc([x.c,x.eq,x.tg].filter(Boolean).join(' · '))+'</span></span>'+
          '<span class="mini">'+(enRutina[x.n]?'en la rutina':'')+'</span>'+
          '<span class="row" style="gap:4px"><button class="btn s" data-a="gym-rut" data-n="'+esc(x.n)+'">a la rutina</button>'+
          '<button class="btn s" data-a="gym-set-ex" data-n="'+esc(x.n)+'">apuntar serie</button></span></div>';}).join('')+'</div>')
        :'<div class="empty" style="margin-top:6px">nada con ese nombre: prueba con la palabra en inglés (squats, bench, row…)</div>')):'')+
    '</div>'+
    '<div class="card"><h2>📋 Mi rutina <span class="mini">'+g.rutina.length+' ejercicios</span></h2>'+
    '<p class="note">Lo que quieres hacer cada día de fuerza. «Pasar la rutina al día» te monta las series con el último peso que usaste '+
    'en cada uno, y a partir de ahí ya las vas subiendo tú.</p>'+
    (g.rutina.length?('<div style="overflow-x:auto"><table><thead><tr><th>Ejercicio</th><th>series</th><th>reps</th>'+
      '<th>último</th><th>tu marca</th><th></th></tr></thead><tbody>'+g.rutina.map(function(r,ix){
        const ult=ejercicioUltimo(r.ex),p=prDe(r.ex);
        return '<tr><td><b>'+esc(r.ex)+'</b>'+(r.eq?'<br><span class="mini">'+esc(r.eq)+'</span>':'')+'</td>'+
          '<td style="width:64px"><input type="number" min="1" max="12" value="'+(r.series||3)+'" data-a="rut-n" data-ix="'+ix+'" data-f="series"></td>'+
          '<td style="width:64px"><input type="number" min="1" max="30" value="'+(r.reps||8)+'" data-a="rut-n" data-ix="'+ix+'" data-f="reps"></td>'+
          '<td class="mini chipnum">'+(ult?(ult.kg+'×'+ult.reps+' <span class="mini">'+ult.fecha.slice(8)+'/'+ult.fecha.slice(5,7)+'</span>'):'—')+'</td>'+
          '<td class="mini chipnum">'+(p?('1RM ~'+p.rm+' kg'):'—')+'</td>'+
          '<td style="text-align:right"><button class="btn d s" data-a="rut-del" data-ix="'+ix+'" title="quitar de la rutina">×</button></td></tr>';}).join('')+
      '</tbody></table></div>'):'<div class="empty">Aún no has montado la rutina: busca en la biblioteca y dale a «a la rutina».</div>')+
    '<div class="row" style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px">'+
      '<label class="fld" style="flex:1 1 200px">o escríbelo a mano<input id="gymNew" placeholder="Curl martillo 8 kg"></label>'+
      '<label class="fld" style="flex:0 0 74px">series<input id="gymNs" type="number" min="1" max="12" value="3"></label>'+
      '<label class="fld" style="flex:0 0 74px">reps<input id="gymNr" type="number" min="1" max="30" value="10"></label>'+
      '<span class="sp"></span><button class="btn s" data-a="gym-add">añadir</button>'+
      '<button class="btn p" data-a="gym-pasar" data-key="'+sel+'">pasar la rutina al '+d.getDate()+'</button></div>'+
    '</div>'+
    '<div class="card"><h2>📈 El día: '+DAYN[(d.getDay()+6)%7]+' '+d.getDate()+' de '+MONTH_FULL[d.getMonth()]+'</h2>'+
    '<div class="row"><button class="btn s" data-a="gym-prev">‹</button>'+
    '<input type="date" value="'+sel+'" data-a="gym-day" style="width:158px">'+
    '<button class="btn s" data-a="gym-next">›</button>'+
    '<button class="btn s" data-a="gym-today">hoy</button>'+
    '<span class="sp"></span>'+
    '<button class="btn s '+(sg.on?'g':'')+'" data-a="gym-seg-hoy" data-key="'+sel+'">'+
      (sg.on?'✓':'○')+' segundo entreno este día</button></div>'+
    '<div class="kpis"><div><b>'+sets.length+'</b><span>series del día</span></div>'+
    '<div><b>'+volumenDe(sel).toLocaleString('es-ES')+'</b><span>kg de volumen</span></div>'+
    '<div><b>'+(sg.on?('🏊 '+(sg.tipo||'entreno')):'—')+'</b><span>segundo entreno'+(sg.hora?' · '+sg.hora:'')+'</span></div>'+
    '<div><b>'+Object.keys(nombres).length+'</b><span>ejercicios en tu historial</span></div></div>'+
    (sets.length?('<div style="margin-top:8px">'+sets.map(function(x){
      return '<div class="frow"><span><span class="fn">'+esc(x.ex)+'</span>'+
        (x.nota?'<span class="fm"> · '+esc(x.nota)+'</span>':'')+'</span>'+
        '<span class="mini chipnum">'+(x.kg?x.kg+' kg × ':'')+x.reps+' rep'+(x.rpe?(' · RPE '+x.rpe):'')+'</span>'+
        '<span><button class="btn d s" data-a="set-del" data-id="'+x.id+'" title="borrar serie">×</button></span></div>';}).join('')+'</div>')
      :'<div class="empty" style="margin-top:8px">Nada apuntado este día. Monta la serie abajo o pasa la rutina.</div>')+
    '<div class="row" style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px">'+
      '<label class="fld" style="flex:1 1 150px">ejercicio<input id="setEx" list="gymLista" placeholder="Sentadilla" value="'+esc(ui.gymEx||'')+'">'+
      '<datalist id="gymLista">'+opcEx+'</datalist></label>'+
      '<label class="fld" style="flex:0 0 82px">kg<input id="setKg" type="number" min="0" step="2.5" value="0"></label>'+
      '<label class="fld" style="flex:0 0 74px">reps<input id="setReps" type="number" min="1" max="60" value="8"></label>'+
      '<label class="fld" style="flex:0 0 74px">RPE<input id="setRpe" type="number" min="1" max="10" step="0.5" value=""></label>'+
      '<label class="fld" style="flex:1 1 120px">nota<input id="setNota" placeholder="barras, ritmo, rodilla…"></label>'+
      '<span class="sp"></span><button class="btn p" data-a="gym-set" data-key="'+sel+'">apuntar serie</button></div>'+
    '</div>'+
    '<div class="card"><h2>🏊 Segundo día de gym</h2>'+
    '<p class="note">Junto al día de fuerza, un segundo día para piscina o entreno normal. '+
    'Se marca solo en los días que elijas (y en el calendario lo verás con su 🏊); en guardias, salientes y vacaciones nunca se pone.</p>'+
    '<div class="row"><span class="mini">entre semana, qué días:</span>'+
      GYM_DIAS.map(function(nm,ix){const on=g.segundo.dias.indexOf(ix)>=0;
        return '<button class="btn s '+(on?'p':'')+'" data-a="gym-seg-day" data-day="'+ix+'">'+nm+'</button>';}).join('')+'</div>'+
    '<div class="fgrid c3" style="margin-top:8px">'+
      '<label class="fld">qué haces<select id="segTipo" data-a="gym-seg-tipo">'+
        ['piscina','entreno normal','movilidad','cardio suave','padel o frontón'].map(function(x){
          return '<option value="'+x+'" '+(g.segundo.tipo===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select></label>'+
      '<label class="fld">a las<input type="time" id="segHora" value="'+esc(g.segundo.hora||'')+'" data-a="gym-seg-hora"></label>'+
      '<label class="fld" style="flex:0 0 auto;justify-content:flex-end">'+
        '<button class="btn s '+(g.segundo.on?'g':'')+'" data-a="gym-seg-on">'+(g.segundo.on?'✓':'○')+
        ' segundo día activado</button></label></div>'+
    '<p class="mini" style="margin-top:8px">para el '+DAYN[(d.getDay()+6)%7]+' '+d.getDate()+': '+
      (sg.on?('sí, '+(sg.tipo||'entreno')+' a las '+(sg.hora||'—')+(sg.auto?' (por ser '+(GYM_DIAS[d.getDay()]||'')+ ' de la regla general)':' (puesto por ti)'))
        :(sg.porSemana?'bloqueado: ese día toca otra cosa y no se entrena':'sin segundo entreno'))+
      ' <button class="btn s" data-a="gym-seg-hoy" data-key="'+sel+'">cambiar</button></p>'+
    '</div>'+
    '<div class="card"><h2>📊 Volumen de la semana</h2>'+
    '<div style="margin-top:6px">'+sem.map(function(x){
      return '<div class="fb"><div class="fbt"><span>'+x.nm+'</span><b>'+x.vol.toLocaleString('es-ES')+' kg</b>'+
        '<span class="mini">'+x.sets+' series</span></div>'+
        '<div class="fbar'+(x.k===sel?' plan':'')+'"><i style="width:'+Math.round(x.vol/maxvol*100)+'%"></i></div></div>';}).join('')+'</div>'+
    '<p class="mini" style="margin-top:6px">el volumen es kg × repeticiones de lo que apuntas: sírvelo para comparar semanas, no para castigarte</p></div>'+
    '<div class="card"><h2>🏆 Tus marcas</h2>'+
    (prs.length?('<div style="overflow-x:auto"><table><thead><tr><th>Ejercicio</th><th>más peso</th><th>1RM estimado</th>'+
      '<th>series hechas</th></tr></thead><tbody>'+prs.map(function(x){
        return '<tr><td><b>'+esc(x.ex)+'</b></td><td class="chipnum">'+x.p.maxKg+' kg × '+x.p.maxReps+
          '<br><span class="mini">el '+x.p.maxFecha.slice(8)+'/'+x.p.maxFecha.slice(5,7)+'</span></td>'+
          '<td class="chipnum">'+x.p.rm+' kg<span class="mini"> ('+x.p.rmKg+'×'+x.p.rmReps+')</span></td>'+
          '<td class="chipnum">'+x.p.n+'</td></tr>';}).join('')+'</tbody></table></div>'):
      '<div class="empty">sin series apuntadas todavía: en cuanto registres la primera, aquí sale tu progresión</div>')+
    '</div></div>';
}
/* ===================== render: días y menús ===================== */
function renderTypes(){
  const cards=store.shifts.map(sh=>{
    const t=dayTotals(sh.id);
    const slots=slotsFor(sh.id);
    return `<div class="card" data-shift="${sh.id}">
      <h2>${esc(sh.icon)} ${esc(sh.name)}
        <span class="tag">entrada ${esc(sh.start||'—')}</span><span class="tag">salida ${esc(sh.end||'—')}</span>
        <span class="tag">carga ${esc(sh.intensity||'—')}</span>
        <span class="sp"></span><span class="mini no-print">${esc(sh.id)}</span></h2>
      <p class="note">${esc(sh.desc||'')} <b>· ${t.kcal} kcal · ${t.prot} g proteína · ${t.parts} raciones/día</b></p>
      <ul class="slots">${slots.map((s,i)=>slotRow(sh.id,s,i,slots.length)).join('')||'<li class="empty">Sin comidas todavía: elige abajo qué quieres comer este día.</li>'}</ul>
      <div class="row" style="margin-top:9px"><button class="btn s" data-a="toggle-picker" data-id="${sh.id}" aria-expanded="${ui.openPickers.has(sh.id)?'true':'false'}">${ui.openPickers.has(sh.id)?'▴ cerrar comidas y platos':'▾ elegir/cambiar comidas y platos'}</button></div>
      ${ui.openPickers.has(sh.id)?dayPicker(sh.id):''}
      <div class="row" style="margin-top:11px">
        <button class="btn s" data-a="slot-add" data-id="${sh.id}">+ Comida</button>
        <button class="btn s" data-a="shift-edit" data-id="${sh.id}">Editar nombre y horario</button>
        <button class="btn s" data-a="dup-day" data-id="${sh.id}">Duplicar día</button>
        <span class="sp"></span><button class="btn d" data-a="shift-del" data-id="${sh.id}">Eliminar</button></div>
    </div>`}).join('');
  const meals=`<div class="card"><h2>Comidas armadas</h2>
    <p class="note">Bloques reutilizables (el táper de guardia, el brunch del saliente…). Un cambio aquí actualiza todos los días que las usen.</p>
    ${store.meals.map(m=>{const t=totals(m.items);return `<div class="row" style="justify-content:space-between;padding:7px 0;border-top:1px dashed var(--line)">
      <span><b>${esc(m.name)}</b> <span class="mini">${t.kcal} kcal · ${t.prot} g P</span><br>
      <span class="mini">${m.items.map(it=>{const d=dishById(it.id);return d?esc(d.icon)+' '+esc(d.name)+(num(it.portions,1)>1?' ×'+fmt(it.portions):''):''}).filter(Boolean).join(' + ')}${m.note?' · '+esc(m.note):''}</span></span>
      <span class="row"><button class="btn s" data-a="meal-edit" data-id="${m.id}">Editar</button><button class="btn d" data-a="meal-del" data-id="${m.id}">×</button></span></div>`}).join('')}
    <div class="row" style="margin-top:10px"><button class="btn s" data-a="meal-new">+ Crear comida</button></div></div>`;
  const dishes=`<div class="card"><h2>Catálogo de platos</h2>
    <p class="note">Cada plato define cuántas raciones salen por tanda, kcal/proteína por ración y su lista de la compra.</p>
    ${store.dishes.map(d=>{const b=batchById(d.batchId);return `<div class="row" style="justify-content:space-between;padding:7px 0;border-top:1px dashed var(--line)">
      <span><b>${esc(d.icon)} ${esc(d.name)}</b><br><span class="mini">${rac(d.portions)} por tanda · ${d.kcal} kcal · ${d.prot} g P por ración${b&&isBatch(d.batchId)?' · ':''}${b&&isBatch(d.batchId)?'<span class="tag '+tagFor(d.batchId)+'">'+esc(b.label)+'</span>':''}</span></span>
      <span class="row"><button class="btn s" data-a="dish-edit" data-id="${d.id}">Editar</button><button class="btn d" data-a="dish-del" data-id="${d.id}">×</button></span></div>`}).join('')}
    <div class="row" style="margin-top:10px"><button class="btn s" data-a="dish-new">+ Nuevo plato</button></div></div>`;
  $('#main').innerHTML=`<div class="grid">${cards}${meals}${dishes}</div>`;
}
function slotRow(shiftId,s,i,count){
  const inf=slotItems(shiftId,s);
  const mealOpt=`<option value="">platos sueltos</option>${store.meals.map(m=>`<option value="${m.id}" ${s.mealId===m.id?'selected':''}>🍱 ${esc(m.name)}</option>`).join('')}`;
  const dishOpt=id=>store.dishes.map(d=>`<option value="${d.id}" ${d.id===id?'selected':''}>${esc(d.icon)} ${esc(d.name)}${isBatch(d.batchId)?' · '+esc((batchById(d.batchId)||{}).label||''):''}</option>`).join('');
  const t=totals(inf.items);
  const sub=inf.items.map((it,j)=>`<span class="tag"><select style="border:0;background:transparent;font-size:11px;padding:0;max-width:170px" data-a="it-dish" data-i="${i}" data-j="${j}" data-shift="${shiftId}">${dishOpt(it.id)}</select>
     <input type="number" step="0.5" min="0.5" style="width:44px;border:0;background:transparent;font-size:11px;padding:0" value="${fmt(num(it.portions,1))}" data-a="it-port" data-i="${i}" data-j="${j}" data-shift="${shiftId}">
     <button class="btn d" style="padding:0 2px" data-a="it-del" data-i="${i}" data-j="${j}" data-shift="${shiftId}">×</button></span>`).join('');
  return `<li class="slot" data-slot="${s.id}" data-shift="${shiftId}">
    <input class="st" value="${esc(s.time||'')}" placeholder="14:00" data-a="slot-time" data-i="${i}" data-shift="${shiftId}">
    <input class="sl" value="${esc(s.label||'')}" placeholder="etiqueta de la comida" data-a="slot-label" data-i="${i}" data-shift="${shiftId}">
    <select class="sm" data-a="slot-meal" data-i="${i}" data-shift="${shiftId}">${mealOpt}</select>
    <span class="sk mini">${t.kcal}k</span>
    <span class="sx no-print">
      <button class="btn s" style="padding:0 4px;font-size:10px" data-a="slot-up" data-i="${i}" data-shift="${shiftId}" ${i===0?'disabled':''} title="subir">↑</button>
      <button class="btn s" style="padding:0 4px;font-size:10px" data-a="slot-down" data-i="${i}" data-shift="${shiftId}" ${i>=count-1?'disabled':''} title="bajar">↓</button>
      <button class="btn d" style="padding:0 4px;font-size:10px" data-a="slot-del" data-i="${i}" data-shift="${shiftId}" title="quitar del día">×</button></span>
    <span class="sd">${inf.meal?`<span class="tag b2">🍱 ${esc(inf.name)}${t.parts?' · '+rac(t.parts)+' · '+t.prot+' g P':''}</span>`
      :(sub||'<span class="mini">sin plato')}${inf.meal
        ?' <button class="btn s" data-a="slot-meal-edit" data-i="'+i+'" data-shift="'+shiftId+'" title="edita la comida armada: se cambia en todos los días que la usen">editar comida</button>'
          +' <button class="btn s" data-a="slot-loose" data-i="'+i+'" data-shift="'+shiftId+'" title="desmonta la comida solo en este día y deja los platos sueltos para tunearlos">montar suelto</button>'
        :' <button class="btn s" data-a="it-add" data-i="'+i+'" data-shift="'+shiftId+'">+ plato</button>'
          +(inf.items.length?' <button class="btn s" data-a="slot-tomeal" data-i="'+i+'" data-shift="'+shiftId+'" title="convierte estos platos en una comida reutilizable para otros días">guardar como comida</button>':'')}</span>
  </li>`;
}

/* ===================== render: cocina ===================== */
function renderBatches(){
  const days=weekDays(), pb=planBatches(days);
  const html=store.batches.map(b=>{
    const items=store.dishes.filter(d=>d.batchId===b.id);
    if(!items.length)return '';
    const u=pb[b.id]||{items:[],portions:0,hasNeed:false};
    const list=u.hasNeed?u.items.filter(i=>i.runs>0):items.map(d=>({dish:d,needPort:0,runs:1,cooked:d.portions||1}));
    const ingUse=ingredientsFor(list);
    const extra=Math.round(list.reduce((a,i)=>a+Math.max(0,(i.cooked||0)-(i.needPort||0)),0)*10)/10;
    return `<div class="session">
      <h3>${b.id==='bn'?'🍳 '+esc(b.label):'🔥 '+esc(b.label)}
        ${b.when?`<span class="tag">${esc(b.when)}</span>`:''}<span class="sp"></span>
        ${u.hasNeed?`<span class="tag b2">${u.portions} rac. · ${list.length} receta(s)</span>`:'<span class="tag">no se usa esta semana</span>'}
        ${u.hasNeed&&extra>0?`<span class="tag b3">${extra} rac. de sobra → congelador</span>`:''}</h3>
      <p class="mini" style="margin:0 0 8px">${esc(b.note||'')}</p>
      <div class="cols">
        <div><b class="mini">TANDAS A HACER</b><ul>
          ${items.map(d=>{const x=u.items.find(i=>i.dish.id===d.id)||{needPort:0,runs:0,cooked:0};
            return `<li>${esc(d.icon)} <b>${esc(d.name)}</b><br><span class="mini">${x.needPort?`tocan ${x.needPort} rac. → <b>${x.runs} tanda${x.runs>1?'s':''}</b> (${x.cooked} rac.)`:'no entra esta semana'}${x.cooked>x.needPort&&x.needPort?` · sobran ${Math.round((x.cooked-x.needPort)*10)/10} para congelar`:''}</span></li>`}).join('')}
        </ul></div>
        <div><b class="mini">PASOS</b><ul>
          ${items.map(d=>`<li><b>${esc(d.name)}</b><ul>${(d.steps||[]).map(s=>`<li class="mini">${esc(s)}</li>`).join('')}</ul></li>`).join('')}
        </ul></div>
        <div><b class="mini">INGREDIENTES · ${list.length} receta(s) · ${u.portions||0} raciones</b>
          <div class="mini" style="font-weight:400;margin:-2px 0 6px">${u.hasNeed?'cantidades ya escaladas a las tandas de esta semana':'una tanda de cada (aún no está asignada a ningún día)'}</div>
          <ul>
          ${ingUse.map(i=>`<li class="mini">${esc(i.q?i.q+' ':'')}${esc(i.item)}${i.also?' <span class="mini">· '+esc(i.also)+'</span>':''}</li>`).join('')}
        </ul>
        <div class="row no-print" style="margin-top:10px"><button class="btn s" data-a="batch-edit" data-id="${b.id}">Editar sesión</button></div>
        </div>
      </div></div>`}).join('');
  $('#main').innerHTML=`<div class="grid">
    <div class="card"><h2>Cocinar en lote</h2><p class="note">Una o dos sesiones por semana y táperes para todos los tipos de día. Las cantidades dependen de la semana que estés viendo en «Semana» (nº de guardias, salientes, fuerza, libres): cambia allí y esto se recalcula.</p>
      <div class="row"><button class="btn s" data-a="batch-new">+ Nueva sesión</button>
      <button class="btn s" data-a="tab" data-t="shop">Ver lista de la compra</button>
      <span class="sp"></span><button class="btn s" data-a="print">Imprimir (semana + cocina + compra)</button></div></div>
    ${html||'<div class="card empty">No hay sesiones de cocina: crea una y asígnale platos.</div>'}
  </div>`;
}
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
function ingredientsFor(list){
  /* suma los ingredientes de todas las recetas del lote, escalados a la tanda que se cocina */
  const map={};
  list.forEach(it=>{const d=it&&it.dish;if(!d)return;
    const per=d.portions||1;
    const raciones=(it.cooked&&isFinite(it.cooked)&&it.cooked>0)?it.cooked:per;
    const mm=Math.max(1,Math.ceil(raciones/per));   // tandas enteras: la compra es la receta completa
    (d.ingredients||[]).forEach(line=>{const p=parseIng(line);if(!p.item)return;
      const key=p.item.toLowerCase()+'|'+(p.unit||'');
      if(!map[key])map[key]={item:p.item,unit:p.unit,num:0,hasNum:false,notes:new Set(),from:new Set()};
      const m=map[key];m.from.add(d.name);
      if(p.num!=null){m.num+=p.num*mm;m.hasNum=true;}
      else{const tail=p.q.replace(/^[\d.,\s/]+\s*[a-záéíóúñ]*\s*/i,'').trim();m.notes.add(tail||'al gusto');}});
  });
  return Object.keys(map).map(k=>{const m=map[k];
    const q=m.hasNum?fmt(roundNice(m.num))+(m.unit?' '+m.unit:''):'';
    const also=m.notes.size?Array.from(m.notes).join('/'):(m.from.size>1?m.from.size+' recetas':'');
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
function renderShop(){
  const days=weekDays(), pb=planBatches(days);
  /* se usa la misma cuenta que la tarjeta de cocina: tandas completas de cada receta */
  const agg={},order=[];let recipes=0;
  Object.keys(pb).forEach(k=>{const b=pb[k];if(!b.hasNeed)return;
    const list=b.items.filter(i=>i.runs>0);recipes+=list.length;
    ingredientsFor(list).forEach(i=>{
      const key=i.item.toLowerCase()+'|'+(i.unit||'');
      const n=parseFloat(String(i.q).replace(',','.'));
      if(!agg[key]){agg[key]={item:i.item,unit:i.unit,num:(isNaN(n)?null:n),hasNum:!isNaN(n),notes:new Set()};order.push(key);}
      else{const g=agg[key];if(!isNaN(n)&&g.hasNum)g.num+=n;else if(i.also)g.notes.add(i.also);}
      if(i.also)agg[key].notes.add(i.also);});});
  const rows=order.map(k=>{const m=agg[k];
    const q=m.hasNum?fmt(roundNice(m.num))+(m.unit?' '+m.unit:''):'al gusto';
    return {sort:m.item,label:(m.hasNum?q+' ':'')+m.item+(m.unit&&!m.hasNum?' '+m.unit:''),from:Array.from(m.notes).join(', ')};});
  rows.sort((a,b)=>a.sort.localeCompare(b.sort,'es'));
  const key=(store.rotation.mode==='date'?iso(weekDate):'tpl'+store.rotation.pattern);
  const html=rows.map(r=>{const id=key+'#'+r.sort;const on=ui.marks.has(id);
    return `<li class="chk ${on?'done':''}" data-a="mark" data-id="${esc(id)}"><input type="checkbox" ${on?'checked':''}><span>${esc(r.label)} <span class="mini">· ${esc(r.from)}</span></span></li>`}).join('');
  $('#main').innerHTML=`<div class="grid">
    <div class="card"><h2>Lista de la compra</h2><p class="note">Sale de las tandas que tocan en la semana vista (${days.filter(d=>isGuardia(shiftById(d.shiftId))).length} día(s) de guardia, ${days.filter(d=>{const s=shiftById(d.shiftId);return s&&!isGuardia(s)&&/saliente/i.test(s.name);}).length} saliente(s)). Las cantidades van a tanda completa, no a ración suelta: por eso a veces sobra y se congela.</p>
      <div class="row"><button class="btn s" data-a="mark-clear">Limpiar marcados</button><button class="btn s" data-a="print">Imprimir</button>
      <span class="sp"></span><span class="mini">${rows.length} líneas · ${recipes} receta(s) en ${Object.keys(pb).filter(k=>pb[k].hasNeed).length} sesión(es)</span></div></div>
    <div class="grid g2">
      <div class="card"><h2>Básicos del desayuno de diario</h2>
        <p class="note">Whey, leche de proteínas, café, fruta y nueces: no son tanda de cocina, pero se gastan cada día y hay que reponerlos.</p>
        <ul>${(function(){const st0=staplesFor(days).filter(function(x){return /whey|prote/i.test(x.d.name)||/Caf|fruta/i.test(x.d.name);});
          return st0.length?st0.map(function(x){return '<li class="mini"><b>'+fmt(x.q)+'×</b> '+esc(x.d.icon)+' '+esc(x.d.name)+
            (x.viaMeal?' <span class="mini">· viene en comida armada</span>':'')+'</li>';}).join('')
            :'<li class="mini">Ningún desayuno rápido montado esta semana: nada que reponer de esto.</li>';})()}</ul></div>
      <div class="card"><h2>Para el carro</h2><ul>${html||'<div class="empty">Sin tandas esta semana: nada que comprar fresco.</div>'}</ul></div>
      <div class="card"><h2>Despensa (repasa 1 vez al mes)</h2><p class="note">No lo incluyas en la lista semanal, pero si falta, la semana se para.</p>
        <ul>${['Aceite de oliva virgen extra (2 l)','Sal, pimienta, pimentón, curry, jengibre, comino','Arroz basmati / pasta integral (1 kg)','Lenteja pardina y garbanzos de bote (6-8 unidades)','Tomate triturado (6 bricks) o frito','Café y descafeinado','Frutos secos naturales (1 kg) y fruta para 7 raciones','Yogur griego natural (12-16 unidades)','Pan de masa madre: congelado en rebanadas, sacas lo que toques','Congelados de rescate: verdura al vapor, pimiento asado, gambas','Tápers de cristal (mín. 8), film, papel de hornear, cinta para etiquetas con fecha'].map(x=>`<li class="mini">${esc(x)}</li>`).join('')}</ul>
        <h2 style="margin-top:16px">Ritmo sugerido</h2>
        <ul class="mini">${['17:00 – puesta en marcha: precalienta horno, pesa y pica todo de una vez.','17:30 – cazuela larga (legumbre o arroz) mientras fríes patata y verdura.','18:10 – horno: proteína + verdura en dos bandejas a la vez.','18:40 – emplatado en táperes, etiqueta con fecha, 1 h templando antes a la nevera.','19:00 – 2 tápers al congelador, fregadero vacío, semana resuelta.'].map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
    </div></div>`;
}

/* ===================== render: turno y rotación ===================== */
function suenoCard(){
  const c=suenoCfg(),base=despertarBase(),rec=acostarsePara(base),ven=ventanaCena(rec);
  const dias=(store.rotation.jornada&&store.rotation.jornada.workdays)||[1,2,3,4,5];
  const DN=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  return '<div class="card"><h2>2c · Dormir '+c.min+' h, sin excepciones</h2>'+
    '<p class="note">De lunes a viernes te levantas a las <b>'+esc(base)+'</b>, así que para tener tus '+c.min+' h hay que estar en la cama a las '
    +'<b>'+esc(rec)+'</b> (contando '+c.latencia+' min de quedarte dormido). La cena, entre '+(ven?ven.from+' y '+ven.to:'—')+
    ': de 3 h a 1,5 h antes de dormir, para no acostarse con la digestión a medias. Los días '+dias.map(function(x){return DN[x];}).join(', ')+'.</p>'+
    '<div class="fgrid c3"><label class="fld">Horas mínimas<input type="number" min="6" max="10" step="0.25" value="'+c.min+'" data-a="sueno-f" data-k="min"></label>'+
    '<label class="fld">Cena antes (h)<input type="number" min="60" max="240" step="15" value="'+c.cenaMax+'" data-a="sueno-f" data-k="cenaMax"></label>'+
    '<label class="fld">Cena como pronto (h)<input type="number" min="30" max="120" step="15" value="'+c.cenaMin+'" data-a="sueno-f" data-k="cenaMin"></label></div>'+
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
  const shifts=store.shifts.map(s=>`<tr>
    <td style="width:46px"><input value="${esc(s.icon)}" data-a="sh-f" data-id="${s.id}" data-f="icon" style="text-align:center;padding-left:4px;padding-right:4px"></td>
    <td><input value="${esc(s.name)}" data-a="sh-f" data-id="${s.id}" data-f="name"></td>
    <td style="width:54px"><input value="${esc(s.code)}" data-a="sh-f" data-id="${s.id}" data-f="code" style="text-align:center" maxlength="3"></td>
    <td style="width:78px"><input value="${esc(s.start)}" placeholder="08:00" data-a="sh-f" data-id="${s.id}" data-f="start"></td>
    <td style="width:78px"><input value="${esc(s.end)}" placeholder="08:00" data-a="sh-f" data-id="${s.id}" data-f="end"></td>
    <td style="width:96px"><select data-a="sh-f" data-id="${s.id}" data-f="intensity">${['bajo','medio','alto'].map(x=>`<option ${s.intensity===x?'selected':''}>${x}</option>`).join('')}</select></td>
    <td style="width:44px"><input type="color" value="${esc(s.color||'#2563eb')}" data-a="sh-f" data-id="${s.id}" data-f="color" style="height:28px;padding:1px"></td>
    <td><input value="${esc(s.desc)}" data-a="sh-f" data-id="${s.id}" data-f="desc"></td>
    <td style="width:26px"><button class="btn d" data-a="shift-del" data-id="${s.id}">×</button></td></tr>`).join('');
  const pats=store.patterns.map((p,pi)=>{
    const g=p.days.filter(c=>isGuardia(shiftById(resolveCode(c)))).length;
    return `<tr>
      <td style="min-width:150px"><input value="${esc(p.name)}" data-a="pat-name" data-id="${p.id}"><input value="${esc(p.note||'')}" placeholder="nota" data-a="pat-note" data-id="${p.id}" style="margin-top:4px;font-size:11.5px"></td>
      <td>${p.days.map((c,di)=>`<select data-a="pat-day" data-id="${p.id}" data-d="${di}" style="width:44px;margin:0 2px 3px 0">${store.shifts.map(s=>`<option value="${esc(s.code)}" ${s.code===c?'selected':''}>${esc(s.code)}</option>`).join('')}</select>`).join('')}</td>
      <td style="width:120px"><div class="row" style="gap:3px">${p.days.map(c=>{const s=shiftById(resolveCode(c));return `<span class="tag" style="background:${s?s.color+'22':'#ccc'};color:${s?s.color:'inherit'};padding:2px 6px">${s?esc(s.icon):'·'}</span>`}).join('')}</div></td>
      <td style="width:40px"><b>${g}</b></td>
      <td style="width:60px"><button class="btn s ${pi===r.pattern?'p':''}" data-a="pat-use" data-id="${p.id}">usar</button></td>
      <td style="width:46px"><button class="btn s" data-a="pat-copy" data-id="${p.id}">dupl</button></td>
      <td style="width:26px"><button class="btn d" data-a="pat-del" data-id="${p.id}">×</button></td></tr>`}).join('');
  const SC=suenoCfg();
  const rhythmRows=store.shifts.map(function(sh){
    const rh=(store.rhythm&&store.rhythm[sh.id])||{};
    const h=sleepHours(rh.sleep,rh.wake);
    const rec=acostarsePara(rh.wake),ven=ventanaCena(rec||rh.sleep);
    const falta=(h!=null&&h<SC.min)?Math.round((SC.min-h)*60):0;
    const cells=RKEYS.map(function(k){return '<td style="width:78px"><input type="time" value="'+esc(rh[k[0]]||'')+
      '" data-a="rh-f" data-id="'+sh.id+'" data-f="'+k[0]+'"></td>';}).join('');
    return '<tr><td>'+esc(sh.icon)+' '+esc(sh.name)+'</td>'+cells+
      '<td><span class="mini" style="'+(falta?'color:var(--warn);font-weight:700':'')+'">'+(h?fmtHM(h*60):'—')+
      (falta?('<br><span class="mini" style="color:var(--warn)">faltan '+falta+' min</span>'):'')+'</span></td>'+
      '<td><span class="mini">'+(rec?('🛌 '+rec+'<br>🍽 '+(ven?ven.from+'–'+ven.to:'—')):'—')+'</span></td>'+
      '<td style="width:74px"><button class="btn s" data-a="day-rhythm-shift" data-id="'+sh.id+'">ver horas</button></td></tr>';}).join('');
  $('#main').innerHTML=`<div class="grid">
    <div class="card"><h2>1 · Mi turno, las piezas del día</h2><p class="note">Pon aquí los horarios reales de tu destino. <b>Guardia</b> = las 24 h completas; <b>saliente</b> = día de salida; <b>fuerza</b> = entreno; <b>libre</b> = descanso. Con el horario y la intensidad la app ya sabe qué menú y qué tanda toca. Añade filas si tu destino usa «vacante», «asuntos propios», «noche»… y asígnales menú.</p>
      <div style="overflow-x:auto"><table><thead><tr><th></th><th>Nombre</th><th>Clave</th><th>Entra</th><th>Sale</th><th>Carga</th><th></th><th>Notas</th><th></th></tr></thead><tbody>${shifts}</tbody></table></div>
      <div class="row" style="margin-top:10px"><button class="btn s" data-a="shift-new">+ Añadir tipo de día</button></div></div>
    <div class="card"><h2>3 · Estructura semanal genérica</h2><p class="note">Una fila = una semana tipo. Las claves son los tipos de día (G, S, F, L…). Ten siempre una fila para <b>1 guardia</b> y otra para <b>2 guardias</b>: en «Semana» eliges cuál se aplica, y todo (menús, tandas, compra) se recalcula.</p>
      <div style="overflow-x:auto"><table><thead><tr><th style="min-width:150px">Semana tipo</th><th>L → D</th><th>Vista</th><th>G</th><th></th><th></th><th></th></tr></thead><tbody>${pats}</tbody></table></div>
      <div class="row" style="margin-top:10px"><button class="btn s" data-a="pat-new">+ Semana tipo</button>
      <button class="btn s" data-a="autofill">Autocompletar 1 y 2 guardias desde mi turno</button></div></div>
    <div class="card"><h2>4 · Rotación por fecha</h2><p class="note">Si tu calendario es un ciclo de semanas (p. ej. <i>1G·S → 2G·S·S → libre</i>), ordena arriba las semanas del ciclo y pon la fecha de un lunes que sepas qué semana era. La app repite el ciclo sola y cada día de la vista «Semana» lleva el menú que corresponde; y si un día se tuerce, lo cambias en esa misma vista sin romper la rotación.</p>
      <div class="row">
        <label class="fld">Lunes de una semana con 1 guardia<input type="date" value="${esc(r.anchor||'')}" data-a="rot-anchor"></label>
        <label class="fld">Semana del ciclo (auto)<input type="number" value="${r.index||0}" disabled></label>
        <label class="fld">&nbsp;<span class="mini" style="text-transform:none;font-weight:400;letter-spacing:0">Modo activo: <b>${r.mode==='date'?'rotación por fecha':'plantilla'}</b></span></label>
      </div>
      <div class="row" style="margin-top:8px"><button class="btn s" data-a="mode-date">Activar rotación por fecha</button>
      <button class="btn s" data-a="mode-template">Volver a plantilla</button>
      <button class="btn s" data-a="clear-overrides">Quitar mis cambios a mano en los días</button></div>
      <p class="mini" style="margin-top:8px">Ciclo: ${store.patterns.map((p,i)=>(i===r.pattern&&r.mode==='template'?'<b>':'')+esc(p.name)+' → '+p.days.join('·')+(i===r.pattern&&r.mode==='template'?'</b>':'')).join(' → ')||'—'}</p></div>
    <div class="card"><h2>2 · A qué horas te levantas y te acuestas</h2>
      <p class="note">Se aplica por tipo de día; si un día concreto cambia, lo ajustas en el calendario («Mes» → toca el día → <i>editar horas</i>) sin romper la plantilla. Con estas horas la app cuenta tus horas de sueño y te avisa cuando un día te quedas por debajo de 6,5 h.</p>
      <div style="overflow-x:auto"><table><thead><tr><th>Tipo de día</th><th>Levantarse</th><th>Desayuno</th><th>Salir de casa</th><th>Llegar</th><th>Acostarse</th><th>Sueño</th><th>Noche sugerida</th><th></th></tr></thead><tbody>${rhythmRows}</tbody></table></div>
      <div class="row" style="margin-top:9px">
        <button class="btn s" data-a="bf-defaults">poner el desayuno rápido de diario en los días de trabajar</button>
        <button class="btn s" data-a="mon-autopos">${store.rotation.autoPos?'✓':'○'} post-guardia automático</button>
        <span class="sp"></span><span class="mini">💡 si sales de guardia a las 08:00, el día siguiente no madruges: el cuerpo pide 8 h y media</span></div>
    </div>
    ${jornadaCard()}
    ${suenoCard()}
    <div class="card"><h2>5 · Notas del planning</h2><p class="note">Vacaciones, permisos, cursos, «esta semana cambio con Antonio».</p>
      <textarea rows="4" data-a="meta-notes" placeholder="Vacaciones 3-17 de octubre; el 22 curso en academia…">${esc(store.meta.notes||'')}</textarea></div>
  </div>`;
}

/* ===================== render: datos ===================== */
function renderData(){
  $('#main').innerHTML=`<div class="grid">
    <div class="card"><h2>Importar tu planning (pegando la tabla)</h2>
      <p class="note">Pega aquí las líneas del mes, tal cual: <i>1 ago G 08:00-08:00</i>. Reconoce día+mes, tipo de día (guardia/saliente/fuerza/libre/descanso/asuntos propios/vacante/noche) y horarios, agrupa por semanas y genera las semanas tipo —incluida la variante de 1 y 2 guardias— con sus horarios puestos en los turnos.</p>
      <textarea id="pasteBox" rows="12" placeholder="1 ago · G 24h 08:00-08:00 guardia destino Sur&#10;2 ago · S 09:00-13:00 saliente&#10;3 ago · L libre&#10;4 ago · F fuerza 18:00&#10;5 ago · L asuntos propios&#10;6 ago · G 24h 08:00-08:00&#10;7 ago · S 09:00-13:00"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn p" data-a="draft">Analizar</button>
      <button class="btn" data-a="draft-apply" disabled id="applyBtn">Aplicar al planning</button>
      <span class="mini" id="draftMsg"></span></div>
      <div id="draftOut" class="mini" style="background:color-mix(in srgb,var(--card) 55%,var(--bg));border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:8px;display:none;white-space:pre-wrap"></div>
      <label class="fld" style="margin-top:8px">Letras de tus días — añade una si te falta alguna (p. ej. <i>V=Noche en el cuarto</i>)
        <input id="codeMap" value="G=Guardia 24 h,S=Saliente,F=Fuerza,L=Libre" title="formato: LETRA=Nombre del día. Las cuatro de siempre están reconocidas; si añades V=Noche en el cuarto, las líneas que digan «noche en el cuarto» se cuentan como V y se crea ese tipo de día con su horario."></label>
      <p class="mini" style="margin-top:6px">Los días que no aparezcan en tu texto se rellenan como día libre para cerrar la semana: luego los cambias en «Turno y rotación».</p></div>
    <div class="card"><h2>Pega tu dieta actual</h2>
      <p class="note">Pon un encabezado por día (<i>GUARDIA</i>, <i>SALIENTE</i>, <i>LIBRE</i>, <i>DIAS DE FUERZA</i>) y debajo <i>desayuno: …</i>, <i>comida: …</i>, <i>cena: …</i>. Cada plato se busca contra tu catálogo por las palabras de su nombre; lo que no se reconozca se lista para que lo añadas como plato nuevo.</p>
      <textarea id="dietBox" rows="8" placeholder="GUARDIA&#10;desayuno: café con leche y tostada integral&#10;comida: arroz con pollo y verduras + fruta&#10;cena: bocadillo de atún&#10;SALIENTE&#10;comida: lentejas con arroz"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn" data-a="diet">Relacionar con mis platos</button>
      <button class="btn g" data-a="diet-apply" disabled id="dietApply">Guardar como menús sugeridos</button></div>
      <div id="dietOut" class="mini" style="background:color-mix(in srgb,var(--card) 55%,var(--bg));border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:8px;display:none;white-space:pre-wrap"></div></div>
    <div class="card"><h2>Tus horas, el servicio de cada mes y tus vacaciones</h2>
      <p class="note">Tres cosas a la vez: el horario fijo del día (levantarse, desayuno, salir, llegar, acostarse, trabajar), qué servicio rotas cada mes con su cupo de guardias y tus rangos de vacaciones. Se puede pegar tal cual, en plan nota.</p>
      <textarea id="rhythmBox" rows="7" placeholder="entre semana: me levanto 6:45-6:55, desayuno normal (café, fruta y nueces, whey y leche de proteínas), salgo de casa 7:30, llego 7:45, trabajo 8:00-15:00, me acuesto 23:00&#10;guardia: me acuesto 22:30&#10;libre: me levanto 8:30, duermo 23:45&#10;septiembre: urgencias (4+2) · octubre: umi · noviembre: urgencias 4+2&#10;vacaciones del 24/08 al 2/09"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn p" data-a="rhythm">Analizar horas, meses y vacaciones</button>
      <button class="btn" data-a="rhythm-apply" disabled id="rhythmApply">Aplicar al planning</button>
      <span class="mini" id="rhythmMsg"></span></div>
      <div id="rhythmOut" class="mini" style="background:color-mix(in srgb,var(--card) 55%,var(--bg));border:1px solid var(--line);border-radius:10px;padding:10px;margin-top:8px;display:none;white-space:pre-wrap"></div>
      <label class="fld" style="margin-top:8px">Año en el que aplico los meses
        <input type="number" id="rhythmYear" value="${new Date().getFullYear()}" min="2000" max="2100" style="max-width:110px"></label>
      <p class="mini" style="margin-top:6px">Lo que no se entienda se ignora y se dice: no se toca ningún horario que no hayas mencionado y no se reparte ninguna guardia ni se da por hecho ningún servicio de mes si tú no lo escribes.</p></div>
    <div class="card"><h2>📅 Tu calendario de Google · 1 · para fuera</h2>
      <p class="note">Se genera un <code>.ics</code> con tus guardias (con su tipo y su hora), los salientes, los días
      de entreno y las vacaciones del rango que elijas, en un cuaderno con el nombre que tú pongas. La <b>jornada de 8 a 15
      no sale</b>: si trabajas de lunes a viernes eso ya lo tiene tu calendario y saldría duplicado. Dale a
      <b>ver la lista</b> y abajo tienes los cuatro pasos para dejarlo sincronizado en Google.</p>
      <div class="row">
        <label class="fld">desde<input type="date" id="calDesde" data-a="cal-desde" value="${esc(ui.calDesde||calRango().desde)}"></label>
        <label class="fld">hasta<input type="date" id="calHasta" data-a="cal-hasta" value="${esc(ui.calHasta||calRango().hasta)}" min="${esc(ui.calDesde||calRango().desde)}"></label>
        <span class="sp"></span>
        <button class="btn p" data-a="cal-descargar">descargar .ics</button>
        <button class="btn s" data-a="cal-copiar">copiar el .ics</button>
        <button class="btn ${ui.calView?'':'p'} s" data-a="cal-ver">${ui.calView?'ocultar la lista':'ver la lista'}</button></div>
      <div id="txtIcs" class="mini" style="${ui.calView?'margin-top:8px':'display:none;margin-top:8px'};background:color-mix(in srgb,var(--card) 55%,var(--bg));border:1px solid var(--line);border-radius:10px;padding:10px;max-height:200px;overflow:auto;white-space:pre;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px">${esc(ui.calTxt||'')}</div>
      ${ui.calView?`<div class="row wrap" style="gap:8px;align-items:flex-end;margin-top:10px">
        <label class="fld" style="flex:1 1 220px">nombre del cuaderno<input id="calNombre" value="${esc(store.rotation.calNombre||'')}" placeholder="${esc(calNombreTxt(calRangoUI().desde))}"></label>
        <button class="btn s" data-a="cal-nombre">poner el nombre</button>
        <label class="fld" style="flex:0 0 auto;font-size:11px;text-transform:none"><span class="row" style="gap:5px">
          <input type="checkbox" id="calOculto" data-a="cal-oculto" style="width:auto" ${store.rotation.calOculto!==false?'checked':''}>
          <span>etiquetarlos (IMPORT_TAG) para poder filtrarlos u ocultarlos luego en Google</span></span></label>
        <button class="btn s" data-a="cal-copiar">copia estas 4 líneas de Google</button></div>
        <div class="row" style="margin-top:6px"><span class="mini">la caja de arriba es el <code>.ics</code> tal cual: si tu editor no lo parte en líneas de 75, Google no lo traga — por eso el <i>descargar</i> es el camino normal, y esto solo para copiar y pegar</span></div>`:''}
      ${calNotas()}</div>
    <div class="card"><h2>📅 Tu calendario de Google · 2 · para dentro</h2>
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
      <div class="row" style="margin-top:8px">
        <label class="fld" style="flex:1 1 240px">o si lo tienes colgado en una URL pública, tráelo de ahí<input id="icsUrl" data-a="cal-url-in" value="${esc(ui.calUrl||'')}" placeholder="https://…/mi-calendario.ics"></label>
        <button class="btn s" data-a="cal-url">leer la URL</button></div>
      <p class="mini" style="margin-top:4px">Sólo <code>https://</code> y sólo si ese servidor deja leer desde fuera
      (en Google, «disponible para cualquier persona» + la URL pública del calendario). Si falla, no toca nada:
      pega el fichero a mano. <b>Ojo:</b> es tu navegador el que pide esa URL directamente, sin pasar por ningún
      servidor nuestro — quien aloje ese calendario puede ver que alguien lo ha leído, como al abrir cualquier enlace.</p>
      <p class="mini" style="margin-top:6px">la app no se conecta a Google por su cuenta (harían falta claves y un servidor):
      lee y escribe ficheros <code>.ics</code>, que es el idioma común de los calendarios. El <code>IMPORT_TAG</code>
      y los <code>UID</code> estables son lo que hace que Google actualice en vez de duplicar.</p></div>
    <div class="card"><h2>Exportar / importar JSON</h2>
      <p class="note"><b>Todo vive sólo en este navegador</b>: no hay cuenta ni servidor detrás, y nada se comparte solo entre compañeros.
      Si quieres pasarte el cuadrante a otro móvil, compartirlo con alguien o tener una copia por si acaso, descarga el JSON — es la
      única copia de seguridad que existe, así que conviene hacerla de vez en cuando.</p>
      <p class="mini" style="${diasDesdeBackup()===null||diasDesdeBackup()>13?'color:var(--warn);font-weight:700':''}">
      ${diasDesdeBackup()===null?'⚠ todavía no has hecho ninguna copia de seguridad':
        (diasDesdeBackup()===0?'última copia: hoy':'última copia: hace '+diasDesdeBackup()+' día'+(diasDesdeBackup()===1?'':'s')+(diasDesdeBackup()>13?' — te toca otra':''))}</p>
      <div class="row" style="margin-top:6px"><button class="btn" data-a="export">Descargar JSON</button><button class="btn" data-a="copy">Copiar JSON</button>
      <span class="sp"></span><button class="btn d" data-a="reset">Restaurar el ejemplo</button></div>
      <textarea id="importBox" rows="8" placeholder="Pega aquí un JSON y pulsa Importar" style="margin-top:8px"></textarea>
      <div class="row" style="margin-top:8px"><button class="btn g" data-a="import">Importar JSON</button></div></div>
    <div class="card"><h2>Texto para el móvil o para imprimir</h2>
      <p class="note">La semana vista, con kcal y proteína por comida, y las tandas de cocina. Se pega en cualquier chat.</p>
      <div class="row"><button class="btn" data-a="txt">Generar</button><button class="btn" data-a="txtcopy">Copiar</button></div>
      <textarea id="txtOut" rows="16" readonly style="margin-top:8px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px"></textarea></div>
  </div>`;
  if(window._draftInfo)showDraft(window._draftInfo);
  if(window._dietInfo)showDiet(window._dietInfo);
}
function mapCodes(v){
  return String(v||'').split(/[,\n]/).map(function(x){
    const m=x.split('=');if(m.length<2)return null;
    const code=m[0].trim().toUpperCase(),name=m.slice(1).join('=').trim();
    return code&&name?{code:code.charAt(0).toUpperCase(),name:name}:null;}).filter(Boolean);
}
function showDraft(info){
  const out=$('#draftOut');out.style.display='block';
  const pat=info.weeks.map((w,i)=>i+': '+w.join(' ')+'  →  '+w.join('·')).join('\n');
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
const TABS=[['hoy','Hoy'],['week','Semana'],['month','Mes'],['food','Comida'],['gym','Entreno'],['types','Días y menús'],['batches','Cocina en lote'],['shop','Compra'],['cfg','Turno y rotación'],['data','Datos']];
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
  if(ui.scanStream)pararEscaner();
  const hk=iso(new Date()),ft=foodTotals(hk),gn=setsDe(hk).length,gc=guardCount(monthDate.getFullYear(),monthDate.getMonth());
  const BADGE={food:ft.kcal?ft.kcal+' kcal':'',gym:gn?gn+' series':'',month:(gc&&gc.any)?gc.any+' 🩺':''};
  $('#tabs').innerHTML=TABS.map(t=>`<button class="${ui.tab===t[0]?'on':''}" data-a="tab" data-t="${t[0]}"${ui.tab===t[0]?' aria-current="true"':''}>${t[1]}${BADGE[t[0]]?'<span class="tb">'+BADGE[t[0]]+'</span>':''}</button>`).join('');
  const d=store.rotation.mode==='date'?addDays(mondayOf(weekDate),6):null;
  const mlbl=MONTH_FULL[monthDate.getMonth()]+' '+monthDate.getFullYear();
  $('#wkLabel').textContent=store.rotation.mode==='date'
    ? `${weekDate.getDate()} ${MON[weekDate.getMonth()]} – ${d.getDate()} ${MON[d.getMonth()]}`
    : `plantilla · ${esc(store.patterns[store.rotation.pattern]?store.patterns[store.rotation.pattern].name:'—')}`;
  if(ui.tab==='month')$('#wkLabel').textContent=mlbl;
  $('#hsub').innerHTML=`${store.shifts.length} tipos de día · ${store.dishes.length} platos · ${store.meals.length} comidas armadas · se guarda solo en este navegador · `+
    `<kbd>1</kbd>–<kbd>9</kbd> pestañas <kbd>←</kbd><kbd>→</kbd> semana <kbd>T</kbd> tema <kbd>/</kbd> buscar`;
  const mm=$('#main');if(mm){mm.classList.remove('in');
    /* reiniciar la animación sin forzar un reflow síncrono (antes: void mm.offsetWidth) */
    requestAnimationFrame(function(){mm.classList.add('in');});}
  const bt=document.querySelector('[data-a="theme"]');
  if(bt){const osc=document.documentElement.classList.contains('dark');bt.textContent=osc?'☀️':'🌙';
    bt.title=osc?'Modo día':'Modo noche HUD';bt.setAttribute('aria-label',bt.title);}
  ({hoy:renderHoy,week:renderWeek,month:renderMonth,food:renderFood,gym:renderGym,types:renderTypes,batches:renderBatches,shop:renderShop,cfg:renderCfg,data:renderData}[ui.tab]||renderHoy)();
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
let modalSave=null,mealCtx=null,draftMeal=null,mealSlot=null,modalPrevFocus=null;
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
    case 'tab':ui.tab=el.dataset.t;render();window.scrollTo(0,0);break;
    case 'theme':{document.documentElement.classList.toggle('dark');
      const osc=document.documentElement.classList.contains('dark');
      try{localStorage.setItem(TKEY,osc?'dark':'light');}catch(e){}
      const bt=document.querySelector('[data-a="theme"]');
      if(bt){bt.textContent=osc?'☀️':'🌙';bt.title=osc?'Modo día':'Modo noche HUD';}
      break;}
    case 'wk-prev':weekDate=addDays(weekDate,-7);render();break;
    case 'wk-next':weekDate=addDays(weekDate,7);render();break;
    case 'today':weekDate=mondayOf(new Date());render();break;
    case 'print':window.print();break;
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
    case 'mon-day':renderDayModal(el.dataset.key);break;
    case 'food-prev':case 'food-next':{const cur=foodKey(ui.foodDate||iso(new Date()));
      const dd=parseDate(cur)||new Date();ui.foodDate=iso(addDays(dd,a==='food-next'?1:-1));render();break;}
    case 'food-today':ui.foodDate=iso(new Date());render();break;
    case 'food-jump':{const k=foodKey(el.dataset.key);if(k)ui.foodDate=k;render();break;}
    case 'fe-add':{const pick=(document.getElementById('feSel')||{}).value||'';
      const g=+(document.getElementById('feG')||{}).value||150;
      const when=(document.getElementById('fePos')||{}).value||'comida';
      const m=/^(ean|dish):(.+)$/.exec(pick);if(!m){flash('elige primero qué producto o qué plato es');break;}
      const opt=(m[1]==='ean')?{ean:m[2],grams:g,pos:when,when:when}:{dishId:m[2],rac:g,pos:when,when:when};
      flash(addFoodEntry(el.dataset.key,opt));render();break;}
    case 'fe-quick':{const gg=el.dataset.gq?(+(document.getElementById(el.dataset.gq)||{}).value||150):150;
      flash(addFoodEntry(el.dataset.key,{ean:el.dataset.ean,grams:gg,pos:'comida'}));render();break;}
    case 'fe-more':case 'fe-less':{const e=foodLog(el.dataset.key).filter(function(x){return x.id===el.dataset.id;})[0]||{};
      const paso=e.dishId?0.5:25;
      flash(bumpFoodEntry(el.dataset.key,el.dataset.id,a==='fe-more'?paso:-paso));render();break;}
    case 'fe-del':flash(delFoodEntry(el.dataset.key,el.dataset.id));render();break;
    case 'hoy-log-slot':{const hk=iso(new Date()),s=(store.menu[el.dataset.shift]||[]).find(function(x){return x.id===el.dataset.slot;});
      if(!s){flash('esa comida ya no está en el menú');break;}
      const info=slotItems(el.dataset.shift,s),cat=posDeSlot(s.label,s.time);
      if(!info.items.length){flash('esa comida no tiene platos asignados todavía');break;}
      info.items.forEach(function(it){addFoodEntry(hk,{dishId:it.id,rac:num(it.portions,1),pos:cat,when:cat});});
      flash('apuntado: '+(s.label||'esa comida')+' ('+info.items.length+' plato'+(info.items.length>1?'s':'')+')');render();break;}
    case 'ean-del':flash(delEanProduct(el.dataset.ean));render();break;
    case 'ean-fav':flash(toggleFavEan(el.dataset.ean));render();break;
    case 'food-sugerir':flash(sugerirObjetivo());break;
    case 'scan-start':{const caja=document.getElementById('scanBox');if(caja)caja.classList.add('on');
      Promise.resolve(iniciarEscaner()).then(function(m){ui.scanMsg=m;
        const o=document.getElementById('scanOut');if(o)o.textContent=m;flash(m);});break;}
    case 'scan-stop':pararEscaner();ui.scanMsg='';ui.scanRes=[];render();break;
    case 'scan-go':{const c=(document.getElementById('scanEan')||{}).value||'';
      ui.scanMsg='buscando '+c+'…';const o=document.getElementById('scanOut');if(o)o.textContent=ui.scanMsg;
      Promise.resolve(buscarYmostrar(c)).then(function(){render();});break;}
    case 'scan-find':{const t=(document.getElementById('scanQ')||{}).value||'';
      Promise.resolve(buscarOffNombre(t)).then(function(r){ui.scanMsg=r.msg;ui.scanRes=r.ok?(r.list||[]):[];
        render();flash(r.msg);});break;}
    case 'scan-save':{const x=(ui.scanRes||[])[+el.dataset.ix];if(!x)break;
      const res=addEanProduct(x);flash(res.msg);if(res.ok)render();break;}
    case 'scan-today':{const x=(ui.scanRes||[])[+el.dataset.ix];if(!x)break;
      const r2=addEanProduct(x);if(!r2.ok){flash(r2.msg);break;}
      flash(addFoodEntry(el.dataset.key,{ean:r2.ean,grams:100,pos:'comida'}));render();break;}
    case 'gym-prev':case 'gym-next':{const gd=parseDate(foodKey(ui.gymDate||iso(new Date()))||iso(new Date()))||new Date();
      ui.gymDate=iso(addDays(gd,a==='gym-next'?1:-1));render();break;}
    case 'gym-today':ui.gymDate=iso(new Date());render();break;
    case 'gym-fetch':flash('bajando la biblioteca de openGym: pesan unos 17 MB, en el móvil mejor con wifi');
      gymImportUrl().then(function(r){flash((r&&r.msg)||'nada más');});break;
    case 'gym-paste':{const ta=document.getElementById('gymJson');const r=gymImportText(ta?ta.value:'');
      flash((r&&r.msg)||'sin más');if(r&&r.ok&&ta)ta.value='';break;}
    case 'gym-clear':{const gg=gymS();gg.biblioteca=[];gg.fuente='';render();
      flash('lista quitada: tu rutina y tus marcas se quedan');break;}
    case 'gym-rut':flash(addRutina(el.dataset.n));break;
    case 'gym-set-ex':{ui.gymEx=el.dataset.n;render();
      const se=document.getElementById('setEx');if(se)se.focus();
      flash('ejercicio puesto en la ficha: rellena kg y reps');break;}
    case 'gym-add':{const n=document.getElementById('gymNew');
      flash(addRutina(n?n.value:'',
        {series:(document.getElementById('gymNs')||{}).value,reps:(document.getElementById('gymNr')||{}).value}));break;}
    case 'gym-pasar':{const r=pasarRutina(el.dataset.key);render();flash(r);break;}
    case 'gym-set':{const gv=function(id){return (document.getElementById(id)||{}).value||'';};
      const r=addSet(el.dataset.key,{ex:gv('setEx'),kg:gv('setKg'),reps:gv('setReps'),rpe:gv('setRpe'),nota:gv('setNota')});
      ui.gymEx=gv('setEx');render();flash(r);break;}
    case 'set-del':{const r=delSet(el.dataset.id);render();flash(r);break;}
    case 'rut-del':flash(delRutina(+el.dataset.ix));break;
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
    case 'svc-add':{store.rotation.servicios.push('Servicio '+(store.rotation.servicios.length+1));save();render();break;}
    case 'svc-del':{store.rotation.servicios.splice(+el.dataset.ix,1);save();render();break;}
    case 'day-set':{const v=el.dataset.sid||'';
      setDayOverride(el.dataset.key,v||'',el.dataset.guard||(v?'':''));save();
      if(el.dataset.guard){renderDayModal(el.dataset.key);}else{closeModal();render();}
      const auto=v?((ponerSalienteAuto(el.dataset.key).txt)||''):'';
      flash(v?('día puesto: '+((shiftById(v)||{}).name||'')+(el.dataset.guard?(' · '+el.dataset.guard):'')+
        (store.rotation.autoPos!==false?auto:'')):'día liberado (y su saliente automático, si lo puso la app)');break;}
    case 'day-rhythm':editDayRhythm(el.dataset.key);break;
    case 'day-guardia':{const rg=setGuardiaTipo(el.dataset.key,el.dataset.guard||'');flash(rg.msg);
      if(rg.ok)renderDayModal(el.dataset.key);break;}
    case 'gtipo-add':{const inp=document.getElementById('gtipoNuevo');const r=addGuardiaTipo(inp?inp.value:'');
      if(r.ok&&inp)inp.value='';flash(r.msg);break;}
    case 'gym-wipe':{const txts={log:'¿Borrar las series apuntadas? Tus pesos y tus marcas salen de ahí (luego se pueden deshacer).',
        rut:'¿Vaciar la rutina? El registro de series se queda.',
        seg:'¿Quitar el segundo día de gym y las marcas puestas a mano?',
        all:'¿Limpiar TODO el entreno (series, rutina y segundo día)? La biblioteca importada se queda.',
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
      if(a==='day-quickbf'){const dd=weekDays()[+el.dataset.i];sh=dd&&dd.shiftId;}
      if(!sh){flash('ese día aún no tiene tipo asignado');break;}
      flash(quickBreakfast(sh,null));save();render();break;}
    case 'day-open':{const k=el.dataset.key;if(ui.openDays.has(k))ui.openDays.delete(k);else ui.openDays.add(k);
      render();
      const nx=document.querySelector('[data-a="day-open"][data-key="'+CSS.escape(k)+'"]');if(nx)nx.focus();break;}
    case 'toggle-picker':{const k=el.dataset.id;if(ui.openPickers.has(k))ui.openPickers.delete(k);else ui.openPickers.add(k);
      render();
      const nx=document.querySelector('[data-a="toggle-picker"][data-id="'+CSS.escape(k)+'"]');if(nx)nx.focus();break;}
    case 'wk-expand-all':{if(allOpen())ui.openDays=new Set();
      else ui.openDays=new Set(weekDays().map(function(d){return d.key||('tpl'+d.idx);}));render();break;}
    case 'rules':editRules();break;
    case 'txt':$('#txtOut').value=toText();break;
    case 'txtcopy':copy($('#txtOut').value||toText());break;
    case 'day-edit':{if(!id)break;ui.tab='types';render();
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
      el.classList.toggle('done',on);const cb=el.querySelector('input');if(cb)cb.checked=on;saveMarks();break;}
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
  return {weeks:weeks,count:count,times:times,dias:dias,lineas:lineas,skipped:skipped,
    gPerWeek:Math.round(count.G/nW*10)/10,leidas:lineas,
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
    +(avisos.length?' · '+avisos.join(' · '):'')+' Repasa «Turno y rotación» y «Días y menús».';
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
    li('Qué se ve afectado','solo lo que exportas tú: guardias con su tipo, salientes, entrenos y vacaciones. La jornada de 8 a 15 no sale, y lo que tú ya tengas en Google queda igual; al importar, ningún día que marcaras a mano se pisa sin avisar.')+
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
  /* solo lo que tú has puesto en el planning: nada de inventar eventos */
  const out=[],i0=parseDate(desde),i1=parseDate(hasta);
  if(!i0||!i1)return out;
  for(let d=new Date(i0.getTime());d<=i1;d=addDays(d,1)){
    const k=iso(d),inf=dayInfo(k),sh=shiftById(inf.shiftId);
    if(inf.vac){out.push({allDay:true,fecha:icsNum(k),isoKey:k,summ:'🏖️ Vacaciones'+(inf.vac.label?' · '+inf.vac.label:''),
      desc:'fuera del servicio',cat:'VACACIONES'});continue;}
    if(!sh)continue;
    if(isGuardia(sh)){
      const st=icsHM(sh.start||'08:00'),en=sh.end?icsHM(sh.end):'';
      const tipo=inf.guard?gTipo(inf.guard).label:'sin tipo';
      out.push({allDay:false,fecha:icsNum(k),isoKey:k,hora:st,horaFin:(en&&en>st)?en:'',
        dur:(en&&en>st)?0:24*60,
        summ:'🩺 Guardia · '+tipo+(inf.guard?(' ['+inf.guard+']'):''),
        desc:'Guardia de '+tipo+'. '+(d.getDay()===6?'Saliente: el lunes.':'Saliente: mañana.')+
          ' (en la app, el post-guardia lo pone la rotación'+(store.rotation.autoPos!==false?'':' —apagado')+').',
        cat:'GUARDIA'});continue;}
    if(/saliente/i.test(sh.name||''))
      {out.push({allDay:true,fecha:icsNum(k),isoKey:k,summ:'🛋️ '+sh.name,desc:'después de guardia: día suave, sin cocina',cat:'DESCANSO'});continue;}
    if(/fuerza|entreno/i.test(sh.name||''))
      out.push({allDay:true,fecha:icsNum(k),isoKey:k,summ:'💪 '+sh.name,desc:dayLine({key:k,shiftId:sh.id})||'',cat:'ENTRENO'});
    const g2=diaSegundo(k);
    if(g2.on)out.push({allDay:false,fecha:icsNum(k),isoKey:k,hora:icsHM(g2.hora||'15:30'),dur:90,
      summ:'🏊 '+(g2.tipo||'entreno'),desc:'segundo entreno'+(g2.auto?' (regla de la semana)':' (puesto tú)')+
        ' · '+((nightOf(k)||{}).cena?('cena '+(nightOf(k).cena.from)+'–'+(nightOf(k).cena.to)):''),cat:'ENTRENO'});
  }
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
    if(e.allDay)cuerpo.push('DTSTART;VALUE=DATE:'+e.fecha,'DTEND;VALUE=DATE:'+icsNum(nextIso(kISO)),'TRANSP:TRANSPARENT');
    else{
      const hi=mins(icsHM(e.hora))||0;
      let fn=mins(e.horaFin||'');
      if(!(fn>hi))fn=hi+(e.dur||60);
      const cruza=fn>=1440;
      cuerpo.push('DTSTART:'+e.fecha+'T'+icsCompacta(hm(hi)),
        'DTEND:'+icsNum(cruza?nextIso(kISO):e.fecha)+'T'+icsCompacta(hm(fn)));}
    cuerpo.push('SUMMARY:'+icsEscTxt(e.summ),'DESCRIPTION:'+icsEscTxt(e.desc||''),
      'CATEGORIES:'+icsEscTxt(e.cat||'OTRO'),'STATUS:CONFIRMED','SEQUENCE:0');
    if(store.rotation.calAlarm!==false)
      cuerpo.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+icsEscTxt(e.summ),
        'TRIGGER;VALUE=DURATION:-PT30M','END:VALARM');
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
  if($('#overlay')&&$('#overlay').classList.contains('on')){
    if(e.key==='Escape'){cancelModal();return;}
    if(e.key==='Tab'){trapModalTab(e);return;}
    return;}
  if(escribiendo){if(e.key==='Escape'&&t.blur)t.blur();return;}
  const k=e.key||'';
  if(/^[1-9]$/.test(k)){const tb=TABS[+k-1];if(tb){ui.tab=tb[0];render();
    const b=document.querySelector('#tabs button[data-t="'+tb[0]+'"]');if(b&&b.scrollIntoView)b.scrollIntoView({block:'nearest',inline:'center'});}return;}
  if(k==='ArrowRight'||k==='ArrowLeft'){const b=document.querySelector('[data-a="'+(k==='ArrowRight'?'wk-next':'wk-prev')+'"]');
    if(b)b.click();return;}
  if(k==='t'||k==='T'){const b=document.querySelector('[data-a="theme"]');if(b)b.click();return;}
  if(k==='/'){const s2=document.getElementById(ui.tab==='gym'?'gymQ':(ui.tab==='food'?'fdQ':''));
    if(s2){e.preventDefault();s2.focus();s2.select();}}
  if((k==='Enter'||k===' ')&&t&&t.getAttribute&&t.getAttribute('role')==='button'&&t.dataset&&t.dataset.a){
    e.preventDefault();t.click();}
});
document.addEventListener('click',e=>{
  if(e.target.id==='overlay'){cancelModal();return;}
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
    case 'wk-set':{const d=parseDate(el.value);if(d){weekDate=mondayOf(d);render();}break;}
    case 'pat-sel':{const i=store.patterns.findIndex(p=>p.id===el.value);if(i>=0){store.rotation.pattern=i;store.rotation.mode='template';save();render();}break;}
    case 'rot-anchor':{if(el.value){store.rotation.anchor=el.value;store.rotation.anchorSet=true;save();render();}break;}
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
    case 'day-sel':{const v=el.value||'';setDayOverride(el.dataset.key,v,(dayOverride(el.dataset.key)||{}).guard);
      const auto=v?((ponerSalienteAuto(el.dataset.key).txt)||''):'';
      closeModal();save();render();flash(v?('día puesto: '+((shiftById(v)||{}).name||'')+auto):'día liberado (y su saliente automático, si lo puso la app)');break;}
    case 'rh-f':{if(!store.rhythm)store.rhythm={};const o=store.rhythm[el.dataset.id]||(store.rhythm[el.dataset.id]={});
      o[el.dataset.f]=el.value;save();render();break;}
    case 'mon-set':{const mm=/^(\d{4})-(\d{2})$/.exec(el.value||'');if(mm){monthDate=new Date(+mm[1],+mm[2]-1,1,12,0,0,0);render();}break;}
    case 'food-day':{const k=foodKey(el.value);if(k)ui.foodDate=k;render();break;}
    case 'food-ob':{const fb=food(),v=Math.max(0,Math.round(+el.value||0));
      if(!fb.objetivo)fb.objetivo={kcal:0,prot:0};fb.objetivo[el.dataset.k]=v;save();render();break;}
    case 'gym-day':{const k=foodKey(el.value);if(k)ui.gymDate=k;render();break;}
    case 'rut-n':setRutina(+el.dataset.ix,el.dataset.f,el.value);render();break;
    case 'gym-seg-tipo':{const gg=gymS();gg.segundo.tipo=el.value;
      const k=foodKey(ui.gymDate||iso(new Date()));if(gg.marks[k])gg.marks[k].tipo=el.value;
      save();render();flash('segundo entreno: '+el.value);break;}
    case 'gym-seg-hora':{const gg=gymS();gg.segundo.hora=el.value;
      const k2=foodKey(ui.gymDate||iso(new Date()));if(gg.marks[k2])gg.marks[k2].hora=el.value;
      save();render();break;}
    case 'sueno-f':{if(!store.sueno)store.sueno={min:8,cenaMin:90,cenaMax:180,latencia:10};
      const k=el.dataset.k,v=+el.value;if(v>0)store.sueno[k]=(k==='min'?Math.round(v*4)/4:Math.round(v));
      save();render();break;}
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

/* ===================== arranque ===================== */
/* expone el modelo para depurar / testear desde la consola */
window.PG={parseRhythmText,parseServicesText,applyRhythm,hhmm,normClock,
  get store(){return store;},set store(v){store=normalize(v);},get ui(){return ui;},render,save,weekDays,
  shiftById,resolveCode,isGuardia,dayTotals,planBatches,shiftForDate,fmt,autofill,parseDate,mondayOf,addDays,ingredientsFor,editBatch,
  parsePlanning,applyParse,parseDietText,dishKeywords,matchDish,togglePicker,dayPicker,defaultTime,toText,
  sleepHours,fmtHM,toMin,dayInfo,dayOverride,setDayOverride,rhythmOf,sleepOf,monthDays,monthService,setMonthService,
  guardCount,distributeGuardias,syncToRotation,quickBreakfast,staplesFor,schedLine,dayLine,RKEYS,renderDayModal,
  vacMap,vacationOf,addVacation,delVacation,jornadaOf,jornadaEn,parseVacacionesText,vacDays,
  baseWorkday,svcLabel,setGuardiasMes,planServicios,cicloServicios,ponerSalienteAuto,limpiarSalientesAuto,
  suenoCfg,mins,hm,acostarsePara,ventanaCena,despertarBase,nightOf,aplicarAcostarse,encajarCenas,
  gTipos,gTipo,gEtiqueta,gTiposTxt,repartoTipos,setCupoTipo,setGuardiaTipo,renombraTipo,addGuardiaTipo,
  icsUID,icsEscTxt,icsEsc,icsUnfold,icsStampUTC,calNombreTxt,calRangoUI,calFileTxt,calUrlBloque,calNotas,icsPreviewHTML,icsAnalizar,
  gymWipe,gymUndoWipe,calEventos,icsTexto,parseIcs,icsDesdoblar,icsClasificar,icsPlan,icsAplicar,calFinMes,calIniMes,calRango,
  gymS,gymImportText,gymImportUrl,gymBuscar,addRutina,delRutina,setRutina,addSet,delSet,setsDe,volumenDe,prDe,
  ejercicioUltimo,pasarRutina,diaSegundo,toggleSegundo,setSegundoCampo,toggleSegundoDia,resumenGym,volumenSemana,gymLine,
  food,foodKey,offNum,mapOffProduct,addEanProduct,delEanProduct,toggleFavEan,porcionDe,foodLog,addFoodEntry,delFoodEntry,
  bumpFoodEntry,foodTotals,planTotalsOf,sugerirObjetivo,buscarEan,buscarOffNombre,iniciarEscaner,pararEscaner,buscarYmostrar,
  get monthDate(){return monthDate;},set monthDate(v){monthDate=v;},nextIso,
  set weekDate(v){weekDate=v;},get weekDate(){return weekDate;},DEFAULTS};
load();
render();
avisarBackupSiToca();
