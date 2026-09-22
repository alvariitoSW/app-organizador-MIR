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

  // navegación: la barra tiene tres grupos —Calendario (Hoy/Semana/Mes), Entreno y Comer
  // (Hoy/Menú/Cocina/Compra)— y lo que no es de esos tres vive en el menú lateral (☰ Más)
  const CAL_TABS = new Set(['hoy', 'week', 'month']);
  const COMER_TABS = new Set(['food', 'shop', 'types', 'batches', 'import']);
  const DRAWER_TABS = new Set(['notas', 'habitos', 'dinero', 'eventos', 'estudio', 'cfg', 'data', 'ajustes']);
  // «Turno y rotación», «Ajustes» y «Datos» son ahora portada + una pantalla por tarea, igual que
  // Comer: para llegar a una tarjeta hay que abrir su puerta. El segundo argumento es esa puerta.
  const PUERTA = { cfg: 'cfg-vista', ajustes: 'aju-vista', data: 'datos-vista' };
  async function gotoTab(tab, vista) {
    // el cajón, si se quedó abierto, tapa TODA la pantalla con su scrim y cualquier clic siguiente
    // se queda esperando 30 s a un botón que está debajo. Cerrarlo antes hace la suite determinista.
    await page.evaluate(() => {
      // un modal abierto (o el cajón) tapa la pantalla entera con su scrim: cualquier clic de
      // navegación se queda esperando 30 s a un botón que está debajo
      const ov = document.getElementById('overlay');
      if (ov && ov.classList.contains('on')) {
        const c = document.querySelector('#modal [data-a="m-cancel"]');
        if (c) c.click(); else ov.classList.remove('on');
      }
      const d = document.getElementById('drawer');
      if (d && d.classList.contains('on')) {
        const c = document.querySelector('[data-a="drawer-close"]');
        if (c) c.click();
      }
    });
    await page.waitForTimeout(300);   /* el cajón tiene transición: sin esperarla, el botón de dentro nunca está «estable» */
    if (CAL_TABS.has(tab)) {
      await page.click('[data-a="nav-cal"]');
      await page.waitForTimeout(80);
      await page.click(`#calModes button[data-t="${tab}"]`);
    } else if (COMER_TABS.has(tab)) {
      // se entra por «Comer» y de ahí a su modo; los que no tienen modo propio (import) se piden
      // por la vista que los contiene
      await page.click('[data-a="nav-comer"]');
      await page.waitForTimeout(100);
      if (tab === 'types') await page.click('#calModes button[data-t="types"]');
      else if (tab === 'shop') await page.click('#calModes button[data-t="shop"]');
      else if (tab === 'batches') {
        await page.click('#calModes button[data-v="cocina-panel"]');
        await page.waitForTimeout(100);
        await page.click('[data-a="cocina-tab"][data-t="lote"]');
      } else if (tab === 'import') {
        await page.evaluate(() => { window.PG.ui.tab = 'import'; window.PG.render(); });
      }
    } else if (DRAWER_TABS.has(tab)) {
      await page.click('[data-a="drawer-toggle"]');
      await page.waitForTimeout(260);
      await page.click(`[data-a="drawer-nav"][data-t="${tab}"]`);
    } else {
      await page.click(`[data-a="tab"][data-t="${tab}"]`);
    }
    await page.waitForTimeout(150);
    if (vista && PUERTA[tab]) {
      const sel = `[data-a="${PUERTA[tab]}"][data-v="${vista}"]`;
      const b = await page.$(sel);
      // si la puerta no está, que CAIGA la prueba que la pidió en vez de tumbar la suite entera
      // con un timeout de 30 s buscando un botón que ya no existe
      if (!b) { check(`la puerta «${tab} → ${vista}» existe`, false, sel); return; }
      await b.click();
      await page.waitForTimeout(200);
    }
  }

  // «Días y menús» es ahora el modo «Menú» de Comer: lista de tipos de día + una pantalla por
  // sección. El catálogo de platos se fundió con «Mis platos», que vive en Comer.
  async function gotoTypes(vista) {
    if (vista === 'dishes') {
      await gotoFood('platos');
      return;
    }
    await gotoTab('types');
    await page.waitForTimeout(120);
    if (await page.evaluate(() => !!window.PG.ui.typesVista)) {
      await page.click('.subcab [data-a="types-vista"][data-v=""]');
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
    // Comida se reorganizó alrededor del buscador: «apuntar» ya no es una vista con cuatro modos,
    // sino el buscador, y escanear / a mano / mis productos cuelgan de él.
    if (vista === 'add') {
      await page.click('[data-a="food-vista"][data-v="buscar"]');
      await page.waitForTimeout(150);
      if (modo && modo !== 'buscar') {
        const sel = modo === 'productos'
          ? '[data-a="food-vista"][data-v="productos"]'
          : `[data-a="food-panel2"][data-k="${modo}"]`;
        await page.click(sel);
        await page.waitForTimeout(150);
      }
      return;
    }
    // «Qué cocino», «Mi nevera» e «Ideas» ya no son tres pantallas: son las tres pestañas de Cocina
    if (vista === 'cocinar' || vista === 'nevera' || vista === 'ideas') {
      await page.click('[data-a="food-vista"][data-v="cocina-panel"]');
      await page.waitForTimeout(150);
      await page.click(`[data-a="cocina-tab"][data-t="${vista === 'nevera' ? 'nevera' : ''}"]`);
      await page.waitForTimeout(150);
      return;
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

  // 0pre) en una instalación nueva, antes de nada, la app pregunta cuatro cosas y queda montada a
  // tu nombre. Antes abría con el planning de ejemplo —«Pollo al curry», la semana «1 guardia ·
  // repartida»— presentado como si ya fuera tuyo, y hacerla tuya era encontrar «Datos → importar»
  // o editar 126 campos. Esta prueba también es la que deja la suite en un estado normal: sin
  // saltarlo, TODO lo de abajo arrancaría dentro del asistente.
  {
    const primera = await page.evaluate(() => ({
      asistente: /montarla a tu nombre/.test(document.getElementById('main').innerText),
      sinBarra: document.getElementById('tabs').innerHTML.trim() === '',
    }));
    check('en una instalación nueva la app se presenta y se monta a tu nombre',
      primera.asistente && primera.sinBarra, JSON.stringify(primera));

    // si el asistente no está, conducirlo daría un timeout de 30 s y tumbaría la suite entera en
    // vez de dejar un FAIL con su motivo: se avisa y se sigue
    if (!(await page.$('#arrJEntra'))) {
      check('el asistente se puede rellenar', false, 'no hay campos que rellenar');
      await page.evaluate(() => { window.PG.store.meta.montada = true; window.PG.ui.arranque = null;
        window.PG.save(); window.PG.render(); });
      await page.waitForTimeout(200);
    } else {
    // se conduce entero, que es como lo vive el usuario
    await page.fill('#arrJEntra', '08:30');
    await page.fill('#arrJSale', '16:00');
    await page.click('[data-a="arr-paso"][data-p="1"]');
    await page.waitForTimeout(180);
    await page.fill('#arrGMes', '5');
    await page.click('[data-a="arr-paso"][data-p="2"]');
    await page.waitForTimeout(180);
    await page.fill('#arrDespierta', '07:15');
    await page.click('[data-a="arr-paso"][data-p="3"]');
    await page.waitForTimeout(180);
    await page.click('[data-a="arr-paso"][data-p="4"]');
    await page.waitForTimeout(220);
    await page.click('[data-a="arr-fin"]');
    await page.waitForTimeout(300);
    const montada = await page.evaluate(() => {
      const S = window.PG.store, t = S.shifts.filter((x) => x.id === 'sh-t')[0];
      return { trabajo: t.start + '-' + t.end, jornada: (S.rotation.jornada || {}).from,
        gMes: S.rotation.guardiasMes, wake: S.rhythm['sh-t'].wake, montada: S.meta.montada,
        tab: window.PG.ui.tab };
    });
    check('lo que contestas en el asistente queda puesto de verdad en el planning',
      montada.trabajo === '08:30-16:00' && montada.jornada === '08:30' && montada.gMes === 5 &&
      montada.wake === '07:15' && montada.montada === true && montada.tab === 'hoy',
      JSON.stringify(montada));

    await page.reload();
    await page.waitForTimeout(400);
    check('al volver a abrirla el asistente no vuelve a salir',
      !(await page.evaluate(() => /montarla a tu nombre/.test(document.getElementById('main').innerText))), '');

    // y quien ya tenía sus datos no lo ve nunca, ni aunque le falte la marca
    await page.evaluate(() => { window.PG.store.meta.montada = false; window.PG.save(); });
    await page.reload();
    await page.waitForTimeout(400);
    check('con datos ya guardados no sale el asistente aunque falte la marca',
      !(await page.evaluate(() => /montarla a tu nombre/.test(document.getElementById('main').innerText))), '');
    await page.evaluate(() => { window.PG.store.meta.montada = true; window.PG.save(); });
    }
  }

  // 0) al abrir la app lo que quieres saber es qué tienes HOY, no planificar el mes: arranca en
  // «Hoy», que es donde están el turno, lo que toca entrenar, las tareas, lo que hay que pagar y
  // las comidas del día. El mes sigue a un toque.
  const defaultTab = await page.evaluate(() => window.PG.ui.tab);
  const arranque = await page.evaluate(() => ({
    hoyVisible: /Hoy ·/.test(document.getElementById('main').textContent),
    franja: !!document.querySelector('#main .tl-bar'),
    mesAUnToque: !!document.querySelector('#calModes button[data-t="month"]'),
  }));
  check('la app arranca en «Hoy», con el día a la vista y el mes a un toque',
    defaultTab === 'hoy' && arranque.hoyVisible && arranque.franja && arranque.mesAUnToque,
    'tab=' + defaultTab + ' ' + JSON.stringify(arranque));

  // 0b) la barra son tres grupos: Calendario, Entreno y Comer. Comer se comió a Compra, a Comida,
  // a Días y menús, a Cocina en lote y a Importar receta, que eran cinco destinos para la misma
  // pregunta; lo que queda en el cajón es lo que no es ni calendario ni entreno ni comida.
  const navShape = await page.evaluate(() => ({
    barra: [...document.querySelectorAll('#tabs button')].map((b) => b.textContent.replace(/\s+/g, ' ').trim()),
    modos: (() => { document.querySelector('[data-a="nav-comer"]').click();
      return [...document.querySelectorAll('#calModes button')].map((b) => b.textContent.trim()); })(),
    cajon: [...document.querySelectorAll('#drawer [data-a="drawer-nav"]')].map((b) => b.dataset.t),
  }));
  check('la barra son tres grupos y «Comer» agrupa el día, el menú, la cocina y la compra',
    navShape.barra.join('|') === 'Calendario|Entreno|Comer|☰ Más' &&
    navShape.modos.join('|') === 'Hoy|Menú|Cocina|Compra' &&
    ['food', 'shop', 'types', 'batches', 'import'].every((t) => navShape.cajon.indexOf(t) < 0),
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
  await gotoTab('data', 'copia');
  await page.waitForTimeout(200);
  await page.fill('#importBox', JSON.stringify({ shifts: [], menu: {}, dishes: [] }));
  await page.click('[data-a="import"]');
  await page.waitForTimeout(200);
  const importAsksConfirm = await page.evaluate(() => document.getElementById('overlay').classList.contains('on'));
  check('importar JSON abre un diálogo de confirmación', importAsksConfirm);
  await page.click('[data-a="m-cancel"]');
  await page.waitForTimeout(150);

  // 5b) subir un .ics con el selector de archivo lo lee y lo analiza solo (sin copiar/pegar a mano)
  // las tres tarjetas de Google (para fuera, para dentro y los avisos) están fundidas en una sola
  // pantalla, en Ajustes → Calendario, en vez de repartidas entre Ajustes y Datos
  await gotoTab('ajustes', 'calendario');
  await page.waitForTimeout(200);
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

  // 16) el punto de aviso de "☰ Más" existía porque Comida vivía escondida en el cajón: avisaba de
  // que había comida apuntada sin revisar. Ahora Comer está en la barra con sus kcal a la vista,
  // así que el punto sobra — y con él, la etiqueta que había que ponerle para que fuera accesible.
  const masInfo = await page.evaluate(() => {
    const b = document.querySelector('[data-a="drawer-toggle"]');
    return { label: b.getAttribute('aria-label'), punto: !!b.querySelector('.tb'),
      comerEnBarra: !!document.querySelector('#tabs [data-a="nav-comer"]') };
  });
  check('el punto de aviso de "☰ Más" se va con Comida: ya no está escondida, está en la barra',
    masInfo.label === 'Más' && !masInfo.punto && masInfo.comerEnBarra, JSON.stringify(masInfo));

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
    window.PG.ui.foodVista = 'productos';
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
  await gotoFood('add', 'buscar');
  await page.fill('#fbQ', 'Lentejas de la abuela');
  await page.waitForTimeout(350);
  await page.click(`[data-a="food-abrir"][data-v="ean:${altaManual.ean}"]`);
  await page.waitForTimeout(200);
  await page.click('[data-a="food-cant-set"][data-n="200"]');
  await page.waitForTimeout(150);
  await page.click('[data-a="food-apuntar"]');
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

  // 30) los campos sueltos que antes estaban amontonados en una sola pantalla de Ajustes siguen
  // existiendo, cada uno donde le toca: el salto de guardia y el cupo con las rotaciones, la
  // latencia con el resto del sueño, el aviso de copia con las copias, y los minutos de aviso con
  // el calendario. Si uno se pierde al mover una tarjeta, esta prueba lo canta.
  const campoEn = async (tab, vista, sel) => {
    await gotoTab(tab, vista);
    await page.waitForTimeout(180);
    return page.evaluate((q) => !!document.querySelector('#main ' + q), sel);
  };
  const ajustesUI = {
    saltoFrom:    await campoEn('cfg', 'rotacion', '[data-a="salto-from"]'),
    saltoTo:      await campoEn('cfg', 'rotacion', '[data-a="salto-to"]'),
    guardDefault: await campoEn('cfg', 'rotacion', '[data-a="guard-default"]'),
    latencia:     await campoEn('cfg', 'horas',    '[data-a="sueno-f"][data-k="latencia"]'),
    backup:       await campoEn('data', 'copia',   '[data-a="backup-aviso-d"]'),
    icsMin:       await campoEn('ajustes', 'calendario', '[data-a="ics-aviso-min"]'),
    temaBrand:    await campoEn('ajustes', 'aspecto',    '[data-a="tema-f"][data-k="brand"]'),
    weekStart:    await campoEn('ajustes', 'aspecto',    '[data-a="cal-weekstart"]'),
    enDrawer:     await page.evaluate(() => !!document.querySelector('[data-a="drawer-nav"][data-t="ajustes"]')),
  };
  check('los campos de Ajustes siguen todos ahí, cada uno en la pantalla que le toca',
    Object.values(ajustesUI).every(Boolean), JSON.stringify(ajustesUI));

  // 30b) y Ajustes ya no es un cajón de 13 tarjetas: es una portada que cabe en una pantalla
  await gotoTab('ajustes');
  await page.waitForTimeout(200);
  const portadaAjustes = await page.evaluate(() => ({
    alto: document.getElementById('main').scrollHeight,
    puertas: document.querySelectorAll('#main [data-a="aju-vista"]').length,
  }));
  check('la portada de Ajustes cabe en una pantalla y es una puerta por tarea',
    portadaAjustes.alto < 1100 && portadaAjustes.puertas >= 5, JSON.stringify(portadaAjustes));

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

  // 36) Comida: el resumen del día es un anillo de kcal + los tres macros (no cuatro KPI sueltos).
  // Antes solo había barra de proteína; desde la app de nutrición van proteína, carbohidrato y grasa.
  await gotoFood('');
  await page.waitForTimeout(150);
  const comidaHero = await page.evaluate(() => ({
    ring: !!document.querySelector('#main .ringFill'),
    macros: document.querySelectorAll('#main .macros .macro').length,
    etiquetas: [...document.querySelectorAll('#main .macros .mt span')].map(x => x.textContent.trim()),
    noOldKpis: !document.querySelector('#main .kpis'),
  }));
  check('Comida resume el día con un anillo de kcal y los tres macros, sin los cuatro KPI de antes',
    comidaHero.ring && comidaHero.macros === 3 && comidaHero.noOldKpis &&
    comidaHero.etiquetas.join('|') === 'proteína|carbohidratos|grasa', JSON.stringify(comidaHero));

  // 37) Comida: escanear / a mano / mis productos ya no viven en la portada, sino como modos de
  // «apuntar comida»; la portada no enseña ninguno de sus formularios
  const portadaLimpia = await page.evaluate(() => ({
    sinMano: !document.getElementById('foodNewNombre'),
    sinEscaner: !document.getElementById('scanBox'),
    conBotonApuntar: !!document.querySelector('#main .buscaz[data-a="food-vista"][data-v="buscar"]'),
  }));
  await gotoFood('add', 'mano');
  const modoMano = await page.evaluate(() => !!document.getElementById('foodNewNombre'));
  await gotoFood('');
  check('en Comida, los formularios de añadir cuelgan del buscador, no de la portada',
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
  await gotoTab('cfg', 'horas');
  await page.waitForTimeout(150);
  const suenoAjustes = await page.evaluate(() => ({
    claves: Array.from(document.querySelectorAll('#main input[data-a="sueno-f"]')).map((i) => i.dataset.k),
  }));
  check('en Ajustes, el mínimo de horas de sueño se puede editar junto al resto de números de sueño',
    suenoAjustes.claves.includes('min') && suenoAjustes.claves.includes('latencia'), JSON.stringify(suenoAjustes));

  // 45) Los eventos ya no son la tarjeta 4 de 13 dentro de Ajustes: son su propia sección en el
  // cajón, con una pantalla por evento. Se crea uno semanal (título, hora, color, días), se apaga
  // sin borrarlo y se borra.
  await gotoTab('eventos');
  await page.waitForTimeout(200);
  const hayLista = await page.evaluate(() => /Lo que viene/.test(document.getElementById('main').innerText));
  check('«Eventos» es una sección propia con su lista', hayLista, '');

  await page.click('[data-a="ev-nuevo"][data-modo="semanal"]');
  await page.waitForTimeout(250);
  await page.fill('#evTitulo', 'Fisioterapia de prueba');
  await page.fill('#evHora', '19:30');
  await page.click('[data-a="ev-dia"][data-day="1"]');
  await page.click('[data-a="ev-guardar"]');
  await page.waitForTimeout(250);
  const evCreado = await page.evaluate(() => {
    const list = window.PG.eventosS();
    return { n: list.length, titulo: list[0] && list[0].titulo, dow: list[0] && list[0].dow, on: list[0] && list[0].on };
  });
  check('Eventos: se puede crear un evento semanal recurrente (título, hora y día)',
    evCreado.n === 1 && evCreado.titulo === 'Fisioterapia de prueba' && evCreado.dow.includes(1) && evCreado.on === true,
    JSON.stringify(evCreado));

  // 45a) la hora de fin: antes un evento solo tenía hora de empezar, el .ics le ponía 60 minutos
  // fijos a todo y la franja del día lo pintaba como un punto durase lo que durase
  await page.click('[data-a="ev-abrir"]');
  await page.waitForTimeout(250);
  await page.click('[data-a="ev-dura"][data-min="90"]');
  await page.waitForTimeout(120);
  const finPuesto = await page.inputValue('#evFin');
  check('el atajo de «1 h 30» rellena la hora de fin a partir de la de empezar', finPuesto === '21:00', finPuesto);
  const tituloIntacto = await page.inputValue('#evTitulo');
  check('el atajo de duración no desmonta el formulario a medio rellenar',
    tituloIntacto === 'Fisioterapia de prueba', tituloIntacto);
  await page.click('[data-a="ev-guardar"]');
  await page.waitForTimeout(250);
  const conFin = await page.evaluate(() => {
    const P = window.PG;
    // el viaje de ida y vuelta por normalize() es el que importa: ese map DESCARTA todo campo que
    // no esté en su lista, así que un campo nuevo que no se dé de alta ahí se pierde al recargar
    // sin dar ningún error. Leer ev.fin justo después de guardarlo no prueba nada.
    const copia = JSON.parse(JSON.stringify(P.store));
    P.store = copia;
    const ev = P.eventosS()[0];
    return { fin: ev.fin, dura: P.evDura(ev), txt: P.evHoraTxt(ev),
      lista: document.getElementById('main').innerText };
  });
  check('la hora de fin sobrevive a normalize() (el map que descarta los campos que no lista)',
    conFin.fin === '21:00' && conFin.dura === 90 && conFin.txt === '19:30 – 21:00', JSON.stringify(conFin));
  check('la lista dice de cuándo a cuándo es, y cuánto dura',
    /19:30 – 21:00/.test(conFin.lista) && /1 h 30/.test(conFin.lista), conFin.lista.slice(0, 160));

  // guardar ya devuelve a la lista, así que aquí no hay botón de volver que pulsar
  await page.evaluate(() => { window.PG.eventosS()[0].on = false; window.PG.save(); window.PG.render(); });
  await page.waitForTimeout(200);
  const evApagado = await page.evaluate(() => window.PG.eventosS()[0].on);
  check('un evento se puede dejar apagado sin borrarlo', evApagado === false, String(evApagado));
  await page.evaluate(() => { window.PG.eventosS()[0].on = true; window.PG.save(); });

  await gotoTab('eventos');
  await page.waitForTimeout(200);
  await page.click('[data-a="ev-abrir"]');
  await page.waitForTimeout(250);
  await page.click('[data-a="ev-del"]');
  await page.waitForTimeout(250);
  await page.click('[data-a="confirm-yes"]');
  await page.waitForTimeout(300);
  const evTrasBorrar = await page.evaluate(() => window.PG.eventosS().length);
  check('un evento se puede borrar', evTrasBorrar === 0, String(evTrasBorrar));

  // 45b) un evento puntual: una fecha suelta, con recordatorio y cuenta atrás
  await gotoTab('eventos');
  await page.waitForTimeout(200);
  await page.click('[data-a="ev-nuevo"]');
  await page.waitForTimeout(250);
  const soloFecha = await page.evaluate(() => ({
    hayFecha: !!document.getElementById('evFecha'),
    hayDias: !!document.querySelector('[data-a="ev-dia"]'),
  }));
  check('«un día en concreto» enseña un selector de fecha, y no los días de la semana',
    soloFecha.hayFecha && !soloFecha.hayDias, JSON.stringify(soloFecha));

  const enDiez = await page.evaluate(() => {
    const d = new Date(); d.setDate(d.getDate() + 10);
    const x = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return x.toISOString().slice(0, 10);
  });
  await page.fill('#evTitulo', 'Presentación de prueba');
  await page.fill('#evFecha', enDiez);
  await page.check('#evRec');
  await page.check('#evCuenta');
  await page.click('[data-a="ev-guardar"]');
  await page.waitForTimeout(250);
  const puntualCreado = await page.evaluate(() => {
    const ev = window.PG.eventosS()[0];
    return ev && { titulo: ev.titulo, modo: ev.modo, fecha: ev.fecha, recordatorio: ev.recordatorio, cuentaAtras: ev.cuentaAtras };
  });
  check('se puede crear un evento puntual en una fecha concreta, con recordatorio y cuenta atrás',
    puntualCreado && puntualCreado.titulo === 'Presentación de prueba' && puntualCreado.modo === 'fecha' &&
    puntualCreado.fecha === enDiez && puntualCreado.recordatorio === true && puntualCreado.cuentaAtras === true,
    JSON.stringify(puntualCreado));

  const listaEventos = await page.evaluate(() => document.getElementById('main').innerText);
  check('el evento puntual sale en «Lo que viene» con su cuenta atrás',
    /Presentación de prueba/.test(listaEventos) && /faltan 10 días/.test(listaEventos), listaEventos.slice(0, 200));

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
  // el nombre ya no se escribe dentro de la casilla —53 px daban «Entreno c»— sino que el día
  // queda marcado con un punto de su color, y el nombre entero vive en la lista de eventos del mes
  const mesConEvento = await page.evaluate(() => ({
    marcado: [...document.querySelectorAll('#main .dbox .dpt')].some((l) => /Entreno con Marta/.test(l.title)),
    sinTextoRecortado: !/Entreno con/.test(document.querySelector('#main .cal').innerText),
  }));
  check('"Mes" marca el día del evento con su color, sin recortar el nombre en la casilla',
    mesConEvento.marcado && mesConEvento.sinTextoRecortado, JSON.stringify(mesConEvento));

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
  await gotoTab('ajustes', 'aspecto');
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
  await gotoTab('cfg', 'dias');
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
  await gotoTab('ajustes', 'aspecto');
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

  // los colores que eliges en Ajustes tienen que verse en la franja de "Hoy".
  // Se cambian los seis, no solo el de "trabajo": qué categorías salen depende del día que sea hoy
  // (en un día de guardia no hay ni un tramo de trabajo que pintar), y esta prueba no puede depender
  // de la fecha en la que se ejecute.
  const PALETA = { sleep: '#ff00aa', work: '#00ff88', guard: '#0088ff', meal: '#ffaa00', gym: '#aa00ff', evt: '#00ffff' };
  await page.evaluate((pal) => {
    Object.keys(pal).forEach((k) => {
      const i = document.querySelector(`#main input[data-a="franja-color"][data-k="${k}"]`);
      if (!i) return;
      i.value = pal[k];
      i.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }, PALETA);
  await page.waitForTimeout(250);
  await gotoTab('hoy');
  await page.waitForTimeout(200);
  const franjaHoy = await page.evaluate(() => [...document.querySelectorAll('#main .tl-seg')]
    .map((s) => ({ t: s.title, bg: getComputedStyle(s).backgroundColor })));
  const aRgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
  const elegidos = Object.values(PALETA).map(aRgb);
  check('los colores que eliges en Ajustes se aplican a la franja de "Hoy"',
    franjaHoy.length >= 2 && franjaHoy.every((s) => elegidos.indexOf(s.bg) >= 0),
    JSON.stringify(franjaHoy));

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
  // suyas, y desde cada lista se ve qué platos salen con ella. La compra vive dentro de «Comer»,
  // agrupada por secciones, y «Mis listas» está detrás de su botón: en el supermercado lo que
  // quieres ver es la lista, no la pantalla de administrarlas.
  await gotoTab('shop');
  await page.waitForTimeout(250);
  const compra = await page.evaluate(() => ({
    carro: /Para el carro/.test(document.getElementById('main').textContent),
    secciones: [...document.querySelectorAll('#main .seccion b')].map((x) => x.textContent),
    rutina: [...document.querySelectorAll('#main .linea')].some((l) => /Pechuga de pollo/.test(l.textContent)),
    // esto SÍ es progreso: cuántas cosas llevas ya en el carro
    progreso: !!document.querySelector('#main .prog .bar i'),
    sinListasAqui: !document.querySelector('#main .tarj[data-lista]'),
    aListas: !!document.querySelector('[data-a="compra-listas"]'),
  }));
  check('Compra: ya no hay "Para el carro"; va por secciones, con barra de lo marcado y «mis listas» aparte',
    !compra.carro && compra.secciones.length >= 2 && compra.progreso &&
    compra.sinListasAqui && compra.aListas, JSON.stringify(compra));

  // el "·" de la nota solo sale si de verdad hay nota (antes se veía "25 g curry ·" a secas)
  const puntoSuelto = await page.evaluate(() =>
    [...document.querySelectorAll('#main .linea .tx')].some((s) => /·\s*$/.test(s.textContent)));
  check('ninguna línea de la compra acaba en un "·" suelto sin nota detrás', !puntoSuelto, '');

  await page.click('[data-a="compra-listas"]');
  await page.waitForTimeout(250);
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

  // marcarla "de rutina" la mete en la compra de la semana; desmarcarla la saca. Se comprueba
  // volviendo a la lista de verdad y abriendo la sección «de rutina», que viene plegada.
  const enLaCompra = async () => {
    await page.click('[data-a="compra-volver"]');
    await page.waitForTimeout(250);
    const abierta = await page.evaluate(() => !!document.querySelector('#main [data-a="compra-sec"][data-k="rutina"][aria-expanded="true"]'));
    if (!abierta && await page.$('[data-a="compra-sec"][data-k="rutina"]')) {
      await page.click('[data-a="compra-sec"][data-k="rutina"]');
      await page.waitForTimeout(200);
    }
    const hay = await page.evaluate(() =>
      [...document.querySelectorAll('#main .linea')].some((l) => /Cerveza sin alcohol/.test(l.textContent)));
    await page.click('[data-a="compra-listas"]');
    await page.waitForTimeout(250);
    return hay;
  };
  await page.click(`[data-a="lista-fija"][data-id="${nueva.id}"]`);
  await page.waitForTimeout(250);
  const enCompra = await enLaCompra();
  await page.click(`[data-a="lista-fija"][data-id="${nueva.id}"]`);
  await page.waitForTimeout(250);
  const fueraDeCompra = await enLaCompra();
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

  await gotoTab('cfg', 'rotacion');
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

  // «ver el año repartido» está con las rotaciones, que ya no viven en Ajustes sino en Turno
  await gotoTab('cfg', 'rotacion');
  await page.waitForTimeout(250);
  await page.click('#main [data-a="ir-servicios"]');
  await page.waitForTimeout(350);
  const aServicios = await page.evaluate(() => {
    const c = document.querySelector('#main .card[data-cfg="servicios"]');
    return { tab: window.PG.ui.tab, marcada: !!c && /brand/.test(c.style.outline) };
  });
  check('desde las rotaciones, "ver el año repartido" lleva a la tira del mes',
    aServicios.tab === 'month' && aServicios.marcada, JSON.stringify(aServicios));

  // cambiar la duración de una rotación es un <select>: se dispara con "change", no con un clic
  await gotoTab('cfg', 'rotacion');
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
  await gotoTab('ajustes', 'lector');
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

  // ===================== La caja de importar el planning =====================
  {
    // El usuario escribió ahí sus sesiones semanales y se topó con «no he encontrado días» y, peor,
    // con «undefined guardia(s)» y «media NaN» en pantalla: count nacía vacío.
    await gotoTab('data', 'planning');
    await page.waitForTimeout(300);
    const TEXTO = 'Todos los martes tengo sesión en umi de 8:00 a 8:30 y todos los jueves ' +
      'tengo sesión general de 8:00 a 8:30 en docencia';
    await page.fill('#pasteBox', TEXTO);
    await page.click('[data-a="draft"]');
    await page.waitForTimeout(500);
    const aviso = await page.evaluate(() => ({
      texto: document.getElementById('draftOut').textContent,
      boton: (() => { const b = document.getElementById('semBtn'); return b && !b.hidden ? b.textContent : ''; })(),
    }));
    check('un texto que no es un cuadrante no saca «undefined» ni «NaN», explica qué esperaba',
      !/undefined|NaN/.test(aviso.texto) && /No he reconocido ning[úu]n d[íi]a/.test(aviso.texto) &&
      /1 ago/.test(aviso.texto), aviso.texto.slice(0, 120));
    check('reconoce que son sesiones semanales y ofrece crearlas como eventos',
      /se repiten cada semana/.test(aviso.texto) && /los martes/.test(aviso.texto) &&
      !/martess/.test(aviso.texto) && /crear 2 eventos semanales/.test(aviso.boton),
      JSON.stringify({ boton: aviso.boton }));

    await page.evaluate(() => { window.PG.eventosS().length = 0; window.PG.save(); });
    await page.click('[data-a="draft-semanales"]');
    await page.waitForTimeout(500);
    const creados = await page.evaluate(() => window.PG.eventosS()
      .map((e) => ({ t: e.titulo, dow: (e.dow || []).join(''), h: e.hora, modo: e.modo })));
    check('el botón crea los eventos semanales con su día y su hora',
      creados.length === 2 && creados[0].dow === '2' && creados[0].h === '08:00' &&
      creados[0].modo === 'semanal' && /umi/i.test(creados[0].t) && creados[1].dow === '4',
      JSON.stringify(creados));

    // y darle dos veces no los duplica
    await page.fill('#pasteBox', TEXTO);
    await page.click('[data-a="draft"]');
    await page.waitForTimeout(400);
    await page.click('[data-a="draft-semanales"]');
    await page.waitForTimeout(500);
    check('darle otra vez no duplica los eventos',
      (await page.evaluate(() => window.PG.eventosS().length)) === 2, '');

    await page.evaluate(() => { window.PG.eventosS().length = 0; window.PG.save(); });
  }

  // ===================== Varios periodos de vacaciones =====================
  {
    // Varios periodos SIEMPRE se pudieron: store.rotation.vacaciones es una lista. Lo que fallaba
    // era encontrarlo: la tarjeta iba la 4ª de 4, a 1.846 px —dos pantallas de scroll—, escrita en
    // singular («marca el rango», «marcar»), y el camino natural desde el calendario (tocar el día
    // → 🏖️ Vacaciones) marca UN día suelto, no un periodo. Parecía que solo cabía uno.
    await page.setViewportSize({ width: 412, height: 915 });

    await gotoTab('month');
    await page.click('[data-a="mon-today"]');
    await page.waitForTimeout(300);
    const y = new Date().getFullYear(), m = new Date().getMonth();
    const clave = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    await page.evaluate(() => { window.PG.store.rotation.vacaciones = []; window.PG.save(); window.PG.render(); });
    await page.evaluate((r) => { window.PG.addVacation(r[0], r[1], 'Semana Santa'); }, [clave(new Date(y, m, 3)), clave(new Date(y, m, 7))]);
    await page.evaluate((r) => { window.PG.addVacation(r[0], r[1], 'verano'); }, [clave(new Date(y, m, 18)), clave(new Date(y, m, 27))]);
    await page.waitForTimeout(300);

    const dos = await page.evaluate(() => {
      const c = document.querySelector('.card[data-cfg="vac"]');
      const cards = [...document.querySelectorAll('#main .card')];
      return {
        guardados: window.PG.store.rotation.vacaciones.length,
        filas: c ? c.querySelectorAll('[data-a="vac-del"]').length : 0,
        diasEnElCalendario: [...document.querySelectorAll('.dbox')].filter((x) => /Vacacion/.test(x.innerText)).length,
        enPlural: c ? /todos los periodos que quieras/i.test(c.innerText) : false,
        cuenta: c ? /2 periodos/.test(c.innerText) : false,
        posicion: c ? cards.indexOf(c) + 1 : 0,
        total: cards.length,
      };
    });
    check('se pueden apuntar varios periodos de vacaciones, y la tarjeta lo dice en plural',
      dos.guardados === 2 && dos.filas === 2 && dos.diasEnElCalendario === 15 &&
      dos.enPlural && dos.cuenta && dos.posicion < dos.total, JSON.stringify(dos));

    // y el camino corto: marcar un periodo desde el día que estás mirando, sin bajar a la tarjeta
    const desde = clave(new Date(y, m, 12)), hasta = clave(new Date(y, m, 16));
    await page.evaluate((k) => { window.PG.ui.monSel = k; window.PG.ui.diaEditor = true; window.PG.render(); }, desde);
    await page.waitForTimeout(400);
    await page.fill('#vacHasta-' + desde, hasta);
    await page.click('[data-a="vac-desde"]');
    await page.waitForTimeout(400);
    const tercero = await page.evaluate(() => window.PG.store.rotation.vacaciones.map((v) => v.start + '→' + v.end));
    check('desde el panel de un día se marca un periodo entero, no solo ese día',
      tercero.length === 3 && tercero[2] === desde + '→' + hasta, JSON.stringify(tercero));

    // quitar uno deja los otros en pie
    await page.evaluate(() => { window.PG.ui.monSel = ''; window.PG.render(); });
    await page.waitForTimeout(300);
    await page.click('.card[data-cfg="vac"] [data-a="vac-del"]');
    await page.waitForTimeout(300);
    // con más de un periodo, quitar pregunta por el diálogo propio de la app: hay que contestarlo,
    // o su capa se queda encima y se come los clics de todo lo que venga después
    await page.click('#modal [data-a="confirm-yes"]');
    await page.waitForTimeout(400);
    const trasQuitar = await page.evaluate(() => window.PG.store.rotation.vacaciones.map((v) => v.label || v.start));
    check('quitar un periodo no se lleva por delante los demás',
      trasQuitar.length === 2 && trasQuitar[0] === 'verano', JSON.stringify(trasQuitar));

    await page.evaluate(() => { window.PG.store.rotation.vacaciones = []; window.PG.save(); });
    await page.setViewportSize({ width: 390, height: 844 });
  }

  // ===================== Meter cosas en un día concreto =====================
  {
    // «un botón para elegir un día y cambiar o meter cosas, y que se queden guardados»: antes había
    // que adivinar que la casilla del calendario se podía tocar, y no había dónde escribir nada
    await page.setViewportSize({ width: 412, height: 915 });
    await gotoTab('month');
    await page.click('[data-a="mon-today"]');
    await page.waitForTimeout(300);
    await page.click('[data-a="dia-editar"]');
    await page.waitForTimeout(400);
    const abierto = await page.evaluate(() => ({
      dia: window.PG.ui.monSel,
      panel: !!document.querySelector('.daydetail'),
      editorDesplegado: !!document.querySelector('.daydetail details[open]'),
    }));
    const hoyKeyDia = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
    check('el botón «editar un día» elige el día de hoy y abre su editor ya desplegado',
      abierto.dia === hoyKeyDia && abierto.panel && abierto.editorDesplegado, JSON.stringify(abierto));

    // el día ya no tiene UNA nota en un textarea: tiene las notas de la libreta que caen en él.
    // «+ nota para este día» crea una y la abre para escribirla.
    const panelNotas = await page.evaluate(() => ({
      titulo: [...document.querySelectorAll('.daydetail h2')].map((h) => h.textContent.trim())
        .find((t) => /Notas de este día/.test(t)) || '',
      botonAdd: !!document.querySelector('[data-a="nota-add-dia"]'),
      textareaViejo: !!document.querySelector('[id^="notaDia-"]'),
    }));
    check('el día enseña sus notas de la libreta, no un único campo de texto',
      /Notas de este día/.test(panelNotas.titulo) && panelNotas.botonAdd && !panelNotas.textareaViejo,
      JSON.stringify(panelNotas));

    await page.click('[data-a="nota-add-dia"]');
    await page.waitForTimeout(400);
    await page.fill('#ntTxt', 'Llevar el informe de la sesión');
    await page.waitForTimeout(300);
    await page.reload();
    await page.waitForTimeout(700);
    await gotoTab('month');
    await page.click('[data-a="mon-today"]');
    await page.waitForTimeout(300);
    const notaTrasRecargar = await page.evaluate((k) => ({
      enDisco: window.PG.notasDeFecha(k).map((x) => x.txt),
      enLaCasilla: document.querySelectorAll('.dnota').length,
    }), hoyKeyDia);
    check('una nota de un día se guarda al escribirla, sobrevive a recargar y se ve en su casilla',
      notaTrasRecargar.enDisco.join('|') === 'Llevar el informe de la sesión' && notaTrasRecargar.enLaCasilla === 1,
      JSON.stringify(notaTrasRecargar));

    // y un evento se crea desde el propio día, sin ir a otra pestaña a escribir la fecha a mano
    await page.click('[data-a="dia-editar"]');
    await page.waitForTimeout(400);
    await page.fill('#evDia-' + hoyKeyDia, 'Sesión clínica');
    await page.fill('#evDiaH-' + hoyKeyDia, '08:30');
    await page.click('[data-a="dia-ev-add"]');
    await page.waitForTimeout(500);
    const evDesdeElDia = await page.evaluate((k) => ({
      creados: window.PG.eventosS().filter((e) => e.fecha === k).map((e) => e.titulo + ' ' + e.hora),
      enLaAgenda: document.querySelectorAll('.agrow').length,
    }), hoyKeyDia);
    check('un evento se crea desde el día y aparece en la agenda del mes',
      evDesdeElDia.creados.length === 1 && evDesdeElDia.creados[0] === 'Sesión clínica 08:30' &&
      evDesdeElDia.enLaAgenda >= 1, JSON.stringify(evDesdeElDia));

    // marcar una nota como hecha no la borra en el momento: aguanta dos días por si te arrepientes
    const hechaYPurga = await page.evaluate((k) => {
      const P = window.PG;
      const x = P.notasDeFecha(k)[0];
      P.toggleNotaHecha(x.id);
      const recien = P.purgaNotas();
      x.hecha = Date.now() - 3 * 86400000;
      const vieja = P.purgaNotas();
      return { marcada: !!x.hecha, recien, vieja, quedan: P.notasDeFecha(k).length };
    }, hoyKeyDia);
    check('una nota hecha aguanta 2 días y luego se borra sola',
      hechaYPurga.recien === 0 && hechaYPurga.vieja === 1 && hechaYPurga.quedan === 0,
      JSON.stringify(hechaYPurga));

    await page.evaluate(() => {
      window.PG.eventosS().length = 0;
      window.PG.store.notasDia = {};
      window.PG.store.notas.length = 0;
      window.PG.ui.monSel = '';
      window.PG.save();
    });
    await page.setViewportSize({ width: 390, height: 844 });
  }

  // ===================== El muñeco de la rutina =====================
  {
    // Los músculos salían SOLO de los campos de la biblioteca de openGym, y addRutina los rellena
    // únicamente si el nombre coincide EXACTO con ella, que está en inglés. Escribiendo «Dominadas»
    // el muñeco no se pintaba nunca: tres ejercicios en la tabla y debajo «añade ejercicios».
    await gotoGym('rutinas');
    await page.waitForTimeout(200);
    const traduce = await page.evaluate(() => {
      const r = (n) => [...window.PG.regionesDeNombre(n)].sort().join(',');
      return {
        dominadas: r('Dominadas'),
        pressMilitar: r('Press militar'),
        sentadilla: r('Sentadilla'),
        // «curl» a secas es de bíceps, pero «curl femoral» es de isquios: comparten palabra
        curlBiceps: r('Curl de bíceps'),
        curlFemoral: r('Curl femoral'),
        // con \b dentro de la expresión regular, que es justo lo que se corrompió al escribirlo
        remo: r('Remo con barra'),
        fondos: r('Fondos'),
        // el cardio no tiene grupo muscular y no pasa nada
        bici: r('Bicicleta estática'),
      };
    });
    check('los nombres en español se traducen a músculos sin depender de la biblioteca',
      traduce.dominadas === 'biceps,espalda' &&
      traduce.pressMilitar === 'hombros,triceps' &&
      traduce.sentadilla === 'core,cuadriceps,gluteos' &&
      traduce.curlBiceps === 'biceps' && traduce.curlFemoral === 'isquiotibiales' &&
      traduce.remo === 'biceps,espalda' && traduce.fondos === 'pecho,triceps' &&
      traduce.bici === '', JSON.stringify(traduce));

    // la secuencia de verdad: creo la rutina del usuario, añado los tres y miro el muñeco
    const munieco = await page.evaluate(() => {
      const g = window.PG.gymS();
      g.rutinas.length = 0;
      g.rutinas.push({ id: 'rt-mun', nombre: 'Rutina 1', notas: '', ejercicios: [] });
      ['Dominadas', 'Press militar', 'Sentadilla'].forEach((n) => window.PG.addRutina('rt-mun', n, {}));
      window.PG.ui.gymPanel = 'rutinas';
      window.PG.render();
      const leyenda = document.querySelector('.mlegend');
      return {
        pintadas: document.querySelectorAll('.mreg.on').length,
        leyenda: leyenda ? leyenda.innerText : '',
        sinTraducir: window.PG.ejerciciosSinMusculo('rt-mun').length,
      };
    });
    check('añadir ejercicios a mano pinta el muñeco y dice qué trabaja y qué no',
      munieco.pintadas > 0 && munieco.sinTraducir === 0 &&
      /Espalda/.test(munieco.leyenda) && /Sin tocar/i.test(munieco.leyenda) &&
      /Pecho/.test(munieco.leyenda) && !/añade ejercicios/i.test(munieco.leyenda),
      JSON.stringify(munieco));

    // un ejercicio inventado no se traduce: se dice, en vez de dejar el muñeco a medias sin explicar
    const raro = await page.evaluate(() => {
      window.PG.addRutina('rt-mun', 'Chuchurrío lateral', {});
      window.PG.render();
      return {
        sinTraducir: window.PG.ejerciciosSinMusculo('rt-mun'),
        loDice: /No sé qué músculos trabaja/.test(document.querySelector('.mlegend').innerText),
      };
    });
    check('un ejercicio que no se sabe traducir se avisa, no se calla',
      raro.sinTraducir.length === 1 && raro.loDice, JSON.stringify(raro));

    await page.evaluate(() => { window.PG.gymS().rutinas.length = 0; window.PG.save(); });
  }

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
        enCasilla: document.querySelectorAll('.dpt').length,
        filas: c ? c.querySelectorAll('.agrow').length : 0,
        nombreEntero: c ? /Congreso SEMES/.test(c.innerText) : false,
      };
    });
    check('los eventos del mes salen marcados en su casilla y listados enteros debajo',
      agenda.enCasilla >= 2 && agenda.filas === 2 && agenda.nombreEntero, JSON.stringify(agenda));

    // Con el título del evento dentro de la casilla se leía «Llegar a», «Vuelo de»: la casilla mide
    // 53 px de ancho, ahí caben ocho caracteres. Y cada evento gastaba una línea entera, así que con
    // cuatro la casilla reventaba. Un punto por evento cabe siempre y el nombre está en la lista.
    const aprieto = await page.evaluate(() => {
      const y = new Date().getFullYear(), m = new Date().getMonth();
      const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const dia = iso(new Date(y, m, 9));
      const ev = window.PG.eventosS();
      ev.length = 0;
      for (let i = 0; i < 10; i++) {
        ev.push({ id: 'ap' + i, titulo: 'Un evento de título larguísimo ' + i, hora: '0' + (i % 10) + ':00',
          modo: 'fecha', fecha: dia, dow: [], color: '#38e1ff', on: true });
      }
      window.PG.store.notas.push({ id: 'nt-lleno', txt: 'una nota que tampoco cabría', fecha: dia, hecha: 0, color: '', evId: '', ts: Date.now() });
      window.PG.save();
      window.PG.render();
      const celda = [...document.querySelectorAll('.dbox')].find((x) => x.querySelector('.dpt'));
      const alto = [...celda.children].reduce((a, h) => a + h.getBoundingClientRect().height, 0);
      return {
        anchoCelda: Math.round(celda.getBoundingClientRect().width),
        altoCelda: Math.round(celda.getBoundingClientRect().height),
        contenido: Math.round(alto),
        puntos: celda.querySelectorAll('.dpt').length,
        masN: (celda.querySelector('.dmas') || {}).textContent || '',
        nota: !!celda.querySelector('.dnota'),
        desborda: celda.scrollHeight > celda.clientHeight,
        // nada de texto de evento recortado dentro de la casilla
        sinTituloRecortado: !/Un evento de/.test(celda.innerText),
      };
    });
    check('con diez eventos en un día, la casilla los marca sin desbordarse ni recortar títulos',
      aprieto.puntos === 6 && aprieto.masN === '+4' && aprieto.nota &&
      !aprieto.desborda && aprieto.contenido < aprieto.altoCelda && aprieto.sinTituloRecortado,
      JSON.stringify(aprieto));

    // y «VAC»/«UMI» ya no se parten letra a letra en una columna de 12 px
    const etiquetas = await page.evaluate(() => {
      const y = new Date().getFullYear(), m = new Date().getMonth();
      const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const g = window.PG.store.shifts.filter((x) => window.PG.isGuardia(x))[0];
      window.PG.store.rotation.daySet[iso(new Date(y, m, 14))] = { shift: g.id, guard: 'umi' };
      window.PG.save();
      window.PG.render();
      const f = document.querySelector('.dline.gflag');
      if (!f) return { hay: false };
      const r = f.getBoundingClientRect();
      return { hay: true, texto: f.textContent, alto: Math.round(r.height), ancho: Math.round(r.width) };
    });
    check('el tipo de guardia se lee en una línea, no partido en vertical',
      etiquetas.hay && etiquetas.texto === 'UMI' && etiquetas.alto < 20,
      JSON.stringify(etiquetas));

    // se deja el mes como estaba antes de este aprieto: la prueba siguiente cuenta con esos dos
    await page.evaluate(() => {
      const y = new Date().getFullYear(), m = new Date().getMonth();
      const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const ev = window.PG.eventosS();
      ev.length = 0;
      ev.push({ id: 'ev-a', titulo: 'Sesión clínica', hora: '08:00', modo: 'fecha', fecha: iso(new Date(y, m, 9)), color: '#a855f7', dow: [], on: true });
      ev.push({ id: 'ev-b', titulo: 'Congreso SEMES', hora: '09:00', modo: 'fecha', fecha: iso(new Date(y, m, 25)), color: '#38e1ff', dow: [], on: true });
      window.PG.store.notasDia = {};
      window.PG.store.notas.length = 0;
      window.PG.store.rotation.daySet = {};
      window.PG.save();
      window.PG.render();
    });
    await page.waitForTimeout(300);

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
    await gotoTab('data', 'copia');
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

  // 45) la portada de Comida: anillo, cifras (no barras) para lo que no es progreso, la línea de
  // micros, la barra de buscar como acción principal y TRES puertas — ni formulario ni seis fichas
  await gotoFood('');
  const portadaComida = await page.evaluate(() => ({
    ring: !!document.querySelector('#main .ringFill'),
    macros: document.querySelectorAll('#main .macros .macro').length,
    cifras: document.querySelectorAll('#main .dosdatos b').length,
    // "te quedan" y "cocinado hoy" NO pueden ser barras: no son progreso hacia nada
    cifrasSinBarra: !document.querySelector('#main .dosdatos .fbar'),
    semana: document.querySelectorAll('#main .semd').length,
    buscaz: document.querySelectorAll('#main .buscaz').length,
    puertas: document.querySelectorAll('#main .puerta').length,
    micros: document.querySelectorAll('#main .microlinea .pts i').length,
    // los micros ya no ocupan nueve casillas en la portada, y apuntar no vive aquí
    sinCasillasMicro: !document.querySelector('#main .micros .mic'),
    sinFormulario: !document.getElementById('fbQ') && !document.getElementById('foodNewNombre'),
    botones: document.querySelectorAll('#main button').length,
  }));
  check('la portada de Comida es anillo + cifras + micros en una línea + buscar + tres puertas',
    portadaComida.ring && portadaComida.macros === 3 && portadaComida.cifras === 2 &&
    portadaComida.cifrasSinBarra && portadaComida.semana === 7 && portadaComida.buscaz === 1 &&
    portadaComida.puertas === 3 && portadaComida.micros === 9 && portadaComida.sinCasillasMicro &&
    portadaComida.sinFormulario && portadaComida.botones < 35, JSON.stringify(portadaComida));

  // 46) el buscador es LA puerta: sin escribir no hay lista larga, se escribe y sale agrupado por
  // tipo; tocar el nombre abre la hoja de cantidad, se cambia la ración y la toma entra con ella
  await gotoFood('add', 'buscar');
  const buscadorVacio = await page.evaluate(() => ({
    filas: document.querySelectorAll('#main .hit').length,
    grupos: document.querySelectorAll('#main .grp').length,
    campo: !!document.getElementById('fbQ'),
    chips: document.querySelectorAll('#main [data-a="food-tipo"]').length,
  }));
  check('el buscador abre con lo que más apuntas (seis filas), no con la lista entera',
    buscadorVacio.campo && buscadorVacio.filas === 6 && buscadorVacio.grupos === 0 &&
    buscadorVacio.chips === 4, JSON.stringify(buscadorVacio));

  await page.fill('#fbQ', 'tortilla');
  await page.waitForTimeout(350);
  // «tortilla» casa con un producto y con un plato: aquí interesa el PLATO, que se apunta por
  // raciones y no por gramos
  const primerPlatoCm = await page.evaluate(() => {
    const r = Array.prototype.filter.call(document.querySelectorAll('[data-a="food-abrir"]'),
      (x) => x.dataset.v.indexOf('dish:') === 0)[0];
    return r ? r.dataset.v : null;
  });
  const agrupado = await page.evaluate(() => ({
    grupos: Array.prototype.map.call(document.querySelectorAll('#main .grp'), (x) => x.textContent),
    filas: document.querySelectorAll('#main .hit').length,
    foco: document.activeElement.id,
  }));
  check('al escribir, los resultados salen agrupados por tipo y el campo no pierde el foco',
    agrupado.grupos.length >= 2 && agrupado.filas > 0 && agrupado.foco === 'fbQ' && !!primerPlatoCm,
    JSON.stringify(agrupado));

  await page.click(`[data-a="food-abrir"][data-v="${primerPlatoCm}"]`);
  await page.waitForTimeout(250);
  const hojaUna = await page.evaluate(() => ({
    val: (document.getElementById('fcVal') || {}).textContent,
    kcal: (document.querySelector('#fcPrevia b') || {}).textContent,
    raciones: Array.prototype.map.call(document.querySelectorAll('#main .racb'), (x) => x.textContent),
  }));
  await page.click('[data-a="food-cant-set"][data-n="2"]');
  await page.waitForTimeout(200);
  const hojaDos = await page.evaluate(() => ({
    val: (document.getElementById('fcVal') || {}).textContent,
    kcal: (document.querySelector('#fcPrevia b') || {}).textContent,
  }));
  const hoyKCm = new Date().toISOString().slice(0, 10);
  const kcalPreviasCm = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKCm);
  await page.click('[data-a="food-apuntar"]');
  await page.waitForTimeout(250);
  const trasApuntarCm = await page.evaluate((k) => ({
    kcal: window.PG.foodTotals(k).kcal,
    vuelve: window.PG.ui.foodVista,
  }), hoyKCm);
  const unaRacionCm = await page.evaluate((v) => {
    const d = window.PG.dishById(v.slice(5));
    return d ? d.kcal : 0;
  }, primerPlatoCm);
  check('la hoja de cantidad: un plato abre en 1 ración, las raciones cambian la previa y la toma entra con esa cantidad',
    hojaUna.val === '1' && hojaUna.kcal === String(unaRacionCm) && hojaUna.raciones.length === 4 &&
    hojaDos.val === '2' && hojaDos.kcal === String(unaRacionCm * 2) &&
    trasApuntarCm.kcal === kcalPreviasCm + unaRacionCm * 2 && !trasApuntarCm.vuelve,
    JSON.stringify({ hojaUna, hojaDos, kcalPreviasCm, trasApuntarCm, unaRacionCm }));

  // 47) el + de cada fila apunta con la cantidad de siempre sin abrir nada: tres toques desde la
  // portada (buscar → escribir → +), y un plato entra como UNA ración, no como 150 gramos
  await gotoFood('add', 'buscar');
  await page.fill('#fbQ', 'tortilla');
  await page.waitForTimeout(350);
  const kcalAntesRapido = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKCm);
  await page.click(`[data-a="food-rapido"][data-v="${primerPlatoCm}"]`);
  await page.waitForTimeout(250);
  const trasRapido = await page.evaluate((k) => ({
    kcal: window.PG.foodTotals(k).kcal,
    sigueEnElBuscador: window.PG.ui.foodVista === 'buscar' && !!document.getElementById('fbQ'),
  }), hoyKCm);
  check('el + apunta una ración del plato sin salir del buscador (tres toques en total)',
    trasRapido.kcal === kcalAntesRapido + unaRacionCm && trasRapido.sigueEnElBuscador,
    JSON.stringify({ kcalAntesRapido, ...trasRapido, unaRacionCm }));

  // 47b) «mis productos» ya no vuelca los 188 con un campo y tres botones cada uno: ocho filas,
  // un solo campo (el de buscar) y el resto detrás de la búsqueda — pero ★ y × siguen estando
  await gotoFood('add', 'productos');
  // la queja era de altura, así que se mide en el móvil de verdad, no en la ventana de escritorio
  const vpProd = page.viewportSize();
  await page.setViewportSize({ width: 412, height: 915 });
  await page.waitForTimeout(200);
  const productos = await page.evaluate(() => ({
    filas: document.querySelectorAll('#main .hit').length,
    campos: document.querySelectorAll('#main input').length,
    total: +(document.querySelector('#main .subcab .tag') || {}).textContent,
    hayMas: /y \d+ más/.test(document.getElementById('main').innerText),
    fav: document.querySelectorAll('#main [data-a="ean-fav"]').length,
    borrar: document.querySelectorAll('#main [data-a="ean-del"]').length,
    alto: document.getElementById('main').scrollHeight,
  }));
  // y buscar dentro acota de verdad
  await page.fill('#fdQ', 'yogur');
  await page.waitForTimeout(300);
  const filtrado = await page.evaluate(() => ({
    filas: document.querySelectorAll('#main .hit').length,
    todosCasan: Array.prototype.every.call(document.querySelectorAll('#main .hit .nm b'),
      (x) => x.textContent.toLowerCase().includes('yogur')),
    foco: document.activeElement.id,
  }));
  check('«mis productos» son ocho filas y un campo, no la lista entera con 570 botones',
    productos.filas === 8 && productos.campos === 1 && productos.total > 100 && productos.hayMas &&
    productos.fav === 8 && productos.borrar === 8 && productos.alto < 1000 &&
    filtrado.filas > 0 && filtrado.todosCasan && filtrado.foco === 'fdQ',
    JSON.stringify({ productos, filtrado }));
  if (vpProd) await page.setViewportSize(vpProd);
  await page.waitForTimeout(150);

  // 47c) ★ y × siguen funcionando desde la fila (eran lo único que el armario viejo hacía y esta
  // pantalla no podía perder)
  const eanFila = await page.evaluate(() => document.querySelector('#main [data-a="ean-fav"]').dataset.ean);
  await page.click(`#main [data-a="ean-fav"][data-ean="${eanFila}"]`);
  await page.waitForTimeout(200);
  const trasFav = await page.evaluate((e) => window.PG.food().fav.indexOf(e) >= 0, eanFila);
  await page.click(`#main [data-a="ean-fav"][data-ean="${eanFila}"]`);
  await page.waitForTimeout(200);
  const antesDel = await page.evaluate(() => Object.keys(window.PG.food().eans).length);
  await page.click(`#main [data-a="ean-del"][data-ean="${eanFila}"]`);
  await page.waitForTimeout(250);
  const trasDel = await page.evaluate((e) => ({
    n: Object.keys(window.PG.food().eans).length,
    sigue: !!window.PG.food().eans[e],
  }), eanFila);
  check('desde la fila de un producto se marca favorito y se borra, sin volver al armario viejo',
    trasFav && trasDel.n === antesDel - 1 && !trasDel.sigue,
    JSON.stringify({ trasFav, antesDel, trasDel }));

  // 47d) «qué me apetece»: filtra tus platos por ingrediente y por macros aproximados, y el + de
  // cada resultado lo apunta como una ración
  await gotoFood('platos');
  await page.click('[data-a="platos-tab"][data-t="antojo"]');
  await page.waitForTimeout(200);
  const antojoTodos = await page.evaluate(() => document.querySelectorAll('#main .hit').length);
  await page.click('[data-a="antojo-prot"][data-v="alto"]');
  await page.waitForTimeout(200);
  const antojoProt = await page.evaluate(() => ({
    filas: document.querySelectorAll('#main .hit').length,
    // lo que se enseña tiene que cumplir el filtro: 30 g o más por ración
    cumplen: Array.prototype.map.call(document.querySelectorAll('#main .hit .nm span'),
      (x) => parseFloat(String(x.textContent).split('·')[1])),
  }));
  const kcalAntesAntojo = await page.evaluate((k) => window.PG.foodTotals(k).kcal, hoyKCm);
  const platoAntojo = await page.evaluate(() => {
    const b = document.querySelector('#main .hit [data-a="food-rapido"]');
    return b ? b.dataset.v : null;
  });
  if (platoAntojo) {
    await page.click(`#main [data-a="food-rapido"][data-v="${platoAntojo}"]`);
    await page.waitForTimeout(250);
  }
  const trasAntojo = await page.evaluate((v) => ({
    kcal: window.PG.foodTotals(v.k).kcal,
    unaRacion: v.p ? (window.PG.dishById(v.p.slice(5)) || {}).kcal : 0,
  }), { k: hoyKCm, p: platoAntojo });
  await page.click('[data-a="antojo-limpiar"]');
  await page.waitForTimeout(200);
  const antojoLimpio = await page.evaluate(() => document.querySelectorAll('#main .hit').length);
  check('«qué me apetece» filtra tus platos por macros y el + apunta una ración del que elijas',
    antojoTodos > 0 && antojoProt.filas > 0 && antojoProt.filas <= antojoTodos &&
    antojoProt.cumplen.every((p) => p >= 30) && antojoLimpio === antojoTodos &&
    (!platoAntojo || trasAntojo.kcal === kcalAntesAntojo + trasAntojo.unaRacion),
    JSON.stringify({ antojoTodos, antojoProt, antojoLimpio, kcalAntesAntojo, trasAntojo }));

  // 47e) la cadena de la portada: Compra, Menú y Comida eran tres destinos que no se nombraban
  // entre ellos, aunque el código ya los encadenaba (la compra sale de las tandas y las tandas del
  // menú de cada tipo de día). Ahora eso se ve, con sus cifras, y cada eslabón es una puerta.
  {
    await gotoFood('');
    const cadena = await page.evaluate(() => {
      const esl = [...document.querySelectorAll('#main .cadena .eslabon')];
      return {
        n: esl.length,
        titulos: esl.map((e) => e.querySelector('b').textContent),
        // cada eslabón lleva cifras de verdad, no una etiqueta suelta
        cifras: esl.map((e) => [...e.querySelectorAll('em')].map((x) => x.textContent)),
      };
    });
    // y llevan donde dicen, uno por uno, volviendo a la portada entre medias
    const adonde = [];
    for (const cls of ['m', 'c', 'k']) {
      // si la cadena no está, esta prueba tiene que FALLAR, no tumbar la suite entera con un
      // timeout de 30 s que impide ver el resto
      const b = await page.$(`#main .cadena .eslabon.${cls}`);
      if (!b) { adonde.push('(no está)'); continue; }
      await b.click();
      await page.waitForTimeout(280);
      adonde.push(await page.evaluate(() => window.PG.ui.tab + '/' + (window.PG.ui.foodVista || '')));
      await page.click('.subcab [data-a="nav-comer"], .subcab [data-a="food-vista"][data-v=""]');
      await page.waitForTimeout(220);
    }
    check('la portada encadena menú → cocina → compra, con cifras, y cada eslabón lleva a su pantalla',
      cadena.n === 3 && cadena.titulos.join('|') === 'Menú|Cocina|Compra' &&
      cadena.cifras.every((c) => c.length >= 2 && c.every((x) => /\d/.test(x))) &&
      adonde.join('|') === 'types/|food/cocina-panel|shop/',
      JSON.stringify({ cadena, adonde }));
  }

  // 47f) la compra: por secciones, con el origen de cada cosa, y marcar actualiza la barra sin
  // repintar la pantalla (en el supermercado se tocan veinte seguidas). Lo de rutina y los básicos
  // vienen plegados: se repiten cada semana y lo que miras es lo fresco.
  {
    await gotoTab('shop');
    await page.waitForTimeout(250);
    const antes = await page.evaluate(() => ({
      secciones: [...document.querySelectorAll('#main .seccion')].map((x) =>
        x.querySelector('b').textContent + ':' + x.getAttribute('aria-expanded')),
      lineas: document.querySelectorAll('#main .linea').length,
      conOrigen: document.querySelectorAll('#main .linea .de').length,
      barra: document.querySelector('#main .prog .bar i').style.width,
      texto: document.querySelector('#main .prog b').textContent,
    }));
    const primera = await page.evaluate(() => document.querySelector('#main .linea').dataset.id);
    await page.click('#main .linea');
    await page.waitForTimeout(200);
    const despues = await page.evaluate((id) => ({
      marcada: document.querySelector('.linea[data-id="' + CSS.escape(id) + '"]').classList.contains('ok'),
      enElAlmacen: window.PG.ui.marks.has(id),
      texto: document.querySelector('#main .prog b').textContent,
      barra: document.querySelector('#main .prog .bar i').style.width,
    }), primera);
    // y la sección plegada se abre al tocarla
    await page.click('[data-a="compra-sec"][data-k="rutina"]');
    await page.waitForTimeout(200);
    const abierta = await page.evaluate(() =>
      document.querySelector('[data-a="compra-sec"][data-k="rutina"]').getAttribute('aria-expanded'));
    check('la compra va por secciones, dice de dónde sale cada cosa y marcar mueve la barra al instante',
      antes.secciones[0].indexOf('Fresco') === 0 && /:true$/.test(antes.secciones[0]) &&
      antes.secciones.slice(1).every((x) => /:false$/.test(x)) &&
      antes.conOrigen > 0 && despues.marcada && despues.enElAlmacen &&
      despues.texto !== antes.texto && despues.barra !== antes.barra && abierta === 'true',
      JSON.stringify({ antes, despues, abierta }));
  }

  // 47f-bis) la compra tiene que salir del MENÚ ENTERO, no solo de las tandas. Fallo real: un plato
  // que está en el menú de un tipo de día pero no está asignado a una sesión de cocina no aportaba
  // NI UN ingrediente a la lista, y sin ningún aviso — te ibas al supermercado con la lista
  // incompleta. El único parche era un `staplesFor()` que rescataba cosas por nombre con la
  // expresión regular /whey|prote/ o /Caf|fruta/: si tu desayuno no se llamaba así, no entraba.
  // Se encadena de verdad: se mira la lista, se mete el plato desde el menú y se vuelve a mirar.
  {
    await gotoTab('shop');
    await page.waitForTimeout(250);
    const antesC = await page.evaluate(() => ({
      lineas: document.querySelectorAll('#main .linea').length,
      txt: document.getElementById('main').textContent,
    }));
    // un plato de verdad, con ingredientes inconfundibles y SIN sesión de cocina
    await page.evaluate(() => {
      const P = window.PG;
      const shId = P.weekDays().map((d) => d.shiftId).filter(Boolean)[0];
      P.store.dishes.push({ id: 'd-tost', name: 'Tostada de aguacate', icon: '🥑', portions: 2,
        kcal: 300, prot: 8, batchId: '', ingredients: ['2 rebanadas pan de centeno', '1 aguacate hass'] });
      const sl = P.slotsFor(shId)[0];
      sl.mealId = ''; sl.items = [{ kind: 'dish', id: 'd-tost', portions: 1 }];
      P.save();
    });
    await gotoTab('shop');
    await page.waitForTimeout(300);
    const despuesC = await page.evaluate(() => {
      const lin = [...document.querySelectorAll('#main .linea')];
      const suyas = lin.filter((l) => /aguacate|centeno/i.test(l.textContent))
        .map((l) => l.textContent.replace(/\s+/g, ' ').trim());
      return {
        lineas: lin.length,
        suyas,
        // y cada línea de lo fresco dice de dónde sale, que antes se quedaba en blanco cuando
        // venía de una sola receta (las de rutina solo nombran la lista si tienes más de una)
        fresco: [...document.querySelectorAll('#main .lcompra')][0].querySelectorAll('.linea').length,
        frescoConOrigen: [...document.querySelectorAll('#main .lcompra')][0].querySelectorAll('.linea .de').length,
        // lo que se cuenta por piezas sube a pieza entera: «0,5 aguacate» no se compra
        sinMediasPiezas: !suyas.some((t) => /^0[.,]\d+\s+\D/.test(t)),
      };
    });
    // y el plato del que no hay receta escrita (un café, una fruta) también tiene que salir
    await page.evaluate(() => {
      const P = window.PG;
      const shId = P.weekDays().map((d) => d.shiftId).filter(Boolean)[0];
      const d = P.store.dishes.find((x) => x.id === 'd-tost');
      d.ingredients = [];
      d.name = 'Yogur griego del súper';
      P.save();
    });
    await gotoTab('shop');
    await page.waitForTimeout(300);
    const sinReceta = await page.evaluate(() => {
      const sec = [...document.querySelectorAll('#main .seccion')].find((x) => /sin receta/i.test(x.textContent));
      if (sec && sec.getAttribute('aria-expanded') === 'false') sec.click();
      return new Promise((r) => setTimeout(() => r({
        haySeccion: !!sec,
        sale: [...document.querySelectorAll('#main .linea')]
          .some((l) => /Yogur griego del súper/.test(l.textContent)),
      }), 120));
    });
    check('la compra sale del menú entero: un plato sin tanda también pide sus ingredientes',
      despuesC.suyas.length === 2 && despuesC.lineas === antesC.lineas + 2 &&
      !/aguacate/i.test(antesC.txt) && despuesC.frescoConOrigen === despuesC.fresco &&
      despuesC.sinMediasPiezas && sinReceta.haySeccion && sinReceta.sale,
      JSON.stringify({ antes: antesC.lineas, despuesC, sinReceta }));
  }

  // 47g) el menú de un tipo de día no se sale de la pantalla. Fallo real medido antes del rediseño:
  // 415 px de ancho en un móvil de 412, porque hora, etiqueta, selector, kcal, tres botones y los
  // platos iban en una sola fila de tabla. Ahora cada toma es una tarjeta.
  {
    const vpMenu = page.viewportSize();
    await page.setViewportSize({ width: 412, height: 915 });
    // el desborde solo salía con un nombre largo de verdad: sin esto, la medida del ancho pasa
    // igual con la fila-tabla de antes y la prueba no valdría para nada
    const primerTipoM = await page.evaluate(() => {
      const P = window.PG, sh = P.store.shifts[0];
      const d = P.store.dishes[0];
      d.name = 'Lentejas estofadas de la abuela con chorizo y morcilla';
      const sl = P.slotsFor(sh.id)[0];
      if (sl) { sl.mealId = ''; sl.items = [{ id: d.id, portions: 1 }]; }
      P.save();
      return sh.id;
    });
    await gotoTypes(primerTipoM);
    await page.waitForTimeout(250);
    const menuDia = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      tomas: document.querySelectorAll('#main .toma2').length,
      // lo que hacía falta seguir teniendo: hora, etiqueta, comida armada y los platos
      campos: document.querySelectorAll('#main .toma2 .st, #main .toma2 .sl').length,
      armadas: document.querySelectorAll('#main .toma2 .sm').length,
      sinFilaTabla: !document.querySelector('#main li.slot'),
    }));
    if (vpMenu) await page.setViewportSize(vpMenu);
    await page.waitForTimeout(150);
    check('el menú de un día son tarjetas por toma y ya no se sale de la pantalla a lo ancho',
      menuDia.scrollWidth <= menuDia.clientWidth && menuDia.tomas > 0 && menuDia.sinFilaTabla &&
      menuDia.campos === menuDia.tomas * 2 && menuDia.armadas === menuDia.tomas,
      JSON.stringify(menuDia));
  }

  // 47h) «Cocina en lote» era una pantalla aparte de casi seis pantallas de móvil porque repetía
  // los pasos de cada plato de cada sesión. Ahora es la pestaña «En lote» de Cocina, con las
  // sesiones plegadas, y los pasos se siguen en el modo cocina, que es donde se cocina.
  {
    await gotoFood('cocinar');
    await page.waitForTimeout(150);
    await page.click('[data-a="cocina-tab"][data-t="lote"]');
    await page.waitForTimeout(250);
    const lote = await page.evaluate(() => ({
      sesiones: document.querySelectorAll('#main .tanda').length,
      abiertas: document.querySelectorAll('#main .tanda .tb').length,
      // ya no es un enlace a otra pantalla: los platos están aquí
      cocinar: document.querySelectorAll('#main .tanda [data-a="food-cocina"]').length,
      sinEnlaceFuera: !document.querySelector('#main [data-a="tab"][data-t="batches"]'),
      alto: document.getElementById('main').scrollHeight,
    }));
    // y la pestaña vieja lleva al mismo sitio en vez de a la pantalla de antes
    const laVieja = await page.evaluate(() => {
      window.PG.ui.tab = 'batches'; window.PG.render();
      return { tab: window.PG.ui.tab, vista: window.PG.ui.foodVista, pest: window.PG.ui.cocinaTab };
    });
    check('las tandas viven dentro de Cocina, con una sesión abierta y sin duplicar la pantalla vieja',
      lote.sesiones > 0 && lote.abiertas === 1 && lote.cocinar > 0 && lote.sinEnlaceFuera &&
      lote.alto < 2400 && laVieja.tab === 'food' && laVieja.vista === 'cocina-panel' && laVieja.pest === 'lote',
      JSON.stringify({ lote, laVieja }));
  }

  // 47i) un solo catálogo de platos: «Catálogo de platos» y «Mis platos» pintaban los mismos
  // store.dishes en dos pantallas, cada una con su buscador y sus botones de crear e importar
  {
    const unoSolo = await page.evaluate(() => {
      const P = window.PG;
      P.ui.tab = 'types'; P.ui.typesVista = 'dishes'; P.render();
      return { tab: P.ui.tab, vista: P.ui.foodVista,
        platos: document.querySelectorAll('#main .hit').length,
        enElAlmacen: P.store.dishes.length,
        buscadores: document.querySelectorAll('#main .buscador input').length };
    });
    check('el catálogo de platos y «mis platos» son la misma pantalla, con un solo buscador',
      unoSolo.tab === 'food' && unoSolo.vista === 'platos' && unoSolo.buscadores === 1 &&
      unoSolo.platos > 0 && unoSolo.platos <= unoSolo.enElAlmacen, JSON.stringify(unoSolo));
  }

  // 48) "qué puedo cocinar": separa lo que sale entero de lo que casi, y "a la compra" mete lo que
  // falta en una lista de verdad (secuencia: se mira la lista antes y después del toque)
  await gotoFood('cocinar');
  const platosQueSalen = await page.evaluate(() => ({
    listos: document.querySelectorAll('#main .idea [data-a="food-cocina"]').length,
    total: document.querySelectorAll('#main .idea').length,
    aLaCompra: document.querySelectorAll('#main [data-a="cocinar-compra"]').length,
    pestanas: document.querySelectorAll('#main .pestb').length,
  }));
  let compraDeltaCm = null;
  if (platosQueSalen.aLaCompra > 0) {
    const antesCompra = await page.evaluate(() => window.PG.listasS().reduce((a, l) => a + l.items.length, 0));
    await page.click('#main [data-a="cocinar-compra"]');
    await page.waitForTimeout(250);
    const despuesCompra = await page.evaluate(() => window.PG.listasS().reduce((a, l) => a + l.items.length, 0));
    compraDeltaCm = despuesCompra - antesCompra;
  }
  check('"qué hago hoy" separa lo que sale entero de lo que casi (en Cocina, con sus tres pestañas), y "a la compra" apunta lo que falta',
    platosQueSalen.pestanas === 3 &&
    platosQueSalen.total > 0 && platosQueSalen.listos > 0 && platosQueSalen.listos <= platosQueSalen.total &&
    (platosQueSalen.aLaCompra === 0 || compraDeltaCm > 0),
    JSON.stringify({ ...platosQueSalen, compraDeltaCm }));

  // 49) modo cocina: los ingredientes se escalan a las raciones elegidas y en cantidades que se
  // pueden comprar (nada de "933,33 g de patata"), y los pasos se recorren de uno en uno
  await gotoFood('cocinar');
  const platoCocinaCm = await page.evaluate(() => {
    const b = document.querySelector('#main .idea [data-a="food-cocina"]');
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
  await page.click('.subcab [data-a="food-vista"][data-v="cocina-panel"]');
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

  // ===================== la app de nutrición: alimentos, micros, nevera, ideas y platos =====================
  // 55) la tabla de alimentos se busca sin tildes y filtra por grupo
  {
    await gotoFood('alimentos');
    const tabla = await page.evaluate(() => ({
      total: window.PG.alimTodos().length,
      conTilde: window.PG.alimBuscar('plátano', '').map((a) => a.n),
      sinTilde: window.PG.alimBuscar('platano', '').map((a) => a.n),
      soloFruta: window.PG.alimBuscar('', 'fruta').every((a) => a.g === 'fruta'),
      // cada alimento tiene que cuadrar por dentro: kcal ≈ 4·prot + 4·carb + 9·grasa
      descuadres: window.PG.ALIMENTOS.filter((a) => {
        const teo = 4 * (a.pr || 0) + 4 * ((a.ch || 0) - (a.fi || 0)) + 2 * (a.fi || 0) + 9 * (a.gr || 0);
        return Math.abs(a.kcal - teo) > 12 && Math.abs(a.kcal - teo) / Math.max(1, a.kcal) > 0.18;
      }).map((a) => a.n),
    }));
    check('la tabla de alimentos se busca con y sin tildes, filtra por grupo y sus kcal cuadran con sus macros',
      tabla.total >= 80 && tabla.conTilde[0] === 'Plátano' && tabla.sinTilde[0] === 'Plátano' &&
      tabla.soloFruta && tabla.descuadres.length === 0, JSON.stringify(tabla));
  }

  // 56) la ficha: macros, micros sobre la ingesta de referencia y de dónde sale el dato
  {
    await page.evaluate(() => { window.PG.ui.alimSel = 'al-platano'; window.PG.ui.alimG = 100; window.PG.ui.foodVista = 'ficha'; window.PG.render(); });
    await page.waitForTimeout(150);
    const ficha = await page.evaluate(() => ({
      titulo: document.querySelector('#main .subtit').textContent.trim(),
      totales: [...document.querySelectorAll('#main .tot b')].map((x) => x.textContent.trim()),
      micros: document.querySelectorAll('#main .mic').length,
      // el potasio del plátano son 358 mg sobre una referencia de 2000: la barra NO puede ir al 100 %
      potasio: (() => {
        const t = [...document.querySelectorAll('#main .mic')].find((x) => /potasio/i.test(x.textContent));
        return t ? { txt: t.querySelector('.mv').textContent.trim(), ancho: t.querySelector('.micbar i').style.width } : null;
      })(),
      fuente: (document.querySelector('#main .fuente') || {}).textContent || '',
      sinClaveUsda: !!document.querySelector('#main [data-a="ir-usda"]'),
    }));
    check('la ficha de un alimento da macros, micros sobre la referencia diaria y dice que el dato es aproximado',
      /Plátano/.test(ficha.titulo) && ficha.totales[0] === '89' && ficha.micros >= 5 &&
      ficha.potasio && ficha.potasio.ancho === '18%' && /tabla de la app/.test(ficha.fuente) && ficha.sinClaveUsda,
      JSON.stringify(ficha));
  }

  // 57) apuntar desde la ficha suma micronutrientes al día; un producto de código de barras no los trae
  {
    const hoyMic = isoDate(new Date());
    await page.evaluate((k) => { window.PG.food().log[k] = []; window.PG.save(); }, hoyMic);
    await page.evaluate(() => { window.PG.ui.alimSel = 'al-espinaca'; window.PG.ui.alimG = 100; window.PG.ui.foodVista = 'ficha'; window.PG.render(); });
    await page.waitForTimeout(150);
    await page.click('[data-a="alim-apuntar"]');
    await page.waitForTimeout(250);
    const conMicros = await page.evaluate((k) => ({
      tomas: window.PG.foodLog(k).length,
      mi: window.PG.microTotales(k),
      // «vas corto de» va ordenado del que peor está al que menos: con 100 g de espinaca y nada más,
      // la vitamina D (que la espinaca no tiene) va la primera y el folato (194 de 200 µg) no sale
      cortos: window.PG.microCortos(k),
      pctFolato: window.PG.microPct('fo', window.PG.microTotales(k).fo || 0),
    }), hoyMic);
    check('apuntar un alimento desde su ficha suma sus micronutrientes al día y ordena lo que falta',
      conMicros.tomas === 1 && conMicros.mi.fe > 2 && conMicros.mi.vc > 20 && conMicros.pctFolato > 90 &&
      conMicros.cortos[0] === 'vd' && conMicros.cortos.indexOf('fo') < 0, JSON.stringify(conMicros));
  }

  // 58) el día lleva los tres macros y los micros en UNA línea de nueve puntos (ya no nueve
  // casillas en la portada), y las tres puertas de la app de comida
  {
    await gotoFood('');
    const diaMic = await page.evaluate(() => ({
      macros: [...document.querySelectorAll('#main .macros .mt span')].map((x) => x.textContent.trim()),
      puntos: document.querySelectorAll('#main .microlinea .pts i').length,
      casillas: document.querySelectorAll('#main .micros .mic').length,
      linea: (document.querySelector('#main .microlinea .tx small') || {}).textContent || '',
      puertas: [...document.querySelectorAll('#main .puerta b')].map((x) => x.textContent.trim()),
    }));
    check('la portada del día lleva los tres macros, los micros en una línea y las tres despensas',
      diaMic.macros.join('|') === 'proteína|carbohidratos|grasa' && diaMic.puntos === 9 &&
      diaMic.casillas === 0 && /corto|por debajo|mitad/.test(diaMic.linea) &&
      diaMic.puertas.join('|') === 'Mis platos|Mi nevera|Alimentos', JSON.stringify(diaMic));
  }

  // 59) la línea de micros abre su pantalla, y ahí tocar uno enseña con qué alimentos se cubre
  {
    await page.click('#main .microlinea');
    await page.waitForTimeout(250);
    const pantallaMicros = await page.evaluate(() => ({
      vista: window.PG.ui.foodVista,
      casillas: document.querySelectorAll('#main .micros .mic').length,
      cubrir: document.querySelectorAll('#main .hit [data-a="alim-pick"]').length,
    }));
    await page.click('#main .micros .mic');
    await page.waitForTimeout(200);
    const abierto = await page.evaluate(() => ({
      k: window.PG.ui.microAbierto,
      sugeridos: [...document.querySelectorAll('#main .chips .chipx[data-a="alim-pick"]')].map((x) => x.textContent.trim()),
    }));
    check('la línea de micros abre su pantalla y ahí cada micronutriente propone los alimentos que más lo traen',
      pantallaMicros.vista === 'micros' && pantallaMicros.casillas === 9 && pantallaMicros.cubrir > 0 &&
      !!abierto.k && abierto.sugeridos.length >= 3, JSON.stringify({ pantallaMicros, abierto }));
  }

  // 60) la nevera guarda, e Ideas propone combinaciones de UNA comida, sin repetir alimento
  //     ni proponer guarniciones de ajo (los condimentos no son pieza principal de un plato)
  {
    await page.evaluate(() => {
      const f = window.PG.food();
      f.nevera = ['al-pechuga-de-pollo', 'al-huevo', 'al-arroz-blanco', 'al-lenteja', 'al-brocoli',
        'al-cebolla', 'al-ajo', 'al-aceite-de-oliva'];
      f.objetivo = { kcal: 2400, prot: 150, carb: 0, gresa: 0 };
      window.PG.save();
    });
    await gotoFood('nevera');
    const nev = await page.evaluate(() => document.querySelectorAll('#main .chipx .x').length);
    await gotoFood('ideas');
    const ideas = await page.evaluate(() => (window.PG.ui.ideasCache || []).map((c) => ({
      nombre: c.nombre,
      kcal: c.t.kcal,
      ids: c.partes.map((p) => p.a.id),
      // ningún plato puede llevar 150 g de ajo o de cebolla como guarnición
      condimentoGrande: c.partes.some((p) => window.PG.esCondimento(p.a) && p.g > 20),
      repetido: new Set(c.partes.map((p) => p.a.id)).size !== c.partes.length,
    })));
    check('la nevera alimenta Ideas: combinaciones de una comida, sin repetir alimento ni servir 150 g de ajo',
      nev === 8 && ideas.length === 3 &&
      ideas.every((i) => i.kcal >= 350 && i.kcal <= 950) &&
      ideas.every((i) => !i.condimentoGrande && !i.repetido), JSON.stringify({ nev, ideas }));
  }

  // 61) «apuntarlo ya» mete la combinación entera en el día, ingrediente a ingrediente
  {
    const hoyIdea = isoDate(new Date());
    const antesIdea = await page.evaluate((k) => window.PG.foodLog(k).length, hoyIdea);
    const piezas = await page.evaluate(() => window.PG.ui.ideasCache[0].partes.length);
    await page.click('#main [data-a="idea-apuntar"]');
    await page.waitForTimeout(300);
    const trasIdea = await page.evaluate((k) => ({
      tomas: window.PG.foodLog(k).length,
      conMicros: window.PG.foodLog(k).filter((x) => x.mi && Object.keys(x.mi).length).length,
    }), hoyIdea);
    check('«apuntarlo ya» apunta la combinación entera, cada ingrediente con sus micros',
      trasIdea.tomas === antesIdea + piezas && trasIdea.conMicros >= piezas,
      JSON.stringify({ antesIdea, piezas, ...trasIdea }));
  }

  // 62) crear un plato con ingredientes: la nutrición se calcula sola, sin teclear ni un número
  {
    await gotoFood('ideas');
    await page.evaluate(() => { window.PG.ui.plato = window.PG.platoVacio(); window.PG.ui.platoQ = ''; window.PG.ui.foodVista = 'plato'; window.PG.render(); });
    await page.waitForTimeout(150);
    for (const ing of ['pechuga de pollo', 'arroz blanco', 'brocoli', 'aceite de oliva']) {
      await page.fill('#plQ', ing);
      await page.waitForTimeout(320);
      await page.click('#main .alim');
      await page.waitForTimeout(220);
    }
    // el aceite NO puede entrar con 100 g por defecto: un plato no lleva 100 g de aceite
    const puesto = await page.evaluate(() => window.PG.ui.plato.alims.map((x) => x.id + ':' + x.g));
    await page.click('#plName');
    await page.keyboard.type('Pollo con arroz y brócoli');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    const antesPl = await page.evaluate(() => window.PG.store.dishes.length);
    await page.click('[data-a="plato-guardar"]');
    await page.waitForTimeout(300);
    const platoNuevo = await page.evaluate(() => {
      const d = window.PG.store.dishes[window.PG.store.dishes.length - 1];
      return { n: window.PG.store.dishes.length, name: d.name, kcal: d.kcal, prot: d.prot, ing: d.ingredients, alims: (d.alims || []).length };
    });
    check('un plato creado con ingredientes sale con sus kcal y su proteína por ración, sin teclear números',
      puesto.indexOf('al-aceite-de-oliva:10') >= 0 && platoNuevo.n === antesPl + 1 &&
      platoNuevo.name === 'Pollo con arroz y brócoli' && platoNuevo.kcal > 150 && platoNuevo.kcal < 600 &&
      platoNuevo.prot > 15 && platoNuevo.alims === 4 && platoNuevo.ing.length === 4,
      JSON.stringify({ puesto, antesPl, ...platoNuevo }));
  }

  // 63) un alimento tuyo se guarda y manda sobre la tabla; sin micros, no cuenta en la tarjeta de micros
  {
    const guardado = await page.evaluate(() => {
      const r = window.PG.addAlimPropio({ n: 'Lentejas de mi madre', e: '🍲', g: 'legumbre', kcal: 120, pr: 8, ch: 16, gr: 2 });
      const a = window.PG.alimById(r.id);
      return { ok: r.ok, id: r.id, fuente: a && a.fuente, micros: window.PG.ALIM_MICROS.filter((k) => typeof a[k] === 'number') };
    });
    const sinDatos = await page.evaluate(() => window.PG.addAlimPropio({ n: 'Algo', kcal: 0, pr: 0 }));
    check('un alimento tuyo se guarda como tuyo y sin kcal ni proteína no se guarda a medias',
      guardado.ok && guardado.fuente === 'tuyo' && guardado.micros.length === 0 && !sinDatos.ok,
      JSON.stringify({ guardado, sinDatos }));
  }

  // 64) sin clave de USDA la app lo dice: no finge que el valor aproximado es oficial
  {
    const usda = await page.evaluate(async () => ({
      on: window.PG.usdaOn(),
      intento: await window.PG.usdaBuscar('al-platano'),
      fuenteDelPlatano: window.PG.alimById('al-platano').fuente,
    }));
    check('sin clave de FoodData Central la app lo dice y deja el valor aproximado de la tabla',
      !usda.on && !usda.intento.ok && /clave/.test(usda.intento.msg) && usda.fuenteDelPlatano === 'tabla',
      JSON.stringify(usda));
  }

  // ===================== el sol, la marca de hoy, Semana y Notas =====================
  // 65) el sol se calcula en el móvil y cuadra con la realidad, sin inventarse los casos polares
  {
    const sol = await page.evaluate(() => {
      const P = window.PG;
      // en la zona horaria del SITIO, no en la del ordenador que corre la prueba: horaLocal() usa el
      // reloj del móvil, así que fijar aquí una hora local haría que la prueba dependiese del runner
      const en = (d, tz) => new Intl.DateTimeFormat('es-ES',
        { hour: '2-digit', minute: '2-digit', timeZone: tz, hour12: false }).format(d);
      const lpa = P.SITIOS_FIJOS[0], mad = P.SITIOS_FIJOS[1];
      const a = P.solDe('2026-09-17', lpa), b = P.solDe('2026-09-17', mad);
      const jun = P.solDe('2026-06-21', lpa), dic = P.solDe('2026-12-21', lpa);
      // Tenerife está 0,81° más al oeste que Las Palmas: el sol sale unos minutos más tarde
      const tfe = P.solDe('2026-09-17', { lat: 28.4636, lon: -16.2518 });
      return {
        lpaNombre: lpa.nombre, madNombre: mad.nombre,
        lpaCanarias: en(a.sale, 'Atlantic/Canary') + '-' + en(a.pone, 'Atlantic/Canary'),
        madPeninsula: en(b.sale, 'Europe/Madrid') + '-' + en(b.pone, 'Europe/Madrid'),
        luzJun: jun.luzMin, luzDic: dic.luzMin,
        tfeMasTarde: (tfe.sale - a.sale) / 60000,
        polarVerano: P.solDe('2026-06-21', { lat: 69.65, lon: 18.96 }).polar,
        polarInvierno: P.solDe('2026-12-21', { lat: 69.65, lon: 18.96 }).polar,
        // longitud con el signo bien puesto: al oeste, más tarde en UTC
        madAntesQueBcn: P.solDe('2026-09-17', { lat: 41.3874, lon: 2.1686 }).sale < b.sale,
      };
    });
    check('el sol se calcula en el móvil, cuadra con la realidad y no se inventa los casos polares',
      sol.lpaNombre === 'Las Palmas de Gran Canaria' && sol.madNombre === 'Madrid' &&
      sol.lpaCanarias === '07:47-20:05' && sol.madPeninsula === '07:57-20:21' &&
      sol.luzJun > sol.luzDic && sol.luzJun > 800 && sol.luzDic < 640 &&
      sol.tfeMasTarde >= 2 && sol.tfeMasTarde <= 5 && sol.madAntesQueBcn === true &&
      sol.polarVerano === 'dia' && sol.polarInvierno === 'noche', JSON.stringify(sol));
  }

  // 66) se puede añadir un sitio propio y el sol cambia con él; los dos de fábrica no se borran
  {
    const sitios = await page.evaluate(() => {
      const P = window.PG;
      const antes = P.solTxt('2026-09-17');
      const r = P.addSitio('Valencia', 39.4699, -0.3763);
      const despues = P.solTxt('2026-09-17');
      const mal = P.addSitio('Sitio imposible', 999, 0);
      const fijo = P.delSitio('lpa');
      const quitado = P.delSitio(r.id);
      return { ok: r.ok, antes, despues, cambia: antes !== despues, mal: mal.ok, fijo,
        sitioTrasBorrar: P.sitioActual().id, total: P.sitiosS().length };
    });
    check('puedes añadir sitios tuyos, Las Palmas y Madrid no se borran y una latitud imposible se rechaza',
      sitios.ok && sitios.cambia && !sitios.mal && /no se quitan/.test(sitios.fijo) &&
      sitios.sitioTrasBorrar === 'lpa' && sitios.total === 2, JSON.stringify(sitios));
  }

  // 66b) el arco del sol: el tramo recorrido tiene que ir SOBRE la guía, no por su cuenta.
  // Fallo real, visible en el móvil del usuario a las 19:11: a partir del mediodía el arco llevaba
  // el large-arc-flag a 1, y con ese flag el navegador no dibuja «el mismo arco pero más largo»,
  // sino el arco de la OTRA circunferencia que pasa por esos dos puntos: el trazo se despegaba de
  // la guía, se salía del dibujo por arriba (llegaba a y=-27 en un viewBox que empieza en 0) y
  // aparecía cortado. La suite no lo veía porque se ejecuta de mañana (t < 0,5), que era justo el
  // único tramo del día en el que el dibujo salía bien.
  {
    // el recorrido va sobre la circunferencia de la guía: centro (70,66) y radio 62 del viewBox
    const sobreLaGuia = `(path) => {
      const L = path.getTotalLength();
      let peor = 0;
      for (let i = 0; i <= 24; i++) {
        const p = path.getPointAtLength(L * i / 24);
        const d = Math.hypot(p.x - 70, p.y - 66);
        peor = Math.max(peor, Math.abs(d - 62));
      }
      return +peor.toFixed(2);
    }`;
    // primero, en la pantalla de verdad: se entra en Hoy y se mide lo que hay pintado
    await gotoTab('hoy');
    await page.waitForTimeout(250);
    const enPantalla = await page.evaluate((src) => {
      const mide = new Function('return ' + src)();
      const card = [...document.querySelectorAll('#main .card')].find((c) => /El sol hoy/.test(c.textContent));
      if (!card) return { sinTarjeta: true };
      const rec = card.querySelectorAll('.arco svg path')[1];
      if (!rec) return { sinTrazo: true };
      const b = rec.getBBox();
      return { desvio: mide(rec), arriba: +b.y.toFixed(1), abajo: +(b.y + b.height).toFixed(1) };
    }, sobreLaGuia);
    // y después, sin recargar, el día entero hora a hora: que salga bien depende de la hora a la
    // que se ejecute la suite, y eso es precisamente lo que dejó pasar el fallo
    const elDiaEntero = await page.evaluate((src) => {
      const P = window.PG;
      const mide = new Function('return ' + src)();
      const mk = (hh) => { const d = new Date(); d.setHours(hh, 0, 0, 0); return d; };
      const s = { sale: mk(8), pone: mk(20), polar: '', sinDatos: false };
      const caja = document.createElement('div');
      document.body.appendChild(caja);
      const malas = [];
      let conSol = 0;
      for (let h = 0; h <= 23; h++) {
        caja.innerHTML = P.arcoSolHTML(s, h);
        const rec = caja.querySelectorAll('path')[1];
        if (rec) {
          const b = rec.getBBox();
          const desvio = mide(rec);
          // fuera de la guía, o fuera del propio dibujo (el viewBox es 0 0 140 78)
          if (desvio > 1 || b.y < -0.5 || b.y + b.height > 66.5) {
            malas.push({ h, desvio, arriba: +b.y.toFixed(1), abajo: +(b.y + b.height).toFixed(1) });
          }
        }
        if (caja.querySelector('circle')) conSol++;
      }
      caja.remove();
      return { malas, conSol };
    }, sobreLaGuia);
    check('el arco del sol pinta el recorrido sobre su guía y dentro del dibujo a cualquier hora del día',
      !enPantalla.sinTarjeta && !enPantalla.sinTrazo && enPantalla.desvio <= 1 &&
      enPantalla.arriba >= -0.5 && enPantalla.abajo <= 66.5 &&
      elDiaEntero.malas.length === 0 && elDiaEntero.conSol >= 11,
      JSON.stringify({ enPantalla, elDiaEntero }));
  }

  // 67) Semana: los días van primero y hoy se ve de verdad, no solo un borde
  {
    await gotoTab('week');
    await page.evaluate(() => { window.PG.store.rotation.mode = 'date'; window.PG.save(); window.PG.render(); });
    await page.waitForTimeout(350);
    const sem = await page.evaluate(() => {
      const main = document.querySelector('#main');
      const filas = [...main.querySelectorAll('.drow')];
      const r0 = filas[0] ? filas[0].getBoundingClientRect() : null;
      const hoy = main.querySelector('.drow.today');
      const otra = filas.find((f) => !f.classList.contains('today'));
      return {
        antesDelPrimerDia: r0 ? Math.round(r0.top + window.scrollY - main.getBoundingClientRect().top) : -1,
        kpis: main.querySelectorAll('.tot div').length,
        // la configuración se fue a «Turno y rotación»: aquí ya no está
        sinConfig: !main.querySelector('[data-a="autofill"]') && !main.querySelector('[data-a="rot-anchor"]'),
        irACfg: !!main.querySelector('[data-a="ir-semana-cfg"]'),
        chipHoy: !!(hoy && hoy.querySelector('.hoychip')),
        fondoDistinto: !!(hoy && otra && getComputedStyle(hoy).backgroundColor !== getComputedStyle(otra).backgroundColor),
        sol: main.querySelectorAll('.drsol').length,
        noche: main.querySelectorAll('.tl-noche').length,
      };
    });
    check('Semana empieza por los días, con hoy marcado de verdad y el sol en cada uno',
      sem.antesDelPrimerDia < 60 && sem.kpis === 3 && sem.sinConfig && sem.irACfg &&
      sem.chipHoy && sem.fondoDistinto && sem.sol === 7 && sem.noche >= 7, JSON.stringify(sem));
  }

  // 68) la configuración de la semana vive ahora en «Turno y rotación»
  {
    await page.click('#main [data-a="ir-semana-cfg"]');
    await page.waitForTimeout(600);
    const cfg = await page.evaluate(() => ({
      tab: window.PG.ui.tab,
      tarjeta: !!document.querySelector('#main .card[data-cfg="semana"]'),
      autofill: !!document.querySelector('#main .card[data-cfg="semana"] [data-a="autofill"]'),
    }));
    check('«patrón y rotación» lleva a la tarjeta de configuración en Turno y rotación',
      cfg.tab === 'cfg' && cfg.tarjeta && cfg.autofill, JSON.stringify(cfg));
  }

  // 69) «hoy» se mueve solo al pasar la medianoche con la app abierta
  {
    await gotoTab('hoy');
    const rueda = await page.evaluate(async () => {
      const base = new Date();
      const manana = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, 0, 0, 30).getTime();
      const antes = document.querySelector('#main h2').textContent.trim();
      const OrigDate = Date;
      window.Date = class extends OrigDate {
        constructor(...a) { if (!a.length) super(manana); else super(...a); }
        static now() { return manana; }
      };
      window.dispatchEvent(new Event('focus'));
      await new Promise((r) => setTimeout(r, 300));
      const despues = document.querySelector('#main h2').textContent.trim();
      window.Date = OrigDate;
      return { antes, despues };
    });
    await page.waitForTimeout(200);
    check('con la app abierta, al pasar la medianoche «hoy» pasa solo al día siguiente',
      rueda.antes !== rueda.despues && /Hoy/.test(rueda.despues), JSON.stringify(rueda));
  }

  // 70) Notas: lo que hubiera en notasDia se migra una vez y sin duplicar
  {
    const migra = await page.evaluate((k) => {
      const P = window.PG;
      P.store.notas.length = 0;
      P.store.notasDia = { [k]: 'Llamar a la gestoría' };
      P.save();
      const n1 = P.migraNotasDia();
      const n2 = P.migraNotasDia();
      return { n1, n2, notas: P.notasS().length, viejo: Object.keys(P.store.notasDia).length,
        texto: P.notasS()[0] ? P.notasS()[0].txt : '', fecha: P.notasS()[0] ? P.notasS()[0].fecha : '' };
    }, isoDate(new Date()));
    check('las notas de día que ya tuvieras se migran a la libreta una sola vez',
      migra.n1 === 1 && migra.n2 === 0 && migra.notas === 1 && migra.viejo === 0 &&
      migra.texto === 'Llamar a la gestoría' && migra.fecha === isoDate(new Date()), JSON.stringify(migra));
  }

  // 71) Notas: capturar, filtrar y que lo sin día no ensucie el calendario
  {
    await gotoTab('notas');
    await page.fill('#ntNueva', 'Mirar si el curso de eco está abierto');
    await page.click('[data-a="nota-add"]');
    await page.waitForTimeout(300);
    const libreta = await page.evaluate(() => {
      const P = window.PG, c = P.notasCuenta();
      const m = document.querySelector('#main');
      return { ...c, filas: m.querySelectorAll('.nota').length,
        captura: !!m.querySelector('#ntNueva'),
        filtros: m.querySelectorAll('.chipx').length };
    });
    check('la libreta captura una nota suelta y la separa de las que tienen día',
      libreta.total === 2 && libreta.sinDia === 1 && libreta.conDia === 1 &&
      libreta.filas === 2 && libreta.captura && libreta.filtros === 4, JSON.stringify(libreta));
  }

  // 72) Notas: pasar una al calendario la enlaza, no la duplica
  {
    const alCal = await page.evaluate(() => {
      const P = window.PG;
      P.eventosS().length = 0;
      const x = P.notasS().find((n) => n.fecha);
      const notasAntes = P.notasS().length;
      const r = P.notaAEvento(x.id, { hora: '08:30' });
      const ev = P.eventoDeNota(P.notaById(x.id));
      const sinDia = P.notasS().find((n) => !n.fecha);
      const falla = P.notaAEvento(sinDia.id, {});
      return { ok: r.ok, eventos: P.eventosS().length, notas: P.notasS().length, notasAntes,
        hora: ev && ev.hora, fecha: ev && ev.fecha, enlaceInverso: ev && ev.notaId === x.id,
        sinDiaFalla: !falla.ok && /día/.test(falla.msg) };
    });
    check('pasar una nota al calendario crea el evento y lo enlaza, sin duplicar la nota',
      alCal.ok && alCal.eventos === 1 && alCal.notas === alCal.notasAntes &&
      alCal.hora === '08:30' && alCal.enlaceInverso && alCal.sinDiaFalla, JSON.stringify(alCal));
  }

  // 73) Notas: desenlazar quita el evento pero deja la nota con su día
  {
    const desen = await page.evaluate(() => {
      const P = window.PG;
      const x = P.notasS().find((n) => n.evId);
      const fecha = x.fecha;
      const msg = P.desenlazaNota(x.id);
      const y = P.notaById(x.id);
      return { msg, eventos: P.eventosS().length, sigue: !!y, mantieneDia: y.fecha === fecha, evId: y.evId };
    });
    check('quitar una nota del calendario borra el evento y le deja su día a la nota',
      desen.eventos === 0 && desen.sigue && desen.mantieneDia && !desen.evId, JSON.stringify(desen));
  }

  // 74) Notas: el enlace roto del Mes ya lleva al editor de eventos, que vive en Ajustes
  {
    await page.evaluate(() => {
      window.PG.eventosS().push({ id: 'ev-z', titulo: 'Congreso', modo: 'fecha',
        fecha: window.PG.iso(new Date()), hora: '09:00', color: '#38e1ff', on: true, dow: [] });
      window.PG.save();
    });
    await gotoTab('month');
    await page.waitForTimeout(250);
    const antesDelClic = await page.evaluate(() => !!document.querySelector('#main [data-a="ir-eventos"]'));
    await page.click('#main [data-a="ir-eventos"]');
    await page.waitForTimeout(600);
    const tras = await page.evaluate(() => ({
      tab: window.PG.ui.tab,
      editor: /Lo que viene/.test(document.getElementById('main').innerText),
      puedeAnadir: !!document.querySelector('#main [data-a="ev-nuevo"]'),
    }));
    check('«añadir o quitar eventos» del Mes lleva a la sección Eventos, no a Hábitos',
      antesDelClic && tras.tab === 'eventos' && tras.editor && tras.puedeAnadir,
      JSON.stringify({ antesDelClic, ...tras }));
    await page.evaluate(() => {
      window.PG.eventosS().length = 0;
      window.PG.store.notas.length = 0;
      window.PG.save();
    });
  }

  // ===================== Lo que dura un evento, y los enlaces que se quedaron mudos =====================
  {
    // Antes: el .ics le ponía `dur:60` fijo a TODOS los eventos, así que una presentación de dos
    // horas y media te reservaba una hora en el calendario del móvil; y la franja del día lo
    // pintaba como un punto durase lo que durase.
    await page.evaluate(() => {
      window.PG.eventosS().length = 0;
      window.PG.eventosS().push({ id: 'ev-dura', titulo: 'Presentación en rayos', modo: 'fecha',
        fecha: window.PG.iso(new Date()), hora: '08:30', fin: '11:00', color: '#a78bfa', on: true, dow: [] });
      window.PG.save();
    });
    const elIcs = await page.evaluate(() => {
      const P = window.PG, k = P.iso(new Date());
      const e = P.calEventos(k, k).filter((x) => x.cat === 'EVENTO')[0];
      const lineas = P.icsTexto(k, k, {}).split(/\r?\n/);
      const i = lineas.findIndex((l) => /SUMMARY:📌 Presentación/.test(l));
      const bloque = lineas.slice(Math.max(0, i - 6), i + 1).join('|');
      return { dur: e && e.dur, horaFin: e && e.horaFin, bloque };
    });
    check('el .ics reserva el hueco de verdad y no 60 minutos fijos',
      elIcs.dur === 150 && elIcs.horaFin === '11:00' &&
      /DTSTART:\d{8}T083000/.test(elIcs.bloque) && /DTEND:\d{8}T110000/.test(elIcs.bloque),
      JSON.stringify(elIcs));

    const enLaFranja = await page.evaluate(() => {
      const d = document.createElement('div');
      d.innerHTML = window.PG.timelineBar(window.PG.iso(new Date()));
      const banda = d.querySelector('.tl-seg.evt');
      return { bandas: d.querySelectorAll('.tl-seg.evt').length,
        puntos: d.querySelectorAll('.tl-dot.evt').length,
        ancho: banda ? banda.style.width : '' };
    });
    check('un evento que dura se pinta como banda en la franja del día, no como un punto',
      enLaFranja.bandas === 1 && enLaFranja.puntos === 0 && parseFloat(enLaFranja.ancho) > 5,
      JSON.stringify(enLaFranja));

    // y uno sin hora de fin se sigue comportando como siempre
    await page.evaluate(() => { window.PG.eventosS()[0].fin = ''; window.PG.save(); });
    const sinFin = await page.evaluate(() => {
      const d = document.createElement('div');
      d.innerHTML = window.PG.timelineBar(window.PG.iso(new Date()));
      const P = window.PG, k = P.iso(new Date());
      return { puntos: d.querySelectorAll('.tl-dot.evt').length,
        bandas: d.querySelectorAll('.tl-seg.evt').length,
        dur: P.calEventos(k, k).filter((x) => x.cat === 'EVENTO')[0].dur };
    });
    check('un evento sin hora de fin sigue siendo un punto y una cita de una hora',
      sinFin.puntos === 1 && sinFin.bandas === 0 && sinFin.dur === 60, JSON.stringify(sinFin));

    // el que cruza la medianoche: la regla es la misma que ya usaba la jornada de trabajo
    await page.evaluate(() => { const e = window.PG.eventosS()[0]; e.hora = '22:00'; e.fin = '02:00'; window.PG.save(); });
    const cruza = await page.evaluate(() => {
      const P = window.PG, k = P.iso(new Date());
      const e = P.calEventos(k, k).filter((x) => x.cat === 'EVENTO')[0];
      const l = P.icsTexto(k, k, {}).split(/\r?\n/).filter((x) => /DTEND/.test(x));
      return { dur: e.dur, dtend: l[l.length - 1] };
    });
    check('un evento que cruza la medianoche acaba al día siguiente, no a las 23:59',
      cruza.dur === 240 && /T020000/.test(cruza.dtend), JSON.stringify(cruza));
    await page.evaluate(() => { window.PG.eventosS().length = 0; window.PG.save(); });

    // Los enlaces profundos: irACard() hace `if(!c)return;`, así que si la tarjeta se mudó a otra
    // vista el botón no hace NADA y no da ningún error. Con Ajustes, Datos y Turno partidos en
    // pantallas, esto es exactamente el fallo mudo que hay que vigilar.
    const destinos = [
      ['ir-sol', 'sol'], ['ir-lector', 'lector'], ['ir-usda', 'usda'],
      ['franja-cfg', 'franja'], ['ir-sueno', 'sueno'],
    ];
    const llegadas = [];
    for (const [accion, cfg] of destinos) {
      await gotoTab('hoy');
      await page.waitForTimeout(150);
      await page.evaluate((a) => {
        document.getElementById('main').insertAdjacentHTML('beforeend',
          '<button id="__ir" data-a="' + a + '"></button>');
      }, accion);
      await page.click('#__ir');
      await page.waitForTimeout(400);
      llegadas.push(await page.evaluate((q) => {
        const c = document.querySelector('#main [data-cfg="' + q + '"]');
        return { cfg: q, llega: !!c, marcada: !!c && /brand/.test(c.style.outline) };
      }, cfg));
    }
    check('cada atajo sigue llevando a su tarjeta después de partir Ajustes, Datos y Turno',
      llegadas.every((x) => x.llega && x.marcada), JSON.stringify(llegadas));
  }

  // ===================== Estudio: el temario vive en otra app =====================
  {
    // Esta app no lleva el temario —serían dos listas desincronizándose— sino el plan: qué toca
    // repasar contra tu turno, cuándo volver a cada tema y cuánto has estudiado. El cruce es un
    // JSON que se casa por `id`, y eso es lo que hay que proteger: si el progreso se borrara al
    // volver a traer el temario, el contrato no valdría para nada.
    const TEMARIO = { nombre: 'Temario de prueba', url: 'https://ejemplo.test/t/', temas: [
      { id: 'c1', bloque: 'Cardio', nombre: 'Insuficiencia cardiaca', url: 'https://ejemplo.test/t/#c1' },
      { id: 'c2', bloque: 'Cardio', nombre: 'Fibrilación auricular' },
      { id: 'n1', bloque: 'Neumo', nombre: 'EPOC' },
      { id: '', nombre: 'sin id' },
      { id: 'x', nombre: 'url no https', url: 'javascript:alert(1)' } ] };
    await gotoTab('estudio');
    await page.waitForTimeout(200);
    await page.click('[data-a="est-vista"][data-v="conectar"]');
    await page.waitForTimeout(250);
    await page.fill('#estBox', JSON.stringify(TEMARIO));
    await page.click('[data-a="est-importar"]');
    await page.waitForTimeout(350);
    const traido = await page.evaluate(() => {
      const e = window.PG.estS();
      return { n: e.temas.length, ids: e.temas.map((t) => t.id).join(','), urlMala: e.temas[3].url };
    });
    check('el temario entra por JSON, descartando lo que no vale y las urls que no son https',
      traido.n === 4 && traido.ids === 'c1,c2,n1,x' && traido.urlMala === '', JSON.stringify(traido));

    // el repaso espaciado: cada vuelta aleja la siguiente
    const escalones = await page.evaluate(() => {
      const P = window.PG, out = [];
      for (let i = 0; i < 4; i++) { P.estSubir('c1'); out.push({ n: P.estEstado('c1').nivel, p: P.estProxima('c1') }); }
      return out;
    });
    const dias = escalones.map((x) => {
      const d = new Date(x.p + 'T00:00:00'), h = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
      return Math.round((d - h) / 86400000);
    });
    check('cada repaso aleja el siguiente: 3, 7, 21 y 60 días',
      dias.join(',') === '3,7,21,60', JSON.stringify({ escalones, dias }));

    // lo que se te pasó tiene que llegar al calendario del móvil: si solo avisara el día exacto,
    // un repaso atrasado no aparecería NUNCA, que es justo cuando hace falta
    const atrasado = await page.evaluate(() => {
      const P = window.PG, x = P.estEstado('n1');
      const d = new Date(); d.setDate(d.getDate() - 30);
      x.visto = new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
      x.nivel = 1; P.save();
      const k = P.iso(new Date());
      const evs = P.calEventos(k, P.iso(new Date(Date.now() + 6 * 864e5))).filter((e) => e.cat === 'ESTUDIO');
      return { n: evs.length, primero: evs[0] && evs[0].summ, toca: P.estTocaHoy(k).length };
    });
    check('un repaso atrasado sale en «Hoy» y entra en el .ics el primer día del rango',
      atrasado.toca >= 1 && atrasado.n >= 1 && /repasar/.test(atrasado.primero || ''), JSON.stringify(atrasado));

    // y sale en la pantalla del día, junto a las tareas y los recibos
    await gotoTab('hoy');
    await page.waitForTimeout(250);
    check('«Hoy» dice lo que toca repasar',
      /Toca repasar/.test(await page.evaluate(() => document.getElementById('main').innerText)), '');

    // EL contrato: volver a traer el temario renombrado y reordenado no borra tu progreso
    await gotoTab('estudio');
    await page.waitForTimeout(200);
    await page.evaluate(() => { window.PG.ui.estVista = 'conectar'; window.PG.render(); });
    await page.waitForTimeout(250);
    await page.fill('#estBox', JSON.stringify({ temas: [
      { id: 'n1', bloque: 'Neumología', nombre: 'EPOC y sus agudizaciones' },
      { id: 'c1', bloque: 'Cardiología', nombre: 'Insuficiencia cardiaca crónica' },
      { id: 'd1', bloque: 'Digestivo', nombre: 'Cirrosis' } ] }));
    await page.click('[data-a="est-importar"]');
    await page.waitForTimeout(350);
    const tras = await page.evaluate(() => {
      const P = window.PG, e = P.estS();
      return { n: e.temas.length, nombre: e.temas[1].nombre, nivelC1: P.estEstado('c1').nivel,
        nivelD1: P.estEstado('d1').nivel };
    });
    check('traer el temario otra vez no borra el progreso: se casa por id, no por nombre ni por orden',
      tras.n === 3 && /crónica/i.test(tras.nombre) && tras.nivelC1 === 4 && tras.nivelD1 === 0,
      JSON.stringify(tras));

    // el progreso que se devuelve, con el formato del contrato
    const prog = await page.evaluate(() => JSON.parse(window.PG.estProgresoJSON()));
    // ojo con leer prog.progreso.c1.nivel a pelo: si el progreso se perdiera, esto lanzaría y
    // tumbaría la suite entera en vez de dar un FAIL con su motivo
    check('el progreso que sale lleva app, version y el nivel de cada tema',
      prog.app === 'organizador-mir' && prog.version === 1 &&
      !!(prog.progreso && prog.progreso.c1) && prog.progreso.c1.nivel === 4,
      JSON.stringify(prog).slice(0, 160));

    // un JSON roto no puede llevarse por delante lo que ya tienes
    await page.evaluate(() => { window.PG.ui.estVista = 'conectar'; window.PG.render(); });
    await page.waitForTimeout(200);
    await page.fill('#estBox', '{esto no es json');
    await page.click('[data-a="est-importar"]');
    await page.waitForTimeout(300);
    check('un JSON roto lo dice y deja el temario como estaba',
      (await page.evaluate(() => window.PG.estS().temas.length)) === 3 &&
      /no es un JSON/.test(await page.evaluate(() => document.getElementById('main').innerText)), '');

    await page.evaluate(() => {
      window.PG.store.estudio = { fuente: { nombre: '', url: '', cuando: '' }, temas: [], estado: {}, sesiones: [] };
      window.PG.save();
    });
  }

  // ===================== Los avisos =====================
  // 84) una PWA estática no puede avisarte con el móvil bloqueado: no hay servidor de push, y no
  // hay ni una llamada a Notification en toda la app. Lo que sí funciona con la app cerrada es el
  // calendario del teléfono, así que el .ics lleva —además de guardias y entrenos— los recibos que
  // vencen, las tareas con día y los eventos, cada uno con su alarma.
  {
    const ics = await page.evaluate(() => {
      const P = window.PG, hoy = new Date(), iso = P.iso;
      P.store.dinero = { gastos: [], pagos: [], presupuesto: 0 };
      P.store.notas.length = 0;
      P.eventosS().length = 0;
      P.addGasto({ nombre: 'Alquiler', importe: 650, dia: 1, cat: 'casa' });
      const r = P.addNota('Llamar a la gestoría', iso(new Date(hoy.getTime() + 3 * 86400000)));
      P.setNota(r.id, 'proy', 'Papeleo');
      P.eventosS().push({ id: 'ev-ics', titulo: 'Presentación en rayos', modo: 'fecha',
        fecha: iso(new Date(hoy.getTime() + 10 * 86400000)), hora: '08:00', on: true, color: '' });
      P.save();
      const desde = iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
      const hasta = iso(new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0));
      const t = P.icsTexto(desde, hasta);
      return {
        alquiler: /SUMMARY:💶 Alquiler · 650 €/.test(t),
        // dos meses en el rango: el recibo tiene que salir en los dos
        vecesAlquiler: (t.match(/SUMMARY:💶 Alquiler/g) || []).length,
        tarea: /SUMMARY:📝 Llamar a la gestoría/.test(t),
        evento: /SUMMARY:📌 Presentación en rayos/.test(t),
        cats: ['DINERO', 'TAREA', 'EVENTO'].every((c) => t.indexOf('CATEGORIES:' + c) >= 0),
        // cada evento con su alarma: de avisar se encarga el teléfono
        eventos: (t.match(/BEGIN:VEVENT/g) || []).length,
        alarmas: (t.match(/BEGIN:VALARM/g) || []).length,
        // y un recibo ya pagado no vuelve a avisar
        sinPagados: (() => {
          const g = P.dineroS().gastos[0];
          P.pagarGasto(g.id, hoy.getFullYear(), hoy.getMonth());
          const t2 = P.icsTexto(desde, hasta);
          return (t2.match(/SUMMARY:💶 Alquiler/g) || []).length;
        })(),
      };
    });
    check('el .ics lleva los recibos, las tareas y los eventos con su alarma, y lo pagado deja de avisar',
      ics.alquiler && ics.vecesAlquiler === 2 && ics.tarea && ics.evento && ics.cats &&
      ics.eventos > 3 && ics.alarmas === ics.eventos && ics.sinPagados === 1,
      JSON.stringify(ics));
    await page.evaluate(() => {
      const P = window.PG;
      P.store.dinero = { gastos: [], pagos: [], presupuesto: 0 };
      P.store.notas.length = 0; P.eventosS().length = 0; P.save();
    });
  }

  // ===================== «Mi día» =====================
  // 83) las cinco patas de la app —el turno, el entreno, las tareas, el dinero y la comida— se leen
  // de una sentada en «Hoy», y EN ESE ORDEN: primero el día, luego lo que hay que HACER, y al final
  // lo de consulta. Antes el sol y los botones de navegar se colaban en medio de la lista.
  {
    await page.evaluate(() => {
      const P = window.PG, hoy = P.iso(new Date()), g = P.gymS();
      g.rutinas.length = 0;
      g.rutinas.push({ id: 'rt-d', nombre: 'Empuje A', notas: '', dias: [P.dayInfo(hoy).shiftId],
        ejercicios: [{ ex: 'Press banca', series: 4, reps: 8 }] });
      P.addGasto({ nombre: 'Alquiler', importe: 650, dia: new Date().getDate(), cat: 'casa' });
      const r = P.addNota('Empadronamiento', hoy); P.setNota(r.id, 'proy', 'Papeleo');
      P.save();
    });
    await gotoTab('hoy');
    await page.waitForTimeout(400);
    const dia = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#main .card')];
      const tit = (c) => { const h = c.querySelector('h2'); return h ? h.textContent.replace(/\s+/g, ' ').trim() : ''; };
      const orden = cards.map(tit);
      const pos = (re) => orden.findIndex((t) => re.test(t));
      return {
        alto: document.querySelector('#main').scrollHeight,
        ancho: document.documentElement.scrollWidth,
        dia: pos(/Hoy ·/), entrenar: pos(/toca entrenar/), tareas: pos(/Para hoy/),
        pagar: pos(/toca pagar/), comidas: pos(/Comidas de hoy/), sol: pos(/El sol hoy/),
      };
    });
    check('«Hoy» junta las cinco patas del día y las ordena: el día, lo que hay que hacer y, al final, lo de consulta',
      dia.dia === 0 && dia.entrenar === 1 && dia.tareas === 2 && dia.pagar === 3 &&
      dia.comidas > dia.pagar && dia.sol > dia.comidas &&
      dia.alto < 2300 && dia.ancho <= 412, JSON.stringify(dia));
    await page.evaluate(() => {
      const P = window.PG;
      P.store.dinero = { gastos: [], pagos: [], presupuesto: 0 };
      P.store.notas.length = 0;
      P.gymS().rutinas.length = 0;
      P.save();
    });
  }

  // ===================== Entreno: qué toca hoy =====================
  // 82) los menús van pegados al TIPO de día desde el principio; el entreno no, y por eso la app
  // nunca sabía qué te tocaba hoy: la portada de Entreno eran 445 px y cuatro fichas. Mismo modelo
  // que los menús: la rutina se asigna a tipos de día, y entonces «hoy toca» puede decirse en
  // Entreno, en Hoy y en el Mes. Se conduce entero: asignar, ver, empezar.
  {
    await page.evaluate(() => {
      const P = window.PG, g = P.gymS();
      g.rutinas.length = 0;
      g.rutinas.push({ id: 'rt-test', nombre: 'Empuje A', notas: '', dias: [],
        ejercicios: [{ ex: 'Press banca', series: 4, reps: 8 }, { ex: 'Press militar', series: 3, reps: 10 }] });
      // historial, para que la progresión tenga algo que enseñar
      const k = P.iso(new Date(Date.now() - 7 * 86400000));
      g.registro.push({ id: 'gx1', fecha: k, ex: 'Press banca', kg: 62.5, reps: 8, rpe: null, nota: '', ts: Date.now() });
      P.save();
    });
    await gotoTab('gym');
    await page.waitForTimeout(200);
    await page.click('[data-a="gym-panel"][data-p="rutinas"]');
    await page.waitForTimeout(300);
    const chips = await page.evaluate(() => document.querySelectorAll('[data-a="rt-dia"]').length);
    const shHoy = await page.evaluate(() => window.PG.dayInfo(window.PG.iso(new Date())).shiftId);
    await page.click(`[data-a="rt-dia"][data-sh="${shHoy}"]`);
    await page.waitForTimeout(320);
    await page.click('.subcab [data-a="gym-panel"]');
    await page.waitForTimeout(320);
    const enEntreno = await page.evaluate(() => {
      const c = [...document.querySelectorAll('#main .card')].find((x) => /toca entrenar/.test(x.textContent));
      return { hay: !!c, rutina: c ? /Empuje A/.test(c.textContent) : false,
        // la progresión donde hace falta: justo antes de levantar
        ultimoPeso: c ? /62[.,]5 kg/.test(c.textContent) : false,
        empezar: c ? !!c.querySelector('[data-a="ses-empezar"]') : false };
    });
    await gotoTab('hoy');
    await page.waitForTimeout(300);
    const enHoyG = await page.evaluate(() =>
      [...document.querySelectorAll('#main .card')].some((x) => /toca entrenar/.test(x.textContent)));
    // y empezarla desde «Hoy» monta las series y quita el aviso
    const bot = await page.$('#main [data-a="ses-empezar"]');
    if (bot) { await bot.click(); await page.waitForTimeout(400); }
    const trasG = await page.evaluate(() => ({
      sesion: !!window.PG.ui.gymSesionActiva,
      series: window.PG.gymS().registro.filter((x) => x.sesionId).length,
      yaNoAvisa: ![...document.querySelectorAll('#main .card')].some((x) => /toca entrenar/.test(x.textContent)),
    }));
    check('una rutina se pega a un tipo de día, y entonces «hoy toca entrenar» sale en Entreno y en Hoy',
      chips >= 3 && enEntreno.hay && enEntreno.rutina && enEntreno.ultimoPeso && enEntreno.empezar &&
      enHoyG && trasG.sesion && trasG.series >= 7 && trasG.yaNoAvisa,
      JSON.stringify({ chips, enEntreno, enHoyG, trasG }));
    await page.evaluate(() => {
      const P = window.PG; P.ui.gymSesionActiva = null;
      const g = P.gymS(); g.rutinas.length = 0; g.registro.length = 0; g.sesiones.length = 0; P.save();
    });
  }

  // ===================== Turno y rotación =====================
  // 80) era UNA pantalla de 7 005 px —7,7 pantallas de móvil— con 126 campos seguidos, y es lo
  // primero que tocas al llegar a un destino nuevo. Ahora es una portada que dice cómo estás
  // montado y una pantalla por tarea, como Comida.
  {
    await gotoTab('cfg');
    await page.waitForTimeout(300);
    const portada = await page.evaluate(() => ({
      alto: document.querySelector('#main').scrollHeight,
      campos: document.querySelectorAll('#main input,#main select,#main textarea').length,
      puertas: [...document.querySelectorAll('#main .puerta b')].map((x) => x.textContent),
      // el estado de un vistazo: cuántos tipos de día y cómo se arma la semana
      cifras: [...document.querySelectorAll('#main .dosdatos b')].map((x) => x.textContent),
    }));
    // y cada puerta abre lo suyo y vuelve
    const visitas = [];
    for (const v of ['dias', 'horas', 'semana', 'rotacion', 'notas']) {
      // sin portada no hay puertas: esta prueba tiene que FALLAR, no tumbar la suite con un timeout
      const b = await page.$(`[data-a="cfg-vista"][data-v="${v}"]`);
      if (!b) { visitas.push({ v: '(sin puerta)', campos: 0, ancho: 0 }); continue; }
      await b.click();
      await page.waitForTimeout(250);
      visitas.push(await page.evaluate(() => ({
        v: window.PG.ui.cfgVista,
        tit: (document.querySelector('#main .subtit') || {}).textContent,
        campos: document.querySelectorAll('#main input,#main select,#main textarea').length,
        ancho: document.documentElement.scrollWidth,
      })));
      const volver = await page.$('.subcab [data-a="cfg-vista"][data-v=""]');
      if (volver) { await volver.click(); await page.waitForTimeout(200); }
    }
    check('Turno y rotación es una portada de media pantalla y una pantalla por tarea',
      portada.alto < 700 && portada.campos === 0 && portada.puertas.length === 6 &&
      portada.cifras.length === 2 &&
      visitas.length === 5 && visitas.every((x) => x.campos > 0 && x.ancho <= 412) &&
      visitas.map((x) => x.v).join('|') === 'dias|horas|semana|rotacion|notas',
      JSON.stringify({ portada, visitas }));
  }

  // 81) y el atajo «patrón y rotación» de Semana sigue llevando a su tarjeta, que ahora vive dentro
  // de una de esas pantallas: al partirla, un atajo que apunta a una tarjeta se queda sin destino
  // y no da ningún error — simplemente no pasa nada.
  {
    await gotoTab('week');
    await page.waitForTimeout(250);
    await page.click('#main [data-a="ir-semana-cfg"]');
    await page.waitForTimeout(600);
    const atajo = await page.evaluate(() => ({
      tab: window.PG.ui.tab, vista: window.PG.ui.cfgVista,
      tarjeta: !!document.querySelector('#main .card[data-cfg="semana"]'),
    }));
    check('el atajo «patrón y rotación» de Semana abre la pantalla que ahora contiene esa tarjeta',
      atajo.tab === 'cfg' && atajo.vista === 'semana' && atajo.tarjeta, JSON.stringify(atajo));
    await page.evaluate(() => { window.PG.ui.cfgVista = ''; window.PG.render(); });
  }

  // ===================== Notas: tareas y proyectos =====================
  // 78) la libreta se ordena por CUÁNDO toca, no por si la nota tiene día o no: lo que se te pasó,
  // lo de hoy, lo de esta semana, lo de más adelante y lo que no tiene día. Y el proyecto agrupa
  // varias notas sin tener que crearlo en ningún sitio: se escribe y ya está.
  {
    await page.evaluate(() => {
      const P = window.PG;
      P.store.notas.length = 0;
      const d = (n) => P.iso(new Date(Date.now() + n * 86400000));
      [['Pagar la fianza al casero', d(-3), 'Mudanza'],
       ['Llamar a la luz', d(-1), 'Mudanza'],
       ['Empadronamiento', d(0), 'Papeleo'],
       ['Preparar la sesión', d(0), 'Sesión'],
       ['Comprar una lámpara', d(2), 'Mudanza'],
       ['Cambiar la dirección del banco', d(20), 'Papeleo'],
       ['Leer el capítulo de tórax', '', 'Sesión']].forEach((t) => {
        const r = P.addNota(t[0], t[1]); P.setNota(r.id, 'proy', t[2]);
      });
      P.save();
    });
    await gotoTab('notas');
    await page.waitForTimeout(300);
    const montones = await page.evaluate(() => ({
      bloques: [...document.querySelectorAll('#main .card h2')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()),
      // lo que se te pasó se avisa, no se mezcla con el resto
      avisa: !!document.querySelector('#main .card.avisa'),
      proys: [...document.querySelectorAll('[data-a="nota-proy-f"]')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()),
      tardes: document.querySelectorAll('#main .nota .pie.tarde').length,
    }));
    await page.click('[data-a="nota-proy-f"][data-p="Mudanza"]');
    await page.waitForTimeout(250);
    const filtrado = await page.evaluate(() => ({
      n: document.querySelectorAll('#main .nota').length,
      todas: [...document.querySelectorAll('#main .nota .pie.proy')].every((x) => /Mudanza/.test(x.textContent)),
    }));
    await page.click('[data-a="nota-proy-f"][data-p=""]');
    await page.waitForTimeout(220);
    check('la libreta se ordena por cuándo toca y el proyecto agrupa y filtra',
      montones.bloques.join('|') === 'Se te pasó 2|Hoy 2|Esta semana 1|Más adelante 1|Sin día 1' &&
      montones.avisa && montones.tardes === 2 &&
      montones.proys.join('|') === 'todos|◆ Mudanza 3|◆ Papeleo 2|◆ Sesión 2' &&
      filtrado.n === 3 && filtrado.todas, JSON.stringify({ montones, filtrado }));
  }

  // 79) y lo que toca hoy sale en «Hoy», que es lo que convierte la libreta en una lista de tareas:
  // antes, una nota con día solo la veías si te acordabas de entrar en la libreta. Se marca desde
  // ahí y desaparece del aviso.
  {
    await gotoTab('hoy');
    await page.waitForTimeout(300);
    const enHoy = await page.evaluate(() => {
      const c = [...document.querySelectorAll('#main .card')].find((x) => /Para hoy/.test(x.textContent));
      return { hay: !!c, n: c ? c.querySelectorAll('.nota').length : 0,
        // las dos atrasadas van primero, que son las que urgen
        primera: c ? (c.querySelector('.nota .t') || {}).textContent : '' };
    });
    const tick = await page.$('#main .card .nota .tick');
    if (tick) { await tick.click(); await page.waitForTimeout(320); }
    const tras = await page.evaluate(() => {
      const c = [...document.querySelectorAll('#main .card')].find((x) => /Para hoy/.test(x.textContent));
      return { quedan: c ? c.querySelectorAll('.nota').length : 0,
        hechas: window.PG.store.notas.filter((n) => n.hecha).length };
    });
    check('lo que toca hoy y lo que se te pasó salen en «Hoy», y se marcan desde ahí',
      enHoy.hay && enHoy.n === 4 && /fianza/.test(enHoy.primera) &&
      tras.quedan === 3 && tras.hechas === 1, JSON.stringify({ enHoy, tras }));
    await page.evaluate(() => { window.PG.store.notas.length = 0; window.PG.save(); });
  }

  // ===================== Dinero =====================
  // 75) el mes cuadra: se dan de alta dos gastos fijos por la interfaz, se mira el resumen, se marca
  // uno como pagado y se comprueba que lo pendiente baja y lo pagado sube. Encadenado a propósito:
  // el fallo que se busca es el del estado que queda de un gesto al siguiente.
  {
    await gotoTab('dinero');
    await page.waitForTimeout(200);
    await page.click('[data-a="dinero-vista"][data-v="fijos"]');
    await page.waitForTimeout(250);
    const alta = async (n, imp, dia, cat) => {
      await page.fill('#gnNombre', n);
      await page.fill('#gnImporte', imp);
      await page.fill('#gnDia', String(dia));
      await page.selectOption('#gnCat', cat);
      await page.click('[data-a="dinero-add"]');
      await page.waitForTimeout(220);
    };
    await alta('Alquiler', '650', 1, 'casa');
    await alta('Gimnasio', '32,50', 3, 'salud');
    await page.click('.subcab [data-a="dinero-vista"]');
    await page.waitForTimeout(250);
    const mes0 = await page.evaluate(() => {
      const n = new Date(), d = window.PG.mesDinero(n.getFullYear(), n.getMonth());
      return { fijoTotal: d.fijoTotal, pend: d.pend, pagado: d.pagado,
        filas: document.querySelectorAll('#main .gfila').length };
    });
    await page.click('#main .gfila .tick');
    await page.waitForTimeout(300);
    const mes1 = await page.evaluate(() => {
      const n = new Date(), d = window.PG.mesDinero(n.getFullYear(), n.getMonth());
      return { pend: d.pend, pagado: d.pagado, pagos: d.pagos.length,
        marcada: document.querySelectorAll('#main .gfila.ok').length };
    });
    // y desmarcarlo lo deshace, sin dejar el pago suelto por ahí
    await page.click('#main .gfila.ok .tick');
    await page.waitForTimeout(300);
    const mes2 = await page.evaluate(() => {
      const n = new Date(), d = window.PG.mesDinero(n.getFullYear(), n.getMonth());
      return { pend: d.pend, pagado: d.pagado, pagos: d.pagos.length };
    });
    check('los gastos fijos: el mes suma, marcar uno pagado baja lo pendiente y desmarcarlo lo deshace',
      mes0.fijoTotal === 682.5 && mes0.pend === 682.5 && mes0.pagado === 0 &&
      mes1.pagado === 650 && mes1.pend === 32.5 && mes1.pagos === 1 && mes1.marcada === 1 &&
      mes2.pagado === 0 && mes2.pend === 682.5 && mes2.pagos === 0,
      JSON.stringify({ mes0, mes1, mes2 }));
  }

  // 76) un importe se escribe «41,30», que es como se escribe aquí. Con un <input type="number"> el
  // navegador rechaza la coma EN SILENCIO: el campo se queda vacío y el gasto se pierde sin decir
  // nada. Se conduce el modal de verdad, tecleando la coma.
  {
    const antesP = await page.evaluate(() => window.PG.dineroS().pagos.length);
    await page.click('[data-a="dinero-apuntar"]');
    await page.waitForTimeout(280);
    await page.fill('#mPgNombre', 'Compra del súper');
    await page.fill('#mPgImporte', '41,30');
    await page.selectOption('#mPgCat', 'compra');
    await page.click('[data-a="m-save"]');
    await page.waitForTimeout(350);
    const conComa = await page.evaluate((n) => {
      const d = window.PG.dineroS();
      const p = d.pagos[d.pagos.length - 1];
      const m = window.PG.mesDinero(new Date().getFullYear(), new Date().getMonth());
      return { nuevos: d.pagos.length - n, importe: p && p.importe, cat: p && p.cat,
        enPantalla: /41,30/.test(document.getElementById('main').textContent),
        porCat: m.porCat.compra };
    }, antesP);
    check('un importe con coma («41,30») se guarda como 41,30 y no se pierde por el camino',
      conComa.nuevos === 1 && conComa.importe === 41.3 && conComa.cat === 'compra' &&
      conComa.enPantalla && conComa.porCat === 41.3, JSON.stringify(conComa));
  }

  // 77) el dinero se cruza con el calendario: un gasto que cae hoy avisa en «Hoy» y se marca desde
  // ahí, y el día aparece marcado en el Mes. Antes no había ni una línea de dinero en la app.
  {
    await page.evaluate(() => {
      window.PG.addGasto({ nombre: 'Seguro del coche', importe: '58,90',
        dia: new Date().getDate(), cat: 'transporte' });
    });
    await gotoTab('hoy');
    await page.waitForTimeout(300);
    const enHoy = await page.evaluate(() => {
      const c = document.querySelector('#main .card.avisa');
      return { hay: !!c, dice: c ? /Seguro del coche/.test(c.textContent) : false,
        importe: c ? /58,90/.test(c.textContent) : false };
    });
    // si el aviso no está, esta prueba tiene que FALLAR, no tumbar la suite con un timeout de 30 s
    const tick = await page.$('#main .card.avisa .tick');
    if (tick) { await tick.click(); await page.waitForTimeout(300); }
    const trasPagar = await page.evaluate(() => ({
      avisa: !!document.querySelector('#main .card.avisa'),
      pagado: window.PG.mesDinero(new Date().getFullYear(), new Date().getMonth()).pagado,
    }));
    await gotoTab('month');
    await page.waitForTimeout(300);
    const enMes = await page.evaluate(() => document.querySelectorAll('#main .dbox .dgasto').length);
    check('un gasto que cae hoy avisa en «Hoy», se marca desde ahí y el día sale marcado en el Mes',
      enHoy.hay && enHoy.dice && enHoy.importe && !trasPagar.avisa &&
      trasPagar.pagado === 58.9 + 41.3 && enMes >= 2,
      JSON.stringify({ enHoy, trasPagar, enMes }));
    await page.evaluate(() => { window.PG.store.dinero = { gastos: [], pagos: [], presupuesto: 0 }; window.PG.save(); });
  }

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
