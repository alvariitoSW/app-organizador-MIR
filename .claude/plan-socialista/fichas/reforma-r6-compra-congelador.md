# Ficha · La Reforma · R6 · Compra base + congelador

Maqueta aprobada `maquetas/comer-reforma.html` (vistas **Compra** y **Nevera**; Consejo, addenda R5 de
`consejo/2026-10-29-2.md`). Construir · opus dirige, sonnet construye · ~2,0 M. Rama `claude/magical-clarke-dlp8mb-r6`.

## 1. Qué y para qué
- **H1 · Compra base.** Dado «Mi compra base» (pollo 1 kg, lomo 600 g, pescado congelado 1 kg, arroz 1 kg, huevos 12,
  atún 3 latas, editable), cuando toco «🛒 Hacer la compra base», entonces entra en la Compra como grupo «Compra base»
  **restando lo que ya hay en casa** (lo cubierto sale apagado y no cuenta) y se va al «He hecho esta compra».
  Debajo, «Tu semana por caducidad»: pollo lun–mar, lomo mié–vie, pescado jue–dom («saca uno la noche antes»), aviso
  neutro y la fuente (USDA FoodKeeper y AESAN).
- **H2 · Reparto al terminar el lote.** Dado que marco hecho un lote de 6 raciones de lentejas, entonces sale una hoja
  «¿Cómo las repartes?» con la propuesta **según mi semana** (las raciones que el menú pide mientras aguanta en la
  nevera; si no se sabe, 2) y −/+ que suman siempre 6; Guardar mete N en la nevera y el resto ❄; Cancelar no apunta nada.
- **H3 · Congelador en la Nevera.** Las raciones ❄ salen en su propia zona «❄ Congelador» (distinta, no solo por color)
  con «❄ 3 meses · hasta 2 ene»; el pescado congelado de la despensa ≥500 g sale como «4 × 250 g ❄ · saca una la noche
  antes». Lo que se come del táper gasta primero la nevera y luego el congelador.
- **H4 · `congela` y la tabla.** `dishes[].congela:{nevera,meses}` opcional (se edita en el plato); sin él, la tabla de
  duraciones por nombre con su fuente. `diasAguanta` usa `congela.nevera` si está. Plegable «Platos que congelan bien»:
  los 8 platos base **solo como lista** con sus meses y la fuente (no se crean platos).

## 2. Dudas (contestadas el 30/10)
- Reparto: **según tu semana** (fallback 2). · Compra base: **al tocar el botón**, no sola cada semana.
- Platos base: **solo como lista** de referencia.

## 3. Dónde se toca
- Datos: `food()` 3704 → `f.compraBase=[{nom,q,uni}]` (por defecto los 6 de H1), `f.compraBaseOn` (fecha; se borra en
  `hacerCompra` 4231). `cocinadoS` 12643: entradas `{…,cong:true,hasta:+meses}`; `cocinadoAdd` 12647 (+ arg cong).
  `cocinadoGasta` 12649: primero `!cong`. `cocinadoPrevision`/`renderNevera2` COCINADO: solo `!cong`.
- Tabla: junto a `diasAguanta` 12425 → `const CONGELA_TABLA=[[re,nevera,meses,emoji,nombre]…]` + `CONGELA_FUENTE`;
  `congelaDe(d)` = `d.congela` o la tabla (por defecto `{nevera:diasAguanta,meses:3}`). Valores de la maqueta: guisos de
  legumbre, chili, albóndigas, curry, boloñesa 3 meses; merluza en salsa, fajitas 2. Caducidad cruda: ave 1–2 d, cerdo/
  ternera en pieza 3–5 d, picada 1–2 d, pescado fresco 1–2 d (Consejo, Sanidad).
- Compra: `compraDatos0` 19486, `grupos` ~19548 → grupo `['base','Compra base',…]` si `compraBaseOn` (ids `cb#nom`; la
  resta la hace ya el bucle `casaTiene` 19564). `renderShop` 19802, `$('#main').innerHTML` ~19864: tarjeta «Mi compra
  base» (Editar = textarea, una por línea, se lee con `parseIng`) + botón + «Tu semana por caducidad».
- Reparto: `HOJAS` 8034 (+ `hojaMarco` 8059, `pintaHojaDia`) → hoja `reparto` con `ui.repHoja={dishId,total,nev}`.
  Los tres «hecho»: `cje-hecho` 24928 (`t.dias` lleva `y.fz`: nevera = `!fz`), `hc-ok` 24995, `cocina-hecho` 25114
  → abren la hoja en vez de `cocinadoAdd`; `rep-mas`/`rep-menos`/`rep-ok`/`rep-no` en `act()`.
- Nevera: `renderNevera2` 12562 → zona «❄ Congelador» tras COCINADO + plegable de platos base. Despensa congelada:
  `x.sec==='congelado'` o `/congelad/` (`COMPRA_SECS` 19656).
- Plato: el formulario de `ui.plato` (buscar `data-a="plato-` cerca de `guardarPlato` 13249) → campos «nevera (días)» y
  «congelador (meses)», guardados en `datos.congela` solo si se rellenan.
- Pruebas: `tests/regression.test.js`, última la 371 (l. 14557). La 205 (l. 7185) es la del Lloretazo, aparcada.

## 4. Pasos
- [x] P1 Pruebas encadenadas 372–375 (fallan antes): compra base → Hacer → grupo con lo de casa apagado → He hecho
  la compra la limpia; lote 6 → hoja con la propuesta de la semana → + → Guardar → nevera N y ❄ resto con «hasta»;
  comer del táper gasta nevera primero; plato con `congela` → la Nevera dice sus meses · general-purpose sonnet · ~15
- [x] P2 Datos y tabla (`CONGELA_TABLA`, `congelaDe`, `cocinado` con `cong`, `diasAguanta`) · sonnet (mismo) · ~10
- [x] P3 Compra base (grupo, tarjeta, editar, caducidad) · sonnet (mismo) · ~15
- [x] P4 Hoja del reparto y los tres «hecho» · sonnet (mismo) · ~15
- [x] P5 Zona congelador + kilo en raciones + plegable + campos del plato · sonnet (mismo) · ~15
- [x] P6 Suite en corto + capturas Compra y Nevera (con la hoja) a 412×915 frente a la maqueta · verificador sonnet · ~12
- [x] P7 DECISIONS, plan, gasto, sello, 205, main y traspaso con el prompt de R7 · principal

## 5. Comprobación
H1→P1,P3 · H2→P1,P4 · H3→P1,P2,P5 · H4→P1,P2,P5. Sin dudas abiertas. Maqueta aprobada; las pruebas caen al revertir;
412×915 en P6. Nada sale del móvil; textos del usuario con `esc()`.

**Gasto:** 3,6 M de ~2,0 M (obra 1,7 M, principal 1,6 M por mezclar la G1 de main). En main 56f30af.
