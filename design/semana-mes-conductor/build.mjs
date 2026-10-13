/* Semana y Mes con el lenguaje del conductor (maquetas). Mismo mundo a distinta distancia:
   Hoy es el asiento del conductor; Semana, el tablón de servicios de la cochera (S1); Mes, el
   cuadrante de la empresa con el abono del mes (M-1). Los datos de ejemplo salen de la app
   (datos.json: una semana con guardia y saliente y un mes con seis guardias, sin datos de nadie).
   node build.mjs → semana.html, mes.html */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(readFileSync(join(HERE, "datos.json"), "utf8"));
const BASE = readFileSync(join(HERE, "../_base.css"), "utf8");

/* los colores de las paradas del conductor (fig/conductor.js): el mismo diccionario en las tres */
const CSS = `
:root{--work:#d9573f;--guard:#34467e;--guard2:#7d93e0;--meal:#2f9e6b;--gym:#7a5cf0;--plan:#1fa6c4;--amber:#fbbf24;--ink:#e9f2ff;--ink2:#8fa6c6;--line:#1e2b44}
body{width:390px}
.tab{display:flex;gap:6px;margin:0 0 12px}.tab span{flex:1;text-align:center;padding:7px 0;border-radius:11px;border:1px solid var(--line);font-weight:700;font-size:13px;color:var(--ink2)}
.tab span.on{color:#04121c;background:linear-gradient(94deg,#38e1ff,color-mix(in srgb,#7c5cff 70%,#38e1ff))}
.tablon{background:linear-gradient(#141d2e,#0e1524);border:1px solid #2a3a58;border-radius:16px;padding:10px 8px 8px;position:relative;
  box-shadow:0 1px 0 rgba(255,255,255,.05) inset,0 18px 40px -22px #000}
.tablon h3{margin:0 2px 2px;font:800 11px/1.2 system-ui;letter-spacing:.16em;color:var(--amber);display:flex;align-items:center;gap:8px}
.tablon h3 small{margin-left:auto;font:700 10.5px system-ui;letter-spacing:.04em;color:var(--ink2)}
.resumen{font-size:12px;color:var(--ink2);margin:0 2px 6px}.resumen b{color:var(--ink)}
svg text{font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.fila{cursor:pointer}.fila:hover .fondo{fill:rgba(56,225,255,.05)}
.det{margin-top:12px}.det h2 small{font-weight:600;color:var(--ink2);font-size:12px}
.par{display:flex;gap:10px;align-items:center;padding:6px 2px;border-bottom:1px solid color-mix(in srgb,var(--line) 70%,transparent);font-size:13.5px}
.par em{font-style:normal;color:var(--ink2);width:44px;flex:none;font-size:12.5px}.par i{width:9px;height:9px;border-radius:50%;flex:none}
.par .ok{margin-left:auto;font-size:12px;color:#34d399}.par .pd{margin-left:auto;font-size:12px;color:var(--amber)}
.ley{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:11px;color:var(--ink2);margin:6px 2px 0}.ley i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:4px;vertical-align:-1px}
/* mes */
.abono{position:relative;border-radius:16px;padding:12px 14px 12px 16px;color:#1b1406;
  background:linear-gradient(100deg,#fcd34d,#fbbf24 60%,#f59e0b);box-shadow:0 14px 30px -18px #f59e0b}
.abono::before,.abono::after{content:'';position:absolute;top:50%;width:14px;height:14px;border-radius:50%;background:#070b14;transform:translateY(-50%)}
.abono::before{left:-7px}.abono::after{right:-7px}
.abono .t{font:800 10.5px/1 system-ui;letter-spacing:.18em;opacity:.75;display:flex}.abono .t span{margin-left:auto;letter-spacing:.06em}
.abono .nums{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:8px;margin-top:8px}
.abono .nums div{border-left:1.5px dashed rgba(27,20,6,.35);padding-left:8px}.abono .nums div:first-child{border:0;padding:0}
.abono b{display:block;font-size:22px;line-height:1.05;font-weight:900}.abono small{font-size:11px;font-weight:700;opacity:.8}
.agujeros{display:flex;gap:5px;margin-top:4px}.agujeros i{width:11px;height:11px;border-radius:50%;border:1.5px solid rgba(27,20,6,.55)}
.agujeros i.p{background:#070b14;border-color:#070b14}
.cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;margin-top:12px}
.cal .h{text-align:center;font:800 10px system-ui;letter-spacing:.1em;color:var(--ink2);padding:2px 0}
.cel{position:relative;min-height:72px;border-radius:9px;background:color-mix(in srgb,#111a2b 88%,transparent);border:1px solid var(--line);
  padding:3px 3px 4px;display:flex;flex-direction:column;align-items:flex-start;gap:2px;cursor:pointer;overflow:hidden}
.cel .n{font:800 12px/1 system-ui;color:var(--ink)}.cel.fin{background:color-mix(in srgb,#1a1730 80%,transparent)}
.cel.pas{opacity:.55}.cel.fuera{opacity:.35}.cel.hoy{border:2px solid var(--amber);box-shadow:0 0 0 3px color-mix(in srgb,var(--amber) 22%,transparent)}
.cel .s{font:700 9px/1.1 system-ui;letter-spacing:-.02em;color:var(--ink2);white-space:nowrap}
.cel .ev{font:600 8.5px/1.15 system-ui;color:#c7d6ee;background:rgba(31,166,196,.18);border-radius:4px;padding:1px 3px;max-width:100%;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.ficha{display:flex;align-items:center;gap:2px;border-radius:6px;padding:2px 3px;font:800 8.5px/1 system-ui;letter-spacing:0;max-width:100%;white-space:nowrap}
.ficha svg{flex:none}
.f-guard{background:var(--guard);color:#dfe6ff;box-shadow:0 0 0 1px var(--guard2) inset}
.f-work{background:color-mix(in srgb,var(--work) 22%,transparent);color:#ffb4a6}
.f-sal{background:color-mix(in srgb,var(--guard2) 16%,transparent);color:#b9c7f3}
.f-libre{border:1px dashed #3a4a68;color:#6f84a6;font-weight:700}
.f-vac{background:color-mix(in srgb,var(--amber) 22%,transparent);color:#ffd877}
.f-gym{background:color-mix(in srgb,var(--gym) 22%,transparent);color:#c9b9ff}
.toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#0e1626;border:1px solid #2a3a58;border-radius:12px;padding:9px 14px;font-size:13px;
  box-shadow:0 12px 30px -10px #000;opacity:0;transition:opacity .2s;pointer-events:none;max-width:360px}
.toast.on{opacity:1}
`;

const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

const pagina = (titulo, tabOn, cuerpo, js) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=390">
<title>${titulo}</title><style>${BASE}${CSS}</style></head><body><div class="bgfx"></div><div class="gridfx"></div><div class="scr"><main>
<div class="tab">${["Mes", "Semana", "Hoy"].map((t) => `<span class="${t === tabOn ? "on" : ""}">${t}</span>`).join("")}</div>
${cuerpo}</main></div><div class="toast" id="toast"></div>
<script>const D=${JSON.stringify(D)},DIAS=${JSON.stringify(DIAS)};
const toast=(t)=>{const e=document.getElementById('toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),1800);};
const hm=(h)=>{h=((h%24)+24)%24;const H=Math.floor(h),M=Math.round((h-H)*60);return H+':'+String(M).padStart(2,'0');};
const coma=(v)=>String(Math.round(v*10)/10).replace('.',',');
${js}</script></body></html>`;

/* ---------- SEMANA: el tablón de la cochera ---------- */
const semJS = String.raw`
const HOY='2026-10-14',AHORA=10.4,W=356,L=56,R=300,T0=6,T1=26,RH=46,TOP=26;
const x=(h)=>L+(Math.max(T0,Math.min(T1,h))-T0)/(T1-T0)*(R-L);
const COL={work:'var(--work)',guard:'var(--guard)',meal:'var(--meal)',gym:'var(--gym)',plan:'var(--plan)'};
/* hábitos de ejemplo (en la app salen de Hábitos): agua, estudio, cama a su hora */
const HAB={'2026-10-13':[1,0,1],'2026-10-14':[1,0,null]};
/* lo hecho: ayer todo menos la cena; hoy lo de antes de las 10:24 */
D.sem.forEach((d)=>d.dia.forEach((e)=>{if(e.m||e.k==='meal'){e.h=d.k<HOY?(e.t==='Cena'?0:1):(d.k===HOY&&e.a<AHORA?1:0);}}));
function bus(t,cx,cy){
  /* el autobús del tipo de día: rojo de servicio, búho azul de guardia, de vuelta a cochera el saliente, fuera de servicio el libre */
  const c={trabajo:'var(--work)',guardia:'var(--guard)',saliente:'#3c5590',fuerza:'var(--gym)',libre:'none'}[t]||'none';
  const st=t==='libre'?'#4a5d80':(t==='guardia'?'var(--guard2)':'rgba(255,255,255,.25)');
  return '<g transform="translate('+(cx-11)+','+(cy-7)+')"><rect width="22" height="12" rx="3" fill="'+c+'" stroke="'+st+'" stroke-width="1.2" '+(t==='libre'?'stroke-dasharray="2 2"':'')+'/>'+
    '<rect x="3" y="2.5" width="16" height="4" rx="1" fill="'+(t==='libre'?'none':'rgba(255,255,255,.55)')+'" stroke="'+(t==='libre'?'#4a5d80':'none')+'" stroke-width=".8"/>'+
    '<circle cx="6" cy="12.5" r="1.8" fill="#0b1120" stroke="'+st+'"/><circle cx="16" cy="12.5" r="1.8" fill="#0b1120" stroke="'+st+'"/>'+
    (t==='guardia'?'<path d="M19.6 -3.4a3.2 3.2 0 1 0 2.4 4.6a2.6 2.6 0 1 1 -2.4 -4.6z" fill="#e6ecff"/>':'')+
    (t==='saliente'?'<path d="M24 6h5m-2 -2.4 2.4 2.4 -2.4 2.4" stroke="#b9c7f3" stroke-width="1.3" fill="none"/>':'')+'</g>';}
function fila(d,i){
  const y=TOP+i*RH,yc=y+25,hoy=d.k===HOY,pas=d.k<HOY;let s='';
  s+='<rect class="fondo" x="0" y="'+y+'" width="'+W+'" height="'+(RH-2)+'" rx="9" fill="'+(hoy?'rgba(251,191,36,.07)':'transparent')+'" stroke="'+(hoy?'rgba(251,191,36,.55)':'none')+'"/>';
  s+='<text x="6" y="'+(y+17)+'" font-size="11" font-weight="800" fill="'+(hoy?'var(--amber)':'var(--ink)')+'" letter-spacing=".06em">'+(i===0?'AYER':DIAS[d.dow])+' <tspan font-weight="600" fill="var(--ink2)">'+d.dnum+'</tspan></text>';
  s+=bus(d.tipo,17,y+30);
  /* sellos de hábitos */
  (HAB[d.k]||[]).forEach((h,j)=>{if(h==null)return;s+='<circle cx="'+(35+j*7)+'" cy="'+(y+31)+'" r="2.6" fill="'+(h?'#34d399':'none')+'" stroke="'+(h?'#34d399':'#4a5d80')+'" stroke-width="1"/>';});
  /* la carretera */
  s+='<line x1="'+x(T0)+'" y1="'+yc+'" x2="'+x(T1)+'" y2="'+yc+'" stroke="#2a3a58" stroke-width="2" stroke-linecap="round"/>';
  /* la noche y la siesta: en la cochera */
  d.noches.forEach((n)=>{const a=Math.max(n.a,T0),b=Math.min(n.b,T1);if(b<=a)return;
    s+='<rect x="'+x(a)+'" y="'+(yc-7)+'" width="'+(x(b)-x(a))+'" height="14" rx="4" fill="rgba(52,70,126,.35)" stroke="rgba(125,147,224,.35)" stroke-dasharray="'+(n.t==='siesta'?'3 2':'0')+'"/>';
    if(x(b)-x(a)>16)s+='<text x="'+(x(a)+4)+'" y="'+(yc+3.5)+'" font-size="9" fill="#9fb2ea">'+(n.t==='siesta'?'siesta':'z')+'</text>';});
  /* el servicio: la jornada y la guardia */
  d.dia.filter((e)=>e.k==='work'||e.k==='guard').forEach((e)=>{if(e.b-e.a<1&&!e.ayer)return;const a=Math.max(e.a,T0),b=Math.min(e.b,T1);if(b<=a)return;
    s+='<rect x="'+x(a)+'" y="'+(yc-4)+'" width="'+Math.max(4,x(b)-x(a))+'" height="8" rx="4" fill="'+COL[e.k]+'" stroke="'+(e.k==='guard'?'var(--guard2)':'none')+'"/>';
    const lab=e.k==='guard'?(e.ayer?'→ '+hm(e.b):'☾ guardia '+hm(e.a)):hm(e.a)+'–'+hm(e.b);
    s+='<text x="'+(x(a)+2)+'" y="'+(yc-8)+'" font-size="9" font-weight="700" fill="'+(e.k==='guard'?'#b9c7f3':'#ffb4a6')+'">'+lab+'</text>';});
  /* las paradas */
  d.dia.filter((e)=>e.k!=='work'&&e.k!=='guard'&&e.a>=T0&&e.a<=T1).forEach((e)=>{
    const pend=(e.m||e.k==='meal')&&!e.h&&(pas||(hoy&&e.b<AHORA));
    s+='<circle cx="'+x(e.a)+'" cy="'+yc+'" r="3.8" fill="'+(e.h||(!pas&&!hoy)||(hoy&&e.a>=AHORA)?COL[e.k]||'var(--plan)':'#0b1120')+'" stroke="'+(pend?'var(--amber)':'#0b1120')+'" stroke-width="'+(pend?1.6:1)+'"/>';});
  /* el autobús de ahora, en la fila de hoy */
  if(hoy){s+='<line x1="'+x(AHORA)+'" y1="'+(y+4)+'" x2="'+x(AHORA)+'" y2="'+(y+RH-6)+'" stroke="var(--amber)" stroke-width="1.5"/>'+
    '<g transform="translate('+(x(AHORA)-7)+','+(yc+7)+')"><rect width="14" height="8" rx="2" fill="var(--amber)"/><rect x="2" y="1.6" width="10" height="2.6" rx=".6" fill="#3b2a05"/></g>';}
  /* la plaza de garaje: lo dormido (ayer) o lo previsto esta noche */
  const gx=R+6,sn=d.sueno,cor=sn&&sn.h<D.obj;
  s+='<path d="M'+gx+' '+(yc+12)+'V'+(yc-5)+'l'+((W-gx)/2)+' -9 l'+((W-gx)/2)+' 9V'+(yc+12)+'" fill="#0e1524" stroke="'+(sn?(cor?'var(--amber)':'#3c5590'):'#34467e')+'" stroke-width="1.2"/>';
  s+='<text x="'+(gx+(W-gx)/2)+'" y="'+(yc+5)+'" text-anchor="middle" font-size="'+(sn?11:9.5)+'" font-weight="800" fill="'+(sn?(cor?'var(--amber)':'var(--ink)'):'#9fb2ea')+'">'+(sn?coma(sn.h)+' h':'☾')+'</text>';
  if(!sn)s+='<text x="'+(gx+(W-gx)/2)+'" y="'+(yc+14)+'" text-anchor="middle" font-size="7.5" fill="#9fb2ea">de guardia</text>';
  if(sn&&sn.real)s+='<text x="'+(gx+(W-gx)/2)+'" y="'+(yc+14)+'" text-anchor="middle" font-size="7.5" fill="var(--ink2)">dormidas</text>';
  return '<g class="fila" data-i="'+i+'">'+s+'</g>';}
function tablon(){
  const n=D.sem.length,H=TOP+n*RH+2;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="La semana como siete líneas de autobús">';
  [6,12,18,24].forEach((h)=>{s+='<text x="'+x(h)+'" y="12" text-anchor="middle" font-size="9.5" font-weight="700" fill="var(--ink2)">'+(h===24?'0':h)+'</text>'+
    '<line x1="'+x(h)+'" y1="17" x2="'+x(h)+'" y2="'+(H-2)+'" stroke="rgba(143,166,198,.12)" stroke-dasharray="2 3"/>';});
  s+='<text x="'+(R+6+(W-R-6)/2)+'" y="12" text-anchor="middle" font-size="8.5" font-weight="800" fill="var(--ink2)" letter-spacing=".08em">NOCHE</text>';
  D.sem.forEach((d,i)=>{s+=fila(d,i);});
  return s+'</svg>';}
function resumen(){
  const fut=D.sem.slice(1),g=fut.filter((d)=>d.tipo==='guardia').length;let hs=0;
  fut.forEach((d)=>d.dia.forEach((e)=>{if((e.k==='work'||e.k==='guard')&&!e.ayer&&e.b-e.a>=1)hs+=e.b-e.a;}));
  const sn=fut.filter((d)=>d.sueno&&!d.sueno.real).map((d)=>d.sueno.h),med=sn.reduce((a,b)=>a+b,0)/sn.length,cortas=sn.filter((h)=>h<D.obj).length;
  return '<b>'+g+' guardia'+(g===1?'':'s')+'</b> · <b>'+Math.round(hs)+' h</b> de servicio · noches de <b>'+coma(med)+' h</b> de media'+(cortas?' · <b style="color:var(--amber)">'+cortas+' cortas</b>':'');}
function detalle(i){
  const d=D.sem[i],hoy=d.k===HOY,pas=d.k<HOY;
  const l=d.dia.filter((e)=>!e.ayer).sort((a,b)=>a.a-b.a).map((e)=>{
    const ok=e.h?'<span class="ok">✓ hecha</span>':((e.m||e.k==='meal')&&(pas||(hoy&&e.b<AHORA))?'<span class="pd">¿la apuntas?</span>':'');
    return '<div class="par"><em>'+hm(e.a)+'</em><i style="background:'+(COL[e.k]||'var(--plan)')+'"></i><span>'+e.t+(e.k==='guard'&&e.b-e.a>=6?' <span class="mini">hasta '+hm(e.b)+' del día siguiente</span>':e.k==='work'?' <span class="mini">hasta '+hm(e.b)+'</span>':'')+'</span>'+ok+'</div>';}).join('');
  document.getElementById('det').innerHTML='<div class="card"><h2>'+(i===0?'Ayer':hoy?'Hoy':DIAS[d.dow].charAt(0)+DIAS[d.dow].slice(1).toLowerCase())+' '+d.dnum+' <small>· '+d.tipo+'</small></h2>'+l+
    (d.pend.length?'<div class="par"><em>sin hora</em><i style="background:var(--gym)"></i><span>'+d.pend.join(', ')+'</span></div>':'')+
    '<div class="row" style="margin-top:10px"><button class="btn p s" onclick="toast(\'Abriría el conductor en el '+d.dnum+' de octubre\')">🚌 Abrir su Hoy</button><button class="btn s" onclick="toast(\'Abriría la tarjeta del día de siempre (editar, añadir)\')">editar el día</button></div></div>';}
document.getElementById('tab').innerHTML=tablon();
document.getElementById('res').innerHTML=resumen();
document.querySelectorAll('.fila').forEach((g)=>g.addEventListener('click',()=>detalle(+g.dataset.i)));
detalle(1);`;

const semana = pagina("Semana · la cochera", "Semana", `
<div class="row" style="margin-bottom:10px;gap:6px"><span class="btn s">‹</span><span class="btn s" style="flex:1;text-align:center">mié 14 oct → mar 20 oct</span><span class="btn s">›</span></div>
<div class="tablon"><h3>▦ SERVICIOS DE LA SEMANA <small>toca un día</small></h3><p class="resumen" id="res"></p><div id="tab"></div>
<div class="ley"><span><i style="background:var(--work)"></i>jornada</span><span><i style="background:var(--guard);box-shadow:0 0 0 1px var(--guard2) inset"></i>guardia</span><span><i style="background:rgba(52,70,126,.5)"></i>cochera (dormir)</span><span><i style="background:var(--meal);border-radius:50%"></i>comida</span><span><i style="background:var(--plan);border-radius:50%"></i>plan</span><span><i style="border:1.5px solid var(--amber);border-radius:50%"></i>sin apuntar</span><span><i style="background:#34d399;border-radius:50%"></i>hábito hecho</span></div></div>
<div id="det" class="det"></div>
<div class="card" style="margin-top:12px"><h2>Hábitos</h2><p class="mini" style="margin:0">Se quedan como están (debajo); en el tablón salen como sellos bajo cada día.</p></div>`, semJS);

/* ---------- MES: el cuadrante de servicios con el abono ---------- */
const mesJS = String.raw`
const HOY='2026-10-14';
/* dos eventos de ejemplo para ver que caben */
const EV={'2026-10-22':'Curso RCP','2026-10-27':'Cumple Ana'};
const ico={
  guard:'<svg width="10" height="10" viewBox="0 0 10 10"><path d="M6.5 1a4 4 0 1 0 2.5 6.4A3.2 3.2 0 1 1 6.5 1z" fill="#e6ecff"/></svg>',
  work:'<svg width="13" height="9" viewBox="0 0 13 9"><rect width="13" height="7" rx="2" fill="var(--work)"/><rect x="2" y="1.4" width="9" height="2.4" rx=".6" fill="rgba(255,255,255,.6)"/><circle cx="3.5" cy="7.6" r="1.3" fill="#0b1120"/><circle cx="9.5" cy="7.6" r="1.3" fill="#0b1120"/></svg>',
  sal:'<svg width="13" height="10" viewBox="0 0 13 10"><path d="M1 5h6m-2 -2.6 2.6 2.6 -2.6 2.6" stroke="#b9c7f3" stroke-width="1.4" fill="none"/><path d="M8.5 9V4.2l2.2 -2 2.2 2V9z" fill="none" stroke="#b9c7f3" stroke-width="1.1"/></svg>',
  vac:'<svg width="14" height="9" viewBox="0 0 14 9"><rect width="14" height="7" rx="2.5" fill="var(--amber)"/><rect x="2" y="1.4" width="10" height="2.4" rx=".6" fill="rgba(0,0,0,.35)"/><circle cx="3.5" cy="7.6" r="1.3" fill="#0b1120"/><circle cx="10.5" cy="7.6" r="1.3" fill="#0b1120"/></svg>'};
const cor=(s)=>(s||'').replace(/(^|→|–)0(\d)/g,'$1$2');
function ficha(c){c=Object.assign({},c,{sv:cor(c.sv)});
  if(c.tipo==='guardia')return '<span class="ficha f-guard">'+ico.guard+({urg:'URG',umi:'UMI'}[c.g]||'')+'</span><span class="s">'+c.sv+'</span>';
  if(c.tipo==='saliente')return '<span class="ficha f-sal">'+ico.sal+'</span><span class="s">'+c.sv+'</span>';
  if(c.tipo==='trabajo')return '<span class="ficha f-work">'+ico.work+'</span><span class="s">'+c.sv.replace(/^0/,'')+'</span>';
  if(c.tipo==='fuerza')return '<span class="ficha f-gym">💪</span><span class="s">'+c.sv.replace(/^0/,'')+'</span>';
  if(c.tipo==='vac')return '<span class="ficha f-vac">'+ico.vac+'</span><span class="s">vacac.</span>';
  return '<span class="ficha f-libre">F/S</span><span class="s">libre</span>';}
function abono(){
  /* las cuentas del mes entero (del 1 al 31), no solo de lo que se ve en la rejilla */
  const hechas=D.oct.hechas,cupo=(D.cuota.urg||0)+(D.cuota.umi||0),hs=D.oct.h,fs=D.oct.findes;
  return '<div class="abono"><div class="t">ABONO DE OCTUBRE<span>N.º 10/26</span></div><div class="nums">'+
    '<div><b>'+hechas+' <small>de</small> '+cupo+'</b><small>guardias hechas</small><div class="agujeros">'+Array.from({length:cupo},(_,i)=>'<i class="'+(i<hechas?'p':'')+'"></i>').join('')+'</div></div>'+
    '<div><b>'+Math.round(hs)+' h</b><small>de servicio</small></div><div><b>'+fs+'</b><small>findes libres</small></div></div></div>';}
function cuadrante(){
  let s='<div class="cal">'+['L','M','X','J','V','S','D'].map((d)=>'<div class="h">'+d+'</div>').join('');
  D.mes.forEach((c)=>{const cls=['cel'];if(c.dow===0||c.dow===6)cls.push('fin');if(c.k<HOY)cls.push('pas');if(c.m!==9)cls.push('fuera');if(c.k===HOY)cls.push('hoy');
    s+='<div class="'+cls.join(' ')+'" data-k="'+c.k+'"><span class="n">'+(c.d===1?c.d+' '+(c.m===10?'nov':'oct'):c.d)+'</span>'+ficha(c)+(EV[c.k]?'<span class="ev">'+EV[c.k]+'</span>':'')+'</div>';});
  return s+'</div>';}
document.getElementById('abono').innerHTML=abono();
document.getElementById('cal').innerHTML=cuadrante();
document.querySelectorAll('.cel').forEach((e)=>e.addEventListener('click',()=>toast('Un toque: la semana desde ese día en el tablón · mantener: cambiar el turno (como ahora)')));`;

const mes = pagina("Mes · el cuadrante", "Mes", `
<div class="row" style="margin-bottom:10px;gap:6px"><span class="btn s">‹</span><span class="btn s" style="flex:1;text-align:center">octubre 2026</span><span class="btn s">›</span><span class="btn s">✏️ editar</span></div>
<div id="abono"></div><div id="cal"></div>
<div class="ley" style="margin-top:8px"><span><span class="ficha f-guard" style="display:inline-flex">☾</span> guardia (búho)</span><span><span class="ficha f-work" style="display:inline-flex">bus</span> jornada</span><span><span class="ficha f-sal" style="display:inline-flex">→⌂</span> saliente: a cochera</span><span><span class="ficha f-libre" style="display:inline-flex">F/S</span> fuera de servicio</span><span><span class="ficha f-vac" style="display:inline-flex">autocar</span> vacaciones</span></div>
<div class="card" style="margin-top:12px"><h2>Este mes</h2><p class="mini" style="margin:0">Se queda (servicio del mes, cupo de guardias, vacaciones), sin la barra de guardias: ya la cuenta el abono.</p></div>`, mesJS);

writeFileSync(join(HERE, "semana.html"), semana);
writeFileSync(join(HERE, "mes.html"), mes);
console.log("semana.html y mes.html escritos");
