/* Piezas nuevas de esta tanda. La piel base sale de ../comida/build.mjs, que copia los
   tokens de styles.css. Aquí solo van las clases que esta pantalla necesita y que
   _base.css todavía no lleva: las puertas (ya existen en la app) y la lista de estado. */
export const EXTRA3 = `<style>
/* --- campos y etiquetas, copiados de styles.css: _base.css no los lleva --- */
input,select,textarea{font:inherit;font-size:13px;padding:6px 9px;border:1px solid #1e2b44;border-radius:10px;
  background:color-mix(in srgb,#070b14 55%,#111a2b);color:#e9f2ff;min-width:0}
label.fld{display:flex;flex-direction:column;gap:4px;font-size:10.5px;font-weight:800;color:#8fa6c6;text-transform:uppercase;
  letter-spacing:.05em;flex:1 1 160px}
label.fld>input,label.fld>select,label.fld>textarea{font-weight:400;text-transform:none;letter-spacing:0}
/* --- las puertas: el patrón que ya usa «Turno y rotación» --- */
.puertas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.puerta{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;text-align:left;font:inherit;
  color:#e9f2ff;padding:12px 10px;border-radius:14px;min-height:88px;border:1px solid #1e2b44;cursor:pointer;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.gico{width:19px;height:19px;flex:none;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.puerta .gico{color:#8fa6c6;margin-bottom:4px}
.puerta>b{font-size:12.5px;line-height:1.2}
.puerta .s{font-size:10px;color:#8fa6c6}
/* --- lista de estado: qué tienes encendido, con su valor de verdad --- */
.estado{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px dashed #1e2b44;min-height:42px}
.estado:first-of-type{border-top:0;padding-top:2px}
.estado .em{font-size:16px;width:22px;text-align:center;flex:none;line-height:1}
.estado .tx{flex:1;min-width:0;font-size:12.5px}
.estado .tx b{font-weight:600}
.estado .vl{font-size:11px;font-weight:800;color:#e9f2ff;white-space:nowrap}
.estado .vl.off{color:#8fa6c6;font-weight:600}
/* --- lo que se exporta al calendario: seis categorías, cada una con su punto --- */
.cats{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.cats span{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;
  border:1px solid #1e2b44;border-radius:999px;padding:5px 9px;background:color-mix(in srgb,#070b14 42%,#111a2b)}
.cats span i{width:6px;height:6px;border-radius:99px;flex:none;display:inline-block}
/* --- un evento de la lista --- */
.ev{display:flex;align-items:center;gap:11px;padding:10px 0;border-top:1px dashed #1e2b44;min-height:52px}
.ev:first-of-type{border-top:0}
.ev .fch{flex:none;width:44px;text-align:center;border:1px solid #1e2b44;border-radius:10px;padding:4px 0;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.ev .fch em{display:block;font-style:normal;font-size:15px;font-weight:800;line-height:1.1}
.ev .fch span{display:block;font-size:8.5px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.05em}
.ev .tx{flex:1;min-width:0}
.ev .tx b{display:block;font-size:13.5px;line-height:1.25}
.ev .tx span{display:block;font-size:10.5px;color:#8fa6c6;margin-top:2px}
.ev .x{flex:none;width:28px;height:28px;border-radius:9px;border:1px solid #1e2b44;background:#111a2b;color:#8fa6c6;font-size:13px}
/* --- el bloque de «dónde se guarda»: cifras en vez de 210 palabras --- */
.guarda{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:4px}
.guarda div{border:1px solid #1e2b44;border-radius:11px;padding:8px 9px;background:color-mix(in srgb,#070b14 42%,#111a2b)}
.guarda b{display:block;font-size:15px;font-weight:800;line-height:1.15}
.guarda span{display:block;font-size:9px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
</style>`;

const ICO3 = {
  calendario:'<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  sol:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
  pincel:'<path d="M4 20c0-2.2 1.3-3 2.5-3S9 17.8 9 20c0 1.1-1.1 1.6-2.5 1.6S4 21.1 4 20z"/><path d="M8.5 16.5 19 6a2.1 2.1 0 0 0-3-3L5.5 13.5"/>',
  cama:'<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 14h18M7 9V7.5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 17 7.5V9"/>',
  enlace:'<path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.5 6.3"/><path d="M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.3-1.3"/>',
  manzana:'<path d="M12 7.5c-1.2-1-4.5-1.6-6 1.3-1.6 3.1.4 9.7 3.4 10.8 1.1.4 1.8-.3 2.6-.3s1.5.7 2.6.3c3-1.1 5-7.7 3.4-10.8-1.5-2.9-4.8-2.3-6-1.3z"/><path d="M12 7.5V4.5M12 4.5c1.6 0 2.6-1 2.6-2.5-1.6 0-2.6 1-2.6 2.5z"/>',
  disco:'<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M8 3.5v6h8v-6M8 20.5v-5h8v5"/>',
  tabla:'<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M9 9.5v10M15 9.5v10"/>',
  plato:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.5"/>',
  hoja:'<path d="M6 3.5h8l4.5 4.5v12a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5z"/><path d="M14 3.5V8h4.5M8 13h8M8 17h5"/>',
  reloj2:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  subir:'<path d="M12 19V6M6.5 11.5 12 6l5.5 5.5"/><path d="M4 20.5h16"/>',
  bajar:'<path d="M12 5v13M17.5 12.5 12 18l-5.5-5.5"/><path d="M4 20.5h16"/>',
};
export const svg3 = (n, cls='ico') => ICO3[n] ? `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO3[n]}</svg>` : '';
