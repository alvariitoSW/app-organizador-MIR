# Ficha · La Competencia · C3 Hoy en una pantalla

## Qué y para qué
- Dado Hoy con el conductor, cuando abro, entonces veo cartel + cadena + «Ahora» (frase y energía) y, si toca, «Mejor no conduzcas».
- Dado un día de trabajo con hábitos, cuando miro bajo «Ahora», entonces hay una tira de hasta 3 hábitos; un toque marca, mantener pulsado abre.
- Dado guardia o saliente, entonces no hay tira.
- Dado Hoy, entonces el dibujo del conductor va entero bajo «Para hoy».
- Dado tema claro, el rótulo del turno mide ≥4,5:1 (barra de color + texto en tinta).

## Dónde se toca
- app.js: `hoyDiaHTML` (rama bus), `hoyAhoraHTML`, `hoyFraseAhora`, `hoyConducirHTML`, `habTiraHTML`, `paraHoyHTML` (sin hábitos), `renderHoy` (orden), rótulo `.hoyest` (`--tc`).
- styles.css (al final): `.hoyahora`, `.hoyener`, `.hoycond`, `.habtira*`, `.hoybusfuera`, `.hoyest` claro. Solo `--t-*`.
- Pruebas 480-485.

## Añade
«Ahora» con frase + energía + no conducir; tira de ≤3 hábitos; rótulo del turno legible en claro.

## Quita
La fila de hábitos de «Para hoy»; el dibujo del conductor arriba (baja entero).

## No toca
La cadena guardia › comida › ocio › sueño, «Sal al Lloret», `avisoCola()`, la cabina, otros días (el dibujo se queda en su tarjeta).

## Frases para el verificador
«Ahora ·», «Energía», «Hábitos de hoy · mantén pulsado para abrir», «Para hoy», «Sal al Lloret», «Mejor no conduzcas» (guardia/saliente con energía baja).

## Pasos
- [x] P1 pruebas 480-485 · [x] P2 Ahora + tira + orden · [x] P3 rótulo en claro · [x] P4 275 ajustada
