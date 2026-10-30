  // SIEMBRA (trozo que empieza en la 70): lo que las pruebas 1-69 dejan puesto y las de después dan por hecho —la
  // jornada de 8 a 15, los tipos de guardia con relevo a las 08:00, el ritmo de los días de trabajo, la rotación por
  // fechas, el objetivo de comida y un plato en el menú—. Lo pone tools/pruebas-reparto.py al arrancar el trozo; en la suite en fila no se usa.
  await page.setViewportSize({ width: 412, height: 915 });   // el móvil del usuario, como lo dejan las de antes
  await page.evaluate(() => {
    const P = window.PG, s = P.store, sh = (id) => s.shifts.find((x) => x.id === id);
    sh('sh-t').start = '08:00'; sh('sh-t').end = '15:00'; sh('sh-f').end = '08:00';
    s.rhythm['sh-t'].wake = '06:50'; s.rhythm['sh-f'].wake = '06:50';
    const r = s.rotation; r.mode = 'date'; r.jornada.start = '08:00'; r.jornada.end = '15:00';
    r.guardiaTipos.forEach((g) => { g.relevoSem = '08:00'; });
    s.food.objetivo.kcal = 2400; s.food.objetivo.prot = 150;
    s.food.pref = { horno: false, noCocinar: ['guardia', 'saliente', 'entreno'], taper: 3, desayunos: [], salNoCoc: 1 };
    // la primera toma del primer tipo de día lleva un plato (la 47g): de ahí sale la compra de la semana
    const sl = P.slotsFor(s.shifts[0].id)[0]; sl.mealId = ''; sl.items = [{ id: s.dishes[0].id, portions: 1 }];

    // los platos que dejan las de antes, en el mismo orden (el menú automático desempata por orden): «Pollo al limón»
    // (44), el del hospital, el desayuno del súper (47e) y «Pollo con arroz y brócoli» (62); y el nombre largo de la 47g
    s.dishes[0].name = 'Lentejas estofadas de la abuela con chorizo y morcilla';
    s.dishes.push({"id": "d-a957d2", "name": "Pollo al limón en 15 min", "icon": "🍗", "batchId": "b1", "portions": 4, "kcal": 290, "prot": 35.6, "ingredients": ["600 g pechuga de pollo", "2 limones", "200 ml nata de cocinar", "sal y pimienta"], "steps": ["Salpimenta el pollo en tiras y dóralo 5 min a fuego fuerte.", "Añade el ajo picado y el zumo de los limones, 2 min."], "alims": [{"id": "al-pechuga-de-pollo", "g": 600}, {"id": "al-limon", "g": 200}, {"id": "al-nata-para-cocinar", "g": 200}, {"id": "al-sal", "g": 1}], "sinCasar": [], "alimsV": 1, "carb": 6.7, "fat": 13.1});
    s.menu[s.shifts[0].id].push({ id: 'sl-6a2gp8', time: '', label: 'Pollo al limón en 15 min', items: [{ kind: 'dish', id: 'd-a957d2', portions: 1 }] });   // la 44 lo pone en el menú
    P.dishHospital();
    s.dishes.push({"id": "d-tost", "name": "Yogur griego del súper", "icon": "🥑", "portions": 2, "kcal": 198, "prot": 4.1, "batchId": "", "ingredients": [], "alims": [{"id": "al-pan-de-centeno", "g": 60}, {"id": "al-aguacate", "g": 150}], "sinCasar": [], "alimsV": 1, "carb": 20.8, "fat": 12.3});
    s.dishes.push({"id": "d-c7i8fk", "name": "Pollo con arroz y brócoli", "icon": "🍲", "portions": 2, "kcal": 294, "prot": 19, "carb": 38.2, "fat": 7.2, "alims": [{"id": "al-pechuga-de-pollo", "g": 120}, {"id": "al-arroz-blanco", "g": 80}, {"id": "al-brocoli", "g": 200}, {"id": "al-aceite-de-oliva", "g": 10}], "ingredients": ["120 g pechuga de pollo", "80 g arroz blanco", "200 g brócoli", "10 g aceite de oliva"], "sinCasar": [], "alimsV": 1, "steps": []});
    P.save(); P.render();
  });
