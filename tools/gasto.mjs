#!/usr/bin/env node
// Gasto de tokens de la sesión: la conversación principal y cada ayudante (agente) que lanzó.
// Copiado y adaptado de alvariitoSW/fiebres-neutropenias (autonomo/gasto.mjs). Aquí se trabaja
// «una sesión por tarea», así que la sesión entera es la tarea y no hace falta repartir por claves.
//
// Lee las transcripciones que guarda Claude Code (~/.claude/projects/<proyecto>/): la de la sesión
// (<sesion>.jsonl) y la de cada ayudante (<sesion>/subagents/agent-*.jsonl + .meta.json).
// El contenedor es nuevo en cada sesión: solo se puede medir la sesión en la que estás. Por eso se
// mide al final de cada tarea y se apunta en .claude/plan-socialista/gastos.md (--apunta).
//
// Uso:
//   node tools/gasto.mjs                          resumen de la sesión actual
//   node tools/gasto.mjs --json                   lo mismo en JSON
//   node tools/gasto.mjs --sesion <ruta.jsonl>    otra transcripción
//   node tools/gasto.mjs --apunta v3-cantidades --tipo arreglo --nota "qué encareció / cómo ahorrar"
//                                                 además añade la fila a gastos.md
//
// «Equivalente» suma los cuatro tipos de token con su peso en el precio de la API, en tokens de entrada:
// entrada nueva ×1, escritura en la caché ×1,25, lectura de la caché ×0,1, salida ×5. No mezcla modelos:
// un token del modelo potente cuesta más que uno del barato, por eso cada fila dice su modelo.

import { readdirSync, readFileSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const PESO = { entrada: 1, cacheEscrita: 1.25, cacheLeida: 0.1, salida: 5 };
const GASTOS = join(dirname(fileURLToPath(import.meta.url)), '..', '.claude', 'plan-socialista', 'gastos.md');

const args = process.argv.slice(2);
const opcion = nombre => { const i = args.indexOf(nombre); return i >= 0 ? args[i + 1] : undefined; };

function sesionMasReciente() {
    const carpeta = join(homedir(), '.claude', 'projects', process.cwd().replace(/[^A-Za-z0-9]/g, '-'));
    if (!existsSync(carpeta)) return null;
    const jsonl = readdirSync(carpeta).filter(f => f.endsWith('.jsonl')).map(f => join(carpeta, f));
    jsonl.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    return jsonl[0] ?? null;
}

// Cada mensaje del modelo aparece varias veces (una por bloque): de cada id vale la copia con más salida.
function leerUso(ruta) {
    const porId = new Map();
    let pasos = 0;
    for (const linea of readFileSync(ruta, 'utf8').split('\n')) {
        if (!linea.includes('"usage"')) continue;
        let o;
        try { o = JSON.parse(linea); } catch { continue; }
        const m = o.message;
        // «<synthetic>» son los avisos de error (límite de uso), no respuestas del modelo.
        if (o.type !== 'assistant' || !m?.usage || m.model === '<synthetic>') continue;
        pasos += (m.content ?? []).filter(b => b.type === 'tool_use').length;
        const previo = porId.get(m.id);
        if (!previo || (m.usage.output_tokens ?? 0) >= (previo.u.output_tokens ?? 0)) {
            porId.set(m.id, { modelo: m.model, u: m.usage });
        }
    }
    return { mensajes: [...porId.values()], pasos };
}

function sumar(mensajes) {
    const s = { entrada: 0, cacheEscrita: 0, cacheLeida: 0, salida: 0 };
    for (const { u } of mensajes) {
        s.entrada += u.input_tokens ?? 0;
        s.cacheEscrita += u.cache_creation_input_tokens ?? 0;
        s.cacheLeida += u.cache_read_input_tokens ?? 0;
        s.salida += u.output_tokens ?? 0;
    }
    s.equivalente = Math.round(Object.keys(PESO).reduce((a, k) => a + s[k] * PESO[k], 0));
    return s;
}

const modeloCorto = m => (m ?? '?').replace(/^claude-/, '').replace(/-\d{8}$/, '');
const miles = n => n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} M` : n >= 1e3 ? `${Math.round(n / 1e3)} k` : String(n);

const sesion = opcion('--sesion') ?? sesionMasReciente();
if (!sesion || !existsSync(sesion)) {
    console.error('No encuentro la transcripción de la sesión. Pásala con --sesion <ruta.jsonl>.');
    process.exit(1);
}

const filas = [];
const principal = leerUso(sesion);
if (principal.mensajes.length) {
    filas.push({ quien: 'sesión principal', papel: 'principal', modelo: modeloCorto(principal.mensajes.at(-1).modelo),
        pasos: principal.pasos, ...sumar(principal.mensajes) });
}
const carpetaAgentes = join(sesion.replace(/\.jsonl$/, ''), 'subagents');
if (existsSync(carpetaAgentes)) {
    for (const f of readdirSync(carpetaAgentes).filter(f => /^agent-.*\.jsonl$/.test(f))) {
        const ruta = join(carpetaAgentes, f);
        const rutaMeta = ruta.replace(/\.jsonl$/, '.meta.json');
        const meta = existsSync(rutaMeta) ? JSON.parse(readFileSync(rutaMeta, 'utf8')) : {};
        const { mensajes, pasos } = leerUso(ruta);
        if (!mensajes.length) continue;
        filas.push({ quien: meta.description ?? basename(f, '.jsonl'), papel: meta.agentType ?? '?',
            modelo: modeloCorto(mensajes.at(-1).modelo), pasos, ...sumar(mensajes) });
    }
}

const total = filas.reduce((a, f) => a + f.equivalente, 0);
const pasosTotal = filas.reduce((a, f) => a + f.pasos, 0);
const ayudantes = filas.filter(f => f.papel !== 'principal');

if (args.includes('--json')) {
    console.log(JSON.stringify({ sesion, pesos: PESO, total, pasos: pasosTotal, filas }, null, 2));
} else {
    console.log(`# Gasto de la sesión · ${basename(sesion)}\n`);
    console.log('Equivalente = entrada ×1 + caché escrita ×1,25 + caché leída ×0,1 + salida ×5 (en tokens de entrada).\n');
    console.log('| Quién | Papel | Modelo | Pasos | Entrada | Caché escrita | Caché leída | Salida | Equivalente | % |');
    console.log('|---|---|---|---|---|---|---|---|---|---|');
    for (const f of [...filas].sort((a, b) => b.equivalente - a.equivalente)) {
        console.log(`| ${f.quien.replace(/\|/g, '/')} | ${f.papel} | ${f.modelo} | ${f.pasos} | ${miles(f.entrada)} | ` +
            `${miles(f.cacheEscrita)} | ${miles(f.cacheLeida)} | ${miles(f.salida)} | **${miles(f.equivalente)}** | ` +
            `${Math.round(100 * f.equivalente / (total || 1))} % |`);
    }
    console.log(`\n**Total:** ${miles(total)} equivalentes · ${pasosTotal} pasos · ${ayudantes.length} ayudantes.`);
}

// --apunta: añade la fila de esta tarea al final de la tabla «Tareas medidas» de gastos.md.
const id = opcion('--apunta');
if (id) {
    if (!existsSync(GASTOS)) { console.error(`No existe ${GASTOS}.`); process.exit(1); }
    const mayor = [...filas].sort((a, b) => b.equivalente - a.equivalente)[0];
    const modelos = [...new Set(filas.map(f => f.modelo))].join(' + ');
    const fila = `| ${new Date().toISOString().slice(0, 10)} | ${id} | ${opcion('--tipo') ?? '?'} | ${modelos} | ` +
        `${ayudantes.length} | ${pasosTotal} | **${miles(total)}** | ${mayor ? `${mayor.quien} (${Math.round(100 * mayor.equivalente / (total || 1))} %)` : '—'} | ` +
        `${(opcion('--nota') ?? '—').replace(/\|/g, '/')} |`;
    const texto = readFileSync(GASTOS, 'utf8');
    const marca = '<!-- fin de tareas medidas -->';
    if (!texto.includes(marca)) { console.error(`Falta la marca «${marca}» en gastos.md.`); process.exit(1); }
    writeFileSync(GASTOS, texto.replace(marca, `${fila}\n${marca}`));
    console.log(`\nApuntado en .claude/plan-socialista/gastos.md: ${fila}`);
}
