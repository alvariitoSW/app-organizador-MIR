/*
 * Suite de regresión para los bugs encontrados en la auditoría de seguridad/datos.
 * No sustituye a pruebas unitarias de verdad (el proyecto es un único script sin
 * módulos), pero fija en código el comportamiento correcto de la lógica que más
 * fallos dio: fechas, zona horaria, escapado de HTML y limpieza de la cámara.
 *
 * Uso: npm install && npm test
 * (arranca un servidor estático propio y abre la app con Playwright/Chromium;
 * no hace falta nada más instalado ni ningún puerto libre concreto)
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

function serveStatic() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      fs.readFile(p, (err, data) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const results = [];
function check(name, cond, detail) { results.push({ name, pass: !!cond, detail: detail || '' }); }
function isoDate(d) { const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return x.toISOString().slice(0, 10); }

(async () => {
  const server = await serveStatic();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}/`;

  const preinstalled = '/opt/pw-browsers/chromium';
  const browser = await chromium.launch({
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
    executablePath: fs.existsSync(preinstalled) ? preinstalled : undefined,
  });
  const context = await browser.newContext();
  await context.grantPermissions(['camera']);
  const page = await context.newPage();
  const nativeDialogs = [];
  page.on('dialog', (d) => { nativeDialogs.push(d.message()); d.dismiss(); });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  // navegación: Calendario (Hoy/Semana/Mes) agrupa 3 modos; Entreno/Compra son pestañas fijas;
  // el resto vive en el menú lateral (☰ Más)
  const CAL_TABS = new Set(['hoy', 'week', 'month']);
  const DRAWER_TABS = new Set(['food', 'habitos', 'types', 'batches', 'import', 'cfg', 'data', 'ajustes']);
  async function gotoTab(tab) {
    if (CAL_TABS.has(tab)) {
      await page.click('[data-a="nav-cal"]');
      await page.waitForTimeout(80);
      await page.click(`#calModes button[data-t="${tab}"]`);
    } else if (DRAWER_TABS.has(tab)) {
      await page.click('[data-a="drawer-toggle"]');
      await page.waitForTimeout(80);
      await page.click(`[data-a="drawer-nav"][data-t="${tab}"]`);
    } else {
      await page.click(`[data-a="tab"][data-t="${tab}"]`);
    }
    await page.waitForTimeout(150);
  }

  // Días y menús ya no es una sola pantalla: lista de tipos de día + una pantalla por sección
  async function gotoTypes(vista) {
    await gotoTab('types');
    await page.waitForTimeout(120);
    if (await page.evaluate(() => !!window.PG.ui.typesVista)) {
      await page.click('[data-a="types-vista"][data-v=""]');
      await page.waitForTimeout(120);
    }
    if (vista) {
      await page.click(`[data-a="types-vista"][data-v="${vista}"]`);
      await page.waitForTimeout(150);
    }
  }

  // Comida tampoco: portada + «apuntar comida» (con sus modos) + qué cocino + modo cocina
  async function gotoFood(vista, modo) {
    await gotoTab('food');
    await page.waitForTimeout(120);
    for (let i = 0; i < 3 && (await page.evaluate(() => !!window.PG.ui.foodVista)); i++) {
      await page.click('.subcab [data-a="food-vista"]');
      await page.waitForTimeout(120);
    }
    if (vista) {
      await page.click(`[data-a="food-vista"][data-v="${vista}"]`);
      await page.waitForTimeout(150);
    }
    if (modo) {
      await page.click(`[data-a="food-panel"][data-k="${modo}"]`);
      await page.waitForTimeout(150);
    }
  }

  // Entreno ya no es una sola pantalla: portada de fichas + una pantalla por sección
  async function gotoGym(panel) {
    await gotoTab('gym');
    await page.waitForTimeout(120);
    if (await page.evaluate(() => !!window.PG.ui.gymPanel)) {
      await page.click('[data-a="gym-panel"][data-p=""]');
      await page.waitForTimeout(150);
    }
    if (panel) {
      await page.click(`[data-a="gym-panel"][data-p="${panel}"]`);
      await page.waitForTimeout(200);
    }
  }

  await page.goto(base + 'index.html');
  await page.waitForTimeout(300);

  // 0) propuesta de navegación: al entrar, el calendario en modo "Mes" es la pantalla principal
  const defaultTab = await page.evaluate(() => window.PG.ui.tab);
  const monthVisible = await page.evaluate(() => document.querySelectorAll('#main .cal .dbox').length > 0);
  check('la app arranca en el calendario, en modo "Mes"', defaultTab === 'month' && monthVisible, 'tab=' + defaultTab);

  // 0b) Entreno y Compra son pestañas fijas (fuera del menú); el resto vive en el menú lateral
  const navShape = await page.evaluate(() => ({
    gymEnTabs: !!document.querySelector('#tabs [data-a="tab"][data-t="gym"]'),
    shopEnTabs: !!document.querySelector('#tabs [data-a="tab"][data-t="shop"]'),
    foodFueraDeTabs: !document.querySelector('#tabs [data-a="tab"][data-t="food"]'),
    foodEnCajon: !!document.querySelector('#drawer [data-a="drawer-nav"][data-t="food"]'),
  }));
  check('Entreno y Compra quedan fijos fuera del menú; el resto (p. ej. Comida) va al cajón lateral',
    navShape.gymEnTabs && navShape.shopEnTabs && navShape.foodFueraDeTabs && navShape.foodEnCajon,
    JSON.stringify(navShape));

  // 0c) el menú lateral (☰ Más) es accesible: atrapa el foco y Esc lo cierra devolviendo el foco al botón
  await page.click('[data-a="drawer-toggle"]');
  await page.waitForTimeout(150);
  const drawerOpenState = await page.evaluate(() => ({
    ariaHidden: document.getElementById('drawer').getAttribute('aria-hidden'),
    focusDentro: !!document.getElementById('drawer').contains(document.activeElement),
  }));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const drawerClosedState = await page.evaluate(() => ({
    ariaHidden: document.getElementById('drawer').getAttribute('aria-hidden'),
    focusEnBoton: document.activeElement && document.activeElement.getAttribute('data-a') === 'drawer-toggle',
  }));
  check('el menú lateral se abre con foco dentro y Esc lo cierra devolviendo el foco al botón',
    drawerOpenState.ariaHidden === 'false' && drawerOpenState.focusDentro &&
    drawerClosedState.ariaHidden === 'true' && drawerClosedState.focusEnBoton,
    JSON.stringify({ drawerOpenState, drawerClosedState }));

  // 1) el ciclo de servicios no vuelve a pintar "NaN" (bug del "+ +" en serviciosCard)
  await gotoTab('month');
  await page.waitForTimeout(200);
  const monthText = await page.evaluate(() => document.getElementById('main').innerText);
  check('serviciosCard no pinta NaN', !monthText.includes('NaN'), monthText.includes('NaN') ? 'apareció "NaN" en la vista de mes' : '');

  // 1b) vacMap() está memorizada (informe de rendimiento) — comprobar que la caché se invalida al cambiar datos
  const vacCache = await page.evaluate(() => {
    const before = window.PG.vacationOf('2027-03-15');
    window.PG.addVacation('2027-03-10', '2027-03-20', 'test-cache');
    const after = window.PG.vacationOf('2027-03-15');
    window.PG.delVacation(window.PG.store.rotation.vacaciones.length - 1);
    const afterDel = window.PG.vacationOf('2027-03-15');
    return { before, after, afterDel };
  });
  check('la caché de vacMap() se invalida al añadir/quitar vacaciones',
    vacCache.before === null && !!vacCache.after && vacCache.afterDel === null,
    JSON.stringify(vacCache));

  // 2) addVacation ordena un rango invertido en vez de guardar días negativos
  const vac = await page.evaluate(() => {
    const before = window.PG.store.rotation.vacaciones.length;
    window.PG.addVacation('2026-06-20', '2026-06-10', 'test-regresion');
    const v = window.PG.store.rotation.vacaciones[before];
    return v;
  });
  check('addVacation gira start/end si vienen al revés',
    vac && vac.start === '2026-06-10' && vac.end === '2026-06-20',
    'guardado: ' + JSON.stringify(vac));

  // 3) TZID del ICS: una hora en America/New_York debe coincidir con su equivalente en Z (UTC)
  const tz = await page.evaluate(() => {
    const conTz = window.PG.parseIcs(
      'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART;TZID=America/New_York:20260615T080000\r\nSUMMARY:a\r\nEND:VEVENT\r\nEND:VCALENDAR'
    ).eventos[0];
    const enUtc = window.PG.parseIcs(
      'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20260615T120000Z\r\nSUMMARY:b\r\nEND:VEVENT\r\nEND:VCALENDAR'
    ).eventos[0];
    return { conTz, enUtc };
  });
  check('parseIcs interpreta TZID (mismo instante que su equivalente en Z)',
    tz.conTz && tz.enUtc && tz.conTz.key === tz.enUtc.key && tz.conTz.start === tz.enUtc.start,
    JSON.stringify(tz));

  // 4) el campo "icon" de un tipo de día se escapa al pintarlo (antes: XSS almacenado)
  const xss = await page.evaluate(() => {
    window.PG.store.shifts[0].icon = '<img src=x data-marker="xss-test">';
    window.PG.render();
    return {
      imgInjected: document.querySelectorAll('img[data-marker="xss-test"]').length,
      textPresent: document.getElementById('main').innerHTML.indexOf('&lt;img') >= 0,
    };
  });
  check('el icono de un tipo de día no inyecta HTML real',
    xss.imgInjected === 0, 'imágenes inyectadas: ' + xss.imgInjected);

  // 5) importar JSON pide confirmación (antes: sustituía todo sin preguntar)
  await gotoTab('data');
  await page.waitForTimeout(200);
  await page.fill('#importBox', JSON.stringify({ shifts: [], menu: {}, dishes: [] }));
  await page.click('[data-a="import"]');
  await page.waitForTimeout(200);
  const importAsksConfirm = await page.evaluate(() => document.getElementById('overlay').classList.contains('on'));
  check('importar JSON abre un diálogo de confirmación', importAsksConfirm);
  await page.click('[data-a="m-cancel"]');
  await page.waitForTimeout(150);

  // 5b) subir un .ics con el selector de archivo lo lee y lo analiza solo (sin copiar/pegar a mano)
  const icsFixture = path.join(require('os').tmpdir(), 'regression-test.ics');
  fs.writeFileSync(icsFixture,
    'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20260915\r\nSUMMARY:Guardia Urgencias\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n');
  const icsFile = await page.$('#icsFile');
  await icsFile.setInputFiles(icsFixture);
  await page.waitForTimeout(300);
  const icsUpload = await page.evaluate(() => ({
    boxHasContent: (document.getElementById('icsBox') || {}).value?.includes('Guardia Urgencias'),
    prevOk: window.PG.ui.icsPrev ? window.PG.ui.icsPrev.ok : null,
  }));
  fs.unlinkSync(icsFixture);
  check('subir un archivo .ics lo lee y lo analiza automáticamente',
    icsUpload.boxHasContent && icsUpload.prevOk === true, JSON.stringify(icsUpload));

  // 6) ningún confirm() nativo del navegador (todo pasa por el modal propio)
  check('no ha aparecido ningún confirm() nativo', nativeDialogs.length === 0, JSON.stringify(nativeDialogs));

  // 7) el modal atrapa el foco y lo devuelve al cerrar
  await gotoTypes('dishes');
  await page.waitForTimeout(200);
  await page.focus('[data-a="dish-new"]');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const dialogRole = await page.evaluate(() => document.getElementById('modal').getAttribute('role'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
  const focusRestored = await page.evaluate(() => document.activeElement.getAttribute('data-a'));
  check('el modal es role="dialog" y devuelve el foco al cerrar',
    dialogRole === 'dialog' && focusRestored === 'dish-new',
    'role=' + dialogRole + ' focusRestored=' + focusRestored);

  // 8) la cámara del escáner se detiene sola al cambiar de pestaña (antes: se quedaba encendida)
  await gotoFood('add', 'scan');
  await page.evaluate(() => window.PG.iniciarEscaner());
  await page.waitForTimeout(300);
  const camAbierta = await page.evaluate(() => !!window.PG.ui.scanStream);
  await gotoTab('week');
  await page.waitForTimeout(200);
  const camState = await page.evaluate(() => {
    const s = window.PG.ui.scanStream;
    return { stream: s, tracksLive: s ? s.getTracks().some((t) => t.readyState === 'live') : null };
  });
  check('la cámara se abre de verdad en el tab de comida', camAbierta, 'scanStream tras abrir: ' + camAbierta);
  check('cambiar de pestaña detiene el stream de la cámara',
    camState.stream === null || camState.stream === undefined,
    'ui.scanStream tras cambiar de tab: ' + JSON.stringify(camState));

  // 8b) auditoría de la cámara: si getUserMedia rechaza, el mensaje es claro (según el tipo de error)
  // y el recuadro no se queda "encendido" con un vídeo en negro simulando un escaneo que no existe
  await gotoFood('add', 'scan');
  const denegado = await page.evaluate(async () => {
    const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
    const msg = await window.PG.iniciarEscaner();
    navigator.mediaDevices.getUserMedia = orig;
    return { msg, onClass: document.getElementById('scanBox').classList.contains('on'), stream: window.PG.ui.scanStream };
  });
  check('si se deniega el permiso, el mensaje lo dice claro y el recuadro no queda "encendido"',
    /permiso de c[aá]mara denegado/.test(denegado.msg) && denegado.onClass === false && !denegado.stream,
    JSON.stringify(denegado));

  // 8c) el escáner arma un aviso de "30 s sin detectar nada" y lo limpia al pararse (sin esperar 30 s
  // de verdad). Este Chromium de pruebas no trae BarcodeDetector (es habitual en Linux de escritorio),
  // así que se simula uno que nunca encuentra nada — el propio Chrome de Android sí lo trae.
  await page.evaluate(() => { window.BarcodeDetector = function () { this.detect = () => Promise.resolve([]); }; });
  await page.evaluate(() => window.PG.iniciarEscaner());
  await page.waitForTimeout(200);
  const timeoutArmado = await page.evaluate(() => window.PG.ui.scanTimeout != null);
  await page.evaluate(() => window.PG.pararEscaner());
  const timeoutLimpio = await page.evaluate(() => window.PG.ui.scanTimeout == null);
  await page.evaluate(() => { delete window.BarcodeDetector; });
  check('el escáner arma un aviso de "30 s sin detectar nada" y lo limpia al pararse',
    timeoutArmado && timeoutLimpio, 'armado=' + timeoutArmado + ' limpio=' + timeoutLimpio);

  // 8d) un render() que no cambia de pestaña (p. ej. al escribir en otro filtro) no debe apagar
  // la cámara a medio escaneo — antes, renderNow() la paraba en CUALQUIER repintado
  await page.evaluate(() => window.PG.iniciarEscaner());
  await page.waitForTimeout(200);
  const sigueAbiertaTrasRender = await page.evaluate(() => { window.PG.render(); return !!window.PG.ui.scanStream; });
  check('un render() sin cambiar de pestaña no apaga la cámara a medio escaneo', sigueAbiertaTrasRender);

  // 8e) pasar a segundo plano (visibilitychange, p. ej. bloquear el móvil) apaga la cámara sola
  const trasSegundoPlano = await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    return !!window.PG.ui.scanStream;
  });
  await page.evaluate(() => Object.defineProperty(document, 'hidden', { value: false, configurable: true }));
  check('pasar a segundo plano (visibilitychange) apaga la cámara', !trasSegundoPlano);

  // 9) rediseño: los días de "Semana" empiezan plegados, y "abrir todos" los despliega
  await gotoTab('week');
  await page.waitForTimeout(200);
  const collapsedByDefault = await page.evaluate(() => document.querySelectorAll('.drow.open').length);
  await page.click('[data-a="wk-expand-all"]');
  await page.waitForTimeout(150);
  const afterExpandAll = await page.evaluate(() => document.querySelectorAll('.drow.open').length);
  const totalRows = await page.evaluate(() => document.querySelectorAll('.drow').length);
  check('los días de la semana empiezan plegados', collapsedByDefault === 0, 'abiertos al entrar: ' + collapsedByDefault);
  check('"abrir todos" despliega todos los días', afterExpandAll === totalRows && totalRows > 0,
    afterExpandAll + '/' + totalRows + ' abiertos');

  // 10) rediseño: cada fila de día es alcanzable y accionable por teclado, y conserva el foco al alternar
  await page.click('[data-a="wk-expand-all"]'); // los vuelve a cerrar todos
  await page.waitForTimeout(150);
  await page.focus('.drmain');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const kbdState = await page.evaluate(() => ({
    focusedIsRow: document.activeElement.getAttribute('data-a') === 'day-open',
    expanded: document.activeElement.getAttribute('aria-expanded'),
  }));
  check('Enter en una fila de día la expande sin perder el foco',
    kbdState.focusedIsRow && kbdState.expanded === 'true', JSON.stringify(kbdState));

  // 11) simplificación de interfaz: el picker de "Días y menús" empieza plegado
  const primerTipo = await page.evaluate(() => window.PG.store.shifts[0].id);
  await gotoTypes(primerTipo);
  await page.waitForTimeout(200);
  const pickersClosedByDefault = await page.evaluate(() => document.querySelectorAll('.pick').length);
  await page.click('[data-a="toggle-picker"]');
  await page.waitForTimeout(150);
  const pickersAfterToggle = await page.evaluate(() => document.querySelectorAll('.pick').length);
  check('el picker de comidas/platos empieza plegado y se abre al tocarlo',
    pickersClosedByDefault === 0 && pickersAfterToggle === 1,
    'antes: ' + pickersClosedByDefault + ' después: ' + pickersAfterToggle);

  // 12) simplificación de interfaz: la vista "día a día" de "Mes" (repetía el calendario de arriba,
  // 0 valor añadido según el comentario del usuario) se ha quitado del todo, no solo plegado
  await gotoTab('month');
  await page.waitForTimeout(200);
  const monthDetailGone = await page.evaluate(() => !document.querySelector('#main').textContent.includes('ver el mes día a día'));
  check('la vista "día a día" de Mes (redundante con el calendario) ya no existe', monthDetailGone, '');

  // 13) menos toques: registrar una comida ya montada desde "Hoy" en un solo tap
  await gotoTab('hoy');
  await page.waitForTimeout(200);
  const hoyKey = new Date().toISOString().slice(0, 10);
  const kcalAntes = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKey);
  const logBtn = await page.$('[data-a="hoy-log-slot"]');
  if (logBtn) await logBtn.click();
  await page.waitForTimeout(200);
  const kcalDespues = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKey);
  check('el botón "ya me la he comido" registra la comida de un toque',
    !!logBtn && kcalDespues > kcalAntes, 'antes=' + kcalAntes + ' después=' + kcalDespues);

  // 14) examen de calidad del formato: en "Mes" las flechas de la cabecera mueven el mes, no una fecha oculta
  await gotoTab('month');
  await page.waitForTimeout(200);
  const monthNavCheck = await page.evaluate(() => {
    const before = { month: window.PG.monthDate.getMonth(), weekDate: window.PG.weekDate.toISOString().slice(0, 10) };
    document.querySelector('[data-a="wk-prev"]').click();
    const after = { month: window.PG.monthDate.getMonth(), weekDate: window.PG.weekDate.toISOString().slice(0, 10) };
    return { before, after };
  });
  await page.waitForTimeout(150);
  check('en "Mes", ‹ mueve el mes y no toca weekDate a escondidas',
    monthNavCheck.after.month !== monthNavCheck.before.month && monthNavCheck.after.weekDate === monthNavCheck.before.weekDate,
    JSON.stringify(monthNavCheck));
  await page.click('[data-a="mon-today"]'); // deja monthDate como estaba, para no afectar a pruebas siguientes
  await page.waitForTimeout(150);

  // 15) las flechas de semana se ocultan donde no aplican (Hoy, Semana en plantilla) y siguen visibles en Semana + "por fecha"
  // — se comprueba el estilo calculado (display), no solo el atributo hidden: un display:flex propio puede anularlo en silencio
  const wkNavDisplay = () => document.getElementById('wkNav').offsetParent === null
    ? 'none' : getComputedStyle(document.getElementById('wkNav')).display;
  await gotoTab('hoy');
  await page.waitForTimeout(150);
  const wkNavEnHoy = await page.evaluate(wkNavDisplay);
  await gotoTab('week');
  await page.waitForTimeout(150);
  const wkNavEnSemanaPlantilla = await page.evaluate(wkNavDisplay);
  const wkNavEnSemanaPorFecha = await page.evaluate(() => {
    window.PG.store.rotation.mode = 'date';
    window.PG.render();
    const d = document.getElementById('wkNav').offsetParent === null ? 'none' : getComputedStyle(document.getElementById('wkNav')).display;
    window.PG.store.rotation.mode = 'plantilla';
    window.PG.render();
    return d;
  });
  check('las flechas de semana se ocultan de verdad (display:none) en Hoy y en Semana-plantilla, y aparecen en Semana + "por fecha"',
    wkNavEnHoy === 'none' && wkNavEnSemanaPlantilla === 'none' && wkNavEnSemanaPorFecha !== 'none',
    JSON.stringify({ wkNavEnHoy, wkNavEnSemanaPlantilla, wkNavEnSemanaPorFecha }));

  // 16) el aviso de "☰ Más" tiene un texto accesible que explica el punto, no solo un carácter suelto
  // (ya hay comida apuntada hoy desde la prueba 13, así que BADGE.food está activo)
  const masLabelInfo = await page.evaluate(() => document.querySelector('[data-a="drawer-toggle"]').getAttribute('aria-label'));
  check('"☰ Más" lleva un aria-label que explica el punto de aviso (no solo "●")',
    typeof masLabelInfo === 'string' && masLabelInfo.length > 'Más'.length,
    'aria-label=' + JSON.stringify(masLabelInfo));

  // ===================== Entreno: rutinas, sesiones, músculos y cardio =====================

  // 17) migración de datos reales: una rutina antigua (gym.rutina, única y sin nombre) se convierte
  // en la primera de gym.rutinas[] (con nombre) sin perder ni un ejercicio
  const migInfo = await page.evaluate(() => {
    const o = window.PG.DEFAULTS();
    o.gym.rutina = [
      { ex: 'Peso muerto', series: 5, reps: 5, c: 'back', eq: 'barbell' },
      { ex: 'Remo con barra', series: 4, reps: 10, c: 'back', eq: 'barbell' },
    ];
    delete o.gym.rutinas;
    window.PG.store = o; // el setter pasa por normalize(), que debe migrar en silencio
    const g = window.PG.gymS();
    return {
      rutinaGone: !('rutina' in g),
      n: g.rutinas.length,
      ejercicios: g.rutinas[0] ? g.rutinas[0].ejercicios.map((e) => e.ex) : [],
    };
  });
  check('una rutina antigua se convierte en la primera de gym.rutinas[] sin perder ejercicios',
    migInfo.rutinaGone && migInfo.n === 1 && migInfo.ejercicios.length === 2 &&
    migInfo.ejercicios.includes('Peso muerto') && migInfo.ejercicios.includes('Remo con barra'),
    JSON.stringify(migInfo));

  await page.evaluate(() => window.PG.render());
  await gotoGym('rutinas');
  const migradaEnUI = await page.evaluate(() => document.getElementById('main').innerText);
  check('la rutina migrada se ve en la UI con su nombre y sus ejercicios',
    migradaEnUI.includes('Mi rutina') && migradaEnUI.includes('Peso muerto') && migradaEnUI.includes('Remo con barra'),
    migradaEnUI.slice(0, 300));

  // 18) flujo completo por la UI de verdad: crear rutina -> empezar -> apuntar serie -> terminar -> sesión guardada con su duración
  await page.fill('#rtNombreNueva', 'Rutina UI');
  await page.click('[data-a="rt-nueva"]');
  await page.waitForTimeout(200);
  const ridUI = await page.evaluate(() => window.PG.gymS().rutinas.find((r) => r.nombre === 'Rutina UI').id);
  await page.fill('#rtNew-' + ridUI, 'Curl bíceps');
  await page.click('[data-a="rt-add"][data-id="' + ridUI + '"]');
  await page.waitForTimeout(200);
  await page.click('[data-a="ses-empezar"][data-id="' + ridUI + '"]');
  await page.waitForTimeout(200);
  await gotoGym('sesion');   // el formulario de apuntar vive en «Entrenar»
  const sesionActivaVisible = await page.evaluate(() => !!document.querySelector('[data-a="ses-terminar"]'));
  await page.fill('#setEx', 'Curl bíceps');
  await page.fill('#setKg', '12');
  await page.fill('#setReps', '10');
  await page.click('[data-a="gym-set"]');
  await page.waitForTimeout(200);
  await page.fill('#sesMinutos', '33');
  await page.click('[data-a="ses-terminar"]');
  await page.waitForTimeout(200);
  const sesionActivaGone = await page.evaluate(() => !document.querySelector('[data-a="ses-terminar"]'));
  const sesionGuardada = await page.evaluate(
    (rid) => window.PG.gymS().sesiones.filter((s) => s.rutinaId === rid),
    ridUI
  );
  check('flujo completo: empezar → apuntar serie → terminar guarda una sesión con su duración',
    sesionActivaVisible && sesionActivaGone && sesionGuardada.length === 1 &&
    sesionGuardada[0].duracionMin === 33 && sesionGuardada[0].seriesIds.length >= 1,
    JSON.stringify({ sesionActivaVisible, sesionActivaGone, sesionGuardada }));

  // 18b) se pueden añadir varios ejercicios seguidos a una rutina sin tener que volver a tocar la
  // caja cada vez (bug real: addRutina() vuelve a pintar #main, así que la caja de antes queda
  // desmontada y sin foco — sin refocarla, un segundo toque en "añadir" con el teclado ya cerrado
  // no añade nada y parece que "solo deja meter un ejercicio")
  await gotoGym('rutinas');   // los ejercicios de una rutina se añaden en «Rutinas», no en «Entrenar»
  await page.fill('#rtNew-' + ridUI, 'Press militar');
  await page.click('[data-a="rt-add"][data-id="' + ridUI + '"]');
  await page.waitForTimeout(150);
  const focoTrasAnadir = await page.evaluate((rid) => document.activeElement && document.activeElement.id === 'rtNew-' + rid, ridUI);
  await page.keyboard.type('Sentadilla');
  await page.click('[data-a="rt-add"][data-id="' + ridUI + '"]');
  await page.waitForTimeout(150);
  const ejerciciosTrasVarios = await page.evaluate(
    (rid) => window.PG.gymS().rutinas.find((r) => r.id === rid).ejercicios.map((e) => e.ex),
    ridUI
  );
  check('tras añadir un ejercicio, la caja recupera el foco y se pueden seguir añadiendo más seguidos',
    focoTrasAnadir && ejerciciosTrasVarios.includes('Curl bíceps') &&
    ejerciciosTrasVarios.includes('Press militar') && ejerciciosTrasVarios.includes('Sentadilla'),
    JSON.stringify({ focoTrasAnadir, ejerciciosTrasVarios }));

  // 19) el diagrama de músculos resalta al menos una región para una sesión de prueba
  await page.evaluate((rid) => {
    const g = window.PG.gymS();
    const rt = g.rutinas.find((r) => r.id === rid);
    rt.ejercicios[0].tg = 'pectorals'; // vocabulario típico de la biblioteca -> mapea a "pecho"
    window.PG.render();
  }, ridUI);
  await gotoGym('rutinas');
  const regionesResaltadas = await page.evaluate(() => document.querySelectorAll('.mreg.on').length);
  check('el diagrama de músculos resalta al menos una región para una sesión de prueba',
    regionesResaltadas >= 1, 'regiones resaltadas: ' + regionesResaltadas);

  // 20) Cardio ya no es un scroll infinito: primero las fichas de tipo y, al tocar una, su propia
  // pantalla con un botón de volver (comentario del usuario). Se apunta desde dentro de esa pantalla.
  await gotoGym('cardio');
  const fichasCardio = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#main .ctile[data-a="cardio-open"]')).map((b) => b.dataset.tipo));
  check('Cardio empieza con una ficha por tipo en vez de cuatro listas abiertas a la vez',
    ['natación', 'carrera', 'bici', 'otro'].every((t) => fichasCardio.includes(t)) &&
    (await page.evaluate(() => !document.querySelector('#main .card[data-cardio]'))),
    JSON.stringify(fichasCardio));

  await page.click('.ctile[data-a="cardio-open"][data-tipo="carrera"]');
  await page.waitForTimeout(250);
  const pantallaCarrera = await page.evaluate(() => {
    const c = document.querySelector('#main .card[data-cardio="carrera"]');
    return c ? { volver: !!c.querySelector('[data-a="cardio-back"]'), otras: document.querySelectorAll('#main .ctile').length } : null;
  });
  check('al tocar un tipo entras en su pantalla, con botón de volver y sin las demás fichas delante',
    pantallaCarrera && pantallaCarrera.volver && pantallaCarrera.otras === 0, JSON.stringify(pantallaCarrera));

  await page.fill('#cardioFecha', '2026-09-10');
  await page.fill('#cardioMin', '35');
  await page.fill('#cardioKm', '5.2');
  await page.click('[data-a="cardio-add"]');
  await page.waitForTimeout(250);
  const cardioGuardado = await page.evaluate(() => window.PG.gymS().cardio.some(
    (c) => c.tipo === 'carrera' && c.duracionMin === 35 && c.distanciaKm === 5.2 && c.fecha === '2026-09-10'
  ));
  check('se puede registrar un cardio con duración y distancia desde la pantalla de su tipo', cardioGuardado);

  const trasApuntar = await page.evaluate(() => {
    const c = document.querySelector('#main .card[data-cardio="carrera"]');
    return c ? /10\/09/.test(c.textContent) : null;
  });
  check('tras apuntarlo sigues en la pantalla de ese tipo y el registro aparece en su lista', trasApuntar === true, '');

  await page.click('[data-a="cardio-back"]');
  await page.waitForTimeout(250);
  const volvioAlIndice = await page.evaluate(() => {
    const t = document.querySelector('#main .ctile[data-tipo="carrera"]');
    return { indice: !!t && !document.querySelector('#main .card[data-cardio]'), cuenta: t ? t.textContent : '' };
  });
  check('el botón de volver te devuelve a las fichas, que ya cuentan la sesión apuntada',
    volvioAlIndice.indice && /1 sesión/.test(volvioAlIndice.cuenta), JSON.stringify(volvioAlIndice));

  // ===================== Comida: catálogo offline y alta manual =====================

  // 21) catálogo local de alimentos (Mercadona, Carrefour, 100 Montaditos): se importa y se busca
  // SIN ninguna llamada de red — se bloquea toda petición que no sea al propio servidor de prueba
  // y aun así tiene que aparecer un resultado al buscar
  await gotoTab('food');
  await page.waitForTimeout(150);
  let redUsadaEnCatalogo = false;
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(base)) return route.continue();
    redUsadaEnCatalogo = true;
    return route.abort();
  });
  const catalogo = await page.evaluate(() => {
    const r = window.PG.foodImportCatalogo();
    window.PG.ui.foodQ = 'yogur griego';
    window.PG.ui.foodVista = 'add';
    window.PG.ui.foodPanel = 'productos';
    window.PG.render();
    const encontrado = document.getElementById('main').innerText.toLowerCase().includes('yogur griego');
    window.PG.ui.foodQ = '';
    return { r, encontrado, total: window.PG.FOOD_CATALOGO.length };
  });
  await page.unroute('**/*');
  await page.evaluate(() => window.PG.render());
  check('el catálogo local (Mercadona, Carrefour, 100 Montaditos) se importa y se busca sin red',
    catalogo.total >= 100 && (catalogo.r.n > 0 || catalogo.r.ya > 0) && catalogo.encontrado && !redUsadaEnCatalogo,
    JSON.stringify({ n: catalogo.r.n, ya: catalogo.r.ya, total: catalogo.total, encontrado: catalogo.encontrado, redUsada: redUsadaEnCatalogo }));

  // 22) alta manual de un alimento sin código de barras: se guarda con un id sintético (mismo
  // patrón que addEanProduct() cuando no llega opt.ean) y se puede registrar como cualquier otro
  await gotoFood('add', 'mano');
  await page.fill('#foodNewNombre', 'Lentejas de la abuela');
  await page.fill('#foodNewKcal', '110');
  await page.fill('#foodNewProt', '7');
  await page.click('[data-a="food-new-add"]');
  await page.waitForTimeout(200);
  const altaManual = await page.evaluate(() => {
    const f = window.PG.food();
    const entry = Object.values(f.eans).find((p) => p.nombre === 'Lentejas de la abuela');
    return { guardado: !!entry, ean: entry ? entry.ean : null, esSintetico: entry ? !/^\d+$/.test(entry.ean) : null };
  });
  check('el alta manual guarda el alimento con un id sintético (sin EAN real)',
    altaManual.guardado && altaManual.esSintetico === true, JSON.stringify(altaManual));

  const hoyKeyManual = new Date().toISOString().slice(0, 10);
  const kcalAntesManual = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKeyManual);
  // el camino real: buscar por nombre, tocar el resultado y apuntar la cantidad
  await page.click('[data-a="food-panel"][data-k="buscar"]');
  await page.waitForTimeout(150);
  await page.fill('#feQ', 'Lentejas de la abuela');
  await page.waitForTimeout(350);
  await page.click(`[data-a="food-pick"][data-v="ean:${altaManual.ean}"]`);
  await page.waitForTimeout(200);
  await page.fill('#feG', '200');
  await page.click('[data-a="fe-add"]');
  await page.waitForTimeout(250);
  const kcalDespuesManual = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKeyManual);
  check('el alimento añadido a mano se registra igual que uno escaneado',
    kcalDespuesManual > kcalAntesManual, 'antes=' + kcalAntesManual + ' después=' + kcalDespuesManual);

  // ===================== Reformulación de Calendario: "hoy", panel inline y barra de 24h =====================

  // 23) en "Mes", la casilla de hoy lleva la marca visual "today", y tocarla abre un panel inline
  // (con su barra de 24h) en vez del modal de antes
  await gotoTab('month');
  await page.waitForTimeout(150);
  // una prueba anterior (¹⁴, las flechas de la cabecera) deja monthDate movido a otro mes: se vuelve
  // al mes actual antes de buscar la casilla de hoy, o el test 14 lo dejaría en un mes sin ese día
  await page.click('[data-a="mon-today"]');
  await page.waitForTimeout(150);
  const hoyKeyMes = new Date().toISOString().slice(0, 10);
  const mesHoyClase = await page.evaluate(
    (k) => {
      const cell = document.querySelector('.dbox[data-key="' + k + '"]');
      return { existe: !!cell, esHoy: cell ? cell.classList.contains('today') : null };
    },
    hoyKeyMes
  );
  check('en "Mes", la casilla de hoy lleva la clase "today"',
    mesHoyClase.existe && mesHoyClase.esHoy === true, JSON.stringify(mesHoyClase));

  await page.click('.dbox[data-key="' + hoyKeyMes + '"]');
  await page.waitForTimeout(200);
  const panelAbierto = await page.evaluate(() => ({
    panel: !!document.querySelector('.daydetail'),
    barra: !!document.querySelector('.daydetail .tl-bar'),
    modalAbierto: document.getElementById('overlay').classList.contains('on'),
  }));
  check('tocar un día en "Mes" abre un panel inline con su barra de 24h, sin abrir el modal',
    panelAbierto.panel && panelAbierto.barra && !panelAbierto.modalAbierto, JSON.stringify(panelAbierto));

  await page.click('.dbox[data-key="' + hoyKeyMes + '"]');
  await page.waitForTimeout(200);
  const panelCerrado = await page.evaluate(() => !document.querySelector('.daydetail'));
  check('tocar el mismo día otra vez cierra el panel', panelCerrado);

  // 24) la configuración pesada de Mes (servicio, tipos de guardia, cupo) empieza plegada
  const configPlegada = await page.evaluate(() => {
    const d = Array.from(document.querySelectorAll('.dtip')).find((x) => /configurar este mes/.test(x.textContent));
    return d ? d.open : null;
  });
  check('la configuración del mes (servicio, tipos de guardia, cupo) empieza plegada',
    configPlegada === false, 'open=' + configPlegada);

  // 25) "Hoy" muestra la agenda de 24h con la marca de "ahora"
  await gotoTab('hoy');
  await page.waitForTimeout(200);
  const hoyBarra = await page.evaluate(() => ({
    barra: !!document.querySelector('#main .tl-bar'),
    ahora: !!document.querySelector('#main .tl-now'),
  }));
  check('"Hoy" muestra la agenda de 24h con la marca de "ahora"',
    hoyBarra.barra && hoyBarra.ahora, JSON.stringify(hoyBarra));

  // 26) en Semana + "por fecha", la fila de hoy lleva la marca "today" y su barra de 24h
  // sustituye a la línea de texto densa que había antes
  await page.evaluate(() => {
    window.PG.store.rotation.mode = 'date';
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    window.PG.weekDate = monday;
    window.PG.render();
  });
  await gotoTab('week');
  await page.waitForTimeout(200);
  const semanaEstado = await page.evaluate(() => {
    const row = document.querySelector('.drow.today');
    return { filaHoy: !!row, tieneBarra: row ? !!row.querySelector('.tl-bar') : false };
  });
  check('en Semana + "por fecha", la fila de hoy lleva la marca "today" y su barra de 24h',
    semanaEstado.filaHoy && semanaEstado.tieneBarra, JSON.stringify(semanaEstado));

  // 27) aviso de modo compartido (decisión B del informe): si "Semana" está en plantilla (sin fechas
  // reales), Mes y Hoy —que siempre usan la fecha real— lo avisan para que el cambio no sorprenda
  await page.evaluate(() => { window.PG.store.rotation.mode = 'template'; window.PG.render(); });
  await gotoTab('month');
  await page.waitForTimeout(150);
  const avisoMes = await page.evaluate(() => /modo plantilla/.test(document.getElementById('main').innerText));
  await gotoTab('hoy');
  await page.waitForTimeout(150);
  const avisoHoy = await page.evaluate(() => /modo plantilla/.test(document.getElementById('main').innerText));
  check('Mes y Hoy avisan cuando "Semana" está en modo plantilla',
    avisoMes && avisoHoy, JSON.stringify({ avisoMes, avisoHoy }));

  // ===================== Exportar a Google: solo guardias, trabajo y entrenos, con sus horas =====================

  // 28) calEventos() manda solo guardia/trabajo/entreno, cada uno con hora de inicio y fin real —
  // nunca saliente, día libre ni vacaciones (a petición explícita del usuario)
  const calScope = await page.evaluate(() => {
    const base = '2027-04';
    window.PG.setDayOverride(base + '-05', 'sh-g', 'urg'); // guardia
    window.PG.setDayOverride(base + '-06', 'sh-s', '');    // saliente (debe quedar fuera)
    window.PG.setDayOverride(base + '-07', 'sh-t', '');    // trabajo
    window.PG.setDayOverride(base + '-08', 'sh-f', '');    // entreno de fuerza
    window.PG.setDayOverride(base + '-09', 'sh-l', '');    // día libre (debe quedar fuera)
    window.PG.addVacation(base + '-10', base + '-11', 'test-export'); // vacaciones (deben quedar fuera)
    const evs = window.PG.calEventos(base + '-05', base + '-11');
    const porFecha = {};
    evs.forEach((e) => { (porFecha[e.isoKey] = porFecha[e.isoKey] || []).push(e); });
    return porFecha;
  });
  check('a Google solo se manda guardia, trabajo y entreno de fuerza — nunca saliente, libre ni vacaciones',
    !!calScope['2027-04-05'] && !calScope['2027-04-06'] && !!calScope['2027-04-07'] &&
    !!calScope['2027-04-08'] && !calScope['2027-04-09'] && !calScope['2027-04-10'] && !calScope['2027-04-11'],
    JSON.stringify(calScope));

  const guardiaEv = (calScope['2027-04-05'] || [])[0];
  const trabajoEv = (calScope['2027-04-07'] || [])[0];
  const entrenoEv = (calScope['2027-04-08'] || [])[0];
  check('cada evento exportado lleva su hora de inicio y fin real (no "todo el día")',
    !!guardiaEv && !guardiaEv.allDay && guardiaEv.hora === '08:00' && guardiaEv.cat === 'GUARDIA' &&
    !!trabajoEv && !trabajoEv.allDay && trabajoEv.hora === '08:00' && trabajoEv.horaFin === '15:00' && trabajoEv.cat === 'TRABAJO' &&
    !!entrenoEv && !entrenoEv.allDay && entrenoEv.hora === '06:30' && entrenoEv.horaFin === '08:00' && entrenoEv.cat === 'ENTRENO',
    JSON.stringify({ guardiaEv, trabajoEv, entrenoEv }));

  // 29) un evento de "trabajo" exportado se reconoce como tal si se vuelve a importar (viceversa)
  const reimport = await page.evaluate(() =>
    window.PG.icsClasificar({ resumen: '💼 Día de trabajo', desc: 'Jornada de trabajo.', lugar: '' })
  );
  check('un evento de "trabajo" exportado se reconoce como tal al reimportarlo (viceversa)',
    reimport.kind === 'trabajo', JSON.stringify(reimport));

  // ===================== "⚙️ Ajustes" (informe: pequeños cambios sin programar) =====================

  // 30) existe en el cajón y trae los campos nuevos
  await gotoTab('ajustes');
  await page.waitForTimeout(150);
  const ajustesUI = await page.evaluate(() => ({
    saltoFrom: !!document.querySelector('[data-a="salto-from"]'),
    saltoTo: !!document.querySelector('[data-a="salto-to"]'),
    latencia: !!document.querySelector('[data-a="sueno-f"][data-k="latencia"]'),
    guardDefault: !!document.querySelector('[data-a="guard-default"]'),
    backup: !!document.querySelector('[data-a="backup-aviso-d"]'),
    icsMin: !!document.querySelector('[data-a="ics-aviso-min"]'),
    temaBrand: !!document.querySelector('[data-a="tema-f"][data-k="brand"]'),
    weekStart: !!document.querySelector('[data-a="cal-weekstart"]'),
    enDrawer: !!document.querySelector('[data-a="drawer-nav"][data-t="ajustes"]'),
  }));
  check('la pestaña "Ajustes" existe en el cajón lateral y trae los campos del informe',
    Object.values(ajustesUI).every(Boolean), JSON.stringify(ajustesUI));

  // 31) qué día "absorbe" el saliente es configurable (antes, sábado→lunes fijo en el código)
  const saltoTest = await page.evaluate(() => {
    window.PG.store.rotation.saltoDia = { from: 0, to: 2 }; // domingo -> martes, para probar que no es solo sábado/lunes
    const fmt = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    let dom = new Date(2027, 4, 1);
    while (dom.getDay() !== 0) dom.setDate(dom.getDate() + 1); // primer domingo de mayo de 2027
    const lun = new Date(dom); lun.setDate(dom.getDate() + 1);
    const mar = new Date(dom); mar.setDate(dom.getDate() + 2);
    window.PG.setDayOverride(fmt(dom), 'sh-g', 'urg');
    const infoLun = window.PG.dayInfo(fmt(lun)), infoMar = window.PG.dayInfo(fmt(mar));
    const txt = window.PG.saltoDiaTxt();
    window.PG.store.rotation.saltoDia = { from: 6, to: 1 }; // deja el valor de fábrica
    return { txt, lunKind: infoLun.shiftId, marKind: infoMar.shiftId };
  });
  check('el día en que "cae" la guardia especial y el día al que se pasa el saliente son configurables',
    saltoTest.txt === 'si cae en domingo, el martes' && saltoTest.lunKind === 'sh-l' && saltoTest.marKind === 'sh-s',
    JSON.stringify(saltoTest));

  // 32) el umbral de aviso de copia de seguridad es configurable (antes, 13 días fijo)
  const backupCfg = await page.evaluate(() => {
    const before = window.PG.avisoBackupD();
    window.PG.store.meta.backupAvisoD = 5;
    const after = window.PG.avisoBackupD();
    window.PG.store.meta.backupAvisoD = 13;
    return { before, after };
  });
  check('el umbral de aviso de "te toca otra copia" es configurable (store.meta.backupAvisoD)',
    backupCfg.before === 13 && backupCfg.after === 5, JSON.stringify(backupCfg));

  // 33) los minutos de aviso del .ics exportado son configurables (antes, -PT30M fijo)
  const icsAviso = await page.evaluate(() => {
    window.PG.store.rotation.icsAvisoMin = 45;
    window.PG.setDayOverride('2027-05-20', 'sh-t', '');
    const txt = window.PG.icsTexto('2027-05-20', '2027-05-20', {});
    window.PG.store.rotation.icsAvisoMin = 30;
    return txt;
  });
  check('los minutos de aviso (VALARM) del .ics exportado son configurables',
    icsAviso.indexOf('TRIGGER;VALUE=DURATION:-PT45M') >= 0, icsAviso.slice(0, 500));

  // 34) el color de acento se aplica como variable CSS de verdad, y se puede restablecer
  const temaTest = await page.evaluate(() => {
    window.PG.store.tema = { brand: '#123456', brand2: '#abcdef' };
    window.PG.aplicarTema();
    const applied = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
    window.PG.store.tema = { brand: '', brand2: '' };
    window.PG.aplicarTema();
    const reverted = document.documentElement.style.getPropertyValue('--brand');
    return { applied, reverted };
  });
  check('el color de acento (Ajustes) se aplica como variable CSS y se puede restablecer al de la app',
    temaTest.applied === '#123456' && temaTest.reverted === '', JSON.stringify(temaTest));

  // 35) el primer día de la semana de "Mes" es configurable (antes, siempre empezaba en lunes)
  await gotoTab('month');
  await page.waitForTimeout(150);
  const headerLun = await page.evaluate(() => document.querySelector('#main .cal .wd').textContent);
  await page.evaluate(() => { window.PG.store.rotation.calWeekStart = 'dom'; window.PG.render(); });
  await page.waitForTimeout(100);
  const headerDom = await page.evaluate(() => document.querySelector('#main .cal .wd').textContent);
  await page.evaluate(() => { window.PG.store.rotation.calWeekStart = 'lun'; window.PG.render(); });
  check('el primer día de la semana en "Mes" es configurable (Lunes/Domingo)',
    headerLun === 'Lun' && headerDom === 'Dom', JSON.stringify({ headerLun, headerDom }));

  // ===================== Rediseño de Comida y Entreno =====================

  // 36) Comida: el resumen del día es un anillo de kcal + barra de proteína (no tres barras y cuatro KPI)
  await gotoFood('');
  await page.waitForTimeout(150);
  const comidaHero = await page.evaluate(() => ({
    ring: !!document.querySelector('#main .ringFill'),
    protBar: !!document.querySelector('#main .protrow'),
    noOldKpis: !document.querySelector('#main .kpis'),
  }));
  check('Comida resume el día con un anillo de kcal y una barra de proteína, sin los cuatro KPI de antes',
    comidaHero.ring && comidaHero.protBar && comidaHero.noOldKpis, JSON.stringify(comidaHero));

  // 37) Comida: escanear / a mano / mis productos ya no viven en la portada, sino como modos de
  // «apuntar comida»; la portada no enseña ninguno de sus formularios
  const portadaLimpia = await page.evaluate(() => ({
    sinMano: !document.getElementById('foodNewNombre'),
    sinEscaner: !document.getElementById('scanBox'),
    conBotonApuntar: !!document.querySelector('[data-a="food-vista"][data-v="add"]'),
  }));
  await gotoFood('add', 'mano');
  const modoMano = await page.evaluate(() => !!document.getElementById('foodNewNombre'));
  await gotoFood('');
  check('en Comida, los formularios de añadir viven en «apuntar comida», no en la portada',
    portadaLimpia.sinMano && portadaLimpia.sinEscaner && portadaLimpia.conBotonApuntar && modoMano,
    JSON.stringify({ portadaLimpia, modoMano }));

  // 38) Comida: el objetivo (kcal/proteína) está plegado detrás de "✎ objetivo"
  const objToggle = await page.evaluate(() => {
    window.PG.ui.foodObjOpen = false;
    window.PG.render();
    const antes = !!document.querySelector('[data-a="food-ob"][data-k="kcal"]');
    window.PG.ui.foodObjOpen = true;
    window.PG.render();
    const conToggle = !!document.querySelector('[data-a="food-ob"][data-k="kcal"]');
    window.PG.ui.foodObjOpen = false;
    window.PG.render();
    return { antes, conToggle };
  });
  check('en Comida, los campos de objetivo solo se ven tras tocar "✎ objetivo"',
    objToggle.antes === false && objToggle.conToggle === true, JSON.stringify(objToggle));

  // 39) Entreno: hay una gráfica (mapa de calor) de los días entrenados de las últimas 6 semanas
  await gotoGym('progreso');
  const heat = await page.evaluate(() => ({
    cells: document.querySelectorAll('#main .hcell').length,
    stat: !!document.querySelector('#main .heatstat'),
  }));
  check('Entreno tiene una gráfica de los días entrenados (mapa de calor de 6 semanas)',
    heat.cells === 42 && heat.stat, JSON.stringify(heat));

  // 40) Entreno: la biblioteca se puede filtrar por tipo (gimnasio/calistenia) y por parte del cuerpo
  const filtro = await page.evaluate(() => {
    window.PG.gymImportText(JSON.stringify([
      { name: 'Press banca de prueba', category: 'chest', equipment: 'barbell', target: 'pectorals' },
      { name: 'Flexiones de prueba', category: 'chest', equipment: 'body weight', target: 'pectorals' },
      { name: 'Plancha de prueba', category: 'waist', equipment: 'body weight', target: 'abs' },
    ]));
    window.PG.ui.gymPanel = 'biblioteca';   // el buscador vive en su propia pantalla
    window.PG.ui.gymFiltroTipo = 'calistenia';
    window.PG.ui.gymFiltroRegion = '';
    window.PG.ui.gymQ = 'de prueba';
    window.PG.render();
    const soloCalistenia = document.getElementById('main').innerText;
    window.PG.ui.gymFiltroRegion = 'core';
    window.PG.render();
    const calisteniaYCore = document.getElementById('main').innerText;
    window.PG.ui.gymFiltroTipo = '';
    window.PG.ui.gymFiltroRegion = '';
    window.PG.ui.gymQ = '';
    window.PG.render();
    return {
      calisteniaTieneFlexiones: soloCalistenia.includes('Flexiones de prueba'),
      calisteniaSinBanca: !soloCalistenia.includes('Press banca de prueba'),
      coreSoloPlancha: calisteniaYCore.includes('Plancha de prueba') && !calisteniaYCore.includes('Flexiones de prueba'),
    };
  });
  check('en Entreno, la biblioteca se filtra por tipo (gimnasio/calistenia) y por parte del cuerpo',
    filtro.calisteniaTieneFlexiones && filtro.calisteniaSinBanca && filtro.coreSoloPlancha, JSON.stringify(filtro));

  // 41) Entreno: el diagrama de músculos y la recomendación de una rutina están siempre a la vista
  // (no plegados), y la recomendación cambia según los ejercicios que lleve la rutina
  const rutinaDiag = await page.evaluate(() => {
    const g = window.PG.gymS();
    g.rutinas = [{ id: 'rt-test', nombre: 'Rutina de prueba', notas: '', ejercicios: [] }];
    window.PG.ui.gymPanel = 'rutinas';   // las tarjetas de rutina viven en su propia pantalla
    window.PG.render();
    const vacia = document.getElementById('main').innerText;
    window.PG.addRutina('rt-test', 'Press banca de prueba', {});
    window.PG.addRutina('rt-test', 'Plancha de prueba', {});
    const conEjercicios = document.getElementById('main').innerText;
    const diagramaVisible = !!document.querySelector('#main .mdiagram .mbody');
    return {
      avisoVacia: vacia.includes('añade ejercicios'),
      pechoTrabajado: conEjercicios.includes('Pecho'),
      diagramaVisible,
    };
  });
  check('la rutina muestra el muñeco y una recomendación siempre visibles, que cambian según sus ejercicios',
    rutinaDiag.avisoVacia && rutinaDiag.pechoTrabajado && rutinaDiag.diagramaVisible, JSON.stringify(rutinaDiag));

  // 42) Comida: la búsqueda por nombre se puede acotar a Mercadona (filtro de marca en Open Food Facts,
  // ya que Mercadona no tiene API propia) — activado por defecto
  await gotoFood('add', 'scan');
  const mercadonaUI = await page.evaluate(() => ({
    checkboxExiste: !!document.getElementById('scanMerc'),
    marcadoPorDefecto: !!(document.getElementById('scanMerc') || {}).checked,
  }));
  let ultimaUrlOff = '';
  await page.route('https://world.openfoodfacts.org/**', (route) => {
    ultimaUrlOff = route.request().url();
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ products: [] }) });
  });
  await page.evaluate(() => window.PG.buscarOffNombre('yogur', 'mercadona'));
  await page.waitForTimeout(150);
  await page.unroute('https://world.openfoodfacts.org/**');
  check('la búsqueda por nombre se puede acotar a Mercadona (filtro de marca en Open Food Facts)',
    mercadonaUI.checkboxExiste && mercadonaUI.marcadoPorDefecto && ultimaUrlOff.includes('tag_0=mercadona'),
    JSON.stringify({ mercadonaUI, ultimaUrlOff }));

  // 43) Mes: la explicación larga y los números secundarios quedan plegados, no siempre a la vista
  await gotoTab('month');
  await page.waitForTimeout(150);
  const mesSimple = await page.evaluate(() => {
    const kpis = document.querySelector('#main .card .kpis');
    const summaries = Array.from(document.querySelectorAll('#main details > summary'));
    return {
      kpisVisibles: kpis ? kpis.children.length : 0,
      explicacionPlegada: summaries.some((s) => /cómo se calcula/i.test(s.textContent) && !s.parentElement.open),
      masNumerosPlegado: summaries.some((s) => /ver más números/i.test(s.textContent) && !s.parentElement.open),
    };
  });
  check('en "Mes", la explicación larga y los KPI secundarios quedan plegados por defecto',
    mesSimple.kpisVisibles <= 4 && mesSimple.explicacionPlegada && mesSimple.masNumerosPlegado, JSON.stringify(mesSimple));

  // 44) Ajustes: el mínimo de horas de sueño (antes solo en "Turno y rotación") también se puede
  // tocar aquí, junto al resto de números de sueño
  await gotoTab('ajustes');
  await page.waitForTimeout(150);
  const suenoAjustes = await page.evaluate(() => ({
    claves: Array.from(document.querySelectorAll('#main input[data-a="sueno-f"]')).map((i) => i.dataset.k),
  }));
  check('en Ajustes, el mínimo de horas de sueño se puede editar junto al resto de números de sueño',
    suenoAjustes.claves.includes('min') && suenoAjustes.claves.includes('latencia'), JSON.stringify(suenoAjustes));

  // 45) Ajustes: se puede crear un evento que se repite cada semana (título, hora, color, días),
  // desactivarlo sin borrarlo y borrarlo
  await page.fill('#evNuevoTitulo', 'Fisioterapia de prueba');
  await page.fill('#evNuevaHora', '19:30');
  await page.click('[data-a="ev-dia"][data-day="1"]');
  await page.click('[data-a="ev-add"]');
  await page.waitForTimeout(150);
  const evCreado = await page.evaluate(() => {
    const list = window.PG.eventosS();
    return { n: list.length, titulo: list[0] && list[0].titulo, dow: list[0] && list[0].dow, on: list[0] && list[0].on };
  });
  check('Ajustes: se puede crear un evento semanal recurrente (título, hora y día)',
    evCreado.n === 1 && evCreado.titulo === 'Fisioterapia de prueba' && evCreado.dow.includes(1) && evCreado.on === true,
    JSON.stringify(evCreado));

  await page.click('input[data-a="ev-toggle"]');
  await page.waitForTimeout(150);
  const evApagado = await page.evaluate(() => window.PG.eventosS()[0].on);
  check('Ajustes: el evento se puede desactivar sin borrarlo', evApagado === false, String(evApagado));

  await page.click('[data-a="ev-del"]');
  await page.waitForTimeout(150);
  const evTrasBorrar = await page.evaluate(() => window.PG.eventosS().length);
  check('Ajustes: el evento se puede borrar', evTrasBorrar === 0, String(evTrasBorrar));

  // 45b) Ajustes: además de los que se repiten cada semana, se puede añadir un evento puntual (un día
  // en concreto, no una recurrencia) con recordatorio y cuenta atrás opcionales — esto es lo que
  // faltaba: antes solo se podían marcar días de la semana, no una fecha suelta como "una presentación"
  await page.click('[data-a="ev-modo"][data-modo="fecha"]');
  await page.waitForTimeout(120);
  const soloFecha = await page.evaluate(() => ({
    hayFecha: !!document.getElementById('evNuevaFecha'),
    hayDias: !!document.querySelector('[data-a="ev-dia"]'),
  }));
  check('Ajustes: al elegir "un día en concreto" aparece un selector de fecha (y no los días de la semana)',
    soloFecha.hayFecha && !soloFecha.hayDias, JSON.stringify(soloFecha));

  const enDiez = await page.evaluate(() => {
    const d = new Date(); d.setDate(d.getDate() + 10);
    const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return x.toISOString().slice(0, 10);
  });
  await page.fill('#evNuevoTitulo', 'Presentación de prueba');
  await page.fill('#evNuevaFecha', enDiez);
  await page.check('#evNuevoRecordatorio');
  await page.check('#evNuevoCuenta');
  await page.click('[data-a="ev-add"]');
  await page.waitForTimeout(150);
  const puntualCreado = await page.evaluate(() => {
    const ev = window.PG.eventosS()[0];
    return ev && { titulo: ev.titulo, modo: ev.modo, fecha: ev.fecha, recordatorio: ev.recordatorio, cuentaAtras: ev.cuentaAtras };
  });
  check('Ajustes: se puede crear un evento puntual en una fecha concreta, con recordatorio y cuenta atrás',
    puntualCreado && puntualCreado.titulo === 'Presentación de prueba' && puntualCreado.modo === 'fecha' &&
    puntualCreado.fecha === enDiez && puntualCreado.recordatorio === true && puntualCreado.cuentaAtras === true,
    JSON.stringify(puntualCreado));

  const proximosAjustes = await page.evaluate(() => document.getElementById('main').innerText);
  check('Ajustes: el evento puntual aparece en la tarjeta "Próximos" con su cuenta atrás',
    /Próximos/.test(proximosAjustes) && /Presentación de prueba/.test(proximosAjustes) && /faltan 10 días/.test(proximosAjustes),
    '');

  await gotoTab('hoy');
  await page.waitForTimeout(150);
  const proximosHoy = await page.evaluate(() => document.getElementById('main').innerText);
  check('"Hoy" también muestra la tarjeta "Próximos" con el evento puntual (el recordatorio está a la vista)',
    /Próximos/.test(proximosHoy) && /Presentación de prueba/.test(proximosHoy), '');

  const enElDia = await page.evaluate((key) => window.PG.eventosDeFecha(key).map((e) => e.titulo), enDiez);
  check('el evento puntual aparece exactamente en su fecha vía eventosDeFecha() (para "Mes"/"Semana")',
    enElDia.includes('Presentación de prueba'), JSON.stringify(enElDia));

  await page.evaluate(() => { window.PG.store.eventos = []; window.PG.save(); });

  // 46) los eventos recurrentes de hoy aparecen en "Hoy" y el día correspondiente se marca en "Mes"
  const hoyDow = await page.evaluate(() => new Date().getDay());
  await page.evaluate((dow) => {
    window.PG.store.eventos.push({ id: 'ev-test', titulo: 'Entreno con Marta (prueba)', hora: '08:00', dow: [dow], color: '#38e1ff', on: true });
    window.PG.save();
  }, hoyDow);
  await gotoTab('hoy');
  await page.waitForTimeout(150);
  const hoyConEvento = await page.evaluate(() => document.getElementById('main').innerText);
  check('"Hoy" muestra los eventos recurrentes que tocan hoy', hoyConEvento.includes('Entreno con Marta (prueba)'), '');

  await gotoTab('month');
  await page.waitForTimeout(150);
  const mesConEvento = await page.evaluate(() =>
    [...document.querySelectorAll('#main .dbox .dline.evt')].some((l) => /Entreno con Marta/.test(l.textContent)));
  check('"Mes" dice en la propia casilla cómo se llama el evento, sin tener que pinchar el día', mesConEvento, '');

  // 47) Hábitos: pestaña nueva, se puede crear un hábito, marcar el día de hoy, ver la racha y el
  // mapa de calor de 6 semanas, y borrarlo (con confirmación)
  await gotoTab('habitos');
  await page.waitForTimeout(150);
  const habitosVacio = await page.evaluate(() => document.getElementById('main').innerText);
  check('Hábitos: la pestaña nueva existe y, sin hábitos, invita a crear el primero',
    /Hábitos/i.test(habitosVacio) && /crea el primero/i.test(habitosVacio), '');

  await page.fill('#habNuevoNombre', 'Estirar de prueba');
  await page.click('[data-a="hab-add"]');
  await page.waitForTimeout(150);
  const habCreado = await page.evaluate(() => {
    const items = window.PG.habitosS().items;
    return { n: items.length, nombre: items[0] && items[0].nombre, dow: items[0] && items[0].dow };
  });
  check('Hábitos: se puede crear un hábito (todos los días si no marcas ninguno en concreto)',
    habCreado.n === 1 && habCreado.nombre === 'Estirar de prueba' && habCreado.dow.length === 7, JSON.stringify(habCreado));

  const habId = await page.evaluate(() => window.PG.habitosS().items[0].id);
  await page.click(`.wdot button.today[data-id="${habId}"]`);
  await page.waitForTimeout(150);
  const hoyKeyHab = isoDate(new Date());
  const marcado = await page.evaluate(
    ({ hid, key }) => window.PG.habitoHecho(hid, key),
    { hid: habId, key: hoyKeyHab },
  );
  check('Hábitos: tocar el círculo de hoy marca el hábito como hecho', marcado === true, String(marcado));

  const heatCells = await page.evaluate(() => document.querySelectorAll('#main .heat .hcell').length);
  check('Hábitos: la tarjeta de constancia muestra el mapa de calor de 6 semanas (42 días)', heatCells === 42, String(heatCells));

  await page.click(`[data-a="hab-del"][data-id="${habId}"]`);
  await page.waitForTimeout(150);
  await page.click('[data-a="confirm-yes"]');
  await page.waitForTimeout(150);
  const habTrasBorrar = await page.evaluate(() => window.PG.habitosS().items.length);
  check('Hábitos: se puede borrar un hábito (con confirmación) y se limpia su historial', habTrasBorrar === 0, String(habTrasBorrar));

  // 47b) referencia cruzada: un hábito de hoy se ve y se puede marcar desde "Hoy" sin entrar en la
  // pestaña de Hábitos
  const hoyDowCross = await page.evaluate(() => new Date().getDay());
  const habCrossId = await page.evaluate((dow) => {
    const h = window.PG.habitosS();
    h.items.push({ id: 'hab-cross', nombre: 'Estirar de referencia', icono: '🧘', color: '#38e1ff', dow: [dow], creado: '2026-01-01' });
    window.PG.save();
    return 'hab-cross';
  }, hoyDowCross);
  await gotoTab('hoy');
  await page.waitForTimeout(150);
  const habCrossVisible = await page.evaluate(() => document.getElementById('main').innerText.includes('Estirar de referencia'));
  await page.click(`[data-a="hab-mark"][data-id="${habCrossId}"]`);
  await page.waitForTimeout(150);
  const habCrossMarcado = await page.evaluate((id) => {
    const d = new Date(); const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return window.PG.habitoHecho(id, x.toISOString().slice(0, 10));
  }, habCrossId);
  check('"Hoy" muestra los hábitos del día y se pueden marcar desde ahí', habCrossVisible && habCrossMarcado, JSON.stringify({ habCrossVisible, habCrossMarcado }));
  await page.evaluate(() => { window.PG.habitosS().items = window.PG.habitosS().items.filter((h) => h.id !== 'hab-cross'); window.PG.save(); });

  // 47c) "Hoy": el objetivo de kcal y las horas de sueño se pueden abrir con un botón directo, y las
  // comidas de hoy llevan un botón que lleva a cambiar sus horas/platos en "Días y menús"
  await gotoTab('hoy');
  await page.waitForTimeout(150);
  await page.click('[data-a="hoy-food-obj"]');
  await page.waitForTimeout(150);
  const objAbierto = await page.evaluate(() => window.PG.ui.tab === 'food' && window.PG.ui.foodObjOpen === true);
  check('"Hoy": el botón de objetivo de kcal lleva a Comida con el objetivo ya abierto', objAbierto, '');

  await gotoTab('hoy');
  await page.waitForTimeout(150);
  const comidasBtn = await page.$('#main [data-a="day-edit"]');
  let fueATypesDesdeHoy = false;
  if (comidasBtn) {
    await comidasBtn.click();
    await page.waitForTimeout(250);
    fueATypesDesdeHoy = await page.evaluate(() => window.PG.ui.tab === 'types');
  }
  check('"Hoy": "Comidas de hoy" lleva un botón que abre su tarjeta en "Días y menús" (cuando hay un tipo de día asignado)',
    !comidasBtn || fueATypesDesdeHoy, String(!!comidasBtn));

  // 47d) la franja de 24h marca, con su propio color, el segundo entreno y los eventos del día (antes
  // solo se veían sueño/trabajo/comidas) — colores fijos por categoría, no aleatorios
  const hoyDowTl = await page.evaluate(() => new Date().getDay());
  await page.evaluate((dow) => {
    const g = window.PG.gymS();
    g.segundo = { on: true, dias: [dow], tipo: 'piscina', hora: '17:00' };
    window.PG.store.eventos.push({ id: 'ev-tl-test', titulo: 'Evento de prueba', hora: '20:00', modo: 'semanal', dow: [dow], color: '#7c5cff', on: true });
    window.PG.save();
  }, hoyDowTl);
  // el segundo entreno se bloquea en guardia/saliente/vacaciones/festivo: fuerza hoy a un día normal
  const hoyKeyTl = await page.evaluate(() => {
    const x = new Date(); const y = new Date(x.getTime() - x.getTimezoneOffset() * 60000);
    return y.toISOString().slice(0, 10);
  });
  await page.evaluate((key) => {
    if (!window.PG.store.rotation.daySet) window.PG.store.rotation.daySet = {};
    window.PG.store.rotation.daySet[key] = { shift: 'sh-t' };
    window.PG.save();
  }, hoyKeyTl);
  await gotoTab('hoy');
  await page.waitForTimeout(150);
  const marcasTimeline = await page.evaluate(() => ({
    gym: !!document.querySelector('#main .tl-dot.gym'),
    evt: !!document.querySelector('#main .tl-dot.evt'),
  }));
  check('la franja de 24h muestra marcas de color propio para el segundo entreno y los eventos del día',
    marcasTimeline.gym && marcasTimeline.evt, JSON.stringify(marcasTimeline));
  await page.evaluate((key) => {
    window.PG.store.eventos = window.PG.store.eventos.filter((e) => e.id !== 'ev-tl-test');
    window.PG.gymS().segundo = { on: true, dias: [2], tipo: 'piscina', hora: '15:30' };
    if (window.PG.store.rotation.daySet) delete window.PG.store.rotation.daySet[key];
    window.PG.save();
  }, hoyKeyTl);

  // 48) "Mes": el nombre del tipo de día (p. ej. "Saliente", "Vacaciones") usa el color de texto del
  // tema en vez del negro por defecto del navegador — bug real: ".dbox" es un <button> sin "color"
  // propio, así que heredaba "buttontext" del navegador (negro en algunos móviles, aunque el resto de
  // la app esté en modo oscuro) en vez de var(--ink)
  await gotoTab('month');
  await page.waitForTimeout(150);
  const dnmColor = await page.evaluate(() => {
    const el = document.querySelector('.dbox .dnm');
    return el ? getComputedStyle(el).color : null;
  });
  check('"Mes": el nombre del tipo de día usa el color de texto del tema, no el negro por defecto del botón',
    dnmColor === 'rgb(233, 242, 255)', String(dnmColor));

  // 49) Ajustes: además del arreglo de arriba, hay un color de texto configurable a mano (por si algún
  // móvil concreto sigue sin verse bien)
  await gotoTab('ajustes');
  await page.waitForTimeout(150);
  const inkPicker = await page.evaluate(() => !!document.querySelector('#main input[data-a="tema-f"][data-k="ink"]'));
  check('Ajustes: el color del texto se puede fijar a mano, además del principal y el secundario', inkPicker, '');

  // 50) "Mes": la cuadrícula aparece antes que las explicaciones y los números, para que se vea nada
  // más entrar en vez de tener que bajar primero por todo eso
  await gotoTab('month');
  await page.waitForTimeout(150);
  const ordenOk = await page.evaluate(() => {
    const cal = document.querySelector('#main .cal');
    const detalle = Array.from(document.querySelectorAll('#main details.dtip summary'))
      .find((s) => /cómo se calcula/i.test(s.textContent));
    if (!cal || !detalle) return false;
    return !!(cal.compareDocumentPosition(detalle) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  check('"Mes": la cuadrícula del calendario aparece antes que las explicaciones y los números', ordenOk, '');

  // 51) "Mes" en móvil: cada casilla tiene una línea por dato (sin horario/sueño de más, eso se ve
  // al tocar el día) y un tamaño cómodo de tocar, ni la tira gigante de antes ni una miniatura
  const prevViewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const cellHeight = await page.evaluate(() => {
    const box = document.querySelector('#main .dbox.on') || document.querySelector('#main .dbox');
    return box ? box.getBoundingClientRect().height : null;
  });
  check('"Mes" en móvil: las casillas del calendario tienen un tamaño cómodo (entre 44 y 110px de alto)',
    cellHeight != null && cellHeight >= 44 && cellHeight <= 110, String(cellHeight));
  if (prevViewport) await page.setViewportSize(prevViewport);

  // 52) "Mes" en móvil: la cuadrícula no desborda el ancho de la pantalla (bug real: un grid item sin
  // min-width:0 no encoge por debajo de su contenido, así que el "white-space:nowrap" del nombre del
  // tipo de día podía ensanchar toda la cuadrícula y sacarla de la pantalla en horizontal)
  const prevViewport2 = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const sinDesborde = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  check('"Mes" en móvil: la página no se desborda en horizontal', sinDesborde.scrollWidth <= sinDesborde.clientWidth, JSON.stringify(sinDesborde));
  if (prevViewport2) await page.setViewportSize(prevViewport2);

  // 53) la cabecera se esconde al bajar y vuelve a aparecer al subir, para ganar sitio en pantalla
  await gotoTab('month');
  await page.waitForTimeout(150);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  const headerEscondida = await page.evaluate(() => document.querySelector('header').classList.contains('hide'));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  const headerDeVuelta = await page.evaluate(() => !document.querySelector('header').classList.contains('hide'));
  check('la cabecera se esconde al bajar y reaparece al subir (o al volver arriba del todo)',
    headerEscondida && headerDeVuelta, JSON.stringify({ headerEscondida, headerDeVuelta }));

  // 53b) el scroll táctil no es monótono (pequeños rebotes de inercia hacia arriba en pleno gesto de
  // bajar) — la cabecera tiene que esconderse pronto de todas formas, no solo cerca del final de la
  // página (bug real: comparar cada frame contra el anterior con un margen de unos pocos px hacía que
  // esos rebotes cancelaran el escondido una y otra vez)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const escondidaConRebotes = await page.evaluate(async () => {
    const steps = [10, 22, 35, 33, 48, 60, 78, 74, 95, 110, 130];
    for (const y of steps) {
      window.scrollTo(0, y);
      window.dispatchEvent(new Event('scroll'));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    return document.querySelector('header').classList.contains('hide');
  });
  check('la cabecera se esconde pronto aunque el scroll táctil tenga pequeños rebotes hacia arriba (no solo al final de la página)',
    escondidaConRebotes, '');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);

  // 54) Ajustes: hay un atajo directo a las horas y a las comidas de cada tipo de día, sin tener que
  // buscarlo por el menú — "horas" abre el modal de horario y "comidas" lleva a su tarjeta en "Días y menús"
  await gotoTab('ajustes');
  await page.waitForTimeout(150);
  const firstShiftId = await page.evaluate(() => window.PG.store.shifts[0].id);
  await page.click(`[data-a="day-rhythm-shift"][data-id="${firstShiftId}"]`);
  await page.waitForTimeout(200);
  const modalAbierto = await page.evaluate(() => document.getElementById('overlay').classList.contains('on'));
  await page.click('[data-a="m-cancel"]');
  await page.waitForTimeout(150);
  check('Ajustes: el botón "horas" de un tipo de día abre directamente su modal de horario', modalAbierto, '');

  await page.click(`[data-a="day-edit"][data-id="${firstShiftId}"]`);
  await page.waitForTimeout(250);
  const fueATypes = await page.evaluate((sid) => window.PG.ui.tab === 'types' && !!document.querySelector(`#main .card[data-shift="${sid}"]`), firstShiftId);
  check('Ajustes: el botón "comidas" de un tipo de día lleva a su tarjeta en "Días y menús"', fueATypes, '');

  // 92-95) la franja del día: un color fijo por categoría (no por tipo de día), cambiable en Ajustes,
  // y la opción de ver menos de 24 h centradas en lo que pasa ese día
  await gotoTab('ajustes');
  await page.waitForTimeout(200);
  const franjaCard = await page.evaluate(() => {
    const c = document.querySelector('#main .card[data-cfg="franja"]');
    if (!c) return null;
    return {
      horas: !!c.querySelector('select[data-a="franja-horas"]'),
      colores: [...c.querySelectorAll('input[data-a="franja-color"]')].map(i => i.dataset.k),
      preview: !!c.querySelector('.tl-bar'),
    };
  });
  check('Ajustes: la franja del día tiene un color por categoría y un selector de cuántas horas se ven',
    franjaCard && franjaCard.horas && franjaCard.preview &&
    ['sleep', 'work', 'guard', 'meal', 'gym', 'evt'].every(k => franjaCard.colores.includes(k)),
    JSON.stringify(franjaCard));

  // cambiar el color de "trabajo" en Ajustes tiene que verse en la franja de "Hoy"
  await page.evaluate(() => {
    const i = document.querySelector('#main input[data-a="franja-color"][data-k="work"]');
    i.value = '#ff00aa';
    i.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(200);
  await gotoTab('hoy');
  await page.waitForTimeout(200);
  const usaColorPropio = await page.evaluate(() =>
    [...document.querySelectorAll('#main .tl-seg')].some(s => /255,\s*0,\s*170/.test(getComputedStyle(s).backgroundColor)));
  check('el color de "trabajo" que eliges en Ajustes se aplica a la franja de "Hoy"', usaColorPropio, '');

  // la leyenda dice qué es cada color y lleva de vuelta a Ajustes
  const leyenda = await page.evaluate(() => {
    const l = document.querySelector('#main .tlleg');
    return l ? { n: l.querySelectorAll('i').length, atajo: !!l.querySelector('[data-a="franja-cfg"]') } : null;
  });
  check('"Hoy" explica con una leyenda qué es cada color de la franja y lleva a cambiarlos',
    leyenda && leyenda.n === 6 && leyenda.atajo, JSON.stringify(leyenda));

  // a 12 h la franja deja de empezar en 0h: se centra en la parte del día que tiene algo
  const ejes24 = await page.evaluate(() => [...document.querySelectorAll('#main .tl-axis span')].map(s => s.textContent));
  await page.evaluate(() => { window.PG.store.franja = { horas: 12, colores: {} }; window.PG.render(); });
  await page.waitForTimeout(200);
  const ejes12 = await page.evaluate(() => [...document.querySelectorAll('#main .tl-axis span')].map(s => s.textContent));
  check('eligiendo 12 h la franja se centra en tu día en vez de mostrar las 24 h enteras',
    ejes24[0] === '0h' && ejes24[ejes24.length - 1] === '24h' &&
    ejes12[0] !== '0h' && (parseInt(ejes12[ejes12.length - 1], 10) - parseInt(ejes12[0], 10)) === 12,
    JSON.stringify([ejes24, ejes12]));
  await page.evaluate(() => { window.PG.store.franja = { horas: 24, colores: {} }; window.PG.render(); });
  await page.waitForTimeout(150);

  // 99-103) Compra: fuera "Para el carro"; ahora manda lo que el usuario compra de rutina, en listas
  // suyas, y desde cada lista se ve qué platos salen con ella
  await gotoTab('shop');
  await page.waitForTimeout(250);
  const compra = await page.evaluate(() => ({
    carro: /Para el carro/.test(document.getElementById('main').textContent),
    listas: document.querySelectorAll('#main .tarj[data-lista]').length,
    rutina: [...document.querySelectorAll('#main .chk')].some((l) => /Pechuga de pollo/.test(l.textContent)),
    crear: !!document.querySelector('[data-a="lista-add"]'),
  }));
  check('Compra: ya no hay "Para el carro"; hay listas propias y lo de rutina sale en la compra',
    !compra.carro && compra.listas >= 1 && compra.rutina && compra.crear, JSON.stringify(compra));

  // el "·" de la nota solo sale si de verdad hay nota (antes se veía "25 g curry ·" a secas)
  const puntoSuelto = await page.evaluate(() =>
    [...document.querySelectorAll('#main .chk span')].some((s) => /·\s*$/.test(s.textContent)));
  check('ninguna línea de la compra acaba en un "·" suelto sin nota detrás', !puntoSuelto, '');

  await page.fill('#lsNueva', 'Fin de semana');
  await page.click('[data-a="lista-add"]');
  await page.waitForTimeout(250);
  const nueva = await page.evaluate(() => window.PG.listasS().find((l) => l.nombre === 'Fin de semana'));
  await page.fill(`#lsNew-${nueva.id}`, 'Cerveza sin alcohol');
  await page.click(`[data-a="lista-item-add"][data-id="${nueva.id}"]`);
  await page.waitForTimeout(250);
  const conItem = await page.evaluate((id) => {
    const l = window.PG.listaById(id);
    return { items: l.items, foco: document.activeElement && document.activeElement.id };
  }, nueva.id);
  check('se puede crear una lista propia, añadirle cosas y el campo sigue enfocado para la siguiente',
    conItem.items.includes('Cerveza sin alcohol') && conItem.foco === 'lsNew-' + nueva.id, JSON.stringify(conItem));

  // marcarla "de rutina" la mete en la compra de la semana; desmarcarla la saca
  await page.click(`[data-a="lista-fija"][data-id="${nueva.id}"]`);
  await page.waitForTimeout(250);
  const enCompra = await page.evaluate(() =>
    [...document.querySelectorAll('#main .chk')].some((l) => /Cerveza sin alcohol/.test(l.textContent)));
  await page.click(`[data-a="lista-fija"][data-id="${nueva.id}"]`);
  await page.waitForTimeout(250);
  const fueraDeCompra = await page.evaluate(() =>
    [...document.querySelectorAll('#main .chk')].some((l) => /Cerveza sin alcohol/.test(l.textContent)));
  check('marcar una lista "de rutina" la mete en la compra de la semana, y desmarcarla la saca',
    enCompra && !fueraDeCompra, JSON.stringify({ enCompra, fueraDeCompra }));

  // "qué platos salen": recetas ordenadas por cuánto cubre la lista, y sin falsos positivos por "sal"
  const platos = await page.evaluate(() => window.PG.platosConLista(['Café', 'Leche', 'Huevos', 'Sal']));
  check('desde una lista se ve qué platos salen con ella, ordenados por cuánto la cubren',
    platos.length >= 1 && platos[0].pct >= platos[platos.length - 1].pct &&
    !platos.some((p) => /salm[óo]n/i.test(p.dish.name) && p.faltan.length === 0),
    JSON.stringify(platos.map((p) => [p.dish.name, p.pct])));

  await page.evaluate((id) => { window.PG.delLista(id); }, nueva.id);
  await page.waitForTimeout(200);

  // 104-107) rotaciones: la tira del año en vez de la tabla, duración propia por servicio y editor
  // también en Ajustes (comentarios eb241fac y f3caa38a)
  await page.evaluate(() => {
    window.PG.store.rotation.servicios = ['Rayos', 'Cardiología', 'Medicina Interna'];
    window.PG.store.rotation.svcMeses = [2, 1, 1];
    window.PG.save();
  });
  await gotoTab('month');
  await page.waitForTimeout(250);
  const tira = await page.evaluate(() => {
    const c = document.querySelector('#main .card[data-cfg="servicios"]');
    if (!c) return null;
    return {
      tabla: !!c.querySelector('table'),
      bloques: [...c.querySelectorAll('.svcblq')].map((b) => b.querySelector('b').textContent + '|' + b.querySelector('span').textContent),
      ahora: c.querySelectorAll('.svcblq.ahora').length,
    };
  });
  check('las rotaciones se ven como una tira de bloques por servicio, no como una tabla',
    tira && !tira.tabla && tira.bloques.length >= 2 && tira.ahora === 1, JSON.stringify(tira));

  check('una rotación de 2 meses ocupa dos meses seguidos en la tira',
    tira && /^Rayos\|.*·/.test(tira.bloques[0]) && !/·/.test(tira.bloques[1].split('|')[1]),
    JSON.stringify(tira && tira.bloques.slice(0, 2)));

  const cicloDur = await page.evaluate(() => {
    const c = window.PG.cicloServicios(2026, 8, 2027, 1, 1, ['Rayos', 'Cardiología', 'Medicina Interna']);
    return c.map((x) => x.service);
  });
  check('cicloServicios respeta los meses propios de cada rotación (2-1-1, no 1-1-1)',
    cicloDur[0] === 'Rayos' && cicloDur[1] === 'Rayos' && cicloDur[2] === 'Cardiología' && cicloDur[3] === 'Medicina Interna',
    JSON.stringify(cicloDur));

  await gotoTab('ajustes');
  await page.waitForTimeout(250);
  const enAjustes = await page.evaluate(() => {
    const c = document.querySelector('#main .card[data-cfg="rotaciones"]');
    return c ? { filas: c.querySelectorAll('.svcrow').length, meses: !!c.querySelector('[data-a="svc-meses"]'), nueva: !!c.querySelector('[data-a="svc-add"]') } : null;
  });
  check('Ajustes deja tocar las rotaciones y cuánto dura cada una, sin salir de Ajustes',
    enAjustes && enAjustes.filas === 3 && enAjustes.meses && enAjustes.nueva, JSON.stringify(enAjustes));

  // 108-111) los atajos son botones: hay que pulsarlos de verdad. La app tiene dos switch (clic y
  // change) y un case en el que no toca no se dispara nunca, así que cada atajo se prueba clicando.
  await gotoTab('month');
  await page.waitForTimeout(250);
  await page.click('[data-a="mes-cfg"][data-to="vac"]');
  await page.waitForTimeout(250);
  const aVacaciones = await page.evaluate(() => {
    const c = document.querySelector('#main [data-cfg="vac"]');
    return !!c && /brand/.test(c.style.outline);
  });
  check('el KPI de vacaciones del mes lleva a la tarjeta donde se apuntan', aVacaciones, '');

  await page.click('[data-a="mes-cfg"][data-to="mescfg"]');
  await page.waitForTimeout(250);
  const abreCupo = await page.evaluate(() => {
    const d = document.querySelector('#main details[data-cfg="mescfg"]');
    return !!d && d.open && /repartir el mes desde cero/i.test(d.textContent);
  });
  check('el KPI de guardias abre la configuración del mes, que ya incluye "repartir desde cero"', abreCupo, '');

  await gotoTab('hoy');
  await page.waitForTimeout(250);
  await page.click('#main [data-a="franja-cfg"]');
  await page.waitForTimeout(350);
  const aFranja = await page.evaluate(() => {
    const c = document.querySelector('#main .card[data-cfg="franja"]');
    return { tab: window.PG.ui.tab, marcada: !!c && /brand/.test(c.style.outline) };
  });
  check('el atajo de la leyenda de la franja abre Ajustes y marca su tarjeta',
    aFranja.tab === 'ajustes' && aFranja.marcada, JSON.stringify(aFranja));

  await page.click('#main [data-a="ir-servicios"]');
  await page.waitForTimeout(350);
  const aServicios = await page.evaluate(() => {
    const c = document.querySelector('#main .card[data-cfg="servicios"]');
    return { tab: window.PG.ui.tab, marcada: !!c && /brand/.test(c.style.outline) };
  });
  check('desde Ajustes, "ver el año repartido" lleva a la tira de rotaciones del mes',
    aServicios.tab === 'month' && aServicios.marcada, JSON.stringify(aServicios));

  // cambiar la duración de una rotación es un <select>: se dispara con "change", no con un clic
  await gotoTab('ajustes');
  await page.waitForTimeout(250);
  await page.selectOption('#main [data-cfg="rotaciones"] [data-a="svc-meses"][data-ix="0"]', '3');
  await page.waitForTimeout(250);
  const duracionGuardada = await page.evaluate(() => window.PG.store.rotation.svcMeses[0]);
  check('cambiar los meses de una rotación en el desplegable se guarda', duracionGuardada === 3, String(duracionGuardada));

  // 113) "Lo que hay que cocinar esta semana": cada plato como ficha con su icono, no una línea de
  // nombres separados por puntos (comentario fe187a10)
  await gotoTab('week');
  await page.waitForTimeout(250);
  const cocina = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#main .card')]
      .find((c) => /cocinar esta semana/i.test((c.querySelector('h2') || {}).textContent || ''));
    if (!card) return null;
    const p = card.querySelector('.plato');
    return {
      bloques: card.querySelectorAll('.cocblq').length,
      platos: card.querySelectorAll('.plato').length,
      conIcono: !!p && (p.querySelector('.pic') || {}).textContent.trim().length > 0,
      raciones: !!p && /rac\./.test(p.textContent),
      congelador: /🧊/.test(card.textContent),
    };
  });
  check('la cocina de la semana enseña cada plato como una ficha con su icono y sus raciones',
    cocina && cocina.bloques >= 1 && cocina.platos >= 2 && cocina.conIcono && cocina.raciones,
    JSON.stringify(cocina));

  // 114-121) importar recetas de redes sociales: el lector propio, la pantalla, dónde va el plato,
  // la validación de lo que devuelve Claude y la entrada por «Compartir»
  const CAP_TIKTOK = [
    'POLLO AL LIMÓN EN 15 MIN 🍋🔥 guardalo que lo vas a hacer seguro',
    '#recetasfaciles #mealprep',
    '',
    'Ingredientes (para 4 personas):',
    '- 600 g pechuga de pollo',
    '- 2 limones',
    '- 200 ml nata de cocinar',
    '- sal y pimienta',
    '',
    'Preparación:',
    '1. Salpimenta el pollo en tiras y dóralo 5 min a fuego fuerte.',
    '2. Añade el ajo picado y el zumo de los limones, 2 min.',
    '',
    '420 kcal y 38 g de proteína por ración 💪',
    'Sígueme para más 👉 @cocinafit',
  ].join('\n');

  const leida = await page.evaluate((t) => window.PG.parseReceta(t), CAP_TIKTOK);
  check('el lector de la app saca de un pie de TikTok el nombre, las raciones y los macros',
    leida && leida.name === 'Pollo al limón en 15 min' && leida.portions === 4 &&
    leida.kcal === 420 && leida.prot === 38 && leida.icon === '🍗',
    JSON.stringify(leida && { n: leida.name, p: leida.portions, k: leida.kcal, pr: leida.prot }));

  check('separa ingredientes de pasos y tira los hashtags, el «(para 4 personas)» y el «sígueme»',
    leida && leida.ingredients.length === 4 && leida.ingredients[0] === '600 g pechuga de pollo' &&
    leida.steps.length === 2 && !leida.ingredients.some((x) => /personas|#/.test(x)) &&
    !leida.steps.some((x) => /s[íi]gueme|kcal/i.test(x)),
    JSON.stringify(leida && { i: leida.ingredients, s: leida.steps }));

  // un pie sin encabezados, con la lista entera en un renglón y el método en prosa
  const suelta = await page.evaluate(() => window.PG.parseReceta(
    '🍝 PASTA CREMOSA DE ATÚN\n300g pasta, 2 latas de atún, 150 ml nata, 1 cebolla\n' +
    'Cueces la pasta. Pochas la cebolla, añades el atún y la nata, remueves y listo en 12 minutos.'));
  check('también lee un pie sin encabezados: parte la lista de un renglón y coge el método en prosa',
    suelta && suelta.name === 'Pasta cremosa de atún' && suelta.ingredients.length === 4 &&
    suelta.ingredients[1] === '2 latas de atún' && suelta.steps.length === 1,
    JSON.stringify(suelta));

  const nada = await page.evaluate(() => window.PG.parseReceta('me encanta esta receta 😍😍\n#viral #fyp'));
  check('un pie sin receta no inventa un plato: devuelve null', nada === null, JSON.stringify(nada));

  // lo que devuelve Claude no lo valida el contrato: recetaSana() lo comprueba campo a campo
  const basura = await page.evaluate(() => [
    window.PG.recetaSana(null),
    window.PG.recetaSana({ name: 'X' }),
    window.PG.recetaSana({ name: '', ingredients: ['a'] }),
    window.PG.recetaSana({ name: 'Arroz', ingredients: ['200 g arroz'], portions: 999, kcal: -5, prot: 'x' }),
  ]);
  check('lo que devuelve Claude se valida: sin nombre o sin contenido se descarta, y los números se acotan',
    basura[0] === null && basura[1] === null && basura[2] === null &&
    basura[3] && basura[3].portions === 4 && basura[3].kcal === 0 && basura[3].prot === 0,
    JSON.stringify(basura));

  // la pantalla: pegar, leer y que salga la previa editable
  await gotoTab('import');
  await page.waitForTimeout(200);
  const sinClaude = await page.evaluate(() => ({
    boton: !!document.querySelector('[data-a="imp-claude"]'),
    local: !!document.querySelector('[data-a="imp-local"]'),
  }));
  check('fuera del Artifact no se ofrece el botón de Claude, solo el lector de la app',
    !sinClaude.boton && sinClaude.local, JSON.stringify(sinClaude));

  await page.fill('#impTxt', CAP_TIKTOK);
  await page.click('[data-a="imp-local"]');
  await page.waitForTimeout(250);
  const previa = await page.evaluate(() => {
    const t = document.querySelector('[data-imp="previa"]');
    return t ? { nombre: t.querySelector('.tarj-nm').value, dia: !!t.querySelector('[data-f="destinoDia"]') } : null;
  });
  check('tras leerla sale una previa editable que pregunta dónde va el plato',
    previa && previa.nombre === 'Pollo al limón en 15 min' && previa.dia, JSON.stringify(previa));

  const primerDia = await page.evaluate(() => window.PG.store.shifts[0].id);
  await page.selectOption('[data-a="imp-f"][data-f="destinoDia"]', primerDia);
  await page.click('[data-a="imp-save"]');
  await page.waitForTimeout(300);
  const guardado = await page.evaluate((sid) => {
    const d = window.PG.store.dishes.find((x) => x.name === 'Pollo al limón en 15 min');
    const slot = (window.PG.store.menu[sid] || []).find((s) => (s.items || []).some((i) => d && i.id === d.id));
    return { plato: !!d, ingredientes: d ? d.ingredients.length : 0, enMenu: !!slot, limpio: window.PG.ui.imp.receta === null };
  }, primerDia);
  check('al guardar entra en el catálogo con sus ingredientes y se coloca en el menú del día elegido',
    guardado.plato && guardado.ingredientes === 4 && guardado.enMenu && guardado.limpio, JSON.stringify(guardado));

  // «Compartir → Guardias» llega como ?title=&text=&url= en index.html
  await page.goto(base + 'index.html?title=' + encodeURIComponent('Lentejas exprés') +
    '&text=' + encodeURIComponent('250 g lenteja pardina\n1 cebolla\nCuece 20 min.') +
    '&url=' + encodeURIComponent('https://www.tiktok.com/@x/video/1'));
  await page.waitForTimeout(400);
  const compartido = await page.evaluate(() => ({
    tab: window.PG.ui.tab,
    txt: window.PG.ui.imp.txt,
    query: location.search,
  }));
  check('compartir desde otra app abre la importación con el texto ya puesto y limpia la barra de direcciones',
    compartido.tab === 'import' && /Lentejas expr[ée]s/.test(compartido.txt) &&
    /250 g lenteja/.test(compartido.txt) && compartido.query === '',
    JSON.stringify(compartido));

  // 122-124) el camino de Claude solo existe dentro del Artifact, así que aquí se prueba contra un
  // doble que imita el contrato de la capacidad «sample» (claude.use → sample.json / sample.limits)
  const STUB_OK = `window.__llamadas = [];
    const s = function () {};
    s.json = function (input, opts) {
      window.__llamadas.push({ input: input, tier: opts && opts.modelTier });
      return Promise.resolve({ name: 'Pollo con arroz', icon: '🍗', portions: 4, kcal: 530, prot: 42,
        ingredients: ['400 g pollo', '300 g arroz'], steps: ['Dora el pollo.', 'Añade el arroz.'] });
    };
    s.limits = function () { return Promise.resolve({ maxPromptBytes: 65536,
      images: { maxCount: 4, maxInputBytes: 20000000, mediaTypes: ['image/jpeg', 'image/png'] } }); };
    window.claude = { use: function (n) { return Promise.resolve(n === 'sample' ? s : null); } };`;

  const STUB_DENEGADO = `const s = function () {};
    s.json = function () { return Promise.reject({ code: 'not_granted', message: 'nope' }); };
    s.limits = function () { return Promise.resolve({ maxPromptBytes: 65536 }); };
    window.claude = { use: function (n) { return Promise.resolve(n === 'sample' ? s : null); } };`;

  async function conClaude(stub) {
    const p2 = await context.newPage();
    const errs2 = [];
    p2.on('pageerror', (e) => errs2.push(String((e && e.message) || e)));
    await p2.addInitScript(stub);
    await p2.goto(base + 'index.html');
    await p2.waitForFunction(() => window.PG);
    await p2.waitForTimeout(400);   // claude.use() nunca resuelve dentro del primer script
    await p2.evaluate(() => { window.PG.ui.tab = 'import'; window.PG.render(); });
    await p2.waitForTimeout(200);
    return { p2, errs2 };
  }

  {
    const { p2, errs2 } = await conClaude(STUB_OK);
    const ofrece = await p2.evaluate(() => ({
      boton: !!document.querySelector('[data-a="imp-claude"]'),
      imagen: !!document.querySelector('[data-a="imp-img"]'),
    }));
    await p2.fill('#impTxt', 'receta rica 😋 pollo con arroz, lo cuento en el vídeo');
    await p2.click('[data-a="imp-claude"]');
    await p2.waitForTimeout(400);
    const res = await p2.evaluate(() => {
      const t = document.querySelector('[data-imp="previa"]');
      return {
        llamadas: window.__llamadas.length,
        tier: window.__llamadas[0] && window.__llamadas[0].tier,
        pideJson: !!window.__llamadas[0] && /Responde SOLO con un objeto JSON/.test(window.__llamadas[0].input),
        llevaTexto: !!window.__llamadas[0] && /pollo con arroz/.test(window.__llamadas[0].input),
        nombre: t && t.querySelector('.tarj-nm').value,
        marcada: t && /Claude/.test(t.textContent),
      };
    });
    check('dentro del Artifact se ofrece leer la receta con Claude, y con captura si el visor lo permite',
      ofrece.boton && ofrece.imagen, JSON.stringify(ofrece));
    check('pulsarlo hace UNA llamada con el texto y el formato pedido, y pinta la receta que vuelve',
      res.llamadas === 1 && res.tier === 'default' && res.pideJson && res.llevaTexto &&
      res.nombre === 'Pollo con arroz' && res.marcada, JSON.stringify(res));
    check('el camino de Claude no lanza errores de JavaScript', errs2.length === 0, JSON.stringify(errs2));
    await p2.close();
  }

  {
    const { p2 } = await conClaude(STUB_DENEGADO);
    const sinImagen = await p2.evaluate(() => !!document.querySelector('[data-a="imp-img"]'));
    await p2.fill('#impTxt', 'pollo con arroz');
    await p2.click('[data-a="imp-claude"]');
    await p2.waitForTimeout(400);
    const tras = await p2.evaluate(() => {
      const n = document.querySelector('#main .note[style*="warn"]');
      return { aviso: n ? n.textContent : '', boton: !!document.querySelector('[data-a="imp-claude"]'),
        local: !!document.querySelector('[data-a="imp-local"]') };
    });
    check('si el visor deniega el permiso se explica en español, se retira el botón y queda el lector propio',
      !sinImagen && /No has dado permiso/.test(tras.aviso) && !tras.boton && tras.local, JSON.stringify(tras));
    await p2.close();
  }

  // 127-132) pegar el enlace: traer la descripción sola, y decir la verdad cuando no se puede
  await gotoTab('import');
  await page.waitForTimeout(200);
  const campoEnlace = await page.evaluate(() => ({
    campo: !!document.querySelector('#impUrl'),
    boton: !!document.querySelector('[data-a="imp-traer"]'),
  }));
  check('la pantalla de importar tiene un campo para el enlace del vídeo',
    campoEnlace.campo && campoEnlace.boton, JSON.stringify(campoEnlace));

  // el navegador bloquea CORS: fetch rechaza con TypeError, sin estado. Es EL caso que justifica
  // las salidas alternativas, así que el aviso tiene que explicarlo —no quedarse en «ha fallado»—
  // y ofrecerlas ahí mismo, en vez de mandar al usuario a buscarlas por su cuenta.
  await page.evaluate(() => {
    window.__fetchReal = window.fetch;
    window.fetch = () => Promise.reject(new TypeError('Failed to fetch'));
  });
  await page.fill('#impUrl', 'https://www.tiktok.com/@cocinafit/video/123');
  await page.click('[data-a="imp-traer"]');
  await page.waitForTimeout(300);
  const avisoCors = await page.evaluate(() => {
    const n = document.querySelector('#main .note[style*="warn"]');
    return n ? n.textContent : '';
  });
  const salidasCors = await page.evaluate(() => ({
    publico: !!document.querySelector('[data-a="lector-publico"]'),
    propio: !!document.querySelector('[data-a="ir-lector"]'),
  }));
  check('si el navegador no deja pedírsela a TikTok, se explica y se ofrecen las dos salidas',
    /no permite CORS/.test(avisoCors) && salidasCors.publico && salidasCors.propio,
    avisoCors.slice(0, 120) + ' ' + JSON.stringify(salidasCors));

  // con oEmbed respondiendo, la descripción entra y se lee sola
  await page.evaluate(() => {
    window.__pedido = null;
    window.fetch = (u) => {
      window.__pedido = String(u);
      return Promise.resolve({ ok: true, status: 200,
        json: () => Promise.resolve({ title: 'LENTEJAS EXPRÉS 🍲\n250 g lenteja pardina\n1 cebolla\nCuece 20 min y listo.', author_name: 'cocinafit' }) });
    };
  });
  await page.click('[data-a="imp-traer"]');
  await page.waitForTimeout(350);
  const traido = await page.evaluate(() => ({
    pedido: window.__pedido,
    txt: window.PG.ui.imp.txt,
    nombre: (window.PG.ui.imp.receta || {}).name,
    ingredientes: ((window.PG.ui.imp.receta || {}).ingredients || []).length,
  }));
  check('con la descripción traída, se pide a oEmbed con el enlace codificado',
    /tiktok\.com\/oembed\?url=https%3A%2F%2Fwww\.tiktok\.com/.test(traido.pedido || ''), traido.pedido);
  check('la descripción entra en el cuadro y se lee sola, sin tocar nada más',
    /LENTEJAS/.test(traido.txt) && traido.nombre === 'Lentejas exprés' && traido.ingredientes === 2,
    JSON.stringify(traido));

  // con lector propio configurado se usa ese, no la plataforma
  await page.evaluate(() => {
    window.PG.store.lector = { proxy: 'https://recetas.ejemplo.workers.dev' };
    window.PG.save();
    window.PG.ui.imp.receta = null;
    window.PG.render();
  });
  await page.click('[data-a="imp-traer"]');
  await page.waitForTimeout(350);
  const viaProxy = await page.evaluate(() => window.__pedido);
  check('si has puesto tu lector en Ajustes, la petición va por él y no por la plataforma',
    /^https:\/\/recetas\.ejemplo\.workers\.dev\?url=https%3A%2F%2Fwww\.tiktok\.com/.test(viaProxy || ''), viaProxy);

  // un enlace que no es de ningún sitio conocido, sin lector propio
  await page.evaluate(() => { window.PG.store.lector = { proxy: '' }; window.PG.save(); });
  const rechazado = await page.evaluate(() => window.PG.traerDescripcion('https://ejemplo.com/receta')
    .then(() => null).catch((e) => e.msg));
  check('un enlace de un sitio que no conoce se rechaza explicando qué sitios lee',
    /TikTok y de YouTube/.test(rechazado || ''), rechazado);

  await page.evaluate(() => { if (window.__fetchReal) window.fetch = window.__fetchReal; });

  // dentro del Artifact no hay red: se avisa antes de gastar un toque
  {
    const p3 = await context.newPage();
    await p3.addInitScript(`window.claude = { use: function () { return Promise.resolve(null); } };`);
    await p3.goto(base + 'index.html');
    await p3.waitForFunction(() => window.PG);
    await p3.waitForTimeout(300);
    // la promesa hay que esperarla DENTRO de la página: al serializarla vuelve como {}
    const enArt = await p3.evaluate(async () => ({
      detecta: window.PG.enArtifact(),
      tipo: await window.PG.traerDescripcion('https://www.tiktok.com/@x/video/1').then(() => null).catch((e) => e.tipo),
    }));
    check('dentro del Artifact ni lo intenta: avisa de que ahí no se puede salir a la red',
      enArt.detecta === true && enArt.tipo === 'artifact', JSON.stringify(enArt));
    await p3.close();
  }

  // 133-138) SECUENCIAS, no caminos sueltos. Las pruebas de arriba salían de un estado limpio y por
  // eso no vieron ninguno de estos seis: todos aparecen al encadenar dos gestos.
  await gotoTab('import');
  await page.waitForTimeout(200);
  const CAP_OK = 'LENTEJAS EXPRÉS 🍲\nIngredientes:\n250 g lenteja pardina\n1 cebolla\nPreparación:\nCuece 20 minutos.';

  // leer una receta y luego darle a «limpiar»: la previa y su botón de guardar tienen que irse
  await page.fill('#impTxt', CAP_OK);
  await page.click('[data-a="imp-local"]');
  await page.waitForTimeout(250);
  await page.click('[data-a="imp-clear"]');
  await page.waitForTimeout(250);
  const trasLimpiar = await page.evaluate(() => ({
    txt: document.querySelector('#impTxt').value,
    previa: !!document.querySelector('[data-imp="previa"]'),
    guardar: !!document.querySelector('[data-a="imp-save"]'),
  }));
  check('«limpiar» se lleva también la receta leída, no solo el texto',
    trasLimpiar.txt === '' && !trasLimpiar.previa && !trasLimpiar.guardar, JSON.stringify(trasLimpiar));

  // traer un enlace con receta y luego otro SIN receta: no puede quedarse la primera en pantalla,
  // o acabas guardando el plato del enlace anterior
  await page.evaluate(() => {
    window.__fetchReal2 = window.fetch;
    window.__n = 0;
    window.fetch = () => {
      window.__n++;
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(
        window.__n === 1
          ? { title: 'LENTEJAS EXPRÉS 🍲\nIngredientes:\n250 g lenteja pardina\n1 cebolla\nPreparación:\nCuece 20 minutos.' }
          : { title: 'que rico todo 😍 #fyp' }) });
    };
  });
  await page.fill('#impUrl', 'https://www.tiktok.com/@a/video/1');
  await page.click('[data-a="imp-traer"]');
  await page.waitForTimeout(300);
  const previa1 = await page.evaluate(() => {
    const t = document.querySelector('[data-imp="previa"]'); return t ? t.querySelector('.tarj-nm').value : null;
  });
  await page.fill('#impUrl', 'https://www.tiktok.com/@a/video/2');
  await page.click('[data-a="imp-traer"]');
  await page.waitForTimeout(300);
  const previa2 = await page.evaluate(() => !!document.querySelector('[data-imp="previa"]'));
  check('un enlace nuevo sin receta se lleva por delante la receta del enlace anterior',
    previa1 === 'Lentejas exprés' && previa2 === false, JSON.stringify({ previa1, previa2 }));

  // una respuesta 200 que no es JSON no es un bloqueo de CORS: mandar ahí al usuario a montar un
  // proxy es mandarlo a arreglar lo que no está roto
  await page.evaluate(() => {
    window.fetch = () => Promise.resolve({ ok: true, status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token <')) });
  });
  await page.click('[data-a="imp-traer"]');
  await page.waitForTimeout(300);
  const avisoFormato = await page.evaluate(() => {
    const n = document.querySelector('#main .note[style*="warn"]'); return n ? n.textContent : '';
  });
  check('un 200 con algo que no es JSON se explica como formato, no como CORS',
    !/no permite CORS/.test(avisoFormato) && /formato|JSON/i.test(avisoFormato), avisoFormato.slice(0, 90));

  // el lector sin https:// se completa al salir del campo, en vez de guardarse muerto
  await gotoTab('ajustes');
  await page.waitForTimeout(250);
  await page.fill('[data-a="lector-f"]', 'recetas.ejemplo.workers.dev');
  await page.keyboard.press('Tab');   // fill() no dispara «change»; salir del campo sí
  await page.waitForTimeout(250);
  const lectorGuardado = await page.evaluate(() => window.PG.store.lector.proxy);
  const sobreviveNormalize = await page.evaluate(() => {
    const copia = JSON.parse(JSON.stringify(window.PG.store));
    window.PG.store = copia;                      // pasa por normalize(), como al recargar
    return window.PG.store.lector.proxy;
  });
  check('un lector escrito sin https:// se completa solo y sobrevive a recargar',
    lectorGuardado === 'https://recetas.ejemplo.workers.dev' &&
    sobreviveNormalize === 'https://recetas.ejemplo.workers.dev',
    JSON.stringify({ lectorGuardado, sobreviveNormalize }));

  // «probar» con una dirección equivocada que devuelve 404 no puede decir que va bien
  await page.evaluate(() => {
    window.fetch = () => Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('<html>404</html>') });
  });
  await page.click('[data-a="lector-probar"]');
  await page.waitForTimeout(350);
  const avisoProbar = await page.evaluate(() => {
    const f = document.getElementById('flash'); return f ? f.textContent : '';
  });
  check('«probar» solo da el visto bueno si contesta tu lector, no ante cualquier 404',
    /^✗/.test(avisoProbar.trim()), avisoProbar.slice(0, 80));
  await page.evaluate(() => {
    if (window.__fetchReal2) window.fetch = window.__fetchReal2;
    window.PG.store.lector = { proxy: '' }; window.PG.save();
  });

  // compartir desde TikTok: el enlace va a su campo, no revuelto con el texto de la receta
  await page.goto(base + 'index.html?title=' + encodeURIComponent('Lentejas') +
    '&text=' + encodeURIComponent('250 g lenteja\n1 cebolla') +
    '&url=' + encodeURIComponent('https://www.tiktok.com/@a/video/9'));
  await page.waitForTimeout(400);
  const compartido2 = await page.evaluate(() => ({
    url: window.PG.ui.imp.url,
    campo: (document.querySelector('#impUrl') || {}).value,
    txt: window.PG.ui.imp.txt,
  }));
  check('al compartir, el enlace va al campo de enlace y el texto queda limpio de URLs',
    compartido2.url === 'https://www.tiktok.com/@a/video/9' &&
    compartido2.campo === compartido2.url && !/https?:\/\//.test(compartido2.txt),
    JSON.stringify(compartido2));

  // ===================== Mes: la cuadrícula llena la pantalla y los eventos se ven =====================
  {
    // las casillas medían 96 px con 28 de contenido: 68 px muertos por día, y la cuadrícula se
    // quedaba en poco más de la mitad del alto útil del móvil
    await page.setViewportSize({ width: 412, height: 915 });
    const hoyMes = new Date();
    const claveDe = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    await page.evaluate((claves) => {
      const ev = window.PG.eventosS();
      ev.length = 0;
      ev.push({ id: 'ev-a', titulo: 'Sesión clínica', hora: '08:00', modo: 'fecha', fecha: claves[0], color: '#a855f7', dow: [] });
      ev.push({ id: 'ev-b', titulo: 'Congreso SEMES', hora: '09:00', modo: 'fecha', fecha: claves[1], color: '#38e1ff', dow: [] });
      window.PG.save();
    }, [claveDe(new Date(hoyMes.getFullYear(), hoyMes.getMonth(), 9)),
        claveDe(new Date(hoyMes.getFullYear(), hoyMes.getMonth(), 25))]);
    await gotoTab('month');
    await page.click('[data-a="mon-today"]');
    await page.waitForTimeout(400);
    const rejilla = await page.evaluate(() => {
      const cal = document.querySelector('.cal');
      const celda = [...document.querySelectorAll('.dbox')].find((x) => !x.classList.contains('blank'));
      const r = celda.getBoundingClientRect();
      return {
        alturaCelda: Math.round(r.height),
        alturaCal: Math.round(cal.getBoundingClientRect().height),
        ventana: window.innerHeight,
        cabeceraNoEstirada: Math.round(document.querySelector('.cal .wd').getBoundingClientRect().height) < 40,
      };
    });
    check('en el móvil la cuadrícula del mes se estira para llenar la pantalla',
      rejilla.alturaCelda > 96 && rejilla.alturaCal > rejilla.ventana * 0.55 && rejilla.cabeceraNoEstirada,
      JSON.stringify(rejilla));

    // los eventos del mes se ven en su casilla Y en una lista con el nombre entero, porque en una
    // casilla de 53 px de ancho el título siempre sale cortado
    const agenda = await page.evaluate(() => {
      const c = [...document.querySelectorAll('#main .card')].find((x) => /^Eventos de/m.test(x.innerText));
      return {
        enCasilla: document.querySelectorAll('.dline.evt').length,
        filas: c ? c.querySelectorAll('.agrow').length : 0,
        nombreEntero: c ? /Congreso SEMES/.test(c.innerText) : false,
      };
    });
    check('los eventos del mes salen en su casilla y listados enteros debajo del calendario',
      agenda.enCasilla >= 2 && agenda.filas === 2 && agenda.nombreEntero, JSON.stringify(agenda));

    // y tocar uno de la lista te lleva a ese día
    await page.click('.agrow');
    await page.waitForTimeout(300);
    const saltó = await page.evaluate(() => window.PG.ui.monSel);
    check('tocar un evento de la lista abre ese día en el calendario',
      /^\d{4}-\d{2}-09$/.test(saltó || ''), 'monSel: ' + saltó);

    await page.evaluate(() => { window.PG.eventosS().length = 0; window.PG.save(); window.PG.ui.monSel = ''; });
    await page.setViewportSize({ width: 390, height: 844 });
  }

  // ===================== Dónde se guardan los datos =====================
  {
    // sin pedirlo, lo guardado en el navegador es «de usar y tirar»: Android puede borrarlo cuando
    // al móvil le falta espacio. La app pide que se marque como permanente al arrancar.
    const almacen = await page.evaluate(async () => {
      await window.PG.pedirPersistencia();
      return {
        pidePersistencia: typeof window.PG.pedirPersistencia === 'function',
        // en este Chromium de pruebas no hay «engagement» ni app instalada, así que persist()
        // devuelve false: lo que se comprueba es que se pregunta y que se cuenta el resultado
        persistido: await navigator.storage.persisted(),
      };
    });
    await gotoTab('data');
    await page.waitForTimeout(400);
    const tarjeta = await page.evaluate(() => {
      const c = [...document.querySelectorAll('#main .card')].find((x) => /Dónde se guarda/.test(x.textContent));
      return c ? { txt: c.innerText, cifras: c.querySelectorAll('.dosdatos b').length } : null;
    });
    check('«Datos» dice dónde vive todo y si el navegador puede borrarlo',
      almacen.pidePersistencia && tarjeta && tarjeta.cifras === 2 &&
      /en ning[úu]n sitio m[áa]s/i.test(tarjeta.txt) &&
      /(protegido|sin proteger|comprobando)/i.test(tarjeta.txt) &&
      /desinstalar/i.test(tarjeta.txt),
      JSON.stringify({ almacen, cifras: tarjeta && tarjeta.cifras }));

    // y en un navegador sin navigator.storage la app no puede reventar por esto
    const sinApi = await page.evaluate(async () => {
      const real = navigator.storage;
      Object.defineProperty(navigator, 'storage', { value: undefined, configurable: true });
      let reventó = false;
      try { await window.PG.pedirPersistencia(); } catch (e) { reventó = true; }
      window.PG.render();
      const vivo = !!document.querySelector('#main .card');
      Object.defineProperty(navigator, 'storage', { value: real, configurable: true });
      return { reventó, vivo };
    });
    check('en un navegador sin API de almacenamiento, la app sigue funcionando igual',
      !sinApi.reventó && sinApi.vivo, JSON.stringify(sinApi));
  }

  // ===================== Compartir desde TikTok con la app instalada =====================
  {
    // lo compartido sobrevive a que el sistema mate la app: Android cierra la PWA en cuanto vuelves
    // a TikTok y, como la barra de direcciones se limpia, antes no quedaba ni rastro de la receta
    await page.reload();
    await page.waitForTimeout(500);
    const rescatado = await page.evaluate(() => ({
      txt: window.PG.ui.imp.txt,
      url: window.PG.ui.imp.url,
      tab: window.PG.ui.tab,
      enDisco: !!window.PG.store.impPendiente,
    }));
    check('lo compartido se recupera tras recargar (Android mata la app al volver a TikTok)',
      rescatado.url === 'https://www.tiktok.com/@a/video/9' && /lenteja/.test(rescatado.txt) &&
      rescatado.enDisco, JSON.stringify(rescatado));
    // pero no te secuestra la app en cada arranque: a la pantalla te lleva solo la primera vez
    check('el rescate no te lleva a Importar cada vez que abres, solo la primera',
      rescatado.tab !== 'import', 'tab tras recargar: ' + rescatado.tab);

    // y se olvida al limpiar, o no habría forma de quitárselo de encima
    await gotoTab('import');
    await page.waitForTimeout(200);
    await page.click('[data-a="imp-clear"]');
    await page.waitForTimeout(200);
    await page.reload();
    await page.waitForTimeout(500);
    const limpio = await page.evaluate(() => ({
      enDisco: !!window.PG.store.impPendiente, txt: window.PG.ui.imp.txt, url: window.PG.ui.imp.url,
    }));
    check('«limpiar» se lleva también lo compartido guardado, y ya no vuelve al recargar',
      !limpio.enDisco && !limpio.txt && !limpio.url, JSON.stringify(limpio));

    // 📋 pegar: el camino que funciona en cualquier móvil (en iPhone no hay «compartir con la app»
    // y en Android TikTok solo la enseña detrás de «Más»). Separa el enlace del resto del texto.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoTab('import');
    await page.waitForTimeout(200);
    await page.evaluate(() => navigator.clipboard.writeText(
      'Crema de calabaza\n1 calabaza\n1 puerro https://vm.tiktok.com/ZGpeg/'));
    await page.click('[data-a="imp-pegar"]');
    await page.waitForTimeout(400);
    const pegado = await page.evaluate(() => ({
      url: window.PG.ui.imp.url,
      campo: (document.querySelector('#impUrl') || {}).value,
      txt: window.PG.ui.imp.txt,
    }));
    check('«📋 pegar» separa el enlace del texto y los deja cada uno en su sitio',
      pegado.url === 'https://vm.tiktok.com/ZGpeg/' && pegado.campo === pegado.url &&
      /calabaza/.test(pegado.txt) && !/https?:\/\//.test(pegado.txt), JSON.stringify(pegado));
    await page.click('[data-a="imp-clear"]');
    await page.waitForTimeout(200);
  }

  // ===================== Rediseño de Comida: portada, apuntar, qué cocino y modo cocina =====================
  // Estas pruebas encadenan gestos a propósito. La auditoría anterior dejó seis fallos con la suite
  // en verde porque cada prueba partía de cero y tocaba un solo camino; aquí se navega de verdad.

  // 45) la portada de Comida: anillo, cifras (no barras) para lo que no es progreso, tira de la
  // semana y fichas — y el formulario de apuntar ya no vive aquí
  await gotoFood('');
  const portadaComida = await page.evaluate(() => ({
    ring: !!document.querySelector('#main .ringFill'),
    protBar: !!document.querySelector('#main .protrow'),
    cifras: document.querySelectorAll('#main .dosdatos b').length,
    // "te quedan" y "cocinado hoy" NO pueden ser barras: no son progreso hacia nada
    cifrasSinBarra: !document.querySelector('#main .dosdatos .fbar'),
    semana: document.querySelectorAll('#main .semd').length,
    fichas: document.querySelectorAll('#main .gtile').length,
    apuntar: !!document.querySelector('#main [data-a="food-vista"][data-v="add"]'),
    sinFormulario: !document.getElementById('feSel') && !document.getElementById('foodNewNombre'),
  }));
  check('la portada de Comida es anillo + cifras + semana + fichas, sin el formulario de apuntar',
    portadaComida.ring && portadaComida.protBar && portadaComida.cifras === 2 &&
    portadaComida.cifrasSinBarra && portadaComida.semana === 7 && portadaComida.fichas === 4 &&
    portadaComida.apuntar && portadaComida.sinFormulario, JSON.stringify(portadaComida));

  // 46) secuencia completa de apuntar: buscar → elegir → la previaFe sigue lo que tecleas sin perder
  // el foco → apuntar. La previaFe a mano (sin render) es lo que evita que el campo se desmonte.
  await gotoFood('add', 'buscar');
  await page.fill('#feQ', 'tortilla');
  await page.waitForTimeout(350);
  // el catálogo local ya está importado a estas alturas y «tortilla» también casa con un producto
  // suyo: aquí interesa un PLATO, que es el que se apunta por raciones y no por gramos
  const primerPlatoCm = await page.evaluate(() => {
    const r = Array.prototype.filter.call(document.querySelectorAll('[data-a="food-pick"]'),
      (x) => x.dataset.v.indexOf('dish:') === 0)[0];
    return r ? r.dataset.v : null;
  });
  await page.click(`[data-a="food-pick"][data-v="${primerPlatoCm}"]`);
  await page.waitForTimeout(200);
  await page.fill('#feG', '2');
  await page.waitForTimeout(120);
  const previaFe = await page.evaluate(() => ({
    sel: (document.getElementById('feSel') || {}).value,
    kcal: (document.getElementById('fePrevK') || {}).textContent,
    focoSigueEnElCampo: document.activeElement.id === 'feG',
  }));
  const hoyKCm = new Date().toISOString().slice(0, 10);
  const kcalPreviasCm = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKCm);
  await page.click('[data-a="fe-add"]');
  await page.waitForTimeout(250);
  const trasApuntarCm = await page.evaluate((k) => ({
    kcal: window.PG.foodTotals(k).kcal,
    fichaCerrada: !document.getElementById('feSel'),
  }), hoyKCm);
  const dosRacionesCm = await page.evaluate((v) => {
    const d = window.PG.dishById(v.slice(5));
    return d ? d.kcal * 2 : 0;
  }, primerPlatoCm);
  check('buscar → elegir → teclear → apuntar: la previaFe sigue al campo y la toma entra con su cantidad',
    previaFe.sel === primerPlatoCm && previaFe.kcal === dosRacionesCm + ' kcal' && previaFe.focoSigueEnElCampo &&
    trasApuntarCm.kcal === kcalPreviasCm + dosRacionesCm && trasApuntarCm.fichaCerrada,
    JSON.stringify({ previaFe, kcalPreviasCm, trasApuntarCm, dosRacionesCm }));

  // 47) con la cantidad borrada, un plato se apunta como UNA ración, no como 150 (el hueco por
  // defecto tiene que depender de la unidad: gramos en un producto, raciones en un plato)
  await page.click(`[data-a="food-pick"][data-v="${primerPlatoCm}"]`);
  await page.waitForTimeout(200);
  await page.fill('#feG', '');
  const kcalAntesVacio = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKCm);
  await page.click('[data-a="fe-add"]');
  await page.waitForTimeout(250);
  const kcalTrasVacio = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKCm);
  check('con la cantidad en blanco, un plato se apunta como una ración (no como 150)',
    kcalTrasVacio - kcalAntesVacio === dosRacionesCm / 2,
    JSON.stringify({ kcalAntesVacio, kcalTrasVacio, unaRacion: dosRacionesCm / 2 }));

  // 48) "qué puedo cocinar": separa lo que sale entero de lo que casi, y "a la compra" mete lo que
  // falta en una lista de verdad (secuencia: se mira la lista antes y después del toque)
  await gotoFood('cocinar');
  const platosQueSalen = await page.evaluate(() => ({
    listos: document.querySelectorAll('#main .plato.listo').length,
    total: document.querySelectorAll('#main .plato').length,
    aLaCompra: document.querySelectorAll('#main [data-a="cocinar-compra"]').length,
  }));
  let compraDeltaCm = null;
  if (platosQueSalen.aLaCompra > 0) {
    const antesCompra = await page.evaluate(() => window.PG.listasS().reduce((a, l) => a + l.items.length, 0));
    await page.click('#main [data-a="cocinar-compra"]');
    await page.waitForTimeout(250);
    const despuesCompra = await page.evaluate(() => window.PG.listasS().reduce((a, l) => a + l.items.length, 0));
    compraDeltaCm = despuesCompra - antesCompra;
  }
  check('"qué cocino" separa lo que sale entero de lo que casi, y "a la compra" apunta lo que falta',
    platosQueSalen.total > 0 && platosQueSalen.listos > 0 && platosQueSalen.listos <= platosQueSalen.total &&
    (platosQueSalen.aLaCompra === 0 || compraDeltaCm > 0),
    JSON.stringify({ ...platosQueSalen, compraDeltaCm }));

  // 49) modo cocina: los ingredientes se escalan a las raciones elegidas y en cantidades que se
  // pueden comprar (nada de "933,33 g de patata"), y los pasos se recorren de uno en uno
  await gotoFood('cocinar');
  const platoCocinaCm = await page.evaluate(() => {
    const b = document.querySelector('#main .plato.listo [data-a="food-cocina"]');
    return b ? b.dataset.id : null;
  });
  await page.click(`[data-a="food-cocina"][data-id="${platoCocinaCm}"]`);
  await page.waitForTimeout(250);
  const cocina1Cm = await page.evaluate(() => ({
    ingr: Array.prototype.map.call(document.querySelectorAll('#main .ingr b'), (x) => x.textContent),
    pasos: document.querySelectorAll('#main .pasopunto').length,
    paso: (document.querySelector('#main .paso') || {}).textContent,
  }));
  await page.click('[data-a="cocina-rac"][data-n="8"]');
  await page.waitForTimeout(200);
  const cocina8Cm = await page.evaluate((id) => {
    const d = window.PG.dishById(id);
    return {
      ingr: Array.prototype.map.call(document.querySelectorAll('#main .ingr b'), (x) => x.textContent),
      base: d.portions,
    };
  }, platoCocinaCm);
  // los gramos y mililitros, al entero; lo que se cuenta, al medio
  const cantidadesCompradas = cocina8Cm.ingr.every((q) => {
    const m = /^([\d.,]+)\s*(\S*)$/.exec(q);
    if (!m) return true;
    const n = parseFloat(m[1].replace(',', '.'));
    return ['g', 'kg', 'ml', 'l'].indexOf(m[2]) >= 0 ? (n < 10 || Number.isInteger(n)) : (n * 2) % 1 === 0;
  });
  const ingrEscalados = cocina1Cm.ingr.length && cocina8Cm.ingr.length &&
    cocina8Cm.ingr.join('|') !== cocina1Cm.ingr.join('|');
  check('el modo cocina escala los ingredientes a las raciones pedidas, en cantidades comprables',
    ingrEscalados && cantidadesCompradas && cocina1Cm.pasos > 0 && !!cocina1Cm.paso,
    JSON.stringify({ base: cocina8Cm.base, de: cocina1Cm.ingr, a: cocina8Cm.ingr }));

  await page.click('[data-a="cocina-paso"][data-n="1"]');
  await page.waitForTimeout(200);
  const paso2Cm = await page.evaluate(() => ({
    texto: (document.querySelector('#main .paso') || {}).textContent,
    marcados: document.querySelectorAll('#main .pasopunto.on').length,
  }));
  check('avanzar de paso cambia el texto y marca los puntos recorridos',
    paso2Cm.texto !== cocina1Cm.paso && paso2Cm.marcados === 2, JSON.stringify(paso2Cm));

  // 50) secuencia: si sales de una receta larga por el paso 2 y abres otra más corta, el paso no se
  // queda fuera de rango enseñando una pantalla en blanco
  await page.click('.subcab [data-a="food-vista"][data-v="cocinar"]');
  await page.waitForTimeout(200);
  const otroPlatoCm = await page.evaluate((evitar) => {
    const b = Array.prototype.filter.call(
      document.querySelectorAll('#main [data-a="food-cocina"]'), (x) => x.dataset.id !== evitar)[0];
    return b ? b.dataset.id : null;
  }, platoCocinaCm);
  await page.click(`[data-a="food-cocina"][data-id="${otroPlatoCm}"]`);
  await page.waitForTimeout(250);
  const traFsCambio = await page.evaluate(() => ({
    paso: window.PG.ui.cocinaPaso,
    rac: window.PG.ui.cocinaRac,
    hayTexto: !!(document.querySelector('#main .paso') || {}).textContent,
    primeroMarcado: document.querySelectorAll('#main .pasopunto.on').length,
  }));
  check('cambiar de receta en modo cocina vuelve al paso 1 y a las raciones de esa receta',
    traFsCambio.paso === 0 && traFsCambio.rac === 0 && traFsCambio.hayTexto &&
    traFsCambio.primeroMarcado === 1, JSON.stringify(traFsCambio));

  // 51) "hecho" cierra el ciclo: apunta una ración en el día de hoy y devuelve a la portada
  const kcalAntesHecho = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKCm);
  const ultimoPaso = await page.evaluate(() => document.querySelectorAll('#main .pasopunto').length - 1);
  await page.click(`[data-a="cocina-paso"][data-n="${ultimoPaso}"]`);
  await page.waitForTimeout(200);
  await page.click('[data-a="cocina-hecho"]');
  await page.waitForTimeout(250);
  const trasHecho = await page.evaluate((k) => ({
    kcal: window.PG.foodTotals(k).kcal,
    vista: window.PG.ui.foodVista,
  }), hoyKCm);
  const racionDeCm = await page.evaluate((id) => window.PG.dishById(id).kcal, otroPlatoCm);
  check('"hecho" apunta una ración de lo cocinado y te devuelve a la portada de Comida',
    trasHecho.kcal === kcalAntesHecho + racionDeCm && trasHecho.vista === '',
    JSON.stringify({ kcalAntesHecho, ...trasHecho, racionDeCm }));

  check('sin errores de JavaScript no capturados durante la sesión', pageErrors.length === 0, JSON.stringify(pageErrors));

  await browser.close();
  server.close();

  const fails = results.filter((r) => !r.pass);
  for (const r of results) {
    console.log((r.pass ? 'PASS' : 'FAIL') + ' — ' + r.name + (r.pass ? '' : '  (' + r.detail + ')'));
  }
  console.log('\n' + (results.length - fails.length) + '/' + results.length + ' pruebas OK');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('la suite ha fallado al ejecutarse:', e); process.exit(1); });
