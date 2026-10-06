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
  const DRAWER_TABS = new Set(['notas', 'habitos', 'dinero', 'consumo', 'eventos', 'estudio', 'cfg', 'data', 'ajustes']);
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
      /* la Semana abre ahora en «Agenda» (eventos, rutina y hábitos); estas pruebas miran la vista
         por horas, que sigue a un toque */
      if (tab === 'week') await page.evaluate(() => { const P = window.PG; if (P.ui.semVista !== 'horas') { P.ui.semVista = 'horas'; P.render(); } });
    } else if (COMER_TABS.has(tab)) {
      // se entra por «Comer» y de ahí a su modo; los que no tienen modo propio (import) se piden
      // por la vista que los contiene
      await page.click('[data-a="nav-comer"]');
      await page.waitForTimeout(100);
      /* «Comer» abre la semana (una sola pantalla, sin fila de modos); el día con las calorías es
         «Registro» y las demás pestañas se piden directamente */
      if (tab === 'food') await page.evaluate(() => { const P = window.PG; P.ui.foodVista = ''; P.render(); });
      if (tab === 'types') await page.evaluate(() => { const P = window.PG; P.ui.tab = 'types'; P.ui.typesVista = ''; P.render(); });
      else if (tab === 'shop') {
        await page.evaluate(() => { const P = window.PG; P.ui.tab = 'shop'; P.ui.shopVista = ''; P.render(); });
        /* v2 abre solo el primer pasillo: estas pruebas miran líneas de todos, así que «ver todo» */
        await page.waitForTimeout(100);
        if (!(await page.evaluate(() => !!window.PG.ui.compraTodo))) { const vt = await page.$('[data-a="compra-todo"]'); if (vt) await vt.click(); }
      }
      else if (tab === 'batches') {
        await page.evaluate(() => { const P = window.PG; P.ui.tab = 'food'; P.ui.foodVista = 'cocina-panel'; P.render(); });
        await page.waitForTimeout(100);
        await page.click('[data-a="cocina-tab"][data-t="lote"]');
      } else if (tab === 'import') {
        await page.evaluate(() => { window.PG.ui.tab = 'import'; window.PG.render(); });
      }
    } else if (DRAWER_TABS.has(tab)) {
      await page.click('[data-a="drawer-toggle"]');
      await page.waitForTimeout(260);
      /* Turno y rotación y Datos están dentro de Ajustes: el cajón tiene UNA entrada para los tres */
      const porAjustes = tab === 'cfg' || tab === 'data';
      await page.click(`[data-a="drawer-nav"][data-t="${porAjustes ? 'ajustes' : tab}"]`);
      if (tab === 'cfg') { await page.waitForTimeout(150); await page.click('#main [data-a="ir-tab"][data-t="cfg"]'); }
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
    // Semana (typesVista '') es la cocina simple; los tipos de día y sus secciones viven en
    // «Más formas de montar» (typesVista 'montar')
    await page.evaluate(() => { const P = window.PG; P.ui.typesVista = 'montar'; P.render(); });
    await page.waitForTimeout(120);
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
      // la nevera es UNA (pestaña Nevera); «qué cocino» e «ideas» siguen en el panel de cocina
      await page.evaluate((v) => { const P = window.PG; if (v === 'nevera') { P.ui.foodVista = 'nevera2'; } else { P.ui.foodVista = 'cocina-panel'; P.ui.cocinaTab = ''; } P.render(); }, vista);
      await page.waitForTimeout(150);
      return;
    }
    if (vista) {
      // si la puerta ya no está en la portada (cocina simple), se entra directo a la vista
      const puerta = await page.$(`[data-a="food-vista"][data-v="${vista}"]`);
      if (puerta && await puerta.isVisible()) await puerta.click();
      else await page.evaluate((v) => { const P = window.PG; P.ui.foodVista = v; P.render(); }, vista);
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
      montada.wake === '07:15' && montada.montada === true && montada.tab === 'month',
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

  // 0) al abrir la app se ve el MES: lo pidió así (antes arrancaba en «Hoy», que queda a un toque).
  // Se mira que se pinte la rejilla del mes de verdad, no solo que la variable diga «month».
  const defaultTab = await page.evaluate(() => window.PG.ui.tab);
  const arranque = await page.evaluate(() => ({
    mes: document.querySelectorAll('#main .cal .dbox').length,
    hoyAUnToque: !!document.querySelector('#calModes button[data-t="hoy"]'),
    mesMarcado: !!document.querySelector('#calModes button[data-t="month"].on'),
  }));
  check('la app arranca en el mes, con la rejilla pintada y «Hoy» a un toque',
    defaultTab === 'month' && arranque.mes >= 28 && arranque.hoyAUnToque && arranque.mesMarcado,
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
    navShape.modos.join('|') === 'Hoy|Semana|Nevera|Compra' &&
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
    'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:' + (() => { const d = new Date(); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0'); })() + '15\r\nSUMMARY:Guardia Urgencias\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n');
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
  await page.fill('#rtQ', 'Curl bíceps');
  await page.waitForTimeout(400);
  await page.click('[data-a="rt-add2"][data-n="Curl bíceps"]');
  await page.waitForTimeout(200);
  await gotoGym('rutinas');
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
  await page.fill('#rtQ', 'Press militar');
  await page.waitForTimeout(400);
  await page.click('[data-a="rt-add2"][data-n="Press militar"]');
  await page.waitForTimeout(150);
  const focoTrasAnadir = await page.evaluate(() => document.activeElement && document.activeElement.id === 'rtQ');
  await page.keyboard.type('Sentadilla');
  await page.waitForTimeout(400);
  await page.click('[data-a="rt-add2"][data-n="Sentadilla"]');
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

  // 24) EN MES, SOLO LO DE ESTE MES. Había un desplegable con los nombres de los tipos de guardia,
  // sus cupos y el post-guardia automático: eso no cambia de un mes a otro y ya estaba en Turno y
  // rotación → Rotación. De este mes son dos cosas, y van a la vista sin desplegar nada.
  const configMes = await page.evaluate(() => {
    const c = document.querySelector('#main [data-cfg="mescfg"]');
    return { hay: !!c,
      servicio: !!(c && c.querySelector('[data-a="mon-svc"]')),
      guardias: !!(c && c.querySelector('[data-a="mon-guard"]')),
      // lo global ya no se repite aquí
      tiposDeGuardia: !!document.querySelector('#main [data-a="gtipo-lbl"]'),
      postGuardia: !!document.querySelector('#main [data-a="mon-autopos"]'),
      atajo: !!document.querySelector('#main [data-a="ir-rotacion"]') };
  });
  check('en Mes solo se configura lo de ESTE mes: servicio y guardias, con atajo a lo demás',
    configMes.hay && configMes.servicio && configMes.guardias &&
    !configMes.tiposDeGuardia && !configMes.postGuardia && configMes.atajo,
    JSON.stringify(configMes));

  // 25) "Hoy" enseña el día como CARRIL de horas, con la línea de dónde estás ahora
  await gotoTab('hoy');
  await page.waitForTimeout(200);
  // la línea de «ahora» solo se pinta dentro del rango del carril: pasada la última cosa del día
  // (de noche) no hay línea, y la prueba fallaba según a qué hora se pasara. Se compara con lo que
  // TOCA a esta hora, calculado aparte.
  const hoyBarra = await page.evaluate(() => { const P = window.PG, k = P.fechaHoy(), d = new Date();
    const n = d.getHours() * 60 + d.getMinutes(), r = P.rangoCarril(P.bloquesDelDia(k), k);
    return { barra: !!document.querySelector('#main .carrilbox .carril'),
      ahora: !!document.querySelector('#main .carril .cnow'), toca: n >= r.de && n <= r.a }; });
  check('"Hoy" enseña el día como carril de horas, con la línea de ahora cuando cae dentro del día',
    hoyBarra.barra && hoyBarra.ahora === hoyBarra.toca, JSON.stringify(hoyBarra));

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

  // 28) calEventos() manda guardia/saliente/trabajo/entreno, cada uno con hora de inicio y fin
  // real. EL SALIENTE SÍ VA, y eso cambió a petición explícita suya: en Google un saliente y un
  // día libre se veían exactamente igual —en blanco— y no había forma de distinguirlos. Esa
  // mañana no estás en casa: sigues en el hospital hasta el relevo, y luego duermes. Los días
  // LIBRES y las VACACIONES siguen fuera, que eso no ha cambiado.
  const calScope = await page.evaluate(() => {
    const base = '2027-04';
    window.PG.setDayOverride(base + '-05', 'sh-g', 'urg'); // guardia
    window.PG.setDayOverride(base + '-06', 'sh-s', '');    // saliente: bloque hasta el relevo + siesta
    window.PG.setDayOverride(base + '-07', 'sh-t', '');    // trabajo
    window.PG.setDayOverride(base + '-08', 'sh-f', '');    // entreno de fuerza
    window.PG.setDayOverride(base + '-09', 'sh-l', '');    // día libre (debe quedar fuera)
    window.PG.addVacation(base + '-10', base + '-11', 'test-export'); // vacaciones (deben quedar fuera)
    const evs = window.PG.calEventos(base + '-05', base + '-11');
    const porFecha = {};
    evs.forEach((e) => { (porFecha[e.isoKey] = porFecha[e.isoKey] || []).push(e); });
    return porFecha;
  });
  check('a Google va guardia, saliente, trabajo y entreno — nunca un día libre ni vacaciones',
    !!calScope['2027-04-05'] && !!calScope['2027-04-06'] && !!calScope['2027-04-07'] &&
    !!calScope['2027-04-08'] && !calScope['2027-04-09'] && !calScope['2027-04-10'] && !calScope['2027-04-11'] &&
    // el día del saliente lleva DOS cosas: el bloque hasta el relevo y la siesta al llegar
    (calScope['2027-04-06'] || []).length === 2 &&
    /Saliente/.test((calScope['2027-04-06'][0] || {}).summ || '') &&
    calScope['2027-04-06'][0].hora === '00:00' &&
    /Siesta/.test((calScope['2027-04-06'][1] || {}).summ || ''),
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
    big: !!document.querySelector('#main .h2big'),
    macros: document.querySelectorAll('#main .h2mac .h2mb').length,
    etiquetas: [...document.querySelectorAll('#main .h2mac .h2mb > span')].map(x => x.textContent.trim()),
    noOldKpis: !document.querySelector('#main .kpis'),
  }));
  check('Comida resume el día con las kcal contra el objetivo y los tres macros, sin los cuatro KPI de antes',
    comidaHero.big && comidaHero.macros === 3 && comidaHero.noOldKpis &&
    comidaHero.etiquetas.join('|') === 'P|H|G', JSON.stringify(comidaHero));

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
      // el párrafo de 120 palabras explicando «cómo se calcula este mes» ya no está: el mes no se
      // calcula, lo marcas tú, y lo que decía se ve haciendo
      sinExplicacion: !summaries.some((s) => /cómo se calcula/i.test(s.textContent)),
      masNumerosPlegado: summaries.some((s) => /ver más números/i.test(s.textContent) && !s.parentElement.open),
    };
  });
  check('en "Mes" no hay explicación larga y los KPI secundarios quedan plegados por defecto',
    mesSimple.kpisVisibles <= 4 && mesSimple.sinExplicacion && mesSimple.masNumerosPlegado, JSON.stringify(mesSimple));

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
  // El evento en la casilla: punto de color y nombre, en UNA sola línea. La hora ya NO va aquí —en
  // 55 px se llevaba 18 y dejaba el nombre en «S. ge…»—: está en el title, en la agenda del mes y
  // al tocar el día. Lo que sí se comprueba es que siga estando en alguno de esos sitios.
  const mesConEvento = await page.evaluate(() => {
    const ev = [...document.querySelectorAll('#main .dbox .dev')].find((l) => /Entreno con Marta/.test(l.title));
    const cs = ev ? getComputedStyle(ev) : null;
    return { marcado: !!(ev && ev.querySelector('.dpt')),
      conNombre: ev ? /Entreno con/.test(ev.innerText) : false,
      unaLinea: ev ? ev.getBoundingClientRect().height <= parseFloat(cs.fontSize) * 1.7 : false,
      nombreSinPartir: ev ? getComputedStyle(ev.querySelector('.n')).whiteSpace === 'nowrap' : false,
      horaEnElTitle: ev ? /\b8\b/.test(ev.title) : false,
      horaEnLaAgenda: /Entreno con Marta[^\n]*/.test(document.getElementById('main').innerText) };
  });
  check('"Mes" enseña el evento en su casilla, con su color y su nombre, en UNA línea',
    mesConEvento.marcado && mesConEvento.conNombre && mesConEvento.unaLinea &&
    mesConEvento.nombreSinPartir, JSON.stringify(mesConEvento));

  // 47) Hábitos: pestaña nueva, se puede crear un hábito, marcar el día de hoy, ver la racha y el
  // mapa de calor de 6 semanas, y borrarlo (con confirmación)
  await gotoTab('habitos');
  await page.waitForTimeout(150);
  const habitosVacio = await page.evaluate(() => document.getElementById('main').innerText);
  check('Hábitos: la pestaña nueva existe y, sin hábitos, invita a crear el primero',
    /Hábitos/i.test(habitosVacio) && /crea el primero/i.test(habitosVacio), '');

  // crear: «Nuevo hábito» abre la hoja; «no en guardia» y «se marca solo» se eligen ahí
  await page.click('#main [data-a="hab-ed"][data-id=""]');
  await page.waitForTimeout(150);
  await page.fill('#habEdNom', 'Estirar de prueba');
  await page.click('#hojaDia [data-a="hab-ed-noen"][data-v="guardia"]');
  await page.waitForTimeout(100);
  const nombreSeQueda = await page.evaluate(() => document.getElementById('habEdNom').value);
  await page.click('#hojaDia [data-a="hab-ed-ok"]');
  await page.waitForTimeout(150);
  const habCreado = await page.evaluate(() => {
    const items = window.PG.habitosS().items;
    return { n: items.length, nombre: items[0] && items[0].nombre, dow: items[0] && items[0].dow, noEn: items[0] && items[0].noEn,
      hoja: !!document.querySelector('#hojaDia .hoja') };
  });
  check('Hábitos: se crea desde su hoja (todos los días si no marcas ninguno) con los días en que no toca, y lo escrito no se pierde al tocar un chip',
    habCreado.n === 1 && habCreado.nombre === 'Estirar de prueba' && habCreado.dow.length === 7 &&
    habCreado.noEn.join() === 'guardia' && !habCreado.hoja && nombreSeQueda === 'Estirar de prueba', JSON.stringify({ habCreado, nombreSeQueda }));

  const habId = await page.evaluate(() => window.PG.habitosS().items[0].id);
  const hoyKeyHab = isoDate(new Date());
  // hoy puede ser guardia (y entonces no toca): para marcarlo, que toque todos los días
  await page.evaluate((id) => { const h = window.PG.habitosS().items.filter((x) => x.id === id)[0]; h.noEn = []; window.PG.save(); window.PG.render(); }, habId);
  await page.waitForTimeout(100);
  await page.click(`#main .hbt[data-id="${habId}"]`);
  await page.waitForTimeout(150);
  const marcado = await page.evaluate(
    ({ hid, key }) => window.PG.habitoHecho(hid, key),
    { hid: habId, key: hoyKeyHab },
  );
  const dots = await page.evaluate(() => document.querySelectorAll('#main .hbr .hdots i').length);
  check('Hábitos: tocar el círculo marca el de hoy, y cada uno lleva sus últimos 7 días', marcado === true && dots === 7, JSON.stringify({ marcado, dots }));

  // editar y borrar: tocar el nombre abre su hoja, con «Borrar» (y confirmación)
  await page.click(`#main [data-a="hab-ed"][data-id="${habId}"]`);
  await page.waitForTimeout(150);
  await page.click(`#hojaDia [data-a="hab-del"][data-id="${habId}"]`);
  await page.waitForTimeout(150);
  await page.click('[data-a="confirm-yes"]');
  await page.waitForTimeout(150);
  const habTrasBorrar = await page.evaluate(() => ({ n: window.PG.habitosS().items.length, hoja: !!document.querySelector('#hojaDia .hoja') }));
  check('Hábitos: se puede borrar un hábito desde su hoja (con confirmación) y la hoja se cierra', habTrasBorrar.n === 0 && !habTrasBorrar.hoja, JSON.stringify(habTrasBorrar));

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
    const numeros = document.querySelector('#main .kpis');
    if (!cal || !numeros) return false;
    return !!(cal.compareDocumentPosition(numeros) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  check('"Mes": la cuadrícula del calendario aparece antes que los números', ordenOk, '');

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
  /* «Tus rotaciones» colé´gaba debajo del calendario del mes, donde no se cambia nada: vive con
     el resto de la rotación, que es donde se decide por dónde pasas el año. */
  await gotoTab('cfg', 'rotacion');
  await page.waitForTimeout(300);
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
    const d = document.querySelector('#main [data-cfg="mescfg"]');
    return !!d && !!d.querySelector('[data-a="mon-guard"]');
  });
  check('el KPI de guardias lleva a donde se cambia el cupo de este mes', abreCupo, '');

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

  // EL AÑO REPARTIDO YA NO ESTÁ EN MES. «Tus rotaciones» colé´gaba debajo del calendario, y desde
  // Rotación había un botón para ir a verlo allí: dos pantallas para una cosa. Ahora vive en
  // Rotación, que es donde se cambia, y en Mes queda el atajo de vuelta.
  await gotoTab('cfg', 'rotacion');
  await page.waitForTimeout(300);
  const aServicios = await page.evaluate(() => ({
    aqui: !!document.querySelector('#main .card[data-cfg="servicios"]'),
    conElAño: !!document.querySelector('#main [data-cfg="servicios"] .anyosvc, #main [data-cfg="servicios"] .svcanyo'),
    yaNoManda: !document.querySelector('#main [data-a="ir-servicios"]') }));
  check('el año repartido vive con las rotaciones, no debajo del calendario',
    aServicios.aqui && aServicios.yaNoManda, JSON.stringify(aServicios));

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
    // los periodos van RELATIVOS A HOY: con días fijos del mes (3–7 y 18–27), a final de mes ya no
    // salían en la cuadrícula —que corre con la semana— y la prueba fallaba según el día en que se lanzara
    const hoyD = new Date(y, m, new Date().getDate()), mas = (n) => new Date(hoyD.getTime() + n * 864e5);
    const r1 = [clave(mas(1)), clave(mas(5))], r2 = [clave(mas(8)), clave(mas(14))];
    await page.evaluate((r) => { window.PG.addVacation(r[0], r[1], 'Semana Santa'); }, r1);
    await page.evaluate((r) => { window.PG.addVacation(r[0], r[1], 'verano'); }, r2);
    await page.waitForTimeout(300);

    // se cuentan los días de vacaciones QUE SE VEN en la cuadrícula
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
    // «+ nota» crea una y la abre para escribirla. SIN NOTAS es una línea: el «Ninguna. Apunta lo
    // que no quieras que se te olvide» más dos botones costaba 190 px para decir que no hay nada.
    const panelNotas = await page.evaluate(() => { const p = document.querySelector('.daydetail');
      return {
        tarjetaVacia: !!(p && [...p.querySelectorAll('h2')].some((h) => /Notas de este día/.test(h.textContent))),
        botonAdd: !!document.querySelector('[data-a="nota-add-dia"]'),
        textareaViejo: !!document.querySelector('[id^="notaDia-"]'),
        loDice: /sin notas este día/.test(p ? p.innerText : '') }; });
    check('un día sin notas lo dice en una línea, con su botón, y no en una tarjeta entera',
      !panelNotas.tarjetaVacia && panelNotas.loDice && panelNotas.botonAdd && !panelNotas.textareaViejo,
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
      // la nota va en su casilla como una línea con su texto (antes era un 📝 suelto, .dnota)
      enLaCasilla: document.querySelectorAll('.dbox .dev.nota').length,
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
    await gotoTab('month');
    await page.click('[data-a="mon-today"]');
    await page.waitForTimeout(400);
    /* los dos días se cogen de la rejilla que se está pintando: desde que solo se enseña UNA semana
       pasada, un día fijo del mes (el 9) puede caer fuera y entonces no hay punto que contar.
       Tienen que ser además del mes que se está viendo, para que salgan en «Eventos de …». */
    await page.evaluate(() => {
      /* el mes que se ve es el de hoy (el día 1, la semana pasada de arriba es del mes anterior) */
      const mes = (window.PG.ui.monSel || '').slice(0, 7) || window.PG.iso(new Date()).slice(0, 7);
      const vis = [...document.querySelectorAll('.dbox')]
        .map((x) => x.dataset.key).filter((k) => k && k.slice(0, 7) === mes);
      const ev = window.PG.eventosS();
      ev.length = 0;
      ev.push({ id: 'ev-a', titulo: 'Sesión clínica', hora: '08:00', modo: 'fecha', fecha: vis[0], color: '#a855f7', dow: [] });
      ev.push({ id: 'ev-b', titulo: 'Congreso SEMES', hora: '09:00', modo: 'fecha', fecha: vis[vis.length - 1], color: '#38e1ff', dow: [] });
      window.PG.save(); window.PG.render();
    });
    await page.waitForTimeout(400);
    const rejilla = await page.evaluate(() => {
      const cal = document.querySelector('.cal');
      /* la semana pasada va encogida a propósito (52 px): se mide una de las que tienes por delante */
      const celda = [...document.querySelectorAll('.dbox')]
        .find((x) => !x.classList.contains('blank') && !x.classList.contains('semprev'));
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

    // Con diez eventos en un día la casilla no puede reventar: caben CUATRO, cada uno en UNA sola
    // línea (lo pidió así: «los eventos y nombres y todo que no ocupe nada más de una línea»), y el
    // resto va como «+N». El nombre entero sigue en la lista del mes y al tocar el día.
    // El día se coge de una casilla que la rejilla esté pintando de verdad: desde que solo se
    // enseña UNA semana pasada, un día fijo del mes puede caer fuera y `celda` salía undefined.
    const aprieto = await page.evaluate(() => {
      const visible = [...document.querySelectorAll('.dbox')]
        .filter((x) => !x.classList.contains('semprev') && x.dataset.key);
      const dia = (visible[Math.min(3, visible.length - 1)] || {}).dataset.key;
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
        // la nota ya no es un 📝 aparte: con la casilla llena de eventos cuenta en el «+N»
        nota: !celda.querySelector('.dev.nota'),
        desborda: celda.scrollHeight > celda.clientHeight,
        // los que caben llevan su nombre, y NINGUNO pasa de una línea
        titulos: [...celda.querySelectorAll('.dev')].filter((x) => /Un evento de/.test(x.innerText)).length,
        maxLineas: Math.max(...[...celda.querySelectorAll('.dev')].map((x) =>
          Math.round(x.getBoundingClientRect().height / parseFloat(getComputedStyle(x).lineHeight)))),
      };
    });
    check('con diez eventos en un día, la casilla enseña cuatro de UNA línea y «+7» (seis eventos y la nota), sin desbordarse',
      aprieto.puntos === 4 && aprieto.masN === '+7' && aprieto.nota && aprieto.titulos === 4 &&
      aprieto.maxLineas === 1 && !aprieto.desborda && aprieto.contenido < aprieto.altoCelda,
      JSON.stringify(aprieto));

    // y «VAC»/«UMI» ya no se parten letra a letra en una columna de 12 px
    const etiquetas = await page.evaluate(() => {
      const y = new Date().getFullYear(), m = new Date().getMonth();
      const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const g = window.PG.store.shifts.filter((x) => window.PG.isGuardia(x))[0];
      const vis = [...document.querySelectorAll('.dbox')].filter((x) => x.dataset.key);
      const k14 = (vis[Math.min(8, vis.length - 1)] || {}).dataset.key || iso(new Date(y, m, 14));
      window.PG.store.rotation.daySet[k14] = { shift: g.id, guard: 'umi' };
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

  // 45) la portada de Comida (v2): lo que llevas contra el objetivo con P/H/G, lo de hoy por momentos
  // en la primera pantalla, la línea de micros, buscar como acción principal, la semana en barras y
  // las tres despensas en una fila — ni formulario ni seis fichas
  await gotoFood('');
  const portadaComida = await page.evaluate(() => ({
    big: !!document.querySelector('#main .h2big'),
    macros: [...document.querySelectorAll('#main .h2mac .h2mb > span')].map((x) => x.textContent).join('|'),
    momentos: document.querySelectorAll('#main .h2mom').length,
    semana: document.querySelectorAll('#main .h2wk > button').length,
    buscaz: document.querySelectorAll('#main .buscaz').length,
    despensas: [...document.querySelectorAll('#main .h2chips [data-a="food-vista"]')].map((x) => x.dataset.v).filter((v) => /platos|nevera|alimentos/.test(v)).length,
    micros: document.querySelectorAll('#main .h2mic6 .v').length,
    sinCasillasMicro: !document.querySelector('#main .micros .mic'),
    sinFormulario: !document.getElementById('fbQ') && !document.getElementById('foodNewNombre'),
    botones: document.querySelectorAll('#main button').length,
    alto: Math.round(document.querySelector('#main').scrollHeight),
  }));
  check('la portada de Comida: P/H/G contra el objetivo, lo de hoy por momentos, micros en una línea, buscar, la semana y las tres despensas',
    portadaComida.big && portadaComida.macros === 'P|H|G' && portadaComida.momentos >= 3 &&
    portadaComida.semana === 7 && portadaComida.buscaz === 1 && portadaComida.despensas === 3 &&
    portadaComida.micros === 6 && portadaComida.sinCasillasMicro && portadaComida.sinFormulario &&
    /* cada toma de más del menú de ese día (media mañana, merienda) trae sus 3 botones */
    portadaComida.botones < 35 + 3 * Math.max(0, portadaComida.momentos - 3),
    JSON.stringify(portadaComida));

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
    /* v2: una lista por relevancia, con filtros por tipo que dicen cuántos hay de cada uno */
    grupos: Array.prototype.map.call(document.querySelectorAll('#main .fbchips [data-a="fb-filtro"]'), (x) => x.textContent).filter((t) => /[1-9]/.test(t)),
    filas: document.querySelectorAll('#main .hit').length,
    foco: document.activeElement.id,
  }));
  check('al escribir, los resultados salen con filtros por tipo (con cuántos hay) y el campo no pierde el foco',
    agrupado.grupos.length >= 2 && agrupado.filas > 0 && agrupado.foco === 'fbQ' && !!primerPlatoCm,
    JSON.stringify(agrupado));

  await page.click(`[data-a="food-abrir"][data-v="${primerPlatoCm}"]`);
  await page.waitForTimeout(250);
  const hojaUna = await page.evaluate(() => ({
    val: ((e) => e ? (e.tagName === 'INPUT' ? String(+e.value) : e.textContent) : undefined)(document.getElementById('fcVal')),
    kcal: (document.querySelector('#fcPrevia b') || {}).textContent,
    raciones: Array.prototype.map.call(document.querySelectorAll('#main .racb'), (x) => x.textContent),
  }));
  await page.click('[data-a="food-cant-set"][data-n="2"]');
  await page.waitForTimeout(200);
  const hojaDos = await page.evaluate(() => ({
    val: ((e) => e ? (e.tagName === 'INPUT' ? String(+e.value) : e.textContent) : undefined)(document.getElementById('fcVal')),
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

  // 47e) Menú v2: las tres formas de montar (rápido y sano, prototipos, por macros) llevan a su
  // pantalla, la semana es una cuadrícula de 21 casillas y «pasar a la compra» lleva a la compra
  {
    await gotoTab('types');
    // desde la cocina simple, Menú v2 es «Más formas de montar» (typesVista 'montar')
    await page.evaluate(() => { const P = window.PG; P.ui.typesVista = 'montar'; P.render(); });
    await page.waitForTimeout(200);
    const menu = await page.evaluate(() => ({
      formas: [...document.querySelectorAll('#main .mway')].map((e) => e.dataset.v),
      casillas: document.querySelectorAll('#main .mgrid > button').length,
      prot: document.querySelectorAll('#main .mprot > button').length,
    }));
    const adonde = [];
    for (const v of ['rapido', 'protos', 'macros']) {
      const b = await page.$(`#main .mway[data-v="${v}"]`);
      if (!b) { adonde.push('(no está)'); continue; }
      await b.click(); await page.waitForTimeout(200);
      adonde.push(await page.evaluate(() => window.PG.ui.typesVista + ':' + !!document.querySelector('#main .subcab .volver')));
      await page.click('#main .subcab .volver'); await page.waitForTimeout(200);
    }
    const aCompra = await page.$('#main [data-a="tab"][data-t="shop"]');
    if (aCompra) { await aCompra.click(); await page.waitForTimeout(250); }
    const tab = await page.evaluate(() => window.PG.ui.tab);
    check('Menú: tres formas de montar que llevan a su pantalla y vuelven, 21 casillas, proteína por día y «pasar a la compra»',
      menu.formas.join('|') === 'rapido|protos|macros' && menu.casillas === 21 && menu.prot === 7 &&
      adonde.join('|') === 'rapido:true|protos:true|macros:true' && tab === 'shop',
      JSON.stringify({ menu, adonde, tab }));
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
    /* con «Esta semana» la compra mira hasta la próxima salida: aquí, la semana entera, que el plato
       de prueba va en un día cualquiera */
    const cada0 = await page.evaluate(() => { const v = window.PG.store.food.compraCada; window.PG.store.food.compraCada = 7; window.PG.save(); return v; });
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
    await page.evaluate((v) => { const P = window.PG; if (v == null) delete P.store.food.compraCada; else P.store.food.compraCada = v; P.save(); }, cada0);
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
      // la comida armada ya no es una lista nativa: es el botón que abre el selector con buscador
      armadas: document.querySelectorAll('#main .toma2 [data-a="elegir-abrir"]').length,
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
    listos: document.querySelectorAll('#main .cofila [data-a="food-cocina"]').length,
    total: document.querySelectorAll('#main .cofila, #main .idea').length,
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
  check('"qué hago hoy" separa lo que sale entero de lo que casi (en Cocina, con sus pestañas: la nevera ya es la de Comer), y "a la compra" apunta lo que falta',
    platosQueSalen.pestanas === 2 &&
    platosQueSalen.total > 0 && platosQueSalen.listos > 0 && platosQueSalen.listos <= platosQueSalen.total &&
    (platosQueSalen.aLaCompra === 0 || compraDeltaCm > 0),
    JSON.stringify({ ...platosQueSalen, compraDeltaCm }));

  // 49) modo cocina: los ingredientes se escalan a las raciones elegidas y en cantidades que se
  // pueden comprar (nada de "933,33 g de patata"), y los pasos se recorren de uno en uno
  await gotoFood('cocinar');
  const platoCocinaCm = await page.evaluate(() => {
    const b = document.querySelector('#main .cofila [data-a="food-cocina"]');
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

  // 58) el día lleva los tres macros y seis micros clave (calcio, hierro, vit D, B12, fibra, potasio) (ya no nueve
  // casillas en la portada), y las tres puertas de la app de comida
  {
    await gotoFood('');
    const diaMic = await page.evaluate(() => ({
      macros: [...document.querySelectorAll('#main .h2mac .h2mb > span')].map((x) => x.textContent.trim()),
      puntos: document.querySelectorAll('#main .h2mic6 .v').length,
      casillas: document.querySelectorAll('#main .micros .mic').length,
      linea: (document.querySelector('#main .h2mic .mini') || {}).textContent || '',
      puertas: [...document.querySelectorAll('#main .h2chips [data-a="food-vista"]')].map((x) => x.dataset.v).filter((v) => /platos|nevera|alimentos/.test(v)),
    }));
    check('la portada del día lleva los tres macros, los micros en una línea y las tres despensas',
      diaMic.macros.join('|') === 'P|H|G' && diaMic.puntos === 6 &&
      diaMic.casillas === 0 && /corto|por debajo|mitad/.test(diaMic.linea) &&
      diaMic.puertas.join('|') === 'platos|nevera2|alimentos', JSON.stringify(diaMic));
  }

  // 59) la línea de micros abre su pantalla, y ahí tocar uno enseña con qué alimentos se cubre
  {
    await page.click('#main .h2mic');
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
    // la nevera es una sola pantalla (la pestaña); lo marcado a mano sigue alimentando las ideas
    const nev = await page.evaluate(() => window.PG.food().nevera.length);
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
      /* +44 px: el selector «Agenda / Por horas» va encima de la rejilla */
      sem.rejilla >= 0 && sem.rejilla < 220 && sem.colsRejilla === 7 &&
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
      const d = document.createElement('div'), fr = window.PG.store.franja, h0 = fr.horas;
      fr.horas = 24;   /* la forma del evento, no la ventana de horas (ver abajo) */
      d.innerHTML = window.PG.timelineBar(window.PG.iso(new Date()));
      fr.horas = h0;
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
    // con 24 h a la vista: con 12 la ventana se centra en la hora actual y el evento de las 08:30
    // se quedaba fuera según a qué hora se pasara la prueba. Aquí se mira la FORMA, no la ventana.
    const sinFin = await page.evaluate(() => {
      const d = document.createElement('div'), fr = window.PG.store.franja, h0 = fr.horas;
      fr.horas = 24;
      d.innerHTML = window.PG.timelineBar(window.PG.iso(new Date()));
      fr.horas = h0;
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
    // hoy, día de trabajo con la víspera libre: si la víspera es guardia (en el ejemplo, los lunes)
    // hoy es saliente y enseña la siesta en vez del despertador, y la prueba caía según el día
    const visperaSueno = await page.evaluate(() => { const P = window.PG, hoy = P.iso(new Date()), ay = P.iso(P.addDays(new Date(), -1));
      const antes = { hoy: P.dayOverride(hoy), ay: P.dayOverride(ay) };
      P.setDayOverride(ay, 'sh-l', ''); P.setDayOverride(hoy, 'sh-t', ''); P.save(); P.render(); return antes; });
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
    await page.evaluate((a) => { const P = window.PG, hoy = P.iso(new Date()), ay = P.iso(P.addDays(new Date(), -1));
      P.setDayOverride(ay, a.ay ? a.ay.shift : null, a.ay ? a.ay.guard : '');
      P.setDayOverride(hoy, a.hoy ? a.hoy.shift : null, a.hoy ? a.hoy.guard : ''); P.save(); P.render(); }, visperaSueno);

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
      const ayK = P.iso(P.addDays(new Date(), -1)), ovAy = P.dayOverride(ayK);
      P.setDayOverride(ayK, 'sh-l', '');   // víspera libre: si fue guardia, hoy es saliente y no «Día de trabajo»
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
      P.setDayOverride(ayK, ovAy ? ovAy.shift : null, ovAy ? ovAy.guard : '');
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
      const ayK = P.iso(P.addDays(new Date(), -1)), ovAy = P.dayOverride(ayK);
      P.setDayOverride(ayK, 'sh-l', '');   // víspera libre: si fue guardia, hoy es saliente y no «Día de trabajo»
      P.setDayOverride(hoyK, 'sh-t', '');
      P.store.rhythm['sh-t'].sleep = ''; P.store.rhythm['sh-t'].wake = '';
      P.save(); P.render();
      const f = [...document.querySelectorAll('.drow')].find((x) => x.querySelector('.pie.sue.falta'));
      const txt = f ? f.querySelector('.drsol').innerText : '';
      P.store.rhythm['sh-t'] = guardado;
      P.setDayOverride(hoyK, ovAntes ? ovAntes.shift : null, ovAntes ? ovAntes.guard : '');
      P.setDayOverride(ayK, ovAy ? ovAy.shift : null, ovAy ? ovAy.guard : '');
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
      /* el sol pasó a ser una tarjeta PLEGADA: su título vive en el <summary>, no en un <h2>, así
         que buscarlo solo por h2 lo dejaba en -1 */
      const tit = (c) => { const h = c.querySelector('h2') || c.querySelector(':scope>summary');
        return h ? h.textContent.replace(/\s+/g, ' ').trim() : ''; };
      const orden = cards.map(tit);
      const pos = (re) => orden.findIndex((t) => re.test(t));
      return {
        alto: document.querySelector('#main').scrollHeight,
        ancho: document.documentElement.scrollWidth,
        dia: pos(/Hoy ·/), entrenar: pos(/toca entrenar/), tareas: pos(/Para hoy/),
        sueno: cards.findIndex((c) => c.classList.contains('sncard')),
        pagar: pos(/toca pagar/), comidas: pos(/Comidas de hoy/), sol: pos(/El sol hoy/),
      };
    });
    // el orden se comprueba por posiciones RELATIVAS, no por el número de tarjeta: entre «lo que
    // hay que hacer» caben más cosas con el tiempo (la compra, por ejemplo) y eso no rompe nada
    check('«Hoy» junta las cinco patas del día y las ordena: el día, lo que hay que hacer y, al final, lo de consulta',
      // entre el día y «toca entrenar» va ahora «¿cómo has dormido?» (lo real de la noche, lo primero
      // que se apunta por la mañana): por eso entrenar ya no es la 1 y el alto sube lo que mide ella
      // (los lunes y martes, antes del sueño va la puerta del informe de la semana: por eso posiciones
      // relativas y no «el sueño es la 1»)
      /* lunes y martes: antes del sueño va la puerta del informe de la semana */
      dia.dia === 0 && dia.sueno > dia.dia && dia.sueno <= ([1, 2].includes(new Date().getDay()) ? 3 : 2) && dia.entrenar === dia.sueno + 1 && dia.tareas === dia.entrenar + 1 && dia.pagar > dia.tareas &&
      dia.comidas > dia.pagar && dia.sol > dia.comidas &&
      /* el reloj de 24 h (≈300 px) y «lo siguiente» entran arriba: el tope sube a 3.100 */
      dia.alto < 3100 && dia.ancho <= 412, JSON.stringify(dia));
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
    await gotoGym('');
    await page.waitForTimeout(200);
    // en Entreno, el «hoy toca» es la tarjeta grande de arriba, con ▶ Empezar y el peso que toca
    const enEntreno = await page.evaluate(() => {
      const c = document.querySelector('#main .ghero2');
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
      entrenando: window.PG.ui.gymPanel === 'vivo' && !!document.querySelector('#main .gvact'),
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
    // los recibos siguen en su pantalla (Dinero v7 ya no la enseña en la portada: lo del día a día
    // se cuadra con Fintonic), y los fijos se editan desde ahí
    await page.evaluate(() => { const P = window.PG; P.ui.dineroVista = 'recibos'; P.render(); });
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
    const pagado0 = await page.evaluate(() => window.PG.mesDinero(new Date().getFullYear(), new Date().getMonth()).pagado);
    await page.evaluate(() => {
      window.PG.addGasto({ nombre: 'Seguro del coche', importe: '58,90',
        dia: new Date().getDate(), cat: 'transporte' });
    });
    await gotoTab('hoy');
    await page.waitForTimeout(300);
    const enHoy = await page.evaluate(() => {
      const c = [...document.querySelectorAll('#main .card.avisa')].find((x) => /Seguro del coche/.test(x.textContent)) || document.querySelector('#main .card.avisa');
      return { hay: !!c, dice: c ? /Seguro del coche/.test(c.textContent) : false,
        importe: c ? /58,90/.test(c.textContent) : false };
    });
    // si el aviso no está, esta prueba tiene que FALLAR, no tumbar la suite con un timeout de 30 s
    const tick = await page.$('#main .card.avisa .tick[aria-label*="Seguro del coche"]');
    if (tick) { await tick.click(); await page.waitForTimeout(300); }
    const trasPagar = await page.evaluate(() => ({
      avisa: [...document.querySelectorAll('#main .card.avisa')].some((c) => /Seguro del coche/.test(c.textContent)),
      pagado: window.PG.mesDinero(new Date().getFullYear(), new Date().getMonth()).pagado,
    }));
    await gotoTab('month');
    await page.waitForTimeout(300);
    const enMes = await page.evaluate(() => document.querySelectorAll('#main .dbox .dgasto').length);
    check('un gasto que cae hoy avisa en «Hoy», se marca desde ahí y el día sale marcado en el Mes',
      enHoy.hay && enHoy.dice && enHoy.importe && !trasPagar.avisa &&
      Math.abs(trasPagar.pagado - pagado0 - 58.9) < 0.001 && enMes >= 2,
      JSON.stringify({ enHoy, trasPagar, pagado0, enMes }));
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
    // «a qué hora comes» vive ahora en un plegable de «Horas y sueño»: se abre antes de escribir
    await page.evaluate(() => { document.querySelectorAll('#main details.hradv').forEach((d) => { d.open = true; }); });
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
        // días relativos a HOY: con «el lunes y el martes de esta semana», un lunes el martes aún no
        // ha llegado y todo salía «entrenado hoy», sin ningún grupo descansado que enseñar
        { id: 'gp1', fecha: iso(P.addDays(new Date(), -8)), ex: 'Press banca', kg: 60, reps: 8, ts: Date.now() },
        { id: 'gp2', fecha: iso(P.addDays(new Date(), -1)), ex: 'Sentadilla', kg: 80, reps: 6, ts: Date.now() }];
      S.gym.sesiones = []; S.gym.cardio = []; S.gym.cambios = {};
      P.ui.gymDate = dia(4); P.ui.gymPanel = '';
      P.save();
      return { lunes: dia(0), jueves: dia(3), viernes: dia(4) };
    });
    await gotoTab('gym');
    await page.waitForTimeout(350);

    // 1 · la tira: siete días con su estado, y el viernes marcado como choque
    const tira = await page.evaluate(() => {
      const dd = [...document.querySelectorAll('#main .gsc')];
      return { n: dd.length,
        estados: dd.map((e) => e.className.replace('gsc', '').trim().split(' ')[0]),
        pie: (document.querySelector('#main .gtiraq') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim() };
    });
    check('«Entreno» abre con la semana delante y el día de choque marcado en rojo',
      tira.n === 7 && tira.estados.filter((x) => x === 'choque').length >= 1 && /saliente|guardia/i.test(tira.pie),
      JSON.stringify(tira));

    // 2 · tocar otro día cambia la línea que lo explica (la tira no es decoración)
    const antesPie = tira.pie;
    const botLun = await page.$('#main .gsc[data-key="' + mont.lunes + '"]');
    if (botLun) { await botLun.click(); await page.waitForTimeout(300); }
    const piel = await page.evaluate(() => (document.querySelector('#main .gtiraq') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim());
    check('tocar un día de la tira cuenta lo que hay ese día, no solo lo selecciona',
      !!botLun && piel !== antesPie && piel.length > 3, JSON.stringify({ antes: antesPie, ahora: piel }));

    // 3 · el descanso por grupo muscular: lo que justifica que hoy toque torso y no pierna (vive en «Progreso»)
    const desc = await page.evaluate(() => {
      const P = window.PG;
      P.ui.gymPanel = 'progreso'; P.render();
      const chips = [...document.querySelectorAll('#main .gm')].map((e) => ({
        txt: e.textContent.replace(/\s+/g, ' ').trim(), cl: e.className.replace('gm', '').trim() }));
      const out = { chips: chips, calc: (P.gymDescanso() || []).map((x) => x.reg + ':' + x.txt) };
      P.ui.gymPanel = ''; P.render();
      return out;
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
    const antesN = await page.evaluate(() => window.PG.gymS().rutinas.length);
    const nueva = await page.$('#main [data-a="rt-nueva-rapida"]');
    if (nueva) { await nueva.click(); await page.waitForTimeout(350); }
    const enRutinas = await page.evaluate((n0) => ({
      panel: window.PG.ui.gymPanel, creada: window.PG.gymS().rutinas.length === n0 + 1,
      campo: !!document.querySelector('#main input[data-a="rt-nombre"]'),
      foco: !!(document.activeElement && document.activeElement.dataset && document.activeElement.dataset.a === 'rt-nombre') }), antesN);
    check('desde la portada se monta una rutina nueva de un toque, con el nombre listo para escribir',
      !!nueva && enRutinas.panel === 'rutedit' && enRutinas.creada && enRutinas.campo && enRutinas.foco, JSON.stringify(enRutinas));

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

    // 1 · empezar te deja entrenando y no mete series que no has hecho
    const emp = await page.$('#main [data-a="ses-empezar"][data-id="rtV"]');
    if (emp) { await emp.click(); await page.waitForTimeout(400); }
    const arranque = await page.evaluate(() => ({
      panel: window.PG.ui.gymPanel,
      registro: window.PG.store.gym.registro.length,
      hayPantalla: !!document.querySelector('#main .gvact') }));
    check('empezar una rutina te deja entrenando y no mete en tu historial series que no has hecho',
      !!emp && arranque.panel === 'vivo' && arranque.hayPantalla && arranque.registro === mont.antes,
      JSON.stringify({ emp: !!emp, arranque, antes: mont.antes }));

    // 2 · el peso propuesto Y SU PORQUÉ, ya puesto en la fila que toca
    const porque = await page.evaluate(() => {
      const P = window.PG, hoy = P.iso(new Date()), v = document.querySelector('#main .gsug');
      return { enPantalla: v ? v.textContent.replace(/\s+/g, ' ').trim() : '', clase: v ? v.className : '',
        kg: (document.querySelector('#main tr.act input[data-k="kg"]') || { value: '' }).value,
        banca: P.progresionDe('Press banca', 3, 8, hoy), sent: P.progresionDe('Sentadilla', 3, 8, hoy) };
    });
    check('la pantalla de entrenar dice qué peso toca y por qué: sube donde la cerraste, baja donde te atascaste',
      porque.banca.cl === 'sube' && porque.banca.kg === 62.5 && porque.sent.cl === 'baja' && porque.sent.kg === 90 &&
      porque.clase.indexOf('sube') >= 0 && porque.kg === '62,5' && /Sube a 62,5/.test(porque.enPantalla),
      JSON.stringify(porque));

    // 3 · −/+ mueven el peso sin teclado (y arrastran a las series de detrás); lo que te quedaba, en palabras
    const masKg = await page.$('#main [data-a="gv-paso"][data-k="kg"][data-d="2.5"]');
    if (masKg) { await masKg.click(); await page.waitForTimeout(200); }
    const fallo = await page.$('#main [data-a="gv-rir"][data-d="0"]');
    if (fallo) { await fallo.click(); await page.waitForTimeout(200); }
    const mandos = await page.evaluate(() => ({
      kg: (document.querySelector('#main tr.act input[data-k="kg"]') || { value: '' }).value,
      resto: [...document.querySelectorAll('#main .gtb.vivo tr')].slice(2).map((r) => (r.children[2] || { textContent: '' }).textContent.trim()),
      palabras: [...document.querySelectorAll('#main .grir button')].map((e) => e.textContent.replace(/\d|–|\+/g, '').trim()),
      marcado: (document.querySelector('#main .grir button.on') || { textContent: '' }).textContent.trim() }));
    check('el peso se mueve con −/+ sin teclado y lo que te quedaba se dice en palabras',
      !!masKg && !!fallo && mandos.kg === '65' && mandos.resto.every((x) => x === '65') &&
      mandos.palabras.join('/') === 'fallo/justo/sobrado' && /fallo/.test(mandos.marcado),
      JSON.stringify(mandos));

    // 4 · ✓ en cada fila: una serie cada vez, con lo que te quedaba, y al acabar pasa al siguiente ejercicio
    for (let i = 0; i < 3; i++) {
      const b = await page.$('#main tr.act [data-a="gv-ok"]');
      if (b) { await b.click(); await page.waitForTimeout(260); }
    }
    const tras = await page.evaluate(() => {
      const P = window.PG;
      const ses = P.store.gym.registro.filter((x) => x.sesionId === (P.ui.gymSesionActiva || {}).id);
      return { nuevas: ses.length, rir: ses.length ? ses[0].rir : null, kg: ses.length ? ses[0].kg : null,
        ejercicioAhora: (document.querySelector('#main .gvact .h b') || { textContent: '' }).textContent.trim(),
        cuenta: (document.querySelector('#main .gvcab2 .t span') || { textContent: '' }).textContent,
        descanso: !!document.querySelector('#main #gvReloj') };
    });
    check('cada ✓ apunta una serie, guarda lo que te quedaba y al acabar el ejercicio pasa al siguiente',
      tras.nuevas === 3 && tras.rir === 0 && tras.kg === 65 && tras.ejercicioAhora === 'Sentadilla' &&
      /3\/6 series/.test(tras.cuenta) && tras.descanso, JSON.stringify(tras));

    // 5 · terminar pregunta qué tal de dura (la carga) y luego sale el resumen con récords y la próxima vez
    const fin = await page.$('#main [data-a="gv-terminar"]');
    if (fin) { await fin.click(); await page.waitForTimeout(300); }
    const siete = await page.$('#main [data-a="gv-rpe-fin"][data-d="7"]');
    if (siete) { await siete.click(); await page.waitForTimeout(450); }
    const informe = await page.evaluate(() => {
      const P = window.PG;
      const ses = P.store.gym.sesiones[P.store.gym.sesiones.length - 1] || null;
      return { hay: !!document.querySelector('#main .gvfin'),
        tit: (document.querySelector('#main .gvfint') || { textContent: '' }).textContent.replace(/\s+/g, ' ').trim(),
        kpis: [...document.querySelectorAll('#main .gvfin .kpis div')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
        recs: [...document.querySelectorAll('#main .gvrecs .gvchip')].map((e) => e.textContent.trim()),
        proxima: /La próxima vez/.test(document.getElementById('main').innerText),
        plan: ses ? ses.plan : null, completo: ses ? ses.completo : null, rpe: ses ? ses.rpe : null, carga: ses ? ses.carga : null,
        abierta: !!P.ui.gymSesionActiva };
    });
    check('al terminar pregunta el esfuerzo y sale el resumen con el volumen, las series planeadas, los récords y la próxima vez',
      !!fin && !!siete && informe.hay && !informe.abierta && informe.plan === 6 && informe.completo === false &&
      informe.rpe === 7 && informe.carga > 0 && /a medias/.test(informe.tit) && /3 de 6/.test(informe.tit) &&
      informe.kpis.some((k) => /kg movidos/.test(k)) && informe.recs.length >= 1 && informe.proxima &&
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
    // «disminuir el tamaño de la semana pasada pero que se siga viendo, y solo 1 semana anterior»:
    // en el mes actual, UNA semana antes de la de hoy (encogida por CSS), la de hoy y cuatro más.
    // Con las dos que había, lo que ya no puedes cambiar se comía 237 px de los 845 de la rejilla.
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
      const menos7 = new Date(lun); menos7.setDate(lun.getDate() - 7);
      const prev = celdas.filter((c) => c.classList.contains('semprev'));
      const otra = celdas.find((c) => !c.classList.contains('semprev'));
      return { n: celdas.length, primero: celdas[0] ? celdas[0].dataset.key : '', esperado: iso(menos7),
        previas: prev.length,
        hoyEnFila2: celdas.findIndex((c) => c.classList.contains('today')) >= 7 && celdas.findIndex((c) => c.classList.contains('today')) < 14,
        // y la semana pasada se sigue VIENDO, solo que encogida a menos de la mitad
        altoPrev: prev[0] ? Math.round(prev[0].getBoundingClientRect().height) : 0,
        altoNormal: otra ? Math.round(otra.getBoundingClientRect().height) : 0,
        huecos: [...document.querySelectorAll('#main .cal > span:not(.wd)')].length };
    });
    check('en el mes actual Mes enseña UNA semana antes —encogida, pero visible—, la de hoy y 4 más',
      mb && rej.n === 42 && rej.primero === rej.esperado && rej.previas === 7 && rej.hoyEnFila2 &&
      rej.altoPrev > 30 && rej.altoPrev < rej.altoNormal * 0.55 && rej.huecos === 0,
      JSON.stringify(rej));
    // al imprimir, el papel empieza en la semana en la que estás
    await page.emulateMedia({ media: 'print' });
    const papel = await page.evaluate(() => {
      const vis = [...document.querySelectorAll('#main .cal .dbox')].filter((c) => getComputedStyle(c).display !== 'none');
      return { visibles: vis.length, previasVisibles: vis.filter((c) => c.classList.contains('semprev')).length };
    });
    await page.emulateMedia({ media: null });
    check('al imprimir el Mes no sale la semana anterior a la tuya',
      papel.visibles === 35 && papel.previasVisibles === 0, JSON.stringify(papel));
    // otro mes (con ›): entero, con la semana de antes y la de después, apagadas
    /* las flechas de mes viven solo en la barra de arriba: dentro de la tarjeta eran la segunda
       pareja de ‹ › de la misma pantalla */
    const nx = await page.$('[data-a="wk-next"]');
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
      const cal = document.querySelector('#main .cal');
      const c = [...document.querySelectorAll('#main .cal .dbox')].find((x) => !x.classList.contains('semprev'));
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
    // el trabajo va con el nombre CORTO de la rotación («💼 UMI», «💼 Cardio»): cabe en la columna de Google
    check('a Google van la sesión de los martes que trabajas (no en vacaciones), el trabajo con su rotación y la rotación',
      g.enTrabajo.some((x) => /Sesión UMI/.test(x)) && g.enTrabajo.some((x) => /💼 UMI/.test(x)) &&
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
    /* «ver 5 7 10 14 días» dejó de ser cuatro botones y es un <select> que va en la misma fila que
       el rango: los cuatro botones ocupaban una fila entera delante de la semana. Al ser <select>,
       su acción vive en el switch de `change`, no en act(). */
    const pon = async (n) => { const el = await page.$('#main .semnav [data-a="sem-dias-sel"]');
      if (el) await page.selectOption('#main .semnav [data-a="sem-dias-sel"]', String(n));
      await page.waitForTimeout(250); return !!el; };
    const lee = () => page.evaluate(() => {
      const f = [...document.querySelectorAll('#main .drow')];
      return { n: f.length, hoyPrimero: !!(f[0] && f[0].classList.contains('today')),
        primero: f[0] ? f[0].querySelector('[data-a="day-open"]').dataset.key : '',
        ayer: !!document.querySelector('#main .dayer'), dias: window.PG.store.rotation.semanaDias };
    });
    const hoyK = isoDate(new Date());
    const mas = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return isoDate(d); };
    const pasos = [await lee()], hubo = [];
    hubo.push(await pon(14)); pasos.push(await lee());
    hubo.push(await toca('#main .semnav [data-a="wk-next"]')); pasos.push(await lee());
    hubo.push(await toca('#main .semnav [data-a="today"]')); pasos.push(await lee());
    hubo.push(await toca('#main [data-a="sem-ayer"]'));
    const ayerAbierto = await page.evaluate(() => document.querySelectorAll('#main .drow.ayer').length);
    hubo.push(await toca('#main [data-a="sem-ayer"]'));
    const persiste = await page.evaluate(() => { const P = window.PG; P.store = JSON.parse(JSON.stringify(P.store)); return P.store.rotation.semanaDias; });
    hubo.push(await pon(7)); pasos.push(await lee());
    check('«Semana» empieza hoy, con ayer plegado, y enseña 7, 10, 14 o 5 días que se guardan',
      hubo.every(Boolean) && pasos[0].n === 7 && pasos[0].hoyPrimero && pasos[0].primero === hoyK && pasos[0].ayer &&
      pasos[1].n === 14 && pasos[1].primero === hoyK && pasos[2].primero === mas(14) && !pasos[2].hoyPrimero &&
      pasos[3].primero === hoyK && ayerAbierto === 1 && persiste === 14 && pasos[4].n === 7,
      JSON.stringify({ hubo, pasos, ayerAbierto, persiste }));
    // la leyenda va UNA vez y plegada, y cada día lleva sus comidas con hora
    const una = await page.evaluate(() => ({
      leyendas: document.querySelectorAll('#main .tlleg').length,
      plegada: !!document.querySelector('#main .semnav details:not([open]) .tlleg'),
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
      // sin distinguir mayúsculas: entre semana sale de la jornada («Trabajo · rotación») y en fin
      // de semana del tipo de día («Día de trabajo»), y con /Trabajo/ la prueba fallaba en sábado
      const trab = bl.filter((b) => /trabajo/i.test(b.tit))[0];
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
    // «salir de casa» (07:30) quedaba DEBAJO del bloque de trabajo (08–15), que ocupa todo el ancho
    // y se pintaba después: el toque se lo llevaba el trabajo. Cada marca fina tiene que ser lo que
    // hay encima en su propio centro, y el bloque largo tocable por su franja izquierda.
    const tocables = await page.evaluate(() => [...document.querySelectorAll('#main .carril .cb')].map((el) => {
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect(), fino = el.classList.contains('fino') || el.classList.contains('encima');
      const x = fino ? r.left + r.width / 2 : r.left + 12, y = r.top + Math.min(10, r.height / 2);
      const top = document.elementFromPoint(x, y);
      return { t: el.innerText.split('\n')[0], ok: !!top && top.closest('.cb') === el };
    }));
    check('en el carril del día cada bloque se puede tocar: las marcas finas no quedan tapadas por la jornada',
      tocables.length >= 4 && tocables.every((x) => x.ok), JSON.stringify(tocables));
    await page.evaluate((k) => { const P = window.PG; P.store.eventos = P.store.eventos.filter((e) => e.id !== 'ev-ag'); P.setDayOverride(k, null); P.ui.diaHoy = ''; P.save(); P.render(); }, k);
    await page.waitForTimeout(250);
    // la tarjeta de «ahora / siguiente» solo tiene sentido en el día de HOY, no en el laborable que
    // se estaba mirando con las flechas: se comprueba al volver, y a cualquier hora —a las once de
    // la noche ya no queda nada por hoy y aun así tiene que decir qué es lo siguiente
    const cajaAhora = await page.evaluate(() => !!document.querySelector('#main .hoyreloj'));
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
    // el ejercicio se abre de un toque y «＋ serie» copia la anterior (las tarjetas van plegadas)
    const abre = await page.$('#main [data-a="rt-abrir"][data-ix="0"]');
    if (abre) { await abre.click(); await page.waitForTimeout(260); }
    const mas = await page.$('#main [data-a="rt-fila-mas"][data-id="q1"][data-ix="0"]');
    if (mas) { await mas.click(); await page.waitForTimeout(260); }
    await page.fill('#rtQ', 'prensa'); await page.waitForTimeout(400);
    const sug = await page.$('#main .gres [data-a="rt-add2"][data-n="Prensa de piernas"]');
    if (sug) { await sug.click(); await page.waitForTimeout(300); }
    const editor = await page.evaluate(() => {
      const P = window.PG, m = document.querySelector('#main');
      const rt = P.gymS().rutinas.filter((r) => r.id === 'q1')[0] || { ejercicios: [] };
      return { panel: P.ui.gymPanel, filas: m.querySelectorAll('.ged').length,
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
        curva: !!m.querySelector('.gline polyline'),
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
      cuenta.tengo >= 3 && cuenta.total === cuenta.todas - cuenta.tengo - cuenta.basicos,
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
      lee.pasillos.some((p) => /^pl[aá]tano=verdura$/.test(p)) &&
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
    // sin Claude no se enseña su tarjeta: la foto se lee en el móvil (tarjeta «Foto del ticket»)
    // y la foto se puede HACER (cámara) o ELEGIR de la galería/archivos: con «capture» Android solo abre la cámara
    const sinClaude = await page.evaluate(() => { const cam = document.getElementById('tkOcrIn'), gal = document.getElementById('tkOcrGal');
      return !/Una foto del ticket/.test(document.getElementById('main').innerText) && !!cam && cam.hasAttribute('capture') &&
        !!gal && !gal.hasAttribute('capture') && gal.dataset.a === 'tk-ocr' && /image/.test(gal.accept); });
    await page.fill('#tkTxt', TICKET);
    await page.click('[data-a="tk-leer"]');
    await page.waitForTimeout(400);
    const pintado = await page.evaluate(() => document.querySelectorAll('#main .dfila').length);
    // la bolsa de plástico no es comida: se quita antes de meterla en casa
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('#main .dfila')].filter((d) => /bolsa/.test((d.querySelector('.tknom') || {}).value || d.innerText))[0];
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
      P.ui.dineroVista = '';   // otra prueba dejó Dinero en «recibos»
      P.save();
      const n = P.nominaMes(y, m);
      return { finde: n.g.finde, total: n.g.total, est: n.est, mk };
    });
    await gotoTab('dinero');
    await page.waitForTimeout(250);
    const toca = async (sel) => { const el = await page.$(sel); if (el) await el.click(); await page.waitForTimeout(200); return !!el; };
    // apartar y deshacer: lo mismo que hace el botón «Apartado» del plan
    const rep = await page.evaluate((mk) => { const P = window.PG, a = P.ahorroS();
      a.meses[mk].aparto = 750; P.apartarMes(mk);
      const s1 = a.huchas.map((h) => h.saldo);
      P.deshacerApartado(mk);
      const s0 = a.huchas.map((h) => h.saldo);
      P.apartarMes(mk);
      P.store = JSON.parse(JSON.stringify(P.store));
      return { s1, s0, vuelta: P.ahorroS().huchas.map((h) => h.saldo) }; }, base.mk);
    check('Dinero estima la nómina con las guardias de finde y reparte lo que apartas en las huchas',
      base.finde === 2 && base.total === 3 && base.est === 3066 &&
      rep.s1.join() === '375,225,150' && rep.s0.join() === '0,0,0' && rep.vuelta.join() === '375,225,150',
      JSON.stringify({ base, rep }));
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
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'dinero'; P.ui.dineroVista = 'nomina'; P.render(); });
    await page.waitForTimeout(150);
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
    await page.evaluate(() => { const P = window.PG; delete P.store.ahorro; P.ui.fin = null; P.ui.dineroVista = ''; P.ui.dinTab = ''; P.save(); });
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
    /* la edad sale del día en que se pase la prueba (el 6 de octubre cumple) */
    const hoyT = new Date(), edadT = hoyT.getFullYear() - 1998 - ((hoyT.getMonth() < 9 || (hoyT.getMonth() === 9 && hoyT.getDate() < 6)) ? 1 : 0);
    const basalManual = Math.round(10 * 95 + 6.25 * 179 - 5 * edadT + 5);
    const gastoManual = Math.round(basalManual * 1.55);
    check('las kcal salen de Mifflin-St Jeor y cuadran con la cuenta hecha a mano',
      calc.edad === edadT && calc.perder.b === basalManual && calc.perder.g === gastoManual &&
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

    // «he comido fuera» (950 kcal estimadas) y DESPUÉS apuntar lo que fue de verdad: el día
    // contaba las dos cosas, 950 inventadas + el menú apuntado. La estimación tiene que dejar
    // de sumar en cuanto hay algo de «comer fuera» apuntado ese día.
    await page.evaluate(() => { const P = window.PG; P.ui.foodVista = ''; P.render(); });
    await page.waitForTimeout(250);
    await page.click('[data-a="dia-esp"][data-t="fuera"]');
    await page.waitForTimeout(300);
    const conFuera = await page.evaluate(() => window.PG.foodTotals(window.PG.diaComer()).kcal);
    await page.evaluate(() => { const P = window.PG; P.ui.foodVista = 'buscar'; P.render(); });
    await page.fill('#fbQ', 'big mac');
    await page.waitForTimeout(500);
    /* por selector y no por ElementHandle: la búsqueda repinta con retardo y el nodo cogido antes se suelta */
    const selBig = '#main .hit [data-a="food-rapido"][data-v="fuera:mcd:bigmac"]';
    const bigmac = !!(await page.$(selBig)); if (bigmac) await page.click(selBig);
    await page.waitForTimeout(300);
    await page.evaluate(() => { const P = window.PG; P.ui.foodVista = ''; P.ui.foodBusca = ''; P.render(); });
    await page.waitForTimeout(250);
    const trasApuntar = await page.evaluate(() => ({
      kcal: window.PG.foodTotals(window.PG.diaComer()).kcal,
      dice: /la estimación ya no suma/.test(document.getElementById('main').innerText) }));
    check('marcar «he comido fuera» y luego apuntar lo que comiste no cuenta las kcal dos veces',
      !!bigmac && conFuera - kcal0 === 950 && trasApuntar.kcal - kcal0 === 508 && trasApuntar.dice,
      JSON.stringify({ kcal0, conFuera, trasApuntar, bigmac: !!bigmac }));
    await page.evaluate(() => { const P = window.PG;
      Object.keys(P.food().log).forEach((k) => { P.food().log[k] = P.food().log[k].filter((x) => !x.fuera); });
      P.food().diasEsp = {}; P.save(); P.render(); });

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
    await page.evaluate(() => { const P = window.PG; P.ui.typesVista = 'montar'; P.render(); });  // Menú v2 está en «Más formas de montar»
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
      // y con la víspera libre: tras una guardia ese día es saliente y la comida la manda otra cosa
      const ay = P.iso(P.addDays(P.parseDate(k), -1));
      window.__ovAyViaje = P.dayOverride(ay);
      // sin el segundo entreno de la semana (en el ejemplo, piscina los martes a las 15:30): si cae
      // ese día, la comida la empuja la piscina y la prueba caía según el día en que se ejecutara
      const mk = P.gymS().marks; window.__mkViaje = mk[k]; mk[k] = { on: false };
      P.setDayOverride(ay, 'sh-l', '');
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

    // el viaje ya NO va al calendario de Google: sirve para cuadrar el día en la app (lo pidió así)
    const ics = await page.evaluate((k) => { const P = window.PG;
      const evs = P.calEventos(k, k);
      const v = evs.filter((e) => /Salir de casa/.test(e.summ));
      return { n: v.length, summ: v[0] ? v[0].summ : '', cat: v[0] ? v[0].cat : '',
        total: evs.length }; }, k);
    check('«salir de casa» se queda en la app y no se manda al calendario de Google',
      ics.n === 0 && ics.total >= 1,
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

    await page.evaluate((k) => { const P = window.PG; P.setDayOverride(k, null);
      const o = window.__ovAyViaje, mk = P.gymS().marks;
      if (window.__mkViaje) mk[k] = window.__mkViaje; else delete mk[k];
      P.setDayOverride(P.iso(P.addDays(P.parseDate(k), -1)), o ? o.shift : null, o ? o.guard : ''); P.save(); P.render(); }, k);
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
      const ay = P.iso(P.addDays(new Date(), -1)), ovAy = P.dayOverride(ay);
      P.setDayOverride(ay, 'sh-l', '');   // víspera libre: tras una guardia hoy sería saliente
      const mk = P.gymS().marks, mkAntes = mk[k]; mk[k] = { on: false };   // y sin la piscina de la semana
      sh.start = '06:30'; sh.end = '08:00';
      P.setDayOverride(k, sh.id, ''); P.save();
      const manana = { fin: P.finEntrenoDe(k), cp: P.comidaPrincipalDe(k) };
      // y por la tarde SÍ manda: entrenando de 17:00 a 18:15 la comida es la post-entreno
      sh.start = '17:00'; sh.end = '18:15'; P.save();
      const tarde = { fin: P.finEntrenoDe(k), cp: P.comidaPrincipalDe(k) };
      sh.start = antes.start; sh.end = antes.end; P.setDayOverride(k, null);
      P.setDayOverride(ay, ovAy ? ovAy.shift : null, ovAy ? ovAy.guard : '');
      if (mkAntes) mk[k] = mkAntes; else delete mk[k];
      P.save(); P.render();
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
      P.ui.tab = 'week'; P.ui.semVista = 'horas'; P.render(); const w = document.querySelector('#main .semrej .carrilbox');
      return { hoy, sem: w ? Math.round(w.getBoundingClientRect().height) : -1,
        guardado: P.store.franja.alto }; });
    // y el ajuste SOBREVIVE a recargar: normalize() tira los campos que no reconoce
    const traNormalize = await page.evaluate(() => { const P = window.PG;
      P.store = JSON.parse(JSON.stringify(P.store)); P.save(); return P.store.franja.alto; });
    await page.evaluate(() => { const P = window.PG; P.store.franja.alto = 'medio'; P.save();
      P.ui.tab = 'week'; P.ui.semVista = 'horas'; P.render(); });
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
      grupos: Array.from(document.querySelectorAll('#main .fbchips [data-a="fb-filtro"]')).map((g) => g.textContent),
      racion: !!document.querySelector('#main .kc.rac b'),
      off: !!document.querySelector('#main [data-a="off-buscar"]'),
    }));
    check('buscar «pollo» saca genéricos con su ración, Mercadona en su filtro y Open Food Facts a un toque',
      bus.filas >= 8 && bus.grupos.some((g) => /Mercadona\s*[1-9]/.test(g)) && bus.racion && bus.off, JSON.stringify(bus));

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


  // ===================================================================================
  // Las kcal de partida de «he comido fuera» y «día de moncheo» eran constantes del
  // código (950 y 600): podías corregir ESE día, pero al siguiente volvía a salir el
  // mismo número, así que con un menú del día de 1 200 lo corregías cada vez.
  // ===================================================================================
  {
    await page.evaluate(() => { const P = window.PG;
      P.ui.tab = 'food'; P.ui.foodVista = ''; P.ui.foodDate = ''; P.render(); });
    await page.waitForTimeout(350);
    const k = await page.evaluate(() => window.PG.diaComer());
    // se marca «he comido fuera» tocando el botón de verdad, no llamando a la API
    const btn = await page.$('#main [data-a="dia-esp"][data-t="fuera"]');
    if (btn) { await btn.click(); await page.waitForTimeout(350); }
    const puesto = await page.evaluate((k) => { const P = window.PG;
      const e = P.diaEspDe(k);
      return { tipo: e && e.tipo, kcal: e && e.kcal,
        campoDia: !!document.querySelector('#main [data-a="dia-esp-kcal"]'),
        campoNormal: !!document.querySelector('#main [data-a="dia-esp-normal"]'),
        valorNormal: (document.querySelector('#main [data-a="dia-esp-normal"]') || {}).value }; }, k);

    // se cambia «lo que suele ser para ti» por el campo, que vive en el listener de CHANGE:
    // page.fill() no lo dispara solo, hace falta el Tab
    const campo = await page.$('#main [data-a="dia-esp-normal"]');
    if (campo) { await campo.fill('1200'); await page.keyboard.press('Tab'); await page.waitForTimeout(400); }
    // ENCADENADO: se quita la marca y se vuelve a poner — ahora tiene que salir 1 200, no 950
    await page.evaluate((k) => { const P = window.PG; P.marcarDiaEsp(k, 'fuera'); P.render(); }, k);
    await page.waitForTimeout(200);
    const otra = await page.evaluate((k) => { const P = window.PG;
      P.marcarDiaEsp(k, 'fuera');
      const e = P.diaEspDe(k);
      // y aguanta recargar: normalize() tira todo lo que no reconoce
      P.store = JSON.parse(JSON.stringify(P.store));
      return { kcal: e && e.kcal, porDefecto: P.kcalTipoDia('fuera'),
        trasRecargar: P.kcalTipoDia('fuera'),
        // el menú del hospital no estima nada, y eso no cambia
        hospital: P.kcalTipoDia('hospital') }; }, k);
    check('las kcal de un día de «comí fuera» se ponen a tu medida y valen para los siguientes',
      puesto.tipo === 'fuera' && puesto.campoDia && puesto.campoNormal && puesto.valorNormal === '950' &&
      !!campo && otra.kcal === 1200 && otra.porDefecto === 1200 && otra.trasRecargar === 1200 &&
      otra.hospital === 0,
      JSON.stringify({ puesto, otra }));

    await page.evaluate((k) => { const P = window.PG;
      P.marcarDiaEsp(k, ''); delete P.food().kcalTipo.fuera; P.save(); P.render(); }, k);
    await page.waitForTimeout(200);
  }


  // ===================================================================================
  // El déficit (−18 %) y la proteína por kilo (2,0 g/kg en déficit) decidían las kcal y
  // la proteína del objetivo desde el código: podías sobrescribir la cifra final a mano,
  // pero no la regla, así que volvía a salir la misma al cambiar de peso.
  // ===================================================================================
  {
    const prep = await page.evaluate(() => { const P = window.PG;
      const guardado = JSON.parse(JSON.stringify(P.store.perfil));
      P.setPerfil('alturaCm', 179); P.setPerfil('pesoKg', 95);
      P.setPerfil('nacidoF', '1998-10-06'); P.setPerfil('meta', 'perder');
      P.setPerfil('actividad', 1.55); P.save();
      // la tarjeta de las kcal vive en «Comer → Tú», no en la portada de Comer
      P.ui.tab = 'food'; P.ui.foodVista = 'perfil'; P.render();
      return { guardado, gasto: P.gastoDiario(),
        ajuste: P.ajusteMeta(), prot: P.protPorKg(),
        kcal: P.kcalSugeridas(), gProt: P.proteinaSugerida() }; });
    await page.waitForTimeout(350);
    // los dos campos van A LA VISTA, no dentro de una puerta: cada cambio repinta la pantalla y
    // una puerta se cerraría justo mientras la estás usando (y la prueba se quedaba esperando a un
    // campo escondido hasta agotar los 30 s de Playwright)
    const puerta = await page.evaluate(() => ({
      hay: !!document.querySelector('#main [data-a="meta-ajuste"]') &&
           !!document.querySelector('#main [data-a="meta-prot"]'),
      visible: !!(document.querySelector('#main [data-a="meta-ajuste"]') || {}).offsetParent }));
    // se conducen los dos campos de verdad: viven en el listener de CHANGE, hace falta el Tab
    const cAj = await page.$('#main [data-a="meta-ajuste"]');
    if (cAj) { await cAj.fill('-25'); await page.keyboard.press('Tab'); await page.waitForTimeout(400); }
    const cPr = await page.$('#main [data-a="meta-prot"]');
    if (cPr) { await cPr.fill('2.4'); await page.keyboard.press('Tab'); await page.waitForTimeout(400); }
    const tras = await page.evaluate(() => { const P = window.PG;
      const r = { ajuste: P.ajusteMeta(), prot: P.protPorKg(),
        kcal: P.kcalSugeridas(), gProt: P.proteinaSugerida() };
      // la otra meta NO se toca: lo que cambias es de la meta que tienes puesta
      r.otraMeta = P.ajusteMeta('mantener');
      P.store = JSON.parse(JSON.stringify(P.store));   // el viaje por normalize()
      r.trasRecargar = P.ajusteMeta(); r.protTrasRecargar = P.protPorKg();
      return r; });
    check('el déficit y la proteína por kilo se cambian desde «Tú» y recalculan el objetivo',
      prep.ajuste === -0.18 && prep.prot === 2 && puerta.hay && puerta.visible && !!cAj && !!cPr &&
      Math.round(tras.ajuste * 100) === -25 && tras.prot === 2.4 &&
      // 95 kg × 2,4 = 228 → redondeado a múltiplo de 5 = 230
      tras.gProt === 230 && tras.kcal < prep.kcal &&
      tras.kcal === Math.round(prep.gasto * 0.75 / 10) * 10 &&
      tras.otraMeta === 0 &&
      Math.round(tras.trasRecargar * 100) === -25 && tras.protTrasRecargar === 2.4,
      JSON.stringify({ prep: { ajuste: prep.ajuste, prot: prep.prot, kcal: prep.kcal }, puerta, tras }));

    await page.evaluate((g) => { const P = window.PG;
      P.store.perfil = g; P.save(); P.render(); }, prep.guardado);
    await page.waitForTimeout(200);
  }

  // 202) SEMANA BASE, CUÁNDO COCINAR, SELECTOR DE COMIDAS Y COMPRA ⇄ MENÚ, encadenados por la interfaz:
  // entrar desde Menú → copiar lo que ya comes → cambiar una casilla con el buscador → que eso sea lo
  // que comes ESE día de la semana (y lo que pide la compra) → selector nuevo en el tipo de día → la
  // compra dice qué semana sale de lo que hay en casa. La lista nativa de 19 nombres sin kcal se va.
  {
    await page.evaluate(() => { const P = window.PG; P.store.semBase = { on: true, d: {} };
      P.ui.tab = 'types'; P.ui.typesVista = 'montar'; P.save(); P.render(); });
    await page.waitForTimeout(200);
    const puerta = await page.$('[data-a="types-vista"][data-v="semana"]');
    if (puerta) await puerta.click();
    await page.waitForTimeout(200);
    const cop = await page.$('[data-a="sb-copiar"]');
    if (cop) await cop.click();
    await page.waitForTimeout(250);
    const llenas = await page.evaluate(() => [...document.querySelectorAll('#main .sbc')].filter((c) => !c.classList.contains('vacio')).length);
    // el jueves en la cena: buscar «salmon» y quedarse con el primer plato que salga
    const jue = await page.$('.sbc[data-w="3"][data-c="cena"]');
    if (jue) await jue.click();
    await page.waitForTimeout(200);
    const fPl = await page.$('[data-a="elegir-f"][data-f="platos"]');
    if (fPl) await fPl.click();
    await page.waitForTimeout(150);
    await page.fill('#elQ', 'salmon');
    await page.waitForTimeout(450);
    const trasBuscar = await page.evaluate(() => ({
      foco: document.activeElement && document.activeElement.id,
      platos: [...document.querySelectorAll('[data-a="elegir-plato"]')].map((b) => b.dataset.id) }));
    // se vacía antes lo que hubiera, para que el jueves cene SOLO el plato elegido
    await page.evaluate(() => { const c = window.PG.sbCelda(3, 'cena'); if (c) { c.items = []; c.meal = ''; } });
    const pl = await page.$('[data-a="elegir-plato"]');
    if (pl) await pl.click();
    await page.waitForTimeout(250);
    const efecto = await page.evaluate(() => {
      const P = window.PG;
      // el próximo jueves de verdad
      const d = new Date(); d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7 || 7));
      const k = P.iso(d), inf = P.dayInfo(k);
      const sh = inf.shiftId, slots = (P.store.menu[sh] || []);
      const cena = slots.filter((s) => P.claseDeToma(s.label) === 'cena')[0];
      const hoy = cena ? P.slotItems(sh, cena, k).items.map((x) => x.id) : null;
      const sinFecha = cena ? P.slotItems(sh, cena).items.map((x) => x.id) : null;
      return { celda: (P.sbCelda(3, 'cena') || {}).items, hoy, sinFecha, tieneCena: !!cena };
    });
    const elegido = trasBuscar.platos[0];
    check('semana base: copiar llena las casillas y el buscador del selector mantiene el foco al escribir',
      llenas >= 10 && trasBuscar.foco === 'elQ' && !!elegido, JSON.stringify({ llenas, trasBuscar }));
    check('lo que pones en la semana base es lo que se come ESE día; el menú del tipo de día sigue igual sin fecha',
      efecto.celda && efecto.celda.length === 1 && efecto.celda[0].id === elegido &&
      (!efecto.tieneCena || (efecto.hoy.length === 1 && efecto.hoy[0] === elegido)),
      JSON.stringify({ elegido, efecto }));

    // apagarla devuelve el mando al tipo de día
    const apagada = await page.evaluate(() => { const P = window.PG; P.store.semBase.on = false;
      const d = new Date(); d.setDate(d.getDate() + ((4 - d.getDay() + 7) % 7 || 7));
      const k = P.iso(d), sh = P.dayInfo(k).shiftId, cena = (P.store.menu[sh] || []).filter((s) => P.claseDeToma(s.label) === 'cena')[0];
      const r = cena ? P.slotItems(sh, cena, k).base : undefined; P.store.semBase.on = true; return r; });
    check('con la semana base apagada manda otra vez el menú del tipo de día', apagada !== true, String(apagada));

    // cuándo cocinar: sesiones y los días en la nevera
    // al añadir un plato el selector se queda abierto (para añadir más): se vuelve con su botón
    // (con la cocina simple, el selector vuelve a Semana; la semana base sigue en «Más formas de montar»)
    await page.evaluate(() => { const P = window.PG; P.ui.elegir = null; P.ui.typesVista = 'semana'; P.render(); });
    await page.waitForTimeout(200);
    const aCoc = await page.$('[data-a="types-vista"][data-v="cocinar"]');
    if (aCoc) await aCoc.click();
    await page.waitForTimeout(200);
    const coc = await page.evaluate(() => ({ ses: document.querySelectorAll('#main .cses').length,
      filas: document.querySelectorAll('#main .ctl .fila').length, datos: window.PG.cocinarDatos().ses.length }));
    check('«cuándo cocinar» enseña las sesiones y de la olla al plato de cada plato de tanda',
      coc.ses >= 1 && coc.ses === coc.datos && coc.filas >= 1, JSON.stringify(coc));

    // el selector nuevo en el tipo de día, filtrado por el momento de la toma
    await page.evaluate(() => { const P = window.PG; P.ui.typesVista = 'sh-t'; P.render(); });
    await page.waitForTimeout(200);
    const nativa = await page.evaluate(() => !!document.querySelector('select[data-a="slot-meal"]'));
    const ab = await page.$('[data-a="elegir-abrir"]');
    if (ab) await ab.click();
    await page.waitForTimeout(200);
    const sel = await page.evaluate(() => ({ f: window.PG.ui.elegir && window.PG.ui.elegir.f,
      filas: document.querySelectorAll('.elop[data-a="elegir-meal"]').length,
      conKcal: [...document.querySelectorAll('.elop[data-a="elegir-meal"] .kc b')].every((b) => +b.textContent > 0) }));
    check('elegir la comida de una toma: sin lista nativa, con filtro del momento y las kcal de cada opción',
      !nativa && sel.f === 'desayuno' && sel.filas >= 1 && sel.filas < 19 && sel.conKcal, JSON.stringify({ nativa, sel }));

    // compra ⇄ menú
    await page.evaluate(() => { const P = window.PG; P.ui.elegir = null; P.ui.typesVista = ''; P.ui.tab = 'shop'; P.render(); });
    await page.waitForTimeout(250);
    const compra = await page.evaluate(() => ({ card: /Qué semana sale de lo que tienes/.test(document.getElementById('main').innerText),
      boton: !!document.querySelector('[data-a="menu-ir"][data-v="auto"]') }));
    check('la compra dice qué semana sale de lo que hay en casa y deja montarla desde ahí', compra.card && compra.boton, JSON.stringify(compra));

    // y viaja por normalize (si no, se perdería al recargar)
    const persiste = await page.evaluate(() => { const P = window.PG;
      P.store = JSON.parse(JSON.stringify(P.store)); return (P.store.semBase.d['3'] || {}).cena; });
    check('la semana base sobrevive a normalize()', !!persiste && persiste.items.length === 1, JSON.stringify(persiste));
    await page.evaluate(() => { const P = window.PG; P.store.semBase = { on: true, d: {} }; P.ui.tab = 'hoy'; P.save(); P.render(); });
  }

  // ===================================================================================
  // «Un día libre de la plantilla, ¿se trabaja?» El campo jornada.aplicaLibres existía,
  // se guardaba y se normalizaba desde el principio... y no había ni un botón para
  // tocarlo: era un booleano que solo se cambiaba editando el código.
  // ===================================================================================
  {
    await page.evaluate(() => { const P = window.PG;
      P.ui.tab = 'cfg'; P.ui.cfgVista = 'dias'; P.render(); });
    await page.waitForTimeout(400);
    const hay = await page.evaluate(() => !!document.querySelector('#main [data-a="jor-libres"]'));
    if (!hay) { // la tarjeta de la jornada puede vivir en otra puerta según el modo
      await page.evaluate(() => { const P = window.PG; P.ui.cfgVista = 'horas'; P.render(); });
      await page.waitForTimeout(400);
    }
    const libres = await page.evaluate(async () => { const P = window.PG;
      const guardado = P.store.rotation.jornada.aplicaLibres;
      const L = P.store.shifts.filter((x) => /libre/i.test(x.name || ''))[0];
      // un día LABORABLE que la plantilla llama «libre»: es el caso que decide este ajuste
      const k = P.diaLaborableCerca();
      const d = P.parseDate(k);
      const conPlantilla = () => P.jornadaEn(d.getDay(), L.id, false);
      const b = document.querySelector('#main [data-a="jor-libres"]');
      const antes = { puesto: P.store.rotation.jornada.aplicaLibres, jornada: !!conPlantilla() };
      if (b) b.click();
      const tras = { puesto: P.store.rotation.jornada.aplicaLibres, jornada: !!conPlantilla() };
      // y aguanta recargar
      P.store = JSON.parse(JSON.stringify(P.store));
      const recarga = P.store.rotation.jornada.aplicaLibres;
      // el día que pones TÚ a mano no lleva jornada en ningún caso, y eso no lo cambia el botón
      const aMano = !!P.jornadaEn(d.getDay(), L.id, true);
      P.store.rotation.jornada.aplicaLibres = guardado; P.save(); P.render();
      return { hayBoton: !!b, antes, tras, recarga, aMano }; });
    check('el botón decide si un día «libre» de la plantilla lleva jornada, y aguanta recargar',
      libres.hayBoton && libres.antes.puesto === true && libres.antes.jornada === true &&
      libres.tras.puesto === false && libres.tras.jornada === false &&
      libres.recarga === false && libres.aMano === false,
      JSON.stringify(libres));
    await page.waitForTimeout(200);
  }

  // 203) COMIDAS ARMADAS: la lista agrupada con buscador → editar una (raciones con −/+, añadir un
  // plato con el selector) → guardar; y crear una desde el selector de una toma, que queda puesta
  // en esa toma. Antes: 18 filas sin agrupar y un editor en ventana con una lista nativa por plato.
  {
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'types'; P.ui.typesVista = 'meals'; P.ui.mealsQ = ''; P.ui.mealsF = ''; P.render(); });
    await page.waitForTimeout(200);
    const lista = await page.evaluate(() => ({ grupos: document.querySelectorAll('#main .grp').length,
      filas: document.querySelectorAll('#main [data-a="meal-abrir"]').length, total: window.PG.store.meals.length }));
    const ab = await page.$('#main [data-a="meal-abrir"]');
    const mid = ab ? await ab.evaluate((b) => b.dataset.id) : '';
    if (ab) await ab.click();
    await page.waitForTimeout(200);
    const k0 = await page.evaluate(() => +((document.querySelector('.platomac b') || {}).textContent || 0));
    const mas = await page.$('[data-a="meal-rac"][data-d="0.5"]');
    if (mas) await mas.click();
    await page.waitForTimeout(150);
    const k1 = await page.evaluate(() => +((document.querySelector('.platomac b') || {}).textContent || 0));
    const add = await page.$('[data-a="meal-add"]');
    if (add) await add.click();
    await page.waitForTimeout(200);
    const pl = await page.$('[data-a="elegir-plato"]');
    if (pl) await pl.click();
    await page.waitForTimeout(200);
    const n0 = await page.evaluate((id) => (window.PG.store.meals.find((m) => m.id === id) || { items: [] }).items.length, mid);
    const g = await page.$('[data-a="meal-guardar"]');
    if (g) await g.click();
    await page.waitForTimeout(250);
    const guardada = await page.evaluate((id) => ({ n: (window.PG.store.meals.find((m) => m.id === id) || { items: [] }).items.length,
      vista: window.PG.ui.typesVista }), mid);
    check('comidas armadas: agrupadas, y el editor cambia raciones y añade platos con el selector hasta guardar',
      lista.grupos >= 2 && lista.filas === lista.total && k1 > k0 && guardada.n === n0 + 1 && guardada.vista === 'meals',
      JSON.stringify({ lista, k0, k1, n0, guardada }));

    // crear una desde el selector de una toma: nace con su momento y queda puesta en esa toma
    await page.evaluate(() => { const P = window.PG; P.ui.typesVista = 'sh-t'; P.render(); });
    await page.waitForTimeout(200);
    const eb = await page.$('[data-a="elegir-abrir"]');
    if (eb) await eb.click();
    await page.waitForTimeout(200);
    const nw = await page.$('[data-a="meal-new"]');
    if (nw) await nw.click();
    await page.waitForTimeout(200);
    const cls = await page.evaluate(() => window.PG.ui.mealEd && window.PG.ui.mealEd.o.cls);
    await page.fill('[data-a="meal-f"][data-k="name"]', 'Desayuno de prueba 203');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    const a2 = await page.$('[data-a="meal-add"]');
    if (a2) await a2.click();
    await page.waitForTimeout(200);
    const p2 = await page.$('[data-a="elegir-plato"]');
    if (p2) await p2.click();
    await page.waitForTimeout(200);
    const g2 = await page.$('[data-a="meal-guardar"]');
    if (g2) await g2.click();
    await page.waitForTimeout(250);
    const puesta = await page.evaluate(() => { const P = window.PG, s = P.store.menu['sh-t'][0];
      const m = P.store.meals.find((x) => x.id === s.mealId); return { vista: P.ui.typesVista, nombre: m && m.name }; });
    check('una comida creada desde el selector de una toma nace con su momento y queda puesta en esa toma',
      cls === 'desayuno' && puesta.vista === 'sh-t' && puesta.nombre === 'Desayuno de prueba 203', JSON.stringify({ cls, puesta }));
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'hoy'; P.ui.typesVista = ''; P.render(); });
  }

  // ===================================================================================
  // El cronómetro del descanso arrancaba SIEMPRE a 90 s. descansoCfg() leía
  // store.gym.descansoSeg y no lo escribía nadie: el ajuste existía en el código y no
  // había forma de llegar a él. (El descanso POR EJERCICIO se quitó a propósito en el
  // rediseño de las rutinas —«sin peso objetivo ni descanso, que no los usas»— y sigue
  // fuera: esto es el de toda la sesión.)
  // ===================================================================================
  {
    // la tarjeta del segundo entreno —donde vive ahora el descanso— está en Entreno → Rutinas
    await page.evaluate(() => { const P = window.PG;
      P.ui.tab = 'gym'; P.ui.gymPanel = 'rutinas'; P.render(); });
    await page.waitForTimeout(400);
    const hay = await page.evaluate(() => !!document.querySelector('#main [data-a="gym-descanso"]'));
    const antes = await page.evaluate(() => window.PG.descansoCfg());
    // es un <input>: page.fill() no dispara `change` por sí solo, hace falta el Tab
    const campo = hay ? await page.$('#main [data-a="gym-descanso"]') : null;
    if (campo) { await campo.fill('150'); await page.keyboard.press('Tab'); await page.waitForTimeout(400); }
    const tras = await page.evaluate(() => { const P = window.PG;
      const r = { seg: P.descansoCfg(), guardado: P.store.gym.descansoSeg };
      // y el cronómetro arranca con ESE número, no con 90
      P.ui.gymDesc = null;
      P.arrancaDescanso();
      r.total = P.ui.gymDesc ? P.ui.gymDesc.total : null;
      P.ui.gymDesc = null;
      // aguanta recargar: normalize() tira todo lo que no reconoce
      P.store = JSON.parse(JSON.stringify(P.store));
      r.trasRecargar = P.descansoCfg();
      return r; });
    // y 0 es válido: apaga el cronómetro en vez de volver a los 90 de fábrica
    const cero = await page.evaluate(() => { const P = window.PG;
      P.store.gym.descansoSeg = 0; P.save();
      P.store = JSON.parse(JSON.stringify(P.store));
      const seg = P.descansoCfg();
      P.ui.gymDesc = null; P.arrancaDescanso();
      const caja = !!P.ui.gymDesc;
      P.store.gym.descansoSeg = 90; P.save(); P.render();
      return { seg, caja }; });
    check('el descanso entre series se cambia desde Entreno y el cronómetro arranca con él',
      hay && !!campo && antes === 90 && tras.seg === 150 && tras.guardado === 150 &&
      tras.total === 150 && tras.trasRecargar === 150 &&
      cero.seg === 0 && cero.caja === false,
      JSON.stringify({ hay, antes, tras, cero }));
    await page.waitForTimeout(200);
  }

  // 204) AHORRO CON OBJETIVO → SUEÑO DE VERDAD → INFORME → ESTUDIO, encadenados por la interfaz
  {
    // ahorro: con una meta y una fecha, la cuenta de cuánto apartar al mes
    const m0 = await page.evaluate(() => { const P = window.PG, a = P.store.ahorro;
      a.meta = { importe: 10000, fecha: (new Date().getFullYear() + 1) + '-12', para: '' };
      const c = P.metaCalc(); delete a.meta;
      P.ui.tab = 'dinero'; P.ui.dineroVista = 'huchas'; P.ui.huchaEd = ''; P.save(); P.render();
      return c && { rec: c.rec, falta: c.falta, meses: c.meses }; });
    await page.waitForTimeout(200);
    check('ahorro: con una meta y una fecha, la app dice cuánto apartar al mes',
      m0 && m0.rec > 0 && Math.abs(m0.rec * m0.meses - m0.falta) < m0.meses * 10 + 1,
      JSON.stringify({ m0 }));
    const hu = await page.$('[data-a="aho-hu-abrir"]');
    if (hu) await hu.click();
    await page.waitForTimeout(200);
    const campos = await page.evaluate(() => document.querySelectorAll('#main input').length);
    check('huchas: se abre una cada vez (antes 21 campos a la vez)', campos > 0 && campos <= 8, String(campos));

    // sueño de verdad, en Hoy: dormí mal y se desveló una hora
    await page.evaluate(() => { const P = window.PG; P.suenoRealS()[P.iso(new Date())] = undefined; delete P.suenoRealS()[P.iso(new Date())];
      P.ui.sd = null; P.ui.tab = 'hoy'; P.ui.hoyVista = ''; P.ui.diaHoy = ''; P.render(); });
    await page.waitForTimeout(250);
    const hayCard = await page.evaluate(() => !!document.querySelector('.sncard [data-a="sn-guardar"]'));
    await page.evaluate(() => { const d = window.PG.ui.sd; if (d && d.guardia) { const b = document.querySelector('[data-a="sn-modo"]'); if (b) b.click(); } });
    await page.waitForTimeout(150);
    await page.fill('[data-a="sn-t"][data-k="acostar"]', '23:30');
    await page.keyboard.press('Tab');
    await page.fill('[data-a="sn-t"][data-k="desp"]', '06:50');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
    // al marcarla se repinta la tarjeta (salen los campos del desvelo): se pulsa desde la página
    await page.evaluate(() => { const c = document.querySelector('[data-a="sn-mal"]'); if (c && !c.checked) c.click(); });
    await page.waitForTimeout(150);
    await page.fill('[data-a="sn-t"][data-k="dde"]', '03:00');
    await page.keyboard.press('Tab');
    await page.fill('[data-a="sn-t"][data-k="da"]', '04:00');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
    const g = await page.$('[data-a="sn-guardar"]');
    if (g) await g.click();
    await page.waitForTimeout(200);
    const sn = await page.evaluate(() => window.PG.suenoReal(window.PG.iso(new Date())));
    check('«¿cómo has dormido?»: con la hora de acostarte, la de despertar y el desvelo, las horas salen solas',
      hayCard && !!sn && Math.abs(sn.h - 6.25) < 0.01 && sn.mal && sn.dde === '03:00', JSON.stringify({ hayCard, sn }));

    // la guardia de ayer: 2 h a ratos + 4 de siesta, y el informe lo cuenta
    const inf = await page.evaluate(() => { const P = window.PG, ayer = P.iso(new Date(Date.now() - 864e5));
      P.suenoRealS()[ayer] = { h: 2, guardia: true, ratos: true, siesta: 4 }; P.save();
      const s = P.suenoSemana(ayer); const d = s.dias.filter((x) => x.k === ayer)[0];
      return { total: d.t, guardia: d.r.guardia }; });
    const bInf = await page.$('.sncard [data-a="hoy-informe"]');
    if (bInf) await bInf.click();
    await page.waitForTimeout(250);
    const tiles = await page.evaluate(() => document.querySelectorAll('#main .inftile').length);
    check('la guardia cuenta lo que dormiste en ella más la siesta, y el informe tiene sus seis bloques',
      inf.total === 6 && inf.guardia && tiles === 6, JSON.stringify({ inf, tiles }));
    const volver = await page.$('[data-a="hoy-informe-cerrar"]');
    if (volver) await volver.click();

    // estudio: un libro del HUD como objetivo, página actual y cuándo terminas; el HUD se lee
    await page.evaluate(() => { localStorage.setItem('hud-pomodoros-completados', '23');
      const P = window.PG; P.estS().libros = []; P.ui.tab = 'estudio'; P.ui.estVista = ''; P.save(); P.render(); });
    await page.waitForTimeout(200);
    const hudTxt = await page.evaluate(() => /23/.test((document.querySelector('#main') || {}).innerText || ''));
    const lh = await page.$('[data-a="libro-hud"]');
    if (lh) await lh.click();
    await page.waitForTimeout(200);
    const la = await page.$('[data-a="libro-abrir"]');
    if (la) await la.click();
    await page.waitForTimeout(200);
    await page.fill('[data-a="libro-pag"]', '24');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    const lb = await page.evaluate(() => { const P = window.PG, b = P.librosS()[0]; if (!b) return null; const c = P.libroCalc(b);
      return { pag: b.pag, dias: c.dias, fin: c.fin, hoy: c.hoyDe, leido: (b.log[0] || {}).p, recarga: (P.store = JSON.parse(JSON.stringify(P.store)), P.librosS()[0].pag) }; });
    check('estudio: un libro de tu HUD se pone de objetivo, dice qué toca hoy y cuándo terminas, y sobrevive a recargar',
      hudTxt && lb && lb.pag === 24 && lb.hoy === 25 && lb.leido === 24 && lb.dias > 0 && lb.recarga === 24, JSON.stringify({ hudTxt, lb }));
    await page.evaluate(() => { const P = window.PG; localStorage.removeItem('hud-pomodoros-completados'); P.estS().libros = [];
      delete P.store.ahorro.meta; P.store.suenoReal = {}; P.ui.tab = 'hoy'; P.save(); P.render(); });
  }

  // ===================================================================================
  // Había DOS números para «lo que tardas del trabajo a casa»: trayectoMin(), que salía
  // de las horas salir→llegar del tipo de día de guardia, y viaje.min de Ajustes → Ir y
  // volver. Cambiabas uno y el otro seguía igual, y la siesta del saliente se calculaba
  // con el primero: tocar el de Ajustes no la movía.
  // ===================================================================================
  {
    const uno = await page.evaluate(() => { const P = window.PG, S = P.store;
      const vGuard = JSON.parse(JSON.stringify(S.rotation.viaje || {}));
      const rhGuard = JSON.parse(JSON.stringify(S.rhythm['sh-g'] || {}));
      S.rotation.viaje = { min: 20, bus: '07:35', antes: 4, on: true };
      // las horas del tipo de día de guardia dicen OTRA cosa (45 min), a propósito
      S.rhythm['sh-g'] = Object.assign({}, S.rhythm['sh-g'], { leave: '08:00', arrive: '08:45' });
      S.rotation.mode = 'date'; S.rotation.anchorSet = true;
      const G = S.shifts.filter(P.isGuardia)[0];
      // un día de guardia y el siguiente, que es el saliente: ahí es donde se ve la siesta
      const k = P.diaLaborableCerca();
      P.setDayOverride(k, G.id, 'umi');
      const sig = P.nextIso(k);
      P.save();
      const conAjuste = { trayecto: P.trayectoMin(), siesta: (P.sleepOf(sig).siesta || {}).de || '' };
      // apagado, se vuelve a las horas del tipo de día (45 min): la reserva sigue ahí
      S.rotation.viaje.on = false; P.save();
      const apagado = { trayecto: P.trayectoMin(), siesta: (P.sleepOf(sig).siesta || {}).de || '' };
      // y cambiar el de Ajustes SÍ mueve la siesta, que es lo que antes no pasaba
      S.rotation.viaje.on = true; S.rotation.viaje.min = 50; P.save();
      const cambiado = { trayecto: P.trayectoMin(), siesta: (P.sleepOf(sig).siesta || {}).de || '' };
      S.rotation.viaje = vGuard; S.rhythm['sh-g'] = rhGuard;
      P.setDayOverride(k, null); P.save(); P.render();
      return { conAjuste, apagado, cambiado }; });
    check('lo que tardas del trabajo a casa sale de un solo sitio, y mueve la siesta del saliente',
      uno.conAjuste.trayecto === 20 && uno.apagado.trayecto === 45 &&
      uno.cambiado.trayecto === 50 &&
      !!uno.conAjuste.siesta && uno.cambiado.siesta !== uno.conAjuste.siesta &&
      uno.apagado.siesta !== uno.conAjuste.siesta,
      JSON.stringify(uno));
    await page.waitForTimeout(200);
  }


  // ===================================================================================
  // La curva de repaso espaciado (3 → 7 → 21 → 60 días) estaba en el código. Es la que
  // decide cuándo te sale «hoy toca repasar», y ajustarla era programar.
  // ===================================================================================
  {
    const est = await page.evaluate(() => { const P = window.PG, e = P.estS();
      const guardado = JSON.parse(JSON.stringify(P.store.estudio));
      if (!e.temas.length) e.temas = [{ id: 't-rep', nombre: 'Tema de prueba', bloque: '', peso: 0, url: '' }];
      const t = e.temas[0];
      // un tema visto HOY, en el escalón 1: el siguiente repaso sale de los días de ese escalón
      e.estado[t.id] = { nivel: 1, visto: P.iso(new Date()), repasos: [], min: 0 };
      P.save();
      P.ui.tab = 'estudio'; P.ui.estVista = 't:' + t.id; P.render();
      return { id: t.id, guardado, antesDias: P.estDias(1), antesProxima: P.estProxima(t.id) }; });
    await page.waitForTimeout(400);
    const campo = await page.$('#main [data-a="est-dias"][data-n="1"]');
    // es un <input>: page.fill() no dispara `change` por sí solo
    if (campo) { await campo.fill('10'); await page.keyboard.press('Tab'); await page.waitForTimeout(400); }
    const tras = await page.evaluate((id) => { const P = window.PG;
      const r = { dias: P.estDias(1), proxima: P.estProxima(id),
        // los otros escalones no se tocan
        otro: P.estDias(2) };
      P.store = JSON.parse(JSON.stringify(P.store));   // el viaje por normalize()
      r.trasRecargar = P.estDias(1);
      return r; }, est.id);
    // 10 días desde hoy, no 3
    const esperada = await page.evaluate(() => { const P = window.PG;
      return P.iso(P.addDays(new Date(), 10)); });
    check('los días de cada escalón del repaso se cambian desde Estudio y mueven el siguiente repaso',
      !!campo && est.antesDias === 3 && tras.dias === 10 && tras.otro === 7 &&
      tras.proxima === esperada && tras.proxima !== est.antesProxima && tras.trasRecargar === 10,
      JSON.stringify({ est: { antesDias: est.antesDias, antesProxima: est.antesProxima }, tras, esperada }));

    await page.evaluate((g) => { const P = window.PG;
      P.store.estudio = g; P.ui.estVista = ''; P.save(); P.render(); }, est.guardado);
    await page.waitForTimeout(200);
  }


  // ===================================================================================
  // La app te DICE qué color ponerle en Google a cada calendario para que se vea como
  // aquí («en Google, Tomate»), y ese nombre estaba en el código: si usabas otro, el
  // texto mentía y no había forma de corregirlo.
  // ===================================================================================
  {
    await page.evaluate(() => { const P = window.PG;
      P.ui.tab = 'ajustes'; P.ui.ajuVista = 'calendario'; P.render(); });
    await page.waitForTimeout(400);
    const antes = await page.evaluate(() => { const P = window.PG;
      return { sel: document.querySelectorAll('#main [data-a="ics-color"]').length,
        opciones: (document.querySelector('#main [data-a="ics-color"]') || {}).length,
        guardias: P.icsColorGrupo('guardias') }; });
    // es un <select>: selectOption sí dispara `change`
    const hay = antes.sel > 0;
    if (hay) { await page.selectOption('#main [data-a="ics-color"][data-g="guardias"]', 'Albahaca');
      await page.waitForTimeout(350); }
    const tras = await page.evaluate(() => { const P = window.PG;
      const r = { guardias: P.icsColorGrupo('guardias'),
        // los otros grupos no se tocan
        trabajo: P.icsColorGrupo('trabajo'),
        enPantalla: (document.querySelector('#main [data-a="ics-color"][data-g="guardias"]') || {}).value };
      P.store = JSON.parse(JSON.stringify(P.store));   // el viaje por normalize()
      r.trasRecargar = P.icsColorGrupo('guardias');
      // un color que no existe en Google no se guarda: vuelve al de fábrica
      P.setIcsColor('guardias', 'Turquesa inventado');
      r.inventado = P.icsColorGrupo('guardias');
      return r; });
    check('el color de cada calendario en Google se elige, y la app deja de decirte uno que no usas',
      hay && antes.guardias === 'Tomate' && antes.opciones === 11 &&
      tras.guardias === 'Albahaca' && tras.enPantalla === 'Albahaca' &&
      // el de fábrica de «trabajo» pasó de Mandarina a Pavo real: Tomate y Mandarina son el
      // mismo rojo medido (ΔE 11,1 en visión normal) y guardias y trabajo no se distinguían
      tras.trabajo === 'Pavo real' && tras.trasRecargar === 'Albahaca' &&
      tras.inventado === 'Tomate',
      JSON.stringify({ antes, tras }));
    await page.evaluate(() => { const P = window.PG;
      P.store.rotation.icsColores = {}; P.ui.ajuVista = ''; P.save(); P.render(); });
    await page.waitForTimeout(200);
  }

  // 205) GOOGLE SIN BORRAR EL MES PASADO · MÍNIMO DE ENTRENOS · GYM Y COCINA EN EL DÍA · LLORETAZO
  {
    // el fichero de un mes lleva también los 3 anteriores, sin el viaje, con el trabajo en corto y con COLOR
    const ics = await page.evaluate(() => { const P = window.PG;
      const rr = P.calRangoExport({ desde: '2027-06-01', hasta: '2027-06-30' });
      const t = P.icsTexto(rr.desde, rr.hasta, {});
      return { desde: rr.desde, marzo: /DTSTART(;VALUE=DATE)?:202703/.test(t), viaje: /Salir de casa/.test(t),
        color: /\r\nCOLOR:/.test(t), corto: ['Radiología', 'Cardiología', 'Neumología'].map((x) => P.servicioCorto(x)).join(',') }; });
    check('exportar un mes no deja fuera los anteriores (lleva 3 meses atrás), sin el viaje, con color y el trabajo en corto',
      ics.desde === '2027-03-01' && ics.marzo && !ics.viaje && ics.color && ics.corto === 'Rayos,Cardio,Neumo', JSON.stringify(ics));

    // mínimo de entrenos: se completa solo, se quita uno a mano y la app pone otro; guardias fuera
    await page.evaluate(() => { const P = window.PG, g = P.gymS();
      g.rutinas = g.rutinas.filter((r) => r.id !== 'rt-205');
      g.rutinas.push({ id: 'rt-205', nombre: 'Prueba 205', notas: '', dias: [], ejercicios: [{ ex: 'Sentadilla', series: 3, reps: 5 }] });
      g.minSemana = 0; g.forzar = {}; P.ui.tab = 'gym'; P.ui.gymPanel = 'plan'; P.save(); P.render(); });   // el mínimo vive en «⚙ tu semana»
    await page.waitForTimeout(200);
    for (let i = 0; i < 3; i++) { const b = await page.$('[data-a="ent-min"][data-d="1"]'); if (b) await b.click(); await page.waitForTimeout(120); }
    const s1 = await page.evaluate(() => { const P = window.PG, s = P.entrenoSemana(P.iso(new Date()));
      return { min: s.min, total: s.total, faltan: s.faltan, auto: s.auto.length,
        enGuardia: s.dias.some((d) => d.auto && d.motivo === 'guardia'),
        // el primer día PUESTO DE FUERZA (el plan también pone piscina en los salientes, y esa no lleva rutina)
        rt: (function () { const f = s.dias.filter((d) => d.auto && d.tipo === 'fuerza')[0]; return f ? !!P.rutinaDeFecha(f.k) : null; })(),
        aptos: s.dias.filter((d) => d.apto && d.tipo === 'fuerza').length }; });
    const autoB = await page.$('.entdias button.auto');
    if (autoB) await autoB.click();
    await page.waitForTimeout(200);
    const s2 = await page.evaluate(() => { const P = window.PG, s = P.entrenoSemana(P.iso(new Date()));
      return { total: s.total, quitados: Object.keys(P.gymForzar()).filter((k) => P.gymForzar()[k] === false).length }; });
    check('el mínimo de entrenos por semana se completa en días libres, y al quitar uno a mano la app busca otro',
      // con 3 días de fuerza libres se llega seguro; con menos puede llegar igual gracias a la piscina del saliente
      s1.min === 3 && !s1.enGuardia && (s1.aptos >= 3 ? s1.faltan === 0 : true) && s1.rt !== false &&
      s2.quitados === 1 && (s1.aptos >= 4 ? s2.total === 3 : true), JSON.stringify({ s1, s2 }));

    // en el día: al gym → entreno → a casa, y la cocina de la semana en su hora
    const dia = await page.evaluate(() => { const P = window.PG, g = P.gymS(); g.hora = '18:00'; g.ida = 15; g.vuelta = 20;
      const s = P.entrenoSemana(P.iso(new Date())), k = s.dias.filter((d) => (d.auto || d.base) && d.tipo === 'fuerza')[0];
      if (!k) return null;
      const bl = P.bloquesDelDia(k.k);
      const ent = bl.filter((b) => /Entreno/.test(b.tit))[0], ida = bl.filter((b) => /Al gym/.test(b.tit))[0], vu = bl.filter((b) => b.cat === 'gym' && /A casa/.test(b.tit))[0];
      return { ent: ent && ent.de, ida: ida && (ida.de + '-' + ida.a), vuelta: vu && (vu.a - vu.de),
        cocina: P.cocinaDelDia ? 'ok' : 'no', icsSinCocina: !/Cocinar/.test(P.icsTexto(k.k, k.k, {})) }; });
    check('el día cuenta ir al gym y volver (solo en la app), y la cocina no va a Google',
      dia && dia.ida === (dia.ent - 15) + '-' + dia.ent && dia.vuelta === 20 && dia.icsSinCocina, JSON.stringify(dia));

    // Lloretazo: un toque, 2 h 10 por la noche, y con otro toque se quita
    await page.evaluate(() => { const P = window.PG; P.store.eventos = P.store.eventos.filter((e) => !e.lloret);
      P.ui.tab = 'hoy'; P.ui.hoyVista = ''; P.ui.diaHoy = ''; P.save(); P.render(); });
    await page.waitForTimeout(200);
    const ll = await page.$('[data-a="lloret"]');
    if (ll) await ll.click();
    await page.waitForTimeout(200);
    const l1 = await page.evaluate(() => { const P = window.PG, k = P.iso(new Date()), e = P.lloretDe(k), pl = P.lloretPlan(k);
      const bm = P.mins(pl.bed), fin = e ? P.mins(e.fin) : null;
      return { e: e ? (e.hora + '-' + e.fin) : null, dur: e ? ((fin - P.mins(e.hora) + 1440) % 1440) : 0,
        cabe: bm == null || fin == null ? null : (((bm < 720 ? bm + 1440 : bm) - (fin < 720 ? fin + 1440 : fin)) >= 15),
        carril: P.bloquesDelDia(k).some((b) => /Lloretazo/.test(b.tit)), persiste: (P.store = JSON.parse(JSON.stringify(P.store)), !!P.lloretDe(k)) }; });
    const ll2 = await page.$('[data-a="lloret"]');
    if (ll2) await ll2.click();
    await page.waitForTimeout(200);
    const l2 = await page.evaluate(() => !!window.PG.lloretDe(window.PG.iso(new Date())));
    check('el Lloretazo se pone con un toque (2 h 10, vuelves con tiempo para dormir tus horas) y se quita con otro',
      !!l1.e && l1.dur === 130 && l1.cabe !== false && l1.carril && l1.persiste && l2 === false, JSON.stringify({ l1, l2 }));
    await page.evaluate(() => { const P = window.PG, g = P.gymS(); g.minSemana = 0; g.forzar = {};
      g.rutinas = g.rutinas.filter((r) => r.id !== 'rt-205'); P.save(); P.render(); });
  }

  // 206) LA SEMANA DE ENTRENOS: fuerza + piscina del saliente, eventos que chocan, aviso con el porqué,
  //      eventos visibles en vacaciones y en la rejilla de la semana
  {
    const r = await page.evaluate(() => { const P = window.PG, g = P.gymS(), copia = JSON.parse(JSON.stringify(P.store));
      const lun = P.mondayOf(new Date(2027, 4, 5)), k = (i) => P.iso(P.addDays(lun, i));
      g.rutinas = g.rutinas.filter((x) => !/^rt-206/.test(x.id));
      g.rutinas.push({ id: 'rt-206a', nombre: 'A206', notas: '', dias: [], ejercicios: [{ ex: 'Sentadilla', series: 3, reps: 5 }] });
      g.rutinas.push({ id: 'rt-206b', nombre: 'B206', notas: '', dias: [], ejercicios: [{ ex: 'Press', series: 3, reps: 5 }] });
      g.minSemana = 4; g.fuerzaMin = 2; g.forzar = {}; g.hora = ''; g.segundo.on = false; g.cambios = {};
      const ds = ['sh-t', 'sh-g', 'sh-s', 'sh-t', 'sh-t', 'sh-l', 'sh-l'];
      ds.forEach((sh, i) => P.setDayOverride(k(i), sh, ''));
      P.store.eventos = P.store.eventos.filter((e) => !/^ev-206/.test(e.id));
      P.store.eventos.push({ id: 'ev-206', titulo: 'Cena 206', hora: '15:00', fin: '19:30', modo: 'fecha', fecha: k(3), on: true });
      P.render();
      const s = P.entrenoSemana(k(0)), d = s.dias;
      const a = { total: s.total, conflicto: s.conflicto, pisc: d[2].auto && d[2].tipo === 'pisc', jue: !d[3].auto && !!d[3].choca,
        guardia: d[1].auto, fuerza: s.fuerza, orden: d.filter((x) => x.auto && x.tipo === 'fuerza').map((x) => s.asig[x.k].nombre).join(','),
        piscBloque: P.bloquesDelDia(k(2)).some((b) => /Piscina/.test(b.tit) && b.de === 20 * 60 && b.a === 21 * 60 + 30),
        gymBloque: d.filter((x) => x.auto && x.tipo === 'fuerza').every((x) => P.bloquesDelDia(x.k).some((b) => /Entreno/.test(b.tit))) };
      // tres guardias: no llega y dice por qué
      P.setDayOverride(k(3), 'sh-g', ''); P.setDayOverride(k(4), 'sh-s', ''); P.setDayOverride(k(5), 'sh-g', ''); P.setDayOverride(k(6), 'sh-s', '');
      P.render();
      const s2 = P.entrenoSemana(k(0));
      const b = { conflicto: s2.conflicto, guardias: s2.guardias, porque: P.entrenoPorQue(s2), aviso: P.entrenoSemanaHTML(k(0), true) };
      // vacaciones con evento: el evento sale con su hora, no un bloque de «todo el día»
      delete P.store.rotation.daySet[k(6)];
      P.addVacation(k(6), k(6), 'Canarias');
      P.store.eventos.push({ id: 'ev-206v', titulo: 'Vuelo 206', hora: '12:00', fin: '13:55', modo: 'fecha', fecha: k(6), on: true });
      P.render();
      const bl = P.bloquesDelDia(k(6));
      const days = []; for (let i = 0; i < 7; i++) days.push({ key: k(i), date: P.addDays(lun, i), short: 'x', shiftId: P.dayInfo(k(i)).shiftId, inf: P.dayInfo(k(i)) });
      const rej = P.carrilSemanaHTML(days, {});
      const c = { vuelo: bl.some((x) => /Vuelo 206/.test(x.tit) && x.de === 720 && x.a === 13 * 60 + 55), todoDia: bl.some((x) => /todo el día/.test(x.sub)),
        rejilla: /Vuelo 206/.test(rej), puntos: /class="sp2"/.test(rej), leyenda: /srley/.test(rej) };
      P.store = copia; P.save(); P.render();
      return { a, b, c }; });
    check('la semana se completa con 2 de fuerza (en tu orden) + piscina del saliente a las 20:00, sin tocar la guardia ni el día con evento',
      r.a.total === 4 && !r.a.conflicto && r.a.pisc && r.a.jue && !r.a.guardia && r.a.fuerza >= 2 && /^A206,B206/.test(r.a.orden) && r.a.piscBloque && r.a.gymBloque, JSON.stringify(r.a));
    check('con más de 2 guardias la semana avisa de que no llega y dice por qué',
      r.b.conflicto && r.b.guardias === 3 && /3 guardias/.test(r.b.porque) && /solo cabe/i.test(r.b.aviso), JSON.stringify(r.b));
    check('en vacaciones los eventos salen con su franja (y en la rejilla de la semana), sin puntos sueltos y con leyenda',
      r.c.vuelo && !r.c.todoDia && r.c.rejilla && !r.c.puntos && r.c.leyenda, JSON.stringify(r.c));
  }

  // ===================================================================================
  // El orden de los pasillos lo traía COMPRA_SECS fijo (verdura → carne → pescado → …) y
  // ese es el orden en que se pinta la lista: si en tu súper la panadería está a la
  // entrada, hacías el súper en zigzag y no había forma de cambiarlo sin tocar código.
  // ===================================================================================
  {
    await page.evaluate(() => { const P = window.PG;
      P.ui.tab = 'shop'; P.ui.shopVista = 'listas'; P.render(); });
    await page.waitForTimeout(400);
    const antes = await page.evaluate(() => { const P = window.PG;
      return { filas: document.querySelectorAll('#main .pasord .pfila').length,
        orden: P.secsOrdenadas().map((x) => x[0]),
        // el primero no puede subir y el último no puede bajar
        primerArriba: !!(document.querySelector('#main .pasord .pfila .btn[data-d="-1"]') || {}).disabled }; });
    // se conduce el botón de verdad: vive en act(), que es donde tienen que estar los botones
    const hay = antes.filas > 0;
    if (hay) { await page.click('#main .pasord .pfila:nth-child(2) [data-a="sec-mover"][data-d="-1"]');
      await page.waitForTimeout(350); }
    const tras = await page.evaluate(() => { const P = window.PG;
      const r = { orden: P.secsOrdenadas().map((x) => x[0]) };
      P.store = JSON.parse(JSON.stringify(P.store));   // el viaje por normalize()
      r.trasRecargar = P.secsOrdenadas().map((x) => x[0]);
      return r; });
    // ENCADENADO: la LISTA se pinta en ese orden, que es de lo que va todo esto
    await page.evaluate(() => { const P = window.PG; P.ui.shopVista = ''; P.render(); });
    await page.waitForTimeout(400);
    const enLista = await page.evaluate(() => { const P = window.PG;
      const d = P.compraDatos();
      const g = d.grupos.filter((x) => x[2].length)[0];
      if (!g) return null;
      return P.porSeccion(g[2]).map((x) => x.k); });
    // y el ↺ lo devuelve al orden de fábrica
    const reset = await page.evaluate(() => { const P = window.PG;
      P.ui.shopVista = 'listas'; P.render();
      const b = document.querySelector('#main [data-a="sec-orden-reset"]');
      if (b) b.click();
      return { habiaBoton: !!b, orden: P.secsOrdenadas().map((x) => x[0]) }; });
    check('el orden de los pasillos se cambia, manda en la lista de la compra y aguanta recargar',
      hay && antes.filas === 9 && antes.primerArriba === true &&
      antes.orden[0] === 'verdura' && antes.orden[1] === 'carne' &&
      tras.orden[0] === 'carne' && tras.orden[1] === 'verdura' &&
      tras.trasRecargar[0] === 'carne' &&
      // la lista solo trae los pasillos con cosas, pero en el orden nuevo
      (!enLista || enLista.indexOf('carne') < 0 || enLista.indexOf('verdura') < 0 ||
        enLista.indexOf('carne') < enLista.indexOf('verdura')) &&
      reset.habiaBoton && reset.orden[0] === 'verdura',
      JSON.stringify({ antes, tras, enLista, reset }));
    await page.evaluate(() => { const P = window.PG;
      delete P.food().secOrden; P.ui.shopVista = ''; P.save(); P.render(); });
    await page.waitForTimeout(200);
  }


  // ===================================================================================
  // GOOGLE DUPLICABA EN CADA IMPORTACIÓN. El UID de un evento salía de su TÍTULO, así que
  // cambiar el tipo de una guardia o la rotación del mes le cambiaba el UID: Google no lo
  // reconocía, creaba uno nuevo y dejaba el viejo al lado. Importación tras importación se
  // iban apilando copias. Y el saliente no se mandaba, así que en Google un saliente y un
  // día libre se veían igual: en blanco.
  // ===================================================================================
  {
    const cal = await page.evaluate(() => { const P = window.PG, S = P.store;
      const guardado = { mode: S.rotation.mode, anchor: S.rotation.anchorSet };
      S.rotation.mode = 'date'; S.rotation.anchorSet = true; P.save();
      const desde = '2026-10-19', hasta = '2026-10-25';
      const uids = (t) => [...t.matchAll(/^UID:(.+)$/gm)].map((m) => m[1].trim()).sort();
      const cmp = (a, c) => ({ nuevos: c.filter((x) => a.indexOf(x) < 0).length,
        huerfanos: a.filter((x) => c.indexOf(x) < 0).length });
      const base = uids(P.icsTexto(desde, hasta, {}));
      const G = S.shifts.filter(P.isGuardia)[0];
      const ovAntes = P.dayOverride('2026-10-19');
      P.setDayOverride('2026-10-19', G.id, 'urg'); P.save();
      const conUrg = uids(P.icsTexto(desde, hasta, {}));
      // se cambia el TIPO de la guardia: el título cambia, el evento es el mismo
      P.setDayOverride('2026-10-19', G.id, 'umi'); P.save();
      const trasTipo = cmp(conUrg, uids(P.icsTexto(desde, hasta, {})));
      // y la rotación del mes, que va dentro del título de «Trabajo»
      const sv = P.monthService(2026, 9).service;
      P.setMonthService(2026, 9, 'Neumología', null);
      const trasRot = cmp(conUrg, uids(P.icsTexto(desde, hasta, {})));
      P.setMonthService(2026, 9, sv, null);
      // el saliente del día siguiente a la guardia: bloque hasta el relevo Y la siesta
      const evs = P.calEventos(desde, hasta);
      const sal = evs.filter((e) => /Saliente/.test(e.summ || ''))[0] || null;
      const sie = evs.filter((e) => /Siesta/.test(e.summ || ''))[0] || null;
      // los cuatro ficheros por categoría cubren todo y no se solapan: es lo que hace que
      // cada uno entre en su calendario de Google con su color
      const todos = [];
      P.ICS_GRUPOS.forEach((g) => uids(P.icsTexto(desde, hasta, { cats: g[2] })).forEach((u) => todos.push(u)));
      const base2 = uids(P.icsTexto(desde, hasta, {}));
      P.setDayOverride('2026-10-19', ovAntes ? ovAntes.shift : null, ovAntes ? ovAntes.guard : '');
      S.rotation.mode = guardado.mode; S.rotation.anchorSet = guardado.anchor; P.save();
      return { trasTipo, trasRot,
        sal: sal ? { hora: sal.hora, fin: sal.horaFin, cat: sal.cat } : null,
        sie: sie ? { hora: sie.hora, cat: sie.cat } : null,
        solapes: todos.length - new Set(todos).size,
        cubreTodo: new Set(todos).size === base2.length,
        nBase: base.length }; });
    check('cambiar el tipo de una guardia o la rotación no duplica el evento en Google',
      cal.trasTipo.huerfanos === 0 && cal.trasTipo.nuevos === 0 &&
      cal.trasRot.huerfanos === 0,
      JSON.stringify({ trasTipo: cal.trasTipo, trasRot: cal.trasRot }));
    check('el saliente va a Google con su bloque hasta el relevo y con la siesta',
      !!cal.sal && cal.sal.hora === '00:00' && cal.sal.fin > '00:00' && cal.sal.cat === 'GUARDIA' &&
      !!cal.sie && cal.sie.cat === 'GUARDIA',
      JSON.stringify({ sal: cal.sal, sie: cal.sie }));
    check('los cuatro ficheros por categoría cubren todo el calendario y no se pisan',
      cal.solapes === 0 && cal.cubreTodo, JSON.stringify({ solapes: cal.solapes, cubreTodo: cal.cubreTodo }));
    await page.evaluate(() => window.PG.render());
    await page.waitForTimeout(200);
  }


  // ===================================================================================
  // SINCRONIZAR EN VEZ DE IMPORTAR. Importar un .ics es una foto: lo que borres después se
  // queda en Google para siempre y hay que volver a importar a mano. Suscrito a una URL,
  // Google la relee y deja el calendario igual que la app. La URL la pone su Worker.
  // ===================================================================================
  {
    // un buzón de mentira dentro de la propia página: el mismo contrato que el Worker
    const sync = await page.evaluate(async () => { const P = window.PG;
      const guardado = JSON.parse(JSON.stringify(P.store.rotation.calSync || {}));
      const subidas = [];
      const fetchReal = window.fetch;
      window.fetch = async (u, o) => {
        subidas.push({ url: String(u), metodo: (o || {}).method,
          auth: ((o || {}).headers || {})['authorization'],
          ics: /^BEGIN:VCALENDAR/.test(String((o || {}).body || '')) });
        return new Response('ok', { status: 200 });
      };
      const c = P.calSyncCfg();
      c.url = 'https://cal.example.workers.dev'; c.token = 'secreto'; c.buzon = P.buzonNuevo();
      P.save();
      const antes = P.calSyncPendiente();
      const msg = await P.calSyncSubir();
      const despues = P.calSyncPendiente();
      // se cambia algo del planning: tiene que volver a quedar pendiente
      const G = P.store.shifts.filter(P.isGuardia)[0];
      const k = P.iso(P.addDays(new Date(), 3));
      const ovAntes = P.dayOverride(k);
      P.setDayOverride(k, G.id, 'umi'); P.save();
      const trasCambiar = P.calSyncPendiente();
      P.setDayOverride(k, ovAntes ? ovAntes.shift : null, ovAntes ? ovAntes.guard : '');
      const urls = P.ICS_GRUPOS.map((g) => P.calSyncURL(g[0]));
      window.fetch = fetchReal;
      P.store.rotation.calSync = guardado; P.save();
      return { antes, msg, despues, trasCambiar, subidas, urls, buzon: c.buzon }; });
    check('la app sube los cuatro calendarios al buzón, con el token en la cabecera y no en la URL',
      sync.subidas.length === 4 &&
      sync.subidas.every((x) => x.metodo === 'PUT' && x.auth === 'Bearer secreto' && x.ics) &&
      // el token NUNCA en la URL: las direcciones se quedan en los registros de medio mundo
      sync.subidas.every((x) => x.url.indexOf('secreto') < 0) &&
      sync.urls.length === 4 && sync.urls.every((u) => /^https:\/\/.+\/cal\/[a-z0-9]{24,}\/\w+\.ics$/.test(u)),
      JSON.stringify({ subidas: sync.subidas, urls: sync.urls }));
    check('«hay cambios sin subir» se enciende al cambiar el planning y se apaga al subir',
      sync.antes === true && sync.despues === false && sync.trasCambiar === true && /subido/.test(sync.msg),
      JSON.stringify({ antes: sync.antes, msg: sync.msg, despues: sync.despues, trasCambiar: sync.trasCambiar }));

    // la dirección tiene que ser https y sobrevivir a recargar: el token viaja en una cabecera
    // y por http lo lee cualquiera del wifi
    const seguro = await page.evaluate(() => { const P = window.PG;
      const g = JSON.parse(JSON.stringify(P.store.rotation.calSync || {}));
      const c = P.calSyncCfg();
      c.url = 'http://cal.example.com'; c.token = 't'; c.buzon = P.buzonNuevo(); P.save();
      P.store = JSON.parse(JSON.stringify(P.store));
      const httpFuera = P.calSyncCfg().url;
      P.calSyncCfg().url = 'https://cal.example.workers.dev'; P.save();
      P.store = JSON.parse(JSON.stringify(P.store));
      const httpsQueda = P.calSyncCfg().url;
      const buzonQueda = /^[a-z0-9]{24,64}$/.test(P.calSyncCfg().buzon);
      P.store.rotation.calSync = g; P.save();
      return { httpFuera, httpsQueda, buzonQueda }; });
    check('la dirección del buzón solo se guarda si es https, y aguanta recargar',
      seguro.httpFuera === '' && seguro.httpsQueda === 'https://cal.example.workers.dev' && seguro.buzonQueda,
      JSON.stringify(seguro));
    await page.evaluate(() => window.PG.render());
    await page.waitForTimeout(200);
  }


  // ===================================================================================
  // QUE SE SUBA SOLO. Lo que pidió: cambiar algo y que aparezca en Google sin descargar,
  // importar ni exportar nada. save() solo PIDE la subida y un temporizador la agrupa:
  // sin eso, escribir el nombre de un evento dispararía una subida por cada tecla.
  // ===================================================================================
  {
    const auto = await page.evaluate(async () => { const P = window.PG;
      const guardado = JSON.parse(JSON.stringify(P.store.rotation.calSync || {}));
      let subidas = 0;
      const fetchReal = window.fetch;
      window.fetch = async () => { subidas++; return new Response('ok', { status: 200 }); };
      const c = P.calSyncCfg();
      c.url = 'https://cal.example.workers.dev'; c.token = 's'; c.buzon = P.buzonNuevo(); c.auto = true;
      // 20 guardados seguidos, como al escribir el nombre de un evento
      for (let i = 0; i < 20; i++) P.save();
      const traslas20 = subidas;
      // el temporizador no ha saltado: se pide la subida, no se hace
      const pendiente = P.calSyncPendiente();
      // se fuerza el momento en que salta
      await P.calSyncAhoraSiToca();
      await new Promise((r) => setTimeout(r, 300));
      const trasElTemporizador = subidas;
      // y al no haber cambiado nada más, no vuelve a subir
      await P.calSyncAhoraSiToca();
      await new Promise((r) => setTimeout(r, 200));
      const sinCambios = subidas;
      // apagado, no sube aunque cambies cosas
      c.auto = false; P.save();
      const apagado = P.calSyncAuto();
      window.fetch = fetchReal;
      P.store.rotation.calSync = guardado; P.save();
      return { traslas20, pendiente, trasElTemporizador, sinCambios, apagado }; });
    check('veinte guardados seguidos no suben nada; el temporizador sube UNA vez los cuatro',
      auto.traslas20 === 0 && auto.pendiente === true &&
      auto.trasElTemporizador === 4 && auto.sinCambios === 4 && auto.apagado === false,
      JSON.stringify(auto));

    // el aviso de colores que se confunden: es lo que le pasó con Tomate y Mandarina
    const choca = await page.evaluate(() => { const P = window.PG;
      const g = JSON.parse(JSON.stringify(P.store.rotation.icsColores || {}));
      const deFabrica = P.icsColorChoca();
      // a mano, los dos que a él le salieron iguales
      P.setIcsColor('guardias', 'Tomate'); P.setIcsColor('trabajo', 'Mandarina');
      const malo = P.icsColorChoca();
      // y el mismo color en dos sitios
      P.setIcsColor('trabajo', 'Tomate');
      const igual = P.icsColorChoca();
      P.store.rotation.icsColores = g; P.save();
      return { deFabrica: deFabrica.length, malo: malo.length, igual: igual.length,
        textoMalo: malo[0] || '', textoIgual: igual[0] || '' }; });
    check('los colores de fábrica no se confunden, y si eliges dos que sí, la app lo dice',
      choca.deFabrica === 0 && choca.malo >= 1 && choca.igual >= 1 &&
      /Tomate y Mandarina|Mandarina y Tomate/.test(choca.textoMalo) &&
      /mismo color/.test(choca.textoIgual),
      JSON.stringify(choca));
    await page.evaluate(() => window.PG.render());
    await page.waitForTimeout(200);
  }


  // ===================================================================================
  // «QUE VENGA BIEN INDICADO LO DE CADA DÍA». En la columna de la semana de Google caben
  // unos 12 caracteres: «🩺 Guardia · Urgencias [urg]» se leía «🩺 Guardia ·…», o sea que
  // lo único que distingue una guardia de otra quedaba fuera, y el [urg] era el código
  // interno de la app. Lo que distingue va primero; el emoji ya dice de qué se trata.
  // ===================================================================================
  {
    const tit = await page.evaluate(() => { const P = window.PG, S = P.store;
      const guardado = { mode: S.rotation.mode, anchor: S.rotation.anchorSet };
      S.rotation.mode = 'date'; S.rotation.anchorSet = true; P.save();
      const k = '2026-10-19', G = S.shifts.filter(P.isGuardia)[0];
      const ovAntes = P.dayOverride(k);
      const svAntes = P.monthService(2026, 9).service;
      P.setDayOverride(k, G.id, 'urg'); P.setMonthService(2026, 9, 'Urgencias', null); P.save();
      const de = (cat, desde, hasta) => (P.calEventos(desde || k, hasta || k)
        .filter((e) => e.cat === cat)[0] || {}).summ || '';
      const urg = de('GUARDIA');
      P.setDayOverride(k, G.id, 'umi'); P.save();
      const umi = de('GUARDIA');
      // el saliente y la siesta son del día siguiente a la guardia
      const k2 = P.iso(P.addDays(P.parseDate(k), 1));
      const evs2 = P.calEventos(k2, k2);
      const sal = (evs2.filter((e) => /Saliente/.test(e.summ || ''))[0] || {}).summ || '';
      const sie = (evs2.filter((e) => /Siesta/.test(e.summ || ''))[0] || {}).summ || '';
      // un día de trabajo cualquiera de ese mes, con la rotación puesta
      let trab = '';
      for (let i = 1; i <= 25 && !trab; i++) trab = de('TRABAJO', '2026-10-' + String(i).padStart(2, '0'));
      P.setDayOverride(k, ovAntes ? ovAntes.shift : null, ovAntes ? ovAntes.guard : '');
      P.setMonthService(2026, 9, svAntes, null);
      S.rotation.mode = guardado.mode; S.rotation.anchorSet = guardado.anchor; P.save();
      const largo = (t) => [...t].length;
      return { urg, umi, sal, sie, trab,
        largos: [urg, umi, sal, sie, trab].map(largo) }; });
    check('en Google, el título de cada día dice QUÉ es antes de que Google lo corte',
      tit.urg === '🩺 Urgencias' && tit.umi === '🩺 UMI' &&
      /^🚪 Saliente \d{1,2}:\d{2}$/.test(tit.sal) && tit.sie === '😴 Siesta' &&
      tit.trab === '💼 Urgencias' &&
      // y ninguno pasa de 16 caracteres, que es lo que se lee de un vistazo
      tit.largos.every((n) => n > 0 && n <= 16),
      JSON.stringify(tit));
    check('el código interno de la guardia ya no se le enseña a nadie',
      !/\[urg\]|\[umi\]/.test(tit.urg + tit.umi), JSON.stringify(tit));
    await page.evaluate(() => window.PG.render());
    await page.waitForTimeout(200);
  }


  // ===================================================================================
  // LA CADENA ENTERA DEL CALENDARIO QUE SE SUBE SOLO, CONDUCIENDO LA PANTALLA. Las pruebas
  // de arriba llaman a calSyncCfg() y a calSyncSubir() a mano: eso pasa por encima de los
  // dos switches de acciones y del render, que es donde se esconden los fallos mudos.
  // Aquí se teclea en los campos, se pulsan los botones y se lee lo que pone la tarjeta.
  //
  // Y ENCADENANDO SE VE EL FALLO: subir → que falle UNO de los cuatro → la tarjeta decía
  // «Al día». La firma se guardaba aunque hubiera fallado un fichero, así que un calendario
  // de Google se quedaba congelado y el automático no volvía a intentarlo hasta el cambio
  // siguiente. El aviso salía una vez en un flash y desaparecía.
  // ===================================================================================
  {
    await gotoTab('ajustes', 'calendario');
    const guardado = await page.evaluate(() => { const P = window.PG;
      const g = JSON.parse(JSON.stringify(P.store.rotation.calSync || {}));
      // un buzón de mentira dentro de la página, con el mismo contrato que el Worker. window.fallan
      // dice qué grupos tienen que fallar, para simular que se cae uno de los cuatro.
      window.__subidas = []; window.__fallan = [];
      window.__fetchReal = window.fetch;
      window.fetch = async (u, o) => {
        const url = String(u), grupo = (url.match(/\/([a-z]+)\.ics$/) || [])[1] || '';
        window.__subidas.push({ url, metodo: (o || {}).method,
          auth: ((o || {}).headers || {})['authorization'] || '',
          bytes: String((o || {}).body || '').length });
        if (window.__fallan.indexOf(grupo) >= 0) return new Response('no', { status: 500 });
        return new Response('ok', { status: 200 });
      };
      return g; });

    // GESTO 1: teclear la dirección y el token. Van en el switch de `change`, así que hace falta
    // el Tab: un fill() a secas no dispara nada y la prueba pasaría sin que la app se enterara.
    await page.fill('[data-a="calsync-f"][data-f="url"]', 'https://cal.midominio.workers.dev');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    await page.fill('[data-a="calsync-f"][data-f="token"]', 'un-secreto-largo');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    const salieronBotones = await page.evaluate(() => ({
      subir: !!document.querySelector('[data-a="calsync-subir"]'),
      auto: (document.querySelector('[data-a="calsync-auto"]') || {}).textContent || '',
      pend: /sin subir/.test(document.querySelector('#main').textContent) }));
    check('al poner dirección y token aparecen los botones, el automático ya encendido y avisa de que hay cambios sin subir',
      salieronBotones.subir && /✓/.test(salieronBotones.auto) && salieronBotones.pend,
      JSON.stringify(salieronBotones));

    // GESTO 2: ver las cuatro direcciones, que es lo que hay que pegar en Google
    await page.click('[data-a="calsync-direcciones"]');
    await page.waitForTimeout(250);
    const dirs = await page.evaluate(() => { const P = window.PG;
      const t = document.querySelector('#main').textContent;
      const b = P.calSyncCfg().buzon;
      return { cuantas: P.ICS_GRUPOS.filter((g) => t.indexOf('/cal/' + b + '/' + g[0] + '.ics') >= 0).length,
        buzonLargo: b.length }; });
    check('las cuatro direcciones que hay que pegar en Google salen en pantalla, una por calendario',
      dirs.cuantas === 4 && dirs.buzonLargo >= 24, JSON.stringify(dirs));

    // GESTO 3: subir. Los cuatro con PUT, el token en la CABECERA y nunca en la dirección
    await page.click('[data-a="calsync-subir"]');
    await page.waitForTimeout(700);
    const sub1 = await page.evaluate(() => ({
      n: window.__subidas.length,
      puts: window.__subidas.filter((s) => s.metodo === 'PUT').length,
      conToken: window.__subidas.filter((s) => /^Bearer un-secreto-largo$/.test(s.auth)).length,
      tokenEnURL: window.__subidas.filter((s) => /secreto/.test(s.url)).length,
      vacios: window.__subidas.filter((s) => s.bytes < 40).length,
      alDia: /Al día/.test(document.querySelector('#main').textContent) }));
    check('«subir ya» sube los cuatro con el token en la cabecera y la tarjeta pasa a «Al día»',
      sub1.n === 4 && sub1.puts === 4 && sub1.conToken === 4 && sub1.tokenEnURL === 0 &&
      sub1.vacios === 0 && sub1.alDia === true, JSON.stringify(sub1));

    // GESTO 4, ENCADENADO SIN RESETEAR NADA: cambiar algo de verdad en la misma pantalla —los
    // minutos de aviso van dentro de los cuatro ficheros— y que UNO de los cuatro falle al subir.
    await page.evaluate(() => { window.__subidas = []; window.__fallan = ['entrenos']; });
    await page.fill('[data-a="ics-aviso-min"]', '45');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    const trasCambiar = await page.evaluate(() => ({
      pend: /sin subir/.test(document.querySelector('#main').textContent),
      subidasDeMomento: window.__subidas.length }));
    await page.click('[data-a="calsync-subir"]');
    await page.waitForTimeout(700);
    const sub2 = await page.evaluate(() => ({
      n: window.__subidas.length,
      texto: document.querySelector('#main').textContent,
      pend: window.PG.calSyncPendiente() }));
    check('cambiar los minutos de aviso marca los cuatro ficheros como pendientes, sin subir nada todavía',
      trasCambiar.pend === true && trasCambiar.subidasDeMomento === 0, JSON.stringify(trasCambiar));
    check('si falla uno de los cuatro, la app NO dice «Al día»: sigue pendiente y lo reintentará',
      sub2.n === 4 && sub2.pend === true && !/Al día/.test(sub2.texto) &&
      /sin subir/.test(sub2.texto), JSON.stringify({ n: sub2.n, pend: sub2.pend,
        alDia: /Al día/.test(sub2.texto), avisa: /sin subir/.test(sub2.texto) }));

    // GESTO 5: el Worker vuelve, se guarda cualquier cosa y el automático lo arregla solo —sin
    // volver a tocar «subir ya»—, que es lo que se le prometió: no tener que hacer nada.
    await page.evaluate(async () => { window.__subidas = []; window.__fallan = [];
      window.PG.save(); await window.PG.calSyncAhoraSiToca();
      await new Promise((r) => setTimeout(r, 300)); });
    await page.waitForTimeout(300);
    const sub3 = await page.evaluate(() => ({ n: window.__subidas.length,
      pend: window.PG.calSyncPendiente(),
      alDia: /Al día/.test(document.querySelector('#main').textContent) }));
    check('cuando el Worker vuelve, el automático sube los cuatro sin que le des a nada y queda al día',
      sub3.n === 4 && sub3.pend === false && sub3.alDia === true, JSON.stringify(sub3));

    // GESTO 6: apagar el automático y cambiar algo: no sube nada hasta que le des tú
    await page.click('[data-a="calsync-auto"]');
    await page.waitForTimeout(250);
    await page.evaluate(() => { window.__subidas = []; });
    await page.fill('[data-a="ics-aviso-min"]', '20');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(250);
    const apagado = await page.evaluate(async () => { const P = window.PG;
      await P.calSyncAhoraSiToca();
      await new Promise((r) => setTimeout(r, 200));
      return { subidas: window.__subidas.length,
        avisa: /Automático apagado/.test(document.querySelector('#main').textContent),
        pend: P.calSyncPendiente() }; });
    check('con el automático apagado no sube nada solo, y la tarjeta lo dice en vez de callarlo',
      apagado.subidas === 0 && apagado.avisa === true && apagado.pend === true,
      JSON.stringify(apagado));

    // GESTO 7: «cambiar la dirección» invalida las de Google, así que vuelve a estar pendiente
    // aunque el contenido no haya cambiado: si no, el calendario nuevo se quedaría vacío.
    const antesBuzon = await page.evaluate(() => window.PG.calSyncCfg().buzon);
    await page.click('[data-a="calsync-auto"]');   // se vuelve a encender
    await page.waitForTimeout(200);
    await page.evaluate(async () => { window.__subidas = [];
      await window.PG.calSyncAhoraSiToca(); await new Promise((r) => setTimeout(r, 300)); });
    await page.click('[data-a="calsync-nuevo"]');
    await page.waitForTimeout(250);
    await page.click('#modal [data-a="confirm-yes"]');
    await page.waitForTimeout(350);
    const nuevo = await page.evaluate(() => { const P = window.PG;
      return { buzon: P.calSyncCfg().buzon, pend: P.calSyncPendiente() }; });
    check('cambiar la dirección da un buzón nuevo y vuelve a marcar pendiente: el calendario nuevo no puede quedarse vacío',
      nuevo.buzon !== antesBuzon && nuevo.buzon.length >= 24 && nuevo.pend === true,
      JSON.stringify({ cambia: nuevo.buzon !== antesBuzon, pend: nuevo.pend }));

    await page.evaluate((g) => { const P = window.PG;
      window.fetch = window.__fetchReal; delete window.__subidas; delete window.__fallan;
      P.store.rotation.icsAvisoMin = 30;
      P.store.rotation.calSync = g; P.save(); P.render(); }, guardado);
    await page.waitForTimeout(250);
  }

  // 207) ENTRENO DE VERDAD: series una a una, superserie sin descanso, la sesión sobrevive a recargar,
  //      se cierra sola si te olvidas (con la hora real) y los discos por lado
  {
    await page.evaluate(() => { const P = window.PG, g = P.gymS();
      g.rutinas = [{ id: 'r207', nombre: 'Fuerza 207', notas: '', dias: [], descanso: 120, ejercicios: [
        { ex: 'Sentadilla (barra)', series: 2, reps: 5 },
        { ex: 'Curl de bíceps (barra)', series: 2, reps: 10, ss: true }, { ex: 'Face pull', series: 2, reps: 12 }] }];
      g.registro = []; g.sesiones = []; P.ui.gymSesionActiva = null; P.ui.gymInforme = ''; P.ui.tab = 'gym'; P.ui.gymPanel = '';
      P.save(); P.render(); });
    await page.waitForTimeout(250);
    const emp = await page.$('#main .ghero2 [data-a="ses-empezar"], #main [data-a="gym-rutv"][data-id="r207"]');
    if (emp) { await emp.click(); await page.waitForTimeout(250); }
    const ini = await page.$('#main [data-a="ses-empezar"][data-id="r207"]');
    if (ini) { await ini.click(); await page.waitForTimeout(250); }
    // superserie: curl → face pull SIN descanso; face pull → vuelta al curl CON descanso
    await page.evaluate(() => { const P = window.PG; P.ui.gymSesionActiva.ix = 1; P.render(); });
    const ok1 = await page.$('#main [data-a="gv-ok"][data-x="1"][data-i="0"]');
    if (ok1) { await ok1.click(); await page.waitForTimeout(220); }
    const trasCurl = await page.evaluate(() => ({ ix: window.PG.ui.gymSesionActiva.ix, desc: !!window.PG.ui.gymDesc }));
    const ok2 = await page.$('#main [data-a="gv-ok"][data-x="2"][data-i="0"]');
    if (ok2) { await ok2.click(); await page.waitForTimeout(220); }
    const trasFace = await page.evaluate(() => ({ ix: window.PG.ui.gymSesionActiva.ix, desc: !!window.PG.ui.gymDesc,
      segs: window.PG.ui.gymDesc ? window.PG.ui.gymDesc.total : 0 }));
    // recargar: la sesión sigue (vive en tus datos, no en memoria)
    const persiste = await page.evaluate(() => { const P = window.PG; P.store = JSON.parse(JSON.stringify(P.store));
      return !!P.ui.gymSesionActiva && P.ui.gymSesionActiva.rutinaId === 'r207'; });
    check('superserie: el compañero va sin descanso y al cerrar la vuelta descansas lo de la rutina; la sesión sobrevive a recargar',
      !!ok1 && !!ok2 && trasCurl.ix === 2 && !trasCurl.desc && trasFace.ix === 1 && trasFace.desc && trasFace.segs === 120 && persiste,
      JSON.stringify({ trasCurl, trasFace, persiste }));
    // se olvida abierta: 45 min sin apuntar → se cierra sola con última serie + descanso, no con el reloj
    const auto = await page.evaluate(() => { const P = window.PG, sa = P.ui.gymSesionActiva;
      P.store.gym.registro.filter((x) => x.sesionId === sa.id).forEach((x, i) => { x.ts = Date.now() - (60 - i) * 60000; });
      sa.ts = Date.now() - 70 * 60000; sa.ult = Date.now() - 45 * 60000; P.ui.gymPanel = ''; P.render();
      const s = P.store.gym.sesiones.filter((x) => x.rutinaId === 'r207')[0];
      return { cerrada: !P.ui.gymSesionActiva, auto: s && s.auto, min: s && s.duracionMin, aviso: /Se cerró sola/.test(document.getElementById('main').innerText) }; });
    check('si te olvidas de terminar, la sesión se cierra sola con la hora de verdad y te lo dice',
      auto.cerrada && auto.auto && auto.min === 13 && auto.aviso, JSON.stringify(auto));
    // discos: 98 kg con barra de 20 → 25 + 10 + 2,5 + 1,25 por lado
    const discos = await page.evaluate(() => { const p = window.PG.discosPorLado(98); return p.pone.join('+') + '|' + p.sobra; });
    check('los discos por lado cuadran con la barra y los discos del gym', discos === '25+10+2.5+1.25|0.25', discos);
    // editor: series una a una; cambiar la primera arrastra a las iguales, y calentamiento con un toque
    const ed = await page.evaluate(() => { const P = window.PG; P.ui.gymRutSel = 'r207'; P.ui.gymPanel = 'rutedit'; P.ui.rtAbierto = 0; P.render(); return true; });
    const kg0 = await page.$('#main input[data-a="rt-fila"][data-ix="0"][data-i="0"][data-k="kg"]');
    if (kg0) { await kg0.fill('100'); await kg0.dispatchEvent('change'); await page.waitForTimeout(250); }
    const cal = await page.$('#main [data-a="rt-fila-t"][data-ix="0"][data-i="0"]');
    if (cal) { await cal.click(); await page.waitForTimeout(250); }
    const sets = await page.evaluate(() => JSON.stringify(window.PG.gymS().rutinas[0].ejercicios[0].sets.map((s) => (s.t === 'c' ? 'C' : 'n') + s.kg)));
    check('en el editor cada serie tiene su peso: cambiar la primera arrastra a las iguales y el calentamiento se marca de un toque',
      ed && !!kg0 && !!cal && sets === '["C100","n100"]', sets);
    await page.evaluate(() => { const P = window.PG, g = P.gymS(); g.rutinas = []; g.registro = []; g.sesiones = [];
      P.ui.gymSesionActiva = null; P.ui.gymCerrada = null; P.ui.gymPanel = ''; P.save(); P.render(); });
  }

  // ===================================================================================
  // «QUE NO OCUPE NADA MÁS DE UNA LÍNEA». En la captura de su móvil, «Vacaciones» salía partido en
  // «Vacacion / es» y «Sesión general · auditorio» se llevaba tres renglones de una casilla de
  // 55 px. Y en «Hoy», «Próximos» gastaba dos líneas por evento más un renglón que explicaba lo
  // que ya dice el título, y el sol ocupaba una tarjeta de 330 px para decir tres horas.
  // ===================================================================================
  {
    await page.setViewportSize({ width: 412, height: 915 });
    await gotoTab('month');
    await page.click('[data-a="mon-today"]');
    await page.waitForTimeout(400);
    const unaLinea = await page.evaluate(() => {
      const alt = (el) => el.getBoundingClientRect().height;
      const fs = (el) => parseFloat(getComputedStyle(el).fontSize);
      const nombres = [...document.querySelectorAll('.dbox .dnm')].filter((x) => x.textContent.trim().length > 2);
      const evs = [...document.querySelectorAll('.dbox .dev')];
      return {
        nombres: nombres.length,
        nombresDeDosLineas: nombres.filter((x) => alt(x) > fs(x) * 1.7).length,
        eventos: evs.length,
        eventosDeDosLineas: evs.filter((x) => alt(x) > fs(x) * 1.7).length,
        // y el nombre entero sigue estando: en el title, para no perderlo al recortar
        conTitle: nombres.filter((x) => (x.closest('.dbox').title || '').length > 0).length === nombres.length,
      };
    });
    check('en el Mes ni el tipo de día ni un evento pasan de UNA línea, y el nombre entero sigue en el title',
      unaLinea.nombres >= 10 && unaLinea.nombresDeDosLineas === 0 &&
      unaLinea.eventosDeDosLineas === 0 && unaLinea.conTitle,
      JSON.stringify(unaLinea));

    // antes de recortar se quita lo que sobra: si no, «Sesión general» quedaba en «Sesi…»
    const corto = await page.evaluate(() => { const T = window.PG.tituloCasilla;
      return { conPunto: T('Sesión general · auditorio'), relleno: T('Curso bioestadística'),
        yaCorto: T('Curso rcp'), pelado: T('Lloretazo'), vacio: T('') }; });
    check('el nombre de un evento se acorta antes de recortarlo, y lo que ya es corto no se toca',
      corto.conPunto === 'S. general' && corto.relleno === 'C. bioestadística' &&
      corto.yaCorto === 'Curso rcp' && corto.pelado === 'Lloretazo' && corto.vacio === 'evento',
      JSON.stringify(corto));

    // «Hoy»: Próximos a una línea por evento, y el sol plegado con sus horas en el propio renglón
    await page.evaluate(() => { const P = window.PG;
      const d = new Date(); d.setDate(d.getDate() + 4);
      const k = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const ev = P.eventosS(); ev.length = 0;
      ev.push({ id: 'px1', titulo: 'Un evento con un nombre bastante largo', hora: '15:00',
        modo: 'fecha', fecha: k, dow: [], color: '#38e1ff', on: true });
      P.save(); });
    await gotoTab('hoy');
    await page.waitForTimeout(400);
    const hoyCorto = await page.evaluate(() => {
      const filas = [...document.querySelectorAll('#main .proxf')];
      const sol = document.querySelector('#main details.solplg');
      const res = sol ? (sol.querySelector('summary .mini') || {}).textContent || '' : '';
      return { filas: filas.length,
        deDosLineas: filas.filter((f) => f.getBoundingClientRect().height > 34).length,
        sinElRelleno: !/Eventos puntuales que has apuntado/.test(document.getElementById('main').innerText),
        solPlegado: !!(sol && !sol.open),
        solConHoras: /\d{1,2}:\d{2}\s*→\s*\d{1,2}:\d{2}/.test(res) };
    });
    check('en «Hoy», cada evento de «Próximos» ocupa una línea y el sol cabe en su propio renglón',
      hoyCorto.filas >= 1 && hoyCorto.deDosLineas === 0 && hoyCorto.sinElRelleno &&
      hoyCorto.solPlegado && hoyCorto.solConHoras, JSON.stringify(hoyCorto));

    // y el sol sigue entero al abrirlo: plegarlo no es esconderlo
    await page.click('#main details.solplg > summary');
    await page.waitForTimeout(250);
    const solAbierto = await page.evaluate(() => {
      const sol = document.querySelector('#main details.solplg');
      return { abierto: !!(sol && sol.open), conArco: !!sol.querySelector('.solhero svg'),
        conSitio: !!sol.querySelector('[data-a="ir-sol"]') };
    });
    check('el sol plegado no es el sol escondido: al abrirlo está el arco y el sitio',
      solAbierto.abierto && solAbierto.conArco && solAbierto.conSitio, JSON.stringify(solAbierto));
    await page.waitForTimeout(150);
  }


  // ===================================================================================
  // LA CABECERA OCUPABA 166 px PEGADOS ARRIBA EN LAS 20 PANTALLAS DE LA APP —el 18 % del móvil—
  // y de eso una fila entera era el nombre de la app, que es la app en la que ya estás. Y llevaba
  // «Imprimir» y «JSON», que ya estaban en Ajustes → Datos y en la vista que se imprime: repetir
  // la misma función en tres sitios es lo que le hace perderse.
  // ===================================================================================
  {
    await page.setViewportSize({ width: 412, height: 915 });
    await gotoTab('month');
    await page.waitForTimeout(300);
    const cab = await page.evaluate(() => { const h = document.querySelector('header');
      return { alto: Math.round(h.getBoundingClientRect().height),
        pct: Math.round(h.getBoundingClientRect().height / window.innerHeight * 100),
        botones: h.querySelectorAll('button').length,
        imprimirArriba: !!h.querySelector('[data-a="print"]'),
        jsonArriba: !!h.querySelector('[data-a="export"]'),
        // el nombre sigue en el HTML (lo lee un lector de pantalla), solo que no se pinta
        nombreEnElHtml: /Guardias/.test(h.innerHTML),
        nombreVisible: (h.querySelector('h1 .hname') || {}).offsetWidth > 0,
        // las flechas de la barra siguen moviendo el mes
        flechas: !!h.querySelector('[data-a="wk-prev"]') && !!h.querySelector('[data-a="wk-next"]') }; });
    check('la cabecera cabe en 130 px y ya no lleva «Imprimir» ni «JSON», que están en su sitio',
      cab.alto <= 130 && cab.pct <= 15 && !cab.imprimirArriba && !cab.jsonArriba &&
      cab.nombreEnElHtml && !cab.nombreVisible && cab.flechas, JSON.stringify(cab));

    // imprimir no se ha perdido: está donde se imprime (Mes, para colgarlo en la pared)
    const donde = await page.evaluate(() => ({
      enElMes: !!document.querySelector('#main .mesnav [data-a="print"]'),
      // y las flechas de mes ya no se repiten dentro de la tarjeta
      flechasRepetidas: !!document.querySelector('#main [data-a="mon-prev"]'),
      saltarAOtroMes: !!document.querySelector('#main [data-a="mon-set"]') }));
    check('imprimir vive en el Mes, que es lo que se imprime, y las flechas no salen dos veces',
      donde.enElMes && !donde.flechasRepetidas && donde.saltarAOtroMes, JSON.stringify(donde));

    // y el JSON sigue entero en Ajustes → Datos: quitarlo de arriba no es quitarlo
    await gotoTab('data', 'copia');
    await page.waitForTimeout(300);
    const datos = await page.evaluate(() => ({
      descargar: !!document.querySelector('#main [data-a="export"]'),
      copiar: !!document.querySelector('#main [data-a="copy"]'),
      importar: !!document.querySelector('#main [data-a="import"]') }));
    check('el JSON sigue entero en Datos: bajarlo, copiarlo e importarlo',
      datos.descargar && datos.copiar && datos.importar, JSON.stringify(datos));
  }

  // 208) LA CIENCIA: rango de reps (doble progresión), semana de descarga, listo del día y series por músculo
  {
    const r = await page.evaluate(() => { const P = window.PG, g = P.gymS(), copia = JSON.parse(JSON.stringify(P.store));
      const hace = (n) => P.iso(P.addDays(new Date(), -n)), hoy = P.iso(new Date());
      g.rutinas = [{ id: 'r208', nombre: 'T208', dias: [], ejercicios: [{ ex: 'Press banca (barra)', series: 3, reps: 8, rmax: 12 }] }];
      g.registro = [0, 1, 2].map((i) => ({ id: 'b' + i, fecha: hace(3), ex: 'Press banca (barra)', kg: 70, reps: 10, rir: 2, ts: i }));
      g.sesiones = []; P.ui.gymSesionActiva = null;
      // 10 reps en un rango 8–12: repite peso (no sube hasta hacer 12 en todas)
      const a = P.progresionDe('Press banca (barra)', 3, 12, hoy);
      g.registro.forEach((x) => { x.reps = 12; });
      const b = P.progresionDe('Press banca (barra)', 3, 12, hoy);
      g.registro.forEach((x) => { x.rir = 0; });
      const c = P.progresionDe('Press banca (barra)', 3, 12, hoy);
      // descarga: mitad de series y −10 %
      g.registro.forEach((x) => { x.rir = 2; });
      g.bloqueDesde = P.iso(P.addDays(P.mondayOf(new Date()), -28)); g.descargaCada = 5;
      const bq = P.bloqueDe(hoy);
      P.empezarRutina('r208'); const f = P.sesionFilas(P.ui.gymSesionActiva)[0];
      const desc = { filas: f.filas.length, kg: f.filas[0].kg };
      P.ui.gymSesionActiva = null;
      // listo: 4 h de sueño
      P.suenoRealS()[hoy] = { h: 4, guardia: false };
      const l = P.listoDe(hoy);
      // series por músculo de la semana
      g.registro.push({ id: 'z1', fecha: hoy, ex: 'Press banca (barra)', kg: 70, reps: 8, ts: 9 }, { id: 'z2', fecha: hoy, ex: 'Press banca (barra)', kg: 70, reps: 8, ts: 10, t: 'c' });
      const sm = P.seriesMusculo(P.iso(P.mondayOf(new Date())));
      P.store = copia; P.save(); P.render();
      return { a: a.cl + a.kg, b: b.cl + b.kg, c: c.cl + c.kg, bq, desc, l: { v: l.v, rec: l.rec }, pecho: sm.pecho };
    });
    check('doble progresión: en el rango repite peso, al tope sin fallo sube, y al fallo no sube',
      r.a === 'mantiene70' && r.b === 'sube72.5' && r.c !== 'sube72.5', JSON.stringify(r));
    check('la semana de descarga propone la mitad de series y un 10 % menos',
      r.bq.descarga && r.desc.filas === 2 && r.desc.kg === 65, JSON.stringify(r));
    check('dormir 4 h baja el «listo» y pide versión corta; las series de calentamiento no cuentan por músculo',
      r.l.v < 60 && r.l.rec === 'corta' && r.pecho >= 1, JSON.stringify(r));
  }

  // ===================================================================================
  // EL MENÚ DE EJEMPLO, FUERA. La app arrancaba con un menú entero puesto —porridge, lentejas,
  // salmón AL HORNO— presentado como si fuera suyo. Y no tiene horno. O sea que le planificaba la
  // semana, la compra y las tandas de cocina con comida que no puede hacer, y eso salía repetido
  // en Mes, Semana, Hoy, Cocina y Compra: cinco pantallas diciendo lo mismo, y lo mismo era falso.
  // ===================================================================================
  {
    // 1) la migración: unos datos guardados SIN la marca se vacían al cargarlos, una vez
    const migra = await page.evaluate(() => { const P = window.PG;
      const guardado = JSON.stringify(P.store);
      const o = JSON.parse(JSON.stringify(P.store));
      delete o.meta.menuVaciado;
      // se le devuelve el ejemplo y se le añade un plato SUYO, que no se puede tocar
      const D = P.DEFAULTS();
      o.dishes = JSON.parse(JSON.stringify(D.dishes));
      o.meals = JSON.parse(JSON.stringify(D.meals));
      o.menu = JSON.parse(JSON.stringify(D.menu));
      o.dishes.push({ id: 'd-mio123', name: 'Lo que yo me hago', icon: '🍝', batchId: '', kcal: 500, prot: 30, portions: 1, ingredients: [], steps: [] });
      const antes = { platos: o.dishes.length, menus: o.meals.length,
        tomasConAlgo: Object.keys(o.menu).reduce((a, k) => a + o.menu[k].filter((s2) => s2.mealId || (s2.items || []).length).length, 0) };
      P.normalize(o);
      const tras = { marca: o.meta.menuVaciado === true, platos: o.dishes.length, menus: o.meals.length,
        tomas: Object.keys(o.menu).reduce((a, k) => a + o.menu[k].length, 0),
        tomasConAlgo: Object.keys(o.menu).reduce((a, k) => a + o.menu[k].filter((s2) => s2.mealId || (s2.items || []).length).length, 0),
        // las HORAS de cada toma son suyas y se quedan
        horas: Object.keys(o.menu).reduce((a, k) => a + o.menu[k].filter((s2) => !!s2.time).length, 0),
        mioSigue: o.dishes.some((d) => d.id === 'd-mio123'),
        salmonFuera: !o.dishes.some((d) => /al horno/i.test(d.name)) };
      // y no se vuelve a vaciar: la marca ya está
      o.dishes.push({ id: 'd-mio456', name: 'Otro mío', icon: '🍲', batchId: '', kcal: 1, prot: 1, portions: 1, ingredients: [], steps: [] });
      o.menu[Object.keys(o.menu)[0]][0].items = [{ kind: 'dish', id: 'd-mio456', portions: 1 }];
      P.normalize(o);
      const segunda = { platos: o.dishes.length,
        siguePuesto: (o.menu[Object.keys(o.menu)[0]][0].items || []).length === 1 };
      P.store = JSON.parse(guardado);
      return { antes, tras, segunda }; });
    check('unos datos con el menú de ejemplo se vacían UNA vez al cargarlos, sin tocar lo tuyo',
      migra.antes.tomasConAlgo > 0 && migra.tras.marca && migra.tras.tomasConAlgo === 0 &&
      migra.tras.tomas === migra.tras.horas && migra.tras.tomas > 0 &&
      migra.tras.mioSigue && migra.tras.salmonFuera && migra.tras.platos === 1 && migra.tras.menus === 0,
      JSON.stringify(migra));
    check('con la marca puesta ya no se vuelve a vaciar nada',
      migra.segunda.platos === 2 && migra.segunda.siguePuesto, JSON.stringify(migra.segunda));

    // 2) y se puede volver a vaciar a mano desde «Menú», conduciendo la pantalla
    await gotoTab('types');
    await page.evaluate(() => { const P = window.PG; P.ui.typesVista = 'montar'; P.render(); });  // Menú v2 está en «Más formas de montar»
    await page.waitForTimeout(250);
    await page.evaluate(() => { const P = window.PG, D = P.DEFAULTS();
      P.store.dishes = JSON.parse(JSON.stringify(D.dishes));
      P.store.meals = JSON.parse(JSON.stringify(D.meals));
      P.store.menu = JSON.parse(JSON.stringify(D.menu));
      P.store.dishes.push({ id: 'd-mio789', name: 'Mío de verdad', icon: '🥗', batchId: '', kcal: 1, prot: 1, portions: 1, ingredients: [], steps: [] });
      P.save(); P.render(); });
    await page.waitForTimeout(300);
    await page.click('#main [data-a="menu-vaciar"]');
    await page.waitForTimeout(250);
    await page.click('#modal [data-a="confirm-yes"]');
    await page.waitForTimeout(350);
    const aMano = await page.evaluate(() => { const P = window.PG;
      return { platos: P.store.dishes.length, mioSigue: P.store.dishes.some((d) => d.id === 'd-mio789'),
        conAlgo: Object.keys(P.store.menu).reduce((a, k) => a + P.store.menu[k].filter((s2) => s2.mealId || (s2.items || []).length).length, 0),
        // y aguanta recargar: normalize() tira lo que no reconoce
        trasRecargar: (function(){ P.store = JSON.parse(JSON.stringify(P.store));
          return Object.keys(P.store.menu).reduce((a, k) => a + P.store.menu[k].filter((s2) => s2.mealId || (s2.items || []).length).length, 0); })() }; });
    check('«vaciar el menú» deja las tomas sin nada puesto y respeta los platos que creaste tú',
      aMano.conAlgo === 0 && aMano.trasRecargar === 0 && aMano.platos === 1 && aMano.mioSigue,
      JSON.stringify(aMano));
    await page.evaluate(() => window.PG.render());
    await page.waitForTimeout(200);
  }

  // 209) OBJETIVOS con ritmo y fecha, SUPLEMENTOS que se marcan en Hoy y el ENTRENO en el informe del lunes
  {
    const r = await page.evaluate(() => { const P = window.PG, g = P.gymS(), copia = JSON.parse(JSON.stringify(P.store));
      const hace = (n) => P.iso(P.addDays(new Date(), -n)), hoy = P.iso(new Date());
      g.rutinas = [{ id: 'r209', nombre: 'T209', dias: [], ejercicios: [{ ex: 'Press banca (barra)', series: 3, reps: 8 }] }];
      g.registro = []; g.sesiones = []; g.objetivos = []; g.sups = []; g.supLog = {};
      for (let w = 7; w >= 1; w--) { const f = hace(w * 7); g.registro.push({ id: 'o' + w, fecha: f, ex: 'Press banca (barra)', kg: 60 + (7 - w) * 2.5, reps: 8, ts: w });
        g.sesiones.push({ id: 's' + w, rutinaId: 'r209', fecha: f, duracionMin: 60, rpe: 7, carga: 420 }); }
      P.nuevoObjetivo('fuerza', 'Press banca (barra)', 100, P.iso(P.addDays(new Date(), 14)));
      P.nuevoObjetivo('minutos', '', 150);
      P.ui.tab = 'gym'; P.ui.gymPanel = 'objetivos'; P.render();
      const txt = document.getElementById('main').innerText;
      // suplementos: se añaden, salen en Hoy y se marcan
      P.ui.gymPanel = 'sup'; P.render();
      const bot = document.querySelector('[data-a="sup-add"][data-p="creatina"]'); if (bot) bot.click();
      P.ui.tab = 'hoy'; P.ui.hoyVista = ''; P.ui.diaHoy = ''; P.render();
      const enHoy = document.querySelector('.gsuph [data-a="sup-tomar"]'); if (enHoy) enHoy.click();
      const tomado = g.supLog[hoy] && g.supLog[hoy].length === 1;
      // informe de la semana pasada con la parte de entreno
      P.ui.hoyVista = 'informe'; P.ui.infLun = ''; P.render();
      const inf = document.querySelector('.infent');
      const out = { lento: /LENTO/.test(txt), ritmo: /\+2,5 kg\/sem|llevas \+2,5/.test(txt), minutos: /150 min de entreno por semana/.test(txt),
        creatina: !!bot && !!enHoy, tomado, informe: !!inf, recs: inf ? inf.querySelectorAll('.rec').length : 0, carga: inf ? /Carga/.test(inf.innerText) : false };
      P.store = copia; P.save(); P.ui.hoyVista = ''; P.ui.tab = 'gym'; P.ui.gymPanel = ''; P.render();
      return out; });
    check('los objetivos dicen tu ritmo real y si llegas a la fecha; hay objetivo de minutos por semana',
      r.lento && r.ritmo && r.minutos, JSON.stringify(r));
    check('un suplemento se añade con un toque, sale en Hoy y se marca como tomado',
      r.creatina && r.tomado, JSON.stringify(r));
    check('el informe de la semana trae el entreno: carga, músculos y qué cambiar la semana que viene',
      r.informe && r.carga && r.recs >= 1, JSON.stringify(r));
  }

  // ===================================================================================
  // EL DÍA SE CUENTA EN UN SITIO. El mismo día se leía ENTERO en tres pantallas: al tocarlo en Mes,
  // al desplegarlo en Semana y en «Hoy» —cada una con su propio código, con las tres comidas, sus
  // kcal, sus gramos de proteína, el menú del que salen y la tanda de cocina—. «Hoy» ya es la
  // pantalla del día y sabe ir a cualquier fecha, así que Mes y Semana dan la línea y la puerta.
  // ===================================================================================
  {
    await page.setViewportSize({ width: 412, height: 915 });
    // con el menú de ejemplo puesto, que es cuando el día tiene comidas que contar
    await page.evaluate(() => { const P = window.PG, D = P.DEFAULTS();
      P.store.dishes = JSON.parse(JSON.stringify(D.dishes));
      P.store.meals = JSON.parse(JSON.stringify(D.meals));
      P.store.menu = JSON.parse(JSON.stringify(D.menu));
      P.store.rotation.mode = 'date'; P.store.rotation.anchorSet = true; P.save(); });
    await gotoTab('month');
    await page.click('[data-a="mon-today"]');
    await page.waitForTimeout(350);
    await page.click('#main .dbox:not(.semprev)');
    await page.waitForTimeout(400);
    const mes = await page.evaluate(() => { const p = document.querySelector('.daydetail');
      return { hay: !!p, alto: p ? Math.round(p.getBoundingClientRect().height) : 0,
        // las tres comidas enteras ya NO se repiten aquí
        // ojo: «.meal» también lo llevan los puntitos de la franja (<i class="tl-dot meal">);
        // la fila de una comida es un <div class="meal">
        comidasEnteras: p ? p.querySelectorAll('div.meal').length : -1,
        resumen: !!(p && p.querySelector('.diares')),
        // pero las horas a las que comes sí se ven, que es lo del día que se mira en el mes
        conHoras: p ? /\d{1,2}:\d{2}/.test((p.querySelector('.diares .h') || {}).innerText || '') : false,
        puerta: !!(p && p.querySelector('.diares [data-a="sem-dia"]')) }; });
    check('el Mes ya no repinta las tres comidas del día: da las horas, las cifras y la puerta',
      mes.hay && mes.comidasEnteras === 0 && mes.resumen && mes.conHoras && mes.puerta && mes.alto < 520,
      JSON.stringify(mes));

    // y la puerta lleva de verdad a «Hoy» en ESE día
    const destino = await page.evaluate(() => (document.querySelector('.diares [data-a="sem-dia"]') || {}).dataset.k);
    await page.click('.diares [data-a="sem-dia"]');
    await page.waitForTimeout(450);
    const llega = await page.evaluate(() => ({ tab: window.PG.ui.tab, dia: window.PG.ui.diaHoy,
      comidas: document.querySelectorAll('#main div.meal').length }));
    check('«ver el día entero» lleva a «Hoy» en ese día, que es donde las comidas se cuentan enteras',
      llega.tab === 'hoy' && (llega.dia === destino || (!llega.dia && destino)) && llega.comidas >= 1,
      JSON.stringify({ destino, llega }));

    // lo mismo en Semana: abrir un día no vuelve a pintar las comidas
    await gotoTab('week');
    await page.waitForTimeout(350);
    await page.click('#main .drow .drmain');
    await page.waitForTimeout(400);
    const sem = await page.evaluate(() => { const p = document.querySelector('#main .drow.open');
      return { hay: !!p, alto: p ? Math.round(p.getBoundingClientRect().height) : 0,
        comidasEnteras: p ? p.querySelectorAll('div.meal').length : -1,
        resumen: !!(p && p.querySelector('.diares')),
        botones: p ? p.querySelectorAll('.drdet button').length : -1 }; });
    check('en Semana, abrir un día tampoco repinta las comidas: la línea, la puerta y qué día es',
      sem.hay && sem.comidasEnteras === 0 && sem.resumen && sem.alto < 400 && sem.botones <= 3,
      JSON.stringify(sem));
    await page.evaluate(() => window.PG.render());
    await page.waitForTimeout(200);
  }

  // 210) PLAN DESDE LA ROTACIÓN, PISCINA POR SERIES y el LLORETAZO como sesión de agua
  {
    const r = await page.evaluate(() => { const P = window.PG, g = P.gymS(), copia = JSON.parse(JSON.stringify(P.store));
      g.rutinas = []; g.registro = []; g.sesiones = []; g.minSemana = 0; P.ui.gymSesionActiva = null;
      P.ui.tab = 'gym'; P.ui.gymPanel = 'plannuevo'; P.ui.planN = null; P.render();
      const hayTpl = document.querySelectorAll('#main [data-a="plan-tpl"]').length;
      const mat = document.querySelector('[data-a="plan-mat"][data-v="barra"]'); if (mat) mat.click();
      const tp = document.querySelector('[data-a="plan-tpl"][data-v="tp"]'); if (tp) tp.click();
      const crear = document.querySelector('[data-a="plan-crear"]'); if (crear) crear.click();
      const nombres = g.rutinas.map((x) => x.nombre).join(',');
      const sinBarra = !g.rutinas.some((x) => x.ejercicios.some((e) => /\(barra\)/.test(e.ex)));
      const rango = g.rutinas[0] && g.rutinas[0].ejercicios[0] ? g.rutinas[0].ejercicios[0].reps + '-' + g.rutinas[0].ejercicios[0].rmax : '';
      // piscina: tiempo por serie y ritmo por 100 m
      const agua = P.planAgua(); P.empezarRutina(agua.id);
      P.cerrarSesionCore; const sa = P.ui.gymSesionActiva;
      const plan = P.sesionFilas(sa); const tec = plan[1];
      sa.ix = 1; P.render();
      const inp = document.querySelector('tr.act input[data-k="seg"]'); if (inp) { inp.value = '55'; inp.dispatchEvent(new Event('change', { bubbles: true })); }
      const ok = document.querySelector('tr.act [data-a="gv-ok"]'); if (ok) ok.click();
      const reg = P.store.gym.registro.filter((x) => x.sesionId === sa.id)[0] || {};
      P.ui.gymSesionActiva = null;
      // Lloretazo: NO es nadar (es ir a la playa a fumar): se marca el día pero no cuenta como entreno
      const k = P.iso(P.addDays(P.mondayOf(new Date()), 5));
      P.store.eventos.push({ id: 'll210', titulo: '🌊 Lloretazo', hora: '20:00', fin: '22:10', modo: 'fecha', fecha: k, on: true, lloret: true });
      P.render();
      const s = P.entrenoSemana(k), d = s.dias.filter((x) => x.k === k)[0];
      const sin = (() => { P.store.eventos = P.store.eventos.filter((e) => e.id !== 'll210'); return P.entrenoSemana(k).total; })();
      const out = { hayTpl, nombres, sinBarra, rango, tec: tec ? tec.total : 0, reg: reg.m + '/' + reg.seg, lloret: !!(d && d.lloret), total: s.total, sin };
      P.store = copia; P.save(); P.ui.gymPanel = ''; P.render();
      return out; });
    check('un plan se crea desde tus días reales: plantillas, material (sin barra → mancuernas) y rango de reps del objetivo',
      r.hayTpl === 4 && r.nombres === 'Torso A,Pierna A,Torso B,Pierna B' && r.sinBarra && r.rango === '8-12', JSON.stringify(r));
    check('la piscina va por series con metros y tiempo; el Lloretazo se marca en el día pero no cuenta como entreno',
      r.tec === 8 && r.reg === '50/55' && r.lloret && r.total === r.sin, JSON.stringify(r));
  }


  // ===================================================================================
  // 1 · UN TEMA AL AZAR, GUARDABLE (MÁXIMO 5) Y BORRABLE. Al azar no es a lo loco: un tema que no
  // se lee no es un tema, así que el generador COMPRUEBA el contraste con la misma función que ya
  // usa la app. Y como el que sale no está guardado, darle otra vez al dado lo pierde: por eso hay
  // «guárdalo». Se conduce la pantalla, no las funciones.
  // ===================================================================================
  {
    // 1) el generador: 40 tiradas y ninguna se cae por debajo del contraste
    const gen = await page.evaluate(() => { const P = window.PG;
      let n = 0, peorTexto = 99, peorApagado = 99, peorAcento = 99, claros = 0, fallos = 0;
      for (let i = 0; i < 40; i++) {
        const t = P.temaAzar();
        if (!t) { fallos++; continue; }
        n++;
        if (t.modo === 'light') claros++;
        peorTexto = Math.min(peorTexto, P.contraste(t.v.ink, t.v.bg));
        peorApagado = Math.min(peorApagado, P.contraste(t.v.ink2, t.v.bg));
        ['brand', 'brand2', 'accent'].forEach((k) => { peorAcento = Math.min(peorAcento, P.contraste(t.v[k], t.v.bg)); });
        ['sleep', 'work', 'guard', 'meal', 'gym', 'evt'].forEach((k) => { peorAcento = Math.min(peorAcento, P.contraste(t.f[k], t.v.bg)); });
      }
      return { n, fallos, peorTexto: Math.round(peorTexto * 10) / 10,
        peorApagado: Math.round(peorApagado * 10) / 10, peorAcento: Math.round(peorAcento * 10) / 10, claros }; });
    check('un tema al azar siempre se lee: 40 tiradas y ninguna baja del contraste mínimo',
      gen.n >= 38 && gen.peorTexto >= 7 && gen.peorApagado >= 4.5 && gen.peorAcento >= 3 &&
      gen.claros >= 1 && gen.claros < gen.n,
      JSON.stringify(gen));

    // 2) la cadena entera desde la pantalla: dado → guardar → dado otra vez → volver al guardado
    await gotoTab('ajustes', 'aspecto');
    await page.waitForTimeout(300);
    await page.click('#main [data-a="tema-azar"]');
    await page.waitForTimeout(350);
    const tras1 = await page.evaluate(() => ({
      propio: !!(window.PG.store.tema || {}).propio,
      preset: (window.PG.store.tema || {}).preset,
      fondo: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
      avisa: /no est\u00e1 guardado/.test(document.querySelector('#main').innerText),
      botonGuardar: !!document.querySelector('#main [data-a="tema-guardar"]') }));
    check('el dado pone un tema nuevo, cambia el fondo de verdad y avisa de que no está guardado',
      tras1.propio && !tras1.preset && /^#[0-9a-f]{6}$/i.test(tras1.fondo) &&
      tras1.avisa && tras1.botonGuardar, JSON.stringify(tras1));

    // se guarda, y el fondo NO cambia por guardarlo
    const antesDeGuardar = tras1.fondo;
    await page.click('#main [data-a="tema-guardar"]');
    await page.waitForTimeout(250);
    await page.fill('#temaNom', 'El morado');
    await page.click('#modal [data-a="m-save"]');
    await page.waitForTimeout(400);
    const guardado = await page.evaluate(() => ({
      cuantos: ((window.PG.store.tema || {}).guardados || []).length,
      nombre: (((window.PG.store.tema || {}).guardados || [])[0] || {}).nombre,
      esElPuesto: (window.PG.store.tema || {}).preset === (((window.PG.store.tema || {}).guardados || [])[0] || {}).id,
      fondo: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
      // aguanta recargar: normalize() tira lo que no reconoce
      trasRecargar: (function () { const P = window.PG; P.store = JSON.parse(JSON.stringify(P.store));
        return ((P.store.tema || {}).guardados || []).length; })() }));
    check('«guárdalo» lo mete en tus temas sin cambiar el aspecto, y aguanta recargar',
      guardado.cuantos === 1 && guardado.nombre === 'El morado' && guardado.esElPuesto &&
      guardado.fondo === antesDeGuardar && guardado.trasRecargar === 1, JSON.stringify(guardado));

    // 3) el tope de 5: el sexto se rechaza diciendo por qué, sin perder ninguno
    const tope = await page.evaluate(() => { const P = window.PG;
      const msgs = [];
      for (let i = 0; i < 6; i++) { P.ponerTemaPropio(P.temaAzar()); msgs.push(P.guardarTemaActual('T' + i)); }
      return { cuantos: (P.store.tema.guardados || []).length, ultimo: msgs[msgs.length - 1] }; });
    check('caben 5 temas tuyos; el sexto se rechaza diciendo por qué y no borra ninguno',
      tope.cuantos === 5 && /5/.test(tope.ultimo) && /borra/.test(tope.ultimo), JSON.stringify(tope));

    // 4) borrar uno, desde la pantalla, con su confirmación
    await page.evaluate(() => window.PG.render());
    await page.waitForTimeout(300);
    const antesBorrar = await page.evaluate(() => ({
      cuantos: window.PG.store.tema.guardados.length,
      fichas: document.querySelectorAll('#main [data-a="tema-borrar"]').length,
      // la × no puede estar encima del botón de ponerlo: tocarlo para probarlo lo borraría
      separados: document.querySelectorAll('#main .tema > .tmio').length }));
    await page.click('#main [data-a="tema-borrar"]');
    await page.waitForTimeout(250);
    await page.click('#modal [data-a="confirm-yes"]');
    await page.waitForTimeout(400);
    const trasBorrar = await page.evaluate(() => ({
      cuantos: window.PG.store.tema.guardados.length,
      fondo: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() }));
    check('se borra un tema guardado, con confirmación, y los cinco tienen su × aparte del botón',
      antesBorrar.cuantos === 5 && antesBorrar.fichas === 5 && antesBorrar.separados === 5 &&
      trasBorrar.cuantos === 4 && /^#[0-9a-f]{6}$/i.test(trasBorrar.fondo),
      JSON.stringify({ antesBorrar, trasBorrar }));

    // y los cinco de la app siguen funcionando después de todo esto
    await page.click('#main [data-a="tema-pre"][data-id="papel"]');
    await page.waitForTimeout(350);
    const vuelta = await page.evaluate(() => ({ preset: window.PG.store.tema.preset,
      propio: !!window.PG.store.tema.propio,
      claro: !document.documentElement.classList.contains('dark'),
      guardados: window.PG.store.tema.guardados.length }));
    check('los cinco temas de la app siguen yendo, y los tuyos no se pierden al cambiar de tema',
      vuelta.preset === 'papel' && !vuelta.propio && vuelta.claro && vuelta.guardados === 4,
      JSON.stringify(vuelta));

    await page.evaluate(() => { const P = window.PG;
      P.store.tema = { brand: '', brand2: '', ink: '', preset: 'hud', propio: null, guardados: [] };
      P.aplicarTema ? P.aplicarTema() : P.ponerTema('hud'); P.save(); P.render(); });
    await page.waitForTimeout(250);
  }

  // 211) SALTOS DE PESO SEGÚN EL EJERCICIO, CARGA REAL DE LA CALISTENIA, SECUNDARIOS A MEDIAS Y 44 px PARA EL DEDO
  {
    const r = await page.evaluate(() => { const P = window.PG, g = P.gymS(), copia = JSON.parse(JSON.stringify(P.store));
      const hoy = P.iso(new Date()), hace = (n) => P.iso(P.addDays(new Date(), -n));
      P.store.perfil.pesoKg = 72;
      g.registro = [];
      [0, 1, 2].forEach((i) => g.registro.push({ id: 'l' + i, fecha: hace(3), ex: 'Elevaciones laterales', kg: 8, reps: 12, ts: i }));
      [0, 1, 2].forEach((i) => g.registro.push({ id: 'b' + i, fecha: hoy, ex: 'Press banca (barra)', kg: 70, reps: 8, ts: 10 + i }));
      const lat = P.progresionDe('Elevaciones laterales', 3, 12, hoy);
      const dom = P.cargaSerie({ ex: 'Dominadas', kg: 5, reps: 8 }), flex = P.volSerie({ ex: 'Flexiones', kg: 0, reps: 10 });
      const sm = P.seriesMusculo(P.iso(P.mondayOf(new Date())));
      // 44 px: la pantalla de entrenar y el editor
      g.rutinas = [{ id: 'r211', nombre: 'R211', dias: [], ejercicios: [{ ex: 'Sentadilla (barra)', series: 3, reps: 8 }, { ex: 'Dominadas', series: 3, reps: 6 }] }];
      P.ui.gymSesionActiva = null; P.ui.tab = 'gym'; P.empezarRutina('r211');
      const peq = (sel) => [...document.querySelectorAll(sel)].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.height && (b.height < 43.5 || b.width < 43.5); }).length;
      const vivo = peq('#main button, #main input');
      P.ui.gymSesionActiva = null; P.ui.gymRutSel = 'r211'; P.ui.gymPanel = 'rutedit'; P.ui.rtAbierto = 0; P.render();
      const editor = peq('#main button, #main input');
      P.store = copia; P.save(); P.ui.gymPanel = ''; P.render();
      return { lat: lat.kg, dom, flex, pecho: sm.pecho, triceps: sm.triceps, vivo, editor }; });
    check('los ejercicios de aislamiento suben 1 kg (no 2,5) y la calistenia cuenta tu peso',
      r.lat === 9 && r.dom === 77 && r.flex > 0, JSON.stringify(r));
    check('en las series por músculo el principal cuenta 1 y los que ayudan 0,5',
      r.pecho === 3 && r.triceps === 1.5, JSON.stringify(r));
    check('entrenando y en el editor todo lo que se toca mide al menos 44 px', r.vivo === 0 && r.editor === 0, JSON.stringify(r));
  }

  // 212) AVISOS (descanso con la pantalla apagada y «hoy toca»), MODO SENCILLO, «✓ TODAS», COPIAS EN EL MÓVIL y LIBRAS
  {
    const r = await page.evaluate(async () => { const P = window.PG, g = P.gymS(), copia = JSON.parse(JSON.stringify(P.store));
      const hoy = P.iso(new Date()), msgs = [];
      // el navegador de pruebas no da permisos: se simula el permiso y se escucha lo que la app manda al service worker
      const NotifReal = window.Notification;
      window.Notification = function () {}; window.Notification.permission = 'granted'; window.Notification.requestPermission = () => Promise.resolve('granted');
      try { Object.defineProperty(navigator.serviceWorker, 'controller', { configurable: true, get: () => ({ postMessage: (m) => msgs.push(m) }) }); } catch (e) {}
      g.rutinas = [{ id: 'r212', nombre: 'R212', dias: [], descanso: 90, ejercicios: [{ ex: 'Sentadilla (barra)', series: 3, reps: 5, pesoObjetivo: 100 }, { ex: 'Remo con barra', series: 2, reps: 8 }] }];
      g.registro = []; g.sesiones = []; g.modo = 'completo'; g.avisos = { on: false, antes: 30 }; P.ui.gymSesionActiva = null;
      P.ui.tab = 'gym'; P.ui.gymPanel = 'plan'; P.render();
      const bot = document.querySelector('#main [data-a="avisos-on"]'); if (bot) bot.click();
      await new Promise((ok) => setTimeout(ok, 50));
      const activos = g.avisos.on === true;
      // descanso: al marcar una serie se manda al service worker con los segundos de la rutina; saltar lo cancela
      P.empezarRutina('r212'); P.marcarSerie(0, 0);
      const desc = msgs.filter((m) => m.tipo === 'descanso').pop();
      const salt = document.querySelector('#main [data-a="gv-saltar"]'); if (salt) salt.click();
      const cancel = msgs.some((m) => m.tipo === 'descanso-cancel');
      // «✓ todas como están»: las que quedan del ejercicio de una vez
      const todas = document.querySelector('#main [data-a="gv-todas"]'); if (todas) todas.click();
      const fil = P.sesionFilas(P.ui.gymSesionActiva)[0];
      const todasHechas = fil.filas.every((f) => f.hecha), pasa = P.ui.gymSesionActiva.ix === 1;
      // «hoy toca»: con el entreno dentro de la ventana de aviso, sale el aviso una vez
      P.ui.gymSesionActiva = null; P.setDayOverride(hoy, 'sh-l', ''); g.forzar = {}; g.forzar[hoy] = true;
      const d = new Date(); g.hora = P.hm(d.getHours() * 60 + d.getMinutes() + 10); g.avisos.hecho = ''; P.render();
      P.programarAvisoHoy();
      const hoyToca = msgs.some((m) => m.tipo === 'aviso' && /Hoy toca/.test(m.titulo));
      // modo sencillo: sin las cifras de la semana ni «cuántas te quedaban»
      g.modo = 'sencillo'; P.ui.gymPanel = ''; P.render();
      const kpiS = !!document.querySelector('#main .gkpi');
      P.empezarRutina('r212'); const rirS = !!document.querySelector('#main .grir');
      g.modo = 'completo'; P.render(); const rirC = !!document.querySelector('#main .grir');
      // libras: se ve y se escribe en libras, se guarda en kilos
      g.unidad = 'lb'; P.render();
      const inp = document.querySelector('#main tr.act input[data-k="kg"]'); const verLb = inp ? inp.value : '';
      if (inp) { inp.value = '225'; inp.dispatchEvent(new Event('change', { bubbles: true })); }
      const ok = document.querySelector('#main tr.act [data-a="gv-ok"]'); if (ok) ok.click();
      const ult = P.store.gym.registro[P.store.gym.registro.length - 1];
      const cab = (document.querySelector('#main .gtb.vivo th:nth-child(3)') || { textContent: '' }).textContent;
      // copias en el móvil: se guarda una y aparece en la lista
      await P.copiasGuardar('prueba');
      const l = await P.copiasLista();
      window.Notification = NotifReal; try { delete navigator.serviceWorker.controller; } catch (e) {}
      P.store = copia; P.save(); P.ui.gymSesionActiva = null; P.ui.gymPanel = ''; P.render();
      return { activos, desc: desc ? desc.ms : null, cancel, todasHechas, pasa, hoyToca, kpiS, rirS, rirC, verLb, kg: ult ? ult.kg : null, cab, copias: l.some((x) => /prueba/.test(x.k)) };
    });
    check('avisos: el descanso se manda al service worker con los segundos de la rutina, saltar lo cancela y «hoy toca» avisa antes de entrenar',
      r.activos && r.desc === 90000 && r.cancel && r.hoyToca, JSON.stringify(r));
    check('«✓ todas como están» marca las series que quedan y pasa al siguiente ejercicio', r.todasHechas && r.pasa, JSON.stringify(r));
    check('modo sencillo: sin cifras de la semana ni RIR; en completo, sí', !r.kpiS && !r.rirS && r.rirC, JSON.stringify(r));
    check('en libras se ve y se escribe en libras y se guarda en kilos', r.verLb === '220,5' && Math.abs(r.kg - 102.06) < 0.05 && /LB/.test(r.cab), JSON.stringify(r));
    check('las copias automáticas se guardan en el móvil y se listan', r.copias, JSON.stringify(r));
  }

  // 213) LOS FALLOS DEL LUNES, encadenados por «Mes» y la portada de Entreno. Salieron al lanzar la
  // suite un lunes y se arreglaron sin prueba propia:
  //  · una rutina pegada al tipo «Guardia» desaparecía de la tarjeta grande el día que ponías la
  //    guardia; ahora sale con «PERO ESTÁS DE GUARDIA» para que decidas moverla;
  //  · el día siguiente, saliente con una rutina pegada A PROPÓSITO al tipo «Saliente», el plan lo
  //    daba por piscina; ahora cuenta como fuerza;
  //  · una guardia puesta sin repintar (lo que hace el puente de Claude) no llevaba su saliente a
  //    Google: la memoria «por pintado» de salidaDeGuardia() seguía con lo de antes.
  {
    const r = await page.evaluate(() => { const P = window.PG, g = P.gymS(), copia = JSON.parse(JSON.stringify(P.store));
      const d = (n) => P.iso(P.addDays(new Date(), n));
      const K = d(14), K1 = d(15), K5 = d(18), K6 = d(19);
      const clic = (sel) => { const b = document.querySelector(sel); if (b) b.click(); return !!b; };
      g.rutinas = [
        { id: 'r213g', nombre: 'R213 guardia', dias: ['sh-g'], ejercicios: [{ ex: 'Sentadilla (barra)', series: 3, reps: 5 }] },
        { id: 'r213s', nombre: 'R213 saliente', dias: ['sh-s'], ejercicios: [{ ex: 'Remo con barra', series: 3, reps: 8 }] }];
      g.forzar = {}; g.cambios = {}; P.ui.gymSesionActiva = null;
      [K, K1, K5, K6].forEach((k) => P.setDayOverride(k, 'sh-t', ''));
      P.save();
      // 1) en «Mes»: el día K de guardia y el siguiente de saliente, pulsando los botones del panel
      P.ui.tab = 'month'; P.ui.monSel = K; P.render();
      const puesG = clic('#main [data-a="day-set"][data-key="' + K + '"][data-sid="sh-g"]');
      P.ui.monSel = K1; P.render();
      const puesS = clic('#main [data-a="day-set"][data-key="' + K1 + '"][data-sid="sh-s"]');
      // 2) a Entreno, mirando ese día: la rutina de guardia sigue ahí, con el choque dicho
      P.ui.tab = 'gym'; P.ui.gymPanel = ''; P.ui.gymDate = K; P.render();
      const heroG = (document.querySelector('#main .ghero2') || { textContent: '' }).textContent;
      // 3) el saliente con su rutina pegada: fuerza en la semana y en la tarjeta grande
      const diaS = (P.entrenoSemana(K1).dias.filter((x) => x.k === K1)[0] || {});
      P.ui.gymDate = K1; P.render();
      const heroS = (document.querySelector('#main .ghero2') || { textContent: '' }).textContent;
      // y la semana no lo marca como choque ni ofrece «moverla»: la pusiste ahí tú
      const circS = (document.querySelector('#main .gsc[data-key="' + K1 + '"]') || { className: 'NO' }).className;
      const avisos = Array.from(document.querySelectorAll('#main .gaviso')).map((x) => x.textContent).join(' | ');
      // 4) sin repintar: se pregunta por K6 (se memoriza «no hay salida»), se pone guardia en K5 y se
      //    exporta. El saliente de K6 tiene que ir a Google
      const antes = P.salidaDeGuardia(K6);
      P.setDayOverride(K5, 'sh-g', ''); P.save();
      const salK6 = P.calEventos(K6, K6).some((e) => /Saliente/.test(e.summ || ''));
      P.store = copia; P.save(); P.ui.gymDate = null; P.ui.tab = 'gym'; P.render();
      return { puesG, puesS, heroG: heroG.slice(0, 160), diaS: diaS.tipo, heroS: heroS.slice(0, 160), circS, avisos: avisos.slice(0, 200), antes: !!antes, salK6 };
    });
    check('Mes → Entreno: poner guardia en un día con rutina pegada a «Guardia» la deja en la tarjeta grande con «pero estás de guardia»',
      r.puesG && /R213 guardia/.test(r.heroG) && /PERO ESTÁS DE GUARDIA/i.test(r.heroG), JSON.stringify(r));
    check('una rutina pegada a propósito al tipo «Saliente» hace de ese día fuerza (no piscina) y sale en la tarjeta grande',
      r.puesS && r.diaS === 'fuerza' && /R213 saliente/.test(r.heroS), JSON.stringify(r));
    check('la rutina pegada a propósito al saliente no se marca como choque ni se ofrece moverla',
      r.circS !== 'NO' && !/choque/.test(r.circS) && !/de saliente/.test(r.avisos), JSON.stringify(r));
    check('una guardia puesta sin repintar lleva su saliente a Google aunque antes se hubiera preguntado por ese día',
      !r.antes && r.salK6, JSON.stringify(r));
  }

  // 214) MANTENER PULSADO UN DÍA DEL MES, encadenado por la interfaz: toque corto (panel de siempre) →
  // mantener (hoja) → guardia desde la hoja → evento sin Google → «ya hay» → pincel a otro día →
  // deshacer → listo. Fija tres fallos que salieron al construirla:
  //  · la hoja vivía dentro de #main y el pie de la app (#foot) se le ponía encima del «Guardar»;
  //  · el primer toque DENTRO de la hoja justo después de abrirla se lo comía el filtro del clic
  //    fantasma (el que cae al soltar el dedo);
  //  · el campo nuevo «google» se perdía al recargar si no se daba de alta en normalize().
  {
    const prep = await page.evaluate(() => { const P = window.PG;
      window.__copia214 = JSON.parse(JSON.stringify(P.store));
      const d = (n) => P.iso(P.addDays(new Date(), n));
      const K = d(3), K2 = d(9);
      P.setDayOverride(K, 'sh-t', ''); P.setDayOverride(K2, 'sh-t', ''); P.setDayOverride(d(10), 'sh-t', '');
      P.store.meta.pulsarMs = 600; P.ui.hojaDia = ''; P.ui.mesModo = null; P.ui.monSel = '';
      P.ui.tab = 'month'; P.save(); P.render(); return { K, K2 }; });
    const K = prep.K, K2 = prep.K2;
    const celda = async (k) => { const el = await page.$(`#main .dbox[data-key="${k}"]`); if (!el) return null;
      await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(80); return el.boundingBox(); };
    const mantener = async (k, ms) => { const bx = await celda(k); if (!bx) return false;
      await page.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2); await page.mouse.down();
      await page.waitForTimeout(ms); await page.mouse.up(); await page.waitForTimeout(60); return true; };
    // si sin el arreglo el botón queda TAPADO, el clic tiene que fallar y decirlo, no esperar 30 s y tumbar la suite
    const clic = async (sel) => { const el = await page.$(sel); if (!el) return false;
      try { await el.click({ timeout: 2500 }); } catch (e) { return false; } await page.waitForTimeout(80); return true; };
    // 1) toque corto: el panel de siempre, sin hoja
    const bx0 = await celda(K); if (bx0) { await page.mouse.click(bx0.x + bx0.width / 2, bx0.y + bx0.height / 2); await page.waitForTimeout(120); }
    const corto = await page.evaluate(() => ({ sel: window.PG.ui.monSel, hoja: !!document.querySelector('.hoja') }));
    // 2) soltar antes de tiempo no abre; mantener sí
    await mantener(K, 250);
    const antesDeTiempo = await page.evaluate(() => !!document.querySelector('.hoja'));
    await mantener(K, 750);
    const abierta = await page.evaluate(() => !!document.querySelector('.hoja'));
    // 3) guardia desde la hoja, sin esperar (el primer toque dentro NO se come)
    const g = await clic('.hoja .hchip.gd');
    const guardia = await page.evaluate((K) => ({ tipo: window.PG.dayInfo(K).shiftId, sigue: !!document.querySelector('.hoja') }), K);
    // 4) evento sin Google: el «Guardar» se ve y se puede pulsar (antes lo tapaba el pie)
    await clic('.hoja [data-a="hoja-vista"][data-v="evento"]');
    await page.evaluate(() => { const t = document.getElementById('hjTit'), h = document.getElementById('hjHora');
      if (t) t.value = 'Revisión 214'; if (h) h.value = '10:00'; });
    await page.evaluate(() => { const c = document.getElementById('hjGoo'); if (c) c.checked = false; });
    const tapado = await page.evaluate(() => { const b = document.querySelector('.hoja [data-a="hoja-ev-ok"]'); if (!b) return 'no hay botón';
      const r = b.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return t && t.closest('.hoja') ? '' : ((t && (t.id || t.tagName)) || 'nada'); });
    const guardado = await clic('.hoja [data-a="hoja-ev-ok"]');
    const yaHay = await page.evaluate(() => Array.from(document.querySelectorAll('.hoja .hhay')).map((x) => x.textContent).join(' | '));
    // 5) pincel: copia la guardia a K2, deshacer, listo
    await clic('.hoja [data-a="pincel-on"]');
    const bx2 = await celda(K2); if (bx2) { await page.mouse.click(bx2.x + bx2.width / 2, bx2.y + bx2.height / 2); await page.waitForTimeout(120); }
    const pintado = await page.evaluate((k) => window.PG.dayInfo(k).shiftId, K2);
    await clic('[data-a="pincel-deshacer"]');
    const deshecho = await page.evaluate((k) => window.PG.dayInfo(k).shiftId, K2);
    await clic('[data-a="pincel-fin"]');
    const r = await page.evaluate((K) => { const P = window.PG;
      const ics = P.calEventos(K, K).filter((e) => e.cat === 'EVENTO').map((e) => e.summ).join(' | ');
      // la vuelta completa por normalize(): el «google:false» tiene que sobrevivir
      const vuelta = P.normalize ? P.normalize(JSON.parse(JSON.stringify(P.store))) : null;
      const ev = ((vuelta || P.store).eventos || []).filter((e) => e.titulo === 'Revisión 214')[0];
      const barra = !!document.querySelector('.mpincel');
      P.store = window.__copia214; P.save(); P.ui.hojaDia = ''; P.ui.mesModo = null; P.ui.monSel = ''; P.render();
      return { ics, google: ev ? ev.google : 'no está', barra }; }, K);
    check('Mes: un toque corto abre el panel de siempre y soltar antes de tiempo no abre la hoja; mantener sí',
      corto.sel === K && !corto.hoja && !antesDeTiempo && abierta, JSON.stringify({ corto, antesDeTiempo, abierta }));
    check('la hoja del día: la guardia se pone al primer toque y la hoja sigue abierta',
      g && guardia.tipo === 'sh-g' && guardia.sigue, JSON.stringify(guardia));
    check('el «Guardar» del evento no lo tapa nada, y el evento sale en «ya hay»',
      tapado === '' && guardado && /Revisión 214/.test(yaHay), JSON.stringify({ tapado, guardado, yaHay }));
    check('un evento marcado «sin Google» no va al .ics y lo sigue estando tras recargar',
      !/Revisión 214/.test(r.ics) && r.google === false, JSON.stringify(r));
    check('pincel: toca un día y lo pinta, «deshacer» lo devuelve y «listo» quita la barra',
      pintado === 'sh-g' && deshecho === 'sh-t' && !r.barra, JSON.stringify({ pintado, deshecho, barra: r.barra }));
  }

  // 215) UNA NOTA CON DÍA ES UN AVISO DE ESE DÍA, encadenado: nota desde la hoja del día → sale con su
  // texto en Mes, en la fila de Semana y en Hoy de ese día → se marca hecha desde Hoy → desaparece de
  // los tres. Una nota SIN día no sale en ningún calendario. Antes: en Mes era un 📝 sin texto, en
  // Semana no salía y en Hoy solo si era la de HOY.
  {
    const K = await page.evaluate(() => { const P = window.PG;
      window.__copia215 = JSON.parse(JSON.stringify(P.store));
      P.store.rotation.mode = 'date'; P.store.rotation.anchorSet = true;
      const K = P.iso(P.addDays(new Date(), 2));
      P.addNota('SINDIA215 idea suelta');
      P.ui.hojaDia = K; P.ui.hojaVista = 'nota'; P.ui.tab = 'month'; P.save(); P.render(); return K; });
    const clic = async (sel) => { const el = await page.$(sel); if (!el) return false;
      try { await el.click({ timeout: 2500 }); } catch (e) { return false; } await page.waitForTimeout(80); return true; };
    await page.evaluate(() => { const t = document.getElementById('hjNota'); if (t) t.value = 'AVISO215 renovar DNI'; });
    const guardada = await clic('.hoja [data-a="hoja-nota-ok"]');
    await clic('.hoja [data-a="hoja-cerrar"], .hscrim');
    const ver = () => page.evaluate(() => { const t = (document.querySelector('#main') || {}).innerText || '';
      return { aviso: /AVISO215/.test(t), sindia: /SINDIA215/.test(t) }; });
    const mes = await ver();
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'week'; P.ui.semVista = 'horas'; P.ui.semDesde = ''; P.render(); });
    const semana = await ver();
    await page.evaluate((K) => { const P = window.PG; P.ui.tab = 'hoy'; P.ui.hoyVista = ''; P.ui.diaHoy = K; P.render(); }, K);
    const hoy = await ver();
    // hecha desde la tarjeta de Hoy → fuera de los tres
    const tick = await clic('#main [data-a="nota-hecha"]');
    const hoy2 = await ver();
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'month'; P.render(); });
    const mes2 = await ver();
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia215; P.save(); P.ui.diaHoy = ''; P.ui.hojaDia = ''; P.ui.tab = 'hoy'; P.render(); });
    check('una nota con día sale como aviso en Mes, Semana y Hoy de ese día; la de sin día, en ninguno',
      guardada && mes.aviso && semana.aviso && hoy.aviso && !mes.sindia && !semana.sindia && !hoy.sindia,
      JSON.stringify({ guardada, mes, semana, hoy }));
    check('marcada hecha desde Hoy, la nota deja de salir en Hoy y en Mes', tick && !hoy2.aviso && !mes2.aviso,
      JSON.stringify({ tick, hoy2, mes2 }));
  }

  // 216) DINERO (v4: una pantalla y hojas), encadenado por la interfaz: capturas de Fintonic de tres meses → la portada dice
  // cuánto ahorras y en qué se va, con el gráfico de cada mes → la hoja enseña meses × categorías →
  // «Descargar Excel» da un .xlsx de verdad → hucha nueva con precio y aporte: dice cuándo llegas →
  // se crea con su aporte fijo, que el reparto le da primero → lista de «en qué me lo gasto» → y lo
  // de antes (apartar, objetivo, retos) sigue en «Apartar». Antes: nada de Fintonic se veía y la
  // tabla se descuadraba porque la fila del total llevaba la clase global «.tot» (un flex).
  {
    await page.evaluate(() => { const P = window.PG; window.__copia216 = JSON.parse(JSON.stringify(P.store));
      const a = P.store.ahorro || (P.store.ahorro = {}); a.real = [];
      const hoy = new Date();
      [[2, 640, 280, 160], [1, 640, 290, 410], [0, 640, 312, 186]].forEach((x) => {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - x[0], 15, 12), mk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        a.real.push({ fecha: P.iso(d), hora: '', mes: mk, banco: 3000, ingresos: 2700, gastos: x[1] + x[2] + x[3],
          cats: { 'Alquiler y casa': x[1], 'Supermercado': x[2], 'Restaurantes': x[3] } }); });
      P.ui.tab = 'dinero'; P.ui.dinTab = ''; P.ui.dineroVista = ''; P.ui.dinMes = ''; P.ui.hojaTodo = false; P.save(); P.render(); });
    const clic = async (sel) => { const el = await page.$(sel); if (!el) return false;
      try { await el.click({ timeout: 2500 }); } catch (e) { return false; } await page.waitForTimeout(80); return true; };
    // v7: tres pestañas. Mes = lo de hoy y el día a día de 6 meses; Metas = los bolsillos; Plan = el reparto
    const pestana = async (v) => { await clic(`#main .d7seg [data-v="${v}"]`); return page.evaluate(() => { const m = document.querySelector('#main');
      return { txt: m.innerText.replace(/\s+/g, ' '), tramos: m.querySelectorAll('.d6m > div').length, metas: m.querySelectorAll('.d7meta').length,
        rep: m.querySelectorAll('.d7rep').length, apartar: !!m.querySelector('[data-v="apartar"]'), alto: m.scrollHeight }; }); };
    const portada = await page.evaluate(() => { const m = document.querySelector('#main');
      return { txt: m.innerText.replace(/\s+/g, ' '), tramos: m.querySelectorAll('.d6m > div').length, apartar: !!m.querySelector('[data-v="apartar"]'), alto: m.scrollHeight }; });
    const metas = await pestana('metas');
    const plan7 = await pestana('plan');
    // fijo / variable y meta, desde la hoja de gastos que sube encima (en Plan)
    const hojaGastos = await clic('#main .d7pie [data-h="gastos"]');
    const g1 = await page.evaluate(() => { const hj = document.querySelector('.hoja.din4h'); if (!hj) return null;
      return { variables: hj.querySelectorAll('[data-a="din-cat-tipo"][data-t="variable"].on').length, fijos: hj.querySelectorAll('[data-a="din-cat-tipo"][data-t="fijo"].onf').length }; });
    const aFijo = await clic('.din4h [data-a="din-cat-tipo"][data-c="Supermercado"][data-t="fijo"]');
    const tipo = await page.evaluate(() => ((window.PG.store.ahorro.catCfg || {}).Supermercado || {}).tipo);
    await clic('.din4h [data-a="din-cat-tipo"][data-c="Supermercado"][data-t="variable"]');
    const pon = await clic('.din4h [data-a="din-meta"][data-c="Restaurantes"]');
    const meta = await page.evaluate(() => ((window.PG.store.ahorro.catCfg || {}).Restaurantes || {}).meta);
    const enPunto = await page.evaluate(() => { const e = document.elementFromPoint(200, 30); return e ? (e.tagName + '#' + e.id + '.' + String(e.className).slice(0, 30)) : 'nada'; });
    await page.mouse.click(200, 30); await page.waitForTimeout(120);
    const cerrada = await page.evaluate(() => !document.querySelector('.hoja'));
    const aHoja = await clic('#main .d7pie [data-v="hoja"]');
    const hoja = await page.evaluate(() => { const t = document.querySelector('#main .dxl'); if (!t) return null;
      const f = t.querySelector('tbody tr'), c = f ? f.querySelectorAll('td') : [];
      // que la tabla no se descuadre: cada celda de mes a la derecha de la anterior, sin solaparse
      let ok = c.length > 2;
      for (let i = 1; i < c.length; i++) { const p = c[i - 1].getBoundingClientRect(), q = c[i].getBoundingClientRect(); if (q.left < p.right - 1) ok = false; }
      return { filas: t.querySelectorAll('tbody tr').length, cols: t.querySelectorAll('thead th').length, enOrden: ok,
        cabeTodo: document.querySelector('#main .dxlw').scrollWidth <= document.querySelector('#main .dxlw').clientWidth + 2 }; });
    let descarga = '';
    try { const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), clic('#main [data-a="hoja-xlsx"]')]); descarga = dl.suggestedFilename(); }
    catch (e) { descarga = 'no descargó: ' + String(e).slice(0, 60); }
    const xlsx = await page.evaluate(() => { const P = window.PG, b = P.dineroXlsx(new Date().getFullYear());
      const txt = new TextDecoder('latin1').decode(b);
      return { pk: b[0] === 0x50 && b[1] === 0x4b, libro: txt.includes('xl/workbook.xml'), hojas: (txt.match(/xl\/worksheets\/sheet\d+\.xml/g) || []).length / 2,
        gastos: txt.includes('Gastos por categor') }; });
    // hucha nueva
    await clic('#main .subcab .volver');
    await clic('#main [data-a="dinero-vista"][data-v="plan"]');
    await clic('#main [data-v="hucha-nueva"]');
    await page.evaluate(() => { const s = (id, v) => { const el = document.getElementById(id); if (el) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } };
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 7);
      s('hnNom', 'Japón 216'); s('hnPre', '2400'); s('hnYa', '300'); s('hnPara', d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')); });
    const cuando = await page.evaluate(() => (document.getElementById('hnRes') || { innerText: '' }).innerText.replace(/\s+/g, ' '));
    const creada = await clic('#main [data-a="hn-crear"]');
    const h = await page.evaluate(() => { const P = window.PG, x = P.store.ahorro.huchas.filter((q) => q.nombre === 'Japón 216')[0];
      return x ? { id: x.id, saldo: x.saldo, objetivo: x.objetivo, mensual: x.mensual, reparto: P.repartoDe(600)[x.id], puro: P.repartoDe(600)['hu-colchon'] } : null; });
    let deseo = null;
    if (h) {
      // creada, vuelve a Metas; su fila abre la hoja encima
      await clic(`#main .d7meta[data-id="${h.id}"]`);
      await clic(`.din4h [data-a="deseo-nuevo"][data-h="${h.id}"]`);
      await page.evaluate(() => { const t = document.getElementById('dsTxt'), p = document.getElementById('dsPre'); if (t) t.value = 'Vuelos 216'; if (p) p.value = '900'; });
      await clic(`.din4h [data-a="deseo-add"][data-h="${h.id}"]`);
      await clic(`.din4h [data-a="deseo-ok"][data-h="${h.id}"]`);
      deseo = await page.evaluate((id) => { const P = window.PG, x = P.store.ahorro.huchas.filter((q) => q.id === id)[0];
        const vuelta = P.normalize ? P.normalize(JSON.parse(JSON.stringify(P.store))) : null;
        const y = vuelta && vuelta.ahorro ? vuelta.ahorro.huchas.filter((q) => q.id === id)[0] : null;
        return { lista: (x.deseos || []).map((d) => d.txt + ':' + d.hecho).join(','), trasRecargar: y ? (y.deseos || []).length + '/' + y.mensual : 'sin normalize' }; }, h.id);
    }
    await page.mouse.click(200, 30); await page.waitForTimeout(120);
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia216; P.save(); P.ui.dineroVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('Dinero v7: Mes dice lo que puedes gastar hoy y el día a día de 6 meses; Metas, cada bolsillo; Plan, el mes tipo y el reparto; todo en una pantalla y sin «Apartar»',
      /PUEDES GASTAR HOY/.test(portada.txt) && /GASTO DEL DÍA A DÍA/.test(portada.txt) && /SIN APUNTAR/.test(portada.txt) && portada.tramos === 6 && portada.alto < 1000 &&
      /TUS METAS/.test(metas.txt) && metas.metas >= 3 && /no se toca/.test(metas.txt) && metas.alto < 1000 &&
      /TU MES TIPO/.test(plan7.txt) && plan7.rep === 4 && /Aplicar a mis bolsillos/.test(plan7.txt) &&
      !portada.apartar && !metas.apartar && !plan7.apartar, JSON.stringify({ portada: [portada.tramos, portada.alto, portada.apartar], metas: [metas.metas, metas.alto], plan7: [plan7.rep, plan7.alto] }));
    check('la hoja de gastos separa fijos y variables (alquiler fijo solo), se cambia a mano y pone meta; toca fuera y se cierra',
      hojaGastos && g1 && g1.fijos >= 1 && g1.variables >= 2 && aFijo && tipo === 'fijo' && pon && meta > 0 && cerrada,
      JSON.stringify({ hojaGastos, g1, aFijo, tipo, pon, meta, cerrada, enPunto }));
    check('la hoja enseña meses × categorías sin descuadrarse y cabe en el móvil',
      aHoja && hoja && hoja.filas >= 4 && hoja.cols >= 4 && hoja.enOrden && hoja.cabeTodo, JSON.stringify(hoja));
    check('«Descargar Excel» baja un .xlsx de verdad (zip con libro, resumen, gastos y huchas)',
      /\.xlsx$/.test(descarga) && xlsx.pk && xlsx.libro && xlsx.hojas >= 4 && xlsx.gastos, JSON.stringify({ descarga, xlsx }));
    check('nueva meta: con precio, lo que tienes y para cuándo, dice cuánto apartar al mes y al día',
      /PARA LLEGAR/.test(cuando) && /300 €\/mes/.test(cuando) && /7 meses/.test(cuando) && /€\/día/.test(cuando), cuando);
    check('la meta se crea con lo que pide al mes: la mitad va antes a ahorro puro, luego su fijo; y la lista de deseos sobrevive a recargar',
      creada && h && h.saldo === 300 && h.objetivo === 2400 && h.mensual === 300 && h.reparto === 300 && h.puro === 300 &&
      deseo && deseo.lista === 'Vuelos 216:true' && deseo.trasRecargar === '1/300', JSON.stringify({ h, deseo }));
  }

  // 217) BUSCADOR QUE NO SE CONGELA + INTERNET SOLO + CERRAR LA HOJA ARRASTRANDO, encadenado:
  //  · escribir en el buscador repintaba la pantalla entera en cada pausa (desmontaba el campo y en el
  //    móvil congelaba ~medio segundo cada palabra): ahora el campo es el MISMO nodo y solo cambia la lista;
  //  · con poco en la app, busca solo en Open Food Facts y enseña lo que encuentra (antes, solo con un
  //    botón); y lee las fichas que traen «x_100g», que antes se descartaban por «sin datos»;
  //  · la hoja del día se cierra arrastrándola hacia abajo; un arrastre corto la deja donde estaba.
  {
    let offLlamadas = 0;
    await page.route('https://world.openfoodfacts.org/**', (r) => { offLlamadas++; r.fulfill({ status: 200, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ products: [{ code: '8480000217217', product_name: 'Kombucha 217', brands: 'Hacendado', quantity: '330 ml',
        nutriments: { 'energy-kcal_100g': 18, proteins_100g: 0.1, carbohydrates_100g: 4, fat_100g: 0 } }] }) }); });
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'food'; P.ui.foodVista = 'buscar'; P.ui.foodTab = ''; P.ui.foodBusca = ''; P.ui.off = null; P.ui.offCache = {}; P.render(); });
    await page.waitForTimeout(150);
    const campo0 = await page.$('#fbQ');
    if (campo0) await campo0.click();
    for (const ch of 'kombu') { await page.keyboard.type(ch); await page.waitForTimeout(60); }
    await page.waitForTimeout(250);
    const mitad = await page.evaluate(() => ({ foco: (document.activeElement || {}).id, valor: (document.getElementById('fbQ') || {}).value }));
    const mismoNodo = campo0 ? await page.evaluate((c) => c === document.getElementById('fbQ') && c.isConnected, campo0) : false;
    for (const ch of 'cha') { await page.keyboard.type(ch); await page.waitForTimeout(60); }
    await page.waitForTimeout(1400);
    const off = await page.evaluate(() => ({ foco: (document.activeElement || {}).id, sale: /Kombucha 217/.test((document.getElementById('fbRes') || {}).innerText || ''),
      kcal: ((window.PG.ui.off || {}).list || [])[0] ? window.PG.ui.off.list[0].kcal : null }));
    await page.unroute('https://world.openfoodfacts.org/**');
    // la hoja del día, arrastrada con el ratón (los mismos eventos de puntero que el dedo)
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'month'; P.ui.hojaDia = P.iso(new Date()); P.ui.hojaVista = ''; P.ui.foodBusca = ''; P.render(); });
    await page.waitForTimeout(500);
    // desde el centro de la hoja: a 1280 px va centrada y a la izquierda está el fondo, que la cierra al tocarlo
    const arrastra = async (dy) => { const r = await page.evaluate(() => { const h = document.querySelector('.hoja'); if (!h) return null; const b = h.getBoundingClientRect(); return { t: b.top, x: b.left + b.width / 2 }; });
      if (!r) return false;
      const t = r.t, x = r.x;
      await page.mouse.move(x, t + 12); await page.mouse.down();
      for (let i = 1; i <= 8; i++) { await page.mouse.move(x, t + 12 + dy * i / 8); await page.waitForTimeout(30); }
      await page.mouse.up(); await page.waitForTimeout(450); return true; };
    await arrastra(40);
    const corta = await page.evaluate(() => !!document.querySelector('.hoja') && !document.querySelector('.hoja').style.transform);
    await arrastra(170);
    const larga = await page.evaluate(() => !document.querySelector('.hoja') && !window.PG.ui.hojaDia);
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'hoy'; P.render(); });
    check('el buscador no desmonta el campo al escribir: mismo nodo, con el foco y todo lo tecleado',
      mismoNodo && mitad.foco === 'fbQ' && mitad.valor === 'kombu' && off.foco === 'fbQ', JSON.stringify({ mismoNodo, mitad, off }));
    check('con poco en la app busca solo en Open Food Facts y lee las fichas con «x_100g»',
      offLlamadas >= 1 && off.sale && off.kcal === 18, JSON.stringify({ offLlamadas, off }));
    check('la hoja del día: un arrastre corto la deja en su sitio y uno largo hacia abajo la cierra',
      corta && larga, JSON.stringify({ corta, larga }));
  }

  // 218) SUEÑO, DINERO Y COMER SANO, encadenado:
  // · la deuda de sueño suma las noches cortas y la guardia (a ratos cuenta la mitad), resta como
  //   mucho 2 h por noche y sale en Hoy y en el «listo» del entreno; la hoja apunta una noche
  // · un gasto de ahorros baja SOLO el bolsillo del que sale (y lo que falta, del que elijas); el
  //   intocable no se toca; «Mi plan» suma siempre 100 y el intocable no baja de 50
  // · Comer sano: si falta proteína te propone extras y «aplicar la mejor» llega a la meta
  {
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'hoy'; P.ui.hoyVista = ''; P.ui.foodVista = ''; P.ui.dineroVista = ''; P.render(); });
    const sn = await page.evaluate(() => { const P = window.PG, sr = P.store.suenoReal = {}, hoy = new Date();
      // todas las noches apuntadas (8 h), para que las guardias del calendario no cuenten como estimadas
      for (let i = 5; i < 14; i++) sr[P.iso(P.addDays(hoy, -i))] = { h: 8, guardia: false };
      // 5 noches: 6 h, guardia (2 h a ratos + 3 h de siesta), 10 h, 7 h, 12 h
      [[6], [2, true, 3], [10], [7], [12]].forEach((x, i) => { const k = P.iso(P.addDays(hoy, i - 4));
        sr[k] = x[1] ? { h: x[0], guardia: true, ratos: true, siesta: x[2] } : { h: x[0], guardia: false }; });
      P.save(); P.render(); const d = P.suenoDeuda(P.iso(hoy));
      const r = { deuda: d.deuda, src: d.src, card: !!document.querySelector('.dsuhoy') };
      // con 12 h de deuda (tres noches de 4 h), el «listo» lo dice
      const k2 = P.iso(P.addDays(hoy, -20)), sr2 = {}; for (let i = 0; i < 14; i++) sr2[P.iso(P.addDays(hoy, -20 - i))] = { h: i < 3 ? 4 : 8, guardia: false };
      const antes = P.store.suenoReal; P.store.suenoReal = sr2; r.listoAlta = /deuda de sueño 12 h/.test(P.listoDe(k2).motivos.join(' | '));
      P.store.suenoReal = antes; return r; });
    // 8−6=2 → +(8−(1+3))=4 → 6 → −2 (10 h) → 4 → +1 → 5 → −2 (12 h, tope) → 3
    await page.click('.dsuhoy'); await page.waitForTimeout(120);
    const vista = await page.evaluate(() => ({ big: (document.querySelector('.dsubig') || {}).textContent || '', barras: document.querySelectorAll('.dsubars button').length }));
    await page.click('.dsubars button:last-child'); await page.waitForTimeout(120);
    await page.click('.hoja [data-a="sn-h"][data-v="6"]'); await page.waitForTimeout(80);
    const prev = await page.evaluate(() => (document.querySelector('.dsuhd') || {}).textContent || '');
    await page.click('.hoja [data-a="sn-guardar"]'); await page.waitForTimeout(120);
    const trasHoja = await page.evaluate(() => ({ hoja: !!document.querySelector('.hoja'), deuda: window.PG.suenoDeuda(window.PG.iso(new Date())).deuda }));
    await page.evaluate(() => { const P = window.PG; P.ui.hoyVista = ''; P.render(); });
    check('la deuda de sueño acumula noches cortas y guardias, recupera como mucho 2 h por noche y sale en Hoy, en Sueño y en el «listo»',
      sn.deuda === 3 && sn.src.guardiaN === 1 && sn.src.cortasN === 2 && sn.card && sn.listoAlta &&
      /3 h/.test(vista.big.replace(/\s+/g, ' ')) && vista.barras === 14, JSON.stringify({ sn, vista }));
    check('la hoja «anotar noche» enseña la deuda antes y después, y al guardar se cierra y la recalcula',
      /3 h →\s*7 h/.test(prev.replace(/\s+/g, ' ')) && !trasHoja.hoja && trasHoja.deuda === 7, JSON.stringify({ prev, trasHoja }));

    const din = await page.evaluate(() => { const P = window.PG, a = P.ahorroS();
      a.huchas = [{ id: 'hu-colchon', nombre: 'Colchón', ico: '🔒', color: '#8b5cf6', pct: 0, objetivo: 0, meta: 'no se toca', saldo: 5000, mensual: 0, deseos: [] },
        { id: 'hu-v', nombre: 'Viajes', ico: '✈️', color: '#38bdf8', pct: 60, objetivo: 0, meta: '', saldo: 800, mensual: 0, deseos: [] },
        { id: 'hu-c', nombre: 'Caprichos', ico: '🎁', color: '#fbbf24', pct: 40, objetivo: 0, meta: '', saldo: 300, mensual: 0, deseos: [] }];
      a.puroId = 'hu-colchon'; a.puroPct = 50; P.ui.dinGaste = null; P.save(); P.ui.tab = 'dinero'; P.ui.dinTab = 'ahorros'; P.ui.dineroVista = ''; P.render();
      return { total: [...document.querySelectorAll('.d7meta .v')].map((e) => e.textContent).join('|'), filas: document.querySelectorAll('.d7meta').length }; });
    await page.click('[data-a="din-hoja"][data-h="gaste"]'); await page.waitForTimeout(120);
    await page.click('.hoja [data-a="din-gaste-de"][data-id="hu-v"]'); await page.waitForTimeout(80);
    await page.fill('#dgImp', '1000'); await page.fill('#dgTxt', 'Viaje a Lisboa');
    const foco = await page.evaluate(() => (document.activeElement || {}).id);
    const queda = await page.evaluate(() => (document.getElementById('dgQueda') || {}).innerText || '');
    await page.click('.hoja [data-a="din-gaste-ok"]'); await page.waitForTimeout(120);
    const trasG = await page.evaluate(() => ({ hoja: !!document.querySelector('.hoja'), s: window.PG.ahorroS().huchas.map((h) => h.saldo), mov: (window.PG.ahorroS().movs[0] || {}).txt }));
    check('«Gasté de mis ahorros»: 1.000 € salen de Viajes (800) y lo que falta de Caprichos; el intocable sigue igual',
      /5\.000/.test(din.total) && din.filas === 3 && foco === 'dgTxt' && /5\.100/.test(queda) &&
      !trasG.hoja && trasG.s.join() === '5000,0,100' && trasG.mov === 'Viaje a Lisboa', JSON.stringify({ din, foco, queda, trasG }));
    const plan = await page.evaluate(() => { const P = window.PG; P.ui.dineroVista = 'plan'; P.render();
      const set = (id, v) => { const el = document.querySelector('input[data-a="din-plan-pct"][data-id="' + id + '"]'); el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
      set('hu-v', 40); const a1 = [...document.querySelectorAll('.d5pl .pc')].map((e) => parseInt(e.textContent, 10));
      set('hu-colchon', 20); const a2 = [...document.querySelectorAll('.d5pl .pc')].map((e) => parseInt(e.textContent, 10));
      P.ui.dineroVista = ''; P.render(); return { a1, a2 }; });
    const suma = (x) => x.reduce((s, v) => s + v, 0);
    check('«Mi plan»: al mover un bolsillo los demás se ajustan para sumar 100 y el intocable no baja de 50',
      plan.a1.join() === '50,40,10' && suma(plan.a2) === 100 && plan.a2[0] === 50, JSON.stringify(plan));

    const bw = await page.evaluate(() => { const P = window.PG; P.ui.tab = 'food'; P.ui.foodVista = 'sano';
      P.ui.bowl = { tipo: 'equi', obj: { kcal: 600, p: 40, c: 65, gr: 20 }, it: [['arroz', 150], ['salmon', 100], ['aguacate', 50], ['mayosri', 15]], paso: 4, n: '', e: '' }; P.render();
      return { al: (document.querySelector('.bwal') || {}).innerText || '' }; });
    await page.click('[data-a="bowl-mejor"]'); await page.waitForTimeout(100);
    const trasB = await page.evaluate(() => { const P = window.PG, it = P.ui.bowl.it; let p = 0; return { n: it.length, pie: (document.querySelector('.bwpie') || {}).innerText || '', al: !!document.querySelector('.bwal') }; });
    await page.evaluate(() => { const P = window.PG; P.ui.bowl = null; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('Comer sano: con el bowl corto de proteína dice cuánto falta, propone extras y «aplicar la mejor» llega a la meta',
      /Te faltan \d+ g de proteína/.test(bw.al) && /Mejor combinación/.test(bw.al) && !trasB.al && trasB.n > 4 &&
      (() => { const m = /Proteína\s*(\d+) \/ 40 g/.exec(trasB.pie); return m && +m[1] >= 38; })(), JSON.stringify({ bw, trasB }));
  }

  // 219) COMER v2 Y MONTAR COMIDAS, encadenado:
  // · Hoy: lo apuntado sale arriba (no a 1.052 px) y un plato apuntado suma también hidratos y grasa
  // · buscador: 8 filas por relevancia con «ver más», «repollo» no sale por «pollo», el filtro Mercadona filtra
  // · prototipos: dos desayunos y UN toque pone los 7 días; los prototipos sobreviven a recargar
  // · por macros: proteína → hidratos → grasa llega a la meta de la comida y se pone en la semana
  // · lo cocinado: apuntar una ración de un plato cocinado la descuenta
  {
    const hoyV = await page.evaluate(() => { const P = window.PG, hoy = P.iso(new Date()), ds = P.store.dishes.filter((d) => +d.carb > 0);
      P.store.food.objetivo = { kcal: 2470, prot: 140 }; P.store.food.log[hoy] = [];
      P.addFoodEntry(hoy, { dishId: ds[0].id, rac: 1, pos: 'comida' });
      P.ui.tab = 'food'; P.ui.foodVista = ''; P.ui.foodDate = ''; P.render(); window.scrollTo(0, 0);
      const cards = [...document.querySelectorAll('#main .card')], lo = cards.filter((c) => /LO DE HOY|HOY TE TOCA/.test(c.innerText))[0];
      return { top: lo ? Math.round(lo.getBoundingClientRect().top) : null, carb: P.foodLog(hoy)[0].carb, h: (document.querySelector('.h2mac') || {}).innerText || '' }; });
    check('Comer · Hoy: lo apuntado sale en la primera pantalla y un plato suma hidratos y grasa',
      hoyV.top != null && hoyV.top < 700 && hoyV.carb > 0 && !/H\s*0 \//.test(hoyV.h), JSON.stringify(hoyV));

    await page.evaluate(() => { const P = window.PG; P.ui.foodVista = 'buscar'; P.ui.foodBusca = ''; P.ui.fbFiltro = ''; P.ui.fbProt = false; P.render(); });
    await page.type('#fbQ', 'pollo', { delay: 30 }); await page.waitForTimeout(400);
    const fb = await page.evaluate(() => ({ filas: document.querySelectorAll('#fbRes .hit').length, mas: !!document.querySelector('#fbRes .fbmas'),
      nombres: [...document.querySelectorAll('#fbRes .hit .nm b')].map((e) => e.textContent), prot: /g P/.test((document.querySelector('#fbRes .hit .kc') || {}).textContent || ''), foco: document.activeElement.id }));
    await page.click('[data-a="fb-filtro"][data-f="merca"]'); await page.waitForTimeout(120);
    const merca = await page.evaluate(() => [...document.querySelectorAll('#fbRes .hit .nm b')].map((e) => e.textContent));
    await page.evaluate(() => { const P = window.PG; P.ui.fbFiltro = ''; P.ui.foodBusca = ''; P.ui.foodVista = ''; P.render(); });
    check('buscador: 8 resultados con su proteína y «ver más», sin «repollo», y el filtro Mercadona solo deja Hacendado',
      fb.filas === 8 && fb.mas && fb.prot && fb.foco === 'fbQ' && !fb.nombres.some((n) => /repollo/i.test(n)) &&
      merca.length > 0 && merca.every((n) => /Hacendado/.test(n)), JSON.stringify({ fb, merca }));

    const pr = await page.evaluate(() => { const P = window.PG; P.store.semBase = { on: true, d: {} }; P.store.protos = {};
      P.ui.tab = 'types'; P.ui.typesVista = 'protos'; P.ui.prCls = 'desayuno'; P.ui.prPat = null; P.save(); P.render();
      return document.querySelectorAll('[data-a="pr-add"]').length; });
    await page.click('[data-a="pr-add"]'); await page.waitForTimeout(80);
    await page.click('.mprmas summary'); await page.waitForTimeout(50); await page.click('[data-a="pr-add"]'); await page.waitForTimeout(80);
    await page.click('[data-a="pr-aplicar"]'); await page.waitForTimeout(150);
    const prR = await page.evaluate(() => { const P = window.PG, d = P.store.semBase.d, ids = P.store.protos.desayuno;
      P.ui.typesVista = 'montar'; P.render();   // la cuadrícula con las letras está en «Más formas de montar»
      const nombres = ids.map((id) => P.store.meals.find((m) => m.id === id).name);
      const vuelta = P.normalize(JSON.parse(JSON.stringify(P.store)));
      return { dias: [0, 1, 2, 3, 4, 5, 6].map((w) => (d[w] && d[w].desayuno && d[w].desayuno.meal) || ''), nombres, vuelta: (vuelta.protos || {}).desayuno || [],
        letras: [...document.querySelectorAll('.mgrid .LA, .mgrid .LB')].length }; });
    check('prototipos: con dos desayunos, un toque pone los 7 (diario A, finde B), se ven en la semana y sobreviven a recargar',
      pr >= 2 && prR.dias.slice(0, 5).every((x) => x === prR.nombres[0]) && prR.dias[5] === prR.nombres[1] && prR.dias[6] === prR.nombres[1] &&
      prR.vuelta.length === 2 && prR.letras === 7, JSON.stringify({ pr, prR }));

    await page.evaluate(() => { const P = window.PG; P.ui.mDest = { w: 4, c: 'comida' }; P.ui.pm = null; P.ui.typesVista = 'macros'; P.render(); });
    for (let i = 0; i < 3; i++) { const b = await page.$('.mop.best'); if (b) { await b.click(); await page.waitForTimeout(100); } }
    const pmR = await page.evaluate(() => { const pm = window.PG.ui.pm; return { obj: pm.obj, txt: [...document.querySelectorAll('.mbul b')].map((e) => e.textContent), sel: Object.keys(pm.sel) }; });
    await page.click('[data-a="pm-poner"]'); await page.waitForTimeout(150);
    const vie = await page.evaluate(() => { const P = window.PG, c = P.store.semBase.d[4] && P.store.semBase.d[4].comida; const d = c ? P.store.dishes.find((x) => x.id === c.items[0].id) : null;
      return d ? { n: d.name, kcal: d.kcal, prot: d.prot, alims: (d.alims || []).length } : null; });
    const cerca = (v, t) => Math.abs(v - t) <= Math.max(3, t * 0.12);
    check('por macros: proteína, hidratos y grasa llegan a la meta de la comida y el plato va al viernes',
      pmR.sel.length === 3 && pmR.txt.length === 3 && pmR.txt.slice(1).every((t) => /✓/.test(t)) && vie && vie.alims === 3 &&
      cerca(vie.kcal, pmR.obj.kcal * 1.02) && vie.prot >= pmR.obj.p, JSON.stringify({ pmR, vie }));

    const co = await page.evaluate(() => { const P = window.PG, d = P.store.dishes[0], hoy = new Date();
      P.store.food.cocinado = [{ id: 'c219', dishId: d.id, total: 4, queda: 4, fecha: P.iso(hoy), hasta: P.iso(P.addDays(hoy, 3)) }];
      P.addFoodEntry(P.iso(hoy), { dishId: d.id, rac: 1, pos: 'cena' });
      P.ui.tab = 'food'; P.ui.foodVista = 'cocina-panel'; P.ui.cocinaTab = ''; P.render();
      return { queda: P.store.food.cocinado[0].queda, grises: document.querySelectorAll('.cocq .t i.o').length }; });
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'hoy'; P.ui.foodVista = ''; P.render(); });
    check('lo cocinado: apuntar una ración la descuenta y se ve gris en Cocina', co.queda === 3 && co.grises === 1, JSON.stringify(co));
  }

  // 221) DINERO v6 · ANÁLISIS: cuánto puedes gastar hoy (lo variable que queda, ya quitados lo fijo y
  // el ahorro, entre los días que faltan), cada categoría contra tu media, consejos con lo que ganas,
  // la meta de una categoría y la revisión 50/30/20
  {
    const d6 = await page.evaluate(() => { const P = window.PG, a = P.ahorroS(); a.real = []; const hoy = new Date();
      const cats = [['Alquiler y casa', 640, 640, 640, 640, 640], ['Supermercado', 270, 295, 284, 279, 191], ['Restaurantes', 160, 210, 198, 150, 238], ['Ocio', 90, 110, 95, 97, 134], ['Suscripciones', 42, 42, 42, 42, 42]];
      for (let i = 4; i >= 0; i--) { const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, i ? 28 : 1, 12), mk = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        const c = {}; let t = 0; cats.forEach((x) => { c[x[0]] = x[5 - i]; t += x[5 - i]; }); a.real.unshift({ fecha: P.iso(d), hora: '', mes: mk, banco: 3000, ingresos: 2700, gastos: t, cats: c }); }
      P.save(); P.ui.tab = 'dinero'; P.ui.dinTab = ''; P.ui.dineroVista = ''; P.render();
      const M = P.d6Mes(), big = (document.querySelector('.din6 .dbig') || {}).textContent || '';
      // v7: lo grande que apuntas después de la captura ya cuenta; la captura siguiente lo cuadra
      let sin = null;
      if (hoy.getDate() > 1) { const pg = (P.store.dinero || (P.store.dinero = { gastos: [], pagos: [], presupuesto: 0 })).pagos || (P.store.dinero.pagos = []); pg.push({ id: 'pg221', fecha: P.iso(hoy), importe: 50, nombre: 'cena 221', cat: 'ocio', ts: Date.now() });
        const M2 = P.d6Mes(); sin = { mas: M2.gastado - M.gastado, n: M2.sinCaptura.n }; P.store.dinero.pagos = pg.filter((x) => x.id !== 'pg221'); }
      return { M: { ingreso: M.ingreso, fijos: M.fijos, ahorro: M.ahorro, presu: M.presu, gastado: M.gastado, queda: M.queda, dias: M.dias, hoyMax: M.hoyMax },
        big: big.replace(/\s+/g, ' '), barras: document.querySelectorAll('.din7 .d6m > div').length, sin }; });
    const M = d6.M;
    check('Dinero · Mes: «puedes gastar hoy» = lo variable que queda (sin fijos ni ahorro) entre los días que faltan, con el día a día de 6 meses; lo apuntado tras la captura ya cuenta',
      M.presu === Math.max(0, M.ingreso - M.fijos - M.ahorro) && M.queda === Math.max(0, M.presu - M.gastado) && M.hoyMax === Math.floor(M.queda / M.dias) &&
      d6.big.indexOf(String(M.hoyMax).replace(/\B(?=(\d{3})+(?!\d))/g, '.')) === 0 && d6.barras === 6 &&
      (d6.sin === null || (d6.sin.mas === 50 && d6.sin.n === 1)), JSON.stringify(d6));
    await page.click('[data-a="dinero-vista"][data-v="analisis"]'); await page.waitForTimeout(150);
    const an = await page.evaluate(() => ({ n: document.querySelectorAll('.din6 .d6cat').length, fijo: [...document.querySelectorAll('.din6 .d6cat')].filter((b) => /fijo/.test(b.innerText)).map((b) => b.dataset.c),
      tips: [...document.querySelectorAll('.d6tip .t b')].map((e) => e.textContent) }));
    await page.click('.d6cat[data-c="Restaurantes"]'); await page.waitForTimeout(150);
    await page.click('[data-a="din-meta"][data-c="Restaurantes"]'); await page.waitForTimeout(120);
    const cat = await page.evaluate(() => ({ barras: document.querySelectorAll('.d6m > div').length, txt: document.querySelector('#main').innerText.replace(/\s+/g, ' '), meta: (window.PG.store.ahorro.catCfg || {}).Restaurantes }));
    await page.evaluate(() => { const P = window.PG; P.ui.dineroVista = 'salud'; P.render(); });
    const sal = await page.evaluate(() => { const t = document.querySelector('#main').innerText.replace(/\s+/g, ' '), m = /necesidades (\d+) % .*?caprichos (\d+) % .*?ahorro (\d+) %/.exec(t);
      return { suma: m ? +m[1] + +m[2] + +m[3] : null, colchon: /Fondo de emergencia/.test(t), aviso: /no asesoramiento/.test(t) }; });
    await page.evaluate(() => { const P = window.PG; P.ui.dineroVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('Dinero · análisis: todas las categorías (lo fijo marcado), la de una categoría con sus 6 meses y su meta dice lo que ganas al año, y la salud financiera cuadra el 50/30/20',
      an.n === 5 && an.fijo.includes('Alquiler y casa') && an.tips.some((t) => /Restaurantes a \d+ €/.test(t)) && cat.barras === 6 && cat.meta && cat.meta.meta > 0 && /€\/año/.test(cat.txt) &&
      sal.suma === 100 && sal.colchon && sal.aviso, JSON.stringify({ an, cat: { barras: cat.barras, meta: cat.meta }, sal }));
  }

  // 222) BUSCADOR Y SELECTOR COMPLETOS: el plural casa con el singular («nueces» → Nuez), los platos
  // caseros de siempre están (fabada, huevos revueltos, jamón york, pechuga empanada…), sin el mismo
  // producto repetido, y en el menú se puede poner un alimento suelto, no solo tus platos
  {
    const bus = await page.evaluate(() => { const P = window.PG, t = (q) => P.foodBuscar(q, '').map((x) => x.nombre);
      const qs = ['huevos revueltos', 'fabada', 'jamon york', 'pechuga empanada', 'crema de calabacin', 'colacao', 'espaguetis carbonara'];
      const ks = ['arroz', 'yogur griego', 'lentejas'].flatMap((q) => P.foodBuscar(q, '').map((x) => q + '|' + x.nombre + '|' + (x.sub || '') + '|' + x.tipo));
      const dup = ks.filter((k, i, a) => a.indexOf(k) !== i);
      return { nueces: t('nueces').includes('Nuez'), faltan: qs.filter((q) => !t(q).length), dup: dup.length }; });
    await page.evaluate(() => { const P = window.PG; P.store.semBase = { on: true, d: {} }; P.ui.tab = 'types';
      P.ui.elegir = { modo: 'sb', w: 3, c: 'comida', q: '', f: 'comida' }; P.ui.typesVista = 'elegir'; P.render(); });
    await page.fill('#elQ', 'pechuga'); await page.waitForTimeout(450);
    const alim = await page.$('#main [data-a="elegir-alim"]'); if (alim) { await alim.click(); await page.waitForTimeout(200); }
    const cel = await page.evaluate(() => { const c = window.PG.store.semBase.d[3], d = c && c.comida && c.comida.items[0] ? window.PG.store.dishes.find((x) => x.id === c.comida.items[0].id) : null;
      return d ? { n: d.name, kcal: d.kcal, suelto: !!d.suelto } : null; });
    await page.evaluate(() => { const P = window.PG; P.ui.elegir = null; P.ui.typesVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('buscador: plural = singular, platos caseros de siempre y sin repetidos; y en el menú se pone un alimento suelto',
      bus.nueces && bus.faltan.length === 0 && bus.dup === 0 && !!alim && cel && cel.suelto && cel.kcal > 0 && /pechuga/i.test(cel.n),
      JSON.stringify({ bus, cel }));
  }

  // 223) COCINA SIMPLE + TICKET + DINERO v7 + GUÍA, encadenado:
  //  · Comer tiene cuatro pestañas (Hoy · Semana · Nevera · Compra); «Móntamela» llena la semana con
  //    lo que hay; «Hoy cocino» apunta lo cocinado con los días que aguanta; Hoy se apunta con ✓ y ±;
  //  · el ticket de Mercadona (texto como el que sale del OCR) va a la nevera y a una lista habitual;
  //  · «Aplicar a mis bolsillos» crea inversión y caprichos, y el colchón puede bajar del 50 % porque
  //    lo que no se toca es colchón + inversión; una meta con fecha pide su €/mes;
  {
    await page.evaluate(() => { const P = window.PG; window.__copia223 = JSON.parse(JSON.stringify(P.store));
      P.store.semBase = { on: true, d: {} };
      ['500 g pechuga de pollo', '1 kg patata', '12 huevos', '1 bolsa espinacas', '500 g lentejas', '1 cebolla', '1 kg arroz'].forEach((t) => P.despensaAdd(t));
      P.ui.tab = 'food'; P.ui.foodVista = ''; P.render(); });
    const tabs = await page.$$eval('#calModes button', (e) => e.map((x) => x.textContent.trim()));
    await page.click('#calModes button[data-t="types"]'); await page.waitForTimeout(150);
    const vacias = await page.$$eval('.ssc', (e) => e.filter((x) => /＋/.test(x.textContent)).length);
    await page.click('[data-a="ss-auto"]'); await page.waitForTimeout(200);
    const trasAuto = await page.$$eval('.ssc', (e) => e.filter((x) => /＋/.test(x.textContent)).length);
    const hc = await page.$('[data-a="food-vista"][data-v="hoycocino"]'); if (hc) { await hc.click(); await page.waitForTimeout(200); }
    const opciones = await page.$$eval('.hcop', (e) => e.length);
    const okb = await page.$('[data-a="hc-ok"]'); if (okb) { await okb.click(); await page.waitForTimeout(200); }
    const coc = await page.evaluate(() => (window.PG.store.food.cocinado || []).map((x) => ({ total: x.total, dias: Math.round((new Date(x.hasta) - new Date(x.fecha)) / 86400000) })));
    const aguanta = await page.evaluate(() => { const P = window.PG; return ['Arroz con pollo', 'Merluza al horno', 'Lentejas estofadas', 'Pollo asado'].map((n) => P.diasAguanta({ name: n })); });
    await page.click('#calModes button[data-v="nevera2"]'); await page.waitForTimeout(150);
    const nevera = await page.evaluate(() => ({ txt: document.querySelector('#main').innerText.replace(/\s+/g, ' '), foto: !!document.querySelector('#main [data-a="ticket-foto"]') }));
    await page.click('#calModes button[data-v=""]'); await page.waitForTimeout(150);
    const ok1 = await page.$('#main .h2ok'); if (ok1) { await ok1.click(); await page.waitForTimeout(150); }
    const log1 = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date())).length);
    const tk = await page.evaluate(() => { const P = window.PG;
      const r = P.ticketLeer('MERCADONA, S.A.\n1 LECHE SEMIDESNATADA 0,89\n2 HUEVOS FRESCOS L 2,35 4,70\n1 PECHUGA POLLO FILETE 5,49\n0,862 kg PLATANO 2,19/kg 1,89\nTOTAL (€) 12,97');
      P.tkHabitual(r.items); const l = (P.store.listas || []).filter((x) => x.habitual)[0];
      return { n: r.items.length, platano: r.items.some((x) => /pl[aá]tano/i.test(x.nom) && !/\/kg/.test(x.nom)), total: r.total, habitual: l ? l.items.length : 0 }; });
    const din = await page.evaluate(() => { const P = window.PG, a = P.ahorroS();
      a.huchas = [{ id: 'hu-colchon', nombre: 'Colchón', ico: '🔒', color: '#8b5cf6', pct: 0, objetivo: 0, meta: '', saldo: 3000, mensual: 0, deseos: [] },
        { id: 'hu-j', nombre: 'Japón', ico: '✈️', color: '#38bdf8', pct: 50, objetivo: 2400, meta: '', saldo: 800, mensual: 0, deseos: [], para: '' },
        { id: 'hu-p', nombre: 'Juego de la Play', ico: '🎮', color: '#fbbf24', pct: 50, objetivo: 70, meta: '', saldo: 50, mensual: 0, deseos: [] }];
      a.puroId = 'hu-colchon'; a.puroPct = 50;
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + 4); a.huchas[1].para = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const c = P.metaHucha(a.huchas[1]);
      P.ui.tab = 'dinero'; P.ui.dineroVista = ''; P.ui.dinTab = 'plan'; P.render();
      return { men: c.men, meses: c.meses, dia: c.dia, rep: document.querySelectorAll('.d7rep').length }; });
    await page.click('#main [data-a="din7-aplicar"]'); await page.waitForTimeout(150);
    const tras = await page.evaluate(() => { const P = window.PG, hs = P.ahorroS().huchas;
      return { puro: P.puroPct(), min: P.puroMin(), inv: hs.some((h) => /Inversión/.test(h.nombre)), cap: hs.some((h) => /Caprichos/.test(h.nombre)),
        japon: hs.filter((h) => h.id === 'hu-j')[0].mensual, suma: Object.values(P.repartoDe(1000)).reduce((s, v) => s + v, 0) }; });
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia223; P.save(); P.ui.ajuVista = ''; P.ui.dinTab = ''; P.ui.foodVista = ''; P.ui.typesVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('Cocina simple: Hoy · Semana · Nevera · Compra; «Móntamela» llena huecos con lo que hay; «Hoy cocino» guarda raciones con los días que aguanta; ✓ apunta el día',
      tabs.length === 4 && /Hoy/.test(tabs[0]) && /Semana/.test(tabs[1]) && /Nevera/.test(tabs[2]) && /Compra/.test(tabs[3]) &&
      trasAuto < vacias && opciones > 0 && coc.length >= 1 && coc[coc.length - 1].total > 1 && coc[coc.length - 1].dias >= 1 &&
      aguanta.join() === '1,2,4,3' && nevera.foto && log1 > 0, JSON.stringify({ tabs, vacias, trasAuto, opciones, coc, aguanta, log1, nevera: nevera.txt.slice(0, 160) }));
    // un ticket real leído por la foto, con lo que la foto tuerce: precios «2/45», «1'90», «459»,
    // líneas sin cantidad, la dirección antes de «Descripción» y el peso del plátano en la línea de abajo
    const real = await page.evaluate(() => { const P = window.PG;
      const r = P.ticketLeer(['MERCADONA, S.A.', 'CL REPÚBLICA Doy', '35010 LAS PALMAS', 'Descripció. <P. Unit Imp.(e)', '1 FIAMBRE LOMO ADOBADO 2,81',
        '4 ISOTÓNICO BLUE 0,52 2,08', '1 CHAMPÓ CITRUS H8S 3,80', '1 QUESO CURADO — 459', '1 JAMON S. EXTRA FINO 2/45', '| QUESO ROQUEFORT 1\'90',
        '1 PAN M.CEREALES $/GL 2,90', 'BACUETTE SG 1.95', '| DO CAOS MEDIANOS -H 3,25', 'GOS RUC', '1 PLATAND 2.00', '2104 kg 2,20 e/kg 4,63', 'TOTAL (£) — 133,61'].join('\n'));
      const by = (re) => r.items.filter((x) => re.test(x.nom))[0] || null;
      return { n: r.items.length, noms: r.items.map((x) => x.nom), platano: by(/plátano/), curado: by(/queso curado/), huevos: !!by(/^huevos medianos$/),
        vida: ['picada de vacuno', 'salmón marinado', 'lomo embuchado', 'champú citrus h&s', 'fritada pisto'].map((n) => { const v = P.vidaDe(n); return v ? (v.no ? 'no' : v.d) : null; }) }; });
    check('ticket real: 10 productos sin la dirección, precios torcidos, sin cantidad, huevos y el plátano con sus 2,104 kg; cada cosa con lo que aguanta',
      real.n === 10 && !real.noms.some((n) => /rep[uú]blica|palmas/.test(n)) && real.platano && Math.abs(real.platano.q - 2.104) < 0.001 && real.platano.uni === 'kg' &&
      real.curado && real.curado.nom === 'queso curado' && Math.abs(real.curado.eur - 4.59) < 0.001 && real.huevos && real.noms.includes('baguette sin gluten') &&
      real.vida.join() === '1,10,30,no,365', JSON.stringify(real));
    check('ticket de Mercadona: lee los productos (el plátano sin el «€/kg»), el total, y guarda la compra como lista habitual',
      tk.n === 4 && tk.platano && Math.abs(tk.total - 12.97) < 0.01 && tk.habitual === 4, JSON.stringify(tk));
    check('Dinero v7: una meta con fecha pide su €/mes y €/día; «Aplicar» crea inversión y caprichos, el colchón baja a 30 % y el reparto suma todo',
      din.men > 0 && din.meses === 4 && din.dia >= 1 && din.rep === 4 &&
      tras.puro === 30 && tras.min === 10 && tras.inv && tras.cap && tras.japon === din.men && tras.suma === 1000, JSON.stringify({ din, tras }));
  }

  // 224) SEGUIMIENTO Y CLASIFICACIÓN DE PLATOS: ✓ en Hoy apunta «del plan» y pregunta «¿qué tal?» por
  // el plato principal; 👍/👎 se guardan y sobreviven a recargar; «Mi semana» cuenta días, kcal,
  // proteína y plan/fuera/otro; la clasificación da una nota 0–100 y un 👎 baja el plato en «Móntamela»
  {
    await page.evaluate(() => { const P = window.PG; window.__copia224 = JSON.parse(JSON.stringify(P.store));
      P.store.food.objetivo = { kcal: 2470, prot: 140 }; P.store.food.votos = {}; P.store.food.log[P.iso(new Date())] = [];
      P.ui.h2Voto = null; P.ui.tab = 'food'; P.ui.foodVista = ''; P.ui.foodDate = ''; P.render(); });
    const ok = await page.$('#main .h2ok'); if (ok) { await ok.click(); await page.waitForTimeout(150); }
    const pregunta = await page.evaluate(() => ({ txt: (document.querySelector('.h2vot') || {}).innerText || '', id: (window.PG.ui.h2Voto || {}).id,
      plan: window.PG.foodLog(window.PG.iso(new Date())).every((x) => x.plan === 1) }));
    const bot = await page.$('.h2vot [data-v="1"]'); if (bot) { await bot.click(); await page.waitForTimeout(120); }
    const tras = await page.evaluate((id) => { const P = window.PG, v = (P.store.food.votos || {})[id], n = P.normalize(JSON.parse(JSON.stringify(P.store)));
      return { v, vuelta: ((n.food.votos || {})[id] || {}).up, cerrada: !document.querySelector('.h2vot') }; }, pregunta.id);
    await page.click('.h2seg [data-v="misemana"]'); await page.waitForTimeout(150);
    const sem = await page.evaluate(() => { const S = window.PG.semanaComida(0);
      return { n: S.n, prot: S.prot, plan: S.tipo && S.tipo.plan, barras: document.querySelectorAll('#main .msb > div').length, alto: document.querySelector('#main').scrollHeight }; });
    await page.click('#main .subcab .volver'); await page.waitForTimeout(100);
    await page.click('.h2seg [data-v="misplatos"]'); await page.waitForTimeout(150);
    const rk = await page.evaluate(() => { const P = window.PG, R = P.platoRanking(), d = R[0].d.id;
      const antes = R.filter((x) => x.d.id === d)[0].nota; P.platoVotar(d, -1); P.platoVotar(d, -1);
      const desp = P.platoRanking().filter((x) => x.d.id === d)[0].nota;
      return { filas: document.querySelectorAll('#main .mprk').length, rango: R.every((x) => x.nota >= 0 && x.nota <= 100), antes, desp }; });
    await page.click('[data-a="mp-f"][data-v="prot"]'); await page.waitForTimeout(100);
    const prot = await page.$$eval('#main .mprk .t > span', (e) => e.map((x) => parseInt(x.textContent, 10)));
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia224; P.save(); P.ui.h2Voto = null; P.ui.mpF = ''; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('Hoy: ✓ apunta lo del plan y pregunta «¿qué tal?» por el plato principal; el 👍 se guarda y sobrevive a recargar',
      /¿Qué tal/.test(pregunta.txt) && pregunta.plan && tras.v && tras.v.up === 1 && tras.vuelta === 1 && tras.cerrada, JSON.stringify({ pregunta, tras }));
    check('Mi semana: días apuntados, proteína, % del plan y una barra por día, en una pantalla',
      sem.n >= 1 && sem.plan === 100 && sem.barras === 7 && sem.alto < 1000, JSON.stringify(sem));
    check('clasificación: nota 0–100, dos 👎 bajan el plato, y «Más proteína» ordena por proteína',
      rk.filas >= 3 && rk.rango && rk.desp < rk.antes && prot.length >= 3 && prot.every((v, i) => i === 0 || prot[i - 1] >= v), JSON.stringify({ rk, prot }));
  }

  // 225) COMER CON LO QUE HAY, encadenado con los productos de un ticket real:
  //  · la tabla reconoce los 42 productos (antes 16) y la nevera es UNA (las rutas viejas llevan a ella);
  //  · la compra, con la semana de ejemplo y ya comprado, no pide patatas ni puerros y dice lo que compraste;
  //  · «bocata de pavo con queso y mayo» → pan sin gluten (celíaco), fiambre, queso y mayo de la nevera;
  //    el tamaño escala; Enter apunta; dos veces en la semana → «guardar como plato»;
  //  · ¿Qué como?: plato, bowl y bocata salen con lo de la nevera y «Me lo hago» lo apunta
  {
    const NOMS = ['fiambre lomo adobado','pechuga pollo ajillo','carrilladas al vino','isotónico blue','fritada pisto','tomate frito a.oliva','macedonia de verdura',
      'c. fresa extra 0%','gouda lonchas','tahini','lenteja cocida','salmón marinado','lomo embuchado','pollo extrafino','jamón extrafino','maria sin gluten',
      'entrecot novillo','barrita rellena lech','picada de vacuno','panna cotta','crema 100% cacahuete','mayonesa pequeña','cookie sin gluten y sin lactosa',
      'jardinera','boquerones al vinagr','guacamole 200 g','leche desnatada, prot p6','queso curado','nuez natural','proteina 0% natural','jamon s. extra fino',
      'queso roquefort','salsa piri piri','pan m.cereales s/glu','griego ligero natural','tortilla de maiz','nuez pecana','queso feta','baguette sin gluten',
      'kiwi verde bandeja','huevos medianos','plátano'];
    const base = await page.evaluate((noms) => { const P = window.PG; window.__copia225 = JSON.parse(JSON.stringify(P.store));
      P.store.perfil = Object.assign({}, P.store.perfil, { celiaco: true }); P.store.food.despensa = []; P.store.food.log = {};
      P.store.menu = JSON.parse(JSON.stringify(P.DEFAULTS().menu)); P.store.dishes = JSON.parse(JSON.stringify(P.DEFAULTS().dishes)); P.store.semBase = { on: false, d: {} };
      noms.forEach((n) => P.despensaAdd(n, 1, '')); P.store.food.ultimaCompra = P.iso(new Date()); P.save();
      return { reconoce: noms.filter((n) => P.alimDeTexto(n)).length, nevera: P.food().nevera.length }; }, NOMS);
    const rutas = [];
    for (const v of ['nevera', 'nevera2']) { await page.evaluate((v) => { const P = window.PG; P.ui.tab = 'food'; P.ui.foodVista = v; P.render(); }, v); rutas.push(await page.evaluate(() => window.PG.ui.foodVista)); }
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'food'; P.ui.foodVista = 'cocina-panel'; P.ui.cocinaTab = 'nevera'; P.render(); }); rutas.push(await page.evaluate(() => window.PG.ui.foodVista));
    const nev = await page.evaluate(() => ({ grupos: document.querySelectorAll('#main .nvg').length, botones: document.querySelectorAll('#main .nvb button').length }));
    const compra = await page.evaluate(() => { const P = window.PG, d = P.compraDatos(); P.ui.tab = 'shop'; P.ui.shopVista = ''; P.render();
      const txt = document.getElementById('main').innerText;
      return { ejemplo: d.ejemplo, fresco: d.grupos[0][2].length, compraste: /Compraste hoy/.test(txt), patata: /Patata/.test(txt) }; });
    await page.evaluate(() => { const P = window.PG; P.ui.frase = null; P.ui.tab = 'food'; P.ui.foodVista = ''; P.ui.foodDate = ''; P.render(); });
    await page.fill('#frIn', 'bocata de pavo con queso y mayo'); await page.press('#frIn', 'Enter'); await page.waitForTimeout(150);
    const fr = await page.evaluate(() => { const P = window.PG, f = P.ui.frase; if (!f) return null;
      return { tipo: f.tipo,
        panSG: f.items.some((x) => x.pan) && f.items.filter((x) => x.pan).every((x) => /sin-gluten/.test(x.id)), ids: f.items.map((x) => x.id), casa: f.items.filter((x) => x.casa).length, g0: f.items[0].g, kcal: P.fraseMacros(f).kcal }; });
    await page.click('[data-a="fr-tam"][data-v="xl"]'); await page.waitForTimeout(80);
    const grande = await page.evaluate(() => ({ g: window.PG.ui.frase.items[0].g, kcal: window.PG.fraseMacros(window.PG.ui.frase).kcal }));
    await page.click('[data-a="fr-ok"]'); await page.waitForTimeout(150);
    const apuntado = await page.evaluate(() => { const P = window.PG, l = P.foodLog(P.iso(new Date())), e = l[l.length - 1]; return e ? { n: e.nombre, frase: !!e.frase, kcal: e.kcal } : null; });
    await page.evaluate(() => { const P = window.PG, l = P.foodLog(P.iso(new Date())), e = l[l.length - 1], d = new Date(); d.setDate(d.getDate() - 1);
      const k = P.iso(d); P.store.food.log[k] = [Object.assign({}, e, { id: 'fe225' })]; P.save(); P.render(); });
    const rep = await page.evaluate(() => window.PG.fraseRepetidas().length);
    const bt = await page.$('[data-a="fr-plato"]'); if (bt) { await bt.click(); await page.waitForTimeout(120); }
    const plato = await page.evaluate(() => { const d = window.PG.store.dishes[window.PG.store.dishes.length - 1]; return d && d.frase ? { n: d.name, ing: d.ingredients.length, kcal: d.kcal } : null; });
    const qc = await page.evaluate(() => { const P = window.PG; return ['plato', 'bowl', 'bocata'].map((t) => { const c = P.qcCombos(t); return { t, n: c.length, falta: c.filter((x) => x.falta.length).length, nombre: c[0] ? c[0].fr.txt : '' }; }); });
    await page.evaluate(() => { const P = window.PG; P.ui.qcTipo = 'bowl'; P.ui.foodVista = 'quecomo'; P.render(); });
    const antesQ = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date())).length);
    await page.click('.qcs [data-a="qc-hago"]'); await page.waitForTimeout(150);
    const trasQ = await page.evaluate(() => { const P = window.PG, l = P.foodLog(P.iso(new Date())); return { n: l.length, ult: (l[l.length - 1] || {}).nombre, vista: P.ui.foodVista }; });
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia225; P.save(); P.ui.frase = null; P.ui.qcTipo = ''; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('la tabla reconoce los 42 productos del ticket y la nevera es una sola (las rutas viejas llevan a la pestaña, con −/× en cada fila)',
      base.reconoce === 42 && base.nevera >= 38 && rutas.every((v) => v === 'nevera2') && nev.grupos >= 2 && nev.botones >= 10, JSON.stringify({ base, rutas, nev }));
    check('compra: con la semana de ejemplo y ya comprado, no pide los ingredientes de ejemplo y dice lo que compraste',
      compra.ejemplo && compra.fresco === 0 && compra.compraste && !compra.patata, JSON.stringify(compra));
    check('frase: «bocata de pavo con queso y mayo» → pan sin gluten, fiambre, queso y mayo de tu nevera; el tamaño escala y Enter/apuntar lo guarda',
      fr && fr.tipo === 'bocata' && fr.panSG && fr.ids.includes('al-fiambre-de-pavo') && fr.ids.includes('al-queso-gouda') && fr.ids.includes('al-mayonesa') && fr.casa >= 3 &&
      grande.g > fr.g0 && grande.kcal > fr.kcal && apuntado && apuntado.frase && /Bocata muy grande de pavo/.test(apuntado.n), JSON.stringify({ fr, grande, apuntado }));
    check('lo apuntado con frase dos veces en la semana se ofrece como plato y se guarda con sus ingredientes',
      rep === 1 && plato && plato.ing >= 4 && plato.kcal > 500, JSON.stringify({ rep, plato }));
    check('¿Qué como?: plato, bowl y bocata salen con lo de la nevera (todo en casa) y «Me lo hago» lo apunta',
      qc.every((x) => x.n >= 2 && x.falta === 0 && x.nombre) && trasQ.n === antesQ + 1 && /^Bowl de/.test(trasQ.ult) && trasQ.vista === '', JSON.stringify({ qc, trasQ }));
  }

  // 226) HOY CON DETALLE: lo apuntado con frase sale en su fila sin tocar nada; al tocarla, su hoja dice
  // qué lleva, el reparto de macros y lo que aporta del día; tamaño escala también los micros; se mueve
  // de comida y se borra; los seis micros de arriba y la pantalla de micros dicen qué falta y con qué
  {
    const r = await page.evaluate(() => { const P = window.PG; window.__copia226 = JSON.parse(JSON.stringify(P.store));
      P.store.perfil = Object.assign({}, P.store.perfil, { celiaco: true }); P.store.food.objetivo = { kcal: 2240, prot: 134 };
      P.store.food.log[P.iso(new Date())] = []; P.store.food.despensa = [];
      ['leche desnatada, prot p6', 'gouda lonchas', 'mayonesa pequeña', 'baguette sin gluten', 'pollo extrafino', 'barrita rellena lech', 'salmón marinado'].forEach((t) => P.despensaAdd(t, 1, ''));
      P.ui.frase = null; P.ui.feVer = ''; P.ui.tab = 'food'; P.ui.foodVista = ''; P.ui.foodDate = ''; P.render();
      return { leche: P.fraseLeer('Leche').items.map((x) => x.id).join() }; });
    await page.fill('#frIn', 'bocata de pollo con queso y mayo'); await page.press('#frIn', 'Enter'); await page.waitForTimeout(120);
    await page.click('[data-a="fr-ok"]'); await page.waitForTimeout(150);
    const filas = await page.evaluate(() => ({ n: document.querySelectorAll('#main .h2en').length, txt: (document.querySelector('#main .h2en') || {}).innerText || '',
      mic: document.querySelectorAll('#main .h2mic6 .v').length, conDato: [...document.querySelectorAll('#main .h2mic6 .v > i')].some((i) => parseFloat(i.style.height) > 0) }));
    await page.click('#main .h2en'); await page.waitForTimeout(150);
    const hoja = await page.evaluate(() => { const h = document.querySelector('.fehoja'); return h ? { ing: h.querySelectorAll('.feing').length, mic: h.querySelectorAll('.femic').length, stk: h.querySelectorAll('.festk i').length } : null; });
    const antes = await page.evaluate(() => { const e = window.PG.foodLog(window.PG.iso(new Date()))[0]; return { kcal: e.kcal, ca: (e.mi || {}).ca }; });
    await page.click('.fehoja [data-a="fe-more"]'); await page.waitForTimeout(120);
    const mas = await page.evaluate(() => { const e = window.PG.foodLog(window.PG.iso(new Date()))[0]; return { kcal: e.kcal, ca: (e.mi || {}).ca, rac: e.rac }; });
    await page.selectOption('.fehoja select', 'cena'); await page.waitForTimeout(100);
    const p = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date()))[0].p);
    await page.evaluate(() => { const P = window.PG; P.ui.feVer = ''; P.ui.foodVista = 'micros'; P.render(); });
    const mic = await page.evaluate(() => ({ falta: /LO QUE MÁS TE FALTA/.test(document.querySelector('#main').innerText), con: /en tu nevera/.test(document.querySelector('#main').innerText) }));
    await page.evaluate(() => { const P = window.PG; P.ui.foodVista = ''; P.render(); P.ui.feVer = P.foodLog(P.iso(new Date()))[0].id; P.render(); });
    await page.click('.fehoja [data-a="fe-borrar"]'); await page.waitForTimeout(120);
    const borrado = await page.evaluate(() => ({ n: window.PG.foodLog(window.PG.iso(new Date())).length, hoja: !!document.querySelector('.fehoja') }));
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia226; P.save(); P.ui.feVer = ''; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('frase: «leche» es tu leche (no la barrita de leche) y lo apuntado sale en su fila, con micros arriba',
      /^al-leche-desnatada-con-prote/.test(r.leche) && filas.n === 1 && /Bocata de pollo/.test(filas.txt) && filas.mic === 6 && filas.conDato, JSON.stringify({ r, filas }));
    check('la hoja de una toma: qué lleva, reparto de macros y lo que aporta; + escala kcal y micros; se mueve y se borra',
      hoja && hoja.ing === 4 && hoja.mic >= 3 && hoja.stk === 3 && mas.rac === 1.5 && Math.abs(mas.kcal - antes.kcal * 1.5) <= 2 && mas.ca > antes.ca &&
      p === 'cena' && mic.falta && mic.con && borrado.n === 0 && !borrado.hoja, JSON.stringify({ hoja, antes, mas, p, mic, borrado }));
  }

  // 227) MONCHIS Y CONSUMO: con Lloretazo hoy, Hoy avisa y enseña los monchis con tope y opciones de la
  // nevera (primero lo que sacia); «＋» lo apunta en «Monchis»; 🌿 Consumo apunta una sesión en dos
  // toques, cuenta la semana contra el objetivo, sobrevive a recargar, y está en el cajón
  {
    const r = await page.evaluate(() => { const P = window.PG; window.__copia227 = JSON.parse(JSON.stringify(P.store));
      P.store.food.objetivo = { kcal: 2240, prot: 134 }; P.store.food.log[P.iso(new Date())] = []; P.store.food.despensa = []; delete P.store.food.monchisTope;
      ['griego ligero natural', 'nuez natural', 'kiwi verde bandeja', 'maria sin gluten', 'panna cotta', 'cookie sin gluten y sin lactosa'].forEach((t) => P.despensaAdd(t, 1, ''));
      P.store.eventos = (P.store.eventos || []).filter((e) => !e.lloret); P.lloretPoner(P.iso(new Date())); delete P.store.consumo;
      P.ui.frase = null; P.ui.feVer = ''; P.ui.tab = 'food'; P.ui.foodVista = ''; P.ui.foodDate = ''; P.render();
      const c = document.querySelector('.mcard'); const op = P.monchisOpciones();
      return { aviso: !!document.querySelector('.mcll'), card: !!c, sanos: op.sanos.length, capr: op.caprichos.length, primero: op.sanos[0] && op.sanos[0].n,
        tope: /500/.test(c ? c.innerText : '') }; });
    await page.click('.mcard [data-a="mc-add"]'); await page.waitForTimeout(150);
    const tras = await page.evaluate(() => { const P = window.PG, l = P.foodLog(P.iso(new Date())); return { pos: l.map((x) => x.p).join(), m: P.monchisKcal(P.iso(new Date())) }; });
    await page.evaluate(() => { const P = window.PG; P.ui.cnF = null; P.ui.cnVista = ''; P.ui.tab = 'consumo'; P.render(); });
    await page.click('[data-a="cn-f"][data-k="forma"][data-v="dry"]'); await page.click('[data-a="cn-f"][data-k="g"][data-v="0.1"]'); await page.click('[data-a="cn-add"]'); await page.waitForTimeout(120);
    const cn = await page.evaluate(() => { const P = window.PG, s = P.consumoS().ses, n = P.normalize(JSON.parse(JSON.stringify(P.store)));
      return { n: s.length, ses: s[0] && (s[0].forma + ' ' + s[0].g + ' ' + s[0].ctx), semana: P.consumoSemana(P.iso(P.mondayOf(new Date()))).n, vuelta: (n.consumo || { ses: [] }).ses.length,
        kpi: (document.querySelector('#main .mskpi') || {}).innerText || '' }; });
    await page.click('[data-a="cn-vista"][data-v="efectos"]'); await page.waitForTimeout(100);
    const ef = await page.evaluate(() => /DÍAS CON SESIÓN/.test(document.querySelector('#main').innerText) && /no consejo médico/.test(document.querySelector('#main').innerText));
    const cajon = await page.evaluate(() => [...document.querySelectorAll('#drawer [data-a="drawer-nav"]')].some((b) => b.dataset.t === 'consumo'));
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia227; P.save(); P.ui.cnVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('Lloretazo hoy: aviso y monchis con tope (500) y opciones de tu nevera, lo que sacia primero; «＋» lo apunta en Monchis',
      r.aviso && r.card && r.tope && r.sanos >= 2 && r.capr >= 1 && /Yogur griego/.test(r.primero) && tras.pos === 'monchis' && tras.m > 100, JSON.stringify({ r, tras }));
    check('🌿 Consumo: una sesión en dos toques (dry, 0,1 g, Lloretazo), la semana la cuenta, sobrevive a recargar, «cómo te afecta» y está en el cajón',
      cn.n === 1 && cn.ses === 'dry 0.1 lloret' && cn.semana === 1 && cn.vuelta === 1 && /objetivo ≤ 4/.test(cn.kpi) && ef && cajon, JSON.stringify({ cn, ef, cajon }));
  }

  // 228) PLAN DE LA SEMANA CON LO QUE HAY y DINERO EDITABLE: con el menú vacío, «Móntamela» rellena las
  // 21 comidas con lo de la nevera; el día de guardia come y cena «Menú del hospital (aprox.)»; Hoy enseña
  // el plan; Hoy cocino ofrece platos de la nevera y «hecho» lo cocina. En Dinero se cambia el % de ahorro,
  // el reparto (siempre suma 100, y vuelve al recomendado) y lo que llevas en una hucha
  {
    const NOMS = ['pechuga pollo ajillo', 'gouda lonchas', 'lenteja cocida', 'salmón marinado', 'pollo extrafino', 'jamón extrafino', 'maria sin gluten',
      'picada de vacuno', 'mayonesa pequeña', 'leche desnatada, prot p6', 'nuez natural', 'queso feta', 'baguette sin gluten', 'kiwi verde bandeja',
      'huevos medianos', 'plátano', 'tortilla de maiz', 'griego ligero natural', 'tomate frito a.oliva', 'fritada pisto'];
    const r = await page.evaluate((noms) => { const P = window.PG; window.__copia228 = JSON.parse(JSON.stringify(P.store));
      P.store.perfil = Object.assign({}, P.store.perfil, { celiaco: true }); P.store.menu = {}; P.store.semBase = { on: true, d: {} };
      P.store.food.despensa = []; P.store.food.cocinado = []; noms.forEach((n) => P.despensaAdd(n, 1, ''));
      const lun = P.mondayOf(new Date()), kg = P.iso(P.addDays(lun, 3));
      const g = (P.store.shifts || []).find((s) => P.isGuardia(s)); if (g) { P.store.rotation.daySet = Object.assign({}, P.store.rotation.daySet, { [kg]: g.id }); }
      P.save(); P.ui.tab = 'types'; P.ui.typesVista = ''; P.render(); return { kg, guardia: P.esDiaGuardia(kg) }; }, NOMS);
    await page.click('[data-a="ss-auto"]'); await page.waitForTimeout(250);
    const sb = await page.evaluate(() => { const P = window.PG, flash = (document.getElementById('flash') || {}).textContent || '', d = P.store.semBase.d;
      let llenas = 0; const hosp = [];
      Object.keys(d).forEach((w) => Object.keys(d[w]).forEach((c) => { const it = d[w][c].items || []; if (it.length) llenas++; if (it.some((x) => x.id === 'd-hospital')) hosp.push(w + c); }));
      return { flash, llenas, hosp }; });
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'food'; P.ui.foodVista = ''; P.ui.foodDate = ''; P.render(); });
    const hoy = await page.$$eval('#main .h2mom', (e) => e.filter((x) => /\S/.test(x.innerText)).length);
    await page.evaluate(() => { const P = window.PG; P.ui.foodVista = 'hoycocino'; P.render(); });
    const hc = await page.$$eval('.hcop .t b', (e) => e.map((x) => x.textContent));
    const ok = await page.$('[data-a="hc-ok"]'); if (ok) { await ok.click(); await page.waitForTimeout(200); }
    const coc = await page.evaluate(() => (window.PG.store.food.cocinado || []).length);
    await page.evaluate(() => { const P = window.PG; P.ui.foodVista = ''; P.ui.tab = 'dinero'; P.ui.dinTab = 'plan'; P.ui.dineroVista = ''; P.render(); });
    const m0 = await page.evaluate(() => window.PG.ahorroS().metaPct);
    await page.click('[data-a="d7-meta"][data-d="5"]'); await page.waitForTimeout(80);
    const m1 = await page.evaluate(() => window.PG.ahorroS().metaPct);
    await page.click('[data-a="d7-rep"][data-k="inversion"][data-d="5"]'); await page.waitForTimeout(80);
    const plan = await page.evaluate(() => { const p = window.PG.ahorroS().plan7 || {}; return { p, suma: Object.values(p).reduce((a, b) => a + b, 0) }; });
    await page.click('[data-a="d7-rec"]'); await page.waitForTimeout(80);
    const rec = await page.evaluate(() => !window.PG.ahorroS().plan7);
    await page.click('.d7seg [data-v="metas"]'); await page.waitForTimeout(100);
    const meta = await page.$('.d7meta[data-h]'); if (meta) { await meta.click(); await page.waitForTimeout(120); }
    const inp = await page.$('input[data-a="din-hu-campo"][data-k="saldo"]');
    if (inp) { await inp.fill('1234,5'); await inp.dispatchEvent('change'); await page.waitForTimeout(120); }
    const hu = await page.evaluate(() => window.PG.ahorroS().huchas.some((h) => h.saldo === 1234.5));
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia228; P.save(); P.ui.foodVista = ''; P.ui.dineroVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('«Móntamela» con el menú vacío rellena la semana con lo de la nevera, y la guardia come y cena el menú del hospital',
      r.guardia && /comidas puestas/.test(sb.flash) && sb.llenas >= 20 && sb.hosp.includes('3comida') && sb.hosp.includes('3cena') && !sb.hosp.includes('3desayuno') && hoy >= 3, JSON.stringify({ r, sb, hoy }));
    check('Hoy cocino ofrece platos de tu nevera y «hecho» lo deja cocinado', hc.length >= 2 && coc >= 1, JSON.stringify({ hc, coc }));
    check('Dinero: el % de ahorro y el reparto se cambian (suma 100 y vuelve al recomendado) y lo que llevas en una hucha se corrige a mano',
      m1 === (m0 == null ? 30 : m0) + 5 && plan.suma === 100 && plan.p.inversion > 0 && rec && hu, JSON.stringify({ m0, m1, plan, rec, hu }));
  }

  // 229) LA SEMANA LLEGA A LA PROTEÍNA: «Móntamela» reparte la proteína (desayunos con proteína de
  // verdad, más de lo que tiene proteína y extras de la nevera) y todos los días llegan; lo hecho con
  // la nevera cuenta como «en casa»; un día que no llega dice cuánto falta y «＋ ponerlo» lo sube.
  // En Consumo se apunta una sesión de ayer o de otro día
  {
    const NOMS = ['pechuga pollo ajillo', 'carrilladas al vino', 'fritada pisto', 'gouda lonchas', 'lenteja cocida', 'salmón marinado', 'pollo extrafino',
      'jamón extrafino', 'maria sin gluten', 'entrecot novillo', 'picada de vacuno', 'leche desnatada, prot p6', 'nuez natural', 'proteina 0% natural',
      'queso feta', 'baguette sin gluten', 'kiwi verde bandeja', 'huevos medianos', 'tortilla de maiz', 'griego ligero natural', 'lomo embuchado'];
    await page.evaluate((noms) => { const P = window.PG; window.__copia229 = JSON.parse(JSON.stringify(P.store));
      P.store.perfil = Object.assign({}, P.store.perfil, { celiaco: true }); P.store.food.objetivo = { kcal: 2240, prot: 134 };
      P.store.menu = {}; P.store.semBase = { on: true, d: {} }; P.store.food.despensa = []; P.store.food.cocinado = [];
      noms.forEach((n) => P.despensaAdd(n, 1, '')); P.save(); P.ui.tab = 'types'; P.ui.typesVista = ''; P.render(); }, NOMS);
    await page.click('[data-a="ss-auto"]'); await page.waitForTimeout(250);
    const sem = await page.evaluate(() => { const P = window.PG, ps = P.protSemana(), d = P.store.semBase.d, des = {};
      Object.keys(d).forEach((w) => { const it = (d[w].desayuno || { items: [] }).items[0]; if (it) des[P.dishById(it.id).name] = 1; });
      const txt = document.querySelector('#main').innerText;
      return { v: ps.map((x) => x.v), cortos: ps.filter((x) => x.corta).length, des: Object.keys(des).length,
        llegan: /todos los días llegan/.test(txt), enCasa: +((txt.match(/(\d+) de 21 comidas/) || [])[1] || 0) }; });
    await page.evaluate(() => { const P = window.PG, h = P.dishHospital();
      P.store.semBase.d[1] = { desayuno: { items: [{ kind: 'dish', id: h.id, portions: 1 }], meal: '' }, comida: { items: [{ kind: 'dish', id: h.id, portions: 1 }], meal: '' } };
      P.save(); P.render(); });
    const aviso = await page.evaluate(() => { const a = document.querySelector('#main .prav'); return a ? a.innerText.replace(/\s+/g, ' ') : ''; });
    const antes = await page.evaluate(() => window.PG.protSemana().filter((x) => x.w === 1)[0].v);
    await page.click('#main .prav [data-a="prot-extra"]'); await page.waitForTimeout(120);
    const despues = await page.evaluate(() => window.PG.protSemana().filter((x) => x.w === 1)[0].v);
    await page.evaluate(() => { const P = window.PG; delete P.store.consumo; P.ui.cnF = null; P.ui.cnVista = ''; P.ui.tab = 'consumo'; P.render(); });
    await page.click('[data-a="cn-f"][data-k="dia"][data-v="1"]'); await page.click('[data-a="cn-add"]'); await page.waitForTimeout(100);
    const otro = await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 5); return window.PG.iso(d); });
    const inp = await page.$('input[data-a="cn-fecha"]'); await inp.fill(otro); await inp.dispatchEvent('change'); await page.waitForTimeout(80);
    await page.click('[data-a="cn-add"]'); await page.waitForTimeout(100);
    const cn = await page.evaluate((otro) => { const P = window.PG, d = new Date(); d.setDate(d.getDate() - 1);
      const f = P.consumoS().ses.map((x) => x.fecha); return { ayer: f.includes(P.iso(d)), otro: f.includes(otro), filas: document.querySelectorAll('#main .cnrow').length,
        futuro: P.cnFechaDe({ fecha: '2999-01-01' }) === P.iso(new Date()) }; }, otro);
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia229; P.save(); P.ui.cnF = null; P.ui.tab = 'hoy'; P.render(); });
    check('«Móntamela» llega a la proteína todos los días, con desayunos distintos, y lo de la nevera cuenta como en casa',
      sem.cortos === 0 && sem.v.every((v) => v >= 120) && sem.des >= 3 && sem.llegan && sem.enCasa >= 18, JSON.stringify(sem));
    check('un día que no llega dice cuánto falta y con qué, y «＋ ponerlo» lo sube',
      /te faltan \d+ g/.test(aviso) && /Añade/.test(aviso) && despues > antes, JSON.stringify({ aviso, antes, despues }));
    check('Consumo: se apunta una sesión de ayer y de otro día (nunca en el futuro) y salen en los últimos 7 días',
      cn.ayer && cn.otro && cn.filas === 2 && cn.futuro, JSON.stringify(cn));
  }

  // 230) AJUSTAR LO DE AYER: en Comer se va al día anterior y en la hoja de una toma apuntada a mano
  // el ± escala media ración (antes sumaba 25 raciones: 500 kcal → 13.000) y «corregir a mano»
  // cambia nombre y kcal; el ± sigue desde lo corregido
  {
    const K = await page.evaluate(() => { const P = window.PG; window.__copia230 = JSON.parse(JSON.stringify(P.store));
      const d = new Date(); d.setDate(d.getDate() - 1); const k = P.iso(d);
      P.store.food.log[k] = [{ id: 'fx230', p: 'comida', nombre: 'Lentejas', kcal: 500, prot: 25, carb: 60, gresa: 10, rac: 1 }];
      P.save(); P.ui.feVer = ''; P.ui.frase = null; P.ui.tab = 'food'; P.ui.foodVista = ''; P.ui.foodDate = ''; P.render(); return k; });
    await page.click('[data-a="food-prev"]'); await page.waitForTimeout(100);
    await page.click('#main .h2en'); await page.waitForTimeout(120);
    const e = () => page.evaluate((K) => { const x = window.PG.foodLog(K)[0]; return { n: x.nombre, kcal: x.kcal, rac: x.rac }; }, K);
    await page.click('.fehoja [data-a="fe-more"]'); await page.waitForTimeout(100); const mas = await e();
    await page.click('.fehoja .fecorr summary');
    const ik = await page.$('.fehoja input[data-k="kcal"]'); await ik.fill('620'); await ik.dispatchEvent('change'); await page.waitForTimeout(100);
    const inn = await page.$('.fehoja input[data-k="nombre"]'); await inn.fill('Lentejas con chorizo'); await inn.dispatchEvent('change'); await page.waitForTimeout(100);
    const corr = await e();
    await page.click('.fehoja [data-a="fe-less"]'); await page.waitForTimeout(100); const menos = await e();
    const hoyIntacto = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date())).every((x) => x.id !== 'fx230'));
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia230; P.save(); P.ui.feVer = ''; P.ui.feCorr = false; P.ui.foodDate = ''; P.ui.tab = 'hoy'; P.render(); });
    check('lo de ayer se ajusta: ± escala media ración, se corrige a mano (nombre y kcal) y el ± sigue desde ahí',
      mas.kcal === 750 && mas.rac === 1.5 && corr.n === 'Lentejas con chorizo' && corr.kcal === 620 && menos.rac === 1 && Math.abs(menos.kcal - 413) <= 1 && hoyIntacto,
      JSON.stringify({ mas, corr, menos, hoyIntacto }));
  }

  // 231) COMER = LA SEMANA: «Comer» abre una sola pantalla (sin fila de modos) con tres avisos, hoy con
  // ✓ y la frase, y la semana; ✨ monta tandas solo los días que se cocina (guardia = hospital), y
  // una tanda es algo que aguanta (no una tortilla); «✓ hecho» la convierte en táperes; la compra
  // pide el pan sin gluten si eres celíaco; ⚙️ guarda horno y días sin cocinar; los gramos de la
  // frase se escriben; 📊 lleva al registro de calorías
  {
    await page.evaluate(() => { const P = window.PG; window.__copia231 = JSON.parse(JSON.stringify(P.store));
      P.store.perfil = Object.assign({}, P.store.perfil, { celiaco: true }); P.store.food.objetivo = { kcal: 2240, prot: 134 };
      P.store.menu = P.store.menu || {}; P.store.semBase = { on: true, d: {} }; P.store.food.despensa = []; P.store.food.cocinado = []; delete P.store.food.pref; delete P.store.food.tandasHechas;
      ['pechuga pollo ajillo', 'gouda lonchas', 'lenteja cocida', 'salmón marinado', 'pollo extrafino', 'baguette sin gluten', 'huevos medianos', 'proteina 0% natural', 'kiwi verde bandeja', 'nuez natural', 'fritada pisto', 'queso feta'].forEach((n) => P.despensaAdd(n, 1, ''));
      P.ui.cjeHoja = null; P.ui.frase = null; P.save(); P.render(); });
    await gotoTab('month');
    await page.click('[data-a="nav-comer"]'); await page.waitForTimeout(150);
    const entra = await page.evaluate(() => ({ v: window.PG.ui.foodVista, modos: document.getElementById('calModes').hidden, seg: document.querySelectorAll('#main [data-a="cje-tab"]').length, comidas: document.querySelectorAll('#main .cjmm').length }));
    await page.evaluate(() => { const P = window.PG; P.cjeAuto({ rehacer: 'todo' }); P.render(); }); await page.waitForTimeout(200);
    await page.click('#main [data-a="cje-tab"][data-v="sem"]'); await page.waitForTimeout(120);
    const sem = await page.evaluate(() => { const P = window.PG, T = P.tandasSemana();
      return { tandas: T.tandas.map((t) => ({ n: t.d.name, cook: T.sem[t.cook].tipo.cocina, dias: t.dias.length })),
        guardiaHosp: T.sem.filter((x) => x.tipo.guardia).every((x) => (P.dishById((x.cls.comida.items[0] || {}).id) || {}).hospital),
        dias: document.querySelectorAll('#main .cjwk').length }; });
    await page.click('#main [data-a="cje-hoja"][data-v="cocinar"]'); await page.waitForTimeout(120);
    const hayHoja = await page.evaluate(() => document.querySelectorAll('#hojaDia .cjtd').length);
    const bh = await page.$('#hojaDia [data-a="cje-hecho"]'); if (bh) { await bh.click(); await page.waitForTimeout(120); }
    const coc = await page.evaluate(() => (window.PG.store.food.cocinado || []).reduce((a, x) => a + x.total, 0));
    await page.click('#hojaDia .hgrab'); await page.waitForTimeout(100);
    const sg = await page.evaluate(() => [window.PG.compraSG('Pan de masa madre'), window.PG.compraSG('Pasta'), window.PG.compraSG('Leche')]);
    await page.click('#main [data-a="cje-hoja"][data-v="pref"]'); await page.waitForTimeout(120);
    await page.click('#hojaDia [data-a="cje-noc"][data-v="saliente"]'); await page.waitForTimeout(80);
    await page.click('#hojaDia [data-a="cje-taper"][data-v="4"]'); await page.waitForTimeout(80);
    const pref = await page.evaluate(() => { const P = window.PG, n = P.normalize(JSON.parse(JSON.stringify(P.store))); return n.food.pref; });
    await page.click('#hojaDia .hgrab'); await page.waitForTimeout(100);
    await page.click('#main [data-a="cje-tab"][data-v="hoy"]'); await page.waitForTimeout(120);
    const okd = await page.$('#main [data-a="cje-ok"][data-p="desayuno"]'); if (okd) { await okd.click(); await page.waitForTimeout(120); }
    const des = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date())).filter((e) => e.p === 'desayuno').length);
    await page.click('#main [data-a="cje-mom"][data-p="comida"]'); await page.waitForTimeout(120);
    await page.fill('#frIn', 'bocata de pollo con queso'); await page.press('#frIn', 'Enter'); await page.waitForTimeout(120);
    const g0 = await page.$('input[data-a="fr-gset"]'); if (g0) { await g0.fill('130'); await g0.dispatchEvent('change'); await page.waitForTimeout(100); }
    const gr = await page.evaluate(() => (window.PG.ui.frase && window.PG.ui.frase.items[0] || {}).g);
    await page.evaluate(() => { const P = window.PG; P.ui.frase = null; P.ui.cjeHoja = { v: 'dia' }; P.render(); }); await page.waitForTimeout(100);
    await page.click('#hojaDia [data-a="cje-registro"]'); await page.waitForTimeout(120);
    const reg = await page.evaluate(() => window.PG.ui.foodVista === '' && !!document.querySelector('#main .h2nav'));
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia231; P.save(); P.ui.cjeHoja = null; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('«Comer» es una pantalla: Hoy · Semana, hoy con sus comidas, la semana con sus 7 días, sin fila de modos',
      entra.v === 'eje' && entra.modos && entra.seg === 2 && entra.comidas >= 3 && sem.dias === 7, JSON.stringify({ entra, sem }));
    check('✨ monta tandas solo en días que se cocina, que aguantan (no tortillas), guardia = hospital; ✓ hecho las hace táperes',
      sem.tandas.length >= 1 && sem.tandas.every((t) => t.cook && t.dias >= 2 && !/tortilla|bocata/i.test(t.n)) && sem.guardiaHosp && hayHoja >= 1 && coc >= 2,
      JSON.stringify({ sem, hayHoja, coc }));
    check('celíaco: la compra pide pan y pasta sin gluten; ⚙️ guarda días sin cocinar y táper, y sobrevive a recargar',
      sg[0] === 'Pan sin gluten' && sg[1] === 'Pasta sin gluten' && sg[2] === 'Leche' && pref && pref.noCocinar.includes('saliente') && pref.taper === 4 && pref.horno === false,
      JSON.stringify({ sg, pref }));
    check('hoy: ✓ apunta el desayuno del plan, los gramos de la frase (en la hoja de la comida) se escriben y el detalle del día lleva al registro',
      des >= 1 && gr === 130 && reg, JSON.stringify({ des, gr, reg }));
  }

  // 232) MIS PLATOS Y RACIONES: desde la semana se abre «Mis platos» con filtros; desde un hueco,
  // tocar un plato lo pone ahí (y para una comida no salen desayunos ni batidos); ＋ crea un plato
  // escribiéndolo; en «Cocinar», + suma una ración sin quitársela a otra tanda y − la quita (mín. 2)
  {
    await page.evaluate(() => { const P = window.PG; window.__copia232 = JSON.parse(JSON.stringify(P.store));
      P.store.perfil = Object.assign({}, P.store.perfil, { celiaco: true }); P.store.food.objetivo = { kcal: 2240, prot: 134 };
      P.store.semBase = { on: true, d: {} }; P.store.food.despensa = []; P.store.food.cocinado = []; delete P.store.food.pref; delete P.store.food.tandasHechas;
      ['pechuga pollo ajillo', 'gouda lonchas', 'lenteja cocida', 'salmón marinado', 'pollo extrafino', 'baguette sin gluten', 'huevos medianos', 'proteina 0% natural', 'fritada pisto'].forEach((n) => P.despensaAdd(n, 1, ''));
      P.ui.cjeHoja = null; P.ui.frase = null; P.save(); P.render(); });
    await page.click('[data-a="nav-comer"]'); await page.waitForTimeout(120);
    await page.evaluate(() => { const P = window.PG; P.cjeAuto({ rehacer: 'todo' }); P.render(); }); await page.waitForTimeout(200);
    const t0 = await page.evaluate(() => window.PG.tandasSemana().tandas.map((t) => t.dias.length));
    await page.click('#main [data-a="cje-tab"][data-v="sem"]'); await page.waitForTimeout(120);
    await page.click('#main [data-a="cje-hoja"][data-v="cocinar"]'); await page.waitForTimeout(120);
    const mas = await page.$('#hojaDia [data-a="cje-rac"][data-i="0"][data-d="1"]'); if (mas) { await mas.click(); await page.waitForTimeout(120); }
    const t1 = await page.evaluate(() => window.PG.tandasSemana().tandas.map((t) => t.dias.length));
    const menos = await page.$('#hojaDia [data-a="cje-rac"][data-i="0"][data-d="-1"]'); if (menos) { await menos.click(); await page.waitForTimeout(120); }
    const t2 = await page.evaluate(() => window.PG.tandasSemana().tandas.map((t) => t.dias.length));
    await page.click('#hojaDia .hgrab'); await page.waitForTimeout(100);
    await page.click('#main [data-a="cje-tab"][data-v="hoy"]'); await page.waitForTimeout(120);
    await page.click('#main [data-a="cje-platos"]'); await page.waitForTimeout(120);
    const filtros = await page.$$eval('#hojaDia [data-a="cje-pfilt"]', (e) => e.length);
    await page.click('#hojaDia [data-a="cje-pfilt"][data-v="tanda"]'); await page.waitForTimeout(100);
    const tandas = await page.$$eval('#hojaDia .cjpl b', (e) => e.map((x) => x.textContent));
    await page.click('#hojaDia [data-a="cje-pnuevo"]'); await page.waitForTimeout(100);
    await page.fill('#cjNuevo', 'pollo al curry con arroz'); await page.click('#hojaDia [data-a="cje-pcrea"]'); await page.waitForTimeout(120);
    const creado = await page.evaluate(() => (window.PG.store.dishes || []).some((d) => d.name === 'Pollo al curry con arroz' && !d.nevera && d.ingredients.length >= 2));
    await page.click('#hojaDia .hgrab'); await page.waitForTimeout(100);
    await page.click('#main [data-a="cje-tab"][data-v="sem"]'); await page.waitForTimeout(120);
    await page.click('#main .cjwk .cjc'); await page.waitForTimeout(120);
    await page.click('#hojaDia [data-a="cje-platos"]'); await page.waitForTimeout(120);
    const lista = await page.$$eval('#hojaDia .cjpl b', (e) => e.map((x) => x.textContent));
    const destino = await page.evaluate(() => ({ w: window.PG.ui.cjeHoja.w, c: window.PG.ui.cjeHoja.c }));
    await page.click('#hojaDia .cjpl'); await page.waitForTimeout(120);
    const puesto = await page.evaluate((d) => { const P = window.PG, x = P.mSemana().filter((y) => y.w === d.w)[0]; return (P.dishById((x.cls[d.c].items[0] || {}).id) || {}).name; }, destino);
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia232; P.save(); P.ui.cjeHoja = null; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('«Cocinar»: + suma una ración sin quitársela a otra tanda y − la quita',
      t0.length >= 1 && t1[0] === t0[0] + 1 && t1.slice(1).join() === t0.slice(1).join() && t2[0] === t0[0], JSON.stringify({ t0, t1, t2 }));
    check('«Mis platos»: filtros, solo lo de tanda en «Para tanda», ＋ crea un plato escrito, y desde un hueco lo pone ahí sin desayunos ni batidos',
      filtros === 4 && tandas.length >= 1 && !tandas.some((n) => /tortilla|bocata|bowl/i.test(n)) && creado &&
      lista.length >= 2 && !lista.some((n) => /batido|whey|yogur|porridge|tostada/i.test(n)) && puesto === lista[0], JSON.stringify({ filtros, tandas, creado, lista: lista.slice(0, 4), puesto }));
  }

  // 233) AÑADIR Y QUITAR SIN PELEARSE: la pantalla de cantidad no se queda fija abajo tapando la
  // cabecera (compartía clase con las hojas que suben) y la cantidad se escribe; en la semana, lo
  // apuntado sale bajo su comida con × para quitarlo y al tocarlo se abre su hoja
  {
    await page.evaluate(() => { const P = window.PG; window.__copia233 = JSON.parse(JSON.stringify(P.store));
      P.store.food.log[P.iso(new Date())] = []; P.ui.frase = null; P.ui.feVer = ''; P.ui.cjeHoja = null; P.save(); P.render(); });
    await page.click('[data-a="nav-comer"]'); await page.waitForTimeout(120);
    const dv = await page.evaluate(() => { const d = (window.PG.store.dishes || []).find((x) => (+x.kcal || 0) > 200 && !x.hospital); return 'dish:' + d.id; });
    await page.evaluate((v) => { const P = window.PG; P.ui.foodSel = v; P.ui.foodCant = 1; P.ui.foodPos = 'comida'; P.ui.foodVista = 'cantidad'; P.render(); }, dv);
    const cant = await page.evaluate(() => { const h = document.querySelector('#main .hoja'); return { pos: h ? getComputedStyle(h).position : '', alto: document.body.scrollHeight, input: !!document.querySelector('#fcVal[data-a="food-cant-in"]') }; });
    const fi = await page.$('#fcVal'); if (fi) { await fi.fill('1.5'); await fi.dispatchEvent('change'); await page.waitForTimeout(100); }
    const c15 = await page.evaluate(() => window.PG.ui.foodCant);
    await page.click('[data-a="nav-comer"]'); await page.waitForTimeout(120);
    await page.evaluate(() => { window.PG.ui.cjeTab = ''; window.PG.render(); });
    await page.click('#main [data-a="cje-mom"][data-p="comida"]'); await page.waitForTimeout(120);
    await page.fill('#frIn', 'bocata de pollo con queso'); await page.press('#frIn', 'Enter'); await page.waitForTimeout(120);
    await page.click('[data-a="fr-ok"]'); await page.waitForTimeout(150);
    const chips = await page.$$eval('#hojaDia .cjit', (e) => e.length);
    await page.click('#hojaDia .cjit .n'); await page.waitForTimeout(120);
    const hoja = await page.evaluate(() => !!document.querySelector('#hojaDia .fehoja'));
    await page.click('#hojaDia [data-a="fe-cerrar"].hgrab').catch(() => {}); await page.evaluate(() => { window.PG.ui.feVer = ''; window.PG.render(); });
    await page.click('#hojaDia .cjit .x'); await page.waitForTimeout(120);
    const tras = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date())).length);
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia233; P.ui.cjeHoja = null; P.ui.foodDate = ''; P.ui.frPos = ''; P.save(); P.ui.feVer = ''; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('la cantidad no se queda fija abajo y se escribe; lo apuntado sale en la hoja de su comida con × y su hoja',
      cant.pos === 'relative' && cant.alto > 700 && cant.input && c15 === 1.5 && chips === 1 && hoja && tras === 0, JSON.stringify({ cant, c15, chips, hoja, tras }));
  }

  // 234) DESHACER: lo que acabas de apuntar se quita desde el aviso, y lo que acabas de quitar vuelve
  {
    await page.evaluate(() => { const P = window.PG; window.__copia234 = JSON.parse(JSON.stringify(P.store));
      P.store.perfil = Object.assign({}, P.store.perfil, { celiaco: true }); P.store.food.log[P.iso(new Date())] = [];
      P.ui.cjeHoja = null; P.ui.frase = null; P.save(); P.render(); });
    await page.click('[data-a="nav-comer"]'); await page.waitForTimeout(120);
    await page.click('#main [data-a="cje-mom"][data-p="desayuno"]'); await page.waitForTimeout(120);
    await page.fill('#frIn', 'yogur griego'); await page.press('#frIn', 'Enter'); await page.waitForTimeout(120);
    await page.click('[data-a="fr-ok"]'); await page.waitForTimeout(120);
    const n1 = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date())).length);
    const und = await page.$('#flash [data-a="deshacer"]'); if (und) { await und.click(); await page.waitForTimeout(120); }
    const n0 = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date())).length);
    await page.evaluate(() => { const P = window.PG; P.addFoodEntry(P.iso(new Date()), { macro: { nombre: 'Prueba', kcal: 100, prot: 5 }, pos: 'comida' }); P.render(); });
    const xb = await page.$('#hojaDia .cjit .x'); if (xb) { await xb.click(); await page.waitForTimeout(120); }
    const und2 = await page.$('#flash [data-a="deshacer"]'); if (und2) { await und2.click(); await page.waitForTimeout(120); }
    const vuelve = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date())).map((e) => e.nombre));
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia234; P.save(); P.ui.cjeHoja = null; P.ui.frPos = ''; P.ui.foodDate = ''; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('«Deshacer» en el aviso quita lo que acabas de apuntar y devuelve lo que acabas de quitar',
      n1 === 1 && n0 === 0 && vuelve.join() === 'Prueba', JSON.stringify({ n1, n0, vuelve }));
  }

  // 235) REHACER ENCIMA DE UNA SEMANA HECHA Y EDITAR UN PLATO: con la semana montada a mano, rehacerla
  // la cambia (antes no tocaba nada); en la hoja de un plato se cambia la ración y se quita
  {
    await page.evaluate(() => { const P = window.PG; window.__copia235 = JSON.parse(JSON.stringify(P.store));
      P.store.perfil = Object.assign({}, P.store.perfil, { celiaco: true }); P.store.food.objetivo = { kcal: 2240, prot: 134 };
      P.store.semBase = { on: true, d: {} }; P.store.food.despensa = []; P.store.food.cocinado = []; delete P.store.food.pref;
      ['pechuga pollo ajillo', 'gouda lonchas', 'lenteja cocida', 'salmón marinado', 'pollo extrafino', 'baguette sin gluten', 'huevos medianos', 'proteina 0% natural', 'fritada pisto'].forEach((n) => P.despensaAdd(n, 1, ''));
      const d0 = P.store.dishes.find((d) => !d.hospital); for (let w = 0; w < 7; w++) P.store.semBase.d[w] = { comida: { items: [{ kind: 'dish', id: d0.id, portions: 1 }], meal: '' }, cena: { items: [{ kind: 'dish', id: d0.id, portions: 1 }], meal: '' } };
      window.__d0 = d0.id; P.ui.cjeHoja = null; P.save(); P.render(); });
    await page.click('[data-a="nav-comer"]'); await page.waitForTimeout(120);
    const msg = await page.evaluate(() => { const P = window.PG, m = P.cjeAuto({ rehacer: 'todo' }); P.render(); return m; });
    const res = await page.evaluate(() => { const d = window.PG.store.semBase.d, ids = [];
      Object.keys(d).forEach((w) => ['comida', 'cena'].forEach((c) => { const it = (d[w][c] || { items: [] }).items[0]; if (it) ids.push(it.id); }));
      return { cambiada: ids.filter((id) => id !== window.__d0).length }; });
    await page.click('#main [data-a="cje-tab"][data-v="sem"]'); await page.waitForTimeout(120);
    const abre = await page.evaluate(() => { const b = [...document.querySelectorAll('#main .cjwk .cjc')].find((x) => !/Hospital|Como fuera|Nada/.test(x.textContent)); if (!b) return null; b.click(); return { w: +b.dataset.w, c: b.dataset.c }; });
    await page.waitForTimeout(150);
    const racs = await page.evaluate(() => document.querySelectorAll('#hojaDia [data-a="cje-rac2"]').length);
    const r15 = await page.$('#hojaDia [data-a="cje-rac2"][data-v="1.5"]'); if (r15) { await r15.click(); await page.waitForTimeout(100); }
    const por = await page.evaluate((a) => a ? window.PG.store.semBase.d[a.w][a.c].items[0].portions : null, abre);
    const qu = await page.$('#hojaDia [data-a="cje-quitar"]'); if (qu) { await qu.click(); await page.waitForTimeout(120); }
    const tras = await page.evaluate((a) => ({ hoja: !!window.PG.ui.cjeHoja, nada: a ? !!(window.PG.dishById(window.PG.store.semBase.d[a.w][a.c].items[0].id) || {}).nada : false }), abre);
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia235; P.save(); P.ui.cjeHoja = null; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('rehacer encima de una semana hecha la cambia y no dice «no he encontrado platos»',
      res.cambiada >= 8 && !/no he encontrado|no ha cambiado/.test(msg), JSON.stringify({ msg, res }));
    check('en la hoja de un plato se cambia la ración y se quita',
      abre && racs === 4 && por === 1.5 && !tras.hoja && tras.nada, JSON.stringify({ abre, racs, por, tras }));
  }

  // 236) SEMANAS PROTOTIPO: ✨ abre «Semanas prototipo»; se crea la semana A, «propónme uno» la llena
  // (comidas que se cocinan, cenas de sobras o rápidas, 2–3 desayunos); un hueco de cena ofrece
  // primero «sobras» de la comida; «usar esta semana» la monta (guardia = hospital) y la compra sale
  // de ahí; «la semana que viene» queda apuntada; duplicar crea la B; todo sobrevive a recargar
  {
    await page.evaluate(() => { const P = window.PG; window.__copia236 = JSON.parse(JSON.stringify(P.store));
      P.store.perfil = Object.assign({}, P.store.perfil, { celiaco: true }); P.store.food.objetivo = { kcal: 2240, prot: 134 };
      P.store.semBase = { on: true, d: {} }; P.store.food.despensa = []; P.store.food.cocinado = []; delete P.store.food.pref; delete P.store.food.semP;
      ['pechuga pollo ajillo', 'gouda lonchas', 'lenteja cocida', 'salmón marinado', 'pollo extrafino', 'baguette sin gluten', 'huevos medianos', 'proteina 0% natural', 'kiwi verde bandeja', 'nuez natural', 'fritada pisto'].forEach((n) => P.despensaAdd(n, 1, ''));
      P.ui.cjeHoja = null; P.ui.semPHoja = null; P.ui.semP = ''; P.save(); P.render(); });
    await page.click('[data-a="nav-comer"]'); await page.waitForTimeout(120);
    await page.click('#main .cji[data-v="semp"]'); await page.waitForTimeout(120);
    const vacio = await page.evaluate(() => ({ v: window.PG.ui.foodVista, crear: !!document.querySelector('#main [data-a="semp-nuevo"]'), modos: document.getElementById('calModes').hidden }));
    await page.click('#main [data-a="semp-nuevo"]'); await page.waitForTimeout(120);
    await page.click('#main [data-a="semp-proponer"]'); await page.waitForTimeout(300);
    const prop = await page.evaluate(() => { const p = window.PG.semPS().lista[0]; return { n: p.n, des: p.des.length, com: p.com.filter(Boolean).length, cen: p.cen.filter(Boolean).length,
      sobras: document.querySelectorAll('#main .spc .sob').length }; });
    /* el primer día con comida: su cena, ¿ofrece sobras? */
    const w = await page.evaluate(() => window.PG.semPS().lista[0].com.findIndex(Boolean));
    await page.click(`#main [data-a="semp-celda"][data-w="${w}"][data-c="cen"]`); await page.waitForTimeout(120);
    const primera = await page.evaluate(() => ((document.querySelector('#hojaDia .cjalt b') || {}).textContent || ''));
    await page.click('#hojaDia [data-a="semp-pon"][data-i="0"]'); await page.waitForTimeout(120);
    const sob = await page.evaluate((w) => { const p = window.PG.semPS().lista[0]; return p.cen[w] === p.com[w]; }, w);
    await page.click('#main [data-a="semp-usar"]:not([data-k$="x"])'); await page.waitForTimeout(150);
    const usada = await page.evaluate(() => { const P = window.PG, d = P.store.semBase.d, lun = P.mondayOf(new Date()), g = [];
      for (let i = 0; i < 7; i++) { const k = P.iso(P.addDays(lun, i)); if (P.esDiaGuardia(k)) g.push((P.dishById((d[i].comida.items[0] || {}).id) || {}).hospital); }
      const cd = P.compraDatos(); return { v: P.ui.foodVista, celdas: Object.keys(d).length, guardiaHosp: g.every(Boolean), compra: cd.total, uso: Object.keys(P.semPS().uso).length }; });
    await page.click('#main .cji[data-v="semp"]'); await page.waitForTimeout(120);
    const prox = await page.$$('#main [data-a="semp-usar"]'); if (prox[1]) { await prox[1].click(); await page.waitForTimeout(100); }
    await page.click('#main [data-a="semp-dup"]'); await page.waitForTimeout(120);
    const fin = await page.evaluate(() => { const P = window.PG, n = P.normalize(JSON.parse(JSON.stringify(P.store))), s = n.food.semP || {};
      return { lista: (s.lista || []).map((x) => x.n).join(), uso: Object.keys(s.uso || {}).length, tabs: document.querySelectorAll('#main .sptabs button').length }; });
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia236; P.save(); P.ui.semPHoja = null; P.ui.semP = ''; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('✨ abre las semanas prototipo; «propónme uno» llena comidas, cenas (con sobras) y 2–3 desayunos; la cena ofrece primero sobras',
      vacio.v === 'semp' && vacio.crear && vacio.modos && prop.n === 'A' && prop.des >= 2 && prop.com >= 5 && prop.cen >= 5 && prop.sobras >= 1 && /^Sobras/.test(primera) && sob,
      JSON.stringify({ vacio, prop, primera, sob }));
    check('«usar esta semana» monta la semana (guardia = hospital) y la compra sale de ella; la que viene se apunta, duplicar crea la B y sobrevive a recargar',
      usada.v === 'eje' && usada.celdas === 7 && usada.guardiaHosp && usada.compra >= 1 && usada.uso === 1 && fin.lista === 'A,B' && fin.uso === 2 && fin.tabs >= 3,
      JSON.stringify({ usada, fin }));
  }

  // 220) DESLIZAR NO RECARGA y «ATRÁS» SUBE DE NIVEL: el gesto de recargar está apagado; «‹ atrás»
  // (y el atrás del móvil) llevan de una sub‑pantalla a su madre y, desde la portada de una sección, a
  // la sección anterior saltándose lo que hiciste dentro; una hoja abierta se cierra primero; al
  // recargar se abre donde estabas
  {
    await page.evaluate(() => { const P = window.PG; P.ui.navHist = []; P.ui.tab = 'dinero'; P.ui.dineroVista = ''; P.render(); });
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'food'; P.ui.foodVista = ''; P.render(); });
    for (const v of ['quecomo', 'micros', '']) await page.evaluate((v) => { const P = window.PG; P.ui.foodVista = v; P.render(); }, v);
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'types'; P.ui.typesVista = 'montar'; P.render(); });
    await page.evaluate(() => { const P = window.PG; P.ui.typesVista = 'protos'; P.render(); });
    const antes = await page.evaluate(() => ({ visible: !document.getElementById('navAtras').hidden, os: getComputedStyle(document.documentElement).overscrollBehaviorY }));
    const donde = () => page.evaluate(() => window.PG.ui.tab + '/' + (window.PG.ui.typesVista || ''));
    await page.click('#navAtras'); await page.waitForTimeout(120); const uno = await donde();
    await page.click('#navAtras'); await page.waitForTimeout(120); const dos = await donde();
    await page.goBack(); await page.waitForTimeout(200);
    const tres = await page.evaluate(() => window.PG.ui.tab + '/' + (window.PG.ui.foodVista || ''));
    await page.click('#navAtras'); await page.waitForTimeout(120); const cuatro = await page.evaluate(() => window.PG.ui.tab);
    for (let i = 0; i < 6 && !(await page.evaluate(() => document.getElementById('navAtras').hidden)); i++) { await page.click('#navAtras'); await page.waitForTimeout(100); }
    const cinco = await page.evaluate(() => ({ tab: window.PG.ui.tab, oculto: document.getElementById('navAtras').hidden }));
    /* una hoja abierta: atrás la cierra sin cambiar de pantalla */
    await page.evaluate(() => { const P = window.PG; window.__log220 = JSON.parse(JSON.stringify(P.store.food.log[P.iso(new Date())] || []));
      P.store.food.log[P.iso(new Date())] = [{ id: 'fx220', p: 'comida', nombre: 'Prueba', kcal: 100, prot: 5, carb: 10, gresa: 2, rac: 1 }];
      P.ui.tab = 'food'; P.ui.foodVista = ''; P.ui.foodDate = ''; P.render(); P.ui.feVer = 'fx220'; P.render(); });
    const hayHoja = await page.evaluate(() => !!document.querySelector('#hojaDia .hoja'));
    /* con la hoja abierta, el atrás del móvil: la cierra y te quedas en Comer */
    await page.goBack(); await page.waitForTimeout(200);
    const hoja = await page.evaluate(() => ({ abierta: !!document.querySelector('#hojaDia .hoja'), tab: window.PG.ui.tab }));
    await page.evaluate(() => { const P = window.PG; P.store.food.log[P.iso(new Date())] = window.__log220; P.save(); });
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'types'; P.ui.typesVista = 'macros'; P.render(); });
    await page.reload(); await page.waitForFunction(() => window.PG && window.__arrancada); await page.waitForTimeout(250);
    const recarga = await page.evaluate(() => window.PG.ui.tab + '/' + (window.PG.ui.typesVista || ''));
    await page.evaluate(() => { try { localStorage.removeItem('guardias-vista'); } catch (e) {} const P = window.PG; P.ui.tab = 'hoy'; P.ui.typesVista = ''; P.render(); });
    check('deslizar no recarga; «atrás» sube de nivel (sub‑pantalla → su madre → sección anterior → Mes), cierra hojas y recargar abre donde estabas',
      antes.visible && antes.os === 'none' && uno === 'types/montar' && dos === 'types/' && tres === 'food/' && cuatro === 'dinero' &&
      cinco.tab === 'month' && cinco.oculto && hayHoja && !hoja.abierta && hoja.tab === 'food' && recarga === 'types/macros',
      JSON.stringify({ antes, uno, dos, tres, cuatro, cinco, hayHoja, hoja, recarga }));
  }


  // 237) COCINA tras la revisión: una tanda marcada hecha sigue en la lista (y se puede desmarcar); HOY
  // enseña lo mismo que la semana; la ✓ de un táper gasta UNA ración (no dos); «+ ración» no pisa
  // un «Como fuera» ni un «Nada»
  {
    await page.evaluate(() => { const P = window.PG; window.__copia237 = JSON.parse(JSON.stringify(P.store));
      P.store.semBase = { on: true, d: {} }; P.store.food.cocinado = []; P.store.food.tandasHechas = {};
      const k = P.iso(new Date()); P.store.food.log[k] = [];
      const d = { id: 'd237', name: 'Lentejas con verdura', icon: '🫘', portions: 1, kcal: 450, prot: 25 }; P.store.dishes.push(d);
      const w = (new Date().getDay() + 6) % 7; window.__w237 = w;
      for (let i = 0; i < 7; i++) ['comida', 'cena'].forEach((c) => P.sbPoner(i, c, (i % 2 ? P.dishFuera() : P.dishNada()).id));
      P.sbPoner(w, 'comida', 'd237'); P.sbPoner(w, 'cena', 'd237'); P.save(); P.render(); });
    const r = await page.evaluate(() => { const P = window.PG, w = window.__w237, k = P.iso(new Date());
      const t0 = P.tandasSemana().tandas.filter((t) => t.dishId === 'd237')[0];
      if (!t0) return { sinTanda: true };
      P.store.food.tandasHechas[t0.key + '|d237'] = k; P.cocinadoAdd('d237', t0.dias.length);
      const t1 = P.tandasSemana().tandas.filter((t) => t.dishId === 'd237')[0];
      const hoy = ((P.cjeHoyPlan(k).comida || [])[0] || {}).id;
      const antes = JSON.stringify(P.store.semBase.d);
      const mas = P.tandaRaciones(t1, 1);
      const pisa = JSON.stringify(P.store.semBase.d) !== antes;
      P.ui.tab = 'food'; P.ui.foodVista = 'eje'; P.ui.cjeTab = ''; P.ui.cjeHoja = null; P.render();
      return { dias: t0.dias.length, sigue: !!t1, hecho: !!(t1 && t1.hecho), hoy, mas, pisa }; });
    const ok = await page.$('#main [data-a="cje-ok"][data-p="comida"]'); if (ok) { await ok.click(); await page.waitForTimeout(120); }
    const queda = await page.evaluate(() => window.PG.cocinadoS().filter((c) => c.dishId === 'd237').reduce((a, c) => a + c.queda, 0));
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia237; P.save(); P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('tanda hecha sigue en la lista; HOY = la semana; ✓ de un táper gasta 1 ración; «+ ración» no pisa fuera/nada',
      !r.sinTanda && r.dias === 2 && r.sigue && r.hecho && r.hoy === 'd237' && r.mas === false && !r.pisa && !!ok && queda === 1,
      JSON.stringify({ r, ok: !!ok, queda }));
  }

  // 238) COMPRA más corta y sin mezclar las fijas: con «Esta semana» puesta, la lista sale de sus
  // platos hasta la próxima compra; lo de tus listas fijas va aparte y plegado, y lo que ya pide la
  // semana no se repite en ellas; el 🛒 de Comer cuenta solo lo de la semana
  {
    await page.evaluate(() => { const P = window.PG; window.__copia238 = JSON.parse(JSON.stringify(P.store));
      P.store.semBase = { on: true, d: {} }; P.store.food.despensa = []; P.store.food.cocinado = []; P.store.food.compraCada = 7;
      P.store.dishes.push({ id: 'd238', name: 'Garbanzos con espinacas', icon: '🫘', portions: 1, kcal: 400, prot: 20, ingredients: ['150 g garbanzos', '100 g espinacas'] });
      for (let i = 0; i < 7; i++) ['desayuno', 'comida', 'cena'].forEach((c) => P.sbPoner(i, c, c === 'comida' ? 'd238' : P.dishNada().id));
      P.store.listas = [{ id: 'l238', nombre: 'Habitual (tickets)', fija: true, habitual: true, items: ['garbanzos cocidos', 'papel higiénico', 'café molido'] }];
      P.ui.marks = new Set(); P.ui.cjeHoja = null; P.ui.tab = 'food'; P.ui.foodVista = 'eje'; P.ui.cjeTab = ''; P.save(); P.render(); });
    const datos = await page.evaluate(() => { const d = window.PG.compraDatos(), g = {}; d.grupos.forEach((x) => { g[x[0]] = x[2].map((y) => y.texto); });
      return { semana: d.semana, total: d.total, fresco: g.fresco, rutina: g.rutina, tile: document.querySelector('#main .cjlinks [data-v="compra"]').innerText.replace(/\D/g, '') }; });
    await page.click('#main .cjlinks [data-v="compra"]'); await page.waitForTimeout(120);
    const hoja = await page.evaluate(() => ({ items: document.querySelectorAll('#hojaDia .cjli').length, fijas: document.querySelectorAll('#hojaDia [data-a="cje-fija"]').length }));
    await page.click('#hojaDia [data-a="cje-fija"]'); await page.waitForTimeout(100);
    const abierta = await page.evaluate(() => document.querySelectorAll('#hojaDia .cjli').length);
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia238; P.save(); P.ui.cjeHoja = null; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('la compra sale de «Esta semana»; tus listas fijas van aparte y plegadas, sin repetir lo que ya pide la semana; 🛒 cuenta solo la semana',
      datos.semana === 2 && datos.fresco.some((x) => /garbanzo/i.test(x)) && datos.fresco.some((x) => /espinaca/i.test(x)) &&
      datos.rutina.length === 2 && !datos.rutina.some((x) => /garbanzo/i.test(x)) && datos.tile === '2' && hoja.items === 2 && hoja.fijas === 1 && abierta === 4,
      JSON.stringify({ datos, hoja, abierta }));
  }

  // 239) UN SOLO HOY: arriba «para hacer hoy» (la tanda que toca cocinar hoy); cada comida enseña lo
  // apuntado y el plan en gris (○ sin apuntar · ✓ verde lo del plan · ✓ azul otra cosa, «en vez de»);
  // la hoja de una comida apunta la frase EN esa comida, «no he cenado» la cierra; el total abre el
  // día por comidas y ‹ va a ayer; la pestaña Semana tiene los 7 días con su tipo y su proteína
  {
    await page.evaluate(() => { const P = window.PG; window.__copia239 = JSON.parse(JSON.stringify(P.store));
      const k = P.iso(new Date()), w = (new Date().getDay() + 6) % 7;
      P.store.perfil = Object.assign({}, P.store.perfil, { celiaco: true }); P.store.food.objetivo = { kcal: 2240, prot: 134 };
      P.store.semBase = { on: true, d: {} }; P.store.food.cocinado = []; P.store.food.tandasHechas = {}; P.store.food.log[k] = [];
      P.store.dishes.push({ id: 'd239', name: 'Lentejas con verdura', icon: '🫘', portions: 1, kcal: 450, prot: 25 }, { id: 'd239b', name: 'Tortilla con pavo', icon: '🍳', portions: 1, kcal: 420, prot: 32 });
      for (let i = 0; i < 7; i++) { P.sbPoner(i, 'desayuno', P.dishNada().id); P.sbPoner(i, 'comida', 'd239b'); P.sbPoner(i, 'cena', 'd239b'); }
      P.sbPoner(w, 'comida', 'd239'); P.sbPoner(w, 'cena', 'd239');
      P.addFoodEntry(k, { macro: { nombre: 'Comí fuera', kcal: 270, prot: 15 }, pos: 'comida' });
      P.ui.cjeHoja = null; P.ui.cjeTab = ''; P.ui.frase = null; P.ui.foodDate = ''; P.ui.tab = 'food'; P.ui.foodVista = 'eje'; P.save(); P.render(); });
    const hoy = await page.evaluate(() => { const fs = [...document.querySelectorAll('#main .cjmm')];
      const f = (n) => fs.find((x) => x.querySelector('.k').textContent === n);
      return { todo: [...document.querySelectorAll('#main .cjtd b')].map((b) => b.textContent),
        comida: { q: f('COMIDA').querySelector('.cjq').className, n: f('COMIDA').querySelector('.n').textContent, pl: (f('COMIDA').querySelector('.pl') || {}).textContent || '' },
        cena: { q: f('CENA').querySelector('.cjq').className, plan: f('CENA').querySelector('.n').classList.contains('plan') } }; });
    await page.click('#main .cjmm:nth-child(3) .tx'); await page.waitForTimeout(120);
    const titulo = await page.evaluate(() => (document.querySelector('#hojaDia .cjst') || {}).textContent);
    await page.fill('#frIn', 'yogur griego'); await page.press('#frIn', 'Enter'); await page.waitForTimeout(120);
    await page.click('[data-a="fr-ok"]'); await page.waitForTimeout(150);
    const cena = await page.evaluate(() => ({ p: window.PG.foodLog(window.PG.iso(new Date())).filter((e) => e.p === 'cena').length, items: document.querySelectorAll('#hojaDia .cjit').length }));
    await page.evaluate(() => { const P = window.PG; P.ui.cjeHoja = { v: 'mom', p: 'desayuno', k: P.iso(new Date()) }; P.render(); });
    const sinPlan = await page.evaluate(() => !document.querySelector('#hojaDia [data-a="cje-ok"]'));
    await page.click('#hojaDia [data-a="cje-nocome"]'); await page.waitForTimeout(120);
    const nada = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date())).some((e) => e.p === 'desayuno' && /No he desayunado/.test(e.nombre)));
    await page.evaluate(() => { window.PG.ui.cjeHoja = null; window.PG.render(); });
    await page.click('#main .cjln'); await page.waitForTimeout(120);
    const dia = await page.evaluate(() => ({ filas: document.querySelectorAll('#hojaDia .cjtb tr').length, total: (document.querySelector('#hojaDia .cjtb tr.t') || {}).textContent || '' }));
    await page.click('#hojaDia [data-a="cje-diak"][data-d="-1"]'); await page.waitForTimeout(100);
    const ayer = await page.evaluate(() => { const P = window.PG; return P.ui.cjeHoja.k === P.iso(P.addDays(new Date(), -1)); });
    await page.evaluate(() => { const P = window.PG; P.ui.cjeHoja = null; P.render(); });
    await page.click('#main [data-a="cje-tab"][data-v="sem"]'); await page.waitForTimeout(120);
    const sem = await page.evaluate(() => ({ filas: document.querySelectorAll('#main .cjwk').length, tipos: document.querySelectorAll('#main .cjwk .ty').length,
      prot: [...document.querySelectorAll('#main .cjwk .p')].filter((p) => /\d/.test(p.textContent)).length, sum: document.querySelectorAll('#main .cjsum > *').length }));
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia239; P.save(); P.ui.cjeHoja = null; P.ui.cjeTab = ''; P.ui.frPos = ''; P.ui.foodDate = ''; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('Hoy: «para hacer hoy» pide cocinar la tanda de hoy; lo apuntado manda (✓ azul «en vez de» el plan) y lo no apuntado sale en gris con ○',
      hoy.todo.some((t) => /Cocina Lentejas/.test(t)) && /otro/.test(hoy.comida.q) && hoy.comida.n === 'Comí fuera' && /en vez de Lentejas/.test(hoy.comida.pl) &&
      hoy.cena.q === 'cjq' && hoy.cena.plan, JSON.stringify(hoy));
    check('la hoja de una comida apunta la frase en ESA comida; «no he desayunado» la cierra; el total abre el día por comidas y ‹ va a ayer',
      /Cena/.test(titulo) && cena.p === 1 && cena.items === 1 && sinPlan && nada && dia.filas >= 6 && /Total/.test(dia.total) && ayer, JSON.stringify({ titulo, cena, sinPlan, nada, dia, ayer }));
    check('Semana: 7 días con su tipo de día y su proteína, y arriba cocinas · compra · proteína',
      sem.filas === 7 && sem.tipos === 7 && sem.prot >= 1 && sem.sum === 3, JSON.stringify(sem));
  }

  // 240) MANTENER PULSADO EN COMER (como un día del Mes): una comida abre «qué hacer» (apuntar, mover a
  // otra comida, cambiar el plato del plan, como fuera, quitar); un toque corto sigue abriendo su hoja;
  // un plato de la Semana abre su hoja; en el registro antiguo, la comida también, y lleva a Comer
  {
    const pulsa = (sel, ms) => page.evaluate(([s, ms]) => new Promise((r) => { const b = document.querySelector(s); if (!b) return r(false);
      const R = b.getBoundingClientRect(); b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: R.x + 8, clientY: R.y + 8, pointerType: 'touch' }));
      setTimeout(() => { document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); r(true); }, ms); }), [sel, ms]);
    await page.evaluate(() => { const P = window.PG; window.__copia240 = JSON.parse(JSON.stringify(P.store)); const k = P.iso(new Date());
      P.store.semBase = { on: true, d: {} }; P.store.food.log[k] = [];
      P.store.dishes.push({ id: 'd240', name: 'Tortilla con pavo', icon: '🍳', portions: 1, kcal: 420, prot: 32 });
      for (let i = 0; i < 7; i++) ['desayuno', 'comida', 'cena'].forEach((c) => P.sbPoner(i, c, 'd240'));
      P.addFoodEntry(k, { macro: { nombre: 'Macarrones con carne', kcal: 900, prot: 45 }, pos: 'cena' });
      P.ui.cjeHoja = null; P.ui.feVer = ''; P.ui.cjeTab = ''; P.ui.foodDate = ''; P.ui.tab = 'food'; P.ui.foodVista = 'eje'; P.save(); P.render(); });
    await pulsa('#main .cjmm:nth-child(3) .tx', 200); await page.waitForTimeout(100);
    const corto = await page.evaluate(() => window.PG.ui.cjeHoja);
    await page.evaluate(() => { window.PG.ui.cjeHoja = null; window.PG.render(); });
    await pulsa('#main .cjmm:nth-child(3) .tx', 750); await page.waitForTimeout(100);
    const acc = await page.evaluate(() => ({ h: window.PG.ui.cjeHoja, ops: [...document.querySelectorAll('#hojaDia .cjalt b')].map((b) => b.textContent), mover: document.querySelectorAll('#hojaDia [data-a="cje-mover"]').length }));
    await page.click('#hojaDia [data-a="cje-mover"][data-to="merienda"]'); await page.waitForTimeout(120);
    const movido = await page.evaluate(() => window.PG.foodLog(window.PG.iso(new Date())).map((e) => e.p).join());
    await page.click('#main [data-a="cje-tab"][data-v="sem"]'); await page.waitForTimeout(120);
    await pulsa('#main .cjwk:nth-child(2) .cjc', 750); await page.waitForTimeout(100);
    const plato = await page.evaluate(() => (window.PG.ui.cjeHoja || {}).v);
    await page.evaluate(() => { const P = window.PG; P.ui.cjeHoja = null; P.ui.cjeTab = ''; P.ui.foodVista = ''; P.render(); });
    await pulsa('#main .h2mom .t', 750); await page.waitForTimeout(100);
    const antiguo = await page.evaluate(() => ({ v: window.PG.ui.foodVista, h: (window.PG.ui.cjeHoja || {}).v }));
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia240; P.save(); P.ui.cjeHoja = null; P.ui.cjeTab = ''; P.ui.foodDate = ''; P.ui.foodVista = ''; P.ui.tab = 'hoy'; P.render(); });
    check('mantener pulsada una comida abre «qué hacer» (apuntar, mover, cambiar el plato, como fuera, quitar); el toque corto no',
      corto === null && acc.h && acc.h.v === 'acc' && acc.h.p === 'cena' && acc.mover === 4 &&
      ['Cambiar el plato', 'Como fuera', 'Quitar lo apuntado'].every((t) => acc.ops.includes(t)) && movido === 'merienda', JSON.stringify({ corto, acc, movido }));
    check('mantener pulsado un plato de la Semana abre su hoja, y una comida del registro antiguo lleva a Comer con «qué hacer»',
      plato === 'plato' && antiguo.v === 'eje' && antiguo.h === 'acc', JSON.stringify({ plato, antiguo }));
  }

  // 241) LA HOJA DEL DÍA (Mes) Y SUS MODOS: «Vacaciones desde aquí hasta…» entraba en un case de Dinero con
  // el mismo nombre (hoja-modo) y no hacía nada; ahora pone el modo de tocar el otro día. Y cerrar con
  // el fondo cierra la hoja y deja limpio lo suyo.
  {
    // la prueba anterior acaba con una pulsación larga: su «toque fantasma» se come durante 450 ms
    await page.waitForTimeout(500);
    await page.evaluate(() => { const P = window.PG; P.ui.tab = 'month'; P.ui.mesModo = null; P.ui.hojaDia = P.iso(new Date()); P.ui.hojaVista = ''; P.render(); });
    const hay = await page.$('#hojaDia [data-a="hoja-mesmodo"][data-m="vac"]');
    if (hay) { await hay.click(); await page.waitForTimeout(120); }
    const modo = await page.evaluate(() => ({ m: window.PG.ui.mesModo && window.PG.ui.mesModo.tipo, hoja: window.PG.ui.hojaDia, din: window.PG.ui.hojaModo || '' }));
    await page.evaluate(() => { const P = window.PG; P.ui.mesModo = null; P.ui.hojaDia = P.iso(new Date()); P.render(); });
    await page.evaluate(() => document.querySelector('#hojaDia .hscrim').click()); await page.waitForTimeout(100);
    const cerrada = await page.evaluate(() => ({ h: window.PG.ui.hojaDia, dom: !!document.querySelector('#hojaDia .hoja') }));
    await page.evaluate(() => { const P = window.PG; P.ui.mesModo = null; P.ui.tab = 'hoy'; P.render(); });
    check('«Vacaciones desde aquí…» de la hoja del día pone su modo (no el de Dinero) y el fondo cierra la hoja',
      !!hay && modo.m === 'vac' && !modo.hoja && modo.din === '' && cerrada.h === '' && !cerrada.dom, JSON.stringify({ hay: !!hay, modo, cerrada }));
  }

  // 242) HOY COMO RELOJ Y SEMANA CON RUTINA Y HÁBITOS: Hoy pinta el reloj de 24 h; un evento que cae en
  // una guardia se avisa y «quitar solo este día» lo salta ese día; Semana abre en «Agenda» con una
  // tarjeta por día (eventos, rutina del tipo de día, hábitos que tocan); un hábito marcado «no en
  // guardia» no toca ese día y no rompe la racha; la rutina se edita por tipo de día
  {
    const r = await page.evaluate(() => { const P = window.PG; window.__copia242 = JSON.parse(JSON.stringify(P.store));
      /* el próximo día de guardia (si no hay ninguno en 30 días, se deja la parte de choques sin probar) */
      let kg = null; for (let i = 0; i < 30; i++) { const k = P.iso(P.addDays(new Date(), i)); if (P.diaTipo(k) === 'guardia') { kg = k; break; } }
      P.store.habitos = { items: [{ id: 'h242', nombre: 'Estudio', icono: '📚', color: '#f59e0b', dow: [0, 1, 2, 3, 4, 5, 6], creado: '2026-01-01', noEn: ['guardia'], auto: '' }], registro: {} };
      if (kg) P.store.eventos.push({ id: 'ev242', titulo: 'Clase 242', hora: '19:00', fin: '20:00', modo: 'semanal', dow: [P.parseDate(kg).getDay()], on: true });
      P.save(); return { kg, toca: kg ? P.habitoToca(P.store.habitos.items[0], kg) : null, choque: kg ? P.hoyChoques(kg, P.dayInfo(kg)).map((x) => x.e.id) : [] }; });
    if (r.kg) await page.evaluate((kg) => { const P = window.PG; P.ui.tab = 'hoy'; P.ui.diaHoy = kg; P.render(); }, r.kg);
    else await page.evaluate(() => { const P = window.PG; P.ui.tab = 'hoy'; P.ui.diaHoy = ''; P.render(); });
    await page.waitForTimeout(150);
    const hoy = await page.evaluate(() => ({ reloj: !!document.querySelector('#main .hoyreloj svg path'), choque: !!document.querySelector('#main [data-a="ev-salta"]') }));
    if (hoy.choque) { await page.click('#main [data-a="ev-salta"]'); await page.waitForTimeout(120); }
    const saltado = await page.evaluate((kg) => !kg || window.PG.eventosS().find((e) => e.id === 'ev242').salta.includes(kg), r.kg);
    await page.evaluate(() => { const P = window.PG; P.ui.diaHoy = ''; P.ui.tab = 'week'; P.ui.semVista = ''; P.ui.semDesde = ''; P.render(); });
    await page.waitForTimeout(150);
    const sem = await page.evaluate(() => ({ tarjetas: document.querySelectorAll('#main .sdc').length, tira: document.querySelectorAll('#main .ssp').length,
      rutina: document.querySelectorAll('#main .sdc .sdr span').length, matriz: !!document.querySelector('#main .shm'), hoyHab: !!document.querySelector('#main .sdc.hoy .sdhb [data-a="hab-mark"]') }));
    const bh = await page.$('#main .sdc.hoy .sdhb [data-a="hab-mark"]'); if (bh) { await bh.click(); await page.waitForTimeout(100); }
    const marcado = await page.evaluate(() => { const P = window.PG, k = P.iso(new Date()); return !!(P.store.habitos.registro[k] || {}).h242; });
    await page.click('#main [data-a="sem-vista"][data-v="rutina"]'); await page.waitForTimeout(120);
    await page.click('#main [data-a="rut-tipo"][data-t="libre"]'); await page.waitForTimeout(80);
    await page.fill('#rutTxt', 'leer un rato'); await page.click('#main [data-a="rut-add"]'); await page.waitForTimeout(100);
    const rut = await page.evaluate(() => { const P = window.PG, n = P.normalize(JSON.parse(JSON.stringify(P.store)));
      return (n.rutinas.libre || []).some((a) => a.txt === 'leer un rato' && a.ico === '📚'); });
    await page.evaluate(() => { const P = window.PG; P.store = window.__copia242; P.save(); P.ui.semVista = ''; P.ui.rutTipo = ''; P.ui.tab = 'hoy'; P.ui.diaHoy = ''; P.render(); });
    check('Hoy pinta el reloj de 24 h, avisa del evento que cae en guardia y «quitar solo este día» lo salta ese día',
      hoy.reloj && (!r.kg || (r.choque.includes('ev242') && hoy.choque && saltado)), JSON.stringify({ r, hoy, saltado }));
    check('Semana abre en Agenda: tira de días, una tarjeta por día con su rutina, hábitos a un toque; «no en guardia» no toca ese día; la rutina se edita por tipo y se guarda',
      sem.tira === 7 && sem.tarjetas >= 7 && sem.rutina >= 7 && sem.matriz && marcado && (r.kg ? r.toca === false : true) && rut,
      JSON.stringify({ sem, marcado, toca: r.toca, rut }));
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
