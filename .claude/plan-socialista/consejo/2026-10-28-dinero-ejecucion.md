# Consejo de Ministros · 28/10/2026 · ejecución de la reforma de Dinero (por delegación)

Preside Transportes (`/bitacora`). Asisten Interior, Hacienda, Justicia, Bienestar y Economía (ministerio del asunto).
Base: delegación del usuario en `gobierno.md` («mi potestad en esto la tiene el consejo de ministros, que actúe»).

## Orden del día
1. El presupuesto de la tanda.
2. Qué se quita de la Dinero actual (lista «Se quitaría» de `2026-10-28-feria.md`).
3. El orden D1→D6 y cómo se reparte el trabajo.

## El mapa
`2026-10-28-dinero/mapa.md`: tres pestañas (Hoy/Ahorro/Mes), tres orígenes de «cuánto te queda», tres sistemas de metas,
~70 acciones en los dos switches de `app.js`, ~20 pruebas. Diseño elegido: La Laurisilva (Portada + Ahorro), el puesto 3
(Gastos) y R2-C (Compras), con la piel de la Laurisilva. La rama ya trae `main` (Comer S2/S2b).

## 1 · Presupuesto
| Ministerio | Dictamen | Voto |
|---|---|---|
| Hacienda | 4,3 M para D1-D6 en sonnet, más ~0,6 M de dirección (esta sesión, opus). Comparece quien pase un 25 % | sí |
| Interior | Cada D con su prueba encadenada; la suite completa solo al final | sí |
| Bienestar | Que no se corte a mitad: si una D se alarga, se para y se dice | sí |

**Acuerdo (Consejo por delegación):** presupuesto de **4,3 M** para la construcción y **~0,6 M** para dirigirla. Tope por
pieza = el de la tabla de `plan-v3.md`, con el +25 % para comparecer.

## 2 · Qué se quita
Regla de Justicia, que manda sobre todo lo demás: **no se borra ningún dato guardado**. Lo viejo de `store.dinero` y
`store.ahorro` se queda en el móvil (y en la copia de seguridad) aunque ya no se enseñe. Lo nuevo **se calcula a partir
de lo viejo** la primera vez (migración que copia y no toca), y si la migración falla, la app sigue con los datos viejos.

| Lo de la lista | Acuerdo | Por qué |
|---|---|---|
| «Te queda / Puedes gastar hoy» y sus tres orígenes | **Se quita** de la vista | La Laurisilva no lo usa; eran tres héroes distintos (Economía) |
| Pestañas Hoy, Ahorro, Mes | **Se sustituyen** por Portada (el bosque) · Gastos · Ahorro · Compras | Es el diseño elegido |
| Huchas por % o € y su reparto, «Repartir X €» | **Se quitan**; el saldo de cada hucha **pasa** a lo nuevo: colchón → el musgo (ahorro), las demás con objetivo → una compra (precio = objetivo, llevas = saldo); sus deseos sin hacer → compras | Nada se pierde: cambia de sitio |
| «Gasté de mis ahorros» y la meta antigua | **Se quitan**; la meta antigua, si existe, propone el objetivo de meses la primera vez | El objetivo a fecha la sustituye |
| Las dos pantallas de huchas | **Se quitan** | Las sustituye Compras |
| Lectura de capturas del banco | **Se quita** la pantalla; lo leído se queda guardado | Frágil (OCR); Fintonic se queda |
| Épocas de sueldo y festivos | **Se quita su pantalla solo si ya no la usa nada**; si el día de la nómina, Hoy, Mes o el .ics los usan, **se quedan** | Interior: no romper lo de fuera de Dinero |
| Restos v4-v8, vistas que redirigen, atajos con setTimeout | **Se quitan** | Código muerto |
| Recibos y fijos, taxis, hoja anual, Fintonic | **Se quedan** | Ya lo dijo la feria |

## 3 · El orden y el reparto
**Acuerdo:** D1 → D2 → D3 → D4 → D5 → D6, una tras otra en la rama `ccr-c4997bb6-02fys3`. Cada pieza la hace un
**constructor en sonnet** con su ficha (`ficha-de-tarea`) y su prueba encadenada que cae al revertir; el `verificador`
mira la pantalla a 412×915 después de D2-D5. La D2 (maqueta de Gastos y Compras con la piel de la Laurisilva) la aprueba
este Consejo sin volver al usuario (por delegación, dentro del diseño ya elegido). La D6 sigue esta acta (punto 2).
Al final: suite completa en verde, `npm run sella`, `version.json`, a `main`, Actions en `success`. Si algo no queda verde,
no se sube y se dice por qué.

Sesiones hijas: no hacen falta mientras la dirección pase solo encargos y resúmenes (los constructores leen `app.js` en
su lado). Si la dirección pasa de ~0,6 M, se parte lo que quede en una sesión nueva por D.

## Lo que entra en el plan
`plan-v3.md`, Tanda Dinero: «En marcha», D1-D6 con presupuesto aprobado.

## Lo que espera al usuario
Nada para construir. Puede reabrir cualquier punto de esta acta.

## Gasto de la reunión
~0,35 M hasta aquí (parte, revisión de salud, traer `main` y esta acta).
