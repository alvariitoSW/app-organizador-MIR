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
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.gz': 'application/gzip',
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
    // el informe de fin de sesión tapa la portada aunque gymPanel esté vacío
    await page.evaluate(() => { if (window.PG.ui.gymInforme) { window.PG.ui.gymInforme = ''; window.PG.render(); } });
    // Entreno tiene pantallas anidadas (el constructor cuelga de «Rutinas»), así que el botón de
    // atrás no siempre lleva a la portada de un salto: se pulsa hasta llegar. Con page.$ y no
    // page.click, para que un botón que falte no cuelgue 30 s y tumbe la suite entera.
    for (let i = 0; i < 4; i++) {
      if (!(await page.evaluate(() => !!window.PG.ui.gymPanel))) break;
      const atras = await page.$('#main .volver[data-a="gym-panel"]');
      if (!atras) break;
      await atras.click();
      await page.waitForTimeout(160);
    }
    if (panel) {
      // con page.click, una puerta que no existe cuelga 30 s y TUMBA la suite entera en vez de
      // hacer fallar la prueba que la necesita. Es la cuarta vez que pasa en este repositorio.
      const puerta = await page.$(`[data-a="gym-panel"][data-p="${panel}"]`);
      if (puerta) { await puerta.click(); await page.waitForTimeout(200); }
      else console.log('  (aviso: no hay puerta a «' + panel + '» en Entreno)');
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
    // el calendario dejó de ser una barra horizontal + lista de horas: ahora es un carril
    // vertical donde cada cosa ocupa el rato que ocupa. Lo que se comprueba es que el día se vea,
    // no cómo se dibujaba antes.
    franja: !!document.querySelector('#main .carrilbox .carril'),
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

  // 15) las flechas ‹ › se ocultan donde no mueven nada y se ven donde sí: en Mes mueven el mes, en
  // «Hoy» el día —eso es nuevo: antes en «Hoy» no había nada que mover y por eso se escondían— y en
  // Semana solo cuando está «por fecha», porque en plantilla los días no llevan fecha.
  // Se comprueba el estilo calculado (display), no solo el atributo hidden: un display:flex propio
  // puede anularlo en silencio.
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
  check('las flechas ‹ › se ven donde mueven algo (Hoy, Semana por fecha) y no en Semana-plantilla',
    wkNavEnHoy !== 'none' && wkNavEnSemanaPlantilla === 'none' && wkNavEnSemanaPorFecha !== 'none',
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
  // la lista es una tarjeta por rutina (nombre, cuántos ejercicios, qué músculos); los ejercicios
  // uno a uno se ven al abrirla con «editar», que es donde se tocan
  const migradaEnUI = await page.evaluate(() => {
    const P = window.PG;
    const rt = P.gymS().rutinas.filter((r) => r.nombre === 'Mi rutina')[0];
    const lista = document.getElementById('main').innerText;
    if (rt) { P.ui.gymRutSel = rt.id; P.ui.gymPanel = 'rutedit'; P.render(); }
    const dentro = document.getElementById('main').innerText;
    if (rt) { P.ui.gymPanel = 'rutinas'; P.render(); }
    return lista + '\n' + dentro;
  });
  check('la rutina migrada se ve en la UI con su nombre y sus ejercicios',
    migradaEnUI.includes('Mi rutina') && migradaEnUI.includes('Peso muerto') && migradaEnUI.includes('Remo con barra'),
    migradaEnUI.slice(0, 300));

  // 18) flujo completo por la UI de verdad: crear rutina -> empezar -> apuntar serie -> terminar -> sesión guardada con su duración
  await page.fill('#rtNombreNueva', 'Rutina UI');
  await page.click('[data-a="rt-nueva"]');
  await page.waitForTimeout(200);
  const ridUI = await page.evaluate(() => window.PG.gymS().rutinas.find((r) => r.nombre === 'Rutina UI').id);
  // los ejercicios se añaden ahora dentro de «editar»: la lista es una tarjeta por rutina que se
  // lee de un vistazo, no una tabla de nueve columnas por ejercicio
  await page.click('[data-a="rt-editar"][data-id="' + ridUI + '"]');
  await page.waitForTimeout(250);
  await page.fill('#rtNew-' + ridUI, 'Curl bíceps');
  await page.click('[data-a="rt-add"][data-id="' + ridUI + '"]');
  await page.waitForTimeout(200);
  await page.click('.subcab [data-a="gym-panel"][data-p="rutinas"]');
  await page.waitForTimeout(250);
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
  await page.click('[data-a="rt-editar"][data-id="' + ridUI + '"]');   // …y dentro de «editar»
  await page.waitForTimeout(250);
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
  const regionesResaltadas = await page.evaluate((rid) => {
    const P = window.PG;
    P.ui.gymRutSel = rid; P.ui.gymPanel = 'rutedit'; P.render();   // el muñeco está en «editar»
    const n = document.querySelectorAll('.mreg.on').length;
    P.ui.gymPanel = 'rutinas'; P.render();
    return n;
  }, ridUI);
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

  // 25) "Hoy" enseña el día como CARRIL de horas, con la línea de dónde estás ahora
  await gotoTab('hoy');
  await page.waitForTimeout(200);
  const hoyBarra = await page.evaluate(() => ({
    barra: !!document.querySelector('#main .carrilbox .carril'),
    ahora: !!document.querySelector('#main .carril .cnow'),
  }));
  check('"Hoy" enseña el día como carril de horas, con la línea de ahora',
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
  // la barra de 24 h que llevaba CADA fila se sustituyó por la rejilla de los siete días de arriba:
  // repetir la misma franja siete veces costaba 900 px y tres pantallas de scroll. Lo que se fija
  // aquí es que hoy sigue señalado en las dos: la fila lleva su marca y la rejilla su columna.
  const semanaEstado = await page.evaluate(() => {
    const row = document.querySelector('.drow.today');
    return { filaHoy: !!row, columnaHoy: !!document.querySelector('#main .semrej .scol.hoy'),
      cabHoy: !!document.querySelector('#main .semrej .sch.hoy') };
  });
  check('en Semana + "por fecha", hoy va marcado en su fila y en su columna de la rejilla',
    semanaEstado.filaHoy && semanaEstado.columnaHoy && semanaEstado.cabHoy, JSON.stringify(semanaEstado));

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
    // el muñeco y la recomendación viven donde se montan los ejercicios: en «editar»
    window.PG.ui.gymRutSel = 'rt-test';
    window.PG.ui.gymPanel = 'rutedit';
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
  // «que quepan aunque sea en pequeño los eventos del día»: con las casillas ya altas (siete filas
  // que llenan la pantalla), el evento lleva su punto de color Y su nombre, partido por palabras en
  // hasta dos líneas (tres si es el único del día), con la hora detrás
  const mesConEvento = await page.evaluate(() => {
    const ev = [...document.querySelectorAll('#main .dbox .dev')].find((l) => /Entreno con Marta/.test(l.title));
    return { marcado: !!(ev && ev.querySelector('.dpt')),
      conNombre: ev ? /Entreno con/.test(ev.innerText) : false,
      conHora: ev ? /\b8\b/.test(ev.innerText) : false };
  });
  check('"Mes" enseña el evento en su casilla con su color, su nombre y su hora',
    mesConEvento.marcado && mesConEvento.conNombre && mesConEvento.conHora, JSON.stringify(mesConEvento));

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
  // el segundo entreno y los eventos ya no son puntos en una barra: son bloques del carril, con
  // su color y su hora, y se tocan para ir a cambiarlos
  const marcasTimeline = await page.evaluate(() => { const P = window.PG;
    const col = (c) => P.tlColor(c);
    const bs = [...document.querySelectorAll('#main .carril .cb')]
      .map((b) => b.style.getPropertyValue('--c').trim());
    return { gym: bs.indexOf(col('gym')) >= 0, evt: bs.indexOf(col('evt')) >= 0,
      bloques: bs.length }; });
  check('el carril pinta el segundo entreno y los eventos del día con su color propio',
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
      // la previsualización es ahora el carril, no la barra horizontal que se quitó
      preview: !!c.querySelector('.carril'),
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
  // los colores mandan ahora sobre el CARRIL: al quitar la barra horizontal, ese ajuste tenía que
  // seguir sirviendo para algo o sobraba de Ajustes
  const franjaHoy = await page.evaluate(() => [...document.querySelectorAll('#main .carril .cb')]
    .map((s) => s.style.getPropertyValue('--c').trim()));
  const elegidos = Object.values(PALETA).map((h) => h.toLowerCase());
  check('los colores que eliges en Ajustes se aplican al carril de "Hoy"',
    franjaHoy.length >= 2 && franjaHoy.some((c) => elegidos.indexOf(c.toLowerCase()) >= 0),
    JSON.stringify({ franjaHoy, elegidos }));

  // la leyenda dice qué es cada color y lleva de vuelta a Ajustes
  const leyenda = await page.evaluate(() => {
    const l = document.querySelector('#main .tlleg');
    return l ? { n: l.querySelectorAll('i').length, atajo: !!l.querySelector('[data-a="franja-cfg"]') } : null;
  });
  check('"Hoy" explica con una leyenda qué es cada color de la franja y lleva a cambiarlos',
    leyenda && leyenda.n === 6 && leyenda.atajo, JSON.stringify(leyenda));

  // el ajuste de 12/18/24 h manda ahora en CUÁNTAS HORAS VES DE UNA VEZ en el carril: la caja mide
  // lo mismo siempre —si creciera, la portada crecería al elegir 24 h— y lo que cambia es lo alta
  // que es una hora. A 12 h se ve holgado, a 24 apretado. Sin esto, ese ajuste se habría quedado
  // sin mandar en nada al quitar la barra horizontal.
  const zoom = await page.evaluate(() => { const P = window.PG;
    const mide = (h) => { P.store.franja = { horas: h, colores: {} }; P.render();
      const box = document.querySelector('#main .carrilbox');
      const car = document.querySelector('#main .carril');
      const hs = document.querySelectorAll('#main .carril .ch');
      return { caja: Math.round(box.getBoundingClientRect().height),
        hora: hs.length ? Math.round(hs[0].getBoundingClientRect().height) : 0 };
    };
    const a = mide(24), b = mide(12);
    P.store.franja = { horas: 24, colores: {} }; P.render();
    return { h24: a, h12: b }; });
  // la caja tiene un TECHO (no un alto fijo): a 24 h el carril entero cabe en menos y no se deja
  // media caja vacía, pero nunca puede pasar de ese techo, que es lo que impide que elegir 12 h
  // alargue la portada
  check('eligiendo 12 h el carril se ve más holgado, y la caja nunca pasa de su techo',
    zoom.h12.hora > zoom.h24.hora * 1.5 && zoom.h24.hora >= 16 &&
    zoom.h12.caja <= 400 && zoom.h24.caja <= 400 && zoom.h24.caja <= zoom.h12.caja,
    JSON.stringify(zoom));
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
      .find((c) => /cocina de la semana/i.test((c.querySelector('h2') || {}).textContent || ''));
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

    // el mes en el que estás empieza dos semanas antes de la de hoy: puede que los primeros días del
    // mes ya no salgan. Se cuentan los días de vacaciones QUE SE VEN en la cuadrícula.
    const r1 = [clave(new Date(y, m, 3)), clave(new Date(y, m, 7))], r2 = [clave(new Date(y, m, 18)), clave(new Date(y, m, 27))];
    const esperados = await page.evaluate((rr) => [...document.querySelectorAll('.dbox')]
      .filter((x) => rr.some((r) => x.dataset.key >= r[0] && x.dataset.key <= r[1])).length, [r1, r2]);
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
      dos.guardados === 2 && dos.filas === 2 && dos.diasEnElCalendario === esperados && esperados >= 10 &&
      dos.enPlural && dos.cuenta && dos.posicion < dos.total, JSON.stringify({ dos, esperados }));

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
      // el muñeco y su leyenda viven ahora en «editar», que es donde montas la rutina y donde
      // sirve de algo saber qué te dejas sin tocar
      window.PG.ui.gymRutSel = 'rt-mun';
      window.PG.ui.gymPanel = 'rutedit';
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

    // Con diez eventos en un día la casilla no puede reventar: caben tres con su nombre (en dos
    // líneas como mucho, partido por palabras) y el resto va como «+N». El nombre entero sigue en
    // la lista del mes y al tocar el día.
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
        // los tres que caben llevan su nombre, y ninguno pasa de dos líneas
        titulos: [...celda.querySelectorAll('.dev')].filter((x) => /Un evento de/.test(x.innerText)).length,
        maxLineas: Math.max(...[...celda.querySelectorAll('.dev')].map((x) =>
          Math.round(x.getBoundingClientRect().height / parseFloat(getComputedStyle(x).lineHeight)))),
      };
    });
    check('con diez eventos en un día, la casilla enseña tres con nombre y «+7», sin desbordarse',
      aprieto.puntos === 3 && aprieto.masN === '+7' && aprieto.nota && aprieto.titulos === 3 &&
      aprieto.maxLineas <= 2 && !aprieto.desborda && aprieto.contenido < aprieto.altoCelda,
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
    tabs: document.querySelectorAll('#main [data-a="food-tab"]').length,
  }));
  check('el buscador abre con lo que más apuntas (seis filas), no con la lista entera',
    buscadorVacio.campo && buscadorVacio.filas === 6 && buscadorVacio.grupos === 0 &&
    buscadorVacio.tabs === 3, JSON.stringify(buscadorVacio));

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
      // el círculo del sol solo está cuando el sol está arriba: es el mismo aviso que usa el
      // barrido de abajo para contar las horas con sol
      const haySol = !!card.querySelector('.arco svg circle');
      if (!rec) return { sinTrazo: true, haySol: haySol };
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
    // La mitad de pantalla solo puede exigir un tramo recorrido si el sol está arriba AHORA: de
    // madrugada no hay nada que pintar y eso es lo correcto, no un fallo. La suite corría en rojo
    // por eso, sin que la app tuviera nada malo. El barrido de las 24 horas de arriba es el que
    // fija de verdad el fallo del large-arc-flag, y ese no depende de la hora: se exige entero.
    check('el arco del sol pinta el recorrido sobre su guía y dentro del dibujo a cualquier hora del día',
      !enPantalla.sinTarjeta &&
      (enPantalla.sinTrazo
        ? enPantalla.haySol === false
        : (enPantalla.desvio <= 1 && enPantalla.arriba >= -0.5 && enPantalla.abajo <= 66.5)) &&
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
        // la semana empieza por la REJILLA de los siete días: es la vista de un vistazo, y lo que
        // había antes —siete tarjetas de texto— no dejaba ver dónde estaba el hueco de la semana
        rejilla: (function(){ const g = main.querySelector('.semrej');
          return g ? Math.round(g.getBoundingClientRect().top + window.scrollY - main.getBoundingClientRect().top) : -1; })(),
        colsRejilla: main.querySelectorAll('.semrej .scol').length,
        kpis: main.querySelectorAll('.tot div').length,
        // la configuración se fue a «Turno y rotación»: aquí ya no está
        sinConfig: !main.querySelector('[data-a="autofill"]') && !main.querySelector('[data-a="rot-anchor"]'),
        irACfg: !!main.querySelector('[data-a="ir-semana-cfg"]'),
        chipHoy: !!(hoy && hoy.querySelector('.hoychip')),
        fondoDistinto: !!(hoy && otra && getComputedStyle(hoy).backgroundColor !== getComputedStyle(otra).backgroundColor),
        sol: main.querySelectorAll('.drsol').length,
        // el sol se fue a la cabecera: en la semana sale y se pone con cuatro minutos de
        // diferencia de punta a punta, así que repetirlo en los siete días era un renglón por día
        solCab: !!main.querySelector('.card .solsem'),
        // y las horas de dormir se sombrean en la columna de cada día de la rejilla, que es donde
        // se ve de un golpe qué noche se queda corta (antes iban en la barra horizontal de cada fila)
        noche: main.querySelectorAll('.tl-noche').length,
      };
    });
    // La semana empieza por la SEMANA, no por la configuración: primero la rejilla de los siete
    // días en la primera pantalla, y debajo el detalle día a día. Lo que no puede pasar —y es lo
    // que fijaba esta prueba— es que lo primero sea un muro de ajustes.
    check('Semana empieza por la rejilla de los siete días, con hoy marcado, el sueño de cada uno y el sol arriba',
      sem.rejilla >= 0 && sem.rejilla < 170 && sem.colsRejilla === 7 &&
      sem.rejilla < sem.antesDelPrimerDia &&
      sem.kpis === 3 && sem.sinConfig && sem.irACfg &&
      sem.chipHoy && sem.fondoDistinto && sem.sol === 7 && sem.solCab && sem.noche >= 7, JSON.stringify(sem));
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

  // ===================== Imprimir =====================
  {
    // Tres cosas distintas iban mal, y las tres se veían en el papel:
    //  1. `#main button{display:none}` borraba CONTENIDO: las 30 casillas del mes eran <button>,
    //     así que imprimir «Mes» daba una cuadrícula VACÍA. También las secciones de la compra.
    //  2. la paleta seguía en modo noche: cajas negras con letra negra, y texto casi blanco sobre
    //     blanco (los KPI, las horas del sol, las rotaciones).
    //  3. lo plegado no sale en papel, y en papel no se puede desplegar: la compra se imprimía sin
    //     las 10 cosas «de rutina» y la semana sin una sola comida.
    await gotoTab('month');
    await page.waitForTimeout(300);
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(200);
    const mesImpreso = await page.evaluate(() => {
      const celdas = [...document.querySelectorAll('#main .dbox')];
      const vis = celdas.filter((c) => getComputedStyle(c).display !== 'none');
      const kpi = document.querySelector('#main .kpis div, #main .tot div, #main .dosdatos div');
      const cs = kpi ? getComputedStyle(kpi) : null;
      return { celdas: celdas.length, visibles: vis.length,
        conTexto: vis.filter((c) => (c.innerText || '').trim().length > 1).length,
        kpiFondo: cs ? cs.backgroundColor : '', kpiTexto: cs ? cs.color : '',
        previas: celdas.filter((c) => c.classList.contains('semprev')).length,
        bodyFondo: getComputedStyle(document.body).backgroundColor };
    });
    check('al imprimir «Mes» salen las casillas del mes, no una cuadrícula vacía',
      // todas menos las dos semanas ya pasadas del mes en el que estás, que no se imprimen
      mesImpreso.celdas >= 28 && mesImpreso.visibles === mesImpreso.celdas - mesImpreso.previas && mesImpreso.conTexto >= 28,
      JSON.stringify(mesImpreso));
    // el fondo de una caja tiene que ser claro: antes era la tarjeta oscura con la letra en negro
    const claro = (c) => {
      const m = /rgba?\((\d+), ?(\d+), ?(\d+)/.exec(c || '');
      return m ? (+m[1] + +m[2] + +m[3]) / 3 > 200 : false;
    };
    const oscuro = (c) => {
      const m = /rgba?\((\d+), ?(\d+), ?(\d+)/.exec(c || '');
      return m ? (+m[1] + +m[2] + +m[3]) / 3 < 120 : false;
    };
    check('al imprimir, las cajas son claras con la letra oscura (y no al revés)',
      claro(mesImpreso.bodyFondo) && claro(mesImpreso.kpiFondo) && oscuro(mesImpreso.kpiTexto),
      JSON.stringify(mesImpreso));

    // …y da igual el tema que tengas puesto. En modo claro `html:not(.dark)` (0,1,1) le ganaba a
    // `html` (0,0,1) y el papel se quedaba con los tokens de PANTALLA: fondo gris en vez de blanco.
    const enLosDosTemas = await page.evaluate(async () => {
      const mide = () => {
        const cs = getComputedStyle(document.documentElement);
        return { ink: cs.getPropertyValue('--ink').trim(), bg: cs.getPropertyValue('--bg').trim(),
          card: cs.getPropertyValue('--card').trim() };
      };
      const eraOscuro = document.documentElement.classList.contains('dark');
      document.documentElement.classList.add('dark');
      const oscuro = mide();
      document.documentElement.classList.remove('dark');
      const claro = mide();
      if (eraOscuro) document.documentElement.classList.add('dark');
      return { oscuro, claro };
    });
    await page.emulateMedia({ media: 'screen' });
    const papel = (t) => t.bg === '#ffffff' && t.card === '#ffffff' && t.ink === '#111827';
    check('la hoja impresa sale igual con el tema oscuro y con el claro',
      papel(enLosDosTemas.oscuro) && papel(enLosDosTemas.claro), JSON.stringify(enLosDosTemas));

    // lo plegado se despliega para imprimir, y se vuelve a plegar al terminar
    await page.evaluate(() => { window.__print = 0; window.print = function () { window.__print++; }; });
    await gotoTab('shop');
    await page.waitForTimeout(350);
    const compra = await page.evaluate(() => {
      const P = window.PG;
      // se parte del estado de fábrica a propósito: si una prueba anterior dejó las secciones
      // abiertas, esto comprobaría el mecanismo sobre nada y pasaría con el fallo dentro
      P.ui.compraCerradas = new Set(['rutina', 'basicos', 'casa']);
      P.render();
      const antes = { cerradas: [...P.ui.compraCerradas].sort().join(),
        lineas: document.querySelectorAll('#main .lcompra li').length };
      P.imprimir();
      const durante = { print: window.__print, cerradas: [...P.ui.compraCerradas].length,
        lineas: document.querySelectorAll('#main .lcompra li').length };
      window.dispatchEvent(new Event('afterprint'));
      const despues = { cerradas: [...P.ui.compraCerradas].sort().join(),
        lineas: document.querySelectorAll('#main .lcompra li').length };
      return { antes, durante, despues };
    });
    check('imprimir la compra despliega las secciones plegadas: irías al súper sin ellas',
      compra.antes.cerradas.length > 0 && compra.durante.cerradas === 0 &&
      compra.durante.lineas > compra.antes.lineas && compra.durante.print === 1,
      JSON.stringify(compra));
    check('y al terminar de imprimir la pantalla queda como estaba',
      compra.despues.cerradas === compra.antes.cerradas && compra.despues.lineas === compra.antes.lineas,
      JSON.stringify(compra));

    await gotoTab('week');
    await page.waitForTimeout(350);
    const semana = await page.evaluate(() => {
      const P = window.PG;
      const antes = { abiertos: document.querySelectorAll('.drow.open').length,
        comidas: document.querySelectorAll('#main .meal').length };
      P.imprimir();
      const durante = { abiertos: document.querySelectorAll('.drow.open').length,
        comidas: document.querySelectorAll('#main .meal').length };
      window.dispatchEvent(new Event('afterprint'));
      const despues = { abiertos: document.querySelectorAll('.drow.open').length };
      return { antes, durante, despues };
    });
    check('imprimir la semana saca las comidas de los siete días, no solo los encabezados',
      semana.durante.abiertos === 7 && semana.durante.comidas > semana.antes.comidas &&
      semana.despues.abiertos === semana.antes.abiertos,
      JSON.stringify(semana));

    // ---- y ahora el papel de verdad, no el DOM ----
    // Todo lo de arriba mira el DOM con `emulateMedia({media:'print'})`, y con eso NO se caza el
    // fallo que el usuario veía en el móvil: las 30 casillas estaban ahí, medían lo que tenían
    // que medir y su texto seguía dentro del PDF… tapado. `.card::before` es una capa absoluta
    // que cubre la tarjeta entera con un degradado casi transparente; al imprimir SIN gráficos de
    // fondo (lo que viene marcado por defecto) Chrome la pinta como un rectángulo blanco opaco y
    // se lleva por delante lo que hay debajo. Solo sobrevivía la casilla de hoy, que lleva
    // z-index y queda por encima de la capa. Por eso esta prueba imprime de verdad —page.pdf()—
    // y cuenta PÍXELES: es lo único que distingue «está en el papel» de «está en el PDF».
    const pdfPath = path.join(require('os').tmpdir(), 'organizador-mes-' + process.pid + '.pdf');
    // OJO: `emulateMedia({media:'screen'})` de las comprobaciones de arriba sigue puesto, y ese
    // forzado también manda dentro de page.pdf(): sin quitarlo, el PDF sale con los estilos de
    // PANTALLA y esta prueba mide otra cosa. Pasó con el fallo dentro por esto exactamente.
    await page.emulateMedia({ media: null });
    await gotoTab('month');
    await page.waitForTimeout(350);
    await page.pdf({ path: pdfPath, format: 'Letter', printBackground: false });
    const visor = await browser.newPage({ viewport: { width: 700, height: 900 } });
    await visor.goto('file://' + pdfPath + '#toolbar=0&navpanes=0&zoom=page-fit', { waitUntil: 'load' });
    await visor.waitForTimeout(2500);
    const hoja = await visor.screenshot();
    await visor.close();
    const lienzo = await browser.newPage();
    const tinta = await lienzo.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] < 225 || d[i + 1] < 225 || d[i + 2] < 225) n++;
      return n;
    }, hoja.toString('base64'));
    await lienzo.close();
    try { fs.unlinkSync(pdfPath); } catch (e) { /* da igual */ }
    // medido: con el velo delante, 21 230 píxeles (los bordes de las tarjetas y una sola casilla);
    // con el velo fuera, 64 780. El listón va en medio y bien lejos de los dos.
    check('el mes impreso llega al papel entero, no solo la casilla de hoy',
      tinta > 40000, JSON.stringify({ tinta, listón: 40000 }));
  }

  // ===================== Las dos horas del sueño, siempre a la vista =====================
  {
    // Antes: en «Hoy» solo salía la hora RECOMENDADA de acostarse (un KPI que decía «a la cama»)
    // y la de levantarse no salía en ninguna parte; en «Semana» las dos horas solo aparecían
    // abriendo el día, y en modo plantilla ni eso —`sl` y `nt` se calculaban en la fila y no se
    // usaban en ningún sitio—. Ahora van juntas debajo de la franja, siempre, en las dos pantallas.
    await gotoTab('hoy');
    await page.waitForTimeout(250);
    const hoySueno = await page.evaluate(() => {
      const P = window.PG, k = P.iso(new Date()), sl = P.sleepOf(k);
      const tira = document.querySelector('#main .drsol');
      return { bed: sl.bed, wake: sl.wake, txt: tira ? tira.innerText : '' };
    });
    check('«Hoy» enseña las dos horas del sueño sin tocar nada',
      !!hoySueno.bed && !!hoySueno.wake &&
      hoySueno.txt.includes('🛌 ' + hoySueno.bed) && hoySueno.txt.includes('⏰ ' + hoySueno.wake),
      JSON.stringify(hoySueno));

    await gotoTab('week');
    await page.waitForTimeout(300);
    // se prueban LOS DOS modos: en plantilla no hay fecha, y era justo ahí donde «Semana» no
    // enseñaba ni una de las dos horas (las del sueño salen del tipo de día, no de la fecha)
    const semSueno = await page.evaluate(async () => {
      const P = window.PG, modoAntes = P.store.rotation.mode;
      const mide = () => {
        const filas = [...document.querySelectorAll('.drow')];
        return { dias: filas.length,
          abiertos: filas.filter((f) => f.classList.contains('open')).length,
          conLasDos: filas.filter((f) => {
            const t = f.querySelector('.drsol');
            if (!t) return false;
            const x = t.innerText;
            // el día de después de una guardia se duerme DOS veces y no hay hora de levantarse: esa
            // mañana vienes de trabajar. Ahí las dos horas son la siesta y la cama, no ⏰ y 🛌.
            return (/🛌/.test(x) && /⏰/.test(x)) || (/😴/.test(x) && /🛌/.test(x));
          }).length };
      };
      P.store.rotation.mode = 'date'; P.save(); P.render();
      const porFecha = mide();
      P.store.rotation.mode = 'template'; P.save(); P.render();
      const enPlantilla = mide();
      P.store.rotation.mode = modoAntes; P.save(); P.render();
      return { porFecha, enPlantilla };
    });
    check('los siete días de «Semana» enseñan sus dos horas sin abrirlos, por fecha y en plantilla',
      semSueno.porFecha.dias === 7 && semSueno.porFecha.conLasDos === 7 && semSueno.porFecha.abiertos === 0 &&
      semSueno.enPlantilla.dias === 7 && semSueno.enPlantilla.conLasDos === 7,
      JSON.stringify(semSueno));

    // y si acostándote a esa hora no llegas a tu mínimo, lo dice y calcula la hora que tocaría
    const corto = await page.evaluate(() => {
      const P = window.PG;
      const guardado = JSON.parse(JSON.stringify(P.store.rhythm['sh-t']));
      // «Semana» ya no es de lunes a domingo: empieza HOY. Se pone hoy como día de trabajo para
      // no depender de lo que otras pruebas hayan dejado en los días que vienen
      const hoyK = P.iso(new Date()), ovAntes = P.dayOverride(hoyK);
      P.setDayOverride(hoyK, 'sh-t', '');
      P.store.rhythm['sh-t'].sleep = '01:30';
      P.store.rhythm['sh-t'].wake = '06:50';
      P.save(); P.render();
      // el día de saliente TAMBIÉN puede marcarse corto (por la noche, que tiene su propio mínimo),
      // así que hay que buscar el día que esta prueba ha tocado —el de trabajo— y no «el primero
      // que esté marcado»: si no, se comprueba el texto de otro día y por otro motivo
      const f = [...document.querySelectorAll('.drow')].find((x) => {
        const tag = x.querySelector('.drtag');
        return x.querySelector('.pie.sue.corto') && tag && /Día de trabajo/i.test(tag.innerText || '');
      });
      const txt = f ? f.querySelector('.drsol').innerText : '';
      P.store.rhythm['sh-t'] = guardado;
      P.setDayOverride(hoyK, ovAntes ? ovAntes.shift : null, ovAntes ? ovAntes.guard : '');
      P.save(); P.render();
      return txt;
    });
    check('dormir menos de tu mínimo se marca y dice a qué hora tocaría acostarse',
      /te faltan/.test(corto) && /a la cama a las/.test(corto), corto);

    // y sin horas puestas no se queda en blanco: dice qué falta
    const vacio = await page.evaluate(() => {
      const P = window.PG;
      const guardado = JSON.parse(JSON.stringify(P.store.rhythm['sh-t']));
      const hoyK = P.iso(new Date()), ovAntes = P.dayOverride(hoyK);
      P.setDayOverride(hoyK, 'sh-t', '');
      P.store.rhythm['sh-t'].sleep = ''; P.store.rhythm['sh-t'].wake = '';
      P.save(); P.render();
      const f = [...document.querySelectorAll('.drow')].find((x) => x.querySelector('.pie.sue.falta'));
      const txt = f ? f.querySelector('.drsol').innerText : '';
      P.store.rhythm['sh-t'] = guardado;
      P.setDayOverride(hoyK, ovAntes ? ovAntes.shift : null, ovAntes ? ovAntes.guard : '');
      P.save(); P.render();
      return txt;
    });
    check('un tipo de día sin horas puestas dice qué falta en vez de dejar el hueco vacío',
      /sin horas puestas/.test(vacio), vacio);
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
    // el orden se comprueba por posiciones RELATIVAS, no por el número de tarjeta: entre «lo que
    // hay que hacer» caben más cosas con el tiempo (la compra, por ejemplo) y eso no rompe nada
    check('«Hoy» junta las cinco patas del día y las ordena: el día, lo que hay que hacer y, al final, lo de consulta',
      dia.dia === 0 && dia.entrenar === 1 && dia.tareas === 2 && dia.pagar > dia.tareas &&
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
    // pegar la rutina a un tipo de día se hace dentro de «editar», junto al resto de la rutina
    await page.click('[data-a="rt-editar"][data-id="rt-test"]');
    await page.waitForTimeout(280);
    const chips = await page.evaluate(() => document.querySelectorAll('[data-a="rt-dia"]').length);
    const shHoy = await page.evaluate(() => window.PG.dayInfo(window.PG.iso(new Date())).shiftId);
    await page.click(`[data-a="rt-dia"][data-sh="${shHoy}"]`);
    await page.waitForTimeout(320);
    await page.click('.subcab [data-a="gym-panel"][data-p="rutinas"]');
    await page.waitForTimeout(280);
    await page.click('.subcab [data-a="gym-panel"][data-p=""]');
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
    // y empezarla desde «Hoy» abre la sesión, quita el aviso y te deja ENTRENANDO.
    // Antes esta prueba exigía que al empezar aparecieran ya las 7 series en el registro; eso era
    // el fallo, no la intención: ui.gymSesionActiva no se guarda, así que cerrar la app a medias
    // dejaba en el historial series que no habías hecho. Ahora cada serie entra al apuntarla.
    const seriesAntes = await page.evaluate(() => window.PG.gymS().registro.filter((x) => x.sesionId).length);
    const bot = await page.$('#main [data-a="ses-empezar"]');
    if (bot) { await bot.click(); await page.waitForTimeout(400); }
    const trasG = await page.evaluate(() => ({
      sesion: !!window.PG.ui.gymSesionActiva,
      series: window.PG.gymS().registro.filter((x) => x.sesionId).length,
      entrenando: window.PG.ui.gymPanel === 'vivo' && !!document.querySelector('#main .gvhero'),
      yaNoAvisa: ![...document.querySelectorAll('#main .card')].some((x) => /toca entrenar/.test(x.textContent)),
    }));
    check('una rutina se pega a un tipo de día, y entonces «hoy toca entrenar» sale en Entreno y en Hoy',
      chips >= 3 && enEntreno.hay && enEntreno.rutina && enEntreno.ultimoPeso && enEntreno.empezar &&
      enHoyG && trasG.sesion && trasG.entrenando && trasG.series === seriesAntes && trasG.yaNoAvisa,
      JSON.stringify({ chips, enEntreno, enHoyG, seriesAntes, trasG }));
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
    // el número de puertas no está congelado: lo que importa es que la portada NO tenga campos
    // —que era el problema: 7,7 pantallas de formulario— y que cada tarea tenga la suya. «Ir y
    // volver» es una más, y tiene que estar: es lo que decide a qué hora sales de casa y comes.
    check('Turno y rotación es una portada de media pantalla y una pantalla por tarea',
      portada.alto < 700 && portada.campos === 0 && portada.puertas.length >= 6 &&
      portada.puertas.indexOf('Ir y volver') >= 0 &&
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
    // Dinero es ahora ahorro: los recibos viven en su propia pantalla, y los fijos se editan desde ahí
    await page.click('#main [data-a="dinero-vista"][data-v="recibos"]');
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

  // ===================== Las horas de la guardia y del saliente =====================
  {
    // Una guardia no dura lo mismo según el día en que cae ni según de qué sea, y la app las daba
    // TODAS por 08:00–08:00: el tipo de día traía una sola pareja de horas. Lo real es
    //   · entre semana entras a tu jornada (8:00) y la guardia empieza al acabarla (15:00);
    //   · el sábado y el domingo entras a la hora del relevo (9:00 urgencias, 10:00 UMI);
    //   · sales a la hora del relevo DEL DÍA EN QUE SALES, no del día en que entraste;
    //   · y en UMI hay pase de guardia, así que sales más tarde.
    // Y el día siguiente no empieza en casa: de 00:00 hasta que te relevan sigues trabajando, y
    // luego se duerme DOS veces (la siesta al llegar y por la noche lo de siempre).
    const casos = await page.evaluate(() => {
      const P = window.PG;
      P.store.rotation.mode = 'date';
      const G = P.store.shifts.filter(P.isGuardia)[0];
      // octubre de 2026: el 6 es martes, el 2 viernes, el 3 sábado y el 4 domingo
      const dias = { martes: '2026-10-06', viernes: '2026-10-02', sabado: '2026-10-03', domingo: '2026-10-04' };
      const out = {};
      ['urg', 'umi'].forEach((tipo) => {
        Object.keys(dias).forEach((nm) => {
          const k = dias[nm];
          P.setDayOverride(k, G.id, tipo); P.render();
          const g = P.guardiaHoras(k, tipo);
          const sig = P.addDays(P.parseDate(k), 1);
          const k2 = sig.getFullYear() + '-' + String(sig.getMonth() + 1).padStart(2, '0') + '-' + String(sig.getDate()).padStart(2, '0');
          const sal = P.salidaDeGuardia(k2), sl = P.sleepOf(k2);
          out[tipo + ' ' + nm] = { entra: g.desde, guardia: g.guardia, sale: g.sale,
            salienteHasta: sal ? sal.sale : null, siesta: sl.siesta ? sl.siesta.de + '–' + sl.siesta.a : null };
          P.setDayOverride(k, null); P.render();
        });
      });
      return out;
    });
    const esperado = {
      'urg martes':  { entra: '08:00', guardia: '15:00', sale: '08:00' },
      'urg viernes': { entra: '08:00', guardia: '15:00', sale: '09:00' },
      'urg sabado':  { entra: '09:00', guardia: '09:00', sale: '09:00' },
      'urg domingo': { entra: '09:00', guardia: '09:00', sale: '08:00' },
      'umi martes':  { entra: '08:00', guardia: '15:00', sale: '09:15' },
      'umi viernes': { entra: '08:00', guardia: '15:00', sale: '11:15' },
      'umi sabado':  { entra: '10:00', guardia: '10:00', sale: '11:15' },
      'umi domingo': { entra: '10:00', guardia: '10:00', sale: '09:15' },
    };
    const fallan = Object.keys(esperado).filter((k) => {
      const a = casos[k] || {}, b = esperado[k];
      return a.entra !== b.entra || a.guardia !== b.guardia || a.sale !== b.sale;
    });
    check('la guardia entra y sale a su hora según el día y el tipo, con el pase de UMI incluido',
      fallan.length === 0, JSON.stringify({ fallan, casos }));
    // el día de después: sigues trabajando hasta el relevo, y ahí empieza la siesta
    const salienteOk = Object.keys(esperado).every((k) => casos[k] && casos[k].salienteHasta === esperado[k].sale) &&
      Object.keys(esperado).every((k) => casos[k] && !!casos[k].siesta);
    check('el día de después de la guardia trabaja hasta el relevo y luego duerme la siesta',
      salienteOk, JSON.stringify(casos));

    // …y ahora la cadena: cambiar la hora DESDE LA PANTALLA y que el mes se entere. El campo vive
    // en el switch de `change`, así que hay que salir del campo: con page.fill() a secas no salta.
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'cfg'; P.ui.cfgVista = 'rotacion'; P.render(); });
    await page.waitForTimeout(350);
    const campo = await page.$('[data-a="gtipo-finde"][data-code="umi"]');
    if (campo) { await campo.fill('11:30'); await page.keyboard.press('Tab'); await page.waitForTimeout(300); }
    const trasCambio = await page.evaluate(() => {
      const P = window.PG;
      const G = P.store.shifts.filter(P.isGuardia)[0];
      P.setDayOverride('2026-10-03', G.id, 'umi'); P.render();
      const g = P.guardiaHoras('2026-10-03', 'umi');
      // y que la hora sobreviva a recargar: normalize() tira todo campo que no conozca
      P.store = JSON.parse(JSON.stringify(P.store));
      const tras = P.gTipo('umi');
      const g2 = P.guardiaHoras('2026-10-03', 'umi');
      P.setDayOverride('2026-10-03', null); P.render();
      return { entra: g.desde, sale: g.sale, guardadoFinde: tras.relevoFinde, guardadoPase: tras.pase, saleTrasRecargar: g2.sale };
    });
    check('cambiar la hora del relevo desde la pantalla recalcula la guardia, y la hora se guarda',
      trasCambio.entra === '11:30' && trasCambio.sale === '12:45' &&
      trasCambio.guardadoFinde === '11:30' && trasCambio.guardadoPase === 75 &&
      trasCambio.saleTrasRecargar === '12:45',
      JSON.stringify(trasCambio));
    await page.evaluate(() => { window.PG.setHorasTipo('umi', 'relevoFinde', '10:00'); });
  }

  // ===================== «Hoy» se mueve por días =====================
  {
    // «Hoy» enseñaba hoy y solo hoy: para ver qué tocaba mañana había que ir a «Semana» y abrir el
    // día. Ahora se mueve con las flechas de la propia tarjeta y con las ‹ › de la barra de arriba,
    // y pulsar «Hoy» en la barra de modos vuelve al día de hoy (si no, «Hoy» no llevaba a hoy).
    await gotoTab('hoy');
    await page.waitForTimeout(300);
    const lee = () => page.evaluate(() => ({
      titulo: ((document.querySelector('#main .card h2') || {}).innerText || '').replace(/\n/g, ' | '),
      rotulo: (document.getElementById('wkLabel') || {}).textContent || '',
      flechas: !document.getElementById('wkNav').hidden,
      dia: window.PG.ui.diaHoy || '',
    }));
    // si un botón no está, la prueba tiene que FALLAR, no tumbar la suite con un timeout de 30 s:
    // ya pasó dos veces en este repositorio, y una suite abortada no dice qué se ha roto
    const toca = async (sel) => { const el = await page.$(sel); if (el) await el.click();
      await page.waitForTimeout(280); return !!el; };
    const pasos = []; const hubo = [];
    pasos.push(await lee());                                            // 0 · al entrar
    hubo.push(await toca('[data-a="dia-next"]')); pasos.push(await lee());   // 1 · mañana
    hubo.push(await toca('[data-a="wk-next"]')); pasos.push(await lee());    // 2 · flecha de arriba
    hubo.push(await toca('[data-a="dia-hoy"]')); pasos.push(await lee());    // 3 · volver a hoy
    hubo.push(await toca('[data-a="dia-prev"]')); pasos.push(await lee());   // 4 · ayer
    hubo.push(await toca('#calModes button[data-t="hoy"]')); pasos.push(await lee());  // 5 · «Hoy»
    const hoyIso = isoDate(new Date());
    const mas = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); };
    check('«Hoy» se mueve por días con sus flechas y con las de la barra, y vuelve a hoy',
      hubo.every(Boolean) &&
      pasos[0].dia === '' && /Hoy ·/.test(pasos[0].titulo) && pasos[0].flechas &&
      pasos[1].dia === mas(1) && /MAÑANA/i.test(pasos[1].titulo) &&
      pasos[2].dia === mas(2) &&
      pasos[3].dia === '' && /Hoy ·/.test(pasos[3].titulo) &&
      pasos[4].dia === mas(-1) && /AYER/i.test(pasos[4].titulo) &&
      pasos[5].dia === '' && pasos[5].rotulo.indexOf('hoy') >= 0,
      JSON.stringify({ hubo, pasos }));
    // y lo que se ve es el día al que has ido, no el de hoy: el tipo de día tiene que cambiar
    const otroDia = await page.evaluate(() => {
      const P = window.PG;
      const G = P.store.shifts.filter(P.isGuardia)[0];
      const d = new Date(); d.setDate(d.getDate() + 3);
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      P.setDayOverride(k, G.id, 'umi');
      P.ui.diaHoy = k; P.render();
      const txt = (document.querySelector('#main .card h2') || {}).innerText || '';
      const cuerpo = (document.querySelector('#main .card') || {}).innerText || '';
      P.setDayOverride(k, null); P.ui.diaHoy = ''; P.render();
      return { txt: txt, guardia: /Guardia/.test(cuerpo), umi: /UMI/.test(cuerpo) };
    });
    check('el día al que te mueves enseña SU turno, no el de hoy',
      otroDia.guardia && otroDia.umi, JSON.stringify(otroDia));
  }

  // ===================== Imprimir el Mes: solo el calendario, a una cara =====================
  {
    // Imprimir desde «Mes» es para colgarlo en la pared, así que tiene que salir la cuadrícula SOLA
    // y en UNA hoja. Antes salían tres páginas: el calendario pequeño arriba del todo y detrás los
    // KPI, las vacaciones, la agenda y los desplegables de configuración.
    // Se mide con page.pdf() y contando páginas: con emulateMedia el DOM decía lo mismo con y sin
    // el arreglo, porque el fallo estaba en cuántas hojas salen, no en qué hay en el DOM.
    await gotoTab('month');
    await page.waitForTimeout(350);
    await page.emulateMedia({ media: null });
    const tarjetas = await page.evaluate(() => {
      const P = window.PG;
      const antes = window.print; window.print = function () {};
      P.imprimir();
      const html = document.documentElement.classList.contains('imp-mes');
      window.print = antes;
      return { html: html, monSel: P.ui.monSel };
    });
    const pdf = await page.pdf({ format: 'Letter', printBackground: false });
    const paginas = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    const visibles = await page.evaluate(() => {
      // con la clase puesta, en papel solo queda la tarjeta del calendario y sus 30 casillas
      return new Promise((res) => {
        const vis = (el) => getComputedStyle(el).display !== 'none';
        res({ cards: [...document.querySelectorAll('#main .card')].filter(vis).length,
          calmes: [...document.querySelectorAll('#main .card.calmes')].filter(vis).length,
          celdas: [...document.querySelectorAll('#main .dbox')].filter(vis).length });
      });
    });
    await page.evaluate(() => { window.dispatchEvent(new Event('afterprint')); });
    await page.waitForTimeout(300);
    const limpio = await page.evaluate(() => document.documentElement.classList.contains('imp-mes'));
    check('imprimir el Mes saca solo el calendario y en una sola hoja',
      tarjetas.html === true && paginas === 1 && visibles.calmes === 1 && visibles.celdas >= 28,
      JSON.stringify({ tarjetas, paginas, visibles }));
    check('y al terminar de imprimir el Mes la pantalla vuelve a estar entera',
      limpio === false, JSON.stringify({ limpio }));
  }

  // ===================== «Semana» se mueve de semana desde la pantalla =====================
  {
    // Mes y Hoy se mueven desde la propia pantalla («‹ septiembre 2026 › mes actual», «‹ jue ·
    // volver a hoy · sáb ›»); «Semana» solo tenía las flechas de la barra de arriba, y solo en modo
    // «por fecha». Si no mirabas ahí, no había manera de ver la semana que viene.
    await gotoTab('week');
    await page.waitForTimeout(320);
    const toca = async (sel) => { const el = await page.$(sel); if (el) await el.click();
      await page.waitForTimeout(300); return !!el; };
    const lee = () => page.evaluate(() => {
      const nav = document.querySelector('#main .semnav');
      const lun = window.PG.mondayOf(window.PG.weekDays()[0].date || new Date());
      return { hay: !!nav, txt: nav ? nav.innerText.replace(/\n/g, ' | ') : '',
        modo: window.PG.store.rotation.mode,
        lunes: window.PG.store.rotation.mode === 'date' && window.PG.weekDays()[0].key ? window.PG.weekDays()[0].key : '' };
    });
    // en plantilla no hay fechas, así que no hay semana anterior ni siguiente: lo que ofrece es
    // pasarse a «por fecha», que es justo lo que hace falta para poder moverse
    await page.evaluate(() => { window.PG.store.rotation.mode = 'template'; window.PG.save(); window.PG.render(); });
    await page.waitForTimeout(300);
    const enPlantilla = await lee();
    const hubo = [];
    hubo.push(await toca('#main .semnav [data-a="mode-date"]'));
    const pasos = [await lee()];
    hubo.push(await toca('#main .semnav [data-a="wk-next"]')); pasos.push(await lee());
    hubo.push(await toca('#main .semnav [data-a="wk-next"]')); pasos.push(await lee());
    hubo.push(await toca('#main .semnav [data-a="today"]'));   pasos.push(await lee());
    hubo.push(await toca('#main .semnav [data-a="wk-prev"]')); pasos.push(await lee());
    const dia = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDate(d); };
    const base = pasos[0].lunes;
    check('«Semana» se mueve de semana desde la propia pantalla, y vuelve a esta semana',
      enPlantilla.hay && /plantilla/i.test(enPlantilla.txt) &&
      hubo.every(Boolean) && pasos[0].modo === 'date' && !!base &&
      pasos[1].lunes === dia(base, 7) && pasos[2].lunes === dia(base, 14) &&
      pasos[3].lunes === base && pasos[4].lunes === dia(base, -7),
      JSON.stringify({ enPlantilla, hubo, pasos }));
  }

  // ============ La comida principal no está a una hora fija, y «Semana» dice qué vas a hacer ============
  {
    // La hora de comer no la manda el tipo de día: la manda lo que haces ese día. Si entrenas cae
    // después del entreno (18:00–18:30), si no al salir de la jornada (14:00–15:00), y el día que
    // sales de guardia, al despertar de la siesta — una hora que depende de cuándo te relevaron.
    // Antes era una lista fija por tipo de día y el mismo «Día de trabajo» decía 14:30 entrenaras o no.
    // los días se ponen A MANO: dejar que los traiga el patrón hace que la prueba dependa de lo que
    // haya dejado puesto otra anterior, y ya pasó — la semana salió sin ningún saliente
    const horas = await page.evaluate(() => {
      const P = window.PG;
      P.store.rotation.mode = 'date';
      const k = (x) => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
      const lun = P.mondayOf(new Date());
      const d = (n) => k(P.addDays(lun, n));
      const G = P.store.shifts.filter(P.isGuardia)[0];
      const S = P.store.shifts.filter((x) => /saliente/i.test(x.name || ''))[0];
      const F = P.store.shifts.filter((x) => /fuerza/i.test(x.name || ''))[0];
      const L = P.store.shifts.filter((x) => /libre/i.test(x.name || ''))[0];
      P.setDayOverride(d(0), G.id, 'umi');   // lunes de guardia
      P.setDayOverride(d(1), S.id);          // martes saliente: viene de la guardia del lunes
      P.setDayOverride(d(2), F.id);          // miércoles de fuerza
      P.setDayOverride(d(3), L.id);          // jueves libre
      // una rutina colgada del día de fuerza: eso es «ese día entrenas»
      P.store.gym.rutinas = [{ id: 'r-test', nombre: 'Torso A', dias: ['sh-f'], ejercicios: [{ ex: 'Press banca', series: 4, reps: 8 }] }];
      P.save(); P.render();
      const mide = (n) => { const key = d(n), cp = P.comidaPrincipalDe(key); return cp ? { de: cp.de, a: cp.a, por: cp.por } : null; };
      return { guardia: mide(0), saliente: mide(1), fuerza: mide(2), libre: mide(3), lunes: d(0) };
    });
    const conEntreno = horas.fuerza, saliente = horas.saliente, libre = horas.libre;
    // El día de fuerza entrena de 6:30 a 8:00 y trabaja de 8 a 15: la ventana de «post-entreno»
    // (18:00) NO manda ahí —el entreno acabó a las ocho de la mañana—, manda la jornada, y la
    // comida cae al llegar a casa. La post-entreno vuelve a mandar con un entreno de tarde, que es
    // lo que se comprueba en el bloque de «menos scroll» del final.
    check('la comida principal se mueve con el día: al llegar del trabajo, tras el entreno de tarde o tras la siesta',
      !!conEntreno && conEntreno.por === 'llegar' && conEntreno.de > '15:00' &&
      !!libre && libre.de === '14:00' && libre.a === '15:00' &&
      !!saliente && saliente.por === 'siesta' && saliente.de > '12:00',
      JSON.stringify(horas));

    // un día de fuerza es entreno Y jornada: antes la franja pintaba solo el entreno de 6:30 a 8:00
    // y el resto del día salía vacío, como si no trabajaras
    const bloques = await page.evaluate((lunes) => {
      const P = window.PG;
      const mie = P.addDays(P.parseDate(lunes), 2);
      const key = mie.getFullYear() + '-' + String(mie.getMonth() + 1).padStart(2, '0') + '-' + String(mie.getDate()).padStart(2, '0');
      return P.bloquesTrabajo(key).map((b) => b.txt);
    }, horas.lunes);
    check('un día de entreno pinta el entreno Y la jornada, no solo el entreno',
      bloques.length >= 2 && bloques.some((t) => /entreno/.test(t)) && bloques.some((t) => /jornada/.test(t)),
      JSON.stringify(bloques));

    // «Semana» enseña lo que vas a HACER ese día, no solo la franja y las comidas. Semana ya no va de
    // lunes a domingo sino desde hoy: se pone a empezar en el lunes que esta prueba ha preparado
    await gotoTab('week');
    await page.evaluate((l) => { window.PG.ui.semDesde = l; window.PG.render(); }, horas.lunes);
    await page.waitForTimeout(350);
    const plan = await page.evaluate(() => {
      const filas = [...document.querySelectorAll('#main .drow')];
      return { dias: filas.length,
        conPlan: filas.filter((f) => f.querySelector('.drplan, .drlinea')).length,
        // las horas de trabajo van ahora junto al nombre del día («Día de trabajo · 8–15»)
        conTrabajo: filas.filter((f) => f.querySelector('.drtag .drh')).length,
        // el sueño y las horas de comer van ahora en UNA fila propia (.drlinea), no dentro de .drplan
        conComida: filas.filter((f) => f.querySelector('.drlinea .pl.com')).length,
        conGym: filas.filter((f) => f.querySelector('.drplan .pl.gym')).length,
        tags: filas.map((f) => ((f.querySelector('.drday') || {}).innerText || '') + ' ' + ((f.querySelector('.drtag') || {}).innerText || '').replace(/\s+/g, ' ')) };
    });
    check('cada día de «Semana» dice lo que vas a hacer: horas de trabajo, entreno y cuándo comes',
      // todos los días en que se trabaja (no los libres) llevan sus horas junto al nombre
      plan.dias === 7 && plan.conPlan === 7 && plan.conComida === 7 && plan.conGym >= 1 && plan.conTrabajo >= 4 &&
      plan.conTrabajo === plan.tags.filter((t) => !/libre|vacaci/i.test(t)).length,
      JSON.stringify(plan));
    await page.evaluate(() => { window.PG.ui.semDesde = ''; window.PG.render(); });

    // …y la hora se cambia desde la pantalla y sobrevive a recargar (normalize() tira lo que no conoce)
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'cfg'; P.ui.cfgVista = 'horas'; P.render(); });
    await page.waitForTimeout(350);
    const campo = await page.$('[data-a="com-h"][data-k="conEntreno"][data-w="de"]');
    if (campo) { await campo.fill('19:15'); await page.keyboard.press('Tab'); await page.waitForTimeout(320); }
    const tras = await page.evaluate((lunes) => {
      const P = window.PG;
      const mie = P.addDays(P.parseDate(lunes), 2);
      const key = mie.getFullYear() + '-' + String(mie.getMonth() + 1).padStart(2, '0') + '-' + String(mie.getDate()).padStart(2, '0');
      // sin paréntesis de seguridad, un null aquí TUMBA la suite entera en vez de hacer fallar esta
      // prueba: pasó al revertir el arreglo, que es justo cuando hace falta que falle y lo diga
      const h = (k2) => (P.comidaPrincipalDe(k2) || {}).de || '';
      // la ventana de post-entreno solo manda si el entreno acaba DESPUÉS de tu hora de comer, así
      // que para probar el ajuste el entreno de ese día se pasa a la tarde
      const F = P.store.shifts.filter((x) => /fuerza/i.test(x.name || ''))[0];
      F.start = '17:00'; F.end = '18:15'; P.save();
      const antes = h(key);
      P.store = JSON.parse(JSON.stringify(P.store));   // el viaje de ida y vuelta por normalize()
      return { antes: antes, guardado: (P.comidasCfg().conEntreno || {}).de || '', trasRecargar: h(key) };
    }, horas.lunes);
    check('cambiar la hora de comer desde la pantalla recalcula la semana, y se guarda al recargar',
      !!campo && tras.antes === '19:15' && tras.guardado === '19:15' && tras.trasRecargar === '19:15',
      JSON.stringify({ campo: !!campo, tras }));
    await page.evaluate((lunes) => {
      const P = window.PG;
      P.store.comidas.conEntreno.de = '18:00';
      // el entreno de ese día se había pasado a la tarde para probar el ajuste: se devuelve, o
      // entrena a las 17:00 el resto de la suite y cambia la hora de comer de otras pruebas
      const F2 = P.store.shifts.filter((x) => /fuerza/i.test(x.name || ''))[0];
      if (F2) { F2.start = '06:30'; F2.end = '08:00'; }
      P.store.gym.rutinas = [];
      const lun = P.parseDate(lunes);
      for (let i = 0; i < 4; i++) { const x = P.addDays(lun, i);
        P.setDayOverride(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'), null); }
      P.save(); P.render();
    }, horas.lunes);
  }

  // ===================================================================================
  // Entreno: la portada que hace cosas (la tira de la semana, el descanso por grupo y
  // el aviso con botón). Encadena gestos de verdad: se monta el choque, se toca el
  // botón que lo arregla y se comprueba que sigue arreglado al recargar.
  // ===================================================================================
  {
    const mont = await page.evaluate(() => {
      const P = window.PG, S = P.store;
      const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const lun = P.mondayOf(new Date());
      const dia = (n) => iso(P.addDays(lun, n));
      const guardia = S.shifts.filter((x) => /guardia/i.test(x.name))[0];
      const trabajo = S.shifts.filter((x) => x.id === 'sh-t')[0] || S.shifts.filter((x) => /trabajo/i.test(x.name))[0];
      // la semana entera de trabajo y una guardia el jueves: el VIERNES sales de ella, así que
      // ese día la rutina «toca» pero no vas a entrenar. Es el caso real que el aviso resuelve.
      for (let i = 0; i < 7; i++) P.setDayOverride(dia(i), trabajo.id);
      P.setDayOverride(dia(3), guardia.id, 'umi');
      S.gym.rutinas = [{ id: 'rtP', nombre: 'Torso A', notas: '', dias: [trabajo.id],
        ejercicios: [{ ex: 'Press banca', series: 4, reps: 8 }, { ex: 'Dominadas', series: 4, reps: 8 }] }];
      S.gym.registro = [
        { id: 'gp1', fecha: dia(0), ex: 'Press banca', kg: 60, reps: 8, ts: Date.now() },
        { id: 'gp2', fecha: dia(1), ex: 'Sentadilla', kg: 80, reps: 6, ts: Date.now() }];
      S.gym.sesiones = []; S.gym.cardio = []; S.gym.cambios = {};
      P.ui.gymDate = dia(4); P.ui.gymPanel = '';
      P.save();
      return { lunes: dia(0), jueves: dia(3), viernes: dia(4) };
    });
    await gotoTab('gym');
    await page.waitForTimeout(350);

    // 1 · la tira: siete días con su estado, y el viernes marcado como choque
    const tira = await page.evaluate(() => {
      const dd = [...document.querySelectorAll('#main .gday')];
      return { n: dd.length,
        estados: dd.map((e) => e.className.replace('gday', '').trim().split(' ')[0]),
        pie: (document.querySelector('#main .gtiraq') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim() };
    });
    check('«Entreno» abre con la semana delante y el día de choque marcado en rojo',
      tira.n === 7 && tira.estados.filter((x) => x === 'choque').length >= 1 && /saliente|guardia/i.test(tira.pie),
      JSON.stringify(tira));

    // 2 · tocar otro día cambia la línea que lo explica (la tira no es decoración)
    const antesPie = tira.pie;
    const botLun = await page.$('#main .gday[data-key="' + mont.lunes + '"]');
    if (botLun) { await botLun.click(); await page.waitForTimeout(300); }
    const piel = await page.evaluate(() => (document.querySelector('#main .gtiraq') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim());
    check('tocar un día de la tira cuenta lo que hay ese día, no solo lo selecciona',
      !!botLun && piel !== antesPie && piel.length > 3, JSON.stringify({ antes: antesPie, ahora: piel }));

    // 3 · el descanso por grupo muscular: lo que justifica que hoy toque torso y no pierna
    const desc = await page.evaluate(() => {
      const P = window.PG;
      const chips = [...document.querySelectorAll('#main .gm')].map((e) => ({
        txt: e.textContent.replace(/\s+/g, ' ').trim(), cl: e.className.replace('gm', '').trim() }));
      return { chips: chips, calc: (P.gymDescanso() || []).map((x) => x.reg + ':' + x.txt) };
    });
    check('la portada dice qué grupos tienes descansados y cuántos días llevan',
      desc.chips.length === 5 && desc.chips.some((c) => /\d/.test(c.txt)) && desc.chips.some((c) => c.cl === 'listo'),
      JSON.stringify(desc));

    // 4 · el aviso ya no solo avisa: trae el botón, se toca, y el cambio sobrevive a recargar.
    //     Todo lo que crea el arreglo puede no existir sin él: se lee con paréntesis de seguridad
    //     para que la prueba FALLE en vez de tumbar la suite entera.
    await page.evaluate((v) => { const P = window.PG; P.ui.gymDate = v; P.render(); }, mont.viernes);
    await page.waitForTimeout(300);
    const bot = await page.$('#main [data-a="gym-mover"]');
    let movido = { hubo: !!bot };
    if (bot) {
      await bot.click();
      await page.waitForTimeout(350);
      movido = await page.evaluate((v) => {
        const P = window.PG;
        const guardado = JSON.stringify(P.store.gym.cambios || {});
        const av = (document.querySelector('#main .gaviso.ok') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim();
        // el viaje de ida y vuelta por normalize(): un campo que no esté registrado se pierde
        P.store = JSON.parse(JSON.stringify(P.store));
        return { hubo: true, guardado: guardado, aviso: av,
          deshacer: !!document.querySelector('#main [data-a="gym-deshacer"]'),
          trasRecargar: JSON.stringify(P.store.gym.cambios || {}),
          rutinaEseDia: ((P.rutinaDeFecha(v) || {}).nombre) || null,
          sigueSonando: !!P.gymChoque(v) };
      }, mont.viernes);
    }
    check('el entreno que cae en una guardia se mueve desde el propio aviso, y sigue movido al recargar',
      movido.hubo && movido.guardado !== '{}' && movido.guardado === movido.trasRecargar &&
      movido.rutinaEseDia === null && movido.deshacer && !movido.sigueSonando,
      JSON.stringify(movido));

    // 5 · empezar otra rutina o montar una nueva sin salir a buscarlas
    const nueva = await page.$('#main [data-a="gym-nueva"]');
    if (nueva) { await nueva.click(); await page.waitForTimeout(350); }
    const enRutinas = await page.evaluate(() => ({
      panel: window.PG.ui.gymPanel,
      campo: !!document.getElementById('rtNombreNueva'),
      foco: document.activeElement && document.activeElement.id === 'rtNombreNueva' }));
    check('desde la portada se puede montar una rutina nueva sin ir a buscarla',
      !!nueva && enRutinas.panel === 'rutinas' && enRutinas.campo && enRutinas.foco, JSON.stringify(enRutinas));

    // se deja el estado como estaba para no contaminar lo que venga detrás
    await page.evaluate((m) => {
      const P = window.PG;
      P.store.gym.rutinas = []; P.store.gym.registro = []; P.store.gym.cambios = {};
      for (let i = 0; i < 7; i++) P.setDayOverride(P.iso(P.addDays(P.parseDate(m.lunes), i)), null);
      P.ui.gymPanel = ''; P.ui.gymDate = ''; P.save(); P.render();
    }, mont);
  }

  // ===================================================================================
  // Entrenar en vivo (fase 1 del informe): el peso propuesto CON SU PORQUÉ, −/+ sin
  // teclado, el esfuerzo en palabras, el récord marcado y el informe al terminar.
  // Encadena la sesión entera por la interfaz: empezar → apuntar → pasar → terminar.
  // ===================================================================================
  {
    const mont = await page.evaluate(() => {
      const P = window.PG, S = P.store;
      const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const hace = (n) => iso(P.addDays(new Date(), -n));
      S.gym.rutinas = [{ id: 'rtV', nombre: 'Torso V', notas: '', dias: [],
        ejercicios: [{ ex: 'Press banca', series: 3, reps: 8 }, { ex: 'Sentadilla', series: 3, reps: 8 }] }];
      // historial de verdad: press banca sacado entero a 60 (toca SUBIR) y sentadilla
      // atascada dos veces en 100 sin cerrarla (toca BAJAR un 10 %)
      S.gym.registro = [
        { id: 'w1', fecha: hace(7), ex: 'Press banca', kg: 60, reps: 8, rpe: 8, ts: 1 },
        { id: 'w2', fecha: hace(7), ex: 'Press banca', kg: 60, reps: 8, rpe: 8, ts: 2 },
        { id: 'w3', fecha: hace(7), ex: 'Press banca', kg: 60, reps: 8, rpe: 8, ts: 3 },
        { id: 'w4', fecha: hace(14), ex: 'Sentadilla', kg: 100, reps: 5, rpe: 10, ts: 4 },
        { id: 'w5', fecha: hace(14), ex: 'Sentadilla', kg: 100, reps: 5, rpe: 10, ts: 5 },
        { id: 'w6', fecha: hace(14), ex: 'Sentadilla', kg: 100, reps: 5, rpe: 10, ts: 6 },
        { id: 'w7', fecha: hace(7), ex: 'Sentadilla', kg: 100, reps: 6, rpe: 10, ts: 7 },
        { id: 'w8', fecha: hace(7), ex: 'Sentadilla', kg: 100, reps: 6, rpe: 10, ts: 8 },
        { id: 'w9', fecha: hace(7), ex: 'Sentadilla', kg: 100, reps: 6, rpe: 10, ts: 9 }];
      S.gym.sesiones = []; S.gym.cardio = []; S.gym.cambios = {};
      P.ui.gymSesionActiva = null; P.ui.gymInforme = ''; P.ui.gymPanel = 'rutinas';
      P.save(); P.render();
      return { antes: S.gym.registro.length };
    });
    await page.waitForTimeout(300);

    // 1 · empezar ya no monta las series por adelantado. Antes metía las 6 de golpe en el
    //     registro con el peso de la última vez; como ui.gymSesionActiva NO se guarda, cerrar
    //     la app a medias dejaba en el historial series que no habías hecho.
    const emp = await page.$('#main [data-a="ses-empezar"][data-id="rtV"]');
    if (emp) { await emp.click(); await page.waitForTimeout(400); }
    const arranque = await page.evaluate(() => ({
      panel: window.PG.ui.gymPanel,
      registro: window.PG.store.gym.registro.length,
      hayPantalla: !!document.querySelector('#main .gvhero') }));
    check('empezar una rutina te deja entrenando y no mete en tu historial series que no has hecho',
      !!emp && arranque.panel === 'vivo' && arranque.hayPantalla && arranque.registro === mont.antes,
      JSON.stringify({ emp: !!emp, arranque, antes: mont.antes }));

    // 2 · el peso propuesto Y SU PORQUÉ: sube donde la cerraste, baja donde llevas dos atascado
    const porque = await page.evaluate(() => {
      const P = window.PG;
      const hoy = P.iso(new Date());
      const v = document.querySelector('#main .gvpor');
      return { enPantalla: v ? v.textContent.replace(/\s+/g, ' ').trim() : '',
        clase: v ? v.className : '',
        kg: (document.querySelectorAll('#main .gvnum .v')[0] || { textContent: '' }).textContent.trim(),
        banca: P.progresionDe('Press banca', 3, 8, hoy),
        sent: P.progresionDe('Sentadilla', 3, 8, hoy) };
    });
    check('la pantalla de entrenar dice qué peso toca y por qué: sube donde la cerraste, baja donde te atascaste',
      porque.banca.cl === 'sube' && porque.banca.kg === 62.5 &&
      porque.sent.cl === 'baja' && porque.sent.kg === 90 &&
      /clase/.test('clase') && porque.clase.indexOf('sube') >= 0 &&
      porque.kg === '62,5' && /Sube a 62,5/.test(porque.enPantalla),
      JSON.stringify(porque));

    // 3 · el esfuerzo va en palabras, y −/+ mueven el peso sin teclado
    const masKg = await page.$('#main [data-a="gv-kg"][data-d="2.5"]');
    if (masKg) { await masKg.click(); await page.waitForTimeout(200); }
    const duro = await page.$('#main [data-a="gv-rpe"][data-d="9"]');
    if (duro) { await duro.click(); await page.waitForTimeout(200); }
    const mandos = await page.evaluate(() => ({
      kg: (document.querySelectorAll('#main .gvnum .v')[0] || { textContent: '' }).textContent.trim(),
      palabras: [...document.querySelectorAll('#main .gvesf .btn')].map((e) => e.textContent.trim()),
      marcado: (document.querySelector('#main .gvesf .btn.on') || { textContent: '' }).textContent.trim() }));
    check('el peso se mueve con −/+ sin teclado y el esfuerzo se dice en palabras, no en números',
      !!masKg && !!duro && mandos.kg === '65' &&
      mandos.palabras.join('/') === 'fácil/justo/duro/al fallo' && mandos.marcado === 'duro',
      JSON.stringify(mandos));

    // 4 · apuntar añade UNA serie, marca el récord y al acabar el ejercicio pasa solo al siguiente
    for (let i = 0; i < 3; i++) {
      const b = await page.$('#main [data-a="gv-apuntar"]');
      if (b) { await b.click(); await page.waitForTimeout(260); }
    }
    const tras = await page.evaluate(() => {
      const P = window.PG;
      const ses = P.store.gym.registro.filter((x) => x.sesionId === (P.ui.gymSesionActiva || {}).id);
      return { nuevas: ses.length,
        rpe: ses.length ? ses[0].rpe : null,
        kg: ses.length ? ses[0].kg : null,
        ejercicioAhora: (document.querySelector('#main .gvex b') || { textContent: '' }).textContent.trim(),
        anillo: (document.querySelector('#main .gvanillo text') || { textContent: '' }).textContent.trim(),
        estrellas: [...document.querySelectorAll('#main .gvchip.pr')].length };
    });
    check('apuntar añade una serie sola, guarda el esfuerzo y al acabar el ejercicio pasa al siguiente',
      tras.nuevas === 3 && tras.rpe === 9 && tras.kg === 65 &&
      tras.ejercicioAhora === 'Sentadilla' && tras.anillo === '3',
      JSON.stringify(tras));

    // 5 · el informe al terminar: volumen, comparación y récords
    const fin = await page.$('#main [data-a="gv-terminar"]');
    if (fin) { await fin.click(); await page.waitForTimeout(450); }
    const informe = await page.evaluate(() => {
      const P = window.PG;
      const ses = P.store.gym.sesiones[P.store.gym.sesiones.length - 1] || null;
      return { hay: !!document.querySelector('#main .gvfin'),
        tit: (document.querySelector('#main .gvfint') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(),
        kpis: [...document.querySelectorAll('#main .gvfin .kpis div')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
        recs: [...document.querySelectorAll('#main .gvrecs .gvchip')].map((e) => e.textContent.trim()),
        plan: ses ? ses.plan : null, completo: ses ? ses.completo : null,
        abierta: !!P.ui.gymSesionActiva };
    });
    check('al terminar sale el informe con el volumen, las series planeadas y los récords',
      !!fin && informe.hay && !informe.abierta && informe.plan === 6 && informe.completo === false &&
      /a medias/.test(informe.tit) && /2 de 6|3 de 6/.test(informe.tit) &&
      informe.kpis.some((k) => /kg movidos/.test(k)) && informe.recs.length >= 1 &&
      /Press banca/.test(informe.recs.join(' ')),
      JSON.stringify(informe));

    await page.evaluate(() => {
      const P = window.PG;
      P.store.gym.rutinas = []; P.store.gym.registro = []; P.store.gym.sesiones = [];
      P.ui.gymInforme = ''; P.ui.gymPanel = ''; P.ui.gymSesionActiva = null; P.ui.gymVivo = null; P.ui.gymDesc = null;
      P.save(); P.render();
    });
  }

  // ===================== Mes: el mes en el que estás corre con la semana =====================
  {
    // «que el calendario se mueva según las semanas, que solo vea 2 semanas anteriores a la que estoy
    // y la mayoría delante»: en el mes actual, dos semanas antes de la de hoy, la de hoy y cuatro más.
    // Los otros meses siguen enteros, con una semana de margen a cada lado.
    await gotoTab('month');
    const mb = await page.$('#main [data-a="mon-today"]');
    if (mb) await mb.click();
    await page.waitForTimeout(300);
    const rej = await page.evaluate(() => {
      const celdas = [...document.querySelectorAll('#main .cal .dbox')];
      const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const h = new Date(); h.setHours(12, 0, 0, 0);
      const lun = new Date(h); lun.setDate(h.getDate() - ((h.getDay() + 6) % 7));
      const menos14 = new Date(lun); menos14.setDate(lun.getDate() - 14);
      return { n: celdas.length, primero: celdas[0] ? celdas[0].dataset.key : '', esperado: iso(menos14),
        previas: celdas.filter((c) => c.classList.contains('semprev')).length,
        hoyEnFila3: celdas.findIndex((c) => c.classList.contains('today')) >= 14 && celdas.findIndex((c) => c.classList.contains('today')) < 21,
        huecos: [...document.querySelectorAll('#main .cal > span:not(.wd)')].length };
    });
    check('en el mes actual Mes enseña 2 semanas antes de la de hoy, la de hoy y 4 más',
      mb && rej.n === 49 && rej.primero === rej.esperado && rej.previas === 14 && rej.hoyEnFila3 && rej.huecos === 0,
      JSON.stringify(rej));
    // al imprimir, el papel empieza en la semana en la que estás
    await page.emulateMedia({ media: 'print' });
    const papel = await page.evaluate(() => {
      const vis = [...document.querySelectorAll('#main .cal .dbox')].filter((c) => getComputedStyle(c).display !== 'none');
      return { visibles: vis.length, previasVisibles: vis.filter((c) => c.classList.contains('semprev')).length };
    });
    await page.emulateMedia({ media: null });
    check('al imprimir el Mes no salen las semanas anteriores a la tuya',
      papel.visibles === 35 && papel.previasVisibles === 0, JSON.stringify(papel));
    // otro mes (con ›): entero, con la semana de antes y la de después, apagadas
    const nx = await page.$('#main [data-a="mon-next"]');
    if (nx) await nx.click();
    await page.waitForTimeout(250);
    const otro = await page.evaluate(() => {
      const celdas = [...document.querySelectorAll('#main .cal .dbox')];
      const claves = celdas.map((c) => c.dataset.key);
      const hoy = new Date(), y = hoy.getFullYear(), m = hoy.getMonth() + 1;
      const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const i1 = claves.indexOf(iso(new Date(y, m, 1))), iu = claves.indexOf(iso(new Date(y, m + 1, 0)));
      return { n: celdas.length, antes: i1, despues: claves.length - 1 - iu, previas: celdas.filter((c) => c.classList.contains('semprev')).length,
        fueraBien: celdas.every((c, i) => c.classList.contains('fuera') === (i < i1 || i > iu)) };
    });
    check('los otros meses se ven enteros, con una semana de margen a cada lado',
      !!nx && otro.antes >= 7 && otro.antes <= 13 && otro.despues >= 7 && otro.despues <= 13 && otro.previas === 0 && otro.fueraBien,
      JSON.stringify(otro));
    const vt = await page.$('#main [data-a="mon-today"]');
    if (vt) await vt.click();
    await page.waitForTimeout(250);
    // y se estira hasta el alto de la pantalla: con siete u ocho filas, cada casilla sigue alta
    const alto = await page.evaluate(() => {
      const cal = document.querySelector('#main .cal'), c = document.querySelector('#main .cal .dbox');
      return { cal: Math.round(cal.getBoundingClientRect().height), celda: Math.round(c.getBoundingClientRect().height), vh: innerHeight };
    });
    check('la cuadrícula del mes ocupa casi toda la pantalla', alto.cal >= alto.vh * 0.85 && alto.celda >= 90,
      JSON.stringify(alto));
  }

  // ===================== Acostarse a medianoche no pinta el día entero de sueño =====================
  {
    // En vacaciones, con la cama a las 00:00, la franja pintaba sueño de 0:00 a 24:00: la barra era un
    // solo bloque y no se veía nada más. Acostarse a las 00:00 es la noche siguiente.
    const franja = await page.evaluate(() => {
      const P = window.PG;
      const k = '2027-03-10';
      P.store.rotation.vacaciones = (P.store.rotation.vacaciones || []).filter((v) => v.label !== 'medianoche');
      P.addVacation(k, k, 'medianoche');
      const sh = P.dayInfo(k).shiftId;
      const r = P.store.rhythm[sh]; const antes = r.sleep; r.sleep = '00:00';
      const box = document.createElement('div'); box.innerHTML = P.timelineBar(k);
      r.sleep = antes;
      const col = P.tlColor('sleep');
      const tramos = [...box.querySelectorAll('.tl-seg')].map((x) => ({ w: parseFloat(x.style.width), l: parseFloat(x.style.left), t: x.title }));
      return { tramos, masAncho: Math.max(0, ...tramos.map((t) => t.w)) };
    });
    check('con la cama a las 00:00 la franja no pinta el día entero de sueño',
      franja.tramos.length >= 1 && franja.masAncho < 60 && !franja.tramos.some((t) => /a la cama/.test(t.t)),
      JSON.stringify(franja));
  }

  // ===================== Cinco temas de color en Ajustes =====================
  {
    await gotoTab('ajustes', 'aspecto');
    await page.waitForTimeout(250);
    const nBot = await page.$$eval('#main [data-a="tema-pre"]', (x) => x.length);
    const lee = () => page.evaluate(() => ({ dark: document.documentElement.classList.contains('dark'),
      bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
      sueno: window.PG.tlColor('sleep'), trabajo: window.PG.tlColor('work'), pre: window.PG.store.tema.preset }));
    const bm = await page.$('#main [data-a="tema-pre"][data-id="magenta"]');
    if (bm) await bm.click();
    await page.waitForTimeout(150);
    const mag = await lee();
    const bp = await page.$('#main [data-a="tema-pre"][data-id="papel"]');
    if (bp) await bp.click();
    await page.waitForTimeout(150);
    const pap = await lee();
    check('Ajustes trae cinco temas y cada uno pone fondo, modo y colores de la franja',
      nBot === 5 && !!bm && mag.dark && mag.bg === '#12081a' && mag.pre === 'magenta' && mag.sueno !== mag.trabajo &&
      !!bp && !pap.dark && pap.pre === 'papel', JSON.stringify({ nBot, mag, pap }));
    // el tema sobrevive a recargar (normalize() no se lo come)
    const vuelta = await page.evaluate(() => { const P = window.PG; P.store = JSON.parse(JSON.stringify(P.store)); return P.store.tema.preset; });
    // un texto negro sobre fondo oscuro no se aplica: dejaba la app ilegible
    const tinta = await page.evaluate(() => {
      const P = window.PG; P.ponerTema('hud'); P.store.tema.ink = '#000000'; P.aplicarTema();
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
      P.store.tema.ink = ''; P.aplicarTema();
      return { ink, legible: P.tintaLegible('#000000') };
    });
    check('el tema aguanta la recarga y un color de texto ilegible no se aplica',
      vuelta === 'papel' && tinta.ink !== '#000000' && tinta.legible === false, JSON.stringify({ vuelta, tinta }));
    await page.evaluate(() => { window.PG.ponerTema('hud'); });
  }

  // ===================== Google: sesiones fijas, rotación y entreno =====================
  {
    const g = await page.evaluate(() => {
      const P = window.PG;
      // tus datos de siempre (sin la marca) reciben las dos sesiones UNA vez; una instalación nueva no
      const viejo = JSON.parse(JSON.stringify(P.store)); delete viejo.meta.sesionesFijas;
      viejo.eventos = viejo.eventos.filter((e) => !/^Sesi[oó]n (UMI|general)/.test(e.titulo));
      P.store = viejo;
      const ses = P.store.eventos.filter((e) => /^Sesi[oó]n (UMI|general)/.test(e.titulo));
      P.store = JSON.parse(JSON.stringify(P.store));
      const ses2 = P.store.eventos.filter((e) => /^Sesi[oó]n (UMI|general)/.test(e.titulo)).length;
      // un martes de trabajo y otro de vacaciones
      const trab = '2027-06-08', vac = '2027-06-15';
      P.setDayOverride(trab, 'sh-t', '');
      P.addVacation(vac, vac, 'test-ses');
      P.setMonthService(2027, 5, 'UMI', 5);
      const evs = P.calEventos('2027-06-07', '2027-06-16');
      const de = (k) => evs.filter((e) => e.isoKey === k).map((e) => e.summ);
      const umi = ses.filter((e) => /UMI/.test(e.titulo))[0] || {};
      const gen = ses.filter((e) => /general/.test(e.titulo))[0] || {};
      return { n: ses.length, n2: ses2,
        umi: umi.dow + ' ' + umi.hora + '-' + umi.fin + ' ' + umi.soloTrabajo,
        gen: gen.dow + ' ' + gen.hora + '-' + gen.fin,
        enTrabajo: de(trab), enVac: de(vac),
        rot: evs.filter((e) => e.cat === 'ROTACION').map((e) => e.summ + ' ' + e.isoKey + '→' + e.hastaIso),
        ics: /DTEND;VALUE=DATE:20270617/.test(P.icsTexto('2027-06-07', '2027-06-16')) };
    });
    check('las sesiones de la UMI (martes 8:00–8:39) y la general (jueves 8:00–8:30) entran una vez',
      g.n === 2 && g.n2 === 2 && g.umi === '2 08:00-08:39 true' && g.gen === '4 08:00-08:30', JSON.stringify(g));
    check('a Google van la sesión de los martes que trabajas (no en vacaciones), el trabajo con su rotación y la rotación',
      g.enTrabajo.some((x) => /Sesión UMI/.test(x)) && g.enTrabajo.some((x) => /Trabajo · UMI/.test(x)) &&
      !g.enVac.some((x) => /Sesión UMI/.test(x)) &&
      g.rot.length === 1 && /Rotación · UMI 2027-06-07→2027-06-16/.test(g.rot[0]) && g.ics, JSON.stringify(g));
  }

  // ===================== «Semana» por días: desde hoy, 5/7/10/14, con ayer plegado =====================
  {
    // «que se mueva según el día, que el día en el que estamos se vea el primero y puedas ver el de
    // ayer y los 7 siguientes o 10 o 14 según lo pongas»
    await page.evaluate(() => { const P = window.PG; P.store.rotation.mode = 'date'; P.ui.semDesde = ''; P.ui.semAyer = false; P.save(); });
    await gotoTab('week');
    await page.waitForTimeout(300);
    const toca = async (sel) => { const el = await page.$(sel); if (el) await el.click(); await page.waitForTimeout(250); return !!el; };
    const lee = () => page.evaluate(() => {
      const f = [...document.querySelectorAll('#main .drow')];
      return { n: f.length, hoyPrimero: !!(f[0] && f[0].classList.contains('today')),
        primero: f[0] ? f[0].querySelector('[data-a="day-open"]').dataset.key : '',
        ayer: !!document.querySelector('#main .dayer'), dias: window.PG.store.rotation.semanaDias };
    });
    const hoyK = isoDate(new Date());
    const mas = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); };
    const pasos = [await lee()], hubo = [];
    hubo.push(await toca('#main [data-a="sem-dias"][data-n="14"]')); pasos.push(await lee());
    hubo.push(await toca('#main .semnav [data-a="wk-next"]')); pasos.push(await lee());
    hubo.push(await toca('#main .semnav [data-a="today"]')); pasos.push(await lee());
    hubo.push(await toca('#main [data-a="sem-ayer"]'));
    const ayerAbierto = await page.evaluate(() => document.querySelectorAll('#main .drow.ayer').length);
    hubo.push(await toca('#main [data-a="sem-ayer"]'));
    const persiste = await page.evaluate(() => { const P = window.PG; P.store = JSON.parse(JSON.stringify(P.store)); return P.store.rotation.semanaDias; });
    hubo.push(await toca('#main [data-a="sem-dias"][data-n="7"]')); pasos.push(await lee());
    check('«Semana» empieza hoy, con ayer plegado, y enseña 7, 10, 14 o 5 días que se guardan',
      hubo.every(Boolean) && pasos[0].n === 7 && pasos[0].hoyPrimero && pasos[0].primero === hoyK && pasos[0].ayer &&
      pasos[1].n === 14 && pasos[1].primero === hoyK && pasos[2].primero === mas(14) && !pasos[2].hoyPrimero &&
      pasos[3].primero === hoyK && ayerAbierto === 1 && persiste === 14 && pasos[4].n === 7,
      JSON.stringify({ hubo, pasos, ayerAbierto, persiste }));
    // la leyenda va UNA vez y plegada, y cada día lleva sus comidas con hora
    const una = await page.evaluate(() => ({
      leyendas: document.querySelectorAll('#main .tlleg').length,
      plegada: !!document.querySelector('#main .semley details:not([open]) .tlleg'),
      ejes: document.querySelectorAll('#main .drow .tl-axis').length,
      comidasConHora: [...document.querySelectorAll('#main .drow')].filter((f) => /\d:\d\d/.test((f.querySelector('.drcom') || {}).innerText || '')).length,
      // lo que dice qué es cada bloque ya no es la barra de cada fila: es la rejilla de arriba
      rotulos: [...document.querySelectorAll('#main .semrej .sb .sbt')].map((b) => b.textContent).slice(0, 8) }));
    check('en «Semana» la leyenda sale una vez y plegada, sin un eje por día, y las comidas llevan su hora',
      una.leyendas === 1 && una.plegada && una.ejes === 0 && una.comidasConHora === 7 &&
      una.rotulos.some((t) => /[Tt]rabajo|[Gg]uardia/.test(t)), JSON.stringify(una));
  }

  // ===================== «Hoy»: ahora / siguiente y la agenda por horas =====================
  {
    const k = await page.evaluate(() => {
      const P = window.PG;
      // un LABORABLE, no «hoy»: la jornada de 8 a 15 sale de los días de trabajo de tu jornada, así
      // que en sábado no hay ninguna y esta prueba caía por el día en que se ejecutara
      const k = P.diaLaborableCerca();
      P.setDayOverride(k, 'sh-t', '');
      P.store.eventos.push({ id: 'ev-ag', titulo: 'Sesión de prueba', hora: '08:00', fin: '08:39', modo: 'fecha', fecha: k, dow: [], color: '#f472b6', on: true });
      P.save(); return k;
    });
    await gotoTab('hoy');
    // pulsar «Hoy» en la barra devuelve la pantalla al día de hoy, así que el día laborable se pone
    // DESPUÉS de navegar: si no, se mide un sábado sin jornada y sin el evento de la prueba
    await page.evaluate((k) => { window.PG.ui.diaHoy = k; window.PG.render(); }, k);
    await page.waitForTimeout(300);
    // el día ya no es una LISTA de horas sino un CARRIL: cada cosa ocupa el rato que ocupa, así
    // que lo que se comprueba es que esté todo, en orden, con su duración real, y que cada bloque
    // lleve a dónde se cambia —que es lo que la lista no hacía—.
    const ag = await page.evaluate(() => { const P = window.PG;
      const k = P.fechaHoy();
      const bl = P.bloquesDelDia(k);
      const cbs = [...document.querySelectorAll('#main .carril .cb')];
      const ses = bl.filter((b) => /Sesión de prueba/.test(b.tit))[0];
      const trab = bl.filter((b) => /Trabajo/.test(b.tit))[0];
      return { n: bl.length,
        ordenadas: bl.every((b, i) => i === 0 || b.de >= bl[i - 1].de),
        // el evento dura lo que dura: 08:00–08:39 son 39 minutos, no una fila de altura fija
        sesion: ses ? (ses.de + '-' + ses.a) : '',
        // y la jornada ocupa sus siete horas
        trabajo: !!trab && trab.de === 8 * 60 && trab.a === 15 * 60,
        comidas: bl.filter((b) => b.fino).length,
        // cada bloque pintado es un botón que lleva a su sitio
        pintados: cbs.length,
        conDestino: cbs.filter((b) => b.dataset.a).length };
    });
    check('«Hoy» enseña el día como carril: cada cosa con su duración real y tocable para cambiarla',
      ag.n >= 5 && ag.ordenadas && ag.sesion === (8 * 60) + '-' + (8 * 60 + 39) && ag.trabajo &&
      ag.comidas >= 3 && ag.pintados >= 3 && ag.conDestino === ag.pintados,
      JSON.stringify(ag));
    await page.evaluate((k) => { const P = window.PG; P.store.eventos = P.store.eventos.filter((e) => e.id !== 'ev-ag'); P.setDayOverride(k, null); P.ui.diaHoy = ''; P.save(); P.render(); }, k);
    await page.waitForTimeout(250);
    // la tarjeta de «ahora / siguiente» solo tiene sentido en el día de HOY, no en el laborable que
    // se estaba mirando con las flechas: se comprueba al volver, y a cualquier hora —a las once de
    // la noche ya no queda nada por hoy y aun así tiene que decir qué es lo siguiente
    const cajaAhora = await page.evaluate(() => !!document.querySelector('#main .hoyahora'));
    check('«Hoy» lleva siempre la tarjeta de ahora y lo siguiente, a cualquier hora del día',
      cajaAhora, String(cajaAhora));
  }

  // ===================================================================================
  // Fase 2 · Montar la rutina: la lista pasa de una tabla de nueve columnas por ejercicio
  // (3 256 px, 68 botones, 68 campos) a una tarjeta por rutina, y el constructor vive
  // detrás de «editar», con buscador y series con −/+. Sin «peso objetivo» ni «descanso».
  // ===================================================================================
  {
    await page.evaluate(() => {
      const P = window.PG, S = P.store;
      S.gym.rutinas = [
        { id: 'q1', nombre: 'Torso Q', notas: 'martes y viernes', dias: [],
          ejercicios: [{ ex: 'Press banca', series: 4, reps: 8 }, { ex: 'Dominadas', series: 4, reps: 8 },
                       { ex: 'Press militar', series: 3, reps: 10 }] },
        { id: 'q2', nombre: 'Pierna Q', notas: '', dias: [],
          ejercicios: [{ ex: 'Sentadilla', series: 4, reps: 8 }] }];
      S.gym.biblioteca = [{ id: 'bq1', n: 'Prensa de piernas', c: 'upper legs', tg: 'quads', eq: 'machine' }];
      S.gym.registro = []; S.gym.sesiones = [];
      P.ui.gymSesionActiva = null; P.ui.gymInforme = ''; P.ui.gymQ = ''; P.save();
    });
    await gotoGym('rutinas');
    await page.waitForTimeout(320);
    const lista = await page.evaluate(() => {
      const m = document.querySelector('#main');
      return { alto: Math.round(m.scrollHeight), tarjetas: m.querySelectorAll('.rcard').length,
        tablas: m.querySelectorAll('table').length,
        campos: m.querySelectorAll('input,select,textarea').length,
        resumen: (m.querySelector('.rcard .rsub') || { textContent: '' }).textContent.trim(),
        musculos: m.querySelectorAll('.rcard .rmus').length,
        empezar: m.querySelectorAll('.rcard [data-a="ses-empezar"]').length };
    });
    check('«Rutinas» es una tarjeta por rutina que se lee de un vistazo, no una tabla por ejercicio',
      lista.tarjetas === 2 && lista.tablas === 0 && lista.campos <= 4 && lista.empezar === 2 &&
      /3 ejercicios · 11 series/.test(lista.resumen) && lista.musculos >= 3 && lista.alto < 2000,
      JSON.stringify(lista));

    // el constructor: series con −/+, buscador que añade de un toque, y el análisis debajo
    const edt = await page.$('#main [data-a="rt-editar"][data-id="q1"]');
    if (edt) { await edt.click(); await page.waitForTimeout(320); }
    const mas = await page.$('#main [data-a="rt-ser"][data-id="q1"][data-ix="0"][data-d="1"]');
    if (mas) { await mas.click(); await page.waitForTimeout(260); }
    const sug = await page.$('#main .resug');
    if (sug) { await sug.click(); await page.waitForTimeout(300); }
    const editor = await page.evaluate(() => {
      const P = window.PG, m = document.querySelector('#main');
      const rt = P.gymS().rutinas.filter((r) => r.id === 'q1')[0] || { ejercicios: [] };
      return { panel: P.ui.gymPanel, filas: m.querySelectorAll('.refila').length,
        series0: rt.ejercicios[0] ? rt.ejercicios[0].series : null,
        nEj: rt.ejercicios.length, ultimo: rt.ejercicios.length ? rt.ejercicios[rt.ejercicios.length - 1].ex : '',
        diaChips: m.querySelectorAll('[data-a="rt-dia"]').length,
        analisis: (m.querySelector('.mlegend') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(),
        // los dos campos que no usas no pueden volver por la puerta de atrás
        sobra: /pesoObjetivo|descansoSeg/.test(m.innerHTML) };
    });
    check('el constructor sube series con −/+, añade del buscador de un toque y dice cómo queda la rutina',
      !!edt && !!mas && !!sug && editor.panel === 'rutedit' && editor.series0 === 5 &&
      editor.nEj === 4 && editor.ultimo === 'Prensa de piernas' && editor.filas === 4 &&
      editor.diaChips >= 3 && /falta|equilibrada/.test(editor.analisis) && !editor.sobra,
      JSON.stringify(editor));

    await page.evaluate(() => {
      const P = window.PG;
      P.store.gym.rutinas = []; P.store.gym.biblioteca = []; P.store.gym.registro = [];
      P.ui.gymPanel = ''; P.ui.gymRutSel = ''; P.ui.gymQ = ''; P.save(); P.render();
    });
  }

  // ===================================================================================
  // Fases 3 y 4 · Objetivos con su camino, y evolución. Un objetivo sin camino es un
  // cartel: cada uno dice dónde estás, a qué ritmo vas y para cuándo llegas A TU RITMO.
  // Y la evolución cruza con lo que solo sabe esta app: guardias, sueño y proteína.
  // ===================================================================================
  {
    const mont = await page.evaluate(() => {
      const P = window.PG, S = P.store;
      const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const lun = (n) => iso(P.addDays(P.mondayOf(new Date()), -7 * n));
      const g = S.gym;
      g.rutinas = []; g.sesiones = []; g.cardio = []; g.objetivos = []; g.registro = [];
      g.biblioteca = [{ id: 'z1', n: 'Press inclinado con mancuernas', c: 'chest', tg: 'pectorals', eq: 'dumbbell' }];
      // press banca clavado tres sesiones en 70 kg -> estancado, y con alternativa en la biblioteca
      [1, 2, 3].forEach((w) => { for (let j = 0; j < 3; j++)
        g.registro.push({ id: 'z' + w + j, fecha: iso(P.addDays(P.parseDate(lun(w)), 3)),
          ex: 'Press banca', kg: 70, reps: 6, rpe: 9, ts: 1 }); });
      // tres carreras de 10 km mejorando
      g.cardio = [{ id: 'k1', tipo: 'carrera', fecha: lun(8), distanciaKm: 10, duracionMin: 58 },
                  { id: 'k2', tipo: 'carrera', fecha: lun(4), distanciaKm: 10, duracionMin: 55 },
                  { id: 'k3', tipo: 'carrera', fecha: lun(1), distanciaKm: 10, duracionMin: 53 }];
      P.ui.gymSesionActiva = null; P.ui.gymInforme = ''; P.save();
      return { antes: g.objetivos.length };
    });

    // los tres objetivos se ponen desde la pantalla, no a mano en el almacén
    await gotoGym('objetivos');
    await page.waitForTimeout(300);
    const bFuerza = await page.$('#main [data-a="obj-tipo"][data-t="fuerza"]');
    if (bFuerza) { await bFuerza.click(); await page.waitForTimeout(220); }
    const campoEx = await page.$('#objEx');
    if (campoEx) { await campoEx.fill('Press banca'); }
    const campoMeta = await page.$('#objMeta');
    if (campoMeta) { await campoMeta.fill('100'); }
    const poner = await page.$('#main [data-a="obj-add"]');
    if (poner) { await poner.click(); await page.waitForTimeout(320); }

    const obj = await page.evaluate(() => {
      const P = window.PG, m = document.querySelector('#main');
      const o = (P.store.gym.objetivos || [])[0] || null;
      const e = o ? P.objetivoEstado(o) : null;
      return { n: (P.store.gym.objetivos || []).length, tipo: o ? o.tipo : '', meta: o ? o.meta : 0,
        // el objetivo de fuerza mide el PESO DE VERDAD, no el 1RM estimado: con 70×6 el
        // estimado da 84 y diría «84 de 100» sin haber puesto nunca más de 70 en la barra
        hoy: e ? e.hoy : null, rm: e ? e.rm : null,
        cifra: (m.querySelector('.obj .objnum b') || { textContent: '' }).textContent.trim(),
        camino: (m.querySelector('.obj .objvia') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(),
        // y sobrevive a recargar: sin registrarlo en normalize() se perdería
        trasRecargar: (function () { P.store = JSON.parse(JSON.stringify(P.store));
          return (P.store.gym.objetivos || []).length; })() };
    });
    check('un objetivo de fuerza mide el peso que pones en la barra, dice el camino y sobrevive a recargar',
      obj.n === 1 && obj.tipo === 'fuerza' && obj.meta === 100 && obj.hoy === 70 &&
      obj.rm > 80 && obj.cifra === '70' && obj.camino.length > 10 && obj.trasRecargar === 1,
      JSON.stringify(obj));

    // fase 4: estancamiento con cambio sugerido, y el cruce con las guardias
    await gotoGym('progreso');
    await page.waitForTimeout(400);
    const evo = await page.evaluate(() => {
      const P = window.PG, m = document.querySelector('#main');
      return { avisos: [...m.querySelectorAll('.ev')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
        barras: m.querySelectorAll('.fb2c').length,
        curva: !!m.querySelector('.curva'),
        volMusculo: m.querySelectorAll('.fb').length,
        estancados: P.estancados().map((x) => x.ex),
        cambio: P.cambioSugerido('Press banca'),
        cruce: P.cruceEntreno().length,
        alto: Math.round(m.scrollHeight) };
    });
    check('Progreso ve venir el estancamiento, propone el cambio y cruza con tus guardias',
      evo.estancados.indexOf('Press banca') >= 0 &&
      evo.cambio === 'Press inclinado con mancuernas' &&
      evo.avisos.some((a) => /clavado en 70 kg/.test(a) && /Press inclinado/.test(a)) &&
      evo.barras >= 8 && evo.curva && evo.volMusculo >= 1 && evo.alto < 2600,
      JSON.stringify(evo));

    await page.evaluate(() => {
      const P = window.PG;
      P.store.gym.objetivos = []; P.store.gym.registro = []; P.store.gym.cardio = [];
      P.store.gym.biblioteca = []; P.ui.gymPanel = ''; P.save(); P.render();
    });
  }

  // ===================================================================================
  // Compra: la lista salía alfabética —del aceite al yogur— y con el carro en la mano
  // eso son 52 viajes de un pasillo a otro. Ahora va por secciones del súper, y el
  // pasillo que terminas se pliega solo: la lista se acorta según llenas el carro.
  // ===================================================================================
  {
    await gotoTab('shop');
    await page.waitForTimeout(400);
    const clasifica = await page.evaluate(() => {
      const P = window.PG;
      const c = (t) => P.seccionDeCompra(t);
      return {
        // lo específico manda sobre lo general, que es donde estaba la trampa
        tomate: c('300 g tomate'), triturado: c('800 g tomate triturado'),
        pollo: c('700 g muslo de pollo'), caldo: c('600 ml caldo de pollo'),
        salmon: c('6 lomo salmón'), lomo: c('200 g lomo'),
        pimientoRojo: c('1 pimiento rojo'), pimientoAsado: c('30 g pimiento asado'),
        jengibre: c('6 g jengibre molido'),
        huevo: c('8 huevo'), pan: c('1 pan bocadillo integral'), agua: c('1500 ml agua'),
        arroz: c('280 g arroz basmati'), whey: c('60 g proteína whey'),
        // el brik de leche de proteínas está en el frigorífico, no en el pasillo de suplementos
        lecheProte: c('2 brick 250 ml leche de proteínas (Mercadona)'),
      };
    });
    check('cada cosa cae en su pasillo, y lo específico manda sobre lo general',
      clasifica.tomate === 'verdura' && clasifica.triturado === 'despensa' &&
      clasifica.pollo === 'carne' && clasifica.caldo === 'despensa' &&
      clasifica.salmon === 'pescado' && clasifica.lomo === 'carne' &&
      clasifica.pimientoRojo === 'verdura' && clasifica.pimientoAsado === 'despensa' &&
      clasifica.jengibre === 'despensa' && clasifica.huevo === 'lacteos' &&
      clasifica.pan === 'pan' && clasifica.agua === 'bebida' &&
      clasifica.arroz === 'despensa' && clasifica.whey === 'despensa' &&
      clasifica.lecheProte === 'lacteos',
      JSON.stringify(clasifica));

    const antes = await page.evaluate(() => ({
      alto: Math.round(document.getElementById('main').scrollHeight),
      pasillos: document.querySelectorAll('#main .pasillo').length,
      // nada debería caer en «Otros»: si cae, es que al mapa le falta una regla
      otros: [...document.querySelectorAll('#main .pasillo')].filter((e) => /Otros/.test(e.textContent)).length }));

    // se termina el primer pasillo entero y la lista se acorta sola
    const marcadas = await page.evaluate(() => {
      const P = window.PG;
      const pas = [...document.querySelectorAll('#main .pasillo')][0];
      const ul = pas && pas.nextElementSibling;
      const lineas = ul ? [...ul.querySelectorAll('.linea')] : [];
      lineas.forEach((l) => P.ui.marks.add(l.dataset.id));
      P.save(); P.render();
      return lineas.length;
    });
    await page.waitForTimeout(300);
    const tras = await page.evaluate(() => ({
      alto: Math.round(document.getElementById('main').scrollHeight),
      primero: (() => { const p = document.querySelectorAll('#main .pasillo')[0];
        return p ? { abierto: p.getAttribute('aria-expanded'), ok: /\bok\b/.test(p.className) } : null; })() }));

    // …y se vuelve a abrir si lo tocas, que si no se pierde lo que ya has marcado
    const reabre = await page.evaluate(() => {
      const p = document.querySelectorAll('#main .pasillo')[0];
      if (!p) return null;
      p.click();
      return null;
    });
    await page.waitForTimeout(280);
    const abierto2 = await page.evaluate(() => {
      const p = document.querySelectorAll('#main .pasillo')[0];
      return p ? p.getAttribute('aria-expanded') : '';
    });
    check('la compra va por pasillos del súper y el que terminas se pliega solo, pero se puede reabrir',
      antes.pasillos >= 4 && antes.otros === 0 && marcadas >= 3 &&
      tras.primero && tras.primero.abierto === 'false' && tras.primero.ok === true &&
      tras.alto < antes.alto && abierto2 === 'true',
      JSON.stringify({ antes, marcadas, tras, abierto2, reabre }));

    await page.evaluate(() => { const P = window.PG;
      P.ui.marks = new Set(); P.ui.compraAbiertas = new Set();
      P.ui.compraCerradas = new Set(['rutina', 'basicos', 'casa']); P.save(); P.render(); });
  }

  // ===================================================================================
  // Celiaquía: el usuario es celíaco y sus menús llevaban pan de trigo. La app AVISA,
  // no garantiza: hay tres estados y el tercero es de verdad «no lo sé», porque el
  // chorizo de una marca lleva gluten y el de otra no.
  // ===================================================================================
  {
    const g = await page.evaluate(() => {
      const P = window.PG;
      if (!P.esCeliaco()) P.setPerfil('celiaco');
      const c = (n) => P.glutenDe(n);
      const pl = P.platosConGluten();
      return {
        si: [c('2 rebanada pan integral masa madre'), c('1 pan bocadillo integral'),
             c('1 cerveza'), c('tortilla de trigo')],
        no: [c('280 g arroz basmati'), c('700 g muslo de pollo'), c('300 g tomate'),
             c('2 tostada de maíz sin gluten'), c('harina de arroz')],
        // la avena ya no está aquí: su estado lo decide el perfil (avena certificada), y eso lo
        // fija su propia prueba más abajo
        depende: [c('200 g chorizo'), c('600 ml caldo de pollo'),
                  c('60 g proteína whey'), c('25 g curry'), c('muesli de avena'),
                  // un cereal alternativo NO hace seguro un producto: el pan de maíz del súper
                  // suele llevar trigo también, así que baja a «mira la etiqueta», no a «sin gluten»
                  c('pan de maíz'), c('tortita de arroz')],
        platosSi: pl.si.map((o) => o.d.id),
        // y dice POR QUÉ, que es lo que te deja decidir
        porQue: pl.si.length ? pl.si[0].porQue.map((x) => x.x) : [],
        celiaco: P.esCeliaco(),
      };
    });
    check('la app marca el gluten en tres estados y dice por qué, sin jurar lo que no sabe',
      g.celiaco === true &&
      g.si.every((x) => x === 'si') && g.no.every((x) => x === 'no') &&
      g.depende.every((x) => x === 'depende') &&
      g.platosSi.indexOf('d-pan-aceite') >= 0 && g.platosSi.indexOf('d-sandwich') >= 0 &&
      g.porQue.some((x) => /pan/i.test(x)),
      JSON.stringify(g));

    // el cambio se propone, no se hace solo: hasta que no tocas «cambiar» tu plato sigue igual
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'food'; P.ui.foodVista = 'gluten'; P.render(); });
    await page.waitForTimeout(320);
    const antes = await page.evaluate(() => {
      const d = window.PG.store.dishes.filter((x) => x.id === 'd-pan-aceite')[0];
      return { n: d ? d.name : '', botones: document.querySelectorAll('#main [data-a="glu-cambiar"]').length,
        aviso: !!document.querySelector('#main .gluaviso') }; });
    const bot = await page.$('#main [data-a="glu-cambiar"][data-id="d-pan-aceite"]');
    if (bot) { await bot.click(); await page.waitForTimeout(320); }
    const tras = await page.evaluate(() => {
      const P = window.PG;
      const d = P.store.dishes.filter((x) => x.id === 'd-pan-aceite')[0];
      return { n: d ? d.name : '', gluten: d ? P.glutenDePlato(d).est : '',
        trigo: d ? d.ingredients.join(' ') : '', quedan: P.platosConGluten().si.length }; });
    check('cambiar un plato con gluten lo deja sin gluten, y solo cuando lo tocas tú',
      !!bot && antes.aviso && antes.botones === 2 && /Pan integral/.test(antes.n) &&
      /ma[íi]z/i.test(tras.n) && tras.gluten === 'no' && !/pan integral/i.test(tras.trigo) &&
      tras.quedan === 1,
      JSON.stringify({ antes, tras }));

    // la avena NO lleva gluten: lo que la hace dudosa es que se cultiva y se muele con trigo. La
    // suya es certificada, así que para él no lo es — pero eso lo dice su perfil, no una lista
    // fija, porque el día que compre otra marca tiene que volver a avisar.
    const avena = await page.evaluate(() => { const P = window.PG;
      const c = (n) => P.glutenDe(n);
      const dep = () => P.platosConGluten().depende.map((x) => x.d.name).join(' | ');
      const con = { avena: c('160 g copos de avena'), muesli: c('muesli de avena'),
        granola: c('granola'), barrita: c('barrita de avena'), pan: c('pan de avena'),
        porridge: /Porridge/.test(dep()), yogur: /Yogur griego con avena/.test(dep()) };
      P.setPerfil('avena');                       // se apaga: vuelve a ser dudosa
      const sin = { avena: c('160 g copos de avena'), porridge: /Porridge/.test(dep()) };
      P.setPerfil('avena');                       // y se vuelve a encender
      P.store = JSON.parse(JSON.stringify(P.store));   // el viaje por normalize()
      return { con, sin, persiste: P.perfilS().avenaSinGluten,
        trasRecargar: c('160 g copos de avena') }; });
    check('con la avena certificada el porridge deja de avisar, pero el muesli y la granola siguen en ámbar',
      avena.con.avena === 'no' && avena.con.porridge === false && avena.con.yogur === false &&
      avena.con.muesli === 'depende' && avena.con.granola === 'depende' &&
      avena.con.barrita === 'depende' && avena.con.pan === 'depende' &&
      avena.sin.avena === 'depende' && avena.sin.porridge === true &&
      avena.persiste === true && avena.trasRecargar === 'no',
      JSON.stringify(avena));

    // el peso se sigue por TENDENCIA, y el perfil sobrevive a recargar
    const peso = await page.evaluate(() => {
      const P = window.PG;
      const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      [95.4, 95.1, 94.9, 95.2, 94.6, 94.4, 94.1, 93.9].forEach((kg, i) =>
        P.apuntarPeso(kg, iso(P.addDays(new Date(), -(21 - i * 3)))));
      P.setPerfil('alturaCm', 179);
      const t = P.tendenciaPeso(90);
      P.store = JSON.parse(JSON.stringify(P.store));   // el viaje por normalize()
      return { t: t, pesadas: P.store.perfil.pesos.length, altura: P.store.perfil.alturaCm,
        celiaco: P.store.perfil.celiaco };
    });
    check('el peso se sigue por tendencia de 7 días y el perfil sobrevive a recargar',
      peso.t && peso.t.n === 8 && peso.t.media > 93 && peso.t.media < 95 &&
      peso.t.porSemana < 0 && peso.pesadas === 8 && peso.altura === 179 && peso.celiaco === true,
      JSON.stringify(peso));

    await page.evaluate(() => { const P = window.PG;
      P.store.perfil.pesos = []; P.ui.foodVista = ''; P.save(); P.render(); });
  }

  // ===================================================================================
  // La cesta como centro de Comer (fase 2). Cuatro gestos encadenados, que es donde
  // estaban los fallos: marcar → «he hecho esta compra» → la despensa con cantidades →
  // gastar hasta que se acaba → y la lista lo vuelve a pedir. Más la frutería aparte
  // del súper y la lista pegada a mano.
  // ===================================================================================
  {
    await gotoTab('shop');
    await page.waitForTimeout(400);
    await page.evaluate(() => { const P = window.PG;
      P.food().despensa = []; P.food().neveraMano = []; P.food().nevera = [];
      delete P.food().ultimaCompra;
      P.ui.marks = new Set(); P.ui.compraSalida = 'todo';
      P.ui.compraAbiertas = new Set(); P.ui.compraCerradas = new Set(['rutina', 'basicos', 'casa']);
      P.save(); P.render(); });
    await page.waitForTimeout(250);

    // 1 · la frutería es otra salida y otra lista: en «Frutería» solo puede quedar la
    // fruta y la verdura. Con un único pasillo el render caía a pintar el GRUPO entero,
    // así que delante del puesto de fruta salían las 52 líneas del súper.
    const salidas = {};
    for (const v of ['fruteria', 'super', 'todo']) {
      const b = await page.$(`[data-a="compra-salida"][data-v="${v}"]`);
      if (!b) { salidas[v] = null; continue; }
      await b.click();
      await page.waitForTimeout(220);
      salidas[v] = await page.evaluate(() => ({
        pasillos: [...document.querySelectorAll('#main .pasillo b')].map((e) => e.textContent),
        lineas: document.querySelectorAll('#main .lcompra .linea').length }));
    }
    check('la frutería se hace aparte del súper y no arrastra la lista entera',
      salidas.fruteria && salidas.super && salidas.todo &&
      salidas.fruteria.pasillos.length === 1 && /Fruta y verdura/.test(salidas.fruteria.pasillos[0]) &&
      salidas.super.pasillos.indexOf('Fruta y verdura') < 0 &&
      salidas.fruteria.lineas > 0 && salidas.fruteria.lineas < salidas.todo.lineas &&
      salidas.fruteria.lineas + salidas.super.lineas === salidas.todo.lineas,
      JSON.stringify(salidas));

    // 2 · marcar tres cosas y decir «he hecho esta compra»: entran en casa CON su
    // cantidad y la lista se queda limpia. Este es el gesto que une la lista con la
    // nevera; sin él había que rellenarla a mano una por una.
    const compra = await page.evaluate(() => {
      const P = window.PG;
      const lin = [...document.querySelectorAll('#main .lcompra .linea')].slice(0, 3);
      const textos = lin.map((l) => l.querySelector('b').textContent);
      lin.forEach((l) => l.click());
      return textos;
    });
    await page.waitForTimeout(250);
    await page.click('[data-a="compra-hecha"]');
    await page.waitForTimeout(400);
    const trasCompra = await page.evaluate(() => { const P = window.PG;
      return { desp: P.despensaS().map((x) => ({ nom: x.nom, q: x.q, uni: x.uni, sec: x.sec })),
        marcas: P.ui.marks.size, dias: P.diasDesdeCompra(),
        nevera: P.food().nevera.length }; });
    check('«he hecho esta compra» lleva lo marcado a la despensa con su cantidad y limpia la lista',
      compra.length === 3 && trasCompra.desp.length === 3 && trasCompra.marcas === 0 &&
      trasCompra.dias === 0 && trasCompra.desp.every((x) => x.sec) &&
      trasCompra.desp.some((x) => x.q > 0),
      JSON.stringify({ compra, trasCompra }));

    // 3 · lo que ya está en casa sale de la cuenta de la compra. Sin esto, «la despensa
    // baja al gastarla» no servía de nada: la lista pedía lo mismo con la nevera llena.
    const cuenta = await page.evaluate(() => { const P = window.PG;
      const d = P.compraDatos();
      const todas = d.grupos.reduce((a, g) => a + g[2].length, 0);
      const tengo = d.grupos.reduce((a, g) => a + g[2].filter((x) => x.tengo && !x.falta && !x.basico).length, 0);
      const basicos = d.grupos.reduce((a, g) => a + g[2].filter((x) => x.basico).length, 0);
      return { total: d.total, todas: todas, tengo: tengo, basicos: basicos }; });
    check('lo que ya tienes en casa no se cuenta como pendiente en la compra',
      cuenta.tengo === 3 && cuenta.total === cuenta.todas - cuenta.tengo - cuenta.basicos,
      JSON.stringify(cuenta));

    // 4 · gastarlo hasta el final: desaparece de la despensa y la compra lo vuelve a pedir
    const gastado = await page.evaluate(() => { const P = window.PG;
      const x = P.despensaS()[0]; const k = x.k, nom = x.nom, q0 = x.q;
      // un toque de «gastar» es un cuarto de lo que compraste, así que en CUATRO se acaba. Con el
      // 25 % de lo que queda no se acababa nunca: 600 g tras veinte toques seguían siendo 4 g.
      let toques = 0;
      while (toques < 8 && P.despensaS().some((y) => y.k === k)) {
        const y = P.despensaS().filter((z) => z.k === k)[0];
        P.despensaGasta(y.nom, P.pasoDeGasto(y));
        toques++;
      }
      P.save();
      const d = P.compraDatos();
      const vuelve = d.grupos.some((g) => g[2].some((it) => !it.tengo &&
        P.despClave(it.texto) === k));
      return { k: k, nom: nom, q0: q0, toques: toques,
        sigue: P.despensaS().some((y) => y.k === k),
        vuelve: vuelve, total: d.total }; });
    check('lo que se gasta desaparece de la despensa en cuatro toques y la compra lo vuelve a pedir',
      gastado.sigue === false && gastado.vuelve === true && gastado.toques <= 4 &&
      gastado.total === cuenta.total + 1,
      JSON.stringify(gastado));

    // 5 · una lista pegada a mano: lo que no sale de ningún menú (papel, bolsas). Va a
    // «A mano», que ya entra sola en la compra, y el grupo se abre para que la veas.
    await page.click('[data-a="compra-listas"]');
    await page.waitForTimeout(300);
    await page.fill('#compraMano', '2 rollos de papel\n1 gel de ducha');
    await page.click('[data-a="compra-mano"]');
    await page.waitForTimeout(400);
    await page.click('[data-a="compra-volver"]');
    await page.waitForTimeout(350);
    const mano = await page.evaluate(() => { const P = window.PG;
      const l = P.listasS().filter((x) => x.nombre === 'A mano')[0];
      const txt = document.getElementById('main').innerText;
      return { hay: !!l, n: l ? (l.items || []).length : 0, fija: !!(l && l.fija),
        enPantalla: /rollos de papel/.test(txt) && /gel de ducha/.test(txt),
        cerrado: !!(P.ui.compraCerradas && P.ui.compraCerradas.has('rutina')) }; });
    check('una lista pegada a mano entra en la compra de la semana y se ve al volver',
      mano.hay && mano.n === 2 && mano.fija && mano.enPantalla && mano.cerrado === false,
      JSON.stringify(mano));

    // 6 · la compra es una tarea de la semana y sale en «Hoy» cuando toca. En el calendario de
    // Google NO entra: eso lo dijo él, y aquí se fija para que no se cuele luego.
    const tarea = await page.evaluate(() => { const P = window.PG;
      const mira = () => { P.ui.tab = 'hoy'; P.render();
        return /Toca hacer la compra/.test(document.getElementById('main').innerText); };
      P.food().compraCada = 4;
      delete P.food().ultimaCompra; P.save();
      const sinComprar = mira();
      P.food().ultimaCompra = P.iso(new Date()); P.save();
      const reciEn = mira();
      P.food().ultimaCompra = P.iso(P.addDays(new Date(), -4)); P.save();
      const pasados = mira();
      const t = P.tocaComprar();
      // y en el .ics no aparece por ningún lado
      let ics = '';
      try { ics = P.calEventos(P.iso(P.addDays(new Date(), -7)), P.iso(P.addDays(new Date(), 21)))
        .map((e) => e.title || '').join(' | '); } catch (e) { ics = 'ERR'; }
      P.ui.tab = 'shop'; P.render();
      return { sinComprar, reciEn, pasados, dias: t.dias, toca: t.toca,
        enCalendario: /compra/i.test(ics) }; });
    check('la compra sale en «Hoy» cuando toca, cada 4 días, y no entra en el calendario de Google',
      tarea.sinComprar === true && tarea.reciEn === false && tarea.pasados === true &&
      tarea.dias === 4 && tarea.toca === true && tarea.enCalendario === false,
      JSON.stringify(tarea));

    // 7 · y todo esto sobrevive a recargar: normalize() tira cualquier campo que no
    // conozca, así que una despensa sin registrar se perdía en silencio.
    const guarda = await page.evaluate(() => { const P = window.PG;
      P.despensaAdd('500 g lenteja pardina');
      P.save();
      P.store = JSON.parse(JSON.stringify(P.store));
      const f = P.food();
      const l = P.despensaS().filter((x) => /lenteja/.test(x.nom))[0];
      return { n: P.despensaS().length, q: l ? l.q : null, uni: l ? l.uni : null,
        ultima: f.ultimaCompra || null, mano: (f.neveraMano || []).length }; });
    check('la despensa y la fecha de la última compra sobreviven a recargar',
      guarda.q === 500 && guarda.uni === 'g' && /^\d{4}-\d{2}-\d{2}$/.test(guarda.ultima || ''),
      JSON.stringify(guarda));

    await page.evaluate(() => { const P = window.PG;
      P.food().despensa = []; P.food().neveraMano = []; P.food().nevera = [];
      delete P.food().ultimaCompra;
      P.store.listas = (P.store.listas || []).filter((l) => l.nombre !== 'A mano');
      P.ui.marks = new Set(); P.ui.compraSalida = 'todo'; P.ui.shopVista = '';
      P.ui.compraAbiertas = new Set(); P.ui.compraCerradas = new Set(['rutina', 'basicos', 'casa']);
      P.save(); P.render(); });
    await page.waitForTimeout(250);
  }

  // ===================================================================================
  // El ticket de la compra (fase 3). La foto la lee Claude, pero Claude SOLO existe
  // dentro del Artifact de claude.ai: en el móvil, que es donde se hace la compra,
  // window.claude no está. Así que lo que se prueba aquí —y lo que sirve a diario— es
  // pegar el ticket y que lo entienda la app, sin conexión y sin que nada salga.
  // ===================================================================================
  {
    const TICKET = [
      'MERCADONA, S.A.',
      'C/ VALENCIA, 12',
      'NIF: A-46103834',
      '25/09/2026 12:41 OP: 1234567',
      'Descripcion                P. Unit  Importe',
      '1 BOLSA PLASTICO                       0,15',
      '2 LECHE SEMI               0,89        1,78',
      '1 ACEITE OLIVA SUAVE                   5,95',
      '3 YOG NAT                  0,45        1,35',
      '1 PECHUGA POLLO                        4,32',
      '0,894 kg TOMATE RAMA       2,19        1,96',
      '1,250 kg PLATANO           1,49        1,86',
      '2 LENTEJA PARDINA          1,15        2,30',
      '1 PAN SIN GLUTEN                       2,45',
      '6 HUEVO L                  0,29        1,74',
      'TOTAL (€)                             25,86',
      'TARJETA BANCARIA                      25,86',
    ].join('\n');

    await gotoTab('shop');
    await page.waitForTimeout(350);
    await page.evaluate(() => { const P = window.PG;
      P.food().despensa = []; P.food().neveraMano = []; P.food().nevera = [];
      delete P.food().ultimaCompra;
      P.dineroS().pagos.length = 0;
      P.ui.ticket = null; P.ui.shopVista = ''; P.save(); P.render(); });
    await page.waitForTimeout(200);

    // 1 · el parser: saca las diez líneas de producto y el total, y NO se traga la
    // cabecera de la tienda ni la forma de pago
    const lee = await page.evaluate((t) => { const P = window.PG;
      const l = P.ticketLeer(t);
      return { n: l.items.length, total: l.total, sueltas: l.sueltas,
        // el peso llega entero: 0,894 kg son 894 g, no 890
        tomate: l.items.filter((x) => /tomate/.test(x.nom))[0],
        // y las abreviaturas del ticket se desarrollan
        leche: l.items.filter((x) => /leche/.test(x.nom))[0],
        yogur: l.items.filter((x) => /yogur/.test(x.nom))[0],
        // cada cosa a su pasillo, aunque el ticket venga en mayúsculas y sin tildes
        pasillos: l.items.map((x) => x.nom + '=' + P.seccionDeCompra(x.nom)) }; }, TICKET);
    check('el ticket pegado se lee entero: cantidades, pesos, abreviaturas y total',
      lee.n === 10 && lee.total === 25.86 && lee.sueltas.length === 0 &&
      lee.tomate && lee.tomate.q === 0.894 && lee.tomate.uni === 'kg' &&
      /leche semidesnatada/.test(lee.leche.nom) && /yogur natural/.test(lee.yogur.nom) &&
      lee.pasillos.indexOf('platano=verdura') >= 0 &&
      lee.pasillos.indexOf('leche semidesnatada=lacteos') >= 0,
      JSON.stringify(lee));

    // «PLATANO» sin tilde caía en el pasillo de las conservas porque la regla «lata»
    // no tenía frontera de palabra y casaba con el trozo «p-LATA-no»
    const tildes = await page.evaluate(() => { const P = window.PG;
      const c = (t) => P.seccionDeCompra(t);
      return { platano: c('platano'), platanoTilde: c('plátano'), lata: c('1 lata atún'),
        enLata: c('atún en lata'), ajo: c('6 diente ajo'), ajoMolido: c('ajo molido'),
        canonigo: c('300 g canonigos y tomate') }; });
    check('los pasillos entienden el texto sin tildes del ticket, y «lata» no se come al plátano',
      tildes.platano === 'verdura' && tildes.platanoTilde === 'verdura' &&
      tildes.lata === 'despensa' && tildes.enLata === 'despensa' &&
      tildes.ajo === 'verdura' && tildes.ajoMolido === 'despensa' &&
      tildes.canonigo === 'verdura',
      JSON.stringify(tildes));

    // 2 · la pantalla: pegar → leer → quitar una línea → a la despensa
    await page.click('[data-a="compra-ticket"]');
    await page.waitForTimeout(300);
    const sinClaude = await page.evaluate(() =>
      /Claude solo está cuando abres la app/.test(document.getElementById('main').innerText));
    await page.fill('#tkTxt', TICKET);
    await page.click('[data-a="tk-leer"]');
    await page.waitForTimeout(400);
    const pintado = await page.evaluate(() => document.querySelectorAll('#main .dfila').length);
    // la bolsa de plástico no es comida: se quita antes de meterla en casa
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('#main .dfila')].filter((d) => /bolsa/.test(d.innerText))[0];
      if (b) b.querySelector('[data-a="tk-quitar"]').click(); });
    await page.waitForTimeout(250);
    const trasQuitar = await page.evaluate(() => document.querySelectorAll('#main .dfila').length);
    await page.click('[data-a="tk-aplicar"]');
    await page.waitForTimeout(450);
    const casa = await page.evaluate(() => { const P = window.PG;
      const d = P.despensaS();
      return { n: d.length, dias: P.diasDesdeCompra(), vista: P.ui.shopVista,
        tomate: (d.filter((x) => /tomate/.test(x.nom))[0] || {}).q,
        uniTomate: (d.filter((x) => /tomate/.test(x.nom))[0] || {}).uni,
        bolsa: d.some((x) => /bolsa/.test(x.nom)) }; });
    check('el ticket entra en la despensa con sus cantidades, y lo que quitas no entra',
      sinClaude === true && pintado === 10 && trasQuitar === 9 &&
      casa.n === 9 && casa.bolsa === false && casa.dias === 0 && casa.vista === '' &&
      casa.tomate === 894 && casa.uniTomate === 'g',
      JSON.stringify({ sinClaude, pintado, trasQuitar, casa }));

    // 3 · lo que devuelva Claude es de fuera: se valida antes de pintarlo o guardarlo
    const sano = await page.evaluate(() => { const P = window.PG;
      return {
        basura: P.ticketSano({ items: [{ nom: '', q: 1 }, { nom: '   ', q: 2 }] }),
        noEsObjeto: P.ticketSano('lo que sea'),
        sinItems: P.ticketSano({ total: 30 }),
        bien: P.ticketSano({ items: [{ q: 2, uni: 'kg', nom: 'TOMATE RAMA', eur: 3.5 },
          { q: 99999999, uni: 'barriles', nom: 'aceite', eur: -5 }], total: 12.5 }) }; });
    check('lo que devuelve Claude se valida: unidades raras, números imposibles y líneas vacías fuera',
      sano.basura === null && sano.noEsObjeto === null && sano.sinItems === null &&
      sano.bien && sano.bien.items.length === 2 && sano.bien.items[0].nom === 'tomate rama' &&
      sano.bien.items[1].uni === '' && sano.bien.items[1].eur === 0 &&
      sano.bien.items[1].q === 10000 && sano.bien.total === 12.5,
      JSON.stringify(sano));

    await page.evaluate(() => { const P = window.PG;
      P.food().despensa = []; P.food().neveraMano = []; P.food().nevera = [];
      delete P.food().ultimaCompra;
      P.dineroS().pagos.length = 0;
      P.ui.ticket = null; P.ui.shopVista = ''; P.save(); P.render(); });
    await page.waitForTimeout(200);
  }

  // ===================== Dinero → ahorro =====================
  {
    // «no me interesa llevar la cuenta de gastos sino una ayuda para ahorrar»: la nómina sale de las
    // guardias (las de finde, sábado/domingo o festivo, suman más), lo que apartas se reparte en
    // huchas, y un reto cumplido va a la hucha que elijas. Encadenado: apartar → deshacer → apartar →
    // reto → sacar → recargar, que es donde se pierde el estado.
    const base = await page.evaluate(() => {
      const P = window.PG;
      delete P.store.ahorro;
      const hoy = new Date(), y = hoy.getFullYear(), m = hoy.getMonth();
      const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      // este mes: dos guardias de sábado/domingo y una de miércoles (se quitan las que hubiera)
      const G = P.store.shifts.filter(P.isGuardia)[0];
      P.monthDays(y, m).forEach((d) => { if (d.shiftId === G.id) P.setDayOverride(d.key, 'sh-t', ''); });
      const dias = P.monthDays(y, m).map((d) => d.date);
      const sab = dias.filter((d) => d.getDay() === 6)[0], dom = dias.filter((d) => d.getDay() === 0)[1] || dias.filter((d) => d.getDay() === 0)[0];
      const mie = dias.filter((d) => d.getDay() === 3)[1];
      [sab, dom, mie].forEach((d) => P.setDayOverride(iso(d), G.id, 'urg'));
      P.save(); P.render();
      const a = P.ahorroS(), mk = y + '-' + String(m + 1).padStart(2, '0');
      a.epocas = [{ id: 'e1', nombre: 'prueba', desde: '2000-01', neto: 2766, finde: 300, pagaJun: 0, pagaDic: 0 }];
      a.huchas.forEach((h) => { h.saldo = 0; });
      a.meses = {}; a.meses[mk] = { aparto: 700, hecho: false, reparto: {}, retos: [] };
      P.ui.dineroVista = ''; P.ui.ahoRetoNuevo = false;   // otra prueba dejó Dinero en «recibos»
      P.save();
      const n = P.nominaMes(y, m);
      return { finde: n.g.finde, total: n.g.total, est: n.est, mk };
    });
    await gotoTab('dinero');
    await page.waitForTimeout(250);
    const toca = async (sel) => { const el = await page.$(sel); if (el) await el.click(); await page.waitForTimeout(200); return !!el; };
    const hubo = [];
    const hero = await page.evaluate(() => (document.querySelector('#main .ahhero') || {}).innerText || '');
    hubo.push(await toca('#main [data-a="aho-mas"]'));   // 750
    hubo.push(await toca('#main [data-a="aho-menos"]')); // 700
    hubo.push(await toca('#main [data-a="aho-mas"]'));   // 750
    hubo.push(await toca('#main [data-a="aho-apartar"]'));
    const saldos1 = await page.evaluate(() => window.PG.ahorroS().huchas.map((h) => h.saldo));
    hubo.push(await toca('#main [data-a="aho-deshacer"]'));
    const saldos0 = await page.evaluate(() => window.PG.ahorroS().huchas.map((h) => h.saldo));
    hubo.push(await toca('#main [data-a="aho-apartar"]'));
    hubo.push(await toca('#main [data-a="aho-reto-nuevo"]'));
    // si el formulario no sale, la prueba FALLA (hubo[]), no se cuelga 30 s en un fill
    const form = await page.$('#ahRtNom');
    hubo.push(!!form);
    if (form) {
      await page.fill('#ahRtNom', 'Salir'); await page.fill('#ahRtMax', '150'); await page.fill('#ahRtAnt', '220');
      const hu2 = await page.evaluate(() => window.PG.ahorroS().huchas[1].id);
      await page.selectOption('#ahRtHu', hu2);
    }
    hubo.push(await toca('#main [data-a="aho-reto-add"]'));
    hubo.push(await toca('#main [data-a="aho-reto-ok"]'));
    const trasReto = await page.evaluate(() => window.PG.ahorroS().huchas[1].saldo);
    const vuelta = await page.evaluate(() => { const P = window.PG; P.store = JSON.parse(JSON.stringify(P.store));
      return P.ahorroS().huchas.map((h) => h.saldo); });
    check('Dinero estima la nómina con las guardias de finde y reparte lo que apartas en las huchas',
      base.finde === 2 && base.total === 3 && base.est === 3066 && /3066/.test(hero.replace(/\D/g, '')) &&
      hubo.every(Boolean) && saldos1.join() === '375,225,150' && saldos0.join() === '0,0,0' &&
      trasReto === 295 && vuelta.join() === '375,295,150',
      JSON.stringify({ base, hero: hero.slice(0, 120), hubo, saldos1, saldos0, trasReto, vuelta }));
    // un festivo entre semana cuenta como guardia de finde; el viernes normal, no
    const fest = await page.evaluate(() => {
      const P = window.PG, a = P.ahorroS();
      const hoy = new Date(), y = hoy.getFullYear(), m = hoy.getMonth();
      const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const mie = P.monthDays(y, m).map((d) => d.date).filter((d) => d.getDay() === 3)[1];
      const antes = P.guardiasDelMes(y, m).finde;
      a.festivos.push(iso(mie)); P.render();
      const despues = P.guardiasDelMes(y, m).finde;
      a.festivos.pop();
      return { antes, despues };
    });
    check('un festivo entre semana cuenta como guardia de finde', fest.antes === 2 && fest.despues === 3, JSON.stringify(fest));
    // la nómina se edita desde la app: una época nueva y lo cobrado de verdad manda sobre lo estimado
    await toca('#main [data-a="dinero-vista"][data-v="nomina"]');
    const hayCampo = await page.$('#main [data-a="aho-cobrado"][data-mk="' + base.mk + '"]');
    if (hayCampo) { await page.fill('#main [data-a="aho-cobrado"][data-mk="' + base.mk + '"]', '3001,50'); await page.keyboard.press('Tab'); await page.waitForTimeout(200); }
    const ep0 = await page.evaluate(() => window.PG.ahorroS().epocas.length);
    await toca('#main [data-a="aho-ep-add"]');
    const nom = await page.evaluate((mk) => { const P = window.PG, t = mk.split('-');
      return { cob: P.ahorroS().cobrado[mk], neto: P.nominaMes(+t[0], +t[1] - 1).neto, epocas: P.ahorroS().epocas.length }; }, base.mk);
    check('lo cobrado de verdad manda sobre lo estimado, y las épocas se añaden desde la app',
      !!hayCampo && nom.cob === 3001.5 && nom.neto === 3001.5 && nom.epocas === ep0 + 1, JSON.stringify({ nom, ep0 }));
    await page.evaluate(() => { const P = window.PG; delete P.store.ahorro;
      const hoy = new Date(), G = P.store.shifts.filter(P.isGuardia)[0];
      P.monthDays(hoy.getFullYear(), hoy.getMonth()).forEach((d) => { if (d.shiftId === G.id) P.setDayOverride(d.key, null); });
      P.ui.dineroVista = ''; P.save(); P.render(); });
  }

  // ===================== Dinero → lo real: capturas de Fintonic =====================
  {
    // El lector que corre en el móvil confunde cifras con la letra fina de Fintonic. Con las capturas
    // del usuario: «11 €» leído «1 €», «63,00» leído «603,00» y «03,00», el 7 leído «/». La regla es que
    // nada dudoso pase por bueno: lo que cuadra con otra cifra es bueno, y lo demás se marca.
    const fin = await page.evaluate(() => {
      const P = window.PG;
      const inicio = 'Bancos    582€ -\nIngresos T 1€ Gastos y 1.578€';
      const analisis = 'Análisis\n1 sept - 30 sept 2026\nIngresos    10,91€\nGastos   -1.578,40€\nNeto   -1.567,49€';
      const catMal = '1 sept - 30 sept 2026\nAx Alquiler y compra   600,00€ >\nSupermercado   283,06€ >\n' +
        '26 movimientos de 300€\nRestaurante   03,00€ >\nTransportes   22/28€ »';
      const catBien = '1 sept - 30 sept 2026\nAlquiler y compra  1.000,00€ >\nSupermercado  578,40€ >';
      const j1 = P.finJunta([inicio, analisis, catMal].map(P.finParse));
      const j2 = P.finJunta([analisis, catBien].map(P.finParse));
      const n = (t, d) => P.finNum(t, d);
      return {
        banco: j1.banco, ing: j1.ingresos, gas: j1.gastos, mes: j1.mes,
        cats1: j1.cats.map((c) => c.nombre + '=' + c.v + (c.ok ? '' : '?')), descuadre: j1.descuadre,
        cats2: j2.cats.map((c) => c.nombre + '=' + c.v + (c.ok ? '' : '?')),
        ceroDelante: n('03,00', true), letra: n('6O,00', true), barra: n('1.5/8,40', true), bueno: n('1.578,40', true),
        llega: [[2026, 8], [2026, 9], [2026, 10], [2027, 1]].map((x) => P.iso(P.llegadaNomina(x[0], x[1]).llega)),
      };
    });
    check('las capturas de Fintonic: lo que cuadra es bueno y lo dudoso se marca, nunca pasa por bueno',
      fin.banco && fin.banco.v === 582 && fin.banco.ok && fin.mes === '2026-09' &&
      // Inicio dice 1 y Análisis 10,91: no cuadran, manda Análisis y queda para revisar
      fin.ing.v === 10.91 && fin.ing.ok === false &&
      // Inicio 1.578 y Análisis 1.578,40 cuadran: bueno y con céntimos
      fin.gas.v === 1578.4 && fin.gas.ok === true &&
      // las categorías no suman el gasto: todas a revisar, aunque alguna tenga buena pinta
      fin.cats1.length === 4 && fin.cats1.every((c) => /\?$/.test(c)) && fin.descuadre != null &&
      // y cuando suman justo el gasto del mes, todas son buenas
      fin.cats2.join() === 'Alquiler y compra=1000,Supermercado=578.4' &&
      !fin.ceroDelante.ok && !fin.letra.ok && !fin.barra.ok && fin.bueno.ok && fin.bueno.v === 1578.4,
      JSON.stringify(fin));
    // la nómina se transfiere el 25 y tarda dos días hábiles: si el 25 cae en viernes o en fin de
    // semana llega más tarde. vie 25 sep → mar 29; dom 25 oct → mar 27; mié 25 nov → vie 27;
    // jue 25 feb 2027 → lun 1 mar
    check('la nómina llega dos días hábiles después del 25, saltando fines de semana',
      fin.llega.join() === '2026-09-29,2026-10-27,2026-11-27,2027-03-01', JSON.stringify(fin.llega));

    // y de punta a punta, con el lector de verdad (vendor/ocr) sobre una captura que se dibuja aquí
    // mismo, al estilo de la pantalla de Inicio de Fintonic: subirla, revisar, guardar, verla en Dinero
    await page.evaluate(() => { const P = window.PG; delete P.store.ahorro; P.ui.fin = null; P.ui.dineroVista = ''; P.save(); });
    await gotoTab('dinero');
    await page.waitForTimeout(250);
    const png = await page.evaluate(() => {
      const c = document.createElement('canvas'); c.width = 900; c.height = 700;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 900, 700);
      x.fillStyle = '#1f2a55'; x.font = '44px sans-serif';
      x.fillText('Bancos', 60, 160); x.fillText('1.234€', 640, 160);
      x.font = '40px sans-serif'; x.fillStyle = '#556';
      x.fillText('Ingresos  25€     Gastos  987€', 60, 330);
      return c.toDataURL('image/png').split(',')[1];
    });
    const input = await page.$('#main input[data-a="fin-fotos"]');
    let leido = null, tarjeta = '';
    if (input) {
      await input.setInputFiles({ name: 'captura.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
      try {
        await page.waitForFunction(() => window.PG.ui.fin && window.PG.ui.fin.estado !== 'leyendo', null, { timeout: 120000 });
      } catch (e) { /* si no acaba, la prueba falla abajo con lo que haya */ }
      leido = await page.evaluate(() => { const f = window.PG.ui.fin || {}; const r = f.res || {};
        return { estado: f.estado, msg: f.msg, banco: r.banco, gastos: r.gastos, ingresos: r.ingresos,
          pantalla: !!document.querySelector('#main [data-a="fin-guardar"]') }; });
      const g = await page.$('#main [data-a="fin-guardar"]');
      if (g) { await g.click(); await page.waitForTimeout(300); }
      tarjeta = await page.evaluate(() => ((document.querySelector('#main .finreal') || {}).innerText || '').replace(/\s+/g, ' '));
    }
    const guardado = await page.evaluate(() => (window.PG.ahorroS().real || [])[0] || null);
    check('una captura se lee en el móvil, se revisa y al guardarla sale en Dinero con cuándo llega la nómina',
      !!input && leido && leido.estado === 'listo' && leido.pantalla && leido.banco && leido.banco.v === 1234 &&
      guardado && guardado.banco === 1234 && /1234 €/.test(tarjeta) && /nómina llega/.test(tarjeta),
      JSON.stringify({ leido, guardado, tarjeta: tarjeta.slice(0, 160) }));
    await page.evaluate(() => { const P = window.PG; delete P.store.ahorro; P.ui.fin = null; P.ui.dineroVista = ''; P.save(); P.render(); });
  }

  // ===================================================================================
  // Las kcal que le tocan y los días que se salen del plan (fase 4). La fórmula es
  // Mifflin-St Jeor y el resultado se comprueba A MANO aquí abajo: si alguien toca el
  // cálculo, esta prueba dice en qué número se ha desviado, no solo que falla.
  // ===================================================================================
  {
    const calc = await page.evaluate(() => { const P = window.PG;
      P.setPerfil('alturaCm', 179); P.setPerfil('pesoKg', 95);
      P.setPerfil('nacidoF', '1998-10-06'); P.setPerfil('actividad', 1.55);
      P.setPerfil('meta', 'perder');
      const perder = { b: P.metabolismoBasal(), g: P.gastoDiario(),
        k: P.kcalSugeridas(), pr: P.proteinaSugerida() };
      P.setPerfil('meta', 'mantener');
      const mantener = { k: P.kcalSugeridas(), pr: P.proteinaSugerida() };
      P.setPerfil('meta', 'ganar');
      const ganar = { k: P.kcalSugeridas(), pr: P.proteinaSugerida() };
      P.setPerfil('meta', 'perder');
      // sin fecha de nacimiento no se inventa nada: se dice lo que falta
      P.setPerfil('nacidoF', '');
      const sinEdad = { b: P.metabolismoBasal(), k: P.kcalSugeridas(), falta: P.kcalFaltaTxt() };
      P.setPerfil('nacidoF', '1998-10-06');
      return { edad: P.edadHoy(), perder, mantener, ganar, sinEdad }; });
    // 10·95 + 6,25·179 − 5·27 + 5 = 1938,75 → 1939;  ×1,55 = 3005;  −18 % = 2464 → 2460
    const basalManual = Math.round(10 * 95 + 6.25 * 179 - 5 * 27 + 5);
    const gastoManual = Math.round(basalManual * 1.55);
    check('las kcal salen de Mifflin-St Jeor y cuadran con la cuenta hecha a mano',
      calc.edad === 27 && calc.perder.b === basalManual && calc.perder.g === gastoManual &&
      calc.perder.k === Math.round(gastoManual * 0.82 / 10) * 10 && calc.perder.pr === 190 &&
      calc.mantener.k === Math.round(gastoManual / 10) * 10 && calc.mantener.pr === 150 &&
      calc.ganar.k > calc.mantener.k && calc.ganar.pr === 170 &&
      // nunca por debajo del metabolismo basal, y sin datos se dice qué falta en vez de un cero
      calc.perder.k > calc.perder.b &&
      calc.sinEdad.b === 0 && calc.sinEdad.k === 0 && /fecha de nacimiento/.test(calc.sinEdad.falta),
      JSON.stringify({ calc, basalManual, gastoManual }));

    // el botón deja el objetivo puesto, y entonces la tarjeta lo dice en vez de volver a ofrecerlo
    await gotoTab('food');
    await page.waitForTimeout(300);
    await page.evaluate(() => { window.PG.ui.foodVista = 'perfil'; window.PG.render(); });
    await page.waitForTimeout(300);
    await page.click('[data-a="kcal-poner"]');
    await page.waitForTimeout(350);
    const puesto = await page.evaluate(() => ({ ob: window.PG.food().objetivo,
      dicho: /es lo que tienes puesto/.test(document.getElementById('main').innerText) }));
    check('«poner como mi objetivo» deja las kcal y la proteína puestas, y la tarjeta lo dice',
      puesto.ob.kcal === calc.perder.k && puesto.ob.prot === 190 && puesto.dicho === true,
      JSON.stringify(puesto));

    // los tres tipos de día. El del hospital NO inventa kcal: él lo pidió así.
    await page.evaluate(() => { const P = window.PG;
      P.food().diasEsp = {}; P.ui.foodVista = ''; P.save(); P.render(); });
    await page.waitForTimeout(300);
    const kcal0 = await page.evaluate(() => window.PG.foodTotals(window.PG.diaComer()).kcal);
    await page.click('[data-a="dia-esp"][data-t="moncheo"]');
    await page.waitForTimeout(350);
    const conMoncheo = await page.evaluate(() => window.PG.foodTotals(window.PG.diaComer()).kcal);
    // la estimación es editable: es mía, no una medida
    await page.fill('[data-a="dia-esp-kcal"]', '300');
    await page.evaluate(() => { const i = document.querySelector('[data-a="dia-esp-kcal"]');
      i.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.waitForTimeout(400);
    const editado = await page.evaluate(() => window.PG.foodTotals(window.PG.diaComer()).kcal);
    // y la vista NO se rompe al editar un campo y repintar (ver la prueba del blur, abajo)
    const viva = await page.evaluate(() => !/Se ha roto esta vista/.test(document.getElementById('main').innerText));
    await page.click('[data-a="dia-esp"][data-t="hospital"]');
    await page.waitForTimeout(350);
    const hosp = await page.evaluate(() => { const P = window.PG;
      const k = P.diaComer();
      return { kcal: P.foodTotals(k).kcal, plan: P.planTotalsOf(k).kcal,
        esp: P.diaEspDe(k), persiste: (P.store = JSON.parse(JSON.stringify(P.store)),
          P.diaEspDe(k)) }; });
    // se compara la DIFERENCIA y no el número absoluto: este día ya trae apuntada la comida de
    // las pruebas de más arriba, y encadenar es justo lo que se quiere probar
    check('el moncheo suma kcal estimadas y editables; el menú del hospital no inventa ninguna',
      conMoncheo - kcal0 === 600 && editado - kcal0 === 300 && viva === true &&
      hosp.kcal === kcal0 && hosp.plan === 0 && hosp.esp.tipo === 'hospital' &&
      hosp.persiste && hosp.persiste.tipo === 'hospital',
      JSON.stringify({ kcal0, conMoncheo, editado, viva, hosp }));

    // el fallo que sacó todo esto: escribir en un campo y que el repintado lo desmonte
    // mientras tiene el foco tiraba la vista entera con «Se ha roto esta vista». Le pasaba
    // a cualquier campo que guarde y repinte desde el listener de change, no solo a este.
    const foco = await page.evaluate(() => { const P = window.PG;
      P.ui.tab = 'food'; P.ui.foodVista = ''; P.ui.foodObjOpen = true; P.render();
      const i = document.querySelector('[data-a="food-ob"][data-k="kcal"]');
      if (!i) return { hay: false };
      i.focus(); i.value = '2300';
      i.dispatchEvent(new Event('change', { bubbles: true }));
      return { hay: true, roto: /Se ha roto esta vista/.test(document.getElementById('main').innerText),
        kcal: P.food().objetivo.kcal }; });
    check('editar un campo y repintar no tira la vista, aunque el campo tuviera el foco',
      foco.hay === true && foco.roto === false && foco.kcal === 2300,
      JSON.stringify(foco));

    await page.evaluate(() => { const P = window.PG;
      P.food().diasEsp = {}; P.food().objetivo = { kcal: 0, prot: 0 };
      P.store.perfil.pesos = []; P.setPerfil('nacidoF', ''); P.setPerfil('meta', 'mantener');
      P.ui.foodVista = ''; P.ui.foodObjOpen = false; P.save(); P.render(); });
    await page.waitForTimeout(250);
  }

  // ===================================================================================
  // Montar la semana sola (fase 5). El modo automático vive AL LADO del manual, no en
  // su lugar. Tres reglas que no se saltan: con gluten no entra, gana lo que ya está
  // en casa, y el día tiene que acercarse a sus kcal.
  // ===================================================================================
  {
    await page.evaluate(() => { const P = window.PG;
      if (!P.esCeliaco()) P.setPerfil('celiaco');
      P.setPerfil('alturaCm', 179); P.setPerfil('pesoKg', 95);
      P.setPerfil('nacidoF', '1998-10-06'); P.setPerfil('actividad', 1.55);
      P.setPerfil('meta', 'perder');
      P.food().objetivo = { kcal: 2460, prot: 190 };
      P.food().despensa = []; P.food().nevera = []; P.food().neveraMano = [];
      P.save(); });

    // 1 · los candidatos de cada toma salen de SUS menús, no de una tabla de fuera
    const clases = await page.evaluate(() => { const P = window.PG;
      const c = P.platosDeClase();
      return { desayuno: Object.keys(c.desayuno || {}).length,
        comida: Object.keys(c.comida || {}).length,
        cena: Object.keys(c.cena || {}).length,
        // y la etiqueta de la toma se clasifica bien
        etq: [P.claseDeToma('Desayuno pre-entreno'), P.claseDeToma('Comida en destino'),
          P.claseDeToma('Cena de fuerza'), P.claseDeToma('Media mañana'),
          P.claseDeToma('Snack nocturno (opcional)')] }; });
    check('los platos candidatos de cada toma salen de tus propios menús, no de una tabla',
      clases.desayuno >= 3 && clases.comida >= 3 && clases.cena >= 2 &&
      clases.etq.join(',') === 'desayuno,comida,cena,media,media',
      JSON.stringify(clases));

    // 2 · el día llega cerca de sus kcal y NO repite plato. Con un plato por toma se
    // quedaba en 1500 de 2460, que no es un menú sino media dieta.
    const sinDesp = await page.evaluate(() => { const P = window.PG;
      return P.menuAutoSemana().map((pl) => {
        const ids = [];
        pl.props.forEach((pr) => (pr.dishes || []).forEach((d) => ids.push(d.id)));
        return { dia: P.shiftById(pl.shiftId).name, kcal: pl.kcal, prot: pl.prot,
          repes: ids.length - new Set(ids).size,
          conGluten: ids.filter((id) => P.glutenDePlato(P.dishById(id)).est === 'si').length }; }); });
    check('cada día se acerca a tus kcal, sin repetir plato y sin colar ninguno con gluten',
      sinDesp.length >= 4 &&
      sinDesp.every((d) => d.kcal > 2460 * 0.85 && d.kcal < 2460 * 1.15) &&
      sinDesp.every((d) => d.repes === 0) &&
      sinDesp.every((d) => d.conGluten === 0) &&
      sinDesp.every((d) => d.prot > 120),
      JSON.stringify(sinDesp));

    // 3 · lo que YA está en casa gana: es lo que cierra el círculo con la compra
    const conDesp = await page.evaluate(() => { const P = window.PG;
      const antes = P.menuAutoSemana();
      const porQueAntes = antes.map((pl) => pl.props.map((pr) => pr.porQue).join(' | ')).join(' || ');
      // entra en casa justo lo del porridge
      ['320 g yogur griego natural', '160 g copos de avena', '400 ml leche',
        '4 plátano', '100 g miel'].forEach((t) => P.despensaAdd(t));
      P.save();
      const cub = P.platoCubierto(P.dishById('d-porridge'));
      const tras = P.menuAutoSemana();
      const porQueTras = tras.map((pl) => pl.props.map((pr) => pr.porQue).join(' | ')).join(' || ');
      // ¿sale el porridge en más días que antes?
      const cuenta = (planes) => planes.filter((pl) => pl.props.some((pr) =>
        (pr.dishes || []).some((d) => d.id === 'd-porridge'))).length;
      return { cubPct: cub.pct, cubN: cub.n, cubTotal: cub.total,
        antesEnCasa: /lo tienes en casa/.test(porQueAntes),
        trasEnCasa: /lo tienes en casa/.test(porQueTras),
        diasAntes: cuenta(antes), diasTras: cuenta(tras) }; });
    check('lo que ya tienes en casa pesa en la elección y se dice por qué está ahí',
      conDesp.cubPct === 100 && conDesp.cubN === 5 && conDesp.cubTotal === 5 &&
      conDesp.antesEnCasa === false && conDesp.trasEnCasa === true &&
      conDesp.diasTras >= conDesp.diasAntes,
      JSON.stringify(conDesp));

    // 4 · aplicar lo escribe de verdad: una toma con «comida» guardada apunta a un
    // mealId, y si no se suelta ese enlace seguiría mandando la comida vieja
    await gotoTab('types');
    await page.waitForTimeout(350);
    await page.click('[data-a="types-vista"][data-v="auto"]');
    await page.waitForTimeout(450);
    const antesAplicar = await page.evaluate(() => window.PG.slotsFor('sh-f')
      .map((s) => ({ meal: s.mealId, n: (s.items || []).length })));
    await page.click('[data-a="auto-aplicar"]');
    await page.waitForTimeout(350);
    const hayConfirm = await page.$('#modal [data-a="confirm-yes"]');
    if (hayConfirm) { await hayConfirm.click(); await page.waitForTimeout(500); }
    const trasAplicar = await page.evaluate(() => { const P = window.PG;
      return { slots: P.slotsFor('sh-f').map((s) => ({ meal: s.mealId, n: (s.items || []).length })),
        kcal: P.dayTotals('sh-f').kcal, vista: P.ui.typesVista }; });
    check('«poner esto en mis menús» escribe las tomas y suelta la comida guardada que las mandaba',
      !!hayConfirm &&
      antesAplicar.some((s) => s.meal) &&
      trasAplicar.slots.every((s) => !s.meal) &&
      trasAplicar.slots.every((s) => s.n >= 1) &&
      trasAplicar.kcal > 2460 * 0.85 && trasAplicar.kcal < 2460 * 1.15 &&
      trasAplicar.vista === '',
      JSON.stringify({ antesAplicar, trasAplicar }));

    await page.evaluate(() => { const P = window.PG;
      P.food().despensa = []; P.food().nevera = []; P.food().neveraMano = [];
      P.food().objetivo = { kcal: 0, prot: 0 };
      P.setPerfil('nacidoF', ''); P.setPerfil('meta', 'mantener');
      P.ui.menuAuto = null; P.ui.typesVista = ''; P.save(); P.render(); });
    await page.waitForTimeout(250);
  }

  // ===================================================================================
  // Ir y volver del trabajo. La app decía «al salir de la jornada» y usaba una hora
  // FIJA: con jornada de 8 a 15 te ponía a comer EN CASA a las 14:00, que es imposible
  // —a esa hora estás en el hospital—. Y no contaba el rato de llegar a ningún lado.
  // ===================================================================================
  {
    const k = await page.evaluate(() => { const P = window.PG;
      P.store.rotation.mode = 'date'; P.store.rotation.anchorSet = true;
      P.store.rotation.viaje = { min: 20, bus: '07:35', antes: 4, on: true };
      // un día de jornada 8–15, sin entreno. Tiene que ser LABORABLE: en sábado no hay jornada de
      // la que salir y la prueba caía por el día en que se ejecutara, no por el código
      const k = P.diaLaborableCerca();
      P.setDayOverride(k, 'sh-t', '');
      P.save(); return k; });

    const viaje = await page.evaluate((k) => { const P = window.PG;
      const jor = P.jornadaOf(k);
      const cp = P.comidaPrincipalDe(k);
      const bl = P.bloquesDelDia(k);
      const hm = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
      const finJor = jor && jor.end ? (+jor.end.slice(0, 2) * 60 + +jor.end.slice(3, 5)) : null;
      const comida = bl.filter((b) => /Comida/i.test(b.tit))[0];
      return { jornada: jor ? (jor.start + '-' + jor.end) : '—',
        comidaDe: cp ? cp.de : '', por: cp ? cp.por : '',
        llegas: P.llegasACasa(k) != null ? hm(P.llegasACasa(k)) : '',
        salirTxt: P.salirDeCasaTxt(),
        // el bloque de la comida en el carril tiene que ir DESPUÉS de la jornada
        comidaTrasJornada: !!(comida && finJor != null && comida.de >= finJor),
        salirDeCasa: bl.filter((b) => /Salir de casa/.test(b.tit))[0] || null,
        aCasa: bl.filter((b) => /A casa/.test(b.tit))[0] || null }; }, k);
    check('con jornada de 8 a 15 la comida cae al llegar a casa, no a las 14:00 en el hospital',
      viaje.jornada === '08:00-15:00' && viaje.comidaDe === '15:20' && viaje.por === 'llegar' &&
      viaje.llegas === '15:20' && viaje.comidaTrasJornada === true,
      JSON.stringify(viaje));
    // salir de casa sale del bus y de los minutos que quieres estar antes en la parada
    check('el carril enseña a qué hora salir de casa para el bus, y cuándo llegas de vuelta',
      /salir de casa 07:31 · bus 07:35/.test(viaje.salirTxt) &&
      viaje.salirDeCasa && viaje.salirDeCasa.de === 7 * 60 + 31 && viaje.salirDeCasa.fino === true &&
      viaje.aCasa && viaje.aCasa.a === 15 * 60 + 20,
      JSON.stringify(viaje));

    // al calendario va UNA línea corta antes de entrar, y nada más del desplazamiento
    const ics = await page.evaluate((k) => { const P = window.PG;
      const evs = P.calEventos(k, k);
      const v = evs.filter((e) => /Salir de casa/.test(e.summ));
      return { n: v.length, summ: v[0] ? v[0].summ : '', cat: v[0] ? v[0].cat : '',
        total: evs.length }; }, k);
    check('al calendario de Google va una sola línea del viaje: salir de casa y el bus',
      ics.n === 1 && /Salir de casa 07:31 · bus 07:35/.test(ics.summ) && ics.cat === 'TRABAJO',
      JSON.stringify(ics));

    // y se puede apagar sin tocar código: es un ajuste, no una constante
    const off = await page.evaluate((k) => { const P = window.PG;
      P.store.rotation.viaje.on = false; P.save();
      const bl = P.bloquesDelDia(k);
      const cp = P.comidaPrincipalDe(k);
      P.store.rotation.viaje.on = true; P.save();
      return { salir: bl.some((b) => /Salir de casa/.test(b.tit)),
        comidaDe: cp.de }; }, k);
    check('el viaje se apaga desde Ajustes, y entonces la comida vuelve a la hora de salir',
      off.salir === false && off.comidaDe === '15:00',
      JSON.stringify(off));

    await page.evaluate((k) => { const P = window.PG; P.setDayOverride(k, null); P.save(); P.render(); }, k);
    await page.waitForTimeout(200);
  }


  // ===================================================================================
  // La semana y el día pedían tres pantallas de scroll, y la comida post-entreno caía a
  // las 18:00 aunque el entreno fuera a las 6:30 de la mañana. Lo que se puede tocar sin
  // programar —cuánta pantalla ocupa el carril— sale a Ajustes.
  // ===================================================================================
  {
    // 1) UN ENTRENO DE MAÑANA NO MUEVE LA COMIDA A LAS 18:00. El día de fuerza entrena a las
    // 6:30 y tiene jornada de 8 a 15: la comida es al llegar a casa, no «post-entreno · 18:00».
    const ent = await page.evaluate(() => { const P = window.PG, S = P.store;
      S.rotation.mode = 'date'; S.rotation.anchorSet = true;
      S.rotation.viaje = { min: 20, bus: '07:35', antes: 4, on: true };
      const k = P.iso(new Date());
      const sh = S.shifts.filter((x) => /fuerza/i.test(x.name || ''))[0];
      if (!sh) return { sinDiaDeFuerza: true };
      const antes = { start: sh.start, end: sh.end };
      sh.start = '06:30'; sh.end = '08:00';
      P.setDayOverride(k, sh.id, ''); P.save();
      const manana = { fin: P.finEntrenoDe(k), cp: P.comidaPrincipalDe(k) };
      // y por la tarde SÍ manda: entrenando de 17:00 a 18:15 la comida es la post-entreno
      sh.start = '17:00'; sh.end = '18:15'; P.save();
      const tarde = { fin: P.finEntrenoDe(k), cp: P.comidaPrincipalDe(k) };
      sh.start = antes.start; sh.end = antes.end; P.setDayOverride(k, null); P.save(); P.render();
      return { manana, tarde }; });
    check('entrenando a las 6:30 la comida es al llegar del trabajo, no «post-entreno» a las 18:00',
      ent.sinDiaDeFuerza ? false : (
        ent.manana.fin === 8 * 60 && ent.manana.cp.por !== 'entreno' && ent.manana.cp.de !== '18:00' &&
        ent.tarde.fin === 18 * 60 + 15 && ent.tarde.cp.por === 'entreno' && ent.tarde.cp.de === '18:00'),
      JSON.stringify(ent));

    // 2) CUÁNTA PANTALLA OCUPA EL CARRIL se elige en Ajustes, no se codifica. Se conduce el
    // <select> de verdad: vive en el listener de `change`, y un `case` en el switch de clicks
    // no se dispararía nunca.
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'ajustes'; P.ui.cfgVista = 'aspecto'; P.render(); });
    await page.waitForTimeout(350);
    const altoUI = await page.evaluate(() => ({
      hay: !!document.querySelector('#main [data-a="franja-alto"]'),
      valor: (document.querySelector('#main [data-a="franja-alto"]') || {}).value }));
    await page.selectOption('#main [data-a="franja-alto"]', 'bajo');
    await page.waitForTimeout(300);
    const bajo = await page.evaluate(() => { const P = window.PG;
      P.ui.tab = 'hoy'; P.render(); const h = document.querySelector('#main .carrilbox');
      const hoy = h ? Math.round(h.getBoundingClientRect().height) : -1;
      P.ui.tab = 'week'; P.render(); const w = document.querySelector('#main .semrej .carrilbox');
      return { hoy, sem: w ? Math.round(w.getBoundingClientRect().height) : -1,
        guardado: P.store.franja.alto }; });
    // y el ajuste SOBREVIVE a recargar: normalize() tira los campos que no reconoce
    const traNormalize = await page.evaluate(() => { const P = window.PG;
      P.store = JSON.parse(JSON.stringify(P.store)); P.save(); return P.store.franja.alto; });
    await page.evaluate(() => { const P = window.PG; P.store.franja.alto = 'medio'; P.save();
      P.ui.tab = 'week'; P.render(); });
    await page.waitForTimeout(250);
    check('el alto del carril se cambia en Ajustes, manda en Hoy y en la semana, y aguanta recargar',
      altoUI.hay && altoUI.valor === 'medio' && bajo.guardado === 'bajo' &&
      bajo.hoy > 0 && bajo.hoy <= 300 && bajo.sem > 0 && bajo.sem <= 260 && traNormalize === 'bajo',
      JSON.stringify({ altoUI, bajo, traNormalize }));

    // 3) LA SEMANA, EN UNA LÍNEA POR DÍA. El sueño va en UNA pastilla y el sol se fue a la
    // cabecera: repetirlo en los siete días costaba un renglón por día y no decía nada nuevo
    // (sale y se pone con cuatro minutos de diferencia de punta a punta de la semana).
    const sem2 = await page.evaluate(() => { const main = document.querySelector('#main');
      const filas = [...main.querySelectorAll('.drow')];
      return { pant: +(main.scrollHeight / 915).toFixed(2),
        // el sol, UNA vez arriba y ninguna en las filas
        solCabecera: !!main.querySelector('.card .solsem'),
        solEnFilas: filas.filter((f) => f.querySelector('.pie.sol')).length,
        // las horas de dormir, sombreadas en la columna de cada día de la rejilla
        nocheRejilla: main.querySelectorAll('.semrej .scol .tl-noche').length,
        dias: filas.length,
        // y la mayoría de los días cerrados caben en un renglón. No todos: un día con cinco tomas
        // y la pastilla del sueño no entra en 370 px y envuelve a dos, que es el comportamiento
        // correcto —lo que no puede volver a pasar es que envuelvan TODOS, que era lo de antes
        lineasAltas: filas.filter((f) => { const l = f.querySelector('.drlinea');
          return !!l && l.getBoundingClientRect().height > 40 &&
            !/😴/.test(l.innerText); }).length }; });
    check('la semana entra en poco más de dos pantallas: el sol una vez arriba y un renglón por día',
      sem2.pant <= 2.3 && sem2.solCabecera && sem2.solEnFilas === 0 &&
      sem2.nocheRejilla >= 7 && sem2.lineasAltas < sem2.dias / 2,
      JSON.stringify(sem2));

    // 4) las sesiones de cocina, plegadas: cuándo toca ponerse a la vista y los platos al abrir
    const coc2 = await page.evaluate(() => { const main = document.querySelector('#main');
      const d = main.querySelector('details.cocm');
      if (!d) return { sinCocina: true };
      const cerrado = Math.round(d.getBoundingClientRect().height);
      d.open = true;
      return { cerrado, abierto: Math.round(d.getBoundingClientRect().height),
        platos: d.querySelectorAll('.plato').length,
        aCocina: !!d.querySelector('[data-a="tab"][data-t="batches"]') }; });
    check('las sesiones de cocina de la semana van plegadas, con sus platos dentro',
      coc2.sinCocina ? false : (coc2.cerrado <= 60 && coc2.abierto >= coc2.cerrado * 2.5 &&
        coc2.platos >= 1 && coc2.aCocina),
      JSON.stringify(coc2));

    // 5) A LAS ONCE DE LA NOCHE LA TARJETA DE «AHORA» DESAPARECÍA: ya no queda nada hoy y no hay
    // «siguiente», así que devolvía cadena vacía justo cuando quieres saber a qué hora suena el
    // despertador. Se comprueba a una hora cualquiera del día, sin depender del reloj real.
    const ahora = await page.evaluate(() => { const P = window.PG;
      const k = P.iso(new Date());
      const html = P.hoyAhoraHTML(k, P.dayInfo(k), true);
      return { hay: /hoyahora/.test(html), sig: /SIGUIENTE/.test(html),
        vacio: html === '' }; });
    check('«Hoy» siempre dice qué es lo siguiente, aunque ya no quede nada por hoy',
      ahora.hay && ahora.sig && !ahora.vacio, JSON.stringify(ahora));

    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'hoy'; P.render(); });
    await page.waitForTimeout(200);
  }

  // 200) COCINA: el buscador de nutrición, los platos por alimento y la compra por alimento
  {
    const cocina = await page.evaluate(() => {
      const P = window.PG;
      const m = (t) => { const a = P.alimDeTexto(t); return a ? a.n : null; };
      const plato = { id: 'd-t200', name: 'Prueba 200', icon: '🍗', portions: 2, batchId: '',
        ingredients: ['300 g pechuga de pollo', '2 patata', '1 cda aceite de oliva', 'un chorrito de salsa rara'], steps: [] };
      P.migrarPlato(plato);
      const todos = P.alimTodos().length;
      return {
        todos,
        pollo: m('pechuga de pollo'), lent: m('lentejas'), rara: m('salsa rara'),
        alims: plato.alims.length, sin: plato.sinCasar,
        kcalSinTocar: plato.kcal === undefined,
        porDefecto: P.store.dishes.filter((d) => d.alimsV && !(d.sinCasar || []).length).length,
        platos: P.store.dishes.length,
      };
    });
    check('la base de alimentos pasa de 86 a más de 300 y casa lo que se escribe en una receta',
      cocina.todos > 300 && /pechuga de pollo/i.test(cocina.pollo || '') && /lenteja/i.test(cocina.lent || '') &&
      cocina.rara === null, JSON.stringify(cocina));
    check('un plato de texto pasa a alimentos con gramos; lo que no se reconoce queda para elegir y no inventa kcal',
      cocina.alims === 3 && cocina.sin.length === 1 && cocina.kcalSinTocar, JSON.stringify(cocina));

    await gotoFood('add', 'buscar');
    await page.fill('#fbQ', 'pollo');
    await page.waitForTimeout(400);
    const bus = await page.evaluate(() => ({
      filas: document.querySelectorAll('#main .hit').length,
      grupos: Array.from(document.querySelectorAll('#main .grp')).map((g) => g.textContent),
      racion: !!document.querySelector('#main .kc.rac b'),
      off: !!document.querySelector('#main [data-a="off-buscar"]'),
    }));
    check('buscar «pollo» saca genéricos con su ración, Mercadona aparte y Open Food Facts a un toque',
      bus.filas >= 15 && bus.grupos.some((g) => /Mercadona/.test(g)) && bus.racion && bus.off, JSON.stringify(bus));

    const hit = await page.$('#main .hit [data-a="food-abrir"]');
    if (hit) await hit.click();
    await page.waitForTimeout(200);
    const fav = await page.$('[data-a="food-fav"]');
    if (fav) await fav.click();
    const nev = await page.$('[data-a="food-dest"][data-d="nevera"]');
    if (nev) await nev.click();
    await page.waitForTimeout(150);
    const ap = await page.$('[data-a="food-apuntar"]');
    if (ap) await ap.click();
    await page.waitForTimeout(200);
    const dest = await page.evaluate(() => {
      const P = window.PG;
      return { fav: (P.food().favV || []).length, nevera: (P.food().despensa || []).length,
        hoy: (P.food().log || []).length };
    });
    check('la hoja de cantidad guarda en favoritos y manda a la nevera en vez de a la comida de hoy',
      dest.fav >= 1 && dest.nevera >= 1, JSON.stringify(dest));
    await page.evaluate(() => { const P = window.PG; P.ui.foodTab = 'fav'; P.ui.foodBusca = ''; P.ui.foodVista = 'buscar'; P.render(); });
    await page.waitForTimeout(150);
    const nfav = await page.evaluate(() => document.querySelectorAll('#main .hit').length);
    check('la pestaña Favoritos enseña lo marcado con ♡', nfav >= 1, String(nfav));
    await page.evaluate(() => { const P = window.PG; P.ui.foodTab = ''; P.food().despensa = []; P.food().favV = []; P.save(); P.render(); });

    const compra = await page.evaluate(() => {
      const d = window.PG.compraDatos();
      const fresco = d.grupos.filter((g) => g[0] === 'fresco')[0][2].map((x) => x.texto);
      const casa = d.grupos.filter((g) => g[0] === 'casa')[0][2].map((x) => x.texto);
      const dup = fresco.map((t) => t.replace(/^[\d.,]+\s*k?g\s+/, '')).filter((t, i, a) => a.indexOf(t) !== i);
      return { fresco: fresco.length, casa, dup, kcalDia: d.kcalDia,
        platano: fresco.filter((t) => /Plátano/.test(t)) };
    });
    check('la compra suma por alimento (sin repetidos), pliega sal/aceite y dice las kcal/día del menú',
      compra.dup.length === 0 && compra.casa.some((t) => /Sal|Aceite/.test(t)) && compra.kcalDia > 0,
      JSON.stringify(compra));
    await page.evaluate(() => { const P = window.PG; P.store.dishes = P.store.dishes.filter((d) => d.id !== 'd-t200'); P.save(); });
  }

  // 201) COMER FUERA: cadenas y «a ojo» en el buscador, menú armable, repetir y corregir
  {
    const bq = await page.evaluate(() => {
      const P = window.PG;
      const c = (t) => P.foodBuscar(t, '').filter((x) => x.tipo === 'fuera').map((x) => x.nombre + '|' + x.cad);
      return { bigmac: c('big mac'), whopper: c('whopper'), kfc: c('kfc').slice(0, 2), cana: c('caña'),
        tortilla: P.foodBuscar('tortilla de patatas', '').length, coca: P.foodBuscar('coca cola', '').length };
    });
    check('el buscador encuentra comida de cadenas y de bar, y las palabras en cualquier forma',
      bq.bigmac.some((x) => /^Big Mac\|McDonald/.test(x)) && bq.whopper.length >= 2 &&
      /^Menú/.test(bq.kfc[0] || '') && bq.cana.length >= 1 && bq.tortilla >= 1 && bq.coca >= 1, JSON.stringify(bq));

    await gotoFood('add', 'buscar');
    await page.click('[data-a="food-vista"][data-v="fuera"]');
    await page.waitForTimeout(200);
    const portada = await page.evaluate(() => ({
      cadenas: document.querySelectorAll('#main .cadg button').length,
      ojo: document.querySelectorAll('#main .fojo').length }));
    check('«Comer fuera» enseña las cadenas y los apartados a ojo', portada.cadenas >= 15 && portada.ojo === 5, JSON.stringify(portada));

    await page.click('[data-a="fuera-cad"][data-c="mcd"]');
    await page.waitForTimeout(200);
    const abrir = await page.$('#main .hit [data-a="food-abrir"]');
    if (abrir) await abrir.click();
    await page.waitForTimeout(200);
    const kc = async () => page.evaluate(() => { const b = document.querySelector('.platomac b'); return b ? +b.textContent : null; });
    const k0 = await kc();
    const zero = await page.$('[data-a="fuera-slot"][data-o="beb-zero"]');
    if (zero) await zero.click();
    await page.waitForTimeout(150);
    const k1 = await kc();
    check('armar un menú: cambiar la bebida a Zero baja las kcal del total', k0 > 800 && k1 < k0 && k0 - k1 > 150, JSON.stringify({ k0, k1 }));

    const antes = await page.evaluate(() => Object.values(window.PG.food().log).reduce((a, l) => a + l.length, 0));
    const ap = await page.$('[data-a="fuera-menu-apuntar"]');
    if (ap) await ap.click();
    await page.waitForTimeout(250);
    const tras = await page.evaluate(() => {
      const todas = [].concat(...Object.values(window.PG.food().log));
      const t = todas.filter((x) => x.fuera).sort((a, b) => b.ts - a.ts)[0];
      return { n: todas.length, t: t ? { nombre: t.nombre, kcal: t.kcal, k1: !!t.k1 } : null };
    });
    check('el menú armado se apunta con su nombre, sus kcal y sus macros por unidad',
      tras.n === antes + 1 && tras.t && /Menú Big Mac/.test(tras.t.nombre) && /Zero/.test(tras.t.nombre) && tras.t.kcal === k1 && tras.t.k1,
      JSON.stringify(tras));

    await page.evaluate(() => { const P = window.PG; P.ui.foodVista = 'fuera'; P.render(); });
    await page.waitForTimeout(150);
    const rep = await page.$('[data-a="fuera-repetir"]');
    if (rep) await rep.click();
    await page.waitForTimeout(200);
    const repetido = await page.evaluate(() => [].concat(...Object.values(window.PG.food().log)).filter((x) => /Menú Big Mac/.test(x.nombre)).length);
    check('«lo último que pediste fuera» se repite a un toque', repetido >= 2, String(repetido));

    const fix = await page.evaluate(() => {
      const P = window.PG;
      P.food().fueraMio['ojo-tapas:bravas'] = { kcal: 600, pr: 6, ch: 50, gr: 35 };
      const x = P.foodBuscar('patatas bravas', '').filter((y) => y.v === 'fuera:ojo-tapas:bravas')[0];
      const r = P.fueraApuntar(P.iso ? P.iso(new Date()) : '', 'fuera:ojo-tapas:bravas', 1.4, 'cena');
      delete P.food().fueraMio['ojo-tapas:bravas'];
      return { kcal: x && x.kcal, r };
    });
    check('un dato de cadena corregido se queda como tu versión y se usa al apuntar',
      fix.kcal === 600 && /840 kcal/.test(fix.r || ''), JSON.stringify(fix));
    await page.evaluate(() => { const P = window.PG;
      Object.keys(P.food().log).forEach((k) => { P.food().log[k] = P.food().log[k].filter((x) => !x.fuera); });
      P.food().fueraGuard = []; P.ui.foodVista = ''; P.save(); P.render(); });
  }


  // ===================================================================================
  // El pasillo de un producto se corrige DELANTE DEL LINEAL. Las reglas que reparten la
  // compra son treinta expresiones regulares en el código y se equivocan: el plátano
  // acabó en conservas porque «lata» casa dentro de «pLATAno». Hasta ahora arreglarlo
  // era tocar código.
  // ===================================================================================
  {
    await gotoTab('shop');
    await page.waitForTimeout(350);
    // se abren los pasillos que se hayan plegado solos, que si no no hay líneas que tocar
    await page.evaluate(() => {
      document.querySelectorAll('#main .pasillo').forEach((b) => {
        if (b.getAttribute('aria-expanded') === 'false') b.click(); });
    });
    await page.waitForTimeout(350);
    const conLinea = await page.evaluate(() => {
      const l = document.querySelector('#main .lcompra .linea');
      return l ? { texto: (l.querySelector('.tx b') || {}).textContent || '',
        tieneBoton: !!l.querySelector('.secmv') } : null; });
    // se conduce la INTERFAZ, no la API: el botón vive en el switch de clicks y es justo
    // donde se esconden los fallos mudos de este repositorio
    if (conLinea && conLinea.tieneBoton) {
      await page.evaluate(() => document.querySelector('#main .lcompra .linea .secmv').click());
      await page.waitForTimeout(300);
      const pick = await page.evaluate(() => ({
        abierto: !!document.querySelector('#main .secpick'),
        opciones: document.querySelectorAll('#main .secpick .btn').length,
        // el pasillo en el que está ahora sale marcado
        marcada: !!document.querySelector('#main .secpick .btn.p') }));
      await page.click('#main .secpick [data-v="bebida"]');
      await page.waitForTimeout(350);
      const tras = await page.evaluate((txt) => { const P = window.PG;
        return { seccion: P.seccionDeCompra(txt),
          cerrado: !document.querySelector('#main .secpick'),
          // y sobrevive a recargar: normalize() tira todo lo que no reconoce
          trasRecargar: (function () { P.store = JSON.parse(JSON.stringify(P.store));
            return P.seccionDeCompra(txt); })() }; }, conLinea.texto);
      check('el pasillo de un producto se cambia desde la lista y aguanta recargar',
        conLinea.tieneBoton && pick.abierto && pick.opciones >= 8 && pick.marcada &&
        tras.seccion === 'bebida' && tras.cerrado && tras.trasRecargar === 'bebida',
        JSON.stringify({ conLinea, pick, tras }));

      // ENCADENADO: quitar la corrección devuelve el producto a lo que digan las reglas, y
      // marcar la línea sigue funcionando (el botón no puede robarle el clic a la línea)
      await page.evaluate(() => { const P = window.PG; P.ui.tab = 'shop'; P.render(); });
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        document.querySelectorAll('#main .pasillo').forEach((b) => {
          if (b.getAttribute('aria-expanded') === 'false') b.click(); });
      });
      await page.waitForTimeout(300);
      const vuelta = await page.evaluate((txt) => { const P = window.PG;
        const reglas = (function () { const g = P.food().pasillos[P.despClave(txt)];
          delete P.food().pasillos[P.despClave(txt)];
          const r = P.seccionDeCompra(txt);
          P.food().pasillos[P.despClave(txt)] = g; return r; })();
        const marcasAntes = P.ui.marks.size;
        const li = [...document.querySelectorAll('#main .lcompra .linea')]
          .find((l) => ((l.querySelector('.tx b') || {}).textContent || '') === txt);
        if (li) li.click();
        return { reglas, marcasAntes, marcasTras: P.ui.marks.size, hallada: !!li }; }, conLinea.texto);
      check('quitar la corrección devuelve el pasillo a las reglas, y marcar la línea sigue yendo',
        vuelta.hallada && vuelta.reglas !== 'bebida' && vuelta.marcasTras !== vuelta.marcasAntes,
        JSON.stringify(vuelta));

      await page.evaluate((txt) => { const P = window.PG;
        delete P.food().pasillos[P.despClave(txt)];
        P.ui.marks = new Set(); P.ui.compraPasillo = ''; P.save(); P.render(); }, conLinea.texto);
      await page.waitForTimeout(200);
    } else {
      check('el pasillo de un producto se cambia desde la lista y aguanta recargar',
        false, 'no había ninguna línea de compra a la vista');
    }
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
