import {readFileSync, writeFileSync} from 'node:fs';
import {chromium} from '/home/user/app-organizador-MIR/node_modules/playwright/index.mjs';
const files=['Main','Calendario','Eventos','Datos','Aspecto','Copia'];
const OUT='/tmp/shots/';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const f of files){
  const src=readFileSync(f+'.dc.html','utf8');
  const style=(src.match(/<helmet>\s*<style>([\s\S]*?)<\/style>/)||[])[1]||'';
  const body=(src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)||[])[1].replace(/<helmet>[\s\S]*?<\/helmet>/,'');
  writeFileSync('/tmp/prev.html',`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  await p.goto('file:///tmp/prev.html');
  await p.waitForTimeout(250);
  const m=await p.evaluate(()=>({alto:(function(){const m=document.querySelector('main');const k=m.children;
      if(!k.length)return 0;const a=m.getBoundingClientRect(),b=k[k.length-1].getBoundingClientRect();
      const cs=getComputedStyle(m);return Math.round(b.bottom-a.top+parseFloat(cs.paddingBottom||0));})(),
    bot:document.querySelectorAll('button').length,
    campos:document.querySelectorAll('input,select,textarea').length,
    pal:(document.querySelector('main')||document.body).innerText.trim().split(/\s+/).filter(Boolean).length,
    desborde:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
  console.log(f.padEnd(11),'alto',String(m.alto).padStart(4),'·',(m.alto/844).toFixed(2)+' pant ·',
    String(m.bot).padStart(3),'bot ·',String(m.campos).padStart(2),'campos ·',String(m.pal).padStart(4),'palabras',
    m.desborde?'⚠ DESBORDE':'');
  await p.screenshot({path:OUT+'ad-'+f+'.png',fullPage:true});
  await p.close();
}
await b.close();
