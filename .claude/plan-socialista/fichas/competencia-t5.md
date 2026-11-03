# Ficha · La Competencia · T5 Entreno a horas tranquilas y comida al volver

## Qué y para qué
- Dado un sábado o domingo sin hora puesta, cuando miro Entreno, entonces la hora propuesta es 15:00 (parque, 40 min), no 10:00.
- Dado un día de entreno, cuando miro la comida principal, entonces es fin del entreno + vuelta (martes 15:00, 50 min: 16:05), nunca antes.
- Dado que el entreno no acaba 5 h antes de la cama o cae en hora punta, entonces busca otra hora tranquila y, si no hay, ese día no se propone y la semana dice por qué.

## Dónde se toca
- app.js: `franja`, `entrenoCabe` (nueva), `ENT_HORAS`, `horaLibreEntreno`, `entrenoSemana` (`x.nocabe`), `entrenoPorQue`, `entrenoSemanaHTML`, `finEntrenoDe`, `comidaPrincipalDe`, `cjeHoraMom`.
- Pruebas 610-614; cambian 252, 348 y la del bloque «La semana y el día pedían tres pantallas».

## Añade · Quita · No toca
- Añade: regla gimnasio tranquilo + 5 h antes de dormir, frase «no se propone: …», comida al volver.
- Quita: las horas 10:00-12:00 del fin de semana y la comida fija a las 18:00 con entreno de tarde.
- No toca: piscina del saliente, aviso «tras guardia» (T2a), hora puesta a mano, días forzados.

## Frases para el verificador (412×915)
«Entrenos de la semana» (con sueño de 12 h: «no se propone: dormirías a las»), portada de Entreno en sábado/domingo con «15:00».
