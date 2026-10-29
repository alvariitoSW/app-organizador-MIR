// node chk.cjs maquetas/x.html [capturas_dir] → oficio a 412×915
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const f = path.resolve(process.argv[2]); const out = process.argv[3];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 412, height: 915 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('request', r => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) errs.push('RED ' + r.url()); });
  await p.goto('file://' + f); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const W = document.documentElement.scrollWidth;
    const pant = [...document.querySelectorAll('[data-pantalla]')].map(s => s.dataset.pantalla + ':' + Math.round(s.getBoundingClientRect().height));
    const chicos = [...document.querySelectorAll('button,a,[role=button],input,select,[onclick]')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.height && q.height < 44 && getComputedStyle(e).visibility !== 'hidden'; }).map(e => (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 25));
    const anchos = [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > 413).length;
    return { W, pant, chicos: chicos.slice(0, 8), nChicos: chicos.length, anchos };
  });
  if (out) { const ss = await p.$$('[data-pantalla]'); for (const s of ss) { const n = await s.getAttribute('data-pantalla'); await s.screenshot({ path: `${out}-p${n}.png` }); } }
  console.log(JSON.stringify({ ...r, errs: errs.slice(0, 5) }));
  await b.close();
})();
