# REPARTO DEL BANCO GRANDE: parte tests/regression.test.js en N trozos seguidos (sin desordenar las pruebas, que
# muchas parten del estado que deja la anterior) y escribe tests/zz-trozo-1.test.js … zz-trozo-N.test.js, cada uno
# con el arranque y el cierre de la suite. tools/pruebas-corto.sh los corre a la vez, uno por núcleo: la suite pasa de
# ~11 min a lo que tarde el trozo más largo.
#
#   python3 tools/pruebas-reparto.py 3
#
# Los cortes solo caen delante de las pruebas de CORTES_VALIDOS: las que pasan arrancando de cero, sin lo que dejaron
# las de antes (comprobado: de la 202 a la 269 y de la 270 al final pasan solas). Las 201 primeras van en cadena (la
# jornada 8–15, los tipos de guardia, los platos y el menú los ponen las primeras) y no se pueden partir sin darles
# antes sus datos. Para añadir un corte: que el tramo que empieza ahí pase solo y entero.
import os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = open(os.path.join(RAIZ, 'tests', 'regression.test.js'), encoding='utf-8').read().split('\n')
cab = next(i for i, l in enumerate(L) if l.startswith('  // 1) el ciclo'))
cola = next(i for i, l in enumerate(L) if "check('sin errores de JavaScript no capturados" in l)
marca = re.compile(r'^  // ([0-9]+[a-z]?\)|=====)')

# las pruebas delante de las que se puede cortar (su número tal cual sale en el comentario: «// 240)»)
CORTES_VALIDOS = ['202', '270']

n = int(sys.argv[1]) if len(sys.argv) > 1 else 3
inicios = [i for i in range(cab, cola) if marca.match(L[i])]
peso = {a: (inicios[k + 1] if k + 1 < len(inicios) else cola) - a for k, a in enumerate(inicios)}
num = lambda i: (re.match(r'^  // ([0-9]+[a-z]?)\)', L[i]) or [None, None])[1]
# dónde se puede cortar: delante de una prueba de la lista (o en cualquier sitio si la lista está vacía)
validos = [i for i in inicios[1:] if not CORTES_VALIDOS or num(i) in CORTES_VALIDOS]
total = sum(peso.values())
cortes, acum = [], 0
for i in inicios:
    if len(cortes) == n - 1:
        break
    if i in validos and acum >= total * (len(cortes) + 1) / n:
        cortes.append(i)
    acum += peso[i]
bordes = [cab] + cortes + [cola]
for k in range(len(bordes) - 1):
    trozo = L[:cab] + L[bordes[k]:bordes[k + 1]] + L[cola:]
    open(os.path.join(RAIZ, 'tests', 'zz-trozo-%d.test.js' % (k + 1)), 'w', encoding='utf-8').write('\n'.join(trozo))
    print('trozo %d: desde la línea %d (%s), %d líneas' % (k + 1, bordes[k] + 1, (num(bordes[k]) or L[bordes[k]].strip()[:40]), bordes[k + 1] - bordes[k]))
