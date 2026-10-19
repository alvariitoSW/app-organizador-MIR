# PRUEBAS SUELTAS: saca de tests/regression.test.js solo las pruebas que le digas (por número o por un
# trozo de su título de bloque) y escribe tests/zz-sueltas.test.js con el arranque y el cierre de la
# suite. La suite entera tarda ~12 min; una o dos pruebas, menos de uno.
#
#   python3 tools/pruebas-sueltas.py 274 320 'Varios periodos de vacaciones'
#
# Lo normal es no llamarlo a mano sino con tools/pruebas-corto.sh --solo 274 320, que lo corre y lo borra.
# Ojo: muchas pruebas parten del estado que deja la anterior; si una sola cae y en la suite no, pásala
# con la de antes.
import os, re, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
L = open(os.path.join(RAIZ, 'tests', 'regression.test.js'), encoding='utf-8').read().split('\n')
cab = next(i for i, l in enumerate(L) if l.startswith('  // 1) el ciclo'))
cola = next(i for i, l in enumerate(L) if "check('sin errores de JavaScript no capturados" in l)
marca = re.compile(r'^  // ([0-9]+[a-z]?\)|=====)')
out = L[:cab]
for k in sys.argv[1:]:
    pre = '  // ' + k + ')' if re.match(r'^[0-9]+[a-z]?$', k) else None
    a = next((i for i, l in enumerate(L) if (l.startswith(pre) if pre else (marca.match(l) and k in l))), None)
    if a is None:
        sys.exit('no encuentro la prueba «' + k + '» en tests/regression.test.js')
    j = a + 1
    while j < cola and not marca.match(L[j]):
        j += 1
    out += L[a:j]
out += L[cola:]
open(os.path.join(RAIZ, 'tests', 'zz-sueltas.test.js'), 'w', encoding='utf-8').write('\n'.join(out))
