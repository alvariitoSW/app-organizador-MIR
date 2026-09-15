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
  const DRAWER_TABS = new Set(['food', 'habitos', 'types', 'batches', 'cfg', 'data', 'ajustes']);
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
  await gotoTab('types');
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
  await gotoTab('food');
  await page.waitForTimeout(200);
  await page.evaluate(() => { window.PG.ui.foodPanel = 'scan'; window.PG.render(); });
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
  await gotoTab('food');
  await page.waitForTimeout(150);
  await page.evaluate(() => { window.PG.ui.foodPanel = 'scan'; window.PG.render(); });
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
  await gotoTab('types');
  await page.waitForTimeout(200);
  const pickersClosedByDefault = await page.evaluate(() => document.querySelectorAll('.pick').length);
  await page.click('[data-a="toggle-picker"]');
  await page.waitForTimeout(150);
  const pickersAfterToggle = await page.evaluate(() => document.querySelectorAll('.pick').length);
  check('el picker de comidas/platos empieza plegado y se abre al tocarlo',
    pickersClosedByDefault === 0 && pickersAfterToggle === 1,
    'antes: ' + pickersClosedByDefault + ' después: ' + pickersAfterToggle);

  // 12) simplificación de interfaz: el detalle día a día de "Mes" (repite el calendario) empieza plegado
  await gotoTab('month');
  await page.waitForTimeout(200);
  const monthDetailState = await page.evaluate(() => {
    const d = Array.from(document.querySelectorAll('.dtip')).find((x) => /ver el mes día a día/.test(x.textContent));
    return d ? d.open : null;
  });
  check('el detalle "día a día" de Mes empieza plegado', monthDetailState === false, 'open=' + monthDetailState);

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
  await gotoTab('gym');
  await page.waitForTimeout(200);
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

  // 19) el diagrama de músculos resalta al menos una región para una sesión de prueba
  await page.evaluate((rid) => {
    const g = window.PG.gymS();
    const rt = g.rutinas.find((r) => r.id === rid);
    rt.ejercicios[0].tg = 'pectorals'; // vocabulario típico de la biblioteca -> mapea a "pecho"
    window.PG.render();
  }, ridUI);
  await gotoTab('gym');
  await page.waitForTimeout(200);
  const regionesResaltadas = await page.evaluate(() => document.querySelectorAll('.mreg.on').length);
  check('el diagrama de músculos resalta al menos una región para una sesión de prueba',
    regionesResaltadas >= 1, 'regiones resaltadas: ' + regionesResaltadas);

  // 20) se puede registrar un cardio (natación/carrera/bici/otro) aparte de la fuerza
  await page.selectOption('#cardioTipo', 'carrera');
  await page.fill('#cardioFecha', '2026-09-10');
  await page.fill('#cardioMin', '35');
  await page.fill('#cardioKm', '5.2');
  await page.click('[data-a="cardio-add"]');
  await page.waitForTimeout(200);
  const cardioGuardado = await page.evaluate(() => window.PG.gymS().cardio.some(
    (c) => c.tipo === 'carrera' && c.duracionMin === 35 && c.distanciaKm === 5.2 && c.fecha === '2026-09-10'
  ));
  check('se puede registrar un cardio con tipo, duración y distancia', cardioGuardado);

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
  await page.evaluate(() => { window.PG.ui.foodPanel = 'mano'; window.PG.render(); });
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
  await page.selectOption('#feSel', 'ean:' + altaManual.ean);
  await page.fill('#feG', '200');
  await page.click('[data-a="fe-add"]');
  await page.waitForTimeout(200);
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
  await gotoTab('food');
  await page.waitForTimeout(150);
  const comidaHero = await page.evaluate(() => ({
    ring: !!document.querySelector('#main .ringFill'),
    protBar: !!document.querySelector('#main .protrow'),
    noOldKpis: !document.querySelector('#main .kpis'),
  }));
  check('Comida resume el día con un anillo de kcal y una barra de proteína, sin los cuatro KPI de antes',
    comidaHero.ring && comidaHero.protBar && comidaHero.noOldKpis, JSON.stringify(comidaHero));

  // 37) Comida: escanear / catálogo / a mano / mis productos quedan plegados detrás de un selector
  const panelToggle = await page.evaluate(() => {
    window.PG.ui.foodPanel = '';
    window.PG.render();
    const antes = !!document.getElementById('foodNewNombre');
    window.PG.ui.foodPanel = 'mano';
    window.PG.render();
    const conPanel = !!document.getElementById('foodNewNombre');
    window.PG.ui.foodPanel = '';
    window.PG.render();
    return { antes, conPanel };
  });
  check('en Comida, el formulario "a mano" (y el resto) están plegados hasta que tocas su botón',
    panelToggle.antes === false && panelToggle.conPanel === true, JSON.stringify(panelToggle));

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
  await gotoTab('gym');
  await page.waitForTimeout(150);
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
  await gotoTab('food');
  await page.waitForTimeout(150);
  await page.evaluate(() => { window.PG.ui.foodPanel = 'scan'; window.PG.render(); });
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
  const mesConEvento = await page.evaluate(() => !!document.querySelector('#main .devt'));
  check('"Mes" marca con 📅 los días que llevan un evento recurrente', mesConEvento, '');

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

  // 51) "Mes" en móvil: cada casilla es compacta (una línea por dato, sin horario/sueño de más) para
  // que quepa el mes entero sin tener que hacer mucho scroll
  const prevViewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const cellHeight = await page.evaluate(() => {
    const box = document.querySelector('#main .dbox.on') || document.querySelector('#main .dbox');
    return box ? box.getBoundingClientRect().height : null;
  });
  check('"Mes" en móvil: las casillas del calendario son compactas (≤60px de alto)',
    cellHeight != null && cellHeight <= 60, String(cellHeight));
  if (prevViewport) await page.setViewportSize(prevViewport);

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
