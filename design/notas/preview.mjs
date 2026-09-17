import {readFileSync, writeFileSync} from 'node:fs';
import {chromium} from '/home/user/app-organizador-MIR/node_modules/playwright/index.mjs';
const files=['Notas','NotaAbierta','AlCalendario','DiaEnElMes','Hoy'];
const OUT='/tmp/claude-0/-home-user-app-organizador-MIR/04570ec0-ed89-58d2-8ae8-39a350c9b3cb/scratchpad/';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const f of files){
  const src=readFileSync(f+'.dc.html','utf8');
  const style=(src.match(/<helmet>\s*<style>([\s\S]*?)<\/style>/)||[])[1]||'';
  const body=(src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)||[])[1].replace(/<helmet>[\s\S]*?<\/helmet>/,'');
  writeFileSync('/tmp/prev.html',`<!doctype html><meta charset="utf-8"><style>${style}</style>${body}`);
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  await p.goto('file:///tmp/prev.html');
  await p.waitForTimeout(250);
  const m=await p.evaluate(()=>({alto:document.querySelector('.scr').scrollHeight,
    desborde:document.documentElement.scrollWidth>document.documentElement.clientWidth}));
  console.log(f.padEnd(11),'alto',String(m.alto).padStart(4),'·',(m.alto/844).toFixed(1)+' pantallas',m.desborde?'⚠ DESBORDE HORIZONTAL':'');
  await p.screenshot({path:OUT+'notas-'+f+'.png',fullPage:true});
  await p.close();
}
await b.close();
