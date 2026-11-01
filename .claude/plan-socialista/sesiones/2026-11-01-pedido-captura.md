# Sesión 01/11/2026 · pedido desde una captura (Comer)

- **Pedido:** mandar una captura de Glovo (u otra app) y que se apunte la comida con kcal y macros.
- **Decidido con el usuario:** leer en el móvil (lo de DeepSeek de fiebres-neutropenias es un bot de GitHub, no sirve); cesta y ficha; por ingredientes + plato tipo; preguntar cuántos si trae más de uno; maqueta primero (aprobada: `maquetas/captura-pedido.png`).
- **Hecho:** módulo `ped*` en `app.js` (tras `fueraApuntar`), estilos `.ped*`, `food.pedMemo` en normalize, prueba 449 (cae sin guardar lo corregido y sin el arreglo del ancho). El 📷 ensanchaba la portada de Comer a 461 px (cazado por el verificador y la 382): `.frase input{width:0}`.
- **Desplegado:** main `cd45eec`, Pages run 41361810227. Suite 935/935 + 7 bancos en verde.
- **Gasto:** ≈1,8 M (97 % sesión principal).
- **Queda:** `aparc-pedido-otras-apps`.
