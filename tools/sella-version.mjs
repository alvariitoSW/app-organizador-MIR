/* Escribe version.json con la marca del despliegue.
   La app no lleva la versión incrustada: al arrancar lee este archivo y se queda con lo que ponga;
   cada vez que vuelves a la app lo vuelve a leer y, si ha cambiado, sabe que hay algo nuevo.
   Así no hace falta ningún paso de compilación ni acordarse de tocar un número a mano.
   Uso: node tools/sella-version.mjs   (o npm run sella) */
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

let commit = '';
try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch { /* sin git, da igual */ }

const v = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
writeFileSync('version.json', JSON.stringify({ v, commit }, null, 1) + '\n');
console.log('version.json sellado:', v, commit ? '· ' + commit : '');
