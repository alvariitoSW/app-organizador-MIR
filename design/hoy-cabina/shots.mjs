// node design/hoy-cabina/shots.mjs → shots/E1.png, E2.png (390 px de ancho, como el móvil) y E1-E2.png (las dos juntas)
import { chromium } from "/home/user/app-organizador-MIR/node_modules/playwright/index.mjs";
import { dirname, join } from "node:path"; import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const pg = await b.newPage({ viewport: { width: 420, height: 1200 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
await pg.goto("file://" + join(HERE, "maqueta.html")); await pg.waitForTimeout(600);
for (const id of ["E1", "E2"]) { const el = await pg.$("#" + id); await el.screenshot({ path: join(HERE, "shots", id + ".png") });
  console.log(id, JSON.stringify(await el.evaluate((e) => ({ alto: Math.round(e.getBoundingClientRect().height), cabina: Math.round(e.querySelector(".cd svg").getBoundingClientRect().height), tier: Math.round(e.querySelector(".cd2 svg").getBoundingClientRect().height) })))); }
/* las dos juntas, una al lado de la otra, para compararlas de un vistazo */
await pg.setViewportSize({ width: 860, height: 1200 });
await pg.evaluate(() => { document.body.style.cssText += ";display:flex;gap:16px;align-items:flex-start;justify-content:center;padding:8px"; document.querySelectorAll(".ab").forEach((e) => { e.style.margin = "0"; }); });
await pg.waitForTimeout(300);
const caja = await pg.evaluate(() => { const r = [...document.querySelectorAll(".ab")].map((e) => e.getBoundingClientRect()); const x = Math.min(...r.map((q) => q.left)), y = Math.min(...r.map((q) => q.top));
  return { x: Math.max(0, x - 8), y: Math.max(0, y - 8), width: Math.max(...r.map((q) => q.right)) - x + 16, height: Math.max(...r.map((q) => q.bottom)) - y + 16 }; });
await pg.screenshot({ path: join(HERE, "shots", "E1-E2.png"), clip: caja });
if (errs.length) console.log("errs", errs); await b.close();
