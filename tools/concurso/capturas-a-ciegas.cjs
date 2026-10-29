// Concurso de maquetas: capturas barajadas (Y1…Yn) para el jurado a ciegas. Uso: node tools/concurso/capturas-a-ciegas.cjs <dir_salida> maquetas/x-*.html (ajusta «orden» y los gestos)
const { chromium } = require('playwright'); const fs=require('fs');
const S=process.argv[2]; const files=process.argv.slice(3);
const orden=[3,1,5,2,4]; // barajado: Y1=archivo 3 ...
(async()=>{ const b=await chromium.launch(); const res={};
for (let i=0;i<orden.length;i++){ const f=files.find(x=>x.includes('mes-'+orden[i]+'-')); const Y='Y'+(i+1);
  const p=await b.newPage({viewport:{width:412,height:915}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+process.cwd()+'/'+f); await p.waitForTimeout(500);
  // quita cartel y título
  await p.evaluate(()=>{document.title='';const s1=document.querySelector('[data-pantalla="1"]');let n=s1;while(n&&n!==document.body){let q=n.previousElementSibling;while(q){const r=q;q=q.previousElementSibling;if(r.tagName!=='SCRIPT'&&r.tagName!=='STYLE')r.remove();}n=n.parentElement;}});
  const shot=async (sel,name)=>{const e=await p.$(sel); if(e) await e.screenshot({path:`${S}/jur/${Y}-${name}.png`});};
  await shot('[data-pantalla="1"]','1-inicio'); await shot('[data-pantalla="2"]','2'); await shot('[data-pantalla="3"]','3');
  const txt1=await p.$eval('[data-pantalla="1"]',e=>e.innerText);
  const click=async re=>{ const bs=await p.$$('[data-pantalla="1"] button, [data-pantalla="1"] [role=button], [data-pantalla="1"] [onclick]'); for(const x of bs){const t=((await x.innerText()).trim()+' '+(await x.getAttribute('aria-label')||'')); if(re.test(t)&&await x.isVisible()){await x.click();await p.waitForTimeout(1600);return t.trim().slice(0,40);} } return null;};
  const anyClick=async re=>{ const bs=await p.$$('button,[role=button]'); for(const x of bs){const t=((await x.innerText()).trim()+' '+(await x.getAttribute('aria-label')||'')); if(re.test(t)&&await x.isVisible()){await x.click();await p.waitForTimeout(1600);return t.trim().slice(0,40);} } return null;};
  const c1=await click(/fijo|roca|vaso|alquiler/i); const t2=await p.$eval('[data-pantalla="1"]',e=>e.innerText);
  const h1=await p.$eval('[data-pantalla="1"]',e=>Math.round(e.getBoundingClientRect().height));
  await shot('[data-pantalla="1"]','1-fijos');
  const c2=await anyClick(/^[+\s]*Apuntar gasto grande/i); await p.screenshot({path:`${S}/jur/${Y}-hoja.png`});
  const c3=await anyClick(/apartando/i); await p.waitForTimeout(400);
  await p.keyboard.press('Escape').catch(()=>{}); const cerrar=await anyClick(/^(\s*)(cerrar|listo|hecho|guardar|aceptar|✕|×)/i);
  await shot('[data-pantalla="1"]','1-portatil'); await shot('[data-pantalla="2"]','2-portatil');
  const t3=await p.evaluate(()=>document.body.innerText);
  res[Y]={f,errs,c1,c2,c3,h1fijos:h1,ve1652:/1[.\s]?652/.test(t2),ve150:/\b150\b/.test(t3),texto1:txt1.slice(0,1500)};
  await p.close(); }
fs.writeFileSync(S+'/jur/res.json',JSON.stringify(res,null,1));
for(const [k,v] of Object.entries(res)) console.log(k,v.f,JSON.stringify({errs:v.errs,c1:v.c1,c2:v.c2,c3:v.c3,h:v.h1fijos,v1652:v.ve1652,v150:v.ve150}));
await b.close();})();
