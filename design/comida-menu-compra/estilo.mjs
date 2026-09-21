/* Piezas nuevas de esta tanda de maquetas. La piel base sale de ../comida/build.mjs,
   que a su vez copia los tokens de styles.css de la app. */
export const EXTRA2 = `<style>
/* --- LA CADENA: menú -> cocina -> compra, que hoy son tres destinos que no se nombran --- */
.cadena{position:relative;margin-top:2px}
.cadena::before{content:'';position:absolute;left:19px;top:26px;bottom:26px;width:2px;
  background:linear-gradient(180deg,#38e1ff,#7c5cff,#34d399);opacity:.45;border-radius:99px}
.eslabon{display:flex;align-items:center;gap:11px;padding:10px 0;width:100%;text-align:left;
  background:none;border:0;border-top:1px dashed #1e2b44;color:#e9f2ff;font:inherit;min-height:62px}
.eslabon:first-of-type{border-top:0}
.eslabon .pto{width:40px;height:40px;flex:none;border-radius:13px;display:flex;align-items:center;justify-content:center;
  border:1px solid #1e2b44;background:#0b1220;position:relative;z-index:1}
.eslabon .pto .ico{width:20px;height:20px}
.eslabon.m .pto{border-color:color-mix(in srgb,#38e1ff 55%,#1e2b44);background:color-mix(in srgb,#38e1ff 13%,#0b1220)}
.eslabon.m .pto .ico{color:#38e1ff}
.eslabon.c .pto{border-color:color-mix(in srgb,#7c5cff 55%,#1e2b44);background:color-mix(in srgb,#7c5cff 13%,#0b1220)}
.eslabon.c .pto .ico{color:#a78bfa}
.eslabon.k .pto{border-color:color-mix(in srgb,#34d399 55%,#1e2b44);background:color-mix(in srgb,#34d399 13%,#0b1220)}
.eslabon.k .pto .ico{color:#34d399}
.eslabon .tx{flex:1;min-width:0}
.eslabon .tx b{display:block;font-size:13.5px;line-height:1.2}
.eslabon .tx span{display:block;font-size:11px;color:#8fa6c6;margin-top:2px}
.eslabon .tx span em{font-style:normal;color:#e9f2ff;font-weight:700}
.eslabon .ch{color:#8fa6c6;flex:none}
/* --- la compra --- */
.prog{display:flex;align-items:center;gap:9px;margin:2px 0 4px}
.prog .bar{flex:1;height:8px;border-radius:999px;background:color-mix(in srgb,#111a2b 60%,#070b14);
  border:1px solid #1e2b44;overflow:hidden}
.prog .bar i{display:block;height:100%;background:linear-gradient(90deg,#34d399,#a3e635)}
.prog b{font-size:12px;font-weight:800;white-space:nowrap}
.seccion{display:flex;align-items:center;gap:8px;width:100%;text-align:left;background:none;border:0;
  color:#e9f2ff;font:inherit;padding:11px 0 8px;border-top:1px solid #1e2b44;min-height:44px}
.seccion:first-of-type{border-top:0;padding-top:2px}
.seccion b{font-size:13px}
.seccion .n{font-size:10.5px;font-weight:800;color:#8fa6c6;border:1px solid #1e2b44;border-radius:7px;padding:2px 7px}
.seccion .ch{margin-left:auto;color:#8fa6c6}
.linea{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-top:1px dashed #1e2b44;min-height:46px}
.linea .box{width:21px;height:21px;flex:none;border-radius:7px;border:1.5px solid #2c3d5c;margin-top:1px;
  display:flex;align-items:center;justify-content:center}
.linea.ok .box{border-color:#34d399;background:color-mix(in srgb,#34d399 20%,transparent);color:#34d399}
.linea.ok .box::after{content:'✓';font-size:13px;font-weight:800;line-height:1}
.linea .tx{flex:1;min-width:0}
.linea .tx b{font-size:13px;font-weight:600;line-height:1.3;display:block}
.linea .tx b .q{font-weight:800}
.linea.ok .tx b{color:#8fa6c6;text-decoration:line-through}
.linea .de{font-size:10px;color:#8fa6c6;margin-top:2px;display:inline-flex;align-items:center;gap:4px}
.linea .de i{width:5px;height:5px;border-radius:99px;background:#7c5cff;display:inline-block;flex:none}
/* --- el menú de la semana --- */
.tirasem{display:flex;gap:5px;margin-top:4px}
.tirasem div{flex:1;border:1px solid #1e2b44;border-radius:10px;padding:7px 2px;text-align:center;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.tirasem div.hoy{border-color:color-mix(in srgb,#38e1ff 55%,#1e2b44);background:color-mix(in srgb,#38e1ff 12%,#111a2b)}
.tirasem span{display:block;font-size:9px;font-weight:800;color:#8fa6c6;text-transform:uppercase;letter-spacing:.04em}
.tirasem em{display:block;font-size:17px;font-style:normal;line-height:1.3;margin-top:2px}
.tirasem b{display:block;font-size:9px;font-weight:800;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tirasem div.hoy b{color:#38e1ff}
/* --- una toma del menú de un día: tarjeta, no fila de tabla (la tabla se salía 3 px) --- */
.toma2{border:1px solid #1e2b44;border-radius:13px;padding:10px 11px;margin-top:8px;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.toma2 .cab{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.toma2 .hora{font-size:13px;font-weight:800;font-variant-numeric:tabular-nums}
.toma2 .et{font-size:11.5px;color:#8fa6c6;font-weight:700}
.toma2 .kc{margin-left:auto;font-size:11px;font-weight:800;color:#8fa6c6;white-space:nowrap}
.toma2 .cuerpo{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.toma2 .pl{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:6px 10px;
  border-radius:999px;border:1px solid #1e2b44;background:#0b1220;min-height:32px;max-width:100%}
.toma2 .pl b{font-weight:800;color:#8fa6c6;font-size:10.5px}
.toma2 .pl.arm{border-color:color-mix(in srgb,#38e1ff 45%,#1e2b44);color:#38e1ff;
  background:color-mix(in srgb,#38e1ff 10%,#0b1220)}
.toma2 .acc{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.mini2{font-size:11px;font-weight:700;padding:5px 10px;border-radius:999px;border:1px solid #1e2b44;
  background:#0b1220;color:#8fa6c6;min-height:30px;display:inline-flex;align-items:center;gap:5px}
/* --- tandas --- */
.tanda{border:1px solid #1e2b44;border-radius:14px;margin-top:9px;overflow:hidden;
  background:color-mix(in srgb,#070b14 42%,#111a2b)}
.tanda .th{display:flex;align-items:center;gap:10px;padding:12px;width:100%;text-align:left;background:none;
  border:0;color:#e9f2ff;font:inherit;min-height:56px}
.tanda .th .dia{font-size:13.5px;font-weight:800}
.tanda .th .sub{font-size:10.5px;color:#8fa6c6;display:block;margin-top:2px;font-weight:400}
.tanda .th .rac{margin-left:auto;font-size:10.5px;font-weight:800;color:#a78bfa;border:1px solid color-mix(in srgb,#7c5cff 45%,#1e2b44);
  border-radius:999px;padding:3px 9px;background:color-mix(in srgb,#7c5cff 12%,transparent);white-space:nowrap}
.tanda .tb{padding:0 12px 12px;border-top:1px dashed #1e2b44}
.tanda .fila{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px dashed #1e2b44}
.tanda .fila:first-of-type{border-top:0}
.tanda .fila .em{font-size:19px;flex:none}
.tanda .fila .nm{flex:1;min-width:0}
.tanda .fila .nm b{display:block;font-size:12.5px}
.tanda .fila .nm span{font-size:10px;color:#8fa6c6}
</style>`;

/* iconos que no estaban en el juego anterior */
const ICO2 = {
  lista:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  caja:'<path d="M3 8l9-4 9 4v8l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v8"/>',
  importar:'<path d="M12 3v11"/><path d="M8 10l4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>',
  carro:'<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2.5 3h2.2l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.8-1.4L21 7H6"/>',
};
export const svg2 = (n, cls='ico') =>
  ICO2[n] ? `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO2[n]}</svg>` : null;
