// node design/hoy-cabina/shots.mjs → shots/E1.png, E2.png (390 px de ancho, como el móvil)
import { chromium } from "/home/user/app-organizador-MIR/node_modules/playwright/index.mjs";
import { dirname, join } from "node:path"; import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const pg = await b.newPage({ viewport: { width: 420, height: 1200 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
await pg.goto("file://" + join(HERE, "maqueta.html")); await pg.waitForTimeout(600);
for (const id of ["E1", "E2"]) { const el = await pg.$("#" + id); await el.screenshot({ path: join(HERE, "shots", id + ".png") });
  console.log(id, JSON.stringify(await el.evaluate((e) => ({ alto: Math.round(e.getBoundingClientRect().height), cabina: Math.round(e.querySelector(".cd svg").getBoundingClientRect().height), tier: Math.round(e.querySelector(".cd2 svg").getBoundingClientRect().height) })))); }
if (errs.length) console.log("errs", errs); await b.close();
