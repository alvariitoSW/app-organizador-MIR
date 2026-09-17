/* NOAA / «sunrise equation»: orto y ocaso a partir de latitud, longitud y fecha. Todo local:
   no hace falta red, que es justo lo que quiere una app que funciona sin cobertura. */
const RAD=Math.PI/180;
function solEnDia(y,mo,d,lat,lon){
  /* día juliano del mediodía UTC de esa fecha */
  const jd=Date.UTC(y,mo,d,12,0,0)/86400000+2440587.5;
  const n=Math.round(jd-2451545.0+0.0008);
  const Js=n-lon/360;   /* lon en grados, este positivo: al oeste el sol sale MÁS TARDE en UTC */
  const M=(357.5291+0.98560028*Js)%360;
  const C=1.9148*Math.sin(M*RAD)+0.0200*Math.sin(2*M*RAD)+0.0003*Math.sin(3*M*RAD);
  const lam=(M+C+180+102.9372)%360;
  const Jt=2451545.0+Js+0.0053*Math.sin(M*RAD)-0.0069*Math.sin(2*lam*RAD);
  const sinDec=Math.sin(lam*RAD)*Math.sin(23.4397*RAD);
  const cosDec=Math.cos(Math.asin(sinDec));
  const cosW=(Math.sin(-0.833*RAD)-Math.sin(lat*RAD)*sinDec)/(Math.cos(lat*RAD)*cosDec);
  if(cosW>1)return {polar:'noche'};                        /* no amanece */
  if(cosW<-1)return {polar:'dia'};                          /* no anochece */
  const w=Math.acos(cosW)/RAD;
  const jr=Jt-w/360, js=Jt+w/360;
  const aFecha=J=>new Date((J-2440587.5)*86400000);
  return {sale:aFecha(jr),pone:aFecha(js),transito:aFecha(Jt),horasDeLuz:(js-jr)*24};}

const LP={lat:28.1235,lon:-15.4363,tz:'Atlantic/Canary',nombre:'Las Palmas de Gran Canaria'};
const fmt=(d,tz)=>d?new Intl.DateTimeFormat('es-ES',{hour:'2-digit',minute:'2-digit',timeZone:tz,hour12:false}).format(d):'—';
console.log('=== '+LP.nombre+' ===');
[[2026,8,17,'17 sep 2026'],[2026,5,21,'21 jun 2026'],[2026,11,21,'21 dic 2026'],[2026,2,20,'20 mar 2026']]
  .forEach(([y,mo,d,et])=>{const s=solEnDia(y,mo,d,LP.lat,LP.lon);
    console.log(et.padEnd(12),'sale',fmt(s.sale,LP.tz),'· se pone',fmt(s.pone,LP.tz),
      '· luz',s.horasDeLuz.toFixed(2)+'h');});
console.log('\n=== otras regiones, 17 sep 2026 ===');
[['Madrid',40.4168,-3.7038,'Europe/Madrid'],['Barcelona',41.3874,2.1686,'Europe/Madrid'],
 ['Santa Cruz de Tenerife',28.4636,-16.2518,'Atlantic/Canary'],['Sevilla',37.3891,-5.9845,'Europe/Madrid'],
 ['Tromsø (polar)',69.65,18.96,'Europe/Oslo']]
  .forEach(([n,la,lo,tz])=>{const s=solEnDia(2026,8,17,la,lo);
    console.log(n.padEnd(24),'sale',fmt(s.sale,tz),'· se pone',fmt(s.pone,tz));});
console.log('\n=== Tromsø en solsticios (comprobar los casos polares) ===');
[[2026,5,21,'21 jun'],[2026,11,21,'21 dic']].forEach(([y,mo,d,et])=>{
  const s=solEnDia(y,mo,d,69.65,18.96);
  console.log(et.padEnd(8),s.polar?('SIN orto/ocaso → '+s.polar):(fmt(s.sale,'Europe/Oslo')+' / '+fmt(s.pone,'Europe/Oslo')));});
