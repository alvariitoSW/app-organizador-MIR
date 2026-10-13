/* las piezas comunes de las escenas de Hoy: la figura del conductor (y lo que compartan la hoja de escenas y la
   estación de la app). Cada función toma la proyección P y coordenadas del mundo */
import * as k from "../../.claude/skills/anatomy/kit/iso-kit.mjs";
import * as G from "../../.claude/skills/anatomy/kit/lathe.mjs";
const S = (paths, o) => k.solidSvg(paths, o);
export /* ---------- la figura: cabeza, gorra, torso, piernas; de pie, tumbado, sentado, colgado ---------- */
function persona(P, [x, y, z], pose, mirando) {
  const o = [], d = mirando || [0, 1];
  const H = 3.2;   /* el radio de la cabeza */
  if (pose === "tumbado") {   /* a lo largo de x, la cabeza a la izquierda */
    o.push(S(k.slabOf({ x: x, y: y - 3, w: 10, d: 6, r: 1.4 }, z, 3.4, P, 3, 0.6), { tone: "mid", className: "m-uni" }));
    o.push(S(k.slabOf({ x: x + 10, y: y - 2.4, w: 9, d: 4.8, r: 1.2 }, z, 2.8, P, 3, 0.5), { tone: "mid", className: "m-cloth" }));
    o.push(S(G.sphereOf([x - 2.4, y, z + 2.4], H, P, { steps: 24 }), { tone: "hi", className: "m-skin" }));
    return o.join("");
  }
  if (pose === "sentado") {
    o.push(S(k.slabOf({ x: x - 3, y: y - 2.6, w: 6, d: 5.2, r: 1.2 }, z, 9, P, 3, 0.6), { tone: "mid", className: "m-uni" }));
    o.push(S(k.slabOf({ x: x - 3, y: y + 2.4, w: 6, d: 6, r: 1 }, z, 3, P, 3, 0.5), { tone: "mid", className: "m-gorra" }));   /* los muslos hacia delante */
    o.push(S(G.sphereOf([x, y, z + 9 + H], H, P, { steps: 24 }), { tone: "hi", className: "m-skin" }));
    o.push(S(k.cylinder(x, y, H + 0.3, z + 9 + H + 1.2, 1.2, P, 16), { tone: "mid", className: "m-gorra" }));
    return o.join("");
  }
  if (pose === "colgado") {   /* bajo la barra: brazos arriba, pies en el aire */
    for (const dx of [-1.4, 1.4]) o.push(S(k.slabOf({ x: x + dx - 1.1, y: y - 1.1, w: 2.2, d: 2.2, r: 0.6 }, z, 8, P, 2, 0.3), { tone: "mid", className: "m-gorra" }));
    o.push(S(k.slabOf({ x: x - 3, y: y - 2.4, w: 6, d: 4.8, r: 1.2 }, z + 8, 10, P, 3, 0.6), { tone: "mid", className: "m-uni" }));
    o.push(S(G.sphereOf([x, y, z + 18 + H], H, P, { steps: 24 }), { tone: "hi", className: "m-skin" }));
    for (const dx of [-3.6, 3.6]) o.push(S(k.slabOf({ x: x + dx - 0.9, y: y - 0.9, w: 1.8, d: 1.8, r: 0.5 }, z + 16, 10, P, 2, 0.3), { tone: "mid", className: "m-skin" }));
    return o.join("");
  }
  /* de pie */
  for (const dx of [-1.6, 1.6]) o.push(S(k.slabOf({ x: x + dx - 1.2, y: y - 1.2, w: 2.4, d: 2.4, r: 0.6 }, z, 9, P, 2, 0.3), { tone: "mid", className: "m-gorra" }));
  o.push(S(k.slabOf({ x: x - 3.2, y: y - 2.4, w: 6.4, d: 4.8, r: 1.3 }, z + 9, 10.5, P, 3, 0.7), { tone: "mid", className: "m-uni" }));
  for (const dx of [-4.2, 4.2]) o.push(S(k.slabOf({ x: x + dx - 0.9, y: y - 0.9, w: 1.8, d: 1.8, r: 0.5 }, z + 10, 8.5, P, 2, 0.3), { tone: "mid", className: "m-uni" }));
  o.push(S(G.sphereOf([x, y, z + 19.5 + H], H, P, { steps: 24 }), { tone: "hi", className: "m-skin" }));
  o.push(S(k.cylinder(x, y, H + 0.3, z + 19.5 + H + 1.3, 1.2, P, 16), { tone: "mid", className: "m-gorra" }));
  o.push(S(k.slabOf({ x: x - 2.2 + d[0] * 2.5, y: y - 2.2 + d[1] * 2.5, w: 4.4, d: 4.4, r: 0.6 }, z + 19.5 + H + 1.2, 0.5, P, 2), { tone: "mid", className: "m-gorra" }));   /* la visera */
  return o.join("");
}

