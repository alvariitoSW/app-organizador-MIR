/* fig/calendario.js: lo fijo del calendario, dibujado una vez con el kit de /anatomy.
   window.CalFig = { css, fichas (los <symbol> de las seis fichas), carne (el carné corto con huecos data-r) }.
   La app rellena el carné (mes, servicio, cifras, la aguja de hoy) y pinta las fichas con <use href="#f-…">.
   node build-fig.mjs → ../../fig/calendario.js */
import { writeFileSync } from "node:fs";
import { SYMBOLS } from "./fichas.mjs";
import { corto } from "./carne.mjs";
import { CSS } from "./comun.mjs";
/* el tema: la app marca html.dark; el kit espera [data-theme=light]. Se reescribe el CSS para que lo claro
   sea «html:not(.dark)» y todo cuelgue de .cf (el envoltorio de cada ficha y del carné) */
const css = CSS
  .replace(/\.iso\[data-theme=light\]/g, "html:not(.dark) .cf").replace(/\[data-theme=light\] \.m-/g, "html:not(.dark) .cf .m-")
  .replace(/\[data-theme=light\] \./g, "html:not(.dark) .cf .").replace(/\.iso\{/g, ".cf{").replace(/\.iso /g, ".cf ")
  .replace(/\.iso-page\{[^}]*\}/g, "");
const out = `/* generado por design/calendario-propuestas/build-fig.mjs: no se edita a mano */\nwindow.CalFig=${JSON.stringify({ css, fichas: SYMBOLS, carne: corto().replace(/<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ') })};\n`;
writeFileSync(new URL("../../fig/calendario.js", import.meta.url), out);
console.log("fig/calendario.js:", Math.round(out.length / 1024), "KB (fichas", Math.round(SYMBOLS.length / 1024), "KB)");
