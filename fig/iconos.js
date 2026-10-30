/* =====================================================================================
   Iconos vivos · dirección «La jornada» (fase 1, maqueta)
   ico(nombre, estado) → '<svg …>' en línea. Sin dependencias, sin build.
   - Rejilla 24, trazo 1,75, puntas y uniones redondas, currentColor para el trazo.
   - Rellenos suaves con var(--marca) / var(--acento) (siguen al tema solos).
   - El estado NO cambia el dibujo: se traduce en data-* y variables CSS (--nivel, --p…)
     que iconos.css mueve con transform / stroke-dashoffset / opacity.
   - ico.actualiza(svg, estado) cambia el estado de un icono ya pintado: es lo que hace
     que se mueva (las transiciones solo corren cuando el valor cambia de verdad).
   ===================================================================================== */
(function (raiz) {
  'use strict';

  let uid = 0;
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const r3 = v => Math.round(v * 1000) / 1000;
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  const P = (d, c, extra) => '<path d="' + d + '"' + (c ? ' class="' + c + '"' : '') + (extra || '') + '/>';
  const pct = v => Math.round(v * 100) + ' %';

  /* ---------- piezas reutilizables ---------- */
  // pétalo (hoja 4:20): de la base sale hacia el ángulo a (grados, 0 = arriba)
  function petalo(bx, by, a, largo, ancho) {
    const r = a * Math.PI / 180, sx = Math.sin(r), cy = -Math.cos(r);
    const tx = bx + sx * largo, ty = by + cy * largo;
    const mx = bx + sx * largo * 0.5, my = by + cy * largo * 0.5;
    const px = -cy * ancho, py = sx * ancho;
    return 'M' + r3(bx) + ' ' + r3(by) + 'Q' + r3(mx + px) + ' ' + r3(my + py) + ' ' + r3(tx) + ' ' + r3(ty) +
      'Q' + r3(mx - px) + ' ' + r3(my - py) + ' ' + r3(bx) + ' ' + r3(by) + 'Z';
  }
  // zona iluminada de la luna: f = 0 nueva … 1 llena (crece por la derecha)
  function lunaLuz(f) {
    const e = 8 * (1 - 2 * lim(f, 0, 1)) * 4 / 3, x = r3(12 + e);
    return 'M12 4A8 8 0 0 1 12 20C' + x + ' 20 ' + x + ' 4 12 4Z';
  }
  const CANDADO = '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/>' + P('M8 10.5V8a4 4 0 0 1 8 0v2.5M12 14.5v2.2');

  /* ---------- catálogo ----------
     label: texto por defecto (aria-label) · emoji: el que sustituye
     dibujo(e, id): el SVG interior (no depende de lo que se anima)
     vivo(e): {vars, data, label} → lo que cambia con el estado
     firma(e): si cambia, se vuelve a dibujar el interior (p. ej. el número del día)
     anim(e, antes): animaciones de un solo golpe al cambiar (moneda, página…)
     aplica(svg, e): ajustes en sitio que no caben en CSS (la luna) */
  const D = {
    /* ===== barra de secciones ===== */
    hoy: {
      label: 'Hoy', emoji: '🏠',
      dibujo: (e, id) =>
        '<clipPath id="' + id + 'c"><rect x="0" y="0" width="24" height="18"/></clipPath>' +
        P('M4 18A8 8 0 0 1 20 18', 'futuro') +
        P('M4 18A8 8 0 0 1 20 18', 'huella', ' pathLength="1"') +
        '<g clip-path="url(#' + id + 'c)"><g class="astro mv"><circle class="sol-hoy" cx="12" cy="10" r="3"/></g></g>' +
        P('M2.5 18h19M8 21h8'),
      vivo: e => {
        const h = num(e.hora, 13), p = lim((h - 7) / 15, 0, 1);
        return { vars: { p: r3(p) }, data: { noche: h < 7 || h >= 22 }, label: 'Hoy, ' + hhmm(h) };
      }
    },
    semana: {
      label: 'Semana', emoji: '📅',
      firma: e => String(lim(Math.round(num(e.dia, 3)), 0, 6)),
      dibujo: e => {
        const dia = lim(Math.round(num(e.dia, 3)), 0, 6), x = r3(7.4 + dia * 1.533);
        return '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/>' + P('M3.5 10h17M8 3v3.5M16 3v3.5') +
          '<rect class="sem-banda" x="6" y="12.6" width="12" height="4.4" rx="1.4"/>' +
          (dia > 0 ? '<rect class="sem-hecho" x="6" y="12.6" width="' + r3(x - 6) + '" height="4.4" rx="1.4"/>' : '') +
          '<circle class="sem-hoy" cx="' + x + '" cy="14.8" r="1.5"/>';
      },
      vivo: e => ({ label: 'Semana, ' + ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'][lim(Math.round(num(e.dia, 3)), 0, 6)] })
    },
    mes: {
      label: 'Mes', emoji: '🗓',
      dibujo: () => '<path class="s" d="M3.5 7.5A2.5 2.5 0 0 1 6 5h12a2.5 2.5 0 0 1 2.5 2.5V10h-17z"/>' +
        '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/>' + P('M3.5 10h17M8 3v3.5M16 3v3.5') +
        P('M8 13.6h.01M12 13.6h.01M16 13.6h.01M8 17.2h.01M12 17.2h.01', 'punto') + '<circle class="lleno-m" cx="16" cy="17.2" r="1.3"/>'
    },
    comer: {
      label: 'Comer', emoji: '🍽',
      dibujo: () => '<circle class="s" cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="5.7"/><circle cx="12" cy="12" r="3.2"/>' +
        P('M3 4v4.2a1.4 1.4 0 0 0 2.8 0V4M4.4 4v16') + P('M21 20V4c-1.6 1.1-2.6 3.2-2.6 6v2.6H21')
    },
    mancuerna: {
      label: 'Entreno', emoji: '🏋️',
      dibujo: () => '<rect class="s" x="5.6" y="6.5" width="3" height="11" rx="1"/><rect class="s" x="15.4" y="6.5" width="3" height="11" rx="1"/>' +
        '<rect x="5.6" y="6.5" width="3" height="11" rx="1"/><rect x="15.4" y="6.5" width="3" height="11" rx="1"/>' +
        P('M3 9.5v5M21 9.5v5M8.6 12h6.8'),
      anim: (e, a) => (e.series != null && a.series != null && e.series > a.series ? ['levanta'] : [])
    },
    luna: {
      label: 'Sueño', emoji: '😴',
      dibujo: e => '<path class="luz" d="' + lunaLuz(num(e.fase, 0.3)) + '" style="d:path(\'' + lunaLuz(num(e.fase, 0.3)) + '\')"/>' +
        '<circle class="sombra" cx="12" cy="12" r="8"/>' + P('M19.6 3.2v2.4M18.4 4.4h2.4', 'chispa'),
      firma: () => '',
      vivo: e => {
        const f = lim(num(e.fase, 0.3), 0, 1);
        return { vars: { fase: r3(f) }, data: { llena: f >= 0.9 }, label: e.horas != null ? 'Sueño, ' + e.horas + ' h' : 'Sueño, luna al ' + pct(f) };
      },
      aplica: (svg, e) => {
        const l = svg.querySelector('.luz'); if (!l) return;
        const d = lunaLuz(num(e.fase, 0.3));
        l.style.d = 'path("' + d + '")'; l.setAttribute('d', d);
      }
    },
    hucha: {
      label: 'Dinero', emoji: '💶',
      dibujo: (e, id) =>
        '<clipPath id="' + id + 'h"><ellipse cx="11" cy="13" rx="7.5" ry="5.3"/></clipPath>' +
        '<g class="cuerpo mv"><g clip-path="url(#' + id + 'h)"><rect class="ahorro mv" x="3" y="7.7" width="16" height="10.6"/></g>' +
        '<ellipse cx="11" cy="13" rx="7.5" ry="5.3"/>' +
        P('M18.4 11.3h1.2a1 1 0 0 1 1 1v1.4a1 1 0 0 1-1 1h-1.2M13.6 8.3l1.3-2.6 1.7 3.2M7 18v2.4M15 18v2.4M3.6 12.4c-1.3.1-1.7-1.2-.8-1.7M9.3 9.6h3.4') +
        P('M15.7 11.6h.01', 'ojo') + '</g>' +
        '<g class="moneda"><circle class="sa" cx="11" cy="4.2" r="1.9"/><circle cx="11" cy="4.2" r="1.9"/></g>',
      vivo: e => {
        const n = lim(num(e.nivel, 0.5), 0, 1);
        return { vars: { nivel: r3(n) }, label: 'Ahorro, ' + pct(n) + ' de la meta' };
      },
      anim: (e, a) => (num(e.nivel, 0) > num(a.nivel, 0) + 0.001 ? ['moneda'] : [])
    },
    planta: {
      label: 'Hábitos', emoji: '🌱',
      dibujo: () => {
        const hoja = (cls, d, ox, oy, lado) => '<g class="hj ' + cls + '" style="transform-origin:' + ox + 'px ' + oy + 'px;--lado:' + lado + '">' +
          '<path class="sa" d="' + d + '"/><path d="' + d + '"/></g>';
        return '<g class="tallo mv">' + P('M12 15V5.8', 'tronco') +
          hoja('h1', 'M12 13.2C9 13.4 7 11.8 6.6 9.2c2.8-.3 4.9 1.2 5.4 4z', 12, 13.2, -1) +
          hoja('h2', 'M12 11c3-.1 5-1.8 5.4-4.4-2.8-.3-4.9 1.3-5.4 4.4z', 12, 11, 1) +
          hoja('h3', 'M12 8.6c-2.2.1-3.6-1.1-3.9-3 2-.2 3.6.9 3.9 3z', 12, 8.6, -1) +
          hoja('h4', 'M12 6c-1.2-1.1-1.3-2.6-.1-4 1.3 1.2 1.3 2.8.1 4z', 12, 6, 1) +
          '</g>' + P('M6.5 15h11M7.6 15l1.1 5.5h6.6l1.1-5.5');
      },
      vivo: e => {
        const n = lim(num(e.nivel, 0.75), 0, 1), h = Math.round(n * 4);
        return { data: { hojas: h, mustia: !!e.mustia }, label: 'Hábitos, ' + h + ' de 4' + (e.mustia ? ', mustia: dos fallos seguidos' : '') };
      }
    },
    mas: {
      label: 'Más', emoji: '☰',
      dibujo: () => '<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/>' +
        '<rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect class="s" x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>'
    },
    ajustes: {
      label: 'Ajustes', emoji: '⚙️',
      dibujo: () => P('M3.5 7h3.7M11.3 7h9.2M3.5 12h9.2M16.8 12h3.7M3.5 17h1.7M9.3 17h11.2') +
        '<circle class="s" cx="9.25" cy="7" r="2.05"/><circle cx="9.25" cy="7" r="2.05"/><circle class="s" cx="14.75" cy="12" r="2.05"/><circle cx="14.75" cy="12" r="2.05"/>' +
        '<circle class="s" cx="7.25" cy="17" r="2.05"/><circle cx="7.25" cy="17" r="2.05"/>'
    },
    notas: {
      label: 'Notas', emoji: '📝',
      dibujo: () => '<path class="s" d="M14 3.5V8h4.5z"/>' +
        P('M6 3.5h8l4.5 4.5v12a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5zM14 3.5V8h4.5M8 12.5h8M8 16.5h5')
    },
    libro: {
      label: 'Estudio', emoji: '📚',
      dibujo: () => '<path class="s" d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5z"/>' +
        P('M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5zM12 6.5v13') +
        '<path class="pagina" d="M12 6.5c2-1.5 5-2 8-1.5v13c-3-.5-6 0-8 1.5z"/>',
      vivo: e => ({ label: e.minutos != null ? 'Estudio, ' + e.minutos + ' min hoy' : 'Estudio' }),
      anim: (e, a) => ((e.minutos != null && e.minutos !== a.minutos) || e.pasa ? ['pagina'] : [])
    },
    eventos: {
      label: 'Eventos', emoji: '📌',
      dibujo: () => '<path class="s" d="M9 3.5h6l-1 5 3.5 3v2H6.5v-2l3.5-3z"/>' + P('M9 3.5h6l-1 5 3.5 3v2H6.5v-2l3.5-3zM12 13.5V21')
    },
    hoja420: {
      label: '4:20', emoji: '🌿',
      dibujo: () => {
        const ps = [[0, 12, 1.9], [-42, 9.2, 1.6], [42, 9.2, 1.6], [-82, 6.4, 1.3], [82, 6.4, 1.3]]
          .map(p => petalo(12, 16, p[0], p[1], p[2])).join('');
        return '<g class="planta420 mv"><path class="sa" d="' + ps + '"/><path d="' + ps + '"/>' + P('M12 16v5') + '</g>' +
          '<g class="candado mv">' + CANDADO + '</g>';
      },
      vivo: e => ({ data: { discreto: !!e.discreto }, label: e.discreto ? 'Privado' : '4:20' })
    },

    /* ===== estados del día ===== */
    hecho: {
      label: 'Hecho', emoji: '✅',
      dibujo: () => '<circle class="aro-s" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/>' +
        P('M7.6 12.4l3 3 5.8-6.3', 'trazo', ' pathLength="1"'),
      vivo: e => { const on = e.on !== false; return { data: { on }, label: on ? 'Hecho' : 'Sin hacer' }; }
    },
    pendiente: {
      label: 'Pendiente', emoji: '⏳',
      dibujo: () => '<circle class="discont" cx="12" cy="12" r="9"/>' + P('M12 7.5V12l2.8 1.8')
    },
    aviso: {
      label: 'Aviso', emoji: '⚠️',
      dibujo: () => '<g class="tri"><path class="so" d="M10.3 4.5a2 2 0 0 1 3.4 0l7.6 13.2a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3z"/>' +
        P('M10.3 4.5a2 2 0 0 1 3.4 0l7.6 13.2a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3zM12 9.5v4.3M12 17v.2') + '</g>',
      vivo: e => ({ data: { alerta: !!e.alerta } }),
      anim: (e, a) => (e.alerta && !a.alerta ? ['sacude'] : [])
    },
    fonendo: {
      label: 'Guardia', emoji: '🩺',
      dibujo: () => P('M4.6 3H7M15 3h2.4M6 3v5a5 5 0 0 0 10 0V3M11 13v2a4.25 4.25 0 0 0 8.5 0v-1.6') +
        '<g class="pieza"><circle class="onda" cx="19.5" cy="11.2" r="2.2"/><circle class="sg" cx="19.5" cy="11.2" r="2.2"/><circle cx="19.5" cy="11.2" r="2.2"/></g>',
      vivo: e => ({ data: { guardia: !!e.guardia }, label: e.guardia ? 'Estás de guardia' : 'Guardia' })
    },
    saliente: {
      label: 'Saliente', emoji: '🚪',
      dibujo: () => '<path class="s" d="M5 5.5A1.5 1.5 0 0 1 6.5 4H12v16H6.5A1.5 1.5 0 0 1 5 18.5z"/>' +
        P('M13 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H13M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5')
    },
    libre: {
      label: 'Libre', emoji: '🛋',
      dibujo: () => '<path class="s" d="M6.5 13h11v3h-11z"/>' +
        P('M5.5 11V8.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2V11M3 13a1.8 1.8 0 0 1 3.5 0v3h11v-3a1.8 1.8 0 0 1 3.5 0v4.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM5.5 18.5v2M18.5 18.5v2')
    },
    vacaciones: {
      label: 'Vacaciones', emoji: '🏖',
      dibujo: () => '<path class="s" d="M3 11a9 8 0 0 1 18 0c-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0z"/>' +
        P('M3 11a9 8 0 0 1 18 0c-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0-1.5-1-3-1-4.5 0zM12 3v.2M12 11v8.5M3.5 20.5c1.4-.9 2.8-.9 4.2 0s2.8.9 4.2 0 2.8-.9 4.2 0 2.8.9 4.2 0')
    },

    /* ===== acciones ===== */
    anadir: { label: 'Añadir', emoji: '➕', dibujo: () => P('M12 5v14M5 12h14') },
    editar: { label: 'Editar', emoji: '✏️', dibujo: () => '<path class="s" d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>' + P('M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17zM14.5 7.5l3 3') },
    borrar: { label: 'Borrar', emoji: '🗑', dibujo: () => P('M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13M10 11v5M14 11v5') },
    buscar: { label: 'Buscar', emoji: '🔍', dibujo: () => '<circle class="s" cx="11" cy="11" r="6.5"/><circle cx="11" cy="11" r="6.5"/>' + P('M20 20l-4.3-4.3') },
    compartir: { label: 'Compartir', emoji: '📤', dibujo: () => P('M12 3.5v11M8 7.5l4-4 4 4M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12') },
    volver: { label: 'Volver', emoji: '‹', dibujo: () => P('M15 5l-7 7 7 7') },
    cerrar: { label: 'Cerrar', emoji: '×', dibujo: () => P('M6 6l12 12M18 6 6 18') },
    deshacer: { label: 'Deshacer', emoji: '↩️', dibujo: () => P('M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11') },

    /* ===== cosas del día ===== */
    cafe: {
      label: 'Café para llevar', emoji: '☕',
      dibujo: () => '<path class="s" d="M7.3 10.5h9.4l-.5 5H7.8z"/>' +
        P('M6 6.5h12M7 6.5l.6-2.8h8.8l.6 2.8M6.6 6.5l1.5 14h7.8l1.5-14M7.3 10.5h9.4M7.8 15.5h8.4')
    },
    taza: {
      label: 'Taza', emoji: '☕',
      dibujo: () => '<g class="vapor">' + P('M7.5 8c-.8-.9-.8-1.8 0-2.6s.8-1.8 0-2.6', 'v1') + P('M10.5 8c-.8-.9-.8-1.8 0-2.6s.8-1.8 0-2.6', 'v2') +
        P('M13.5 8c-.8-.9-.8-1.8 0-2.6s.8-1.8 0-2.6', 'v3') + '</g>' +
        '<path class="liquido mv" d="M4.2 10.2h11.6v2.2H4.2z"/>' +
        P('M4 10h12v5.5a4.5 4.5 0 0 1-4.5 4.5h-3A4.5 4.5 0 0 1 4 15.5zM16 11.5h1.4a2.6 2.6 0 0 1 0 5.2H16'),
      vivo: e => ({ data: { caliente: !!e.caliente }, label: e.caliente ? 'Café caliente' : 'Café frío' }),
      anim: (e, a) => (e.caliente && !a.caliente ? ['humo'] : [])
    },
    taper: {
      label: 'Táper', emoji: '🥡',
      dibujo: (e, id) => '<clipPath id="' + id + 't"><rect x="4.5" y="9" width="15" height="11" rx="2.5"/></clipPath>' +
        '<g clip-path="url(#' + id + 't)"><rect class="comida mv" x="4.5" y="9" width="15" height="11"/></g>' +
        P('M4.5 9v8.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V9M3.5 9V7.5A1.5 1.5 0 0 1 5 6h14a1.5 1.5 0 0 1 1.5 1.5V9zM8 9v2.5M16 9v2.5'),
      vivo: e => { const n = lim(num(e.nivel, 0.7), 0, 1); return { vars: { nivel: r3(n) }, label: n > 0 ? 'Táper preparado' : 'Táper vacío' }; }
    },
    plato: { label: 'Plato', emoji: '🍽', dibujo: () => '<circle class="s" cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/>' },
    ducha: {
      label: 'Ducha', emoji: '🚿',
      dibujo: () => '<path class="s" d="M9 10.5a5 5 0 0 1 10 0z"/>' +
        P('M5 21V7.5a3.5 3.5 0 0 1 3.5-3.5H14v1.5M9 10.5a5 5 0 0 1 10 0zM9.5 14v1.8M14 14v2.8M18.5 14v1.8M11.8 19.2v1.6M16.2 19.2v1.6')
    },
    vestir: {
      label: 'Vestirse', emoji: '👕',
      dibujo: () => '<path class="s" d="M8.5 4 3 6.5l1.8 4 2.7-1V20h9V9.5l2.7 1 1.8-4L15.5 4a3.5 3.5 0 0 1-7 0z"/>' +
        P('M8.5 4 3 6.5l1.8 4 2.7-1V20h9V9.5l2.7 1 1.8-4L15.5 4a3.5 3.5 0 0 1-7 0z')
    },
    cama: {
      label: 'Cama', emoji: '🛌',
      dibujo: () => '<path class="s" d="M10.5 11V9h8a2.5 2.5 0 0 1 2.5 2.5v.5z"/>' +
        P('M3 18v-7h18v7M3 11V6.5M21 18v2M3 18v2M10.5 11V9h8a2.5 2.5 0 0 1 2.5 2.5') + '<circle cx="7" cy="8.6" r="1.8"/>' +
        P('M14 2.5h3l-3 3.4h3', 'zz mv'),
      vivo: e => ({ data: { on: !!e.on }, label: e.on ? 'Durmiendo' : 'Cama' })
    },
    sol: {
      label: 'Sol', emoji: '☀️',
      dibujo: () => '<circle class="s" cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="4"/>' +
        P('M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8')
    },
    bus: {
      label: 'Autobús', emoji: '🚌',
      dibujo: () => '<path class="s" d="M5 10h14v-4.5A2.5 2.5 0 0 0 16.5 3h-9A2.5 2.5 0 0 0 5 5.5z"/>' +
        '<rect x="5" y="3" width="14" height="14.5" rx="2.5"/>' + P('M5 10h14M8.5 5.8h7M8 14h.01M16 14h.01M7.5 17.5v2.5M16.5 17.5v2.5')
    },
    taxi: {
      label: 'Taxi', emoji: '🚕',
      dibujo: () => '<rect class="sa" x="10" y="4.5" width="4" height="2.5" rx=".6"/>' +
        P('M10 7V4.5h4V7M4.5 12.5l1.4-3.8A2 2 0 0 1 7.8 7.3h8.4a2 2 0 0 1 1.9 1.4l1.4 3.8') +
        '<rect x="3.5" y="12.5" width="17" height="5" rx="1.6"/>' + P('M7 15h.01M17 15h.01M6.5 17.5V20M17.5 17.5V20')
    },
    bici: {
      label: 'Bici', emoji: '🚲',
      dibujo: () => '<circle cx="5.8" cy="15.6" r="3.6"/><circle cx="18.2" cy="15.6" r="3.6"/>' +
        P('M5.8 15.6 9.4 8.6l2.2 7H5.8M9.4 8.6h6.2l2.6 7M11.6 15.6l4-7M8 7.2h3M15.6 8.6l-.7-2.2h2.2')
    },
    calendario: {
      label: 'Día', emoji: '📆',
      firma: e => String(diaDe(e)),
      dibujo: e => '<path class="s" d="M3.5 7.5A2.5 2.5 0 0 1 6 5h12a2.5 2.5 0 0 1 2.5 2.5V9.5h-17z"/>' +
        '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/>' + P('M3.5 9.5h17M8 3v3.5M16 3v3.5') +
        '<text class="num" x="12" y="18.4" text-anchor="middle">' + diaDe(e) + '</text>',
      vivo: e => ({ label: 'Día ' + diaDe(e) }),
      anim: (e, a) => (a.dia != null && e.dia !== a.dia ? ['pasa'] : [])
    },
    reloj: {
      label: 'Reloj', emoji: '⏰',
      dibujo: () => '<circle class="s" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/>' +
        P('M12 12V7.4', 'aguja-h mv') + P('M12 12V5.2', 'aguja-m mv') + '<circle class="lleno" cx="12" cy="12" r="1.1"/>',
      vivo: e => {
        const h = num(e.hora, 10 + 10 / 60);
        // las agujas giran de forma continua (si pasa de 23:59 a 0:00 siguen hacia delante)
        return { vars: { ah: r3(h * 30) + 'deg', am: r3(h * 360) + 'deg' }, label: hhmm(h) };
      }
    },
    energia: {
      label: 'Energía', emoji: '🔋',
      dibujo: (e, id) => '<clipPath id="' + id + 'e"><rect x="7" y="4.5" width="10" height="16" rx="2.5"/></clipPath>' +
        '<g clip-path="url(#' + id + 'e)"><rect class="carga mv" x="7" y="4.5" width="10" height="16"/></g>' +
        '<rect x="7" y="4.5" width="10" height="16" rx="2.5"/>' + P('M10 2.5h4') + P('M12.9 7.6 10.4 12.6h3.3l-2.5 4.9', 'rayo'),
      vivo: e => {
        const n = lim(num(e.nivel, 0.65), 0, 1);
        return { vars: { nivel: r3(n) }, data: { bajo: n < 0.3 }, label: 'Energía, ' + pct(n) + (n < 0.3 ? ', baja' : '') };
      },
      anim: (e, a) => (a.nivel != null && (num(e.nivel, 1) < 0.3) !== (num(a.nivel, 1) < 0.3) ? ['cruce'] : [])
    },
    campana: {
      label: 'Avisos', emoji: '🔔',
      dibujo: () => '<g class="badajo-g">' + P('M18 16v-5a6 6 0 0 0-12 0v5l-1.5 2h15zM12 3v2') + P('M10 20.5a2 2 0 0 0 4 0') + '</g>' +
        '<circle class="punto-al" cx="18.4" cy="5.6" r="2.4"/>',
      vivo: e => ({ data: { alerta: !!e.alerta }, label: e.alerta ? 'Avisos: hay uno nuevo' : 'Avisos' }),
      anim: (e, a) => (e.alerta && !a.alerta ? ['campana'] : [])
    },
    carrito: {
      label: 'Compra', emoji: '🛒',
      dibujo: () => '<path class="s" d="M6.6 7.5H20l-2 7H8.1z"/>' + P('M3 4h2.4l2.4 10.5h10.3L20 7.5H6.6') +
        '<circle cx="9" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>'
    },
    camara: {
      label: 'Foto', emoji: '📷',
      dibujo: () => P('M3 8.5A2 2 0 0 1 5 6.5h2l1.5-2h7L17 6.5h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z') +
        '<circle class="s" cx="12" cy="13" r="3.5"/><circle cx="12" cy="13" r="3.5"/>'
    },
    candado: { label: 'Privado', emoji: '🔒', dibujo: () => '<rect class="s" x="5" y="10.5" width="14" height="10" rx="2.5"/>' + CANDADO },
    diana: {
      label: 'Meta', emoji: '🎯',
      dibujo: () => '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.3"/><circle class="lleno-a" cx="12" cy="12" r="2"/>'
    }
  };

  /* nombres de sección → icono */
  const ALIAS = { entreno: 'mancuerna', sueno: 'luna', 'sueño': 'luna', dinero: 'hucha', habitos: 'planta', 'hábitos': 'planta',
    estudio: 'libro', guardia: 'fonendo', '420': 'hoja420', consumo: 'hoja420', dia: 'calendario', energía: 'energia', compra: 'carrito' };

  function hhmm(h) { const t = ((h % 24) + 24) % 24, H = Math.floor(t), M = Math.round((t - H) * 60); return H + ':' + String(M % 60).padStart(2, '0'); }
  function diaDe(e) { return e && e.dia != null ? e.dia : new Date().getDate(); }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  function partes(n, e) {
    const d = D[n];
    const v = d.vivo ? d.vivo(e) : {};
    return { d, vars: v.vars || {}, data: v.data || {}, label: e.label || v.label || d.label };
  }
  function attrsData(data) {
    let s = '';
    for (const k in data) {
      const x = data[k];
      if (x === false || x == null) continue;
      s += ' data-' + k + '="' + (x === true ? '1' : esc(x)) + '"';
    }
    return s;
  }

  /* ---------- la función ---------- */
  function ico(nombre, estado) {
    const n = ALIAS[nombre] || nombre, e = estado || {};
    if (!D[n]) return '';
    const id = 'ic' + (++uid), p = partes(n, e), tam = e.tam || 24;
    const style = Object.keys(p.vars).map(k => '--' + k + ':' + p.vars[k]).join(';');
    const anim = (e.anim ? [].concat(e.anim) : []).concat(n === 'campana' && e.nuevo ? ['campana'] : []);
    const guardar = Object.assign({}, e); delete guardar.label; delete guardar.tam; delete guardar.anim; delete guardar.nuevo;
    return '<svg class="ico' + (e.clase ? ' ' + e.clase : '') + '" data-ico="' + n + '" data-uid="' + id + '" viewBox="0 0 24 24" width="' + tam + '" height="' + tam + '"' +
      ' fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"' +
      (e.decorativo ? ' aria-hidden="true"' : ' role="img" aria-label="' + esc(p.label) + '"') +
      (style ? ' style="' + style + '"' : '') + attrsData(p.data) +
      (anim.length ? ' data-anim="' + anim.join(' ') + '"' : '') +
      (p.d.firma ? ' data-firma="' + esc(p.d.firma(e)) + '"' : '') +
      " data-estado='" + esc(JSON.stringify(guardar)).replace(/'/g, '&#39;') + "'>" +
      p.d.dibujo(e, id) + '</svg>';
  }

  /* Cambia el estado de un icono ya pintado (aquí es donde se mueve). */
  ico.actualiza = function (svg, estado) {
    if (!svg) return;
    const n = svg.getAttribute('data-ico'), d = D[n]; if (!d) return;
    let antes = {}; try { antes = JSON.parse(svg.getAttribute('data-estado') || '{}'); } catch (_) {}
    const e = Object.assign({}, antes, estado || {});
    const p = partes(n, e);
    for (const k in p.vars) svg.style.setProperty('--' + k, p.vars[k]);
    // los data-* que pone el estado: se quitan los que ya no tocan
    const viejo = (d.vivo ? d.vivo(antes).data : null) || {};
    for (const k in viejo) if (!(k in p.data) || p.data[k] === false || p.data[k] == null) svg.removeAttribute('data-' + k);
    for (const k in p.data) {
      const x = p.data[k];
      if (x === false || x == null) svg.removeAttribute('data-' + k); else svg.setAttribute('data-' + k, x === true ? '1' : x);
    }
    if (d.firma) {
      const f = d.firma(e);
      if (f !== svg.getAttribute('data-firma')) { svg.innerHTML = d.dibujo(e, svg.getAttribute('data-uid') || ('ic' + (++uid))); svg.setAttribute('data-firma', f); }
    }
    if (d.aplica) d.aplica(svg, e);
    if (!svg.hasAttribute('aria-hidden')) svg.setAttribute('aria-label', p.label);
    const an = (d.anim ? d.anim(e, antes) : []).concat(estado && estado.anim ? [].concat(estado.anim) : []);
    const guardar = Object.assign({}, e); delete guardar.label; delete guardar.tam; delete guardar.anim; delete guardar.nuevo; delete guardar.pasa;
    svg.setAttribute('data-estado', JSON.stringify(guardar));
    if (an.length) {
      // volver a lanzar la animación de un golpe aunque sea la misma de antes
      svg.removeAttribute('data-anim'); void svg.getBoundingClientRect();
      svg.setAttribute('data-anim', an.join(' '));
      clearTimeout(svg._icoT); svg._icoT = setTimeout(() => svg.removeAttribute('data-anim'), 1600);
    }
  };

  /* Para pintar listas de golpe: actualiza todos los iconos de un contenedor que tengan un estado nuevo. */
  ico.nombres = Object.keys(D);
  ico.emoji = n => (D[ALIAS[n] || n] || {}).emoji || '';
  ico.etiqueta = n => (D[ALIAS[n] || n] || {}).label || '';
  ico.ALIAS = ALIAS;

  raiz.ico = ico;
  if (typeof module !== 'undefined' && module.exports) module.exports = ico;
})(typeof window !== 'undefined' ? window : globalThis);
